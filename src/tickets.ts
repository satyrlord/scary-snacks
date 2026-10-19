// The quest tickets on the drawer: who asks for which dishes, the delivery and its flight, and the quest dialog.
import { canDeliverQuest, questDeliveryCells, resolveQuests, unresolvedObstacle } from './model.ts';
import type { Quest } from './model.ts';
import { $, button, coinText, count, element, names } from './dom.ts';
import { coinMark, food, portrait, questSketch } from './art.ts';
import { modal, showModal } from './dialog.ts';
import { showItem } from './dishes.ts';
import { batFlight } from './room.ts';
import { apply, changeGame, character, data, itemName, onReplace, saveFailed, state } from './session.ts';
import { onMotionResume, still } from './preferences.ts';
import { showScene } from './story.ts';

// The delivery timeline: the dishes land on the ticket, a notice reports the reward, and the next quest arrives in the same place.
// RISE_AT sets the arrival delay in style.css; ARRIVAL_MS covers the arrival.
const FLIGHT_MS = 600, RISE_AT = 700, ARRIVAL_MS = 1300;
const TOAST_MS = 4200, REPLY_MS = 8000, TOAST_OUT_MS = 300;
const toastStack = $('#toast-stack');
// The time at which each ticket slot took a new quest, so its arrival survives renders.
const arriving: number[] = [];
// A delivery notice belongs to the game that made it.
let deliveryToken = 0;
// Recurring deliveries have no saved record. Their share of the bat cadence lasts for this game in this tab.
let recurringDeliveries = 0;
/** The quest on each ticket. A quest keeps its ticket, and the next open quest takes the first free ticket, in authored order. */
let ticketQuests: string[] = [];
onReplace(() => {
  deliveryToken++; recurringDeliveries = 0; arriving.fill(0); ticketQuests = [];
  for (const flight of document.querySelectorAll('.deliver-flight')) flight.remove();
  toastStack.replaceChildren();
});
onMotionResume(() => {
  arriving.fill(0);
  for(const notice of toastStack.children)notice.classList.remove('entering');
  for(const card of document.querySelectorAll('.ticket'))card.classList.remove('arriving');
});

/**
 * A short notice that reports itself and clears on its own: used where the game should not stop for a tap.
 * A notice with a reply to read stays longer, and it waits while the pointer or focus is on it.
 */
