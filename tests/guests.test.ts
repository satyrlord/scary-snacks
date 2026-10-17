import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canServe, createGame, firstFreeBoardCell, generatorOutputs, journalCharacters, menuReward, normalizeOrderCustomers, questProblems, reduceGame, resolveQuests, validateGame } from '../src/engine.ts';
import { exportSave, importSave, loadSave, SAVE_KEY } from '../src/storage.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const search = data.quests.find(quest => quest.id === 'mina-avram-search')!;
const predecessor = search.afterQuest!;
const nobles = ['vlad', 'elisabeta'];

for (const fixture of ['undiscovered-drink-save', 'stored-drink-save']) for (const baseStage of [1, 2]) {
  test(`${fixture} keeps its quoted order deliverable by merging red wine from source stage ${baseStage}`, async () => {
    const text = await readFile(new URL(`./fixtures/${fixture}.json`, import.meta.url), 'utf8');
    const original = JSON.parse(text).state as GameState;
    const validator = (candidate: unknown) => validateGame(candidate, data);
    const storage = { getItem: (key: string) => key === SAVE_KEY ? text : null,
      setItem: () => assert.fail('Load must not rewrite the save.'), removeItem: () => assert.fail('Load must not remove the save.') };
    const loaded = loadSave<GameState>(storage, validator);
    assert.equal(loaded.status, 'loaded');
    assert.deepEqual(loaded.state, original);
    let state = importSave<GameState>(text, validator);
    assert.deepEqual(state, original);
    assert.equal(Object.hasOwn(state, 'questCompletedAt'), false);
    const stored = fixture === 'stored-drink-save';
    assert.equal(state.discovered.includes('drinks_5'), stored);
    assert.equal(state.board.some(cell => cell?.code === 'drinks_5'), stored);
    const order = structuredClone(state.orders.find(order => order.requirements.includes('drinks_5'))!);
    assert.ok(order, 'The existing quote requests the renamed item.');
    assert.equal(data.items.drinks_5.name, 'Red wine');
    assert.equal(data.items.drinks_4.next, 'drinks_5');
    assert.equal(data.items.drinks_5.next, 'drinks_6');
    assert.equal(menuReward(order.requirements, data), order.reward);
    const apply = (action: Action) => { state = act(state, action); };
    const produce = (code: string): number => {
      const item = data.items[code], source = `generator_${item.chain}`;
      if (item.stage === baseStage) {
        assert.ok(generatorOutputs(state, source, data).includes(code));
        const position = firstFreeBoardCell(state, data);
        assert.ok(position >= 0);
        apply({ type: 'spawn', index: state.board.findIndex(cell => cell?.code === source), output: code });
        return position;
      }
      const lower = Object.values(data.items).find(value => value.next === code)!;
      assert.ok(lower, `The merge path reaches ${code}.`);
      const first = produce(lower.id), second = produce(lower.id);
      apply({ type: 'move', from: first, to: second });
      assert.equal(state.board[second]?.code, code);
      return second;
    };
    for (const code of order.requirements) if (!canServe(state, { requirements: [code] }, data)) produce(code);
    assert.ok(state.discovered.includes('drinks_5'));
    assert.equal(canServe(state, order, data), true);
    assert.deepEqual(state.orders.find(value => value.id === order.id), order);
    const before = structuredClone(state);
    apply({ type: 'serve', id: order.id });
    assert.equal(state.coins, before.coins + order.reward);
    assert.equal(state.served, before.served + 1);
    assert.ok(!state.orders.some(value => value.id === order.id));
    assert.deepEqual(importSave<GameState>(exportSave(state, validator), validator), state);
  });
}

function act(state: GameState, action: Action): GameState {
  const before = structuredClone(state);
  const result = reduceGame(state, action, data);
  assert.equal(result.ok, true, result.message);
  assert.deepEqual(state, before);
  assert.equal(validateGame(result.state, data), true, `Valid state after ${action.type}.`);
  return result.state;
}

