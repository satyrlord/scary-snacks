import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignQuest, canLightLanterns, clockStopped, dateText, dayMerges, dishChains, dishWork, finaleQuest, firstFreeBoardCell, getItem, growthStages, levers, menuPrice, menuValue,
  NO_STAGES, questPredecessors, questReward, requiredQuests, resolveQuests, salePrice, takeCost, taskEligibility } from '../src/model.ts';
import { dataProblems } from '../src/content.ts';
import type { GameData, GameState, Quest } from '../src/model.ts';
import { checkpointState, finaleCheckpoint, moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, actTwoTasks, afterMarch, closeDay, data, deliver, know, onTicket, quest, rejected, reload, status, supply, validate } from './support.ts';

/** The index of a preparation by its ID. */
const index = (id: string) => data.tasks.findIndex(task => task.id === id);
/** The merges of the dishes of a quest. */
const work = (value: Quest) => value.requirements.reduce((sum, { item, quantity }) => sum + dishWork(item, data).merges * quantity, 0);
/** A quest of a data copy by its ID. */
const find = (content: GameData, id: string) => content.quests.find(value => value.id === id)!;
const take = data.economy.takeCost, dinner = finaleQuest(data.finales[2], data)!, parts = data.quests.filter(value => value.order && value !== dinner);

test('the pumpkin fair dialogue names the dishes on its ticket', () => {
  const fair = quest('bran-pumpkins'), opening = fair.opening.map(line => line.text).join(' ').toLocaleLowerCase();
  for (const { item } of fair.requirements) assert.ok(opening.includes(data.items[item].name.toLocaleLowerCase()), data.items[item].name);
  assert.ok(!opening.includes(data.items.mixed_tochitura.name.toLocaleLowerCase()), 'Bran does not ask for an unrequested dish.');
});

test('the first orchard payment describes free fruit with unchanged menu prices', () => {
  const before = index(data.economy.orchard.after[0]), stages = [before, before + 1].map(count => growthStages(count, data));
  assert.deepEqual(stages.map(stage => menuPrice('fruits_1', data, stage)), [take, take]);
  assert.deepEqual(stages.map(stage => takeCost(data.items.generator_fruits, data, stage)), [take, 0]);
  const scene = data.tasks[before].dialogue.map(line => line.text).join(' ');
  assert.match(scene, /menu prices stay the same/);
  assert.doesNotMatch(scene, /counts for more on the menu/);
});

/** A copy with two Elderflowers that merge, and their cells. */
function withPair(state: GameState): { state: GameState; from: number; to: number } {
  const next = structuredClone(state), from = firstFreeBoardCell(next, data);
  next.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(next, data);
  next.board[to] = { code: 'herbs_1' };
  know(next, 'herbs_1');
  return { state: next, from, to };
}

test('the orchard value of each stage sets the take of the Cornucopia, the prices of the fruit dishes, and the reward of a repeating fruit quest, also after a reload', () => {
  const { values, after } = data.economy.orchard, rate = data.economy.workRate;
  const repeat = data.quests.find(value => value.repeating && value.requirements.some(({ item }) => dishChains(item, data).includes('fruits')))!;
  // The state before preparation 2 of act 3, and the states after the payments that start orchard stages 1 to 3.
  const states = [index(after[0]), ...after.map(id => index(id) + 1)].map(count => checkpointState(data, count)), rewards: number[] = [];
  for (const [stage, state] of states.entries()) {
    const stages = growthStages(state.taskIndex, data), fruit = stage ? values[stage - 1] : take;
    assert.equal(stages.orchard, stage);
    assert.equal(takeCost(data.items.generator_fruits, data, stages), stage ? 0 : take, `The Cornucopia at stage ${stage}`);
    assert.equal(menuPrice('fruits_1', data, stages), fruit, `Plums at stage ${stage}`);
    assert.equal(menuPrice('fruits_6', data, stages), 32 * fruit + 31 * rate, `Plum brandy at stage ${stage}`);
    assert.equal(menuPrice('mixed_suckling-pig', data, stages), menuPrice('pork_5', data, stages) + menuPrice('orchard_1', data, stages) + rate);
    if (stage) assert.equal(menuPrice('orchard_1', data, stages), fruit, `Apples at stage ${stage}`);
    for (const value of [state, reload(state)]) assert.equal(questReward(repeat, value, data), menuValue(repeat, data, stages), `${repeat.id} at stage ${stage}`);
    rewards.push(questReward(repeat, state, data));
  }
  // The orchard value of stage 1 equals the take cost, so stage 1 makes the Cornucopia free without a change of price.
  assert.ok(values[0] === take && rewards[1] === rewards[0] && rewards[2] > rewards[1] && rewards[3] > rewards[2], `The repeating fruit quest pays more from stage 2: ${rewards.join(' ')}.`);
  // A campaign quest of act 3 pays the menu value of the stage at which it takes its ticket, also when the orchard grows later.
  const fruity = data.quests.filter(value => value.act === 3 && campaignQuest(value, data) && !value.order
    && value.requirements.some(({ item }) => dishChains(item, data).some(chain => chain === 'fruits' || chain === 'orchard')));
  assert.ok(fruity.length > 0);
  for (const value of fruity) {
    const ready = onTicket(value), stages = growthStages(ready.taskIndex, data);
    assert.equal(value.reward, menuValue(value, data, stages), value.id);
    const later = { ...ready, taskIndex: data.tasks.length - 1 };
    assert.equal(questReward(value, later, data), value.reward, `${value.id} keeps its reward at a later stage.`);
    for (const state of [ready, reload(ready)]) assert.equal(deliver(state, value.id).coins, state.coins + value.reward, value.id);
  }
});

