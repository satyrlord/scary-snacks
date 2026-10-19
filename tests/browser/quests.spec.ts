import { test, expect } from '@playwright/test';
import { firstFreeBoardCell, getItem } from '../../src/model.ts';
import { createGame } from '../../src/engine.ts';
import type { GameState, Quest } from '../../src/model.ts';
import { checkpoint, data, deliverButton, deliverable, dialogDeliver, exportText, failWrites, finishScene, journal, KEY, onTicket, opened, openQuest, options, person, quest, ratio, readTo, replaceSave, restoreWrites, saved, serialize, start, startAgainAndImport, story, supplies, supply, tile, ticket, toast, validate } from './support.ts';

/** The first quest of each neighbour who lives in the village. */
const firstQuests=data.characters.filter(character=>!character.visitor&&data.quests.some(value=>value.character===character.id)).map(character=>data.quests.find(value=>value.character===character.id)!);
const itemName=(code: string)=>getItem(code,data)!.name;

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'])test(`Mara's parchment page shows her sketch and returns from item help at ${viewport.width}px in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);const value=quest('mara-welcome');await start(page,deliverable(value),theme);await openQuest(page,value);
  const modal=page.locator('#modal'),sketch=modal.locator('.quest-sketch');
  await expect(sketch).toBeVisible();expect(await sketch.evaluate(async node=>{await (node as HTMLImageElement).decode();return (node as HTMLImageElement).naturalWidth;})).toBe(768);
  expect(await modal.evaluate(node=>getComputedStyle(node).backgroundImage)).toContain('parchment-page-1254x1254.webp');
  expect(await modal.evaluate(node=>getComputedStyle(node).color)).toBe('rgb(59, 42, 30)');
  expect(await modal.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`mara-${theme}-${viewport.width}.png`)});
  await modal.locator('.quest-item').first().click();await expect(modal.locator('.quest-page-content')).toHaveCount(0);
  expect(await modal.evaluate(node=>getComputedStyle(node).backgroundImage)).toBe('none');
  await page.getByRole('button',{name:'Close dialog'}).click();await expect(sketch).toBeVisible();
  await page.keyboard.press('Escape');await expect(modal).toBeHidden();await expect(ticket(page,value).locator('.ticket-face')).toBeFocused();
});

test('Mara keeps her sketch through reply speaker changes and both journal replays',async({page})=>{
  const value=quest('mara-welcome');await start(page,deliverable(value),'dark');await deliverButton(page,value).click();
  await page.getByRole('button',{name:'Read Mara’s reply',exact:true}).click();
  const sketch=page.locator('#modal .quest-sketch');await expect(sketch).toBeVisible();
  for(let line=1;line<value.completion.length;line++){
    await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(sketch).toBeVisible();await expect(sketch).toHaveAttribute('src',/sketch-mara-/);
  }
  const back=page.getByRole('button',{name:'Back',exact:true});await expect(back).toBeEnabled();
  const backColors=await back.evaluate(node=>{const style=getComputedStyle(node);return {background:style.backgroundColor,ink:style.color};});
  expect(ratio(backColors.background,backColors.ink)).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('button',{name:'Back to the kitchen',exact:true}).click();await journal(page);
  await page.getByRole('button',{name:`Read quest: ${value.title}`,exact:true}).click();await expect(sketch).toBeVisible();
  await page.keyboard.press('Escape');await page.getByRole('button',{name:`Replay ${value.title}`,exact:true}).click();await expect(sketch).toBeVisible();
});

test('a failed Mara sketch leaves quest words and delivery usable',async({page})=>{
  await page.route('**/assets/variants/sketch-mara-*.webp',route=>route.abort());
  const value=quest('mara-welcome');await start(page,deliverable(value));await openQuest(page,value);
  await expect(page.locator('.quest-sketch')).toHaveCount(0);await expect(page.locator('.quest-lines')).toContainText(value.opening[0].text);
  await dialogDeliver(page,value).click();expect((await saved(page)).completedQuests).toContain(value.id);
});

test('Ilie keeps his own sketch when Mara speaks in his quest',async({page})=>{
  const value=quest('ilie-counter');expect(value.opening.some(line=>line.speaker==='mara')).toBe(true);
  await start(page,onTicket(value));await openQuest(page,value);
  await expect(page.locator('.quest-page-content')).toBeVisible();await expect(page.locator('.quest-sketch')).toHaveAttribute('src',/sketch-ilie-768x768\.webp$/);
  await expect(page.locator('.quest-lines')).toContainText(value.opening.find(line=>line.speaker==='mara')!.text);
});

