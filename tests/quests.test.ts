import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canDeliverQuest, createGame, currentTask, dataProblems, firstFreeBoardCell, generatorOutputs, getItem, getLevel, nextOutput, previewQuestCleanup, questProblems, reduceGame, resolveQuests, taskEligibility, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const dedicatedId = 'ilie-bread-tasting';
const dedicated = data.quests.find(quest => quest.id === dedicatedId)!;

function player(initial = createGame(data), content = data) {
  let state = initial;
  assert.deepEqual(dataProblems(content), [], 'The fixture data passes its checks.');
  let actions = 0;
  function act(action: Action) {
    const before = structuredClone(state);
    const result = reduceGame(state, action, content);
    assert.equal(result.ok, true, result.message);
    assert.deepEqual(state, before, 'Actions preserve their input.');
    state = result.state;
    assert.equal(validateGame(state, content), true, `Valid state after ${action.type}.`);
    actions++;
    assert.ok(actions < 50000, 'The legal playthrough must converge.');
    return state;
  }
  function produce(code: string): number {
    const item = getItem(code, content)!;
    const quest = content.quests.find(quest => quest.producer?.exclusiveItems.includes(code));
    const source = quest?.producer?.item ?? `generator_${item.chain}`;
    if (generatorOutputs(state, source, content).includes(code)) {
      const empty = firstFreeBoardCell(state, content);
      assert.ok(empty >= 0, 'Normal production fits the board.');
      act({ type: 'spawn', index: state.board.findIndex(cell => cell?.code === source), output: code });
      assert.equal(state.board[empty]?.code, code);
      return empty;
    }
    const previous = Object.values({ ...content.items, ...content.questItems }).find(previous => previous.next === code)!;
    const first = produce(previous.id);
    const second = produce(previous.id);
    act({ type: 'move', from: first, to: second });
    assert.equal(state.board[second]?.code, code);
    return second;
  }
  return { get state() { return state; }, get actions() { return actions; }, content, act, produce };
}

function rejected(state: GameState, action: Action, content = data) {
  const before = structuredClone(state);
  const result = reduceGame(state, action, content);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.equal(result.event, null);
  assert.deepEqual(state, before);
  return result;
}

function checkpoint(count: number) {
  const state = createGame(data);
  state.coins = data.tasks.reduce((sum, task) => sum + task.cost, 0);
  state.served = data.tasks[count - 1]?.goals.served ?? 0;
  state.merges = data.tasks[count - 1]?.goals.merges ?? 0;
  const play = player(state);
  for (let index = 0; index < count; index++) play.act({ type: 'task' });
  return play.state;
}

function offered() {
  const state = checkpoint(18);
  state.completedQuests = data.quests.filter(quest => quest.character === 'ilie' && !quest.producer).map(quest => quest.id);
  return state;
}

test('four original arcs span all six chapters and keep the permanent content and ordinary orders', () => {
  assert.deepEqual(questProblems(data), []);
  assert.equal(data.quests.length, 13);
  assert.equal(Object.keys(data.items).length, 35);
  assert.equal(data.chains.length, 5);
  assert.equal(data.tasks.length, 24);
  assert.ok(data.tasks.every(task => !task.requiresQuest));
  assert.equal(data.quests.reduce((sum, quest) => sum + quest.reward, 0), 312);
  for (const character of data.characters) {
    assert.ok(character.introduction.length > 40);
    assert.equal(data.quests.filter(quest => quest.character === character.id && !quest.producer).length, 3);
  }
  const chapters = new Set(data.quests.filter(quest => !quest.producer).map(quest => quest.afterTask === null ? 1
    : Math.min(6, 1 + Math.floor((data.tasks.findIndex(task => task.id === quest.afterTask) + 1) / 4))));
  assert.deepEqual([...chapters].sort(), [1, 2, 3, 4, 5, 6]);
  assert.equal(resolveQuests(createGame(data), data).filter(view => view.status === 'active').length, 1);
});

