// Original deterministic merge-game rules for the bistro browser game.
export type Item = { id: string; name: string; chain: string; stage: number; next: string | null; sprite: number; price: number; generator?: { outputs: string[] } };
export type SceneLine = { speaker: string; text: string };
/**
 * A person of the bistro. The core characters drive the story. A regular (spec 010) is a neighbour who arrives with the preparation that
 * arrivesAfter names, or is present from the start; arrival plays a short scene, and prefers names the two chains whose dishes they like.
 */
export type Character = {
  id: string; name: string; role: string; introduction: string; sprite: number; visitor?: boolean; singleVisit?: boolean;
  portraitAtlas?: PortraitAtlas; regular?: boolean; arrivesAfter?: string; prefers?: string[]; arrival?: SceneLine[];
};
const portraitAtlases = ['guest', 'regulars-1', 'regulars-2', 'regulars-3'] as const;
export type PortraitAtlas = typeof portraitAtlases[number];
export type Task = { id: string; chapter: number; title: string; cost: number; work: { summary: string; materials: number; labour: number; hours: number }; dialogue: SceneLine[]; unlock?: string };
export type TaskRequirement =
  | { kind: 'coins' | 'quests'; current: number; required: number; met: boolean }
  | { kind: 'space'; source: string; met: boolean };
export type TaskEligibility = { task: Task | null; ready: boolean; requirements: TaskRequirement[]; blockers: string[] };
/**
 * A quest from a character. It opens after the preparation that afterTask names (null: in a new game), after afterQuest, and after
 * the earlier quests of its character. Unlocks names a decoration finish that the delivery adds. A follow-up scene is earned after
 * afterDeliveries further deliveries.
 */
export type Quest = {
  id: string; character: string; title: string; afterTask: string | null; afterQuest?: string;
  requirements: { item: string; quantity: number }[]; reward: number; opening: SceneLine[]; completion: SceneLine[];
  companions?: string[]; unlocks?: { slot: string; variant: string };
  followUp?: { id: string; title: string; afterDeliveries: number; dialogue: SceneLine[] };
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
/** Active: on one of the three tickets. Waiting: open, until a ticket is free. */
export type QuestView = { quest: Quest; status: 'active' | 'waiting' | 'locked' | 'complete' };
/** A room of the bistro. The first area is open from the start; another opens with the preparation named by unlock. */
export type Area = { id: string; name: string; unlock: string | null };
export type DecorationVariant = { id: string; name: string; image: string };
export type DecorationSlot = {
  id: string; name: string; area: string; unlock: string; default: string; variants: DecorationVariant[];
  crop: { x: number; y: number; width: number; height: number };
};
export type DecorationView = DecorationSlot & { unlocked: boolean; selected: DecorationVariant };
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
  board: { columns: number; rows: number; initial: (string | null)[]; defaultLayout: string; layouts: BoardLayout[]; preparations: PreparationObstacleBatch[] };
  chains: { id: string; name: string }[]; items: Record<string, Item>; characters: Character[]; chapters: Chapter[]; finale: Finale; tasks: Task[];
  areas: Area[]; rooms: RoomState[]; decorationSlots: DecorationSlot[];
  generatorTiers: { chain: string; stage: number; after: string }[];
  quests: Quest[];
};
/**
 * An area as the completed preparations leave it. States are the earned states in order; current is the latest of them.
 * Painting is the latest earned state that has a painting, so it is current unless current waits for its master.
 */
export type RoomView = Area & { open: boolean; states: RoomState[]; current: RoomState | null; painting: RoomState | null };
export type Cell = { code: string };
export type GameState = {
  version: 12; board: (Cell | null)[]; coins: number; taskIndex: number;
  discovered: string[]; decorations: string[];
  decorationChoices: Record<string, string>;
  outputChoices: Record<string, string>;
  /** The delivered quests, in the order of delivery. */
  completedQuests: string[];
  layoutId: string; resolvedObstacles: string[];
  /** Completed preparations at adoption, and permanent placement history. Missing records do not add past batches. */
  preparationObstacles?: { start: number; placed: { id: string; position: number }[] };
  /**
   * The earned scenes that the player has not finished or skipped: preparation scenes, quest completion scenes, regular arrival
   * scenes, local news, chapter closing scenes, and the finale. Preparation scenes, chapter scenes, and the finale keep story order.
   */
  pendingScenes: string[];
  /** The line that the player sees in a waiting scene, after its first line. A missing record starts the scene at its first line. */
  sceneLines?: Record<string, number>;
};
export type Action =
  | { type: 'move'; from: number; to: number }
  | { type: 'spawn'; index: number; output?: string }
  | { type: 'deliverQuest'; id: string }
  | { type: 'decorate'; slot: string; variant: string }
  | { type: 'readScene'; id: string }
  | { type: 'sceneLine'; id: string; line: number }
  | { type: 'task' };
