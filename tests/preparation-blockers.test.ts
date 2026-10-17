import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { boardObstacles, createGame, dataProblems, freeBoardCells, pendingPreparationObstacles, reduceGame, requiredQuests, unresolvedObstacle, validateGame } from '../src/engine.ts';
import { exportSave, importSave, loadSave, saveGame } from '../src/storage.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
data.board.layouts.push({ id: 'test-preparation-open', obstacles: [] });
const valid = (candidate: unknown) => validateGame(candidate, data);
// Isolate blocker rules from earning the required quests.
function ready(taskIndex = 0): GameState {
  const state = createGame(data);
  state.layoutId = 'test-preparation-open';
  Object.assign(state, { coins: 100000, taskIndex });
  state.completedQuests = requiredQuests(taskIndex, data).map(quest => quest.id);
  state.decorations = data.tasks.slice(0, taskIndex).map(task => task.id);
  state.preparationObstacles = { start: taskIndex, placed: [] };
  const chains = new Set(['bakery', 'warm', 'drinks', ...data.tasks.slice(0, taskIndex).flatMap(task => task.unlock ? [task.unlock] : [])]);
  for (const chain of chains) if (!state.board.some(cell => cell?.code === `generator_${chain}`)) {
    state.board[state.board.indexOf(null)] = { code: `generator_${chain}` };
  }
  state.discovered = Object.values(data.items).filter(item => chains.has(item.chain)).map(item => item.id);
  assert.ok(valid(state));
  return state;
}
function act(state: GameState, action: Action) {
  const before = structuredClone(state), result = reduceGame(state, action, data);
  assert.ok(result.ok, result.message);
  assert.deepEqual(state, before, 'Input state stays unchanged.');
  assert.ok(valid(result.state), `Valid state after ${action.type}.`);
  return result.state;
}
function full(state: GameState) {
  state.board = state.board.map(cell => cell ?? { code: 'bakery_1' });
  assert.ok(valid(state));
  return state;
}
/** Merge the first two Flours: the first one's cell becomes free. */
function mergeOne(state: GameState) {
  const [from, to] = state.board.flatMap((cell, index) => cell?.code === 'bakery_1' ? [index] : []);
  return act(state, { type: 'move', from, to });
}
const active = (state: GameState) => state.preparationObstacles!.placed.filter(entry => !state.resolvedObstacles.includes(entry.id));

test('all 24 preparations have two or three contextual blockers with new art and available low-stage rewards', () => {
  assert.deepEqual(dataProblems(data), []);
  assert.equal(data.board.preparations.length, 24);
  const chains = new Set(['bakery', 'warm', 'drinks']);
  let total = 0;
  for (const [index, batch] of data.board.preparations.entries()) {
    if (data.tasks[index].unlock) chains.add(data.tasks[index].unlock!);
    assert.equal(batch.after, data.tasks[index].id);
    assert.ok(batch.context.trim());
    assert.ok([2, 3].includes(batch.obstacles.length));
    assert.ok(batch.obstacles.some(obstacle => obstacle.atlas === 'preparation'));
    assert.ok(batch.obstacles.some(obstacle => obstacle.atlas === undefined));
    for (const obstacle of batch.obstacles) {
      const item = data.items[obstacle.ingredient];
      assert.ok(chains.has(item.chain) && item.next && !item.generator && item.stage <= 2);
    }
    total += batch.obstacles.length;
  }
  assert.equal(total, 60);
});

test('payment places a batch once and preserves existing items and quest progress', () => {
  const before = ready(), paid = act(before, { type: 'task' });
  assert.equal(paid.preparationObstacles!.placed.length, 2);
  before.board.forEach((cell, index) => { if (cell) assert.deepEqual(paid.board[index], cell); });
  assert.deepEqual(paid.completedQuests, before.completedQuests);
  assert.equal(paid.coins, before.coins - data.tasks[0].cost);
  const next = act(paid, { type: 'spawn', index: 1 });
  assert.deepEqual(next.preparationObstacles, paid.preparationObstacles);
  assert.equal(boardObstacles(next, data)[0].context, data.board.preparations[0].context);
});

