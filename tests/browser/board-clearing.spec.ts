import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, menuReward, reduceGame, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData = JSON.parse(readFileSync('public/data/game.json', 'utf8'));
const tile = (page: Page, index: number) => page.locator(`[data-cell="${index}"]`);
async function start(page: Page, state?: GameState) {
  if (state) {
    const save = exportSave(state, candidate => validateGame(candidate, data));
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [SAVE_KEY, save]);
  }
  await page.goto('./');
  await expect(page.locator('#board button')).toHaveCount(42);
}
async function saved(page: Page): Promise<GameState> {
  return page.evaluate(key => navigator.locks.request(key, () => JSON.parse(localStorage.getItem(key)!).state), SAVE_KEY);
}

test('new board explains blocked spaces and counts only usable empty cells', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /27 free spaces/);
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Old crate, clutter.*Covered in webs/);
  await expect(tile(page, 0).locator('.clutter-overlay')).toHaveCount(1);
  await expect(tile(page, 0)).not.toHaveAttribute('aria-label', /Pogăcele/);
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /anchored Dough.*Merge a matching movable ingredient/);
  await tile(page, 0).focus();
  await page.keyboard.press('ArrowDown');
  await expect(tile(page, 6)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#status')).toContainText('merge a movable Dough');
  await expect(page.locator('.cell.clutter')).toHaveCount(4);
  await expect(page.locator('.cell.anchored')).toHaveCount(4);
});

test('a pointer merge into an anchor releases it and reveals adjacent clutter once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  await tile(page, 13).click();
  await tile(page, 14).click();
  await tile(page, 6).click();
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Pogăcele/);
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Pogăcele/);
  const state = await saved(page);
  expect(state.resolvedObstacles).toEqual(['tied-dough', 'old-crate']);
  expect(state.merges).toBe(2);
  await page.reload();
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Pogăcele/);
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Pogăcele/);
});

test('dragging a matching item into an anchor clears it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  await tile(page, 13).click();
  await tile(page, 14).click();
  const from = (await tile(page, 14).boundingBox())!;
  const to = (await tile(page, 6).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Pogăcele/);
  expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough', 'old-crate']);
});

test('keyboard selection can merge into an anchored cell', async ({ page }) => {
  await start(page);
  await tile(page, 13).focus();
  await page.keyboard.press('Enter');
  await tile(page, 14).focus();
  await page.keyboard.press('Enter');
  await tile(page, 6).focus();
  await page.keyboard.press('Enter');
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Pogăcele/);
  expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough', 'old-crate']);
});

test('touch can release an anchor with two taps', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await start(page);
    await tile(page, 13).tap();
    await tile(page, 14).tap();
    await tile(page, 6).tap();
    await expect(tile(page, 0)).toHaveAttribute('aria-label', /Pogăcele/);
    expect((await saved(page)).merges).toBe(2);
  } finally { await context.close(); }
});

test('order guidance points from one movable ingredient to its matching anchor', async ({ page }) => {
  const state = createGame(data);
  state.board[13] = null;
  state.board[14] = { code: 'bakery_2' };
  state.orders[0] = { ...state.orders[0], requirements: ['bakery_3'], reward: menuReward(['bakery_3'], data), pricing: 'menu-1' };
  await start(page, state);
  await page.locator('#orders .order').first().locator('.order-item').first().click();
  await page.getByRole('button', { name: 'Show me on the board' }).click();
  await expect(tile(page, 14)).toHaveAttribute('aria-pressed', 'true');
  await expect(tile(page, 6)).toHaveClass(/hint/);
  await expect(page.locator('#status')).toContainText('anchored Dough');
});

test('the first preparation removes wrapper webs without clearing the clutter', async ({ page }) => {
  const state = createGame(data);
  state.coins = data.tasks[0].cost;
  state.served = data.tasks[0].goals.served;
  state.merges = data.tasks[0].goals.merges;
  const paid = reduceGame(state, { type: 'task' }, data);
  expect(paid.ok, paid.message).toBe(true);
  await start(page, paid.state);
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Old crate, clutter/);
  await expect(tile(page, 0)).not.toHaveAttribute('aria-label', /Covered in webs/);
  await expect(tile(page, 0).locator('.clutter-art')).toHaveCount(1);
  await expect(page.locator('.cell.clutter')).toHaveCount(4);
});
