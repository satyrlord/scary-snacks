import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SAVE_KEY, QUEST_SAVE_KEY, LEVEL_REWARD_SAVE_KEY, GENERATOR_SAVE_KEY, PREVIOUS_SAVE_KEY, LEGACY_SAVE_KEY, MAX_SAVE_BYTES, loadSave, saveGame, exportSave, importSave, resetSave } from '../src/storage.ts';
import { createGame, validateGame, validateLevelRewardGame, validateGeneratorGame, validatePreviousGame, validateLegacyGame, migrateGame, migratePreviousGame, migrateGeneratorGame, migrateLevelRewardGame, migrateQuestGame, reduceGame, saveMigrations, taskEligibility, legacyOrderReward, firstFreeBoardCell } from '../src/engine.ts';
import type { GameData, GameState, GeneratorGameState, LevelRewardGameState, QuestGameState } from '../src/engine.ts';

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
const envelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 6, state: value });

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
  assert.deepEqual(JSON.parse(text), { format: 'scary-snacks', version: 6, state: before });
  assert.deepEqual(importSave(text, valid), before);
  assert.deepEqual(original, before);
});

for (const [name, raw, status] of [
  ['corrupt JSON', '{broken', 'invalid'],
  ['unknown version', JSON.stringify({ format: 'scary-snacks', version: 7, state: state() }), 'unsupported'],
  ['zero version', JSON.stringify({ format: 'scary-snacks', version: 0, state: state() }), 'unsupported'],
  ['fractional version', JSON.stringify({ format: 'scary-snacks', version: 4.5, state: state() }), 'unsupported'],
  ['text version', JSON.stringify({ format: 'scary-snacks', version: '6', state: state() }), 'unsupported'],
  ['unknown format', JSON.stringify({ format: 'another-game', version: 6, state: state() }), 'unsupported'],
  ['invalid state', envelope({ coins: -1, board: [] }), 'invalid'],
  ['missing state', JSON.stringify({ format: 'scary-snacks', version: 6 }), 'invalid'],
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

const legacyEnvelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 1, state: value });
const previousEnvelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 2, state: value });
const generatorEnvelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 3, state: value });
const levelRewardEnvelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 4, state: value });
const questEnvelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 5, state: value });
const migration = {
  1: { validate: valid, migrate: (candidate: unknown) => structuredClone(candidate) },
  2: { validate: valid, migrate: (candidate: unknown) => ({ ...(candidate as State), story: 'Converted' }) },
  3: { validate: valid, migrate: (candidate: unknown) => structuredClone(candidate) },
  4: { validate: valid, migrate: (candidate: unknown) => structuredClone(candidate) },
  5: { validate: valid, migrate: (candidate: unknown) => structuredClone(candidate) },
};

test('legacy conversion validates both states and preserves every byte on failed conversion or validation', () => {
  for (const convert of [
    { validate: () => false, migrate: () => assert.fail('Must validate before conversion.') },
    { validate: valid, migrate: () => { throw new Error('Conversion failed'); } },
    { validate: valid, migrate: () => ({ coins: -1, board: [] }) },
  ]) {
    const text = legacyEnvelope(state());
    const storage = memoryStorage([[LEGACY_SAVE_KEY, text]]);
    assert.equal(loadSave(storage, valid, { ...migration, 1: convert }).status, 'invalid');
    assert.equal(storage.values.get(LEGACY_SAVE_KEY), text);
    assert.equal(storage.values.has(SAVE_KEY), false);
    assert.equal(storage.writes.length, 0);
  }
});

test('failed migration write leaves the legacy snapshot intact and retry completes with one atomic write', () => {
  const text = legacyEnvelope(state());
  const storage = memoryStorage([[LEGACY_SAVE_KEY, text]]);
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  const failed = loadSave(storage, valid, migration);
  assert.equal(failed.state, null);
  assert.equal(failed.status, 'unavailable');
  assert.match(failed.error!, /Quota exceeded/);
  assert.equal(storage.values.get(LEGACY_SAVE_KEY), text);
  assert.equal(storage.values.has(SAVE_KEY), false);
  storage.setItem = write;
  assert.deepEqual(loadSave<State>(storage, valid, migration).state, { ...state(), story: 'Converted' });
  assert.equal(storage.values.get(LEGACY_SAVE_KEY), text);
  assert.equal(storage.writes.length, 1);
});

test('a present current save prevents legacy fallback, including when the current data is invalid', () => {
  for (const current of ['{broken', legacyEnvelope(state()), envelope({ coins: -1, board: [] })]) {
    const old = legacyEnvelope(state());
    const storage = memoryStorage([[SAVE_KEY, current], [LEGACY_SAVE_KEY, old]]);
    const loaded = loadSave(storage, valid, migration);
    assert.equal(loaded.state, null);
    assert.ok(['invalid', 'unsupported'].includes(loaded.status));
    assert.equal(storage.values.get(SAVE_KEY), current);
    assert.equal(storage.values.get(LEGACY_SAVE_KEY), old);
    assert.equal(storage.writes.length, 0);
  }
});

