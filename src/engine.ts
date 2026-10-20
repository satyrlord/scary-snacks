// The deterministic rules of the bistro game: the new game, the actions, and the acceptance of an untrusted save.
import { arrivalScene, availableChains, boardObstacles, canDeliverQuest, decorationUnlocked, deliveriesSince, dishOpen, earnedScenes, firstFreeBoardCell, freeBoardCells, getItem, integer, mergePartners, mergeResult, own, pendingPreparationObstacles, present, questDeliveryCells, questPredecessors, requiredQuests, resolveChapters, storyOrder, supperComplete, takeCost, taskEligibility, unresolvedObstacle } from './model.ts';
import type { Action, Cell, GameData, GameState, Result } from './model.ts';

/** At most this many preparation blockers wait on the board at one time. */
const ACTIVE_BLOCKERS = 3;
/** Placement keeps this many usable cells empty: one Linden tea from scratch, for the recovery quest, needs four. */
export const KEEP_FREE = 4;
const copy = (state: GameState): GameState => structuredClone(state);
const itemAt = (state: GameState, index: unknown) => integer(index, 0, state.board.length - 1) ? state.board[index] : null;
function discover(state: GameState, code: string) {
  if (!state.discovered.includes(code)) state.discovered.push(code);
}
/** Discovers a dish that the player makes or takes. The first one of its kind gets the new-dish notice instead of the usual line. */
function made(state: GameState, code: string, name: string, line: string) {
  const first = !state.discovered.includes(code);
  discover(state, code);
  return first ? `${name} is a new dish! It is in the recipe book now.` : line;
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
export function createGame(data: GameData): GameState {
  const layoutId = data.board.defaultLayout;
  return {
    version: 13, layoutId, resolvedObstacles: [], preparationObstacles: { start: 0, placed: [] }, pendingScenes: [],
    board: data.board.initial.map(code => code ? { code } : null), coins: 0, taskIndex: 0,
    discovered: [...new Set(data.board.initial.filter(present))],
    decorations: [], decorationChoices: {}, completedQuests: [],
  };
}
/** Delivered quests are known, unique, not the recovery quest, and opened in delivery order, and every completed preparation had its quests. */
function validateQuestProgress(state: GameState, data: GameData): boolean {
  const complete = state.completedQuests;
  if (!Array.isArray(complete) || complete.length > data.quests.length || new Set(complete).size !== complete.length) return false;
  const done = new Set<string>();
  for (const id of complete) {
    const quest = data.quests.find(quest => quest.id === id);
    if (!quest || quest.recovery || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask))
      || !questPredecessors(quest, data).every(previous => done.has(previous))) return false;
    done.add(id);
  }
  return !state.taskIndex || requiredQuests(state.taskIndex - 1, data).every(quest => done.has(quest.id));
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
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== 13) return false;
    if (!Array.isArray(state.board) || state.board.length !== data.board.columns * data.board.rows) return false;
    if (!integer(state.coins)) return false;
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
        || !state.resolvedObstacles.every(id => typeof id === 'string' && obstacles.some(obstacle => obstacle.id === id))) return false;
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
    return true;
  } catch {
    return false;
  }
}
export function reduceGame(state: GameState, action: Action, data: GameData): Result {
  const fail = (message: string): Result => ({ state, ok: false, message, event: null });
  if (!action || typeof action !== 'object') return fail('Choose an action.');
  const next = copy(state);
  let event: string = action.type;
  let message = '';
  switch (action.type) {
    case 'deliverQuest': {
      const quest = data.quests.find(quest => quest.id === action.id);
      if (!quest || !canDeliverQuest(next, quest, data)) return fail('This quest needs every required item on the board. Check that the quest is still on a ticket.');
      if (!integer(next.coins + quest.reward)) return fail('Spend some coins before you deliver this quest.');
      for (const index of questDeliveryCells(next, quest, data)) next.board[index] = null;
      next.coins += quest.reward;
      // The recovery quest keeps no record and has no reply, so it can open again.
      if (!quest.recovery) {
        next.completedQuests.push(quest.id);
        // The supper earns the finale in place of a reply.
        next.pendingScenes.push(quest.finale ? data.finale.id : quest.id);
        // A follow-up scene waits for a count of later deliveries; it is earned by the delivery that reaches the count.
        for (const earlier of data.quests) if (earlier.followUp && deliveriesSince(next, earlier.id) === earlier.followUp.afterDeliveries) next.pendingScenes.push(earlier.followUp.id);
      }
      message = quest.finale ? `${quest.title}: served.` : `${quest.title}: delivered. Earned ${quest.reward} ${quest.reward === 1 ? 'coin' : 'coins'}.`;
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
          if (!integer(next.coins + coin)) return fail('Spend some coins before you clear this blocker.');
          next.resolvedObstacles.push(obstacle.id);
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
      if (!item?.generator) return fail('Choose an ingredient source, such as the Flour bin.');
      const code = item.generator.outputs[0];
      if (Object.hasOwn(action, 'output')) return fail('This source takes only its first ingredient.');
      const empty = firstFreeBoardCell(next, data);
      if (empty === -1) return fail('The board is full. Merge a pair or deliver a quest.');
      // A take from a paid source spends its coins. A purse that cannot pay takes nothing.
      const cost = takeCost(item, data);
      if (next.coins < cost) return fail(`The ${item.name} costs ${cost} ${cost === 1 ? 'coin' : 'coins'} for each take, and the purse cannot pay. Deliver a quest, or take free herbs from the Herb basket.`);
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
  return { state: next, ok: true, message, event };
}
