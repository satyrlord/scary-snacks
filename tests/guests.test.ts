import test from 'node:test';
import assert from 'node:assert/strict';
import { journalCharacters } from '../src/model.ts';
import { createGame } from '../src/engine.ts';
import { questProblems } from '../src/content.ts';
import { exportSave, importSave } from '../src/storage.ts';
import type { GameData, GameState } from '../src/model.ts';
import { afterMarch, checkpoint, data, deliver, opened, player, status, tags, tonight, validate } from './support.ts';

const search = data.quests.find(quest => quest.id === 'mina-avram-search')!;
const predecessor = search.afterQuest!;

// Vlad's dinner can be made from stage-one ingredients, chain merges, and recipe merges.
test(`Vlad's dinner after dark is deliverable by cooking red wine and smoked bacon from stage-one ingredients`, () => {
  // Vlad comes last in his window: his ticket shows once the quests before him are delivered.
  const play = player(deliver(deliver(afterMarch(opened(8)), 'mara-table'), 'ileana-fitting'));
  play.state.coins = 1000;
  assert.equal(data.items.fruits_5.name, 'Red wine');
  assert.equal(data.items.fruits_4.next, 'fruits_5');
  const quest = data.quests.find(quest => quest.id === 'vlad-after-dark')!;
  assert.deepEqual(quest.requirements.map(({ item }) => item).sort(), ['fruits_5', 'pork_4']);
  assert.equal(status(play.state, quest.id), 'active');
  for (const { item, quantity } of quest.requirements) for (let count = 0; count < quantity; count++) play.produce(item);
  assert.ok(play.state.discovered.includes('fruits_5') && play.state.discovered.includes('pork_4'));
  // Vlad books the evening, and the lanterns bring him.
  const booked = player(tonight(play.state, quest.id));
  booked.act({ type: 'lantern', id: quest.id });
  const before = structuredClone(booked.state);
  booked.act({ type: 'deliverQuest', id: quest.id });
  const after = booked.state;
  assert.equal(after.coins, before.coins + quest.reward);
  assert.deepEqual(after.completedQuests, [...before.completedQuests, quest.id]);
  assert.equal(after.board.some(cell => quest.requirements.some(({ item }) => cell?.code === item)), false);
  assert.deepEqual(importSave<GameState>(exportSave(after, validate), validate), after);
});

test('Ionatan dines on his way to the castle in May, after act 1, so act 1 never opens his dinner or shows him in the journal', () => {
  const person = data.characters.find(person => person.id === 'ionatan')!;
  assert.equal(person.visitor, true);
  const quests = data.quests.filter(quest => quest.character === person.id);
  assert.deepEqual(quests.map(quest => quest.id), [predecessor]);
  assert.deepEqual([quests[0].afterTask, quests[0].afterQuest, quests[0].act], ['task_9', 'vlad-guest', 2]);
  assert.deepEqual(quests[0].requirements, [['fruits_5', 1], ['mixed_sharing-board', 1], ['mixed_tochitura', 1]]
    .map(([item, quantity]) => ({ item, quantity })));
  const shown = (state: GameState) => journalCharacters(state, data).map(character => character.id);
  assert.deepEqual(shown(createGame(data)), data.characters.filter(character => !character.singleVisit && !character.arrivesAfter).map(character => character.id));
  const finished = checkpoint(data.tasks.length);
  assert.equal(status(finished, predecessor), 'locked');
  for (const id of ['ionatan', 'mina', 'avram']) assert.equal(shown(finished).includes(id), false);
});

test('Mina and Avram share one vegetarian, kosher-style quest after Ionatan, in act 2', () => {
  assert.equal(search.character, 'mina');
  assert.deepEqual(search.companions, ['avram']);
  assert.equal(predecessor, 'ionatan-castle-dinner');
  assert.deepEqual([search.afterTask, search.act], ['task_10', 2]);
  assert.deepEqual(search.requirements, [['vegetables_5', 2], ['vegetables_4', 2], ['dairy_4', 1], ['mixed_fruit-tea', 1]].map(([item, quantity]) => ({ item, quantity })));
  // Mina eats no meat or fish. Avram eats no pork, and keeps meat and dairy apart.
  const shared = data.quests.filter(quest => ['mina', 'avram'].some(id => quest.character === id || quest.companions?.includes(id)));
  assert.deepEqual(shared, [search]);
  for (const quest of shared) {
    assert.ok(!tags(quest).some(tag => ['meat', 'fish', 'pork'].includes(tag)), quest.id);
    assert.ok(!(tags(quest).includes('meat') && tags(quest).includes('dairy')), quest.id);
  }
  for (const id of ['ionatan', 'mina', 'avram']) assert.equal(data.characters.find(person => person.id === id)!.singleVisit, true);
  assert.equal(status(checkpoint(data.tasks.length), search.id), 'locked');
  // The news of the road comes three deliveries after their meal, and only local speakers tell it.
  const report = search.followUp!.dialogue.map(line => line.text).join(' ');
  assert.equal(search.followUp!.afterDeliveries, 3);
  assert.match(report, /gravely ill/);
  assert.ok(search.followUp!.dialogue.every(line => !['mina', 'avram', 'ionatan'].includes(line.speaker)));
});

test('guest metadata rejects broken companions, single visits, and news scenes', () => {
  const cases: [string, (content: GameData) => void][] = [
    ['companion is the character', content => { content.quests.find(quest => quest.id === search.id)!.companions = ['mina']; }],
    ['repeated companion', content => { content.quests.find(quest => quest.id === search.id)!.companions = ['avram', 'avram']; }],
    ['unknown companion', content => { content.quests.find(quest => quest.id === search.id)!.companions = ['nobody']; }],
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
