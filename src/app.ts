// The game page: it opens the game, draws every part of the interface after each change, and plays the effects of a change.
import { clockMinutes, clockText, unresolvedObstacle } from './model.ts';
import { dataProblems } from './content.ts';
import { $, coinText, coinWord, compact, count, element, reason, status } from './dom.ts';
import { portrait } from './art.ts';
import { modal } from './dialog.ts';
import { changeGame, data, definition, onDraw, open, persist, saveFailed, select, selected, state, syncSavedGame } from './session.ts';
import { SAVE_KEY } from './storage.ts';
import { drawerLayout, onMotionResume, phone, playTone } from './preferences.ts';
import { introduceFirstDelivery, renderBoard, renderDetail } from './board.ts';
import { renderTickets } from './tickets.ts';
import { guidanceStep, markRecipeBook, noteNewDishes, updateGuidance } from './dishes.ts';
import { endSceneFlow, renderOffer, showScene, storyContent } from './story.ts';
import { lowered, renderRoom, reveal, setLowered, syncRoomControls, takeHeldChange } from './room.ts';
import { options } from './options.ts';
import { morning, playNight } from './night.ts';

// Rendering replaces the controls in these regions, so focus is restored by region and position.
const FOCUS_REGIONS = '#board,#tickets,#story,#item-detail,#offer';
const TONE_EVENTS = ['merge', 'deliverQuest', 'task'];
let actionFeedback = '';

/**
 * Phones abbreviate large totals so the coins never reach the wordmark; screen readers always hear the exact amount.
 * A purse below zero is a debt, with a minus sign.
 */
