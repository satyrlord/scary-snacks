import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, dataProblems, validateGame, reduceGame, currentTask, firstFreeBoardCell, questDeliveryCells, requiredQuests, resolveRooms, latestArea, roomProblems, roomPaintings,
  generatorOutputs, generatorTierProblems, nextOutput } from '../src/engine.ts';
import { exportSave, importSave } from '../src/storage.ts';
import { imageVariants } from '../tools/build-image-variants.ts';
import type { Action, GameData, GameState, Quest } from '../src/engine.ts';
const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
data.board.layouts.push({ id: 'test-open', obstacles: [] });
const initial = () => ({ ...createGame(data), layoutId: 'test-open' });
// Large funds and quests marked delivered isolate tiers, placement, and room art from the campaign effort.
const funded = () => ({ ...initial(), coins: 100000 });
function withQuests(state: GameState, content = data) {
  const next = structuredClone(state);
  for (const quest of requiredQuests(next.taskIndex, content)) if (!next.completedQuests.includes(quest.id)) next.completedQuests.push(quest.id);
  return next;
}
function apply(state: GameState, action: Action, content = data) {
  const before = JSON.stringify(state);
  const result = reduceGame(state, action, content);
  assert.equal(result.ok, true, result.message);
  assert.equal(JSON.stringify(state), before, 'An action must not mutate the input state.');
  assert.equal(validateGame(result.state, content), true, `Invalid state after ${action.type}`);
  return result.state;
}
/** Pay count preparations, each with the quests that it needs. */
function pay(state: GameState, count = 1, content = data) {
  for (let index = 0; index < count; index++) state = apply(withQuests(state, content), { type: 'task' }, content);
  return state;
}
// Takes unknown input: some tests pass actions that the Action type does not admit.
function fail(state: GameState, action: unknown) {
  const before = JSON.stringify(state);
  const result = reduceGame(state, action as Action, data);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.equal(JSON.stringify(state), before);
  return result;
}
function fillBoard(state: GameState) {
  const index = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  while (firstFreeBoardCell(state, data) !== -1) state = apply(state, { type: 'spawn', index });
  return state;
}
/** A quest with only these requirements, to test how a delivery finds its items. */
const questWith = (requirements: Quest['requirements']): Quest => ({ ...data.quests[0], requirements });

test('original data has 30 named stages, five generators, 22 characters, and 24 tasks', () => {
  assert.equal(data.board.columns * data.board.rows, 42);
  assert.equal(Object.keys(data.items).length, 35);
  assert.equal(data.characters.length, 22);
  assert.equal(data.characters.filter(person => !person.visitor && !person.regular).length, 4);
  assert.equal(data.characters.filter(person => person.regular).length, 12);
  assert.equal(data.characters.filter(person => person.visitor).length, 6);
  assert.equal(data.tasks.length, 24);
  assert.equal(new Set(data.tasks.map(task => task.id)).size, 24);
  for (const task of data.tasks) {
    assert.equal(task.dialogue.length, 3);
    assert.ok(task.dialogue.every(line => data.characters.some(person => person.id === line.speaker) && line.text.length > 0));
  }
  for (const chain of data.chains) {
    for (let stage = 1; stage <= 6; stage++) {
      const item = data.items[`${chain.id}_${stage}`];
      assert.ok(item.name);
      assert.equal(item.next, stage === 6 ? null : `${chain.id}_${stage + 1}`);
    }
    assert.deepEqual(data.items[`generator_${chain.id}`].generator?.outputs, [`${chain.id}_1`]);
  }
});

test('dish and drink names use only English and Romanian letters', () => {
  for (const item of Object.values(data.items)) if (!item.generator) assert.match(item.name, /^[A-Za-zĂÂÎȘȚăâîșț ]+$/, item.name);
});

test('fresh games are valid, identical, and independent', () => {
  const state = initial();
  assert.equal(validateGame(state, data), true);
  assert.equal(state.version, 12);
  assert.deepEqual(state, initial());
  assert.deepEqual([state.coins, state.taskIndex, state.completedQuests, state.pendingScenes], [0, 0, [], []]);
  state.board[0] = { code: 'bakery_1' };
  assert.equal(initial().board[0], null);
  assert.equal(currentTask(initial(), data)?.id, 'task_1');
});

