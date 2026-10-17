import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, reduceGame, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
function checkpoint(count=24) {
  let state=createGame(data);state.coins=100000;
  state.served=data.tasks[count-1]?.goals.served??0;state.merges=data.tasks[count-1]?.goals.merges??0;
  for(let index=0;index<count;index++)state=reduceGame(state,{type:'task'},data).state;
  return state;
}
const serialized=(state: GameState)=>exportSave(state,state=>validateGame(state,data));
async function saved(page: Page): Promise<GameState> {
  return page.evaluate(key=>navigator.locks.request(key,()=>JSON.parse(localStorage.getItem(key)!).state),SAVE_KEY);
}
async function start(page: Page,count=24,theme='light') {
  await page.addInitScript(({key,text,theme})=>{
    if(localStorage.getItem(key)===null)localStorage.setItem(key,text);
    localStorage.setItem('scary-snacks-theme',theme);
  },{key:SAVE_KEY,text:serialized(checkpoint(count)),theme});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);
}
async function house(page: Page) {
  await page.locator('[data-house-book]:visible').first().click();await expect(page.locator('#modal-title')).toHaveText('House book');
}
async function edit(page: Page,slot: string) { await page.locator(`[data-decoration="${slot}"]`).click(); }
async function choose(page: Page,variant: string) { await page.locator(`input[name="decoration"][value="${variant}"]`).check(); }
async function waitForArt(page: Page) {
  await page.locator('svg image').evaluateAll(async elements=>Promise.all(elements.map(async element=>{
    const image=new Image();image.src=element.getAttribute('href')!;await image.decode();
  })));
}

for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'phone',width:390,height:844}])for(const theme of ['light','dark']){
  test(`decoration preview and durable choices at ${viewport.name} in ${theme}`,async({page},testInfo)=>{
    await page.setViewportSize(viewport);await start(page,24,theme);const before=await saved(page);await house(page);
    await edit(page,'tableware');await choose(page,'green');
    await expect(page.locator('.decoration-preview svg[data-variant="green"]')).toHaveCount(1);
    expect(await saved(page)).toEqual(before);
    await expect(page.locator('#room-decorations svg[data-slot="tableware"]')).toHaveCount(0);
    await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('[data-decoration="tableware"]')).toBeFocused();
    await expect(page.locator('[data-decoration="tableware"] [data-variant="blue"]')).toHaveCount(1);
    await edit(page,'tableware');await expect(page.locator('input[value="blue"]')).toBeChecked();
    await page.locator('input[value="blue"]').focus();await page.keyboard.press('ArrowDown');await expect(page.locator('input[value="green"]')).toBeChecked();
    await waitForArt(page);
    const geometry=await page.locator('.decoration-editor').evaluate(root=>({width:root.scrollWidth,client:root.clientWidth,targets:[...root.querySelectorAll('button,label')].map(element=>element.getBoundingClientRect().height)}));
    expect(geometry.width).toBeLessThanOrEqual(geometry.client);expect(geometry.targets.every(height=>height>=44)).toBe(true);
    await expect(page.getByRole('button',{name:'Apply',exact:true})).toBeInViewport();
    await page.screenshot({path:testInfo.outputPath('editor.png')});
    await page.getByRole('button',{name:'Apply',exact:true}).click();await expect(page.locator('[data-decoration="tableware"]')).toBeFocused();
    const after=await saved(page);expect(after).toEqual({...before,decorationChoices:{tableware:'green'}});
    await expect(page.locator('#room-decorations svg[data-slot="tableware"][data-variant="green"]')).toHaveCount(1);
    for(const [slot,variant] of [['textiles','blue'],['flowers','lilacs']]){
      await edit(page,slot);await choose(page,variant);await waitForArt(page);await page.screenshot({path:testInfo.outputPath(`editor-${slot}.png`)});await page.getByRole('button',{name:'Apply',exact:true}).click();
    }
    await waitForArt(page);await page.screenshot({path:testInfo.outputPath('house-book.png')});
    const committed=await saved(page);await edit(page,'flowers');await page.getByRole('button',{name:'Apply',exact:true}).click();expect(await saved(page)).toEqual(committed);
    await page.getByRole('button',{name:'Close dialog'}).click();await page.reload();await expect(page.locator('#board button')).toHaveCount(42);expect(await saved(page)).toEqual(committed);
    await expect(page.locator('#room-decorations svg[data-slot="flowers"][data-variant="lilacs"]')).toHaveCount(1);
    if(viewport.name==='phone')await page.locator('#drawer-handle').click();
    await waitForArt(page);await page.screenshot({path:testInfo.outputPath('front-room.png')});
    await page.getByRole('button',{name:'Courtyard',exact:true}).click();await expect(page.locator('#room-decorations svg[data-slot="textiles"][data-variant="blue"]')).toHaveCount(1);
    await waitForArt(page);await page.screenshot({path:testInfo.outputPath('courtyard.png')});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

test('locked choices explain their preparation and dismissal discards a preview',async({page})=>{
  await start(page,9);await house(page);await expect(page.locator('.decoration-locked')).toHaveCount(2);
  await expect(page.locator('.decoration-locked').first()).toContainText(data.tasks[21].title);
  const before=await saved(page);await edit(page,'tableware');await choose(page,'green');await page.keyboard.press('Escape');
  await expect(page.locator('[data-decoration="tableware"]')).toBeFocused();expect(await saved(page)).toEqual(before);
  await edit(page,'tableware');await choose(page,'green');await page.getByRole('button',{name:'Close dialog'}).click();
  await expect(page.locator('[data-decoration="tableware"]')).toBeFocused();expect(await saved(page)).toEqual(before);
});

test('failed Apply keeps the committed choice and Retry saves the selected finish',async({page})=>{
  await start(page);await house(page);await edit(page,'tableware');await choose(page,'green');const before=await saved(page);
  await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(name,value){if(name===key)throw new DOMException('Full','QuotaExceededError');original.call(this,name,value);};},SAVE_KEY);
  await page.getByRole('button',{name:'Apply',exact:true}).click();await expect(page.locator('.decoration-notice')).toContainText('The choice was not saved');
  expect(await saved(page)).toEqual(before);await expect(page.locator('#room-decorations svg[data-slot="tableware"]')).toHaveCount(0);
  // Restore the native method from a same-origin fresh realm without changing the stored snapshot.
  await page.evaluate(()=>{const frame=document.createElement('iframe');document.body.append(frame);Storage.prototype.setItem=frame.contentWindow!.localStorage.setItem;frame.remove();});
  await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('#modal-title')).toHaveText('House book');
  expect((await saved(page)).decorationChoices).toEqual({tableware:'green'});
});



