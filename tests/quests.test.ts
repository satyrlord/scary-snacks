import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignQuest, canDeliverQuest, dishChains, gardenStage, menuPrice, menuValue, playable, QUEST_TICKETS, questDeliveryCells, questOpening, questPredecessors, requiredQuests, resolveQuests, supperQuest } from '../src/model.ts';
import { reduceGame, validateGame } from '../src/engine.ts';
import { dataProblems, dietBreaks, discoveryProblems, questProblems } from '../src/content.ts';
import type { GameData, GameState, Quest } from '../src/model.ts';
import { moveTo } from '../tools/create-checkpoint-saves.ts';
import { actOne, actOneTasks, act, afterMarch, checkpoint, data, deliver, opened, player, prologueServed, rejected, status, supperEvening, supply, know, recovery } from './support.ts';

/** The campaign quests with a status. The recovery quest has its own ticket, so the tests of the tickets leave it out. */
const ids = (state: GameState, status: string) => resolveQuests(state, data).filter(view => !view.quest.recovery && view.status === status).map(view => view.quest.id);
const floor = data.economy.recoveryFloor;

test('every neighbour asks across the whole campaign, and every quest except a finale opens before the last preparation of its act', () => {
  assert.deepEqual(questProblems(data), []);
  assert.equal(data.quests.length, 209);
  assert.equal(data.quests.filter(quest => campaignQuest(quest, data) && !quest.act).length, 89);
  assert.equal(data.quests.filter(quest => campaignQuest(quest, data) && quest.act === 2).length, 101);
  assert.equal(data.quests.filter(quest => quest.march).length, 5);
  assert.equal(data.quests.filter(quest => quest.act && quest.act > 2).length, 4);
  assert.equal(data.quests.filter(quest => quest.repeating).length, 7);
  for (const character of data.characters) {
    assert.ok(character.introduction.length > 40);
    // Mara's parents ask in the prologue, and they come to the village once, for the festival of act 2.
    if (character.family) {
      assert.ok(data.prologue.events.flatMap(event => event.quests).filter(quest => quest.character === character.id).length >= 2, character.id);
      assert.deepEqual(data.quests.filter(quest => quest.character === character.id || quest.companions?.includes(character.id)).map(quest => quest.id), ['mama-festival-visit']);
      continue;
    }
    const count = data.quests.filter(quest => !quest.repeating && (quest.character === character.id || quest.companions?.includes(character.id))).length;
    if (character.singleVisit) assert.equal(count, 1, character.id);
    else assert.ok(count >= 2, character.id);
  }
  const windows = new Set(data.quests.map(quest => quest.afterTask === null ? 0 : data.tasks.findIndex(task => task.id === quest.afterTask) + 1));
  // Each window opens a quest; no quest opens after the purchase.
  assert.deepEqual([...windows].sort((a, b) => a - b), Array.from({ length: data.tasks.length }, (_, index) => index), 'Each window opens at least one quest.');
  assert.deepEqual(data.quests.filter(quest => quest.finale || quest.recovery).map(quest => [quest.id, quest.afterTask]), [['ana-night-ward-tea', null], ['mara-community-supper', 'task_24'], ['ambrozie-feast', 'act2-prep-24']]);
  assert.equal(data.quests[0], recovery, 'The recovery quest comes first.');
  // Every quest except a finale and the piper pays its menu value at the garden stage while it is open.
  const known = new Map<Quest, number>();
  for (const quest of data.quests) {
    const stage = quest.repeating || quest.recovery || !playable(quest, data) ? 0 : gardenStage(questOpening(quest, data, known) + 1, data);
    assert.equal(quest.reward, quest.finale || quest.piper ? 0 : menuValue(quest, data, stage), quest.id);
  }
});

test('tickets show at most three active quests in authored order, and a waiting quest takes a freed ticket', () => {
  assert.equal(QUEST_TICKETS, 3);
  const start = actOne();
  // A second quest of a character in the same window waits for the first, so it is locked, not waiting.
  const campaign = data.quests.filter(quest => campaignQuest(quest, data));
  const open = campaign.filter((quest, at) => quest.afterTask === null && !campaign.slice(0, at).some(earlier => earlier.character === quest.character)).map(quest => quest.id);
  assert.deepEqual(ids(start, 'active'), open.slice(0, 3));
  assert.deepEqual(ids(start, 'waiting'), open.slice(3));
  // Delivering the second ticket keeps the authored order of the others, and the first waiting quest takes the free ticket.
  const second = deliver(start, open[1]);
  assert.deepEqual(ids(second, 'active'), [open[0], open[2], open[3]]);
  assert.deepEqual(ids(second, 'waiting'), open.slice(4));
  assert.deepEqual(ids(second, 'complete'), [open[1]]);
  for (const count of [1, 4, 9, 15, 23]) {
    const state = afterMarch(opened(count));
    const active = ids(state, 'active'), waiting = ids(state, 'waiting');
    assert.ok(active.length <= QUEST_TICKETS);
    if (waiting.length) assert.equal(active.length, QUEST_TICKETS, 'A waiting quest never leaves a ticket free.');
    const order = [...active, ...waiting];
    assert.deepEqual(order, data.quests.filter(quest => order.includes(quest.id)).map(quest => quest.id));
  }
});

