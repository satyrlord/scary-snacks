// The checks of the authored game data. The content generator refuses to write data with a problem, and the game refuses to start on it.
import { availableChains, dishChains, dishTags, dishWork, foodAtlases, getItem, integer, isRegular, menuPrice, mergePartners, MIXED, own, portraitAtlases, present, questOpening, questPredecessors, roomPaintings, scene, spoken, stable, stateNumber, storyScenes } from './model.ts';
import type { BoardObstacle, Character, GameData, Item, Quest } from './model.ts';
import { createGame, validateGame } from './engine.ts';

/** A known dish that is not a source. */
const isDish = (code: unknown, data: GameData): code is string => typeof code === 'string' && own(data.items, code) && !data.items[code].generator;
/** The problems of one diet: known forbidden tags, a known required dish and tag, and two known tags kept apart. */
function dietProblems(person: Character, data: GameData): string[] {
  const diet = person.diet;
  if (diet === undefined) return [];
  const tag = (value: unknown) => (dishTags as readonly unknown[]).includes(value);
  if (!diet || typeof diet.name !== 'string' || !diet.name.trim() || !Array.isArray(diet.forbid) || !diet.forbid.every(tag)
    || (diet.require !== undefined && (!isDish(diet.require.item, data) || !tag(diet.require.tag)))
    || (diet.apart !== undefined && (!Array.isArray(diet.apart) || diet.apart.length !== 2 || !diet.apart.every(tag) || diet.apart[0] === diet.apart[1]))) return [`${person.id}: invalid diet.`];
  return [];
}
/** The dishes that one person cannot eat in one quest: a forbidden tag, a missing required dish or tag, or two tags kept apart. */
export function dietBreaks(person: Character, dishes: readonly string[], data: GameData, wholeQuest = true): boolean {
  const diet = person.diet;
  if (!diet) return false;
  const tags = dishes.flatMap(code => data.items[code].tags);
  if (diet.forbid.some(tag => tags.includes(tag))) return true;
  if (diet.apart && diet.apart.every(tag => tags.includes(tag))) return true;
  return wholeQuest && !!diet.require && (!dishes.includes(diet.require.item) || !tags.includes(diet.require.tag));
}
/** Check the cast: unique people and portrait cells, and for each regular, two or three favourite dishes, a known arrival, and an arrival scene. */
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
      if (person.favourites !== undefined && (!person.regular || !Array.isArray(person.favourites) || person.favourites.length < 2 || person.favourites.length > 3
        || new Set(person.favourites).size !== person.favourites.length || !person.favourites.every(code => isDish(code, data)))) problems.push(`${person.id}: a regular likes two or three different known dishes.`);
      if (person.regular && !person.favourites) problems.push(`${person.id}: a regular needs favourite dishes.`);
      problems.push(...dietProblems(person, data));
      if ((person.arrival !== undefined) !== (person.arrivesAfter !== undefined) || (person.arrival && (!Array.isArray(person.arrival) || !person.arrival.length
        || !person.arrival.every(line => spoken(line, data)) || !person.arrival.some(line => line.speaker === person.id)))) problems.push(`${person.id}: a regular who arrives later needs an arrival scene in which they speak.`);
    }
  } catch { problems.push('The character records are malformed.'); }
  return problems;
}
/** The returning cathedral visitors. Their supply quests come in two sizes: provisions and meals. */
const cathedral = (person: Character | undefined) => !!person?.visitor && !person.singleVisit;
/** The work value of a quest: the merges that its dishes need, at the work rate. A delivery pays this over the cost of its staples. */
const workValue = (quest: Quest, data: GameData) => quest.requirements.reduce((sum, { item, quantity }) => sum + dishWork(item, data).merges * data.economy.workRate * quantity, 0);
/**
 * Check the combined preparation and quest graph, the required items, chain availability, the decoration finishes, the authored
 * order, the diets, the favourites, the supper, the recovery quest, and the campaign funds: the work value of the quests that
 * open before each preparation pays for it, so a player who buys only the staples of the quests is never short.
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
      if (quest.finale !== undefined && quest.finale !== true) problems.push(`${quest.id}: invalid supper flag.`);
      if (quest.recovery !== undefined && (quest.recovery !== true || quest.finale || quest.followUp || quest.unlocks || quest.afterTask !== null || quest.afterQuest !== undefined)) problems.push(`${quest.id}: invalid recovery quest.`);
      if (!Array.isArray(quest.requirements) || !quest.requirements.length || quest.requirements.reduce((count, requirement) => count + requirement.quantity, 0) > data.board.initial.length) problems.push(`${quest.id}: invalid delivery size.`);
      for (const requirement of quest.requirements) {
        if (!isDish(requirement.item, data) || !integer(requirement.quantity, 1, data.board.initial.length)) problems.push(`${quest.id}: invalid requirement.`);
      }
      // Every quest pays its menu value, except the supper, which pays nothing.
      const value = quest.requirements.reduce((sum, { item, quantity }) => sum + (isDish(item, data) ? data.items[item].price * quantity : 0), 0);
      if (quest.finale ? quest.reward !== 0 : !integer(quest.reward, 1) || quest.reward !== value) problems.push(`${quest.id}: invalid coin reward.`);
      // The supper earns the finale, and the recovery quest has no reply, so neither has a completion scene.
      if (!scene(quest.opening, data) || (quest.finale || quest.recovery ? !Array.isArray(quest.completion) || quest.completion.length !== 0 : !scene(quest.completion, data))) problems.push(`${quest.id}: invalid scene.`);
      if (quest.followUp && (!stable(quest.followUp.id) || !quest.followUp.title
        || !integer(quest.followUp.afterDeliveries, 1) || !scene(quest.followUp.dialogue, data))) problems.push(`${quest.id}: invalid follow-up scene.`);
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
    const known = new Map<Quest, number>(), openings = data.quests.map(quest => questOpening(quest, data, known));
    if (openings.some((opening, at) => at && opening < openings[at - 1])) problems.push('Quests must be in the order in which they open.');
    // Every campaign quest opens before the last preparation, so the campaign needs it. Only the supper opens after the last preparation.
    if (openings.some((opening, at) => opening >= data.tasks.length - 1 && !data.quests[at].finale)) problems.push('Every quest must open before the last preparation.');
    const supper = data.quests.filter(quest => quest.finale), recovery = data.quests.filter(quest => quest.recovery);
    if (supper.length !== 1) problems.push('The finale needs exactly one supper quest.');
    else if (openings[data.quests.indexOf(supper[0])] !== data.tasks.length - 1) problems.push('The supper quest opens after the last preparation.');
    // The recovery quest asks only for dishes of free sources, so a player with an empty purse can always cook it.
    if (recovery.length !== 1) problems.push('The game needs exactly one recovery quest.');
    else if (!recovery[0].requirements.every(({ item }) => dishChains(item, data).every(chain => data.items[`generator_${chain}`]?.generator?.free) && availableChains({ taskIndex: 0 }, data).includes(data.items[item].chain))) {
      problems.push(`${recovery[0].id}: the recovery quest asks only for open dishes of free sources.`);
    }
    let earned = 0, spent = 0;
    for (const [index, task] of data.tasks.entries()) {
      earned += data.quests.filter((quest, at) => openings[at] === index - 1 && !quest.recovery).reduce((sum, quest) => sum + workValue(quest, data), 0);
      spent += task.cost;
      if (earned < spent) problems.push(`${task.id}: the quests before it earn ${earned} coins of work, less than the ${spent} that the preparations cost.`);
    }
    // The coins left after the last preparation buy the staples of the supper.
    if (supper.length === 1) {
      const staples = supper[0].requirements.reduce((sum, { item, quantity }) => sum + dishWork(item, data).staples * data.economy.takeCost * quantity, 0);
      if (earned - spent < staples) problems.push(`${supper[0].id}: the quests leave ${earned - spent} coins, less than the ${staples} that its staples cost.`);
      problems.push(...supperProblems(supper[0], data));
    }
    const ancestors = (id: string, found = new Set<string>()): Set<string> => {
      for (const dependency of graph.get(id) ?? []) if (!found.has(dependency)) { found.add(dependency); ancestors(dependency, found); }
      return found;
    };
    const starting = availableChains({ taskIndex: 0 }, data);
    for (const quest of data.quests) {
      const before = ancestors(`quest:${quest.id}`);
      const person = data.characters.find(person => person.id === quest.character)!;
      if (person.arrivesAfter && !quest.recovery && !before.has(`task:${person.arrivesAfter}`)) problems.push(`${quest.id}: the character must arrive before the quest opens.`);
      const dishes = quest.requirements.map(requirement => requirement.item);
      if (person.regular && !quest.finale && !dishes.some(code => person.favourites?.includes(code))) problems.push(`${quest.id}: a regular needs a favourite dish.`);
      if (!quest.finale && [person, ...(quest.companions ?? []).map(id => data.characters.find(value => value.id === id)!)].some(eater => dietBreaks(eater, dishes, data))) problems.push(`${quest.id}: breaks a diet.`);
      if (cathedral(person)) {
        const portions = quest.requirements.reduce((sum, requirement) => sum + requirement.quantity, 0);
        const provisions = portions >= 12 && portions <= 16 && dishes.every(code => !data.items[code].recipe && data.items[code].stage >= 3);
        const meals = portions >= 4 && portions <= 6 && dishes.every(code => !!data.items[code].recipe);
        if (!provisions && !meals) problems.push(`${quest.id}: a cathedral supply quest has 12 to 16 portions of chain dishes from stage 3, or 4 to 6 mixed dishes.`);
      }
      for (const code of dishes) {
        const open = (chain: string) => starting.includes(chain) || data.tasks.some(task => task.unlock === chain && before.has(`task:${task.id}`));
        if (!dishChains(code, data).every(open)) problems.push(`${quest.id}: required chain is not available before activation.`);
      }
    }
  } catch { problems.push('The quest records are malformed.'); }
  return problems;
}
/** The supper: one plate for each guest, in the order of guests. Each plate suits its guest, each regular gets a favourite, and the plates use every chain. */
function supperProblems(quest: Quest, data: GameData): string[] {
  const problems: string[] = [];
  const guests = quest.guests;
  if (!Array.isArray(guests) || guests.length !== quest.requirements.length || new Set(guests).size !== guests.length
    || !guests.every(id => data.characters.some(person => person.id === id && !person.visitor))) return [`${quest.id}: needs one plate for each known neighbour.`];
  for (const [at, id] of guests.entries()) {
    const person = data.characters.find(value => value.id === id)!, { item, quantity } = quest.requirements[at];
    if (quantity !== 1) problems.push(`${quest.id}: one plate for ${person.name}.`);
    if (dietBreaks(person, [item], data, false)) problems.push(`${quest.id}: the plate of ${person.name} breaks a diet.`);
    if (person.regular && !person.favourites?.includes(item)) problems.push(`${quest.id}: ${person.name} gets a favourite dish.`);
  }
  const used = new Set(quest.requirements.flatMap(({ item }) => dishChains(item, data)));
  if (!data.chains.every(chain => used.has(chain.id))) problems.push(`${quest.id}: the plates use every chain.`);
  return problems;
}
/** Check the chapters, their scenes, their neighbour contributions, and the finale before the content can ship. */
export function storyProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    const { chapters, finale } = data;
    if (!Array.isArray(chapters) || !chapters.length || !finale || typeof finale !== 'object') return ['The story needs chapters and a finale.'];
    const ids = new Set<string>(), known = new Map<Quest, number>();
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
      const opening = questOpening(quest, data, known);
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
/** Check the levers, the formula prices, and the work of the preparations before the content can ship. */
export function economyProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    const { takeCost, blockerCoin, workRate, recoveryFloor } = data.economy;
    if (!integer(takeCost) || !integer(blockerCoin) || !integer(workRate, 1) || !integer(recoveryFloor, 1)) problems.push('The economy needs whole levers, with a work rate and a recovery floor of at least one.');
    for (const item of Object.values(data.items)) {
      if (item.generator ? item.price !== 0 : !integer(item.price) || item.price !== menuPrice(item.id, data)) problems.push(`${item.id}: the menu price must follow the formula.`);
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
    const problems = [...characterProblems(data), ...boardLayoutProblems(data), ...roomProblems(data), ...decorationProblems(data, knownImages),
      ...questProblems(data), ...storyProblems(data), ...economyProblems(data)];
    // The save validation relies on the other checks, so it judges the new game only after they pass.
    if (!problems.length && !validateGame(createGame(data), data)) problems.push('The starting board does not make a valid new game.');
    return problems;
  } catch { return ['The game data is malformed.']; }
}
/**
 * Validate the chains, the mixed dishes, and the sources before any check or action follows their references. A chain has four to six
 * dishes. A recipe has two parts from different chains, or one mixed part made from two chain dishes, so recipes nest one level deep.
 */
