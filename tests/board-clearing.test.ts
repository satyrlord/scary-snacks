import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { boardLayoutProblems, canServe, createGame, firstFreeBoardCell, freeBoardCells, migrateBoardGame, migrateQuestGame, reduceGame,
  servedCells, unresolvedObstacle, validateBoardGame, validateGame, validateQuestGame } from '../src/engine.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';
import { exportSave, importSave, loadSave, saveGame, SAVE_KEY } from '../src/storage.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const start = () => createGame(data);
function apply(state: GameState, action: Action) {
  const result = reduceGame(state, action, data);
  assert.equal(result.ok, true, result.message);
  assert.equal(validateGame(result.state, data), true);
  return result.state;
}
function rejected(state: GameState, action: Action) {
  const before = structuredClone(state);
  const result = reduceGame(state, action, data);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.deepEqual(state, before);
}

test('new games reserve eight obstacle cells and discover visible anchors only', () => {
  const state = start();
  assert.equal(state.layoutId, 'workbench-clutter-1');
  assert.equal(state.version, 8);
  assert.equal(freeBoardCells(state, data), 27);
  assert.equal(firstFreeBoardCell(state, data), 2);
  assert.deepEqual([0, 5, 6, 11, 36, 37, 40, 41].map(index => unresolvedObstacle(state, index, data)?.type),
    ['clutter', 'clutter', 'anchored', 'anchored', 'clutter', 'anchored', 'anchored', 'clutter']);
  assert.ok(state.discovered.includes('bakery_2'));
  assert.ok(!state.discovered.includes('bakery_3'));
  assert.equal(validateGame(state, data), true);
});

test('matching an anchor releases it and its neighbouring wrapper in one merge', () => {
  const state = start();
  state.board[7] = { code: 'bakery_2' };
  const before = structuredClone(state);
  const result = reduceGame(state, { type: 'move', from: 7, to: 6 }, data);
  assert.equal(result.ok, true);
  assert.equal(result.event, 'merge');
  assert.equal(result.state.board[6]?.code, 'bakery_3');
  assert.equal(result.state.board[0]?.code, 'bakery_3');
  assert.equal(result.state.board[7], null);
  assert.deepEqual(result.state.resolvedObstacles, ['tied-dough', 'old-crate']);
  assert.equal(result.state.merges, before.merges + 1);
  assert.equal(result.state.xp, before.xp + 1);
  assert.equal(result.state.seed, before.seed);
  assert.equal(result.state.discovered.filter(code => code === 'bakery_3').length, 1);
  assert.equal(validateGame(result.state, data), true);
  assert.deepEqual(state, before);
  assert.equal(unresolvedObstacle(result.state, 0, data), null);
  assert.equal(unresolvedObstacle(result.state, 6, data), null);
});

test('destination side contact clears clutter; source side and diagonal contact do not', () => {
  const state = start();
  state.board[24] = { code: 'bakery_1' };
  state.board[30] = { code: 'bakery_1' };
  const cleared = apply(state, { type: 'move', from: 24, to: 30 });
  assert.equal(cleared.board[36]?.code, 'drinks_2');
  assert.ok(cleared.resolvedObstacles.includes('covered-crock'));
  assert.ok(!cleared.resolvedObstacles.includes('linen-bundle'));
  assert.ok(!cleared.resolvedObstacles.includes('tied-elderflowers'));

  const reverse = apply(state, { type: 'move', from: 30, to: 24 });
  assert.equal(reverse.board[36], null);
  assert.deepEqual(reverse.resolvedObstacles, []);
  const diagonal = start();
  diagonal.board[8] = { code: 'bakery_1' };
  diagonal.board[14] = { code: 'bakery_1' };
  const merged = apply(diagonal, { type: 'move', from: 8, to: 14 });
  assert.equal(merged.board[0], null);
  assert.deepEqual(merged.resolvedObstacles, []);
});

test('one merge reveals several wrappers without a cascade on a full pantry', () => {
  const content = structuredClone(data);
  content.board.layouts[1].obstacles.push(...[19, 21, 25, 26].map((position, index) =>
    ({ id: `extra-${index}`, position, name: 'Old bundle', type: 'clutter' as const, ingredient: 'bakery_2' })));
  assert.deepEqual(boardLayoutProblems(content), []);
  const state = createGame(content);
  state.board[20] = { code: 'bakery_1' };
  state.inventory = Array.from({ length: content.inventoryCapacity }, () => ({ code: 'bakery_1' }));
  state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, content) ? cell : { code: 'bakery_1' });
  assert.equal(firstFreeBoardCell(state, content), -1);
  const result = reduceGame(state, { type: 'move', from: 14, to: 20 }, content);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.state.merges, 1);
  assert.equal(result.state.xp, 1);
  assert.deepEqual([19, 21, 26].map(index => result.state.board[index]?.code), ['bakery_2', 'bakery_2', 'bakery_2']);
  assert.equal(result.state.board[25], null, 'A reveal cannot clear its own neighbour.');
  assert.equal(result.state.inventory.length, content.inventoryCapacity);
  assert.equal(validateGame(result.state, content), true);
});

