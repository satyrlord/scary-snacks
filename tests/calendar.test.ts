import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDate, clockMinutes, dateText, dayHours, dayMerges, eveningOpen, firstFreeBoardCell, freeBoardCells, getItem, holidayDecorations, isSunday, looseRaw, requiredQuests, resolveQuests, sourceCell, supperQuest, taskEligibility, ticketNote, unresolvedObstacle, windowView, yearDay } from '../src/model.ts';
import { reduceGame, validateGame } from '../src/engine.ts';
import { calendarProblems, questProblems } from '../src/content.ts';
import { exportSave, importSave } from '../src/storage.ts';
import type { GameData, GameState } from '../src/model.ts';
import { moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, addOpenLayout, checkpoint, data, deliver, know, openGame, quest, ready, rejected, status, supply, validate } from './support.ts';

addOpenLayout();
/** The day of act 1 of a date of year 1. */
const day = (date: number, month: number) => yearDay(month, date) - data.calendar.start + 1;
/** A copy on a later morning, after quiet nights. */
const on = (state: GameState, target: number) => { const next = structuredClone(state); moveTo(next, target, data); return next; };
/** A copy one merge before the closing of its day. */
const lateEvening = (state: GameState): GameState => ({ ...structuredClone(state), clock: { ...state.clock, merges: dayMerges(state.clock.day, data) - 1 } });
/** A copy with these dishes in these cells. */
function withBoard(state: GameState, cells: [number, string | null][]): GameState {
  const next = structuredClone(state);
  for (const [index, code] of cells) {
    next.board[index] = code ? { code } : null;
    if (code) know(next, code);
  }
  return next;
}
/** Closes the day with the merge of two Flours in cells 13 and 14. */
const closeDay = (state: GameState) => act(lateEvening(withBoard(state, [[13, 'grain_1'], [14, 'grain_1']])), { type: 'move', from: 13, to: 14 });

test('act 1 runs from Saturday 15 February to Thursday 1 May, with 76 days and 11 Sundays', () => {
  assert.deepEqual(calendarDate(1, data), { year: 1, month: 2, date: 15, weekday: 6 });
  assert.deepEqual(calendarDate(data.calendar.supper, data), { year: 1, month: 5, date: 1, weekday: 4 });
  assert.equal(data.calendar.supper, 76);
  assert.equal([...Array(76).keys()].filter(index => isSunday(index + 1, data)).length, 11);
  assert.equal(dateText(1, data, 'short'), 'Sat 15 Feb');
  assert.equal(dateText(1, data), 'Saturday 15 February');
  assert.equal(dateText(76, data, 'plain'), '1 May');
  // The prologue of year 0 has the same calendar: 20 December is a Friday.
  assert.deepEqual(calendarDate(day(15, 2) - 57, data), { year: 0, month: 12, date: 20, weekday: 5 });
});

test('a Sunday opens at 10:00 and closes at 17:00 with no booking time, and a weekday holds 60 merges', () => {
  assert.deepEqual(dayHours(1, data), { opening: 420, closing: 1320, booking: 1200 });
  assert.deepEqual(dayHours(2, data), { opening: 600, closing: 1020, booking: null });
  assert.equal(dayMerges(1, data), 60);
  assert.equal(dayMerges(2, data), 28);
  assert.equal(eveningOpen(2, data), false);
  assert.equal(eveningOpen(3, data), true);
  // No booked guest dines on Saint George's Eve or on the day of the supper.
  assert.equal(eveningOpen(day(22, 4), data), false);
  assert.equal(eveningOpen(data.calendar.supper, data), false);
});

