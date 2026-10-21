import test from 'node:test';
import assert from 'node:assert/strict';
import { arrivalScene, availableChains, dishOpen, hasArrived, journalCharacters, requiredQuests, resolveNeighbours, resolveQuests } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import { characterProblems, dataProblems } from '../src/content.ts';
import type { GameData, Quest } from '../src/model.ts';
import { checkpoint, data, payNext, tags } from './support.ts';

const regulars = data.characters.filter(person => person.regular);
/** The preparations paid before a quest opens: 0 for a quest of a new game. */
const window = (quest: Quest) => quest.afterTask === null ? 0 : data.tasks.findIndex(task => task.id === quest.afterTask) + 1;

test('Dorian is a gentleman of leisure who sits for a portrait and entertains guests', () => {
  const person = data.characters.find(person => person.id === 'dorian')!;
  const quests = data.quests.filter(quest => quest.character === person.id);
  assert.equal(person.role, 'Gentleman of leisure');
  assert.match(person.introduction, /fortune.*fine suppers.*company/);
  assert.match(quests.find(quest => quest.id === 'dorian-sitting')!.opening[0].text, /artist has asked me to sit for a portrait/);
  assert.match(quests.find(quest => quest.id === 'dorian-gallery')!.opening[0].text, /gallery is showing my portrait/);
  assert.match(quests.find(quest => quest.id === 'dorian-sitter')!.opening[0].text, /invited me to a candlelit supper/);
});

test('thirteen regulars: five at the start, then pairs with preparations 4, 8, and 12, and the nobles also with preparation 8', () => {
  assert.deepEqual(characterProblems(data), []);
  assert.deepEqual(regulars.map(person => person.id), ['vlad', 'elisabeta', 'dochia', 'victor', 'ana', 'costel', 'bela', 'sanziana', 'dorian', 'ileana', 'cezar', 'catalina', 'bran']);
  const arrived = (count: number) => resolveNeighbours(checkpoint(count), data).filter(view => view.arrived && view.person.regular).map(view => view.person.id);
  assert.deepEqual(arrived(0), ['dochia', 'victor', 'ana', 'costel', 'bela']);
  assert.deepEqual(arrived(3), ['dochia', 'victor', 'ana', 'costel', 'bela']);
  assert.deepEqual(arrived(4), ['dochia', 'victor', 'ana', 'costel', 'bela', 'sanziana', 'dorian']);
  assert.deepEqual(arrived(7).length, 7);
  assert.deepEqual(arrived(8).slice(-4), ['vlad', 'elisabeta', 'ileana', 'cezar']);
  assert.deepEqual(arrived(11).length, 11);
  assert.deepEqual(arrived(12).slice(-2), ['catalina', 'bran']);
  for (const person of regulars) assert.ok(person.introduction.length > 40);
  const nobles = data.characters.filter(person => ['vlad', 'elisabeta'].includes(person.id));
  assert.ok(nobles.every(person => person.arrivesAfter === 'task_8' && person.favourites!.includes('fruits_5') && person.diet?.require?.item === 'fruits_5'));
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
    // Bela, the graveyard keeper, has one campaign quest.
    assert.ok(person.id === 'bela' ? quests.length === 1 : quests.length >= 2, `${person.id} has quests.`);
    const arrival = person.arrivesAfter === undefined ? -1 : data.tasks.findIndex(task => task.id === person.arrivesAfter);
    for (const quest of quests) assert.ok(data.tasks.findIndex(task => task.id === quest.afterTask) >= arrival, `${quest.id} opens after ${person.id} arrives.`);
  }
  const before = checkpoint(7);
  assert.ok(resolveQuests(before, data).every(view => !['vlad', 'elisabeta'].includes(view.quest.character) || view.status === 'locked'));
  const after = payNext(before);
  assert.ok(resolveQuests(after, data).some(view => view.quest.character === 'vlad' && view.status !== 'locked'));
  const delivered = resolveNeighbours(checkpoint(24), data);
  assert.ok(delivered.every(view => view.arrived && view.delivered === requiredQuests(data.tasks.length, data).filter(quest => quest.character === view.person.id).length));
  const fresh = createGame(data);
  const shown = journalCharacters(fresh, data).map(person => person.id);
  assert.ok(shown.includes('dochia') && !shown.includes('sanziana') && !shown.includes('vlad'));
  assert.equal(hasArrived(fresh, data.characters.find(person => person.id === 'vlad')!), false);
  assert.equal(resolveNeighbours(fresh, data).filter(view => !view.arrived).length, 8);
});

