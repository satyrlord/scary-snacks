import test from 'node:test';
import assert from 'node:assert/strict';
import { bookedTonight, menuPrice, requiredQuests, resolveQuests, supperQuest, unresolvedObstacle } from '../src/model.ts';
import { dataProblems, questProblems } from '../src/content.ts';
import type { GameState } from '../src/model.ts';
import { afterMarch, act, checkpoint, data, deliver, payNext, quest, ready, rejected, recovery, status, supperEvening, supply, validate } from './support.ts';

const cycle = data.quests.filter(value => value.repeating);
const open = (state: GameState) => resolveQuests(state, data).filter(view => view.status === 'active' || view.status === 'waiting').map(view => view.quest.id);
/**
 * After preparation 8, the player delivers the unbooked quests of the window and serves tonight's guest. The guest's next quest
 * opens. The player cooks each booked meal for a later evening, and the merge of the last portion removes the last work of the bistro.
 */
function idle(): GameState {
  let state = payNext(checkpoint(7));
  for (;;) {
    const next = resolveQuests(state, data).find(view => view.status === 'active' && !view.quest.recovery && (!view.quest.booked || bookedTonight(state, view.quest)));
    if (!next) break;
    state = deliver(state, next.quest.id);
  }
  const booked = resolveQuests(state, data).filter(view => view.status === 'active' && view.quest.booked).map(view => view.quest);
  const [last, ...others] = booked;
  for (const value of others) state = supply(state, value.id);
  // Every portion of the last meal is on the board except one, whose two parts wait for their merge.
  state = supply(state, last.id);
  const { item: portion, quantity } = last.requirements[0], item = data.items[portion];
  const [first, second] = item.recipe ?? [`${item.chain}_${item.stage - 1}`, `${item.chain}_${item.stage - 1}`];
  // Spare copies of the dish leave the board, so the meal has exactly its portions.
  const copies = state.board.flatMap((cell, index) => cell?.code === portion ? [index] : []);
  for (const index of copies.slice(quantity * booked.filter(value => value.requirements.some(need => need.item === portion)).length)) state.board[index] = null;
  const at = copies[0];
  state.board[at] = { code: first };
  const free = state.board.findIndex((cell, index) => !cell && !unresolvedObstacle(state, index, data));
  state.board[free] = { code: second };
  assert.equal(status(state, 'sorin-staff-meal'), 'locked', 'The missing portion is work.');
  return act(state, { type: 'move', from: free, to: at });
}

test('the merge that removes the last work opens the first repeating quest and saves it', () => {
  const state = idle();
  assert.equal(state.repeating?.open, 'sorin-staff-meal');
  assert.equal(status(state, 'sorin-staff-meal'), 'active');
  assert.ok(open(state).every(id => quest(id).repeating || quest(id).booked), 'Only booked meals for a later evening wait.');
  assert.ok(quest('sorin-staff-meal').requirements.every(({ item }) => state.discovered.includes(item)), 'The ticket puts its dishes in the recipe book.');
});

test('work, a payment, and the recovery quest each keep a repeating quest closed, and an open one stays open', () => {
  const unsaved = (state: GameState): GameState => { const copy = structuredClone(state); delete copy.repeating; return copy; };
  const state = idle();
  assert.equal(status(unsaved(state), 'sorin-staff-meal'), 'active');
  assert.ok(open(checkpoint(0)).every(id => !quest(id).repeating), 'A new game has work.');
  // A booked meal for another evening with a missing portion has work.
  const later = open(state).find(id => quest(id).booked)!;
  const missing = unsaved(state);
  missing.board[missing.board.findIndex(cell => cell?.code === quest(later).requirements[0].item)] = null;
  assert.equal(status(missing, 'sorin-staff-meal'), 'locked');
  // A preparation that is ready to pay.
  assert.equal(status(ready(unsaved(state)), 'sorin-staff-meal'), 'locked');
  // The recovery quest has work while it is open.
  const short = { ...unsaved(state), coins: 0 };
  assert.equal(status(short, recovery.id), 'active');
  assert.equal(status(short, 'sorin-staff-meal'), 'locked');
  // The saved quest stays open until its delivery.
  const kept = structuredClone(state);
  kept.board[kept.board.findIndex(cell => cell?.code === quest(later).requirements[0].item)] = null;
  assert.equal(status(kept, 'sorin-staff-meal'), 'active');
});