export type Result = { state: GameState; ok: boolean; message: string; event: string | null };

const own = (object: object, key: unknown): key is string => typeof key === 'string' && Object.hasOwn(object, key);
const integer = (value: unknown, min = 0, max = 1_000_000_000): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
/** A content ID stays stable after release: lower case letters, digits, and hyphens, starting with a letter. */
const stable = (id: unknown): id is string => typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id);
/** A scene line has a known speaker and words. */
const spoken = (line: unknown, data: GameData) => !!line && typeof line === 'object' && data.characters.some(character => character.id === (line as SceneLine).speaker)
  && typeof (line as SceneLine).text === 'string' && !!(line as SceneLine).text.trim();
/** A scene has at least one line, and each line is spoken. */
const scene = (lines: unknown, data: GameData): lines is SceneLine[] => Array.isArray(lines) && lines.length > 0 && lines.every(line => spoken(line, data));
/** At most this many preparation blockers wait on the board at one time. */
const ACTIVE_BLOCKERS = 3;
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
const availableChains = (state: Pick<GameState, 'taskIndex'>, data: GameData) => [...new Set([
  ...data.board.initial.filter(present).filter(code => data.items[code].generator).map(code => data.items[code].chain),
  ...data.tasks.slice(0, state.taskIndex).flatMap(task => task.unlock ? [task.unlock] : []),
])];
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
function questReady(state: GameState, quest: Quest, data: GameData): boolean {
  return (quest.afterTask === null || state.decorations.includes(quest.afterTask)) && questPredecessors(quest, data).every(id => questDone(state, id));
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

/** An item by its code, or undefined for a code that the data does not know. */
export function getItem(code: string, data: GameData): Item | undefined {
  return own(data.items, code) ? data.items[code] : undefined;
}

/** A regular is present once the preparation that brings them is complete. Everyone else is always present. */
export function hasArrived(state: Pick<GameState, 'decorations'>, person: Character): boolean {
  return person.arrivesAfter === undefined || state.decorations.includes(person.arrivesAfter);
}
/** The scene that introduces a regular on arrival. */
export const arrivalScene = (person: Pick<Character, 'id'>) => `arrival-${person.id}`;
const isRegular = (person: Character) => !!person.regular;

/** The neighbours of the bistro: the core characters, then the regulars in order of arrival, each with their delivered quests. */
export function resolveNeighbours(state: GameState, data: GameData) {
  const order = (person: Character) => person.arrivesAfter === undefined ? -1 : data.tasks.findIndex(task => task.id === person.arrivesAfter);
  return data.characters.filter(person => !person.visitor).sort((a, b) => Number(isRegular(a)) - Number(isRegular(b)) || order(a) - order(b))
    .map(person => ({ person, arrived: hasArrived(state, person),
      delivered: state.completedQuests.filter(id => data.quests.find(quest => quest.id === id)?.character === person.id).length }));
}

/** Check the cast: unique people and portrait cells, and for each regular, two liked chains, a known arrival, and an arrival scene. */
export function characterProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    const ids = new Set<string>(), portraits = new Set<string>();
    for (const person of data.characters) {
      if (!stable(person.id) || ids.has(person.id)) problems.push('Character IDs must be stable and unique.');
      ids.add(person.id);
      if (person.portraitAtlas !== undefined && !portraitAtlases.includes(person.portraitAtlas)) problems.push(`${person.id}: unknown portrait atlas.`);
      const atlas = person.portraitAtlas ?? (person.visitor ? 'visitors' : 'core');
      if (!integer(person.sprite, 0, 3) || portraits.has(`${atlas}:${person.sprite}`)) problems.push(`${person.id}: needs its own portrait cell.`);
      portraits.add(`${atlas}:${person.sprite}`);
      if (person.regular !== undefined && (person.regular !== true || person.visitor)) problems.push(`${person.id}: invalid regular flag.`);
      if (person.arrivesAfter !== undefined && (!isRegular(person) || !data.tasks.some(task => task.id === person.arrivesAfter))) problems.push(`${person.id}: unknown arrival preparation.`);
      if (person.prefers !== undefined && (!person.regular || !Array.isArray(person.prefers) || person.prefers.length !== 2 || person.prefers[0] === person.prefers[1]
        || !person.prefers.every(chain => data.chains.some(known => known.id === chain)))) problems.push(`${person.id}: a regular likes two different known chains.`);
      if (person.regular && !person.prefers) problems.push(`${person.id}: a regular needs two liked chains.`);
      if ((person.arrival !== undefined) !== (person.arrivesAfter !== undefined) || (person.arrival && (!Array.isArray(person.arrival) || !person.arrival.length
        || !person.arrival.every(line => spoken(line, data)) || !person.arrival.some(line => line.speaker === person.id)))) problems.push(`${person.id}: a regular who arrives later needs an arrival scene in which they speak.`);
    }
  } catch { problems.push('The character records are malformed.'); }
  return problems;
}

