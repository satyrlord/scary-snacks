import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeliverQuest, firstFreeBoardCell, freeBoardCells, questDeliveryCells, requiredQuests, resolveQuests, unresolvedObstacle } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import { boardLayoutProblems } from '../src/content.ts';
import type { Action, GameState } from '../src/model.ts';
import { exportSave, importSave, loadSave, saveGame, SAVE_KEY } from '../src/storage.ts';
import { act, data, memoryStorage, rejected, validate, know } from './support.ts';

const start = () => createGame(data);
const refusal = 'Merge a matching dish or a recipe partner into this blocked space.';
/** A new-game board after the Dairy source opens with preparation 3, with no preparation blockers. */
function dairyOpen(): GameState {
  const state = start();
  Object.assign(state, { taskIndex: 3, preparationObstacles: { start: 3, placed: [] } });
  state.decorations = data.tasks.slice(0, 3).map(task => task.id);
  state.completedQuests = requiredQuests(3, data).map(quest => quest.id);
  state.board[2] = { code: 'generator_dairy' };
  know(state, 'generator_dairy');
  assert.equal(validate(state), true);
  return state;
}

test('new games reserve eight obstacle cells, and know only their board and the dishes of their tickets', () => {
  const state = start();
  assert.equal(state.layoutId, 'workbench-clutter-1');
  assert.equal(state.version, 14);
  assert.equal(state.coins, 0);
  assert.equal(freeBoardCells(state, data), 26);
  assert.equal(firstFreeBoardCell(state, data), 2);
  assert.deepEqual([0, 5, 6, 11, 36, 37, 40, 41].map(index => unresolvedObstacle(state, index, data)?.type),
    ['clutter', 'clutter', 'anchored', 'anchored', 'clutter', 'anchored', 'anchored', 'clutter']);
  assert.deepEqual([0, 5, 6, 11, 36, 37, 40, 41].map(index => unresolvedObstacle(state, index, data)?.ingredient),
    ['grain_3', 'corn_2', 'grain_2', 'corn_1', 'herbs_2', 'herbs_1', 'corn_2', 'grain_2']);
  // A blocker never discovers its dish. A quest that holds a ticket puts its dishes in the recipe book.
  const tickets = resolveQuests(state, data).filter(view => view.status === 'active').flatMap(view => view.quest.requirements.map(({ item }) => item));
  assert.deepEqual(new Set(state.discovered), new Set([...data.board.initial.filter(code => code !== null), ...tickets]));
  assert.equal(validateGame(state, data), true);
});

test('matching a blocked ingredient merges it, clears only its own blocker, and gives one coin', () => {
  const state = start();
  state.board[7] = { code: 'grain_2' };
  know(state, 'grain_2');
  const before = structuredClone(state);
  const result = reduceGame(state, { type: 'move', from: 7, to: 6 }, data);
  assert.equal(result.ok, true);
  assert.equal(result.event, 'merge');
  assert.equal(result.state.board[6]?.code, 'grain_3');
  assert.equal(result.state.board[7], null);
  assert.deepEqual(result.state.resolvedObstacles, ['tied-dough']);
  assert.equal(result.state.coins, state.coins + data.economy.blockerCoin);
  assert.match(result.message, /The blocker is cleared: \+1 coin\.$/);
  assert.equal(result.state.discovered.filter(code => code === 'grain_3').length, 1);
  assert.equal(validateGame(result.state, data), true);
  assert.deepEqual(state, before);
  assert.equal(unresolvedObstacle(result.state, 0, data)?.id, 'old-crate');
  assert.equal(unresolvedObstacle(result.state, 6, data), null);
});