test('malformed, unsupported, and oversized legacy imports fail before migration', () => {
  const noConvert = { ...migration, 1: { validate: valid, migrate: () => assert.fail('Must reject before conversion.') } };
  for (const text of ['{broken', JSON.stringify({ format: 'scary-snacks', version: 0, state: state() }), legacyEnvelope({ coins: -1, board: [] }), legacyEnvelope({ ...state(), note: 'x'.repeat(MAX_SAVE_BYTES) })]) {
    assert.throws(() => importSave(text, valid, noConvert));
    const storage = memoryStorage([[LEGACY_SAVE_KEY, text]]);
    assert.equal(loadSave(storage, valid, noConvert).state, null);
    assert.equal(storage.values.get(LEGACY_SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
  }
});

test('explicit reset replaces even an invalid current save in one write and keeps legacy bytes', () => {
  const old = legacyEnvelope(state());
  const storage = memoryStorage([[SAVE_KEY, '{broken'], [LEGACY_SAVE_KEY, old], ['unrelated', 'keep']]);
  storage.removeItem = () => assert.fail('Reset must not remove a save before writing.');
  storage.getItem = () => assert.fail('An explicit reset does not depend on reading the old save.');
  assert.deepEqual(resetSave(storage, state(), valid), { ok: true, error: null });
  assert.deepEqual(storage.writes, [[SAVE_KEY, exportSave(state(), valid)]]);
  assert.equal(storage.values.get(LEGACY_SAVE_KEY), old);
  assert.equal(storage.values.get('unrelated'), 'keep');
});

test('failed reset validation or write preserves current and legacy bytes', () => {
  const old = legacyEnvelope(state());
  const storage = memoryStorage([[SAVE_KEY, '{broken'], [LEGACY_SAVE_KEY, old]]);
  assert.equal(resetSave(storage, { coins: -1, board: [] }, valid).ok, false);
  assert.equal(storage.writes.length, 0);
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  const result = resetSave(storage, state(), valid);
  assert.equal(result.ok, false);
  assert.match(result.error!, /Quota exceeded/);
  assert.equal(storage.values.get(SAVE_KEY), '{broken');
  assert.equal(storage.values.get(LEGACY_SAVE_KEY), old);
  assert.equal(resetSave(null, state(), valid).ok, false);
});

test('older envelopes convert one version at a time and validate every intermediate state', () => {
  const calls: string[] = [];
  const steps = {
    1: {
      validate: (value: unknown) => { calls.push('validate 1'); return (value as { step: number }).step === 1; },
      migrate: () => { calls.push('migrate 1'); return { step: 2 }; },
    },
    2: {
      validate: (value: unknown) => { calls.push('validate 2'); return (value as { step: number }).step === 2; },
      migrate: () => { calls.push('migrate 2'); return { step: 3 }; },
    },
    3: {
      validate: (value: unknown) => { calls.push('validate 3'); return (value as { step: number }).step === 3; },
      migrate: () => { calls.push('migrate 3'); return { step: 4 }; },
    },
    4: {
      validate: (value: unknown) => { calls.push('validate 4'); return (value as { step: number }).step === 4; },
      migrate: () => { calls.push('migrate 4'); return { step: 5 }; },
    },
    5: {
      validate: (value: unknown) => { calls.push('validate 5'); return (value as { step: number }).step === 5; },
      migrate: () => { calls.push('migrate 5'); return { step: 6 }; },
    },
  };
  const current = (value: unknown) => { calls.push('validate 6'); return (value as { step: number }).step === 6; };
  assert.deepEqual(importSave(legacyEnvelope({ step: 1 }), current, steps), { step: 6 });
  assert.deepEqual(calls.filter(call => call.startsWith('migrate')), ['migrate 1', 'migrate 2', 'migrate 3', 'migrate 4', 'migrate 5']);
  assert.ok(calls.indexOf('validate 1') < calls.indexOf('migrate 1'));
  assert.ok(calls.indexOf('validate 2') > calls.indexOf('migrate 1'));
  assert.ok(calls.indexOf('validate 2') < calls.indexOf('migrate 2'));
  assert.ok(calls.indexOf('validate 3') > calls.indexOf('migrate 2'));
  assert.ok(calls.indexOf('validate 3') < calls.indexOf('migrate 3'));
  assert.ok(calls.indexOf('validate 4') > calls.indexOf('migrate 3'));
  assert.ok(calls.indexOf('validate 4') < calls.indexOf('migrate 4'));
  assert.ok(calls.indexOf('validate 5') > calls.indexOf('migrate 4'));
  assert.ok(calls.indexOf('validate 5') < calls.indexOf('migrate 5'));
  assert.ok(calls.indexOf('validate 6') > calls.indexOf('migrate 5'));
  calls.length = 0;
  assert.throws(() => importSave(legacyEnvelope({ step: 1 }), current, { ...steps, 1: { ...steps[1], migrate: () => ({ step: 9 }) } }), /damaged/);
  assert.deepEqual(calls, ['validate 1', 'validate 2']);
});

test('the newest present key wins and an invalid previous key cannot restore legacy progress', () => {
  const old = legacyEnvelope(state());
  const newer = previousEnvelope({ ...state(), coins: 99 });
  const storage = memoryStorage([[LEGACY_SAVE_KEY, old], [PREVIOUS_SAVE_KEY, newer]]);
  assert.equal(loadSave<State>(storage, valid, migration).state!.coins, 99);
  assert.equal(storage.values.get(LEGACY_SAVE_KEY), old);
  assert.equal(storage.values.get(PREVIOUS_SAVE_KEY), newer);
  assert.equal(storage.writes.length, 1);
  for (const bad of ['{broken', legacyEnvelope(state()), envelope(state()), previousEnvelope({ coins: -1, board: [] })]) {
    const invalid = memoryStorage([[LEGACY_SAVE_KEY, old], [PREVIOUS_SAVE_KEY, bad]]);
    assert.equal(loadSave(invalid, valid, migration).state, null);
    assert.equal(invalid.values.get(PREVIOUS_SAVE_KEY), bad);
    assert.equal(invalid.values.get(LEGACY_SAVE_KEY), old);
    assert.equal(invalid.writes.length, 0);
  }
});

test('a failed previous-save conversion write preserves both older keys and retries without extra writes', () => {
  const old = legacyEnvelope(state());
  const previous = previousEnvelope({ ...state(), coins: 99 });
  const storage = memoryStorage([[LEGACY_SAVE_KEY, old], [PREVIOUS_SAVE_KEY, previous]]);
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(loadSave(storage, valid, migration).status, 'unavailable');
  assert.equal(storage.values.get(LEGACY_SAVE_KEY), old);
  assert.equal(storage.values.get(PREVIOUS_SAVE_KEY), previous);
  assert.equal(storage.values.has(SAVE_KEY), false);
  storage.setItem = write;
  const loaded = loadSave<State>(storage, valid, migration);
  assert.equal(loaded.state!.coins, 99);
  assert.deepEqual(loadSave(storage, valid, migration), loaded);
  assert.equal(storage.writes.length, 1);
});

test('a failed second conversion cannot save a partially converted state', () => {
  for (const [key, text] of [[LEGACY_SAVE_KEY, legacyEnvelope(state())], [PREVIOUS_SAVE_KEY, previousEnvelope(state())]]) {
    for (const step of [
      { validate: () => false, migrate: () => assert.fail('Invalid state must not migrate.') },
      { validate: valid, migrate: () => { throw new Error('Conversion failed'); } },
      { validate: valid, migrate: () => ({ coins: -1, board: [] }) },
    ]) {
      const storage = memoryStorage([[key, text]]);
      assert.equal(loadSave(storage, valid, { ...migration, 2: step }).status, 'invalid');
      assert.equal(storage.values.get(key), text);
      assert.equal(storage.writes.length, 0);
    }
  }
});

test('the generator key takes precedence over both older keys and preserves all old bytes', () => {
  const old = legacyEnvelope(state());
  const previous = previousEnvelope({ ...state(), coins: 30 });
  const generator = generatorEnvelope({ ...state(), coins: 70 });
  const originals: [string, string][] = [[LEGACY_SAVE_KEY, old], [PREVIOUS_SAVE_KEY, previous], [GENERATOR_SAVE_KEY, generator]];
  const storage = memoryStorage(originals);
  assert.equal(loadSave<State>(storage, valid, migration).state!.coins, 70);
  for (const [key, text] of originals) assert.equal(storage.values.get(key), text);
  assert.equal(storage.writes.length, 1);
  for (const bad of ['{broken', previousEnvelope(state()), envelope(state()), generatorEnvelope({ coins: -1, board: [] })]) {
    const invalid = memoryStorage([...originals, [GENERATOR_SAVE_KEY, bad]]);
    assert.equal(loadSave(invalid, valid, migration).state, null);
    assert.equal(invalid.values.get(GENERATOR_SAVE_KEY), bad);
    assert.equal(invalid.values.get(PREVIOUS_SAVE_KEY), previous);
    assert.equal(invalid.values.get(LEGACY_SAVE_KEY), old);
    assert.equal(invalid.writes.length, 0);
  }
});

test('the level reward key takes precedence over every older key and preserves all old bytes', () => {
  const originals: [string, string][] = [
    [LEGACY_SAVE_KEY, legacyEnvelope(state())],
    [PREVIOUS_SAVE_KEY, previousEnvelope({ ...state(), coins: 30 })],
    [GENERATOR_SAVE_KEY, generatorEnvelope({ ...state(), coins: 70 })],
    [LEVEL_REWARD_SAVE_KEY, levelRewardEnvelope({ ...state(), coins: 90 })],
  ];
  const storage = memoryStorage(originals);
  assert.equal(loadSave<State>(storage, valid, migration).state!.coins, 90);
  for (const [key, text] of originals) assert.equal(storage.values.get(key), text);
  assert.equal(storage.writes.length, 1);
  for (const bad of ['{broken', generatorEnvelope(state()), envelope(state()), levelRewardEnvelope({ coins: -1, board: [] })]) {
    const invalid = memoryStorage([...originals, [LEVEL_REWARD_SAVE_KEY, bad]]);
    assert.equal(loadSave(invalid, valid, migration).state, null);
    assert.equal(invalid.values.get(LEVEL_REWARD_SAVE_KEY), bad);
    for (const [key, text] of originals.slice(0, -1)) assert.equal(invalid.values.get(key), text);
    assert.equal(invalid.writes.length, 0);
  }
});

test('a quest save takes precedence over a level reward save and preserves both older keys', () => {
  const current = questEnvelope({ ...state(), coins: 50 });
  const older = levelRewardEnvelope({ ...state(), coins: 90 });
  const storage = memoryStorage([[QUEST_SAVE_KEY, current], [LEVEL_REWARD_SAVE_KEY, older]]);
  assert.equal(loadSave<State>(storage, valid, migration).state!.coins, 50);
  assert.equal(storage.values.get(QUEST_SAVE_KEY), current);
  assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), older);
  assert.equal(storage.writes.length, 1);
  storage.values.delete(SAVE_KEY);
  storage.values.set(QUEST_SAVE_KEY, '{broken');
  assert.equal(loadSave(storage, valid, migration).status, 'invalid');
  assert.equal(storage.values.get(QUEST_SAVE_KEY), '{broken');
  assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), older);
  assert.equal(storage.writes.length, 1);
});

