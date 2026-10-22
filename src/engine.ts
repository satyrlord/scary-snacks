// The deterministic rules of the bistro game: the new game, the actions, and the acceptance of an untrusted save.
import { arrivalScene, availableChains, boardLayout, boardObstacles, canDeliverQuest, canLightLanterns, chainSeason, clockMinutes, clockText, currentEvent, cycleMember, dateText, decorationUnlocked, deliveriesSince, dayMerges, dishOpen, earnedPrologue, earnedScenes, eventComplete, eventDishes, eveningOpen, findQuest, firstFreeBoardCell, freeBoardCells, getItem, holding, holdsDay, integer, isSunday, looseRaw, looseRawCells, marchOpens, mergePartners, mergeResult, own, pendingPreparationObstacles, prerequisitesMet, present, prologueQuests, prologueScenes, questDeliveryCells, questEvent, questHoliday, questPredecessors, requiredQuests, resolveChapters, resolveQuests, sourceCell, sourceNeeded, storyOrder, supperComplete, takeCost, taskEligibility, ticketNote, unresolvedObstacle } from './model.ts';
import type { Action, Cell, GameData, GameState, NightReport, Placed, Result } from './model.ts';

/** At most this many preparation blockers wait on the board at one time. */
const ACTIVE_BLOCKERS = 3;
/** Placement keeps this many usable cells empty: one Linden tea from scratch, for the recovery quest, needs four. */
export const KEEP_FREE = 4;
// A state is JSON data, as its save is, and a JSON copy is faster than structuredClone.
const copy = (state: GameState): GameState => JSON.parse(JSON.stringify(state));
const itemAt = (state: GameState, index: unknown) => integer(index, 0, state.board.length - 1) ? state.board[index] : null;
function discover(state: GameState, code: string) {
  if (!state.discovered.includes(code)) state.discovered.push(code);
}
/** The line of a dish that the player makes for the first time. */
export const newDishLine = (name: string) => `${name} is a new dish! It is in the recipe book now.`;
export const BOARD_FULL = 'The board is full. Merge a pair or deliver a quest.';
/** Discovers a dish that the player makes or takes. The first one of its kind gets the new-dish notice instead of the usual line. */
function made(state: GameState, code: string, name: string, line: string) {
  const first = !state.discovered.includes(code);
  discover(state, code);
  return first ? newDishLine(name) : line;
}
/** Keep production space. Place in stable cell order. */
function placePreparationObstacles(state: GameState, data: GameData): number {
  const progress = state.preparationObstacles;
  if (!progress) return 0;
  let placed = 0;
  for (const obstacle of pendingPreparationObstacles(state, data)) {
    if (progress.placed.filter(placement => !state.resolvedObstacles.includes(placement.id)).length >= ACTIVE_BLOCKERS || freeBoardCells(state, data) <= KEEP_FREE) break;
    const position = firstFreeBoardCell(state, data);
    if (position === -1) break;
    progress.placed.push({ id: obstacle.id, position });
    placed++;
  }
  return placed;
}
/** The next value of the seed and a random whole number from it (mulberry32). */
function random(seed: number) {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let value = Math.imul(next ^ next >>> 15, 1 | next);
  value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
  return { seed: next, value: (value ^ value >>> 14) >>> 0 };
}
/** The free cell nearest to the bottom left of the board. A tie goes to the lower cell. */
function bottomLeftFreeCell(state: GameState, data: GameData): number {
  const { columns, rows } = data.board, distance = (index: number) => (rows - 1 - Math.floor(index / columns)) ** 2 + (index % columns) ** 2;
  return state.board.map((cell, index) => index).filter(index => state.board[index] === null && !unresolvedObstacle(state, index, data))
    .sort((a, b) => distance(a) - distance(b) || b - a)[0] ?? -1;
}
/** Places each seasonal source that is in season and not on the board, in the first free cell, while the board keeps its free cells. */
function placeSeasonalSources(state: GameState, data: GameData): string[] {
  const placed: string[] = [];
  for (const chain of data.chains) {
    const season = chain.season, day = state.clock.day;
    if (!season || day < season.from || day > season.to || sourceCell(state, chain.id) >= 0 || freeBoardCells(state, data) <= KEEP_FREE) continue;
    const code = `generator_${chain.id}`;
    state.board[firstFreeBoardCell(state, data)] = { code };
    discover(state, code);
    placed.push(data.items[code].name);
  }
  return placed;
}
/** Records each March quest that opens in this change, so that it stays open after March. */
function recordMarch(state: GameState, data: GameData) {
  for (const quest of data.quests) if (marchOpens(state, quest, data)) state.march.push(quest.id);
}
/**
 * The closing, in the change of the merge that reaches the closing time: the upkeep, then the departure of each seasonal source whose
 * season ends, then, on Sunday night only, the thief rat or Șoricescu, then the next day and its seasonal sources, then the night
 * report. The evening guest of the new day follows in the same change.
 */
