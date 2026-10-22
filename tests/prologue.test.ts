import test from 'node:test';
import assert from 'node:assert/strict';
import { currentEvent, dateText, earnedPrologue, eventDishes, firstFreeBoardCell, gameDay, getItem, mergeResult, prologueScenes, resolveQuests, unresolvedObstacle } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import { dataProblems, prologueProblems } from '../src/content.ts';
import { exportSave, importSave, loadSave, saveGame } from '../src/storage.ts';
import { runPrologue } from '../tools/campaign-balance.ts';
import type { Action, GameData, GameState, Quest } from '../src/model.ts';
import { act, actOne, data, memoryStorage, prologueServed, rejected, validate } from './support.ts';

const events = data.prologue.events, scenes = prologueScenes(data).map(scene => scene.id);
const kept = new Set<number>();
/** Makes a dish on the board from spare food, takes, and merges, with legal actions only. */
function produce(state: GameState, code: string): [GameState, number] {
  const found = state.board.findIndex((cell, index) => cell?.code === code && !kept.has(index) && !unresolvedObstacle(state, index, data)), item = getItem(code, data)!;
  if (found >= 0) return [state, found];
  if (item.stage === 1 && !item.recipe) {
    const empty = firstFreeBoardCell(state, data);
    return [act(state, { type: 'spawn', index: state.board.findIndex(cell => cell?.code === `generator_${item.chain}`) }), empty];
  }
  const [a, b] = item.recipe ?? [`${item.chain}_${item.stage - 1}`, `${item.chain}_${item.stage - 1}`];
  let first: number, second: number;
  [state, first] = produce(state, a); kept.add(first);
  [state, second] = produce(state, b); kept.delete(first);
  return [act(state, { type: 'move', from: second, to: first }), first];
}
/** Serves one quest of the current event from legal play. */
function serve(state: GameState, quest: Quest): GameState {
  for (const { item, quantity } of quest.requirements) for (let count = 0; count < quantity; count++) { let at: number; [state, at] = produce(state, item); kept.add(at); }
  kept.clear();
  return act(state, { type: 'deliverQuest', id: quest.id });
}
const readAll = (state: GameState) => { while (state.pendingScenes.length && state.prologue) state = act(state, { type: 'readScene', id: state.pendingScenes[0] }); return state; };
/** Plays the prologue until the start of the given event, serving each event in authored or reverse order and reading or deferring the scenes. */
function playTo(event: number, { reverse = false, read = true } = {}): GameState {
  let state = createGame(data, 1);
  if (read) state = readAll(state);
  while (state.prologue && state.prologue.event < event) {
    const quests = currentEvent(state, data)!.quests;
    for (const quest of reverse ? [...quests].reverse() : quests) state = serve(state, quest);
    if (read) state = readAll(state);
  }
  return state;
}
/** Every quest of the prologue served with the scenes deferred: the game waits for its last scene. */
const waiting = () => { let state = playTo(7, { read: false }); for (const quest of events[6].quests) state = serve(state, quest); return state; };
const roundTrip = (state: GameState) => importSave<GameState>(exportSave(state, validate), validate);

test('a new game starts at the first event on Monday 23 December of year 0, with the first scene pending and no purse or clock', () => {
  const state = createGame(data, 1);
  assert.deepEqual(state.prologue, { event: 1 });
  assert.equal(dateText(gameDay(state, data), data), 'Monday 23 December');
  assert.equal(dateText(gameDay(state, data), data, 'short'), 'Mon 23 Dec');
  assert.deepEqual(state.pendingScenes, [events[0].opening.id]);
  assert.deepEqual([state.coins, state.clock], [0, { day: 1, merges: 0 }]);
  // A save, a reload, and an export and import before the first reading keep the scene pending.
  const storage = memoryStorage();
  assert.equal(saveGame(storage, state, validate).ok, true);
  assert.deepEqual(loadSave<GameState>(storage, validate).state!.pendingScenes, [events[0].opening.id]);
  assert.deepEqual(roundTrip(state), state);
});