const illustratedScenes=[
  ['adrian-first-pack','scene-cathedral-1'],['monica-first-pack','scene-cathedral-2'],['janos-first-pack','scene-cathedral-3'],
  ['adrian-second-pack','scene-cathedral-4'],['monica-second-pack','scene-cathedral-5'],['janos-second-pack','scene-cathedral-6'],
  ['adrian-third-pack','scene-cathedral-7'],['monica-third-pack','scene-cathedral-8'],['janos-third-pack','scene-cathedral-9'],
  ['ionatan-castle-dinner','scene-ionatan-dinner'],['mina-avram-search','scene-mina-avram-meal'],
] as const;

for(const [id,asset] of illustratedScenes)test(`${id} loads its accepted scene instead of a character drawing`,async({page})=>{
  const value=quest(id);await start(page,onTicket(value));await openQuest(page,value);
  const sketch=page.locator('#modal .quest-sketch');await expect(sketch).toHaveCount(1);
  await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
  expect(await sketch.evaluate(async node=>{const image=node as HTMLImageElement;await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([1024,683]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'])test(`quest scenes keep their proportions, speakers, and journal art at ${viewport.width}px in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
  const examples=[['adrian-first-pack','scene-cathedral-1'],['ionatan-castle-dinner','scene-ionatan-dinner'],['mina-avram-search','scene-mina-avram-meal']] as const;
  await start(page,deliverable(quest(examples[0][0])),theme);
  for(const [id,asset] of examples){
    const value=quest(id);await replaceSave(page,deliverable(value));await openQuest(page,value);
    const modal=page.locator('#modal'),sketch=modal.locator('.quest-sketch');
    await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
    const bounds=(await sketch.boundingBox())!;expect(bounds.width/bounds.height).toBeCloseTo(1024/683,2);
    expect(await sketch.evaluate(node=>getComputedStyle(node).float)).toBe('none');
    expect(await modal.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`${asset}-${theme}-${viewport.width}.png`)});
    await dialogDeliver(page,value).click();await story(page);await page.getByRole('button',{name:`Read now: ${value.title}`,exact:true}).click();
    for(let line=0;line<value.completion.length;line++){
      await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
      await expect(page.locator('#story-line h3')).toHaveText(person(value.completion[line].speaker).name);
      if(line<value.completion.length-1)await page.getByRole('button',{name:'Continue',exact:true}).click();
    }
    await page.getByRole('button',{name:'Back to the kitchen',exact:true}).click();await journal(page);
    if(person(value.character).singleVisit){
      for(const id of [value.character,...value.companions??[]])await expect(page.getByRole('button',{name:`Meet ${person(id).name}`,exact:true})).toHaveCount(0);
      await expect(page.getByRole('button',{name:`Read quest: ${value.title}`,exact:true})).toHaveCount(0);
      await expect(page.getByRole('button',{name:`Replay ${value.title}`,exact:true})).toHaveCount(0);
    }else{
      await page.getByRole('button',{name:`Read quest: ${value.title}`,exact:true}).click();
      await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
      await page.keyboard.press('Escape');await page.getByRole('button',{name:`Replay ${value.title}`,exact:true}).click();
      await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
      await page.keyboard.press('Escape');
    }
    await page.keyboard.press('Escape');
  }
});

test('a missing quest scene leaves its words and delivery usable',async({page})=>{
  await page.route('**/assets/variants/scene-cathedral-1-*.webp',route=>route.abort());
  const value=quest('adrian-first-pack');await start(page,deliverable(value));await openQuest(page,value);
  await expect(page.locator('.quest-sketch')).toHaveCount(0);await expect(page.locator('.quest-lines')).toContainText(value.opening[0].text);
  await dialogDeliver(page,value).click();expect((await saved(page)).completedQuests).toContain(value.id);
});

test('the road news uses its existing dialogue without an unapproved scene',async({page})=>{
  await start(page,checkpoint(24));await journal(page);await page.getByRole('button',{name:'Replay News from the road',exact:true}).click();
  await expect(page.locator('#story-line')).toContainText('Mina and Doctor Avram found Ionatan');
  await expect(page.locator('.quest-sketch')).toHaveCount(0);await expect(page.locator('.quest-page-content')).toHaveCount(0);
});

for(const visitor of data.characters.filter(person=>person.visitor))test(`${visitor.id}'s introduction shows the individual sketch outside quest scenes`,async({page})=>{
  const visit=data.quests.find(value=>value.character===visitor.id||value.companions?.includes(visitor.id))!;
  await start(page,visitor.singleVisit?onTicket(visit):checkpoint(24),'dark');await journal(page);
  await page.getByRole('button',{name:`Meet ${visitor.name}`,exact:true}).click();
  const sketch=page.locator('#modal .quest-sketch');await expect(sketch).toHaveAttribute('src',new RegExp(`sketch-${visitor.id}-768x768\\.webp$`));
  expect(await sketch.evaluate(async node=>{const image=node as HTMLImageElement;await image.decode();return [image.naturalWidth,image.naturalHeight];})).toEqual([768,768]);
  await expect(page.locator('.quest-page-content')).toBeVisible();await expect(sketch).not.toHaveClass(/quest-scene-sketch/);
  await expect(page.locator('#story-line')).toContainText(visitor.introduction);
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:`Meet ${visitor.name}`,exact:true})).toBeFocused();
});