function itemProblems(data: GameData): string[] {
  const problems: string[] = [];
  const chains = new Set(data.chains.map(chain => chain.id));
  if (chains.size !== data.chains.length || chains.has(MIXED)) problems.push('Chain IDs must be unique, and mixed is not a chain.');
  const cells = new Set<string>(), pairs = new Set<string>();
  const tagged = (item: Item) => Array.isArray(item.tags) && new Set(item.tags).size === item.tags.length && item.tags.every(tag => (dishTags as readonly string[]).includes(tag));
  for (const [code, item] of Object.entries(data.items)) {
    if (item.id !== code || (!chains.has(item.chain) && item.chain !== MIXED)) { problems.push(`${code}: invalid item ID or chain.`); continue; }
    const cell = `${item.art?.atlas}:${item.art?.cell}`;
    if (!item.art || !foodAtlases.includes(item.art.atlas) || !integer(item.art.cell, 0, 7) || cells.has(cell)) problems.push(`${code}: needs its own atlas cell.`);
    cells.add(cell);
    if (!tagged(item) || (item.generator && item.tags.length)) problems.push(`${code}: invalid content tags.`);
    if (item.generator) {
      if (code !== `generator_${item.chain}` || item.chain === MIXED || item.stage !== 0 || item.next !== null || item.recipe !== undefined
        || !Array.isArray(item.generator.outputs) || item.generator.outputs.length !== 1 || item.generator.outputs[0] !== `${item.chain}_1`
        || (item.generator.free !== undefined && item.generator.free !== true)) problems.push(`${code}: invalid ingredient source.`);
    } else if (item.chain !== MIXED) {
      const next = `${item.chain}_${item.stage + 1}`;
      if (!integer(item.stage, 1, 6) || code !== `${item.chain}_${item.stage}` || item.recipe !== undefined
        || item.next !== (own(data.items, next) ? next : null)) problems.push(`${code}: invalid merge path.`);
    } else {
      const parts = item.recipe;
      if (!/^mixed_[a-z]+(-[a-z]+)*$/.test(code) || item.next !== null || !Array.isArray(parts) || parts.length !== 2 || parts[0] === parts[1]
        || !parts.every(part => own(data.items, part) && !data.items[part].generator)) { problems.push(`${code}: a mixed dish needs two known parts.`); continue; }
      const [first, second] = parts.map(part => data.items[part]);
      const mixed = [first, second].filter(part => part.recipe);
      const nested = mixed.some(part => part.recipe!.some(inner => data.items[inner]?.recipe));
      if (mixed.length > 1 || nested || (!mixed.length && first.chain === second.chain) || item.stage !== mixed.length + 1) problems.push(`${code}: invalid recipe parts or depth.`);
      const pair = [...parts].sort().join('+');
      if (pairs.has(pair)) problems.push(`${code}: each pair of parts makes at most one dish.`);
      pairs.add(pair);
      if (!tagged(item) || ![first, second].every(part => part.tags.every(tag => item.tags.includes(tag)))) problems.push(`${code}: a mixed dish has every tag of its parts.`);
    }
  }
  for (const item of Object.values(data.items)) if (item.recipe && dishChains(item.id, data).length > 3) problems.push(`${item.id}: a mixed dish uses at most three chains.`);
  for (const chain of chains) {
    const length = Object.values(data.items).filter(item => item.chain === chain && !item.generator).length;
    if (!data.items[`generator_${chain}`]?.generator || length < 4 || length > 6 || !Array.from({ length }, (_, index) => `${chain}_${index + 1}`).every(code => own(data.items, code))) {
      problems.push(`${chain}: needs a source and four to six food stages.`);
    }
    const sources = data.board.initial.filter(code => code === `generator_${chain}`).length + data.tasks.filter(task => task.unlock === chain).length;
    if (sources !== 1) problems.push(`${chain}: its source must be available exactly once.`);
  }
  for (const task of data.tasks) if (task.unlock !== undefined && !chains.has(task.unlock)) problems.push(`${task.id}: unknown source unlock.`);
  return problems;
}
/** A blocker needs a stable ID, a name, a known type, and an open dish that merges with something. A clutter blocker names its art cell. */
function validObstacle(obstacle: Omit<BoardObstacle, 'position' | 'context'>, chains: readonly string[], data: GameData): boolean {
  return !!obstacle && stable(obstacle.id) && typeof obstacle.name === 'string' && !!obstacle.name.trim() && ['clutter', 'anchored'].includes(obstacle.type)
    && isDish(obstacle.ingredient, data) && mergePartners(obstacle.ingredient, data).length > 0
    && dishChains(obstacle.ingredient, data).every(chain => chains.includes(chain))
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
