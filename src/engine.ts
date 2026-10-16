// Original deterministic merge-game rules for the bistro browser game.
export type Item = { id: string; name: string; chain: string; stage: number; next: string | null; sprite: number; price: number; generator?: { outputs: string[] } };
export type SceneLine = { speaker: string; text: string };
export type Character = { id: string; name: string; role: string; description: string; introduction: string; sprite: number; thanks: string[] };
export type Task = { id: string; chapter: number; title: string; cost: number; work: { summary: string; materials: number; labour: number; hours: number }; goals: { served: number; merges: number }; dialogue: SceneLine[]; unlock?: string; requiresQuest?: string };
export type TaskRequirement =
  | { kind: 'coins' | 'served' | 'merges'; current: number; required: number; met: boolean }
  | { kind: 'quest'; questId: string; title: string; met: boolean }
  | { kind: 'space'; source: string; met: boolean };
export type TaskEligibility = { task: Task | null; ready: boolean; requirements: TaskRequirement[]; blockers: string[] };
export type Quest = {
  id: string; character: string; title: string; afterTask: string | null; afterQuest?: string; legacyAfter: string | null;
  requirements: { item: string; quantity: number }[]; reward: number; opening: SceneLine[]; completion: SceneLine[];
  producer?: { item: string; outputs: string[]; exclusiveItems: string[] };
};
export type QuestView = { quest: Quest; status: 'active' | 'offer' | 'locked' | 'complete' | 'legacy' };
export type QuestCleanup = { questId: string; token: string; board: { index: number; item: string }[]; inventory: { index: number; item: string }[] };
/** A room of the bistro. The first area is open from the start; another opens with the preparation named by unlock. */
export type Area = { id: string; name: string; unlock: string | null };
export type DecorationVariant = { id: string; name: string; image: string };
export type DecorationSlot = {
  id: string; name: string; area: string; unlock: string; default: string; variants: DecorationVariant[];
  crop: { x: number; y: number; width: number; height: number };
};
export type DecorationView = DecorationSlot & { unlocked: boolean; selected: DecorationVariant };
export type LevelReward = { id: string; level: number; coins: number };
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
  title: string; inventoryCapacity: number; board: { columns: number; rows: number; initial: (string | null)[] };
  chains: { id: string; name: string }[]; items: Record<string, Item>; characters: Character[]; chapters: string[]; tasks: Task[];
  areas: Area[]; rooms: RoomState[]; decorationSlots: DecorationSlot[];
  generatorTiers: { chain: string; stage: number; after: string }[];
  levelRewards: LevelReward[];
  quests: Quest[]; questItems: Record<string, Item>;
};
/**
 * An area as the completed preparations leave it. States are the earned states in order; current is the latest of them.
 * Painting is the latest earned state that has a painting, so it is current unless current waits for its master.
 */
export type RoomView = Area & { open: boolean; states: RoomState[]; current: RoomState | null; painting: RoomState | null };
export type Cell = { code: string };
export type Order = { id: string; requirements: string[]; reward: number; customer: string; pricing?: 'menu-1' };
export type GameState = {
  version: 6; board: (Cell | null)[]; inventory: Cell[]; coins: number; xp: number; taskIndex: number; orders: Order[];
  discovered: string[]; seed: number; served: number; merges: number; nextOrderId: number; decorations: string[];
  decorationChoices: Record<string, string>;
  outputChoices: Record<string, string>;
  claimedLevelRewards: string[];
  completedQuests: string[]; legacySatisfiedQuests: string[]; activeQuestProducers: Record<string, number>;
};
export type LevelRewardGameState = Omit<GameState, 'version' | 'completedQuests' | 'legacySatisfiedQuests' | 'activeQuestProducers'> & { version: 5 };
export type GeneratorGameState = Omit<LevelRewardGameState, 'version' | 'claimedLevelRewards'> & { version: 4 };
export type PreviousGameState = Omit<GeneratorGameState, 'version' | 'outputChoices'> & { version: 3 };
export type LegacyGameState = Omit<PreviousGameState, 'version' | 'decorationChoices'> & { version: 2 };
export type Action =
  | { type: 'move'; from: number; to: number }
  | { type: 'spawn'; index: number; output?: string }
  | { type: 'store' | 'retrieve' | 'sell'; index: number }
  | { type: 'serve'; id: string }
  | { type: 'claimLevelReward'; id: string }
  | { type: 'acceptQuest'; id: string }
  | { type: 'deliverQuest'; id: string; cleanupToken?: string }
  | { type: 'decorate'; slot: string; variant: string }
  | { type: 'task' };
export type Result = { state: GameState; ok: boolean; message: string; event: string | null };

