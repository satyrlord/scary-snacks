import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, dataProblems, economyProblems, menuReward, saleValue, validateGame } from '../src/engine.ts';
import type { GameData } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const validate = (state: unknown) => validateGame(state, data);
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
    assert.ok(dataProblems(content).length);
  }
});

test('orders require the current price marker and exact menu reward', () => {
  const state = createGame(data);
  for (const pricing of [null, undefined, '', 'menu-2', 1, {}]) {
    const invalid = structuredClone(state);
    Object.assign(invalid.orders[0], { pricing });
    assert.equal(validate(invalid), false);
  }
  for (const reward of [-1, 0, 0.5, NaN, Infinity, state.orders[0].reward + 1]) {
    const invalid = structuredClone(state);
    invalid.orders[0].reward = reward;
    assert.equal(validate(invalid), false);
  }
});
