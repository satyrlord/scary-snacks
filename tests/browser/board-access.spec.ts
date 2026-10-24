import { test, expect } from '@playwright/test';
import { actOne, saved, start, tile, ratio, prologueAt, data } from './support.ts';
import { unresolvedObstacle } from '../../src/model.ts';

for(const input of ['keyboard','touch'] as const)test(`dish actions sell and swap on a full board with ${input}`,async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
  try {
    const initial=actOne();initial.board=initial.board.map((cell,index)=>unresolvedObstacle(initial,index,data)?null:cell??{code:'herbs_1'});
    await start(page,initial);
    const activate=async(selector: string)=>{
      const target=page.locator(selector);
      if(input==='touch')await target.tap();else{await target.focus();await page.keyboard.press('Enter');}
    };
    await activate('[data-cell="13"]');await activate('.dish-actions summary');
    if(input==='touch')await page.getByRole('button',{name:'Swap',exact:true}).tap();
    else{await page.keyboard.press('Tab');await page.keyboard.press('Enter');}
    await expect(tile(page,22)).toHaveClass(/swap-target/);
    await activate('[data-cell="22"]');
    const swapped=await saved(page);expect(swapped.board[22]?.code).toBe('grain_1');expect(swapped.board[13]?.code).toBe('corn_1');expect(swapped.clock).toEqual(initial.clock);
    await activate('.dish-actions summary');
    const sell=page.getByRole('button',{name:'Sell',exact:true});
    if(input==='touch')await sell.tap();else{await sell.focus();await page.keyboard.press('Enter');}
    await expect(page.getByRole('button',{name:'Keep it',exact:true})).toBeFocused();
    await page.keyboard.press('Escape');expect(await saved(page)).toEqual(swapped);
    if(input==='touch')await sell.tap();else{await sell.focus();await page.keyboard.press('Enter');}
    const confirm=page.getByRole('dialog').getByRole('button',{name:'Sell',exact:true});
    if(input==='touch')await confirm.tap();else{await confirm.focus();await page.keyboard.press('Enter');}
    const sold=await saved(page);expect(sold.board[22]).toBeNull();expect(sold.coins).toBe(initial.coins+1);expect(sold.clock).toEqual(initial.clock);
    await page.reload();expect(await saved(page)).toEqual(sold);
  }finally{await context.close();}
});

test('swap mode rejects empty, matching and blocked cells, cancels with Escape, and does not survive reload',async({page})=>{
  await start(page);const before=await saved(page);
  await tile(page,13).click();await page.locator('.dish-actions summary').click();await page.getByRole('button',{name:'Swap',exact:true}).click();
  for(const at of [8,14,0]){await tile(page,at).click();expect(await saved(page)).toEqual(before);await expect(tile(page,13)).toHaveAttribute('aria-pressed','true');}
  await page.keyboard.press('Escape');await expect(page.locator('.swap-target')).toHaveCount(0);
  await tile(page,13).click();await page.locator('.dish-actions summary').click();await page.getByRole('button',{name:'Swap',exact:true}).click();
  await page.locator('.dish-actions summary').focus();await page.keyboard.press('Escape');await expect(page.locator('.swap-target')).toHaveCount(0);await expect(tile(page,13)).toBeFocused();
  await page.locator('.dish-actions summary').click();await page.keyboard.press('Escape');await expect(page.locator('.dish-actions')).not.toHaveAttribute('open','');
  await tile(page,13).focus();await page.keyboard.press('Escape');
  await tile(page,13).click();await page.locator('.dish-actions summary').click();await page.getByRole('button',{name:'Swap',exact:true}).click();
  await page.reload();await expect(page.locator('.swap-target')).toHaveCount(0);expect(await saved(page)).toEqual(before);
});

test('the prologue has no Sell action',async({page})=>{
  const initial=prologueAt(1);await start(page,initial);const at=initial.board.findIndex(cell=>cell!==null);
  await tile(page,at).click();await page.locator('.dish-actions summary').click();await expect(page.getByRole('button',{name:'Sell',exact:true})).toHaveCount(0);
});

for(const release of [13,14])test(`Escape cancels a board drag released on cell ${release} and the next merge works`,async({page})=>{
  await start(page);const before=await saved(page),a=(await tile(page,13).boundingBox())!,b=(await tile(page,14).boundingBox())!;
  await tile(page,13).focus();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});
  await page.keyboard.press('Escape');await expect(page.locator('.drag-ghost')).toHaveCount(0);
  if(release===13)await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
  await page.mouse.up();expect(await saved(page)).toEqual(before);
  await tile(page,14).click();expect((await saved(page)).board[14]?.code).toBe('grain_2');
});

for(const theme of ['light','dark'])for(const viewport of [{width:1280,height:720},{width:390,height:844}])test(`board state marks have opaque contrast and actions fit at ${viewport.width} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});await start(page,actOne(),theme);await tile(page,13).click();
  for(const at of [13,14]){
    await tile(page,at).hover();
    const colors=await tile(page,at).evaluate(node=>{const s=getComputedStyle(node);return {line:s.outlineColor,track:s.boxShadow.match(/rgb\([^)]*\)/)?.[0]};});
    expect(colors.track).toBe('rgb(255, 246, 234)');expect(ratio(colors.line,colors.track!)).toBeGreaterThanOrEqual(3);
  }
  await tile(page,14).focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
  const focus=await tile(page,14).evaluate(node=>{const s=getComputedStyle(node);return {line:s.outlineColor,track:s.boxShadow.match(/rgb\([^)]*\)/)?.[0]};});
  expect(ratio(focus.line,focus.track!)).toBeGreaterThanOrEqual(3);
  await page.locator('.dish-actions summary').click();
  for(const action of await page.locator('.dish-actions-list button').all()){
    const box=(await action.boundingBox())!;expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);expect(box.y).toBeGreaterThanOrEqual(0);
  }
  await page.screenshot({path:testInfo.outputPath(`board-actions-${theme}-${viewport.width}.png`)});
});
