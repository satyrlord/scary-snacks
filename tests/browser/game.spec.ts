import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGame, firstFreeBoardCell, menuReward, reduceGame, saleValue, taskEligibility, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY as KEY, exportSave } from '../../src/storage.ts';
import { readFileSync } from 'node:fs';

// Read after queued game writes finish. Lock tests can inspect the snapshot while a write is blocked.
async function saved(page: Page,waitForWrites=true): Promise<GameState>{return page.evaluate(async({key,waitForWrites})=>{
  const read=()=>JSON.parse(localStorage.getItem(key)!).state;
  return waitForWrites?navigator.locks.request(key,read):read();
},{key:KEY,waitForWrites});}
async function start(page: Page){await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);}
async function tile(page: Page,index: number){await page.locator(`[data-cell="${index}"]`).click();}
async function unselect(page: Page){await page.locator('[data-cell="0"]').focus();await page.keyboard.press('Escape');}
async function mergeStart(page: Page){await tile(page,13);await tile(page,14);expect((await saved(page)).board[14]?.code).toBe('bakery_2');}
async function prepare(page: Page,code: string){
  const [chain,stage]=code.split('_');
  for(let turn=0;turn<12;turn++){
    const state=await saved(page);if(state.board.some(cell=>cell?.code===code))break;
    await unselect(page);
    const lower=`${chain}_1`;const matches=state.board.map((cell,index)=>({cell,index})).filter(({cell})=>cell?.code===lower);
    if(Number(stage)===2&&matches.length>=2){await tile(page,matches[0].index);await tile(page,matches[1].index);}
    else{const generator=state.board.findIndex(cell=>cell?.code===`generator_${chain}`);await tile(page,generator);await tile(page,generator);}
  }
}
async function appearance(page: Page,mode: string){await page.getByRole('button',{name:/House book/}).first().click();await page.getByRole('radio',{name:mode[0].toUpperCase()+mode.slice(1),exact:true}).check();await page.getByRole('button',{name:'Close dialog'}).click();}
const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
const sellLabel=(code: string)=>`Sell for ${saleValue(code,data)} ${saleValue(code,data)===1?'coin':'coins'}`;
const stateText=(id: string)=>data.rooms.find(state=>state.id===id)!.text;
/** A synthetic checkpoint with coins and counters supplied for interface checks. */
function saveAfter(count: number,coins=0,choices?: Record<string,string>){
  let state=createGame(data);state.coins=100000;
  Object.assign(state,data.tasks[Math.min(count,data.tasks.length-1)].goals);
  for(const _ of data.tasks.slice(0,count)){const result=reduceGame(state,{type:'task'},data);expect(result.ok,result.message).toBe(true);state=result.state;}
  state.coins=coins;if(choices)state.decorationChoices=choices;return exportSave(state,candidate=>validateGame(candidate,data));
}
/** Earn a checkpoint through legal actions, ready for the last service before the first repair. */
function beforeFirstRepair(){
  let state=createGame(data);
  const act=(action: Parameters<typeof reduceGame>[1])=>{const result=reduceGame(state,action,data);expect(result.ok,result.message).toBe(true);state=result.state;};
  const produce=(code: string): number=>{
    const item=data.items[code];
    if(item.stage===1){const empty=firstFreeBoardCell(state,data);expect(empty).toBeGreaterThanOrEqual(0);act({type:'spawn',index:state.board.findIndex(cell=>cell?.code===`generator_${item.chain}`)});return empty;}
    const lower=Object.values(data.items).find(candidate=>candidate.next===code)!;const first=produce(lower.id),second=produce(lower.id);act({type:'move',from:first,to:second});return second;
  };
  for(let attempt=0;attempt<1000;attempt++){
    const order=state.orders[0];for(const code of order.requirements)produce(code);
    const result=reduceGame(state,{type:'serve',id:order.id},data);expect(result.ok,result.message).toBe(true);
    if(taskEligibility(result.state,data).ready)return exportSave(state,candidate=>validateGame(candidate,data));
    state=result.state;
  }
  throw new Error('Legal service did not reach the first repair.');
}
// Only the first load gets the save, so a reload shows what the game itself saved.
async function startWith(page: Page,save: string){await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[KEY,save]);await start(page);}
async function payAndRead(page: Page){
  if(await page.getByRole('button',{name:'Story',exact:true}).isVisible())await page.getByRole('button',{name:'Story',exact:true}).click();
  await page.getByRole('button',{name:/^Pay /}).first().click();
  for(const label of ['Continue','Continue','See what changed'])await page.locator('.story-controls .primary-button',{hasText:label}).click();
}
const revealed=(page: Page)=>expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done',{timeout:8000});
const painting=(page: Page)=>page.locator('#room-paintings img').last().evaluate(e=>{const image=e as HTMLImageElement;return image.complete&&image.naturalWidth>0?image.currentSrc.split('/').at(-1)!:'';});
function ratio(a: string,b: string){const luminance=(value: string)=>value.match(/\d+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}

test('bistro produces, merges, serves, and survives reload',async({page})=>{
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message));await start(page);await mergeStart(page);
  const initial=await saved(page);const order=initial.orders[0];await prepare(page,order.requirements[0]);
  const serve=page.locator('#orders .order').first().getByRole('button',{name:/^Serve /});await expect(serve).toBeEnabled();await serve.click();
  const after=await saved(page);expect(after.served).toBe(1);expect(after.coins).toBe(order.reward);
  await page.reload();await expect(page.locator('#board button')).toHaveCount(42);expect(await saved(page)).toEqual(after);expect(errors).toEqual([]);
});

