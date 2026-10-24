import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { boardObstacles, mergePartners, unresolvedObstacle } from '../../src/model.ts';
import { reduceGame } from '../../src/engine.ts';
import type { GameState } from '../../src/model.ts';
import { checkpoint, data, ratio, saved, startStill as start, tile, validate, know, madeLine , source } from './support.ts';

const help = (page: Page) => page.locator('#item-detail.blocker-help');
/** The rule of a blocked dish: the matching dish, and each recipe partner that the player has made. */
const rule = (code: string, state: GameState) => `Tap a marked ${new Intl.ListFormat('en', { type: 'disjunction' }).format([...new Set(mergePartners(code, data)
  .filter(partner => partner === code || state.discovered.includes(partner)).map(partner => data.items[partner].name))])} to merge here.`;
/** Five preparations are paid, so the Hen’s nest is on the board, with one Eggs and no other loose dish. */
function eggsOnly() {
  const state = checkpoint(5, { coins: 20 });
  state.board.fill(null);
  state.board[state.board.findIndex((cell, index) => !cell && !unresolvedObstacle(state, index, data))] = { code: 'poultry_1' };
  know(state,'poultry_1');
  return state;
}
async function targets(page: Page) {
  return page.locator('#board .blocker-target').evaluateAll(elements => elements.map(element => Number((element as HTMLElement).dataset.cell)));
}

test('every opening blocker has a rule mark and selecting clutter replaces a source refusal without a save change', async ({ page }) => {
  const initial=checkpoint(0);await start(page, initial);
  for (const obstacle of boardObstacles(checkpoint(0), data)) {
    await expect(tile(page, obstacle.position).locator('svg.blocker-mark')).toBeVisible();
    await expect(tile(page, obstacle.position).locator('.food')).toBeVisible();
    await expect(tile(page, obstacle.position)).toHaveAttribute('title', /Merge/i);
  }
  await source(page, 'grain').click();
  await expect(page.locator('#status')).toHaveText('The Windmill costs 1 coin for each take, and the purse cannot pay. Deliver a quest, or take free herbs from the Herb basket.');
  const before = await saved(page);
  expect(before).toEqual(initial);
  await tile(page, 0).click();
  await expect(help(page)).toBeVisible(); await expect(help(page).locator('.blocker-title')).toHaveText('Old crate');
  // The Loaf in the crate is also a part of mixed dishes. The rule names only the other parts that the player has made.
  const unmade = mergePartners('grain_3', data).filter(partner => partner !== 'grain_3' && !initial.discovered.includes(partner)); expect(unmade.length).toBeGreaterThan(0);
  await expect(page.locator('#blocker-rule')).toHaveText(rule('grain_3', initial));
  for (const partner of unmade) await expect(tile(page, 0)).not.toHaveAttribute('aria-label', new RegExp(data.items[partner].name));
  await expect(tile(page, 0)).toHaveAttribute('aria-pressed', 'true');
  expect(await targets(page)).toEqual([]);
  await expect(page.locator('#item-detail .detail-feedback')).toHaveCount(0);
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(help(page)).toHaveCount(0); expect(await targets(page)).toEqual([]);
  await expect(tile(page, 0)).toHaveAttribute('aria-pressed', 'false');
  expect(await saved(page)).toEqual(before);
});

test('blocker help marks matching movable ingredients anywhere on the board', async ({ page }) => {
  const state = checkpoint(0); state.board[18] = { code: 'grain_3' };
  if (!state.discovered.includes('grain_3')) know(state,'grain_3');
  await start(page, state); await tile(page, 0).click();
  expect(await targets(page)).toEqual([18]);
  await expect(page.locator('#blocker-rule')).toHaveText(rule('grain_3', state));
  await expect(tile(page, 18)).toHaveAttribute('aria-label', /Tap to merge into the selected blocked space$/);
  expect(await saved(page)).toEqual(state);
});

