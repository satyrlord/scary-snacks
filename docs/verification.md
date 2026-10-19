# Verification

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
| `engine.test.ts` | Stage-one production, merges, swaps, preparation payment, room states, and game data validation. |
| `storage.test.ts` | Save validation, size limits, export, import, reset, failed writes, recovery, invalid data, unsupported versions that stay unchanged, and stored choices in existing saves. |
| `decorations.test.ts` | Decoration slots, quest unlocks, finish choices, rejected choices, and saved choices. |
| `economy.test.ts` | Menu prices, quest rewards, and work budgets. |
| `campaign-goals.test.ts` | Required quests, coins, source space, failed payments, quest order, and sufficient campaign rewards. |
| `campaign-balance.test.ts` | A complete campaign through valid actions, with accounts for actions and coins. |
| `quests.test.ts` | Quest data, three tickets, authored order, delivery requirements, failed deliveries, the coin limit on delivery, and visitor order. |
| `guests.test.ts` | Red wine quests, Ionatan's dinner and journal entry, the shared vegetarian meal, guest departure, and later local news. |
| `regulars.test.ts` | Arrival pairs, arrival scenes, quest timing, favourite chains, the neighbours list, and cast validation. |
| `board-clearing.test.ts` | Initial blockers, matching merges, blocked actions, placement space, discoveries, and saved progress. |
| `preparation-blockers.test.ts` | Preparation batches, deferred placement, free space, source priority, saved history, failed writes, and retry. |
| `story.test.ts` | Chapters, scenes, the supper payment, the finale, queues, failed payments, and play after the finale. |
| `checkpoint-saves.test.ts` | Manual checkpoint saves, the next payment, and the final scenes. |
| `assets.test.ts` | Masters, variants, hashes, portrait cells, blocker cells, references, asset paths, fonts, and license texts. |
| `build.test.ts` | The build file list, type removal, executable asset rejection, and linked directory rejection. |
| `server.test.ts` | Allowed paths, configured server addresses, and Windows path case. |
| `source-export.test.ts` | Product test coverage in the export, exported imports, document links, local folder exclusions, ignore rules, and the dead-code command of the export. |
| `art-image.test.ts` | Art generation request fields, image dimensions, masks, composites, file formats, and rejected inputs. |

Generator checks cover stage-one production at campaign milestones, stored choices in existing saves, rejected output requests, and a full board.
The campaign fixture completes all 24 preparations and all 81 campaign quests without injected coins or items.
It leaves the supper unpaid and checks that the remaining coins cover its cost. The recurring quest stays closed.
The fixture reports actions, takes, merges, deliveries, and income for each preparation and chapter.
The fixture can merge into a blocked ingredient on a full board, but the complete campaign clears no blocker.
This includes the initial blockers and the preparation blockers.

Delivery checks require all portions at once. A failed delivery changes no game state.
Visitor checks include Ionatan after Vlad's quest and the shared meal after Ionatan's dinner.
Local news requires three later deliveries.

Preparation blocker checks include adoption by existing saves and repeated use of a cell after resolution.
Save checks cover export, import, reload, invalid blocker history, and the kept save after a failed write.

Story checks cover every chapter boundary and one finale.
A complete campaign can retain all earned preparation, quest, and chapter scenes in its queue, and its coins pay for the supper. The recurring quest checks cover a short purse.
Scene checks cover unique scene identifiers and queue order.
A save with all preparations complete and no supper payment opens the supper quest. Load and import remove its waiting finale.

## Browser coverage

The files in `tests/browser/` check these areas.

