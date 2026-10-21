import test from 'node:test';
import assert from 'node:assert/strict';
import { bookedTicket, canDeliverQuest, clockMinutes, dayMerges, freeBoardCells, resolveQuests, unresolvedObstacle } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import { dayProblems } from '../src/content.ts';
import { exportSave, importSave } from '../src/storage.ts';
import type { GameData, GameState } from '../src/model.ts';
import { act, addOpenLayout, checkpoint, data, deliver, openGame, player, ready, rejected, status, supply, validate, know, quest } from './support.ts';

addOpenLayout();
// The open layout: the Windmill at 1, the Corn basket at 4, Flour at 13 and 14, Corn at 22, Elderflowers at 27, the Herb basket at 31, Socată at 32 and 33.
const recovery = data.quests.find(value => value.recovery)!;
/** A copy with these dishes in these cells. */
function withBoard(state: GameState, cells: [number, string | null][]): GameState {
  const next = structuredClone(state);
  for (const [index, code] of cells) {
    next.board[index] = code ? { code } : null;
    if (code && !next.discovered.includes(code)) know(next, code);
  }
  return next;
}
/** A copy one merge before the closing. */
const lateEvening = (state: GameState): GameState => ({ ...structuredClone(state), clock: { ...state.clock, merges: dayMerges(data) - 1 } });
/** Closes the day with the merge of the two Flours. */
const closeDay = (state: GameState) => act(lateEvening(state), { type: 'move', from: 13, to: 14 });
/** Every cell from this list that holds no item gets a cooked dish, which the rats leave alone. */
const crowd = (state: GameState, free: number) => {
  const empty = state.board.flatMap((cell, index) => !cell && !unresolvedObstacle(state, index, data) ? [index] : []);
  return withBoard(state, empty.slice(0, empty.length - free).map(index => [index, 'herbs_4'] as [number, string]));
};
/** A tidy board: no loose raw ingredient except the two Flours that the closing merges. */
const tidy = (state = openGame()) => withBoard(state, [[22, null]]);

test('each successful merge adds the merge time, and other actions and failures leave the clock', () => {
  let state = { ...openGame(), coins: 5 };
  assert.deepEqual(state.clock, { day: 1, merges: 0 });
  assert.equal(clockMinutes(state, data), data.day.opening);
  rejected(state, { type: 'move', from: 0, to: 2 });
  rejected(withBoard(state, [[0, 'herbs_4'], [2, 'herbs_4']]), { type: 'move', from: 0, to: 2 });
  for (const action of [{ type: 'move', from: 22, to: 23 }, { type: 'spawn', index: 31 }, { type: 'spawn', index: 1 }] as const) {
    state = act(state, action);
    assert.equal(state.clock.merges, 0, action.type);
  }
  state = act(state, { type: 'move', from: 13, to: 14 });
  assert.equal(clockMinutes(state, data), data.day.opening + data.day.mergeMinutes);
  const delivered = act(supply({ ...state, coins: 0 }, recovery.id), { type: 'deliverQuest', id: recovery.id });
  assert.deepEqual(delivered.clock, state.clock);
  const paid = act(ready(state), { type: 'task' });
  assert.deepEqual(paid.clock, state.clock);
  assert.equal(dayMerges(data), 150);
});

test('the merge that reaches the closing time pays the upkeep, brings the rat, starts the next day, and records the night in one change', () => {
  const before = lateEvening({ ...openGame(), coins: 25 });
  const result = reduceGame(before, { type: 'move', from: 13, to: 14 }, data);
  assert.equal(result.ok, true);
  assert.equal(result.event, 'merge');
  const state = result.state;
  assert.equal(validateGame(state, data), true);
  assert.equal(state.board[14]?.code, 'grain_2', 'The merge applies first.');
  assert.equal(state.coins, 25 - data.day.upkeep);
  assert.deepEqual(state.clock, { day: 2, merges: 0 });
  // The Corn is the only loose raw ingredient, so the thief rat drops it into a new rat hole.
  assert.deepEqual(state.ratHoles, [{ item: 'corn_1', position: 22 }]);
  assert.deepEqual(state.night, { day: 1, upkeep: data.day.upkeep, rat: 'thief', taken: [], trapped: { item: 'corn_1', position: 22 }, gift: null, purse: 15, seen: false });
  assert.match(result.message, /closes for the night/);
  // The report is seen once.
  const seen = act(state, { type: 'seeNight' });
  assert.equal(seen.night!.seen, true);
  rejected(seen, { type: 'seeNight' });
});

