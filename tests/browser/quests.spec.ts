import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, firstFreeBoardCell, reduceGame, validateGame, resolveQuests, getItem, previewQuestCleanup, unresolvedObstacle } from '../../src/engine.ts';
import type { Action, GameData, GameState, Quest } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
const validate=(candidate: unknown)=>validateGame(candidate,data);
const firstQuests=data.characters.map(character=>data.quests.find(quest=>quest.character===character.id)!);
const optional=data.quests.find(quest=>quest.producer)!;
const card=(page: Page,quest: Quest)=>page.locator(`.quest-card[data-quest="${quest.id}"]`);
const deliver=(page: Page,quest: Quest)=>page.getByRole('button',{name:`Deliver ${quest.title} for ${quest.reward} coins`,exact:true});
const accept=(page: Page)=>page.getByRole('button',{name:`Accept ${optional.title}`,exact:true});
function act(state: GameState,action: Action){const result=reduceGame(state,action,data);expect(result.ok,result.message).toBe(true);return result.state;}
function checkpoint(count: number){
  let state=createGame(data);state.coins=100000;
  state.served=data.tasks[count-1]?.goals.served??0;state.merges=data.tasks[count-1]?.goals.merges??0;
  for(let index=0;index<count;index++)state=act(state,{type:'task'});
  state.coins=0;return state;
}
/** UI fixtures supply known ingredients. Legal, resource-free progression is covered by the engine campaign test. */
function supplied(state: GameState,quest: Quest){
  const next=structuredClone(state);
  for(const requirement of quest.requirements){
    for(let count=0;count<requirement.quantity;count++){
      const index=firstFreeBoardCell(next,data);expect(index).toBeGreaterThanOrEqual(0);next.board[index]={code:requirement.item};
    }
    if(!next.discovered.includes(requirement.item))next.discovered.push(requirement.item);
  }
  expect(validate(next)).toBe(true);return next;
}
function ready(quest: Quest){
  const count=quest.afterTask===null?0:data.tasks.findIndex(task=>task.id===quest.afterTask)+1;
  return supplied(checkpoint(count),quest);
}
function offer(){
  const count=data.tasks.findIndex(task=>task.id===optional.afterTask)+1;let state=checkpoint(count);
  for(let guard=0;resolveQuests(state,data).find(view=>view.quest.id===optional.id)!.status!=='offer';guard++){
    expect(guard).toBeLessThan(data.quests.length);
    const next=resolveQuests(state,data).find(view=>view.status==='active'&&!view.quest.producer)!.quest;
    state=act(supplied(state,next),{type:'deliverQuest',id:next.id});
  }
  expect(validate(state)).toBe(true);return state;
}
function cleanupReady(){
  let state=act(offer(),{type:'acceptQuest',id:optional.id});const producer=optional.producer!;
  const make=(code: string): void=>{
    const item=getItem(code,data)!;
    if(item.stage===1){state=act(state,{type:'spawn',index:state.board.findIndex(cell=>cell?.code===producer.item)});return;}
    const lower=Object.values(data.questItems).find(item=>item.next===code)!.id;
    make(lower);const first=state.board.findIndex(cell=>cell?.code===lower);make(lower);
    const second=state.board.findIndex((cell,index)=>cell?.code===lower&&index!==first);state=act(state,{type:'move',from:first,to:second});
  };
  for(const requirement of optional.requirements)for(let count=0;count<requirement.quantity;count++)make(requirement.item);
  make(producer.outputs[0]);state=act(state,{type:'store',index:state.board.findIndex(cell=>cell?.code===producer.outputs[0])});
  make(producer.outputs[0]);state=act(state,{type:'store',index:state.board.findIndex(cell=>cell?.code===producer.item)});
  state=act(state,{type:'store',index:state.board.findIndex(cell=>cell?.code==='bakery_1')});
  expect(validate(state)).toBe(true);return state;
}
async function start(page: Page,state: GameState){
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,exportSave(state,validate)]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);
}
async function saved(page: Page): Promise<GameState>{return page.evaluate(key=>navigator.locks.request(key,()=>JSON.parse(localStorage.getItem(key)!).state),SAVE_KEY);}
async function quests(page: Page){
  if(!await page.locator('[data-quests]:visible').count())await page.locator('#story-button').click();
  await page.locator('[data-quests]:visible').click();await expect(page.getByRole('dialog',{name:'Neighbour quests',exact:true})).toBeVisible();
}
async function journal(page: Page){
  if(!await page.getByRole('button',{name:'Open the story journal',exact:true}).isVisible())await page.locator('#story-button').click();
  await page.getByRole('button',{name:'Open the story journal',exact:true}).click();
}
async function finishScene(page: Page){
  while(await page.locator('.story-controls .primary-button').textContent()==='Continue')await page.locator('.story-controls .primary-button').click();
  await page.getByRole('button',{name:'Return',exact:true}).click();
}
async function house(page: Page){await page.locator('[data-house-book]:visible').first().click();}

