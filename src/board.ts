// The merge board: its spaces and blockers, the selected item and its actions under the board, tap, drag, and keyboard play, and the
// sale of a dish that a drag takes off the board.
import { freeBoardCells, gardenStage, mergePartners, mergeResult, pendingPreparationObstacles, salePrice, unresolvedObstacle } from './model.ts';
import { $, button, coinText, either, element, names, pulse, status } from './dom.ts';
import { blockerMark, clutterArt, crossMark, food } from './art.ts';
import { activeQuests } from './tickets.ts';
import { guidanceGoal, guidanceStep, stopGuidance } from './dishes.ts';
import { fitPin } from './room.ts';
import { modal, showModal } from './dialog.ts';
import { act, apply, changeGame, character, data, definition, itemName, matchingBlocker, onReplace, redraw, select, selected, sourceOf, sourceOutput, state } from './session.ts';
import { onMotionResume, phone } from './preferences.ts';
import { pulseSource } from './sources.ts';

// Mara's note when nothing is selected: the move gesture, in the same words as the other board guidance.
const MOVE_HINT = 'Tap an item, then tap where it should go.';
let ignoreClick = false, boardFocus = 0;
let swapping: { index: number; code: string } | null = null;
let dragging: { index: number; id: number; x: number; y: number; ghost: SVGSVGElement | null } | null = null;
onReplace(() => { cancelDrag(); swapping=null; ignoreClick=false; });
onMotionResume(() => { for(const cell of document.querySelectorAll('.cell,.source'))cell.classList.remove('first','settle','hint'); });

/** A new game points to the first quest of the prologue, whose dishes are ready on the board, so the first action can be Serve. */
export function introduceFirstQuest() {
  const quest=data.prologue.events[0].quests[0];
  pulse(state.board.flatMap((cell,index)=>cell&&quest.requirements.some(({item})=>item===cell.code)?[index]:[]));
  return `${character(quest.character).name}’s dishes are ready on the board. Serve them from the ticket.`;
}

