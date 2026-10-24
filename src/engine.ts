// The deterministic rules of the bistro game: the new game, the actions, and the acceptance of an untrusted save.
import { actOf, arrivalScene, availableChains, boardLayout, boardObstacles, canDeliverQuest, canLightLanterns, chainSeason, clockMinutes, clockText, currentEvent, cycleMember, dateText, decorationUnlocked, deliveriesSince, dayMerges, dishOpen, earnedObstacles, earnedPrologue, earnedScenes, eventComplete, eventDishes, eveningOpen, finaleQuest, findQuest, firstFreeBoardCell, fixedBooking, freeBoardCells, gardenStage, getItem, holdOf, holding, holdsDay, integer, isSunday, levers, looseRaw, looseRawCells, marchOpens, mergePartners, mergeResult, own, pendingPreparationObstacles, playable, prerequisitesMet, present, prologueQuests, prologueScenes, questDeliveryCells, questEvent, questFinale, questHoliday, questPredecessors, questReward, released, salePrice, requiredQuests, resolveChapters, resolveQuests, seasonPaid, sourceNeeded, storyOrder, supperComplete, takeCost, taskEligibility, ticketNote, unresolvedObstacle } from './model.ts';
import type { Action, Cell, GameData, GameState, NightReport, Placed, PrologueEvent, Result } from './model.ts';

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
/** Adds a source at the end of the source tab and discovers it. */
function addSource(state: GameState, chain: string, data: GameData): string {
  const code = `generator_${chain}`;
  state.sources.push(chain);
  discover(state, code);
  return data.items[code].name;
}
/** Adds each seasonal source that is in season, paid for by the preparation that its season needs, and not in the bistro. */
function placeSeasonalSources(state: GameState, data: GameData): string[] {
  const placed: string[] = [];
  for (const chain of data.chains) {
    const season = chain.season, day = state.clock.day;
    if (!season || day < season.from || day > season.to || !seasonPaid(chain, state.taskIndex, data) || state.sources.includes(chain.id)) continue;
    placed.push(addSource(state, chain.id, data));
  }
  return placed;
}
/** Records each March quest that opens in this change, so that it stays open after March. */
function recordMarch(state: GameState, data: GameData) {
  for (const quest of data.quests) if (marchOpens(state, quest, data)) state.march.push(quest.id);
}
/**
 * The closing, in the change of the merge that reaches the closing time: the upkeep, then the departure of each seasonal source whose
 * season ends, then, on Sunday night only, the thief rat or Șoricescu, then the next day, its seasonal sources, and its weather blockers,
 * then the night report. The piper's tune keeps the thief rat away on its Sunday nights. The evening guest of the new day follows in the
 * same change. A fixed evening does not count as the last evening of the booked guests.
 */
