import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { unresolvedObstacle } from '../../src/model.ts';
import { actOne, appearance, checkpoint, data, saved, source, start, tile } from './support.ts';

/** The game after count preparations, with coins for paid takes. */
const afterPreparations = (count: number) => checkpoint(count, count < data.tasks.length ? { ready: true } : { coins: 100 });
const count = (state: { board: ({ code: string } | null)[] }, code: string) => state.board.filter(cell => cell?.code === code).length;
/** Drags with the mouse from the centre of one element to the centre of another, in small steps. */
async function drag(page: Page, from: Locator, to: Locator) {
  const [a, b] = [(await from.boundingBox())!, (await to.boundingBox())!];
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 }); await page.mouse.up();
}

for (const preparations of [0, 12, 20, 24]) test(`sources give only stage-one ingredients after ${preparations} preparations`, async ({ page }) => {
  const initial = afterPreparations(preparations);
  await start(page, initial);
  const before = await saved(page);
  await source(page, 'grain').click();
  const after = await saved(page);
  expect(count(after, 'grain_1')).toBe(count(before, 'grain_1') + 1);
  expect(count(after, 'grain_2')).toBe(count(before, 'grain_2'));
  expect(after.coins).toBe(before.coins - data.economy.takeCost);
  await expect(page.locator('#status')).toHaveText(`Took ${data.items.grain_1.name} for 1 coin.`);
  // A take selects nothing on the board.
  await expect(page.locator('#board .selected')).toHaveCount(0);
  // The Herb basket is free.
  await source(page, 'herbs').click();
  await expect(page.locator('#status')).toHaveText(`Took ${data.items.herbs_1.name}.`);
});

test('keyboard source activation produces stage one repeatedly and keeps focus', async ({ page }) => {
  const initial = afterPreparations(20);
  await start(page, initial);
  await appearance(page, 'light');
  const button = source(page, 'grain');
  const before = await saved(page);
  await button.focus();
  for (const key of ['Enter', 'Space']) {
    await page.keyboard.press(key);
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS('outline-width', '3px');
  }
  const after = await saved(page);
  expect(count(after, 'grain_1')).toBe(count(before, 'grain_1') + 2);
  expect(after.coins).toBe(before.coins - 2 * data.economy.takeCost);
});

