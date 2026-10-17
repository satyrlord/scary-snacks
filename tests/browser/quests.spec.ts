import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, firstFreeBoardCell, reduceGame, validateGame, resolveQuests, getItem, unresolvedObstacle, canDeliverQuest } from '../../src/engine.ts';
import type { Action, GameData, GameState, Quest } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
const validate=(candidate: unknown)=>validateGame(candidate,data);
const firstQuests=data.characters.filter(character=>!character.visitor&&data.quests.some(quest=>quest.character===character.id)).map(character=>data.quests.find(quest=>quest.character===character.id)!);
const card=(page: Page,quest: Quest)=>page.locator(`.quest-card[data-quest="${quest.id}"]`);
const deliver=(page: Page,quest: Quest)=>page.getByRole('button',{name:`Deliver ${quest.title} for ${quest.reward} coins`,exact:true});
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
async function start(page: Page,state: GameState){
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,exportSave(state,validate)]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);await closeOffers(page,state);
}
const person=(quest: Quest)=>data.characters.find(character=>character.id===quest.character)!.name;
const offered=(page: Page,quest: Quest)=>page.getByRole('dialog',{name:`${person(quest)}’s request is ready`,exact:true});
/** A load opens one request dialog for each ready request, in data order. The tests continue behind them. */
async function closeOffers(page: Page,state: GameState){
  for(const quest of data.quests.filter(quest=>canDeliverQuest(state,quest,data))){await expect(page.locator('.quest-offer h3')).toHaveText(quest.title);await page.keyboard.press('Escape');}
  await expect(page.locator('#modal')).toBeHidden();
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
  await expect(request.locator('.quest-reward')).toContainText(String(quest.reward));await expect(request).toContainText(/board/);
  await request.getByRole('button',{name:`Read request: ${quest.title}`,exact:true}).click();
  await expect(page.locator('#story-line')).toContainText(quest.opening[0].text);await finishScene(page);expect(await saved(page)).toEqual(before);
  await expect(request.locator('h3')).toBeFocused();await deliver(page,quest).click();
  await expect(page.locator('#story-line')).toContainText(quest.completion[0].text);const delivered=await saved(page);
  // The completion scene waits until the player finishes it. Then nothing else changes.
  expect(delivered.pendingScenes).toEqual([...before.pendingScenes,quest.id]);const after={...delivered,pendingScenes:before.pendingScenes};
  expect(after.completedQuests).toEqual([...before.completedQuests,quest.id]);expect(after.coins).toBe(before.coins+quest.reward);
  expect(after.orders).toEqual(before.orders);expect(after.seed).toBe(before.seed);expect(after.served).toBe(before.served);
  await finishScene(page);await expect(deliver(page,quest)).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(page.locator('#orders .order')).toHaveCount(3);
  await page.reload();expect(await saved(page)).toEqual(after);await closeOffers(page,after);await quests(page);await expect(deliver(page,quest)).toHaveCount(0);
});

test('a reload during a quest completion scene keeps it waiting in Story and the journal, and Read now finishes it once',async({page})=>{
  const quest=firstQuests[0];await start(page,ready(quest));const before=await saved(page);await quests(page);await deliver(page,quest).click();
  await expect(page.locator('#story-line')).toContainText(quest.completion[0].text);await expect(page.getByRole('button',{name:'Skip scene',exact:true})).toBeVisible();
  const delivered=await saved(page);expect(delivered.pendingScenes).toEqual([...before.pendingScenes,quest.id]);
  await page.reload();await expect(page.locator('#board button')).toHaveCount(42);await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  expect(await saved(page)).toEqual(delivered);
  await journal(page);await expect(page.getByRole('button',{name:`Read ${quest.title}`,exact:true})).toContainText('New scene');await page.keyboard.press('Escape');
  if(!await page.locator('#story').isVisible())await page.locator('#story-button').click();
  await page.getByRole('button',{name:`Read now: ${quest.title}`,exact:true}).click();await expect(page.locator('#story-line')).toContainText(quest.completion[0].text);
  await page.getByRole('button',{name:'Back to the kitchen',exact:true}).click();await expect(page.locator('#modal')).toBeHidden();
  const read=await saved(page);expect(read).toEqual({...delivered,pendingScenes:before.pendingScenes});expect(read.coins).toBe(before.coins+quest.reward);
  await journal(page);await expect(page.getByRole('button',{name:`Replay ${quest.title}`,exact:true})).toBeVisible();
});

