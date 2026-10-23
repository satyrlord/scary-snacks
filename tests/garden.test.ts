import test from 'node:test';
import assert from 'node:assert/strict';
import { firstFreeBoardCell, freeBoardCells, gardenStage, menuPrice, menuValue, questReward, requiredQuests, resolveQuests, takeCost } from '../src/model.ts';
import { reduceGame } from '../src/engine.ts';
import type { GameState } from '../src/model.ts';
import { checkpointState, moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, actOne, afterMarch, closeDay, data, deliver, know, onTicket, rejected, reload, validate } from './support.ts';

/** The index of a preparation by its ID. */
const index = (id: string) => data.tasks.findIndex(task => task.id === id);
/** 1 June, the first day of the season of the Garden beds, and 31 May, the last day of the forage basket. */
const june = data.chains.find(chain => chain.id === 'garden')!.season!.from, may31 = data.chains.find(chain => chain.id === 'greens')!.season!.to;
/** A copy on a later morning, after quiet nights. */
const on = (state: GameState, day: number) => { const next = structuredClone(state); moveTo(next, day, data); return next; };
/** A copy with these dishes in the first free cells, and the cells that they take. */
function place(state: GameState, ...codes: string[]): { state: GameState; cells: number[] } {
  const next = structuredClone(state), cells: number[] = [];
  for (const code of codes) {
    const cell = firstFreeBoardCell(next, data);
    assert.notEqual(cell, -1);
    next.board[cell] = { code };
    know(next, code);
    cells.push(cell);
  }
  return { state: next, cells };
}

test('a payment of preparation 6 in May places the Garden beds on the morning of 1 June, and no Garden beds come without that payment', () => {
  const ready = checkpointState(data, index('act2-prep-6'));
  assert.ok(ready.clock.day < june, 'Preparation 6 can be paid in May.');
  const paid = act(ready, { type: 'task' });
  assert.ok(!paid.sources.includes('garden'), 'The Garden beds wait for their season.');
  const morning = closeDay(on(paid, june - 1));
  assert.equal(morning.clock.day, june);
  assert.ok(morning.sources.includes('garden'), 'The Garden beds come on 1 June.');
  const unpaid = closeDay(on(ready, june - 1));
  assert.equal(unpaid.clock.day, june);
  assert.ok(!unpaid.sources.includes('garden'), 'Without preparation 6, the season of the Garden beds does not start.');
});

test('a payment of preparation 6 in June places the Garden beds at once', () => {
  const ready = on(checkpointState(data, index('act2-prep-6')), june + 2);
  assert.ok(!ready.sources.includes('garden'));
  const result = reduceGame(ready, { type: 'task' }, data);
  assert.equal(result.ok, true, result.message);
  assert.equal(validate(result.state), true);
  assert.ok(result.state.sources.includes('garden'));
  assert.match(result.message, /The Garden beds is ready\./);
});

test('a payment of preparation 6 in June on a full board places the Garden beds at once, and the board stays full', () => {
  let ready = on(checkpointState(data, index('act2-prep-6')), june + 2);
  while (freeBoardCells(ready, data)) ready = place(ready, 'herbs_3').state;
  const paid = act(ready, { type: 'task' });
  assert.equal(freeBoardCells(paid, data), 0);
  assert.equal(paid.sources.at(-1), 'garden');
  assert.deepEqual(reload(paid), paid);
});

