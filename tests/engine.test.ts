import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, dataProblems, validateGame, reduceGame, canServe, currentTask, firstFreeBoardCell, getLevel, normalizeOrderCustomers, resolveRooms, latestArea, roomProblems, roomPaintings, generatorOutputs, generatorTierProblems, taskEligibility, menuReward, saleValue } from '../src/engine.ts';
import { exportSave, importSave } from '../src/storage.ts';
import { imageVariants } from '../tools/build-image-variants.ts';
import type { Action, GameData, GameState, Order } from '../src/engine.ts';
const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
data.board.layouts.push({ id: 'test-open', obstacles: [] });
const initial = (seed?: number) => ({ ...createGame(data, seed), layoutId: 'test-open' });
// Fixtures for tiers, placement, and room art isolate those rules from campaign effort.
const withGoals = (state: GameState) => Object.assign(state, data.tasks.at(-1)!.goals);
function apply(state: GameState, action: Action) {
  const before = JSON.stringify(state);
  const result = reduceGame(state, action, data);
  assert.equal(result.ok, true, result.message);
  assert.equal(JSON.stringify(state), before, 'An action must not mutate the input state.');
  assert.equal(validateGame(result.state, data), true, `Invalid state after ${action.type}`);
  return result.state;
}
// Takes unknown input: some tests pass actions that the Action type does not admit.
function fail(state: GameState, action: unknown) {
  const before = JSON.stringify(state);
  const result = reduceGame(state, action as Action, data);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.equal(JSON.stringify(state), before);
  return result;
}
function fillBoard(state: GameState) {
  const index = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  while (firstFreeBoardCell(state, data) !== -1) state = apply(state, { type: 'spawn', index });
  return state;
}

test('original data has 30 named stages, five generators, twelve characters, and 24 tasks', () => {
  assert.equal(data.title, 'Scary Snacks');
  assert.equal(data.board.columns * data.board.rows, 42);
  assert.equal(Object.keys(data.items).length, 35);
  assert.equal(data.characters.length, 12);
  assert.equal(data.characters.filter(person => !person.visitor && !person.occasional).length, 4);
  assert.equal(data.characters.filter(person => person.occasional).length, 2);
  assert.equal(data.tasks.length, 24);
  assert.equal(new Set(data.tasks.map(task => task.id)).size, 24);
  for (const task of data.tasks) {
    assert.equal(task.dialogue.length, 3);
    assert.ok(task.dialogue.every(line => data.characters.some(person => person.id === line.speaker) && line.text.length > 0));
  }
  for (const chain of data.chains) {
    for (let stage = 1; stage <= 6; stage++) {
      const item = data.items[`${chain.id}_${stage}`];
      assert.ok(item.name);
      assert.equal(item.next, stage === 6 ? null : `${chain.id}_${stage + 1}`);
    }
    assert.deepEqual(data.items[`generator_${chain.id}`].generator?.outputs, [`${chain.id}_1`]);
  }
});

test('dish and drink names use only English and Romanian letters', () => {
  for (const item of Object.values(data.items)) if (!item.generator) assert.match(item.name, /^[A-Za-zĂÂÎȘȚăâîșț ]+$/, item.name);
});

test('fresh games are valid, deterministic, and independent', () => {
  const state = initial(0);
  assert.equal(validateGame(state, data), true);
  assert.deepEqual(state, initial(0));
  assert.notDeepEqual(state.orders, initial(123).orders);
  state.board[0] = { code: 'bakery_1' };
  assert.equal(initial(0).board[0], null);
  assert.equal(getLevel(initial()), 1);
  assert.equal(currentTask(initial(), data)?.id, 'task_1');
});

test('generators have unlimited free output with no clock state', () => {
  let state = initial();
  const coins = state.coins;
  const generator = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  for (let index = 0; index < 100; index++) {
    state = apply(state, { type: 'spawn', index: generator });
    const spawned = state.board.findIndex((cell, position) => position !== generator && cell?.code === 'bakery_1');
    state = apply(state, { type: 'sell', index: spawned });
  }
  assert.equal(state.coins, coins + 100);
  assert.equal('energy' in state, false);
  assert.equal('cooldowns' in state, false);
});

