import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { getItem } from '../../src/model.ts';
import { createGame } from '../../src/engine.ts';
import { checkpoint, data, deliverButton, deliverable, dialogDeliver, exportText, failWrites, finishScene, journal, opened, openQuest, options, person, portraitCell, readTo, saved, start, startAgainAndImport, story, supplies, ticket, toast } from './support.ts';

const visitors=data.characters.filter(value=>value.visitor&&!value.singleVisit);
const quests=data.quests.filter(value=>visitors.some(visitor=>visitor.id===value.character));
const firstQuests=visitors.map(visitor=>quests.find(value=>value.character===visitor.id)!);
const guest=data.characters.find(value=>value.singleVisit&&data.quests.some(other=>other.character===value.id))!;
const dinner=data.quests.find(value=>value.character===guest.id)!;
async function checkPortrait(portrait: Locator,sprite: number){
  await expect(portrait).toHaveClass(/visitor-portrait/);await portraitCell(portrait,'visitor-portraits',sprite);
}

for(const value of firstQuests)test(`${value.character} shows the exact expedition supplies and pays the reward once across reload and export`,async({page},testInfo)=>{
  await start(page,deliverable(value));const before=await saved(page);await checkPortrait(ticket(page,value).locator('.portrait'),person(value.character).sprite);
  await openQuest(page,value);const dialog=page.getByRole('dialog',{name:value.title,exact:true});
  await expect(dialog.locator('.quest-person')).toHaveText(person(value.character).name);await expect(dialog).toContainText(value.opening[0].text);
  for(const requirement of value.requirements){
    const name=getItem(requirement.item,data)!.name;
    await expect(dialog.getByRole('button',{name:`${requirement.quantity} ${name}: ${requirement.quantity} of ${requirement.quantity} on the board`,exact:true})).toBeVisible();
  }
  await expect(dialog.locator('.quest-reward')).toHaveText(`Reward: ${value.reward} coins`);
  await page.screenshot({path:testInfo.outputPath('supply-quest.png')});
  await dialogDeliver(page,value).click();await expect(page.locator('#modal')).toBeHidden();
  await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);const delivered=await saved(page);
  // Delivery pays at once. The completion scene waits until the player reads it, and reading changes nothing else.
  expect(delivered.pendingScenes).toEqual([...before.pendingScenes,value.id]);
  expect(delivered.completedQuests).toEqual([...before.completedQuests,value.id]);expect(delivered.coins).toBe(before.coins+value.reward);
  expect(delivered.board.filter(Boolean).length).toBe(before.board.filter(Boolean).length-supplies(value).length);
  await expect(ticket(page,value)).toHaveCount(0);
  await journal(page);await page.getByRole('button',{name:`Read ${value.title}`,exact:true}).click();
  await expect(page.locator('#story-line')).toContainText(value.completion[0].text);await finishScene(page);
  const after={...delivered,pendingScenes:before.pendingScenes};expect(await saved(page)).toEqual(after);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);await expect(ticket(page,value)).toHaveCount(0);
  await journal(page);await page.getByRole('button',{name:`Replay ${value.title}`,exact:true}).click();await finishScene(page);expect(await saved(page)).toEqual(after);
  await page.keyboard.press('Escape');await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(after);
  await startAgainAndImport(page,text);expect(await saved(page)).toEqual(after);await expect(ticket(page,value)).toHaveCount(0);
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`visitor portraits and introductions fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,createGame(data));await journal(page);
  const before=await saved(page);
  for(const visitor of visitors){
    const entry=page.getByRole('button',{name:`Meet ${visitor.name}`,exact:true});await entry.scrollIntoViewIfNeeded();
    await checkPortrait(entry.locator('.portrait'),visitor.sprite);await expect(entry).toContainText(visitor.role);
    expect(await entry.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await entry.click();await expect(page.locator('#story-line')).toContainText(visitor.introduction);
    const portrait=page.locator('.story-stage .portrait');await checkPortrait(portrait,visitor.sprite);
    const box=(await portrait.boundingBox())!;expect(box.width).toBe(viewport.width>1023?120:82);expect(box.height).toBe(box.width);
    await expect(page.getByRole('button',{name:'Return',exact:true})).toBeInViewport();
    expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`${visitor.id}.png`)});
    await finishScene(page);await expect(page.getByRole('button',{name:`Meet ${visitor.name}`,exact:true})).toBeFocused();expect(await saved(page)).toEqual(before);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

async function guestAbsent(page: Page){
  await expect(ticket(page,dinner)).toHaveCount(0);await expect(page.locator('#tickets')).not.toContainText(guest.name);await journal(page);
  await expect(page.getByRole('button',{name:`Meet ${guest.name}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:`Read quest: ${dinner.title}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:`Replay ${dinner.title}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('img',{name:guest.name,exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
}

test('the castle guest stays hidden until the required preparation is complete',async({page})=>{
  const state=checkpoint(data.tasks.findIndex(task=>task.id===dinner.afterTask),{ready:true});
  await start(page,state);await guestAbsent(page);expect(await saved(page)).toEqual(state);
});

test('the castle guest asks on a ticket, pays once, and leaves the journal after his farewell',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await start(page,deliverable(dinner));const before=await saved(page);
  await checkPortrait(ticket(page,dinner).locator('.portrait'),guest.sprite);
  // The Deliver buttons group the thousands as the reward line does.
  await expect(deliverButton(page,dinner)).toHaveText(`Deliver · ${dinner.reward.toLocaleString('en')}`);
  await journal(page);const introduction=page.getByRole('button',{name:`Meet ${guest.name}`,exact:true});
  await introduction.click();await expect(page.locator('#story-line')).toContainText(guest.introduction);await finishScene(page);expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Escape');await openQuest(page,dinner);const dialog=page.getByRole('dialog',{name:dinner.title,exact:true});
  await expect(dialog).toContainText(dinner.opening[0].text);await checkPortrait(dialog.locator('.portrait'),guest.sprite);
  for(const requirement of dinner.requirements){
    const name=getItem(requirement.item,data)!.name;
    await expect(dialog.getByRole('button',{name:`${requirement.quantity} ${name}: ${requirement.quantity} of ${requirement.quantity} on the board`,exact:true})).toBeVisible();
  }
  await expect(dialog.locator('.quest-reward')).toHaveText(`Reward: ${dinner.reward.toLocaleString('en')} coins`);
  await expect(dialogDeliver(page,dinner)).toHaveText(`Deliver · ${dinner.reward.toLocaleString('en')}`);await dialogDeliver(page,dinner).click();
  await expect(page.locator('#modal')).toBeHidden();await expect(toast(page)).toHaveText(`${dinner.title}: delivered. Earned ${dinner.reward} coins.`);
  const delivered=await saved(page);expect(delivered.pendingScenes).toEqual([...before.pendingScenes,dinner.id]);
  expect(delivered.completedQuests).toEqual([...before.completedQuests,dinner.id]);expect(delivered.coins).toBe(before.coins+dinner.reward);
  expect(delivered.board.filter(Boolean).length).toBe(before.board.filter(Boolean).length-supplies(dinner).length);
  // A guest who visits once has no journal replay after the visit.
  await story(page);await page.getByRole('button',{name:`Read now: ${dinner.title}`,exact:true}).click();
  await expect(page.locator('#story-line')).toContainText(dinner.completion[0].text);await readTo(page,'Back to the kitchen');
  await expect(page.locator('#status')).toHaveText('The scene is finished.');await guestAbsent(page);
  const after={...delivered,pendingScenes:before.pendingScenes};
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);await guestAbsent(page);
  await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(after);
  await startAgainAndImport(page,text);expect(await saved(page)).toEqual(after);await guestAbsent(page);
});

