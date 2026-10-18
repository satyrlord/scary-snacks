import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { requiredQuests } from '../../src/model.ts';
import type { GameState, SceneLine } from '../../src/model.ts';
import { KEY, act, checkpoint, data, exportText, journal, opened, options, payAndRead, readTo, saved, serialize, start, story } from './support.ts';

const closing=(index: number)=>`Chapter ${index+1} complete: ${data.chapters[index].title}`;
/** The regulars whose arrival scenes the payment of a preparation queues. */
const arrivals=(index: number)=>data.characters.filter(person=>person.arrival&&person.arrivesAfter===data.tasks[index].id);
/** A checkpoint ready for the next preparation, with every earlier scene read, so only new payments queue scenes. */
const ready=(count: number)=>checkpoint(count,{ready:true});
/** Reads the open scene and then each arrival scene that the payment of preparation index queued, back to the kitchen. */
async function readWithArrivals(page: Page,index: number){
  const people=arrivals(index);await readTo(page,people.length?'Next scene':'Back to the kitchen');
  for(const [at,person] of people.entries()){await expect(scene(page,`${person.name} arrives`)).toBeVisible();await readTo(page,at<people.length-1?'Next scene':'Back to the kitchen');}
}
const scene=(page: Page,title: string)=>page.getByRole('dialog',{name:title,exact:true});
const noMoreQuests=async(page: Page)=>{await expect(page.locator('#tickets .ticket')).toHaveCount(0);await expect(page.locator('.tickets-empty')).toHaveText('Every quest is delivered. The bistro is yours.');};

test('the story shows the chapter objective and the state of its four preparations',async({page})=>{
  await start(page,ready(5));const chapter=data.chapters[1],tasks=data.tasks.slice(4,8);
  await expect(page.locator('#story .chapter-title')).toHaveText(chapter.title);await expect(page.locator('#story .chapter-objective')).toHaveText(chapter.objective);
  await expect(page.locator('#story .chapter-steps li')).toHaveText([`${tasks[0].title}: done`,`${tasks[1].title}: now`,`${tasks[2].title}: not yet`,`${tasks[3].title}: not yet`]);
  await expect(page.getByRole('list',{name:'Chapter 2 preparations'})).toBeVisible();await expect(page.locator('#story .story-waiting')).toHaveCount(0);
  // The later scenes stay unseen: no closing line of this or a later chapter is on the page.
  for(const later of data.chapters.slice(1))for(const line of later.closing)await expect(page.locator('body')).not.toContainText(line.text);
});

test('the last preparation of a chapter opens its closing scene after the reveal, then the arrivals, and the next chapter starts',async({page})=>{
  await start(page,ready(3));await payAndRead(page);
  const dialog=scene(page,closing(0));await expect(dialog).toBeVisible({timeout:8000});await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done');
  await expect(dialog).toContainText(data.chapters[0].payoff);await expect(page.locator('#story-line')).toContainText(data.chapters[0].closing[0].text);
  const paid=await saved(page);expect(paid.pendingScenes).toEqual(['chapter-1',...arrivals(3).map(person=>`arrival-${person.id}`)]);expect(paid.taskIndex).toBe(4);
  expect(arrivals(3).length).toBeGreaterThan(0);
  await readWithArrivals(page,3);await expect(page.locator('#modal')).toBeHidden();
  const read=await saved(page);expect(read.pendingScenes).toEqual([]);expect({...read,pendingScenes:paid.pendingScenes}).toEqual(paid);
  await expect(page.locator('#story .chapter-title')).toHaveText(data.chapters[1].title);await expect(page.locator('#story .chapter-steps li').first()).toHaveText(`${data.tasks[4].title}: now`);
  await journal(page);const section=page.locator('[data-chapter="chapter-1"]');await expect(section).toContainText(data.chapters[0].payoff);
  await expect(section.getByRole('button',{name:`Replay ${closing(0)}`,exact:true})).toBeVisible();
  await expect(page.locator('[data-chapter="chapter-2"]')).toContainText(`Goal: ${data.chapters[1].objective}`);await expect(page.locator('[data-chapter="chapter-3"]')).toHaveCount(0);
  // The new regulars now have journal entries.
  for(const person of arrivals(3))await expect(page.getByRole('button',{name:`Meet ${person.name}`,exact:true})).toBeVisible();
});

