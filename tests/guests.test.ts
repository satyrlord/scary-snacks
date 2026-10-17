import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deliveriesSince, firstFreeBoardCell, generatorOutputs, journalCharacters, questProblems, reduceGame, resolveQuests, validateGame } from '../src/engine.ts';
import { exportSave, importSave } from '../src/storage.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const search = data.quests.find(quest => quest.id === 'mina-avram-search')!;
const predecessor = search.afterQuest!;
const validator = (candidate: unknown) => validateGame(candidate, data);

function act(state: GameState, action: Action): GameState {
  const before = structuredClone(state);
  const result = reduceGame(state, action, data);
  assert.equal(result.ok, true, result.message);
  assert.deepEqual(state, before);
  assert.equal(validateGame(result.state, data), true, `Valid state after ${action.type}.`);
  return result.state;
}

/** Direct supplies isolate visit sequencing from merge rules, which have their own legal-play tests. */
function deliver(state: GameState, id: string): GameState {
  const supplied = structuredClone(state);
  for (const { item, quantity } of data.quests.find(quest => quest.id === id)!.requirements) for (let count = 0; count < quantity; count++) {
    const index = firstFreeBoardCell(supplied, data);
    assert.notEqual(index, -1);
    supplied.board[index] = { code: item };
    if (!supplied.discovered.includes(item)) supplied.discovered.push(item);
  }
  return act(supplied, { type: 'deliverQuest', id });
}

/** The preparation at index count is paid for, and the quests that open with it wait. */
const opened = (count: number) => ({ ...checkpointState(data, count), completedQuests: checkpointState(data, count - 1).completedQuests, coins: 0 });
const status = (state: GameState, id = search.id) => resolveQuests(state, data).find(view => view.quest.id === id)!.status;
/** Deliver the active tickets until the shared visit is active. */
function untilSearch(state: GameState): GameState {
  while (status(state) !== 'active') state = deliver(state, resolveQuests(state, data).find(view => view.status === 'active')!.quest.id);
  return state;
}

for (const baseStage of [1, 2]) {
  test(`Vlad's dinner after dark is deliverable by merging red wine and cabbage rolls from source stage ${baseStage}`, () => {
    let state = opened(15);
    assert.equal(data.items.drinks_5.name, 'Red wine');
    assert.equal(data.items.drinks_4.next, 'drinks_5');
    const quest = data.quests.find(quest => quest.id === 'vlad-after-dark')!;
    assert.equal(status(state, quest.id), 'active');
    const produce = (code: string): number => {
      const item = data.items[code], source = `generator_${item.chain}`;
      if (item.stage === baseStage) {
        assert.ok(generatorOutputs(state, source, data).includes(code));
        const position = firstFreeBoardCell(state, data);
        assert.ok(position >= 0);
        state = act(state, { type: 'spawn', index: state.board.findIndex(cell => cell?.code === source), output: code });
        return position;
      }
      const lower = Object.values(data.items).find(value => value.next === code)!;
      assert.ok(lower, `The merge path reaches ${code}.`);
      const first = produce(lower.id), second = produce(lower.id);
      state = act(state, { type: 'move', from: first, to: second });
      assert.equal(state.board[second]?.code, code);
      return second;
    };
    for (const { item, quantity } of quest.requirements) for (let count = 0; count < quantity; count++) produce(item);
    assert.ok(state.discovered.includes('drinks_5'));
    const before = structuredClone(state);
    state = act(state, { type: 'deliverQuest', id: quest.id });
    assert.equal(state.coins, before.coins + quest.reward);
    assert.deepEqual(state.completedQuests, [...before.completedQuests, quest.id]);
    assert.equal(state.board.some(cell => cell?.code === 'drinks_5' || cell?.code === 'warm_5'), false);
    assert.deepEqual(importSave<GameState>(exportSave(state, validator), validator), state);
  });
}

test('Mina and Avram share one vegetarian request after Ionatan has dined and left', () => {
  assert.equal(search.character, 'mina');
  assert.deepEqual(search.companions, ['avram']);
  assert.equal(predecessor, 'ionatan-castle-dinner');
  assert.equal(search.afterTask, 'task_17');
  assert.ok(search.requirements.every(requirement => ['bakery_5', 'produce_3', 'warm_4', 'drinks_3'].includes(requirement.item)));
  for (const id of ['ionatan', 'mina', 'avram']) assert.equal(data.characters.find(person => person.id === id)!.singleVisit, true);
  // Ionatan comes after Vlad's guest, and his own visit ends with his delivery.
  assert.equal(data.quests.find(quest => quest.id === predecessor)!.afterQuest, 'vlad-guest');
  assert.equal(status(opened(15), predecessor), 'locked');
  let state = opened(16);
  assert.equal(status(state), 'locked');
  while (status(state, predecessor) !== 'active') state = deliver(state, resolveQuests(state, data).find(view => view.status === 'active')!.quest.id);
  assert.equal(journalCharacters(state, data).some(person => person.id === 'ionatan'), true);
  state = deliver(state, predecessor);
  assert.equal(journalCharacters(state, data).some(person => person.id === 'ionatan'), false);
  assert.equal(status(state), 'locked', 'The shared visit also waits for the next preparation.');
  state = opened(17);
  assert.notEqual(status(state), 'locked');
  for (const id of ['mina', 'avram']) assert.equal(journalCharacters(state, data).some(person => person.id === id), true);
  state = deliver(untilSearch(state), search.id);
  for (const id of ['mina', 'avram']) assert.equal(journalCharacters(state, data).some(person => person.id === id), false);
  assert.equal(status(state), 'complete');
  assert.equal(reduceGame(state, { type: 'deliverQuest', id: search.id }, data).ok, false);
});