test('pointer drag, keyboard merge, and displayed sale value agree',async({page})=>{
  await start(page);const from=(await page.locator('[data-cell="13"]').boundingBox())!;const to=(await page.locator('[data-cell="14"]').boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();
  expect((await saved(page)).board[14]?.code).toBe('bakery_2');await expect(page.getByRole('button',{name:sellLabel('bakery_2'),exact:true})).toBeVisible();await page.getByRole('button',{name:sellLabel('bakery_2'),exact:true}).click();expect((await saved(page)).coins).toBe(saleValue('bakery_2',data));
  await expect(page.locator('#coins')).toHaveText(String(saleValue('bakery_2',data)));await expect(page.locator('#coin-label')).toHaveText(saleValue('bakery_2',data)===1?'coin':'coins');
  await unselect(page);await tile(page,1);await tile(page,1);await tile(page,1);
  const state=await saved(page);const pair=state.board.map((cell,index)=>({cell,index})).filter(({cell})=>cell?.code==='bakery_1').slice(0,2);
  await unselect(page);await page.locator(`[data-cell="${pair[0].index}"]`).focus();await page.keyboard.press('Space');await page.locator(`[data-cell="${pair[1].index}"]`).focus();await page.keyboard.press('Space');expect((await saved(page)).board[pair[1].index]?.code).toBe('bakery_2');
});

test('clicking a different item selects it for single-item actions; only a drag swaps',async({page})=>{
  await start(page);const before=await saved(page);await tile(page,13);await tile(page,22);
  expect(await saved(page)).toEqual(before);await expect(page.locator('[data-cell="22"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-cell="13"]')).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Sell for 1 coin',exact:true}).click();let state=await saved(page);expect(state.board[22]).toBeNull();expect(state.board[13]?.code).toBe('bakery_1');
  await tile(page,1);await tile(page,4);expect((await saved(page)).board[1]?.code).toBe('generator_bakery');await expect(page.locator('[data-cell="4"]')).toHaveAttribute('aria-pressed','true');
  await tile(page,13);await tile(page,22);state=await saved(page);expect(state.board[22]?.code).toBe('bakery_1');expect(state.board[13]).toBeNull();
  const from=(await page.locator('[data-cell="22"]').boundingBox())!;const to=(await page.locator('[data-cell="27"]').boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();
  state=await saved(page);expect(state.board[27]?.code).toBe('bakery_1');expect(state.board[22]?.code).toBe('drinks_1');
});

test('an order item says how to get it, and Show me points at the next step on the board',async({page})=>{
  await start(page);const item=page.locator('#orders .order').first().locator('.order-item').first();
  await expect(item).toHaveAttribute('aria-label',/, (ready on the board|not on the board yet)$/);await item.click();
  const dialog=page.getByRole('dialog');await expect(dialog.locator('.item-how')).toHaveText(/^(Tap the .+ to take .+|Merge two .+ to make .+)\.$/);
  await expect(dialog.locator('.chain [aria-current="step"]')).toHaveCount(1);await expect(dialog.locator('.chain li')).toHaveCount(6);
  await dialog.getByRole('button',{name:'Show me on the board'}).click();await expect(dialog).toBeHidden();
  await expect(page.locator('#board [aria-pressed="true"]')).toHaveCount(1);await expect(page.locator('#status')).toHaveText(/ready on the board|Tap the other .+ to merge them|Use Take .+ on the .+/);
  // The story card spends coins with Pay; Continue belongs to the dialogue.
  await expect(page.locator('#story').getByRole('button',{name:`Pay ${data.tasks[0].cost} coins: ${data.tasks[0].title}`})).toBeDisabled();await expect(page.locator('#story')).not.toContainText('Continue');
});

test('a new game opens on the unfinished front room, with Miez on the windowsill and no New pin',async({page})=>{
  await start(page);const frame=page.locator('#room-frame');
  await expect(frame).toHaveAttribute('data-painting','front-room-00');await expect.poll(()=>painting(page)).toMatch(/^front-room-00-(768x1024|1536x2048)\.avif$/);
  await expect(page.locator('#room-pin')).toBeHidden();await expect(page.locator('#cat-button')).toBeVisible();await expect(page.locator('.counter-cat')).toBeHidden();
  await expect(page.getByRole('button',{name:'Front room',exact:true})).toHaveAttribute('aria-pressed','true');
  // The caption tells the room in words for screen readers, and is not drawn over the painting.
  await expect(page.locator('#room-caption li')).toHaveText([stateText('front-room-00')]);expect(await page.locator('#room-caption').evaluate(e=>e.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
});

test('after the last preparation the room is ready for the supper, with the sleeping cat on the counter',async({page})=>{
  await startWith(page,saveAfter(data.tasks.length));
  await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-24');await expect.poll(()=>painting(page)).toMatch(/^front-room-24-/);
  await expect(page.locator('#story')).toContainText('The table is ready.');await expect(page.locator('.counter-cat')).toBeVisible();await expect(page.locator('#cat-button')).toBeVisible();
  await expect(page.locator('#room-pin')).toHaveAccessibleName(`New: ${stateText('front-room-24')}`);
  await expect(page.locator('#room-caption li').first()).toHaveText(stateText('front-room-00'));await expect(page.locator('#room-caption li').last()).toHaveText(stateText('front-room-24'));
});

test('a preparation paid with earned coins is revealed in the room once its story ends, and survives reload',async({page})=>{
  await startWith(page,beforeFirstRepair());
  expect(taskEligibility(await saved(page),data).ready).toBe(false);
  await page.locator('#orders .order').first().getByRole('button',{name:/^Serve /}).click();await expect(page.locator('#orders .order.arriving')).toHaveCount(0,{timeout:4000});
  expect(taskEligibility(await saved(page),data).ready).toBe(true);
  const before=await saved(page);
  await page.locator('#story').getByRole('button',{name:/^Pay /}).click();
  // The game was saved before the story opens, while the room still shows the room before the change.
  const after=await saved(page);expect(after.decorations).toEqual(['task_1']);expect(after.coins).toBe(before.coins-data.tasks[0].cost);
  await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-00');
  for(const label of ['Continue','Continue','See what changed'])await page.locator('.story-controls .primary-button',{hasText:label}).click();
  await revealed(page);await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-01');
  const pin=page.locator('#room-pin');await expect(pin).toBeFocused();await expect(pin).toHaveAccessibleName(`New: ${stateText('front-room-01')}`);
  await expect(page.locator('#status')).toHaveText(stateText('front-room-01'));
  // The reveal neither pays nor earns again.
  expect(await saved(page)).toEqual(after);await expect(page.locator('#coins')).toHaveText(String(after.coins));
  await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-01');await expect.poll(()=>painting(page)).toMatch(/^front-room-01-/);
  await expect(page.locator('#room-caption li')).toHaveText([stateText('front-room-00'),stateText('front-room-01')]);
  expect(await saved(page)).toEqual(after);
});

test('the reveal lowers the drawer by itself on a phone, then raises it, and a bat crosses the mended window on a wide screen',async({page})=>{
  await page.setViewportSize({width:390,height:844});await startWith(page,saveAfter(3,data.tasks[3].cost));
  const drawer=page.locator('#drawer'),top=(await drawer.boundingBox())!.y;await payAndRead(page);
  await expect(page.locator('.game-layout')).toHaveClass(/revealing/);
  await expect.poll(async()=>(await drawer.boundingBox())!.y).toBeGreaterThan(top+150);
  // Lowered, the drawer shows the whole painting above it.
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#room-frame')!.getBoundingClientRect().bottom-document.querySelector('#drawer')!.getBoundingClientRect().top)).toBeLessThanOrEqual(1);
  await revealed(page);await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-04');
  await expect.poll(async()=>(await drawer.boundingBox())!.y).toBeCloseTo(top,0);await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await page.setViewportSize({width:1440,height:900});await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  const save=JSON.parse(await page.evaluate(key=>localStorage.getItem(key)!,KEY));save.state.coins=data.tasks[4].cost;Object.assign(save.state,data.tasks[4].goals);await page.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,JSON.stringify(save)]);
  await page.reload();await expect(page.locator('#board button')).toHaveCount(42);await payAndRead(page);
  await revealed(page);await expect(page.locator('.window-sky .bat')).toHaveCount(1);await expect(page.locator('.game-layout')).not.toHaveClass(/revealing/);
});

test('the handle lowers the drawer to show the room and raises it again',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page);const handle=page.locator('#drawer-handle');
  expect((await handle.boundingBox())!.height).toBeGreaterThanOrEqual(44);await expect(handle).toHaveAttribute('aria-expanded','true');
  await handle.click();await expect(handle).toHaveAttribute('aria-expanded','false');await expect(page.locator('#drawer-body')).toHaveAttribute('inert','');
  await handle.click();await expect(handle).toHaveAttribute('aria-expanded','true');await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await mergeStart(page);
});

for(const height of [390,600])test(`a lowered drawer restores board input on a short screen at ${height}px`,async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page);
  const handle=page.locator('#drawer-handle'),body=page.locator('#drawer-body');
  await handle.click();await expect(body).toHaveAttribute('inert','');
  await page.setViewportSize({width:844,height});
  await expect(handle).toBeHidden();await expect(body).not.toHaveAttribute('inert');
  await tile(page,13);await page.locator('[data-cell="14"]').focus();await page.keyboard.press('Space');
  expect((await saved(page)).board[14]?.code).toBe('bakery_2');
  await page.setViewportSize({width:390,height:844});
  await expect(handle).toHaveAttribute('aria-expanded','true');await expect(body).not.toHaveAttribute('inert');
  await handle.focus();await page.keyboard.press('Enter');await expect(body).toHaveAttribute('inert','');
  await page.keyboard.press('Enter');await expect(body).not.toHaveAttribute('inert');
});

test('a short-screen resize keeps the board inert until its active reveal ends',async({page})=>{
  await page.setViewportSize({width:390,height:844});await startWith(page,saveAfter(0,data.tasks[0].cost));
  await payAndRead(page);await expect(page.locator('.game-layout')).toHaveClass(/revealing/);
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#drawer-handle')).toBeHidden();await expect(page.locator('#drawer-body')).toHaveAttribute('inert','');
  await revealed(page);await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await mergeStart(page);
});

