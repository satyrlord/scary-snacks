# Verification

The board-access browser tests cover keyboard and touch sale and full-board swaps, invalid swap destinations, cancellation, opaque state contrast, and the Actions menu geometry. The source-access browser tests cover tap and keyboard ordering in Options and drag cancellation without a trailing take.

## Gate

`npm run quality:full` is the full gate. The gate runs these steps in order:

1. The type check.
2. The dead-code check with Fallow.
3. The Node.js tests.
4. The build.
5. The Playwright browser tests on Chromium, against the build.

The browser tests use 40% of the logical processors. Each test has its own browser context and save.
The full browser suite runs under `/scary-snacks/`, the GitHub Pages path.
The asset and path test also runs at the root path.
`playwright.config.ts` controls these settings.

`tests/browser/browser-launch.spec.ts` checks the effective Chromium launch arguments. On Windows, the launch must keep every default disabled feature and add only `TcpPortRandomizationWin`. The test also reports when Playwright supplies that workaround itself. Other operating systems must keep the default feature list and have no custom launch arguments. `DELIVERY.md` gives the removal rule for the temporary workaround.

[`DELIVERY.md`](../DELIVERY.md) gives the checks of the Pages workflow.

## Result

This file describes test coverage. This file does not record a test result.
Run `npm run quality:full` to get the result for the current checkout.
Build the game before a separate browser test run.
The browser tests serve `dist/` and do not build the game.

## Node.js coverage

The files in `tests/` check these areas.