function toast(text: string, reply?: { label: string; read: () => void }) {
  const note = element('div', still() ? 'toast' : 'toast entering'); note.setAttribute('aria-atomic', 'true');
  note.append(element('p', 'toast-text', text));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const leave = () => { note.classList.add('leaving'); setTimeout(() => note.remove(), still() ? 0 : TOAST_OUT_MS); };
  const wait = (time: number) => { clearTimeout(timer); timer = setTimeout(leave, time); };
  if (reply) {
    note.append(button(reply.label, 'text-button toast-reply', () => { clearTimeout(timer); note.remove(); reply.read(); }));
    const hold = () => clearTimeout(timer), resume = () => { if (!note.matches(':hover,:focus-within')) wait(TOAST_MS); };
    note.addEventListener('pointerenter', hold); note.addEventListener('focusin', hold);
    note.addEventListener('pointerleave', resume); note.addEventListener('focusout', () => setTimeout(resume));
  }
  toastStack.append(note); wait(reply ? REPLY_MS : TOAST_MS);
}
export const activeQuests = () => {
  const open = resolveQuests(state, data).filter(view => view.status === 'active').map(view => view.quest);
  const waiting = open.filter(quest => !ticketQuests.includes(quest.id));
  const kept = ticketQuests.map(id => open.find(quest => quest.id === id) ?? waiting.shift()).filter(quest => quest !== undefined);
  const tickets = [...kept, ...waiting]; ticketQuests = tickets.map(quest => quest.id); return tickets;
};
/** The portions of a quest that the board holds now, at most the quantity that it needs. */
const onBoard = (code: string, quantity: number) => Math.min(quantity, state.board.filter((cell, index) => cell?.code === code && !unresolvedObstacle(state, index, data)).length);
/** Each quest on the counter is a paper ticket on the drawer: who asks, the quest title, the dishes with their counts, and Deliver. */
export function renderTickets() {
  const container = $('#tickets'); container.replaceChildren();
  activeQuests().forEach((quest, slot) => {
    const person = character(quest.character), ready = canDeliverQuest(state, quest, data);
    const card = element('article', 'ticket');
    card.setAttribute('aria-label', `${person.name}’s quest: ${quest.title}`);
    card.dataset.quest = quest.id;
    // A ticket that has just taken a delivered quest's place arrives in the same slot; the delay survives renders.
    const since = arriving[slot] ? performance.now() - arriving[slot] : Infinity;
    if (since < ARRIVAL_MS) { card.classList.add('arriving'); card.style.setProperty('--rise-delay', `${RISE_AT - Math.round(since)}ms`); }
    const labels = quest.cost ? [`costs ${coinText(quest.cost)}, ${coinText(state.coins)} in the purse`]
      : quest.requirements.map(({ item, quantity }) => `${quantity} ${itemName(item)}, ${onBoard(item, quantity)} on the board`);
    // The face of the ticket is one target that opens the quest: the portrait, the name and title, and the dishes.
    const face = button('', 'ticket-face', () => showQuest(quest)), picture = portrait(person.id), words = element('span', 'ticket-words');
    face.setAttribute('aria-label', `${quest.title}: ${labels.join('; ')}`);
    words.append(element('span', 'ticket-name', person.name), element('span', 'ticket-title', quest.title));
    const dishes = element('span', `ticket-items${quest.requirements.length > 2 ? ' many' : ''}`);
    for (const { item, quantity } of quest.requirements) {
      const value = element('span', `ticket-item ${onBoard(item, quantity) === quantity ? 'ready' : ''}`);
      value.append(food(item));
      if (quantity > 1) value.append(element('span', 'ticket-count', `${onBoard(item, quantity)}/${quantity}`));
      dishes.append(value);
    }
    // The supper costs coins instead of dishes.
    if (quest.cost) { const value = element('span', 'ticket-item'); value.append(coinMark()); dishes.append(value); }
    face.append(picture, words, dishes);
    // Phones show the reward alone until the quest can be delivered, and then the word alone, so three tickets fit the drawer's handle.
    const deliverButton = button('', 'primary-button deliver-button', () => deliver(quest));
    deliverButton.append(element('span', 'deliver-word', quest.cost ? 'Pay' : 'Deliver'), element('span', 'deliver-dot', ' · '), element('span', 'deliver-reward', count.format(quest.cost ?? quest.reward)), coinMark());
    deliverButton.disabled = !ready;
    deliverButton.setAttribute('aria-label', quest.cost ? `Pay ${coinText(quest.cost)} for ${quest.title}` : `Deliver ${quest.title} to ${person.name} for ${coinText(quest.reward)}`);
    card.append(face, deliverButton); container.append(card);
  });
  if (!container.childElementCount) container.append(element('p', 'tickets-empty', state.taskIndex === data.tasks.length ? 'Every quest is delivered. The bistro is yours.' : 'No quests wait now. Pay for the next preparation.'));
}
/**
 * The dishes land on the ticket, a notice reports the reward, and the next quest takes the ticket's place.
 * The completion scene waits in Story. After a failed save, the notice says so, and Options offers Retry save.
 * The payment of the supper opens the finale at once.
 */