test('a recipe partner clears a blocker, leaves the mixed dish in the blocked cell, and gives one coin', () => {
  const state = dairyOpen();
  state.board[7] = { code: 'dairy_3' };
  know(state, 'dairy_3', 'grain_2');
  const result = reduceGame(state, { type: 'move', from: 7, to: 6 }, data);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.event, 'merge');
  assert.equal(result.state.board[6]?.code, 'mixed_papanasi');
  assert.equal(result.state.board[7], null);
  assert.deepEqual(result.state.resolvedObstacles, ['tied-dough']);
  assert.equal(result.state.coins, state.coins + 1);
  assert.ok(result.state.discovered.includes('mixed_papanasi'));
  assert.equal(result.message, `${data.items['mixed_papanasi'].name} is a new dish! It is in the recipe book now. The blocker is cleared: +1 coin.`);
  assert.equal(validateGame(result.state, data), true);
  assert.equal(unresolvedObstacle(result.state, 6, data), null);
  assert.equal(unresolvedObstacle(result.state, 41, data)?.id, 'linen-bundle');
});

test('a recipe partner clears a blocker, the clear discovers only the mixed dish, and the game still saves', () => {
  const state = start();
  Object.assign(state, { taskIndex: 5, preparationObstacles: { start: 5, placed: [] } });
  state.decorations = data.tasks.slice(0, 5).map(task => task.id);
  state.completedQuests = requiredQuests(5, data).map(quest => quest.id);
  state.board[2] = { code: 'generator_dairy' }; state.board[3] = { code: 'generator_poultry' }; state.board[7] = { code: 'poultry_1' };
  know(state, 'generator_dairy', 'generator_poultry', 'poultry_1');
  const result = reduceGame(state, { type: 'move', from: 7, to: 6 }, data);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.state.board[6]?.code, 'mixed_sweet-dough');
  assert.ok(result.state.resolvedObstacles.includes('tied-dough'));
  assert.deepEqual(result.state.discovered, [...state.discovered, 'mixed_sweet-dough'], 'A blocker never discovers its own dish.');
  assert.equal(validateGame(result.state, data), true);
  assert.equal(saveGame(memoryStorage(), result.state, validate).ok, true);
});

test('a blocked dish refuses a dish that does not merge with it and changes nothing', () => {
  const state = dairyOpen();
  state.board[7] = { code: 'dairy_1' };
  know(state, 'dairy_1');
  // Milk is a dish of an open chain, but it is no recipe partner of Dough. Corn, herbs, flour, a loaf, and a source do not merge with it either.
  for (const code of ['dairy_1', 'corn_1', 'herbs_1', 'grain_1', 'grain_3']) {
    const blocked = structuredClone(state);
    blocked.board[7] = { code };
    if (!blocked.discovered.includes(code)) know(blocked, code);
    assert.equal(rejected(blocked, { type: 'move', from: 7, to: 6 }).message, refusal, code);
  }
  assert.equal(rejected(state, { type: 'move', from: 1, to: 6 }).message, refusal);
  assert.equal(rejected(state, { type: 'move', from: 7, to: 0 }).message, refusal);
  assert.deepEqual(state.resolvedObstacles, []);
  assert.equal(state.coins, 0);
});

test('merges beside blockers do not clear them from any side', () => {
  const state = start();
  state.board[24] = { code: 'grain_1' };
  state.board[30] = { code: 'grain_1' };
  const cleared = act(state, { type: 'move', from: 24, to: 30 });
  assert.ok(unresolvedObstacle(cleared, 36, data));
  assert.ok(!cleared.resolvedObstacles.includes('covered-crock'));
  assert.ok(!cleared.resolvedObstacles.includes('linen-bundle'));
  assert.ok(!cleared.resolvedObstacles.includes('tied-elderflowers'));
  assert.equal(cleared.coins, 0);

  const reverse = act(state, { type: 'move', from: 30, to: 24 });
  assert.ok(unresolvedObstacle(reverse, 36, data));
  assert.deepEqual(reverse.resolvedObstacles, []);
  const diagonal = start();
  diagonal.board[8] = { code: 'grain_1' };
  const merged = act(diagonal, { type: 'move', from: 8, to: 14 });
  assert.equal(unresolvedObstacle(merged, 0, data)?.id, 'old-crate');
  assert.deepEqual(merged.resolvedObstacles, []);
  assert.equal(merged.coins, 0);
});

