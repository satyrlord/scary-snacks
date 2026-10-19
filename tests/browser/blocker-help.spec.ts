import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { boardObstacles, requiredQuests } from '../../src/model.ts';
import { createGame, reduceGame } from '../../src/engine.ts';
import { data, saved, start as open, tile } from './support.ts';

const help = (page: Page) => page.locator('#item-detail.blocker-help');
function ready() {
  const state = createGame(data);
  state.completedQuests = requiredQuests(0, data).map(quest => quest.id);
  state.coins = data.tasks[0].cost;
  return state;
}
function firstPreparation() {
  const result = reduceGame(ready(), { type: 'task' }, data);
  expect(result.ok, result.message).toBe(true); return result.state;
}
async function start(page: Page, state = createGame(data), theme = 'light') {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, state, theme);
}
async function targets(page: Page) {
  return page.locator('#board .blocker-target').evaluateAll(elements => elements.map(element => Number((element as HTMLElement).dataset.cell)));
}

test('every opening blocker has a rule mark and selecting clutter replaces source details without a save change', async ({ page }) => {
  await start(page);
  for (const obstacle of boardObstacles(createGame(data), data)) {
    await expect(tile(page, obstacle.position).locator('svg.blocker-mark')).toBeVisible();
    await expect(tile(page, obstacle.position).locator('.food')).toBeVisible();
    await expect(tile(page, obstacle.position)).toHaveAttribute('title', /Merge/i);
  }
  await tile(page, 1).click(); await expect(page.locator('#item-detail.source-detail')).toContainText('Tap again for Flour.');
  const before = await saved(page);
  await tile(page, 0).click();
  await expect(help(page)).toBeVisible(); await expect(help(page).locator('.blocker-title')).toHaveText('Old crate');
  await expect(page.locator('#blocker-rule')).toHaveText('Tap a marked Pogăcele to merge here.');
  await expect(tile(page, 0)).toHaveAttribute('aria-pressed', 'true');
  expect(await targets(page)).toEqual([]);
  await expect(page.locator('#item-detail.source-detail')).toHaveCount(0);
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(help(page)).toHaveCount(0); expect(await targets(page)).toEqual([]);
  await expect(tile(page, 0)).toHaveAttribute('aria-pressed', 'false');
  expect(await saved(page)).toEqual(before);
});

test('blocker help marks matching movable ingredients anywhere on the board', async ({ page }) => {
  const state = createGame(data); state.board[18] = { code: 'bakery_3' };
  if (!state.discovered.includes('bakery_3')) state.discovered.push('bakery_3');
  await start(page, state); await tile(page, 0).click();
  expect(await targets(page)).toEqual([18]);
  await expect(page.locator('#blocker-rule')).toHaveText('Tap a marked Pogăcele to merge here.');
  await expect(tile(page, 18)).toHaveAttribute('aria-label', /Tap to merge into the selected blocked space$/);
  expect(await saved(page)).toEqual(state);
});

for (const [first, second] of [[0, 18], [18, 0]] as const) {
  test(`matching food clears a blocker in two taps, starting at cell ${first}`, async ({ page }) => {
    const initial = createGame(data);
    initial.board[18] = { code: 'bakery_3' };
    initial.discovered.push('bakery_3');
    await start(page, initial);
    await tile(page, first).click();
    expect(await saved(page)).toEqual(initial);
    if (first === 0) expect(await targets(page)).toEqual([18]);
    await tile(page, second).click();
    const expected = reduceGame(initial, { type: 'move', from: 18, to: 0 }, data);
    expect(expected.ok).toBe(true);
    expect(await saved(page)).toEqual(expected.state);
    await expect(tile(page, 0)).not.toHaveClass(/obstacle/);
    await page.reload();
    expect(await saved(page)).toEqual(expected.state);
  });
}

test('a nonmatching item leaves blocker help without using an ingredient', async ({ page }) => {
  const initial = createGame(data);
  await start(page, initial);
  await tile(page, 0).click();
  await tile(page, 13).click();
  await expect(help(page)).toHaveCount(0);
  await expect(tile(page, 13)).toHaveAttribute('aria-pressed', 'true');
  await expect(tile(page, 0)).toHaveClass(/obstacle/);
  expect(await saved(page)).toEqual(initial);
});

