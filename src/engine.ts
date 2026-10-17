// Original deterministic merge-game rules for the bistro browser game.
export type Item = { id: string; name: string; chain: string; stage: number; next: string | null; sprite: number; price: number; generator?: { outputs: string[] } };
export type SceneLine = { speaker: string; text: string };
export type Character = { id: string; name: string; role: string; description: string; introduction: string; sprite: number; thanks: string[]; visitor?: boolean; singleVisit?: boolean; portraitAtlas?: 'guest'; orderItems?: string[]; occasional?: boolean; absentDuringQuest?: string };
export type Task = { id: string; chapter: number; title: string; cost: number; work: { summary: string; materials: number; labour: number; hours: number }; goals: { served: number; merges: number }; dialogue: SceneLine[]; unlock?: string; requiresQuest?: string };
export type TaskRequirement =
  | { kind: 'coins' | 'served' | 'merges'; current: number; required: number; met: boolean }
  | { kind: 'quest'; questId: string; title: string; met: boolean }
  | { kind: 'space'; source: string; met: boolean };
export type TaskEligibility = { task: Task | null; ready: boolean; requirements: TaskRequirement[]; blockers: string[] };
export type Quest = {
  id: string; character: string; title: string; afterTask: string | null; afterQuest?: string; afterServed?: number;
  requirements: { item: string; quantity: number }[]; reward: number; opening: SceneLine[]; completion: SceneLine[];
  companions?: string[]; afterQuestServices?: number; waitsForCustomers?: string[];
  followUp?: { id: string; title: string; afterServices: number; dialogue: SceneLine[] };
};
/**
 * A chapter of the story. Its preparations are the tasks that name its number. Opening sets the scene when the chapter starts,
 * objective is its goal, payoff says what the chapter changed, and closing is the scene that plays when its last preparation completes.
 * Contribution is the optional neighbour quest that opens during the chapter.
 */
export type Chapter = { id: string; title: string; objective: string; opening: string; payoff: string; contribution: string; closing: SceneLine[] };
/** The scene that plays after the last preparation. Ending is the line that returns the player to the kitchen. */
export type Finale = { id: string; title: string; dialogue: SceneLine[]; ending: string };
export type ChapterView = { chapter: Chapter; number: number; tasks: Task[]; done: number; status: 'complete' | 'current' | 'locked' };
export type QuestView = { quest: Quest; status: 'active' | 'locked' | 'complete' };
/** A room of the bistro. The first area is open from the start; another opens with the preparation named by unlock. */
export type Area = { id: string; name: string; unlock: string | null };
export type DecorationVariant = { id: string; name: string; image: string };
export type DecorationSlot = {
  id: string; name: string; area: string; unlock: string; default: string; variants: DecorationVariant[];
  crop: { x: number; y: number; width: number; height: number };
};
export type DecorationView = DecorationSlot & { unlocked: boolean; selected: DecorationVariant };
export type LevelReward = { id: string; level: number; coins: number };
export type BoardObstacle = { id: string; position: number; name: string; type: 'clutter' | 'anchored'; ingredient: string; sprite?: number; atlas?: 'preparation'; context?: string };
export type BoardLayout = { id: string; obstacles: BoardObstacle[] };
export type PreparationObstacleBatch = { after: string; context: string; obstacles: Omit<BoardObstacle, 'position' | 'context'>[] };
/**
 * One painted state of an area. It shows from the preparation named by after (null: from the start of the game) until the next
 * state of its area. Its id is also the id of its painting. Focus is the centre of the change, in percentages of the painting
 * from its top-left corner. Mark is the point on the edge of the change where the New pin's tail touches, so the pin never covers it; the pin hangs below the mark when below is set.
 * Label is a short name of the change for the pin. Text describes the change in words, so a painting that cannot load still leaves it readable.
 */
export type RoomState = { id: string; area: string; after: string | null; focus: { x: number; y: number }; mark: { x: number; y: number; below?: boolean }; label: string; text: string };
/**
 * Room states whose masters the user accepted and whose variants ship (npm run assets:build). A state that is not in this list
 * shows the latest earlier painting of its area, with its own words. To add a state's painting, add its variant plan and its id here.
 */
export const roomPaintings: readonly string[] = [
  'front-room-00', 'front-room-01', 'front-room-02', 'front-room-03', 'front-room-04', 'front-room-05', 'front-room-06', 'front-room-07',
  'front-room-08', 'front-room-09', 'front-room-10', 'front-room-11', 'front-room-12', 'front-room-17', 'front-room-24',
  'courtyard-13', 'courtyard-14', 'courtyard-15', 'courtyard-16', 'courtyard-18', 'courtyard-19', 'courtyard-20', 'courtyard-21', 'courtyard-22',
  'courtyard-23',
];
export type GameData = {
  title: string; board: { columns: number; rows: number; initial: (string | null)[]; defaultLayout: string; layouts: BoardLayout[]; preparations: PreparationObstacleBatch[] };
  chains: { id: string; name: string }[]; items: Record<string, Item>; characters: Character[]; chapters: Chapter[]; finale: Finale; tasks: Task[];
  areas: Area[]; rooms: RoomState[]; decorationSlots: DecorationSlot[];
  generatorTiers: { chain: string; stage: number; after: string }[];
  levelRewards: LevelReward[];
  quests: Quest[];
};
/**
 * An area as the completed preparations leave it. States are the earned states in order; current is the latest of them.
 * Painting is the latest earned state that has a painting, so it is current unless current waits for its master.
 */
export type RoomView = Area & { open: boolean; states: RoomState[]; current: RoomState | null; painting: RoomState | null };
export type Cell = { code: string };
export type Order = { id: string; requirements: string[]; reward: number; customer: string; pricing: 'menu-1' };
export type GameState = {
  version: 9; board: (Cell | null)[]; coins: number; xp: number; taskIndex: number; orders: Order[];
  discovered: string[]; seed: number; served: number; merges: number; nextOrderId: number; decorations: string[];
  decorationChoices: Record<string, string>;
  outputChoices: Record<string, string>;
  claimedLevelRewards: string[];
  completedQuests: string[];
  /** Successful ordinary services at quest delivery. Missing records in existing saves start at the next service. */
  questCompletedAt?: Record<string, number>;
  layoutId: string; resolvedObstacles: string[];
  /** Completed preparations at adoption, and permanent placement history. Missing records do not add past batches. */
  preparationObstacles?: { start: number; placed: { id: string; position: number }[] };
  /**
   * The earned scenes that the player has not finished or skipped: preparation scenes, quest completion scenes, local news, chapter
   * closing scenes, and the finale. Preparation scenes, chapter scenes, and the finale keep story order.
   */
  pendingScenes: string[];
  /** The line that the player sees in a waiting scene, after its first line. A missing record starts the scene at its first line. */
  sceneLines?: Record<string, number>;
};
export type Action =
  | { type: 'move'; from: number; to: number }
  | { type: 'spawn'; index: number; output?: string }
  | { type: 'sell'; index: number }
  | { type: 'serve'; id: string }
  | { type: 'claimLevelReward'; id: string }
  | { type: 'deliverQuest'; id: string }
  | { type: 'decorate'; slot: string; variant: string }
  | { type: 'readScene'; id: string }
  | { type: 'sceneLine'; id: string; line: number }
  | { type: 'task' };
export type Result = { state: GameState; ok: boolean; message: string; event: string | null };