function close(state: GameState, data: GameData) {
  const day = state.clock.day, dayLevers = levers(day, data);
  state.coins -= dayLevers.upkeep;
  const departed = data.chains.filter(chain => chain.season && day >= chain.season.to && state.sources.includes(chain.id) && !sourceNeeded(state, chain.id, data)).map(chain => chain.id);
  state.sources = state.sources.filter(chain => !departed.includes(chain));
  const loose = looseRawCells(state, data), piper = isSunday(day, data) && state.piper > 0;
  if (piper) state.piper--;
  let report: Omit<NightReport, 'purse' | 'seen'>;
  if (!isSunday(day, data)) report = { day, upkeep: dayLevers.upkeep, rat: null, taken: [], trapped: null, gift: null, departed, piper: false };
  else if (loose.length && piper) report = { day, upkeep: dayLevers.upkeep, rat: null, taken: [], trapped: null, gift: null, departed, piper: true };
  else if (loose.length) {
    const picks: number[] = [];
    while (picks.length < dayLevers.ratTake && loose.length) {
      const draw = random(state.seed);
      state.seed = draw.seed;
      picks.push(loose.splice(draw.value % loose.length, 1)[0]);
    }
    const placed = picks.map(position => ({ item: state.board[position]!.code, position }));
    for (const { position } of placed) state.board[position] = null;
    // The first pick drops into a new rat hole, while fewer holes are open than the limit.
    const trapped = state.ratHoles.length < dayLevers.ratHoles ? placed.shift()! : null;
    if (trapped) state.ratHoles.push(trapped);
    report = { day, upkeep: dayLevers.upkeep, rat: 'thief', taken: placed, trapped, gift: null, departed, piper: false };
  } else {
    // A tidy kitchen earns a gift, if it leaves the free cells that the recovery quest needs. The seasonal chains give no gift.
    let gift: NightReport['gift'] = null;
    if (freeBoardCells(state, data) >= dayLevers.giftSpace) {
      const chains = availableChains(state, data), open = data.chains.filter(chain => chains.includes(chain.id) && !chain.season);
      const item = `${open[state.gifts % open.length].id}_${dayLevers.giftStage}`, position = bottomLeftFreeCell(state, data);
      state.board[position] = { code: item };
      gift = { item, position, first: !state.discovered.includes(item) };
      discover(state, item);
      state.gifts++;
    }
    report = { day, upkeep: dayLevers.upkeep, rat: 'soricescu', taken: [], trapped: null, gift, departed, piper: false };
  }
  const fixed = fixedBooking(day, data)?.character === state.evening.guest;
  state.clock = { day: day + 1, merges: 0 };
  state.evening = { guest: null, last: fixed ? state.evening.last : state.evening.guest ?? state.evening.last, delivered: false };
  // A Sunday night of the piper has a morning dialog, like a night with a rat.
  state.night = { ...report, purse: state.coins, seen: report.rat === null && !report.piper };
  placeSeasonalSources(state, data);
  // The hail joins the queue of the blockers at the opening time of its day, after the batches that wait.
  const progress = state.preparationObstacles;
  if (progress && state.clock.day === data.board.hail.day && progress.hail === undefined) {
    progress.hail = data.tasks.slice(progress.start, state.taskIndex).filter(task => data.board.preparations.some(batch => batch.after === task.id)).length;
    placePreparationObstacles(state, data);
  }
}
/**
 * Fixes the evening guest when no guest has this evening, the day has an evening, and a booked quest has a ticket. A fixed booking
 * owns its evening: its guest comes when its ticket is on the counter, and no other booked guest gets that evening. On another evening,
 * the guest is the only booked guest, or the guest who did not have the last evening, or the first in authored order. The guest then
 * keeps the evening until the next closing.
 */
function fixEvening(state: GameState, data: GameData) {
  const day = state.clock.day;
  if (state.evening.guest || state.act2 || !eveningOpen(day, data)) return;
  const booked = resolveQuests(state, data).filter(view => view.status === 'active' && view.quest.booked).map(view => view.quest), fixed = fixedBooking(day, data);
  if (fixed) { if (booked.includes(fixed)) state.evening.guest = fixed.character; return; }
  const guests = [...new Set(booked.filter(quest => quest.evening === undefined).map(quest => quest.character))];
  if (guests.length) state.evening.guest = guests.find(guest => guest !== state.evening.last) ?? guests[0];
}
/** A quest that holds a ticket puts its dishes in the recipe book, so a ticket never shows a dish that the player does not know. */
export function revealTickets(state: GameState, data: GameData) {
  for (const view of resolveQuests(state, data)) if (view.status === 'active') for (const { item } of view.quest.requirements) discover(state, item);
}
/**
 * Puts the authored sources and board of an event in place of the old ones. The sources and the prepared dishes of the event are
 * discovered. The blockers discover nothing.
 */
function startEvent(state: GameState, number: number, data: GameData) {
  const event = data.prologue.events[number - 1];
  state.prologue = { event: number };
  state.board = event.board.map(code => code ? { code } : null);
  state.layoutId = event.layout.id; state.resolvedObstacles = []; state.sources = [];
  for (const chain of event.sources) addSource(state, chain, data);
  for (const code of event.board.filter(present)) discover(state, code);
}
/**
 * The end of the prologue and the start of act 1. Each event quest is served. Each event discovers its sources, the ingredients that they
 * give, its prepared dishes, and its quest dishes with every dish on their way, so a player who skips the prologue knows what a full run
 * makes. No prologue scene is pending, and the journal keeps each one for replay. Act 1 starts with its sources and its initial board, the
 * starting gift in the purse, and the first morning. The recipe book keeps the prologue discoveries. The completion of the last scene and
 * the skip of the prologue both end the prologue here.
 */
