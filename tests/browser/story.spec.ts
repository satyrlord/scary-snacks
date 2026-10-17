import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createGame, currentTask, firstFreeBoardCell, generatorOutputs, getItem, getLevel, previewQuestCleanup, reduceGame, resolveQuests, taskEligibility, validateGame } from '../../src/engine.ts';
import type { Action, GameData, GameState, Order } from '../../src/engine.ts';
import { SAVE_KEY, exportSave } from '../../src/storage.ts';

const data: GameData=JSON.parse(readFileSync('public/data/game.json','utf8'));
const validate=(candidate: unknown)=>validateGame(candidate,data);
const closing=(index: number)=>`Chapter ${index+1} complete: ${data.chapters[index].title}`;
/** A synthetic checkpoint with the coins and counters for the next preparation. Earlier scenes are read, so only new payments queue scenes. */
function checkpoint(count: number){
  let state=createGame(data);
  for(let index=0;index<count;index++){
    Object.assign(state,data.tasks[index].goals,{coins:data.tasks[index].cost});
    const result=reduceGame(state,{type:'task'},data);expect(result.ok,result.message).toBe(true);state=result.state;
  }
  if(count<data.tasks.length)Object.assign(state,data.tasks[count].goals,{coins:data.tasks[count].cost});
  state.pendingScenes=[];expect(validate(state)).toBe(true);return state;
}
async function start(page: Page,state: GameState,key=SAVE_KEY,text=exportSave(state,validate)){
  await page.addInitScript(([key,value])=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},[key,text]);
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);
}
async function saved(page: Page): Promise<GameState>{return page.evaluate(key=>navigator.locks.request(key,()=>JSON.parse(localStorage.getItem(key)!).state),SAVE_KEY);}
async function story(page: Page){if(!await page.locator('#story').isVisible())await page.locator('#story-button').click();}
async function pay(page: Page){
  await story(page);await page.getByRole('button',{name:/^Pay /}).first().click();
  for(const label of ['Continue','Continue','See what changed'])await page.locator('.story-controls .primary-button',{hasText:label}).click();
}
async function readTo(page: Page,label: string){
  const forward=page.locator('.story-controls .primary-button');
  while(await forward.textContent()==='Continue')await forward.click();
  await expect(forward).toHaveText(label);await forward.click();
}
async function journal(page: Page){await story(page);await page.getByRole('button',{name:'Open the story journal',exact:true}).click();}
const scene=(page: Page,title: string)=>page.getByRole('dialog',{name:title,exact:true});

test('the story shows the chapter objective and the state of its four preparations',async({page})=>{
  await start(page,checkpoint(5));const chapter=data.chapters[1],tasks=data.tasks.slice(4,8);
  await expect(page.locator('#story .chapter-title')).toHaveText(chapter.title);await expect(page.locator('#story .chapter-objective')).toHaveText(chapter.objective);
  await expect(page.locator('#story .chapter-steps li')).toHaveText([`${tasks[0].title}: done`,`${tasks[1].title}: now`,`${tasks[2].title}: not yet`,`${tasks[3].title}: not yet`]);
  await expect(page.getByRole('list',{name:'Chapter 2 preparations'})).toBeVisible();await expect(page.locator('#story .story-waiting')).toHaveCount(0);
  // The later scenes stay unseen: no closing line of this or a later chapter is on the page.
  for(const later of data.chapters.slice(1))for(const line of later.closing)await expect(page.locator('body')).not.toContainText(line.text);
});

