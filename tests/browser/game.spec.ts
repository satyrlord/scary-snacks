import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { firstFreeBoardCell, generatorOutputs, requiredQuests, resolveQuests } from '../../src/model.ts';
import { createGame } from '../../src/engine.ts';
import type { GameState } from '../../src/model.ts';
import { KEY, act, appearance, checkpoint, data, deliverButton, journal, onTicket, opened, options, painting, payAndRead, quest, ratio, replaceSave, revealed, saved, serialize, start, stateText, supply, tile, ticket, toast, unselect } from './support.ts';

async function mergeStart(page: Page){await tile(page,13).click();await tile(page,14).click();expect((await saved(page)).board[14]?.code).toBe('bakery_2');}
const welcome=quest('mara-welcome');
/** Earn the first preparation through legal actions: every required quest but the last delivered, and the dishes of the last on the board. */
function beforeFirstPreparation(){
  let state=createGame(data);
  const produce=(code: string): number=>{
    const item=data.items[code],source=`generator_${item.chain}`;
    if(generatorOutputs(state,source,data).includes(code)){const empty=firstFreeBoardCell(state,data);expect(empty).toBeGreaterThanOrEqual(0);state=act(state,{type:'spawn',index:state.board.findIndex(cell=>cell?.code===source)});return empty;}
    const lower=Object.values(data.items).find(candidate=>candidate.next===code)!;const first=produce(lower.id),second=produce(lower.id);state=act(state,{type:'move',from:first,to:second});return second;
  };
  for(;;){
    const open=resolveQuests(state,data).filter(view=>view.status==='active'||view.status==='waiting');
    for(const {item,quantity} of open[0].quest.requirements)for(let count=0;count<quantity;count++)produce(item);
    if(open.length===1)break;
    state=act(state,{type:'deliverQuest',id:open[0].quest.id});
  }
  for(const id of [...state.pendingScenes])state=act(state,{type:'readScene',id});
  return state;
}

test('the bistro produces, merges, delivers a quest, and survives reload',async({page})=>{
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message));await start(page);await mergeStart(page);
  // One tap on the drinks source takes Elderflowers; a merge with the other makes the Socată that Mara asks for.
  const before=await saved(page),empty=firstFreeBoardCell(before,data),elderflowers=before.board.findIndex(cell=>cell?.code==='drinks_1');
  await tile(page,before.board.findIndex(cell=>cell?.code==='generator_drinks')).click();await tile(page,elderflowers).click();await tile(page,empty).click();
  expect((await saved(page)).board[empty]?.code).toBe('drinks_2');
  const deliver=deliverButton(page,welcome);await expect(deliver).toBeEnabled();await expect(deliver).toHaveAccessibleName(`Deliver ${welcome.title} to Mara for ${welcome.reward} coins`);await deliver.click();
  await expect(toast(page)).toHaveText(`${welcome.title}: delivered. Earned ${welcome.reward} coins.`);
  const after=await saved(page);expect(after.completedQuests).toEqual([welcome.id]);expect(after.coins).toBe(welcome.reward);expect(after.board[empty]).toBeNull();expect(after.pendingScenes).toEqual([welcome.id]);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);expect(errors).toEqual([]);
});

test('pointer drag and keyboard merge agree, and the selected dish offers only Clear selection',async({page})=>{
  await start(page,createGame(data));const from=(await tile(page,13).boundingBox())!;const to=(await tile(page,14).boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();
  expect((await saved(page)).board[14]?.code).toBe('bakery_2');await expect(tile(page,14)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#item-detail').getByRole('button')).toHaveText(['']);await expect(page.locator('#item-detail').getByRole('button')).toHaveAccessibleName('Clear selection');
  expect((await saved(page)).coins).toBe(0);
  await unselect(page);await tile(page,1).click();await tile(page,1).click();await tile(page,1).click();
  const state=await saved(page);const pair=state.board.map((cell,index)=>({cell,index})).filter(({cell})=>cell?.code==='bakery_1').slice(0,2);
  await unselect(page);await tile(page,pair[0].index).focus();await page.keyboard.press('Space');await tile(page,pair[1].index).focus();await page.keyboard.press('Space');expect((await saved(page)).board[pair[1].index]?.code).toBe('bakery_2');
});

test('clicking a different item selects it for single-item actions; only a drag swaps',async({page})=>{
  await start(page);const before=await saved(page);await tile(page,13).click();await tile(page,22).click();
  expect(await saved(page)).toEqual(before);await expect(tile(page,22)).toHaveAttribute('aria-pressed','true');await expect(tile(page,13)).toHaveAttribute('aria-pressed','false');
  await tile(page,23).click();let state=await saved(page);expect(state.board[22]).toBeNull();expect(state.board[23]?.code).toBe('warm_1');expect(state.board[13]?.code).toBe('bakery_1');
  await tile(page,1).click();await tile(page,4).click();expect((await saved(page)).board[1]?.code).toBe('generator_bakery');await expect(tile(page,4)).toHaveAttribute('aria-pressed','true');
  await tile(page,13).click();await tile(page,22).click();state=await saved(page);expect(state.board[22]?.code).toBe('bakery_1');expect(state.board[13]).toBeNull();
  const from=(await tile(page,22).boundingBox())!;const to=(await tile(page,27).boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();
  state=await saved(page);expect(state.board[27]?.code).toBe('bakery_1');expect(state.board[22]?.code).toBe('drinks_1');
});

test('a ticket opens its quest, a dish row says how to get the dish, Show me points at the next step, and the story card shows Pay disabled with no Continue',async({page})=>{
  await start(page);const dishes=ticket(page,welcome).locator('.ticket-face');
  await expect(dishes).toHaveAccessibleName(`${welcome.title}: 1 ${data.items.drinks_2.name}, 0 on the board`);await dishes.click();
  const dialog=page.getByRole('dialog',{name:welcome.title,exact:true});await expect(dialog.locator('.quest-person')).toHaveText('Mara');
  await dialog.getByRole('button',{name:`1 ${data.items.drinks_2.name}: 0 of 1 on the board`,exact:true}).click();
  await expect(page.locator('#modal-title')).toHaveText(data.items.drinks_2.name);await expect(page.locator('#modal .item-how')).toHaveText(/^(Tap the .+ to take .+|Merge two .+ to make .+)\.$/);
  await expect(page.locator('#modal .chain [aria-current="step"]')).toHaveCount(1);await expect(page.locator('#modal .chain li')).toHaveCount(6);
  await page.getByRole('button',{name:'Show me on the board'}).click();await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#board [aria-pressed="true"]')).toHaveCount(1);await expect(page.locator('#status')).toHaveText(/ready on the board|Tap the other .+ to merge them|Tap the blocked .+ to merge and clear it|Use Take .+ on the .+/);
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

test('after the last preparation the room is ready for the supper, with the sleeping cat on the counter and only the supper quest on the counter',async({page})=>{
  const supper=data.quests.find(value=>value.cost!==undefined)!;
  await start(page,checkpoint(data.tasks.length,{coins:supper.cost}));
  await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-24');await expect.poll(()=>painting(page)).toMatch(/^front-room-24-/);
  await expect(page.locator('#story .task-content')).toContainText(supper.title);await expect(page.locator('.counter-cat')).toBeVisible();await expect(page.locator('#cat-button')).toBeVisible();
  await expect(page.locator('#tickets .ticket')).toHaveCount(1);await expect(page.locator('#tickets .ticket')).toHaveAttribute('data-quest',supper.id);
  await expect(page.locator('#room-pin')).toHaveAccessibleName(`New: ${stateText('front-room-24')}`);
  await expect(page.locator('#room-caption li').first()).toHaveText(stateText('front-room-00'));await expect(page.locator('#room-caption li').last()).toHaveText(stateText('front-room-24'));
});

test('the last required quest enables Pay, and the preparation paid with earned coins is revealed in the room once its story ends, and survives reload',async({page})=>{
  const initial=beforeFirstPreparation(),last=resolveQuests(initial,data).find(view=>view.status==='active')!.quest;
  const needed=requiredQuests(0,data).length,next=requiredQuests(1,data),cost=data.tasks[0].cost;
  const goal=(kind: string)=>page.locator(`#story [data-requirement="${kind}"]`),pay=page.locator('#story').getByRole('button',{name:/^Pay /});
  await start(page,initial);
  await expect(goal('quests')).toHaveText(`Quests delivered: ${needed-1} / ${needed}Need 1`);
  await expect(goal('coins')).toHaveText(`Coins: ${initial.coins} / ${cost}Need ${cost-initial.coins}`);await expect(pay).toBeDisabled();
  await deliverButton(page,last).click();await expect(toast(page)).toHaveText(`${last.title}: delivered. Earned ${last.reward} coins.`);
  await expect(page.locator('#story .story-waiting button')).toBeFocused();
  await expect(goal('quests')).toHaveText(`Quests delivered: ${needed} / ${needed}Complete`);
  await expect(goal('coins')).toHaveText(`Coins: ${initial.coins+last.reward} / ${cost}Complete`);
  const before=await saved(page);
  await pay.click();await expect(page.locator('.story-controls .primary-button')).toBeFocused();
  // The game was saved before the story opens, while the room still shows the room before the change.
  const paid=await saved(page);expect(paid.taskIndex).toBe(1);expect(paid.decorations).toEqual(['task_1']);expect(paid.coins).toBe(before.coins-data.tasks[0].cost);expect(paid.pendingScenes).toEqual([last.id,'task_1']);
  // The last line of the story reads its scene. The quest's own completion still waits in Story.
  const after={...paid,pendingScenes:[last.id]};
  await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-00');
  for(const label of ['Continue','Continue','See what changed'])await page.locator('.story-controls .primary-button',{hasText:label}).click();
  await revealed(page);await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-01');
  const pin=page.locator('#room-pin');await expect(pin).toBeFocused();await expect(pin).toHaveAccessibleName(`New: ${stateText('front-room-01')}`);
  await expect(page.locator('#status')).toHaveText(stateText('front-room-01'));
  // The next preparation counts its own quests, and the tickets carry the quests that the first preparation opened.
  await expect(goal('quests')).toHaveText(`Quests delivered: ${needed} / ${next.length}Need ${next.length-needed}`);await expect(pay).toBeDisabled();
  for(const value of next.slice(needed))await expect(deliverButton(page,value)).toBeVisible();
  // The reveal neither pays nor earns again.
  expect(await saved(page)).toEqual(after);await expect(page.locator('#coins')).toHaveText(String(after.coins));
  await page.reload();await opened(page);
  await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-01');await expect.poll(()=>painting(page)).toMatch(/^front-room-01-/);
  await expect(page.locator('#room-caption li')).toHaveText([stateText('front-room-00'),stateText('front-room-01')]);
  expect(await saved(page)).toEqual(after);
});

test('the reveal lowers the drawer by itself on a phone, then raises it, and a bat crosses the mended window on a wide screen',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page,checkpoint(3,{ready:true}));
  const drawer=page.locator('#drawer'),top=(await drawer.boundingBox())!.y;await payAndRead(page);
  await expect(page.locator('.game-layout')).toHaveClass(/revealing/);
  await expect.poll(async()=>(await drawer.boundingBox())!.y).toBeGreaterThan(top+150);
  // Lowered, the drawer shows the whole painting above it.
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#room-frame')!.getBoundingClientRect().bottom-document.querySelector('#drawer')!.getBoundingClientRect().top)).toBeLessThanOrEqual(1);
  await revealed(page);await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-04');
  await expect.poll(async()=>(await drawer.boundingBox())!.y).toBeCloseTo(top,0);await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await page.setViewportSize({width:1440,height:900});await replaceSave(page,checkpoint(4,{ready:true}));await payAndRead(page);
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
  await tile(page,13).click();await tile(page,14).focus();await page.keyboard.press('Space');
  expect((await saved(page)).board[14]?.code).toBe('bakery_2');
  await page.setViewportSize({width:390,height:844});
  await expect(handle).toHaveAttribute('aria-expanded','true');await expect(body).not.toHaveAttribute('inert');
  await handle.focus();await page.keyboard.press('Enter');await expect(body).toHaveAttribute('inert','');
  await page.keyboard.press('Enter');await expect(body).not.toHaveAttribute('inert');
});

test('a short-screen resize keeps the board inert until its active reveal ends',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page,checkpoint(0,{ready:true}));
  await payAndRead(page);await expect(page.locator('.game-layout')).toHaveClass(/revealing/);
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('#drawer-handle')).toBeHidden();await expect(page.locator('#drawer-body')).toHaveAttribute('inert','');
  await revealed(page);await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await mergeStart(page);
});