test('generators have unlimited free output with no clock state', () => {
  let state = initial();
  const coins = state.coins;
  const generator = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  for (let index = 0; index < 100; index++) {
    state = apply(state, { type: 'spawn', index: generator });
    // Clear the new item by hand, so the board never fills.
    const spawned = state.board.findIndex((cell, position) => position !== generator && cell?.code === 'bakery_1');
    state = { ...state, board: state.board.map((cell, position) => position === spawned ? null : cell) };
  }
  assert.equal(state.coins, coins);
  assert.equal('energy' in state, false);
  assert.equal('cooldowns' in state, false);
});

test('production tiers validate their chain, stage, unlock, and preparation order', () => {
  assert.deepEqual(generatorTierProblems(data), []);
  for (const tiers of [
    [{ chain: 'absent', stage: 2, after: 'task_12' }],
    [{ chain: 'bakery', stage: 7, after: 'task_12' }],
    [{ chain: 'bakery', stage: 2, after: 'absent' }],
    [{ chain: 'sweet', stage: 2, after: 'task_2' }],
    [{ chain: 'bakery', stage: 3, after: 'task_12' }, { chain: 'bakery', stage: 2, after: 'task_20' }],
    [{ chain: 'bakery', stage: 2, after: 'task_12' }, { chain: 'bakery', stage: 3, after: 'task_12' }],
  ]) assert.ok(generatorTierProblems({ ...data, generatorTiers: tiers }).length > 0);
  const broken = structuredClone(data);
  broken.items.bakery_2.chain = 'warm';
  assert.ok(generatorTierProblems(broken).length > 0);
});

test('paid production tiers change no items and keep the chosen outputs empty', () => {
  let state = funded();
  for (let count = 1; count <= 20; count++) {
    const before = withQuests(state);
    const result = reduceGame(before, { type: 'task' }, data);
    state = apply(before, { type: 'task' });
    const tier = count < 12 ? 1 : count < 20 ? 2 : 3;
    assert.deepEqual(generatorOutputs(state, 'generator_bakery', data), Array.from({ length: tier }, (_, index) => `bakery_${index + 1}`));
    assert.deepEqual(state.outputChoices, {});
    if (count === 12 || count === 20) {
      assert.deepEqual(state.board, before.board);
      for (const chain of data.chains) assert.ok(result.message.includes(`The ${data.items[`generator_${chain.id}`].name} can now make ${data.items[`${chain.id}_${tier}`].name}.`));
    } else assert.ok(!result.message.includes('can now make'));
  }
  const index = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  for (const output of ['bakery_3', 'bakery_2', 'bakery_1']) {
    const empty = firstFreeBoardCell(state, data);
    state = apply(state, { type: 'spawn', index, output });
    assert.equal(state.board[empty]?.code, output);
    assert.equal(state.outputChoices.bakery, output === 'bakery_1' ? undefined : output);
    const repeated = firstFreeBoardCell(state, data);
    state = apply(state, { type: 'spawn', index });
    assert.equal(state.board[repeated]?.code, output);
  }
});

test('output choices survive moves and later upgrades while failed takes change nothing', () => {
  let state = pay(funded(), 12);
  state = apply(state, { type: 'spawn', index: 1, output: 'bakery_2' });
  state = apply(state, { type: 'move', from: 1, to: firstFreeBoardCell(state, data) });
  state = pay(state, 8);
  assert.deepEqual(state.outputChoices, { bakery: 'bakery_2' });
  const index = state.board.findIndex(cell => cell?.code === 'generator_bakery');
  const empty = firstFreeBoardCell(state, data);
  state = apply(state, { type: 'spawn', index });
  assert.equal(state.board[empty]?.code, 'bakery_2');
  for (const output of ['bakery_4', 'warm_2', 'absent', '__proto__', null, 2]) {
    const result = fail(state, { type: 'spawn', index, output });
    assert.equal(result.message, 'Choose an available output from this source.');
  }
  fail(state, { type: 'spawn', index: empty, output: 'bakery_3' });
  state = fillBoard(state);
  fail(state, { type: 'spawn', index, output: 'bakery_3' });
  assert.deepEqual(state.outputChoices, { bakery: 'bakery_2' });
  for (const count of [11, 19]) fail(pay(funded(), count), { type: 'spawn', index: 1, output: `bakery_${count === 11 ? 2 : 3}` });
});