test('with a given seed, the thief rat picks the same loose raw ingredients, at most three, and never a herb, a cooked dish, or a blocked item', () => {
  const board = withBoard(createGame(data, 7), [[2, 'grain_1'], [3, 'corn_1'], [7, 'grain_1'], [8, 'corn_1'], [9, 'herbs_1'], [10, 'grain_3'], [12, 'grain_2']]);
  const close = (seed: number) => reduceGame(lateEvening({ ...board, seed }), { type: 'move', from: 13, to: 14 }, data).state;
  const raw = [2, 3, 7, 8, 22];
  const picks = new Set<string>();
  for (let seed = 1; seed <= 12; seed++) {
    const state = close(seed), night = state.night!;
    assert.deepEqual(close(seed), state, 'The same seed picks the same ingredients.');
    const taken = [...night.taken, night.trapped!].map(value => value.position);
    assert.equal(taken.length, data.day.ratTake);
    assert.ok(taken.every(index => raw.includes(index)), `Seed ${seed} picks only loose raw ingredients.`);
    for (const index of [9, 10, 12]) assert.ok(state.board[index], 'Herbs and cooked dishes stay.');
    assert.equal(state.board[37], null);
    assert.ok(unresolvedObstacle(state, 37, data), 'The blocked Elderflowers stay blocked.');
    assert.notEqual(state.seed, seed, 'The closing advances the seed.');
    picks.add(taken.join());
  }
  assert.ok(picks.size > 1, 'Different seeds pick differently.');
});

test('a closing that exceeds a saved counter limit rejects the whole merge and keeps the accepted save', () => {
  const limit = 1_000_000_000;
  const debt = lateEvening({ ...openGame(), coins: -limit });
  const lastDay = lateEvening(withBoard(closeDay(openGame()), [[13, 'grain_1'], [14, 'grain_1']]));
  lastDay.clock.day = limit;
  lastDay.night!.day = limit - 1;
  const gifts = lateEvening({ ...tidy(), gifts: limit });
  for (const state of [debt, lastDay, gifts]) {
    assert.equal(validateGame(state, data), true, 'The starting save is accepted.');
    assert.deepEqual(importSave(exportSave(state, validate), validate), state);
    rejected(state, { type: 'move', from: 13, to: 14 });
    assert.equal(validateGame(state, data), true, 'The rejected closing keeps a valid save.');
  }
  // Reaching the limits is legal; only crossing them rejects the change.
  assert.equal(closeDay({ ...debt, coins: -limit + data.day.upkeep }).coins, -limit);
  const penultimate = structuredClone(lastDay);
  penultimate.clock.day--;
  penultimate.night!.day--;
  assert.equal(closeDay(penultimate).clock.day, limit);
  assert.equal(closeDay({ ...gifts, gifts: limit - 1 }).gifts, limit);
  assert.equal(closeDay(crowd(gifts, 3)).gifts, limit, 'A closing without a gift does not increase the gift counter.');
});

test('a closing with Șoricescu and a failed action leave the seed, and a reload, an export, and an import keep it', () => {
  const state = tidy({ ...openGame(), seed: 99 });
  rejected(state, { type: 'move', from: 0, to: 2 });
  const closed = closeDay(state);
  assert.equal(closed.night!.rat, 'soricescu');
  assert.equal(closed.seed, 99);
  assert.deepEqual(importSave(exportSave(closed, validate), validate), closed);
});

