import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { currentTask, dishWork, firstFreeBoardCell, questDeliveryCells, requiredQuests, resolveRooms, latestArea, roomPaintings, generatorOutputs } from '../src/model.ts';
import { createGame, validateGame, reduceGame } from '../src/engine.ts';
import { dataProblems, roomProblems } from '../src/content.ts';
import { exportSave, importSave } from '../src/storage.ts';
import { imageVariants } from '../tools/build-image-variants.ts';
import type { Action, GameData, GameState, Quest } from '../src/model.ts';
import { act, addOpenLayout, data, openGame, player, rejected, validate, know } from './support.ts';
addOpenLayout();
// Large funds and quests marked delivered isolate production, placement, and room art from the campaign effort.
const funded = () => ({ ...openGame(), coins: 100000 });
function withQuests(state: GameState, content = data) {
  const next = structuredClone(state);
  for (const quest of requiredQuests(next.taskIndex, content)) if (!next.completedQuests.includes(quest.id)) next.completedQuests.push(quest.id);
  return next;
}
/** Pay count preparations, each with the quests that it needs. */
function pay(state: GameState, count = 1, content = data) {
  for (let index = 0; index < count; index++) state = act(withQuests(state, content), { type: 'task' }, content);
  return state;
}
/** Fill every free cell with free Elderflowers from the Herb basket. */
function fillBoard(state: GameState) {
  const index = state.board.findIndex(cell => cell?.code === 'generator_herbs');
  while (firstFreeBoardCell(state, data) !== -1) state = act(state, { type: 'spawn', index });
  return state;
}
/** A quest with only these requirements, to test how a delivery finds its items. */
const questWith = (requirements: Quest['requirements']): Quest => ({ ...data.quests[0], requirements });
/** A copy with these dishes on the first free cells, discovered, and the cells that they took. */
function place(state: GameState, codes: string[]): [GameState, number[]] {
  const next = structuredClone(state), cells: number[] = [];
  for (const code of codes) {
    const index = firstFreeBoardCell(next, data);
    assert.notEqual(index, -1);
    next.board[index] = { code };
    if (!next.discovered.includes(code)) know(next, code);
    cells.push(index);
  }
  return [next, cells];
}
/** A new mixed dish with these parts, the tags of its parts, and a free atlas cell. */
function addMixed(content: GameData, id: string, recipe: string[]) {
  const tags = [...new Set(recipe.flatMap(part => content.items[part]?.tags ?? []))];
  content.items[id] = { id, name: 'Test dish', chain: 'mixed', stage: 2, next: null, art: { atlas: 'mains', cell: 7 }, price: 1, tags, recipe: recipe as [string, string] };
}

test('original data has 12 staple chains of four to six dishes, 24 mixed dishes, 12 sources, 22 characters, and 24 tasks', () => {
  assert.equal(data.board.columns * data.board.rows, 42);
  assert.equal(Object.keys(data.items).length, 97);
  assert.deepEqual(data.chains.map(chain => chain.id), ['grain', 'corn', 'herbs', 'dairy', 'poultry', 'vegetables', 'fruits', 'pork', 'beans', 'lamb', 'veal', 'fish']);
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
  const lengths: Record<string, number> = { grain: 6, corn: 4, herbs: 4, dairy: 6, poultry: 4, vegetables: 6, fruits: 6, pork: 5, beans: 5, lamb: 5, veal: 6, fish: 4 };
  for (const chain of data.chains) {
    const length = lengths[chain.id];
    assert.equal(Object.values(data.items).filter(item => item.chain === chain.id && !item.generator).length, length, chain.id);
    for (let stage = 1; stage <= length; stage++) {
      const item = data.items[`${chain.id}_${stage}`];
      assert.ok(item.name);
      assert.equal(item.next, stage === length ? null : `${chain.id}_${stage + 1}`);
    }
    assert.deepEqual(data.items[`generator_${chain.id}`].generator?.outputs, [`${chain.id}_1`]);
  }
  const mixed = Object.values(data.items).filter(item => item.chain === 'mixed');
  assert.equal(mixed.length, 24);
  for (const item of mixed) {
    assert.match(item.id, /^mixed_[a-z-]+$/);
    assert.equal(item.recipe?.length, 2);
    assert.equal(item.stage, item.recipe!.some(part => data.items[part].recipe) ? 2 : 1, item.id);
    assert.equal(item.next, null);
  }
});

test('dish and drink names use only English and Romanian letters', () => {
  for (const item of Object.values(data.items)) if (!item.generator) assert.match(item.name, /^[A-Za-zĂÂÎȘȚăâîșț ]+$/, item.name);
});

