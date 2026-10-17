import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatorOutputs, validateGame } from '../src/engine.ts';
import type { GameData } from '../src/engine.ts';
import { runCampaignBalance } from '../tools/campaign-balance.ts';
import type { CampaignTotals } from '../tools/campaign-balance.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));

test('the legal quest campaign reaches the finale and accounts for every action and coin by chapter and preparation', t => {
  const report = runCampaignBalance(data);
  const { totals, finalState } = report;
  assert.equal(finalState.taskIndex, data.tasks.length);
  assert.equal(validateGame(finalState, data), true);
  assert.deepEqual(new Set(finalState.completedQuests), new Set(data.quests.map(quest => quest.id)), 'The finale needs every quest.');
  assert.equal(totals.quests, data.quests.length);
  // The legal policy reads no scene, so each preparation scene and each delivered quest scene waits, with the chapter scenes in story order.
  const story = data.chapters.flatMap((chapter, index) => [...data.tasks.filter(task => task.chapter === index + 1).map(task => task.id), chapter.id]);
  assert.deepEqual(finalState.pendingScenes.filter(id => story.includes(id) || id === data.finale.id), [...story, data.finale.id]);
  assert.deepEqual(new Set(finalState.pendingScenes.filter(id => !story.includes(id) && id !== data.finale.id)),
    new Set([...data.quests.map(quest => quest.id), ...data.quests.flatMap(quest => quest.followUp ? [quest.followUp.id] : []),
      ...data.characters.flatMap(person => person.arrival ? [`arrival-${person.id}`] : [])]));
  assert.equal(finalState.layoutId, data.board.defaultLayout);
  assert.deepEqual(finalState.resolvedObstacles, [], 'The campaign needs no blocker release.');
  assert.ok(finalState.preparationObstacles!.placed.length >= 3);
  assert.equal(finalState.coins, totals.questCoins - totals.preparationCoins);
  assert.equal(totals.preparationCoins, data.tasks.reduce((sum, task) => sum + task.cost, 0));
  assert.equal(totals.questCoins, data.quests.reduce((sum, quest) => sum + quest.reward, 0));
  assert.deepEqual(report.chapters.map(chapter => chapter.chapter), [1, 2, 3, 4, 5, 6]);
  let balance = 0;
  for (const chapter of report.chapters) {
    balance += chapter.questCoins - chapter.preparationCoins;
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
    assert.ok(preparation.balance >= 0);
  }
  for (const chain of data.chains) assert.ok(generatorOutputs(finalState, `generator_${chain.id}`, data).includes(`${chain.id}_3`));
  t.diagnostic(`${totals.actions} actions, ${totals.spawns} spawns, ${totals.merges} merges; ${totals.questCoins} quest coins; ${totals.preparationCoins} spent; ${finalState.coins} remain.`);
});

test('the legal action policy reproduces the same campaign evidence', () => {
  assert.deepEqual(runCampaignBalance(data), runCampaignBalance(data));
});
