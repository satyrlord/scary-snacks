import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, currentTask, questProblems, reduceGame, taskEligibility, taskGoalProblems, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
function act(state: GameState, action: Action, content = data): GameState {
  const before = structuredClone(state);
  const result = reduceGame(state, action, content);
  assert.ok(result.ok, result.message);
  assert.deepEqual(state, before);
  assert.ok(validateGame(result.state, content));
  return result.state;
}
function rejected(state: GameState, action: Action = { type: 'task' }, content = data) {
  const before = structuredClone(state);
  const result = reduceGame(state, action, content);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.deepEqual(state, before);
  assert.equal(result.event, null);
  return result;
}
function checkpoint(count: number): GameState {
  let state = createGame(data);
  // These controlled resources isolate the completion boundary and generator placement.
  state.coins = data.tasks.reduce((sum, task) => sum + task.cost, 0);
  Object.assign(state, data.tasks.at(-1)!.goals);
  for (let index = 0; index < count; index++) state = act(state, { type: 'task' });
  return state;
}
function sellToCost(start: GameState): GameState {
  let state = start;
  while (state.coins < currentTask(state, data)!.cost) {
    const index = state.board.indexOf(null);
    state = act(state, { type: 'spawn', index: state.board.findIndex(cell => cell?.code === 'generator_bakery') });
    state = act(state, { type: 'sell', index });
  }
  return state;
}

test('each preparation has explicit, nondecreasing lifetime service and merge goals', () => {
  assert.deepEqual(taskGoalProblems(data), []);
  let hours = 0;
  for (const task of data.tasks) {
    hours += task.work.hours;
    assert.deepEqual(task.goals, { served: hours * 2, merges: hours * 4 });
  }
  assert.ok(data.tasks.every(task => !task.requiresQuest), 'The authored character quests stay optional.');
  for (const field of ['served', 'merges'] as const) {
    for (const value of [-1, 0.5, NaN, Infinity, 1_000_000_001, '2', null, undefined]) {
      const content = structuredClone(data);
      Object.assign(content.tasks[0].goals, { [field]: value });
      assert.ok(taskGoalProblems(content).length, `${field}: ${String(value)}`);
      assert.equal(validateGame(createGame(data), content), false);
    }
    const decreasing = structuredClone(data);
    decreasing.tasks[1].goals[field] = 0;
    assert.match(taskGoalProblems(decreasing).join(' '), /must not decrease/);
    const equal = structuredClone(data);
    equal.tasks[1].goals[field] = equal.tasks[0].goals[field];
    assert.deepEqual(taskGoalProblems(equal), []);
  }
  const missing = structuredClone(data);
  Reflect.deleteProperty(missing.tasks[0], 'goals');
  assert.ok(taskGoalProblems(missing).length);
  const zero = structuredClone(data);
  zero.tasks[0].goals = { served: 0, merges: 0 };
  assert.deepEqual(taskGoalProblems(zero), []);
});

test('eligibility lists every unmet numeric requirement and preserves the exact totals above a goal', () => {
  const state = createGame(data);
  const eligibility = taskEligibility(state, data);
  assert.equal(eligibility.task, data.tasks[0]);
  assert.equal(eligibility.ready, false);
  assert.deepEqual(eligibility.requirements, [
    { kind: 'coins', current: 0, required: data.tasks[0].cost, met: false },
    { kind: 'served', current: 0, required: data.tasks[0].goals.served, met: false },
    { kind: 'merges', current: 0, required: data.tasks[0].goals.merges, met: false },
  ]);
  assert.equal(eligibility.blockers.length, 3);
  assert.equal(rejected(state).message, eligibility.blockers.join(' '));
  const excess = { coins: data.tasks[0].cost + 100, served: data.tasks[0].goals.served + 70, merges: data.tasks[0].goals.merges + 150 };
  Object.assign(state, excess);
  const ready = taskEligibility(state, data);
  assert.ok(ready.ready);
  assert.deepEqual(ready.blockers, []);
  assert.deepEqual(ready.requirements.map(requirement => 'current' in requirement ? requirement.current : null), [excess.coins, excess.served, excess.merges]);
  assert.ok(ready.requirements.every(requirement => requirement.met));
  const completed = act(state, { type: 'task' });
  assert.equal(completed.served, excess.served);
  assert.equal(completed.merges, excess.merges);
});

