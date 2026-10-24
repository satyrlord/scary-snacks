import { test, expect } from '@playwright/test';
import { mergePartners } from '../../src/model.ts';
import { checkpoint, data, saved, start, tile, know, mergeFlour } from './support.ts';

test('new board explains blocked spaces and counts only usable empty cells', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  // The sources stand in the source tab, so they take no cell of the board.
  await expect(page.locator('#board')).toHaveAttribute('aria-label', /28 free spaces/);
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Old crate, blocked Loaf/);
  await expect(tile(page, 0).locator('.clutter-overlay')).toHaveCount(1);
  await expect(tile(page, 0).locator('.food')).toBeVisible();
  // The tied Dough takes a Dough, or each recipe partner that the player made: some partners come from the prologue.
  const known = (await saved(page)).discovered, partners = new Intl.ListFormat('en', { type: 'disjunction' }).format(mergePartners('grain_2', data)
    .filter(partner => partner === 'grain_2' || known.includes(partner)).map(partner => data.items[partner].name));
  await expect(tile(page, 6)).toHaveAttribute('aria-label', `Row 2, column 1: Tied dough, blocked Dough. Merge ${partners} into this space to clear it`);
  await tile(page, 0).focus();
  await page.keyboard.press('ArrowDown');
  await expect(tile(page, 6)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#status')).toHaveText(`Tied dough: tap a marked ${partners} to merge here.`);
  await expect(page.locator('.cell.clutter')).toHaveCount(4);
  await expect(page.locator('.cell.anchored')).toHaveCount(4);
});

test('selected ingredients mark matching food and update targets after a move and merge', async ({ page }) => {
  await start(page, checkpoint(0));
  await tile(page, 13).click();
  await expect(tile(page, 13)).toHaveClass(/selected/);
  await expect(tile(page, 14)).toHaveClass(/merge-target/);
  await expect(tile(page, 14)).toHaveAttribute('aria-label', /Tap to merge the selected Flour here$/);
  await expect(page.locator('#board .merge-target')).toHaveCount(1);
  await tile(page, 20).click();
  await expect(tile(page, 20)).toHaveClass(/selected/);
  await expect(tile(page, 14)).toHaveClass(/merge-target/);
  await expect(tile(page, 13)).not.toHaveClass(/merge-target/);
  await tile(page, 14).click();
  await expect(tile(page, 14)).toHaveClass(/selected/);
  for (const index of [6, 41]) await expect(tile(page, index)).toHaveClass(/merge-target/);
  expect((await saved(page)).board[14]).toEqual({ code: 'grain_2' });
});

test('a selected dish marks movable matches and matching blockers only', async ({ page }) => {
  const state = checkpoint(0);
  state.board[18] = { code: 'grain_2' };
  state.board[19] = { code: 'grain_2' };
  know(state,'grain_2');
  await start(page, state);
  await tile(page, 18).click();
  const marked = await page.locator('#board .merge-target').evaluateAll(elements => elements.map(element => Number((element as HTMLElement).dataset.cell)));
  // Dough matches the tied dough, the other Dough, and the linen bundle, and it makes Mucenici with the Herb bunch of the covered crock.
  expect(marked).toEqual([6, 19, 36, 41]);
  await expect(tile(page, 19)).toHaveAttribute('aria-label', /Tap to merge the selected Dough here$/);
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Tap to merge the selected Dough here and clear this blocker$/);
  await expect(tile(page, 19)).toHaveCSS('outline-style', 'dotted');
  await expect(tile(page, 19)).toHaveCSS('outline-color', 'rgb(46, 33, 23)');
  await tile(page, 19).hover();
  await expect(tile(page, 19)).toHaveCSS('outline-style', 'dotted');
  await expect(tile(page, 13)).not.toHaveClass(/merge-target/);
  await tile(page, 6).click();
  await expect(tile(page, 0)).toHaveClass(/merge-target/);
  await expect(tile(page, 19)).not.toHaveClass(/merge-target/);
  expect((await saved(page)).board[6]).toEqual({ code: 'grain_3' });
});

test('forced colours distinguish the selected dish from its matching targets', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await start(page, checkpoint(0));
  await tile(page, 13).click();
  await expect(tile(page, 13)).toHaveCSS('outline-style', 'solid');
  await expect(tile(page, 14)).toHaveCSS('outline-style', 'dotted');
  await expect(tile(page, 14)).toHaveClass(/merge-target/);
});