test('anchors and wrappers reject ordinary item actions without changing the seed', () => {
  const state = start();
  state.board[7] = { code: 'bakery_1' };
  for (const action of [
    { type: 'move', from: 7, to: 6 }, { type: 'move', from: 7, to: 0 },
    { type: 'move', from: 6, to: 7 }, { type: 'store', index: 6 }, { type: 'sell', index: 6 },
  ] as Action[]) rejected(state, action);
  assert.equal(state.seed, start().seed);
  assert.deepEqual(state.resolvedObstacles, []);
  const order = { requirements: ['bakery_2'] };
  assert.equal(canServe(state, order, data), false);
  assert.deepEqual(servedCells(state, order, data), [-1]);
});

test('blocked null cells do not provide placement or preparation space', () => {
  const state = start();
  state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, data) ? cell : { code: 'bakery_1' });
  assert.equal(validateGame(state, data), true);
  assert.equal(freeBoardCells(state, data), 0);
  assert.equal(firstFreeBoardCell(state, data), -1);
  rejected(state, { type: 'spawn', index: 1 });
  const stored = apply(state, { type: 'store', index: 2 });
  assert.equal(firstFreeBoardCell(stored, data), 2);
  const returned = apply(stored, { type: 'retrieve', index: 0 });
  assert.equal(returned.board[2]?.code, 'bakery_1');
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

test('state six conversion keeps every occupied cell on an open layout', () => {
  const current = start();
  const { layoutId: _layout, resolvedObstacles: _resolved, pendingScenes: _scenes, ...older } = current;
  const state = { ...older, version: 6 as const };
  assert.equal(validateQuestGame(state, data), true);
  const migrated = migrateQuestGame(state, data);
  assert.equal(migrated.layoutId, 'legacy-open');
  assert.deepEqual(migrated.resolvedObstacles, []);
  assert.deepEqual(migrated.board, state.board);
  assert.equal(validateBoardGame(migrated, data), true);
  assert.equal(freeBoardCells(migrateBoardGame(migrated, data), data), 35);
  assert.deepEqual(migrateQuestGame(state, data), migrated);
});

test('open, partly cleared, and fully cleared boards survive export, import, and reload', () => {
  const open = start();
  open.board[7] = { code: 'bakery_2' };
  open.board[10] = { code: 'warm_1' };
  open.board[38] = { code: 'drinks_1' };
  open.board[39] = { code: 'warm_2' };
  const partial = apply(open, { type: 'move', from: 7, to: 6 });
  const full = apply(apply(apply(partial, { type: 'move', from: 10, to: 11 }),
    { type: 'move', from: 38, to: 37 }), { type: 'move', from: 39, to: 40 });
  assert.equal(full.resolvedObstacles.length, 8);
  for (const state of [open, partial, full]) {
    const validate = (candidate: unknown) => validateGame(candidate, data);
    const text = exportSave(state, validate);
    assert.deepEqual(importSave(text, validate), state);
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    };
    assert.equal(saveGame(storage, state, validate).ok, true);
    assert.equal(values.get(SAVE_KEY), text);
    assert.deepEqual(loadSave(storage, validate).state, state);
  }
});

test('layout data rejects duplicate positions, unknown ingredients, and trapped clutter', () => {
  const duplicate = structuredClone(data);
  duplicate.board.layouts[1].obstacles[1].position = 0;
  assert.ok(boardLayoutProblems(duplicate).length);
  const unknown = structuredClone(data);
  unknown.board.layouts[1].obstacles[1].ingredient = null as unknown as string;
  assert.ok(boardLayoutProblems(unknown).length);
  const trapped = structuredClone(data);
  trapped.board.initial[13] = null;
  trapped.board.layouts[1].obstacles.push(
    { id: 'center', position: 19, name: 'Center', type: 'clutter', ingredient: 'bakery_1' },
    ...[13, 18, 20, 25].map((position, index) => ({ id: `wall-${index}`, position, name: 'Clutter', type: 'clutter' as const, ingredient: 'bakery_1' })),
  );
  assert.ok(boardLayoutProblems(trapped).some(problem => /without a free side/.test(problem)));
});
