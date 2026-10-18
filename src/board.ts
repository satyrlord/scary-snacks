// The merge board: its spaces and blockers, the selected item and its actions under the board, and tap, drag, and keyboard play.
import { freeBoardCells, generatorOutputs, pendingPreparationObstacles, unresolvedObstacle } from './model.ts';
import { $, button, element, names, pulse, status } from './dom.ts';
import { blockerMark, clutterArt, crossMark, food, sourceMark } from './art.ts';
import { activeQuests } from './tickets.ts';
import { fitPin } from './room.ts';
import { act, character, chosenOutput, data, definition, itemName, matchingBlocker, onReplace, redraw, select, selected, sourceOutput, state } from './session.ts';
import { onMotionResume, phone } from './preferences.ts';

// Mara's note when nothing is selected: the move gesture, in the same words as the other board guidance.
const MOVE_HINT = 'Tap an item, then tap where it should go.';
let ignoreClick = false, boardFocus = 0;
let dragging: { index: number; id: number; x: number; y: number; ghost: SVGSVGElement | null } | null = null;
onReplace(cancelDrag);
onMotionResume(() => { for(const cell of document.querySelectorAll('.cell'))cell.classList.remove('first','settle','hint'); });

/** Mara's note for a selected item, which the status region announces. On phones the note leaves out the name, which the selection strip shows. */
function selectionLine(code: string) {
  const def = definition(code), name = phone.matches ? '' : `${itemName(code)}: `;
  const line = def.generator ? `tap it to take more ${itemName(chosenOutput(code))}.` : def.next ? 'tap another to merge, or an empty space to move it.' : 'a final dish. Deliver it, or tap an empty space to move it.';
  return name ? name + line : line[0].toUpperCase() + line.slice(1);
}
/** Mark movable matches for the selected blocked ingredient. */
function blockerTargets(index: number): number[] {
  const obstacle = unresolvedObstacle(state,index,data);
  if (!obstacle) return [];
  return state.board.flatMap((cell, at) => {
    const other = unresolvedObstacle(state,at,data);
    return !other && cell?.code === obstacle.ingredient ? [at] : [];
  });
}
function clearSelectionButton() {
  const clear = button('', 'icon-button clear-selection', () => { select(null); redraw(); status(MOVE_HINT); });
  clear.setAttribute('aria-label', 'Clear selection');
  clear.append(crossMark());
  return clear;
}
function chooseCell(index: number) {
  if (ignoreClick) return;
  const obstacle = unresolvedObstacle(state,index,data);
  if (obstacle) {
    const held = selected !== null ? state.board[selected] : null;
    if (held?.code === obstacle.ingredient) {
      act({ type:'move', from:selected!, to:index }, index);
    } else if (selected === index) {
      select(null); redraw(); status(MOVE_HINT);
    } else {
      select(index);
      redraw();
      const rule = `${obstacle.name}: merge a movable ${itemName(obstacle.ingredient)} into this space to clear it.`;
      status(obstacle.context ? `${rule} ${obstacle.context}` : rule);
    }
    return;
  }
  const cell = state.board[index];
  // One tap on an ingredient source takes an ingredient and selects the source, so its actions stay in view. A drag only moves it.
  if (cell && definition(cell.code).generator) { select(index); act({ type:'spawn', index }); return; }
  if (selected === index) { select(null); redraw(); status(MOVE_HINT); return; }
  const held = selected !== null ? state.board[selected] : null;
  // A click moves into an empty space or merges a matching pair. Any other item is selected instead; swapping needs a drag.
  if (selected !== null && held && (!cell || (cell.code === held.code && definition(cell.code).next))) {
    act({ type:'move', from:selected, to:index }, index);
    return;
  }
  select(cell ? index : null);
  redraw();
  status(cell ? selectionLine(cell.code) : 'Tap an item first, then this space to move it here.');
}
export function renderBoard() {
  const free = freeBoardCells(state,data);
  const pending = pendingPreparationObstacles(state,data).length;
  const targets = selected === null ? [] : blockerTargets(selected);
  const board = $('#board'); board.replaceChildren();
  board.setAttribute('aria-label', `Merge board, ${data.board.columns} columns and ${data.board.rows} rows, ${free} free ${free === 1 ? 'space' : 'spaces'}${pending ? `, ${pending} preparation blockers waiting` : ''}`);
  state.board.forEach((cell, index) => {
    const obstacle = unresolvedObstacle(state,index,data);
    const value = button('', `cell ${obstacle ? `obstacle ${obstacle.type}` : cell ? '' : 'empty'} ${selected === index ? 'selected' : ''} ${targets.includes(index) ? 'blocker-target' : ''}`, () => chooseCell(index));
    value.dataset.cell = String(index);
    const what = obstacle
      ? `${obstacle.name}, blocked ${itemName(obstacle.ingredient)}. Merge a matching movable ingredient into this space to clear it`
      : !cell ? 'empty' : definition(cell.code).generator ? `${itemName(cell.code)}, source of ${sourceOutput(cell.code)}: tap to take an ingredient` : itemName(cell.code);
    value.setAttribute('aria-label', `Row ${Math.floor(index / data.board.columns) + 1}, column ${index % data.board.columns + 1}: ${what}${obstacle?.context ? `. ${obstacle.context}` : ''}`);
    if (targets.includes(index)) value.setAttribute('aria-label', `${value.getAttribute('aria-label')}. Matching item for the selected blocked ingredient`);
    if (selected === index && obstacle) value.setAttribute('aria-describedby','blocker-rule');
    // One tab stop for the whole board; the arrow keys move between spaces.
    value.tabIndex = index === (selected ?? boardFocus) ? 0 : -1;
    value.setAttribute('aria-pressed', String(selected === index));
    if (cell) {
      value.append(food(cell.code));
      if (definition(cell.code).generator) value.append(sourceMark());
    }
    if (obstacle) value.append(food(obstacle.ingredient));
    if (obstacle?.type === 'clutter') {
      value.append(clutterArt(obstacle.sprite!, 'clutter-object', obstacle.atlas === 'preparation'));
      if (state.taskIndex === 0) value.append(clutterArt(4, 'clutter-overlay'));
    }
    if (obstacle?.type === 'anchored') {
      value.append(clutterArt(5, 'clutter-overlay'));
    }
    if (obstacle) {
      value.append(blockerMark());
      value.title = `Merge another ${itemName(obstacle.ingredient)} into this blocked space. Tap for help.`;
    }
    board.append(value);
  });
}
/** The selection strip's note: how a source works, or which neighbours on the tickets want the item. */
function detailNote(code: string) {
  if (definition(code).generator) return 'Tap it on the board, or use Take. It never runs out.';
  const waiting = [...new Set(activeQuests().filter(quest => quest.requirements.some(requirement => requirement.item === code)).map(quest => character(quest.character).name))];
  return waiting.length ? `${names.format(waiting)} ${waiting.length === 1 ? 'is' : 'are'} waiting for one.` : 'No quest on the counter needs it now.';
}
/** The selected item and its actions take the place of Mara's line under the board, so the player acts without leaving the board. */
export function renderDetail() {
  const container = $('#item-detail'); container.replaceChildren();
  const obstacle = selected === null ? null : unresolvedObstacle(state,selected,data);
  container.classList.toggle('blocker-help', !!obstacle);
  container.setAttribute('aria-label', obstacle ? 'Selected blocker' : 'Selected item');
  const cell = selected !== null ? state.board[selected] : null;
  const outputs = cell && definition(cell.code).generator ? generatorOutputs(state,cell.code,data) : [];
  container.classList.toggle('multiple-outputs', outputs.length > 1);
  if (obstacle) {
    const copy = element('div','blocker-copy'), rule = element('p','blocker-rule',
      `Merge another ${itemName(obstacle.ingredient)} into this blocked space.`);
    rule.id = 'blocker-rule';
    copy.append(element('strong','blocker-title',obstacle.name),rule);
    container.append(copy,clearSelectionButton()); fitPin(); return;
  }
  if (!cell) { fitPin(); return; }
  const def = definition(cell.code); const at = selected!;
  const head = element('div','detail-head'); const words = element('div','detail-words');
  words.append(element('h3','',def.name), element('p','detail-next', def.generator ? `Source of ${sourceOutput(cell.code)}` : def.next ? `Two make ${state.discovered.includes(def.next) ? itemName(def.next) : 'a new dish'}` : 'Final dish'), element('p','detail-description',detailNote(cell.code)));
  head.append(food(cell.code), words);
  const actions = element('div','item-actions');
  const takes = element('div','take-actions');
  for (const output of outputs) {
    const take = button('', 'primary-button take-button', () => act({type:'spawn',index:at,output}));
    // Phones show only the output name in a compact row; the accessible name keeps the verb.
    const label = element('span','take-label'); label.append(element('span','take-word','Take '), itemName(output));
    take.append(food(output), label); take.setAttribute('aria-label', `Take ${itemName(output)}`);
    take.setAttribute('aria-pressed', String(output === chosenOutput(cell.code)));
    takes.append(take);
  }
  if (outputs.length === 1) actions.append(takes);
  actions.append(clearSelectionButton());
  container.append(head, actions);
  if (outputs.length > 1) container.append(takes);
  const title = words.firstElementChild as HTMLElement;
  words.classList.toggle('long-name', phone.matches && title.offsetHeight > parseFloat(getComputedStyle(title).lineHeight) * 1.5);
  fitPin();
}
function findMatch() {
  for(let from=0;from<state.board.length;from++) {
    const cell=state.board[from];if(!cell||!definition(cell.code).next)continue;
    const blocker=matchingBlocker(cell.code);
    if(blocker){select(from);redraw();pulse([blocker.position]);status(`Tap the blocked ${itemName(cell.code)} to merge and clear it.`);return;}
    const to=state.board.findIndex((other,index)=>index!==from&&other?.code===cell.code);
    // One item of the pair is selected and the other pulses, so the instruction names a single target.
    if(to>=0){select(from);redraw();pulse([to]);status(`Tap the other ${itemName(cell.code)} to merge them.`);return;}
  }
  const index=state.board.findIndex(cell=>cell&&definition(cell.code).generator);
  if(index>=0){const code=state.board[index]!.code;select(index);redraw();status(`No matches yet. Tap the ${itemName(code)} to take ${itemName(chosenOutput(code))}.`);return;}
  status('No matches yet.');
}
function cancelDrag() { dragging?.ghost?.remove();dragging=null; }
$('#board').addEventListener('pointerdown',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target||event.button!==0)return;
  const index=Number(target.dataset.cell);if(!state.board[index]||unresolvedObstacle(state,index,data))return;
  // A second pointer, or a release that the window did not receive, must not leave a ghost behind.
  cancelDrag();
  dragging={index,id:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};
});
window.addEventListener('pointermove',event=>{
  if(!dragging||dragging.id!==event.pointerId)return;
  if(!dragging.ghost&&Math.hypot(event.clientX-dragging.x,event.clientY-dragging.y)>8){const cell=state.board[dragging.index];if(!cell){cancelDrag();return;}dragging.ghost=food(cell.code,'drag-ghost');document.body.append(dragging.ghost);}
  if(dragging.ghost){dragging.ghost.style.left=`${event.clientX-37}px`;dragging.ghost.style.top=`${event.clientY-37}px`;event.preventDefault();}
},{passive:false});
window.addEventListener('pointerup',event=>{
  if(!dragging||dragging.id!==event.pointerId)return;
  const from=dragging.index,moved=Boolean(dragging.ghost);const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>('[data-cell]');cancelDrag();
  if(moved){ignoreClick=true;setTimeout(()=>ignoreClick=false,0);const to=target?Number(target.dataset.cell):from;if(to!==from){select(to);act({type:'move',from,to});}else{select(from);redraw();}}
});
window.addEventListener('pointercancel',cancelDrag);window.addEventListener('blur',cancelDrag);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelDrag();});
$('#board').addEventListener('keydown',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target)return;const index=Number(target.dataset.cell);let next=index;const {columns}=data.board;const row=index-index%columns;
  if(event.key==='ArrowLeft'&&index%columns>0)next--;else if(event.key==='ArrowRight'&&index%columns<columns-1)next++;else if(event.key==='ArrowUp'&&index>=columns)next-=columns;else if(event.key==='ArrowDown'&&index<state.board.length-columns)next+=columns;
  else if(event.key==='Home')next=event.ctrlKey?0:row;else if(event.key==='End')next=event.ctrlKey?state.board.length-1:row+columns-1;
  else if(event.key==='Escape'){if(selected!==null){select(null);redraw();status(MOVE_HINT);}return;}else return;
  event.preventDefault();$(`[data-cell="${next}"]`).focus();
});
// The board keeps a single tab stop where focus last was; the skip link lands on it too.
$('#board').addEventListener('focusin',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target)return;boardFocus=Number(target.dataset.cell);
  for(const cell of $('#board').querySelectorAll<HTMLElement>('[data-cell]'))cell.tabIndex=cell===target?0:-1;
});
$('#board').addEventListener('focus',()=>$('#board').querySelector<HTMLElement>('[tabindex="0"]')?.focus());
$('#hint-button').addEventListener('click',()=>state&&findMatch());
