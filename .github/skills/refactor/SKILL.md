---
name: refactor
description: Refactor Scary Snacks without a change to product behavior or contracts. Use for an approved change to structure, a simpler design, or a new file organization. Also use for another change that keeps the behavior.
---

# Refactor without a change to behavior

## Select the scope

Use this skill only for an approved change that keeps the behavior and the contracts.
Inputs: the approved change and its scope.
Approval: the instruction of the user for that change. Repository skills do not increase it.
Files to change: only the source code, the tests, and the documentation in the approved scope.
Output: the changed files, the measurement before and after, and the checks.
If the user changes the scope, examine the scope again before the next edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In that condition, give each edit or check that you did not complete in the report.

## Record the items that must not change

Read `PRODUCT.md`, `DESIGN.md`, the source code, the callers, the consumers, the tests, and the repository status.
List the behavior, the contracts, the files, and the validation that must stay the same.
Do not include feature work, economy changes, content edits, dependency upgrades, or changes to test policy.
Do not include cleanup that is not related to the refactor.

Select one measurement to compare before and after the refactor.
Possible measurements are these:

- The number of imports.
- The number of branches in the code.
- The number of owners for the same contract.
- The number of changed files.
- The length of the longest function.
- The information that the callers must have.

Before a high-risk change to structure, add a regression test.

## Keep the boundaries

Keep the engine free of Document Object Model (DOM) access and storage access.
Keep the storage module free of DOM access.
Keep the state shape, the save key, the save version, and the save validation.
Keep the identifiers in the game data.

Keep the element identifiers, the roles, and the names that the browser tests use.
Keep the theme tokens, the theme storage key, and the desktop and phone layouts.
Keep the build allowlist, the relative asset paths, and the Content Security Policy (CSP).
Keep the asset hashes, the provenance records, and the workflow pins.

## Refactor in small steps

Make one change to structure that removes one named problem.
Run the smallest related check.
Continue only if the next step is part of the same refactor.
Compare the selected measurement with its initial value.
Stop if a necessary change changes the behavior or an approved contract.
Use [add-feature](../add-feature/SKILL.md) for the change of behavior.

If you add, move, or remove a file, examine `runtimeFiles` in `tools/build.ts`.
Examine the file list in `tools/export-source.ts` also.
Update each list that names the file.
For reachability work on many files, use [dead-code-audit](../dead-code-audit/SKILL.md).
For the usual verification, run `npm run typecheck` and `npm test`.
For a change in the runtime files, run `npm run build` and then `npm run test:browser`.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.

## Complete the task

The refactor is complete when these conditions are true:

- The behavior and the contracts did not change.
- The selected measurement is better.
- Each changed line is part of the refactor.
- All the applicable checks pass.