const own = (object: object, key: unknown): key is string => typeof key === 'string' && Object.hasOwn(object, key);
const integer = (value: unknown, min = 0, max = 1_000_000_000): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const present = <T>(value: T): value is NonNullable<T> => Boolean(value);
const copy = (state: GameState): GameState => structuredClone(state);
const itemAt = (state: GameState, index: unknown) => integer(index, 0, state.board.length - 1) ? state.board[index] : null;
/** Unmarked saved orders keep this exact quote until service. */
export const legacyOrderReward = (requirements: string[], data: GameData) => 12 + requirements.reduce((sum, code) => sum + 3 * 2 ** (data.items[code].stage - 1), 0);
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
/** Neighbours waiting at the counter at the same time are always different people, and a served neighbour makes way for someone else. */
function makeOrder(state: GameState, data: GameData, waiting: string[]): Order {
  const chains = availableChains(state, data);
  const maxStage = Math.min(6, 2 + Math.floor(state.taskIndex / 5));
  const count = state.taskIndex >= 8 ? 1 + random(state, 2) : 1;
  const requirements = Array.from({ length: count }, () => {
    const chain = chains[random(state, chains.length)];
    return `${chain}_${1 + random(state, maxStage)}`;
  });
  const free = data.characters.filter(person => !waiting.includes(person.id));
  return {
    id: `order_${state.nextOrderId++}`,
    requirements,
    reward: menuReward(requirements, data), pricing: 'menu-1',
    customer: free[random(state, free.length)].id,
  };
}

export function createGame(data: GameData, seed = 271828): GameState {
  const state: GameState = {
    version: 6,
    board: data.board.initial.map(code => code ? { code } : null),
    inventory: [], coins: 0, xp: 0, taskIndex: 0, orders: [],
    discovered: [...new Set(data.board.initial.filter(present))],
    seed: Number.isSafeInteger(seed) ? seed >>> 0 : 271828,
    served: 0, merges: 0, nextOrderId: 1, decorations: [], decorationChoices: {}, outputChoices: {}, claimedLevelRewards: [],
    completedQuests: [], legacySatisfiedQuests: [], activeQuestProducers: {},
  };
  for (let slot = 0; slot < 3; slot++) state.orders.push(makeOrder(state, data, state.orders.map(order => order.customer)));
  return state;
}