test('quest data rejects unknown IDs, quantities, cycles, unavailable chains, and conflicting ownership', () => {
  const cases: [string, (content: GameData) => void][] = [
    ['duplicate quest', content => { content.quests[1].id = content.quests[0].id; }],
    ['unknown character', content => { content.quests[0].character = 'absent'; }],
    ['missing scene', content => { content.quests[0].completion = []; }],
    ['unknown scene speaker', content => { content.quests[0].opening[0].speaker = 'absent'; }],
    ['unknown item', content => { content.quests[0].requirements[0].item = 'absent'; }],
    ['generator delivery', content => { content.quests[0].requirements[0].item = 'generator_bakery'; }],
    ['zero quantity', content => { content.quests[0].requirements[0].quantity = 0; }],
    ['fraction quantity', content => { content.quests[0].requirements[0].quantity = 1.5; }],
    ['oversized quantity', content => { content.quests[0].requirements[0].quantity = 43; }],
    ['total quantity', content => { content.quests[0].requirements = [{ item: 'drinks_2', quantity: 22 }, { item: 'drinks_2', quantity: 22 }]; }],
    ['negative reward', content => { content.quests[0].reward = -1; }],
    ['unavailable food', content => { content.quests[0].requirements[0].item = 'sweet_2'; }],
    ['unknown preparation', content => { content.quests[0].afterTask = 'absent'; }],
    ['unknown prior quest', content => { content.quests[0].afterQuest = 'absent'; }],
    ['same character cycle', content => { content.quests[0].afterQuest = 'mara-table'; }],
    ['combined cycle', content => { content.tasks[0].requiresQuest = 'mara-table'; }],
    ['producer gate', content => { content.tasks[23].requiresQuest = dedicatedId; }],
    ['producer blocks quest', content => { content.quests[0].afterQuest = dedicatedId; }],
    ['shared cleanup', content => { content.quests.at(-1)!.producer!.exclusiveItems.push('bakery_1'); }],
    ['foreign quest food', content => { content.quests[0].requirements[0].item = 'quest_bread_3'; }],
    ['unowned food', content => { content.questItems.stray = { ...content.questItems.quest_bread_1, id: 'stray' }; }],
    ['wrong output', content => { content.quests.at(-1)!.producer!.outputs = ['bakery_1']; }],
    ['merge cycle', content => { content.questItems.quest_bread_3.next = 'quest_bread_1'; }],
    ['unreachable food', content => { content.questItems.quest_bread_2.next = null; }],
  ];
  for (const [label, mutate] of cases) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(questProblems(content).length, label);
    assert.ok(dataProblems(content).length, label);
  }
});

test('atomic delivery accounts for repeated quantities, then pays only once', () => {
  const content = structuredClone(data);
  const quest = content.quests[0];
  quest.requirements = [{ item: 'drinks_2', quantity: 1 }, { item: 'drinks_2', quantity: 2 }];
  const play = player(createGame(content), content);
  play.produce('drinks_2');
  play.produce('drinks_2');
  rejected(play.state, { type: 'deliverQuest', id: quest.id }, content);
  play.produce('drinks_2');
  const before = structuredClone(play.state);
  assert.equal(canDeliverQuest(play.state, quest.id, content), true);
  play.act({ type: 'deliverQuest', id: quest.id });
  assert.equal(play.state.coins, before.coins + quest.reward);
  assert.equal(play.state.seed, before.seed);
  assert.equal(play.state.xp, before.xp);
  assert.equal(play.state.taskIndex, before.taskIndex);
  assert.deepEqual(play.state.orders, before.orders);
  assert.deepEqual(play.state.completedQuests, [quest.id]);
  assert.equal(play.state.board.filter(cell => cell?.code === 'drinks_2').length, 0);
  const reloaded: GameState = JSON.parse(JSON.stringify(play.state));
  rejected(reloaded, { type: 'deliverQuest', id: quest.id }, content);
  rejected(reloaded, { type: 'deliverQuest', id: 'absent' }, content);
  rejected(reloaded, { type: 'deliverQuest', id: 'mara-table' }, content);
  const snapshot = structuredClone(reloaded);
  resolveQuests(reloaded, content);
  assert.deepEqual(reloaded, snapshot, 'Reading scenes and quest status has no effect.');
});