test('closing a chapter scene leaves it waiting through reload, and cooking never waits for it',async({page})=>{
  await start(page,ready(7));await payAndRead(page);await expect(scene(page,closing(1))).toBeVisible({timeout:8000});
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual(['chapter-2',...arrivals(7).map(person=>`arrival-${person.id}`)]);
  // The next preparation and the board stay usable while the scene waits.
  const before=await saved(page),source=before.board.findIndex(cell=>cell?.code==='generator_bakery');await page.locator(`[data-cell="${source}"]`).click();
  expect((await saved(page)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);
  await page.reload();await opened(page);await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  const waiting=page.locator('#story .story-waiting');await expect(waiting).toContainText('Chapter 2 is complete.');
  await waiting.getByRole('button',{name:`Read now: ${closing(1)}`,exact:true}).click();await expect(page.locator('.story-controls .primary-button')).toBeFocused();
  await readWithArrivals(page,7);expect((await saved(page)).pendingScenes).toEqual([]);await expect(page.locator('#story .story-waiting')).toHaveCount(0);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const finish of ['Finish','Skip'] as const)test(`${finish} from Read now returns keyboard focus to Story at ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);const state=ready(4);state.pendingScenes=['chapter-1'];await start(page,state);
  await story(page);await page.getByRole('button',{name:`Read now: ${closing(0)}`,exact:true}).click();
  if(finish==='Skip')await page.getByRole('button',{name:'Skip scene',exact:true}).click();else await readTo(page,'Back to the kitchen');
  await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual([]);
  const target=viewport.width>1023?page.locator('#story').getByRole('button',{name:'Open the story journal',exact:true}):page.locator('#story-button');
  await expect(target).toBeFocused();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:viewport.width>1023?'Story journal':'Our little bistro',exact:true})).toBeVisible();
});

for(const dismiss of ['Escape','Close'] as const)test(`${dismiss} on the next waiting scene keeps a visible keyboard focus target`,async({page})=>{
  const state=ready(8);state.pendingScenes=['chapter-1','chapter-2'];await start(page,state);
  await page.getByRole('button',{name:`Read now: ${closing(0)}`,exact:true}).click();await page.getByRole('button',{name:'Skip scene',exact:true}).click();
  await expect(scene(page,closing(1))).toBeVisible();
  if(dismiss==='Escape')await page.keyboard.press('Escape');else await page.locator('#close-modal').click();
  await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual(['chapter-2']);
  await expect(page.locator('#story').getByRole('button',{name:'Open the story journal',exact:true})).toBeFocused();
});

test('the final preparation gives one finale after the chapter scene; Skip and replay change nothing else, and no quest waits',async({page})=>{
  const initial=ready(23);await start(page,initial);await payAndRead(page);await expect(scene(page,closing(5))).toBeVisible({timeout:8000});
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
  await page.keyboard.press('Escape');await page.reload();await opened(page);expect(await saved(page)).toEqual(skipped);
  await expect(page.locator('#modal')).toBeHidden();await noMoreQuests(page);
});

test('a reload during the last preparation story resumes the waiting scenes in order, and the board still plays',async({page})=>{
  const state=act(ready(23),{type:'task'});expect(state.pendingScenes).toEqual(['task_24','chapter-6','finale']);
  await start(page,state);await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  // The preparation scene resumes first. The room change is already done, so it leads on to the next scene.
  await story(page);await page.locator('.story-waiting').getByRole('button',{name:`Read now: ${data.tasks[23].title}`,exact:true}).click();await expect(scene(page,data.tasks[23].title)).toBeVisible();
  await readTo(page,'Next scene');await expect(scene(page,closing(5))).toBeVisible();
  await readTo(page,'Next scene');await expect(scene(page,data.finale.title)).toBeVisible();await readTo(page,'Back to the kitchen');expect((await saved(page)).pendingScenes).toEqual([]);
  await noMoreQuests(page);
  const before=await saved(page),source=before.board.findIndex(cell=>cell?.code==='generator_bakery');await page.locator(`[data-cell="${source}"]`).click();
  expect((await saved(page)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);
});

test('a fresh save plays through every payment, chapter scene, and the finale, and the goals, help, and payoffs agree',async({page})=>{
  test.setTimeout(300000);await page.emulateMedia({reducedMotion:'reduce'});
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');await opened(page);let state: GameState=await saved(page);
  for(const [index,task] of data.tasks.entries()){
    // The quests that the payment needs are delivered and its coins earned; the rules tests cover how. The interface pays, tells, reveals, and closes each chapter.
    for(const value of requiredQuests(index,data))if(!state.completedQuests.includes(value.id))state.completedQuests.push(value.id);
    state.coins=task.cost;
    await page.evaluate(([key,value])=>localStorage.setItem(key,value),[KEY,serialize(state)]);await page.reload();await opened(page);
    const chapter=data.chapters[task.chapter-1];
    await expect(page.locator('#story .chapter-title')).toHaveText(chapter.title);await expect(page.locator('#story .chapter-objective')).toHaveText(chapter.objective);
    await expect(page.locator('#story .chapter-steps li').nth(index%4)).toHaveText(`${task.title}: now`);
    await expect(page.locator('#story [data-requirement="quests"] span').first()).toHaveText(`Quests delivered: ${requiredQuests(index,data).length} / ${requiredQuests(index,data).length}`);
    await payAndRead(page);await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done');
    await expect(page.locator('#status')).toHaveText(data.rooms.find(room=>room.after===task.id)!.text);
    if(index%4===3){
      await expect(scene(page,closing(task.chapter-1))).toBeVisible();await expect(page.locator('.completion-message')).toHaveText(chapter.payoff);
      for(const line of chapter.closing){await expect(page.locator('#story-line')).toContainText(line.text);if(line!==chapter.closing.at(-1))await page.locator('.story-controls .primary-button').click();}
      if(index===23){
        await page.locator('.story-controls .primary-button',{hasText:'Next scene'}).click();await expect(scene(page,data.finale.title)).toBeVisible();
        await expect(page.locator('.completion-message')).toHaveText(data.finale.ending);
        for(const line of data.finale.dialogue){await expect(page.locator('#story-line')).toContainText(line.text);if(line!==data.finale.dialogue.at(-1))await page.locator('.story-controls .primary-button').click();}
      }
      await readWithArrivals(page,index);await expect(page.locator('#modal')).toBeHidden();
      // The neighbour who helps this chapter has delivered, and the journal says so beside the payoff.
      const help=data.quests.find(value=>value.id===chapter.contribution)!;
      await journal(page);const section=page.locator(`[data-chapter="${chapter.id}"]`);await expect(section).toContainText(chapter.payoff);
      await expect(section).toContainText(`${data.characters.find(person=>person.id===help.character)!.name} helps: ${help.title} · Delivered`);
      await page.keyboard.press('Escape');
    }else if(arrivals(index).length){
      // The payment that brings regulars opens their arrival scenes after the reveal.
      const people=arrivals(index);
      for(const [at,person] of people.entries()){await expect(scene(page,`${person.name} arrives`)).toBeVisible();await readTo(page,at<people.length-1?'Next scene':'Back to the kitchen');}
      await expect(page.locator('#modal')).toBeHidden();
    }else await expect(page.locator('#modal')).toBeHidden();
    state=await saved(page);expect(state.taskIndex).toBe(index+1);expect(state.pendingScenes).toEqual([]);
  }
  expect(new Set(state.completedQuests)).toEqual(new Set(data.quests.map(value=>value.id)));
  await expect(page.locator('#story')).toContainText('The table is ready.');await noMoreQuests(page);
  await journal(page);await expect(page.getByRole('button',{name:`Replay ${data.finale.title}`,exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:390,height:800}])for(const theme of ['light','dark'] as const)test(`chapter story fits ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const state=ready(13);state.pendingScenes=['chapter-1','chapter-2','chapter-3'];await start(page,state);await story(page);
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
  const arrived=data.characters.filter(person=>!person.singleVisit&&(!person.arrivesAfter||data.tasks.findIndex(task=>task.id===person.arrivesAfter)<13));
  const entries=page.locator('.neighbour-entry:not(.not-yet)'),neighbours=page.locator('.neighbour-introduction');
  await expect(entries).toHaveCount(arrived.filter(person=>!person.visitor).length);await expect(neighbours).toHaveCount(arrived.filter(person=>person.visitor).length);
  await expect(page.locator('.neighbour-entry.not-yet')).toHaveCount(data.characters.filter(person=>!person.visitor).length-arrived.filter(person=>!person.visitor).length);
  const checkEntryAlignment=async()=>{
    const rows=await entries.evaluateAll(values=>values.map(entry=>{
      const portrait=entry.querySelector('.portrait')!.getBoundingClientRect(),name=entry.querySelector('strong')!.getBoundingClientRect(),count=entry.querySelector(':scope > span:last-child')!.getBoundingClientRect();
      return {nameLeft:name.left,gap:name.left-portrait.right,nameRight:name.right,countLeft:count.left,countRight:count.right,contained:[...entry.querySelectorAll('strong,span')].every(text=>text.scrollWidth<=text.clientWidth)};
    }));
    for(const row of rows){expect(row.nameLeft).toBeCloseTo(rows[0].nameLeft,1);expect(row.gap).toBeGreaterThan(0);expect(row.nameRight).toBeLessThanOrEqual(row.countLeft);expect(row.countRight).toBeCloseTo(rows[0].countRight,1);expect(row.contained).toBe(true);}
  };
  await checkEntryAlignment();
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
  await entries.first().evaluate(entry=>{entry.querySelector('strong')!.textContent='Alexandru-Mihai Popescu-Ionescu';});
  await checkNeighbourAlignment();await checkEntryAlignment();expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await page.getByRole('button',{name:`Read ${closing(0)}`,exact:true}).click();await expect(page.getByRole('button',{name:'Skip scene',exact:true})).toBeInViewport();
  const skip=(await page.getByRole('button',{name:'Skip scene',exact:true}).boundingBox())!;expect(skip.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({path:testInfo.outputPath('story-scene.png')});
});

const counter=(page: Page)=>page.locator('.story-controls > span');
const forward=(page: Page)=>page.locator('.story-controls .primary-button');
async function readNow(page: Page,title: string){await story(page);await page.locator('.story-waiting').getByRole('button',{name:`Read now: ${title}`,exact:true}).click();await expect(scene(page,title)).toBeVisible();}
async function line(page: Page,dialogue: SceneLine[],at: number){await expect(counter(page)).toHaveText(`${at+1} / ${dialogue.length}`);await expect(page.locator('#story-line')).toContainText(dialogue[at].text);}

test('a paid preparation scene resumes at its saved line after Escape, Close, and reload, without another payment',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});const task=data.tasks[1];await start(page,ready(1));
  await story(page);await page.getByRole('button',{name:/^Pay /}).first().click();await line(page,task.dialogue,0);
  await forward(page).click();await line(page,task.dialogue,1);
  await expect.poll(async()=>(await saved(page)).sceneLines).toEqual({[task.id]:1});const paid=await saved(page);expect(paid.pendingScenes).toEqual([task.id]);
  // Escape starts the room change and leaves the scene waiting at its line.
  await page.keyboard.press('Escape');await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done');await expect(page.locator('#modal')).toBeHidden();
  expect(await saved(page)).toEqual(paid);
  await readNow(page,task.title);await line(page,task.dialogue,1);
  await page.getByRole('button',{name:'Back',exact:true}).click();await line(page,task.dialogue,0);
  await expect.poll(async()=>Object.hasOwn(await saved(page),'sceneLines')).toBe(false);
  await forward(page).click();await forward(page).click();await line(page,task.dialogue,2);
  await expect.poll(async()=>(await saved(page)).sceneLines).toEqual({[task.id]:2});
  await page.locator('#close-modal').click();await expect(page.locator('#modal')).toBeHidden();
  await page.reload();await opened(page);await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','front-room-02');
  // After the reload, the room change is done, so the scene ends with the usual label.
  await readNow(page,task.title);await line(page,task.dialogue,2);await expect(forward(page)).toHaveText('Back to the kitchen');
  await forward(page).click();await expect(page.locator('#modal')).toBeHidden();
  const read=await saved(page);expect(read.pendingScenes).toEqual([]);expect(Object.hasOwn(read,'sceneLines')).toBe(false);
  const {sceneLines:_line,...rest}=paid;expect({...read,pendingScenes:paid.pendingScenes}).toEqual(rest);await expect(page.locator('#story .story-waiting')).toHaveCount(0);
});

