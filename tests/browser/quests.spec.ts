import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { firstFreeBoardCell, getItem } from '../../src/model.ts';
import { createGame } from '../../src/engine.ts';
import type { GameState, Quest } from '../../src/model.ts';
import { act, checkpoint, naturalSize, data, deliverButton, deliverable, dialogDeliver, exportText, failWrites, finishScene, forward, importSaveFile, journal, KEY, onTicket, opened, openQuest, options, person, quest, ratio, readNow, readTo, replaceSave, restoreWrites, saved, serialize, start, startAgain, startAgainAndImport, story, supplies, supply, tile, ticket, toast, validate, know } from './support.ts';

/** The first campaign quest of each neighbour who lives in the village. The recovery quest stands outside the order of quests. */
const campaign=data.quests.filter(value=>!value.recovery);
const firstQuests=data.characters.filter(character=>!character.visitor&&campaign.some(value=>value.character===character.id)).map(character=>campaign.find(value=>value.character===character.id)!);
const itemName=(code: string)=>getItem(code,data)!.name;

async function combinedConversation(page: Page,value: Quest){
  await expect(page.getByRole('heading',{name:'Quest',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Reply',exact:true})).toBeVisible();
  const lines=[...value.opening,...value.completion];
  await expect(page.locator('#story-line .story-turn h4')).toHaveText(lines.map(line=>person(line.speaker).name));
  await expect(page.locator('#story-line .story-turn p')).toHaveText(lines.map(line=>line.text));
  await expect(page.locator('.story-controls button')).toHaveCount(1);
  await expect(page.locator('.story-controls')).toHaveText('Return');
  await expect(page.getByRole('button',{name:'Return',exact:true})).toBeVisible();
}

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'])test(`Mara's parchment page shows her sketch and returns from item help at ${viewport.width}px in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);const value=quest('mara-welcome');await start(page,deliverable(value),theme);await openQuest(page,value);
  const modal=page.locator('#modal'),sketch=modal.locator('.quest-sketch');
  await expect(sketch).toBeVisible();expect((await naturalSize(sketch))[0]).toBe(672);
  expect(await modal.evaluate(node=>getComputedStyle(node).backgroundImage)).toContain('parchment-page-1254x1254.webp');
  expect(await modal.evaluate(node=>getComputedStyle(node).color)).toBe('rgb(59, 42, 30)');
  expect(await modal.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`mara-${theme}-${viewport.width}.png`)});
  await modal.locator('.quest-item').first().click();await expect(modal.locator('.quest-page-content')).toHaveCount(0);
  expect(await modal.evaluate(node=>getComputedStyle(node).backgroundImage)).toBe('none');
  await page.getByRole('button',{name:'Close dialog'}).click();await expect(sketch).toBeVisible();
  await page.keyboard.press('Escape');await expect(modal).toBeHidden();await expect(ticket(page,value).locator('.ticket-face')).toBeFocused();
});

