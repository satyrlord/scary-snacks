import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { firstFreeBoardCell } from '../../src/model.ts';
import { checkpoint, data, opened, saved, startNewGame, startStill, tile, validate , source } from './support.ts';

/** The actual text fits its visible region and stays above the phone controls, without clipped lines. */
async function visibleCopy(target: Locator, region: string) {
  await expect(target).toBeVisible();
  expect(await target.evaluate((node,selector)=>{
    const container=document.querySelector(selector)!.getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(node);
    const bar=document.querySelector('.phone-bar')!;
    const bottom=bar.checkVisibility()?bar.getBoundingClientRect().top:innerHeight;
    return [...range.getClientRects()].every(rect=>rect.width>0&&rect.height>0
      &&rect.left>=Math.max(0,container.left)-1&&rect.right<=Math.min(innerWidth,container.right)+1
      &&rect.top>=Math.max(0,container.top)-1&&rect.bottom<=Math.min(bottom,container.bottom)+1);
  },region)).toBe(true);
}

for(const theme of ['light','dark'])for(const [width,height] of [[360,640],[390,844],[1280,720]]) {
  test(`Escape from a guided source stops the guide and keeps focus at ${width} in ${theme}`,async({page})=>{
    const initial=checkpoint(0);initial.board[13]=null;initial.board[14]=null;
    await page.setViewportSize({width,height});await startStill(page,initial,theme);
    await page.locator('#recipes-button:visible,#collection-button:visible').first().click();
    await page.getByRole('button',{name:data.items.grain_2.name,exact:true}).click();
    await page.getByRole('button',{name:'Show me on the board',exact:true}).click();
    const windmill=source(page,'grain');
    await expect(windmill).toHaveClass(/guide-target/);await expect(windmill).toBeFocused();
    await expect(page.getByRole('button',{name:`Stop guide for ${data.items.grain_2.name}`,exact:true})).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#sources .guide-target')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Find a match',exact:true})).toBeVisible();
    await expect(windmill).toBeFocused();
    await expect(page.locator('#status')).toHaveText('Tap an item, then tap where it should go.');
    expect(await saved(page)).toEqual(initial);
  });

  test(`a refused source explains recovery in Mara's visible line at ${width} in ${theme}`,async({page})=>{
    // An empty purse in act 1: the Windmill refuses a take, and the Herb basket gives one for free.
    await page.setViewportSize({width,height});await startStill(page,checkpoint(0),theme);
    const before=await saved(page);
    await source(page,'grain').click();
    const line=page.locator('#status');
    await expect(line).toHaveText('The Windmill costs 1 coin for each take, and the purse cannot pay. Deliver a quest, or take free herbs from the Herb basket.');
    await visibleCopy(line,'.mara-line');
    expect(await saved(page)).toEqual(before);
    // A successful free take replaces the refusal, and saves only that ingredient.
    await source(page,'herbs').click();
    await expect(line).toHaveText(`Took ${data.items.herbs_1.name}.`);
    expect((await saved(page)).coins).toBe(0);
    expect((await saved(page)).board.filter(Boolean)).toHaveLength(before.board.filter(Boolean).length+1);
    await source(page,'grain').click();await expect(line).toContainText('cannot pay');
    await tile(page,13).click();await expect(line).not.toContainText('cannot pay');await expect(page.locator('#item-detail')).not.toContainText('cannot pay');
  });

  test(`a new game points to the first quest, which is ready to serve, at ${width} in ${theme}`,async({page})=>{
    await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});await startNewGame(page,theme);
    await expect(page.locator('#modal-title')).toHaveText(data.prologue.events[0].opening.title);await page.keyboard.press('Escape');
    await expect(page.locator('#status')).toHaveText('Mama’s dishes are ready on the board. Serve them from the ticket.');
    await visibleCopy(page.locator('#status'),'.mara-line');
    const [first]=data.prologue.events[0].quests;
    const serve=page.locator(`#tickets .ticket[data-quest="${first.id}"] .deliver-button`);
    // On phones, the ticket opens the quest dialog, which serves.
    if(await serve.isVisible())await serve.click();
    else{await page.locator(`#tickets .ticket[data-quest="${first.id}"] .ticket-face`).click();await page.getByRole('dialog').getByRole('button',{name:`Serve ${first.title}`,exact:true}).click();}
    await expect.poll(async()=>(await saved(page)).completedQuests).toEqual([first.id]);
    expect((await saved(page)).coins).toBe(0);
    await page.reload();await opened(page);
    // The closed opening scene is still pending.
    await expect(page.locator('#status')).toHaveText('Welcome back. The stove is still warm. A story scene is waiting in Story.');
  });
}

test('a full board shows the refused take and keeps its saved board intact',async({page})=>{
  const state=checkpoint(0);
  for(let at=firstFreeBoardCell(state,data);at>=0;at=firstFreeBoardCell(state,data))state.board[at]={code:'herbs_1'};
  expect(validate(state)).toBe(true);
  await page.setViewportSize({width:390,height:844});await startStill(page,state);
  const before=await saved(page);
  await source(page,'herbs').click();
  await expect(page.locator('#status')).toHaveText('The board is full. Merge a pair or deliver a quest.');
  await visibleCopy(page.locator('#status'),'.mara-line');
  expect(await saved(page)).toEqual(before);
  await tile(page,32).click();
  await expect(page.locator('#item-detail .detail-feedback')).toHaveCount(0);
});
