import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import type { Page } from '@playwright/test';
import { dayMerges } from '../../src/model.ts';
import { createGame, reduceGame } from '../../src/engine.ts';
import type { GameState, NightReport } from '../../src/model.ts';
import { act, supper, checkpoint, data, dialogDeliver, KEY, mergeFlour, opened, openQuest, options, quest, replaceSave, saved, serialize, start, supplies, supply, svgImageSizes, ticket, tile, toast, validate } from './support.ts';

// A new game has two Flours at 13 and 14, a Corn cob at 22, and Elderflowers at 27.
const report = (values: Partial<NightReport> = {}): NightReport => ({ day: 2, upkeep: 10, rat: 'soricescu', taken: [], trapped: null, gift: null, purse: 30, seen: true, ...values });
/** A new game one merge before the closing of day 3. */
const lateEvening = (values: Partial<GameState> = {}): GameState => ({ ...createGame(data, 4), coins: 30, clock: { day: 3, merges: dayMerges(data) - 1 }, night: report(), ...values });
const closing = (page: Page) => page.getByRole('dialog', { name: 'Closing time', exact: true });
/** The morning dialog after the closing of day 3. */
const morning = (page: Page) => page.getByRole('dialog', { name: 'Morning of day 4', exact: true });
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

for(const width of [1440,390])test(`tonight’s booked ticket lights the lanterns, and the other booked ticket waits for another evening at ${width}px`, async ({ page }) => {
  await page.setViewportSize({width,height:900});
  await start(page, bookedEvening());
  const vlad = ticket(page, quest('vlad-after-dark')), elisabeta = ticket(page, quest('elisabeta-papers'));
  await expect(vlad.locator('.ticket-booking')).toHaveText('Booked for 20:00');
  await expect(elisabeta.locator('.ticket-booking')).toHaveText('Booked for another evening');
  if(width<1024)await openQuest(page,quest('elisabeta-papers'));
  await expect((width<1024?page.locator('#modal'):elisabeta).getByRole('button', { name: 'The estate papers: booked for another evening' })).toBeDisabled();
  if(width<1024){await page.keyboard.press('Escape');await openQuest(page,quest('vlad-after-dark'));}
  const lanterns = (width<1024?page.locator('#modal'):vlad).getByRole('button', { name: 'Light the lanterns: Vlad is booked for 20:00' });
  await expect(lanterns).toBeEnabled();
  await lanterns.click();
  await expect(page.locator('#day-clock')).toHaveText('Day 1 · 20:00');
  if(width<1024){await openQuest(page,quest('vlad-after-dark'));await dialogDeliver(page,quest('vlad-after-dark')).click();}
  else await vlad.getByRole('button', { name: /^Deliver Dinner after dark/ }).click();
  await expect(toast(page)).toContainText('Dinner after dark: delivered.');
  expect((await saved(page)).evening).toEqual({ guest: 'vlad', last: null, delivered: true });
  await expect(ticket(page, quest('vlad-guest')).locator('.ticket-booking')).toHaveText('Booked for another evening');
});

test('the closing dialog shows the board before the night, and watching plays the room and then the board before the morning report', async ({ page }) => {
  await start(page, lateEvening());
  await mergeFlour(page);
  const dialog = closing(page);
  await expect(dialog).toContainText('Day 3 is over.');
  await expect(dialog.getByRole('button', { name: 'Skip', exact: true })).toBeVisible();
  // Until the player chooses, the Corn cob stays drawn where the rat hole will be.
  await expect(tile(page, 22)).toHaveClass(/night-hidden/);
  await expect(tile(page, 22).locator('.night-ghost')).toBeVisible();
  await dialog.getByRole('button', { name: 'Watch the night' }).click();
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  await expect(page.locator('#room-frame .room-rat.rat-thief')).toHaveCount(1);
  await expect(page.locator('.night-rat .rat-thief')).toHaveCount(1, { timeout: 4000 });
  await expect(page.locator('#room-frame .room-rat')).toHaveCount(0);
  await expect(morning(page)).toContainText('The upkeep took 10 coins. The thief rat dropped the Corn cob into a new rat hole. The purse holds 20 coins.', { timeout: 8000 });
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect(page.locator('.night-layer')).toHaveCount(0);
  await expect(tile(page, 22)).toHaveClass(/rat-hole/);
  await expect(page.locator('.night-ghost')).toHaveCount(0);
  await expect(page.locator('#day-clock')).toHaveText('Day 4 · 07:00');
  expect((await saved(page)).night!.seen).toBe(false);
  await morning(page).getByRole('button', { name: 'Open the bistro' }).click();
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
});

