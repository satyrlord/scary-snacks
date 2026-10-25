// The checks of the authored game data. The content generator refuses to write data with a problem, and the game refuses to start on it.
import { actOf, actTasks, availableChains, calendarDate, dateText, campaignQuest, canJoinCycle, chainSeason, dayMerges, deliveriesSince, dishChains, dishTags, dishWork, eventDishes, eveningOpen, finaleQuest, fixedBooking, foodAtlases, growths, growthStages, holdOf, integer, isRegular, menuPrice, menuValue, mergePartners, MIXED, NO_STAGES, own, playable, portraitAtlases, present, prologueQuests, questFinale, questHoliday, questOpening, questPredecessors, releaseRequirements, requiredQuests, roomPaintings, scene, seasonPaid, spoken, stable, stapleCost, stateNumber, storyScenes, taskAct, terraceDay, yearDay } from './model.ts';
import type { BoardObstacle, Character, DishTag, Finale, GameData, Item, Quest } from './model.ts';
import { actOneGame, createGame, KEEP_FREE, validateGame } from './engine.ts';

/** The day of the calendar of a date of year 1. */
const actDay = (month: number, date: number, data: GameData) => yearDay(month, date) - data.calendar.start + 1;
/** The act of a quest. */
const questAct = (quest: Quest, data: GameData) => data.acts[(quest.act ?? 1) - 1];
/** The stages of the growths while a quest is open: the stages after the preparation after which it opens. */
const questStages = (quest: Quest, data: GameData) => growthStages(questOpening(quest, data) + 1, data);
/**
 * The days in which the player can deliver a quest. The range starts on the holiday of a holiday quest, or on the opening date of the
 * quest, or else on the opening date of the chapter of its preparation, and not before the start of its act. The range ends on the day
 * before the chapter that follows the chapter of the preparation that needs the quest, or on the last day of its act. A finale has its
 * day. A repeating quest has its own range of days, or the whole calendar.
 */
function questRange(quest: Quest, data: GameData): { from: number; to: number } {
  const finale = questFinale(quest, data);
  if (finale) return { from: finale.day, to: finale.day };
  if (quest.repeating || quest.recovery) return quest.during ?? { from: 1, to: data.calendar.end };
  const act = questAct(quest, data), index = data.tasks.findIndex(task => task.id === quest.afterTask), needed = data.tasks[index + 1];
  const opened = Math.max(act.from, index < 0 ? 1 : data.chapters[data.tasks[index].chapter - 1].opens);
  const from = questHoliday(quest, data)?.day ?? Math.max(quest.opens ?? 1, opened);
  return { from, to: Math.min(act.to, (needed && data.chapters[needed.chapter]?.opens || act.to + 1) - 1) };
}
/**
 * The tags that a diet that keeps the fasts forbids in a range of days: none outside the fasts, and fish only if the range does not
 * start on a fish day.
 */
function lentTags(range: { from: number; to: number }, data: GameData): DishTag[] {
  const fast = data.calendar.fasts.find(value => range.to >= value.from && range.from <= value.to);
  if (!fast) return [];
  return fast.fish.includes(range.from) ? ['meat', 'dairy', 'egg'] : ['meat', 'dairy', 'egg', 'fish'];
}

/** A known dish that is not a source. */
const isDish = (code: unknown, data: GameData): code is string => typeof code === 'string' && own(data.items, code) && !data.items[code].generator;
/** The problems of one diet: known forbidden tags, a known required dish and tag, and two known tags kept apart. */
function dietProblems(person: Character, data: GameData): string[] {
  const diet = person.diet;
  if (diet === undefined) return [];
  const tag = (value: unknown) => (dishTags as readonly unknown[]).includes(value);
  if (!diet || typeof diet.name !== 'string' || !diet.name.trim() || !Array.isArray(diet.forbid) || !diet.forbid.every(tag)
    || (diet.lent !== undefined && diet.lent !== true) || (diet.require !== undefined && (!isDish(diet.require.item, data) || !tag(diet.require.tag)))
    || (diet.apart !== undefined && (!Array.isArray(diet.apart) || diet.apart.length !== 2 || !diet.apart.every(tag) || diet.apart[0] === diet.apart[1]))) return [`${person.id}: invalid diet.`];
  return [];
}
/**
 * The dishes that one person cannot eat in one quest: a forbidden tag, a missing required dish or tag, or two tags kept apart. A diet
 * that keeps Lent also forbids the Lent tags of the days of the quest.
 */
