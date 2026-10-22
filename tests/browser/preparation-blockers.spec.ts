import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { boardObstacles, firstFreeBoardCell, freeBoardCells, requiredQuests, pendingPreparationObstacles, unresolvedObstacle } from '../../src/model.ts';
import { reduceGame, validateGame } from '../../src/engine.ts';
import { deliverRequired } from '../../tools/create-checkpoint-saves.ts';
import type { GameState } from '../../src/model.ts';
import { checkpoint, data, failWrites, forward, pay, replaceSave, revealed, saved, startStill as start, tile, know } from './support.ts';

/** The game after count preparations, ready to pay the next one, with the preparation-blocker record starting there. */
function beforeBatch(count = 0) {
  // Each payment comes on the earliest day that its quests and its chapter permit.
  let state = checkpoint(0);
  for (let index = 0; index < count; index++) {
    deliverRequired(state, data);
    state.coins = data.tasks[index].cost;
    const paid = reduceGame(state, { type: 'task' }, data);
    expect(paid.ok, paid.message).toBe(true); state = paid.state;
  }
  // The preparation-blocker record starts at this preparation, with no earlier batch.
  state.preparationObstacles = { start: count, placed: [] };
  state.resolvedObstacles = state.resolvedObstacles.filter(id => data.board.layouts.find(layout => layout.id === state.layoutId)!.obstacles.some(obstacle => obstacle.id === id));
  state.pendingScenes = [];
  deliverRequired(state, data);
  state.coins = data.tasks[count].cost;
  expect(validateGame(state, data)).toBe(true); return state;
}
/** The game just after the payment of the preparation at count, which placed its batch of blockers. */
function withBatch(count = 0) {
  const result = reduceGame(beforeBatch(count), { type: 'task' }, data);
  expect(result.ok, result.message).toBe(true); return result.state;
}
/** Pays the next preparation, closes its story, and waits for the room change. */
async function payAndClose(page: Page) {
  await pay(page).click();
  await expect(forward(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await revealed(page);
}
const active = (state: GameState) => boardObstacles(state, data).filter(obstacle => obstacle.context && !state.resolvedObstacles.includes(obstacle.id));
async function expectPreparationImage(art: Locator) {
  const image = await art.evaluate(async element => {
    const style = getComputedStyle(element), url = style.backgroundImage.match(/url\(["']?([^"')]+)/)?.[1];
    if (!url) return { loaded: false, local: false };
    const image = new Image(); image.src = url; await image.decode();
    return { loaded: image.naturalWidth > 0, local: new URL(url).origin === location.origin && new URL(url).pathname.startsWith(new URL('assets/variants/', document.baseURI).pathname) };
  });
  expect(image).toEqual({ loaded: true, local: true });
}
async function expectFrameFit(art: Locator, columns: number, rows: number, index: number) {
  const fit = await art.evaluate(async (element, { columns, rows, index }) => {
    const style = getComputedStyle(element), image = new Image();
    image.src = style.backgroundImage.match(/url\(["']?([^"')]+)/)![1]; await image.decode();
    const scale = style.backgroundSize.split(' ').map(parseFloat);
    const width = image.naturalWidth * 100 / scale[0], height = image.naturalHeight * 100 / scale[1];
    const x = parseFloat(style.backgroundPositionX) / 100 * (image.naturalWidth - width);
    const y = parseFloat(style.backgroundPositionY) / 100 * (image.naturalHeight - height);
    const cellWidth = image.naturalWidth / columns, cellHeight = image.naturalHeight / rows;
    const left = index % columns * cellWidth, top = Math.floor(index / columns) * cellHeight;
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d')!; context.drawImage(image,x,y,width,height,0,0,256,256);
    const pixels = context.getImageData(0,0,256,256).data;
    let x0=256,y0=256,x1=-1,y1=-1;
    for(let py=0;py<256;py++)for(let px=0;px<256;px++)if(pixels[(py*256+px)*4+3]>=128){
      x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py);
    }
    return { square: Math.abs(width-height),
      inside: x>=left-.05 && y>=top-.05 && x+width<=left+cellWidth+.05 && y+height<=top+cellHeight+.05,
      width:(x1-x0+1)/256,height:(y1-y0+1)/256,
      offsetX:Math.abs((x0+x1+1)/512-.5),offsetY:Math.abs((y0+y1+1)/512-.5) };
  }, { columns, rows, index });
  expect(fit.square).toBeLessThan(.05); expect(fit.inside).toBe(true);
  expect(fit.width).toBeGreaterThan(.9); expect(fit.height).toBeGreaterThan(.87);
  expect(fit.offsetX).toBeLessThan(.025); expect(fit.offsetY).toBeLessThan(.025);
}

test('initial blocker frames fill their tiles without sampling neighbouring sprites', async ({ page }) => {
  await start(page, checkpoint(0));
  for(let index=0;index<6;index++)await expectFrameFit(page.locator(`.clutter-art-${index}`).first(),3,2,index);
});

test('a failed preparation save adopts no batch and keeps the coins, progress, and room', async ({ page }) => {
  const initial = beforeBatch(); delete initial.preparationObstacles;
  await start(page, initial);
  const label = await page.locator('#board').getAttribute('aria-label'), painting = await page.locator('#room-frame').getAttribute('data-painting');
  await failWrites(page);
  await pay(page).click();
  await expect(page.locator('#status')).toContainText('The preparation was not saved. No coins were spent.');
  expect(await saved(page)).toEqual(initial);
  await expect(page.locator('#coins')).toHaveText(String(initial.coins));
  await expect(page.locator('#board')).toHaveAttribute('aria-label', label!);
  await expect(page.locator('.preparation-art')).toHaveCount(0);
  await expect(page.locator('.story-controls')).toHaveCount(0); await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#room-frame')).toHaveAttribute('data-painting', painting!);
  await expect(page.locator('#room-stage')).not.toHaveAttribute('data-reveal');
  await page.reload(); expect(await saved(page)).toEqual(initial);
  await expect(page.locator('.preparation-art')).toHaveCount(0);
});

test('paying a preparation adds its contextual batch once and retains it after reload', async ({ page }) => {
  const initial = beforeBatch(); await start(page, initial);
  await expect(page.locator('.preparation-art')).toHaveCount(0);
  await payAndClose(page);
  const paid = await saved(page), batch = data.board.preparations[0];
  expect(paid.taskIndex).toBe(1); expect(paid.coins).toBe(0);
  expect(paid.board).toEqual(initial.board); expect(paid.completedQuests).toEqual(initial.completedQuests);
  expect(active(paid).map(obstacle => obstacle.id)).toEqual(batch.obstacles.map(obstacle => obstacle.id));
  for (const obstacle of active(paid)) {
    await expect(tile(page, obstacle.position)).toHaveAccessibleName(new RegExp(obstacle.name));
    expect(await tile(page, obstacle.position).getAttribute('aria-label')).toContain(batch.context);
  }
  await tile(page, active(paid)[0].position).click();
  await expect(page.locator('#status')).toContainText(batch.context);
  await expect(page.locator('#status')).toContainText(/tap a marked Flour( or [^.]+)? to merge here/);
  await page.reload(); expect(await saved(page)).toEqual(paid);
  expect(active(await saved(page))).toHaveLength(batch.obstacles.length);
});

test('a matching merge clears preparation clutter without respawning it', async ({ page }) => {
  const initial = withBatch(), obstacle = active(initial).find(value => value.type === 'clutter')!;
  const source = firstFreeBoardCell(initial, data); initial.board[source] = { code: obstacle.ingredient };
  await start(page, initial); await tile(page, source).click(); await tile(page, obstacle.position).click();
  const after = await saved(page);
  expect(after.resolvedObstacles).toContain(obstacle.id);
  expect(after.board[obstacle.position]).toEqual({ code: data.items[obstacle.ingredient].next });
  expect(after.preparationObstacles!.placed).toEqual(initial.preparationObstacles!.placed);
  await expect(tile(page, obstacle.position)).not.toHaveClass(/clutter/);
  await page.reload(); expect(await saved(page)).toEqual(after);
  await expect(tile(page, obstacle.position)).not.toHaveClass(/clutter/);
});

test('a full board defers the batch and merges place it while keeping four free cells', async ({ page }) => {
  const initial = beforeBatch();
  initial.board = initial.board.map((cell, index) => cell ?? (unresolvedObstacle(initial, index, data) ? null : { code: 'grain_1' }));
  // Six merges of two Flours: each one frees the cell of its first Flour. One Linden tea from scratch needs four free cells.
  const flours = initial.board.flatMap((cell, index) => cell?.code === 'grain_1' ? [index] : []);
  const merges = Array.from({ length: 6 }, (_, at) => [flours[2 * at], flours[2 * at + 1]]);
  await start(page, initial); await payAndClose(page);
  let state = await saved(page);
  expect(active(state)).toHaveLength(0); expect(pendingPreparationObstacles(state, data)).toHaveLength(2);
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /0 free spaces, 2 preparation blockers waiting/);
  for (const [index, [from, to]] of merges.entries()) {
    await tile(page, from).click(); await tile(page, to).click();
    state = await saved(page);
    expect(freeBoardCells(state, data)).toBe(Math.min(index + 1, 4));
    expect(active(state)).toHaveLength(Math.max(0, index - 3));
  }
  expect(pendingPreparationObstacles(state, data)).toHaveLength(0);
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /4 free spaces$/);
  await page.reload(); expect(await saved(page)).toEqual(state);
});

test('blocker guidance finds a preparation ingredient and the keyboard releases it', async ({ page }) => {
  const initial = withBatch(2), anchor = active(initial).find(value => value.type === 'anchored')!;
  const source = firstFreeBoardCell(initial, data); initial.board[source] = { code: anchor.ingredient };
  if (!initial.discovered.includes(anchor.ingredient)) know(initial,anchor.ingredient);
  const wanted = data.items[anchor.ingredient].next!;
  await start(page, initial); await tile(page, anchor.position).click();
  await expect(tile(page, source)).toHaveClass(/blocker-target/);
  await tile(page, source).focus(); await page.keyboard.press('Enter');
  await expect(tile(page, anchor.position)).not.toHaveClass(/anchored/);
  const after = await saved(page);
  expect(after.resolvedObstacles).toContain(anchor.id); expect(after.board[anchor.position]).toEqual({ code: wanted });
  await page.reload(); expect(await saved(page)).toEqual(after);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 390, height: 800 }]) for (const theme of ['light', 'dark']) {
  test(`preparation artwork fits ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); const initial = withBatch(); await start(page, initial, theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const obstacle of active(initial)) {
      const cell = tile(page, obstacle.position), box = (await cell.boundingBox())!;
      expect(await cell.evaluate(element => getComputedStyle(element, '::before').backgroundColor)).toBe('rgba(184, 38, 44, 0.2)');
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
  await start(page, withBatch(), theme);
  for (let sprite = 0; sprite < 12; sprite++) {
    const count = data.board.preparations.findIndex(batch => batch.obstacles.some(obstacle => obstacle.atlas === 'preparation' && obstacle.sprite === sprite));
    expect(count, `batch using sprite ${sprite}`).toBeGreaterThanOrEqual(0);
    const state = withBatch(count); state.pendingScenes = [];
    await replaceSave(page, state);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const obstacle = active(state).find(obstacle => obstacle.atlas === 'preparation' && obstacle.sprite === sprite)!;
    expect(obstacle, `placed sprite ${sprite}`).toBeDefined();
    const cell = tile(page, obstacle.position), art = cell.locator('.preparation-art');
    await expect(art).toBeVisible(); await expect(art).toHaveClass(new RegExp(`preparation-art-${sprite}(?: |$)`));
    await expectFrameFit(art,4,3,sprite);
    await expectPreparationImage(art);
    await cell.screenshot({ path: testInfo.outputPath(`atlas-${sprite}.png`) });
  }
});
