import test from 'node:test';
import assert from 'node:assert/strict';
import { finaleQuest, supperComplete } from '../src/model.ts';
import { data, nightLine, runs } from './support.ts';

// A strategy that plays both acts badly on purpose: the recovery quest must reach each payment. Each strategy has its own file, so the runs go in parallel.

test('a strategy that starts each preparation window with a debt of 20 coins reaches each payment through the recovery quest, and the holds keep the finales and the purchase on their dates', t => {
  for (const [seed, run] of runs('debt')) {
    assert.ok(supperComplete(run.finalState, data), `Seed ${seed}: the supper is served.`);
    assert.equal(run.finalState.taskIndex, data.tasks.length, `Seed ${seed}: the orchard is bought.`);
    assert.equal(run.finalState.coins, run.finalState.act2!.purse, `Seed ${seed}: no new debt follows the last payment.`);
    assert.equal(run.acts[1].purse, run.preparations.at(-1)!.balance, `Seed ${seed}: the act 2 account keeps the purse after the purchase.`);
    for (const finale of data.finales) assert.equal(run.nights.delivered[finaleQuest(finale, data)!.id], finale.day, `Seed ${seed}: ${finale.id} on its day.`);
    assert.equal(run.nights.payments.at(-1), data.calendar.end, `Seed ${seed}: the orchard is bought on 31 August.`);
    assert.ok(run.nights.lowestPurse <= -20, `Seed ${seed}: the windows start in debt.`);
    assert.equal(run.nights.fillerMerges, 0, `Seed ${seed}: no dish only to move the clock.`);
    for (const preparation of run.preparations) assert.ok(preparation.recoveries > 0, `Seed ${seed}, ${preparation.id}: the recovery quest pays the debt.`);
    t.diagnostic(`${nightLine(seed, run)} ${run.totals.recoveries} recovery teas. Purse after act 1 ${run.acts[0].purse}. Held days ${run.nights.held.join(' ')}.`);
  }
});