test('a reachable quest gate blocks its preparation without changes and opens after delivery', () => {
  const content = structuredClone(data);
  content.tasks[0].requiresQuest = 'mara-welcome';
  assert.deepEqual(dataProblems(content), []);
  const start = createGame(content);
  start.coins = content.tasks[0].cost;
  start.served = content.tasks[0].goals.served;
  start.merges = content.tasks[0].goals.merges;
  const play = player(start, content);
  rejected(play.state, { type: 'task' }, content);
  play.produce('drinks_2');
  play.act({ type: 'deliverQuest', id: 'mara-welcome' });
  play.act({ type: 'task' });
  assert.equal(play.state.taskIndex, 1);

});

test('quest rewards cannot overflow the coin limit or change a failed delivery', () => {
  const play = player();
  play.produce('drinks_2');
  play.state.coins = 1_000_000_000;
  rejected(play.state, { type: 'deliverQuest', id: 'mara-welcome' });
});

test('quest saves reject duplicates, missing prerequisites, unknown records, and invalid producer ownership', () => {
  const good = offered();
  const cases: ((state: GameState) => void)[] = [
    state => { state.completedQuests = ['absent']; },
    state => { state.completedQuests = ['mara-table']; },
    state => { state.activeQuestProducers = { absent: 0 }; },
    state => { state.activeQuestProducers = { 'mara-welcome': 0 }; },
    state => { state.activeQuestProducers = { [dedicatedId]: 0 }; },
    state => { state.board[0] = { code: 'quest_bread_1' }; state.discovered.push('quest_bread_1'); },
  ];
  for (const mutate of cases) { const broken = structuredClone(good); mutate(broken); assert.equal(validateGame(broken, data), false); }
  const accepted = player(good);
  accepted.act({ type: 'acceptQuest', id: dedicatedId });
  for (const mutate of [
    (state: GameState) => { state.activeQuestProducers[dedicatedId] = 1; },
    (state: GameState) => { state.board[state.board.indexOf(null)] = { code: 'quest_bread_source' }; },
    (state: GameState) => { state.completedQuests.push(dedicatedId); },
    (state: GameState) => { state.outputChoices.quest_bread = 'quest_bread_1'; },
    (state: GameState) => { state.orders[0].requirements = ['quest_bread_3']; },
  ]) { const broken = structuredClone(accepted.state); mutate(broken); assert.equal(validateGame(broken, data), false); }
});

test('producer acceptance requires board space and cannot be repeated', () => {
  const board = player(offered());
  board.act({ type: 'acceptQuest', id: dedicatedId });
  assert.equal(board.state.board.filter(cell => cell?.code === 'quest_bread_source').length, 1);
  rejected(board.state, { type: 'acceptQuest', id: dedicatedId });
  const source = board.state.board.findIndex(cell => cell?.code === 'quest_bread_source');
  rejected(board.state, { type: 'sell', index: source });
  board.act({ type: 'move', from: source, to: firstFreeBoardCell(board.state, data) });
  assert.deepEqual(board.state.activeQuestProducers, { [dedicatedId]: 0 });

  const full = player(offered());
  while (firstFreeBoardCell(full.state, data) !== -1) full.produce('bakery_1');
  rejected(full.state, { type: 'acceptQuest', id: dedicatedId });
  assert.equal(resolveQuests(full.state, data).find(view => view.quest.id === dedicatedId)?.status, 'offer');
  const sell = full.state.board.findIndex(cell => cell?.code === 'bakery_1');
  full.act({ type: 'sell', index: sell });
  full.act({ type: 'acceptQuest', id: dedicatedId });
  assert.equal(full.state.board[sell]?.code, 'quest_bread_source');
  rejected(full.state, { type: 'spawn', index: sell });
});

