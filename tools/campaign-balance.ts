import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canDeliverQuest, canLightLanterns, currentTask, dayMerges, dishWork, firstFreeBoardCell, freeBoardCells, getItem, mergeResult, requiredQuests, resolveQuests, stapleCost, supperComplete, supperQuest, takeCost, taskEligibility, unresolvedObstacle } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState, Quest, Task } from '../src/model.ts';

export type CampaignTotals = {
  actions: number; spawns: number; merges: number; quests: number; recoveries: number;
  questCoins: number; preparationCoins: number; takeCoins: number; blockerCoins: number; upkeepCoins: number;
};
export type CampaignChapter = CampaignTotals & { chapter: number; balance: number; cumulative: { actions: number; merges: number; quests: number } };
export type CampaignPreparation = CampaignTotals & {
  id: string; title: string; chapter: number; cost: number; work: Task['work']; balance: number; freeCells: number; cumulative: CampaignChapter['cumulative'];
};
/**
 * Efficient: cook only for quests, and light the lanterns for each booking. Miss bookings: let the first evening of each booked quest
 * pass, and cook spare food while nothing else is left to do: merge spare pairs, step spare dishes up, then make herb tea. Debt: start each preparation window with a debt of 20 coins.
 */
export type CampaignStrategy = 'efficient' | 'miss-bookings' | 'debt';
export type CampaignNights = {
  days: number; lanterns: number; thefts: number; stolen: number; gifts: number; lowestPurse: number;
  /** The merges of food that no quest needs, made only to move the clock. */
  fillerMerges: number;
};
export type CampaignBalance = {
  chapters: CampaignChapter[]; preparations: CampaignPreparation[]; totals: CampaignTotals; nights: CampaignNights; finalState: GameState;
  /** The purse after the supper, and the coins that the run spent on preparations, takes, and upkeep. */
  purse: number; spending: number;
};

const emptyTotals = (): CampaignTotals => ({ actions: 0, spawns: 0, merges: 0, quests: 0, recoveries: 0, questCoins: 0, preparationCoins: 0, takeCoins: 0, blockerCoins: 0, upkeepCoins: 0 });
/** The debt that the debt strategy carries into each preparation window. */
const WINDOW_DEBT = 20;
/** Within this many merges of the closing, the purse keeps the upkeep: a short purse makes recovery teas first. */
const UPKEEP_GUARD = 30;
/** Below this many free cells, the strategy clears blockers between quests. */
const TIDY_FREE = 24;

/**
 * Deterministic reducer play with a fixed seed. Pay each preparation as soon as it is ready. Deliver tonight's booked quest first,
 * with the lanterns if it is early. Otherwise deliver the unbooked ticket whose staples cost the least. With only booked quests for
 * later evenings left, cook them now: their merges bring the night. Make each quest dish from spare food on the board when it can,
 * and otherwise from stage-one staples, merging up and cooking recipes. A full board makes room only by a merge of spare food: a pair,
 * a recipe, or a match for a blocked dish. A full board without such a merge is a deadlock, and the fixture fails.
 * Near the closing, a purse short of the upkeep makes recovery teas, so the efficient purse never goes below zero.
 * Actions are game actions, not pointer presses. This fixture does not measure human play time or difficulty.
 */
