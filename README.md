# Scary Snacks

Scary Snacks is an original, cosy merge game in a fictional Transylvanian bistro. Cook for your neighbours. Prepare a community supper. Keep Miez the black cat company while bats fly in the evening sky.

## Play locally

You must have Node.js 24 or newer. The source is TypeScript 7 in strict mode. Node.js runs the tools and the tests from the `.ts` files directly. The build publishes the three runtime modules as browser scripts in `dist/`. `npm run typecheck` runs the compiler without output.

```powershell
npm ci
npm run build
npm run preview
```

Open http://127.0.0.1:4178. Use `npm run dev` for development.

## Controls

- To merge two matching items, tap one item and then tap a matching item. You can also drag one item onto the other.
- Tap any item to select it for Store or Sell. Tap an empty space to move the selected item there. Drag an item onto a different item to swap the two items.
- To take an ingredient, tap an ingredient source. Each tap takes one ingredient and selects the source, so that Take, Store, and the merge chain stay visible. A drag moves the source and takes nothing. The ingredient sources are the Flour bin, the Copper pot, the Pastry box, the Drinks pitcher, and the Produce basket. Sources never run out. The game never makes you wait.
- Serve your neighbours from their tickets to earn coins. Each preparation needs coins and cumulative service and merges based on its work. Cost details shows its scope, materials, labour, and estimated work. Story shows each total and target. Orders and merges count across all preparations and are never spent. Once every requirement is met, Mara's line under the board also offers Pay when the story card is off screen. The game saves each preparation before its story and its room change appear. The story of the preparation ends with "See what changed". Then the room shows the change in place, with a "New" pin. A failed save spends no coins and leaves the preparation available to retry.
- Open Neighbour quests from Story. Each request shows its food quantities and coin reward. Deliver uses the board only. Return stored food from the pantry first. Your ordinary orders stay in place. Quests have no deadline. The story journal has optional introductions and quest scene replay. Replay gives no second reward.
- Ilie's optional bread tasting lends one Tasting flour bin. Accept needs one free board or pantry space. Its ingredients have separate names and pictures matching the ordinary bread ingredients. Before delivery, review the tasting supplies that will return to Ilie. Ordinary items stay. A failed quest save keeps the session and offers Retry save. Save or export before leaving; reload can lose unsaved progress.
- The room shows the area of the latest change. The area switch in the corner of the room names both areas. The courtyard opens with the preparation "Clear the courtyard". On a phone, the handle of the kitchen drawer lowers the drawer to show the whole room.
- Tap a dish in an order to see how to make the dish. The button "Show me on the board" shows the next step. The button "Find a match" shows a pair to merge.
- Store spare items in the pantry. You can store sources, but you cannot sell them.
- Open the House book to see your level, XP, and rewards. Levels 2 through 10 each offer 20 coins. Select Claim for each earned reward. A copper dot marks the House book while rewards wait. Existing XP in an older save also earns these claims. A failed save keeps the claim in this session and offers Retry save. Save or export before leaving to keep that progress.
- Preparations 12 and 20 improve all sources. Select a source, then use a named Take button to take an earned output. Later taps on that source repeat the chosen output. Lower outputs stay available. The choice stays through pantry storage and reload. Upgrades need no board space.
- The board is one Tab stop. The arrow keys move the board focus. Home and End go to the ends of the row. Ctrl+Home and Ctrl+End go to the first space and the last space. Enter or Space selects. Escape clears the selection.
- The House book holds these controls:
  - The Light, Dark, and System appearance. The browser saves this choice.
  - The sound.
  - The export of saved games.
  - The import of saved games.
  - A new game.
- The House book also holds Decorations. After preparations 9, 22, and 24, choose the shelf tableware, the courtyard table cloth, and the final flowers. Preview a finish, then select Apply to save the finish or Cancel to keep the current finish. Choices are free. You can change a choice again. A failed save leaves the old choice active and offers Retry.

The game has 30 permanent dishes and drinks, five permanent ingredient sources, four original characters, and 24 preparations across six chapters. Each character has three quests. One additional optional quest lends a temporary source with three exclusive bread ingredients. Orders continue after the story. Merge chains are game rules, not cooking recipes.

Saves use state version 6 in envelope version 5 at `scary-snacks-save-v5`. Valid older envelopes 1 through 4 convert step by step. Each step checks its input and output. Older browser bytes stay unchanged. Conversion keeps preparations, coins, items, orders, choices, and level claims. Regular quests tied to finished preparations become legacy-satisfied without a reward. The temporary source is never inserted by conversion. A failed conversion blocks changes and offers Retry saved game in the House book.

Campaign goals use the saved service and merge counters. They need no new save version. Finished preparations stay finished even when those counters are zero. Imported saves must meet the goals only for their remaining preparations.

## GitHub Pages

The game has no backend and no runtime dependency. Relative Uniform Resource Locators (URLs) support a repository subdirectory. The game is live at https://satyrlord.github.io/scary-snacks/.

The workflow in `.github/workflows/pages.yml` runs on every push to `main`. You can also start the workflow manually. The workflow runs the type check and the Node.js tests, builds the game, and uploads only `dist/`. The workflow does not run the browser tests. Run `npm run quality:full` before a push.

The Pages source of the repository must stay set to GitHub Actions. A branch deployment serves the source tree. The source tree cannot run.

To check a local subdirectory, set `BASE_PATH` to `/scary-snacks/` before you run the preview server. The address then becomes http://127.0.0.1:4178/scary-snacks/.

