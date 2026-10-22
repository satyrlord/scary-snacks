// The prologue in the browser: the first event, the change of event, the deferred scenes, the wait at event 7, the family kitchen, Miez, and the start of act 1.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { act, data, forward, journal, painting, prologueAt, readNow, saved, start, startNewGame, story, supply, tile, unselect } from './support.ts';

const events = data.prologue.events;
const title = (page: Page) => page.locator('#modal-title');
/** The board cells that hold a dish, in board order. */
async function cells(page: Page, code: string) {
  const state = await saved(page);
  return state.board.flatMap((cell, index) => cell?.code === code ? [index] : []);
}
async function merge(page: Page, code: string) {
  await unselect(page);
  const found = await cells(page, code), [from, to] = found;
  await tile(page, from).click(); await tile(page, to).click();
  await expect.poll(async () => (await cells(page, code)).length).toBe(found.length - 2);
}

test('a new game opens the funeral scene at once, shows the date without coins or a clock, and serves the first quest with no take', async ({ page }) => {
  await startNewGame(page);
  await expect(title(page)).toHaveText(events[0].opening.title);
  await expect(page.getByRole('dialog').locator('img.quest-scene-sketch')).toHaveAttribute('alt', `A pencil sketch: ${events[0].scene.text}`);
  // Close keeps the scene pending, and Story offers it with Read now. A reload opens no scene.
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
  expect((await saved(page)).pendingScenes).toEqual([events[0].opening.id]);
  await expect(page.locator('#coin-count')).toBeHidden();
  await expect(page.locator('#day-clock .clock-face')).toHaveText('Mon 23 Dec');
  await expect(page.locator('#area-switch')).toBeHidden();
  await expect(page.locator('#cat-button')).toBeHidden();
  await page.reload(); await expect(page.locator('#board button')).toHaveCount(42);
  await expect(page.locator('#modal')).toBeHidden();
  await readNow(page, events[0].opening.title);
  await forward(page).click();
  await expect(page.locator('#modal')).toBeHidden();
  // The first quest is ready on the board: Serve, with no take.
  const [first, second] = events[0].quests;
  const serve = page.locator(`#tickets .ticket[data-quest="${first.id}"] .deliver-button`);
  await expect(serve).toHaveText('Serve');
  await serve.click();
  await expect.poll(async () => (await saved(page)).completedQuests).toEqual([first.id]);
  expect((await saved(page)).coins).toBe(0);
  // Four free takes and four merges make the Bean dip. The last delivery of the event opens its closing scene at once.
  const sacks = (await cells(page, 'generator_beans'))[0];
  for (let take = 0; take < 4; take++) await tile(page, sacks).click();
  await expect.poll(async () => (await cells(page, 'beans_1')).length).toBe(4);
  await page.keyboard.press('Escape');
  await merge(page, 'beans_1'); await merge(page, 'beans_1'); await merge(page, 'beans_2'); await merge(page, 'beans_3');
  expect((await saved(page)).clock).toEqual({ day: 1, merges: 0 });
  await page.locator(`#tickets .ticket[data-quest="${second.id}"] .deliver-button`).click();
  await expect(title(page)).toHaveText(events[0].closing.title);
  await forward(page).click();
  await expect(title(page)).toHaveText(events[1].opening.title);
  await forward(page).click();
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#day-clock .clock-face')).toHaveText('Tue 24 Dec');
  await expect.poll(() => painting(page)).toMatch(/^family-kitchen-christmas-/);
  // Miez came to the city in Mara's bag.
  await expect(page.locator('#cat-button')).toBeVisible();
});

