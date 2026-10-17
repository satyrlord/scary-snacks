# Delivery

## Tools

The source is TypeScript 7 in strict mode. Node.js 24 runs the tools and the tests from the `.ts` files directly. The build publishes the three runtime modules as browser scripts in `dist/`. `npm run typecheck` runs the compiler without output.

`npm run preview` serves `dist/` at http://127.0.0.1:4178. `npm run dev` serves the source. To serve at a subdirectory, set `BASE_PATH` to `/scary-snacks/` before you start the server. The address then becomes http://127.0.0.1:4178/scary-snacks/.

## GitHub Pages

The game has no backend and no runtime dependency. Relative Uniform Resource Locators (URLs) support a repository subdirectory. The game is live at https://satyrlord.github.io/scary-snacks/.

The workflow in `.github/workflows/pages.yml` runs on every push to `main`. A person can also start the workflow manually. The workflow runs the type check and the Node.js tests, builds the game, and uploads only `dist/`. The workflow does not run the browser tests. Run `npm run quality:full` before a push.

The Pages source of the repository must stay set to GitHub Actions. A branch deployment serves the source tree, and the source tree cannot run.

The site is public. The release limits apply. See [release notes](docs/release-notes.md). The project gives no legal clearance and no guarantee against claims.

## Source export

`npm run release:source` prepares `.release/scary-snacks-source/` from an explicit file list. The export has no Git history and nothing from the local folders `private/` and `analysis/`. The export excludes the feature specs, the repository-only skills, and their tests. The export keeps the `.gitignore` of the repository. The export is suitable for review or for a new repository. The export does not remove public copies that exist.

## Assets

34 Portable Network Graphics (PNG) masters in `public/assets/original/` are the source of the game art. The game ships AV1 Image File Format (AVIF) and WebP variants of the masters, at the sizes that the screens need. The transparent board-clutter atlas has four clutter pictures and two overlays in six square cells. After a master changes, run `npm run assets:build`. [Asset variants](docs/asset-variants.json) records the files, the sizes, and the hashes.

[Asset provenance](docs/asset-provenance.json) records the masters and their hashes. [Prompts](docs/asset-prompts.json) records the generation instructions. The repository skill `generate-game-art` gives the procedure to add or replace a master, including a room painting.

The game makes its sounds as procedural browser tones. The interface text uses the font Inter. The blackletter branding uses the font Grenze Gotisch. The project self-hosts both fonts as Web Open Font Format 2 (WOFF2) files, each with its SIL Open Font License (OFL) 1.1 text. [Font provenance](docs/font-provenance.json) records the fonts.

## Game data

`tools/create-original-data.ts` writes `public/data/game.json`. Do not edit `game.json` by hand. Edit the generator, and run `npm run data:generate`.

The generator refuses to write the game data in these conditions:

- An ID in `roomPaintings` in `src/engine.ts` has no approved master.
- `dataProblems` in `src/engine.ts` reports a problem. It checks the board, the room states, the decoration slots, the production tiers, the level rewards, the quests, the campaign goals, and the menu prices. The starting board must make a new game that passes the save validation.

The cast has four ordinary neighbours and four visitors: Adrian, Monica, Janos, and Ionatan. Nine optional cathedral supply quests use authored preparation, ordinary-service, and previous-delivery gates. Ionatan has one independent dinner quest, after preparation 16 and 120 ordinary services. It pays 1,100 coins, five times the dinner menu value. Completed quest IDs record his departure. The journal omits him before arrival and after departure. Data generation validates their prerequisites. The visitor portrait atlas uses built-in in-chat image generation and ships one 640-by-640 WebP variant. Current saves need no conversion or new fields.

The game runs `dataProblems` when it starts, before it reads the save. The game does not have the asset records, so it does not check the decoration image names.

## Manual checks

`npm run saves:checkpoints` writes 25 saves to `.tools/checkpoint-saves/`, one for each number of paid preparations. A file name gives that number and the next preparation, for example `12-next-clear-the-courtyard.json`. Each save holds the exact coins, service, and merges for the next preparation. It holds no waiting scene from an earlier payment, so a chapter boundary shows only its own closing scene. The finished save holds the closing scene of chapter 6 and the finale. Import a save from the House book, and pay to see the story and the reveal. These saves do not measure campaign balance.

`node tools/campaign-balance.ts` runs a reproducible campaign balance check. The [economy record](docs/economy.md) explains its report and its limits. [Verification](docs/verification.md) gives the coverage of the automated checks.
