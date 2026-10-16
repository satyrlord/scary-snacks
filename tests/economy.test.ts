import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, economyProblems, legacyOrderReward, menuReward, reduceGame, saleValue, validateGame, validateLegacyGame, validatePreviousGame, validateGeneratorGame, validateLevelRewardGame, migrateGame, migratePreviousGame, migrateGeneratorGame, migrateLevelRewardGame } from '../src/engine.ts';
import { exportSave, importSave, loadSave, saveGame, SAVE_KEY } from '../src/storage.ts';
import type { GameData, GameState } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const validate = (state: unknown) => validateGame(state, data);
function quotedBeforeMenu(state = createGame(data)): GameState {
  const old = structuredClone(state);
  old.orders = old.orders.map(({ pricing: _, ...order }) => ({ ...order, reward: legacyOrderReward(order.requirements, data) }));
  return old;
}

test('renovation cost follows its materials and labour, with less work and money for signs and menus', () => {
  assert.deepEqual(economyProblems(data), []);
  for (const task of data.tasks) assert.equal(task.cost, task.work.materials + task.work.labour);
  const [window, sign] = data.tasks;
  const menu = data.tasks[7], canopy = data.tasks[14], printedMenu = data.tasks[19];
  for (const small of [sign, menu, printedMenu]) for (const repair of [window, canopy]) {
    assert.ok(small.cost < repair.cost, `${small.title} costs less than ${repair.title}.`);
    assert.ok(small.work.hours < repair.work.hours, `${small.title} needs less work than ${repair.title}.`);
  }
  assert.ok(window.cost > createGame(data).orders.reduce((sum, order) => sum + order.reward, 0), 'Three initial servings cannot buy a window repair.');
});

test('new orders quote explicit menu prices without a flat service bonus and clearance stays below menu value', () => {
  for (const item of Object.values({ ...data.items, ...data.questItems })) {
    if (item.generator) assert.equal(saleValue(item.id, data), 0);
    else {
      assert.equal(saleValue(item.id, data), Math.max(1, Math.floor(item.price / 4)));
      assert.ok(saleValue(item.id, data) <= item.price);
      if (item.price > 1) assert.ok(saleValue(item.id, data) < item.price);
    }
  }
  for (const item of Object.values(data.items).filter(item => !item.generator)) {
    assert.equal(menuReward([item.id], data), item.price);
    assert.equal(menuReward([item.id, item.id], data), item.price * 2);
  }
  for (const seed of [0, 271828, 84017]) {
    const state = createGame(data, seed);
    assert.ok(validate(state));
    for (const order of state.orders) {
      assert.equal(order.pricing, 'menu-1');
      assert.equal(order.reward, order.requirements.reduce((sum, code) => sum + data.items[code].price, 0));
    }
  }
});

test('authored economy rejects missing, malformed, unsupported, or inconsistent values', () => {
  const mutations: ((content: GameData) => void)[] = [
    ...[-1, 0, 0.5, NaN, Infinity, 500_000_001, '2', null, undefined].map(value => (content: GameData) => { Object.assign(content.items.bakery_1, { price: value }); }),
    ...[-1, 1, null, undefined].map(value => (content: GameData) => { Object.assign(content.items.generator_bakery, { price: value }); }),
    content => { Reflect.deleteProperty(content.questItems.quest_bread_1, 'price'); },
    content => { Reflect.deleteProperty(content.tasks[0], 'work'); },
    ...[null, [], 'repair'].map(value => (content: GameData) => { Object.assign(content.tasks[0], { work: value }); }),
    ...['', '   ', null, 4].map(value => (content: GameData) => { Object.assign(content.tasks[0].work, { summary: value }); }),
    ...[-1, 0.25, NaN, Infinity, 1_000_000_001, '4', null, undefined].flatMap(value => ['materials', 'labour'].map(field => (content: GameData) => { Object.assign(content.tasks[0].work, { [field]: value }); })),
    ...[-1, 0, 0.25, NaN, Infinity, '4', null, undefined].map(value => (content: GameData) => { Object.assign(content.tasks[0].work, { hours: value }); }),
    content => { content.tasks[0].cost++; },
    content => { content.tasks[0].cost = -1; },
  ];
  for (const mutate of mutations) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(economyProblems(content).length);
    assert.equal(validateGame(createGame(data), content), false);
  }
});

