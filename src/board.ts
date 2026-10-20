// The merge board: its spaces and blockers, the selected item and its actions under the board, and tap, drag, and keyboard play.
import { freeBoardCells, mergePartners, mergeResult, pendingPreparationObstacles, takeCost, unresolvedObstacle } from './model.ts';
import { $, button, either, element, names, pulse, status } from './dom.ts';
import { blockerMark, clutterArt, coinMark, crossMark, food, sourceMark } from './art.ts';
import { activeQuests } from './tickets.ts';
import { guidanceGoal, guidanceStep, stopGuidance } from './dishes.ts';
import { fitPin } from './room.ts';
import { act, character, data, definition, itemName, matchingBlocker, onReplace, redraw, select, selected, sourceOutput, state, takePrice } from './session.ts';
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
  const line = def.generator ? `tap it to take more ${sourceOutput(code)}, ${takePrice(code)}.`
    : mergePartners(code, data).length ? 'tap a marked dish to merge, or an empty space to move it.' : 'a final dish. Deliver it, or tap an empty space to move it.';
  return name ? name + line : line[0].toUpperCase() + line.slice(1);
}
/**
 * The dishes that merge with a dish, in words: the same dish while it has a next stage, and each recipe partner that the player has made.
 * An unmade partner stays covered, so the words never name it.
 */