test('the last preparation of a chapter opens its closing scene after the reveal, and the next chapter starts',async({page})=>{
  await start(page,checkpoint(3));await pay(page);
  const dialog=scene(page,closing(0));await expect(dialog).toBeVisible({timeout:8000});await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done');
  await expect(dialog).toContainText(data.chapters[0].payoff);await expect(page.locator('#story-line')).toContainText(data.chapters[0].closing[0].text);
  const paid=await saved(page);expect(paid.pendingScenes).toEqual(['chapter-1']);expect(paid.taskIndex).toBe(4);
  await readTo(page,'Back to the kitchen');await expect(page.locator('#modal')).toBeHidden();
  const read=await saved(page);expect(read.pendingScenes).toEqual([]);expect({...read,pendingScenes:paid.pendingScenes}).toEqual(paid);
  await expect(page.locator('#story .chapter-title')).toHaveText(data.chapters[1].title);await expect(page.locator('#story .chapter-steps li').first()).toHaveText(`${data.tasks[4].title}: now`);
  await journal(page);const section=page.locator('[data-chapter="chapter-1"]');await expect(section).toContainText(data.chapters[0].payoff);
  await expect(section.getByRole('button',{name:`Replay ${closing(0)}`,exact:true})).toBeVisible();
  await expect(page.locator('[data-chapter="chapter-2"]')).toContainText(`Goal: ${data.chapters[1].objective}`);await expect(page.locator('[data-chapter="chapter-3"]')).toHaveCount(0);
});