const questDone = (state: GameState, id: string) => state.completedQuests.includes(id);
function questPredecessors(quest: Quest, data: GameData): string[] {
  const earlier = data.quests.slice(0, data.quests.indexOf(quest)).filter(previous => previous.character === quest.character);
  return [...new Set([...(quest.afterQuest ? [quest.afterQuest] : []), ...earlier.map(previous => previous.id)])];
}

/** The number of quest tickets on the counter. */
export const QUEST_TICKETS = 3;

/**
 * Open quests take the tickets in authored order: the first three are active, and the others wait for a free ticket.
 * A character has at most one open quest, because each quest waits for the earlier quests of its character.
 */
export function resolveQuests(state: GameState, data: GameData): QuestView[] {
  let tickets = 0;
  return data.quests.map(quest => ({ quest, status: questDone(state, quest.id) ? 'complete'
    : !questReady(state, quest, data) ? 'locked' : tickets++ < QUEST_TICKETS ? 'active' : 'waiting' }));
}

/** The quests that the preparation at this index needs: every quest that opens before it. */
export function requiredQuests(taskIndex: number, data: GameData): Quest[] {
  return data.quests.filter(quest => questOpening(quest, data) < taskIndex);
}

/** A guest who visits once has a journal introduction only while their quest is open. */
export function journalCharacters(state: GameState, data: GameData): Character[] {
  const quests = resolveQuests(state, data);
  return data.characters.filter(character => hasArrived(state, character)).filter(character => !character.singleVisit
    || quests.some(view => (view.quest.character === character.id || view.quest.companions?.includes(character.id)) && (view.status === 'active' || view.status === 'waiting')));
}

/** The board cells that a delivery empties: the first free matching cell for each portion, or -1 if there is none. */
export function questDeliveryCells(state: GameState, quest: Quest, data: GameData): number[] {
  const taken: number[] = [];
  for (const requirement of quest.requirements) for (let count = 0; count < requirement.quantity; count++) {
    taken.push(state.board.findIndex((cell, index) => cell?.code === requirement.item && !unresolvedObstacle(state, index, data) && !taken.includes(index)));
  }
  return taken;
}

export function canDeliverQuest(state: GameState, quest: Quest | string, data: GameData): boolean {
  const view = resolveQuests(state, data).find(view => view.quest.id === (typeof quest === 'string' ? quest : quest.id));
  return view?.status === 'active' && questDeliveryCells(state, view.quest, data).every(index => index >= 0);
}

/**
 * Check the combined preparation and quest graph, the required items, chain availability, the decoration finishes, the authored
 * order, and the campaign funds: each preparation is paid by the rewards of the quests that open before it, so no player can be stuck.
 */
