import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canDeliverQuest, createGame, currentTask, firstFreeBoardCell, generatorOutputs, getItem, reduceGame, resolveQuests, taskEligibility,
  unresolvedObstacle, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState, Quest, Task } from '../src/engine.ts';

export type CampaignTotals = {
  actions: number; spawns: number; merges: number; quests: number;
  questCoins: number; preparationCoins: number;
};
export type CampaignChapter = CampaignTotals & { chapter: number; balance: number; cumulative: { actions: number; merges: number; quests: number } };
export type CampaignPreparation = CampaignTotals & {
  id: string; title: string; chapter: number; cost: number; work: Task['work']; balance: number; cumulative: CampaignChapter['cumulative'];
};
export type CampaignBalance = { chapters: CampaignChapter[]; preparations: CampaignPreparation[]; totals: CampaignTotals; finalState: GameState };

const emptyTotals = (): CampaignTotals => ({ actions: 0, spawns: 0, merges: 0, quests: 0, questCoins: 0, preparationCoins: 0 });

/**
 * Deterministic reducer play. Pay each preparation as soon as it is ready, and otherwise deliver the first active ticket.
 * Make each requested item from the highest output that its source has earned, and merge up from there.
 * The game has no sales, so a full board makes room only by a merge of spare food: a pair, or a match for a blocked ingredient.
 * A full board without such a merge is a deadlock, and the fixture fails.
 * Every quest that opens before a preparation is required for it, and the source tiers change only with a payment, so the order
 * of the tickets in one window does not change the totals. Actions are game actions, not pointer presses.
 * This fixture does not measure human play time or difficulty.
 */
export function runCampaignBalance(data: GameData): CampaignBalance {
  let state = createGame(data);
  const totals = emptyTotals();
  let previousChapter = emptyTotals(), previousPreparation = emptyTotals();
  const chapters: CampaignChapter[] = [];
  const preparations: CampaignPreparation[] = [];
  // The cells that hold food for the current delivery or a half of the current merge.
  const kept = new Set<number>();

  function act(action: Action) {
    const before = state;
    const result = reduceGame(before, action, data);
    assert.equal(result.ok, true, `Preparation ${before.taskIndex + 1}, ${action.type}: ${result.message}`);
    state = result.state;
    assert.equal(validateGame(state, data), true, `Valid state after ${action.type}.`);
    totals.actions++;
    if (result.event === 'merge') totals.merges++;
    if (action.type === 'spawn') totals.spawns++;
    if (action.type === 'deliverQuest') { totals.quests++; totals.questCoins += state.coins - before.coins; }
    if (action.type === 'task') totals.preparationCoins += before.coins - state.coins;
    assert.equal(state.coins, totals.questCoins - totals.preparationCoins, 'Every coin comes from a recorded legal action.');
    assert.ok(totals.actions < 100_000, 'The campaign must converge within the fixture action limit.');
  }

  /** Merge spare food that no current delivery or merge holds: a pair, or a match for a blocked ingredient. Each merge frees one cell. */
  function makeRoom() {
    const spare = state.board.flatMap((cell, index) => cell && getItem(cell.code, data)!.next && !kept.has(index) ? [index] : []);
    for (const from of spare) {
      const code = state.board[from]!.code;
      const to = spare.find(other => other !== from && state.board[other]!.code === code)
        ?? state.board.findIndex((cell, index) => !cell && unresolvedObstacle(state, index, data)?.ingredient === code);
      if (to !== undefined && to >= 0) { act({ type: 'move', from, to }); return; }
    }
    assert.fail(`Preparation ${state.taskIndex + 1}: the board is full and no spare merge frees space.`);
  }

  function produce(code: string): number {
    const item = getItem(code, data);
    assert.ok(item && !item.generator, `Known dish: ${code}.`);
    const source = `generator_${item.chain}`;
    if (generatorOutputs(state, source, data).includes(code)) {
      if (firstFreeBoardCell(state, data) === -1) makeRoom();
      const empty = firstFreeBoardCell(state, data);
      act({ type: 'spawn', index: state.board.findIndex(cell => cell?.code === source), output: code });
      assert.equal(state.board[empty]?.code, code);
      return empty;
    }
    const lower = Object.values(data.items).find(candidate => candidate.next === code);
    assert.ok(lower, `A merge path exists for ${code}.`);
    const first = produce(lower.id);
    kept.add(first);
    const second = produce(lower.id);
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

  const cumulative = () => ({ actions: totals.actions, merges: totals.merges, quests: totals.quests });
  const since = (previous: CampaignTotals) => {
    const delta = emptyTotals();
    for (const key of Object.keys(delta) as (keyof CampaignTotals)[]) delta[key] = totals[key] - previous[key];
    return delta;
  };

  function complete(task: Task) {
    // Only the space for a new source can block a preparation whose coins and quests are ready.
    while (!taskEligibility(state, data).ready && taskEligibility(state, data).requirements.every(requirement => requirement.met || requirement.kind === 'space')) makeRoom();
    act({ type: 'task' });
    preparations.push({ id: task.id, title: task.title, chapter: task.chapter, cost: task.cost, work: task.work, ...since(previousPreparation),
      balance: state.coins, cumulative: cumulative() });
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
    if (requirements.every(requirement => requirement.met || requirement.kind === 'space')) { complete(task); continue; }
    const ticket = resolveQuests(state, data).find(view => view.status === 'active');
    assert.ok(ticket, `The campaign cannot resolve these blockers: ${taskEligibility(state, data).blockers.join(' ')}`);
    deliver(ticket.quest);
  }

  assert.equal(state.taskIndex, data.tasks.length);
  assert.equal(state.completedQuests.length, data.quests.length, 'The finale needs every quest.');
  assert.equal(validateGame(state, data), true);
  assert.equal(totals.preparationCoins, preparations.reduce((sum, task) => sum + task.cost, 0));
  return { chapters, preparations, totals, finalState: state };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
  const { finalState, ...report } = runCampaignBalance(data);
  console.log(JSON.stringify({ ...report, final: { preparations: finalState.taskIndex, balance: finalState.coins, quests: finalState.completedQuests.length } }, null, 2));
}