test('closing a chapter scene leaves it waiting through reload, and cooking never waits for it',async({page})=>{
  await start(page,checkpoint(7));await pay(page);await expect(scene(page,closing(1))).toBeVisible({timeout:8000});
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual(['chapter-2']);
  // The next preparation and the board stay usable while the scene waits.
  const before=await saved(page),source=before.board.findIndex(cell=>cell?.code==='generator_bakery');await page.locator(`[data-cell="${source}"]`).click();
  expect((await saved(page)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);
  await page.reload();await expect(page.locator('#board button')).toHaveCount(42);await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  const waiting=page.locator('#story .story-waiting');await expect(waiting).toContainText('Chapter 2 is complete.');
  await waiting.getByRole('button',{name:`Read now: ${closing(1)}`,exact:true}).click();await expect(page.locator('.story-controls .primary-button')).toBeFocused();
  await readTo(page,'Back to the kitchen');expect((await saved(page)).pendingScenes).toEqual([]);await expect(page.locator('#story .story-waiting')).toHaveCount(0);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const finish of ['Finish','Skip'] as const)test(`${finish} from Read now returns keyboard focus to Story at ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);const state=checkpoint(4);state.pendingScenes=['chapter-1'];await start(page,state);
  await story(page);await page.getByRole('button',{name:`Read now: ${closing(0)}`,exact:true}).click();
  if(finish==='Skip')await page.getByRole('button',{name:'Skip scene',exact:true}).click();else await readTo(page,'Back to the kitchen');
  await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual([]);
  const target=viewport.width>1023?page.locator('#story').getByRole('button',{name:'Open the story journal',exact:true}):page.locator('#story-button');
  await expect(target).toBeFocused();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:viewport.width>1023?'Story journal':'Our little bistro',exact:true})).toBeVisible();
});

for(const dismiss of ['Escape','Close'] as const)test(`${dismiss} on the next waiting scene keeps a visible keyboard focus target`,async({page})=>{
  const state=checkpoint(8);state.pendingScenes=['chapter-1','chapter-2'];await start(page,state);
  await page.getByRole('button',{name:`Read now: ${closing(0)}`,exact:true}).click();await page.getByRole('button',{name:'Skip scene',exact:true}).click();
  await expect(scene(page,closing(1))).toBeVisible();
  if(dismiss==='Escape')await page.keyboard.press('Escape');else await page.locator('#close-modal').click();
  await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual(['chapter-2']);
  await expect(page.locator('#story').getByRole('button',{name:'Open the story journal',exact:true})).toBeFocused();
});

test('the final preparation gives one finale after the chapter scene; Skip and replay change nothing else, and orders continue',async({page})=>{
  const initial=checkpoint(23);await start(page,initial);await pay(page);await expect(scene(page,closing(5))).toBeVisible({timeout:8000});
  const paid=await saved(page);expect(paid.pendingScenes).toEqual(['chapter-6','finale']);expect(paid.coins).toBe(initial.coins-data.tasks[23].cost);
  await readTo(page,'Next scene');const finale=scene(page,data.finale.title);await expect(finale).toBeVisible();
  await expect(finale).toContainText(data.finale.ending);await expect(page.locator('#story-line')).toContainText(data.finale.dialogue[0].text);
  await page.getByRole('button',{name:'Skip scene',exact:true}).click();await expect(page.locator('#modal')).toBeHidden();
  const skipped=await saved(page);expect(skipped.pendingScenes).toEqual([]);expect({...skipped,pendingScenes:paid.pendingScenes}).toEqual(paid);
  await expect(page.locator('#story')).toContainText('The table is ready.');await expect(page.getByRole('button',{name:/^Pay /})).toHaveCount(0);
  await journal(page);await page.getByRole('button',{name:`Replay ${data.finale.title}`,exact:true}).click();
  for(const line of data.finale.dialogue){await expect(page.locator('#story-line')).toContainText(line.text);if(line!==data.finale.dialogue.at(-1))await page.locator('.story-controls .primary-button').click();}
  await expect(page.getByRole('button',{name:'Skip scene'})).toHaveCount(0);await page.getByRole('button',{name:'Return',exact:true}).click();
  await expect(page.getByRole('button',{name:`Replay ${data.finale.title}`,exact:true})).toBeFocused();expect(await saved(page)).toEqual(skipped);
  await page.keyboard.press('Escape');await page.reload();await expect(page.locator('#board button')).toHaveCount(42);expect(await saved(page)).toEqual(skipped);
  await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('#orders .order')).toHaveCount(3);
});

test('a reload during the last preparation story resumes the waiting scenes, then ordinary orders still serve',async({page})=>{
  const finished=checkpoint(23),result=reduceGame(finished,{type:'task'},data);expect(result.ok).toBe(true);
  const state=result.state,order=state.orders[0];
  for(const code of order.requirements){state.board[firstFreeBoardCell(state,data)]={code};if(!state.discovered.includes(code))state.discovered.push(code);}
  await start(page,state);await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  await story(page);await page.locator('.story-waiting').getByRole('button',{name:/^Read now/}).click();await expect(scene(page,closing(5))).toBeVisible();
  await readTo(page,'Next scene');await expect(scene(page,data.finale.title)).toBeVisible();await readTo(page,'Back to the kitchen');expect((await saved(page)).pendingScenes).toEqual([]);
  await page.locator('#orders .order').first().getByRole('button',{name:/^Serve /}).click();
  const served=await saved(page);expect(served.served).toBe(state.served+1);expect(served.coins).toBe(state.coins+order.reward);expect(served.pendingScenes).toEqual([]);
});


/** Legal play up to the next payment: claim each reward, deliver each open request, then serve the easiest order or merge. */
function playUntilReady(start: GameState){
  let state=start;
  const act=(action: Action)=>{const result=reduceGame(state,action,data);expect(result.ok,result.message).toBe(true);state=result.state;};
  const produce=(code: string): number=>{
    const source=data.quests.find(quest=>quest.producer?.exclusiveItems.includes(code))?.producer?.item??`generator_${getItem(code,data)!.chain}`;
    if(generatorOutputs(state,source,data).includes(code)){const empty=firstFreeBoardCell(state,data);expect(empty).toBeGreaterThanOrEqual(0);act({type:'spawn',index:state.board.findIndex(cell=>cell?.code===source),output:code});return empty;}
    const lower=Object.values({...data.items,...data.questItems}).find(item=>item.next===code)!;const first=produce(lower.id),second=produce(lower.id);act({type:'move',from:first,to:second});return second;
  };
  for(;;){
    for(const reward of data.levelRewards)if(reward.level<=getLevel(state)&&!state.claimedLevelRewards.includes(reward.id))act({type:'claimLevelReward',id:reward.id});
    const open=resolveQuests(state,data).find(view=>view.status==='active'||view.status==='offer');
    if(open){
      if(open.status==='offer')act({type:'acceptQuest',id:open.quest.id});
      for(const requirement of open.quest.requirements)for(let count=0;count<requirement.quantity;count++)produce(requirement.item);
      const cleanup=open.quest.producer?previewQuestCleanup(state,open.quest.id,data):null;act({type:'deliverQuest',id:open.quest.id,...(cleanup?{cleanupToken:cleanup.token}:{})});continue;
    }
    const task=currentTask(state,data);if(!task||taskEligibility(state,data).ready)return state;
    if(state.coins<task.cost||state.served<task.goals.served){
      const effort=(order: Order)=>order.requirements.reduce((sum,code)=>sum+2**(data.items[code].stage-1),0);
      const order=[...state.orders].sort((first,second)=>effort(first)-effort(second))[0];for(const code of order.requirements)produce(code);act({type:'serve',id:order.id});
    }else{const first=produce('bakery_1'),second=produce('bakery_1');act({type:'move',from:first,to:second});act({type:'sell',index:second});}
  }
}

test('a fresh save plays through every payment, chapter scene, and the finale, and the goals, help, and payoffs agree',async({page})=>{
  test.setTimeout(300000);await page.emulateMedia({reducedMotion:'reduce'});
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');await expect(page.locator('#board button')).toHaveCount(42);let state=await saved(page);
  for(const [index,task] of data.tasks.entries()){
    // The engine makes the legal moves between payments. The interface pays, tells, reveals, and closes each chapter.
    state=playUntilReady(state);
    await page.evaluate(([key,value])=>localStorage.setItem(key,value),[SAVE_KEY,exportSave(state,validate)]);await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
    const chapter=data.chapters[task.chapter-1];
    await expect(page.locator('#story .chapter-title')).toHaveText(chapter.title);await expect(page.locator('#story .chapter-objective')).toHaveText(chapter.objective);
    await expect(page.locator('#story .chapter-steps li').nth(index%4)).toHaveText(`${task.title}: now`);
    await pay(page);await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done');
    await expect(page.locator('#status')).toHaveText(data.rooms.find(room=>room.after===task.id)!.text);
    if(index%4===3){
      await expect(scene(page,closing(task.chapter-1))).toBeVisible();await expect(page.locator('.completion-message')).toHaveText(chapter.payoff);
      for(const line of chapter.closing){await expect(page.locator('#story-line')).toContainText(line.text);if(line!==chapter.closing.at(-1))await page.locator('.story-controls .primary-button').click();}
      if(index===23){
        await page.locator('.story-controls .primary-button',{hasText:'Next scene'}).click();await expect(scene(page,data.finale.title)).toBeVisible();
        await expect(page.locator('.completion-message')).toHaveText(data.finale.ending);
        for(const line of data.finale.dialogue){await expect(page.locator('#story-line')).toContainText(line.text);if(line!==data.finale.dialogue.at(-1))await page.locator('.story-controls .primary-button').click();}
      }
      await page.locator('.story-controls .primary-button',{hasText:'Back to the kitchen'}).click();await expect(page.locator('#modal')).toBeHidden();
      // The neighbour who helps this chapter has delivered, and the journal says so beside the payoff.
      const help=data.quests.find(quest=>quest.id===chapter.contribution)!;
      await journal(page);const section=page.locator(`[data-chapter="${chapter.id}"]`);await expect(section).toContainText(chapter.payoff);
      await expect(section).toContainText(`${data.characters.find(person=>person.id===help.character)!.name} helps: ${help.title} · Delivered`);
      await page.keyboard.press('Escape');
    }else await expect(page.locator('#modal')).toBeHidden();
    state=await saved(page);expect(state.taskIndex).toBe(index+1);expect(state.pendingScenes).toEqual([]);
  }
  expect(new Set(state.completedQuests)).toEqual(new Set(data.quests.filter(quest=>(quest.afterServed??0)<=state.served).map(quest=>quest.id)));
  await expect(page.locator('#story')).toContainText('The table is ready.');
  // Ordinary orders continue after the finale.
  let ready=playUntilReady(state);const order=ready.orders[0];
  for(const code of order.requirements){
    const act=(action: Action)=>{const result=reduceGame(ready,action,data);expect(result.ok,result.message).toBe(true);ready=result.state;};
    const make=(item: string): number=>{const def=data.items[item],source=`generator_${def.chain}`;
      if(generatorOutputs(ready,source,data).includes(item)){const empty=firstFreeBoardCell(ready,data);act({type:'spawn',index:ready.board.findIndex(cell=>cell?.code===source),output:item});return empty;}
      const lower=Object.values(data.items).find(value=>value.next===item)!;const first=make(lower.id),second=make(lower.id);act({type:'move',from:first,to:second});return second;};
    make(code);
  }
  await page.evaluate(([key,value])=>localStorage.setItem(key,value),[SAVE_KEY,exportSave(ready,validate)]);await page.reload();await expect(page.locator('#board button')).toHaveCount(42);
  await page.locator('#orders .order').first().getByRole('button',{name:/^Serve /}).click();
  const served=await saved(page);expect(served.served).toBe(ready.served+1);expect(served.coins).toBe(ready.coins+order.reward);expect(served.orders).toHaveLength(3);
  await journal(page);await expect(page.getByRole('button',{name:`Replay ${data.finale.title}`,exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:390,height:800}])for(const theme of ['light','dark'] as const)test(`chapter story fits ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const state=checkpoint(13);state.pendingScenes=['chapter-1','chapter-2','chapter-3'];await start(page,state);await story(page);
  const card=page.locator(viewport.width>1023?'#story':'#modal');await expect(card.locator('.story-waiting')).toBeVisible();
  for(const control of await card.locator('.story-waiting button,.story-links button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  const contrast=await card.evaluate(element=>{
    const luminance=(value: string)=>value.match(/\d+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    let surface: Element|null=element;while(surface&&getComputedStyle(surface).backgroundColor.match(/\d+/g)?.[3]==='0')surface=surface.parentElement;
    const background=luminance(getComputedStyle(surface??document.body).backgroundColor);
    return [...element.querySelectorAll('.chapter-objective,.chapter-steps>span,.story-waiting p')].map(node=>{const ink=luminance(getComputedStyle(node).color);return(Math.max(ink,background)+.05)/(Math.min(ink,background)+.05);});
  });expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('story-card.png')});
  await page.getByRole('button',{name:'Open the story journal',exact:true}).click();
  const neighbours=page.locator('.neighbour-introduction');await expect(neighbours).toHaveCount(data.characters.filter(person=>!person.singleVisit).length);
  const checkNeighbourAlignment=async()=>{
    const rows=await neighbours.evaluateAll(entries=>entries.map(entry=>{
      const portrait=entry.querySelector('.portrait')!.getBoundingClientRect(),name=entry.querySelector('strong')!.getBoundingClientRect(),role=entry.querySelector(':scope > span:not(.portrait)')!.getBoundingClientRect();
      return {nameLeft:name.left,gap:name.left-portrait.right,nameRight:name.right,roleLeft:role.left,roleRight:role.right,contained:[...entry.querySelectorAll('strong,:scope > span:not(.portrait)')].every(text=>text.scrollWidth<=text.clientWidth)};
    }));
    for(const row of rows){expect(row.nameLeft).toBeCloseTo(rows[0].nameLeft,1);expect(row.gap).toBeGreaterThan(0);expect(row.gap).toBeCloseTo(rows[0].gap,1);expect(row.nameRight).toBeLessThan(row.roleLeft);expect(row.roleRight).toBeCloseTo(rows[0].roleRight,1);expect(row.contained).toBe(true);}
  };
  await checkNeighbourAlignment();
  await expect(page.locator('[data-chapter="chapter-4"]')).toBeVisible();expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  for(const control of await page.locator('.chapter-journal button').all()){const box=(await control.boundingBox())!;expect(box.height).toBeGreaterThanOrEqual(44);}
  await page.screenshot({path:testInfo.outputPath('story-journal.png')});
  await neighbours.first().evaluate(entry=>{entry.querySelector('strong')!.textContent='Alexandru-Mihai Popescu';entry.querySelector(':scope > span:not(.portrait)')!.textContent='Community supper coordinator';});
  await checkNeighbourAlignment();expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await page.getByRole('button',{name:`Read ${closing(0)}`,exact:true}).click();await expect(page.getByRole('button',{name:'Skip scene',exact:true})).toBeInViewport();
  const skip=(await page.getByRole('button',{name:'Skip scene',exact:true}).boundingBox())!;expect(skip.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({path:testInfo.outputPath('story-scene.png')});
});