function close(state: GameState, data: GameData) {
  const levers = data.day, day = state.clock.day;
  state.coins -= levers.upkeep;
  const departed = data.chains.filter(chain => chain.season && day >= chain.season.to && sourceCell(state, chain.id) >= 0 && !sourceNeeded(state, chain.id, data)).map(chain => chain.id);
  for (const chain of departed) state.board[sourceCell(state, chain)] = null;
  const loose = looseRawCells(state, data);
  let report: Omit<NightReport, 'purse' | 'seen'>;
  if (!isSunday(day, data)) report = { day, upkeep: levers.upkeep, rat: null, taken: [], trapped: null, gift: null, departed };
  else if (loose.length) {
    const picks: number[] = [];
    while (picks.length < levers.ratTake && loose.length) {
      const draw = random(state.seed);
      state.seed = draw.seed;
      picks.push(loose.splice(draw.value % loose.length, 1)[0]);
    }
    const placed = picks.map(position => ({ item: state.board[position]!.code, position }));
    for (const { position } of placed) state.board[position] = null;
    // The first pick drops into a new rat hole, while fewer holes are open than the limit.
    const trapped = state.ratHoles.length < levers.ratHoles ? placed.shift()! : null;
    if (trapped) state.ratHoles.push(trapped);
    report = { day, upkeep: levers.upkeep, rat: 'thief', taken: placed, trapped, gift: null, departed };
  } else {
    // A tidy kitchen earns a gift, if it leaves the free cells that the recovery quest needs. The seasonal chains give no gift.
    let gift: NightReport['gift'] = null;
    if (freeBoardCells(state, data) >= levers.giftSpace) {
      const chains = availableChains(state, data), open = data.chains.filter(chain => chains.includes(chain.id) && !chain.season);
      const item = `${open[state.gifts % open.length].id}_${levers.giftStage}`, position = bottomLeftFreeCell(state, data);
      state.board[position] = { code: item };
      gift = { item, position, first: !state.discovered.includes(item) };
      discover(state, item);
      state.gifts++;
    }
    report = { day, upkeep: levers.upkeep, rat: 'soricescu', taken: [], trapped: null, gift, departed };
  }
  state.clock = { day: day + 1, merges: 0 };
  state.evening = { guest: null, last: state.evening.guest ?? state.evening.last, delivered: false };
  state.night = { ...report, purse: state.coins, seen: report.rat === null };
  placeSeasonalSources(state, data);
}
/**
 * Fixes the evening guest when no guest has this evening, the day has an evening, and a booked quest has a ticket: the only booked
 * guest, or the guest who did not have the last evening, or the first in authored order. The guest then keeps the evening until the
 * next closing.
 */
function fixEvening(state: GameState, data: GameData) {
  if (state.evening.guest || state.act1 || !eveningOpen(state.clock.day, data)) return;
  const guests = [...new Set(resolveQuests(state, data).filter(view => view.status === 'active' && view.quest.booked).map(view => view.quest.character))];
  if (guests.length) state.evening.guest = guests.find(guest => guest !== state.evening.last) ?? guests[0];
}
/** A quest that holds a ticket puts its dishes in the recipe book, so a ticket never shows a dish that the player does not know. */
export function revealTickets(state: GameState, data: GameData) {
  for (const view of resolveQuests(state, data)) if (view.status === 'active') for (const { item } of view.quest.requirements) discover(state, item);
}
/**
 * Puts the authored board of an event on the board, in place of the old board. The sources and the prepared dishes of the new board
 * are discovered. The blockers discover nothing.
 */
function startEvent(state: GameState, number: number, data: GameData) {
  const event = data.prologue.events[number - 1];
  state.prologue = { event: number };
  state.board = event.board.map(code => code ? { code } : null);
  state.layoutId = event.layout.id; state.resolvedObstacles = [];
  for (const code of event.board.filter(present)) discover(state, code);
}
/** The start of act 1: the initial board of act 1, the starting gift in the purse, and the first morning. The recipe book keeps the prologue discoveries. */
function startActOne(state: GameState, data: GameData) {
  state.prologue = null;
  state.board = data.board.initial.map(code => code ? { code } : null);
  state.layoutId = data.board.defaultLayout; state.resolvedObstacles = [];
  state.coins = data.prologue.gift; state.clock = { day: 1, merges: 0 };
  for (const code of data.board.initial.filter(present)) discover(state, code);
}
/** A new game, at the first event of the prologue with its opening scene earned. The session gives it a random seed, so the rules themselves stay deterministic. */
export function createGame(data: GameData, seed = 0): GameState {
  const state: GameState = {
    version: 16, prologue: null, layoutId: data.board.defaultLayout, resolvedObstacles: [], preparationObstacles: { start: 0, placed: [] },
    pendingScenes: [data.prologue.events[0].opening.id], board: [], coins: 0, taskIndex: 0, discovered: [],
    decorations: [], decorationChoices: {}, completedQuests: [],
    clock: { day: 1, merges: 0 }, seed, ratHoles: [], gifts: 0, evening: { guest: null, last: null, delivered: false }, night: null, act1: null, march: [],
  };
  startEvent(state, 1, data);
  revealTickets(state, data);
  return state;
}
/**
 * The start of act 1 after a prologue that served each quest and discovered only its boards and its quest dishes. The data check uses
 * it to confirm that the initial board of act 1 makes a valid game.
 */
