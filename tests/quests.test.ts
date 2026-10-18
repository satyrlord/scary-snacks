import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canDeliverQuest, createGame, dataProblems, firstFreeBoardCell, generatorOutputs, getItem, journalCharacters, QUEST_TICKETS, questDeliveryCells, questProblems,
  reduceGame, requiredQuests, resolveQuests, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));

function player(initial = createGame(data), content = data) {
  let state = initial;
  assert.deepEqual(dataProblems(content), [], 'The fixture data passes its checks.');
  function act(action: Action) {
    const before = structuredClone(state);
    const result = reduceGame(state, action, content);
    assert.equal(result.ok, true, result.message);
    assert.deepEqual(state, before, 'Actions preserve their input.');
    state = result.state;
    assert.equal(validateGame(state, content), true, `Valid state after ${action.type}.`);
    return state;
  }
  function produce(code: string): number {
    const item = getItem(code, content)!;
    const source = `generator_${item.chain}`;
    if (generatorOutputs(state, source, content).includes(code)) {
      const empty = firstFreeBoardCell(state, content);
      assert.ok(empty >= 0, 'Normal production fits the board.');
      act({ type: 'spawn', index: state.board.findIndex(cell => cell?.code === source), output: code });
      assert.equal(state.board[empty]?.code, code);
      return empty;
    }
    const previous = Object.values(content.items).find(previous => previous.next === code)!;
    const first = produce(previous.id);
    const second = produce(previous.id);
    act({ type: 'move', from: first, to: second });
    assert.equal(state.board[second]?.code, code);
    return second;
  }
  return { get state() { return state; }, content, act, produce };
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

/** Direct supplies isolate the ticket rules from production, which has its own legal-play tests. */
function supply(state: GameState, id: string): GameState {
  const supplied = structuredClone(state);
  for (const { item, quantity } of data.quests.find(quest => quest.id === id)!.requirements) for (let count = 0; count < quantity; count++) {
    supplied.board[firstFreeBoardCell(supplied, data)] = { code: item };
    if (!supplied.discovered.includes(item)) supplied.discovered.push(item);
  }
  return supplied;
}
function deliver(state: GameState, id: string): GameState {
  const result = reduceGame(supply(state, id), { type: 'deliverQuest', id }, data);
  assert.equal(result.ok, true, result.message);
  assert.equal(validateGame(result.state, data), true);
  return result.state;
}
const checkpoint = (count: number) => checkpointState(data, count);
/** The preparation at index count is paid for, and the quests that open with it wait. */
const opened = (count: number) => ({ ...checkpoint(count), completedQuests: checkpoint(count - 1).completedQuests, coins: 0 });
const ids = (state: GameState, status: string) => resolveQuests(state, data).filter(view => view.status === status).map(view => view.quest.id);

test('every neighbour asks across the whole campaign, and every quest opens before the last preparation', () => {
  assert.deepEqual(questProblems(data), []);
  assert.equal(data.quests.length, 81);
  assert.equal(Object.keys(data.items).length, 35);
  assert.equal(data.chains.length, 5);
  assert.equal(data.tasks.length, 24);
  for (const character of data.characters) {
    assert.ok(character.introduction.length > 40);
    const count = data.quests.filter(quest => quest.character === character.id || quest.companions?.includes(character.id)).length;
    if (character.singleVisit) assert.equal(count, 1, character.id);
    else assert.ok(count >= 2, character.id);
  }
  const windows = new Set(data.quests.map(quest => quest.afterTask === null ? 0 : data.tasks.findIndex(task => task.id === quest.afterTask) + 1));
  assert.deepEqual([...windows].sort((a, b) => a - b), Array.from({ length: data.tasks.length }, (_, index) => index), 'Each window opens at least one quest.');
  assert.deepEqual(requiredQuests(data.tasks.length - 1, data), data.quests);
});

test('tickets show at most three active quests in authored order, and a waiting quest takes a freed ticket', () => {
  assert.equal(QUEST_TICKETS, 3);
  const start = createGame(data);
  // A second quest of a character in the same window waits for the first, so it is locked, not waiting.
  const open = data.quests.filter((quest, at) => quest.afterTask === null && !data.quests.slice(0, at).some(earlier => earlier.character === quest.character)).map(quest => quest.id);
  assert.deepEqual(ids(start, 'active'), open.slice(0, 3));
  assert.deepEqual(ids(start, 'waiting'), open.slice(3));
  // Delivering the second ticket keeps the authored order of the others, and the first waiting quest takes the free ticket.
  const second = deliver(start, open[1]);
  assert.deepEqual(ids(second, 'active'), [open[0], open[2], open[3]]);
  assert.deepEqual(ids(second, 'waiting'), open.slice(4));
  assert.deepEqual(ids(second, 'complete'), [open[1]]);
  for (const count of [1, 4, 9, 15, 23]) {
    const state = opened(count);
    const active = ids(state, 'active'), waiting = ids(state, 'waiting');
    assert.ok(active.length <= QUEST_TICKETS);
    if (waiting.length) assert.equal(active.length, QUEST_TICKETS, 'A waiting quest never leaves a ticket free.');
    const order = [...active, ...waiting];
    assert.deepEqual(order, data.quests.filter(quest => order.includes(quest.id)).map(quest => quest.id));
  }
});

test('a waiting quest cannot be delivered even with every item on the board', () => {
  const start = createGame(data);
  const waiting = ids(start, 'waiting')[0];
  const supplied = supply(start, waiting);
  assert.ok(questDeliveryCells(supplied, data.quests.find(quest => quest.id === waiting)!, data).every(index => index >= 0));
  assert.equal(canDeliverQuest(supplied, waiting, data), false);
  assert.match(rejected(supplied, { type: 'deliverQuest', id: waiting }).message, /still on a ticket/);
  // A locked quest cannot be delivered either.
  const locked = ids(start, 'locked')[0];
  rejected(supply(start, locked), { type: 'deliverQuest', id: locked });
});

test('quest data rejects unknown IDs, quantities, cycles, unavailable chains, finishes, and conflicting ownership', () => {
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
    ['single visit without visitor role', content => { content.characters.find(person => person.id === 'ionatan')!.visitor = false; }],
    ['single visit without a quest', content => { content.quests = content.quests.filter(quest => quest.character !== 'ionatan'); }],
    ['single visit with multiple quests', content => { content.quests[0].character = 'ionatan'; }],
    ['invalid single visit flag', content => { (content.characters.find(person => person.id === 'ionatan') as unknown as Record<string, unknown>).singleVisit = 'yes'; }],
    ['same character cycle', content => { content.quests[0].afterQuest = 'mara-table'; }],
    ['unknown finish slot', content => { content.quests.find(quest => quest.unlocks)!.unlocks!.slot = 'absent'; }],
    ['default finish', content => { content.quests.find(quest => quest.unlocks?.slot === 'tableware')!.unlocks!.variant = 'blue'; }],
    ['finish without a quest', content => { delete content.quests.find(quest => quest.unlocks?.slot === 'tableware')!.unlocks; }],
    ['finish with two quests', content => { content.quests[0].unlocks = { slot: 'tableware', variant: 'green' }; }],
  ];
  for (const [label, mutate] of cases) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(questProblems(content).length, label);
    assert.ok(dataProblems(content).length, label);
  }
});

