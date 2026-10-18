# Delivery

## Tools

The source is TypeScript 7 in strict mode, HyperText Markup Language (HTML), and Cascading Style Sheets (CSS). The repository has no JavaScript source files. Node.js 24 runs the tools and the tests from the `.ts` files directly. The build removes the types from the three runtime modules and publishes them as browser scripts in `dist/`. `npm run typecheck` runs the compiler without output.

Playwright, TypeScript, Sharp (for image variants), Fallow (for dead code), and the Node.js type definitions are development dependencies.

`npm run deadcode` runs Fallow on the module graph. The check fails on an unused file, export, type, or dependency, and on an import that Fallow cannot resolve. `.fallowrc.json` gives the entry points that Fallow cannot find and the runtime URLs that the build resolves.

`npm run preview` serves `dist/` at http://127.0.0.1:4178. `npm run dev` serves the source. To serve at a subdirectory, set `BASE_PATH` to `/scary-snacks/` before you start the server. The address then becomes http://127.0.0.1:4178/scary-snacks/.

## GitHub Pages

The game has no backend and no runtime dependency. Relative Uniform Resource Locators (URLs) support a repository subdirectory. The deployment address is https://satyrlord.github.io/scary-snacks/.

The workflow in `.github/workflows/pages.yml` runs on every push to `main`. A person can also start the workflow manually. The workflow runs the type check and the Node.js tests, builds the game, and uploads only `dist/`. The workflow does not run the browser tests.

The Pages source of the repository must stay set to GitHub Actions. A branch deployment serves the source tree, and the source tree cannot run.

The site is public. The release limits apply. See [release notes](docs/release-notes.md). The project gives no legal clearance and no guarantee against claims.

## Source export

`npm run release:source` prepares `.release/scary-snacks-source/` from an explicit file list. The export has no Git history and nothing from the local folders `private/` and `analysis/`. The export excludes the feature specifications, repository skills, and skill-specific tests. The export keeps the `.gitignore` of the repository. The export is suitable for review or for a new repository. The export does not remove public copies that exist.

## Assets

40 Portable Network Graphics (PNG) masters in `public/assets/original/` are the source of the game art. The game ships AV1 Image File Format (AVIF) and WebP variants of the masters, at the sizes that the screens need. The variants come only from these masters. The local folders `private/` and `analysis/` are not release inputs.

The transparent board-clutter atlas has six open-center overlays in square cells. The preparation-clutter atlas has 12 contextual overlays with transparent centers, in a four-by-three grid of 1448 by 1086 pixels. The chat image generator made the preparation-clutter atlas, and it ships one WebP variant at its original size. Red wine (`drinks_5`) uses its own transparent picture instead of its cell in the menu atlas.

After a master changes, run `npm run assets:build`. [Asset variants](docs/asset-variants.json) records the files, the sizes, and the hashes.

[Asset provenance](docs/asset-provenance.json) records the masters and their hashes. [Prompts](docs/asset-prompts.json) records the generation instructions. The repository skill `generate-game-art` gives the procedure to add or replace a master, including a room painting.

The game makes its sounds as procedural browser tones. The interface text uses the font Inter. The blackletter branding uses the font Grenze Gotisch. The project self-hosts both fonts as Web Open Font Format 2 (WOFF2) files, which are lossless repackagings of the downloaded fonts. Each font includes its SIL Open Font License (OFL) 1.1 text. [Font provenance](docs/font-provenance.json) records the fonts.

## Game data

`tools/create-original-data.ts` writes `public/data/game.json`. Do not edit `game.json` by hand. Edit the generator. Run `npm run data:generate`.

The generator refuses to write the game data in these conditions:

- An ID in `roomPaintings` in `src/engine.ts` has no approved master.
- `dataProblems` in `src/engine.ts` reports a problem. It checks the board, preparation blocker batches, room states, decoration slots, and production tiers. It also checks the cast, quests, campaign funds, story, and menu prices. Every preparation needs two or three blockers with stable IDs, valid art cells, context, and ingredients from an available chain. The starting board must make a new game that passes the save validation.

The data checks require a complete six-stage merge path for each chain and one source unlock for each later chain. Initial blockers must use valid atlas cells. A regular's quest must open after the regular arrives and request a dish from a favourite chain.

Data generation validates prerequisites, shared companions, finishes, follow-up scenes, the quest order, and the campaign funds. The visitor, guest, and regulars portrait atlases each ship one 640-by-640 WebP variant.

The game runs `dataProblems` when it starts, before it reads the save. The game does not have the asset records, so it does not check the decoration image names.

Preparation blocker placement and its waiting queue use the engine's shared blocked-cell rules. The save validator checks earned IDs, placement order, unique active positions, discovery, and the limit of three active blockers. A cell can take a new blocker after its earlier blocker is resolved.

The validator does not require three empty cells in a save, because ordinary production can use the space that placement leaves.

## Manual checks

`npm run saves:checkpoints` writes 25 saves to `.tools/checkpoint-saves/`, one for each number of paid preparations. A file name gives that number and the next preparation, for example `12-next-clear-the-courtyard.json`. Each save holds the exact coins and the delivered quests for the next preparation. It holds no waiting scene from an earlier payment, so a payment shows only the scenes that it earns.

The finished save holds the scene of preparation 24, the closing scene of chapter 6, and the finale. Import a save from Options. Pay for the next preparation to see its story and reveal. These saves do not measure campaign balance.

`node tools/campaign-balance.ts` runs a reproducible campaign balance check. The [economy record](docs/economy.md) explains its report and its limits. [Verification](docs/verification.md) gives the coverage of the automated checks.