test('fresh games are valid, identical, and independent', () => {
  const state = openGame();
  assert.equal(validateGame(state, data), true);
  assert.equal(state.version, 14);
  assert.deepEqual(state, openGame());
  assert.deepEqual([state.coins, state.taskIndex, state.completedQuests, state.pendingScenes], [0, 0, [], []]);
  state.board[0] = { code: 'grain_1' };
  assert.equal(openGame().board[0], null);
  assert.equal(currentTask(openGame(), data)?.id, 'task_1');
});

test('a new game opens Grain, Corn, and Herbs with their sources, staples, and two Socată in fixed cells, and eight blockers', () => {
  const state = createGame(data);
  const codes = Object.fromEntries(state.board.flatMap((cell, index) => cell ? [[index, cell.code]] : []));
  assert.deepEqual(codes, { 1: 'generator_grain', 4: 'generator_corn', 13: 'grain_1', 14: 'grain_1', 22: 'corn_1', 27: 'herbs_1', 31: 'generator_herbs', 32: 'herbs_3', 33: 'herbs_3' });
  assert.equal(data.board.layouts.find(layout => layout.id === data.board.defaultLayout)!.obstacles.length, 8);
});

test('every source keeps its stage-one output through all preparations', () => {
  let state = funded();
  for (let count = 1; count <= 24; count++) {
    state = act(withQuests(state), { type: 'task' });
    for (const chain of data.chains) {
      const source = `generator_${chain.id}`;
      assert.deepEqual(generatorOutputs(state, source, data), state.board.some(cell => cell?.code === source) ? [`${chain.id}_1`] : []);
    }
  }
  assert.equal(data.chains.filter(chain => state.board.some(cell => cell?.code === `generator_${chain.id}`)).length, 12);
});

test('a source takes only its first ingredient after late preparations', () => {
  let state = pay(funded(), 20);
  const index = state.board.findIndex(cell => cell?.code === 'generator_grain');
  for (let count = 0; count < 2; count++) {
    const empty = firstFreeBoardCell(state, data);
    state = act(state, { type: 'spawn', index });
    assert.equal(state.board[empty]?.code, 'grain_1');
  }
});

test('a newly unlocked source starts with stage one after its preparation', () => {
  const state = pay({ ...createGame(data), coins: 100000 }, 6);
  const empty = firstFreeBoardCell(state, data);
  const result = reduceGame(state, { type: 'spawn', index: state.board.findIndex(cell => cell?.code === 'generator_vegetables') }, data);
  assert.ok(result.ok);
  assert.equal(result.state.board[empty]?.code, 'vegetables_1');
});

test('a chain merge of two matching dishes makes the next dish and discovers it, and two final dishes without a recipe do not merge', () => {
  const state = openGame();
  const result = reduceGame(state, { type: 'move', from: 13, to: 14 }, data);
  assert.equal(result.ok, true);
  assert.equal(result.event, 'merge');
  assert.equal(result.state.board[13], null);
  assert.equal(result.state.board[14]?.code, 'grain_2');
  assert.ok(result.state.discovered.includes('grain_2'));
  // A ticket put Dough in the recipe book already, so its first merge gives the usual line. A dish that no ticket shows is new.
  assert.equal(result.message, 'Made Dough.');
  assert.equal(result.state.coins, state.coins);
  assert.equal(state.board[13]?.code, 'grain_1');
  assert.equal(state.discovered.includes('corn_3'), false);
  const [corn, [left, right]] = place(openGame(), ['corn_2', 'corn_2']);
  assert.equal(act(corn, { type: 'move', from: left, to: right }).board[right]?.code, 'corn_3');
  assert.equal(reduceGame(corn, { type: 'move', from: left, to: right }, data).message, 'Cornmeal is a new dish! It is in the recipe book now.');
  const [top, [first, second]] = place(openGame(), ['grain_6', 'grain_6']);
  assert.match(rejected(top, { type: 'move', from: first, to: second }).message, /^Bread basket is a final dish\./);
});