test('a waiting quest cannot be delivered even with every item on the board', () => {
  const start = actOne();
  const waiting = ids(start, 'waiting')[0];
  const supplied = supply(start, waiting);
  assert.ok(questDeliveryCells(supplied, data.quests.find(quest => quest.id === waiting)!).every(index => index >= 0));
  assert.equal(canDeliverQuest(supplied, waiting, data), false);
  assert.match(rejected(supplied, { type: 'deliverQuest', id: waiting }).message, /still on a ticket/);
  // A locked quest cannot be delivered either.
  const locked = ids(start, 'locked')[0];
  rejected(supply(start, locked), { type: 'deliverQuest', id: locked });
});

test('quest data rejects unknown IDs, quantities, cycles, unavailable chains, finishes, and conflicting ownership', () => {
  const welcome = (content: GameData) => content.quests.find(quest => quest.id === 'mara-welcome')!;
  const cases: [string, (content: GameData) => void][] = [
    ['duplicate quest', content => { content.quests[2].id = content.quests[1].id; }],
    ['unknown character', content => { welcome(content).character = 'absent'; }],
    ['missing scene', content => { welcome(content).completion = []; }],
    ['unknown scene speaker', content => { welcome(content).opening[0].speaker = 'absent'; }],
    ['unknown item', content => { welcome(content).requirements[0].item = 'absent'; }],
    ['generator delivery', content => { welcome(content).requirements[0].item = 'generator_herbs'; }],
    ['zero quantity', content => { welcome(content).requirements[0].quantity = 0; }],
    ['fraction quantity', content => { welcome(content).requirements[0].quantity = 1.5; }],
    ['oversized quantity', content => { welcome(content).requirements[0].quantity = 43; }],
    ['total quantity', content => { welcome(content).requirements = [{ item: 'herbs_2', quantity: 22 }, { item: 'herbs_2', quantity: 22 }]; }],
    ['negative reward', content => { welcome(content).reward = -1; }],
    ['reward above the menu value', content => { welcome(content).reward += 1; }],
    ['unavailable food', content => { welcome(content).requirements[0].item = 'dairy_2'; }],
    ['unknown preparation', content => { welcome(content).afterTask = 'absent'; }],
    ['unknown prior quest', content => { welcome(content).afterQuest = 'absent'; }],
    ['single visit without visitor role', content => { content.characters.find(person => person.id === 'ionatan')!.visitor = false; }],
    ['single visit without a quest', content => { content.quests = content.quests.filter(quest => quest.character !== 'ionatan'); }],
    ['single visit with multiple quests', content => { welcome(content).character = 'ionatan'; }],
    ['invalid single visit flag', content => { (content.characters.find(person => person.id === 'ionatan') as unknown as Record<string, unknown>).singleVisit = 'yes'; }],
    ['same character cycle', content => { welcome(content).afterQuest = 'mara-table'; }],
    ['unknown finish slot', content => { content.quests.find(quest => quest.unlocks)!.unlocks!.slot = 'absent'; }],
    ['default finish', content => { content.quests.find(quest => quest.unlocks?.slot === 'tableware')!.unlocks!.variant = 'blue'; }],
    ['finish without a quest', content => { delete content.quests.find(quest => quest.unlocks?.slot === 'tableware')!.unlocks; }],
    ['finish with two quests', content => { welcome(content).unlocks = { slot: 'tableware', variant: 'green' }; }],
    ['recovery quest after a preparation', content => { content.quests[0].afterTask = 'task_1'; }],
    ['recovery quest with a predecessor', content => { content.quests[0].afterQuest = 'mara-welcome'; }],
    ['second recovery quest', content => { welcome(content).recovery = true; welcome(content).completion = []; }],
    ['paid supper', content => { supperQuest(content)!.reward = 1; }],
  ];
  for (const [label, mutate] of cases) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(questProblems(content).length, label);
    assert.ok(dataProblems(content).length, label);
  }
});

