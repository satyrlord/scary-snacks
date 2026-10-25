import test from 'node:test';
import assert from 'node:assert/strict';
import { freeBoardCells, menuPrice, NO_STAGES, pendingPreparationObstacles, salePrice, unresolvedObstacle } from '../src/model.ts';
import { dataProblems, economyProblems } from '../src/content.ts';
import { createGame, KEEP_FREE } from '../src/engine.ts';
import type { GameData } from '../src/model.ts';
import { act, actOne, addOpenLayout, checkpoint, data, openGame, player, rejected, status, know, recovery } from './support.ts';

addOpenLayout();

/** The price from the formula, worked out here from the chains and the recipes: staples × take cost + merges × work rate. */
function formula(code: string): { staples: number; merges: number } {
  const item = data.items[code];
  if (item.recipe) {
    const [first, second] = item.recipe.map(formula);
    return { staples: first.staples + second.staples, merges: first.merges + second.merges + 1 };
  }
  const count = 2 ** (item.stage - 1);
  return { staples: data.items[`generator_${item.chain}`].generator!.free ? 0 : count, merges: count - 1 };
}

test('renovation cost follows its materials and labour, with less work and money for signs and menus', () => {
  assert.deepEqual(economyProblems(data), []);
  for (const task of data.tasks) assert.equal(task.cost, task.work.materials + task.work.labour);
  const [window, sign] = data.tasks;
  const menu = data.tasks[7], doorHood = data.tasks[14], printedMenu = data.tasks[19];
  for (const small of [sign, menu, printedMenu]) for (const repair of [window, doorHood]) {
    assert.ok(small.cost < repair.cost, `${small.title} costs less than ${repair.title}.`);
    assert.ok(small.work.hours < repair.work.hours, `${small.title} needs less work than ${repair.title}.`);
  }
});

test('the starting levers are one coin a take, one coin a blocker, two coins a merge, a recovery floor of ten, garden and orchard values of 1, 2, and 3, and a cellar value of 2, and the herbs, the forage basket, and the Garden beds are free', () => {
  assert.deepEqual(data.economy, { takeCost: 1, blockerCoin: 1, workRate: 2, recoveryFloor: 10, garden: { after: ['act2-prep-6', 'act2-prep-14', 'act2-prep-22'], values: [1, 2, 3] },
    orchard: { after: ['act3-prep-2', 'act3-prep-10', 'act3-prep-13'], values: [1, 2, 3] }, cellar: { after: ['act3-prep-16'], values: [2] } });
  assert.deepEqual(Object.values(data.items).filter(item => item.generator?.free).map(item => item.id), ['generator_herbs', 'generator_greens', 'generator_garden']);
});

test('every menu price equals staples times the take cost plus merges times the work rate, and Herbs staples count zero', () => {
  for (const item of Object.values(data.items)) {
    if (item.generator) { assert.equal(item.price, 0, item.id); continue; }
    const { staples, merges } = formula(item.id);
    assert.equal(item.price, staples * data.economy.takeCost + merges * data.economy.workRate, item.id);
    assert.equal(item.price, menuPrice(item.id, data), item.id);
  }
  // Bulz: Mămăligă (8 Corn staples, 7 merges) and Telemea (8 Dairy staples, 7 merges), and one recipe merge.
  assert.deepEqual(formula('mixed_bulz'), { staples: 16, merges: 15 });
  assert.equal(data.items.mixed_bulz.price, 46);
  assert.equal(data.items.herbs_1.price, 0, 'Elderflowers are free.');
  assert.equal(data.items.herbs_4.price, 14, 'One Linden tea pays its seven merges at two coins each.');
  assert.equal(data.items['mixed_cozonac'].price, 13);
});

test('a take from a paid source spends the take cost, and a take from the Herb basket spends nothing', () => {
  let state = { ...openGame(), coins: 2 };
  const empty = state.board.indexOf(null);
  const paid = act(state, { type: 'spawn', chain: 'grain' });
  assert.equal(paid.board[empty]?.code, 'grain_1');
  assert.equal(paid.coins, 2 - data.economy.takeCost);
  assert.equal(act(paid, { type: 'spawn', chain: 'grain' }).coins, 0, 'The last coin pays for one more take.');
  state = { ...openGame(), coins: 0 };
  for (let count = 0; count < 5; count++) state = act(state, { type: 'spawn', chain: 'herbs' });
  assert.equal(state.coins, 0);
  assert.equal(state.board.filter(cell => cell?.code === 'herbs_1').length, 6);
});

test('a take without the coins changes nothing, and its message names the source', () => {
  const state = { ...openGame(), coins: 0 };
  for (const chain of ['grain', 'corn']) {
    const result = rejected(state, { type: 'spawn', chain });
    assert.match(result.message, new RegExp(`^The ${data.items[`generator_${chain}`].name} costs 1 coin for each take, and the purse cannot pay\\.`));
    assert.match(result.message, /Herb basket/);
  }
  // A take on a full board spends nothing, even with the coins.
  let full = { ...openGame(), coins: 5 };
  while (full.board.includes(null)) full = act(full, { type: 'spawn', chain: 'herbs' });
  assert.equal(full.coins, 5);
  assert.match(rejected(full, { type: 'spawn', chain: 'grain' }).message, /board is full/);
});