test('a failed final conversion keeps every older envelope without a partial destination', () => {
  for (const [key, text] of [[LEGACY_SAVE_KEY, legacyEnvelope(state())], [PREVIOUS_SAVE_KEY, previousEnvelope(state())],
    [GENERATOR_SAVE_KEY, generatorEnvelope(state())], [LEVEL_REWARD_SAVE_KEY, levelRewardEnvelope(state())], [QUEST_SAVE_KEY, questEnvelope(state())]]) {
    for (const step of [
      { validate: () => false, migrate: () => assert.fail('Invalid state must not migrate.') },
      { validate: valid, migrate: () => { throw new Error('Conversion failed'); } },
      { validate: valid, migrate: () => ({ coins: -1, board: [] }) },
    ]) {
      const storage = memoryStorage([[key, text]]);
      assert.equal(loadSave(storage, valid, { ...migration, 5: step }).status, 'invalid');
      assert.equal(storage.values.get(key), text);
      assert.equal(storage.values.has(SAVE_KEY), false);
      assert.equal(storage.writes.length, 0);
    }
  }
});

const gameData: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const validGame = (candidate: unknown) => validateGame(candidate, gameData);
const gameMigrations = saveMigrations(gameData);

function levelRewardCheckpoint(count: number): LevelRewardGameState {
  let current = createGame(gameData);
  current.coins = gameData.tasks.reduce((sum, task) => sum + task.cost, 0);
  current.served = gameData.tasks[count - 1]?.goals.served ?? 0;
  current.merges = gameData.tasks[count - 1]?.goals.merges ?? 0;
  for (let index = 0; index < count; index++) {
    const result = reduceGame(current, { type: 'task' }, gameData);
    assert.equal(result.ok, true, result.message);
    current = result.state;
  }
  if (count >= 12) {
    current = reduceGame(current, { type: 'decorate', slot: 'tableware', variant: 'green' }, gameData).state;
    const sourceIndex = current.board.findIndex(cell => cell?.code === 'generator_bakery');
    const output = reduceGame(current, { type: 'spawn', index: sourceIndex, output: 'bakery_2' }, gameData);
    assert.equal(output.ok, true, output.message);
    current = reduceGame(output.state, { type: 'store', index: sourceIndex }, gameData).state;
  }
  const { completedQuests: _completed, legacySatisfiedQuests: _legacy, activeQuestProducers: _producers,
    layoutId: _layout, resolvedObstacles: _resolved, ...old } = current;
  return { ...old, version: 5, orders: old.orders.map(({ pricing: _, ...order }) => ({ ...order, reward: legacyOrderReward(order.requirements, gameData) })) };
}