for (const [first, second] of [[0, 18], [18, 0]] as const) {
  test(`matching food clears a blocker in two taps, starting at cell ${first}`, async ({ page }) => {
    const initial = checkpoint(0);
    initial.board[18] = { code: 'grain_3' };
    know(initial,'grain_3');
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
  const initial = checkpoint(0);
  await start(page, initial);
  await tile(page, 0).click();
  await tile(page, 13).click();
  await expect(help(page)).toHaveCount(0);
  await expect(tile(page, 13)).toHaveAttribute('aria-pressed', 'true');
  await expect(tile(page, 0)).toHaveClass(/obstacle/);
  expect(await saved(page)).toEqual(initial);
});

test('keyboard navigation clears a selected blocker with a matching ingredient', async ({ page }) => {
  const initial = checkpoint(0);
  initial.board[13] = null;
  initial.board[14] = { code: 'grain_2' };
  know(initial,'grain_2');
  await start(page, initial);
  await tile(page, 6).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(tile(page, 14)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(tile(page, 6)).toBeFocused();
  expect((await saved(page)).board[6]).toEqual({ code: 'grain_3' });
  expect((await saved(page)).board[14]).toBeNull();
  expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
  // A cleared blocker gives the blocker coin, and the notice and the purse say so.
  expect((await saved(page)).coins).toBe(data.economy.blockerCoin);
  await expect(page.locator('#status')).toHaveText(`${madeLine(initial, 'grain_3')} The blocker is cleared: +1 coin.`);
  await expect(page.locator('#coins')).toHaveText(String(data.economy.blockerCoin));
});

test('touch clears a selected blocker with the second tap', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    const initial = checkpoint(0);
    initial.board[13] = null;
    initial.board[14] = { code: 'grain_2' };
    know(initial,'grain_2');
    await start(page, initial);
    await tile(page, 6).tap();
    await tile(page, 14).tap();
    expect((await saved(page)).board[6]).toEqual({ code: 'grain_3' });
    expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
  } finally { await context.close(); }
});

