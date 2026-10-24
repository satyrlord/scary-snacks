import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { canDeliverQuest, canLightLanterns, resolveQuests } from '../../src/model.ts';
import { moveTo } from '../../tools/create-checkpoint-saves.ts';
import { act, actOne, actOneTasks, atBookingTime, checkpoint, data, dialogDeliver, onTicket, openQuest, quest, ratio, replaceSave, saved, startStill, supper, supperEvening, supplies, supply, ticket } from './support.ts';

/** Counts must remain legible even when an ancestor dims the pictures of a later ticket. */
async function readableCounts(counts: Locator){
  for(const count of await counts.all()){
    await expect(count).toBeVisible();
    const colors=await count.evaluate(element=>{
      const style=getComputedStyle(element);let opacity=1,background=style.backgroundColor;
      for(let node: Element|null=element;node;node=node.parentElement){
        const current=getComputedStyle(node);opacity*=Number(current.opacity);
        if(background==='rgba(0, 0, 0, 0)')background=current.backgroundColor;
      }
      const foreground=style.color.match(/[\d.]+/g)!.map(Number),paper=background.match(/[\d.]+/g)!.map(Number);
      const alpha=opacity*(foreground[3]??1);
      return {opacity,background,foreground:`rgb(${foreground.slice(0,3).map((value,index)=>value*alpha+paper[index]*(1-alpha)).join(', ')})`};
    });
    expect(colors.opacity).toBe(1);expect(ratio(colors.foreground,colors.background)).toBeGreaterThanOrEqual(4.5);
  }
}

