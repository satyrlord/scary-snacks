# 006: Campaign goals and economy

Status: Implemented work-based budgets and goals, explicit food prices, requirement feedback,
validated saves, and legal campaign comparisons.
Owner: `PRODUCT.md` for rules; `DESIGN.md` for feedback; `README.md` for delivery commands.
The [economy record](../economy.md) gives portions, work scopes, source offers, and assumptions.

## Outcome and scope

A basic ingredient has little value. A prepared dish has a price for its portion and work.
A repair costs more money and effort than writing a menu or repainting a sound sign.
Task position and merge stage do not determine prices.

Keep free immediate production, unlimited energy, no timers, no purchases, and no hidden limits.
Sales remain a way to clear space. Serving and merging remain necessary for campaign progress.

## Implemented economy

1. Each food has an explicit positive menu price. Flour and cornmeal cost 2 coins; elderflowers cost 1.
   New ordinary orders pay the sum of their required food prices, with no flat bonus.
2. Prices follow the item's portion and preparation. They do not have to increase at every merge stage.
   The food table and its reference portions are in the economy record.
3. A clearance sale gives one quarter of the menu price, rounded down, with a minimum of one coin.
   This is a game rule. It does not claim a real resale price. Sources cannot be sold.
4. Each preparation defines its work scope, material or stock allowance, labour allowance,
   and estimated active person-hours. Its price is materials plus labour, independent of task order.
5. One coin uses roughly one Romanian leu as a reference scale. The model uses supplier and service
   price anchors. Work quantities, labour hours, and budget allocations remain authored estimates.
6. Each half person-hour adds one served order and two merges to the cumulative campaign targets.
   This converts work scale into play effort. It is not measured player time or a waiting period.
7. Counters are independent lifetime totals. They carry across chapters and are never spent.
   Existing excess service and merges count toward future preparations.
8. The engine checks coins, both goals, any named quest prerequisite, and source placement together.
   Successful payment spends coins once and advances one preparation. Failure changes nothing,
   including seed, rewards, orders, counters, and source entitlements.
9. One successful ordinary service adds one service. One valid merge adds one merge.
   Generation, clearance, moves, swaps, failures, and story replay give no goal credit.
   Quest delivery gives no ordinary service credit.
10. Existing completed preparations stay complete, even with zero counters.
    Only remaining preparations must meet their requirements.
11. All three ordinary orders keep their quotes and remain achievable. Quest references reject unknown
    IDs and cycles. The authored character quests remain optional.
12. Level rewards still offer 180 coins in total. Quest rewards keep their authored amounts.
    The balance fixture includes both income sources rather than treating ordinary service in isolation.

## Feedback

Story shows current and required coins, total orders served, and total merges.
Each row says Complete or gives the missing amount. It names a required quest or placement blocker.
Pay and Mara's offer use the same engine eligibility result.

Cost details sits beside Pay. It opens a dialog or phone sheet with the current work scope,
material and labour costs, total price, and estimated person-hours. The text states that there is no timer.
Close and Escape return focus to the cost control; phones first restore the Story sheet.
No future source output or unearned room painting appears in this explanation.

## Authored data and save compatibility

`tools/create-original-data.ts` authors item prices, `Task.work`, costs, and cumulative `Task.goals`.
The generator produces `public/data/game.json`.
`economyProblems` validates prices, work fields, half-hour estimates, and the cost sum.
`taskGoalProblems` validates supported nonnegative integers and nondecreasing goals.
Content tests also check the authored cumulative work conversion and relative cost relationships.

`taskEligibility` owns readiness. The interface and reducer use it.
No new spendable goal currency is added. The saved `served` and `merges` remain authoritative.
Validation never compares completed preparations with new goals and never invents missing counters.

Each order requires `pricing: 'menu-1'` and the exact sum of its item menu prices.
Missing, unknown, null, and explicitly undefined markers are invalid.
Saved requirements, customers, rewards, and order IDs stay unchanged through reload.
The [shared save contract](README.md#shared-save-compatibility) applies.
Failed writes preserve the current save and remain recoverable.

## Reproducible balance fixture

Run `node tools/campaign-balance.ts`. It emits four runs at seed 84017.
`tests/campaign-balance.test.ts` runs the same checks in the full gate.

The scenarios are fresh play with no optional rewards, and fresh play with all level rewards and quests.
Each scenario runs with the fewest-ingredients policy and the best-income policy.

Each preparation and chapter reports successful actions, takes, merges, service, sales, quest
and level claims, income by source, expense, balance, XP, and cumulative counters.
Current preparation records also include work scope and material and labour budgets.

Both policies use the highest suitable earned source output. One selects the smallest ingredient
requirement. The other selects the highest quoted income per take, merge, and service action.
Both use deterministic tie breaks. State validity, every coin, and the three waiting orders are
checked after each action. Each finale order is then served; these actions are reported separately.

The report measures gameplay effort under stated policies.

## Acceptance and evidence

- Engine: exact and excess goals, missing coins, source placement, atomic failures, repeated/final
  completion, zero-service sales, zero-merge service, and action credit.
- Economy: raw ingredients at 1 to 3 coins, explicit prepared-food values, no order bonus,
  clearance values, complete work budgets, relative sign/menu/repair costs, and invalid authored data.
- Saves: current saves, exact saved quotes and payouts,
  unchanged random sequence, unknown markers, damaged rewards, export/import, failed writes,
  zero-counter completed preparations, and partial goals.
- Browser: text requirements, readiness, payment, keyboard focus, saved quotes, raw food payouts,
  cost details, return focus, reload, imports, themes, and desktop/phone geometry.
- Full gate: `npm run quality:full` runs typecheck, Node tests, a new build, and Chromium tests.
  Browser coverage uses `/scary-snacks/`; the asset/path check also uses the root path.
- Synthetic reveal saves: `npm run saves:checkpoints` supplies exact next goals and coins.
  These supplied resources do not constitute balance evidence.

## Later balancing

Rerun the fixture for later economy features, including board clearing. Later balancing must revise
an explicit scope, portion, cost assumption, or play conversion. It must not restore a task-index
price ladder or a hidden multiplier. No waiting time is part of this economy.
