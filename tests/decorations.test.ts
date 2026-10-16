import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, reduceGame, validateGame, validateLegacyGame, migrateGame, validatePreviousGame, migratePreviousGame, validateGeneratorGame, migrateGeneratorGame, validateLevelRewardGame, migrateLevelRewardGame, migrateQuestGame, resolveDecorations, decorationProblems, legacyOrderReward, saveMigrations } from '../src/engine.ts';
import { exportSave, importSave, loadSave, saveGame, SAVE_KEY, PREVIOUS_SAVE_KEY, LEGACY_SAVE_KEY } from '../src/storage.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const provenance: { assets: { id: string }[] } = JSON.parse(await readFile(new URL('../docs/asset-provenance.json', import.meta.url), 'utf8'));
const validate = (state: unknown) => validateGame(state, data);
const migration = saveMigrations(data);
function checkpoint(count: number) {
  let state = { ...createGame(data), layoutId: 'legacy-open' };
  state.coins = data.tasks.reduce((sum, task) => sum + task.cost, 0);
  state.served = data.tasks[count - 1]?.goals.served ?? 0;
  state.merges = data.tasks[count - 1]?.goals.merges ?? 0;
  for (let index = 0; index < count; index++) {
    const result = reduceGame(state, { type: 'task' }, data);
    assert.equal(result.ok, true);
    state = result.state;
  }
  return state;
}
function legacy(state: GameState) {
  const { decorationChoices: _, outputChoices: __, claimedLevelRewards: ___, completedQuests: _completed, legacySatisfiedQuests: _legacy, activeQuestProducers: _active,
    layoutId: _layout, resolvedObstacles: _resolved, ...old } = structuredClone(state);
  return { ...old, version: 2, orders: old.orders.map(({ pricing: _, ...order }) => ({ ...order, reward: legacyOrderReward(order.requirements, data) })) };
}
function previous(state: GameState) {
  const { outputChoices: _, claimedLevelRewards: __, completedQuests: _completed, legacySatisfiedQuests: _legacy, activeQuestProducers: _active,
    layoutId: _layout, resolvedObstacles: _resolved, ...old } = structuredClone(state);
  return { ...old, version: 3, orders: old.orders.map(({ pricing: _, ...order }) => ({ ...order, reward: legacyOrderReward(order.requirements, data) })) };
}

test('every decoration has a distinct default, a preparation, a valid crop, and known images', () => {
  const images = provenance.assets.map(asset => asset.id);
  assert.deepEqual(decorationProblems(data, images), []);
  for (const change of [
    (copy: GameData) => { copy.decorationSlots[0].default = 'missing'; },
    (copy: GameData) => { copy.decorationSlots[0].variants[1].image = 'missing'; },
    (copy: GameData) => { copy.decorationSlots[0].variants[1].id = 'blue'; },
    (copy: GameData) => { copy.decorationSlots[0].unlock = 'missing'; },
    (copy: GameData) => { copy.decorationSlots[0].area = 'missing'; },
    (copy: GameData) => { copy.decorationSlots[1].id = copy.decorationSlots[0].id; },
    (copy: GameData) => { copy.decorationSlots[0].crop.width = 101; },
  ]) {
    const copy = structuredClone(data);
    change(copy);
    assert.ok(decorationProblems(copy, images).length);
  }
});

test('slots unlock with their own preparation and resolve an implicit default', () => {
  for (const count of [0, 8, 9, 21, 22, 23, 24]) {
    const state = checkpoint(count);
    const views = resolveDecorations(state.decorations, state.decorationChoices, data);
    assert.deepEqual(views.map(slot => slot.unlocked), [count >= 9, count >= 22, count >= 24]);
    assert.ok(views.every(slot => slot.selected.id === slot.default));
    assert.deepEqual(state.decorationChoices, {});
  }
});

test('choices affect only their slot, remain immutable, and repeated Apply gives no reward', () => {
  let state = checkpoint(24);
  const original = structuredClone(state);
  for (const slot of data.decorationSlots) {
    const before = structuredClone(state);
    const variant = slot.variants[1].id;
    const result = reduceGame(state, { type: 'decorate', slot: slot.id, variant }, data);
    assert.equal(result.ok, true);
    assert.deepEqual(state, before);
    assert.deepEqual(result.state, { ...before, decorationChoices: { ...before.decorationChoices, [slot.id]: variant } });
    assert.equal(validate(result.state), true);
    assert.deepEqual(reduceGame(result.state, { type: 'decorate', slot: slot.id, variant }, data).state, result.state);
    state = result.state;
  }
  assert.deepEqual(importSave(exportSave(state, validate), validate), state);
  for (const slot of data.decorationSlots) state = reduceGame(state, { type: 'decorate', slot: slot.id, variant: slot.default }, data).state;
  assert.deepEqual(state, original);
});

test('locked, unknown, and mismatched choices fail without any state change', () => {
  for (const [state, action] of [
    [checkpoint(8), { type: 'decorate', slot: 'tableware', variant: 'green' }],
    [checkpoint(24), { type: 'decorate', slot: 'unknown', variant: 'green' }],
    [checkpoint(24), { type: 'decorate', slot: 'tableware', variant: 'lilacs' }],
    [checkpoint(24), { type: 'decorate', slot: '__proto__', variant: 'blue' }],
  ] as [GameState, Action][]) {
    const before = structuredClone(state);
    const result = reduceGame(state, action, data);
    assert.equal(result.ok, false);
    assert.equal(result.state, state);
    assert.deepEqual(state, before);
  }
});

