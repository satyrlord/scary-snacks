import { expect, test } from '@playwright/test';
import { data, onTicket, quest, replaceSave, saved, scrollFullyIntoView, startStill, supply, ticket, tile } from './support.ts';

for(const theme of ['light','dark'])for(const [width,height] of [[320,740],[360,640],[390,844]])test(`phone quest names and portion counts fit ${width}px in ${theme}`,async({page})=>{
  await page.setViewportSize({width,height});
  const order=quest('monica-first-pack');
  await startStill(page,onTicket(order),theme);
  for(const current of [order,quest('janos-first-pack')]){
    if(current!==order)await replaceSave(page,onTicket(current));
    const card=ticket(page,current);
    const pageFlow=await page.locator('#drawer').evaluate(element=>getComputedStyle(element).position==='static');
    if(pageFlow){await card.scrollIntoViewIfNeeded();await expect(card).toBeInViewport({ratio:1});}
    await expect(card.locator('.ticket-name')).toBeVisible();
    await expect(card.locator('.ticket-name')).toHaveText(data.characters.find(value=>value.id===current.character)!.name);
    await expect(card.locator('.ticket-count')).toHaveText(current.requirements.map(value=>`0/${value.quantity}`));
    for(const count of await card.locator('.ticket-count').all())await expect(count).toBeVisible();
    expect(await card.evaluate(element=>{
      const card=element.getBoundingClientRect(),counts=[...element.querySelectorAll('.ticket-count')].map(node=>node.getBoundingClientRect());
      return counts.every((box,index)=>box.left>=card.left&&box.right<=card.right&&box.top>=card.top&&box.bottom<=card.bottom
        &&counts.every((other,at)=>at===index||box.right<=other.left||other.right<=box.left||box.bottom<=other.top||other.bottom<=box.top));
    })).toBe(true);
    await expect(card.locator('.deliver-button')).toBeHidden();
    const face=(await card.locator('.ticket-face').boundingBox())!;
    expect(face.width).toBeGreaterThanOrEqual(44);expect(face.height).toBeGreaterThanOrEqual(44);
    if(pageFlow)for(const selector of ['#board','.source-tray','.line-slot','.phone-bar']){
      await scrollFullyIntoView(page.locator(selector));
    }
    expect(await page.evaluate(pageFlow=>document.documentElement.scrollWidth<=innerWidth&&(pageFlow||document.documentElement.scrollHeight<=innerHeight),pageFlow)).toBe(true);
    await card.locator('.ticket-face').click();await expect(page.getByRole('dialog',{name:current.title,exact:true})).toBeVisible();
    await expect(page.locator('#modal .quest-count').first()).toHaveText(`0 / ${current.requirements[0].quantity} on board`);
    await page.keyboard.press('Escape');await expect(card.locator('.ticket-face')).toBeFocused();
  }
  // Counter progress changes with the saved board, without reopening the order.
  await replaceSave(page,supply(onTicket(order),[order.requirements[0].item]));
  await expect(ticket(page,order).locator('.ticket-count').first()).toHaveText(`1/${order.requirements[0].quantity}`);
  expect((await saved(page)).board.some(cell=>cell?.code===order.requirements[0].item)).toBe(true);
});

for(const theme of ['light','dark'])test(`the compact desktop keeps its board and instructions on screen in ${theme}`,async({page})=>{
  await page.setViewportSize({width:1280,height:720});await startStill(page,undefined,theme);
  const fits=()=>page.evaluate(()=>{
    const selectors=['#board','.line-slot','.mara-line'];
    return document.documentElement.scrollHeight<=innerHeight&&selectors.every(selector=>{
      const box=document.querySelector(selector)!.getBoundingClientRect();return box.top>=0&&box.bottom<=innerHeight;
    });
  });
  expect(await fits()).toBe(true);
  await tile(page,13).click();
  expect(await page.locator('#item-detail').evaluate(element=>element.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
  // At 1280px the width sets the cell, as the board shares the kitchen with the source rack.
  expect((await tile(page,0).boundingBox())!.width).toBeGreaterThanOrEqual(42);
});
