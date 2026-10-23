// The source tab beside the board: the ingredient sources of the bistro in the player's order, one tap to take, and a drag up or down
// to move a source. The tab keeps a place for every source of the game, so a new source never moves the board.
import { gardenStage, takeCost } from './model.ts';
import { $, element, status } from './dom.ts';
import { coinMark, food } from './art.ts';
import { guidanceGoal, guidanceStep } from './dishes.ts';
import { act, data, definition, onReplace, sourceOf, sourceOutput, state, takePrice } from './session.ts';

let ignoreClick = false, tabFocus = 0;
let dragging: { chain: string; id: number; x: number; y: number; ghost: SVGSVGElement | null; to: number } | null = null;
onReplace(cancelDrag);

const button = (chain: string) => $('#sources').querySelector<HTMLElement>(`[data-source="${chain}"]`);
/** Marks one source as a hint, as the board pulses a cell. */
export function pulseSource(chain: string) { button(chain)?.classList.add('hint'); }
/** Focuses a source. */
function focusSource(chain: string) { button(chain)?.focus({ preventScroll:true }); }

function take(chain: string) {
  if (!ignoreClick) act({ type:'spawn', chain });
}
/** Moves a source to another place in the tab and keeps focus on it. */
function arrange(chain: string, to: number) {
  void Promise.resolve(act({ type:'arrange', chain, to })).then(() => focusSource(chain));
}
export function renderSources() {
  const tab = $('#sources'), guided = guidanceStep(), goal = guidanceGoal();
  tab.replaceChildren();
  tabFocus = Math.min(tabFocus, state.sources.length - 1);
  // One place for each source of the game. A place without a source shows nothing.
  for (let place = 0; place < data.chains.length; place++) {
    const chain = state.sources[place];
    if (!chain) { const slot = element('span', 'source-slot'); slot.setAttribute('aria-hidden', 'true'); tab.append(slot); continue; }
    const code = sourceOf(chain).id, value = element('button', 'source-slot source');
    value.type = 'button'; value.dataset.source = chain; value.tabIndex = place === tabFocus ? 0 : -1;
    value.classList.toggle('guide-target', guided?.source === chain);
    value.setAttribute('aria-label', `${definition(code).name}, source of ${sourceOutput(code)}: tap to take an ingredient, ${takePrice(code)}. Place ${place + 1} of ${state.sources.length}${guided?.source === chain ? `. Next step toward ${goal}` : ''}`);
    value.setAttribute('aria-keyshortcuts', 'Alt+ArrowUp Alt+ArrowDown');
    value.addEventListener('click', () => take(chain));
    value.append(food(code));
    // A paid source shows the coins of one take. Each take of the prologue is free.
    const cost = state.prologue ? 0 : takeCost(definition(code), data, gardenStage(state.taskIndex, data));
    if (cost) { const price = element('span', 'take-cost', String(cost)); price.prepend(coinMark()); price.setAttribute('aria-hidden', 'true'); value.append(price); }
    tab.append(value);
  }
}
function cancelDrag() {
  dragging?.ghost?.remove();
  for (const slot of $('#sources').querySelectorAll('.drop-target,.lifted')) slot.classList.remove('drop-target', 'lifted');
  dragging = null;
}
/** The place under a point: a place of a source, or the place after the last source for a reserved place below it. */
function placeAt(x: number, y: number): number {
  const slot = document.elementFromPoint(x, y)?.closest('#sources .source-slot');
  if (!slot) return -1;
  return Math.min([...$('#sources').children].indexOf(slot), state.sources.length - 1);
}
$('#sources').addEventListener('pointerdown', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-source]');
  if (!target || event.button !== 0) return;
  cancelDrag();
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
  for (const [place, slot] of [...$('#sources').children].entries()) slot.classList.toggle('drop-target', place === to && state.sources[to] !== dragging.chain);
}, { passive:false });
window.addEventListener('pointerup', event => {
  if (!dragging || dragging.id !== event.pointerId) return;
  const { chain, ghost } = dragging, to = placeAt(event.clientX, event.clientY);
  cancelDrag();
  if (!ghost) return;
  ignoreClick = true; setTimeout(() => ignoreClick = false, 0);
  // A drop outside the tab, or on its own place, leaves the order as it is.
  if (to >= 0 && to !== state.sources.indexOf(chain)) arrange(chain, to);
});
window.addEventListener('pointercancel', cancelDrag); window.addEventListener('blur', cancelDrag);
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelDrag(); });
// The tab is one Tab stop. The arrow keys move between sources in their order, and Alt with an arrow key moves the source.
$('#sources').addEventListener('keydown', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-source]');
  if (!target) return;
  const chain = target.dataset.source!, place = state.sources.indexOf(chain), last = state.sources.length - 1;
  const next = event.key === 'ArrowUp' ? place - 1 : event.key === 'ArrowDown' ? place + 1 : event.key === 'Home' ? 0 : event.key === 'End' ? last : null;
  if (next === null) return;
  event.preventDefault();
  const to = Math.max(0, Math.min(last, next));
  if (to === place) { if (event.altKey) status(`${sourceOf(chain).name}: place ${place + 1} of ${state.sources.length}.`); return; }
  if (event.altKey) arrange(chain, to);
  else focusSource(state.sources[to]);
});
$('#sources').addEventListener('focusin', event => {
  const target = (event.target as Element).closest<HTMLElement>('[data-source]');
  if (!target) return;
  tabFocus = state.sources.indexOf(target.dataset.source!);
  for (const source of $('#sources').querySelectorAll<HTMLElement>('[data-source]')) source.tabIndex = source === target ? 0 : -1;
});