test('Mara keeps her sketch with the complete reply and the combined journal replay',async({page})=>{
  const value=quest('mara-welcome');await start(page,deliverable(value),'dark');await deliverButton(page,value).click();
  await page.getByRole('button',{name:'Read Mara’s reply',exact:true}).click();
  const sketch=page.locator('#modal .quest-sketch');await expect(sketch).toBeVisible();
  await expect(page.locator('#story-line h3')).toHaveText(value.completion.map(line=>person(line.speaker).name));
  await expect(page.locator('#story-line p')).toHaveText(value.completion.map(line=>line.text));
  await expect(sketch).toHaveAttribute('src',/sketch-mara-/);
  const colors=await forward(page).evaluate(node=>{const style=getComputedStyle(node);return {background:style.backgroundColor,ink:style.color};});
  expect(ratio(colors.background,colors.ink)).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('button',{name:'Back to the kitchen',exact:true}).click();await journal(page,['chapters','conversations','neighbours']);
  await expect(page.getByRole('button',{name:`Read quest: ${value.title}`,exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:`Replay ${value.title}`,exact:true}).click();await expect(sketch).toBeVisible();
  await combinedConversation(page,value);
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
  await expect(page.locator('.quest-page-content')).toBeVisible();await expect(page.locator('.quest-sketch')).toHaveAttribute('src',/sketch-ilie-672x672\.webp$/);
  await expect(page.locator('.quest-lines')).toContainText(value.opening.find(line=>line.speaker==='mara')!.text);
});

test('Mara shows her stove sketch in the cellar quest',async({page})=>{
  const value=quest('mara-cellar');await start(page,onTicket(value));await openQuest(page,value);
  const sketch=page.locator('#modal .quest-sketch');await expect(sketch).toHaveAttribute('src',/sketch-mara-stove-672x672\.webp$/);
  await expect(sketch).toHaveAttribute('alt',/at the stove/);expect(await naturalSize(sketch)).toEqual([672,672]);
});

const illustratedScenes=[
  ['adrian-first-pack','scene-cathedral-1'],['monica-first-pack','scene-cathedral-2'],['janos-first-pack','scene-cathedral-3'],
  ['adrian-second-pack','scene-cathedral-4'],['monica-second-pack','scene-cathedral-5'],['janos-second-pack','scene-cathedral-6'],
  ['adrian-third-pack','scene-cathedral-7'],['monica-third-pack','scene-cathedral-8'],['janos-third-pack','scene-cathedral-9'],
  ['mara-easter-baskets','scene-easter-baskets'],['bela-snowman','scene-bela-snowman'],['costel-icicle-clock','scene-icicle-clock'],
  ['mara-chimney-sweep','scene-chimney-sweep'],['mara-blajini','scene-blajini'],
] as const;

for(const [id,asset] of illustratedScenes)test(`${id} shows its quest scene instead of a character sketch`,async({page})=>{
  const value=quest(id);await start(page,onTicket(value));await openQuest(page,value);
  const sketch=page.locator('#modal .quest-sketch');await expect(sketch).toHaveCount(1);
  await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
  expect(await naturalSize(sketch)).toEqual([1024,683]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'])test(`quest scenes keep their proportions, speakers, and journal art at ${viewport.width}px in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
  const examples=[['adrian-first-pack','scene-cathedral-1'],['janos-third-pack','scene-cathedral-9']] as const;
  await start(page,deliverable(quest(examples[0][0])),theme);
  for(const [id,asset] of examples){
    const value=quest(id);await replaceSave(page,deliverable(value));await openQuest(page,value);
    const modal=page.locator('#modal'),sketch=modal.locator('.quest-sketch');
    await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
    const bounds=(await sketch.boundingBox())!;expect(bounds.width/bounds.height).toBeCloseTo(1024/683,2);
    expect(await sketch.evaluate(node=>getComputedStyle(node).float)).toBe('none');
    expect(await modal.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`${asset}-${theme}-${viewport.width}.png`)});
    await dialogDeliver(page,value).click();await readNow(page,value.title);
    await expect(page.locator('#story-line h3')).toHaveText(value.completion.map(line=>person(line.speaker).name));
    await expect(page.locator('#story-line p')).toHaveText(value.completion.map(line=>line.text));
    await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
    await page.getByRole('button',{name:'Back to the kitchen',exact:true}).click();await journal(page,['chapters','conversations','neighbours']);
    if(person(value.character).singleVisit){
      for(const id of [value.character,...value.companions??[]])await expect(page.getByRole('button',{name:`Meet ${person(id).name}`,exact:true})).toHaveCount(0);
      await expect(page.getByRole('button',{name:`Read quest: ${value.title}`,exact:true})).toHaveCount(0);
      await expect(page.getByRole('button',{name:`Replay ${value.title}`,exact:true})).toHaveCount(0);
    }else{
      await expect(page.getByRole('button',{name:`Read quest: ${value.title}`,exact:true})).toHaveCount(0);
      await page.getByRole('button',{name:`Replay ${value.title}`,exact:true}).click();
      await expect(sketch).toHaveAttribute('src',new RegExp(`${asset}-1024x683\\.webp$`));
      await combinedConversation(page,value);
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

// Ionatan, Mina, and Avram visit in act 2, so only the travellers have introductions in act 1.
for(const visitor of data.characters.filter(person=>person.visitor&&!person.singleVisit))test(`${visitor.id}'s introduction shows the individual sketch outside quest scenes`,async({page})=>{
  await start(page,checkpoint(24),'dark');await journal(page,['chapters','conversations','neighbours']);
  await page.getByRole('button',{name:`Meet ${visitor.name}`,exact:true}).click();
  const sketch=page.locator('#modal .quest-sketch');await expect(sketch).toHaveAttribute('src',new RegExp(`sketch-${visitor.id}-672x672\\.webp$`));
  expect(await naturalSize(sketch)).toEqual([672,672]);
  await expect(page.locator('.quest-page-content')).toBeVisible();await expect(sketch).not.toHaveClass(/quest-scene-sketch/);
  await expect(page.locator('#story-line')).toContainText(visitor.introduction);
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:`Meet ${visitor.name}`,exact:true})).toBeFocused();
});

for(const value of firstQuests)test(`${value.character} asks on a ticket, the quest dialog explains it, and Deliver pays once across reload`,async({page})=>{
  const initial=deliverable(value);await start(page,initial);const before=await saved(page),name=person(value.character).name;
  const card=ticket(page,value);await expect(card).toHaveAccessibleName(`${name}’s quest: ${value.title}`);await expect(card.locator('.ticket-name')).toHaveText(name);
  await expect(card.locator('.ticket-item.ready')).toHaveCount(value.requirements.length);await expect(deliverButton(page,value)).toBeEnabled();
  await journal(page,['chapters','conversations','neighbours']);await page.getByRole('button',{name:`Meet ${name}`,exact:true}).click();
  await expect(page.locator('#modal .quest-sketch')).toHaveAttribute('src',new RegExp(`sketch-${value.character}-672x672\\.webp$`));
  await expect(page.locator('.quest-page-content')).toBeVisible();await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  await openQuest(page,value);const dialog=page.getByRole('dialog',{name:value.title,exact:true});
  await expect(dialog.locator('.quest-sketch')).toHaveAttribute('src',new RegExp(`sketch-${value.character}-672x672\\.webp$`));
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
  await readNow(page,value.title);
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
  const value=quest('monica-third-pack');await start(page,onTicket(value));const card=ticket(page,value);
  await expect(card.locator('.ticket-name')).toHaveText(person(value.character).name);await expect(card.locator('.ticket-title')).toHaveText(value.title);await expect(card.locator('.ticket-title')).toBeVisible();
  await card.locator('.portrait').click();const dialog=page.getByRole('dialog',{name:value.title,exact:true});await expect(dialog).toBeVisible();
  const turns=value.opening.filter((line,at)=>line.speaker!==value.opening[at-1]?.speaker).map(line=>`${person(line.speaker).name}:`);
  await expect(dialog.locator('.quest-speaker')).toHaveText(turns);await expect(dialog.locator('.quest-line')).toHaveCount(value.opening.length);
});

for(const width of [390,320])test(`a ready phone ticket with four dishes opens a whole Deliver label in its dialog at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});const value=quest('monica-third-pack');await start(page,deliverable(value));
  const card=ticket(page,value),face=card.locator('.ticket-face');
  await expect(deliverButton(page,value)).toBeHidden();await expect(card.getByRole('button')).toHaveCount(1);
  await expect(card.locator('.ticket-name')).toBeVisible();await expect(card.locator('.ticket-name')).toHaveText(person(value.character).name);
  await expect(card.locator('.ticket-item')).toHaveCount(4);
  for(const [index,{quantity}] of value.requirements.entries()){
    const count=card.locator('.ticket-count').nth(index);await expect(count).toBeVisible();await expect(count).toHaveText(`${quantity}/${quantity}`);
  }
  const target=(await face.boundingBox())!;expect(target.width).toBeGreaterThanOrEqual(44);expect(target.height).toBeGreaterThanOrEqual(44);
  await face.click();const deliver=dialogDeliver(page,value);await expect(deliver).toBeVisible();await expect(deliver).toBeEnabled();
  await expect(deliver).toHaveText(`Deliver · ${value.reward}`);
  const button=(await deliver.boundingBox())!;
  const word=await deliver.evaluate(node=>{const range=document.createRange();range.selectNodeContents(node.firstChild!);const box=range.getBoundingClientRect();return {x:box.x,y:box.y,width:box.width,height:box.height};});
  expect(word.width).toBeGreaterThan(0);expect(word.x).toBeGreaterThanOrEqual(button.x);expect(word.x+word.width).toBeLessThanOrEqual(button.x+button.width);
  expect(word.y).toBeGreaterThanOrEqual(button.y);expect(word.y+word.height).toBeLessThanOrEqual(button.y+button.height);
  expect(button.width).toBeGreaterThanOrEqual(44);expect(button.height).toBeGreaterThanOrEqual(44);
});

test('the delivery notice offers the reply by name, and the phone Story button and Story name the reply until it is read',async({page})=>{
  const value=quest('eszter-bowls'),storyButton=page.locator('#story-button');await page.setViewportSize({width:390,height:844});
  await start(page,deliverable(value));await expect(storyButton).toHaveAccessibleName('Story');
  await openQuest(page,value);await dialogDeliver(page,value).click();
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
  await start(page,deliverable(value));await openQuest(page,value);await dialogDeliver(page,value).click();
  await expect(toast(page)).toBeVisible();
  const box=(await toast(page).boundingBox())!;
  expect(box.x+box.width/2).toBeGreaterThan(390*.3);expect(box.x+box.width/2).toBeLessThan(390*.7);expect(box.y).toBeLessThan(844*.3);
});

test('after delivering, the completion scene waits in Story and the journal across a reload, and Read now finishes it once',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);await deliverButton(page,value).click();
  await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  const delivered=await saved(page);expect(delivered.pendingScenes).toEqual([...before.pendingScenes,value.id]);
  await page.reload();await opened(page);await expect(page.locator('#status')).toContainText('A story scene is waiting in Story.');
  expect(await saved(page)).toEqual(delivered);
  await journal(page,['chapters','conversations','neighbours']);await expect(page.getByRole('button',{name:`Read ${value.title}`,exact:true})).toContainText('New scene');await page.keyboard.press('Escape');
  await readNow(page,value.title);await expect(page.locator('#story-line')).toContainText(value.completion[0].text);
  await readTo(page,'Back to the kitchen');await expect(page.locator('#modal')).toBeHidden();
  const read=await saved(page);expect(read).toEqual({...delivered,pendingScenes:before.pendingScenes});expect(read.coins).toBe(before.coins+value.reward);
  await journal(page,['chapters','conversations','neighbours']);await expect(page.getByRole('button',{name:`Replay ${value.title}`,exact:true})).toBeVisible();
});

for(const width of [1440,390])test(`a waiting quest has one complete journal conversation with safe return at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});const value=quest('eszter-table');
  expect(value.opening.length+value.completion.length).toBeGreaterThan(4);
  await start(page,deliverable(value));
  if(width<1024){await openQuest(page,value);await dialogDeliver(page,value).click();}else await deliverButton(page,value).click();
  const delivered=await saved(page);
  await journal(page,['chapters','conversations','neighbours']);
  const unread=page.getByRole('button',{name:`Read ${value.title}`,exact:true}),replay=page.getByRole('button',{name:`Replay ${value.title}`,exact:true});
  await expect(unread).toHaveCount(1);await expect(replay).toHaveCount(0);
  await expect(page.getByRole('button',{name:`Read quest: ${value.title}`,exact:true})).toHaveCount(0);
  for(const close of ['Escape','Close dialog']){
    await unread.click();await combinedConversation(page,value);
    if(close==='Escape')await page.keyboard.press('Escape');else await page.getByRole('button',{name:close,exact:true}).click();
    await expect(unread).toBeFocused();expect(await saved(page)).toEqual(delivered);
  }
  await unread.click();await combinedConversation(page,value);await finishScene(page);
  const read={...delivered,pendingScenes:delivered.pendingScenes.filter(id=>id!==value.id)};
  expect(await saved(page)).toEqual(read);await expect(unread).toHaveCount(0);await expect(replay).toHaveCount(1);await expect(replay).toBeFocused();
  await replay.click();await combinedConversation(page,value);await finishScene(page);await expect(replay).toBeFocused();expect(await saved(page)).toEqual(read);
});

