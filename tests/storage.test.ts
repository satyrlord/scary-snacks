import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_KEY, MAX_SAVE_BYTES, loadSave, saveGame, exportSave, importSave, resetSave, savedText } from '../src/storage.ts';
import { taskEligibility, resolveQuests, supperComplete, supperQuest } from '../src/model.ts';
import { createGame, reduceGame, repairSave } from '../src/engine.ts';
import type { GameState } from '../src/model.ts';
import { actOne, act, checkpoint, data, memoryStorage, prologueServed, rejected, supply, validate, withTickets, recovery } from './support.ts';

type State = { coins: number; board: ({ code: string } | null)[]; story: string; self?: State };

const valid = (candidate: unknown) => {
  const state = candidate as State | null;
  return Boolean(state && Number.isSafeInteger(state.coins) && state.coins >= 0 && Array.isArray(state.board));
};
const state = (): State => ({ coins: 12, board: [{ code: 'coffee_1' }, null], story: 'Mara' });
const envelope = (value: unknown) => JSON.stringify({ format: 'scary-snacks', version: 15, state: value });

test('empty storage loads without creating a save', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadSave(storage, valid), { state: null, status: 'empty', error: null, text: null });
  assert.equal(storage.writes.length, 0);
});

test('save uses one versioned key and round trips a detached state', () => {
  const storage = memoryStorage([['unrelated', 'keep']]);
  const original = state();
  const written = saveGame(storage, original, valid);
  assert.deepEqual(written, { ok: true, error: null, text: storage.values.get(SAVE_KEY) });
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
  assert.deepEqual(JSON.parse(text), { format: 'scary-snacks', version: 15, state: before });
  assert.deepEqual(importSave(text, valid), before);
  assert.deepEqual(original, before);
});

