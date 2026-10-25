# Repository Guidelines

## Owner documents

[`PRODUCT.md`](PRODUCT.md) controls the product.
[`DESIGN.md`](DESIGN.md) controls the design.
[`DELIVERY.md`](DELIVERY.md) controls the delivery.
[`README.md`](README.md) gives only a short description of the game and the commands to build, run, and test it.
The records in `docs/` give evidence and release limits. They do not change a contract.
When you change a contract, change the owner document in the same task.
Write only the current state in documents, specifications, skills, tests, and comments.
Do not keep retired items, dated results, audit figures, or notes about an earlier state.
Git history keeps the past.

## Project structure

- `src/` holds the runtime modules and the stylesheet.
  The rules are in three modules. `model.ts` holds the content and state types and the read-only game queries.
  `engine.ts` holds the new game, the actions, and the save validation. `content.ts` holds the checks of the game data.
  `storage.ts` holds the saves.
  Keep the rules and the saves free of Document Object Model (DOM) access.
  `session.ts` holds the game of the tab, its saves, and the lock between tabs. `app.ts` opens the game and draws it after each change.
  Each interface module holds one part of the page: `board.ts`, `tickets.ts`, `story.ts`, `room.ts`, `night.ts`, `dishes.ts`, and `options.ts`.
  `dom.ts`, `art.ts`, `dialog.ts`, and `preferences.ts` hold the shared interface parts.
- `public/` holds the shipped image variants, fonts, and game data.
  `assets/variants/` holds AV1 Image File Format (AVIF) and WebP images.
  `assets/fonts/` holds the fonts, and `data/game.json` holds the game data.
  `public/assets/original/` holds the 141 Portable Network Graphics (PNG) masters of those variants. The build does not ship the masters.
- `tools/` holds the Node.js tools. They build the game, serve it, and write the game data.
  They also make the image variants, write the checkpoint saves, check the campaign balance, and export the source.
  `tools/create-original-data.ts` writes `public/data/game.json`.
  To change the game data, edit the generator.
  Then run `npm run data:generate`.
- `tests/` holds the Node.js tests. `tests/browser/` holds the Playwright browser tests.
  `tests/support.ts` and `tests/browser/support.ts` hold the shared test helpers.
- `docs/` holds the records and the feature specifications.
- `.github/` holds the repository skills, the skill link script, and the Pages workflow.
- `.tools/` holds only local tools and scripts for repeated use.
  Use `tmp/` for script artifacts, scripts for one task, temporary analysis, and results.
  Configure local tools to write these files to `tmp/`.
- Git ignores the local folders `private/`, `analysis/`, `.release/`, `.tools/`, `.impeccable/`, and `tmp/`.
- `analysis/` holds only files that later work uses again. It is not a second `tmp/`.
  It holds `build-manifest.json`, which the build writes.
  `analysis/art-generation/references/` holds the reference images of `docs/asset-provenance.json` that the game does not ship.
  Each other folder in `analysis/art-generation/` holds one art task that is not complete.
  When the user accepts or rejects each candidate of an art task, the task is complete.
  Then copy each new reference image to `references/`.
  Then move the task folder to `tmp/`.
  Put logs, previews, review notes, handoffs, rejected candidates, and scripts for one task in `tmp/`, not in `analysis/`.
  Keep a mask that the art helper reads in its task folder. The helper reads masks only from `analysis/art-generation/`.
  Do not add other files or folders to `analysis/`.
  Do not read `private/` or `analysis/` as an input for source code, content, or tests.
  An art task can use the images in `analysis/art-generation/` as generator inputs. The art skills give the procedure.

## Public and private documents

Each tracked file is public.
`private/docs/` holds the private documents. Code and tests must never read a file in `private/`.
In a tracked file, do not name another game, a file in `private/`, or reverse-engineering tools or work.
Put that information in `private/docs/`.

## Build, test, and development commands

For the usual verification, run `npm run typecheck` and `npm test` in the requested scope.
For a change that the user can see, also run `npm run build` and then `npm run test:browser`.
The browser tests serve `dist/`, so a run without a new build examines an old artifact.
Install the browser once with `npx playwright install chromium`.
`npm run quality:full` is the full gate. Use [`run-quality-gate`](.github/skills/run-quality-gate/SKILL.md) for it.
Run `npm run quality:full` before a push.
[`DELIVERY.md`](DELIVERY.md) gives the checks that the Pages workflow runs.
Do not say that a check passed if the script is not in `package.json`.
Do not say that a check passed if you did not run it.

