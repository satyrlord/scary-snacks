import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame, guideStages, reduceGame, requiredQuests, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState, Guide } from '../src/engine.ts';
import { exportSave, importSave, loadSave, saveGame, SAVE_KEY } from '../src/storage.ts';

const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
const validate = (candidate: unknown) => validateGame(candidate, data);
// The resources that a guide transition must never change.
const resources = (state: GameState) => JSON.stringify({ ...state, guide: undefined, pendingScenes: undefined, sceneLines: undefined });
function apply(state: GameState, action: Action) {
  const result = reduceGame(state, action, data);
  assert.equal(result.ok, true, result.message);
  assert.equal(validate(result.state), true, `Invalid state after ${action.type}`);
  return result.state;
}
function rejected(state: GameState, action: Action) {
  const result = reduceGame(state, action, data);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
}
const done = (state: GameState) => guideStages.filter(stage => state.guide!.done[stage]);
const flour = (state: GameState) => state.board.flatMap((cell, index) => cell?.code === 'bakery_1' ? [index] : []);
const source = (state: GameState, chain: string) => state.board.findIndex(cell => cell?.code === `generator_${chain}`);
/** Every quest that the first preparation needs, delivered, with its exact cost. */
function readyToPay(state: GameState) {
  const next = structuredClone(state);
  next.completedQuests = requiredQuests(0, data).map(quest => quest.id);
  next.coins = data.tasks[0].cost;
  return next;
}
function memoryStorage() {
  const values = new Map<string, string>();
  return { values, failing: false, getItem: (key: string) => values.get(key) ?? null,
    setItem(this: { failing: boolean }, key: string, value: string) { if (this.failing) throw new Error('Storage is full.'); values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); } };
}

test('a new game starts an active guide at its first step', () => {
  const state = createGame(data);
  assert.deepEqual(state.guide, { status: 'active', stage: 'merge', done: { merge: false, take: false, deliver: false, prepare: false, story: false } });
  assert.equal(validate(state), true);
});

test('each step advances only after its successful action, in the guide order', () => {
  let state = createGame(data);
  const [a, b] = flour(state);
  // A plain move and a failed action are not steps.
  state = apply(state, { type: 'move', from: a, to: 7 });
  rejected(state, { type: 'move', from: 7, to: 7 });
  assert.deepEqual(done(state), []);
  state = apply(state, { type: 'move', from: 7, to: b });
  assert.deepEqual(done(state), ['merge']);
  assert.equal(state.guide!.stage, 'take');
  state = apply(state, { type: 'spawn', index: source(state, 'bakery') });
  assert.equal(state.guide!.stage, 'deliver');
});

test('out-of-order play records each success, so the run skips the steps that it already satisfies', () => {
  let state = createGame(data);
  // Take first: the run records it and still asks for a merge.
  state = apply(state, { type: 'spawn', index: source(state, 'drinks') });
  assert.deepEqual(done(state), ['take']);
  assert.equal(state.guide!.stage, 'merge');
  // A merge then skips the satisfied Take step.
  const [a, b] = flour(state);
  state = apply(state, { type: 'move', from: a, to: b });
  assert.deepEqual(done(state), ['merge', 'take']);
  assert.equal(state.guide!.stage, 'deliver');
  // A payment before any delivery records Prepare, and its scene completes Read and return.
  state = apply(readyToPay(state), { type: 'task' });
  assert.equal(state.guide!.stage, 'deliver');
  state = apply(state, { type: 'readScene', id: data.tasks[0].id });
  assert.deepEqual(done(state), ['merge', 'take', 'prepare', 'story']);
  assert.equal(state.guide!.status, 'active');
});

test('the last step completes the run, and later actions change nothing in a complete run', () => {
  let state = createGame(data);
  state.guide!.done = { merge: true, take: true, deliver: true, prepare: true, story: false };
  state.guide!.stage = 'story';
  state = apply(readyToPay(state), { type: 'task' });
  state = apply(state, { type: 'readScene', id: data.tasks[0].id });
  assert.deepEqual(state.guide, { status: 'complete', stage: 'story', done: { merge: true, take: true, deliver: true, prepare: true, story: true } });
  const after = apply(state, { type: 'spawn', index: source(state, 'bakery') });
  assert.deepEqual(after.guide, state.guide);
});

test('a full board fails a take without a step, and the ordinary merge remedy frees space and continues the run', () => {
  let state = createGame(data);
  state.board = state.board.map((cell, index) => cell ?? (data.board.layouts[0].obstacles.some(obstacle => obstacle.position === index) ? null : { code: 'warm_6' }));
  state.discovered.push('warm_6');
  assert.equal(validate(state), true);
  rejected(state, { type: 'spawn', index: source(state, 'bakery') });
  assert.deepEqual(done(state), []);
  const [a, b] = flour(state);
  state = apply(state, { type: 'move', from: a, to: b });
  state = apply(state, { type: 'spawn', index: source(state, 'bakery') });
  assert.deepEqual(done(state), ['merge', 'take']);
  // No item was removed for the guide: the board keeps every final dish.
  assert.equal(state.board.filter(cell => cell?.code === 'warm_6').length, data.board.initial.filter((code, index) => !code && !data.board.layouts[0].obstacles.some(obstacle => obstacle.position === index)).length);
});

