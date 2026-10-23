import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { requiredQuests } from '../../src/model.ts';
import type { GameState, SceneLine } from '../../src/model.ts';
import { checkpointState, deliverRequired } from '../../tools/create-checkpoint-saves.ts';
import { actOneTasks, KEY, prologueServed, act, recovery, supper, supperEvening, deliverMarch, checkpoint, data, deliverable, deliverButton, exportText, failWrites, forward, journal, opened, openQuest, options, painting, payAndRead, ratio, readNow, readTo, replaceSave, revealed, saved, start, startAgainAndImport, story, supplies, supply, tile } from './support.ts';

const closing=(index: number)=>`Chapter ${index+1} complete: ${data.chapters[index].title}`;
/** The regulars whose arrival scenes the payment of a preparation queues. */
const arrivals=(index: number)=>data.characters.filter(person=>person.arrival&&person.arrivesAfter===data.tasks[index].id);
/** A checkpoint ready to pay the next preparation, with every earlier scene read, so only new payments queue scenes. */
const payable=(count: number)=>checkpoint(count,{ready:true});
/** Reads the open scene and then each arrival scene that the payment of preparation index queued, back to the kitchen. */
async function readWithArrivals(page: Page,index: number){
  const people=arrivals(index);await readTo(page,people.length?'Next scene':'Back to the kitchen');
  for(const [at,person] of people.entries()){await expect(scene(page,`${person.name} arrives`)).toBeVisible();await readTo(page,at<people.length-1?'Next scene':'Back to the kitchen');}
}
const scene=(page: Page,title: string)=>page.getByRole('dialog',{name:title,exact:true});
/** Every preparation of act 1 is paid and each plate of the supper is on the board. A purse that can pay the first preparation of act 2 keeps the recovery quest away. */
const supperReady=()=>supply(supperEvening(checkpoint(actOneTasks,{coins:data.tasks[actOneTasks].cost})),supplies(supper));
/** Phone tickets open the quest to serve; desktop tickets serve directly. */
async function serveSupper(page: Page){
  if(page.viewportSize()!.width<1024){await openQuest(page,supper);await scene(page,supper.title).getByRole('button',{name:`Serve ${supper.title}`,exact:true}).click();}
  else await deliverButton(page,supper).click();
}
/** The supper painting after the finale: its picture has loaded, it names the guests, and the ending line stands under it. */
async function supperPainting(page: Page){
  const dialog=scene(page,'The supper'),image=dialog.locator('img');await expect(dialog).toBeVisible();
  await expect(image).toHaveAttribute('alt',/Mara stands at the long table/);await expect(dialog.locator('.completion-message')).toHaveText(data.finales[0].ending);
  await expect.poll(()=>image.evaluate(e=>{const value=e as HTMLImageElement;return value.complete?value.naturalWidth:0;})).toBeGreaterThan(0);
  return dialog;
}
/** After the supper, the bistro has no other work: only the first repeating quest is on the counter. */
const onlyRepeating=async(page: Page)=>{await expect(page.locator('#tickets .ticket')).toHaveCount(1);await expect(page.locator('#tickets .ticket[data-quest="sorin-staff-meal"]')).toBeVisible();await expect(page.locator('.tickets-empty')).toHaveCount(0);};

test('the story shows the chapter objective and the state of its four preparations',async({page})=>{
  await start(page,payable(5));const chapter=data.chapters[1],tasks=data.tasks.slice(4,8);
  await expect(page.locator('#story .chapter-title')).toHaveText(chapter.title);await expect(page.locator('#story .chapter-objective')).toHaveText(chapter.objective);
  await expect(page.locator('#story .chapter-steps li')).toHaveText([`${tasks[0].title}: done`,`${tasks[1].title}: now`,`${tasks[2].title}: not yet`,`${tasks[3].title}: not yet`]);
  await expect(page.getByRole('list',{name:'Chapter 2 preparations'})).toBeVisible();await expect(page.locator('#story .story-waiting')).toHaveCount(0);
  // The later scenes stay unseen: no closing line of this or a later chapter is on the page.
  for(const later of data.chapters.slice(1))for(const line of later.closing)await expect(page.locator('body')).not.toContainText(line.text);
});