export function actOneGame(data: GameData, seed = 0): GameState {
  const state = createGame(data, seed);
  for (const event of data.prologue.events) for (const code of [...event.board.filter(present), ...event.quests.flatMap(quest => quest.requirements.map(({ item }) => item))]) discover(state, code);
  state.completedQuests = prologueQuests(data).map(quest => quest.id);
  state.pendingScenes = [];
  startActOne(state, data);
  revealTickets(state, data);
  return state;
}
/**
 * Delivered quests are known, unique, campaign quests of act 1 or the supper, opened in delivery order on or after their dates, and
 * every completed preparation had its quests. The opened March quests are unique March quests whose prerequisites are met, and no
 * March quest waits to be recorded.
 */
function validateQuestProgress(state: GameState, data: GameData): boolean {
  const served = prologueQuests(data).length, complete = state.completedQuests.slice(served), march = state.march;
  if (!Array.isArray(complete) || complete.length > data.quests.length || new Set(state.completedQuests).size !== state.completedQuests.length
    || !servedInOrder(state.completedQuests, data.prologue.events.length, data)) return false;
  if (!Array.isArray(march) || new Set(march).size !== march.length
    || !march.every(id => data.quests.some(quest => quest.id === id && quest.march && prerequisitesMet(state, quest, data)))
    || data.quests.some(quest => marchOpens(state, quest, data))) return false;
  const done = new Set<string>();
  for (const id of complete) {
    const quest = data.quests.find(quest => quest.id === id);
    if (!quest || quest.recovery || quest.repeating || quest.act || (quest.march && !march.includes(id))
      || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask))
      || (quest.opens !== undefined && state.clock.day < quest.opens) || state.clock.day < (questHoliday(quest, data)?.day ?? 0)
      || !questPredecessors(quest, data).every(previous => done.has(previous))) return false;
    done.add(id);
  }
  return !state.taskIndex || requiredQuests(state.taskIndex - 1, data).every(quest => done.has(quest.id));
}
/** The served event quests start with each quest of the events before until, in event order. The quests of one event can be in any order. */
function servedInOrder(complete: readonly string[], until: number, data: GameData): boolean {
  let at = 0;
  for (const event of data.prologue.events.slice(0, until)) {
    const part = complete.slice(at, at += event.quests.length);
    if (!event.quests.every(quest => part.includes(quest.id))) return false;
  }
  return true;
}
/**
 * The fields of a prologue save. The quests of the earlier events are served, then some quests of the current event, so the current
 * event is the first with a quest to serve, or the last. The pending scenes are the last part of the earned scenes in story order, and
 * the end of the last event leaves its closing scene pending. The board holds each source of the event once and only dishes of the
 * event board. The recipe book holds the sources and the prepared dishes of the events so far, and only dishes of their boards. The
 * purse, the clock, the preparations, and the night stay as a new game has them.
 */