test('production tiers validate their chain, stage, unlock, and preparation order', () => {
  assert.deepEqual(generatorTierProblems(data), []);
  for (const tiers of [
    [{ chain: 'absent', stage: 2, after: 'task_12' }],
    [{ chain: 'bakery', stage: 7, after: 'task_12' }],
    [{ chain: 'bakery', stage: 2, after: 'absent' }],
    [{ chain: 'sweet', stage: 2, after: 'task_2' }],
    [{ chain: 'bakery', stage: 3, after: 'task_12' }, { chain: 'bakery', stage: 2, after: 'task_20' }],
    [{ chain: 'bakery', stage: 2, after: 'task_12' }, { chain: 'bakery', stage: 3, after: 'task_12' }],
  ]) assert.ok(generatorTierProblems({ ...data, generatorTiers: tiers }).length > 0);
  const broken = structuredClone(data);
  broken.items.bakery_2.chain = 'warm';
  assert.ok(generatorTierProblems(broken).length > 0);
});

test('paid production tiers change no items or orders', () => {
  let state = withGoals(initial());
  state.coins = 100000;
  for (let count = 1; count <= 20; count++) {
    const before = state;
    const result = reduceGame(state, { type: 'task' }, data);
    state = apply(state, { type: 'task' });
    const tier = count < 12 ? 1 : count < 20 ? 2 : 3;
    assert.deepEqual(generatorOutputs(state, 'generator_bakery', data), Array.from({ length: tier }, (_, index) => `bakery_${index + 1}`));
    assert.deepEqual(state.orders, before.orders);
    assert.equal(state.seed, before.seed);
    assert.deepEqual(state.outputChoices, {});
    if (count === 12 || count === 20) {
      assert.deepEqual(state.board, before.board);
      for (const chain of data.chains) assert.ok(result.message.includes(`The ${data.items[`generator_${chain.id}`].name} can now make ${data.items[`${chain.id}_${tier}`].name}.`));
    } else assert.ok(!result.message.includes('can now make'));
  }
  const index = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  for (const output of ['bakery_3', 'bakery_2', 'bakery_1']) {
    const seed = state.seed;
    const empty = firstFreeBoardCell(state, data);
    state = apply(state, { type: 'spawn', index, output });
    assert.equal(state.board[empty]?.code, output);
    assert.equal(state.seed, seed);
    assert.equal(state.outputChoices.bakery, output === 'bakery_1' ? undefined : output);
    const repeated = firstFreeBoardCell(state, data);
    state = apply(state, { type: 'spawn', index });
    assert.equal(state.board[repeated]?.code, output);
    assert.equal(state.seed, seed);
  }
});

test('output choices survive moves and later upgrades while failed takes change nothing', () => {
  let state = withGoals(initial());
  state.coins = 100000;
  for (let index = 0; index < 12; index++) state = apply(state, { type: 'task' });
  state = apply(state, { type: 'spawn', index: 1, output: 'bakery_2' });
  state = apply(state, { type: 'move', from: 1, to: firstFreeBoardCell(state, data) });
  for (let index = 12; index < 20; index++) state = apply(state, { type: 'task' });
  assert.deepEqual(state.outputChoices, { bakery: 'bakery_2' });
  const index = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  const empty = firstFreeBoardCell(state, data);
  state = apply(state, { type: 'spawn', index });
  assert.equal(state.board[empty]?.code, 'bakery_2');
  fail(state, { type: 'sell', index });
  for (const output of ['bakery_4', 'warm_2', 'absent', '__proto__', null, 2]) {
    const result = fail(state, { type: 'spawn', index, output });
    assert.equal(result.message, 'Choose an available output from this source.');
  }
  fail(state, { type: 'spawn', index: empty, output: 'bakery_3' });
  state = fillBoard(state);
  fail(state, { type: 'spawn', index, output: 'bakery_3' });
  assert.deepEqual(state.outputChoices, { bakery: 'bakery_2' });
  for (const count of [11, 19]) {
    let boundary = withGoals(initial());
    boundary.coins = 100000;
    for (let index = 0; index < count; index++) boundary = apply(boundary, { type: 'task' });
    fail(boundary, { type: 'spawn', index: 1, output: `bakery_${count === 11 ? 2 : 3}` });
  }
});

test('chosen outputs reject unknown, locked, cross-chain, base-stage, and unearned values', () => {
  for (const outputs of [null, [], 'bakery_2', { bakery: 'bakery_1' }, { bakery: 'bakery_2' }, { sweet: 'sweet_2' }, { absent: 'bakery_2' }, { bakery: '__proto__' }, { bakery: 'generator_bakery' }, { bakery: 'warm_2' }]) {
    assert.equal(validateGame({ ...initial(), outputChoices: outputs }, data), false, JSON.stringify(outputs));
  }
  const { outputChoices: _choices, ...missing } = initial();
  assert.equal(validateGame(missing, data), false);
});