test('the last preparation of a chapter opens its closing scene after the reveal, then the arrivals, and the next chapter starts',async({page})=>{
  await start(page,payable(3));await payAndRead(page);
  const dialog=scene(page,closing(0));await expect(dialog).toBeVisible({timeout:8000});await revealed(page);
  await expect(dialog).toContainText(data.chapters[0].payoff);await expect(page.locator('#story-line')).toContainText(data.chapters[0].closing[0].text);
  const paid=await saved(page);expect(paid.pendingScenes).toEqual(['chapter-1',...arrivals(3).map(person=>`arrival-${person.id}`)]);expect(paid.taskIndex).toBe(4);
  expect(arrivals(3).length).toBeGreaterThan(0);
  await readWithArrivals(page,3);await expect(page.locator('#modal')).toBeHidden();
  const read=await saved(page);expect(read.pendingScenes).toEqual([]);expect({...read,pendingScenes:paid.pendingScenes}).toEqual(paid);
  await expect(page.locator('#story .chapter-title')).toHaveText(data.chapters[1].title);await expect(page.locator('#story .chapter-steps li').first()).toHaveText(`${data.tasks[4].title}: now`);
  await journal(page,['chapters','conversations','neighbours']);const section=page.locator('[data-chapter="chapter-1"]');await expect(section).toContainText(data.chapters[0].payoff);
  await expect(section.getByRole('button',{name:`Replay ${closing(0)}`,exact:true})).toBeVisible();
  await expect(page.locator('[data-chapter="chapter-2"]')).toContainText(`Goal: ${data.chapters[1].objective}`);await expect(page.locator('[data-chapter="chapter-3"]')).toHaveCount(0);
  // The new regulars now have journal entries.
  for(const person of arrivals(3))await expect(page.getByRole('button',{name:`Meet ${person.name}`,exact:true})).toBeVisible();
});