for(const value of firstQuests)test(`${value.character} asks on a ticket, the quest dialog explains it, and Deliver pays once across reload`,async({page})=>{
  const initial=deliverable(value);await start(page,initial);const before=await saved(page),name=person(value.character).name;
  const card=ticket(page,value);await expect(card).toHaveAccessibleName(`${name}’s quest: ${value.title}`);await expect(card.locator('.ticket-name')).toHaveText(name);
  await expect(card.locator('.ticket-item.ready')).toHaveCount(value.requirements.length);await expect(deliverButton(page,value)).toBeEnabled();
  await journal(page);await page.getByRole('button',{name:`Meet ${name}`,exact:true}).click();
  await expect(page.locator('#modal .quest-sketch')).toHaveAttribute('src',new RegExp(`sketch-${value.character}-768x768\\.webp$`));
  await expect(page.locator('.quest-page-content')).toBeVisible();await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  await openQuest(page,value);const dialog=page.getByRole('dialog',{name:value.title,exact:true});
  await expect(dialog.locator('.quest-sketch')).toHaveAttribute('src',new RegExp(`sketch-${value.character}-768x768\\.webp$`));
  await expect(dialog.locator('.quest-person')).toHaveText(name);for(const line of value.opening)await expect(dialog.locator('.quest-view')).toContainText(line.text);
  for(const {item,quantity} of value.requirements)await expect(dialog.getByRole('button',{name:`${quantity} ${itemName(item)}: ${quantity} of ${quantity} on the board`,exact:true})).toBeVisible();
  await expect(dialog.locator('.quest-reward')).toHaveText(`Reward: ${value.reward} coins`);expect(await saved(page)).toEqual(before);
  await dialogDeliver(page,value).click();await expect(page.locator('#modal')).toBeHidden();
  await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  // Delivery pays at once. The completion scene waits until the player reads it, and reading changes nothing else.
  const after=await saved(page);expect(after.pendingScenes).toEqual([...before.pendingScenes,value.id]);
  expect(after.completedQuests).toEqual([...before.completedQuests,value.id]);expect(after.coins).toBe(before.coins+value.reward);
  expect(after.board.filter(Boolean).length).toBe(before.board.filter(Boolean).length-supplies(value).length);
  await expect(ticket(page,value)).toHaveCount(0);
  await story(page);await page.getByRole('button',{name:`Read now: ${value.title}`,exact:true}).click();
  await expect(page.locator('#story-line')).toContainText(value.completion[0].text);await readTo(page,'Back to the kitchen');
  await expect(page.locator('#modal')).toBeHidden();const read={...after,pendingScenes:before.pendingScenes};expect(await saved(page)).toEqual(read);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(read);await expect(ticket(page,value)).toHaveCount(0);
});

test('the delivery toast sits bottom-right on desktop, reports the reward without a dialog, and clears on its own',async({page})=>{
  const value=firstQuests[0];await page.emulateMedia({reducedMotion:'reduce'});
  await start(page,deliverable(value));await deliverButton(page,value).click();
  const note=toast(page);await expect(note).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  await expect(page.locator('#modal')).toBeHidden();await expect(page.getByRole('dialog')).toHaveCount(0);
  // The toast sits away from the board, so the board stays usable while it shows.
  await tile(page,0).click();await expect(tile(page,0)).toBeFocused();
  const box=(await note.boundingBox())!,viewport=page.viewportSize()!;
  expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
  expect(box.x).toBeGreaterThan(viewport.width*.5);expect(box.y).toBeGreaterThan(viewport.height*.5);
  // A notice that offers a reply stays for 8 seconds.
  await expect(note).toHaveCount(0,{timeout:10000});
});