/** Direct supplies isolate visit sequencing from merge rules, which have their own legal-play tests. */
function supply(state: GameState, codes: string[]): void {
  for (const code of codes) {
    const index = firstFreeBoardCell(state, data);
    assert.notEqual(index, -1);
    state.board[index] = { code };
    if (!state.discovered.includes(code)) state.discovered.push(code);
  }
}

function serve(state: GameState, slot = 0): GameState {
  const order = state.orders[slot];
  supply(state, order.requirements);
  return act(state, { type: 'serve', id: order.id });
}

function checkpoint(): GameState {
  let state = createGame(data, 271828);
  for (let index = 0; index < 16; index++) {
    Object.assign(state, data.tasks[index].goals, { coins: data.tasks[index].cost });
    state = act(state, { type: 'task' });
  }
  state.served = Math.max(state.served, 120);
  return state;
}

function status(state: GameState): string {
  return resolveQuests(state, data).find(view => view.quest.id === search.id)!.status;
}

function finishIonatan(state = checkpoint()): GameState {
  const quest = data.quests.find(quest => quest.id === predecessor)!;
  supply(state, quest.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item)));
  return act(state, { type: 'deliverQuest', id: predecessor });
}

test('Mina and Avram share one vegetarian request exactly three ordinary services after Ionatan leaves', () => {
  assert.equal(search.character, 'mina');
  assert.deepEqual(search.companions, ['avram']);
  assert.deepEqual(search.waitsForCustomers, nobles);
  assert.equal(search.afterQuestServices, 3);
  assert.ok(search.requirements.every(requirement => ['bakery_5', 'produce_3', 'warm_4', 'drinks_3'].includes(requirement.item)));
  let state = checkpoint();
  assert.equal(status(state), 'locked');
  state.served += 100;
  assert.equal(status(state), 'locked', 'Lifetime service alone cannot substitute for Ionatan completing his request.');
  state = finishIonatan(state);
  const start = state.served;
  for (let index = 0; index < 3; index++) {
    assert.equal(status(state), 'locked');
    state = serve(state, index);
  }
  assert.equal(state.served, start + 3);
  assert.equal(status(state), 'active');
  assert.equal(journalCharacters(state, data).some(person => person.id === 'ionatan'), false);
  for (const id of ['mina', 'avram']) assert.equal(journalCharacters(state, data).some(person => person.id === id), true);
  const invalid = structuredClone(state);
  invalid.completedQuests.push(search.id);
  invalid.questCompletedAt![search.id] = start + 2;
  assert.equal(validateGame(invalid, data), false, 'A completed shared visit cannot predate its service delay.');
});

test('pending noble orders delay the shared visit and noble replacements stop until its delivery', () => {
  let state = finishIonatan();
  state.orders[0].customer = 'vlad';
  state.orders[1].customer = 'elisabeta';
  for (const order of state.orders.slice(0, 2)) {
    order.requirements = ['warm_5'];
    order.reward = menuReward(order.requirements, data);
  }
  for (let index = 0; index < 3; index++) state = serve(state, 2);
  assert.equal(status(state), 'locked');
  assert.equal(validateGame(state, data), true);
  assert.equal(journalCharacters(state, data).some(person => person.id === 'avram'), false);
  state = serve(state, 0);
  assert.equal(status(state), 'locked');
  assert.ok(!nobles.includes(state.orders[0].customer));
  state = serve(state, 1);
  assert.equal(status(state), 'active');
  for (let index = 0; index < 80; index++) {
    state = serve(state, index % 3);
    assert.ok(state.orders.every(order => !nobles.includes(order.customer)));
  }
  supply(state, search.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item)));
  state = act(state, { type: 'deliverQuest', id: search.id });
  for (const id of ['mina', 'avram']) assert.equal(journalCharacters(state, data).some(person => person.id === id), false);
  let returned = false;
  for (let index = 0; index < 80; index++) {
    state = serve(state, index % 3);
    returned ||= state.orders.some(order => nobles.includes(order.customer));
  }
  assert.equal(returned, true, 'The nobles can order again after the visitors depart.');
});