function deliver(quest: Quest) { return changeGame(() => {
  const slot = activeQuests().indexOf(quest);
  const card = $('#tickets').children[slot] as HTMLElement | undefined;
  const cells = questDeliveryCells(state, quest, data), from = cells.filter(index => index >= 0).map(index => $(`[data-cell="${index}"]`).getBoundingClientRect());
  const codes = quest.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item));
  const into = card?.getBoundingClientRect();
  arriving[slot] = performance.now();
  const result = apply({ type:'deliverQuest', id:quest.id });
  if (!result.ok) { arriving[slot] = 0; renderTickets(); return; }
  if (quest.repeat) recurringDeliveries++;
  if ((state.completedQuests.length + recurringDeliveries) % 3 === 0) batFlight();
  const message = `${result.message}${saveFailed ? ' This session is not saved. Use Retry save in Options, or export before leaving.' : ''}`;
  // The reply of the neighbour waits in Story; the notice offers it at once, by name.
  const who = names.format([quest.character, ...quest.companions ?? []].map(id => character(id).name));
  const reply = state.pendingScenes.includes(quest.id) ? { label: `Read ${who}’s reply`, read: () => showScene(quest.id) } : undefined;
  const token = deliveryToken;
  const notify = () => { if (token === deliveryToken) toast(message, reply); };
  if (quest.cost) { notify(); showScene(data.finale.id); }
  else if (still() || !into) notify(); else void fly(codes, from, into).then(notify);
}); }
/** Delivered dishes lift off their tiles, arc over the board and land on the neighbour's ticket, visible all the way. */
function fly(codes: string[], from: DOMRect[], target: DOMRect) {
  return Promise.all(from.map((start, index) => {
    const size = Math.min(start.width, start.height), ghost = food(codes[index], 'deliver-flight');
    ghost.style.left = `${start.left}px`; ghost.style.top = `${start.top}px`; ghost.style.width = ghost.style.height = `${size}px`;
    document.body.append(ghost);
    const dx = target.left + target.width / 2 - (start.left + size / 2), dy = target.top + target.height / 2 - (start.top + size / 2);
    const landed = Math.min(.6, target.height / size);
    return ghost.animate([
      { transform: 'translate(0, 0) scale(1)', easing: 'cubic-bezier(.3,0,.2,1)' },
      { transform: `translate(${dx * .45}px, ${dy * .55 - 40}px) scale(.85)`, offset: .45, easing: 'cubic-bezier(.4,0,.2,1)' },
      { transform: `translate(${dx}px, ${dy}px) scale(${landed})`, opacity: 1, offset: .88 },
      { transform: `translate(${dx}px, ${dy}px) scale(${landed * .9})`, opacity: 0 },
    ], { duration: FLIGHT_MS, delay: Math.min(index, 5) * 60, fill: 'both' }).finished.finally(() => ghost.remove());
  }));
}
/** A quest on a ticket: who asks and why, each dish with the count on the board, the reward, and Deliver. Each dish opens its help. */
function showQuest(quest: Quest) {
  const content=element('div','quest-view quest-page-content'),people=[quest.character,...quest.companions??[]],head=element('div','quest-heading'),words=element('div');
  words.append(element('p','quest-person',names.format(people.map(id=>character(id).name))));
  for(const id of people)head.append(portrait(id));
  head.append(words);content.append(head);
  // An exchange names the speaker at each change of turn. Screen readers also hear a colon after the name.
  const turns=element('div','quest-lines'),exchange=people.length>1||quest.opening.some(line=>line.speaker!==quest.character);
  for(const [at,line] of quest.opening.entries()){
    const turn=element('p','quest-line');
    if(exchange&&line.speaker!==quest.opening[at-1]?.speaker){const name=element('span','quest-speaker',character(line.speaker).name);name.append(element('span','visually-hidden',': '));turn.append(name);}
    turn.append(line.text);turns.append(turn);
  }
  const page=element('div','quest-reading');
  page.append(questSketch(quest.character,quest.id),turns);content.append(page);
  const requirements=element('ul','quest-requirements');
  for(const {item,quantity} of quest.requirements){
    const have=onBoard(item,quantity),row=element('li'),inspect=button('','quest-item',()=>showItem(item,()=>showQuest(quest)));
    inspect.setAttribute('aria-label',`${quantity} ${itemName(item)}: ${have} of ${quantity} on the board`);
    inspect.append(food(item),element('span','',`${quantity} ${itemName(item)}`),element('span','quest-count',`${have} / ${quantity} on board`));row.append(inspect);requirements.append(row);
  }
  const deliverButton=button(`${quest.cost?'Pay':'Deliver'} · ${count.format(quest.cost??quest.reward)}`,'primary-button quest-deliver',()=>{modal.close();void deliver(quest);});
  deliverButton.append(coinMark());deliverButton.setAttribute('aria-label',quest.cost?`Pay ${coinText(quest.cost)} for ${quest.title}`:`Deliver ${quest.title} for ${coinText(quest.reward)}`);deliverButton.disabled=!canDeliverQuest(state,quest,data);
  const actions=element('div','quest-actions');actions.append(deliverButton);
  // The supper costs coins and no dishes. A recurring quest returns until the coins cover the supper.
  if(quest.cost)content.append(element('p','quest-reward',`Cost: ${coinText(quest.cost)}. In the purse: ${coinText(state.coins)}.`),actions,element('p','quest-note','The payment uses coins, not dishes. There is no deadline.'));
  else content.append(requirements,element('p','quest-reward',`Reward: ${coinText(quest.reward)}`),actions,element('p','quest-note',quest.repeat?'This quest returns until the purse holds enough for the supper.':'Delivery uses dishes on the board. There is no deadline.'));
  showModal(quest.title,content);
}
