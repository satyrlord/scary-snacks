import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canDeliverQuest, currentTask, dishWork, firstFreeBoardCell, freeBoardCells, getItem, mergeResult, requiredQuests, resolveQuests, supperComplete, supperQuest, takeCost, taskEligibility, unresolvedObstacle } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState, Quest, Task } from '../src/model.ts';

export type CampaignTotals = {
  actions: number; spawns: number; merges: number; quests: number; recoveries: number;
  questCoins: number; preparationCoins: number; takeCoins: number; blockerCoins: number;
};
export type CampaignChapter = CampaignTotals & { chapter: number; balance: number; cumulative: { actions: number; merges: number; quests: number } };
export type CampaignPreparation = CampaignTotals & {
  id: string; title: string; chapter: number; cost: number; work: Task['work']; balance: number; freeCells: number; cumulative: CampaignChapter['cumulative'];
};
export type CampaignBalance = {
  chapters: CampaignChapter[]; preparations: CampaignPreparation[]; totals: CampaignTotals; finalState: GameState;
  /** The purse after the supper, and the coins that the run spent on preparations and takes. */
  purse: number; spending: number;
};

const emptyTotals = (): CampaignTotals => ({ actions: 0, spawns: 0, merges: 0, quests: 0, recoveries: 0, questCoins: 0, preparationCoins: 0, takeCoins: 0, blockerCoins: 0 });

/**
 * Deterministic reducer play. Pay each preparation as soon as it is ready. Otherwise deliver the active ticket whose staples cost the
 * least, or the recovery quest while the purse cannot buy a staple. Make each quest dish from spare food on the board when it can,
 * and otherwise from stage-one staples, merging up and cooking recipes. A full board makes room only by a merge of spare food: a pair,
 * a recipe, or a match for a blocked dish. A full board without such a merge is a deadlock, and the fixture fails.
 * Actions are game actions, not pointer presses. This fixture does not measure human play time or difficulty.
 */
