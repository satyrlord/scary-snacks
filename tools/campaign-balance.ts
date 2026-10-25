import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { actResults, campaignQuest, canDeliverQuest, canLightLanterns, clockStopped, currentTask, dayMerges, dishChains, dishWork, firstFreeBoardCell, freeBoardCells, growthStages, getItem, holding, laterDay, levers, mergeResult, questDeliveryCells, questHoliday, requiredQuests, resolveQuests, stapleCost, takeCost, taskEligibility, unresolvedObstacle } from '../src/model.ts';
import { createGame, reduceGame, validateGame } from '../src/engine.ts';
import type { Action, GameData, GameState, Quest, Task } from '../src/model.ts';

export type CampaignTotals = {
  actions: number; spawns: number; merges: number; quests: number; recoveries: number; recoveryCoins: number; repeats: number; repeatCoins: number;
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
  days: number; lanterns: number; closings: number; rats: number; thefts: number; stolen: number; gifts: number; lowestPurse: number;
  /** The merges of food that no quest needs, made only to move the clock. */
  fillerMerges: number;
  /** The merges for repeating quests, and the days whose merges were all for repeating quests. */
  repeatMerges: number; repeatDays: number[];
  /** The merges of each closed day: all of them, and those for repeating quests. */
  work: { day: number; merges: number; repeat: number }[];
  /** The day of each payment, and each day that reached its held position. */
  payments: number[]; held: number[];
  /** The day on which each campaign quest opened and was delivered. */
  opened: Record<string, number>; delivered: Record<string, number>;
};
/** The work of one event of the prologue: its merges, its takes, and the fewest free cells while it lasted. */
export type PrologueEventRun = { event: number; merges: number; takes: number; freeCells: number };
/**
 * The accounts of one act. Act 1 runs from the start of act 1 to the supper, act 2 from the supper to the purchase of the orchard, and
 * act 3 from the purchase to the dinner of the sleeper. Purse is the purse at the end, and spending the coins of the preparations, the
 * purchase, the takes, and the upkeep. The merges count
 * all merges and those for the repeating quests. Repeat days are the days whose merges were all for repeating quests.
 */
export type CampaignAct = { purse: number; spending: number; totals: CampaignTotals; merges: number; repeatMerges: number; repeatDays: number[]; closings: number; rats: number; state: GameState };
export type CampaignBalance = {
  prologue: PrologueEventRun[]; chapters: CampaignChapter[]; preparations: CampaignPreparation[]; totals: CampaignTotals; nights: CampaignNights; finalState: GameState;
  /** The accounts of each act. The purse and the spending are those of act 1. */
  acts: CampaignAct[]; purse: number; spending: number;
};

const emptyTotals = (): CampaignTotals => ({ actions: 0, spawns: 0, merges: 0, quests: 0, recoveries: 0, recoveryCoins: 0, repeats: 0, repeatCoins: 0, questCoins: 0, preparationCoins: 0, takeCoins: 0, blockerCoins: 0, upkeepCoins: 0 });
/** The debt that the debt strategy carries into each preparation window. */
const WINDOW_DEBT = 20;
/** Within this many merges of the closing, the purse keeps the upkeep: a short purse makes recovery teas first. */
const UPKEEP_GUARD = 30;
/** Below this many free cells, the strategy clears blockers between quests. */
const TIDY_FREE = 24;

/**
 * Plays the prologue from a new game with legal actions only: it reads each scene when it waits, and serves the quests of each event in
 * ticket order. Each dish comes from a prepared dish or spare food on the board, or from takes and merges. The run ends at the start of
 * act 1, or at the first state, between two steps, for which until is true.
 */