test('a weekday closing pays the upkeep without a rat, and the Saturday closing leads to 10:00 on Sunday', () => {
  const before = { ...openGame(), coins: 30, seed: 9 };
  const closed = closeDay(before);
  assert.deepEqual(closed.clock, { day: 2, merges: 0 });
  assert.equal(clockMinutes(closed, data), 600);
  assert.equal(closed.coins, 30 - data.day.upkeep);
  assert.equal(closed.seed, 9, 'A closing without a rat uses no random number.');
  assert.deepEqual(closed.night, { day: 1, upkeep: data.day.upkeep, rat: null, taken: [], trapped: null, gift: null, departed: [], purse: closed.coins, seen: true });
  assert.equal(closed.board[22]?.code, 'corn_1', 'The loose Corn stays on the board.');
  assert.deepEqual(closed.ratHoles, []);
  rejected(closed, { type: 'seeNight' });
  // The Sunday closing brings the thief rat for the loose Corn, and Monday opens at 07:00.
  const sunday = closeDay(closed);
  assert.equal(sunday.night!.rat, 'thief');
  assert.equal(sunday.night!.seen, false);
  assert.deepEqual(sunday.ratHoles, [{ item: 'corn_1', position: 22 }]);
  assert.equal(clockMinutes(sunday, data), 420);
  assert.notEqual(sunday.seed, 9);
});

test('a save rejects a rat on a weekday night, a weekday report that waits, and a Sunday night without a rat', () => {
  const closed = closeDay(openGame()), sunday = closeDay(closed);
  for (const state of [closed, sunday]) assert.deepEqual(importSave(exportSave(state, validate), validate), state);
  const corruptions: ((state: any) => void)[] = [
    state => { state.night.rat = 'soricescu'; state.night.seen = false; }, state => { state.night.seen = false; }, state => { state.night.departed = ['grain']; },
    state => { delete state.night.departed; }, state => { state.clock.day = 77; }, state => { state.evening = { guest: 'vlad', last: null, delivered: false }; },
  ];
  for (const corrupt of corruptions) {
    const state = structuredClone(closed);
    corrupt(state);
    assert.equal(validateGame(state, data), false, String(corrupt));
  }
  const ratless = structuredClone(sunday) as any;
  ratless.night = { ...ratless.night, rat: null, taken: [], trapped: null, seen: true };
  assert.equal(validateGame(ratless, data), false, 'A Sunday night always has a rat.');
});

test('the first preparation of a chapter waits for the opening date of its chapter, and Story names the date', () => {
  const state = ready(checkpoint(4));
  assert.ok(state.clock.day >= data.chapters[1].opens);
  const early = { ...state, clock: { day: data.chapters[1].opens - 1, merges: 0 } };
  const eligibility = taskEligibility(early, data);
  assert.equal(eligibility.ready, false);
  assert.deepEqual(eligibility.requirements.find(requirement => requirement.kind === 'date'), { kind: 'date', day: data.chapters[1].opens, met: false });
  assert.match(rejected(early, { type: 'task' }).message, /opens on Thursday 27 February/);
  assert.equal(taskEligibility(state, data).ready, true);
  // A later preparation of the chapter has no date.
  assert.equal(taskEligibility(ready(checkpoint(5)), data).requirements.some(requirement => requirement.kind === 'date'), false);
});

test('a save rejects a paid preparation before the opening date of its chapter', () => {
  const paid = act(ready(checkpoint(12)), { type: 'task' });
  assert.equal(paid.clock.day, data.chapters[3].opens);
  assert.deepEqual(importSave(exportSave(paid, validate), validate), paid);
  const early = structuredClone(paid);
  early.clock.day--;
  early.night!.day--;
  assert.equal(validateGame(early, data), false);
  const envelope = JSON.parse(exportSave(paid, validate));
  envelope.state = early;
  assert.throws(() => importSave(JSON.stringify(envelope), validate), /damaged or unknown/);
});

test('a save rejects a served supper before 1 May or before its booking time', () => {
  const served = deliver(checkpoint(data.tasks.length), supperQuest(data)!.id);
  assert.equal(served.clock.day, data.calendar.supper);
  assert.equal(clockMinutes(served, data), data.day.booking);
  assert.deepEqual(importSave(exportSave(served, validate), validate), served);
  for (const [day, merges] of [[data.calendar.supper - 1, served.clock.merges], [data.calendar.supper, served.clock.merges - 1]]) {
    const early = structuredClone(served);
    early.clock = { day, merges };
    early.night!.day = day - 1;
    assert.equal(validateGame(early, data), false);
    const envelope = JSON.parse(exportSave(served, validate));
    envelope.state = early;
    assert.throws(() => importSave(JSON.stringify(envelope), validate), /damaged or unknown/);
  }
});

