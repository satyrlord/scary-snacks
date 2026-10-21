import { test, expect } from '@playwright/test';
import { arrivalScene, deliveriesSince, journalCharacters, resolveChapters, resolveQuests, supperComplete } from '../../src/model.ts';
import { act, supper, checkpoint, data, deliverable, forward, journal, opened, quest, ratio, readTo, saved, start, supplies, supply, validate } from './support.ts';

/** Earned scenes left unread at representative campaign positions. */
function journalState(count: number){
  const state=checkpoint(count);
  if(count){
    const arrival=data.characters.find(person=>person.arrival&&data.tasks.findIndex(task=>task.id===person.arrivesAfter)<count)!;
    const chapter=data.chapters[Math.floor(count/4)-1].id,task=data.tasks[count-1].id;
    state.pendingScenes=[...(count%4?[chapter,task]:[task,chapter]),arrivalScene(arrival),state.completedQuests[0]];
    if(count===24)state.pendingScenes.push('ionatan-castle-dinner','mina-avram-news');
  }
  expect(validate(state)).toBe(true);return state;
}
for(const count of [0,10,24])for(const width of [1440,390])for(const theme of ['light','dark'])test(`journal priorities and complete scene coverage after ${count} preparations at ${width}px in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:width===1440?900:844});await page.emulateMedia({reducedMotion:'reduce'});
  const state=journalState(count);await start(page,state,theme);await journal(page);
  const list=page.locator('.journal-list'),unread=page.getByRole('region',{name:'Unread scenes',exact:true});
  expect(await unread.locator('[data-scene]').evaluateAll(rows=>rows.map(row=>(row as HTMLElement).dataset.scene))).toEqual(state.pendingScenes);
  if(!count)await expect(unread).toContainText('No unread scenes.');
  const current=resolveChapters(state,data).find(view=>view.status==='current')??resolveChapters(state,data).at(-1)!;
  await expect(list.locator('[data-current-chapter]')).toHaveAttribute('data-chapter',current.chapter.id);
  const order=await list.evaluate(node=>[...node.children].map(child=>child.className));
  expect(order.indexOf('journal-unread')).toBeLessThan(order.indexOf('chapter-journal'));
  for(const group of await list.locator('details').all())await expect(group).not.toHaveAttribute('open','');
  const people=journalCharacters(state,data),expected=new Set(state.pendingScenes);
  for(const task of data.tasks.slice(0,count))expected.add(task.id);
  for(const view of resolveChapters(state,data).filter(view=>view.status==='complete'))expected.add(view.chapter.id);
  const completed=resolveQuests(state,data).filter(view=>view.status==='complete'&&people.some(person=>person.id===view.quest.character));
  for(const {quest} of completed)if(quest.completion.length)expected.add(quest.id);
  for(const quest of data.quests)if(quest.followUp&&deliveriesSince(state,quest.id)>=quest.followUp.afterDeliveries)expected.add(quest.followUp.id);
  if(supperComplete(state,data))expected.add(data.finale.id);
  const ids=await list.locator('[data-scene]').evaluateAll(rows=>rows.map(row=>(row as HTMLElement).dataset.scene!));
  expect(ids.length).toBe(new Set(ids).size);expect([...ids].sort()).toEqual([...expected].sort());
  await expect(list.locator('[data-journal^="opening-"]')).toHaveCount(completed.filter(view=>!view.quest.completion.length).length);
  for(const {quest} of completed)await expect(list.locator(`[data-quest="${quest.id}"]`)).toHaveCount(1);
  const visible=await list.evaluate(node=>{
    const pairs=[...node.querySelectorAll('p,strong,summary,.journal-entry>span')].filter(value=>value.checkVisibility()).map(value=>{
      let surface:Element=value;while(getComputedStyle(surface).backgroundColor==='rgba(0, 0, 0, 0)'&&surface.parentElement)surface=surface.parentElement;
      return {ink:getComputedStyle(value).color,back:getComputedStyle(surface).backgroundColor};
    });return {pairs,scroll:node.scrollWidth>node.clientWidth};
  });expect(visible.pairs.length).toBeGreaterThan(0);expect(visible.scroll).toBe(false);
  for(const {ink,back} of visible.pairs)expect(ratio(back,ink)).toBeGreaterThanOrEqual(4.5);
  expect(await page.locator('#modal').evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
  for(const summary of await list.locator('summary').all())expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({path:testInfo.outputPath('journal-priorities.png')});expect(await saved(page)).toEqual(state);
  // Native disclosure supports the keyboard and keeps focus on its summary.
  const summary=list.locator('[data-group="neighbours"]>summary');await summary.focus();await page.keyboard.press('Enter');
  await expect(summary).toBeFocused();await expect(list.locator('[data-group="neighbours"]')).toHaveAttribute('open','');
  await page.keyboard.press('Space');await expect(list.locator('[data-group="neighbours"]')).not.toHaveAttribute('open','');
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(state);
});

for(const width of [1440,390])test(`journal restores archive focus, open groups, and scroll after Return, Close, and Escape at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});const state=checkpoint(24);await start(page,state);await journal(page,['conversations','neighbours']);
  const entry=page.getByRole('button',{name:'Meet Bran',exact:true});
  for(const dismiss of ['Return','Close','Escape']){
    await entry.scrollIntoViewIfNeeded();await entry.focus();const position=await page.locator('#modal').evaluate(node=>node.scrollTop);
    await page.keyboard.press('Enter');
    if(dismiss==='Return')await readTo(page,'Return');else if(dismiss==='Close')await page.locator('#close-modal').click();else await page.keyboard.press('Escape');
    await expect(entry).toBeFocused();await expect(entry).toBeInViewport();
    for(const id of ['conversations','neighbours'])await expect(page.locator(`[data-group="${id}"]`)).toHaveAttribute('open','');
    expect(await page.locator('#modal').evaluate(node=>node.scrollTop)).toBeCloseTo(position,0);expect(await saved(page)).toEqual(state);
  }
  await page.keyboard.press('Escape');await journal(page);await expect(page.locator('details[open]')).toHaveCount(0);
});