test('failed payment leaves placed blockers, queued batches, and the input state unchanged', () => {
  let state = act(full(ready()), { type: 'task' });
  for (let count = 0; count < 4; count++) state = mergeOne(state);
  state.completedQuests = requiredQuests(state.taskIndex, data).map(quest => quest.id);
  state.coins = 0;
  assert.equal(active(state).length, 1);
  assert.equal(pendingPreparationObstacles(state, data).length, 1);
  const before = structuredClone(state), result = reduceGame(state, { type: 'task' }, data);
  assert.equal(result.ok, false);
  assert.match(result.message, /more coins/);
  assert.equal(result.state, state);
  assert.deepEqual(state, before);
});

test('full-board batches queue and drain only above three free cells, with at most three active blockers', () => {
  let state = act(full(ready()), { type: 'task' });
  assert.equal(pendingPreparationObstacles(state, data).length, 2);
  for (let count = 1; count <= 3; count++) {
    state = mergeOne(state);
    assert.equal(freeBoardCells(state, data), count);
    assert.equal(active(state).length, 0);
  }
  state = mergeOne(state);
  assert.equal(freeBoardCells(state, data), 3);
  assert.equal(active(state).length, 1);
  state = mergeOne(state);
  assert.equal(active(state).length, 2);
  state.completedQuests = requiredQuests(state.taskIndex, data).map(quest => quest.id);
  state = act(state, { type: 'task' });
  assert.equal(pendingPreparationObstacles(state, data).length, 3);
  state = mergeOne(state);
  assert.equal(active(state).length, 3);
  state = mergeOne(state);
  assert.equal(active(state).length, 3);
  assert.equal(pendingPreparationObstacles(state, data).length, 2);
});

test('all preparation blockers require a matching ingredient on their own cell', () => {
  let state = act(ready(2), { type: 'task' });
  const [clutter, anchor] = state.preparationObstacles!.placed;
  const beside = clutter.position + data.board.columns, source = beside + data.board.columns;
  state.board[beside] = { code: 'bakery_1' }; state.board[source] = { code: 'bakery_1' };
  state = act(state, { type: 'move', from: source, to: beside });
  assert.ok(!state.resolvedObstacles.includes(clutter.id));
  const ingredient = unresolvedObstacle(state, clutter.position, data)!.ingredient;
  state.board[source] = { code: ingredient };
  state = act(state, { type: 'move', from: source, to: clutter.position });
  assert.ok(state.resolvedObstacles.includes(clutter.id));
  assert.equal(state.board[clutter.position]?.code, data.items[ingredient].next);
  state.board[10] = { code: 'bakery_1' };
  const failed = reduceGame(state, { type: 'move', from: 10, to: anchor.position }, data);
  assert.equal(failed.ok, false); assert.equal(failed.state, state);
  state.board[10] = { code: 'sweet_1' };
  state = act(state, { type: 'move', from: 10, to: anchor.position });
  assert.equal(state.board[anchor.position]?.code, 'sweet_2');
  assert.ok(state.resolvedObstacles.includes(anchor.id));
});

test('a newly unlocked source takes the last empty cell before its blocker batch', () => {
  const state = full(ready(2)); state.board[0] = null;
  const paid = act(state, { type: 'task' });
  assert.equal(paid.board[0]?.code, 'generator_sweet');
  assert.equal(active(paid).length, 0);
  assert.equal(pendingPreparationObstacles(paid, data).length, 2);
});

test('existing saves adopt at the next successful preparation without adding earlier batches', () => {
  const state = ready(4); delete state.preparationObstacles;
  assert.ok(valid(state));
  const continued = mergeOne(state);
  assert.equal(continued.preparationObstacles, undefined);
  const paid = act(continued, { type: 'task' });
  assert.equal(paid.preparationObstacles!.start, 4);
  assert.deepEqual(paid.preparationObstacles!.placed.map(entry => entry.id), data.board.preparations[4].obstacles.map(obstacle => obstacle.id));
});