function validPrologue(state: GameState, data: GameData): boolean {
  const progress = state.prologue, events = data.prologue.events;
  if (!record(progress, ['event']) || !integer(progress.event, 1, events.length)) return false;
  const number = progress.event, event = events[number - 1], complete = state.completedQuests, before = events.slice(0, number - 1).flatMap(value => value.quests).length;
  if (!Array.isArray(complete) || new Set(complete).size !== complete.length || !servedInOrder(complete, number - 1, data)
    || !complete.slice(before).every(id => event.quests.some(quest => quest.id === id)) || (number < events.length && eventComplete(state, event))) return false;
  const earned = earnedPrologue(state, data), pending = state.pendingScenes;
  if (!Array.isArray(pending) || pending.length > earned.length || !pending.every((id, at) => id === earned[earned.length - pending.length + at])
    || (eventComplete(state, event) && !pending.length)) return false;
  if (state.coins !== 0 || state.taskIndex !== 0 || state.clock.day !== 1 || state.clock.merges !== 0 || state.night !== null || state.act1 !== null || state.gifts !== 0
    || !Array.isArray(state.ratHoles) || state.ratHoles.length || !Array.isArray(state.march) || state.march.length
    || (state.repeating !== undefined && (!record(state.repeating, ['last', 'open']) || state.repeating.last !== null || state.repeating.open !== null))
    || !record(state.evening, ['guest', 'last', 'delivered']) || state.evening.guest !== null || state.evening.last !== null || state.evening.delivered !== false
    || state.layoutId !== event.layout.id) return false;
  const sources = event.board.filter(code => !!code && data.items[code].generator), dishes = eventDishes(event, data);
  if (!state.board.every(cell => cell === null || (record(cell, ['code']) && (sources.includes(cell.code as string) || dishes.has(cell.code as string))))
    || !sources.every(code => state.board.filter(cell => cell?.code === code).length === 1)) return false;
  const reached = events.slice(0, number), known = new Set(reached.flatMap(value => [...value.board.filter(present), ...eventDishes(value, data)]));
  return Array.isArray(state.discovered) && state.discovered.every(code => known.has(code))
    && reached.every(value => value.board.filter(present).every(code => state.discovered.includes(code)));
}
const record = (value: unknown, keys: string[]): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const placed = (value: unknown, size: number): value is Placed => record(value, ['item', 'position']) && typeof value.item === 'string' && integer(value.position, 0, size - 1);
/**
 * The day fields of a save: the clock, the seed, the rat holes, the gifts, the evening, the night report, and the act 1 result.
 * The calendar never passes the supper day, and that day comes only after the last preparation.
 * The board and blocker checks that follow also cover the cells of the rat holes.
 */
