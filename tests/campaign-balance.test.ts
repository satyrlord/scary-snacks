import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatorOutputs, validateGame } from '../src/engine.ts';
import type { GameData } from '../src/engine.ts';
import { runCampaignBalance } from '../tools/campaign-balance.ts';
import type { CampaignTotals } from '../tools/campaign-balance.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));

test('legal campaign scenarios reach the finale and account for every action and coin by chapter', t => {
  for (const scenario of ['fresh', 'fresh-rewards'] as const) {
    const report = runCampaignBalance(data, scenario);
    const { totals, finalState } = report;
    assert.equal(report.seed, 84017);
    assert.equal(finalState.taskIndex, 24);
    assert.equal(validateGame(finalState, data), true);
    // The legal policy reads no scene, so each preparation scene and each delivered quest scene waits, with the chapter scenes in story order.
    const story = data.chapters.flatMap((chapter, index) => [...data.tasks.filter(task => task.chapter === index + 1).map(task => task.id), chapter.id]);
    assert.deepEqual(finalState.pendingScenes.filter(id => story.includes(id) || id === data.finale.id), [...story, data.finale.id]);
    assert.deepEqual(new Set(finalState.pendingScenes.filter(id => !story.includes(id) && id !== data.finale.id)),
      new Set([...finalState.completedQuests, ...data.quests.flatMap(quest => quest.followUp && finalState.pendingScenes.includes(quest.followUp.id) ? [quest.followUp.id] : [])]));
    assert.ok(finalState.completedQuests.every(id => finalState.pendingScenes.includes(id)));
    assert.equal(finalState.layoutId, data.board.defaultLayout);
    assert.ok(finalState.resolvedObstacles.every(id => !data.board.layouts[0].obstacles.some(obstacle => obstacle.id === id && obstacle.type === 'anchored')),
      'The campaign needs no anchor release. Clutter can clear beside ordinary production merges.');
    assert.ok(finalState.preparationObstacles!.placed.length >= 3);
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
    for (const preparation of report.preparations) {
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
    assert.equal(totals.questCoins, finalState.completedQuests.reduce((sum, id) => sum + data.quests.find(quest => quest.id === id)!.reward, 0));
    assert.equal(finalState.completedQuests.filter(id => !data.characters.find(person => person.id === data.quests.find(quest => quest.id === id)!.character)!.visitor).length, scenario === 'fresh-rewards' ? 12 : 0);
    if (scenario === 'fresh-rewards') assert.ok(finalState.completedQuests.some(id => data.quests.find(quest => quest.id === id)!.afterServed));
    t.diagnostic(`${scenario}, seed ${report.seed}: ${totals.actions} actions, ${totals.served} service, ${totals.merges} merges, ${totals.sales} sales; ${totals.orderCoins} order + ${totals.saleCoins} sale + ${totals.levelCoins} level + ${totals.questCoins} quest coins; ${finalState.coins} remain.`);
  }
});

test('the seed and legal action policy reproduce the same campaign evidence', () => {
  assert.deepEqual(runCampaignBalance(data, 'fresh-rewards'), runCampaignBalance(data, 'fresh-rewards'));
});
