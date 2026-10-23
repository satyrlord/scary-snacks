import test from 'node:test';
import assert from 'node:assert/strict';
import { dayMerges, firstFreeBoardCell, isSunday, questOpening, resolveQuests } from '../src/model.ts';
import type { GameData, GameState } from '../src/model.ts';
import { PIPER_NIGHTS, validateGame } from '../src/engine.ts';
import { checkpointState, moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, data, deliver, validate } from './support.ts';

const piper = data.quests.find(value => value.piper)!;
/**
 * The days of Ambrozie's dinner and lunch hold until his quests, which the payments of these states do not reach. A test data set
 * without those two holds lets the Sunday closings of July run by merges.
 */
const content: GameData = structuredClone(data);
content.calendar.holds = content.calendar.holds.filter(hold => !hold.quest?.startsWith('ambrozie-') || hold.quest === 'ambrozie-feast');
/** The game with the piper's quest open on a ticket: the checkpoint that needs it, before its delivery. */
function piperOpen() {
  const state = checkpointState(data, questOpening(piper, data) + 1);
  state.completedQuests = state.completedQuests.filter(id => id !== piper.id);
  assert.equal(resolveQuests(state, data).find(view => view.quest === piper)!.status, 'active');
  assert.equal(validate(state), true);
  return state;
}
/** The closing of a day by a merge of two Herb bunches at the last merge, with a loose Wheat sheaf on the board for the thief rat. */
function closeDay(state: GameState, day: number) {
  const next = structuredClone(state);
  moveTo(next, day, data);
  const loose = firstFreeBoardCell(next, data);
  next.board[loose] = { code: 'grain_1' };
  if (!next.discovered.includes('grain_1')) next.discovered.push('grain_1');
  const from = firstFreeBoardCell(next, data);
  next.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(next, data);
  next.board[to] = { code: 'herbs_1' };
  next.clock.merges = dayMerges(day, content) - 1;
  return act(next, { type: 'move', from, to }, content);
}
/** The Sundays from a day on. */
const sundaysFrom = (day: number, count: number) => Array.from({ length: 60 }, (_, index) => day + index).filter(value => isSunday(value, data)).slice(0, count);

test('after the piper’s fee, the next four Sunday closings have no thief rat, also with loose raw ingredients, and the fifth follows the usual rule', () => {
  let state = deliver(piperOpen(), piper.id);
  assert.equal(state.piper, PIPER_NIGHTS);
  const day = state.clock.day, sundays = sundaysFrom(isSunday(day, data) ? day + 1 : day, PIPER_NIGHTS + 1);
  for (const [index, sunday] of sundays.entries()) {
    const before = structuredClone(state);
    state = closeDay(state, sunday);
    const night = state.night!;
    if (index < PIPER_NIGHTS) {
      assert.deepEqual([night.day, night.rat, night.piper, night.seen], [sunday, null, true, false], `Sunday ${index + 1} of the tune.`);
      assert.equal(state.piper, PIPER_NIGHTS - index - 1);
      // No rat comes, so the closing draws nothing from the seed, and the loose ingredient stays.
      assert.equal(state.seed, before.seed);
      assert.equal(state.board.filter(cell => cell?.code === 'grain_1').length, before.board.filter(cell => cell?.code === 'grain_1').length + 1);
    } else {
      assert.equal(night.rat, 'thief', 'The fifth Sunday follows the usual rule.');
      assert.equal(night.piper, false);
      assert.notEqual(state.seed, before.seed);
    }
  }
});

test('a weekday closing keeps the count of the piper’s Sundays', () => {
  const delivered = deliver(piperOpen(), piper.id), weekday = Array.from({ length: 7 }, (_, index) => delivered.clock.day + 1 + index).find(day => !isSunday(day, data))!;
  const state = closeDay(delivered, weekday);
  assert.equal(state.piper, PIPER_NIGHTS);
  assert.equal(state.night!.piper, false);
  assert.equal(state.night!.rat, null);
});

test('a delivery on a Sunday makes the closing of that Sunday the first of the four', () => {
  const open = piperOpen(), sunday = sundaysFrom(open.clock.day, 1)[0];
  moveTo(open, sunday, data);
  const delivered = deliver(open, piper.id);
  assert.equal(delivered.clock.day, sunday);
  const state = closeDay(delivered, sunday);
  assert.deepEqual([state.night!.day, state.night!.rat, state.night!.piper], [sunday, null, true]);
  assert.equal(state.piper, PIPER_NIGHTS - 1);
});

test('validation rejects a count of the piper’s Sundays without the delivery of his quest, or above four', () => {
  const open = piperOpen(), delivered = deliver(open, piper.id);
  assert.equal(validateGame({ ...open, piper: 2 }, data), false);
  assert.equal(validateGame({ ...delivered, piper: PIPER_NIGHTS + 1 }, data), false);
  assert.equal(validateGame({ ...delivered, piper: -1 }, data), false);
  assert.equal(validateGame({ ...delivered, piper: 0 }, data), true);
});