/** Replaces each duplicate waiting customer with an unused neighbour. The requirements, rewards, progress, and seed stay unchanged. */
export function normalizeOrderCustomers(state: GameState, data: GameData): GameState {
  const waiting = new Set(state.orders.map(order => order.customer));
  if (waiting.size === state.orders.length) return state;
  const free = data.characters.filter(person => !waiting.has(person.id));
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

/** Quest items have separate ownership and never enter the permanent collection or ordinary orders. */
export function getItem(code: string, data: GameData): Item | undefined {
  return own(data.items, code) ? data.items[code] : own(data.questItems, code) ? data.questItems[code] : undefined;
}

const questDone = (state: GameState, id: string) => state.completedQuests.includes(id) || state.legacySatisfiedQuests.includes(id);
function questPredecessors(quest: Quest, data: GameData): string[] {
  const earlier = data.quests.slice(0, data.quests.indexOf(quest)).filter(previous => previous.character === quest.character);
  return [...new Set([...(quest.afterQuest ? [quest.afterQuest] : []), ...earlier.map(previous => previous.id)])];
}

/** At most one unfinished request per neighbour can be active or offered. */
export function resolveQuests(state: GameState, data: GameData): QuestView[] {
  return data.quests.map(quest => ({ quest, status: state.completedQuests.includes(quest.id) ? 'complete'
    : state.legacySatisfiedQuests.includes(quest.id) ? 'legacy'
    : (quest.afterTask === null || state.decorations.includes(quest.afterTask)) && questPredecessors(quest, data).every(id => questDone(state, id))
      ? quest.producer && !own(state.activeQuestProducers, quest.id) ? 'offer' : 'active' : 'locked' }));
}

export function questDeliveryCells(state: GameState, quest: Quest): number[] {
  return servedCells(state, { requirements: quest.requirements.flatMap(requirement => Array<string>(requirement.quantity).fill(requirement.item)) });
}

export function canDeliverQuest(state: GameState, quest: Quest | string, data: GameData): boolean {
  const view = resolveQuests(state, data).find(view => view.quest.id === (typeof quest === 'string' ? quest : quest.id));
  return view?.status === 'active' && questDeliveryCells(state, view.quest).every(index => index >= 0);
}

/** The preview lists only the exclusive leftovers after delivery, including the loaned source. */
export function previewQuestCleanup(state: GameState, id: string, data: GameData): QuestCleanup | null {
  const quest = data.quests.find(quest => quest.id === id);
  if (!quest?.producer || !canDeliverQuest(state, quest, data)) return null;
  const taken = questDeliveryCells(state, quest);
  const exclusive = quest.producer.exclusiveItems;
  return { questId: id, token: JSON.stringify(state),
    board: state.board.flatMap((cell, index) => cell && exclusive.includes(cell.code) && !taken.includes(index) ? [{ index, item: cell.code }] : []),
    inventory: state.inventory.flatMap((cell, index) => exclusive.includes(cell.code) ? [{ index, item: cell.code }] : []) };
}

/** Check the combined preparation and quest graph, item ownership, and chain availability. */
export function questProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    if (!Array.isArray(data.quests) || !data.questItems || typeof data.questItems !== 'object' || Array.isArray(data.questItems)) return ['Quest records and quest items are required.'];
    const ids = new Set<string>();
    const exclusive = new Set<string>();
    const graph = new Map<string, string[]>();
    for (const [index, task] of data.tasks.entries()) graph.set(`task:${task.id}`, [
      ...(index ? [`task:${data.tasks[index - 1].id}`] : []), ...(task.requiresQuest ? [`quest:${task.requiresQuest}`] : []),
    ]);
    for (const quest of data.quests) {
      if (!quest || typeof quest !== 'object') { problems.push('Every quest needs a record.'); continue; }
      if (!/^[a-z][a-z0-9-]*$/.test(quest.id) || ids.has(quest.id)) problems.push('Quest IDs must be stable and unique.');
      ids.add(quest.id);
      if (!data.characters.some(character => character.id === quest.character) || !quest.title) problems.push(`${quest.id}: unknown character or missing title.`);
      if (quest.afterTask !== null && !data.tasks.some(task => task.id === quest.afterTask)) problems.push(`${quest.id}: unknown opening preparation.`);
      const legacy = data.tasks.findIndex(task => task.id === quest.legacyAfter);
      if (quest.producer ? quest.legacyAfter !== null : legacy < data.tasks.findIndex(task => task.id === quest.afterTask) || legacy < 0) problems.push(`${quest.id}: invalid legacy preparation.`);
      if (!integer(quest.reward, 1)) problems.push(`${quest.id}: invalid coin reward.`);
      for (const scene of [quest.opening, quest.completion]) if (!Array.isArray(scene) || !scene.length
        || !scene.every(line => data.characters.some(character => character.id === line.speaker) && typeof line.text === 'string' && line.text.trim())) problems.push(`${quest.id}: invalid scene.`);
      if (!Array.isArray(quest.requirements) || !quest.requirements.length || quest.requirements.reduce((count, requirement) => count + requirement.quantity, 0) > data.board.initial.length) problems.push(`${quest.id}: invalid delivery size.`);
      for (const requirement of quest.requirements) {
        const item = getItem(requirement.item, data);
        if (!item || item.generator || !integer(requirement.quantity, 1, data.board.initial.length)) problems.push(`${quest.id}: invalid requirement.`);
      }
      const deps = questPredecessors(quest, data);
      for (const id of deps) {
        const previous = data.quests.find(candidate => candidate.id === id);
        if (previous?.producer) problems.push(`${quest.id}: an optional producer quest cannot block another quest.`);
        if (!quest.producer && previous && data.tasks.findIndex(task => task.id === previous.legacyAfter) > legacy) problems.push(`${quest.id}: legacy prerequisites are out of order.`);
      }
      graph.set(`quest:${quest.id}`, [...(quest.afterTask ? [`task:${quest.afterTask}`] : []), ...deps.map(id => `quest:${id}`)]);
      if (quest.producer) {
        const producer = quest.producer;
        const source = data.questItems[producer.item];
        if (!source?.generator || !producer.exclusiveItems.includes(producer.item) || !producer.outputs.length
          || JSON.stringify(source.generator.outputs) !== JSON.stringify(producer.outputs)) problems.push(`${quest.id}: invalid dedicated producer.`);
        if (new Set(producer.exclusiveItems).size !== producer.exclusiveItems.length) problems.push(`${quest.id}: duplicate exclusive item.`);
        for (const code of producer.exclusiveItems) {
          const item = data.questItems[code];
          if (!item || own(data.items, code) || exclusive.has(code) || item.chain !== source?.chain) problems.push(`${quest.id}: exclusive items must have one owner and one dedicated chain.`);
          exclusive.add(code);
          if (item?.generator && code !== producer.item) problems.push(`${quest.id}: only one producer is allowed.`);
          if (item?.next && !producer.exclusiveItems.includes(item.next)) problems.push(`${quest.id}: merge leaves its exclusive chain.`);
          if (item?.next && data.questItems[item.next]?.stage !== item.stage + 1) problems.push(`${quest.id}: merge stages must increase by one.`);
        }
        for (const code of producer.outputs) if (!producer.exclusiveItems.includes(code) || data.questItems[code]?.generator) problems.push(`${quest.id}: invalid producer output.`);
        const reachable = new Set(producer.outputs);
        for (let pass = 0; pass < producer.exclusiveItems.length; pass++) for (const code of [...reachable]) {
          const next = data.questItems[code]?.next;
          if (next) reachable.add(next);
        }
        for (const code of producer.exclusiveItems) if (code !== producer.item && !reachable.has(code)) problems.push(`${quest.id}: unreachable exclusive output.`);
      }
    }
    for (const [index, task] of data.tasks.entries()) if (task.requiresQuest) {
      const required = data.quests.find(quest => quest.id === task.requiresQuest);
      if (required?.producer) problems.push(`${task.id}: an optional producer quest cannot block a preparation.`);
      if (required && data.tasks.findIndex(task => task.id === required.legacyAfter) > index) problems.push(`${task.id}: its quest must be legacy-satisfied by this preparation.`);
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
        if (!item) continue;
        if (own(data.questItems, item.id)) {
          if (!quest.producer?.exclusiveItems.includes(item.id)) problems.push(`${quest.id}: requirement belongs to another quest.`);
        } else if (!starting.includes(item.chain) && !data.tasks.some(task => task.unlock === item.chain && before.has(`task:${task.id}`))) problems.push(`${quest.id}: required chain is not available before activation.`);
      }
    }
    for (const [id, item] of Object.entries(data.questItems)) if (!exclusive.has(id) || id !== item.id || own(data.items, id)
      || data.chains.some(chain => chain.id === item.chain) || !item.name || !integer(item.sprite, 0, 35) || !integer(item.stage, 0, 6)
      || (item.generator ? item.stage !== 0 || item.next !== null : item.stage === 0)) problems.push(`${id}: invalid quest item ownership or art.`);
  } catch { problems.push('The quest records are malformed.'); }
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
    for (const item of Object.values({ ...data.items, ...data.questItems })) {
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
    const met = state.board.includes(null) || state.inventory.length < data.inventoryCapacity;
    requirements.push({ kind: 'space', source, met });
    if (!met) blockers.push(`Free a space on the board or in the pantry for the ${source}.`);
  }
  return { task, ready: blockers.length === 0, requirements, blockers };
}