test('the first quest is ready to serve with no take, and the Bean dip needs four takes and four merges', () => {
  let state = readAll(createGame(data, 1));
  const [first, second] = events[0].quests;
  state = act(state, { type: 'deliverQuest', id: first.id });
  assert.equal(state.coins, 0, 'An event quest pays nothing.');
  let takes = 0, merges = 0;
  const step = (action: Action) => { const result = reduceGame(state, action, data); assert.ok(result.ok, result.message); state = result.state; if (action.type === 'spawn') takes++; if (result.event === 'merge') merges++; };
  const source = state.board.findIndex(cell => cell?.code === 'generator_beans');
  for (let count = 0; count < 4; count++) step({ type: 'spawn', index: source });
  const cells = (code: string) => state.board.flatMap((cell, index) => cell?.code === code ? [index] : []);
  step({ type: 'move', from: cells('beans_1')[0], to: cells('beans_1')[1] });
  step({ type: 'move', from: cells('beans_1')[0], to: cells('beans_1')[1] });
  step({ type: 'move', from: cells('beans_2')[0], to: cells('beans_2')[1] });
  step({ type: 'move', from: cells('beans_3')[0], to: cells('beans_3')[1] });
  assert.deepEqual([takes, merges], [4, 4]);
  assert.equal(state.clock.merges, 0, 'Merges in the prologue do not move the time.');
  state = act(state, { type: 'deliverQuest', id: second.id });
  // The last delivery earns closing 1 and opening 2, in this order, and starts event 2 in the same change.
  assert.deepEqual(state.pendingScenes, [events[0].closing.id, events[1].opening.id]);
  assert.deepEqual(state.prologue, { event: 2 });
  assert.deepEqual(state.board.map(cell => cell?.code ?? null), events[1].board);
  assert.equal(dateText(gameDay(state, data), data, 'short'), 'Tue 24 Dec');
});

test('the balance record keeps the next event board out of the completed event free-cell minimum', () => {
  const content = structuredClone(data);
  const first = runPrologue(content, 1, true, state => state.prologue?.event === 2).events[0];
  assert.equal(first.freeCells, 37);
  // A crowded next board does not change the space that the first event needed.
  content.prologue.events[1].board = content.prologue.events[1].board.map(code => code ?? 'grain_1');
  const crowded = runPrologue(content, 1, true, state => state.prologue?.event === 2).events[0];
  assert.deepEqual(crowded, first);
});

test('each take is free, a full board refuses a take, and a cleared blocker gives no coin', () => {
  const state = createGame(data, 1);
  const full = { ...state, board: state.board.map(cell => cell ?? { code: 'beans_1' }) };
  full.discovered = [...new Set([...full.discovered, 'beans_1'])];
  assert.equal(validate(full), true);
  rejected(full, { type: 'spawn', index: full.board.findIndex(cell => cell?.code === 'generator_beans') });
  let memorial = playTo(6);
  assert.deepEqual(memorial.discovered.includes('fruits_3'), false, 'This run has not made Cherry compote.');
  let at: number;
  [memorial, at] = produce(memorial, 'fruits_2');
  const blocked = events[5].layout.obstacles.find(obstacle => obstacle.ingredient === 'fruits_2')!;
  const cleared = act(memorial, { type: 'move', from: at, to: blocked.position });
  assert.equal(cleared.board[blocked.position]?.code, 'fruits_3');
  assert.ok(cleared.discovered.includes('fruits_3'), 'The clearing merge discovers Cherry compote.');
  assert.deepEqual([cleared.coins, cleared.resolvedObstacles], [0, [blocked.id]]);
});

test('the scenes are read in story order: only the first pending scene ends, and a deferred story waits whole', () => {
  const state = playTo(2, { read: false });
  assert.deepEqual(state.pendingScenes, scenes.slice(0, 3));
  rejected(state, { type: 'readScene', id: scenes[2] });
  rejected(state, { type: 'readScene', id: scenes[1] });
  const read = act(state, { type: 'readScene', id: scenes[0] });
  assert.deepEqual(read.pendingScenes, scenes.slice(1, 3));
  // A reload keeps the pending scenes in story order.
  assert.deepEqual(roundTrip(state).pendingScenes, scenes.slice(0, 3));
  // Deferred through all seven events: all 14 scenes wait in story order, and closing 7 ends last and starts act 1.
  let wait = waiting();
  assert.deepEqual(wait.pendingScenes, scenes);
  for (const id of scenes.slice(0, -1)) { wait = act(wait, { type: 'readScene', id }); assert.ok(wait.prologue); }
  wait = act(wait, { type: 'readScene', id: scenes.at(-1)! });
  assert.equal(wait.prologue, null);
  assert.deepEqual(wait.pendingScenes, []);
});

test('a run that serves the quests of each event in reverse order stays valid through the start of act 1', () => {
  const state = playTo(8, { reverse: true });
  assert.equal(state.prologue, null);
  assert.deepEqual([...state.completedQuests].sort(), [...prologueServed].sort());
  assert.deepEqual(state.completedQuests.slice(0, 2), [events[0].quests[1].id, events[0].quests[0].id]);
});