test('a reveal on a short screen leaves the board open, because the drawer does not move',async({page})=>{
  await page.setViewportSize({width:844,height:500});await start(page,checkpoint(0,{ready:true}));
  await payAndRead(page);await expect(page.locator('.game-layout')).toHaveClass(/revealing/);
  // The class and the lock are set together, so a snapshot now shows the lock if the reveal sets one.
  const during=await page.evaluate(()=>({inert:(document.querySelector('#drawer-body') as HTMLElement).inert,reveal:(document.querySelector('#room-stage') as HTMLElement).dataset.reveal}));
  expect(during.reveal).not.toBe('done');expect(during.inert).toBe(false);
  await revealed(page);await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  await mergeStart(page);
});

test('the courtyard is named but closed until its preparation, then the room follows it, and the choice stays out of the save',async({page})=>{
  await start(page,checkpoint(12,{ready:true}));
  const courtyard=page.getByRole('button',{name:'Courtyard',exact:true}),front=page.getByRole('button',{name:'Front room',exact:true});
  await expect(courtyard).toHaveAttribute('aria-disabled','true');await expect(courtyard).toHaveAccessibleDescription('The courtyard opens with “Clear the courtyard” in chapter 4.');
  await expect(front).toHaveAttribute('aria-pressed','true');await expect(page.locator('#room-caption')).not.toContainText(stateText('courtyard-13'));
  // A locked choice is not disabled for focus, so a press says what opens it.
  await courtyard.focus();await page.keyboard.press('Enter');await expect(page.locator('#status')).toHaveText('The courtyard opens with “Clear the courtyard” in chapter 4.');await expect(page.locator('#room-frame')).toHaveAttribute('data-area','front-room');
  await payAndRead(page);await revealed(page);
  await expect(courtyard).toHaveAttribute('aria-pressed','true');await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','courtyard-13');await expect(page.locator('#status')).toHaveText(stateText('courtyard-13'));
  await expect.poll(()=>painting(page)).toMatch(/^courtyard-13-/);
  // The player may look at the other room; the choice is a viewing preference in this browser, not part of the game.
  while(await page.locator('#modal').isVisible())await page.keyboard.press('Escape');
  const progress=await saved(page);await front.click();await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-12');
  expect(await page.evaluate(()=>localStorage.getItem('scary-snacks-area'))).toBe('front-room');expect(await saved(page)).toEqual(progress);
  await page.reload();await opened(page);await expect(front).toHaveAttribute('aria-pressed','true');
  await courtyard.click();await expect(courtyard).toHaveAttribute('aria-pressed','true');
  // Export, start again, and import: the opened area comes back with the progress, without paying again.
  await options(page);const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();const path=await (await pending).path();
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await expect(courtyard).toHaveAttribute('aria-disabled','true');await expect(front).toHaveAttribute('aria-pressed','true');await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-00');
  await options(page);await page.locator('input[type=file]').setInputFiles(path);await page.getByRole('button',{name:'Import this saved game'}).click();
  expect(await saved(page)).toEqual(progress);await expect(courtyard).not.toHaveAttribute('aria-disabled');await expect(courtyard).toHaveAttribute('aria-pressed','true');
});

test('with reduced motion the change shows at once, and nothing animates',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,checkpoint(23,{ready:true}));
  await page.getByRole('button',{name:'Front room',exact:true}).click();await expect.poll(()=>painting(page)).toMatch(/^front-room-17-/);await payAndRead(page);
  await revealed(page);await expect(page.locator('.game-layout')).not.toHaveClass(/revealing/);
  await expect(page.locator('#room-paintings .room-painting')).toHaveCount(1);await expect.poll(()=>painting(page)).toMatch(/^front-room-24-/);
  expect(await page.locator('#room-stage').evaluate(stage=>stage.getAnimations({subtree:true}).length)).toBe(0);
  // The chapter scene that the payment earned follows the reveal. Escape leaves it waiting and returns focus to the pin.
  await expect(page.getByRole('dialog',{name:'Chapter 6 complete: The first community supper'})).toBeVisible();await expect(page.locator('.story-controls .primary-button')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('.counter-cat')).toBeVisible();await expect(page.locator('#room-pin')).toBeFocused();await expect(page.locator('#status')).toHaveText(stateText('front-room-24'));
});

test('a painting that cannot load leaves the room in words, and play goes on',async({page})=>{
  await page.route('**/assets/variants/front-room-*',route=>route.fulfill({status:404,body:''}));await start(page,checkpoint(data.tasks.length));
  await expect(page.locator('#room-stage')).toHaveAttribute('data-failed','');
  const caption=page.locator('#room-caption');await expect(caption).toBeVisible();await expect(caption).toContainText('The painting of this room could not load, so here it is in words.');
  await expect(caption.locator('li')).toHaveText(data.rooms.filter(state=>state.area==='front-room').map(state=>state.text));
  for(const control of await page.locator('.room-finish').all()){
    await expect(control).toBeHidden();await expect(control).toHaveAttribute('inert','');
  }
  // Play goes on: a merge still saves.
  await mergeStart(page);
});

