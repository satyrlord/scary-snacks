import test from 'node:test';
import assert from 'node:assert/strict';
import { currentTask, finaleQuest, growthStages, resolveQuests, stapleCost, supperQuest, taskEligibility } from '../src/model.ts';
import { reduceGame, validateGame } from '../src/engine.ts';
import { actThreeCheckpoints, actTwoCheckpoints, checkpointState, finaleCheckpoint } from '../tools/create-checkpoint-saves.ts';
import { data } from './support.ts';

test('each manual checkpoint is valid and ready for its next payment without earlier scenes', () => {
  for (let count = 0; count < data.tasks.length; count++) {
    const state = checkpointState(data, count);
    assert.ok(validateGame(state, data), `Checkpoint ${count} is valid.`);
    assert.equal(state.taskIndex, count);
    assert.equal(state.coins, currentTask(state, data)!.cost);
    assert.ok(taskEligibility(state, data).ready);
    assert.deepEqual(state.pendingScenes, []);
  }
});

test('the finished manual checkpoint has paid every preparation of act 3, keeps its last scenes, and records the results of acts 1 and 2', () => {
  const state = checkpointState(data, data.tasks.length);
  assert.ok(validateGame(state, data));
  assert.equal(state.taskIndex, data.tasks.length);
  assert.deepEqual(state.pendingScenes, [data.tasks.at(-1)!.id, data.chapters.at(-1)!.id]);
  assert.ok(state.act1 && state.act2 && !state.act3, 'The dinner of the sleeper waits.');
  // The last chapter waits for the holiday quests of 25 and 26 October, and the dinner on 31 October.
  assert.ok(state.clock.day > data.chapters.at(-1)!.opens && state.clock.day < data.acts[2].to);
});

test('the evening of the supper keeps the last preparation and chapter scenes of act 1, with the coins for the staples of the supper', () => {
  const state = finaleCheckpoint(data, 1), supper = supperQuest(data)!, last = data.tasks.findLastIndex(task => data.chapters[task.chapter - 1].act === 1);
  assert.ok(validateGame(state, data));
  assert.equal(state.taskIndex, last + 1);
  assert.equal(state.coins, stapleCost(supper, data));
  assert.ok(state.coins > 0);
  // The supper is the only open campaign quest beside the March quests that opened, and the purse is above the recovery floor, so the
  // recovery quest stays closed.
  assert.deepEqual(resolveQuests(state, data).filter(view => view.status === 'active' && !view.quest.march).map(view => view.quest.id), [supper.id]);
  assert.ok(state.coins >= data.economy.recoveryFloor);
  assert.deepEqual(state.pendingScenes, []);
});

test('the evening of the feast has every preparation of act 2 paid and the coins for the ingredients of the feast', () => {
  const state = finaleCheckpoint(data, 2), feast = finaleQuest(data.finales[1], data)!;
  assert.ok(validateGame(state, data));
  assert.equal(state.clock.day, data.finales[1].day);
  assert.equal(state.coins, stapleCost(feast, data, growthStages(state.taskIndex, data)));
  assert.equal(resolveQuests(state, data).find(view => view.quest === feast)!.status, 'active');
});

test('the named checkpoints of act 2 are valid, on their days, and each one imports', () => {
  const named = Object.fromEntries(actTwoCheckpoints(data));
  for (const [name, state] of Object.entries(named)) assert.ok(validateGame(state, data), name);
  assert.deepEqual(Object.keys(named), ['1-may-before-supper', '1-may-after-supper', '2-may', '20-june', '12-july', '18-july', '14-august', '15-august', '31-august']);
  const day = (name: string) => named[name].clock.day;
  assert.deepEqual([day('1-may-before-supper'), day('1-may-after-supper'), day('2-may')], [data.calendar.supper, data.calendar.supper, data.calendar.supper + 1]);
  assert.equal(day('18-july'), data.board.hail.day);
  assert.equal(named['18-july'].preparationObstacles!.hail !== undefined, true);
  assert.equal(day('31-august'), data.acts[1].to);
});

test('the named checkpoints of act 3 are valid, on their days, and end with the dinner of the sleeper served', () => {
  const named = Object.fromEntries(actThreeCheckpoints(data)), dinner = finaleQuest(data.finales[2], data)!;
  for (const [name, state] of Object.entries(named)) assert.ok(validateGame(state, data), name);
  assert.deepEqual(Object.keys(named), ['1-september', '30-october', '31-october-before-dinner', '31-october-after-dinner']);
  const day = (name: string) => named[name].clock.day;
  assert.deepEqual([day('1-september'), day('30-october'), day('31-october-before-dinner'), day('31-october-after-dinner')],
    [data.acts[2].from, data.acts[2].to - 1, data.acts[2].to, data.acts[2].to]);
  assert.ok(named['1-september'].act2 && !named['1-september'].act3);
  assert.equal(named['30-october'].taskIndex, data.tasks.length - 1);
  // The coins buy the ingredients of the dinner, and the dinner waits on its ticket.
  const before = named['31-october-before-dinner'];
  assert.equal(before.taskIndex, data.tasks.length);
  assert.equal(before.coins, stapleCost(dinner, data, growthStages(before.taskIndex, data)));
  assert.equal(resolveQuests(before, data).find(view => view.quest === dinner)!.status, 'active');
  assert.deepEqual(named['31-october-after-dinner'].act3, { purse: before.coins });
});

test('a checkpoint from a partially read save clears the earlier scene without changing the input', () => {
  const paid = reduceGame(checkpointState(data, 0), { type: 'task' }, data).state;
  assert.ok(validateGame(paid, data));
  const before = structuredClone(paid);
  const state = checkpointState(data, 1, paid);
  assert.deepEqual(paid, before);
  assert.deepEqual(state.pendingScenes, []);
  assert.ok(validateGame(state, data));
});