test('the courtyard is named but closed until its preparation, then the room follows it, and the choice stays out of the save',async({page})=>{
  await startWith(page,saveAfter(12,data.tasks[12].cost));
  const courtyard=page.getByRole('button',{name:'Courtyard',exact:true}),front=page.getByRole('button',{name:'Front room',exact:true});
  await expect(courtyard).toHaveAttribute('aria-disabled','true');await expect(courtyard).toHaveAccessibleDescription('The courtyard opens with “Clear the courtyard” in chapter 4.');
  await expect(front).toHaveAttribute('aria-pressed','true');await expect(page.locator('#room-caption')).not.toContainText(stateText('courtyard-13'));
  // A locked choice is not disabled for focus, so a press says what opens it.
  await courtyard.focus();await page.keyboard.press('Enter');await expect(page.locator('#status')).toHaveText('The courtyard opens with “Clear the courtyard” in chapter 4.');await expect(page.locator('#room-frame')).toHaveAttribute('data-area','front-room');
  await payAndRead(page);await revealed(page);
  await expect(courtyard).toHaveAttribute('aria-pressed','true');await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','courtyard-13');await expect(page.locator('#status')).toHaveText(stateText('courtyard-13'));
  await expect.poll(()=>painting(page)).toMatch(/^courtyard-13-/);
  // The player may look at the other room; the choice is a viewing preference in this browser, not part of the game.
  const progress=await saved(page);await front.click();await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-12');
  expect(await page.evaluate(()=>localStorage.getItem('scary-snacks-area'))).toBe('front-room');expect(await saved(page)).toEqual(progress);
  await page.reload();await expect(page.locator('#board button')).toHaveCount(42);await expect(front).toHaveAttribute('aria-pressed','true');
  await courtyard.click();await expect(courtyard).toHaveAttribute('aria-pressed','true');
  // Export, start again, and import: the opened area comes back with the progress, without paying again.
  await page.getByRole('button',{name:'Settings and saved game'}).first().click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();const path=await (await pending).path();
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await expect(courtyard).toHaveAttribute('aria-disabled','true');await expect(front).toHaveAttribute('aria-pressed','true');await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-00');
  await page.getByRole('button',{name:'Settings and saved game'}).first().click();await page.locator('input[type=file]').setInputFiles(path);await page.getByRole('button',{name:'Import this saved game'}).click();
  expect(await saved(page)).toEqual(progress);await expect(courtyard).not.toHaveAttribute('aria-disabled');await expect(courtyard).toHaveAttribute('aria-pressed','true');
});

test('with reduced motion the change shows at once, and nothing animates',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await startWith(page,saveAfter(23,data.tasks[23].cost));
  await page.getByRole('button',{name:'Front room',exact:true}).click();await expect.poll(()=>painting(page)).toMatch(/^front-room-17-/);await payAndRead(page);
  await revealed(page);await expect(page.locator('.game-layout')).not.toHaveClass(/revealing/);
  await expect(page.locator('#room-paintings .room-painting')).toHaveCount(1);await expect.poll(()=>painting(page)).toMatch(/^front-room-24-/);
  expect(await page.locator('#room-stage').evaluate(stage=>stage.getAnimations({subtree:true}).length)).toBe(0);
  // The chapter scene that the payment earned follows the reveal. Escape leaves it waiting and returns focus to the pin.
  await expect(page.getByRole('dialog',{name:'Chapter 6 complete: The first community supper'})).toBeVisible();await expect(page.locator('.story-controls .primary-button')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('.counter-cat')).toBeVisible();await expect(page.locator('#room-pin')).toBeFocused();await expect(page.locator('#status')).toHaveText(stateText('front-room-24'));
});

test('a painting that cannot load leaves the room in words, and play goes on',async({page})=>{
  await page.route('**/assets/variants/front-room-*',route=>route.fulfill({status:404,body:''}));await startWith(page,saveAfter(data.tasks.length));
  await expect(page.locator('#room-stage')).toHaveAttribute('data-failed','');
  const caption=page.locator('#room-caption');await expect(caption).toBeVisible();await expect(caption).toContainText('The painting of this room could not load, so here it is in words.');
  await expect(caption.locator('li').last()).toHaveText(stateText('front-room-24'));await expect(caption.locator('li')).toHaveCount(15);
  // Play goes on: a merge still saves.
  const before=await saved(page);
  await tile(page,13);await tile(page,14);expect((await saved(page)).merges).toBe(before.merges+1);
});

test('the framed change, the New pin and the area switch never collide, and no interface covers the change',async({page},testInfo)=>{
  test.setTimeout(90000);await start(page);
  for(const viewport of [{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    for(const count of [1,12,13,21,24]){
      await page.evaluate(([key,value])=>{localStorage.setItem(key,value);localStorage.removeItem('scary-snacks-area');},[KEY,saveAfter(count)]);
      await page.reload();await expect(page.locator('#board button')).toHaveCount(42);await expect.poll(()=>painting(page)).not.toBe('');
      // The change is the focus of the state the room shows.
      const current=data.rooms.find(state=>state.after===data.tasks[count-1].id)!;
      const geometry=await page.evaluate(({focus})=>{
        const box=(selector: string)=>{const e=document.querySelector(selector);const r=e?.getBoundingClientRect();return r&&r.width?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null;};
        const f=document.querySelector<HTMLElement>('#room-frame')!.getBoundingClientRect(),at=(point: {x: number; y: number})=>({x:f.left+f.width*point.x/100,y:f.top+f.height*point.y/100});
        const room=box('#room-stage')!,drawer=box('#drawer')!,pin=box('#room-pin');
        return {...at(focus),room,visibleBottom:Math.min(room.bottom,innerWidth<1024?drawer.top:room.bottom),pin,covers:['#area-switch','.masthead','#drawer','.phone-bar'].map(selector=>({selector,box:box(selector)})),scroll:document.documentElement.scrollWidth<=innerWidth};
      },{focus:current.focus});
      // The pin stays inside the visible room and does not cover the centre of the change.
      if(geometry.pin){
        expect(geometry.pin.left,`pin inside, ${viewport.width} at ${count}`).toBeGreaterThanOrEqual(geometry.room.left);expect(geometry.pin.right).toBeLessThanOrEqual(geometry.room.right);
        expect(geometry.pin.top).toBeGreaterThanOrEqual(geometry.room.top);expect(geometry.pin.bottom).toBeLessThanOrEqual(geometry.visibleBottom);
        expect(geometry.x>=geometry.pin.left&&geometry.x<=geometry.pin.right&&geometry.y>=geometry.pin.top&&geometry.y<=geometry.pin.bottom,`pin covers the change, ${viewport.width} at ${count}`).toBe(false);
      }
      const label=`${viewport.width} at ${count}`;expect(geometry.scroll,label).toBe(true);
      expect(geometry.x,label).toBeGreaterThan(geometry.room.left);expect(geometry.x,label).toBeLessThan(geometry.room.right);
      expect(geometry.y,label).toBeGreaterThan(geometry.room.top+20);expect(geometry.y,label).toBeLessThan(geometry.visibleBottom-20);
      const inside=(point: {x: number; y: number},b: {left: number; top: number; right: number; bottom: number})=>point.x>=b.left&&point.x<=b.right&&point.y>=b.top&&point.y<=b.bottom;
      const overlaps=(a: {left: number; top: number; right: number; bottom: number},b: {left: number; top: number; right: number; bottom: number})=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      for(const {selector,box} of geometry.covers)if(box){expect(inside(geometry,box),`${selector} covers the change, ${label}`).toBe(false);if(geometry.pin)expect(overlaps(geometry.pin,box),`${selector} meets the pin, ${label}`).toBe(false);}
      if(testInfo.project.name==='chromium-pages'&&count===12)await page.screenshot({path:testInfo.outputPath(`room-${viewport.width}-${count}.png`)});
    }
  }
});

test('a served neighbour says thank you on the ticket while the next ticket arrives',async({page})=>{
  await start(page);await mergeStart(page);const order=(await saved(page)).orders[0];await prepare(page,order.requirements[0]);await unselect(page);
  await page.locator('#orders .order').first().getByRole('button',{name:/^Serve /}).click();
  // The farewell is a decorative copy outside the orders; the live region carries the thank-you in words.
  await expect(page.locator('.tickets > .order.leaving .thanks')).toBeVisible();await expect(page.locator('#status')).toHaveText(/^\S+: “.+” Earned \d+ coins\.$/);
  await expect(page.locator('#orders .order').first()).toHaveClass(/arriving/);await expect(page.locator('#orders .order')).toHaveCount(3);
  await expect(page.locator('.order.leaving')).toHaveCount(0,{timeout:3000});await expect(page.locator('#orders .order.arriving')).toHaveCount(0);
  const customers=(await saved(page)).orders.map(value=>value.customer);expect(new Set(customers).size).toBe(3);
});

test('the recipe book keeps undiscovered dishes under cloches and marks new ones until it is opened',async({page})=>{
  await start(page);await page.getByRole('button',{name:/The recipe book/}).click();
  await expect(page.locator('.recipe-item.not-yet')).toHaveCount(25);await expect(page.locator('#modal')).not.toContainText('Pogăcele');await page.getByRole('button',{name:'Close dialog'}).click();
  await mergeStart(page);await tile(page,6);await expect(page.locator('#status')).toHaveText('Pogăcele is a new dish! It is in the recipe book now.');
  await expect(page.locator('#collection-button')).toHaveAttribute('data-fresh','');await expect(page.locator('#discovery-count')).toHaveText('6 of 30 dishes discovered, 1 new');
  await page.getByRole('button',{name:/The recipe book/}).click();await expect(page.locator('.recipe-item.not-yet')).toHaveCount(24);await expect(page.locator('#modal')).toContainText('Pogăcele');
  await page.getByRole('button',{name:'Close dialog'}).click();await expect(page.locator('#collection-button')).not.toHaveAttribute('data-fresh','');
});

test('reduced motion keeps the serve outcome and words without the flight',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page);await mergeStart(page);const order=(await saved(page)).orders[0];await prepare(page,order.requirements[0]);await unselect(page);
  await page.locator('#orders .order').first().getByRole('button',{name:/^Serve /}).click();
  await expect(page.locator('#status')).toHaveText(/“.+”/);await expect(page.locator('.serve-flight')).toHaveCount(0);
  await expect(page.locator('#orders .order').first()).toBeHidden();await expect(page.locator('#orders .order').first()).toBeVisible({timeout:3000});
});