test('an open repeating ticket from a save without its record stays open when a booked portion is used', () => {
  const state = idle();
  delete state.repeating;
  assert.equal(validate(state), true);
  assert.equal(status(state, 'sorin-staff-meal'), 'active');
  rejected(state, { type: 'deliverQuest', id: 'sorin-staff-meal' });
  assert.equal(state.repeating, undefined, 'A failed action does not add the record.');
  const portion = resolveQuests(state, data).filter(view => view.status === 'active' && view.quest.booked)
    .flatMap(view => view.quest.requirements).find(({ item }) => data.items[item].next && state.board.filter(cell => cell?.code === item).length >= 2)!;
  const [from, to] = state.board.flatMap((cell, index) => cell?.code === portion.item ? [index] : []);
  const next = act(state, { type: 'move', from, to });
  assert.deepEqual(next.repeating, { last: null, open: 'sorin-staff-meal' });
  assert.equal(status(next, 'sorin-staff-meal'), 'active');
});

test('a repeating delivery pays its menu value, records nothing, and opens the next quest of the cycle in the same change', () => {
  let state = idle();
  const staff = quest('sorin-staff-meal');
  assert.equal(staff.reward, staff.requirements.reduce((sum, { item, quantity }) => sum + menuPrice(item, data) * quantity, 0));
  const before = state;
  state = act(supply(state, staff.id), { type: 'deliverQuest', id: staff.id });
  assert.equal(state.coins, before.coins + staff.reward);
  assert.deepEqual(state.completedQuests, before.completedQuests);
  assert.deepEqual(state.pendingScenes, before.pendingScenes);
  assert.ok(!requiredQuests(data.tasks.length, data).some(value => value.repeating), 'No preparation needs a repeating quest.');
  // Bela follows his campaign quest, which the player delivered in chapter 1.
  assert.deepEqual(state.repeating, { last: staff.id, open: 'bela-cold-night' });
  state = act(supply(state, 'bela-cold-night'), { type: 'deliverQuest', id: 'bela-cold-night' });
  // Cezar follows a campaign quest after preparation 16, so the cycle skips him. Ana's pickles come while the pickle barrel is on the board.
  assert.equal(state.completedQuests.includes(quest('cezar-before-rounds').afterQuest!), false);
  assert.deepEqual(state.repeating, { last: 'bela-cold-night', open: 'ana-pickles' });
  assert.deepEqual(cycle.map(value => value.id), ['sorin-staff-meal', 'bela-cold-night', 'cezar-before-rounds', 'ana-pickles', 'ilie-lenten-bowl', 'victor-nettles', 'costel-tower-tea']);
});

test('a campaign quest takes the ticket of a repeating quest, which waits and gets a ticket again', () => {
  let state = idle();
  const later = open(state).find(id => quest(id).booked)!;
  // The next payment opens the quests of a new window. They take the tickets first.
  state = act(ready(state), { type: 'task' });
  assert.equal(state.repeating?.open, 'sorin-staff-meal');
  assert.equal(status(state, 'sorin-staff-meal'), 'waiting');
  for (let turn = 0; turn < 20 && status(state, 'sorin-staff-meal') === 'waiting'; turn++) {
    const next = resolveQuests(state, data).find(view => view.status === 'active' && !view.quest.repeating && !view.quest.recovery && view.quest.id !== later && !view.quest.march)!;
    state = deliver(state, next.quest.id);
  }
  assert.equal(status(state, 'sorin-staff-meal'), 'active');
  assert.equal(state.repeating?.open, 'sorin-staff-meal');
});