test('the data check rejects a broken diet, a regular quest without a favourite dish, a cathedral quest of a wrong size, and a dish before its chains open', () => {
  const quest = (content: GameData, id: string) => content.quests.find(value => value.id === id)!;
  // A changed quest keeps its menu value as its reward, so the check reaches the rule under test.
  const ask = (content: GameData, id: string, requirements: Quest['requirements']) => {
    Object.assign(quest(content, id), { requirements, reward: requirements.reduce((sum, { item, quantity }) => sum + menuPrice(item, content) * quantity, 0) });
  };
  const add = (content: GameData, id: string, item: string) => ask(content, id, [...quest(content, id).requirements, { item, quantity: 1 }]);
  const person = (content: GameData, id: string) => content.characters.find(value => value.id === id)!;
  const plate = (content: GameData, guest: string, item: string) => {
    const supper = supperQuest(content)!;
    supper.requirements[supper.guests!.indexOf(guest)].item = item;
  };
  const cases: [string, (content: GameData) => void, RegExp][] = [
    ['meat for Mina', content => add(content, 'mina-avram-search', 'poultry_2'), /mina-avram-search: breaks a diet/],
    // Mina's own diet also forbids meat, so these cases remove it: only her companion Avram can refuse the dish.
    ['pork for her companion Avram', content => { delete person(content, 'mina').diet; add(content, 'mina-avram-search', 'pork_1'); }, /mina-avram-search: breaks a diet/],
    ['meat with dairy for her companion Avram', content => { delete person(content, 'mina').diet; add(content, 'mina-avram-search', 'poultry_2'); }, /mina-avram-search: breaks a diet/],
    ['Vlad without red wine', content => ask(content, 'vlad-after-dark', quest(content, 'vlad-after-dark').requirements.filter(({ item }) => item !== 'fruits_5')), /vlad-after-dark: breaks a diet/],
    ['Vlad without meat', content => ask(content, 'vlad-after-dark', [{ item: 'fruits_5', quantity: 2 }]), /vlad-after-dark: breaks a diet/],
    ['garlic for Elisabeta', content => add(content, 'elisabeta-papers', 'pork_3'), /elisabeta-papers: breaks a diet/],
    ['dairy for Cătălina', content => add(content, 'catalina-hail', 'dairy_1'), /catalina-hail: breaks a diet/],
    ['egg for Cătălina', content => add(content, 'catalina-hail', 'poultry_1'), /catalina-hail: breaks a diet/],
    ['meat for Cătălina', content => add(content, 'catalina-hail', 'pork_1'), /catalina-hail: breaks a diet/],
    ['a supper plate that breaks a diet', content => plate(content, 'catalina', 'mixed_tochitura'), /the plate of Cătălina breaks a diet/],
    ['a regular quest without a favourite dish', content => ask(content, 'victor-exam', [{ item: 'grain_3', quantity: 2 }]), /victor-exam: a regular needs a favourite dish/],
    ['a supper plate that is not a favourite', content => plate(content, 'cezar', 'mixed_cabbage-rolls'), /Cezar gets a favourite dish/],
    ['provisions too small', content => ask(content, 'adrian-first-pack', [{ item: 'grain_5', quantity: 11 }]), /adrian-first-pack: a cathedral supply quest/],
    ['provisions too large', content => ask(content, 'adrian-first-pack', [{ item: 'grain_5', quantity: 17 }]), /adrian-first-pack: a cathedral supply quest/],
    ['provisions below stage 3', content => ask(content, 'adrian-first-pack', [{ item: 'grain_2', quantity: 12 }]), /adrian-first-pack: a cathedral supply quest/],
    ['meals too small', content => ask(content, 'janos-second-pack', [{ item: 'mixed_tochitura', quantity: 3 }]), /janos-second-pack: a cathedral supply quest/],
    ['meals too large', content => ask(content, 'janos-second-pack', [{ item: 'mixed_tochitura', quantity: 7 }]), /janos-second-pack: a cathedral supply quest/],
    ['meals with a chain dish', content => add(content, 'janos-second-pack', 'grain_5'), /janos-second-pack: a cathedral supply quest/],
    ['a chain dish before its chain opens', content => add(content, 'mara-welcome', 'dairy_2'), /mara-welcome: required chain is not available/],
    ['a mixed dish before one of its chains opens', content => add(content, 'mara-lamp-supper', 'mixed_sweet-dough'), /mara-lamp-supper: required chain is not available/],
  ];
  assert.deepEqual(questProblems(data), []);
  for (const [label, mutate, problem] of cases) {
    const content = structuredClone(data);
    mutate(content);
    assert.ok(questProblems(content).some(value => problem.test(value)), `${label}: ${questProblems(content).join(' ')}`);
    assert.ok(dataProblems(content).length, label);
  }
});

test('the supper and the recovery quest require an empty array for their absent completion scenes', () => {
  for (const id of data.quests.filter(quest => quest.finale || quest.recovery).map(quest => quest.id)) {
    for (const completion of ['', { length: 0 }, null]) {
      const content = structuredClone(data);
      Object.assign(content.quests.find(quest => quest.id === id)!, { completion });
      assert.ok(questProblems(content).includes(`${id}: invalid scene.`));
      assert.ok(dataProblems(content).length);
    }
  }
});

