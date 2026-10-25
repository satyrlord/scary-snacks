// Shared fixtures for the Node tests: the game data, checked actions, checkpoint saves, quest deliveries, balance runs, and a storage in memory.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canLightLanterns, dayMerges, eveningOpen, firstFreeBoardCell, generatorOutputs, getItem, prologueQuests, questFinale, questHoliday, questPredecessors, requiredQuests, resolveQuests } from '../src/model.ts';
import { reduceGame, revealTickets, validateGame } from '../src/engine.ts';
import { dataProblems } from '../src/content.ts';
import { exportSave, importSave } from '../src/storage.ts';
import type { Action, GameData, GameState, Quest } from '../src/model.ts';
import { actOneStart, checkpointState, deliverRequired, finaleCheckpoint, moveTo } from '../tools/create-checkpoint-saves.ts';
import { BALANCE_SEEDS, runCampaignBalance } from '../tools/campaign-balance.ts';
import type { CampaignBalance, CampaignStrategy } from '../tools/campaign-balance.ts';

export const data: GameData = JSON.parse(await readFile(new URL('../public/data/game.json', import.meta.url), 'utf8'));
export const validate = (candidate: unknown) => validateGame(candidate, data);
/** The event quests of the prologue, which an act 1 save lists first as delivered. */
export const prologueServed = prologueQuests(data).map(value => value.id);
/** A quest by its ID, and the recovery quest. */
export const quest = (id: string) => data.quests.find(value => value.id === id)!;
export const recovery = data.quests.find(value => value.recovery)!;

/** Adds a board layout without obstacles to the shared data. openGame starts a new game on it. */
export const addOpenLayout = () => { data.board.layouts.push({ id: 'test-open', obstacles: [] }); };
/** The start of act 1 with a fixed seed, after a legal run of the prologue, so that two starts are equal. */
export const actOne = (content = data) => actOneStart(content, 1);
export const openGame = (): GameState => ({ ...actOne(), layoutId: 'test-open' });

/**
 * A copy whose recipe book holds only the board and the dishes of the quests on the tickets, as if the prologue had discovered nothing
 * else. Tests of a first discovery in act 1 use it.
 */
export function unknown(state: GameState): GameState {
  const next = structuredClone(state);
  next.discovered = [...new Set([...next.sources.map(chain => `generator_${chain}`), ...next.board.flatMap(cell => cell ? [cell.code] : [])])];
  return withTickets(next);
}
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

/**
 * A copy with the exact cost of the next preparation in coins, and every quest that it needs marked delivered, on the earliest morning
 * that permits those deliveries and the payment.
 */
export function ready(state: GameState, content = data): GameState {
  const next = structuredClone(state);
  deliverRequired(next, content);
  next.coins = content.tasks[next.taskIndex].cost;
  revealTickets(next, content);
  return next;
}
/** Puts dishes in the recipe book of a hand-made state. A ticket may have put a dish there already. */
export function know(state: GameState, ...codes: string[]) {
  for (const code of codes) if (!state.discovered.includes(code)) state.discovered.push(code);
}
/** A hand-made state with the dishes of its ticketed quests in the recipe book, as the engine keeps them after each action. */
export function withTickets(state: GameState, content = data): GameState {
  revealTickets(state, content);
  return state;
}
export const payNext = (state: GameState, content = data) => act(ready(state, content), { type: 'task' }, content);

/** The checkpoint save before the payment of the preparation at index count, from checkpointState. */
export const checkpoint = (count: number) => checkpointState(data, count);
/** The same checkpoint save on the board without obstacles. The test file calls addOpenLayout first. */
export const openCheckpoint = (count: number) => checkpointState(data, count, openGame());
/** The preparation at index count is paid for, and the quests that open with it wait. */
export const opened = (count: number): GameState => ({ ...checkpoint(count), completedQuests: checkpoint(count - 1).completedQuests, coins: 0 });

/** The earliest day on which the preparation at this index can be paid: the opening of its chapter, and the dates of the quests that it needs. */
export const payDay = (taskIndex: number, content = data) => Math.max(content.chapters[(content.tasks[taskIndex] ?? content.tasks.at(-1)!).chapter - 1].opens,
  ...requiredQuests(taskIndex, content).map(quest => questHoliday(quest, content)?.day ?? quest.opens ?? 1));
/**
 * A copy on the first weekday of April, after the March quests of Dochia: each one that opened is delivered, in the order of opening.
 * The tests of the other quests use it, so the March quests take no ticket.
 */
export function afterMarch(state: GameState): GameState {
  const next = structuredClone(state);
  moveTo(next, Math.max(next.clock.day, data.calendar.fasts[0].fish[0] + 8), data);
  next.completedQuests.push(...next.march.filter(id => !next.completedQuests.includes(id)));
  return withTickets(next);
}
/** A save that goes through export and import, as a reload does. */
export const reload = (state: GameState): GameState => importSave(exportSave(state, validate), validate);
/** Closes the day with the merge of two Elderflowers, one merge before the closing time. */
export function closeDay(state: GameState) {
  const next = structuredClone(state), cells: number[] = [];
  for (let count = 0; count < 2; count++) {
    const cell = firstFreeBoardCell(next, data);
    assert.notEqual(cell, -1);
    next.board[cell] = { code: 'herbs_1' };
    cells.push(cell);
  }
  know(next, 'herbs_1');
  next.clock.merges = dayMerges(next.clock.day, data) - 1;
  return act(next, { type: 'move', from: cells[0], to: cells[1] });
}
/**
 * The checkpoint at which a campaign quest waits on its ticket: the preparation that first needs it is next, and every other quest
 * that this preparation needs, and each March quest, is delivered. A quest that waits for this one waits again. A booked quest waits
 * for a day with an evening.
 */
