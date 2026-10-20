import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import type { Page } from '@playwright/test';
import { dayMerges } from '../../src/model.ts';
import { createGame, reduceGame } from '../../src/engine.ts';
import type { GameState, NightReport } from '../../src/model.ts';
import { act, checkpoint, data, quest, replaceSave, saved, start, supplies, supply, ticket, tile, toast, validate } from './support.ts';

// A new game has two Flours at 13 and 14, a Corn cob at 22, and Elderflowers at 27.
const report = (values: Partial<NightReport> = {}): NightReport => ({ day: 2, upkeep: 10, rat: 'soricescu', taken: [], trapped: null, gift: null, purse: 30, seen: true, ...values });
/** A new game one merge before the closing of day 3. */
const lateEvening = (values: Partial<GameState> = {}): GameState => ({ ...createGame(data, 4), coins: 30, clock: { day: 3, merges: dayMerges(data) - 1 }, night: report(), ...values });
/** The merge of the two Flours: on a late evening, it closes the day. */
async function mergeFlour(page: Page) { await tile(page, 13).click(); await tile(page, 14).click(); }
/** After preparation 8, Vlad has tonight's booked ticket with every dish on the board, and Elisabeta's quest has a ticket too. */
function bookedEvening(): GameState {
  let state = act(checkpoint(7, { ready: true }), { type: 'task' });
  // The booked guests come last in their window: the quests before them are delivered, and both take tickets.
  for (const id of ['mara-table', 'ileana-fitting', 'mara-candles']) state = act(supply(state, supplies(quest(id))), { type: 'deliverQuest', id });
  return supply(state, supplies(quest('vlad-after-dark')));
}

test('the clock shows the day and the time, and a merge moves it', async ({ page }) => {
  await start(page, createGame(data, 1));
  await expect(page.locator('#day-clock')).toHaveText('Day 1 · 07:00');
  await mergeFlour(page);
  await expect(page.locator('#day-clock')).toHaveText('Day 1 · 07:06');
  expect((await saved(page)).clock).toEqual({ day: 1, merges: 1 });
});

test('a purse below zero shows a debt with a minus sign', async ({ page }) => {
  await start(page, { ...createGame(data, 1), coins: -12 });
  await expect(page.locator('#coins')).toHaveText('−12');
  await expect(page.locator('#coin-total')).toHaveText('A debt of 12 coins');
});

test('tonight’s booked ticket lights the lanterns, and the other booked ticket waits for another evening', async ({ page }) => {
  await start(page, bookedEvening());
  const vlad = ticket(page, quest('vlad-after-dark')), elisabeta = ticket(page, quest('elisabeta-papers'));
  await expect(vlad.locator('.ticket-booking')).toHaveText('Booked for 20:00');
  await expect(elisabeta.locator('.ticket-booking')).toHaveText('Booked for another evening');
  await expect(elisabeta.getByRole('button', { name: 'The estate papers: booked for another evening' })).toBeDisabled();
  const lanterns = vlad.getByRole('button', { name: 'Light the lanterns: Vlad is booked for 20:00' });
  await expect(lanterns).toBeEnabled();
  await lanterns.click();
  await expect(page.locator('#day-clock')).toHaveText('Day 1 · 20:00');
  await vlad.getByRole('button', { name: /^Deliver Dinner after dark/ }).click();
  await expect(toast(page)).toContainText('Dinner after dark: delivered.');
  expect((await saved(page)).evening).toEqual({ guest: 'vlad', last: null, delivered: true });
  await expect(ticket(page, quest('vlad-guest')).locator('.ticket-booking')).toHaveText('Booked for another evening');
});

test('the closing plays the night over the room and the board, then reports the theft and the rat hole', async ({ page }) => {
  await start(page, lateEvening());
  await mergeFlour(page);
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  await expect(page.locator('.night-rat .rat-thief')).toHaveCount(1);
  await expect(page.locator('#room-frame .room-rat.rat-thief')).toHaveCount(1);
  await expect(toast(page)).toHaveText('Day 3 is over. The upkeep took 10 coins. The thief rat dropped the Corn cob into a new rat hole. The purse holds 20 coins.', { timeout: 8000 });
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect(page.locator('.night-layer')).toHaveCount(0);
  await expect(tile(page, 22)).toHaveClass(/rat-hole/);
  await expect(page.locator('#day-clock')).toHaveText('Day 4 · 07:00');
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
});

