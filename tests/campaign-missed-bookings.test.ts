import test from 'node:test';
import assert from 'node:assert/strict';
import { supperComplete } from '../src/model.ts';
import { data, nightLine, runs } from './support.ts';

// A strategy that plays act 1 badly on purpose: the game must still finish. Each strategy has its own file, so the runs go in parallel.

test('a strategy that misses each booking once still finishes act 1 for every seed', t => {
  for (const [seed, run] of runs('miss-bookings')) {
    assert.ok(supperComplete(run.finalState, data), `Seed ${seed}: the supper is served.`);
    assert.equal(run.finalState.taskIndex, data.tasks.length);
    t.diagnostic(`${nightLine(seed, run)} ${run.nights.fillerMerges} merges only to move the clock. Purse ${run.purse}.`);
  }
});
