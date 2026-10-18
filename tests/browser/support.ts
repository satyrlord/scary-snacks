// Shared fixtures for the browser specs: saves made by the rules, and the controls that the specs use most.
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, firstFreeBoardCell, reduceGame, requiredQuests, resolveQuests, validateGame } from '../../src/engine.ts';
import type { Action, GameData, GameState, Quest } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

export const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
export const KEY=SAVE_KEY;
export const validate=(candidate: unknown)=>validateGame(candidate,data);
export const serialize=(state: GameState)=>exportSave(state,validate);
export function act(state: GameState,action: Action){const result=reduceGame(state,action,data);expect(result.ok,result.message).toBe(true);return result.state;}
export const quest=(id: string)=>data.quests.find(value=>value.id===id)!;
export const person=(id: string)=>data.characters.find(value=>value.id===id)!;
export const stateText=(id: string)=>data.rooms.find(state=>state.id===id)!.text;
/** Marks delivered, in data order, the quests that the preparation at this index needs. The rules tests cover their dishes. */
function deliverRequired(state: GameState,index: number){for(const value of requiredQuests(index,data))if(!state.completedQuests.includes(value.id))state.completedQuests.push(value.id);}
/**
 * The game after count preparations, each paid with exactly its cost after its quests, and every scene read. Ready also delivers the
 * quests of the next preparation and sets the coins to its cost; otherwise the coins are as given.
 */
export function checkpoint(count: number,{ready=false,coins=0}: {ready?: boolean; coins?: number}={}){
  let state=createGame(data);
  for(let index=0;index<count;index++){deliverRequired(state,index);state.coins=data.tasks[index].cost;state=act(state,{type:'task'});}
  state.pendingScenes=[];delete state.sceneLines;state.coins=coins;
  if(ready&&count<data.tasks.length){deliverRequired(state,count);state.coins=data.tasks[count].cost;}
  expect(validate(state)).toBe(true);return state;
}
/** The earliest checkpoint at which this quest is on a ticket: the open quests before it are delivered. */
export function onTicket(target: Quest){
  for(let count=0;count<=data.tasks.length;count++){
    const state=checkpoint(count);
    for(const earlier of data.quests.slice(0,data.quests.indexOf(target))){
      const view=resolveQuests(state,data).find(value=>value.quest.id===earlier.id)!;
      if(view.status==='active'||view.status==='waiting')state.completedQuests.push(earlier.id);
    }
    if(resolveQuests(state,data).find(value=>value.quest.id===target.id)!.status==='active'){expect(validate(state)).toBe(true);return state;}
  }
  throw new Error(`${target.id} never reaches a ticket.`);
}
export const supplies=(value: Quest)=>value.requirements.flatMap(({item,quantity})=>Array<string>(quantity).fill(item));
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
export const deliverable=(value: Quest)=>supply(onTicket(value),supplies(value));

export async function opened(page: Page){await expect(page.locator('#board button')).toHaveCount(42);}
/** Opens the game. Only the first load gets the save, so a reload shows what the game itself saved. */
export async function start(page: Page,save?: GameState|string,theme?: string){
  if(save!==undefined||theme)await page.addInitScript(({key,value,theme})=>{
    if(value!==null&&localStorage.getItem(key)===null)localStorage.setItem(key,value);
    if(theme)localStorage.setItem('scary-snacks-theme',theme);
  },{key:KEY,value:save===undefined?null:typeof save==='string'?save:serialize(save),theme:theme??''});
  await page.goto('./');await opened(page);
}
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
export const ticket=(page: Page,value: Quest)=>page.locator(`#tickets .ticket[data-quest="${value.id}"]`);
export const deliverButton=(page: Page,value: Quest)=>ticket(page,value).locator('.deliver-button');
/** The toast that reports a delivery. It clears itself, so a test that needs the next one waits for this one to go first. */
export const toast=(page: Page)=>page.locator('.toast');
/** The Deliver control inside the open request dialog. */
export const dialogDeliver=(page: Page,value: Quest)=>page.getByRole('dialog',{name:value.title,exact:true}).getByRole('button',{name:`Deliver ${value.title} for ${value.reward.toLocaleString('en')} coins`,exact:true});
/** Opens the request dialog from the dishes on the ticket. */
export async function request(page: Page,value: Quest){
  await ticket(page,value).locator('.ticket-items').click();await expect(page.getByRole('dialog',{name:value.title,exact:true})).toBeVisible();
}
export async function story(page: Page){if(!await page.locator('#story').isVisible())await page.locator('#story-button').click();}
export async function journal(page: Page){
  if(!await page.getByRole('button',{name:'Open the story journal',exact:true}).isVisible())await page.locator('#story-button').click();
  await page.getByRole('button',{name:'Open the story journal',exact:true}).click();
}
export async function options(page: Page){await page.locator('[data-options]:visible').first().click();await expect(page.locator('#modal-title')).toHaveText('Options');}
export async function appearance(page: Page,mode: string){
  await options(page);await page.getByRole('radio',{name:mode[0].toUpperCase()+mode.slice(1),exact:true}).check();await page.getByRole('button',{name:'Close dialog'}).click();
}
/** Reads the open scene to its end and presses the end control, which has this label. */
export async function readTo(page: Page,label: string){
  const forward=page.locator('.story-controls .primary-button');
  while(await forward.textContent()==='Continue')await forward.click();
  await expect(forward).toHaveText(label);await forward.click();
}
/** Reads a journal scene to its end and presses Return. */
export async function finishScene(page: Page){
  while(await page.locator('.story-controls .primary-button').textContent()==='Continue')await page.locator('.story-controls .primary-button').click();
  await page.getByRole('button',{name:'Return',exact:true}).click();
}
export async function payAndRead(page: Page){
  await story(page);await page.getByRole('button',{name:/^Pay /}).first().click();
  for(const label of ['Continue','Continue','See what changed'])await page.locator('.story-controls .primary-button',{hasText:label}).click();
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
export async function exportText(page: Page){
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();
  return readFileSync((await (await pending).path())!,'utf8');
}
export async function startAgainAndImport(page: Page,text: string){
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await options(page);await page.locator('input[type="file"]').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game'}).click();
}
/** The WCAG contrast ratio of two computed colours. */
export function ratio(a: string,b: string){
  const luminance=(value: string)=>value.match(/\d+(?:\.\d+)?/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export const noSideScroll=(page: Page)=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