test('a failed castle dinner save keeps the guest gone for the session and restores only durable progress on reload',async({page})=>{
  await start(page,deliverable(dinner));const before=await saved(page);
  await failWrites(page);await deliverButton(page,dinner).click();
  await expect(toast(page)).toHaveText(`${dinner.title}: delivered. Earned ${dinner.reward} coins. This session is not saved. Use Retry save in Options, or export before leaving.`);
  await guestAbsent(page);await expect(page.locator('#coin-total')).toHaveText(`${(before.coins+dinner.reward).toLocaleString('en')} coins`);expect(await saved(page)).toEqual(before);
  await options(page);await expect(page.getByRole('button',{name:'Retry save',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  await page.reload();await opened(page);await expect(deliverButton(page,dinner)).toBeEnabled();expect(await saved(page)).toEqual(before);
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`the castle guest and dinner fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,deliverable(dinner));await journal(page);
  const before=await saved(page),entry=page.getByRole('button',{name:`Meet ${guest.name}`,exact:true});
  await entry.scrollIntoViewIfNeeded();await checkPortrait(entry.locator('.portrait'),guest.sprite);await entry.click();
  await expect(page.locator('#story-line')).toContainText(guest.introduction);await checkPortrait(page.locator('.story-stage .portrait'),guest.sprite);
  await expect(page.getByRole('button',{name:'Return',exact:true})).toBeInViewport();
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('ionatan-introduction.png')});await finishScene(page);
  await page.keyboard.press('Escape');await openQuest(page,dinner);const dialog=page.locator('.quest-view');
  await checkPortrait(dialog.locator('.portrait'),guest.sprite);await expect(dialog).toContainText(dinner.opening[0].text);
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('ionatan-dinner.png')});
  await expect(dialogDeliver(page,dinner)).toBeEnabled();await expect(dialogDeliver(page,dinner)).toBeInViewport();expect(await saved(page)).toEqual(before);
});
