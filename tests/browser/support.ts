// Shared fixtures for the browser specs: saves made by the rules, and the controls that the specs use most.
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { eveningOpen, firstFreeBoardCell, levers, playable, prologueQuests, resolveQuests, supperQuest } from '../../src/model.ts';
import { actOneStart, checkpointState, deliverRequired, moveTo } from '../../tools/create-checkpoint-saves.ts';
import { runPrologue } from '../../tools/campaign-balance.ts';
import { createGame, reduceGame, revealTickets, validateGame } from '../../src/engine.ts';
import type { Action, GameData, GameState, Quest } from '../../src/model.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

export const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
export const KEY=SAVE_KEY;
export const validate=(candidate: unknown)=>validateGame(candidate,data);
export const serialize=(state: GameState)=>exportSave(state,validate);
export function act(state: GameState,action: Action){const result=reduceGame(state,action,data);expect(result.ok,result.message).toBe(true);return result.state;}
/** The prologue quests, which an act 1 save lists first among its delivered quests. */
export const prologueServed=prologueQuests(data).map(value=>value.id);
/** The number of preparations of act 1. Its last one is the last payment before the supper. */
export const actOneTasks=data.tasks.filter(task=>data.chapters[task.chapter-1].act===1).length;
export const quest=(id: string)=>data.quests.find(value=>value.id===id)!;
export const recovery=data.quests.find(value=>value.recovery)!,supper=supperQuest(data)!;
export const person=(id: string)=>data.characters.find(value=>value.id===id)!;
export const stateText=(id: string)=>data.rooms.find(state=>state.id===id)!.text;
/** Delivers each March quest of Dochia that opened, so it holds no ticket. A delivery in March can open the next one. */
export function deliverMarch(state: GameState){
  for(let open=state.march.filter(id=>!state.completedQuests.includes(id));open.length;open=state.march.filter(id=>!state.completedQuests.includes(id))){
    state.completedQuests.push(...open);moveTo(state,state.clock.day,data);
  }
}
/**
 * The game after count preparations, each paid with exactly its cost after its quests on the earliest day that permits them, and every
 * scene read. Ready also delivers the quests of the next preparation and sets the coins to its cost; otherwise the coins are as given.
 * The March quests that opened are delivered unless march is false.
 */