/** Every output earned by this source. Completed preparations are the only tier input. */
export function generatorOutputs(state: Pick<GameState, 'taskIndex'>, generatorCode: string, data: GameData): string[] {
  const quest = data.quests.find(quest => quest.producer?.item === generatorCode);
  if (quest) return [...quest.producer!.outputs];
  const item = own(data.items, generatorCode) ? data.items[generatorCode] : null;
  if (!item?.generator || !availableChains(state, data).includes(item.chain)) return [];
  const completed = data.tasks.slice(0, state.taskIndex).map(task => task.id);
  return [...item.generator.outputs, ...data.generatorTiers.filter(tier => tier.chain === item.chain && completed.includes(tier.after))
    .sort((a, b) => a.stage - b.stage).map(tier => `${tier.chain}_${tier.stage}`)];
}

/**
 * The output that one tap on this source takes: the next in a quest source's sequence, which starts again at its first output
 * when the quest is accepted, or the output that the player last took. Null for an item that is not a source.
 */
export function nextOutput(state: Pick<GameState, 'outputChoices' | 'activeQuestProducers'>, generatorCode: string, data: GameData): string | null {
  const item = getItem(generatorCode, data);
  if (!item?.generator) return null;
  const quest = data.quests.find(quest => quest.producer?.item === item.id);
  if (!quest) return state.outputChoices[item.chain] ?? item.generator.outputs[0];
  const outputs = quest.producer!.outputs;
  return outputs[(own(state.activeQuestProducers, quest.id) ? state.activeQuestProducers[quest.id] : 0) % outputs.length];
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
    const problems = [...roomProblems(data), ...decorationProblems(data, knownImages), ...generatorTierProblems(data), ...levelRewardProblems(data),
      ...questProblems(data), ...taskGoalProblems(data), ...economyProblems(data)];
    // The save validation relies on the other checks, so it judges the new game only after they pass.
    if (!problems.length && !validateGame(createGame(data), data)) problems.push('The starting board does not make a valid new game.');
    return problems;
  } catch { return ['The game data is malformed.']; }
}

