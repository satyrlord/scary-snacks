// The content and state types of the bistro game, and the read-only questions that the rules and the interface ask about a game.
// Nothing here changes a state, reads the clock, or touches the page.

/** What a dish contains. A mixed dish has every tag of its parts. The data check enforces the diets with these tags. */
export const dishTags = ['meat', 'pork', 'dairy', 'egg', 'fish', 'alcohol', 'garlic'] as const;
export type DishTag = typeof dishTags[number];
/** The food atlases: one for each chain, and four for the mixed dishes. Each is a grid of four columns and two rows. */
export const foodAtlases = ['grain', 'corn', 'herbs', 'dairy', 'poultry', 'vegetables', 'fruits', 'pork', 'beans', 'lamb', 'veal', 'fish', 'soups', 'mains', 'sweets', 'breads'] as const;
export type FoodAtlas = typeof foodAtlases[number];
/** The chain of every mixed dish. A mixed dish has no stage path: its recipe names its two parts. */
export const MIXED = 'mixed';
/**
 * A source (stage 0, with a generator), a chain dish (`<chain>_<stage>`), or a mixed dish (chain `mixed`, with a recipe of two parts).
 * Art names the atlas and the cell of its picture. A source with free set takes without a coin.
 */
export type Item = {
  id: string; name: string; chain: string; stage: number; next: string | null; art: { atlas: FoodAtlas; cell: number }; price: number; tags: DishTag[];
  generator?: { outputs: string[]; free?: true }; recipe?: [string, string];
};
export type SceneLine = { speaker: string; text: string };
/** A diet forbids tags, can require a dish and a tag in each quest, and can forbid two tags in one quest. */
export type Diet = { name: string; forbid: DishTag[]; require?: { item: string; tag: DishTag }; apart?: [DishTag, DishTag] };
/**
 * A person of the bistro. The core characters drive the story. A regular (spec 010) is a neighbour who arrives with the preparation that
 * arrivesAfter names, or is present from the start; arrival plays a short scene, and favourites names the dishes that they like.
 */
/** A character with provisions orders food for several days or for other people. Every other quest is one meal for each eater. */
export type Character = {
  id: string; name: string; role: string; introduction: string; sprite: number; visitor?: boolean; singleVisit?: boolean;
  portraitAtlas?: PortraitAtlas; regular?: boolean; arrivesAfter?: string; favourites?: string[]; arrival?: SceneLine[]; diet?: Diet;
  provisions?: true;
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
 * afterDeliveries further deliveries. The supper quest (finale) asks for one plate for each guest, in the order of guests, pays
 * nothing, and earns the finale. The recovery quest is open only while the purse runs low (recoveryOpen); its delivery pays its
 * reward and is never recorded, and it stands outside the order of its character's quests.
 */
export type Quest = {
  id: string; character: string; title: string; afterTask: string | null; afterQuest?: string;
  requirements: { item: string; quantity: number }[]; reward: number; opening: SceneLine[]; completion: SceneLine[];
  companions?: string[]; unlocks?: { slot: string; variant: string }; finale?: true; guests?: string[]; recovery?: true; booked?: true;
  followUp?: { id: string; title: string; afterDeliveries: number; dialogue: SceneLine[] };
};
/**
 * The levers of the bistro day (spec 013). Times are minutes after midnight. Each merge adds mergeMinutes to the clock, and the merge
 * that reaches closing pays the upkeep and brings the night. A booked quest delivers from booking to closing.
 */
export type DayLevers = {
  opening: number; closing: number; booking: number; mergeMinutes: number; upkeep: number;
  ratTake: number; ratHoles: number; giftStage: number; giftSpace: number;
};
/**
 * The levers of the economy. A take from a paid source spends takeCost. Each cleared blocker gives blockerCoin. A menu price is
 * staples × takeCost + merges × workRate. The recovery quest opens while a quest is open and the purse is below recoveryFloor.
 */
export type Economy = { takeCost: number; blockerCoin: number; workRate: number; recoveryFloor: number };
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
export type BoardObstacle = { id: string; position: number; name: string; type: 'clutter' | 'anchored' | 'rat-hole'; ingredient: string; sprite?: number; atlas?: 'preparation'; context?: string };
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
  areas: Area[]; rooms: RoomState[]; decorationSlots: DecorationSlot[]; economy: Economy; day: DayLevers;
  quests: Quest[];
};
/**
 * An area as the completed preparations leave it. States are the earned states in order; current is the latest of them.
 * Painting is the latest earned state that has a painting, so it is current unless current waits for its master.
 */
