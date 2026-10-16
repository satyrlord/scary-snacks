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

- The rules of the game: merges, production, orders, storage, sales, preparations, and room states.
- A full campaign: all 24 preparations complete through generated orders, with no injected coins or items.
- Saves: validation, the size limit, export, import, reset, conversion of older saves, failed writes, and malformed data.
- Decoration choices: the slot data, the unlock rules, the validation of choices, and the conversion of older saves.
- Generator progression: both tier boundaries, lower outputs, pantry sources, full-board upgrades, chosen outputs, unchanged seeds, and rejected takes. The campaign comparison reports actions, merges, orders, and XP for both production schedules.
- Level rewards: the schedule checks, eligibility, claims, coin overflow, failed writes, and the conversion of older saves.
- Character quests: the quest data checks, eligibility, atomic delivery, coin overflow, the temporary source, the cleanup preview, and the conversion of older saves. A legal campaign completes all 24 preparations and all 13 quests with no injected coins or items.
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
- Decoration choices: the preview, Apply, Retry after a failed write, locked choices, and older saves.
- Generator progression: payment reveals, named Take buttons, chosen output persistence, keyboard focus, pantry retrieval, touch emulation, full-board failure, envelope-2 conversion, and a still board when a phone selects an upgraded source. Geometry checks cover every source with three outputs at 360×740, 390×800, 390×844, and 1440×900 in both themes. Tier-one names and controls also fit at 320px.
- Level rewards: independent claims, reload, the final reward, overflow, Retry save after a failed write, older saves, export and import, and two open tabs. Geometry checks cover the panel at 1440×900, 390×844, and 390×800 in both themes.
- Character quests: delivery for each neighbour, board-only delivery, unchanged orders, journal replay, export and import, failed writes, keyboard focus, touch emulation, the temporary source, the cleanup preview, and two open tabs. Geometry and contrast checks cover the quest sheet and the cleanup review at 1440×900, 390×844, and 390×800 in both themes.
- Saves: reload, export, import, reset, corrupt saves, and two open tabs.
- Assets and paths: only approved assets load, from the root path and from the Pages path.

## Limits

The checks do not include a physical touch device, assistive technology, or audio.
Mouse drag, keyboard control, and phone-sized layouts in Chromium are not physical-device acceptance.
The next check is a short playthrough in a Chromium-based browser on a physical phone.
The playthrough must include drag cancellation, a theme change, and a save import.

Generator pacing has no human acceptance result. The deterministic campaign comparison is engine evidence only. Import `.tools/checkpoint-saves/20-next-send-the-invitations.json` after `npm run saves:checkpoints`. Complete the last chapter with stage-one Take buttons, then import the same checkpoint and repeat with the highest useful outputs. Count takes, merges, serves, and payments separately. Record whether low-stage orders remain clear. The owner must judge the effort and the pace.

Level reward balance and quest pacing have no human acceptance result. The owner must play a short phone session and judge the purpose of each request and the effort between preparations.

The largest release risk is outside the automated checks.
The risk is the incomplete clearance of the title and of intellectual property.
See [release notes](release-notes.md).
