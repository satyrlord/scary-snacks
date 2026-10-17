import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, decorationUnlocked, firstFreeBoardCell, reduceGame, validateGame, resolveDecorations, decorationProblems } from '../src/engine.ts';
import { exportSave, importSave } from '../src/storage.ts';
import type { Action, GameData, GameState } from '../src/engine.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
data.board.layouts.push({ id: 'test-open', obstacles: [] });
const provenance: { assets: { id: string }[] } = JSON.parse(await readFile(new URL('../docs/asset-provenance.json', import.meta.url), 'utf8'));
const validate = (state: unknown) => validateGame(state, data);
const checkpoint = (count: number) => checkpointState(data, count, { ...createGame(data), layoutId: 'test-open' });
/** Deliver an active quest with its items placed on free cells. */
function deliver(state: GameState, id: string) {
  const next = structuredClone(state);
  for (const { item, quantity } of data.quests.find(quest => quest.id === id)!.requirements) for (let count = 0; count < quantity; count++) {
    next.board[firstFreeBoardCell(next, data)] = { code: item };
    if (!next.discovered.includes(item)) next.discovered.push(item);
  }
  const result = reduceGame(next, { type: 'deliverQuest', id }, data);
  assert.equal(result.ok, true, result.message);
  return result.state;
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

test('every second finish has exactly one quest, and the finale has them all', () => {
  for (const slot of data.decorationSlots) for (const variant of slot.variants.filter(variant => variant.id !== slot.default)) {
    assert.equal(data.quests.filter(quest => quest.unlocks?.slot === slot.id && quest.unlocks.variant === variant.id).length, 1, `${slot.id}: ${variant.id}`);
  }
  const finale = checkpoint(24);
  assert.ok(data.decorationSlots.every(slot => slot.variants.every(variant => decorationUnlocked(finale, slot, variant.id, data))));
});

test('a finish unlocks only with the delivery of its quest, and the decorate action rejects a locked finish', () => {
  // The tableware is in place, and the quests that open with it wait.
  const open = { ...checkpoint(9), completedQuests: checkpoint(8).completedQuests };
  assert.equal(validate(open), true);
  const slot = data.decorationSlots.find(slot => slot.id === 'tableware')!;
  assert.equal(resolveDecorations(open.decorations, open.decorationChoices, data)[0].unlocked, true);
  assert.equal(decorationUnlocked(open, slot, 'blue', data), true, 'A default finish needs no quest.');
  assert.equal(decorationUnlocked(open, slot, 'green', data), false);
  const before = structuredClone(open);
  const locked = reduceGame(open, { type: 'decorate', slot: 'tableware', variant: 'green' }, data);
  assert.equal(locked.ok, false);
  assert.match(locked.message, /Deliver the quest/);
  assert.equal(locked.state, open);
  assert.deepEqual(open, before);
  assert.equal(validate({ ...open, decorationChoices: { tableware: 'green' } }), false, 'A save cannot hold a locked finish.');
  const delivered = deliver(deliver(open, 'eszter-table'), 'eszter-green-bowls');
  assert.equal(decorationUnlocked(delivered, slot, 'green', data), true);
  const chosen = reduceGame(delivered, { type: 'decorate', slot: 'tableware', variant: 'green' }, data);
  assert.equal(chosen.ok, true, chosen.message);
  assert.deepEqual(chosen.state.decorationChoices, { tableware: 'green' });
  assert.equal(validate(chosen.state), true);
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
  assert.equal(validate({ ...checkpoint(24), decorationChoices: { tableware: 'blue' } }), false, 'A save holds only a finish that is not the default.');
  assert.equal(validate({ ...checkpoint(24), decorationChoices: { tableware: 'green' } }), true);
});
