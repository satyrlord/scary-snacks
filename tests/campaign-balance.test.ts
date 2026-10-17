import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatorOutputs, taskEligibility, validateGame } from '../src/engine.ts';
import type { GameData } from '../src/engine.ts';
import { runCampaignBalance } from '../tools/campaign-balance.ts';
import type { CampaignTotals } from '../tools/campaign-balance.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));

test('legal campaign scenarios reach the finale and account for every action and coin by chapter', t => {
  for (const scenario of ['fresh', 'fresh-rewards', 'legacy-sales'] as const) {
    const report = runCampaignBalance(data, scenario);
    const { totals, finalState } = report;
    assert.equal(report.seed, 84017);
    assert.equal(finalState.taskIndex, 24);
    assert.equal(validateGame(finalState, data), true);
    // The final legal payment gives one finale opportunity. Conversion at preparation 12 queues none of the chapters closed before it.
    const closed = scenario === 'legacy-sales' ? data.chapters.slice(3) : data.chapters;
    assert.deepEqual(finalState.pendingScenes, [...closed.map(chapter => chapter.id), data.finale.id]);
    if (scenario !== 'legacy-sales') {
      assert.equal(finalState.layoutId, data.board.defaultLayout);
      assert.deepEqual(finalState.resolvedObstacles, [], 'The full campaign needs no board clearing.');
    }
    assert.equal(finalState.coins, totals.orderCoins + totals.saleCoins + totals.levelCoins + totals.questCoins - totals.preparationCoins);
    assert.equal(totals.preparationCoins, report.preparations.reduce((sum, task) => sum + task.cost, 0));
    assert.equal(totals.merges, finalState.merges);
    assert.equal(totals.served, finalState.served);
    assert.ok(finalState.served >= data.tasks.at(-1)!.goals.served);
    assert.ok(finalState.merges >= data.tasks.at(-1)!.goals.merges);
    assert.deepEqual(report.chapters.map(chapter => chapter.chapter), [1, 2, 3, 4, 5, 6]);
    let balance = 0;
    for (const chapter of report.chapters) {
      balance += chapter.orderCoins + chapter.saleCoins + chapter.levelCoins + chapter.questCoins - chapter.preparationCoins;
      assert.equal(chapter.balance, balance, `Chapter ${chapter.chapter} records its actual balance.`);
      assert.equal(chapter.preparationCoins, report.preparations.filter(task => task.chapter === chapter.chapter).reduce((sum, task) => sum + task.cost, 0));
    }
    for (const key of Object.keys(totals) as (keyof CampaignTotals)[]) {
      assert.equal(report.chapters.reduce((sum, chapter) => sum + chapter[key], 0), totals[key], `${key} is fully recorded by chapter.`);
      assert.equal(report.preparations.reduce((sum, preparation) => sum + preparation[key], 0), totals[key], `${key} is fully recorded by preparation.`);
    }
    assert.deepEqual(report.preparations.map(task => task.id), data.tasks.map(task => task.id));
    for (const preparation of report.preparations.filter(task => task.rules === 'current')) {
      const authored = data.tasks.find(task => task.id === preparation.id)!;
      assert.deepEqual(preparation.work, authored.work);
      assert.equal(preparation.cost, authored.work.materials + authored.work.labour);
      assert.ok(preparation.cumulative.served >= authored.goals.served);
      assert.ok(preparation.cumulative.merges >= authored.goals.merges);
    }
    assert.equal(report.postCampaign.served, 3, 'All three orders present at the finale remain feasible.');
    assert.equal(new Set(report.postCampaign.orderIds).size, 3);
    assert.ok(report.postCampaign.actions > 3);
    for (const chain of data.chains) assert.ok(generatorOutputs(finalState, `generator_${chain.id}`, data).includes(`${chain.id}_3`));
    assert.equal(totals.levelCoins, scenario === 'fresh' ? 0 : 180);
    assert.equal(totals.questCoins, scenario === 'fresh-rewards' ? 312 : 0);
    assert.equal(finalState.completedQuests.length, scenario === 'fresh-rewards' ? 13 : 0);
    assert.deepEqual(finalState.activeQuestProducers, {});
    t.diagnostic(`${scenario}, seed ${report.seed}: ${totals.actions} actions, ${totals.served} service, ${totals.merges} merges, ${totals.sales} sales; ${totals.orderCoins} order + ${totals.saleCoins} sale + ${totals.levelCoins} level + ${totals.questCoins} quest coins; ${finalState.coins} remain.`);
  }
});

