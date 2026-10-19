// The dishes: the recipe book, and the item dialog that tells how to get a dish and points at the next step on the board.
import { $, button, element, pulse, status, svg } from './dom.ts';
import { coveredDish, food } from './art.ts';
import { modal, showModal } from './dialog.ts';
import { data, definition, itemName, matchingBlocker, onReplace, redraw, select, sourceOf, state } from './session.ts';

// The dishes discovered since the recipe book was last opened.
let freshDishes = 0;
onReplace(() => { freshDishes = 0; });
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
/** Points at the next step toward an item: the item itself, the highest pair that merges toward it, or its source. */
function showWay(code: string) {
  modal.close();
  const def = definition(code), name = itemName(code);
  const cells = (id: string) => state.board.flatMap((cell, index) => cell?.code === id ? [index] : []);
  // The first cell is selected and the rest pulse, so the selected outline stays visible.
  const point = (at: number[], line: string) => { select(at[0]); redraw(); pulse(at.slice(1)); status(line); $(`[data-cell="${at[0]}"]`).focus({ preventScroll:true }); };
  if (cells(code).length) return point(cells(code), `${name} is ready on the board.`);
  for (let stage = def.stage - 1; stage >= 1; stage--) {
    const id = `${def.chain}_${stage}`, pair = cells(id).slice(0, 2);
    if (pair.length === 2) return point(pair, `Tap the other ${itemName(id)} to merge them.`);
    const blocker = matchingBlocker(id);
    if (pair.length && blocker) return point([pair[0], blocker.position], `Tap the blocked ${itemName(id)} to merge and clear it.`);
  }
  const source = sourceOf(def.chain), at = cells(source.id);
  if (at.length) point(at, `Use Take ${itemName(source.generator!.outputs[0])} on the ${source.name}.`);
}
export function showItem(code: string, back?: () => void) { const content=element('div','item-detail');content.append(detailContent(code));showModal(itemName(code),content,undefined,back); }
/** Undiscovered dishes stay covered, so the book never spoils what the kitchen has not made yet. */
function recipeBook() {
  freshDishes=0;markRecipeBook();
  const content=element('div');content.append(element('p','modal-copy','A playful menu inspired by regional foods and drinks. Merge paths are game rules, not cooking recipes. Dishes you have not made yet stay covered.'));
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
      const value=button('','recipe-item',()=>showItem(code));value.append(food(code),element('span','',itemName(code)));grid.append(value);
    }
    section.append(grid);content.append(section);
  }
  showModal('The recipe book',content);
}
$('#collection-button').addEventListener('click',()=>data&&recipeBook());
$('#recipes-button').addEventListener('click',()=>data&&recipeBook());