test('quest rewards survive export and import, while introductions and journal replay give no reward',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));await journal(page,['chapters','conversations','neighbours']);const initial=await saved(page);
  // Each introduction in a new game's journal, the visitors' too, gives no reward.
  for(const character of data.characters.filter(character=>!character.singleVisit&&!character.arrivesAfter)){
    await page.getByRole('button',{name:`Meet ${character.name}`,exact:true}).click();await expect(page.locator('#story-line')).toContainText(character.introduction);
    await finishScene(page);expect(await saved(page)).toEqual(initial);
  }
  await page.keyboard.press('Escape');await deliverButton(page,value).click();
  await expect(toast(page)).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  await readNow(page,value.title);await readTo(page,'Back to the kitchen');
  const committed=await saved(page);await journal(page,['chapters','conversations','neighbours']);
  const replay=page.getByRole('button',{name:`Replay ${value.title}`,exact:true});
  await expect(replay).toHaveCount(1);await replay.click();await combinedConversation(page,value);await finishScene(page);
  await expect(replay).toBeFocused();expect(await saved(page)).toEqual(committed);
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
    const value=firstQuests[0],{item:code,quantity}=value.requirements[0];
    await openQuest(page,value);await page.getByRole('button',{name:new RegExp(`^${quantity} ${itemName(code)}:`)}).click();
    await page.getByRole('button',{name:'Show me on the board',exact:true}).click();
    await expect(page.locator('#modal')).toBeHidden();
    const movable=page.locator('#board .selected');await expect(movable).toHaveAttribute('aria-label',/Elderflowers/);
    await expect(movable).toBeFocused();
    await expect(tile(page,37)).toHaveClass(/hint/);
    // An unrelated render must not mask a focus return queued by the dialog close event.
    await page.keyboard.press('ArrowRight');await expect(page.locator('#board :focus')).toHaveCount(1);
  }
});