function generatorCheckpoint(count: number): GeneratorGameState {
  const { claimedLevelRewards: _, ...old } = levelRewardCheckpoint(count);
  return { ...old, version: 4 };
}

function questStateResult(old: LevelRewardGameState): QuestGameState {
  return {
    ...old, version: 6, completedQuests: [], activeQuestProducers: {},
    legacySatisfiedQuests: gameData.quests.filter(quest => !quest.producer && quest.legacyAfter !== null && old.decorations.includes(quest.legacyAfter)).map(quest => quest.id),
  };
}

function questMigrationResult(old: LevelRewardGameState): GameState {
  return { ...questStateResult(old), version: 7, layoutId: 'legacy-open', resolvedObstacles: [] };
}

test('state-four migration preserves fresh, mid-campaign, and completed saves and starts claims empty once', () => {
  for (const count of [0, 12, 24]) {
    const old = generatorCheckpoint(count);
    if (count === 24) old.xp = 1500;
    const before = structuredClone(old);
    const text = generatorEnvelope(old);
    const intermediate: LevelRewardGameState = { ...old, version: 5, claimedLevelRewards: [] };
    const expected = questMigrationResult(intermediate);
    assert.equal(validateGeneratorGame(old, gameData), true);
    assert.deepEqual(migrateGeneratorGame(old, gameData), intermediate);
    assert.deepEqual(migrateGeneratorGame(old, gameData), intermediate);
    assert.deepEqual(old, before);
    assert.deepEqual(importSave(text, validGame, gameMigrations), expected);
    const storage = memoryStorage([[GENERATOR_SAVE_KEY, text]]);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
    assert.equal(storage.values.get(GENERATOR_SAVE_KEY), text);
    assert.equal(storage.writes.length, 1);
    assert.deepEqual(importSave(exportSave(expected, validGame), validGame), expected);
  }
});

