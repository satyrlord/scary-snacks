import test from 'node:test';
import assert from 'node:assert/strict';
import { availableChains, boardObstacles, freeBoardCells, pendingPreparationObstacles, requiredQuests, unresolvedObstacle } from '../src/model.ts';
import { KEEP_FREE, reduceGame } from '../src/engine.ts';
import { dataProblems } from '../src/content.ts';
import { exportSave, importSave, loadSave, saveGame } from '../src/storage.ts';
import type { GameData, GameState } from '../src/model.ts';
import { moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, addOpenLayout, data, openGame, payDay, prologueServed, rejected, validate, know, withTickets } from './support.ts';

addOpenLayout();
// Isolate blocker rules from earning the required quests.
function ready(taskIndex = 0): GameState {
  const state = openGame();
  Object.assign(state, { coins: 100000, taskIndex });
  state.completedQuests = [...prologueServed, ...requiredQuests(taskIndex, data).map(quest => quest.id)];
  state.decorations = data.tasks.slice(0, taskIndex).map(task => task.id);
  state.preparationObstacles = { start: taskIndex, placed: [] };
  moveTo(state, payDay(taskIndex), data);
  const chains = new Set(availableChains(state, data));
  for (const chain of chains) if (!data.chains.find(value => value.id === chain)!.season && !state.sources.includes(chain)) state.sources.push(chain);
  state.discovered = Object.values(data.items).filter(item => chains.has(item.chain)).map(item => item.id);
  assert.ok(validate(state));
  return state;
}
function full(state: GameState) {
  state.board = state.board.map(cell => cell ?? { code: 'grain_1' });
  assert.ok(validate(state));
  return state;
}
/** Merge the first two Flours: the first one's cell becomes free. */
function mergeOne(state: GameState) {
  const [from, to] = state.board.flatMap((cell, index) => cell?.code === 'grain_1' ? [index] : []);
  return act(state, { type: 'move', from, to });
}
const active = (state: GameState) => state.preparationObstacles!.placed.filter(entry => !state.resolvedObstacles.includes(entry.id));

test('all 66 preparations have two or three contextual blockers with new art and available low-stage rewards, and the purchase has none', () => {
  assert.deepEqual(dataProblems(data), []);
  const tasks = data.tasks.filter(task => !task.purchase);
  assert.equal(data.board.preparations.length, 66);
  let total = 0;
  for (const [index, batch] of data.board.preparations.entries()) {
    const task = data.tasks.indexOf(tasks[index]), chains = new Set(availableChains({ taskIndex: task + 1, clock: { day: data.chapters[tasks[index].chapter - 1].opens } }, data));
    assert.equal(batch.after, tasks[index].id);
    assert.ok(batch.context.trim());
    assert.ok([2, 3].includes(batch.obstacles.length));
    assert.equal(batch.obstacles.filter(obstacle => obstacle.atlas === 'preparation').length, 1, 'Each batch has one blocker with a contextual picture.');
    assert.ok(batch.obstacles.some(obstacle => obstacle.atlas === undefined));
    for (const obstacle of batch.obstacles) {
      const item = data.items[obstacle.ingredient];
      assert.ok(chains.has(item.chain) && item.next && !item.generator && item.stage <= 2, obstacle.id);
    }
    total += batch.obstacles.length;
  }
  assert.equal(total, 164);
});

test('payment places a batch once and preserves existing items and quest progress', () => {
  const before = ready(), paid = act(before, { type: 'task' });
  assert.equal(paid.preparationObstacles!.placed.length, 2);
  before.board.forEach((cell, index) => { if (cell) assert.deepEqual(paid.board[index], cell); });
  assert.deepEqual(paid.completedQuests, before.completedQuests);
  assert.equal(paid.coins, before.coins - data.tasks[0].cost);
  const next = act(paid, { type: 'spawn', chain: 'grain' });
  assert.deepEqual(next.preparationObstacles, paid.preparationObstacles);
  assert.equal(boardObstacles(next, data)[0].context, data.board.preparations[0].context);
});

test('failed payment leaves placed blockers, queued batches, and the input state unchanged', () => {
  let state = act(full(ready()), { type: 'task' });
  for (let count = 0; count <= KEEP_FREE; count++) state = mergeOne(state);
  state.completedQuests = [...prologueServed, ...requiredQuests(state.taskIndex, data).map(quest => quest.id)];
  state.coins = 0;
  assert.equal(active(state).length, 1);
  assert.equal(pendingPreparationObstacles(state, data).length, 1);
  assert.match(rejected(state, { type: 'task' }).message, /more coins/);
});