test('exact thresholds complete once without spending counters or replacing the three live orders', () => {
  const state = createGame(data);
  Object.assign(state, { coins: data.tasks[0].cost, ...data.tasks[0].goals });
  assert.ok(taskEligibility(state, data).ready);
  const completed = act(state, { type: 'task' });
  assert.equal(completed.taskIndex, 1);
  assert.deepEqual(completed.decorations, ['task_1']);
  assert.equal(completed.coins, 0);
  assert.equal(completed.served, data.tasks[0].goals.served);
  assert.equal(completed.merges, data.tasks[0].goals.merges);
  assert.deepEqual(completed.orders, state.orders);
  assert.equal(completed.seed, state.seed);
  rejected(completed);
  assert.equal(completed.taskIndex, 1);
});

test('one missing coin blocks completion after both lifetime goals are met', () => {
  const state = createGame(data);
  Object.assign(state, { coins: data.tasks[0].cost - 1, ...data.tasks[0].goals, xp: 100 });
  assert.deepEqual(taskEligibility(state, data).blockers, ['Earn 1 more coin to pay for this preparation.']);
  assert.match(rejected(state).message, /1 more coin/);
  assert.deepEqual(state.claimedLevelRewards, [], 'A failed preparation does not claim a pending level reward.');
});

test('free generation and sales cannot complete the first preparation without service', () => {
  let state = createGame(data);
  state = act(state, { type: 'move', from: 13, to: 14 });
  state = act(state, { type: 'spawn', index: 1 });
  const flour = state.board.findIndex(cell => cell?.code === 'bakery_1');
  state = act(state, { type: 'spawn', index: 1 });
  state = act(state, { type: 'move', from: flour, to: state.board.findIndex((cell, index) => index !== flour && cell?.code === 'bakery_1') });
  while (state.merges < data.tasks[0].goals.merges) {
    const first = state.board.indexOf(null);
    state = act(state, { type: 'spawn', index: 1 });
    const second = state.board.indexOf(null);
    state = act(state, { type: 'spawn', index: 1 });
    state = act(state, { type: 'move', from: first, to: second });
    state = act(state, { type: 'sell', index: second });
  }
  state = sellToCost(state);
  assert.equal(state.served, 0);
  assert.equal(state.merges, data.tasks[0].goals.merges);
  assert.ok(state.coins >= data.tasks[0].cost);
  assert.deepEqual(taskEligibility(state, data).blockers, [`Serve ${data.tasks[0].goals.served} more orders for this preparation.`]);
  rejected(state);
});

test('service and sale income cannot complete a preparation without the merge goal', () => {
  let state = createGame(data);
  // Prior service isolates the final service action from the separate merge requirement.
  state.served = data.tasks[0].goals.served - 1;
  const order = state.orders.find(order => order.requirements.every(code => data.items[code].stage === 1))!;
  state = act(state, { type: 'serve', id: order.id });
  state = sellToCost(state);
  assert.equal(state.served, data.tasks[0].goals.served);
  assert.equal(state.merges, 0);
  assert.deepEqual(taskEligibility(state, data).blockers, [`Make ${data.tasks[0].goals.merges} more merges for this preparation.`]);
  rejected(state);
});

test('generator placement is part of eligibility and failed completion leaves every field unchanged', () => {
  const state = checkpoint(2);
  state.board = state.board.map(cell => cell ?? { code: 'bakery_1' });
  state.inventory = Array.from({ length: data.inventoryCapacity }, () => ({ code: 'bakery_1' }));
  Object.assign(state, { coins: 0, served: 0, merges: 0, xp: 900 });
  assert.ok(validateGame(state, data));
  const eligibility = taskEligibility(state, data);
  assert.equal(eligibility.blockers.length, 4);
  assert.deepEqual(eligibility.requirements.at(-1), { kind: 'space', source: data.items.generator_sweet.name, met: false });
  assert.equal(rejected(state).message, eligibility.blockers.join(' '));
  Object.assign(state, { coins: data.tasks[2].cost, ...data.tasks[2].goals });
  assert.equal(taskEligibility(state, data).blockers.length, 1);
  rejected(state);
  state.inventory.pop();
  assert.ok(taskEligibility(state, data).ready);
  const completed = act(state, { type: 'task' });
  assert.equal(completed.inventory.at(-1)?.code, 'generator_sweet');
  assert.equal(completed.coins, 0);
  assert.deepEqual([completed.served, completed.merges], [data.tasks[2].goals.served, data.tasks[2].goals.merges]);
});