export function questProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    if (!Array.isArray(data.quests)) return ['Quest records are required.'];
    const ids = new Set<string>();
    const graph = new Map<string, string[]>();
    for (const character of data.characters) {
      if (character.singleVisit !== undefined && typeof character.singleVisit !== 'boolean') problems.push(`${character.id}: invalid single visit flag.`);
      if (character.singleVisit && (character.visitor !== true || data.quests.filter(quest => quest?.character === character.id || quest?.companions?.includes(character.id)).length !== 1)) {
        problems.push(`${character.id}: a single visit needs a visitor with exactly one quest.`);
      }
    }
    for (const [index, task] of data.tasks.entries()) graph.set(`task:${task.id}`, index ? [`task:${data.tasks[index - 1].id}`] : []);
    for (const quest of data.quests) {
      if (!quest || typeof quest !== 'object') { problems.push('Every quest needs a record.'); continue; }
      if (!stable(quest.id) || ids.has(quest.id)) problems.push('Quest IDs must be stable and unique.');
      ids.add(quest.id);
      if (!data.characters.some(character => character.id === quest.character) || !quest.title) problems.push(`${quest.id}: unknown character or missing title.`);
      if (quest.afterTask !== null && !data.tasks.some(task => task.id === quest.afterTask)) problems.push(`${quest.id}: unknown opening preparation.`);
      if (quest.companions !== undefined && (!Array.isArray(quest.companions) || !quest.companions.length
        || new Set(quest.companions).size !== quest.companions.length
        || !quest.companions.every(id => id !== quest.character && data.characters.some(character => character.id === id && character.visitor)))) problems.push(`${quest.id}: invalid companions.`);
      if (!integer(quest.reward, 1)) problems.push(`${quest.id}: invalid coin reward.`);
      if (!scene(quest.opening, data) || !scene(quest.completion, data)) problems.push(`${quest.id}: invalid scene.`);
      if (quest.followUp && (!stable(quest.followUp.id) || !quest.followUp.title
        || !integer(quest.followUp.afterDeliveries, 1) || !scene(quest.followUp.dialogue, data))) problems.push(`${quest.id}: invalid follow-up scene.`);
      if (!Array.isArray(quest.requirements) || !quest.requirements.length || quest.requirements.reduce((count, requirement) => count + requirement.quantity, 0) > data.board.initial.length) problems.push(`${quest.id}: invalid delivery size.`);
      for (const requirement of quest.requirements) {
        const item = getItem(requirement.item, data);
        if (!item || item.generator || !integer(requirement.quantity, 1, data.board.initial.length)) problems.push(`${quest.id}: invalid requirement.`);
      }
      if (quest.unlocks !== undefined) {
        const slot = data.decorationSlots.find(value => value.id === quest.unlocks!.slot);
        if (!slot || slot.default === quest.unlocks.variant || !slot.variants.some(variant => variant.id === quest.unlocks!.variant)
          || data.quests.filter(other => other.unlocks?.slot === quest.unlocks!.slot && other.unlocks.variant === quest.unlocks!.variant).length !== 1) problems.push(`${quest.id}: invalid decoration finish.`);
      }
      graph.set(`quest:${quest.id}`, [...(quest.afterTask ? [`task:${quest.afterTask}`] : []), ...questPredecessors(quest, data).map(id => `quest:${id}`)]);
    }
    for (const slot of data.decorationSlots) for (const variant of slot.variants) {
      if (variant.id !== slot.default && !data.quests.some(quest => quest.unlocks?.slot === slot.id && quest.unlocks.variant === variant.id)) problems.push(`${slot.id}: ${variant.id} needs a quest.`);
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
    if (problems.length) return problems;
    // The tickets show open quests in authored order, so an earlier quest never opens after a later one.
    const openings = data.quests.map(quest => questOpening(quest, data));
    if (openings.some((opening, at) => at && opening < openings[at - 1])) problems.push('Quests must be in the order in which they open.');
    // Every quest opens before the last preparation, so the campaign needs it, and each preparation is paid by the quests before it.
    if (openings.some(opening => opening >= data.tasks.length - 1)) problems.push('Every quest must open before the last preparation.');
    let earned = 0, spent = 0;
    for (const [index, task] of data.tasks.entries()) {
      earned += data.quests.filter((_, at) => openings[at] === index - 1).reduce((sum, quest) => sum + quest.reward, 0);
      spent += task.cost;
      if (earned < spent) problems.push(`${task.id}: the quests before it pay ${earned} coins, less than the ${spent} that the preparations cost.`);
    }
    const ancestors = (id: string, found = new Set<string>()): Set<string> => {
      for (const dependency of graph.get(id) ?? []) if (!found.has(dependency)) { found.add(dependency); ancestors(dependency, found); }
      return found;
    };
    const starting = availableChains({ taskIndex: 0 }, data);
    for (const quest of data.quests) {
      const before = ancestors(`quest:${quest.id}`);
      const person = data.characters.find(person => person.id === quest.character)!;
      if (person.arrivesAfter && !before.has(`task:${person.arrivesAfter}`)) problems.push(`${quest.id}: the character must arrive before the quest opens.`);
      if (person.regular && !quest.requirements.some(requirement => person.prefers?.includes(data.items[requirement.item].chain))) {
        problems.push(`${quest.id}: a regular needs a dish from a favourite chain.`);
      }
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
  ...data.chapters.map(chapter => chapter.id), data.finale.id, ...data.quests.flatMap(quest => quest.followUp ? [quest.followUp.id] : []),
  ...data.characters.flatMap(person => person.arrival ? [arrivalScene(person)] : [])];

/** The story order of preparation scenes, chapter scenes, and the finale: each chapter scene follows the preparations of its chapter. */
const storyOrder = (data: GameData) => [...data.chapters.flatMap((chapter, index) => [...data.tasks.filter(task => task.chapter === index + 1).map(task => task.id), chapter.id]), data.finale.id];

/** The content that a scene ID names: a preparation, a quest completion, a chapter's closing, the finale, a regular's arrival, or local news. */
export type SceneSource =
  | { kind: 'task'; task: Task } | { kind: 'quest'; quest: Quest } | { kind: 'chapter'; chapter: Chapter; number: number }
  | { kind: 'finale'; finale: Finale } | { kind: 'arrival'; person: Character } | { kind: 'news'; news: NonNullable<Quest['followUp']> };

/** The content of a scene by its ID, or null for an unknown ID. */
export function sceneSource(id: string, data: GameData): SceneSource | null {
  const task = data.tasks.find(value => value.id === id);
  if (task) return { kind: 'task', task };
  const quest = data.quests.find(value => value.id === id);
  if (quest) return { kind: 'quest', quest };
  const index = data.chapters.findIndex(chapter => chapter.id === id);
  if (index >= 0) return { kind: 'chapter', chapter: data.chapters[index], number: index + 1 };
  if (id === data.finale.id) return { kind: 'finale', finale: data.finale };
  const person = data.characters.find(value => value.arrival && arrivalScene(value) === id);
  if (person) return { kind: 'arrival', person };
  const news = data.quests.find(value => value.followUp?.id === id)?.followUp;
  return news ? { kind: 'news', news } : null;
}

/** The lines of a scene. */
function sceneDialogue(source: SceneSource): SceneLine[] {
  switch (source.kind) {
    case 'task': return source.task.dialogue;
    case 'quest': return source.quest.completion;
    case 'chapter': return source.chapter.closing;
    case 'finale': return source.finale.dialogue;
    case 'arrival': return source.person.arrival!;
    case 'news': return source.news.dialogue;
  }
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

/** The deliveries after the delivery of a quest, or -1 before that delivery. */
export function deliveriesSince(state: Pick<GameState, 'completedQuests'>, id: string): number {
  const at = state.completedQuests.indexOf(id);
  return at === -1 ? -1 : state.completedQuests.length - 1 - at;
}

/** The scenes that the completed preparations and quests have earned. A save can hold only these as pending scenes. */
function earnedScenes(state: Pick<GameState, 'taskIndex' | 'completedQuests' | 'decorations'>, data: GameData): string[] {
  return [...data.tasks.slice(0, state.taskIndex).map(task => task.id), ...state.completedQuests,
    ...resolveChapters(state, data).filter(view => view.status === 'complete').map(view => view.chapter.id),
    ...(state.taskIndex === data.tasks.length ? [data.finale.id] : []),
    ...data.quests.flatMap(quest => quest.followUp && deliveriesSince(state, quest.id) >= quest.followUp.afterDeliveries ? [quest.followUp.id] : []),
    ...data.characters.flatMap(person => person.arrival && hasArrived(state, person) ? [arrivalScene(person)] : [])];
}

/** Check the chapters, their scenes, their neighbour contributions, and the finale before the content can ship. */
export function storyProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    const { chapters, finale } = data;
    if (!Array.isArray(chapters) || !chapters.length || !finale || typeof finale !== 'object') return ['The story needs chapters and a finale.'];
    const ids = new Set<string>();
    for (const [index, chapter] of chapters.entries()) {
      const label = `Chapter ${index + 1}`;
      if (!chapter || typeof chapter !== 'object') { problems.push(`${label} needs a record.`); continue; }
      if (!stable(chapter.id) || ids.has(chapter.id)) problems.push('Chapter and finale IDs must be stable and unique.');
      ids.add(chapter.id);
      for (const key of ['title', 'objective', 'opening', 'payoff'] as const) if (typeof chapter[key] !== 'string' || !chapter[key].trim()) problems.push(`${label} needs its ${key}.`);
      if (!scene(chapter.closing, data)) problems.push(`${label}: invalid closing scene.`);
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
    if (!scene(finale.dialogue, data)) problems.push('The finale has an invalid scene.');
    for (const character of data.characters.filter(character => !character.visitor && !isRegular(character))) {
      if (!scene(finale.dialogue, data) || !finale.dialogue.some(line => line.speaker === character.id)) problems.push(`The finale must include ${character.name}.`);
      if (!chapters.some(chapter => data.quests.find(quest => quest.id === chapter?.contribution)?.character === character.id)) problems.push(`${character.name} needs a chapter contribution.`);
    }
    if (new Set(storyScenes(data)).size !== storyScenes(data).length) problems.push('Story scene IDs must be unique.');
  } catch { problems.push('The story records are malformed.'); }
  return problems;
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

/** The interface and completion use the same coin, quest, and placement checks. */
export function taskEligibility(state: GameState, data: GameData): TaskEligibility {
  const task = currentTask(state, data);
  if (!task) return { task: null, ready: false, requirements: [], blockers: ['The community supper is ready.'] };
  const quests = requiredQuests(state.taskIndex, data), delivered = quests.filter(quest => questDone(state, quest.id)).length;
  const requirements: TaskRequirement[] = [
    { kind: 'coins', current: state.coins, required: task.cost, met: state.coins >= task.cost },
    { kind: 'quests', current: delivered, required: quests.length, met: delivered === quests.length },
  ];
  const blockers: string[] = [];
  const coins = task.cost - state.coins, missing = quests.length - delivered;
  if (coins > 0) blockers.push(`Earn ${coins} more ${coins === 1 ? 'coin' : 'coins'} to pay for this preparation.`);
  if (missing > 0) blockers.push(`Deliver ${missing} more ${missing === 1 ? 'quest' : 'quests'} for this preparation.`);
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
  const item = getItem(generatorCode, data);
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
    if (!stable(slot.id) || !slot.name) problems.push('Every decoration slot needs a stable ID and a name.');
    if (!area || unlock < 0 || (area.unlock !== null && data.tasks.findIndex(task => task.id === area.unlock) > unlock)) problems.push(`${slot.id}: invalid area or preparation.`);
    if (slot.variants.length < 2 || new Set(slot.variants.map(variant => variant.id)).size !== slot.variants.length) problems.push(`${slot.id}: needs at least two variants with unique IDs.`);
    if (!slot.variants.some(variant => variant.id === slot.default)) problems.push(`${slot.id}: unknown default.`);
    for (const variant of slot.variants) {
      if (!stable(variant.id) || !variant.name || (knownImages && !knownImages.includes(variant.image))) problems.push(`${slot.id}: invalid variant or missing image.`);
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
    const items = itemProblems(data);
    if (items.length) return items;
    const problems = [...characterProblems(data), ...boardLayoutProblems(data), ...roomProblems(data), ...decorationProblems(data, knownImages), ...generatorTierProblems(data),
      ...questProblems(data), ...storyProblems(data), ...economyProblems(data)];
    // The save validation relies on the other checks, so it judges the new game only after they pass.
    if (!problems.length && !validateGame(createGame(data), data)) problems.push('The starting board does not make a valid new game.');
    return problems;
  } catch { return ['The game data is malformed.']; }
}

/** Validate merge paths and sources before any check or action follows their references. */
function itemProblems(data: GameData): string[] {
  const problems: string[] = [];
  const chains = new Set(data.chains.map(chain => chain.id));
  if (chains.size !== data.chains.length) problems.push('Chain IDs must be unique.');
  for (const [code, item] of Object.entries(data.items)) {
    if (item.id !== code || !chains.has(item.chain)) { problems.push(`${code}: invalid item ID or chain.`); continue; }
    if (item.generator) {
      if (code !== `generator_${item.chain}` || item.stage !== 0 || item.next !== null
        || !Array.isArray(item.generator.outputs) || item.generator.outputs.length !== 1 || item.generator.outputs[0] !== `${item.chain}_1`) {
        problems.push(`${code}: invalid ingredient source.`);
      }
    } else if (!integer(item.stage, 1, 6) || code !== `${item.chain}_${item.stage}`
      || item.next !== (item.stage === 6 ? null : `${item.chain}_${item.stage + 1}`)) problems.push(`${code}: invalid merge path.`);
  }
  for (const chain of chains) {
    if (!data.items[`generator_${chain}`]?.generator || !Array.from({ length: 6 }, (_, index) => `${chain}_${index + 1}`).every(code => own(data.items, code))) {
      problems.push(`${chain}: needs a source and all six food stages.`);
    }
    const sources = data.board.initial.filter(code => code === `generator_${chain}`).length + data.tasks.filter(task => task.unlock === chain).length;
    if (sources !== 1) problems.push(`${chain}: its source must be available exactly once.`);
  }
  for (const task of data.tasks) if (task.unlock !== undefined && !chains.has(task.unlock)) problems.push(`${task.id}: unknown source unlock.`);
  return problems;
}

/** A blocker needs a stable ID, a name, a known type, and a movable ingredient of an open chain. A clutter blocker names its art cell. */
function validObstacle(obstacle: Omit<BoardObstacle, 'position' | 'context'>, chains: readonly string[], data: GameData): boolean {
  return !!obstacle && stable(obstacle.id) && typeof obstacle.name === 'string' && !!obstacle.name.trim() && ['clutter', 'anchored'].includes(obstacle.type)
    && own(data.items, obstacle.ingredient) && !data.items[obstacle.ingredient].generator && !!data.items[obstacle.ingredient].next
    && chains.includes(data.items[obstacle.ingredient].chain)
    && (obstacle.atlas === undefined || obstacle.atlas === 'preparation')
    && (obstacle.type !== 'clutter' || integer(obstacle.sprite, 0, obstacle.atlas === 'preparation' ? 11 : 3));
}

export function boardLayoutProblems(data: GameData): string[] {
  const problems: string[] = [];
  const layouts = data.board.layouts;
  if (!Array.isArray(layouts) || !layouts.length || !layouts.some(layout => layout.id === data.board.defaultLayout)) return ['The board needs a default layout.'];
  const ids = new Set<string>();
  const startingChains = data.board.initial.filter(present).flatMap(code => data.items[code]?.generator ? [data.items[code].chain] : []);
  for (const layout of layouts) {
    if (!layout || typeof layout.id !== 'string' || !layout.id || ids.has(layout.id) || !Array.isArray(layout.obstacles)) {
      problems.push('Board layout IDs must be unique, and each layout needs obstacles.');
      continue;
    }
    ids.add(layout.id);
    const obstacleIds = new Set<string>();
    const positions = new Set<number>();
    for (const obstacle of layout.obstacles) {
      if (!validObstacle(obstacle, startingChains, data) || obstacleIds.has(obstacle.id)
        || !integer(obstacle.position, 0, data.board.initial.length - 1) || positions.has(obstacle.position)
        || data.board.initial[obstacle.position] !== null) {
        problems.push(`Board layout ${layout.id} has an invalid obstacle.`);
        continue;
      }
      obstacleIds.add(obstacle.id);
      positions.add(obstacle.position);
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
      if (!validObstacle(obstacle, chains, data) || obstacleIds.has(obstacle.id)) {
        problems.push(`Preparation ${batch.after} has an invalid blocker.`);
      }
      if (obstacle) obstacleIds.add(obstacle.id);
    }
  }
  return problems;
}

/** Delivered quests are known, unique, and opened in delivery order, and every completed preparation had its quests. */
function validateQuestProgress(state: GameState, data: GameData): boolean {
  const complete = state.completedQuests;
  if (!Array.isArray(complete) || complete.length > data.quests.length || new Set(complete).size !== complete.length) return false;
  const done = new Set<string>();
  for (const id of complete) {
    const quest = data.quests.find(quest => quest.id === id);
    if (!quest || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask))
      || !questPredecessors(quest, data).every(previous => done.has(previous))) return false;
    done.add(id);
  }
  return !state.taskIndex || requiredQuests(state.taskIndex - 1, data).every(quest => done.has(quest.id));
}