test('reading the last unread conversation moves its single entry into the replay group',async({page})=>{
  const value=quest('mara-welcome'),state=act(deliverable(value),{type:'deliverQuest',id:value.id});await start(page,state);await journal(page);
  const unread=page.locator(`[data-scene="${value.id}"]`);await unread.click();await forward(page).click();
  await expect(page.locator('[data-group="conversations"]')).toHaveAttribute('open','');await expect(unread).toBeFocused();await expect(unread).toHaveAccessibleName(`Replay ${value.title}`);
  await expect(page.getByRole('region',{name:'Unread scenes',exact:true})).toContainText('No unread scenes.');
  await expect(page.locator(`[data-quest="${value.id}"]`)).toHaveCount(1);
  await expect(page.getByRole('button',{name:`Read quest: ${value.title}`,exact:true})).toHaveCount(0);
  expect(await saved(page)).toEqual({...state,pendingScenes:[]});
});

test('single-visit farewell is readable once from Unread and returns to its heading',async({page})=>{
  const value=quest('ionatan-castle-dinner'),state=act(deliverable(value),{type:'deliverQuest',id:value.id});await start(page,state);await journal(page);
  await expect(page.locator(`[data-scene="${value.id}"]`)).toHaveCount(1);await page.getByRole('button',{name:`Read ${value.title}`,exact:true}).click();
  await forward(page).click();await expect(page.getByRole('heading',{name:'Unread scenes',exact:true})).toBeFocused();
  await expect(page.locator(`[data-scene="${value.id}"]`)).toHaveCount(0);await expect(page.locator(`[data-journal="opening-${value.id}"]`)).toHaveCount(0);
  expect(await saved(page)).toEqual({...state,pendingScenes:[]});
});

test('earlier conversations follow delivery order, and the latest chapter remains after the supper',async({page})=>{
  let state=supply(checkpoint(24,{coins:data.economy.recoveryFloor}),supplies(supper));
  state=act(state,{type:'deliverQuest',id:supper.id});state=act(state,{type:'readScene',id:data.finale.id});
  await start(page,state);await journal(page,['conversations']);
  await expect(page.locator('[data-current-chapter]')).toHaveAttribute('data-chapter',data.chapters.at(-1)!.id);
  const people=journalCharacters(state,data),expected=[...state.completedQuests].reverse().filter(id=>people.some(person=>person.id===quest(id).character));
  expect(await page.locator('[data-group="conversations"] [data-quest]').evaluateAll(rows=>rows.map(row=>(row as HTMLElement).dataset.quest!))).toEqual(expected);
  const replay=page.getByRole('button',{name:`Replay ${data.finale.title}`,exact:true});await expect(replay).toBeVisible();expect(await saved(page)).toEqual(state);
});


test('reading one combined quest keeps another waiting scene',async({page})=>{
  const value=quest('eszter-table'),state=act(deliverable(value),{type:'deliverQuest',id:value.id});
  state.pendingScenes.unshift(data.tasks[0].id);expect(validate(state)).toBe(true);
  await start(page,state);await journal(page);const entry=page.getByRole('button',{name:`Read ${value.title}`,exact:true});await entry.click();
  await expect(page.locator('.story-turn h4')).toHaveText([...value.opening,...value.completion].map(line=>data.characters.find(person=>person.id===line.speaker)!.name));
  await expect(page.locator('.story-turn p')).toHaveText([...value.opening,...value.completion].map(line=>line.text));
  expect(await saved(page)).toEqual(state);await page.keyboard.press('Escape');await expect(entry).toBeFocused();expect(await saved(page)).toEqual(state);
  await page.reload();await opened(page);await journal(page);await entry.click();
  await page.getByRole('button',{name:'Return',exact:true}).click();
  expect(await saved(page)).toEqual(act(state,{type:'readScene',id:value.id}));
  await expect(page.getByRole('dialog',{name:'Story journal',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:`Replay ${value.title}`,exact:true})).toBeFocused();
  await expect(page.locator(`[data-quest="${value.id}"]`)).toHaveCount(1);
});

for(const width of [1440,390])for(const theme of ['light','dark'])test(`each regular’s journal row names their favourite dishes at ${width}px in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:width===1440?900:844});await page.emulateMedia({reducedMotion:'reduce'});
  await start(page,checkpoint(24),theme);await journal(page,['neighbours']);
  const regulars=data.characters.filter(person=>person.regular);expect(regulars.every(person=>person.favourites?.length)).toBe(true);
  for(const person of regulars){
    const favourites=`Favourites: ${new Intl.ListFormat('en',{type:'conjunction'}).format(person.favourites!.map(code=>data.items[code].name))}`;
    const entry=page.getByRole('button',{name:`Meet ${person.name}`,exact:true});
    await expect(entry.locator('.neighbour-words')).toContainText(favourites);expect((await entry.getAttribute('aria-description'))!.startsWith(`${person.role}. ${favourites}. `)).toBe(true);
    expect(await entry.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
  }
  expect(await page.locator('#modal').evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
  await page.getByRole('button',{name:`Meet ${regulars[0].name}`,exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('journal-favourites.png')});
});