test('all lower-stage orders remain payable after upgrades, including duplicate requirements', () => {
  for (const [count, stages] of [[12, 1], [20, 2]]) {
    for (const chain of data.chains) for (let stage = 1; stage <= stages; stage++) {
      let state = withGoals(initial());
      state.coins = 100000;
      for (let index = 0; index < count - 1; index++) state = apply(state, { type: 'task' });
      const code = `${chain.id}_${stage}`;
      const order = state.orders[0];
      order.requirements = [code, code];
      order.reward = menuReward(order.requirements, data);
      const before = structuredClone(order);
      state = apply(state, { type: 'task' });
      assert.deepEqual(state.orders[0], before);
      const index = state.board.findIndex(cell => cell?.code === `generator_${chain.id}`);
      state = apply(state, { type: 'spawn', index, output: code });
      state = apply(state, { type: 'spawn', index, output: code });
      assert.ok(canServe(state, order, data));
      const coins = state.coins;
      state = apply(state, { type: 'serve', id: order.id });
      assert.equal(state.coins, coins + order.reward);
    }
  }
});

test('production upgrades need no board space', () => {
  for (const count of [11, 19]) {
    let state = withGoals(initial());
    state.coins = 100000;
    for (let index = 0; index < count; index++) state = apply(state, { type: 'task' });
    state = fillBoard(state);
    const before = structuredClone(state);
    state = apply(state, { type: 'task' });
    assert.deepEqual(state.board, before.board);
    assert.equal(generatorOutputs(state, 'generator_bakery', data).length, count === 11 ? 2 : 3);
  }
});

test('a newly unlocked source uses the earned tier and starts with stage one selected', () => {
  const later = structuredClone(data);
  delete later.tasks[2].unlock;
  later.tasks[11].unlock = 'sweet';
  // This source-only fixture moves the related request to the later unlock as well.
  later.quests.find(quest => quest.id === 'eszter-table')!.afterTask = 'task_12';
  later.quests.find(quest => quest.id === 'janos-first-pack')!.afterTask = 'task_12';
  // That request now opens as chapter 3 ends, so other requests contribute to chapters 3 and 5.
  later.chapters[2].contribution = 'mara-table';
  later.chapters[4].contribution = 'eszter-tasting';
  for (const batch of later.board.preparations.slice(0, 11)) for (const obstacle of batch.obstacles) {
    if (later.items[obstacle.ingredient].chain === 'sweet') obstacle.ingredient = 'bakery_1';
  }
  assert.deepEqual(dataProblems(later), []);
  let state = withGoals(createGame(later));
  state.coins = 100000;
  for (let index = 0; index < 12; index++) {
    const result = reduceGame(state, { type: 'task' }, later);
    assert.ok(result.ok);
    state = result.state;
    assert.ok(validateGame(state, later));
  }
  assert.deepEqual(generatorOutputs(state, 'generator_sweet', later), ['sweet_1', 'sweet_2']);
  const empty = firstFreeBoardCell(state, later);
  const result = reduceGame(state, { type: 'spawn', index: state.board.findIndex(cell => cell?.code === 'generator_sweet') }, later);
  assert.ok(result.ok);
  assert.equal(result.state.board[empty]?.code, 'sweet_1');
  assert.deepEqual(result.state.outputChoices, {});
});

test('matching ingredients merge and discover the next stage', () => {
  const state = initial();
  const result = reduceGame(state, { type: 'move', from: 13, to: 14 }, data);
  assert.equal(result.ok, true);
  assert.equal(result.event, 'merge');
  assert.equal(result.state.board[13], null);
  assert.equal(result.state.board[14]?.code, 'bakery_2');
  assert.equal(result.state.merges, 1);
  assert.ok(result.state.discovered.includes('bakery_2'));
  assert.equal(state.board[13]?.code, 'bakery_1');
});

test('different items swap and empty cells accept items', () => {
  let state = initial();
  state = apply(state, { type: 'move', from: 1, to: 4 });
  assert.equal(state.board[1]?.code, 'generator_warm');
  assert.equal(state.board[4]?.code, 'generator_bakery');
  state = apply(state, { type: 'move', from: 4, to: 0 });
  assert.equal(state.board[4], null);
  assert.equal(state.board[0]?.code, 'generator_bakery');
});

