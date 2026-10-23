// Synthetic saves at every preparation checkpoint, for manual checks without playing the whole campaign.
// Each save has its preparations paid, the quests that the next preparation needs delivered, and the exact coins for the next reveal.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { currentTask, finaleQuest, finaleServed, firstFreeBoardCell, freeBoardCells, gardenStage, isSunday, levers, marchOpens, questFinale, questHoliday, requiredQuests, seasonPaid, sourceCell, sourceNeeded, stapleCost, taskAct, terraceDay } from '../src/model.ts';
import { KEEP_FREE, reduceGame, revealTickets, validateGame } from '../src/engine.ts';
import type { Finale, GameData, GameState, Quest } from '../src/model.ts';
import { runPrologue } from './campaign-balance.ts';

const starts = new WeakMap<GameData, Map<number, GameState>>();
/** The state at the start of act 1, after a legal run of the prologue with this seed. Each data and seed plays the prologue once. */
export function actOneStart(data: GameData, seed = 0): GameState {
  const runs = starts.get(data) ?? new Map<number, GameState>();
  starts.set(data, runs);
  if (!runs.has(seed)) runs.set(seed, runPrologue(data, seed, false).state);
  return structuredClone(runs.get(seed)!);
}

/** The earliest day on which a quest delivers: its opening date, its holiday, its fixed evening, its finale, and a terrace day for an outdoor quest. */
function deliveryDay(quest: Quest, from: number, data: GameData) {
  let day = Math.max(from, quest.opens ?? 1, questHoliday(quest, data)?.day ?? 1, quest.evening ?? 1, questFinale(quest, data)?.day ?? 1);
  while (quest.outdoor && !terraceDay(day, data)) day++;
  return day;
}
/**
 * Moves a checkpoint to a later morning, as the closings of the days between would: a quiet night with no rat and no gift, each
 * seasonal source in or out of its season, each March quest that opens, the hail in the queue of the blockers from its day, and the
 * dishes of the quests that take a ticket.
 */
export function moveTo(state: GameState, day: number, data: GameData) {
  if (day > state.clock.day) {
    const night = day - 1;
    state.clock = { day, merges: 0 };
    state.night = { day: night, upkeep: levers(night, data).upkeep, rat: isSunday(night, data) ? 'soricescu' : null, taken: [], trapped: null, gift: null, departed: [], purse: state.coins, seen: true, piper: false };
    state.evening = { guest: null, last: null, delivered: false };
    for (const chain of data.chains) {
      const season = chain.season, at = sourceCell(state, chain.id);
      if (!season) continue;
      if (at >= 0 && day > season.to && !sourceNeeded(state, chain.id, data)) state.board[at] = null;
      if (at < 0 && day >= season.from && day <= season.to && seasonPaid(chain, state.taskIndex, data) && freeBoardCells(state, data) > KEEP_FREE) {
        state.board[firstFreeBoardCell(state, data)] = { code: `generator_${chain.id}` };
        if (!state.discovered.includes(`generator_${chain.id}`)) state.discovered.push(`generator_${chain.id}`);
      }
    }
    const progress = state.preparationObstacles;
    if (progress && day >= data.board.hail.day && progress.hail === undefined) {
      progress.hail = data.tasks.slice(progress.start, state.taskIndex).filter(task => data.board.preparations.some(batch => batch.after === task.id)).length;
    }
  }
  for (const quest of data.quests) if (marchOpens(state, quest, data)) state.march.push(quest.id);
  revealTickets(state, data);
}
import { exportSave } from '../src/storage.ts';

/** Serves a finale on its evening at the booking time. The supper records the result of act 1. */
export function serveFinale(state: GameState, finale: Finale, data: GameData) {
  moveTo(state, finale.day, data);
  const dayLevers = levers(finale.day, data);
  state.clock.merges = (dayLevers.booking - dayLevers.opening) / dayLevers.mergeMinutes;
  state.completedQuests.push(finaleQuest(finale, data)!.id);
  if (finale === data.finales[0]) state.act1 = { purse: state.coins };
}
/**
 * Delivers the quests that the next preparation needs, in data order, on the earliest morning that permits them and the payment. A
 * finale before that morning is served first, on its evening, so the days after it follow its release.
 */
