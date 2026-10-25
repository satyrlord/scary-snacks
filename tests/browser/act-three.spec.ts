import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { dayMerges, finaleQuest, firstFreeBoardCell, levers } from '../../src/model.ts';
import type { GameState } from '../../src/model.ts';
import { actThreeCheckpoints, checkpointState, moveTo } from '../../tools/create-checkpoint-saves.ts';
import { act, data, deliverButton, openQuest, painting, paintingDialog, quest, readTo, saved, start, supplies, supply, story, ticket, tile } from './support.ts';

const named = Object.fromEntries(actThreeCheckpoints(data)), dinner = finaleQuest(data.finales[2], data)!, scroll = quest('ambrozie-scroll-1');
const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('closing 31 August replaces the area controls in this tab and in a tab that follows its save', async ({ page, context }) => {
  const state = act(checkpointState(data, data.tasks.findIndex(task => task.purchase)), { type: 'task' });
  state.clock.merges = dayMerges(state.clock.day, data) - 1;
  const from = firstFreeBoardCell(state, data); state.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(state, data); state.board[to] = { code: 'herbs_1' };
  const follower = await context.newPage(), errors: string[] = [];
  for (const tab of [page, follower]) {
    tab.on('pageerror', error => errors.push(error.message));
    await start(tab, state);
    await expect(tab.locator('#room-frame')).toHaveAttribute('data-area', 'town-square');
  }
  await tile(page, from).click(); await tile(page, to).click();
  for (const tab of [page, follower]) {
    await expect(tab.locator('#room-frame')).toHaveAttribute('data-area', 'orchard');
    await expect(tab.locator('#area-switch button')).toHaveText(['Orchard', 'Bistro cellar', 'Cathedral kitchen']);
    await expect(tab.getByRole('button', { name: 'Orchard', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect((await saved(tab)).clock.day).toBe(data.acts[2].from);
  }
  expect(errors).toEqual([]);
});
/** The first rain day of act 3, after the first quiet nights of September. */
function rainyMorning(): GameState {
  const state = structuredClone(named['1-september']), day = data.calendar.weather.findIndex((weather, at) => at + 1 >= data.acts[2].from && weather === 'rain') + 1;
  moveTo(state, day, data);
  return state;
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const theme of ['light', 'dark']) {
    test(`on 1 September Story shows act 3, the room shows the orchard with Miez, and the scroll pays nothing, at ${viewport.width} in the ${theme} theme`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport); await start(page, named['1-september'], theme);
      // The phone sheet names the act in its first line, and the card counts the preparations of act 3.
      await story(page);
      if (viewport.width < 1024) {
        await expect(page.locator('.chapter-name:visible')).toHaveText('Act 3 · Chapter 1 · The orchard creaks');
        await page.keyboard.press('Escape'); await expect(page.locator('#modal')).toBeHidden();
      } else await expect(page.locator('#story')).toContainText('0 of 18 preparations done');
      await expect(page.locator('#room-frame')).toHaveAttribute('data-area', 'orchard');
      await expect(page.getByRole('button', { name: 'Orchard', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('button', { name: 'Bistro cellar', exact: true })).toHaveAttribute('aria-disabled', 'true');
      await expect(page.locator('#room-frame .sill-cat')).toBeVisible();
      expect(await fits(page)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`act3-orchard-${theme}.png`) });
      await openQuest(page, scroll);
      const dialog = page.getByRole('dialog', { name: scroll.title, exact: true });
      await expect(dialog).toContainText('A course of the sleeper’s order pays nothing.');
      await expect(dialog.locator('img.quest-scene-sketch')).toHaveAttribute('src', /scene-sleeper-1-1024x683.webp$/);
      await expect(dialog.getByRole('button', { name: `Serve ${scroll.title}`, exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`act3-scroll-${theme}.png`) });
    });
  }
  test(`rain falls over the orchard on a rain day, at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport); await start(page, rainyMorning());
    await expect(page.locator('#room-frame')).toHaveAttribute('data-weather', 'rain');
    await expect(page.locator('#room-frame .room-weather')).toBeVisible();
  });
  test(`the dinner ticket shows its occasion, Serve on 31 October shows the dinner painting and gives the act 3 result card, and the clock stays, at ${viewport.width}`, async ({ page }, testInfo) => {
    const evening = named['31-october-before-dinner'], { booking } = levers(data.finales[2].day, data);
    await page.setViewportSize(viewport); await start(page, supply(evening, supplies(dinner)));
    await expect(ticket(page, dinner)).toContainText('Booked for');
    if (viewport.width < 1024) { await openQuest(page, dinner); await page.getByRole('dialog', { name: dinner.title, exact: true }).getByRole('button', { name: `Serve ${dinner.title}`, exact: true }).click(); }
    else await deliverButton(page, dinner).click();
    await readTo(page, 'See the dinner');
    const dialog = await paintingDialog(page, 'The dinner', /Mara carries the suckling pig/);
    await expect(dialog.locator('.completion-message')).toHaveText(data.finales[2].ending);
    await page.screenshot({ path: testInfo.outputPath('dinner-painting.png') });
    await dialog.getByRole('button', { name: 'Back to the kitchen', exact: true }).click(); await expect(page.locator('#modal')).toBeHidden();
    // After the dinner, the cathedral kitchen shows the dinner painting.
    await expect(page.locator('#room-frame')).toHaveAttribute('data-painting', 'finale-dinner'); await expect.poll(() => painting(page)).toMatch(/^finale-dinner-/);
    await expect(page.getByRole('button', { name: 'Cathedral kitchen', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const after = await saved(page);
    expect(after.act3).toEqual({ purse: after.coins });
    expect(after.clock.merges * data.acts[2].day.mergeMinutes + data.acts[2].day.opening).toBe(booking);
    await story(page);
    await expect(page.locator('#story')).toContainText('The sleeper is fed.');
    await expect(page.locator('#story')).toContainText('The bistro worked from 1 September to 31 October.');
    await page.screenshot({ path: testInfo.outputPath('act3-result.png') });
    if (viewport.width < 1024) await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Orchard', exact: true }).click();
    await page.getByRole('button', { name: 'Cathedral kitchen', exact: true }).click();
    await expect(page.locator('#status')).toHaveText('The cathedral kitchen: the dinner');
    const bounds = await page.locator('#status').evaluate(element => {
      const text = element.getBoundingClientRect(), line = element.closest('.mara-line')!.getBoundingClientRect();
      return { top: text.top - line.top, bottom: line.bottom - text.bottom };
    });
    expect(bounds.top).toBeGreaterThanOrEqual(0); expect(bounds.bottom).toBeGreaterThanOrEqual(0);
  });
}
