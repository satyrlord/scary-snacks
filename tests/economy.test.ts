import test from 'node:test';
import assert from 'node:assert/strict';
import { freeBoardCells, menuPrice, pendingPreparationObstacles, unresolvedObstacle } from '../src/model.ts';
import { dataProblems, economyProblems } from '../src/content.ts';
import { KEEP_FREE } from '../src/engine.ts';
import type { GameData } from '../src/model.ts';
import { act, addOpenLayout, checkpoint, data, openGame, player, rejected, status, know, recovery } from './support.ts';

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

test('the starting levers are one coin a take, one coin a blocker, two coins a merge, and a recovery floor of ten, and the herbs and the seasonal sources are free', () => {
  assert.deepEqual(data.economy, { takeCost: 1, blockerCoin: 1, workRate: 2, recoveryFloor: 10 });
  assert.deepEqual(Object.values(data.items).filter(item => item.generator?.free).map(item => item.id), ['generator_herbs', 'generator_pickles', 'generator_greens']);
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
  const paid = act(state, { type: 'spawn', index: 1 });
  assert.equal(paid.board[empty]?.code, 'grain_1');
  assert.equal(paid.coins, 2 - data.economy.takeCost);
  assert.equal(act(paid, { type: 'spawn', index: 1 }).coins, 0, 'The last coin pays for one more take.');
  state = { ...openGame(), coins: 0 };
  for (let count = 0; count < 5; count++) state = act(state, { type: 'spawn', index: 31 });
  assert.equal(state.coins, 0);
  assert.equal(state.board.filter(cell => cell?.code === 'herbs_1').length, 6);
});

test('a take without the coins changes nothing, and its message names the source', () => {
  const state = { ...openGame(), coins: 0 };
  for (const [index, code] of [[1, 'generator_grain'], [4, 'generator_corn']] as const) {
    const result = rejected(state, { type: 'spawn', index });
    assert.equal(state.board[index]?.code, code);
    assert.match(result.message, new RegExp(`^The ${data.items[code].name} costs 1 coin for each take, and the purse cannot pay\\.`));
    assert.match(result.message, /Herb basket/);
  }
  // A take on a full board spends nothing, even with the coins.
  let full = { ...openGame(), coins: 5 };
  while (full.board.includes(null)) full = act(full, { type: 'spawn', index: 31 });
  assert.equal(full.coins, 5);
  assert.match(rejected(full, { type: 'spawn', index: 1 }).message, /board is full/);
});

test('after the last preparation, the recovery quest opens below the floor and closes at the floor', () => {
  // The supper is a campaign quest, so after the last preparation the floor applies.
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