test('board-full failures retain state and selling recovers space', () => {
  let state = fillBoard(initial());
  fail(state, { type: 'spawn', index: 1 });
  state = apply(state, { type: 'sell', index: 0 });
  state = apply(state, { type: 'spawn', index: 1 });
  assert.equal(state.board.includes(null), false);
});

test('serve and sell stop at the coin limit, so the game stays savable', () => {
  const limit = 1_000_000_000;
  const state = initial();
  const order = state.orders[0];
  order.requirements.forEach((code, offset) => { state.board[20 + offset] = { code }; });
  for (const code of order.requirements) if (!state.discovered.includes(code)) state.discovered.push(code);
  assert.equal(canServe(state, order, data), true);
  state.coins = limit;
  assert.match(fail(state, { type: 'serve', id: order.id }).message, /Spend some coins/);
  assert.match(fail(state, { type: 'sell', index: 13 }).message, /Spend some coins/);
  assert.equal(apply({ ...state, coins: limit - order.reward }, { type: 'serve', id: order.id }).coins, limit);
  assert.equal(apply({ ...state, coins: limit - saleValue(state.board[13]!.code, data) }, { type: 'sell', index: 13 }).coins, limit);
});

test('sources cannot be sold', () => {
  fail(initial(), { type: 'sell', index: 1 });
});

test('orders require each duplicate separately', () => {
  let state = initial();
  const order = { requirements: ['bakery_1', 'bakery_1'] };
  assert.equal(canServe(state, order, data), true);
  state = apply(state, { type: 'sell', index: 13 });
  assert.equal(canServe(state, order, data), false);
  assert.equal(canServe(state, { requirements: ['generator_bakery'] }, data), false);
  assert.equal(canServe(state, { requirements: [] }, data), false);
});

test('invalid or unavailable actions do not change state', () => {
  const state = initial();
  for (const action of [null, {}, { type: 'unknown' }, { type: 'task' }, { type: 'spawn', index: 13 },
    { type: 'move', from: 13, to: 13 }, { type: 'move', from: 13, to: 42 }, { type: 'move', from: -1, to: 0 },
    { type: 'move', from: 13, to: '14' }, { type: 'serve', id: 'absent' },
    { type: 'sell', index: 100 }]) fail(state, action);
});

test('save validation rejects invalid numeric fields, codes, and unsupported versions', () => {
  // Some corruptions write a value that the GameState type does not admit.
  const corruptions: ((state: any) => void)[] = [
    state => { state.version = 1; }, state => { state.version = 2; }, state => { state.coins = -1; }, state => { state.xp = Infinity; },
    state => { state.seed = 4294967296; }, state => { state.taskIndex = 25; },
    state => { state.board.pop(); }, state => { state.board[0] = { code: '__proto__' }; },
    state => { state.board[0] = { code: 'bakery_1', hidden: true }; },
    state => { state.discovered.push(state.discovered[0]); },
    state => { state.orders[0].reward++; }, state => { state.orders[1].id = state.orders[0].id; },
    state => { state.orders[0].id = 'order_999999'; }, state => { state.orders[0].requirements = ['generator_bakery']; },
    state => { state.orders[0].customer = 'absent'; }, state => { state.decorations.push('task_1'); },
    state => { state.discovered = []; }, state => { state.orders = [null, null, null]; },
  ];
  for (const corrupt of corruptions) {
    const state = initial();
    corrupt(state);
    assert.equal(validateGame(state, data), false, String(corrupt));
  }
  assert.equal(validateGame(null, data), false);
  assert.equal(validateGame([], data), false);
});

test('save validation rejects missing, duplicated, and premature generators', () => {
  let state = initial();
  state.board[1] = null;
  assert.equal(validateGame(state, data), false);
  state = initial();
  state.board[0] = { code: 'generator_bakery' };
  assert.equal(validateGame(state, data), false);
  state = initial();
  state.board[0] = { code: 'generator_sweet' };
  state.discovered.push('generator_sweet');
  assert.equal(validateGame(state, data), false);
});

test('task unlocks require a free board space and fail atomically on a full board', () => {
  let state = withGoals(initial());
  // Controlled funds isolate the placement branch; the full-story test earns every coin.
  state.coins = data.tasks.slice(0, 3).reduce((sum, task) => sum + task.cost, 0);
  state = apply(state, { type: 'task' });
  state = apply(state, { type: 'task' });
  state = fillBoard(state);
  const failure = fail(state, { type: 'task' });
  assert.match(failure.message, /space/);
  const space = state.board.findIndex(cell => cell?.code === 'bakery_1');
  state = apply(state, { type: 'sell', index: space });
  state = apply(state, { type: 'task' });
  assert.equal(state.board[space]?.code, 'generator_sweet');
  assert.equal(state.taskIndex, 3);
});