/** Mara's note for a selected item, which the status region announces. On phones the note leaves out the name, which the selection strip shows. */
function selectionLine(code: string) {
  const name = phone.matches ? '' : `${itemName(code)}: `;
  const line = mergePartners(code, data).length ? 'tap a marked dish to merge, or an empty space to move it.' : 'a final dish. Deliver it, or tap an empty space to move it.';
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
  return state.board.flatMap((cell, at) => cell && mergeResult(cell.code, obstacle.ingredient, data) ? [at] : []);
}
/** Mark every legal merge destination for a selected movable dish: a match, a recipe partner, or a blocked dish that merges with it. */
function dishTargets(index: number): number[] {
  const cell = state.board[index];
  if (!cell) return [];
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
  const clear = button('', 'icon-button clear-selection', () => { swapping=null; select(null); redraw(); status(MOVE_HINT); });
  clear.setAttribute('aria-label', 'Clear selection');
  clear.append(crossMark());
  return clear;
}
function chooseCell(index: number) {
  if (ignoreClick) return;
  if (swapping) {
    const from=swapping.index, code=swapping.code;
    if(index===from){swapping=null;redraw();status(selectionLine(code));return;}
    const target=state.board[index];
    if(!target||unresolvedObstacle(state,index,data)||mergeResult(code,target.code,data)) {
      status('Choose a marked dish to swap, or clear the selection to cancel.');return;
    }
    swapping=null;
    void Promise.resolve(changeGame(()=>{
      if(selected===from&&state.board[from]?.code===code&&state.board[index]?.code===target.code)apply({type:'move',from,to:index},index);
    })).then(()=>$(`[data-cell="${selected ?? from}"]`).focus({preventScroll:true}));
    return;
  }
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
  if (selected === index) { stopGuidance(); select(null); redraw(); status(MOVE_HINT); return; }
  const held = selected !== null ? state.board[selected] : null;
  // Outside the explicit swap choice, a click moves into an empty space, merges a pair, or selects a different dish.
  if (selected !== null && held && (!cell || mergeResult(held.code, cell.code, data))) {
    act({ type:'move', from:selected, to:index }, index);
    return;
  }
  select(cell ? index : null);
  redraw();
  status(cell ? selectionLine(cell.code) : guidanceStep()?.short ?? 'Tap an item first, then this space to move it here.');
}
export function renderBoard() {
  if(swapping&&(selected!==swapping.index||state.board[swapping.index]?.code!==swapping.code))swapping=null;
  const free = freeBoardCells(state,data);
  const pending = pendingPreparationObstacles(state,data).length;
  const targets = selected === null ? [] : blockerTargets(selected);
  const matches = selected === null ? [] : dishTargets(selected);
  const guided = guidanceStep(), goal = guidanceGoal();
  const board = $('#board'); board.replaceChildren();
  board.setAttribute('aria-label', `Merge board, ${data.board.columns} columns and ${data.board.rows} rows, ${free} free ${free === 1 ? 'space' : 'spaces'}${pending ? `, ${pending} preparation ${pending === 1 ? 'blocker' : 'blockers'} waiting` : ''}`);
  state.board.forEach((cell, index) => {
    const obstacle = unresolvedObstacle(state,index,data);
    const recommended = guided?.at.includes(index) && selected !== index;
    const swapTarget=swapping&&index!==swapping.index&&cell&&!obstacle&&!mergeResult(swapping.code,cell.code,data);
    const value = button('', `cell ${obstacle ? `obstacle ${obstacle.type}` : cell ? '' : 'empty'} ${selected === index ? 'selected' : ''} ${!swapping&&targets.includes(index) ? 'blocker-target' : ''} ${!swapping&&matches.includes(index) ? 'merge-target' : ''} ${recommended ? 'guide-target' : ''} ${swapTarget?'swap-target':''}`, () => chooseCell(index));
    value.dataset.cell = String(index);
    const what = obstacle
      ? `${obstacle.name}, blocked ${itemName(obstacle.ingredient)}. Merge ${partnerNames(obstacle.ingredient)} into this space to clear it`
      : !cell ? 'empty' : itemName(cell.code);
    value.setAttribute('aria-label', `Row ${Math.floor(index / data.board.columns) + 1}, column ${index % data.board.columns + 1}: ${what}${obstacle?.context ? `. ${obstacle.context}` : ''}`);
    if (targets.includes(index)) value.setAttribute('aria-label', `${value.getAttribute('aria-label')}. Tap to merge into the selected blocked space`);
    if (!swapping&&matches.includes(index)) value.setAttribute('aria-label', `${value.getAttribute('aria-label')}. Tap to merge the selected ${itemName(state.board[selected!]!.code)}${obstacle ? ' here and clear this blocker' : ' here'}`);
    if(swapTarget)value.setAttribute('aria-label',`${value.getAttribute('aria-label')}. Tap to swap with ${itemName(swapping!.code)}`);
    if (recommended) value.setAttribute('aria-label', `${value.getAttribute('aria-label')}. Next step toward ${goal}`);
    if (selected === index && obstacle) value.setAttribute('aria-describedby','blocker-rule');
    // One tab stop for the whole board; the arrow keys move between spaces.
    value.tabIndex = index === (selected ?? boardFocus) ? 0 : -1;
    value.setAttribute('aria-pressed', String(selected === index));
    if (cell) value.append(food(cell.code));
    // The thief rat's hole lies under the ingredient that it dropped.
    if (obstacle?.type === 'rat-hole') { const hole = element('span', 'rat-hole-art'); hole.setAttribute('aria-hidden', 'true'); value.append(hole); }
    if (obstacle) value.append(food(obstacle.ingredient));
    if (obstacle?.type === 'clutter') {
      value.append(clutterArt(obstacle.sprite!, 'clutter-object', obstacle.atlas));
      // The webs cover only the clutter of the neglected bistro, not the things of the grandmother's house in the prologue.
      if (state.taskIndex === 0 && !state.prologue) value.append(clutterArt(4, 'clutter-overlay'));
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
/** The selection strip's note: which neighbours on the tickets want the item. */
function detailNote(code: string) {
  const waiting = [...new Set(activeQuests().filter(quest => quest.requirements.some(requirement => requirement.item === code)).map(quest => character(quest.character).name))];
  return waiting.length ? `${names.format(waiting)} ${waiting.length === 1 ? 'is' : 'are'} waiting for one.` : 'No quest on the counter needs it now.';
}
/** The selected item and its actions take the place of Mara's line under the board, so the player acts without leaving the board. */
export function renderDetail(feedback = '') {
  const container = $('#item-detail'); container.replaceChildren();
  container.classList.toggle('action-feedback', !!feedback);
  const goal=guidanceGoal(), hint=$('#hint-button');
  hint.textContent=goal?'Stop guide':'Find a match';
  hint.setAttribute('aria-label',goal?`Stop guide for ${goal}`:'Find a match');
  const obstacle = selected === null ? null : unresolvedObstacle(state,selected,data);
  container.classList.toggle('blocker-help', !!obstacle);
  const guided=guidanceStep();
  container.classList.toggle('guided', !!guided);
  container.setAttribute('aria-label', obstacle ? 'Selected blocker' : 'Selected item');
  const cell = selected !== null ? state.board[selected] : null;
  if(feedback&&(cell||obstacle)) {
    container.append(element('p','detail-feedback',feedback),clearSelectionButton());
    fitPin();return;
  }
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
  if (swapping) words.append(element('p','detail-next swap-note','Choose a marked dish to swap.'));
  else if (guided) words.append(element('p','detail-next',guided.short));
  else {
    words.append(element('p','detail-next',def.next ? `Two make ${state.discovered.includes(def.next) ? itemName(def.next) : 'a new dish'}`
      : knownPartners(cell.code).length ? `Cook it with ${partnerNames(cell.code)}` : mergePartners(cell.code, data).length ? 'Cook it with a new dish' : 'Final dish'));
    words.append(element('p','detail-description',detailNote(cell.code)));
  }
  head.append(food(cell.code), words);
  const actions = element('div','item-actions');
  const choices=element('details','dish-actions'),summary=element('summary','secondary-button','Actions'),menu=element('div','dish-actions-list');
  summary.setAttribute('aria-label',`Actions for ${def.name}`);
  menu.append(button(swapping?'Cancel swap':'Swap','secondary-button',()=>{
    if(swapping){swapping=null;redraw();status(selectionLine(cell.code));}
    else {stopGuidance();swapping={index:selected!,code:cell.code};redraw();status('Choose a marked dish to swap, or clear the selection to cancel.');}
    $(`[data-cell="${selected}"]`).focus({preventScroll:true});
  }));
  if(!state.prologue)menu.append(button('Sell','secondary-button',()=>offerSale(selected!)));
  choices.append(summary,menu);actions.append(choices);
  actions.append(clearSelectionButton());
  container.append(head, actions);
  const title = words.firstElementChild as HTMLElement;
  words.classList.toggle('long-name', phone.matches && title.offsetHeight > parseFloat(getComputedStyle(title).lineHeight) * 1.5);
  fitPin();
}
function findMatch() {
  for(let from=0;from<state.board.length;from++) {
    const cell=state.board[from];if(!cell)continue;
    const blocker=matchingBlocker(cell.code);
    if(blocker){select(from);redraw();pulse([blocker.position]);status(`Tap the blocked ${itemName(blocker.ingredient)} to merge and clear it.`);return;}
    const to=state.board.findIndex((other,index)=>index!==from&&!!other&&!!mergeResult(cell.code,other.code,data));
    // One item of the pair is selected and the other pulses, so the instruction names a single target.
    if(to>=0){const other=state.board[to]!.code;select(from);redraw();pulse([to]);status(other===cell.code?`Tap the other ${itemName(cell.code)} to merge them.`:`Tap the ${itemName(other)} to cook ${itemName(mergeResult(cell.code,other,data)!)}.`);return;}
  }
  const chain=state.sources[0];
  if(chain){const code=sourceOf(chain).id;select(null);redraw();pulseSource(chain);status(`No matches yet. Tap the ${itemName(code)} to take ${sourceOutput(code)}.`);return;}
  status('No matches yet.');
}
/** Both the Sell control and an off-board drop ask before a sale. The safe choice holds focus. */
function offerSale(index: number) {
  const code=state.board[index]!.code,price=salePrice(code,data,gardenStage(state.taskIndex,data));
  const keep=button('Keep it','secondary-button',()=>modal.close()),choice=element('div','settings-actions');
  // The sale applies only to the same dish in the same space, so a board that changed meanwhile keeps it.
  choice.append(button('Sell','primary-button',()=>{modal.close();changeGame(()=>{if(state.board[index]?.code===code)apply({type:'sell',index},null);});}),keep);
  const confirm=element('div');confirm.append(element('p','modal-copy',`Are you sure you want to sell ${itemName(code)}, for ${coinText(price)}?`),choice);
  showModal('Sell this dish?',confirm,keep);
}
function cancelDrag() { dragging?.ghost?.remove();dragging=null; }
$('#board').addEventListener('pointerdown',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target||event.button!==0)return;
  const index=Number(target.dataset.cell);if(!state.board[index])return;
  // A second pointer, or a release that the window did not receive, must not leave a ghost behind.
  cancelDrag();ignoreClick=false;
  dragging={index,id:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};
});
window.addEventListener('pointermove',event=>{
  if(!dragging||dragging.id!==event.pointerId)return;
  if(!dragging.ghost&&Math.hypot(event.clientX-dragging.x,event.clientY-dragging.y)>8){const cell=state.board[dragging.index];if(!cell){cancelDrag();return;}dragging.ghost=food(cell.code,'drag-ghost');document.body.append(dragging.ghost);}
  if(dragging.ghost){dragging.ghost.style.left=`${event.clientX-37}px`;dragging.ghost.style.top=`${event.clientY-37}px`;event.preventDefault();}
},{passive:false});
window.addEventListener('pointerup',event=>{
  if(ignoreClick&&!dragging){setTimeout(()=>ignoreClick=false,0);return;}
  if(!dragging||dragging.id!==event.pointerId)return;
  const from=dragging.index,moved=Boolean(dragging.ghost),drop=document.elementFromPoint(event.clientX,event.clientY),target=drop?.closest<HTMLElement>('[data-cell]');cancelDrag();
  if(!moved)return;
  ignoreClick=true;setTimeout(()=>ignoreClick=false,0);
  swapping=null;
  const to=target?Number(target.dataset.cell):from;if(to!==from){select(to);act({type:'move',from,to});return;}
  // A dish dropped anywhere off the board and the source tab is offered for sale. The prologue has no purse. The redraw replaces the
  // dropped-on element, so the check comes first.
  const sale=!drop?.closest('#board,#sources')&&!!state.board[from]&&!state.prologue;
  select(from);redraw();
  if(sale)offerSale(from);
});
function abandonDrag() { cancelDrag();ignoreClick=false; }
window.addEventListener('pointercancel',abandonDrag);window.addEventListener('blur',abandonDrag);document.addEventListener('visibilitychange',()=>{if(document.hidden)abandonDrag();});
window.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!dragging)return;
  const index=dragging.index;ignoreClick=true;cancelDrag();swapping=null;
  event.preventDefault();event.stopPropagation();select(index);redraw();
  $(`[data-cell="${index}"]`).focus({preventScroll:true});status('Drag cancelled.');
},true);
$('#board').addEventListener('keydown',event=>{
  const target=(event.target as Element).closest<HTMLElement>('[data-cell]');if(!target)return;const index=Number(target.dataset.cell);let next=index;const {columns}=data.board;const row=index-index%columns;
  if(event.key==='ArrowLeft'&&index%columns>0)next--;else if(event.key==='ArrowRight'&&index%columns<columns-1)next++;else if(event.key==='ArrowUp'&&index>=columns)next-=columns;else if(event.key==='ArrowDown'&&index<state.board.length-columns)next+=columns;
  else if(event.key==='Home')next=event.ctrlKey?0:row;else if(event.key==='End')next=event.ctrlKey?state.board.length-1:row+columns-1;
  else if(event.key==='Escape'){if(selected!==null||guidanceGoal()){swapping=null;stopGuidance();select(null);redraw();status(MOVE_HINT);}return;}else return;
  event.preventDefault();$(`[data-cell="${next}"]`).focus();
});
function cancelGuideFromControl(event: KeyboardEvent) {
  if(event.key==='Escape'&&swapping){
    const index=swapping.index;swapping=null;event.preventDefault();event.stopPropagation();
    redraw();$(`[data-cell="${index}"]`).focus({preventScroll:true});status(selectionLine(state.board[index]!.code));return;
  }
  const choices=$('#item-detail').querySelector<HTMLDetailsElement>('.dish-actions[open]');
  if(event.key==='Escape'&&choices&&choices.contains(event.target as Node)){
    event.preventDefault();event.stopPropagation();choices.open=false;choices.querySelector('summary')!.focus();return;
  }
  if(event.key!=='Escape'||!guidanceGoal())return;
  event.preventDefault();event.stopPropagation();
  const index=selected;
  stopGuidance();select(null);redraw();status(MOVE_HINT);
  if(index!==null)$(`[data-cell="${index}"]`).focus({preventScroll:true});
}
$('#item-detail').addEventListener('keydown',cancelGuideFromControl);
$('#hint-button').addEventListener('keydown',cancelGuideFromControl);
$('#sources').addEventListener('keydown',cancelGuideFromControl);
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