test('local gossip arrives once after three more services, survives export, and reports the departure without a return visit', () => {
  let state = finishIonatan();
  for (let index = 0; index < 3; index++) state = serve(state, index);
  supply(state, search.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item)));
  state = act(state, { type: 'deliverQuest', id: search.id });
  const counter = state.served;
  assert.equal(state.questCompletedAt![search.id], counter);
  assert.equal(state.pendingScenes.includes(search.followUp!.id), false);
  for (let index = 0; index < 2; index++) state = serve(state, index);
  assert.equal(state.pendingScenes.includes(search.followUp!.id), false);
  state = serve(state, 2);
  assert.equal(state.pendingScenes.filter(id => id === search.followUp!.id).length, 1);
  const report = search.followUp!.dialogue.map(line => line.text).join(' ');
  assert.match(report, /gravely ill/);
  assert.match(report, /Britain/);
  assert.match(report, /did not stop/);
  assert.ok(search.followUp!.dialogue.every(line => !['mina', 'avram', 'ionatan'].includes(line.speaker)));
  const validator = (candidate: unknown) => validateGame(candidate, data);
  state = importSave<GameState>(exportSave(state, validator), validator);
  assert.equal(state.questCompletedAt![predecessor], counter - 3);
  assert.ok(state.pendingScenes.includes(search.followUp!.id));
  state = act(state, { type: 'readScene', id: search.followUp!.id });
  state = serve(state);
  assert.equal(state.pendingScenes.includes(search.followUp!.id), false);
  assert.equal(status(state), 'complete');
  assert.equal(reduceGame(state, { type: 'deliverQuest', id: search.id }, data).ok, false);
  assert.equal(status(createGame(data)), 'locked', 'A new campaign can have a new visit.');
});

test('waiting gossip keeps its place before a later chapter closing through saves and reading', () => {
  let state = finishIonatan();
  for (let index = 0; index < 3; index++) state = serve(state, index);
  supply(state, search.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item)));
  state = act(state, { type: 'deliverQuest', id: search.id });
  for (let index = 0; index < 3; index++) state = serve(state, index);
  const earlier = data.chapters.slice(0, 4).map(chapter => chapter.id);
  const news = search.followUp!.id, later = data.chapters[4].id;
  // Preparation and quest scenes also wait. This test follows the chapter scenes and the news.
  const story = (value: GameState) => value.pendingScenes.filter(id => !data.tasks.some(task => task.id === id) && !data.quests.some(quest => quest.id === id));
  assert.deepEqual(story(state), [...earlier, news]);
  for (let index = 16; index < 20; index++) {
    const task = data.tasks[index];
    state.coins = task.cost;
    state.served = Math.max(state.served, task.goals.served);
    state.merges = Math.max(state.merges, task.goals.merges);
    state = act(state, { type: 'task' });
  }
  assert.deepEqual(story(state), [...earlier, news, later]);
  const validator = (candidate: unknown) => validateGame(candidate, data);
  state = importSave<GameState>(exportSave(state, validator), validator);
  assert.deepEqual(story(state), [...earlier, news, later]);
  const reloaded: GameState = JSON.parse(JSON.stringify(state));
  assert.equal(validateGame(reloaded, data), true);
  state = reloaded;
  for (const id of earlier) state = act(state, { type: 'readScene', id });
  assert.deepEqual(story(state), [news, later]);
  state = act(state, { type: 'readScene', id: news });
  state = importSave<GameState>(exportSave(state, validator), validator);
  assert.deepEqual(story(state), [later], 'Reading the news preserves the later chapter scene.');
  state = act(state, { type: 'readScene', id: later });
  assert.deepEqual(story(state), []);
});

