import { test, expect } from '@playwright/test';
import { checkpoint, data, journal, onTicket, quest, replaceSave, start } from './support.ts';

test('every portrait crop stays inside its own cell at ticket and story sizes',async({page},testInfo)=>{
  await start(page,checkpoint(data.tasks.length));
  await expect(page.locator('.mara-line .portrait')).toHaveAttribute('aria-label','Mara, the bistro owner');
  const line=await page.locator('.mara-line .portrait').evaluate(element=>{
    const style=getComputedStyle(element);return {size:style.backgroundSize,position:style.backgroundPosition};
  });
  const portraits: {name:string;className:string;size:string;position:string}[]=[];
  for(const state of [null,onTicket(quest('ionatan-castle-dinner')),onTicket(quest('mina-avram-search'))]){
    if(state)await replaceSave(page,state);
    await journal(page);
    const visible=await page.locator('#modal .portrait').evaluateAll(elements=>elements.map(element=>({
      name:element.getAttribute('aria-label')!,className:element.className,size:getComputedStyle(element).backgroundSize,position:getComputedStyle(element).backgroundPosition,
    })));
    for(const portrait of visible)if(!portraits.some(value=>value.name===portrait.name))portraits.push(portrait);
    await page.keyboard.press('Escape');
  }
  expect(portraits.map(value=>value.name).sort()).toEqual(data.characters.map(value=>value.name).sort());
  // Clone portraits that the actual journal rendered, retaining their production styles and atlas mapping.
  await page.evaluate(portraits=>{
    const gallery=document.createElement('div');gallery.id='portrait-framing-gallery';
    Object.assign(gallery.style,{position:'absolute',inset:'0',zIndex:'10000',background:'var(--panel)',padding:'20px',display:'grid',gridTemplateColumns:'repeat(4,340px)',gap:'12px'});
    for(const portrait of portraits){
      const row=document.createElement('div'),label=document.createElement('p');label.textContent=portrait.name;row.append(label);
      for(const size of [22,36,44,82,120]){
        const face=document.createElement('span');face.className=portrait.className;face.style.backgroundSize=portrait.size;face.style.backgroundPosition=portrait.position;face.setAttribute('aria-label',portrait.name);
        Object.assign(face.style,{width:`${size}px`,height:`${size}px`,display:'inline-block',verticalAlign:'top'});row.append(face);
      }
      gallery.append(row);
    }
    document.body.append(gallery);
  },portraits);
  await page.setViewportSize({width:1440,height:1100});
  const mara=page.locator('#portrait-framing-gallery .portrait[aria-label="Mara"]').first();
  await expect(mara).toHaveCSS('background-size',line.size);
  await expect(mara).toHaveCSS('background-position',line.position);
  for(const theme of ['light','dark']){
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    const frames=await page.locator('#portrait-framing-gallery .portrait').evaluateAll(elements=>elements.map(element=>{
      const style=getComputedStyle(element),side=200/parseFloat(style.backgroundSize),position=style.backgroundPosition.split(' ').map(parseFloat);
      return {name:element.getAttribute('aria-label'),side,x:position[0]/100*(2-side),y:position[1]/100*(2-side),filter:style.filter};
    }));
    for(const frame of frames){
      const person=data.characters.find(value=>value.name===frame.name)!;
      expect(frame.side,person.id).toBeGreaterThan(.7);expect(frame.side,person.id).toBeLessThan(.9);
      expect(frame.x,person.id).toBeGreaterThanOrEqual(person.sprite%2-.00001);
      expect(frame.y,person.id).toBeGreaterThanOrEqual(Math.floor(person.sprite/2)-.00001);
      expect(frame.x+frame.side,person.id).toBeLessThanOrEqual(person.sprite%2+1.00001);
      expect(frame.y+frame.side,person.id).toBeLessThanOrEqual(Math.floor(person.sprite/2)+1.00001);
      expect(frame.filter,person.id).toBe('none');
    }
    await page.screenshot({path:testInfo.outputPath(`portrait-framing-${theme}.png`),fullPage:true});
  }
});
