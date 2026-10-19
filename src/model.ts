// The content and state types of the bistro game, and the read-only questions that the rules and the interface ask about a game.
// Nothing here changes a state, reads the clock, or touches the page.

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
export const portraitAtlases = ['guest', 'regulars-1', 'regulars-2', 'regulars-3'] as const;
export type PortraitAtlas = typeof portraitAtlases[number];
export type Task = { id: string; chapter: number; title: string; cost: number; work: { summary: string; materials: number; labour: number; hours: number }; dialogue: SceneLine[]; unlock?: string };
export type TaskRequirement =
  | { kind: 'coins' | 'quests'; current: number; required: number; met: boolean }
  | { kind: 'space'; source: string; met: boolean };
export type TaskEligibility = { task: Task | null; ready: boolean; requirements: TaskRequirement[]; blockers: string[] };
/**
 * A quest from a character. It opens after the preparation that afterTask names (null: in a new game), after afterQuest, and after
 * the earlier quests of its character. Unlocks names a decoration finish that the delivery adds. A follow-up scene is earned after
 * afterDeliveries further deliveries. The supper quest has a cost instead of dishes and a reward; its payment earns the finale.
 * A recurring quest is open only while the coins do not cover the supper; its delivery pays its reward and is never recorded.
 */
export type Quest = {
  id: string; character: string; title: string; afterTask: string | null; afterQuest?: string;
  requirements: { item: string; quantity: number }[]; reward: number; opening: SceneLine[]; completion: SceneLine[];
  companions?: string[]; unlocks?: { slot: string; variant: string }; cost?: number; repeat?: true;
  followUp?: { id: string; title: string; afterDeliveries: number; dialogue: SceneLine[] };
};
/**
 * A chapter of the story. Its preparations are the tasks that name its number. Opening sets the scene when the chapter starts,
 * objective is its goal, payoff says what the chapter changed, and closing is the scene that plays when its last preparation completes.
 * Contribution is the optional neighbour quest that opens during the chapter.
 */
export type Chapter = { id: string; title: string; objective: string; opening: string; payoff: string; contribution: string; closing: SceneLine[] };
/** The scene that the payment of the supper quest earns. Ending is the line that returns the player to the kitchen. */
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
export const own = (object: object, key: unknown): key is string => typeof key === 'string' && Object.hasOwn(object, key);
export const integer = (value: unknown, min = 0, max = 1_000_000_000): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
/** A content ID stays stable after release: lower case letters, digits, and hyphens, starting with a letter. */
export const stable = (id: unknown): id is string => typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id);
/** A scene line has a known speaker and words. */
export const spoken = (line: unknown, data: GameData) => !!line && typeof line === 'object' && data.characters.some(character => character.id === (line as SceneLine).speaker)
  && typeof (line as SceneLine).text === 'string' && !!(line as SceneLine).text.trim();
