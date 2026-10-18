import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, dataProblems, firstFreeBoardCell, reduceGame, requiredQuests, resolveChapters, resolveQuests, storyProblems, storyScenes, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const titles = ['Open the shutters', 'A kitchen for everyone', 'Around one table', 'The courtyard', 'Recipes to share', 'The first community supper'];
const boundaries = [4, 8, 12, 16, 20, 24];
function apply(state: GameState, action: Action, content = data) {
  const result = reduceGame(state, action, content);
  assert.equal(result.ok, true, result.message);
  assert.equal(validateGame(result.state, content), true, `Invalid state after ${action.type}`);
  return result.state;
}
function rejected(state: GameState, action: Action, content = data) {
  const before = JSON.stringify(state);
  const result = reduceGame(state, action, content);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result.state), before);
  return result;
}
/** The next preparation's exact cost, with every quest that it needs marked delivered. */
function ready(state: GameState, content = data) {
  const next = structuredClone(state);
  for (const quest of requiredQuests(next.taskIndex, content)) if (!next.completedQuests.includes(quest.id)) next.completedQuests.push(quest.id);
  next.coins = content.tasks[next.taskIndex].cost;
  return next;
}
/** A synthetic checkpoint after count payments, with every scene that the payments queued still waiting. */
function checkpoint(count: number, content = data) {
  let state = createGame(content);
  while (state.taskIndex < count) state = apply(ready(state, content), { type: 'task' }, content);
  return state;
}
/** The arrival scenes of the regulars that a preparation brings. */
const arrivals = (index: number) => data.characters.filter(person => person.arrival && person.arrivesAfter === data.tasks[index].id).map(person => `arrival-${person.id}`);
/**
 * The scenes that count payments queue: each preparation scene, then the closing scene of a complete chapter, then the finale,
 * then the arrivals of the regulars that the preparation brings.
 */
const queued = (count: number) => data.tasks.slice(0, count).flatMap((task, index) => [task.id, ...((index + 1) % 4 ? [] : [data.chapters[index / 4 | 0].id]),
  ...(index === data.tasks.length - 1 ? [data.finale.id] : []), ...arrivals(index)]);

test('six chapters keep their titles and cover all 24 preparations, each with a painted result', () => {
  assert.deepEqual(storyProblems(data), []);
  assert.deepEqual(data.chapters.map(chapter => chapter.title), titles);
  assert.deepEqual(data.chapters.map(chapter => chapter.id), titles.map((_, index) => `chapter-${index + 1}`));
  const covered = resolveChapters(createGame(data), data).flatMap(view => view.tasks.map(task => task.id));
  assert.deepEqual(covered, data.tasks.map(task => task.id));
  for (const view of resolveChapters(createGame(data), data)) {
    assert.equal(view.tasks.length, 4);
    for (const key of ['objective', 'opening', 'payoff'] as const) assert.ok(view.chapter[key].trim(), `${view.chapter.id} needs its ${key}.`);
    for (const task of view.tasks) assert.equal(data.rooms.filter(room => room.after === task.id).length, 1, `${task.id} needs one visible result.`);
  }
});

test('each chapter has a neighbour contribution that opens during it, and the four core characters all contribute and speak in the finale', () => {
  const characters = data.characters.filter(character => !character.visitor && !character.regular).map(character => character.id);
  assert.deepEqual(new Set(data.chapters.map(chapter => data.quests.find(quest => quest.id === chapter.contribution)!.character)), new Set(characters));
  assert.deepEqual(new Set(data.finale.dialogue.map(line => line.speaker)), new Set(characters));
  for (const [index, chapter] of data.chapters.entries()) {
    const quest = data.quests.find(value => value.id === chapter.contribution)!;
    const earlier = data.quests.filter(value => value.character === quest.character && data.quests.indexOf(value) < data.quests.indexOf(quest)).map(value => value.id);
    // With the neighbour's earlier requests delivered, the contribution is open before the chapter's last preparation.
    const open = [0, 1, 2, 3].filter(step => ['active', 'waiting'].includes(resolveQuests({ ...checkpoint(boundaries[index] - 4 + step), completedQuests: earlier }, data)
      .find(view => view.quest.id === quest.id)!.status));
    assert.ok(open.length, `${chapter.id}: its contribution must open during the chapter.`);
  }
});

