import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGame, reduceGame, resolveRooms, latestArea, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY as KEY, exportSave } from '../../src/storage.ts';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
function saveAfter(count: number,coins=0){
  let state=createGame(data);state.coins=100000;
  Object.assign(state,data.tasks[Math.min(count,data.tasks.length-1)].goals);
  for(let index=0;index<count;index++){
    const result=reduceGame(state,{type:'task'},data);expect(result.ok,result.message).toBe(true);state=result.state;
  }
  state.coins=coins;return exportSave(state,candidate=>validateGame(candidate,data));
}
async function saved(page: Page): Promise<GameState>{
  return page.evaluate(key=>navigator.locks.request(key,()=>JSON.parse(localStorage.getItem(key)!).state),KEY);
}
async function start(page: Page,save: string,theme='light'){
  await page.addInitScript(({key,save,theme})=>{
    if(localStorage.getItem(key)===null)localStorage.setItem(key,save);
    localStorage.setItem('scary-snacks-theme',theme);
  },{key:KEY,save,theme});
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);
}
/** The room's painting once it has decoded, by file name. */
const shown=(page: Page)=>page.locator('#room-paintings img').last().evaluate(async e=>{const image=e as HTMLImageElement;await image.decode().catch(()=>{});return image.complete&&image.naturalWidth>0?image.currentSrc.split('/').at(-1)!:'';});
const completedAt=(count: number)=>data.tasks.slice(0,count).map(task=>task.id);

// The room checks do not depend on the theme, so each viewport uses one theme.
for(const {theme,...viewport} of [{name:'desktop',width:1440,height:1000,theme:'light'},{name:'phone',width:390,height:844,theme:'dark'}]){
  test(`every renovation checkpoint shows its painted room at ${viewport.name} in ${theme}`,async({page},testInfo)=>{
    test.setTimeout(180000);await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
    // One navigation per checkpoint also proves that every state can be reconstructed from its save.
    await start(page,saveAfter(0),theme);
    let previous='';
    for(let count=0;count<=24;count++){
      if(count>0){
        await page.evaluate(({key,save})=>{localStorage.setItem(key,save);localStorage.removeItem('scary-snacks-area');},{key:KEY,save:saveAfter(count)});
        await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
      }
      const before=await saved(page);
      // The room follows the area of the latest change and shows the state of its highest completed preparation.
      const area=latestArea(completedAt(count),data),view=resolveRooms(completedAt(count),data).find(value=>value.id===area)!;
      const frame=page.locator('#room-frame');
      await expect(frame,`checkpoint ${count}`).toHaveAttribute('data-area',area);await expect(frame).toHaveAttribute('data-current',view.current!.id);await expect(frame).toHaveAttribute('data-painting',view.painting!.id);
      expect(await shown(page),`checkpoint ${count}`).toMatch(new RegExp(`^${view.painting!.id}-(768x1024|1536x2048)\\.avif$`));
      await expect(page.locator('#room-caption li')).toHaveText(view.states.map(state=>state.text));
      await expect(page.locator('#room-pin')).toBeVisible({visible:count>0&&view.painting===view.current});
      // Only the room is captured, with the cats masked, so a change must be in the painting's pixels.
      const stage=page.locator('#room-stage');
      await stage.screenshot({path:testInfo.outputPath('renovation',`${String(count).padStart(2,'0')}-${area}.png`),animations:'disabled'});
      const hash=createHash('sha256').update(await stage.screenshot({animations:'disabled',mask:[stage.locator('.mascot'),page.locator('#room-pin'),page.locator('#area-switch')]})).digest('hex');
      if(count>0&&view.painting===view.current)expect(hash,`preparation ${count} must change the room's pixels`).not.toBe(previous);
      previous=hash;
      expect(await saved(page)).toEqual(before);
    }
  });
}

test('a courtyard painting that fails to load leaves its words',async({page})=>{
  await page.route('**/assets/variants/courtyard-23-*',route=>route.fulfill({status:404,body:''}));
  await start(page,saveAfter(23));const view=resolveRooms(completedAt(23),data).find(value=>value.id==='courtyard')!;
  await expect(page.locator('#room-frame')).toHaveAttribute('data-current','courtyard-23');await expect(page.locator('#room-stage')).toHaveAttribute('data-failed','');
  await expect(page.locator('#room-caption')).toBeVisible();await expect(page.locator('#room-caption li')).toHaveText(view.states.map(state=>state.text));
});

test('a preparation whose save fails leaves coins, progress and room unchanged',async({page})=>{
  await start(page,saveAfter(1,data.tasks[1].cost));const before=await saved(page);
  const frame=page.locator('#room-frame'),painting=await frame.getAttribute('data-painting');
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Storage is full.','QuotaExceededError');original.call(this,name,value);};
  },KEY);
  await page.locator('#story').getByRole('button',{name:/^Pay /}).click();
  await expect(page.locator('#status')).toContainText(/save|saved/i);
  expect(await saved(page)).toEqual(before);await expect(page.locator('#coins')).toHaveText(String(before.coins));
  await expect(frame).toHaveAttribute('data-painting',painting!);await expect(page.locator('#room-stage')).not.toHaveAttribute('data-reveal');
  await expect(page.locator('.story-controls')).toHaveCount(0);await expect(page.getByRole('dialog')).toBeHidden();
});