test('traveller quests return in one shared sequence of provisions and meals that fit the board', () => {
  const visits = data.quests.filter(quest => {
    const person = data.characters.find(person => person.id === quest.character)!;
    return person.visitor && person.provisions;
  });
  assert.deepEqual(visits.map(quest => quest.character), ['adrian', 'monica', 'janos', 'adrian', 'monica', 'janos', 'adrian', 'monica', 'janos', 'adrian', 'monica', 'janos', 'janos']);
  assert.deepEqual(visits.map(quest => quest.afterTask), [...[6, 8, 9, 13, 14, 17, 19, 21, 22].map(number => `task_${number}`), ...[5, 14, 18, 24].map(number => `act2-prep-${number}`)]);
  for (const [index, quest] of visits.entries()) {
    // The proper meal of Janos follows the feast. Each other visit follows the visit before it.
    assert.equal(quest.afterQuest, quest.id === 'janos-proper-meal' ? 'ambrozie-feast' : visits[index - 1]?.id);
    const quantity = quest.requirements.reduce((sum, requirement) => sum + requirement.quantity, 0);
    const dishes = quest.requirements.map(requirement => data.items[requirement.item]);
    // Provisions: 12 to 16 portions of chain dishes from stage 3. Meals: 4 to 6 mixed dishes.
    const provisions = quantity >= 12 && quantity <= 16 && dishes.every(item => !item.recipe && item.stage >= 3);
    const meals = quantity >= 4 && quantity <= 6 && dishes.every(item => !!item.recipe);
    assert.ok(provisions || meals, `${quest.id} is provisions or a meal.`);
    assert.match(quest.opening.map(line => line.text).join(' '), /cathedral|red door|library|archbishop/);
    // Each visit tells a core character what the visitors found, and the neighbour answers.
    assert.ok(quest.opening.some(line => ['mara', 'ilie', 'eszter', 'sorin'].includes(line.speaker)), `${quest.id} needs a neighbour in its opening.`);
  }
  // A save cannot hold a pack before the pack that it follows.
  const finished = checkpoint(24);
  const [first, second] = [finished.completedQuests.indexOf(visits[0].id), finished.completedQuests.indexOf(visits[1].id)];
  const swapped = [...finished.completedQuests];
  [swapped[first], swapped[second]] = [swapped[second], swapped[first]];
  assert.equal(validateGame({ ...finished, completedQuests: swapped }, data), false);
});

test('each quest of a core character is a short exchange at its opening and at its completion, and the supper has no completion', () => {
  const core = ['mara', 'ilie', 'eszter', 'sorin'], quests = data.quests.filter(quest => core.includes(quest.character) && !quest.repeating);
  assert.equal(quests.length, 63);
  for (const quest of quests) {
    // The supper earns the finale in place of a reply.
    assert.ok(quest.opening.length >= 2 && (quest.finale ? !quest.completion.length : quest.completion.length >= 2), `${quest.id} needs at least two turns in each scene.`);
    assert.ok([...quest.opening, ...quest.completion].every(line => line.text.length <= 140), `${quest.id} has a turn that is too long for a phone.`);
  }
});

test('a delivery pays once, a missing dish keeps the quest open, and a reload refuses a second delivery', () => {
  const id = 'cezar-round', quest = data.quests.find(quest => quest.id === id)!;
  let state = afterMarch(opened(9));
  while (!ids(state, 'active').includes(id)) state = deliver(state, ids(state, 'active')[0]);
  const play = player(state);
  play.state.coins = 10_000;
  rejected(play.state, { type: 'deliverQuest', id });
  const portions = quest.requirements.flatMap(({ item, quantity }) => Array<string>(quantity).fill(item));
  for (const item of portions.slice(0, -1)) play.produce(item);
  rejected(play.state, { type: 'deliverQuest', id });
  play.produce(portions.at(-1)!);
  play.state.coins = 7;
  const before = structuredClone(play.state);
  play.act({ type: 'deliverQuest', id });
  assert.equal(play.state.coins, 7 + quest.reward);
  for (const key of ['taskIndex', 'decorations'] as const) assert.deepEqual(play.state[key], before[key]);
  // Only the dishes of a quest that takes a freed ticket enter the recipe book.
  const ticketed = resolveQuests(play.state, data).filter(view => view.status === 'active').flatMap(view => view.quest.requirements.map(({ item }) => item));
  assert.ok(play.state.discovered.every(code => before.discovered.includes(code) || ticketed.includes(code)));
  assert.deepEqual(play.state.completedQuests, [...before.completedQuests, id]);
  assert.equal(resolveQuests(play.state, data).find(view => view.quest.id === id)!.status, 'complete');
  const reloaded: GameState = JSON.parse(JSON.stringify(play.state));
  assert.equal(validateGame(reloaded, data), true);
  rejected(reloaded, { type: 'deliverQuest', id });
});