export function runCampaignBalance(data: GameData): CampaignBalance {
  let state = createGame(data);
  const totals = emptyTotals();
  let previousChapter = emptyTotals(), previousPreparation = emptyTotals();
  const chapters: CampaignChapter[] = [];
  const preparations: CampaignPreparation[] = [];
  // The cells that hold food for the current delivery or a part of the current merge.
  const kept = new Set<number>();
  const recovery = data.quests.find(quest => quest.recovery)!;

  function act(action: Action) {
    const before = state;
    const result = reduceGame(before, action, data);
    assert.equal(result.ok, true, `Preparation ${before.taskIndex + 1}, ${action.type}: ${result.message}`);
    state = result.state;
    assert.equal(validateGame(state, data), true, `Valid state after ${action.type}.`);
    totals.actions++;
    if (result.event === 'merge') totals.merges++;
    if (action.type === 'spawn') { totals.spawns++; totals.takeCoins += before.coins - state.coins; }
    if (action.type === 'move' && state.coins > before.coins) totals.blockerCoins += state.coins - before.coins;
    if (action.type === 'deliverQuest') { totals.quests++; totals.questCoins += state.coins - before.coins; if (action.id === recovery.id) totals.recoveries++; }
    if (action.type === 'task') totals.preparationCoins += before.coins - state.coins;
    assert.equal(state.coins, totals.questCoins + totals.blockerCoins - totals.preparationCoins - totals.takeCoins, 'Every coin comes from a recorded legal action.');
    assert.ok(totals.actions < 400_000, 'The campaign must converge within the fixture action limit.');
  }
  const movable = (index: number) => !!state.board[index] && !unresolvedObstacle(state, index, data) && !getItem(state.board[index]!.code, data)!.generator;

  /**
   * Merge spare food that no current delivery or merge holds: a pair, a recipe, or a match for a blocked dish. Each merge frees one cell.
   *   */
  function makeRoom() {
    const spare = state.board.flatMap((cell, index) => movable(index) && !kept.has(index) ? [index] : []);
    for (const from of spare) {
      const code = state.board[from]!.code;
      const to = spare.find(other => other !== from && !!mergeResult(code, state.board[other]!.code, data))
        ?? state.board.findIndex((cell, index) => !cell && !!unresolvedObstacle(state, index, data) && !!mergeResult(code, unresolvedObstacle(state, index, data)!.ingredient, data));
      if (to !== undefined && to >= 0) { act({ type: 'move', from, to }); return; }
    }
    assert.fail(`Preparation ${state.taskIndex + 1}: the board is full and no spare merge frees space.`);
  }

  /** Deliver the recovery quest once: one linden tea from free herbs. */
  function recover() {
    const outside = [...kept];
    assert.ok(resolveQuests(state, data).some(view => view.quest === recovery && view.status === 'active'), `Preparation ${state.taskIndex + 1}: the purse is short, and the recovery quest is closed.`);
    for (const requirement of recovery.requirements) for (let count = 0; count < requirement.quantity; count++) kept.add(produce(requirement.item));
    act({ type: 'deliverQuest', id: recovery.id });
    kept.clear(); for (const index of outside) kept.add(index);
  }

  function take(code: string): number {
    const source = `generator_${getItem(code, data)!.chain}`, index = state.board.findIndex(cell => cell?.code === source);
    assert.ok(index >= 0, `The source of ${code} is on the board.`);
    while (state.coins < takeCost(getItem(source, data)!, data)) recover();
    if (firstFreeBoardCell(state, data) === -1) makeRoom();
    const empty = firstFreeBoardCell(state, data);
    act({ type: 'spawn', index });
    assert.equal(state.board[empty]?.code, code);
    return empty;
  }

  function produce(code: string): number {
    const item = getItem(code, data);
    assert.ok(item && !item.generator, `Known dish: ${code}.`);
    // Spare food on the board serves first.
    const spare = state.board.findIndex((cell, index) => cell?.code === code && !kept.has(index) && movable(index));
    if (spare >= 0) return spare;
    if (item.recipe) {
      const first = produce(item.recipe[0]);
      kept.add(first);
      const second = produce(item.recipe[1]);
      kept.delete(first);
      act({ type: 'move', from: second, to: first });
      assert.equal(state.board[first]?.code, code);
      return first;
    }
    if (item.stage === 1) return take(code);
    const lower = `${item.chain}_${item.stage - 1}`;
    const first = produce(lower);
    kept.add(first);
    const second = produce(lower);
    kept.delete(first);
    act({ type: 'move', from: first, to: second });
    assert.equal(state.board[second]?.code, code);
    return second;
  }

  function deliver(quest: Quest) {
    for (const requirement of quest.requirements) for (let count = 0; count < requirement.quantity; count++) kept.add(produce(requirement.item));
    assert.ok(canDeliverQuest(state, quest, data), `${quest.id} can be delivered.`);
    act({ type: 'deliverQuest', id: quest.id });
    kept.clear();
  }

  const staples = (quest: Quest) => quest.requirements.reduce((sum, { item, quantity }) => sum + dishWork(item, data).staples * data.economy.takeCost * quantity, 0);
  const cumulative = () => ({ actions: totals.actions, merges: totals.merges, quests: totals.quests });
  const since = (previous: CampaignTotals) => {
    const delta = emptyTotals();
    for (const key of Object.keys(delta) as (keyof CampaignTotals)[]) delta[key] = totals[key] - previous[key];
    return delta;
  };

  function complete(task: Task) {
    while (state.coins < task.cost) recover();
    // Only the space for a new source can block a preparation whose coins and quests are ready.
    while (!taskEligibility(state, data).ready && taskEligibility(state, data).requirements.every(requirement => requirement.met || requirement.kind === 'space')) makeRoom();
    act({ type: 'task' });
    preparations.push({ id: task.id, title: task.title, chapter: task.chapter, cost: task.cost, work: task.work, ...since(previousPreparation),
      balance: state.coins, freeCells: freeBoardCells(state, data), cumulative: cumulative() });
    previousPreparation = { ...totals };
    if (currentTask(state, data)?.chapter !== task.chapter) {
      chapters.push({ chapter: task.chapter, ...since(previousChapter), balance: state.coins, cumulative: cumulative() });
      previousChapter = { ...totals };
    }
  }

  for (;;) {
    const task = currentTask(state, data);
    if (!task) break;
    const requirements = taskEligibility(state, data).requirements;
    if (requirements.every(requirement => requirement.met || requirement.kind === 'space' || requirement.kind === 'coins')
      && requirements.find(requirement => requirement.kind === 'quests')!.met) { complete(task); continue; }
    const tickets = resolveQuests(state, data).filter(view => view.status === 'active' && !view.quest.recovery).map(view => view.quest);
    assert.ok(tickets.length, `The campaign cannot resolve these blockers: ${taskEligibility(state, data).blockers.join(' ')}`);
    deliver(tickets.reduce((cheapest, quest) => staples(quest) < staples(cheapest) ? quest : cheapest));
  }

  assert.equal(state.taskIndex, data.tasks.length);
  assert.equal(state.completedQuests.length, requiredQuests(data.tasks.length, data).length, 'The last preparation needs every campaign quest.');
  const supper = supperQuest(data)!;
  deliver(supper);
  assert.ok(supperComplete(state, data), 'The supper is served.');
  assert.equal(validateGame(state, data), true);
  assert.equal(totals.preparationCoins, preparations.reduce((sum, task) => sum + task.cost, 0));
  return { chapters, preparations, totals, finalState: state, purse: state.coins, spending: totals.preparationCoins + totals.takeCoins };
}

if (import.meta.main) {
  const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
  const { finalState, ...report } = runCampaignBalance(data);
  console.log(JSON.stringify({ ...report, final: { preparations: finalState.taskIndex, balance: finalState.coins, quests: finalState.completedQuests.length } }, null, 2));
}
