import test from 'node:test';
import assert from 'node:assert/strict';
import { canDeliverQuest, firstFreeBoardCell, freeBoardCells, questDeliveryCells, unresolvedObstacle } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import { boardLayoutProblems } from '../src/content.ts';
import type { Action } from '../src/model.ts';
import { exportSave, importSave, loadSave, saveGame, SAVE_KEY } from '../src/storage.ts';
import { act, data, memoryStorage, rejected, validate } from './support.ts';

const start = () => createGame(data);

test('new games reserve eight obstacle cells and leave the blocked ingredients undiscovered', () => {
  const state = start();
  assert.equal(state.layoutId, 'workbench-clutter-1');
  assert.equal(state.version, 12);
  assert.equal(freeBoardCells(state, data), 27);
  assert.equal(firstFreeBoardCell(state, data), 2);
  assert.deepEqual([0, 5, 6, 11, 36, 37, 40, 41].map(index => unresolvedObstacle(state, index, data)?.type),
    ['clutter', 'clutter', 'anchored', 'anchored', 'clutter', 'anchored', 'anchored', 'clutter']);
  for (const code of ['bakery_2', 'bakery_3', 'warm_2', 'drinks_2']) assert.ok(!state.discovered.includes(code), code);
  assert.equal(validateGame(state, data), true);
});

test('matching a blocked ingredient merges it without clearing its neighbour', () => {
  const state = start();
  state.board[7] = { code: 'bakery_2' };
  state.discovered.push('bakery_2');
  const before = structuredClone(state);
  const result = reduceGame(state, { type: 'move', from: 7, to: 6 }, data);
  assert.equal(result.ok, true);
  assert.equal(result.event, 'merge');
  assert.equal(result.state.board[6]?.code, 'bakery_3');
  assert.equal(result.state.board[7], null);
  assert.deepEqual(result.state.resolvedObstacles, ['tied-dough']);
  assert.equal(result.state.discovered.filter(code => code === 'bakery_3').length, 1);
  assert.equal(validateGame(result.state, data), true);
  assert.deepEqual(state, before);
  assert.equal(unresolvedObstacle(result.state, 0, data)?.id, 'old-crate');
  assert.equal(unresolvedObstacle(result.state, 6, data), null);
});

test('merges beside blockers do not clear them from any side', () => {
  const state = start();
  state.board[24] = { code: 'bakery_1' };
  state.board[30] = { code: 'bakery_1' };
  const cleared = act(state, { type: 'move', from: 24, to: 30 });
  assert.ok(unresolvedObstacle(cleared, 36, data));
  assert.ok(!cleared.resolvedObstacles.includes('covered-crock'));
  assert.ok(!cleared.resolvedObstacles.includes('linen-bundle'));
  assert.ok(!cleared.resolvedObstacles.includes('tied-elderflowers'));

  const reverse = act(state, { type: 'move', from: 30, to: 24 });
  assert.ok(unresolvedObstacle(reverse, 36, data));
  assert.deepEqual(reverse.resolvedObstacles, []);
  const diagonal = start();
  diagonal.board[8] = { code: 'bakery_1' };
  diagonal.board[14] = { code: 'bakery_1' };
  const merged = act(diagonal, { type: 'move', from: 8, to: 14 });
  assert.equal(unresolvedObstacle(merged, 0, data)?.id, 'old-crate');
  assert.deepEqual(merged.resolvedObstacles, []);
});

test('each blocker accepts only its matching ingredient, even on a full board', () => {
  for (const obstacle of data.board.layouts[0].obstacles) {
    const state = start();
    state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, data) ? cell : { code: 'bakery_1' });
    state.board[7] = { code: obstacle.ingredient };
    if (!state.discovered.includes(obstacle.ingredient)) state.discovered.push(obstacle.ingredient);
    assert.equal(firstFreeBoardCell(state, data), -1);
    const result = reduceGame(state, { type: 'move', from: 7, to: obstacle.position }, data);
    assert.equal(result.ok, true, result.message);
    assert.equal(result.event, 'merge');
    assert.equal(result.state.board[obstacle.position]?.code, data.items[obstacle.ingredient].next);
    assert.equal(result.state.board[7], null);
    assert.deepEqual(result.state.resolvedObstacles, [obstacle.id]);
    assert.equal(validateGame(result.state, data), true);
  }
});

