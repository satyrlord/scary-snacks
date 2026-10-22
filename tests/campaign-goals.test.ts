import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignQuest, dishWork, requiredQuests, stapleCost, taskEligibility, unresolvedObstacle } from '../src/model.ts';
import { validateGame } from '../src/engine.ts';
import { dataProblems, questProblems } from '../src/content.ts';
import type { Action, Quest } from '../src/model.ts';
import { act, addOpenLayout, data, openCheckpoint, openGame, prologueServed, rejected } from './support.ts';

addOpenLayout();
/** The checkpoint before the quests that open with the previous preparation are delivered. */
const withoutWindow = (count: number) => ({ ...openCheckpoint(count), completedQuests: openCheckpoint(count - 1).completedQuests });
/** The work value of a quest: the merges of its dishes at the work rate. The funding check counts this, not the staples. */
const work = (quest: Quest) => quest.requirements.reduce((sum, { item, quantity }) => sum + dishWork(item, data).merges * data.economy.workRate * quantity, 0);

test('each preparation needs every campaign quest that opens before it, and the last one needs every campaign quest', () => {
  assert.deepEqual(questProblems(data), []);
  assert.deepEqual(requiredQuests(0, data).map(quest => quest.id), data.quests.filter(quest => quest.afterTask === null && !quest.afterQuest && campaignQuest(quest)).map(quest => quest.id));
  for (let index = 1; index < data.tasks.length; index++) {
    const earlier = requiredQuests(index - 1, data), now = requiredQuests(index, data);
    assert.deepEqual(now.slice(0, earlier.length), earlier, 'Each preparation keeps the quests of the one before it.');
    assert.ok(now.length > earlier.length, `${data.tasks[index].id} adds at least one quest.`);
  }
  // The March quests of Dochia and the quests of later acts are not needed.
  assert.deepEqual(requiredQuests(data.tasks.length - 1, data), data.quests.filter(campaignQuest));
});

test('eligibility lists the unmet coins and quests and keeps the exact totals above a requirement', () => {
  const state = { ...openGame(), coins: 0 };
  const quests = requiredQuests(0, data);
  const eligibility = taskEligibility(state, data);
  assert.equal(eligibility.task, data.tasks[0]);
  assert.equal(eligibility.ready, false);
  assert.deepEqual(eligibility.requirements, [
    { kind: 'coins', current: 0, required: data.tasks[0].cost, met: false },
    { kind: 'quests', current: 0, required: quests.length, met: false },
    { kind: 'date', day: 1, met: true },
  ]);
  assert.deepEqual(eligibility.blockers, [`Earn ${data.tasks[0].cost} more coins to pay for this preparation.`, `Deliver ${quests.length} more quests for this preparation.`]);
  assert.equal(rejected(state, { type: 'task' }).message, eligibility.blockers.join(' '));
  Object.assign(state, { coins: data.tasks[0].cost + 100, completedQuests: [...prologueServed, ...quests.map(quest => quest.id)] });
  const ready = taskEligibility(state, data);
  assert.ok(ready.ready);
  assert.deepEqual(ready.blockers, []);
  assert.deepEqual(ready.requirements.map(requirement => 'current' in requirement ? requirement.current : null), [data.tasks[0].cost + 100, quests.length, null]);
  const completed = act(state, { type: 'task' });
  assert.equal(completed.coins, 100);
  assert.deepEqual(completed.completedQuests, state.completedQuests, 'A payment does not spend quests.');
});

test('one missing coin blocks completion after the quests are delivered', () => {
  const state = { ...openCheckpoint(5), coins: data.tasks[5].cost - 1 };
  assert.deepEqual(taskEligibility(state, data).blockers, ['Earn 1 more coin to pay for this preparation.']);
  assert.match(rejected(state, { type: 'task' }).message, /1 more coin/);
});

test('generator placement is part of eligibility and failed completion leaves every field unchanged', () => {
  const state = { ...withoutWindow(2), coins: 0 };
  state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, data) ? cell : { code: 'grain_1' });
  assert.ok(validateGame(state, data));
  const eligibility = taskEligibility(state, data);
  assert.equal(eligibility.blockers.length, 3);
  assert.deepEqual(eligibility.requirements.at(-1), { kind: 'space', source: data.items.generator_dairy.name, met: false });
  assert.equal(rejected(state, { type: 'task' }).message, eligibility.blockers.join(' '));
  Object.assign(state, { coins: data.tasks[2].cost, completedQuests: openCheckpoint(2).completedQuests });
  assert.deepEqual(taskEligibility(state, data).blockers, [`Free a space on the board for the ${data.items.generator_dairy.name}.`]);
  rejected(state, { type: 'task' });
  const space = state.board.findIndex(cell => cell?.code === 'grain_1');
  state.board[space] = null;
  assert.ok(taskEligibility(state, data).ready);
  const completed = act(state, { type: 'task' });
  assert.equal(completed.board[space]?.code, 'generator_dairy');
  assert.equal(completed.coins, 0);
});

