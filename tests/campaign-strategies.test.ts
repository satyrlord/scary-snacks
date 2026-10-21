import test from 'node:test';
import assert from 'node:assert/strict';
import { supperComplete } from '../src/model.ts';
import { data, nightLine, runs } from './support.ts';

// The strategies that play act 1 badly on purpose: the game must still finish, and the recovery quest must reach each preparation.

test('a strategy that misses each booking once still finishes act 1 for every seed', t => {
  for (const [seed, run] of runs('miss-bookings')) {
    assert.ok(supperComplete(run.finalState, data), `Seed ${seed}: the supper is served.`);
    assert.equal(run.finalState.taskIndex, data.tasks.length);
    t.diagnostic(`${nightLine(seed, run)} ${run.nights.fillerMerges} merges only to move the clock. Purse ${run.purse}.`);
  }
});

test('a strategy that starts each preparation window with a debt of 20 coins reaches each preparation through the recovery quest', t => {
  for (const [seed, run] of runs('debt')) {
    assert.ok(supperComplete(run.finalState, data), `Seed ${seed}: the supper is served.`);
    assert.ok(run.nights.lowestPurse <= -20, `Seed ${seed}: the windows start in debt.`);
    for (const preparation of run.preparations) assert.ok(preparation.recoveries > 0, `Seed ${seed}, ${preparation.id}: the recovery quest pays the debt.`);
    t.diagnostic(`${nightLine(seed, run)} ${run.totals.recoveries} recovery teas. Purse ${run.purse}.`);
  }
});
