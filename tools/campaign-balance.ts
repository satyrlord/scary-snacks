import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentTask, createGame, generatorOutputs, getItem, getLevel, legacyOrderReward, migrateLevelRewardGame, previewQuestCleanup, reduceGame, resolveQuests, taskEligibility, validateGame, validateLevelRewardGame } from '../src/engine.ts';
import type { Action, GameData, GameState, LevelRewardGameState, Order, Task } from '../src/engine.ts';

export type CampaignScenario = 'fresh' | 'fresh-rewards' | 'legacy-sales' | 'historical';
export type CampaignPolicy = 'fewest-ingredients' | 'best-income';
export type CampaignTotals = {
  actions: number; spawns: number; merges: number; served: number; sales: number; quests: number; levelClaims: number;
  orderCoins: number; saleCoins: number; levelCoins: number; questCoins: number; preparationCoins: number; xp: number;
};
export type CampaignChapter = CampaignTotals & {
  chapter: number; rules: 'current' | 'legacy-coin-only' | 'historical'; balance: number;
  cumulative: { actions: number; served: number; merges: number; xp: number };
};
export type CampaignPreparation = CampaignTotals & {
  id: string; title: string; chapter: number; cost: number; work: Task['work'] | null; goals: Task['goals'];
  rules: CampaignChapter['rules']; balance: number; cumulative: CampaignChapter['cumulative'];
};
export type CampaignBalance = {
  scenario: CampaignScenario; policy: CampaignPolicy; seed: number; chapters: CampaignChapter[]; preparations: CampaignPreparation[]; totals: CampaignTotals; finalState: GameState;
  conversion: null | { before: LevelRewardGameState; after: GameState };
  postCampaign: { orderIds: string[]; actions: number; served: number };
};

const emptyTotals = (): CampaignTotals => ({ actions: 0, spawns: 0, merges: 0, served: 0, sales: 0, quests: 0,
  levelClaims: 0, orderCoins: 0, saleCoins: 0, levelCoins: 0, questCoins: 0, preparationCoins: 0, xp: 0 });

/**
 * Deterministic reducer play. Sell starting food, then make each request from its highest earned source output.
 * Select the lowest ingredient cost, or the highest quoted reward per production, merge, and service action.
 * The income policy uses each source's current output tier and breaks ties by the waiting order's position.
 * Sell a merged dish only when a merge
 * goal remains after the coin and service goals. Claim rewards and complete quests only in their named scenarios.
 * Historical quotes use the former fixed bonus and stage formula, and historical sales use the former stage value.
 * Historical preparation costs are 20 + 10 times their zero-based position, with the preceding N and 2N goals.
 * The legacy prefix uses those same prices and costs with zero goals. It changes no saved resources.
 * Actions are game actions, not pointer presses. This fixture does not measure human play time or difficulty.
 */