test('chosen outputs reject unknown, locked, cross-chain, base-stage, and unearned values', () => {
  for (const outputs of [null, [], 'bakery_2', { bakery: 'bakery_1' }, { bakery: 'bakery_2' }, { sweet: 'sweet_2' }, { absent: 'bakery_2' }, { bakery: '__proto__' }, { bakery: 'generator_bakery' }, { bakery: 'warm_2' }]) {
    assert.equal(validateGame({ ...initial(), outputChoices: outputs }, data), false, JSON.stringify(outputs));
  }
  const { outputChoices: _choices, ...missing } = initial();
  assert.equal(validateGame(missing, data), false);
});

test('lower-stage outputs stay available after upgrades and fill a duplicate requirement', () => {
  for (const [count, stages] of [[12, 1], [20, 2]]) {
    const upgraded = pay(funded(), count);
    for (const chain of data.chains) for (let stage = 1; stage <= stages; stage++) {
      let state = upgraded;
      const code = `${chain.id}_${stage}`;
      const index = state.board.findIndex(cell => cell?.code === `generator_${chain.id}`);
      state = apply(state, { type: 'spawn', index, output: code });
      state = apply(state, { type: 'spawn', index, output: code });
      assert.ok(questDeliveryCells(state, questWith([{ item: code, quantity: 2 }]), data).every(cell => cell >= 0), code);
    }
  }
});

test('production upgrades need no board space', () => {
  for (const count of [11, 19]) {
    const state = fillBoard(pay(funded(), count));
    const upgraded = pay(state);
    assert.deepEqual(upgraded.board, state.board);
    assert.equal(generatorOutputs(upgraded, 'generator_bakery', data).length, count === 11 ? 2 : 3);
  }
});

test('a newly unlocked source uses the earned tier and starts with stage one selected', () => {
  const early = structuredClone(data);
  early.generatorTiers.find(tier => tier.chain === 'sweet' && tier.stage === 2)!.after = 'task_3';
  assert.deepEqual(dataProblems(early), []);
  const state = pay({ ...createGame(early), coins: 100000 }, 3, early);
  assert.deepEqual(generatorOutputs(state, 'generator_sweet', early), ['sweet_1', 'sweet_2']);
  const empty = firstFreeBoardCell(state, early);
  const result = reduceGame(state, { type: 'spawn', index: state.board.findIndex(cell => cell?.code === 'generator_sweet') }, early);
  assert.ok(result.ok);
  assert.equal(result.state.board[empty]?.code, 'sweet_1');
  assert.deepEqual(result.state.outputChoices, {});
});

test('the next output that the interface names is the output that one tap takes', () => {
  let state = pay(funded(), 18);
  const index = () => state.board.findIndex(cell => cell?.code === 'generator_bakery');
  const taps = (count: number) => {
    for (let tap = 0; tap < count; tap++) {
      const named = nextOutput(state, 'generator_bakery', data);
      const empty = firstFreeBoardCell(state, data);
      state = apply(state, { type: 'spawn', index: index() });
      assert.equal(state.board[empty]?.code, named);
    }
  };
  taps(2);
  assert.equal(nextOutput(state, 'generator_bakery', data), 'bakery_1');
  state = apply(state, { type: 'spawn', index: index(), output: 'bakery_2' });
  taps(2);
  assert.equal(nextOutput(state, 'generator_bakery', data), 'bakery_2');
  assert.equal(nextOutput(state, 'bakery_1', data), null);
});

