import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SAVE_KEY, MAX_SAVE_BYTES, loadSave, saveGame, exportSave, importSave, resetSave } from '../src/storage.ts';
import { createGame, validateGame, reduceGame, taskEligibility, firstFreeBoardCell } from '../src/engine.ts';
import type { GameData, GameState } from '../src/engine.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';

type State = { coins: number; board: ({ code: string } | null)[]; story: string; self?: State };

function memoryStorage(initial: [string, string][] = []) {
  const values = new Map(initial);
  const writes: [string, string][] = [];
  return {
    values,
    writes,
    getItem: (key: string): string | null => values.get(key) ?? null,
    setItem(key: string, value: string) { writes.push([key, value]); values.set(key, value); },
    removeItem(key: string) { values.delete(key); },
  };
}

const valid = (candidate: unknown) => {
  const state = candidate as State | null;
  return Boolean(state && Number.isSafeInteger(state.coins) && state.coins >= 0 && Array.isArray(state.board));
};
const state = (): State => ({ coins: 12, board: [{ code: 'coffee_1' }, null], story: 'Mara' });
const envelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 9, state: value });

test('empty storage loads without creating a save', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadSave(storage, valid), { state: null, status: 'empty', error: null });
  assert.equal(storage.writes.length, 0);
});

test('save uses one versioned key and round trips a detached state', () => {
  const storage = memoryStorage([['unrelated', 'keep']]);
  const original = state();
  assert.deepEqual(saveGame(storage, original, valid), { ok: true, error: null });
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.writes[0][0], SAVE_KEY);
  const loaded = loadSave<State>(storage, valid);
  assert.equal(loaded.status, 'loaded');
  assert.deepEqual(loaded.state, original);
  loaded.state!.board[0]!.code = 'changed';
  assert.equal(original.board[0]?.code, 'coffee_1');
  assert.equal(storage.values.get('unrelated'), 'keep');
});

test('portable export and import leave their input unchanged', () => {
  const original = state();
  const before = structuredClone(original);
  const text = exportSave(original, valid);
  assert.deepEqual(JSON.parse(text), { format: 'scary-snacks', version: 9, state: before });
  assert.deepEqual(importSave(text, valid), before);
  assert.deepEqual(original, before);
});

for (const [name, raw, status] of [
  ['corrupt JSON', '{broken', 'invalid'],
  ['unknown version', JSON.stringify({ format: 'scary-snacks', version: 99, state: state() }), 'unsupported'],
  ['previous version', JSON.stringify({ format: 'scary-snacks', version: 8, state: state() }), 'unsupported'],
  ['zero version', JSON.stringify({ format: 'scary-snacks', version: 0, state: state() }), 'unsupported'],
  ['fractional version', JSON.stringify({ format: 'scary-snacks', version: 4.5, state: state() }), 'unsupported'],
  ['text version', JSON.stringify({ format: 'scary-snacks', version: '6', state: state() }), 'unsupported'],
  ['unknown format', JSON.stringify({ format: 'another-game', version: 9, state: state() }), 'unsupported'],
  ['invalid state', envelope({ coins: -1, board: [] }), 'invalid'],
  ['missing state', JSON.stringify({ format: 'scary-snacks', version: 9 }), 'invalid'],
  ['empty string', '', 'invalid'],
]) {
  test(`preserves ${name} on load and subsequent save`, () => {
    const storage = memoryStorage([[SAVE_KEY, raw]]);
    const loaded = loadSave(storage, valid);
    assert.equal(loaded.status, status);
    assert.equal(loaded.state, null);
    assert.ok(loaded.error);
    assert.equal(saveGame(storage, state(), valid).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), raw);
    assert.equal(storage.writes.length, 0);
    assert.throws(() => importSave(raw, valid));
  });
}

test('read access errors block saves and are surfaced', () => {
  const storage = memoryStorage();
  storage.getItem = () => { throw new Error('Access denied'); };
  assert.match(loadSave(storage, valid).error ?? '', /Access denied/);
  assert.equal(loadSave(storage, valid).status, 'unavailable');
  assert.equal(saveGame(storage, state(), valid).ok, false);
  assert.equal(storage.writes.length, 0);
});

test('blocked storage refuses each write with a plain reason', () => {
  assert.deepEqual(saveGame(null, state(), valid), { ok: false, error: 'Browser storage is unavailable.' });
  assert.equal(resetSave(null, state(), valid).ok, false);
  assert.equal(loadSave(null, valid).status, 'unavailable');
});