test('the three neighbours waiting at the counter are always different people, and a served one makes way', () => {
  for (const seed of [1, 271828, 84017, 99991]) {
    let state = initial(seed);
    for (let serve = 0; serve < 60; serve++) {
      assert.equal(new Set(state.orders.map(order => order.customer)).size, 3, `seed ${seed}, serve ${serve}`);
      assert.ok(state.orders.every(order => !data.characters.find(person => person.id === order.customer)!.visitor));
      const order = state.orders[serve % 3];
      // Put the order's items on the board directly; this test covers who comes next, not how the dishes are made.
      for (const code of order.requirements) state.board[state.board.indexOf(null)] = { code };
      for (const code of order.requirements) if (!state.discovered.includes(code)) state.discovered.push(code);
      state = apply(state, { type: 'serve', id: order.id });
      assert.notEqual(state.orders[serve % 3].customer, order.customer, 'A served neighbour makes way for someone else.');
    }
  }
});

test('each neighbour has at least three thanks lines of at most 34 characters', () => {
  assert.ok(data.characters.every(person => person.thanks.length >= 3 && person.thanks.every(line => line.length > 0 && line.length <= 34)));
});

test('valid saves with duplicate waiting neighbours get distinct neighbours without changing their orders or progress', () => {
  for (const customers of [['eszter', 'ilie', 'eszter'], ['mara', 'mara', 'mara'], ['eszter', 'eszter', 'mara']]) {
    const duplicated = initial();
    duplicated.orders.forEach((order, index) => { order.customer = customers[index]; });
    const imported = importSave<GameState>(JSON.stringify({ format: 'scary-snacks', version: 8, state: duplicated }),
      candidate => validateGame(candidate, data));
    const before = structuredClone(imported);
    const normalized = normalizeOrderCustomers(imported, data);
    assert.equal(new Set(normalized.orders.map(order => order.customer)).size, 3);
    assert.equal(validateGame(normalized, data), true);
    assert.deepEqual(imported, before, 'The saved state stays unchanged.');
    assert.deepEqual(normalizeOrderCustomers(imported, data), normalized, 'The replacement is deterministic.');
    assert.equal(normalizeOrderCustomers(normalized, data), normalized, 'An adapted save does not need another change.');
    normalized.orders.forEach((order, index) => {
      if (customers.indexOf(customers[index]) === index) assert.equal(order.customer, customers[index]);
    });
    const restoredCustomers = structuredClone(normalized);
    restoredCustomers.orders.forEach((order, index) => { order.customer = customers[index]; });
    assert.deepEqual(restoredCustomers, before, 'Only duplicate customer IDs change; orders and progress stay intact.');
  }
  const fresh = initial();
  assert.equal(normalizeOrderCustomers(fresh, data), fresh);
});

test('a short purse names the missing coins, and a preparation that brings a new source says which source arrived and where it is', () => {
  const source = data.items.generator_sweet.name;
  assert.equal(fail(withGoals(initial()), { type: 'task' }).message, `Earn ${data.tasks[0].cost} more coins to pay for this preparation.`);
  let state = withGoals(initial());
  state.coins = data.tasks.slice(0, 3).reduce((sum, task) => sum + task.cost, 0);
  state = apply(state, { type: 'task' });
  state = apply(state, { type: 'task' });
  assert.ok(reduceGame(state, { type: 'task' }, data).message.startsWith(`${data.tasks[2].title}: done. The ${source} is on the board.`));
  assert.match(fail(fillBoard(state), { type: 'task' }).message, /space/);
});