test('quest rewards survive export and import, while introductions and journal replay give no reward',async({page})=>{
  const quest=firstQuests[0];await start(page,ready(quest));await journal(page);const initial=await saved(page);
  for(const character of data.characters.filter(character=>!character.singleVisit)){
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
  await page.reload();await closeOffers(page,committed);await quests(page);await expect(deliver(page,quest)).toHaveCount(0);expect(await saved(page)).toEqual(committed);
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
  await page.reload();await closeOffers(page,before);await quests(page);await expect(deliver(page,quest)).toBeEnabled();expect(await saved(page)).toEqual(before);
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

/** The first ingredient waits as two lower items, so one merge makes the request ready. */
function almost(state: GameState,quest: Quest){
  const next=structuredClone(state),item=quest.requirements[0].item,lower=Object.values(data.items).find(value=>value.next===item)!.id;
  const first=next.board.findIndex(cell=>cell?.code===item);next.board[first]={code:lower};
  const second=firstFreeBoardCell(next,data);next.board[second]={code:lower};
  expect(validate(next)).toBe(true);return {state:next,first,second};
}
async function merge(page: Page,{first,second}: {first: number; second: number}){await page.locator(`[data-cell="${first}"]`).click();await page.locator(`[data-cell="${second}"]`).click();}

test('a request that becomes ready offers its delivery once, and Close delivers nothing',async({page})=>{
  const quest=firstQuests[0],fixture=almost(ready(quest),quest);await start(page,fixture.state);await merge(page,fixture);
  await expect(offered(page,quest)).toBeVisible();await expect(page.locator('#close-modal')).toBeFocused();
  await expect(page.locator('.quest-offer h3')).toHaveText(quest.title);await expect(page.locator('.quest-offer .quest-reward')).toContainText(String(quest.reward));
  const merged=await saved(page);expect(merged.completedQuests).toEqual([]);
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();await expect(page.locator(`[data-cell="${fixture.second}"]`)).toBeFocused();
  // The request waits in Neighbour quests, and closing another dialog does not offer it again.
  await quests(page);await expect(deliver(page,quest)).toBeEnabled();await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();
  expect(await saved(page)).toEqual(merged);
});

test('each load offers a ready request again, and later actions do not repeat the offer',async({page})=>{
  const quest=firstQuests[0],initial=ready(quest);await start(page,initial);
  await page.reload();await expect(offered(page,quest)).toBeVisible();await expect(page.locator('#close-modal')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(initial);
  await page.locator(`[data-cell="${initial.board.findIndex(cell=>cell?.code==='generator_bakery')}"]`).click();
  expect((await saved(page)).board.filter(Boolean).length).toBe(initial.board.filter(Boolean).length+1);await expect(page.locator('#modal')).toBeHidden();
});

test('another tab preserves a dismissed request while its ingredients are missing',async({page,context})=>{
  const quest=firstQuests[0],initial=ready(quest),item=quest.requirements[0].item;
  const lower=Object.values(data.items).find(value=>value.next===item)!.id,positions: number[]=[];
  for(let count=0;count<2;count++){const at=firstFreeBoardCell(initial,data);positions.push(at);initial.board[at]={code:lower};}
  if(!initial.discovered.includes(lower))initial.discovered.push(lower);
  await start(page,initial);
  await page.locator(`[data-cell="${initial.board.findIndex(cell=>cell?.code===item)}"]`).click();
  await page.getByRole('button',{name:/^Sell /}).click();
  const other=await context.newPage();await other.goto('./');await expect(other.locator('#board button')).toHaveCount(42);
  await other.locator(`[data-cell="${initial.board.findIndex(cell=>cell?.code==='generator_bakery')}"]`).click();
  await expect(page.locator('#status')).toHaveText('This game moved on in another tab. The board now shows that progress.');
  await merge(page,{first:positions[0],second:positions[1]});
  const after=await saved(page);expect(canDeliverQuest(after,quest,data)).toBe(true);
  await expect(page.locator('#modal')).toBeHidden();await other.close();
});

test('Deliver in the offer plays the completion and returns to the kitchen',async({page})=>{
  const quest=firstQuests[0],fixture=almost(ready(quest),quest);await start(page,fixture.state);await merge(page,fixture);const before=await saved(page);
  await offered(page,quest).getByRole('button',{name:`Deliver ${quest.title} for ${quest.reward} coins`,exact:true}).click();
  await expect(page.locator('#story-line')).toContainText(quest.completion[0].text);const delivered=await saved(page);
  // The completion scene waits until the player finishes it. Then nothing else changes.
  expect(delivered.pendingScenes).toEqual([...before.pendingScenes,quest.id]);const after={...delivered,pendingScenes:before.pendingScenes};
  expect(after.completedQuests).toEqual([quest.id]);expect(after.coins).toBe(before.coins+quest.reward);expect(after.orders).toEqual(before.orders);
  while(await page.locator('.story-controls .primary-button').textContent()==='Continue')await page.locator('.story-controls .primary-button').click();
  await page.getByRole('button',{name:'Back to the kitchen',exact:true}).click();await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#board [tabindex="0"]')).toBeFocused();
});

test('a level-up comes before the request that the same merge made ready',async({page})=>{
  const quest=firstQuests[0],fixture=almost(ready(quest),quest);fixture.state.xp=99;await start(page,fixture.state);await merge(page,fixture);
  await expect(page.getByRole('dialog',{name:'Level 2 reached',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  await expect(offered(page,quest)).toBeVisible();
});

test('a failed save after a delivery from the offer leads to Neighbour quests with Retry save',async({page})=>{
  const quest=firstQuests[0],fixture=almost(ready(quest),quest);await start(page,fixture.state);await merge(page,fixture);await expect(offered(page,quest)).toBeVisible();
  await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===key)throw new Error('No space');original.call(this,name,value);};},SAVE_KEY);
  await deliver(page,quest).click();await expect(page.locator('.completion-message')).toContainText('This session is not saved.');await finishScene(page);
  await expect(page.getByRole('dialog',{name:'Neighbour quests',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Retry save',exact:true})).toBeVisible();
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`the request offer fits ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  // The other open requests are delivered, so only this two-row request becomes ready.
  const quest=firstQuests[3],initial=ready(quest);initial.completedQuests=resolveQuests(initial,data).filter(view=>view.status==='active'&&view.quest!==quest).map(view=>view.quest.id);
  const fixture=almost(initial,quest);await start(page,fixture.state);await merge(page,fixture);
  const offer=page.locator('.quest-offer');await expect(offered(page,quest)).toBeVisible();await expect(offer.locator('.quest-item')).toHaveCount(quest.requirements.length);
  for(const control of await page.locator('#modal button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  const contrasts=await offer.evaluate(element=>{
    const luminance=(value: string)=>value.match(/\d+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const background=luminance(getComputedStyle(element.closest('dialog')!).backgroundColor);
    return [...element.querySelectorAll('p,h3,li,.quest-count')].map(node=>{const ink=luminance(getComputedStyle(node).color);return(Math.max(ink,background)+.05)/(Math.min(ink,background)+.05);});
  });expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5);
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight)).toBe(true);
  await expect(offer.getByRole('button',{name:/^Deliver /})).toBeInViewport();
  await page.screenshot({path:testInfo.outputPath('request-offer.png')});
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:390,height:800}])for(const theme of ['light','dark'] as const)test(`neighbour quests fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,checkpoint(18));await quests(page);
  const book=page.locator('.quest-book');await expect(book.locator('.quest-card')).not.toHaveCount(0);
  for(const control of await book.locator('button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  const contrasts=await book.evaluate(element=>{
    const luminance=(value: string)=>value.match(/\d+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const background=luminance(getComputedStyle(element.closest('dialog')!).backgroundColor);
    return [...element.querySelectorAll('p,h3,li')].map(node=>{const ink=luminance(getComputedStyle(node).color);return(Math.max(ink,background)+.05)/(Math.min(ink,background)+.05);});
  });expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({path:testInfo.outputPath('neighbour-quests.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});

test('the quest card glows for a new request until Neighbour quests opens, glows again when a request is ready, and a new game forgets what was seen',async({page})=>{
  const quest=firstQuests[0],fixture=almost(ready(quest),quest),open=resolveQuests(fixture.state,data).filter(view=>view.status==='active').length;
  const requests=`${open} ${open===1?'request':'requests'}`;
  await start(page,fixture.state);const link=page.locator('#story [data-quests]');
  await expect(link).toHaveAttribute('data-calling','');await expect(link).toHaveAccessibleName(`Neighbour quests, ${requests}, new request`);
  await expect(link.locator('.quest-faces .portrait')).toHaveCount(Math.min(3,new Set(resolveQuests(fixture.state,data).filter(view=>view.status==='active').map(view=>view.quest.character)).size));
  await quests(page);await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();
  await expect(link).not.toHaveAttribute('data-calling');await expect(link).toHaveAccessibleName(`Neighbour quests, ${requests}`);await expect(link).toBeFocused();
  // The seen requests are a viewing preference, so a reload keeps them seen.
  await page.reload();await expect(page.locator('#board button')).toHaveCount(42);await expect(link).not.toHaveAttribute('data-calling');
  await merge(page,fixture);await expect(offered(page,quest)).toBeVisible();await page.keyboard.press('Escape');
  await expect(link).toHaveAttribute('data-calling','');await expect(link).toHaveAccessibleName(`Neighbour quests, ${requests}, 1 ready to deliver`);
  // Opening the quests does not quiet a request that is ready to deliver.
  await quests(page);await page.keyboard.press('Escape');await expect(link).toHaveAttribute('data-calling','');
  await house(page);await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await expect(link).toHaveAttribute('data-calling','');await expect(link).toHaveAccessibleName(/, new request$/);
});

test('on a phone, the Story item carries the face of the waiting neighbour with a breathing glow that reduced motion holds still',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page,createGame(data));
  const story=page.locator('#story-button'),face=story.locator('.story-face'),name=data.characters.find(person=>person.id===firstQuests[0].character)!.name;
  await expect(face).toBeVisible();await expect(story).toHaveAccessibleName(`Story, ${name} is waiting`);
  const glow=()=>face.evaluate(value=>{const style=getComputedStyle(value,'::after');return {animation:style.animationName,opacity:style.opacity};});
  expect((await glow()).animation).toBe('candle-breath');
  await page.emulateMedia({reducedMotion:'reduce'});expect(await glow()).toEqual({animation:'none',opacity:'0.85'});
  const box=(await face.boundingBox())!,icon=(await story.locator('svg').boundingBox())!;expect(box.x+box.width).toBeLessThanOrEqual(icon.x+2);
  await story.click();const card=page.getByRole('dialog').locator('[data-quests]');await expect(card).toHaveAttribute('data-calling','');
  await card.click();await expect(page.getByRole('dialog',{name:'Neighbour quests',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();await expect(face).toHaveCount(0);await expect(story).toHaveAccessibleName('Story');
});

test('a save with the borrowed bread tasting opens without it, and the next write saves the clean game',async({page})=>{
  const state=checkpoint(18),legacy: GameState&Record<string,unknown>=structuredClone(state);
  const source=firstFreeBoardCell(legacy,data);legacy.board[source]={code:'quest_bread_source'};
  legacy.discovered=[...legacy.discovered,'quest_bread_source','quest_bread_1'];legacy.activeQuestProducers={'ilie-bread-tasting':0};
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,JSON.stringify({format:'scary-snacks',version:8,state:legacy})]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);await closeOffers(page,state);
  await expect(page.locator('#status')).toContainText('Welcome back');await expect(page.locator(`[data-cell="${source}"]`)).toHaveAttribute('aria-label',/: empty$/);
  await page.locator(`[data-cell="${state.board.findIndex(cell=>cell?.code==='generator_bakery')}"]`).click();
  const written=await saved(page);expect(Object.hasOwn(written,'activeQuestProducers')).toBe(false);expect(written.discovered).not.toContain('quest_bread_source');
  expect(written.coins).toBe(state.coins);expect(written.completedQuests).toEqual(state.completedQuests);
});