test('deferred scenes wait in story order through a reload, and only the first one shows under Unread scenes', async ({ page }) => {
  await start(page, prologueAt(3, { read: false }));
  const state = await saved(page);
  expect(state.pendingScenes).toEqual([events[1].closing.id, events[2].opening.id]);
  await page.reload(); await expect(page.locator('#board button')).toHaveCount(42);
  await expect(page.locator('#modal')).toBeHidden();
  await journal(page);
  await expect(page.locator('.journal-unread .journal-entry')).toHaveCount(1);
  await expect(page.locator('.journal-unread .journal-entry')).toHaveAttribute('data-scene', events[1].closing.id);
  // During the prologue, the journal has no Neighbours group.
  await expect(page.locator('.journal-group[data-group="neighbours"]')).toHaveCount(0);
  await expect(page.locator('[data-chapter="prologue"]')).toContainText('Prologue · The inheritance');
  await page.locator('.journal-unread .journal-entry').click();
  await forward(page).click();
  // Reading moves on to the next pending scene: the notebook page of the cabbage rolls.
  await expect(title(page)).toHaveText(events[2].opening.title);
  const page3 = events[2].opening.page!;
  await expect(page.getByRole('dialog').locator('img.quest-scene-sketch')).toHaveAttribute('alt', page3.text);
  await expect(page.getByRole('dialog')).toContainText('Sour cabbage from the barrel');
});

test('each event shows its painted state of the family kitchen, and the room keeps it after a reload', async ({ page }) => {
  const expected = ['family-kitchen-mourning', 'family-kitchen-christmas', 'family-kitchen-christmas', 'family-kitchen-new-year', 'family-kitchen-new-year', 'family-kitchen-mourning', 'family-kitchen-farewell'];
  await start(page, prologueAt(1));
  for (const [index, room] of expected.entries()) {
    if (index) await page.evaluate(([key, value]) => localStorage.setItem(key, value), ['scary-snacks-save-v15', JSON.stringify({ format: 'scary-snacks', version: 15, state: prologueAt(index + 1) })]), await page.reload();
    await expect.poll(() => painting(page)).toMatch(new RegExp(`^${room}-`));
    await expect(page.locator('#room-frame')).toHaveAttribute('data-current', room);
  }
});

test('the wait at event 7 has no ticket, and closing 7 starts act 1 with the gift, the first morning, and the front room', async ({ page }) => {
  await start(page, prologueAt(7, { served: true }));
  await expect(page.locator('#tickets .ticket')).toHaveCount(0);
  await expect(page.locator('#tickets')).toContainText('The last scene of the prologue waits in Story.');
  await expect(page.locator('#day-clock .clock-face')).toHaveText('Thu 13 Feb');
  await readNow(page, events[6].closing.title);
  await page.keyboard.press('Escape');
  expect((await saved(page)).prologue).toEqual({ event: 7 });
  await readNow(page, events[6].closing.title);
  await expect(forward(page)).toHaveText('Leave for the village');
  await forward(page).click();
  await expect(page.locator('#modal')).toBeHidden();
  const state = await saved(page);
  expect([state.prologue, state.coins, state.clock, state.pendingScenes]).toEqual([null, data.prologue.gift, { day: 1, merges: 0 }, []]);
  await expect(page.locator('#coins')).toHaveText(String(data.prologue.gift));
  await expect(page.locator('#day-clock .clock-face')).toHaveText('Sat 15 Feb · 07:00');
  await expect.poll(() => painting(page)).toMatch(/^front-room-00-/);
  await expect(page.locator('#area-switch')).toBeVisible();
  // In act 1, the neighbours do not include Mama or Tata, and the prologue stays in the journal for replay.
  await journal(page, ['neighbours', 'chapters']);
  await expect(page.locator('.neighbour-entry[data-journal="mama"],.neighbour-entry[data-journal="tata"]')).toHaveCount(0);
  await page.locator(`[data-journal="${events[4].closing.id}"]`).click();
  await expect(page.getByRole('dialog').locator('img.quest-scene-sketch')).toHaveAttribute('alt', events[4].closing.page!.text);
  await page.getByRole('button', { name: 'Return', exact: true }).click();
  expect(await saved(page)).toEqual(state);
});

