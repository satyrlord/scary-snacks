import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveriesSince, journalCharacters, resolveQuests } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import { questProblems } from '../src/content.ts';
import { exportSave, importSave } from '../src/storage.ts';
import type { GameData, GameState } from '../src/model.ts';
import { act, data, deliver, opened, player, validate } from './support.ts';

const search = data.quests.find(quest => quest.id === 'mina-avram-search')!;
const predecessor = search.afterQuest!;
const status = (state: GameState, id = search.id) => resolveQuests(state, data).find(view => view.quest.id === id)!.status;
/** Deliver the active tickets until the shared visit is active. */
function untilSearch(state: GameState): GameState {
  while (status(state) !== 'active') state = deliver(state, resolveQuests(state, data).find(view => view.status === 'active')!.quest.id);
  return state;
}

// Vlad's dinner can be made from stage-one ingredients and merges.
test(`Vlad's dinner after dark is deliverable by merging red wine and cabbage rolls from stage-one ingredients`, () => {
  const play = player(opened(8));
  assert.equal(data.items.drinks_5.name, 'Red wine');
  assert.equal(data.items.drinks_4.next, 'drinks_5');
  const quest = data.quests.find(quest => quest.id === 'vlad-after-dark')!;
  assert.equal(status(play.state, quest.id), 'active');
  for (const { item, quantity } of quest.requirements) for (let count = 0; count < quantity; count++) play.produce(item);
  assert.ok(play.state.discovered.includes('drinks_5'));
  const before = structuredClone(play.state);
  play.act({ type: 'deliverQuest', id: quest.id });
  assert.equal(play.state.coins, before.coins + quest.reward);
  assert.deepEqual(play.state.completedQuests, [...before.completedQuests, quest.id]);
  assert.equal(play.state.board.some(cell => cell?.code === 'drinks_5' || cell?.code === 'warm_5'), false);
  assert.deepEqual(importSave<GameState>(exportSave(play.state, validate), validate), play.state);
});

test('Ionatan has one dinner of four final dishes, and the journal shows him only once his visit opens', () => {
  const person = data.characters.find(person => person.id === 'ionatan')!;
  assert.equal(person.visitor, true);
  const quests = data.quests.filter(quest => quest.character === person.id);
  assert.deepEqual(quests.map(quest => quest.id), [predecessor]);
  assert.equal(quests[0].afterTask, 'task_9');
  assert.deepEqual(quests[0].requirements, ['warm_6', 'produce_6', 'sweet_6', 'drinks_6'].map(item => ({ item, quantity: 1 })));
  const shown = (state: GameState) => journalCharacters(state, data).map(character => character.id);
  assert.deepEqual(shown(createGame(data)), data.characters.filter(character => !character.singleVisit && !character.arrivesAfter).map(character => character.id));
  assert.equal(shown(opened(8)).includes(person.id), false);
  assert.equal(shown(opened(9)).includes(person.id), true);
});

test('Mina and Avram share one vegetarian quest after Ionatan has dined and left', () => {
  assert.equal(search.character, 'mina');
  assert.deepEqual(search.companions, ['avram']);
  assert.equal(predecessor, 'ionatan-castle-dinner');
  assert.equal(search.afterTask, 'task_10');
  assert.ok(search.requirements.every(requirement => ['bakery_5', 'produce_3', 'warm_4', 'drinks_3'].includes(requirement.item)));
  for (const id of ['ionatan', 'mina', 'avram']) assert.equal(data.characters.find(person => person.id === id)!.singleVisit, true);
  // Ionatan comes after Vlad's guest, and his own visit ends with his delivery.
  assert.equal(data.quests.find(quest => quest.id === predecessor)!.afterQuest, 'vlad-guest');
  assert.equal(status(opened(8), predecessor), 'locked');
  let state = opened(9);
  assert.equal(status(state), 'locked');
  while (status(state, predecessor) !== 'active') state = deliver(state, resolveQuests(state, data).find(view => view.status === 'active')!.quest.id);
  assert.equal(journalCharacters(state, data).some(person => person.id === 'ionatan'), true);
  state = deliver(state, predecessor);
  assert.equal(journalCharacters(state, data).some(person => person.id === 'ionatan'), false);
  assert.equal(status(state), 'locked', 'The shared visit also waits for the next preparation.');
  state = opened(10);
  assert.notEqual(status(state), 'locked');
  for (const id of ['mina', 'avram']) assert.equal(journalCharacters(state, data).some(person => person.id === id), true);
  state = deliver(untilSearch(state), search.id);
  for (const id of ['mina', 'avram']) assert.equal(journalCharacters(state, data).some(person => person.id === id), false);
  assert.equal(status(state), 'complete');
  assert.equal(reduceGame(state, { type: 'deliverQuest', id: search.id }, data).ok, false);
});

test('the road news follows the shared visit after exactly three later deliveries, once, and survives export', () => {
  let state = untilSearch(opened(10));
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
  state = importSave<GameState>(exportSave(state, validate), validate);
  assert.ok(state.pendingScenes.includes(news));
  state = act(state, { type: 'readScene', id: news });
  state = deliver(state, resolveQuests(state, data).find(view => view.status === 'active')!.quest.id);
  assert.equal(state.pendingScenes.includes(news), false, 'A later delivery does not queue the news again.');
});

test('waiting news keeps its place between the chapter closings around it through saves and reading', () => {
  let state = deliver(untilSearch(opened(10)), search.id);
  const news = search.followUp!.id, earlier = data.chapters[2].id, later = data.chapters[3].id;
  // Preparation and quest scenes also wait. This test follows the chapter scenes and the news.
  const story = (value: GameState) => value.pendingScenes.filter(id => !data.tasks.some(task => task.id === id) && !data.quests.some(quest => quest.id === id) && !id.startsWith('arrival-'));
  while (state.taskIndex < 16) {
    const ticket = resolveQuests(state, data).find(view => view.status === 'active');
    state = ticket ? deliver(state, ticket.quest.id) : act({ ...state, coins: data.tasks[state.taskIndex].cost }, { type: 'task' });
  }
  assert.deepEqual(story(state), [earlier, news, later]);
  state = importSave<GameState>(exportSave(state, validate), validate);
  assert.deepEqual(story(state), [earlier, news, later]);
  state = act(state, { type: 'readScene', id: news });
  state = importSave<GameState>(exportSave(state, validate), validate);
  assert.deepEqual(story(state), [earlier, later], 'Reading the news preserves the chapter scenes.');
  state = act(state, { type: 'readScene', id: earlier });
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
    ['single visit with two quests', content => { content.quests.find(quest => quest.id === 'adrian-first-pack')!.companions = ['ionatan']; }],
    ['single visit flag on a regular', content => { content.characters.find(person => person.id === 'vlad')!.singleVisit = true; }],
  ];
  for (const [name, mutate] of cases) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(questProblems(content).length, name);
  }
});
