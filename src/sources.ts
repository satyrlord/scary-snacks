// Sources use a carved rack beside the desktop board and a scrolling ribbon below the phone board. A tap takes an ingredient.
// Desktop dragging, keyboard moves, and Options change the order. Phone swipes scroll the ribbon.
import { gardenStage, takeCost } from './model.ts';
import { $, button as actionButton, element, status } from './dom.ts';
import { modal } from './dialog.ts';
import { coinMark, food } from './art.ts';
import { guidanceGoal, guidanceStep } from './dishes.ts';
import { drawerLayout, still } from './preferences.ts';
import { act, apply, changeGame, data, definition, onReplace, sourceOf, sourceOutput, state, takePrice } from './session.ts';

let ignoreClick = false, tabFocus = 0;
let lastGuidedSource: string | undefined;
let cancelledPointer: number | null = null;
let dragging: { chain: string; id: number; x: number; y: number; ghost: SVGSVGElement | null; to: number } | null = null;
onReplace(() => { resetDrag(); lastGuidedSource=undefined; });

// Each pocket of the rack holds two cards, and the order runs along each pocket, then down the rack. The rack shows seven pockets, and an
// eighth only while a fifteenth source is in the tab, so the cards stay large.
const COLUMNS = 2, POCKETS = 7;
const button = (chain: string) => $('#sources').querySelector<HTMLElement>(`[data-source="${chain}"]`);
const places = () => [...$('#sources').querySelectorAll<HTMLElement>('.source-slot')];
/** Marks one source as a hint, as the board pulses a cell. */
export function pulseSource(chain: string) { button(chain)?.classList.add('hint'); revealSource(chain); }
/** Focuses a source. */
function focusSource(chain: string) { button(chain)?.focus({ preventScroll:true }); }

/** Bring a focused or guided source into the ribbon without scrolling the page. */
function revealSource(chain: string) {
  if (!drawerLayout.matches) return;
  const source=button(chain);if(!source)return;
  const tab=$('#sources'),bounds=tab.getBoundingClientRect(),card=source.getBoundingClientRect();
  if(card.left<bounds.left+2)tab.scrollLeft+=card.left-bounds.left-2;
  else if(card.right>bounds.right-2)tab.scrollLeft+=card.right-bounds.right+2;
  updateScrollButtons();
}
function updateScrollButtons() {
  const tab=$('#sources'),end=Math.max(0,tab.scrollWidth-tab.clientWidth);
  $('#sources-previous').toggleAttribute('disabled',!drawerLayout.matches||tab.scrollLeft<=1);
  $('#sources-next').toggleAttribute('disabled',!drawerLayout.matches||tab.scrollLeft>=end-1);
}
for(const [id,direction] of [['#sources-previous',-1],['#sources-next',1]] as const){
  $(id).addEventListener('click',()=>{
    const tab=$('#sources');tab.scrollBy({left:direction*Math.max(66,tab.clientWidth-66),behavior:still()?'instant':'smooth'});
    updateScrollButtons();
  });
}
$('#sources').addEventListener('scroll',updateScrollButtons,{passive:true});
new ResizeObserver(updateScrollButtons).observe($('#sources'));
drawerLayout.addEventListener('change',()=>{resetDrag();updateScrollButtons();});

