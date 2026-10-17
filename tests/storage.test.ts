import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SAVE_KEY, MAX_SAVE_BYTES, loadSave, saveGame, exportSave, importSave, resetSave } from '../src/storage.ts';
import { createGame, validateGame, reduceGame, taskEligibility, firstFreeBoardCell, removeBreadTasting } from '../src/engine.ts';
import type { GameData, GameState } from '../src/engine.ts';

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
const envelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 8, state: value });

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
  assert.deepEqual(JSON.parse(text), { format: 'scary-snacks', version: 8, state: before });
  assert.deepEqual(importSave(text, valid), before);
  assert.deepEqual(original, before);
});

for (const [name, raw, status] of [
  ['corrupt JSON', '{broken', 'invalid'],
  ['unknown version', JSON.stringify({ format: 'scary-snacks', version: 99, state: state() }), 'unsupported'],
  ['zero version', JSON.stringify({ format: 'scary-snacks', version: 0, state: state() }), 'unsupported'],
  ['fractional version', JSON.stringify({ format: 'scary-snacks', version: 4.5, state: state() }), 'unsupported'],
  ['text version', JSON.stringify({ format: 'scary-snacks', version: '6', state: state() }), 'unsupported'],
  ['unknown format', JSON.stringify({ format: 'another-game', version: 8, state: state() }), 'unsupported'],
  ['invalid state', envelope({ coins: -1, board: [] }), 'invalid'],
  ['missing state', JSON.stringify({ format: 'scary-snacks', version: 8 }), 'invalid'],
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
function checkpoint(count: number): GameState {
  let current = createGame(gameData);
  for (let index = 0; index < count; index++) {
    Object.assign(current, gameData.tasks[index].goals, { coins: gameData.tasks[index].cost });
    const result = reduceGame(current, { type: 'task' }, gameData);
    assert.equal(result.ok, true, result.message);
    current = result.state;
  }
  if (count >= 18) current.completedQuests = gameData.quests.filter(quest => quest.character === 'ilie').map(quest => quest.id);
  return current;
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
  const paid = checkpoint(4), scene = gameData.tasks[3].id;
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
  const paid = checkpoint(4), scene = gameData.tasks[3].id;
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

test('current saves retain completed preparations with zero counters without a rewrite or inferred credit', () => {
  for (const count of [1, 12, 24]) {
    const current = checkpoint(count);
    current.served = 0;
    current.merges = 0;
    const before = structuredClone(current);
    const text = exportSave(current, validGame);
    assert.deepEqual(importSave(text, validGame), before);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.deepEqual(loadSave(storage, validGame).state, before);
    assert.deepEqual(loadSave(storage, validGame).state, before);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
    const result = reduceGame(current, { type: 'task' }, gameData);
    assert.equal(result.ok, false);
    assert.equal(result.state, current);
    assert.deepEqual(current, before);
  }
});

test('partial goals survive current import, export, and load and apply only to the next preparation', () => {
  for (const count of [0, 12, 23]) for (const missing of ['served', 'merges'] as const) {
    const old = checkpoint(count);
    const next = gameData.tasks[count];
    old.coins = next.cost;
    old.served = next.goals.served;
    old.merges = next.goals.merges;
    old[missing]--;
    const current = old;
    for (const text of [exportSave(current, validGame)]) {
      const imported = importSave<GameState>(text, validGame);
      assert.deepEqual(imported, current);
      const exported = exportSave(imported, validGame);
      const storage = memoryStorage([[SAVE_KEY, exported]]);
      const loaded = loadSave<GameState>(storage, validGame).state!;
      assert.deepEqual(loaded, current);
      assert.deepEqual(importSave(exported, validGame), current);
      assert.equal(storage.writes.length, 0);
      assert.equal(taskEligibility(loaded, gameData).ready, false);
      const failed = reduceGame(loaded, { type: 'task' }, gameData);
      assert.equal(failed.ok, false);
      assert.equal(failed.state, loaded);
      const ready = { ...loaded, [missing]: next.goals[missing] };
      assert.equal(taskEligibility(ready, gameData).ready, true);
      const paid = reduceGame(ready, { type: 'task' }, gameData);
      assert.equal(paid.ok, true, paid.message);
      assert.equal(paid.state.taskIndex, count + 1);
      assert.equal(paid.state.coins, 0);
      assert.equal(paid.state.served, ready.served);
      assert.equal(paid.state.merges, ready.merges);
      assert.deepEqual(loaded, current);
    }
  }
});

test('unsupported and malformed campaign saves remain recoverable without replacing current bytes', () => {
  const current = checkpoint(12);
  current.served = 0;
  current.merges = 0;
  const malformed = [
    JSON.stringify({ format: 'scary-snacks', version: 99, state: current }),
    ...[-1, 1.5, null, '13'].flatMap(value => [envelope({ ...current, served: value }), envelope({ ...current, merges: value })]),
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

/** A current-format save with the borrowed bread tasting: either open, with its source and a tasting item on the board, or delivered. */
function withTasting(state: GameState, delivered: boolean) {
  const legacy: GameState & Record<string, unknown> = structuredClone(state);
  if (delivered) {
    legacy.completedQuests = [...state.completedQuests, 'ilie-bread-tasting'];
    legacy.questCompletedAt = { ...state.questCompletedAt, 'ilie-bread-tasting': state.served };
    legacy.pendingScenes = [...state.pendingScenes, 'ilie-bread-tasting'];
    legacy.sceneLines = { 'ilie-bread-tasting': 1 };
    legacy.activeQuestProducers = {};
  } else {
    for (const code of ['quest_bread_source', 'quest_bread_3']) legacy.board[firstFreeBoardCell(legacy, gameData)] = { code };
    legacy.discovered = [...state.discovered, 'quest_bread_source', 'quest_bread_1', 'quest_bread_2', 'quest_bread_3'];
    legacy.activeQuestProducers = { 'ilie-bread-tasting': 0 };
  }
  return legacy;
}

test('a current save with the bread tasting loads, imports, and saves without it, and keeps all other progress', () => {
  const current = checkpoint(18);
  for (const delivered of [false, true]) {
    const text = envelope(withTasting(current, delivered));
    const expected: GameState = delivered ? { ...current, questCompletedAt: {}, sceneLines: {} } : current;
    assert.throws(() => importSave(text, validGame), /damaged or unknown/, 'Without the cleanup, the tasting data does not validate.');
    const storage = memoryStorage([[SAVE_KEY, text]]);
    const loaded = loadSave<GameState>(storage, validGame, removeBreadTasting);
    assert.equal(loaded.status, 'loaded', loaded.error ?? '');
    assert.deepEqual(loaded.state, expected);
    assert.equal(loaded.state!.coins, current.coins, 'The coins of a delivered tasting stay.');
    assert.equal(storage.writes.length, 0, 'A load alone does not rewrite the save.');
    assert.deepEqual(importSave(text, validGame, removeBreadTasting), expected);
    assert.equal(saveGame(storage, loaded.state, validGame).ok, false, 'Without the cleanup, the existing save blocks the write.');
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(saveGame(storage, loaded.state, validGame, removeBreadTasting).ok, true);
    assert.deepEqual(loadSave(storage, validGame).state, expected);
  }
  assert.deepEqual(removeBreadTasting(current), current, 'A save without tasting data does not change.');
  for (const value of [null, 'save', [1], 3]) assert.deepEqual(removeBreadTasting(value), value);
});

test('no claims, partial claims, and all claims survive export, import, and repeated load', () => {
  for (const count of [0, 3, gameData.levelRewards.length]) {
    let current = createGame(gameData);
    current.xp = 1500;
    for (const reward of gameData.levelRewards.slice(0, count)) {
      const claimed = reduceGame(current, { type: 'claimLevelReward', id: reward.id }, gameData);
      assert.equal(claimed.ok, true, claimed.message);
      current = claimed.state;
    }
    const original = structuredClone(current);
    const text = exportSave(current, validGame);
    assert.deepEqual(importSave(text, validGame), original);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.deepEqual(loadSave(storage, validGame).state, original);
    assert.deepEqual(loadSave(storage, validGame).state, original);
    assert.equal(storage.writes.length, 0);
    assert.deepEqual(current, original);
    assert.equal(current.coins, gameData.levelRewards.slice(0, count).reduce((sum, reward) => sum + reward.coins, 0));
  }
});

test('corrupt claim sets cannot replace saved progress', () => {
  const current = createGame(gameData);
  current.xp = 100;
  const text = exportSave(current, validGame);
  const first = gameData.levelRewards[0].id;
  const future = gameData.levelRewards.at(-1)!.id;
  for (const claims of [undefined, null, {}, 'level-2', [first, first], [future], ['unknown'], [12]]) {
    const invalid = { ...current, claimedLevelRewards: claims };
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

test('a failed claim write keeps the live award and saved bytes and retry persists the award once', () => {
  const current = createGame(gameData);
  current.xp = 100;
  const text = exportSave(current, validGame);
  const storage = memoryStorage([[SAVE_KEY, text]]);
  const reward = gameData.levelRewards[0];
  const claimed = reduceGame(current, { type: 'claimLevelReward', id: reward.id }, gameData);
  assert.equal(claimed.ok, true);
  const live = structuredClone(claimed.state);
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(saveGame(storage, claimed.state, validGame).ok, false);
  assert.equal(storage.values.get(SAVE_KEY), text);
  assert.deepEqual(claimed.state, live);
  assert.equal(reduceGame(claimed.state, { type: 'claimLevelReward', id: reward.id }, gameData).ok, false);
  storage.setItem = write;
  assert.equal(saveGame(storage, claimed.state, validGame).ok, true);
  const reloaded = loadSave<GameState>(storage, validGame).state!;
  assert.deepEqual(reloaded, live);
  assert.equal(reloaded.coins, reward.coins);
  assert.deepEqual(reloaded.claimedLevelRewards, [reward.id]);
  assert.equal(reduceGame(reloaded, { type: 'claimLevelReward', id: reward.id }, gameData).ok, false);
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
  const unrelated = 'scary-snacks-save-v7';
  const bytes = JSON.stringify({ format: 'scary-snacks', version: 7, state: state() });
  const storage = memoryStorage([[unrelated, bytes]]);
  const reads: string[] = [];
  const getItem = storage.getItem;
  storage.getItem = key => { reads.push(key); return getItem(key); };
  assert.equal(loadSave(storage, valid).status, 'empty');
  assert.deepEqual(reads, [SAVE_KEY]);
  assert.equal(saveGame(storage, state(), valid).ok, true);
  const current = storage.values.get(SAVE_KEY);
  for (const version of [1, 2, 3, 4, 5, 6, 7, 9]) {
    assert.throws(() => importSave(JSON.stringify({ format: 'scary-snacks', version, state: state() }), valid));
    assert.equal(storage.values.get(SAVE_KEY), current);
  }
  assert.equal(storage.values.get(unrelated), bytes);
});