test('matching ingredients merge and discover the next stage, and final dishes do not merge', () => {
  const state = initial();
  const result = reduceGame(state, { type: 'move', from: 13, to: 14 }, data);
  assert.equal(result.ok, true);
  assert.equal(result.event, 'merge');
  assert.equal(result.state.board[13], null);
  assert.equal(result.state.board[14]?.code, 'bakery_2');
  assert.ok(result.state.discovered.includes('bakery_2'));
  assert.equal(state.board[13]?.code, 'bakery_1');
  const top = initial();
  top.board[13] = { code: 'bakery_6' };
  top.board[14] = { code: 'bakery_6' };
  top.discovered.push('bakery_6');
  assert.match(fail(top, { type: 'move', from: 13, to: 14 }).message, /final dish/);
});

test('different items swap and empty cells accept items', () => {
  let state = initial();
  state = apply(state, { type: 'move', from: 1, to: 4 });
  assert.equal(state.board[1]?.code, 'generator_warm');
  assert.equal(state.board[4]?.code, 'generator_bakery');
  state = apply(state, { type: 'move', from: 4, to: 0 });
  assert.equal(state.board[4], null);
  assert.equal(state.board[0]?.code, 'generator_bakery');
});

test('board-full failures retain state and a merge recovers space', () => {
  let state = fillBoard(initial());
  assert.match(fail(state, { type: 'spawn', index: 1 }).message, /Merge a pair or deliver a quest/);
  const flours = state.board.flatMap((cell, index) => cell?.code === 'bakery_1' ? [index] : []);
  state = apply(state, { type: 'move', from: flours[0], to: flours[1] });
  state = apply(state, { type: 'spawn', index: 1 });
  assert.equal(state.board.includes(null), false);
});

test('a delivery takes each duplicate from its own cell', () => {
  let state = initial();
  assert.deepEqual(questDeliveryCells(state, questWith([{ item: 'bakery_1', quantity: 2 }]), data), [13, 14]);
  state.board[13] = null;
  assert.deepEqual(questDeliveryCells(state, questWith([{ item: 'bakery_1', quantity: 2 }]), data), [14, -1]);
});

test('invalid, unknown, and unavailable actions do not change state', () => {
  const state = initial();
  for (const action of [null, {}, { type: 'unknown' }, { type: 'task' }, { type: 'spawn', index: 13 },
    { type: 'move', from: 13, to: 13 }, { type: 'move', from: 13, to: 42 }, { type: 'move', from: -1, to: 0 },
    { type: 'move', from: 13, to: '14' }, { type: 'deliverQuest', id: 'absent' }, { type: 'deliverQuest', id: 'mara-welcome' }]) fail(state, action);
});

test('save validation rejects invalid numeric fields, codes, quest records, and unsupported versions', () => {
  // Some corruptions write a value that the GameState type does not admit.
  const corruptions: ((state: any) => void)[] = [
    state => { state.version = 1; }, state => { state.version = 11; }, state => { state.version = 13; }, state => { state.coins = -1; },
    state => { state.coins = 0.5; }, state => { state.taskIndex = 25; },
    state => { state.board.pop(); }, state => { state.board[0] = { code: '__proto__' }; },
    state => { state.board[0] = { code: 'bakery_1', hidden: true }; },
    state => { state.discovered.push(state.discovered[0]); },
    state => { state.decorations.push('task_1'); },
    state => { state.discovered = []; }, state => { state.completedQuests = null; },
    state => { state.completedQuests = ['absent']; }, state => { state.completedQuests = ['mara-table']; },
  ];
  for (const corrupt of corruptions) {
    const state = initial();
    corrupt(state);
    assert.equal(validateGame(state, data), false, String(corrupt));
  }
  assert.equal(validateGame(null, data), false);
  assert.equal(validateGame([], data), false);
});

