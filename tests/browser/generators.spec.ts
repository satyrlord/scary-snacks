import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { unresolvedObstacle } from '../../src/model.ts';
import type { GameState } from '../../src/model.ts';
import { appearance, checkpoint, data, saved, start, tile, unselect } from './support.ts';

/** The game after count preparations, with coins for paid takes. */
const afterPreparations = (count: number) => checkpoint(count, count < data.tasks.length ? { ready: true } : { coins: 100 });
const source = (page: Page, state: GameState, chain = 'grain') => tile(page, state.board.findIndex(cell => cell?.code === `generator_${chain}`));

for (const count of [0, 12, 20, 24]) test(`sources give only stage-one ingredients after ${count} preparations`, async ({ page }) => {
  const initial = afterPreparations(count);
  await start(page, initial);
  const windmill = source(page, initial);
  await windmill.click();
  await expect(page.locator('#item-detail.source-detail')).toContainText('Tap again for Flour: 1 coin each.');
  await expect(page.locator('#item-detail').getByRole('button')).toHaveCount(1);
  await expect(page.locator('#item-detail')).not.toContainText(data.items.grain_2.name);
  const before = await saved(page);
  await windmill.click();
  const after = await saved(page);
  expect(after.board.filter(cell => cell?.code === 'grain_1')).toHaveLength(before.board.filter(cell => cell?.code === 'grain_1').length + 1);
  expect(after.board.filter(cell => cell?.code === 'grain_2')).toHaveLength(before.board.filter(cell => cell?.code === 'grain_2').length);
  expect(after.coins).toBe(before.coins - data.economy.takeCost);
  // The Herb basket is free, and its line says so once.
  await source(page, after, 'herbs').click();
  await expect(page.locator('#item-detail.source-detail')).toContainText(`Tap again for ${data.items.herbs_1.name}: free. No limit.`);
});

test('keyboard source activation produces stage one repeatedly and keeps focus', async ({ page }) => {
  const initial = afterPreparations(20);
  await start(page, initial);
  await appearance(page, 'light');
  const button = source(page, initial);
  await button.click();
  const before = await saved(page);
  await button.focus();
  for (const key of ['Enter', 'Space']) {
    await page.keyboard.press(key);
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS('outline-width', '3px');
  }
  const after = await saved(page);
  expect(after.board.filter(cell => cell?.code === 'grain_1')).toHaveLength(before.board.filter(cell => cell?.code === 'grain_1').length + 2);
  expect(after.coins).toBe(before.coins - 2 * data.economy.takeCost);
});

for (const viewport of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 412, height: 915 }]) {
  test(`repeated source taps keep the board still at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Quests are open and the purse stays above the recovery floor, so the tickets do not change while the source takes.
    const initial = checkpoint(20, { coins: 100 });
    await start(page, initial);
    const cell = source(page, initial, 'vegetables');
    const before = (await cell.boundingBox())!;
    const x = before.x + before.width / 2, y = before.y + before.height / 2;
    await page.mouse.click(x, y);
    await expect(page.locator('#item-detail.source-detail')).toBeVisible();
    expect(await cell.boundingBox()).toEqual(before);
    await page.mouse.click(x, y);
    const after = await saved(page);
    expect(after.board.filter(cell => cell?.code === 'vegetables_1')).toHaveLength(initial.board.filter(cell => cell?.code === 'vegetables_1').length + 2);
  });
}

test('each take from a paid source spends its cost across reload, and the Herb basket stays free', async ({ page }) => {
  const initial = afterPreparations(20);
  await start(page, initial);
  await source(page, initial).click();
  await source(page, initial).click();
  const after = await saved(page);
  expect(after.coins).toBe(initial.coins - 2 * data.economy.takeCost);
  expect(after.board.filter(cell => cell?.code === 'grain_1')).toHaveLength(initial.board.filter(cell => cell?.code === 'grain_1').length + 2);
  await page.reload();
  await source(page, after, 'herbs').click();
  const herbs = await saved(page);
  expect(herbs.coins).toBe(after.coins);
  expect(herbs.board.filter(cell => cell?.code === 'herbs_1')).toHaveLength(after.board.filter(cell => cell?.code === 'herbs_1').length + 1);
});

test('a source on a full board takes nothing, spends nothing, and says why', async ({ page }) => {
  const initial = afterPreparations(20);
  initial.board = initial.board.map((cell, index) => cell ?? (unresolvedObstacle(initial, index, data) ? null : { code: 'grain_1' }));
  await start(page, initial);
  await source(page, initial).click();
  await expect(source(page, initial)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#status')).toHaveText('The board is full. Merge a pair or deliver a quest.');
  expect(await saved(page)).toEqual(initial);
});

test('touch takes stage one with reduced motion', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    const initial = afterPreparations(20);
    await start(page, initial);
    await source(page, initial).tap();
    const before = await saved(page);
    await source(page, before).tap();
    const after = await saved(page);
    expect(after.board.filter(cell => cell?.code === 'grain_1')).toHaveLength(before.board.filter(cell => cell?.code === 'grain_1').length + 1);
    expect(await page.locator('#board').evaluate(board => board.getAnimations({ subtree: true }).length)).toBe(0);
  } finally { await context.close(); }
});

for (const mode of ['Light', 'Dark']) for (const viewport of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`a selected source and Clear fit in ${mode} at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const initial = afterPreparations(20);
    await start(page, initial);
    await appearance(page, mode);
    for (const chain of data.chains) {
      await unselect(page);
      await source(page, initial, chain.id).click();
      const buttons = page.locator('#item-detail').getByRole('button');
      await expect(buttons).toHaveCount(1);
      await expect(buttons).toHaveAccessibleName('Clear selection');
      await expect(page.locator('#item-detail .detail-description')).toContainText(data.items[`${chain.id}_1`].name);
      const detail = (await page.locator('#item-detail').boundingBox())!;
      const button = (await buttons.boundingBox())!;
      const board = (await page.locator('#board').boundingBox())!;
      const sourceBox = (await source(page, initial, chain.id).boundingBox())!;
      const bar = await page.locator('.phone-bar').boundingBox();
      expect(sourceBox.width).toBeGreaterThanOrEqual(44);
      expect(sourceBox.height).toBeGreaterThanOrEqual(44);
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(button.x).toBeGreaterThanOrEqual(detail.x - 1);
      expect(button.x + button.width).toBeLessThanOrEqual(detail.x + detail.width + 1);
      expect(detail.y).toBeGreaterThanOrEqual(board.y + board.height - 1);
      if (bar) expect(detail.y + detail.height).toBeLessThanOrEqual(bar.y + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    }
  });
}
