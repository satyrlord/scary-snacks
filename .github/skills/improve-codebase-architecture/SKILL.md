---
name: improve-codebase-architecture
description: Review Scary Snacks ownership, module boundaries, coupling, data flow, and test boundaries, and improve them. Use for structural problems, edits across many files, rules in the view layer, or an architecture defect.
---

# Improve the architecture

## Select the mode

- **Analysis:** Use this mode unless the user tells you directly to make the change.
  Inputs: the area to examine, or the whole repository.
  Approval: none. The mode changes no file.
  Files to change: none.
  Output: the ranked candidates, each with evidence and a verification step.
  Complete when each candidate has evidence, a rating, and a verification step.
- **Implementation:** Use this mode only after the user tells you to make a named change.
  Inputs: the approved candidate and its scope.
  Approval: the instruction of the user for that candidate. Repository skills do not increase it.
  Files to change: only the source code, the tests, and the owner documents in the approved scope.
  Output: the changed files and the checks.
  Complete when ownership, contracts, and tests agree, and the verification step of the candidate passes.

If the user changes the scope, select the mode again before the next edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In that condition, give each edit or check that you did not complete in the report.

## Map the system

Read `PRODUCT.md`, `DESIGN.md`, `DELIVERY.md`, `package.json`, `playwright.config.ts`, and the source code in the working tree.
Map the selected behavior across these owners:

- `src/engine.ts`: the rules, the state, and the state validation.
- `src/storage.ts`: the save, load, export, import, and reset behavior.
- `src/app.ts`, `src/style.css`, and `index.html`: the view, the input, the themes, and the sound.
- `tools/create-original-data.ts` and `public/data/game.json`: the game data.
- `tools/build.ts`, `tools/server.ts`, and `tools/export-source.ts`: the build, the server, and the source export.
- `tests/` and `.github/workflows/pages.yml`: the checks and the deployment.

Follow one typical action from its input event to the result that the user can see.
Record each problem of ownership, coupling, navigation, lifecycle, or testability.
Give the file evidence for each problem.

## Examine the candidates

- Removal: examine the callers without the boundary. If the callers become larger or more difficult to read, keep the boundary.
- Result: the boundary must decrease the information that the callers need.
- Locality: code and contracts that change together must have one owner.
- Dependencies: the engine must not use the Document Object Model (DOM), storage, sound, or rendering.
  The storage module must not use the DOM. It receives the browser storage from `src/app.ts`.
- Determinism: the engine has no random values and no clock values.
  Each run with the same state and the same actions must give the same result.
- One value, one owner: one function must give a value that the interface shows and the engine applies.

Do not add a repository, service, manager, wrapper, port, or adapter for one operation.
Do not add a runtime package, a backend, or a network call to another origin.
`AGENTS.md` controls these limits.

## Rank the candidates

For each candidate, give these items:

- The files and the problem at this time.
- The evidence.
- The new owner and the changes to responsibilities.
- The result, the risk, and the effect on contracts.
- The verification step.
- The rating: `Strong`, `Worth exploring`, or `Speculative`.

Put the candidates in sequence. Give the candidates with the `Strong` rating first.
In analysis mode, stop before you design or edit.

## Implement an approved change

Give the responsibilities and the items that the change does not include.
Compare the possible alternatives.
Update the owner document only if its contract changes.
Add boundary tests.
If you add, move, or remove a file, examine `runtimeFiles` in `tools/build.ts`.
Examine the file list in `tools/export-source.ts` also.
Update each list that names the file.

Run `npm run typecheck` and `npm test` for the usual verification.
For a change in the runtime files, run `npm run build` and then `npm run test:browser`.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.
