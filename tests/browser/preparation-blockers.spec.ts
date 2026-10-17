import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { boardObstacles, createGame, firstFreeBoardCell, freeBoardCells, menuReward, pendingPreparationObstacles, reduceGame, unresolvedObstacle, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData = JSON.parse(readFileSync('public/data/game.json', 'utf8'));
const tile = (page: Page, index: number) => page.locator(`[data-cell="${index}"]`);
function checkpoint(count = 0) {
  let state = createGame(data);
  for (let index = 0; index < count; index++) {
    Object.assign(state, data.tasks[index].goals, { coins: data.tasks[index].cost });
    const paid = reduceGame(state, { type: 'task' }, data);
    expect(paid.ok, paid.message).toBe(true); state = paid.state;
  }
  // This checkpoint adopts the feature here. It has no earlier preparation queue.
  state.preparationObstacles = { start: count, placed: [] };
  state.resolvedObstacles = state.resolvedObstacles.filter(id => data.board.layouts.find(layout => layout.id === state.layoutId)!.obstacles.some(obstacle => obstacle.id === id));
  state.pendingScenes = [];
  Object.assign(state, data.tasks[count].goals, { coins: data.tasks[count].cost });
  expect(validateGame(state, data)).toBe(true); return state;
}
function paidCheckpoint(count = 0) {
  const result = reduceGame(checkpoint(count), { type: 'task' }, data);
  expect(result.ok, result.message).toBe(true); return result.state;
}
async function start(page: Page, state: GameState, theme = 'light') {
  const value = exportSave(state, candidate => validateGame(candidate, data));
  await page.addInitScript(({ key, value, theme }) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    localStorage.setItem('scary-snacks-theme', theme);
  }, { key: SAVE_KEY, value, theme });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./'); await expect(page.locator('#board button')).toHaveCount(42);
}
async function saved(page: Page): Promise<GameState> {
  return page.evaluate(key => navigator.locks.request(key, () => JSON.parse(localStorage.getItem(key)!).state), SAVE_KEY);
}
async function pay(page: Page) {
  await page.locator('#story').getByRole('button', { name: /^Pay / }).click();
  await expect(page.locator('.story-controls .primary-button')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal', 'done');
}
const active = (state: GameState) => boardObstacles(state, data).filter(obstacle => obstacle.context && !state.resolvedObstacles.includes(obstacle.id));
async function expectPreparationImage(art: Locator) {
  const image = await art.evaluate(async element => {
    const style = getComputedStyle(element), url = style.backgroundImage.match(/url\(["']?([^"')]+)/)?.[1];
    if (!url) return { loaded: false, local: false };
    const image = new Image(); image.src = url; await image.decode();
    return { loaded: image.naturalWidth > 0, local: new URL(url).origin === location.origin && new URL(url).pathname.startsWith('/scary-snacks/assets/variants/') };
  });
  expect(image).toEqual({ loaded: true, local: true });
}

test('a failed preparation save adopts no batch and keeps the coins and progress', async ({ page }) => {
  const initial = checkpoint(); delete initial.preparationObstacles;
  await start(page, initial);
  const label = await page.locator('#board').getAttribute('aria-label');
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name, value) {
      if (name === key) throw new DOMException('Storage is full.', 'QuotaExceededError');
      original.call(this, name, value);
    };
  }, SAVE_KEY);
  await page.locator('#story').getByRole('button', { name: /^Pay / }).click();
  await expect(page.locator('#status')).toContainText('The preparation was not saved. No coins were spent.');
  expect(await saved(page)).toEqual(initial);
  await expect(page.locator('#coins')).toHaveText(String(initial.coins));
  await expect(page.locator('#board')).toHaveAttribute('aria-label', label!);
  await expect(page.locator('.preparation-art')).toHaveCount(0);
  await expect(page.locator('.story-controls')).toHaveCount(0);
  await expect(page.locator('#room-stage')).not.toHaveAttribute('data-reveal');
  await page.reload(); expect(await saved(page)).toEqual(initial);
  await expect(page.locator('.preparation-art')).toHaveCount(0);
});

test('paying a preparation adds its contextual batch once and retains it after reload', async ({ page }) => {
  const initial = checkpoint(); await start(page, initial);
  await expect(page.locator('.preparation-art')).toHaveCount(0);
  await pay(page);
  const paid = await saved(page), batch = data.board.preparations[0];
  expect(paid.taskIndex).toBe(1); expect(paid.coins).toBe(0);
  expect(paid.board).toEqual(initial.board); expect(paid.orders).toEqual(initial.orders);
  expect(active(paid).map(obstacle => obstacle.id)).toEqual(batch.obstacles.map(obstacle => obstacle.id));
  for (const obstacle of active(paid)) {
    await expect(tile(page, obstacle.position)).toHaveAccessibleName(new RegExp(obstacle.name));
    expect(await tile(page, obstacle.position).getAttribute('aria-label')).toContain(batch.context);
  }
  await tile(page, active(paid)[0].position).click();
  await expect(page.locator('#status')).toContainText(batch.context);
  await expect(page.locator('#status')).toContainText('merge into a space beside it');
  await page.reload(); expect(await saved(page)).toEqual(paid);
  expect(active(await saved(page))).toHaveLength(batch.obstacles.length);
});

test('a merge beside preparation clutter reveals its ingredient without respawning it', async ({ page }) => {
  const initial = paidCheckpoint(), obstacle = active(initial).find(value => value.type === 'clutter')!;
  const neighbors = [obstacle.position - 6, obstacle.position + 6, ...(obstacle.position % 6 ? [obstacle.position - 1] : []), ...(obstacle.position % 6 < 5 ? [obstacle.position + 1] : [])];
  const destination = neighbors.find(index => index >= 0 && index < initial.board.length && !initial.board[index] && !unresolvedObstacle(initial, index, data))!;
  expect(destination).toBeDefined(); initial.board[destination] = { code: 'bakery_1' };
  const source = firstFreeBoardCell(initial, data); initial.board[source] = { code: 'bakery_1' };
  await start(page, initial); await tile(page, source).click(); await tile(page, destination).click();
  const after = await saved(page);
  expect(after.resolvedObstacles).toContain(obstacle.id);
  expect(after.board[obstacle.position]).toEqual({ code: obstacle.ingredient });
  expect(after.preparationObstacles!.placed).toEqual(initial.preparationObstacles!.placed);
  await expect(tile(page, obstacle.position)).not.toHaveClass(/clutter/);
  await page.reload(); expect(await saved(page)).toEqual(after);
  await expect(tile(page, obstacle.position)).not.toHaveClass(/clutter/);
});

test('a full board defers the batch and sales place it while keeping three free cells', async ({ page }) => {
  const initial = checkpoint();
  initial.board = initial.board.map((cell, index) => cell ?? (unresolvedObstacle(initial, index, data) ? null : { code: 'bakery_1' }));
  const sellable = initial.board.flatMap((cell, index) => cell?.code === 'bakery_1' ? [index] : []).slice(0, 5);
  await start(page, initial); await pay(page);
  let state = await saved(page);
  expect(active(state)).toHaveLength(0); expect(pendingPreparationObstacles(state, data)).toHaveLength(2);
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /0 free spaces, 2 preparation blockers waiting/);
  for (const [index, position] of sellable.entries()) {
    await tile(page, position).click(); await page.getByRole('button', { name: /^Sell for / }).click();
    state = await saved(page);
    expect(freeBoardCells(state, data)).toBe(Math.min(index + 1, 3));
    expect(active(state)).toHaveLength(Math.max(0, index - 2));
  }
  expect(pendingPreparationObstacles(state, data)).toHaveLength(0);
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /3 free spaces$/);
  await page.reload(); expect(await saved(page)).toEqual(state);
});