test('a failed state-four migration write preserves the original and retry initializes claims once', () => {
  const old = generatorCheckpoint(24);
  old.xp = 1500;
  const text = generatorEnvelope(old);
  const storage = memoryStorage([[GENERATOR_SAVE_KEY, text]]);
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  const failed = loadSave(storage, validGame, gameMigrations);
  assert.equal(failed.state, null);
  assert.equal(failed.status, 'unavailable');
  assert.equal(storage.values.get(GENERATOR_SAVE_KEY), text);
  assert.equal(storage.values.has(SAVE_KEY), false);
  storage.setItem = write;
  const loaded = loadSave<GameState>(storage, validGame, gameMigrations);
  assert.equal(loaded.state!.coins, old.coins);
  assert.deepEqual(loaded.state!.claimedLevelRewards, []);
  assert.deepEqual(loadSave(storage, validGame, gameMigrations), loaded);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.values.get(GENERATOR_SAVE_KEY), text);
});

test('state-five migration preserves early, mid-story, and completed progress without quest awards', () => {
  for (const count of [0, 12, 24]) {
    const old = levelRewardCheckpoint(count);
    old.xp = 1500;
    old.claimedLevelRewards = gameData.levelRewards.slice(0, 3).map(reward => reward.id);
    const before = structuredClone(old);
    const expected = questMigrationResult(old);
    const text = levelRewardEnvelope(old);
    assert.equal(validateLevelRewardGame(old, gameData), true);
    assert.deepEqual(migrateLevelRewardGame(old, gameData), questStateResult(old));
    assert.deepEqual(migrateLevelRewardGame(old, gameData), questStateResult(old));
    assert.deepEqual(old, before);
    assert.deepEqual(importSave(text, validGame, gameMigrations), expected);
    const storage = memoryStorage([[LEVEL_REWARD_SAVE_KEY, text]]);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
    assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), text);
    assert.equal(storage.writes.length, 1);
    assert.deepEqual(importSave(exportSave(expected, validGame), validGame), expected);
    assert.equal(expected.coins, old.coins);
    assert.deepEqual(expected.board, old.board);
    assert.deepEqual(expected.inventory, old.inventory);
    assert.deepEqual(expected.orders, old.orders);
    assert.deepEqual(expected.claimedLevelRewards, old.claimedLevelRewards);
    assert.deepEqual(expected.completedQuests, []);
    assert.deepEqual(expected.activeQuestProducers, {});
    assert.ok(expected.legacySatisfiedQuests.every(id => !gameData.quests.find(quest => quest.id === id)!.producer));
  }
});

test('quest saves convert to the open layout at fresh, mid-campaign, and completed checkpoints', () => {
  for (const count of [0, 12, 24]) {
    const old = questStateResult(levelRewardCheckpoint(count));
    const before = structuredClone(old);
    const expected: GameState = { ...old, version: 7, layoutId: 'legacy-open', resolvedObstacles: [] };
    const text = questEnvelope(old);
    assert.deepEqual(migrateQuestGame(old, gameData), expected);
    assert.deepEqual(migrateQuestGame(old, gameData), expected);
    assert.deepEqual(old, before);
    assert.deepEqual(importSave(text, validGame, gameMigrations), expected);
    const storage = memoryStorage([[QUEST_SAVE_KEY, text]]);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
    assert.equal(storage.values.get(QUEST_SAVE_KEY), text);
    assert.equal(storage.writes.length, 1);
    assert.equal(JSON.parse(storage.values.get(SAVE_KEY)!).version, 6);
    assert.deepEqual(importSave(exportSave(expected, validGame), validGame), expected);
    for (const field of ['board', 'inventory', 'coins', 'xp', 'taskIndex', 'orders', 'discovered', 'seed', 'served', 'merges', 'nextOrderId',
      'decorations', 'decorationChoices', 'outputChoices', 'claimedLevelRewards', 'completedQuests', 'legacySatisfiedQuests', 'activeQuestProducers'] as const) {
      assert.deepEqual(expected[field], old[field]);
    }
  }
});

test('quest conversion keeps a loaned source and active quest progress', () => {
  const current = questMigrationResult(levelRewardCheckpoint(24));
  const quest = gameData.quests.find(candidate => candidate.producer)!;
  const accepted = reduceGame(current, { type: 'acceptQuest', id: quest.id }, gameData);
  assert.equal(accepted.ok, true, accepted.message);
  const { layoutId: _layout, resolvedObstacles: _resolved, ...old } = accepted.state;
  const previous: QuestGameState = { ...old, version: 6 };
  const text = questEnvelope(previous);
  const expected: GameState = { ...accepted.state, layoutId: 'legacy-open', resolvedObstacles: [] };
  assert.deepEqual(importSave(text, validGame, gameMigrations), expected);
  const storage = memoryStorage([[QUEST_SAVE_KEY, text]]);
  assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
  assert.equal(storage.values.get(QUEST_SAVE_KEY), text);
  assert.equal(storage.writes.length, 1);
  assert.deepEqual(expected.activeQuestProducers, accepted.state.activeQuestProducers);
});

test('failed quest-save conversion preserves the original bytes and retry writes one destination', () => {
  const old = questStateResult(levelRewardCheckpoint(12));
  const text = questEnvelope(old);
  const storage = memoryStorage([[QUEST_SAVE_KEY, text]]);
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  const failed = loadSave(storage, validGame, gameMigrations);
  assert.equal(failed.state, null);
  assert.equal(failed.status, 'unavailable');
  assert.match(failed.error!, /older save was preserved/);
  assert.equal(storage.values.get(QUEST_SAVE_KEY), text);
  assert.equal(storage.values.has(SAVE_KEY), false);
  storage.setItem = write;
  assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, migrateQuestGame(old, gameData));
  assert.equal(storage.values.get(QUEST_SAVE_KEY), text);
  assert.equal(storage.writes.length, 1);
});

