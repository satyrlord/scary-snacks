import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { firstFreeBoardCell, generatorOutputs } from '../../src/model.ts';
import type { SceneLine } from '../../src/model.ts';
import { actOneTasks, atBookingTime, checkpoint, data, deliverButton, dismissDialogs, forward, journal, onTicket, opened, openQuest, person, portraitCell, quest, saved, start, supplies, supply, svgImageSizes, ticket, tile, toast , source } from './support.ts';

const dinner=quest('ionatan-castle-dinner');
const search=quest('mina-avram-search');
const companions=['mina','avram'];
async function scene(page: Page,lines: SceneLine[]){
  await expect(page.locator('#story-line h3')).toHaveText(lines.map(line=>person(line.speaker).name));
  await expect(page.locator('#story-line p')).toHaveText(lines.map(line=>line.text));
  await forward(page).click();
}
const portrait=(target: Locator,sprite: number)=>portraitCell(target,'guests',sprite);

test('Ionatan, Mina, and Avram visit in act 2, so act 1 shows no ticket and no introduction of them',async({page})=>{
  expect([dinner.act,search.act]).toEqual([2,2]);
  await start(page,checkpoint(actOneTasks));
  await expect(ticket(page,dinner)).toHaveCount(0);await expect(ticket(page,search)).toHaveCount(0);
  await journal(page,['chapters','conversations','neighbours']);
  for(const id of ['ionatan',...companions])await expect(page.getByRole('button',{name:`Meet ${person(id).name}`,exact:true})).toHaveCount(0);
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`the portraits of the guests atlas in act 1 fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,onTicket(quest('vlad-after-dark')),theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await journal(page,['chapters','conversations','neighbours']);
  for(const guest of data.characters.filter(value=>value.portraitAtlas==='guest'&&!value.singleVisit)){
    const entry=page.getByRole('button',{name:`Meet ${guest.name}`,exact:true});await entry.scrollIntoViewIfNeeded();await portrait(entry.locator('.portrait'),guest.sprite);await expect(entry).toContainText(guest.role);
    expect(await entry.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);await entry.click();await portrait(page.locator('.story-turn .portrait'),guest.sprite);
    await expect(page.locator('#story-line')).toContainText(guest.introduction);
    await expect(page.locator('.quest-sketch')).toHaveAttribute('src',new RegExp(`sketch-${guest.id}-672x672\\.webp$`));
    const returnButton=page.getByRole('button',{name:'Return',exact:true});await returnButton.scrollIntoViewIfNeeded();await expect(returnButton).toBeInViewport();
    expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`${guest.id}.png`)});await scene(page,[{speaker:guest.id,text:guest.introduction}]);
  }
});

test('Vlad’s quest shows Red wine from the fruits atlas on its ticket and opens the wine’s help',async({page})=>{
  const value=quest('vlad-after-dark'),wine=value.requirements.find(requirement=>requirement.item==='fruits_5')!;expect(data.items.fruits_5.name).toBe('Red wine');
  await start(page,onTicket(value));await portrait(ticket(page,value).locator('.portrait'),person('vlad').sprite);
  await winePicture(ticket(page,value));await openQuest(page,value);
  await page.getByRole('button',{name:`${wine.quantity} Red wine: 0 of ${wine.quantity} on the board`,exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Red wine',exact:true})).toBeVisible();await winePicture(page.locator('#modal'));
  await expect(page.getByRole('dialog')).toContainText(`Merge two ${data.items.fruits_4.name} to make Red wine.`);
});

/** Make the dish through the source and board controls, without adding supplies to the save. */
async function makeDish(page: Page,code: string): Promise<number>{
  const before=await saved(page),item=data.items[code];
  if(generatorOutputs(before,`generator_${item.chain}`,data).includes(code)){
    const empty=firstFreeBoardCell(before,data);expect(empty).toBeGreaterThanOrEqual(0);
    await source(page,item.chain).click();await dismissDialogs(page);
    expect((await saved(page)).board[empty]?.code).toBe(code);return empty;
  }
  const lower=Object.values(data.items).find(candidate=>candidate.next===code)!;
  const first=await makeDish(page,lower.id),second=await makeDish(page,lower.id);
  await tile(page,first).click();await tile(page,second).click();await dismissDialogs(page);
  expect((await saved(page)).board[second]?.code).toBe(code);return second;
}
/** Red wine is its cell of the fruits atlas: the view box of its picture is that 256px cell of the 1024 by 512 variant. */
async function winePicture(target: Locator){
  const {atlas,cell}=data.items.fruits_5.art;expect(atlas).toBe('fruits');
  const picture=target.locator('svg.food').filter({has:target.page().locator('image[href*="food-fruits-"]')}).first();
  await expect(picture).toHaveAttribute('viewBox',`${cell%4*256} ${Math.floor(cell/4)*256} 256 256`);
  const image=picture.locator('image');await expect(image).toHaveAttribute('href',/assets\/variants\/food-fruits-1024x512\.webp$/);
  expect(await svgImageSizes(image)).toEqual([[1024,512]]);
}

test('red wine made through the visible controls readies Vlad’s quest, and Deliver pays it once',async({page})=>{
  test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});
  // The purse pays for the Plums from the Cornucopia.
  const value=quest('vlad-after-dark'),dishes=supplies(value);dishes.splice(dishes.indexOf('fruits_5'),1);
  // Vlad has the evening. The wine takes more merges than the evening holds, so it is cooked in the morning, and the lanterns bring him.
  const evening=atBookingTime(supply(onTicket(value),dishes),value),initial={...evening,clock:{...evening.clock,merges:0},coins:100};
  await start(page,initial);await expect(deliverButton(page,value)).toBeDisabled();
  const wine=await makeDish(page,'fruits_5');
  await expect(tile(page,wine)).toHaveAttribute('aria-label',/Red wine$/);await winePicture(tile(page,wine));
  await expect(deliverButton(page,value)).toBeEnabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(value.requirements.length);
  const ready=await saved(page);expect(ready.discovered).toContain('fruits_5');expect(ready.coins).toBe(initial.coins-2**(data.items.fruits_5.stage-1)*data.economy.takeCost);
  await deliverButton(page,value).click();await expect(page.locator('#day-clock .clock-face')).toHaveText(/ · 20:00$/);
  await deliverButton(page,value).click();await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  const after=await saved(page);expect(after.coins).toBe(ready.coins+value.reward);expect(after.completedQuests).toEqual([...ready.completedQuests,value.id]);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);await expect(ticket(page,value)).toHaveCount(0);
});
