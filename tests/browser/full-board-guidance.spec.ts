import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { boardObstacles, firstFreeBoardCell, unresolvedObstacle } from '../../src/model.ts';
import type { GameState } from '../../src/model.ts';
import { act, checkpoint, data, deliverable, deliverButton, dialogDeliver, quest, saved, start, supply, ticket, tile, validate, know } from './support.ts';

/** A purse at the recovery floor keeps Ana's recovery quest, which could take the Linden tea of Mara's quest, off the counter. */
const welcomeReady = () => { const state = deliverable(quest('mara-welcome')); state.coins = data.economy.recoveryFloor; return state; };
function fullBoard(code: string, seed = checkpoint(0), keep: (index: number) => boolean = () => false) {
  const state: GameState = structuredClone(seed);
  state.board.forEach((cell, index) => {
    if (!unresolvedObstacle(state,index,data) && !cell?.code.startsWith('generator_') && !keep(index)) state.board[index] = {code};
  });
  if (!state.discovered.includes(code)) know(state,code);
  expect(firstFreeBoardCell(state,data)).toBe(-1);
  expect(validate(state)).toBe(true);
  return state;
}
async function guide(page: Page, code: string) {
  await page.locator('#recipes-button:visible, #collection-button:visible').first().click();
  await page.getByRole('button',{name:data.items[code].name,exact:true}).click();
  await page.getByRole('button',{name:'Show me on the board'}).click();
}

test('a full-board guide points to a ready delivery that frees space',async({page})=>{
  const welcome=quest('mara-welcome'),seed=welcomeReady();
  const dishes=seed.board.flatMap((cell,index)=>welcome.requirements.some(({item})=>item===cell?.code)?[index]:[]);
  const state=fullBoard('grain_6',seed,index=>dishes.includes(index));
  know(state,'corn_4');
  await page.setViewportSize({width:390,height:844});await start(page,state);
  await guide(page,'corn_4');
  const deliver=deliverButton(page,welcome),face=ticket(page,welcome).locator('.ticket-face');
  await expect(deliver).toBeEnabled();await expect(deliver).toHaveClass(/guide-target/);
  await expect(deliver).toBeHidden();await expect(face).toBeVisible();await expect(face).toBeFocused();
  await expect(page.locator('#status')).toContainText(`Deliver ${welcome.title} to make space`);
  expect(await saved(page)).toEqual(state);
  await face.click();await expect(dialogDeliver(page,welcome)).toBeEnabled();await dialogDeliver(page,welcome).click();
  await expect.poll(async()=>firstFreeBoardCell(await saved(page),data)).toBeGreaterThanOrEqual(0);
  await expect(tile(page,4)).toHaveClass(/guide-target/);
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.corn_4.name}`})).toBeVisible();
});

test('a full-board guide points to a campaign quest before the recovery quest',async({page})=>{
  const welcome=quest('mara-welcome'),recovery=quest('ana-night-ward-tea'),seed=welcomeReady();seed.coins=0;
  const dishes=seed.board.flatMap((cell,index)=>welcome.requirements.some(({item})=>item===cell?.code)?[index]:[]);
  const state=fullBoard('grain_6',seed,index=>dishes.includes(index));
  know(state,'corn_4');
  await start(page,state);await expect(deliverButton(page,recovery)).toBeEnabled();
  await guide(page,'corn_4');
  await expect(deliverButton(page,welcome)).toHaveClass(/guide-target/);await expect(deliverButton(page,recovery)).not.toHaveClass(/guide-target/);
  await expect(page.locator('#status')).toContainText(`Deliver ${welcome.title} to make space`);
});

test('on a phone, a full-board guide to the recovery quest focuses its ticket face, and its dialog delivers',async({page})=>{
  const recovery=quest('ana-night-ward-tea'),seed=deliverable(recovery);seed.coins=0;
  const tea=seed.board.flatMap((cell,index)=>cell?.code===recovery.requirements[0].item?[index]:[]);
  const state=fullBoard('grain_6',seed,index=>tea.includes(index));
  know(state,'corn_4');
  await page.setViewportSize({width:390,height:844});await start(page,state);
  await guide(page,'corn_4');
  const face=page.locator(`#tickets [data-quest="${recovery.id}"] .ticket-face`);
  await expect(face).toBeFocused();await expect(page.locator('#status')).toContainText(`Deliver ${recovery.title} to make space`);
  await face.click();await page.locator('#modal').getByRole('button',{name:/^Deliver /}).click();
  await expect.poll(async()=>firstFreeBoardCell(await saved(page),data)).toBeGreaterThanOrEqual(0);
});