test('the framed change, the New pin and the area switch never collide, and no interface covers the change',async({page},testInfo)=>{
  test.setTimeout(90000);await start(page);
  for(const viewport of [{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    for(const count of [1,12,13,21,24]){
      await replaceSave(page,checkpoint(count));await expect.poll(()=>painting(page)).not.toBe('');
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

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'])test(`a new game shows three tickets that fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await start(page,undefined,theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  const open=resolveQuests(createGame(data),data).filter(view=>view.status==='active').map(view=>view.quest);
  await expect(page.locator('#tickets .ticket')).toHaveCount(3);
  for(const [slot,value] of open.entries()){
    const card=page.locator('#tickets .ticket').nth(slot),name=data.characters.find(person=>person.id===value.character)!.name;
    await expect(card).toHaveAttribute('data-quest',value.id);await expect(card).toHaveAccessibleName(`${name}’s quest: ${value.title}`);
    await expect(card.locator('.ticket-item')).toHaveCount(value.requirements.length);await expect(card.locator('.deliver-button')).toBeDisabled();
    await expect(card.locator('.deliver-button')).toHaveAccessibleName(new RegExp(` for ${value.reward} coins$`));await expect(card.locator('.deliver-button')).toContainText(String(value.reward));
    const box=(await card.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
    expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)).toBe(true);
    for(const target of await card.getByRole('button').all()){const size=(await target.boundingBox())!;expect(size.width).toBeGreaterThanOrEqual(44);expect(size.height).toBeGreaterThanOrEqual(44);}
    // The ticket and the Deliver price stay readable while it waits for its dishes.
    const colors=await card.evaluate(e=>({paper:getComputedStyle(e).backgroundColor,name:getComputedStyle(e.querySelector('.ticket-name')!).color,price:getComputedStyle(e.querySelector('.deliver-button')!).color,button:getComputedStyle(e.querySelector('.deliver-button')!).backgroundColor}));
    if(viewport.width>=1024)expect(ratio(colors.paper,colors.name)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(colors.button==='rgba(0, 0, 0, 0)'?colors.paper:colors.button,colors.price)).toBeGreaterThanOrEqual(4.5);
  }
  if(viewport.width<1024)await expect(page.locator('#tickets .ticket-count').first()).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`tickets-${viewport.width}-${theme}.png`)});
});

test('delivering a ready quest pays its reward with a toast, and a waiting quest takes its ticket',async({page})=>{
  const initial=supply(createGame(data),['drinks_2']),views=resolveQuests(initial,data),waiting=views.find(view=>view.status==='waiting')!.quest;
  const others=views.filter(view=>view.status==='active'&&view.quest!==welcome).map(view=>view.quest.id);
  await start(page,initial);await expect(page.locator('#tickets .ticket').first()).toHaveAttribute('data-quest',welcome.id);
  await expect(ticket(page,welcome).locator('.ticket-item.ready')).toHaveCount(1);await deliverButton(page,welcome).click();
  // The dishes fly to the ticket; then a toast reports the reward in words, without a dialog to dismiss.
  await expect(page.locator('#modal')).toBeHidden();await expect(toast(page)).toHaveText(`${welcome.title}: delivered. Earned ${welcome.reward} coins.`);
  await expect(page.locator('#coins')).toHaveText(String(welcome.reward));
  const after=await saved(page);expect(after.coins).toBe(welcome.reward);expect(after.completedQuests).toEqual([welcome.id]);expect(after.pendingScenes).toEqual([welcome.id]);
  // The waiting quest takes the delivered ticket; the other tickets keep their places.
  expect(await page.locator('#tickets .ticket').evaluateAll(cards=>cards.map(card=>(card as HTMLElement).dataset.quest))).toEqual([waiting.id,...others]);
  await expect(page.locator('#tickets .ticket').first()).toHaveClass(/arriving/);await expect(page.locator('.deliver-flight')).toHaveCount(0);
  await expect(ticket(page,welcome)).toHaveCount(0);await expect(page.locator('#tickets .ticket')).toHaveCount(3);
});

/** Two of the first undiscovered dish's ingredient on the board, so one merge makes a new dish. */
function beforeNewDish(){
  const initial=createGame(data),dish=Object.values(data.items).find(item=>!item.generator&&item.stage>1&&!initial.discovered.includes(item.id)&&initial.discovered.includes(`${item.chain}_${item.stage-1}`))!;
  const state=supply(initial,[`${dish.chain}_${dish.stage-1}`,`${dish.chain}_${dish.stage-1}`]);
  const [first,second]=state.board.flatMap((cell,index)=>cell?.code===`${dish.chain}_${dish.stage-1}`?[index]:[]);
  return {state,dish,first,second};
}
const dishCount=()=>({known:createGame(data).discovered.filter(code=>!data.items[code].generator).length,total:Object.values(data.items).filter(item=>!item.generator).length});

test('the recipe book keeps undiscovered dishes covered and marks new ones until it is opened',async({page})=>{
  const {state,dish,first,second}=beforeNewDish(),{known,total}=dishCount();
  await start(page,state);await page.getByRole('button',{name:/The recipe book/}).click();
  await expect(page.locator('.recipe-item.not-yet')).toHaveCount(total-known);await expect(page.locator('#modal')).not.toContainText(dish.name);await page.getByRole('button',{name:'Close dialog'}).click();
  await expect(page.locator('#discovery-count')).toHaveText(`${known} of ${total} dishes discovered`);
  await tile(page,first).click();await tile(page,second).click();await expect(page.locator('#status')).toHaveText(`${dish.name} is a new dish! It is in the recipe book now.`);
  await expect(page.locator('#collection-button')).toHaveAttribute('data-fresh','');await expect(page.locator('#discovery-count')).toHaveText(`${known+1} of ${total} dishes discovered, 1 new`);
  await page.getByRole('button',{name:/The recipe book/}).click();await expect(page.locator('.recipe-item.not-yet')).toHaveCount(total-known-1);await expect(page.locator('#modal')).toContainText(dish.name);
  await page.getByRole('button',{name:'Close dialog'}).click();await expect(page.locator('#collection-button')).not.toHaveAttribute('data-fresh','');
});

test('a chain with all six dishes discovered shows its completion mark across reload, and earns nothing',async({page})=>{
  const state=createGame(data);for(const code of [1,2,3,4,5,6].map(stage=>`bakery_${stage}`).concat([1,2,3,4,5].map(stage=>`warm_${stage}`)))if(!state.discovered.includes(code))state.discovered.push(code);
  const bakery=data.chains.find(chain=>chain.id==='bakery')!.name,warm=data.chains.find(chain=>chain.id==='warm')!.name;
  await start(page,state);
  for(let round=0;round<2;round++){
    await page.getByRole('button',{name:/The recipe book/}).click();const book=page.getByRole('dialog');
    await expect(book.getByRole('heading',{name:`${bakery}, complete`,exact:true})).toContainText('Complete');
    await expect(book.getByRole('heading',{name:warm,exact:true})).not.toContainText('Complete');
    await expect(book.locator('.chain-complete')).toHaveCount(1);
    await page.getByRole('button',{name:'Close dialog'}).click();
    if(!round){await page.reload();await opened(page);}
  }
  expect(await saved(page)).toEqual(state);
});

test('a quest dish stays covered in the book until it is made, and stays revealed after delivery and reload',async({page})=>{
  const dish=data.items[welcome.requirements[0].item],part=`${dish.chain}_${dish.stage-1}`,state=supply(createGame(data),[part]);
  const [first,second]=state.board.flatMap((cell,index)=>cell?.code===part?[index]:[]);
  expect(state.discovered).not.toContain(dish.id);await start(page,state);await expect(ticket(page,welcome).locator('.ticket-face')).toHaveAccessibleName(new RegExp(dish.name));
  await page.getByRole('button',{name:/The recipe book/}).click();await expect(page.locator('#modal')).not.toContainText(dish.name);await page.getByRole('button',{name:'Close dialog'}).click();
  await tile(page,first).click();await tile(page,second).click();await expect(page.locator('#status')).toHaveText(`${dish.name} is a new dish! It is in the recipe book now.`);
  await deliverButton(page,welcome).click();await expect(ticket(page,welcome)).toHaveCount(0);
  await page.reload();await opened(page);expect((await saved(page)).discovered).toContain(dish.id);
  await page.getByRole('button',{name:/The recipe book/}).click();await expect(page.locator('#modal').getByRole('button',{name:dish.name,exact:true})).toBeVisible();
});

test('reduced motion keeps the delivery outcome and words without the flight',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,supply(createGame(data),['drinks_2']));
  await deliverButton(page,welcome).click();await expect(page.locator('.deliver-flight')).toHaveCount(0);
  await expect(page.locator('#modal')).toBeHidden();await expect(toast(page)).toContainText(`Earned ${welcome.reward} coins.`);
  await expect(page.locator('#tickets .ticket')).toHaveCount(3);await expect(page.locator('#tickets .ticket').first()).toBeVisible();
});

/** Chooses a Motion option in Options and closes Options. */
async function chooseMotion(page: Page,name: string){
  await options(page);await page.getByRole('group',{name:'Motion'}).getByRole('radio',{name,exact:true}).check();await page.keyboard.press('Escape');
}
const buttonTransition=(page: Page)=>page.locator('#hint-button').evaluate(button=>getComputedStyle(button).transitionDuration);