test('Șoricescu puts down his gift in the night, and the morning dialog names the new dish', async ({ page }) => {
  const state = lateEvening();
  state.board[22] = null;
  await start(page, state);
  await mergeFlour(page);
  await expect(tile(page, 30)).toHaveClass(/night-hidden/);
  await closing(page).getByRole('button', { name: 'Watch the night' }).click();
  await expect(page.locator('.night-rat .rat-soricescu')).toHaveCount(1, { timeout: 4000 });
  await expect(morning(page)).toContainText('The upkeep took 10 coins. Șoricescu lifted his hat and left Pogăcele as a gift. Pogăcele is a new dish! It is in the recipe book now. The purse holds 20 coins.', { timeout: 8000 });
  await expect(tile(page, 30)).not.toHaveClass(/night-hidden/);
});

test('Skip opens the morning dialog at once, and Escape on the closing dialog watches the night', async ({ page }) => {
  await start(page, lateEvening());
  await mergeFlour(page);
  await closing(page).getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(morning(page)).toContainText('The thief rat dropped the Corn cob into a new rat hole.');
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect(page.locator('.night-layer')).toHaveCount(0);
  await expect(page.locator('.night-ghost')).toHaveCount(0);
  await expect(tile(page, 22)).not.toHaveClass(/night-hidden/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).not.toBeVisible();
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
  await replaceSave(page, lateEvening({ coins: 50 }));
  await mergeFlour(page);
  await expect(closing(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
});

test('no tap or key ends a watched night, and that input does nothing', async ({ page }) => {
  await start(page, lateEvening());
  await mergeFlour(page);
  await closing(page).getByRole('button', { name: 'Watch the night' }).click();
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  const before = await saved(page);
  await page.mouse.click(10, 10); await tile(page, 0).click({ force: true });
  for (const key of ['Escape', 'Enter', 'Space', 'Tab']) await page.keyboard.press(key);
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  await expect(page.locator('.night-layer')).toHaveCount(1);
  expect(await saved(page)).toEqual(before);
  await expect(morning(page)).toBeVisible({ timeout: 8000 });
  await expect(tile(page, 14)).toHaveAttribute('aria-pressed', 'true');
});

test('on a phone, the drawer lowers for the rat of the room and rises for the rats on the board', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, lateEvening());
  await mergeFlour(page);
  await closing(page).getByRole('button', { name: 'Watch the night' }).click();
  await expect(page.locator('.game-layout')).toHaveClass(/lowered/);
  await expect(page.locator('#room-frame .room-rat')).toBeInViewport();
  await expect(page.locator('.night-rat')).toHaveCount(1, { timeout: 4000 });
  await expect(page.locator('.game-layout')).not.toHaveClass(/lowered/);
  await expect(page.locator('.night-rat')).toBeInViewport();
  await expect(morning(page)).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.game-layout')).not.toHaveClass(/lowered/);
});

test('a rat hole shows its trapped ingredient above the hole painting', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, lateEvening()); await mergeFlour(page);
  await morning(page).getByRole('button', { name: 'Open the bistro' }).click();
  const hole = tile(page, 22);
  await expect(hole).toHaveClass(/rat-hole/);
  await expect(hole).toHaveAccessibleName(/blocked Corn cob/);
  expect(await svgImageSizes(hole.locator('.food image'))).toHaveLength(1);
  const shown = await sharp(await hole.screenshot({ animations: 'disabled' })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  await hole.locator('.food').evaluate(node => { (node as SVGElement).style.visibility = 'hidden'; });
  const hidden = await sharp(await hole.screenshot({ animations: 'disabled' })).removeAlpha().raw().toBuffer();
  let changed = 0;
  for (let offset = 0; offset < hidden.length; offset += 3) {
    if ([0, 1, 2].some(channel => Math.abs(shown.data[offset + channel] - hidden[offset + channel]) > 10)) changed++;
  }
  expect(changed / (shown.info.width * shown.info.height), 'the trapped food must visibly cover part of its tile').toBeGreaterThan(.05);
});

test('with reduced motion or a hidden page, the morning dialog opens at once without the closing dialog or the night', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, lateEvening());
  await mergeFlour(page);
  await expect(morning(page)).toContainText('The upkeep took 10 coins.');
  await expect(page.locator('.night-layer')).toHaveCount(0);
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await replaceSave(page, lateEvening({ coins: 50 }));
  await page.evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }));
  await mergeFlour(page);
  await expect(morning(page)).toContainText('The upkeep took 10 coins.');
  await expect(page.locator('.night-layer')).toHaveCount(0);
});