/** The board cells that a serve empties: the first free matching cell for each item, or -1 if there is none. */
export function servedCells(state: GameState, order: Pick<Order, 'requirements'>) {
  const taken: number[] = [];
  for (const code of order.requirements) taken.push(state.board.findIndex((cell, index) => cell?.code === code && !taken.includes(index)));
  return taken;
}

export function canServe(state: GameState, order: Pick<Order, 'requirements'> | null | undefined, data: GameData) {
  if (!order || !Array.isArray(order.requirements) || !order.requirements.length) return false;
  const counts = new Map<string, number>();
  for (const cell of state.board) if (cell) counts.set(cell.code, (counts.get(cell.code) ?? 0) + 1);
  for (const code of order.requirements) {
    const count = counts.get(code);
    if (!own(data.items, code) || data.items[code].generator || !count) return false;
    counts.set(code, count - 1);
  }
  return true;
}

function validateQuestProgress(state: GameState, data: GameData): boolean {
  const complete = state.completedQuests;
  const legacy = state.legacySatisfiedQuests;
  if (!Array.isArray(complete) || !Array.isArray(legacy) || complete.length + legacy.length > data.quests.length
    || new Set([...complete, ...legacy]).size !== complete.length + legacy.length) return false;
  const done = new Set<string>();
  for (const [ids, converted] of [[legacy, true], [complete, false]] as const) for (const id of ids) {
    const quest = data.quests.find(quest => quest.id === id);
    if (!quest || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask))
      || !questPredecessors(quest, data).every(previous => done.has(previous))) return false;
    if (converted && (quest.producer || quest.legacyAfter === null || !state.decorations.includes(quest.legacyAfter))) return false;
    done.add(id);
  }
  const active = state.activeQuestProducers;
  if (!active || typeof active !== 'object' || Array.isArray(active) || ![Object.prototype, null].includes(Object.getPrototypeOf(active))) return false;
  for (const [id, count] of Object.entries(active)) {
    const quest = data.quests.find(quest => quest.id === id);
    if (!quest?.producer || !integer(count, 0, quest.producer.outputs.length - 1) || done.has(id)
      || (quest.afterTask !== null && !state.decorations.includes(quest.afterTask))
      || !questPredecessors(quest, data).every(previous => done.has(previous))) return false;
  }
  for (const task of data.tasks.slice(0, state.taskIndex)) if (task.requiresQuest && !done.has(task.requiresQuest)) return false;
  return true;
}