test('atomic delivery accounts for repeated quantities, then pays only once', () => {
  const content = structuredClone(data);
  const quest = content.quests.find(quest => quest.id === 'mara-welcome')!;
  // The same dishes and reward, with the Herb bunches split over two rows.
  quest.requirements = [{ item: 'herbs_2', quantity: 1 }, { item: 'herbs_4', quantity: 1 }, { item: 'herbs_2', quantity: 1 }];
  const play = player(actOne(content), content);
  play.produce('herbs_2');
  play.produce('herbs_4');
  rejected(play.state, { type: 'deliverQuest', id: quest.id }, content);
  play.produce('herbs_2');
  const before = structuredClone(play.state);
  assert.equal(canDeliverQuest(play.state, quest.id, content), true);
  play.act({ type: 'deliverQuest', id: quest.id });
  assert.equal(play.state.coins, before.coins + quest.reward);
  assert.equal(play.state.taskIndex, before.taskIndex);
  assert.deepEqual(play.state.completedQuests, [...prologueServed, quest.id]);
  assert.equal(play.state.board.filter(cell => cell?.code === 'herbs_2' || cell?.code === 'herbs_4').length, 0);
  const reloaded: GameState = JSON.parse(JSON.stringify(play.state));
  rejected(reloaded, { type: 'deliverQuest', id: quest.id }, content);
  rejected(reloaded, { type: 'deliverQuest', id: 'absent' }, content);
  rejected(reloaded, { type: 'deliverQuest', id: 'mara-table' }, content);
  const snapshot = structuredClone(reloaded);
  resolveQuests(reloaded, content);
  assert.deepEqual(reloaded, snapshot, 'Reading quest status has no effect.');
});

test('deliveries stop at the coin limit, so the game stays savable', () => {
  const limit = 1_000_000_000;
  const quest = data.quests.find(quest => quest.id === 'mara-welcome')!;
  const play = player();
  for (const { item, quantity } of quest.requirements) for (let count = 0; count < quantity; count++) play.produce(item);
  assert.match(rejected({ ...structuredClone(play.state), coins: limit }, { type: 'deliverQuest', id: quest.id }).message, /Spend some coins/);
  play.state.coins = limit - quest.reward;
  play.act({ type: 'deliverQuest', id: quest.id });
  assert.equal(play.state.coins, limit);
});

test('delivery queues the quest completion scene in the same change, and a failed delivery queues nothing', () => {
  const play = player();
  rejected(play.state, { type: 'deliverQuest', id: 'mara-welcome' });
  for (const { item, quantity } of data.quests.find(quest => quest.id === 'mara-welcome')!.requirements) for (let count = 0; count < quantity; count++) play.produce(item);
  const before = structuredClone(play.state);
  play.act({ type: 'deliverQuest', id: 'mara-welcome' });
  assert.deepEqual(play.state.pendingScenes, [...before.pendingScenes, 'mara-welcome']);
  // The scene waits at any position: a later payment queues its own scene after it.
  for (const quest of requiredQuests(0, data)) if (!play.state.completedQuests.includes(quest.id)) play.state.completedQuests.push(quest.id);
  play.state.coins += data.tasks[0].cost;
  play.act({ type: 'task' });
  assert.deepEqual(play.state.pendingScenes, ['mara-welcome', data.tasks[0].id]);
  const coins = play.state.coins;
  assert.equal(reduceGame(play.state, { type: 'readScene', id: 'mara-welcome' }, data).message, 'The scene is in the story journal.');
  // A guest who visits once has no journal replay, so reading the scene does not point to the journal.
  const single = data.quests.find(quest => data.characters.find(person => person.id === quest.character)?.singleVisit)!;
  const visited = { ...structuredClone(play.state), pendingScenes: [...play.state.pendingScenes, single.id] };
  assert.equal(reduceGame(visited, { type: 'readScene', id: single.id }, data).message, 'The scene is finished.');
  play.act({ type: 'readScene', id: 'mara-welcome' });
  assert.deepEqual(play.state.pendingScenes, [data.tasks[0].id]);
  assert.equal(play.state.coins, coins, 'Reading the scene gives no second reward.');
  rejected(play.state, { type: 'readScene', id: 'mara-welcome' });
});

test('quest saves reject unknown, duplicate, early, and out-of-order completions, the recovery quest, and missing required quests', () => {
  const good = checkpoint(18);
  const later = data.quests.find(quest => campaignQuest(quest, data) && !good.completedQuests.includes(quest.id) && !requiredQuests(18, data).includes(quest))!;
  const cases: [string, (state: GameState) => void][] = [
    ['unknown quest', state => { state.completedQuests.push('absent'); }],
    ['duplicate', state => { state.completedQuests.push(state.completedQuests[0]); }],
    ['before its preparation', state => { state.completedQuests.push(later.id); }],
    ['before its predecessor', state => {
      const [first, second] = ['mara-welcome', 'mara-lamp-supper'].map(id => state.completedQuests.indexOf(id));
      [state.completedQuests[first], state.completedQuests[second]] = [state.completedQuests[second], state.completedQuests[first]];
    }],
    ['the recovery quest', state => { state.completedQuests.push(recovery.id); }],
    ['the recovery quest first', state => { state.completedQuests.unshift(recovery.id); }],
    ['a paid preparation without its quests', state => { state.completedQuests = checkpoint(16).completedQuests; }],
    ['unknown board item', state => { state.board[state.board.indexOf(null)] = { code: 'absent' }; know(state, 'absent'); }],
  ];
  assert.equal(validateGame(good, data), true);
  for (const [label, mutate] of cases) { const broken = structuredClone(good); mutate(broken); assert.equal(validateGame(broken, data), false, label); }
});