test('decoration choices survive current save export and import',async({page})=>{
  await start(page);await house(page);await edit(page,'tableware');await choose(page,'green');
  await page.getByRole('button',{name:'Apply',exact:true}).click();
  const committed=await saved(page),pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export saved game'}).click();const download=await pending,path=(await download.path())!;
  expect(JSON.parse(readFileSync(path,'utf8')).state).toEqual(committed);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  expect(await saved(page)).not.toEqual(committed);
  await house(page);await page.locator('input[type=file]').setInputFiles(path);await page.getByRole('button',{name:'Import this saved game'}).click();
  expect(await saved(page)).toEqual(committed);await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  expect(await saved(page)).toEqual(committed);await expect(page.locator('#room-decorations svg[data-slot="tableware"][data-variant="green"]')).toHaveCount(1);
});

test('another tab cancels a stale decoration preview without losing its newer progress',async({page,context})=>{
  await start(page);await house(page);await edit(page,'tableware');await choose(page,'green');
  const other=await context.newPage();await other.goto('./');await expect(other.locator('#board button')).toHaveCount(42);await other.locator('[data-cell="1"]').click();
  const newer=await saved(other);await expect(page.locator('#modal')).not.toBeVisible();expect(await saved(page)).toEqual(newer);expect(newer.decorationChoices).toEqual({});await other.close();
});

test('a valid save from another tab restores play after load recovery',async({page,context})=>{
  await page.goto('./');await page.evaluate(key=>localStorage.setItem(key,'{broken'),SAVE_KEY);await page.reload();
  await expect(page.getByRole('button',{name:'Retry saved game'})).toBeVisible();
  const other=await context.newPage();await other.goto('./');
  await other.evaluate(({key,text})=>localStorage.setItem(key,text),{key:SAVE_KEY,text:serialized(checkpoint(9))});
  await expect(page.locator('#modal')).not.toBeVisible();await expect(page.locator('#status')).toContainText('another tab');
  const before=await saved(page);await page.locator('[data-cell="1"]').click();
  expect((await saved(page)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);await other.close();
});

test('Cancel discards Apply while it waits for the shared save lock',async({page,context})=>{
  await start(page);await house(page);await edit(page,'tableware');await choose(page,'green');const before=await saved(page);
  const other=await context.newPage();await other.goto('./');
  await other.evaluate(key=>{
    void navigator.locks.request(key,async()=>{
      document.body.dataset.locked='';await new Promise<void>(resolve=>document.addEventListener('release-test-lock',()=>resolve(),{once:true}));
    });
  },SAVE_KEY);
  await expect(other.locator('body')).toHaveAttribute('data-locked','');
  await page.getByRole('button',{name:'Apply',exact:true}).click();await expect(page.getByRole('button',{name:'Apply',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await other.evaluate(()=>document.dispatchEvent(new Event('release-test-lock')));expect(await saved(page)).toEqual(before);
  await expect(page.locator('[data-decoration="tableware"]')).toBeFocused();await other.close();
});