test('a dated quest opens on its date, and a holiday quest delivers from its holiday, late with the same reward', () => {
  const paid = act(ready(checkpoint(2)), { type: 'task' });
  const before = on(paid, day(20, 2)), opening = on(paid, day(21, 2));
  assert.equal(status(before, 'victor-dragobete'), 'locked');
  assert.notEqual(status(opening, 'victor-dragobete'), 'locked');
  const supplied = supply(opening, 'victor-dragobete'), dragobete = quest('victor-dragobete');
  assert.equal(ticketNote(supplied, dragobete, data), 'For Dragobete, Monday 24 February');
  assert.match(rejected(supplied, { type: 'deliverQuest', id: dragobete.id }).message, /For Dragobete, Monday 24 February/);
  const holiday = on(supplied, day(24, 2));
  assert.equal(ticketNote(holiday, dragobete, data), null);
  assert.equal(act(holiday, { type: 'deliverQuest', id: dragobete.id }).coins, holiday.coins + dragobete.reward);
  const late = on(supplied, day(25, 2));
  assert.equal(ticketNote(late, dragobete, data), 'Late for Dragobete');
  assert.equal(act(late, { type: 'deliverQuest', id: dragobete.id }).coins, late.coins + dragobete.reward);
});

test('a dated quest that opens takes a ticket by authored order, and a reload gives the same tickets', () => {
  const paid = act(ready(checkpoint(4)), { type: 'task' }), clean = quest('ilie-clean-monday');
  const before = on(paid, clean.opens! - 1), morning = on(paid, clean.opens!);
  assert.equal(status(before, clean.id), 'locked');
  const open = (state: GameState) => resolveQuests(state, data).filter(view => !view.quest.recovery && (view.status === 'active' || view.status === 'waiting'));
  const views = open(morning);
  assert.deepEqual(views.filter(view => view.status === 'active').map(view => view.quest.id), views.slice(0, 3).map(view => view.quest.id));
  assert.equal(status(morning, clean.id), views.findIndex(view => view.quest === clean) < 3 ? 'active' : 'waiting');
  const reloaded = importSave<GameState>(exportSave(morning, validate), validate);
  assert.deepEqual(open(reloaded).map(view => [view.quest.id, view.status]), views.map(view => [view.quest.id, view.status]));
});

test('a March quest opens only in March, stays open after March, and no preparation needs it', () => {
  const sheepskin = quest('dochia-sheepskin');
  assert.equal(status(on(openGame(), day(28, 2)), sheepskin.id), 'locked');
  const march = on(openGame(), day(1, 3));
  assert.deepEqual(march.march, [sheepskin.id]);
  assert.notEqual(status(march, sheepskin.id), 'locked');
  assert.notEqual(status(on(march, day(2, 4)), sheepskin.id), 'locked', 'An open March quest stays open in April.');
  // A March quest whose prerequisites come only in April does not open.
  assert.equal(status(on(openGame(), day(2, 4)), sheepskin.id), 'locked');
  assert.ok(!requiredQuests(data.tasks.length, data).some(value => value.march));
  assert.ok(data.quests.filter(value => value.character === 'dochia').every(value => value.march));
  const save = structuredClone(march) as any;
  save.march = [];
  assert.equal(validateGame(save, data), false, 'A March quest that opened is recorded.');
});

test('a quest of a later act never opens and never counts as a predecessor', () => {
  const later = data.quests.filter(value => value.act);
  assert.deepEqual(later.map(value => value.id).sort(), ['ana-saint-andrew', 'bran-pumpkins', 'catalina-hail', 'cezar-long-night', 'ilie-pickles', 'ionatan-castle-dinner', 'mina-avram-search', 'sanziana-meadow', 'sanziana-midsummer']);
  assert.deepEqual(later.filter(value => value.act === 4).map(value => value.id).sort(), ['ana-saint-andrew', 'cezar-long-night'], 'The winter quests wait for act 4.');
  const finished = checkpoint(data.tasks.length);
  for (const value of later) assert.equal(status(finished, value.id), 'locked');
  assert.equal(status(checkpoint(5), 'ilie-clean-monday') !== 'locked' || checkpoint(5).completedQuests.includes('ilie-clean-monday'), true, 'Ilie does not wait for his jars for winter.');
});