test('Find on a missing quest dish goes straight to the next board step',async({page})=>{
  const initial=createGame(data),value=quest('mara-welcome');
  await page.setViewportSize({width:390,height:844});await start(page,initial);await openQuest(page,value);
  await page.getByRole('button',{name:'Find the next step for Herb bunch on the board'}).click();
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#board .selected')).toHaveAttribute('aria-label',/Elderflowers/);
  await expect(page.locator('#board .selected')).toBeFocused();
  await expect(tile(page,37)).toHaveClass(/hint/);
  expect(await saved(page)).toEqual(initial);
});

test('Find seeks another portion when one required dish is already on the board',async({page})=>{
  const initial=createGame(data),value=quest('sorin-first-ride');
  initial.board[18]={code:'grain_2'};know(initial,'grain_2');
  await start(page,initial);await openQuest(page,value);
  const find=page.getByRole('button',{name:'Find the next step for Dough on the board'});
  await expect(find).toBeVisible();await find.click();
  await expect(page.locator('#modal')).toBeHidden();
  await expect(tile(page,13)).toHaveClass(/selected/);
  await expect(tile(page,14)).toHaveClass(/hint/);
  await expect(tile(page,18)).not.toHaveClass(/selected/);
  expect(await saved(page)).toEqual(initial);
  await tile(page,14).click();
  await expect(page.getByRole('button',{name:'Stop guide for Dough'})).toHaveCount(0);
  expect((await saved(page)).board.filter(cell=>cell?.code==='grain_2')).toHaveLength(2);
});

