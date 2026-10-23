// The quest tickets on the drawer: who asks for which dishes, the delivery and its flight, and the quest dialog.
import { awaitsLanterns, bookedTonight, canDeliverQuest, canLightLanterns, cellsOf, clockText, dateText, laterDay, levers, prologueScenes, QUEST_TICKETS, questDeliveryCells, questEvent, questFinale, questHoliday, questReward, resolveQuests, ticketNote } from './model.ts';
import { PIPER_NIGHTS } from './engine.ts';
import { guidanceGoal, guidanceStep, showItem, showMissingStep } from './dishes.ts';
import type { GameState, Quest } from './model.ts';
import { $, button, coinText, count, element, names } from './dom.ts';
import { coinMark, food, lanternMark, moonMark, portrait, questSketch } from './art.ts';
import { modal, showModal } from './dialog.ts';
import { batFlight, showFinaleRoom } from './room.ts';
import { act, apply, changeGame, character, data, itemName, onReplace, saveFailed, state } from './session.ts';
import { onMotionResume, still } from './preferences.ts';
import { showScene } from './story.ts';

// The delivery timeline: the dishes land on the ticket, a notice reports the reward, and the next quest arrives in the same place.
// RISE_AT sets the arrival delay in style.css; ARRIVAL_MS covers the arrival.
const FLIGHT_MS = 600, RISE_AT = 700, ARRIVAL_MS = 1300;
const TOAST_MS = 4200, REPLY_MS = 8000, TOAST_OUT_MS = 300;
const toastStack = $('#toast-stack');
// The time at which each quest took a ticket in a delivery, so its arrival survives renders. A ticket that only moves up does not arrive.
const arriving = new Map<string, number>();
// The delivery in progress: its quest, time, and earlier state. A refused delivery keeps that state and has no arrival.
let delivery: { id: string; at: number; before: GameState } | null = null;
// A delivery notice belongs to the game that made it.
let deliveryToken = 0;
// Recovery and repeating deliveries have no saved record. Their share of the bat cadence lasts for this game in this tab.
let recurringDeliveries = 0;
/** The quest on each ticket. A quest keeps its ticket, and the next open quest takes the first free ticket, in authored order. */
let ticketQuests: string[] = [];
/** Every quest on the counter: the quest tickets, and the recovery ticket. */
let shownQuests: string[] = [];
onReplace(() => {
  deliveryToken++; recurringDeliveries = 0; arriving.clear(); ticketQuests = []; shownQuests = [];
  for (const flight of document.querySelectorAll('.deliver-flight')) flight.remove();
  toastStack.replaceChildren();
});
onMotionResume(() => {
  arriving.clear();
  for(const notice of toastStack.children)notice.classList.remove('entering');
  for(const card of document.querySelectorAll('.ticket'))card.classList.remove('arriving');
});

/**
 * A short notice that reports itself and clears on its own: used where the game should not stop for a tap.
 * A notice with a reply to read stays longer, and it waits while the pointer or focus is on it.
 */
