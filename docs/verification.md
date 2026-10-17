# Verification

## Gate

`npm run quality:full` is the full gate. It runs these steps in this order:

1. The type check.
2. The Node.js tests.
3. The build.
4. The Playwright browser tests on Chromium, against the built artifact.

The full browser suite runs under `/scary-snacks/`, the GitHub Pages path. The asset and path test also runs at the root path.
The Pages workflow runs the type check, the Node.js tests, and the build. It does not run the browser tests.

## Result

This file does not hold a result. Run `npm run quality:full` to get the result for the checkout.

## Coverage

The Node.js tests cover these areas:

- The rules of the game: merges, production, orders, sales, preparations, and room states.
- A full campaign: all 24 preparations complete through generated orders, with no injected coins or items.
- Saves: validation, the size limit, export, import, reset, failed writes, and malformed data.
- Decoration choices: the slot data, the unlock rules, and the validation of choices.
- Generator progression: both tier boundaries, lower outputs, full-board upgrades, chosen outputs, unchanged seeds, and rejected takes. The campaign comparison reports actions, merges, orders, and XP for both production schedules.
- Level rewards: the schedule checks, eligibility, claims, coin overflow, and failed writes.
- Character quests: the quest data checks, eligibility, atomic delivery, coin overflow, the temporary source, and the cleanup preview. A legal campaign completes all 24 preparations and all 13 quests with no injected coins or items.
- Board clearing: the layout data checks, adjacent reveals, anchored merges, blocked placement, atomic failure, and a campaign with every obstacle intact.
- Chapter story: the outline and story data checks, every chapter boundary, failed payments, the finale once, reading events, continued orders, and the validation of waiting scenes. A legal campaign ends with each chapter scene and one finale waiting.
- Assets: each master and each variant agree with its record. The runtime files and the game data load assets only from the variant and font folders.
- Fonts: the hashes of the fonts and the complete license texts.
- The build: the allowlist, the removal of TypeScript types, and the refusal of executable assets and linked asset directories.
- The server: the confinement of files under the base path.
- The art helper: the request contract, masks, and composites.

The browser tests cover these areas:

- Play: drag input, keyboard input, selection, serving, and the displayed sale value against the received value.
- The room: the painted states, the area switch, the reveal, reduced motion, and a painting that cannot load.
- Layout: the first screen at the desktop size and the phone size, the drawer, the bar, and the 44px targets.
- Themes: Light, Dark, and System, with contrast of 4.5:1 for the main text and the muted text.
- Decoration choices: the preview, Apply, Retry after a failed write, and locked choices.
- Generator progression: payment reveals, named Take buttons, chosen output persistence, keyboard focus, touch emulation, full-board failure, and a still board when a phone selects an upgraded source. Geometry checks cover every source with three outputs at 360×740, 390×800, 390×844, and 1440×900 in both themes. Tier-one names and controls also fit at 320px.
- Level rewards: independent claims, reload, the final reward, overflow, Retry save after a failed write, export and import, and two open tabs. Geometry checks cover the panel at 1440×900, 390×844, and 390×800 in both themes.
- Character quests: delivery for each neighbour, board-only delivery, unchanged orders, journal replay, export and import, failed writes, keyboard focus, touch emulation, the temporary source, the cleanup preview, and two open tabs. Geometry and contrast checks cover the quest sheet and the cleanup review at 1440×900, 390×844, and 390×800 in both themes.
- Board clearing: keyboard, pointer, drag, and touch emulation on blocked cells, their labels, order hints, reload, and the web removal at preparation 1.
- Chapter story: a playthrough from a fresh save through every payment, chapter scene, and the finale, with checks that the goals, the neighbour help, and the payoffs agree. The objective and the chapter steps, the closing scene after a reveal, Escape and reload with a waiting scene, the finale with Skip and replay, and service after the finale. Geometry and contrast checks cover the story card, the journal, and a scene at 1440×900, 390×844, and 390×800 in both themes.
- Saves: reload, export, import, reset, corrupt saves, and two open tabs.
- Assets and paths: only approved assets load, from the root path and from the Pages path.

## Limits

The checks do not include a physical touch device, assistive technology, or audio.
The largest release risk is outside the automated checks.
The risk is the incomplete clearance of the title and of intellectual property.
See [release notes](release-notes.md).
