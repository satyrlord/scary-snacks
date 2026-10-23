import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { finaleQuest, gardenStage, getItem, isSunday, levers, questHoliday, requiredQuests, resolveQuests, storyOrder, supperComplete, supperQuest, takeCost, terraceDay, weather, yearDay } from '../src/model.ts';
import { KEEP_FREE, validateGame } from '../src/engine.ts';
import { BALANCE_SEEDS, runCampaignBalance } from '../tools/campaign-balance.ts';
import type { CampaignAct, CampaignTotals } from '../tools/campaign-balance.ts';
import { checkpointState } from '../tools/create-checkpoint-saves.ts';
import { act, actOneTasks, afterMarch, data, nightLine, player, prologueServed, runs, recovery } from './support.ts';

/** The first efficient run, which checks the state after every action. */
const report = runCampaignBalance(data, BALANCE_SEEDS[0]);
/** The efficient runs for every seed, without the check of the state after every action. Two tests share them. */
let efficient: ReturnType<typeof runs> | undefined;
const efficientRuns = () => efficient ??= runs('efficient');
// The quests that the payments need: every campaign quest of both acts. The March quests of Dochia are not needed, but the efficient
// strategy delivers them in March.
const campaign = requiredQuests(data.tasks.length, data), march = data.quests.filter(quest => quest.march);
const finales = data.finales.map(finale => finaleQuest(finale, data)!);
const endOfMarch = yearDay(3, 31) - data.calendar.start + 1;
const [supperDay, feastDay] = data.finales.map(finale => finale.day);
/** The index of a preparation of act 2 by its number in the act. */
const actTwo = (number: number) => actOneTasks + number - 1;
const day = (date: string) => { const [day, month] = date.split(' ').map(Number); return yearDay(month, day) - data.calendar.start + 1; };
const sundays = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index).filter(day => isSunday(day, data)).length;
/** The share of the merges for repeating quests, as a percentage. */
const share = (repeat: number, merges: number) => `${(100 * repeat / merges).toFixed(1)}%`;

