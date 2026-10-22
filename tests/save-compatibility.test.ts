import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { Action, GameState } from '../src/model.ts';
import { reduceGame, repairSave } from '../src/engine.ts';
import { exportSave, importSave, loadSave, saveGame, SAVE_KEY } from '../src/storage.ts';
import { data, memoryStorage, validate } from './support.ts';

// Fixed saves protect the supported release. Do not regenerate them with the rules under test.
const saves: Record<string, { format: string; version: number; state: GameState }> = JSON.parse(await readFile(new URL('./fixtures/save-v16.json', import.meta.url), 'utf8'));
const repair = (candidate: unknown) => repairSave(candidate, data);

for (const [name, envelope] of Object.entries(saves)) test(`the supported ${name} save loads, imports, and exports without a progress change`, () => {
  assert.equal(SAVE_KEY, 'scary-snacks-save-v16');
  assert.equal(envelope.version, 16);
  assert.equal(envelope.state.version, 17);
  const text = JSON.stringify(envelope), storage = memoryStorage([[SAVE_KEY, text]]);
  const loaded = loadSave<GameState>(storage, validate, repair);
  assert.equal(loaded.status, 'loaded', loaded.error ?? name);
  assert.deepEqual(loaded.state, envelope.state);
  assert.deepEqual(importSave(text, validate, repair), envelope.state);
  assert.deepEqual(JSON.parse(exportSave(loaded.state, validate)), envelope);
  assert.equal(storage.values.get(SAVE_KEY), text);
  assert.equal(storage.writes.length, 0, 'Load and import do not rewrite the saved bytes.');
  assert.equal(saveGame(storage, loaded.state, validate).ok, true);
  assert.deepEqual(loadSave(storage, validate, repair).state, envelope.state);
});

test('the supported saves can continue and save without repeating progress or rewards', () => {
  for (const [name, envelope] of Object.entries(saves)) {
    const storage = memoryStorage([[SAVE_KEY, JSON.stringify(envelope)]]);
    const state = loadSave<GameState>(storage, validate, repair).state!;
    const before = structuredClone(state);
    // Reading leaves the board intact except for the final prologue scene, which starts act 1.
    // Otherwise use a free source so a debt cannot stop the check.
    const action: Action = state.prologue && state.pendingScenes.length
      ? { type: 'readScene', id: state.pendingScenes[0] }
      : { type: 'spawn', index: state.board.findIndex(cell => cell?.code === 'generator_herbs') };
    const played = reduceGame(state, action, data);
    assert.equal(played.ok, true, `${name}: ${played.message}`);
    assert.equal(validate(played.state), true, name);
    assert.deepEqual(state, before, 'Play does not mutate the loaded input.');
    assert.equal(saveGame(storage, played.state, validate).ok, true, name);
    assert.deepEqual(loadSave(storage, validate, repair).state, played.state);
    assert.deepEqual(importSave(exportSave(played.state, validate), validate, repair), played.state);
    if (name === 'prologue-last-scene') {
      assert.equal(played.state.prologue, null);
      assert.equal(played.state.coins, data.prologue.gift);
      assert.equal(reduceGame(played.state, action, data).ok, false, 'The starting gift cannot repeat.');
    } else {
      assert.equal(played.state.coins, before.coins);
      assert.equal(played.state.taskIndex, before.taskIndex);
      assert.deepEqual(played.state.completedQuests, before.completedQuests);
      assert.deepEqual(played.state.act1, before.act1);
    }
  }
});