test('traveller quests return in one shared sequence of packs that fit the board', () => {
  const visits = data.quests.filter(quest => {
    const person = data.characters.find(person => person.id === quest.character)!;
    return person.visitor && !person.singleVisit;
  });
  assert.deepEqual(visits.map(quest => quest.character), ['adrian', 'monica', 'janos', 'adrian', 'monica', 'janos', 'adrian', 'monica', 'janos']);
  assert.deepEqual(visits.map(quest => quest.afterTask), [6, 8, 9, 13, 14, 17, 19, 21, 22].map(number => `task_${number}`));
  for (const [index, quest] of visits.entries()) {
    assert.equal(quest.afterQuest, visits[index - 1]?.id);
    const quantity = quest.requirements.reduce((sum, requirement) => sum + requirement.quantity, 0);
    assert.ok(quantity <= 16, 'The pack leaves room for sources, obstacles, and production.');
    assert.match(quest.opening.map(line => line.text).join(' '), /cathedral/);
    assert.match(quest.opening.map(line => line.text).join(' '), /several days/);
  }
  // A save cannot hold a pack before the pack that it follows.
  const finished = checkpoint(24);
  const [first, second] = [finished.completedQuests.indexOf(visits[0].id), finished.completedQuests.indexOf(visits[1].id)];
  const swapped = [...finished.completedQuests];
  [swapped[first], swapped[second]] = [swapped[second], swapped[first]];
  assert.equal(validateGame({ ...finished, completedQuests: swapped }, data), false);
});

