import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeliverQuest, canLightLanterns, dateText, dayMerges, firstFreeBoardCell, gardenStage, getItem, holdOf, questDeliveryCells, released, requiredQuests, resolveQuests, takeCost, taskEligibility, unresolvedObstacle } from '../src/model.ts';
import { calendarProblems, discoveryProblems } from '../src/content.ts';
import { validateGame } from '../src/engine.ts';
import { exportSave, importSave } from '../src/storage.ts';
import type { GameData, GameState, Hold, Quest } from '../src/model.ts';
import { checkpointState, finaleCheckpoint, moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, data, know, quest, recovery, rejected, supply } from './support.ts';

/** The index of a preparation by its ID. */
const index = (id: string) => data.tasks.findIndex(task => task.id === id);
/** The hold whose release is this preparation or this quest. */
const holdOfRelease = (id: string) => data.calendar.holds.find(hold => hold.task === id || hold.quest === id)!;
/** The validator of a test data set. */
const validator = (content: GameData) => (candidate: unknown) => validateGame(candidate, content);
/** A copy on a later morning, after quiet nights. */
const on = (state: GameState, day: number) => { const next = structuredClone(state); moveTo(next, day, data); return next; };
/** A copy with every March quest that opened delivered, so it holds no ticket. */
const withoutMarch = (state: GameState) => ({ ...state, completedQuests: [...state.completedQuests, ...state.march.filter(id => !state.completedQuests.includes(id))] });
/** The open quests of a state, on a ticket or waiting for one, without the recovery quest and the repeating quests. */
const open = (state: GameState, content = data) => resolveQuests(state, content).filter(view => (view.status === 'active' || view.status === 'waiting') && !view.quest.recovery && !view.quest.repeating);
/** The status of a quest in a state. */
const status = (state: GameState, id: string, content = data) => resolveQuests(state, content).find(view => view.quest.id === id)!.status;
/** Two Elderflowers on free cells merge one merge before the closing, so a day that holds stops at its held position. */
function heldPosition(state: GameState, content = data): GameState {
  const next = structuredClone(state);
  const [first, second] = next.board.flatMap((cell, at) => !cell && !unresolvedObstacle(next, at, content) ? [at] : []);
  next.board[first] = { code: 'herbs_1' }; next.board[second] = { code: 'herbs_1' }; know(next, 'herbs_1');
  next.clock.merges = dayMerges(next.clock.day, content) - 2;
  const held = act(next, { type: 'move', from: first, to: second }, content);
  assert.equal(held.clock.merges, dayMerges(held.clock.day, content) - 1, 'The day stops at its held position.');
  return held;
}
/** One merge of two free Elderflowers, which moves the clock unless the day holds. */
function merge(state: GameState, content = data): GameState {
  const next = structuredClone(state);
  const [first, second] = next.board.flatMap((cell, at) => !cell && !unresolvedObstacle(next, at, content) ? [at] : []);
  next.board[first] = { code: 'herbs_1' }; next.board[second] = { code: 'herbs_1' }; know(next, 'herbs_1');
  return act(next, { type: 'move', from: first, to: second }, content);
}
/** A copy with no movable dishes, so supplied dishes have room. The blockers stay. */
const roomy = (state: GameState): GameState => ({ ...state, board: state.board.map(() => null) });
/** A copy with the dishes of the quest on the board, unless the board holds them already. */
const supplied = (state: GameState, value: Quest) => questDeliveryCells(state, value).every(at => at >= 0) ? state : supply(state, value.id);
/**
 * A late player on a held day: each payment that is ready, and each quest on a ticket that can deliver now with its dishes supplied,
 * until the hold releases. A booked quest delivers only on its guest's evening.
 */
function finishHold(state: GameState, hold: Hold) {
  let next = state;
  const delivered: string[] = [];
  for (let step = 0; !released(next, hold); step++) {
    assert.ok(step < 500, 'The held day converges.');
    if (taskEligibility(next, data).ready) { next = act(next, { type: 'task' }); continue; }
    const candidate = open(next).filter(view => view.status === 'active').map(view => view.quest).find(value => canDeliverQuest(supplied(next, value), value, data));
    assert.ok(candidate, `${dateText(hold.day, data, 'plain')} is stuck. Tickets: ${open(next).map(view => `${view.quest.id} ${view.status}`).join(', ')}. Evening: ${JSON.stringify(next.evening)}.`);
    next = act(supplied(next, candidate), { type: 'deliverQuest', id: candidate.id });
    delivered.push(candidate.id);
  }
  return { state: next, delivered };
}

