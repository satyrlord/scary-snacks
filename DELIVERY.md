# Delivery

## Tools

The source is TypeScript 7 in strict mode, Hypertext Markup Language (HTML), and Cascading Style Sheets (CSS). The repository has no JavaScript source files. Node.js 24.2 or newer runs the tools and the tests from the `.ts` files directly. The build removes the types from the runtime modules and publishes them as browser scripts in `dist/`. `npm run typecheck` runs the compiler without output.

Playwright, TypeScript, Sharp (for image variants), Fallow (for dead code), and the Node.js type definitions are development dependencies.

`npm run deadcode` runs Fallow on the module graph. The check fails on an unused file, export, type, or dependency, and on an import that Fallow cannot resolve. `.fallowrc.json` gives the entry point that Fallow cannot find. It also lists the runtime paths that the build resolves and that Fallow cannot resolve.

`npm run preview` serves `dist/` at http://127.0.0.1:4178. `npm run dev` serves the source. To serve at a subdirectory, set `BASE_PATH` to `/scary-snacks/` before you start the server. The address then becomes http://127.0.0.1:4178/scary-snacks/.

## Version

The version has the form major.minor.build. The `version` field in `package.json` gives the major and minor versions. Change them manually. The build ignores the third part of that field. The build number is the count of commits in `HEAD` (`git rev-list --count HEAD`). Each new commit thus increases the build number by one. The build and `npm run dev` write the version into the `app-version` meta element of the page. Options shows the version. A copy without Git history, for example the source export, has build number 0. The build stops in a shallow clone, because a shallow clone does not have the full count.

## GitHub Pages

The game has no backend and no runtime dependency. Relative Uniform Resource Locators (URLs) support a repository subdirectory. The deployment address is https://satyrlord.github.io/scary-snacks/.

The workflow in `.github/workflows/pages.yml` runs on every push to `main`. A person can also start the workflow manually. The workflow gets the full Git history for the build number. The workflow runs the type check and the Node.js tests, builds the game, and uploads only `dist/`. The workflow does not run the dead-code check or the browser tests.

The Pages source of the repository must stay set to GitHub Actions. A branch deployment serves the source tree, and the source tree cannot run.

The site is public. The [release notes](docs/release-notes.md) give the release limits.

## Source export

`npm run release:source` prepares `.release/scary-snacks-source/` from an explicit file list. The export has no Git history and nothing from the local folders `private/` and `analysis/`. The export excludes the feature specifications, repository skills, and skill-specific tests. The export keeps the `.gitignore` of the repository. The export is suitable for review or for a new repository. The export does not remove an existing public copy.

## Assets

93 Portable Network Graphics (PNG) masters in `public/assets/original/` are the source of the game art. The game ships variants of the masters in AV1 Image File Format (AVIF) and WebP. The sizes of the variants fit the screens. The variants come only from these masters. The local folders `private/` and `analysis/` are not release inputs.

The transparent board-clutter atlas has six open-center overlays in square cells. The preparation-clutter atlas has 12 contextual overlays with transparent centers, in a four-by-three grid of 1448 by 1086 pixels. The chat image generator made the preparation-clutter atlas. The atlas ships as one WebP variant at its original size. The core, visitor, guest, and three regulars portrait atlases and the mascot atlas each ship one 640-by-640 WebP variant.

The OpenAI Images API made the 16 food atlases: one for each chain and four for the mixed dishes. Each is a transparent grid of 4 by 2 cells, 2048 by 1024 pixels, and ships one 1024 by 512 WebP variant. Alpha cuts, moves, box clears, and cell copies between candidates correct them. No pixel is painted.

The OpenAI Images API made the two rat sheets, the rat hole, and the night sky. Each rat sheet is a transparent grid of 4 by 2 cells, 2048 by 1024 pixels, from an accepted identity reference of its rat, and ships one 1024 by 512 WebP variant. A cell trim clears the parts of the thief rat poses that crossed a cell line. No pixel is painted. The rat hole is a transparent 1024px square and ships one 256px WebP variant. The night sky is opaque, 2048 by 1024 pixels, and ships one 1024 by 512 WebP variant.