test('a mixed merge works in both directions, and the dish takes the cell of the target part', () => {
  const [state, [mamaliga, telemea]] = place(pay(funded(), 3), ['corn_4', 'dairy_4']);
  const onto = act(state, { type: 'move', from: telemea, to: mamaliga });
  assert.deepEqual([onto.board[mamaliga]?.code, onto.board[telemea]], ['mixed_bulz', null]);
  const back = act(state, { type: 'move', from: mamaliga, to: telemea });
  assert.deepEqual([back.board[telemea]?.code, back.board[mamaliga]], ['mixed_bulz', null]);
  for (const result of [onto, back]) {
    assert.ok(result.discovered.includes('mixed_bulz'));
    assert.equal(result.coins, state.coins);
  }
  assert.equal(reduceGame(state, { type: 'move', from: telemea, to: mamaliga }, data).event, 'merge');
  // A mixed dish that is a part of two recipes merges with either partner.
  const [cakes, [dough, bowl, milk]] = place(pay(funded(), 7), ['mixed_sweet-dough', 'fruits_2', 'dairy_1']);
  assert.equal(act(cakes, { type: 'move', from: bowl, to: dough }).board[dough]?.code, 'mixed_cozonac');
  assert.equal(act(cakes, { type: 'move', from: dough, to: milk }).board[milk]?.code, 'mixed_chimney-cake');
});

test('a three-chain dish is cooked from staples with paid takes, chain merges, and two recipe merges', () => {
  const start = pay(funded(), 7);
  const game = player(start);
  const cell = game.produce('mixed_cozonac');
  assert.equal(game.state.board[cell]?.code, 'mixed_cozonac');
  for (const code of ['grain_2', 'poultry_1', 'mixed_sweet-dough', 'fruits_2', 'mixed_cozonac']) assert.ok(game.state.discovered.includes(code), code);
  // Each staple is one paid take: two Flour, one Eggs, and two Plums.
  assert.equal(dishWork('mixed_cozonac', data).staples, 5);
  assert.equal(start.coins - game.state.coins, 5 * data.economy.takeCost);
  assert.equal(game.state.board.filter(value => value?.code === 'mixed_cozonac').length, 1);
});

test('a refused pair swaps two dishes without a recipe, and fails on a blocked dish, with nothing else changed', () => {
  const state = openGame();
  const result = reduceGame(state, { type: 'move', from: 13, to: 22 }, data);
  assert.equal(result.event, 'move');
  assert.equal(result.message, 'Items swapped.');
  const swapped = act(state, { type: 'move', from: 13, to: 22 });
  assert.deepEqual([swapped.board[13]?.code, swapped.board[22]?.code], ['corn_1', 'grain_1']);
  assert.deepEqual({ ...swapped, board: state.board }, state, 'Only the two cells change.');
  // Flour and Dough make nothing, so the tied Dough stays blocked and the Flour stays in its cell.
  const blocked = createGame(data);
  assert.equal(rejected(blocked, { type: 'move', from: 13, to: 6 }).message, 'Merge a matching dish or a recipe partner into this blocked space.');
  // Mămăligă is a recipe part, but not of a recipe with Dough.
  const [partner, [cob]] = place(blocked, ['corn_4']);
  rejected(partner, { type: 'move', from: cob, to: 6 });
});

test('a failed merge changes nothing', () => {
  const [state, [first, second]] = place(pay(funded(), 3), ['corn_4', 'corn_4']);
  // Mămăligă is the last Corn dish, so two of them do not merge; it needs a recipe partner.
  assert.match(rejected(state, { type: 'move', from: first, to: second }).message, /final dish\. Deliver it to a neighbour, or cook it with a recipe partner\./);
  rejected(state, { type: 'move', from: first, to: 42 });
  rejected(state, { type: 'move', from: firstFreeBoardCell(state, data), to: first });
});

test('different items swap and empty cells accept items', () => {
  let state = openGame();
  state = act(state, { type: 'move', from: 1, to: 4 });
  assert.equal(state.board[1]?.code, 'generator_corn');
  assert.equal(state.board[4]?.code, 'generator_grain');
  state = act(state, { type: 'move', from: 4, to: 0 });
  assert.equal(state.board[4], null);
  assert.equal(state.board[0]?.code, 'generator_grain');
});

test('board-full failures retain state and a merge recovers space', () => {
  let state = fillBoard(openGame());
  assert.match(rejected(state, { type: 'spawn', index: 31 }).message, /Merge a pair or deliver a quest/);
  const flowers = state.board.flatMap((cell, index) => cell?.code === 'herbs_1' ? [index] : []);
  state = act(state, { type: 'move', from: flowers[0], to: flowers[1] });
  state = act(state, { type: 'spawn', index: 31 });
  assert.equal(state.board.includes(null), false);
});

test('a delivery takes each duplicate from its own cell', () => {
  let state = openGame();
  assert.deepEqual(questDeliveryCells(state, questWith([{ item: 'grain_1', quantity: 2 }]), data), [13, 14]);
  state.board[13] = null;
  assert.deepEqual(questDeliveryCells(state, questWith([{ item: 'grain_1', quantity: 2 }]), data), [14, -1]);
});