for(const denied of ['access','write'])test(`motion and appearance changes report denied storage ${denied}`,async({page})=>{
  await page.addInitScript(mode=>{
    if(mode==='access')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked.','SecurityError');}});
    else {const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='scary-snacks-motion'||key==='scary-snacks-theme')throw new DOMException('Storage full.','QuotaExceededError');original.call(this,key,value);};}
  },denied);
  await start(page);if(!await page.getByRole('dialog',{name:'Options',exact:true}).isVisible())await options(page);
  for(const [group,choice,attribute] of [['Motion','Reduced','motion'],['Appearance','Light','theme']]){
    await page.getByRole('group',{name:group}).getByRole('radio',{name:choice,exact:true}).check();
    await expect(page.locator('html')).toHaveAttribute(`data-${attribute}`,choice.toLowerCase());
    await expect(page.locator('#status')).toHaveText(`${group} changed for this session. Browser storage is unavailable.`);
  }
});

for(const change of ['choice','device'])test(`live motion ${change} ends a delivery flight and keeps its notice`,async({page})=>{
  await start(page,supply(createGame(data),['drinks_2']));
  // Hold a real delivery flight so the preference change cannot race its normal finish.
  await page.evaluate(()=>{const original=Element.prototype.animate;Element.prototype.animate=function(...args){const animation=original.apply(this,args);if(this.classList.contains('deliver-flight'))animation.pause();return animation;};});
  await deliverButton(page,welcome).click();await expect(page.locator('.deliver-flight')).toHaveCount(1);
  if(change==='choice')await chooseMotion(page,'Reduced');else await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.deliver-flight')).toHaveCount(0);
  await expect(toast(page)).toHaveCount(1);await expect(toast(page)).toContainText(`Earned ${welcome.reward} coins.`);
  expect((await saved(page)).completedQuests).toEqual([welcome.id]);
});

test('the open Motion note follows a device preference change',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page);await options(page);
  const group=page.getByRole('group',{name:'Motion'});
  await expect(group).toContainText('System follows your device, which asks for less motion.');
  await group.getByRole('radio',{name:'System',exact:true}).focus();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(group).toContainText('System follows your device’s motion setting.');
  await expect(group.getByRole('radio',{name:'System',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(group.getByRole('radio',{name:'Reduced',exact:true})).toBeFocused();
  await expect(group.getByRole('radio',{name:'Reduced',exact:true})).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-motion','reduced');
});

test('Full motion does not replay an earlier reduced delivery',async({page})=>{
  await start(page,supply(createGame(data),['drinks_2']));await chooseMotion(page,'Reduced');
  await deliverButton(page,welcome).click();await expect(toast(page)).toHaveCount(1);
  await chooseMotion(page,'Full');
  await expect(toast(page)).toHaveCount(1);
  expect(await page.locator('#tickets,#coin-count,#toast-stack').evaluateAll(elements=>elements.flatMap(element=>element.getAnimations({subtree:true})).filter(animation=>animation.playState==='running').length)).toBe(0);
  await expect(page.locator('#tickets .ticket').first()).toBeVisible();
  await expect(toast(page)).toHaveCount(0,{timeout:10000});
});

test('a delayed painting decode does not start motion after Reduced is selected',async({page})=>{
  await start(page,checkpoint(13));await expect.poll(()=>painting(page)).not.toBe('');
  await page.evaluate(()=>{
    const original=HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode=function(){return original.call(this).then(()=>new Promise<void>(resolve=>document.addEventListener('release-painting',()=>resolve(),{once:true})));};
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(...args){if(this.classList.contains('room-painting'))document.documentElement.dataset.unwantedFade='';return animate.apply(this,args);};
  });
  await page.getByRole('button',{name:'Front room',exact:true}).click();await expect(page.locator('.room-painting.entering')).toHaveCount(1);
  await chooseMotion(page,'Reduced');
  await page.evaluate(()=>document.dispatchEvent(new Event('release-painting')));
  await expect(page.locator('#room-paintings .room-painting')).toHaveCount(1);
  await expect(page.locator('html')).not.toHaveAttribute('data-unwanted-fade');
});

test('Full motion plays the delivery flight on a device that asks for less motion, across reload and a new game',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,supply(createGame(data),['drinks_2']));
  await options(page);await expect(page.getByRole('group',{name:'Motion'})).toContainText('System follows your device, which asks for less motion.');
  await expect(page.getByRole('group',{name:'Motion'}).getByRole('radio',{name:'System'})).toBeChecked();await page.keyboard.press('Escape');
  expect(await buttonTransition(page)).toBe('0s');
  await chooseMotion(page,'Full');expect(await buttonTransition(page)).not.toBe('0s');
  await deliverButton(page,welcome).click();await expect(page.locator('.deliver-flight').first()).toBeAttached();
  await expect(toast(page)).toContainText(`Earned ${welcome.reward} coins.`);
  await page.reload();await opened(page);await expect(page.locator('html')).toHaveAttribute('data-motion','full');
  await options(page);await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await options(page);await expect(page.getByRole('group',{name:'Motion'}).getByRole('radio',{name:'Full'})).toBeChecked();
});

test('Reduced motion stills the delivery on a device that allows motion, and System follows the device again',async({page})=>{
  await start(page,supply(createGame(data),['drinks_2']));
  await options(page);await expect(page.getByRole('group',{name:'Motion'})).toContainText('System follows your device’s motion setting.');await page.keyboard.press('Escape');
  expect(await buttonTransition(page)).not.toBe('0s');
  await chooseMotion(page,'Reduced');expect(await page.evaluate(()=>localStorage.getItem('scary-snacks-motion'))).toBe('reduced');expect(await buttonTransition(page)).toBe('0s');
  await deliverButton(page,welcome).click();await expect(page.locator('.deliver-flight')).toHaveCount(0);await expect(toast(page)).toContainText(`Earned ${welcome.reward} coins.`);
  await chooseMotion(page,'System');expect(await buttonTransition(page)).not.toBe('0s');
  await page.emulateMedia({reducedMotion:'reduce'});expect(await buttonTransition(page)).toBe('0s');
});

test('delivering the selected item clears the selection',async({page})=>{
  const initial=supply(createGame(data),['drinks_2']),index=initial.board.findIndex(cell=>cell?.code==='drinks_2');
  await start(page,initial);await tile(page,index).click();await expect(tile(page,index)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#item-detail .detail-description')).toHaveText(`Mara and Sorin are waiting for one.`);
  await deliverButton(page,welcome).click();expect((await saved(page)).board[index]).toBeNull();
  await expect(page.locator('#board [aria-pressed="true"]')).toHaveCount(0);await expect(page.locator('#board .selected')).toHaveCount(0);
});

test('keyboard focus stays with the item actions and returns to the board',async({page})=>{
  await start(page);await tile(page,1).click();const take=page.getByRole('button',{name:'Take Flour',exact:true});await take.focus();await page.keyboard.press('Enter');
  expect((await saved(page)).board[2]?.code).toBe('bakery_1');await expect(take).toBeFocused();
  await tile(page,13).click();await page.getByRole('button',{name:'Clear selection',exact:true}).focus();await page.keyboard.press('Enter');
  expect((await saved(page)).board[13]?.code).toBe('bakery_1');await expect(tile(page,13)).toBeFocused();await expect(tile(page,13)).toHaveAttribute('aria-pressed','false');
});

test('one tap on an ingredient source takes one ingredient and selects the source; a drag only moves it',async({page})=>{
  await start(page);const items=async()=>(await saved(page)).board.filter(Boolean).length,before=await items();
  const source=tile(page,1);await expect(source).toHaveAttribute('aria-label',/Flour bin, source of Flour: tap to take an ingredient$/);
  await tile(page,1).click();expect(await items()).toBe(before+1);await expect(source).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Take Flour',exact:true})).toBeVisible();
  await tile(page,1).click();expect(await items()).toBe(before+2);
  // Enter on the focused source takes one too.
  await source.focus();await page.keyboard.press('Enter');expect(await items()).toBe(before+3);
  // A drag moves the source and takes nothing.
  const from=(await source.boundingBox())!,to=(await tile(page,39).boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();
  const moved=await saved(page);expect(moved.board[39]?.code).toBe('generator_bakery');expect(moved.board.filter(Boolean).length).toBe(before+3);
});

test('a source on a full board takes nothing and says why',async({page})=>{
  const state=createGame(data);state.board=state.board.map((cell,index)=>cell||data.board.layouts.find(layout=>layout.id===state.layoutId)!.obstacles.some(obstacle=>obstacle.position===index)?cell:{code:'bakery_1'});
  await start(page,state);
  const before=await saved(page);await tile(page,1).click();
  await expect(tile(page,1)).toHaveAttribute('aria-pressed','true');expect(await saved(page)).toEqual(before);
  await expect(page.locator('#status')).toHaveText('The board is full. Merge a pair or deliver a quest.');
});

test('with the story card on screen, the card alone carries Pay and Mara keeps her line',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await start(page,checkpoint(0,{ready:true}));
  await expect(page.locator('#offer')).toBeHidden();await expect(page.locator('.mara-line')).toBeVisible();
  const pay=page.getByRole('button',{name:/^Pay /});await expect(pay).toHaveCount(1);await expect(page.locator('#story').getByRole('button',{name:/^Pay /})).toBeVisible();
  await payAndRead(page);await revealed(page);const after=await saved(page);expect(after.decorations).toEqual(['task_1']);expect(after.coins).toBe(0);
  // Where the story card leaves the screen, Mara takes the offer over.
  await replaceSave(page,checkpoint(1,{ready:true}));
  await page.setViewportSize({width:390,height:844});await expect(page.locator('#offer').getByRole('button',{name:/^Pay /})).toBeVisible();
});

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'phone',width:390,height:844}])test(`keyboard navigation skips the replaced Mara line at ${viewport.name} and keeps status announcements`,async({page})=>{
  await page.setViewportSize(viewport);await start(page,checkpoint(0,{ready:true}));
  for(const mode of ['light','dark']){
    await appearance(page,mode);await unselect(page);await page.keyboard.press('Tab');
    await expect(viewport.name==='phone'?page.locator('#offer .pay-button'):page.locator('#hint-button')).toBeFocused();
    await tile(page,13).click();await page.keyboard.press('Tab');
    await expect(page.locator('#item-detail').getByRole('button',{name:'Clear selection',exact:true})).toBeFocused();
    await expect(page.locator('.mara-line').getByRole('status')).toContainText(/tap another to merge/i);
    await unselect(page);await page.keyboard.press('Tab');
    await expect(viewport.name==='phone'?page.locator('#offer .pay-button'):page.locator('#hint-button')).toBeFocused();
  }
  // Once the offer goes away, the visible hint returns to the keyboard path.
  await replaceSave(page,checkpoint(0));
  await unselect(page);await page.keyboard.press('Tab');await expect(page.locator('#hint-button')).toBeFocused();
});