async function phoneFits(page: Page,line='#status'){
  for(const selector of ['#board',line,'.phone-bar','#tickets'])await expect(page.locator(selector)).toBeInViewport({ratio:1});
  for(const status of await page.locator('.ticket-status').all()){
    await expect(status).toBeVisible();
    expect(await status.evaluate(element=>element.scrollWidth<=element.clientWidth+1&&element.scrollHeight<=element.clientHeight+1)).toBe(true);
  }
  for(const face of await page.locator('.ticket-face').all()){
    const box=(await face.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

async function loweredTicketsFit(page: Page){
  await page.locator('#drawer-handle').click();await expect(page.locator('#drawer-handle')).toHaveAttribute('aria-expanded','false');
  const bar=(await page.locator('.phone-bar').boundingBox())!;
  for(const status of await page.locator('.ticket-status').all()){
    await expect(status).toBeInViewport({ratio:1});const box=(await status.boundingBox())!;
    expect(box.y+box.height).toBeLessThanOrEqual(bar.y);
  }
  await page.locator('#drawer-handle').click();await expect(page.locator('#drawer-handle')).toHaveAttribute('aria-expanded','true');
}

/** A ready action and its reward are available before the reader reaches the picture and conversation. */
async function readyAction(page: Page,action: Locator){
  await expect(action).toBeEnabled();await expect(action).toBeInViewport({ratio:1});
  await expect(page.locator('#modal .quest-actions button')).toHaveCount(1);
  const reward=page.locator('#modal .quest-reward'),reading=page.locator('#modal .quest-reading');
  await expect(reward).toBeInViewport({ratio:1});
  const actionBox=(await action.boundingBox())!,rewardBox=(await reward.boundingBox())!,readingBox=(await reading.boundingBox())!;
  expect(actionBox.y+actionBox.height).toBeLessThanOrEqual(readingBox.y);expect(rewardBox.y+rewardBox.height).toBeLessThanOrEqual(readingBox.y);
  expect(await page.locator('#modal').evaluate(element=>element.scrollTop)).toBe(0);
}

for(const theme of ['light','dark'])test(`phone tickets show the whole order state and readable later counts in ${theme}`,async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const welcome=quest('mara-welcome'),initial=checkpoint(0),ready=supply(initial,supplies(welcome));
  expect(canDeliverQuest(initial,welcome,data)).toBe(false);expect(canDeliverQuest(ready,welcome,data)).toBe(true);
  await startStill(page,initial,theme);await expect(ticket(page,welcome).locator('.ticket-status')).toHaveText('Prepare');await phoneFits(page);
  await replaceSave(page,ready);await expect(ticket(page,welcome).locator('.ticket-status.ready')).toHaveText('Deliver');
  await openQuest(page,welcome);await readyAction(page,dialogDeliver(page,welcome));
  await dialogDeliver(page,welcome).click();expect((await saved(page)).completedQuests).toContain(welcome.id);
  const future=quest('victor-dragobete'),before=act(checkpoint(2,{ready:true}),{type:'task'});moveTo(before,7,data);
  await replaceSave(page,before);await expect(ticket(page,future).locator('.ticket-status')).toHaveText('Later');
  await readableCounts(ticket(page,future).locator('.ticket-count'));
  const prepared=supply(before,supplies(future));expect(canDeliverQuest(prepared,future,data)).toBe(false);
  await replaceSave(page,prepared);await expect(ticket(page,future).locator('.ticket-status')).toHaveText('Later');
  await expect(ticket(page,future).locator('.ticket-status.ready')).toHaveCount(0);await readableCounts(ticket(page,future).locator('.ticket-count'));
  await openQuest(page,future);await expect(page.locator('#modal .quest-actions button')).toBeDisabled();
});

test('a phone booking shows Prepare, then Light lanterns, then Deliver after the clock changes',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const dinner=quest('vlad-after-dark'),morning=atBookingTime(onTicket(dinner),dinner);morning.clock.merges=0;
  const prepared=supply(morning,supplies(dinner));expect(canLightLanterns(morning,dinner,data)).toBe(false);expect(canLightLanterns(prepared,dinner,data)).toBe(true);
  await startStill(page,morning);await expect(ticket(page,dinner).locator('.ticket-status')).toHaveText('Prepare');
  await expect(ticket(page,dinner).locator('.ticket-wait .lantern-mark')).toBeVisible();
  await replaceSave(page,prepared);await expect(ticket(page,dinner).locator('.ticket-status.ready')).toHaveText('Light lanterns');
  await openQuest(page,dinner);const lanterns=page.locator('#modal .quest-actions').getByRole('button',{name:'Light the lanterns: Vlad is booked for 20:00'});
  await readyAction(page,lanterns);await expect(page.locator('#modal .quest-booking')).toBeInViewport({ratio:1});await lanterns.click();
  expect(canDeliverQuest(await saved(page),dinner,data)).toBe(true);await expect(ticket(page,dinner).locator('.ticket-status.ready')).toHaveText('Deliver');
  await openQuest(page,dinner);await readyAction(page,dialogDeliver(page,dinner));await dialogDeliver(page,dinner).click();
  expect((await saved(page)).completedQuests).toContain(dinner.id);
});

for(const theme of ['light','dark'])test(`a 320px phone keeps four recovery tickets, the board, and controls in view in ${theme}`,async({page})=>{
  await page.setViewportSize({width:320,height:844});await startStill(page,checkpoint(0),theme);
  await expect(page.locator('#tickets .ticket')).toHaveCount(4);await phoneFits(page);await readableCounts(page.locator('#tickets .ticket-count'));await loweredTicketsFit(page);
  // This evening has four tickets, including a long order, and the longest ready status.
  const dinner=quest('vlad-after-dark'),morning=atBookingTime(onTicket(dinner),dinner);morning.clock.merges=0;morning.coins=0;
  await replaceSave(page,supply(morning,supplies(dinner)));await expect(page.locator('#tickets .ticket')).toHaveCount(4);
  await expect(ticket(page,dinner).locator('.ticket-status.ready')).toHaveText('Light lanterns');
  await phoneFits(page);await loweredTicketsFit(page);
});

for(const theme of ['light','dark'])test(`a long order reports hidden portions and becomes ready only with every plate on a 320px phone in ${theme}`,async({page})=>{
  await page.setViewportSize({width:320,height:844});
  const initial=supperEvening(checkpoint(actOneTasks,{coins:data.economy.recoveryFloor})),visible=supper.requirements.slice(0,3).flatMap(({item,quantity})=>Array<string>(quantity).fill(item));
  const hidden=supper.requirements.slice(3).flatMap(({item,quantity})=>Array<string>(quantity).fill(item));
  await startStill(page,initial,theme);const card=ticket(page,supper),more=card.locator('.ticket-more');
  await expect(more.locator('.ticket-count')).toHaveText(`0/${hidden.length}`);await expect(more.locator('.ticket-more-label')).toHaveText('more');
  await expect(more).toHaveAttribute('aria-label',`0 of ${hidden.length} additional portions on the board`);
  await replaceSave(page,supply(initial,[...visible,hidden[0]]));
  await expect(card.locator('.ticket-item.ready:not(.ticket-more)')).toHaveCount(3);await expect(card.locator('.ticket-status')).toHaveText('Prepare');
  await expect(more.locator('.ticket-count')).toHaveText(`1/${hidden.length}`);await expect(more).toHaveAttribute('aria-label',`1 of ${hidden.length} additional portions on the board`);
  await phoneFits(page);await readableCounts(card.locator('.ticket-count'));
  await replaceSave(page,supply(initial,[...visible,...hidden]));await expect(more.locator('.ticket-count')).toHaveText(`${hidden.length}/${hidden.length}`);
  await expect(card.locator('.ticket-status.ready')).toHaveText('Serve');await phoneFits(page);await readableCounts(card.locator('.ticket-count'));await loweredTicketsFit(page);
  await openQuest(page,supper);const serve=page.locator('#modal .quest-actions').getByRole('button',{name:`Serve ${supper.title}`,exact:true});
  await readyAction(page,serve);await serve.click();expect((await saved(page)).completedQuests).toContain(supper.id);
});

for(const theme of ['light','dark'])for(const width of [1440,390,320])test(`the waiting count has a clear target and opens its list at ${width}px in ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:width===1440?900:844});
  const start=actOne(),waiting=resolveQuests(start,data).filter(view=>view.status==='waiting').map(view=>view.quest).slice(0,2);
  expect(waiting).toHaveLength(2);
  await startStill(page,{...start,coins:20,steppedBack:waiting.map(value=>value.id)},theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  for(const coins of [20,0]){
    await replaceSave(page,{...start,coins,steppedBack:waiting.map(value=>value.id)});
    const count=page.locator('#tickets .ticket').nth(2).locator('.waiting-count');
    await expect(count).toHaveText('+2');await expect(count).toHaveAccessibleName('2 quests wait for a ticket');await expect(count).toBeInViewport({ratio:1});
    const box=(await count.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
    // The full target must receive input, including the transparent area outside the small pill.
    expect(await count.evaluate(button=>{
      const box=button.getBoundingClientRect();
      return [[box.left+1,box.top+box.height/2],[box.right-1,box.top+box.height/2],[box.left+box.width/2,box.top+1],[box.left+box.width/2,box.bottom-1]]
        .every(([x,y])=>button.contains(document.elementFromPoint(x,y)));
    })).toBe(true);
    const colors=await count.locator('.waiting-pill').evaluate(element=>{const style=getComputedStyle(element);return [style.color,style.backgroundColor];});
    expect(ratio(colors[0],colors[1])).toBeGreaterThanOrEqual(4.5);
    // Neither the quest names nor another control shares the count's target.
    for(const other of await page.locator('.ticket-face,.drawer-handle:visible').all()){
      const area=(await other.boundingBox())!;
      expect(box.x+box.width<=area.x||area.x+area.width<=box.x||box.y+box.height<=area.y||area.y+area.height<=box.y).toBe(true);
    }
    await page.mouse.click(box.x+box.width/2,box.y+1);await expect(page.locator('#modal-title')).toHaveText('Waiting quests');
    const rows=page.locator('#modal .waiting-entry');await expect(rows).toHaveCount(2);
    for(const [at,value] of waiting.entries()){
      await expect(rows.nth(at).locator('.waiting-name')).toHaveText(`${data.characters.find(person=>person.id===value.character)!.name}: ${value.title}`);
      await expect(rows.nth(at).locator('.waiting-reason')).toHaveText('The quests from earlier in the story come first.');
    }
    await page.keyboard.press('Escape');await expect(count).toBeFocused();
    await page.keyboard.press('Enter');await expect(page.locator('#modal-title')).toHaveText('Waiting quests');
    await page.keyboard.press('Escape');await expect(count).toBeFocused();
    if(coins===0){
      const face=page.locator('.recovery-ticket .ticket-face'),area=(await face.boundingBox())!;
      await page.mouse.click(area.x+2,area.y+2);
      await expect(page.locator('#modal-title')).toHaveText('Tea for the night ward');await page.keyboard.press('Escape');
    }
    if(width<1024){await phoneFits(page);await loweredTicketsFit(page);}
  }
  await replaceSave(page,start);await expect(page.locator('.waiting-count')).toHaveCount(0);
});

for(const theme of ['light','dark'])for(const width of [320,390])test(`a waiting count remains reachable at 601px with action feedback at ${width}px in ${theme}`,async({page})=>{
  const start=actOne(),waiting=resolveQuests(start,data).find(view=>view.status==='waiting')!.quest;
  await page.setViewportSize({width,height:844});await startStill(page,{...start,coins:0,steppedBack:[waiting.id]},theme);
  await page.locator('#drawer-handle').click();await expect(page.locator('#drawer-body')).toHaveAttribute('inert','');
  await page.setViewportSize({width,height:601});
  await expect(page.locator('#drawer-handle')).toBeHidden();await expect(page.locator('#drawer-body')).not.toHaveAttribute('inert');
  const count=page.locator('.waiting-count');
  for(const feedback of [false,true]){
    if(feedback){
      await page.locator('[data-cell="13"]').click();await page.locator('[data-source="grain"]').click();
      await expect(page.locator('#item-detail')).toHaveClass(/action-feedback/);
    }
    await count.scrollIntoViewIfNeeded();await expect(count).toBeInViewport({ratio:1});
    expect(await count.evaluate(button=>{const box=button.getBoundingClientRect();return button.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));})).toBe(true);
    await count.click();await expect(page.locator('#modal-title')).toHaveText('Waiting quests');await page.keyboard.press('Escape');
  }
  await page.locator('[data-source="herbs"]').click();expect((await saved(page)).board.filter(cell=>cell?.code==='herbs_1')).toHaveLength(start.board.filter(cell=>cell?.code==='herbs_1').length+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const theme of ['light','dark'])for(const width of [320,390])test(`the fixed drawer fits waiting quests and a long order at 701px in ${theme} at ${width}px`,async({page})=>{
  const start=onTicket(quest('dochia-sheepskin'));
  await page.setViewportSize({width,height:701});
  await startStill(page,{...start,coins:0,repeating:{last:null,open:'sorin-staff-meal'},steppedBack:['sorin-staff-meal']},theme);
  await expect(page.locator('#tickets .ticket')).toHaveCount(4);await expect(page.locator('.ticket-items>:nth-child(4)')).toHaveCount(1);
  for(const feedback of [false,true]){
    if(feedback){
      await page.locator(`[data-cell="${start.board.findIndex(cell=>cell!==null)}"]`).click();await page.locator('[data-source="grain"]').click();
      await expect(page.locator('#item-detail')).toHaveClass(/action-feedback/);
    }
    await phoneFits(page,feedback?'#item-detail':'#status');
    for(const control of [page.locator('#drawer-handle'),page.locator('.waiting-count')]){
      await expect(control).toBeInViewport({ratio:1});
      expect(await control.evaluate(button=>{
        const box=button.getBoundingClientRect();
        return [[box.left+box.width/2,box.top+1],[box.left+box.width/2,box.bottom-1]]
          .every(([x,y])=>button.contains(document.elementFromPoint(x,y)));
      })).toBe(true);
    }
  }
  await loweredTicketsFit(page);
});
