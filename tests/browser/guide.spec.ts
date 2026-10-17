import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { requiredQuests } from '../../src/engine.ts';
import type { GameState } from '../../src/engine.ts';
import { act, checkpoint, data, deliverable, failWrites, noSideScroll, onTicket, options, quest, revealed, saved, serialize, start, supply, ticket, tile, toast } from './support.ts';

const step = (page: Page) => page.locator('#guide-step');
const skip = (page: Page) => page.getByRole('button', { name: 'Skip the guide', exact: true });
const welcome = quest('mara-welcome');
async function guidePage(page: Page) {
  await options(page); await page.getByRole('button', { name: 'Open the kitchen guide', exact: true }).click();
  await expect(page.locator('#modal-title')).toHaveText('The kitchen guide');
}

test('a new game guides merge, take, and delivery through real play, marks targets by rule, and keeps its step after a reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  await expect(step(page)).toHaveText('Guide, step 1 of 5 Tap one Flour, then the other, to merge them. Two make Dough.');
  await expect(skip(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Find a match', exact: true })).toBeHidden();
  await expect(page.locator('.cell.guide-target')).toHaveCount(2);
  await expect(tile(page, 13)).toHaveAttribute('aria-label', /Flour\. Marked by the guide$/);
  // A moved target leaves no stale mark: the guide follows the Flour to its new space.
  await tile(page, 13).click(); await tile(page, 7).click();
  await expect(tile(page, 7)).toHaveAttribute('aria-pressed', 'true');
  await expect(tile(page, 14)).toHaveClass(/guide-target/); await expect(tile(page, 13)).not.toHaveClass(/guide-target/);
  await tile(page, 14).click();
  // The merge completes the step: the selection clears, so Mara's line shows the next step and marks the source.
  await expect(step(page)).toContainText('2 of 5 Tap the Flour bin. The plus badge marks a source: each tap takes Flour.');
  await expect(page.locator('#board .selected')).toHaveCount(0);
  await expect(page.locator('.cell.guide-target')).toHaveCount(1); await expect(tile(page, 1)).toHaveClass(/guide-target/);
  await page.reload(); await expect(step(page)).toContainText('2 of 5');
  // Elderflowers from the pitcher: the take completes step 2, and the merge makes Mara's Socată.
  await tile(page, 31).click();
  await expect(step(page)).toContainText('3 of 5');
  const flowers = (await saved(page)).board.flatMap((cell, index) => cell?.code === 'drinks_1' ? [index] : []);
  await tile(page, flowers[0]).click(); await tile(page, flowers[1]).click();
  await expect(step(page)).toContainText(`3 of 5 Mara’s request is ready. Tap Deliver on the ticket.`);
  await expect(ticket(page, welcome)).toHaveClass(/guide-target/);
  await ticket(page, welcome).locator('.deliver-button').click(); await expect(toast(page)).toContainText(welcome.title);
  const needed = requiredQuests(0, data).length - 1, coins = data.tasks[0].cost - welcome.reward;
  await expect(step(page)).toContainText(`4 of 5 “${data.tasks[0].title}” needs ${coins} more coins and ${needed} more quests. Quests pay coins.`);
  const after = await saved(page);
  expect(after.guide).toEqual({ status: 'active', stage: 'prepare', done: { merge: true, take: true, deliver: true, prepare: false, story: false } });
  expect(after.coins).toBe(welcome.reward);
});

test('the payment and its scene complete the guide, and Find a match returns', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = checkpoint(0, { ready: true });
  state.guide = { status: 'active', stage: 'prepare', done: { merge: true, take: true, deliver: true, prepare: false, story: false } };
  await start(page, state);
  await expect(step(page)).toContainText(`4 of 5 Everything is ready. Pay for “${data.tasks[0].title}” to change the room.`);
  const pay = page.locator('#story').getByRole('button', { name: /^Pay / });
  await expect(pay).toHaveClass(/guide-target/);
  await pay.click();
  // Closing the scene leaves it waiting; the guide points to Read now, and Skip scene completes the run.
  await page.getByRole('button', { name: 'Close dialog' }).click(); await revealed(page);
  await expect(step(page)).toContainText('5 of 5 A story scene waits. Tap Read now in Story.');
  await expect(page.locator('#story .story-waiting button')).toHaveClass(/guide-target/);
  await page.locator('#story .story-waiting button').click();
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click();
  await expect(page.locator('#status')).toContainText('The guide is complete. Options has more help');
  await expect(page.getByRole('button', { name: 'Find a match', exact: true })).toBeVisible();
  await expect(step(page)).toBeHidden(); await expect(skip(page)).toBeHidden();
  const after = await saved(page);
  expect(after.guide!.status).toBe('complete'); expect(after.coins).toBe(0); expect(after.taskIndex).toBe(1);
});

