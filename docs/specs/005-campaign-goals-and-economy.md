# 005: Campaign goals and economy

Status: Implemented.

## Outcome and scope

A basic ingredient has little value. A prepared dish has a price for its portion and work.
A repair costs more money and effort than a new menu.
A repair also costs more than new paint on a welcome board whose wood is sound.
Task position and merge stage do not determine prices.
Quests earn the coins of the campaign.
The [economy record](../economy.md) gives the portions, the work scopes, the price sources, and the assumptions.

## Economy rules

1. Each food has an explicit positive menu price. Flour and cornmeal cost 2 coins each. Elderflowers cost 1 coin.
   The menu value of a quest is the sum of the prices of its portions.
2. Prices follow the item's portion and preparation. They do not have to increase at every merge stage.
   The food table and its reference portions are in the economy record.
3. Every quest pays its menu value.
4. A window is the group of quests that open after one preparation. The number of quests in each window makes the quest income cover the preparation costs.
5. A dish leaves the board only by a merge or a delivery.
6. Each preparation defines its work scope, material or stock allowance, labour allowance,
   and estimated active person-hours. Its cost is materials plus labour. The order of the preparations does not change the cost.
7. The reference scale is one coin for about one Romanian leu. The model uses supplier and service
   prices as references. Work quantities, labour hours, and budget allocations are authored estimates.
8. A quest that opens after preparation N is necessary for preparation N + 1.
   Each preparation needs its coins and every quest that opens before it.
9. The funding check compares cumulative quest rewards with cumulative preparation costs at each preparation.
   The check includes every quest that opens before that preparation.
   The rewards must cover the costs through that preparation.
   Thus a player who delivers every open quest always has the coins for the next preparation.
10. The engine checks coins, the necessary quests, and source placement together.
    Successful payment spends coins once and advances one preparation. Failure changes nothing.

## Feedback

Story shows the current coins and the required coins. It also shows how many of the necessary quests the player delivered.
Each row says "Complete" or gives the missing amount, for example "Need 2". A row names a placement blocker.
Pay and Mara's offer use the same engine eligibility result.

Cost details sits beside Pay.
The control opens a dialog or phone sheet with the work scope, material and labour costs, and total price.
The dialog also shows estimated person-hours.
The text states that there is no timer.
Close and Escape return focus to the cost control. On phones, they first restore the Story sheet.
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
A failed write keeps the current save. The player can recover.

## Reproducible balance fixture

Run `node tools/campaign-balance.ts`. `tests/campaign-balance.test.ts` runs the same checks in the full gate.

The fixture starts a new game. It pays each preparation as soon as it is ready.
Otherwise it delivers the first quest that has a ticket. It makes each item that the quest needs from stage-one ingredients
and merges up from there. When the board is full, it merges spare food: a pair,
or a match for a blocked ingredient. A full board without such a merge is a deadlock, and the fixture fails.

Each preparation and chapter reports successful actions, takes, merges, deliveries,
quest income, preparation expense, and balance. Preparation records also include work scope
and material and labour budgets. The fixture checks state validity and every coin after each action.

The report measures gameplay effort under one stated policy. It does not measure human play time.

## Acceptance and evidence

- Engine: exact and missing coins, missing quests, source placement, atomic failures, and repeated or final completion.
- Economy: explicit positive prices and the reward rule.
  The checks cover complete work budgets and relative costs for signs, menus, and repairs.
  They also cover the funding check and invalid authored data.
- Saves: current saves, export and import, failed writes, and malformed data.
- Browser: text requirements, readiness, payment, keyboard focus, cost details, return focus, reload, imports, themes,
  and desktop and phone geometry.
- Synthetic reveal saves: `npm run saves:checkpoints` supplies the necessary quests and the exact coins for the next preparation.
  These supplied resources are not balance evidence.

## Economy changes

Rerun the fixture after an economy change. The change must revise an explicit scope, portion,
cost assumption, or menu price. It must keep the funding check true. Costs must not rise with the position
of a preparation.