/** A finish is unlocked when the quest that offers it is delivered. A default finish needs no quest. */
export function decorationUnlocked(state: Pick<GameState, 'completedQuests'>, slot: DecorationSlot, variant: string, data: GameData): boolean {
  return variant === slot.default || data.quests.some(quest => quest.unlocks?.slot === slot.id && quest.unlocks.variant === variant && state.completedQuests.includes(quest.id));
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
    for (const [chain, code] of Object.entries(outputs)) {
      if (!chains.includes(chain) || !own(data.items, code) || data.items[code].generator
        || data.items[code].chain !== chain || data.items[code].stage < 2
        || !generatorOutputs(state, `generator_${chain}`, data).includes(code)) return false;
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
      if (!quest || !canDeliverQuest(next, quest, data)) return fail('This quest needs every required item on the board. Check that the quest is still on a ticket.');
      if (!integer(next.coins + quest.reward)) return fail('Spend some coins before you deliver this quest.');
      for (const index of questDeliveryCells(next, quest, data)) next.board[index] = null;
      next.completedQuests.push(quest.id);
      next.pendingScenes.push(quest.id);
      next.coins += quest.reward;
      // A follow-up scene waits for a count of later deliveries; it is earned by the delivery that reaches the count.
      for (const earlier of data.quests) if (earlier.followUp && deliveriesSince(next, earlier.id) === earlier.followUp.afterDeliveries) next.pendingScenes.push(earlier.followUp.id);
      message = `${quest.title}: delivered. Earned ${quest.reward} coins.`;
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
      if (unresolvedObstacle(next, action.from, data)) return fail('This item is tied to the workbench. Merge a matching item into this space.');
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
      const code = action.output === undefined ? nextOutput(next, item.id, data)! : action.output;
      if (!generatorOutputs(next, item.id, data).includes(code)) return fail('Choose an available output from this source.');
      const empty = firstFreeBoardCell(next, data);
      if (empty === -1) return fail('The board is full. Merge a pair or deliver a quest.');
      next.board[empty] = { code };
      if (data.items[code].stage === 1) delete next.outputChoices[item.chain];
      else next.outputChoices[item.chain] = code;
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
      // The payment queues the preparation scene, then the closing scene of a completed chapter, then the finale, in the same change.
      next.pendingScenes.push(task.id);
      if (resolveChapters(next, data)[task.chapter - 1].status === 'complete') next.pendingScenes.push(data.chapters[task.chapter - 1].id);
      if (next.taskIndex === data.tasks.length) next.pendingScenes.push(data.finale.id);
      // The preparation that brings a regular queues their arrival after the story scenes that it earned.
      for (const person of data.characters) if (person.arrival && person.arrivesAfter === task.id) next.pendingScenes.push(arrivalScene(person));
      for (const chain of availableChains(next, data)) {
        const code = `generator_${chain}`;
        const before = generatorOutputs(state, code, data);
        for (const output of generatorOutputs(next, code, data)) {
          if (data.items[output].stage > 1 && !before.includes(output)) message += ` The ${data.items[code].name} can now make ${data.items[output].name}.`;
        }
      }
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