test('each starting blocker clears with its matching dish, even on a full board', () => {
  for (const obstacle of data.board.layouts[0].obstacles) {
    const state = start();
    state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, data) ? cell : { code: 'grain_1' });
    state.board[7] = { code: obstacle.ingredient };
    if (!state.discovered.includes(obstacle.ingredient)) know(state, obstacle.ingredient);
    assert.equal(firstFreeBoardCell(state, data), -1);
    const result = reduceGame(state, { type: 'move', from: 7, to: obstacle.position }, data);
    assert.equal(result.ok, true, result.message);
    assert.equal(result.event, 'merge');
    assert.equal(result.state.board[obstacle.position]?.code, data.items[obstacle.ingredient].next);
    assert.equal(result.state.board[7], null);
    assert.deepEqual(result.state.resolvedObstacles, [obstacle.id]);
    assert.equal(result.state.coins, 1);
    assert.equal(validateGame(result.state, data), true);
  }
});

test('clutter and anchored blockers reject ordinary item actions and never count toward a delivery', () => {
  const state = start();
  state.board[7] = { code: 'grain_1' };
  for (const action of [
    { type: 'move', from: 7, to: 6 }, { type: 'move', from: 7, to: 0 },
    { type: 'move', from: 6, to: 7 },
  ] as Action[]) rejected(state, action);
  assert.deepEqual(state.resolvedObstacles, []);
  // The tied dough and the linen bundle hold Dough, but the first ride cannot use them.
  const ride = data.quests.find(quest => quest.id === 'sorin-first-ride')!;
  assert.deepEqual(ride.requirements.filter(requirement => requirement.item === 'grain_2'), [{ item: 'grain_2', quantity: 2 }]);
  for (const { item } of ride.requirements.filter(requirement => requirement.item !== 'grain_2')) {
    state.board[state.board.indexOf(null, 8)] = { code: item };
    if (!state.discovered.includes(item)) know(state, item);
  }
  const cells = questDeliveryCells(state, ride, data);
  assert.deepEqual(ride.requirements.flatMap(({ item, quantity }) => Array<boolean>(quantity).fill(item === 'grain_2')),
    cells.map(index => index === -1));
  assert.equal(canDeliverQuest(state, ride, data), false);
  rejected(state, { type: 'deliverQuest', id: ride.id });
});

test('blocked null cells do not provide placement or preparation space', () => {
  const state = start();
  state.coins = 5;
  state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, data) ? cell : { code: 'grain_1' });
  assert.equal(validateGame(state, data), true);
  assert.equal(freeBoardCells(state, data), 0);
  assert.equal(firstFreeBoardCell(state, data), -1);
  assert.match(rejected(state, { type: 'spawn', index: 1 }).message, /board is full/);
  const merged = act(state, { type: 'move', from: 2, to: 3 });
  assert.equal(firstFreeBoardCell(merged, data), 2);
  const produced = act(merged, { type: 'spawn', index: 1 });
  assert.equal(produced.board[2]?.code, 'grain_1');
  assert.equal(produced.coins, 5 - data.economy.takeCost);
});

test('resolved IDs and blocked cell contents are validated', () => {
  const state = start();
  for (const change of [
    { layoutId: 'unknown' }, { resolvedObstacles: ['unknown'] },
    { resolvedObstacles: ['old-crate', 'old-crate'] },
    { board: Object.assign([...state.board], { 0: { code: 'grain_1' } }) },
    { resolvedObstacles: ['old-crate'], discovered: state.discovered.filter(code => code !== 'grain_3') },
  ]) assert.equal(validateGame({ ...state, ...change }, data), false);
});

test('open, partly cleared, and fully cleared boards survive export, import, and reload', () => {
  const open = start();
  open.board[7] = { code: 'grain_2' };
  know(open, 'grain_2');
  const partial = act(open, { type: 'move', from: 7, to: 6 });
  let full = structuredClone(partial);
  for (const obstacle of data.board.layouts[0].obstacles.filter(obstacle => !full.resolvedObstacles.includes(obstacle.id))) {
    full.board[7] = { code: obstacle.ingredient };
    if (!full.discovered.includes(obstacle.ingredient)) know(full, obstacle.ingredient);
    full = act(full, { type: 'move', from: 7, to: obstacle.position });
  }
  assert.equal(full.resolvedObstacles.length, 8);
  assert.equal(full.coins, 8);
  for (const state of [open, partial, full]) {
    const text = exportSave(state, validate);
    assert.deepEqual(importSave(text, validate), state);
    const storage = memoryStorage();
    assert.equal(saveGame(storage, state, validate).ok, true);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.deepEqual(loadSave(storage, validate).state, state);
  }
});

