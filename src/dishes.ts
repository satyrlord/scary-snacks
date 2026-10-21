// The dishes: the recipe book, and the item dialog that tells how to get a dish and points at the next step on the board.
import { $, button, element, pulse, status, svg } from './dom.ts';
import { coveredDish, food } from './art.ts';
import { modal, showModal } from './dialog.ts';
import { setLowered } from './room.ts';
import { availableChains, boardObstacles, canDeliverQuest, dishChains, firstFreeBoardCell, integer, mergeResult, MIXED, questDeliveryCells, resolveQuests, unresolvedObstacle } from './model.ts';
import { data, definition, itemName, matchingBlocker, onReplace, redraw, select, sourceOf, state, takePrice } from './session.ts';
import type { Change } from './session.ts';
import { BOARD_FULL } from './engine.ts';

// The dishes discovered since the recipe book was last opened.
let freshDishes = 0;
let goal: string | null = null;
onReplace(() => { freshDishes = 0; goal = null; });
/** The recipe book shows how many dishes are new since it was last opened. */
export function markRecipeBook() {
  const label = freshDishes ? `, ${freshDishes} new` : '';
  for (const opener of [$('#collection-button'), $('#recipes-button')]) opener.toggleAttribute('data-fresh', freshDishes > 0);
  $('#recipes-button').setAttribute('aria-label', `Recipes${label}`);
  const dishes = Object.values(data.items).filter(item => !item.generator).length;
  $('#discovery-count').textContent = `${state.discovered.filter(code => !definition(code).generator).length} of ${dishes} dishes discovered${label}`;
}
export function noteNewDishes(found: number) { freshDishes += found; markRecipeBook(); }
/** The dishes of a chain, in stage order. */
const chainDishes = (chain: string) => Object.values(data.items).filter(item => item.chain === chain && !item.generator).sort((a, b) => a.stage - b.stage).map(item => item.id);
/** The mixed dishes, in the order of the data. */
const mixedDishes = () => Object.values(data.items).filter(item => item.recipe).map(item => item.id);
/** A dish, or a covered dish with "Not yet" until the player discovers it. */
function step(code: string, current: boolean) {
  const value = element('li', current ? 'current' : ''), known = state.discovered.includes(code);
  if (current) value.setAttribute('aria-current', 'step');
  value.append(known ? food(code) : coveredDish(), element('span', '', known ? itemName(code) : 'Not yet'));
  return value;
}
/** How a dish is made, as an ordered list with visible names: its whole chain, or the two parts and the mixed dish of its recipe. */
function pathOf(code: string) {
  const def = definition(code), path = element('ol', 'chain named');
  path.setAttribute('aria-label', def.recipe ? 'Recipe' : 'Merge chain');
  for (const id of def.recipe ? [...def.recipe, code] : chainDishes(def.chain)) path.append(step(id, id === code));
  return path;
}
/** The mixed dishes that a dish is a part of: discovered ones by name. */
function cooksInto(code: string) {
  const results = mixedDishes().filter(id => definition(id).recipe!.includes(code));
  if (!results.length) return null;
  const known = results.filter(id => state.discovered.includes(id)).map(itemName), hidden = results.length - known.length;
  return element('p', '', `It is a part of ${results.length} mixed ${results.length === 1 ? 'dish' : 'dishes'}${known.length ? `: ${known.join(', ')}${hidden ? `, and ${hidden} not yet discovered` : ''}` : ''}.`);
}
/** The item dialog answers the quest's question: how to get this item, and how many are at hand. Its title names the item. */
function detailContent(code: string) {
  const def = definition(code), name = itemName(code);
  const onBoard = state.board.filter(cell => cell?.code === code).length;
  const content = document.createDocumentFragment();
  const how = def.recipe ? `Merge ${itemName(def.recipe[0])} and ${itemName(def.recipe[1])} to make ${name}.`
    : def.stage > 1 ? `Merge two ${itemName(`${def.chain}_${def.stage - 1}`)} to make ${name}.`
    : `Tap the ${sourceOf(def.chain).name} to take ${name}, ${takePrice(sourceOf(def.chain).id)}.`;
  content.append(food(code), element('p','item-how', how));
  const open = availableChains(state, data), closed = dishChains(code, data).filter(chain => !open.includes(chain));
  if (closed.length) {
    const sources = closed.map(chain => { const task = data.tasks.find(value => value.unlock === chain); return `the ${sourceOf(chain).name} arrives with ${task ? `the preparation “${task.title}”` : 'a later preparation'}`; });
    const text = sources.join(', and ');
    content.append(element('p','',`${text[0].toUpperCase()}${text.slice(1)}.`), pathOf(code));
    return content;
  }
  const have = onBoard ? `You have ${onBoard} on the board.` : 'You have none yet.';
  content.append(element('p','',have), pathOf(code));
  const parts = cooksInto(code);
  if (parts) content.append(parts);
  content.append(button('Show me on the board','secondary-button',() => showWay(code)));
  return content;
}
type Step = { at: number[]; line: string; short: string; ready?: boolean; ticket?: string };
/** The movable cells that hold a dish. */
const cells = (id: string) => state.board.flatMap((cell, index) => cell?.code === id && !unresolvedObstacle(state,index,data) ? [index] : []);
/** A blocked cell that holds this very dish, so a matching dish merges into it. */
const blockedCopy = (id: string) => boardObstacles(state,data).find(obstacle => obstacle.ingredient === id && !state.resolvedObstacles.includes(obstacle.id));
/** The takes and merges that a dish still needs, from the movable dishes on the board. Guidance follows the part with fewer steps. */
function effort(code: string, quantity = 1): number {
  const missing = Math.max(0, quantity - cells(code).length);
  if (!missing) return 0;
  const def = definition(code);
  if (def.recipe) return effort(def.recipe[0], missing) + effort(def.recipe[1], missing) + missing;
  if (def.stage === 1) return missing;
  return effort(`${def.chain}_${def.stage - 1}`, missing * 2) + missing;
}
/** Find one useful action toward a dish without changing the board or selection. Goal names the dish that the guide is for. */
function nextStep(code: string, includeReady = false, goalName = itemName(code), allowRoom = true): Step | null {
  const def = definition(code), name = goalName;
  const toward = (made: string) => made === name ? '' : ` for ${name}`;
  if (includeReady && cells(code).length) return { at: cells(code), line: `${name} is ready on the board.`, short: `${name} is ready`, ready:true };
  if (def.recipe) {
    const [first, second] = def.recipe, a = cells(first), b = cells(second);
    if (a.length && b.length) return { at:[a[0], b[0]], line:`Merge ${itemName(first)} and ${itemName(second)} to make ${itemName(code)}${toward(itemName(code))}.`, short:`For ${name}: cook ${itemName(code)}` };
    for (const [part, other] of [[first, second], [second, first]] as const) {
      const blocked = blockedCopy(other);
      if (cells(part).length && blocked) return { at:[cells(part)[0], blocked.position], line:`Merge ${itemName(part)} into the blocked ${itemName(other)} to make ${itemName(code)}${toward(itemName(code))}.`, short:`For ${name}: clear blocked ${itemName(other)}` };
    }
    const missing = [first, second].filter(part => !cells(part).length).sort((x, y) => effort(x) - effort(y));
    // Check every part for a useful merge before a full board falls back to a delivery or another pair.
    for (const part of missing) { const found = nextStep(part, false, name, false); if (found) return found; }
    return allowRoom && firstFreeBoardCell(state,data) === -1 ? roomStep(name) : null;
  }
  for (let stage = def.stage - 1; stage >= 1; stage--) {
    const id = `${def.chain}_${stage}`, pair = cells(id).slice(0, 2);
    if (pair.length === 2) {
      const made=itemName(definition(id).next!);
      return { at:pair, line:`Merge two ${itemName(id)} to make ${made}${toward(made)}.`, short:`For ${name}: merge ${itemName(id)}` };
    }
    const blocker = blockedCopy(id);
    if (pair.length && blocker) {
      const made=itemName(definition(id).next!);
      return { at:[pair[0], blocker.position], line:`Merge ${itemName(id)} into its blocked space to make ${made}${toward(made)}.`, short:`For ${name}: clear blocked ${itemName(id)}` };
    }
  }
  if (firstFreeBoardCell(state,data) === -1) return allowRoom ? roomStep(name) : null;
  const source = sourceOf(def.chain), at = cells(source.id), staple = itemName(source.generator!.outputs[0]);
  return at.length ? { at, line:`Tap the ${source.name} to take ${staple} for ${name}, ${takePrice(source.id)}.`, short:`For ${name}: take ${staple}` } : null;
}
/** Make room only after no legal merge can advance any part of the requested dish. */
function roomStep(name: string): Step {
  // A campaign quest comes before the recovery quest, which only refills a short purse.
  const delivery = resolveQuests(state,data).sort((a, b) => Number(!!a.quest.recovery) - Number(!!b.quest.recovery)).find(({quest}) => canDeliverQuest(state,quest,data)
    && questDeliveryCells(state,quest,data).length > 0 && integer(state.coins + quest.reward, -1_000_000_000));
  if (delivery) return { at:[], ticket:delivery.quest.id,
    line:`The board is full. Deliver ${delivery.quest.title} to make space for ${name}.`,
    short:`For ${name}: deliver ${delivery.quest.title}` };
  for (const [index, cell] of state.board.entries()) {
    if (!cell || unresolvedObstacle(state,index,data) || definition(cell.code).generator) continue;
    const match = state.board.findIndex((other, at) => at !== index && !!other && !unresolvedObstacle(state,at,data) && !!mergeResult(cell.code, other.code, data));
    if (match >= 0) return { at:[index,match],
      line:`The board is full. Merge ${state.board[match]!.code === cell.code ? `two ${itemName(cell.code)}` : `${itemName(cell.code)} and ${itemName(state.board[match]!.code)}`} to make space for ${name}.`,
      short:`For ${name}: merge ${itemName(cell.code)} to make room` };
    const blocker = matchingBlocker(cell.code);
    if (blocker) return { at:[index,blocker.position],
      line:`The board is full. Merge ${itemName(cell.code)} into the blocked ${itemName(blocker.ingredient)} to make room for ${name}.`,
      short:`For ${name}: clear blocked ${itemName(blocker.ingredient)}` };
  }
  return { at:[], line:`The board is full. No delivery or merge can free space for ${name}.`,
    short:'No delivery or merge can free space' };
}
export const guidanceGoal = () => goal ? itemName(goal) : null;
export const guidanceStep = () => goal ? nextStep(goal) : null;
export const stopGuidance = () => { goal = null; };
/** A guide ends only when a take or merge makes another copy of its requested dish. */
export function updateGuidance(change: Change): string | null {
  if (!goal || !change) return null;
  if (!change.result.ok) return change.result.message === BOARD_FULL ? nextStep(goal)?.line ?? null : null;
  const code = goal;
  if ((change.result.event === 'spawn' || change.result.event === 'merge')
    && state.board.filter(cell => cell?.code === code).length > change.before.board.filter(cell => cell?.code === code).length) {
    goal = null;
    return null;
  }
  return nextStep(code)?.line ?? null;
}
/** Point once, then keep a temporary goal if another dish still needs to be made. */
function showWay(code: string, needAnother = false) {
  const step = nextStep(code,!needAnother);
  modal.close();
  goal = step && !step.ready ? code : null;
  if (!step) return;
  setLowered(false);
  select(step.at[0] ?? null); redraw(); pulse(step.at.slice(1)); status(step.line);
  // A phone shows the recovery ticket as its face alone, so the guide focuses the face, and its dialog delivers.
  if (step.ticket) [...document.querySelectorAll<HTMLElement>(`#tickets [data-quest="${step.ticket}"] :is(.deliver-button,.ticket-face)`)].reverse()
    .find(control => control.checkVisibility())?.focus({ preventScroll:true });
  else if (step.at.length) $(`[data-cell="${step.at[0]}"]`).focus({ preventScroll:true });
  else $('#hint-button').focus({ preventScroll:true });
}
export function showMissingStep(code: string) { showWay(code,true); }
export function showItem(code: string, back?: () => void) { const content=element('div','item-detail');content.append(detailContent(code));showModal(itemName(code),content,undefined,back); }
/** Undiscovered dishes stay covered, so the book never spoils what the kitchen has not made yet. */
function recipeBook(returnTo?: string, scrollTop = 0) {
  freshDishes=0;markRecipeBook();
  const content=element('div');content.append(element('p','modal-copy','A playful menu inspired by regional foods and drinks. Two matching dishes merge into the next dish of their chain, and dishes from different chains cook a mixed dish. Merge paths are game rules, not cooking recipes. Dishes you have not made yet stay covered.'));
  let focus: HTMLElement | undefined;
  for(const {id,name} of [...data.chains,{id:MIXED,name:'Mixed dishes'}]) {
    const codes=id===MIXED?mixedDishes():chainDishes(id);
    const section=element('section','recipe-chain'),heading=element('h3','',name);section.append(heading);
    // A section is complete once all its dishes are discovered. The mark is derived, never saved, and earns nothing.
    if(codes.every(code=>state.discovered.includes(code))){
      heading.setAttribute('aria-label',`${name}, complete`);
      const mark=element('span','chain-complete'),check=svg('svg');check.setAttribute('viewBox','0 0 16 16');check.setAttribute('aria-hidden','true');
      const tick=svg('path');tick.setAttribute('d','M3.5 8.5l3 3 6-7');check.append(tick);mark.append(check,element('span','','Complete'));heading.append(mark);
    }
    const grid=element('div','recipe-grid');
    for(const code of codes) {
      if(!state.discovered.includes(code)){const slot=element('div','recipe-item not-yet');slot.append(coveredDish(),element('span','','Not yet'));grid.append(slot);continue;}
      const value=button('','recipe-item',()=>{
        const position=modal.scrollTop;
        showItem(code,()=>recipeBook(code,position));
      });
      value.append(food(code),element('span','',itemName(code)));grid.append(value);
      if(code===returnTo)focus=value;
    }
    section.append(grid);content.append(section);
  }
  showModal('The recipe book',content,focus);
  if(focus)modal.scrollTop=scrollTop;
}
$('#collection-button').addEventListener('click',()=>data&&recipeBook());
$('#recipes-button').addEventListener('click',()=>data&&recipeBook());