test('a long quest line of one character resolves its openings once each', () => {
  // Each quest waits for every earlier quest of its character, so a check without shared openings grows with 2 to the number of quests.
  const content = structuredClone(data);
  for (const quest of content.quests) quest.character = 'mara';
  assert.equal(requiredQuests(content.tasks.length, content).length, content.quests.filter(quest => campaignQuest(quest, content)).length);
});

test('the supper asks one plate for each guest, to the taste of each one, and its delivery pays nothing and queues the finale once', () => {
  const supper = supperQuest(data)!;
  assert.deepEqual(supper.guests, ['mara', 'ilie', 'eszter', 'sorin', 'costel', 'victor', 'ana', 'ileana', 'bran', 'catalina', 'cezar']);
  assert.equal(supper.afterTask, 'task_24');
  assert.equal(supper.reward, 0);
  assert.equal(supper.requirements.length, supper.guests!.length);
  for (const [at, id] of supper.guests!.entries()) {
    const guest = data.characters.find(person => person.id === id)!, { item, quantity } = supper.requirements[at];
    assert.equal(quantity, 1, `One plate for ${guest.name}.`);
    assert.ok(data.items[item].recipe, `${guest.name} gets a mixed dish.`);
    assert.equal(dietBreaks(guest, [item], data, false), false, `The plate of ${guest.name} suits the diet.`);
    if (guest.regular) assert.ok(guest.favourites!.includes(item), `${guest.name} gets a favourite dish.`);
  }
  // Cătălina keeps her fast at the supper: fish is allowed.
  const fast = data.items[supper.requirements[supper.guests!.indexOf('catalina')].item].tags;
  assert.ok(!fast.some(tag => ['meat', 'dairy', 'egg'].includes(tag)));
  const used = new Set(supper.requirements.flatMap(({ item }) => dishChains(item, data)));
  assert.deepEqual([...used].sort(), data.chains.filter(chain => !chain.season).map(chain => chain.id).sort(), 'The plates use the 12 chains that are open all year.');

  // The supper is served on its day, from the booking time.
  const finished = supperEvening();
  assert.equal(status(finished, supper.id), 'active');
  assert.match(rejected(finished, { type: 'deliverQuest', id: supper.id }).message, /every required item/);
  const supplied = supply(finished, supper.id);
  const result = reduceGame(supplied, { type: 'deliverQuest', id: supper.id }, data);
  assert.equal(result.ok, true);
  assert.match(result.message, /served/);
  let state = act(supplied, { type: 'deliverQuest', id: supper.id });
  assert.equal(state.coins, finished.coins, 'The supper pays nothing.');
  assert.deepEqual(state.completedQuests, [...finished.completedQuests, supper.id]);
  assert.deepEqual(state.pendingScenes, [...finished.pendingScenes, data.finales[0].id]);
  rejected(supply(state, supper.id), { type: 'deliverQuest', id: supper.id });
  state = act(state, { type: 'readScene', id: data.finales[0].id });
  rejected(supply(state, supper.id), { type: 'deliverQuest', id: supper.id });
  assert.equal(state.completedQuests.filter(id => id === supper.id).length, 1);
  assert.equal(state.pendingScenes.includes(data.finales[0].id), false, 'The finale is queued once.');
});

test('the recovery quest opens below the floor while a quest is open, takes a fourth ticket, and moves no quest to waiting', () => {
  assert.equal(floor, 10);
  assert.deepEqual(recovery.requirements, [{ item: 'herbs_4', quantity: 1 }]);
  // The starting gift keeps the purse above the floor, so act 1 starts without recovery teas.
  assert.ok(data.prologue.gift >= floor);
  assert.equal(status(actOne(), recovery.id), 'locked');
  const start = { ...actOne(), coins: 0 };
  const low = { ...start, coins: floor - 1 }, high = { ...start, coins: floor };
  assert.equal(status(start, recovery.id), 'active', 'An empty purse opens the recovery quest.');
  assert.equal(status(low, recovery.id), 'active');
  assert.equal(status(high, recovery.id), 'locked', 'The recovery quest closes at the floor.');
  // The recovery quest is active outside the three tickets, so every other quest keeps its status.
  const statuses = (state: GameState) => resolveQuests(state, data).filter(view => !view.quest.recovery).map(view => view.status);
  assert.deepEqual(statuses(low), statuses(high));
  assert.equal(resolveQuests(low, data).filter(view => view.status === 'active').length, QUEST_TICKETS + 1);
  assert.equal(ids(low, 'active').length, QUEST_TICKETS);
  assert.ok(ids(low, 'waiting').length);
  for (const count of [1, 9, 15, 23]) {
    const state = opened(count);
    assert.equal(status(state, recovery.id), 'active');
    assert.deepEqual(statuses(state), statuses({ ...state, coins: floor }));
  }
  // With three campaign tickets and only the third deliverable, the third stays deliverable while the recovery quest is open.
  const [, , third] = ids(start, 'active');
  const supplied = supply(start, third);
  assert.deepEqual(ids(supplied, 'active').map(id => canDeliverQuest(supplied, id, data)), [false, false, true]);
  const delivered = deliver(start, third);
  assert.deepEqual(delivered.completedQuests, [...prologueServed, third]);
  // With no campaign quest open, the recovery quest opens while the purse cannot pay the next preparation.
  for (const count of [1, 12, 23]) {
    const waiting = afterMarch(checkpoint(count)), cost = data.tasks[count].cost;
    assert.deepEqual(ids(waiting, 'active'), []);
    assert.equal(status({ ...waiting, coins: cost - 1 }, recovery.id), 'active');
    assert.equal(status({ ...waiting, coins: cost }, recovery.id), 'locked');
    assert.equal(status({ ...waiting, coins: Math.max(floor, cost) + 1 }, recovery.id), 'locked');
  }
  // After the supper, no quest of act 1 is open, and the first preparation of act 2 needs coins, so an empty purse opens the recovery
  // quest. An open March quest is another open quest, so Dochia's quests are delivered first.
  const served = { ...deliver(afterMarch(supperEvening()), supperQuest(data)!.id), coins: 0, repeating: { last: null, open: null } };
  assert.equal(status(served, recovery.id), 'active');
  assert.equal(status({ ...served, coins: data.tasks[actOneTasks].cost }, recovery.id), 'locked');
});