function finishPrologue(state: GameState, data: GameData) {
  for (const event of data.prologue.events) for (const code of [...eventItems(event), ...event.sources.map(chain => `${chain}_1`), ...event.quests.flatMap(quest => quest.requirements.flatMap(({ item }) => onTheWay(item, data)))]) discover(state, code);
  state.completedQuests.push(...prologueQuests(data).map(quest => quest.id).filter(id => !state.completedQuests.includes(id)));
  state.pendingScenes = [];
  state.prologue = null;
  state.board = data.board.initial.map(code => code ? { code } : null);
  state.layoutId = data.board.defaultLayout; state.resolvedObstacles = []; state.sources = [];
  state.coins = data.prologue.gift; state.clock = { day: 1, merges: 0 };
  for (const chain of data.board.sources) addSource(state, chain, data);
  for (const code of data.board.initial.filter(present)) discover(state, code);
}
/** A dish and the dishes that make it: the lower stages of its chain, and the parts of its recipe with their own ways. */
function onTheWay(code: string, data: GameData): string[] {
  const item = getItem(code, data)!;
  return [code, ...(item.recipe ? item.recipe.flatMap(part => onTheWay(part, data)) : item.stage > 1 ? onTheWay(`${item.chain}_${item.stage - 1}`, data) : [])];
}
/** The line of the start of act 1. */
const ACT_ONE = 'Mara arrives at the bistro. Act 1 begins.';
/** The items that an event discovers: its sources and its prepared dishes. */
const eventItems = (event: PrologueEvent) => [...event.sources.map(chain => `generator_${chain}`), ...event.board.filter(present)];
/** A new game, at the first event of the prologue with its opening scene earned. The session gives it a random seed, so the rules themselves stay deterministic. */
export function createGame(data: GameData, seed = 0): GameState {
  const state: GameState = {
    version: 19, prologue: null, layoutId: data.board.defaultLayout, resolvedObstacles: [], preparationObstacles: { start: 0, placed: [] },
    pendingScenes: [data.prologue.events[0].opening.id], board: [], sources: [], coins: 0, taskIndex: 0, discovered: [],
    decorations: [], decorationChoices: {}, completedQuests: [],
    clock: { day: 1, merges: 0 }, seed, ratHoles: [], gifts: 0, evening: { guest: null, last: null, delivered: false }, night: null, act1: null, act2: null, piper: 0, march: [],
  };
  startEvent(state, 1, data);
  revealTickets(state, data);
  return state;
}
/**
 * The start of act 1 after a prologue with each quest served and every event's sources, ingredients, prepared dishes, quest dishes,
 * and prerequisite dishes discovered. The data check uses it to confirm that the initial board of act 1 makes a valid game.
 */