test('a legal sales-only legacy checkpoint keeps zero counters and completed preparations through conversion', () => {
  const report = runCampaignBalance(data, 'legacy-sales');
  const conversion = report.conversion!;
  assert.equal(conversion.before.taskIndex, 12);
  assert.equal(conversion.before.served, 0);
  assert.equal(conversion.before.merges, 0);
  assert.equal(conversion.before.coins, 0);
  assert.ok(conversion.before.orders.every(order => !Object.hasOwn(order, 'pricing')));
  assert.deepEqual(conversion.after.orders, conversion.before.orders);
  assert.deepEqual(conversion.after.decorations, data.tasks.slice(0, 12).map(task => task.id));
  assert.equal(conversion.after.served, 0);
  assert.equal(conversion.after.merges, 0);
  const eligibility = taskEligibility(conversion.after, data);
  assert.equal(eligibility.task?.id, data.tasks[12].id);
  assert.equal(eligibility.ready, false);
  assert.ok(eligibility.requirements.some(requirement => requirement.kind === 'served' && !requirement.met));
  assert.ok(eligibility.requirements.some(requirement => requirement.kind === 'merges' && !requirement.met));
  assert.ok(conversion.after.legacySatisfiedQuests.length > 0);
  assert.deepEqual(report.chapters.slice(0, 3).map(chapter => chapter.rules), Array(3).fill('legacy-coin-only'));
  for (const chapter of report.chapters.slice(0, 3)) {
    assert.equal(chapter.served, 0);
    assert.equal(chapter.merges, 0);
    assert.equal(chapter.saleCoins, chapter.preparationCoins);
    assert.equal(chapter.levelCoins + chapter.questCoins + chapter.orderCoins, 0);
  }
});

test('the same legal play policy exposes the pace change against fixed historical prices and costs', t => {
  for (const policy of ['fewest-ingredients', 'best-income'] as const) {
    const before = runCampaignBalance(data, 'historical', 84017, policy);
    const after = runCampaignBalance(data, 'fresh', 84017, policy);
    assert.equal(before.totals.preparationCoins, 3240);
    assert.deepEqual(before.preparations.map(task => task.cost), data.tasks.map((_, index) => 20 + 10 * index));
    assert.deepEqual(before.preparations.map(task => task.goals), data.tasks.map((_, index) => ({ served: index + 1, merges: 2 * (index + 1) })));
    assert.ok(before.finalState.orders.every(order => !Object.hasOwn(order, 'pricing')));
    assert.ok(after.finalState.orders.every(order => order.pricing === 'menu-1'));
    assert.ok(after.totals.actions > before.totals.actions);
    assert.ok(after.totals.served > before.totals.served);
    assert.ok(after.preparations[0].served > before.preparations[0].served);
    t.diagnostic(`${policy}. Historical: ${before.totals.actions} actions, ${before.totals.served} orders. Current: ${after.totals.actions} actions, ${after.totals.served} orders. First preparation: ${before.preparations[0].actions} to ${after.preparations[0].actions} actions; ${before.preparations[0].served} to ${after.preparations[0].served} orders.`);
  }
});

test('the seed and legal action policy reproduce the same campaign evidence', () => {
  assert.deepEqual(runCampaignBalance(data, 'fresh-rewards'), runCampaignBalance(data, 'fresh-rewards'));
});