test('switching the device to reduced motion ends a running night at once and opens the morning dialog', async ({ page }) => {
  await start(page, lateEvening()); await mergeFlour(page);
  await closing(page).getByRole('button', { name: 'Watch the night' }).click();
  await expect(page.locator('#room-frame')).toHaveClass(/night/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.night-layer')).toHaveCount(0, { timeout: 1000 });
  await expect(page.locator('.room-rat')).toHaveCount(0);
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect(morning(page)).toContainText('The upkeep took 10 coins.');
});

for (const watching of [false, true]) test(`hiding the page ${watching ? 'during a watched night' : 'at closing time'} opens the morning report`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, lateEvening()); await mergeFlour(page);
  if (watching) {
    await closing(page).getByRole('button', { name: 'Watch the night' }).click();
    await expect(page.locator('.game-layout')).toHaveClass(/lowered/);
  }
  const before = await saved(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(morning(page)).toContainText('The thief rat dropped the Corn cob into a new rat hole.');
  await expect(page.locator('.night-layer,.room-rat,.night-ghost')).toHaveCount(0);
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await expect(page.locator('.game-layout')).not.toHaveClass(/lowered/);
  expect(await saved(page)).toEqual(before);
  await morning(page).getByRole('button', { name: 'Open the bistro' }).click();
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
});

test('a queued closing-dialog event does not mark an open morning report as seen', async ({ page }) => {
  await start(page, lateEvening()); await mergeFlour(page);
  await closing(page).getByRole('button', { name: 'Watch the night' }).evaluate(control => {
    // The mark shows that the queued close event has run.
    document.querySelector('#modal')!.addEventListener('close', () => { document.documentElement.dataset.closed = ''; }, { once: true });
    (control as HTMLButtonElement).click();
    // Hide before the browser dispatches the closing dialog's queued close event.
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(morning(page)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-closed', '');
  expect((await saved(page)).night!.seen).toBe(false);
  await morning(page).getByRole('button', { name: 'Open the bistro' }).click();
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
});

test('replacing a game while its morning report is open leaves the replacement report unseen', async ({ page, context }) => {
  await start(page, lateEvening()); await mergeFlour(page);
  await closing(page).getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(morning(page)).toBeVisible();
  const replacement = await saved(page);
  replacement.coins++; replacement.night!.purse++;
  const other = await context.newPage(); await other.goto('./'); await opened(other);
  await other.evaluate(([key, value]) => localStorage.setItem(key, value), [KEY, serialize(replacement)]);
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#status')).toContainText('another tab');
  expect(await saved(page)).toEqual(replacement);
  await options(page); await page.keyboard.press('Escape');
  expect(await saved(page)).toEqual(replacement);
  await other.close();
  await page.reload(); await opened(page);
  await expect(morning(page)).toContainText('The purse holds 21 coins.');
  await morning(page).getByRole('button', { name: 'Open the bistro' }).click();
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
    'The thief rat took 2 Flour. All 3 rat holes are open, so it made no new one. Mara writes the debt pe caiet: the shop notebook holds a debt of 14 coins.'],
  ['a visit without room for a gift', report({ gift: null }), 'Șoricescu found no room for his gift. He needs 5 free spaces. The purse holds 30 coins.'],
] as const;
for (const [name, night, words] of unreported) test(`after a reload, the morning dialog of ${name} shows once, without the night`, async ({ page }) => {
  const state: GameState = { ...createGame(data, 1), clock: { day: 3, merges: 0 }, night: { ...night, seen: false }, coins: night.purse };
  expect(validate(state)).toBe(true);
  await start(page, state);
  const dialog = page.getByRole('dialog', { name: 'Morning of day 3', exact: true });
  await expect(dialog).toContainText(words);
  await expect(page.locator('#room-frame')).not.toHaveClass(/night/);
  await dialog.getByRole('button', { name: 'Open the bistro' }).click();
  await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
  await page.reload(); await opened(page);
  await expect(page.locator('#modal')).not.toBeVisible();
});

test('after the supper, the supper card gives the result of act 1, also with a debt', async ({ page }) => {
  const finished = supply({ ...checkpoint(data.tasks.length), coins: 0, clock: { day: 22, merges: 10 }, night: report({ day: 21 }) }, supplies(supper));
  const served = reduceGame(finished, { type: 'deliverQuest', id: supper.id }, data).state;
  await start(page, { ...served, coins: -40, act1: { days: 22, purse: -40 }, pendingScenes: [] });
  await expect(page.locator('#story .act-result')).toHaveText('The bistro worked for 22 days. The shop notebook holds a debt of 40 coins.');
});
