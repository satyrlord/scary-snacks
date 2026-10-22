// Synthetic saves at every preparation checkpoint, for manual checks without playing the whole campaign.
// Each save has its preparations paid, the quests that the next preparation needs delivered, and the exact coins for the next reveal.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { currentTask, firstFreeBoardCell, freeBoardCells, isSunday, marchOpens, questHoliday, requiredQuests, sourceCell, sourceNeeded, stapleCost, supperQuest, terraceDay } from '../src/model.ts';
import { KEEP_FREE, reduceGame, revealTickets, validateGame } from '../src/engine.ts';
import type { GameData, GameState, Quest } from '../src/model.ts';
import { runPrologue } from './campaign-balance.ts';

const starts = new WeakMap<GameData, Map<number, GameState>>();
/** The state at the start of act 1, after a legal run of the prologue with this seed. Each data and seed plays the prologue once. */
export function actOneStart(data: GameData, seed = 0): GameState {
  const runs = starts.get(data) ?? new Map<number, GameState>();
  starts.set(data, runs);
  if (!runs.has(seed)) runs.set(seed, runPrologue(data, seed, false).state);
  return structuredClone(runs.get(seed)!);
}

/** The earliest day on which a quest delivers: its opening date, its holiday, and a terrace day for an outdoor quest. */
function deliveryDay(quest: Quest, from: number, data: GameData) {
  let day = Math.max(from, quest.opens ?? 1, questHoliday(quest, data)?.day ?? 1);
  while (quest.outdoor && !terraceDay(day, data)) day++;
  return day;
}
/**
 * Moves a checkpoint to a later morning, as the closings of the days between would: a quiet night with no rat and no gift, each
 * seasonal source in or out of its season, each March quest that opens, and the dishes of the quests that take a ticket.
 */
export function moveTo(state: GameState, day: number, data: GameData) {
  if (day > state.clock.day) {
    state.clock = { day, merges: 0 };
    state.night = { day: day - 1, upkeep: data.day.upkeep, rat: isSunday(day - 1, data) ? 'soricescu' : null, taken: [], trapped: null, gift: null, departed: [], purse: state.coins, seen: true };
    state.evening = { guest: null, last: null, delivered: false };
    for (const chain of data.chains) {
      const season = chain.season, at = sourceCell(state, chain.id);
      if (!season) continue;
      if (at >= 0 && day > season.to && !sourceNeeded(state, chain.id, data)) state.board[at] = null;
      if (at < 0 && day >= season.from && day <= season.to && freeBoardCells(state, data) > KEEP_FREE) {
        state.board[firstFreeBoardCell(state, data)] = { code: `generator_${chain.id}` };
        if (!state.discovered.includes(`generator_${chain.id}`)) state.discovered.push(`generator_${chain.id}`);
      }
    }
  }
  for (const quest of data.quests) if (marchOpens(state, quest, data)) state.march.push(quest.id);
  revealTickets(state, data);
}
import { exportSave } from '../src/storage.ts';

/** Delivers the quests that the next preparation needs, in data order, on the earliest morning that permits them and the payment. */
export function deliverRequired(state: GameState, data: GameData) {
  const task = currentTask(state, data), quests = requiredQuests(state.taskIndex, data).filter(quest => !state.completedQuests.includes(quest.id));
  moveTo(state, Math.max(task ? data.chapters[task.chapter - 1].opens : 1, ...quests.map(quest => deliveryDay(quest, state.clock.day, data))), data);
  for (const quest of quests) state.completedQuests.push(quest.id);
  moveTo(state, state.clock.day, data);
}
/**
 * The state before the payment of the preparation at index count: the earlier preparations are paid, every quest that this
 * preparation needs is delivered in data order, the day is the earliest morning that permits those deliveries and the payment, and
 * the coins equal its cost. A checkpoint keeps no scene from earlier payments, so its own payment shows only the scenes that it earns.
 * The finished checkpoint keeps the scenes earned by the last payment, and its coins buy the staples of the supper.
 */
export function checkpointState(data: GameData, count: number, start: GameState = actOneStart(data)): GameState {
  let state = structuredClone(start);
  for (;;) {
    deliverRequired(state, data);
    state.coins = currentTask(state, data)?.cost ?? stapleCost(supperQuest(data)!, data);
    if (state.taskIndex < data.tasks.length) {
      state.pendingScenes = [];
    }
    // The delivered quests advance the tickets. Each quest that then holds a ticket puts its dishes in the recipe book.
    revealTickets(state, data);
    // The finished checkpoint is the evening of the supper, so Serve works when the plates are on the board.
    if (state.taskIndex === data.tasks.length) {
      moveTo(state, data.calendar.supper, data);
      state.clock.merges = (data.day.booking - data.day.opening) / data.day.mergeMinutes;
    }
    if (state.taskIndex >= count) return state;
    const result = reduceGame(state, { type: 'task' }, data);
    if (!result.ok) throw new Error(`${data.tasks[state.taskIndex].title}: ${result.message}`);
    state = result.state;
  }
}

if (import.meta.main) {
  const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
  const target = new URL('../tmp/checkpoint-saves/', import.meta.url);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  for (let count = 0; count <= data.tasks.length; count++) {
    const state = checkpointState(data, count), next = currentTask(state, data);
    const name = `${String(count).padStart(2, '0')}-${next ? `next-${next.title.toLowerCase().replaceAll(' ', '-')}` : 'finished'}`;
    // The same envelope and checks as Export saved game, so every file imports.
    await writeFile(new URL(`${name}.json`, target), exportSave(state, candidate => validateGame(candidate, data)));
  }
  console.log(`Created ${data.tasks.length + 1} checkpoint saves in tmp/checkpoint-saves/. Import one from Options, with Import saved game.`);
}
