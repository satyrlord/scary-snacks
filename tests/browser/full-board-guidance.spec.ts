import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { firstFreeBoardCell, unresolvedObstacle } from '../../src/model.ts';
import { createGame } from '../../src/engine.ts';
import type { GameState } from '../../src/model.ts';
import { act, data, deliverable, deliverButton, quest, saved, start, tile, validate } from './support.ts';

function fullBoard(code: string, seed = createGame(data), keep: (index: number) => boolean = () => false) {
  const state: GameState = structuredClone(seed);
  state.board.forEach((cell, index) => {
    if (!unresolvedObstacle(state,index,data) && !cell?.code.startsWith('generator_') && !keep(index)) state.board[index] = {code};
  });
  if (!state.discovered.includes(code)) state.discovered.push(code);
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
  const welcome=quest('mara-welcome'),seed=deliverable(welcome);
  const drink=seed.board.findIndex(cell=>cell?.code==='drinks_2');
  const state=fullBoard('bakery_6',seed,index=>index===drink);
  state.discovered.push('warm_4');
  await page.setViewportSize({width:390,height:844});await start(page,state);
  await guide(page,'warm_4');
  const deliver=deliverButton(page,welcome);
  await expect(deliver).toBeEnabled();await expect(deliver).toHaveClass(/guide-target/);
  await expect(deliver).toBeFocused();
  await expect(page.locator('#status')).toContainText(`Deliver ${welcome.title} to make space`);
  expect(await saved(page)).toEqual(state);
  await deliver.click();
  await expect.poll(async()=>firstFreeBoardCell(await saved(page),data)).toBeGreaterThanOrEqual(0);
  await expect(tile(page,4)).toHaveClass(/guide-target/);
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.warm_4.name}`})).toBeVisible();
});

test('a goal-chain merge takes priority over a ready delivery on a full board',async({page})=>{
  const welcome=quest('mara-welcome'),seed=deliverable(welcome);
  const drink=seed.board.findIndex(cell=>cell?.code==='drinks_2');
  seed.board[3]={code:'warm_1'};
  const state=fullBoard('bakery_6',seed,index=>index===drink||index===3||index===22);
  state.discovered.push('warm_2');
  await start(page,state);await guide(page,'warm_2');
  await expect(deliverButton(page,welcome)).toBeEnabled();
  await expect(deliverButton(page,welcome)).not.toHaveClass(/guide-target/);
  await expect(tile(page,3)).toHaveClass(/selected/);
  await expect(tile(page,22)).toHaveClass(/guide-target/);
  await tile(page,22).click();
  expect(await saved(page)).toEqual(act(state,{type:'move',from:3,to:22}));
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.warm_2.name}`})).toHaveCount(0);
});

test('a full-board guide skips a delivery that would exceed the coin limit',async({page})=>{
  const welcome=quest('mara-welcome'),seed=deliverable(welcome);
  const drink=seed.board.findIndex(cell=>cell?.code==='drinks_2');
  const state=fullBoard('bakery_6',seed,index=>index===drink||index===13||index===14);
  state.coins=1_000_000_000-welcome.reward+1;
  state.discovered.push('warm_4');
  await start(page,state);await guide(page,'warm_4');
  await expect(deliverButton(page,welcome)).toBeEnabled();
  await expect(deliverButton(page,welcome)).not.toHaveClass(/guide-target/);
  await expect(tile(page,drink)).toHaveClass(/selected/);
  await expect(tile(page,36)).toHaveClass(/guide-target/);
  expect(await saved(page)).toEqual(state);
});

test('a full-board guide points to a legal ordinary merge',async({page})=>{
  const state=fullBoard('bakery_6',createGame(data),index=>index===13||index===14);
  state.discovered.push('drinks_3');
  await start(page,state);await guide(page,'drinks_3');
  const from=Number((await page.locator('#board .selected').getAttribute('data-cell'))!);
  const to=Number((await page.locator('#board .guide-target').first().getAttribute('data-cell'))!);
  expect(state.board[from]?.code).toBe('bakery_1');expect(state.board[to]?.code).toBe('bakery_1');
  await expect(page.locator('#status')).toContainText('Merge two Flour to make space');
  expect(await saved(page)).toEqual(state);
  await tile(page,to).click();
  expect(await saved(page)).toEqual(act(state,{type:'move',from,to}));
  await expect(tile(page,31)).toHaveClass(/guide-target/);
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.drinks_3.name}`})).toBeVisible();
});

test('a full-board guide points to a legal blocker merge',async({page})=>{
  const state=fullBoard('bakery_6',createGame(data),index=>index===22);
  state.discovered.push('drinks_3');
  await start(page,state);await guide(page,'drinks_3');
  await expect(tile(page,22)).toHaveClass(/selected/);
  await expect(tile(page,11)).toHaveClass(/guide-target/);
  await expect(page.locator('#status')).toContainText('Merge Cornmeal into its blocked space to make room');
  expect(await saved(page)).toEqual(state);
  await tile(page,11).click();
  expect(await saved(page)).toEqual(act(state,{type:'move',from:22,to:11}));
  await expect(tile(page,31)).toHaveClass(/guide-target/);
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.drinks_3.name}`})).toBeVisible();
});

test('a full-board guide ignores blocked pairs and explains when no action makes room',async({page})=>{
  const state=fullBoard('bakery_6');state.discovered.push('bakery_3');
  await page.setViewportSize({width:390,height:844});await start(page,state);
  await guide(page,'bakery_3');
  await expect(page.locator('#board .guide-target')).toHaveCount(0);
  await expect(page.locator('#board .selected')).toHaveCount(0);
  await expect(page.locator('#status')).toContainText('No delivery or merge can free space');
  await expect(page.getByRole('button',{name:`Stop guide for ${data.items.bakery_3.name}`})).toBeFocused();
  expect(await saved(page)).toEqual(state);
  await tile(page,1).click();
  await expect(page.locator('#status')).toContainText('No delivery or merge can free space');
  await expect(page.locator('#item-detail.guided')).toContainText('No delivery or merge can free space');
  expect(await saved(page)).toEqual(state);
});
