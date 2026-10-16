import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { availableLevelRewards, createGame, dataProblems, getLevel, levelRewardProblems, migrateGame, migratePreviousGame, migrateGeneratorGame, migrateLevelRewardGame, migrateQuestGame, reduceGame, validateGame, validateGeneratorGame, validateLevelRewardGame, validateLegacyGame, validatePreviousGame, legacyOrderReward } from '../src/engine.ts';
import type { GameData, GameState, GeneratorGameState } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const claim = (state: GameState, id: string) => reduceGame(state, { type: 'claimLevelReward', id }, data);
function rejected(state: GameState, id: string, message: RegExp) {
  const before = structuredClone(state);
  const result = claim(state, id);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.equal(result.event, null);
  assert.match(result.message, message);
  assert.deepEqual(state, before);
}

test('the authored schedule gives twenty coins once at levels two through ten', () => {
  assert.deepEqual(levelRewardProblems(data), []);
  assert.deepEqual(data.levelRewards, Array.from({ length: 9 }, (_, index) => ({ id: `level-${index + 2}`, level: index + 2, coins: 20 })));
  const state = createGame(data);
  assert.equal(getLevel(state), 1);
  assert.deepEqual(state.claimedLevelRewards, []);
  for (const reward of data.levelRewards) {
    const threshold = (reward.level - 1) * 100;
    for (const xp of [0, threshold - 1]) rejected({ ...state, xp }, reward.id, /Reach level/);
    for (const xp of [threshold, threshold + 1]) {
      const earned = { ...state, xp };
      const before = structuredClone(earned);
      const result = claim(earned, reward.id);
      assert.equal(result.ok, true);
      assert.equal(result.event, 'claimLevelReward');
      assert.equal(result.message, `Claimed level ${reward.level}: 20 coins.`);
      assert.deepEqual(result.state, { ...earned, coins: 20, claimedLevelRewards: [reward.id] });
      assert.deepEqual(earned, before);
      assert.equal(validateGame(result.state, data), true);
      rejected(result.state, reward.id, /already claimed/);
    }
  }
});

test('a merge gives one XP, a serve gives four XP per requirement stage, and a preparation gives twenty XP', () => {
  const state = createGame(data);
  assert.equal(reduceGame(state, { type: 'move', from: 13, to: 14 }, data).state.xp, state.xp + 1);
  const order = state.orders[0];
  const ready = structuredClone(state);
  order.requirements.forEach((code, offset) => { ready.board[20 + offset] = { code }; });
  const served = reduceGame(ready, { type: 'serve', id: order.id }, data);
  assert.equal(served.ok, true, served.message);
  assert.equal(served.state.xp, state.xp + order.requirements.reduce((sum, code) => sum + 4 * data.items[code].stage, 0));
  const paid = reduceGame({ ...state, coins: data.tasks[0].cost, ...data.tasks[0].goals }, { type: 'task' }, data);
  assert.equal(paid.ok, true, paid.message);
  assert.equal(paid.state.xp, state.xp + 20);
});

test('several reached milestones can be claimed in any order without more XP or progress', () => {
  let state = { ...createGame(data), xp: 2500 };
  const before = structuredClone(state);
  for (const reward of [...data.levelRewards].reverse()) {
    const result = claim(state, reward.id);
    assert.equal(result.ok, true);
    state = result.state;
  }
  assert.deepEqual(state, { ...before, coins: 180, claimedLevelRewards: [...data.levelRewards].reverse().map(reward => reward.id) });
  assert.equal(getLevel(state), 26);
  rejected(state, 'level-11', /known level reward/);
  rejected(state, '__proto__', /known level reward/);
});

test('the rewards that the House book offers are the rewards that a claim accepts', () => {
  for (const xp of [0, 99, 100, 450, 999, 2500]) {
    for (const claimed of [[], ['level-2'], ['level-3', 'level-5']]) {
      const state = { ...createGame(data), xp, claimedLevelRewards: claimed };
      const offered = availableLevelRewards(state, data);
      for (const reward of data.levelRewards) assert.equal(claim(state, reward.id).ok, offered.includes(reward), `${reward.id} at ${xp} XP`);
    }
  }
  const full = { ...createGame(data), xp: 100, coins: 999_999_981 };
  assert.deepEqual(availableLevelRewards(full, data).map(reward => reward.id), ['level-2'], 'A reward that the coin limit blocks stays available.');
});

test('a full board and pantry permit a coin claim; overflow preserves the claim for later', () => {
  const state = { ...createGame(data), layoutId: 'legacy-open', xp: 100, coins: 999_999_981, ...data.tasks[0].goals };
  state.board = state.board.map(cell => cell ?? { code: 'bakery_1' });
  state.inventory = Array.from({ length: data.inventoryCapacity }, () => ({ code: 'bakery_1' }));
  assert.equal(validateGame(state, data), true);
  rejected(state, 'level-2', /Spend some coins/);
  const spent = reduceGame(state, { type: 'task' }, data);
  assert.equal(spent.ok, true);
  const later = claim(spent.state, 'level-2');
  assert.equal(later.ok, true);
  assert.equal(later.state.coins, state.coins - data.tasks[0].cost + data.levelRewards[0].coins);
  assert.equal(validateGame(later.state, data), true);
  const exact = claim({ ...state, coins: 999_999_980 }, 'level-2');
  assert.equal(exact.ok, true);
  assert.equal(exact.state.coins, 1_000_000_000);
  assert.equal(validateGame(exact.state, data), true);
  rejected({ ...state, coins: 1_000_000_000 }, 'level-2', /Spend some coins/);
});