test('existing completed Ionatan saves use three new services and reject malformed completion counters', () => {
  let state = checkpoint();
  state.completedQuests.push(predecessor);
  const before = structuredClone(state);
  assert.equal(validateGame(state, data), true);
  assert.equal(status(state), 'locked');
  assert.deepEqual(state, before, 'Reading old progress does not invent a delivery counter.');
  for (let index = 0; index < 3; index++) state = serve(state, index);
  assert.equal(state.questCompletedAt![predecessor], before.served);
  assert.equal(status(state), 'active');
  for (const questCompletedAt of [null, [], { absent: 1 }, { [predecessor]: -1 }, { [predecessor]: 1.5 }, { [predecessor]: data.quests.find(quest => quest.id === predecessor)!.afterServed! - 1 }, { [predecessor]: state.served + 1 }]) {
    assert.equal(validateGame({ ...state, questCompletedAt }, data), false, JSON.stringify(questCompletedAt));
  }
  assert.equal(validateGame({ ...state, pendingScenes: [...state.pendingScenes, search.followUp!.id] }, data), false);
});

test('nobles are occasional customers with available meat and wine only, and duplicate repair keeps the diet valid', () => {
  let state = createGame(data, 1);
  for (let index = 0; index < 60; index++) {
    state = serve(state, index % 3);
    assert.ok(state.orders.every(order => !nobles.includes(order.customer)), 'No permitted dish or wine is available at the start.');
  }
  state = checkpoint();
  const visits = new Map(nobles.map(id => [id, 0]));
  for (let index = 0; index < 500; index++) {
    const slot = index % 3;
    state = serve(state, slot);
    const order = state.orders[slot];
    if (nobles.includes(order.customer)) {
      visits.set(order.customer, visits.get(order.customer)! + 1);
      assert.ok(order.requirements.every(code => ['warm_5', 'warm_6', 'drinks_5'].includes(code)));
    }
  }
  for (const count of visits.values()) assert.ok(count > 0 && count < 80, 'Noble visits are occasional in the fixed seed fixture.');
  state.orders[0].customer = 'vlad';
  state.orders[0].requirements = ['warm_5'];
  state.orders[0].reward = menuReward(state.orders[0].requirements, data);
  state.orders[1] = { ...state.orders[1], customer: 'vlad', requirements: ['warm_5'], reward: data.items.warm_5.price };
  assert.equal(validateGame(state, data), true);
  const normalized = normalizeOrderCustomers(state, data);
  assert.equal(new Set(normalized.orders.map(order => order.customer)).size, 3);
  assert.equal(validateGame(normalized, data), true);
  for (const [index, order] of normalized.orders.entries()) assert.deepEqual({ ...order, customer: state.orders[index].customer }, state.orders[index]);
  const invalid = structuredClone(state);
  invalid.orders[0].requirements = ['bakery_2'];
  invalid.orders[0].reward = data.items.bakery_2.price;
  assert.equal(validateGame(invalid, data), false);
});

test('guest metadata rejects broken diets, companions, delay gates, and gossip scenes', () => {
  const cases: ((content: GameData) => void)[] = [
    content => { content.characters.find(person => person.id === 'vlad')!.orderItems = ['generator_warm']; },
    content => { content.characters.find(person => person.id === 'vlad')!.absentDuringQuest = 'absent'; },
    content => { content.quests.find(quest => quest.id === search.id)!.companions = ['mina']; },
    content => { content.quests.find(quest => quest.id === search.id)!.companions = ['avram', 'avram']; },
    content => { content.quests.find(quest => quest.id === search.id)!.afterQuestServices = 0; },
    content => { delete content.quests.find(quest => quest.id === search.id)!.afterQuest; },
    content => { content.quests.find(quest => quest.id === search.id)!.waitsForCustomers = ['mara']; },
    // An absent customer that the visit does not wait for could keep a ticket that the visit then meets.
    content => { content.quests.find(quest => quest.id === search.id)!.waitsForCustomers = ['vlad']; },
    content => { content.quests.find(quest => quest.id === search.id)!.followUp!.dialogue = []; },
  ];
  for (const mutate of cases) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(questProblems(content).length);
  }
});
