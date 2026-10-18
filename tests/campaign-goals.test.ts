import test from 'node:test';
import assert from 'node:assert/strict';
import { requiredQuests, taskEligibility, unresolvedObstacle } from '../src/model.ts';
import { validateGame } from '../src/engine.ts';
import { dataProblems, questProblems } from '../src/content.ts';
import type { Action } from '../src/model.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';
import { act, addOpenLayout, data, openGame, rejected } from './support.ts';

addOpenLayout();
/** Before the payment of the preparation at index count: its quests delivered and its exact cost in coins. */
const checkpoint = (count: number) => checkpointState(data, count, openGame());
/** The same checkpoint before the quests that open with the previous preparation are delivered. */
const withoutWindow = (count: number) => ({ ...checkpoint(count), completedQuests: checkpoint(count - 1).completedQuests });

test('each preparation needs every quest that opens before it, and the finale needs every quest', () => {
  assert.deepEqual(questProblems(data), []);
  assert.deepEqual(requiredQuests(0, data).map(quest => quest.id), data.quests.filter(quest => quest.afterTask === null && !quest.afterQuest).map(quest => quest.id));
  for (let index = 1; index < data.tasks.length; index++) {
    const earlier = requiredQuests(index - 1, data), now = requiredQuests(index, data);
    assert.deepEqual(now.slice(0, earlier.length), earlier, 'Each preparation keeps the quests of the one before it.');
    assert.ok(now.length > earlier.length, `${data.tasks[index].id} adds at least one quest.`);
  }
  assert.deepEqual(requiredQuests(data.tasks.length - 1, data), data.quests);
});

test('eligibility lists the unmet coins and quests and keeps the exact totals above a requirement', () => {
  const state = openGame();
  const quests = requiredQuests(0, data);
  const eligibility = taskEligibility(state, data);
  assert.equal(eligibility.task, data.tasks[0]);
  assert.equal(eligibility.ready, false);
  assert.deepEqual(eligibility.requirements, [
    { kind: 'coins', current: 0, required: data.tasks[0].cost, met: false },
    { kind: 'quests', current: 0, required: quests.length, met: false },
  ]);
  assert.deepEqual(eligibility.blockers, [`Earn ${data.tasks[0].cost} more coins to pay for this preparation.`, `Deliver ${quests.length} more quests for this preparation.`]);
  assert.equal(rejected(state, { type: 'task' }).message, eligibility.blockers.join(' '));
  Object.assign(state, { coins: data.tasks[0].cost + 100, completedQuests: quests.map(quest => quest.id) });
  const ready = taskEligibility(state, data);
  assert.ok(ready.ready);
  assert.deepEqual(ready.blockers, []);
  assert.deepEqual(ready.requirements.map(requirement => 'current' in requirement ? requirement.current : null), [data.tasks[0].cost + 100, quests.length]);
  const completed = act(state, { type: 'task' });
  assert.equal(completed.coins, 100);
  assert.deepEqual(completed.completedQuests, state.completedQuests, 'A payment does not spend quests.');
});

test('exact coins and quests complete a preparation once', () => {
  const state = checkpoint(0);
  assert.equal(state.coins, data.tasks[0].cost);
  assert.ok(taskEligibility(state, data).ready);
  const completed = act(state, { type: 'task' });
  assert.equal(completed.taskIndex, 1);
  assert.deepEqual(completed.decorations, ['task_1']);
  assert.equal(completed.coins, 0);
  rejected(completed, { type: 'task' });
  assert.equal(completed.taskIndex, 1);
});

test('one missing coin blocks completion after the quests are delivered', () => {
  const state = { ...checkpoint(5), coins: data.tasks[5].cost - 1 };
  assert.deepEqual(taskEligibility(state, data).blockers, ['Earn 1 more coin to pay for this preparation.']);
  assert.match(rejected(state, { type: 'task' }).message, /1 more coin/);
});

test('one missing quest blocks completion with enough coins', () => {
  const ready = checkpoint(5);
  const state = { ...ready, completedQuests: ready.completedQuests.slice(0, -1), coins: 100_000 };
  assert.ok(validateGame(state, data));
  assert.deepEqual(taskEligibility(state, data).blockers, ['Deliver 1 more quest for this preparation.']);
  rejected(state, { type: 'task' });
});

test('coins alone cannot complete the first preparation without its quests', () => {
  let state = openGame();
  state = act(state, { type: 'move', from: 13, to: 14 });
  state.coins = data.tasks[0].cost;
  assert.deepEqual(state.completedQuests, []);
  assert.deepEqual(taskEligibility(state, data).blockers, [`Deliver ${requiredQuests(0, data).length} more quests for this preparation.`]);
  rejected(state, { type: 'task' });
});