test('full-board batches queue while only four cells are free, drain when a fifth frees, and keep at most three active blockers', () => {
  assert.equal(KEEP_FREE, 4);
  let state = act(full(ready()), { type: 'task' });
  assert.equal(pendingPreparationObstacles(state, data).length, 2);
  for (let count = 1; count <= 4; count++) {
    state = mergeOne(state);
    assert.equal(freeBoardCells(state, data), count);
    assert.equal(active(state).length, 0);
    assert.equal(pendingPreparationObstacles(state, data).length, 2);
  }
  state = mergeOne(state);
  assert.equal(freeBoardCells(state, data), 4);
  assert.equal(active(state).length, 1);
  state = mergeOne(state);
  assert.equal(freeBoardCells(state, data), 4);
  assert.equal(active(state).length, 2);
  state.completedQuests = [...prologueServed, ...requiredQuests(state.taskIndex, data).map(quest => quest.id)];
  state = act(state, { type: 'task' });
  assert.equal(freeBoardCells(state, data), 4);
  assert.equal(pendingPreparationObstacles(state, data).length, 3);
  state = mergeOne(state);
  assert.equal(active(state).length, 3);
  assert.equal(freeBoardCells(state, data), 4);
  state = mergeOne(state);
  assert.equal(active(state).length, 3);
  assert.equal(freeBoardCells(state, data), 5);
  assert.equal(pendingPreparationObstacles(state, data).length, 2);
});

test('a board with four free cells holds back a waiting blocker, so one Linden tea fits from scratch', () => {
  let state = act(full(ready()), { type: 'task' });
  for (let count = 0; count < KEEP_FREE; count++) state = mergeOne(state);
  assert.equal(freeBoardCells(state, data), KEEP_FREE);
  assert.equal(pendingPreparationObstacles(state, data).length, 2);
  // Stages 1 to 3 wait on three cells while the fourth takes the next Elderflowers.
  const make = (stage: number): number => {
    if (stage === 1) {
      const empty = state.board.indexOf(null), coins = state.coins;
      state = act(state, { type: 'spawn', chain: 'herbs' });
      assert.equal(state.board[empty]?.code, 'herbs_1');
      assert.equal(state.coins, coins, 'The Herb basket takes for free.');
      return empty;
    }
    const from = make(stage - 1), to = make(stage - 1);
    state = act(state, { type: 'move', from, to });
    assert.equal(state.board[to]?.code, `herbs_${stage}`);
    return to;
  };
  const tea = make(4);
  assert.equal(state.board[tea]?.code, 'herbs_4');
  assert.equal(freeBoardCells(state, data), KEEP_FREE - 1);
  assert.equal(active(state).length, 0);
});

test('a merge that makes a new dish and places a waiting blocker keeps both notices and discovers only the dish', () => {
  let state = act(full(ready()), { type: 'task' });
  for (let count = 1; count <= KEEP_FREE; count++) state = mergeOne(state);
  state.discovered = state.discovered.filter(code => data.items[code].generator || state.board.some(cell => cell?.code === code));
  withTickets(state);
  const known = [...state.discovered];
  const [from, to] = state.board.flatMap((cell, index) => cell?.code === 'grain_2' ? [index] : []);
  const result = reduceGame(state, { type: 'move', from, to }, data);
  assert.ok(result.ok && validate(result.state));
  assert.equal(active(result.state).length, 1);
  assert.equal(result.message, `${data.items.grain_3.name} is a new dish! It is in the recipe book now. 1 preparation blocker placed.`);
  assert.deepEqual(result.state.discovered, [...known, 'grain_3']);
});

test('preparation blockers clear only with a merge partner on their own cell, and each clear gives one coin', () => {
  let state = act(ready(2), { type: 'task' });
  const coins = state.coins;
  const [clutter, anchor] = state.preparationObstacles!.placed;
  const beside = clutter.position + data.board.columns, source = beside + data.board.columns;
  state.board[beside] = { code: 'grain_1' }; state.board[source] = { code: 'grain_1' };
  state = act(state, { type: 'move', from: source, to: beside });
  assert.ok(!state.resolvedObstacles.includes(clutter.id));
  assert.equal(state.coins, coins);
  const ingredient = unresolvedObstacle(state, clutter.position, data)!.ingredient;
  state.board[source] = { code: ingredient };
  state = act(state, { type: 'move', from: source, to: clutter.position });
  assert.ok(state.resolvedObstacles.includes(clutter.id));
  assert.equal(state.board[clutter.position]?.code, data.items[ingredient].next);
  assert.equal(state.coins, coins + 1);
  state.board[10] = { code: 'grain_1' };
  assert.match(rejected(state, { type: 'move', from: 10, to: anchor.position }).message, /recipe partner/);
  state.board[10] = { code: 'dairy_1' }; know(state, 'dairy_1');
  state = act(state, { type: 'move', from: 10, to: anchor.position });
  assert.equal(state.board[anchor.position]?.code, 'dairy_2');
  assert.ok(state.resolvedObstacles.includes(anchor.id));
  assert.equal(state.coins, coins + 2);
});

