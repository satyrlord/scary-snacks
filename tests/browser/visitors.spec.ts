import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { getItem } from '../../src/model.ts';
import { checkpoint, data, deliverable, dialogDeliver, exportText, finishScene, journal, opened, openQuest, options, person, portraitCell, saved, start, startAgainAndImport, supplies, ticket, toast } from './support.ts';

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
  await journal(page,['chapters','conversations','neighbours']);await page.getByRole('button',{name:`Read ${value.title}`,exact:true}).click();
  await expect(page.locator('#story-line')).toContainText(value.completion[0].text);await finishScene(page);
  const after={...delivered,pendingScenes:before.pendingScenes};expect(await saved(page)).toEqual(after);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);await expect(ticket(page,value)).toHaveCount(0);
  await journal(page,['chapters','conversations','neighbours']);await page.getByRole('button',{name:`Replay ${value.title}`,exact:true}).click();await finishScene(page);expect(await saved(page)).toEqual(after);
  await page.keyboard.press('Escape');await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(after);
  await startAgainAndImport(page,text);expect(await saved(page)).toEqual(after);await expect(ticket(page,value)).toHaveCount(0);
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`visitor portraits and introductions fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,checkpoint(0));await journal(page,['chapters','conversations','neighbours']);
  const before=await saved(page);
  for(const visitor of visitors){
    const entry=page.getByRole('button',{name:`Meet ${visitor.name}`,exact:true});await entry.scrollIntoViewIfNeeded();
    await checkPortrait(entry.locator('.portrait'),visitor.sprite);await expect(entry).toContainText(visitor.role);
    expect(await entry.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await entry.click();await expect(page.locator('#story-line')).toContainText(visitor.introduction);
    const portrait=page.locator('.story-turn .portrait');await checkPortrait(portrait,visitor.sprite);
    const box=(await portrait.boundingBox())!;expect(box.width).toBe(44);expect(box.height).toBe(box.width);
    await expect(page.locator('.quest-sketch')).toHaveAttribute('src',new RegExp(`sketch-${visitor.id}-672x672\\.webp$`));
    const returnButton=page.getByRole('button',{name:'Return',exact:true});await returnButton.scrollIntoViewIfNeeded();await expect(returnButton).toBeInViewport();
    expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`${visitor.id}.png`)});
    await finishScene(page);await expect(page.getByRole('button',{name:`Meet ${visitor.name}`,exact:true})).toBeFocused();expect(await saved(page)).toEqual(before);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

async function guestAbsent(page: Page){
  await expect(ticket(page,dinner)).toHaveCount(0);await expect(page.locator('#tickets')).not.toContainText(guest.name);await journal(page,['chapters','conversations','neighbours']);
  await expect(page.getByRole('button',{name:`Meet ${guest.name}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:`Read quest: ${dinner.title}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:`Replay ${dinner.title}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('img',{name:guest.name,exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
}

test('the castle guest dines in act 2, so he stays hidden through act 1',async({page})=>{
  expect(dinner.act).toBe(2);
  const state=checkpoint(data.tasks.length);
  await start(page,state);await guestAbsent(page);expect(await saved(page)).toEqual(state);
});