test('the Summer salad and the Tomato salad with telemea cost the garden value of each stage, and their quests pay it, also after a reload', () => {
  const { values } = data.economy.garden, work = data.economy.workRate;
  // A Summer salad is two garden ingredients and one merge. A Tomato salad adds a Telemea of eight dairy ingredients and eight merges.
  for (const stage of [0, 1, 2, 3]) {
    const garden = stage ? values[stage - 1] : takeCost(data.items.generator_garden, data, stage);
    assert.equal(menuPrice('garden_2', data, stage), 2 * garden + work, `Summer salad at stage ${stage}`);
    assert.equal(menuPrice('mixed_tomato-salad', data, stage), 2 * garden + 8 * data.economy.takeCost + 9 * work, `Tomato salad at stage ${stage}`);
    assert.equal(takeCost(data.items.generator_garden, data, stage), 0, 'The Garden beds are free.');
  }
  assert.deepEqual([menuPrice('garden_2', data), menuPrice('mixed_tomato-salad', data)], [data.items.garden_2.price, data.items['mixed_tomato-salad'].price]);
  const salads = data.quests.filter(value => value.requirements.some(({ item }) => item === 'garden_2' || item === 'mixed_tomato-salad'));
  const stages = new Set<number>();
  for (const value of salads) {
    // The preparation that first needs a quest sets its garden stage.
    const stage = gardenStage(data.tasks.findIndex((_, at) => requiredQuests(at, data).includes(value)), data);
    stages.add(stage);
    assert.equal(value.reward, menuValue(value, data, stage), `${value.id} pays its menu value at stage ${stage}.`);
    // A stall quest releases the hold of the festival, so the tests of the festival deliver it on its day.
    if (value.stall) continue;
    const ready = onTicket(value);
    assert.equal(gardenStage(ready.taskIndex, data), stage);
    assert.equal(questReward(value, ready, data), value.reward);
    for (const state of [ready, reload(ready)]) assert.equal(deliver(state, value.id).coins, state.coins + value.reward, value.id);
  }
  // The Garden beds come with preparation 6, which starts stage 1, so the salad quests cover the stages 1 to 3.
  assert.deepEqual([...stages].sort(), [1, 2, 3], 'The salad quests cover every garden stage of the Garden beds.');
});

test('a take from the pickle barrel spends the take cost, a purse in debt takes nothing, and Gherkins and Mixed pickles keep their prices', () => {
  const start = actOne();
  assert.ok(start.sources.includes('pickles'), 'The pickle barrel is in the bistro in act 1.');
  const taken = act(start, { type: 'spawn', chain: 'pickles' });
  assert.equal(taken.coins, start.coins - data.economy.takeCost);
  assert.equal(taken.board[firstFreeBoardCell(start, data)]?.code, 'pickles_1');
  assert.match(rejected({ ...start, coins: -3 }, { type: 'spawn', chain: 'pickles' }).message, /cannot pay/);
  assert.deepEqual([menuPrice('pickles_1', data), menuPrice('pickles_3', data)], [1, 10]);
  assert.deepEqual([data.items.pickles_1.price, data.items.pickles_3.price], [1, 10]);
  // The quests that ask for pickles pay their menu value: the authored reward, and the menu value of a repeating quest.
  for (const value of data.quests.filter(value => value.requirements.some(({ item }) => item.startsWith('pickles_')))) {
    assert.equal(questReward(value, start, data), menuValue(value, data, 0), value.id);
    if (!value.repeating) assert.equal(value.reward, menuValue(value, data, 0), value.id);
  }
});

test('a take from the forage basket stays free', () => {
  const spring = on(actOne(), data.chains.find(chain => chain.id === 'greens')!.season!.from);
  assert.ok(spring.sources.includes('greens'), 'The forage basket comes with spring.');
  const taken = act(spring, { type: 'spawn', chain: 'greens' });
  assert.equal(taken.coins, spring.coins);
  assert.equal(takeCost(data.items.generator_greens, data), 0);
});

test('an undelivered May quest that asks for forage keeps the forage basket after 31 May, also after a reload, and the basket leaves at the first closing after its delivery', () => {
  const forage = data.quests.find(value => value.act === 2 && value.requirements.some(({ item }) => item.startsWith('greens_')))!;
  const state = checkpointState(data, index('act2-prep-1'));
  state.completedQuests = state.completedQuests.filter(id => id !== forage.id);
  const may = on({ ...afterMarch(state), coins: 1000 }, may31);
  assert.ok(may.sources.includes('greens'), 'The forage basket is in the source tab on 31 May.');
  const june1 = closeDay(may);
  assert.equal(june1.clock.day, may31 + 1);
  assert.ok(june1.sources.includes('greens'), 'The basket stays while the quest is not delivered.');
  assert.deepEqual(june1.night!.departed, []);
  const reloaded = reload(june1);
  assert.deepEqual(reloaded, june1);
  assert.equal(resolveQuests(reloaded, data).find(view => view.quest === forage)!.status, 'active');
  const missing = { ...reloaded, sources: reloaded.sources.filter(chain => chain !== 'greens') };
  assert.equal(validate(missing), false, 'A save cannot lose a seasonal source while a campaign quest still needs it.');
  const delivered = deliver(reloaded, forage.id);
  assert.ok(delivered.sources.includes('greens'), 'The basket stays until the next closing.');
  const next = closeDay(delivered);
  assert.ok(!next.sources.includes('greens'));
  assert.deepEqual(next.night!.departed, ['greens']);
});