test('final dishes and cleared selections show no merge targets', async ({ page }) => {
  const state = checkpoint(0);
  state.board[18] = { code: 'grain_6' };
  know(state,'grain_6');
  await start(page, state);
  await tile(page, 18).click();
  await expect(page.locator('#board .merge-target')).toHaveCount(0);
  await tile(page, 13).click();
  await expect(tile(page, 14)).toHaveClass(/merge-target/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#board .merge-target')).toHaveCount(0);
  await expect(page.locator('#board .blocker-target')).toHaveCount(0);
});

test('a pointer merge clears only its destination and can then clear the adjacent blocker', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page, checkpoint(0));
  await tile(page, 13).click();
  await tile(page, 14).click();
  await tile(page, 6).click();
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Loaf/);
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Loaf/);
  const state = await saved(page);
  expect(state.resolvedObstacles).toEqual(['tied-dough']);
  expect(state.board[6]).toEqual({ code: 'grain_3' });
  await expect(tile(page, 0)).toHaveClass(/clutter/);
  await expect(tile(page, 6)).toHaveAttribute('aria-pressed', 'true');
  await tile(page, 0).click();
  await expect(tile(page, 0)).not.toHaveClass(/clutter/);
  expect(await tile(page, 0).evaluate(cell => getComputedStyle(cell, '::before').content)).toBe('none');
  expect((await saved(page)).board[0]).toEqual({ code: 'grain_4' });
  await page.reload();
  await expect(tile(page, 0)).not.toHaveClass(/clutter/);
  expect((await saved(page)).board[0]).toEqual({ code: 'grain_4' });
});

test('dragging a matching item into an anchor clears it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  await mergeFlour(page);
  const from = (await tile(page, 14).boundingBox())!;
  const to = (await tile(page, 6).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Loaf/);
  expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
});

test('keyboard selection can merge into an anchored cell', async ({ page }) => {
  await start(page, checkpoint(0));
  await tile(page, 13).focus();
  await page.keyboard.press('Enter');
  await tile(page, 14).focus();
  await page.keyboard.press('Enter');
  await tile(page, 6).focus();
  await page.keyboard.press('Enter');
  await expect(tile(page, 6)).toHaveAttribute('aria-label', /Loaf/);
  expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
});

test('touch merges the two Flours and releases the tied dough with one more tap', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await start(page, checkpoint(0));
    await tile(page, 13).tap();
    await tile(page, 14).tap();
    await tile(page, 6).tap();
    await expect(tile(page, 6)).toHaveAttribute('aria-label', /Loaf/);
    expect((await saved(page)).resolvedObstacles).toEqual(['tied-dough']);
    await expect(tile(page, 0)).toHaveClass(/clutter/);
  } finally { await context.close(); }
});

test('Find a match selects movable food and points to matching clutter', async ({ page }) => {
  const state = checkpoint(0);
  state.board = state.board.map(() => null);
  state.board[13] = { code: 'grain_3' };
  if (!state.discovered.includes('grain_3')) know(state,'grain_3');
  await start(page, state); await page.getByRole('button', { name: 'Find a match', exact: true }).click();
  await expect(tile(page, 13)).toHaveAttribute('aria-pressed', 'true');
  await expect(tile(page, 0)).toHaveClass(/hint/);
  await expect(page.locator('#status')).toHaveText('Tap the blocked Loaf to merge and clear it.');
  await tile(page, 0).click();
  expect((await saved(page)).board[0]).toEqual({ code: 'grain_4' });
  await expect(tile(page, 0)).not.toHaveClass(/obstacle/);
});

test('the first preparation removes the webs without clearing the clutter blockers', async ({ page }) => {
  await start(page, checkpoint(1));
  await expect(tile(page, 0)).toHaveAttribute('aria-label', /Old crate, blocked Loaf/);
  await expect(tile(page, 0).locator('.clutter-overlay')).toHaveCount(0);
  await expect(tile(page, 0).locator('.clutter-art')).toHaveCount(1);
  await expect(page.locator('.cell.clutter')).toHaveCount(4 + data.board.preparations[0].obstacles.filter(obstacle => obstacle.type === 'clutter').length);
});
