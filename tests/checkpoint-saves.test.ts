import test from 'node:test';
import assert from 'node:assert/strict';
import { currentTask, resolveQuests, stapleCost, supperQuest, taskEligibility } from '../src/model.ts';
import { reduceGame, validateGame } from '../src/engine.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';
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

test('the finished manual checkpoint retains the last preparation and chapter scenes, with the coins for the staples of the supper', () => {
  const state = checkpointState(data, data.tasks.length), supper = supperQuest(data)!;
  assert.ok(validateGame(state, data));
  assert.equal(state.taskIndex, data.tasks.length);
  assert.equal(state.coins, stapleCost(supper, data));
  assert.ok(state.coins > 0);
  // The supper is the only open campaign quest beside the March quests that opened, and the purse is above the recovery floor, so the
  // recovery quest stays closed.
  assert.deepEqual(resolveQuests(state, data).filter(view => view.status === 'active' && !view.quest.march).map(view => view.quest.id), [supper.id]);
  assert.ok(state.coins >= data.economy.recoveryFloor);
  assert.deepEqual(state.pendingScenes, [data.tasks.at(-1)!.id, data.chapters.at(-1)!.id]);
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