test('the first pick drops into a rat hole, three open rat holes take no fourth, and a matching merge clears a rat hole for the blocker coin', () => {
  const holes: GameState['ratHoles'] = [{ item: 'grain_1', position: 0 }, { item: 'corn_1', position: 2 }, { item: 'grain_1', position: 3 }];
  const full = withBoard({ ...openGame(), ratHoles: holes }, [[7, 'corn_1']]);
  assert.equal(validateGame(full, data), true);
  const free = freeBoardCells(full, data);
  const closed = closeDay(full);
  assert.deepEqual(closed.ratHoles, holes, 'No fourth rat hole.');
  assert.equal(closed.night!.trapped, null);
  assert.deepEqual(new Set(closed.night!.taken.map(value => value.position)), new Set([7, 22]));
  assert.equal(freeBoardCells(closed, data), free + 1 + 2, 'The merge frees one cell, and the stolen ingredients leave the board.');
  // A rat hole replaces the item in its cell, so the free cells do not change.
  const trapped = closeDay({ ...openGame(), coins: 0 });
  assert.equal(freeBoardCells(trapped, data), freeBoardCells(act({ ...openGame() }, { type: 'move', from: 13, to: 14 }), data));
  assert.equal(unresolvedObstacle(trapped, 22, data)?.type, 'rat-hole');
  // A Corn merges into the hole: the dish stays in the cell, and the purse gains the blocker coin.
  const corn = withBoard(trapped, [[23, 'corn_1']]);
  const cleared = act(corn, { type: 'move', from: 23, to: 22 });
  assert.equal(cleared.board[22]?.code, 'corn_2');
  assert.deepEqual(cleared.ratHoles, []);
  assert.equal(cleared.coins, corn.coins + data.economy.blockerCoin);
  assert.deepEqual(cleared.resolvedObstacles, corn.resolvedObstacles);
});

test('a tidy kitchen earns Șoricescu’s gift: the next open chain in turn, in the free cell nearest the bottom left, into the recipe book', () => {
  let state = tidy();
  const gifts: string[] = [];
  for (let night = 0; night < 4; night++) {
    const known = new Set(state.discovered);
    state = closeDay(withBoard(state, [[13, 'grain_1'], [14, 'grain_1']]));
    const gift = state.night!.gift!;
    assert.equal(state.night!.rat, 'soricescu');
    assert.equal(state.board[gift.position]?.code, gift.item);
    assert.ok(state.discovered.includes(gift.item));
    assert.equal(gift.first, !known.has(gift.item), 'A gift is new only when the recipe book does not hold it yet.');
    gifts.push(gift.item);
  }
  // Grain, Corn, and Herbs are open, in data order, and take turns.
  assert.deepEqual(gifts, ['grain_4', 'corn_4', 'herbs_4', 'grain_4']);
  assert.equal(state.gifts, 4);
  // The bottom-left cell comes first, then the cell beside it on the bottom row.
  assert.deepEqual([36, 37, 30].map(index => state.board[index]?.code), ['grain_4', 'corn_4', 'herbs_4']);
});

test('a board with exactly four free cells after the closing merge gets no gift, and a Linden tea can still be made from scratch', () => {
  // The merge frees one cell, so three free cells before it leave four at the closing.
  const crowded = crowd(tidy(), 3);
  const state = closeDay(crowded);
  assert.equal(freeBoardCells(state, data), 4);
  assert.equal(state.night!.rat, 'soricescu');
  assert.equal(state.night!.gift, null);
  assert.equal(state.gifts, 0);
  const tea = player(state);
  tea.produce(recovery.requirements[0].item);
  // With five free cells after the merge, the gift comes.
  assert.ok(closeDay(crowd(tidy(), 4)).night!.gift);
});

