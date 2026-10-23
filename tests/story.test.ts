import test from 'node:test';
import assert from 'node:assert/strict';
import { availableChains, firstFreeBoardCell, requiredQuests, resolveChapters, resolveQuests, storyScenes, supperComplete, supperQuest } from '../src/model.ts';
import { reduceGame, validateGame } from '../src/engine.ts';
import { dataProblems, storyProblems } from '../src/content.ts';
import type { GameData } from '../src/model.ts';
import { actOne, act, actOneTasks, data, deliver, payNext, prologueServed, ready, rejected, status, supperEvening, withTickets } from './support.ts';

const titles = ['Open the shutters', 'A kitchen for everyone', 'Around one table', 'The courtyard', 'Recipes to share', 'The first community supper',
  'A kitchen outside', 'Beds and benches', 'The summer festival', 'A guest who snores', 'The missing page', 'What the family owes'];
const ids = [...titles.slice(0, 6).map((_, index) => `chapter-${index + 1}`), ...titles.slice(6).map((_, index) => `act2-chapter-${index + 1}`)];
/** The number of payments that complete each chapter. The purchase of act 2 belongs to no chapter. */
const boundaries = titles.map((_, index) => 4 * (index + 1));
const preparations = data.tasks.filter(task => !task.purchase);
/** A synthetic checkpoint after count payments, with every scene that the payments queued still waiting. */
function checkpoint(count: number, content = data) {
  let state = actOne(content);
  while (state.taskIndex < count) state = payNext(state, content);
  return state;
}
/** The arrival scenes of the regulars that a preparation brings. */
const arrivals = (index: number) => data.characters.filter(person => person.arrival && person.arrivesAfter === data.tasks[index].id).map(person => `arrival-${person.id}`);
/**
 * The scenes that count payments queue: each preparation scene, then the closing scene of a complete chapter,
 * then the arrivals of the regulars that the preparation brings.
 */
const queued = (count: number) => data.tasks.slice(0, count).flatMap((task, index) => [task.id, ...((index + 1) % 4 ? [] : [data.chapters[index / 4 | 0].id]), ...arrivals(index)]);

for (const [id, food] of [
  ['mara-supper', /\bbread\b/i], ['sorin-welcome', /\btea\b/i], ['eszter-cups', /\btea\b/i], ['dochia-lunch', /\bcheese\b/i],
] as const) {
  test(`${id} does not request or report food absent from its delivery`, () => {
    const quest = data.quests.find(quest => quest.id === id)!;
    const supplied = quest.requirements.some(({ item }) => food.test(data.items[item].name));
    if (!supplied) assert.doesNotMatch([...quest.opening, ...quest.completion].map(line => line.text).join(' '), food);
  });
}

test('Janos reports the archbishop eating a dish from Monica’s preceding delivery', () => {
  const previous = data.quests.find(quest => quest.id === 'monica-third-pack')!;
  const next = data.quests.find(quest => quest.id === 'janos-third-pack')!;
  const report = next.opening[0].text.toLowerCase();
  const named = Object.values(data.items).filter(item => !item.generator && report.includes(item.name.toLowerCase()));
  const mentioned = named.filter(item => !named.some(other => other !== item && other.name.toLowerCase().includes(item.name.toLowerCase())));
  assert.ok(mentioned.length, 'The report names the dish that the archbishop ate.');
  for (const item of mentioned) assert.ok(previous.requirements.some(requirement => requirement.item === item.id), `${item.name} was in the preceding pack.`);
});

test('twelve chapters, six in each act, keep their titles and cover all 48 preparations, each with a painted result', () => {
  assert.deepEqual(storyProblems(data), []);
  assert.deepEqual(data.chapters.map(chapter => chapter.title), titles);
  assert.deepEqual(data.chapters.map(chapter => chapter.id), ids);
  assert.deepEqual(data.chapters.map(chapter => chapter.act), titles.map((_, index) => index < 6 ? 1 : 2));
  const covered = resolveChapters(actOne(), data).flatMap(view => view.tasks.map(task => task.id));
  assert.deepEqual(covered, preparations.map(task => task.id));
  for (const view of resolveChapters(actOne(), data)) {
    assert.equal(view.tasks.length, 4);
    for (const key of ['objective', 'opening', 'payoff'] as const) assert.ok(view.chapter[key].trim(), `${view.chapter.id} needs its ${key}.`);
    for (const task of view.tasks) assert.equal(data.rooms.filter(room => room.after === task.id).length, 1, `${task.id} needs one visible result.`);
  }
});