test('a desktop ticket shows who asks and the quest title, and its portrait opens the quest with a name at each change of speaker',async({page})=>{
  const value=quest('mina-avram-search');await start(page,onTicket(value));const card=ticket(page,value);
  await expect(card.locator('.ticket-name')).toHaveText('Mina');await expect(card.locator('.ticket-title')).toHaveText(value.title);await expect(card.locator('.ticket-title')).toBeVisible();
  await card.locator('.portrait').click();const dialog=page.getByRole('dialog',{name:value.title,exact:true});await expect(dialog).toBeVisible();
  const turns=value.opening.filter((line,at)=>line.speaker!==value.opening[at-1]?.speaker).map(line=>`${person(line.speaker).name}:`);
  await expect(dialog.locator('.quest-speaker')).toHaveText(turns);await expect(dialog.locator('.quest-line')).toHaveCount(value.opening.length);
});

for(const width of [390,320])test(`a ready ticket with four dishes shows the whole Deliver word at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});const value=quest('mina-avram-search');await start(page,deliverable(value));
  const deliver=deliverButton(page,value);await expect(deliver).toBeEnabled();
  const button=(await deliver.boundingBox())!,word=(await deliver.locator('.deliver-word').boundingBox())!;
  expect(word.x).toBeGreaterThanOrEqual(button.x);expect(word.x+word.width).toBeLessThanOrEqual(button.x+button.width);
  for(const control of await ticket(page,value).getByRole('button').all()){const size=(await control.boundingBox())!;expect(size.width).toBeGreaterThanOrEqual(44);expect(size.height).toBeGreaterThanOrEqual(44);}
});

test('the delivery notice offers the reply by name, and the phone Story button and Story name the reply until it is read',async({page})=>{
  const value=quest('eszter-bowls'),storyButton=page.locator('#story-button');await page.setViewportSize({width:390,height:844});
  await start(page,deliverable(value));await expect(storyButton).toHaveAccessibleName('Story');
  await deliverButton(page,value).click();
  const reply=page.getByRole('button',{name:'Read Eszter’s reply',exact:true});await expect(reply).toBeVisible();
  await expect(storyButton).toHaveAttribute('data-ready','');await expect(storyButton).toHaveAccessibleName('Story, a scene is waiting');
  await reply.click();await expect(page.getByRole('dialog',{name:value.title,exact:true})).toBeVisible();await expect(page.locator('.toast')).toHaveCount(0);
  await expect(page.locator('#story-line')).toContainText(value.completion[0].text);await expect(page.locator('.completion-message')).toHaveCount(0);
  // Close leaves the reply waiting, and Story names it.
  await page.keyboard.press('Escape');await story(page);await expect(page.locator('#modal .story-waiting')).toContainText(`Eszter replied to “${value.title}”.`);
  await page.getByRole('button',{name:`Read now: ${value.title}`,exact:true}).click();await readTo(page,'Back to the kitchen');
  await expect(storyButton).not.toHaveAttribute('data-ready');await expect(storyButton).toHaveAccessibleName('Story');
});

test('the delivery toast sits top-center on a phone',async({page})=>{
  const value=firstQuests[0];await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  await start(page,deliverable(value));await deliverButton(page,value).click();
  const box=(await toast(page).boundingBox())!;
  expect(box.x+box.width/2).toBeGreaterThan(390*.3);expect(box.x+box.width/2).toBeLessThan(390*.7);expect(box.y).toBeLessThan(844*.3);
});

test('after delivering, the completion scene waits in Story and the journal across a reload, and Read now finishes it once',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);await deliverButton(page,value).click();
  await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  const delivered=await saved(page);expect(delivered.pendingScenes).toEqual([...before.pendingScenes,value.id]);
  await page.reload();await opened(page);await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  expect(await saved(page)).toEqual(delivered);
  await journal(page);await expect(page.getByRole('button',{name:`Read ${value.title}`,exact:true})).toContainText('New scene');await page.keyboard.press('Escape');
  await story(page);
  await page.getByRole('button',{name:`Read now: ${value.title}`,exact:true}).click();await expect(page.locator('#story-line')).toContainText(value.completion[0].text);
  await readTo(page,'Back to the kitchen');await expect(page.locator('#modal')).toBeHidden();
  const read=await saved(page);expect(read).toEqual({...delivered,pendingScenes:before.pendingScenes});expect(read.coins).toBe(before.coins+value.reward);
  await journal(page);await expect(page.getByRole('button',{name:`Replay ${value.title}`,exact:true})).toBeVisible();
});

test('quest rewards survive export and import, while introductions and journal replay give no reward',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));await journal(page);const initial=await saved(page);
  // Only the neighbours present in a new game have entries; later regulars are "Not yet" outlines.
  for(const character of data.characters.filter(character=>!character.singleVisit&&!character.arrivesAfter)){
    await page.getByRole('button',{name:`Meet ${character.name}`,exact:true}).click();await expect(page.locator('#story-line')).toContainText(character.introduction);
    await finishScene(page);expect(await saved(page)).toEqual(initial);
  }
  await page.keyboard.press('Escape');await deliverButton(page,value).click();
  await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  await story(page);await page.getByRole('button',{name:`Read now: ${value.title}`,exact:true}).click();await readTo(page,'Back to the kitchen');
  const committed=await saved(page);await journal(page);
  for(const name of [`Read quest: ${value.title}`,`Replay ${value.title}`]){
    await page.getByRole('button',{name,exact:true}).click();await finishScene(page);await expect(page.getByRole('button',{name:`Replay ${value.title}`,exact:true})).toBeFocused();expect(await saved(page)).toEqual(committed);
  }
  await page.keyboard.press('Escape');await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(committed);
  await startAgainAndImport(page,text);expect(await saved(page)).toEqual(committed);
  await page.reload();await opened(page);await expect(ticket(page,value)).toHaveCount(0);expect(await saved(page)).toEqual(committed);
});

test('a surplus on the board reads as the required count on the ticket and in the quest rows',async({page})=>{
  const value=quest('sorin-first-ride'),requirement=value.requirements[0],name=itemName(requirement.item);
  await start(page,supply(deliverable(value),supplies(value)));
  await expect(ticket(page,value).locator('.ticket-face')).toHaveAccessibleName(new RegExp(`^${value.title}: ${requirement.quantity} ${name}, ${requirement.quantity} on the board;`));
  await expect(ticket(page,value).locator('.ticket-count').first()).toHaveText(`${requirement.quantity}/${requirement.quantity}`);
  await openQuest(page,value);
  const row=page.getByRole('button',{name:`${requirement.quantity} ${name}: ${requirement.quantity} of ${requirement.quantity} on the board`,exact:true});
  await expect(row).toBeVisible();await expect(row.locator('.quest-count')).toHaveText(`${requirement.quantity} / ${requirement.quantity} on board`);
});

test('quest dish help keeps focus on the next blocked merge on desktop and phone',async({page})=>{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);await start(page,createGame(data));
    const value=firstQuests[0],code=value.requirements[0].item;
    await openQuest(page,value);await page.getByRole('button',{name:new RegExp(`^1 ${itemName(code)}:`)}).click();
    await page.getByRole('button',{name:'Show me on the board',exact:true}).click();
    await expect(page.locator('#modal')).toBeHidden();
    const movable=page.locator('#board .selected');await expect(movable).toHaveAttribute('aria-label',/Elderflowers/);
    await expect(movable).toBeFocused();
    await expect(tile(page,37)).toHaveClass(/hint/);
    // An unrelated render must not mask a focus return queued by the dialog close event.
    await page.keyboard.press('ArrowRight');await expect(page.locator('#board :focus')).toHaveCount(1);
  }
});

test('a failed delivery write says so, and a reload restores only durable progress',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);
  const notices=page.getByRole('status').filter({has:page.locator('.toast')});
  await expect(page.locator('#toast-stack')).toHaveAttribute('role','status');
  await expect(page.locator('#toast-stack')).toHaveAttribute('aria-live','polite');
  await failWrites(page);await deliverButton(page,value).click();
  await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins. This session is not saved. Use Retry save in Options, or export before leaving.`);
  await expect(notices).toContainText('This session is not saved.');
  await expect(page.locator('#coins')).toHaveText(String(before.coins+value.reward));await expect(ticket(page,value)).toHaveCount(0);expect(await saved(page)).toEqual(before);
  await page.reload();await opened(page);await expect(deliverButton(page,value)).toBeEnabled();expect(await saved(page)).toEqual(before);
});