test('layout data rejects invalid content, clutter without its art cell, and a blocked dish without a merge partner, but permits blockers surrounded by blockers', () => {
  const duplicate = structuredClone(data);
  duplicate.board.layouts[0].obstacles[1].position = 0;
  assert.ok(boardLayoutProblems(duplicate).length);
  const unknown = structuredClone(data);
  unknown.board.layouts[0].obstacles[1].ingredient = null as unknown as string;
  assert.ok(boardLayoutProblems(unknown).length);
  const badSprite = structuredClone(data);
  badSprite.board.layouts[0].obstacles[0].sprite = 99;
  assert.ok(boardLayoutProblems(badSprite).length);
  const noSprite = structuredClone(data);
  delete noSprite.board.layouts[0].obstacles[0].sprite;
  assert.ok(boardLayoutProblems(noSprite).length);
  const badAtlas = structuredClone(data);
  Object.assign(badAtlas.board.layouts[0].obstacles[0], { atlas: 'absent' });
  assert.ok(boardLayoutProblems(badAtlas).length);
  // Linen tea is a last dish with no recipe, so nothing could clear it. Mămăligă is a last dish with recipe partners.
  const noPartner = structuredClone(data);
  noPartner.board.layouts[0].obstacles[0].ingredient = 'herbs_4';
  assert.ok(boardLayoutProblems(noPartner).length);
  const closedChain = structuredClone(data);
  closedChain.board.layouts[0].obstacles[0].ingredient = 'dairy_1';
  assert.ok(boardLayoutProblems(closedChain).length);
  const recipePart = structuredClone(data);
  recipePart.board.layouts[0].obstacles[0].ingredient = 'corn_4';
  assert.deepEqual(boardLayoutProblems(recipePart), []);
  const trapped = structuredClone(data);
  trapped.board.initial[13] = null;
  trapped.board.layouts[0].obstacles.push(
    { id: 'center', position: 19, name: 'Center', type: 'clutter', ingredient: 'grain_1', sprite: 0 },
    ...[13, 18, 20, 25].map((position, index) => ({ id: `wall-${index}`, position, name: 'Clutter', type: 'clutter' as const, ingredient: 'grain_1', sprite: 0 })),
  );
  assert.deepEqual(boardLayoutProblems(trapped), []);
  assert.equal(validateGame(createGame(trapped), trapped), true);
});

test('visible blockers never discover their ingredients: only a dish on the board or on a ticket enters the recipe book', () => {
  const hidden = data.board.layouts[0].obstacles.map(obstacle => obstacle.ingredient).filter(code => !data.board.initial.includes(code));
  assert.deepEqual([...new Set(hidden)].sort(), ['corn_2', 'grain_2', 'grain_3', 'herbs_2']);
  let state = { ...start(), coins: 5 };
  for (const action of [{ type: 'spawn', index: 1 }, { type: 'move', from: 2, to: 3 }, { type: 'spawn', index: 31 }] as Action[]) {
    const known = new Set(state.discovered);
    state = act(state, action);
    const tickets = resolveQuests(state, data).filter(view => view.status === 'active').flatMap(view => view.quest.requirements.map(({ item }) => item));
    for (const code of state.discovered.filter(code => !known.has(code))) assert.ok(state.board.some(cell => cell?.code === code) || tickets.includes(code), code);
  }
});

test('a save that already lists a blocked ingredient stays valid and keeps that discovery', () => {
  const state = { ...start(), coins: 1 };
  know(state, 'grain_3');
  assert.deepEqual(importSave(exportSave(state, validate), validate), state);
  assert.ok(act(state, { type: 'spawn', index: 1 }).discovered.includes('grain_3'));
});
