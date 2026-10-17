---
name: full-code-review
description: Review a Scary Snacks diff, branch, or checkout for correct behavior, safety, architecture, tests, and maintainability. Repair the findings only when the user tells you to.
---

# Review Scary Snacks code

## Select the mode

- Use review mode unless the user tells you directly to repair findings.
- Use repair mode only after that instruction.

Review mode:

- Inputs: the diff, the branch, or the checkout, and the owner documents.
- Approval: no file change.
- Files: none.
- Output: the findings in order, and a status for each selected path.
- Completion: each selected path has a status and each finding has a verification step.

Repair mode:

- Inputs: the findings that have evidence and that the user approved.
- Approval: the instruction of the user to repair findings.
- Files: only the files that the repair of those findings needs.
- Output: the changed files, one regression test for each repair, and the check results.
- Completion: each repaired finding passes its verification step.

If the user changes the scope, select the mode again before the next edit.
If the user prohibits edits, use review mode.
If the user tells you not to run checks, give each check that you did not run in the report.

## Find the scope

Examine the status, the staged diff, the unstaged diff, the untracked files, and the last commits.
Give each changed path a type.
Do not change work that is not part of the review.

For a diff review, read each changed file.
For a checkout review, record and read each file in the selected scope.
Also read the owner document, callers, consumers, tests, generated outputs, and deployment inputs.
For each changed contract, find the evidence.

## Examine the contracts

Examine each applicable area:

- Keep the rules in `src/engine.ts` deterministic.
  Keep them free of Document Object Model (DOM) access, storage access, and clock values.
- Confirm that an action that is not correct or not available does not change the state.
- Compare the rules for merges, generators, quests, rewards, and preparations with `PRODUCT.md`.
  Confirm that a value that the interface shows agrees with the value that the engine applies.
- Keep the safe failure behavior of persistence.
  This includes the save validation, the size limit, the preservation of malformed saves, and the rejection of unsupported save versions.
- Confirm that text from game data and from saves uses `textContent`.
- In user interface (UI) changes, keep the pointer, keyboard, and touch controls, the viewports, the themes, and reduced motion.
- Compare `public/data/game.json` with its generator. Examine identifiers, sprite indexes, and unlocks.
- Examine the build allowlist in `tools/build.ts`, the source export list in `tools/export-source.ts`, and the paths that `tools/server.ts` refuses.
- Examine the relative asset paths and the `/scary-snacks/` base path.
- Examine the Content Security Policy (CSP) in `index.html` and in `tools/server.ts`. Confirm that there are no requests to a different origin.
- Examine the asset hashes and the font hashes in the provenance records.
- Confirm that no source code, content, art, or test uses `private/` or `analysis/` as an input.
- Confirm that no tracked file names another game, a file in `private/`, or reverse-engineering tools or work.

## Give the findings

Give only findings that have evidence.
Put the findings in order from the largest effect on users and release risk to the smallest.
For each finding, give these items:

- The path and the location.
- The contract that the defect breaks.
- The evidence.
- The effect.
- The smallest repair.
- The verification step.

Use comments from previous reviews and tool warnings only as possible findings.
Examine each possible finding before you put the finding in the report.

## Repair the findings

In repair mode, repair only findings that have evidence and that the user approved.
Add a regression test for each repair.
For the usual verification, run `npm run typecheck` and `npm test`.
For a repair in the runtime files, run `npm run build` and then `npm run test:browser`.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.
For high-risk work, get a last review from an agent that did not make the change.

## Complete the task

Give a status to each selected path, each changed contract, and each applicable test area.
List all the applicable checks.
Complete the mode when its completion condition is true.