export function toast(text: string, reply?: { label: string; read: () => void }, duration = reply ? REPLY_MS : TOAST_MS) {
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
  toastStack.append(note); wait(duration);
}
export const activeQuests = () => {
  const active = resolveQuests(state, data).filter(view => view.status === 'active').map(view => view.quest);
  const open = active.filter(quest => !quest.recovery), waiting = open.filter(quest => !ticketQuests.includes(quest.id));
  const kept = ticketQuests.map(id => open.find(quest => quest.id === id) ?? waiting.shift()).filter(quest => quest !== undefined);
  const tickets = [...kept, ...waiting];
  // The recovery quest has its own ticket after the quest tickets, so it never moves a quest to waiting.
  const shown = [...tickets, ...active.filter(quest => quest.recovery)];
  // A quest that takes a ticket in a delivery arrives on it. So does a delivered quest that opens again: the recovery quest, or a repeating quest.
  if (delivery && state !== delivery.before) for (const quest of shown) if (quest.id === delivery.id || !shownQuests.includes(quest.id)) arriving.set(quest.id, delivery.at);
  ticketQuests = tickets.map(quest => quest.id); shownQuests = shown.map(quest => quest.id);
  return shown;
};
/** The supper and the event quests of the prologue pay nothing, so their tickets serve. */
const serves = (quest: Quest) => !!quest.finale || !!quest.piper || questEvent(quest, data) > 0;
/** The meal of a finale quest in words: "the supper" or "the feast". */
const finaleMeal = (quest: Quest) => questFinale(quest, data)!.painting.title.replace(/^The /, 'the ');
/** The portions of a quest that the board holds now, at most the quantity that it needs. */
const onBoard = (code: string, quantity: number) => Math.min(quantity, cellsOf(state, code).length);
/** Each quest on the counter is a paper ticket on the drawer: who asks, the quest title, the dishes with their counts, and Deliver. */
export function renderTickets() {
  const container = $('#tickets'); container.replaceChildren();
  const guided = guidanceStep(), goal = guidanceGoal(), tickets = activeQuests();
  const recovery = tickets.some(quest => quest.recovery);
  container.style.setProperty('--tickets', String(QUEST_TICKETS + Number(recovery)));
  tickets.forEach(quest => {
    const person = character(quest.character), ready = canDeliverQuest(state, quest, data);
    const card = element('article', `ticket${quest.recovery ? ' recovery-ticket' : ''}`);
    card.setAttribute('aria-label', `${person.name}’s quest: ${quest.title}`);
    card.dataset.quest = quest.id;
    // A quest that has just taken a delivered quest's ticket arrives on it; the delay survives renders.
    const at = arriving.get(quest.id), since = at === undefined ? Infinity : performance.now() - at;
    if (since < ARRIVAL_MS) { card.classList.add('arriving'); card.style.setProperty('--rise-delay', `${RISE_AT - Math.round(since)}ms`); }
    else arriving.delete(quest.id);
    const labels = quest.requirements.map(({ item, quantity }) => `${quantity} ${itemName(item)}, ${onBoard(item, quantity)} on the board`);
    // The face of the ticket is one target that opens the quest: the portrait, the name and title, and the dishes.
    const face = button('', 'ticket-face', () => showQuest(quest)), picture = portrait(person.id), words = element('span', 'ticket-words');
    face.setAttribute('aria-label', `${quest.title}: ${labels.join('; ')}`);
    // A ticket that waits for its time gives the time in the place of the title, which the face and the dialog still name: the
    // evening of a booking, the holiday, the supper day, or the weather.
    const booking = ticketNote(state, quest, data);
    words.append(element('span', 'ticket-name', person.name), booking ? element('span', 'ticket-title ticket-booking', booking) : element('span', 'ticket-title', quest.title));
    if (booking) face.setAttribute('aria-label', `${face.getAttribute('aria-label')}. ${booking}`);
    // A long order, such as the supper, shows its first dishes and the count of the others; its dialog lists every plate.
    const shown = quest.requirements.length > 4 ? quest.requirements.slice(0, 3) : quest.requirements;
    const dishes = element('span', `ticket-items${quest.requirements.length > 2 ? ' many' : ''}`);
    for (const { item, quantity } of shown) {
      const value = element('span', `ticket-item ${onBoard(item, quantity) === quantity ? 'ready' : ''}`);
      value.append(food(item));
      value.append(element('span', `ticket-count${quantity === 1 ? ' single-portion' : ''}`, `${onBoard(item, quantity)}/${quantity}`));
      dishes.append(value);
    }
    if (shown.length < quest.requirements.length) dishes.append(element('span', 'ticket-item ticket-more', `+${quest.requirements.length - shown.length}`));
    face.append(picture, words, dishes);
    // Wider screens deliver from the counter. Phone tickets keep their names and counts, and open the dialog to deliver.
    const deliverButton = button('', 'primary-button deliver-button', () => deliver(quest));
    if (guided?.ticket === quest.id) deliverButton.classList.add('guide-target');
    // The supper and the event quests of the prologue pay nothing: their button serves.
    if (serves(quest)) deliverButton.append(element('span', 'deliver-word', 'Serve'));
    else deliverButton.append(element('span', 'deliver-word', 'Deliver'), element('span', 'deliver-dot', ' · '), element('span', 'deliver-reward', count.format(questReward(quest, state, data))), coinMark());
    deliverButton.disabled = !ready;
    deliverButton.setAttribute('aria-label', serves(quest) ? `Serve ${quest.title}` : `Deliver ${quest.title} to ${person.name} for ${coinText(questReward(quest, state, data))}`);
    if (guided?.ticket === quest.id) deliverButton.setAttribute('aria-label', `${deliverButton.getAttribute('aria-label')}. Next step toward ${goal}`);
    card.append(face, waitControl(quest, person.name) ?? deliverButton); container.append(card);
  });
  // The recovery ticket keeps its own column beside the line, so the line still says why no quest waits.
  // Without work, a repeating quest opens, so an empty counter means that the next preparation is ready to pay.
  if (tickets.every(quest => quest.recovery)) container.prepend(state.prologue ? prologueWait() : element('p', 'tickets-empty', 'No quests wait now. Pay for the next preparation.'));
}
/** The prologue waits for its unread scenes after its last dish. The counter names them and opens the first one, so the way to act 1 stays in view. */
function prologueWait() {
  const waiting = state.pendingScenes.length, line = element('div', 'tickets-empty prologue-wait');
  line.append(element('p', '', `Every dish is served. ${waiting === 1 ? 'One scene waits' : `${count.format(waiting)} scenes wait`} before Mara leaves.`),
    button('Read now', 'primary-button', () => showScene(state.pendingScenes[0])));
  return line;
}
/**
 * The control of a ticket that cannot deliver yet: the lanterns for tonight's guest or the supper before the booking time, or Later
 * for a quest of a later day. Null when Deliver serves.
 */