export function dietBreaks(person: Character, dishes: readonly string[], data: GameData, wholeQuest = true, range?: { from: number; to: number }): boolean {
  const diet = person.diet;
  if (!diet) return false;
  const tags = dishes.flatMap(code => data.items[code].tags);
  if ([...diet.forbid, ...(diet.lent && range ? lentTags(range, data) : [])].some(tag => tags.includes(tag))) return true;
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
      if (person.provisions !== undefined && (person.provisions !== true || person.singleVisit)) problems.push(`${person.id}: invalid provisions flag.`);
      if (person.family !== undefined && (person.family !== true || person.visitor || person.regular || person.arrivesAfter !== undefined || person.portraitAtlas !== 'family')) problems.push(`${person.id}: invalid family flag.`);
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
/** The returning cathedral visitors who pack food for days. Their supply quests come in two sizes: provisions and meals. */
const cathedral = (person: Character | undefined) => !!person?.visitor && !person.singleVisit && !!person.provisions;
/** One meal at one sitting: the portions for each eater, and the portions of one dish. */
const MEAL = { portions: 3, same: 2 };
/** A part of the sleeper's order has at most as many portions as the supper has plates. */
const ORDER_PORTIONS = 11;
/** The merges that the dishes of a quest need from their ingredients. */
const questMerges = (quest: Quest, data: GameData) => quest.requirements.reduce((sum, { item, quantity }) => sum + dishWork(item, data).merges * quantity, 0);
/**
 * The funding of a quest: its reward minus the take costs of its ingredients, at the stages of the growths while it is open. A delivery pays this
 * over the cost of its ingredients. A quest with no reward has a negative funding.
 */
const funding = (quest: Quest, data: GameData) => quest.reward - stapleCost(quest, data, questStages(quest, data));
/** A repeating quest is a simple meal: it needs at most this many merges. */
const REPEAT_MERGES = 15;
/**
 * Check the combined preparation and quest graph, the required items, chain availability, the decoration finishes, the authored
 * order, the diets, the favourites, the finales, the recovery quest, and the funds of each act: the funding of the quests that open
 * before each preparation of the act pays for it, so a player who buys only the ingredients of the quests is never short.
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
      // Mara's parents speak in the prologue, and they come to the village once, for the festival of act 2.
      const person = data.characters.find(character => character.id === quest.character);
      if (!person || (person.family && !quest.act) || !quest.title) problems.push(`${quest.id}: unknown character or missing title.`);
      // A quest opens after a preparation. Only a quest of a later act can open after a purchase.
      if (quest.afterTask !== null && !data.tasks.some(task => task.id === quest.afterTask && (!task.purchase || (quest.act ?? 1) > taskAct(task, data)))) problems.push(`${quest.id}: unknown opening preparation.`);
      if (quest.afterQuest !== undefined) {
        // The prior quest comes earlier in authored order, so the tickets and the saved deliveries keep its order.
        const previous = data.quests.find(other => other.id === quest.afterQuest);
        if (previous && (previous.recovery || previous.repeating || (previous.act ?? 1) > (quest.act ?? 1) || (previous.march && !quest.march)
          || (!quest.repeating && data.quests.indexOf(previous) > data.quests.indexOf(quest)))) {
          problems.push(`${quest.id}: its prior quest must record a delivery in the same campaign.`);
        }
      }
      // A companion is another character who eats the meal: a neighbour shares a meal with a friend, and a visitor travels with company.
      if (quest.companions !== undefined && (!Array.isArray(quest.companions) || !quest.companions.length
        || new Set(quest.companions).size !== quest.companions.length
        || !quest.companions.every(id => id !== quest.character && data.characters.some(character => character.id === id)))) problems.push(`${quest.id}: invalid companions.`);
      if (quest.finale !== undefined && (!data.finales.some(finale => finale.id === quest.finale) || data.quests.filter(other => other.finale === quest.finale).length !== 1)) problems.push(`${quest.id}: invalid finale.`);
      if (quest.recovery !== undefined && (quest.recovery !== true || quest.finale || quest.followUp || quest.unlocks || quest.afterTask !== null || quest.afterQuest !== undefined)) problems.push(`${quest.id}: invalid recovery quest.`);
      // A repeating quest opens in no window. It can follow one campaign quest, and it can have a range of days.
      if (quest.repeating !== undefined && (quest.repeating !== true || quest.finale || quest.recovery || quest.booked || quest.followUp || quest.unlocks || quest.afterTask !== null
        || (quest.afterQuest !== undefined && !data.quests.some(other => other.id === quest.afterQuest && campaignQuest(other, data))))) problems.push(`${quest.id}: invalid repeating quest.`);
      if (quest.during !== undefined && (!quest.repeating || !integer(quest.during.from, 1, data.calendar.end) || !integer(quest.during.to, quest.during.from, data.calendar.end))) problems.push(`${quest.id}: invalid range of days.`);
      if (quest.act !== undefined && (![2, 3, 4].includes(quest.act) || quest.recovery || quest.repeating || quest.march || quest.unlocks)) problems.push(`${quest.id}: invalid later act.`);
      if (quest.stall !== undefined && (quest.stall !== true || !person?.regular || quest.holiday === undefined || !campaignQuest(quest, data))) problems.push(`${quest.id}: a stall quest is a holiday quest of a regular.`);
      if (quest.piper !== undefined && (quest.piper !== true || data.quests.filter(other => other.piper).length !== 1 || !campaignQuest(quest, data))) problems.push(`${quest.id}: invalid piper.`);
      if (quest.evening !== undefined && (!quest.booked || quest.finale || !integer(quest.evening, 1, data.calendar.end) || !eveningOpen(quest.evening, data)
        || data.quests.filter(other => other.evening === quest.evening).length !== 1)) problems.push(`${quest.id}: a fixed booking needs its own evening.`);
      if (quest.painting !== undefined && (!stable(quest.painting.image) || !quest.painting.title?.trim() || !quest.painting.text?.trim() || !campaignQuest(quest, data))) problems.push(`${quest.id}: invalid painting.`);
      // A part of the sleeper's order is a course of a feast: at most eleven portions, with a meat dish and red wine or plum brandy, the
      // chain dishes that hold alcohol. It is a campaign quest, or the finale of its act.
      if (quest.order !== undefined && (quest.order !== true || quest.booked || quest.stall || quest.holiday !== undefined || !(campaignQuest(quest, data) || quest.finale)
        || !Array.isArray(quest.requirements) || quest.requirements.reduce((sum, { quantity }) => sum + quantity, 0) > ORDER_PORTIONS
        || !quest.requirements.some(({ item }) => data.items[item]?.tags.includes('meat'))
        || !quest.requirements.some(({ item }) => data.items[item]?.tags.includes('alcohol') && !data.items[item].recipe))) problems.push(`${quest.id}: a part of the order has at most ${ORDER_PORTIONS} portions, a meat dish, and red wine or plum brandy.`);
      if (!Array.isArray(quest.requirements) || !quest.requirements.length || quest.requirements.reduce((count, requirement) => count + requirement.quantity, 0) > data.board.initial.length) problems.push(`${quest.id}: invalid delivery size.`);
      for (const requirement of quest.requirements) {
        if (!isDish(requirement.item, data) || !integer(requirement.quantity, 1, data.board.initial.length)) problems.push(`${quest.id}: invalid requirement.`);
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
    for (const quest of data.quests) {
      // Every quest pays its menu value at the stages of the growths while it is open, except a finale, the piper, and a part of the order, which pay nothing.
      if (quest.finale || quest.piper || quest.order ? quest.reward !== 0 : !integer(quest.reward, 1) || quest.reward !== menuValue(quest, data, quest.repeating || quest.recovery || !playable(quest, data) ? NO_STAGES : questStages(quest, data))) problems.push(`${quest.id}: invalid coin reward.`);
      // A finale earns its scene, and the recovery quest and the repeating quests have no reply, so none has a completion scene.
      if (!scene(quest.opening, data) || (quest.finale || quest.recovery || quest.repeating ? !Array.isArray(quest.completion) || quest.completion.length !== 0 : !scene(quest.completion, data))) problems.push(`${quest.id}: invalid scene.`);
      if (quest.followUp && (!stable(quest.followUp.id) || !quest.followUp.title
        || !integer(quest.followUp.afterDeliveries, 1) || !scene(quest.followUp.dialogue, data))) problems.push(`${quest.id}: invalid follow-up scene.`);
    }
    // The tickets show open quests in authored order, so an earlier quest never opens after a later one.
    // The repeating quests open in no window, so they come after the campaign, in their cycle order. The quests of later acts come last.
    const known = new Map<Quest, number>(), openings = data.quests.map(quest => !playable(quest, data) || quest.repeating ? Infinity : questOpening(quest, data, known));
    if (openings.some((opening, at) => at && opening < openings[at - 1]) || data.quests.some((quest, at) => at && playable(quest, data) && !playable(data.quests[at - 1], data))) problems.push('Quests must be in the order in which they open.');
    // Every campaign quest opens before the last payment of its act, so its act needs it. A quest opens in its act or in an earlier one.
    const lastTask = (act: number) => data.tasks.findLastIndex(task => taskAct(task, data) === act);
    for (const [at, quest] of data.quests.entries()) {
      if (!campaignQuest(quest, data)) continue;
      const act = quest.act ?? 1;
      if (openings[at] >= lastTask(act) || (openings[at] >= 0 && taskAct(data.tasks[openings[at]], data) > act)) problems.push(`${quest.id}: must open before the last preparation of its act.`);
    }
    // At least three simple repeating quests take turns, and one can join the cycle in a new game.
    const repeating = data.quests.filter(quest => quest.repeating);
    if (repeating.length < 3) problems.push('The game needs at least three repeating quests.');
    for (const quest of repeating) if (questMerges(quest, data) > REPEAT_MERGES) problems.push(`${quest.id}: a repeating quest needs at most ${REPEAT_MERGES} merges.`);
    if (!repeating.some(quest => canJoinCycle(actOneGame(data), quest, data))) problems.push('A repeating quest must be able to join the cycle at the start of act 1.');
    // Each act has one finale quest. It opens after the last preparation of its act. The last part of an order opens after the other
    // parts, so no preparation waits for it.
    for (const finale of data.finales) {
      const quest = finaleQuest(finale, data), act = actOf(finale.day, data);
      if (!quest || (quest.act ?? 1) !== act) { problems.push(`${finale.id}: needs one finale quest of its act.`); continue; }
      if (quest.order) {
        if (!data.quests.every(other => !other.order || other === quest || questPredecessors(quest, data).includes(other.id))) problems.push(`${quest.id}: the last part of the order opens after the other parts.`);
      } else if (openings[data.quests.indexOf(quest)] !== data.tasks.findLastIndex(task => taskAct(task, data) === act && !task.purchase)) problems.push(`${quest.id}: a finale quest opens after the last preparation of its act.`);
      problems.push(...finaleProblems(quest, finale, data));
    }
    const recovery = data.quests.filter(quest => quest.recovery);
    // The recovery quest asks only for dishes of free sources, so a player with an empty purse can always cook it.
    if (recovery.length !== 1) problems.push('The game needs exactly one recovery quest.');
    else if (!recovery[0].requirements.every(({ item }) => dishChains(item, data).every(chain => data.items[`generator_${chain}`]?.generator?.free) && availableChains({ taskIndex: 0, clock: { day: 1 } }, data).includes(data.items[item].chain))) {
      problems.push(`${recovery[0].id}: the recovery quest asks only for open dishes of free sources.`);
    }
    // The funds of each act start at zero: the purse that an earlier act carries does not count. A purchase is outside this check. The
    // last part of an order counts in the window after which it opens, as a quest with no reward.
    for (const [number] of data.acts.entries()) {
      const act = number + 1;
      let earned = 0, spent = 0;
      for (const [index, task] of data.tasks.entries()) {
        if (taskAct(task, data) !== act || task.purchase) continue;
        earned += data.quests.filter((quest, at) => openings[at] === index - 1 && (campaignQuest(quest, data) || !!quest.order)).reduce((sum, quest) => sum + funding(quest, data), 0);
        spent += task.cost;
        if (earned < spent) problems.push(`${task.id}: the quests before it fund ${earned} coins, less than the ${spent} that the preparations of its act cost.`);
      }
      // The coins left after the last preparation, with the quests of the act that open after it before the finale, buy the ingredients
      // of the finale. A quest of the next act that opens there funds the next act.
      const finale = data.finales.find(value => actOf(value.day, data) === act), quest = finale && finaleQuest(finale, data);
      if (!quest || quest.order) continue;
      const last = data.tasks.findLastIndex(task => taskAct(task, data) === act && !task.purchase);
      const before = data.quests.filter((other, at) => openings[at] === last && campaignQuest(other, data) && (other.act ?? 1) === act && (other.opens ?? 1) <= finale.day
        && !questPredecessors(other, data).includes(quest.id) && other.afterQuest !== quest.id);
      const left = earned - spent + before.reduce((sum, other) => sum + funding(other, data), 0), staples = stapleCost(quest, data, questStages(quest, data));
      if (left < staples) problems.push(`${quest.id}: the quests leave ${left} coins, less than the ${staples} that its ingredients cost.`);
    }
    const ancestors = (id: string, found = new Set<string>()): Set<string> => {
      for (const dependency of graph.get(id) ?? []) if (!found.has(dependency)) { found.add(dependency); ancestors(dependency, found); }
      return found;
    };
    const starting = availableChains({ taskIndex: 0, clock: { day: 1 } }, data);
    // A quest of a later act keeps the rules of its characters: the favourites, the size of a meal, and the diets. The calendar, the
    // arrivals, and the open chains do not apply to it.
    for (const quest of data.quests) {
      const later = !playable(quest, data), before = ancestors(`quest:${quest.id}`), range = later ? undefined : questRange(quest, data);
      const person = data.characters.find(person => person.id === quest.character)!;
      if (!later && person.arrivesAfter && !quest.recovery && !before.has(`task:${person.arrivesAfter}`)) problems.push(`${quest.id}: the character must arrive before the quest opens.`);
      const dishes = quest.requirements.map(requirement => requirement.item);
      if (person.regular && !quest.finale && !quest.stall && !dishes.some(code => person.favourites?.includes(code))) problems.push(`${quest.id}: a regular needs a favourite dish.`);
      // A repeating quest or a quest without provisions is one meal for each eater. A finale has one plate for each guest, a stall feeds a
      // crowd, and a part of the order is a course of a feast.
      if (!quest.finale && !quest.stall && !quest.order && (quest.repeating || !person.provisions)) {
        const counts = new Map<string, number>();
        for (const { item, quantity } of quest.requirements) counts.set(item, (counts.get(item) ?? 0) + quantity);
        const portions = [...counts.values()].reduce((sum, count) => sum + count, 0), eaters = 1 + (quest.companions?.length ?? 0);
        if (portions > MEAL.portions * eaters || [...counts.values()].some(count => count > MEAL.same)) problems.push(`${quest.id}: asks for more than one meal for each eater.`);
      }
      if (!quest.finale && [person, ...(quest.companions ?? []).map(id => data.characters.find(value => value.id === id)!)].some(eater => dietBreaks(eater, dishes, data, true, range))) problems.push(`${quest.id}: breaks a diet.`);
      if (cathedral(person)) {
        const portions = quest.requirements.reduce((sum, requirement) => sum + requirement.quantity, 0);
        const provisions = portions >= 12 && portions <= 16 && dishes.every(code => !data.items[code].recipe && data.items[code].stage >= 3);
        const meals = portions >= 4 && portions <= 6 && dishes.every(code => !!data.items[code].recipe);
        if (!provisions && !meals) problems.push(`${quest.id}: a cathedral supply quest has 12 to 16 portions of chain dishes from stage 3, or 4 to 6 mixed dishes.`);
      }
      // A seasonal chain is open for a quest whose days are inside its season, after the preparation that the season waits for. The
      // engine keeps a repeating quest to the days of its source.
      for (const code of later ? [] : dishes) {
        const open = (chain: string) => {
          const season = chainSeason(chain, data);
          if (season) return quest.repeating || (range!.from >= season.from && range!.to <= season.to && (season.after === undefined || before.has(`task:${season.after}`)));
          return starting.includes(chain) || data.tasks.some(task => task.unlock === chain && before.has(`task:${task.id}`));
        };
        if (!dishChains(code, data).every(open)) problems.push(`${quest.id}: required chain is not available before activation.`);
      }
    }
    problems.push(...newsProblems(data));
  } catch { problems.push('The quest records are malformed.'); }
  return problems;
}
/**
 * A finale: one plate for each guest, in the order of guests. A null guest is the empty chair of Mamaia, whose plates are those of a
 * memorial. Each plate suits its guest and the fast of the day, each regular gets a favourite, and the supper uses every chain. The
 * dinner of the sleeper is the last part of his order: it has one eater, who is not a character, so it has no guests.
 */
function finaleProblems(quest: Quest, finale: Finale, data: GameData): string[] {
  const problems: string[] = [];
  if (quest.order) return quest.guests === undefined ? [] : [`${quest.id}: the last part of the order has no guests.`];
  const guests = quest.guests, people = guests?.filter(present) ?? [];
  if (!Array.isArray(guests) || guests.length !== quest.requirements.length || new Set(people).size !== people.length
    || !people.every(id => data.characters.some(person => person.id === id && !person.family))) return [`${quest.id}: needs one plate for each known guest.`];
  for (const [at, id] of guests.entries()) {
    const person = id === null ? undefined : data.characters.find(value => value.id === id)!, { item, quantity } = quest.requirements[at];
    if (quantity !== 1) problems.push(`${quest.id}: one plate for ${person?.name ?? 'the empty chair'}.`);
    if (finale.forbid?.some(tag => data.items[item].tags.includes(tag))) problems.push(`${quest.id}: a plate breaks the fast of the feast.`);
    if (!person) continue;
    if (dietBreaks(person, [item], data, false)) problems.push(`${quest.id}: the plate of ${person.name} breaks a diet.`);
    if (person.regular && !person.favourites?.includes(item)) problems.push(`${quest.id}: ${person.name} gets a favourite dish.`);
  }
  const used = new Set(quest.requirements.flatMap(({ item }) => dishChains(item, data)));
  if (finale === data.finales[0] && !data.chains.every(chain => chain.season || used.has(chain.id))) problems.push(`${quest.id}: the plates use every chain that is open all year.`);
  return problems;
}
/**
 * Local news follows a count of later deliveries. The count must always come before the end of the act of its quest: at least that
 * many campaign quests of the act can open only after its delivery, because they open after a preparation that needs it or wait for it.
 */
function newsProblems(data: GameData): string[] {
  const problems: string[] = [], openings = new Map<Quest, number>();
  for (const quest of data.quests) {
    if (!quest.followUp || !playable(quest, data)) continue;
    const opening = questOpening(quest, data, openings), act = quest.act ?? 1;
    const after = data.quests.filter(other => campaignQuest(other, data) && (other.act ?? 1) === act && other !== quest
      && (questOpening(other, data, openings) > opening || questPredecessors(other, data).includes(quest.id)));
    if (after.length < quest.followUp.afterDeliveries) problems.push(`${quest.id}: only ${after.length} campaign quests open after its delivery, fewer than the ${quest.followUp.afterDeliveries} that its news needs.`);
  }
  return problems;
}
/** Check the chapters, their scenes, their neighbour contributions, and the finale before the content can ship. */
export function storyProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    const { chapters, finales } = data;
    if (!Array.isArray(chapters) || !chapters.length || !Array.isArray(finales) || finales.length !== data.acts.length) return ['The story needs chapters and one finale for each act.'];
    const ids = new Set<string>(), known = new Map<Quest, number>();
    for (const [index, chapter] of chapters.entries()) {
      const label = `Chapter ${index + 1}`;
      if (!chapter || typeof chapter !== 'object') { problems.push(`${label} needs a record.`); continue; }
      if (!stable(chapter.id) || ids.has(chapter.id)) problems.push('Chapter and finale IDs must be stable and unique.');
      ids.add(chapter.id);
      for (const key of ['title', 'objective', 'opening', 'payoff'] as const) if (typeof chapter[key] !== 'string' || !chapter[key].trim()) problems.push(`${label} needs its ${key}.`);
      if (!scene(chapter.closing, data)) problems.push(`${label}: invalid closing scene.`);
      if (!integer(chapter.act, 1, data.acts.length) || (index > 0 && chapter.act < chapters[index - 1].act) || actOf(chapter.opens, data) !== chapter.act) problems.push(`${label}: needs an act, in story order, that holds its opening date.`);
      const tasks = data.tasks.flatMap((task, at) => task.chapter === index + 1 && !task.purchase ? [at] : []);
      if (!tasks.length) { problems.push(`${label} has no preparation.`); continue; }
      const quest = data.quests.find(quest => quest.id === chapter.contribution && campaignQuest(quest, data));
      if (!quest) { problems.push(`${label}: unknown neighbour contribution.`); continue; }
      // The contribution opens after the previous chapter closes and before this chapter's last preparation.
      const opening = questOpening(quest, data, known);
      if (opening < tasks[0] - 1 || opening >= tasks.at(-1)!) problems.push(`${label}: its neighbour contribution must open during the chapter.`);
    }
    if (data.tasks.some((task, at) => !integer(task.chapter, 1, chapters.length) || (at > 0 && task.chapter < data.tasks[at - 1].chapter))) {
      problems.push('Every preparation needs a known chapter, in story order.');
    }
    // A purchase is the last payment of its act, with an opening date in its act and no unlock.
    for (const [at, task] of data.tasks.entries()) {
      if (task.purchase === undefined && task.opens === undefined) continue;
      const act = taskAct(task, data);
      if (task.purchase !== true || task.unlock !== undefined || !integer(task.opens, 1, data.calendar.end) || actOf(task.opens!, data) !== act
        || data.tasks.findLastIndex(other => taskAct(other, data) === act) !== at) problems.push(`${task.id}: a purchase is the last payment of its act, on a date of its act.`);
    }
    const core = data.characters.filter(character => !character.visitor && !isRegular(character) && !character.family);
    for (const [index, finale] of finales.entries()) {
      if (!finale || typeof finale !== 'object' || !stable(finale.id) || ids.has(finale.id)) { problems.push('Chapter and finale IDs must be stable and unique.'); continue; }
      ids.add(finale.id);
      if (typeof finale.title !== 'string' || !finale.title.trim() || typeof finale.ending !== 'string' || !finale.ending.trim()) problems.push(`${finale.id}: needs a title and an ending.`);
      if (!integer(finale.day, 1, data.calendar.end) || actOf(finale.day, data) !== index + 1) problems.push(`${finale.id}: needs a day of its act.`);
      if (!stable(finale.painting?.image) || !finale.painting.title?.trim() || !finale.painting.text?.trim() || !data.areas.some(area => area.id === finale.painting.area && area.act === index + 1)) problems.push(`${finale.id}: needs a painting of an area of its act.`);
      else if (![finale.painting.focus?.x, finale.painting.focus?.y].every(value => Number.isFinite(value) && value! >= 0 && value! <= 100)) problems.push(`${finale.id}: needs a focus inside its painting.`);
      if (finale.forbid !== undefined && (!Array.isArray(finale.forbid) || !finale.forbid.every(tag => (dishTags as readonly string[]).includes(tag)))) problems.push(`${finale.id}: invalid fasting tags.`);
      if (!scene(finale.dialogue, data)) { problems.push(`${finale.id}: invalid scene.`); continue; }
      // In each finale, the four core characters speak. Each core character helps in one chapter of each act.
      for (const character of core) {
        if (!finale.dialogue.some(line => line.speaker === character.id)) problems.push(`${finale.id} must include ${character.name}.`);
        if (!chapters.some(chapter => chapter?.act === index + 1 && data.quests.find(quest => quest.id === chapter?.contribution)?.character === character.id)) problems.push(`${character.name} needs a chapter contribution in act ${index + 1}.`);
      }
    }
    if (new Set(storyScenes(data)).size !== storyScenes(data).length) problems.push('Story scene IDs must be unique.');
  } catch { problems.push('The story records are malformed.'); }
  return problems;
}
/** Check the levers, the formula prices, the stages of the growths, and the work of the preparations before the content can ship. */
export function economyProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    const { takeCost, blockerCoin, workRate, recoveryFloor } = data.economy;
    if (!integer(takeCost) || !integer(blockerCoin) || !integer(workRate, 1) || !integer(recoveryFloor, 1)) problems.push('The economy needs whole levers, with a work rate and a recovery floor of at least one.');
    // Each stage of a growth follows its preparation, in story order, and raises the value of its ingredients.
    for (const growth of growths) {
      const stages = data.economy[growth];
      if (!Array.isArray(stages?.after) || !Array.isArray(stages.values) || !stages.after.length || stages.after.length !== stages.values.length
        || !stages.after.every((id, at) => { const index = data.tasks.findIndex(task => task.id === id && !task.purchase); return index >= 0 && (!at || index > data.tasks.findIndex(task => task.id === stages.after[at - 1])); })
        || !stages.values.every((value, at) => integer(value, 1) && (!at || value > stages.values[at - 1]))) problems.push(`The ${growth} stages need preparations in story order and rising whole values.`);
    }
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
/**
 * Check the levers of the day of each act and the quests that they touch. Times fall on the merge grid of the act, the booking is inside
 * the day, a gift leaves the free cells of the recovery quest, every chain has a gift dish, each meal fits in one weekday of its act, two
 * guests share the bookings, and a fixed booking owns its evening.
 */