test('Șoricescu puts down his gift in the night, and the notice names the new dish', async ({ page }) => {
  const state = lateEvening();
  state.board[22] = null;
  await start(page, state);
  await mergeFlour(page);
  await expect(page.locator('.night-rat .rat-soricescu')).toHaveCount(1);
  await expect(tile(page, 30)).toHaveClass(/night-hidden/);
  await expect(toast(page)).toHaveText('Day 3 is over. The upkeep took 10 coins. Șoricescu lifted his hat and left Pogăcele as a gift. Pogăcele is a new dish! It is in the recipe book now. The purse holds 20 coins.', { timeout: 8000 });
  await expect(tile(page, 30)).not.toHaveClass(/night-hidden/);
});

test('a rat hole shows its trapped ingredient above the hole painting', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, lateEvening()); await mergeFlour(page);
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
  const hole = tile(page, 22);
  await expect(hole).toHaveClass(/rat-hole/);
  await expect(hole).toHaveAccessibleName(/blocked Corn cob/);
  await hole.locator('.food image').evaluate(async node => {
    const image = new Image(); image.src = node.getAttribute('href')!; await image.decode();
  });
  const shown = await sharp(await hole.screenshot({ animations: 'disabled' })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  await hole.locator('.food').evaluate(node => { (node as SVGElement).style.visibility = 'hidden'; });
  const hidden = await sharp(await hole.screenshot({ animations: 'disabled' })).removeAlpha().raw().toBuffer();
  let changed = 0;
  for (let offset = 0; offset < hidden.length; offset += 3) {
    if ([0, 1, 2].some(channel => Math.abs(shown.data[offset + channel] - hidden[offset + channel]) > 10)) changed++;
  }
  expect(changed / (shown.info.width * shown.info.height), 'the trapped food must visibly cover part of its tile').toBeGreaterThan(.05);
});

test('a tap or a key ends the night at once, and that input does nothing else', async ({ page }) => {
  await start(page, lateEvening());
  await mergeFlour(page);
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  await page.mouse.click(10, 10);
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect(page.locator('.night-rat')).toHaveCount(0);
  await expect(toast(page)).toContainText('Day 3 is over.');
  await expect(page.locator('#modal')).not.toBeVisible();
  // The key that ends a second night reaches no control.
  const second = lateEvening({ coins: 50 });
  await page.evaluate(([key, text]) => localStorage.setItem(key, text), ['scary-snacks-save-v13', JSON.stringify({ format: 'scary-snacks', version: 13, state: second })]);
  await page.reload(); await expect(page.locator('#board button')).toHaveCount(42);
  await mergeFlour(page);
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect(tile(page, 14)).toHaveAttribute('aria-pressed', 'true');
});

test('with reduced motion or a hidden page, the notice shows at once without the night', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, lateEvening());
  await mergeFlour(page);
  await expect(toast(page)).toContainText('Day 3 is over.');
  await expect(page.locator('.night-layer')).toHaveCount(0);
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(([key, text]) => localStorage.setItem(key, text), ['scary-snacks-save-v13', JSON.stringify({ format: 'scary-snacks', version: 13, state: lateEvening({ coins: 50 }) })]);
  await page.reload(); await expect(page.locator('#board button')).toHaveCount(42);
  await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }));
  await mergeFlour(page);
  await expect(toast(page)).toContainText('Day 3 is over.');
  await expect(page.locator('.night-layer')).toHaveCount(0);
});