export function checkpoint(count: number,{ready=false,coins=0,march=true}: {ready?: boolean; coins?: number; march?: boolean}={}){
  const state=count?checkpointState(data,count-1):actOneStart(data);
  if(count){deliverRequired(state,data);state.coins=data.tasks[count-1].cost;Object.assign(state,act(state,{type:'task'}));}
  state.pendingScenes=[];state.coins=coins;
  if(ready&&count<data.tasks.length){deliverRequired(state,data);state.coins=data.tasks[count].cost;}
  if(march)deliverMarch(state);
  // Marking quests delivered moves the tickets on; the quests that now hold one put their dishes in the recipe book.
  revealTickets(state,data);
  expect(validate(state)).toBe(true);return state;
}
/** The earliest checkpoint at which this quest is on a ticket: the open quests before it are delivered. */
export function onTicket(target: Quest){
  for(let count=0;count<=data.tasks.length;count++){
    const state=checkpoint(count,{march:!target.march});
    // The recovery quest is never recorded as delivered, and it never holds a quest ticket.
    // A dated quest is delivered on its date, so the day moves to it.
    for(const earlier of data.quests.slice(0,data.quests.indexOf(target)).filter(value=>!value.recovery)){
      // A quest that waits only for its opening date opens when the day moves to it.
      if(earlier.opens&&state.clock.day<earlier.opens&&playable(earlier,data)&&!earlier.march&&resolveQuests(state,data).find(value=>value.quest===earlier)!.status==='locked')moveTo(state,earlier.opens,data);
      const view=resolveQuests(state,data).find(value=>value.quest.id===earlier.id)!;
      if(view.status!=='active'&&view.status!=='waiting')continue;
      moveTo(state,Math.max(state.clock.day,earlier.opens??1,data.calendar.holidays.find(holiday=>holiday.id===earlier.holiday)?.day??1),data);
      state.completedQuests.push(earlier.id);
    }
    if(target.opens&&state.clock.day<target.opens&&playable(target,data)&&!target.march&&resolveQuests(state,data).find(value=>value.quest===target)!.status==='locked')moveTo(state,target.opens,data);
    revealTickets(state,data);
    if(resolveQuests(state,data).find(value=>value.quest.id===target.id)!.status==='active'){expect(validate(state)).toBe(true);return state;}
  }
  throw new Error(`${target.id} never reaches a ticket.`);
}
export const supplies=(value: Quest)=>value.requirements.flatMap(({item,quantity})=>Array<string>(quantity).fill(item));
/** A copy at 20:00 on 1 May, the evening of the supper, so Serve works when the plates are on the board. */
export function supperEvening(state: GameState): GameState{
  const next=structuredClone(state);moveTo(next,data.calendar.supper,data);
  next.clock.merges=(data.acts[0].day.booking-data.acts[0].day.opening)/data.acts[0].day.mergeMinutes;return next;
}
/** A copy in which a booked quest has this evening at the booking time, so Deliver serves it. The day tests cover the choice of the evening. */
export function atBookingTime(state: GameState,value: Quest): GameState{
  if(!value.booked)return state;
  // A Sunday and Saint George's Eve have no evening guest, so the booking waits for the next evening.
  const next=structuredClone(state);if(value.evening!==undefined)moveTo(next,value.evening,data);
  while(!eveningOpen(next.clock.day,data))moveTo(next,next.clock.day+1,data);
  const {booking,opening,mergeMinutes}=levers(next.clock.day,data);
  return {...next,evening:{...next.evening,guest:value.character,delivered:false},clock:{...next.clock,merges:(booking-opening)/mergeMinutes}};
}
/** The new game that the page saved: a new game with the seed that the page drew. */
export async function newGame(page: Page){return createGame(data,(await saved(page)).seed);}
/** The line of a take or merge that makes this dish: a dish that a ticket already put in the recipe book is not new. */
export const madeLine=(state: GameState,code: string)=>state.discovered.includes(code)?`Made ${data.items[code].name}.`:`${data.items[code].name} is a new dish! It is in the recipe book now.`;
/** Puts dishes in the recipe book of a hand-made state. A ticket may have put a dish there already. */
export function know(state: GameState,...codes: string[]){for(const code of codes)if(!state.discovered.includes(code))state.discovered.push(code);}
/** Adds known dishes to the first free spaces. The rules tests cover how the player makes them. */
export function supply(state: GameState,codes: string[]){
  const next=structuredClone(state);
  for(const code of codes){
    const index=firstFreeBoardCell(next,data);expect(index).toBeGreaterThanOrEqual(0);next.board[index]={code};
    if(!next.discovered.includes(code))next.discovered.push(code);
  }
  expect(validate(next)).toBe(true);return next;
}
/** The quest on its ticket with every dish on the board. */
export const deliverable=(value: Quest)=>atBookingTime(supply(onTicket(value),supplies(value)),value);

export async function opened(page: Page){await expect(page.locator('#board button')).toHaveCount(42);}
/** The start of act 1 after a legal run of the prologue. Without a seed, it has the seed of the test fixtures. */
export const actOne=(seed=1)=>actOneStart(data,seed);
/**
 * Opens the game, at the start of act 1 unless a save is given. Only the first load gets the save, so a reload shows what the game
 * itself saved. A new game starts with the prologue: startNewGame opens one.
 */
export async function start(page: Page,save: GameState|string=actOne(),theme?: string){
  await page.addInitScript(({key,value,theme})=>{
    if(value!==null&&localStorage.getItem(key)===null)localStorage.setItem(key,value);
    if(theme)localStorage.setItem('scary-snacks-theme',theme);
  },{key:KEY,value:typeof save==='string'?save:serialize(save),theme:theme??''});
  await page.goto('./');await opened(page);
}
/**
 * The prologue by legal play at the start of an event: with its scenes read, or with the scenes of the event change still pending.
 * Event 7 can also wait for its last scene, when each of its quests is served.
 */