test('Plums sell for the take cost before orchard stage 1 and for nothing from it, the suckling pig sells for its pork, and Gherkins sell for nothing from preparation 16', () => {
  for (const stage of [0, 1, 2, 3]) {
    const stages = { ...NO_STAGES, orchard: stage };
    assert.equal(salePrice('fruits_1', data, stages), stage ? 0 : take, `Plums at stage ${stage}`);
    if (stage) assert.equal(salePrice('mixed_suckling-pig', data, stages), salePrice('pork_5', data, stages), `The suckling pig at stage ${stage}`);
  }
  assert.equal(salePrice('pork_5', data), 16 * take);
  const cellar = index(data.economy.cellar.after[0]);
  assert.deepEqual([salePrice('pickles_1', data, growthStages(cellar, data)), salePrice('pickles_1', data, growthStages(cellar + 1, data))], [take, 0]);
  // At orchard stage 3, a take of Plums and its sale leave the purse as it was, 20 times over.
  let state = checkpointState(data, index(data.economy.orchard.after[2]) + 1);
  assert.equal(growthStages(state.taskIndex, data).orchard, 3);
  const purse = state.coins;
  for (let round = 0; round < 20; round++) {
    const cell = firstFreeBoardCell(state, data);
    state = act(state, { type: 'spawn', chain: 'fruits' });
    assert.equal(state.board[cell]?.code, 'fruits_1');
    state = act(state, { type: 'sell', index: cell });
    assert.equal(state.board[cell], null);
  }
  assert.equal(state.coins, purse);
});

test('preparation 16 raises Mixed pickles from 10 to 14 coins and makes a retained pickle barrel free, also in debt and after a reload, until it leaves after the delivery', () => {
  const before = afterMarch(checkpointState(data, index('act3-prep-16'))), night = quest('ana-pickles');
  assert.equal(night.title, 'Pickles for the night shift');
  assert.equal(menuPrice('pickles_3', data, growthStages(before.taskIndex, data)), 10);
  // An open "Pickles for the night shift" keeps the pickle barrel after its season, into act 3.
  const kept = { ...before, sources: [...before.sources, 'pickles'], repeating: { last: null, open: night.id }, coins: before.coins + take };
  assert.equal(validate(kept), true);
  const taken = act(kept, { type: 'spawn', chain: 'pickles' });
  assert.equal(taken.coins, kept.coins - take, 'A take before the payment spends the take cost.');
  const paid = act(taken, { type: 'task' });
  assert.equal(menuPrice('pickles_3', data, growthStages(paid.taskIndex, data)), 14);
  for (const state of [paid, reload(paid), { ...paid, coins: -5 }]) assert.equal(act(state, { type: 'spawn', chain: 'pickles' }).coins, state.coins, 'A take after the payment is free.');
  const delivered = deliver(paid, night.id);
  assert.ok(delivered.sources.includes('pickles'), 'The barrel stays until the next closing.');
  assert.ok(!closeDay(delivered).sources.includes('pickles'), 'The barrel leaves at the closing after the delivery.');
});