test('the repeating quests do not change the two cases of the recovery quest', () => {
  // Another quest is open and the purse is short: the recovery quest opens beside a saved repeating quest.
  assert.equal(status({ ...idle(), coins: 5 }, recovery.id), 'active');
  // After the supper, no quest of act 1 is open, and the first preparation of act 2 needs coins: a short purse opens the recovery quest.
  // A repeating quest is not another quest.
  const supper = supperQuest(data)!, after = act(supply({ ...afterMarch(supperEvening()), coins: 1000 }, supper.id), { type: 'deliverQuest', id: supper.id });
  assert.equal(status(after, recovery.id), 'locked');
  assert.equal(status({ ...after, coins: 0, repeating: { last: null, open: null } }, recovery.id), 'active');
});

test('after the supper, the repeating quests continue, the clock runs on into act 2, and the result of act 1 stays', () => {
  const supper = supperQuest(data)!;
  let state = act(supply({ ...afterMarch(supperEvening()), coins: 1000 }, supper.id), { type: 'deliverQuest', id: supper.id });
  const result = state.act1, clock = state.clock;
  assert.equal(state.repeating?.open, 'sorin-staff-meal');
  state = act(supply(state, 'sorin-staff-meal'), { type: 'deliverQuest', id: 'sorin-staff-meal' });
  assert.equal(state.repeating?.open, 'bela-cold-night');
  assert.deepEqual(state.act1, result);
  assert.deepEqual(state.clock, clock, 'A delivery moves no clock.');
});

test('the data check rejects a large or broken repeating quest and a cycle that cannot start with act 1', () => {
  assert.deepEqual(questProblems(data), []);
  const change = (edit: (content: typeof data) => void) => { const content = structuredClone(data); edit(content); return dataProblems(content).join(' '); };
  const staff = (content: typeof data) => content.quests.find(value => value.id === 'sorin-staff-meal')!;
  assert.match(change(content => Object.assign(staff(content), { requirements: [{ item: 'grain_6', quantity: 1 }], reward: content.items.grain_6.price })), /at most 15 merges/);
  assert.match(change(content => Object.assign(staff(content), { requirements: [{ item: 'grain_3', quantity: 3 }], reward: content.items.grain_3.price * 3 })), /more than one meal/);
  assert.match(change(content => {
    const value = staff(content);
    value.character = 'dochia';
    delete value.companions;
    value.requirements = [{ item: 'corn_4', quantity: 1 }, { item: 'grain_1', quantity: 3 }];
    value.reward = value.requirements.reduce((sum, { item, quantity }) => sum + content.items[item].price * quantity, 0);
  }), /more than one meal/, 'A character who orders campaign provisions still gets one meal in a repeating quest.');
  assert.match(change(content => { delete content.quests.find(value => value.id === 'cezar-before-rounds')!.afterQuest; }), /cezar-before-rounds: .* more than one merge beyond/);
  assert.match(change(content => { staff(content).afterQuest = 'cezar-castle-lights'; }), /join the cycle at the start of act 1/);
  assert.match(change(content => { staff(content).afterQuest = 'cezar-long-night'; }), /invalid repeating quest/, 'A repeating quest follows a campaign quest of act 1.');
  assert.match(change(content => { staff(content).afterQuest = 'unknown'; }), /invalid repeating quest/);
  assert.match(change(content => { staff(content).companions = ['nobody']; }), /invalid companions/);
  assert.match(change(content => { content.quests = content.quests.filter(value => !value.repeating || ['sorin-staff-meal', 'bela-cold-night'].includes(value.id)); }), /at least three repeating quests/);
});

test('a save keeps the repeating record, loads without it, and rejects a broken one', () => {
  const state = idle();
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
  assert.equal(validate(JSON.parse(JSON.stringify(state))), true);
  const missing = structuredClone(state);
  delete missing.repeating;
  assert.equal(validate(missing), true, 'A save from before the feature loads.');
  for (const repeating of [{ last: null }, { last: null, open: 'mara-welcome' }, { last: 'unknown', open: null }, { last: null, open: 'cezar-before-rounds' }, null]) {
    assert.equal(validate({ ...state, repeating }), false, JSON.stringify(repeating));
  }
  // A failed delivery changes nothing.
  rejected(state, { type: 'deliverQuest', id: 'sorin-staff-meal' });
});