const knownPartners = (code: string) => mergePartners(code, data).filter(partner => partner === code || state.discovered.includes(partner));
const partnerNames = (code: string) => either.format([...new Set(knownPartners(code).map(itemName))]);
/** Mark movable dishes that merge with the selected blocked dish. */
function blockerTargets(index: number): number[] {
  const obstacle = unresolvedObstacle(state,index,data);
  if (!obstacle) return [];
  return state.board.flatMap((cell, at) => {
    const other = unresolvedObstacle(state,at,data);
    return !other && cell && mergeResult(cell.code, obstacle.ingredient, data) ? [at] : [];
  });
}
/** Mark every legal merge destination for a selected movable dish: a match, a recipe partner, or a blocked dish that merges with it. */
function dishTargets(index: number): number[] {
  const cell = state.board[index];
  if (!cell || definition(cell.code).generator) return [];
  return state.board.flatMap((other, at) => {
    if (at === index) return [];
    const obstacle = unresolvedObstacle(state,at,data);
    const code = obstacle ? obstacle.ingredient : other?.code;
    return code && mergeResult(cell.code, code, data) ? [at] : [];
  });
}
function clearSelectionButton() {
  const goal = guidanceGoal();
  if (goal) {
    const stop = button('Stop', 'text-button guide-stop clear-selection', () => { stopGuidance(); select(null); redraw(); status('Guide stopped.'); });
    stop.setAttribute('aria-label', `Stop guide for ${goal}`);
    return stop;
  }
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
    if (held && mergeResult(held.code, obstacle.ingredient, data)) {
      act({ type:'move', from:selected!, to:index }, index);
    } else if (selected === index) {
      stopGuidance(); select(null); redraw(); status(MOVE_HINT);
    } else {
      select(index);
      redraw();
      const rule = `${obstacle.name}: tap a marked ${partnerNames(obstacle.ingredient)} to merge here.`;
      status(obstacle.context ? `${rule} ${obstacle.context}` : rule);
    }
    return;
  }
  const cell = state.board[index];
  const selectedObstacle = selected === null ? null : unresolvedObstacle(state,selected,data);
  if (selectedObstacle && cell && mergeResult(cell.code, selectedObstacle.ingredient, data)) {
    const destination = selected!;
    void Promise.resolve(act({ type:'move', from:index, to:destination }, destination)).then(() => {
      if (selected === destination && state.board[destination] && !state.board[index]) $(`[data-cell="${destination}"]`).focus({ preventScroll:true });
    });
    return;
  }
  // One tap on an ingredient source takes an ingredient and selects the source, so its actions stay in view. A drag only moves it.
  if (cell && definition(cell.code).generator) { select(index); act({ type:'spawn', index }); return; }
  if (selected === index) { stopGuidance(); select(null); redraw(); status(MOVE_HINT); return; }
  const held = selected !== null ? state.board[selected] : null;
  // A click moves into an empty space, merges a matching pair, or cooks a recipe. Any other item is selected instead; swapping needs a drag.
  if (selected !== null && held && (!cell || mergeResult(held.code, cell.code, data))) {
    act({ type:'move', from:selected, to:index }, index);
    return;
  }
  select(cell ? index : null);
  redraw();
  status(cell ? selectionLine(cell.code) : guidanceStep()?.short ?? 'Tap an item first, then this space to move it here.');
}
export function renderBoard() {
  const free = freeBoardCells(state,data);
  const pending = pendingPreparationObstacles(state,data).length;
  const targets = selected === null ? [] : blockerTargets(selected);
  const matches = selected === null ? [] : dishTargets(selected);
  const guided = guidanceStep(), goal = guidanceGoal();
  const board = $('#board'); board.replaceChildren();
  board.setAttribute('aria-label', `Merge board, ${data.board.columns} columns and ${data.board.rows} rows, ${free} free ${free === 1 ? 'space' : 'spaces'}${pending ? `, ${pending} preparation blockers waiting` : ''}`);
  state.board.forEach((cell, index) => {
    const obstacle = unresolvedObstacle(state,index,data);
    const recommended = guided?.at.includes(index) && selected !== index;
    const value = button('', `cell ${obstacle ? `obstacle ${obstacle.type}` : cell ? '' : 'empty'} ${selected === index ? 'selected' : ''} ${targets.includes(index) ? 'blocker-target' : ''} ${matches.includes(index) ? 'merge-target' : ''} ${recommended ? 'guide-target' : ''}`, () => chooseCell(index));
    value.dataset.cell = String(index);
    const what = obstacle
      ? `${obstacle.name}, blocked ${itemName(obstacle.ingredient)}. Merge ${partnerNames(obstacle.ingredient)} into this space to clear it`
      : !cell ? 'empty' : definition(cell.code).generator ? `${itemName(cell.code)}, source of ${sourceOutput(cell.code)}: tap to take an ingredient, ${takePrice(cell.code)}` : itemName(cell.code);
    value.setAttribute('aria-label', `Row ${Math.floor(index / data.board.columns) + 1}, column ${index % data.board.columns + 1}: ${what}${obstacle?.context ? `. ${obstacle.context}` : ''}`);
    if (targets.includes(index)) value.setAttribute('aria-label', `${value.getAttribute('aria-label')}. Tap to merge into the selected blocked space`);
    if (matches.includes(index)) value.setAttribute('aria-label', `${value.getAttribute('aria-label')}. Tap to merge the selected ${itemName(state.board[selected!]!.code)}${obstacle ? ' here and clear this blocker' : ' here'}`);
    if (recommended) value.setAttribute('aria-label', `${value.getAttribute('aria-label')}. Next step toward ${goal}`);
    if (selected === index && obstacle) value.setAttribute('aria-describedby','blocker-rule');
    // One tab stop for the whole board; the arrow keys move between spaces.
    value.tabIndex = index === (selected ?? boardFocus) ? 0 : -1;
    value.setAttribute('aria-pressed', String(selected === index));
    if (cell) {
      value.append(food(cell.code));
      if (definition(cell.code).generator) {
        value.append(sourceMark());
        // A paid source shows the coins of one take beside its mark.
        const cost = takeCost(definition(cell.code), data);
        if (cost) { const price = element('span', 'take-cost', String(cost)); price.prepend(coinMark()); price.setAttribute('aria-hidden', 'true'); value.append(price); }
      }
    }
    // The thief rat's hole lies under the ingredient that it dropped.
    if (obstacle?.type === 'rat-hole') { const hole = element('span', 'rat-hole-art'); hole.setAttribute('aria-hidden', 'true'); value.append(hole); }
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
      value.title = `Merge ${partnerNames(obstacle.ingredient)} into this blocked space. Tap for help.`;
    }
    board.append(value);
  });
}
/** The selection strip's note: how a source works, or which neighbours on the tickets want the item. */
function detailNote(code: string) {
  if (definition(code).generator) return `Tap again for ${sourceOutput(code)}: ${takePrice(code)}. No limit.`;
  const waiting = [...new Set(activeQuests().filter(quest => quest.requirements.some(requirement => requirement.item === code)).map(quest => character(quest.character).name))];
  return waiting.length ? `${names.format(waiting)} ${waiting.length === 1 ? 'is' : 'are'} waiting for one.` : 'No quest on the counter needs it now.';
}
/** The selected item and its actions take the place of Mara's line under the board, so the player acts without leaving the board. */
export function renderDetail() {
  const container = $('#item-detail'); container.replaceChildren();
  const goal=guidanceGoal(), hint=$('#hint-button');
  hint.textContent=goal?'Stop guide':'Find a match';
  hint.setAttribute('aria-label',goal?`Stop guide for ${goal}`:'Find a match');
  const obstacle = selected === null ? null : unresolvedObstacle(state,selected,data);
  container.classList.toggle('blocker-help', !!obstacle);
  const guided=guidanceStep();
  container.classList.toggle('guided', !!guided);
  container.setAttribute('aria-label', obstacle ? 'Selected blocker' : 'Selected item');
  const cell = selected !== null ? state.board[selected] : null;
  container.classList.toggle('source-detail', !!cell && !!definition(cell.code).generator);
  if (obstacle) {
    const copy = element('div','blocker-copy'), rule = element('p','blocker-rule',
      `Tap a marked ${partnerNames(obstacle.ingredient)} to merge here.`);
    rule.id = 'blocker-rule';
    copy.append(element('strong','blocker-title',obstacle.name),rule);
    container.append(copy,clearSelectionButton()); fitPin(); return;
  }
  if (!cell) { fitPin(); return; }
  const def = definition(cell.code);
  const head = element('div','detail-head'); const words = element('div','detail-words');
  words.append(element('h3','',def.name));
  if (guided) words.append(element('p','detail-next',guided.short));
  else {
    if (!def.generator) words.append(element('p','detail-next',def.next ? `Two make ${state.discovered.includes(def.next) ? itemName(def.next) : 'a new dish'}`
      : knownPartners(cell.code).length ? `Cook it with ${partnerNames(cell.code)}` : mergePartners(cell.code, data).length ? 'Cook it with a new dish' : 'Final dish'));
    words.append(element('p','detail-description',detailNote(cell.code)));
  }
  head.append(food(cell.code), words);
  const actions = element('div','item-actions');
  actions.append(clearSelectionButton());
  container.append(head, actions);
  const title = words.firstElementChild as HTMLElement;
  words.classList.toggle('long-name', phone.matches && title.offsetHeight > parseFloat(getComputedStyle(title).lineHeight) * 1.5);
  fitPin();
}
function findMatch() {
  for(let from=0;from<state.board.length;from++) {
    const cell=state.board[from];if(!cell||definition(cell.code).generator||unresolvedObstacle(state,from,data))continue;
    const blocker=matchingBlocker(cell.code);
    if(blocker){select(from);redraw();pulse([blocker.position]);status(`Tap the blocked ${itemName(blocker.ingredient)} to merge and clear it.`);return;}
    const to=state.board.findIndex((other,index)=>index!==from&&!!other&&!unresolvedObstacle(state,index,data)&&!!mergeResult(cell.code,other.code,data));
    // One item of the pair is selected and the other pulses, so the instruction names a single target.
    if(to>=0){const other=state.board[to]!.code;select(from);redraw();pulse([to]);status(other===cell.code?`Tap the other ${itemName(cell.code)} to merge them.`:`Tap the ${itemName(other)} to cook ${itemName(mergeResult(cell.code,other,data)!)}.`);return;}
  }
  const index=state.board.findIndex(cell=>cell&&definition(cell.code).generator);
  if(index>=0){const code=state.board[index]!.code;select(index);redraw();status(`No matches yet. Tap the ${itemName(code)} to take ${sourceOutput(code)}.`);return;}
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
  else if(event.key==='Escape'){if(selected!==null||guidanceGoal()){stopGuidance();select(null);redraw();status(MOVE_HINT);}return;}else return;
  event.preventDefault();$(`[data-cell="${next}"]`).focus();
});
function cancelGuideFromControl(event: KeyboardEvent) {
  if(event.key!=='Escape'||!guidanceGoal())return;
  event.preventDefault();event.stopPropagation();
  const index=selected;
  stopGuidance();select(null);redraw();status(MOVE_HINT);
  if(index!==null)$(`[data-cell="${index}"]`).focus({preventScroll:true});
}
$('#item-detail').addEventListener('keydown',cancelGuideFromControl);
$('#hint-button').addEventListener('keydown',cancelGuideFromControl);
// The board keeps a single tab stop where focus last was; the skip link lands on it too.
$('#board').addEventListener('focusin',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target)return;boardFocus=Number(target.dataset.cell);
  for(const cell of $('#board').querySelectorAll<HTMLElement>('[data-cell]'))cell.tabIndex=cell===target?0:-1;
});
$('#board').addEventListener('focus',()=>$('#board').querySelector<HTMLElement>('[tabindex="0"]')?.focus());
$('#hint-button').addEventListener('click',()=>{
  if(!state)return;
  if(guidanceGoal()){stopGuidance();redraw();status('Guide stopped.');return;}
  findMatch();
});