test('after a failed delivery write, Retry save in Options saves the delivery once',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);
  await failWrites(page);await deliverButton(page,value).click();await expect(toast(page)).toContainText('This session is not saved.');
  await options(page);await expect(page.locator('#modal .save-status').first()).toContainText('Not saved:');
  await restoreWrites(page);await page.getByRole('button',{name:'Retry save',exact:true}).click();
  await expect(page.locator('#status')).toHaveText('Your progress is saved in this browser.');await expect(page.getByRole('button',{name:'Retry save',exact:true})).toHaveCount(0);
  const after=await saved(page);expect(after.completedQuests).toEqual([...before.completedQuests,value.id]);expect(after.coins).toBe(before.coins+value.reward);expect(after.pendingScenes).toEqual([value.id]);
  await page.reload();await opened(page);await expect(ticket(page,value)).toHaveCount(0);expect(await saved(page)).toEqual(after);
});

test('a storage read that fails during a delivery does not make the tab take its own save for another tab’s',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);
  await page.evaluate(key=>{const original=Storage.prototype.getItem;Storage.prototype.getItem=function(name){if(name===key)throw new DOMException('Access denied.','SecurityError');return original.call(this,name);};},KEY);
  await deliverButton(page,value).click();await expect(toast(page)).toContainText('This session is not saved.');
  await page.evaluate(()=>{const frame=document.createElement('iframe');document.body.append(frame);Storage.prototype.getItem=frame.contentWindow!.localStorage.getItem;frame.remove();});
  await options(page);await page.getByRole('button',{name:'Retry save',exact:true}).click();
  await expect(page.locator('#status')).toHaveText('Your progress is saved in this browser.');
  const after=await saved(page);expect(after.completedQuests).toEqual([...before.completedQuests,value.id]);expect(after.coins).toBe(before.coins+value.reward);
});