export function runCampaignBalance(data: GameData, scenario: CampaignScenario = 'fresh', seed = 84017, policy: CampaignPolicy = 'fewest-ingredients'): CampaignBalance {
  const historicalData: GameData = { ...data,
    items: Object.fromEntries(Object.entries(data.items).map(([id, item]) => [id, { ...item, price: item.generator ? 0 : 4 * Math.max(1, Math.floor(item.stage / 2)) }])),
    tasks: data.tasks.map((task, index) => ({ ...task, cost: 20 + 10 * index,
      work: { summary: 'Historical budget fixture.', materials: 20 + 10 * index, labour: 0, hours: .5 },
      goals: { served: index + 1, merges: 2 * (index + 1) } })),
  };
  const legacyData: GameData = { ...historicalData, tasks: historicalData.tasks.map(task => ({ ...task, goals: { served: 0, merges: 0 } })) };
  let content = scenario === 'legacy-sales' ? legacyData : scenario === 'historical' ? historicalData : data;
  let state = createGame(content, seed);
  const historicalQuotes = () => {
    if (content === data) return;
    state.orders = state.orders.map(({ pricing: _pricing, ...order }) => ({ ...order, reward: legacyOrderReward(order.requirements, content) }));
  };
  historicalQuotes();
  const totals = emptyTotals();
  let previous = emptyTotals();
  let previousPreparation = emptyTotals();
  const chapters: CampaignChapter[] = [];
  const preparations: CampaignPreparation[] = [];
  let conversion: CampaignBalance['conversion'] = null;

  function act(action: Action) {
    const before = state;
    const result = reduceGame(before, action, content);
    assert.equal(result.ok, true, `${scenario}, preparation ${before.taskIndex + 1}, ${action.type}: ${result.message}`);
    state = result.state;
    if (action.type === 'serve') historicalQuotes();
    assert.equal(validateGame(state, content), true, `Valid state after ${action.type}.`);
    assert.equal(state.orders.length, 3, 'Every action keeps three live orders.');
    if (action.type === 'serve') {
      before.orders.forEach((order, index) => {
        if (order.id !== action.id) assert.deepEqual(state.orders[index], order, 'Other live orders keep their requirements and rewards.');
      });
    } else {
      assert.deepEqual(state.orders, before.orders, 'Only service replaces an ordinary order.');
      assert.equal(state.seed, before.seed, 'Other actions keep the random seed.');
    }
    totals.actions++;
    totals.merges += state.merges - before.merges;
    totals.served += state.served - before.served;
    totals.xp += state.xp - before.xp;
    if (action.type === 'spawn') totals.spawns++;
    if (action.type === 'serve') totals.orderCoins += state.coins - before.coins;
    if (action.type === 'sell') { totals.sales++; totals.saleCoins += state.coins - before.coins; }
    if (action.type === 'claimLevelReward') { totals.levelClaims++; totals.levelCoins += state.coins - before.coins; }
    if (action.type === 'deliverQuest') { totals.quests++; totals.questCoins += state.coins - before.coins; }
    if (action.type === 'task') totals.preparationCoins += before.coins - state.coins;
    assert.equal(state.coins, totals.orderCoins + totals.saleCoins + totals.levelCoins + totals.questCoins - totals.preparationCoins,
      'Every coin comes from a recorded legal action.');
    assert.ok(totals.actions < 50_000, 'The campaign must converge within the fixture action limit.');
  }

  function produce(code: string): number {
    const item = getItem(code, content);
    assert.ok(item && !item.generator, `Known dish: ${code}.`);
    const quest = content.quests.find(quest => quest.producer?.exclusiveItems.includes(code));
    const source = quest?.producer?.item ?? `generator_${item.chain}`;
    if (generatorOutputs(state, source, content).includes(code)) {
      const empty = state.board.indexOf(null);
      assert.ok(empty >= 0, 'The board has room for request production.');
      act({ type: 'spawn', index: state.board.findIndex(cell => cell?.code === source), output: code });
      assert.equal(state.board[empty]?.code, code);
      return empty;
    }
    const lower = Object.values({ ...content.items, ...content.questItems }).find(candidate => candidate.next === code);
    assert.ok(lower, `A merge path exists for ${code}.`);
    const first = produce(lower.id);
    const second = produce(lower.id);
    act({ type: 'move', from: first, to: second });
    assert.equal(state.board[second]?.code, code);
    return second;
  }

  function serve(order: Order) {
    for (const code of order.requirements) produce(code);
    act({ type: 'serve', id: order.id });
  }

  function claimRewards() {
    for (const reward of data.levelRewards) {
      if (reward.level <= getLevel(state) && !state.claimedLevelRewards.includes(reward.id)) act({ type: 'claimLevelReward', id: reward.id });
    }
  }

  function recordChapter(chapter: number) {
    const delta = emptyTotals();
    for (const key of Object.keys(delta) as (keyof CampaignTotals)[]) delta[key] = totals[key] - previous[key];
    chapters.push({ chapter, rules: rules(), ...delta, balance: state.coins,
      cumulative: { actions: totals.actions, served: state.served, merges: state.merges, xp: state.xp } });
    previous = { ...totals };
  }

  function rules(): CampaignChapter['rules'] {
    return content === legacyData ? 'legacy-coin-only' : content === historicalData ? 'historical' : 'current';
  }

  function complete(task: Task) {
    act({ type: 'task' });
    if (scenario === 'fresh-rewards' || scenario === 'legacy-sales' && content === data) claimRewards();
    const delta = emptyTotals();
    for (const key of Object.keys(delta) as (keyof CampaignTotals)[]) delta[key] = totals[key] - previousPreparation[key];
    preparations.push({ id: task.id, title: task.title, chapter: task.chapter, cost: task.cost, work: content === data ? task.work : null,
      goals: task.goals, rules: rules(), ...delta, balance: state.coins,
      cumulative: { actions: totals.actions, served: state.served, merges: state.merges, xp: state.xp } });
    previousPreparation = { ...totals };
    if (currentTask(state, content)?.chapter !== task.chapter) recordChapter(task.chapter);
  }

  for (const [index, cell] of state.board.entries()) {
    if (cell && !getItem(cell.code, content)!.generator) act({ type: 'sell', index });
  }

  // Earn the first half under the old rule, without service, merges, reward claims, or quests.
  if (scenario === 'legacy-sales') {
    while (state.taskIndex < 12) {
      const task = currentTask(state, content)!;
      if (taskEligibility(state, content).ready) {
        complete(task);
      } else {
        act({ type: 'sell', index: produce('bakery_1') });
      }
    }
    assert.equal(state.served, 0);
    assert.equal(state.merges, 0);
    // State 5 predates quests. Remove only the new fields; keep every original field and resource.
    const { completedQuests: _completed, legacySatisfiedQuests: _legacy, activeQuestProducers: _active, ...saved } = structuredClone(state);
    const before: LevelRewardGameState = { ...saved, version: 5 };
    const oldBytes = JSON.stringify(before);
    assert.equal(validateLevelRewardGame(before, data), true);
    state = migrateLevelRewardGame(before, data);
    assert.deepEqual(migrateLevelRewardGame(before, data), state, 'Repeated conversion gives the same state.');
    assert.equal(JSON.stringify(before), oldBytes, 'Conversion preserves the older saved bytes.');
    for (const key of Object.keys(before) as (keyof LevelRewardGameState)[]) {
      if (key !== 'version') assert.deepEqual(state[key], before[key], `Conversion preserves ${key}.`);
    }
    conversion = { before, after: structuredClone(state) };
    content = data;
  }

  for (;;) {
    if (scenario === 'fresh-rewards' || scenario === 'legacy-sales') claimRewards();
    if (scenario === 'fresh-rewards') {
      const available = resolveQuests(state, data).find(view => view.status === 'active' || view.status === 'offer');
      if (available) {
        const quest = available.quest;
        if (available.status === 'offer') act({ type: 'acceptQuest', id: quest.id });
        for (const requirement of quest.requirements) {
          for (let count = 0; count < requirement.quantity; count++) produce(requirement.item);
        }
        const cleanup = quest.producer ? previewQuestCleanup(state, quest.id, data) : null;
        act({ type: 'deliverQuest', id: quest.id, ...(cleanup ? { cleanupToken: cleanup.token } : {}) });
        continue;
      }
    }
    const task = currentTask(state, content);
    if (!task) break;
    if (taskEligibility(state, content).ready) {
      complete(task);
      continue;
    }
    if (state.coins < task.cost || state.served < task.goals.served) {
      const effort = (order: Order) => order.requirements.reduce((sum, code) => sum + 2 ** (data.items[code].stage - 1), 0);
      const actionCost = (order: Order) => 1 + order.requirements.reduce((sum, code) => {
        const item = content.items[code];
        const tier = Math.max(...generatorOutputs(state, `generator_${item.chain}`, content).map(output => content.items[output].stage));
        return sum + 2 * 2 ** Math.max(0, item.stage - tier) - 1;
      }, 0);
      const order = [...state.orders].sort((first, second) => policy === 'best-income'
        ? second.reward * actionCost(first) - first.reward * actionCost(second)
        : effort(first) - effort(second))[0];
      serve(order);
    } else if (state.merges < task.goals.merges) {
      const first = produce('bakery_1');
      const second = produce('bakery_1');
      act({ type: 'move', from: first, to: second });
      act({ type: 'sell', index: second });
    } else {
      assert.fail(`The campaign cannot resolve these blockers: ${taskEligibility(state, data).blockers.join(' ')}`);
    }
  }

  assert.equal(state.taskIndex, data.tasks.length);
  assert.equal(validateGame(state, data), true);
  assert.equal(totals.preparationCoins, preparations.reduce((sum, task) => sum + task.cost, 0));
  const finalState = structuredClone(state);
  const campaignTotals = { ...totals };
  // Prove that each order present at the finale is still achievable. Exclude these actions from campaign totals.
  const orderIds = state.orders.map(order => order.id);
  for (const id of orderIds) serve(state.orders.find(order => order.id === id)!);
  const postCampaign = { orderIds, actions: totals.actions - campaignTotals.actions, served: state.served - finalState.served };
  return { scenario, policy, seed, chapters, preparations, totals: campaignTotals, finalState, conversion, postCampaign };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
  const reports = (['historical', 'fresh', 'fresh-rewards', 'legacy-sales'] as const).map(scenario => runCampaignBalance(data, scenario));
  reports.push(runCampaignBalance(data, 'historical', 84017, 'best-income'), runCampaignBalance(data, 'fresh', 84017, 'best-income'));
  const comparison = reports.map(report => ({ scenario: report.scenario, policy: report.policy, actions: report.totals.actions,
    served: report.totals.served, merges: report.totals.merges, cost: report.totals.preparationCoins,
    actionsComparedWithHistorical: report.totals.actions / reports.find(baseline => baseline.scenario === 'historical' && baseline.policy === report.policy)!.totals.actions,
    firstPreparation: { actions: report.preparations[0].actions, served: report.preparations[0].served, merges: report.preparations[0].merges, cost: report.preparations[0].cost } }));
  const runs = reports.map(({ finalState, conversion, ...report }) => ({ ...report, final: { preparations: finalState.taskIndex, balance: finalState.coins,
      served: finalState.served, merges: finalState.merges, xp: finalState.xp, quests: finalState.completedQuests.length },
      conversion: conversion ? { preparation: conversion.before.taskIndex, served: conversion.before.served,
        merges: conversion.before.merges, balance: conversion.before.coins, xp: conversion.before.xp } : null }));
  console.log(JSON.stringify({ comparison, runs }, null, 2));
}