test('a named quest prerequisite is visible and unknown or cyclic prerequisites are rejected', () => {
  const content = structuredClone(data);
  content.tasks[0].requiresQuest = 'mara-welcome';
  assert.deepEqual(questProblems(content), []);
  const state = createGame(content);
  Object.assign(state, { coins: data.tasks[0].cost, ...data.tasks[0].goals });
  const title = content.quests.find(quest => quest.id === 'mara-welcome')!.title;
  assert.deepEqual(taskEligibility(state, content).requirements.at(-1), { kind: 'quest', questId: 'mara-welcome', title, met: false });
  assert.equal(rejected(state, { type: 'task' }, content).message, `Complete the quest "${title}" before this preparation.`);
  state.completedQuests.push('mara-welcome');
  assert.ok(taskEligibility(state, content).ready);
  act(state, { type: 'task' }, content);
  content.tasks[0].requiresQuest = 'absent';
  assert.match(questProblems(content).join(' '), /unknown prerequisite/);
  content.tasks[0].requiresQuest = 'mara-table';
  assert.match(questProblems(content).join(' '), /cycle/);
});

test('the last preparation needs its own exact goals and repeated completion changes nothing', () => {
  const state = checkpoint(23);
  const task = data.tasks[23];
  Object.assign(state, { coins: task.cost, served: task.goals.served - 1, merges: task.goals.merges - 1 });
  assert.ok(validateGame(state, data), 'Older completed preparations remain valid with lower recorded counters.');
  assert.deepEqual(taskEligibility(state, data).blockers, ['Serve 1 more order for this preparation.', 'Make 1 more merge for this preparation.']);
  rejected(state);
  Object.assign(state, task.goals);
  const completed = act(state, { type: 'task' });
  assert.equal(completed.taskIndex, 24);
  assert.equal(completed.coins, 0);
  assert.deepEqual([completed.served, completed.merges], [task.goals.served, task.goals.merges]);
  assert.deepEqual(completed.orders, state.orders);
  assert.deepEqual(taskEligibility(completed, data), { task: null, ready: false, requirements: [], blockers: ['The community supper is ready. You can keep serving orders.'] });
  rejected(completed);
});

test('only a successful merge or ordinary order service adds its own goal credit', () => {
  let state = createGame(data);
  const unchanged = (action: Action) => {
    const totals = [state.served, state.merges];
    state = act(state, action);
    assert.deepEqual([state.served, state.merges], totals);
  };
  unchanged({ type: 'move', from: 22, to: 0 });
  unchanged({ type: 'move', from: 0, to: 27 });
  const empty = state.board.indexOf(null);
  unchanged({ type: 'spawn', index: 1 });
  unchanged({ type: 'store', index: empty });
  unchanged({ type: 'retrieve', index: 0 });
  unchanged({ type: 'sell', index: empty });
  rejected(state, { type: 'move', from: 13, to: 13 });
  rejected(state, { type: 'serve', id: state.orders[1].id });
  rejected(state, { type: 'replay' } as unknown as Action);
  state = act(state, { type: 'move', from: 13, to: 14 });
  assert.deepEqual([state.served, state.merges], [0, 1]);
  rejected(state, { type: 'move', from: 13, to: 14 });
  const order = state.orders[0];
  state = act(state, { type: 'serve', id: order.id });
  assert.deepEqual([state.served, state.merges], [1, 1]);
  rejected(state, { type: 'serve', id: order.id });
  assert.deepEqual([state.served, state.merges], [1, 1]);
});