test('quota failures preserve previous data without removal', () => {
  const previous = envelope(state());
  const storage = memoryStorage([[SAVE_KEY, previous]]);
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  const result = saveGame(storage, { ...state(), coins: 15 }, valid);
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /Quota exceeded/);
  assert.equal(storage.values.get(SAVE_KEY), previous);
});

test('invalid and nonserializable live state never reaches storage', () => {
  const storage = memoryStorage();
  assert.equal(saveGame(storage, { coins: -1, board: [] }, valid).ok, false);
  const cyclic = state();
  cyclic.self = cyclic;
  assert.equal(saveGame(storage, cyclic, valid).ok, false);
  assert.throws(() => exportSave(cyclic, valid), /JSON/);
  assert.equal(storage.writes.length, 0);
});

test('validation checks serialized state as well as live state', () => {
  const original = { ...state(), toJSON() { return { coins: -1, board: [] }; } };
  assert.throws(() => exportSave(original, valid), /damaged or unknown game data/);
});

test('validator exceptions and non-boolean results cannot admit a save', () => {
  const throwing = () => { throw new Error('Engine validation error'); };
  assert.throws(() => importSave(envelope(state()), throwing), /could not be checked/);
  assert.throws(() => exportSave(state(), () => 'valid'), /damaged or unknown game data/);
  assert.throws(() => exportSave(state(), undefined), /validator/);
});

test('import and export enforce the limit in UTF-8 bytes', () => {
  const tooLarge = envelope({ ...state(), note: 'é'.repeat(MAX_SAVE_BYTES / 2) });
  assert.ok(tooLarge.length < MAX_SAVE_BYTES);
  assert.throws(() => importSave(tooLarge, valid), /2 MiB/);
  assert.throws(() => exportSave({ ...state(), note: 'x'.repeat(MAX_SAVE_BYTES) }, valid), /2 MiB/);
  const storage = memoryStorage([[SAVE_KEY, tooLarge]]);
  assert.equal(saveGame(storage, state(), valid).ok, false);
  assert.equal(storage.values.get(SAVE_KEY), tooLarge);
});

test('import accepts exactly 2 MiB and rejects one byte more', () => {
  const base = envelope({ ...state(), note: '' });
  const exact = envelope({ ...state(), note: 'x'.repeat(MAX_SAVE_BYTES - new TextEncoder().encode(base).length) });
  assert.equal(new TextEncoder().encode(exact).length, MAX_SAVE_BYTES);
  assert.equal(importSave<State>(exact, valid).coins, 12);
  assert.throws(() => importSave(exact + ' ', valid), /2 MiB/);
});

const gameData: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const validGame = (candidate: unknown) => validateGame(candidate, gameData);
const checkpoint = (count: number) => checkpointState(gameData, count);
/** The game right after the payment of the fourth preparation, with its scene waiting. */
function paidFourth() {
  const result = reduceGame(checkpoint(3), { type: 'task' }, gameData);
  assert.equal(result.ok, true, result.message);
  return result.state;
}

test('pending story scenes survive export, import, and reload, and invalid queues cannot replace a save', () => {
  const finished = checkpoint(24);
  for (const pendingScenes of [[], ['chapter-6'], ['finale'], ['chapter-6', 'finale'], ['chapter-1', 'chapter-4', 'finale']]) {
    const state = { ...finished, pendingScenes };
    const text = exportSave(state, validGame);
    assert.deepEqual(importSave(text, validGame), state);
    const storage = memoryStorage();
    assert.equal(saveGame(storage, state, validGame).ok, true);
    assert.deepEqual(loadSave(storage, validGame).state, state);
  }
  const middle = checkpoint(12);
  const current = exportSave(middle, validGame);
  for (const pendingScenes of [['finale'], ['chapter-4'], ['chapter-1', 'chapter-1'], ['chapter-2', 'chapter-1'], ['unknown'], 'chapter-1', [1]]) {
    const text = envelope({ ...middle, pendingScenes });
    assert.throws(() => importSave(text, validGame), /damaged or unknown/);
    const storage = memoryStorage([[SAVE_KEY, current]]);
    assert.equal(saveGame(storage, { ...middle, pendingScenes }, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), current);
  }
});