export function runPrologue(data: GameData, seed = 1, checkEveryAction = true, until: (state: GameState) => boolean = () => false): { state: GameState; events: PrologueEventRun[] } {
  let state = createGame(data, seed), run: PrologueEventRun = { event: 1, merges: 0, takes: 0, freeCells: freeBoardCells(state, data) };
  const events: PrologueEventRun[] = [], kept = new Set<number>();
  function act(action: Action) {
    const result = reduceGame(state, action, data);
    assert.equal(result.ok, true, `Prologue event ${state.prologue?.event}, ${action.type}: ${result.message}`);
    state = result.state;
    if (checkEveryAction) assert.equal(validateGame(state, data), true, `Valid prologue state after ${action.type}.`);
    if (result.event === 'merge') run.merges++;
    if (action.type === 'spawn') run.takes++;
    if (state.prologue?.event === run.event) run.freeCells = Math.min(run.freeCells, freeBoardCells(state, data));
  }
  const spare = (code: string) => state.board.findIndex((cell, index) => cell?.code === code && !kept.has(index) && !unresolvedObstacle(state, index, data));
  function produce(code: string): number {
    const found = spare(code), item = getItem(code, data)!;
    if (found >= 0) return found;
    if (item.stage === 1 && !item.recipe) {
      const empty = firstFreeBoardCell(state, data);
      assert.ok(empty >= 0, `Prologue event ${state.prologue?.event}: the board has room for a take.`);
      act({ type: 'spawn', chain: item.chain });
      return empty;
    }
    const [firstCode, secondCode] = item.recipe ?? [`${item.chain}_${item.stage - 1}`, `${item.chain}_${item.stage - 1}`];
    const first = produce(firstCode);
    kept.add(first);
    const second = produce(secondCode);
    kept.delete(first);
    act({ type: 'move', from: second, to: first });
    return first;
  }
  while (state.prologue && !until(state)) {
    if (state.pendingScenes.length) { act({ type: 'readScene', id: state.pendingScenes[0] }); continue; }
    const quest = resolveQuests(state, data).find(view => view.status === 'active')!.quest, event = state.prologue.event;
    for (const { item, quantity } of quest.requirements) for (let count = 0; count < quantity; count++) kept.add(produce(item));
    kept.clear();
    act({ type: 'deliverQuest', id: quest.id });
    if (state.prologue?.event !== event || !resolveQuests(state, data).some(view => view.status === 'active')) {
      events.push(run);
      run = { event: event + 1, merges: 0, takes: 0, freeCells: freeBoardCells(state, data) };
    }
  }
  assert.equal(validateGame(state, data), true, 'Valid state at the end of the run.');
  return { state, events };
}
/**
 * Deterministic reducer play with a fixed seed. The prologue comes first. Then pay each preparation as soon as it is ready. Deliver tonight's booked quest first,
 * with the lanterns if it is early. Otherwise deliver the unbooked ticket whose staples cost the least. With only booked quests for
 * later evenings left, cook them now. Then the bistro has no work, and the strategy delivers the repeating quests until the night. Make each quest dish from spare food on the board when it can,
 * and otherwise from stage-one staples, merging up and cooking recipes. A full board makes room only by a merge of spare food: a pair,
 * a recipe, or a match for a blocked dish. A full board without such a merge is a deadlock, and the fixture fails.
 * Near the closing, a purse short of the upkeep makes recovery teas, so the efficient purse never goes below zero.
 * Actions are game actions, not pointer presses. This fixture does not measure human play time or difficulty.
 */