test('each event discovers its sources and its prepared dishes, and the blockers discover nothing', () => {
  const christmas = playTo(3);
  assert.ok(christmas.discovered.includes('mixed_sweet-dough'), 'Sweet dough is known at the start of event 3.');
  assert.ok(roundTrip(christmas).discovered.includes('mixed_sweet-dough'));
  // The last delivery of event 5 starts event 6: the new discoveries are its sources and Flour. Its blocked dishes add none.
  let epiphany = playTo(5);
  const [quest] = events[4].quests;
  for (const { item, quantity } of quest.requirements) for (let count = 0; count < quantity; count++) { let at: number; [epiphany, at] = produce(epiphany, item); kept.add(at); }
  kept.clear();
  const memorial = act(epiphany, { type: 'deliverQuest', id: quest.id });
  assert.deepEqual(memorial.discovered.filter(code => !epiphany.discovered.includes(code)).sort(),
    events[5].board.filter(code => code !== null && !epiphany.discovered.includes(code)).sort());
  assert.ok(memorial.discovered.includes('grain_1') && memorial.discovered.includes('generator_beans'));
});

test('the dishes of an event board are what its sources, prepared dishes, and blocked dishes can make', () => {
  const first = eventDishes(events[0], data), christmas = eventDishes(events[2], data);
  for (const code of ['mixed_coliva', 'mixed_colaci', 'beans_1', 'beans_5']) assert.ok(first.has(code), code);
  assert.ok(christmas.has('mixed_cozonac'));
  assert.ok(!christmas.has('poultry_1') && !christmas.has('poultry_2'));
  for (const event of events) for (const quest of event.quests) for (const { item } of quest.requirements) assert.ok(eventDishes(event, data).has(item), item);
  // A Cozonac from the prepared Sweet dough is a valid save of event 3, and survives a reload. Eggs are not.
  let state = playTo(3), at: number;
  [state, at] = produce(state, 'mixed_cozonac');
  assert.equal(state.board[at]?.code, 'mixed_cozonac');
  assert.deepEqual(roundTrip(state), state);
  const eggs = structuredClone(state);
  eggs.board[firstFreeBoardCell(eggs, data)] = { code: 'poultry_1' };
  eggs.discovered.push('poultry_1');
  assert.equal(validate(eggs), false);
});

test('event dish lookup matches every reachable merge on each authored board', () => {
  for (const event of events) {
    const reachable = new Set(event.board.flatMap(code => code ? [data.items[code].generator?.outputs[0] ?? code] : []));
    for (const obstacle of event.layout.obstacles) reachable.add(obstacle.ingredient);
    for (let count = -1; count !== reachable.size;) {
      count = reachable.size;
      for (const first of [...reachable]) for (const second of [...reachable]) {
        const result = mergeResult(first, second, data);
        if (result) reachable.add(result);
      }
    }
    assert.deepEqual(eventDishes(event, data), reachable, event.id);
  }
});

test('a prologue save that cannot continue is invalid', () => {
  const second = playTo(2), invalid: [string, GameState][] = [];
  // Event 1 with each of its quests served, but no change of event.
  const stuck = createGame(data, 1);
  stuck.completedQuests = events[0].quests.map(quest => quest.id);
  stuck.pendingScenes = [];
  invalid.push(['an event with each quest served', stuck]);
  // Event 7 with each quest served and no pending scene.
  invalid.push(['event 7 with no pending scene', { ...waiting(), pendingScenes: [] }]);
  // A gap in the pending scenes: closing 2 pending while opening 3 is complete.
  const third = playTo(4, { read: false });
  invalid.push(['a gap in the pending scenes', { ...third, pendingScenes: scenes.slice(3, 4).concat(scenes.slice(5, 7)) }]);
  invalid.push(['a scene that the game has not earned', { ...second, pendingScenes: [scenes[3]] }]);
  invalid.push(['a quest of a later event', { ...second, completedQuests: [...second.completedQuests, events[2].quests[0].id] }]);
  invalid.push(['coins in the prologue', { ...second, coins: 5 }]);
  invalid.push(['a moved clock', { ...second, clock: { day: 1, merges: 3 } }]);
  invalid.push(['a source of another event', { ...second, board: second.board.map((cell, index) => index === 30 ? { code: 'generator_pork' } : cell) }]);
  invalid.push(['an unknown event', { ...second, prologue: { event: 8 } }]);
  for (const [name, state] of invalid) {
    assert.equal(validate(state), false, name);
    assert.throws(() => importSave(JSON.stringify({ format: 'scary-snacks', version: 16, state }), validate), name);
  }
  assert.equal(earnedPrologue(second, data).length, 3);
});