test('all 24 tasks complete with production tiers and level rewards, with measured chapter costs and income', t => {
  const campaigns: [string, GameData, boolean][] = [
    ['tier one', { ...data, generatorTiers: [] }, false], ['tiers at 12 and 20', data, false], ['tiers and level rewards', data, true],
  ];
  for (const [label, campaignData, claimRewards] of campaigns) {
    let state = createGame(campaignData, 84017);
    let actions = 0;
    let orderCoins = 0;
    let rewardCoins = 0;
    let previous = { actions: 0, merges: 0, orders: 0, xp: 0 };
    const unlocked = new Set<string>();
    function act(action: Action) {
      const before = state;
      const result = reduceGame(state, action, campaignData);
      assert.ok(result.ok, result.message);
      state = result.state;
      if (action.type === 'serve') orderCoins += state.coins - before.coins;
      if (action.type === 'claimLevelReward') rewardCoins += state.coins - before.coins;
      assert.ok(validateGame(state, campaignData));
      actions++;
      assert.ok(actions < 50000, 'Natural progression must converge.');
    }
    function produce(code: string): number {
      const item = data.items[code];
      if (generatorOutputs(state, `generator_${item.chain}`, campaignData).includes(code)) {
        const empty = firstFreeBoardCell(state, campaignData);
        assert.ok(empty >= 0, 'The 42-cell board has room for normal order production.');
        act({ type: 'spawn', index: state.board.findIndex(cell => cell?.code === `generator_${item.chain}`), output: code });
        assert.equal(state.board[empty]?.code, code);
        return empty;
      }
      const previous = `${item.chain}_${item.stage - 1}`;
      const first = produce(previous);
      const second = produce(previous);
      act({ type: 'move', from: first, to: second });
      assert.equal(state.board[second]?.code, code);
      return second;
    }
    for (let task = currentTask(state, data); task; task = currentTask(state, data)) {
      if (claimRewards) for (const reward of data.levelRewards) {
        if (reward.level <= getLevel(state) && !state.claimedLevelRewards.includes(reward.id)) act({ type: 'claimLevelReward', id: reward.id });
      }
      if (taskEligibility(state, campaignData).ready) {
        act({ type: 'task' });
        if (task.unlock) unlocked.add(task.unlock);
        if (state.taskIndex % 4 === 0) {
          const totals = { actions, merges: state.merges, orders: state.served, xp: state.xp };
          t.diagnostic(`${label}, chapter ${task.chapter}: ${actions - previous.actions} actions, ${state.merges - previous.merges} merges, ${state.served - previous.orders} orders, ${state.xp - previous.xp} XP.`);
          previous = totals;
        }
        continue;
      }
      const order = [...state.orders].sort((a, b) => {
        const effort = (order: Order) => order.requirements.reduce((sum, code) => sum + 2 ** (data.items[code].stage - 1), 0);
        return effort(a) - effort(b);
      })[0];
      for (const code of order.requirements) produce(code);
      assert.equal(canServe(state, order, data), true);
      act({ type: 'serve', id: order.id });
      fail(state, { type: 'serve', id: order.id });
    }
    assert.equal(state.taskIndex, 24);
    assert.equal(state.coins, orderCoins + rewardCoins - data.tasks.reduce((sum, task) => sum + task.cost, 0));
    assert.equal(rewardCoins, claimRewards ? 180 : 0);
    assert.ok(orderCoins > rewardCoins);
    t.diagnostic(`${label}, campaign income: ${orderCoins} order coins, ${rewardCoins} level reward coins; ${state.coins} coins remain after ${data.tasks.reduce((sum, task) => sum + task.cost, 0)} preparation costs.`);
    assert.deepEqual([...unlocked], ['sweet', 'produce']);
    assert.equal(state.decorations.length, 24);
    assert.equal(state.orders.length, 3);
    assert.ok(state.served > 24);
    assert.ok(getLevel(state) > 1);
    assert.equal(validateGame(JSON.parse(JSON.stringify(state)), data), true);
    fail(state, { type: 'task' });
    const order = state.orders[0];
    for (const code of order.requirements) produce(code);
    act({ type: 'serve', id: order.id });
    // Exercise complete top-stage items without a synthetic board or resources.
    const topOne = produce('bakery_6');
    const topTwo = produce('bakery_6');
    fail(state, { type: 'move', from: topOne, to: topTwo });
    act({ type: 'sell', index: topOne });
    t.diagnostic(`${label}, campaign: ${previous.orders} orders, ${previous.merges} merges, ${previous.actions} actions, ${previous.xp} XP.`);
  }
});

const completedAt = (count: number) => data.tasks.slice(0, count).map(task => task.id);
const roomsAt = (count: number, painted?: readonly string[]) => resolveRooms(completedAt(count), data, painted);
// The art plan: the front room has a state for the new game and after preparations 1 to 12, 17 and 24; the courtyard after 13 to 16 and 18 to 23.
const plan: Record<string, number[]> = { 'front-room': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17, 24], courtyard: [13, 14, 15, 16, 18, 19, 20, 21, 22, 23] };