for (const viewport of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 412, height: 915 }]) {
  test(`repeated source taps keep the board and the tab still at ${viewport.width} by ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Quests are open and the purse stays above the recovery floor, so the tickets do not change while the source takes.
    const initial = checkpoint(20, { coins: 100 });
    await start(page, initial);
    const crate = source(page, 'vegetables'), before = (await crate.boundingBox())!, board = await page.locator('#board').boundingBox();
    const x = before.x + before.width / 2, y = before.y + before.height / 2;
    await page.mouse.click(x, y);
    expect(await crate.boundingBox()).toEqual(before);
    expect(await page.locator('#board').boundingBox()).toEqual(board);
    await page.mouse.click(x, y);
    expect(count(await saved(page), 'vegetables_1')).toBe(count(initial, 'vegetables_1') + 2);
  });
}

test('each take from a paid source spends its cost across reload, and the Herb basket stays free', async ({ page }) => {
  const initial = afterPreparations(20);
  await start(page, initial);
  await source(page, 'grain').click();
  await source(page, 'grain').click();
  const after = await saved(page);
  expect(after.coins).toBe(initial.coins - 2 * data.economy.takeCost);
  expect(count(after, 'grain_1')).toBe(count(initial, 'grain_1') + 2);
  await page.reload();
  await source(page, 'herbs').click();
  const herbs = await saved(page);
  expect(herbs.coins).toBe(after.coins);
  expect(count(herbs, 'herbs_1')).toBe(count(after, 'herbs_1') + 1);
});

test('a source on a full board takes nothing, spends nothing, and says why', async ({ page }) => {
  const initial = afterPreparations(20);
  initial.board = initial.board.map((cell, index) => cell ?? (unresolvedObstacle(initial, index, data) ? null : { code: 'grain_1' }));
  await start(page, initial);
  await source(page, 'grain').click();
  await expect(page.locator('#status')).toHaveText('The board is full. Merge a pair or deliver a quest.');
  expect(await saved(page)).toEqual(initial);
});

test('touch takes stage one with reduced motion', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    const initial = afterPreparations(20);
    await start(page, initial);
    await source(page, 'grain').tap();
    const before = await saved(page);
    await source(page, 'grain').tap();
    expect(count(await saved(page), 'grain_1')).toBe(count(before, 'grain_1') + 1);
    expect(await page.locator('#board').evaluate(board => board.getAnimations({ subtree: true }).length)).toBe(0);
  } finally { await context.close(); }
});

test('a drag moves a source to another place, a drop on a free place puts it last, a drop outside changes nothing, and the order survives a reload', async ({ page }) => {
  const initial = actOne();
  await start(page, initial);
  await expect(page.locator('#sources [data-source]')).toHaveCount(4);
  const places = page.locator('#sources .source-slot');
  await drag(page, source(page, 'pickles'), source(page, 'grain'));
  expect((await saved(page)).sources).toEqual(['pickles', 'grain', 'corn', 'herbs']);
  expect(await page.locator('#sources [data-source]').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.source))).toEqual(['pickles', 'grain', 'corn', 'herbs']);
  await drag(page, source(page, 'pickles'), places.nth(10));
  expect((await saved(page)).sources).toEqual(['grain', 'corn', 'herbs', 'pickles']);
  // A drag only moves: no take, no sale, and no change to the board.
  const moved = await saved(page);
  expect(moved.board).toEqual(initial.board);
  expect(moved.coins).toBe(initial.coins);
  await drag(page, source(page, 'grain'), tile(page, 20));
  expect(await saved(page)).toEqual(moved);
  await expect(page.getByRole('dialog')).toBeHidden();
  await drag(page, source(page, 'herbs'), source(page, 'grain'));
  await page.reload();
  expect(await page.locator('#sources [data-source]').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.source))).toEqual(['herbs', 'grain', 'corn', 'pickles']);
});

test('Alt and an arrow key move the focused source by one place, and the focus stays on it', async ({ page }) => {
  await start(page, actOne());
  const windmill = source(page, 'grain');
  await windmill.focus();
  await page.keyboard.press('Alt+ArrowDown');
  expect((await saved(page)).sources).toEqual(['corn', 'grain', 'herbs', 'pickles']);
  await expect(windmill).toBeFocused();
  await expect(windmill).toHaveAccessibleName(/Place 2 of 4$/);
  await expect(page.locator('#status')).toHaveText(`${data.items.generator_grain.name}: place 2 of 4.`);
  await page.keyboard.press('Alt+ArrowUp'); await page.keyboard.press('Alt+ArrowUp');
  expect((await saved(page)).sources).toEqual(['grain', 'corn', 'herbs', 'pickles']);
  await expect(windmill).toBeFocused();
  // The arrow keys alone move the focus, and the order stays.
  await page.keyboard.press('ArrowDown');
  await expect(source(page, 'corn')).toBeFocused();
  await page.keyboard.press('End');
  await expect(source(page, 'pickles')).toBeFocused();
  expect((await saved(page)).sources).toEqual(['grain', 'corn', 'herbs', 'pickles']);
});

for (const mode of ['Light', 'Dark']) for (const viewport of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`the source tab keeps a place for every source and shares the edges of the board in ${mode} at ${viewport.width} by ${viewport.height}`, async ({ browser, baseURL }) => {
    let reserved: { x: number; y: number; width: number; height: number } | null = null;
    for (const state of [actOne(), afterPreparations(20)]) {
      const context = await browser.newContext({ baseURL, viewport }), page = await context.newPage();
      await start(page, state);
      await appearance(page, mode);
      const tab = page.locator('#sources'), board = page.locator('#board');
      reserved ??= (await tab.boundingBox())!;
      await expect(tab.locator('.source-slot')).toHaveCount(data.chains.length);
      await expect(tab.locator('[data-source]')).toHaveCount(state.sources.length);
      // The tab keeps its size, so a new source never moves the board.
      const box = (await tab.boundingBox())!, grid = (await board.boundingBox())!;
      expect([box.width,box.height]).toEqual([reserved.width,reserved.height]);
      expect(Math.abs(box.y - grid.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.y + box.height - grid.y - grid.height)).toBeLessThanOrEqual(1);
      expect(box.x + box.width).toBeLessThan(grid.x);
      for (const chain of state.sources) {
        const place = (await source(page, chain).boundingBox())!;
        expect(place.width).toBeGreaterThanOrEqual(34);
        expect(place.x).toBeGreaterThanOrEqual(box.x - 1); expect(place.x + place.width).toBeLessThanOrEqual(box.x + box.width + 1);
        const cost = source(page, chain).locator('.take-cost');
        if (await cost.count()) {
          const pill = (await cost.boundingBox())!;
          expect(pill.x).toBeGreaterThanOrEqual(place.x); expect(pill.y + pill.height).toBeLessThanOrEqual(place.y + place.height + 0.5);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await context.close();
    }
  });
}
