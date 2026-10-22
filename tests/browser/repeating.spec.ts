import { test, expect } from '@playwright/test';
import { act, checkpoint, supperEvening, data, dialogDeliver, openQuest, quest, saved, startStill, supplies, supply, supper, ticket } from './support.ts';

const staff = quest('sorin-staff-meal'), bela = quest('bela-cold-night');
/** After the supper, the bistro has no other work: the staff meal is open, and its dishes are on the board. */
function afterSupper() {
  const served = act(supply(supperEvening(checkpoint(data.tasks.length)), supplies(supper)), { type: 'deliverQuest', id: supper.id });
  return supply(served, supplies(staff));
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) for (const theme of ['light', 'dark']) {
  test(`a repeating quest opens on a ticket without work, pays once, and the next quest of the cycle follows at ${viewport.width}px in ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const state = afterSupper();
    expect(state.repeating?.open).toBe(staff.id);
    await startStill(page, state, theme);
    await expect(ticket(page, staff)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('repeating-ticket.png') });
    await openQuest(page, staff);
    await expect(page.getByRole('dialog', { name: staff.title, exact: true })).toContainText(staff.opening[0].text);
    await dialogDeliver(page, staff).click();
    await expect(ticket(page, bela)).toBeVisible();
    await expect(ticket(page, staff)).toHaveCount(0);
    const after = await saved(page);
    expect(after.coins).toBe(state.coins + staff.reward);
    expect(after.completedQuests).toEqual(state.completedQuests);
    expect(after.repeating).toEqual({ last: staff.id, open: bela.id });
  });
}

test('a saved repeating quest waits without a ticket while campaign quests hold every ticket', async ({ page }) => {
  // After preparation 8, the quests of the window take the three tickets first.
  const state = { ...checkpoint(8), repeating: { last: null, open: staff.id } };
  await startStill(page, state);
  await expect(page.locator('#tickets .ticket:not(.recovery-ticket)')).toHaveCount(3);
  await expect(ticket(page, staff)).toHaveCount(0);
  expect((await saved(page)).repeating).toEqual({ last: null, open: staff.id });
});