test('serving the selected item clears the selection',async({page})=>{
  await start(page);await tile(page,13);await tile(page,14);const code=(await saved(page)).orders[0].requirements[0];await prepare(page,code);await unselect(page);
  const index=(await saved(page)).board.findIndex(cell=>cell?.code===code);await tile(page,index);await expect(page.locator(`[data-cell="${index}"]`)).toHaveAttribute('aria-pressed','true');
  await page.locator('#orders .order').first().getByRole('button',{name:/^Serve /}).click();expect((await saved(page)).board[index]).toBeNull();
  await expect(page.locator('#board [aria-pressed="true"]')).toHaveCount(0);await expect(page.locator('#board .selected')).toHaveCount(0);
});

test('keyboard focus stays with the item actions and returns to the board',async({page})=>{
  await start(page);await tile(page,1);const take=page.getByRole('button',{name:'Take Flour',exact:true});await take.focus();await page.keyboard.press('Enter');
  expect((await saved(page)).board[2]?.code).toBe('bakery_1');await expect(take).toBeFocused();
  await tile(page,13);await page.getByRole('button',{name:'Sell for 1 coin',exact:true}).focus();await page.keyboard.press('Enter');
  expect((await saved(page)).board[13]).toBeNull();await expect(page.locator('[data-cell="13"]')).toBeFocused();
});

test('one tap on an ingredient source takes one ingredient and selects the source; a drag only moves it',async({page})=>{
  await start(page);const items=async()=>(await saved(page)).board.filter(Boolean).length,before=await items();
  const source=page.locator('[data-cell="1"]');await expect(source).toHaveAttribute('aria-label',/Flour bin, source of Flour: tap to take an ingredient$/);
  await tile(page,1);expect(await items()).toBe(before+1);await expect(source).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Take Flour',exact:true})).toBeVisible();
  await tile(page,1);expect(await items()).toBe(before+2);
  // Enter on the focused source takes one too.
  await source.focus();await page.keyboard.press('Enter');expect(await items()).toBe(before+3);
  // A drag moves the source and takes nothing.
  const from=(await source.boundingBox())!,to=(await page.locator('[data-cell="39"]').boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();
  const moved=await saved(page);expect(moved.board[39]?.code).toBe('generator_bakery');expect(moved.board.filter(Boolean).length).toBe(before+3);
});

test('a source on a full board takes nothing and says why',async({page})=>{
  const state=createGame(data);state.board=state.board.map((cell,index)=>cell||data.board.layouts.find(layout=>layout.id===state.layoutId)!.obstacles.some(obstacle=>obstacle.position===index)?cell:{code:'bakery_1'});
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[KEY,exportSave(state,candidate=>validateGame(candidate,data))]);await start(page);
  const before=await saved(page);await tile(page,1);
  await expect(page.locator('[data-cell="1"]')).toHaveAttribute('aria-pressed','true');expect(await saved(page)).toEqual(before);
  await expect(page.locator('#status')).toHaveText('The board is full. Merge, store, serve, or sell an item.');
});

test('with the story card on screen, the card alone carries Pay and Mara keeps her line',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await startWith(page,saveAfter(0,data.tasks[0].cost));
  await expect(page.locator('#offer')).toBeHidden();await expect(page.locator('.guide')).toBeVisible();
  const pay=page.getByRole('button',{name:/^Pay /});await expect(pay).toHaveCount(1);await expect(page.locator('#story').getByRole('button',{name:/^Pay /})).toBeVisible();
  await payAndRead(page);await revealed(page);const after=await saved(page);expect(after.decorations).toEqual(['task_1']);expect(after.coins).toBe(0);
  // Where the story card leaves the screen, Mara takes the offer over.
  await page.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,saveAfter(1,data.tasks[1].cost)]);await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  await page.setViewportSize({width:390,height:844});await expect(page.locator('#offer').getByRole('button',{name:/^Pay /})).toBeVisible();
});

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'phone',width:390,height:844}])test(`keyboard navigation skips the replaced guide at ${viewport.name} and keeps status announcements`,async({page})=>{
  await page.setViewportSize(viewport);await startWith(page,saveAfter(0,data.tasks[0].cost));
  for(const mode of ['light','dark']){
    await appearance(page,mode);await unselect(page);await page.keyboard.press('Tab');
    await expect(viewport.name==='phone'?page.locator('#offer .pay-button'):page.locator('#hint-button')).toBeFocused();
    await tile(page,13);await page.keyboard.press('Tab');
    await expect(page.locator('#item-detail').getByRole('button',{name:'Store',exact:true})).toBeFocused();
    await expect(page.getByRole('status')).toContainText(/tap another to merge/i);
    await unselect(page);await page.keyboard.press('Tab');
    await expect(viewport.name==='phone'?page.locator('#offer .pay-button'):page.locator('#hint-button')).toBeFocused();
  }
  // Once the offer goes away, the visible hint returns to the keyboard path.
  await page.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,saveAfter(0)]);await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  await unselect(page);await page.keyboard.press('Tab');await expect(page.locator('#hint-button')).toBeFocused();
});

for(const viewport of [{name:'phone',width:390,height:844}])test(`Mara offers an affordable preparation with Pay at ${viewport.name}; it pays once and reveals once`,async({page})=>{
  await page.setViewportSize(viewport);await startWith(page,saveAfter(0,10));
  const offer=page.locator('#offer'),story=page.locator('#story-button'),phone=viewport.width<1024;
  // Not affordable: Mara keeps her line, with no greyed button.
  await expect(offer).toBeHidden();await expect(page.locator('.guide')).toBeVisible();if(phone){await expect(story).not.toHaveAttribute('data-ready');await expect(story).toHaveAccessibleName('Story');}
  await page.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,saveAfter(0,data.tasks[0].cost)]);await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  const pay=offer.getByRole('button',{name:`Pay ${data.tasks[0].cost} coins: ${data.tasks[0].title}`});
  await expect(offer).toBeVisible();await expect(offer).toContainText(data.tasks[0].title);await expect(pay).toBeVisible();expect((await pay.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  if(phone){await expect(story).toHaveAttribute('data-ready','');await expect(story).toHaveAccessibleName('Story, a preparation is ready');}
  for(const mode of ['light','dark']){
    await appearance(page,mode);
    const colors=await page.evaluate(()=>{const s=(e: Element)=>getComputedStyle(e);const offer=document.querySelector('#offer')!,pay=offer.querySelector('.pay-button')!;
      let back=offer as Element;while(s(back).backgroundColor==='rgba(0, 0, 0, 0)'&&back.parentElement)back=back.parentElement;
      return{back:s(back).backgroundColor,title:s(offer.querySelector('strong')!).color,note:s(offer.querySelector('span:not(.portrait)')!).color,pay:s(pay).backgroundColor,label:s(pay).color};});
    expect(ratio(colors.back,colors.title),mode).toBeGreaterThanOrEqual(4.5);expect(ratio(colors.back,colors.note),mode).toBeGreaterThanOrEqual(4.5);expect(ratio(colors.pay,colors.label),mode).toBeGreaterThanOrEqual(4.5);
  }
  // The Story sheet owns Pay while it is open; closing it restores Mara's offer.
  await story.click();await expect(page.getByRole('button',{name:/^Pay /})).toHaveCount(1);
  await expect(page.getByRole('dialog').getByRole('button',{name:/^Pay /})).toBeVisible();await expect(pay).toBeHidden();
  await page.getByRole('button',{name:'Close dialog'}).click();await expect(pay).toBeVisible();
  // A selected tile still wins the place under the board.
  await tile(page,13);await expect(offer).toBeHidden();await expect(page.locator('#item-detail')).toBeVisible();await unselect(page);await expect(offer).toBeVisible();
  await pay.click();const after=await saved(page);expect(after.decorations).toEqual(['task_1']);expect(after.coins).toBe(0);
  for(const label of ['Continue','Continue','See what changed'])await page.locator('.story-controls .primary-button',{hasText:label}).click();
  await revealed(page);await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-01');
  expect(await saved(page)).toEqual(after);await expect(offer).toBeHidden();if(phone){await expect(story).not.toHaveAttribute('data-ready');await expect(story).toHaveAccessibleName('Story');}
});

