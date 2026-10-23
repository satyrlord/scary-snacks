import { test, expect } from '@playwright/test';
import { checkpoint, data, know, ratio, replaceSave, saved, startStill, supply, tile } from './support.ts';

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}])for(const theme of ['light','dark']){
  test(`recipe book browsing fits ${viewport.width}px in ${theme}`,async({page},testInfo)=>{
    const state=checkpoint(data.tasks.length);know(state,...Object.values(data.items).filter(item=>!item.generator).map(item=>item.id));
    await page.setViewportSize(viewport);await startStill(page,state,theme);
    const opener=page.locator(viewport.width<1024?'#recipes-button':'#collection-button');await opener.click();
    const book=page.getByRole('dialog',{name:'The recipe book',exact:true}),body=page.locator('#modal-body');
    const heading=book.locator('.modal-heading'),close=page.getByRole('button',{name:'Close dialog'});
    await expect(close).toBeFocused();const top=(await heading.boundingBox())!.y;
    await page.keyboard.press('Tab');const picker=book.getByLabel('Jump to a section');await expect(picker).toBeFocused();
    await expect(picker).toHaveCSS('outline-width','3px');await expect(picker).toHaveCSS('outline-style','solid');
    const sections=book.locator('.recipe-chain');
    const first=(await sections.nth(0).boundingBox())!,second=(await sections.nth(1).boundingBox())!;
    if(viewport.width>800){expect(second.y).toBe(first.y);expect(second.x).toBeGreaterThan(first.x);expect((await book.boundingBox())!.width).toBeGreaterThan(1000);}
    else expect(second.y).toBeGreaterThan(first.y);
    const help=book.getByText('How the recipe book works',{exact:true});await help.click();
    await expect(book.locator('.recipe-help')).toHaveAttribute('open','');
    await page.screenshot({path:testInfo.outputPath('recipe-top.png')});
    await book.getByLabel('Jump to a section').selectOption({label:'Mixed dishes'});
    await expect(sections.last().locator('h3')).toBeFocused();
    await page.keyboard.press('Tab');await expect(sections.last().locator('button').first()).toBeFocused();
    const entry=sections.last().locator('button').last();await entry.scrollIntoViewIfNeeded();
    const scroll=await body.evaluate(node=>node.scrollTop);expect(scroll).toBeGreaterThan(0);
    expect((await heading.boundingBox())!.y).toBe(top);await expect(close).toBeInViewport();
    for(const target of [book,body])expect(await target.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
    const colors=await book.evaluate(node=>{const style=getComputedStyle(node);return {background:style.backgroundColor,ink:style.color,muted:style.getPropertyValue('--muted')};});
    expect(ratio(colors.background,colors.ink)).toBeGreaterThanOrEqual(4.5);
    // Resolve the muted token to an RGB colour before measuring it.
    const muted=await book.locator('.modal-copy').evaluate(node=>getComputedStyle(node).color);
    expect(ratio(colors.background,muted)).toBeGreaterThanOrEqual(4.5);
    await page.screenshot({path:testInfo.outputPath('recipe-bottom.png')});
    await entry.click();await page.keyboard.press('Escape');await expect(entry).toBeFocused();
    expect(Math.abs(await body.evaluate(node=>node.scrollTop)-scroll)).toBeLessThanOrEqual(2);
    await expect(book.locator('.recipe-help')).toHaveAttribute('open','');
    const box=(await book.boundingBox())!;
    await page.mouse.click(box.x+2,box.y+2);await expect(book).toBeVisible();
    await page.mouse.move(box.x+2,box.y+2);await page.mouse.down();await page.mouse.move(2,2);await page.mouse.up();await expect(book).toBeVisible();
    await page.mouse.click(2,2);await expect(book).toBeHidden();await expect(opener).toBeFocused();
    expect(await saved(page)).toEqual(state);
    await opener.click();await expect(body).toHaveJSProperty('scrollTop',0);await page.keyboard.press('Escape');await expect(opener).toBeFocused();
  });
}

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark']){
  test(`seasonal dish help explains a departed source and still guides leftover merges at ${viewport.width}px in ${theme}`,async({page},testInfo)=>{
    const state=checkpoint(24);know(state,'pickles_1','pickles_2');
    expect(state.board.some(cell=>cell?.code==='generator_pickles')).toBe(false);
    await page.setViewportSize(viewport);await startStill(page,state,theme);
    const opener=page.locator(viewport.width<1024?'#recipes-button':'#collection-button');
    await opener.click();await page.getByRole('button',{name:'Gherkins',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Gherkins',exact:true});
    await expect(dialog.locator('.item-how')).toHaveText('The Pickle barrel supplies Gherkins.');
    await expect(dialog.locator('.seasonal-source-note')).toHaveText('The pickle barrel is empty until next winter. You can still merge dishes left on the board.');
    await expect(dialog.getByRole('button',{name:'Show me on the board'})).toHaveCount(0);
    expect(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath('departed-source.png')});
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    const leftovers=supply(state,['pickles_1','pickles_1']);await replaceSave(page,leftovers);
    await opener.click();await page.getByRole('button',{name:'Pickled green tomatoes',exact:true}).click();
    await page.getByRole('button',{name:'Show me on the board'}).click();
    await expect(page.locator('#status')).toHaveText('Merge two Gherkins to make Pickled green tomatoes.');
    await expect(tile(page,leftovers.board.findIndex(cell=>cell?.code==='pickles_1'))).toBeFocused();
    expect(await saved(page)).toEqual(leftovers);
  });
}
