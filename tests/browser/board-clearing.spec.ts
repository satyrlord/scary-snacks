import { test, expect } from '@playwright/test';
import { requiredQuests } from '../../src/model.ts';
import { createGame, reduceGame } from '../../src/engine.ts';
import { data, saved, start, tile } from './support.ts';

test('new board explains blocked spaces and counts only usable empty cells', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /27 free spaces/);
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Old crate, blocked Pogăcele/);
  await expect(tile(page, 0).locator('.clutter-overlay')).toHaveCount(1);
  await expect(tile(page, 0).locator('.food')).toBeVisible();
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /blocked Dough.*Merge a matching movable ingredient/);
  await tile(page, 0).focus();
  await page.keyboard.press('ArrowDown');
  await expect(tile(page, 6)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#status')).toContainText('merge a movable Dough');
  await expect(page.locator('.cell.clutter')).toHaveCount(4);
  await expect(page.locator('.cell.anchored')).toHaveCount(4);
});

test('a pointer merge clears only its destination and can then clear the adjacent blocker', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, createGame(data));
  await tile(page, 13).click();
  await tile(page, 14).click();
  await tile(page, 6).click();
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Pogăcele/);
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Pogăcele/);
  const state = await saved(page);
  expect(state.resolvedObstacles).toEqual(['tied-dough']);
  expect(state.board[6]).toEqual({ code: 'bakery_3' });
  await expect(tile(page, 0)).toHaveClass(/clutter/);
  await expect(tile(page, 6)).toHaveAttribute('aria-pressed', 'true');
  await tile(page, 0).click();
  await expect(tile(page, 0)).not.toHaveClass(/clutter/);
  expect(await tile(page, 0).evaluate(cell => getComputedStyle(cell, '::before').content)).toBe('none');
  expect((await saved(page)).board[0]).toEqual({ code: 'bakery_4' });
  await page.reload();
  await expect(tile(page, 0)).not.toHaveClass(/clutter/);
  expect((await saved(page)).board[0]).toEqual({ code: 'bakery_4' });
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
  expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
});

test('keyboard selection can merge into an anchored cell', async ({ page }) => {
  await start(page, createGame(data));
  await tile(page, 13).focus();
  await page.keyboard.press('Enter');
  await tile(page, 14).focus();
  await page.keyboard.press('Enter');
  await tile(page, 6).focus();
  await page.keyboard.press('Enter');
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Pogăcele/);
  expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
});

test('touch can release an anchor with two taps', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await start(page, createGame(data));
    await tile(page, 13).tap();
    await tile(page, 14).tap();
    await tile(page, 6).tap();
    await expect(tile(page, 0)).toHaveAttribute('aria-label', /Pogăcele/);
    expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
    await expect(tile(page, 0)).toHaveClass(/clutter/);
  } finally { await context.close(); }
});

test('Find a match selects movable food and points to matching clutter', async ({ page }) => {
  const state = createGame(data);
  state.board = state.board.map(cell => cell && data.items[cell.code].generator ? cell : null);
  state.board[13] = { code: 'bakery_3' };
  if (!state.discovered.includes('bakery_3')) state.discovered.push('bakery_3');
  await start(page, state); await page.getByRole('button', { name: 'Find a match', exact: true }).click();
  await expect(tile(page, 13)).toHaveAttribute('aria-pressed', 'true');
  await expect(tile(page, 0)).toHaveClass(/hint/);
  await expect(page.locator('#status')).toHaveText('Tap the blocked Pogăcele to merge and clear it.');
  await tile(page, 0).click();
  expect((await saved(page)).board[0]).toEqual({ code: 'bakery_4' });
  await expect(tile(page, 0)).not.toHaveClass(/obstacle/);
});

test('the first preparation removes the webs without clearing the clutter blockers', async ({ page }) => {
  const state = createGame(data);
  state.coins = data.tasks[0].cost;
  state.completedQuests = requiredQuests(0, data).map(quest => quest.id);
  const paid = reduceGame(state, { type: 'task' }, data);
  expect(paid.ok, paid.message).toBe(true);
  await start(page, paid.state);
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Old crate, blocked Pogăcele/);
  await expect(tile(page, 0).locator('.clutter-overlay')).toHaveCount(0);
  await expect(tile(page, 0).locator('.clutter-art')).toHaveCount(1);
  await expect(page.locator('.cell.clutter')).toHaveCount(4 + data.board.preparations[0].obstacles.filter(obstacle => obstacle.type === 'clutter').length);
});