test('a second pointer during a drag leaves no ghost behind',async({page})=>{
  await start(page);const before=await saved(page);const from=(await page.locator('[data-cell="13"]').boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(from.x+from.width/2+40,from.y+from.height/2+40,{steps:4});
  await expect(page.locator('.drag-ghost')).toHaveCount(1);
  await page.locator('[data-cell="22"]').dispatchEvent('pointerdown',{pointerId:9,button:0});await expect(page.locator('.drag-ghost')).toHaveCount(0);
  await page.mouse.up();await expect(page.locator('.drag-ghost')).toHaveCount(0);expect(await saved(page)).toEqual(before);
});

test('light, dark, and system themes persist with readable contrast at desktop and phone',async({page},testInfo)=>{
  await page.emulateMedia({colorScheme:'light'});await start(page);
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.locator('body').evaluate(e=>getComputedStyle(e).fontFamily)).toContain('Inter');
  expect(await page.locator('.wordmark').evaluate(e=>getComputedStyle(e).fontFamily)).toContain('Grenze Gotisch');
  expect(await page.evaluate(()=>document.fonts.check('400 16px Inter')&&document.fonts.check('600 40px "Grenze Gotisch"'))).toBe(true);
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    for(const mode of ['light','dark']){
      await appearance(page,mode);await expect(page.locator('html')).toHaveAttribute('data-theme',mode);
      expect(await page.evaluate(()=>{const page=getComputedStyle(document.documentElement).getPropertyValue('--page').trim();return[...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].every(meta=>meta.content===page);})).toBe(true);
      // Main text on the page and the drawer, and muted text on the surface it actually sits on (the first opaque background behind it).
      const colors=await page.evaluate(()=>{
        const style=(selector: string)=>getComputedStyle(document.querySelector(selector)!);
        const behind=(selector: string)=>{let e: Element|null=document.querySelector(selector);while(e&&getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)')e=e.parentElement;return getComputedStyle(e??document.documentElement).backgroundColor;};
        return{page:behind('body'),text:style('body').color,drawer:behind('.drawer'),status:style('#status').color,card:behind('.story-foot'),muted:style('.story-foot').color,ticket:style('.order').backgroundColor,price:style('.serve-button:disabled').color};
      });
      expect(ratio(colors.page,colors.text)).toBeGreaterThanOrEqual(4.5);expect(ratio(colors.drawer,colors.status)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(colors.card,colors.muted)).toBeGreaterThanOrEqual(4.5);expect(ratio(colors.ticket,colors.price)).toBeGreaterThanOrEqual(4.5);
      if(testInfo.project.name==='chromium-pages')await page.screenshot({path:testInfo.outputPath(`${mode}-${viewport.width}.png`)});
    }
  }
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const dark=await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor);
  await appearance(page,'system');await page.emulateMedia({colorScheme:'light'});
  expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe(dark);
  await page.emulateMedia({colorScheme:'dark'});expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe(dark);
});

test('export/import/reset preserve portable new-game progress',async({page})=>{
  await start(page);await mergeStart(page);const before=await saved(page);await page.getByRole('button',{name:'Settings and saved game'}).first().click();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();const download=await pending;const path=await download.path();expect(download.suggestedFilename()).toBe('scary-snacks-save.json');
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();expect((await saved(page)).merges).toBe(0);
  await page.getByRole('button',{name:'Settings and saved game'}).first().click();await page.locator('input[type=file]').setInputFiles(path);await page.getByRole('button',{name:'Import this saved game'}).click();expect(await saved(page)).toEqual(before);
});

test('corrupt saves remain intact and report recovery',async({page})=>{
  await page.addInitScript(key=>localStorage.setItem(key,'broken-save'),KEY);await start(page);await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.save-error')).toContainText('could not be loaded');expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe('broken-save');
});

test('only approved assets load from the active root or Pages prefix, and only the current room state downloads',async({page,request,baseURL})=>{
  const foreign: string[]=[],failures: string[]=[],errors: string[]=[],loaded: string[]=[];const base=new URL(baseURL!);
  page.on('request',r=>{const url=new URL(r.url());if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))foreign.push(r.url());});
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failures.push(r.url());else loaded.push(new URL(r.url()).pathname);});page.on('pageerror',e=>errors.push(e.message));
  await start(page);
  // The page loads the AVIF or WebP variants of every master it shows, never a PNG master.
  for(const id of ['front-room-00','timber-tabletop','embroidered-runner','menu-atlas','portraits','mascots'])await expect.poll(()=>loaded.some(path=>path.includes(`/assets/variants/${id}-`)),{message:id}).toBe(true);await expect(page).toHaveTitle('Scary Snacks');
  const rooms=()=>[...new Set(loaded.filter(path=>/\/assets\/variants\/(front-room|courtyard)-\d\d-/.test(path)).map(path=>path.match(/(front-room|courtyard)-\d\d/)![0]))];
  expect(rooms()).toEqual(['front-room-00']);
  await page.getByRole('button',{name:/The recipe book/}).click();await expect(page.locator('.recipe-item')).toHaveCount(30);await page.getByRole('button',{name:'Close dialog'}).click();
  // The completed save opens on the front room with its selected decorations. The courtyard loads only when the player opens it.
  const decorated=saveAfter(24,0,{tableware:'green',textiles:'blue',flowers:'lilacs'});
  await page.evaluate(([key,save])=>{localStorage.setItem(key,save);localStorage.removeItem('scary-snacks-area');},[KEY,decorated]);loaded.length=0;await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  const decodedDecoration=async(id: string)=>{
    await expect.poll(()=>loaded.some(path=>path.includes(`/assets/variants/${id}-`)&&path.endsWith('.webp')),{message:id}).toBe(true);
    const images=page.locator(`#room-frame svg image[href*="/assets/variants/${id}-"]`);
    await expect(images.first()).toBeAttached();
    expect(await images.evaluateAll(async values=>Promise.all(values.map(async value=>{
      const image=new Image();image.src=(value as SVGImageElement).href.baseVal;await image.decode();return image.naturalWidth>0;
    })))).not.toContain(false);
  };
  await expect.poll(()=>painting(page)).toMatch(/^front-room-24-/);expect(rooms()).toEqual(['front-room-24']);await decodedDecoration('decoration-front');
  await page.getByRole('button',{name:'Courtyard',exact:true}).click();await expect.poll(()=>painting(page)).toMatch(/^courtyard-23-/);expect(rooms().sort()).toEqual(['courtyard-23','front-room-24']);await decodedDecoration('decoration-courtyard');
  expect(foreign).toEqual([]);expect(failures).toEqual([]);expect(errors).toEqual([]);
  expect(loaded.some(path=>path.includes('/assets/original/'))).toBe(false);
  for(const path of ['analysis/build-manifest.json','private/notes.md','assets/original/menu-atlas.png','src/app.ts','package.json'])expect((await request.get(new URL(path,base).href)).status()).toBe(404);
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content',/script-src 'self'/);
});