test('keyboard selection opens clutter help and Escape clears it without changing the board', async ({ page }) => {
  const initial = checkpoint(0); await start(page, initial);
  await tile(page, 0).focus(); await page.keyboard.press('Enter');
  await expect(help(page)).toBeVisible(); expect(await targets(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(help(page)).toHaveCount(0); expect(await targets(page)).toEqual([]);
  expect(await saved(page)).toEqual(initial);
});

test('a second tap on a selected blocker closes its help with the move hint', async ({ page }) => {
  const initial = checkpoint(0); await start(page, initial);
  await tile(page, 0).click(); await expect(help(page)).toBeVisible();
  await tile(page, 0).click();
  await expect(help(page)).toHaveCount(0); expect(await targets(page)).toEqual([]);
  await expect(tile(page, 0)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#status')).toHaveText('Tap an item, then tap where it should go.');
  expect(await saved(page)).toEqual(initial);
});

test('new preparation blocker identifies matching movable ingredients', async ({ page }) => {
  const state = checkpoint(1);
  const obstacle = boardObstacles(state, data).find(obstacle => obstacle.atlas === 'preparation')!;
  expect(obstacle.position).toBe(1);
  await start(page, state); await tile(page, obstacle.position).click();
  await expect(help(page)).toBeVisible(); await expect(help(page).locator('.blocker-title')).toHaveText(obstacle.name);
  await expect(page.locator('#blocker-rule')).toHaveText(rule(obstacle.ingredient, state));
  expect(await targets(page)).toEqual([13, 14]);
  expect(await saved(page)).toEqual(state);
  await tile(page, 13).click();
  await expect(help(page)).toHaveCount(0); expect(await targets(page)).toEqual([]);
  await expect(page.locator('#item-detail h3')).toHaveText('Dough');
  const after = await saved(page);
  expect(after.board[obstacle.position]).toEqual({ code: 'grain_2' });
  expect(after.board[13]).toBeNull();
  expect(after.board[14]).toEqual({ code: 'grain_1' });
  expect(after.resolvedObstacles).toContain(obstacle.id);
});

test('blocker guidance excludes sources, final dishes, mismatches and blocked ingredients', async ({ page }) => {
  const state = checkpoint(0); state.board[18] = { code: 'grain_6' }; know(state,'grain_6');
  await start(page, state); await tile(page, 41).click();
  await expect(help(page)).toBeVisible();
  await expect(page.locator('#blocker-rule')).toHaveText(rule('grain_2', state));
  expect(await targets(page)).toEqual([]);
  await expect(tile(page, 6)).not.toHaveClass(/blocker-target/);
  expect(await saved(page)).toEqual(state);
});

test('anchor help marks matching movable food and clears with the second tap', async ({ page }) => {
  const state = checkpoint(0); state.board[13] = null; state.board[14] = { code: 'grain_2' }; know(state,'grain_2');
  await start(page, state); await tile(page, 6).click();
  await expect(help(page)).toBeVisible(); await expect(help(page).locator('.blocker-title')).toHaveText('Tied dough');
  await expect(page.locator('#blocker-rule')).toHaveText(rule('grain_2', state));
  expect(await targets(page)).toEqual([14]); expect(await saved(page)).toEqual(state);
  await tile(page, 14).click(); await expect(help(page)).toHaveCount(0);
  await expect(tile(page, 6)).not.toHaveClass(/anchored/);
  await expect(tile(page, 6)).toHaveAttribute('aria-label', new RegExp(data.items.grain_3.name));
  const after = await saved(page);
  expect(after.board[6]).toEqual({ code: 'grain_3' }); expect(after.resolvedObstacles).toEqual(['tied-dough']);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 390, height: 800 }]) for (const theme of ['light', 'dark']) {
  test(`blocker help fits ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); const state = checkpoint(0, { ready: true }); await start(page, state, theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const pageFlow = await page.locator('#drawer').evaluate(element => getComputedStyle(element).position === 'static');
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
      if (pageFlow) await help(page).scrollIntoViewIfNeeded();
      const geometry = await help(page).evaluate(element => {
        const box = element.getBoundingClientRect();
        let surface: Element = element;
        while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)' && surface.parentElement) surface = surface.parentElement;
        return {
          inside: box.left >= 0 && box.right <= innerWidth + 1 && box.top >= 0 && box.bottom <= innerHeight,
          overflow: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
          background: getComputedStyle(surface).backgroundColor,
          text: [...element.querySelectorAll('.blocker-title,#blocker-rule')].map(node => ({
            ink: getComputedStyle(node).color, fits: node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1,
          })),
        };
      });
      expect(geometry.inside).toBe(true); expect(geometry.overflow).toBe(false); expect(geometry.text).toHaveLength(2);
      for (const text of geometry.text) { expect(ratio(geometry.background, text.ink)).toBeGreaterThanOrEqual(4.5); expect(text.fits).toBe(true); }
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
    expect(await page.evaluate(pageFlow => document.documentElement.scrollWidth <= innerWidth && (pageFlow || document.documentElement.scrollHeight <= innerHeight), pageFlow)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('normal-item.png') });
    expect(await saved(page)).toEqual(state);
  });
}

/** A final dish of an open chain that cooks with a dish of an open chain, on the board of a later checkpoint, with or without that partner made. */
function finalDish(known: boolean) {
  const made = (final: string, partner: string, with_: boolean) => {
    const value = checkpoint(12, { coins: 20 }); value.board[value.board.findIndex((cell, index) => !cell && !unresolvedObstacle(value, index, data))] = { code: final };
    value.discovered = [...new Set([...value.discovered.filter(code => !mergePartners(final, data).includes(code)), final, ...with_ ? [partner] : []])]; return value;
  };
  const [final, partner] = Object.values(data.items).flatMap(item => !item.generator && !item.next ? mergePartners(item.id, data).map(other => [item.id, other]) : [])
    .find(([dish, other]) => validate(made(dish, other, false)) && validate(made(dish, other, true)))!;
  const state = made(final, partner, known);
  return { state, partner, at: state.board.findIndex(cell => cell?.code === final) };
}
for (const known of [false, true]) test(`a final dish ${known ? 'names a recipe partner that the player has made' : 'names no recipe partner that the player has not made'}`, async ({ page }) => {
  const { state, partner, at } = finalDish(known);
  await start(page, state); await tile(page, at).click();
  await expect(page.locator('#item-detail .detail-next')).toHaveText(known ? new RegExp(`^Cook it with .*${data.items[partner].name}`) : 'Cook it with a new dish');
});

test('a recipe partner clears a blocker: the mixed dish stays in the blocked cell and the blocker coin is paid', async ({ page }) => {
  // Eggs cook Sweet dough with the tied Dough. The help marks the Eggs, and the merge leaves Sweet dough in the blocked cell.
  const state = eggsOnly(); await start(page, state);
  const eggs = state.board.findIndex(cell => cell?.code === 'poultry_1'), dough = boardObstacles(state, data).find(obstacle => obstacle.id === 'tied-dough')!;
  await tile(page, dough.position).click(); await expect(page.locator('#blocker-rule')).toHaveText(rule('grain_2', state));
  await expect(page.locator('#blocker-rule')).toContainText(data.items.poultry_1.name);
  expect(await targets(page)).toContain(eggs);
  await tile(page, eggs).click();
  const after = await saved(page), sweet = data.items['mixed_sweet-dough'];
  expect(after.board[dough.position]).toEqual({ code: sweet.id }); expect(after.board[eggs]).toBeNull();
  expect(after.resolvedObstacles).toContain(dough.id); expect(after.coins).toBe(state.coins + data.economy.blockerCoin);
  await expect(page.locator('#status')).toHaveText(`${madeLine(state, sweet.id)} The blocker is cleared: +1 coin.`);
  await expect(tile(page, dough.position)).not.toHaveClass(/obstacle/);
});