const own = (object: object, key: unknown): key is string => typeof key === 'string' && Object.hasOwn(object, key);
const integer = (value: unknown, min = 0, max = 1_000_000_000): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const present = <T>(value: T): value is NonNullable<T> => Boolean(value);
const copy = (state: GameState): GameState => structuredClone(state);
const itemAt = (state: GameState, index: unknown) => integer(index, 0, state.board.length - 1) ? state.board[index] : null;
export function boardObstacles(state: Pick<GameState, 'layoutId' | 'preparationObstacles'>, data: GameData): BoardObstacle[] {
  return [...(data.board.layouts.find(layout => layout.id === state.layoutId)?.obstacles ?? []),
    ...(state.preparationObstacles?.placed.flatMap(placement => {
      const batch = data.board.preparations.find(batch => batch.obstacles.some(obstacle => obstacle.id === placement.id));
      const obstacle = batch?.obstacles.find(obstacle => obstacle.id === placement.id);
      return obstacle ? [{ ...obstacle, position: placement.position, context: batch!.context }] : [];
    }) ?? [])];
}
export function unresolvedObstacle(state: Pick<GameState, 'layoutId' | 'resolvedObstacles' | 'preparationObstacles'>, index: number, data: GameData): BoardObstacle | null {
  const initial = data.board.layouts.find(layout => layout.id === state.layoutId)?.obstacles.find(obstacle =>
    obstacle.position === index && !state.resolvedObstacles.includes(obstacle.id));
  if (initial) return initial;
  const placement = state.preparationObstacles?.placed.find(value => value.position === index && !state.resolvedObstacles.includes(value.id));
  if (!placement) return null;
  const batch = data.board.preparations.find(batch => batch.obstacles.some(obstacle => obstacle.id === placement.id))!;
  return { ...batch.obstacles.find(obstacle => obstacle.id === placement.id)!, position: index, context: batch.context };
}
export function pendingPreparationObstacles(state: GameState, data: GameData) {
  const progress = state.preparationObstacles;
  if (!progress) return [];
  return data.board.preparations.slice(progress.start, state.taskIndex).flatMap(batch => batch.obstacles)
    .filter(obstacle => !progress.placed.some(placement => placement.id === obstacle.id));
}
export function firstFreeBoardCell(state: GameState, data: GameData): number {
  return state.board.findIndex((cell, index) => cell === null && !unresolvedObstacle(state, index, data));
}
export function freeBoardCells(state: GameState, data: GameData): number {
  return state.board.reduce((count, cell, index) => count + (cell === null && !unresolvedObstacle(state, index, data) ? 1 : 0), 0);
}
/** The menu-1 price schedule is fixed for orders that have this pricing marker. */
export const menuReward = (requirements: string[], data: GameData) => requirements.reduce((sum, code) => sum + data.items[code].price, 0);
const availableChains = (state: Pick<GameState, 'taskIndex'>, data: GameData) => [...new Set([
  ...data.board.initial.filter(present).filter(code => data.items[code].generator).map(code => data.items[code].chain),
  ...data.tasks.slice(0, state.taskIndex).flatMap(task => task.unlock ? [task.unlock] : []),
])];
function random(state: GameState, count: number) {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return Math.floor(state.seed / 4294967296 * count);
}
function discover(state: GameState, code: string) {
  if (!state.discovered.includes(code)) state.discovered.push(code);
}
function adjacentPositions(position: number, data: GameData): number[] {
  const column = position % data.board.columns;
  return [
    ...(position >= data.board.columns ? [position - data.board.columns] : []),
    ...(position + data.board.columns < data.board.initial.length ? [position + data.board.columns] : []),
    ...(column > 0 ? [position - 1] : []),
    ...(column < data.board.columns - 1 ? [position + 1] : []),
  ];
}
function revealAdjacentClutter(state: GameState, destination: number, data: GameData) {
  for (const position of adjacentPositions(destination, data)) {
    const obstacle = unresolvedObstacle(state, position, data);
    if (obstacle?.type !== 'clutter') continue;
    state.resolvedObstacles.push(obstacle.id);
    state.board[position] = { code: obstacle.ingredient };
    discover(state, obstacle.ingredient);
  }
}
/** Keep production space and the original optional-clearing route. Place in stable cell order without using the order seed. */
function placePreparationObstacles(state: GameState, data: GameData): number {
  const progress = state.preparationObstacles;
  if (!progress) return 0;
  let placed = 0;
  for (const obstacle of pendingPreparationObstacles(state, data)) {
    if (progress.placed.filter(placement => !state.resolvedObstacles.includes(placement.id)).length >= 3 || freeBoardCells(state, data) <= 3) break;
    const clutter = boardObstacles(state, data).filter(value => value.type === 'clutter' && !state.resolvedObstacles.includes(value.id));
    const position = state.board.findIndex((cell, index) => {
      if (cell !== null || unresolvedObstacle(state, index, data)) return false;
      const covered = new Set([...clutter.map(value => value.position), ...(obstacle.type === 'clutter' ? [index] : [])]);
      return [...covered].every(at => adjacentPositions(at, data).some(side => !covered.has(side)));
    });
    if (position === -1) break;
    progress.placed.push({ id: obstacle.id, position });
    if (obstacle.type === 'anchored') discover(state, obstacle.ingredient);
    placed++;
  }
  return placed;
}
function questServiceGate(state: GameState, quest: Quest): boolean {
  return quest.afterQuestServices === undefined || !!quest.afterQuest
    && own(state.questCompletedAt ?? {}, quest.afterQuest)
    && state.served - state.questCompletedAt![quest.afterQuest] >= quest.afterQuestServices;
}

function questReady(state: GameState, quest: Quest, data: GameData): boolean {
  return (quest.afterTask === null || state.decorations.includes(quest.afterTask))
    && state.served >= (quest.afterServed ?? 0)
    && questPredecessors(quest, data).every(id => questDone(state, id)) && questServiceGate(state, quest);
}

function customerBlocked(state: GameState, person: Character, data: GameData): boolean {
  const quest = data.quests.find(quest => quest.id === person.absentDuringQuest);
  // Stop new noble tickets when the visit is ready, so existing tickets can drain without delaying it forever.
  return !!quest && !questDone(state, quest.id) && questReady(state, quest, data);
}

/** Neighbours waiting at the counter at the same time are always different people, and a served neighbour makes way for someone else. */
function makeOrder(state: GameState, data: GameData, waiting: string[]): Order {
  const chains = availableChains(state, data);
  const maxStage = Math.min(6, 2 + Math.floor(state.taskIndex / 5));
  const count = state.taskIndex >= 8 ? 1 + random(state, 2) : 1;
  let requirements = Array.from({ length: count }, () => {
    const chain = chains[random(state, chains.length)];
    return `${chain}_${1 + random(state, maxStage)}`;
  });
  const free = data.characters.filter(person => !person.visitor && !person.occasional && !waiting.includes(person.id));
  const occasional = data.characters.filter(person => !person.visitor && person.occasional && !waiting.includes(person.id)
    && !customerBlocked(state, person, data) && person.orderItems?.some(code => chains.includes(data.items[code].chain) && data.items[code].stage <= maxStage));
  const guest = occasional.length && random(state, 8) === 0 ? occasional[random(state, occasional.length)] : null;
  if (guest) {
    const menu = guest.orderItems!.filter(code => chains.includes(data.items[code].chain) && data.items[code].stage <= maxStage);
    requirements = Array.from({ length: count }, () => menu[random(state, menu.length)]);
  }
  return {
    id: `order_${state.nextOrderId++}`,
    requirements,
    reward: menuReward(requirements, data), pricing: 'menu-1',
    customer: guest?.id ?? free[random(state, free.length)].id,
  };
}

export function createGame(data: GameData, seed = 271828): GameState {
  const layoutId = data.board.defaultLayout;
  const state: GameState = {
    version: 9, layoutId, resolvedObstacles: [], preparationObstacles: { start: 0, placed: [] }, pendingScenes: [],
    board: data.board.initial.map(code => code ? { code } : null),
    coins: 0, xp: 0, taskIndex: 0, orders: [],
    discovered: [...new Set([...data.board.initial.filter(present),
      ...(data.board.layouts.find(layout => layout.id === layoutId)?.obstacles.filter(obstacle => obstacle.type === 'anchored').map(obstacle => obstacle.ingredient) ?? [])])],
    seed: Number.isSafeInteger(seed) ? seed >>> 0 : 271828,
    served: 0, merges: 0, nextOrderId: 1, decorations: [], decorationChoices: {}, outputChoices: {}, claimedLevelRewards: [],
    completedQuests: [],
  };
  for (let slot = 0; slot < 3; slot++) state.orders.push(makeOrder(state, data, state.orders.map(order => order.customer)));
  return state;
}

/** Replaces each duplicate waiting customer with an unused neighbour. The requirements, rewards, progress, and seed stay unchanged. */
export function normalizeOrderCustomers(state: GameState, data: GameData): GameState {
  const waiting = new Set(state.orders.map(order => order.customer));
  if (waiting.size === state.orders.length) return state;
  const free = data.characters.filter(person => !person.visitor && !person.occasional && !waiting.has(person.id));
  const seen = new Set<string>();
  const next = copy(state);
  let replacement = 0;
  for (const order of next.orders) {
    if (seen.has(order.customer)) order.customer = free[replacement++].id;
    seen.add(order.customer);
  }
  return next;
}