test('the data check accepts the dinner without guests, the parts of more than 60 merges, and the wooden platter, and rejects their broken copies', () => {
  assert.deepEqual(dataProblems(data), []);
  assert.equal(dinner.guests, undefined);
  const weekday = (data.acts[2].day.closing - data.acts[2].day.opening) / data.acts[2].day.mergeMinutes;
  assert.ok([...parts, dinner].every(value => work(value) > weekday), 'Each part of the order needs more than the merges of one weekday.');
  assert.deepEqual(data.items['mixed_wooden-platter'].tags, ['meat', 'pork', 'garlic']);
  const broken = (change: (content: GameData) => void) => { const copy = structuredClone(data); change(copy); return dataProblems(copy); };
  // A regular quest of act 3 still fits in one weekday.
  const regular = data.quests.find(value => value.act === 3 && campaignQuest(value, data) && !value.order && !value.booked)!;
  assert.ok(broken(content => { find(content, regular.id).requirements = [{ item: 'fruits_6', quantity: 2 }]; })
    .includes(`${regular.id}: needs 62 merges, more than the ${weekday} of one weekday of its act.`));
  assert.ok(broken(content => { content.items['mixed_wooden-platter'].tags = ['meat', 'pork']; }).includes('mixed_wooden-platter: a mixed dish has every tag of its parts.'));
  assert.ok(broken(content => { find(content, dinner.id).guests = ['mara']; }).includes(`${dinner.id}: the last part of the order has no guests.`));
  // The supper and the feast keep their guest lists.
  for (const finale of data.finales.slice(0, 2)) {
    const id = finaleQuest(finale, data)!.id, plates = `${id}: needs one plate for each known guest.`;
    assert.ok(broken(content => { delete find(content, id).guests; }).includes(plates), `${id}: no guest list`);
    assert.ok(broken(content => { find(content, id).guests!.pop(); }).includes(plates), `${id}: a short guest list`);
    assert.ok(broken(content => { find(content, id).guests![0] = 'nobody'; }).includes(plates), `${id}: an unknown guest`);
    assert.ok(broken(content => { const guests = find(content, id).guests!; guests[1] = guests[0]; }).includes(plates), `${id}: the same guest twice`);
    assert.ok(broken(content => { find(content, id).requirements[0].quantity = 2; }).some(problem => problem.startsWith(`${id}: one plate for `)), `${id}: a second portion`);
    // A supper or a feast opens after the last preparation of its act.
    assert.ok(broken(content => { find(content, id).afterTask = content.tasks[content.tasks.findIndex(task => task.id === find(content, id).afterTask) - 1].id; })
      .includes(`${id}: a finale quest opens after the last preparation of its act.`), `${id}: an early opening`);
  }
});

test('preparations 16 to 18 need no part of the order, the dinner opens after preparation 15 and part 5, and a preparation that waits for the dinner fails the check', () => {
  const last = data.tasks.length;
  for (let at = index('act3-prep-16'); at < last; at++) assert.ok(!requiredQuests(at, data).includes(dinner), data.tasks[at].id);
  assert.equal(dinner.afterTask, 'act3-prep-15');
  assert.ok(questPredecessors(dinner, data).includes(parts.at(-1)!.id), 'The dinner waits for part 5.');
  const ready = checkpointState(data, index('act3-prep-16'));
  assert.equal(status(ready, dinner.id), 'active', 'The dinner holds its ticket while preparation 16 waits.');
  assert.equal(taskEligibility(ready, data).ready, true);
  const waiting = requiredQuests(index('act3-prep-16'), data).find(value => value.act === 3 && !value.order)!, copy = structuredClone(data);
  find(copy, waiting.id).afterQuest = dinner.id;
  assert.ok(dataProblems(copy).includes(`The hold of ${dateText(data.acts[2].to - 1, data, 'plain')}: its release cannot come before its closing.`));
});

test('a late player pays preparation 3 on 15 September and part 2 opens at that payment, September needs no part of October, and part 2 holds preparation 4', () => {
  const [, second, , fourth, fifth] = parts;
  assert.equal(second.afterTask, 'act3-prep-3');
  const late = checkpointState(data, index('act3-prep-3'));
  moveTo(late, data.acts[2].from + 14, data);
  assert.equal(status(late, second.id), 'locked');
  const paid = act(late, { type: 'task' });
  assert.equal(paid.clock.day, data.acts[2].from + 14);
  assert.notEqual(status(paid, second.id), 'locked', 'Part 2 opens at the payment.');
  for (let at = index('act3-prep-1'); at <= index('act3-prep-9'); at++) {
    assert.ok(!requiredQuests(at, data).some(value => value === fourth || value === fifth), data.tasks[at].id);
  }
  const open = checkpointState(data, index('act3-prep-4'));
  open.completedQuests = open.completedQuests.filter(id => id !== second.id);
  assert.equal(validate(open), true);
  assert.equal(taskEligibility(open, data).ready, false);
  rejected(open, { type: 'task' });
});