test('the last delivery of event 7 waits for closing 7, and its completion starts act 1 once', () => {
  let state = waiting();
  for (const id of scenes.slice(0, -1)) state = act(state, { type: 'readScene', id });
  assert.deepEqual(state.prologue, { event: 7 });
  assert.deepEqual(state.pendingScenes, [scenes.at(-1)]);
  assert.ok(resolveQuests(state, data).every(view => view.status !== 'active'), 'The counter has no ticket.');
  assert.equal(dateText(gameDay(state, data), data), 'Thursday 13 February');
  assert.deepEqual(roundTrip(state), state);
  // Takes and merges still work by the prologue rules.
  act(state, { type: 'spawn', index: state.board.findIndex(cell => cell?.code === 'generator_grain') });
  const started = act(state, { type: 'readScene', id: scenes.at(-1)! });
  assert.equal(started.prologue, null);
  assert.deepEqual(started.board.map(cell => cell?.code ?? null), data.board.initial);
  assert.deepEqual([started.coins, started.clock, started.layoutId, started.pendingScenes], [data.prologue.gift, { day: 1, merges: 0 }, data.board.defaultLayout, []]);
  assert.equal(dateText(started.clock.day, data), 'Saturday 15 February');
  rejected(started, { type: 'readScene', id: scenes.at(-1)! });
  rejected(started, { type: 'readScene', id: scenes[0] });
  // The prologue discoveries stay, also Cozonac and the other dishes of chains that act 1 opens later.
  assert.ok(started.discovered.includes('mixed_cozonac') && started.discovered.includes('generator_pork'));
  assert.deepEqual(roundTrip(started), started);
});

test('act 1 keeps the board rules of act 1: Flour and Colaci are valid on day 1, and Cozonac before the Fruits chain is not', () => {
  const start = actOne();
  for (const code of ['grain_1', 'mixed_colaci']) {
    const state = structuredClone(start);
    state.board[firstFreeBoardCell(state, data)] = { code };
    if (!state.discovered.includes(code)) state.discovered.push(code);
    assert.equal(validate(state), true, code);
  }
  const cozonac = structuredClone(start);
  cozonac.board[firstFreeBoardCell(cozonac, data)] = { code: 'mixed_cozonac' };
  assert.equal(validate(cozonac), false);
  // An act 1 save lists every prologue quest first, and has no prologue scene pending.
  assert.equal(validate({ ...start, completedQuests: start.completedQuests.slice(1) }), false);
  assert.equal(validate({ ...start, pendingScenes: [scenes[0]] }), false);
  assert.equal(validate({ ...start, discovered: [...start.discovered, 'lamb_1'] }), false, 'A discovery of a closed chain that no prologue board can make is invalid.');
});

test('the data check limits the prologue and checks its boards, quests, diets, and gift', () => {
  assert.deepEqual(prologueProblems(data), []);
  const change = (mutate: (content: GameData) => void) => { const content = structuredClone(data); mutate(content); return [...prologueProblems(content), ...dataProblems(content)].join(' '); };
  assert.match(change(content => { content.prologue.events[0].quests[1].requirements = [{ item: 'beans_5', quantity: 2 }, { item: 'mixed_coliva', quantity: 1 }]; }), /beyond the dishes|merges/);
  assert.match(change(content => { content.prologue.events[0].quests[1].requirements = [{ item: 'pork_3', quantity: 1 }]; }), /not a dish of its board|fast/);
  assert.match(change(content => { content.prologue.events[1].quests[0].requirements = [{ item: 'mixed_colaci', quantity: 3 }]; }), /more than one meal/);
  assert.match(change(content => { content.prologue.events[2].quests[0].requirements = [{ item: 'mixed_cabbage-rolls-mamaliga', quantity: 2 }]; }), /not a dish of its board/);
  assert.match(change(content => { content.prologue.events[6].quests[0].requirements = [{ item: 'grain_6', quantity: 2 }, { item: 'vegetables_6', quantity: 1 }]; }), /merges, more than 40/);
  assert.match(change(content => { content.prologue.events[0].quests[0].reward = 5; }), /invalid prologue quest/);
  assert.match(change(content => { content.prologue.gift = 30; }), /gift of 10 to 20/);
  assert.match(change(content => { content.prologue.events[0].board[0] = 'generator_beans'; }), /sources, each once/);
  assert.match(change(content => { content.prologue.events[3].day = content.prologue.events[2].day; }), /a date before act 1/);
});