The site is public. The release limits still apply. See the limits of name clearance in [release notes](docs/release-notes.md). The project gives no legal clearance and no guarantee against claims.

`npm run release:source` prepares `.release/scary-snacks-source/` from an explicit file list. The export has no Git history and nothing from the local folders `private/` and `analysis/`. The export includes the feature specs. The export excludes the repository-only skills and their tests. The export keeps the `.gitignore` of the repository. The source export is suitable for review or for a fresh repository. The source export does not remove public copies that already exist.

## Assets and source

32 Portable Network Graphics (PNG) masters are the source of the game art. The game ships AV1 Image File Format (AVIF) and WebP variants of the masters. The variants have sizes for display. After a master changes, run `npm run assets:build`. See [asset variants](docs/asset-variants.json) for the files, the sizes, and the hashes.

The in-chat imagegen tool produced the food atlas and the mascots.

The same built-in tool made two decoration edit paintings. They supply green shelf pottery, lilacs, and blue cloth embroidery. The app samples only the authored regions. The 25 room paintings stay unchanged. The user accepted these two edits.

The OpenAI Images API (gpt-image-2.5-flare, high quality) produced these masters:

- the portraits: a text-only first candidate, then one revision of that candidate
- the timber tabletop and the embroidered runner, each from a text-only prompt
- the 25 painted room states, each 1536 by 2048 pixels

The two base rooms use generated room paintings of this project as references. Each later state is an edit of the previous accepted state. A Sharp composite pastes only the changed region over the previous state. Drift cannot accumulate. The user accepted each state.

To add a painting, do these steps:

1. Add its master.
2. Add its records.
3. Add its variant plan in `tools/build-image-variants.ts`.
4. Add its ID in `roomPaintings` in `src/engine.ts`.
5. Run `npm run assets:build`.

The portraits show the working village folk dress that the user requested: Romanian dress for Mara, Ilie, and Sorin, and Székely dress for Eszter.

The game makes its sounds as procedural browser tones. The interface text uses the font Inter. The readable blackletter branding uses the font Grenze Gotisch. The project self-hosts both fonts as Web Open Font Format 2 (WOFF2) files. Each font has its SIL Open Font License (OFL) 1.1 license text. WOFF2 is a lossless repackaging of the unmodified upstream TrueType Font (TTF) files. [Font provenance](docs/font-provenance.json) records the fonts.

[Asset provenance](docs/asset-provenance.json) records the final files and the hashes. [Prompts](docs/asset-prompts.json) record the instructions for generation and revision.

`tools/create-original-data.ts` authors the game data. The game data includes the renovation: the areas and one room state for the new game and for each preparation. A state has its painting ID, the focus of its change, and its caption. The tool refuses to write the game data in these cases:

- An ID in `roomPaintings` in `src/engine.ts` has no approved master.
- `dataProblems` in `src/engine.ts` reports a problem in the board, room states, decoration slots, production tiers, level rewards, quests, or campaign goals. The board must have six columns, seven rows, and 42 starting spaces. The starting board must make a new game that passes the save validation. Quest checks include the combined preparation and quest graph, ingredient availability, and exclusive source ownership. Campaign goals must be nonnegative integers and must not decrease. Economy checks validate every menu price, work estimate, and material-plus-labour total.

The game runs `dataProblems` when it starts, before it reads the save. The game does not have the asset records, so it does not check the decoration image names.

The art has no small text. After you edit the generator, run `npm run data:generate`.

## Planned features

The repository contains 15 feature specs in `docs/specs/`. `docs/specs/README.md` gives the coverage, the priorities, the dependencies, and the acceptance checks. The specs record proposed work and identify parts that the project already implements. The owner documents describe current behavior. The source export includes the specs.

## Verification

```powershell
npx playwright install chromium
npm run quality:full
```

The gate covers these items:

- the type check
- the engine progression
- the saves
- the asset hashes
- the boundaries of the build and the server
- hosting at the root path and at the subdirectory
- the desktop layout and the phone layout
- the themes
- browser play

See [verification](docs/verification.md) for the coverage and the limits.

To check the story and the renovation manually, run `npm run saves:checkpoints`. The command writes 25 saves to `.tools/checkpoint-saves/`, which Git ignores. It writes one save for each number of paid preparations. A file name gives that number and the next preparation, for example `12-next-clear-the-courtyard.json`. Each synthetic save holds the exact coins, service, and merge totals for the next preparation. Import one save from the House book, with Import saved game. Then pay to see the story and the reveal of that preparation. These supplied resources do not measure campaign balance.

The [economy record](docs/economy.md) explains the food portions, real-work budgets, sources, and assumptions. New orders sum explicit food prices with no flat bonus. Existing saved orders keep their original quotes until served. Their replacements use the current menu.

For a reproducible campaign balance check, run `node tools/campaign-balance.ts`. The tool uses seed 84017 and legal engine actions. It reports each chapter's actions, merges, served orders, sales, income by source, preparation costs, and final balance. It runs a fresh campaign without optional rewards, a fresh campaign with level rewards and all quests, and a legacy sales-only prefix through preparation 12 followed by current rules. It preserves the legacy checkpoint during conversion and checks all three outstanding orders after the finale. Node tests run the same fixture in the full gate. The fixture also compares the historical prices with the current prices, using both the fewest-ingredient policy and a policy that selects quoted income per action. It reports each preparation as well as each chapter. It does not measure human play time or pacing.
