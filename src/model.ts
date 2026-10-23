// The content and state types of the bistro game, and the read-only questions that the rules and the interface ask about a game.
// Nothing here changes a state, reads the clock, or touches the page.

/** What a dish contains. A mixed dish has every tag of its parts. The data check enforces the diets with these tags. */
export const dishTags = ['meat', 'pork', 'dairy', 'egg', 'fish', 'alcohol', 'garlic'] as const;
export type DishTag = typeof dishTags[number];
/** The food atlases: one for each chain, and four for the mixed dishes. Each is a grid of four columns and two rows. */
export const foodAtlases = ['grain', 'corn', 'herbs', 'dairy', 'poultry', 'vegetables', 'fruits', 'pork', 'beans', 'lamb', 'veal', 'fish', 'pickles', 'greens', 'garden', 'soups', 'mains', 'sweets', 'breads', 'summer'] as const;
export type FoodAtlas = typeof foodAtlases[number];
/** The chain of every mixed dish. A mixed dish has no stage path: its recipe names its two parts. */
export const MIXED = 'mixed';
/**
 * A source (stage 0, with a generator), a chain dish (`<chain>_<stage>`), or a mixed dish (chain `mixed`, with a recipe of two parts).
 * Art names the atlas and the cell of its picture. A source with free set takes without a coin. Price is the menu price before the
 * first garden stage.
 */
export type Item = {
  id: string; name: string; chain: string; stage: number; next: string | null; art: { atlas: FoodAtlas; cell: number }; price: number; tags: DishTag[];
  generator?: { outputs: string[]; free?: true }; recipe?: [string, string];
};
export type SceneLine = { speaker: string; text: string };
/**
 * A diet forbids tags, can require a dish and a tag in each quest, and can forbid two tags in one quest. A diet that keeps Lent also
 * forbids meat, dairy, egg, and fish during Lent, except fish on the fish days.
 */
type Diet = { name: string; forbid: DishTag[]; require?: { item: string; tag: DishTag }; apart?: [DishTag, DishTag]; lent?: true };
/**
 * A person of the bistro. The core characters drive the story. Mara's parents (family) speak only in the prologue, and they are not neighbours. A regular is a neighbour who arrives with the preparation that
 * arrivesAfter names, or is present from the start; arrival plays a short scene, and favourites names the dishes that they like.
 * A character with provisions orders food for several days or for other people. Every other quest is one meal for each eater.
 */
export type Character = {
  id: string; name: string; role: string; introduction: string; sprite: number; visitor?: boolean; singleVisit?: boolean;
  portraitAtlas?: PortraitAtlas; regular?: boolean; arrivesAfter?: string; favourites?: string[]; arrival?: SceneLine[]; diet?: Diet;
  provisions?: true; family?: true;
};
export const portraitAtlases = ['guest', 'regulars-1', 'regulars-2', 'regulars-3', 'family', 'summer-guests'] as const;
type PortraitAtlas = typeof portraitAtlases[number];
/**
 * A preparation. Its chapter is the number of its chapter in the list of all chapters. The purchase is the last payment of its act: it
 * belongs to no chapter's steps, changes no room, earns no blockers, and opens only on its date.
 */
export type Task = {
  id: string; chapter: number; title: string; cost: number; work: { summary: string; materials: number; labour: number; hours: number }; dialogue: SceneLine[]; unlock?: string;
  purchase?: true; opens?: number;
};
export type TaskRequirement =
  | { kind: 'coins' | 'quests'; current: number; required: number; met: boolean }
  | { kind: 'space'; source: string; met: boolean }
  | { kind: 'date'; day: number; met: boolean };
type TaskEligibility = { task: Task | null; ready: boolean; requirements: TaskRequirement[]; blockers: string[] };
/**
 * A quest from a character. It opens after the preparation that afterTask names (null: in a new game), after afterQuest, and after
 * the earlier quests of its character. Unlocks names a decoration finish that the delivery adds. A follow-up scene is earned after
 * afterDeliveries further deliveries. A finale quest (the supper, the feast) names its finale scene: it asks for one plate for each
 * guest, in the order of guests, pays nothing, and earns the finale. A null guest is the empty chair of Mamaia. The recovery quest is
 * open only while the purse runs low (recoveryOpen); its delivery pays its reward and is never recorded, and it stands outside the
 * order of its character's quests. A repeating quest opens only while the bistro has no other work (openRepeating); like the recovery
 * quest, it is never recorded. Its afterQuest is the campaign quest that it follows, and during limits it to a range of days.
 * A campaign quest with opens does not open before that day. A holiday quest delivers from the day of its holiday. A March quest
 * opens only in March, and no preparation needs it. A quest of act 2 opens only in act 2, and a quest of a later act that the
 * calendar does not reach never opens. An outdoor quest delivers only on a terrace day. A booked quest with evening has that fixed
 * evening, outside the turns of the booked guests. A stall quest feeds a crowd, so it needs no favourite and no meal limit. The
 * piper's delivery keeps the thief rat away. Painting names the painting that ends the completion scene.
 */
export type Quest = {
  id: string; character: string; title: string; afterTask: string | null; afterQuest?: string;
  requirements: { item: string; quantity: number }[]; reward: number; opening: SceneLine[]; completion: SceneLine[];
  companions?: string[]; unlocks?: { slot: string; variant: string }; finale?: string; guests?: (string | null)[]; recovery?: true; booked?: true; repeating?: true;
  followUp?: { id: string; title: string; afterDeliveries: number; dialogue: SceneLine[] };
  opens?: number; holiday?: string; march?: true; act?: 2 | 3 | 4; outdoor?: true; during?: { from: number; to: number };
  evening?: number; stall?: true; piper?: true; painting?: Painting;
};
/** A painting that ends a scene: its image, a short title, and its words for screen readers. */
export type Painting = { image: string; title: string; text: string };
/**
 * The levers of the bistro day. Times are minutes after midnight. Each merge adds mergeMinutes to the clock, and the merge
 * that reaches closing pays the upkeep. A booked quest delivers from booking to closing. A Sunday opens later, closes earlier, and has
 * no booking time.
 */
export type DayLevers = {
  opening: number; closing: number; booking: number; sunday: { opening: number; closing: number }; mergeMinutes: number; upkeep: number;
  ratTake: number; ratHoles: number; giftStage: number; giftSpace: number;
};
export type Weather = 'fair' | 'rain' | 'snow';
/** A holiday. On a holiday with noEvening, no booked guest dines. */
export type Holiday = { id: string; name: string; day: number; noEvening?: true };
/**
 * A day that holds: a merge that reaches its closing time does not close it before its release, the payment of the preparation that
 * task names or the delivery of the quest that quest names. Line is Mara's line while it holds. On a day with bookings, each booked
 * delivery ends the evening of its guest, and the next guest comes at once.
 */
export type Hold = { day: number; task?: string; quest?: string; line: string; bookings?: true };
/** A fast that Ilie and Cătălina keep by the rules of Lent: no meat, dairy, egg, or fish, except fish on its fish days. */
export type Fast = { from: number; to: number; fish: number[] };
/**
 * The calendar. A day is a number: day 1 is Saturday 15 February of year 1, and start is its day of year 1. The supper is on the last
 * day of act 1, and end is the last day of the calendar. Weather holds the weather of each day. The fasts and the terrace season are
 * ranges of days. Each window view shows from its day until the next view. Each holiday decoration shows in its range of days, cropped
 * from the image of its area, which matches the room paintings of that area.
 */
