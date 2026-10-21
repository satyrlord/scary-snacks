// The deterministic rules of the bistro game: the new game, the actions, and the acceptance of an untrusted save.
import { arrivalScene, availableChains, boardObstacles, canDeliverQuest, canJoinCycle, canLightLanterns, decorationUnlocked, deliveriesSince, dayMerges, dishOpen, earnedScenes, firstFreeBoardCell, freeBoardCells, getItem, integer, looseRaw, looseRawCells, mergePartners, mergeResult, own, pendingPreparationObstacles, present, questDeliveryCells, questPredecessors, requiredQuests, resolveChapters, resolveQuests, storyOrder, supperComplete, takeCost, taskEligibility, unresolvedObstacle } from './model.ts';
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
/**
 * The closing, in the change of the merge that reaches the closing time: the upkeep, then the thief rat or Șoricescu, then the next
 * day, then the night report. The evening guest of the new day follows in the same change.
 */
function close(state: GameState, data: GameData) {
  const levers = data.day;
  state.coins -= levers.upkeep;
  const loose = looseRawCells(state, data);
  let report: Omit<NightReport, 'purse' | 'seen'>;
  if (loose.length) {
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
    report = { day: state.clock.day, upkeep: levers.upkeep, rat: 'thief', taken: placed, trapped, gift: null };
  } else {
    // A tidy kitchen earns a gift, if it leaves the free cells that the recovery quest needs.
    let gift: NightReport['gift'] = null;
    if (freeBoardCells(state, data) >= levers.giftSpace) {
      const chains = availableChains(state, data), open = data.chains.filter(chain => chains.includes(chain.id));
      const item = `${open[state.gifts % open.length].id}_${levers.giftStage}`, position = bottomLeftFreeCell(state, data);
      state.board[position] = { code: item };
      gift = { item, position, first: !state.discovered.includes(item) };
      discover(state, item);
      state.gifts++;
    }
    report = { day: state.clock.day, upkeep: levers.upkeep, rat: 'soricescu', taken: [], trapped: null, gift };
  }
  state.clock = { day: state.clock.day + 1, merges: 0 };
  state.evening = { guest: null, last: state.evening.guest ?? state.evening.last, delivered: false };
  state.night = { ...report, purse: state.coins, seen: false };
}
/**
 * Fixes the evening guest when no guest has this evening and a booked quest has a ticket: the only booked guest, or the guest who did
 * not have the last evening, or the first in authored order. The guest then keeps the evening until the next closing.
 */
function fixEvening(state: GameState, data: GameData) {
  if (state.evening.guest || state.act1) return;
  const guests = [...new Set(resolveQuests(state, data).filter(view => view.status === 'active' && view.quest.booked).map(view => view.quest.character))];
  if (guests.length) state.evening.guest = guests.find(guest => guest !== state.evening.last) ?? guests[0];
}
/** A quest that holds a ticket puts its dishes in the recipe book, so a ticket never shows a dish that the player does not know. */
export function revealTickets(state: GameState, data: GameData) {
  for (const view of resolveQuests(state, data)) if (view.status === 'active') for (const { item } of view.quest.requirements) discover(state, item);
}
/** A new game. The session gives it a random seed, so the rules themselves stay deterministic. */
export function createGame(data: GameData, seed = 0): GameState {
  const layoutId = data.board.defaultLayout;
  const state: GameState = {
    version: 14, layoutId, resolvedObstacles: [], preparationObstacles: { start: 0, placed: [] }, pendingScenes: [],
    board: data.board.initial.map(code => code ? { code } : null), coins: 0, taskIndex: 0,
    discovered: [...new Set(data.board.initial.filter(present))],
    decorations: [], decorationChoices: {}, completedQuests: [],
    clock: { day: 1, merges: 0 }, seed, ratHoles: [], gifts: 0, evening: { guest: null, last: null, delivered: false }, night: null, act1: null,
  };
  revealTickets(state, data);
  return state;
}
/** Delivered quests are known, unique, campaign quests or the supper, and opened in delivery order, and every completed preparation had its quests. */
function validateQuestProgress(state: GameState, data: GameData): boolean {
  const complete = state.completedQuests;
  if (!Array.isArray(complete) || complete.length > data.quests.length || new Set(complete).size !== complete.length) return false;
  const done = new Set<string>();
  for (const id of complete) {
    const quest = data.quests.find(quest => quest.id === id);
    if (!quest || quest.recovery || quest.repeating || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask))
      || !questPredecessors(quest, data).every(previous => done.has(previous))) return false;
    done.add(id);
  }
  return !state.taskIndex || requiredQuests(state.taskIndex - 1, data).every(quest => done.has(quest.id));
}
const record = (value: unknown, keys: string[]): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const placed = (value: unknown, size: number): value is Placed => record(value, ['item', 'position']) && typeof value.item === 'string' && integer(value.position, 0, size - 1);
/**
 * The day fields of a save: the clock, the seed, the rat holes, the gifts, the evening, the night report, and the act 1 result.
 * The board and blocker checks that follow also cover the cells of the rat holes.
 */