test('the data check enforces Lent for Ilie and Cătălina, with fish on 25 March and 13 April', () => {
  const changed = (change: (copy: GameData) => void) => { const copy = structuredClone(data); change(copy); return questProblems(copy).join(' '); };
  /** Puts a dish in the first portion of a quest, at its menu value. */
  const serve = (copy: GameData, id: string, item: string) => {
    const changing = copy.quests.find(value => value.id === id)!, first = changing.requirements[0];
    changing.reward += (copy.items[item].price - copy.items[first.item].price) * first.quantity;
    first.item = item;
  };
  assert.deepEqual(questProblems(data), []);
  assert.match(changed(copy => serve(copy, 'ilie-clean-monday', 'dairy_2')), /ilie-clean-monday: breaks a diet/);
  // The first fish of Lent is permitted on its holiday, and not on another day.
  assert.match(changed(copy => { copy.calendar.lent.fish = [copy.calendar.lent.fish[1]]; }), /ilie-annunciation: breaks a diet/);
  assert.match(changed(copy => serve(copy, 'catalina-silent-bells', 'fish_2')), /catalina-silent-bells: breaks a diet/);
  // After Lent, Ilie eats the Easter lamb.
  assert.ok(quest('mara-easter-lunch').companions?.includes('ilie'));
});

test('the calendar checks reject late snow, long April rain, rain on the supper day, and dates outside their chapters', () => {
  const changed = (change: (copy: GameData) => void) => { const copy = structuredClone(data); change(copy); return calendarProblems(copy).join(' '); };
  assert.deepEqual(calendarProblems(data), []);
  assert.match(changed(copy => { copy.calendar.weather[day(15, 3) - 1] = 'snow'; }), /Snow occurs only before 15 March/);
  assert.match(changed(copy => { for (const date of [7, 8, 9]) copy.calendar.weather[day(date, 4) - 1] = 'rain'; }), /at most two days in a row/);
  assert.match(changed(copy => { copy.calendar.weather[75] = 'rain'; }), /terrace days/);
  assert.match(changed(copy => { copy.calendar.weather[day(24, 2) - 1] = 'rain'; }), /dragobete: a holiday has fair weather/);
  assert.match(changed(copy => { copy.chapters[2].opens = copy.chapters[1].opens; }), /chapter dates/);
  assert.match(changed(copy => { copy.quests.find(value => value.id === 'ilie-clean-monday')!.opens = 2; }), /inside the chapter of its preparation/);
  assert.match(changed(copy => { copy.quests.find(value => value.id === 'victor-dragobete')!.opens = 2; }), /at most three days before its holiday/);
  assert.match(changed(copy => { copy.quests.find(value => value.id === 'dochia-lunch')!.opens = day(2, 4); }), /opens in March/);
  assert.match(changed(copy => { copy.quests.find(value => value.id === 'bran-last-bus')!.outdoor = true; copy.quests.find(value => value.id === 'bran-last-bus')!.afterTask = 'task_12'; }), /outdoor quest opens after the courtyard/);
  // The dated graph: a holiday after the closing of 30 April leaves no time for the last preparation.
  assert.match(changed(copy => { copy.calendar.holidays.find(value => value.id === 'blajini')!.day = 76; copy.quests.find(value => value.id === 'mara-blajini')!.opens = 75; }), /last preparation cannot come/);
});

test('the pickle barrel gives free gherkins, leaves at the closing of 20 March, and the forage basket comes the next morning', () => {
  const start = openGame(), barrel = sourceCell(start, 'pickles');
  assert.ok(barrel >= 0);
  const taken = act(start, { type: 'spawn', index: barrel });
  assert.equal(taken.coins, start.coins, 'A take from a seasonal source is free.');
  assert.ok(looseRaw('pickles_1', data), 'Gherkins are a loose raw ingredient.');
  // The quests of the first windows that ask for pickles are delivered.
  const last = on(checkpoint(2), day(20, 3)), closed = closeDay(last);
  assert.equal(sourceCell(closed, 'pickles'), -1);
  assert.deepEqual(closed.night!.departed, ['pickles']);
  const basket = sourceCell(closed, 'greens');
  assert.ok(basket >= 0);
  assert.equal(basket, firstFreeBoardCell({ ...closed, board: closed.board.map((cell, index) => index === basket ? null : cell) }, data));
  assert.ok(closed.discovered.includes('generator_greens'));
  // A save holds at most one source of each chain.
  const free = closed.board.findIndex((cell, index) => !cell && !unresolvedObstacle(closed, index, data));
  assert.equal(validateGame(withBoard(closed, [[free, 'generator_greens']]), data), false);
});