export function dayProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    if (!Array.isArray(data.acts) || !data.acts.length || !data.acts.every((act, at) => integer(act.from, 1) && integer(act.to, act.from)
      && act.from === (at ? data.acts[at - 1].to + 1 : 1)) || data.acts.at(-1)!.to !== data.calendar.end || data.acts[0].to !== data.calendar.supper) {
      return ['The acts need consecutive ranges of days from day 1 to the last day of the calendar, and act 1 ends with the supper.'];
    }
    for (const [at, act] of data.acts.entries()) {
      const { opening, closing, booking, sunday, mergeMinutes, upkeep, ratTake, ratHoles, giftStage, giftSpace } = act.day;
      if (![opening, closing, booking, upkeep, ratHoles, sunday?.opening, sunday?.closing].every(value => integer(value)) || ![mergeMinutes, ratTake, giftStage].every(value => integer(value, 1))
        || !(opening < booking && booking < closing && closing <= 24 * 60) || (closing - opening) % mergeMinutes || (booking - opening) % mergeMinutes
        || !(sunday.opening < sunday.closing && sunday.closing <= booking) || (sunday.closing - sunday.opening) % mergeMinutes) {
        return [`Act ${at + 1}: the day needs whole levers, the booking time between opening and closing, and a shorter Sunday that closes before the booking time, on the merge grid.`];
      }
      if (!integer(giftSpace, KEEP_FREE + 1)) problems.push(`A gift needs at least ${KEEP_FREE + 1} free cells, so the recovery quest keeps its space.`);
      for (const chain of data.chains) if (!chain.season && !own(data.items, `${chain.id}_${giftStage}`)) problems.push(`${chain.id}: needs a stage-${giftStage} dish for a gift.`);
    }
    // A meal fits in one weekday of its act. Provisions, a stall, a finale, and a part of the order can take more than one day. An act that
    // the calendar does not reach has no levers yet.
    for (const quest of data.quests) {
      const work = quest.requirements.reduce((sum, { item, quantity }) => sum + dishWork(item, data).merges * quantity, 0), act = data.acts[(quest.act ?? 1) - 1];
      const provisions = quest.finale || quest.stall || quest.order || data.characters.find(person => person.id === quest.character)?.provisions;
      const merges = act && (act.day.closing - act.day.opening) / act.day.mergeMinutes;
      if (act && !provisions && work > merges) problems.push(`${quest.id}: needs ${work} merges, more than the ${merges} of one weekday of its act.`);
      if (quest.booked !== undefined && (quest.booked !== true || quest.finale || quest.recovery)) problems.push(`${quest.id}: invalid booking.`);
    }
    // Two guests take turns on the evenings, and they never share one. Every quest of a guest who takes turns is booked.
    const guests = new Set(data.quests.filter(quest => quest.booked && quest.evening === undefined).map(quest => quest.character));
    if (guests.size !== 2) problems.push('Exactly two guests book the evenings.');
    for (const quest of data.quests) if (guests.has(quest.character) && (!quest.booked || quest.evening !== undefined)) problems.push(`${quest.id}: every quest of a booked guest is booked for an evening of the turns.`);
  } catch { problems.push('The day records are malformed.'); }
  return problems;
}
/**
 * Check the calendar: the weather, the holidays, the holds, the fasts, the terrace season, and the chapter dates. Then check the dates of
 * the quests: each date is inside the act of the quest and inside the chapter of its preparation, a holiday quest opens at most three
 * days before its holiday, a March quest opens in March, and an outdoor quest opens after the courtyard. Last, the dated graph finds the
 * earliest day of each preparation and quest: each day that holds can end, and each March quest can open in March.
 */
