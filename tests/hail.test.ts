import test from 'node:test';
import assert from 'node:assert/strict';
import { dayMerges, earnedObstacles, firstFreeBoardCell, freeBoardCells, pendingPreparationObstacles, unresolvedObstacle } from '../src/model.ts';
import type { GameState } from '../src/model.ts';
import { exportSave, importSave } from '../src/storage.ts';
import { checkpointState, moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, actOneTasks, data, validate } from './support.ts';

const hail = data.board.hail, hailIds = hail.obstacles.map(obstacle => obstacle.id);
/** The hail blockers on the board. */
const placedHail = (state: GameState) => state.preparationObstacles!.placed.filter(placement => hailIds.includes(placement.id));
/**
 * The last merge of 17 July, with no blocker waiting: the record of the blockers starts at the current payment. Two Herb bunches wait
 * for the merge that closes the day, and Herb bunches fill the other cells until free cells stay free after that merge.
 */
function eveBefore(free: number, start = (state: GameState) => state.taskIndex) {
  const state = checkpointState(data, actOneTasks + 16);
  moveTo(state, hail.day - 1, data);
  assert.ok(state.clock.day < hail.day && state.preparationObstacles!.hail === undefined);
  state.preparationObstacles = { start: start(state), placed: [] };
  state.resolvedObstacles = state.resolvedObstacles.filter(id => !id.startsWith('prep-'));
  const from = firstFreeBoardCell(state, data);
  state.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(state, data);
  state.board[to] = { code: 'herbs_1' };
  // The merge empties one cell, so the board keeps one cell fewer free before it.
  while (freeBoardCells(state, data) > free - 1) state.board[firstFreeBoardCell(state, data)] = { code: 'herbs_4' };
  state.clock.merges = dayMerges(state.clock.day, data) - 1;
  assert.equal(validate(state), true);
  return { state, merge: { type: 'move' as const, from, to } };
}

test('at the opening of 18 July the hail joins the queue after the batches that wait, and with five free cells it places one blocker', () => {
  const { state, merge } = eveBefore(5);
  const morning = act(state, merge);
  assert.equal(morning.clock.day, hail.day);
  assert.equal(morning.preparationObstacles!.hail, 0);
  assert.deepEqual(placedHail(morning).map(placement => placement.id), [hailIds[0]]);
  assert.equal(freeBoardCells(morning, data), 4);
  assert.ok(unresolvedObstacle(morning, placedHail(morning)[0].position, data));
});

test('with four free cells the hail places nothing, and with a full board it waits', () => {
  for (const free of [4, 1]) {
    const { state, merge } = eveBefore(free), morning = act(state, merge);
    assert.equal(morning.preparationObstacles!.hail, 0, `${free} free cells`);
    assert.deepEqual(placedHail(morning), [], `${free} free cells`);
    assert.deepEqual(pendingPreparationObstacles(morning, data).map(obstacle => obstacle.id), hailIds);
  }
});

test('with three preparation blockers on the board, the hail waits behind them', () => {
  // The record starts at the last payment whose batch has three blockers or more, and the first three of them are on the board.
  const paid = data.tasks.slice(0, actOneTasks + 16), last = paid.findLastIndex(task => (data.board.preparations.find(batch => batch.after === task.id)?.obstacles.length ?? 0) >= 3);
  const { state, merge } = eveBefore(8, () => last);
  const earned = earnedObstacles(state.preparationObstacles!, state.taskIndex, data);
  for (const obstacle of earned.slice(0, 3)) {
    const position = firstFreeBoardCell(state, data);
    state.preparationObstacles!.placed.push({ id: obstacle.id, position });
  }
  assert.equal(validate(state), true);
  const morning = act(state, merge);
  assert.equal(morning.preparationObstacles!.hail, data.tasks.slice(last, state.taskIndex).filter(task => data.board.preparations.some(batch => batch.after === task.id)).length);
  assert.deepEqual(placedHail(morning), []);
  assert.equal(morning.preparationObstacles!.placed.length, 3);
});

test('after the hail places a blocker, an export and import keep the record, and later actions place each hail blocker once', () => {
  const { state, merge } = eveBefore(5);
  const morning = act(state, merge);
  const loaded = importSave<GameState>(exportSave(morning, validate), validate);
  assert.deepEqual(loaded, morning);
  // Free cells let the waiting hail blockers come, one action after the other, and the closing of 18 July adds no second batch.
  let next = structuredClone(loaded);
  next.board = next.board.map(cell => cell?.code === 'herbs_4' ? null : cell);
  const from = firstFreeBoardCell(next, data);
  next.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(next, data);
  next.board[to] = { code: 'herbs_1' };
  next.clock.merges = dayMerges(next.clock.day, data) - 1;
  next = act(next, { type: 'move', from, to });
  assert.equal(next.clock.day, hail.day + 1);
  assert.equal(next.preparationObstacles!.hail, morning.preparationObstacles!.hail);
  assert.deepEqual(placedHail(next).map(placement => placement.id), hailIds);
  assert.deepEqual(pendingPreparationObstacles(next, data), []);
});

test('a save without a blocker record adopts before, on, or after the hail day and remains valid after payment and reload', () => {
  for (const day of [hail.day - 1, hail.day, hail.day + 1]) {
    const state = checkpointState(data, actOneTasks + 16);
    moveTo(state, day, data);
    delete state.preparationObstacles;
    const layout = data.board.layouts.find(value => value.id === state.layoutId)!;
    state.resolvedObstacles = state.resolvedObstacles.filter(id => layout.obstacles.some(obstacle => obstacle.id === id));
    assert.equal(validate(state), true, `An absent record loads on day ${day}.`);
    const paid = act(state, { type: 'task' });
    assert.equal(paid.preparationObstacles!.start, state.taskIndex);
    assert.equal(paid.preparationObstacles!.hail, day >= hail.day ? 0 : undefined);
    const earned = earnedObstacles(paid.preparationObstacles!, paid.taskIndex, data).map(obstacle => obstacle.id);
    const batch = data.board.preparations.find(value => value.after === data.tasks[state.taskIndex].id)!;
    assert.deepEqual(earned, [...(day >= hail.day ? hailIds : []), ...batch.obstacles.map(obstacle => obstacle.id)]);
    assert.deepEqual(importSave<GameState>(exportSave(paid, validate), validate), paid);
    const invalid = structuredClone(state);
    invalid.resolvedObstacles.push(hailIds[0]);
    assert.equal(validate(invalid), false, 'An absent record cannot retain a cleared hail blocker.');
  }
});