export type RoomView = Area & { open: boolean; states: RoomState[]; current: RoomState | null; painting: RoomState | null };
export type Cell = { code: string };
/** A dish and the board cell where it was. */
export type Placed = { item: string; position: number };
/**
 * The last closing. The thief rat takes loose raw ingredients: the trapped one stays blocked in a new rat hole, and a thief with no
 * trapped ingredient found three rat holes open. Șoricescu leaves a gift, and a visit with no gift found too few free cells.
 */
export type NightReport = {
  day: number; upkeep: number; rat: 'thief' | 'soricescu'; taken: Placed[]; trapped: Placed | null;
  gift: (Placed & { first: boolean }) | null; purse: number; seen: boolean;
};
export type GameState = {
  version: 14; board: (Cell | null)[];
  /** The purse. Below zero, it is a debt in the notebook of the village shop. */
  coins: number; taskIndex: number;
  discovered: string[]; decorations: string[];
  decorationChoices: Record<string, string>;
  /** The delivered quests, in the order of delivery. */
  completedQuests: string[];
  layoutId: string; resolvedObstacles: string[];
  /** Completed preparations at adoption, and permanent placement history. Missing records do not add past batches. */
  preparationObstacles?: { start: number; placed: { id: string; position: number }[] };
  /**
   * The earned scenes that the player has not finished: preparation scenes, quest completion scenes, regular arrival
   * scenes, local news, chapter closing scenes, and the finale. Preparation scenes, chapter scenes, and the finale keep story order.
   */
  pendingScenes: string[];
  /** The day number and the merges of the current day. The supper stops the clock. */
  clock: { day: number; merges: number };
  /** The random seed of the thief rat. Only a closing with the thief rat uses and advances it. */
  seed: number;
  /** The open rat holes: each blocks the raw ingredient that the thief rat dropped in its cell. */
  ratHoles: Placed[];
  /** The gifts of Șoricescu so far. The chains take turns by this count. */
  gifts: number;
  /** The booked guest of this evening, the guest of the last evening, and whether this day had its booked delivery. */
  evening: { guest: string | null; last: string | null; delivered: boolean };
  night: NightReport | null;
  /** The days and the purse when the supper was served. */
  act1: { days: number; purse: number } | null;
};
export type Action =
  | { type: 'move'; from: number; to: number }
  | { type: 'spawn'; index: number }
  | { type: 'deliverQuest'; id: string }
  | { type: 'lantern'; id: string }
  | { type: 'seeNight' }
  | { type: 'decorate'; slot: string; variant: string }
  | { type: 'readScene'; id: string }
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
/** A rat hole as a blocker. It has no ID of its own: a cleared rat hole leaves the list, so it never enters the cleared blockers. */
const ratHole = (hole: Placed): BoardObstacle => ({ id: `rat-hole-${hole.position}`, position: hole.position, name: 'Rat hole', type: 'rat-hole',
  ingredient: hole.item, context: 'The thief rat dropped it here in the night.' });