test('a malformed quest save cannot replace a present destination or fall back to older progress', () => {
  const old = questStateResult(levelRewardCheckpoint(0));
  const earlier = levelRewardEnvelope(levelRewardCheckpoint(12));
  const current = exportSave(createGame(gameData), validGame);
  for (const invalid of [
    { ...old, layoutId: 'legacy-open' },
    { ...old, resolvedObstacles: [] },
    { ...old, board: [{ code: 'unknown' }, ...old.board.slice(1)] },
    { ...old, completedQuests: ['unknown'] },
  ]) {
    const text = questEnvelope(invalid);
    assert.throws(() => importSave(text, validGame, gameMigrations));
    const storage = memoryStorage([[QUEST_SAVE_KEY, text], [LEVEL_REWARD_SAVE_KEY, earlier]]);
    assert.equal(loadSave(storage, validGame, gameMigrations).status, 'invalid');
    assert.equal(storage.values.get(QUEST_SAVE_KEY), text);
    assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), earlier);
    assert.equal(storage.values.has(SAVE_KEY), false);
    assert.equal(storage.writes.length, 0);
    storage.values.set(SAVE_KEY, current);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, createGame(gameData));
    assert.equal(storage.values.get(QUEST_SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
  }
});

test('every older envelope keeps completed preparations with zero counters through migration and a failed write', () => {
  for (const count of [0, 1, 12, 24]) {
    const level = levelRewardCheckpoint(count);
    level.served = 0;
    level.merges = 0;
    const { claimedLevelRewards: _claims, ...beforeClaims } = level;
    const generator = { ...beforeClaims, version: 4 as const };
    const { outputChoices: _outputs, ...beforeOutputs } = generator;
    const previous = { ...beforeOutputs, version: 3 as const };
    const { decorationChoices: _choices, ...beforeChoices } = previous;
    const legacy = { ...beforeChoices, version: 2 as const };
    const sources = [
      { key: LEGACY_SAVE_KEY, text: legacyEnvelope(legacy), expected: questMigrationResult({ ...legacy, version: 5, decorationChoices: {}, outputChoices: {}, claimedLevelRewards: [] }) },
      { key: PREVIOUS_SAVE_KEY, text: previousEnvelope(previous), expected: questMigrationResult({ ...previous, version: 5, outputChoices: {}, claimedLevelRewards: [] }) },
      { key: GENERATOR_SAVE_KEY, text: generatorEnvelope(generator), expected: questMigrationResult({ ...generator, version: 5, claimedLevelRewards: [] }) },
      { key: LEVEL_REWARD_SAVE_KEY, text: levelRewardEnvelope(level), expected: questMigrationResult(level) },
    ];
    for (const { key, text, expected } of sources) {
      assert.deepEqual(importSave(text, validGame, gameMigrations), expected);
      const storage = memoryStorage([[key, text]]);
      const write = storage.setItem;
      storage.setItem = () => { throw new Error('Quota exceeded'); };
      const failed = loadSave(storage, validGame, gameMigrations);
      assert.equal(failed.status, 'unavailable');
      assert.equal(failed.state, null);
      assert.equal(storage.values.get(key), text);
      assert.equal(storage.values.has(SAVE_KEY), false);
      assert.equal(storage.writes.length, 0);
      storage.setItem = write;
      assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
      assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, expected);
      assert.equal(storage.values.get(key), text);
      assert.equal(storage.writes.length, 1);
      const attempted = reduceGame(expected, { type: 'task' }, gameData);
      assert.equal(attempted.ok, false);
      assert.equal(attempted.state, expected);
      assert.equal(expected.taskIndex, count);
      assert.deepEqual(expected.decorations, gameData.tasks.slice(0, count).map(task => task.id));
      assert.equal(expected.served, 0);
      assert.equal(expected.merges, 0);
    }
  }
});

test('current saves retain completed preparations with zero counters without a rewrite or inferred credit', () => {
  for (const count of [1, 12, 24]) {
    const current = questMigrationResult(levelRewardCheckpoint(count));
    current.served = 0;
    current.merges = 0;
    const before = structuredClone(current);
    const text = exportSave(current, validGame);
    assert.deepEqual(importSave(text, validGame, gameMigrations), before);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, before);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, before);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
    const result = reduceGame(current, { type: 'task' }, gameData);
    assert.equal(result.ok, false);
    assert.equal(result.state, current);
    assert.deepEqual(current, before);
  }
});