test('closing a chapter scene leaves it waiting through reload, and cooking never waits for it',async({page})=>{
  await start(page,payable(7));await payAndRead(page);await expect(scene(page,closing(1))).toBeVisible({timeout:8000});
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual(['chapter-2',...arrivals(7).map(person=>`arrival-${person.id}`)]);
  // The next preparation and the board stay usable while the scene waits.
  const before=await saved(page),source=before.board.findIndex(cell=>cell?.code==='generator_herbs');await tile(page,source).click();
  expect((await saved(page)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);
  await page.reload();await opened(page);await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  const waiting=page.locator('#story .story-waiting');await expect(waiting).toContainText('Chapter 2 is complete.');
  await waiting.getByRole('button',{name:`Read now: ${closing(1)}`,exact:true}).click();await expect(page.locator('#modal-title')).toBeFocused();
  await readWithArrivals(page,7);expect((await saved(page)).pendingScenes).toEqual([]);await expect(page.locator('#story .story-waiting')).toHaveCount(0);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`completing a transcript from Read now returns keyboard focus to Story at ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);const state=payable(4);state.pendingScenes=['chapter-1'];await start(page,state);
  await readNow(page,closing(0));
  await transcript(page,data.chapters[0].closing);await readTo(page,'Back to the kitchen');
  await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual([]);
  const target=viewport.width>1023?page.locator('#story').getByRole('button',{name:'Open the story journal',exact:true}):page.locator('#story-button');
  await expect(target).toBeFocused();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:viewport.width>1023?'Story journal':'Our little bistro',exact:true})).toBeVisible();
});

for(const dismiss of ['Escape','Close'] as const)test(`${dismiss} on the next waiting scene keeps a visible keyboard focus target`,async({page})=>{
  const state=payable(8);state.pendingScenes=['chapter-1','chapter-2'];await start(page,state);
  await readNow(page,closing(0));await readTo(page,'Next scene');
  await expect(scene(page,closing(1))).toBeVisible();
  if(dismiss==='Escape')await page.keyboard.press('Escape');else await page.locator('#close-modal').click();
  await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).pendingScenes).toEqual(['chapter-2']);
  await expect(page.locator('#story').getByRole('button',{name:'Open the story journal',exact:true})).toBeFocused();
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`the finale stays out of the journal until the supper is served at ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);await start(page,supperReady());
  await journal(page,['chapters','conversations','neighbours']);await expect(page.locator(`[data-journal="${data.finales[0].id}"]`)).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'The finale',exact:true})).toHaveCount(0);
  await page.keyboard.press('Escape');await serveSupper(page);
  await expect(scene(page,data.finales[0].title)).toBeVisible();await page.keyboard.press('Escape');
  await journal(page,['chapters','conversations','neighbours']);await expect(page.getByRole('button',{name:`Read ${data.finales[0].title}`,exact:true})).toBeVisible();
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`a failed supper save warns inside the finale before reading at ${viewport.width}`,async({page,context})=>{
  const initial=supperReady();
  await page.setViewportSize(viewport);await start(page,initial);await failWrites(page);
  await serveSupper(page);
  const dialog=scene(page,data.finales[0].title),warning=dialog.locator('.scene-unsaved');
  await expect(warning).toHaveText('This session is not saved. You can keep reading. Use Retry save in Options before you leave.');
  // The native modal excludes the outside toast from Chromium's accessibility tree.
  const cdp=await context.newCDPSession(page),tree=await cdp.send('Accessibility.getFullAXTree');
  expect(tree.nodes.some(node=>!node.ignored&&node.name?.value?.includes('This session is not saved.'))).toBe(true);
  await expect(page.locator('.toast')).toHaveCount(0,{timeout:8000});await expect(warning).toBeVisible();
  expect(await saved(page)).toEqual(initial);await page.reload();await opened(page);expect(await saved(page)).toEqual(initial);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`after the supper is served the courtyard shows the supper painting without finishes, also after a reload, at ${viewport.width}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await start(page,{...supperReady(),decorationChoices:{textiles:'blue'}});
  await expect.poll(()=>painting(page)).toMatch(/^front-room-24-/);
  await serveSupper(page);
  await expect(scene(page,data.finales[0].title)).toBeVisible();await page.keyboard.press('Escape');
  const supperRoom=async()=>{
    await expect(page.locator('#room-frame')).toHaveAttribute('data-painting','finale-supper');await expect.poll(()=>painting(page)).toMatch(/^finale-supper-/);
    await expect(page.getByRole('button',{name:'Courtyard',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('#room-pin')).toBeHidden();
    await expect(page.locator('#room-finishes .room-finish')).toHaveCount(0);await expect(page.locator('#room-decorations .decoration-layer')).toHaveCount(0);
  };
  await supperRoom();await page.screenshot({path:testInfo.outputPath('supper-room.png')});
  await page.reload();await opened(page);await supperRoom();
  if(viewport.width<1024)await page.locator('#drawer-handle').click();
  await page.getByRole('button',{name:'Front room',exact:true}).click();await expect.poll(()=>painting(page)).toMatch(/^front-room-24-/);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`the supper quest replay restores journal focus after Return, Escape, and Close at ${viewport.width}`,async({page})=>{
  const paid=act(supperReady(),{type:'deliverQuest',id:supper.id});
  await page.setViewportSize(viewport);await start(page,paid);await journal(page,['chapters','conversations','neighbours']);
  const opening=page.getByRole('button',{name:`Read quest: ${supper.title}`,exact:true});
  for(const dismiss of ['Return','Escape','Close']){
    await opening.click();await expect(scene(page,supper.title)).toBeVisible();
    if(dismiss==='Return')await readTo(page,'Return');else if(dismiss==='Escape')await page.keyboard.press('Escape');else await page.locator('#close-modal').click();
    await expect(opening).toBeFocused();expect(await saved(page)).toEqual(paid);
  }
});

test('serving the supper pays nothing and opens the finale and the supper painting; reading and replay change nothing else, and the empty purse keeps the recovery quest',async({page})=>{
  const initial=supply(payable(23),supplies(supper));await start(page,initial);await payAndRead(page);await expect(scene(page,closing(5))).toBeVisible({timeout:8000});
  const paid=await saved(page);expect(paid.pendingScenes).toEqual(['chapter-6']);expect(paid.coins).toBe(0);
  await readTo(page,'Back to the kitchen');await expect(page.locator('#modal')).toBeHidden();
  // The supper is served on the evening of 1 May.
  await expect(deliverButton(page,supper)).toBeDisabled();await replaceSave(page,supperEvening(await saved(page)));
  // The supper waits on the counter. The purse is empty while it is open, so Ana's recovery quest takes the ticket after it.
  await expect(page.locator('#story .task-content')).toContainText(supper.title);
  expect(await page.locator('#tickets .ticket').evaluateAll(cards=>cards.map(card=>(card as HTMLElement).dataset.quest))).toEqual([supper.id,recovery.id]);
  const button=deliverButton(page,supper);await expect(button).toHaveText('Serve');await expect(button).toHaveAccessibleName(`Serve ${supper.title}`);
  await expect(button).toBeEnabled();await button.click();
  await expect(scene(page,data.finales[0].title)).toBeVisible();await expect(page.locator('#story-line')).toContainText(data.finales[0].dialogue[0].text);
  const supped=await saved(page);expect(supped.coins).toBe(0);expect(supped.pendingScenes).toEqual(['finale']);expect(supped.completedQuests.at(-1)).toBe(supper.id);
  expect(supped.board.filter(Boolean).length).toBe(paid.board.filter(Boolean).length-supplies(supper).length);
  await page.getByRole('button',{name:'See the supper',exact:true}).click();
  await (await supperPainting(page)).getByRole('button',{name:'Back to the kitchen',exact:true}).click();await expect(page.locator('#modal')).toBeHidden();
  const read=await saved(page);expect(read.pendingScenes).toEqual([]);expect({...read,pendingScenes:supped.pendingScenes}).toEqual(supped);
  await expect(page.locator('#story')).toContainText('The table is ready.');await expect(page.getByRole('button',{name:/^Pay /})).toHaveCount(0);
  // The supper has no completion scene of its own: the journal keeps its quest and replays the finale instead.
  await journal(page,['chapters','conversations','neighbours']);await expect(page.getByRole('button',{name:`Read quest: ${supper.title}`,exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:`Replay ${supper.title}`,exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:`Replay ${data.finales[0].title}`,exact:true}).click();
  await transcript(page,data.finales[0].dialogue);await page.getByRole('button',{name:'See the supper',exact:true}).click();
  await (await supperPainting(page)).getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('button',{name:`Replay ${data.finales[0].title}`,exact:true})).toBeFocused();expect(await saved(page)).toEqual(read);
  await page.keyboard.press('Escape');await page.reload();await opened(page);expect(await saved(page)).toEqual(read);
  // The empty purse cannot pay the first preparation of act 2, so only Ana's recovery quest stays on the counter.
  await expect(page.locator('#modal')).toBeHidden();expect(await page.locator('#tickets .ticket').evaluateAll(cards=>cards.map(card=>(card as HTMLElement).dataset.quest))).toEqual([recovery.id]);
});

test('a reload during the last preparation story resumes the waiting scenes in order, an empty purse brings the recovery quest, and the board still plays',async({page})=>{
  const state=act(payable(23),{type:'task'});expect(state.pendingScenes).toEqual(['task_24','chapter-6']);
  await start(page,state);await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  // The preparation scene resumes first. The room change is already done, so it leads on to the next scene.
  await readNow(page,data.tasks[23].title);
  await readTo(page,'Next scene');await expect(scene(page,closing(5))).toBeVisible();await readTo(page,'Back to the kitchen');expect((await saved(page)).pendingScenes).toEqual([]);
  // The supper waits for its plates, and the empty purse brings Ana's recovery quest on its own dashed ticket.
  const tickets=page.locator('#tickets .ticket');await expect(tickets).toHaveCount(2);
  await expect(tickets.nth(0)).toHaveAttribute('data-quest',supper.id);await expect(tickets.nth(0).locator('.deliver-button')).toBeDisabled();
  await expect(tickets.nth(1)).toHaveAttribute('data-quest',recovery.id);await expect(tickets.nth(1)).toHaveClass(/recovery-ticket/);
  await tickets.nth(1).locator('.ticket-face').click();await expect(scene(page,recovery.title)).toContainText('Ana returns while the purse runs low. Herbs from the Herb basket are free.');
  await page.keyboard.press('Escape');
  const before=await saved(page),source=before.board.findIndex(cell=>cell?.code==='generator_herbs');await tile(page,source).click();
  expect((await saved(page)).board.filter(Boolean).length).toBe(before.board.filter(Boolean).length+1);expect((await saved(page)).coins).toBe(0);
});

/** A paid preparation whose next one costs more than four teas pay, with every open quest delivered, so the recovery quest stays open. */
function recoveryCheckpoint(){
  for(let count=1;count<data.tasks.length;count++){
    const state=checkpoint(count,{ready:true});state.coins=0;
    if(state.completedQuests.length%3===0&&data.tasks[count].cost>4*recovery.reward)return state;
  }
  throw new Error('No checkpoint keeps the recovery quest open for four deliveries.');
}

test('recovery deliveries send a bat on every third delivery in the current tab visit, and record nothing',async({page})=>{
  const initial=supply(recoveryCheckpoint(),Array.from({length:4},()=>supplies(recovery)).flat());
  expect(initial.completedQuests.length%3).toBe(0);
  await page.emulateMedia({reducedMotion:'no-preference'});await start(page,initial);
  await page.getByRole('button',{name:'Front room',exact:true}).click();await expect.poll(()=>painting(page)).toMatch(/^front-room-/);
  // A bat leaves when its flight ends. Pause the flight, so that the count does not depend on the speed of the test.
  await page.evaluate(()=>{
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(...args){const animation=animate.apply(this,args);if(this.classList.contains('bat'))animation.pause();return animation;};
  });
  const deliver=deliverButton(page,recovery),bat=page.locator('.window-sky .bat');
  for(let count=1;count<=3;count++){
    await deliver.click();const state=await saved(page);expect(state.coins).toBe(count*recovery.reward);
    expect(state.completedQuests).toEqual(initial.completedQuests);expect(state.pendingScenes).toEqual([]);await expect(bat).toHaveCount(count===3?1:0);
  }
  await page.reload();await opened(page);await expect.poll(()=>painting(page)).toMatch(/^front-room-/);
  await deliver.click();expect((await saved(page)).coins).toBe(4*recovery.reward);await expect(bat).toHaveCount(0);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'])test(`a recovery delivery flies to its ticket beside the empty counter at ${viewport.width}px in ${theme}`,async({page},testInfo)=>{
  const initial=supply(recoveryCheckpoint(),supplies(recovery));
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'no-preference'});await start(page,initial,theme);
  await expect(page.locator('#tickets .tickets-empty')).toBeVisible();
  const card=page.locator(`#tickets [data-quest="${recovery.id}"]`),target=(await card.boundingBox())!;
  // Pause the real flight so its endpoint can be measured without a timer race.
  await page.evaluate(()=>{
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(...args){const animation=animate.apply(this,args);if(this.classList.contains('deliver-flight'))animation.pause();return animation;};
  });
  if(viewport.width<1024){await card.locator('.ticket-face').click();await page.locator('#modal .quest-deliver').click();}
  else await card.locator('.deliver-button').click();
  const flight=page.locator('.deliver-flight');await expect(flight).toHaveCount(1);
  const end=await flight.evaluate(element=>{
    const animation=element.getAnimations()[0],effect=animation.effect as KeyframeEffect,frame=effect.getKeyframes().at(-1)!;
    const transform=new DOMMatrix(String(frame.transform)),box=element.getBoundingClientRect();
    animation.currentTime=Number(effect.getTiming().duration)*.88;
    return {x:box.x+box.width/2+transform.e,y:box.y+box.height/2+transform.f};
  });
  expect(end.x).toBeCloseTo(target.x+target.width/2,1);expect(end.y).toBeCloseTo(target.y+target.height/2,1);
  expect((await saved(page)).coins).toBe(initial.coins+recovery.reward);
  await expect(card).toHaveCSS('opacity','1');
  await page.screenshot({path:testInfo.outputPath('recovery-flight-end.png')});
});