test('a full-board guide offers recovery delivery while its reward leaves a debt',async({page})=>{
  const recovery=quest('ana-night-ward-tea'),seed=deliverable(recovery);seed.coins=-30;
  const tea=seed.board.flatMap((cell,index)=>cell?.code===recovery.requirements[0].item?[index]:[]);
  const state=fullBoard('grain_6',seed,index=>tea.includes(index));know(state,'corn_4');
  await page.setViewportSize({width:390,height:844});await start(page,state);
  await guide(page,'corn_4');
  const face=page.locator(`#tickets [data-quest="${recovery.id}"] .ticket-face`);
  await expect(face).toBeFocused();await expect(page.locator('#status')).toContainText(`Deliver ${recovery.title} to make space`);
  await face.click();await page.locator('#modal').getByRole('button',{name:/^Deliver /}).click();
  const after=await saved(page);
  expect(after.coins).toBe(state.coins+recovery.reward);expect(after.coins).toBeLessThan(0);
  expect(firstFreeBoardCell(after,data)).toBeGreaterThanOrEqual(0);
});

test('a goal-chain merge takes priority over a ready delivery on a full board',async({page})=>{
  const welcome=quest('mara-welcome'),seed=welcomeReady();
  const dishes=seed.board.flatMap((cell,index)=>welcome.requirements.some(({item})=>item===cell?.code)?[index]:[]);
  const corn=firstFreeBoardCell(seed,data);seed.board[corn]={code:'corn_1'};
  const state=fullBoard('grain_6',seed,index=>dishes.includes(index)||index===corn||index===22);
  know(state,'corn_2');
  await start(page,state);await guide(page,'corn_2');
  await expect(deliverButton(page,welcome)).toBeEnabled();
  await expect(deliverButton(page,welcome)).not.toHaveClass(/guide-target/);
  await expect(tile(page,corn)).toHaveClass(/selected/);
  await expect(tile(page,22)).toHaveClass(/guide-target/);
  await tile(page,22).click();
  expect(await saved(page)).toEqual(act(state,{type:'move',from:corn,to:22}));
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.corn_2.name}`})).toHaveCount(0);
});

test('a full-board mixed guide checks both parts for a useful merge before a ready delivery',async({page})=>{
  const seed=checkpoint(3),recovery=quest('ana-night-ward-tea');
  for(const [index,cell] of seed.board.entries())if(cell&&!data.items[cell.code].generator)seed.board[index]=null;
  for(const obstacle of boardObstacles(seed,data)){
    if(!seed.resolvedObstacles.includes(obstacle.id))seed.resolvedObstacles.push(obstacle.id);
    if(!seed.discovered.includes(obstacle.ingredient))know(seed,obstacle.ingredient);
  }
  const supplied=supply(seed,['corn_3','dairy_1','dairy_1',recovery.requirements[0].item]);
  const parts=supplied.board.flatMap((cell,index)=>cell&&!data.items[cell.code].generator?[index]:[]);
  const state=fullBoard('grain_6',supplied,index=>parts.includes(index));know(state,'mixed_bulz');
  // Mămăligă needs fewer total steps, but only the Telemea part has a legal merge on this full board.
  await start(page,state);await guide(page,'mixed_bulz');
  const [first,second]=state.board.flatMap((cell,index)=>cell?.code==='dairy_1'?[index]:[]);
  await expect(deliverButton(page,recovery)).toBeEnabled();await expect(deliverButton(page,recovery)).not.toHaveClass(/guide-target/);
  await expect(tile(page,first)).toHaveClass(/selected/);await expect(tile(page,second)).toHaveClass(/guide-target/);
  await expect(page.locator('#status')).toHaveText(`Merge two ${data.items.dairy_1.name} to make ${data.items.dairy_2.name} for ${data.items.mixed_bulz.name}.`);
  expect(await saved(page)).toEqual(state);
});

test('a full-board guide skips a delivery that would exceed the coin limit',async({page})=>{
  const welcome=quest('mara-welcome'),seed=welcomeReady();
  const dishes=seed.board.flatMap((cell,index)=>welcome.requirements.some(({item})=>item===cell?.code)?[index]:[]);
  const state=fullBoard('grain_6',seed,index=>dishes.includes(index)||index===13||index===14);
  state.coins=1_000_000_000-welcome.reward+1;
  know(state,'corn_4');
  await start(page,state);await guide(page,'corn_4');
  await expect(deliverButton(page,welcome)).toBeEnabled();
  await expect(deliverButton(page,welcome)).not.toHaveClass(/guide-target/);
  // The two Herb bunches of the quest merge with each other, so the guide makes room with them.
  const [first,second]=dishes.filter(index=>state.board[index]?.code===welcome.requirements[0].item);
  await expect(tile(page,first)).toHaveClass(/selected/);
  await expect(tile(page,second)).toHaveClass(/guide-target/);
  expect(await saved(page)).toEqual(state);
});

test('a full-board guide points to a legal ordinary merge',async({page})=>{
  const state=fullBoard('grain_6',checkpoint(0),index=>index===13||index===14);
  know(state,'herbs_3');
  await start(page,state);await guide(page,'herbs_3');
  const from=Number((await page.locator('#board .selected').getAttribute('data-cell'))!);
  const to=Number((await page.locator('#board .guide-target').first().getAttribute('data-cell'))!);
  expect(state.board[from]?.code).toBe('grain_1');expect(state.board[to]?.code).toBe('grain_1');
  await expect(page.locator('#status')).toContainText(`Merge two ${data.items.grain_1.name} to make space`);
  expect(await saved(page)).toEqual(state);
  await tile(page,to).click();
  expect(await saved(page)).toEqual(act(state,{type:'move',from,to}));
  await expect(tile(page,31)).toHaveClass(/guide-target/);
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.herbs_3.name}`})).toBeVisible();
});