test('the cast check rejects a bad arrival, bad favourite dishes, bad diets, a missing scene, and a shared portrait cell', () => {
  const ana = (content: GameData) => content.characters.find(person => person.id === 'ana')!;
  const cases: [string, (content: GameData) => void][] = [
    ['unknown arrival', content => { content.characters.find(person => person.id === 'bran')!.arrivesAfter = 'task_99'; }],
    ['one favourite dish', content => { ana(content).favourites = ['herbs_4']; }],
    ['four favourite dishes', content => { ana(content).favourites = ['herbs_4', 'grain_4', 'mixed_chicken-noodle-soup', 'grain_5']; }],
    ['the same dish twice', content => { ana(content).favourites = ['herbs_4', 'herbs_4']; }],
    ['an unknown dish', content => { ana(content).favourites = ['herbs_4', 'soup']; }],
    ['a source as a favourite', content => { ana(content).favourites = ['herbs_4', 'generator_herbs']; }],
    ['a liked chain', content => { ana(content).favourites = ['herbs', 'grain']; }],
    ['a regular without favourite dishes', content => { delete ana(content).favourites; }],
    ['favourite dishes of a core character', content => { content.characters.find(person => person.id === 'mara')!.favourites = ['herbs_4', 'grain_4']; }],
    ['an unknown diet tag', content => { content.characters.find(person => person.id === 'catalina')!.diet!.forbid = ['meat', 'nuts' as 'meat']; }],
    ['a diet that requires an unknown dish', content => { content.characters.find(person => person.id === 'vlad')!.diet!.require!.item = 'absent'; }],
    ['a diet that keeps one tag apart from itself', content => { content.characters.find(person => person.id === 'avram')!.diet!.apart = ['meat', 'meat']; }],
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

test('the data check rejects a regular quest before its character arrives', () => {
  const late = structuredClone(data);
  late.characters.find(person => person.id === 'sanziana')!.arrivesAfter = 'task_5';
  assert.match(dataProblems(late).join(' '), /character must arrive before the quest opens/);
});

test('each regular has two or three favourite dishes, asks for one in each quest, and has one open at the window of each quest', () => {
  for (const person of regulars) {
    const favourites = person.favourites!;
    assert.ok(favourites.length >= 2 && favourites.length <= 3, person.id);
    assert.equal(new Set(favourites).size, favourites.length, person.id);
    assert.ok(favourites.every(code => data.items[code] && !data.items[code].generator), person.id);
    for (const quest of data.quests.filter(quest => quest.character === person.id)) {
      assert.ok(quest.requirements.some(({ item }) => favourites.includes(item)), `${quest.id} asks for a favourite dish.`);
      const chains = availableChains({ taskIndex: window(quest) }, data);
      assert.ok(favourites.some(code => dishOpen(code, chains, data)), `${person.id} has a favourite dish open when ${quest.id} opens.`);
    }
  }
});

test('every quest of Vlad and Elisabeta has red wine and a meat dish and no garlic, and every quest of Cătălina keeps her fast', () => {
  for (const id of ['vlad', 'elisabeta']) {
    const quests = data.quests.filter(quest => quest.character === id);
    assert.ok(quests.length >= 2, id);
    for (const quest of quests) {
      assert.ok(quest.requirements.some(({ item }) => item === 'fruits_5'), `${quest.id} has red wine.`);
      assert.ok(tags(quest).includes('meat'), `${quest.id} has a meat dish.`);
      assert.ok(!tags(quest).includes('garlic'), `${quest.id} has no garlic.`);
    }
  }
  const fast = data.quests.filter(quest => quest.character === 'catalina' || quest.companions?.includes('catalina'));
  assert.ok(fast.length >= 2);
  // Fish is allowed in her fast.
  for (const quest of fast) assert.ok(!tags(quest).some(tag => ['meat', 'dairy', 'egg'].includes(tag)), quest.id);
});