test('each saved scene line survives a round trip, a save without lines starts at the first line, and malformed lines cannot replace a save', () => {
  const paid = paidFourth(), scene = gameData.tasks[3].id;
  assert.equal(Object.hasOwn(paid, 'sceneLines'), false, 'A save without lines starts each waiting scene at the first line.');
  assert.deepEqual(importSave(exportSave(paid, validGame), validGame), paid);
  for (let line = 1; line < gameData.tasks[3].dialogue.length; line++) {
    const result = reduceGame(paid, { type: 'sceneLine', id: scene, line }, gameData);
    assert.equal(result.ok, true, result.message);
    const storage = memoryStorage();
    assert.equal(saveGame(storage, result.state, validGame).ok, true);
    const loaded = loadSave<GameState>(storage, validGame).state!;
    assert.deepEqual(loaded.sceneLines, { [scene]: line });
    assert.deepEqual(importSave(exportSave(loaded, validGame), validGame), result.state);
  }
  const current = exportSave(paid, validGame);
  for (const sceneLines of [null, [], 'task_4', { [scene]: 0 }, { [scene]: -1 }, { [scene]: 1.5 }, { [scene]: '1' }, { 'chapter-2': 1 }, { unknown: 1 }]) {
    const text = envelope({ ...paid, sceneLines });
    assert.throws(() => importSave(text, validGame), /damaged or unknown/, JSON.stringify(sceneLines));
    const storage = memoryStorage([[SAVE_KEY, current]]);
    assert.equal(saveGame(storage, { ...paid, sceneLines }, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), current);
  }
});

test('a failed scene line write keeps the previous save, and a later write records the line', () => {
  const paid = paidFourth(), scene = gameData.tasks[3].id;
  const storage = memoryStorage([[SAVE_KEY, exportSave(paid, validGame)]]);
  const previous = storage.values.get(SAVE_KEY);
  const line = reduceGame(paid, { type: 'sceneLine', id: scene, line: 1 }, gameData).state;
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(saveGame(storage, line, validGame).ok, false);
  assert.equal(storage.values.get(SAVE_KEY), previous);
  assert.equal(Object.hasOwn(loadSave<GameState>(storage, validGame).state!, 'sceneLines'), false);
  storage.setItem = write;
  const later = reduceGame(line, { type: 'sceneLine', id: scene, line: 2 }, gameData).state;
  assert.equal(saveGame(storage, later, validGame).ok, true);
  assert.deepEqual(loadSave<GameState>(storage, validGame).state!.sceneLines, { [scene]: 2 });
});

test('saved checkpoints load unchanged without a rewrite or inferred progress', () => {
  for (const count of [0, 1, 12, 24]) {
    const current = checkpoint(count);
    const before = structuredClone(current);
    const text = exportSave(current, validGame);
    assert.deepEqual(importSave(text, validGame), before);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.deepEqual(loadSave(storage, validGame).state, before);
    assert.deepEqual(loadSave(storage, validGame).state, before);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
    assert.deepEqual(current, before);
  }
});

test('a loaded save without the quests of the next preparation cannot pay for it until they are delivered', () => {
  for (const count of [1, 12, 23]) {
    const ready = checkpoint(count);
    const current = { ...ready, completedQuests: checkpoint(count - 1).completedQuests };
    const text = exportSave(current, validGame);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    const loaded = loadSave<GameState>(storage, validGame).state!;
    assert.deepEqual(loaded, current);
    assert.equal(storage.writes.length, 0);
    assert.equal(taskEligibility(loaded, gameData).ready, false);
    assert.ok(taskEligibility(loaded, gameData).blockers.some(blocker => /^Deliver \d+ more quests? for this preparation\.$/.test(blocker)));
    const failed = reduceGame(loaded, { type: 'task' }, gameData);
    assert.equal(failed.ok, false);
    assert.equal(failed.state, loaded);
    assert.deepEqual(importSave(text, validGame), current);
    assert.equal(validGame(ready), true);
    const paid = reduceGame(ready, { type: 'task' }, gameData);
    assert.equal(paid.ok, true, paid.message);
    assert.equal(paid.state.taskIndex, count + 1);
    assert.equal(paid.state.coins, 0);
  }
});

