import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { firstFreeBoardCell, generatorOutputs, resolveQuests } from '../../src/model.ts';
import type { GameState, SceneLine } from '../../src/model.ts';
import { act, atBookingTime, data, deliverButton, deliverable, dialogDeliver, dismissDialogs, exportText, failWrites, forward, journal, onTicket, opened, openQuest, options, person, portraitCell, quest, readNow, readTo, replaceSave, saved, start, startAgainAndImport, supplies, supply, ticket, tile, toast } from './support.ts';

const dinner=quest('ionatan-castle-dinner');
const search=quest('mina-avram-search');
const companions=['mina','avram'];
async function scene(page: Page,lines: SceneLine[]){
  await expect(page.locator('#story-line h3')).toHaveText(lines.map(line=>person(line.speaker).name));
  await expect(page.locator('#story-line p')).toHaveText(lines.map(line=>line.text));
  await forward(page).click();
}
/** Mina and Avram have journal introductions only while their shared quest is open. */
async function guests(page: Page,present: boolean){
  await journal(page,['chapters','conversations','neighbours']);
  for(const id of companions)await expect(page.getByRole('button',{name:`Meet ${person(id).name}`,exact:true})).toHaveCount(present?1:0);
  await expect(page.getByRole('button',{name:`Replay ${search.title}`,exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
  await expect(ticket(page,search)).toHaveCount(present?1:0);
}
const portrait=(target: Locator,sprite: number)=>portraitCell(target,'guests',sprite);
/** Delivers through the rules, with the dishes supplied, and reads the scenes that the delivery queued. */
function delivered(state: GameState,id: string){
  let next=act(supply(state,supplies(quest(id))),{type:'deliverQuest',id});
  for(const scene of [...next.pendingScenes])next=act(next,{type:'readScene',id:scene});
  return next;
}

test('Mina and Avram arrive only after Ionatan’s dinner and their preparation, and stay while their quest is open',async({page})=>{
  // Ionatan's dinner is open, so the shared visit is not.
  await start(page,onTicket(dinner));await guests(page,false);await expect(ticket(page,dinner)).toHaveCount(1);
  // The dinner is delivered, but the preparation that brings them is not done.
  const fed=delivered(onTicket(dinner),dinner.id);expect(fed.decorations).not.toContain(search.afterTask);
  await replaceSave(page,fed);await guests(page,false);
  // After the preparation, both guests are in the journal and the quest is on a ticket.
  await replaceSave(page,onTicket(search));await guests(page,true);
  await expect(ticket(page,search)).toHaveAccessibleName(`${person('mina').name}’s quest: ${search.title}`);await portrait(ticket(page,search).locator('.portrait'),person('mina').sprite);
});

test('the shared vegetarian meal has both voices, leaves once, keeps the departure through reload and import',async({page})=>{
  await start(page,deliverable(search));await guests(page,true);await openQuest(page,search);
  const dialog=page.getByRole('dialog',{name:search.title,exact:true});
  await expect(dialog.locator('.quest-person')).toHaveText('Mina and Avram');
  for(const id of companions)await portrait(dialog.getByRole('img',{name:person(id).name,exact:true}),person(id).sprite);
  for(const line of search.opening)await expect(dialog).toContainText(`${person(line.speaker).name}: ${line.text}`);
  for(const {item,quantity} of search.requirements)await expect(dialog.getByRole('button',{name:`${quantity} ${data.items[item].name}: ${quantity} of ${quantity} on the board`,exact:true})).toBeVisible();
  const before=await saved(page);await dialog.getByRole('button',{name:/^Deliver /}).click();
  await expect(toast(page)).toHaveText(`${search.title}: delivered. Earned ${search.reward} coins.`);
  await readNow(page,search.title);await scene(page,search.completion);
  const after=await saved(page);expect(after.completedQuests).toEqual([...before.completedQuests,search.id]);expect(after.coins).toBe(before.coins+search.reward);expect(after.pendingScenes).toEqual([]);
  await guests(page,false);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);await guests(page,false);
  await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(after);
  await startAgainAndImport(page,text);expect(await saved(page)).toEqual(after);await guests(page,false);
});

test('local news from the road arrives with the third delivery after the shared meal',async({page})=>{
  let state=delivered(deliverable(search),search.id);
  // Two later quests are delivered through the rules. When no quest is open, the next preparation is paid to open more.
  const next=()=>{
    // The recovery quest keeps no record, so it is never one of these deliveries.
    const open=()=>resolveQuests(state,data).filter(view=>view.status==='active'&&!view.quest.recovery);
    while(!open().length){
      state.coins=data.tasks[state.taskIndex].cost;state=act(state,{type:'task'});for(const id of [...state.pendingScenes])state=act(state,{type:'readScene',id});
    }
    return open()[0].quest;
  };
  for(let count=0;count<2;count++){const value=next();state=delivered(state,value.id);}
  expect(state.pendingScenes).toEqual([]);
  const third=next();
  await start(page,supply(state,supplies(third)));await deliverButton(page,third).click();
  await expect(toast(page)).toHaveText(`${third.title}: delivered. Earned ${third.reward} coins.`);
  expect((await saved(page)).pendingScenes).toEqual([third.id,search.followUp!.id]);
  await readNow(page,third.title);
  await readTo(page,'Next scene');await expect(page.getByRole('dialog',{name:search.followUp!.title,exact:true})).toBeVisible();
  await scene(page,search.followUp!.dialogue);expect((await saved(page)).pendingScenes).toEqual([]);
  await journal(page,['chapters','conversations','neighbours']);await expect(page.getByRole('button',{name:`Replay ${search.followUp!.title}`,exact:true})).toBeVisible();await page.keyboard.press('Escape');await guests(page,false);
});

test('a failed shared delivery save removes both guests in the session, and reload restores the shared visit',async({page})=>{
  await start(page,deliverable(search));const before=await saved(page);
  await failWrites(page);await deliverButton(page,search).click();await expect(toast(page)).toContainText('This session is not saved.');
  await guests(page,false);expect(await saved(page)).toEqual(before);
  await page.reload();await opened(page);await guests(page,true);await expect(deliverButton(page,search)).toBeEnabled();
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`all four portraits in the guests atlas and the shared meal fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,deliverable(search));await journal(page,['chapters','conversations','neighbours']);
  for(const guest of data.characters.filter(value=>value.portraitAtlas==='guest')){
    const entry=page.getByRole('button',{name:`Meet ${guest.name}`,exact:true});await entry.scrollIntoViewIfNeeded();await portrait(entry.locator('.portrait'),guest.sprite);await expect(entry).toContainText(guest.role);
    expect(await entry.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);await entry.click();await portrait(page.locator('.story-turn .portrait'),guest.sprite);
    await expect(page.locator('#story-line')).toContainText(guest.introduction);
    await expect(page.locator('.quest-sketch')).toHaveAttribute('src',new RegExp(`sketch-${guest.id}-768x768\\.webp$`));
    const returnButton=page.getByRole('button',{name:'Return',exact:true});await returnButton.scrollIntoViewIfNeeded();await expect(returnButton).toBeInViewport();
    expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`${guest.id}.png`)});await scene(page,[{speaker:guest.id,text:guest.introduction}]);
  }
  await page.keyboard.press('Escape');await openQuest(page,search);const view=page.locator('.quest-view');
  await portrait(view.getByRole('img',{name:'Mina',exact:true}),person('mina').sprite);await portrait(view.getByRole('img',{name:'Avram',exact:true}),person('avram').sprite);
  await expect(view.locator('.quest-scene-sketch')).toHaveAttribute('src',/scene-mina-avram-meal-1024x683\.webp$/);
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('shared-meal.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await dialogDeliver(page,search).scrollIntoViewIfNeeded();await expect(dialogDeliver(page,search)).toBeEnabled();await expect(dialogDeliver(page,search)).toBeInViewport();
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
  const before=await saved(page),item=data.items[code],source=`generator_${item.chain}`;
  if(generatorOutputs(before,source,data).includes(code)){
    const cell=tile(page,before.board.findIndex(value=>value?.code===source));
    if(await cell.getAttribute('aria-pressed')!=='true'){
      const empty=firstFreeBoardCell(before,data);await cell.click();await dismissDialogs(page);
      if((await saved(page)).board[empty]?.code===code)return empty;
    }
    const empty=firstFreeBoardCell(await saved(page),data);expect(empty).toBeGreaterThanOrEqual(0);
    await cell.click();await dismissDialogs(page);
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
  expect(await image.evaluate(async element=>{const image=new Image();image.src=element.getAttribute('href')!;await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([1024,512]);
}

test('red wine made through the visible controls readies Vlad’s quest, and Deliver pays it once',async({page})=>{
  test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});
  // The purse pays for the Plums from the Cornucopia.
  const value=quest('vlad-after-dark'),dishes=supplies(value);dishes.splice(dishes.indexOf('fruits_5'),1);
  // Vlad has the evening, and the clock shows his booking time.
  const initial=atBookingTime(supply(onTicket(value),dishes),value);initial.coins=100;
  await start(page,initial);await expect(deliverButton(page,value)).toBeDisabled();
  const wine=await makeDish(page,'fruits_5');
  await expect(tile(page,wine)).toHaveAttribute('aria-label',/Red wine$/);await winePicture(tile(page,wine));
  await expect(deliverButton(page,value)).toBeEnabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(value.requirements.length);
  const ready=await saved(page);expect(ready.discovered).toContain('fruits_5');expect(ready.coins).toBe(initial.coins-2**(data.items.fruits_5.stage-1)*data.economy.takeCost);
  await deliverButton(page,value).click();await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  const after=await saved(page);expect(after.coins).toBe(ready.coins+value.reward);expect(after.completedQuests).toEqual([...ready.completedQuests,value.id]);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);await expect(ticket(page,value)).toHaveCount(0);
});