function renderCoins() {
  const amount = Math.abs(state.coins), short = phone.matches && amount >= 10000, debt = state.coins < 0;
  $('#coins').textContent = `${debt ? '−' : ''}${short ? compact.format(amount) : count.format(amount)}`;
  $('#coin-label').textContent = coinWord(amount);
  $('#coin-total').textContent = debt ? `A debt of ${coinText(amount)}` : coinText(amount);
  $('#coin-count').classList.toggle('long', amount >= 1000);
}
/** The day and the time. Phones stack them, so the masthead keeps room for the coins. */
function renderClock() {
  const day = `Day ${phone.matches && state.clock.day >= 10000 ? compact.format(state.clock.day) : count.format(state.clock.day)}`, time = clockText(clockMinutes(state, data)), clock = $('#day-clock');
  clock.setAttribute('aria-label', `Day ${count.format(state.clock.day)}, ${time}`);
  clock.classList.toggle('long', state.clock.day >= 1000);
  if (clock.textContent === `${day} · ${time}`) return;
  const dot = element('span', 'clock-dot', ' · ');
  clock.replaceChildren(element('span', 'clock-day', day), dot, element('span', 'clock-time', time));
}
function celebrateCoins(gain: number) {
  const purse = $('#coin-count');
  purse.querySelector('.coin-delta')?.remove();
  purse.classList.remove('gained'); void purse.offsetWidth; purse.classList.add('gained');
  const delta = element('span', 'coin-delta', `+${count.format(gain)}`); delta.setAttribute('aria-hidden', 'true');
  delta.addEventListener('animationend', () => { delta.remove(); purse.classList.remove('gained'); });
  purse.append(delta);
}
onMotionResume(() => { $('#coin-count').classList.remove('gained'); document.querySelector('.coin-delta')?.remove(); });
function render() {
  const active = document.activeElement;
  const region = active?.closest<HTMLElement>(FOCUS_REGIONS) ?? null;
  const position = region ? [...region.querySelectorAll('button')].indexOf(active as HTMLButtonElement) : -1;
  const board = $('#board'), previousCell = board.querySelector<HTMLElement>('.selected')?.dataset.cell;
  // A delivery can use up the selected item.
  if (selected !== null && !state.board[selected] && !unresolvedObstacle(state,selected,data)) select(null);
  // While an item is selected, its actions take the place of Mara's line.
  $('.game-layout').toggleAttribute('data-selected', selected !== null);
  renderRoom();
  renderCoins(); renderClock();
  renderBoard();
  renderTickets(); $('#story').replaceChildren(storyContent(false)); renderDetail(actionFeedback); renderOffer();
  markRecipeBook();
  if (region && position >= 0) {
    const controls = [...region.querySelectorAll('button')];
    const target = [controls[position], ...controls].find(control => control && !control.disabled && control.checkVisibility({ visibilityProperty:true }))
      ?? (previousCell === undefined || board.closest('[inert]') ? null : board.querySelector<HTMLElement>(`[data-cell="${previousCell}"]`))
      ?? (region.id === 'tickets' ? [...document.querySelectorAll<HTMLElement>('#story .story-waiting button,#story-button')].find(control => control.checkVisibility({ visibilityProperty:true })) : null);
    target?.focus({ preventScroll:true });
  }
  syncRoomControls();
}
// After an action: the drawing, its tone, the coins it earned, the dishes it made, and Mara's line about it.
onDraw(change => {
  const nextStep=updateGuidance(change);
  // Selection changes and later actions replace a refusal. Resizing keeps it until the player acts.
  actionFeedback=change&&!change.result.ok?(nextStep??change.result.message):'';
  render();
  if (!change) return;
  const { result, before } = change;
  // Seeing the night report changes nothing on the screen, so Mara's line stays.
  if (result.event === 'seeNight') return;
  if (result.ok && result.event && TONE_EVENTS.includes(result.event)) playTone(result.event);
  if (state.coins > before.coins) celebrateCoins(state.coins - before.coins);
  const known = new Set(before.discovered);
  if (result.ok && (result.event === 'merge' || result.event === 'spawn')) {
    // A new dish settles onto its tile; the first one of its kind arrives with a little flourish and goes into the recipe book.
    state.board.forEach((cell, index) => { if (cell && cell.code !== before.board[index]?.code) $(`[data-cell="${index}"]`).classList.add(known.has(cell.code) ? 'settle' : 'first'); });
  }
  // A dish goes into the recipe book when the player first makes it, or when a quest that asks for it takes a ticket.
  const first = state.discovered.filter(code => !known.has(code) && !definition(code).generator);
  if (result.ok && first.length) noteNewDishes(first.length);
  if (!nextStep) status(result.message);
  else if (!result.ok) status(nextStep);
  else if (selected === null) status(guidanceStep()?.short ?? nextStep);
  else status(`${result.message} ${nextStep}`);
  // The merge that reaches the closing brings the night.
  if (result.ok && state.clock.day !== before.clock.day) playNight();
});
// The end of a paid preparation's story reveals its change, and then opens the scene that the payment earned.
modal.addEventListener('close',()=>{
  if(modal.open)return;
  endSceneFlow();
  const change=takeHeldChange();
  // The earned scene continues the story, unless the player has opened another dialog meanwhile. It stays waiting in Story either way.
  if(change)void reveal(change.task).then(done=>{if(done&&change.scene&&state.pendingScenes.includes(change.scene)&&!modal.open)showScene(change.scene);});
});
$('.skip-link').addEventListener('click',event=>{
  const stop=$('#board').querySelector<HTMLElement>('[tabindex="0"]');if(!stop)return;
  if(lowered)setLowered(false);
  event.preventDefault();stop.focus({preventScroll:true});stop.scrollIntoView({block:'nearest'});
});
phone.addEventListener('change',()=>{if(state){renderCoins();renderClock();renderDetail(actionFeedback);}});
drawerLayout.addEventListener('change',()=>{setLowered(false);if(state){renderOffer();renderTickets();}});
window.addEventListener('storage',event=>{
  if(!state||event.key!==SAVE_KEY||event.newValue===null)return;
  syncSavedGame();
});
try {
  const response=await fetch(new URL('../data/game.json',import.meta.url));if(!response.ok)throw new Error('Game data could not be loaded.');
  const value=await response.json();
  // Data that fails its checks never reaches the save, so it cannot be mistaken for a damaged save.
  const problems=dataProblems(value);if(problems.length)throw new Error('The game data is not valid.',{cause:problems});
  const saved=await open(value);
  const line=$('.mara-line .portrait'), mara=portrait('mara');
  mara.setAttribute('aria-label',line.getAttribute('aria-label')!);line.replaceWith(mara);
  render();
  // The frame pans smoothly only after it first settles, so opening the game shows the room in place.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{$('#room-frame').classList.add('settled');syncRoomControls();}));
  if(saved.status==='empty')await changeGame(persist);
  status(saved.status==='loaded'?`Welcome back. The stove is still warm.${state.pendingScenes.length?' A story scene is waiting in Story.':''}`:introduceFirstDelivery());
  if(saveFailed)options();
  // A night that the player did not see before the page closed opens its morning dialog now, without the sequence.
  if(modal.open)modal.addEventListener('close',morning,{once:true});else morning();
}catch(error){
  status(`The kitchen could not open. ${reason(error)}`);console.error(error);
  const hint=$('#hint-button');hint.textContent='Try again';hint.addEventListener('click',()=>location.reload());
  for(const opener of document.querySelectorAll<HTMLButtonElement>('#story-button,#recipes-button,#collection-button,[data-options]'))opener.disabled=true;
}