export function runCampaignBalance(data: GameData, seed = 1, strategy: CampaignStrategy = 'efficient', checkEveryAction = true): CampaignBalance {
  const prologue = runPrologue(data, seed, checkEveryAction);
  let state = prologue.state;
  const totals = emptyTotals(), nights: CampaignNights = { days: 1, lanterns: 0, closings: 0, rats: 0, thefts: 0, stolen: 0, gifts: 0, lowestPurse: 0, fillerMerges: 0,
    repeatMerges: 0, repeatDays: [], work: [], payments: [], held: [], opened: {}, delivered: {} };
  let previousChapter = emptyTotals(), previousPreparation = emptyTotals(), injected = 0, guarding = false, filling = false, repeatWork = false, holidayDelivery = false;
  // The merges of the current day: all of them, and those for repeating quests.
  let dayWork = { merges: 0, repeat: 0 };
  const chapters: CampaignChapter[] = [];
  const preparations: CampaignPreparation[] = [];
  // The cells that hold food for the current delivery or a part of the current merge.
  const kept = new Set<number>();
  // The quests that the strategy cooks for now. A meal for a later day keeps the portions cooked ahead for it, unless it is cooked now.
  let cooking = new Set<Quest>();
  // The miss strategy lets the first evening of each booked quest without a fixed evening pass: the quest and the day that it skips.
  const missed = new Map<string, number>();
  const recovery = data.quests.find(quest => quest.recovery)!;
  const remaining = () => dayMerges(state.clock.day, data) - state.clock.merges;
  const recoveryActive = () => resolveQuests(state, data).some(view => view.quest === recovery && view.status === 'active');
  // The accounts of the acts: each act starts where the act before it ended.
  const acts: CampaignAct[] = [];
  let actStart = { totals: emptyTotals(), merges: 0, repeatMerges: 0, repeatDays: 0, closings: 0, rats: 0 };
  function closeAct(purse: number) {
    const delta = emptyTotals();
    for (const key of Object.keys(delta) as (keyof CampaignTotals)[]) delta[key] = totals[key] - actStart.totals[key];
    acts.push({ purse, spending: delta.preparationCoins + delta.takeCoins + delta.upkeepCoins, totals: delta, merges: totals.merges - actStart.merges,
      repeatMerges: nights.repeatMerges - actStart.repeatMerges, repeatDays: nights.repeatDays.slice(actStart.repeatDays), closings: nights.closings - actStart.closings,
      rats: nights.rats - actStart.rats, state });
    actStart = { totals: { ...totals }, merges: totals.merges, repeatMerges: nights.repeatMerges, repeatDays: nights.repeatDays.length, closings: nights.closings, rats: nights.rats };
  }

  function act(action: Action) {
    const before = state;
    const result = reduceGame(before, action, data);
    assert.equal(result.ok, true, `Preparation ${before.taskIndex + 1}, day ${before.clock.day}, ${action.type}: ${result.message}`);
    state = result.state;
    if (checkEveryAction || state.clock.day !== before.clock.day || action.type === 'task') assert.equal(validateGame(state, data), true, `Valid state after ${action.type}.`);
    totals.actions++;
    // The release of a day that holds, a payment or a delivery, closes the day in the same change, with its upkeep.
    const closed = state.clock.day !== before.clock.day ? state.night!.upkeep : 0;
    if (result.event === 'merge') {
      totals.merges++; dayWork.merges++;
      if (filling) nights.fillerMerges++;
      if (repeatWork) { nights.repeatMerges++; dayWork.repeat++; }
    }
    if (holding(state, data) && nights.held.at(-1) !== state.clock.day) nights.held.push(state.clock.day);
    for (const view of resolveQuests(state, data)) if ((view.status === 'active' || view.status === 'waiting') && !(view.quest.id in nights.opened)) nights.opened[view.quest.id] = state.clock.day;
    if (action.type === 'spawn') { totals.spawns++; totals.takeCoins += before.coins - state.coins; }
    if (action.type === 'deliverQuest') {
      nights.delivered[action.id] = before.clock.day;
      totals.quests++; totals.questCoins += state.coins - before.coins + closed;
      if (action.id === recovery.id) { totals.recoveries++; totals.recoveryCoins += state.coins - before.coins + closed; }
      else if (data.quests.find(quest => quest.id === action.id)?.repeating) { totals.repeats++; totals.repeatCoins += state.coins - before.coins + closed; }
    }
    if (action.type === 'task') { totals.preparationCoins += before.coins - state.coins - closed; nights.payments.push(before.clock.day); }
    if (action.type === 'lantern') nights.lanterns++;
    // The end of each act closes its accounts with the purse that it records, before the closing of its day: the supper, the purchase of
    // the orchard, and the dinner of the sleeper.
    for (const key of actResults) if (!before[key] && state[key]) closeAct(state[key]!.purse);
    if (state.clock.day !== before.clock.day) {
      const night = state.night!;
      totals.upkeepCoins += night.upkeep;
      nights.days = state.clock.day; nights.closings++;
      if (dayWork.merges && dayWork.repeat === dayWork.merges) nights.repeatDays.push(before.clock.day);
      nights.work.push({ day: before.clock.day, ...dayWork });
      dayWork = { merges: 0, repeat: 0 };
      if (night.rat) nights.rats++;
      if (night.rat === 'thief') { nights.thefts++; nights.stolen += night.taken.length + (night.trapped ? 1 : 0); }
      if (night.gift) nights.gifts++;
      // The thief rat empties cells: a kept cell that lost its food is free again.
      for (const index of [...kept]) if (!state.board[index] || unresolvedObstacle(state, index, data)) kept.delete(index);
    }
    // A merge into a blocked dish gives the blocker coin. A closing in the same change pays the upkeep.
    if (action.type === 'move') totals.blockerCoins += state.coins - before.coins + closed;
    nights.lowestPurse = Math.min(nights.lowestPurse, state.coins);
    assert.equal(state.coins, data.prologue.gift + totals.questCoins + totals.blockerCoins - totals.preparationCoins - totals.takeCoins - totals.upkeepCoins + injected, 'Every coin comes from the starting gift or a recorded legal action.');
    assert.ok(totals.actions < 400_000, 'The campaign must converge within the fixture action limit.');
    // In the middle of a long order, a holiday quest whose dishes wait on the board is delivered as soon as its holiday comes.
    if (!holidayDelivery && state.clock.day !== before.clock.day) {
      const due = resolveQuests(state, data).find(view => view.status === 'active' && questHoliday(view.quest, data) && canDeliverQuest(state, view.quest, data))?.quest;
      if (due) { holidayDelivery = true; act({ type: 'deliverQuest', id: due.id }); holidayDelivery = false; }
    }
  }
  const staples = (quest: Quest) => stapleCost(quest, data, growthStages(state.taskIndex, data));
  const takes = (code: string) => stapleCost({ requirements: [{ item: code, quantity: 1 }] }, data, growthStages(state.taskIndex, data));
  /** The cells of the portions of the meals for later days, on their tickets, which no other cooking takes. */
  const reserved = () => new Set(resolveQuests(state, data).filter(view => view.status === 'active' && laterDay(state, view.quest, data) && !cooking.has(view.quest))
    .flatMap(view => questDeliveryCells(state, view.quest).filter(index => index >= 0)));
  const movable = (index: number, held = reserved()) => !!state.board[index] && !unresolvedObstacle(state, index, data) && !getItem(state.board[index]!.code, data)!.generator && !held.has(index);

  /** Near the closing, a purse that cannot pay the upkeep makes recovery teas first. The cells of the next merge stay kept. */
  function keepUpkeep(...cells: number[]) {
    const upkeep = levers(state.clock.day, data).upkeep;
    if (guarding || clockStopped(state, data) || remaining() > UPKEEP_GUARD || state.coins >= upkeep || strategy === 'debt') return;
    guarding = true;
    const added = cells.filter(cell => !kept.has(cell));
    for (const cell of added) kept.add(cell);
    while (state.coins < upkeep && recoveryActive()) recover();
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
    const held = reserved(), spare = state.board.flatMap((cell, index) => movable(index, held) && !kept.has(index) ? [index] : []);
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
    // A quest that opens in the morning after the night can close the recovery quest. The tea then stays on the board as spare food.
    if (recoveryActive()) act({ type: 'deliverQuest', id: recovery.id });
    kept.clear(); for (const index of outside) if (state.board[index] && !unresolvedObstacle(state, index, data)) kept.add(index);
  }

  function take(code: string): number {
    const chain = getItem(code, data)!.chain, source = `generator_${chain}`;
    assert.ok(state.sources.includes(chain), `Day ${state.clock.day}: the source of ${code} is in the bistro.`);
    const cost = takeCost(getItem(source, data)!, data, growthStages(state.taskIndex, data));
    while (cost && state.coins < cost) recover();
    if (firstFreeBoardCell(state, data) === -1) makeRoom();
    const empty = firstFreeBoardCell(state, data);
    act({ type: 'spawn', chain });
    assert.equal(state.board[empty]?.code, code);
    return empty;
  }

  /**
   * Two parts merge into the cell of the first. The night can take a raw part, and a holiday quest delivered at the next opening can
   * take the new dish: then it is made again.
   */
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
      if (state.board[first]?.code === code) return first;
    }
  }

  /** Every portion of some quests on the board, kept. The night can take a raw portion: then the portion is made again. */
  function prepare(...quests: Quest[]) {
    const before = cooking;
    cooking = new Set([...cooking, ...quests]);
    try { cook(quests); } finally { cooking = before; }
  }
  function cook(quests: Quest[]) {
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
    repeatWork = !!quest.repeating;
    prepare(quest);
    repeatWork = false;
    if (canLightLanterns(state, quest, data)) act({ type: 'lantern', id: quest.id });
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
      // A blocked dish of a source that is out of season waits for its season.
      const blocked = state.board.flatMap((cell, index) => unresolvedObstacle(state, index, data) ? [unresolvedObstacle(state, index, data)!] : [])
        .filter(obstacle => dishChains(obstacle.ingredient, data).every(chain => state.sources.includes(chain)));
      if (freeBoardCells(state, data) >= TIDY_FREE || !blocked.length) return;
      const cheapest = blocked.reduce((best, obstacle) => dishWork(obstacle.ingredient, data).merges < dishWork(best.ingredient, data).merges ? obstacle : best);
      while (state.coins < takes(cheapest.ingredient) && recoveryActive()) recover();
      if (state.coins < takes(cheapest.ingredient)) return;
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
      const held = reserved(), ladder = state.board.flatMap((cell, index) => movable(index, held) && !kept.has(index) && getItem(cell!.code, data)!.next
        && state.coins >= takes(cell!.code) ? [index] : [])
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
    if (strategy !== 'debt' || !currentTask(state, data)) return;
    injected += -WINDOW_DEBT - state.coins;
    state = { ...state, coins: -WINDOW_DEBT };
    nights.lowestPurse = Math.min(nights.lowestPurse, state.coins);
  }

  function complete(task: Task) {
    // A short purse delivers an open quest that no preparation needs, such as a March quest, or else a recovery tea.
    while (state.coins < task.cost) {
      if (recoveryActive()) { recover(); continue; }
      const other = resolveQuests(state, data).find(view => view.status === 'active' && !view.quest.recovery && !laterDay(state, view.quest, data))?.quest;
      assert.ok(other, `Preparation ${state.taskIndex + 1}: the purse is short, and no quest can pay for it.`);
      deliver(other);
    }
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
  // After the last payment, the run cooks the finale of the last act, and its end stops the clock.
  for (;;) {
    const task = currentTask(state, data);
    if (!task && clockStopped(state, data)) break;
    const requirements = task ? taskEligibility(state, data).requirements : [];
    if (task && requirements.every(requirement => requirement.met || requirement.kind === 'coins')
      && requirements.find(requirement => requirement.kind === 'quests')!.met) { complete(task); continue; }
    const ticketQuests = () => resolveQuests(state, data).filter(view => view.status === 'active' && !view.quest.recovery).map(view => view.quest);
    // A holiday quest goes first on its holiday, and a holiday meal is cooked ahead, so a long order never pushes it past its holiday.
    const due = ticketQuests().find(quest => questHoliday(quest, data) && !laterDay(state, quest, data));
    if (due) { deliver(due); continue; }
    const ahead = ticketQuests().filter(quest => questHoliday(quest, data) && laterDay(state, quest, data) && questDeliveryCells(state, quest).some(index => index < 0));
    if (ahead.length) { prepare(...ahead); kept.clear(); continue; }
    tidy();
    const tickets = ticketQuests();
    // While the quests of the next payment wait for their dates, a short purse keeps the recovery quest open and the repeating quests
    // closed, so it makes recovery teas.
    if (!tickets.length && recoveryActive()) { recover(); kept.clear(); continue; }
    assert.ok(tickets.length, `The campaign cannot resolve these blockers: ${taskEligibility(state, data).blockers.join(' ')}`);
    // The miss strategy lets the first evening of each booked quest pass. A fixed evening holds its day, so it is never missed.
    if (strategy === 'miss-bookings') for (const quest of tickets) if (quest.booked && quest.evening === undefined && tonight(quest) && !missed.has(quest.id)) missed.set(quest.id, state.clock.day);
    const booked = tickets.find(quest => quest.booked && tonight(quest));
    if (booked) { deliver(booked); continue; }
    // A campaign quest before a repeating quest: the repeating quests only fill the days.
    const open = tickets.filter(quest => !quest.booked && !laterDay(state, quest, data));
    const campaign = open.filter(quest => !quest.repeating);
    if (open.length) { deliver((campaign.length ? campaign : open).reduce((cheapest, quest) => staples(quest) < staples(cheapest) ? quest : cheapest)); continue; }
    // Only quests for later days are left: booked quests for later evenings, holiday quests before their holiday, and outdoor quests
    // on a day without a terrace. Their cooking is needed anyway, and its merges bring the night. They cook one portion at a time, so a
    // quest that takes a ticket while a long order cooks comes first. With every such meal cooked, the bistro has no work, and a
    // repeating quest opens on the next turn of this loop.
    // Only the miss strategy, which lets tonight's guest wait, cooks spare food to pass the evening.
    const day = state.clock.day, short = tickets.find(quest => questDeliveryCells(state, quest).some(index => index < 0));
    if (short) {
      const portions = short.requirements.flatMap(({ item, quantity }) => Array<string>(quantity).fill(item));
      produce(portions[questDeliveryCells(state, short).findIndex(index => index < 0)]);
      kept.clear(); continue;
    }
    if (!resolveQuests(state, data).some(view => view.quest.repeating && view.status === 'active')) {
      assert.notEqual(strategy, 'efficient', `Day ${day}: the efficient strategy has cooked every quest, and the booked guest comes on a later evening. Tickets: ${resolveQuests(state, data).filter(view => view.status !== 'locked' && view.status !== 'complete').map(view => `${view.quest.id} ${view.status}`).join(', ')}. Evening: ${JSON.stringify(state.evening)}.`);
      // An open recovery quest keeps the repeating quests closed, so a short purse makes its teas while it waits.
      if (strategy === 'debt' && recoveryActive()) { recover(); kept.clear(); continue; }
      // A missed guest's lanterns bring the closing near, so the wait is short.
      for (const quest of tickets) if (canLightLanterns(state, quest, data)) act({ type: 'lantern', id: quest.id });
      fill(day);
    }
    kept.clear();
  }

  // The end of the last act stops the clock, and each act has recorded its result.
  assert.equal(state.taskIndex, data.tasks.length);
  assert.ok(actResults.slice(0, data.acts.length).every(key => state[key]), 'The end of each act records its result.');
  assert.equal(acts.length, data.acts.length);
  assert.equal(state.completedQuests.filter(id => data.quests.some(quest => quest.id === id && campaignQuest(quest, data))).length, requiredQuests(data.tasks.length, data).length, 'The payments need every campaign quest.');
  assert.equal(validateGame(state, data), true);
  assert.equal(totals.preparationCoins, preparations.reduce((sum, task) => sum + task.cost, 0));
  return { prologue: prologue.events, chapters, preparations, totals, nights, finalState: state, acts, purse: acts[0].purse, spending: acts[0].spending };
}

