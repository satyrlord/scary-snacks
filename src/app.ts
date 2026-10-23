// The game page: it opens the game, draws every part of the interface after each change, and plays the effects of a change.
import { clockMinutes, clockText, currentEvent, dateText, eventComplete, fixedBooking, gameDay, unresolvedObstacle } from './model.ts';
import { dataProblems } from './content.ts';
import { $, coinText, coinWord, compact, count, element, reason, status } from './dom.ts';
import { portrait } from './art.ts';
import { modal } from './dialog.ts';
import { changeGame, character, data, definition, onDraw, open, persist, saveFailed, select, selected, state, syncSavedGame } from './session.ts';
import { SAVE_KEY } from './storage.ts';
import { drawerLayout, onMotionResume, phone, playTone } from './preferences.ts';
import { introduceFirstQuest, renderBoard, renderDetail } from './board.ts';
import { renderTickets, toast } from './tickets.ts';
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
 * Large totals use the short form, from 10,000 on phones and from a million on wider screens, so the coins never reach the wordmark;
 * screen readers always hear the exact amount. A purse below zero is a debt, with a minus sign, in ink, and "owed".
 */
function renderCoins() {
  // The prologue has no purse.
  $('#coin-count').hidden = state.prologue !== null;
  const amount = Math.abs(state.coins), short = amount >= (phone.matches ? 10_000 : 1_000_000), debt = state.coins < 0;
  $('#coins').textContent = `${debt ? '−' : ''}${short ? compact.format(amount) : count.format(amount)}`;
  $('#coin-label').textContent = debt ? 'owed' : coinWord(amount);
  $('#coin-total').textContent = debt ? `A debt of ${coinText(amount)}` : coinText(amount);
  $('#coin-count').classList.toggle('long', amount >= 1000);
  $('#coin-count').classList.toggle('debt', debt);
}
/**
 * The date and the time. Screen readers hear the full date; phones stack the short date over the time, so the masthead keeps room for
 * the coins. The prologue has no clock, so the masthead shows only the date of the current event.
 */
function renderClock() {
  const shown = gameDay(state, data), day = dateText(shown, data, 'short'), time = state.prologue ? '' : clockText(clockMinutes(state, data)), clock = $('#day-clock');
  if (clock.querySelector('.clock-face')?.textContent === (time ? `${day} · ${time}` : day)) return;
  const face = element('span', 'clock-face');
  face.setAttribute('aria-hidden', 'true');
  face.append(element('span', 'clock-day', day));
  if (time) face.append(element('span', 'clock-dot', ' · '), element('span', 'clock-time', time));
  clock.replaceChildren(element('span', 'visually-hidden', time ? `${dateText(shown, data)}, ${time}` : dateText(shown, data)), face);
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
  // The closing of a Sunday brings the night. A Sunday of the piper's tune with no rat opens only the morning dialog. Another closing
  // only leaves a notice, so play goes on.
  if (result.ok && state.clock.day !== before.clock.day) {
    if (state.night?.rat) playNight();
    else if (state.night?.piper) morning();
    else if (state.night) toast(closingText(state.night.upkeep, state.night.departed, before));
  }
});
/**
 * The notice of a closing without rats: the guest who sleeps over after a fixed evening, the upkeep, the seasonal sources that left or
 * came, and the new date.
 */
function closingText(upkeep: number, departed: string[], before: typeof state) {
  const came = data.chains.filter(chain => chain.season && !before.board.some(cell => cell?.code === `generator_${chain.id}`) && state.board.some(cell => cell?.code === `generator_${chain.id}`));
  const guest = fixedBooking(before.clock.day, data), sleeps = guest && state.completedQuests.includes(guest.id) ? [`${character(guest.character).name} sleeps in the courtyard.`] : [];
  return [...sleeps, `The bistro closed for the night. Upkeep: ${coinText(upkeep)}.`, ...departed.map(id => data.chains.find(chain => chain.id === id)!.season!.departure),
    ...came.map(chain => `The ${definition(`generator_${chain.id}`).name} is on the board.`), `Good morning, ${dateText(state.clock.day, data)}.`].join(' ');
}
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
  // After the last dish of the prologue, the counter offers the waiting scene.
  const event=currentEvent(state,data),waiting=!state.pendingScenes.length?'':event&&eventComplete(state,event)?' Read now on the counter opens the waiting scene.':' A story scene is waiting in Story.';
  status(saved.status==='loaded'?`Welcome back. The stove is still warm.${waiting}`:introduceFirstQuest());
  // A new game opens the first scene of the prologue at once. A reload opens no scene.
  if(saved.status==='empty'&&state.pendingScenes.length)showScene(state.pendingScenes[0]);
  if(saveFailed)options();
  // A night that the player did not see before the page closed opens its morning dialog now, without the sequence.
  if(modal.open)modal.addEventListener('close',morning,{once:true});else morning();
}catch(error){
  status(`The kitchen could not open. ${reason(error)}`);console.error(error);
  const hint=$('#hint-button');hint.textContent='Try again';hint.addEventListener('click',()=>location.reload());
  for(const opener of document.querySelectorAll<HTMLButtonElement>('#story-button,#recipes-button,#collection-button,[data-options]'))opener.disabled=true;
}
