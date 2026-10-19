import test from 'node:test';
import assert from 'node:assert/strict';
import { arrivalScene, hasArrived, journalCharacters, resolveNeighbours, resolveQuests } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import { characterProblems, dataProblems } from '../src/content.ts';
import type { GameData } from '../src/model.ts';
import { checkpoint, data, payNext } from './support.ts';

const regulars = data.characters.filter(person => person.regular);

test('Dorian is a gentleman of leisure who sits for a portrait and entertains guests', () => {
  const person = data.characters.find(person => person.id === 'dorian')!;
  const quests = data.quests.filter(quest => quest.character === person.id);
  assert.equal(person.role, 'Gentleman of leisure');
  assert.match(person.introduction, /fortune.*fine suppers.*company/);
  assert.match(quests.find(quest => quest.id === 'dorian-sitting')!.opening[0].text, /artist has asked me to sit for a portrait/);
  assert.match(quests.find(quest => quest.id === 'dorian-gallery')!.opening[0].text, /gallery is showing my portrait/);
  assert.match(quests.find(quest => quest.id === 'dorian-sitter')!.opening[0].text, /invited me to a candlelit supper/);
});

test('twelve regulars arrive in pairs: four at the start, then with preparations 4, 8, and 12, and the nobles also with preparation 8', () => {
  assert.deepEqual(characterProblems(data), []);
  assert.deepEqual(regulars.map(person => person.id), ['vlad', 'elisabeta', 'dochia', 'victor', 'ana', 'costel', 'sanziana', 'dorian', 'ileana', 'cezar', 'catalina', 'bran']);
  const arrived = (count: number) => resolveNeighbours(checkpoint(count), data).filter(view => view.arrived && view.person.regular).map(view => view.person.id);
  assert.deepEqual(arrived(0), ['dochia', 'victor', 'ana', 'costel']);
  assert.deepEqual(arrived(3), ['dochia', 'victor', 'ana', 'costel']);
  assert.deepEqual(arrived(4), ['dochia', 'victor', 'ana', 'costel', 'sanziana', 'dorian']);
  assert.deepEqual(arrived(7).length, 6);
  assert.deepEqual(arrived(8).slice(-4), ['vlad', 'elisabeta', 'ileana', 'cezar']);
  assert.deepEqual(arrived(11).length, 10);
  assert.deepEqual(arrived(12).slice(-2), ['catalina', 'bran']);
  for (const person of regulars) {
    assert.equal(person.prefers!.length, 2);
    assert.ok(person.prefers!.every(chain => data.chains.some(known => known.id === chain)));
    assert.ok(person.introduction.length > 40);
  }
  const nobles = data.characters.filter(person => ['vlad', 'elisabeta'].includes(person.id));
  assert.ok(nobles.every(person => person.arrivesAfter === 'task_8' && person.prefers!.join() === 'warm,drinks'));
});

test('the preparation that brings a regular queues the arrival scene once, after its story scenes', () => {
  const before = checkpoint(3);
  const after = payNext(before);
  assert.deepEqual(after.pendingScenes, ['task_4', 'chapter-1', 'arrival-sanziana', 'arrival-dorian']);
  const read = reduceGame(after, { type: 'readScene', id: 'arrival-dorian' }, data);
  assert.equal(read.ok, true);
  assert.equal(read.state.pendingScenes.includes('arrival-dorian'), false);
  assert.equal(reduceGame(read.state, { type: 'readScene', id: 'arrival-dorian' }, data).ok, false, 'A read arrival cannot be read again as new.');
  for (const key of ['coins', 'taskIndex', 'board', 'completedQuests'] as const) assert.deepEqual(read.state[key], after[key]);
  assert.deepEqual(payNext(after).pendingScenes.slice(after.pendingScenes.length), ['task_5']);
  const nobles = payNext(checkpoint(7));
  assert.deepEqual(nobles.pendingScenes.slice(-6), ['task_8', 'chapter-2', 'arrival-vlad', 'arrival-elisabeta', 'arrival-ileana', 'arrival-cezar']);
});