test('a prologue dish of a chain that opens later stays in the recipe book with no way to the board', async ({ page }) => {
  await start(page);
  await page.locator('#collection-button:visible,#recipes-button:visible').first().click();
  const cozonac = page.getByRole('dialog').getByRole('button', { name: /Cozonac/ }).first();
  await cozonac.click();
  await expect(page.getByRole('dialog')).toContainText(/[Tt]he Cornucopia comes to the bistro later\./);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Show me on the board' })).toHaveCount(0);
});

test('prepared prologue dishes keep their board counts and usable guidance without all their sources', async ({ page }) => {
  await start(page, prologueAt(3));
  await page.locator('#collection-button:visible,#recipes-button:visible').first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sweet dough', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('You have 1 on the board.');
  await page.getByRole('button', { name: 'Show me on the board' }).click();
  await expect(tile(page, 9)).toBeFocused();
  await expect(page.locator('#status')).toHaveText('Sweet dough is ready on the board.');
  await page.locator('#collection-button:visible,#recipes-button:visible').first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cozonac', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('You have none yet.');
  await page.getByRole('button', { name: 'Show me on the board' }).click();
  await expect(tile(page, 3)).toBeFocused();
  await expect(page.locator('#status')).toHaveText('Tap the Cornucopia to take Plums for Cozonac, free.');
});

test('dishes from earlier events have no guide when this event cannot make them', async ({ page }) => {
  await start(page, prologueAt(3));
  await page.locator('#collection-button:visible,#recipes-button:visible').first().click();
  for (const name of ['Colivă', 'Turte']) {
    await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('You have none yet.');
    await expect(page.getByRole('button', { name: 'Show me on the board' })).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
});

test('a prepared dish can guide to its cooked result but gives no further guide after that result is served', async ({ page }) => {
  let state = supply(prologueAt(3), ['fruits_2', 'pork_3']);
  const from = state.board.findIndex(cell => cell?.code === 'mixed_sweet-dough'), to = state.board.findIndex(cell => cell?.code === 'fruits_2');
  state = act(state, { type: 'move', from, to });
  await start(page, state);
  await page.locator('#collection-button:visible,#recipes-button:visible').first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cozonac', exact: true }).click();
  await page.getByRole('button', { name: 'Show me on the board' }).click();
  await expect(tile(page, to)).toBeFocused();
  await page.locator('#tickets .ticket[data-quest="prologue-3-tata"] .deliver-button').click();
  await page.locator('#collection-button:visible,#recipes-button:visible').first().click();
  for (const name of ['Sweet dough', 'Cozonac']) {
    await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Show me on the board' })).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
});

test('the journal marks a completed event done when both scenes are still unread', async ({ page }) => {
  const state = prologueAt(3, { read: false });
  state.pendingScenes = events.slice(0, 2).flatMap(event => [event.opening.id, event.closing.id]).concat(events[2].opening.id);
  await start(page, state);
  await journal(page);
  const steps = page.locator('[data-chapter="prologue"] .journal-steps');
  await expect(steps).toContainText('The funeral meal · 23 December · Done');
  await expect(steps).toContainText('Christmas dinner · 25 December · Now');
  await expect(steps).toContainText('New Year’s Eve · 31 December · Not yet');
  await expect(page.locator('.journal-unread .journal-entry')).toHaveCount(1);
  expect(await saved(page)).toEqual(state);
});

for (const [label, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 1000 }]] as const) for (const theme of ['light', 'dark']) {
  test(`the prologue fits the ${label} screen in the ${theme} theme, with reduced motion`, async ({ page }) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    await start(page, prologueAt(5), theme);
    await expect.poll(() => painting(page)).toMatch(/^family-kitchen-new-year-/);
    await expect(page.locator('#tickets .ticket')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await story(page);
    await expect(page.getByText('Prologue: The inheritance').locator('visible=true')).toHaveCount(1);
    await expect(page.getByRole('list', { name: 'Prologue events' }).locator('visible=true').locator('li')).toHaveCount(7);
  });
}