export function actOneGame(data: GameData, seed = 0): GameState {
  const state = createGame(data, seed);
  finishPrologue(state, data);
  revealTickets(state, data);
  return state;
}
/**
 * Delivered quests are known, unique campaign quests or finale quests of an act that the saved day has reached, opened in delivery
 * order on or after their dates, and every completed preparation had its quests. The opened March quests are unique March quests whose
 * prerequisites are met, and no March quest waits to be recorded.
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
    if (!quest || quest.recovery || quest.repeating || !playable(quest, data) || (quest.act ?? 1) > actOf(state.clock.day, data) || (quest.march && !march.includes(id))
      || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask))
      || (quest.opens !== undefined && state.clock.day < quest.opens) || state.clock.day < (questHoliday(quest, data)?.day ?? 0)
      || (quest.evening !== undefined && (state.clock.day < quest.evening
        || (state.clock.day === quest.evening && clockMinutes(state, data) < levers(quest.evening, data).booking)))
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
 * the end of the last event leaves its closing scene pending. The source tab holds each source of the event once, and the board holds
 * only dishes of the event board. The recipe book holds the sources and the prepared dishes of the events so far, and only dishes of
 * their boards. The purse, the clock, the preparations, and the night stay as a new game has them.
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
  if (state.coins !== 0 || state.taskIndex !== 0 || state.clock.day !== 1 || state.clock.merges !== 0 || state.night !== null || state.act1 !== null || state.act2 !== null || state.piper !== 0 || state.gifts !== 0
    || !Array.isArray(state.ratHoles) || state.ratHoles.length || !Array.isArray(state.march) || state.march.length
    || (state.repeating !== undefined && (!record(state.repeating, ['last', 'open']) || state.repeating.last !== null || state.repeating.open !== null))
    || !record(state.evening, ['guest', 'last', 'delivered']) || state.evening.guest !== null || state.evening.last !== null || state.evening.delivered !== false
    || state.layoutId !== event.layout.id) return false;
  const dishes = eventDishes(event, data);
  if (!state.board.every(cell => cell === null || (record(cell, ['code']) && dishes.has(cell.code as string)))
    || state.sources.length !== event.sources.length || !event.sources.every(chain => state.sources.includes(chain))) return false;
  const reached = events.slice(0, number), known = new Set(reached.flatMap(value => [...eventItems(value), ...eventDishes(value, data)]));
  return Array.isArray(state.discovered) && state.discovered.every(code => known.has(code))
    && reached.every(value => eventItems(value).every(code => state.discovered.includes(code)));
}
const record = (value: unknown, keys: string[]): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const placed = (value: unknown, size: number): value is Placed => record(value, ['item', 'position']) && typeof value.item === 'string' && integer(value.position, 0, size - 1);
/** The piper's tune keeps the thief rat away for this many Sunday nights. */
export const PIPER_NIGHTS = 4;
/**
 * The day fields of a save: the clock, the seed, the rat holes, the gifts, the evening, the night report, the piper, and the results of
 * the acts. The calendar never passes its last day, and a day after a day that holds comes only after its release. A served finale
 * requires its day at or after the booking time, or a later day.
 * The board and blocker checks that follow also cover the cells of the rat holes.
 */
