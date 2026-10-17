import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, firstFreeBoardCell, menuReward, reduceGame, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData = JSON.parse(readFileSync('public/data/game.json', 'utf8'));
const first = data.tasks[0];
const save = (state: GameState) => exportSave(state, candidate => validateGame(candidate, data));
async function start(page: Page, state: GameState, theme = 'light') {
  await page.addInitScript(({ key, value, theme }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    localStorage.setItem('scary-snacks-theme', theme);
  }, { key: SAVE_KEY, value: save(state), theme });
  await page.goto('./');
  await expect(page.locator('#board button')).toHaveCount(42);
}
async function saved(page: Page): Promise<GameState> {
  return page.evaluate(key => navigator.locks.request(key, () => JSON.parse(localStorage.getItem(key)!).state), SAVE_KEY);
}
const pay = (page: Page) => page.locator('#story').getByRole('button', { name: /^Pay / });
const goal = (page: Page, kind: string) => page.locator(`#story [data-requirement="${kind}"]`);

test('ingredient tickets show the small menu prices and service pays exactly the shown quote', async ({ page }) => {
  const state = createGame(data);
  for (const [index, code] of ['bakery_1', 'warm_1', 'drinks_1'].entries()) {
    state.orders[index] = { ...state.orders[index], requirements: [code], reward: menuReward([code], data), pricing: 'menu-1' };
    expect(state.orders[index].reward).toBeGreaterThanOrEqual(1); expect(state.orders[index].reward).toBeLessThanOrEqual(3);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' }); await start(page, state);
  for (const [index, order] of state.orders.entries()) {
    await expect(page.locator('#orders .serve-button').nth(index)).toHaveAccessibleName(new RegExp(` for ${order.reward} ${order.reward === 1 ? 'coin' : 'coins'}$`));
  }
  await page.locator('#orders .serve-button').first().click();
  const after = await saved(page);
  expect(after.coins).toBe(state.orders[0].reward); expect(after.served).toBe(1);
  expect(after.orders.slice(1)).toEqual(state.orders.slice(1));
  expect(after.orders[0].pricing).toBe('menu-1'); expect(after.orders[0].reward).toBe(menuReward(after.orders[0].requirements, data));
  await page.reload(); expect(await saved(page)).toEqual(after);
});


for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 800 }]) {
  test(`work details explain the current budget and return focus at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await start(page, createGame(data));
    const phone = viewport.width < 1024;
    if (phone) await page.locator('#story-button').click();
    const details = () => page.locator(phone ? '#modal' : '#story').getByRole('button', { name: 'Work and cost', exact: true });
    await details().focus(); await page.keyboard.press('Enter');
    await expect(page.locator('#modal-title')).toHaveText('Work and cost');
    await expect(page.locator('.task-cost h3')).toHaveText(first.title);
    await expect(page.locator('.task-cost .modal-copy')).toHaveText(first.work.summary);
    await expect(page.locator('.task-cost li')).toHaveText([
      `Materials and supplies${first.work.materials} coins`, `Labour${first.work.labour} coins`, `Total${first.cost} coins`,
    ]);
    await expect(page.locator('.task-cost .small-copy')).toContainText(`${first.work.hours} person-hours`);
    expect(await page.locator('.task-cost').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('work-cost.png') });
    await page.keyboard.press('Escape'); await expect(details()).toBeFocused();
    await details().click(); await page.getByRole('button', { name: 'Close dialog', exact: true }).click(); await expect(details()).toBeFocused();
    expect(await saved(page)).toEqual(createGame(data));
    if (phone) { await page.keyboard.press('Escape'); await expect(page.locator('#story-button')).toBeFocused(); }
  });
}

test('coins cannot hide missing service and merge requirements', async ({ page }) => {
  const state = createGame(data); state.coins = first.cost;
  await start(page, state);
  await expect(goal(page, 'coins')).toHaveText(`Coins: ${first.cost} / ${first.cost}Complete`);
  await expect(goal(page, 'served')).toHaveText(`Total orders served: 0 / ${first.goals.served}Need ${first.goals.served}`);
  await expect(goal(page, 'merges')).toHaveText(`Total merges: 0 / ${first.goals.merges}Need ${first.goals.merges}`);
  await expect(pay(page)).toBeDisabled();
  expect(await saved(page)).toEqual(state);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#offer')).toBeHidden();
  await expect(page.locator('#story-button')).not.toHaveAttribute('data-ready');
  await page.locator('#story-button').click();
  await expect(page.locator('#modal [data-requirement="served"]')).toContainText(`Need ${first.goals.served}`);
  await expect(page.locator('#modal').getByRole('button', { name: /^Pay / })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#story-button')).toBeFocused();
});

test('the exact last merge enables payment, keeps board focus, and preserves lifetime totals', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const state = createGame(data); state.coins = first.cost; state.served = first.goals.served; state.merges = first.goals.merges - 1;
  await start(page, state);
  await expect(pay(page)).toBeDisabled();
  await page.locator('[data-cell="13"]').focus(); await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  await expect(page.locator('[data-cell="14"]')).toBeFocused();
  await expect(goal(page, 'merges')).toHaveText(`Total merges: ${first.goals.merges} / ${first.goals.merges}Complete`);
  await expect(pay(page)).toBeEnabled();
  const before = await saved(page);
  await pay(page).click();
  await expect(page.locator('.story-controls .primary-button')).toBeFocused();
  const after = await saved(page);
  expect(after.taskIndex).toBe(1); expect(after.coins).toBe(0);
  expect(after.served).toBe(first.goals.served); expect(after.merges).toBe(first.goals.merges);
  expect(after.orders).toEqual(before.orders); expect(after.seed).toBe(before.seed);
  for (let line = 0; line < 3; line++) await page.locator('.story-controls .primary-button').click();
  await expect(page.locator('#room-pin')).toBeFocused();
  await expect(goal(page, 'served')).toHaveText(`Total orders served: ${first.goals.served} / ${data.tasks[1].goals.served}Need ${data.tasks[1].goals.served - first.goals.served}`);
  await expect(goal(page, 'merges')).toHaveText(`Total merges: ${first.goals.merges} / ${data.tasks[1].goals.merges}Need ${data.tasks[1].goals.merges - first.goals.merges}`);
  await expect(pay(page)).toBeDisabled();
  await page.reload(); expect(await saved(page)).toEqual(after);
});

test('serving the last required order makes the phone offer ready', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const state = createGame(data); state.coins = first.cost; state.merges = first.goals.merges; state.served = first.goals.served - 1;
  const order = state.orders[0];
  for (const code of order.requirements) {
    state.board[firstFreeBoardCell(state, data)] = { code };
    if (!state.discovered.includes(code)) state.discovered.push(code);
  }
  await start(page, state);
  await expect(page.locator('#offer')).toBeHidden();
  const serve = page.locator('#orders .serve-button').first();
  await serve.focus(); await page.keyboard.press('Enter');
  expect((await saved(page)).served).toBe(first.goals.served);
  await expect(page.locator('#story-button')).toHaveAttribute('data-ready', '');
  await expect(page.locator('#offer').getByRole('button', { name: /^Pay / })).toBeEnabled();
  await expect(page.locator('#orders button:focus')).toHaveCount(1);
  await page.locator('#story-button').click();
  await expect(page.locator('#modal [data-requirement="served"]')).toHaveText(`Total orders served: ${first.goals.served} / ${first.goals.served}Complete`);
});


for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 390, height: 800 }]) {
  for (const theme of ['light', 'dark']) {
    test(`preparation goals fit ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
      await start(page, createGame(data), theme);
      if (viewport.width < 1024) await page.locator('#story-button').click();
      const panel = page.locator(viewport.width < 1024 ? '#modal .task-content' : '#story .task-content');
      await expect(panel.locator('li')).toHaveCount(3);
      const geometry = await panel.evaluate(element => {
        const box = element.getBoundingClientRect();
        let surface: Element = element;
        while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)' && surface.parentElement) surface = surface.parentElement;
        const background = getComputedStyle(surface).backgroundColor;
        const luminance = (color: string) => color.match(/\d+/g)!.slice(0, 3).map(Number).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
        const back = luminance(background);
        return {
          inside: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight,
          overflow: element.scrollWidth > element.clientWidth,
          contrast: [...element.querySelectorAll('li span')].map(node => { const ink = luminance(getComputedStyle(node).color); return (Math.max(ink, back) + .05) / (Math.min(ink, back) + .05); }),
          size: [...element.querySelectorAll('li span')].map(node => parseFloat(getComputedStyle(node).fontSize)),
        };
      });
      expect(geometry.inside).toBe(true); expect(geometry.overflow).toBe(false);
      expect(Math.min(...geometry.contrast)).toBeGreaterThanOrEqual(4.5);
      expect(Math.min(...geometry.size)).toBeGreaterThanOrEqual(12);
      if (viewport.width >= 1024) {
        const recipes = (await page.locator('#collection-button').boundingBox())!;
        expect(recipes.y + recipes.height).toBeLessThanOrEqual(viewport.height);
      }
      await page.screenshot({ path: testInfo.outputPath('campaign-goals.png') });
    });
  }
}