test('the authored held days pass the data check, and booked quests that a held day without their evening needs, or a holiday quest after its hold, fail it', () => {
  assert.deepEqual(calendarProblems(data), []);
  const cases: [string, (content: GameData) => void, string][] = [
    ['a booked quest of Vlad after preparation 13', content => { content.quests.find(value => value.id === 'vlad-sleeps-all-day')!.afterTask = 'act2-prep-13'; },
      'The hold of 12 July: vlad-sleeps-all-day needs an evening of the booked guests.'],
    ['a booked quest of Elisabeta after preparation 24', content => { content.quests.find(value => value.id === 'elisabeta-crows')!.afterTask = 'act2-prep-24'; },
      'The hold of 31 August: elisabeta-crows needs an evening of the booked guests.'],
    ['the bell of the feast opens on 12 August after preparation 23', content => { Object.assign(content.quests.find(value => value.id === 'catalina-feast-bell')!, { afterTask: 'act2-prep-23', opens: holdOfRelease('act2-prep-24').day - 2 }); },
      'The hold of 14 August: catalina-feast-bell cannot be delivered before its closing.'],
  ];
  for (const [name, change, problem] of cases) {
    const content = structuredClone(data);
    change(content);
    assert.ok(calendarProblems(content).includes(problem), `${name}: ${calendarProblems(content).join(' ')}`);
  }
});

test('a late player reaches 20 June with booked quests of Vlad and Elisabeta to deliver, and the day still ends with the payment of preparation 12', () => {
  // Only preparation 1 of act 2 is paid. Vlad's house guest is open, and Elisabeta's quests open with the payments of the same day.
  const hold = holdOfRelease('act2-prep-12'), late = roomy(withoutMarch(on(act(checkpointState(data, index('act2-prep-1')), { type: 'task' }), hold.day)));
  assert.ok(['active', 'waiting'].includes(status(late, 'vlad-house-guest')));
  const { state, delivered } = finishHold(heldPosition({ ...late, coins: 100_000 }), hold);
  for (const id of ['vlad-house-guest', 'elisabeta-fence-may', 'elisabeta-red-ink']) assert.ok(delivered.includes(id), `${id} is delivered on 20 June.`);
  assert.deepEqual([state.clock, state.night!.day, state.taskIndex], [{ day: hold.day + 1, merges: 0 }, hold.day, index('act2-prep-12') + 1]);
});

test('a late player reaches 14 August with booked quests of Vlad and Elisabeta to deliver, and the day still ends with the payment of preparation 24', () => {
  const hold = holdOfRelease('act2-prep-24'), late = roomy(withoutMarch(on(act(checkpointState(data, index('act2-prep-16')), { type: 'task' }), hold.day)));
  const { state, delivered } = finishHold(heldPosition({ ...late, coins: 100_000 }), hold);
  for (const id of ['elisabeta-crows', 'vlad-window']) assert.ok(delivered.includes(id), `${id} is delivered on 14 August.`);
  assert.deepEqual([state.clock, state.night!.day, state.taskIndex], [{ day: hold.day + 1, merges: 0 }, hold.day, index('act2-prep-24') + 1]);
});

test('on 15 August no booked quest of Vlad or Elisabeta is open', () => {
  const feast = finaleCheckpoint(data, 2);
  assert.deepEqual(open(feast).filter(view => view.quest.booked && ['vlad', 'elisabeta'].includes(view.quest.character)).map(view => view.quest.id), []);
  // No booked quest of theirs opens after preparation 24, so none can be open later in act 2.
  assert.deepEqual(data.quests.filter(value => value.booked && ['vlad', 'elisabeta'].includes(value.character) && value.afterTask === 'act2-prep-24').map(value => value.id), []);
});