test('Skip on a paid scene reads it and starts the room change, and then the chapter scene opens',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,ready(3));
  await story(page);await page.getByRole('button',{name:/^Pay /}).first().click();await expect(scene(page,data.tasks[3].title)).toBeVisible();
  await page.getByRole('button',{name:'Skip scene',exact:true}).click();
  await expect(scene(page,closing(0))).toBeVisible();await expect(page.locator('#room-stage')).toHaveAttribute('data-reveal','done');
  await line(page,data.chapters[0].closing,0);expect((await saved(page)).pendingScenes).toEqual(['chapter-1',...arrivals(3).map(person=>`arrival-${person.id}`)]);
});

test('a chapter scene resumes at its saved line after export and import, and a replay keeps that line',async({page})=>{
  const closingLines=data.chapters[0].closing,state=ready(4);state.pendingScenes=['chapter-1'];await start(page,state);
  await readNow(page,closing(0));await forward(page).click();await forward(page).click();await line(page,closingLines,2);
  await expect.poll(async()=>(await saved(page)).sceneLines).toEqual({'chapter-1':2});await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();
  // A replay of a read scene starts at its first line and changes no saved line.
  await journal(page);const replay=page.locator('[data-journal="task_2"]');await expect(replay).toContainText(`New: ${data.rooms.find(room=>room.after==='task_2')!.label}`);
  await replay.click();await line(page,data.tasks[1].dialogue,0);await forward(page).click();await line(page,data.tasks[1].dialogue,1);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Story journal',exact:true})).toBeVisible();
  const waiting=page.getByRole('button',{name:`Read ${closing(0)}`,exact:true});await expect(waiting).toContainText('New scene');
  await waiting.click();await line(page,closingLines,2);await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();
  const lined=await saved(page);expect(lined.sceneLines).toEqual({'chapter-1':2});
  await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(lined);
  await page.getByRole('button',{name:'Start a new game',exact:true}).click();await page.getByRole('button',{name:'Erase and start again'}).click();
  expect((await saved(page)).pendingScenes).toEqual([]);expect(Object.hasOwn(await saved(page),'sceneLines')).toBe(false);
  await options(page);await page.locator('input[type="file"]').setInputFiles({name:'story.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByRole('button',{name:'Import this saved game'}).click();expect(await saved(page)).toEqual(lined);
  await readNow(page,closing(0));await line(page,closingLines,2);
  await page.getByRole('button',{name:'Back',exact:true}).click();await line(page,closingLines,1);
  await page.reload();await opened(page);await readNow(page,closing(0));await line(page,closingLines,1);
});

test('a saved line past the end of its scene starts the scene again with a notice',async({page})=>{
  const state=ready(4);state.pendingScenes=['chapter-1'];state.sceneLines={'chapter-1':99};await start(page,state);
  await readNow(page,closing(0));await expect(scene(page,closing(0))).toContainText('Someone lost the thread. The conversation starts again from the beginning.');
  await line(page,data.chapters[0].closing,0);await forward(page).click();await expect.poll(async()=>(await saved(page)).sceneLines).toEqual({'chapter-1':1});
});

test('a failed line write warns once in the scene, the player reads on, and reload resumes at the last saved line',async({page})=>{
  const closingLines=data.chapters[0].closing,state=ready(4);state.pendingScenes=['chapter-1'];await start(page,state);
  await readNow(page,closing(0));await forward(page).click();await expect.poll(async()=>(await saved(page)).sceneLines).toEqual({'chapter-1':1});
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Quota exceeded');};});
  const warning=page.locator('.scene-unsaved');await expect(warning).toHaveCount(0);
  await forward(page).click();await line(page,closingLines,2);
  await expect(warning).toHaveText('This session is not saved. You can keep reading. Use Retry save in Options before you leave.');
  await forward(page).click();await line(page,closingLines,3);await expect(warning).toHaveCount(1);await expect(page.locator('#modal .save-error')).toHaveCount(1);
  expect((await saved(page)).sceneLines).toEqual({'chapter-1':1});
  await page.reload();await opened(page);await readNow(page,closing(0));await line(page,closingLines,1);
});

test('a regular’s arrival scene waits in Story after a reload and then opens their journal entry',async({page})=>{
  // Every arrival comes with the last preparation of a chapter, so the chapter closing plays before the first arrival.
  const index=7,people=arrivals(index);expect(people.length).toBeGreaterThan(0);
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,ready(index));await payAndRead(page);
  await expect(scene(page,closing(1))).toBeVisible({timeout:8000});await readTo(page,'Next scene');
  await expect(scene(page,`${people[0].name} arrives`)).toBeVisible();await expect(page.locator('.completion-message')).toHaveText(`${people[0].name} is now a regular. Read more about ${people[0].name} in the story journal.`);
  await page.keyboard.press('Escape');expect((await saved(page)).pendingScenes).toEqual(people.map(person=>`arrival-${person.id}`));
  await page.reload();await opened(page);await journal(page);
  const entry=page.getByRole('button',{name:`Read ${people[0].name} arrives`,exact:true});await expect(entry).toContainText('New scene');await entry.click();
  await expect(scene(page,`${people[0].name} arrives`)).toBeVisible();await readTo(page,'Return');
  await expect(page.getByRole('button',{name:`Meet ${people[0].name}`,exact:true})).toBeFocused();
  expect((await saved(page)).pendingScenes).toEqual(people.slice(1).map(person=>`arrival-${person.id}`));
});
