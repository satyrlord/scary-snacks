import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, dataProblems, economyProblems, reduceGame } from '../src/engine.ts';
import type { Action } from '../src/engine.ts';
import type { GameData } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
test('renovation cost follows its materials and labour, with less work and money for signs and menus', () => {
  assert.deepEqual(economyProblems(data), []);
  for (const task of data.tasks) assert.equal(task.cost, task.work.materials + task.work.labour);
  const [window, sign] = data.tasks;
  const menu = data.tasks[7], canopy = data.tasks[14], printedMenu = data.tasks[19];
  for (const small of [sign, menu, printedMenu]) for (const repair of [window, canopy]) {
    assert.ok(small.cost < repair.cost, `${small.title} costs less than ${repair.title}.`);
    assert.ok(small.work.hours < repair.work.hours, `${small.title} needs less work than ${repair.title}.`);
  }
});

test('the game has no sales: a sell request changes nothing, so quests are the only income', () => {
  const state = createGame(data), before = JSON.stringify(state);
  for (const index of [13, 1]) {
    const result = reduceGame(state, { type: 'sell', index } as unknown as Action, data);
    assert.equal(result.ok, false);
    assert.equal(result.state, state);
  }
  assert.equal(JSON.stringify(state), before);
});

test('every quest pays exactly the menu value of its dishes, with no multiplier', () => {
  const menuValue = (quest: GameData['quests'][number]) => quest.requirements.reduce((sum, { item, quantity }) => sum + data.items[item].price * quantity, 0);
  for (const quest of data.quests) assert.equal(quest.reward, menuValue(quest), quest.id);
});

test('authored economy rejects missing, malformed, unsupported, or inconsistent values', () => {
  const mutations: ((content: GameData) => void)[] = [
    ...[-1, 0, 0.5, NaN, Infinity, 500_000_001, '2', null, undefined].map(value => (content: GameData) => { Object.assign(content.items.bakery_1, { price: value }); }),
    ...[-1, 1, null, undefined].map(value => (content: GameData) => { Object.assign(content.items.generator_bakery, { price: value }); }),
    content => { Reflect.deleteProperty(content.items.bakery_2, 'price'); },
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