test('a late player reaches 31 August with each quest that opens after the feast open, and the purchase still ends the day', () => {
  const feast = finaleCheckpoint(data, 2), served = act(supply(feast, finaleQuestId(2)), { type: 'deliverQuest', id: finaleQuestId(2) });
  const hold = holdOfRelease('act2-orchard'), late = roomy(withoutMarch({ ...on(served, hold.day), coins: 100_000 }));
  const after = requiredQuests(index('act2-orchard'), data).filter(value => !late.completedQuests.includes(value.id));
  assert.ok(after.some(value => value.id === 'janos-proper-meal'));
  assert.deepEqual(after.filter(value => !open(late).some(view => view.quest === value)).map(value => value.id), [], 'Each quest that opens after the feast is open on 31 August.');
  const held = heldPosition(late), { state } = finishHold(held, hold);
  assert.deepEqual(state.act2, { purse: state.coins });
  assert.equal(released(state, hold), true);
  // The purchase of the last act stops the clock: no merge moves it, and no night comes.
  assert.deepEqual(merge(state).clock, state.clock);
  assert.deepEqual(merge(state).night, state.night);
});

/** The ID of the finale quest of an act. */
function finaleQuestId(act: number) { return data.quests.find(value => value.finale === data.finales[act - 1].id)!.id; }

test('on 21 June the open stall quest takes the first ticket before earlier holiday quests, and the day ends after the fifth stall', () => {
  // The test data set: Sânziana's quest of 23 June and the quests of Ileana and Ana of 24 June come before the stall quests.
  const content = structuredClone(data), stalls = content.quests.filter(value => value.stall), holidays = ['sanziana-midsummer', 'ileana-day-of-the-blouse', 'ana-strongest-herbs'];
  const moved = holidays.map(id => content.quests.find(value => value.id === id)!);
  content.quests = content.quests.filter(value => !moved.includes(value));
  content.quests.splice(content.quests.indexOf(stalls[0]), 0, ...moved);
  const hold = content.calendar.holds.find(value => value.quest === stalls.at(-1)!.id)!;
  const morning = withoutMarch(on(act(checkpointState(data, index('act2-prep-12')), { type: 'task' }), hold.day));
  for (const id of holidays) assert.ok(open(morning, content).some(view => view.quest.id === id), `${id} is open on 21 June.`);
  // Without the held day, the holiday quests would take the three tickets in authored order.
  assert.deepEqual(holidays.map(id => status(morning, id, content)), ['active', 'active', 'waiting']);
  assert.equal(status(morning, stalls[0].id, content), 'active');
  let state = heldPosition(morning, content);
  state = act(supply(state, stalls[0].id), { type: 'deliverQuest', id: stalls[0].id }, content);
  assert.equal(status(state, stalls[1].id, content), 'active');
  assert.ok(holidays.some(id => status(state, id, content) === 'waiting'), 'One holiday quest waits.');
  for (const stall of stalls.slice(1)) {
    assert.equal(state.clock.day, hold.day);
    assert.equal(status(state, stall.id, content), 'active');
    state = act(supply(state, stall.id), { type: 'deliverQuest', id: stall.id }, content);
  }
  assert.deepEqual([state.clock, state.night!.day], [{ day: hold.day + 1, merges: 0 }, hold.day]);
});

test('the discovery check rejects a stall dish that only the holiday quest of 23 June, earlier in authored order, teaches', () => {
  const grill = data.quests.find(value => value.stall)!, holiday = 'sanziana-midsummer';
  /** A data set with the holiday quest before the stall quests, the grill asking for a dish, and the holiday quest for its parts. */
  const dataSet = (dish: string, parts: string[], holds = true) => {
    const content = structuredClone(data), moved = content.quests.find(value => value.id === holiday)!, stall = content.quests.find(value => value.id === grill.id)!;
    content.quests = content.quests.filter(value => value !== moved);
    content.quests.splice(content.quests.indexOf(stall), 0, moved);
    stall.requirements.push({ item: dish, quantity: 1 });
    for (const part of parts) moved.requirements.push({ item: part, quantity: 1 });
    if (!holds) content.calendar.holds = [];
    return content;
  };
  const problem = (dish: string) => `${grill.id}: ${data.items[dish].name} is more than one merge beyond the dishes that the player knows when the quest opens.`;
  const parts = (code: string) => data.items[code].recipe ?? [`${data.items[code].chain}_${data.items[code].stage - 1}`];
  // A dish that the grill cannot ask for, one merge beyond parts that the holiday quest would teach on a day that does not hold.
  const found = Object.values(data.items).find(item => !item.generator && discoveryProblems(dataSet(item.id, [])).includes(problem(item.id))
    && !discoveryProblems(dataSet(item.id, parts(item.id), false)).includes(problem(item.id)))!;
  assert.ok(found, 'A dish that only the holiday quest teaches exists.');
  // On the held day, the holiday quest takes no ticket before the stall, so its dishes teach nothing.
  assert.ok(discoveryProblems(dataSet(found.id, parts(found.id))).includes(problem(found.id)));
});