test('the recovery quest pays its menu value each time, closes at the floor, and is never recorded', () => {
  assert.equal(recovery.reward, menuPrice('herbs_4', data));
  let state = opened(9);
  const completed = [...state.completedQuests];
  for (let count = 1; state.coins < floor; count++) {
    assert.equal(status(state, recovery.id), 'active');
    state = deliver(state, recovery.id);
    assert.equal(state.coins, count * recovery.reward);
    assert.deepEqual(state.completedQuests, completed, 'The recovery quest leaves no record.');
    assert.ok(!state.pendingScenes.includes(recovery.id), 'The recovery quest has no reply.');
  }
  assert.equal(status(state, recovery.id), 'locked');
  rejected(supply(state, recovery.id), { type: 'deliverQuest', id: recovery.id });
  // A purse that falls below the floor opens it again.
  assert.equal(status({ ...state, coins: floor - 1 }, recovery.id), 'active');
  assert.equal(validateGame(state, data), true);
  assert.equal(validateGame({ ...state, completedQuests: [...state.completedQuests, recovery.id] }, data), false, 'A save cannot list the recovery quest as delivered.');
  assert.equal(validateGame({ ...state, pendingScenes: [...state.pendingScenes, recovery.id] }, data), false, 'A save cannot hold a recovery reply.');
});

test("Ana's campaign quests of act 1 open and close in order whether the recovery quest is open or not", () => {
  const ana = data.quests.filter(quest => quest.character === 'ana' && !quest.act && campaignQuest(quest, data));
  assert.deepEqual(ana.map(quest => quest.id), ['ana-night-shift', 'ana-mittens', 'ana-ward-tea', 'ana-garlic']);
  assert.deepEqual(questPredecessors(recovery, data), []);
  assert.ok(data.quests.every(quest => !questPredecessors(quest, data).includes(recovery.id)), 'No quest waits for the recovery quest.');
  for (const [at, quest] of ana.entries()) assert.deepEqual(questPredecessors(quest, data), ana.slice(0, at).map(earlier => earlier.id));
  const windows = ana.map(quest => quest.afterTask === null ? 0 : data.tasks.findIndex(task => task.id === quest.afterTask) + 1);
  for (const [at, window] of windows.entries()) {
    let state = window ? opened(window) : actOne();
    while (ids(state, 'active').length) {
      const low = { ...state, coins: 0 }, high = { ...state, coins: floor };
      assert.equal(status(low, recovery.id), 'active');
      assert.equal(status(high, recovery.id), 'locked');
      const views = ana.map(quest => status(low, quest.id));
      assert.deepEqual(views, ana.map(quest => status(high, quest.id)), 'The recovery quest changes no Ana quest.');
      assert.ok(views.filter(view => view === 'active' || view === 'waiting').length <= 1, 'Ana has at most one open campaign quest.');
      assert.deepEqual(views.slice(0, at), ana.slice(0, at).map(() => 'complete'));
      assert.ok(views.slice(at + 1).every(view => view === 'locked'));
      state = deliver(state, ids(state, 'active')[0]);
    }
    assert.equal(status(state, ana[at].id), 'complete');
  }
});

