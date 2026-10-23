import test from 'node:test';
import assert from 'node:assert/strict';
import { dayMerges, firstFreeBoardCell, holding, laterDay, QUEST_TICKETS, questHoliday, resolveQuests, ticketNote } from '../src/model.ts';
import type { GameState, Quest } from '../src/model.ts';
import { checkpointState, moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, actOneTasks, data, deliver, payNext, player, quest } from './support.ts';

const stalls = data.quests.filter(value => value.stall), festival = questHoliday(stalls[0], data)!.day;
/** The status of a quest in a state. */
const status = (state: GameState, value: Quest) => resolveQuests(state, data).find(view => view.quest === value)!.status;
/** The quests on the counter. The recovery quest has its own ticket. */
const tickets = (state: GameState) => resolveQuests(state, data).filter(view => view.status === 'active' && !view.quest.recovery).map(view => view.quest);
/** The game just after the payment of preparation 12 of act 2, on its payment day, with its quests delivered. */
const afterTwelve = () => payNext(checkpointState(data, actOneTasks + 11));
/** The game at the opening of 21 June, with the purse for the takes of the stalls. */
function festivalMorning() {
  const state = afterTwelve();
  moveTo(state, festival, data);
  state.coins = 5000;
  return state;
}
/** A merge of two Herb bunches from free cells, which moves the clock by one merge. */
function herbMerge(state: GameState) {
  const next = structuredClone(state), from = firstFreeBoardCell(next, data);
  next.board[from] = { code: 'herbs_1' };
  const to = firstFreeBoardCell(next, data);
  next.board[to] = { code: 'herbs_1' };
  return act(next, { type: 'move', from, to });
}

test('before 21 June, the grill ticket shows the festival date and Later, and the other four stall quests are not open', () => {
  const state = afterTwelve(), [grill, ...others] = stalls;
  assert.ok(state.clock.day < festival);
  assert.equal(status(state, grill), 'active');
  assert.equal(laterDay(state, grill, data), true);
  assert.match(ticketNote(state, grill, data)!, /Saturday 21 June/);
  for (const value of others) assert.equal(status(state, value), 'locked', value.id);
});

test('on 21 June each stall delivery opens the next stall quest, the counter holds at most three tickets, the mayor has one open stall quest, and the day holds until the fifth stall', () => {
  let state = festivalMorning();
  state.clock.merges = dayMerges(festival, data) - 1;
  assert.equal(holding(state, data), true);
  // At the held position, a merge leaves the clock where it is.
  state = herbMerge(state);
  assert.deepEqual(state.clock, { day: festival, merges: dayMerges(festival, data) - 1 });
  for (const [index, stall] of stalls.entries()) {
    assert.equal(status(state, stall), 'active', stall.id);
    assert.ok(tickets(state).length <= QUEST_TICKETS);
    assert.deepEqual(resolveQuests(state, data).filter(view => view.quest.stall && (view.status === 'active' || view.status === 'waiting')).map(view => view.quest), [stall]);
    for (const later of stalls.slice(index + 1)) assert.equal(status(state, later), 'locked', later.id);
    state = deliver(state, stall.id);
    // The day holds until the fifth delivery, which closes it in the same change.
    assert.equal(state.clock.day, index < stalls.length - 1 ? festival : festival + 1, stall.id);
  }
  assert.equal(state.night!.day, festival);
});

test('a festival run on 21 June from a board with no festival dish cooks and delivers the five stall quests through the hold, and 22 June starts once', () => {
  let state = festivalMorning();
  const dishes = new Set(stalls.flatMap(value => value.requirements.map(({ item }) => item)));
  state.board = state.board.map(cell => cell && dishes.has(cell.code) ? null : cell);
  let closings = 0;
  for (const stall of stalls) {
    assert.equal(state.clock.day, festival, `${stall.id} is cooked on 21 June.`);
    const play = player(state);
    for (const { item, quantity } of stall.requirements) for (let count = 0; count < quantity; count++) play.produce(item);
    const before = play.state;
    if (stall === stalls.at(-1)) assert.equal(holding(before, data), true, 'The cooking reaches the held position before the fifth stall.');
    state = act(before, { type: 'deliverQuest', id: stall.id });
    if (state.clock.day !== before.clock.day) closings++;
    closings += play.state.clock.day - festival;
  }
  // The stalls need more merges than one day holds, so the hold keeps 21 June until the fifth delivery closes it.
  assert.equal(closings, 1);
  assert.equal(state.clock.day, festival + 1);
  assert.equal(state.night!.day, festival);
});

test('the payoffs and closing scenes of preparations 12 and 24 of act 2 never name the purchase, and tell of the festival and the feast only as still to come', () => {
  for (const number of [12, 24]) {
    const task = data.tasks[actOneTasks + number - 1], chapter = data.chapters[task.chapter - 1];
    const lines = [...task.dialogue.map(line => line.text), data.rooms.find(room => room.after === task.id)!.text, chapter.payoff, ...chapter.closing.map(line => line.text)];
    for (const line of lines) {
      assert.doesNotMatch(line, /\b(orchard|purchase|buy|bought)\b/i, line);
      // The feast tables are furniture that preparation 24 sets up, so only other words for the feast must look ahead.
      const told = line.replace(/feast tables/gi, '');
      if (/\b(festival|feast)\b/i.test(told)) assert.match(told, /\b(wait|waits|tomorrow|will|ready)\b/i, line);
    }
  }
});

test('the fifth stall quest names the festival painting, and no other quest names a painting', () => {
  assert.deepEqual(data.quests.filter(value => value.painting).map(value => value.id), [stalls.at(-1)!.id]);
  assert.equal(quest(stalls.at(-1)!.id).painting!.image, 'festival');
  assert.ok(quest(stalls.at(-1)!.id).painting!.text.trim());
});