test('a drawer ticket with two dishes is one 44px target that lists the order, and each dish opens its item',async({page})=>{
  const save=JSON.parse(saveAfter(0));Object.assign(save.state.orders[0],{requirements:['bakery_1','bakery_2'],reward:menuReward(['bakery_1','bakery_2'],data)});
  await page.setViewportSize({width:360,height:740});await startWith(page,JSON.stringify(save));
  const dishes=page.locator('#orders .order').first().locator('.order-items');await expect(dishes.locator('.order-item')).toHaveCount(2);
  const box=(await dishes.boundingBox())!;expect(Math.min(box.width,box.height)).toBeGreaterThanOrEqual(44);
  await expect(dishes).toHaveAttribute('aria-label',/’s dishes: .+, ready on the board; .+, not on the board yet$/);
  for(const card of await page.locator('#orders .order').all())for(const target of await card.getByRole('button').all())expect((await target.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await dishes.click();await expect(page.locator('#modal-title')).toHaveText(/’s order$/);
  await page.getByRole('dialog').locator('.recipe-item').nth(1).click();await expect(page.getByRole('dialog').locator('.item-how')).toHaveText(/^Merge two .+ to make .+\.$/);
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.setViewportSize({width:1440,height:900});await expect(dishes.getByRole('button')).toHaveCount(2);
});

test('phone shows the room, the tickets, the board and Mara in one screen, with the drawer and the bar in thumb reach',async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});await start(page);await mergeStart(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  for(const mode of ['light','dark']){await appearance(page,mode);if(testInfo.project.name==='chromium-pages')await page.screenshot({path:testInfo.outputPath(`${mode}-phone.png`)});}
  const header=page.locator('.masthead');const height=(await header.boundingBox())!.height;await page.locator('#coins').evaluate(e=>{e.textContent='99,999';});expect((await header.boundingBox())!.height).toBe(height);
  await expect(page.getByRole('heading',{level:1})).toHaveText('Scary Snacks');
  const box=async(selector: string)=>(await page.locator(selector).boundingBox())!;
  const bar=await box('.phone-bar'),drawer=await box('#drawer'),tickets=await box('.tickets'),board=await box('#board'),slot=await box('.line-slot');
  expect(Math.round(bar.y+bar.height)).toBe(844);expect(Math.round(drawer.y+drawer.height)).toBe(Math.round(bar.y));
  // About 250px of room shows above the handle row of tickets; the board and Mara's line follow inside the drawer.
  expect(drawer.y-height).toBeGreaterThanOrEqual(230);expect(drawer.y-height).toBeLessThanOrEqual(280);
  expect(tickets.y).toBeGreaterThanOrEqual(drawer.y);expect(board.y).toBeGreaterThanOrEqual(tickets.y+tickets.height);expect(board.y+board.height).toBeLessThanOrEqual(slot.y);expect(slot.y+slot.height).toBeLessThanOrEqual(bar.y+1);
  for(const serve of await page.locator('#orders .serve-button').all())expect((await serve.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect((await box('[data-cell="0"]')).width).toBeGreaterThanOrEqual(44);
  await unselect(page);await expect(page.locator('.guide')).toBeVisible();await expect(page.locator('#item-detail')).toBeHidden();
  await tile(page,14);await expect(page.locator('#item-detail')).toBeVisible();expect((await box('.guide')).width).toBeLessThanOrEqual(1);
  await page.getByRole('button',{name:'Store',exact:true}).click();expect((await saved(page)).inventory).toHaveLength(1);await expect(page.locator('.guide')).toBeVisible();
  await page.getByRole('button',{name:/^Pantry/}).click();const sheet=page.getByRole('dialog');await expect(sheet.locator('#modal-title')).toHaveText('The pantry');
  expect(Math.round((await sheet.boundingBox())!.y+(await sheet.boundingBox())!.height)).toBe(844);
  await sheet.getByRole('button',{name:'Return Dough to the board'}).click();expect((await saved(page)).inventory).toHaveLength(0);
  await page.getByRole('button',{name:'Close dialog'}).click();await expect(page.locator('#side #pantry')).toHaveCount(1);
  await page.getByRole('button',{name:'Story',exact:true}).click();await expect(sheet).toBeVisible();
  await sheet.locator('.cat-visit').click();await expect(sheet.locator('.cat-sleeping')).toBeVisible();
});

test('desktop first screen shows the uncovered room beside the tickets, the whole board, Mara, the story and the pantry',async({page},testInfo)=>{
  for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);await start(page);await expect(page.locator('#orders .order')).toHaveCount(3);
    const room=(await page.locator('#room-stage').boundingBox())!;expect([room.x,room.y,room.height]).toEqual([0,0,viewport.height]);expect(room.width).toBeGreaterThanOrEqual(viewport.width*.5-1);
    for(const selector of ['.masthead','#drawer']){const box=(await page.locator(selector).boundingBox())!;expect(box.x,`${selector} beside the room`).toBeGreaterThanOrEqual(room.x+room.width);}
    const first=['.tickets','#board','.guide','#story','#pantry'];
    for(const selector of first){const box=(await page.locator(selector).boundingBox())!;expect(box.y+box.height,`${selector} at ${viewport.width}`).toBeLessThanOrEqual(viewport.height);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await page.locator('[data-cell="0"]').boundingBox())!.width).toBeGreaterThanOrEqual(44);
    await page.screenshot({path:testInfo.outputPath(`desktop-first-screen-${viewport.width}.png`)});
  }
  await page.setViewportSize({width:1440,height:900});
  await tile(page,13);await expect(page.locator('#item-detail')).toBeVisible();await expect(page.locator('#item-detail')).toContainText('Flour');
  await page.getByRole('button',{name:'Clear selection'}).click();await expect(page.locator('#board [aria-pressed="true"]')).toHaveCount(0);await expect(page.locator('#item-detail')).toBeHidden();
  await page.locator('#cat-button').click();await expect(page.locator('#cat-button .cat-sleeping')).toBeVisible();await expect(page.locator('#drawer-handle')).toBeHidden();
  // The runner repeats only the seamless part of its bitmap.
  await expect(page.locator('#runner-repeat image')).toHaveAttribute('x','-161');await expect(page.locator('#runner-repeat')).toHaveAttribute('width','503');
});

test('coins keep clear of the wordmark on narrow phones in any browser locale',async({browser,baseURL})=>{
  for(const locale of ['en-US','ro-RO']){
    const context=await browser.newContext({locale,baseURL});const page=await context.newPage();await start(page);
    for(const [coins,shown] of [[999,'999'],[123456,'123.4K'],[1234567,'1.2M']] as const){
      await page.evaluate(([key,coins])=>{const save=JSON.parse(localStorage.getItem(key)!);save.state.coins=coins;localStorage.setItem(key,JSON.stringify(save));},[KEY,coins] as const);
      for(const width of [320,360]){
        await page.setViewportSize({width,height:740});await start(page);
        await expect(page.locator('#coins')).toHaveText(shown);await expect(page.locator('#coin-total')).toHaveText(`${coins.toLocaleString('en')} coins`);
        const word=(await page.locator('.wordmark span:last-child').boundingBox())!;const coin=(await page.locator('.coin-count .coin').boundingBox())!;
        expect(coin.x-(word.x+word.width)).toBeGreaterThanOrEqual(12);
      }
    }
    await context.close();
  }
});

test('the board is one tab stop that the arrow keys, Home, and End move through',async({page})=>{
  await start(page);await expect(page.locator('#board [tabindex="0"]')).toHaveCount(1);
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-cell="0"]')).toBeFocused();
  await page.keyboard.press('End');await expect(page.locator('[data-cell="5"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');await expect(page.locator('[data-cell="11"]')).toBeFocused();
  await page.keyboard.press('Home');await expect(page.locator('[data-cell="6"]')).toBeFocused();
  await page.keyboard.press('Control+End');await expect(page.locator('[data-cell="41"]')).toBeFocused();await expect(page.locator('#board [tabindex="0"]')).toHaveCount(1);
  // Tab leaves the board in one step, and Shift+Tab comes back to the same space.
  await page.keyboard.press('Tab');expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('#board')))).toBe(false);
  await page.keyboard.press('Shift+Tab');await expect(page.locator('[data-cell="41"]')).toBeFocused();
  // Escape clears a selection and Mara names the move gesture again.
  await page.locator('[data-cell="13"]').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-cell="13"]')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');await expect(page.locator('#board [aria-pressed="true"]')).toHaveCount(0);await expect(page.locator('#status')).toHaveText('Tap an item, then tap where it should go.');
  // Sources say what they are, and their badge is drawn, not typed.
  await expect(page.locator('#board [aria-label*="source of"]').first()).toBeVisible();await expect(page.locator('#board .source-mark').first()).toBeVisible();
  expect(await page.locator('#board').evaluate(e=>e.textContent)).toBe('');
});