test('a full-board guide points to a legal blocker merge',async({page})=>{
  const state=fullBoard('grain_6',checkpoint(0),index=>index===22);
  know(state,'herbs_3');
  await start(page,state);await guide(page,'herbs_3');
  await expect(tile(page,22)).toHaveClass(/selected/);
  await expect(tile(page,11)).toHaveClass(/guide-target/);
  await expect(page.locator('#status')).toContainText('Merge Corn cob into the blocked Corn cob to make room');
  expect(await saved(page)).toEqual(state);
  await tile(page,11).click();
  expect(await saved(page)).toEqual(act(state,{type:'move',from:22,to:11}));
  await expect(tile(page,31)).toHaveClass(/guide-target/);
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.herbs_3.name}`})).toBeVisible();
});

test('a full-board guide ignores blocked pairs and explains when no action makes room',async({page})=>{
  const state=fullBoard('grain_6');know(state,'grain_3');
  await page.setViewportSize({width:390,height:844});await start(page,state);
  await guide(page,'grain_3');
  await expect(page.locator('#board .guide-target')).toHaveCount(0);
  await expect(page.locator('#board .selected')).toHaveCount(0);
  await expect(page.locator('#status')).toContainText('No delivery or merge can free space');
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.grain_3.name}`})).toBeFocused();
  expect(await saved(page)).toEqual(state);
  await tile(page,1).click();
  await expect(page.locator('#status')).toContainText('No delivery or merge can free space');
  await expect(page.locator('#item-detail.guided')).toContainText('No delivery or merge can free space');
  expect(await saved(page)).toEqual(state);
});