export function deliverRequired(state: GameState, data: GameData) {
  const task = currentTask(state, data), quests = requiredQuests(state.taskIndex, data).filter(quest => !state.completedQuests.includes(quest.id));
  const day = Math.max(task ? Math.max(data.chapters[task.chapter - 1].opens, task.opens ?? 1) : 1, ...quests.map(quest => deliveryDay(quest, state.clock.day, data)));
  for (const finale of data.finales) if (finale.day < day && !finaleServed(state, finale, data)) serveFinale(state, finale, data);
  moveTo(state, day, data);
  for (const quest of quests) state.completedQuests.push(quest.id);
  moveTo(state, state.clock.day, data);
}
/**
 * The state before the payment of the preparation at index count: the earlier preparations are paid, every quest that this
 * preparation needs is delivered in data order, the day is the earliest morning that permits those deliveries and the payment, and
 * the coins equal its cost. A checkpoint keeps no scene from earlier payments, so its own payment shows only the scenes that it earns.
 * The finished checkpoint has paid every preparation and the purchase.
 */
export function checkpointState(data: GameData, count: number, start: GameState = actOneStart(data)): GameState {
  let state = structuredClone(start);
  for (;;) {
    if (state.taskIndex === data.tasks.length) return state;
    deliverRequired(state, data);
    state.coins = currentTask(state, data)!.cost;
    state.pendingScenes = [];
    // The delivered quests advance the tickets. Each quest that then holds a ticket puts its dishes in the recipe book.
    revealTickets(state, data);
    if (state.taskIndex >= count) return state;
    const result = reduceGame(state, { type: 'task' }, data);
    if (!result.ok) throw new Error(`${data.tasks[state.taskIndex].title}: ${result.message}`);
    state = result.state;
  }
}
/**
 * The evening of the finale of an act, at the booking time: every preparation of the act before its finale is paid, every quest that
 * the finale follows is delivered, and the coins buy the ingredients of the finale.
 */
export function finaleCheckpoint(data: GameData, act: number, start: GameState = actOneStart(data)): GameState {
  const finale = data.finales[act - 1], last = data.tasks.findLastIndex(task => taskAct(task, data) === act && !task.purchase);
  const result = reduceGame(checkpointState(data, last, start), { type: 'task' }, data);
  if (!result.ok) throw new Error(`${data.tasks[last].title}: ${result.message}`);
  const next = result.state, dayLevers = levers(finale.day, data);
  moveTo(next, finale.day, data);
  next.clock.merges = (dayLevers.booking - dayLevers.opening) / dayLevers.mergeMinutes;
  next.coins = stapleCost(finaleQuest(finale, data)!, data, gardenStage(next.taskIndex, data));
  next.pendingScenes = [];
  revealTickets(next, data);
  return next;
}
/** The named checkpoints of act 2: the supper, the start of act 2, and the days that hold or change the board. */
export function actTwoCheckpoints(data: GameData): [name: string, state: GameState][] {
  const index = (id: string) => data.tasks.findIndex(task => task.id === id);
  const at =(id: string, date: number, paid = false) => {
    let state = checkpointState(data, index(id));
    if (paid) state = reduceGame(state, { type: 'task' }, data).state;
    moveTo(state, date, data);
    state.pendingScenes = [];
    return state;
  };
  const supper = finaleCheckpoint(data, 1), served = structuredClone(supper), finale = data.finales[0];
  served.completedQuests.push(finaleQuest(finale, data)!.id);
  served.act1 = { purse: served.coins };
  const hold = (line: string) => data.calendar.holds.find(value => value.line === line)!.day, morning = structuredClone(served);
  moveTo(morning, data.acts[1].from, data);
  return [
    ['1-may-before-supper', supper],
    ['1-may-after-supper', served],
    ['2-may', morning],
    ['20-june', at('act2-prep-12', hold('The square must be ready by morning.'))],
    ['12-july', at('act2-prep-15', hold('Ambrozie waits for his dinner.'), true)],
    ['18-july', at('act2-prep-17', data.board.hail.day, true)],
    ['14-august', at('act2-prep-24', hold('The feast tables must be ready by morning.'))],
    ['15-august', finaleCheckpoint(data, 2)],
    ['31-august', checkpointState(data, index('act2-orchard'))],
  ];
}

if (import.meta.main) {
  const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
  const target = new URL('../tmp/checkpoint-saves/', import.meta.url);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  // The same envelope and checks as Export saved game, so every file imports.
  const write = (name: string, state: GameState) => writeFile(new URL(`${name}.json`, target), exportSave(state, candidate => validateGame(candidate, data)));
  for (let count = 0; count <= data.tasks.length; count++) {
    const state = checkpointState(data, count), next = currentTask(state, data);
    await write(`${String(count).padStart(2, '0')}-${next ? `next-${next.title.toLowerCase().replaceAll(' ', '-').replaceAll('’', '')}` : 'finished'}`, state);
  }
  for (const [name, state] of actTwoCheckpoints(data)) await write(`act2-${name}`, state);
  console.log(`Created ${data.tasks.length + 1} preparation checkpoint saves and the act 2 checkpoint saves in tmp/checkpoint-saves/. Import one from Options, with Import saved game.`);
}
