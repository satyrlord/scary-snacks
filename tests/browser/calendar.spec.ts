import { expect, test } from '@playwright/test';
import { dayMerges, requiredQuests, yearDay } from '../../src/model.ts';
import type { GameState } from '../../src/model.ts';
import { moveTo } from '../../tools/create-checkpoint-saves.ts';
import { actOneTasks, actOne, act, checkpoint, data, mergeFlour, openQuest, quest, replaceSave, saved, start, startStill, supper, supplies, supply, ticket, toast, tile } from './support.ts';

/** The day of act 1 of a date of year 1. */
const day = (date: number, month: number) => yearDay(month, date) - data.calendar.start + 1;
/** A copy on a later morning, after quiet nights. */
const on = (state: GameState, target: number) => { const next = structuredClone(state); moveTo(next, target, data); return next; };
/** A copy one merge before the closing of its day. */
const lateEvening = (state: GameState): GameState => ({ ...structuredClone(state), clock: { ...state.clock, merges: dayMerges(state.clock.day, data) - 1 } });

test('a weekday closing pays the upkeep with a notice and no dialog, and play goes on', async ({ page }) => {
  await start(page, lateEvening(on(actOne(1), day(17, 2))));
  await mergeFlour(page);
  await expect(toast(page)).toHaveText(`The bistro closed for the night. Upkeep: ${data.acts[0].day.upkeep} coins. Good morning, Tuesday 18 February.`);
  await expect(page.locator('#modal')).not.toBeVisible();
  await expect(page.locator('#day-clock .clock-face')).toHaveText('Tue 18 Feb · 07:00');
  expect((await saved(page)).night!.rat).toBeNull();
  // The board takes the next action while the notice shows.
  await tile(page, 22).click();
  await expect(tile(page, 22)).toHaveAttribute('aria-pressed', 'true');
});

test('the Saturday closing leads to 10:00 on Sunday, which has no evening guest', async ({ page }) => {
  await start(page, lateEvening(actOne(1)));
  await mergeFlour(page);
  await expect(page.locator('#day-clock .clock-face')).toHaveText('Sun 16 Feb · 10:00');
  await expect(page.locator('#day-clock .visually-hidden')).toHaveText('Sunday 16 February, 10:00');
  expect((await saved(page)).evening.guest).toBeNull();
});

test('Story names the opening date of the next chapter while the other requirements are met', async ({ page }) => {
  // The quests that preparation 13 needs end with the Annunciation on 25 March, so they can be done before chapter 4 opens on 27 March.
  const state = on(checkpoint(12), data.chapters[3].opens - 1);
  state.completedQuests.push(...requiredQuests(12, data).map(quest => quest.id).filter(id => !state.completedQuests.includes(id)));
  state.coins = data.tasks[12].cost;
  await start(page, state);
  await expect(page.locator('#story .preparation-requirements [data-requirement="date"]')).toHaveText('Opens on Thursday 27 March.');
  await expect(page.locator('#story').getByRole('button', { name: /^Pay / })).toBeDisabled();
});

