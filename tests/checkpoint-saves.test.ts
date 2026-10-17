import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { currentTask, reduceGame, taskEligibility, validateGame } from '../src/engine.ts';
import type { GameData } from '../src/engine.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));

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

test('the finished manual checkpoint retains the last preparation, chapter, and finale scenes', () => {
  const state = checkpointState(data, data.tasks.length);
  assert.ok(validateGame(state, data));
  assert.equal(state.taskIndex, data.tasks.length);
  assert.equal(state.coins, 0);
  assert.deepEqual(state.pendingScenes, [data.tasks.at(-1)!.id, data.chapters.at(-1)!.id, data.finale.id]);
});

test('a checkpoint from a partially read save clears the earlier scene and its line without changing the input', () => {
  const paid = reduceGame(checkpointState(data, 0), { type: 'task' }, data).state;
  paid.sceneLines = { [data.tasks[0].id]: 1 };
  assert.ok(validateGame(paid, data));
  const before = structuredClone(paid);
  const state = checkpointState(data, 1, paid);
  assert.deepEqual(paid, before);
  assert.deepEqual(state.pendingScenes, []);
  assert.equal(state.sceneLines, undefined);
  assert.ok(validateGame(state, data));
});