export type Calendar = {
  start: number; supper: number; end: number; weather: Weather[]; holidays: Holiday[]; holds: Hold[];
  fasts: Fast[]; terrace: { from: number; to: number };
  views: { id: string; from: number }[];
  decorations: { id: string; name: string; area: string; image: string; from: number; to: number; crop: { x: number; y: number; width: number; height: number } }[];
};
/** An act of the campaign: its first and last days, and the levers of its day. */
export type Act = { from: number; to: number; day: DayLevers };
/**
 * A chain of dishes. A seasonal chain has a source that is on the board only in its season, a range of days, and after the preparation
 * that after names. A garden chain gives garden ingredients.
 */
export type Chain = { id: string; name: string; season?: { from: number; to: number; departure: string; after?: string }; garden?: true };
/**
 * The levers of the economy. A take from a paid source spends takeCost. Each cleared blocker gives blockerCoin. A menu price is
 * the value of the ingredients + merges × workRate. The recovery quest opens while a quest is open and the purse is below recoveryFloor.
 * Each payment of a garden preparation adds a garden stage. From the first stage, a take of a garden ingredient is free, and the
 * ingredient counts the garden value of the stage in a menu price.
 */
export type Economy = { takeCost: number; blockerCoin: number; workRate: number; recoveryFloor: number; garden: { after: string[]; values: number[] } };
/**
 * A chapter of the story. Its preparations are the tasks that name its number. Opening sets the scene when the chapter starts,
 * objective is its goal, payoff says what the chapter changed, and closing is the scene that plays when its last preparation completes.
 * Contribution is the optional neighbour quest that opens during the chapter. Act is the number of its act.
 */
export type Chapter = { id: string; title: string; objective: string; opening: string; payoff: string; contribution: string; closing: SceneLine[]; opens: number; act: number };
/**
 * The scene that serving a finale quest earns: the supper of act 1 and the feast of act 2. Day is its date, from the booking time.
 * Ending is the line under its painting. Forbid names the tags that no plate has, on a fasting feast. After the finale, the area of the
 * painting shows the painting, framed on its focus, in percentages of the painting.
 */
export type Finale = { id: string; title: string; dialogue: SceneLine[]; ending: string; day: number; painting: Painting & { area: string; focus: { x: number; y: number } }; forbid?: DishTag[] };
export type ChapterView = { chapter: Chapter; number: number; tasks: Task[]; done: number; status: 'complete' | 'current' | 'locked' };
/** Active: on a ticket. Waiting: open, until a ticket is free. */
type QuestView = { quest: Quest; status: 'active' | 'waiting' | 'locked' | 'complete' };
/** A room of an act. The first area of an act is open from the start of the act; another opens with the preparation named by unlock. */
export type Area = { id: string; name: string; unlock: string | null; act: number };
export type DecorationVariant = { id: string; name: string; image: string };
export type DecorationSlot = {
  id: string; name: string; area: string; unlock: string; default: string; variants: DecorationVariant[];
  crop: { x: number; y: number; width: number; height: number };
};
type DecorationView = DecorationSlot & { unlocked: boolean; selected: DecorationVariant };
export type BoardObstacle = { id: string; position: number; name: string; type: 'clutter' | 'anchored' | 'rat-hole'; ingredient: string; sprite?: number; atlas?: 'preparation' | 'hail'; context?: string };
export type BoardLayout = { id: string; obstacles: BoardObstacle[] };
export type PreparationObstacleBatch = { after: string; context: string; obstacles: Omit<BoardObstacle, 'position' | 'context'>[] };
/** An authored batch of weather blockers that waits from the opening time of its day, in the queue of the preparation blockers. */
export type WeatherObstacleBatch = Omit<PreparationObstacleBatch, 'after'> & { day: number };
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
  'courtyard-23', 'summer-kitchen-00', 'summer-kitchen-01', 'summer-kitchen-02', 'summer-kitchen-03', 'summer-kitchen-04',
  'summer-kitchen-15', 'summer-kitchen-16', 'summer-kitchen-19', 'summer-kitchen-20', 'vegetable-garden-05', 'vegetable-garden-06',
  'vegetable-garden-13', 'vegetable-garden-14', 'vegetable-garden-17', 'vegetable-garden-18', 'vegetable-garden-21', 'vegetable-garden-22',
  'town-square-07', 'town-square-08', 'town-square-09', 'town-square-10', 'town-square-11', 'town-square-12', 'town-square-23', 'town-square-24',
];
/** The finale and quest paintings whose masters the user accepted and whose variants ship. A painting that is not in this list is told only in words. */
export const scenePaintings: readonly string[] = ['finale-supper', 'festival', 'finale-feast'];
/** A scene of the prologue. A notebook page is a painting that takes the place of the illustration of its event, with its words for screen readers. */
export type PrologueScene = { id: string; title: string; dialogue: SceneLine[]; page?: { image: string; text: string } };
/**
 * An event of the prologue: one play day with a meal. Day is its date as a day of the calendar of act 1, so it is below 1. The board holds
 * its sources and its prepared dishes, and its layout holds its blockers. On a fasting day no quest has a dish with a fasting tag.
 * Room names the painted state of the family kitchen. Scene is the illustration of its scenes and of Mara's quests. Its quests pay nothing.
 */
