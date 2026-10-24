import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { checkpoint, painting, payAndRead, revealed, start, startStill } from './support.ts';

for(const theme of ['light','dark'])test(`a short phone shows the whole New pin target above the lowered drawer in ${theme}`,async({page})=>{
  await page.setViewportSize({width:360,height:640});await startStill(page,checkpoint(6),theme);
  await expect.poll(()=>painting(page)).toMatch(/^front-room-/);
  // This short phone has no room above the raised drawer for the pin, so the player lowers the drawer to see it.
  await expect(page.locator('#room-pin')).toHaveAttribute('data-covered','');await page.locator('#drawer-handle').click();
  await expect(page.locator('#room-pin')).not.toHaveAttribute('data-covered');
  await expect.poll(()=>page.evaluate(()=>{
    const pin=document.querySelector<HTMLElement>('#room-pin')!,box=pin.getBoundingClientRect(),extension=getComputedStyle(pin,'::before');
    const left=box.left+parseFloat(extension.left),right=box.right-parseFloat(extension.right);
    const top=box.top+parseFloat(extension.top),bottom=box.bottom-parseFloat(extension.bottom);
    const room=document.querySelector('#room-stage')!.getBoundingClientRect(),drawer=document.querySelector('#drawer')!.getBoundingClientRect();
    const points=[left+1,(left+right)/2,right-1].flatMap(x=>[top+1,(top+bottom)/2,bottom-1].map(y=>({x,y})));
    return {height:bottom-top,inside:left>=room.left&&right<=room.right&&top>=room.top&&bottom<=drawer.top,
      allReachable:points.every(({x,y})=>pin.contains(document.elementFromPoint(x,y)))};
  })).toEqual({height:44,inside:true,allReachable:true});
  const pin=page.locator('#room-pin'),box=(await pin.boundingBox())!;
  // The lower-left transparent edge must dispatch the action, not raise the kitchen with the handle behind it.
  await page.mouse.click(box.x-3,box.y+box.height+7);
  await expect(page.locator('#status')).toHaveText((await pin.getAttribute('aria-label'))!.replace(/^New: /,''));
  await expect(page.locator('#modal')).not.toBeVisible();
  await expect(page.locator('#drawer-handle')).toHaveAttribute('aria-expanded','false');
});

test('the bat crosses the repaired glass while the painted mullion and transoms stay unchanged',async({page},testInfo)=>{
  await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});
  await start(page,checkpoint(0,{ready:true}),'dark');await expect.poll(()=>painting(page)).toMatch(/^front-room-00-/);
  // The broken window has four different panes. It does not show the flight layer before the first repair.
  await expect(page.locator('.window-sky')).toBeHidden();await expect(page.locator('.window-sky .bat')).toHaveCount(0);
  await page.evaluate(()=>{
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(...args){const animation=animate.apply(this,args);if(this.classList.contains('bat'))animation.pause();return animation;};
  });
  await payAndRead(page);await revealed(page);
  const bat=page.locator('.window-sky .bat');await expect(bat).toHaveCount(1);
  await expect.poll(()=>painting(page)).toMatch(/^front-room-01-/);
  const window=page.locator('.window-sky');
  await bat.evaluate(element=>{for(const animation of element.getAnimations()){animation.pause();animation.currentTime=0;}element.setAttribute('style','visibility:hidden');});
  const baseline=await sharp(await window.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});
  await bat.evaluate(element=>(element as HTMLElement).style.removeProperty('visibility'));
  let visiblePixels=0,unclippedWoodPixels=0;
  for(const time of [1200,1700]){
    await bat.evaluate((element,time)=>{for(const animation of element.getAnimations())if(animation.effect?.getTiming().duration===2600)animation.currentTime=time;},time);
    const clippedImage=await window.screenshot(),clipped=await sharp(clippedImage).removeAlpha().raw().toBuffer();
    await testInfo.attach(`bat-behind-wood-${time}`,{body:clippedImage,contentType:'image/png'});
    await page.locator('.window-flight').evaluate(element=>(element as HTMLElement).style.clipPath='none');
    const unclipped=await sharp(await window.screenshot()).removeAlpha().raw().toBuffer();
    await page.locator('.window-flight').evaluate(element=>(element as HTMLElement).style.removeProperty('clip-path'));
    let changedWood=0;
    for(let y=0;y<baseline.info.height;y++)for(let x=0;x<baseline.info.width;x++){
      const offset=(y*baseline.info.width+x)*3,changed=(pixels: Buffer)=>[0,1,2].some(channel=>Math.abs(pixels[offset+channel]-baseline.data[offset+channel])>3);
      const px=x/baseline.info.width,py=y/baseline.info.height;
      // Interior samples of the painted central mullion and the two crossbars, away from antialiasing at their glass edges.
      const wood=px>.45&&px<.55||py>.312&&py<.327||py>.65&&py<.668;
      if(wood){if(changed(clipped))changedWood++;if(changed(unclipped))unclippedWoodPixels++;}
      else if(changed(clipped))visiblePixels++;
    }
    expect(changedWood,`painted wood changed at ${time}ms`).toBe(0);
  }
  expect(visiblePixels,'the bat remains visible through the glass').toBeGreaterThan(30);
  expect(unclippedWoodPixels,'the sampled flight would cross the wood without the clip').toBeGreaterThan(15);
});