function validDay(state: GameState, data: GameData): boolean {
  const size = state.board.length, clock = state.clock;
  if (!record(clock, ['day', 'merges']) || !integer(clock.day, 1, data.calendar.end) || !integer(clock.merges, 0, dayMerges(clock.day, data) - 1)
    || !Array.isArray(state.decorations) || !Array.isArray(state.completedQuests) || data.calendar.holds.some(hold => clock.day > hold.day && !released(state, hold))
    || !integer(state.seed, 0, 2 ** 32 - 1) || !integer(state.gifts)) return false;
  const dayLevers = levers(clock.day, data), paid = data.tasks[state.taskIndex - 1];
  if (paid && clock.day < Math.max(data.chapters[paid.chapter - 1].opens, paid.opens ?? 1)) return false;
  if (!Array.isArray(state.ratHoles) || state.ratHoles.length > dayLevers.ratHoles
    || !state.ratHoles.every(hole => placed(hole, size) && looseRaw(hole.item, data) && state.discovered?.includes(hole.item))) return false;
  // A fixed booking owns its evening, and the booked guests take turns on the other evenings.
  const booked = data.quests.filter(quest => quest.booked), turns = new Set(booked.filter(quest => quest.evening === undefined).map(quest => quest.character)), fixed = fixedBooking(clock.day, data);
  const evening = state.evening;
  if (!record(evening, ['guest', 'last', 'delivered']) || (evening.guest !== null && (fixed ? evening.guest !== fixed.character : !turns.has(evening.guest as string)))
    || (evening.last !== null && !turns.has(evening.last as string)) || typeof evening.delivered !== 'boolean'
    || (evening.delivered && evening.guest === null) || (evening.guest !== null && !eveningOpen(clock.day, data))) return false;
  const night = state.night;
  if (night !== null) {
    if (!record(night, ['day', 'upkeep', 'rat', 'taken', 'trapped', 'gift', 'departed', 'purse', 'seen', 'piper']) || night.day !== clock.day - 1 || !integer(night.upkeep)
      || !integer(night.purse, -1_000_000_000) || typeof night.seen !== 'boolean' || typeof night.piper !== 'boolean' || !Array.isArray(night.taken) || !Array.isArray(night.departed)
      || new Set(night.departed).size !== night.departed.length || !night.departed.every(chain => typeof chain === 'string' && chainSeason(chain, data))
      || (night.rat === null) !== (!isSunday(night.day, data) || night.piper) || (night.piper && !isSunday(night.day, data))) return false;
    const raw = (value: unknown) => placed(value, size) && looseRaw(value.item, data), nightLevers = levers(night.day, data);
    if (night.rat === null) {
      if (night.taken.length || night.trapped !== null || night.gift !== null || (!night.piper && !night.seen)) return false;
    } else if (night.rat === 'thief') {
      const count = night.taken.length + (night.trapped ? 1 : 0);
      if (!night.taken.every(raw) || (night.trapped !== null && !raw(night.trapped)) || night.gift !== null || count < 1 || count > nightLevers.ratTake) return false;
    } else if (night.rat === 'soricescu') {
      const gift = night.gift;
      if (night.taken.length || night.trapped !== null || (gift !== null && (!record(gift, ['item', 'position', 'first']) || !placed({ item: gift.item, position: gift.position }, size)
        || typeof gift.first !== 'boolean' || getItem(gift.item, data)?.stage !== nightLevers.giftStage))) return false;
    } else return false;
  } else if (clock.day > 1) return false;
  // Each finale is served on its day at or after the booking time. The supper records the result of act 1, and the purchase that of act 2.
  if (data.finales.some(finale => state.completedQuests.includes(finaleQuest(finale, data)?.id ?? '')
    && (clock.day < finale.day || (clock.day === finale.day && clockMinutes(state, data) < levers(finale.day, data).booking)))) return false;
  const result = (value: unknown, earned: boolean) => value === null ? !earned : earned && record(value, ['purse']) && integer(value.purse, -1_000_000_000);
  const purchase = data.tasks.find(task => task.purchase);
  if (!result(state.act1, supperComplete(state, data)) || !result(state.act2, !!purchase && state.decorations.includes(purchase.id))) return false;
  const piper = data.quests.find(quest => quest.piper);
  return integer(state.piper, 0, PIPER_NIGHTS) && (!state.piper || (!!piper && state.completedQuests.includes(piper.id)));
}
/** Accepts an untrusted save: a parsed save is checked field by field before it is treated as a game state. The data must pass dataProblems. */
export function validateGame(candidate: unknown, data: GameData): candidate is GameState {
  try {
    const state = candidate as GameState;
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== 19) return false;
    if (!Array.isArray(state.board) || state.board.length !== data.board.columns * data.board.rows) return false;
    if (!Array.isArray(state.sources) || new Set(state.sources).size !== state.sources.length
      || !state.sources.every(chain => typeof chain === 'string' && !!getItem(`generator_${chain}`, data)?.generator)) return false;
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
      && Object.keys(cell).length === 1 && own(data.items, cell.code) && !data.items[cell.code].generator && (prologue || dishOpen(cell.code, chains, data));
    if (!state.board.every(cell => cell === null || validItem(cell))) return false;
    {
      const layout = prologue ? boardLayout(state.layoutId, data) : data.board.layouts.find(layout => layout.id === state.layoutId);
      const progress = state.preparationObstacles;
      if (progress !== undefined) {
        // The hail joins the queue at the opening time of its day, after the batches that the payments before it earned.
        const batches = data.tasks.slice(progress?.start ?? 0, state.taskIndex).filter(task => data.board.preparations.some(batch => batch.after === task.id)).length;
        if (!progress || typeof progress !== 'object' || Array.isArray(progress) || Object.keys(progress).some(key => !['start', 'placed', 'hail'].includes(key))
          || !integer(progress.start, 0, state.taskIndex) || !Array.isArray(progress.placed)
          || (progress.hail === undefined ? state.clock.day >= data.board.hail.day : state.clock.day < data.board.hail.day || !integer(progress.hail, 0, batches))) return false;
        const earned = earnedObstacles(progress, state.taskIndex, data);
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
    // Each open chain has its source in the bistro. After its season, a seasonal source stays until the first closing at which no quest
    // needs its chain. The prologue checked its own sources.
    const cells = state.board.filter(present);
    if (!prologue && (!state.sources.every(chain => chains.includes(chain))
      || !chains.every(chain => state.sources.includes(chain) || (state.clock.day > (chainSeason(chain, data)?.to ?? Infinity) && !sourceNeeded(state, chain, data))))) return false;
    // In act 1, the recipe book keeps the dishes of the prologue boards, also of chains that act 1 opens later.
    const kept = prologue ? null : new Set(data.prologue.events.flatMap(event => [...eventItems(event), ...eventDishes(event, data)]));
    if (!Array.isArray(state.discovered) || state.discovered.length > Object.keys(data.items).length
      || new Set(state.discovered).size !== state.discovered.length
      || !state.discovered.every(code => own(data.items, code) && (!kept || dishOpen(code, chains, data) || kept.has(code)))
      || ![...cells.map(cell => cell.code), ...state.sources.map(chain => `generator_${chain}`)].every(code => state.discovered.includes(code))) return false;
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
    const views = resolveQuests(state, data);
    if (!views.every(view => view.status !== 'active' || (view.quest.repeating && view.quest.id !== repeating?.open)
      || view.quest.requirements.every(({ item }) => state.discovered.includes(item)))) return false;
    // Each quest that stepped back waits for a ticket now.
    const stepped = state.steppedBack;
    if (stepped !== undefined && (!Array.isArray(stepped) || !stepped.length || new Set(stepped).size !== stepped.length
      || !stepped.every(id => views.find(view => view.quest.id === id)?.status === 'waiting'))) return false;
    return true;
  } catch {
    return false;
  }
}
export function reduceGame(state: GameState, action: Action, data: GameData): Result {
  const fail = (message: string): Result => ({ state, ok: false, message, event: null });
  if (!action || typeof action !== 'object') return fail('Choose an action.');
  const next = copy(state);
  if (action.type === 'arrange') {
    // Source order changes no other field, including optional quest records and the evening guest.
    const from = next.sources.indexOf(action.chain);
    if (from === -1 || !integer(action.to, 0, next.sources.length - 1) || action.to === from) return fail('Choose a source and another place in the tab.');
    next.sources.splice(action.to, 0, ...next.sources.splice(from, 1));
    return { state: next, ok: true, message: `${getItem(`generator_${action.chain}`, data)!.name}: place ${action.to + 1} of ${next.sources.length}.`, event: action.type };
  }
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
        const note = quest && questDeliveryCells(next, quest).every(index => index >= 0) ? ticketNote(next, quest, data) : null, finale = quest && questFinale(quest, data);
        return fail(!note ? 'This quest needs every required item on the board. Check that the quest is still on a ticket.'
          : quest!.booked ? 'This table is booked for another time. Deliver when the guest arrives for the evening.'
          : finale ? `The ${finale.id === data.finales[0].id ? 'supper' : 'feast'} is booked for ${dateText(finale.day, data, 'plain')} at ${clockText(levers(finale.day, data).booking)}. Serve it then.`
          : quest!.outdoor && !questHoliday(quest!, data) ? 'This quest is served in the courtyard. Deliver it on a fair day from 1 April.'
          : `${note}. Deliver it from that day.`);
      }
      const reward = questReward(quest, next, data);
      if (!integer(next.coins + reward, -1_000_000_000)) return fail('Spend some coins before you deliver this quest.');
      for (const index of questDeliveryCells(next, quest)) next.board[index] = null;
      next.coins += reward;
      // Each day admits one booked delivery. While a day with bookings holds, a booked delivery ends its guest's evening, and the next
      // guest comes at once. The supper records the result of act 1, and the piper's delivery keeps the thief rat away.
      if (quest.booked && holdsDay(next, data) && holdOf(next.clock.day, data)!.bookings) next.evening = { guest: null, last: quest.character, delivered: false };
      else if (quest.booked) next.evening.delivered = true;
      if (quest.finale === data.finales[0].id) next.act1 = { purse: next.coins };
      if (quest.piper) next.piper = PIPER_NIGHTS;
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
        // A finale quest earns its finale in place of a reply.
        next.pendingScenes.push(quest.finale ?? quest.id);
        // A follow-up scene waits for a count of later deliveries; it is earned by the delivery that reaches the count.
        for (const earlier of data.quests) if (earlier.followUp && deliveriesSince(next, earlier.id) === earlier.followUp.afterDeliveries) next.pendingScenes.push(earlier.followUp.id);
      }
      message = quest.finale || number ? `${quest.title}: served.` : `${quest.title}: delivered. Earned ${reward} ${reward === 1 ? 'coin' : 'coins'}.`;
      break;
    }
    case 'lantern': {
      // The lanterns bring the booked guest at once, so the player never cooks spare food to pass the time.
      const quest = data.quests.find(quest => quest.id === action.id);
      if (!quest || !canLightLanterns(next, quest, data)) return fail('Light the lanterns for tonight’s booked guest before the booking time, with every dish on the board.');
      const dayLevers = levers(next.clock.day, data);
      next.clock.merges = (dayLevers.booking - dayLevers.opening) / dayLevers.mergeMinutes;
      message = quest.finale ? `The lanterns are lit. The guests arrive for the ${quest.finale === data.finales[0].id ? 'supper' : 'feast'}.` : `The lanterns are lit. ${data.characters.find(person => person.id === quest.character)!.name} arrives for the evening.`;
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
        finishPrologue(next, data);
        message = ACT_ONE;
        break;
      }
      // A guest who visits once has no journal replay after the visit.
      const guest = data.characters.find(person => person.id === data.quests.find(quest => quest.id === action.id)?.character);
      message = guest?.singleVisit ? 'The scene is finished.' : 'The scene is in the story journal.';
      break;
    }
    case 'skipPrologue': {
      // The skip ends the prologue as the last scene does, so act 1 starts as after a full run, with the same seed.
      if (!next.prologue) return fail('The prologue is over.');
      finishPrologue(next, data);
      message = ACT_ONE;
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
      if (!result && target?.code === source.code) return fail(`${item.name} is a final dish. Deliver it to a neighbour${mergePartners(source.code, data).length ? ', or cook it with a recipe partner' : ''}.`);
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
      const item = next.sources.includes(action.chain) ? getItem(`generator_${action.chain}`, data) : null;
      if (!item?.generator) return fail('Choose an ingredient source.');
      const code = item.generator.outputs[0];
      const empty = firstFreeBoardCell(next, data);
      if (empty === -1) return fail(BOARD_FULL);
      // A take from a paid source spends its coins. A purse that cannot pay takes nothing. Each take of the prologue is free.
      const cost = next.prologue ? 0 : takeCost(item, data, gardenStage(next.taskIndex, data));
      if (cost && next.coins < cost) return fail(`The ${item.name} costs ${cost} ${cost === 1 ? 'coin' : 'coins'} for each take, and the purse cannot pay. Deliver a quest, or take free herbs from the Herb basket.`);
      next.coins -= cost;
      next.board[empty] = { code };
      const name = getItem(code, data)!.name;
      message = made(next, code, name, cost ? `Took ${name} for ${cost} ${cost === 1 ? 'coin' : 'coins'}.` : `Took ${name}.`);
      break;
    }
    case 'sell': {
      const cell = itemAt(next, action.index);
      const item = cell && getItem(cell.code, data);
      if (!cell || !item || unresolvedObstacle(next, action.index, data)) return fail('Choose a dish to sell.');
      if (next.prologue) return fail('Dishes are sold from act 1.');
      // A sale pays back the takes of the ingredients at the current garden stage, so it makes no profit.
      const price = salePrice(cell.code, data, gardenStage(next.taskIndex, data));
      if (!integer(next.coins + price, -1_000_000_000)) return fail('Spend some coins before you sell this dish.');
      next.board[action.index] = null;
      next.coins += price;
      message = price ? `Sold ${item.name} for ${price} ${price === 1 ? 'coin' : 'coins'}.` : `Sold ${item.name}.`;
      break;
    }
    case 'task': {
      if (next.prologue) return fail('The preparations of the bistro start in act 1.');
      const eligibility = taskEligibility(next, data);
      const task = eligibility.task;
      if (!eligibility.ready || !task) return fail(eligibility.blockers.join(' '));
      next.preparationObstacles ??= { start: next.taskIndex, placed: [], ...(next.clock.day >= data.board.hail.day ? { hail: 0 } : {}) };
      message = task.purchase ? `${task.title}: paid.` : `${task.title}: done.`;
      if (task.unlock) message += ` The ${addSource(next, task.unlock, data)} is ready.`;
      next.coins -= task.cost;
      next.taskIndex++;
      next.decorations.push(task.id);
      // The payment queues the preparation scene, then the closing scene of a completed chapter, in the same change.
      next.pendingScenes.push(task.id);
      if (!task.purchase && resolveChapters(next, data)[task.chapter - 1].status === 'complete') next.pendingScenes.push(data.chapters[task.chapter - 1].id);
      // The preparation that brings a regular queues their arrival after the story scenes that it earned.
      for (const person of data.characters) if (person.arrival && person.arrivesAfter === task.id) next.pendingScenes.push(arrivalScene(person));
      // The purchase records the result of act 2.
      if (task.purchase) next.act2 = { purse: next.coins };
      break;
    }
    default: return fail('This action is not available.');
  }
  // The prologue has no seasonal sources, no preparation blockers, and no clock.
  if (state.prologue) {
    revealTickets(next, data);
    stepBack(state, next, data);
    return { state: next, ok: true, message, event };
  }
  if (['task', 'move', 'spawn', 'sell', 'deliverQuest'].includes(action.type)) {
    for (const source of placeSeasonalSources(next, data)) message += ` The ${source} is ready.`;
    const placed = placePreparationObstacles(next, data), batch = data.board.preparations.find(value => value.after === data.tasks[next.taskIndex - 1]?.id);
    if (action.type === 'task' && batch) message += ` ${batch.context}`;
    if (placed) message += ` ${placed} preparation ${placed === 1 ? 'blocker' : 'blockers'} placed.`;
    const pending = pendingPreparationObstacles(next, data).length;
    if (action.type === 'task' && pending) message += ` ${pending} ${pending === 1 ? 'blocker waits' : 'blockers wait'} for safe space.`;
  }
  // Each merge is kitchen work and moves the clock, until the purchase of the last act stops it. The merge that reaches the closing time
  // closes the day, except on a day that holds: its clock stays one merge before the closing. At that position, the release of the hold,
  // a payment or a delivery, closes the day in the same change.
  const last = dayMerges(next.clock.day, data) - 1, held = holding(state, data), clock = !next.act2;
  if (event === 'merge' && clock && holdsDay(next, data) && next.clock.merges + 1 >= last) {
    next.clock.merges = last;
    message += ` ${holdOf(next.clock.day, data)!.line}`;
  } else if ((event === 'merge' && clock && ++next.clock.merges > last) || (held && !holdsDay(next, data) && clock)) {
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
  stepBack(state, next, data);
  return { state: next, ok: true, message, event };
}
/**
 * A quest that loses its ticket in a change without its delivery steps back: it waits for a free ticket, and the counter lists it.
 * It leaves the list when it gets a ticket again. The recovery quest closes and never waits, so it never steps back.
 */
function stepBack(before: GameState, next: GameState, data: GameData) {
  const views = resolveQuests(next, data), waits = (id: string) => views.find(view => view.quest.id === id)?.status === 'waiting';
  const had = resolveQuests(before, data).filter(view => view.status === 'active').map(view => view.quest.id);
  const stepped = [...new Set([...before.steppedBack ?? [], ...had])].filter(waits);
  if (stepped.length) next.steppedBack = stepped;
  else delete next.steppedBack;
}
