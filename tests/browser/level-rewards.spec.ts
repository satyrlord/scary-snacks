import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
const validate=(candidate: unknown)=>validateGame(candidate,data);
async function start(page: Page,xp=200,coins=0){
  const state=createGame(data);state.xp=xp;state.coins=coins;
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,exportSave(state,validate)]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);
}
const house=(page: Page)=>page.locator('[data-house-book]:visible').first();
const claim=(page: Page,level: number)=>page.getByRole('button',{name:`Claim 20 coins for level ${level}`,exact:true});
async function saved(page: Page): Promise<GameState>{return page.evaluate(key=>navigator.locks.request(key,()=>JSON.parse(localStorage.getItem(key)!).state),SAVE_KEY);}

test('rewards stay available after closing and reload; claims are independent and durable',async({page})=>{
  await start(page);const before=await saved(page);
  await expect(house(page)).toHaveAttribute('data-rewards','');await expect(page.locator('#modal')).toBeHidden();
  await house(page).focus();await page.keyboard.press('Enter');
  await expect(page.locator('#close-modal')).toBeFocused();
  await expect(page.locator('.level-progress')).toHaveText('Level 3 · 200 XP');
  await expect(page.locator('.level-next')).toHaveText('Next reward: level 4 · 20 coins at 300 XP.');
  await page.keyboard.press('Escape');await expect(house(page)).toBeFocused();
  expect(await saved(page)).toEqual(before);await page.reload();await house(page).click();
  await claim(page,3).focus();await page.keyboard.press('Space');
  await expect(page.locator('.level-notice')).toHaveText('Claimed level 3: 20 coins.');await expect(page.locator('#level-heading')).toBeFocused();
  await expect(claim(page,2)).toBeVisible();await expect(claim(page,3)).toHaveCount(0);
  expect(await saved(page)).toEqual({...before,coins:20,claimedLevelRewards:['level-3']});
  // An ordinary rerender must not replay the claim notice.
  await page.evaluate(()=>{
    const notice=document.querySelector('.level-notice')!;notice.setAttribute('data-mutations','0');
    new MutationObserver(records=>{const count=records.filter(record=>record.type!=='attributes').length;if(count)notice.setAttribute('data-mutations',String(Number(notice.getAttribute('data-mutations'))+count));}).observe(notice,{childList:true,characterData:true,subtree:true});
  });
  await page.getByRole('radio',{name:'Dark',exact:true}).check();await expect(page.locator('.level-notice')).toHaveAttribute('data-mutations','0');
  await page.reload();await house(page).click();await expect(claim(page,3)).toHaveCount(0);await expect(page.locator('.level-notice')).toBeEmpty();
  await claim(page,2).click();expect((await saved(page)).coins).toBe(40);await expect(house(page)).not.toHaveAttribute('data-rewards','');
});

const levelUp=(page: Page,level: number)=>page.getByRole('dialog',{name:`Level ${level} reached`,exact:true});
async function merge(page: Page){await page.locator('[data-cell="13"]').click();await page.locator('[data-cell="14"]').click();}

test('a new level offers its reward in a dialog that claims nothing by itself',async({page})=>{
  await start(page,99);await expect(page.locator('#modal')).toBeHidden();await merge(page);
  await expect(levelUp(page,2)).toBeVisible();await expect(page.locator('#close-modal')).toBeFocused();await expect(claim(page,2)).toBeVisible();
  await expect(levelUp(page,2)).toContainText('A reward that you leave waits in the House book.');
  await expect(house(page)).toHaveAttribute('data-rewards','');expect((await saved(page)).coins).toBe(0);
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('[data-cell="14"]')).toBeFocused();
  expect((await saved(page)).claimedLevelRewards).toEqual([]);await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  await expect(page.locator('#modal')).toBeHidden();await house(page).click();await expect(claim(page,2)).toBeVisible();
});

test('Claim in the level-up dialog saves the reward and returns to the board',async({page})=>{
  await start(page,99);const before=await saved(page);await merge(page);await claim(page,2).click();
  await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('#status')).toHaveText('Claimed level 2: 20 coins.');
  await expect(page.locator('#board [tabindex="0"]')).toBeFocused();await expect(house(page)).not.toHaveAttribute('data-rewards','');
  const after=await saved(page);expect(after.coins).toBe(20);expect(after.claimedLevelRewards).toEqual(['level-2']);expect(after.xp).toBe(before.xp+1);
});

test('the level-up dialog lists each waiting reward, and each Claim is independent',async({page})=>{
  await start(page,199);await expect(page.locator('#modal')).toBeHidden();await merge(page);
  await expect(levelUp(page,3)).toBeVisible();await claim(page,2).click();
  await expect(levelUp(page,3)).toContainText('Claimed');await expect(page.locator('#modal .level-notice')).toHaveText('Claimed level 2: 20 coins.');
  await expect(claim(page,3)).toBeFocused();expect((await saved(page)).claimedLevelRewards).toEqual(['level-2']);
  await page.keyboard.press('Enter');await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).claimedLevelRewards).toEqual(['level-2','level-3']);
});

test('the level-up dialog waits for the story and the reveal of a paid preparation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const state=createGame(data),task=data.tasks[0];Object.assign(state,task.goals,{coins:task.cost,xp:90});
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[SAVE_KEY,exportSave(state,validate)]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);
  if(!await page.locator('#story').isVisible())await page.locator('#story-button').click();
  await page.getByRole('button',{name:/^Pay /}).first().click();
  const forward=page.locator('.story-controls .primary-button');
  while(await forward.textContent()==='Continue'){await expect(levelUp(page,2)).toHaveCount(0);await forward.click();}
  await expect(forward).toHaveText('See what changed');await forward.click();
  await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done');await expect(levelUp(page,2)).toBeVisible();
  expect((await saved(page)).claimedLevelRewards).toEqual([]);
  await claim(page,2).click();await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#board [tabindex="0"]')).toBeFocused();
});