test('an open March quest waits without a ticket on 20 June while the release requirements hold the counter, and gets the next free ticket with its reward', () => {
  const hold = holdOfRelease('act2-prep-12'), late = roomy(on(act(checkpointState(data, index('act2-prep-11')), { type: 'task' }), hold.day));
  const march = data.quests.find(value => value.march && late.march.includes(value.id) && !late.completedQuests.includes(value.id))!;
  assert.ok(march, 'A March quest of act 1 is still open.');
  const requirements = open(late).filter(view => view.quest !== march);
  assert.equal(requirements.length, 3);
  assert.ok(requirements.every(view => view.status === 'active' && requiredQuests(index('act2-prep-12'), data).includes(view.quest)));
  assert.equal(status(late, march.id), 'waiting');
  let state = late;
  for (const { quest: value } of requirements) state = act(supply(state, value.id), { type: 'deliverQuest', id: value.id });
  state = act({ ...state, coins: data.tasks[index('act2-prep-12')].cost }, { type: 'task' });
  assert.equal(status(state, march.id), 'active');
  const reloaded = importSave<GameState>(exportSave(state, validator(data)), validator(data));
  assert.deepEqual(reloaded, state);
  assert.equal(status(reloaded, march.id), 'active');
  const delivered = act(supply(reloaded, march.id), { type: 'deliverQuest', id: march.id });
  assert.equal(delivered.coins, reloaded.coins + march.reward);
});

/** The state of each held day before its run: every other quest of the day delivered or cooked ahead, and the release still to come. */
function heldStart(hold: Hold): GameState {
  const release = hold.quest ? quest(hold.quest) : null;
  let state: GameState;
  if (release?.finale) state = finaleCheckpoint(data, data.finales.findIndex(finale => finale.id === release.finale) + 1);
  else if (hold.task) state = on(checkpointState(data, index(hold.task)), hold.day);
  else if (release?.stall) {
    state = on(act(checkpointState(data, index('act2-prep-12')), { type: 'task' }), hold.day);
    for (const stall of data.quests.filter(value => value.stall && value !== release)) state = act(supply(state, stall.id), { type: 'deliverQuest', id: stall.id });
  } else {
    // Ambrozie's dinner on 12 July, and his lunch on 13 July after the dinner at the booking time.
    const dinner = quest('ambrozie-dinner');
    state = on(act(checkpointState(data, index(dinner.afterTask!)), { type: 'task' }), dinner.evening!);
    if (release!.id !== dinner.id) {
      // The first action of the day gives the evening to Ambrozie.
      state = merge(supply(roomy(state), dinner.id));
      assert.ok(canLightLanterns(state, dinner, data));
      state = act(act(state, { type: 'lantern', id: dinner.id }), { type: 'deliverQuest', id: dinner.id });
      state = on(state, hold.day);
    }
  }
  state = roomy(withoutMarch(state));
  // The other open quests are delivered when the day permits, or their dishes wait on the board.
  for (let step = 0; step < 50; step++) {
    const other = open(state).find(view => view.status === 'active' && view.quest !== release && questDeliveryCells(state, view.quest).some(at => at < 0));
    if (!other) break;
    state = supply(state, other.quest.id);
    if (canDeliverQuest(state, other.quest, data)) state = act(state, { type: 'deliverQuest', id: other.quest.id });
  }
  return heldPosition(state);
}
/**
 * A player who makes dishes with legal actions and spare food, a take at a time. A take that the purse cannot pay makes nothing, and
 * the parts made so far stay on the board as spare food.
 */