test('generator placement is part of eligibility and failed completion leaves every field unchanged', () => {
  const state = { ...withoutWindow(2), coins: 0 };
  state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, data) ? cell : { code: 'bakery_1' });
  assert.ok(validateGame(state, data));
  const eligibility = taskEligibility(state, data);
  assert.equal(eligibility.blockers.length, 3);
  assert.deepEqual(eligibility.requirements.at(-1), { kind: 'space', source: data.items.generator_sweet.name, met: false });
  assert.equal(rejected(state, { type: 'task' }).message, eligibility.blockers.join(' '));
  Object.assign(state, { coins: data.tasks[2].cost, completedQuests: checkpoint(2).completedQuests });
  assert.deepEqual(taskEligibility(state, data).blockers, [`Free a space on the board for the ${data.items.generator_sweet.name}.`]);
  rejected(state, { type: 'task' });
  const space = state.board.findIndex(cell => cell?.code === 'bakery_1');
  state.board[space] = null;
  assert.ok(taskEligibility(state, data).ready);
  const completed = act(state, { type: 'task' });
  assert.equal(completed.board[space]?.code, 'generator_sweet');
  assert.equal(completed.coins, 0);
});

test('the funding check rejects a preparation that the quests before it cannot pay for', () => {
  const costly = structuredClone(data);
  const earned = requiredQuests(0, data).reduce((sum, quest) => sum + quest.reward, 0);
  costly.tasks[0].work.materials += earned - costly.tasks[0].cost + 1;
  costly.tasks[0].cost = earned + 1;
  assert.deepEqual(questProblems(costly), [`task_1: the quests before it pay ${earned} coins, less than the ${earned + 1} that the preparations cost.`]);
  assert.ok(dataProblems(costly).length);
  const cheap = structuredClone(data);
  cheap.quests.find(quest => quest.id === 'dochia-sheepskin')!.reward = 1;
  assert.match(questProblems(cheap).join(' '), /^task_1: the quests before it pay \d+ coins, less than the 400/);
  // The shortfall carries forward: the totals are cumulative.
  const later = structuredClone(data);
  const surplus = data.quests.reduce((sum, quest) => sum + quest.reward, 0) - data.tasks.reduce((sum, task) => sum + task.cost, 0);
  later.tasks[23].work.materials += surplus + 1;
  later.tasks[23].cost += surplus + 1;
  assert.match(questProblems(later).join(' '), /^task_24: the quests before it pay/);
});

test('the quest check rejects quests out of opening order and a quest that opens with the last preparation', () => {
  const late = structuredClone(data);
  late.quests.at(-1)!.afterTask = data.tasks.at(-1)!.id;
  assert.ok(questProblems(late).includes('Every quest must open before the last preparation.'));
  const swapped = structuredClone(data);
  const first = swapped.quests.findIndex(quest => quest.afterTask === 'task_1');
  [swapped.quests[0], swapped.quests[first]] = [swapped.quests[first], swapped.quests[0]];
  assert.ok(questProblems(swapped).includes('Quests must be in the order in which they open.'));
  assert.ok(dataProblems(swapped).length);
});

test('the last preparation needs its own quests and repeated completion changes nothing', () => {
  const ready = checkpoint(23);
  const state = withoutWindow(23);
  assert.ok(validateGame(state, data));
  const missing = requiredQuests(23, data).length - state.completedQuests.length;
  assert.deepEqual(taskEligibility(state, data).blockers, [`Deliver ${missing} more ${missing === 1 ? 'quest' : 'quests'} for this preparation.`]);
  rejected(state, { type: 'task' });
  const completed = act(ready, { type: 'task' });
  assert.equal(completed.taskIndex, 24);
  assert.equal(completed.coins, 0);
  assert.deepEqual(taskEligibility(completed, data), { task: null, ready: false, requirements: [], blockers: ['The community supper is ready.'] });
  rejected(completed, { type: 'task' });
});

test('board actions never count as quests, and invalid actions change nothing', () => {
  let state = openGame();
  const unchanged = (action: Action) => {
    state = act(state, action);
    assert.deepEqual(state.completedQuests, []);
    assert.equal(taskEligibility(state, data).requirements.find(requirement => requirement.kind === 'quests')!.met, false);
  };
  unchanged({ type: 'move', from: 22, to: 0 });
  unchanged({ type: 'move', from: 0, to: 27 });
  unchanged({ type: 'spawn', index: 1 });
  unchanged({ type: 'move', from: 13, to: 14 });
  rejected(state, { type: 'move', from: 13, to: 13 });
  rejected(state, { type: 'move', from: 13, to: 14 });
  rejected(state, { type: 'deliverQuest', id: 'mara-welcome' });
  rejected(state, { type: 'replay' } as unknown as Action);
});