test('keyboard and emulated touch can open a quest and deliver it with focus returned',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage(),value=firstQuests[0];await start(page,deliverable(value));
    await ticket(page,value).locator('.ticket-face').tap();await expect(page.getByRole('dialog',{name:value.title,exact:true})).toBeVisible();
    await dialogDeliver(page,value).focus();await page.keyboard.press('Space');
    await expect(page.locator('#modal')).toBeHidden();await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
    expect((await saved(page)).completedQuests).toContain(value.id);
    await expect(page.locator('#tickets .ticket').first().locator('.ticket-face')).toBeFocused();
    expect(await page.locator('#board').evaluate(board=>board.getAnimations({subtree:true}).length)).toBe(0);
  }finally{await context.close();}
});

/** The first dish waits as two lower items, so one merge makes the quest deliverable. */
function almost(state: GameState,value: Quest){
  const next=structuredClone(state),item=value.requirements[0].item,lower=Object.values(data.items).find(candidate=>candidate.next===item)!.id;
  const first=next.board.findIndex(cell=>cell?.code===item);next.board[first]={code:lower};
  const second=firstFreeBoardCell(next,data);next.board[second]={code:lower};
  expect(validate(next)).toBe(true);return {state:next,first,second};
}

test('a merge that completes a quest marks its dishes ready and enables Deliver without opening a dialog',async({page})=>{
  const value=firstQuests[0],fixture=almost(deliverable(value),value);await start(page,fixture.state);
  await expect(deliverButton(page,value)).toBeDisabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(0);
  await tile(page,fixture.first).click();await tile(page,fixture.second).click();
  await expect(deliverButton(page,value)).toBeEnabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(1);
  await expect(page.locator('#modal')).toBeHidden();await expect(tile(page,fixture.second)).toBeFocused();
  const merged=await saved(page);expect(merged.completedQuests).toEqual(fixture.state.completedQuests);
  await expect(ticket(page,value).locator('.ticket-face')).toHaveAccessibleName(`${value.title}: 1 ${itemName(value.requirements[0].item)}, 1 on the board`);
});

test('another tab that delivers a quest takes it off this tab’s ticket, and the reward is paid once',async({page,context})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);
  const other=await context.newPage();await other.goto('./');await opened(other);
  await deliverButton(other,value).click();await expect(toast(other)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  await expect(page.locator('#status')).toHaveText('This game moved on in another tab. The board now shows that progress.');
  await expect(ticket(page,value)).toHaveCount(0);await expect(page.locator('#coins')).toHaveText(String(before.coins+value.reward));
  expect((await saved(page)).completedQuests).toEqual([value.id]);await other.close();
});