test('a failed claim save in the level-up dialog opens the House book with Retry save',async({page})=>{
  await start(page,99);
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){if(name===key&&document.documentElement.hasAttribute('data-block-save'))throw new Error('No space');original.call(this,name,value);};
  },SAVE_KEY);
  await merge(page);await page.evaluate(()=>document.documentElement.setAttribute('data-block-save',''));await claim(page,2).click();
  await expect(page.getByRole('dialog',{name:'House book',exact:true})).toBeVisible();await expect(page.locator('#coins')).toHaveText('20');
  await expect(page.locator('#status')).toHaveText('Claimed level 2: 20 coins. This session is not saved.');
  await page.evaluate(()=>document.documentElement.removeAttribute('data-block-save'));await page.getByRole('button',{name:'Retry save',exact:true}).click();
  expect((await saved(page)).claimedLevelRewards).toEqual(['level-2']);
});

test('the final reward has no next promise and can be claimed only once',async({page})=>{
  await start(page,1200);await house(page).click();await expect(page.locator('.level-next')).toHaveText('All level rewards earned. Claim your remaining rewards below.');
  for(const reward of [...data.levelRewards].reverse())await claim(page,reward.level).click();
  const after=await saved(page);expect(after.coins).toBe(180);expect(after.xp).toBe(1200);
  await expect(page.locator('.level-next')).toHaveText('All level rewards claimed. Your level can keep rising.');
  await expect(page.locator('.level-panel button')).toHaveCount(0);await page.reload();await house(page).click();expect(await saved(page)).toEqual(after);
});

test('overflow keeps a reward available and reports the reason',async({page})=>{
  await start(page,100,1_000_000_000);const before=await saved(page);await house(page).click();await claim(page,2).click();
  await expect(page.locator('.level-notice')).toHaveText('Spend some coins before you claim this reward.');expect(await saved(page)).toEqual(before);await expect(claim(page,2)).toBeVisible();
});

test('a failed write keeps the claim in memory and Retry saves it once',async({page})=>{
  await start(page,100);const before=await saved(page);await house(page).click();
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(name,value){if(name===key&&document.documentElement.hasAttribute('data-block-save'))throw new Error('No space');original.call(this,name,value);};
    document.documentElement.setAttribute('data-block-save','');
  },SAVE_KEY);
  await claim(page,2).click();await expect(page.locator('.level-notice')).toContainText('This session is not saved.');
  await expect(page.locator('.modal-copy.save-status')).toContainText('Not saved:');
  await expect(page.locator('#coins')).toHaveText('20');await expect(claim(page,2)).toHaveCount(0);expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Escape');await house(page).click();await expect(claim(page,2)).toHaveCount(0);
  await page.evaluate(()=>document.documentElement.removeAttribute('data-block-save'));await page.getByRole('button',{name:'Retry save',exact:true}).click();
  expect(await saved(page)).toEqual({...before,coins:20,claimedLevelRewards:['level-2']});await expect(page.locator('.level-notice')).toHaveText('Your level rewards and progress are saved in this browser.');
  await expect(page.locator('.modal-copy.save-status')).toHaveText('Saved in this browser');await expect(page.locator('#modal .save-error')).toHaveCount(0);
  await page.reload();await house(page).click();await expect(claim(page,2)).toHaveCount(0);
});


test('claimed level rewards survive current save export and import',async({page})=>{
  await start(page);await house(page).click();await claim(page,3).click();
  const committed=await saved(page),pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export saved game'}).click();const download=await pending,path=(await download.path())!;
  expect(JSON.parse(readFileSync(path,'utf8')).state).toEqual(committed);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  expect(await saved(page)).not.toEqual(committed);
  await house(page).click();await page.locator('input[type=file]').setInputFiles(path);await page.getByRole('button',{name:'Import this saved game'}).click();
  expect(await saved(page)).toEqual(committed);await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  expect(await saved(page)).toEqual(committed);await house(page).click();await expect(claim(page,3)).toHaveCount(0);await expect(claim(page,2)).toBeVisible();
});

test('another tab cannot claim the same reward twice',async({page,context})=>{
  await start(page,100);const other=await context.newPage();await other.goto('./');await expect(other.locator('#board button')).toHaveCount(42);
  await house(page).click();await house(other).click();await claim(page,2).click();
  await expect(other.locator('#modal')).toBeHidden();await house(other).click();await expect(claim(other,2)).toHaveCount(0);expect((await saved(other)).coins).toBe(20);await other.close();
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:390,height:800}])for(const theme of ['light','dark'])test(`level rewards fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme as 'light'|'dark',reducedMotion:'reduce'});await start(page,200);await house(page).click();
  const panel=page.locator('.level-panel');await expect(claim(page,2)).toBeVisible();
  for(const control of await panel.locator('button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  expect(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  const contrast=await panel.evaluate(e=>{
    const luminance=(value: string)=>value.match(/\d+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const background=luminance(getComputedStyle(e.closest('dialog')!).backgroundColor);
    return [...e.querySelectorAll('p,li>span')].map(node=>{const ink=luminance(getComputedStyle(node).color);return(Math.max(ink,background)+.05)/(Math.min(ink,background)+.05);});
  });expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({path:testInfo.outputPath('level-rewards.png')});
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'])test(`the level-up dialog fits ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme as 'light'|'dark',reducedMotion:'reduce'});await start(page,199);await merge(page);
  await expect(levelUp(page,3)).toBeVisible();
  for(const control of await page.locator('#modal button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  expect(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('level-up.png')});
});