export function getLevel(state: Pick<GameState, 'xp'>) {
  return 1 + Math.floor(state.xp / 100);
}

/** The rewards that a claim can take: reached and not claimed. A reward that the coin limit blocks stays available. */
export function availableLevelRewards(state: Pick<GameState, 'xp' | 'claimedLevelRewards'>, data: GameData): LevelReward[] {
  return data.levelRewards.filter(reward => reward.level <= getLevel(state) && !state.claimedLevelRewards.includes(reward.id));
}

/** Check the finite coin schedule before the content generator writes its data. */
export function levelRewardProblems(data: GameData): string[] {
  if (!Array.isArray(data.levelRewards) || !data.levelRewards.length) return ['Level rewards need a finite schedule.'];
  const problems: string[] = [];
  const ids = new Set<string>();
  const levels = new Set<number>();
  for (const reward of data.levelRewards) {
    if (!reward || typeof reward !== 'object' || Array.isArray(reward)) {
      problems.push('Each level reward needs an ID, a level, and coins.');
      continue;
    }
    if (typeof reward.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(reward.id)) problems.push('Every level reward needs a stable ID.');
    if (!integer(reward.level, 2, 10_000_001)) problems.push('A reward level must be a supported integer above one.');
    if (!integer(reward.coins, 1)) problems.push('A level reward must give a supported positive coin amount.');
    if (ids.has(reward.id)) problems.push('Level reward IDs must be unique.');
    if (levels.has(reward.level)) problems.push('Level reward levels must be unique.');
    ids.add(reward.id);
    levels.add(reward.level);
  }
  return problems;
}

/** An item by its code, or undefined for a code that the data does not know. */
export function getItem(code: string, data: GameData): Item | undefined {
  return own(data.items, code) ? data.items[code] : undefined;
}

const questDone = (state: GameState, id: string) => state.completedQuests.includes(id);
function questPredecessors(quest: Quest, data: GameData): string[] {
  const earlier = data.quests.slice(0, data.quests.indexOf(quest)).filter(previous => previous.character === quest.character);
  return [...new Set([...(quest.afterQuest ? [quest.afterQuest] : []), ...earlier.map(previous => previous.id)])];
}

/** At most one unfinished request per neighbour can be active. */
export function resolveQuests(state: GameState, data: GameData): QuestView[] {
  return data.quests.map(quest => ({ quest, status: state.completedQuests.includes(quest.id) ? 'complete'
    : questReady(state, quest, data) && !state.orders.some(order => quest.waitsForCustomers?.includes(order.customer)) ? 'active' : 'locked' }));
}

/** A guest who visits once has a journal introduction only while their request is open. */
export function journalCharacters(state: GameState, data: GameData): Character[] {
  const quests = resolveQuests(state, data);
  return data.characters.filter(character => !character.singleVisit
    || quests.some(view => (view.quest.character === character.id || view.quest.companions?.includes(character.id)) && view.status === 'active'));
}

export function questDeliveryCells(state: GameState, quest: Quest, data: GameData): number[] {
  return servedCells(state, { requirements: quest.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item)) }, data);
}

export function canDeliverQuest(state: GameState, quest: Quest | string, data: GameData): boolean {
  const view = resolveQuests(state, data).find(view => view.quest.id === (typeof quest === 'string' ? quest : quest.id));
  return view?.status === 'active' && questDeliveryCells(state, view.quest, data).every(index => index >= 0);
}

/** Check the combined preparation and quest graph, the requested items, and chain availability. */
export function questProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    if (!Array.isArray(data.quests)) return ['Quest records are required.'];
    const ids = new Set<string>();
    const graph = new Map<string, string[]>();
    for (const character of data.characters) {
      if (character.singleVisit !== undefined && typeof character.singleVisit !== 'boolean') problems.push(`${character.id}: invalid single visit flag.`);
      if (character.singleVisit && (character.visitor !== true || data.quests.filter(quest => quest?.character === character.id || quest?.companions?.includes(character.id)).length !== 1)) {
        problems.push(`${character.id}: a single visit needs a visitor with exactly one request.`);
      }
      if (character.occasional !== undefined && (typeof character.occasional !== 'boolean' || character.visitor)) problems.push(`${character.id}: invalid occasional customer flag.`);
      if (character.portraitAtlas !== undefined && character.portraitAtlas !== 'guest') problems.push(`${character.id}: unknown portrait atlas.`);
      if (character.orderItems !== undefined && (!Array.isArray(character.orderItems) || !character.orderItems.length
        || new Set(character.orderItems).size !== character.orderItems.length
        || !character.orderItems.every(code => own(data.items, code) && !data.items[code].generator))) problems.push(`${character.id}: invalid order menu.`);
      if (character.occasional && !character.orderItems?.length) problems.push(`${character.id}: occasional customers need an order menu.`);
      // The visit waits for each absent customer's tickets, so a ticket made before the visit opened never meets it.
      if (character.absentDuringQuest !== undefined && !data.quests.some(quest => quest.id === character.absentDuringQuest
        && Array.isArray(quest.waitsForCustomers) && quest.waitsForCustomers.includes(character.id))) problems.push(`${character.id}: the excluded quest must wait for this customer.`);
    }
    for (const [index, task] of data.tasks.entries()) graph.set(`task:${task.id}`, [
      ...(index ? [`task:${data.tasks[index - 1].id}`] : []), ...(task.requiresQuest ? [`quest:${task.requiresQuest}`] : []),
    ]);
    for (const quest of data.quests) {
      if (!quest || typeof quest !== 'object') { problems.push('Every quest needs a record.'); continue; }
      if (!/^[a-z][a-z0-9-]*$/.test(quest.id) || ids.has(quest.id)) problems.push('Quest IDs must be stable and unique.');
      ids.add(quest.id);
      if (!data.characters.some(character => character.id === quest.character) || !quest.title) problems.push(`${quest.id}: unknown character or missing title.`);
      if (quest.afterTask !== null && !data.tasks.some(task => task.id === quest.afterTask)) problems.push(`${quest.id}: unknown opening preparation.`);
      if (quest.afterServed !== undefined && !integer(quest.afterServed, 1)) problems.push(`${quest.id}: invalid service goal.`);
      if (quest.afterQuestServices !== undefined && (!integer(quest.afterQuestServices, 1) || !quest.afterQuest)) problems.push(`${quest.id}: invalid service delay.`);
      if (quest.companions !== undefined && (!Array.isArray(quest.companions) || !quest.companions.length
        || new Set(quest.companions).size !== quest.companions.length
        || !quest.companions.every(id => id !== quest.character && data.characters.some(character => character.id === id && character.visitor)))) problems.push(`${quest.id}: invalid companions.`);
      if (quest.waitsForCustomers !== undefined && (!Array.isArray(quest.waitsForCustomers)
        || new Set(quest.waitsForCustomers).size !== quest.waitsForCustomers.length
        || !quest.waitsForCustomers.every(id => data.characters.some(character => character.id === id && !character.visitor && character.absentDuringQuest === quest.id)))) problems.push(`${quest.id}: invalid waiting customers.`);
      if (!integer(quest.reward, 1)) problems.push(`${quest.id}: invalid coin reward.`);
      for (const scene of [quest.opening, quest.completion]) if (!Array.isArray(scene) || !scene.length
        || !scene.every(line => data.characters.some(character => character.id === line.speaker) && typeof line.text === 'string' && line.text.trim())) problems.push(`${quest.id}: invalid scene.`);
      if (quest.followUp && (!/^[a-z][a-z0-9-]*$/.test(quest.followUp.id) || !quest.followUp.title
        || !integer(quest.followUp.afterServices, 1) || !Array.isArray(quest.followUp.dialogue) || !quest.followUp.dialogue.length
        || !quest.followUp.dialogue.every(line => data.characters.some(character => character.id === line.speaker) && typeof line.text === 'string' && line.text.trim()))) problems.push(`${quest.id}: invalid follow-up scene.`);
      if (!Array.isArray(quest.requirements) || !quest.requirements.length || quest.requirements.reduce((count, requirement) => count + requirement.quantity, 0) > data.board.initial.length) problems.push(`${quest.id}: invalid delivery size.`);
      for (const requirement of quest.requirements) {
        const item = getItem(requirement.item, data);
        if (!item || item.generator || !integer(requirement.quantity, 1, data.board.initial.length)) problems.push(`${quest.id}: invalid requirement.`);
      }
      graph.set(`quest:${quest.id}`, [...(quest.afterTask ? [`task:${quest.afterTask}`] : []), ...questPredecessors(quest, data).map(id => `quest:${id}`)]);
    }
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visiting.has(id)) { problems.push('The preparation and quest prerequisites contain a cycle.'); return; }
      if (visited.has(id)) return;
      const deps = graph.get(id);
      if (!deps) { problems.push(`${id}: unknown prerequisite.`); return; }
      visiting.add(id);
      for (const dependency of deps) visit(dependency);
      visiting.delete(id);
      visited.add(id);
    };
    for (const id of graph.keys()) visit(id);
    const ancestors = (id: string, found = new Set<string>()): Set<string> => {
      for (const dependency of graph.get(id) ?? []) if (!found.has(dependency)) { found.add(dependency); ancestors(dependency, found); }
      return found;
    };
    const starting = availableChains({ taskIndex: 0 }, data);
    for (const quest of data.quests) {
      const before = ancestors(`quest:${quest.id}`);
      for (const requirement of quest.requirements) {
        const item = getItem(requirement.item, data);
        if (item && !starting.includes(item.chain) && !data.tasks.some(task => task.unlock === item.chain && before.has(`task:${task.id}`))) problems.push(`${quest.id}: required chain is not available before activation.`);
      }
    }
  } catch { problems.push('The quest records are malformed.'); }
  return problems;
}