test('partial goals survive current and legacy import, export, and load and apply only to the next preparation', () => {
  for (const count of [0, 12, 23]) for (const missing of ['served', 'merges'] as const) {
    const old = levelRewardCheckpoint(count);
    const next = gameData.tasks[count];
    old.coins = next.cost;
    old.served = next.goals.served;
    old.merges = next.goals.merges;
    old[missing]--;
    const current = questMigrationResult(old);
    for (const text of [levelRewardEnvelope(old), exportSave(current, validGame)]) {
      const imported = importSave<GameState>(text, validGame, gameMigrations);
      assert.deepEqual(imported, current);
      const exported = exportSave(imported, validGame);
      const storage = memoryStorage([[SAVE_KEY, exported]]);
      const loaded = loadSave<GameState>(storage, validGame, gameMigrations).state!;
      assert.deepEqual(loaded, current);
      assert.deepEqual(importSave(exported, validGame, gameMigrations), current);
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

test('unsupported and malformed campaign saves remain recoverable without replacing current or older bytes', () => {
  const current = questMigrationResult(levelRewardCheckpoint(12));
  current.served = 0;
  current.merges = 0;
  const earlier = levelRewardEnvelope(levelRewardCheckpoint(1));
  const malformed = [
    JSON.stringify({ format: 'scary-snacks', version: 99, state: current }),
    ...[-1, 1.5, null, '13'].flatMap(value => [envelope({ ...current, served: value }), envelope({ ...current, merges: value })]),
  ];
  for (const text of malformed) {
    const storage = memoryStorage([[SAVE_KEY, text], [LEVEL_REWARD_SAVE_KEY, earlier]]);
    assert.throws(() => importSave(text, validGame, gameMigrations));
    assert.equal(loadSave(storage, validGame, gameMigrations).state, null);
    assert.equal(saveGame(storage, current, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), earlier);
    assert.equal(storage.writes.length, 0);
  }
});

test('a failed quest conversion write preserves the state-five bytes and retry converts only once', () => {
  const old = levelRewardCheckpoint(24);
  const text = levelRewardEnvelope(old);
  const storage = memoryStorage([[LEVEL_REWARD_SAVE_KEY, text]]);
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  const failed = loadSave(storage, validGame, gameMigrations);
  assert.equal(failed.state, null);
  assert.equal(failed.status, 'unavailable');
  assert.match(failed.error!, /older save was preserved/);
  assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), text);
  assert.equal(storage.values.has(SAVE_KEY), false);
  storage.setItem = write;
  const loaded = loadSave<GameState>(storage, validGame, gameMigrations);
  assert.deepEqual(loaded.state, questMigrationResult(old));
  assert.deepEqual(loadSave(storage, validGame, gameMigrations), loaded);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), text);
});

test('malformed state-five saves cannot migrate or replace older saved progress', () => {
  const old = levelRewardCheckpoint(12);
  const earlier = generatorEnvelope(generatorCheckpoint(0));
  for (const invalid of [
    { ...old, coins: -1 },
    { ...old, decorations: [] },
    { ...old, claimedLevelRewards: ['unknown'] },
    { ...old, outputChoices: { generator_bakery: 'bakery_6' } },
    { ...old, inventory: [{ code: 'unknown' }] },
    { ...old, completedQuests: [] },
    { ...old, legacySatisfiedQuests: [] },
    { ...old, activeQuestProducers: {} },
  ]) {
    const text = levelRewardEnvelope(invalid);
    const storage = memoryStorage([[LEVEL_REWARD_SAVE_KEY, text], [GENERATOR_SAVE_KEY, earlier]]);
    assert.throws(() => importSave(text, validGame, gameMigrations));
    assert.equal(loadSave(storage, validGame, gameMigrations).status, 'invalid');
    assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), text);
    assert.equal(storage.values.get(GENERATOR_SAVE_KEY), earlier);
    assert.equal(storage.values.has(SAVE_KEY), false);
    assert.equal(storage.writes.length, 0);
  }
});