test('the road news follows the shared visit after exactly three later deliveries, once, and survives export', () => {
  let state = untilSearch(opened(17));
  state = deliver(state, search.id);
  const news = search.followUp!.id;
  assert.equal(search.followUp!.afterDeliveries, 3);
  for (let count = 0; count < 3; count++) {
    assert.equal(deliveriesSince(state, search.id), count);
    assert.equal(state.pendingScenes.includes(news), false, `No news after ${count} later deliveries.`);
    assert.equal(validateGame({ ...state, pendingScenes: [...state.pendingScenes, news] }, data), false, 'A save cannot hold the news early.');
    let ticket = resolveQuests(state, data).find(view => view.status === 'active');
    if (!ticket) {
      // Every quest of this window is delivered, so the next preparation opens more.
      state = act({ ...state, coins: data.tasks[state.taskIndex].cost }, { type: 'task' });
      ticket = resolveQuests(state, data).find(view => view.status === 'active')!;
    }
    state = deliver(state, ticket.quest.id);
  }
  assert.equal(deliveriesSince(state, search.id), 3);
  assert.equal(state.pendingScenes.filter(id => id === news).length, 1);
  const report = search.followUp!.dialogue.map(line => line.text).join(' ');
  assert.match(report, /gravely ill/);
  assert.match(report, /Britain/);
  assert.match(report, /did not stop/);
  assert.ok(search.followUp!.dialogue.every(line => !['mina', 'avram', 'ionatan'].includes(line.speaker)));
  state = importSave<GameState>(exportSave(state, validator), validator);
  assert.ok(state.pendingScenes.includes(news));
  state = act(state, { type: 'readScene', id: news });
  state = deliver(state, resolveQuests(state, data).find(view => view.status === 'active')!.quest.id);
  assert.equal(state.pendingScenes.includes(news), false, 'A later delivery does not queue the news again.');
});

test('waiting news keeps its place before a later chapter closing through saves and reading', () => {
  let state = deliver(untilSearch(opened(17)), search.id);
  const news = search.followUp!.id, later = data.chapters[4].id;
  // Preparation and quest scenes also wait. This test follows the chapter scenes and the news.
  const story = (value: GameState) => value.pendingScenes.filter(id => !data.tasks.some(task => task.id === id) && !data.quests.some(quest => quest.id === id) && !id.startsWith('arrival-'));
  while (state.taskIndex < 20) {
    const ticket = resolveQuests(state, data).find(view => view.status === 'active');
    state = ticket ? deliver(state, ticket.quest.id) : act({ ...state, coins: data.tasks[state.taskIndex].cost }, { type: 'task' });
  }
  assert.deepEqual(story(state), [news, later]);
  state = importSave<GameState>(exportSave(state, validator), validator);
  assert.deepEqual(story(state), [news, later]);
  state = act(state, { type: 'readScene', id: news });
  state = importSave<GameState>(exportSave(state, validator), validator);
  assert.deepEqual(story(state), [later], 'Reading the news preserves the later chapter scene.');
  state = act(state, { type: 'readScene', id: later });
  assert.deepEqual(story(state), []);
});

test('guest metadata rejects broken companions, single visits, and news scenes', () => {
  const cases: [string, (content: GameData) => void][] = [
    ['companion is the character', content => { content.quests.find(quest => quest.id === search.id)!.companions = ['mina']; }],
    ['repeated companion', content => { content.quests.find(quest => quest.id === search.id)!.companions = ['avram', 'avram']; }],
    ['regular as companion', content => { content.quests.find(quest => quest.id === search.id)!.companions = ['vlad']; }],
    ['empty news', content => { content.quests.find(quest => quest.id === search.id)!.followUp!.dialogue = []; }],
    ['news without later deliveries', content => { content.quests.find(quest => quest.id === search.id)!.followUp!.afterDeliveries = 0; }],
    ['news with an unknown speaker', content => { content.quests.find(quest => quest.id === search.id)!.followUp!.dialogue[0].speaker = 'nobody'; }],
    ['single visit with two requests', content => { content.quests.find(quest => quest.id === 'adrian-first-pack')!.companions = ['ionatan']; }],
    ['single visit flag on a regular', content => { content.characters.find(person => person.id === 'vlad')!.singleVisit = true; }],
  ];
  for (const [name, mutate] of cases) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(questProblems(content).length, name);
  }
});