function kitchen(initial: GameState) {
  let state = initial;
  const kept = new Set<number>();
  const spare = (code: string) => state.board.findIndex((cell, at) => cell?.code === code && !kept.has(at) && !unresolvedObstacle(state, at, data));
  function make(code: string): number | null {
    const found = spare(code), item = getItem(code, data)!;
    if (found >= 0) return found;
    if (item.recipe || item.stage > 1) {
      const [first, second] = item.recipe ?? [`${item.chain}_${item.stage - 1}`, `${item.chain}_${item.stage - 1}`];
      const into = make(first);
      if (into === null) return null;
      kept.add(into);
      const from = make(second);
      kept.delete(into);
      if (from === null) return null;
      state = act(state, { type: 'move', from, to: into });
      assert.equal(state.board[into]?.code, code);
      return into;
    }
    assert.ok(state.sources.includes(item.chain), `The source of ${code} is in the bistro.`);
    const cost = takeCost(getItem(`generator_${item.chain}`, data)!, data, gardenStage(state.taskIndex, data));
    if (cost && state.coins < cost) return null;
    const empty = firstFreeBoardCell(state, data);
    assert.ok(empty >= 0, 'The board has room for a take.');
    state = act(state, { type: 'spawn', chain: item.chain });
    assert.equal(state.board[empty]?.code, code);
    return empty;
  }
  /** Makes every portion of a quest, or as much as the purse pays. True when every portion is on the board. */
  function prepare(value: Quest) {
    kept.clear();
    for (const { item, quantity } of value.requirements) for (let count = 0; count < quantity; count++) {
      const made = make(item);
      if (made === null) { kept.clear(); return false; }
      kept.add(made);
    }
    kept.clear();
    return true;
  }
  return { get state() { return state; }, act: (action: Parameters<typeof act>[1]) => (state = act(state, action)), prepare };
}

test('on each held day, a run that starts at the held position with a debt of 20 coins reaches the release through the recovery quest and the repeating quests', () => {
  for (const hold of data.calendar.holds) {
    const label = dateText(hold.day, data, 'plain'), release = hold.quest ? quest(hold.quest) : null, start = { ...heldStart(hold), coins: -20 };
    assert.equal(holdOf(start.clock.day, data), hold, label);
    const cook = kitchen(start);
    let teas = 0, repeats = 0;
    for (let step = 0; !released(cook.state, hold); step++) {
      assert.ok(step < 3000, `${label}: the run converges.`);
      const state = cook.state, views = resolveQuests(state, data), active = (value: Quest) => views.find(view => view.quest === value)!.status === 'active';
      if (!release && taskEligibility(state, data).ready) { cook.act({ type: 'task' }); continue; }
      if (release && canDeliverQuest(state, release, data)) { cook.act({ type: 'deliverQuest', id: release.id }); continue; }
      // A partial cooking spends the purse; the tickets change after it, so the run looks again.
      if (release && active(release) && (cook.prepare(release) || cook.state !== state)) continue;
      if (active(recovery)) { assert.ok(cook.prepare(recovery), `${label}: the herbs are free.`); cook.act({ type: 'deliverQuest', id: recovery.id }); teas++; continue; }
      const repeating = views.find(view => view.quest.repeating && view.status === 'active')?.quest;
      if (repeating && cook.prepare(repeating)) { cook.act({ type: 'deliverQuest', id: repeating.id }); repeats++; continue; }
      if (repeating && cook.state !== state) continue;
      assert.fail(`${label}: no recovery quest or repeating quest can help. Coins: ${state.coins}. Tickets: ${views.filter(view => view.status === 'active').map(view => view.quest.id).join(', ')}.`);
    }
    assert.ok(teas > 0, `${label}: the recovery quest pays the debt.`);
    const end = cook.state;
    // The release at the held position closes the day, except the purchase of the last act, which stops the clock.
    if (hold.task && data.tasks[index(hold.task)].purchase) assert.deepEqual([end.clock.day, end.act2], [hold.day, { purse: end.coins }], label);
    else assert.deepEqual([end.clock, end.night!.day], [{ day: hold.day + 1, merges: 0 }, hold.day], `${label}: ${teas} teas, ${repeats} repeating quests.`);
  }
});

