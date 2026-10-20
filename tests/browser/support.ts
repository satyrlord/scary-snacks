// Shared fixtures for the browser specs: saves made by the rules, and the controls that the specs use most.
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { firstFreeBoardCell, requiredQuests, resolveQuests } from '../../src/model.ts';
import { createGame, reduceGame, validateGame } from '../../src/engine.ts';
import type { Action, GameData, GameState, Quest } from '../../src/model.ts';
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
  state.pendingScenes=[];state.coins=coins;
  if(ready&&count<data.tasks.length){deliverRequired(state,count);state.coins=data.tasks[count].cost;}
  expect(validate(state)).toBe(true);return state;
}
/** The earliest checkpoint at which this quest is on a ticket: the open quests before it are delivered. */
export function onTicket(target: Quest){
  for(let count=0;count<=data.tasks.length;count++){
    const state=checkpoint(count);
    // The recovery quest is never recorded as delivered, and it never holds a quest ticket.
    for(const earlier of data.quests.slice(0,data.quests.indexOf(target)).filter(value=>!value.recovery)){
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
/** The words of the toast that reports a delivery. It clears itself, so a test that needs the next one waits for this one to go first. */
export const toast=(page: Page)=>page.locator('.toast-text');
/** The Deliver control inside the open quest dialog. */
export const dialogDeliver=(page: Page,value: Quest)=>page.getByRole('dialog',{name:value.title,exact:true}).getByRole('button',{name:`Deliver ${value.title} for ${value.reward.toLocaleString('en')} coins`,exact:true});
/** Opens the quest dialog from the dishes on the ticket. */
export async function openQuest(page: Page,value: Quest){
  await ticket(page,value).locator('.ticket-face').click();await expect(page.getByRole('dialog',{name:value.title,exact:true})).toBeVisible();
}
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
  const done=page.locator('.story-controls .primary-button');
  await expect(done).toHaveText(label);await done.click();
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
export async function exportText(page: Page){
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();
  return readFileSync((await (await pending).path())!,'utf8');
}
export async function startAgainAndImport(page: Page,text: string){
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  await options(page);await page.locator('input[type="file"]').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game'}).click();
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