| Test files | Coverage |
| --- | --- |
| `engine.test.ts` | Stage-1 production, chain merges, mixed merges in both directions, a three-chain dish from ingredients, swaps, and refused pairs. Preparation payment, room states, and game data validation. The validation includes chain lengths, recipe depth, recipe pairs, chain counts, and tags. |
| `storage.test.ts` | Save validation, size limits, export, import, reset, failed writes, recovery, and invalid data. Unsupported versions that stay unchanged, the served supper, and the rejected recovery quest record. |
| `decorations.test.ts` | Decoration slots, quest unlocks, finish choices, rejected choices, and saved choices. |
| `economy.test.ts` | Formula prices, paid and free takes, a take without the coins, and the recovery quest after the last preparation. One Linden tea in four free cells, and work budgets. |
| `campaign-goals.test.ts` | Required quests, coins, a new source on a full board, failed payments, quest order, the supper and recovery quest records, and sufficient campaign work. |
| `campaign-balance.test.ts` | Both acts through valid actions, with separate accounts for coins, upkeep, and repeating work. The efficient strategy for 20 seeds keeps each act inside its balance band and reaches no held position except the festival. The check covers the orchard date, free cells at each payment, and recovery before each payment. |
| `campaign-missed-bookings.test.ts` | For 20 seeds, a strategy that misses each booking without a fixed evening once finishes both acts. The strategy delivers repeating quests while the bistro has no work. |
| `campaign-debt.test.ts` | For 20 seeds, a strategy starts each preparation window with a debt of 20 coins. The strategy reaches each preparation through the recovery quest. |
| `day.test.ts` | The clock, the closing order, the thief rat and its seed, and rat holes. Șoricescu's gift, the gift space and the recovery quest, debt, and the evening guest. Booked tickets, the lantern control, and the result of act 1. The day levers and the booked quests, and saves of the day fields. |
| `calendar.test.ts` | Dates, chapter openings, holidays, weather, seasonal sources, outdoor quests, the held days, bookings, and saved calendar progress. |
| `act-change.test.ts` | The clock of act 2, the change after the supper, unread scenes and March quests, the news of Mina and Avram, and the funding check of act 2. |
| `held-days.test.ts` | Release requirements, ticket order, discovery, late players, debt recovery on each held day, Ambrozie's fixed evening, and the feast. |
| `garden.test.ts` | Garden sources, free takes, prices at each garden stage, paid pickles, and retention of a seasonal source. |
| `festival.test.ts` | The five stall quests, their order, the festival hold, and the festival painting. |
| `hail.test.ts` | Hail placement, the queue, free cells, and saved blocker history. |
| `piper.test.ts` | Four Sunday closings without the thief rat, weekday counts, and saved piper progress. |
| `orchard.test.ts` | The purchase date, required quests, the result of act 2, the stopped clock, and rejection of an unaffordable orchard in the efficient check. |
| `save-compatibility.test.ts` | Fixed current-format saves through load, import, export, and continued play. Earlier formats fail without a change to the current save. |
| `quests.test.ts` | Quest data, three tickets and the recovery ticket, authored order, delivery requirements, and failed deliveries. The coin limit on delivery, visitor order, cathedral sizes, and one-meal sizes. The one-merge rule for quest dishes, diets, favourites, and the supper plates. |
| `guests.test.ts` | Red wine quests, Ionatan's dinner and journal entry, the shared vegetarian meal, visitor departure, and later local news. |
| `regulars.test.ts` | Arrival pairs, arrival scenes, quest timing, favourite dishes, diets, the neighbours list, and cast validation. |
| `repeating.test.ts` | The work rule, the cycle order, the ticket after the campaign quests, repeating deliveries, the recovery cases, play after the supper, the data checks, and the saved record. |
| `board-clearing.test.ts` | Initial blockers, matching merges, recipe partners, the blocker coin, blocked actions, the free cells that placement keeps, discoveries, and saved progress. |
| `preparation-blockers.test.ts` | Preparation batches, deferred placement, four free cells, a new source that leaves the cells to its batch, saved history, failed writes, and retry. |
| `story.test.ts` | Chapters, scenes, source openings, the served supper, the finale, queues, failed payments, and play after the finale. |
| `checkpoint-saves.test.ts` | Manual checkpoint saves, the next payment, and the final scenes. |
| `assets.test.ts` | Masters, variants, hashes, occupied and unused food cells, portrait cells, blocker cells, references, asset paths, fonts, and license texts. |
| `image-variants.test.ts` | Reuse of unchanged variants and fresh encoding after changes to masters, files, widths, cell positions, grids, or encoder settings. |
| `build.test.ts` | The build file list, type removal, executable asset rejection, and linked directory rejection. |
| `server.test.ts` | Allowed paths, configured server addresses, and Windows path case. |
| `source-export.test.ts` | Product test coverage in the export, exported imports, document links, local folder exclusions, and ignore rules. The dead-code command of the export. |
| `art-image.test.ts` | Art generation request fields, image dimensions, masks, composites, paper copies and patches, and rejected inputs. |

Generator checks cover stage-1 production, paid and free takes, and a full board.
The efficient campaign fixture completes all 48 preparations, the 190 campaign quests of both acts, and the five March quests without injected coins or items.
It serves both finales and buys the orchard on 31 August.
The purse at the end of each act is inside the balance band.
The balance band is 0 to 20% of the coins that the fixture spent in that act on preparations, takes, upkeep, and the orchard.
The fixture checks 20 seeds. Act 1 has 75 closings and 11 Sunday rat visits. Act 2 has 122 closings and 17 Sunday rat visits. The day tests also check theft with given seeds.
Each holiday quest is delivered on its holiday, except that a holiday quest of 21 to 24 June can wait up to three days while the festival stalls take the tickets first. Each March quest is delivered in March.
In each act, repeating quests use at most 20% of the merges. No three consecutive days have only repeating work.
An outdoor quest waits at most two rain days. The efficient run reaches no held position except the festival on 21 June.
The fixture reports actions, takes, merges, deliveries, recovery deliveries, income, and free cells for each preparation and chapter.
Before each preparation, a check buys one spare ingredient so that the purse cannot pay.
Then the check reaches the preparation through the recovery quest.
The fixture clears blockers while fewer than 24 cells are free.

Delivery checks require all portions at once. A failed delivery changes no game state.
Visitor checks include Ionatan after Vlad's quest and the shared meal after Ionatan's dinner.
Local news requires three later deliveries.