export function onTicket(target: Quest): GameState {
  const state = checkpointState(data, data.tasks.findIndex((_, at) => requiredQuests(at, data).includes(target)));
  const waits = (id: string) => { const other = data.quests.find(value => value.id === id); return !!other && questPredecessors(other, data).includes(target.id); };
  state.completedQuests = state.completedQuests.filter(id => id !== target.id && !waits(id));
  const ready = afterMarch(state);
  if (target.booked) { let day = ready.clock.day; while (!eveningOpen(day, data)) day++; moveTo(ready, day, data); }
  assert.equal(validate(ready), true, target.id);
  assert.equal(resolveQuests(ready, data).find(view => view.quest === target)!.status, 'active', target.id);
  return ready;
}
/** The status of a quest in a state. */
export const status = (state: GameState, id: string) => resolveQuests(state, data).find(view => view.quest.id === id)!.status;
/** The tags of the dishes of a quest. */
export const tags = (quest: { requirements: { item: string }[] }) => quest.requirements.flatMap(({ item }) => data.items[item].tags);

/** A copy with the items of the quest on free cells. Direct supplies isolate the quest rules from production, which has its own legal-play tests. */
export function supply(state: GameState, id: string): GameState {
  const supplied = structuredClone(state);
  for (const { item, quantity } of quest(id).requirements) for (let count = 0; count < quantity; count++) {
    const index = firstFreeBoardCell(supplied, data);
    assert.notEqual(index, -1);
    supplied.board[index] = { code: item };
    if (!supplied.discovered.includes(item)) supplied.discovered.push(item);
  }
  return supplied;
}
/**
 * A copy in which a booked quest has this evening. Checkpoint saves skip the actions that fix the evening guest, so the quest
 * tests set it here; tests/day.test.ts covers the choice of the evening guest.
 */
export function tonight(state: GameState, id: string): GameState {
  const booked = quest(id);
  return booked.booked ? { ...state, evening: { ...state.evening, guest: booked.character, delivered: false } } : state;
}
/** Delivers a quest from supplied items. A booked quest gets this evening, the supper waits for its day, and the lanterns bring the guests. */
export function deliver(state: GameState, id: string) {
  let next = tonight(supply(state, id), id);
  const finale = questFinale(quest(id), data);
  if (finale) moveTo(next, finale.day, data);
  if (canLightLanterns(next, quest(id), data)) next = act(next, { type: 'lantern', id });
  return act(next, { type: 'deliverQuest', id });
}

/** The data that a player has checked already. */
const checked = new WeakSet<GameData>();
/**
 * A player who takes only legal actions, and who makes each dish from its source, merges, and recipes. A recipe merges its second
 * part into its first. A take from a paid source needs the coins in the purse.
 */
export function player(initial = actOne(), content = data) {
  let state = initial;
  if (!checked.has(content)) assert.deepEqual(dataProblems(content), [], 'The fixture data passes its checks.');
  checked.add(content);
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
      state = act(state, { type: 'spawn', chain: item.chain }, content);
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

/** The balance runs of a strategy for every fixed seed, without the check of the state after every action. */
export const runs = (strategy: CampaignStrategy) => BALANCE_SEEDS.map(seed => [seed, runCampaignBalance(data, seed, strategy, false)] as const);
/** The night totals of a run for a diagnostic. Extra text goes before the full stop. */
export const nightLine = (seed: number, run: CampaignBalance, extra = '') => `Seed ${seed}: ${run.nights.days} days, ${run.nights.lanterns} lanterns, ${run.nights.thefts} thefts, `
  + `${run.nights.stolen} stolen, ${run.nights.gifts} gifts, lowest purse ${run.nights.lowestPurse}${extra}.`;

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

/** The preparations of act 1, and the evening of the supper: every preparation of act 1 paid, at the booking time of 1 May. */
export const actOneTasks = data.tasks.filter(task => data.chapters[task.chapter - 1].act === 1).length;
export const supperEvening = () => finaleCheckpoint(data, 1);
/** The payments of act 1 and act 2, with the purchase of the orchard: the index of the first preparation of act 3. */
export const actTwoTasks = data.tasks.findIndex(task => task.purchase) + 1;
/** A copy of the data whose calendar ends with act 2, as a game without a later act: the purchase of the orchard ends it. */
export function withoutActThree(content = data): GameData {
  const copy = structuredClone(content), end = copy.acts[1].to, third = new Set(copy.tasks.slice(actTwoTasks).map(task => task.id));
  copy.acts = copy.acts.slice(0, 2);
  Object.assign(copy.calendar, { end, weather: copy.calendar.weather.slice(0, end), holidays: copy.calendar.holidays.filter(holiday => holiday.day <= end),
    holds: copy.calendar.holds.filter(hold => hold.day <= end) });
  copy.tasks = copy.tasks.filter(task => !third.has(task.id));
  copy.chapters = copy.chapters.filter(chapter => chapter.act <= 2);
  copy.finales = copy.finales.slice(0, 2);
  copy.areas = copy.areas.filter(area => area.act <= 2);
  copy.rooms = copy.rooms.filter(room => copy.areas.some(area => area.id === room.area));
  copy.board.preparations = copy.board.preparations.filter(batch => !third.has(batch.after));
  copy.quests = copy.quests.filter(quest => quest.act !== 3);
  return copy;
}