for(const quest of firstQuests)test(`${quest.character} can read and deliver a named request without replacing ordinary orders`,async({page})=>{
  await start(page,ready(quest));const before=await saved(page);await quests(page);
  const request=card(page,quest);await expect(request).toContainText(data.characters.find(character=>character.id===quest.character)!.name);
  for(const requirement of quest.requirements)await expect(request.locator('.quest-requirements')).toContainText(`${requirement.quantity} ${getItem(requirement.item,data)!.name}`);
  await expect(request.locator('.quest-reward')).toContainText(String(quest.reward));await expect(request).toContainText(/board|pantry/);
  await request.getByRole('button',{name:`Read request: ${quest.title}`,exact:true}).click();
  await expect(page.locator('#story-line')).toContainText(quest.opening[0].text);await finishScene(page);expect(await saved(page)).toEqual(before);
  await expect(request.locator('h3')).toBeFocused();await deliver(page,quest).click();
  await expect(page.locator('#story-line')).toContainText(quest.completion[0].text);const after=await saved(page);
  expect(after.completedQuests).toEqual([...before.completedQuests,quest.id]);expect(after.coins).toBe(before.coins+quest.reward);
  expect(after.orders).toEqual(before.orders);expect(after.seed).toBe(before.seed);expect(after.served).toBe(before.served);
  await finishScene(page);await expect(deliver(page,quest)).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(page.locator('#orders .order')).toHaveCount(3);
  await page.reload();expect(await saved(page)).toEqual(after);await quests(page);await expect(deliver(page,quest)).toHaveCount(0);
});

test('quest rewards survive export and import, while introductions and journal replay give no reward',async({page})=>{
  const quest=firstQuests[0];await start(page,ready(quest));await journal(page);const initial=await saved(page);
  for(const character of data.characters){
    await page.getByRole('button',{name:`Meet ${character.name}`,exact:true}).click();await expect(page.locator('#story-line')).toContainText(character.introduction);
    await finishScene(page);expect(await saved(page)).toEqual(initial);
  }
  await page.keyboard.press('Escape');await quests(page);await deliver(page,quest).click();await finishScene(page);await page.keyboard.press('Escape');
  const committed=await saved(page);await journal(page);
  for(const name of [`Read request: ${quest.title}`,`Replay ${quest.title}`]){
    await page.getByRole('button',{name,exact:true}).click();await finishScene(page);await expect(page.getByRole('button',{name:`Replay ${quest.title}`,exact:true})).toBeFocused();expect(await saved(page)).toEqual(committed);
  }
  await page.keyboard.press('Escape');await house(page);const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();
  const download=await downloadPromise,text=readFileSync((await download.path())!,'utf8');expect(JSON.parse(text).state).toEqual(committed);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await house(page);await page.locator('input[type="file"]').setInputFiles({name:'quests.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game'}).click();expect(await saved(page)).toEqual(committed);
  await page.reload();await quests(page);await expect(deliver(page,quest)).toHaveCount(0);expect(await saved(page)).toEqual(committed);
});

test('a pantry ingredient cannot satisfy a delivery until it returns to the board',async({page})=>{
  const quest=firstQuests[0];let initial=ready(quest);const code=quest.requirements[0].item;
  initial=act(initial,{type:'store',index:initial.board.findIndex(cell=>cell?.code===code)});
  await start(page,initial);await quests(page);await expect(deliver(page,quest)).toBeDisabled();expect(await saved(page)).toEqual(initial);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:`Return ${getItem(code,data)!.name} to the board`,exact:true}).click();
  await quests(page);await expect(deliver(page,quest)).toBeEnabled();await deliver(page,quest).click();expect((await saved(page)).completedQuests).toContain(quest.id);
});

test('a surplus on the board reads as the required count in the visible and accessible quest rows',async({page})=>{
  const quest=firstQuests[0],requirement=quest.requirements[0],name=getItem(requirement.item,data)!.name;
  await start(page,supplied(ready(quest),quest));await quests(page);
  const row=card(page,quest).getByRole('button',{name:`${name}: ${requirement.quantity} of ${requirement.quantity} on the board`,exact:true});
  await expect(row).toBeVisible();await expect(row.locator('.quest-count')).toHaveText(`${requirement.quantity} / ${requirement.quantity} on board`);
});