Preparation blocker checks include adoption by existing saves and repeated use of a cell after resolution.
Save checks cover export, import, reload, invalid blocker history, and the kept save after a failed write.

Story checks cover every chapter boundary and both finales.
A complete campaign can keep all earned preparation, quest, and chapter scenes in its queue.
The coins of a complete campaign buy the ingredients of the supper. The recovery quest checks cover a short purse.
Scene checks cover unique scene identifiers and queue order.
A save with every preparation of an act complete and its finale not served opens the finale quest. A save with an unread finale before its delivery is invalid. Load and import reject it and keep its bytes.

## Browser coverage

The files in `tests/browser/` check these areas.

| Test files | Coverage |
| --- | --- |
| `game.spec.ts` | Core play, and mixed merges by tap, drag, and keyboard in both part orders. Recipe partner marks, Find a match for a recipe pair, take costs, and refused takes. The recovery ticket, ticket rewards, the first paid preparation, themes, layout, input, and focus. The recipe book with chain and mixed sections. Temporary guidance that counts each missing copy of a recipe part. Saves, load recovery, asset paths, and concurrent tabs. |
| `full-board-guidance.spec.ts` | Temporary guidance on a full board. A useful merge in either recipe part before a ready delivery, and a campaign quest before the recovery quest. The recovery ticket face on a phone, ordinary merge, blocker merge, no available action that makes a free cell, and unchanged saves. |
| `renovation.spec.ts` | Room checkpoints, room crops, area changes, and pins. |
| `decorations.spec.ts` | Finish switches, visible targets, keyboard focus, saved choices, failed writes, and concurrent tabs. |
| `generators.spec.ts` | Stage-1 production, paid takes across a reload, the free Herb basket, source activation in the source tab, and full boards. Keyboard input, touch emulation, a drag and a keyboard move of a source along a pocket and between pockets, the order after a reload, and the rack geometry. |
| `campaign-goals.spec.ts` | Unmet requirements, compact readiness, inline cost disclosure, the keyboard toggle, payment with details open, and phone scroll. Exact totals and payment descriptions, a new source on a full board, guide Stop when a delivery makes Pay ready, and layout. |
| `quests.spec.ts` | Tickets, quest dialogs, direct missing-dish guidance, dish help, deliveries, scenes, saves, focus, input, and concurrent tabs. |
| `visitors.spec.ts` | Supply quests, visitor portraits, introductions, Ionatan's dinner, departure, and save failures. |
| `guests.spec.ts` | Shared quests, both portraits, diets, local news, departure, and red wine. |
| `repeating.spec.ts` | A repeating ticket after the supper, its delivery, and the next quest of the cycle, at the desktop size and the phone size in both themes. A saved repeating quest that waits while campaign quests hold the tickets. |
| `board-clearing.spec.ts` | Blocked cells, legal merge targets, labels, help, input, reload, the blocker coin, and web removal at preparation 1. |
| `preparation-blockers.spec.ts` | Payment, failed payment saves, artwork, matching merges, deferred placement, four free cells, reload, and layout. |
| `blocker-help.spec.ts` | Rule marks, both tap orders to clear a blocker, matching dishes, and recipe partners. Names of only the partners that the player has made. The blocker coin, eligible targets, dismissed help, unchanged saves, contrast, and layout. |
| `story.spec.ts` | Chapter goals, steps, scenes, reveals, the supper ticket and its plates, and Serve. The recovery quest and its delivery flight beside an empty counter. The finale, the supper painting, journal entries, favourites, focus, and layout. |
| `journal.spec.ts` | Journal groups, priorities, scene coverage, focus, open groups, scroll, delivery order, combined quests, and the favourite dishes of each regular. |
| `portrait-framing.spec.ts` | Each portrait crop at ticket and dialogue sizes in both themes. |
| `day.spec.ts` | The clock, a debt in the purse, booked tickets, the lantern control, the closing dialog, and Skip. The night of a theft and of a gift. Taps and keys that do not stop a watched night. The drawer on a phone, reduced motion, and a hidden page during the closing dialog or the night. The morning dialog after a reload, and unread reports after a save replacement. The result of act 1 on the supper card. |
| `calendar.spec.ts` | Desktop and phone dates, chapter opening text, holidays, seasonal notices, window views, decorations, and the supper date. |
| `act-two.spec.ts` | Hail, the piper, festival tickets and painting, Ambrozie, the feast, the orchard, act-specific areas and chapter counts, garden prices, save failures, and saved progress. Room names and 44px targets within the room in both themes at phone and desktop sizes. |
| `save-compatibility.spec.ts` | Fixed current-format saves through reload and continued browser play. |
| `recipes.spec.ts` | Recipe book sections, return focus and scroll, outside dismissal, and help for absent seasonal sources. |

