# Verification

## Gate

`npm run quality:full` is the full gate. It runs these steps in this order:

1. The type check.
2. The Node.js tests.
3. The build.
4. The Playwright browser tests on Chromium, against the built artifact.

The browser tests run in parallel on 40% of the logical processors. Each test has its own browser context and save.
The full browser suite runs under `/scary-snacks/`, the GitHub Pages path. The asset and path test also runs at the root path.
The Pages workflow runs the type check, the Node.js tests, and the build. It does not run the browser tests.

## Result

This file does not hold a result. Run `npm run quality:full` to get the result for the checkout.

## Coverage

The Node.js tests cover these areas:

- The rules of the game: merges, production, quest tickets, deliveries, sales, preparations, and room states.
- A full campaign: all 24 preparations and all 63 quests complete through legal actions, with no injected coins or items.
- Saves: validation, the size limit, export, import, reset, failed writes, and malformed data.
- Decoration choices: the slot data, the quest that unlocks each finish, and the validation of choices.
- Generator progression: both tier boundaries, lower outputs, full-board upgrades, chosen outputs, and rejected takes.
- Economy: the menu prices, the quest reward rule, clearance values, the work budgets, and the funding check. The campaign fixture reports actions, takes, merges, sales, deliveries, and income by preparation and chapter.
- Character quests: the quest data checks, the three tickets in authored order, eligibility, atomic delivery, and coin overflow. The traveller sequence, Ionatan's visit after Vlad's quest, and the shared search after Ionatan's dinner. The vegetarian requirements and the local gossip three deliveries later.
- Regulars: the arrival of each pair, the arrival scene once after the story scenes, early arrival scenes in a save, the neighbours list, and the cast check.
- Board clearing: the layout and preparation batch data checks, matching merges into all blocker types without adjacent clearing, blocked placement, atomic failure, and a campaign without blocker clearing. Preparation checks cover deferred batches, the working-space reserve, source placement priority, current-save adoption, malformed history, export, reload, and failed writes.
- Chapter story: the outline and story data checks, every chapter boundary, failed payments, the finale once, reading events, the board after the finale, and the validation of waiting scenes. A legal campaign ends with each preparation scene, each delivered quest scene, each chapter scene, and one finale waiting.
- Dialogue continuation: unique scene IDs, the queue order of one payment, the quest completion scene at delivery, failed actions that queue nothing, saved lines from the first to the last line, stale lines, the line after reading, and malformed line records. Saves with and without lines survive export, import, and load, and a failed line write keeps the previous save.
- Assets: each master and each variant agree with its record. The runtime files and the game data load assets only from the variant and font folders.
- Fonts: the hashes of the fonts and the complete license texts.
- The build: the allowlist, the removal of TypeScript types, and the refusal of executable assets and linked asset directories.
- The server: the confinement of files under the base path.
- The art helper: the request contract, masks, and composites.

The browser tests cover these areas:

- Play: drag input, keyboard input, selection, delivery, and the displayed sale value against the received value.
- The room: the painted states, the area switch, the reveal, reduced motion, and a painting that cannot load.
- Layout: the first screen at the desktop size and the phone size, the drawer, the bar, and the 44px targets.
- Themes: Light, Dark, and System, with contrast of 4.5:1 for the main text and the muted text.
- Decoration choices: the finish switches in the room, keyboard focus, a failed write, and locked finishes.
- Generator progression: payment reveals, named Take buttons, chosen output persistence, keyboard focus, touch emulation, full-board failure, and a still board when a phone selects an upgraded source. Geometry checks cover every source with three outputs at 360×740, 390×800, 390×844, and 1440×900 in both themes. Tier-one names and controls also fit at 320px.
- Character quests: the three quest tickets, Deliver on a ticket and in the request dialog, board-only delivery, the next quest on a free ticket, journal replay, export and import, failed writes, keyboard focus, touch emulation, and two open tabs. The recurring visitor supply requests and all visitor portraits at desktop and phone sizes in both themes. Ionatan has one dinner, an introduction only during his visit, no replay after departure, and completion that survives reload and export/import. Mina and Avram share one vegetarian request and both portraits. Their later outcome appears only as local gossip. A failed write keeps a departure in the session and reload restores only durable progress. Geometry and contrast checks cover the tickets and the request dialog at 1440×900, 390×844, and 390×800 in both themes.
- Board clearing: keyboard, pointer, drag, and touch emulation on blocked cells, their labels, ingredient hints, reload, and the web removal at preparation 1. Preparation checks cover payment, new artwork, matching-blocker guidance, direct clearing, deferred placement after sales, reload, and desktop and phone layouts in both themes. Blocker help checks cover its visible marks, exact clearing rules, eligible target cells, replacement of item actions and preparation offers, keyboard dismissal, unchanged saves, contrast, and layout in both themes.
- Chapter story: a playthrough from a fresh save through every payment, chapter scene, and the finale, with checks that the goals, the neighbour help, and the payoffs agree. The objective and the chapter steps, the closing scene after a reveal, Escape and reload with a waiting scene, the finale with Skip and replay, and the board after the finale. Geometry and contrast checks cover the story card, the journal, and a scene at 1440×900, 390×844, and 390×800 in both themes.
- Dialogue continuation: a paid preparation scene and a chapter scene resume at the saved line after Escape, Close, reload, and export and import. Skip on a paid scene starts the reveal and then opens the chapter scene. A preparation scene that resumes after reload ends with the usual end label. A replay keeps the line of a waiting scene. A line past the end starts the scene again with its notice. A failed line write warns once, and reload resumes at the last saved line. A quest completion scene waits through a reload and finishes once from Read now.
- Saves: reload, export, import, reset, corrupt saves, and two open tabs.
- Assets and paths: only approved assets load, from the root path and from the Pages path.
- Atlas framing: all blocker crops stay square and inside their source cells. Browser alpha checks verify their visible size and centering. All character portraits use their own source cells at ticket and dialogue sizes, in both themes. Review galleries retain the production crop styles.

## Limits

The checks do not include a physical touch device, assistive technology, or audio.
The largest release risk is outside the automated checks.
The risk is the incomplete clearance of the title and of intellectual property.
See [release notes](release-notes.md).