test('pending and partly cleared batches survive export, reload, failed writes, and retry without duplicates', () => {
  let state = act(full(ready()), { type: 'task' });
  assert.deepEqual(importSave(exportSave(state, valid), valid), state);
  let text: string | null = null, reject = false;
  const storage = { getItem: () => text, removeItem: () => { text = null; }, setItem: (_key: string, value: string) => {
    if (reject) throw new Error('Storage full.'); text = value;
  } };
  assert.equal(saveGame(storage, state, valid).ok, true);
  const durable = structuredClone(state);
  for (let count = 0; count < 4; count++) state = mergeOne(state);
  assert.equal(active(state)[0].position, 0);
  const obstacle = unresolvedObstacle(state, 0, data)!;
  state.board[7] = { code: obstacle.ingredient };
  state = act(state, { type: 'move', from: 7, to: 0 });
  assert.equal(state.resolvedObstacles.length, 1);
  assert.deepEqual(importSave(exportSave(state, valid), valid), state);
  reject = true;
  assert.equal(saveGame(storage, state, valid).ok, false);
  assert.deepEqual(loadSave(storage, valid).state, durable);
  reject = false;
  assert.equal(saveGame(storage, state, valid).ok, true);
  assert.deepEqual(loadSave(storage, valid).state, state);
  assert.equal(new Set(state.preparationObstacles!.placed.map(entry => entry.id)).size, 2);
});

test('save validation rejects malformed adoption, placement, overlap, and resolution records', () => {
  const state = act(ready(), { type: 'task' });
  const mutations: ((value: GameState) => void)[] = [
    value => { value.preparationObstacles!.start = -1; }, value => { value.preparationObstacles!.start = 2; },
    value => { value.preparationObstacles!.placed[0].id = 'unknown'; },
    value => { value.preparationObstacles!.placed[0].id = data.board.preparations[1].obstacles[0].id; },
    value => { value.preparationObstacles!.placed[1].id = value.preparationObstacles!.placed[0].id; },
    value => { value.preparationObstacles!.placed[1].position = value.preparationObstacles!.placed[0].position; },
    value => { value.preparationObstacles!.placed[0].position = 42; },
    value => { value.board[value.preparationObstacles!.placed[0].position] = { code: 'bakery_1' }; },
    value => { value.preparationObstacles!.placed.pop(); value.resolvedObstacles.push(data.board.preparations[0].obstacles[1].id); },
    value => { value.layoutId = data.board.defaultLayout; },
    value => {
      value.resolvedObstacles.push(value.preparationObstacles!.placed[0].id);
      value.board = value.board.map(cell => cell?.code === 'bakery_1' ? null : cell);
      value.discovered = value.discovered.filter(code => code !== 'bakery_1');
    },
  ];
  for (const mutate of mutations) { const malformed = structuredClone(state); mutate(malformed); assert.equal(valid(malformed), false, String(mutate)); }
});

test('a resolved historic cell can hold a later blocker without hiding that blocker', () => {
  const state = ready(2), batches = data.board.preparations;
  state.preparationObstacles = { start: 0, placed: [
    { id: batches[0].obstacles[0].id, position: 0 }, { id: batches[0].obstacles[1].id, position: 2 },
    { id: batches[1].obstacles[0].id, position: 0 },
  ] };
  state.resolvedObstacles = batches[0].obstacles.map(obstacle => obstacle.id);
  assert.ok(valid(state));
  assert.equal(unresolvedObstacle(state, 0, data)?.id, batches[1].obstacles[0].id);
});

test('content validation rejects duplicate IDs, unavailable rewards, bad sprites, counts, and story order', () => {
  const mutations: ((value: GameData) => void)[] = [
    value => { value.board.preparations[0].obstacles[0].id = value.board.preparations[0].obstacles[1].id; },
    value => { value.board.preparations[0].obstacles[0].id = 'old-crate'; },
    value => { value.board.preparations[0].obstacles[0].ingredient = 'produce_1'; },
    value => { value.board.preparations[0].obstacles[0].sprite = 12; },
    value => { value.board.preparations[0].obstacles[1].sprite = 4; },
    value => { value.board.preparations[0].obstacles.pop(); },
    value => { value.board.preparations[1].obstacles.push({ ...value.board.preparations[1].obstacles[0], id: 'extra' }); },
    value => { value.board.preparations[0].after = 'task_2'; },
    value => { value.board.preparations[0].context = ''; },
  ];
  for (const mutate of mutations) { const malformed = structuredClone(data); mutate(malformed); assert.ok(dataProblems(malformed).length, String(mutate)); }
});