test('old quotes pay their exact reward and replacements use menu prices with the same seeded draws', () => {
  const current = createGame(data);
  const old = quotedBeforeMenu(current);
  assert.ok(validate(old));
  const before = structuredClone(old);
  const order = old.orders[0];
  const served = reduceGame(old, { type: 'serve', id: order.id }, data);
  const servedCurrent = reduceGame(current, { type: 'serve', id: order.id }, data);
  assert.ok(served.ok, served.message);
  assert.ok(servedCurrent.ok, servedCurrent.message);
  assert.deepEqual(old, before);
  assert.equal(served.state.coins, old.coins + order.reward);
  assert.equal(servedCurrent.state.coins, current.coins + current.orders[0].reward);
  assert.deepEqual(served.state.orders[0], servedCurrent.state.orders[0]);
  assert.equal(served.state.orders[0].pricing, 'menu-1');
  assert.equal(served.state.seed, servedCurrent.state.seed);
  assert.deepEqual(served.state.orders.slice(1), old.orders.slice(1));
  assert.ok(validate(served.state));
  assert.deepEqual(importSave(exportSave(served.state, validate), validate), served.state);
});

test('a quote marker selects one reward contract and never accepts a reward from the other contract', () => {
  const state = createGame(data);
  const old = quotedBeforeMenu(state);
  assert.notEqual(old.orders[0].reward, state.orders[0].reward);
  for (const pricing of [null, undefined, '', 'menu-2', 1, {}]) {
    const invalid = structuredClone(state);
    Object.assign(invalid.orders[0], { pricing });
    assert.equal(validate(invalid), false);
  }
  for (const [base, reward] of [[state, old.orders[0].reward], [old, state.orders[0].reward]] as const) {
    const invalid = structuredClone(base);
    invalid.orders[0].reward = reward;
    assert.equal(validate(invalid), false);
  }
  for (const base of [state, old]) for (const reward of [-1, 0, 0.5, NaN, Infinity, 1_000_000_001]) {
    const invalid = structuredClone(base);
    invalid.orders[0].reward = reward;
    assert.equal(validate(invalid), false);
  }
});

test('all supported old state versions keep exact outstanding quotes and reject new markers before conversion', () => {
  const state = quotedBeforeMenu();
  const { completedQuests: _completed, legacySatisfiedQuests: _legacy, activeQuestProducers: _active, ...level } = state;
  const state5 = { ...level, version: 5 };
  const { claimedLevelRewards: _claims, ...generator } = state5;
  const state4 = { ...generator, version: 4 };
  const { outputChoices: _outputs, ...previous } = state4;
  const state3 = { ...previous, version: 3 };
  const { decorationChoices: _decorations, ...legacy } = state3;
  const state2 = { ...legacy, version: 2 };
  const cases = [
    { old: state2, check: validateLegacyGame, convert: (candidate: unknown) => migrateLevelRewardGame(migrateGeneratorGame(migratePreviousGame(migrateGame(candidate, data), data), data), data) },
    { old: state3, check: validatePreviousGame, convert: (candidate: unknown) => migrateLevelRewardGame(migrateGeneratorGame(migratePreviousGame(candidate, data), data), data) },
    { old: state4, check: validateGeneratorGame, convert: (candidate: unknown) => migrateLevelRewardGame(migrateGeneratorGame(candidate, data), data) },
    { old: state5, check: validateLevelRewardGame, convert: (candidate: unknown) => migrateLevelRewardGame(candidate, data) },
  ];
  for (const { old, check, convert } of cases) {
    assert.ok(check(old, data));
    const bytes = JSON.stringify(old);
    const converted = convert(old);
    assert.equal(JSON.stringify(old), bytes);
    assert.deepEqual(convert(old), converted);
    assert.deepEqual(converted, state);
    assert.ok(validate(converted));
    const tagged = structuredClone(old);
    tagged.orders[0].pricing = 'menu-1';
    tagged.orders[0].reward = menuReward(tagged.orders[0].requirements, data);
    assert.equal(check(tagged, data), false);
  }
});

test('loading a current save with old quotes does not rewrite it and a failed mixed-quote save preserves its bytes', () => {
  const old = quotedBeforeMenu();
  const text = exportSave(old, validate);
  const values = new Map([[SAVE_KEY, text]]);
  let writes = 0;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: () => { writes++; throw new Error('Storage is full.'); },
    removeItem: () => assert.fail('Saved bytes must remain.'),
  };
  assert.deepEqual(loadSave(storage, validate), { state: old, status: 'loaded', error: null });
  assert.equal(writes, 0);
  const served = reduceGame(old, { type: 'serve', id: old.orders[0].id }, data);
  assert.ok(served.ok);
  assert.equal(saveGame(storage, served.state, validate).ok, false);
  assert.equal(writes, 1);
  assert.equal(values.get(SAVE_KEY), text);
  assert.deepEqual(loadSave(storage, validate).state, old);
});