/** Accepts an untrusted save: a parsed save is checked field by field before it is treated as a game state. The data must pass dataProblems. */
function validateState(candidate: unknown, data: GameData, version: 2 | 3 | 4 | 5 | 6): boolean {
  try {
    const state = candidate as Omit<GameState, 'version'> & { version: number };
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== version) return false;
    if (!Array.isArray(state.board) || state.board.length !== data.board.columns * data.board.rows) return false;
    if (!Array.isArray(state.inventory) || state.inventory.length > data.inventoryCapacity) return false;
    if (!([state.coins, state.xp, state.served, state.merges] as unknown[]).every(value => integer(value))) return false;
    if (!integer(state.seed, 0, 4294967295) || !integer(state.nextOrderId, 4)) return false;
    if (!integer(state.taskIndex, 0, data.tasks.length)) return false;
    const chains = availableChains(state, data);
    if (version < 6 && ['completedQuests', 'legacySatisfiedQuests', 'activeQuestProducers'].some(key => Object.hasOwn(state, key))) return false;
    if (version === 6 && !validateQuestProgress(state as GameState, data)) return false;
    const active = version === 6 ? data.quests.filter(quest => own(state.activeQuestProducers, quest.id)) : [];
    const validItem = (cell: Cell | null) => cell && typeof cell === 'object' && !Array.isArray(cell)
      && Object.keys(cell).length === 1 && (own(data.items, cell.code) && chains.includes(data.items[cell.code].chain)
        || active.some(quest => quest.producer!.exclusiveItems.includes(cell.code)));
    if (!state.board.every(cell => cell === null || validItem(cell)) || !state.inventory.every(validItem)) return false;
    const cells = [...state.board, ...state.inventory].filter(present);
    for (const chain of chains) {
      if (cells.filter(cell => getItem(cell.code, data)?.generator && getItem(cell.code, data)?.chain === chain).length !== 1) return false;
    }
    for (const quest of active) if (cells.filter(cell => cell.code === quest.producer!.item).length !== 1) return false;
    if (!Array.isArray(state.discovered) || state.discovered.length > Object.keys(data.items).length + Object.keys(data.questItems).length
      || new Set(state.discovered).size !== state.discovered.length
      || !state.discovered.every(code => own(data.items, code) && chains.includes(data.items[code].chain)
        || version === 6 && data.quests.some(quest => quest.producer?.exclusiveItems.includes(code)
          && (own(state.activeQuestProducers, quest.id) || state.completedQuests.includes(quest.id))))
      || !cells.every(cell => state.discovered.includes(cell.code))) return false;
    if (!Array.isArray(state.orders) || state.orders.length !== 3) return false;
    if (new Set(state.orders.map(order => order?.id)).size !== 3) return false;
    for (const order of state.orders) {
      if (!order || typeof order !== 'object' || typeof order.id !== 'string' || !/^order_[1-9]\d*$/.test(order.id)) return false;
      const number = Number(order.id.slice(6));
      if (!integer(number, 1, state.nextOrderId - 1)) return false;
      if (!data.characters.some(character => character.id === order.customer)) return false;
      if (!Array.isArray(order.requirements) || order.requirements.length < 1 || order.requirements.length > 2) return false;
      if (!order.requirements.every(code => own(data.items, code) && !data.items[code].generator
        && chains.includes(data.items[code].chain))) return false;
      if (Object.hasOwn(order, 'pricing')) {
        if (version < 6 || order.pricing !== 'menu-1' || order.reward !== menuReward(order.requirements, data)) return false;
      } else if (order.reward !== legacyOrderReward(order.requirements, data)) return false;
    }
    if (!Array.isArray(state.decorations) || state.decorations.length !== state.taskIndex
      || !state.decorations.every((id, index) => id === data.tasks[index].id)) return false;
    if (version < 5 && Object.hasOwn(state, 'claimedLevelRewards')) return false;
    if (version < 4 && Object.hasOwn(state, 'outputChoices')) return false;
    if (version === 2) return !Object.hasOwn(state, 'decorationChoices');
    const choices = state.decorationChoices;
    if (!choices || typeof choices !== 'object' || Array.isArray(choices)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(choices))) return false;
    for (const [id, value] of Object.entries(choices)) {
      const slot = data.decorationSlots.find(slot => slot.id === id);
      if (!slot || !state.decorations.includes(slot.unlock) || typeof value !== 'string'
        || !slot.variants.some(variant => variant.id === value)) return false;
    }
    if (version === 3) return true;
    const outputs = state.outputChoices;
    if (!outputs || typeof outputs !== 'object' || Array.isArray(outputs)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(outputs)) || Object.keys(outputs).length > chains.length) return false;
    for (const [chain, code] of Object.entries(outputs)) {
      if (!chains.includes(chain) || !own(data.items, code) || data.items[code].generator
        || data.items[code].chain !== chain || data.items[code].stage < 2
        || !generatorOutputs(state, `generator_${chain}`, data).includes(code)) return false;
    }
    if (version === 4) return true;
    if (!Array.isArray(state.claimedLevelRewards)
      || state.claimedLevelRewards.length > data.levelRewards.length
      || new Set(state.claimedLevelRewards).size !== state.claimedLevelRewards.length) return false;
    return [...state.claimedLevelRewards].every(id => typeof id === 'string'
      && data.levelRewards.some(reward => reward.id === id && reward.level <= getLevel(state)));
  } catch {
    return false;
  }
}

export function validateGame(candidate: unknown, data: GameData): candidate is GameState {
  return validateState(candidate, data, 6);
}

export function validateLevelRewardGame(candidate: unknown, data: GameData): candidate is LevelRewardGameState {
  return validateState(candidate, data, 5);
}

export function validateGeneratorGame(candidate: unknown, data: GameData): candidate is GeneratorGameState {
  return validateState(candidate, data, 4);
}

export function validatePreviousGame(candidate: unknown, data: GameData): candidate is PreviousGameState {
  return validateState(candidate, data, 3);
}

export function validateLegacyGame(candidate: unknown, data: GameData): candidate is LegacyGameState {
  return validateState(candidate, data, 2);
}

/** Keep every old progress value. Defaults require no purchases, rewards, or random draws. */
export function migrateGame(candidate: unknown, data: GameData): PreviousGameState {
  if (!validateLegacyGame(candidate, data)) throw new Error('The older saved game has damaged or unknown game data.');
  const state: PreviousGameState = { ...structuredClone(candidate), version: 3, decorationChoices: {} };
  if (!validatePreviousGame(state, data)) throw new Error('The converted saved game is not valid.');
  return state;
}