test('order guidance finds a preparation anchor and the keyboard releases it', async ({ page }) => {
  const initial = paidCheckpoint(2), anchor = active(initial).find(value => value.type === 'anchored')!;
  const source = firstFreeBoardCell(initial, data); initial.board[source] = { code: anchor.ingredient };
  const wanted = data.items[anchor.ingredient].next!;
  initial.orders[0] = { ...initial.orders[0], requirements: [wanted], reward: menuReward([wanted], data), pricing: 'menu-1' };
  await start(page, initial);
  await page.locator('#orders .order').first().locator('.order-item').first().click();
  await page.getByRole('button', { name: 'Show me on the board' }).click();
  await expect(tile(page, source)).toHaveAttribute('aria-pressed', 'true');
  await expect(tile(page, anchor.position)).toHaveClass(/hint/);
  await tile(page, anchor.position).focus(); await page.keyboard.press('Enter');
  await expect(tile(page, anchor.position)).not.toHaveClass(/anchored/);
  const after = await saved(page);
  expect(after.resolvedObstacles).toContain(anchor.id); expect(after.board[anchor.position]).toEqual({ code: wanted });
  await page.reload(); expect(await saved(page)).toEqual(after);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 390, height: 800 }]) for (const theme of ['light', 'dark']) {
  test(`preparation artwork fits ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); const initial = paidCheckpoint(); await start(page, initial, theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const obstacle of active(initial)) {
      const cell = tile(page, obstacle.position), box = (await cell.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      expect(box.width).toBeGreaterThanOrEqual(43.5); expect(box.height).toBeGreaterThanOrEqual(43.5);
    }
    const art = page.locator('.preparation-art').first(); await expect(art).toBeVisible();
    await expectPreparationImage(art);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('preparation-blockers.png') });
  });
}

for (const theme of ['light', 'dark']) test(`all twelve preparation atlas tiles render in ${theme}`, async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await start(page, paidCheckpoint(), theme);
  for (let sprite = 0; sprite < 12; sprite++) {
    const count = data.board.preparations.findIndex(batch => batch.obstacles.some(obstacle => obstacle.atlas === 'preparation' && obstacle.sprite === sprite));
    expect(count, `batch using sprite ${sprite}`).toBeGreaterThanOrEqual(0);
    const state = paidCheckpoint(count); state.pendingScenes = [];
    const value = exportSave(state, candidate => validateGame(candidate, data));
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: SAVE_KEY, value });
    await page.reload(); await expect(page.locator('#board button')).toHaveCount(42);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const obstacle = active(state).find(obstacle => obstacle.atlas === 'preparation' && obstacle.sprite === sprite)!;
    expect(obstacle, `placed sprite ${sprite}`).toBeDefined();
    const cell = tile(page, obstacle.position), art = cell.locator(`.preparation-art-${sprite}`);
    await expect(art).toBeVisible(); await expect(art).toHaveClass(new RegExp(`preparation-art-${sprite}(?: |$)`));
    await expect(art).toHaveCSS('background-size', '400% 300%');
    const position = await art.evaluate(element => {
      const style = getComputedStyle(element);
      return [parseFloat(style.backgroundPositionX), parseFloat(style.backgroundPositionY)];
    });
    expect(position[0]).toBeCloseTo(sprite % 4 * 100 / 3, 3);
    expect(position[1]).toBe(Math.floor(sprite / 4) * 50);
    await expectPreparationImage(art);
    await cell.screenshot({ path: testInfo.outputPath(`atlas-${sprite}.png`) });
  }
});