test('save validation rejects malformed choice maps and choices before unlock', () => {
  for (const choices of [null, [], 'blue', 1, { unknown: 'green' }, { tableware: 'lilacs' }, { tableware: null }, JSON.parse('{"__proto__":"green"}')]) {
    assert.equal(validate({ ...checkpoint(24), decorationChoices: choices }), false);
  }
  assert.equal(validate({ ...checkpoint(8), decorationChoices: { tableware: 'blue' } }), false);
  assert.equal(validate({ ...checkpoint(24), decorationChoices: { tableware: 'blue' } }), true);
  assert.equal(validateLegacyGame({ ...legacy(checkpoint(0)), decorationChoices: {} }, data), false);
});

test('every older save preserves fresh, partial, and complete campaigns with generators on the board or in the pantry', () => {
  for (const count of [0, 12, 24]) for (const envelopeVersion of [1, 2]) for (const pantry of [false, true]) {
    let expected = checkpoint(count);
    if (pantry) {
      // Preserve the order of two stored items, including a generator.
      for (let index = 0; index < 2; index++) {
        const source = expected.board.findIndex(cell => cell && Boolean(data.items[cell.code].generator) === (index === 1));
        const stored = reduceGame(expected, { type: 'store', index: source }, data);
        assert.equal(stored.ok, true);
        expected = stored.state;
      }
    }
    if (envelopeVersion === 2 && count >= 12) expected = reduceGame(expected, { type: 'decorate', slot: 'tableware', variant: 'green' }, data).state;
    const old = envelopeVersion === 1 ? legacy(expected) : previous(expected);
    expected.orders = structuredClone(old.orders);
    const original = structuredClone(old);
    const key = envelopeVersion === 1 ? LEGACY_SAVE_KEY : PREVIOUS_SAVE_KEY;
    const text = JSON.stringify({ format: 'scary-snacks', version: envelopeVersion, state: old });
    const values = new Map([[key, text]]);
    let writes = 0;
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { writes++; values.set(key, value); }, removeItem: () => assert.fail('Must not remove legacy bytes.') };
    assert.equal(envelopeVersion === 1 ? validateLegacyGame(old, data) : validatePreviousGame(old, data), true);
    assert.equal(validate(old), false);
    const intermediate = envelopeVersion === 1 ? migrateGame(old, data) : old;
    assert.equal(validatePreviousGame(intermediate, data), true);
    const generatorState = migratePreviousGame(intermediate, data);
    assert.equal(validateGeneratorGame(generatorState, data), true);
    expected.legacySatisfiedQuests = data.quests.filter(quest => quest.legacyAfter !== null && expected.decorations.includes(quest.legacyAfter)).map(quest => quest.id);
    assert.deepEqual(migrateQuestGame(migrateLevelRewardGame(migrateGeneratorGame(generatorState, data), data), data), expected);
    assert.deepEqual(migrateQuestGame(migrateLevelRewardGame(migrateGeneratorGame(generatorState, data), data), data), expected);
    assert.deepEqual(old, original);
    assert.deepEqual(importSave(text, validate, migration), expected);
    assert.deepEqual(loadSave(storage, validate, migration), { state: expected, status: 'loaded', error: null });
    assert.equal(values.get(key), text);
    assert.equal(JSON.parse(values.get(SAVE_KEY)!).version, 6);
    assert.deepEqual(loadSave(storage, validate, migration).state, expected);
    assert.equal(writes, 1, 'Reload must not migrate or reward a second time.');
    assert.deepEqual(importSave(exportSave(expected, validate), validate), expected);
    assert.deepEqual(expected.outputChoices, {});
  }
});

test('saved output choices round trip with pantry generators and corrupt choices never replace progress', () => {
  let current = checkpoint(24);
  const sourceIndex = current.board.findIndex(cell => cell && data.items[cell.code].generator);
  const source = data.items[current.board[sourceIndex]!.code];
  const output = Object.values(data.items).find(item => item.chain === source.chain && item.stage === 2 && !item.generator)!;
  current = reduceGame(current, { type: 'spawn', index: sourceIndex, output: output.id }, data).state;
  current = reduceGame(current, { type: 'store', index: sourceIndex }, data).state;
  assert.equal(current.outputChoices[source.chain], output.id);
  const text = exportSave(current, validate);
  assert.deepEqual(importSave(text, validate), current);
  const values = new Map([[SAVE_KEY, text]]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: () => assert.fail('Must keep the saved game.') };
  const other = Object.values(data.items).find(item => item.chain !== source.chain && item.stage === 2 && !item.generator)!;
  const stageOne = Object.values(data.items).find(item => item.chain === source.chain && item.stage === 1 && !item.generator)!;
  const tooHigh = Object.values(data.items).find(item => item.chain === source.chain && item.stage === 4 && !item.generator)!;
  for (const choices of [null, [], 'unknown', { unknown: output.id }, { [source.chain]: 'unknown' },
    { [source.chain]: source.id }, { [source.chain]: other.id }, { [source.chain]: stageOne.id },
    { [source.chain]: tooHigh.id }, JSON.parse('{"__proto__":"unknown"}')]) {
    const invalid = { ...current, outputChoices: choices };
    assert.throws(() => importSave(JSON.stringify({ format: 'scary-snacks', version: 6, state: invalid }), validate));
    assert.throws(() => exportSave(invalid, validate));
    assert.equal(saveGame(storage, invalid, validate).ok, false);
    assert.equal(values.get(SAVE_KEY), text);
  }
  const early = { ...checkpoint(0), outputChoices: { [source.chain]: output.id } };
  assert.throws(() => exportSave(early, validate));
  assert.deepEqual(loadSave(storage, validate).state, current);
});
