import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createGame, firstFreeBoardCell, getItem } from '../../src/engine.ts';
import type { GameState, Quest } from '../../src/engine.ts';
import { data, deliverButton, deliverable, exportText, failWrites, journal, KEY, onTicket, opened, options, person, quest, ratio, readTo, request, restoreWrites, saved, serialize, start, startAgainAndImport, story, supplies, supply, tile, ticket, validate } from './support.ts';

/** The first request of each neighbour who lives in the village. */
const firstQuests=data.characters.filter(character=>!character.visitor&&data.quests.some(value=>value.character===character.id)).map(character=>data.quests.find(value=>value.character===character.id)!);
const itemName=(code: string)=>getItem(code,data)!.name;
const dialogDeliver=(page: Page,value: Quest)=>page.getByRole('dialog',{name:value.title,exact:true}).getByRole('button',{name:`Deliver ${value.title} for ${value.reward.toLocaleString('en')} coins`,exact:true});
async function finishScene(page: Page){
  while(await page.locator('.story-controls .primary-button').textContent()==='Continue')await page.locator('.story-controls .primary-button').click();
  await page.getByRole('button',{name:'Return',exact:true}).click();
}

for(const value of firstQuests)test(`${value.character} asks on a ticket, the request dialog explains it, and Deliver pays once across reload`,async({page})=>{
  const initial=deliverable(value);await start(page,initial);const before=await saved(page),name=person(value.character).name;
  const card=ticket(page,value);await expect(card).toHaveAccessibleName(`${name}’s request: ${value.title}`);await expect(card.locator('.ticket-name')).toHaveText(name);
  await expect(card.locator('.ticket-item.ready')).toHaveCount(value.requirements.length);await expect(deliverButton(page,value)).toBeEnabled();
  await request(page,value);const dialog=page.getByRole('dialog',{name:value.title,exact:true});
  await expect(dialog.locator('.quest-person')).toHaveText(name);for(const line of value.opening)await expect(dialog.locator('.quest-view')).toContainText(line.text);
  for(const {item,quantity} of value.requirements)await expect(dialog.getByRole('button',{name:`${quantity} ${itemName(item)}: ${quantity} of ${quantity} on the board`,exact:true})).toBeVisible();
  await expect(dialog.locator('.quest-reward')).toHaveText(`Reward: ${value.reward} coins`);expect(await saved(page)).toEqual(before);
  await dialogDeliver(page,value).click();await expect(page.locator('#story-line')).toContainText(value.completion[0].text);
  await expect(page.getByRole('dialog',{name:value.title,exact:true}).locator('.completion-message')).toHaveText(`${value.title}: delivered. Earned ${value.reward} coins.`);
  // The completion scene waits until the player finishes it. Then nothing else changes.
  const delivered=await saved(page);expect(delivered.pendingScenes).toEqual([...before.pendingScenes,value.id]);const after={...delivered,pendingScenes:before.pendingScenes};
  expect(after.completedQuests).toEqual([...before.completedQuests,value.id]);expect(after.coins).toBe(before.coins+value.reward);
  expect(after.board.filter(Boolean).length).toBe(before.board.filter(Boolean).length-supplies(value).length);
  await readTo(page,'Back to the kitchen');await expect(page.locator('#modal')).toBeHidden();expect(await saved(page)).toEqual(after);
  await expect(ticket(page,value)).toHaveCount(0);
  await page.reload();await opened(page);expect(await saved(page)).toEqual(after);await expect(ticket(page,value)).toHaveCount(0);
});

test('a reload during a request completion scene keeps it waiting in Story and the journal, and Read now finishes it once',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);await deliverButton(page,value).click();
  await expect(page.locator('#story-line')).toContainText(value.completion[0].text);await expect(page.getByRole('button',{name:'Skip scene',exact:true})).toBeVisible();
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