## Code style and names

Use TypeScript 7 in strict mode for runtime modules, Node.js tools, tests, and skill scripts.
The skill link script uses PowerShell.
Do not add a `.js` or `.mjs` file.
Node.js runs `.ts` files directly. Use only syntax that Node.js can remove: no enums, namespaces, or parameter properties.
Give each relative import its `.ts` extension.
Use `import type` for types.
The repository has no formatter and no linter. Match the style of the file that you change.
Do not add a runtime package, a backend, or a network call to another origin.
Render text that the game or a save provides with `textContent`.
Do not add code that is not necessary.

## Test guidelines

Give each Node.js test file a name that tells its area, for example `storage.test.ts`.
Put a helper that more than one test file uses in the shared helper file of its test kind.
Give each test a name that tells its behavior.
Add a regression test for each defect.
The game supports only Chromium-based browsers. The full browser suite runs on Chromium under `/scary-snacks/`, the GitHub Pages path. The asset and path test also runs at the root path.
Run each browser test in headless mode if the tool allows it.
This rule applies to the Playwright suite and to the browser checks in `npm run quality:full`.
This rule also applies to one-time browser checks that you run from the chat.
Use a headed browser only if a check cannot run headless. Tell the user why.
Examine both themes at the desktop size and the phone size.
A test that passes does not show visual quality. Examine the changed interface.

## Commit and pull request guidelines

Start each commit subject with an imperative verb.
Keep the subject short.
Do not commit, push, deploy, rename the repository, or change the Git history unless the user tells you to.
If the behavior or the design changes, update the owner documents.
For a change that the user can see, give browser evidence.

## Assets, security, and deployment

The 141 PNG masters in `public/assets/original/` have records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.
After a master changes, run `npm run assets:build`.
The command uses Sharp, a development dependency, to make the AVIF and WebP variants in `public/assets/variants/`.
The command encodes only the masters that are new or changed. It keeps each variant that agrees with its record, and it removes the variants that no plan names.
After a change to Sharp or to the encoder settings, the command encodes all masters again. To encode all masters in other conditions, run `npm run assets:build -- --all`.
The command records the variants in `docs/asset-variants.json`.
The asset test compares each master and each variant with its record.
The asset test fails on a variant that the current master did not make.
The build ships only the variants. The build stops on a file in that folder that is not an AVIF or WebP image.
Keep candidates, rejected images, and previews out of that folder.
Use [`generate-game-art`](.github/skills/generate-game-art/SKILL.md) for bitmap art.
Use [`generate-game-art-openai`](.github/skills/generate-game-art-openai/SKILL.md) only if the user requests the OpenAI Images application programming interface (API).
Use only fonts that are self-hosted with their license texts. Do not copy assets from websites.

Do not commit secrets.
`.env.local` holds the local OpenAI key. Git must ignore it.
Do not print the key.
Do not put the key in a command argument.

[`DELIVERY.md`](DELIVERY.md) gives the GitHub Pages rules.
`docs/release-notes.md` gives the release limits. A skill or a record does not give legal clearance.

## Agent workflow

When you answer the user, use short sentences and plain words.
Write the owner documents, the records, and the skills in ASD-STE100 Simplified Technical English.
The create-skill skill gives the writing rules.

Use [`.github/skills/SKILLS.md`](.github/skills/SKILLS.md) as the index of the repository skills.
Before important work, select the applicable skill from that index.
Repository skills do not increase the approval that the user gave.
Reviews, audits, and diagnosis do not change files unless the user tells you to make a change.
You can present your own ideas for the product, the story, the content, and the art to the user at any time.
An idea goes into a document or the game data only after the user approves it.
To let the skill discovery tools find the skills, run `pwsh -File .github/scripts/setup-skill-links.ps1`.
The script makes the ignored folder links `.claude/skills`, `.agents/skills`, and `.codex/skills`.
[`.github/copilot-instructions.md`](.github/copilot-instructions.md) and [`CLAUDE.md`](CLAUDE.md) refer to this file.
Change the rules only here.
