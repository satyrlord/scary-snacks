import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { firstFreeBoardCell, generatorOutputs, resolveQuests } from '../../src/engine.ts';
import type { GameState, SceneLine } from '../../src/engine.ts';
import { act, data, deliverButton, deliverable, exportText, failWrites, journal, onTicket, opened, options, person, quest, readTo, replaceSave, request, saved, start, startAgainAndImport, story, supplies, supply, ticket, toast } from './support.ts';

const dinner=quest('ionatan-castle-dinner');
const search=quest('mina-avram-search');
const companions=['mina','avram'];
async function scene(page: Page,lines: SceneLine[]){
  for(const [index,line] of lines.entries()){
    await expect(page.locator('#story-line h3')).toHaveText(person(line.speaker).name);
    await expect(page.locator('#story-line p')).toHaveText(line.text);
    if(index<lines.length-1)await page.getByRole('button',{name:'Continue',exact:true}).click();
  }
  await page.locator('.story-controls .primary-button').click();
}
/** Mina and Avram have journal introductions only while their shared request is open. */
async function guests(page: Page,present: boolean){
  await journal(page);
  for(const id of companions)await expect(page.getByRole('button',{name:`Meet ${person(id).name}`,exact:true})).toHaveCount(present?1:0);
  await expect(page.getByRole('button',{name:`Replay ${search.title}`,exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
  await expect(ticket(page,search)).toHaveCount(present?1:0);
}
async function portrait(target: Locator,sprite: number){
  const style=await target.evaluate(element=>{const style=getComputedStyle(element);return {image:style.backgroundImage,position:style.backgroundPosition,size:style.backgroundSize,filter:style.filter};});
  expect(style.image).toContain('/assets/variants/guests-640x640.webp');await expect(target).toHaveClass(new RegExp(`portrait-${sprite}`));
  const side=200/parseFloat(style.size),position=style.position.split(' ').map(parseFloat);
  const left=position[0]/100*(2-side)-sprite%2,top=position[1]/100*(2-side)-Math.floor(sprite/2);
  expect(side).toBeGreaterThan(.7);expect(side).toBeLessThan(.9);
  expect(left).toBeGreaterThanOrEqual(-.00001);expect(top).toBeGreaterThanOrEqual(-.00001);
  expect(left+side).toBeLessThanOrEqual(1.00001);expect(top+side).toBeLessThanOrEqual(1.00001);expect(style.filter).toBe('none');
  expect(await target.evaluate(async element=>{const image=new Image();image.src=getComputedStyle(element).backgroundImage.slice(5,-2);await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([640,640]);
}
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
  await start(page,deliverable(search));await guests(page,true);await request(page,search);
  const dialog=page.getByRole('dialog',{name:search.title,exact:true});
  await expect(dialog.locator('.quest-person')).toHaveText('Mina and Avram');
  for(const id of companions)await portrait(dialog.getByRole('img',{name:person(id).name,exact:true}),person(id).sprite);
  for(const line of search.opening)await expect(dialog).toContainText(`${person(line.speaker).name}: ${line.text}`);
  for(const {item,quantity} of search.requirements)await expect(dialog.getByRole('button',{name:`${quantity} ${data.items[item].name}: ${quantity} of ${quantity} on the board`,exact:true})).toBeVisible();
  const before=await saved(page);await dialog.getByRole('button',{name:/^Deliver /}).click();
  await expect(toast(page)).toHaveText(`${search.title}: delivered. Earned ${search.reward} coins.`);
  await story(page);await page.getByRole('button',{name:`Read now: ${search.title}`,exact:true}).click();await scene(page,search.completion);
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
    while(!resolveQuests(state,data).some(view=>view.status==='active')){
      state.coins=data.tasks[state.taskIndex].cost;state=act(state,{type:'task'});for(const id of [...state.pendingScenes])state=act(state,{type:'readScene',id});
    }
    return resolveQuests(state,data).find(view=>view.status==='active')!.quest;
  };
  for(let count=0;count<2;count++){const value=next();state=delivered(state,value.id);}
  expect(state.pendingScenes).toEqual([]);
  const third=next();
  await start(page,supply(state,supplies(third)));await deliverButton(page,third).click();
  await expect(toast(page)).toHaveText(`${third.title}: delivered. Earned ${third.reward} coins.`);
  expect((await saved(page)).pendingScenes).toEqual([third.id,search.followUp!.id]);
  await story(page);await page.getByRole('button',{name:`Read now: ${third.title}`,exact:true}).click();
  await expect(page.getByRole('dialog',{name:third.title,exact:true})).toBeVisible();
  await readTo(page,'Next scene');await expect(page.getByRole('dialog',{name:search.followUp!.title,exact:true})).toBeVisible();
  await scene(page,search.followUp!.dialogue);expect((await saved(page)).pendingScenes).toEqual([]);
  await journal(page);await expect(page.getByRole('button',{name:`Replay ${search.followUp!.title}`,exact:true})).toBeVisible();await page.keyboard.press('Escape');await guests(page,false);
});

test('a failed shared delivery save removes both guests in the session, and reload restores the shared visit',async({page})=>{
  await start(page,deliverable(search));const before=await saved(page);
  await failWrites(page);await deliverButton(page,search).click();await expect(toast(page)).toContainText('This session is not saved.');
  await guests(page,false);expect(await saved(page)).toEqual(before);
  await page.reload();await opened(page);await guests(page,true);await expect(deliverButton(page,search)).toBeEnabled();
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`all four guest portraits and the shared meal fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,deliverable(search));await journal(page);
  for(const guest of data.characters.filter(value=>value.portraitAtlas==='guest')){
    const entry=page.getByRole('button',{name:`Meet ${guest.name}`,exact:true});await entry.scrollIntoViewIfNeeded();await portrait(entry.locator('.portrait'),guest.sprite);await expect(entry).toContainText(guest.role);
    expect(await entry.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);await entry.click();await portrait(page.locator('.story-stage .portrait'),guest.sprite);
    await expect(page.locator('#story-line')).toContainText(guest.introduction);await expect(page.getByRole('button',{name:'Return',exact:true})).toBeInViewport();
    expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`${guest.id}.png`)});await scene(page,[{speaker:guest.id,text:guest.introduction}]);
  }
  await page.keyboard.press('Escape');await request(page,search);const view=page.locator('.quest-view');
  await portrait(view.getByRole('img',{name:'Mina',exact:true}),person('mina').sprite);await portrait(view.getByRole('img',{name:'Avram',exact:true}),person('avram').sprite);
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('shared-meal.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('Vlad’s quest shows the red wine picture on its ticket and opens the wine’s help',async({page})=>{
  const value=quest('vlad-after-dark');expect(value.requirements.map(requirement=>requirement.item)).toContain('drinks_5');
  await start(page,onTicket(value));await portrait(ticket(page,value).locator('.portrait'),person('vlad').sprite);
  await winePicture(ticket(page,value));await request(page,value);
  await page.getByRole('button',{name:`1 Red wine: 0 of 1 on the board`,exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Red wine',exact:true})).toBeVisible();await winePicture(page.locator('#modal'));
  await expect(page.getByRole('dialog')).toContainText('Merge two Cherry compote to make Red wine.');
});

async function dismissDialogs(page: Page){while(await page.locator('#modal').isVisible())await page.keyboard.press('Escape');}
/** Make the dish through the source and board controls, without adding supplies to the save. */
async function makeDish(page: Page,code: string): Promise<number>{
  const before=await saved(page),item=data.items[code],source=`generator_${item.chain}`;
  if(generatorOutputs(before,source,data).includes(code)){
    const at=before.board.findIndex(cell=>cell?.code===source),tile=page.locator(`[data-cell="${at}"]`);
    if(await tile.getAttribute('aria-pressed')!=='true'){
      const empty=firstFreeBoardCell(before,data);await tile.click();await dismissDialogs(page);
      if((await saved(page)).board[empty]?.code===code)return empty;
    }
    const empty=firstFreeBoardCell(await saved(page),data);expect(empty).toBeGreaterThanOrEqual(0);
    await page.getByRole('button',{name:`Take ${item.name}`,exact:true}).click();await dismissDialogs(page);
    expect((await saved(page)).board[empty]?.code).toBe(code);return empty;
  }
  const lower=Object.values(data.items).find(candidate=>candidate.next===code)!;
  const first=await makeDish(page,lower.id),second=await makeDish(page,lower.id);
  await page.locator(`[data-cell="${first}"]`).click();await page.locator(`[data-cell="${second}"]`).click();await dismissDialogs(page);
  expect((await saved(page)).board[second]?.code).toBe(code);return second;
}
async function winePicture(target: Locator){
  const image=target.locator('.food image[href*="red-wine"]').first();
  await expect(image).toHaveAttribute('href',/assets\/variants\/red-wine-256x256\.webp$/);
  expect(await image.evaluate(async element=>{const image=new Image();image.src=element.getAttribute('href')!;await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([256,256]);
}

test('red wine made through the visible controls readies Vlad’s quest, and Deliver pays it once',async({page})=>{
  test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});
  const value=quest('vlad-after-dark'),initial=supply(onTicket(value),value.requirements.filter(requirement=>requirement.item!=='drinks_5').map(requirement=>requirement.item));
  await start(page,initial);await expect(deliverButton(page,value)).toBeDisabled();
  const wine=await makeDish(page,'drinks_5');
  await expect(page.locator(`[data-cell="${wine}"]`)).toHaveAttribute('aria-label',/Red wine$/);await winePicture(page.locator(`[data-cell="${wine}"]`));
  await expect(deliverButton(page,value)).toBeEnabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(value.requirements.length);
  const ready=await saved(page);expect(ready.discovered).toContain('drinks_5');
  await deliverButton(page,value).click();await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  const after=await saved(page);expect(after.coins).toBe(ready.coins+value.reward);expect(after.completedQuests).toEqual([...ready.completedQuests,value.id]);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);await expect(ticket(page,value)).toHaveCount(0);
});