test('a purchase before the held position and a purchase at it each start 1 September once, with one upkeep and one night, and keep an unread scene and an open repeating quest', () => {
  const purchase = actTwoTasks - 1, repeat = data.quests.find(value => value.repeating)!;
  const ready = { ...checkpointState(data, purchase), repeating: { last: null, open: repeat.id } }, upkeep = levers(data.acts[1].to, data).upkeep;
  assert.equal(validate(ready), true);
  const early = act(ready, { type: 'task' });
  assert.equal(early.clock.day, data.acts[1].to);
  const closed = closeDay(early);
  const held = act({ ...ready, clock: { ...ready.clock, merges: dayMerges(ready.clock.day, data) - 1 } }, { type: 'task' });
  for (const [label, state, paid] of [['before', closed, early], ['at', held, held]] as const) {
    assert.deepEqual(state.clock, { day: data.acts[2].from, merges: 0 }, `A purchase ${label} the held position starts 1 September.`);
    assert.equal(state.night!.day, data.acts[1].to);
    assert.equal(state.night!.upkeep, upkeep);
    assert.deepEqual(state.act2, { purse: paid.act2!.purse });
    assert.ok(state.pendingScenes.includes(data.tasks[purchase].id), 'The purchase scene stays unread.');
    assert.deepEqual(state.repeating, ready.repeating, 'The repeating quest stays open.');
    assert.deepEqual(reload(state), state);
  }
  assert.deepEqual([closed.coins, held.coins], [ready.coins - data.tasks[purchase].cost - upkeep, ready.coins - data.tasks[purchase].cost - upkeep], 'Each purchase pays one upkeep.');
});

test('on 31 October Serve before 20:00 changes nothing, the lanterns set 20:00, and Serve records the result of act 3 once and stops the clock', () => {
  const evening = finaleCheckpoint(data, 3), finale = data.finales[2], dayLevers = levers(finale.day, data);
  const morning = supply({ ...evening, clock: { ...evening.clock, merges: 0 } }, dinner.id);
  rejected(morning, { type: 'deliverQuest', id: dinner.id });
  assert.ok(canLightLanterns(morning, dinner, data));
  const lit = act(morning, { type: 'lantern', id: dinner.id });
  assert.equal(lit.clock.merges, (dayLevers.booking - dayLevers.opening) / dayLevers.mergeMinutes);
  const served = act(lit, { type: 'deliverQuest', id: dinner.id });
  assert.deepEqual(served.act3, { purse: served.coins });
  assert.equal(served.coins, lit.coins, 'The dinner pays nothing.');
  assert.deepEqual(served.pendingScenes.filter(id => id === finale.id), [finale.id], 'Serve opens the finale once.');
  assert.ok(clockStopped(served, data));
  for (const state of [served, reload(served)]) rejected(supply(state, dinner.id), { type: 'deliverQuest', id: dinner.id });
  // Later takes and merges change the purse but not the result, and move no time.
  const source = served.sources.find(chain => takeCost(getItem(`generator_${chain}`, data)!, data, growthStages(served.taskIndex, data)) > 0)!;
  const spent = act(served, { type: 'spawn', chain: source });
  assert.equal(spent.coins, served.coins - take);
  const { state, from, to } = withPair({ ...spent, clock: { ...spent.clock, merges: dayMerges(spent.clock.day, data) - 1 } }), merged = act(state, { type: 'move', from, to });
  assert.deepEqual([merged.clock, merged.night, merged.act3], [state.clock, state.night, served.act3]);
  assert.deepEqual(reload(merged).act3, served.act3);
  // The result needs the dinner, and the dinner needs the result.
  assert.equal(validate({ ...evening, act3: { purse: evening.coins } }), false);
  const unrecorded: GameState = structuredClone(served);
  delete unrecorded.act3;
  assert.equal(validate(unrecorded), false);
  assert.equal(resolveQuests(served, data).find(view => view.quest === dinner)!.status, 'complete');
});