test('each chapter has a neighbour contribution that opens during it, and the four core characters all contribute and speak in the finale', () => {
  const characters = data.characters.filter(character => !character.visitor && !character.regular && !character.family).map(character => character.id);
  assert.deepEqual(new Set(data.chapters.map(chapter => data.quests.find(quest => quest.id === chapter.contribution)!.character)), new Set(characters));
  for (const finale of data.finales) for (const character of characters) assert.ok(finale.dialogue.some(line => line.speaker === character), `${finale.id}: ${character}`);
  for (const [index, chapter] of data.chapters.entries()) {
    const quest = data.quests.find(value => value.id === chapter.contribution)!;
    const earlier = data.quests.filter(value => value.character === quest.character && data.quests.indexOf(value) < data.quests.indexOf(quest)).map(value => value.id);
    // With the neighbour's earlier quests delivered, the contribution is open before the chapter's last preparation.
    const open = [0, 1, 2, 3].filter(step => ['active', 'waiting'].includes(resolveQuests({ ...checkpoint(boundaries[index] - 4 + step), completedQuests: earlier }, data)
      .find(view => view.quest.id === quest.id)!.status));
    assert.ok(open.length, `${chapter.id}: its contribution must open during the chapter.`);
  }
});

test('story content checks reject missing scenes, invalid speakers, duplicate IDs, unknown or late contributions, and empty chapters', () => {
  const cases: [string, (content: GameData) => void, RegExp][] = [
    ['missing closing', content => { content.chapters[0].closing = []; }, /invalid closing scene/],
    ['invalid speaker', content => { content.chapters[1].closing[0].speaker = 'nobody'; }, /invalid closing scene/],
    ['blank line', content => { content.finales[0].dialogue[0].text = ' '; }, /finale: invalid scene/],
    ['duplicate chapter', content => { content.chapters[1].id = 'chapter-1'; }, /stable and unique/],
    ['finale reuses a chapter ID', content => { content.finales[1].id = 'chapter-6'; }, /stable and unique/],
    ['unstable ID', content => { content.chapters[2].id = 'Chapter 3'; }, /stable and unique/],
    ['missing objective', content => { content.chapters[3].objective = ''; }, /needs its objective/],
    ['missing ending', content => { content.finales[1].ending = ''; }, /title and an ending/],
    ['unknown contribution', content => { content.chapters[0].contribution = 'absent'; }, /unknown neighbour contribution/],
    ['contribution after the chapter', content => { content.chapters[0].contribution = 'eszter-bowls'; }, /must open during the chapter/],
    ['contribution before the chapter', content => { content.chapters[5].contribution = 'ilie-counter'; }, /must open during the chapter/],
    ['finale without a character', content => { content.finales[1].dialogue = content.finales[1].dialogue.filter(line => line.speaker !== 'sorin'); }, /finale-act-2 must include Sorin/],
    ['character without a contribution', content => { content.chapters[2].contribution = 'mara-table'; }, /Eszter needs a chapter contribution in act 1/],
    ['character without a contribution in act 2', content => { content.chapters[6].contribution = 'sorin-creaking-orchard'; content.chapters[10].contribution = 'mara-missing-page'; }, /Eszter needs a chapter contribution in act 2/],
    ['finale on a day of another act', content => { content.finales[1].day = content.finales[0].day; }, /finale-act-2: needs a day of its act/],
    ['finale painting in an area of another act', content => { content.finales[1].painting.area = content.finales[0].painting.area; }, /needs a painting of an area of its act/],
    ['chapter in an earlier act after a later one', content => { content.chapters[7].act = 1; }, /needs an act, in story order/],
    ['empty chapter', content => { content.tasks.slice(16, 20).forEach(task => { task.chapter = 4; }); }, /Chapter 5 has no preparation/],
    ['unknown chapter', content => { content.tasks[47].chapter = 13; }, /known chapter, in story order/],
    ['chapter out of order', content => { content.tasks[4].chapter = 1; content.tasks[3].chapter = 2; }, /known chapter, in story order/],
    ['missing finale', content => { content.finales.pop(); }, /one finale for each act/],
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
    const after = payNext(before);
    assert.equal(resolveChapters(after, data)[index].status, 'complete');
    assert.deepEqual(after.pendingScenes, [...before.pendingScenes, data.tasks[boundary - 1].id, data.chapters[index].id, ...arrivals(boundary - 1)]);
    if (boundary < preparations.length) {
      assert.equal(resolveChapters(after, data)[index + 1].status, 'current');
      assert.equal(resolveChapters(after, data)[index + 1].done, 0);
      // The next preparation never waits for the closing scene. It queues only its own scene.
      const next = payNext(after);
      assert.deepEqual(next.pendingScenes, [...after.pendingScenes, data.tasks[boundary].id, ...arrivals(boundary)]);
    }
  }
});