| Test files | Coverage |
| --- | --- |
| `game.spec.ts` | Core play, ticket rewards, the first paid preparation, themes, layout, input, focus, recipes with book return and temporary guidance, saves, load recovery, asset paths, and concurrent tabs. |
| `full-board-guidance.spec.ts` | Temporary guidance on a full board: ready delivery, ordinary merge, blocker merge, no available space-making action, and unchanged saves. |
| `renovation.spec.ts` | Room checkpoints, room crops, area changes, and pins. |
| `decorations.spec.ts` | Finish switches, visible targets, keyboard focus, saved choices, failed writes, and concurrent tabs. |
| `generators.spec.ts` | Stage-one production, stored choices in existing saves, source tile activation, full boards, keyboard input, touch emulation, and geometry. |
| `campaign-goals.spec.ts` | Unmet requirements, compact readiness, inline cost disclosure, keyboard toggling, payment with details open, phone scrolling, exact totals and payment descriptions, source space, guide Stop when a delivery makes Pay ready, and layout. |
| `quests.spec.ts` | Tickets, quest dialogs, direct missing-dish guidance, dish help, deliveries, scenes, saves, focus, input, and concurrent tabs. |
| `visitors.spec.ts` | Supply quests, visitor portraits, introductions, Ionatan's dinner, departure, and save failures. |
| `guests.spec.ts` | Shared quests, both portraits, vegetarian requirements, local news, departure, and red wine. |
| `board-clearing.spec.ts` | Blocked cells, legal merge targets, labels, help, input, reload, and web removal at preparation 1. |
| `preparation-blockers.spec.ts` | Payment, failed payment saves, artwork, matching merges, deferred placement, reload, and layout. |
| `blocker-help.spec.ts` | Rule marks, both tap orders for clearing, matching ingredients, eligible targets, dismissed help, unchanged saves, contrast, and layout. |
| `story.spec.ts` | Chapter goals, steps, scenes, reveals, the supper ticket, the finale, the supper painting, journal entries, focus, and layout. |
| `portrait-framing.spec.ts` | Each portrait crop at ticket and dialogue sizes in both themes. |

Play checks include pointer drag, keyboard input, selection, and delivery.
Room checks include reduced motion, failed image loads, and text that is available after an image failure.
Layout checks include the desktop and phone screens, the drawer, the phone bar, and 44px control targets.
Checks on a narrow screen that is 600px high or less require a drawer that stays in place, a reveal that does not wait for it, and an active drawer body.
Theme checks include Light, Dark, System, and 4.5:1 contrast for main and muted text.

Generator geometry checks cover the source tile, selected-source line, and Clear selection at 360×740, 390×844, and 1440×900 in both themes.
Repeated source taps keep the board in place at widths of 360px, 390px, and 412px.
Ticket and story geometry checks cover 1440×900, 390×844, and 390×800 in both themes.
Quest dialog checks cover 1440×900 and 390×844 in both themes.
Visitor and shared guest quests have checks at 1366×900 and 390×844 in both themes.

Quest checks include delivery from the board, delivery notices, the next ticket, combined journal conversations, export, import, and failed writes.
A completed quest has one journal entry with the exact request and reply, one illustration, and one Return action.
Unread conversations keep their reply pending through Close and Escape. Completion marks only the reply as read. A replay gives no reward.
The campaign quest tests require delivery to leave its completion scene waiting without opening a dialog.
The supper payment opens the finale. A recurring delivery queues no scene.
They also check the unsaved warning in the delivery notice.
Ionatan has one dinner and an introduction only during his visit.
His departure removes his replay entries.
Mina and Avram share one quest with both portraits.
Their later outcome appears as local news.
A failed delivery write retains the departure for the session. Reload restores only saved progress.

Story checks make every payment, read every chapter scene, pay for the supper, and read the finale and the supper painting, from a new game. Before each payment, the check writes the quests and the coins that the payment needs.
Checks compare the displayed goals, neighbour help, and chapter outcomes.
Each scene, including the finale, shows its complete text and speakers with one completion action.
Escape, Close, and reload leave a scene unread and reopen its transcript at the top.
The paid transcript completion starts the room reveal, then opens the next earned scene.
A replay does not change a scene that waits.
A failed supper save warns inside the finale. Chromium exposes this warning to assistive technology.
Three successive recurring deliveries check the bat cadence with full motion. The first two deliveries show no bat.
A quest completion scene waits through reload and finishes once from Read now.

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
