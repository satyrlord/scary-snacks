import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignQuest, canLightLanterns, clockMinutes, clockText, dayMerges, deliveriesSince, earnedScenes, isSunday, levers, questOpening, questPredecessors, requiredQuests, resolveQuests, supperQuest } from '../src/model.ts';
import { dataProblems, questProblems } from '../src/content.ts';
import type { Quest } from '../src/model.ts';
import { checkpointState, moveTo } from '../tools/create-checkpoint-saves.ts';
import { act, closeDay, data, deliver, onTicket, quest, reload, supperEvening, supply, tonight } from './support.ts';


test('act 2 keeps the 25-minute grid: a weekday closes after 36 merges and a Sunday after 18, from 2 May to 31 August', () => {
  const { opening, closing, booking, sunday, mergeMinutes } = data.acts[1].day;
  assert.equal(mergeMinutes, 25);
  for (const span of [closing - opening, booking - opening, sunday.closing - sunday.opening]) assert.equal(span % mergeMinutes, 0, `${span} minutes`);
  assert.deepEqual([clockText(booking), clockText(opening), clockText(closing)], ['19:30', '07:00', '22:00']);
  for (let day = data.acts[1].from; day <= data.acts[1].to; day++) {
    assert.equal(levers(day, data).mergeMinutes, 25);
    assert.equal(dayMerges(day, data), isSunday(day, data) ? 18 : 36, `Day ${day}`);
  }
});

test('the lantern of a booked guest of act 2 moves the clock to 19:30, and a save on a weekday and on a Sunday keeps its clock', () => {
  const booked = data.quests.find(value => value.act === 2 && value.booked && value.evening === undefined)!;
  const ready = tonight(supply(onTicket(booked), booked.id), booked.id);
  assert.ok(canLightLanterns(ready, booked, data));
  const lit = act(ready, { type: 'lantern', id: booked.id });
  assert.equal(clockMinutes(lit, data), levers(lit.clock.day, data).booking);
  assert.equal(clockText(clockMinutes(lit, data)), '19:30');
  for (const day of [lit.clock.day, lit.clock.day + [0, 1, 2, 3, 4, 5, 6].find(offset => isSunday(lit.clock.day + offset, data))!]) {
    const state = structuredClone(lit);
    moveTo(state, day, data);
    state.clock.merges = isSunday(day, data) ? 11 : 23;
    const loaded = reload(state);
    assert.deepEqual(loaded.clock, state.clock);
    assert.equal(clockMinutes(loaded, data), clockMinutes(state, data), `Day ${day}`);
  }
});

test('after the supper, an unread act 1 finale and an open March quest stay into 2 May, and the March quest keeps its reward', () => {
  const evening = supperEvening(), supper = supperQuest(data)!;
  const march = data.quests.find(value => evening.march.includes(value.id) && !evening.completedQuests.includes(value.id))!;
  assert.ok(march, 'A March quest is open on the evening of the supper.');
  const served = deliver(evening, supper.id);
  assert.ok(served.pendingScenes.includes(data.finales[0].id));
  // A reload before and after the supper gives the same result.
  assert.deepEqual(deliver(reload(evening), supper.id), served);
  assert.deepEqual(reload(served), served);
  const morning = closeDay(served);
  assert.deepEqual(closeDay(reload(served)), morning);
  assert.equal(morning.clock.day, data.acts[1].from, 'The closing of 1 May starts 2 May.');
  assert.equal(morning.coins, served.coins - levers(data.finales[0].day, data).upkeep, 'The closing of 1 May pays one upkeep.');
  assert.ok(morning.pendingScenes.includes(data.finales[0].id), 'The finale of act 1 waits in act 2.');
  assert.equal(resolveQuests(morning, data).find(view => view.quest === march)!.status, 'active');
  assert.equal(deliver(morning, march.id).coins, morning.coins + march.reward, 'The March quest pays its authored reward.');
});

test('the news of Mina and Avram needs three campaign quests that open after its delivery, and a late delivery earns it before the purchase', () => {
  const search = quest('mina-avram-search'), openings = new Map<Quest, number>(), opening = questOpening(search, data, openings);
  const after = data.quests.filter(other => campaignQuest(other, data) && other.act === search.act && other !== search
    && (questOpening(other, data, openings) > opening || questPredecessors(other, data).includes(search.id)));
  assert.ok(after.length >= search.followUp!.afterDeliveries);
  // A test data set: every quest after the search but two moves to a later act.
  const short = structuredClone(data);
  for (const other of after.slice(2)) short.quests.find(value => value.id === other.id)!.act = 3;
  assert.ok(questProblems(short).includes(`${search.id}: only 2 campaign quests open after its delivery, fewer than the ${search.followUp!.afterDeliveries} that its news needs.`), questProblems(short).join(' '));
  assert.ok(dataProblems(short).length);
  // The latest delivery that the data permits: just before the payment that needs it. The quests of the later payments earn the news.
  const late = deliver(onTicket(search), search.id);
  assert.equal(late.completedQuests.at(-1), search.id);
  const paid = act({ ...late, coins: Math.max(late.coins, data.tasks[late.taskIndex].cost) }, { type: 'task' });
  const beforePurchase = checkpointState(data, data.tasks.length - 1, paid);
  assert.equal(beforePurchase.taskIndex, data.tasks.length - 1, 'The purchase is still to pay.');
  assert.ok(deliveriesSince(beforePurchase, search.id) >= search.followUp!.afterDeliveries);
  for (const state of [beforePurchase, reload(beforePurchase)]) assert.ok(earnedScenes(state, data).includes(search.followUp!.id));
});

test('the funding check fails a preparation of act 2 that its quests fund one coin short, also with an added quest that pays nothing', () => {
  const task = data.tasks.find(value => data.chapters[value.chapter - 1].act === 2)!, at = data.tasks.indexOf(task);
  const funded = (content: typeof data) => {
    const message = questProblems(content).find(problem => problem.startsWith(`${task.id}: the quests before it fund `));
    return message ? Number(/fund (-?\d+) coins/.exec(message)![1]) : null;
  };
  // A cost far above the funding names the funding of the quests before this preparation.
  const probe = structuredClone(data);
  probe.tasks[at].cost += 1_000_000;
  const earned = funded(probe)!;
  assert.ok(earned >= task.cost);
  const short = structuredClone(data);
  short.tasks[at].work.materials += earned + 1 - task.cost;
  short.tasks[at].cost = earned + 1;
  assert.ok(questProblems(short).includes(`${task.id}: the quests before it fund ${earned} coins, less than the ${earned + 1} that the preparations of its act cost.`));
  assert.ok(dataProblems(short).length);
  // A quest with no reward that opens before the preparation funds a negative amount, so the check still fails.
  const core = (id: string) => { const person = data.characters.find(value => value.id === id)!; return !person.visitor && !person.regular && !person.family; };
  const helper = data.quests.find(value => campaignQuest(value, data) && value.act === 2 && requiredQuests(at, data).includes(value) && core(value.character) && !value.holiday && !value.booked)!;
  const unpaid = structuredClone(short);
  unpaid.quests.splice(unpaid.quests.findIndex(value => value.id === helper.id) + 1, 0, { ...structuredClone(helper), id: 'unpaid-favour', reward: 0, followUp: undefined });
  const less = funded(unpaid);
  assert.ok(less !== null && less < earned + 1, `${less}`);
});