test('unknown, duplicate, and contradictory quest records cannot replace current saved progress', () => {
  const current = createGame(gameData);
  const first = gameData.quests.find(quest => !quest.producer && quest.afterTask === null && !quest.afterQuest)!;
  const later = gameData.quests.find(quest => quest.afterQuest)!;
  const producer = gameData.quests.find(quest => quest.producer)!;
  const text = exportSave(current, validGame);
  const old = levelRewardEnvelope(levelRewardCheckpoint(24));
  const invalidStates = [
    ...[undefined, null, {}, 'quest', ['unknown'], [first.id, first.id], [12]].map(completedQuests => ({ ...current, completedQuests })),
    ...[undefined, null, {}, 'quest', ['unknown'], [first.id, first.id], [12]].map(legacySatisfiedQuests => ({ ...current, legacySatisfiedQuests })),
    ...[undefined, null, [], { unknown: 0 }, { [producer.id]: -1 }, { [producer.id]: 0 }].map(activeQuestProducers => ({ ...current, activeQuestProducers })),
    { ...current, completedQuests: [later.id] },
    { ...current, legacySatisfiedQuests: [first.id] },
    { ...current, completedQuests: [first.id], legacySatisfiedQuests: [first.id] },
    { ...current, completedQuests: [producer.id], activeQuestProducers: { [producer.id]: 0 } },
  ];
  for (const invalid of invalidStates) {
    const raw = envelope(invalid);
    const storage = memoryStorage([[SAVE_KEY, text], [LEVEL_REWARD_SAVE_KEY, old]]);
    assert.throws(() => importSave(raw, validGame, gameMigrations));
    assert.throws(() => exportSave(invalid, validGame));
    assert.equal(saveGame(storage, invalid, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
    storage.values.set(SAVE_KEY, raw);
    assert.equal(loadSave(storage, validGame, gameMigrations).status, 'invalid');
    assert.equal(saveGame(storage, current, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), raw);
    assert.equal(storage.values.get(LEVEL_REWARD_SAVE_KEY), old);
    assert.equal(storage.writes.length, 0);
  }
});

test('a failed quest delivery write keeps the session reward and reload restores only durable progress', () => {
  const current = createGame(gameData);
  const quest = gameData.quests.find(candidate => !candidate.producer && candidate.afterTask === null && !candidate.afterQuest)!;
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

test('an active quest producer and its output position survive pantry storage, import, and reload', () => {
  const current = questMigrationResult(levelRewardCheckpoint(24));
  const quest = gameData.quests.find(candidate => candidate.producer)!;
  const accepted = reduceGame(current, { type: 'acceptQuest', id: quest.id }, gameData);
  assert.equal(accepted.ok, true, accepted.message);
  const index = accepted.state.board.findIndex(cell => cell?.code === quest.producer!.item);
  assert.notEqual(index, -1);
  const produced = reduceGame(accepted.state, { type: 'spawn', index }, gameData);
  assert.equal(produced.ok, true, produced.message);
  assert.equal(produced.state.activeQuestProducers[quest.id], 1 % quest.producer!.outputs.length);
  const stored = reduceGame(produced.state, { type: 'store', index }, gameData);
  assert.equal(stored.ok, true, stored.message);
  const text = exportSave(stored.state, validGame);
  const storage = memoryStorage([[SAVE_KEY, text]]);
  const loaded = loadSave<GameState>(storage, validGame, gameMigrations).state!;
  assert.deepEqual(loaded, stored.state);
  assert.deepEqual(importSave(text, validGame, gameMigrations), stored.state);
  assert.equal(reduceGame(loaded, { type: 'acceptQuest', id: quest.id }, gameData).ok, false);
  assert.equal(storage.writes.length, 0);
  const storedIndex = loaded.inventory.findIndex(cell => cell.code === quest.producer!.item);
  const retrieved = reduceGame(loaded, { type: 'retrieve', index: storedIndex }, gameData);
  assert.equal(retrieved.ok, true, retrieved.message);
  const sourceIndex = retrieved.state.board.findIndex(cell => cell?.code === quest.producer!.item);
  const next = reduceGame(retrieved.state, { type: 'spawn', index: sourceIndex }, gameData);
  assert.equal(next.ok, true, next.message);
  assert.equal(next.state.activeQuestProducers[quest.id], 2 % quest.producer!.outputs.length);
  assert.equal(saveGame(storage, next.state, validGame).ok, true);
  assert.deepEqual(loadSave(storage, validGame).state, next.state);
});

test('a saved producer entitlement rejects missing or duplicate producers across the board and pantry', () => {
  const current = questMigrationResult(levelRewardCheckpoint(24));
  const quest = gameData.quests.find(candidate => candidate.producer)!;
  const accepted = reduceGame(current, { type: 'acceptQuest', id: quest.id }, gameData);
  assert.equal(accepted.ok, true, accepted.message);
  const sourceIndex = accepted.state.board.findIndex(cell => cell?.code === quest.producer!.item);
  const withoutSource = structuredClone(accepted.state);
  withoutSource.board[sourceIndex] = null;
  const doubleSource = structuredClone(accepted.state);
  doubleSource.inventory.push({ code: quest.producer!.item });
  const noEntitlement = { ...accepted.state, activeQuestProducers: {} };
  for (const invalid of [withoutSource, doubleSource, noEntitlement]) {
    const raw = envelope(invalid);
    const storage = memoryStorage([[SAVE_KEY, raw]]);
    assert.throws(() => importSave(raw, validGame, gameMigrations));
    assert.throws(() => exportSave(invalid, validGame));
    assert.equal(loadSave(storage, validGame, gameMigrations).status, 'invalid');
    assert.equal(storage.values.get(SAVE_KEY), raw);
    assert.equal(storage.writes.length, 0);
  }
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
    assert.deepEqual(importSave(text, validGame, gameMigrations), original);
    const storage = memoryStorage([[SAVE_KEY, text], [GENERATOR_SAVE_KEY, generatorEnvelope(generatorCheckpoint(24))]]);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, original);
    assert.deepEqual(loadSave(storage, validGame, gameMigrations).state, original);
    assert.equal(storage.writes.length, 0);
    assert.deepEqual(current, original);
    assert.equal(current.coins, gameData.levelRewards.slice(0, count).reduce((sum, reward) => sum + reward.coins, 0));
  }
});

test('corrupt claim sets cannot replace saved progress or fall back to older saves', () => {
  const current = createGame(gameData);
  current.xp = 100;
  const text = exportSave(current, validGame);
  const old = generatorEnvelope(generatorCheckpoint(0));
  const first = gameData.levelRewards[0].id;
  const future = gameData.levelRewards.at(-1)!.id;
  for (const claims of [undefined, null, {}, 'level-2', [first, first], [future], ['unknown'], [12]]) {
    const invalid = { ...current, claimedLevelRewards: claims };
    const raw = envelope(invalid);
    const storage = memoryStorage([[SAVE_KEY, text], [GENERATOR_SAVE_KEY, old]]);
    assert.throws(() => importSave(raw, validGame, gameMigrations));
    assert.throws(() => exportSave(invalid, validGame));
    assert.equal(saveGame(storage, invalid, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
    storage.values.set(SAVE_KEY, raw);
    assert.equal(loadSave(storage, validGame, gameMigrations).status, 'invalid');
    assert.equal(saveGame(storage, current, validGame).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), raw);
    assert.equal(storage.values.get(GENERATOR_SAVE_KEY), old);
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