test('every quest is one meal for each eater, unless its character orders provisions', () => {
  const provisions = data.characters.filter(person => person.provisions).map(person => person.id);
  assert.deepEqual(provisions.sort(), ['adrian', 'dochia', 'janos', 'monica', 'sanziana']);
  // A finale has one plate for each guest, and a stall of the festival feeds a crowd.
  for (const quest of data.quests.filter(quest => !quest.finale && !quest.stall && !provisions.includes(quest.character))) {
    const portions = quest.requirements.reduce((sum, { quantity }) => sum + quantity, 0);
    assert.ok(portions <= 3 * (1 + (quest.companions?.length ?? 0)), `${quest.id} asks for ${portions} portions.`);
    assert.ok(quest.requirements.every(({ quantity }) => quantity <= 2), `${quest.id} asks for more than two of one dish.`);
  }
  // A fourth portion, or a third portion of one dish, is more than one meal. A shared quest counts each of its eaters.
  const sized = (id: string, requirements: Quest['requirements']) => {
    const copy = structuredClone(data), quest = copy.quests.find(value => value.id === id)!;
    Object.assign(quest, { requirements, reward: requirements.reduce((sum, { item, quantity }) => sum + copy.items[item].price * quantity, 0) });
    return questProblems(copy).filter(problem => problem.includes('more than one meal'));
  };
  assert.deepEqual(sized('mara-welcome', [{ item: 'herbs_2', quantity: 3 }, { item: 'herbs_4', quantity: 1 }]), ['mara-welcome: asks for more than one meal for each eater.']);
  assert.deepEqual(sized('mara-welcome', [{ item: 'herbs_2', quantity: 3 }]), ['mara-welcome: asks for more than one meal for each eater.']);
  assert.deepEqual(sized('mina-avram-search', [{ item: 'vegetables_5', quantity: 2 }, { item: 'vegetables_4', quantity: 2 }, { item: 'dairy_5', quantity: 2 }]), []);
  assert.deepEqual(sized('dochia-sheepskin', [{ item: 'corn_4', quantity: 6 }]), []);
});

test('the three-month memorial follows the other quests of Mara after preparation 8, so they open with the payment', () => {
  const memorial = 'mara-three-months';
  assert.deepEqual(questPredecessors(data.quests.find(quest => quest.id === memorial)!, data).slice(-2), ['mara-table', 'mara-candles']);
  let state = afterMarch(opened(8));
  assert.equal(status(state, 'mara-table'), 'active');
  state = deliver(state, 'mara-table');
  assert.notEqual(status(state, 'mara-candles'), 'locked');
  assert.equal(status(state, memorial), 'locked');
  state = deliver(state, 'mara-candles');
  assert.notEqual(status(state, memorial), 'locked');
});

test('an act 1 quest cannot depend on a later act, a March quest, or a delivery that is not recorded', () => {
  for (const id of ['ilie-pickles', 'dochia-sheepskin', data.quests.find(quest => quest.recovery)!.id, data.quests.find(quest => quest.repeating)!.id]) {
    const content = structuredClone(data);
    content.quests.find(quest => quest.id === 'mara-blajini')!.afterQuest = id;
    assert.ok(questProblems(content).includes('mara-blajini: its prior quest must record a delivery in the same campaign.'), id);
    assert.ok(dataProblems(content).length > 0, id);
  }
});

test('each quest dish is one merge beyond the dishes that the player surely knows when the quest takes its ticket', () => {
  assert.deepEqual(discoveryProblems(data), []);
  const asking = (id: string, item: string) => {
    const copy = structuredClone(data);
    copy.quests.find(value => value.id === id)!.requirements = [{ item, quantity: 1 }];
    // Later quests may lose a step that this quest taught; only this quest counts here.
    return discoveryProblems(copy).filter(problem => problem.startsWith(`${id}:`));
  };
  // Act 1 knows the Corn cob of its board, and the prologue taught Loaf and Pogăcele: Shelled corn and Langoș are one merge away,
  // and Cornmeal and Bread basket are two.
  assert.deepEqual(asking('mara-welcome', 'corn_2'), []);
  assert.deepEqual(asking('mara-welcome', 'grain_5'), []);
  assert.deepEqual(asking('mara-welcome', 'corn_3'), ['mara-welcome: Cornmeal is more than one merge beyond the dishes that the player knows when the quest opens.']);
  assert.deepEqual(asking('mara-welcome', 'grain_6'), ['mara-welcome: Bread basket is more than one merge beyond the dishes that the player knows when the quest opens.']);
  // Victor's quest on the counter puts Shelled corn in the recipe book, so the next quest may ask for Cornmeal.
  const next = data.quests[data.quests.findIndex(quest => quest.id === 'victor-exam') + 1].id;
  assert.deepEqual(asking(next, 'corn_3'), []);
});

test('a quest that takes a ticket puts its dishes in the recipe book, and a save without them is not valid', () => {
  const start = actOne();
  const tickets = resolveQuests(start, data).filter(view => view.status === 'active');
  assert.ok(tickets.length > 1);
  for (const { quest } of tickets) for (const { item } of quest.requirements) assert.ok(start.discovered.includes(item), item);
  const hidden = tickets.flatMap(({ quest }) => quest.requirements.map(({ item }) => item)).find(item => !data.board.initial.includes(item))!;
  assert.equal(validateGame({ ...start, discovered: start.discovered.filter(code => code !== hidden) }, data), false);
  // A payment opens new quests, and their tickets show only dishes from the recipe book.
  const paid = act({ ...checkpoint(0) }, { type: 'task' });
  for (const view of resolveQuests(paid, data).filter(view => view.status === 'active')) {
    for (const { item } of view.quest.requirements) assert.ok(paid.discovered.includes(item), `${view.quest.id}: ${item}`);
  }
});