test('a fresh save plays through every payment, chapter scene, the supper, and the finale, and the goals, help, and payoffs agree',async({page})=>{
  test.setTimeout(300000);await page.emulateMedia({reducedMotion:'reduce'});
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await start(page);let state: GameState=await saved(page);
  for(const [index,task] of data.tasks.slice(0,actOneTasks).entries()){
    // The quests that the payment needs are delivered and its coins earned; the rules tests cover how. The interface pays, tells, reveals, and closes each chapter.
    deliverRequired(state,data);deliverMarch(state);
    state.coins=task.cost;
    await replaceSave(page,state);
    const chapter=data.chapters[task.chapter-1];
    await expect(page.locator('#story .chapter-title')).toHaveText(chapter.title);await expect(page.locator('#story .chapter-objective')).toHaveText(chapter.objective);
    await expect(page.locator('#story .chapter-steps li').nth(index%4)).toHaveText(`${task.title}: now`);
    await expect(page.locator('#story .task-ready')).toHaveText('Ready to prepare.');
    await expect(page.locator('#story .pay-button')).toHaveAccessibleDescription(new RegExp(`Quests delivered: ${requiredQuests(index,data).length} / ${requiredQuests(index,data).length}`));
    await payAndRead(page);await revealed(page);
    await expect(page.locator('#status')).toHaveText(data.rooms.find(room=>room.after===task.id)!.text);
    if(index%4===3){
      await expect(scene(page,closing(task.chapter-1))).toBeVisible();await expect(page.locator('.completion-message')).toHaveText(chapter.payoff);
      await transcript(page,chapter.closing);
      await readWithArrivals(page,index);await expect(page.locator('#modal')).toBeHidden();
      // The neighbour who helps this chapter has delivered, and the journal says so beside the payoff.
      const help=data.quests.find(value=>value.id===chapter.contribution)!;
      await journal(page,['chapters','conversations','neighbours']);const section=page.locator(`[data-chapter="${chapter.id}"]`);await expect(section).toContainText(chapter.payoff);
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
  expect(new Set(state.completedQuests.filter(id=>!prologueServed.includes(id)&&!data.quests.find(value=>value.id===id)!.march))).toEqual(new Set(requiredQuests(actOneTasks,data).filter(value=>!value.act).map(value=>value.id)));
  // Each plate of the supper is on the board; the rules tests cover how they are cooked. A purse that can pay the first preparation of act 2
  // keeps the recovery quest away, so a repeating quest opens after the supper.
  state={...supply(supperEvening(state),supplies(supper)),coins:data.tasks[actOneTasks].cost};await replaceSave(page,state);
  await deliverButton(page,supper).click();await expect(scene(page,data.finales[0].title)).toBeVisible();
  await transcript(page,data.finales[0].dialogue);await readTo(page,'See the supper');
  await (await supperPainting(page)).getByRole('button',{name:'Back to the kitchen',exact:true}).click();await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#story')).toContainText('The table is ready.');await onlyRepeating(page);
  await journal(page,['chapters','conversations','neighbours']);await expect(page.getByRole('button',{name:`Replay ${data.finales[0].title}`,exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:390,height:800}])for(const theme of ['light','dark'] as const)test(`chapter story fits ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const state=payable(13);state.pendingScenes=['chapter-1','chapter-2','chapter-3'];await start(page,state);await story(page);
  const card=page.locator(viewport.width>1023?'#story':'#modal');await expect(card.locator('.story-waiting')).toBeVisible();
  for(const control of await card.locator('.story-waiting button,.story-links button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  const colors=await card.evaluate(element=>{
    let surface: Element=element;while(getComputedStyle(surface).backgroundColor==='rgba(0, 0, 0, 0)'&&surface.parentElement)surface=surface.parentElement;
    return {background:getComputedStyle(surface).backgroundColor,inks:[...element.querySelectorAll('.chapter-objective,.chapter-steps>span,.story-waiting p')].map(node=>getComputedStyle(node).color)};
  });expect(colors.inks.length).toBeGreaterThan(0);
  for(const ink of colors.inks)expect(ratio(colors.background,ink)).toBeGreaterThanOrEqual(4.5);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('story-card.png')});
  await page.getByRole('button',{name:'Open the story journal',exact:true}).click();
  for(const summary of await page.locator('.journal-group>summary').all())await summary.click();
  const arrived=data.characters.filter(person=>!person.singleVisit&&!person.family&&(!person.arrivesAfter||data.tasks.findIndex(task=>task.id===person.arrivesAfter)<13));
  const entries=page.locator('.neighbour-entry:not(.not-yet)'),neighbours=page.locator('.neighbour-introduction');
  await expect(entries).toHaveCount(arrived.filter(person=>!person.visitor).length);await expect(neighbours).toHaveCount(arrived.filter(person=>person.visitor).length);
  await expect(page.locator('.neighbour-entry.not-yet')).toHaveCount(data.characters.filter(person=>!person.visitor&&!person.family).length-arrived.filter(person=>!person.visitor).length);
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
  await page.getByRole('button',{name:`Read ${closing(0)}`,exact:true}).click();await transcript(page,data.chapters[0].closing);
  await forward(page).scrollIntoViewIfNeeded();await expect(forward(page)).toBeInViewport();
  const done=(await forward(page).boundingBox())!;expect(done.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({path:testInfo.outputPath('story-scene.png')});
});

async function transcript(page: Page,dialogue: SceneLine[]){
  const turns=page.locator('#story-line.story-transcript .story-turn');await expect(turns).toHaveCount(dialogue.length);
  for(const [at,value] of dialogue.entries()){
    const turn=turns.nth(at);await expect(turn.locator('.portrait')).toHaveCount(1);
    await expect(turn.locator('h3')).toHaveText(data.characters.find(person=>person.id===value.speaker)!.name);
    await expect(turn.locator('p')).toHaveText(value.text);
  }
  await expect(page.locator('.story-controls button')).toHaveCount(1);
}
const paidSupper=()=>act(supperReady(),{type:'deliverQuest',id:supper.id});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`a paid preparation opens its whole conversation and needs one completion at ${viewport.width}`,async({page})=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});const task=data.tasks[1];await start(page,payable(1));
  await story(page);await page.getByRole('button',{name:/^Pay /}).first().click();await transcript(page,task.dialogue);
  await expect(page.locator('#modal-title')).toBeFocused();expect(await page.locator('#modal').evaluate(element=>element.scrollTop)).toBe(0);
  await expect(forward(page)).toHaveText('See what changed');const paid=await saved(page);expect(paid.pendingScenes).toEqual([task.id]);
  await forward(page).click();await revealed(page);await expect(page.locator('#modal')).toBeHidden();
  expect(await saved(page)).toEqual(act(paid,{type:'readScene',id:task.id}));
});

for(const dismiss of ['Escape','Close'] as const)test(`${dismiss} leaves a conversation unread, and reopening starts at the top`,async({page})=>{
  await page.setViewportSize({width:390,height:600});const task=data.tasks[1],state=payable(2);state.pendingScenes=[task.id];await start(page,state);
  await readNow(page,task.title);await transcript(page,task.dialogue);await expect(page.locator('#modal-title')).toBeFocused();
  expect(await page.locator('#modal').evaluate(element=>element.scrollTop)).toBe(0);await forward(page).scrollIntoViewIfNeeded();
  if(dismiss==='Escape')await page.keyboard.press('Escape');else await page.locator('#close-modal').click();
  await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(state);
  await page.reload();await opened(page);await readNow(page,task.title);await transcript(page,task.dialogue);
  await expect(page.locator('#modal-title')).toBeFocused();expect(await page.locator('#modal').evaluate(element=>element.scrollTop)).toBe(0);expect(await saved(page)).toEqual(state);
  await expect(forward(page)).toHaveText('Back to the kitchen');await forward(page).click();await expect(page.locator('#modal')).toBeHidden();
  expect(await saved(page)).toEqual(act(state,{type:'readScene',id:task.id}));
});

test('Escape on a paid transcript starts its room change but leaves the conversation unread',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});const task=data.tasks[1];await start(page,payable(1));
  await story(page);await page.getByRole('button',{name:/^Pay /}).first().click();await transcript(page,task.dialogue);const paid=await saved(page);
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();await revealed(page);
  expect(await saved(page)).toEqual(paid);await readNow(page,task.title);await transcript(page,task.dialogue);await expect(forward(page)).toHaveText('Back to the kitchen');
  await forward(page).click();await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(act(paid,{type:'readScene',id:task.id}));
});

test('completing a paid transcript starts the room change before the next chapter conversation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,payable(3));
  await story(page);await page.getByRole('button',{name:/^Pay /}).first().click();await expect(scene(page,data.tasks[3].title)).toBeVisible();await transcript(page,data.tasks[3].dialogue);
  await forward(page).click();await expect(scene(page,closing(0))).toBeVisible();await revealed(page);
  await transcript(page,data.chapters[0].closing);expect((await saved(page)).pendingScenes).toEqual(['chapter-1',...arrivals(3).map(person=>`arrival-${person.id}`)]);
});

test('the finale opens as one transcript, Escape and reload leave it waiting, and its action opens the supper',async({page})=>{
  const state=paidSupper();await start(page,state);await readNow(page,data.finales[0].title);await transcript(page,data.finales[0].dialogue);
  await expect(page.locator('#modal-title')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();
  await page.reload();await opened(page);expect(await saved(page)).toEqual(state);await readNow(page,data.finales[0].title);await transcript(page,data.finales[0].dialogue);
  await page.getByRole('button',{name:'See the supper',exact:true}).click();await supperPainting(page);
  expect(await saved(page)).toEqual(act(state,{type:'readScene',id:data.finales[0].id}));
});

test('a regular’s arrival scene waits in Story after a reload and then opens their journal entry',async({page})=>{
  // Every arrival comes with the last preparation of a chapter, so the chapter closing plays before the first arrival.
  const index=7,people=arrivals(index);expect(people.length).toBeGreaterThan(0);
  await page.emulateMedia({reducedMotion:'reduce'});await start(page,payable(index));await payAndRead(page);
  await expect(scene(page,closing(1))).toBeVisible({timeout:8000});await readTo(page,'Next scene');
  await expect(scene(page,`${people[0].name} arrives`)).toBeVisible();await expect(page.locator('.completion-message')).toHaveText(`${people[0].name} is now a regular. Read more about ${people[0].name} in the story journal.`);
  await page.keyboard.press('Escape');expect((await saved(page)).pendingScenes).toEqual(people.map(person=>`arrival-${person.id}`));
  await page.reload();await opened(page);await journal(page,['chapters','conversations','neighbours']);
  const entry=page.getByRole('button',{name:`Read ${people[0].name} arrives`,exact:true});await expect(entry).toContainText('New scene');await entry.click();
  await expect(scene(page,`${people[0].name} arrives`)).toBeVisible();await readTo(page,'Return');
  await expect(page.getByRole('button',{name:`Meet ${people[0].name}`,exact:true})).toBeFocused();
  expect((await saved(page)).pendingScenes).toEqual(people.slice(1).map(person=>`arrival-${person.id}`));
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`the supper ticket, its plates, and the supper painting fit ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  // On the evening of the supper without its plates, the supper ticket shows its first three plates and the count of the others. Serve waits for them.
  await start(page,supperEvening(checkpoint(actOneTasks,{coins:data.economy.recoveryFloor})),theme);
  expect(supper.requirements).toHaveLength(11);expect(supper.reward).toBe(0);expect(supper.guests).toHaveLength(11);
  const card=page.locator(`#tickets .ticket[data-quest="${supper.id}"]`),button=card.locator('.deliver-button');
  await expect(page.locator('#tickets .ticket')).toHaveCount(1);await expect(card).toBeInViewport();
  await expect(card.locator('.ticket-item:not(.ticket-more)')).toHaveCount(3);await expect(card.locator('.ticket-more')).toHaveText('+8');
  await expect(card.locator('.ticket-face')).toHaveAccessibleName(`${supper.title}: ${supper.requirements.map(({item,quantity})=>`${quantity} ${data.items[item].name}, 0 on the board`).join('; ')}. Booked for 20:00`);
  await expect(button).toBeDisabled();await expect(button).toHaveText('Serve');await expect(button.locator('.coin')).toHaveCount(0);
  if(viewport.width>=1024)await expect(button).toHaveAccessibleName(`Serve ${supper.title}`);else await expect(button).toBeHidden();
  const fits=async()=>{
    const target=viewport.width<1024?card.locator('.ticket-face'):button;
    const [box,more,face]=await Promise.all([target.boundingBox(),card.locator('.ticket-more').boundingBox(),card.boundingBox()]);
    if(viewport.width>=1024){const word=(await button.locator('.deliver-word').boundingBox())!;
      expect(word.width).toBeGreaterThan(0);expect(word.x).toBeGreaterThanOrEqual(box!.x);expect(word.x+word.width).toBeLessThanOrEqual(box!.x+box!.width);}
    else {await expect(card.getByRole('button')).toHaveCount(1);for(const count of await card.locator('.ticket-count').all())await expect(count).toBeVisible();}
    expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(viewport.width<1024?44:36);
    expect(more!.width).toBeGreaterThan(0);expect(more!.x+more!.width).toBeLessThanOrEqual(face!.x+face!.width);
    expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  };
  await fits();await page.screenshot({path:testInfo.outputPath('supper-ticket-waiting.png')});
  // The dialog lists every plate with the name of its guest, says that the supper pays nothing, and serves it.
  await card.locator('.ticket-face').click();const dialog=page.getByRole('dialog',{name:supper.title,exact:true});
  await expect(dialog.locator('.quest-item > span:not(.quest-count)')).toHaveText(supper.requirements.map(({item,quantity},at)=>`${data.characters.find(person=>person.id===supper.guests![at])!.name}: ${quantity} ${data.items[item].name}`));
  await expect(dialog.locator('.quest-item').first()).toHaveAccessibleName(`Mara: 1 ${data.items[supper.requirements[0].item].name}: 0 of 1 on the board`);
  await expect(dialog.locator('.quest-reward')).toHaveText('The supper pays nothing. Serving it opens the finale.');
  await expect(dialog.locator('.quest-find')).toHaveCount(supper.requirements.length);
  await expect(dialog.getByRole('button',{name:`Serve ${supper.title}`,exact:true})).toBeDisabled();
  expect(await page.locator('#modal').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('supper-dialog.png')});
  await page.keyboard.press('Escape');
  // With every plate on the board, Serve is ready.
  await replaceSave(page,supperReady());await expect(button).toBeEnabled();await expect(card.locator('.ticket-item.ready:not(.ticket-more)')).toHaveCount(3);
  await fits();await page.screenshot({path:testInfo.outputPath('supper-ticket.png')});
  await serveSupper(page);await page.getByRole('button',{name:'See the supper',exact:true}).click();
  const painted=await supperPainting(page),done=painted.getByRole('button',{name:'Back to the kitchen',exact:true});
  // The painting, the ending line, and the button fit the screen without a scroll.
  await expect(painted.locator('img')).toBeInViewport({ratio:1});await expect(done).toBeInViewport({ratio:1});await expect(done).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await painted.evaluate(e=>e.scrollHeight<=e.clientHeight)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('supper-painting.png')});
});