test('after the last preparation, the recovery quest opens below the floor and closes at the floor', () => {
  // The dinner pays nothing, so after the last preparation the recovery floor applies.
  const finished = checkpoint(data.tasks.length);
  assert.equal(status({ ...finished, coins: data.economy.recoveryFloor - 1 }, recovery.id), 'active');
  assert.equal(status({ ...finished, coins: data.economy.recoveryFloor }, recovery.id), 'locked');
});

test('with exactly four free cells and queued blockers, one Linden tea is made from scratch and delivered', () => {
  const start = structuredClone(checkpoint(2));
  const queued = pendingPreparationObstacles(start, data).length;
  assert.ok(queued > 0, 'Blockers wait for space.');
  // Fill the board with Bread baskets, which merge with nothing, until four cells stay free.
  while (freeBoardCells(start, data) > KEEP_FREE) start.board[start.board.findIndex((cell, index) => !cell && !unresolvedObstacle(start, index, data))] = { code: 'grain_6' };
  know(start, 'grain_6');
  start.coins = data.tasks[2].cost - data.economy.takeCost;
  assert.equal(status(start, recovery.id), 'active');
  const play = player(start);
  const tea = play.produce('herbs_4');
  assert.equal(play.state.board[tea]?.code, 'herbs_4');
  assert.equal(play.state.coins, start.coins, 'The herbs are free.');
  assert.equal(pendingPreparationObstacles(play.state, data).length, queued, 'No blocker took a cell that the tea needed.');
  const delivered = act(play.state, { type: 'deliverQuest', id: recovery.id });
  assert.equal(delivered.coins, start.coins + recovery.reward);
  assert.equal(freeBoardCells(delivered, data), KEEP_FREE);
  assert.equal(act(delivered, { type: 'task' }).taskIndex, 3);
});

test('authored economy rejects missing, malformed, unsupported, or inconsistent values', () => {
  const mutations: ((content: GameData) => void)[] = [
    ...[-1, 0, 2, 0.5, NaN, Infinity, 500_000_001, '1', null, undefined].map(value => (content: GameData) => { Object.assign(content.items.grain_1, { price: value }); }),
    ...[-1, 1, null, undefined].map(value => (content: GameData) => { Object.assign(content.items.generator_grain, { price: value }); }),
    content => { Reflect.deleteProperty(content.items.grain_2, 'price'); },
    content => { content.items.mixed_bulz.price = 30; },
    content => { content.items.herbs_1.price = 1; },
    ...[-1, 0.5, NaN, '1', null].flatMap(value => ['takeCost', 'blockerCoin'].map(field => (content: GameData) => { Object.assign(content.economy, { [field]: value }); })),
    ...[-1, 0, 0.5, NaN, '1', null].flatMap(value => ['workRate', 'recoveryFloor'].map(field => (content: GameData) => { Object.assign(content.economy, { [field]: value }); })),
    content => { (content as { economy: unknown }).economy = null; },
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
    assert.ok(economyProblems(content).length, String(mutate));
    assert.ok(dataProblems(content).length, String(mutate));
  }
});

test('a sold dish leaves the board and pays back the take costs of its ingredients at the current garden stage, so a sale makes no profit', () => {
  for (const item of Object.values(data.items)) if (!item.generator) assert.equal(salePrice(item.id, data), formula(item.id).staples * data.economy.takeCost, item.id);
  // The Vegetable crate is free from garden stage 1, so its dishes then sell for nothing, also where the menu counts the garden value.
  assert.deepEqual([0, 1, 2, 3].map(garden => salePrice('vegetables_3', data, { ...NO_STAGES, garden })), [4 * data.economy.takeCost, 0, 0, 0]);
  const state = openGame(), flour = act(state, { type: 'sell', index: 13 });
  assert.equal(flour.board[13], null);
  assert.equal(flour.coins, state.coins + data.economy.takeCost);
  assert.equal(act(state, { type: 'sell', index: 27 }).coins, state.coins, 'Elderflowers from the free Herb basket sell for nothing.');
  const tea = act(state, { type: 'sell', index: 32 });
  assert.equal(tea.board[32], null);
  assert.equal(tea.coins, state.coins);
});

test('a sale refuses an empty space, a blocked space, and the prologue, and changes nothing', () => {
  const state = openGame();
  rejected(state, { type: 'sell', index: 1 });
  const blocked = actOne(), at = blocked.board.findIndex((_, index) => unresolvedObstacle(blocked, index, data));
  assert.ok(at >= 0);
  rejected(blocked, { type: 'sell', index: at });
  const prologue = createGame(data, 1), dish = prologue.board.findIndex(cell => cell && !data.items[cell.code].generator);
  assert.ok(dish >= 0);
  assert.match(rejected(prologue, { type: 'sell', index: dish }).message, /from act 1/);
});