test('the forage basket waits for room, keeps four free cells, and comes with a later action', () => {
  const crowded = on(checkpoint(2), day(20, 3));
  const free = crowded.board.flatMap((cell, index) => !cell && !unresolvedObstacle(crowded, index, data) && index !== 13 && index !== 14 ? [index] : []);
  // The closing frees the cell of the merge and the cell of the barrel, which leaves four free cells.
  const full = withBoard(crowded, free.slice(0, free.length - 2).map(index => [index, 'herbs_4']));
  const closed = closeDay(full);
  assert.equal(freeBoardCells(closed, data), 4);
  assert.equal(sourceCell(closed, 'greens'), -1, 'The basket waits.');
  // A merge frees a cell, so the basket comes, and four cells stay free.
  const merged = act(withBoard(closed, [[free[0], 'grain_2']]), { type: 'move', from: 14, to: free[0] });
  assert.ok(sourceCell(merged, 'greens') >= 0);
  assert.equal(freeBoardCells(merged, data), 4);
});

test('the open pickle quest of Ana keeps the barrel after its season, through a reload, until the next closing after its delivery', () => {
  // Preparation 3 needs Ana's mittens, so the checkpoint has delivered them.
  const opened = act(ready(checkpoint(2)), { type: 'task' });
  assert.ok(opened.completedQuests.includes('ana-mittens'));
  const late = { ...on(opened, day(20, 3)), repeating: { last: null, open: 'ana-pickles' } };
  know(late, ...quest('ana-pickles').requirements.map(({ item }) => item));
  assert.equal(validateGame(late, data), true);
  const kept = closeDay(late);
  assert.ok(sourceCell(kept, 'pickles') >= 0);
  assert.deepEqual(kept.night!.departed, []);
  const reloaded = importSave<GameState>(exportSave(kept, validate), validate);
  assert.deepEqual(reloaded, kept);
  // The open campaign quests hold the tickets, so the delivery is written into the save: the cycle moves on.
  const delivered = { ...reloaded, repeating: { last: 'ana-pickles', open: null } };
  assert.equal(validateGame(delivered, data), true);
  assert.ok(sourceCell(delivered, 'pickles') >= 0);
  const left = closeDay(delivered);
  assert.equal(sourceCell(left, 'pickles'), -1);
  assert.deepEqual(left.night!.departed, ['pickles']);
});

test('an outdoor quest waits for a terrace day: fair weather from 1 April', () => {
  const paid = act(ready(checkpoint(12)), { type: 'task' }), path = quest('sorin-path');
  assert.ok(path.outdoor && quest('ilie-courtyard').outdoor && supperQuest(data)!.outdoor);
  const march = supply(paid, path.id);
  assert.equal(ticketNote(march, path, data), 'Waits for fair weather');
  assert.match(rejected(march, { type: 'deliverQuest', id: path.id }).message, /courtyard/);
  const rain = on(march, day(4, 4));
  assert.equal(data.calendar.weather[rain.clock.day - 1], 'rain');
  rejected(rain, { type: 'deliverQuest', id: path.id });
  const fair = on(march, day(5, 4));
  assert.equal(ticketNote(fair, path, data), null);
  act(fair, { type: 'deliverQuest', id: path.id });
});