/** Converted sources start with stage one without changing progress or random draws. */
export function migratePreviousGame(candidate: unknown, data: GameData): GeneratorGameState {
  if (!validatePreviousGame(candidate, data)) throw new Error('The older saved game has damaged or unknown game data.');
  const state: GeneratorGameState = { ...structuredClone(candidate), version: 4, outputChoices: {} };
  if (!validateGeneratorGame(state, data)) throw new Error('The converted saved game is not valid.');
  return state;
}

/** Existing XP makes rewards available. Conversion itself awards no coins. */
export function migrateGeneratorGame(candidate: unknown, data: GameData): LevelRewardGameState {
  if (!validateGeneratorGame(candidate, data)) throw new Error('The older saved game has damaged or unknown game data.');
  const state: LevelRewardGameState = { ...structuredClone(candidate), version: 5, claimedLevelRewards: [] };
  if (!validateLevelRewardGame(state, data)) throw new Error('The converted saved game is not valid.');
  return state;
}

/** Completed preparations satisfy their regular requests without a reward or a loaned source. */
export function migrateLevelRewardGame(candidate: unknown, data: GameData): GameState {
  if (!validateLevelRewardGame(candidate, data)) throw new Error('The older saved game has damaged or unknown game data.');
  const state: GameState = { ...structuredClone(candidate), version: 6, completedQuests: [], activeQuestProducers: {},
    legacySatisfiedQuests: [] };
  const pending = data.quests.filter(quest => !quest.producer && quest.legacyAfter !== null && candidate.decorations.includes(quest.legacyAfter));
  // Cross-character prerequisites can point forward in the authored list. Keep that list's order among ready quests.
  while (pending.length) {
    const ready = pending.findIndex(quest => questPredecessors(quest, data).every(id => state.legacySatisfiedQuests.includes(id)));
    if (ready === -1) throw new Error('The converted saved game is not valid.');
    state.legacySatisfiedQuests.push(pending.splice(ready, 1)[0].id);
  }
  if (!validateGame(state, data)) throw new Error('The converted saved game is not valid.');
  return state;
}

/** Each save conversion, keyed by the save envelope version of its input. Envelope version n holds game state version n + 1. */
export function saveMigrations(data: GameData) {
  return {
    1: { validate: (state: unknown) => validateLegacyGame(state, data), migrate: (state: unknown) => migrateGame(state, data) },
    2: { validate: (state: unknown) => validatePreviousGame(state, data), migrate: (state: unknown) => migratePreviousGame(state, data) },
    3: { validate: (state: unknown) => validateGeneratorGame(state, data), migrate: (state: unknown) => migrateGeneratorGame(state, data) },
    4: { validate: (state: unknown) => validateLevelRewardGame(state, data), migrate: (state: unknown) => migrateLevelRewardGame(state, data) },
  };
}