test('a dish guide updates after takes and ends when its dish is made',async({page})=>{
  // The purse pays for the Flour from the Windmill.
  const initial=createGame(data);initial.board[13]=null;initial.board[14]=null;initial.coins=10;
  await page.setViewportSize({width:390,height:844});await start(page,initial);await openQuest(page,quest('sorin-first-ride'));
  await page.getByRole('button',{name:'Find the next step for Dough on the board'}).click();
  await expect(page.locator('#item-detail.guided')).toContainText('For Dough: take Flour');
  await expect(page.getByRole('button',{name:'Stop guide for Dough'})).toBeVisible();
  expect(await saved(page)).toEqual(initial);
  const source=initial.board.findIndex(cell=>cell?.code==='generator_grain');
  const first=firstFreeBoardCell(initial,data);
  await tile(page,source).click();
  const afterFirst=act(initial,{type:'spawn',index:source});expect(await saved(page)).toEqual(afterFirst);
  await expect(page.locator('#item-detail.guided')).toContainText('For Dough: take Flour');
  const second=firstFreeBoardCell(afterFirst,data);
  await tile(page,source).click();
  const afterSecond=act(afterFirst,{type:'spawn',index:source});expect(await saved(page)).toEqual(afterSecond);
  await expect(tile(page,source)).toHaveAttribute('aria-pressed','true');
  for(const index of [first,second])await expect(tile(page,index)).toHaveClass(/guide-target/);
  await expect(page.locator('#item-detail.guided')).toContainText('For Dough: merge Flour');
  await tile(page,first).click();await tile(page,second).click();
  expect(await saved(page)).toEqual(act(afterSecond,{type:'move',from:first,to:second}));
  await expect(page.locator('#item-detail.guided')).toHaveCount(0);
  await expect(page.locator('#board .guide-target')).toHaveCount(0);
});