test('a save cannot hold the arrival scene of a regular who has not arrived', () => {
  const state = checkpoint(4);
  assert.equal(validateGame(state, data), true);
  assert.equal(validateGame({ ...checkpoint(3), pendingScenes: ['arrival-sanziana'] }, data), false);
  assert.equal(validateGame({ ...state, pendingScenes: ['arrival-sanziana', 'arrival-sanziana'] }, data), false);
  assert.equal(validateGame({ ...state, pendingScenes: ['arrival-dochia'] }, data), false, 'A regular present from the start has no arrival scene.');
});

test('each regular asks only after arrival, and the journal shows only arrived neighbours', () => {
  for (const person of regulars) {
    const quests = data.quests.filter(quest => quest.character === person.id);
    assert.ok(quests.length >= 2, `${person.id} has quests.`);
    const arrival = person.arrivesAfter === undefined ? -1 : data.tasks.findIndex(task => task.id === person.arrivesAfter);
    for (const quest of quests) assert.ok(data.tasks.findIndex(task => task.id === quest.afterTask) >= arrival, `${quest.id} opens after ${person.id} arrives.`);
  }
  const before = checkpoint(7);
  assert.ok(resolveQuests(before, data).every(view => !['vlad', 'elisabeta'].includes(view.quest.character) || view.status === 'locked'));
  const after = payNext(before);
  assert.ok(resolveQuests(after, data).some(view => view.quest.character === 'vlad' && view.status !== 'locked'));
  const delivered = resolveNeighbours(checkpoint(24), data);
  assert.ok(delivered.every(view => view.arrived && view.delivered === data.quests.filter(quest => quest.character === view.person.id).length));
  const fresh = createGame(data);
  const shown = journalCharacters(fresh, data).map(person => person.id);
  assert.ok(shown.includes('dochia') && !shown.includes('sanziana') && !shown.includes('vlad'));
  assert.equal(hasArrived(fresh, data.characters.find(person => person.id === 'vlad')!), false);
  assert.equal(resolveNeighbours(fresh, data).filter(view => !view.arrived).length, 8);
});

test('the cast check rejects a bad arrival, liked chains, a missing scene, and a shared portrait cell', () => {
  const cases: [string, (content: GameData) => void][] = [
    ['unknown arrival', content => { content.characters.find(person => person.id === 'bran')!.arrivesAfter = 'task_99'; }],
    ['one liked chain', content => { content.characters.find(person => person.id === 'ana')!.prefers = ['warm']; }],
    ['the same chain twice', content => { content.characters.find(person => person.id === 'ana')!.prefers = ['warm', 'warm']; }],
    ['an unknown chain', content => { content.characters.find(person => person.id === 'ana')!.prefers = ['warm', 'soup']; }],
    ['a later arrival without a scene', content => { delete content.characters.find(person => person.id === 'cezar')!.arrival; }],
    ['an arrival scene without the regular', content => { content.characters.find(person => person.id === 'cezar')!.arrival = [{ speaker: 'sorin', text: 'Hello.' }]; }],
    ['a shared portrait cell', content => { content.characters.find(person => person.id === 'bran')!.sprite = 0; }],
    ['an unknown portrait atlas', content => { (content.characters.find(person => person.id === 'bran')! as { portraitAtlas: string }).portraitAtlas = 'regulars-9'; }],
  ];
  for (const [name, change] of cases) {
    const content = structuredClone(data);
    change(content);
    assert.ok(characterProblems(content).length, name);
    assert.ok(dataProblems(content).length, name);
  }
  assert.equal(arrivalScene({ id: 'bran' }), 'arrival-bran');
});

test('the data check rejects a regular quest before arrival or without a favourite dish', () => {
  const late = structuredClone(data);
  late.characters.find(person => person.id === 'sanziana')!.arrivesAfter = 'task_5';
  assert.match(dataProblems(late).join(' '), /character must arrive before the quest opens/);
  const favourites = structuredClone(data);
  favourites.characters.find(person => person.id === 'dochia')!.prefers = ['produce', 'sweet'];
  assert.match(dataProblems(favourites).join(' '), /regular needs a dish from a favourite chain/);
});