test('keyboard navigation clears a selected blocker with a matching ingredient', async ({ page }) => {
  const initial = createGame(data);
  initial.board[13] = null;
  initial.board[14] = { code: 'bakery_2' };
  initial.discovered.push('bakery_2');
  await start(page, initial);
  await tile(page, 6).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(tile(page, 14)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(tile(page, 6)).toBeFocused();
  expect((await saved(page)).board[6]).toEqual({ code: 'bakery_3' });
  expect((await saved(page)).board[14]).toBeNull();
  expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
});

test('touch clears a selected blocker with the second tap', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    const initial = createGame(data);
    initial.board[13] = null;
    initial.board[14] = { code: 'bakery_2' };
    initial.discovered.push('bakery_2');
    await start(page, initial);
    await tile(page, 6).tap();
    await tile(page, 14).tap();
    expect((await saved(page)).board[6]).toEqual({ code: 'bakery_3' });
    expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
  } finally { await context.close(); }
});

test('keyboard selection opens clutter help and Escape clears it without changing the board', async ({ page }) => {
  const initial = createGame(data); await start(page, initial);
  await tile(page, 0).focus(); await page.keyboard.press('Enter');
  await expect(help(page)).toBeVisible(); expect(await targets(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(help(page)).toHaveCount(0); expect(await targets(page)).toEqual([]);
  expect(await saved(page)).toEqual(initial);
});

test('a second tap on a selected blocker closes its help with the move hint', async ({ page }) => {
  const initial = createGame(data); await start(page, initial);
  await tile(page, 0).click(); await expect(help(page)).toBeVisible();
  await tile(page, 0).click();
  await expect(help(page)).toHaveCount(0); expect(await targets(page)).toEqual([]);
  await expect(tile(page, 0)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#status')).toHaveText('Tap an item, then tap where it should go.');
  expect(await saved(page)).toEqual(initial);
});

test('new preparation blocker identifies matching movable ingredients', async ({ page }) => {
  const state = firstPreparation();
  const obstacle = boardObstacles(state, data).find(obstacle => obstacle.atlas === 'preparation')!;
  expect(obstacle.position).toBe(2);
  await start(page, state); await tile(page, obstacle.position).click();
  await expect(help(page)).toBeVisible(); await expect(help(page).locator('.blocker-title')).toHaveText(obstacle.name);
  await expect(page.locator('#blocker-rule')).toHaveText(`Tap a marked ${data.items[obstacle.ingredient].name} to merge here.`);
  expect(await targets(page)).toEqual([13, 14]);
  expect(await saved(page)).toEqual(state);
  await tile(page, 13).click();
  await expect(help(page)).toHaveCount(0); expect(await targets(page)).toEqual([]);
  await expect(page.locator('#item-detail h3')).toHaveText('Dough');
  const after = await saved(page);
  expect(after.board[obstacle.position]).toEqual({ code: 'bakery_2' });
  expect(after.board[13]).toBeNull();
  expect(after.board[14]).toEqual({ code: 'bakery_1' });
  expect(after.resolvedObstacles).toContain(obstacle.id);
});

test('blocker guidance excludes sources, final dishes, mismatches and blocked ingredients', async ({ page }) => {
  const state = createGame(data); state.board[18] = { code: 'bakery_6' }; state.discovered.push('bakery_6');
  await start(page, state); await tile(page, 41).click();
  await expect(help(page)).toBeVisible();
  await expect(page.locator('#blocker-rule')).toHaveText('Tap a marked Dough to merge here.');
  expect(await targets(page)).toEqual([]);
  await expect(tile(page, 6)).not.toHaveClass(/blocker-target/);
  expect(await saved(page)).toEqual(state);
});

test('anchor help marks matching movable food and clears with the second tap', async ({ page }) => {
  const state = createGame(data); state.board[13] = null; state.board[14] = { code: 'bakery_2' }; state.discovered.push('bakery_2');
  await start(page, state); await tile(page, 6).click();
  await expect(help(page)).toBeVisible(); await expect(help(page).locator('.blocker-title')).toHaveText('Tied dough');
  await expect(page.locator('#blocker-rule')).toHaveText('Tap a marked Dough to merge here.');
  expect(await targets(page)).toEqual([14]); expect(await saved(page)).toEqual(state);
  await tile(page, 14).click(); await expect(help(page)).toHaveCount(0);
  await expect(tile(page, 6)).not.toHaveClass(/anchored/);
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Pogăcele/);
  const after = await saved(page);
  expect(after.board[6]).toEqual({ code: 'bakery_3' }); expect(after.resolvedObstacles).toEqual(['tied-dough']);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 390, height: 800 }]) for (const theme of ['light', 'dark']) {
  test(`blocker help fits ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); const state = ready(); await start(page, state, theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const offer = page.locator(viewport.width < 1024 ? '#offer' : '#story');
    await expect(offer.getByRole('button', { name: /^Pay / })).toBeVisible();
    for (const [position, title, name] of [[0, 'Old crate', 'clutter'], [6, 'Tied dough', 'anchor']] as const) {
      await tile(page, position).click(); await expect(help(page)).toBeVisible();
      await expect(help(page).locator('.blocker-title')).toHaveText(title);
      const overlay = await tile(page, position).evaluate(cell => {
        const tint = getComputedStyle(cell, '::before');
        return { color: tint.backgroundColor, pointerEvents: tint.pointerEvents,
          tintAboveArt: [...cell.querySelectorAll('.clutter-art,.preparation-art')].every(art => Number(getComputedStyle(art).zIndex) < Number(tint.zIndex)),
          markAboveTint: Number(getComputedStyle(cell.querySelector('.blocker-mark')!).zIndex) > Number(tint.zIndex) };
      });
      expect(overlay).toEqual({ color: 'rgba(184, 38, 44, 0.2)', pointerEvents: 'none', tintAboveArt: true, markAboveTint: true });
      const geometry = await help(page).evaluate(element => {
        const box = element.getBoundingClientRect();
        const luminance = (color: string) => color.match(/\d+(?:\.\d+)?/g)!.slice(0, 3).map(Number).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
        let surface: Element = element;
        while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)' && surface.parentElement) surface = surface.parentElement;
        const background = luminance(getComputedStyle(surface).backgroundColor);
        return {
          inside: box.left >= 0 && box.right <= innerWidth + 1 && box.top >= 0 && box.bottom <= innerHeight,
          overflow: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
          text: [...element.querySelectorAll('.blocker-title,#blocker-rule')].map(node => {
            const ink = luminance(getComputedStyle(node).color);
            return { contrast: (Math.max(ink, background) + .05) / (Math.min(ink, background) + .05), fits: node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1 };
          }),
        };
      });
      expect(geometry.inside).toBe(true); expect(geometry.overflow).toBe(false);
      for (const text of geometry.text) { expect(text.contrast).toBeGreaterThanOrEqual(4.5); expect(text.fits).toBe(true); }
      const clear = (await help(page).getByRole('button', { name: 'Clear selection', exact: true }).boundingBox())!;
      expect(clear.width).toBeGreaterThanOrEqual(44); expect(clear.height).toBeGreaterThanOrEqual(44);
      if (viewport.width < 1024) {
        const detail = (await help(page).boundingBox())!, bar = (await page.locator('.phone-bar').boundingBox())!;
        expect(detail.y + detail.height).toBeLessThanOrEqual(bar.y + 1);
        await expect(page.locator('#offer')).toBeHidden();
      }
      expect(await saved(page)).toEqual(state);
      await page.screenshot({ path: testInfo.outputPath(`${name}-help.png`) });
    }
    await tile(page, 13).click(); await expect(help(page)).toHaveCount(0);
    await expect(page.locator('#item-detail h3')).toHaveText('Flour');
    expect(await targets(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('normal-item.png') });
    expect(await saved(page)).toEqual(state);
  });
}
