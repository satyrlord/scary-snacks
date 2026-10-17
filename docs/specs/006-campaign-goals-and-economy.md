# 006: Campaign goals and economy

Status: Implemented.
The scope includes preparation budgets, food prices, quest rewards, funding checks, requirement feedback, validated saves, and a legal campaign fixture.
Owner: `PRODUCT.md` for rules; `DESIGN.md` for feedback; `DELIVERY.md` for delivery commands.
The [economy record](../economy.md) gives portions, work scopes, source offers, and assumptions.

## Outcome and scope

A basic ingredient has little value. A prepared dish has a price for its portion and work.
A repair costs more money and effort than writing a menu or repainting a sound sign.
Task position and merge stage do not determine prices.

Keep free immediate production, unlimited energy, no timers, no purchases, and no hidden limits.
Quests earn the coins of the campaign. The game has no sales.

## Implemented economy

1. Each food has an explicit positive menu price. Flour and cornmeal cost 2 coins; elderflowers cost 1.
   The menu value of a quest is the sum of the prices of its portions.
2. Prices follow the item's portion and preparation. They do not have to increase at every merge stage.
   The food table and its reference portions are in the economy record.
3. Every quest pays its menu value. No chapter, character, or visit multiplies a reward.
4. The count of quests in each window makes the quest income cover the preparation costs.
5. The game has no sales. A dish leaves the board only by a merge or a delivery.
6. Each preparation defines its work scope, material or stock allowance, labour allowance,
   and estimated active person-hours. Its price is materials plus labour, independent of task order.
7. One coin uses roughly one Romanian leu as a reference scale. The model uses supplier and service
   prices as references. Work quantities, labour hours, and budget allocations remain authored estimates.
8. A quest that opens after preparation N is necessary for preparation N + 1.
   Each preparation needs its coins and every quest that opens before it.
9. The funding check compares cumulative quest rewards with cumulative preparation costs at each preparation.
   The check includes every quest that opens before that preparation.
   The rewards must cover the costs through that preparation.
   Thus a player who delivers every open quest always has the coins for the next preparation.
10. The engine checks coins, the necessary quests, and source placement together.
    Successful payment spends coins once and advances one preparation. Failure changes nothing.

## Feedback

Story shows current and required coins, and the quests delivered out of the quests that the preparation needs.
Each row says Complete or gives the missing amount. It names a placement blocker.
Pay and Mara's offer use the same engine eligibility result.

Cost details sits beside Pay.
The control opens a dialog or phone sheet with the work scope, material and labour costs, and total price.
The dialog also shows estimated person-hours.
The text states that there is no timer.
Close and Escape return focus to the cost control; phones first restore the Story sheet.
No future source output or unearned room painting appears in this explanation.

## Authored data and save compatibility

`tools/create-original-data.ts` authors item prices, `Task.work`, costs, and quest rewards.
The generator produces `public/data/game.json`.
`economyProblems` validates prices, work fields, half-hour estimates, and the cost sum.
`questProblems` validates the quest order and the funding check.
Content tests also check the reward rule and relative cost relationships.

`taskEligibility` owns readiness. The interface and reducer use it.
The state has no goal counter. Readiness comes from the coins and `completedQuests`.
The [shared save contract](README.md#shared-save-compatibility) applies.
Failed writes preserve the current save and remain recoverable.

## Reproducible balance fixture

Run `node tools/campaign-balance.ts`. `tests/campaign-balance.test.ts` runs the same checks in the full gate.

The fixture starts a new game. It pays each preparation as soon as it is ready.
Otherwise it delivers the first quest that has a ticket. It makes each requested item from the highest output
that its source has earned, and merges up from there. When the board is full, it merges spare food: a pair,
or a match for a blocked ingredient. A full board without such a merge is a deadlock, and the fixture fails.

Each preparation and chapter reports successful actions, takes, merges, deliveries,
quest income, preparation expense, and balance. Preparation records also include work scope
and material and labour budgets. The fixture checks state validity and every coin after each action.

The report measures gameplay effort under one stated policy. It does not measure human play time.

## Acceptance and evidence

- Engine: exact and missing coins, missing quests, source placement, atomic failures, and repeated or final completion.
- Economy: raw ingredients at 1 to 3 coins, explicit prepared-food values, the reward rule, and the rejected sale action.
  The checks cover complete work budgets and relative costs for signs, menus, and repairs.
  They also cover the funding check and invalid authored data.
- Saves: current saves, export and import, failed writes, and malformed data.
- Browser: text requirements, readiness, payment, keyboard focus, cost details, return focus, reload, imports, themes,
  and desktop and phone geometry.
- Full gate: `npm run quality:full` runs typecheck, Node tests, a new build, and Chromium tests.
  Browser coverage uses `/scary-snacks/`; the asset and path check also uses the root path.
- Synthetic reveal saves: `npm run saves:checkpoints` supplies the necessary quests and the exact coins for the next preparation.
  These supplied resources do not constitute balance evidence.

## Later balancing

Rerun the fixture for later economy features. Later balancing must revise an explicit scope, portion,
cost assumption, or reward rate. It must keep the funding check true. It must not restore a task-index
price ladder or a hidden multiplier. No waiting time is part of this economy.
