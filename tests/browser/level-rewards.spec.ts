import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, legacyOrderReward, validateGame } from '../../src/engine.ts';
import type { GameData, GameState } from '../../src/engine.ts';
import { SAVE_KEY, GENERATOR_SAVE_KEY, exportSave } from '../../src/storage.ts';

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
  await expect(house(page)).toHaveAttribute('data-rewards','');
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

test('the first XP boundary makes a reward visible without claiming it',async({page})=>{
  await start(page,99);await house(page).click();await expect(page.locator('.level-progress')).toHaveText('Level 1 · 99 XP');
  await expect(page.locator('.level-panel')).toContainText('99 of 100 XP to level 2.');await expect(claim(page,2)).toHaveCount(0);
  await page.keyboard.press('Escape');await page.locator('[data-cell="13"]').click();await page.locator('[data-cell="14"]').click();
  await expect(house(page)).toHaveAttribute('data-rewards','');expect((await saved(page)).coins).toBe(0);
  await house(page).click();await expect(claim(page,2)).toBeVisible();
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

test('generator saves convert retroactively and claims survive export and import',async({page})=>{
  const {claimedLevelRewards:_claims,completedQuests:_quests,legacySatisfiedQuests:_legacy,activeQuestProducers:_producers,layoutId:_layout,resolvedObstacles:_resolved,pendingScenes:_scenes,...old}=createGame(data);
  old.orders=old.orders.map(({pricing:_pricing,...order})=>({...order,reward:legacyOrderReward(order.requirements,data)}));
  const legacy=JSON.stringify({format:'scary-snacks',version:3,state:{...old,version:4,xp:900}});
  await page.addInitScript(([key,value])=>{if(!localStorage.getItem(key))localStorage.setItem(key,value);},[GENERATOR_SAVE_KEY,legacy]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);await house(page).click();
  expect(await page.evaluate(key=>localStorage.getItem(key),GENERATOR_SAVE_KEY)).toBe(legacy);
  expect((await saved(page)).coins).toBe(0);await expect(page.locator('.level-panel .primary-button')).toHaveCount(9);await claim(page,10).click();
  const committed=await saved(page),downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export saved game'}).click();
  const download=await downloadPromise,text=readFileSync((await download.path())!,'utf8');expect(JSON.parse(text).state).toEqual(committed);
  await claim(page,2).click();await page.locator('input[type="file"]').setInputFiles({name:'rewards.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game'}).click();await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(committed);
  await page.reload();await house(page).click();await expect(claim(page,10)).toHaveCount(0);await expect(claim(page,2)).toBeVisible();
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