test('the efficient run pays every preparation of both acts, serves both finales, and buys the orchard with no injected coins or items', t => {
  const { totals, finalState, acts } = report;
  assert.equal(finalState.taskIndex, data.tasks.length);
  assert.equal(validateGame(finalState, data), true);
  assert.ok(supperComplete(finalState, data));
  assert.deepEqual(new Set(finalState.completedQuests), new Set([...prologueServed, ...campaign.map(quest => quest.id), ...march.map(quest => quest.id), ...finales.map(quest => quest.id)]),
    'Every prologue quest, campaign quest, March quest, and finale quest.');
  assert.equal(totals.quests, campaign.length + march.length + finales.length + totals.recoveries + totals.repeats, 'Each campaign quest, each March quest, each finale, each recovery tea, and each repeating quest.');
  // Every coin comes from the starting gift, a quest, or a cleared blocker, and goes to a payment, a take, or the upkeep.
  assert.equal(finalState.coins, data.prologue.gift + totals.questCoins + totals.blockerCoins - totals.preparationCoins - totals.takeCoins - totals.upkeepCoins);
  assert.equal(totals.upkeepCoins, Array.from({ length: finalState.clock.day - 1 }, (_, index) => levers(index + 1, data).upkeep).reduce((sum, upkeep) => sum + upkeep, 0), 'Each closing pays the upkeep.');
  // The supper records the result of act 1, and the purchase of the orchard the result of act 2.
  assert.deepEqual(acts.map(account => account.state.clock.day), [supperDay, data.calendar.end]);
  assert.deepEqual(acts[0].state.act1, { purse: acts[0].purse });
  assert.deepEqual(finalState.act1, acts[0].state.act1, 'Act 2 keeps the result of act 1.');
  assert.deepEqual(finalState.act2, { purse: finalState.coins });
  assert.equal(totals.questCoins, [...campaign, ...march].reduce((sum, quest) => sum + quest.reward, 0) + totals.recoveryCoins + totals.repeatCoins);
  assert.equal(totals.preparationCoins, data.tasks.reduce((sum, task) => sum + task.cost, 0));
  // A cleared preparation blocker and a cleared rat hole each give the blocker coin. Each theft makes at most one rat hole.
  const cleared = finalState.resolvedObstacles.length * data.economy.blockerCoin;
  assert.ok(totals.blockerCoins >= cleared && totals.blockerCoins <= cleared + report.nights.thefts * data.economy.blockerCoin);
  assert.ok(totals.takeCoins > 0 && totals.takeCoins <= totals.spawns * data.economy.takeCost);
  // The legal policy reads no scene, so the scenes of the preparations, the chapters, the finales, and the purchase wait in story order.
  const story = storyOrder(data);
  assert.deepEqual(finalState.pendingScenes.filter(id => story.includes(id)), story);
  assert.deepEqual(new Set(finalState.pendingScenes.filter(id => !story.includes(id))),
    new Set([...campaign.map(quest => quest.id), ...march.map(quest => quest.id), ...data.quests.flatMap(quest => quest.followUp ? [quest.followUp.id] : []),
      ...data.characters.flatMap(person => person.arrival ? [`arrival-${person.id}`] : [])]));
  assert.equal(finalState.layoutId, data.board.defaultLayout);
  assert.ok(finalState.preparationObstacles!.placed.length >= 3);
  // After the purchase, the bistro has no other work, so only a repeating quest is open.
  const open = resolveQuests(finalState, data).filter(view => view.status === 'active' || view.status === 'waiting').map(view => view.quest);
  assert.ok(open.length === 1 && open[0].repeating && finalState.repeating?.open === open[0].id, 'Only a saved repeating quest is open after the purchase.');
  t.diagnostic(`${totals.actions} actions, ${totals.spawns} takes, ${totals.merges} merges; ${totals.questCoins} quest coins, ${totals.blockerCoins} blocker coins; ${totals.takeCoins} on takes, ${totals.preparationCoins} on payments, ${totals.upkeepCoins} on upkeep; ${totals.recoveries} recovery teas; ${finalState.coins} remain.`);
});

/** The repeat work of an act: at most a fifth of its merges, and never three days in a row with only repeating work. */
function repeatWork(seed: number, account: CampaignAct, label: string) {
  assert.ok(account.repeatMerges <= account.merges * 0.2, `Seed ${seed}, ${label}: ${account.repeatMerges} of ${account.merges} merges for repeating quests.`);
  assert.ok(!account.repeatDays.some((day, at) => account.repeatDays[at + 2] === day + 2), `Seed ${seed}, ${label}: three days in a row with only repeating work: ${account.repeatDays.join(' ')}.`);
}
/** The balance band: the purse at the end of an act holds 0 to 20% of the spending of the act. */
function band(seed: number, account: CampaignAct, label: string) {
  assert.equal(account.spending, account.totals.preparationCoins + account.totals.takeCoins + account.totals.upkeepCoins);
  assert.ok(account.purse >= 0 && account.purse <= account.spending * 0.2, `Seed ${seed}, ${label}: ${account.purse} coins is outside 0 to 20% of ${account.spending}.`);
}

