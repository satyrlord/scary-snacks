import test from 'node:test';
import assert from 'node:assert/strict';
import { supperComplete } from '../src/model.ts';
import { actOneTasks, actTwoTasks, data, nightLine, runs } from './support.ts';

// A strategy that plays the three acts badly on purpose: the game must still finish. Each strategy has its own file, so the runs go in parallel.

test('a strategy that misses each booking once still finishes the three acts for every seed', t => {
  const [supperDay, , dinnerDay] = data.finales.map(finale => finale.day), feastHold = data.calendar.holds.find(hold => hold.task === data.tasks[actTwoTasks - 2].id)!.day;
  const tableHold = data.calendar.holds.find(hold => hold.task === data.tasks.at(-1)!.id)!.day, dinner = data.quests.find(quest => quest.finale === data.finales[2].id)!;
  for (const [seed, run] of runs('miss-bookings')) {
    assert.ok(supperComplete(run.finalState, data), `Seed ${seed}: the supper is served.`);
    assert.equal(run.finalState.taskIndex, data.tasks.length);
    // With every booked meal cooked, the bistro has no work, and the strategy delivers repeating quests until the night.
    assert.ok(run.totals.repeats > 0, `Seed ${seed}: the strategy delivers repeating quests.`);
    assert.ok(run.nights.payments[actOneTasks - 1] <= supperDay - 1 && !run.nights.held.some(day => day <= supperDay), `Seed ${seed}: the last preparation of act 1 comes before the closing of 30 April.`);
    assert.ok(run.nights.payments[actTwoTasks - 2] <= feastHold && !run.nights.held.includes(feastHold), `Seed ${seed}: preparation 24 of act 2 comes before the closing of 14 August.`);
    assert.equal(run.nights.payments[actTwoTasks - 1], data.acts[1].to, `Seed ${seed}: the orchard is bought on 31 August.`);
    assert.ok(run.nights.payments.at(-1)! <= tableHold && run.finalState.act3, `Seed ${seed}: preparation 18 of act 3 comes before the closing of 30 October.`);
    assert.equal(run.nights.delivered[dinner.id], dinnerDay, `Seed ${seed}: the dinner is on 31 October.`);
    t.diagnostic(`${nightLine(seed, run)} ${run.totals.repeats} repeating quests. ${run.nights.fillerMerges} merges only to move the clock while a guest waits. Purses ${run.acts.map(account => account.purse).join(', ')}.`);
  }
});