test('a delivery records the Deliver step', () => {
  let state = createGame(data);
  const welcome = data.quests[0];
  state.board[state.board.findIndex((cell, index) => !cell && !data.board.layouts[0].obstacles.some(obstacle => obstacle.position === index))] = { code: welcome.requirements[0].item };
  state = apply(state, { type: 'deliverQuest', id: welcome.id });
  assert.deepEqual(done(state), ['deliver']);
});

test('Skip pauses the run without a change to resources, and resume continues it with its record', () => {
  let state = createGame(data);
  const [a, b] = flour(state);
  state = apply(state, { type: 'move', from: a, to: b });
  const skipped = apply(state, { type: 'guide', status: 'dismissed' });
  assert.equal(skipped.guide!.status, 'dismissed');
  assert.equal(resources(skipped), resources(state));
  rejected(skipped, { type: 'guide', status: 'dismissed' });
  // A paused run records nothing.
  const played = apply(skipped, { type: 'spawn', index: source(skipped, 'bakery') });
  assert.deepEqual(done(played), ['merge']);
  const resumed = apply(played, { type: 'guide', status: 'active' });
  assert.deepEqual(resumed.guide, { status: 'active', stage: 'take', done: { merge: true, take: false, deliver: false, prepare: false, story: false } });
  assert.equal(resources(resumed), resources(played));
  rejected(resumed, { type: 'guide', status: 'active' });
  rejected(resumed, { type: 'guide', status: 'unknown' } as unknown as Action);
});

test('a save without a run and a complete run both start a new run on the current board', () => {
  const late = createGame(data);
  delete late.guide;
  late.coins = 77;
  const started = apply(late, { type: 'guide', status: 'active' });
  assert.deepEqual(started.guide, createGame(data).guide);
  assert.equal(started.coins, 77);
  rejected(late, { type: 'guide', status: 'dismissed' });
  const complete = createGame(data);
  complete.guide = { status: 'complete', stage: 'story', done: { merge: true, take: true, deliver: true, prepare: true, story: true } };
  assert.deepEqual(apply(complete, { type: 'guide', status: 'active' }).guide, createGame(data).guide);
});

test('save validation accepts coherent runs and rejects unknown, extra, or contradictory guide records', () => {
  const base = createGame(data);
  const withGuide = (guide: unknown) => ({ ...base, guide }) as GameState;
  const all = { merge: true, take: true, deliver: true, prepare: true, story: true };
  const some = { merge: true, take: false, deliver: true, prepare: false, story: false };
  assert.equal(validate({ ...base, guide: undefined }), true);
  assert.equal(validate(withGuide({ status: 'dismissed', stage: 'take', done: some })), true);
  assert.equal(validate(withGuide({ status: 'complete', stage: 'story', done: all })), true);
  for (const guide of [null, [], 'active', { status: 'active', stage: 'merge' },
    { status: 'paused', stage: 'merge', done: base.guide!.done },
    { status: 'active', stage: 'deliver', done: some },
    { status: 'active', stage: 'merge', done: some },
    { status: 'active', stage: 'story', done: all },
    { status: 'complete', stage: 'story', done: some },
    { status: 'active', stage: 'merge', done: { ...base.guide!.done, merge: 'no' } },
    { status: 'active', stage: 'merge', done: { ...base.guide!.done, extra: false } },
    { status: 'active', stage: 'merge', done: base.guide!.done, cells: [3] }]) {
    assert.equal(validate(withGuide(guide)), false, JSON.stringify(guide));
  }
});

test('new, active, dismissed, and complete guides survive export, import, and reload', () => {
  const runs: (Guide | undefined)[] = [createGame(data).guide, { status: 'active', stage: 'deliver', done: { merge: true, take: true, deliver: false, prepare: false, story: false } },
    { status: 'dismissed', stage: 'merge', done: { merge: false, take: true, deliver: false, prepare: false, story: false } },
    { status: 'complete', stage: 'story', done: { merge: true, take: true, deliver: true, prepare: true, story: true } }, undefined];
  for (const guide of runs) {
    const state = { ...createGame(data), guide };
    if (!guide) delete state.guide;
    assert.deepEqual(importSave(exportSave(state, validate), validate), state);
    const storage = memoryStorage();
    assert.equal(saveGame(storage, state, validate).ok, true);
    assert.deepEqual(loadSave(storage, validate).state, state);
  }
  const malformed = JSON.stringify({ format: 'scary-snacks', version: 11, state: { ...createGame(data), guide: { status: 'complete', stage: 'merge', done: createGame(data).guide!.done } } });
  assert.throws(() => importSave(malformed, validate), /damaged or unknown/);
});

test('a failed write keeps the last durable guide step, so a reload repeats only that step', () => {
  const storage = memoryStorage();
  const fresh = createGame(data);
  assert.equal(saveGame(storage, fresh, validate).ok, true);
  const [a, b] = flour(fresh);
  const merged = apply(fresh, { type: 'move', from: a, to: b });
  storage.failing = true;
  assert.equal(saveGame(storage, merged, validate).ok, false);
  const reloaded = loadSave<GameState>(storage, validate).state!;
  assert.equal(reloaded.guide!.stage, 'merge');
  assert.deepEqual(reloaded.board, fresh.board);
  assert.equal(storage.values.has(SAVE_KEY), true);
});