test('save validation rejects missing, duplicated, and premature generators', () => {
  let state = initial();
  state.board[1] = null;
  assert.equal(validateGame(state, data), false);
  state = initial();
  state.board[0] = { code: 'generator_bakery' };
  assert.equal(validateGame(state, data), false);
  state = initial();
  state.board[0] = { code: 'generator_sweet' };
  state.discovered.push('generator_sweet');
  assert.equal(validateGame(state, data), false);
});

test('task unlocks require a free board space and fail atomically on a full board', () => {
  let state = fillBoard(pay(funded(), 2));
  const failure = fail(withQuests(state), { type: 'task' });
  assert.match(failure.message, /space/);
  const [space, pair] = state.board.flatMap((cell, index) => cell?.code === 'bakery_1' ? [index] : []);
  state = apply(state, { type: 'move', from: space, to: pair });
  state = pay(state);
  assert.equal(state.board[space]?.code, 'generator_sweet');
  assert.equal(state.taskIndex, 3);
});

test('a short purse names the missing coins, and a preparation that brings a new source says which source arrived and where it is', () => {
  const source = data.items.generator_sweet.name;
  assert.equal(fail(withQuests(initial()), { type: 'task' }).message, `Earn ${data.tasks[0].cost} more coins to pay for this preparation.`);
  const state = withQuests(pay(funded(), 2));
  assert.ok(reduceGame(state, { type: 'task' }, data).message.startsWith(`${data.tasks[2].title}: done. The ${source} is on the board.`));
  assert.match(fail(fillBoard(state), { type: 'task' }).message, /space/);
});

const completedAt = (count: number) => data.tasks.slice(0, count).map(task => task.id);
const roomsAt = (count: number, painted?: readonly string[]) => resolveRooms(completedAt(count), data, painted);
// The art plan: the front room has a state for the new game and after preparations 1 to 12, 17 and 24; the courtyard after 13 to 16 and 18 to 23.
const plan: Record<string, number[]> = { 'front-room': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17, 24], courtyard: [13, 14, 15, 16, 18, 19, 20, 21, 22, 23] };

test('the authored rooms resolve at every checkpoint and show only approved, shipped paintings', () => {
  assert.deepEqual(roomProblems(data), []);
  assert.deepEqual(data.areas.map(area => area.id), ['front-room', 'courtyard']);
  assert.equal(data.rooms.length, 25);
  for (const [area, numbers] of Object.entries(plan)) assert.deepEqual(data.rooms.filter(state => state.area === area).map(state => state.id).sort(), numbers.map(n => `${area}-${String(n).padStart(2, '0')}`).sort());
  // The approved-image list and the variant plan name the same room paintings, so a painting shows only once its variants ship.
  assert.deepEqual([...roomPaintings].sort(), Object.keys(imageVariants).filter(id => /^(front-room|courtyard)-\d\d$/.test(id)).sort());
  for (const id of roomPaintings) assert.ok(data.rooms.some(state => state.id === id), `${id} is a room state`);
});

test('each area shows the state of its highest completed preparation, and the courtyard stays locked until it opens', () => {
  for (let count = 0; count <= data.tasks.length; count++) {
    const views = roomsAt(count);
    for (const view of views) {
      const earned = plan[view.id].filter(n => n <= count);
      assert.equal(view.open, view.id === 'front-room' || count >= 13, `${view.id} open at ${count}`);
      if (!view.open) { assert.deepEqual([view.states, view.current, view.painting], [[], null, null]); continue; }
      assert.deepEqual(view.states.map(state => state.id), earned.map(n => `${view.id}-${String(n).padStart(2, '0')}`), `${view.id} at ${count}`);
      assert.equal(view.current, view.states.at(-1));
    }
  }
  const unlock = data.tasks.findIndex(task => task.id === data.areas[1].unlock);
  assert.equal(data.tasks[unlock].title, 'Clear the courtyard');
  assert.equal(data.tasks[unlock].chapter, 4);
});