test('dialogs hold focus on the safe choice, on the title, and on the story buttons',async({page})=>{
  await start(page);await mergeStart(page);
  await page.getByRole('button',{name:'Settings and saved game'}).first().click();
  for(const option of await page.locator('.choice').all())expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();const keep=page.getByRole('button',{name:'Keep this game'});await expect(keep).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#modal-title')).toHaveText('House book');await expect(page.locator('#modal-title')).toBeFocused();expect((await saved(page)).merges).toBe(1);
  const sound=page.getByRole('button',{name:'Turn sound on'});await sound.focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Turn sound off'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();
  await page.evaluate(({key,goals})=>{const save=JSON.parse(localStorage.getItem(key)!);save.state.coins=1000;Object.assign(save.state,goals);localStorage.setItem(key,JSON.stringify(save));},{key:KEY,goals:data.tasks[0].goals});await start(page);
  await page.locator('#story').getByRole('button',{name:/^Pay /}).click();const forward=page.locator('.story-controls .primary-button');await expect(forward).toBeFocused();
  // The line lives in one polite live region that stays in place, so screen readers announce each new line.
  const line=page.locator('#story-line');await expect(line).toHaveAttribute('aria-live','polite');await line.evaluate(e=>{(e as HTMLElement).dataset.kept='yes';});const first=await line.textContent();
  await page.keyboard.press('Enter');await expect(page.locator('.story-controls>span')).toHaveText(/^2 \//);await expect(forward).toBeFocused();
  await expect(line).toHaveAttribute('data-kept','yes');await expect(line).not.toHaveText(first!);
  await page.locator('.story-controls .secondary-button').click();await expect(page.locator('.story-controls>span')).toHaveText(/^1 \//);await expect(forward).toBeFocused();
  // Closing the story early still reveals the change once, in the room.
  await page.keyboard.press('Escape');await revealed(page);await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-01');
});

test('a second tab takes up the progress saved in the first instead of overwriting it',async({context})=>{
  const first=await context.newPage();await start(first);const second=await context.newPage();await start(second);
  await mergeStart(first);
  await expect(second.locator('#status')).toContainText('another tab');await expect(second.locator('[data-cell="13"]')).toHaveAttribute('aria-label',/: empty$/);
  const source=(await saved(second)).board.findIndex(cell=>cell?.code.startsWith('generator_'));await tile(second,source);await tile(second,source);
  const state=await saved(second);expect(state.merges).toBe(1);expect(state.board[14]?.code).toBe('bakery_2');
  await second.getByRole('button',{name:/The recipe book/}).click();await expect(second.getByRole('dialog')).toBeVisible();
  await tile(first,source);await tile(first,source);await expect(second.getByRole('dialog')).toBeHidden();
  // Each take is its own save, so wait for the second tab to show both before the drag measures a cell.
  const settled=await saved(first);
  await expect(second.locator('#board .cell:not(.empty):not(.obstacle)')).toHaveCount(settled.board.filter(Boolean).length);
  const box=(await second.locator('[data-cell="14"]').boundingBox())!;await second.mouse.move(box.x+box.width/2,box.y+box.height/2);await second.mouse.down();await second.mouse.move(box.x+box.width/2+30,box.y+box.height/2+30,{steps:3});
  await expect(second.locator('.drag-ghost')).toHaveCount(1);await tile(first,source);await expect(second.locator('.drag-ghost')).toHaveCount(0);await second.mouse.up();
});

test('a kitchen that cannot load offers to try again',async({page})=>{
  let fail=true;await page.route('**/data/game.json',route=>fail?route.fulfill({status:503,body:''}):route.continue());
  await page.goto('./');await expect(page.locator('#status')).toContainText('The kitchen could not open.');
  for(const opener of await page.locator('#story-button,#recipes-button,#pantry-button,#collection-button,[data-house-book]').all())await expect(opener).toBeDisabled();
  fail=false;await page.getByRole('button',{name:'Try again'}).click();await expect(page.locator('#board button')).toHaveCount(42);
});

for(const fault of ['cost','board dimensions','board length'] as const)test(`game data with invalid ${fault} stops before save access and can retry`,async({page})=>{
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await start(page);await mergeStart(page);const before=await page.evaluate(key=>localStorage.getItem(key),KEY);
  const broken=structuredClone(data);
  if(fault==='cost')broken.tasks[0].cost++;
  else if(fault==='board dimensions')broken.board.columns=7;
  else broken.board.initial.pop();
  await page.addInitScript(()=>{
    const audit=Object.assign(window,{saveAccess:[] as string[]});
    const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
    Storage.prototype.getItem=function(key){if(key.startsWith('scary-snacks-save-'))audit.saveAccess.push(`get:${key}`);return get.call(this,key);};
    Storage.prototype.setItem=function(key,value){if(key.startsWith('scary-snacks-save-'))audit.saveAccess.push(`set:${key}`);return set.call(this,key,value);};
    Storage.prototype.removeItem=function(key){if(key.startsWith('scary-snacks-save-'))audit.saveAccess.push(`remove:${key}`);return remove.call(this,key);};
  });
  let fail=true;await page.route('**/data/game.json',route=>fail?route.fulfill({json:broken}):route.continue());await page.reload();
  await expect(page.locator('#status')).toContainText('The kitchen could not open. The game data is not valid.');
  for(const opener of await page.locator('#story-button,#recipes-button,#pantry-button,#collection-button,[data-house-book]').all())await expect(opener).toBeDisabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(()=>(window as Window & {saveAccess?: string[]}).saveAccess)).toEqual([]);
  expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(before);
  fail=false;await page.getByRole('button',{name:'Try again'}).click();await expect(page.locator('#board button')).toHaveCount(42);
  expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(before);
  expect(errors).toEqual([]);
});

test('blocked browser storage keeps the game playable for the visit and says that it is not saved',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
  await start(page);await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('.save-status').first()).toContainText('blocks storage');
  for(const name of ['Retry saved game','Retry save'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Close dialog'}).click();
  await tile(page,13);await tile(page,14);
  await expect(page.locator('[data-cell="14"]')).toHaveAttribute('aria-label',new RegExp(data.items.bakery_2.name));
  await expect(page.locator('.save-status').first()).toContainText('lasts only for this visit');
});

test('narrow phones keep the whole dish name in the strip, and short screens keep the board clear of the bar',async({page})=>{
  const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));const state=createGame(data);
  const longest=Object.keys(data.items).sort((a,b)=>data.items[b].name.length-data.items[a].name.length)[0];const at=firstFreeBoardCell(state,data);state.board[at]={code:longest};state.discovered.push(longest);
  await page.addInitScript(([key,save])=>localStorage.setItem(key,save),[KEY,exportSave(state,candidate=>validateGame(candidate,data))]);
  for(const width of [320,360,390]){
    await page.setViewportSize({width,height:740});await start(page);await tile(page,at);
    const name=page.locator('#item-detail h3');await expect(name).toHaveText(data.items[longest].name);
    expect(await name.evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)).toBe(true);
    // A two-line name leaves no room for the rule line, and Mara's note leaves the name to the strip.
    await expect(page.locator('#item-detail .detail-next')).toBeHidden();await expect(page.locator('#status')).toHaveText('Tap another to merge, or an empty space to move it.');
    expect((await page.locator('#item-detail').boundingBox())!.y+(await page.locator('#item-detail').boundingBox())!.height).toBeLessThanOrEqual((await page.locator('.phone-bar').boundingBox())!.y+1);
    // Cells never drop below 44px, within half a pixel of rounding.
    expect((await page.locator('[data-cell="0"]').boundingBox())!.width).toBeGreaterThanOrEqual(43.5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  // Down to 740px tall the room gives up height, so the board and Mara's line still fit above the bar without scrolling.
  await page.setViewportSize({width:390,height:740});await start(page);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  expect((await page.locator('#drawer').boundingBox())!.y).toBeGreaterThan(48+100);
  // A new game on a short phone: the shorter opening line fits the line under the board.
  await page.addInitScript(key=>localStorage.removeItem(key),KEY);
  for(const width of [320,390]){
    await page.setViewportSize({width,height:740});await start(page);await expect(page.locator('#status')).toHaveText('Merge the two Flours. Merge beside clutter to clear it.');
    const words=await page.locator('#status').evaluate(e=>{const range=document.createRange();range.selectNodeContents(e);return range.getBoundingClientRect().bottom;});
    expect(words).toBeLessThanOrEqual((await page.locator('.phone-bar').boundingBox())!.y);
  }
  await page.setViewportSize({width:667,height:375});await start(page);
  for(const selector of ['#drawer','.phone-bar'])expect(await page.locator(selector).evaluate(e=>getComputedStyle(e).position)).toBe('static');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('forced colours keep the spaces, the selection, the tickets and the area switch visible',async({page})=>{
  await page.emulateMedia({forcedColors:'active'});await start(page);await tile(page,13);
  expect(await page.locator('[data-cell="13"]').evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
  for(const selector of ['[data-cell="20"]','#orders .order','.area-choice'])expect(await page.locator(selector).first().evaluate(e=>getComputedStyle(e).borderTopStyle),selector).toBe('solid');
});

test('the checked appearance carries a 3:1 ring in both themes, and a story has no Back on its first line',async({page})=>{
  await start(page);
  for(const mode of ['light','dark']){
    await appearance(page,mode);await page.getByRole('button',{name:'Settings and saved game'}).first().click();
    const colors=await page.evaluate(()=>({ring:getComputedStyle(document.querySelector('.choice:has(input:checked)')!).boxShadow.match(/rgba?\([^)]*\)/)![0],track:getComputedStyle(document.querySelector('.choice-group')!).backgroundColor}));
    expect(ratio(colors.ring,colors.track)).toBeGreaterThanOrEqual(3);await page.keyboard.press('Escape');
  }
  await page.evaluate(({key,goals})=>{const save=JSON.parse(localStorage.getItem(key)!);save.state.coins=1000;Object.assign(save.state,goals);localStorage.setItem(key,JSON.stringify(save));},{key:KEY,goals:data.tasks[0].goals});await start(page);
  await page.locator('#story').getByRole('button',{name:/^Pay /}).click();await expect(page.locator('.story-controls .secondary-button')).toBeHidden();
  await page.keyboard.press('Enter');await expect(page.locator('.story-controls .secondary-button')).toBeVisible();
});

test('the skip link lands on the board without scrolling the header away',async({page})=>{
  await start(page);await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
  await expect(page.locator('[data-cell="0"]')).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(0);
});

test('arrival completion preserves keyboard focus on another order',async({page})=>{
  await start(page);await mergeStart(page);const order=(await saved(page)).orders[0];await prepare(page,order.requirements[0]);await unselect(page);
  await page.locator('#orders .order').first().getByRole('button',{name:/^Serve /}).click();
  const item=page.locator('#orders .order').nth(1).locator('.order-item').first();await item.focus();await expect(item).toBeFocused();
  await expect(page.locator('#orders .arriving')).toHaveCount(0,{timeout:4000});await expect(item).toBeFocused();
});

test('phone recipe guidance opens the pantry sheet for a stored dish while another item is selected',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page);await mergeStart(page);
  await page.getByRole('button',{name:'Store',exact:true}).click();await tile(page,22);await expect(page.locator('#item-detail')).toBeVisible();
  await page.getByRole('button',{name:/^Recipes/}).click();await page.getByRole('button',{name:'Dough',exact:true}).click();
  await page.getByRole('button',{name:'Show me on the board'}).click();
  await expect(page.locator('#status')).toContainText('Dough is in the pantry');await expect(page.locator('#modal-title')).toHaveText('The pantry');
  await page.getByRole('button',{name:'Return Dough to the board'}).click();expect((await saved(page)).inventory).toHaveLength(0);
});