export function reduceGame(state: GameState, action: Action, data: GameData): Result {
  const fail = (message: string): Result => ({ state, ok: false, message, event: null });
  if (!action || typeof action !== 'object') return fail('Choose an action.');
  const next = copy(state);
  let event: string = action.type;
  let message = '';
  switch (action.type) {
    case 'acceptQuest': {
      const view = resolveQuests(next, data).find(view => view.quest.id === action.id);
      if (view?.status !== 'offer' || !view.quest.producer) return fail('This quest offer is no longer available.');
      const code = view.quest.producer.item;
      const empty = next.board.indexOf(null);
      if (empty !== -1) next.board[empty] = { code };
      else if (next.inventory.length < data.inventoryCapacity) next.inventory.push({ code });
      else return fail('Free one space on the board or in the pantry before you accept this quest.');
      next.activeQuestProducers[view.quest.id] = 0;
      discover(next, code);
      message = `${view.quest.title}: accepted. ${getItem(code, data)!.name} is ${empty !== -1 ? 'on the board' : 'in the pantry'}.`;
      break;
    }
    case 'deliverQuest': {
      const quest = data.quests.find(quest => quest.id === action.id);
      if (!quest || !canDeliverQuest(next, quest, data)) return fail('This quest needs every required item on the board. Check that the quest is still active.');
      if (!integer(next.coins + quest.reward)) return fail('Spend some coins before you deliver this quest.');
      const cleanup = quest.producer ? previewQuestCleanup(next, quest.id, data) : null;
      if (quest.producer && (!cleanup || action.cleanupToken !== cleanup.token)) return fail('The cleanup preview changed. Review it again before you deliver.');
      for (const index of questDeliveryCells(next, quest)) next.board[index] = null;
      if (quest.producer) {
        next.board = next.board.map(cell => cell && quest.producer!.exclusiveItems.includes(cell.code) ? null : cell);
        next.inventory = next.inventory.filter(cell => !quest.producer!.exclusiveItems.includes(cell.code));
        delete next.activeQuestProducers[quest.id];
      }
      next.completedQuests.push(quest.id);
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
    case 'move': {
      const source = itemAt(next, action.from);
      if (!integer(action.from, 0, next.board.length - 1) || !integer(action.to, 0, next.board.length - 1)
        || action.from === action.to || !source) return fail('Choose an item and a different space.');
      const target = next.board[action.to];
      const item = getItem(source.code, data)!;
      if (target?.code === source.code && !item.generator) {
        if (!item.next) return fail(`${item.name} is a final dish. Serve it to a neighbour or sell it.`);
        next.board[action.to] = { code: item.next };
        next.board[action.from] = null;
        next.merges++;
        next.xp++;
        discover(next, item.next);
        event = 'merge';
        message = `Made ${getItem(item.next, data)!.name}.`;
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
      const quest = data.quests.find(quest => quest.producer?.item === item.id);
      if (quest && !own(next.activeQuestProducers, quest.id)) return fail('This quest source is not active.');
      const expected = nextOutput(next, item.id, data)!;
      const code = action.output === undefined ? expected : action.output;
      if (!generatorOutputs(next, item.id, data).includes(code)) return fail('Choose an available output from this source.');
      if (quest && code !== expected) return fail('Take the next output from this quest source.');
      const empty = next.board.indexOf(null);
      if (empty === -1) return fail('The board is full. Merge, store, serve, or sell an item.');
      next.board[empty] = { code };
      if (quest) next.activeQuestProducers[quest.id] = (next.activeQuestProducers[quest.id] + 1) % quest.producer!.outputs.length;
      else if (data.items[code].stage === 1) delete next.outputChoices[item.chain];
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
      for (const index of servedCells(next, order)) next.board[index] = null;
      next.coins += order.reward;
      next.xp += order.requirements.reduce((sum, code) => sum + data.items[code].stage * 4, 0);
      next.served++;
      next.orders[orderIndex] = makeOrder(next, data, next.orders.map(waiting => waiting.customer));
      message = `Served ${data.characters.find(person => person.id === order.customer)?.name ?? 'the order'}. Earned ${order.reward} coins.`;
      break;
    }
    case 'task': {
      const eligibility = taskEligibility(next, data);
      const task = eligibility.task;
      if (!eligibility.ready || !task) return fail(eligibility.blockers.join(' '));
      message = `${task.title}: done.`;
      if (task.unlock) {
        const code = `generator_${task.unlock}`;
        const source = data.items[code].name;
        const empty = next.board.indexOf(null);
        if (empty !== -1) { next.board[empty] = { code }; message += ` The ${source} is on the board.`; }
        else { next.inventory.push({ code }); message += ` The ${source} is in the pantry.`; }
        discover(next, code);
      }
      next.coins -= task.cost;
      next.taskIndex++;
      next.xp += 20;
      next.decorations.push(task.id);
      for (const chain of availableChains(next, data)) {
        const code = `generator_${chain}`;
        const before = generatorOutputs(state, code, data);
        for (const output of generatorOutputs(next, code, data)) {
          if (data.items[output].stage > 1 && !before.includes(output)) message += ` The ${data.items[code].name} can now make ${data.items[output].name}.`;
        }
      }
      break;
    }
    case 'store': {
      const cell = itemAt(next, action.index);
      if (!cell) return fail('Choose an item to store.');
      if (next.inventory.length >= data.inventoryCapacity) return fail('The pantry is full. Return an item to the board first.');
      next.inventory.push(cell);
      next.board[action.index] = null;
      message = `${getItem(cell.code, data)!.name} is in the pantry.`;
      break;
    }
    case 'retrieve': {
      if (!integer(action.index, 0, next.inventory.length - 1)) return fail('Choose an item in the pantry.');
      const empty = next.board.indexOf(null);
      if (empty === -1) return fail('Free a space on the board first.');
      const cell = next.inventory.splice(action.index, 1)[0];
      next.board[empty] = cell;
      message = `${getItem(cell.code, data)!.name} is back on the board.`;
      break;
    }
    case 'sell': {
      const cell = itemAt(next, action.index);
      if (!cell) return fail('Choose an item to sell.');
      const item = getItem(cell.code, data)!;
      if (item.generator) return fail(`The ${item.name} can't be sold. Move it or store it instead.`);
      const coins = saleValue(cell.code, data);
      if (!integer(next.coins + coins)) return fail('Spend some coins before you sell this item.');
      next.coins += coins;
      next.board[action.index] = null;
      message = `Sold ${item.name} for ${coins} ${coins === 1 ? 'coin' : 'coins'}.`;
      break;
    }
    default: return fail('This action is not available.');
  }
  return { state: next, ok: true, message, event };
}