test('clutter and anchored blockers reject ordinary item actions and never count toward a delivery', () => {
  const state = start();
  state.board[7] = { code: 'bakery_1' };
  for (const action of [
    { type: 'move', from: 7, to: 6 }, { type: 'move', from: 7, to: 0 },
    { type: 'move', from: 6, to: 7 },
  ] as Action[]) rejected(state, action);
  assert.deepEqual(state.resolvedObstacles, []);
  // The covered socată and the tied elderflowers are on the board, but the welcome drink cannot use them.
  const welcome = data.quests.find(quest => quest.id === 'mara-welcome')!;
  assert.deepEqual(welcome.requirements, [{ item: 'drinks_2', quantity: 1 }]);
  assert.deepEqual(questDeliveryCells(state, welcome, data), [-1]);
  assert.equal(canDeliverQuest(state, welcome, data), false);
  rejected(state, { type: 'deliverQuest', id: welcome.id });
});

test('blocked null cells do not provide placement or preparation space', () => {
  const state = start();
  state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, data) ? cell : { code: 'bakery_1' });
  assert.equal(validateGame(state, data), true);
  assert.equal(freeBoardCells(state, data), 0);
  assert.equal(firstFreeBoardCell(state, data), -1);
  rejected(state, { type: 'spawn', index: 1 });
  const merged = act(state, { type: 'move', from: 2, to: 3 });
  assert.equal(firstFreeBoardCell(merged, data), 2);
  const produced = act(merged, { type: 'spawn', index: 1 });
  assert.equal(produced.board[2]?.code, 'bakery_1');
});

test('resolved IDs and blocked cell contents are validated', () => {
  const state = start();
  for (const change of [
    { layoutId: 'unknown' }, { resolvedObstacles: ['unknown'] },
    { resolvedObstacles: ['old-crate', 'old-crate'] },
    { board: Object.assign([...state.board], { 0: { code: 'bakery_1' } }) },
    { resolvedObstacles: ['old-crate'], discovered: state.discovered.filter(code => code !== 'bakery_3') },
  ]) assert.equal(validateGame({ ...state, ...change }, data), false);
});

test('open, partly cleared, and fully cleared boards survive export, import, and reload', () => {
  const open = start();
  open.board[7] = { code: 'bakery_2' };
  open.discovered.push('bakery_2');
  const partial = act(open, { type: 'move', from: 7, to: 6 });
  let full = structuredClone(partial);
  for (const obstacle of data.board.layouts[0].obstacles.filter(obstacle => !full.resolvedObstacles.includes(obstacle.id))) {
    full.board[7] = { code: obstacle.ingredient };
    if (!full.discovered.includes(obstacle.ingredient)) full.discovered.push(obstacle.ingredient);
    full = act(full, { type: 'move', from: 7, to: obstacle.position });
  }
  assert.equal(full.resolvedObstacles.length, 8);
  for (const state of [open, partial, full]) {
    const text = exportSave(state, validate);
    assert.deepEqual(importSave(text, validate), state);
    const storage = memoryStorage();
    assert.equal(saveGame(storage, state, validate).ok, true);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.deepEqual(loadSave(storage, validate).state, state);
  }
});

test('layout data rejects invalid content and clutter without its art cell, but permits blockers surrounded by blockers', () => {
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
  const trapped = structuredClone(data);
  trapped.board.initial[13] = null;
  trapped.board.layouts[0].obstacles.push(
    { id: 'center', position: 19, name: 'Center', type: 'clutter', ingredient: 'bakery_1', sprite: 0 },
    ...[13, 18, 20, 25].map((position, index) => ({ id: `wall-${index}`, position, name: 'Clutter', type: 'clutter' as const, ingredient: 'bakery_1', sprite: 0 })),
  );
  assert.deepEqual(boardLayoutProblems(trapped), []);
  assert.equal(validateGame(createGame(trapped), trapped), true);
});

test('visible blockers never discover their ingredients, so the recipe book keeps those dishes covered', () => {
  const hidden = data.board.layouts[0].obstacles.map(obstacle => obstacle.ingredient).filter(code => !data.board.initial.includes(code));
  let state = start();
  for (const action of [{ type: 'spawn', index: 1 }, { type: 'move', from: 2, to: 3 }] as Action[]) {
    state = act(state, action);
    for (const code of hidden.filter(code => !state.board.some(cell => cell?.code === code))) assert.ok(!state.discovered.includes(code), code);
  }
});

test('a save that already lists a blocked ingredient stays valid and keeps that discovery', () => {
  const state = start();
  state.discovered.push('bakery_3');
  assert.deepEqual(importSave(exportSave(state, validate), validate), state);
  assert.ok(act(state, { type: 'spawn', index: 1 }).discovered.includes('bakery_3'));
});