test('Skip guide closes the guide without a change to the game, and the kitchen guide resumes it at its step', async ({ page }) => {
  await start(page);
  await tile(page, 13).click(); await tile(page, 14).click();
  const before = await saved(page);
  await skip(page).click();
  await expect(page.getByRole('button', { name: 'Find a match', exact: true })).toBeFocused();
  await expect(page.locator('#status')).toHaveText('The guide is closed. Options can open it again.');
  await expect(page.locator('.guide-target')).toHaveCount(0);
  const skipped = await saved(page);
  expect({ ...skipped, guide: before.guide }).toEqual(before); expect(skipped.guide!.status).toBe('dismissed');
  await page.reload(); await expect(skip(page)).toBeHidden();
  await guidePage(page);
  await expect(page.locator('.guide-steps li')).toHaveText([/^Merge\s*Done/, /^Take(?!\s*Done)/, /^Deliver/, /^Prepare/, /^Read and return/]);
  await page.getByRole('button', { name: 'Resume the guide', exact: true }).click();
  await expect(page.locator('#modal')).not.toHaveAttribute('open');
  await expect(step(page)).toContainText('2 of 5');
  expect((await saved(page)).board).toEqual(before.board);
});

test('the guide marks the phone offer Pay control and the Story sheet Pay control', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = checkpoint(0, { ready: true });
  state.guide = { status: 'active', stage: 'prepare', done: { merge: true, take: true, deliver: true, prepare: false, story: false } };
  await start(page, state);
  const offer = page.locator('#offer .pay-button');
  await expect(offer).toBeVisible(); await expect(offer).toHaveClass(/guide-target/);
  await page.locator('#story-button').click();
  await expect(page.locator('#modal .pay-button')).toHaveClass(/guide-target/);
  await expect(offer).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(offer).toBeVisible(); await expect(offer).toHaveClass(/guide-target/);
  expect(await saved(page)).toEqual(state);
});

for (const storyDone of [false, true]) test(`guide completion after ${storyDone ? 'payment' : 'its scene'} remains visible after the room reveal`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const state = checkpoint(0, { ready: true });
  state.guide = { status: 'active', stage: 'prepare', done: { merge: true, take: true, deliver: true, prepare: false, story: storyDone } };
  await start(page, state);
  await page.locator('#story .pay-button').click();
  await page.getByRole('button', { name: 'Skip scene', exact: true }).click();
  await revealed(page);
  await expect(page.locator('#status')).toContainText(data.rooms.find(room => room.after === data.tasks[0].id)!.text);
  await expect(page.locator('#status')).toContainText('The guide is complete. Options has more help');
  expect((await saved(page)).guide!.status).toBe('complete');
  await expect(page.getByRole('button', { name: 'Find a match', exact: true })).toBeVisible();
});

test('a final guide merge keeps both the discovery notice and the completion help', async ({ page }) => {
  const state = supply(checkpoint(1), ['bakery_3', 'bakery_3']);
  state.guide = { status: 'active', stage: 'merge', done: { merge: false, take: true, deliver: true, prepare: true, story: true } };
  const pair = state.board.flatMap((cell, index) => cell?.code === 'bakery_3' ? [index] : []);
  expect(state.discovered).not.toContain('bakery_4');
  await start(page, state);
  await tile(page, pair[0]).click(); await tile(page, pair[1]).click();
  await expect(page.locator('#status')).toContainText(`${data.items.bakery_4.name} is a new dish!`);
  await expect(page.locator('#status')).toContainText('The guide is complete. Options has more help');
  expect((await saved(page)).guide!.status).toBe('complete');
});

test('guide help explains that a one-time visitor scene has no journal replay', async ({ page }) => {
  const dinner = quest('ionatan-castle-dinner');
  const state = act(deliverable(dinner), { type: 'deliverQuest', id: dinner.id });
  state.guide = { status: 'active', stage: 'story', done: { merge: true, take: true, deliver: true, prepare: true, story: false } };
  await start(page, state);
  await expect(step(page)).toContainText('A story scene waits. Tap Read now in Story. You can skip it.');
  await expect(step(page)).not.toContainText('Journal');
  await guidePage(page);
  await expect(page.locator('.guide-steps li').last()).toContainText('One-time visitors have no replay.');
  expect(await saved(page)).toEqual(state);
});

