---
name: dead-code-audit
description: Audit Scary Snacks reachability and remove dead code, files, assets, data, or dependencies that have evidence. Use for a read-only report, or for a cleanup that the user approved directly.
---

# Audit dead items

A dead item is code, a file, an asset, data, or a dependency that no entry point can reach.

## Select the mode

- Use audit mode unless the user tells you directly to remove dead items.
- Use cleanup mode only after that instruction.

Audit mode:

- Inputs: the scope and the dependency graph.
- Approval: no file change.
- Files: none.
- Output: the status and the evidence for each candidate and each dynamic path.
- Completion: each candidate has a status and evidence.

Cleanup mode:

- Inputs: the scope, the dependency graph, and the evidence for each candidate.
- Approval: the direct instruction of the user to remove dead items.
- Files: only the files that contain dead items and the references to those items.
- Output: the removals, the check results, and the status of each candidate.
- Completion: each removal has evidence and all the related checks pass.

If the user changes the scope, select the mode again before the next edit.
If the user tells you not to run checks, give each check that you did not run in the report.

## Make the dependency graph

Read `PRODUCT.md`, `DESIGN.md`, `README.md`, and `package.json`.
Read `playwright.config.ts`, the tools in `tools/`, and the workflow in `.github/workflows/`.
Examine the repository status.
Record the entry points for production, tests, content, assets, development tools, and deployment:

- `index.html` and the modules that it loads.
- `runtimeFiles` and `fontFiles` in `tools/build.ts`.
- The file list in `tools/export-source.ts`.
- The scripts in `package.json`.
- The test files in `tests/` and `tests/browser/`.

Run `npm test` before you record candidates.

## Find evidence for each candidate

Examine static and dynamic imports and exports.
Examine element identifiers, class names, `data-` attributes, and event names in `index.html` and `src/app.ts`.
Examine Cascading Style Sheets (CSS) selectors, custom properties, and theme tokens in `src/style.css`.
Examine the identifiers and the sprite indexes in `public/data/game.json` and in `tools/create-original-data.ts`.
Examine the records in `docs/asset-provenance.json`, `docs/asset-prompts.json`, `docs/asset-variants.json`, and `docs/font-provenance.json`.
Examine Playwright selectors, workflows, documentation, and contract text that the code does not obey at this time.

A text search with no result does not show that an item is dead.
A string that the code builds at runtime can refer to an item.
If a search gives no result, examine the item.
Give each candidate one of these statuses: `live`, `dead`, or `unresolved`.
Record the evidence for that status.

## Act in the scope

In cleanup mode, remove only the smallest set of dead items that have evidence.
Do not remove save validation, the preservation of malformed saves, or the code for the seeded random number generator.
Keep the provenance records, the license texts, and the prompt records.
Keep the files in `private/`, `analysis/`, `.release/`, and `.tools/`. They are ignored local folders.
Do not edit `public/data/game.json` by hand. Change its generator and run `npm run data:generate`.

After each removal, run the checks that the removal touches.
For the usual verification, run `npm run typecheck` and `npm test`.
For a removal in the runtime files, run `npm run build` and then `npm run test:browser`.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.

## Complete the task

In the report, give the status of each candidate and of each dynamic path.
Do not give a clean audit result if a necessary tool or path has no verification.
Complete the mode when its completion condition is true.