test('story content checks reject missing scenes, invalid speakers, duplicate IDs, unknown or late contributions, and empty chapters', () => {
  const cases: [string, (content: GameData) => void, RegExp][] = [
    ['missing closing', content => { content.chapters[0].closing = []; }, /invalid closing scene/],
    ['invalid speaker', content => { content.chapters[1].closing[0].speaker = 'nobody'; }, /invalid closing scene/],
    ['blank line', content => { content.finale.dialogue[0].text = ' '; }, /finale has an invalid scene/],
    ['duplicate chapter', content => { content.chapters[1].id = 'chapter-1'; }, /stable and unique/],
    ['finale reuses a chapter ID', content => { content.finale.id = 'chapter-6'; }, /stable and unique/],
    ['unstable ID', content => { content.chapters[2].id = 'Chapter 3'; }, /stable and unique/],
    ['missing objective', content => { content.chapters[3].objective = ''; }, /needs its objective/],
    ['missing ending', content => { content.finale.ending = ''; }, /title and an ending/],
    ['unknown contribution', content => { content.chapters[0].contribution = 'absent'; }, /unknown neighbour contribution/],
    ['contribution after the chapter', content => { content.chapters[0].contribution = 'eszter-bowls'; }, /must open during the chapter/],
    ['contribution before the chapter', content => { content.chapters[5].contribution = 'ilie-counter'; }, /must open during the chapter/],
    ['finale without a character', content => { content.finale.dialogue = content.finale.dialogue.filter(line => line.speaker !== 'sorin'); }, /finale must include Sorin/],
    ['character without a contribution', content => { content.chapters[2].contribution = 'mara-table'; }, /Eszter needs a chapter contribution/],
    ['empty chapter', content => { content.tasks.slice(16, 20).forEach(task => { task.chapter = 4; }); }, /Chapter 5 has no preparation/],
    ['unknown chapter', content => { content.tasks[23].chapter = 7; }, /known chapter, in story order/],
    ['chapter out of order', content => { content.tasks[4].chapter = 1; content.tasks[3].chapter = 2; }, /known chapter, in story order/],
    ['missing finale', content => { delete (content as Partial<GameData>).finale; }, /chapters and a finale/],
    ['malformed chapter', content => { (content.chapters as unknown[])[0] = null; }, /Chapter 1 needs a record/],
  ];
  for (const [name, change, problem] of cases) {
    const content = structuredClone(data);
    change(content);
    assert.ok(storyProblems(content).some(value => problem.test(value)), `${name}: ${storyProblems(content).join(' ')}`);
    assert.ok(dataProblems(content).length, `${name} must stop the content.`);
  }
});

test('a chapter opens at its first preparation and completes only with its last one, at every chapter boundary', () => {
  for (const [index, boundary] of boundaries.entries()) {
    const before = checkpoint(boundary - 1);
    const chapters = resolveChapters(before, data);
    assert.equal(chapters[index].status, 'current');
    assert.equal(chapters[index].done, 3);
    assert.ok(chapters.slice(index + 1).every(view => view.status === 'locked'));
    assert.deepEqual(before.pendingScenes, queued(boundary - 1));
    const after = apply(ready(before), { type: 'task' });
    assert.equal(resolveChapters(after, data)[index].status, 'complete');
    assert.deepEqual(after.pendingScenes, [...before.pendingScenes, data.tasks[boundary - 1].id, data.chapters[index].id, ...(boundary === 24 ? [data.finale.id] : []), ...arrivals(boundary - 1)]);
    if (boundary < 24) {
      assert.equal(resolveChapters(after, data)[index + 1].status, 'current');
      assert.equal(resolveChapters(after, data)[index + 1].done, 0);
      // The next preparation never waits for the closing scene. It queues only its own scene.
      const next = apply(ready(after), { type: 'task' });
      assert.deepEqual(next.pendingScenes, [...after.pendingScenes, data.tasks[boundary].id, ...arrivals(boundary)]);
    }
  }
});

test('a failed payment, a missing required quest, or a full destination completes no chapter and queues no scene', () => {
  const before = ready(checkpoint(3));
  rejected({ ...before, coins: before.coins - 1 }, { type: 'task' });
  const missing = { ...before, completedQuests: before.completedQuests.slice(0, -1) };
  assert.equal(validateGame(missing, data), true);
  assert.match(rejected(missing, { type: 'task' }).message, /Deliver 1 more quest for this preparation\./);
  // The last preparation of the chapter brings a source here, so it needs a board space.
  const placed = structuredClone(data);
  delete placed.tasks[2].unlock;
  placed.tasks[3].unlock = 'sweet';
  let full = checkpoint(3, placed);
  const source = full.board.findIndex(cell => cell?.code === 'generator_bakery');
  while (firstFreeBoardCell(full, placed) !== -1) full = apply(full, { type: 'spawn', index: source }, placed);
  full = ready(full, placed);
  assert.match(rejected(full, { type: 'task' }, placed).message, /Free a space/);
  assert.equal(resolveChapters(full, placed)[0].status, 'current');
});

