import { test, expect } from '@playwright/test';
import { requiredQuests, unresolvedObstacle } from '../../src/model.ts';
import { createGame, revealTickets } from '../../src/engine.ts';
import { moveTo } from '../../tools/create-checkpoint-saves.ts';
import type { GameState } from '../../src/model.ts';
import { act, checkpoint, data, dialogDeliver, goal, importSaveFile, newGame, opened, openQuest, options, pay, ratio, saved, serialize, start, supplies, supply, ticket, tile, toast, validate, know } from './support.ts';

const first = data.tasks[0];
const needed = requiredQuests(0, data);
/** Every quest of the preparation at this index is delivered but the last, whose dishes and the extra dishes are on the board, and the coins reach its cost with that last reward. */
function lastQuestReady(index = 0, extra: string[] = []) {
  const quests = requiredQuests(index, data), state = checkpoint(index), last = quests.at(-1)!;
  // The quests are delivered on their dates, and the payment waits for the opening of its chapter.
  moveTo(state, Math.max(state.clock.day, data.chapters[data.tasks[index].chapter - 1].opens, ...quests.map(quest => data.calendar.holidays.find(holiday => holiday.id === quest.holiday)?.day ?? quest.opens ?? 1)), data);
  state.completedQuests.push(...quests.slice(0, -1).filter(quest => !state.completedQuests.includes(quest.id)).map(quest => quest.id)); state.coins = data.tasks[index].cost - last.reward;
  revealTickets(state, data);
  return { state: supply(state, [...supplies(last), ...extra]), last };
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 800 }]) {
  test(`work details expand inside Story and keep toggle focus at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport); await start(page, createGame(data));
    const phone = viewport.width < 1024;
    if (phone) await page.locator('#story-button').click();
    const scope = page.locator(phone ? '#modal' : '#story');
    const details = () => scope.getByRole('button', { name: 'Work and cost', exact: true });
    const costs = scope.getByRole('region', { name:'Work and cost', exact:true, includeHidden:true });
    await expect(details()).toHaveAttribute('aria-expanded','false');await expect(costs).toBeHidden();
    await details().focus(); await page.keyboard.press('Enter');
    await expect(details()).toBeFocused();await expect(details()).toHaveAttribute('aria-expanded','true');
    await expect(costs).toBeVisible();
    if(phone)await expect(page.locator('#modal-title')).toHaveText('Our little bistro');else await expect(page.locator('#modal')).toBeHidden();
    await expect(costs.locator('.work-summary')).toHaveText(first.work.summary);
    await expect(costs.locator('.work-costs li')).toHaveText([
      `Materials and supplies${first.work.materials} coins`, `Labour${first.work.labour} coins`, `Total${first.cost} coins`,
    ]);
    await expect(costs.getByRole('list', { name: 'Preparation requirement totals' }).locator('li')).toHaveText([
      `Coins: 0 / ${first.cost}.`, `Quests delivered: 0 / ${needed.length}.`, 'Opening date: Saturday 15 February, open.',
    ]);
    await expect(costs.locator('.small-copy')).toContainText(`${first.work.hours} person-hours`);
    expect(await costs.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('work-cost.png') });
    await page.keyboard.press('Space');await expect(details()).toBeFocused();
    await expect(details()).toHaveAttribute('aria-expanded','false');await expect(costs).toBeHidden();
    await details().click();await expect(costs).toBeVisible();await details().click();await expect(costs).toBeHidden();
    expect(await saved(page)).toEqual(await newGame(page));
    if (phone) { await page.keyboard.press('Escape'); await expect(page.locator('#story-button')).toBeFocused(); }
  });
}

for(const viewport of [{width:1280,height:800},{width:390,height:800},{width:320,height:600}]) {
  test(`Pay works with details expanded at ${viewport.width}x${viewport.height}`,async({page})=>{
    const state=checkpoint(0,{ready:true});
    await page.setViewportSize(viewport);await start(page,state);
    const phone=viewport.width<1024;if(phone)await page.locator('#story-button').click();
    const scope=page.locator(phone?'#modal':'#story');
    const details=scope.getByRole('button',{name:'Work and cost',exact:true});
    await details.click();
    await scope.locator('.requirement-totals li').last().scrollIntoViewIfNeeded();
    if(viewport.height===600)expect(await scope.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
    expect(await saved(page)).toEqual(state);
    await details.focus();await page.keyboard.press('Shift+Tab');
    await expect(scope.getByRole('button',{name:/^Pay /})).toBeFocused();await page.keyboard.press('Enter');
    await expect.poll(async()=>(await saved(page)).taskIndex).toBe(1);
    expect(await saved(page)).toEqual(act(state,{type:'task'}));
    await expect(page.locator('#story [data-work-cost]')).toHaveAttribute('aria-expanded','false');
  });
}

test('cost expansion survives board redraws for the same preparation and resets on reload',async({page})=>{
  const state=createGame(data);await start(page,state);
  await page.getByRole('button',{name:'Work and cost',exact:true}).click();
  await tile(page,31).click();
  await expect(page.locator('#story [data-work-cost]')).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#story .task-cost')).toBeVisible();
  expect(await saved(page)).toEqual(act(state,{type:'spawn',index:31}));
  await page.reload();await opened(page);
  await expect(page.locator('#story [data-work-cost]')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#story .task-cost')).toBeHidden();
});

test('both Story views share cost expansion and importing the game clears it',async({page})=>{
  const state=createGame(data);await start(page,state);
  await page.locator('#story [data-work-cost]').click();
  await page.setViewportSize({width:390,height:844});await page.locator('#story-button').click();
  await expect(page.locator('#modal [data-work-cost]')).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#modal .task-cost')).toBeVisible();
  await page.locator('#modal [data-work-cost]').click();
  await expect(page.locator('#story [data-work-cost]')).toHaveAttribute('aria-expanded','false');
  await page.locator('#modal [data-work-cost]').click();await page.keyboard.press('Escape');
  await page.setViewportSize({width:1440,height:900});
  await expect(page.locator('#story .task-cost')).toBeVisible();
  expect(await saved(page)).toEqual(state);
  await options(page);await importSaveFile(page,serialize(state));
  await expect(page.locator('#story [data-work-cost]')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#story .task-cost')).toBeHidden();expect(await saved(page)).toEqual(state);
});

test('coins cannot hide undelivered quests', async ({ page }) => {
  const state: GameState = createGame(data); state.coins = first.cost;
  await start(page, state);
  await expect(goal(page, 'coins')).toHaveCount(0);
  await expect(goal(page, 'quests')).toHaveText(`Deliver ${needed.length} more quests.`);
  await expect(pay(page)).toBeDisabled();
  await expect(pay(page)).toHaveAccessibleDescription(new RegExp(`Coins: ${first.cost} / ${first.cost}.*Quests delivered: 0 / ${needed.length}`));
  expect(await saved(page)).toEqual(state);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#offer')).toBeHidden();
  await expect(page.locator('#story-button')).not.toHaveAttribute('data-ready');
  await page.locator('#story-button').click();
  await expect(page.locator('#modal .preparation-requirements [data-requirement="quests"]')).toHaveText(`Deliver ${needed.length} more quests.`);
  await expect(page.locator('#modal').getByRole('button', { name: /^Pay / })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#story-button')).toBeFocused();
});

test('completed quests leave only the missing coins, with exact totals in Cost details',async({page})=>{
  const state=checkpoint(0,{ready:true});state.coins=first.cost-1;
  await start(page,state);
  await expect(goal(page,'quests')).toHaveCount(0);
  await expect(goal(page,'coins')).toHaveText('Earn 1 more coin.');
  await expect(pay(page)).toBeDisabled();
  await page.getByRole('button',{name:'Work and cost',exact:true}).click();
  await expect(page.locator('.requirement-totals [data-requirement="coins"]')).toHaveText(`Coins: ${first.cost-1} / ${first.cost}.`);
  await expect(page.locator('.requirement-totals [data-requirement="quests"]')).toHaveText(`Quests delivered: ${needed.length} / ${needed.length}.`);
  expect(await saved(page)).toEqual(state);
});

test('source placement is the only visible requirement until a merge frees a space',async({page})=>{
  const index=data.tasks.findIndex(task=>task.unlock),task=data.tasks[index];
  const state=checkpoint(index,{ready:true});
  state.board.forEach((cell,at)=>{if(!cell&&!unresolvedObstacle(state,at,data))state.board[at]={code:'grain_6'};});
  know(state,'grain_6');expect(validate(state)).toBe(true);
  await start(page,state);
  const source=data.items[`generator_${task.unlock}`].name;
  await expect(page.locator('#story .preparation-requirements li')).toHaveText([`Free a board space for the ${source}.`]);
  await expect(pay(page)).toBeDisabled();
  await tile(page,13).click();await tile(page,14).click();
  await expect(page.locator('#story .task-ready')).toHaveText('Ready to prepare.');
  await expect(page.locator('#story .preparation-requirements li')).toHaveCount(0);
  await expect(pay(page)).toBeEnabled();
  expect(await saved(page)).toEqual(act(state,{type:'move',from:13,to:14}));
  await page.setViewportSize({width:390,height:844});await tile(page,14).focus();await page.keyboard.press('Escape');
  await expect(page.locator('#offer .pay-button')).toHaveAccessibleDescription(new RegExp(`Board space for the ${source}: available`));
});

test('delivering the last required quest makes the phone offer ready', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { state, last } = lastQuestReady(); await start(page, state);
  await expect(page.locator('#offer')).toBeHidden();
  await ticket(page,last).locator('.ticket-face').focus();await page.keyboard.press('Enter');
  const deliver = dialogDeliver(page, last);
  await deliver.focus(); await page.keyboard.press('Enter');
  await expect(toast(page)).toHaveText(`${last.title}: delivered. Earned ${last.reward} coins.`);
  expect((await saved(page)).completedQuests).toHaveLength(needed.length);
  await expect(page.locator('#story-button')).toHaveAttribute('data-ready', '');
  await expect(page.locator('#offer').getByRole('button', { name: /^Pay / })).toBeEnabled();
  await expect(page.locator('#offer .pay-button')).toHaveAccessibleDescription(new RegExp(`Coins: ${first.cost} / ${first.cost}.*Quests delivered: ${needed.length} / ${needed.length}`));
  await expect(page.locator('.tickets-empty')).toHaveText('No quests wait now. Pay for the next preparation.');
  await expect(page.locator('#story-button')).toBeFocused();
  await page.locator('#story-button').click();
  await expect(page.locator('#modal .task-ready')).toHaveText('Ready to prepare.');
  await expect(page.locator('#modal .preparation-requirements li')).toHaveCount(0);
  await expect(page.locator('#modal').getByRole('button',{name:/^Pay /})).toHaveAccessibleDescription(new RegExp(`Ready to prepare.*Quests delivered: ${needed.length} / ${needed.length}`));
});

test('a ready preparation keeps guide Stop visible after delivery clears the selected dish', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // The last quest of the 21st preparation takes the Minced veal that the guide to the Mici selects: they are Minced veal and Minced pork.
  const fixture = lastQuestReady(20, ['pork_2']), state = fixture.state, sharing = data.items['mixed_mici'];
  expect(sharing.recipe).toEqual(['veal_3', 'pork_2']); expect(supplies(fixture.last)).toContain('veal_3'); expect(supplies(fixture.last)).not.toContain(sharing.id);
  know(state,sharing.id);
  await start(page, state);
  await page.locator('#recipes-button').click();
  await page.getByRole('button', { name: sharing.name, exact: true }).click();
  await page.getByRole('button', { name: 'Show me on the board' }).click();
  await expect(page.locator('#board .selected')).toHaveAttribute('aria-label', new RegExp(`: ${data.items.veal_3.name}`));
  await openQuest(page,fixture.last);await dialogDeliver(page, fixture.last).click();
  await expect(page.locator('#board .selected')).toHaveCount(0);
  await expect(page.locator('#hint-button')).toHaveAccessibleName(`Stop guide for ${sharing.name}`);
  await expect(page.locator('#hint-button')).toBeVisible();
  await expect(page.locator('#offer')).toBeHidden();
  await expect(page.locator('#story-button')).toHaveAttribute('data-ready', '');
  await page.locator('#story-button').click();
  await expect(page.locator('#modal').getByRole('button', { name: /^Pay / })).toBeEnabled();
  await page.keyboard.press('Escape');
  const before = await saved(page);
  await page.locator('#hint-button').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#offer').getByRole('button', { name: /^Pay / })).toBeVisible();
  expect(await saved(page)).toEqual(before);
});

test('the last delivery returns focus to Story when the selected cell is in the lowered phone drawer',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const {state,last}=lastQuestReady();await start(page,state);await tile(page,31).click();
  await page.locator('#drawer-handle').click();await expect(page.locator('#drawer-body')).toHaveAttribute('inert','');
  await ticket(page,last).locator('.ticket-face').focus();await page.keyboard.press('Enter');
  await dialogDeliver(page,last).focus();await page.keyboard.press('Enter');
  await expect(toast(page)).toContainText('Earned');await expect(page.locator('#story-button')).toBeFocused();
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 390, height: 800 }]) {
  for (const theme of ['light', 'dark']) {
    test(`preparation requirements fit ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
      await start(page, createGame(data), theme);
      if (viewport.width < 1024) await page.locator('#story-button').click();
      const panel = page.locator(viewport.width < 1024 ? '#modal .task-content' : '#story .task-content');
      await expect(panel.locator('.preparation-requirements li')).toHaveCount(2);
      const geometry = await panel.evaluate(element => {
        const box = element.getBoundingClientRect();
        let surface: Element = element;
        while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)' && surface.parentElement) surface = surface.parentElement;
        return {
          inside: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight,
          overflow: element.scrollWidth > element.clientWidth,
          background: getComputedStyle(surface).backgroundColor,
          inks: [...element.querySelectorAll('.preparation-requirements li span')].map(node => getComputedStyle(node).color),
          size: [...element.querySelectorAll('.preparation-requirements li span')].map(node => parseFloat(getComputedStyle(node).fontSize)),
        };
      });
      expect(geometry.inside).toBe(true); expect(geometry.overflow).toBe(false); expect(geometry.inks.length).toBeGreaterThan(0);
      for (const ink of geometry.inks) expect(ratio(geometry.background, ink)).toBeGreaterThanOrEqual(4.5);
      expect(Math.min(...geometry.size)).toBeGreaterThanOrEqual(12);
      if (viewport.width >= 1024) {
        const recipes = (await page.locator('#collection-button').boundingBox())!;
        expect(recipes.y + recipes.height).toBeLessThanOrEqual(viewport.height);
      }
      await page.screenshot({ path: testInfo.outputPath('campaign-goals.png') });
    });
  }
}