test('the efficient strategy pays the last preparation of act 1 before the closing of 30 April and serves the supper on 1 May, with the purse in its band and never below zero', t => {
  for (const [seed, run] of efficientRuns()) {
    const { nights, acts } = run;
    assert.equal(nights.lowestPurse, 0, `Seed ${seed}: the purse never goes below zero.`);
    assert.equal(nights.fillerMerges, 0, `Seed ${seed}: no dish only to move the clock.`);
    assert.ok(nights.lanterns > 0, `Seed ${seed}: the lanterns bring the booked guests.`);
    // The calendar: each payment comes on or after the opening of its chapter, and no day of act 1 holds.
    assert.equal(nights.delivered[supperQuest(data)!.id], supperDay, `Seed ${seed}: the supper is on 1 May.`);
    for (const [index, day] of nights.payments.slice(0, actOneTasks).entries()) assert.ok(day >= data.chapters[data.tasks[index].chapter - 1].opens, `Seed ${seed}: ${data.tasks[index].id} waits for its chapter.`);
    assert.ok(nights.payments[actOneTasks - 1] <= supperDay - 1 && !nights.held.some(day => day <= supperDay), `Seed ${seed}: the last preparation comes before the closing of 30 April without the hold.`);
    assert.equal(acts[0].closings, supperDay - 1, `Seed ${seed}: the purse pays the upkeep at each closing.`);
    assert.equal(acts[0].rats, sundays(1, supperDay - 1), `Seed ${seed}: a rat comes on each Sunday night.`);
    repeatWork(seed, acts[0], 'act 1');
    // Each holiday quest on its holiday, each March quest in March, and no outdoor quest that waits more than two rain days. The festival
    // holds 21 June, and its stalls take the tickets first, so a holiday quest of 21 to 24 June can wait up to three days.
    const festival = day('21 6');
    for (const quest of data.quests) {
      const holiday = questHoliday(quest, data), delivered = nights.delivered[quest.id];
      if (holiday && holiday.day >= festival && holiday.day <= festival + 3) assert.ok(delivered >= holiday.day && delivered <= holiday.day + 3, `Seed ${seed}: ${quest.id} on day ${delivered}, in the week of the festival.`);
      else if (holiday) assert.equal(delivered, holiday.day, `Seed ${seed}: ${quest.id} on its holiday.`);
      if (quest.march) assert.ok(delivered <= endOfMarch, `Seed ${seed}: ${quest.id} in March.`);
      if (quest.outdoor && !quest.finale) {
        const from = Math.max(nights.opened[quest.id], data.calendar.terrace.from);
        const waits = Array.from({ length: Math.max(0, delivered - from) }, (_, index) => from + index).filter(day => !terraceDay(day, data) && weather(day, data) !== 'fair').length;
        assert.ok(waits <= 2, `Seed ${seed}: ${quest.id} waits ${waits} days for fair weather.`);
      }
    }
    band(seed, acts[0], 'act 1');
    t.diagnostic(`${nightLine(seed, run, `, free cells ${run.preparations.slice(0, actOneTasks).map(value => value.freeCells).join(' ')}`)} Act 1: purse ${acts[0].purse} of ${acts[0].spending} spent`
      + ` (${share(acts[0].purse, acts[0].spending)}). Payments on days ${nights.payments.slice(0, actOneTasks).join(' ')}. Repeating merges ${share(acts[0].repeatMerges, acts[0].merges)}.`
      + ` Days with only repeating work: ${acts[0].repeatDays.join(' ') || 'none'}.`);
  }
});

