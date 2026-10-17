import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, firstFreeBoardCell, reduceGame, validateGame, canDeliverQuest, getItem, resolveQuests } from '../../src/engine.ts';
import type { Action, GameData, GameState, Quest } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
const validate=(candidate: unknown)=>validateGame(candidate,data);
const visitors=data.characters.filter(person=>person.visitor&&!person.singleVisit);
const requests=data.quests.filter(quest=>visitors.some(person=>person.id===quest.character));
const firstRequests=visitors.map(person=>requests.find(quest=>quest.character===person.id)!);
const guest=data.characters.find(person=>person.singleVisit)!;
const dinner=data.quests.find(quest=>quest.character===guest.id)!;
const card=(page: Page,quest: Quest)=>page.locator(`.quest-card[data-quest="${quest.id}"]`);
const deliver=(page: Page,quest: Quest)=>page.getByRole('button',{name:`Deliver ${quest.title} for ${quest.reward} coins`,exact:true});
function act(state: GameState,action: Action){const result=reduceGame(state,action,data);expect(result.ok,result.message).toBe(true);return result.state;}
function checkpoint(count: number){
  let state=createGame(data);state.coins=100000;
  state.served=data.tasks[count-1]?.goals.served??0;state.merges=data.tasks[count-1]?.goals.merges??0;
  for(let index=0;index<count;index++)state=act(state,{type:'task'});
  state.coins=0;state.pendingScenes=[];return state;
}
/** UI fixtures provide known supplies. The engine tests cover production and the full service sequence. */
function supply(state: GameState,codes: string[]){
  const next=structuredClone(state);
  for(const code of codes){
    const index=firstFreeBoardCell(next,data);expect(index).toBeGreaterThanOrEqual(0);next.board[index]={code};
    if(!next.discovered.includes(code))next.discovered.push(code);
  }
  expect(validate(next)).toBe(true);return next;
}
const supplies=(quest: Quest)=>quest.requirements.flatMap(requirement=>Array<string>(requirement.quantity).fill(requirement.item));
function ready(quest: Quest){
  const count=data.tasks.findIndex(task=>task.id===quest.afterTask)+1,state=checkpoint(count);
  state.served=Math.max(state.served,quest.afterServed!);
  state.completedQuests=requests.slice(0,requests.indexOf(quest)).map(previous=>previous.id);
  return supply(state,supplies(quest));
}
function dinnerReady(){
  const state=checkpoint(data.tasks.findIndex(task=>task.id===dinner.afterTask)+1);
  state.served=Math.max(state.served,dinner.afterServed!);
  return supply(state,supplies(dinner));
}
async function saved(page: Page): Promise<GameState>{return page.evaluate(key=>navigator.locks.request(key,()=>JSON.parse(localStorage.getItem(key)!).state),SAVE_KEY);}
async function closeOffers(page: Page,state: GameState){
  for(const quest of data.quests.filter(quest=>canDeliverQuest(state,quest,data))){
    await expect(page.locator('.quest-offer h3')).toHaveText(quest.title);await page.keyboard.press('Escape');
  }
  await expect(page.locator('#modal')).toBeHidden();
}
async function start(page: Page,state: GameState){
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,exportSave(state,validate)]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);await closeOffers(page,state);
}
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
async function checkPortrait(portrait: Locator,sprite: number){
  await expect(portrait).toHaveClass(/visitor-portrait/);
  const style=await portrait.evaluate(element=>{
    const style=getComputedStyle(element);return {image:style.backgroundImage,position:style.backgroundPosition,size:style.backgroundSize,filter:style.filter};
  });
  expect(style.image).toContain('/assets/variants/visitor-portraits-640x640.webp');
  expect(style.position).toBe(['0px 0px','100% 0px','0px 100%','100% 100%'][sprite]);expect(style.size).toBe('200% 200%');expect(style.filter).toBe('none');
  expect(await portrait.evaluate(async element=>{
    const image=new Image();image.src=getComputedStyle(element).backgroundImage.slice(5,-2);await image.decode();return [image.naturalWidth,image.naturalHeight];
  })).toEqual([640,640]);
}

