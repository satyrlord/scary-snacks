import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { boardLayoutProblems, canDeliverQuest, createGame, firstFreeBoardCell, freeBoardCells, questDeliveryCells, reduceGame,
  unresolvedObstacle, validateGame } from '../src/engine.ts';
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

test('new games reserve eight obstacle cells and discover every visible blocked ingredient', () => {
  const state = start();
  assert.equal(state.layoutId, 'workbench-clutter-1');
  assert.equal(state.version, 10);
  assert.equal(freeBoardCells(state, data), 27);
  assert.equal(firstFreeBoardCell(state, data), 2);
  assert.deepEqual([0, 5, 6, 11, 36, 37, 40, 41].map(index => unresolvedObstacle(state, index, data)?.type),
    ['clutter', 'clutter', 'anchored', 'anchored', 'clutter', 'anchored', 'anchored', 'clutter']);
  assert.ok(state.discovered.includes('bakery_2'));
  assert.ok(state.discovered.includes('bakery_3'));
  assert.equal(validateGame(state, data), true);
});

test('matching a blocked ingredient merges it without clearing its neighbour', () => {
  const state = start();
  state.board[7] = { code: 'bakery_2' };
  const before = structuredClone(state);
  const result = reduceGame(state, { type: 'move', from: 7, to: 6 }, data);
  assert.equal(result.ok, true);
  assert.equal(result.event, 'merge');
  assert.equal(result.state.board[6]?.code, 'bakery_3');
  assert.equal(result.state.board[0], null);
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
  const cleared = apply(state, { type: 'move', from: 24, to: 30 });
  assert.equal(cleared.board[36], null);
  assert.ok(!cleared.resolvedObstacles.includes('covered-crock'));
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

test('each blocker accepts only its matching ingredient, even on a full board', () => {
  for (const obstacle of data.board.layouts[0].obstacles) {
    const state = start();
    state.board = state.board.map((cell, index) => cell || unresolvedObstacle(state, index, data) ? cell : { code: 'bakery_1' });
    state.board[7] = { code: obstacle.ingredient };
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

test('anchors and wrappers reject ordinary item actions and never count toward a delivery', () => {
  const state = start();
  state.board[7] = { code: 'bakery_1' };
  for (const action of [
    { type: 'move', from: 7, to: 6 }, { type: 'move', from: 7, to: 0 },
    { type: 'move', from: 6, to: 7 }, { type: 'sell', index: 6 },
  ] as Action[]) rejected(state, action);
  assert.deepEqual(state.resolvedObstacles, []);
  // The tied socata and the covered elderflower drink are on the board, but the welcome drink cannot use them.
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
  const sold = apply(state, { type: 'sell', index: 2 });
  assert.equal(firstFreeBoardCell(sold, data), 2);
  const produced = apply(sold, { type: 'spawn', index: 1 });
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
  const partial = apply(open, { type: 'move', from: 7, to: 6 });
  let full = structuredClone(partial);
  for (const obstacle of data.board.layouts[0].obstacles.filter(obstacle => !full.resolvedObstacles.includes(obstacle.id))) {
    full.board[7] = { code: obstacle.ingredient };
    full = apply(full, { type: 'move', from: 7, to: obstacle.position });
  }
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

test('layout data rejects invalid content but permits blockers surrounded by blockers', () => {
  const duplicate = structuredClone(data);
  duplicate.board.layouts[0].obstacles[1].position = 0;
  assert.ok(boardLayoutProblems(duplicate).length);
  const unknown = structuredClone(data);
  unknown.board.layouts[0].obstacles[1].ingredient = null as unknown as string;
  assert.ok(boardLayoutProblems(unknown).length);
  const badSprite = structuredClone(data);
  badSprite.board.layouts[0].obstacles[0].sprite = 99;
  assert.ok(boardLayoutProblems(badSprite).length);
  const badAtlas = structuredClone(data);
  Object.assign(badAtlas.board.layouts[0].obstacles[0], { atlas: 'absent' });
  assert.ok(boardLayoutProblems(badAtlas).length);
  const trapped = structuredClone(data);
  trapped.board.initial[13] = null;
  trapped.board.layouts[0].obstacles.push(
    { id: 'center', position: 19, name: 'Center', type: 'clutter', ingredient: 'bakery_1' },
    ...[13, 18, 20, 25].map((position, index) => ({ id: `wall-${index}`, position, name: 'Clutter', type: 'clutter' as const, ingredient: 'bakery_1' })),
  );
  assert.deepEqual(boardLayoutProblems(trapped), []);
  assert.equal(validateGame(createGame(trapped), trapped), true);
});

test('current saves can omit unreleased wrapper discoveries and discover them after a successful action', () => {
  const state = start();
  state.discovered = state.discovered.filter(code => code !== 'bakery_3');
  assert.equal(validateGame(state, data), true);
  const validate = (candidate: unknown) => validateGame(candidate, data);
  assert.deepEqual(importSave(exportSave(state, validate), validate), state);
  rejected(state, { type: 'move', from: 0, to: 2 });
  const next = apply(state, { type: 'spawn', index: 1 });
  assert.ok(next.discovered.includes('bakery_3'));
});
