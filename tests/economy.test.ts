import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, dataProblems, economyProblems, saleValue } from '../src/engine.ts';
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
  const food = createGame(data).board.reduce((sum, cell) => sum + (cell ? saleValue(cell.code, data) : 0), 0);
  assert.ok(window.cost > food, 'The starting food cannot buy a window repair.');
});

test('clearance sells food below its menu value and a source has no sale value', () => {
  for (const item of Object.values(data.items)) {
    if (item.generator) assert.equal(saleValue(item.id, data), 0);
    else {
      assert.equal(saleValue(item.id, data), Math.max(1, Math.floor(item.price / 4)));
      assert.ok(saleValue(item.id, data) <= item.price);
      if (item.price > 1) assert.ok(saleValue(item.id, data) < item.price);
    }
  }
  assert.equal(saleValue('unknown', data), 0);
});

test('a personal quest pays its menu value at the rate of its chapter, and travellers pay their menu value', () => {
  const rates = [3, 2.5, 2, 1.5, 1, 1];
  const menuValue = (quest: GameData['quests'][number]) => quest.requirements.reduce((sum, { item, quantity }) => sum + data.items[item].price * quantity, 0);
  for (const quest of data.quests) {
    const window = quest.afterTask === null ? 0 : data.tasks.findIndex(task => task.id === quest.afterTask) + 1;
    const visitor = data.characters.find(person => person.id === quest.character)!.visitor;
    const expected = quest.id === 'ionatan-castle-dinner' ? 1100 : visitor ? menuValue(quest) : Math.round(menuValue(quest) * rates[Math.floor(window / 4)] / 2) * 2;
    assert.equal(quest.reward, expected, quest.id);
    if (!visitor) assert.equal(quest.reward % 2, 0, `${quest.id} pays an even reward.`);
  }
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