test('holding the key that ends the night cannot act until that key is released', async ({ page }) => {
  await start(page, lateEvening()); await mergeFlour(page);
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  await page.keyboard.down('Enter');
  await expect(page.locator('.night-layer')).toHaveCount(0);
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
  const before = await saved(page);
  await page.keyboard.down('Enter'); await page.keyboard.down('Enter');
  await expect(tile(page, 14)).toHaveAttribute('aria-pressed', 'true');
  expect(await saved(page)).toEqual(before);
  await page.keyboard.up('Enter'); await page.keyboard.press('Enter');
  await expect(tile(page, 14)).toHaveAttribute('aria-pressed', 'false');
});

test('switching the device to reduced motion ends a running night at once', async ({ page }) => {
  await start(page, lateEvening()); await mergeFlour(page);
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.night-layer')).toHaveCount(0, { timeout: 1000 });
  await expect(page.locator('.room-rat')).toHaveCount(0);
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect(toast(page)).toContainText('Day 3 is over.');
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
});

for (const width of [320, 360, 390, 411, 720, 721, 1024, 1280, 1440, 1600, 1920]) test(`the masthead separates the title, clock, and purse at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await start(page, createGame(data, 1));
  for (const [day, coins] of [[23, 999], [9999, -9999], [1_000_000_000, -1_000_000_000]]) {
    const state = { ...createGame(data, 1), coins, clock: { day, merges: 0 }, night: report({ day: day - 1, purse: coins }) };
    await replaceSave(page, state); await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#day-clock')).toHaveAttribute('aria-label', `Day ${day.toLocaleString('en')}, 07:00`);
    const bounds = await page.evaluate(() => {
      const title = Math.max(...[...document.querySelectorAll<HTMLElement>('.wordmark,.tagline')].filter(node => node.checkVisibility()).map(node => node.getBoundingClientRect().right));
      const controls = document.querySelector('.header-controls')!.getBoundingClientRect();
      const clock = document.querySelector('#day-clock')!.getBoundingClientRect(), coins = document.querySelector('#coin-count')!.getBoundingClientRect();
      return { title, controls: controls.left, right: controls.right, separate: clock.right <= coins.left || clock.bottom <= coins.top };
    });
    expect(bounds.title).toBeLessThanOrEqual(bounds.controls);
    expect(bounds.right).toBeLessThanOrEqual(width);
    expect(bounds.separate).toBe(true);
  }
});

const unreported = [
  ['a theft with three open rat holes and a debt', report({ rat: 'thief', taken: [{ item: 'grain_1', position: 2 }, { item: 'grain_1', position: 3 }], trapped: null, purse: -14 }),
    'The thief rat took 2 Flour. Three rat holes are open, so it made no new one. Mara writes the debt pe caiet: the shop notebook holds a debt of 14 coins.'],
  ['a visit without room for a gift', report({ gift: null }), 'Șoricescu found no room for his gift. He needs 5 free spaces. The purse holds 30 coins.'],
] as const;
for (const [name, night, words] of unreported) test(`after a reload, the notice of ${name} shows once, without the night`, async ({ page }) => {
  const state: GameState = { ...createGame(data, 1), clock: { day: 3, merges: 0 }, night: { ...night, seen: false }, coins: night.purse };
  expect(validate(state)).toBe(true);
  await start(page, state);
  await expect(toast(page)).toContainText(words);
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
  await page.reload(); await expect(page.locator('#board button')).toHaveCount(42);
  await page.waitForTimeout(500);
  await expect(toast(page)).toHaveCount(0);
});

test('after the supper, the supper card gives the result of act 1, also with a debt', async ({ page }) => {
  const supper = data.quests.find(value => value.finale)!;
  const finished = supply({ ...checkpoint(data.tasks.length), coins: 0, clock: { day: 22, merges: 10 }, night: report({ day: 21 }) }, supplies(supper));
  const served = reduceGame(finished, { type: 'deliverQuest', id: supper.id }, data).state;
  await start(page, { ...served, coins: -40, act1: { days: 22, purse: -40 }, pendingScenes: [] });
  await expect(page.locator('#story .act-result')).toHaveText('The bistro worked for 22 days. The shop notebook holds a debt of 40 coins.');
});
