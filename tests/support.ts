// Shared fixtures for the Node tests: the game data, checked actions, checkpoint saves, quest deliveries, and a storage in memory.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { firstFreeBoardCell, generatorOutputs, getItem, requiredQuests } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import { dataProblems } from '../src/content.ts';
import type { Action, GameData, GameState } from '../src/model.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';

export const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
export const validate = (candidate: unknown) => validateGame(candidate, data);

/** Adds a board layout without obstacles to the shared data. openGame starts a new game on it. */
export const addOpenLayout = () => { data.board.layouts.push({ id: 'test-open', obstacles: [] }); };
export const openGame = (): GameState => ({ ...createGame(data), layoutId: 'test-open' });

/** Applies a legal action: it succeeds, leaves its input unchanged, and gives a valid state. */
export function act(state: GameState, action: Action, content = data): GameState {
  const before = structuredClone(state);
  const result = reduceGame(state, action, content);
  assert.equal(result.ok, true, result.message);
  assert.deepEqual(state, before, 'Actions preserve their input.');
  assert.equal(validateGame(result.state, content), true, `Valid state after ${action.type}.`);
  return result.state;
}

/** Applies an illegal action: it fails with no event, returns its input, and leaves the input unchanged. */
export function rejected(state: GameState, action: Action, content = data) {
  const before = structuredClone(state);
  const result = reduceGame(state, action, content);
  assert.equal(result.ok, false);
  assert.equal(result.state, state);
  assert.equal(result.event, null);
  assert.deepEqual(state, before);
  return result;
}

/** A copy with the exact cost of the next preparation in coins, and every quest that it needs marked delivered. */
export function ready(state: GameState, content = data): GameState {
  const next = structuredClone(state);
  for (const quest of requiredQuests(next.taskIndex, content)) if (!next.completedQuests.includes(quest.id)) next.completedQuests.push(quest.id);
  next.coins = content.tasks[next.taskIndex].cost;
  return next;
}
export const payNext = (state: GameState, content = data) => act(ready(state, content), { type: 'task' }, content);

/** The checkpoint save before the payment of the preparation at index count, from checkpointState. */
export const checkpoint = (count: number) => checkpointState(data, count);
/** The preparation at index count is paid for, and the quests that open with it wait. */
export const opened = (count: number): GameState => ({ ...checkpoint(count), completedQuests: checkpoint(count - 1).completedQuests, coins: 0 });

/** A copy with the items of the quest on free cells. Direct supplies isolate the quest rules from production, which has its own legal-play tests. */
export function supply(state: GameState, id: string): GameState {
  const supplied = structuredClone(state);
  for (const { item, quantity } of data.quests.find(quest => quest.id === id)!.requirements) for (let count = 0; count < quantity; count++) {
    const index = firstFreeBoardCell(supplied, data);
    assert.notEqual(index, -1);
    supplied.board[index] = { code: item };
    if (!supplied.discovered.includes(item)) supplied.discovered.push(item);
  }
  return supplied;
}
export const deliver = (state: GameState, id: string) => act(supply(state, id), { type: 'deliverQuest', id });

/**
 * A player who takes only legal actions, and who makes each dish from its source, merges, and recipes. A recipe merges its second
 * part into its first. A take from a paid source needs the coins in the purse.
 */
export function player(initial = createGame(data), content = data) {
  let state = initial;
  assert.deepEqual(dataProblems(content), [], 'The fixture data passes its checks.');
  function produce(code: string): number {
    const item = getItem(code, content)!;
    if (item.recipe) {
      const first = produce(item.recipe[0]), second = produce(item.recipe[1]);
      state = act(state, { type: 'move', from: second, to: first }, content);
      assert.equal(state.board[first]?.code, code);
      return first;
    }
    const source = `generator_${item.chain}`;
    if (generatorOutputs(state, source, content).includes(code)) {
      const empty = firstFreeBoardCell(state, content);
      assert.ok(empty >= 0, 'Normal production fits the board.');
      state = act(state, { type: 'spawn', index: state.board.findIndex(cell => cell?.code === source) }, content);
      assert.equal(state.board[empty]?.code, code);
      return empty;
    }
    const previous = Object.values(content.items).find(previous => previous.next === code);
    assert.ok(previous, `The merge path reaches ${code}.`);
    const first = produce(previous.id), second = produce(previous.id);
    state = act(state, { type: 'move', from: first, to: second }, content);
    assert.equal(state.board[second]?.code, code);
    return second;
  }
  return { get state() { return state; }, act: (action: Action) => (state = act(state, action, content)), produce };
}

/** A storage in memory that records each write. */
export function memoryStorage(initial: [string, string][] = []) {
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