test('the efficient strategy keeps the dates of act 2, uses only the hold of the festival, and buys the orchard on 31 August with the purse in its band', t => {
  const ambrozie = ['ambrozie-dinner', 'ambrozie-lunch'];
  for (const [seed, run] of efficientRuns()) {
    const { nights, acts } = run;
    for (const [index, payment] of nights.payments.entries()) {
      const task = data.tasks[index];
      assert.ok(payment >= Math.max(data.chapters[task.chapter - 1].opens, task.opens ?? 1), `Seed ${seed}: ${task.id} waits for its date.`);
    }
    assert.ok(nights.payments[actTwo(12)] <= day('20 6'), `Seed ${seed}: preparation 12 comes before the closing of 20 June.`);
    assert.ok(nights.payments[actTwo(24)] <= day('14 8'), `Seed ${seed}: preparation 24 comes before the closing of 14 August.`);
    assert.equal(nights.payments.at(-1), data.calendar.end, `Seed ${seed}: the orchard is bought on 31 August.`);
    assert.deepEqual(ambrozie.map(id => nights.delivered[id]), [day('12 7'), day('13 7')], `Seed ${seed}: Ambrozie dines on 12 July and lunches on 13 July.`);
    assert.equal(nights.delivered[finales[1].id], feastDay, `Seed ${seed}: the feast is on 15 August.`);
    // Only the festival can use its hold: the later stall quests open one by one on its day.
    assert.deepEqual(nights.held.filter(held => held > supperDay && held !== day('21 6')), [], `Seed ${seed}: the run reaches no held position of act 2 except the festival.`);
    assert.equal(acts[1].closings, data.calendar.end - supperDay, `Seed ${seed}: act 2 pays the upkeep at each closing from 1 May to 30 August.`);
    assert.equal(acts[1].rats, sundays(supperDay, data.calendar.end - 1), `Seed ${seed}: a rat comes on each Sunday night of act 2.`);
    repeatWork(seed, acts[1], 'act 2');
    band(seed, acts[1], 'act 2');
    const late = nights.work.filter(work => work.day > feastDay), lateMerges = late.reduce((sum, work) => sum + work.merges, 0), lateRepeat = late.reduce((sum, work) => sum + work.repeat, 0);
    t.diagnostic(`Seed ${seed}: act 2: purse ${acts[1].purse} of ${acts[1].spending} spent (${share(acts[1].purse, acts[1].spending)}). Payments on days ${nights.payments.slice(actOneTasks).join(' ')}.`
      + ` Repeating merges ${share(acts[1].repeatMerges, acts[1].merges)}, from 16 August ${share(lateRepeat, lateMerges)}. Days with only repeating work: ${acts[1].repeatDays.join(' ') || 'none'}.`
      + ` Held days: ${nights.held.join(' ') || 'none'}.`);
  }
});

test('the run plays the prologue with legal actions, within the merge limits of each event, and starts act 1 with the starting gift', () => {
  assert.deepEqual(report.prologue.map(event => event.event), [1, 2, 3, 4, 5, 6, 7]);
  // The first event serves its first quest with no take, then makes the Bean dip with four takes and four merges.
  assert.deepEqual([report.prologue[0].takes, report.prologue[0].merges], [4, 4]);
  for (const event of report.prologue) assert.ok(event.merges <= 40 && event.freeCells > 0, `Event ${event.event}: ${event.merges} merges.`);
  assert.ok(report.prologue.reduce((sum, event) => sum + event.merges, 0) <= 250);
  assert.deepEqual(report.finalState.completedQuests.slice(0, prologueServed.length).sort(), [...prologueServed].sort());
});

test('the run records the coins, the takes, and the free cells at each payment and each chapter', t => {
  const { totals } = report;
  assert.deepEqual(report.chapters.map(chapter => chapter.chapter), data.chapters.map((_, index) => index + 1));
  assert.deepEqual(report.preparations.map(task => task.id), data.tasks.map(task => task.id));
  let balance = data.prologue.gift;
  for (const chapter of report.chapters) {
    balance += chapter.questCoins + chapter.blockerCoins - chapter.preparationCoins - chapter.takeCoins - chapter.upkeepCoins;
    assert.equal(chapter.balance, balance, `Chapter ${chapter.chapter} records its actual balance.`);
    assert.equal(chapter.preparationCoins, report.preparations.filter(task => task.chapter === chapter.chapter).reduce((sum, task) => sum + task.cost, 0));
  }
  // The chapters and the payments record the same play. The run ends with the purchase, so nothing comes after the last payment.
  const sum = (rows: CampaignTotals[], key: keyof CampaignTotals) => rows.reduce((total, row) => total + row[key], 0);
  for (const key of Object.keys(totals) as (keyof CampaignTotals)[]) {
    assert.equal(sum(report.chapters, key), sum(report.preparations, key), `${key} is the same by chapter and by payment.`);
    assert.equal(sum(report.preparations, key), totals[key], `${key} is fully recorded by payment.`);
  }
  for (const preparation of report.preparations) {
    const authored = data.tasks.find(task => task.id === preparation.id)!;
    assert.deepEqual(preparation.work, authored.work);
    assert.equal(preparation.cost, authored.work.materials + authored.work.labour);
    assert.ok(preparation.balance >= 0);
    assert.ok(Number.isInteger(preparation.freeCells) && preparation.freeCells >= KEEP_FREE && preparation.freeCells <= data.board.initial.length,
      `${preparation.id} leaves room for a recovery tea.`);
  }
  // The accounts of the two acts add up to the totals of the run.
  for (const key of Object.keys(totals) as (keyof CampaignTotals)[]) assert.equal(report.acts.reduce((total, account) => total + account.totals[key], 0), totals[key], key);
  t.diagnostic(`Free cells after each payment: ${report.preparations.map(preparation => preparation.freeCells).join(' ')}.`);
  t.diagnostic(`Take coins by payment: ${report.preparations.map(preparation => preparation.takeCoins).join(' ')}.`);
});

