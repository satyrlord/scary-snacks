# 004: Level rewards

Status: Implemented. Human balance assessment remains open.
Owner: `PRODUCT.md` for progression; `DESIGN.md` for milestone presentation.

## Scope and behavior

Levels use `1 + Math.floor(xp / 100)`. Merges, service, and preparations keep their XP rules. Levels 2 through 10 each offer 20 coins once, under stable IDs `level-2` through `level-10`. The finite schedule gives at most 180 coins. It adds no currency, timers, purchases, or online service.

The House book shows the current level, total XP, progress to the next level, the next reward, and every earned reward. Each earned row shows Claim or Claimed. The House book keeps a copper mark while claims wait. Closing the panel, continuing play, and reloading do not claim rewards.

Each claim adds coins and records its ID in one engine transition. Claims are independent. Unknown, unreached, and repeated claims change no state. A claim that would exceed the supported coin total also changes nothing. That reward stays available after the player spends coins. Rewards give no XP. Levels continue after the finite reward schedule. The panel then states whether rewards remain to claim.

A failed save keeps the claim and coins in memory. The panel states that the session is not saved and offers Retry save. Export includes the session state. Reload can lose unsaved progress. A persistent status region announces a claim once. Claims move keyboard focus to the level heading.

## Data and saves

`tools/create-original-data.ts` authors `levelRewards`. The entries have unique stable IDs, unique integer levels above one, and positive supported coin amounts. `levelRewardProblems` validates the schedule before generation. `engine.ts` owns eligibility, claims, and save validation. `storage.ts` owns persistence. `app.ts` renders text with `textContent`.

The current state version 6 keeps `claimedLevelRewards` with quest progress. Its reward IDs must be unique, known, and earned. Availability comes from XP and this list. There is no second level counter.

Envelope version 5 uses `scary-snacks-save-v5`. Valid state-4 saves convert through state 5 with an empty claim list, then to state 6. Existing state-5 claims stay. Earlier supported states convert through each validated step. Existing XP enables retroactive claims; conversion grants no coins. Later loads do not reset claims. Conversion preserves items, orders, coins, XP, preparations, counters, pantry positions, and existing choices.

Load and import use the same conversion chain. The newest existing key controls load. Invalid newer data never restores older progress. A failed conversion or write preserves all older bytes and offers recovery. See [Shared save compatibility](README.md#shared-save-compatibility).

## Acceptance and evidence

The automated checks are in `tests/level-rewards.test.ts`, `tests/engine.test.ts`, `tests/storage.test.ts`, `tests/decorations.test.ts`, and `tests/browser/level-rewards.spec.ts`.

- Engine: level 1, 99/100 XP, every authored boundary, independent and repeated claims, overflow and later retry, full board and pantry, unsupported IDs, and unchanged XP sources.
- Saves: no claims, partial claims, all claims, all supported conversions, fresh through completed campaigns, corrupt claim lists, repeated loads, failed writes, unchanged older bytes, and export/import identity.
- Browser: keyboard claim and focus, exact reward text, persistent availability, non-repeating status, final schedule state, failed save and Retry, older saves, export/import/reload, and another tab.
- Layout: fresh production build, Chromium under `/scary-snacks/`, both themes at 1440 by 900, 390 by 844, and 390 by 800; control size, contrast, horizontal overflow, and screenshots.

Run `npm run quality:full` for the integrated result. It runs the type check, Node tests, build, and browser tests. Test results are evidence for the current checkout only. Physical touch and assistive technology remain manual checks.

## Balance measurement and remaining work

The deterministic campaign fixture uses seed 84017. It chooses the order with the least base-stage effort, produces recursively with the highest earned output, and pays as soon as affordable. It claims earned rewards before each campaign step. It adds no coins or items and makes no sales. The fixture reports order income and reward income separately, with actions, merges, orders, XP, and preparation spend. Run `node --test tests/engine.test.ts` for its measurements. Engine execution time is not player time.

Spec 006 owns the rebalance of income, preparation costs, and play effort. Human early and late campaign sessions must judge whether 20 coins per level fits that balance. The finite reward amount and final rewarded level are balancing inputs, not accepted human pacing measurements. No generator, decoration, or other non-coin reward is part of this implementation.