test('a purse of −20 takes free herbs only, and the recovery quest and the blocker coins work with a debt', () => {
  const state: GameState = { ...createGame(data, 1), coins: -20 };
  assert.equal(validateGame(state, data), true);
  act(state, { type: 'spawn', index: 31 });
  assert.match(rejected(state, { type: 'spawn', index: 1 }).message, /cannot pay/);
  rejected({ ...ready(state), coins: -20 }, { type: 'task' });
  assert.equal(resolveQuests(state, data).find(view => view.quest === recovery)!.status, 'active');
  const repaid = act(supply(state, recovery.id), { type: 'deliverQuest', id: recovery.id });
  assert.equal(repaid.coins, -20 + recovery.reward);
  // The blocked Elderflowers at 37 take the Elderflowers at 27.
  const cleared = act(state, { type: 'move', from: 27, to: 37 });
  assert.equal(cleared.coins, -20 + data.economy.blockerCoin);
  // The upkeep deepens the debt, and the recovery quest stays open across the closing.
  const night = act(lateEvening(state), { type: 'move', from: 13, to: 14 });
  assert.equal(night.coins, -20 - data.day.upkeep);
  assert.equal(resolveQuests(night, data).find(view => view.quest === recovery)!.status, 'active');
});

test('with no open campaign quest and a debt, the recovery quest opens, and its deliveries reach the cost of the next preparation', () => {
  let state: GameState = { ...checkpoint(1), coins: -20 };
  const cost = data.tasks[1].cost;
  assert.deepEqual(resolveQuests(state, data).filter(view => !view.quest.recovery && (view.status === 'active' || view.status === 'waiting')), []);
  while (state.coins < cost) {
    assert.equal(resolveQuests(state, data).find(view => view.quest === recovery)!.status, 'active');
    state = act(supply(state, recovery.id), { type: 'deliverQuest', id: recovery.id });
  }
  act(state, { type: 'task' });
});

/** The game after the payment of preparation 8: Vlad's first booked quest has a ticket, and Elisabeta's waits. */
const afterEight = () => act(ready(checkpoint(7)), { type: 'task' });

const freeCells = (state: GameState) => state.board.flatMap((cell, index) => !cell && !unresolvedObstacle(state, index, data) ? [index] : []);
/** Closes the day with the merge of two Elderflowers, which the rats leave alone. */
function closeWithHerbs(state: GameState) {
  const [first, second] = freeCells(state);
  return act(lateEvening(withBoard(state, [[first, 'herbs_1'], [second, 'herbs_1']])), { type: 'move', from: first, to: second });
}
/** Any successful action: an Elderflower moves to a free cell. */
function anyAction(state: GameState) {
  const [from, to] = freeCells(state);
  return act(withBoard(state, [[from, 'herbs_1']]), { type: 'move', from, to });
}
/** Vlad has a ticket: the quests of the window before the booked guests are on their way. Elisabeta waits. */
const vladTicket = () => deliver(deliver(afterEight(), 'mara-table'), 'ileana-fitting');
/** Both booked guests have tickets, and Vlad has the evening. */
const both = () => deliver(vladTicket(), 'mara-candles');

test('the evening guest follows the booked tickets: one guest, the authored order, and the guest who did not have the last evening', () => {
  // The booked guests come last in their window, so they wait for a ticket after the payment.
  assert.equal(status(afterEight(), 'vlad-after-dark'), 'waiting');
  const paid = vladTicket();
  assert.equal(status(paid, 'vlad-after-dark'), 'active');
  assert.equal(status(paid, 'elisabeta-papers'), 'waiting');
  // A waiting booked quest takes no part. The only booked ticket fixes the evening in the change that brings it.
  assert.deepEqual(paid.evening, { guest: 'vlad', last: null, delivered: false });
  // Elisabeta takes a ticket after the evening is fixed, and the evening does not change.
  const shared = both();
  assert.equal(status(shared, 'elisabeta-papers'), 'active');
  assert.equal(shared.evening.guest, 'vlad');
  // Both have tickets in one change, and neither had an evening: the guest whose quest comes first in authored order.
  assert.equal(anyAction({ ...shared, evening: { guest: null, last: null, delivered: false } }).evening.guest, 'vlad');
  // The guest of the last evening decides a tie.
  assert.equal(anyAction({ ...shared, evening: { guest: null, last: 'vlad', delivered: false } }).evening.guest, 'elisabeta');
  assert.equal(anyAction({ ...shared, evening: { guest: null, last: 'elisabeta', delivered: false } }).evening.guest, 'vlad');
  // A missed evening counts for its guest: at the next 07:00, the other guest has the evening.
  assert.deepEqual(closeWithHerbs(shared).evening, { guest: 'elisabeta', last: 'vlad', delivered: false });
  // With only one booked ticket, that guest has the evening again.
  assert.deepEqual(closeWithHerbs(paid).evening, { guest: 'vlad', last: 'vlad', delivered: false });
});