/** The index of the latest preparation that a quest and its predecessors wait for: -1 when it opens in a new game. */
function questOpening(quest: Quest, data: GameData, path = new Set<string>()): number {
  if (path.has(quest.id)) return Infinity;
  path.add(quest.id);
  const opening = Math.max(data.tasks.findIndex(task => task.id === quest.afterTask), ...questPredecessors(quest, data).map(id => {
    const previous = data.quests.find(candidate => candidate.id === id);
    return previous ? questOpening(previous, data, path) : Infinity;
  }));
  path.delete(quest.id);
  return opening;
}

/** Every scene ID: a preparation scene uses the ID of its preparation, and a quest completion scene uses the ID of its quest. */
export const storyScenes = (data: GameData) => [...data.tasks.map(task => task.id), ...data.quests.map(quest => quest.id),
  ...data.chapters.map(chapter => chapter.id), data.finale.id, ...data.quests.flatMap(quest => quest.followUp ? [quest.followUp.id] : [])];

/** The story order of preparation scenes, chapter scenes, and the finale: each chapter scene follows the preparations of its chapter. */
const storyOrder = (data: GameData) => [...data.chapters.flatMap((chapter, index) => [...data.tasks.filter(task => task.chapter === index + 1).map(task => task.id), chapter.id]), data.finale.id];

/** The lines of a scene by its ID, or null for an unknown ID. */
function sceneDialogue(id: string, data: GameData): SceneLine[] | null {
  return data.tasks.find(task => task.id === id)?.dialogue ?? data.quests.find(quest => quest.id === id)?.completion
    ?? data.chapters.find(chapter => chapter.id === id)?.closing ?? (id === data.finale.id ? data.finale.dialogue : null)
    ?? data.quests.find(quest => quest.followUp?.id === id)?.followUp!.dialogue ?? null;
}

/** Completed preparations are the only input. A chapter is complete when its last preparation is complete. */
export function resolveChapters(state: Pick<GameState, 'taskIndex'>, data: GameData): ChapterView[] {
  const current = data.tasks[state.taskIndex]?.chapter ?? data.chapters.length + 1;
  return data.chapters.map((chapter, index) => {
    const number = index + 1, tasks = data.tasks.filter(task => task.chapter === number);
    return { chapter, number, tasks, done: tasks.filter(task => data.tasks.indexOf(task) < state.taskIndex).length,
      status: number < current ? 'complete' : number === current ? 'current' : 'locked' };
  });
}

/** The scenes that the completed preparations and quests have earned. A save can hold only these as pending scenes. */
function earnedScenes(state: Pick<GameState, 'taskIndex' | 'completedQuests' | 'questCompletedAt' | 'served'>, data: GameData): string[] {
  return [...data.tasks.slice(0, state.taskIndex).map(task => task.id), ...state.completedQuests,
    ...resolveChapters(state, data).filter(view => view.status === 'complete').map(view => view.chapter.id),
    ...(state.taskIndex === data.tasks.length ? [data.finale.id] : []),
    ...data.quests.flatMap(quest => quest.followUp && state.completedQuests.includes(quest.id)
      && own(state.questCompletedAt ?? {}, quest.id) && state.served - state.questCompletedAt![quest.id] >= quest.followUp.afterServices ? [quest.followUp.id] : [])];
}

/** Check the chapters, their scenes, their neighbour contributions, and the finale before the content can ship. */
export function storyProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    const { chapters, finale } = data;
    if (!Array.isArray(chapters) || !chapters.length || !finale || typeof finale !== 'object') return ['The story needs chapters and a finale.'];
    const scene = (lines: unknown): lines is SceneLine[] => Array.isArray(lines) && lines.length > 0 && lines.every(line => line && typeof line === 'object'
      && data.characters.some(character => character.id === line.speaker) && typeof line.text === 'string' && line.text.trim());
    const stable = (id: unknown) => typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id);
    const ids = new Set<string>();
    for (const [index, chapter] of chapters.entries()) {
      const label = `Chapter ${index + 1}`;
      if (!chapter || typeof chapter !== 'object') { problems.push(`${label} needs a record.`); continue; }
      if (!stable(chapter.id) || ids.has(chapter.id)) problems.push('Chapter and finale IDs must be stable and unique.');
      ids.add(chapter.id);
      for (const key of ['title', 'objective', 'opening', 'payoff'] as const) if (typeof chapter[key] !== 'string' || !chapter[key].trim()) problems.push(`${label} needs its ${key}.`);
      if (!scene(chapter.closing)) problems.push(`${label}: invalid closing scene.`);
      const tasks = data.tasks.flatMap((task, at) => task.chapter === index + 1 ? [at] : []);
      if (!tasks.length) { problems.push(`${label} has no preparation.`); continue; }
      const quest = data.quests.find(quest => quest.id === chapter.contribution);
      if (!quest) { problems.push(`${label}: unknown neighbour contribution.`); continue; }
      // The contribution opens after the previous chapter closes and before this chapter's last preparation.
      const opening = questOpening(quest, data);
      if (opening < tasks[0] - 1 || opening >= tasks.at(-1)!) problems.push(`${label}: its neighbour contribution must open during the chapter.`);
    }
    if (data.tasks.some((task, at) => !integer(task.chapter, 1, chapters.length) || (at > 0 && task.chapter < data.tasks[at - 1].chapter))) {
      problems.push('Every preparation needs a known chapter, in story order.');
    }
    if (!stable(finale.id) || ids.has(finale.id)) problems.push('Chapter and finale IDs must be stable and unique.');
    if (typeof finale.title !== 'string' || !finale.title.trim() || typeof finale.ending !== 'string' || !finale.ending.trim()) problems.push('The finale needs a title and an ending.');
    if (!scene(finale.dialogue)) problems.push('The finale has an invalid scene.');
    for (const character of data.characters.filter(character => !character.visitor && !character.occasional)) {
      if (!scene(finale.dialogue) || !finale.dialogue.some(line => line.speaker === character.id)) problems.push(`The finale must include ${character.name}.`);
      if (!chapters.some(chapter => data.quests.find(quest => quest.id === chapter?.contribution)?.character === character.id)) problems.push(`${character.name} needs a chapter contribution.`);
    }
    if (new Set(storyScenes(data)).size !== storyScenes(data).length) problems.push('Story scene IDs must be unique.');
  } catch { problems.push('The story records are malformed.'); }
  return problems;
}

export function saleValue(code: string, data: GameData) {
  const item = getItem(code, data);
  return item && !item.generator ? Math.max(1, Math.floor(item.price / 4)) : 0;
}