test('the funding check rejects a preparation that the work of the quests before it cannot pay for', () => {
  const costly = structuredClone(data);
  const earned = requiredQuests(0, data).reduce((sum, quest) => sum + work(quest), 0);
  costly.tasks[0].work.materials += earned - costly.tasks[0].cost + 1;
  costly.tasks[0].cost = earned + 1;
  assert.match(questProblems(costly).join(' '), new RegExp(`^task_1: the quests before it earn ${earned} coins of work, less than the ${earned + 1} that the preparations cost\\.`));
  assert.ok(dataProblems(costly).length);
  // Quests with less work earn less, even when their rewards match their menu values.
  const cheap = structuredClone(data);
  for (const { id } of requiredQuests(0, data)) Object.assign(cheap.quests.find(quest => quest.id === id)!, { requirements: [{ item: 'herbs_2', quantity: 1 }], reward: data.items.herbs_2.price });
  assert.match(questProblems(cheap).join(' '), new RegExp(`^task_1: the quests before it earn \\d+ coins of work, less than the ${data.tasks[0].cost}`));
  // The shortfall carries forward: the totals are cumulative.
  const surplus = requiredQuests(data.tasks.length, data).reduce((sum, quest) => sum + work(quest), 0) - data.tasks.reduce((sum, task) => sum + task.cost, 0);
  const later = structuredClone(data);
  later.tasks[23].work.materials += surplus + 1;
  later.tasks[23].cost += surplus + 1;
  assert.match(questProblems(later).join(' '), /^task_24: the quests before it earn/);
  // The coins left after the last preparation must buy the staples of the supper.
  const supper = data.quests.find(quest => quest.finale)!;
  const staples = stapleCost(supper, data);
  const lean = structuredClone(data);
  lean.tasks[23].work.materials += surplus - staples + 1;
  lean.tasks[23].cost += surplus - staples + 1;
  assert.deepEqual(questProblems(lean), [`${supper.id}: the quests leave ${staples - 1} coins, less than the ${staples} that its staples cost.`]);
});

test('the quest check rejects quests out of opening order, a quest that opens with the last preparation, a second or misplaced supper, and a broken recovery quest', () => {
  const late = structuredClone(data);
  late.quests.findLast(campaignQuest)!.afterTask = data.tasks.at(-1)!.id;
  assert.ok(questProblems(late).includes('Every quest must open before the last preparation.'));
  const swapped = structuredClone(data);
  const first = swapped.quests.findIndex(quest => quest.afterTask === 'task_1');
  [swapped.quests[1], swapped.quests[first]] = [swapped.quests[first], swapped.quests[1]];
  assert.ok(questProblems(swapped).includes('Quests must be in the order in which they open.'));
  assert.ok(dataProblems(swapped).length);
  const second = structuredClone(data);
  Object.assign(second.quests[1], { finale: true, reward: 0, completion: [] });
  assert.ok(questProblems(second).includes('The finale needs exactly one supper quest.'));
  const early = structuredClone(data);
  early.quests.find(quest => quest.finale)!.afterTask = data.tasks.at(-2)!.id;
  assert.ok(questProblems(early).includes('The supper quest opens after the last preparation.'));
  const twice = structuredClone(data);
  Object.assign(twice.quests[1], { recovery: true, completion: [] });
  assert.ok(questProblems(twice).includes('The game needs exactly one recovery quest.'));
  const none = structuredClone(data);
  none.quests = none.quests.filter(quest => !quest.recovery);
  assert.ok(questProblems(none).includes('The game needs exactly one recovery quest.'));
  const paid = structuredClone(data);
  Object.assign(paid.quests[0], { requirements: [{ item: 'grain_3', quantity: 1 }], reward: data.items.grain_3.price });
  assert.ok(questProblems(paid).includes('ana-night-ward-tea: the recovery quest asks only for open dishes of free sources.'));
  for (const change of [{ afterTask: 'task_1' }, { afterQuest: 'mara-welcome' }, { finale: true }, { recovery: 'yes' }]) {
    const broken = structuredClone(data);
    Object.assign(broken.quests[0], change);
    assert.ok(questProblems(broken).includes('ana-night-ward-tea: invalid recovery quest.'), JSON.stringify(change));
  }
});

test('the last preparation needs its own quests and repeated completion changes nothing', () => {
  const ready = openCheckpoint(23);
  const state = withoutWindow(23);
  assert.ok(validateGame(state, data));
  const missing = requiredQuests(23, data).length + prologueServed.length - state.completedQuests.length;
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
    assert.deepEqual(state.completedQuests, prologueServed);
    assert.equal(taskEligibility(state, data).requirements.find(requirement => requirement.kind === 'quests')!.met, false);
  };
  unchanged({ type: 'move', from: 22, to: 0 });
  unchanged({ type: 'move', from: 0, to: 27 });
  unchanged({ type: 'spawn', index: 31 });
  unchanged({ type: 'move', from: 13, to: 14 });
  rejected(state, { type: 'move', from: 13, to: 13 });
  rejected(state, { type: 'move', from: 13, to: 14 });
  rejected(state, { type: 'deliverQuest', id: 'mara-welcome' });
});