test('the authored rooms resolve at every checkpoint and show only approved, shipped paintings', () => {
  assert.deepEqual(roomProblems(data), []);
  assert.deepEqual(data.areas.map(area => area.id), ['front-room', 'courtyard']);
  assert.equal(data.rooms.length, 25);
  for (const [area, numbers] of Object.entries(plan)) assert.deepEqual(data.rooms.filter(state => state.area === area).map(state => state.id).sort(), numbers.map(n => `${area}-${String(n).padStart(2, '0')}`).sort());
  // The approved-image list and the variant plan name the same room paintings, so a painting shows only once its variants ship.
  assert.deepEqual([...roomPaintings].sort(), Object.keys(imageVariants).filter(id => /^(front-room|courtyard)-\d\d$/.test(id)).sort());
  for (const id of roomPaintings) assert.ok(data.rooms.some(state => state.id === id), `${id} is a room state`);
});

test('each area shows the state of its highest completed preparation, and the courtyard stays locked until it opens', () => {
  for (let count = 0; count <= data.tasks.length; count++) {
    const views = roomsAt(count);
    for (const view of views) {
      const earned = plan[view.id].filter(n => n <= count);
      assert.equal(view.open, view.id === 'front-room' || count >= 13, `${view.id} open at ${count}`);
      if (!view.open) { assert.deepEqual([view.states, view.current, view.painting], [[], null, null]); continue; }
      assert.deepEqual(view.states.map(state => state.id), earned.map(n => `${view.id}-${String(n).padStart(2, '0')}`), `${view.id} at ${count}`);
      assert.equal(view.current, view.states.at(-1));
    }
  }
  const unlock = data.tasks.findIndex(task => task.id === data.areas[1].unlock);
  assert.equal(data.tasks[unlock].title, 'Clear the courtyard');
  assert.equal(data.tasks[unlock].chapter, 4);
});

test('a state that waits for its painting shows the latest earlier painting of its area, with its own words', () => {
  // Every state has its painting; the fallback covers a later state that waits for its painting.
  assert.deepEqual(data.rooms.filter(state => !roomPaintings.includes(state.id)), []);
  const [front, courtyard] = roomsAt(23, roomPaintings.filter(id => id !== 'courtyard-23'));
  assert.equal(courtyard.current!.id, 'courtyard-23');
  assert.equal(courtyard.painting!.id, 'courtyard-22');
  assert.match(courtyard.current!.text, /string of warm lights/);
  assert.equal(front.painting!.id, 'front-room-17');
  assert.equal(roomsAt(23)[1].painting!.id, 'courtyard-23');
  assert.equal(roomsAt(24)[0].painting!.id, 'front-room-24');
  // Without a painting for state 05, the room shows the painting of state 04 until state 06 arrives; the first state of an area always has one.
  const painted = roomPaintings.filter(id => id !== 'front-room-05');
  assert.deepEqual([roomsAt(5, painted)[0].current!.id, roomsAt(5, painted)[0].painting!.id], ['front-room-05', 'front-room-04']);
  assert.equal(roomsAt(6, painted)[0].painting!.id, 'front-room-06');
  assert.match(roomProblems(data, roomPaintings.filter(id => id !== 'courtyard-13')).join(' '), /courtyard: needs a painting for its first state/);
});

test('the room follows the area of the latest change', () => {
  const expected: [number, string][] = [[0, 'front-room'], [12, 'front-room'], [13, 'courtyard'], [16, 'courtyard'], [17, 'front-room'], [18, 'courtyard'], [23, 'courtyard'], [24, 'front-room']];
  for (const [count, area] of expected) assert.equal(latestArea(completedAt(count), data), area, `at ${count}`);
});

test('the new game shows the webs and the spiders, and the mended window clears them but for one', () => {
  assert.equal(data.tasks[0].title, 'Fix the broken window');
  const [base, mended] = data.rooms;
  assert.match(base.text, /Cobwebs hang in the broken window/);
  assert.match(base.text, /One small spider lives under the upper wall shelf/);
  assert.match(mended.text, /Every web is gone, and the spiders left through the window, all but one/);
});