/** Check the authored prices and work before the content can ship. */
export function economyProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    for (const item of Object.values(data.items)) {
      if (!integer(item.price, item.generator ? 0 : 1, item.generator ? 0 : 500_000_000)) problems.push(`${item.id}: invalid menu price.`);
    }
    for (const task of data.tasks) {
      const work = task.work;
      if (!work || typeof work !== 'object' || Array.isArray(work) || typeof work.summary !== 'string' || !work.summary.trim()
        || !integer(work.materials) || !integer(work.labour) || typeof work.hours !== 'number' || !integer(work.hours * 2, 1)) {
        problems.push(`${task.id}: invalid work scope, costs, or half-hour labour estimate.`);
        continue;
      }
      if (!integer(task.cost) || task.cost !== work.materials + work.labour) problems.push(`${task.id}: cost must equal materials plus labour.`);
    }
  } catch { problems.push('The economy records are malformed.'); }
  return problems;
}

export function currentTask(state: GameState, data: GameData): Task | null {
  return data.tasks[state.taskIndex] ?? null;
}

/** Goals use the recorded lifetime totals. They never reopen a completed preparation. */
export function taskGoalProblems(data: GameData): string[] {
  const problems: string[] = [];
  let previous = { served: 0, merges: 0 };
  for (const task of data.tasks) {
    if (!task.goals || !integer(task.goals.served) || !integer(task.goals.merges)) {
      problems.push(`${task.id}: service and merge goals must be supported nonnegative integers.`);
      continue;
    }
    if (task.goals.served < previous.served || task.goals.merges < previous.merges) problems.push(`${task.id}: service and merge goals must not decrease.`);
    previous = task.goals;
  }
  return problems;
}

/** The interface and completion use the same coin, lifetime goal, quest, and placement checks. */
export function taskEligibility(state: GameState, data: GameData): TaskEligibility {
  const task = currentTask(state, data);
  if (!task) return { task: null, ready: false, requirements: [], blockers: ['The community supper is ready. You can keep serving orders.'] };
  const requirements: TaskRequirement[] = [
    { kind: 'coins', current: state.coins, required: task.cost, met: state.coins >= task.cost },
    { kind: 'served', current: state.served, required: task.goals.served, met: state.served >= task.goals.served },
    { kind: 'merges', current: state.merges, required: task.goals.merges, met: state.merges >= task.goals.merges },
  ];
  const blockers: string[] = [];
  const coins = task.cost - state.coins;
  const served = task.goals.served - state.served;
  const merges = task.goals.merges - state.merges;
  if (coins > 0) blockers.push(`Earn ${coins} more ${coins === 1 ? 'coin' : 'coins'} to pay for this preparation.`);
  if (served > 0) blockers.push(`Serve ${served} more ${served === 1 ? 'order' : 'orders'} for this preparation.`);
  if (merges > 0) blockers.push(`Make ${merges} more ${merges === 1 ? 'merge' : 'merges'} for this preparation.`);
  if (task.requiresQuest) {
    const title = data.quests.find(quest => quest.id === task.requiresQuest)?.title ?? task.requiresQuest;
    const met = questDone(state, task.requiresQuest);
    requirements.push({ kind: 'quest', questId: task.requiresQuest, title, met });
    if (!met) blockers.push(`Complete the quest "${title}" before this preparation.`);
  }
  if (task.unlock) {
    const source = data.items[`generator_${task.unlock}`].name;
    const met = firstFreeBoardCell(state, data) !== -1;
    requirements.push({ kind: 'space', source, met });
    if (!met) blockers.push(`Free a space on the board for the ${source}.`);
  }
  return { task, ready: blockers.length === 0, requirements, blockers };
}

/** Every output earned by this source. Completed preparations are the only tier input. */
export function generatorOutputs(state: Pick<GameState, 'taskIndex'>, generatorCode: string, data: GameData): string[] {
  const item = own(data.items, generatorCode) ? data.items[generatorCode] : null;
  if (!item?.generator || !availableChains(state, data).includes(item.chain)) return [];
  const completed = data.tasks.slice(0, state.taskIndex).map(task => task.id);
  return [...item.generator.outputs, ...data.generatorTiers.filter(tier => tier.chain === item.chain && completed.includes(tier.after))
    .sort((a, b) => a.stage - b.stage).map(tier => `${tier.chain}_${tier.stage}`)];
}

/** The output that one tap on this source takes: the output that the player last took. Null for an item that is not a source. */
export function nextOutput(state: Pick<GameState, 'outputChoices'>, generatorCode: string, data: GameData): string | null {
  const item = getItem(generatorCode, data);
  if (!item?.generator) return null;
  return state.outputChoices[item.chain] ?? item.generator.outputs[0];
}

/** Check each production tier before the content generator writes its data. */
export function generatorTierProblems(data: GameData): string[] {
  const problems: string[] = [];
  const starting = availableChains({ taskIndex: 0 }, data);
  for (const tier of data.generatorTiers) {
    const source = data.items[`generator_${tier.chain}`];
    const item = data.items[`${tier.chain}_${tier.stage}`];
    const after = data.tasks.findIndex(task => task.id === tier.after);
    const unlock = starting.includes(tier.chain) ? -1 : data.tasks.findIndex(task => task.unlock === tier.chain);
    if (!data.chains.some(chain => chain.id === tier.chain) || !source?.generator || !item || item.generator
      || item.chain !== tier.chain || item.stage !== tier.stage || !integer(tier.stage, 2, 3)) problems.push(`${tier.chain}: invalid production stage.`);
    if (after < 0 || (!starting.includes(tier.chain) && unlock < 0) || after < unlock) problems.push(`${tier.chain}: invalid production preparation.`);
  }
  for (const chain of data.chains) {
    const tiers = data.generatorTiers.filter(tier => tier.chain === chain.id)
      .sort((a, b) => data.tasks.findIndex(task => task.id === a.after) - data.tasks.findIndex(task => task.id === b.after));
    let previousStage = 1;
    let previousPreparation = -1;
    for (const tier of tiers) {
      const preparation = data.tasks.findIndex(task => task.id === tier.after);
      if (tier.stage !== previousStage + 1 || preparation <= previousPreparation) problems.push(`${chain.id}: production stages must increase in preparation order.`);
      previousStage = tier.stage;
      previousPreparation = preparation;
    }
  }
  return problems;
}

/** The place of a state's preparation in the campaign: 0 for the new game, then the preparation's number. */
const stateNumber = (state: RoomState, data: GameData) => state.after === null ? 0 : data.tasks.findIndex(task => task.id === state.after) + 1;

/**
 * The bistro as the completed preparations leave it: every area, whether it is open, and the state it shows.
 * Completed preparations are the only input, so reading the rooms never changes the game.
 */
export function resolveRooms(completed: readonly string[], data: GameData, painted: readonly string[] = roomPaintings): RoomView[] {
  const done = new Set(completed);
  return data.areas.map(area => {
    const open = area.unlock === null || done.has(area.unlock);
    const states = open ? data.rooms.filter(state => state.area === area.id && (state.after === null || done.has(state.after)))
      .sort((a, b) => stateNumber(a, data) - stateNumber(b, data)) : [];
    return { ...area, open, states, current: states.at(-1) ?? null, painting: states.findLast(state => painted.includes(state.id)) ?? null };
  });
}

/** The area of the latest change, which the room shows unless the player chooses another open area. */
export function latestArea(completed: readonly string[], data: GameData): string {
  const done = new Set(completed);
  const earned = data.rooms.filter(state => state.after === null || done.has(state.after));
  return earned.reduce((latest, state) => stateNumber(state, data) > stateNumber(latest, data) ? state : latest).area;
}

/** Missing choices use their authored defaults. Locked slots are visible only as explanations. */
export function resolveDecorations(completed: readonly string[], choices: Readonly<Record<string, string>>, data: GameData): DecorationView[] {
  return data.decorationSlots.map(slot => {
    const unlocked = completed.includes(slot.unlock);
    const choice = unlocked && Object.hasOwn(choices, slot.id) ? choices[slot.id] : slot.default;
    const selected = slot.variants.find(variant => variant.id === choice);
    if (!selected) throw new Error(`Unknown choice for ${slot.id}.`);
    return { ...slot, unlocked, selected };
  });
}