test('the last preparation queues its scene, the chapter scene, and the finale once, with no second charge or reward', () => {
  const before = ready(checkpoint(23));
  const after = apply(before, { type: 'task' });
  assert.deepEqual(after.pendingScenes.slice(-3), [data.tasks[23].id, 'chapter-6', 'finale']);
  assert.equal(after.coins, before.coins - data.tasks[23].cost);
  assert.match(rejected(after, { type: 'task' }).message, /community supper is ready/);
  const read = apply(apply(after, { type: 'readScene', id: 'chapter-6' }), { type: 'readScene', id: 'finale' });
  assert.deepEqual(read.pendingScenes, queued(24).filter(id => !['chapter-6', 'finale'].includes(id)));
  for (const key of ['coins', 'taskIndex', 'board', 'completedQuests', 'decorations'] as const) {
    assert.deepEqual(read[key], after[key], `Reading a scene must not change ${key}.`);
  }
  // Repeated, stale, and unknown reading events change nothing.
  rejected(read, { type: 'readScene', id: 'finale' });
  rejected(read, { type: 'readScene', id: 'unknown' });
  rejected(read, { type: 'readScene', id: undefined as unknown as string });
});

test('the finale needs every quest, leaves no ticket, and keeps the board playable', () => {
  const before = ready(checkpoint(23));
  assert.deepEqual(new Set(before.completedQuests), new Set(data.quests.map(quest => quest.id)), 'Every quest is required before the finale.');
  for (const quest of data.quests) rejected({ ...before, completedQuests: before.completedQuests.filter(id => id !== quest.id) }, { type: 'task' });
  let state = apply(apply(before, { type: 'task' }), { type: 'readScene', id: 'finale' });
  assert.ok(resolveQuests(state, data).every(view => view.status === 'complete'));
  const source = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  state = apply(state, { type: 'spawn', index: source });
  assert.deepEqual(state.pendingScenes, queued(24).filter(id => id !== 'finale'));
});

test('saved scene queues hold only earned scenes, once each, in story order', () => {
  const middle = checkpoint(12);
  assert.deepEqual(storyScenes(data), [...data.tasks.map(task => task.id), ...data.quests.map(quest => quest.id), ...data.chapters.map(chapter => chapter.id), 'finale', 'mina-avram-news',
    ...data.characters.flatMap(person => person.arrival ? [`arrival-${person.id}`] : [])]);
  const quest = data.quests.find(value => middle.completedQuests.includes(value.id))!;
  const undelivered = data.quests.find(value => !middle.completedQuests.includes(value.id))!;
  for (const pendingScenes of [[], ['chapter-1'], ['chapter-3'], ['chapter-1', 'chapter-2', 'chapter-3'], ['task_1', 'chapter-1', 'task_12'], ['task_4', 'task_9', 'chapter-3'], queued(12)]) {
    assert.equal(validateGame({ ...middle, pendingScenes }, data), true, JSON.stringify(pendingScenes));
  }
  // A quest scene may wait at any position.
  for (const pendingScenes of [[quest.id], [quest.id, 'task_1'], ['task_1', quest.id, 'chapter-1'], [...queued(12), quest.id]]) assert.equal(validateGame({ ...middle, pendingScenes }, data), true);
  for (const pendingScenes of [['chapter-4'], ['finale'], ['chapter-2', 'chapter-1'], ['chapter-1', 'chapter-1'], ['unknown'], [null], [1], 'chapter-1', null,
    ['task_13'], ['chapter-1', 'task_4'], ['task_2', 'task_1'], ['task_1', 'task_1'], [undelivered.id], ['mina-avram-news']]) {
    assert.equal(validateGame({ ...middle, pendingScenes }, data), false, JSON.stringify(pendingScenes));
  }
  const { pendingScenes: _scenes, ...missing } = middle;
  assert.equal(validateGame(missing, data), false);
  const finished = checkpoint(24);
  assert.equal(validateGame({ ...finished, pendingScenes: ['finale'] }, data), true);
  assert.equal(validateGame({ ...finished, pendingScenes: ['finale', 'chapter-6'] }, data), false);
  assert.equal(validateGame({ ...finished, pendingScenes: ['finale', 'task_24'] }, data), false);
});