test('request rewards survive export and import, while introductions and journal replay give no reward',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));await journal(page);const initial=await saved(page);
  // Only the neighbours present in a new game have entries; later regulars are "Not yet" outlines.
  for(const character of data.characters.filter(character=>!character.singleVisit&&!character.arrivesAfter)){
    await page.getByRole('button',{name:`Meet ${character.name}`,exact:true}).click();await expect(page.locator('#story-line')).toContainText(character.introduction);
    await finishScene(page);expect(await saved(page)).toEqual(initial);
  }
  await page.keyboard.press('Escape');await deliverButton(page,value).click();await readTo(page,'Back to the kitchen');
  const committed=await saved(page);await journal(page);
  for(const name of [`Read request: ${value.title}`,`Replay ${value.title}`]){
    await page.getByRole('button',{name,exact:true}).click();await finishScene(page);await expect(page.getByRole('button',{name:`Replay ${value.title}`,exact:true})).toBeFocused();expect(await saved(page)).toEqual(committed);
  }
  await page.keyboard.press('Escape');await options(page);const text=await exportText(page);expect(JSON.parse(text).state).toEqual(committed);
  await startAgainAndImport(page,text);expect(await saved(page)).toEqual(committed);
  await page.reload();await opened(page);await expect(ticket(page,value)).toHaveCount(0);expect(await saved(page)).toEqual(committed);
});

test('a surplus on the board reads as the required count on the ticket and in the request rows',async({page})=>{
  const value=quest('sorin-first-ride'),requirement=value.requirements[0],name=itemName(requirement.item);
  await start(page,supply(deliverable(value),supplies(value)));
  await expect(ticket(page,value).locator('.ticket-items')).toHaveAccessibleName(new RegExp(`^${value.title}: ${requirement.quantity} ${name}, ${requirement.quantity} on the board;`));
  await expect(ticket(page,value).locator('.ticket-count').first()).toHaveText(`${requirement.quantity}/${requirement.quantity}`);
  await request(page,value);
  const row=page.getByRole('button',{name:`${requirement.quantity} ${name}: ${requirement.quantity} of ${requirement.quantity} on the board`,exact:true});
  await expect(row).toBeVisible();await expect(row.locator('.quest-count')).toHaveText(`${requirement.quantity} / ${requirement.quantity} on board`);
});

test('request dish help keeps focus on the next blocked merge on desktop and phone',async({page})=>{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);await start(page,createGame(data));
    const value=firstQuests[0],code=value.requirements[0].item;
    await request(page,value);await page.getByRole('button',{name:new RegExp(`^1 ${itemName(code)}:`)}).click();
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
  await failWrites(page);await deliverButton(page,value).click();
  await expect(page.locator('.completion-message')).toContainText('This session is not saved. Use Retry save in Options, or export before leaving.');await readTo(page,'Back to the kitchen');
  await expect(page.locator('#coins')).toHaveText(String(before.coins+value.reward));await expect(ticket(page,value)).toHaveCount(0);expect(await saved(page)).toEqual(before);
  await page.reload();await opened(page);await expect(deliverButton(page,value)).toBeEnabled();expect(await saved(page)).toEqual(before);
});

test('after a failed delivery write, Retry save in Options saves the delivery once',async({page})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);
  await failWrites(page);await deliverButton(page,value).click();await readTo(page,'Back to the kitchen');
  await options(page);await expect(page.locator('#modal .save-status').first()).toContainText('Not saved:');
  await restoreWrites(page);await page.getByRole('button',{name:'Retry save',exact:true}).click();
  await expect(page.locator('#status')).toHaveText('Your progress is saved in this browser.');await expect(page.getByRole('button',{name:'Retry save',exact:true})).toHaveCount(0);
  const after=await saved(page);expect(after.completedQuests).toEqual([...before.completedQuests,value.id]);expect(after.coins).toBe(before.coins+value.reward);expect(after.pendingScenes).toEqual([]);
  await page.reload();await opened(page);await expect(ticket(page,value)).toHaveCount(0);expect(await saved(page)).toEqual(after);
});