test('starting a new game clears the previous game discovery notification',async({page})=>{
  await start(page);await mergeStart(page);await tile(page,6);await expect(page.locator('#collection-button')).toHaveAttribute('data-fresh','');
  await page.getByRole('button',{name:/House book/}).first().click();await page.getByRole('button',{name:'Start a new game',exact:true}).click();
  await page.getByRole('button',{name:'Erase and start again'}).click();
  await expect(page.locator('#collection-button')).not.toHaveAttribute('data-fresh','');await expect(page.locator('#discovery-count')).toHaveText('5 of 30 dishes discovered');
});

for(const route of ['load','import','another tab'])test(`saves with duplicate customers keep three different neighbours on ${route}`,async({page,context})=>{
  const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));const duplicated=createGame(data);duplicated.orders[2].customer=duplicated.orders[0].customer;
  const encoded=exportSave(duplicated,candidate=>validateGame(candidate,data));await start(page);
  if(route==='load'){
    await page.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,encoded]);await start(page);
  }else if(route==='import'){
    await mergeStart(page);await page.getByRole('button',{name:/House book/}).first().click();
    await page.locator('input[type=file]').setInputFiles({name:'duplicated.json',mimeType:'application/json',buffer:Buffer.from(encoded)});
    await page.getByRole('button',{name:'Import this saved game'}).click();
  }else{
    await mergeStart(page);const writer=await context.newPage();await start(writer);
    await writer.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,encoded]);await expect(page.locator('#status')).toContainText('another tab');await writer.close();
  }
  const neighbours=await page.locator('#orders .order-name').allTextContents();expect(new Set(neighbours).size).toBe(3);
  await expect(page.locator('#collection-button')).not.toHaveAttribute('data-fresh','');
  // Loading repairs the presentation without rewriting the stored snapshot. The next action persists it.
  if(route!=='import')expect(await saved(page)).toEqual(duplicated);
  await tile(page,13);await page.getByRole('button',{name:'Store',exact:true}).click();const after=await saved(page);
  expect(new Set(after.orders.map(order=>order.customer)).size).toBe(3);
  expect(after.orders.map(({customer,...order})=>order)).toEqual(duplicated.orders.map(({customer,...order})=>order));
  expect(after.seed).toBe(duplicated.seed);expect(after.coins).toBe(duplicated.coins);
});

test('a delayed storage event cannot let a stale action overwrite another tab',async({context})=>{
  const first=await context.newPage();await start(first);const second=await context.newPage();
  await second.addInitScript(()=>window.addEventListener('storage',event=>event.stopImmediatePropagation(),true));await start(second);
  await mergeStart(first);const newer=await saved(first);
  await expect(second.locator('[data-cell="14"]')).toHaveAttribute('aria-label',/: Flour$/);
  // The first tap finds the newer progress and is cancelled, so it takes nothing.
  await tile(second,1);
  await expect(second.locator('#status')).toContainText('another tab');expect(await saved(second)).toEqual(newer);
  await expect(second.locator('[data-cell="14"]')).toHaveAttribute('aria-label',/: Dough$/);
  // The next deliberate action applies to the updated board.
  await tile(second,1);await tile(second,1);expect((await saved(second)).merges).toBe(1);expect((await saved(second)).board[2]?.code).toBe('bakery_1');
});

test('game writes wait for the shared save lock and recheck progress before changing it',async({context})=>{
  const first=await context.newPage();await start(first);const second=await context.newPage();await start(second);
  await tile(first,1);await tile(second,1);const before=await saved(first);
  await first.evaluate(key=>{void navigator.locks.request(key,()=>new Promise<void>(resolve=>{
    document.documentElement.dataset.saveLocked='true';window.addEventListener('release-save-lock',()=>resolve(),{once:true});
  }));},KEY);
  await expect(first.locator('html')).toHaveAttribute('data-save-locked','true');
  await tile(first,1);await tile(second,1);expect(await saved(first,false)).toEqual(before);
  await first.evaluate(()=>window.dispatchEvent(new Event('release-save-lock')));
  await expect.poll(async()=> (await saved(first)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);
  await expect(second.locator('#status')).toContainText('another tab');
  expect((await saved(second)).board.filter(Boolean)).toHaveLength(before.board.filter(Boolean).length+1);
});

test('two queued Pay activations cannot pay for a preparation that was not shown',async({page})=>{
  const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));const state=createGame(data);state.coins=1000;Object.assign(state,data.tasks[1].goals);
  await page.addInitScript(([key,value])=>localStorage.setItem(key,value),[KEY,exportSave(state,candidate=>validateGame(candidate,data))]);await start(page);
  await page.evaluate(key=>{void navigator.locks.request(key,()=>new Promise<void>(resolve=>{
    document.documentElement.dataset.saveLocked='true';window.addEventListener('release-save-lock',()=>resolve(),{once:true});
  }));},KEY);
  await expect(page.locator('html')).toHaveAttribute('data-save-locked','true');
  const pay=page.locator('#story').getByRole('button',{name:/^Pay /});await pay.click();await pay.click();
  await page.evaluate(()=>window.dispatchEvent(new Event('release-save-lock')));
  const after=await saved(page);expect(after.taskIndex).toBe(1);expect(after.coins).toBe(1000-data.tasks[0].cost);
  await expect(page.locator('#modal-title')).toHaveText(data.tasks[0].title);
});