test('save validation rejects missing, duplicate, unknown, or unearned claims', () => {
  const state = { ...createGame(data), xp: 100 };
  for (const claims of [undefined, null, {}, 'level-2', Array(1), [null], [2], ['level-2', 'level-2'], ['missing'], ['level-3'], ['__proto__']]) {
    assert.equal(validateGame({ ...state, claimedLevelRewards: claims }, data), false, JSON.stringify(claims));
  }
  for (const claims of [[], ['level-2']]) assert.equal(validateGame({ ...state, claimedLevelRewards: claims }, data), true);
  assert.equal(validateGame({ ...state, xp: 99, claimedLevelRewards: ['level-2'] }, data), false);
  assert.equal(validateGame({ ...state, xp: 900, claimedLevelRewards: data.levelRewards.map(reward => reward.id) }, data), true);
});

test('the reward data check rejects invalid and unsupported schedules', () => {
  for (const schedule of [undefined, null, {}, [], [null], [[]], [{ id: 'bad id', level: 2, coins: 20 }],
    [{ id: 'level-2', level: 0, coins: 20 }], [{ id: 'level-2', level: 1, coins: 20 }],
    [{ id: 'level-2', level: 2.5, coins: 20 }], [{ id: 'level-2', level: 10_000_002, coins: 20 }],
    [{ id: 'level-2', level: 2, coins: 0 }], [{ id: 'level-2', level: 2, coins: 1.5 }],
    [{ id: 'level-2', level: 2, coins: 1_000_000_001 }], [{ id: 'level-2', level: 2, item: 'bakery_1' }],
    [data.levelRewards[0], data.levelRewards[0]], [data.levelRewards[0], { id: 'other', level: 2, coins: 20 }]]) {
    const broken = { ...data, levelRewards: schedule } as GameData;
    assert.ok(levelRewardProblems(broken).length, JSON.stringify(schedule));
    assert.ok(dataProblems(broken).length, JSON.stringify(schedule));
  }
});

test('version four conversion preserves each campaign checkpoint and offers existing XP rewards without paying them', () => {
  for (const count of [0, 12, 24]) {
    let state = createGame(data);
    state.coins = data.tasks.reduce((sum, task) => sum + task.cost, 0);
    state.served = data.tasks[count - 1]?.goals.served ?? 0;
    state.merges = data.tasks[count - 1]?.goals.merges ?? 0;
    for (let index = 0; index < count; index++) state = reduceGame(state, { type: 'task' }, data).state;
    state.xp = count * 100;
    if (count >= 12) {
      state.outputChoices = { bakery: 'bakery_2' };
      state.decorationChoices = { tableware: 'green' };
    }
    const { claimedLevelRewards: _, completedQuests: _complete, legacySatisfiedQuests: _legacy, activeQuestProducers: _active,
      layoutId: _layout, resolvedObstacles: _resolved, ...previous } = structuredClone(state);
    const old: GeneratorGameState = { ...previous, version: 4, orders: previous.orders.map(({ pricing: _, ...order }) => ({ ...order, reward: legacyOrderReward(order.requirements, data) })) };
    const before = structuredClone(old);
    assert.equal(validateGeneratorGame(old, data), true);
    assert.equal(validateGame(old, data), false);
    const converted = migrateGeneratorGame(old, data);
    assert.deepEqual(converted, { ...old, version: 5, claimedLevelRewards: [] });
    assert.deepEqual(old, before);
    assert.deepEqual(migrateGeneratorGame(old, data), converted);
    assert.equal(validateLevelRewardGame(converted, data), true);
    if (count) {
      const result = claim(migrateQuestGame(migrateLevelRewardGame(converted, data), data), 'level-10');
      assert.equal(result.ok, true);
      assert.equal(result.state.coins, old.coins + 20);
      assert.throws(() => migrateGeneratorGame(result.state, data), /damaged or unknown/);
    }
  }
});

test('every older schema rejects injected claims and conversion validates both ends', () => {
  const { claimedLevelRewards: _, outputChoices: __, decorationChoices: ___, completedQuests: _complete, legacySatisfiedQuests: _legacy, activeQuestProducers: _active,
    layoutId: _layout, resolvedObstacles: _resolved, ...base } = createGame(data);
  const old = { ...base, version: 2, xp: 900, orders: base.orders.map(({ pricing: _, ...order }) => ({ ...order, reward: legacyOrderReward(order.requirements, data) })) };
  assert.equal(validateLegacyGame(old, data), true);
  const previous = migrateGame(old, data);
  const generator = migratePreviousGame(previous, data);
  const current = migrateGeneratorGame(generator, data);
  assert.deepEqual(current.claimedLevelRewards, []);
  assert.equal(current.coins, old.coins);
  assert.equal(current.xp, old.xp);
  assert.equal(validateLegacyGame({ ...old, claimedLevelRewards: [] }, data), false);
  assert.equal(validatePreviousGame({ ...previous, claimedLevelRewards: [] }, data), false);
  assert.equal(validateGeneratorGame({ ...generator, claimedLevelRewards: [] }, data), false);
  assert.throws(() => migrateGeneratorGame({ ...generator, coins: -1 }, data), /damaged or unknown/);
  assert.throws(() => migrateGeneratorGame({ ...generator, version: 99 }, data), /damaged or unknown/);
});