test('a failed animated area change replaces the old painting with the current room words',async({page})=>{
  await start(page,saveAfter(23));await shown(page);
  await page.route('**/assets/variants/front-room-17-*',route=>route.fulfill({status:404,body:''}));
  await page.getByRole('button',{name:'Front room',exact:true}).click();
  await expect(page.locator('#room-stage')).toHaveAttribute('data-failed','');
  await expect(page.locator('#room-paintings picture')).toHaveCount(0);
  await expect(page.locator('#room-caption')).toBeVisible();
  await expect(page.locator('#room-caption li').last()).toHaveText(data.rooms.find(room=>room.id==='front-room-17')!.text);
  await expect(page.locator('#room-pin')).toBeHidden();
});

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'phone',width:390,height:844}])test(`a painting that fails during story preload shows the fallback and restores focus at ${viewport.name}`,async({page})=>{
  await page.setViewportSize(viewport);
  await start(page,saveAfter(0,data.tasks[0].cost));await shown(page);
  await page.route('**/assets/variants/front-room-01-*',route=>route.fulfill({status:404,body:''}));
  const failed=page.waitForResponse(response=>response.url().includes('/front-room-01-')&&response.status()===404);
  await page.getByRole('button',{name:/^Pay /}).click();await failed;
  await expect(page.locator('#room-stage')).not.toHaveAttribute('data-failed');
  await page.getByRole('button',{name:'Close dialog'}).click();
  await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done',{timeout:8000});
  await expect(page.locator('#room-stage')).toHaveAttribute('data-failed','');
  await expect(page.locator('#room-paintings picture')).toHaveCount(0);
  await expect(page.locator('#room-caption')).toBeVisible();await expect(page.locator('#room-pin')).toBeHidden();
  await expect(page.locator('#board [tabindex="0"]')).toBeFocused();
});

test('a failed load from an earlier area cannot clear the newer painting or its pin',async({page})=>{
  await start(page,saveAfter(23));await shown(page);
  let release!: ()=>void;const delayed=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/assets/variants/front-room-17-*',async route=>{await delayed;await route.fulfill({status:404,body:''});});
  const requested=page.waitForRequest('**/assets/variants/front-room-17-*');
  await page.getByRole('button',{name:'Front room',exact:true}).click();await requested;
  await page.getByRole('button',{name:'Courtyard',exact:true}).click();
  release();
  await expect(page.locator('#room-paintings picture')).toHaveCount(1);
  expect(await shown(page)).toMatch(/^courtyard-23-/);
  await expect(page.locator('#room-stage')).not.toHaveAttribute('data-failed');
  await expect(page.locator('#room-pin')).toHaveAccessibleName(`New: ${data.rooms.find(room=>room.id==='courtyard-23')!.text}`);
  await expect(page.locator('#room-pin')).toBeVisible();
});

test('room pins stay in the visible room and clear the area switch on short phones and tablets',async({page})=>{
  await start(page,saveAfter(0));
  for(const reducedMotion of ['reduce','no-preference'] as const)for(const [width,height,count] of [[320,740,4],[390,740,4],[390,740,10],[390,740,23],[768,1024,23]]){
    await page.emulateMedia({reducedMotion});
    await page.setViewportSize({width,height});
    await page.evaluate(([key,save])=>{localStorage.setItem(key,save);localStorage.removeItem('scary-snacks-area');},[KEY,saveAfter(count)]);
    await page.reload();await expect(page.locator('#board button')).toHaveCount(42);await shown(page);
    await expect.poll(()=>page.evaluate(()=>{
      const box=(selector: string)=>document.querySelector(selector)!.getBoundingClientRect();
      const pin=box('#room-pin'),room=box('#room-stage'),drawer=box('#drawer'),area=box('#area-switch');
      return {inside:pin.left>=room.left&&pin.right<=room.right&&pin.top>=room.top&&pin.bottom<=drawer.top,
        overlap:pin.left<area.right&&area.left<pin.right&&pin.top<area.bottom&&area.top<pin.bottom};
    }),{message:`${width}x${height}, preparation ${count}, ${reducedMotion}`}).toEqual({inside:true,overlap:false});
  }
});

test('a new game restores its original room crop after a pin has moved the frame',async({page})=>{
  await page.setViewportSize({width:768,height:1024});await page.emulateMedia({reducedMotion:'reduce'});
  await start(page,saveAfter(0));await shown(page);
  const initial=(await page.locator('#room-frame').boundingBox())!;
  await page.evaluate(({key,save})=>localStorage.setItem(key,save),{key:KEY,save:saveAfter(23)});
  await page.reload();await expect(page.locator('#board button')).toHaveCount(42);await shown(page);
  await expect(page.locator('#room-pin')).toBeVisible();
  await page.getByRole('button',{name:/House book/}).click();
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();
  await page.getByRole('button',{name:'Erase and start again'}).click();
  await expect(page.locator('#room-frame')).toHaveAttribute('data-current','front-room-00');
  await expect(page.locator('#room-pin')).toBeHidden();
  await expect.poll(async()=>(await page.locator('#room-frame').boundingBox())!.y).toBeCloseTo(initial.y,1);
});