test('invalid, unknown, and unavailable actions do not change state', () => {
  const state = openGame();
  for (const action of [null, {}, { type: 'unknown' }, { type: 'task' }, { type: 'spawn', index: 13 }, { type: 'spawn', index: 1 },
    { type: 'move', from: 13, to: 13 }, { type: 'move', from: 13, to: 42 }, { type: 'move', from: -1, to: 0 },
    { type: 'move', from: 13, to: '14' }, { type: 'deliverQuest', id: 'absent' }, { type: 'deliverQuest', id: 'mara-welcome' }]) rejected(state, action as Action);
});

test('save validation rejects invalid numeric fields, codes, closed dishes, quest records, and unsupported versions', () => {
  // Some corruptions write a value that the GameState type does not admit.
  const corruptions: ((state: any) => void)[] = [
    state => { state.version = 1; }, state => { state.version = 13; }, state => { state.version = 15; }, state => { state.coins = -1_000_000_001; },
    state => { state.coins = 0.5; }, state => { state.taskIndex = 25; },
    state => { state.board.pop(); }, state => { state.board[0] = { code: '__proto__' }; },
    state => { state.board[0] = { code: 'grain_1', hidden: true }; },
    state => { state.board[0] = { code: 'bakery_1' }; know(state, 'bakery_1'); },
    state => { state.board[0] = { code: 'dairy_1' }; know(state, 'dairy_1'); },
    state => { state.board[0] = { code: 'mixed_bulz' }; know(state, 'mixed_bulz'); },
    state => { state.discovered.push(state.discovered[0]); },
    state => { state.decorations.push('task_1'); },
    state => { state.discovered = []; }, state => { state.completedQuests = null; },
    state => { state.completedQuests = ['absent']; }, state => { state.completedQuests = ['mara-table']; },
    state => { state.completedQuests = ['ana-night-ward-tea']; },
  ];
  for (const corrupt of corruptions) {
    const state = openGame();
    corrupt(state);
    assert.equal(validateGame(state, data), false, String(corrupt));
  }
  assert.equal(validateGame(null, data), false);
  assert.equal(validateGame([], data), false);
});

test('save validation rejects missing, duplicated, and premature generators', () => {
  let state = openGame();
  state.board[1] = null;
  assert.equal(validateGame(state, data), false);
  state = openGame();
  state.board[0] = { code: 'generator_grain' };
  assert.equal(validateGame(state, data), false);
  state = openGame();
  state.board[0] = { code: 'generator_dairy' };
  know(state, 'generator_dairy');
  assert.equal(validateGame(state, data), false);
});

test('a short purse names the missing coins, and a preparation that brings a new source says which source arrived and where it is', () => {
  const source = data.items.generator_dairy.name;
  assert.equal(rejected(withQuests(openGame()), { type: 'task' }).message, `Earn ${data.tasks[0].cost} more coins to pay for this preparation.`);
  const state = withQuests(pay(funded(), 2));
  assert.ok(reduceGame(state, { type: 'task' }, data).message.startsWith(`${data.tasks[2].title}: done. The ${source} is on the board.`));
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
  let state = withQuests({ ...openGame(), coins: data.tasks[0].cost });
  state = act(state, { type: 'task' });
  assert.equal(state.coins, 0);
  assert.deepEqual(resolveRooms(state.decorations, data), roomsAt(1));
  // The next preparation costs more than the empty purse: nothing is charged and nothing changes.
  rejected(withQuests(state), { type: 'task' });
  assert.deepEqual(state.decorations, ['task_1']);
});