test('a state that waits for its painting shows the latest earlier painting of its area, with its own words', () => {
  // Every state has its painting; the fallback covers a later state that waits for its painting.
  assert.deepEqual(data.rooms.filter(state => !roomPaintings.includes(state.id)), []);
  const [front, courtyard] = roomsAt(23, roomPaintings.filter(id => id !== 'courtyard-23'));
  assert.equal(courtyard.current!.id, 'courtyard-23');
  assert.equal(courtyard.painting!.id, 'courtyard-22');
  assert.match(courtyard.current!.text, /string of warm lights/);
  assert.equal(front.painting!.id, 'front-room-17');
  assert.equal(roomsAt(23)[1].painting!.id, 'courtyard-23');
  assert.equal(roomsAt(24)[0].painting!.id, 'front-room-24');
  // Without a painting for state 05, the room shows the painting of state 04 until state 06 arrives; the first state of an area always has one.
  const painted = roomPaintings.filter(id => id !== 'front-room-05');
  assert.deepEqual([roomsAt(5, painted)[0].current!.id, roomsAt(5, painted)[0].painting!.id], ['front-room-05', 'front-room-04']);
  assert.equal(roomsAt(6, painted)[0].painting!.id, 'front-room-06');
  assert.match(roomProblems(data, roomPaintings.filter(id => id !== 'courtyard-13')).join(' '), /courtyard: needs a painting for its first state/);
});

test('the room follows the area of the latest change', () => {
  const expected: [number, string][] = [[0, 'front-room'], [12, 'front-room'], [13, 'courtyard'], [16, 'courtyard'], [17, 'front-room'], [18, 'courtyard'], [23, 'courtyard'], [24, 'front-room']];
  for (const [count, area] of expected) assert.equal(latestArea(completedAt(count), data), area, `at ${count}`);
});

test('the new game shows the webs and the spiders, and the mended window clears them but for one', () => {
  assert.equal(data.tasks[0].title, 'Fix the broken window');
  const [base, mended] = data.rooms;
  assert.match(base.text, /Cobwebs hang in the broken window/);
  assert.match(base.text, /One small spider lives under the upper wall shelf/);
  assert.match(mended.text, /Every web is gone, and the spiders left through the window, all but one/);
});

test('the room check names a bad name, an unknown preparation, a stray focus, a missing text, a bad label or pin mark, an early state, and a preparation with no change or two', () => {
  const broken = structuredClone(data);
  const state = (id: string) => broken.rooms.find(value => value.id === id)!;
  state('front-room-02').id = 'front-room-2';
  state('front-room-03').after = 'task_99';
  state('front-room-04').focus = { x: 50, y: 120 };
  state('front-room-05').text = '';
  state('front-room-06').label = '';
  state('front-room-07').mark = { x: -1, y: 20 };
  state('courtyard-14').after = 'task_7';
  state('courtyard-14').id = 'courtyard-07';
  broken.rooms = broken.rooms.filter(value => value.id !== 'courtyard-13');
  const problems = roomProblems(broken).join(' ');
  assert.match(problems, /front-room-2: must be named after its area and its preparation/);
  assert.match(problems, /front-room-03: unknown preparation/);
  assert.match(problems, /front-room-04: needs a focus inside its painting/);
  assert.match(problems, /front-room-06: needs a short label of at most 28 characters/);
  assert.match(problems, /front-room-07: needs a pin mark inside its painting/);
  assert.match(problems, /front-room-05: needs a description/);
  assert.match(problems, /courtyard: needs its first state when it opens, and no state before/);
  assert.match(problems, /task_7: changes the rooms more than once/);
  assert.match(problems, /task_13: changes nothing in the rooms/);
});

test('a preparation paid with exactly its cost empties the purse and adds one room change', () => {
  let state = withQuests({ ...initial(), coins: data.tasks[0].cost });
  state = apply(state, { type: 'task' });
  assert.equal(state.coins, 0);
  assert.deepEqual(resolveRooms(state.decorations, data), roomsAt(1));
  // The next preparation costs more than the empty purse: nothing is charged and nothing changes.
  fail(withQuests(state), { type: 'task' });
  assert.deepEqual(state.decorations, ['task_1']);
});