/** The fixed seeds of the balance check. */
export const BALANCE_SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);

/** The percentage of repeating merges from the day after the feast through 31 August. */
export function afterFeastShare(work: CampaignNights['work'], data: GameData): number {
  const late = work.filter(day => day.day > data.finales[1].day && day.day <= data.acts[1].to);
  const merges = late.reduce((sum, day) => sum + day.merges, 0);
  return merges ? +(100 * late.reduce((sum, day) => sum + day.repeat, 0) / merges).toFixed(1) : 0;
}

if (import.meta.main) {
  const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
  const strategy = (process.argv[2] ?? 'efficient') as CampaignStrategy;
  if (!['efficient', 'miss-bookings', 'debt'].includes(strategy)) throw new Error('Use the strategy efficient, miss-bookings, or debt.');
  for (const seed of BALANCE_SEEDS) {
    const { acts, nights } = runCampaignBalance(data, seed, strategy, false);
    console.log(JSON.stringify({ seed, acts: acts.map(({ purse, spending, merges, repeatMerges, repeatDays, closings, rats }) => ({ purse, spending, share: +(100 * purse / spending).toFixed(1),
      merges, repeat: +(100 * repeatMerges / merges).toFixed(1), repeatDays: repeatDays.join(' '), closings, rats })),
      afterFinale: afterFeastShare(nights.work, data), held: nights.held.join(' ') }));
  }
}