test('dedicated production is immediate, deterministic, free, reloadable, and separate from ordinary sources', () => {
  const play = player(offered());
  play.act({ type: 'acceptQuest', id: dedicatedId });
  const before = structuredClone(play.state);
  const source = play.state.board.findIndex(cell => cell?.code === 'quest_bread_source');
  rejected(play.state, { type: 'spawn', index: source, output: 'bakery_1' });
  for (let index = 0; index < 20; index++) {
    const produced = play.produce('quest_bread_1');
    assert.equal(play.state.coins, before.coins + index);
    assert.equal(play.state.seed, before.seed);
    assert.deepEqual(play.state.outputChoices, before.outputChoices);
    assert.deepEqual(play.state.orders, before.orders);
    assert.equal(validateGame(JSON.parse(JSON.stringify(play.state)), data), true);
    play.act({ type: 'sell', index: produced });
  }
  assert.equal(play.state.activeQuestProducers[dedicatedId], 0, 'The sequence wraps without an exhausted charge pool.');
});

test('the next output that the interface names is the output that one tap takes, for ordinary and quest sources', () => {
  const taps = (play: ReturnType<typeof player>, source: string, count: number) => {
    for (let tap = 0; tap < count; tap++) {
      const named = nextOutput(play.state, source, play.content);
      const empty = firstFreeBoardCell(play.state, play.content);
      play.act({ type: 'spawn', index: play.state.board.findIndex(cell => cell?.code === source) });
      assert.equal(play.state.board[empty]?.code, named);
      play.act({ type: 'sell', index: empty });
    }
  };
  // A two-output sequence shows that the named output follows the quest source's position, not the ordinary choice.
  const content = structuredClone(data);
  const producer = content.quests.find(quest => quest.id === dedicatedId)!.producer!;
  producer.outputs = ['quest_bread_1', 'quest_bread_2'];
  content.questItems[producer.item].generator!.outputs = [...producer.outputs];
  assert.deepEqual(dataProblems(content), []);
  const play = player(offered(), content);
  assert.equal(nextOutput(play.state, producer.item, content), 'quest_bread_1', 'An offered source starts with its first output.');
  play.act({ type: 'acceptQuest', id: dedicatedId });
  taps(play, producer.item, 3);
  assert.equal(nextOutput(play.state, producer.item, content), 'quest_bread_2');
  play.act({ type: 'spawn', index: play.state.board.findIndex(cell => cell?.code === 'generator_bakery'), output: 'bakery_2' });
  taps(play, 'generator_bakery', 2);
  assert.equal(nextOutput(play.state, 'generator_bakery', content), 'bakery_2');
  assert.equal(nextOutput(play.state, 'bakery_1', content), null);
});

test('cleanup previews only exclusive leftovers and stale previews preserve every item and reward', () => {
  const play = player(offered());
  play.act({ type: 'acceptQuest', id: dedicatedId });
  play.produce('quest_bread_3');
  play.produce('quest_bread_3');
  const leftover = play.produce('quest_bread_2');
  play.produce('bakery_3');
  const source = play.state.board.findIndex(cell => cell?.code === 'quest_bread_source');
  const preview = previewQuestCleanup(play.state, dedicatedId, data)!;
  assert.deepEqual(preview.board, [source, leftover].sort((a, b) => a - b).map(index => ({ index, item: play.state.board[index]!.code })));
  rejected(play.state, { type: 'deliverQuest', id: dedicatedId });
  play.produce('drinks_1');
  rejected(play.state, { type: 'deliverQuest', id: dedicatedId, cleanupToken: preview.token });
  const fresh = previewQuestCleanup(play.state, dedicatedId, data)!;
  const before = structuredClone(play.state);
  const regularBoard = before.board.map(cell => cell && dedicated.producer!.exclusiveItems.includes(cell.code) ? null : cell);
  play.act({ type: 'deliverQuest', id: dedicatedId, cleanupToken: fresh.token });
  assert.deepEqual(play.state.board, regularBoard);
  assert.equal(play.state.coins, before.coins + dedicated.reward);
  assert.deepEqual(play.state.orders, before.orders);
  assert.equal(play.state.seed, before.seed);
  assert.deepEqual(play.state.activeQuestProducers, {});
  assert.ok(play.state.completedQuests.includes(dedicatedId));
  rejected(play.state, { type: 'acceptQuest', id: dedicatedId });
  rejected(play.state, { type: 'deliverQuest', id: dedicatedId, cleanupToken: fresh.token });
  assert.equal(previewQuestCleanup(play.state, dedicatedId, data), null);
  const corrupted = structuredClone(play.state);
  corrupted.board[corrupted.board.indexOf(null)] = { code: 'quest_bread_1' };
  assert.equal(validateGame(corrupted, data), false, 'Completed quests cannot retain exclusive leftovers.');
});

