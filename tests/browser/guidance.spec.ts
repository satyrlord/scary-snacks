import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { firstFreeBoardCell } from '../../src/model.ts';
import { createGame } from '../../src/engine.ts';
import { data, dialogDeliver, openQuest, opened, recovery, saved, startStill, tile, validate } from './support.ts';

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
  test(`a refused source explains recovery in the visible strip at ${width} in ${theme}`,async({page})=>{
    await page.setViewportSize({width,height});await startStill(page,undefined,theme);
    const before=await saved(page);
    await tile(page,1).click();
    const refusal=page.locator('#item-detail .detail-feedback');
    await expect(refusal).toHaveText('The Windmill costs 1 coin for each take, and the purse cannot pay. Deliver a quest, or take free herbs from the Herb basket.');
    await visibleCopy(refusal,'#item-detail');
    expect(await saved(page)).toEqual(before);
    await expect(page.locator('#item-detail')).not.toContainText('Tap again');
    // A successful free take replaces the refusal, and saves only that ingredient.
    await tile(page,31).click();
    await expect(refusal).toHaveCount(0);
    await expect(page.locator('#item-detail')).toContainText('Tap again for Elderflowers: free.');
    expect((await saved(page)).coins).toBe(0);
    expect((await saved(page)).board.filter(Boolean)).toHaveLength(before.board.filter(Boolean).length+1);
    await tile(page,1).click();await expect(refusal).toBeVisible();
    await page.getByRole('button',{name:'Clear selection',exact:true}).click();
    await expect(refusal).toHaveCount(0);
    await tile(page,13).click();await expect(page.locator('#item-detail')).not.toContainText('cannot pay');
  });

  test(`the opening tea earns its stated reward at ${width} in ${theme}`,async({page})=>{
    await page.setViewportSize({width,height});await startStill(page,undefined,theme);
    await expect(page.locator('#status')).toHaveText('Merge two Socată into Linden tea. Deliver to Ana for 14 coins.');
    await visibleCopy(page.locator('#status'),'.mara-line');
    await tile(page,32).click();
    const guidance=page.locator('#item-detail .detail-onboarding');
    await expect(guidance).toHaveText('Tap the other Socată. Deliver the tea to Ana for 14 coins.');
    await visibleCopy(guidance,'#item-detail');
    await tile(page,33).click();
    await expect(guidance).toHaveText('Deliver to Ana for 14 coins.');
    await visibleCopy(guidance,'#item-detail');
    expect((await saved(page)).board[33]?.code).toBe('herbs_4');
    expect((await saved(page)).coins).toBe(0);
    await openQuest(page,recovery);await dialogDeliver(page,recovery).click();
    expect((await saved(page)).coins).toBe(14);
    expect((await saved(page)).board[33]).toBeNull();
    await page.reload();await opened(page);
    await expect(page.locator('#status')).toHaveText('Welcome back. The stove is still warm.');
    await expect(page.locator('#item-detail .detail-onboarding')).toHaveCount(0);
  });
}

test('a full board shows the refused take and keeps its saved board intact',async({page})=>{
  const state=createGame(data);
  for(let at=firstFreeBoardCell(state,data);at>=0;at=firstFreeBoardCell(state,data))state.board[at]={code:'herbs_1'};
  expect(validate(state)).toBe(true);
  await page.setViewportSize({width:390,height:844});await startStill(page,state);
  const before=await saved(page);
  await tile(page,31).click();
  await expect(page.locator('#item-detail .detail-feedback')).toHaveText('The board is full. Merge a pair or deliver a quest.');
  await visibleCopy(page.locator('#item-detail .detail-feedback'),'#item-detail');
  expect(await saved(page)).toEqual(before);
  await tile(page,32).click();
  await expect(page.locator('#item-detail .detail-feedback')).toHaveCount(0);
});