test('a booked ticket names 20:00 only for the evening guest, and delivers once a day from the booking time to the closing', () => {
  const shared = supply(supply(both(), 'vlad-after-dark'), 'elisabeta-papers');
  assert.equal(bookedTicket(shared, quest('vlad-after-dark'), data), 'Booked for 20:00');
  assert.equal(bookedTicket(shared, quest('elisabeta-papers'), data), 'Booked for another evening');
  assert.equal(bookedTicket(shared, quest('mara-candles'), data), null);
  assert.match(rejected(shared, { type: 'deliverQuest', id: 'vlad-after-dark' }).message, /booked/);
  // At the booking time, Deliver works without the lanterns.
  const evening = { ...shared, clock: { ...shared.clock, merges: (data.day.booking - data.day.opening) / data.day.mergeMinutes } };
  assert.equal(canDeliverQuest(evening, 'vlad-after-dark', data), true);
  const served = act(evening, { type: 'deliverQuest', id: 'vlad-after-dark' });
  assert.equal(served.evening.delivered, true);
  // Vlad's next quest waits for a later evening, and Elisabeta's evening is another day.
  assert.equal(status(served, 'vlad-guest'), 'active');
  assert.equal(bookedTicket(served, quest('vlad-guest'), data), 'Booked for another evening');
  rejected(served, { type: 'deliverQuest', id: 'elisabeta-papers' });
  rejected(supply(served, 'vlad-guest'), { type: 'deliverQuest', id: 'vlad-guest' });
  // The next morning, Elisabeta did not have the last evening.
  const morning = closeWithHerbs(served);
  assert.equal(morning.evening.guest, 'elisabeta');
  assert.equal(bookedTicket(morning, quest('elisabeta-papers'), data), 'Booked for 20:00');
});

test('the lanterns bring tonight’s booked guest at once, before the booking time, with every portion on the board, and spend nothing', () => {
  const shared = both();
  rejected(shared, { type: 'lantern', id: 'vlad-after-dark' });
  const supplied = supply(supply(shared, 'vlad-after-dark'), 'elisabeta-papers');
  rejected(supplied, { type: 'lantern', id: 'elisabeta-papers' });
  rejected(supplied, { type: 'lantern', id: 'mara-candles' });
  const lit = act(supplied, { type: 'lantern', id: 'vlad-after-dark' });
  assert.equal(clockMinutes(lit, data), data.day.booking);
  assert.equal(lit.clock.day, supplied.clock.day);
  assert.equal(lit.coins, supplied.coins);
  rejected(lit, { type: 'lantern', id: 'vlad-after-dark' });
  act(lit, { type: 'deliverQuest', id: 'vlad-after-dark' });
});

test('the supper stops the clock and records the result of act 1, which keeps its purse after the purse changes', () => {
  const night = closeWithHerbs(openGame()).night!;
  const finished: GameState = { ...checkpoint(data.tasks.length), clock: { day: 22, merges: dayMerges(data) - 1 }, night: { ...night, day: 21 }, coins: 0 };
  const served = deliver(finished, data.quests.find(value => value.finale)!.id);
  assert.deepEqual(served.act1, { days: 22, purse: 0 });
  // A merge after the supper moves no clock and brings no night.
  const merged = closeWithHerbs(served);
  assert.deepEqual(merged.clock, served.clock);
  assert.deepEqual(merged.night, served.night);
  const spent = act({ ...merged, coins: 5 }, { type: 'spawn', index: merged.board.findIndex(cell => cell?.code === 'generator_grain') });
  assert.deepEqual(spent.act1, { days: 22, purse: 0 });
  assert.equal(validateGame({ ...spent, act1: null }, data), false, 'A served supper has its result.');
  assert.equal(validateGame({ ...finished, act1: { days: 22, purse: 0 } }, data), false, 'Only the supper records a result.');
});