export function calendarProblems(data: GameData): string[] {
  const problems: string[] = [];
  try {
    const calendar = data.calendar, supper = calendar.supper, end = calendar.end, day = (month: number, date: number) => actDay(month, date, data);
    if (!integer(calendar.start, 1, 365) || !integer(supper, 2, 365) || !integer(end, supper, 365) || !Array.isArray(calendar.weather) || calendar.weather.length !== end
      || !calendar.weather.every(value => ['fair', 'rain', 'snow'].includes(value))) return ['The calendar needs a start, a supper day, a last day, and the weather of each day.'];
    // Snow ends before 15 March, and from 1 April rain never lasts three days.
    if (calendar.weather.some((value, at) => value === 'snow' && at + 1 >= day(3, 15))) problems.push('Snow occurs only before 15 March.');
    if (calendar.weather.some((value, at) => at + 1 >= day(4, 1) + 2 && value === 'rain' && calendar.weather[at - 1] === 'rain' && calendar.weather[at - 2] === 'rain')) problems.push('From 1 April, rain lasts at most two days in a row.');
    const ids = new Set<string>();
    for (const holiday of calendar.holidays) {
      if (!stable(holiday.id) || ids.has(holiday.id) || typeof holiday.name !== 'string' || !holiday.name.trim() || !integer(holiday.day, 1, end)
        || (holiday.noEvening !== undefined && holiday.noEvening !== true)) problems.push(`${holiday.id}: invalid holiday.`);
      else if (calendar.weather[holiday.day - 1] !== 'fair') problems.push(`${holiday.id}: a holiday has fair weather.`);
      ids.add(holiday.id);
    }
    // Each day that holds has fair weather, a release that the data knows, and Mara's line.
    const holds = calendar.holds;
    if (!Array.isArray(holds) || !holds.every((hold, at) => integer(hold.day, 1, end) && (!at || hold.day > holds[at - 1].day) && typeof hold.line === 'string' && !!hold.line.trim()
      && (hold.task !== undefined) !== (hold.quest !== undefined) && (hold.bookings === undefined || hold.bookings === true)
      && (hold.task === undefined || data.tasks.some(task => task.id === hold.task)) && (hold.quest === undefined || data.quests.some(quest => quest.id === hold.quest && campaignQuest(quest, data) || quest.id === hold.quest && !!quest.finale))
      && calendar.weather[hold.day - 1] === 'fair')) problems.push('Each day that holds needs a later day than the hold before it, fair weather, a known release, and a line.');
    for (const finale of data.finales) if (!holds.some(hold => hold.day === finale.day && hold.quest === finaleQuest(finale, data)?.id)) problems.push(`${finale.id}: its day holds until it is served.`);
    const { fasts, terrace } = calendar;
    if (!Array.isArray(fasts) || !fasts.every(fast => integer(fast.from, 1, end) && integer(fast.to, fast.from, end) && Array.isArray(fast.fish) && fast.fish.every(value => integer(value, fast.from, fast.to)))
      || !integer(terrace.from, 1) || !integer(terrace.to, terrace.from)) problems.push('The fasts, their fish days, and the terrace season need ranges of days.');
    if (!terraceDay(supper - 1, data) || !terraceDay(supper, data)) problems.push('The day before the supper and the supper day are terrace days.');
    const { views, decorations } = calendar, inside = (crop: { x: number; y: number; width: number; height: number }) =>
      [crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) && crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0 && crop.x + crop.width <= 100 && crop.y + crop.height <= 100;
    if (!views.length || views[0].from > 1 || !views.every((view, at) => stable(view.id) && integer(view.from, -1000, end) && (!at || view.from > views[at - 1].from))) problems.push('The window views need rising dates from the start of act 1.');
    for (const decoration of decorations) if (!stable(decoration.id) || !decoration.name || !data.areas.some(area => area.id === decoration.area) || !stable(decoration.image)
      || !integer(decoration.from, 1, end) || !integer(decoration.to, decoration.from, end) || !inside(decoration.crop)) problems.push(`${decoration.id}: invalid holiday decoration.`);
    if (data.chapters[0]?.opens !== 1 || !data.chapters.every((chapter, at) => integer(chapter.opens, 1, end - 1) && (!at || chapter.opens > data.chapters[at - 1].opens))) problems.push('The chapter dates start on day 1 and rise.');
    for (const [at, act] of data.acts.entries()) if (data.chapters.find(chapter => chapter.act === at + 1)?.opens !== act.from) problems.push(`Act ${at + 1}: its first chapter opens on its first day.`);
    if (problems.length) return problems;
    const chapterOf = (quest: Quest) => quest.afterTask === null ? 1 : data.tasks.find(task => task.id === quest.afterTask)!.chapter;
    const courtyard = data.tasks.findIndex(task => task.id === data.areas.find(area => area.id === 'courtyard')?.unlock);
    for (const quest of data.quests.filter(quest => playable(quest, data))) {
      const holiday = quest.holiday === undefined ? undefined : questHoliday(quest, data), act = questAct(quest, data);
      if (quest.opens !== undefined && (!integer(quest.opens, act.from, act.to) || quest.repeating || quest.recovery || (quest.finale && !quest.order) || quest.opens < data.chapters[chapterOf(quest) - 1].opens)) problems.push(`${quest.id}: an opening date is inside the act of its quest and inside the chapter of its preparation.`);
      if (quest.holiday !== undefined && (!holiday || quest.opens === undefined || quest.opens > holiday.day || holiday.day - quest.opens > 3 || quest.booked || quest.march)) problems.push(`${quest.id}: a holiday quest opens at most three days before its holiday.`);
      if (quest.march !== undefined && (quest.march !== true || quest.opens === undefined || calendarDate(quest.opens, data).month !== 3 || !campaignQuest({ ...quest, march: undefined }, data) || quest.booked)) problems.push(`${quest.id}: a March quest opens in March.`);
      if (quest.march && data.quests.some(other => other.character === quest.character && !other.act && !other.march && !other.recovery && !other.repeating)) problems.push(`${quest.id}: every act 1 quest of a March character is a March quest.`);
      if (quest.outdoor !== undefined && (quest.outdoor !== true || quest.repeating || quest.recovery || questOpening(quest, data) < courtyard)) problems.push(`${quest.id}: an outdoor quest opens after the courtyard opens.`);
      if (quest.evening !== undefined && (quest.opens === undefined || quest.opens > quest.evening || questAct(quest, data) !== data.acts[actOf(quest.evening, data) - 1])) problems.push(`${quest.id}: a fixed booking opens before its evening, in its act.`);
    }
    if (problems.length) return problems;
    // The earliest day of each payment and each delivery. A payment follows the earlier payment, the opening of its chapter, its own
    // date, and the deliveries that it needs. A quest opens after its payment, the start of its act, its opening date, and its
    // predecessors. A delivery waits for the holiday of the quest, a fixed evening, a finale day, and an outdoor delivery for a terrace day.
    const terraceFrom = (from: number) => { for (let at = from; at <= end; at++) if (terraceDay(at, data)) return at; return Infinity; };
    const delivered = new Map<Quest, number>(), paid: number[] = [];
    const deliveredOn = (quest: Quest): number => {
      const known = delivered.get(quest);
      if (known !== undefined) return known;
      const index = data.tasks.findIndex(task => task.id === quest.afterTask);
      const open = Math.max(index < 0 ? 1 : paidOn(index), questAct(quest, data).from, quest.opens ?? 1, ...questPredecessors(quest, data).map(id => deliveredOn(data.quests.find(other => other.id === id)!)));
      if (quest.march && open > day(3, 31)) problems.push(`${quest.id}: a March quest must be able to open in March.`);
      const waits = Math.max(open, questHoliday(quest, data)?.day ?? 1, quest.evening ?? 1, questFinale(quest, data)?.day ?? 1), result = quest.outdoor ? terraceFrom(waits) : waits;
      delivered.set(quest, result);
      return result;
    };
    const paidOn = (index: number): number => paid[index] ??= Math.max(index ? paidOn(index - 1) : 1, data.chapters[data.tasks[index].chapter - 1].opens, data.tasks[index].opens ?? 1,
      ...requiredQuests(index, data).map(deliveredOn));
    // Each day that holds can end, also for a late player who reaches it with each of its release requirements open. The release of
    // an earlier hold completes its requirements before a later hold starts, so each hold checks only its new requirements. A booked
    // quest of the guests who take turns needs an evening of theirs on that day.
    const earlier = new Set<Quest>();
    for (const hold of holds) {
      const label = `The hold of ${dateText(hold.day, data, 'plain')}`, requirements = [...releaseRequirements(hold, data)].filter(quest => !earlier.has(quest));
      const release = hold.task !== undefined ? paidOn(data.tasks.findIndex(task => task.id === hold.task)) : deliveredOn(data.quests.find(quest => quest.id === hold.quest)!);
      if (release > hold.day) problems.push(`${label}: its release cannot come before its closing.`);
      const evenings = eveningOpen(hold.day, data) && !fixedBooking(hold.day, data) && !!hold.bookings;
      for (const quest of requirements) {
        if (deliveredOn(quest) > hold.day) problems.push(`${label}: ${quest.id} cannot be delivered before its closing.`);
        if (quest.booked && quest.evening === undefined && !evenings) problems.push(`${label}: ${quest.id} needs an evening of the booked guests.`);
      }
      for (const quest of releaseRequirements(hold, data)) earlier.add(quest);
    }
    for (const quest of data.quests.filter(quest => quest.march)) deliveredOn(quest);
  } catch { problems.push('The calendar records are malformed.'); }
  return problems;
}
/** Check authored choices before packaging their data and approved images. Without knownImages, the image names are not checked. */
export function decorationProblems(data: GameData, knownImages?: readonly string[]): string[] {
  const problems: string[] = [];
  const slots = data.decorationSlots;
  if (new Set(slots.map(slot => slot.id)).size !== slots.length) problems.push('Decoration slot IDs must be unique.');
  // The window views and the holiday decorations show approved images.
  for (const image of [...data.calendar.views.map(view => view.id), ...data.calendar.decorations.map(decoration => decoration.image)]) {
    if (knownImages && !knownImages.includes(image)) problems.push(`${image}: missing image.`);
  }
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
  for (const [at] of data.acts.entries()) if (data.areas.find(area => area.act === at + 1)?.unlock !== null) problems.push(`Act ${at + 1}: its first area must be open from the start of the act.`);
  for (const area of data.areas) {
    const task = data.tasks.find(value => value.id === area.unlock);
    if (!area.name || !known(area.unlock) || !integer(area.act, 1, data.acts.length) || (task && (task.purchase || taskAct(task, data) !== area.act))) problems.push(`${area.id}: needs a name, an act, and a known preparation of its act.`);
  }
  if (new Set(data.rooms.map(state => state.id)).size !== data.rooms.length) problems.push('Room state IDs must be unique.');
  for (const state of data.rooms) {
    if (!areas.has(state.area)) problems.push(`${state.id}: unknown area ${state.area}.`);
    const task = data.tasks.find(value => value.id === state.after);
    if (!known(state.after) || task?.purchase || (task && taskAct(task, data) !== data.areas.find(area => area.id === state.area)?.act)) { problems.push(`${state.id}: unknown preparation of its act.`); continue; }
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
  // Each preparation changes one room, which the player can see or read about. A purchase changes no room.
  for (const task of data.tasks) {
    const changes = data.rooms.filter(state => state.after === task.id).length;
    if (changes !== Number(!task.purchase)) problems.push(`${task.id}: ${task.purchase ? 'a purchase changes no room' : changes ? 'changes the rooms more than once' : 'changes nothing in the rooms'}.`);
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
    // Sources stand in the source tab, never on a board.
    if (!sourceList(data.board.sources, data) || !data.board.initial.every(code => code === null || isDish(code, data))) return ['The board needs known sources, each once, and only dishes in its starting spaces.'];
    const problems = [...characterProblems(data), ...calendarProblems(data), ...boardLayoutProblems(data), ...roomProblems(data), ...decorationProblems(data, knownImages),
      ...questProblems(data), ...discoveryProblems(data), ...storyProblems(data), ...economyProblems(data), ...dayProblems(data), ...prologueProblems(data, knownImages)];
    // The save validation relies on the other checks, so it judges the new game only after they pass.
    if (!problems.length && !validateGame(createGame(data), data)) problems.push('The first event does not make a valid new game.');
    if (!problems.length && !validateGame(actOneGame(data), data)) problems.push('The starting board of act 1 does not make a valid game.');
    return problems;
  } catch { return ['The game data is malformed.']; }
}
/** A list of sources: known chains, each once. */
const sourceList = (sources: unknown, data: GameData): sources is string[] => Array.isArray(sources) && new Set(sources).size === sources.length
  && sources.every(chain => typeof chain === 'string' && !!data.items[`generator_${chain}`]?.generator);
/** The prologue is short: the merges of each event from the raw staples, and of all events together. */
const EVENT_MERGES = 40, PROLOGUE_MERGES = 250;
/**
 * Check the prologue: the events and their dates, the boards and their blockers, the quests, the scenes, the family kitchen, and the
 * starting gift. Each event quest pays nothing, has no reply, and is one meal of one dish or two, a dish of its board, and inside the
 * diet of its event. The discovery rule of act 1 applies with what the player surely knows at the event: the prepared dishes of this
 * and the earlier boards, the sources of this board, and the dishes of the earlier quests. A dish that the board holds in full passes.
 * Without knownImages, the image names are not checked.
 */
export function prologueProblems(data: GameData, knownImages?: readonly string[]): string[] {
  const problems: string[] = [];
  try {
    const { events, rooms, fasting, gift, title } = data.prologue;
    if (!Array.isArray(events) || !events.length || typeof title !== 'string' || !title.trim() || !integer(gift, 10, 20)
      || !Array.isArray(fasting) || !fasting.every(tag => (dishTags as readonly string[]).includes(tag))) return ['The prologue needs a title, events, the fasting tags, and a gift of 10 to 20 coins.'];
    const roomIds = new Set(rooms.map(room => room.id));
    if (roomIds.size !== rooms.length) problems.push('Family kitchen state IDs must be unique.');
    for (const room of rooms) if (!stable(room.id) || room.area !== 'family-kitchen' || room.after !== null || !room.label || room.label.length > 28 || !room.text) problems.push(`${room.id}: invalid family kitchen state.`);
    const ids = new Set([...data.quests.map(quest => quest.id), ...data.board.layouts.map(layout => layout.id), ...data.board.layouts.flatMap(layout => layout.obstacles.map(obstacle => obstacle.id)),
      ...[...data.board.preparations, data.board.hail].flatMap(batch => batch.obstacles.map(obstacle => obstacle.id))]);
    const unique = (id: string) => { const fresh = stable(id) && !ids.has(id); ids.add(id); return fresh; };
    const known = new Set<string>(), mara = data.characters[0]?.id;
    let total = 0;
    for (const [index, event] of events.entries()) {
      const label = `Prologue event ${index + 1}`;
      if (!stable(event.id) || typeof event.title !== 'string' || !event.title.trim() || typeof event.line !== 'string' || !event.line.trim()
        || !integer(event.day, -1000, 0) || (index && event.day <= events[index - 1].day) || (event.fasting !== undefined && event.fasting !== true)) problems.push(`${label} needs an ID, a title, a line, and a date before act 1, after the event before it.`);
      if (!roomIds.has(event.room)) problems.push(`${label}: unknown family kitchen state.`);
      for (const image of [event.scene?.image, event.opening?.page?.image, event.closing?.page?.image].filter(present)) if (!stable(image) || (knownImages && !knownImages.includes(image))) problems.push(`${label}: missing image ${image}.`);
      if (typeof event.scene?.text !== 'string' || !event.scene.text.trim()) problems.push(`${label} needs a description of its illustration.`);
      // The sources once each, a board of known dishes, and blockers on empty cells.
      if (!Array.isArray(event.board) || event.board.length !== data.board.initial.length || !event.board.every(code => code === null || isDish(code, data))) { problems.push(`${label} needs a board of known dishes.`); continue; }
      if (!sourceList(event.sources, data) || !event.sources.length) { problems.push(`${label} needs its own sources, each once.`); continue; }
      const sources = event.sources.map(chain => `generator_${chain}`);
      if (!unique(event.layout?.id) || !Array.isArray(event.layout.obstacles)) { problems.push(`${label} needs its own layout.`); continue; }
      const positions = new Set<number>();
      for (const obstacle of event.layout.obstacles) {
        if (!unique(obstacle.id) || typeof obstacle.name !== 'string' || !obstacle.name.trim() || obstacle.type !== 'clutter' || !integer(obstacle.sprite, 0, 3) || obstacle.atlas !== undefined
          || !isDish(obstacle.ingredient, data) || !mergePartners(obstacle.ingredient, data).length || !integer(obstacle.position, 0, event.board.length - 1)
          || event.board[obstacle.position] !== null || positions.has(obstacle.position)) problems.push(`${label} has an invalid blocker.`);
        positions.add(obstacle.position);
      }
      const dishes = eventDishes(event, data);
      for (const code of [...event.board.filter(present), ...sources]) known.add(code);
      // The quests: one for each of Mama, Tata, and Mara at most, with no reward and no reply.
      if (!Array.isArray(event.quests) || !event.quests.length || event.quests.length > 3 || new Set(event.quests.map(quest => quest.character)).size !== event.quests.length) problems.push(`${label} needs one to three quests, at most one for each character.`);
      let merges = 0;
      for (const quest of event.quests) {
        const person = data.characters.find(value => value.id === quest.character);
        if (!unique(quest.id) || !quest.id.startsWith('prologue-') || !person || !(person.family || person.id === mara) || typeof quest.title !== 'string' || !quest.title.trim()
          || quest.reward !== 0 || quest.afterTask !== null || !scene(quest.opening, data) || !Array.isArray(quest.completion) || quest.completion.length
          || Object.keys(quest).some(key => !['id', 'character', 'title', 'afterTask', 'requirements', 'reward', 'opening', 'completion'].includes(key))) problems.push(`${quest.id}: invalid prologue quest.`);
        if (!Array.isArray(quest.requirements) || !quest.requirements.length || !quest.requirements.every(({ item, quantity }) => isDish(item, data) && integer(quantity, 1, 2))
          || new Set(quest.requirements.map(({ item }) => item)).size !== quest.requirements.length || quest.requirements.reduce((sum, { quantity }) => sum + quantity, 0) > MEAL.portions) { problems.push(`${quest.id}: asks for more than one meal.`); continue; }
        for (const { item, quantity } of quest.requirements) {
          merges += dishWork(item, data).merges * quantity;
          if (!dishes.has(item)) problems.push(`${quest.id}: ${data.items[item].name} is not a dish of its board.`);
          if (event.fasting && data.items[item].tags.some(tag => fasting.includes(tag))) problems.push(`${quest.id}: breaks the fast of its day.`);
          const dish = data.items[item], parts = dish.recipe ?? [dish.stage > 1 ? `${dish.chain}_${dish.stage - 1}` : `generator_${dish.chain}`];
          const full = event.board.filter(code => code === item).length >= quantity;
          if (!full && !parts.every(part => known.has(part))) problems.push(`${quest.id}: ${dish.name} is more than one merge beyond the dishes that the player knows.`);
        }
        for (const { item } of quest.requirements) known.add(item);
      }
      // The sources of an event count as known only during it.
      for (const code of sources) known.delete(code);
      if (merges > EVENT_MERGES) problems.push(`${label} needs ${merges} merges, more than ${EVENT_MERGES}.`);
      total += merges;
      for (const part of [event.opening, event.closing]) {
        if (!part || !stable(part.id) || !part.id.startsWith('prologue-') || typeof part.title !== 'string' || !part.title.trim() || !scene(part.dialogue, data)
          || (part.page !== undefined && (typeof part.page.text !== 'string' || !part.page.text.trim()))) problems.push(`${label} has an invalid scene.`);
      }
    }
    if (total > PROLOGUE_MERGES) problems.push(`The prologue needs ${total} merges, more than ${PROLOGUE_MERGES}.`);
    if (events.at(-1)!.day >= 1) problems.push('The prologue ends before act 1.');
    for (const room of rooms) if (!events.some(event => event.room === room.id)) problems.push(`${room.id}: no event shows it.`);
  } catch { problems.push('The prologue records are malformed.'); }
  return problems;
}
/**
 * A quest asks only for dishes one merge beyond what the player surely knows when its ticket shows, so no quest asks for a dish
 * that the player cannot place. The player knows the dishes of a new game, the sources of the open chains, and the dishes of the
 * quests that surely held a ticket before: a ticket puts its dishes in the recipe book. Those quests are the ones that this quest
 * waits for, and the open quests before it in the data order, which take the tickets first. On a day that holds, the release
 * requirements take the tickets first, so a new release requirement of a hold counts only the earlier release requirements of that hold.
 */
export function discoveryProblems(data: GameData): string[] {
  const problems: string[] = [], openings = new Map<Quest, number>(), opening = (quest: Quest) => questOpening(quest, data, openings);
  const byId = new Map(data.quests.map(quest => [quest.id, quest])), predecessors = new Map(data.quests.map(quest => [quest, questPredecessors(quest, data)]));
  // The starting board, without the dishes that the first tickets put in the recipe book, and the sure discoveries of the prologue: the
  // prepared dishes of its boards and the dishes of its quests.
  const start = [...data.board.initial.filter(present), ...data.prologue.events.flatMap(event => event.board.filter(present)),
    ...prologueQuests(data).flatMap(quest => quest.requirements.map(({ item }) => item))];
  /** The quests that are delivered before this one opens: those that the preparations before it need, and its predecessors. */
  const delivered = (quest: Quest, found = new Set<Quest>()): Set<Quest> => {
    for (const other of data.quests) if (campaignQuest(other, data) && opening(other) < opening(quest)) found.add(other);
    for (const id of predecessors.get(quest)!) {
      const previous = byId.get(id);
      if (previous && !found.has(previous)) { found.add(previous); delivered(previous, found); }
    }
    return found;
  };
  // The first hold that needs each quest. Its release requirements are the quests that take the tickets before it on that day.
  const first = new Map<Quest, Set<Quest>>();
  for (const hold of data.calendar.holds) {
    const requirements = releaseRequirements(hold, data);
    for (const quest of requirements) if (!first.has(quest)) first.set(quest, requirements);
  }
  const parts = (item: Item) => item.recipe ?? [item.stage > 1 ? `${item.chain}_${item.stage - 1}` : `generator_${item.chain}`];
  for (const [at, quest] of data.quests.entries()) {
    if (!playable(quest, data)) continue;
    const done = delivered(quest), known = new Set(start), hold = first.get(quest);
    for (const chain of availableChains({ taskIndex: opening(quest) + 1, clock: { day: questRange(quest, data).from } }, data)) known.add(`generator_${chain}`);
    const shown = data.quests.slice(0, at).filter(other => campaignQuest(other, data) && opening(other) <= opening(quest)
      && predecessors.get(other)!.every(id => done.has(byId.get(id)!)) && (!hold || hold.has(other)));
    for (const other of [...done, ...shown]) for (const { item } of other.requirements) known.add(item);
    for (const { item } of quest.requirements) {
      if (!parts(data.items[item]).every(part => known.has(part))) problems.push(`${quest.id}: ${data.items[item].name} is more than one merge beyond the dishes that the player knows when the quest opens.`);
    }
  }
  return problems;
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
    // A seasonal source comes by its season, after the preparation that it waits for: no preparation opens it, and a new game holds it
    // only in its season.
    const sources = data.board.sources.filter(source => source === chain).length, unlocks = data.tasks.filter(task => task.unlock === chain).length;
    const value = data.chains.find(other => other.id === chain)!, season = value.season;
    if (season ? unlocks || sources !== Number(season.from <= 1 && season.to >= 1 && season.after === undefined)
      || !integer(season.from, -1000) || !integer(season.to, season.from) || typeof season.departure !== 'string' || !season.departure.trim()
      || (season.after !== undefined && !data.tasks.some(task => task.id === season.after && !task.purchase))
      : sources + unlocks !== 1) problems.push(`${chain}: its source must be available exactly once.`);
    if (value.grows !== undefined && !growths.includes(value.grows)) problems.push(`${chain}: unknown growth.`);
  }
  for (const task of data.tasks) if (task.unlock !== undefined && !chains.has(task.unlock)) problems.push(`${task.id}: unknown source unlock.`);
  return problems;
}
/** The art cells of each clutter atlas: the board clutter, the preparation clutter, and the hail. */
const CLUTTER_CELLS = { board: 4, preparation: 12, hail: 2 };
/** A blocker needs a stable ID, a name, a known type, and an open dish that merges with something. A clutter blocker names its art cell. */
function validObstacle(obstacle: Omit<BoardObstacle, 'position' | 'context'>, chains: readonly string[], data: GameData): boolean {
  return !!obstacle && stable(obstacle.id) && typeof obstacle.name === 'string' && !!obstacle.name.trim() && ['clutter', 'anchored'].includes(obstacle.type)
    && isDish(obstacle.ingredient, data) && mergePartners(obstacle.ingredient, data).length > 0
    && dishChains(obstacle.ingredient, data).every(chain => chains.includes(chain))
    && (obstacle.atlas === undefined || obstacle.atlas === 'preparation' || obstacle.atlas === 'hail')
    && (obstacle.type !== 'clutter' || integer(obstacle.sprite, 0, CLUTTER_CELLS[obstacle.atlas ?? 'board'] - 1));
}
export function boardLayoutProblems(data: GameData): string[] {
  const problems: string[] = [];
  const layouts = data.board.layouts;
  if (!Array.isArray(layouts) || !layouts.length || !layouts.some(layout => layout.id === data.board.defaultLayout)) return ['The board needs a default layout.'];
  const ids = new Set<string>();
  const startingChains = data.board.sources;
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
  // Each preparation earns one batch, in story order. A purchase earns none.
  const batches = data.board.preparations, tasks = data.tasks.filter(task => !task.purchase);
  if (!Array.isArray(batches) || batches.length !== tasks.length) return [...problems, 'Every preparation needs a blocker batch.'];
  const obstacleIds = new Set(layouts.flatMap(layout => layout.obstacles.map(obstacle => obstacle.id)));
  for (const [index, batch] of batches.entries()) {
    if (!batch || batch.after !== tasks[index].id || typeof batch.context !== 'string' || !batch.context.trim()
      || !Array.isArray(batch.obstacles) || batch.obstacles.length < 2 || batch.obstacles.length > 3) {
      problems.push('Each preparation needs two or three contextual blockers in story order.');
      continue;
    }
    const task = data.tasks.indexOf(tasks[index]), chains = availableChains({ taskIndex: task + 1, clock: { day: data.chapters[tasks[index].chapter - 1].opens } }, data);
    for (const obstacle of batch.obstacles) {
      if (!validObstacle(obstacle, chains, data) || obstacleIds.has(obstacle.id)) {
        problems.push(`Preparation ${batch.after} has an invalid blocker.`);
      }
      if (obstacle) obstacleIds.add(obstacle.id);
    }
  }
  // The hail is one batch of one to three blockers on a day of the calendar. Its dishes are open on that day for a player who paid
  // only the preparations that the hold before it needs.
  const hail = data.board.hail;
  if (!hail || !integer(hail.day, 1, data.calendar.end) || typeof hail.context !== 'string' || !hail.context.trim() || !Array.isArray(hail.obstacles)
    || !hail.obstacles.length || hail.obstacles.length > 3) return [...problems, 'The hail needs a day, a context, and one to three blockers.'];
  const before = data.calendar.holds.filter(hold => hold.day < hail.day && hold.task !== undefined).at(-1);
  const chains = availableChains({ taskIndex: data.tasks.findIndex(task => task.id === before?.task) + 1, clock: { day: hail.day } }, data);
  for (const obstacle of hail.obstacles) {
    if (!validObstacle(obstacle, chains, data) || obstacleIds.has(obstacle.id)) problems.push('The hail has an invalid blocker.');
    if (obstacle) obstacleIds.add(obstacle.id);
  }
  return problems;
}