test('fresh, mid-campaign, and completed saves resolve the same rooms after reload and export', () => {
  for (const count of [0, 12, 13, data.tasks.length]) {
    const state = pay(funded(), count);
    const reloaded = importSave<GameState>(JSON.stringify({ format: 'scary-snacks', version: 13, state: JSON.parse(JSON.stringify(state)) }), validate);
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
    content => { content.items.grain_1.price = 2; },
    content => { content.quests[1].reward = -1; },
    content => { content.quests[1].afterTask = 'task_24'; },
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
  for (const code of ['generator_grain', 'dairy_1']) {
    const content = structuredClone(data);
    content.board.initial[2] = code;
    assert.match(dataProblems(content).join(' '), /valid new game|source must be available exactly once/, code);
  }
});

test('data checks reject broken merge paths, item records, and source references before play', () => {
  const cases: [string, (content: GameData) => void][] = [
    ['unknown successor', content => { content.items.grain_1.next = 'absent'; }],
    ['locked successor', content => { content.items.grain_1.next = 'dairy_1'; }],
    ['cyclic successor', content => { content.items.grain_1.next = 'grain_1'; }],
    ['missing stage', content => { delete content.items.grain_6; }],
    ['mismatched ID', content => { content.items.grain_1.id = 'grain_2'; }],
    ['unknown chain', content => { content.items.grain_1.chain = 'absent'; }],
    ['missing base output', content => { content.items.generator_grain.generator!.outputs = []; }],
    ['locked base output', content => { content.items.generator_grain.generator!.outputs = ['dairy_1']; }],
    ['malformed free flag', content => { Object.assign(content.items.generator_grain.generator!, { free: 'yes' }); }],
    ['shared atlas cell', content => { content.items.grain_2.art = { ...content.items.grain_1.art }; }],
    ['unknown tag', content => { Object.assign(content.items.grain_1, { tags: ['gluten'] }); }],
    ['tagged source', content => { content.items.generator_grain.tags = ['dairy']; }],
    ['duplicate source unlock', content => { content.tasks[3].unlock = 'grain'; }],
    ['unknown source unlock', content => { content.tasks[3].unlock = 'absent'; }],
    ['missing source unlock', content => { delete content.tasks[2].unlock; }],
    ['malformed item', content => { Object.assign(content.items, { grain_1: null }); }],
  ];
  for (const [label, change] of cases) {
    const content = structuredClone(data);
    change(content);
    assert.ok(dataProblems(content).length, label);
  }
});

test('the chain check rejects a chain of three or seven dishes', () => {
  const short = structuredClone(data);
  delete short.items.fish_4;
  short.items.fish_3.next = null;
  assert.match(dataProblems(short).join(' '), /fish: needs a source and four to six food stages\./);
  const long = structuredClone(data);
  long.items.grain_7 = { ...long.items.grain_6, id: 'grain_7', name: 'Tall bread basket', stage: 7, art: { atlas: 'grain', cell: 7 } };
  long.items.grain_6.next = 'grain_7';
  assert.match(dataProblems(long).join(' '), /grain: needs a source and four to six food stages\./);
});

test('the recipe check rejects a recipe nested two levels, a pair with two results, a dish of more than three chains, a missing part tag, and a wrong part count', () => {
  const problems = (change: (content: GameData) => void) => {
    const content = structuredClone(data);
    change(content);
    return dataProblems(content).join(' ');
  };
  // Cozonac is made from Sweet dough, which is itself a mixed dish.
  assert.match(problems(content => addMixed(content, 'mixed_test', ['mixed_cozonac', 'grain_1'])), /mixed_test: invalid recipe parts or depth\./);
  // Dough and Cottage cheese already make Papanași, in either order.
  assert.match(problems(content => addMixed(content, 'mixed_test', ['dairy_3', 'grain_2'])), /mixed_test: each pair of parts makes at most one dish\./);
  // Cozonac uses Grain, Poultry, and Fruits; Lamb is a fourth chain.
  assert.match(problems(content => addMixed(content, 'mixed_test', ['mixed_cozonac', 'lamb_1'])), /mixed_test: a mixed dish uses at most three chains\./);
  // Telemea is a dairy dish, so Bulz has the dairy tag.
  assert.match(problems(content => { content.items.mixed_bulz.tags = []; }), /mixed_bulz: a mixed dish has every tag of its parts\./);
  assert.match(problems(content => { Object.assign(content.items.mixed_bulz, { recipe: ['corn_4', 'dairy_4', 'grain_1'] }); }), /mixed_bulz: a mixed dish needs two known parts\./);
  assert.match(problems(content => { content.items.mixed_bulz.recipe = ['corn_4', 'corn_3']; }), /mixed_bulz: invalid recipe parts or depth\./);
});

test('a mixed dish can be a part of two recipes, and the authored recipes pass the check', () => {
  const uses = Object.values(data.items).filter(item => item.recipe?.includes('mixed_sweet-dough')).map(item => item.id).sort();
  assert.deepEqual(uses, ['mixed_chimney-cake', 'mixed_cozonac']);
  assert.deepEqual(dataProblems(data), []);
  for (const item of Object.values(data.items)) if (item.recipe) {
    const chains = new Set(item.recipe.flatMap(part => data.items[part].recipe ? data.items[part].recipe!.map(inner => data.items[inner].chain) : [data.items[part].chain]));
    assert.ok(chains.size >= 2 && chains.size <= 3, item.id);
    for (const part of item.recipe) for (const tag of data.items[part].tags) assert.ok(item.tags.includes(tag), `${item.id} has ${tag}.`);
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