test('a failed payment or a missing required quest completes no chapter and queues no scene, and a full board does not stop a new source', () => {
  const before = ready(checkpoint(3));
  rejected({ ...before, coins: before.coins - 1 }, { type: 'task' });
  const missing = withTickets({ ...before, completedQuests: before.completedQuests.slice(0, -1), discovered: [...before.discovered] });
  assert.equal(validateGame(missing, data), true);
  assert.match(rejected(missing, { type: 'task' }).message, /Deliver 1 more quest for this preparation\./);
  // The last preparation of chapter 2 brings the Butcher’s hook. The source joins the end of the source tab, so a full board takes it.
  assert.equal(data.tasks[7].unlock, 'pork');
  let full = checkpoint(7);
  // The Herb basket is free, so an empty purse can still fill the board.
  while (firstFreeBoardCell(full, data) !== -1) full = act(full, { type: 'spawn', chain: 'herbs' });
  const paid = reduceGame(ready(full), { type: 'task' }, data);
  assert.equal(paid.ok, true, paid.message);
  assert.equal(paid.state.sources.at(-1), 'pork');
  assert.deepEqual(paid.state.board, full.board);
  assert.match(paid.message, /The Butcher’s hook is ready\./);
});

test('the last preparation of an act queues its scene and the chapter scene once, with no second charge or reward', () => {
  const before = ready(checkpoint(23));
  const after = act(before, { type: 'task' });
  assert.deepEqual(after.pendingScenes.slice(-2), [data.tasks[23].id, 'chapter-6']);
  assert.equal(supperComplete(after, data), false);
  assert.equal(after.coins, before.coins - data.tasks[23].cost);
  // The first preparation of act 2 waits for its chapter, after the supper.
  assert.match(rejected({ ...after, coins: 1000 }, { type: 'task' }).message, /This preparation opens on Friday 2 May\./);
  const read = act(after, { type: 'readScene', id: 'chapter-6' });
  assert.deepEqual(read.pendingScenes, queued(24).filter(id => id !== 'chapter-6'));
  for (const key of ['coins', 'taskIndex', 'board', 'completedQuests', 'decorations'] as const) {
    assert.deepEqual(read[key], after[key], `Reading a scene must not change ${key}.`);
  }
  // Repeated, stale, unearned, and unknown reading events change nothing.
  rejected(read, { type: 'readScene', id: 'chapter-6' });
  rejected(read, { type: 'readScene', id: 'finale' });
  rejected(read, { type: 'readScene', id: 'unknown' });
  rejected(read, { type: 'readScene', id: undefined as unknown as string });
  // The last preparation of act 2 completes its chapter, and the purchase that follows it belongs to no chapter.
  const last = act(ready(checkpoint(47)), { type: 'task' });
  assert.deepEqual(last.pendingScenes.slice(-2), [data.tasks[47].id, 'act2-chapter-6']);
  assert.equal(data.tasks[48].purchase, true);
  assert.ok(resolveChapters(last, data).every(view => !view.tasks.includes(data.tasks[48])));
});

