# 005: Campaign goals and economy

Status: Implemented.

## Outcome and scope

A basic ingredient has little value. A prepared dish has a price for its staples and its work.
A repair costs more money and effort than a new menu.
A repair also costs more than new paint on a welcome board whose wood is sound.
The position of a preparation does not change a price.
Quests and cleared blockers earn the coins of the campaign.
Spec 012 gives the four levers, the paid takes, the blocker coin, the price formula, and the recovery quest.
The [economy record](../economy.md) gives the price table, the work scopes, the price sources, and the assumptions.

## Economy rules

1. Each dish has a menu price from the formula of spec 012: the paid staples times the take cost, plus the merges times the work rate.
   A source has no price. Flour costs 1 coin. Elderflowers cost nothing. Linden tea costs 14 coins.
   The menu value of a quest is the sum of the prices of its portions.
2. The economy record gives the price of each dish.
3. Every quest except the supper pays its menu value. The supper pays nothing. No quest has a reward multiplier.
4. A take from a paid source spends the take cost. A take from the Herb basket is free. Each cleared blocker gives the blocker coin.
5. A window is the group of quests that open after one preparation. The quests in each window make their work value cover the preparation costs.
6. A dish leaves the board by a merge, a delivery, or a theft at closing (spec 013).
7. Each preparation defines its work scope, material or stock allowance, labour allowance,
   and estimated active person-hours. Its cost is materials plus labour. The order of the preparations does not change the cost.
8. The reference scale is one coin for about one Romanian leu. The model uses supplier and service
   prices as references. Work quantities, labour hours, and budget allocations are authored estimates.
9. A quest that opens after preparation N is necessary for preparation N + 1.
   Each preparation needs its coins and every quest that opens before it.
10. The work value of a quest is the merges of its dishes times the work rate.
    The funding check compares the cumulative work value of the quests with the cumulative preparation costs at each preparation.
    The check includes every quest that opens before that preparation.
    The work value must cover the costs through that preparation.
    The coins that remain after the last preparation must buy the staples of the supper.
    Thus a player who delivers every open quest and buys only its staples always has the coins for the next preparation.
11. The engine checks coins, the necessary quests, and source placement together.
    Successful payment spends coins once and advances one preparation. Failure changes nothing.

## Feedback

Story shows only the requirements still unmet: the extra coins to earn, quests to deliver, or board space to free for a source.
Completed requirements have no row. When every requirement is met, one line says "Ready to prepare."
The accessible description of Pay keeps the exact current and required totals.
Pay and Mara's offer use the same engine eligibility result.

Cost details sits beside Pay.
The disclosure expands below that row inside Story. It shows the work scope, material and labour costs, and total price.
It also shows estimated person-hours and the exact current and required coins, delivered quests, and source space.
The text states that there is no timer.
The control exposes its expanded state and its region. Enter, Space, or a tap toggles it and keeps focus on the control. Pay stays available above the expanded region.
Expansion lasts through redraws of the same preparation. A new preparation starts collapsed. A reload or game replacement clears expansion. Both Story views share the state.
An expanded phone sheet can scroll. Reading or toggling the details changes no game state.
No future source output or unearned room painting appears in this explanation.

## Authored data and save compatibility

`tools/create-original-data.ts` authors the levers, `Task.work`, and the costs.
It computes each menu price with `menuPrice` and each quest reward from those prices.
The generator produces `public/data/game.json`.
`economyProblems` validates the levers, the formula prices, the work fields, the half-hour estimates, and the cost sum.
`questProblems` validates the quest order, the funding check, and the coins for the staples of the supper.
Content tests also check the reward rule and relative cost relationships.

`taskEligibility` owns readiness. The interface and reducer use it.
The state has no goal counter. Readiness comes from the coins and `completedQuests`.
The [shared save contract](README.md#shared-save-compatibility) applies.
A failed write keeps the current save. The player can recover.

## Reproducible balance fixture

Run `node tools/campaign-balance.ts`. `tests/campaign-balance.test.ts` runs the same checks in the full gate.

The fixture starts a new game. It pays each preparation as soon as it is ready.
Otherwise it delivers the booked quest of the evening first.
It lights the lanterns when that meal is ready before 20:00.
Then it delivers the unbooked ticket whose staples cost the least.
It cooks booked meals for later evenings when no other quest remains.
It delivers recovery tea before a quest if the purse cannot buy its staples.
Within 30 merges of closing, it also makes recovery tea if the purse cannot pay the upkeep.
Between quests, it clears the cheapest blocker while fewer than 24 cells are free.
It makes each required dish from spare food on the board, or from stage-one staples, merges, and recipes.
When the board is full, it merges spare food: a pair, a recipe, or a match for a blocked dish.
A full board without such a merge is a deadlock, and the fixture fails.
After the last preparation, the fixture serves the supper.

Each preparation and chapter reports successful actions, takes, merges, deliveries, recovery deliveries,
quest income, blocker income, preparation expense, take expense, upkeep, and balance.
Preparation records also include work scope, material and labour budgets, and free cells.
The report gives the purse after the supper and the coins spent on preparations, takes, and upkeep.
The purse after the supper must be inside the balance band of spec 012: 0 to 10% of those coins.
The fixture checks state validity and every coin after each action.

The report measures gameplay effort under one stated policy. It does not measure human play time.

## Acceptance and evidence

- Engine: exact and missing coins, missing quests, source placement, atomic failures, and repeated or final completion.
  Paid takes, free takes from the Herb basket, takes with a short purse, and the blocker coin.
- Economy: the levers, the formula prices, and the reward rule.
  The checks cover complete work budgets and relative costs for signs, menus, and repairs.
  They also cover the funding check, the recovery quest, and invalid authored data.
- Saves: current saves, export and import, failed writes, and malformed data.
- Browser: text requirements, readiness, payment from expanded details, keyboard toggling and focus, inline cost details, phone scrolling, reload, imports, themes,
  and desktop and phone geometry.
- Synthetic reveal saves: `npm run saves:checkpoints` supplies the necessary quests and the exact coins for the next preparation.
  After the last preparation, the supplied coins buy the staples of the supper.
  These supplied resources are not balance evidence.

## Economy changes

Rerun the fixture after an economy change. The change must revise a lever, a work scope,
a cost assumption, or a quest. It must keep the funding check true and the purse after the supper inside the balance band.
Costs must not rise with the position of a preparation.