test('a dish guide updates after a move and blocker clearing',async({page})=>{
  const value=quest('victor-exam'),initial=onTicket(value);expect(supplies(value)).toContain('grain_3');expect(initial.board).toEqual(createGame(data).board);
  await start(page,initial);await openQuest(page,value);
  await page.getByRole('button',{name:`Find the next step for ${itemName('grain_3')} on the board`}).click();
  await tile(page,20).click();
  await expect(tile(page,20)).toHaveClass(/selected/);
  await expect(tile(page,14)).toHaveClass(/guide-target/);
  await tile(page,14).click();
  await expect(page.locator('#item-detail.guided')).toContainText(`For ${itemName('grain_3')}: clear blocked Dough`);
  for(const index of [6,41])await expect(tile(page,index)).toHaveClass(/merge-target/);
  const target=await page.locator('#board .guide-target').evaluateAll(elements=>elements.map(element=>Number((element as HTMLElement).dataset.cell)));
  expect(target.filter(index=>[6,41].includes(index))).toHaveLength(1);
  await tile(page,target[0]).click();
  await expect(page.getByRole('button',{name:`Stop guide for ${itemName('grain_3')}`})).toHaveCount(0);
  expect((await saved(page)).board[target[0]]).toEqual({code:'grain_3'});
});

test('delivery keeps a dish guide, Stop cancels it, and reload clears it',async({page})=>{
  const initial=supply(createGame(data),supplies(quest('mara-welcome')));
  await start(page,initial);await openQuest(page,quest('sorin-first-ride'));
  await page.getByRole('button',{name:'Find the next step for Dough on the board'}).click();
  await deliverButton(page,quest('mara-welcome')).click();
  const delivered=await saved(page);
  await expect(page.getByRole('button',{name:'Stop guide for Dough'})).toBeVisible();
  await expect(page.locator('#board .guide-target')).not.toHaveCount(0);
  await page.getByRole('button',{name:'Stop guide for Dough'}).click();
  await expect(page.locator('#board .guide-target')).toHaveCount(0);
  expect(await saved(page)).toEqual(delivered);
  await openQuest(page,quest('sorin-first-ride'));
  await page.getByRole('button',{name:'Find the next step for Dough on the board'}).click();
  await page.reload();await opened(page);
  await expect(page.locator('#board .guide-target')).toHaveCount(0);
  expect(await saved(page)).toEqual(delivered);
});