test('all quests and the campaign finish through legal actions without injected resources', t => {
  const play = player(createGame(data, 271828));
  let questCoins = 0;
  let orderCoins = 0;
  let levelCoins = 0;
  const chapterTotals: { chapter: number; actions: number; orders: number; merges: number; coins: number; quests: number }[] = [];
  for (;;) {
    const available = resolveQuests(play.state, data).find(view => view.status === 'active' || view.status === 'offer');
    if (available) {
      const quest = available.quest;
      if (available.status === 'offer') play.act({ type: 'acceptQuest', id: quest.id });
      for (const requirement of quest.requirements) for (let count = 0; count < requirement.quantity; count++) play.produce(requirement.item);
      const before = structuredClone(play.state.orders);
      play.act({ type: 'deliverQuest', id: quest.id, ...(quest.producer ? { cleanupToken: previewQuestCleanup(play.state, quest.id, data)!.token } : {}) });
      assert.deepEqual(play.state.orders, before);
      questCoins += quest.reward;
      continue;
    }
    for (const reward of data.levelRewards) if (reward.level <= getLevel(play.state) && !play.state.claimedLevelRewards.includes(reward.id)) {
      play.act({ type: 'claimLevelReward', id: reward.id });
      levelCoins += reward.coins;
    }
    const task = currentTask(play.state, data);
    if (!task) break;
    if (taskEligibility(play.state, data).ready) {
      play.act({ type: 'task' });
      if (play.state.taskIndex % 4 === 0) chapterTotals.push({ chapter: task.chapter, actions: play.actions, orders: play.state.served, merges: play.state.merges, coins: play.state.coins, quests: play.state.completedQuests.length });
      continue;
    }
    const order = [...play.state.orders].sort((a, b) => a.requirements.reduce((sum, code) => sum + 2 ** (data.items[code].stage - 1), 0)
      - b.requirements.reduce((sum, code) => sum + 2 ** (data.items[code].stage - 1), 0))[0];
    for (const code of order.requirements) play.produce(code);
    play.act({ type: 'serve', id: order.id });
    orderCoins += order.reward;
  }
  assert.equal(play.state.taskIndex, 24);
  assert.equal(play.state.completedQuests.length, 13);
  assert.deepEqual(play.state.activeQuestProducers, {});
  assert.equal(questCoins, 312);
  assert.equal(levelCoins, 180);
  const preparationCoins = data.tasks.reduce((sum, task) => sum + task.cost, 0);
  assert.equal(play.state.coins, orderCoins + questCoins + levelCoins - preparationCoins);
  assert.equal(play.state.orders.length, 3);
  assert.equal(validateGame(JSON.parse(JSON.stringify(play.state)), data), true);
  for (const totals of chapterTotals) t.diagnostic(`Chapter ${totals.chapter}, cumulative: ${totals.actions} actions, ${totals.orders} orders, ${totals.merges} merges, ${totals.quests} quests, ${totals.coins} coins remain.`);
  t.diagnostic(`Seed 271828, highest available source tier, lowest base-cost waiting order: ${orderCoins} order coins + ${questCoins} quest coins + ${levelCoins} level coins; ${play.state.coins} remain after ${preparationCoins} preparation coins. ${play.state.xp} XP.`);
  const order = play.state.orders[0];
  for (const code of order.requirements) play.produce(code);
  play.act({ type: 'serve', id: order.id });
  assert.equal(play.state.orders.length, 3, 'Ordinary orders continue after every quest and the finale.');
});
