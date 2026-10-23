# Delivery

## Tools

The source is TypeScript 7 in strict mode, Hypertext Markup Language (HTML), and Cascading Style Sheets (CSS). The repository has no JavaScript source files. Use Node.js 24.22.1 or a newer 24.x release. Node.js 26.12.1 or newer is also supported. Node.js runs the tools and the tests from the `.ts` files directly. These minimum versions include the fix for the Brotli decoder vulnerability [CVE-2026-111497](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases). Update the installed Node.js runtime before you install dependencies or run the tools. The build removes the types from the runtime modules and publishes them as browser scripts in `dist/`. `npm run typecheck` runs the compiler without output.

Playwright, TypeScript, Sharp (for image variants), Fallow (for dead code), and the Node.js type definitions are development dependencies.

On Windows, the Playwright test browsers disable `TcpPortRandomizationWin` as a temporary workaround for failed local connections (`ERR_NO_BUFFER_SPACE`). The configuration keeps all default disabled features of the installed Playwright version. The browser launch test compares the effective arguments with a default launch. Check this list on each Playwright update. Remove the workaround when the upstream fix is available and verified. See the [upstream issue](https://github.com/microsoft/playwright/issues/43545). Other operating systems use the default launch. This setting changes only the test browsers.

`npm run deadcode` runs Fallow on the module graph. The check fails on an unused file, export, type, or dependency, and on an import that Fallow cannot resolve. `.fallowrc.json` gives the entry point that Fallow cannot find. `.fallowrc.json` also lists the runtime paths that the build resolves and that Fallow cannot resolve.

`npm run preview` serves `dist/` at http://127.0.0.1:4178. `npm run dev` serves the source. To serve at a subdirectory, set `BASE_PATH` to `/scary-snacks/` before you start the server. The address then becomes http://127.0.0.1:4178/scary-snacks/.

## Version

The version has the form major.minor.build. The `version` field in `package.json` gives the major and minor versions. Change them manually. The build ignores the third part of that field. The build number is the count of commits in `HEAD` (`git rev-list --count HEAD`). So each new commit increases the build number by one. The build and `npm run dev` write the version into the `app-version` meta element of the page. Options shows the version. A copy without Git history, for example the source export, has build number 0. The build stops in a shallow clone, because a shallow clone does not have the full count.

The build version does not change the save format. Until act 2 is fully implemented, each deployed build keeps the save compatibility boundary in `PRODUCT.md`: key `scary-snacks-save-v16`, envelope version 16, and game state version 17. The save-compatibility tests use fixed saves in `tests/fixtures/save-v16.json`. They check load, import, export, and continued play without lost progress. The source export includes the tests and their fixtures.

## GitHub Pages

The game has no backend and no runtime dependency. Relative Uniform Resource Locators (URLs) support a repository subdirectory. The deployment address is https://satyrlord.github.io/scary-snacks/.

The workflow in `.github/workflows/pages.yml` runs on every push to `main`. A person can also start the workflow manually. The workflow uses Node.js 24.22.1 and gets the full Git history for the build number. The workflow runs the type check and the Node.js tests, builds the game, and uploads only `dist/`. The workflow does not run the dead-code check or the browser tests.

The workflow in `.github/workflows/pr-quality.yml` runs on pull requests to `main`. It uses Node.js 24.22.1, gets the full Git history, installs Chromium, and runs `npm run quality:full`. Its repository permission is read-only. It does not deploy or upload a Pages artifact.

The Pages source of the repository must be GitHub Actions. A branch deployment serves the source tree, and the source tree cannot run.

The site is public. The [release notes](docs/release-notes.md) give the release limits.

## Source export

`npm run release:source` prepares `.release/scary-snacks-source/` from an explicit file list. The export has no Git history and nothing from the local folders `private/` and `analysis/`. The export excludes the feature specifications, the repository skills, and the tests of the skills. The export keeps the `.gitignore` of the repository. The export is suitable for review or for a new repository. The export does not remove an existing public copy.

## Assets

83 Portable Network Graphics (PNG) masters in `public/assets/original/` are the source of the game art. The game ships variants of the masters in AV1 Image File Format (AVIF) and WebP. The sizes of the variants fit the screens. The variants come only from these masters. The local folders `private/` and `analysis/` are not release inputs.

The transparent board-clutter atlas has six open-center overlays in square cells. The preparation-clutter atlas has 12 contextual overlays with transparent centers, in a four-by-three grid of 1448 by 1086 pixels. The built-in chat image generator made the preparation-clutter atlas. The atlas ships as one WebP variant at its original size. The mascot atlas and each portrait atlas ship one 640-by-640 WebP variant. The portrait atlases are the core, visitor, guest, family, and three regulars atlases.

The OpenAI Images application programming interface (API) made the 18 food atlases. Each chain has one food atlas, and the mixed dishes have four. Each food atlas is a transparent grid of 4 by 2 cells, 2048 by 1024 pixels. Each food atlas ships one 1024 by 512 WebP variant. Alpha cuts, moves, box clears, and cell copies between candidates correct the food atlases. The corrections paint no pixel.

The OpenAI Images API made the two rat sheets, the rat hole, and the night sky. Each rat sheet is a transparent grid of 4 by 2 cells, 2048 by 1024 pixels. The reference of each rat sheet is an accepted identity reference of its rat. Each rat sheet ships one 1024 by 512 WebP variant. A cell trim removes the parts of the thief rat poses that are outside their cells. The trim paints no pixel. The rat hole is a transparent 1024px square and ships one 256px WebP variant. The night sky is opaque, 2048 by 1024 pixels, and ships one 1024 by 512 WebP variant.

The OpenAI Images API made the three window views and the two holiday images. Each window view is an opaque 1152 by 1536px picture of the village behind the front-room window, with a front-room painting as its style reference. Each view ships one 576 by 768 WebP variant. Each holiday decoration is a masked edit of a room state, cut out by its difference from that state. Each holiday image holds the cut decorations of one area at their places, on transparency at the size of the room states, and ships one 1536 by 2048 WebP variant. The cut paints no pixel.

After a master changes, run `npm run assets:build`. The command encodes only the new and changed masters, and `--all` encodes all masters. A change to the grid or cell order also encodes that sheet again. [Asset variants](docs/asset-variants.json) records the cell plans, files, sizes, and hashes.

The built-in chat image generator made the parchment. The OpenAI Images API made the three sheets of character sketches and the six sheets of quest scenes. One request draws each sheet, so that all drawings share one hand. The references of the sheets are earlier sheets of the same task. Each sheet is drawn on white paper. A fixed conversion makes the paper transparent. A fixed colour mapping then gives every line one sepia colour and keeps the alpha of each pixel. Only the flames, the crowns, and the red chalk of the door, the Easter eggs, and the eggshells keep their colour. A masked edit redraws one bell in the second sketch sheet. Masked edits redraw three scenes of the fourth scene sheet and then all of its bottom-left scene. A box clear removes the willow tips that cross from one scene of that sheet into the scene above it, and an edge fade makes the willow fade into the paper at the top of its scene. The box clear and the edge fade paint no pixel.

The parchment is 1254px square. Each sketch sheet is 2688 by 1344px, with 672px cells. Each scene sheet is 2304 by 1536px, with 1152 by 768px cells. The parchment ships as one native-size WebP. The build cuts each cell into its own variant. Each character sketch ships as a transparent 672px square WebP. Each pencil scene ships as a transparent 1024 by 683px WebP. The two painted notebook pages ship as opaque WebP images at the same size. The family photographs ship as transparent 672px square WebP images. Mama and Tata show their photographs in place of sketches. Other introductions use individual sketches. Quest openings, replies, and replays use their registered scene illustration. If a quest has no scene illustration, they use the sketch of the quest character. The user explicitly accepted each installed master.

[Asset provenance](docs/asset-provenance.json) records the masters and their hashes. [Prompts](docs/asset-prompts.json) records the generation instructions. The repository skill `generate-game-art` (repository only) gives the procedure to add or replace a master. The procedure covers a room painting.

The game makes its sounds as tones that code generates in the browser. The interface text uses the font Inter. The wordmark uses the font Grenze Gotisch. The project self-hosts both fonts as Web Open Font Format 2 (WOFF2) files. The WOFF2 files hold the downloaded fonts without loss. Each font includes its SIL Open Font License (OFL) 1.1 text. [Font provenance](docs/font-provenance.json) records the fonts.

Font conversion is optional maintenance. The build uses the checked-in WOFF2 files and does not run Python. Before you use Python with fontTools to convert or verify fonts, update the Brotli package in that Python environment with `python -m pip install --upgrade "Brotli>=1.2.1"`. Brotli 1.2.1 includes the decoder fix. Keep the conversion versions in the font provenance record accurate for the files that they describe. Change that record only after a new conversion, with the new file hashes.

## Game data

`tools/create-original-data.ts` writes `public/data/game.json`. Do not edit `game.json` by hand. Edit the generator. Run `npm run data:generate`.

The generator does not write the game data if one of these conditions occurs:

- An identifier (ID) in `roomPaintings` in `src/model.ts` has no approved master.
- `dataProblems` in `src/content.ts` reports a problem. `dataProblems` checks the board, preparation blocker batches, room states, decoration slots, chains, and recipes. `dataProblems` also checks the cast, quests, quest discovery, campaign funds, story, menu prices, and the levers of the day. `dataProblems` also checks the calendar: the weather rules, the holidays, Lent, the chapter dates, the quest dates, the March quests, the outdoor quests, and the seasonal chains. The dated graph check finds the earliest day of each preparation and quest: the last preparation comes before the closing of 30 April, and each March quest can open in March. Each meal must fit in one weekday, and only Vlad and Elisabeta book an evening. Every preparation needs two or three blockers with stable IDs, valid art cells, context, and ingredients from an available chain. The prologue check gives the events, their boards and blockers, their quests and scenes, the merge limits, the diets, and the starting gift. The first event must make a new game, and the initial board must make a start of act 1, that pass the save validation.

The data checks require these items:

- A complete merge path of four to six dishes for each chain.
- One source unlock for each later chain, and a season with a free source for each seasonal chain.
- Recipes that nest one level deep and use at most three chains.

Each price follows the formula, and each mixed dish has every tag of its parts. Initial blockers must use valid atlas cells. A regular's quest must open after the regular arrives and ask for a favourite dish. No quest breaks a diet. The work value of the quests before each preparation pays for that preparation.

The game runs `dataProblems` when the game starts, before the game reads the save. The game does not have the asset records, so the game does not check the decoration image names.

`PRODUCT.md` gives the placement rules of the preparation blockers. The save validator checks earned IDs, placement order, unique active positions, discovery, and the limit of three active blockers. Ordinary production can use the free cells that placement leaves. So the validator does not require four free cells in a save.

## Manual checks

`npm run saves:checkpoints` writes 25 saves to `tmp/checkpoint-saves/`, one for each number of paid preparations. A file name gives that number and the next preparation, for example `12-next-clear-the-courtyard.json`. Each save holds the exact coins and the delivered quests for the next preparation. Each save holds no unread scene from an earlier payment. So a payment shows only the scenes that the payment earns.

The finished save holds the scene of preparation 24 and the closing scene of chapter 6. The finished save also holds the coins for the ingredients of the supper. Import a save with Import saved game in Options. Pay for the next preparation to see its story and reveal. These saves do not measure campaign balance.

`node tools/campaign-balance.ts` runs a reproducible campaign balance check. The [economy record](docs/economy.md) explains the report and the limits of the check. [Verification](docs/verification.md) gives the coverage of the automated checks.