Play checks include pointer drag, keyboard input, selection, and delivery.
Room checks include reduced motion, failed image loads, and text that is available after an image failure.
Layout checks include the desktop and phone screens, the drawer, the phone bar, and 44px control targets.
Checks on a narrow screen that is 600px high or less require a drawer that stays in place.
These checks also require an active drawer body and a reveal that does not wait for the drawer.
Theme checks include Light, Dark, System, and 4.5:1 contrast for main and muted text.

Source rack geometry checks cover the places, the seven pockets and the eighth for a fifteenth source, the pictures above the rails, the take-cost tags on the rails, and the shared edges of the rack and the board at 360×740, 390×844, and 1440×900 in both themes.
Repeated source taps keep the board in place at widths of 360px, 390px, and 412px.
Ticket and story geometry checks cover 1440×900, 390×844, and 390×800 in both themes.
With the recovery ticket, each ticket target stays 44px wide and inside its ticket at 390px and 360px.
Take cost checks cover 1440×900 and 390×844 in both themes.
Quest dialog checks cover 1440×900 and 390×844 in both themes.
Visitor quests and the shared visitor quest have checks at 1366×900 and 390×844 in both themes.

Quest checks include delivery from the board, delivery notices, the next ticket, combined journal conversations, export, import, and failed writes.
A completed quest has one journal entry with the exact quest text and reply, one illustration, and one Return action.
Unread conversations keep their reply unread through Close and Escape. Completion marks only the reply as read. A replay gives no reward.
The campaign quest tests require that a delivery leaves its completion scene unread and opens no dialog.
When the player serves the supper, the finale opens. A recovery delivery queues no scene and records nothing.
The quest checks also cover the unsaved warning in the delivery notice.
Ionatan has one dinner and an introduction only during his visit.
His departure removes his replay entries.
Mina and Avram share one quest with both portraits.
Their later outcome appears as local news.
A failed delivery write keeps the departure for the session. Reload restores only saved progress.

From a new game, story checks make every payment and read every chapter scene.
Then the story checks serve the supper and read the finale and the supper painting.
Before each payment, the check writes the quests and the coins that the payment needs.
Checks compare the displayed goals, neighbour help, and chapter outcomes.
Each scene, including the finale, shows its complete text and speakers with one completion action.
Escape, Close, and reload leave a scene unread and reopen its transcript at the top.
The paid transcript completion starts the room reveal, then opens the next earned scene.
A replay does not change an unread scene.
A failed supper save warns inside the finale. Chromium exposes the warning to assistive technology.
Three successive recovery deliveries check the bat cadence with full motion. The first two deliveries show no bat.
A quest completion scene stays unread through reload and finishes once from Read now.

Asset checks cover the root path and the Pages path.
Blocker crops are square and inside their source cells.
Browser alpha checks measure visible size and position.
Review galleries use the same crop styles as the game.

## Limits

Automated checks do not establish visual quality or a satisfactory play experience.
Examine the changed interface in both themes at desktop and phone sizes.
The checks do not include a physical touch device, assistive technology, or audio quality.
The campaign fixture does not measure human play time.

Title clearance and intellectual-property clearance are outside these checks.
See [release notes](release-notes.md).
