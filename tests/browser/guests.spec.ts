import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, firstFreeBoardCell, generatorOutputs, reduceGame, validateGame, canDeliverQuest, resolveQuests } from '../../src/engine.ts';
import type { Action, GameData, GameState, Quest, SceneLine } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
const validate=(candidate: unknown)=>validateGame(candidate,data);
const dinner=data.quests.find(quest=>quest.id==='ionatan-castle-dinner')!;
const search=data.quests.find(quest=>quest.id==='mina-avram-search')!;
const companions=['mina','avram'];
const nobles=['vlad','elisabeta'];
const card=(page: Page)=>page.locator(`.quest-card[data-quest="${search.id}"]`);
const deliver=(page: Page)=>page.getByRole('button',{name:`Deliver ${search.title} for ${search.reward} coins`,exact:true});
const supplies=(quest: Quest)=>quest.requirements.flatMap(({item,quantity})=>Array<string>(quantity).fill(item));
function act(state: GameState,action: Action){const result=reduceGame(state,action,data);expect(result.ok,result.message).toBe(true);return result.state;}
/** Fixtures add known supplies; rule tests cover production and random order eligibility. */
function supply(state: GameState,codes: string[]){
  const next=structuredClone(state);
  for(const code of codes){const index=firstFreeBoardCell(next,data);expect(index).toBeGreaterThanOrEqual(0);next.board[index]={code};if(!next.discovered.includes(code))next.discovered.push(code);}
  expect(validate(next)).toBe(true);return next;
}
function departed(){
  let state=createGame(data);state.coins=100000;state.served=Math.max(120,data.tasks[15].goals.served);state.merges=data.tasks[15].goals.merges;
  for(let index=0;index<16;index++)state=act(state,{type:'task'});
  state.coins=0;state.xp=0;state.pendingScenes=[];
  return act(supply(state,supplies(dinner)),{type:'deliverQuest',id:dinner.id});
}
function ready(){
  let state=departed();for(let count=0;count<3;count++)state=act(supply(state,state.orders[0].requirements),{type:'serve',id:state.orders[0].id});
  while(state.orders.some(order=>nobles.includes(order.customer))){const order=state.orders.find(order=>nobles.includes(order.customer))!;state=act(supply(state,order.requirements),{type:'serve',id:order.id});}
  state.xp=0;return supply(state,supplies(search));
}
async function saved(page: Page): Promise<GameState>{return page.evaluate(key=>navigator.locks.request(key,()=>JSON.parse(localStorage.getItem(key)!).state),SAVE_KEY);}
async function closeOffers(page: Page,state: GameState){
  for(const quest of data.quests.filter(quest=>canDeliverQuest(state,quest,data))){await expect(page.locator('.quest-offer h3')).toHaveText(quest.title);await page.keyboard.press('Escape');}
  await expect(page.locator('#modal')).toBeHidden();
}
async function start(page: Page,state: GameState){
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,exportSave(state,validate)]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);await closeOffers(page,state);
}
async function quests(page: Page){if(!await page.locator('[data-quests]:visible').count())await page.locator('#story-button').click();await page.locator('[data-quests]:visible').click();await expect(page.getByRole('dialog',{name:'Neighbour quests',exact:true})).toBeVisible();}
async function journal(page: Page){if(!await page.getByRole('button',{name:'Open the story journal',exact:true}).isVisible())await page.locator('#story-button').click();await page.getByRole('button',{name:'Open the story journal',exact:true}).click();}
async function scene(page: Page,lines: SceneLine[]){
  for(const [index,line] of lines.entries()){
    await expect(page.locator('#story-line h3')).toHaveText(data.characters.find(person=>person.id===line.speaker)!.name);
    await expect(page.locator('#story-line p')).toHaveText(line.text);
    if(index<lines.length-1)await page.getByRole('button',{name:'Continue',exact:true}).click();
  }
  await page.locator('.story-controls .primary-button').click();
}
async function guests(page: Page,present: boolean){
  await journal(page);
  for(const id of companions){const person=data.characters.find(person=>person.id===id)!;await expect(page.getByRole('button',{name:`Meet ${person.name}`,exact:true})).toHaveCount(present?1:0);}
  await expect(page.getByRole('button',{name:'Meet Ionatan',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:`Replay ${search.title}`,exact:true})).toHaveCount(0);await page.keyboard.press('Escape');
}
async function serve(page: Page,index: number){
  const state=await saved(page),order=state.orders[index],person=data.characters.find(person=>person.id===order.customer)!;
  await page.getByRole('button',{name:`Serve ${person.name} for ${order.reward} coins`,exact:true}).click();
  await expect.poll(async()=>(await saved(page)).served).toBe(state.served+1);
  while(await page.locator('#modal').isVisible())await page.keyboard.press('Escape');
}
async function portrait(target: Locator,sprite: number){
  const style=await target.evaluate(element=>{const style=getComputedStyle(element);return {image:style.backgroundImage,position:style.backgroundPosition,size:style.backgroundSize,filter:style.filter};});
  expect(style.image).toContain('/assets/variants/guests-640x640.webp');expect(style.position).toBe(['0px 0px','100% 0px','0px 100%','100% 100%'][sprite]);
  expect(style.size).toBe('200% 200%');expect(style.filter).toBe('none');
  expect(await target.evaluate(async element=>{const image=new Image();image.src=getComputedStyle(element).backgroundImage.slice(5,-2);await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([640,640]);
}

test('the third ordinary service after Ionatan opens the shared visit and excludes nobles from replacement orders',async({page})=>{
  const initial=departed();initial.served+=2;const state=supply(initial,[...supplies(search),...initial.orders[0].requirements]);
  await start(page,state);await guests(page,false);await quests(page);await expect(card(page)).toHaveCount(0);await page.keyboard.press('Escape');
  await serve(page,0);await guests(page,true);const arrived=await saved(page);expect(arrived.served-arrived.questCompletedAt![dinner.id]).toBe(3);
  expect(arrived.orders.every(order=>!nobles.includes(order.customer))).toBe(true);await quests(page);await expect(deliver(page)).toBeEnabled();
});

test('Mina and Avram arrive together after three ordinary services following Ionatan and wait for both noble tickets',async({page})=>{
  let initial=departed();
  for(const [index,id] of nobles.entries()){initial.orders[index]={...initial.orders[index],customer:id,requirements:['drinks_5'],reward:data.items.drinks_5.price};}
  // Serve the third ticket three times while the nobles remain at the counter.
  let planned=structuredClone(initial);const codes: string[]=[];
  for(let count=0;count<3;count++){const order=planned.orders[2];codes.push(...order.requirements);planned=act(supply(planned,order.requirements),{type:'serve',id:order.id});}
  initial=supply(initial,[...codes,'drinks_5','drinks_5',...supplies(search)]);await start(page,initial);await guests(page,false);
  for(let count=0;count<3;count++){
    const before=await saved(page),order=before.orders[2],person=data.characters.find(person=>person.id===order.customer)!;
    await page.getByRole('button',{name:`Serve ${person.name} for ${order.reward} coins`,exact:true}).click();
    await expect.poll(async()=>(await saved(page)).served).toBe(before.served+1);
    while(await page.locator('#modal').isVisible())await page.keyboard.press('Escape');
    await guests(page,false);
  }
  for(const id of nobles){
    const state=await saved(page),order=state.orders.find(order=>order.customer===id)!,person=data.characters.find(person=>person.id===id)!;
    await page.getByRole('button',{name:`Serve ${person.name} for ${order.reward} coins`,exact:true}).click();
    await expect.poll(async()=>(await saved(page)).served).toBe(state.served+1);
    while(await page.locator('#modal').isVisible())await page.keyboard.press('Escape');
    await guests(page,id===nobles[1]);
  }
  const state=await saved(page);expect(state.orders.every(order=>!nobles.includes(order.customer))).toBe(true);
  expect(resolveQuests(state,data).find(view=>view.quest.id===search.id)!.status).toBe('active');await quests(page);await expect(deliver(page)).toBeEnabled();
});

test('the shared vegetarian meal has both voices, leaves once, preserves departure through reload and import, and leads to local gossip',async({page})=>{
  const initial=ready();await start(page,supply(initial,initial.orders.flatMap(order=>order.requirements)));await guests(page,true);await quests(page);
  await expect(card(page)).toContainText('Mina');await expect(card(page)).toContainText('Avram');
  for(const id of companions){const person=data.characters.find(person=>person.id===id)!;await portrait(card(page).getByRole('img',{name:person.name,exact:true}),person.sprite);}
  for(const {item,quantity} of search.requirements)await expect(card(page).getByRole('button',{name:`${data.items[item].name}: ${quantity} of ${quantity} on the board`,exact:true})).toBeVisible();
  await card(page).getByRole('button',{name:`Read request: ${search.title}`,exact:true}).click();await scene(page,search.opening);
  const before=await saved(page);await deliver(page).click();await scene(page,search.completion);const after=await saved(page);
  expect(after.completedQuests).toEqual([...before.completedQuests,search.id]);expect(after.questCompletedAt![search.id]).toBe(before.served);
  expect(after.coins).toBe(before.coins+search.reward);expect(after.orders).toEqual(before.orders);expect(after.seed).toBe(before.seed);expect(after.served).toBe(before.served);expect(after.xp).toBe(before.xp);
  await expect(deliver(page)).toHaveCount(0);await page.keyboard.press('Escape');await guests(page,false);
  await page.reload();await closeOffers(page,after);expect(await saved(page)).toEqual(after);await guests(page,false);
  await page.locator('[data-house-book]:visible').first().click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();
  const text=readFileSync((await (await downloadPromise).path())!,'utf8');expect(JSON.parse(text).state).toEqual(after);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await page.locator('[data-house-book]:visible').first().click();await page.locator('input[type="file"]').setInputFiles({name:'shared-visit.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game'}).click();expect(await saved(page)).toEqual(after);await guests(page,false);
  for(let count=0;count<3;count++){await serve(page,count);expect((await saved(page)).pendingScenes.includes(search.followUp!.id)).toBe(count===2);await guests(page,false);}
  await journal(page);await page.getByRole('button',{name:`Read ${search.followUp!.title}`,exact:true}).click();
  expect(search.followUp!.dialogue.every(line=>!companions.includes(line.speaker)&&line.speaker!=='ionatan')).toBe(true);
  expect(search.followUp!.dialogue.map(line=>line.text).join(' ')).toMatch(/Ionatan gravely ill.*All three have left for Britain.*did not stop at our bistro/);
  await scene(page,search.followUp!.dialogue);await expect(page.getByRole('button',{name:`Replay ${search.followUp!.title}`,exact:true})).toBeVisible();
  expect((await saved(page)).pendingScenes).not.toContain(search.followUp!.id);await page.keyboard.press('Escape');await guests(page,false);
});

test('a failed shared delivery save removes both guests in the session and reload restores the durable shared visit',async({page})=>{
  await start(page,ready());const before=await saved(page);await quests(page);
  await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===key)throw new Error('No space');original.call(this,name,value);};},SAVE_KEY);
  await deliver(page).click();await expect(page.locator('.completion-message')).toContainText('This session is not saved.');await scene(page,search.completion);
  await expect(page.getByRole('button',{name:'Retry save',exact:true})).toBeVisible();await expect(deliver(page)).toHaveCount(0);await page.keyboard.press('Escape');await guests(page,false);
  expect(await saved(page)).toEqual(before);await page.reload();await closeOffers(page,before);await guests(page,true);await quests(page);await expect(deliver(page)).toBeEnabled();
});