test('Ambrozie keeps 12 July until his dinner, his evening is not Vlad’s, Vlad gets the next evening with a booking, and the lunch opens only on 13 July', () => {
  const dinner = quest('ambrozie-dinner'), lunch = quest('ambrozie-lunch'), vlad = quest('vlad-sleeps-all-day');
  let morning = roomy(withoutMarch(on(act(checkpointState(data, index(dinner.afterTask!)), { type: 'task' }), dinner.evening!)));
  // The other quests that hold tickets are delivered in the morning, so Vlad's booked ticket is on the counter with the dinner.
  for (let step = 0; status(morning, vlad.id) !== 'active'; step++) {
    assert.ok(step < 10);
    const other = open(morning).find(view => view.status === 'active' && view.quest !== dinner && !view.quest.booked && canDeliverQuest(supplied(morning, view.quest), view.quest, data))!;
    assert.ok(other, 'Another quest on the counter can deliver on 12 July.');
    morning = act(supplied(morning, other.quest), { type: 'deliverQuest', id: other.quest.id });
  }
  assert.equal(status(morning, dinner.id), 'active');
  // A player who reaches the closing without the dinner stays on 12 July.
  const held = heldPosition(morning);
  assert.equal(held.evening.guest, 'ambrozie');
  assert.deepEqual(merge(held).clock, held.clock);
  rejected({ ...supply(held, vlad.id) }, { type: 'deliverQuest', id: vlad.id });
  // At the booking time Ambrozie dines; the day goes on, and the lunch waits for 13 July.
  let state = supply(morning, dinner.id);
  state = act(act(state, { type: 'lantern', id: dinner.id }), { type: 'deliverQuest', id: dinner.id });
  assert.equal(state.clock.day, dinner.evening);
  assert.equal(validateGame({ ...state, clock: { ...state.clock, merges: 0 } }, data), false, 'A served fixed dinner cannot be saved before its booking time.');
  const beforeDinnerDay = structuredClone(state);
  beforeDinnerDay.clock.day = dinner.evening! - 1;
  beforeDinnerDay.night!.day = beforeDinnerDay.clock.day - 1;
  beforeDinnerDay.evening = { guest: null, last: null, delivered: false };
  assert.equal(validateGame(beforeDinnerDay, data), false, 'A served fixed dinner cannot be saved before its day.');
  assert.equal(status(state, lunch.id), 'locked');
  state = merge({ ...state, clock: { ...state.clock, merges: dayMerges(state.clock.day, data) - 1 } });
  assert.equal(state.clock.day, dinner.evening! + 1);
  assert.equal(status(state, lunch.id), 'active');
  assert.equal(state.evening.guest, null, 'Sunday 13 July has no evening guest.');
  state = act(supply(state, lunch.id), { type: 'deliverQuest', id: lunch.id });
  state = merge({ ...state, clock: { ...state.clock, merges: dayMerges(state.clock.day, data) - 1 } });
  assert.equal(state.clock.day, dinner.evening! + 2);
  assert.equal(state.evening.guest, 'vlad', 'Vlad gets the next evening that has a booking.');
});

test('the feast keeps 15 August until it is served, Serve at the held position gives 16 August once, and Serve at 19:30 lets the 22:00 merge give it once', () => {
  const id = finaleQuestId(2), feast = finaleCheckpoint(data, 2), hold = holdOfRelease(id);
  const held = heldPosition(feast);
  assert.equal(held.clock.day, hold.day);
  assert.deepEqual(merge(held).clock, held.clock, 'A player without the plates stays on 15 August.');
  // Serve at 21:35, the held position, closes the day in the same change.
  const late = act(supply(held, id), { type: 'deliverQuest', id });
  assert.deepEqual([late.clock, late.night!.day, late.coins], [{ day: hold.day + 1, merges: 0 }, hold.day, held.coins - data.acts[1].day.upkeep]);
  const reloaded = importSave<GameState>(exportSave(late, validator(data)), validator(data));
  assert.deepEqual(reloaded, late);
  rejected(supply(reloaded, id), { type: 'deliverQuest', id });
  // Serve at 19:30 keeps play on 15 August, and the merge that reaches 22:00 closes it once.
  const early = act(supply(feast, id), { type: 'deliverQuest', id });
  assert.deepEqual(early.clock, feast.clock);
  const closed = merge({ ...early, clock: { ...early.clock, merges: dayMerges(early.clock.day, data) - 1 } });
  assert.deepEqual([closed.clock, closed.night!.day, closed.coins], [{ day: hold.day + 1, merges: 0 }, hold.day, early.coins - data.acts[1].day.upkeep]);
  assert.deepEqual(importSave<GameState>(exportSave(closed, validator(data)), validator(data)), closed);
});