for (const [name, raw, status] of [
  ['corrupt JSON', '{broken', 'invalid'],
  ['unknown version', JSON.stringify({ format: 'scary-snacks', version: 99, state: state() }), 'unsupported'],
  ['previous version', JSON.stringify({ format: 'scary-snacks', version: 13, state: state() }), 'unsupported'],
  ['zero version', JSON.stringify({ format: 'scary-snacks', version: 0, state: state() }), 'unsupported'],
  ['fractional version', JSON.stringify({ format: 'scary-snacks', version: 4.5, state: state() }), 'unsupported'],
  ['text version', JSON.stringify({ format: 'scary-snacks', version: '6', state: state() }), 'unsupported'],
  ['unknown format', JSON.stringify({ format: 'another-game', version: 15, state: state() }), 'unsupported'],
  ['invalid state', envelope({ coins: -1, board: [] }), 'invalid'],
  ['missing state', JSON.stringify({ format: 'scary-snacks', version: 15 }), 'invalid'],
  ['empty string', '', 'invalid'],
  ['null envelope', 'null', 'invalid'],
  ['array envelope', '[]', 'invalid'],
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
  assert.deepEqual(saveGame(null, state(), valid), { ok: false, error: 'Browser storage is unavailable.', text: null });
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

test('validation checks the serialized state that storage and files keep', () => {
  const original = { ...state(), toJSON() { return { coins: -1, board: [] }; } };
  assert.throws(() => exportSave(original, valid), /damaged or unknown game data/);
});

test('validator exceptions and non-boolean results cannot admit a save', () => {
  const throwing = () => { throw new Error('Engine validation error'); };
  assert.throws(() => importSave(envelope(state()), throwing), /could not be checked/);
  assert.throws(() => exportSave(state(), () => 'valid'), /damaged or unknown game data/);
  assert.throws(() => exportSave(state(), undefined), /validator/);
});

test('a write over the save that the game last read or wrote checks the game once', () => {
  let checks = 0;
  const counted = (candidate: unknown) => { checks++; return valid(candidate); };
  const storage = memoryStorage([[SAVE_KEY, envelope(state())]]);
  assert.equal(loadSave(storage, counted).status, 'loaded');
  for (const coins of [13, 14, 15]) {
    checks = 0;
    assert.equal(saveGame(storage, { ...state(), coins }, counted).ok, true);
    assert.equal(checks, 1, 'Only the new save is checked.');
  }
  assert.equal(loadSave<State>(storage, counted).state?.coins, 15);
});

test('a write checks a current save that another writer changed, and preserves it when it cannot be read', () => {
  const storage = memoryStorage();
  assert.equal(saveGame(storage, state(), valid).ok, true);
  storage.values.set(SAVE_KEY, envelope({ ...state(), coins: 20 }));
  assert.equal(saveGame(storage, { ...state(), coins: 21 }, valid).ok, true);
  storage.values.set(SAVE_KEY, '{broken');
  const refused = saveGame(storage, { ...state(), coins: 22 }, valid);
  assert.equal(refused.ok, false);
  assert.match(refused.error ?? '', /existing save was preserved/);
  assert.equal(storage.values.get(SAVE_KEY), '{broken');
});

test('the stored text reads without a parse, and is null without a save or readable storage', () => {
  const storage = memoryStorage([[SAVE_KEY, '{broken']]);
  assert.equal(savedText(storage), '{broken');
  assert.equal(savedText(memoryStorage()), null);
  assert.equal(savedText(null), null);
  storage.getItem = () => { throw new Error('Access denied'); };
  assert.equal(savedText(storage), null);
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

test('previous campaigns stay unread and unchanged while a fresh campaign saves and resets', () => {
  assert.equal(SAVE_KEY, 'scary-snacks-save-v15');
  for (const count of [0, 1, 9, 12, 19, 24]) {
    const previous = { ...checkpoint(count), version: 15 };
    const previousKey = 'scary-snacks-save-v14';
    const bytes = JSON.stringify({ format: 'scary-snacks', version: 14, state: previous });
    const storage = memoryStorage([[previousKey, bytes]]);
    const reads: string[] = [];
    const getItem = storage.getItem;
    storage.getItem = key => { reads.push(key); return getItem(key); };
    storage.removeItem = () => assert.fail('Save and reset must not remove a saved game.');
    assert.deepEqual(loadSave(storage, validate), { state: null, status: 'empty', error: null, text: null });
    assert.deepEqual(reads, [SAVE_KEY], 'Load must not inspect an earlier key.');
    assert.equal(storage.writes.length, 0);
    assert.throws(() => importSave(bytes, validate), { status: 'unsupported' });
    for (const version of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]) {
      assert.throws(() => importSave(JSON.stringify({ format: 'scary-snacks', version, state: previous }), () => assert.fail('An unsupported envelope must stop before state validation.')),
        { status: 'unsupported' }, String(version));
    }
    const fresh = createGame(data);
    assert.equal(fresh.version, 16);
    assert.equal(fresh.taskIndex, 0);
    assert.deepEqual(fresh.completedQuests, []);
    assert.equal(saveGame(storage, fresh, validate).ok, true);
    assert.deepEqual(loadSave(storage, validate).state, fresh);
    assert.equal(saveGame(storage, checkpoint(1), validate).ok, true);
    assert.equal(resetSave(storage, fresh, validate).ok, true);
    assert.deepEqual(loadSave(storage, validate).state, fresh);
    assert.ok(reads.every(key => key === SAVE_KEY));
    assert.ok(storage.writes.every(([key]) => key === SAVE_KEY));
    assert.equal(storage.values.get(previousKey), bytes);
  }
});

test('the current envelope accepts state version 16 and rejects state version 15 without replacing it', () => {
  const current = checkpoint(1);
  const bytes = exportSave(current, validate);
  assert.equal(JSON.parse(bytes).version, 15);
  assert.equal(current.version, 16);
  assert.deepEqual(importSave(bytes, validate), current);
  const previous = { ...current, version: 15 };
  assert.equal(validate(previous), false);
  const malformed = envelope(previous);
  assert.throws(() => importSave(malformed, validate), /damaged or unknown/);
  const storage = memoryStorage([[SAVE_KEY, malformed]]);
  assert.equal(loadSave(storage, validate).status, 'invalid');
  assert.equal(saveGame(storage, current, validate).ok, false);
  assert.equal(storage.values.get(SAVE_KEY), malformed);
  assert.equal(storage.writes.length, 0);
});

test('pending story scenes survive export, import, and reload', () => {
  const finished = { ...checkpoint(24), completedQuests: [...checkpoint(24).completedQuests, supperQuest(data)!.id], coins: 0, act1: { purse: 0 } };
  for (const pendingScenes of [[], ['chapter-6'], ['finale'], ['chapter-6', 'finale'], ['chapter-1', 'chapter-4', 'finale']]) {
    const state = { ...finished, pendingScenes };
    const text = exportSave(state, validate);
    assert.deepEqual(importSave(text, validate), state);
    const storage = memoryStorage();
    assert.equal(saveGame(storage, state, validate).ok, true);
    assert.deepEqual(loadSave(storage, validate).state, state);
  }
});

test('a save that waits for the finale before the supper delivery loads and imports without the finale', () => {
  const supper = supperQuest(data)!, unserved = checkpoint(24);
  const waiting = { ...unserved, pendingScenes: [...unserved.pendingScenes, data.finale.id] };
  const repair = (candidate: unknown) => repairSave(candidate, data);
  assert.equal(validate(waiting), false);
  const storage = memoryStorage([[SAVE_KEY, envelope(waiting)]]);
  const loaded = loadSave<GameState>(storage, validate, repair);
  assert.equal(loaded.status, 'loaded');
  assert.deepEqual(loaded.state, unserved);
  assert.equal(storage.writes.length, 0);
  assert.deepEqual(importSave(envelope(waiting), validate, repair), loaded.state);
  assert.equal(resolveQuests(loaded.state!, data).find(view => view.quest.id === supper.id)!.status, 'active');
  const served = act(supply(loaded.state!, supper.id), { type: 'deliverQuest', id: supper.id });
  assert.deepEqual(served.pendingScenes.slice(-1), [data.finale.id]);
  assert.equal(saveGame(storage, served, validate).ok, true);
  assert.deepEqual(loadSave(storage, validate, repair).state, served);
  // A served supper keeps its waiting finale.
  assert.equal(repairSave(served, data), served);
});

test('a save with every preparation done and the supper not served loads with the supper quest open and no finale', () => {
  const supper = supperQuest(data)!, complete = checkpoint(24);
  const storage = memoryStorage([[SAVE_KEY, envelope(complete)]]);
  const loaded = loadSave<GameState>(storage, validate).state!;
  assert.deepEqual(loaded, complete);
  assert.equal(supperComplete(loaded, data), false);
  assert.ok(!loaded.pendingScenes.includes(data.finale.id));
  assert.equal(resolveQuests(loaded, data).find(view => view.quest.id === supper.id)!.status, 'active');
  const served = act(supply(loaded, supper.id), { type: 'deliverQuest', id: supper.id });
  assert.equal(supperComplete(served, data), true);
  assert.equal(saveGame(storage, served, validate).ok, true);
  assert.deepEqual(loadSave(storage, validate).state, served);
});

test('a current save with fields that the format does not define still loads and plays, and the next save keeps only the state field', () => {
  const held = { ...checkpoint(1), unknownField: 'kept' };
  const storage = memoryStorage([[SAVE_KEY, JSON.stringify({ format: 'scary-snacks', version: 15, state: held, unknownField: 'ignored' })]]);
  const loaded = loadSave<GameState>(storage, validate);
  assert.equal(loaded.status, 'loaded');
  assert.deepEqual(loaded.state, held);
  const source = loaded.state!.board.findIndex(cell => cell && data.items[cell.code].generator);
  const played = reduceGame(loaded.state!, { type: 'spawn', index: source }, data);
  assert.equal(played.ok, true, played.message);
  assert.equal(storage.writes.length, 0);
  assert.equal(saveGame(storage, played.state, validate).ok, true);
  const written = JSON.parse(storage.values.get(SAVE_KEY)!);
  assert.deepEqual(Object.keys(written), ['format', 'version', 'state']);
  assert.equal(written.state.unknownField, 'kept');
});

test('saved checkpoints load unchanged without a rewrite or inferred progress', () => {
  for (const count of [0, 1, 12, 24]) {
    const current = checkpoint(count);
    const before = structuredClone(current);
    const text = exportSave(current, validate);
    assert.deepEqual(importSave(text, validate), before);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.deepEqual(loadSave(storage, validate).state, before);
    assert.deepEqual(loadSave(storage, validate).state, before);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
    assert.deepEqual(current, before);
  }
});

test('a loaded save without the quests of the next preparation cannot pay for it until they are delivered', () => {
  for (const count of [1, 12, 23]) {
    const ready = checkpoint(count);
    const current = { ...ready, completedQuests: checkpoint(count - 1).completedQuests };
    const text = exportSave(current, validate);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    const loaded = loadSave<GameState>(storage, validate).state!;
    assert.deepEqual(loaded, current);
    assert.equal(storage.writes.length, 0);
    assert.equal(taskEligibility(loaded, data).ready, false);
    assert.ok(taskEligibility(loaded, data).blockers.some(blocker => /^Deliver \d+ more quests? for this preparation\.$/.test(blocker)));
    rejected(loaded, { type: 'task' });
    assert.deepEqual(importSave(text, validate), current);
    assert.equal(validate(ready), true);
    const paid = reduceGame(ready, { type: 'task' }, data);
    assert.equal(paid.ok, true, paid.message);
    assert.equal(paid.state.taskIndex, count + 1);
    assert.equal(paid.state.coins, 0);
  }
});

test('malformed campaign saves remain recoverable without replacing current bytes', () => {
  const current = checkpoint(12);
  const malformed = [
    ...[-1_000_000_001, 1.5, null, '13'].map(value => envelope({ ...current, coins: value })),
    envelope({ ...current, completedQuests: [] }),
  ];
  for (const text of malformed) {
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.throws(() => importSave(text, validate));
    assert.equal(loadSave(storage, validate).state, null);
    assert.equal(saveGame(storage, current, validate).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
  }
});

test('unknown, duplicate, contradictory, and recovery quest records cannot replace current saved progress', () => {
  const current = actOne();
  const first = data.quests.find(quest => quest.afterTask === null && !quest.afterQuest && !quest.recovery)!;
  const later = data.quests.find(quest => quest.afterQuest)!;
  const text = exportSave(current, validate);
  const invalidStates = [
    ...[undefined, null, {}, 'quest', [...prologueServed, 'unknown'], [...prologueServed, first.id, first.id], [...prologueServed, 12], [first.id]].map(completedQuests => ({ ...current, completedQuests })),
    { ...current, completedQuests: [...prologueServed, later.id] }, { ...current, completedQuests: [...prologueServed.slice(1), first.id] },
    { ...current, completedQuests: [...prologueServed, recovery.id] }, { ...current, completedQuests: [...prologueServed, first.id, recovery.id] },
  ];
  assert.equal(validate(withTickets({ ...current, completedQuests: [...prologueServed, first.id], discovered: [...current.discovered] })), true);
  for (const invalid of invalidStates) {
    const raw = envelope(invalid);
    const storage = memoryStorage([[SAVE_KEY, text]]);
    assert.throws(() => importSave(raw, validate));
    assert.throws(() => exportSave(invalid, validate));
    assert.equal(saveGame(storage, invalid, validate).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), text);
    assert.equal(storage.writes.length, 0);
    storage.values.set(SAVE_KEY, raw);
    assert.equal(loadSave(storage, validate).status, 'invalid');
    assert.equal(saveGame(storage, current, validate).ok, false);
    assert.equal(storage.values.get(SAVE_KEY), raw);
    assert.equal(storage.writes.length, 0);
  }
});

test('a failed quest delivery write keeps the session reward and reload restores only durable progress', () => {
  const quest = data.quests.find(candidate => candidate.afterTask === null && !candidate.afterQuest && !candidate.recovery)!;
  const current = supply(actOne(), quest.id);
  const text = exportSave(current, validate);
  const storage = memoryStorage([[SAVE_KEY, text]]);
  const delivered = reduceGame(current, { type: 'deliverQuest', id: quest.id }, data);
  assert.equal(delivered.ok, true, delivered.message);
  const live = structuredClone(delivered.state);
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(saveGame(storage, delivered.state, validate).ok, false);
  assert.equal(storage.values.get(SAVE_KEY), text);
  assert.deepEqual(delivered.state, live);
  assert.deepEqual(loadSave(storage, validate).state, current);
  assert.equal(reduceGame(delivered.state, { type: 'deliverQuest', id: quest.id }, data).ok, false);
  storage.setItem = write;
  assert.equal(saveGame(storage, delivered.state, validate).ok, true);
  const reloaded = loadSave<GameState>(storage, validate).state!;
  assert.deepEqual(reloaded, live);
  assert.equal(reloaded.coins, current.coins + quest.reward);
  assert.deepEqual(reloaded.completedQuests, [...prologueServed, quest.id]);
  assert.deepEqual(importSave(exportSave(live, validate), validate), live);
  assert.equal(reduceGame(reloaded, { type: 'deliverQuest', id: quest.id }, data).ok, false);
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