test('a conversation survives export and import while waiting and writes nothing until completion',async({page})=>{
  await page.setViewportSize({width:390,height:600});const task=data.tasks[1],state=payable(2);state.pendingScenes=[task.id];await start(page,state);
  await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(state);
  await startAgainAndImport(page,text);expect(await saved(page)).toEqual(state);
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;document.documentElement.dataset.storyWrites='0';
    Storage.prototype.setItem=function(name,value){if(name===key)document.documentElement.dataset.storyWrites=String(Number(document.documentElement.dataset.storyWrites)+1);original.call(this,name,value);};
  },KEY);
  await readNow(page,task.title);await transcript(page,task.dialogue);await forward(page).scrollIntoViewIfNeeded();await page.locator('#close-modal').click();
  await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(state);await expect(page.locator('html')).toHaveAttribute('data-story-writes','0');
  await readNow(page,task.title);await transcript(page,task.dialogue);await forward(page).click();await expect(page.locator('#modal')).toBeHidden();
  expect(await saved(page)).toEqual(act(state,{type:'readScene',id:task.id}));
});

test('a reply transcript keeps the failed delivery save warning after Close and reads only in the session',async({page})=>{
  const value=data.quests.find(quest=>quest.id==='mara-welcome')!,initial=deliverable(value),delivered=act(initial,{type:'deliverQuest',id:value.id});
  await start(page,initial);await failWrites(page);await deliverButton(page,value).click();
  await page.getByRole('button',{name:'Read Mara’s reply',exact:true}).click();await transcript(page,value.completion);
  const warning=page.locator('#modal .scene-unsaved');await expect(warning).toHaveText('This session is not saved. You can keep reading. Use Retry save in Options before you leave.');await expect(warning).toBeVisible();
  expect(await saved(page)).toEqual(initial);await page.locator('#close-modal').click();await expect(page.locator('#modal')).toBeHidden();
  await readNow(page,value.title);await transcript(page,value.completion);await expect(warning).toBeVisible();
  await forward(page).click();await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(initial);
  await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(act(delivered,{type:'readScene',id:value.id}));
});