test('a quest row with enough portions keeps dish help and has no Find control',async({page})=>{
  // Both Socată by the Herb basket go, so the Socată row misses its portion.
  const value=quest('sorin-first-ride'),initial=supply(createGame(data),['grain_2','grain_2']);initial.board[32]=null;initial.board[33]=null;
  await start(page,initial);await openQuest(page,value);
  await expect(page.getByRole('button',{name:'Find the next step for Dough on the board'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Find the next step for Socată on the board'})).toBeVisible();
  await page.getByRole('button',{name:/^2 Dough:/}).click();
  await expect(page.locator('#modal-title')).toHaveText('Dough');
  await page.getByRole('button',{name:'Close dialog'}).click();
  await expect(page.locator('#modal-title')).toHaveText(value.title);
});

for(const viewport of [{width:320,height:740},{width:390,height:844}])for(const theme of ['light','dark'] as const){
  test(`missing dish controls fit a four-dish quest at ${viewport.width}px in ${theme}`,async({page})=>{
    const value=quest('monica-third-pack'),initial=onTicket(value);
    await page.setViewportSize(viewport);await start(page,initial,theme);await openQuest(page,value);
    const missing=value.requirements.filter(({item,quantity})=>initial.board.filter(cell=>cell?.code===item).length<quantity);
    await expect(page.locator('.quest-find')).toHaveCount(missing.length);
    expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
    for(const row of await page.locator('.quest-requirements li').all()){
      const inspect=(await row.locator('.quest-item').boundingBox())!;
      const find=await row.locator('.quest-find').boundingBox();
      expect(inspect.width).toBeGreaterThanOrEqual(44);expect(inspect.height).toBeGreaterThanOrEqual(44);
      if(find){expect(find.width).toBeGreaterThanOrEqual(44);expect(find.height).toBeGreaterThanOrEqual(44);expect(find.x).toBeGreaterThanOrEqual(inspect.x+inspect.width-1);}
      expect(await row.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
    }
  });
}

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
  const second=firstFreeBoardCell(next,data);next.board[second]={code:lower};if(!next.discovered.includes(lower))know(next,lower);
  expect(validate(next)).toBe(true);return {state:next,first,second};
}

test('a merge that completes a quest marks its dishes ready and enables Deliver without opening a dialog',async({page})=>{
  const value=firstQuests[0],fixture=almost(deliverable(value),value);await start(page,fixture.state);
  // Every other dish of the quest is ready already.
  await expect(deliverButton(page,value)).toBeDisabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(value.requirements.length-1);
  await tile(page,fixture.first).click();await tile(page,fixture.second).click();
  await expect(deliverButton(page,value)).toBeEnabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(value.requirements.length);
  await expect(page.locator('#modal')).toBeHidden();await expect(tile(page,fixture.second)).toBeFocused();
  const merged=await saved(page);expect(merged.completedQuests).toEqual(fixture.state.completedQuests);
  await expect(ticket(page,value).locator('.ticket-face')).toHaveAccessibleName(`${value.title}: ${value.requirements.map(({item,quantity})=>`${quantity} ${itemName(item)}, ${quantity} on the board`).join('; ')}`);
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
    // After the flights end, the next task runs after their promise callbacks, which would show the notice.
    document.addEventListener('finish-test-delivery',async()=>{
      animations.forEach(animation=>animation.finish());await Promise.all(animations.map(animation=>animation.finished));
      setTimeout(()=>document.dispatchEvent(new Event('test-delivery-finished')));
    },{once:true});
  });
  await other.evaluate(({key,text})=>localStorage.setItem(key,text),{key:KEY,text:serialize(createGame(data))});
  await expect(page.locator('#status')).toContainText('another tab');
  await page.evaluate(()=>new Promise<void>(resolve=>{
    document.addEventListener('test-delivery-finished',()=>resolve(),{once:true});
    document.dispatchEvent(new Event('finish-test-delivery'));
  }));
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
    if(replacement==='import')await importSaveFile(page,serialize(createGame(data)));
    else await startAgain(page);
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
  const value=quest('monica-third-pack');expect(value.requirements).toHaveLength(4);await start(page,onTicket(value));
  await expect(ticket(page,value).locator('.ticket-items')).toHaveClass(/many/);await page.screenshot({path:testInfo.outputPath('tickets.png')});
  for(const card of await page.locator('#tickets .ticket').all()){
    expect(await card.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
    const box=(await card.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
    for(const control of await card.getByRole('button').all()){const size=(await control.boundingBox())!;expect(size.width).toBeGreaterThanOrEqual(44);expect(size.height).toBeGreaterThanOrEqual(44);}
  }
  for(const food of await ticket(page,value).locator('.ticket-item .food').all()){const box=(await food.boundingBox())!;expect(box.width).toBeGreaterThan(0);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});