test('Mara offers an affordable preparation with Pay on a phone; it pays once and reveals once',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page,checkpoint(0,{coins:10}));
  const offer=page.locator('#offer'),story=page.locator('#story-button');
  // Not affordable: Mara keeps her line, with no greyed button.
  await expect(offer).toBeHidden();await expect(page.locator('.mara-line')).toBeVisible();await expect(story).not.toHaveAttribute('data-ready');await expect(story).toHaveAccessibleName('Story');
  await replaceSave(page,checkpoint(0,{ready:true}));
  const pay=offer.getByRole('button',{name:`Pay ${data.tasks[0].cost} coins: ${data.tasks[0].title}`});
  await expect(offer).toBeVisible();await expect(offer).toContainText(data.tasks[0].title);await expect(pay).toBeVisible();expect((await pay.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(story).toHaveAttribute('data-ready','');await expect(story).toHaveAccessibleName('Story, a preparation is ready');
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
  await tile(page,13).click();await expect(offer).toBeHidden();await expect(page.locator('#item-detail')).toBeVisible();await unselect(page);await expect(offer).toBeVisible();
  await pay.click();const paid=await saved(page);expect(paid.decorations).toEqual(['task_1']);expect(paid.coins).toBe(0);expect(paid.pendingScenes).toEqual(['task_1']);
  const after={...paid,pendingScenes:[]};
  for(const label of ['Continue','Continue','See what changed'])await page.locator('.story-controls .primary-button',{hasText:label}).click();
  await revealed(page);await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-01');
  expect(await saved(page)).toEqual(after);await expect(offer).toBeHidden();await expect(story).not.toHaveAttribute('data-ready');await expect(story).toHaveAccessibleName('Story');
});

test('a second pointer during a drag leaves no ghost behind',async({page})=>{
  await start(page);const before=await saved(page);const from=(await tile(page,13).boundingBox())!;
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(from.x+from.width/2+40,from.y+from.height/2+40,{steps:4});
  await expect(page.locator('.drag-ghost')).toHaveCount(1);
  await tile(page,22).dispatchEvent('pointerdown',{pointerId:9,button:0});await expect(page.locator('.drag-ghost')).toHaveCount(0);
  await page.mouse.up();await expect(page.locator('.drag-ghost')).toHaveCount(0);expect(await saved(page)).toEqual(before);
});

