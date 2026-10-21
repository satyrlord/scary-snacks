import test from 'node:test';
import assert from 'node:assert/strict';
import { supperComplete } from '../src/model.ts';
import { data, nightLine, runs } from './support.ts';

// A strategy that plays act 1 badly on purpose: the recovery quest must reach each preparation. Each strategy has its own file, so the runs go in parallel.

test('a strategy that starts each preparation window with a debt of 20 coins reaches each preparation through the recovery quest', t => {
  for (const [seed, run] of runs('debt')) {
    assert.ok(supperComplete(run.finalState, data), `Seed ${seed}: the supper is served.`);
    assert.ok(run.nights.lowestPurse <= -20, `Seed ${seed}: the windows start in debt.`);
    for (const preparation of run.preparations) assert.ok(preparation.recoveries > 0, `Seed ${seed}, ${preparation.id}: the recovery quest pays the debt.`);
    t.diagnostic(`${nightLine(seed, run)} ${run.totals.recoveries} recovery teas. Purse ${run.purse}.`);
  }
});
