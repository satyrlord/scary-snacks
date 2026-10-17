import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, dataProblems, firstFreeBoardCell, reduceGame, resolveChapters, resolveQuests, storyProblems, storyScenes, validateGame } from '../src/engine.ts';
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
/** A synthetic checkpoint: the coins and counters of the next preparation, with every earlier scene still waiting. */
function checkpoint(count: number, content = data) {
  let state = createGame(content);
  for (let index = 0; index < count; index++) {
    Object.assign(state, content.tasks[index].goals, { coins: content.tasks[index].cost });
    state = apply(state, { type: 'task' }, content);
  }
  return state;
}
const ready = (state: GameState) => Object.assign(structuredClone(state), data.tasks[state.taskIndex].goals, { coins: data.tasks[state.taskIndex].cost });

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
  const characters = data.characters.filter(character => !character.visitor).map(character => character.id);
  assert.deepEqual(new Set(data.chapters.map(chapter => data.quests.find(quest => quest.id === chapter.contribution)!.character)), new Set(characters));
  assert.deepEqual(new Set(data.finale.dialogue.map(line => line.speaker)), new Set(characters));
  for (const [index, chapter] of data.chapters.entries()) {
    const quest = data.quests.find(value => value.id === chapter.contribution)!;
    const earlier = data.quests.filter(value => value.character === quest.character && data.quests.indexOf(value) < data.quests.indexOf(quest)).map(value => value.id);
    // With the neighbour's earlier requests delivered, the contribution is active before the chapter's last preparation.
    const open = [0, 1, 2, 3].filter(step => resolveQuests({ ...checkpoint(boundaries[index] - 4 + step), completedQuests: earlier }, data)
      .find(view => view.quest.id === quest.id)!.status === 'active');
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
    ['optional producer contribution', content => { content.chapters[4].contribution = 'ilie-bread-tasting'; }, /unknown neighbour contribution/],
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
    assert.deepEqual(before.pendingScenes, data.chapters.slice(0, index).map(chapter => chapter.id));
    const after = apply(ready(before), { type: 'task' });
    assert.equal(resolveChapters(after, data)[index].status, 'complete');
    assert.deepEqual(after.pendingScenes, [...before.pendingScenes, data.chapters[index].id, ...(boundary === 24 ? [data.finale.id] : [])]);
    if (boundary < 24) {
      assert.equal(resolveChapters(after, data)[index + 1].status, 'current');
      assert.equal(resolveChapters(after, data)[index + 1].done, 0);
      // The next preparation never waits for the closing scene.
      const next = apply(ready(after), { type: 'task' });
      assert.deepEqual(next.pendingScenes, after.pendingScenes);
    }
  }
});

test('a failed payment, missing goals, a missing required quest, or a full destination completes no chapter and queues no scene', () => {
  const before = ready(checkpoint(3));
  rejected({ ...before, coins: before.coins - 1 }, { type: 'task' });
  rejected({ ...before, served: before.served - 1 }, { type: 'task' });
  rejected({ ...before, merges: before.merges - 1 }, { type: 'task' });
  const gated = structuredClone(data);
  gated.tasks[3].requiresQuest = 'ilie-counter';
  assert.deepEqual(dataProblems(gated), []);
  rejected(before, { type: 'task' }, gated);
  // The last preparation of the chapter brings a source here, so it needs a board space.
  const placed = structuredClone(data);
  delete placed.tasks[2].unlock;
  placed.tasks[3].unlock = 'sweet';
  let full = checkpoint(3, placed);
  const source = full.board.findIndex(cell => cell?.code === 'generator_bakery');
  while (firstFreeBoardCell(full, placed) !== -1) full = apply(full, { type: 'spawn', index: source }, placed);
  Object.assign(full, placed.tasks[3].goals, { coins: placed.tasks[3].cost });
  assert.match(rejected(full, { type: 'task' }, placed).message, /Free a space/);
  assert.equal(resolveChapters(full, placed)[0].status, 'current');
});

test('the last preparation queues the finale once after the chapter scene, with no second charge or reward', () => {
  const before = ready(checkpoint(23));
  const after = apply(before, { type: 'task' });
  assert.deepEqual(after.pendingScenes.slice(-2), ['chapter-6', 'finale']);
  assert.equal(after.coins, before.coins - data.tasks[23].cost);
  assert.equal(after.xp, before.xp + 20);
  assert.match(rejected(after, { type: 'task' }).message, /community supper is ready/);
  const read = apply(apply(after, { type: 'readScene', id: 'chapter-6' }), { type: 'readScene', id: 'finale' });
  assert.deepEqual(read.pendingScenes, data.chapters.slice(0, 5).map(chapter => chapter.id));
  for (const key of ['coins', 'xp', 'served', 'merges', 'taskIndex', 'seed', 'board', 'orders', 'completedQuests', 'claimedLevelRewards'] as const) {
    assert.deepEqual(read[key], after[key], `Reading a scene must not change ${key}.`);
  }
  // Repeated, stale, and unknown reading events change nothing.
  rejected(read, { type: 'readScene', id: 'finale' });
  rejected(read, { type: 'readScene', id: 'unknown' });
  rejected(read, { type: 'readScene', id: undefined as unknown as string });
});

test('ordinary orders stay playable after the finale', () => {
  let state = apply(apply(ready(checkpoint(23)), { type: 'task' }), { type: 'readScene', id: 'finale' });
  for (let turn = 0; turn < 3; turn++) {
    const order = state.orders[0];
    const supplied = structuredClone(state);
    for (const code of order.requirements) {
      supplied.board[firstFreeBoardCell(supplied, data)] = { code };
      if (!supplied.discovered.includes(code)) supplied.discovered.push(code);
    }
    const served = apply(supplied, { type: 'serve', id: order.id });
    assert.equal(served.served, state.served + 1);
    assert.equal(served.orders.length, 3);
    state = served;
  }
  assert.deepEqual(state.pendingScenes, data.chapters.map(chapter => chapter.id));
});

test('saved scene queues hold only earned scenes, once each, in story order', () => {
  const middle = checkpoint(12);
  assert.deepEqual(storyScenes(data), [...data.chapters.map(chapter => chapter.id), 'finale']);
  for (const pendingScenes of [[], ['chapter-1'], ['chapter-3'], ['chapter-1', 'chapter-2', 'chapter-3']]) assert.equal(validateGame({ ...middle, pendingScenes }, data), true);
  for (const pendingScenes of [['chapter-4'], ['finale'], ['chapter-2', 'chapter-1'], ['chapter-1', 'chapter-1'], ['unknown'], [null], 'chapter-1', null]) {
    assert.equal(validateGame({ ...middle, pendingScenes }, data), false, JSON.stringify(pendingScenes));
  }
  const { pendingScenes: _scenes, ...missing } = middle;
  assert.equal(validateGame(missing, data), false);
  const finished = checkpoint(24);
  assert.equal(validateGame({ ...finished, pendingScenes: ['finale'] }, data), true);
  assert.equal(validateGame({ ...finished, pendingScenes: ['finale', 'chapter-6'] }, data), false);
});