test('the room check names a bad name, an unknown preparation, a stray focus, a missing text, a bad label or pin mark, an early state, and a preparation with no change or two', () => {
  const broken = structuredClone(data);
  const state = (id: string) => broken.rooms.find(value => value.id === id)!;
  state('front-room-02').id = 'front-room-2';
  state('front-room-03').after = 'task_99';
  state('front-room-04').focus = { x: 50, y: 120 };
  state('front-room-05').text = '';
  state('front-room-06').label = '';
  state('front-room-07').mark = { x: -1, y: 20 };
  state('courtyard-14').after = 'task_7';
  state('courtyard-14').id = 'courtyard-07';
  broken.rooms = broken.rooms.filter(value => value.id !== 'courtyard-13');
  const problems = roomProblems(broken).join(' ');
  assert.match(problems, /front-room-2: must be named after its area and its preparation/);
  assert.match(problems, /front-room-03: unknown preparation/);
  assert.match(problems, /front-room-04: needs a focus inside its painting/);
  assert.match(problems, /front-room-06: needs a short label of at most 28 characters/);
  assert.match(problems, /front-room-07: needs a pin mark inside its painting/);
  assert.match(problems, /front-room-05: needs a description/);
  assert.match(problems, /courtyard: needs its first state when it opens, and no state before/);
  assert.match(problems, /task_7: changes the rooms more than once/);
  assert.match(problems, /task_13: changes nothing in the rooms/);
});

test('a preparation paid with exactly its cost empties the purse and adds one room change', () => {
  let state = withGoals(initial());
  state.coins = data.tasks[0].cost;
  state = apply(state, { type: 'task' });
  assert.equal(state.coins, 0);
  assert.deepEqual(resolveRooms(state.decorations, data), roomsAt(1));
  // The next preparation costs more than the empty purse: nothing is charged and nothing changes.
  fail(state, { type: 'task' });
  assert.deepEqual(state.decorations, ['task_1']);
});

test('fresh, mid-campaign, and completed saves resolve the same rooms after reload and export', () => {
  for (const count of [0, 12, 13, data.tasks.length]) {
    let state = withGoals(initial());
    state.coins = 100000;
    for (let index = 0; index < count; index++) state = apply(state, { type: 'task' });
    const validate = (candidate: unknown) => validateGame(candidate, data);
    const reloaded = importSave<GameState>(JSON.stringify({ format: 'scary-snacks', version: 8, state: JSON.parse(JSON.stringify(state)) }), validate);
    const exported = importSave<GameState>(exportSave(reloaded, validate), validate);
    assert.deepEqual(resolveRooms(reloaded.decorations, data), roomsAt(count), `reload at ${count}`);
    assert.deepEqual(resolveRooms(exported.decorations, data), roomsAt(count), `export at ${count}`);
  }
});

test('one data check gathers every content check, and the game can run it without the image records', async () => {
  const images = (JSON.parse(await readFile(new URL('../docs/asset-provenance.json', import.meta.url), 'utf8')) as { assets: { id: string }[] }).assets.map(asset => asset.id);
  assert.deepEqual(dataProblems(data, images), []);
  assert.deepEqual(dataProblems(data), []);
  const unknownImage = structuredClone(data);
  unknownImage.decorationSlots[0].variants[0].image = 'absent';
  assert.deepEqual(dataProblems(unknownImage), [], 'Only the generator knows the approved images.');
  assert.match(dataProblems(unknownImage, images).join(' '), /missing image/);
  const mutations: ((content: GameData) => void)[] = [
    content => { content.rooms[1].after = 'absent'; },
    content => { content.generatorTiers[0].stage = 4; },
    content => { content.levelRewards = []; },
    content => { content.quests[0].reward = -1; },
    content => { content.tasks[1].goals.served = -1; },
    content => { content.tasks[0].cost++; },
    content => { (content as { tasks: unknown }).tasks = null; },
  ];
  for (const mutate of mutations) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(dataProblems(content, images).length, String(mutate));
  }
});

test('data checks reject a starting board that does not make a valid new game', () => {
  for (const code of ['generator_bakery', 'sweet_1']) {
    const content = structuredClone(data);
    content.board.initial[2] = code;
    assert.match(dataProblems(content).join(' '), /valid new game/, code);
  }
});

test('data checks reject unsupported board dimensions and incomplete starting layouts', () => {
  const mutations: ((content: GameData) => void)[] = [
    content => { content.board.columns = 7; },
    content => { content.board.rows = 6; },
    content => { content.board.columns = 7; content.board.rows = 6; },
    content => { content.board.columns = 0; },
    content => { content.board.rows = 7.5; },
    content => { content.board.initial.pop(); },
    content => { content.board.initial.push(null); },
    content => { (content.board as { initial: unknown }).initial = {}; },
  ];
  for (const mutate of mutations) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(dataProblems(content).length, String(mutate));
  }
});