for (const id of ['ionatan-castle-dinner', 'mina-avram-search']) for (const theme of ['light', 'dark'] as const) {
  test(`the ${id} guide fits above the phone bar in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const request = quest(id), state = onTicket(request);
    state.board = state.board.map(cell => cell && data.items[cell.code].generator ? cell : null);
    state.guide = { status: 'active', stage: 'deliver', done: { merge: true, take: true, deliver: false, prepare: false, story: false } };
    await start(page, state);
    await expect(ticket(page, request)).toHaveClass(/guide-target/);
    await expect(step(page)).toContainText('Tap its dishes for help.');
    const geometry = await step(page).evaluate(element => {
      const box = element.getBoundingClientRect();
      return { bottom: box.bottom, lines: box.height / parseFloat(getComputedStyle(element).lineHeight), bar: document.querySelector('.phone-bar')!.getBoundingClientRect().top };
    });
    expect(geometry.lines).toBeLessThanOrEqual(3.01);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.bar);
    expect(await noSideScroll(page)).toBe(true);
  });
}

test('a late-game save opens the kitchen guide without a reset, and Guide me starts a run on the same board', async ({ page }) => {
  const late = checkpoint(12, { coins: 345 });
  await start(page, late);
  await expect(skip(page)).toBeHidden();
  await guidePage(page);
  await expect(page.locator('.guide-mark')).toHaveCount(0);
  await expect(page.locator('.guide-more dt')).toHaveText(['Room on the board', 'The recipe book', 'Find a match', 'Blocked spaces']);
  await expect(page.locator('.guide-more')).toContainText('Dishes leave the board when you merge them or deliver them.');
  // Close returns to Options.
  await page.getByRole('button', { name: 'Close dialog' }).click(); await expect(page.locator('#modal-title')).toHaveText('Options');
  await page.getByRole('button', { name: 'Open the kitchen guide', exact: true }).click();
  await page.getByRole('button', { name: 'Guide me', exact: true }).click();
  await expect(step(page)).toContainText('1 of 5');
  const after = await saved(page);
  expect({ ...after, guide: undefined }).toEqual({ ...late, guide: undefined });
  expect(after.guide!.status).toBe('active');
});

for (const theme of ['light', 'dark'] as const) for (const viewport of [{ width: 360, height: 740 }, { width: 1440, height: 900 }]) {
  test(`the finished campaign guide explains that no requests remain in ${theme} at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const state = checkpoint(data.tasks.length);
    state.guide = { status: 'active', stage: 'deliver', done: { merge: true, take: true, deliver: false, prepare: false, story: false } };
    await start(page, state);
    await expect(step(page)).toContainText('No requests remain after the supper. Use Skip guide to close the guide.');
    await expect(page.locator('#tickets .ticket')).toHaveCount(0);
    expect(await saved(page)).toEqual(state);
    const geometry = await step(page).evaluate(element => {
      const box = element.getBoundingClientRect();
      return { bottom: box.bottom, lines: box.height / parseFloat(getComputedStyle(element).lineHeight), bar: document.querySelector('.phone-bar')!.getBoundingClientRect().top };
    });
    expect(geometry.lines).toBeLessThanOrEqual(3.01);
    if (viewport.width === 360) expect(geometry.bottom).toBeLessThanOrEqual(geometry.bar);
    await page.screenshot({ path: testInfo.outputPath(`finished-guide-${theme}-${viewport.width}.png`) });
    await skip(page).click();
    const after = await saved(page);
    expect(after.guide!.status).toBe('dismissed');
    expect({ ...after, guide: state.guide }).toEqual(state);
    await expect(page.getByRole('button', { name: 'Find a match', exact: true })).toBeVisible();
  });
}

test('a failed guide write warns that the game is unsaved, and a reload repeats the last durable step', async ({ page }) => {
  await start(page);
  await failWrites(page);
  await tile(page, 13).click(); await tile(page, 14).click();
  await expect(step(page)).toContainText('2 of 5');
  await expect(page.locator('.save-status').first()).toContainText('Not saved');
  await page.reload(); await expect(step(page)).toContainText('1 of 5');
  expect((await saved(page)).board[14]).toEqual({ code: 'bakery_1' });
});

test('an import adopts the guide of the imported save only after its validation', async ({ page }) => {
  const imported: GameState = checkpoint(3);
  imported.guide = { status: 'dismissed', stage: 'take', done: { merge: true, take: false, deliver: false, prepare: false, story: false } };
  await start(page);
  await options(page);
  const bad = JSON.stringify({ ...JSON.parse(serialize(imported)), state: { ...imported, guide: { ...imported.guide, stage: 'story' } } });
  await page.locator('input[type="file"]').setInputFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(bad) });
  await expect(page.locator('#modal-title')).toHaveText('Cannot import this file');
  await expect(step(page)).toContainText('1 of 5');
  await page.getByRole('button', { name: 'Close dialog' }).click(); await options(page);
  await page.locator('input[type="file"]').setInputFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(serialize(imported)) });
  await page.getByRole('button', { name: 'Import this saved game' }).click();
  await expect(skip(page)).toBeHidden();
  expect((await saved(page)).guide).toEqual(imported.guide);
});

for (const theme of ['light', 'dark'] as const) for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 740 }, { width: 1440, height: 900 }]) {
  test(`the guide line fits under the board in ${theme} mode at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await start(page);
    const line = await page.locator('.guide').boundingBox(), board = await page.locator('#board').boundingBox(), text = await step(page).boundingBox();
    expect(line!.y).toBeGreaterThanOrEqual(board!.y + board!.height);
    expect(line!.y + line!.height).toBeLessThanOrEqual(viewport.height);
    expect(text!.y + text!.height).toBeLessThanOrEqual(line!.y + line!.height + 1);
    expect(await noSideScroll(page)).toBe(true);
    const skipBox = await skip(page).boundingBox(); expect(skipBox!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: testInfo.outputPath(`guide-${theme}-${viewport.width}.png`) });
  });
}
