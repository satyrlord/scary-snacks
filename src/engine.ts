// The deterministic rules of the bistro game: the new game, the actions, and the acceptance of an untrusted save.
import { arrivalScene, availableChains, boardObstacles, canDeliverQuest, decorationUnlocked, deliveriesSince, earnedScenes, firstFreeBoardCell, freeBoardCells, getItem, integer, own, pendingPreparationObstacles, present, questDeliveryCells, questPredecessors, requiredQuests, resolveChapters, sceneDialogue, sceneSource, storyOrder, supperComplete, taskEligibility, unresolvedObstacle } from './model.ts';
import type { Action, Cell, GameData, GameState, Result } from './model.ts';

/** At most this many preparation blockers wait on the board at one time. */
const ACTIVE_BLOCKERS = 3;
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
    if (progress.placed.filter(placement => !state.resolvedObstacles.includes(placement.id)).length >= ACTIVE_BLOCKERS || freeBoardCells(state, data) <= 3) break;
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
    version: 12, layoutId, resolvedObstacles: [], preparationObstacles: { start: 0, placed: [] }, pendingScenes: [],
    board: data.board.initial.map(code => code ? { code } : null), coins: 0, taskIndex: 0,
    discovered: [...new Set(data.board.initial.filter(present))],
    decorations: [], decorationChoices: {}, outputChoices: {}, completedQuests: [],
  };
}
/** Delivered quests are known, unique, not recurring, and opened in delivery order, and every completed preparation had its quests. */
function validateQuestProgress(state: GameState, data: GameData): boolean {
  const complete = state.completedQuests;
  if (!Array.isArray(complete) || complete.length > data.quests.length || new Set(complete).size !== complete.length) return false;
  const done = new Set<string>();
  for (const id of complete) {
    const quest = data.quests.find(quest => quest.id === id);
    if (!quest || quest.repeat || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask))
      || !questPredecessors(quest, data).every(previous => done.has(previous))) return false;
    done.add(id);
  }
  return !state.taskIndex || requiredQuests(state.taskIndex - 1, data).every(quest => done.has(quest.id));
}
/** A save that waits for the finale before the supper payment drops the finale and its saved line, so the payment earns it. Other saves stay as they are. */
export function repairSave(candidate: unknown, data: GameData): unknown {
  const state = candidate as GameState, id = data.finale.id;
  if (!state || typeof state !== 'object' || !Array.isArray(state.pendingScenes) || !Array.isArray(state.completedQuests)
    || !state.pendingScenes.includes(id) || supperComplete(state, data)) return candidate;
  const repaired = { ...state, pendingScenes: state.pendingScenes.filter(scene => scene !== id) };
  if (state.sceneLines && typeof state.sceneLines === 'object' && Object.hasOwn(state.sceneLines, id)) {
    repaired.sceneLines = Object.fromEntries(Object.entries(state.sceneLines).filter(([scene]) => scene !== id));
  }
  return repaired;
}
/** Accepts an untrusted save: a parsed save is checked field by field before it is treated as a game state. The data must pass dataProblems. */
export function validateGame(candidate: unknown, data: GameData): candidate is GameState {
  try {
    const state = candidate as GameState;
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== 12) return false;
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
      // A line gives no reward, so a line past the end of its scene stays valid: the scene then starts again.
      const lines = state.sceneLines;
      if (lines !== undefined && (!lines || typeof lines !== 'object' || Array.isArray(lines) || ![Object.prototype, null].includes(Object.getPrototypeOf(lines))
        || !Object.entries(lines).every(([id, line]) => pending.includes(id) && integer(line, 1, Number.MAX_SAFE_INTEGER)))) return false;
    }
    if (!validateQuestProgress(state, data)) return false;
    const validItem = (cell: Cell | null) => cell && typeof cell === 'object' && !Array.isArray(cell)
      && Object.keys(cell).length === 1 && own(data.items, cell.code) && chains.includes(data.items[cell.code].chain);
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
      || !state.discovered.every(code => own(data.items, code) && chains.includes(data.items[code].chain))
      || !cells.every(cell => state.discovered.includes(cell.code))) return false;
    // A blocker does not discover its ingredient, but clearing one needs that ingredient on the board.
    if (boardObstacles(state, data).some(obstacle => state.resolvedObstacles.includes(obstacle.id)
      && !state.discovered.includes(obstacle.ingredient))) return false;
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
    const outputs = state.outputChoices;
    if (!outputs || typeof outputs !== 'object' || Array.isArray(outputs)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(outputs)) || Object.keys(outputs).length > chains.length) return false;
    const completed = new Set(data.tasks.slice(0, state.taskIndex).map(task => task.id));
    for (const [chain, code] of Object.entries(outputs)) {
      if (!chains.includes(chain) || !own(data.items, code) || data.items[code].generator
        || data.items[code].chain !== chain || data.items[code].stage < 2
        || !data.generatorTiers.some(tier => tier.chain === chain && tier.stage === data.items[code].stage && completed.has(tier.after))) return false;
    }
    return true;
  } catch {
    return false;
  }
}
function forgetLine(state: GameState, id: string) {
  if (!state.sceneLines) return;
  delete state.sceneLines[id];
  if (!Object.keys(state.sceneLines).length) delete state.sceneLines;
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
      if (quest?.cost && next.coins < quest.cost) return fail(`Earn ${quest.cost - next.coins} more coins to pay for ${quest.title}.`);
      if (!quest || !canDeliverQuest(next, quest, data)) return fail('This quest needs every required item on the board. Check that the quest is still on a ticket.');
      if (!integer(next.coins + quest.reward)) return fail('Spend some coins before you deliver this quest.');
      for (const index of questDeliveryCells(next, quest, data)) next.board[index] = null;
      next.coins += quest.reward - (quest.cost ?? 0);
      // A recurring quest keeps no record and has no reply, so it can open again.
      if (!quest.repeat) {
        next.completedQuests.push(quest.id);
        // The payment of the supper earns the finale in place of a reply.
        next.pendingScenes.push(quest.cost ? data.finale.id : quest.id);
        // A follow-up scene waits for a count of later deliveries; it is earned by the delivery that reaches the count.
        for (const earlier of data.quests) if (earlier.followUp && deliveriesSince(next, earlier.id) === earlier.followUp.afterDeliveries) next.pendingScenes.push(earlier.followUp.id);
      }
      message = quest.cost ? `${quest.title}: paid ${quest.cost} coins.` : `${quest.title}: delivered. Earned ${quest.reward} coins.`;
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
      // Finish and Skip both end a waiting scene and its saved line. A stale or repeated event changes nothing.
      const at = next.pendingScenes.indexOf(action.id);
      if (at === -1) return fail('This story scene is already in the journal.');
      next.pendingScenes.splice(at, 1);
      forgetLine(next, action.id);
      // A guest who visits once has no journal replay after the visit.
      const guest = data.characters.find(person => person.id === data.quests.find(quest => quest.id === action.id)?.character);
      message = guest?.singleVisit ? 'The scene is finished.' : 'The scene is in the story journal.';
      break;
    }
    case 'sceneLine': {
      // Only a waiting scene keeps its line, and the first line needs no record.
      const source = next.pendingScenes.includes(action.id) ? sceneSource(action.id, data) : null, dialogue = source && sceneDialogue(source);
      if (!dialogue || !integer(action.line, 0, dialogue.length - 1)) return fail('This scene line is not available.');
      if (action.line) (next.sceneLines ??= {})[action.id] = action.line;
      else forgetLine(next, action.id);
      break;
    }
    case 'move': {
      const source = itemAt(next, action.from);
      if (!integer(action.from, 0, next.board.length - 1) || !integer(action.to, 0, next.board.length - 1)
        || action.from === action.to || !source) return fail('Choose an item and a different space.');
      const obstacle = unresolvedObstacle(next, action.to, data);
      const target = next.board[action.to];
      const item = getItem(source.code, data)!;
      if (obstacle && obstacle.ingredient !== source.code) return fail('Merge a matching ingredient into this blocked space.');
      if ((target?.code === source.code || obstacle) && !item.generator) {
        if (!item.next) return fail(`${item.name} is a final dish. Deliver it to a neighbour.`);
        next.board[action.to] = { code: item.next };
        next.board[action.from] = null;
        if (obstacle) next.resolvedObstacles.push(obstacle.id);
        const name = getItem(item.next, data)!.name;
        message = made(next, item.next, name, `Made ${name}.`);
        event = 'merge';
      } else {
        if (obstacle) return fail('Merge a matching ingredient into this blocked space.');
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
      next.board[empty] = { code };
      const name = getItem(code, data)!.name;
      message = made(next, code, name, `Took ${name}.`);
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