After a master changes, run `npm run assets:build`. [Asset variants](docs/asset-variants.json) records the files, the sizes, and the hashes.

The built-in chat image generator made the parchment, 17 of the 22 character sketches, and seven of the 11 quest scenes. The OpenAI Images API made the sketches of Sorin, Cătălina, Mina, Bran, and Victor, and four quest scenes, with project-generated chat drawings as references. Bran's sketch and the four scenes are drawn on white paper, and a fixed conversion makes the paper transparent. A masked edit draws the mouth of Victor's sketch, and the same conversion makes that region transparent. The parchment is 1254px square. Character masters are square and at least 1024px; scene masters are 1536 by 1024px. The parchment ships as one native-size WebP. Characters ship as transparent 768px square WebP, and scenes ship as transparent 1024 by 683px WebP. Introductions use individual sketches. Quest openings, replies, and replays prefer their registered scene illustration and otherwise use the owner's sketch. All installed masters have explicit user acceptance.

[Asset provenance](docs/asset-provenance.json) records the masters and their hashes. [Prompts](docs/asset-prompts.json) records the generation instructions. The repository skill `generate-game-art` (repository only) gives the procedure to add or replace a master. The procedure covers a room painting.

The game makes its sounds as tones that code generates in the browser. The interface text uses the font Inter. The wordmark uses the font Grenze Gotisch. The project self-hosts both fonts as Web Open Font Format 2 (WOFF2) files. The WOFF2 files hold the downloaded fonts without loss. Each font includes its SIL Open Font License (OFL) 1.1 text. [Font provenance](docs/font-provenance.json) records the fonts.

## Game data

`tools/create-original-data.ts` writes `public/data/game.json`. Do not edit `game.json` by hand. Edit the generator. Run `npm run data:generate`.

The generator refuses to write the game data in these conditions:

- An identifier (ID) in `roomPaintings` in `src/model.ts` has no approved master.
- `dataProblems` in `src/content.ts` reports a problem. It checks the board, preparation blocker batches, room states, decoration slots, chains, and recipes. It also checks the cast, quests, quest discovery, campaign funds, story, menu prices, and the levers of the day. Each quest must fit in one day, and only Vlad and Elisabeta book an evening. Every preparation needs two or three blockers with stable IDs, valid art cells, context, and ingredients from an available chain. The starting board must make a new game that passes the save validation.

The data checks require a complete merge path of four to six dishes for each chain, one source unlock for each later chain, and recipes that nest one level deep and use at most three chains. Each price follows the formula, and each mixed dish has every tag of its parts. Initial blockers must use valid atlas cells. A regular's quest must open after the regular arrives and ask for a favourite dish. No quest breaks a diet, and the work value of the quests before each preparation pays for it.

The game runs `dataProblems` when it starts, before it reads the save. The game does not have the asset records, so it does not check the decoration image names.

`PRODUCT.md` gives the placement rules of the preparation blockers. The save validator checks earned IDs, placement order, unique active positions, discovery, and the limit of three active blockers. The validator does not require four empty cells in a save, because ordinary production can use the space that placement leaves.

## Manual checks

`npm run saves:checkpoints` writes 25 saves to `tmp/checkpoint-saves/`, one for each number of paid preparations. A file name gives that number and the next preparation, for example `12-next-clear-the-courtyard.json`. Each save holds the exact coins and the delivered quests for the next preparation. It holds no scene that waits from an earlier payment. A payment then shows only the scenes that it earns.

The finished save holds the scene of preparation 24 and the closing scene of chapter 6, and the coins for the staples of the supper. Import a save with Import saved game in Options. Pay for the next preparation to see its story and reveal. These saves do not measure campaign balance.

`node tools/campaign-balance.ts` runs a reproducible campaign balance check. The [economy record](docs/economy.md) explains the report and the limits of the check. [Verification](docs/verification.md) gives the coverage of the automated checks.
