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

The Pages workflow runs the type check, the Node.js tests, and the build.
The Pages workflow does not run the dead-code check or the browser tests.

## Result

This file describes test coverage. This file does not record a test result.
Run `npm run quality:full` to get the result for the current checkout.
Build the game before a separate browser test run.
The browser tests serve `dist/` and do not build the game.

## Node.js coverage

The files in `tests/` check these areas.

| Test files | Coverage |
| --- | --- |
| `engine.test.ts` | Production, merges, swaps, the next source output, preparation payment, room states, and game data validation. |
| `storage.test.ts` | Save validation, size limits, export, import, reset, failed writes, recovery, invalid data, unsupported versions that stay unchanged, and saved output choices. |
| `decorations.test.ts` | Decoration slots, quest unlocks, finish choices, rejected choices, and saved choices. |
| `economy.test.ts` | Menu prices, quest rewards, and work budgets. |
| `campaign-goals.test.ts` | Required quests, coins, source space, failed payments, quest order, and sufficient campaign rewards. |
| `campaign-balance.test.ts` | A complete campaign through valid actions, with accounts for actions and coins. |
| `quests.test.ts` | Quest data, three tickets, authored order, delivery requirements, failed deliveries, the coin limit on delivery, and visitor order. |
| `guests.test.ts` | Red wine quests, Ionatan's dinner and journal entry, the shared vegetarian meal, guest departure, and later local news. |
| `regulars.test.ts` | Arrival pairs, arrival scenes, quest timing, favourite chains, the neighbours list, and cast validation. |
| `board-clearing.test.ts` | Initial blockers, matching merges, blocked actions, placement space, discoveries, and saved progress. |
| `preparation-blockers.test.ts` | Preparation batches, deferred placement, free space, source priority, saved history, failed writes, and retry. |
| `story.test.ts` | Chapters, scenes, the finale, queues, saved lines, failed payments, and play after the finale. |
| `checkpoint-saves.test.ts` | Manual checkpoint saves, the next payment, and the final scenes. |
| `assets.test.ts` | Masters, variants, hashes, portrait cells, blocker cells, references, asset paths, fonts, and license texts. |
| `build.test.ts` | The build file list, type removal, executable asset rejection, and linked directory rejection. |
| `server.test.ts` | Allowed paths, configured server addresses, and Windows path case. |
| `source-export.test.ts` | Product test coverage in the export, exported imports, document links, local folder exclusions, ignore rules, and the dead-code command of the export. |
| `art-image.test.ts` | Art generation request fields, image dimensions, masks, composites, file formats, and rejected inputs. |

Generator checks cover both tier boundaries, lower outputs, chosen outputs, rejected takes, and upgrades on a full board.
The campaign fixture completes all 24 preparations and all 81 quests without injected coins or items.
The fixture reports actions, takes, merges, deliveries, and income for each preparation and chapter.
The fixture needs no release of a blocker.

Delivery checks require all portions at once. A failed delivery changes no game state.
Visitor checks include Ionatan after Vlad's quest and the shared meal after Ionatan's dinner.
Local news requires three later deliveries.

Preparation blocker checks include adoption by existing saves and repeated use of a cell after resolution.
Save checks cover export, import, reload, invalid blocker history, and the kept save after a failed write.

Story checks cover every chapter boundary and one finale.
A complete campaign can retain all earned preparation, quest, chapter, and finale scenes in its queue.
Line checks cover unique scene identifiers, queue order, saved positions, stale positions, and invalid line records.
Save checks cover scenes with and without saved lines.

## Browser coverage

The files in `tests/browser/` check these areas.

| Test files | Coverage |
| --- | --- |
| `game.spec.ts` | Core play, ticket rewards, the first paid preparation, themes, layout, input, focus, recipes, saves, load recovery, asset paths, and concurrent tabs. |
| `renovation.spec.ts` | Room checkpoints, room crops, area changes, and pins. |
| `decorations.spec.ts` | Finish switches, visible targets, keyboard focus, saved choices, failed writes, and concurrent tabs. |
| `generators.spec.ts` | Upgrades, chosen outputs, Take controls, full boards, keyboard input, touch emulation, and geometry. |
| `campaign-goals.spec.ts` | Work details, required quests, payment controls, and layout. |
| `quests.spec.ts` | Tickets, quest dialogs, dish help, deliveries, scenes, saves, focus, input, and concurrent tabs. |
| `visitors.spec.ts` | Supply quests, visitor portraits, introductions, Ionatan's dinner, departure, and save failures. |
| `guests.spec.ts` | Shared quests, both portraits, vegetarian requirements, local news, departure, and red wine. |
| `board-clearing.spec.ts` | Blocked cells, labels, help, input, reload, and web removal at preparation 1. |
| `preparation-blockers.spec.ts` | Payment, failed payment saves, artwork, matching merges, deferred placement, reload, and layout. |
| `blocker-help.spec.ts` | Rule marks, matching ingredients, eligible targets, dismissed help, unchanged saves, contrast, and layout. |
| `story.spec.ts` | Chapter goals, steps, scenes, reveals, saved lines, the finale, journal entries, focus, and layout. |
| `portrait-framing.spec.ts` | Each portrait crop at ticket and dialogue sizes in both themes. |

Play checks include pointer drag, keyboard input, selection, and delivery.
Room checks include reduced motion, failed image loads, and text that remains available after an image failure.
Layout checks include the desktop and phone screens, the drawer, the phone bar, and 44px control targets.
The drawer moves only on a narrow screen that is taller than 600px. Checks on a screen that is 600px high or less require a drawer that stays in place, a reveal that does not wait for it, and an active drawer body.
Theme checks include Light, Dark, System, and 4.5:1 contrast for main and muted text.

Generator geometry checks cover three outputs at 360×740, 390×800, 390×844, and 1440×900 in both themes.
Tier-one names and controls also fit at widths of 320px, 360px, and 390px.
Ticket and story geometry checks cover 1440×900, 390×844, and 390×800 in both themes.
Quest dialog checks cover 1440×900 and 390×844 in both themes.
Visitor and shared guest quests have checks at 1366×900 and 390×844 in both themes.

Quest checks include delivery from the board, delivery notices, the next ticket, journal replay, export, import, and failed writes.
The quest tests require delivery to leave its completion scene waiting without opening a dialog.
They also check the unsaved warning in the delivery notice.
Ionatan has one dinner and an introduction only during his visit.
His departure removes his replay entries.
Mina and Avram share one quest with both portraits.
Their later outcome appears as local news.
A failed delivery write retains the departure for the session. Reload restores only saved progress.

Story checks follow every payment, chapter scene, and the finale from a fresh save.
Checks compare the displayed goals, neighbour help, and chapter outcomes.
Escape, Close, reload, export, and import preserve saved scene positions.
Skip starts the room reveal after a paid scene, then opens the next earned scene.
A replay does not change the saved line of a scene that waits.
A saved line past the last line restarts the scene with a notice.
A failed line write warns once. Reload restores the last saved line.
A quest completion scene waits through reload and finishes once from Read now.

Asset checks cover the root path and the Pages path.
Blocker crops remain square and inside their source cells.
Browser alpha checks measure visible size and position.
Review galleries use the same crop styles as the game.

## Limits

Automated checks do not establish visual quality or a satisfactory play experience.
Examine the changed interface in both themes at desktop and phone sizes.
The checks do not include a physical touch device, assistive technology, or audio quality.
The campaign fixture does not measure human play time.

Title clearance and intellectual-property clearance remain outside these checks.
See [release notes](release-notes.md).
