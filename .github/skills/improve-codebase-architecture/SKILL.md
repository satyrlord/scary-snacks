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
  Approval: the instruction of the user for that candidate.
  Files to change: only the source code, the tests, and the owner documents in the approved scope.
  Output: the changed files and the checks.
  Complete when ownership, contracts, and tests agree, and the verification step of the candidate passes.

If the user changes the scope, select the mode again before the next edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In that condition, give each edit or check that you did not complete in the report.

## Map the system

Read `PRODUCT.md`, `DESIGN.md`, `DELIVERY.md`, `package.json`, `playwright.config.ts`, and the source code in the working tree.
Map the selected behavior across these owners:

- `src/model.ts`, `src/engine.ts`, and `src/content.ts`: the types, the rules, the state validation, and the data checks.
- `src/storage.ts`: the save, load, export, import, and reset behavior.
- `src/session.ts`: the game of the tab, its writes, and the lock between tabs.
- `src/app.ts`, the interface modules, `src/style.css`, and `index.html`: the view, the input, the themes, and the sound.
  `AGENTS.md` gives the owner of each interface module.
- `tools/create-original-data.ts` and `public/data/game.json`: the game data.
- `tools/build.ts`, `tools/server.ts`, and `tools/export-source.ts`: the build, the server, and the source export.
- `tests/` and `.github/workflows/pages.yml`: the checks and the deployment.

Follow one typical action from its input event to the result that the user can see.
Record each problem of ownership, coupling, navigation, lifecycle, or testability.
Give the file evidence for each problem.

## Examine the candidates

- Removal: imagine the callers without the boundary. If the callers become larger or harder to read, keep the boundary.
- Gain: the boundary must reduce the information that the callers need.
- Locality: code and contracts that change together must have one owner.
- Dependencies: the engine must not use the Document Object Model (DOM), storage, sound, or rendering.
  The storage module must not use the DOM. The storage module receives the browser storage from `src/session.ts`.
- Determinism: the engine must have no random source and no wall-clock values.
  The session gives a new game its random seed, and only the seed in the state drives a random outcome.
  The same state and the same actions must give the same result.
- One value, one owner: one function must give a value that the interface shows and the engine applies.

Do not add a repository, service, manager, wrapper, port, or adapter for one operation.
`AGENTS.md` gives the limits on packages, backends, and network calls.

## Rank the candidates

For each candidate, give these items:

- The files and the problem at this time.
- The evidence.
- The new owner and the changes to responsibilities.
- The result, the risk, and the effect on contracts.
- The verification step.
- The rating: `Strong`, `Worth exploring`, or `Speculative`.

Put the candidates in order. Put the candidates with the `Strong` rating first.
In analysis mode, stop before you design or edit.

## Implement an approved change

Give the responsibilities and the items that the change does not include.
Compare the possible alternatives.
Update the owner document only if its contract changes.
Add boundary tests.
If you add, move, or remove a file, examine `runtimeFiles` in `tools/build.ts`.
Also examine `sourceFiles` in `tools/export-source.ts`.
Update each list that names the file.

Run the checks that `AGENTS.md` gives for the scope.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.