export function boardObstacles(state: Pick<GameState, 'layoutId' | 'preparationObstacles' | 'ratHoles'>, data: GameData): BoardObstacle[] {
  return [...(data.board.layouts.find(layout => layout.id === state.layoutId)?.obstacles ?? []),
    ...(state.preparationObstacles?.placed.flatMap(placement => {
      const batch = data.board.preparations.find(batch => batch.obstacles.some(obstacle => obstacle.id === placement.id));
      const obstacle = batch?.obstacles.find(obstacle => obstacle.id === placement.id);
      return obstacle ? [{ ...obstacle, position: placement.position, context: batch!.context }] : [];
    }) ?? []), ...state.ratHoles.map(ratHole)];
}
export function unresolvedObstacle(state: Pick<GameState, 'layoutId' | 'resolvedObstacles' | 'preparationObstacles' | 'ratHoles'>, index: number, data: GameData): BoardObstacle | null {
  const initial = data.board.layouts.find(layout => layout.id === state.layoutId)?.obstacles.find(obstacle =>
    obstacle.position === index && !state.resolvedObstacles.includes(obstacle.id));
  if (initial) return initial;
  const hole = state.ratHoles.find(value => value.position === index);
  if (hole) return ratHole(hole);
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
/** The chains that a dish uses: its own chain, or every chain of the parts of a mixed dish. */
export function dishChains(code: string, data: GameData): string[] {
  const item = getItem(code, data);
  if (!item) return [];
  return item.recipe ? [...new Set(item.recipe.flatMap(part => dishChains(part, data)))] : [item.chain];
}
/** A dish is open when each of its chains is open. */
export const dishOpen = (code: string, chains: readonly string[], data: GameData) => {
  const used = dishChains(code, data);
  return used.length > 0 && used.every(chain => chains.includes(chain));
};
/** The mixed dish that two parts make, in either order, or undefined. */
const recipeResult = (first: string, second: string, data: GameData) => Object.values(data.items).find(item => item.recipe
  && ((item.recipe[0] === first && item.recipe[1] === second) || (item.recipe[0] === second && item.recipe[1] === first)));
/** The dish that a merge of two items makes: the next dish of a matching pair, or the dish of a recipe. Null when they do not merge. */
export function mergeResult(first: string, second: string, data: GameData): string | null {
  const item = getItem(first, data), other = getItem(second, data);
  if (!item || !other || item.generator || other.generator) return null;
  if (first === second) return item.next;
  return recipeResult(first, second, data)?.id ?? null;
}
/** The dishes that merge with a dish: the same dish while it has a next stage, then each recipe partner. */
export function mergePartners(code: string, data: GameData): string[] {
  const item = getItem(code, data);
  if (!item || item.generator) return [];
  return [...(item.next ? [code] : []), ...Object.values(data.items).flatMap(dish => !dish.recipe ? []
    : dish.recipe[0] === code ? [dish.recipe[1]] : dish.recipe[1] === code ? [dish.recipe[0]] : [])];
}
/** The coins that one take from a source spends: nothing from a free source. */
export const takeCost = (source: Item, data: GameData) => source.generator?.free ? 0 : data.economy.takeCost;
/** The stage-1 staples and the merges that a dish needs from a source. A staple of a free source counts as zero. */
export function dishWork(code: string, data: GameData): { staples: number; merges: number } {
  const item = data.items[code];
  if (item.recipe) {
    const [first, second] = item.recipe.map(part => dishWork(part, data));
    return { staples: first.staples + second.staples, merges: first.merges + second.merges + 1 };
  }
  const count = 2 ** (item.stage - 1), free = data.items[`generator_${item.chain}`]?.generator?.free;
  return { staples: free ? 0 : count, merges: count - 1 };
}
/** The menu price of a dish: staples × take cost + merges × work rate. */
export function menuPrice(code: string, data: GameData): number {
  const { staples, merges } = dishWork(code, data);
  return staples * data.economy.takeCost + merges * data.economy.workRate;
}
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
/** The earlier quests of the same character, and afterQuest. The recovery quest needs none and is no quest's predecessor. */
export function questPredecessors(quest: Quest, data: GameData): string[] {
  if (quest.recovery) return [];
  const earlier = data.quests.slice(0, data.quests.indexOf(quest)).filter(previous => previous.character === quest.character && !previous.recovery);
  return [...new Set([...(quest.afterQuest ? [quest.afterQuest] : []), ...earlier.map(previous => previous.id)])];
}
/** The number of quest tickets on the counter. The recovery quest has its own ticket after them. */
export const QUEST_TICKETS = 3;
/**
 * The recovery quest is open in two cases: a campaign quest is open and the purse holds less than the recovery floor, or no
 * campaign quest is open and the purse cannot pay the next preparation. So a player who spends coins on spare food is never stuck.
 */
function recoveryOpen(state: GameState, data: GameData, open = data.quests.some(quest => !quest.recovery && !questDone(state, quest.id) && questReady(state, quest, data))): boolean {
  const task = currentTask(state, data);
  return open ? state.coins < data.economy.recoveryFloor : !!task && state.coins < task.cost;
}
/**
 * Open quests take the tickets in authored order: the first three are active, and the others wait for a free ticket.
 * A character has at most one open campaign quest, because each quest waits for the earlier quests of its character.
 * The recovery quest is active while it is open, on its own ticket, so it never moves a quest to waiting.
 */
export function resolveQuests(state: GameState, data: GameData): QuestView[] {
  let tickets = 0;
  const views: QuestView[] = data.quests.map(quest => ({ quest, status: questDone(state, quest.id) ? 'complete'
    : quest.recovery || !questReady(state, quest, data) ? 'locked' : tickets++ < QUEST_TICKETS ? 'active' : 'waiting' }));
  const open = views.some(view => view.status === 'active' || view.status === 'waiting');
  for (const view of views) if (view.quest.recovery && recoveryOpen(state, data, open)) view.status = 'active';
  return views;
}
/** The quest whose delivery earns the finale. */
export const supperQuest = (data: GameData) => data.quests.find(quest => quest.finale);
/** The supper is served when its quest is delivered. */
export function supperComplete(state: Pick<GameState, 'completedQuests'>, data: GameData): boolean {
  return state.completedQuests.includes(supperQuest(data)?.id ?? '');
}
/** The quests that the preparation at this index needs: every quest that opens before it, except the supper and the recovery quest. */
export function requiredQuests(taskIndex: number, data: GameData): Quest[] {
  const known = new Map<Quest, number>();
  return data.quests.filter(quest => !quest.finale && !quest.recovery && questOpening(quest, data, known) < taskIndex);
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
  return view?.status === 'active' && questDeliveryCells(state, view.quest, data).every(index => index >= 0)
    && (!view.quest.booked || (bookedTonight(state, view.quest) && clockMinutes(state, data) >= data.day.booking));
}
/** The merges that one day holds, from opening to closing. */
export const dayMerges = (data: GameData) => (data.day.closing - data.day.opening) / data.day.mergeMinutes;
/** The time of day, in minutes after midnight. */
export const clockMinutes = (state: Pick<GameState, 'clock'>, data: GameData) => data.day.opening + state.clock.merges * data.day.mergeMinutes;
/** A time of day as "hh:mm". */
export const clockText = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
/** A loose raw ingredient: a stage-1 dish of a paid chain. Herbs and cooked dishes are safe overnight. A blocked cell holds no item. */
export function looseRaw(code: string, data: GameData): boolean {
  const item = getItem(code, data);
  return !!item && !item.generator && item.chain !== MIXED && item.stage === 1 && !data.items[`generator_${item.chain}`]?.generator?.free;
}
export const looseRawCells = (state: GameState, data: GameData) => state.board.flatMap((cell, index) => cell && looseRaw(cell.code, data) ? [index] : []);
/** A booked quest is tonight's while its guest has the evening and the day has had no booked delivery. */
export const bookedTonight = (state: Pick<GameState, 'evening'>, quest: Quest) => !!quest.booked && state.evening.guest === quest.character && !state.evening.delivered;
/** Tonight's booked quest before the booking time: its ticket has the lantern control in place of Deliver. */
export const awaitsLanterns = (state: GameState, quest: Quest, data: GameData) => bookedTonight(state, quest) && clockMinutes(state, data) < data.day.booking;
/** The lantern control moves the clock to the booking time: tonight's booked quest, on its ticket, before the booking time, with every portion on the board. */
export function canLightLanterns(state: GameState, quest: Quest, data: GameData): boolean {
  return awaitsLanterns(state, quest, data) && resolveQuests(state, data).find(view => view.quest === quest)?.status === 'active'
    && questDeliveryCells(state, quest, data).every(index => index >= 0);
}
/** The text of a booked ticket. Only the evening that the game fixed gets a time. */
export const bookedTicket = (state: Pick<GameState, 'evening'>, quest: Quest, data: GameData) =>
  !quest.booked ? null : bookedTonight(state, quest) ? `Booked for ${clockText(data.day.booking)}` : 'Booked for another evening';
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
/** A source makes only the first item of its chain while its chain is available. */
export function generatorOutputs(state: Pick<GameState, 'taskIndex'>, generatorCode: string, data: GameData): string[] {
  const item = getItem(generatorCode, data);
  if (!item?.generator || !availableChains(state, data).includes(item.chain)) return [];
  return item.generator.outputs;
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