export function prologueAt(event: number,{read=true,served=false}: {read?: boolean; served?: boolean}={}){
  return runPrologue(data,1,false,state=>state.prologue?.event===event&&(served?resolveQuests(state,data).every(view=>view.status!=='active'):!resolveQuests(state,data).some(view=>view.status==='complete'&&view.quest.id.startsWith(`prologue-${event}-`))&&(!read||!state.pendingScenes.length))).state;
}
/** Opens a new game: the prologue starts, and its first scene opens at once. */
export async function startNewGame(page: Page,theme?: string){
  if(theme)await page.addInitScript(value=>localStorage.setItem('scary-snacks-theme',value),theme);
  await page.goto('./');await opened(page);
}
/** Starts the game with reduced motion in the light theme, so that no animation delays the checks. */
export async function startStill(page: Page,save?: GameState|string,theme='light'){await page.emulateMedia({reducedMotion:'reduce'});await start(page,save,theme);}
/** The width and height of a loaded image element. */
export const naturalSize=(image: Locator)=>image.evaluate(async node=>{const value=node as HTMLImageElement;await value.decode();return [value.naturalWidth,value.naturalHeight];});
/** Decodes the picture of each svg image that the locator finds, and gives the natural size of each. */
export const svgImageSizes=(images: Locator)=>images.evaluateAll(elements=>Promise.all(elements.map(async element=>{const image=new Image();image.src=element.getAttribute('href')!;await image.decode();return [image.naturalWidth,image.naturalHeight];})));
/** Reads the save after queued game writes finish. Lock tests can read the snapshot while a write is blocked. */
export async function saved(page: Page,waitForWrites=true): Promise<GameState>{return page.evaluate(async({key,waitForWrites})=>{
  const read=()=>JSON.parse(localStorage.getItem(key)!).state;
  return waitForWrites?navigator.locks.request(key,read):read();
},{key:KEY,waitForWrites});}
export async function replaceSave(page: Page,save: GameState|string){
  await page.evaluate(([key,value])=>{localStorage.setItem(key,value);localStorage.removeItem('scary-snacks-area');},[KEY,typeof save==='string'?save:serialize(save)]);
  await page.reload();await opened(page);
}
export const tile=(page: Page,index: number)=>page.locator(`[data-cell="${index}"]`);
export async function unselect(page: Page){await tile(page,0).focus();await page.keyboard.press('Escape');}
/** Merges the two Flours of a new game, at 13 and 14, into the Dough at 14, and checks that the merge saved. */
export async function mergeFlour(page: Page){await tile(page,13).click();await tile(page,14).click();expect((await saved(page)).board[14]?.code).toBe('grain_2');}
/** Closes each open dialog with Escape. */
export async function dismissDialogs(page: Page){while(await page.locator('#modal').isVisible())await page.keyboard.press('Escape');}
export const ticket=(page: Page,value: Quest)=>page.locator(`#tickets .ticket[data-quest="${value.id}"]`);
export const deliverButton=(page: Page,value: Quest)=>ticket(page,value).locator('.deliver-button');
/** The words of the toast that reports a delivery. It clears itself, so a test that needs the next one waits for this one to go first. */
export const toast=(page: Page)=>page.locator('.toast-text');
/** The Deliver control inside the open quest dialog. */
export const dialogDeliver=(page: Page,value: Quest)=>page.getByRole('dialog',{name:value.title,exact:true}).getByRole('button',{name:`Deliver ${value.title} for ${value.reward.toLocaleString('en')} coins`,exact:true});
/** Opens the quest dialog from the dishes on the ticket. */
export async function openQuest(page: Page,value: Quest){
  await ticket(page,value).locator('.ticket-face').click();await expect(page.getByRole('dialog',{name:value.title,exact:true})).toBeVisible();
}
/** A missing requirement of the next preparation on the Story card. */
export const goal=(page: Page,kind: string)=>page.locator(`#story .preparation-requirements [data-requirement="${kind}"]`);
/** The Pay control of the Story card. */
export const pay=(page: Page)=>page.locator('#story').getByRole('button',{name:/^Pay /});
/** The one completion action of the open scene. */
export const forward=(page: Page)=>page.locator('.story-controls .primary-button');
export async function story(page: Page){if(!await page.locator('#story').isVisible())await page.locator('#story-button').click();}
/** Opens the journal, and optionally opens named groups for archive or character checks. */
export async function journal(page: Page,groups: string[] = []){
  if(!await page.getByRole('button',{name:'Open the story journal',exact:true}).isVisible())await page.locator('#story-button').click();
  await page.getByRole('button',{name:'Open the story journal',exact:true}).click();
  for(const id of groups){const group=page.locator(`.journal-group[data-group="${id}"]`);if(await group.count())await group.locator('summary').click();}
}
export async function options(page: Page){await page.locator('[data-options]:visible').first().click();await expect(page.locator('#modal-title')).toHaveText('Options');}
export async function appearance(page: Page,mode: string){
  await options(page);await page.getByRole('group',{name:'Appearance'}).getByRole('radio',{name:mode[0].toUpperCase()+mode.slice(1),exact:true}).check();await page.getByRole('button',{name:'Close dialog'}).click();
}
/** Presses the completion action of the open scene, which has this label. */
export async function readTo(page: Page,label: string){
  await expect(forward(page)).toHaveText(label);await forward(page).click();
}
/** Opens the waiting scene with this title from Story. */
export async function readNow(page: Page,title: string){
  await story(page);await page.locator('.story-waiting').getByRole('button',{name:`Read now: ${title}`,exact:true}).click();
  await expect(page.getByRole('dialog',{name:title,exact:true})).toBeVisible();
}
/** Presses Return in a journal scene. */
export async function finishScene(page: Page){
  await page.getByRole('button',{name:'Return',exact:true}).click();
}
export async function payAndRead(page: Page){
  await story(page);await page.getByRole('button',{name:/^Pay /}).first().click();
  await page.getByRole('button',{name:'See what changed',exact:true}).click();
}
export const revealed=(page: Page)=>expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done',{timeout:8000});
/** The room's painting once it has loaded, by file name. */
export const painting=(page: Page)=>page.locator('#room-paintings img').last().evaluate(e=>{const image=e as HTMLImageElement;return image.complete&&image.naturalWidth>0?image.currentSrc.split('/').at(-1)!:'';});
/** Makes every later write of the save fail, as a full storage does. */
export async function failWrites(page: Page){
  await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Storage is full.','QuotaExceededError');original.call(this,name,value);};},KEY);
}
/** Restores the native write from a same-origin fresh realm without a change to the stored snapshot. */
export async function restoreWrites(page: Page){
  await page.evaluate(()=>{const frame=document.createElement('iframe');document.body.append(frame);Storage.prototype.setItem=frame.contentWindow!.localStorage.setItem;frame.remove();});
}
/** Exports the save from the open Options dialog, under its file name, and returns its text. */
export async function exportText(page: Page){
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();
  const download=await pending;expect(download.suggestedFilename()).toBe('scary-snacks-save.json');
  return readFileSync((await download.path())!,'utf8');
}
/** Erases the game from the open Options dialog and starts a new one. The first scene of the prologue opens, and Escape closes it. */
export async function startAgain(page: Page){
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again',exact:true}).click();
  await expect(page.locator('#modal-title')).toHaveText(data.prologue.events[0].opening.title);await page.keyboard.press('Escape');
}
/** Imports this save text from the open Options dialog. */
export async function importSaveFile(page: Page,text: string){
  await page.locator('input[type="file"]').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game',exact:true}).click();
}
export async function startAgainAndImport(page: Page,text: string){
  await startAgain(page);await options(page);await importSaveFile(page,text);
}
/** A portrait shows its own cell of a 640px atlas variant: an unfiltered square crop that stays inside the cell. */
export async function portraitCell(target: Locator,atlas: string,sprite: number){
  const style=await target.evaluate(element=>{const style=getComputedStyle(element);return {image:style.backgroundImage,position:style.backgroundPosition,size:style.backgroundSize,filter:style.filter};});
  expect(style.image).toContain(`/assets/variants/${atlas}-640x640.webp`);await expect(target).toHaveClass(new RegExp(`portrait-${sprite}`));
  const side=200/parseFloat(style.size),position=style.position.split(' ').map(parseFloat);
  const left=position[0]/100*(2-side)-sprite%2,top=position[1]/100*(2-side)-Math.floor(sprite/2);
  expect(side).toBeGreaterThan(.7);expect(side).toBeLessThan(.9);
  expect(left).toBeGreaterThanOrEqual(-.00001);expect(top).toBeGreaterThanOrEqual(-.00001);
  expect(left+side).toBeLessThanOrEqual(1.00001);expect(top+side).toBeLessThanOrEqual(1.00001);expect(style.filter).toBe('none');
  expect(await target.evaluate(async element=>{const image=new Image();image.src=getComputedStyle(element).backgroundImage.slice(5,-2);await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([640,640]);
}
/** The WCAG contrast ratio of two computed colours. */
export function ratio(a: string,b: string){
  const luminance=(value: string)=>value.match(/\d+(?:\.\d+)?/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