for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`all four new guest portraits and shared meal fit ${viewport.width}x${viewport.height} in ${theme}`,async({page})=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await start(page,ready());await journal(page);
  for(const person of data.characters.filter(person=>person.portraitAtlas==='guest')){
    const entry=page.getByRole('button',{name:`Meet ${person.name}`,exact:true});await entry.scrollIntoViewIfNeeded();await portrait(entry.locator('.portrait'),person.sprite);await expect(entry).toContainText(person.role);
    expect(await entry.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);await entry.click();await portrait(page.locator('.story-stage .portrait'),person.sprite);
    await expect(page.locator('#story-line')).toContainText(person.introduction);await expect(page.getByRole('button',{name:'Return',exact:true})).toBeInViewport();
    expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight)).toBe(true);
    await page.screenshot({path:`test-results/guests/${person.id}-${viewport.width}-${theme}.png`});await scene(page,[{speaker:person.id,text:person.introduction}]);
  }
  await page.keyboard.press('Escape');await quests(page);await card(page).scrollIntoViewIfNeeded();await portrait(card(page).locator('.portrait').first(),data.characters.find(person=>person.id==='mina')!.sprite);
  await portrait(card(page).getByRole('img',{name:'Avram',exact:true}),data.characters.find(person=>person.id==='avram')!.sprite);
  await expect(card(page)).toContainText('Avram');expect(await card(page).evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await page.screenshot({path:`test-results/guests/shared-meal-${viewport.width}-${theme}.png`});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const id of nobles)test(`${id} has meat and red wine ordinary orders with the wine picture`,async({page})=>{
  const state=departed(),person=data.characters.find(person=>person.id===id)!;state.orders[0]={...state.orders[0],customer:id,requirements:['warm_5','drinks_5'],reward:data.items.warm_5.price+data.items.drinks_5.price};
  await start(page,supply(state,state.orders[0].requirements));await expect(page.locator('#orders')).toContainText(person.name);
  const order=page.locator('#orders .order').filter({hasText:person.name});await portrait(order.locator('.portrait'),person.sprite);
  const wine=order.getByRole('button',{name:'Red wine, ready on the board',exact:true});expect(await wine.locator('.food image').getAttribute('href')).toContain('assets/variants/red-wine-256x256.webp');
  await wine.click();await expect(page.getByRole('dialog',{name:'Red wine',exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toContainText('Merge two Cherry compote to make Red wine.');
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
  const image=target.locator('.food image').first();await expect(image).toHaveAttribute('href',/assets\/variants\/red-wine-256x256\.webp$/);
  expect(await image.evaluate(async element=>{const image=new Image();image.src=element.getAttribute('href')!;await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([256,256]);
}

for(const fixture of ['undiscovered-drink-save','stored-drink-save'])test(`a ${fixture} keeps its quoted order and can serve red wine through visible controls`,async({page})=>{
  test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});
  const text=readFileSync(`tests/fixtures/${fixture}.json`,'utf8'),initial: GameState=JSON.parse(text).state,order=initial.orders[0];
  expect(order.requirements).toEqual(['bakery_5','drinks_5']);expect(order.reward).toBe(63);
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,text]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);await closeOffers(page,initial);
  expect(await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY)).toBe(text);expect((await saved(page)).orders[0]).toEqual(order);
  const ticket=page.locator('#orders .order').first(),stored=fixture==='stored-drink-save';
  const wine=ticket.getByRole('button',{name:`Red wine, ${stored?'ready on the board':'not on the board yet'}`,exact:true});await expect(wine).toBeVisible();await winePicture(wine);
  await expect(page.locator('body')).not.toContainText('Blueberry liqueur');await wine.click();
  const help=page.getByRole('dialog',{name:'Red wine',exact:true});await expect(help).toBeVisible();await winePicture(help);
  await expect(help).toContainText('Merge two Cherry compote to make Red wine.');await page.keyboard.press('Escape');
  const oldWine=initial.board.findIndex(cell=>cell?.code==='drinks_5');
  if(stored){expect(initial.discovered).toContain('drinks_5');await expect(page.locator(`[data-cell="${oldWine}"]`)).toHaveAttribute('aria-label',/Red wine$/);await winePicture(page.locator(`[data-cell="${oldWine}"]`));}
  else{expect(initial.discovered).not.toContain('drinks_5');expect(oldWine).toBe(-1);}
  await makeDish(page,'bakery_5');const wineAt=stored?oldWine:await makeDish(page,'drinks_5');
  await expect(page.locator(`[data-cell="${wineAt}"]`)).toHaveAttribute('aria-label',/Red wine$/);await winePicture(page.locator(`[data-cell="${wineAt}"]`));
  await expect(ticket.getByRole('button',{name:'Red wine, ready on the board',exact:true})).toBeVisible();
  const ready=await saved(page);expect(ready.discovered).toContain('drinks_5');expect(ready.orders[0]).toEqual(order);
  await ticket.getByRole('button',{name:'Serve Eszter for 63 coins',exact:true}).click();
  await expect.poll(async()=>(await saved(page)).served).toBe(initial.served+1);await dismissDialogs(page);
  const served=await saved(page);expect(served.coins).toBe(initial.coins+63);expect(served.orders.some(candidate=>candidate.id===order.id)).toBe(false);
  await page.reload();await closeOffers(page,served);expect(await saved(page)).toEqual(served);
});