/** Check authored choices before packaging their data and approved images. Without knownImages, the image names are not checked. */
export function decorationProblems(data: GameData, knownImages?: readonly string[]): string[] {
  const problems: string[] = [];
  const slots = data.decorationSlots;
  if (new Set(slots.map(slot => slot.id)).size !== slots.length) problems.push('Decoration slot IDs must be unique.');
  for (const slot of slots) {
    const area = data.areas.find(area => area.id === slot.area);
    const unlock = data.tasks.findIndex(task => task.id === slot.unlock);
    if (!/^[a-z][a-z0-9-]*$/.test(slot.id) || !slot.name) problems.push('Every decoration slot needs a stable ID and a name.');
    if (!area || unlock < 0 || (area.unlock !== null && data.tasks.findIndex(task => task.id === area.unlock) > unlock)) problems.push(`${slot.id}: invalid area or preparation.`);
    if (slot.variants.length < 2 || new Set(slot.variants.map(variant => variant.id)).size !== slot.variants.length) problems.push(`${slot.id}: needs at least two variants with unique IDs.`);
    if (!slot.variants.some(variant => variant.id === slot.default)) problems.push(`${slot.id}: unknown default.`);
    for (const variant of slot.variants) {
      if (!/^[a-z][a-z0-9-]*$/.test(variant.id) || !variant.name || (knownImages && !knownImages.includes(variant.image))) problems.push(`${slot.id}: invalid variant or missing image.`);
    }
    const { x, y, width, height } = slot.crop;
    if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 100 || y + height > 100) problems.push(`${slot.id}: crop must be inside the painting.`);
  }
  return problems;
}

/** Checks the authored rooms against the preparations and the approved paintings. An empty list means every checkpoint resolves. */
export function roomProblems(data: GameData, painted: readonly string[] = roomPaintings): string[] {
  const problems: string[] = [];
  const order = new Map(data.tasks.map((task, index) => [task.id, index]));
  const known = (id: string | null) => id === null || order.has(id);
  const areas = new Set(data.areas.map(area => area.id));
  if (areas.size !== data.areas.length) problems.push('Area IDs must be unique.');
  if (data.areas[0]?.unlock !== null) problems.push('The first area must be open from the start.');
  for (const area of data.areas) if (!area.name || !known(area.unlock)) problems.push(`${area.id}: needs a name and a known preparation.`);
  if (new Set(data.rooms.map(state => state.id)).size !== data.rooms.length) problems.push('Room state IDs must be unique.');
  for (const state of data.rooms) {
    if (!areas.has(state.area)) problems.push(`${state.id}: unknown area ${state.area}.`);
    if (!known(state.after)) { problems.push(`${state.id}: unknown preparation.`); continue; }
    // The painting of a state is named after its area and its preparation, so a typing error cannot hide behind the fallback.
    if (state.id !== `${state.area}-${String(stateNumber(state, data)).padStart(2, '0')}`) problems.push(`${state.id}: must be named after its area and its preparation.`);
    const inside = (point: { x: number; y: number } | undefined) => [point?.x, point?.y].every(value => Number.isFinite(value) && value! >= 0 && value! <= 100);
    if (!inside(state.focus)) problems.push(`${state.id}: needs a focus inside its painting.`);
    if (!inside(state.mark)) problems.push(`${state.id}: needs a pin mark inside its painting.`);
    if (!state.label || state.label.length > 28) problems.push(`${state.id}: needs a short label of at most 28 characters.`);
    if (!state.text) problems.push(`${state.id}: needs a description.`);
  }
  for (const area of data.areas) {
    const states = data.rooms.filter(state => state.area === area.id && known(state.after)).sort((a, b) => stateNumber(a, data) - stateNumber(b, data));
    // An area shows nothing before it opens, starts with a state when it opens, and that first state always has a painting to fall back on.
    if (states[0]?.after !== area.unlock) problems.push(`${area.id}: needs its first state when it opens, and no state before.`);
    else if (!painted.includes(states[0].id)) problems.push(`${area.id}: needs a painting for its first state.`);
  }
  // Each preparation changes one room, which the player can see or read about.
  for (const task of data.tasks) {
    const changes = data.rooms.filter(state => state.after === task.id).length;
    if (changes !== 1) problems.push(`${task.id}: ${changes ? 'changes the rooms more than once' : 'changes nothing in the rooms'}.`);
  }
  return problems;
}

/**
 * Every check of the authored data. The content generator refuses to write data with a problem, and the game refuses to start on it,
 * so the rules and the save validation can rely on valid data. Without knownImages, the decoration image names are not checked.
 */
export function dataProblems(data: GameData, knownImages?: readonly string[]): string[] {
  try {
    if (data.board.columns !== 6 || data.board.rows !== 7 || !Array.isArray(data.board.initial) || data.board.initial.length !== 42) {
      return ['The board needs six columns, seven rows, and 42 starting spaces.'];
    }
    const problems = [...boardLayoutProblems(data), ...roomProblems(data), ...decorationProblems(data, knownImages), ...generatorTierProblems(data), ...levelRewardProblems(data),
      ...questProblems(data), ...storyProblems(data), ...taskGoalProblems(data), ...economyProblems(data)];
    // The save validation relies on the other checks, so it judges the new game only after they pass.
    if (!problems.length && !validateGame(createGame(data), data)) problems.push('The starting board does not make a valid new game.');
    return problems;
  } catch { return ['The game data is malformed.']; }
}

export function boardLayoutProblems(data: GameData): string[] {
  const problems: string[] = [];
  const layouts = data.board.layouts;
  if (!Array.isArray(layouts) || !layouts.length || !layouts.some(layout => layout.id === data.board.defaultLayout)) return ['The board needs a default layout.'];
  const ids = new Set<string>();
  const startingChains = new Set(data.board.initial.filter(present).flatMap(code => data.items[code]?.generator ? [data.items[code].chain] : []));
  for (const layout of layouts) {
    if (!layout || typeof layout.id !== 'string' || !layout.id || ids.has(layout.id) || !Array.isArray(layout.obstacles)) {
      problems.push('Board layout IDs must be unique, and each layout needs obstacles.');
      continue;
    }
    ids.add(layout.id);
    const obstacleIds = new Set<string>();
    const positions = new Set<number>();
    for (const obstacle of layout.obstacles) {
      if (!obstacle || typeof obstacle.id !== 'string' || !obstacle.id || obstacleIds.has(obstacle.id)
        || !integer(obstacle.position, 0, data.board.initial.length - 1) || positions.has(obstacle.position)
        || typeof obstacle.name !== 'string' || !obstacle.name.trim()
        || !['clutter', 'anchored'].includes(obstacle.type)
        || data.board.initial[obstacle.position] !== null
        || !own(data.items, obstacle.ingredient) || data.items[obstacle.ingredient].generator
        || !startingChains.has(data.items[obstacle.ingredient].chain) || !data.items[obstacle.ingredient].next) {
        problems.push(`Board layout ${layout.id} has an invalid obstacle.`);
        continue;
      }
      obstacleIds.add(obstacle.id);
      positions.add(obstacle.position);
    }
    for (const obstacle of layout.obstacles) if (obstacle?.type === 'clutter' && integer(obstacle.position, 0, data.board.initial.length - 1)) {
      const row = Math.floor(obstacle.position / data.board.columns);
      const column = obstacle.position % data.board.columns;
      const sides = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1]];
      if (!sides.some(([y, x]) => y >= 0 && y < data.board.rows && x >= 0 && x < data.board.columns
        && !layout.obstacles.some(other => other.position === y * data.board.columns + x && other.type === 'clutter'))) {
        problems.push(`Board layout ${layout.id} has clutter without a free side.`);
      }
    }
  }
  const batches = data.board.preparations;
  if (!Array.isArray(batches) || batches.length !== data.tasks.length) return [...problems, 'Every preparation needs a blocker batch.'];
  const obstacleIds = new Set(layouts.flatMap(layout => layout.obstacles.map(obstacle => obstacle.id)));
  for (const [index, batch] of batches.entries()) {
    if (!batch || batch.after !== data.tasks[index].id || typeof batch.context !== 'string' || !batch.context.trim()
      || !Array.isArray(batch.obstacles) || batch.obstacles.length < 2 || batch.obstacles.length > 3) {
      problems.push('Each preparation needs two or three contextual blockers in story order.');
      continue;
    }
    const chains = availableChains({ taskIndex: index + 1 }, data);
    for (const obstacle of batch.obstacles) {
      if (!obstacle || typeof obstacle.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(obstacle.id) || obstacleIds.has(obstacle.id)
        || typeof obstacle.name !== 'string' || !obstacle.name.trim() || !['clutter', 'anchored'].includes(obstacle.type)
        || !own(data.items, obstacle.ingredient) || data.items[obstacle.ingredient].generator || !data.items[obstacle.ingredient].next
        || !chains.includes(data.items[obstacle.ingredient].chain)
        || (obstacle.atlas !== undefined && obstacle.atlas !== 'preparation')
        || (obstacle.type === 'clutter' && !integer(obstacle.sprite, 0, obstacle.atlas === 'preparation' ? 11 : 3))) {
        problems.push(`Preparation ${batch.after} has an invalid blocker.`);
      }
      if (obstacle) obstacleIds.add(obstacle.id);
    }
  }
  return problems;
}

