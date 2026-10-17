import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canDeliverQuest, createGame, currentTask, dataProblems, firstFreeBoardCell, generatorOutputs, getItem, getLevel, journalCharacters, nextOutput, previewQuestCleanup, questProblems, reduceGame, resolveQuests, taskEligibility, validateGame } from '../src/engine.ts';
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
  assert.equal(data.quests.length, 23);
  assert.equal(Object.keys(data.items).length, 35);
  assert.equal(data.chains.length, 5);
  assert.equal(data.tasks.length, 24);
  assert.ok(data.tasks.every(task => !task.requiresQuest));
  assert.equal(data.quests.filter(quest => !data.characters.find(person => person.id === quest.character)!.visitor).reduce((sum, quest) => sum + quest.reward, 0), 312);
  for (const character of data.characters) {
    assert.ok(character.introduction.length > 40);
    assert.equal(data.quests.filter(quest => quest.character === character.id && !quest.producer).length, character.singleVisit ? 1 : 3);
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
    ['negative service goal', content => { content.quests[0].afterServed = -1; }],
    ['zero service goal', content => { content.quests[0].afterServed = 0; }],
    ['fraction service goal', content => { content.quests[0].afterServed = 1.5; }],
    ['unknown prior quest', content => { content.quests[0].afterQuest = 'absent'; }],
    ['single visit without visitor role', content => { content.characters.find(person => person.id === 'ionatan')!.visitor = false; }],
    ['single visit without a request', content => { content.quests = content.quests.filter(quest => quest.character !== 'ionatan'); }],
    ['single visit with multiple requests', content => { content.quests[0].character = 'ionatan'; }],
    ['invalid single visit flag', content => { (content.characters.find(person => person.id === 'ionatan') as unknown as Record<string, unknown>).singleVisit = 'yes'; }],
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

test('traveller requests return in one shared sequence after spaced service goals and preparations', () => {
  const visits = data.quests.filter(quest => {
    const person = data.characters.find(person => person.id === quest.character)!;
    return person.visitor && !person.singleVisit;
  });
  assert.equal(visits.length, 9);
  assert.deepEqual(visits.map(quest => quest.character), ['adrian', 'monica', 'janos', 'adrian', 'monica', 'janos', 'adrian', 'monica', 'janos']);
  for (const [index, quest] of visits.entries()) {
    assert.equal(quest.afterServed, (index + 1) * 24);
    assert.equal(quest.afterTask, `task_${index < 3 ? 6 : index < 6 ? 12 : 20}`);
    assert.equal(quest.afterQuest, visits[index - 1]?.id);
    const state = checkpoint(24);
    state.served = quest.afterServed! - 1;
    state.completedQuests = visits.slice(0, index).map(previous => previous.id);
    const status = () => resolveQuests(state, data).find(view => view.quest.id === quest.id)!.status;
    assert.equal(status(), 'locked');
    rejected(state, { type: 'deliverQuest', id: quest.id });
    const invalid = { ...structuredClone(state), completedQuests: [...state.completedQuests, quest.id] };
    assert.equal(validateGame(invalid, data), false, 'A save cannot claim a visit before its service goal.');
    state.served++;
    assert.equal(status(), 'active');
    assert.equal(resolveQuests(state, data).filter(view => visits.some(visit => visit.id === view.quest.id) && view.status === 'active').length, 1);
    state.decorations = state.decorations.slice(0, Number(quest.afterTask!.slice(5)) - 1);
    assert.equal(status(), 'locked', 'Service alone cannot open a visit before its preparation.');
  }
});

test('traveller packs have high volume or advanced food, fit the board, and pay twice their menu value', () => {
  for (const quest of data.quests.filter(quest => quest.afterServed && !data.characters.find(person => person.id === quest.character)!.singleVisit)) {
    const quantity = quest.requirements.reduce((sum, requirement) => sum + requirement.quantity, 0);
    assert.ok(quantity >= 12 || quest.requirements.every(requirement => data.items[requirement.item].stage >= 5), quest.id);
    assert.ok(quantity <= 16, 'The pack leaves room for sources, obstacles, and production.');
    const menu = quest.requirements.reduce((sum, requirement) => sum + data.items[requirement.item].price * requirement.quantity, 0);
    assert.equal(quest.reward, menu * 2);
    assert.ok(quest.reward > 32);
    assert.ok(quest.requirements.every(requirement => !['drinks_5', 'drinks_6'].includes(requirement.item)));
    assert.match(quest.opening.map(line => line.text).join(' '), /cathedral/);
    assert.match(quest.opening.map(line => line.text).join(' '), /several days/);
    assert.ok(!data.tasks.some(task => task.requiresQuest === quest.id));
  }
});

test('current saves keep their exact ordinary quotes and progress when the travellers are added', () => {
  const previous = structuredClone(data);
  previous.characters = previous.characters.filter(person => !person.visitor);
  previous.quests = previous.quests.filter(quest => !quest.afterServed);
  const state = createGame(previous);
  const before = structuredClone(state);
  assert.equal(validateGame(state, data), true);
  assert.deepEqual(createGame(data), before, 'Adding quest visitors keeps the ordinary customer pool and seed sequence.');
  resolveQuests(state, data);
  assert.deepEqual(state, before);
  const invalid = structuredClone(state);
  invalid.orders[0].customer = 'adrian';
  assert.equal(validateGame(invalid, data), false, 'Visitors cannot appear on ordinary saved tickets.');
});

test('Ionatan has one independent costly dinner and appears in the journal only during his visit', () => {
  const person = data.characters.find(person => person.id === 'ionatan')!;
  const quests = data.quests.filter(quest => quest.character === person.id);
  assert.equal(person.visitor, true);
  assert.equal(person.singleVisit, true);
  assert.equal(person.sprite, 3);
  assert.equal(quests.length, 1);
  const quest = quests[0];
  assert.equal(quest.id, 'ionatan-castle-dinner');
  assert.equal(quest.afterTask, 'task_16');
  assert.equal(quest.afterServed, 120);
  assert.equal(quest.afterQuest, undefined);
  assert.deepEqual(quest.requirements, ['warm_6', 'produce_6', 'sweet_6', 'drinks_6'].map(item => ({ item, quantity: 1 })));
  const price = quest.requirements.reduce((sum, requirement) => sum + data.items[requirement.item].price * requirement.quantity, 0);
  assert.equal(price, 220);
  assert.equal(quest.reward, 1100);
  assert.equal(quest.reward, price * 5);
  assert.ok(!data.tasks.some(task => task.requiresQuest === quest.id));
  assert.ok(!data.quests.some(other => other.afterQuest === quest.id));
  const visible = (state: GameState) => journalCharacters(state, data).some(character => character.id === person.id);
  assert.equal(visible(createGame(data)), false);
  const beforePreparation = checkpoint(15);
  beforePreparation.served = 120;
  assert.equal(visible(beforePreparation), false);
  const beforeService = checkpoint(16);
  beforeService.served = 119;
  assert.equal(visible(beforeService), false);
  beforeService.served = 120;
  assert.equal(visible(beforeService), true);
  assert.deepEqual(journalCharacters(createGame(data), data).map(character => character.id), data.characters.filter(character => !character.singleVisit).map(character => character.id));
});

test('Ionatan dinner delivery pays once, keeps failed visits active, and records his departure across reloads', () => {
  const id = 'ionatan-castle-dinner', quest = data.quests.find(quest => quest.id === id)!;
  const state = checkpoint(16);
  state.served = 120;
  const play = player(state);
  const visible = () => journalCharacters(play.state, data).some(character => character.id === quest.character);
  rejected(play.state, { type: 'deliverQuest', id });
  assert.equal(visible(), true);
  for (const requirement of quest.requirements.slice(0, -1)) play.produce(requirement.item);
  rejected(play.state, { type: 'deliverQuest', id });
  play.produce(quest.requirements.at(-1)!.item);
  play.state.coins = 1_000_000_000;
  rejected(play.state, { type: 'deliverQuest', id });
  assert.equal(visible(), true);
  play.state.coins = 7;
  const before = structuredClone(play.state);
  play.act({ type: 'deliverQuest', id });
  assert.equal(play.state.coins, 1107);
  for (const key of ['orders', 'seed', 'xp', 'served', 'merges', 'taskIndex'] as const) assert.deepEqual(play.state[key], before[key]);
  assert.equal(play.state.completedQuests.filter(complete => complete === id).length, 1);
  assert.equal(resolveQuests(play.state, data).find(view => view.quest.id === id)!.status, 'complete');
  assert.equal(visible(), false);
  const reloaded: GameState = JSON.parse(JSON.stringify(play.state));
  assert.equal(validateGame(reloaded, data), true);
  rejected(reloaded, { type: 'deliverQuest', id });
  reloaded.served += 240;
  assert.equal(validateGame(reloaded, data), true);
  assert.equal(journalCharacters(reloaded, data).some(character => character.id === quest.character), false);
  rejected(reloaded, { type: 'deliverQuest', id });
});

test('current saves with finished recurring visits stay valid when Ionatan is added', () => {
  const previous = structuredClone(data);
  previous.characters = previous.characters.filter(person => !person.singleVisit);
  previous.quests = previous.quests.filter(quest => quest.character !== 'ionatan');
  const state = checkpoint(24);
  state.served = 216;
  state.completedQuests = previous.quests.map(quest => quest.id);
  assert.equal(validateGame(state, previous), true, 'The fixture uses the current save format before the new guest.');
  const before = structuredClone(state);
  assert.equal(validateGame(state, data), true);
  assert.equal(resolveQuests(state, data).find(view => view.quest.character === 'ionatan')!.status, 'active');
  assert.deepEqual(state, before);
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
  const gated = structuredClone(data);
  gated.quests.find(quest => quest.id === dedicatedId)!.afterServed = accepted.state.served + 1;
  assert.equal(validateGame(accepted.state, gated), false, 'A borrowed source also needs its request service goal.');
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
    if (!task && play.state.completedQuests.length === data.quests.length) break;
    if (task && taskEligibility(play.state, data).ready) {
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
  assert.equal(play.state.completedQuests.length, data.quests.length);
  assert.deepEqual(play.state.activeQuestProducers, {});
  assert.equal(questCoins, data.quests.reduce((sum, quest) => sum + quest.reward, 0));
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