test('ordinary service opens a rare supply request at its service milestone and preserves three regular tickets',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const quest=requests[0],initial=ready(quest);initial.served=quest.afterServed!-1;
  const state=supply(initial,initial.orders[0].requirements),order=state.orders[0],person=data.characters.find(person=>person.id===order.customer)!;
  await start(page,state);await quests(page);await expect(card(page,quest)).toHaveCount(0);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:`Serve ${person.name} for ${order.reward} coins`,exact:true}).click();
  await expect(page.locator('.quest-offer h3')).toHaveText(quest.title);const served=await saved(page);
  expect(served.served).toBe(quest.afterServed);expect(served.orders.slice(1)).toEqual(state.orders.slice(1));
  expect(served.orders).toHaveLength(3);expect(served.orders.every(order=>!visitors.some(visitor=>visitor.id===order.customer))).toBe(true);
  await page.keyboard.press('Escape');await quests(page);await expect(card(page,quest)).toBeVisible();
  expect(resolveQuests(served,data).filter(view=>view.status==='active'&&requests.includes(view.quest))).toHaveLength(1);
  await page.keyboard.press('Escape');await expect(page.locator('#orders .order')).toHaveCount(3);
});

for(const quest of firstRequests)test(`${quest.character} shows exact expedition supplies and pays the larger reward once across reload and export`,async({page})=>{
  await start(page,ready(quest));const before=await saved(page);await quests(page);const request=card(page,quest);
  await expect(request).toContainText(data.characters.find(person=>person.id===quest.character)!.name);
  await expect(request).toContainText(quest.opening[0].text);
  for(const requirement of quest.requirements){
    const name=getItem(requirement.item,data)!.name;
    await expect(request.locator('.quest-requirements')).toContainText(`${requirement.quantity} ${name}`);
    await expect(request.getByRole('button',{name:`${name}: ${requirement.quantity} of ${requirement.quantity} on the board`,exact:true})).toBeVisible();
  }
  await expect(request.locator('.quest-reward')).toContainText(String(quest.reward));
  await request.scrollIntoViewIfNeeded();await page.screenshot({path:`test-results/visitors/${quest.character}-supply-quest.png`});
  expect(quest.reward).toBeGreaterThanOrEqual(supplies(quest).reduce((sum,code)=>sum+data.items[code].price,0)*2);
  await request.getByRole('button',{name:`Read request: ${quest.title}`,exact:true}).click();
  await expect(page.locator('#story-line')).toContainText(quest.opening[0].text);await finishScene(page);expect(await saved(page)).toEqual(before);
  await deliver(page,quest).click();await expect(page.locator('#story-line')).toContainText(quest.completion[0].text);const after=await saved(page);
  expect(after.completedQuests).toEqual([...before.completedQuests,quest.id]);expect(after.coins).toBe(before.coins+quest.reward);
  expect(after.orders).toEqual(before.orders);expect(after.seed).toBe(before.seed);expect(after.served).toBe(before.served);expect(after.xp).toBe(before.xp);
  expect(after.board.filter(Boolean).length).toBe(before.board.filter(Boolean).length-supplies(quest).length);
  await finishScene(page);await expect(deliver(page,quest)).toHaveCount(0);await page.keyboard.press('Escape');
  await page.reload();expect(await saved(page)).toEqual(after);await closeOffers(page,after);await quests(page);await expect(deliver(page,quest)).toHaveCount(0);
  await page.keyboard.press('Escape');await journal(page);await page.getByRole('button',{name:`Replay ${quest.title}`,exact:true}).click();await finishScene(page);expect(await saved(page)).toEqual(after);
  await page.keyboard.press('Escape');await page.locator('[data-house-book]:visible').first().click();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();
  const download=await downloadPromise,text=readFileSync((await download.path())!,'utf8');expect(JSON.parse(text).state).toEqual(after);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await page.locator('[data-house-book]:visible').first().click();await page.locator('input[type="file"]').setInputFiles({name:'visitor-supplies.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game'}).click();expect(await saved(page)).toEqual(after);
  await quests(page);await expect(deliver(page,quest)).toHaveCount(0);
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`visitor portraits and introductions fit ${viewport.width}x${viewport.height} in ${theme}`,async({page})=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,createGame(data));await journal(page);
  const before=await saved(page);
  for(const person of visitors){
    const entry=page.getByRole('button',{name:`Meet ${person.name}`,exact:true});await entry.scrollIntoViewIfNeeded();
    await checkPortrait(entry.locator('.portrait'),person.sprite);await expect(entry).toContainText(person.role);
    expect(await entry.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await entry.click();await expect(page.locator('#story-line')).toContainText(person.introduction);
    const portrait=page.locator('.story-stage .portrait');await checkPortrait(portrait,person.sprite);
    const box=(await portrait.boundingBox())!;expect(box.width).toBe(viewport.width>1023?120:82);expect(box.height).toBe(box.width);
    await expect(page.getByRole('button',{name:'Return',exact:true})).toBeInViewport();
    expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight)).toBe(true);
    await page.screenshot({path:`test-results/visitors/${person.id}-${viewport.width}-${theme}.png`});
    await finishScene(page);await expect(page.getByRole('button',{name:`Meet ${person.name}`,exact:true})).toBeFocused();expect(await saved(page)).toEqual(before);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

async function guestAbsent(page: Page){
  await quests(page);await expect(card(page,dinner)).toHaveCount(0);await page.keyboard.press('Escape');await journal(page);
  await expect(page.getByRole('button',{name:`Meet ${guest.name}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:`Read request: ${dinner.title}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:`Replay ${dinner.title}`,exact:true})).toHaveCount(0);
  await expect(page.getByRole('img',{name:guest.name,exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
  await expect(page.locator('#orders .order')).toHaveCount(3);await expect(page.locator('#orders')).not.toContainText(guest.name);
}

test('the castle guest stays hidden until the required preparation is complete',async({page})=>{
  const state=checkpoint(data.tasks.findIndex(task=>task.id===dinner.afterTask));state.served=dinner.afterServed!;
  await start(page,state);await guestAbsent(page);expect(await saved(page)).toEqual(state);
});

test('the castle guest appears at the service gate, pays once, and leaves the journal after his farewell',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const initial=dinnerReady();initial.served=dinner.afterServed!-1;
  const state=supply(initial,initial.orders[0].requirements),order=state.orders[0],customer=data.characters.find(person=>person.id===order.customer)!;
  await start(page,state);await guestAbsent(page);
  await page.getByRole('button',{name:`Serve ${customer.name} for ${order.reward} coins`,exact:true}).click();
  await expect(page.locator('.quest-offer h3')).toHaveText(dinner.title);await checkPortrait(page.locator('.quest-offer .portrait'),guest.sprite);
  // The Deliver buttons group the thousands as the reward line does.
  await expect(deliver(page,dinner)).toHaveText(`Deliver · ${dinner.reward.toLocaleString('en')}`);
  const before=await saved(page);expect(before.served).toBe(dinner.afterServed);
  await page.keyboard.press('Escape');await journal(page);const introduction=page.getByRole('button',{name:`Meet ${guest.name}`,exact:true});
  await introduction.click();await expect(page.locator('#story-line')).toContainText(guest.introduction);await finishScene(page);expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Escape');await quests(page);const request=card(page,dinner);
  await expect(request).toContainText(dinner.opening[0].text);await checkPortrait(request.locator('.portrait'),guest.sprite);
  for(const requirement of dinner.requirements){
    const name=getItem(requirement.item,data)!.name;
    await expect(request.getByRole('button',{name:`${name}: ${requirement.quantity} of ${requirement.quantity} on the board`,exact:true})).toBeVisible();
  }
  expect(dinner.reward).toBe(1100);expect(dinner.reward).toBe(supplies(dinner).reduce((sum,code)=>sum+data.items[code].price,0)*5);
  await expect(request.locator('.quest-reward')).toContainText(dinner.reward.toLocaleString('en'));
  await expect(deliver(page,dinner)).toHaveText(`Deliver · ${dinner.reward.toLocaleString('en')}`);await deliver(page,dinner).click();
  await expect(page.locator('#story-line')).toContainText(dinner.completion[0].text);const after=await saved(page);
  expect(after.completedQuests).toEqual([...before.completedQuests,dinner.id]);expect(after.coins).toBe(before.coins+dinner.reward);
  expect(after.orders).toEqual(before.orders);expect(after.seed).toBe(before.seed);expect(after.served).toBe(before.served);expect(after.xp).toBe(before.xp);
  expect(after.board.filter(Boolean).length).toBe(before.board.filter(Boolean).length-supplies(dinner).length);
  await finishScene(page);await page.keyboard.press('Escape');await guestAbsent(page);
  await page.reload();expect(await saved(page)).toEqual(after);await closeOffers(page,after);await guestAbsent(page);
  await page.locator('[data-house-book]:visible').first().click();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();
  const download=await downloadPromise,text=readFileSync((await download.path())!,'utf8');expect(JSON.parse(text).state).toEqual(after);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await page.locator('[data-house-book]:visible').first().click();await page.locator('input[type="file"]').setInputFiles({name:'castle-dinner.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game'}).click();expect(await saved(page)).toEqual(after);await guestAbsent(page);
});

test('a failed castle dinner save keeps the guest gone for the session and restores only durable progress on reload',async({page})=>{
  await start(page,dinnerReady());const before=await saved(page);await quests(page);
  await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===key)throw new Error('No space');original.call(this,name,value);};},SAVE_KEY);
  await deliver(page,dinner).click();await expect(page.locator('#story-line')).toContainText(dinner.completion[0].text);
  await expect(page.locator('.completion-message')).toContainText('This session is not saved.');await finishScene(page);
  await expect(page.getByRole('button',{name:'Retry save',exact:true})).toBeVisible();await expect(deliver(page,dinner)).toHaveCount(0);
  await page.keyboard.press('Escape');await guestAbsent(page);await expect(page.locator('#coin-total')).toHaveText(`${(before.coins+dinner.reward).toLocaleString('en')} coins`);expect(await saved(page)).toEqual(before);
  await page.reload();await closeOffers(page,before);await quests(page);await expect(deliver(page,dinner)).toBeEnabled();expect(await saved(page)).toEqual(before);
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`the castle guest and dinner fit ${viewport.width}x${viewport.height} in ${theme}`,async({page})=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,dinnerReady());await journal(page);
  const before=await saved(page),entry=page.getByRole('button',{name:`Meet ${guest.name}`,exact:true});
  await entry.scrollIntoViewIfNeeded();await checkPortrait(entry.locator('.portrait'),guest.sprite);await entry.click();
  await expect(page.locator('#story-line')).toContainText(guest.introduction);await checkPortrait(page.locator('.story-stage .portrait'),guest.sprite);
  await expect(page.getByRole('button',{name:'Return',exact:true})).toBeInViewport();
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight)).toBe(true);
  await page.screenshot({path:`test-results/visitors/ionatan-introduction-${viewport.width}-${theme}.png`});await finishScene(page);
  await page.keyboard.press('Escape');await quests(page);const request=card(page,dinner);await request.scrollIntoViewIfNeeded();
  await checkPortrait(request.locator('.portrait'),guest.sprite);await expect(request).toContainText(dinner.opening[0].text);
  expect(await request.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await page.screenshot({path:`test-results/visitors/ionatan-dinner-${viewport.width}-${theme}.png`});
  await expect(deliver(page,dinner)).toBeEnabled();expect(await saved(page)).toEqual(before);
});