/** The board cells that a serve empties: the first free matching cell for each item, or -1 if there is none. */
export function servedCells(state: GameState, order: Pick<Order, 'requirements'>, data: GameData) {
  const taken: number[] = [];
  for (const code of order.requirements) taken.push(state.board.findIndex((cell, index) => cell?.code === code && !unresolvedObstacle(state, index, data) && !taken.includes(index)));
  return taken;
}

export function canServe(state: GameState, order: Pick<Order, 'requirements'> | null | undefined, data: GameData) {
  if (!order || !Array.isArray(order.requirements) || !order.requirements.length) return false;
  const counts = new Map<string, number>();
  for (const [index, cell] of state.board.entries()) if (cell && !unresolvedObstacle(state, index, data)) counts.set(cell.code, (counts.get(cell.code) ?? 0) + 1);
  for (const code of order.requirements) {
    const count = counts.get(code);
    if (!own(data.items, code) || data.items[code].generator || !count) return false;
    counts.set(code, count - 1);
  }
  return true;
}

function validateQuestProgress(state: GameState, data: GameData): boolean {
  const complete = state.completedQuests;
  if (!Array.isArray(complete) || complete.length > data.quests.length
    || new Set(complete).size !== complete.length) return false;
  const completedAt = state.questCompletedAt;
  if (completedAt !== undefined && (!completedAt || typeof completedAt !== 'object' || Array.isArray(completedAt)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(completedAt))
    || !Object.entries(completedAt).every(([id, service]) => complete.includes(id) && integer(service, 0, state.served)))) return false;
  const done = new Set<string>();
  for (const id of complete) {
    const quest = data.quests.find(quest => quest.id === id);
    if (!quest || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask)) || state.served < (quest.afterServed ?? 0)
      || !questPredecessors(quest, data).every(previous => done.has(previous))) return false;
    if (own(completedAt ?? {}, id) && completedAt![id] < (quest.afterServed ?? 0)) return false;
    if (quest.afterQuestServices !== undefined && (!questServiceGate(state, quest)
      || !own(completedAt ?? {}, id) || completedAt![id] - completedAt![quest.afterQuest!] < quest.afterQuestServices)) return false;
    if (questPredecessors(quest, data).some(previous => own(completedAt ?? {}, previous) && own(completedAt ?? {}, id)
      && completedAt![previous] > completedAt![id])) return false;
    done.add(id);
  }
  for (const task of data.tasks.slice(0, state.taskIndex)) if (task.requiresQuest && !done.has(task.requiresQuest)) return false;
  return true;
}

const BREAD_TASTING = 'ilie-bread-tasting', TASTING_ITEMS = ['quest_bread_source', 'quest_bread_1', 'quest_bread_2', 'quest_bread_3'];
/**
 * A save in the current format can hold the borrowed bread tasting, which the game does not have: its record of borrowed sources,
 * its tasting source and items on the board, and its quest and scene records. This removes them before validation and keeps all other
 * progress, including the coins of a delivered tasting. Another value is returned unchanged.
 */
export function removeBreadTasting(candidate: unknown): unknown {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return candidate;
  const state: Record<string, unknown> = { ...candidate };
  delete state.activeQuestProducers;
  const tasting = (value: unknown) => typeof value === 'string' && (TASTING_ITEMS.includes(value) || value === BREAD_TASTING);
  if (Array.isArray(state.board)) state.board = state.board.map(cell => cell && typeof cell === 'object' && tasting((cell as Cell).code) ? null : cell);
  for (const key of ['discovered', 'completedQuests', 'pendingScenes']) if (Array.isArray(state[key])) state[key] = (state[key] as unknown[]).filter(value => !tasting(value));
  for (const key of ['questCompletedAt', 'sceneLines']) {
    const record = state[key];
    if (record && typeof record === 'object' && !Array.isArray(record) && Object.hasOwn(record, BREAD_TASTING)) {
      const rest: Record<string, unknown> = { ...record };
      delete rest[BREAD_TASTING];
      state[key] = rest;
    }
  }
  return state;
}