test('a delivery flight cannot show its old toast after another tab replaces the game',async({page,context})=>{
  const value=firstQuests[0];await start(page,deliverable(value));
  const other=await context.newPage();await other.goto('./');await opened(other);
  await deliverButton(page,value).click();await expect(page.locator('.deliver-flight').first()).toBeAttached();
  await page.evaluate(()=>{
    const animations=[...document.querySelectorAll('.deliver-flight')].flatMap(element=>element.getAnimations());
    for(const animation of animations)animation.pause();
    document.addEventListener('finish-test-delivery',()=>animations.forEach(animation=>animation.finish()),{once:true});
  });
  await other.evaluate(({key,text})=>localStorage.setItem(key,text),{key:KEY,text:serialize(createGame(data))});
  await expect(page.locator('#status')).toContainText('another tab');
  await page.evaluate(async()=>{
    document.dispatchEvent(new Event('finish-test-delivery'));
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
  });
  await expect(page.locator('.toast')).toHaveCount(0);expect((await saved(page)).completedQuests).toEqual([]);await other.close();
});

for(const replacement of ['import','reset','another tab'] as const)test(`a visible delivery notice clears when ${replacement} replaces the game`,async({page,context})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const value=firstQuests[0];await start(page,deliverable(value));
  // Keep the notice alive so its expiry cannot hide a failed replacement cleanup.
  const now=Date.now();await page.clock.install({time:now});await page.clock.pauseAt(now+1000);
  await deliverButton(page,value).click();await expect(toast(page)).toContainText('Earned');
  if(replacement==='another tab'){
    const other=await context.newPage();await other.goto('./');await opened(other);
    await other.evaluate(({key,text})=>localStorage.setItem(key,text),{key:KEY,text:serialize(createGame(data))});
    await expect(page.locator('#status')).toContainText('another tab');await other.close();
  }else{
    await options(page);
    if(replacement==='import'){
      await page.locator('input[type="file"]').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(serialize(createGame(data)))});
      await page.getByRole('button',{name:'Import this saved game',exact:true}).click();
    }else{
      await page.getByRole('button',{name:'Start a new game',exact:true}).click();
      await page.getByRole('button',{name:'Erase and start again',exact:true}).click();
    }
    await expect(page.locator('#modal')).toBeHidden();
  }
  expect((await saved(page)).completedQuests).toEqual([]);await expect(toast(page)).toHaveCount(0);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`the quest dialog fits ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const value=quest('dochia-sheepskin');await start(page,deliverable(value));await openQuest(page,value);
  const view=page.locator('.quest-view');await expect(view.locator('.quest-item')).toHaveCount(value.requirements.length);
  for(const control of await page.locator('#modal button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  const colors=await view.evaluate(element=>{
    const background=getComputedStyle(element.closest('dialog')!).backgroundColor;
    return {background,inks:[...element.querySelectorAll('p,li,.quest-count')].map(node=>getComputedStyle(node).color)};
  });for(const ink of colors.inks)expect(ratio(colors.background,ink)).toBeGreaterThanOrEqual(4.5);
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await dialogDeliver(page,value).scrollIntoViewIfNeeded();await expect(dialogDeliver(page,value)).toBeInViewport();await expect(dialogDeliver(page,value)).toBeEnabled();
  await page.screenshot({path:testInfo.outputPath('quest.png')});
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:390,height:800}])for(const theme of ['light','dark'] as const)test(`a ticket with four dishes fits ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const value=quest('mina-avram-search');expect(value.requirements).toHaveLength(4);await start(page,onTicket(value));
  await expect(ticket(page,value).locator('.ticket-items')).toHaveClass(/many/);await page.screenshot({path:testInfo.outputPath('tickets.png')});
  for(const card of await page.locator('#tickets .ticket').all()){
    expect(await card.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
    const box=(await card.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
    for(const control of await card.getByRole('button').all()){const size=(await control.boundingBox())!;expect(size.width).toBeGreaterThanOrEqual(44);expect(size.height).toBeGreaterThanOrEqual(44);}
  }
  for(const food of await ticket(page,value).locator('.ticket-item .food').all()){const box=(await food.boundingBox())!;expect(box.width).toBeGreaterThan(0);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});