export type PrologueEvent = {
  id: string; title: string; line: string; day: number; fasting?: true; board: (string | null)[]; layout: BoardLayout; room: string;
  scene: { image: string; text: string }; quests: Quest[]; opening: PrologueScene; closing: PrologueScene;
};
/** The prologue: its events in story order, the painted states of the family kitchen, the tags of a fasting day, and the starting gift of act 1. */
export type Prologue = { title: string; events: PrologueEvent[]; rooms: RoomState[]; fasting: DishTag[]; gift: number };
export type GameData = {
  board: { columns: number; rows: number; initial: (string | null)[]; defaultLayout: string; layouts: BoardLayout[]; preparations: PreparationObstacleBatch[]; hail: WeatherObstacleBatch };
  chains: Chain[]; items: Record<string, Item>; characters: Character[]; chapters: Chapter[]; finales: Finale[]; tasks: Task[];
  areas: Area[]; rooms: RoomState[]; decorationSlots: DecorationSlot[]; economy: Economy; acts: Act[]; calendar: Calendar;
  quests: Quest[]; prologue: Prologue;
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
 * The last closing. A rat comes only on Sunday night. The thief rat takes loose raw ingredients: the trapped one stays blocked in a new
 * rat hole, and a thief with no trapped ingredient found every rat hole open. Șoricescu leaves a gift, and a visit with no gift found too
 * few free cells. Piper is true on a Sunday night when the piper's tune kept the thief rat away and no rat came. A closing without a rat
 * has no morning dialog, so its report is seen at once, except a Sunday night of the piper. Departed names the seasonal chains whose
 * source left the board.
 */
export type NightReport = {
  day: number; upkeep: number; rat: 'thief' | 'soricescu' | null; taken: Placed[]; trapped: Placed | null;
  gift: (Placed & { first: boolean }) | null; departed: string[]; purse: number; seen: boolean; piper: boolean;
};
export type GameState = {
  version: 18; board: (Cell | null)[];
  /** The current event of the prologue, or null in the acts. During the prologue, the clock stays at day 1 with no merges. */
  prologue: { event: number } | null;
  /** The purse. Below zero, it is a debt in the notebook of the village shop. */
  coins: number; taskIndex: number;
  discovered: string[]; decorations: string[];
  decorationChoices: Record<string, string>;
  /** The delivered quests, in the order of delivery. The served event quests of the prologue come first. */
  completedQuests: string[];
  layoutId: string; resolvedObstacles: string[];
  /**
   * Completed preparations at adoption, and permanent placement history. Missing records do not add past batches. Hail is the number of
   * paid batches that waited before the hail: the hail joins the queue after them at the opening time of its day.
   */
  preparationObstacles?: { start: number; placed: { id: string; position: number }[]; hail?: number };
  /**
   * The earned scenes that the player has not finished: preparation scenes, quest completion scenes, regular arrival
   * scenes, local news, chapter closing scenes, and the finale. Preparation scenes, chapter scenes, and the finale keep story order.
   */
  pendingScenes: string[];
  /** The day number and the merges of the current day. The purchase of the last act stops the clock. */
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
  /** The purse when the supper was served: the result of act 1. */
  act1: { purse: number } | null;
  /** The purse after the purchase of the orchard: the result of act 2. */
  act2: { purse: number } | null;
  /** The Sunday closings left without the thief rat, after the delivery of the piper's quest. */
  piper: number;
  /** The last delivered repeating quest and the open one. A missing record means neither. */
  repeating?: { last: string | null; open: string | null };
  /** The March quests that opened. An open March quest stays open after March. */
  march: string[];
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
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** The day of the year of a date: 1 January is 1. Each year has 365 days. */
export const yearDay = (month: number, date: number) => MONTH_DAYS.slice(0, month - 1).reduce((sum, days) => sum + days, 0) + date;
/** The date of a day: its year, its month (1 to 12), its day of the month, and its weekday (0 is Sunday). Year 1 starts on a Wednesday. */
export function calendarDate(day: number, data: Pick<GameData, 'calendar'>) {
  const offset = data.calendar.start + day - 2, year = 1 + Math.floor(offset / 365);
  let rest = offset - (year - 1) * 365, month = 0;
  while (rest >= MONTH_DAYS[month]) rest -= MONTH_DAYS[month++];
  return { year, month: month + 1, date: rest + 1, weekday: ((3 + offset) % 7 + 7) % 7 };
}
/** A date as text: short "Sat 15 Feb", long "Saturday 15 February", or plain "15 February". */
export function dateText(day: number, data: Pick<GameData, 'calendar'>, form: 'short' | 'long' | 'plain' = 'long') {
  const { month, date, weekday } = calendarDate(day, data);
  return form === 'short' ? `${WEEKDAYS[weekday].slice(0, 3)} ${date} ${MONTHS[month - 1].slice(0, 3)}`
    : form === 'long' ? `${WEEKDAYS[weekday]} ${date} ${MONTHS[month - 1]}` : `${date} ${MONTHS[month - 1]}`;
}
export const isSunday = (day: number, data: Pick<GameData, 'calendar'>) => calendarDate(day, data).weekday === 0;
/** The number of the act of a day: the first act whose last day is not before it. The days of the prologue belong to act 1. */
export const actOf = (day: number, data: Pick<GameData, 'acts'>) => {
  const at = data.acts.findIndex(act => day <= act.to);
  return at < 0 ? data.acts.length : at + 1;
};
/** The levers of the day of a day: those of its act. */
export const levers = (day: number, data: Pick<GameData, 'acts'>) => data.acts[actOf(day, data) - 1].day;
/** The opening hours of a day. A Sunday opens later, closes earlier, and has no booking time. */
export function dayHours(day: number, data: Pick<GameData, 'calendar' | 'acts'>): { opening: number; closing: number; booking: number | null } {
  const { opening, closing, booking, sunday } = levers(day, data);
  return isSunday(day, data) ? { ...sunday, booking: null } : { opening, closing, booking };
}
/** The merges that one day holds, from opening to closing. */
export const dayMerges = (day: number, data: Pick<GameData, 'calendar' | 'acts'>) => {
  const hours = dayHours(day, data);
  return (hours.closing - hours.opening) / levers(day, data).mergeMinutes;
};
/** The finale whose day it is, if any. */
const finaleOn = (day: number, data: Pick<GameData, 'finales'>) => data.finales.find(finale => finale.day === day);
/** A day has an evening guest only with a booking time, on a day other than a finale and a holiday without evenings. */
export const eveningOpen = (day: number, data: GameData) => dayHours(day, data).booking !== null && !finaleOn(day, data)
  && !data.calendar.holidays.some(holiday => holiday.day === day && holiday.noEvening);
export const weather = (day: number, data: Pick<GameData, 'calendar'>) => data.calendar.weather[day - 1] ?? 'fair';
/** A terrace day: a fair day in the terrace season. The courtyard seats guests only then. */
export const terraceDay = (day: number, data: Pick<GameData, 'calendar'>) =>
  day >= data.calendar.terrace.from && day <= data.calendar.terrace.to && weather(day, data) === 'fair';
const inMarch = (day: number, data: Pick<GameData, 'calendar'>) => calendarDate(day, data).month === 3;
/** The window view of a day: the latest view that starts on or before it. */
export const windowView = (day: number, data: Pick<GameData, 'calendar'>) => data.calendar.views.findLast(view => view.from <= day) ?? data.calendar.views[0];
/** The holiday decorations of an area on a day. */
export const holidayDecorations = (day: number, area: string, data: Pick<GameData, 'calendar'>) =>
  data.calendar.decorations.filter(decoration => decoration.area === area && day >= decoration.from && day <= decoration.to);
/** The holiday of a holiday quest. */
export const questHoliday = (quest: Quest, data: GameData) => quest.holiday === undefined ? undefined : data.calendar.holidays.find(holiday => holiday.id === quest.holiday);
/** The season of a seasonal chain, or undefined for a chain that is open all year. */
export const chainSeason = (chain: string, data: GameData) => data.chains.find(value => value.id === chain)?.season;
/** A rat hole as a blocker. It has no ID of its own: a cleared rat hole leaves the list, so it never enters the cleared blockers. */
const ratHole = (hole: Placed): BoardObstacle => ({ id: `rat-hole-${hole.position}`, position: hole.position, name: 'Rat hole', type: 'rat-hole',
  ingredient: hole.item, context: 'The thief rat dropped it here in the night.' });
/** A board layout by its ID: a layout of act 1, or the layout of an event of the prologue. */
export const boardLayout = (id: string, data: GameData) => data.board.layouts.find(layout => layout.id === id) ?? data.prologue.events.find(event => event.layout.id === id)?.layout;
/** The batch of a preparation blocker or of a weather blocker, by the ID of the blocker. */
const obstacleBatch = (id: string, data: GameData) => [...data.board.preparations, data.board.hail].find(batch => batch.obstacles.some(obstacle => obstacle.id === id));
export function boardObstacles(state: Pick<GameState, 'layoutId' | 'preparationObstacles' | 'ratHoles'>, data: GameData): BoardObstacle[] {
  return [...(boardLayout(state.layoutId, data)?.obstacles ?? []),
    ...(state.preparationObstacles?.placed.flatMap(placement => {
      const batch = obstacleBatch(placement.id, data);
      const obstacle = batch?.obstacles.find(obstacle => obstacle.id === placement.id);
      return obstacle ? [{ ...obstacle, position: placement.position, context: batch!.context }] : [];
    }) ?? []), ...state.ratHoles.map(ratHole)];
}
export function unresolvedObstacle(state: Pick<GameState, 'layoutId' | 'resolvedObstacles' | 'preparationObstacles' | 'ratHoles'>, index: number, data: GameData): BoardObstacle | null {
  const initial = boardLayout(state.layoutId, data)?.obstacles.find(obstacle =>
    obstacle.position === index && !state.resolvedObstacles.includes(obstacle.id));
  if (initial) return initial;
  const hole = state.ratHoles.find(value => value.position === index);
  if (hole) return ratHole(hole);
  const placement = state.preparationObstacles?.placed.find(value => value.position === index && !state.resolvedObstacles.includes(value.id));
  if (!placement) return null;
  const batch = obstacleBatch(placement.id, data)!;
  return { ...batch.obstacles.find(obstacle => obstacle.id === placement.id)!, position: index, context: batch.context };
}
/**
 * The queue of the earned blockers, in the order of placement: the batches of the preparations paid after the start of the record, with
 * the hail after the batches that waited at the opening time of its day.
 */
export function earnedObstacles(progress: NonNullable<GameState['preparationObstacles']>, taskIndex: number, data: GameData) {
  const batches = data.tasks.slice(progress.start, taskIndex).flatMap(task => data.board.preparations.filter(batch => batch.after === task.id));
  if (progress.hail !== undefined) batches.splice(progress.hail, 0, { ...data.board.hail, after: 'hail' });
  return batches.flatMap(batch => batch.obstacles);
}
export function pendingPreparationObstacles(state: GameState, data: GameData) {
  const progress = state.preparationObstacles;
  if (!progress) return [];
  return earnedObstacles(progress, state.taskIndex, data).filter(obstacle => !progress.placed.some(placement => placement.id === obstacle.id));
}
export function firstFreeBoardCell(state: GameState, data: GameData): number {
  return state.board.findIndex((cell, index) => cell === null && !unresolvedObstacle(state, index, data));
}
export function freeBoardCells(state: GameState, data: GameData): number {
  return state.board.reduce((count, cell, index) => count + (cell === null && !unresolvedObstacle(state, index, data) ? 1 : 0), 0);
}
/**
 * The open chains: the sources of a new game, the sources that the paid preparations opened, and each seasonal chain from the first
 * day of its season, after the preparation that it waits for. A seasonal chain stays open after its season, so its dishes stay on the
 * board.
 */
export const availableChains = (state: Pick<GameState, 'taskIndex'> & { clock: { day: number } }, data: GameData) => [...new Set([
  ...data.board.initial.filter(present).filter(code => data.items[code].generator).map(code => data.items[code].chain),
  ...data.tasks.slice(0, state.taskIndex).flatMap(task => task.unlock ? [task.unlock] : []),
  ...data.chains.flatMap(chain => chain.season && state.clock.day >= chain.season.from && seasonPaid(chain, state.taskIndex, data) ? [chain.id] : []),
])];
/** A seasonal chain that waits for a preparation opens only after its payment. */
export const seasonPaid = (chain: Chain, taskIndex: number, data: GameData) => {
  const after = chain.season?.after;
  return after === undefined || data.tasks.findIndex(task => task.id === after) < taskIndex;
};
/** The cell of the source of a chain on the board, or -1. */
export const sourceCell = (state: Pick<GameState, 'board'>, chain: string) => state.board.findIndex(cell => cell?.code === `generator_${chain}`);
/**
 * A seasonal source stays after its season while an undelivered campaign quest of an act that the calendar reaches, or the open
 * repeating quest, asks for a dish of its chain.
 */
export function sourceNeeded(state: Pick<GameState, 'completedQuests' | 'repeating'>, chain: string, data: GameData): boolean {
  return data.quests.some(quest => playable(quest, data) && !quest.recovery && (quest.repeating ? state.repeating?.open === quest.id : !state.completedQuests.includes(quest.id))
    && quest.requirements.some(({ item }) => dishChains(item, data).includes(chain)));
}
/** A quest of an act that the calendar reaches. A quest of a later act stays in the data and never opens. */
export const playable = (quest: Quest, data: Pick<GameData, 'acts'>) => (quest.act ?? 1) <= data.acts.length;
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
/** The garden stage after the paid preparations: the number of paid garden preparations. */
export const gardenStage = (taskIndex: number, data: GameData) =>
  data.economy.garden.after.filter(id => { const at = data.tasks.findIndex(task => task.id === id); return at >= 0 && at < taskIndex; }).length;
const gardenChain = (chain: string, data: GameData) => !!data.chains.find(value => value.id === chain)?.garden;
/**
 * The coins that one take from the source of a chain spends: nothing from a free source, and nothing from a garden source from the
 * first garden stage.
 */
const chainTakeCost = (chain: string, stage: number, data: GameData) =>
  data.items[`generator_${chain}`]?.generator?.free || (stage > 0 && gardenChain(chain, data)) ? 0 : data.economy.takeCost;
export const takeCost = (source: Item, data: GameData, stage = 0) => chainTakeCost(source.chain, stage, data);
/**
 * The value of one ingredient of a chain in a menu price: the garden value of the stage for a garden ingredient from the first garden
 * stage, and otherwise its take cost.
 */
const ingredientValue = (chain: string, stage: number, data: GameData) =>
  stage > 0 && gardenChain(chain, data) ? data.economy.garden.values[stage - 1] : chainTakeCost(chain, stage, data);
/** The stage-1 ingredients of each chain and the merges that a dish needs from its sources. */
function dishParts(code: string, data: GameData): { ingredients: Map<string, number>; merges: number } {
  const item = data.items[code];
  if (item.recipe) {
    const [first, second] = item.recipe.map(part => dishParts(part, data)), ingredients = new Map(first.ingredients);
    for (const [chain, count] of second.ingredients) ingredients.set(chain, (ingredients.get(chain) ?? 0) + count);
    return { ingredients, merges: first.merges + second.merges + 1 };
  }
  const count = 2 ** (item.stage - 1);
  return { ingredients: new Map([[item.chain, count]]), merges: count - 1 };
}
/** The paid ingredients before the first garden stage and the merges that a dish needs. An ingredient of a free source counts as zero. */
export function dishWork(code: string, data: GameData): { staples: number; merges: number } {
  const { ingredients, merges } = dishParts(code, data);
  return { staples: [...ingredients].reduce((sum, [chain, count]) => sum + (chainTakeCost(chain, 0, data) ? count : 0), 0), merges };
}
/** The menu price of a dish at a garden stage: the value of its ingredients + merges × work rate. */
export function menuPrice(code: string, data: GameData, stage = 0): number {
  const { ingredients, merges } = dishParts(code, data);
  return [...ingredients].reduce((sum, [chain, count]) => sum + count * ingredientValue(chain, stage, data), 0) + merges * data.economy.workRate;
}
/** The menu value of a quest at a garden stage: the sum of the prices of its portions. */
export const menuValue = (quest: Pick<Quest, 'requirements'>, data: GameData, stage = 0) =>
  quest.requirements.reduce((sum, { item, quantity }) => sum + menuPrice(item, data, stage) * quantity, 0);
/** The coins that the ingredients of a quest cost at their sources at a garden stage. */
export const stapleCost = (quest: Pick<Quest, 'requirements'>, data: GameData, stage = 0) => quest.requirements.reduce((sum, { item, quantity }) =>
  sum + [...dishParts(item, data).ingredients].reduce((cost, [chain, count]) => cost + count * chainTakeCost(chain, stage, data), 0) * quantity, 0);
/** The reward of a delivery: a repeating quest and the recovery quest pay their menu value at the current garden stage. */
export const questReward = (quest: Quest, state: Pick<GameState, 'taskIndex'>, data: GameData) =>
  quest.repeating || quest.recovery ? menuValue(quest, data, gardenStage(state.taskIndex, data)) : quest.reward;
/** The preparation, the earlier quests, and the opening date of a quest are behind the player. */
export function prerequisitesMet(state: Pick<GameState, 'decorations' | 'completedQuests' | 'clock'>, quest: Quest, data: GameData): boolean {
  return (quest.afterTask === null || state.decorations.includes(quest.afterTask)) && questPredecessors(quest, data).every(id => questDone(state, id))
    && (quest.opens === undefined || state.clock.day >= quest.opens);
}
/** A March quest opens in March once its prerequisites are met. The engine records it in the same change. */
export const marchOpens = (state: Pick<GameState, 'decorations' | 'completedQuests' | 'clock' | 'march'>, quest: Quest, data: GameData) =>
  !!quest.march && !state.march.includes(quest.id) && inMarch(state.clock.day, data) && prerequisitesMet(state, quest, data);
/** A quest opens only in its act or later, and a quest of an act that the calendar does not reach never opens. A March quest is open once it opened in March. */
function questReady(state: GameState, quest: Quest, data: GameData): boolean {
  if (!playable(quest, data) || (quest.act ?? 1) > actOf(state.clock.day, data)) return false;
  return quest.march ? state.march.includes(quest.id) : prerequisitesMet(state, quest, data);
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
/** The neighbours of the bistro: the core characters, then the regulars in order of arrival, each with their delivered quests. Mara's parents are not neighbours. */
export function resolveNeighbours(state: GameState, data: GameData) {
  const order = (person: Character) => person.arrivesAfter === undefined ? -1 : data.tasks.findIndex(task => task.id === person.arrivesAfter);
  return data.characters.filter(person => !person.visitor && !person.family).sort((a, b) => Number(isRegular(a)) - Number(isRegular(b)) || order(a) - order(b))
    .map(person => ({ person, arrived: hasArrived(state, person),
      delivered: state.completedQuests.filter(id => data.quests.find(quest => quest.id === id)?.character === person.id).length }));
}
const questDone = (state: Pick<GameState, 'completedQuests'>, id: string) => state.completedQuests.includes(id);
/**
 * The earlier quests of the same character, and afterQuest. The recovery quest needs none, and a repeating quest needs only the
 * campaign quest that it follows. Neither is a predecessor of another quest. A quest of a later act is no predecessor of a quest of an
 * earlier act, and a March quest is a predecessor only of a later March quest.
 */
export function questPredecessors(quest: Quest, data: GameData): string[] {
  if (quest.recovery) return [];
  if (quest.repeating) return quest.afterQuest ? [quest.afterQuest] : [];
  const earlier = data.quests.slice(0, data.quests.indexOf(quest)).filter(previous => previous.character === quest.character && !previous.recovery && !previous.repeating
    && (previous.act ?? 1) <= (quest.act ?? 1) && (!previous.march || !!quest.march));
  return [...new Set([...(quest.afterQuest ? [quest.afterQuest] : []), ...earlier.map(previous => previous.id)])];
}
/** A repeating quest is in the cycle once its character has arrived, the chain of each dish is open, and the quest that it follows is delivered. */
export function cycleMember(state: Pick<GameState, 'taskIndex' | 'decorations' | 'completedQuests' | 'clock'>, quest: Quest, data: GameData): boolean {
  const person = data.characters.find(person => person.id === quest.character), chains = availableChains(state, data);
  return !!quest.repeating && !!person && hasArrived(state, person) && quest.requirements.every(({ item }) => dishOpen(item, chains, data))
    && (!quest.afterQuest || state.completedQuests.includes(quest.afterQuest));
}
/** A member of the cycle joins it in its season: inside its range of days, and while the source of each seasonal chain of its dishes is on the board. */
export function canJoinCycle(state: Pick<GameState, 'taskIndex' | 'decorations' | 'completedQuests' | 'clock' | 'board'>, quest: Quest, data: GameData): boolean {
  const day = state.clock.day;
  return cycleMember(state, quest, data) && (!quest.during || (day >= quest.during.from && day <= quest.during.to))
    && quest.requirements.every(({ item }) => dishChains(item, data).every(chain => !chainSeason(chain, data) || sourceCell(state, chain) >= 0));
}
/** The repeating quests take turns: the next one after the last delivered one, in data order, that can join the cycle. */
function nextRepeating(state: GameState, data: GameData): Quest | undefined {
  const cycle = data.quests.filter(quest => quest.repeating), last = cycle.findIndex(quest => quest.id === state.repeating?.last);
  for (let step = 1; step <= cycle.length; step++) {
    const quest = cycle[(last + step) % cycle.length];
    if (canJoinCycle(state, quest, data)) return quest;
  }
  return undefined;
}
/**
 * The open repeating quest: the saved one, which stays open until its delivery, or the next one while the bistro has no work.
 * The bistro has no work if no open quest has work, the recovery quest is closed, and the next preparation is not ready to pay.
 * The engine saves the quest that opens, in the same change.
 */
function openRepeating(state: GameState, views: QuestView[], data: GameData): Quest | undefined {
  if (state.repeating?.open) return data.quests.find(quest => quest.id === state.repeating!.open);
  // A quest for a later day has work while the board lacks a portion: the player can cook it now, but cannot deliver it on this day.
  // These meals share no portion. Every other open quest has work.
  const open = views.filter(view => view.status === 'active' || view.status === 'waiting').map(view => view.quest);
  const later = open.filter(quest => laterDay(state, quest, data));
  const busy = open.length > later.length || questDeliveryCells(state, { requirements: later.flatMap(quest => quest.requirements) }).some(index => index < 0);
  return busy || taskEligibility(state, data).ready ? undefined : nextRepeating(state, data);
}
/** The current event of the prologue, or undefined in act 1. */
export const currentEvent = (state: Pick<GameState, 'prologue'>, data: GameData) => state.prologue ? data.prologue.events[state.prologue.event - 1] : undefined;
/** The date of the game: the date of the current event in the prologue, and the day of the clock in act 1. */
export const gameDay = (state: Pick<GameState, 'prologue' | 'clock'>, data: GameData) => currentEvent(state, data)?.day ?? state.clock.day;
/** The event quests of the prologue, in event order. */
export const prologueQuests = (data: GameData) => data.prologue.events.flatMap(event => event.quests);
/** A quest by its ID: a quest of an act, or an event quest of the prologue. */
export const findQuest = (id: string, data: GameData) => data.quests.find(quest => quest.id === id) ?? prologueQuests(data).find(quest => quest.id === id);
/** The number of the event of an event quest, or 0 for a quest of an act. */
export const questEvent = (quest: Quest, data: GameData) => data.prologue.events.findIndex(event => event.quests.includes(quest)) + 1;
/** Each quest of an event is served. */
export const eventComplete = (state: Pick<GameState, 'completedQuests'>, event: PrologueEvent) => event.quests.every(quest => state.completedQuests.includes(quest.id));
/** The scenes of the prologue in story order: opening 1, closing 1, opening 2, and so on to closing 7. */
export const prologueScenes = (data: GameData) => data.prologue.events.flatMap(event => [event.opening, event.closing]);
/**
 * The prologue scenes that a game has earned, in story order. A new game earns opening 1, the end of event N earns closing N and
 * opening N + 1, and the end of event 7 earns closing 7. Act 1 has earned each one.
 */
export function earnedPrologue(state: Pick<GameState, 'prologue' | 'completedQuests'>, data: GameData): string[] {
  const scenes = prologueScenes(data).map(scene => scene.id), event = currentEvent(state, data);
  return event ? scenes.slice(0, 2 * state.prologue!.event - 1 + Number(eventComplete(state, event))) : scenes;
}
/**
 * The dishes that an event board can hold: the first dish of each source, the prepared dishes, the blocked dishes, and each dish that a
 * merge of two of these makes, until no merge adds a dish. The list ignores how many of each dish the board holds.
 */
export function eventDishes(event: Pick<PrologueEvent, 'board' | 'layout'>, data: GameData): Set<string> {
  const dishes = new Set<string>();
  for (const code of event.board.filter(present)) dishes.add(data.items[code].generator?.outputs[0] ?? code);
  for (const obstacle of event.layout.obstacles) dishes.add(obstacle.ingredient);
  const recipes = Object.values(data.items).filter(item => item.recipe);
  for (let size = 0; size !== dishes.size;) {
    size = dishes.size;
    // Check each possible result once per pass. Save validation uses this list after every action.
    for (const code of dishes) if (data.items[code].next) dishes.add(data.items[code].next!);
    for (const item of recipes) if (item.recipe!.every(part => dishes.has(part))) dishes.add(item.id);
  }
  return dishes;
}
/** The number of quest tickets on the counter. The recovery quest has its own ticket after them. */
export const QUEST_TICKETS = 3;
/**
 * The recovery quest is open in two cases: another quest (the supper included) is open and the purse holds less than the recovery
 * floor, or no other quest is open and the purse cannot pay the next preparation. So a player who spends coins on spare food is never stuck.
 */
function recoveryOpen(state: GameState, data: GameData, open = data.quests.some(quest => !quest.recovery && !quest.repeating && !questDone(state, quest.id) && questReady(state, quest, data))): boolean {
  const task = currentTask(state, data);
  return open ? state.coins < data.economy.recoveryFloor : !!task && state.coins < task.cost;
}
/**
 * Open quests take the tickets in authored order: the first three are active, and the others wait for a free ticket. On a day that
 * holds, the open release requirements take the tickets first, so a quest that cannot deliver that day never keeps them off the counter.
 * A character has at most one open campaign quest, because each quest waits for the earlier quests of its character.
 * The recovery quest is active while it is open, on its own ticket, so it never moves a quest to waiting. An open repeating quest
 * takes a ticket after the campaign quests, so a campaign quest never waits for it.
 */
export function resolveQuests(state: GameState, data: GameData): QuestView[] {
  let tickets = 0;
  // In the prologue, only the quests of the current event are open. They pay nothing, so the recovery quest stays closed.
  const event = currentEvent(state, data);
  if (event) return [...event.quests.map((quest): QuestView => ({ quest, status: questDone(state, quest.id) ? 'complete' : tickets++ < QUEST_TICKETS ? 'active' : 'waiting' })),
    ...data.quests.map((quest): QuestView => ({ quest, status: 'locked' }))];
  const views: QuestView[] = data.quests.map(quest => ({ quest, status: questDone(state, quest.id) ? 'complete' : 'locked' }));
  const ready = views.filter(view => view.status === 'locked' && !view.quest.recovery && !view.quest.repeating && questReady(state, view.quest, data));
  const hold = holdsDay(state, data) ? holdOf(state.clock.day, data) : undefined, first = hold && releaseRequirements(hold, data);
  for (const view of first ? [...ready.filter(view => first.has(view.quest)), ...ready.filter(view => !first.has(view.quest))] : ready) view.status = tickets++ < QUEST_TICKETS ? 'active' : 'waiting';
  const open = ready.length > 0;
  for (const view of views) if (view.quest.recovery && recoveryOpen(state, data, open)) view.status = 'active';
  const repeating = openRepeating(state, views, data);
  if (repeating) views[data.quests.indexOf(repeating)].status = tickets++ < QUEST_TICKETS ? 'active' : 'waiting';
  return views;
}
/** The quest whose delivery earns a finale. */
export const finaleQuest = (finale: Finale, data: GameData) => data.quests.find(quest => quest.finale === finale.id);
/** The finale that a finale quest earns. */
export const questFinale = (quest: Quest, data: Pick<GameData, 'finales'>) => quest.finale === undefined ? undefined : data.finales.find(finale => finale.id === quest.finale);
/** A finale is served when its quest is delivered. */
export const finaleServed = (state: Pick<GameState, 'completedQuests'>, finale: Finale, data: GameData) => state.completedQuests.includes(finaleQuest(finale, data)?.id ?? '');
/** The supper: the finale quest of act 1. */
export const supperQuest = (data: GameData) => finaleQuest(data.finales[0], data);
/** The supper is served when its quest is delivered. */
export function supperComplete(state: Pick<GameState, 'completedQuests'>, data: GameData): boolean {
  return finaleServed(state, data.finales[0], data);
}
/**
 * A campaign quest that a preparation can need: not a finale quest, the recovery quest, a repeating quest, a March quest, or a quest of
 * an act that the calendar does not reach.
 */
export const campaignQuest = (quest: Quest, data: Pick<GameData, 'acts'>) => !quest.finale && !quest.recovery && !quest.repeating && !quest.march && playable(quest, data);
/** The quests that the preparation at this index needs: every campaign quest that opens before it. */
export function requiredQuests(taskIndex: number, data: GameData): Quest[] {
  const known = new Map<Quest, number>();
  return data.quests.filter(quest => campaignQuest(quest, data) && questOpening(quest, data, known) < taskIndex);
}
const releases = new WeakMap<Hold, Set<Quest>>();
/**
 * The release requirements of a day that holds: the quests that its release needs. A payment needs the quests of its preparation. A
 * delivery needs its quest, the quests that it waits for, and the quests of the preparations that it waits for.
 */
export function releaseRequirements(hold: Hold, data: GameData): Set<Quest> {
  const known = releases.get(hold);
  if (known) return known;
  const found = new Set<Quest>(), openings = new Map<Quest, number>();
  const need = (quest: Quest) => {
    if (found.has(quest)) return;
    found.add(quest);
    for (const other of requiredQuests(questOpening(quest, data, openings), data)) found.add(other);
    for (const id of questPredecessors(quest, data)) { const previous = data.quests.find(value => value.id === id); if (previous) need(previous); }
  };
  if (hold.task !== undefined) for (const quest of requiredQuests(data.tasks.findIndex(task => task.id === hold.task), data)) found.add(quest);
  else { const quest = data.quests.find(value => value.id === hold.quest); if (quest) need(quest); }
  releases.set(hold, found);
  return found;
}
/** A guest who visits once has a journal introduction only while their quest is open. */
export function journalCharacters(state: GameState, data: GameData): Character[] {
  const quests = resolveQuests(state, data);
  return data.characters.filter(character => hasArrived(state, character) && !character.family).filter(character => !character.singleVisit
    || quests.some(view => (view.quest.character === character.id || view.quest.companions?.includes(character.id)) && (view.status === 'active' || view.status === 'waiting')));
}
/** The cells that hold a dish, in board order. A blocked cell holds no item, so the player can move each of them. */
export const cellsOf = (state: Pick<GameState, 'board'>, code: string) => state.board.flatMap((cell, index) => cell?.code === code ? [index] : []);
/** The board cells that a delivery empties: the first matching cell that is still free for each portion, or -1 if there is none. */
export function questDeliveryCells(state: Pick<GameState, 'board'>, quest: Pick<Quest, 'requirements'>): number[] {
  const left = new Map<string, number[]>();
  return quest.requirements.flatMap(({ item, quantity }) => {
    const cells = left.get(item) ?? cellsOf(state, item);
    left.set(item, cells);
    return Array.from({ length: quantity }, () => cells.shift() ?? -1);
  });
}
export function canDeliverQuest(state: GameState, quest: Quest | string, data: GameData): boolean {
  const view = resolveQuests(state, data).find(view => view.quest.id === (typeof quest === 'string' ? quest : quest.id));
  return view?.status === 'active' && questDeliveryCells(state, view.quest).every(index => index >= 0) && deliverableNow(state, view.quest, data);
}
/**
 * The time and the day permit a delivery: tonight's booked quest and a finale on its day from the booking time, a holiday quest from
 * its holiday, and an outdoor quest on a terrace day.
 */
function deliverableNow(state: GameState, quest: Quest, data: GameData): boolean {
  const day = state.clock.day, evening = clockMinutes(state, data) >= levers(day, data).booking, holiday = questHoliday(quest, data), finale = questFinale(quest, data);
  if (quest.booked && !(bookedTonight(state, quest) && evening)) return false;
  if (finale && !(day === finale.day && evening)) return false;
  return (!holiday || day >= holiday.day) && (!quest.outdoor || terraceDay(day, data));
}
/**
 * An open quest that the player can cook now but cannot deliver on this day: a booked quest for another evening, a finale before its
 * day, a holiday quest before its holiday, and an outdoor quest on a day that is not a terrace day.
 */
export function laterDay(state: GameState, quest: Quest, data: GameData): boolean {
  const day = state.clock.day, holiday = questHoliday(quest, data), finale = questFinale(quest, data);
  return (!!quest.booked && !bookedTonight(state, quest)) || (!!finale && day < finale.day)
    || (!!holiday && day < holiday.day) || (!!quest.outdoor && !terraceDay(day, data));
}
/** The time of day, in minutes after midnight. */
export const clockMinutes = (state: Pick<GameState, 'clock'>, data: Pick<GameData, 'calendar' | 'acts'>) =>
  dayHours(state.clock.day, data).opening + state.clock.merges * levers(state.clock.day, data).mergeMinutes;
/** A time of day as "hh:mm". */
export const clockText = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
/**
 * A loose raw ingredient: a stage-1 dish of a paid chain or a seasonal chain. Herbs and cooked dishes are safe overnight. A blocked
 * cell holds no item.
 */
export function looseRaw(code: string, data: GameData): boolean {
  const item = getItem(code, data);
  return !!item && !item.generator && item.chain !== MIXED && item.stage === 1 && (!data.items[`generator_${item.chain}`]?.generator?.free || !!chainSeason(item.chain, data));
}
export const looseRawCells = (state: GameState, data: GameData) => state.board.flatMap((cell, index) => cell && looseRaw(cell.code, data) ? [index] : []);
/** A booked quest is tonight's while its guest has the evening and the day has had no booked delivery. */
export const bookedTonight = (state: Pick<GameState, 'evening'>, quest: Quest) => !!quest.booked && state.evening.guest === quest.character && !state.evening.delivered;
/** The fixed booking of a day: a booked quest whose evening is that day. Its guest has that evening, outside the turns of the booked guests. */
export const fixedBooking = (day: number, data: GameData) => data.quests.find(quest => quest.evening === day);
/**
 * Tonight's booked quest, or a finale on its day, before the booking time: its ticket has the lantern control in place of Deliver.
 */
export const awaitsLanterns = (state: GameState, quest: Quest, data: GameData) =>
  (bookedTonight(state, quest) || questFinale(quest, data)?.day === state.clock.day) && clockMinutes(state, data) < levers(state.clock.day, data).booking;
/** The lantern control moves the clock to the booking time: a quest that awaits the lanterns, on its ticket, with every portion on the board. */
export function canLightLanterns(state: GameState, quest: Quest, data: GameData): boolean {
  return awaitsLanterns(state, quest, data) && resolveQuests(state, data).find(view => view.quest === quest)?.status === 'active'
    && questDeliveryCells(state, quest).every(index => index >= 0);
}
/**
 * The note of a ticket that says when it delivers: the evening of a booked quest or a finale, the holiday of a holiday quest, or the
 * weather of an outdoor quest. Null for a ticket that delivers whenever its dishes are on the board.
 */
export function ticketNote(state: GameState, quest: Quest, data: GameData): string | null {
  const day = state.clock.day, booking = `Booked for ${clockText(levers(day, data).booking)}`, holiday = questHoliday(quest, data), finale = questFinale(quest, data);
  if (finale) return day === finale.day ? booking : `Booked for ${dateText(finale.day, data, 'plain')}`;
  if (quest.booked) return bookedTonight(state, quest) ? booking : quest.evening !== undefined ? `Booked for ${dateText(quest.evening, data)}` : 'Booked for another evening';
  if (holiday && day !== holiday.day) return day < holiday.day ? `For ${holiday.name}, ${dateText(holiday.day, data)}` : `Late for ${holiday.name}`;
  return quest.outdoor && !terraceDay(day, data) ? 'Waits for fair weather' : null;
}
/** The hold of a day, if the day can hold. */
export const holdOf = (day: number, data: Pick<GameData, 'calendar'>) => data.calendar.holds.find(hold => hold.day === day);
/** The release of a hold: the payment of its preparation or the delivery of its quest. */
export const released = (state: Pick<GameState, 'decorations' | 'completedQuests'>, hold: Hold) =>
  hold.task !== undefined ? state.decorations.includes(hold.task) : state.completedQuests.includes(hold.quest!);
/** A day holds until its release: no merge closes the day. */
export function holdsDay(state: Pick<GameState, 'clock' | 'decorations' | 'completedQuests'>, data: GameData): boolean {
  const hold = holdOf(state.clock.day, data);
  return !!hold && !released(state, hold);
}
/** A day that holds stops its clock one merge before the closing. */
export const holding = (state: Pick<GameState, 'clock' | 'decorations' | 'completedQuests'>, data: GameData) =>
  holdsDay(state, data) && state.clock.merges === dayMerges(state.clock.day, data) - 1;
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
  ...data.chapters.map(chapter => chapter.id), ...data.finales.map(finale => finale.id), ...data.quests.flatMap(quest => quest.followUp ? [quest.followUp.id] : []),
  ...data.characters.flatMap(person => person.arrival ? [arrivalScene(person)] : []), ...prologueScenes(data).map(scene => scene.id)];
/** The act of a preparation: the act of its chapter. */
export const taskAct = (task: Task, data: Pick<GameData, 'chapters'>) => data.chapters[task.chapter - 1].act;
/** The preparations of an act, in order, with its purchase. */
export const actTasks = (act: number, data: GameData) => data.tasks.filter(task => taskAct(task, data) === act);
/**
 * The story order of preparation scenes, chapter scenes, finales, and purchases: in each act, each chapter scene follows the
 * preparations of its chapter, then the finale of the act, then its purchase.
 */
export const storyOrder = (data: GameData) => data.acts.flatMap((_, at) => [
  ...data.chapters.flatMap((chapter, index) => chapter.act === at + 1 ? [...data.tasks.filter(task => task.chapter === index + 1 && !task.purchase).map(task => task.id), chapter.id] : []),
  ...data.finales.filter(finale => actOf(finale.day, data) === at + 1).map(finale => finale.id),
  ...actTasks(at + 1, data).filter(task => task.purchase).map(task => task.id)]);
/** The number of a chapter inside its act. */
export const chapterNumber = (chapter: Chapter, data: Pick<GameData, 'chapters'>) => data.chapters.filter(other => other.act === chapter.act).indexOf(chapter) + 1;
/** The content that a scene ID names: a preparation, a quest completion, a chapter's closing, a finale, a regular's arrival, local news, or a scene of the prologue. */
type SceneSource =
  | { kind: 'task'; task: Task } | { kind: 'quest'; quest: Quest } | { kind: 'chapter'; chapter: Chapter; number: number }
  | { kind: 'finale'; finale: Finale } | { kind: 'arrival'; person: Character } | { kind: 'news'; news: NonNullable<Quest['followUp']> }
  | { kind: 'prologue'; scene: PrologueScene; event: PrologueEvent; number: number };
/** The content of a scene by its ID, or null for an unknown ID. */
export function sceneSource(id: string, data: GameData): SceneSource | null {
  const task = data.tasks.find(value => value.id === id);
  if (task) return { kind: 'task', task };
  const quest = data.quests.find(value => value.id === id);
  if (quest) return { kind: 'quest', quest };
  const chapter = data.chapters.find(value => value.id === id);
  if (chapter) return { kind: 'chapter', chapter, number: chapterNumber(chapter, data) };
  const finale = data.finales.find(value => value.id === id);
  if (finale) return { kind: 'finale', finale };
  const person = data.characters.find(value => value.arrival && arrivalScene(value) === id);
  if (person) return { kind: 'arrival', person };
  const news = data.quests.find(value => value.followUp?.id === id)?.followUp;
  if (news) return { kind: 'news', news };
  const number = data.prologue.events.findIndex(event => event.opening.id === id || event.closing.id === id) + 1;
  if (!number) return null;
  const event = data.prologue.events[number - 1];
  return { kind: 'prologue', scene: event.opening.id === id ? event.opening : event.closing, event, number };
}
/**
 * Completed preparations are the only input. A chapter is complete when its last preparation is complete. Number is the number of the
 * chapter inside its act. A purchase is no step of a chapter.
 */
export function resolveChapters(state: Pick<GameState, 'taskIndex'>, data: GameData): ChapterView[] {
  const current = data.tasks.slice(state.taskIndex).find(task => !task.purchase)?.chapter ?? data.chapters.length + 1;
  return data.chapters.map((chapter, index) => {
    const tasks = data.tasks.filter(task => task.chapter === index + 1 && !task.purchase);
    return { chapter, number: chapterNumber(chapter, data), tasks, done: tasks.filter(task => data.tasks.indexOf(task) < state.taskIndex).length,
      status: index + 1 < current ? 'complete' : index + 1 === current ? 'current' : 'locked' };
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
    ...data.finales.filter(finale => finaleServed(state, finale, data)).map(finale => finale.id),
    ...data.quests.flatMap(quest => quest.followUp && deliveriesSince(state, quest.id) >= quest.followUp.afterDeliveries ? [quest.followUp.id] : []),
    ...data.characters.flatMap(person => person.arrival && hasArrived(state, person) ? [arrivalScene(person)] : [])];
}
export function currentTask(state: GameState, data: GameData): Task | null {
  return data.tasks[state.taskIndex] ?? null;
}
/** The interface and completion use the same coin, quest, and placement checks. */
export function taskEligibility(state: GameState, data: GameData): TaskEligibility {
  const task = currentTask(state, data);
  if (!task) return { task: null, ready: false, requirements: [], blockers: ['Every preparation is paid.'] };
  const quests = requiredQuests(state.taskIndex, data), delivered = quests.filter(quest => questDone(state, quest.id)).length;
  const requirements: TaskRequirement[] = [
    { kind: 'coins', current: state.coins, required: task.cost, met: state.coins >= task.cost },
    { kind: 'quests', current: delivered, required: quests.length, met: delivered === quests.length },
  ];
  const blockers: string[] = [];
  // The first preparation of a chapter waits for the opening date of its chapter, and a purchase for its own date.
  const opens = task.opens ?? (data.tasks.find(value => value.chapter === task.chapter) === task ? data.chapters[task.chapter - 1].opens : undefined);
  if (opens !== undefined) {
    const met = state.clock.day >= opens;
    requirements.push({ kind: 'date', day: opens, met });
    if (!met) blockers.push(`This ${task.purchase ? 'purchase' : 'preparation'} opens on ${dateText(opens, data)}.`);
  }
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
export function generatorOutputs(state: Pick<GameState, 'taskIndex' | 'clock'>, generatorCode: string, data: GameData): string[] {
  const item = getItem(generatorCode, data);
  if (!item?.generator || !availableChains(state, data).includes(item.chain)) return [];
  return item.generator.outputs;
}
/** The place of a state's preparation in its act: 0 for the start of the act, then the number of the preparation in the act. */
export const stateNumber = (state: RoomState, data: GameData) => {
  const task = data.tasks.find(value => value.id === state.after);
  return task ? actTasks(taskAct(task, data), data).indexOf(task) + 1 : state.after === null ? 0 : -1;
};
/**
 * The bistro of an act as the completed preparations leave it: every area of the act, whether it is open, and the state it shows.
 * Completed preparations are the only input, so reading the rooms never changes the game.
 */
export function resolveRooms(completed: readonly string[], data: GameData, painted: readonly string[] = roomPaintings, act = 1): RoomView[] {
  const done = new Set(completed);
  return data.areas.filter(area => area.act === act).map(area => {
    const open = area.unlock === null || done.has(area.unlock);
    const states = open ? data.rooms.filter(state => state.area === area.id && (state.after === null || done.has(state.after)))
      .sort((a, b) => stateNumber(a, data) - stateNumber(b, data)) : [];
    return { ...area, open, states, current: states.at(-1) ?? null, painting: states.findLast(state => painted.includes(state.id)) ?? null };
  });
}
/** The area of the latest change in an act, which the room shows unless the player chooses another open area. */
export function latestArea(completed: readonly string[], data: GameData, act = 1): string {
  const done = new Set(completed), areas = new Set(data.areas.filter(area => area.act === act).map(area => area.id));
  const earned = data.rooms.filter(state => areas.has(state.area) && (state.after === null || done.has(state.after)));
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