test('after the purchase of the orchard, the game opens on the result card of act 2, and the purchase scene reads and replays', async ({ page }) => {
  const finished = checkpointState(data, data.tasks.length), purchase = data.tasks.at(-1)!;
  expect(finished.pendingScenes).toEqual([purchase.id]);
  await start(page, finished);
  await story(page);
  const card = page.locator('#story');
  await expect(card).toContainText('The orchard is yours.');
  await expect(card).toContainText('The trees creak, and they wait for autumn.');
  await expect(card).toContainText(`The purse holds ${finished.act2!.purse} coins.`);
  await card.getByRole('button', { name: `Read now: ${purchase.title}`, exact: true }).click();
  await expect(page.locator('#modal-title')).toHaveText(purchase.title);
  await page.getByRole('button', { name: 'Back to the kitchen', exact: true }).click();
  expect((await saved(page)).pendingScenes).toEqual([]);
  await journal(page);
  await expect(page.getByRole('button', { name: `Replay ${purchase.title}`, exact: true })).toBeVisible();
});

test('on 31 August the orchard shows as a payment with its price, and its payment opens the purchase scene and then the result card', async ({ page }) => {
  const ready = checkpointState(data, data.tasks.length - 1), purchase = data.tasks.at(-1)!;
  await start(page, ready);
  await story(page);
  const card = page.locator('#story');
  await expect(card.locator('h3')).toHaveText(purchase.title);
  await expect(card.locator('.task-ready')).toHaveText('Ready to buy.');
  await card.getByRole('button', { name: `Pay ${purchase.cost.toLocaleString('en')} coins: ${purchase.title}`, exact: true }).click();
  await expect(page.locator('#modal-title')).toHaveText(purchase.title);
  await page.getByRole('button', { name: 'Back to the kitchen', exact: true }).click();
  await expect(card).toContainText('The orchard is yours.');
  const done = await saved(page);
  expect(done.taskIndex).toBe(data.tasks.length);
  expect(done.act2).toEqual({ purse: ready.coins - purchase.cost });
  expect(done.pendingScenes).toEqual([]);
});