for (const width of [1440, 390]) test(`a holiday ticket names its holiday before it, delivers on it, and is late after it at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const dragobete = quest('victor-dragobete'), paid = act(checkpoint(2, { ready: true }), { type: 'task' });
  const before = supply(on(paid, day(21, 2)), supplies(dragobete));
  await start(page, before);
  if (width >= 1024) await expect(ticket(page, dragobete).locator('.ticket-booking')).toHaveText('For Dragobete, Monday 24 February');
  await openQuest(page, dragobete);
  await expect(page.locator('#modal .quest-booking')).toContainText('For Dragobete, Monday 24 February. Cook it whenever you like');
  await expect(page.locator('#modal').getByRole('button', { name: 'A sweet for two: For Dragobete, Monday 24 February' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await replaceSave(page, on(before, day(25, 2)));
  if (width >= 1024) await expect(ticket(page, dragobete).locator('.ticket-booking')).toHaveText('Late for Dragobete');
  await openQuest(page, dragobete);
  await page.locator('#modal').getByRole('button', { name: /^Deliver A sweet for two/ }).click();
  await expect(toast(page)).toContainText(`A sweet for two: delivered. Earned ${dragobete.reward} coins.`);
});

test('the supper is booked for 1 May, and on its day the lanterns bring the guests before Serve', async ({ page }) => {
  const finished = checkpoint(actOneTasks);
  await start(page, supply(finished, supplies(supper)));
  await expect(ticket(page, supper).locator('.ticket-booking')).toHaveText('Booked for 1 May');
  await replaceSave(page, supply(on(finished, data.calendar.supper), supplies(supper)));
  await expect(ticket(page, supper).locator('.ticket-booking')).toHaveText('Booked for 20:00');
  await ticket(page, supper).getByRole('button', { name: 'Light the lanterns: the supper is booked for 20:00' }).click();
  await expect(page.locator('#day-clock .clock-face')).toHaveText('Thu 1 May · 20:00');
  await expect(ticket(page, supper).getByRole('button', { name: `Serve ${supper.title}` })).toBeEnabled();
});

test('30 April holds until the last preparation, and Mara says why', async ({ page }) => {
  await start(page, lateEvening(on(checkpoint(actOneTasks - 1), data.calendar.supper - 1)));
  await mergeFlour(page);
  await expect(page.locator('#status')).toContainText('Walpurgis Night lasts until the bistro is ready.');
  await expect(page.locator('#day-clock .clock-face')).toHaveText('Wed 30 Apr · 21:45');
});

test('the window shows the view of the season, the weather, and the holiday decorations of the date', async ({ page }) => {
  const front = checkpoint(1);
  await start(page, front);
  const view = (state: GameState) => replaceSave(page, state).then(() => page.locator('.window-view').getAttribute('data-view'));
  expect(await view(front)).toBe('window-view-late-winter');
  // 1 March: the mărțișor hangs on the latch. 11 March is a snow day.
  await replaceSave(page, on(front, day(1, 3)));
  await expect(page.locator('#room-holidays [data-holiday="martisor"]')).toHaveCount(1);
  await expect(page.locator('#room-caption')).toContainText('A mărțișor, the red and white string, on the window latch.');
  expect(await view(on(front, day(11, 3)))).toBe('window-view-early-spring');
  await expect(page.locator('#room-frame')).toHaveAttribute('data-weather', 'snow');
  await expect(page.locator('.window-weather')).toBeVisible();
  // The snow falls in three depths at three speeds, and each fall moves one whole tile, so no grid shows and the loop has no jump.
  const depths = await page.locator('.window-weather').evaluate(node => [null, '::before', '::after'].map(part => {
    const style = getComputedStyle(node, part);
    return { name: style.animationName, duration: style.animationDuration, tile: parseFloat(style.backgroundSize.split(' ')[1]), fall: parseFloat(style.getPropertyValue('--h')) * parseFloat(style.getPropertyValue('--k')) };
  }));
  expect(depths.every(depth => depth.name === 'snow-fall' && Math.abs(depth.tile - depth.fall) < .01)).toBe(true);
  expect(new Set(depths.map(depth => depth.duration)).size).toBe(3);
  await expect(page.locator('#room-holidays svg')).toHaveCount(0);
  expect(await view(on(front, day(17, 4)))).toBe('window-view-spring');
  await expect(page.locator('#room-holidays [data-holiday]')).toHaveCount(2);
});

test('rain falls over the courtyard and stays still with reduced motion', async ({ page }) => {
  const courtyard = on(checkpoint(13), day(10, 4));
  await startStill(page, courtyard);
  await page.locator('#area-switch [data-area="courtyard"]').click();
  await expect(page.locator('#room-frame')).toHaveAttribute('data-weather', 'rain');
  await expect(page.locator('.room-weather')).toBeVisible();
  expect(await page.locator('.room-weather').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
});