function waitControl(quest: Quest, name: string) {
  const time = clockText(levers(state.clock.day, data).booking);
  if (awaitsLanterns(state, quest, data)) {
    const lantern = button('', 'primary-button deliver-button lantern-button', () => lightLanterns(quest));
    lantern.append(lanternMark(), element('span', 'deliver-word', 'Light the lanterns'));
    lantern.disabled = !canLightLanterns(state, quest, data);
    lantern.setAttribute('aria-label', quest.finale ? `Light the lanterns: ${finaleMeal(quest)} is booked for ${time}` : `Light the lanterns: ${name} is booked for ${time}`);
    return lantern;
  }
  if (!laterDay(state, quest, data)) return null;
  const later = button('', 'primary-button deliver-button later-button', () => {});
  later.append(moonMark(), element('span', 'deliver-word', 'Later'));
  later.disabled = true;
  later.setAttribute('aria-label', `${quest.title}: ${ticketNote(state, quest, data)}`);
  return later;
}
/** The words of the quest dialog about the time of a ticket that waits for it. Null for a ticket that delivers whenever its dishes are on the board. */
function waitText(quest: Quest, name: string) {
  const note = ticketNote(state, quest, data);
  if (!note) return null;
  if (awaitsLanterns(state, quest, data)) return `${note}. When every dish is on the board, light the lanterns, and ${quest.finale ? 'the guests arrive' : `${name} arrives`} at once.`;
  const finale = questFinale(quest, data);
  if (finale) return `${note}. Cook the plates whenever you like. The guests come on ${dateText(finale.day, data)} at ${clockText(levers(finale.day, data).booking)}.`;
  if (quest.booked) return bookedTonight(state, quest) ? `${note}. ${name} is at the table.`
    : `${note}. ${names.format([...new Set(data.quests.filter(value => value.booked && value.evening === undefined).map(value => character(value.character).name))])} never dine on the same evening, and nobody books on a Sunday.`;
  const holiday = questHoliday(quest, data);
  if (holiday && laterDay(state, quest, data)) return `${note}. Cook it whenever you like, and deliver it from that day.`;
  if (holiday) return `${note}. The reward is the same.`;
  return `${note}. The courtyard seats guests on fair days from ${dateText(data.calendar.terrace.from, data, 'plain')}.`;
}
/** The lanterns bring tonight's booked guest at once. The closing, the upkeep, and the night come sooner. */
const lightLanterns = (quest: Quest) => act({ type: 'lantern', id: quest.id });
/**
 * The dishes land on the ticket, a notice reports the reward, and the next quest takes the ticket's place.
 * The completion scene waits in Story. After a failed save, the notice says so, and Options offers Retry save.
 * Serving the supper opens the finale at once.
 */