function validDay(state: GameState, data: GameData): boolean {
  const size = state.board.length, levers = data.day, clock = state.clock, supper = data.calendar.supper;
  if (!record(clock, ['day', 'merges']) || !integer(clock.day, 1, supper) || !integer(clock.merges, 0, dayMerges(clock.day, data) - 1)
    || (clock.day === supper && state.taskIndex < data.tasks.length) || !integer(state.seed, 0, 2 ** 32 - 1) || !integer(state.gifts)) return false;
  if (state.taskIndex > 0 && clock.day < data.chapters[data.tasks[state.taskIndex - 1].chapter - 1].opens) return false;
  if (!Array.isArray(state.ratHoles) || state.ratHoles.length > levers.ratHoles
    || !state.ratHoles.every(hole => placed(hole, size) && looseRaw(hole.item, data) && state.discovered?.includes(hole.item))) return false;
  const booked = new Set(data.quests.filter(quest => quest.booked).map(quest => quest.character)), guest = (value: unknown) => value === null || booked.has(value as string);
  const evening = state.evening;
  if (!record(evening, ['guest', 'last', 'delivered']) || !guest(evening.guest) || !guest(evening.last) || typeof evening.delivered !== 'boolean'
    || (evening.delivered && evening.guest === null) || (evening.guest !== null && !eveningOpen(clock.day, data))) return false;
  const night = state.night;
  if (night !== null) {
    if (!record(night, ['day', 'upkeep', 'rat', 'taken', 'trapped', 'gift', 'departed', 'purse', 'seen']) || night.day !== clock.day - 1 || !integer(night.upkeep)
      || !integer(night.purse, -1_000_000_000) || typeof night.seen !== 'boolean' || !Array.isArray(night.taken) || !Array.isArray(night.departed)
      || new Set(night.departed).size !== night.departed.length || !night.departed.every(chain => typeof chain === 'string' && chainSeason(chain, data))
      || (night.rat === null) === isSunday(night.day, data)) return false;
    const raw = (value: unknown) => placed(value, size) && looseRaw(value.item, data);
    if (night.rat === null) {
      if (night.taken.length || night.trapped !== null || night.gift !== null || !night.seen) return false;
    } else if (night.rat === 'thief') {
      const count = night.taken.length + (night.trapped ? 1 : 0);
      if (!night.taken.every(raw) || (night.trapped !== null && !raw(night.trapped)) || night.gift !== null || count < 1 || count > levers.ratTake) return false;
    } else if (night.rat === 'soricescu') {
      const gift = night.gift;
      if (night.taken.length || night.trapped !== null || (gift !== null && (!record(gift, ['item', 'position', 'first']) || !placed({ item: gift.item, position: gift.position }, size)
        || typeof gift.first !== 'boolean' || getItem(gift.item, data)?.stage !== levers.giftStage))) return false;
    } else return false;
  } else if (clock.day > 1) return false;
  // The supper records the result of act 1 once, on its day at or after the booking time.
  const act1 = state.act1;
  if (act1 === null ? supperComplete(state, data) : !supperComplete(state, data) || !record(act1, ['purse']) || !integer(act1.purse, -1_000_000_000)
    || clock.day !== supper || clockMinutes(state, data) < levers.booking) return false;
  return true;
}
/** A save that waits for the finale before the supper delivery drops the finale, so the delivery earns it. Other saves stay as they are. */
export function repairSave(candidate: unknown, data: GameData): unknown {
  const state = candidate as GameState, id = data.finale.id;
  if (!state || typeof state !== 'object' || !Array.isArray(state.pendingScenes) || !Array.isArray(state.completedQuests)
    || !state.pendingScenes.includes(id) || supperComplete(state, data)) return candidate;
  return { ...state, pendingScenes: state.pendingScenes.filter(scene => scene !== id) };
}
/** Accepts an untrusted save: a parsed save is checked field by field before it is treated as a game state. The data must pass dataProblems. */
export function validateGame(candidate: unknown, data: GameData): candidate is GameState {
  try {
    const state = candidate as GameState;
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== 16) return false;
    if (!Array.isArray(state.board) || state.board.length !== data.board.columns * data.board.rows) return false;
    if (!integer(state.coins, -1_000_000_000)) return false;
    if (!integer(state.taskIndex, 0, data.tasks.length) || !Array.isArray(state.completedQuests)) return false;
    if (!validDay(state, data)) return false;
    const prologue = state.prologue !== null, chains = availableChains(state, data);
    if (prologue ? !validPrologue(state, data) : state.prologue !== null) return false;
    if (!prologue) {
      // Pending scenes are unique and earned, and story scenes keep story order, so an imported save cannot open a later scene.
      const pending = state.pendingScenes, scenes = storyOrder(data), earned = earnedScenes(state, data);
      if (!Array.isArray(pending) || new Set(pending).size !== pending.length || !pending.every(id => earned.includes(id))) return false;
      const ordered = pending.filter(id => scenes.includes(id));
      if (!ordered.every((id, at) => at === 0 || scenes.indexOf(ordered[at - 1]) < scenes.indexOf(id))) return false;
      if (!validateQuestProgress(state, data)) return false;
    }
    const validItem = (cell: Cell | null) => cell && typeof cell === 'object' && !Array.isArray(cell)
      && Object.keys(cell).length === 1 && own(data.items, cell.code) && (prologue || dishOpen(cell.code, chains, data));
    if (!state.board.every(cell => cell === null || validItem(cell))) return false;
    {
      const layout = prologue ? boardLayout(state.layoutId, data) : data.board.layouts.find(layout => layout.id === state.layoutId);
      const progress = state.preparationObstacles;
      if (progress !== undefined) {
        if (!progress || typeof progress !== 'object' || Array.isArray(progress)
          || !integer(progress.start, 0, state.taskIndex) || !Array.isArray(progress.placed)) return false;
        const earned = data.board.preparations.slice(progress.start, state.taskIndex).flatMap(batch => batch.obstacles);
        if (progress.placed.length > earned.length || !progress.placed.every((placement, index) => placement
          && typeof placement === 'object' && !Array.isArray(placement) && placement.id === earned[index].id
          && integer(placement.position, 0, state.board.length - 1))) return false;
      }
      const obstacles = boardObstacles(state, data);
      if (!layout || !Array.isArray(state.resolvedObstacles)
        || new Set(state.resolvedObstacles).size !== state.resolvedObstacles.length
        || !state.resolvedObstacles.every(id => typeof id === 'string' && obstacles.some(obstacle => obstacle.id === id && obstacle.type !== 'rat-hole'))) return false;
      const blocked = obstacles.filter(obstacle => !state.resolvedObstacles.includes(obstacle.id));
      if (new Set(blocked.map(obstacle => obstacle.position)).size !== blocked.length
        || blocked.some(obstacle => state.board[obstacle.position] !== null)
        || (progress?.placed.filter(placement => !state.resolvedObstacles.includes(placement.id)).length ?? 0) > ACTIVE_BLOCKERS) return false;
    }
    // Each open chain has one source on the board. A seasonal source can wait for room in its season, and after its season it stays
    // until the first closing at which no quest needs its chain, so a save holds at most one. The prologue checked its own sources.
    const cells = state.board.filter(present);
    for (const chain of prologue ? [] : chains) {
      const sources = cells.filter(cell => getItem(cell.code, data)?.generator && getItem(cell.code, data)?.chain === chain).length;
      if (chainSeason(chain, data) ? sources > 1 : sources !== 1) return false;
    }
    // In act 1, the recipe book keeps the dishes of the prologue boards, also of chains that act 1 opens later.
    const kept = prologue ? null : new Set(data.prologue.events.flatMap(event => [...event.board.filter(present), ...eventDishes(event, data)]));
    if (!Array.isArray(state.discovered) || state.discovered.length > Object.keys(data.items).length
      || new Set(state.discovered).size !== state.discovered.length
      || !state.discovered.every(code => own(data.items, code) && (!kept || dishOpen(code, chains, data) || kept.has(code)))
      || !cells.every(cell => state.discovered.includes(cell.code))) return false;
    // A blocker does not discover its dish, but clearing one needs a dish that merges with it: a matching dish or a recipe partner.
    if (boardObstacles(state, data).some(obstacle => state.resolvedObstacles.includes(obstacle.id)
      && !mergePartners(obstacle.ingredient, data).some(code => state.discovered.includes(code)))) return false;
    if (!Array.isArray(state.decorations) || state.decorations.length !== state.taskIndex
      || !state.decorations.every((id, index) => id === data.tasks[index].id)) return false;
    const choices = state.decorationChoices;
    if (!choices || typeof choices !== 'object' || Array.isArray(choices)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(choices))) return false;
    for (const [id, value] of Object.entries(choices)) {
      const slot = data.decorationSlots.find(slot => slot.id === id);
      if (!slot || !state.decorations.includes(slot.unlock) || typeof value !== 'string' || value === slot.default
        || !slot.variants.some(variant => variant.id === value) || !decorationUnlocked(state, slot, value, data)) return false;
    }
    // The saved repeating quests are known members of the cycle. A repeating quest that the save has not opened yet shows its dishes after the next action.
    const repeating = state.repeating;
    if (repeating !== undefined && (!record(repeating, ['last', 'open']) || ![repeating.last, repeating.open].every(id => id === null
      || (typeof id === 'string' && data.quests.some(quest => quest.id === id && cycleMember(state, quest, data)))))) return false;
    if (!resolveQuests(state, data).every(view => view.status !== 'active' || (view.quest.repeating && view.quest.id !== repeating?.open)
      || view.quest.requirements.every(({ item }) => state.discovered.includes(item)))) return false;
    return true;
  } catch {
    return false;
  }
}
export function reduceGame(state: GameState, action: Action, data: GameData): Result {
  const fail = (message: string): Result => ({ state, ok: false, message, event: null });
  if (!action || typeof action !== 'object') return fail('Choose an action.');
  const next = copy(state);
  // Keep a ticket that a save without an open record already shows, even if this action gives a booked quest more work.
  if (!next.repeating?.open) {
    const open = resolveQuests(next, data).find(view => view.quest.repeating && view.status !== 'locked')?.quest.id;
    if (open) next.repeating = { last: next.repeating?.last ?? null, open };
  }
  let event: string = action.type;
  let message = '';
  switch (action.type) {
    case 'deliverQuest': {
      const quest = findQuest(action.id, data);
      // A quest with every portion on the board can wait only for its time: an evening, a holiday, the supper day, or fair weather.
      if (!quest || !canDeliverQuest(next, quest, data)) {
        const note = quest && questDeliveryCells(next, quest).every(index => index >= 0) ? ticketNote(next, quest, data) : null;
        return fail(!note ? 'This quest needs every required item on the board. Check that the quest is still on a ticket.'
          : quest!.booked ? 'This table is booked for another time. Deliver when the guest arrives for the evening.'
          : quest!.finale ? `The supper is booked for ${dateText(data.calendar.supper, data, 'plain')} at ${clockText(data.day.booking)}. Serve it then.`
          : quest!.outdoor && !questHoliday(quest!, data) ? 'This quest is served in the courtyard. Deliver it on a fair day from 1 April.'
          : `${note}. Deliver it from that day.`);
      }
      if (!integer(next.coins + quest.reward, -1_000_000_000)) return fail('Spend some coins before you deliver this quest.');
      for (const index of questDeliveryCells(next, quest)) next.board[index] = null;
      next.coins += quest.reward;
      // Each day admits one booked delivery. While 30 April holds, a booked delivery ends its guest's evening, and the next guest
      // comes at once. The supper stops the clock and records the result of act 1.
      if (quest.booked && holdsDay(next, data)) next.evening = { guest: null, last: quest.character, delivered: false };
      else if (quest.booked) next.evening.delivered = true;
      if (quest.finale) next.act1 = { purse: next.coins };
      // The recovery quest and a repeating quest keep no record and have no reply, so they can open again.
      // A repeating delivery moves the cycle to the next quest.
      const number = questEvent(quest, data);
      if (number) {
        // An event quest has no reply. The last delivery of an event earns its closing scene and starts the next event, with its opening scene.
        next.completedQuests.push(quest.id);
        const event = data.prologue.events[number - 1];
        if (eventComplete(next, event)) {
          next.pendingScenes.push(event.closing.id);
          if (number < data.prologue.events.length) {
            next.pendingScenes.push(data.prologue.events[number].opening.id);
            startEvent(next, number + 1, data);
          }
        }
      } else if (quest.repeating) next.repeating = { last: quest.id, open: null };
      else if (!quest.recovery) {
        next.completedQuests.push(quest.id);
        // The supper earns the finale in place of a reply.
        next.pendingScenes.push(quest.finale ? data.finale.id : quest.id);
        // A follow-up scene waits for a count of later deliveries; it is earned by the delivery that reaches the count.
        for (const earlier of data.quests) if (earlier.followUp && deliveriesSince(next, earlier.id) === earlier.followUp.afterDeliveries) next.pendingScenes.push(earlier.followUp.id);
      }
      message = quest.finale || number ? `${quest.title}: served.` : `${quest.title}: delivered. Earned ${quest.reward} ${quest.reward === 1 ? 'coin' : 'coins'}.`;
      break;
    }
    case 'lantern': {
      // The lanterns bring the booked guest at once, so the player never cooks spare food to pass the time.
      const quest = data.quests.find(quest => quest.id === action.id);
      if (!quest || !canLightLanterns(next, quest, data)) return fail('Light the lanterns for tonight’s booked guest before the booking time, with every dish on the board.');
      next.clock.merges = (data.day.booking - data.day.opening) / data.day.mergeMinutes;
      message = quest.finale ? 'The lanterns are lit. The guests arrive for the supper.' : `The lanterns are lit. ${data.characters.find(person => person.id === quest.character)!.name} arrives for the evening.`;
      break;
    }
    case 'seeNight': {
      if (!next.night || next.night.seen) return fail('No night report waits.');
      next.night.seen = true;
      message = 'The night is in the past.';
      break;
    }
    case 'decorate': {
      const slot = data.decorationSlots.find(slot => slot.id === action.slot);
      if (!slot) return fail('Choose a known decoration.');
      if (!next.decorations.includes(slot.unlock)) return fail('Complete the preparation for this decoration first.');
      const variant = slot.variants.find(variant => variant.id === action.variant);
      if (!variant) return fail('Choose a variant of this decoration.');
      if (!decorationUnlocked(next, slot, variant.id, data)) return fail('Deliver the quest that offers this finish first.');
      if (variant.id === slot.default) delete next.decorationChoices[slot.id];
      else next.decorationChoices[slot.id] = variant.id;
      message = `${slot.name}: ${variant.name}.`;
      break;
    }
    case 'readScene': {
      // The completion action ends a waiting scene. A stale or repeated event changes nothing.
      const at = next.pendingScenes.indexOf(action.id), scenes = prologueScenes(data);
      if (at === -1) return fail('This story scene is already in the journal.');
      // The prologue scenes are read in story order, so only the first pending one can end.
      if (scenes.some(scene => scene.id === action.id) && next.pendingScenes.findIndex(id => scenes.some(scene => scene.id === id)) !== at) return fail('Read the earlier story scene first.');
      next.pendingScenes.splice(at, 1);
      // The last scene of the prologue starts act 1.
      if (action.id === scenes.at(-1)!.id) {
        startActOne(next, data);
        message = 'Mara arrives at the bistro. Act 1 begins.';
        break;
      }
      // A guest who visits once has no journal replay after the visit.
      const guest = data.characters.find(person => person.id === data.quests.find(quest => quest.id === action.id)?.character);
      message = guest?.singleVisit ? 'The scene is finished.' : 'The scene is in the story journal.';
      break;
    }
    case 'move': {
      const source = itemAt(next, action.from);
      if (!integer(action.from, 0, next.board.length - 1) || !integer(action.to, 0, next.board.length - 1)
        || action.from === action.to || !source) return fail('Choose an item and a different space.');
      const obstacle = unresolvedObstacle(next, action.to, data);
      const target = next.board[action.to];
      const item = getItem(source.code, data)!;
      // Any legal merge into a blocked item clears its blocker: a matching dish of the chain, or a recipe partner.
      const result = obstacle ? mergeResult(source.code, obstacle.ingredient, data) : target ? mergeResult(source.code, target.code, data) : null;
      if (obstacle && !result) return fail('Merge a matching dish or a recipe partner into this blocked space.');
      if (!result && target?.code === source.code && !item.generator) return fail(`${item.name} is a final dish. Deliver it to a neighbour${mergePartners(source.code, data).length ? ', or cook it with a recipe partner' : ''}.`);
      if (result) {
        next.board[action.to] = { code: result };
        next.board[action.from] = null;
        const name = getItem(result, data)!.name;
        message = made(next, result, name, `Made ${name}.`);
        if (obstacle) {
          // A cleared blocker of the prologue gives no coin.
          const coin = next.prologue ? 0 : data.economy.blockerCoin;
          if (!integer(next.coins + coin, -1_000_000_000)) return fail('Spend some coins before you clear this blocker.');
          if (obstacle.type === 'rat-hole') next.ratHoles = next.ratHoles.filter(hole => hole.position !== action.to);
          else next.resolvedObstacles.push(obstacle.id);
          next.coins += coin;
          message += coin ? ` The blocker is cleared: +${coin} ${coin === 1 ? 'coin' : 'coins'}.` : ' The blocker is cleared.';
        }
        event = 'merge';
      } else {
        next.board[action.to] = source;
        next.board[action.from] = target;
        message = target ? 'Items swapped.' : 'Item moved.';
      }
      break;
    }
    case 'spawn': {
      const cell = itemAt(next, action.index);
      const item = cell && getItem(cell.code, data);
      if (!item?.generator) return fail('Choose an ingredient source.');
      const code = item.generator.outputs[0];
      const empty = firstFreeBoardCell(next, data);
      if (empty === -1) return fail(BOARD_FULL);
      // A take from a paid source spends its coins. A purse that cannot pay takes nothing. Each take of the prologue is free.
      const cost = next.prologue ? 0 : takeCost(item, data);
      if (cost && next.coins < cost) return fail(`The ${item.name} costs ${cost} ${cost === 1 ? 'coin' : 'coins'} for each take, and the purse cannot pay. Deliver a quest, or take free herbs from the Herb basket.`);
      next.coins -= cost;
      next.board[empty] = { code };
      const name = getItem(code, data)!.name;
      message = made(next, code, name, cost ? `Took ${name} for ${cost} ${cost === 1 ? 'coin' : 'coins'}.` : `Took ${name}.`);
      break;
    }
    case 'task': {
      if (next.prologue) return fail('The preparations of the bistro start in act 1.');
      const eligibility = taskEligibility(next, data);
      const task = eligibility.task;
      if (!eligibility.ready || !task) return fail(eligibility.blockers.join(' '));
      next.preparationObstacles ??= { start: next.taskIndex, placed: [] };
      message = `${task.title}: done.`;
      if (task.unlock) {
        const code = `generator_${task.unlock}`;
        const source = data.items[code].name;
        const empty = firstFreeBoardCell(next, data);
        if (empty !== -1) { next.board[empty] = { code }; message += ` The ${source} is on the board.`; }
        discover(next, code);
      }
      next.coins -= task.cost;
      next.taskIndex++;
      next.decorations.push(task.id);
      // The payment queues the preparation scene, then the closing scene of a completed chapter, in the same change.
      next.pendingScenes.push(task.id);
      if (resolveChapters(next, data)[task.chapter - 1].status === 'complete') next.pendingScenes.push(data.chapters[task.chapter - 1].id);
      // The preparation that brings a regular queues their arrival after the story scenes that it earned.
      for (const person of data.characters) if (person.arrival && person.arrivesAfter === task.id) next.pendingScenes.push(arrivalScene(person));
      break;
    }
    default: return fail('This action is not available.');
  }
  // The prologue has no seasonal sources, no preparation blockers, and no clock.
  if (state.prologue) {
    revealTickets(next, data);
    return { state: next, ok: true, message, event };
  }
  if (['task', 'move', 'spawn', 'deliverQuest'].includes(action.type)) {
    for (const source of placeSeasonalSources(next, data)) message += ` The ${source} is on the board.`;
    const placed = placePreparationObstacles(next, data);
    if (action.type === 'task') message += ` ${data.board.preparations[next.taskIndex - 1].context}`;
    if (placed) message += ` ${placed} preparation ${placed === 1 ? 'blocker' : 'blockers'} placed.`;
    const pending = pendingPreparationObstacles(next, data).length;
    if (action.type === 'task' && pending) message += ` ${pending} ${pending === 1 ? 'blocker waits' : 'blockers wait'} for safe space.`;
  }
  // Each merge is kitchen work and moves the clock, until the supper stops it. The merge that reaches the closing time closes the day,
  // except on a day that holds: its clock stays one merge before the closing. On 30 April, the last payment ends the hold and closes the day.
  const last = dayMerges(next.clock.day, data) - 1, held = holding(state, data);
  if (event === 'merge' && !next.act1 && holdsDay(next, data) && next.clock.merges + 1 >= last) {
    next.clock.merges = last;
    message += next.clock.day === data.calendar.supper ? ' The village waits for the supper.' : ' Walpurgis Night lasts until the bistro is ready.';
  } else if ((event === 'merge' && !next.act1 && ++next.clock.merges > last) || (action.type === 'task' && held && !holdsDay(next, data))) {
    close(next, data);
    if (!integer(next.coins, -1_000_000_000) || !integer(next.clock.day, 1) || !integer(next.gifts)) return fail('This closing exceeds a supported save limit. The merge was not applied.');
    message += ' The bistro closes for the night.';
  }
  recordMarch(next, data);
  fixEvening(next, data);
  // A repeating quest that opens in this change is saved, so it stays open until its delivery.
  const repeating = resolveQuests(next, data).find(view => view.quest.repeating && view.status !== 'locked')?.quest.id ?? null;
  if (repeating !== (next.repeating?.open ?? null)) next.repeating = { last: next.repeating?.last ?? null, open: repeating };
  revealTickets(next, data);
  return { state: next, ok: true, message, event };
}