export function runCampaignBalance(data: GameData, seed = 1, strategy: CampaignStrategy = 'efficient', checkEveryAction = true): CampaignBalance {
  let state = createGame(data, seed);
  const totals = emptyTotals(), nights: CampaignNights = { days: 1, lanterns: 0, thefts: 0, stolen: 0, gifts: 0, lowestPurse: 0, fillerMerges: 0 };
  let previousChapter = emptyTotals(), previousPreparation = emptyTotals(), injected = 0, guarding = false, filling = false;
  const chapters: CampaignChapter[] = [];
  const preparations: CampaignPreparation[] = [];
  // The cells that hold food for the current delivery or a part of the current merge.
  const kept = new Set<number>();
  // The miss strategy lets the first evening of each booked quest pass: the quest and the day that it skips.
  const missed = new Map<string, number>();
  const recovery = data.quests.find(quest => quest.recovery)!;
  const remaining = () => dayMerges(data) - state.clock.merges;
  const recoveryActive = () => resolveQuests(state, data).some(view => view.quest === recovery && view.status === 'active');

  function act(action: Action) {
    const before = state;
    const result = reduceGame(before, action, data);
    assert.equal(result.ok, true, `Preparation ${before.taskIndex + 1}, day ${before.clock.day}, ${action.type}: ${result.message}`);
    state = result.state;
    if (checkEveryAction || state.clock.day !== before.clock.day || action.type === 'task') assert.equal(validateGame(state, data), true, `Valid state after ${action.type}.`);
    totals.actions++;
    if (result.event === 'merge') { totals.merges++; if (filling) nights.fillerMerges++; }
    if (action.type === 'spawn') { totals.spawns++; totals.takeCoins += before.coins - state.coins; }
    if (action.type === 'deliverQuest') { totals.quests++; totals.questCoins += state.coins - before.coins; if (action.id === recovery.id) totals.recoveries++; }
    if (action.type === 'task') totals.preparationCoins += before.coins - state.coins;
    if (action.type === 'lantern') nights.lanterns++;
    if (state.clock.day !== before.clock.day) {
      const night = state.night!;
      totals.upkeepCoins += night.upkeep;
      nights.days = state.clock.day;
      if (night.rat === 'thief') { nights.thefts++; nights.stolen += night.taken.length + (night.trapped ? 1 : 0); }
      if (night.gift) nights.gifts++;
      // The thief rat empties cells: a kept cell that lost its food is free again.
      for (const index of [...kept]) if (!state.board[index] || unresolvedObstacle(state, index, data)) kept.delete(index);
    }
    // A merge into a blocked dish gives the blocker coin. A closing in the same change pays the upkeep.
    if (action.type === 'move') totals.blockerCoins += state.coins - before.coins + (state.clock.day !== before.clock.day ? state.night!.upkeep : 0);
    nights.lowestPurse = Math.min(nights.lowestPurse, state.coins);
    assert.equal(state.coins, totals.questCoins + totals.blockerCoins - totals.preparationCoins - totals.takeCoins - totals.upkeepCoins + injected, 'Every coin comes from a recorded legal action.');
    assert.ok(totals.actions < 400_000, 'The campaign must converge within the fixture action limit.');
  }
  const staples = (quest: Quest) => stapleCost(quest, data);
  const movable = (index: number) => !!state.board[index] && !unresolvedObstacle(state, index, data) && !getItem(state.board[index]!.code, data)!.generator;

  /** Near the closing, a purse that cannot pay the upkeep makes recovery teas first. The cells of the next merge stay kept. */
  function keepUpkeep(...cells: number[]) {
    if (guarding || state.act1 || remaining() > UPKEEP_GUARD || state.coins >= data.day.upkeep || strategy === 'debt') return;
    guarding = true;
    const added = cells.filter(cell => !kept.has(cell));
    for (const cell of added) kept.add(cell);
    while (state.coins < data.day.upkeep && recoveryActive()) recover();
    for (const cell of added) kept.delete(cell);
    guarding = false;
  }
  /** A merge, after the upkeep teas. Those teas can bring the night, and the thief rat can take a part: then nothing merges. */
  function merge(from: number, to: number): boolean {
    const parts = [state.board[from]?.code, state.board[to]?.code];
    keepUpkeep(from, to);
    if (state.board[from]?.code !== parts[0] || state.board[to]?.code !== parts[1]) return false;
    act({ type: 'move', from, to });
    return true;
  }

  /**
   * Merge spare food that no current delivery or merge holds: a pair, a recipe, or a match for a blocked dish. Each merge frees one cell.
   */
  function spareMerge(): [number, number] | null {
    const spare = state.board.flatMap((cell, index) => movable(index) && !kept.has(index) ? [index] : []);
    for (const from of spare) {
      const code = state.board[from]!.code;
      const to = spare.find(other => other !== from && !!mergeResult(code, state.board[other]!.code, data))
        ?? state.board.findIndex((cell, index) => !cell && !!unresolvedObstacle(state, index, data) && !!mergeResult(code, unresolvedObstacle(state, index, data)!.ingredient, data));
      if (to !== undefined && to >= 0) return [from, to];
    }
    return null;
  }
  function makeRoom() {
    const pair = spareMerge();
    if (pair) { merge(...pair); return; }
    assert.fail(`Preparation ${state.taskIndex + 1}, day ${state.clock.day}: the board is full and no spare merge frees space. Filler merges: ${nights.fillerMerges}. Board: ${state.board.map((cell, index) => unresolvedObstacle(state, index, data) ? `[${unresolvedObstacle(state, index, data)!.ingredient}]` : `${cell?.code ?? '-'}${kept.has(index) ? '*' : ''}`).join(' ')}`);
  }

  /** Deliver the recovery quest once: one linden tea from free herbs. */
  function recover() {
    const outside = [...kept];
    assert.ok(recoveryActive(), `Preparation ${state.taskIndex + 1}: the purse is short, and the recovery quest is closed.`);
    for (const requirement of recovery.requirements) for (let count = 0; count < requirement.quantity; count++) kept.add(produce(requirement.item));
    act({ type: 'deliverQuest', id: recovery.id });
    kept.clear(); for (const index of outside) if (state.board[index] && !unresolvedObstacle(state, index, data)) kept.add(index);
  }

  function take(code: string): number {
    const source = `generator_${getItem(code, data)!.chain}`, index = state.board.findIndex(cell => cell?.code === source);
    assert.ok(index >= 0, `The source of ${code} is on the board.`);
    const cost = takeCost(getItem(source, data)!, data);
    while (cost && state.coins < cost) recover();
    if (firstFreeBoardCell(state, data) === -1) makeRoom();
    const empty = firstFreeBoardCell(state, data);
    act({ type: 'spawn', index });
    assert.equal(state.board[empty]?.code, code);
    return empty;
  }

  /** Two parts merge into the cell of the first. The night can take a raw part: then the part is made again. */
  function produce(code: string): number {
    const item = getItem(code, data);
    assert.ok(item && !item.generator, `Known dish: ${code}.`);
    // Spare food on the board serves first.
    const spare = state.board.findIndex((cell, index) => cell?.code === code && !kept.has(index) && movable(index));
    if (spare >= 0) return spare;
    if (item.stage === 1 && !item.recipe) return take(code);
    const [firstCode, secondCode] = item.recipe ?? [`${item.chain}_${item.stage - 1}`, `${item.chain}_${item.stage - 1}`];
    for (;;) {
      const first = produce(firstCode);
      kept.add(first);
      const second = produce(secondCode);
      kept.delete(first);
      if (state.board[first]?.code !== firstCode || unresolvedObstacle(state, first, data) || !merge(second, first)) continue;
      assert.equal(state.board[first]?.code, code);
      return first;
    }
  }

  /** Every portion of some quests on the board, kept. The night can take a raw portion: then the portion is made again. */
  function prepare(...quests: Quest[]) {
    const needed = new Map<string, number>();
    for (const { item, quantity } of quests.flatMap(quest => quest.requirements)) needed.set(item, (needed.get(item) ?? 0) + quantity);
    for (;;) {
      const missing = [...needed].flatMap(([item, quantity]) => Array<string>(Math.max(0, quantity
        - [...kept].filter(index => state.board[index]?.code === item).length)).fill(item));
      if (!missing.length) return;
      for (const item of missing) kept.add(produce(item));
    }
  }
  function deliver(quest: Quest) {
    // A short purse makes its recovery teas before the quest, while the board still has room for them.
    while (state.coins < staples(quest) && recoveryActive()) recover();
    prepare(quest);
    if (quest.booked && canLightLanterns(state, quest, data)) act({ type: 'lantern', id: quest.id });
    if (!canDeliverQuest(state, quest, data)) { kept.clear(); return false; }
    act({ type: 'deliverQuest', id: quest.id });
    kept.clear();
    return true;
  }
  /**
   * While the board runs short of space, clear the cheapest blocker with a matching dish. The blocked cell then holds movable food,
   * which a later quest or merge uses, so the cell comes back to play.
   */
  function tidy() {
    for (;;) {
      const blocked = state.board.flatMap((cell, index) => unresolvedObstacle(state, index, data) ? [unresolvedObstacle(state, index, data)!] : []);
      if (freeBoardCells(state, data) >= TIDY_FREE || !blocked.length) return;
      const cheapest = blocked.reduce((best, obstacle) => dishWork(obstacle.ingredient, data).merges < dishWork(best.ingredient, data).merges ? obstacle : best);
      const work = dishWork(cheapest.ingredient, data);
      while (state.coins < work.staples * data.economy.takeCost && recoveryActive()) recover();
      if (state.coins < work.staples * data.economy.takeCost) return;
      merge(produce(cheapest.ingredient), cheapest.position);
    }
  }
  /**
   * Spare food, made only to move the clock: the miss strategy cooks it while it waits for an evening. A spare pair merges first, then
   * a spare dish goes one stage up. Last, a fresh recovery tea from free herbs goes to the recovery quest while it is open, and
   * otherwise stays as spare food for later quests.
   */
  function fill(day: number) {
    filling = true;
    const tea = recovery.requirements[0].item;
    while (state.clock.day === day) {
      // A spare pair first: it moves the clock and frees a cell.
      const pair = spareMerge();
      if (pair) { merge(...pair); continue; }
      // Then a spare dish one stage up: a copy merges into it, so the board keeps the same number of dishes.
      const ladder = state.board.flatMap((cell, index) => movable(index) && !kept.has(index) && getItem(cell!.code, data)!.next
        && state.coins >= dishWork(cell!.code, data).staples * data.economy.takeCost ? [index] : [])
        .sort((a, b) => dishWork(state.board[a]!.code, data).merges - dishWork(state.board[b]!.code, data).merges)[0];
      if (ladder !== undefined) {
        kept.add(ladder);
        const copy = produce(state.board[ladder]!.code);
        kept.delete(ladder);
        if (state.board[ladder]?.code === state.board[copy]?.code) merge(copy, ladder);
        continue;
      }
      const spare = state.board.flatMap((cell, index) => cell?.code === tea && !kept.has(index) ? [index] : []);
      for (const index of spare) kept.add(index);
      const made = produce(tea);
      for (const index of spare) kept.delete(index);
      if (recoveryActive()) act({ type: 'deliverQuest', id: recovery.id });
      else if (state.board[made]?.code !== tea) break;
    }
    filling = false;
  }

  const cumulative = () => ({ actions: totals.actions, merges: totals.merges, quests: totals.quests });
  const since = (previous: CampaignTotals) => {
    const delta = emptyTotals();
    for (const key of Object.keys(delta) as (keyof CampaignTotals)[]) delta[key] = totals[key] - previous[key];
    return delta;
  };
  function owe() {
    if (strategy !== 'debt') return;
    injected += -WINDOW_DEBT - state.coins;
    state = { ...state, coins: -WINDOW_DEBT };
    nights.lowestPurse = Math.min(nights.lowestPurse, state.coins);
  }

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
    owe();
  }

  const tonight = (quest: Quest) => state.evening.guest === quest.character && !state.evening.delivered && missed.get(quest.id) !== state.clock.day;
  owe();
  for (;;) {
    const task = currentTask(state, data);
    if (!task) break;
    const requirements = taskEligibility(state, data).requirements;
    if (requirements.every(requirement => requirement.met || requirement.kind === 'space' || requirement.kind === 'coins')
      && requirements.find(requirement => requirement.kind === 'quests')!.met) { complete(task); continue; }
    tidy();
    const tickets = resolveQuests(state, data).filter(view => view.status === 'active' && !view.quest.recovery).map(view => view.quest);
    assert.ok(tickets.length, `The campaign cannot resolve these blockers: ${taskEligibility(state, data).blockers.join(' ')}`);
    // The miss strategy lets the first evening of each booked quest pass.
    if (strategy === 'miss-bookings') for (const quest of tickets) if (quest.booked && tonight(quest) && !missed.has(quest.id)) missed.set(quest.id, state.clock.day);
    const booked = tickets.find(quest => quest.booked && tonight(quest));
    if (booked) { deliver(booked); continue; }
    const open = tickets.filter(quest => !quest.booked);
    if (open.length) { deliver(open.reduce((cheapest, quest) => staples(quest) < staples(cheapest) ? quest : cheapest)); continue; }
    // Only booked quests for later evenings are left. Their cooking is needed anyway, and its merges bring the night.
    const day = state.clock.day;
    prepare(...tickets);
    if (state.clock.day === day) {
      assert.notEqual(strategy, 'efficient', `Day ${day}: the efficient strategy has cooked every quest, and the booked guest comes on a later evening.`);
      // A missed guest's lanterns bring the closing near, so the wait is short.
      for (const quest of tickets) if (canLightLanterns(state, quest, data)) act({ type: 'lantern', id: quest.id });
      fill(day);
    }
    kept.clear();
  }

  assert.equal(state.taskIndex, data.tasks.length);
  assert.equal(state.completedQuests.length, requiredQuests(data.tasks.length, data).length, 'The last preparation needs every campaign quest.');
  const supper = supperQuest(data)!;
  assert.ok(deliver(supper), 'The supper is served.');
  assert.ok(supperComplete(state, data), 'The supper is served.');
  assert.equal(validateGame(state, data), true);
  assert.equal(totals.preparationCoins, preparations.reduce((sum, task) => sum + task.cost, 0));
  return { chapters, preparations, totals, nights, finalState: state, purse: state.coins, spending: totals.preparationCoins + totals.takeCoins + totals.upkeepCoins };
}

/** The fixed seeds of the balance check. */
export const BALANCE_SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);

if (import.meta.main) {
  const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
  const strategy = (process.argv[2] ?? 'efficient') as CampaignStrategy;
  if (!['efficient', 'miss-bookings', 'debt'].includes(strategy)) throw new Error('Use the strategy efficient, miss-bookings, or debt.');
  for (const seed of BALANCE_SEEDS) {
    const { nights, purse, spending, preparations } = runCampaignBalance(data, seed, strategy, false);
    console.log(JSON.stringify({ seed, ...nights, purse, spending, share: +(100 * purse / spending).toFixed(1), freeCells: preparations.map(value => value.freeCells).join(' ') }));
  }
}
