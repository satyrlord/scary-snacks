import test from 'node:test';
import assert from 'node:assert/strict';
import { supperComplete } from '../src/model.ts';
import { actOneTasks, data, nightLine, runs } from './support.ts';

// A strategy that plays both acts badly on purpose: the game must still finish. Each strategy has its own file, so the runs go in parallel.

test('a strategy that misses each booking once still finishes both acts for every seed', t => {
  const [supperDay] = data.finales.map(finale => finale.day), feastHold = data.calendar.holds.find(hold => hold.task === data.tasks[data.tasks.length - 2].id)!.day;
  for (const [seed, run] of runs('miss-bookings')) {
    assert.ok(supperComplete(run.finalState, data), `Seed ${seed}: the supper is served.`);
    assert.equal(run.finalState.taskIndex, data.tasks.length);
    // With every booked meal cooked, the bistro has no work, and the strategy delivers repeating quests until the night.
    assert.ok(run.totals.repeats > 0, `Seed ${seed}: the strategy delivers repeating quests.`);
    assert.ok(run.nights.payments[actOneTasks - 1] <= supperDay - 1 && !run.nights.held.some(day => day <= supperDay), `Seed ${seed}: the last preparation of act 1 comes before the closing of 30 April.`);
    assert.ok(run.nights.payments[data.tasks.length - 2] <= feastHold && !run.nights.held.includes(feastHold), `Seed ${seed}: preparation 24 of act 2 comes before the closing of 14 August.`);
    assert.equal(run.nights.payments.at(-1), data.calendar.end, `Seed ${seed}: the orchard is bought on 31 August.`);
    t.diagnostic(`${nightLine(seed, run)} ${run.totals.repeats} repeating quests. ${run.nights.fillerMerges} merges only to move the clock while a guest waits. Purses ${run.acts.map(account => account.purse).join(', ')}.`);
  }
});