test('unsupported and malformed campaign saves remain recoverable without replacing current bytes', () => {
  const current = checkpoint(12);
  const malformed = [
    JSON.stringify({ format: 'scary-snacks', version: 99, state: current }),
    JSON.stringify({ format: 'scary-snacks', version: 8, state: current }),
    envelope({ ...current, version: 9 }),
    ...[-1, 1.5, null, '13'].map(value => envelope({ ...current, coins: value })),
    envelope({ ...current, completedQuests: [] }),
  ];
  for (const text of malformed) {
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.throws(() => importSave(text, validGame));
    assert.equal(loadSave(storage, validGame).state, null);
    assert.equal(saveGame(storage, current, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
  }
});

test('unknown, duplicate, and contradictory quest records cannot replace current saved progress', () => {
  const current = createGame(gameData);
  const first = gameData.quests.find(quest => quest.afterTask === null && !quest.afterQuest)!;
  const later = gameData.quests.find(quest => quest.afterQuest)!;
  const text = exportSave(current, validGame);
  const invalidStates = [
    ...[undefined, null, {}, 'quest', ['unknown'], [first.id, first.id], [12]].map(completedQuests => ({ ...current, completedQuests })),
    { ...current, completedQuests: [later.id] },
  ];
  assert.equal(validGame({ ...current, completedQuests: [first.id] }), true);
  for (const invalid of invalidStates) {
    const raw = envelope(invalid);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.throws(() => importSave(raw, validGame));
    assert.throws(() => exportSave(invalid, validGame));
    assert.equal(saveGame(storage, invalid, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
    storage.values.set(SAVE_KEY, raw);
    assert.equal(loadSave(storage, validGame).status, 'invalid');
    assert.equal(saveGame(storage, current, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), raw);
    assert.equal(storage.writes.length, 0);
  }
});

test('a failed quest delivery write keeps the session reward and reload restores only durable progress', () => {
  const current = createGame(gameData);
  const quest = gameData.quests.find(candidate => candidate.afterTask === null && !candidate.afterQuest)!;
  for (const requirement of quest.requirements) {
    for (let count = 0; count < requirement.quantity; count++) {
      const index = firstFreeBoardCell(current, gameData);
      assert.notEqual(index, -1);
      current.board[index] = { code: requirement.item };
    }
    if (!current.discovered.includes(requirement.item)) current.discovered.push(requirement.item);
  }
  const text = exportSave(current, validGame);
  const storage = memoryStorage([[SAVE_KEY, text]]);
  const delivered = reduceGame(current, { type: 'deliverQuest', id: quest.id }, gameData);
  assert.equal(delivered.ok, true, delivered.message);
  const live = structuredClone(delivered.state);
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(saveGame(storage, delivered.state, validGame).ok, false);
  assert.equal(storage.values.get(SAVE_KEY), text);
  assert.deepEqual(delivered.state, live);
  assert.deepEqual(loadSave(storage, validGame).state, current);
  assert.equal(reduceGame(delivered.state, { type: 'deliverQuest', id: quest.id }, gameData).ok, false);
  storage.setItem = write;
  assert.equal(saveGame(storage, delivered.state, validGame).ok, true);
  const reloaded = loadSave<GameState>(storage, validGame).state!;
  assert.deepEqual(reloaded, live);
  assert.equal(reloaded.coins, current.coins + quest.reward);
  assert.deepEqual(reloaded.completedQuests, [quest.id]);
  assert.deepEqual(importSave(exportSave(live, validGame), validGame), live);
  assert.equal(reduceGame(reloaded, { type: 'deliverQuest', id: quest.id }, gameData).ok, false);
  assert.equal(storage.writes.length, 1);
});

test('explicit reset replaces invalid current bytes and preserves unrelated storage', () => {
  const storage = memoryStorage([[SAVE_KEY, '{broken'], ['unrelated', 'keep']]);
  assert.equal(resetSave(storage, state(), valid).ok, true);
  assert.deepEqual(loadSave(storage, valid).state, state());
  assert.equal(storage.values.get('unrelated'), 'keep');
  const before = storage.values.get(SAVE_KEY);
  assert.equal(resetSave(storage, { coins: -1 }, valid).ok, false);
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(resetSave(storage, { ...state(), coins: 90 }, valid).ok, false);
  assert.equal(storage.values.get(SAVE_KEY), before);
});

test('only the current key is read and unsupported save envelopes cannot replace it', () => {
  const unrelated = 'scary-snacks-save-v8';
  const bytes = JSON.stringify({ format: 'scary-snacks', version: 8, state: state() });
  const storage = memoryStorage([[unrelated, bytes]]);
  const reads: string[] = [];
  const getItem = storage.getItem;
  storage.getItem = key => { reads.push(key); return getItem(key); };
  assert.equal(loadSave(storage, valid).status, 'empty');
  assert.deepEqual(reads, [SAVE_KEY]);
  assert.equal(saveGame(storage, state(), valid).ok, true);
  const current = storage.values.get(SAVE_KEY);
  for (const version of [1, 2, 3, 4, 5, 6, 7, 8, 10]) {
    assert.throws(() => importSave(JSON.stringify({ format: 'scary-snacks', version, state: state() }), valid));
    assert.equal(storage.values.get(SAVE_KEY), current);
  }
  assert.equal(storage.values.get(unrelated), bytes);
});
