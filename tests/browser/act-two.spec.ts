import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { dayMerges, firstFreeBoardCell, freeBoardCells, isSunday, levers, questHoliday } from '../../src/model.ts';
import type { GameState } from '../../src/model.ts';
import { checkpointState, moveTo } from '../../tools/create-checkpoint-saves.ts';
import { act, actOneTasks, atBookingTime, checkpoint, data, deliverButton, dialogDeliver, onTicket, opened, openQuest, painting, quest, readNow, readTo, saved, start, supplies, supply, ticket, tile, validate } from './support.ts';

const grill = quest('gavril-grill'), dinner = quest('ambrozie-dinner'), feast = quest('ambrozie-feast');
/** A copy at the booking time of a day. */
function bookingTime(state: GameState, day: number) {
  const next = structuredClone(state);
  moveTo(next, day, data);
  const { opening, booking, mergeMinutes } = levers(day, data);
  next.clock.merges = (booking - opening) / mergeMinutes;
  return next;
}
const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const viewport of [{ width: 320, height: 740 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) for (const theme of ['light', 'dark']) {
  test(`all act 2 room names and targets fit at ${viewport.width}px in ${theme}`, async ({ page }) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    await start(page, checkpoint(40), theme);
    // A thin strip of room above the raised drawer has no area switch, so the player lowers the drawer to change the area.
    if (await page.locator('.game-layout').evaluate(element => element.hasAttribute('data-thin-room'))) await page.locator('#drawer-handle').click();
    for (const name of ['Summer kitchen', 'Vegetable garden', 'Town square']) {
      const choice = page.getByRole('button', { name, exact: true });
      await choice.click(); await expect(choice).toHaveAttribute('aria-pressed', 'true');
      const geometry = await page.locator('#area-switch').evaluate(group => {
        const room = document.querySelector('#room')!.getBoundingClientRect(), box = group.getBoundingClientRect();
        return { left: box.left - room.left, right: room.right - box.right, height: box.height,
          choices: [...group.querySelectorAll('button')].map(button => {
            const box = button.getBoundingClientRect(), text = document.createRange(); text.selectNodeContents(button);
            return { width: box.width, height: box.height, textFits: [...text.getClientRects()].every(line => line.left >= box.left && line.right <= box.right && line.top >= box.top && line.bottom <= box.bottom) };
          }) };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(12); expect(geometry.right).toBeGreaterThanOrEqual(12);
      expect(geometry.height).toBeLessThanOrEqual(52);
      for (const target of geometry.choices) {
        expect(target.width).toBeGreaterThanOrEqual(44); expect(target.height).toBeGreaterThanOrEqual(44); expect(target.textFits).toBe(true);
      }
    }
  });
}

/**
 * The last merge of 17 July with no blocker waiting and many free cells: two Elderflowers wait for the merge that closes the day, so the
 * hail of 18 July has room for all its blockers in the morning.
 */
function hailEve() {
  const state = checkpointState(data, actOneTasks + 16);
  moveTo(state, data.board.hail.day - 1, data);
  state.preparationObstacles = { start: state.taskIndex, placed: [] };
  state.resolvedObstacles = state.resolvedObstacles.filter(id => !id.startsWith('prep-'));
  const from = firstFreeBoardCell(state, data);
  state.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(state, data);
  state.board[to] = { code: 'herbs_1' };
  state.clock.merges = dayMerges(state.clock.day, data) - 1;
  expect(freeBoardCells(state, data)).toBeGreaterThan(5);
  expect(validate(state)).toBe(true);
  return { state, from, to };
}

/** The last merge of the first Sunday after the piper's fee. No rat comes that night. */
function piperSunday() {
  const piper = data.quests.find(value => value.piper)!;
  const state = act(supply(onTicket(piper), supplies(piper)), { type: 'deliverQuest', id: piper.id });
  let day = state.clock.day;
  while (!isSunday(day, data)) day++;
  moveTo(state, day, data);
  const from = firstFreeBoardCell(state, data);
  state.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(state, data);
  state.board[to] = { code: 'herbs_1' };
  state.clock.merges = dayMerges(day, data) - 1;
  expect(validate(state)).toBe(true);
  return { state, from, to };
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) for (const theme of ['light', 'dark']) {
  const size = `${viewport.width}px in ${theme}`;
  test(`before 21 June the festival grill ticket waits with Later and fits at ${size}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    await start(page, onTicket(grill), theme);
    await expect(ticket(page, grill).locator('.later-button')).toBeDisabled();
    expect(await fits(page)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('festival-ticket.png') });
  });
  test(`on his fixed evening Ambrozie's dinner ticket is ready and fits at ${size}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    const evening = supply(atBookingTime(onTicket(dinner), dinner), supplies(dinner));
    await start(page, evening, theme);
    await expect(page.locator('#day-clock .clock-time')).toHaveText('19:30');
    await expect(ticket(page, dinner).locator('.deliver-button')).toBeEnabled();
    expect(await fits(page)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('dinner-ticket.png') });
  });
  test(`a Sunday of the piper's tune shows its report without a rat at ${size}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    const { state, from, to } = piperSunday();
    await start(page, state, theme);
    await tile(page, from).click(); await tile(page, to).click();
    const dialog = page.getByRole('dialog', { name: /^Good morning,/ });
    await expect(dialog).toContainText('The piper’s tune still plays in the cellar. No rat came.');
    await expect(dialog.locator('.morning-rat')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Open the bistro' })).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath('piper-morning.png') });
    await page.reload();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.morning-rat')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Open the bistro' }).press('Enter');
    await expect.poll(async () => (await saved(page)).night!.seen).toBe(true);
    await page.reload(); await opened(page);
    await expect(page.locator('#modal')).toBeHidden();
  });
  test(`the hail of 18 July places its blocker art on the board in the morning at ${size}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    const { state, from, to } = hailEve();
    await start(page, state, theme);
    await tile(page, from).click(); await tile(page, to).click();
    await expect.poll(async () => (await saved(page)).clock.day).toBe(data.board.hail.day);
    const placed = (await saved(page)).preparationObstacles!.placed.filter(placement => placement.id.startsWith('hail-'));
    expect(placed.map(placement => placement.id)).toEqual(data.board.hail.obstacles.map(obstacle => obstacle.id));
    for (const { position } of placed) {
      const art = tile(page, position).locator('.hail-art');
      await expect(art).toBeVisible();
      expect(await art.evaluate(node => getComputedStyle(node).backgroundImage)).toMatch(/hail-clutter-1024x512\.webp/);
    }
    expect(await fits(page)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('hail-board.png') });
  });
  test(`the feast asks for one plate for each guest, Mamaia's chair included, and fits at ${size}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    await start(page, supply(bookingTime(onTicket(feast), data.finales[1].day), supplies(feast)), theme);
    await openQuest(page, feast);
    const dialog = page.getByRole('dialog', { name: feast.title, exact: true });
    await expect(dialog.getByRole('button', { name: /^Mamaia’s chair: / }).first()).toBeVisible();
    await expect(dialog.locator('.quest-reward')).toHaveText('The feast pays nothing. Serving it opens the finale.');
    expect(await fits(page)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('feast-quest.png') });
  });
}

// Only Vlad and Elisabeta take turns on the evenings. Ambrozie's fixed evening is outside the turns, so the note of a booked ticket never names him.
test('a booked ticket of act 2 for another evening names only the guests who take turns', async ({ page }) => {
  const house = quest('vlad-house-guest');
  await start(page, onTicket(house));
  await openQuest(page, house);
  await expect(page.getByRole('dialog', { name: house.title, exact: true }).locator('.quest-booking'))
    .toHaveText('Booked for another evening. Vlad and Elisabeta never dine on the same evening, and nobody books on a Sunday.');
});

const stalls = data.quests.filter(value => value.stall);
/** The morning of 21 June after the payment of preparation 12, with the first four stalls delivered and the plates of the fifth on the board. */
function lastStall() {
  let state = act(checkpoint(actOneTasks + 11, { ready: true }), { type: 'task' });
  moveTo(state, questHoliday(stalls[0], data)!.day, data);
  state.coins = 5000;
  for (const stall of stalls.slice(0, -1)) state = act(supply(state, supplies(stall)), { type: 'deliverQuest', id: stall.id });
  // The scenes of the payment and of the first four stalls are read.
  return { ...supply(state, supplies(stalls.at(-1)!)), pendingScenes: [] };
}
/** A painting dialog after its scene: its picture has loaded, and its words name the people. */
async function paintingDialog(page: Page, title: string, alt: RegExp) {
  const dialog = page.getByRole('dialog', { name: title, exact: true }), image = dialog.locator('img');
  await expect(dialog).toBeVisible(); await expect(image).toHaveAttribute('alt', alt);
  await expect.poll(() => image.evaluate(node => { const value = node as HTMLImageElement; return value.complete ? value.naturalWidth : 0; })).toBeGreaterThan(0);
  return dialog;
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`the fifth stall scene ends with the festival painting, and the square keeps its state, at ${viewport.width}`, async ({ page }, testInfo) => {
    const last = stalls.at(-1)!;
    await page.setViewportSize(viewport); await start(page, lastStall());
    if (viewport.width < 1024) { await openQuest(page, last); await dialogDeliver(page, last).click(); } else await deliverButton(page, last).click();
    await readNow(page, last.title); await readTo(page, 'See the festival');
    const dialog = await paintingDialog(page, 'The festival', /Tarka Miklós plays on the stage/);
    await page.screenshot({ path: testInfo.outputPath('festival-painting.png') });
    await dialog.getByRole('button', { name: 'Back to the kitchen', exact: true }).click(); await expect(page.locator('#modal')).toBeHidden();
    await page.getByRole('button', { name: 'Town square', exact: true }).click();
    await expect(page.locator('#room-frame')).toHaveAttribute('data-painting', 'town-square-12');
  });
  test(`after the feast the square shows the feast painting, also after a reload, at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await start(page, supply(bookingTime(onTicket(feast), data.finales[1].day), supplies(feast)));
    if (viewport.width < 1024) { await openQuest(page, feast); await page.getByRole('dialog', { name: feast.title, exact: true }).getByRole('button', { name: `Serve ${feast.title}`, exact: true }).click(); }
    else await deliverButton(page, feast).click();
    await readTo(page, 'See the feast');
    const dialog = await paintingDialog(page, 'The feast', /Ambrozie blesses the table/);
    await expect(dialog.locator('.completion-message')).toHaveText(data.finales[1].ending);
    await page.screenshot({ path: testInfo.outputPath('feast-painting.png') });
    await dialog.getByRole('button', { name: 'Back to the kitchen', exact: true }).click(); await expect(page.locator('#modal')).toBeHidden();
    const feastRoom = async () => {
      await expect(page.locator('#room-frame')).toHaveAttribute('data-painting', 'finale-feast'); await expect.poll(() => painting(page)).toMatch(/^finale-feast-/);
      await expect(page.getByRole('button', { name: 'Town square', exact: true })).toHaveAttribute('aria-pressed', 'true'); await expect(page.locator('#room-pin')).toBeHidden();
    };
    await feastRoom(); await page.screenshot({ path: testInfo.outputPath('feast-room.png') });
    await page.reload(); await opened(page); await feastRoom();
  });
}
