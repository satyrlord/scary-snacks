import test from 'node:test';
import assert from 'node:assert/strict';
import { dayMerges, finaleQuest, firstFreeBoardCell, taskEligibility } from '../src/model.ts';
import type { GameState } from '../src/model.ts';
import { runCampaignBalance } from '../tools/campaign-balance.ts';
import { checkpointState, finaleCheckpoint } from '../tools/create-checkpoint-saves.ts';
import { act, actTwoTasks, data, deliver, know, rejected, reload, validate, withoutActThree, withTickets } from './support.ts';

const purchase = actTwoTasks - 1, orchard = data.tasks[purchase];
/** A copy with two Elderflowers that merge, and their cells. */
function withPair(state: GameState): { state: GameState; from: number; to: number } {
  const next = structuredClone(state), from = firstFreeBoardCell(next, data);
  next.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(next, data);
  next.board[to] = { code: 'herbs_1' };
  know(next, 'herbs_1');
  return { state: next, from, to };
}

test('after the feast, a purse above the price cannot buy the orchard before 31 August, and on 31 August the purchase needs Janos’s meal', () => {
  assert.equal(orchard.purchase, true);
  const feast = finaleQuest(data.finales[1], data)!, served = deliver(finaleCheckpoint(data, 2), feast.id);
  assert.equal(served.clock.day, data.finales[1].day);
  const rich = { ...served, coins: orchard.cost + 500 };
  assert.equal(taskEligibility(rich, data).task, orchard);
  assert.ok(taskEligibility(rich, data).blockers.includes('This purchase opens on Sunday 31 August.'), taskEligibility(rich, data).blockers.join(' '));
  rejected(rich, { type: 'task' });
  const ready = checkpointState(data, purchase), meal = 'janos-proper-meal';
  assert.equal(ready.clock.day, data.acts[1].to);
  assert.ok(ready.completedQuests.includes(meal));
  const hungry = withTickets({ ...structuredClone(ready), completedQuests: ready.completedQuests.filter(id => id !== meal) });
  assert.equal(validate(hungry), true);
  assert.deepEqual(taskEligibility(hungry, data).blockers, ['Deliver 1 more quest for this preparation.']);
  rejected(hungry, { type: 'task' });
  assert.equal(act(ready, { type: 'task' }).taskIndex, actTwoTasks);
});

test('in a game without a later act, the purchase records the purse of act 2 and stops the clock: later merges move no time and bring no night', () => {
  const content = withoutActThree(), ready = checkpointState(content, purchase), bought = act(ready, { type: 'task' }, content);
  assert.deepEqual(bought.act2, { purse: ready.coins - orchard.cost });
  assert.deepEqual(bought.act1, ready.act1);
  for (const merges of [0, dayMerges(bought.clock.day, data) - 1]) {
    const { state, from, to } = withPair({ ...bought, clock: { ...bought.clock, merges } });
    const merged = act(state, { type: 'move', from, to }, content);
    assert.deepEqual(merged.clock, state.clock, `A merge at ${merges} merges moves no time.`);
    assert.deepEqual(merged.night, state.night, 'No night comes.');
    assert.deepEqual(merged.act2, bought.act2);
  }
  assert.deepEqual(reload(bought), bought);
  // With act 3, the purchase at the held position closes 31 August, and the clock runs on into 1 September.
  const held = { ...checkpointState(data, purchase) }, opened = act({ ...held, clock: { ...held.clock, merges: dayMerges(held.clock.day, data) - 1 } }, { type: 'task' });
  assert.deepEqual([opened.clock, opened.act2], [{ day: data.acts[2].from, merges: 0 }, { purse: held.coins - orchard.cost }]);
});

test('an orchard price that the efficient run cannot pay before the held position of 31 August fails the efficient check', () => {
  const run = runCampaignBalance(data, 1, 'efficient', false), festival = data.calendar.holds.find(hold => data.quests.find(value => value.id === hold.quest)?.stall)!.day;
  // The held positions of act 2 other than the festival.
  const extra = (held: number[]) => held.filter(day => day > data.finales[0].day && day <= data.acts[1].to && day !== festival);
  assert.deepEqual(extra(run.nights.held), [], 'The authored price passes the efficient check.');
  // The check measures act 2 only, so the costly game ends with the purchase.
  const costly = withoutActThree(), price = costly.tasks[purchase];
  // The raise is more than the purse of act 2 and the recovery teas of 31 August before its held position can make up.
  price.work.materials += run.acts[1].purse + 500;
  price.cost += run.acts[1].purse + 500;
  const late = runCampaignBalance(costly, 1, 'efficient', false);
  assert.equal(late.finalState.taskIndex, costly.tasks.length, 'The run still buys the orchard.');
  assert.ok(late.nights.held.includes(costly.acts[1].to), 'The run reaches the held position of 31 August.');
  assert.deepEqual(extra(late.nights.held), [costly.acts[1].to], 'The efficient check fails.');
});