/** A scene has at least one line, and each line is spoken. */
export const scene = (lines: unknown, data: GameData): lines is SceneLine[] => Array.isArray(lines) && lines.length > 0 && lines.every(line => spoken(line, data));
export const present = <T>(value: T): value is NonNullable<T> => Boolean(value);
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
export const availableChains = (state: Pick<GameState, 'taskIndex'>, data: GameData) => [...new Set([
  ...data.board.initial.filter(present).filter(code => data.items[code].generator).map(code => data.items[code].chain),
  ...data.tasks.slice(0, state.taskIndex).flatMap(task => task.unlock ? [task.unlock] : []),
])];
function questReady(state: GameState, quest: Quest, data: GameData): boolean {
  return (quest.afterTask === null || state.decorations.includes(quest.afterTask)) && questPredecessors(quest, data).every(id => questDone(state, id));
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
export const isRegular = (person: Character) => !!person.regular;
/** The neighbours of the bistro: the core characters, then the regulars in order of arrival, each with their delivered quests. */
export function resolveNeighbours(state: GameState, data: GameData) {
  const order = (person: Character) => person.arrivesAfter === undefined ? -1 : data.tasks.findIndex(task => task.id === person.arrivesAfter);
  return data.characters.filter(person => !person.visitor).sort((a, b) => Number(isRegular(a)) - Number(isRegular(b)) || order(a) - order(b))
    .map(person => ({ person, arrived: hasArrived(state, person),
      delivered: state.completedQuests.filter(id => data.quests.find(quest => quest.id === id)?.character === person.id).length }));
}
const questDone = (state: GameState, id: string) => state.completedQuests.includes(id);
export function questPredecessors(quest: Quest, data: GameData): string[] {
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
  const supper = supperQuest(data), complete = supperComplete(state, data);
  const short = !!supper && !complete && questReady(state, supper, data) && state.coins < supper.cost!;
  return data.quests.map(quest => ({ quest, status: questDone(state, quest.id) || (quest === supper && complete) ? 'complete'
    : !questReady(state, quest, data) || (quest.repeat && !short) ? 'locked' : tickets++ < QUEST_TICKETS ? 'active' : 'waiting' }));
}
/** The quest whose payment earns the finale. */
export const supperQuest = (data: GameData) => data.quests.find(quest => quest.cost !== undefined);
/** The supper is paid when its quest is delivered. */
export function supperComplete(state: Pick<GameState, 'completedQuests'>, data: GameData): boolean {
  return state.completedQuests.includes(supperQuest(data)?.id ?? '');
}
/** The quests that the preparation at this index needs: every quest that opens before it, except the supper and the recurring quests. */
export function requiredQuests(taskIndex: number, data: GameData): Quest[] {
  const known = new Map<Quest, number>();
  return data.quests.filter(quest => quest.cost === undefined && !quest.repeat && questOpening(quest, data, known) < taskIndex);
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
  return view?.status === 'active' && state.coins >= (view.quest.cost ?? 0) && questDeliveryCells(state, view.quest, data).every(index => index >= 0);
}
/**
 * The index of the latest preparation that a quest and its predecessors wait for: -1 when it opens in a new game.
 * Known keeps the openings that one check found, so each quest is resolved once and long quest lines stay linear.
 */
export function questOpening(quest: Quest, data: GameData, known = new Map<Quest, number>(), path = new Set<string>()): number {
  const found = known.get(quest);
  if (found !== undefined) return found;
  if (path.has(quest.id)) return Infinity;
  path.add(quest.id);
  const opening = Math.max(data.tasks.findIndex(task => task.id === quest.afterTask), ...questPredecessors(quest, data).map(id => {
    const previous = data.quests.find(candidate => candidate.id === id);
    return previous ? questOpening(previous, data, known, path) : Infinity;
  }));
  path.delete(quest.id);
  known.set(quest, opening);
  return opening;
}
/** Every scene ID: a preparation scene uses the ID of its preparation, and a quest completion scene uses the ID of its quest. */
export const storyScenes = (data: GameData) => [...data.tasks.map(task => task.id), ...data.quests.map(quest => quest.id),
  ...data.chapters.map(chapter => chapter.id), data.finale.id, ...data.quests.flatMap(quest => quest.followUp ? [quest.followUp.id] : []),
  ...data.characters.flatMap(person => person.arrival ? [arrivalScene(person)] : [])];
/** The story order of preparation scenes, chapter scenes, and the finale: each chapter scene follows the preparations of its chapter. */
export const storyOrder = (data: GameData) => [...data.chapters.flatMap((chapter, index) => [...data.tasks.filter(task => task.chapter === index + 1).map(task => task.id), chapter.id]), data.finale.id];
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
export function sceneDialogue(source: SceneSource): SceneLine[] {
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
export function earnedScenes(state: Pick<GameState, 'taskIndex' | 'completedQuests' | 'decorations'>, data: GameData): string[] {
  return [...data.tasks.slice(0, state.taskIndex).map(task => task.id),
    ...state.completedQuests.filter(id => data.quests.some(quest => quest.id === id && quest.completion.length > 0)),
    ...resolveChapters(state, data).filter(view => view.status === 'complete').map(view => view.chapter.id),
    ...(supperComplete(state, data) ? [data.finale.id] : []),
    ...data.quests.flatMap(quest => quest.followUp && deliveriesSince(state, quest.id) >= quest.followUp.afterDeliveries ? [quest.followUp.id] : []),
    ...data.characters.flatMap(person => person.arrival && hasArrived(state, person) ? [arrivalScene(person)] : [])];
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
/** The place of a state's preparation in the campaign: 0 for the new game, then the preparation's number. */
export const stateNumber = (state: RoomState, data: GameData) => state.after === null ? 0 : data.tasks.findIndex(task => task.id === state.after) + 1;
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
/** A finish is unlocked when the quest that offers it is delivered. A default finish needs no quest. */
export function decorationUnlocked(state: Pick<GameState, 'completedQuests'>, slot: DecorationSlot, variant: string, data: GameData): boolean {
  return variant === slot.default || data.quests.some(quest => quest.unlocks?.slot === slot.id && quest.unlocks.variant === variant && state.completedQuests.includes(quest.id));
}