test('the check of the state after every action does not change the efficient run', () => {
  assert.deepEqual(efficientRuns()[0], [BALANCE_SEEDS[0], report]);
});

test('a player who buys a spare staple before each payment repays it with recovery teas and pays every preparation and the orchard', t => {
  const teas: number[] = [];
  for (let count = 0; count < data.tasks.length; count++) {
    // The March quests that opened are delivered, so no other quest is open.
    let state = afterMarch(checkpointState(data, count));
    const task = data.tasks[count], stage = gardenStage(state.taskIndex, data);
    assert.equal(state.coins, task.cost);
    // One spare staple from a paid source leaves the purse short of the payment.
    const paid = state.sources.find(chain => takeCost(getItem(`generator_${chain}`, data)!, data, stage) > 0)!;
    state = act(state, { type: 'spawn', chain: paid });
    assert.equal(state.coins, task.cost - data.economy.takeCost);
    let made = 0;
    while (state.coins < task.cost) {
      const views = resolveQuests(state, data);
      assert.equal(views.find(view => view.quest === recovery)!.status, 'active', `${task.id}: the recovery quest opens.`);
      assert.deepEqual(views.filter(view => !view.quest.recovery && (view.status === 'active' || view.status === 'waiting')).map(view => view.quest.id), [], 'No campaign quest takes a ticket.');
      // One Linden tea from free herbs: Elderflowers merge into Herb bunches, Socată, and tea, with reducer actions only.
      const play = player(state);
      for (const { item, quantity } of recovery.requirements) for (let portion = 0; portion < quantity; portion++) play.produce(item);
      assert.equal(play.state.coins, state.coins, 'The herbs are free.');
      const before = play.state;
      state = act(before, { type: 'deliverQuest', id: recovery.id });
      assert.ok(state.coins > before.coins);
      assert.deepEqual(state.completedQuests, before.completedQuests, 'The recovery quest is never recorded.');
      assert.deepEqual(state.pendingScenes, before.pendingScenes, 'The recovery quest queues no scene.');
      made++;
    }
    assert.equal(resolveQuests(state, data).find(view => view.quest === recovery)!.status, 'locked', `${task.id}: the recovery quest closes.`);
    state = act(state, { type: 'task' });
    assert.equal(state.taskIndex, count + 1);
    teas.push(made);
  }
  t.diagnostic(`Recovery teas before each payment: ${teas.join(' ')}.`);
});

test('the balance tool refuses an unknown strategy, so a typing error never prints the efficient results', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('../tools/campaign-balance.ts', import.meta.url)), 'miss-booking'], { encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Use the strategy efficient, miss-bookings, or debt\./);
  assert.equal(run.stdout, '');
});