test('quest ingredient help keeps focus on the next anchored merge on desktop and phone',async({page})=>{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);await start(page,createGame(data));await quests(page);
    const quest=firstQuests[0],code=quest.requirements[0].item;
    await card(page,quest).getByRole('button',{name:new RegExp(`^${getItem(code,data)!.name}:`)}).click();
    await page.getByRole('button',{name:'Show me on the board',exact:true}).click();
    await expect(page.locator('#modal')).toBeHidden();
    const movable=page.locator('#board .selected');await expect(movable).toHaveAttribute('aria-label',/Elderflowers/);
    await expect(movable).toBeFocused();
    await expect(page.locator('[data-cell="37"]')).toHaveClass(/hint/);
    // An unrelated render must not mask a focus return queued by the dialog close event.
    await page.keyboard.press('ArrowRight');await expect(page.locator('#board :focus')).toHaveCount(1);
  }
});

test('a failed write marks the quest unsaved and reload restores only durable progress',async({page})=>{
  const quest=firstQuests[0];await start(page,ready(quest));const before=await saved(page);await quests(page);
  await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===key)throw new Error('No space');original.call(this,name,value);};},SAVE_KEY);
  await deliver(page,quest).click();await expect(page.locator('.completion-message')).toContainText('This session is not saved.');await finishScene(page);await expect(page.locator('.quest-book .save-status')).toContainText(/not saved|unsaved/i);
  await expect(page.locator('#coins')).toHaveText(String(before.coins+quest.reward));await expect(deliver(page,quest)).toHaveCount(0);expect(await saved(page)).toEqual(before);
  await page.reload();await quests(page);await expect(deliver(page,quest)).toBeEnabled();expect(await saved(page)).toEqual(before);
});

test('keyboard and emulated touch can inspect and finish quests with focus returned',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage(),quest=firstQuests[0];await start(page,ready(quest));await page.locator('#story-button').tap();
    await page.locator('[data-quests]:visible').focus();await page.keyboard.press('Enter');await expect(page.locator('#modal-title')).toBeFocused();
    await card(page,quest).getByRole('button',{name:`Read request: ${quest.title}`,exact:true}).tap();await finishScene(page);await expect(card(page,quest).locator('h3')).toBeFocused();
    await deliver(page,quest).focus();await page.keyboard.press('Space');await finishScene(page);expect((await saved(page)).completedQuests).toContain(quest.id);
    await page.keyboard.press('Escape');await expect(page.locator('#story-button')).toBeFocused();
    expect(await page.locator('#board').evaluate(board=>board.getAnimations({subtree:true}).length)).toBe(0);
  }finally{await context.close();}
});

test('an optional offer needs space and puts its sole producer in the pantry when the board is full',async({page})=>{
  const initial=offer();initial.board=initial.board.map((cell,index)=>cell||unresolvedObstacle(initial,index,data)?cell:{code:'bakery_1'});initial.inventory=Array.from({length:data.inventoryCapacity},()=>({code:'bakery_1'}));
  const sellFlour=async()=>{const state=await saved(page);await page.locator(`[data-cell="${state.board.findIndex(cell=>cell?.code==='bakery_1')}"]`).click();await page.getByRole('button',{name:'Sell for 1 coin',exact:true}).click();};
  await start(page,initial);await quests(page);await expect(card(page,optional)).toContainText(/board|pantry/);await accept(page).click();await expect(page.locator('.quest-notice')).toContainText(/space/);expect(await saved(page)).toEqual(initial);
  await page.keyboard.press('Escape');await sellFlour();
  await page.getByRole('button',{name:'Return Flour to the board',exact:true}).first().click();const before=await saved(page);
  await quests(page);await accept(page).click();await expect(card(page,optional).locator('h3')).toBeFocused();const accepted=await saved(page);
  expect(accepted.inventory).toEqual([...before.inventory,{code:optional.producer!.item}]);expect(accepted.board).toEqual(before.board);expect(accepted.activeQuestProducers).toEqual({[optional.id]:0});
  await expect(accept(page)).toHaveCount(0);await page.keyboard.press('Escape');await page.reload();expect(await saved(page)).toEqual(accepted);
  await sellFlour();
  await page.getByRole('button',{name:`Return ${getItem(optional.producer!.item,data)!.name} to the board`,exact:true}).click();const retrieved=await saved(page);
  const source=page.locator(`[data-cell="${retrieved.board.findIndex(cell=>cell?.code===optional.producer!.item)}"]`);await source.click();
  await expect(page.locator('#item-detail').getByRole('button',{name:/^Sell/})).toHaveCount(0);
  // Make room, then take twice to verify the authored immediate output through the interface.
  await sellFlour();await source.click();
  let production=await saved(page);expect(production.activeQuestProducers[optional.id]).toBe(0);
  expect(production.board.filter(cell=>cell?.code===optional.producer!.outputs[0])).toHaveLength(1);
  await sellFlour();await source.click();
  production=await saved(page);expect(production.activeQuestProducers[optional.id]).toBe(0);expect(production.board.filter(cell=>cell?.code===optional.producer!.outputs[0])).toHaveLength(2);expect(production.seed).toBe(before.seed);
  await page.getByRole('button',{name:'Store',exact:true}).click();await page.reload();expect((await saved(page)).inventory).toContainEqual({code:optional.producer!.item});
});