test('fresh, mid-campaign, and completed saves resolve the same rooms after reload and export', () => {
  for (const count of [0, 12, 13, data.tasks.length]) {
    const state = pay(funded(), count);
    const validate = (candidate: unknown) => validateGame(candidate, data);
    const reloaded = importSave<GameState>(JSON.stringify({ format: 'scary-snacks', version: 11, state: JSON.parse(JSON.stringify(state)) }), validate);
    const exported = importSave<GameState>(exportSave(reloaded, validate), validate);
    assert.deepEqual(resolveRooms(reloaded.decorations, data), roomsAt(count), `reload at ${count}`);
    assert.deepEqual(resolveRooms(exported.decorations, data), roomsAt(count), `export at ${count}`);
  }
});

test('one data check gathers every content check, and the game can run it without the image records', async () => {
  const images = (JSON.parse(await readFile(new URL('../docs/asset-provenance.json', import.meta.url), 'utf8')) as { assets: { id: string }[] }).assets.map(asset => asset.id);
  assert.deepEqual(dataProblems(data, images), []);
  assert.deepEqual(dataProblems(data), []);
  const unknownImage = structuredClone(data);
  unknownImage.decorationSlots[0].variants[0].image = 'absent';
  assert.deepEqual(dataProblems(unknownImage), [], 'Only the generator knows the approved images.');
  assert.match(dataProblems(unknownImage, images).join(' '), /missing image/);
  const mutations: ((content: GameData) => void)[] = [
    content => { content.rooms[1].after = 'absent'; },
    content => { content.generatorTiers[0].stage = 4; },
    content => { content.quests[0].reward = -1; },
    content => { content.quests.at(-1)!.afterTask = 'task_24'; },
    content => { content.tasks[0].cost++; },
    content => { (content as { tasks: unknown }).tasks = null; },
  ];
  for (const mutate of mutations) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(dataProblems(content, images).length, String(mutate));
  }
});

test('data checks reject a starting board that does not make a valid new game', () => {
  for (const code of ['generator_bakery', 'sweet_1']) {
    const content = structuredClone(data);
    content.board.initial[2] = code;
    assert.match(dataProblems(content).join(' '), /valid new game|source must be available exactly once/, code);
  }
});

test('data checks reject broken merge paths and source references before play', () => {
  const cases: [string, (content: GameData) => void][] = [
    ['unknown successor', content => { content.items.bakery_1.next = 'absent'; }],
    ['locked successor', content => { content.items.bakery_1.next = 'sweet_1'; }],
    ['cyclic successor', content => { content.items.bakery_1.next = 'bakery_1'; }],
    ['missing stage', content => { delete content.items.bakery_6; }],
    ['mismatched ID', content => { content.items.bakery_1.id = 'bakery_2'; }],
    ['unknown chain', content => { content.items.bakery_1.chain = 'absent'; }],
    ['missing base output', content => { content.items.generator_bakery.generator!.outputs = []; }],
    ['locked base output', content => { content.items.generator_bakery.generator!.outputs = ['sweet_1']; }],
    ['duplicate source unlock', content => { content.tasks[3].unlock = 'bakery'; }],
    ['unknown source unlock', content => { content.tasks[3].unlock = 'absent'; }],
    ['missing source unlock', content => { delete content.tasks[2].unlock; }],
    ['malformed item', content => { Object.assign(content.items, { bakery_1: null }); }],
  ];
  for (const [label, change] of cases) {
    const content = structuredClone(data);
    change(content);
    assert.ok(dataProblems(content).length, label);
  }
});

test('data checks reject unsupported board dimensions and incomplete starting layouts', () => {
  const mutations: ((content: GameData) => void)[] = [
    content => { content.board.columns = 7; },
    content => { content.board.rows = 6; },
    content => { content.board.columns = 7; content.board.rows = 6; },
    content => { content.board.columns = 0; },
    content => { content.board.rows = 7.5; },
    content => { content.board.initial.pop(); },
    content => { content.board.initial.push(null); },
    content => { (content.board as { initial: unknown }).initial = {}; },
  ];
  for (const mutate of mutations) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(dataProblems(content).length, String(mutate));
  }
});
