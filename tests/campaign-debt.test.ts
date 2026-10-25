import test from 'node:test';
import assert from 'node:assert/strict';
import { finaleQuest, levers, supperComplete } from '../src/model.ts';
import { actTwoTasks, data, nightLine, runs } from './support.ts';

// A strategy that plays the three acts badly on purpose: the recovery quest must reach each payment. Each strategy has its own file, so the runs go in parallel.

test('a strategy that starts each preparation window with a debt of 20 coins reaches each payment through the recovery quest, and the holds keep the finales and the purchase on their dates', t => {
  for (const [seed, run] of runs('debt')) {
    assert.ok(supperComplete(run.finalState, data), `Seed ${seed}: the supper is served.`);
    assert.equal(run.finalState.taskIndex, data.tasks.length, `Seed ${seed}: the orchard is bought, and every preparation of act 3 is paid.`);
    assert.equal(run.finalState.coins, run.finalState.act3!.purse, `Seed ${seed}: no new debt follows the dinner.`);
    // A purchase at the held position closes 31 August in the same change, so the balance after the payment has paid that upkeep.
    const upkeep = run.nights.held.includes(data.acts[1].to) ? levers(data.acts[1].to, data).upkeep : 0;
    assert.equal(run.acts[1].purse, run.preparations[actTwoTasks - 1].balance + upkeep, `Seed ${seed}: the act 2 account keeps the purse of the purchase.`);
    for (const finale of data.finales) assert.equal(run.nights.delivered[finaleQuest(finale, data)!.id], finale.day, `Seed ${seed}: ${finale.id} on its day.`);
    assert.equal(run.nights.payments[actTwoTasks - 1], data.acts[1].to, `Seed ${seed}: the orchard is bought on 31 August.`);
    assert.ok(run.nights.lowestPurse <= -20, `Seed ${seed}: the windows start in debt.`);
    assert.equal(run.nights.fillerMerges, 0, `Seed ${seed}: no dish only to move the clock.`);
    for (const preparation of run.preparations) assert.ok(preparation.recoveries > 0, `Seed ${seed}, ${preparation.id}: the recovery quest pays the debt.`);
    t.diagnostic(`${nightLine(seed, run)} ${run.totals.recoveries} recovery teas. Purse after act 1 ${run.acts[0].purse}. Held days ${run.nights.held.join(' ')}.`);
  }
});