function take(chain: string) {
  if (!ignoreClick) act({ type:'spawn', chain });
}
/** Moves a source to another place in the tab and keeps focus on it. */
function arrange(chain: string, to: number) {
  void Promise.resolve(act({ type:'arrange', chain, to })).then(() => focusSource(chain));
}
/** Options offers the same ordering action without a drag. The controls stay in the dialog after each move. */
export function sourceOrderControls() {
  const section = element('section', 'settings-section');
  section.append(element('h3', '', 'Arrange sources'), element('p', '', 'Choose a source and its place in the source list. Moving a source takes no ingredient.'));
  const controls = element('div', 'source-order-controls'), source = element('select'), position = element('select');
  const sourceLabel = element('label', '', 'Source'), positionLabel = element('label', '', 'Position');
  source.id = 'source-order-source'; position.id = 'source-order-position';
  sourceLabel.htmlFor = source.id; positionLabel.htmlFor = position.id;
  const message = element('p', 'source-order-result'); message.setAttribute('role', 'status');
  const refresh = () => {
    const chosen = source.value;
    source.replaceChildren(); position.replaceChildren();
    state.sources.forEach((chain, index) => {
      const item = element('option', '', `${index + 1}. ${sourceOf(chain).name}`); item.value = chain; source.append(item);
      const place = element('option', '', String(index + 1)); place.value = String(index); position.append(place);
    });
    if (state.sources.includes(chosen)) source.value = chosen;
    position.value = String(state.sources.indexOf(source.value));
    move.disabled = state.sources.length < 2;
  };
  const move = actionButton('Move source', 'secondary-button', () => {
    const chain = source.value, to = Number(position.value);
    void changeGame(() => {
      if (!state.sources.includes(chain) || !Number.isInteger(to) || to < 0 || to >= state.sources.length) {
        message.textContent = 'The sources changed. Choose a source and its position again.';
        refresh(); return;
      }
      const result = apply({ type:'arrange', chain, to });
      message.textContent = result.message;
      refresh();
    });
  });
  source.addEventListener('change', () => { position.value = String(state.sources.indexOf(source.value)); message.textContent = ''; });
  controls.append(sourceLabel, source, positionLabel, position, move);
  section.append(controls, message); refresh(); return section;
}
export function renderSources() {
  const tab = $('#sources'), guided = guidanceStep(), goal = guidanceGoal();
  const scroll=tab.scrollLeft;
  const focused=(document.activeElement as HTMLElement|null)?.closest<HTMLElement>('#sources [data-source]')?.dataset.source;
  tab.replaceChildren();
  tabFocus = Math.min(tabFocus, state.sources.length - 1);
  // The places come in pockets of two. A place without a source shows only its empty pocket.
  const pockets = Math.max(POCKETS, Math.ceil(state.sources.length / COLUMNS));
  tab.dataset.rows = String(pockets);
  let pocket: HTMLElement | null = null;
  for (let place = 0; place < Math.min(pockets * COLUMNS, data.chains.length); place++) {
    if (place % COLUMNS === 0) { pocket = element('div', 'source-pocket'); tab.append(pocket); }
    const chain = state.sources[place];
    if (!chain) { const slot = element('span', 'source-slot'); slot.setAttribute('aria-hidden', 'true'); pocket!.append(slot); continue; }
    const code = sourceOf(chain).id, value = element('button', 'source-slot source');
    value.type = 'button'; value.dataset.source = chain; value.tabIndex = place === tabFocus ? 0 : -1;
    value.classList.toggle('guide-target', guided?.source === chain);
    value.setAttribute('aria-label', `${definition(code).name}, source of ${sourceOutput(code)}: tap to take an ingredient, ${takePrice(code)}. Place ${place + 1} of ${state.sources.length}${guided?.source === chain ? `. Next step toward ${goal}` : ''}`);
    value.setAttribute('aria-keyshortcuts', 'Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown');
    value.addEventListener('click', () => take(chain));
    value.append(food(code));
    // A paid source shows the coins of one take on a tag over its pocket, under the picture. Each take of the prologue is free.
    const cost = state.prologue ? 0 : takeCost(definition(code), data, gardenStage(state.taskIndex, data));
    if (cost) { const price = element('span', 'take-cost', String(cost)); price.prepend(coinMark()); price.setAttribute('aria-hidden', 'true'); value.append(price); }
    pocket!.append(value);
  }
  tab.scrollLeft=scroll;
  if(focused&&state.sources.includes(focused))focusSource(focused);
  if(guided?.source&&guided.source!==lastGuidedSource)revealSource(guided.source);
  lastGuidedSource=guided?.source;
  updateScrollButtons();
}
function cancelDrag() {
  dragging?.ghost?.remove();
  for (const slot of $('#sources').querySelectorAll('.drop-target,.lifted')) slot.classList.remove('drop-target', 'lifted');
  dragging = null;
}
function resetDrag() { cancelDrag(); cancelledPointer = null; ignoreClick = false; }
/** The place under a point: a place of a source, or the place after the last source for a reserved place below it. */
function placeAt(x: number, y: number): number {
  const slot = document.elementFromPoint(x, y)?.closest<HTMLElement>('#sources .source-slot');
  if (!slot) return -1;
  return Math.min(places().indexOf(slot), state.sources.length - 1);
}
$('#sources').addEventListener('pointerdown', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-source]');
  if (!target || event.button !== 0) return;
  resetDrag();
  if(drawerLayout.matches)return;
  dragging = { chain: target.dataset.source!, id: event.pointerId, x: event.clientX, y: event.clientY, ghost: null, to: -1 };
});
window.addEventListener('pointermove', event => {
  if (!dragging || dragging.id !== event.pointerId) return;
  if (!dragging.ghost && Math.hypot(event.clientX - dragging.x, event.clientY - dragging.y) > 8) {
    dragging.ghost = food(sourceOf(dragging.chain).id, 'drag-ghost'); document.body.append(dragging.ghost);
    button(dragging.chain)?.classList.add('lifted');
  }
  if (!dragging.ghost) return;
  event.preventDefault();
  dragging.ghost.style.left = `${event.clientX - 37}px`; dragging.ghost.style.top = `${event.clientY - 37}px`;
  const to = placeAt(event.clientX, event.clientY);
  if (to === dragging.to) return;
  dragging.to = to;
  for (const [place, slot] of places().entries()) slot.classList.toggle('drop-target', place === to && state.sources[to] !== dragging.chain);
}, { passive:false });
window.addEventListener('pointerup', event => {
  if (cancelledPointer === event.pointerId) {
    cancelledPointer = null; ignoreClick = true; setTimeout(() => ignoreClick = false, 0); return;
  }
  if (!dragging || dragging.id !== event.pointerId) return;
  const { chain, ghost } = dragging, to = placeAt(event.clientX, event.clientY);
  cancelDrag();
  if (!ghost) return;
  ignoreClick = true; setTimeout(() => ignoreClick = false, 0);
  // A drop outside the tab, or on its own place, leaves the order as it is.
  if (to >= 0 && to !== state.sources.indexOf(chain)) arrange(chain, to);
});
window.addEventListener('pointercancel', resetDrag); window.addEventListener('blur', resetDrag);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetDrag(); });
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !dragging || modal.open) return;
  event.preventDefault(); event.stopPropagation();
  cancelledPointer = dragging.id; cancelDrag(); status('Source move cancelled.');
}, { capture:true });
// The tab is one Tab stop. On a phone each arrow moves one place along the ribbon. On desktop Up and Down move one rack pocket.
// Alt with an arrow key moves the source in the same way.
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLUMNS, ArrowDown: COLUMNS };
$('#sources').addEventListener('keydown', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-source]');
  if (!target) return;
  const chain = target.dataset.source!, place = state.sources.indexOf(chain), last = state.sources.length - 1;
  const step=drawerLayout.matches&&(event.key==='ArrowUp'||event.key==='ArrowDown')?Math.sign(STEPS[event.key]):STEPS[event.key];
  const next = event.key in STEPS ? place + step : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
  if (next === null) return;
  event.preventDefault();
  // A step past the first or the last source keeps the place.
  const to = next < 0 || next > last ? place : next;
  if (to === place) { if (event.altKey) status(`${sourceOf(chain).name}: place ${place + 1} of ${state.sources.length}.`); return; }
  if (event.altKey) arrange(chain, to);
  else focusSource(state.sources[to]);
});
$('#sources').addEventListener('focusin', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-source]');
  if (!target) return;
  tabFocus = state.sources.indexOf(target.dataset.source!);
  for (const source of $('#sources').querySelectorAll<HTMLElement>('[data-source]')) source.tabIndex = source === target ? 0 : -1;
  revealSource(target.dataset.source!);
});