test('a first visit is dark on a light device, and light, dark, and system themes persist with readable contrast at desktop and phone',async({page},testInfo)=>{
  await page.emulateMedia({colorScheme:'light'});await start(page);
  // With no stored choice, the page is dark, and the stylesheet is dark before the script sets the theme.
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  expect(await page.evaluate(()=>{document.documentElement.removeAttribute('data-theme');const value=getComputedStyle(document.documentElement).getPropertyValue('--page').trim();document.documentElement.dataset.theme='dark';return value;})).toBe('#1c1614');
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
        return{page:behind('body'),text:style('body').color,drawer:behind('.drawer'),status:style('#status').color,card:behind('.story-foot'),muted:style('.story-foot').color,ticket:behind('.deliver-button:disabled'),price:style('.deliver-button:disabled').color};
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

test('export, import, and reset keep portable new-game progress',async({page})=>{
  await start(page);await mergeStart(page);const before=await saved(page);await options(page);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();const download=await pending;const path=await download.path();expect(download.suggestedFilename()).toBe('scary-snacks-save.json');
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();expect(await saved(page)).toEqual(createGame(data));
  await options(page);await page.locator('input[type=file]').setInputFiles(path);await page.getByRole('button',{name:'Import this saved game'}).click();expect(await saved(page)).toEqual(before);
});

test('Options holds only the save, appearance, motion, sounds, the saved game, about, and a fresh start',async({page})=>{
  await start(page,checkpoint(12));await options(page);const dialog=page.getByRole('dialog',{name:'Options',exact:true});
  await expect(page.locator('[data-options]:visible')).toHaveAccessibleName('Options');await expect(page.locator('[data-options]:visible')).toContainText('Options');
  await expect(dialog.locator('.save-status').first()).toHaveText('Saved in this browser');
  await expect(dialog.locator('legend, h3')).toHaveText(['Appearance','Motion','Kitchen sounds','Your saved game','About Scary Snacks','A fresh start']);
  await expect(dialog.getByRole('button')).toHaveText(['','Turn sound on','Export saved game','Import saved game','Start a new game']);
  for(const name of ['Retry saved game','Retry save'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});await page.keyboard.press('Escape');
  await expect(page.locator('.phone-bar [data-options]')).toHaveAccessibleName('Options');await page.locator('.phone-bar [data-options]').click();await expect(dialog).toBeVisible();
  expect(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
});

test('a rejected sound start restores the toggle and permits a retry',async({page})=>{
  await page.addInitScript(()=>{
    const resume=AudioContext.prototype.resume;
    let attempts=0;
    AudioContext.prototype.resume=function(){
      return ++attempts===1?Promise.reject(new Error('Sound start failed')):resume.call(this);
    };
  });
  await start(page);await options(page);
  const toggle=page.getByRole('button',{name:'Turn sound on',exact:true});
  await toggle.click();
  await expect(page.locator('#status')).toHaveText('Sound is unavailable in this browser.');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await expect(page.getByRole('button',{name:'Turn sound off',exact:true})).toBeFocused();
});

test('a valid save from another tab restores play after load recovery',async({page,context})=>{
  await page.goto('./');await page.evaluate(key=>localStorage.setItem(key,'{broken'),KEY);await page.reload();
  await expect(page.getByRole('button',{name:'Retry saved game'})).toBeVisible();
  const other=await context.newPage();await other.goto('./');
  await other.evaluate(({key,text})=>localStorage.setItem(key,text),{key:KEY,text:serialize(checkpoint(9))});
  await expect(page.locator('#modal')).not.toBeVisible();await expect(page.locator('#status')).toContainText('another tab');
  const before=await saved(page);await page.locator('[data-cell="1"]').click();
  expect((await saved(page)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);await other.close();
});

test('corrupt saves remain intact and report recovery',async({page})=>{
  await page.addInitScript(key=>localStorage.setItem(key,'broken-save'),KEY);await start(page);await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.save-error')).toContainText('could not be loaded');expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe('broken-save');
});

for(const writer of ['this tab','another tab'] as const)test(`a corrupt live save from ${writer} blocks changes and offers saved-game recovery`,async({page,context})=>{
  await start(page,createGame(data));await mergeStart(page);
  const original=await page.evaluate(key=>localStorage.getItem(key)!,KEY);
  const before=await page.locator('#board button').evaluateAll(cells=>cells.map(cell=>cell.getAttribute('aria-label')));
  const other=writer==='another tab'?await context.newPage():null;
  try{
    if(other){
      await other.goto('./');await opened(other);
      await options(page);
      await page.evaluate(key=>window.addEventListener('storage',event=>{if(event.key===key)document.documentElement.dataset.liveSaveChanged='';},{once:true}),KEY);
    }
    await (other??page).evaluate(key=>localStorage.setItem(key,'broken-live-save'),KEY);
    if(other){
      // The storage event must expose recovery before the player tries another action.
      await expect(page.locator('html')).toHaveAttribute('data-live-save-changed','');
      await expect(page.getByRole('button',{name:'Retry saved game',exact:true})).toBeVisible();await page.keyboard.press('Escape');
    }
    await tile(page,1).click();
    await page.evaluate(key=>navigator.locks.request(key,()=>{}),KEY);
    expect(await page.locator('#board button').evaluateAll(cells=>cells.map(cell=>cell.getAttribute('aria-label')))).toEqual(before);
    expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe('broken-live-save');
    await options(page);await expect(page.getByRole('button',{name:'Retry saved game',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Retry save',exact:true})).toHaveCount(0);
    if(other){
      // Identical bytes must restore play even though this tab already observed them before corruption.
      await other.evaluate(({key,text})=>localStorage.setItem(key,text),{key:KEY,text:original});
      await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('#status')).toContainText('another tab');
      expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(original);
      expect(await page.locator('#board button').evaluateAll(cells=>cells.map(cell=>cell.getAttribute('aria-label')))).toEqual(before);
    }else{
      await page.getByRole('button',{name:'Start a new game',exact:true}).click();
      await page.getByRole('button',{name:'Erase and start again',exact:true}).click();
      await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(createGame(data));
    }
    const recovered=await saved(page);await tile(page,1).click();
    expect((await saved(page)).board.filter(Boolean)).toHaveLength(recovered.board.filter(Boolean).length+1);
    await options(page);await expect(page.getByRole('button',{name:'Retry saved game',exact:true})).toHaveCount(0);
  }finally{await other?.close();}
});

for(const preparations of [1,9,19,24])test(`a previous-format campaign at preparation ${preparations} stays untouched beside a new campaign`,async({page})=>{
  const oldKey='scary-snacks-save-v10';
  const old=JSON.stringify({format:'scary-snacks',version:10,state:{...checkpoint(preparations),version:11}});
  await page.addInitScript(({key,value})=>{
    if(!sessionStorage.getItem('previous-save-seeded')){
      localStorage.setItem(key,value);sessionStorage.setItem('previous-save-seeded','true');
    }
  },{key:oldKey,value:old});
  await start(page);
  expect(await saved(page)).toEqual(createGame(data));
  const previous=()=>page.evaluate(key=>localStorage.getItem(key),oldKey);
  expect(await previous()).toBe(old);
  await mergeStart(page);const progressed=await saved(page);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(progressed);expect(await previous()).toBe(old);
  await options(page);
  await page.locator('input[type=file]').setInputFiles({name:'previous-save.json',mimeType:'application/json',buffer:Buffer.from(old)});
  await expect(page.locator('#modal-title')).toHaveText('Cannot import this file');
  await expect(page.getByRole('dialog')).toContainText('a version this one cannot open');
  expect(await saved(page)).toEqual(progressed);expect(await previous()).toBe(old);
  await page.getByRole('button',{name:'Close dialog'}).click();await options(page);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();
  await page.getByRole('button',{name:'Erase and start again'}).click();
  expect(await saved(page)).toEqual(createGame(data));expect(await previous()).toBe(old);
});

test('only approved assets load from the active root or Pages prefix, and only the current room state downloads',async({page,request,baseURL})=>{
  const foreign: string[]=[],failures: string[]=[],errors: string[]=[],loaded: string[]=[];const base=new URL(baseURL!);
  page.on('request',r=>{const url=new URL(r.url());if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))foreign.push(r.url());});
  page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failures.push(r.url());else loaded.push(new URL(r.url()).pathname);});page.on('pageerror',e=>errors.push(e.message));
  await start(page);
  // The page loads the AVIF or WebP variants of every master it shows, never a PNG master.
  for(const id of ['front-room-00','timber-tabletop','embroidered-runner','menu-atlas','portraits','mascots','regulars-1'])await expect.poll(()=>loaded.some(path=>path.includes(`/assets/variants/${id}-`)),{message:id}).toBe(true);await expect(page).toHaveTitle('Scary Snacks');
  const rooms=()=>[...new Set(loaded.filter(path=>/\/assets\/variants\/(front-room|courtyard)-\d\d-/.test(path)).map(path=>path.match(/(front-room|courtyard)-\d\d/)![0]))];
  expect(rooms()).toEqual(['front-room-00']);
  await ticket(page,welcome).locator('.ticket-face').click();
  const sketch=page.locator('#modal .quest-sketch');
  expect(await sketch.evaluate(async node=>{await (node as HTMLImageElement).decode();return (node as HTMLImageElement).naturalWidth;})).toBe(768);
  for(const id of ['parchment-page','sketch-mara'])await expect.poll(()=>loaded.some(path=>path.includes(`/assets/variants/${id}-`))).toBe(true);
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:/The recipe book/}).click();await expect(page.locator('.recipe-item')).toHaveCount(30);await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Open the story journal',exact:true}).click();
  await expect(page.locator('.neighbour-introduction .visitor-portrait')).toHaveCount(3);
  await expect.poll(()=>loaded.some(path=>path.includes('/assets/variants/visitor-portraits-'))).toBe(true);
  await page.getByRole('button',{name:'Close dialog'}).click();
  const expedition=quest('adrian-first-pack');await replaceSave(page,onTicket(expedition));await ticket(page,expedition).locator('.ticket-face').click();
  expect(await sketch.evaluate(async node=>{const image=node as HTMLImageElement;await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([1024,683]);
  await expect.poll(()=>loaded.some(path=>path.includes('/assets/variants/scene-cathedral-1-1024x683.webp'))).toBe(true);
  await page.getByRole('button',{name:'Close dialog'}).click();
  // The completed save opens on the front room with its selected decorations. The courtyard loads only when the player opens it.
  const decorated=checkpoint(24);decorated.decorationChoices={tableware:'green',textiles:'blue',flowers:'lilacs'};
  loaded.length=0;await replaceSave(page,decorated);
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

test('a phone ticket with two dishes is one 44px target, and each dish row of its quest opens its help and returns',async({page})=>{
  const sorin=quest('sorin-first-ride');expect(sorin.requirements).toHaveLength(2);
  await page.setViewportSize({width:360,height:740});await start(page);
  const dishes=ticket(page,sorin).locator('.ticket-face');await expect(dishes.locator('.ticket-item')).toHaveCount(2);
  const box=(await dishes.boundingBox())!;expect(Math.min(box.width,box.height)).toBeGreaterThanOrEqual(44);
  await expect(dishes).toHaveAccessibleName(`${sorin.title}: ${sorin.requirements.map(({item,quantity})=>`${quantity} ${data.items[item].name}, 0 on the board`).join('; ')}`);
  for(const card of await page.locator('#tickets .ticket').all())for(const target of await card.getByRole('button').all())expect((await target.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await dishes.click();const dialog=page.getByRole('dialog',{name:sorin.title,exact:true});await expect(dialog).toBeVisible();
  for(const line of sorin.opening)await expect(dialog).toContainText(line.text);
  await expect(dialog.locator('.quest-reward')).toHaveText(`Reward: ${sorin.reward} coins`);await expect(dialog.locator('.quest-deliver')).toBeDisabled();
  await expect(dialog.locator('.quest-item')).toHaveCount(2);
  for(const [index,{item,quantity}] of sorin.requirements.entries()){
    const row=dialog.locator('.quest-item').nth(index);await expect(row).toHaveAccessibleName(`${quantity} ${data.items[item].name}: 0 of ${quantity} on the board`);
    await expect(row.locator('.quest-count')).toHaveText(`0 / ${quantity} on board`);
    await row.click();await expect(page.getByRole('dialog',{name:data.items[item].name,exact:true})).toBeVisible();await expect(page.locator('#modal .item-how')).toBeVisible();
    // Close returns to the quest with the row's place.
    await page.getByRole('button',{name:'Close dialog'}).click();await expect(dialog).toBeVisible();await expect(dialog.locator('.quest-item')).toHaveCount(2);
  }
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();
  await page.setViewportSize({width:1440,height:900});await expect(ticket(page,sorin).locator('.ticket-count').first()).toHaveText(`0/${sorin.requirements[0].quantity}`);
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
  for(const deliver of await page.locator('#tickets .deliver-button').all())expect((await deliver.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect((await box('[data-cell="0"]')).width).toBeGreaterThanOrEqual(44);
  await unselect(page);await expect(page.locator('.mara-line')).toBeVisible();await expect(page.locator('#item-detail')).toBeHidden();
  await tile(page,14).click();await expect(page.locator('#item-detail')).toBeVisible();expect((await box('.mara-line')).width).toBeLessThanOrEqual(1);
  await unselect(page);await expect(page.locator('.mara-line')).toBeVisible();
  const sheet=page.getByRole('dialog');
  await page.locator('#story-button').click();await expect(sheet).toBeVisible();
  await sheet.locator('.miez-card').click();await expect(sheet.locator('.cat-sleeping')).toBeVisible();
});

test('desktop first screen shows the uncovered room beside the tickets, the whole board, Mara, the story and the recipe book',async({page},testInfo)=>{
  for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);await start(page);await expect(page.locator('#tickets .ticket')).toHaveCount(3);
    const room=(await page.locator('#room-stage').boundingBox())!;expect([room.x,room.y,room.height]).toEqual([0,0,viewport.height]);expect(room.width).toBeGreaterThanOrEqual(viewport.width*.5-1);
    for(const selector of ['.masthead','#drawer']){const box=(await page.locator(selector).boundingBox())!;expect(box.x,`${selector} beside the room`).toBeGreaterThanOrEqual(room.x+room.width);}
    const first=['.tickets','#board','.mara-line','#story','#collection-button'];
    for(const selector of first){const box=(await page.locator(selector).boundingBox())!;expect(box.y+box.height,`${selector} at ${viewport.width}`).toBeLessThanOrEqual(viewport.height);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await tile(page,0).boundingBox())!.width).toBeGreaterThanOrEqual(44);
    await page.screenshot({path:testInfo.outputPath(`desktop-first-screen-${viewport.width}.png`)});
  }
  await page.setViewportSize({width:1440,height:900});
  await tile(page,13).click();await expect(page.locator('#item-detail')).toBeVisible();await expect(page.locator('#item-detail')).toContainText('Flour');
  await page.getByRole('button',{name:'Clear selection'}).click();await expect(page.locator('#board [aria-pressed="true"]')).toHaveCount(0);await expect(page.locator('#item-detail')).toBeHidden();
  await page.locator('#cat-button').click();await expect(page.locator('#cat-button .cat-sleeping')).toBeVisible();await expect(page.locator('#drawer-handle')).toBeHidden();
  // The runner repeats only the seamless part of its bitmap.
  await expect(page.locator('#runner-repeat image')).toHaveAttribute('x','-161');await expect(page.locator('#runner-repeat')).toHaveAttribute('width','503');
});

test('coins keep clear of the wordmark on narrow phones',async({page})=>{
  await page.setViewportSize({width:320,height:740});await start(page);
  for(const [coins,shown] of [[999,'999'],[123456,'123.4K'],[1234567,'1.2M']] as const){
    await page.evaluate(([key,coins])=>{const save=JSON.parse(localStorage.getItem(key)!);save.state.coins=coins;localStorage.setItem(key,JSON.stringify(save));},[KEY,coins] as const);
    await page.setViewportSize({width:320,height:740});await start(page);
    for(const width of [320,360]){
      await page.setViewportSize({width,height:740});
      await expect(page.locator('#coins')).toHaveText(shown);await expect(page.locator('#coin-total')).toHaveText(`${coins.toLocaleString('en')} coins`);
      const word=(await page.locator('.wordmark span:last-child').boundingBox())!;const coin=(await page.locator('.coin-count .coin').boundingBox())!;
      expect(coin.x-(word.x+word.width)).toBeGreaterThanOrEqual(12);
    }
  }
});

// The game formats numbers in the page language, so another browser locale cannot widen the coin total.
test('a Romanian browser locale keeps the short English coin total',async({browser,baseURL})=>{
  const context=await browser.newContext({locale:'ro-RO',baseURL,viewport:{width:320,height:740}});const page=await context.newPage();await start(page);
  await page.evaluate(key=>{const save=JSON.parse(localStorage.getItem(key)!);save.state.coins=123456;localStorage.setItem(key,JSON.stringify(save));},KEY);
  await start(page);await expect(page.locator('#coins')).toHaveText('123.4K');await context.close();
});

test('the board is one tab stop that the arrow keys, Home, and End move through',async({page})=>{
  await start(page);await expect(page.locator('#board [tabindex="0"]')).toHaveCount(1);
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');await expect(tile(page,0)).toBeFocused();
  await page.keyboard.press('End');await expect(tile(page,5)).toBeFocused();
  await page.keyboard.press('ArrowDown');await expect(tile(page,11)).toBeFocused();
  await page.keyboard.press('Home');await expect(tile(page,6)).toBeFocused();
  await page.keyboard.press('Control+End');await expect(tile(page,41)).toBeFocused();await expect(page.locator('#board [tabindex="0"]')).toHaveCount(1);
  // Tab leaves the board in one step, and Shift+Tab comes back to the same space.
  await page.keyboard.press('Tab');expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('#board')))).toBe(false);
  await page.keyboard.press('Shift+Tab');await expect(tile(page,41)).toBeFocused();
  // Escape clears a selection and Mara names the move gesture again.
  await tile(page,13).focus();await page.keyboard.press('Enter');await expect(tile(page,13)).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');await expect(page.locator('#board [aria-pressed="true"]')).toHaveCount(0);await expect(page.locator('#status')).toHaveText('Tap an item, then tap where it should go.');
  // Sources say what they are, and their badge is drawn, not typed.
  await expect(page.locator('#board [aria-label*="source of"]').first()).toBeVisible();await expect(page.locator('#board .source-mark').first()).toBeVisible();
  expect(await page.locator('#board').evaluate(e=>e.textContent)).toBe('');
});

test('dialogs hold focus on the safe choice, on the title, and on the story buttons',async({page})=>{
  await start(page);await mergeStart(page);
  await options(page);
  for(const option of await page.locator('.choice').all())expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();const keep=page.getByRole('button',{name:'Keep this game'});await expect(keep).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#modal-title')).toHaveText('Options');await expect(page.locator('#modal-title')).toBeFocused();expect((await saved(page)).board[14]?.code).toBe('bakery_2');
  const sound=page.getByRole('button',{name:'Turn sound on'});await sound.focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Turn sound off'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();
  await replaceSave(page,checkpoint(0,{ready:true}));
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
  await expect(second.locator('#status')).toContainText('another tab');await expect(tile(second,13)).toHaveAttribute('aria-label',/: empty$/);
  const source=(await saved(second)).board.findIndex(cell=>cell?.code.startsWith('generator_'));await tile(second,source).click();await tile(second,source).click();
  const state=await saved(second);expect(state.board[14]?.code).toBe('bakery_2');expect(state.board.filter(cell=>cell?.code==='bakery_1')).toHaveLength(2);
  await second.getByRole('button',{name:/The recipe book/}).click();await expect(second.getByRole('dialog')).toBeVisible();
  await tile(first,source).click();await tile(first,source).click();await expect(second.getByRole('dialog')).toBeHidden();
  // Each take is its own save, so wait for the second tab to show both before the drag measures a cell.
  const settled=await saved(first);
  await expect(second.locator('#board .cell:not(.empty):not(.obstacle)')).toHaveCount(settled.board.filter(Boolean).length);
  const box=(await tile(second,14).boundingBox())!;await second.mouse.move(box.x+box.width/2,box.y+box.height/2);await second.mouse.down();await second.mouse.move(box.x+box.width/2+30,box.y+box.height/2+30,{steps:3});
  await expect(second.locator('.drag-ghost')).toHaveCount(1);await tile(first,source).click();await expect(second.locator('.drag-ghost')).toHaveCount(0);await second.mouse.up();
});

test('a kitchen that cannot load offers to try again',async({page})=>{
  let fail=true;await page.route('**/data/game.json',route=>fail?route.fulfill({status:503,body:''}):route.continue());
  await page.goto('./');await expect(page.locator('#status')).toContainText('The kitchen could not open.');
  for(const opener of await page.locator('#story-button,#recipes-button,#collection-button,[data-options]').all())await expect(opener).toBeDisabled();
  fail=false;await page.getByRole('button',{name:'Try again'}).click();await opened(page);
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
  for(const opener of await page.locator('#story-button,#recipes-button,#collection-button,[data-options]').all())await expect(opener).toBeDisabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(()=>(window as Window & {saveAccess?: string[]}).saveAccess)).toEqual([]);
  expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(before);
  fail=false;await page.getByRole('button',{name:'Try again'}).click();await opened(page);
  expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe(before);
  expect(errors).toEqual([]);
});

test('blocked browser storage keeps the game playable for the visit and says that it is not saved',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
  await start(page);await expect(page.getByRole('dialog',{name:'Options',exact:true})).toBeVisible();
  await expect(page.getByRole('dialog').locator('.save-status').first()).toContainText('blocks storage');
  for(const name of ['Retry saved game','Retry save'])await expect(page.getByRole('button',{name,exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Close dialog'}).click();
  await tile(page,13).click();await tile(page,14).click();
  await expect(tile(page,14)).toHaveAttribute('aria-label',new RegExp(data.items.bakery_2.name));
  await expect(page.locator('.save-status').first()).toContainText('lasts only for this visit');
});

test('narrow phones keep the whole dish name in the strip, and short screens keep the board clear of the bar',async({page})=>{
  const state=createGame(data);
  const longest=Object.keys(data.items).sort((a,b)=>data.items[b].name.length-data.items[a].name.length)[0];const at=firstFreeBoardCell(state,data);state.board[at]={code:longest};state.discovered.push(longest);
  await page.addInitScript(([key,save])=>localStorage.setItem(key,save),[KEY,serialize(state)]);
  for(const width of [320,360,390]){
    await page.setViewportSize({width,height:740});await start(page);await tile(page,at).click();
    const name=page.locator('#item-detail h3');await expect(name).toHaveText(data.items[longest].name);
    expect(await name.evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)).toBe(true);
    // A two-line name leaves no room for the rule line, and Mara's note leaves the name to the strip.
    const wraps=await name.evaluate(e=>e.clientHeight>parseFloat(getComputedStyle(e).lineHeight)*1.5);
    if(width<=360||wraps)await expect(page.locator('#item-detail .detail-next')).toBeHidden();
    else await expect(page.locator('#item-detail .detail-next')).toBeVisible();
    await expect(page.locator('#status')).toHaveText('Tap another to merge, or an empty space to move it.');
    expect((await page.locator('#item-detail').boundingBox())!.y+(await page.locator('#item-detail').boundingBox())!.height).toBeLessThanOrEqual((await page.locator('.phone-bar').boundingBox())!.y+1);
    // Cells never drop below 44px, within half a pixel of rounding.
    expect((await tile(page,0).boundingBox())!.width).toBeGreaterThanOrEqual(43.5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  // Down to 740px tall the room gives up height, so the board and Mara's line still fit above the bar without scrolling.
  await page.setViewportSize({width:390,height:740});await start(page);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  expect((await page.locator('#drawer').boundingBox())!.y).toBeGreaterThan(48+100);
  // A new game on a short phone: the shorter opening line fits the line under the board.
  await page.addInitScript(key=>localStorage.removeItem(key),KEY);
  for(const width of [320,390]){
    await page.setViewportSize({width,height:740});await start(page);await expect(page.locator('#status')).toHaveText(/^Merge the two Flours\./);
    const words=await page.locator('#status').evaluate(e=>{const range=document.createRange();range.selectNodeContents(e);return range.getBoundingClientRect().bottom;});
    expect(words).toBeLessThanOrEqual((await page.locator('.phone-bar').boundingBox())!.y);
  }
  await page.setViewportSize({width:667,height:375});await start(page);
  for(const selector of ['#drawer','.phone-bar'])expect(await page.locator(selector).evaluate(e=>getComputedStyle(e).position)).toBe('static');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('forced colours keep the spaces, the selection, the tickets and the area switch visible',async({page})=>{
  await page.emulateMedia({forcedColors:'active'});await start(page);await tile(page,13).click();
  expect(await tile(page,13).evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
  for(const selector of ['[data-cell="20"]','#tickets .ticket','.area-choice'])expect(await page.locator(selector).first().evaluate(e=>getComputedStyle(e).borderTopStyle),selector).toBe('solid');
});

test('the checked appearance carries a 3:1 ring in both themes, and a story has no Back on its first line',async({page})=>{
  await start(page);
  for(const mode of ['light','dark']){
    await appearance(page,mode);await options(page);
    const colors=await page.evaluate(()=>({ring:getComputedStyle(document.querySelector('.choice:has(input:checked)')!).boxShadow.match(/rgba?\([^)]*\)/)![0],track:getComputedStyle(document.querySelector('.choice-group')!).backgroundColor}));
    expect(ratio(colors.ring,colors.track)).toBeGreaterThanOrEqual(3);await page.keyboard.press('Escape');
  }
  await replaceSave(page,checkpoint(0,{ready:true}));
  await page.locator('#story').getByRole('button',{name:/^Pay /}).click();await expect(page.locator('.story-controls .secondary-button')).toBeHidden();
  await page.keyboard.press('Enter');await expect(page.locator('.story-controls .secondary-button')).toBeVisible();
});

test('the skip link lands on the board without scrolling the header away',async({page})=>{
  await start(page);await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
  await expect(tile(page,0)).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(0);
});

test('keyboard Deliver pays with a toast, and focus moves to the quest that takes the ticket',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,supply(createGame(data),['drinks_2']));
  const deliver=deliverButton(page,welcome);await deliver.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#modal')).toBeHidden();await expect(toast(page)).toHaveText(`${welcome.title}: delivered. Earned ${welcome.reward} coins.`);
  await expect(page.locator('#tickets .ticket').first().locator('.ticket-face')).toBeFocused();await expect(page.locator('#tickets .ticket').first()).toBeVisible();
  await expect(page.locator('#story .story-waiting')).toContainText(`Mara replied to “${welcome.title}”.`);
});

test('phone recipe guidance selects a dish on the board while another item is selected',async({page})=>{
  await page.setViewportSize({width:390,height:844});await start(page);await mergeStart(page);
  await tile(page,22).click();await expect(page.locator('#item-detail')).toBeVisible();
  await page.getByRole('button',{name:/^Recipes/}).click();await page.getByRole('button',{name:'Dough',exact:true}).click();
  await page.getByRole('button',{name:'Show me on the board'}).click();
  await expect(page.locator('#status')).toContainText('Dough is ready on the board');await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#board .selected')).toHaveAttribute('aria-label',/Dough/);
});

test('starting a new game clears the previous game discovery notification',async({page})=>{
  const {state,first,second}=beforeNewDish(),{known,total}=dishCount();
  await start(page,state);await tile(page,first).click();await tile(page,second).click();await expect(page.locator('#collection-button')).toHaveAttribute('data-fresh','');
  await options(page);await page.getByRole('button',{name:'Start a new game',exact:true}).click();
  await page.getByRole('button',{name:'Erase and start again'}).click();
  await expect(page.locator('#collection-button')).not.toHaveAttribute('data-fresh','');await expect(page.locator('#discovery-count')).toHaveText(`${known} of ${total} dishes discovered`);
});

test('a delayed storage event cannot let a stale action overwrite another tab',async({context})=>{
  const first=await context.newPage();await start(first,createGame(data));const second=await context.newPage();
  await second.addInitScript(()=>window.addEventListener('storage',event=>event.stopImmediatePropagation(),true));await start(second);
  await mergeStart(first);const newer=await saved(first);
  await expect(tile(second,14)).toHaveAttribute('aria-label',/: Flour$/);
  // The first tap finds the newer progress and is cancelled, so it takes nothing.
  await tile(second,1).click();
  await expect(second.locator('#status')).toContainText('another tab');expect(await saved(second)).toEqual(newer);
  await expect(tile(second,14)).toHaveAttribute('aria-label',/: Dough$/);
  // The next deliberate action applies to the updated board.
  await tile(second,1).click();await tile(second,1).click();const after=await saved(second);expect(after.board[14]?.code).toBe('bakery_2');expect(after.board[2]?.code).toBe('bakery_1');
});

test('game writes wait for the shared save lock and recheck progress before changing it',async({context})=>{
  const first=await context.newPage();await start(first);const second=await context.newPage();await start(second);
  await tile(first,1).click();await tile(second,1).click();const before=await saved(first);
  await first.evaluate(key=>{void navigator.locks.request(key,()=>new Promise<void>(resolve=>{
    document.documentElement.dataset.saveLocked='true';window.addEventListener('release-save-lock',()=>resolve(),{once:true});
  }));},KEY);
  await expect(first.locator('html')).toHaveAttribute('data-save-locked','true');
  await tile(first,1).click();await tile(second,1).click();expect(await saved(first,false)).toEqual(before);
  await first.evaluate(()=>window.dispatchEvent(new Event('release-save-lock')));
  await expect.poll(async()=> (await saved(first)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);
  await expect(second.locator('#status')).toContainText('another tab');
  expect((await saved(second)).board.filter(Boolean)).toHaveLength(before.board.filter(Boolean).length+1);
});

test('two queued Pay activations cannot pay for a preparation that was not shown',async({page})=>{
  const state: GameState=checkpoint(0,{ready:true});state.coins=1000;
  await page.addInitScript(([key,value])=>localStorage.setItem(key,value),[KEY,serialize(state)]);await start(page);
  await page.evaluate(key=>{void navigator.locks.request(key,()=>new Promise<void>(resolve=>{
    document.documentElement.dataset.saveLocked='true';window.addEventListener('release-save-lock',()=>resolve(),{once:true});
  }));},KEY);
  await expect(page.locator('html')).toHaveAttribute('data-save-locked','true');
  const pay=page.locator('#story').getByRole('button',{name:/^Pay /});await pay.click();await pay.click();
  await page.evaluate(()=>window.dispatchEvent(new Event('release-save-lock')));
  const after=await saved(page);expect(after.taskIndex).toBe(1);expect(after.coins).toBe(1000-data.tasks[0].cost);
  await expect(page.locator('#modal-title')).toHaveText(data.tasks[0].title);
});

test('the journal lists the regulars who have arrived and keeps later ones as outlines',async({page})=>{
  await start(page,checkpoint(8));await journal(page);
  const arrived=data.characters.filter(person=>person.regular&&(!person.arrivesAfter||data.tasks.findIndex(task=>task.id===person.arrivesAfter)<8));
  for(const person of arrived)await expect(page.getByRole('button',{name:`Meet ${person.name}`,exact:true})).toBeVisible();
  await expect(page.locator('.neighbour-entry.not-yet')).toHaveCount(data.characters.filter(person=>person.regular).length-arrived.length);
});