test('each quest fits in one day, and only Vlad and Elisabeta book their quests', () => {
  assert.deepEqual(dayProblems(data), []);
  assert.deepEqual([...new Set(data.quests.filter(value => value.booked).map(value => value.character))], ['vlad', 'elisabeta']);
  assert.ok(data.quests.filter(value => ['vlad', 'elisabeta'].includes(value.character)).every(value => value.booked));
  const changed = (change: (copy: GameData) => void) => { const copy = structuredClone(data); change(copy); return dayProblems(copy).join(' '); };
  assert.match(changed(copy => { copy.quests.find(value => value.id === 'mara-table')!.requirements[0].quantity = 999; }), /more than the 150/);
  assert.match(changed(copy => { copy.quests.find(value => value.id === 'mara-table')!.booked = true; }), /Exactly two guests/);
  assert.match(changed(copy => { delete copy.quests.find(value => value.id === 'vlad-guest')!.booked; }), /every quest of a booked guest/);
  assert.match(changed(copy => { copy.day.giftSpace = 4; }), /at least 5 free cells/);
  assert.match(changed(copy => { copy.day.booking = 1201; }), /merge grid/);
});

test('a save keeps the clock, the seed, the rat holes, the gifts, the evening, the night report, the act 1 result, and a debt', () => {
  const theft = closeDay({ ...openGame(), coins: 3, seed: 5 });
  const gift = closeDay(withBoard(theft, [[13, 'grain_1'], [14, 'grain_1']]));
  const evening: GameState = { ...gift, evening: { guest: 'vlad', last: 'elisabeta', delivered: false } };
  for (const state of [openGame(), theft, gift, evening]) {
    assert.equal(validateGame(state, data), true);
    assert.deepEqual(importSave(exportSave(state, validate), validate), state);
  }
  assert.equal(theft.coins, -7, 'The upkeep leaves a debt.');
  // Some corruptions write a value that the GameState type does not admit.
  const corruptions: ((state: any) => void)[] = [
    state => { state.clock.day = 0; }, state => { state.clock.merges = dayMerges(data); }, state => { state.clock.extra = 1; },
    state => { state.seed = -1; }, state => { state.seed = 2 ** 32; }, state => { state.gifts = 0.5; },
    state => { state.ratHoles.push({ item: 'herbs_1', position: 2 }); }, state => { state.ratHoles[0].item = 'grain_2'; },
    state => { state.ratHoles.push({ item: 'grain_1', position: 2 }, { item: 'grain_1', position: 3 }, { item: 'grain_1', position: 7 }); },
    state => { state.ratHoles.push({ item: 'grain_1', position: 1 }); },
    state => { state.evening.guest = 'mara'; }, state => { state.evening.delivered = true; },
    state => { state.night.day = 2; }, state => { state.night.rat = 'mouse'; }, state => { state.night.seen = 'no'; },
    state => { state.night.taken = [{ item: 'herbs_1', position: 2 }]; }, state => { state.night = null; },
    state => { state.night.gift = { item: 'grain_4', position: 2, first: true }; },
    state => { state.resolvedObstacles.push('rat-hole-22'); },
  ];
  for (const corrupt of corruptions) {
    const state = structuredClone(theft);
    corrupt(state);
    assert.equal(validateGame(state, data), false, String(corrupt));
  }
  const giftless = structuredClone(gift) as any;
  giftless.night.gift.item = 'grain_3';
  assert.equal(validateGame(giftless, data), false, 'A gift is a stage-4 dish.');
  assert.equal(validateGame({ ...openGame(), night: theft.night }, data), false, 'The first day has no night behind it.');
});
