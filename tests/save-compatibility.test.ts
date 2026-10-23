import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { Action, GameState } from '../src/model.ts';
import { reduceGame } from '../src/engine.ts';
import { exportSave, importSave, loadSave, saveGame, SAVE_KEY } from '../src/storage.ts';
import { data, memoryStorage, validate } from './support.ts';

// Fixed saves protect the supported release. Do not regenerate them with the rules under test.
const saves: Record<string, { format: string; version: number; state: GameState }> = JSON.parse(await readFile(new URL('./fixtures/save-v17.json', import.meta.url), 'utf8'));

for (const [name, envelope] of Object.entries(saves)) test(`the supported ${name} save loads, imports, and exports without a progress change`, () => {
  assert.equal(SAVE_KEY, 'scary-snacks-save-v17');
  assert.equal(envelope.version, 17);
  assert.equal(envelope.state.version, 18);
  const text = JSON.stringify(envelope), storage = memoryStorage([[SAVE_KEY, text]]);
  const loaded = loadSave<GameState>(storage, validate);
  assert.equal(loaded.status, 'loaded', loaded.error ?? name);
  assert.deepEqual(loaded.state, envelope.state);
  assert.deepEqual(importSave(text, validate), envelope.state);
  assert.deepEqual(JSON.parse(exportSave(loaded.state, validate)), envelope);
  assert.equal(storage.values.get(SAVE_KEY), text);
  assert.equal(storage.writes.length, 0, 'Load and import do not rewrite the saved bytes.');
  assert.equal(saveGame(storage, loaded.state, validate).ok, true);
  assert.deepEqual(loadSave(storage, validate).state, envelope.state);
});

test('the supported saves can continue and save without repeating progress or rewards', () => {
  for (const [name, envelope] of Object.entries(saves)) {
    const storage = memoryStorage([[SAVE_KEY, JSON.stringify(envelope)]]);
    const state = loadSave<GameState>(storage, validate).state!;
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
    assert.deepEqual(loadSave(storage, validate).state, played.state);
    assert.deepEqual(importSave(exportSave(played.state, validate), validate), played.state);
    if (name === 'prologue-last-scene') {
      assert.equal(played.state.prologue, null);
      assert.equal(played.state.coins, data.prologue.gift);
      assert.equal(reduceGame(played.state, action, data).ok, false, 'The starting gift cannot repeat.');
    } else {
      assert.equal(played.state.coins, before.coins);
      assert.equal(played.state.taskIndex, before.taskIndex);
      assert.deepEqual(played.state.completedQuests, before.completedQuests);
      assert.deepEqual(played.state.act1, before.act1);
      assert.deepEqual(played.state.act2, before.act2);
    }
  }
});

test('an export in an earlier format fails on import and keeps the current save', () => {
  const current = JSON.stringify(saves['supper-served']), storage = memoryStorage([[SAVE_KEY, current]]);
  const earlier = JSON.stringify({ format: 'scary-snacks', version: 16, state: { ...saves['act-one-start'].state, version: 17 } });
  assert.throws(() => importSave(earlier, validate), { status: 'unsupported' });
  assert.equal(loadSave(storage, validate).status, 'loaded');
  assert.equal(storage.values.get(SAVE_KEY), current);
  assert.equal(storage.writes.length, 0);
});