/** Accepts an untrusted save: a parsed save is checked field by field before it is treated as a game state. The data must pass dataProblems. */
export function validateGame(candidate: unknown, data: GameData): candidate is GameState {
  try {
    const state = candidate as GameState;
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== 9) return false;
    if (!Array.isArray(state.board) || state.board.length !== data.board.columns * data.board.rows) return false;
    if (!([state.coins, state.xp, state.served, state.merges] as unknown[]).every(value => integer(value))) return false;
    if (!integer(state.seed, 0, 4294967295) || !integer(state.nextOrderId, 4)) return false;
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
        || (progress?.placed.filter(placement => !state.resolvedObstacles.includes(placement.id)).length ?? 0) > 3) return false;
      const clutter = new Set(blocked.filter(obstacle => obstacle.type === 'clutter').map(obstacle => obstacle.position));
      if ([...clutter].some(at => !adjacentPositions(at, data).some(side => !clutter.has(side)))) return false;
    }
    const cells = state.board.filter(present);
    for (const chain of chains) {
      if (cells.filter(cell => getItem(cell.code, data)?.generator && getItem(cell.code, data)?.chain === chain).length !== 1) return false;
    }
    if (!Array.isArray(state.discovered) || state.discovered.length > Object.keys(data.items).length
      || new Set(state.discovered).size !== state.discovered.length
      || !state.discovered.every(code => own(data.items, code) && chains.includes(data.items[code].chain))
      || !cells.every(cell => state.discovered.includes(cell.code))) return false;
    {
      if (boardObstacles(state, data).some(obstacle => (obstacle.type === 'anchored' || state.resolvedObstacles.includes(obstacle.id))
        && !state.discovered.includes(obstacle.ingredient))) return false;
    }
    if (!Array.isArray(state.orders) || state.orders.length !== 3) return false;
    if (new Set(state.orders.map(order => order?.id)).size !== 3) return false;
    for (const order of state.orders) {
      if (!order || typeof order !== 'object' || typeof order.id !== 'string' || !/^order_[1-9]\d*$/.test(order.id)) return false;
      const number = Number(order.id.slice(6));
      if (!integer(number, 1, state.nextOrderId - 1)) return false;
      if (!data.characters.some(character => character.id === order.customer && !character.visitor)) return false;
      if (!Array.isArray(order.requirements) || order.requirements.length < 1 || order.requirements.length > 2) return false;
      if (!order.requirements.every(code => own(data.items, code) && !data.items[code].generator
        && chains.includes(data.items[code].chain))) return false;
      const customer = data.characters.find(character => character.id === order.customer)!;
      if (customer.orderItems && !order.requirements.every(code => customer.orderItems!.includes(code))) return false;
      if (order.pricing !== 'menu-1' || order.reward !== menuReward(order.requirements, data)) return false;
    }
    if (!Array.isArray(state.decorations) || state.decorations.length !== state.taskIndex
      || !state.decorations.every((id, index) => id === data.tasks[index].id)) return false;
    const choices = state.decorationChoices;
    if (!choices || typeof choices !== 'object' || Array.isArray(choices)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(choices))) return false;
    for (const [id, value] of Object.entries(choices)) {
      const slot = data.decorationSlots.find(slot => slot.id === id);
      if (!slot || !state.decorations.includes(slot.unlock) || typeof value !== 'string'
        || !slot.variants.some(variant => variant.id === value)) return false;
    }
    const outputs = state.outputChoices;
    if (!outputs || typeof outputs !== 'object' || Array.isArray(outputs)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(outputs)) || Object.keys(outputs).length > chains.length) return false;
    for (const [chain, code] of Object.entries(outputs)) {
      if (!chains.includes(chain) || !own(data.items, code) || data.items[code].generator
        || data.items[code].chain !== chain || data.items[code].stage < 2
        || !generatorOutputs(state, `generator_${chain}`, data).includes(code)) return false;
    }
    if (!Array.isArray(state.claimedLevelRewards)
      || state.claimedLevelRewards.length > data.levelRewards.length
      || new Set(state.claimedLevelRewards).size !== state.claimedLevelRewards.length) return false;
    return [...state.claimedLevelRewards].every(id => typeof id === 'string'
      && data.levelRewards.some(reward => reward.id === id && reward.level <= getLevel(state)));
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
      if (!quest || !canDeliverQuest(next, quest, data)) return fail('This quest needs every required item on the board. Check that the quest is still active.');
      if (!integer(next.coins + quest.reward)) return fail('Spend some coins before you deliver this quest.');
      for (const index of questDeliveryCells(next, quest, data)) next.board[index] = null;
      next.completedQuests.push(quest.id);
      next.pendingScenes.push(quest.id);
      (next.questCompletedAt ??= {})[quest.id] = next.served;
      next.coins += quest.reward;
      message = `${quest.title}: delivered. Earned ${quest.reward} coins.`;
      break;
    }
    case 'claimLevelReward': {
      const reward = data.levelRewards.find(reward => reward.id === action.id);
      if (!reward) return fail('Choose a known level reward.');
      if (!availableLevelRewards(next, data).includes(reward)) {
        return fail(getLevel(next) < reward.level ? `Reach level ${reward.level} to claim this reward.` : 'This level reward is already claimed.');
      }
      if (!integer(next.coins + reward.coins)) return fail('Spend some coins before you claim this reward.');
      next.coins += reward.coins;
      next.claimedLevelRewards.push(reward.id);
      message = `Claimed level ${reward.level}: ${reward.coins} coins.`;
      break;
    }
    case 'decorate': {
      const slot = data.decorationSlots.find(slot => slot.id === action.slot);
      if (!slot) return fail('Choose a known decoration.');
      if (!next.decorations.includes(slot.unlock)) return fail('Complete the preparation for this decoration first.');
      const variant = slot.variants.find(variant => variant.id === action.variant);
      if (!variant) return fail('Choose a variant of this decoration.');
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
      const dialogue = next.pendingScenes.includes(action.id) ? sceneDialogue(action.id, data) : null;
      if (!dialogue || !integer(action.line, 0, dialogue.length - 1)) return fail('This scene line is not available.');
      if (action.line) (next.sceneLines ??= {})[action.id] = action.line;
      else forgetLine(next, action.id);
      break;
    }
    case 'move': {
      const source = itemAt(next, action.from);
      if (!integer(action.from, 0, next.board.length - 1) || !integer(action.to, 0, next.board.length - 1)
        || action.from === action.to || !source) return fail('Choose an item and a different space.');
      if (unresolvedObstacle(next, action.from, data)) return fail('This item is tied to the workbench. Merge a matching item into this space.');
      const obstacle = unresolvedObstacle(next, action.to, data);
      const target = next.board[action.to];
      const item = getItem(source.code, data)!;
      if (obstacle?.type === 'clutter') return fail('This space is covered. Merge beside it to clear it.');
      if (obstacle?.type === 'anchored' && obstacle.ingredient !== source.code) return fail('Merge a matching item into this tied space.');
      if ((target?.code === source.code || obstacle?.type === 'anchored') && !item.generator) {
        if (!item.next) return fail(`${item.name} is a final dish. Serve it to a neighbour or sell it.`);
        next.board[action.to] = { code: item.next };
        next.board[action.from] = null;
        if (obstacle) next.resolvedObstacles.push(obstacle.id);
        revealAdjacentClutter(next, action.to, data);
        next.merges++;
        next.xp++;
        discover(next, item.next);
        event = 'merge';
        message = `Made ${getItem(item.next, data)!.name}.`;
      } else {
        if (obstacle) return fail('Merge a matching item into this tied space.');
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
      const code = action.output === undefined ? nextOutput(next, item.id, data)! : action.output;
      if (!generatorOutputs(next, item.id, data).includes(code)) return fail('Choose an available output from this source.');
      const empty = firstFreeBoardCell(next, data);
      if (empty === -1) return fail('The board is full. Merge, serve, or sell an item.');
      next.board[empty] = { code };
      if (data.items[code].stage === 1) delete next.outputChoices[item.chain];
      else next.outputChoices[item.chain] = code;
      discover(next, code);
      message = `Took ${getItem(code, data)!.name}.`;
      break;
    }
    case 'serve': {
      const orderIndex = next.orders.findIndex(order => order.id === action.id);
      if (orderIndex === -1) return fail('This order is no longer available.');
      const order = next.orders[orderIndex];
      if (!canServe(next, order, data)) return fail('Put every item in this order on the board first.');
      if (!integer(next.coins + order.reward)) return fail('Spend some coins before you serve this order.');
      // An older current-format save has no delivery counters. Start its delay with this service, without inventing past progress.
      for (const quest of data.quests) if ((quest.afterQuestServices !== undefined || quest.followUp) && (quest.afterQuest || quest.followUp)) {
        const id = quest.afterQuestServices !== undefined ? quest.afterQuest! : quest.id;
        if (next.completedQuests.includes(id) && !own(next.questCompletedAt ?? {}, id)) (next.questCompletedAt ??= {})[id] = next.served;
      }
      for (const index of servedCells(next, order, data)) next.board[index] = null;
      next.coins += order.reward;
      next.xp += order.requirements.reduce((sum, code) => sum + data.items[code].stage * 4, 0);
      next.served++;
      next.orders[orderIndex] = makeOrder(next, data, next.orders.map(waiting => waiting.customer));
      for (const quest of data.quests) if (quest.followUp && next.completedQuests.includes(quest.id)
        && own(next.questCompletedAt ?? {}, quest.id) && next.served - next.questCompletedAt![quest.id] === quest.followUp.afterServices) next.pendingScenes.push(quest.followUp.id);
      message = `Served ${data.characters.find(person => person.id === order.customer)?.name ?? 'the order'}. Earned ${order.reward} coins.`;
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
      next.xp += 20;
      next.decorations.push(task.id);
      // The payment queues the preparation scene, then the closing scene of a completed chapter, then the finale, in the same change.
      next.pendingScenes.push(task.id);
      if (resolveChapters(next, data)[task.chapter - 1].status === 'complete') next.pendingScenes.push(data.chapters[task.chapter - 1].id);
      if (next.taskIndex === data.tasks.length) next.pendingScenes.push(data.finale.id);
      for (const chain of availableChains(next, data)) {
        const code = `generator_${chain}`;
        const before = generatorOutputs(state, code, data);
        for (const output of generatorOutputs(next, code, data)) {
          if (data.items[output].stage > 1 && !before.includes(output)) message += ` The ${data.items[code].name} can now make ${data.items[output].name}.`;
        }
      }
      break;
    }
    case 'sell': {
      const cell = itemAt(next, action.index);
      if (!cell) return fail('Choose an item to sell.');
      if (unresolvedObstacle(next, action.index, data)) return fail('This item is tied to the workbench. Merge a matching item into this space.');
      const item = getItem(cell.code, data)!;
      if (item.generator) return fail(`The ${item.name} can't be sold. Move it instead.`);
      const coins = saleValue(cell.code, data);
      if (!integer(next.coins + coins)) return fail('Spend some coins before you sell this item.');
      next.coins += coins;
      next.board[action.index] = null;
      message = `Sold ${item.name} for ${coins} ${coins === 1 ? 'coin' : 'coins'}.`;
      break;
    }
    default: return fail('This action is not available.');
  }
  if (['task', 'move', 'spawn', 'serve', 'sell', 'deliverQuest'].includes(action.type)) {
    const placed = placePreparationObstacles(next, data);
    if (action.type === 'task') message += ` ${data.board.preparations[next.taskIndex - 1].context}`;
    if (placed) message += ` ${placed} preparation ${placed === 1 ? 'blocker' : 'blockers'} placed.`;
    const pending = pendingPreparationObstacles(next, data).length;
    if (action.type === 'task' && pending) message += ` ${pending} ${pending === 1 ? 'blocker waits' : 'blockers wait'} for safe space.`;
  }
  return { state: next, ok: true, message, event };
}
