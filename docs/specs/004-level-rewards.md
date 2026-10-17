# 004: Level rewards

Status: Implemented.
Owner: `PRODUCT.md` for progression; `DESIGN.md` for milestone presentation.

## Scope and behavior

Levels use `1 + Math.floor(xp / 100)`. Merges, service, and preparations keep their XP rules. Levels 2 through 10 each offer 20 coins once, under stable IDs `level-2` through `level-10`. The finite schedule gives at most 180 coins. It adds no currency, timers, purchases, or online service.

The House book shows the current level, total XP, progress to the next level, the next reward, and every earned reward. Each earned row shows Claim or Claimed. The House book keeps a copper mark while claims wait. Closing the panel, continuing play, and reloading do not claim rewards.

A new level with a reward opens a level-up dialog once. The dialog shows each available reward with Claim. It waits for other dialogs, stories, and reveals. Close leaves the rewards in the House book. A load, an import, and a change from another tab do not open it. A failed save opens the House book with Retry save.

Each claim adds coins and records its ID in one engine transition. Claims are independent. Unknown, unreached, and repeated claims change no state. A claim that would exceed the supported coin total also changes nothing. That reward stays available after the player spends coins. Rewards give no XP. Levels continue after the finite reward schedule. The panel then states whether rewards remain to claim.

A failed save keeps the claim and coins in memory. The panel states that the session is not saved and offers Retry save. Export includes the session state. Reload can lose unsaved progress. A persistent status region announces a claim once. Claims in the House book move keyboard focus to the level heading. In the level-up dialog, a claim moves focus to the next Claim. The last claim closes the dialog and returns focus to the board, or to the drawer handle when the drawer is lowered.

## Data and saves

`tools/create-original-data.ts` authors `levelRewards`. The entries have unique stable IDs, unique integer levels above one, and positive supported coin amounts. `levelRewardProblems` validates the schedule before generation. `engine.ts` owns eligibility, claims, and save validation. `storage.ts` owns persistence. `app.ts` renders text with `textContent`.

The current state keeps `claimedLevelRewards` with quest progress. Its reward IDs must be unique, known, and earned. Availability comes from XP and this list. There is no second level counter.

Follow [Shared save compatibility](README.md#shared-save-compatibility). Save, load, and import preserve claims and all current progress. A failed write preserves the previous save and offers recovery.

## Acceptance and evidence

The automated checks are in `tests/level-rewards.test.ts`, `tests/engine.test.ts`, `tests/storage.test.ts`, `tests/decorations.test.ts`, and `tests/browser/level-rewards.spec.ts`.

- Engine: level 1, 99/100 XP, every authored boundary, independent and repeated claims, overflow and later retry, full board, unsupported IDs, and unchanged XP sources.
- Saves: no claims, partial claims, all claims, fresh through completed campaigns, corrupt claim lists, repeated loads, failed writes, and export/import identity.
- Browser: the level-up dialog after a merge and after a paid preparation, Claim and Close in the dialog, keyboard claim and focus, exact reward text, persistent availability, non-repeating status, final schedule state, failed save and Retry, export/import/reload, and another tab.
- Layout: fresh production build, Chromium under `/scary-snacks/`, both themes at 1440 by 900, 390 by 844, and 390 by 800; control size, contrast, horizontal overflow, and screenshots.

Run `npm run quality:full` for the integrated result. It runs the type check, Node tests, build, and browser tests. Test results are evidence for the current checkout only.

## Balance measurement and remaining work

The deterministic campaign fixture uses seed 84017. It chooses the order with the least base-stage effort, produces recursively with the highest earned output, and pays as soon as affordable. It claims earned rewards before each campaign step. It adds no coins or items and makes no sales. The fixture reports order income and reward income separately, with actions, merges, orders, XP, and preparation spend. Run `node --test tests/engine.test.ts` for its measurements. Engine execution time is not player time.

Spec 006 owns the rebalance of income, preparation costs, and play effort. The finite reward amount and final rewarded level are balancing inputs. No generator, decoration, or other non-coin reward is part of this implementation.
