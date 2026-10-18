import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { requiredQuests } from '../../src/model.ts';
import { createGame } from '../../src/engine.ts';
import type { GameState } from '../../src/model.ts';
import { data, deliverButton, saved, start, supplies, supply, tile, toast } from './support.ts';

const first = data.tasks[0];
const pay = (page: Page) => page.locator('#story').getByRole('button', { name: /^Pay / });
const goal = (page: Page, kind: string) => page.locator(`#story [data-requirement="${kind}"]`);
const needed = requiredQuests(0, data);
/** Every quest of the first preparation is delivered but the last, whose dishes are on the board, and the coins reach the cost with its reward. */
function lastQuestReady() {
  const state = createGame(data), last = needed.at(-1)!;
  state.completedQuests = needed.slice(0, -1).map(quest => quest.id); state.coins = first.cost - last.reward;
  return { state: supply(state, supplies(last)), last };
}

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

test('coins cannot hide undelivered quests', async ({ page }) => {
  const state: GameState = createGame(data); state.coins = first.cost;
  await start(page, state);
  await expect(goal(page, 'coins')).toHaveText(`Coins: ${first.cost} / ${first.cost}Complete`);
  await expect(goal(page, 'quests')).toHaveText(`Quests delivered: 0 / ${needed.length}Need ${needed.length}`);
  await expect(pay(page)).toBeDisabled();
  expect(await saved(page)).toEqual(state);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#offer')).toBeHidden();
  await expect(page.locator('#story-button')).not.toHaveAttribute('data-ready');
  await page.locator('#story-button').click();
  await expect(page.locator('#modal [data-requirement="quests"]')).toContainText(`Need ${needed.length}`);
  await expect(page.locator('#modal').getByRole('button', { name: /^Pay / })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#story-button')).toBeFocused();
});

test('delivering the last required quest makes the phone offer ready', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { state, last } = lastQuestReady(); await start(page, state);
  await expect(page.locator('#offer')).toBeHidden();
  const deliver = deliverButton(page, last);
  await deliver.focus(); await page.keyboard.press('Enter');
  await expect(toast(page)).toHaveText(`${last.title}: delivered. Earned ${last.reward} coins.`);
  expect((await saved(page)).completedQuests).toHaveLength(needed.length);
  await expect(page.locator('#story-button')).toHaveAttribute('data-ready', '');
  await expect(page.locator('#offer').getByRole('button', { name: /^Pay / })).toBeEnabled();
  await expect(page.locator('.tickets-empty')).toHaveText('No quests wait now. Pay for the next preparation.');
  await expect(page.locator('#story-button')).toBeFocused();
  await page.locator('#story-button').click();
  await expect(page.locator('#modal [data-requirement="quests"]')).toHaveText(`Quests delivered: ${needed.length} / ${needed.length}Complete`);
});

test('the last delivery returns focus to Story when the selected cell is in the lowered phone drawer',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const {state,last}=lastQuestReady();await start(page,state);await tile(page,1).click();
  await page.locator('#drawer-handle').click();await expect(page.locator('#drawer-body')).toHaveAttribute('inert','');
  await deliverButton(page,last).focus();await page.keyboard.press('Enter');
  await expect(toast(page)).toContainText('Earned');await expect(page.locator('#story-button')).toBeFocused();
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 390, height: 800 }]) {
  for (const theme of ['light', 'dark']) {
    test(`preparation requirements fit ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
      await start(page, createGame(data), theme);
      if (viewport.width < 1024) await page.locator('#story-button').click();
      const panel = page.locator(viewport.width < 1024 ? '#modal .task-content' : '#story .task-content');
      await expect(panel.locator('li')).toHaveCount(2);
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