test('30 April holds until the last preparation, its payment closes the day, and 1 May holds until the supper at 20:00', () => {
  const eve = on(checkpoint(data.tasks.length - 1), data.calendar.supper - 1), supper = supperQuest(data)!;
  const held = act(lateEvening(withBoard(eve, [[13, 'grain_1'], [14, 'grain_1']])), { type: 'move', from: 13, to: 14 });
  assert.deepEqual(held.clock, { day: eve.clock.day, merges: dayMerges(eve.clock.day, data) - 1 });
  const again = act(withBoard(held, [[13, 'grain_1'], [14, 'grain_1']]), { type: 'move', from: 13, to: 14 });
  assert.deepEqual(again.clock, held.clock, 'Later merges do not move the clock.');
  assert.equal(again.coins, held.coins, 'A day that holds has no upkeep.');
  assert.equal(reduceGame(withBoard(held, [[13, 'grain_1'], [14, 'grain_1']]), { type: 'move', from: 13, to: 14 }, data).message.includes('Walpurgis Night lasts until the bistro is ready.'), true);
  const paid = act(ready(held), { type: 'task' });
  assert.deepEqual(paid.clock, { day: data.calendar.supper, merges: 0 });
  assert.equal(paid.night!.day, data.calendar.supper - 1);
  // The supper waits for its evening, and the day holds until it is served.
  const plates = supply(paid, supper.id);
  assert.equal(ticketNote(plates, supper, data), 'Booked for 20:00');
  assert.equal(ticketNote(supply(eve, supper.id), supper, data), 'Booked for 1 May');
  rejected(plates, { type: 'deliverQuest', id: supper.id });
  const waiting = act(lateEvening(withBoard(plates, [[13, 'grain_1'], [14, 'grain_1']])), { type: 'move', from: 13, to: 14 });
  assert.equal(waiting.clock.day, data.calendar.supper);
  const lit = act(plates, { type: 'lantern', id: supper.id });
  assert.equal(clockMinutes(lit, data), data.day.booking);
  const served = act(lit, { type: 'deliverQuest', id: supper.id });
  assert.deepEqual(served.act1, { purse: served.coins });
});

test('while 30 April holds, each booked delivery ends its evening, and the next booked guest comes at once', () => {
  // A slow game: preparation 8 is paid, and the three booked quests of its window are open.
  const booked = ['vlad-after-dark', 'elisabeta-papers', 'vlad-guest'];
  const slow = on({ ...checkpoint(8), completedQuests: checkpoint(8).completedQuests.filter(id => !booked.includes(id)), coins: 0 }, data.calendar.supper - 1);
  let state = lateEvening(slow);
  for (const id of booked) state = supply(state, id);
  state = act(withBoard(state, [[13, 'grain_1'], [14, 'grain_1']]), { type: 'move', from: 13, to: 14 });
  assert.equal(state.evening.guest, 'vlad');
  state = act(state, { type: 'deliverQuest', id: 'vlad-after-dark' });
  assert.deepEqual(state.evening, { guest: 'elisabeta', last: 'vlad', delivered: false });
  state = act(state, { type: 'deliverQuest', id: 'elisabeta-papers' });
  assert.deepEqual(state.evening, { guest: 'vlad', last: 'elisabeta', delivered: false });
  state = act(state, { type: 'deliverQuest', id: 'vlad-guest' });
  assert.equal(state.clock.day, data.calendar.supper - 1);
});

test('the window view and the holiday decorations follow the date', () => {
  assert.equal(windowView(1, data).id, 'window-view-late-winter');
  assert.equal(windowView(day(10, 3), data).id, 'window-view-early-spring');
  assert.equal(windowView(day(6, 4), data).id, 'window-view-spring');
  assert.deepEqual(holidayDecorations(day(1, 3), 'front-room', data).map(value => value.id), ['martisor']);
  assert.deepEqual(holidayDecorations(day(10, 3), 'front-room', data), []);
  assert.deepEqual(holidayDecorations(day(17, 4), 'front-room', data).map(value => value.id), ['catkins', 'red-eggs']);
  assert.deepEqual(holidayDecorations(76, 'courtyard', data).map(value => value.id), ['green-branches']);
});

test('the new holiday dishes are mixed dishes on the breads atlas', () => {
  for (const [name, cell] of [['Mucenici', 4], ['Pască', 5], ['Red eggs', 6], ['Colivă', 7]] as const) {
    const item = Object.values(data.items).find(value => value.name === name)!;
    assert.deepEqual([item.art.atlas, item.art.cell, !!item.recipe], ['breads', cell, true], name);
  }
  assert.equal(getItem('generator_pickles', data)!.generator!.free, true);
  assert.equal(getItem('generator_greens', data)!.generator!.free, true);
});