test('the supper quest has no cost, earns the finale, and keeps the board playable', () => {
  const supper = supperQuest(data)!, campaign = requiredQuests(actOneTasks, data).filter(quest => !quest.act);
  const before = ready(checkpoint(23));
  assert.deepEqual(new Set(before.completedQuests), new Set([...prologueServed, ...campaign.map(quest => quest.id)]), 'Every campaign quest of act 1 is required before the supper.');
  for (const quest of campaign) rejected({ ...before, completedQuests: before.completedQuests.filter(id => id !== quest.id) }, { type: 'task' });
  // On the evening of the supper, the March quests of Dochia are delivered too, so only the supper is left.
  const paid = { ...supperEvening(), coins: 0 };
  assert.equal(status(paid, supper.id), 'active');
  assert.match(rejected(paid, { type: 'deliverQuest', id: supper.id }).message, /every required item/);
  // An empty purse serves the supper: it takes no coins and pays none.
  let state = deliver(paid, supper.id);
  assert.equal(state.coins, 0);
  assert.deepEqual(state.pendingScenes, [...paid.pendingScenes, 'finale']);
  assert.deepEqual(state.completedQuests.slice(-1), [supper.id]);
  state = act(state, { type: 'readScene', id: 'finale' });
  // No quest of act 1 is left open, except a March quest of Dochia that waits for its delivery.
  assert.ok(resolveQuests(state, data).filter(view => view.status === 'active' || view.status === 'waiting').every(view => view.quest.act === 2 || view.quest.march || view.quest.repeating || view.quest.recovery));
  state = act(state, { type: 'spawn', chain: 'herbs' });
  assert.deepEqual(state.pendingScenes, paid.pendingScenes);
});

test('saved scene queues hold only earned scenes, once each, in story order', () => {
  const middle = checkpoint(12);
  assert.deepEqual(storyScenes(data), [...data.tasks.map(task => task.id), ...data.quests.map(quest => quest.id), ...data.chapters.map(chapter => chapter.id), 'finale', 'finale-act-2', 'mina-avram-news',
    ...data.characters.flatMap(person => person.arrival ? [`arrival-${person.id}`] : []), ...data.prologue.events.flatMap(event => [event.opening.id, event.closing.id])]);
  const quest = data.quests.find(value => middle.completedQuests.includes(value.id))!;
  const undelivered = data.quests.find(value => !value.recovery && !middle.completedQuests.includes(value.id))!;
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
  const finished = supperEvening(), supped = deliver(finished, supperQuest(data)!.id);
  assert.equal(validateGame({ ...finished, pendingScenes: ['finale'] }, data), false, 'The finale waits for the supper.');
  assert.equal(validateGame({ ...supped, pendingScenes: ['finale'] }, data), true);
  assert.equal(validateGame({ ...supped, pendingScenes: ['finale-act-2'] }, data), false, 'The feast waits for its own quest.');
  assert.equal(validateGame({ ...supped, pendingScenes: ['finale', 'chapter-6'] }, data), false);
  assert.equal(validateGame({ ...supped, pendingScenes: ['finale', 'task_24'] }, data), false);
  assert.equal(validateGame({ ...supped, pendingScenes: [supperQuest(data)!.id] }, data), false, 'The supper has no completion scene.');
});

test('scene IDs must be unique across preparations, quests, local news, chapters, and the finale', () => {
  const news = data.quests.find(quest => quest.followUp)!;
  const cases: [string, (content: GameData) => void][] = [
    ['chapter reuses a preparation ID', content => { content.chapters[0].id = content.tasks[0].id; }],
    ['finale reuses a quest ID', content => { content.finales[0].id = content.quests[0].id; }],
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
  const after = act(before, { type: 'task' });
  assert.deepEqual(after.pendingScenes, [...before.pendingScenes, data.tasks[1].id]);
  // Reading the preparation scene changes nothing else, and a second read changes nothing.
  const read = act(after, { type: 'readScene', id: data.tasks[1].id });
  assert.deepEqual({ ...read, pendingScenes: after.pendingScenes }, after);
  rejected(read, { type: 'readScene', id: data.tasks[1].id });
});

test('three chains and the pickle barrel of winter are open at the start of act 1, and each preparation that opens a chain names its new source in its scene', () => {
  assert.deepEqual(availableChains({ taskIndex: 0, clock: { day: 1 } }, data), ['grain', 'corn', 'herbs', 'pickles']);
  const opens = Object.fromEntries(data.tasks.flatMap(task => task.unlock ? [[task.id, task.unlock]] : []));
  assert.deepEqual(opens, { task_3: 'dairy', task_5: 'poultry', task_6: 'vegetables', task_7: 'fruits', task_8: 'pork', task_11: 'beans', task_12: 'fish', task_13: 'lamb', task_16: 'veal' });
  for (const [id, chain] of Object.entries(opens)) {
    const source = data.items[`generator_${chain}`].name.toLowerCase();
    assert.ok(data.tasks.find(task => task.id === id)!.dialogue.some(line => line.text.toLowerCase().includes(source)), `${id} names the ${source}.`);
  }
});
