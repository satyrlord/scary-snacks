import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getItem, requiredQuests, resolveQuests, supperComplete, supperQuest } from '../src/model.ts';
import { KEEP_FREE, validateGame } from '../src/engine.ts';
import { BALANCE_SEEDS, runCampaignBalance } from '../tools/campaign-balance.ts';
import type { CampaignTotals } from '../tools/campaign-balance.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';
import { act, data, nightLine, player, runs, recovery } from './support.ts';

/** The first efficient run, which checks the state after every action. */
const report = runCampaignBalance(data, BALANCE_SEEDS[0]);
/** The efficient runs for every seed, without the check of the state after every action. Two tests share them. */
let efficient: ReturnType<typeof runs> | undefined;
const efficientRuns = () => efficient ??= runs('efficient');
// The quests that the preparations need: every quest except the supper and the recovery quest.
const campaign = requiredQuests(data.tasks.length, data);

test('the efficient run pays all 24 preparations and serves the supper with no injected coins or items', t => {
  const { totals, finalState } = report;
  const supper = supperQuest(data)!;
  assert.equal(finalState.taskIndex, data.tasks.length);
  assert.equal(validateGame(finalState, data), true);
  assert.ok(supperComplete(finalState, data));
  assert.deepEqual(new Set(finalState.completedQuests), new Set([...campaign.map(quest => quest.id), supper.id]), 'The last preparation needs every campaign quest.');
  assert.equal(finalState.completedQuests.at(-1), supper.id);
  assert.equal(totals.quests, campaign.length + 1 + totals.recoveries + totals.repeats, 'Each campaign quest, the supper, each recovery tea, and each repeating quest.');
  // Every coin comes from a quest or a cleared blocker, and goes to a preparation, a take, or the upkeep.
  assert.equal(finalState.coins, totals.questCoins + totals.blockerCoins - totals.preparationCoins - totals.takeCoins - totals.upkeepCoins);
  assert.equal(totals.upkeepCoins, (finalState.clock.day - 1) * data.day.upkeep, 'Each closing pays the upkeep.');
  assert.deepEqual(finalState.act1, { days: finalState.clock.day, purse: finalState.coins }, 'The supper records the result of act 1.');
  assert.equal(totals.questCoins, campaign.reduce((sum, quest) => sum + quest.reward, 0) + totals.recoveries * recovery.reward + totals.repeatCoins);
  assert.equal(totals.preparationCoins, data.tasks.reduce((sum, task) => sum + task.cost, 0));
  // A cleared preparation blocker and a cleared rat hole each give the blocker coin. Each theft makes at most one rat hole.
  const cleared = finalState.resolvedObstacles.length * data.economy.blockerCoin;
  assert.ok(totals.blockerCoins >= cleared && totals.blockerCoins <= cleared + report.nights.thefts * data.economy.blockerCoin);
  assert.ok(totals.takeCoins > 0 && totals.takeCoins <= totals.spawns * data.economy.takeCost);
  // The legal policy reads no scene, so each preparation scene, each chapter scene, and the finale wait in story order.
  const story = [...data.chapters.flatMap((chapter, index) => [...data.tasks.filter(task => task.chapter === index + 1).map(task => task.id), chapter.id]), data.finale.id];
  assert.deepEqual(finalState.pendingScenes.filter(id => story.includes(id)), story);
  assert.deepEqual(new Set(finalState.pendingScenes.filter(id => !story.includes(id))),
    new Set([...campaign.map(quest => quest.id), ...data.quests.flatMap(quest => quest.followUp ? [quest.followUp.id] : []),
      ...data.characters.flatMap(person => person.arrival ? [`arrival-${person.id}`] : [])]));
  assert.equal(finalState.layoutId, data.board.defaultLayout);
  assert.ok(finalState.preparationObstacles!.placed.length >= 3);
  // After the supper, the bistro has no other work, so only a repeating quest is open.
  const open = resolveQuests(finalState, data).filter(view => view.status === 'active' || view.status === 'waiting').map(view => view.quest);
  assert.ok(open.length === 1 && open[0].repeating && finalState.repeating?.open === open[0].id, 'Only a saved repeating quest is open after the supper.');
  t.diagnostic(`${totals.actions} actions, ${totals.spawns} takes, ${totals.merges} merges; ${totals.questCoins} quest coins, ${totals.blockerCoins} blocker coins; ${totals.takeCoins} on takes, ${totals.preparationCoins} on preparations, ${totals.upkeepCoins} on upkeep; ${totals.recoveries} recovery teas; ${report.purse} remain.`);
});

test('the efficient strategy finishes act 1 in 18 to 30 days for every seed, with the purse in its band and never below zero', t => {
  for (const [seed, run] of efficientRuns()) {
    const { totals, nights, finalState } = run;
    assert.equal(finalState.taskIndex, data.tasks.length, `Seed ${seed}: all 24 preparations.`);
    assert.ok(supperComplete(finalState, data), `Seed ${seed}: the supper is served.`);
    assert.equal(nights.lowestPurse, 0, `Seed ${seed}: the purse never goes below zero.`);
    assert.equal(nights.fillerMerges, 0, `Seed ${seed}: no dish only to move the clock.`);
    assert.ok(nights.lanterns > 0, `Seed ${seed}: the lanterns bring the booked guests.`);
    assert.ok(nights.days >= 18 && nights.days <= 30, `Seed ${seed}: act 1 lasts ${nights.days} days.`);
    // The balance band, with the upkeep in the spending.
    assert.equal(run.spending, totals.preparationCoins + totals.takeCoins + totals.upkeepCoins);
    assert.ok(run.purse >= 0 && run.purse <= run.spending * 0.2, `Seed ${seed}: ${run.purse} coins is outside 0 to 20% of ${run.spending}.`);
    t.diagnostic(`${nightLine(seed, run, `, free cells ${run.preparations.map(value => value.freeCells).join(' ')}`)} Purse ${run.purse} of ${run.spending} spent (${(100 * run.purse / run.spending).toFixed(1)}%).`);
  }
});