test('cleanup previews exact exclusive leftovers, cancels safely, and preserves every ordinary item',async({page})=>{
  const initial=cleanupReady(),preview=previewQuestCleanup(initial,optional.id,data)!;await start(page,initial);await quests(page);await deliver(page,optional).click();
  await expect(page.getByRole('dialog',{name:'Return the tasting supplies',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Keep items',exact:true})).toBeFocused();
  const list=page.locator('.quest-cleanup-list li');await expect(list).toHaveCount(preview.board.length+preview.inventory.length);
  await expect(list).toHaveText([...preview.board.map(item=>`${getItem(item.item,data)!.name} · Board space ${item.index+1}`),...preview.inventory.map(item=>`${getItem(item.item,data)!.name} · Pantry space ${item.index+1}`)]);
  expect(await saved(page)).toEqual(initial);await page.getByRole('button',{name:'Keep items',exact:true}).click();await expect(card(page,optional).locator('h3')).toBeFocused();expect(await saved(page)).toEqual(initial);
  await deliver(page,optional).click();await page.getByRole('button',{name:'Deliver and return supplies',exact:true}).click();const after=await saved(page);
  const exclusive=new Set(optional.producer!.exclusiveItems),ordinary=(cells: GameState['board'])=>cells.filter(cell=>cell&&!exclusive.has(cell.code));
  expect(ordinary(after.board)).toEqual(ordinary(initial.board));expect(ordinary(after.inventory)).toEqual(ordinary(initial.inventory));
  expect([...after.board,...after.inventory].some(cell=>cell&&exclusive.has(cell.code))).toBe(false);expect(after.orders).toEqual(initial.orders);
  expect(after.coins).toBe(initial.coins+optional.reward);expect(after.completedQuests).toContain(optional.id);expect(after.activeQuestProducers).toEqual({});
  await finishScene(page);await page.keyboard.press('Escape');await page.reload();expect(await saved(page)).toEqual(after);
});

test('the cleanup note names the lending neighbour from the game data',async({page})=>{
  const renamed: GameData=structuredClone(data);renamed.characters.find(person=>person.id===optional.character)!.name='Vasile';
  await page.route('**/data/game.json',route=>route.fulfill({json:renamed}));
  await start(page,cleanupReady());await quests(page);await expect(card(page,optional)).toContainText('will return to Vasile.');
});

test('another tab cancels a stale cleanup preview without reclaiming its newer items',async({page,context})=>{
  await start(page,cleanupReady());await quests(page);await deliver(page,optional).click();await expect(page.getByRole('button',{name:'Deliver and return supplies',exact:true})).toBeVisible();
  const other=await context.newPage();await other.goto('./');await expect(other.locator('#board button')).toHaveCount(42);
  const before=await saved(other);await other.locator(`[data-cell="${before.board.findIndex(cell=>cell?.code==='generator_bakery')}"]`).click();
  const newer=await saved(other);await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(newer);
  expect(newer.completedQuests).not.toContain(optional.id);expect(newer.activeQuestProducers).toEqual(before.activeQuestProducers);expect(newer.inventory).toEqual(before.inventory);await other.close();
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:390,height:800}])for(const theme of ['light','dark'] as const)test(`neighbour quests and cleanup fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,cleanupReady());await quests(page);
  const book=page.locator('.quest-book');await expect(card(page,optional)).toBeVisible();
  for(const control of await book.locator('button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  const contrasts=await book.evaluate(element=>{
    const luminance=(value: string)=>value.match(/\d+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const background=luminance(getComputedStyle(element.closest('dialog')!).backgroundColor);
    return [...element.querySelectorAll('p,h3,li')].map(node=>{const ink=luminance(getComputedStyle(node).color);return(Math.max(ink,background)+.05)/(Math.min(ink,background)+.05);});
  });expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({path:testInfo.outputPath('neighbour-quests.png')});await deliver(page,optional).click();
  await expect(page.getByRole('button',{name:'Keep items',exact:true})).toBeFocused();await expect(page.getByRole('button',{name:'Deliver and return supplies',exact:true})).toBeInViewport();
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('quest-cleanup.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});
