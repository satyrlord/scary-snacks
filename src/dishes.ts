// The dishes: the recipe book, and the item dialog that tells how to get a dish and points at the next step on the board.
import { $, button, element, pulse, status, svg } from './dom.ts';
import { coveredDish, food } from './art.ts';
import { modal, showModal } from './dialog.ts';
import { setLowered } from './room.ts';
import { canDeliverQuest, firstFreeBoardCell, integer, questDeliveryCells, resolveQuests, unresolvedObstacle } from './model.ts';
import { data, definition, itemName, matchingBlocker, onReplace, redraw, select, sourceOf, state } from './session.ts';
import type { Change } from './session.ts';

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
/** An item's six-stage chain as an ordered list with visible names, three to a row. */
function chainOf(code: string) {
  const def = definition(code); const chain = element('ol', 'chain named'); chain.setAttribute('aria-label','Merge chain');
  for (let stage=1;stage<=6;stage++) {
    const id=`${def.chain}_${stage}`; const step=element('li', id===code?'current':'');
    if (id===code) step.setAttribute('aria-current','step');
    const known = state.discovered.includes(id);
    step.append(known ? food(id) : coveredDish(), element('span', '', known ? itemName(id) : 'Not yet')); chain.append(step);
  }
  return chain;
}
/** The item dialog answers the quest's question: how to get this item, and how many are at hand. Its title names the item. */
function detailContent(code: string) {
  const def = definition(code), name = itemName(code), source = sourceOf(def.chain);
  const onBoard = state.board.filter(cell => cell?.code === code).length;
  const unlocked = state.board.some(cell => cell?.code === source.id);
  const content = document.createDocumentFragment();
  content.append(food(code), element('p','item-how', def.stage > 1 ? `Merge two ${itemName(`${def.chain}_${def.stage - 1}`)} to make ${name}.` : `Tap the ${source.name} to take ${name}.`));
  if (!unlocked) {
    const task = data.tasks.find(value => value.unlock === def.chain);
    content.append(element('p','',`The ${source.name} arrives with ${task ? `the preparation “${task.title}”` : 'a later preparation'}.`), chainOf(code));
    return content;
  }
  const have = onBoard ? `You have ${onBoard} on the board.` : 'You have none yet.';
  content.append(element('p','',have), chainOf(code), button('Show me on the board','secondary-button',() => showWay(code)));
  return content;
}
type Step = { at: number[]; line: string; short: string; ready?: boolean; ticket?: string };
/** Find one useful action toward a dish without changing the board or selection. */
function nextStep(code: string, includeReady = false): Step | null {
  const def = definition(code), name = itemName(code);
  const cells = (id: string) => state.board.flatMap((cell, index) => cell?.code === id && !unresolvedObstacle(state,index,data) ? [index] : []);
  if (includeReady && cells(code).length) return { at: cells(code), line: `${name} is ready on the board.`, short: `${name} is ready`, ready:true };
  for (let stage = def.stage - 1; stage >= 1; stage--) {
    const id = `${def.chain}_${stage}`, pair = cells(id).slice(0, 2);
    if (pair.length === 2) {
      const made=itemName(definition(id).next!);
      return { at:pair, line:`Merge two ${itemName(id)} to make ${made}${made===name?'':` for ${name}`}.`, short:`For ${name}: merge ${itemName(id)}` };
    }
    const blocker = matchingBlocker(id);
    if (pair.length && blocker) {
      const made=itemName(definition(id).next!);
      return { at:[pair[0], blocker.position], line:`Merge ${itemName(id)} into its blocked space to make ${made}${made===name?'':` for ${name}`}.`, short:`For ${name}: clear blocked ${itemName(id)}` };
    }
  }
  if (firstFreeBoardCell(state,data) === -1) {
    const delivery = resolveQuests(state,data).find(({quest}) => canDeliverQuest(state,quest,data)
      && questDeliveryCells(state,quest,data).length > 0 && integer(state.coins + quest.reward));
    if (delivery) return { at:[], ticket:delivery.quest.id,
      line:`The board is full. Deliver ${delivery.quest.title} to make space for ${name}.`,
      short:`For ${name}: deliver ${delivery.quest.title}` };
    for (const [index, cell] of state.board.entries()) {
      if (!cell || unresolvedObstacle(state,index,data) || !definition(cell.code).next) continue;
      const match = cells(cell.code).find(other => other !== index);
      if (match !== undefined) return { at:[index,match],
        line:`The board is full. Merge two ${itemName(cell.code)} to make space for ${name}.`,
        short:`For ${name}: merge ${itemName(cell.code)} to make room` };
      const blocker = matchingBlocker(cell.code);
      if (blocker) return { at:[index,blocker.position],
        line:`The board is full. Merge ${itemName(cell.code)} into its blocked space to make room for ${name}.`,
        short:`For ${name}: clear blocked ${itemName(cell.code)}` };
    }
    return { at:[], line:`The board is full. No delivery or merge can free space for ${name}.`,
      short:'No delivery or merge can free space' };
  }
  const source = sourceOf(def.chain), at = cells(source.id);
  return at.length ? { at, line:`Tap the ${source.name} to take ${itemName(source.generator!.outputs[0])} for ${name}.`, short:`For ${name}: take ${itemName(source.generator!.outputs[0])}` } : null;
}
export const guidanceGoal = () => goal ? itemName(goal) : null;
export const guidanceStep = () => goal ? nextStep(goal) : null;
export const stopGuidance = () => { goal = null; };
/** A guide ends only when a take or merge makes another copy of its requested dish. */
export function updateGuidance(change: Change): string | null {
  if (!goal || !change) return null;
  if (!change.result.ok) return change.result.message === 'The board is full. Merge a pair or deliver a quest.' ? nextStep(goal)?.line ?? null : null;
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
  if (step.ticket) $(`#tickets [data-quest="${step.ticket}"] .deliver-button`).focus({ preventScroll:true });
  else if (step.at.length) $(`[data-cell="${step.at[0]}"]`).focus({ preventScroll:true });
  else $('#hint-button').focus({ preventScroll:true });
}
export function showMissingStep(code: string) { showWay(code,true); }
export function showItem(code: string, back?: () => void) { const content=element('div','item-detail');content.append(detailContent(code));showModal(itemName(code),content,undefined,back); }
/** Undiscovered dishes stay covered, so the book never spoils what the kitchen has not made yet. */
function recipeBook(returnTo?: string, scrollTop = 0) {
  freshDishes=0;markRecipeBook();
  const content=element('div');content.append(element('p','modal-copy','A playful menu inspired by regional foods and drinks. Merge paths are game rules, not cooking recipes. Dishes you have not made yet stay covered.'));
  let focus: HTMLElement | undefined;
  for(const chain of data.chains) {
    const section=element('section','recipe-chain'),heading=element('h3','',chain.name);section.append(heading);
    // A chain is complete once all six of its dishes are discovered. The mark is derived, never saved, and earns nothing.
    if([1,2,3,4,5,6].every(stage=>state.discovered.includes(`${chain.id}_${stage}`))){
      heading.setAttribute('aria-label',`${chain.name}, complete`);
      const mark=element('span','chain-complete'),check=svg('svg');check.setAttribute('viewBox','0 0 16 16');check.setAttribute('aria-hidden','true');
      const tick=svg('path');tick.setAttribute('d','M3.5 8.5l3 3 6-7');check.append(tick);mark.append(check,element('span','','Complete'));heading.append(mark);
    }
    const grid=element('div','recipe-grid');
    for(let stage=1;stage<=6;stage++) {
      const code=`${chain.id}_${stage}`;
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