test('Ionatan dinner delivery pays once, keeps failed visits open, and records his departure across reloads', () => {
  const id = 'ionatan-castle-dinner', quest = data.quests.find(quest => quest.id === id)!;
  let state = opened(9);
  while (!ids(state, 'active').includes(id)) state = deliver(state, ids(state, 'active')[0]);
  const play = player(state);
  const visible = () => journalCharacters(play.state, data).some(character => character.id === quest.character);
  rejected(play.state, { type: 'deliverQuest', id });
  assert.equal(visible(), true);
  for (const requirement of quest.requirements.slice(0, -1)) play.produce(requirement.item);
  rejected(play.state, { type: 'deliverQuest', id });
  assert.equal(visible(), true);
  play.produce(quest.requirements.at(-1)!.item);
  play.state.coins = 7;
  const before = structuredClone(play.state);
  play.act({ type: 'deliverQuest', id });
  assert.equal(play.state.coins, 7 + 220);
  for (const key of ['taskIndex', 'decorations', 'discovered'] as const) assert.deepEqual(play.state[key], before[key]);
  assert.deepEqual(play.state.completedQuests, [...before.completedQuests, id]);
  assert.equal(resolveQuests(play.state, data).find(view => view.quest.id === id)!.status, 'complete');
  const reloaded: GameState = JSON.parse(JSON.stringify(play.state));
  assert.equal(validateGame(reloaded, data), true);
  rejected(reloaded, { type: 'deliverQuest', id });
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
  assert.equal(play.state.taskIndex, before.taskIndex);
  assert.deepEqual(play.state.completedQuests, [quest.id]);
  assert.equal(play.state.board.filter(cell => cell?.code === 'drinks_2').length, 0);
  const reloaded: GameState = JSON.parse(JSON.stringify(play.state));
  rejected(reloaded, { type: 'deliverQuest', id: quest.id }, content);
  rejected(reloaded, { type: 'deliverQuest', id: 'absent' }, content);
  rejected(reloaded, { type: 'deliverQuest', id: 'mara-table' }, content);
  const snapshot = structuredClone(reloaded);
  resolveQuests(reloaded, content);
  assert.deepEqual(reloaded, snapshot, 'Reading quest status has no effect.');
});

test('deliveries stop at the coin limit, so the game stays savable', () => {
  const limit = 1_000_000_000;
  const quest = data.quests.find(quest => quest.id === 'mara-welcome')!;
  const play = player();
  play.produce('drinks_2');
  assert.match(rejected({ ...structuredClone(play.state), coins: limit }, { type: 'deliverQuest', id: quest.id }).message, /Spend some coins/);
  play.state.coins = limit - quest.reward;
  play.act({ type: 'deliverQuest', id: quest.id });
  assert.equal(play.state.coins, limit);
});

test('delivery queues the quest completion scene in the same change, and a failed delivery queues nothing', () => {
  const play = player();
  rejected(play.state, { type: 'deliverQuest', id: 'mara-welcome' });
  play.produce('drinks_2');
  const before = structuredClone(play.state);
  play.act({ type: 'deliverQuest', id: 'mara-welcome' });
  assert.deepEqual(play.state.pendingScenes, [...before.pendingScenes, 'mara-welcome']);
  // The scene waits at any position: a later payment queues its own scene after it.
  for (const quest of requiredQuests(0, data)) if (!play.state.completedQuests.includes(quest.id)) play.state.completedQuests.push(quest.id);
  play.state.coins += data.tasks[0].cost;
  play.act({ type: 'task' });
  assert.deepEqual(play.state.pendingScenes, ['mara-welcome', data.tasks[0].id]);
  const lines = data.quests.find(quest => quest.id === 'mara-welcome')!.completion.length;
  rejected(play.state, { type: 'sceneLine', id: 'mara-welcome', line: lines });
  const coins = play.state.coins;
  assert.equal(reduceGame(play.state, { type: 'readScene', id: 'mara-welcome' }, data).message, 'The scene is in the story journal.');
  // A guest who visits once has no journal replay, so reading the scene does not point to the journal.
  const single = data.quests.find(quest => data.characters.find(person => person.id === quest.character)?.singleVisit)!;
  const visited = { ...structuredClone(play.state), pendingScenes: [...play.state.pendingScenes, single.id] };
  assert.equal(reduceGame(visited, { type: 'readScene', id: single.id }, data).message, 'The scene is finished.');
  play.act({ type: 'readScene', id: 'mara-welcome' });
  assert.deepEqual(play.state.pendingScenes, [data.tasks[0].id]);
  assert.equal(play.state.coins, coins, 'Reading the scene gives no second reward.');
  rejected(play.state, { type: 'readScene', id: 'mara-welcome' });
});

test('quest saves reject a wrong version, unknown, duplicate, early, and out-of-order completions, and missing required quests', () => {
  const good = checkpoint(18);
  const later = data.quests.find(quest => !good.completedQuests.includes(quest.id) && !requiredQuests(18, data).includes(quest))!;
  const cases: [string, (state: GameState) => void][] = [
    ['version 9', state => { (state as { version: number }).version = 9; }],
    ['unknown quest', state => { state.completedQuests.push('absent'); }],
    ['duplicate', state => { state.completedQuests.push(state.completedQuests[0]); }],
    ['before its preparation', state => { state.completedQuests.push(later.id); }],
    ['before its predecessor', state => {
      const [first, second] = ['mara-welcome', 'mara-lamp-supper'].map(id => state.completedQuests.indexOf(id));
      [state.completedQuests[first], state.completedQuests[second]] = [state.completedQuests[second], state.completedQuests[first]];
    }],
    ['a paid preparation without its quests', state => { state.completedQuests = checkpoint(16).completedQuests; }],
    ['unknown board item', state => { state.board[state.board.indexOf(null)] = { code: 'absent' }; state.discovered.push('absent'); }],
  ];
  assert.equal(validateGame(good, data), true);
  for (const [label, mutate] of cases) { const broken = structuredClone(good); mutate(broken); assert.equal(validateGame(broken, data), false, label); }
});