test('keyboard and emulated touch can open a request and deliver it with focus returned',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage(),value=firstQuests[0];await start(page,deliverable(value));
    await ticket(page,value).locator('.ticket-items').tap();await expect(page.getByRole('dialog',{name:value.title,exact:true})).toBeVisible();
    await dialogDeliver(page,value).focus();await page.keyboard.press('Space');
    await expect(page.getByRole('dialog',{name:value.title,exact:true}).locator('.completion-message')).toBeVisible();await expect(page.locator('.story-controls .primary-button')).toBeFocused();
    await readTo(page,'Back to the kitchen');expect((await saved(page)).completedQuests).toContain(value.id);
    await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('#story-button')).toBeFocused();
    expect(await page.locator('#board').evaluate(board=>board.getAnimations({subtree:true}).length)).toBe(0);
  }finally{await context.close();}
});

/** The first dish waits as two lower items, so one merge makes the request deliverable. */
function almost(state: GameState,value: Quest){
  const next=structuredClone(state),item=value.requirements[0].item,lower=Object.values(data.items).find(candidate=>candidate.next===item)!.id;
  const first=next.board.findIndex(cell=>cell?.code===item);next.board[first]={code:lower};
  const second=firstFreeBoardCell(next,data);next.board[second]={code:lower};
  expect(validate(next)).toBe(true);return {state:next,first,second};
}

test('a merge that completes a request marks its dishes ready and enables Deliver without opening a dialog',async({page})=>{
  const value=firstQuests[0],fixture=almost(deliverable(value),value);await start(page,fixture.state);
  await expect(deliverButton(page,value)).toBeDisabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(0);
  await tile(page,fixture.first).click();await tile(page,fixture.second).click();
  await expect(deliverButton(page,value)).toBeEnabled();await expect(ticket(page,value).locator('.ticket-item.ready')).toHaveCount(1);
  await expect(page.locator('#modal')).toBeHidden();await expect(tile(page,fixture.second)).toBeFocused();
  const merged=await saved(page);expect(merged.completedQuests).toEqual(fixture.state.completedQuests);
  await expect(ticket(page,value).locator('.ticket-items')).toHaveAccessibleName(`${value.title}: 1 ${itemName(value.requirements[0].item)}, 1 on the board`);
});

test('another tab that delivers a request takes it off this tab’s ticket, and the reward is paid once',async({page,context})=>{
  const value=firstQuests[0];await start(page,deliverable(value));const before=await saved(page);
  const other=await context.newPage();await other.goto('./');await opened(other);
  await deliverButton(other,value).click();await expect(other.getByRole('dialog',{name:value.title,exact:true})).toBeVisible();
  await expect(page.locator('#status')).toHaveText('This game moved on in another tab. The board now shows that progress.');
  await expect(ticket(page,value)).toHaveCount(0);await expect(page.locator('#coins')).toHaveText(String(before.coins+value.reward));
  expect((await saved(page)).completedQuests).toEqual([value.id]);await other.close();
});

test('a delivery flight cannot open its old scene after another tab replaces the game',async({page,context})=>{
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
  await expect(page.locator('#modal')).toBeHidden();expect((await saved(page)).completedQuests).toEqual([]);await other.close();
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])for(const theme of ['light','dark'] as const)test(`the request dialog fits ${viewport.width}x${viewport.height} in ${theme}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
  const value=quest('dochia-sheepskin');await start(page,deliverable(value));await request(page,value);
  const view=page.locator('.quest-view');await expect(view.locator('.quest-item')).toHaveCount(value.requirements.length);
  for(const control of await page.locator('#modal button').all()){const box=(await control.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  const colors=await view.evaluate(element=>{
    const background=getComputedStyle(element.closest('dialog')!).backgroundColor;
    return {background,inks:[...element.querySelectorAll('p,li,.quest-count')].map(node=>getComputedStyle(node).color)};
  });for(const ink of colors.inks)expect(ratio(colors.background,ink)).toBeGreaterThanOrEqual(4.5);
  expect(await page.locator('#modal').evaluate(element=>element.scrollWidth<=element.clientWidth&&element.scrollHeight<=element.clientHeight)).toBe(true);
  await expect(dialogDeliver(page,value)).toBeInViewport();await expect(dialogDeliver(page,value)).toBeEnabled();
  await page.screenshot({path:testInfo.outputPath('request.png')});
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