test('a newly unlocked source joins the source tab and leaves the last empty cell to its blocker batch', () => {
  const state = full(ready(2)); state.board[0] = null;
  const paid = act(state, { type: 'task' });
  assert.equal(paid.sources.at(-1), 'dairy');
  assert.equal(paid.board[0], null);
  assert.equal(active(paid).length, 0);
  assert.equal(pendingPreparationObstacles(paid, data).length, 2);
});

test('existing saves adopt at the next successful preparation without adding earlier batches', () => {
  const state = ready(4); delete state.preparationObstacles;
  assert.ok(validate(state));
  const continued = mergeOne(state);
  assert.equal(continued.preparationObstacles, undefined);
  const paid = act(continued, { type: 'task' });
  assert.equal(paid.preparationObstacles!.start, 4);
  assert.deepEqual(paid.preparationObstacles!.placed.map(entry => entry.id), data.board.preparations[4].obstacles.map(obstacle => obstacle.id));
});

test('pending and partly cleared batches survive export, reload, failed writes, and retry without duplicates', () => {
  let state = act(full(ready()), { type: 'task' });
  assert.deepEqual(importSave(exportSave(state, validate), validate), state);
  let text: string | null = null, reject = false;
  const storage = { getItem: () => text, removeItem: () => { text = null; }, setItem: (_key: string, value: string) => {
    if (reject) throw new Error('Storage full.'); text = value;
  } };
  assert.equal(saveGame(storage, state, validate).ok, true);
  const durable = structuredClone(state);
  for (let count = 0; count <= KEEP_FREE; count++) state = mergeOne(state);
  assert.equal(active(state)[0].position, 0);
  // A Flour on the full board becomes the dish of the blocker, so the clear frees one more cell.
  const obstacle = unresolvedObstacle(state, 0, data)!, spare = state.board.findIndex(cell => cell?.code === 'grain_1');
  state.board[spare] = { code: obstacle.ingredient };
  state = act(state, { type: 'move', from: spare, to: 0 });
  assert.equal(state.resolvedObstacles.length, 1);
  assert.deepEqual(importSave(exportSave(state, validate), validate), state);
  reject = true;
  assert.equal(saveGame(storage, state, validate).ok, false);
  assert.deepEqual(loadSave(storage, validate).state, durable);
  reject = false;
  assert.equal(saveGame(storage, state, validate).ok, true);
  assert.deepEqual(loadSave(storage, validate).state, state);
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
    value => { value.board[value.preparationObstacles!.placed[0].position] = { code: 'grain_1' }; },
    value => { value.preparationObstacles!.placed.pop(); value.resolvedObstacles.push(data.board.preparations[0].obstacles[1].id); },
    value => { value.layoutId = data.board.defaultLayout; },
    value => {
      value.resolvedObstacles.push(value.preparationObstacles!.placed[0].id);
      value.board = value.board.map(cell => cell?.code === 'grain_1' ? null : cell);
      value.discovered = value.discovered.filter(code => code !== 'grain_1');
    },
  ];
  for (const mutate of mutations) { const malformed = structuredClone(state); mutate(malformed); assert.equal(validate(malformed), false, String(mutate)); }
});

test('a resolved historic cell can hold a later blocker without hiding that blocker', () => {
  const state = ready(2), batches = data.board.preparations;
  state.preparationObstacles = { start: 0, placed: [
    { id: batches[0].obstacles[0].id, position: 0 }, { id: batches[0].obstacles[1].id, position: 2 },
    { id: batches[1].obstacles[0].id, position: 0 },
  ] };
  state.resolvedObstacles = batches[0].obstacles.map(obstacle => obstacle.id);
  assert.ok(validate(state));
  assert.equal(unresolvedObstacle(state, 0, data)?.id, batches[1].obstacles[0].id);
});

test('content validation rejects duplicate IDs, unavailable rewards, bad sprites, counts, and story order', () => {
  const mutations: ((value: GameData) => void)[] = [
    value => { value.board.preparations[0].obstacles[0].id = value.board.preparations[0].obstacles[1].id; },
    value => { value.board.preparations[0].obstacles[0].id = 'old-crate'; },
    value => { value.board.preparations[0].obstacles[0].ingredient = 'fish_1'; },
    value => { value.board.preparations[0].obstacles[0].sprite = 12; },
    value => { value.board.preparations[0].obstacles[1].sprite = 4; },
    value => { value.board.preparations[0].obstacles.pop(); },
    value => { value.board.preparations[1].obstacles.push({ ...value.board.preparations[1].obstacles[0], id: 'extra' }); },
    value => { value.board.preparations[0].after = 'task_2'; },
    value => { value.board.preparations[0].context = ''; },
  ];
  for (const mutate of mutations) { const malformed = structuredClone(data); mutate(malformed); assert.ok(dataProblems(malformed).length, String(mutate)); }
});