function deliver(quest: Quest) { return changeGame(() => {
  const card = $('#tickets').querySelector<HTMLElement>(`[data-quest="${quest.id}"]`);
  const cells = questDeliveryCells(state, quest), from = cells.filter(index => index >= 0).map(index => $(`[data-cell="${index}"]`).getBoundingClientRect());
  const codes = quest.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item));
  const into = card?.getBoundingClientRect();
  delivery = { id: quest.id, at: performance.now(), before: state };
  const waiting = state.pendingScenes;
  const result = apply({ type:'deliverQuest', id:quest.id });
  delivery = null;
  if (!result.ok) return;
  if (quest.recovery || quest.repeating) recurringDeliveries++;
  if ((state.completedQuests.length + recurringDeliveries) % 3 === 0) batFlight();
  const message = `${result.message}${saveFailed ? ' This session is not saved. Use Retry save in Options, or export before leaving.' : ''}`;
  // The reply of the neighbour waits in Story; the notice offers it at once, by name.
  const who = names.format([quest.character, ...quest.companions ?? []].map(id => character(id).name));
  const reply = state.pendingScenes.includes(quest.id) ? { label: `Read ${who}’s reply`, read: () => showScene(quest.id) } : undefined;
  const token = deliveryToken;
  // The last delivery of an event earns a scene of the prologue. The first pending one opens at once.
  const scenes = prologueScenes(data), earned = state.pendingScenes.find(id => scenes.some(scene => scene.id === id) && !waiting.includes(id));
  const notify = () => { if (token !== deliveryToken) return; toast(message, reply); if (earned && !modal.open) showScene(state.pendingScenes[0]); };
  if (quest.finale) { showFinaleRoom(); notify(); showScene(quest.finale); }
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
  for(const [at,{item,quantity}] of quest.requirements.entries()){
    // A finale plate names its guest. The plate without a guest is for Mamaia's empty chair.
    const guest=quest.guests?`${quest.guests[at]===null?'Mamaia’s chair':character(quest.guests[at]).name}: `:'';
    const have=onBoard(item,quantity),row=element('li'),inspect=button('','quest-item',()=>showItem(item,()=>showQuest(quest)));
    inspect.setAttribute('aria-label',`${guest}${quantity} ${itemName(item)}: ${have} of ${quantity} on the board`);
    inspect.append(food(item),element('span','',`${guest}${quantity} ${itemName(item)}`),element('span','quest-count',`${have} / ${quantity} on board`));row.append(inspect);
    if(have<quantity){const find=button('Find','text-button quest-find',()=>showMissingStep(item));find.setAttribute('aria-label',`Find the next step for ${itemName(item)} on the board`);row.append(find);}
    requirements.append(row);
  }
  const reward=questReward(quest,state,data);
  const deliverButton=button(serves(quest)?'Serve':`Deliver · ${count.format(reward)}`,'primary-button quest-deliver',()=>{modal.close();void deliver(quest);});
  if(!serves(quest))deliverButton.append(coinMark());
  deliverButton.setAttribute('aria-label',serves(quest)?`Serve ${quest.title}`:`Deliver ${quest.title} for ${coinText(reward)}`);deliverButton.disabled=!canDeliverQuest(state,quest,data);
  // A quest that waits for its time says when, and the lanterns or Later take the place of Deliver.
  const name=character(quest.character).name,wait=waitText(quest,name);
  if(wait)content.append(element('p','quest-booking',wait));
  const control=waitControl(quest,name);
  control?.addEventListener('click',()=>modal.close());
  const actions=element('div','quest-actions');actions.append(control??deliverButton);
  // The supper pays nothing and opens the finale. The recovery quest returns while the purse runs low.
  const pay=quest.finale?`${finaleMeal(quest)[0].toUpperCase()}${finaleMeal(quest).slice(1)} pays nothing. Serving it opens the finale.`
    :quest.piper?`The piper’s fee pays nothing. His tune keeps the thief rats away for ${count.format(PIPER_NIGHTS)} Sunday nights.`
    :serves(quest)?'A family meal pays nothing.':`Reward: ${coinText(reward)}`;
  content.append(requirements,element('p','quest-reward',pay),actions,
    element('p','quest-note',quest.finale?'One plate for each guest, to each one’s taste. There is no deadline.':quest.recovery?'Ana returns while the purse runs low. Herbs from the Herb basket are free.':'Delivery uses dishes on the board. There is no deadline.'));
  showModal(quest.title,content);
}