test('scene IDs must be unique across preparations, quests, local news, chapters, and the finale', () => {
  const news = data.quests.find(quest => quest.followUp)!;
  const cases: [string, (content: GameData) => void][] = [
    ['chapter reuses a preparation ID', content => { content.chapters[0].id = content.tasks[0].id; }],
    ['finale reuses a quest ID', content => { content.finale.id = content.quests[0].id; }],
    ['news reuses a preparation ID', content => { content.quests.find(quest => quest.id === news.id)!.followUp!.id = content.tasks[3].id; }],
    ['news reuses a quest ID', content => { content.quests.find(quest => quest.id === news.id)!.followUp!.id = content.quests[1].id; }],
  ];
  for (const [name, change] of cases) {
    const content = structuredClone(data);
    change(content);
    assert.ok(storyProblems(content).some(problem => /Story scene IDs must be unique/.test(problem)), `${name}: ${storyProblems(content).join(' ')}`);
  }
});

test('a payment queues its preparation scene in the same change, and reading it changes nothing else', () => {
  const before = ready(checkpoint(1));
  const after = apply(before, { type: 'task' });
  assert.deepEqual(after.pendingScenes, [...before.pendingScenes, data.tasks[1].id]);
  // Reading the preparation scene changes nothing else, and a second read changes nothing.
  const read = apply(after, { type: 'readScene', id: data.tasks[1].id });
  assert.deepEqual({ ...read, pendingScenes: after.pendingScenes }, after);
  rejected(read, { type: 'readScene', id: data.tasks[1].id });
});

test('sceneLine records the line of a waiting scene from the first to the last line, and readScene removes it', () => {
  const state = checkpoint(4), id = data.tasks[3].id, last = data.tasks[3].dialogue.length - 1;
  assert.equal(Object.hasOwn(state, 'sceneLines'), false);
  const second = apply(state, { type: 'sceneLine', id, line: 1 });
  assert.deepEqual(second.sceneLines, { [id]: 1 });
  const end = apply(second, { type: 'sceneLine', id, line: last });
  assert.deepEqual(end.sceneLines, { [id]: last });
  // The first line needs no record.
  const first = apply(end, { type: 'sceneLine', id, line: 0 });
  assert.equal(Object.hasOwn(first, 'sceneLines'), false);
  assert.deepEqual(first, state);
  // A different waiting scene keeps its own line.
  const both = apply(end, { type: 'sceneLine', id: 'chapter-1', line: 2 });
  assert.deepEqual(both.sceneLines, { [id]: last, 'chapter-1': 2 });
  for (const key of ['coins', 'taskIndex', 'board', 'pendingScenes', 'completedQuests'] as const) {
    assert.deepEqual(both[key], state[key], `A line must not change ${key}.`);
  }
  const read = apply(both, { type: 'readScene', id });
  assert.deepEqual(read.sceneLines, { 'chapter-1': 2 });
  assert.equal(Object.hasOwn(apply(read, { type: 'readScene', id: 'chapter-1' }), 'sceneLines'), false);
  // Stale, unknown, and out-of-range lines change nothing.
  rejected(read, { type: 'sceneLine', id, line: 1 });
  rejected(both, { type: 'sceneLine', id, line: last + 1 });
  rejected(both, { type: 'sceneLine', id, line: -1 });
  rejected(both, { type: 'sceneLine', id, line: 1.5 });
  rejected(both, { type: 'sceneLine', id, line: '1' as unknown as number });
  rejected(both, { type: 'sceneLine', id: 'chapter-2', line: 1 });
  rejected(both, { type: 'sceneLine', id: 'unknown', line: 1 });
  rejected(both, { type: 'sceneLine', id: undefined as unknown as string, line: 1 });
});

test('saved lines must be a plain record of waiting scenes with lines after the first line', () => {
  const state = checkpoint(4), id = data.tasks[3].id;
  for (const sceneLines of [{}, { [id]: 1 }, { [id]: 2, 'chapter-1': 1 }, { [id]: 99 }]) assert.equal(validateGame({ ...state, sceneLines }, data), true, JSON.stringify(sceneLines));
  for (const sceneLines of [null, [], 'task_4', 3, { [id]: 0 }, { [id]: -1 }, { [id]: 1.5 }, { [id]: '1' }, { [id]: null }, { 'chapter-2': 1 }, { unknown: 1 },
    { [id]: Number.MAX_SAFE_INTEGER + 1 }]) {
    assert.equal(validateGame({ ...state, sceneLines }, data), false, JSON.stringify(sceneLines));
  }
  // A line of a read scene is not kept.
  assert.equal(validateGame({ ...state, pendingScenes: state.pendingScenes.filter(value => value !== id), sceneLines: { [id]: 1 } }, data), false);
});