test('the run records the coins, the takes, and the free cells at each preparation and each chapter', t => {
  const { totals } = report;
  assert.deepEqual(report.chapters.map(chapter => chapter.chapter), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(report.preparations.map(task => task.id), data.tasks.map(task => task.id));
  let balance = 0;
  for (const chapter of report.chapters) {
    balance += chapter.questCoins + chapter.blockerCoins - chapter.preparationCoins - chapter.takeCoins - chapter.upkeepCoins;
    assert.equal(chapter.balance, balance, `Chapter ${chapter.chapter} records its actual balance.`);
    assert.equal(chapter.preparationCoins, report.preparations.filter(task => task.chapter === chapter.chapter).reduce((sum, task) => sum + task.cost, 0));
  }
  // The chapters and the preparations record the same play. The supper comes after the last preparation, so only its delivery is outside them.
  const sum = (rows: CampaignTotals[], key: keyof CampaignTotals) => rows.reduce((total, row) => total + row[key], 0);
  for (const key of Object.keys(totals) as (keyof CampaignTotals)[]) {
    assert.equal(sum(report.chapters, key), sum(report.preparations, key), `${key} is the same by chapter and by preparation.`);
    assert.ok(sum(report.preparations, key) <= totals[key], key);
  }
  for (const key of ['questCoins', 'preparationCoins', 'blockerCoins', 'recoveries'] as const) assert.equal(sum(report.preparations, key), totals[key], `${key} is fully recorded by preparation.`);
  assert.equal(totals.quests - sum(report.preparations, 'quests'), 1, 'Only the supper is delivered after the last preparation.');
  for (const preparation of report.preparations) {
    const authored = data.tasks.find(task => task.id === preparation.id)!;
    assert.deepEqual(preparation.work, authored.work);
    assert.equal(preparation.cost, authored.work.materials + authored.work.labour);
    assert.ok(preparation.balance >= 0);
    assert.ok(Number.isInteger(preparation.freeCells) && preparation.freeCells >= KEEP_FREE && preparation.freeCells <= data.board.initial.length,
      `${preparation.id} leaves room for a recovery tea.`);
  }
  t.diagnostic(`Free cells after each preparation: ${report.preparations.map(preparation => preparation.freeCells).join(' ')}.`);
  t.diagnostic(`Take coins by preparation: ${report.preparations.map(preparation => preparation.takeCoins).join(' ')}.`);
});

test('the check of the state after every action does not change the efficient run', () => {
  assert.deepEqual(efficientRuns()[0], [BALANCE_SEEDS[0], report]);
});

test('a player who buys a spare staple before each preparation repays it with recovery teas and pays every preparation', t => {
  const teas: number[] = [];
  for (let count = 0; count < data.tasks.length; count++) {
    let state = checkpointState(data, count);
    const task = data.tasks[count];
    assert.equal(state.coins, task.cost);
    // One spare staple from a paid source leaves the purse short of the preparation.
    const paid = state.board.findIndex(cell => !!cell && !!getItem(cell.code, data)?.generator && !getItem(cell.code, data)!.generator!.free);
    state = act(state, { type: 'spawn', index: paid });
    assert.equal(state.coins, task.cost - data.economy.takeCost);
    let made = 0;
    while (state.coins < task.cost) {
      const views = resolveQuests(state, data);
      assert.equal(views.find(view => view.quest === recovery)!.status, 'active', `${task.id}: the recovery quest opens.`);
      assert.deepEqual(views.filter(view => !view.quest.recovery && (view.status === 'active' || view.status === 'waiting')), [], 'No campaign quest takes a ticket.');
      // One Linden tea from free herbs: Elderflowers merge into Herb bunches, Socată, and tea, with reducer actions only.
      const play = player(state);
      for (const { item, quantity } of recovery.requirements) for (let portion = 0; portion < quantity; portion++) play.produce(item);
      assert.equal(play.state.coins, state.coins, 'The herbs are free.');
      const before = play.state;
      state = act(before, { type: 'deliverQuest', id: recovery.id });
      assert.equal(state.coins, before.coins + recovery.reward);
      assert.deepEqual(state.completedQuests, before.completedQuests, 'The recovery quest is never recorded.');
      assert.deepEqual(state.pendingScenes, before.pendingScenes, 'The recovery quest queues no scene.');
      made++;
    }
    assert.equal(resolveQuests(state, data).find(view => view.quest === recovery)!.status, 'locked', `${task.id}: the recovery quest closes.`);
    state = act(state, { type: 'task' });
    assert.equal(state.taskIndex, count + 1);
    teas.push(made);
  }
  t.diagnostic(`Recovery teas before each preparation: ${teas.join(' ')}.`);
});

test('the balance tool refuses an unknown strategy, so a typing error never prints the efficient results', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('../tools/campaign-balance.ts', import.meta.url)), 'miss-booking'], { encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Use the strategy efficient, miss-bookings, or debt\./);
  assert.equal(run.stdout, '');
});