function validDay(state: GameState, data: GameData): boolean {
  const size = state.board.length, levers = data.day, clock = state.clock;
  if (!record(clock, ['day', 'merges']) || !integer(clock.day, 1) || !integer(clock.merges, 0, dayMerges(data) - 1) || !integer(state.seed, 0, 2 ** 32 - 1) || !integer(state.gifts)) return false;
  if (!Array.isArray(state.ratHoles) || state.ratHoles.length > levers.ratHoles
    || !state.ratHoles.every(hole => placed(hole, size) && looseRaw(hole.item, data) && state.discovered?.includes(hole.item))) return false;
  const booked = new Set(data.quests.filter(quest => quest.booked).map(quest => quest.character)), guest = (value: unknown) => value === null || booked.has(value as string);
  const evening = state.evening;
  if (!record(evening, ['guest', 'last', 'delivered']) || !guest(evening.guest) || !guest(evening.last) || typeof evening.delivered !== 'boolean'
    || (evening.delivered && evening.guest === null)) return false;
  const night = state.night;
  if (night !== null) {
    if (!record(night, ['day', 'upkeep', 'rat', 'taken', 'trapped', 'gift', 'purse', 'seen']) || night.day !== clock.day - 1 || !integer(night.upkeep)
      || !integer(night.purse, -1_000_000_000) || typeof night.seen !== 'boolean' || !Array.isArray(night.taken)) return false;
    const raw = (value: unknown) => placed(value, size) && looseRaw(value.item, data);
    if (night.rat === 'thief') {
      const count = night.taken.length + (night.trapped ? 1 : 0);
      if (!night.taken.every(raw) || (night.trapped !== null && !raw(night.trapped)) || night.gift !== null || count < 1 || count > levers.ratTake) return false;
    } else if (night.rat === 'soricescu') {
      const gift = night.gift;
      if (night.taken.length || night.trapped !== null || (gift !== null && (!record(gift, ['item', 'position', 'first']) || !placed({ item: gift.item, position: gift.position }, size)
        || typeof gift.first !== 'boolean' || getItem(gift.item, data)?.stage !== levers.giftStage))) return false;
    } else return false;
  } else if (clock.day > 1) return false;
  // The supper records the result of act 1 once, on the day that it was served.
  const act1 = state.act1;
  if (act1 === null ? supperComplete(state, data) : !supperComplete(state, data) || !record(act1, ['days', 'purse']) || act1.days !== clock.day || !integer(act1.purse, -1_000_000_000)) return false;
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
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== 14) return false;
    if (!Array.isArray(state.board) || state.board.length !== data.board.columns * data.board.rows) return false;
    if (!integer(state.coins, -1_000_000_000)) return false;
    if (!validDay(state, data)) return false;
    if (!integer(state.taskIndex, 0, data.tasks.length)) return false;
    const chains = availableChains(state, data);
    {
      // Pending scenes are unique and earned, and story scenes keep story order, so an imported save cannot open a later scene.
      const pending = state.pendingScenes, scenes = storyOrder(data), earned = earnedScenes(state, data);
      if (!Array.isArray(pending) || new Set(pending).size !== pending.length || !pending.every(id => earned.includes(id))) return false;
      const ordered = pending.filter(id => scenes.includes(id));
      if (!ordered.every((id, at) => at === 0 || scenes.indexOf(ordered[at - 1]) < scenes.indexOf(id))) return false;
    }
    if (!validateQuestProgress(state, data)) return false;
    const validItem = (cell: Cell | null) => cell && typeof cell === 'object' && !Array.isArray(cell)
      && Object.keys(cell).length === 1 && own(data.items, cell.code) && dishOpen(cell.code, chains, data);
    if (!state.board.every(cell => cell === null || validItem(cell))) return false;
    {
      const layout = data.board.layouts.find(layout => layout.id === state.layoutId);
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
    const cells = state.board.filter(present);
    for (const chain of chains) {
      if (cells.filter(cell => getItem(cell.code, data)?.generator && getItem(cell.code, data)?.chain === chain).length !== 1) return false;
    }
    if (!Array.isArray(state.discovered) || state.discovered.length > Object.keys(data.items).length
      || new Set(state.discovered).size !== state.discovered.length
      || !state.discovered.every(code => own(data.items, code) && dishOpen(code, chains, data))
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
    // The saved repeating quests are known and can join the cycle. A repeating quest that the save has not opened yet shows its dishes after the next action.
    const repeating = state.repeating;
    if (repeating !== undefined && (!record(repeating, ['last', 'open']) || ![repeating.last, repeating.open].every(id => id === null
      || (typeof id === 'string' && data.quests.some(quest => quest.id === id && canJoinCycle(state, quest, data)))))) return false;
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
      const quest = data.quests.find(quest => quest.id === action.id);
      // A booked quest with every portion on the board waits only for its evening.
      if (!quest || !canDeliverQuest(next, quest, data)) return fail(quest?.booked && questDeliveryCells(next, quest).every(index => index >= 0)
        ? 'This table is booked for another time. Deliver when the guest arrives for the evening.' : 'This quest needs every required item on the board. Check that the quest is still on a ticket.');
      if (!integer(next.coins + quest.reward, -1_000_000_000)) return fail('Spend some coins before you deliver this quest.');
      for (const index of questDeliveryCells(next, quest)) next.board[index] = null;
      next.coins += quest.reward;
      // Each day admits one booked delivery. The supper stops the clock and records the result of act 1.
      if (quest.booked) next.evening.delivered = true;
      if (quest.finale) next.act1 = { days: next.clock.day, purse: next.coins };
      // The recovery quest and a repeating quest keep no record and have no reply, so they can open again.
      // A repeating delivery moves the cycle to the next quest.
      if (quest.repeating) next.repeating = { last: quest.id, open: null };
      else if (!quest.recovery) {
        next.completedQuests.push(quest.id);
        // The supper earns the finale in place of a reply.
        next.pendingScenes.push(quest.finale ? data.finale.id : quest.id);
        // A follow-up scene waits for a count of later deliveries; it is earned by the delivery that reaches the count.
        for (const earlier of data.quests) if (earlier.followUp && deliveriesSince(next, earlier.id) === earlier.followUp.afterDeliveries) next.pendingScenes.push(earlier.followUp.id);
      }
      message = quest.finale ? `${quest.title}: served.` : `${quest.title}: delivered. Earned ${quest.reward} ${quest.reward === 1 ? 'coin' : 'coins'}.`;
      break;
    }
    case 'lantern': {
      // The lanterns bring the booked guest at once, so the player never cooks spare food to pass the time.
      const quest = data.quests.find(quest => quest.id === action.id);
      if (!quest || !canLightLanterns(next, quest, data)) return fail('Light the lanterns for tonight’s booked guest before the booking time, with every dish on the board.');
      next.clock.merges = (data.day.booking - data.day.opening) / data.day.mergeMinutes;
      message = `The lanterns are lit. ${data.characters.find(person => person.id === quest.character)!.name} arrives for the evening.`;
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
      const at = next.pendingScenes.indexOf(action.id);
      if (at === -1) return fail('This story scene is already in the journal.');
      next.pendingScenes.splice(at, 1);
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
          const coin = data.economy.blockerCoin;
          if (!integer(next.coins + coin, -1_000_000_000)) return fail('Spend some coins before you clear this blocker.');
          if (obstacle.type === 'rat-hole') next.ratHoles = next.ratHoles.filter(hole => hole.position !== action.to);
          else next.resolvedObstacles.push(obstacle.id);
          next.coins += coin;
          message += ` The blocker is cleared: +${coin} ${coin === 1 ? 'coin' : 'coins'}.`;
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
      // A take from a paid source spends its coins. A purse that cannot pay takes nothing.
      const cost = takeCost(item, data);
      if (cost && next.coins < cost) return fail(`The ${item.name} costs ${cost} ${cost === 1 ? 'coin' : 'coins'} for each take, and the purse cannot pay. Deliver a quest, or take free herbs from the Herb basket.`);
      next.coins -= cost;
      next.board[empty] = { code };
      const name = getItem(code, data)!.name;
      message = made(next, code, name, cost ? `Took ${name} for ${cost} ${cost === 1 ? 'coin' : 'coins'}.` : `Took ${name}.`);
      break;
    }
    case 'task': {
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
  if (['task', 'move', 'spawn', 'deliverQuest'].includes(action.type)) {
    const placed = placePreparationObstacles(next, data);
    if (action.type === 'task') message += ` ${data.board.preparations[next.taskIndex - 1].context}`;
    if (placed) message += ` ${placed} preparation ${placed === 1 ? 'blocker' : 'blockers'} placed.`;
    const pending = pendingPreparationObstacles(next, data).length;
    if (action.type === 'task' && pending) message += ` ${pending} ${pending === 1 ? 'blocker waits' : 'blockers wait'} for safe space.`;
  }
  // Each merge is kitchen work and moves the clock, until the supper stops it. The merge that reaches the closing time closes the day.
  if (event === 'merge' && !next.act1 && ++next.clock.merges >= dayMerges(data)) {
    close(next, data);
    if (!integer(next.coins, -1_000_000_000) || !integer(next.clock.day, 1) || !integer(next.gifts)) return fail('This closing exceeds a supported save limit. The merge was not applied.');
    message += ' The bistro closes for the night.';
  }
  fixEvening(next, data);
  // A repeating quest that opens in this change is saved, so it stays open until its delivery.
  const repeating = resolveQuests(next, data).find(view => view.quest.repeating && view.status !== 'locked')?.quest.id ?? null;
  if (repeating !== (next.repeating?.open ?? null)) next.repeating = { last: next.repeating?.last ?? null, open: repeating };
  revealTickets(next, data);
  return { state: next, ok: true, message, event };
}
