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

- `src/` holds the three runtime modules and the stylesheet.
  `engine.ts` holds the rules, `storage.ts` holds the saves, and `app.ts` holds the interface.
  Keep the rules and the saves free of Document Object Model (DOM) access.
- `public/` holds the shipped image variants, fonts, and game data.
  `assets/variants/` holds AV1 Image File Format (AVIF) and WebP images.
  `assets/fonts/` holds the fonts, and `data/game.json` holds the game data.
  `public/assets/original/` holds the 40 Portable Network Graphics (PNG) masters of those variants. The build does not ship the masters.
- `tools/create-original-data.ts` authors `public/data/game.json`.
  Edit the generator.
  Run `npm run data:generate`.
- Git ignores the local folders `private/`, `analysis/`, `.release/`, and `.tools/`.
  `analysis/` holds the build manifest and the art-generation candidates.
  Do not read `private/` or `analysis/` as an input for source code, content, art, or tests.

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
The Pages workflow runs the type check, the Node.js tests, and the build. It does not run the browser tests.
Run `npm run quality:full` before a push.
Do not say that a check passed if the script is not in `package.json`.
Do not say that a check passed if you did not run it.

## Code style and names

Use TypeScript 7 in strict mode for runtime modules, Node.js tools, tests, and skill scripts.
The skill installation script uses PowerShell.
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
Give each test a name that tells its behavior.
Add a regression test for each defect.
The game supports only Chromium-based browsers. The full browser suite runs on Chromium under `/scary-snacks/`, the GitHub Pages path. The asset and path test also runs at the root path.
Examine both themes at the desktop size and the phone size.
A test that passes does not show visual quality. Examine the changed interface.

## Commit and pull request guidelines

Start each commit subject with an imperative verb, and keep it short.
Do not commit, push, deploy, rename the repository, or change the Git history unless the user tells you to.
When the behavior or the design changes, update the owner documents.
For a change that the user can see, give browser evidence.

## Assets, security, and deployment

The 40 PNG masters in `public/assets/original/` have records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.
After a master changes, run `npm run assets:build`.
The command uses Sharp, a development dependency, to make the AVIF and WebP variants in `public/assets/variants/`.
The command records the variants in `docs/asset-variants.json`.
The asset test compares each master and each variant with its record.
The asset test fails on a variant that an older master made.
The build ships only the variants. The build stops on a file in that folder that is not an AVIF or WebP image.
Keep candidates, rejected images, and previews out of that folder.
Use [`generate-game-art`](.github/skills/generate-game-art/SKILL.md) for bitmap art.
Use [`generate-game-art-openai`](.github/skills/generate-game-art-openai/SKILL.md) only when the user requests the OpenAI Images application programming interface (API).
Give the generator only text prompts and images that this project generated.
Use only fonts that are self-hosted with their license texts. Do not copy assets from websites.

Do not commit secrets.
`.env.local` holds the local OpenAI key. Git must ignore it.
Do not print the key.
Do not put the key in a command argument.

The Pages workflow runs on every push to `main` and publishes only `dist/`.
The repository's Pages source must stay set to GitHub Actions.
Keep relative Uniform Resource Locators (URLs) so that the game runs at a repository subdirectory.
`docs/release-notes.md` gives the release limits. A skill or a record does not give legal clearance.

## Agent workflow

When you answer the user, use short sentences and plain words.
Write the owner documents, the records, and the skills in ASD-STE100 Simplified Technical English.
The create-skill skill gives the writing rules.

Use [`.github/skills/SKILLS.md`](.github/skills/SKILLS.md) as the index of the repository skills.
Before important work, select the applicable workflow from that index.
Repository skills do not increase the approval that the user gave.
Reviews, audits, and diagnosis do not change files unless the user tells you to make a change.
To show the skills to the skill discovery tools, run `pwsh -File .github/scripts/setup-skill-links.ps1`.
[`.github/copilot-instructions.md`](.github/copilot-instructions.md) and [`CLAUDE.md`](CLAUDE.md) point to this file.
Change the rules only here.
