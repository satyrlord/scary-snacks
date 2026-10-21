---
name: refactor
description: Refactor Scary Snacks without a change to product behavior or contracts. Use for an approved change to structure, a simpler design, or a new file organization. Also use for another change that keeps the behavior.
---

# Refactor without a change to behavior

## Select the scope

Use this skill only for an approved change that keeps the behavior and the contracts.
Inputs: the approved change and its scope.
Approval: the instruction of the user for that change.
Files to change: only the source code, the tests, and the documentation in the approved scope.
Output: the changed files, the measurement before and after, and the checks.
Completion: the conditions in the section "Complete the task" are true.
If the user changes the scope, examine the scope again before the next edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In that condition, give each edit or check that you did not complete in the report.

## Record the items that must not change

Read `PRODUCT.md`, `DESIGN.md`, `DELIVERY.md`, the source code, the callers, the tests, and the repository status.
List the behavior, the contracts, the files, and the validation that must stay the same.
Do not include feature work, economy changes, content edits, dependency upgrades, or changes to test policy.
Do not include cleanup that is not related to the refactor.

Select one measurement to compare before and after the refactor.
Use one of these measurements:

- The number of imports.
- The number of branches in the code.
- The number of owners for the same contract.
- The number of changed files.
- The length of the longest function.
- The information that the callers must have.

Before a high-risk change to structure, add a regression test.

## Keep the boundaries

Keep the engine free of Document Object Model (DOM) access and browser storage access.
Keep the storage module free of DOM access.
Keep the state shape, the save key, the save version, and the save validation.
Keep the identifiers in the game data.

Keep the element identifiers, the roles, and the names that the browser tests use.
Keep the theme tokens, the theme storage key, and the desktop and phone layouts.
Keep the build allowlist, the relative asset paths, and the Content Security Policy (CSP).
Keep the asset hashes, the provenance records, and the pins in `.github/workflows/pages.yml`.

## Refactor in small steps

Make one change to structure that removes one named problem.
Run the smallest related check.
Continue only if the next step is part of the same refactor.
Compare the selected measurement with its initial value.
Stop if the refactor must change the behavior or an approved contract.
Use [add-feature](../add-feature/SKILL.md) for the change of behavior.

If you add, move, or remove a file, examine `runtimeFiles` in `tools/build.ts`.
Also examine `sourceFiles` in `tools/export-source.ts`.
Change each list that names the file.
To find dead items in many files, use [dead-code-audit](../dead-code-audit/SKILL.md).
Run the checks that `AGENTS.md` gives for the scope.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.

## Complete the task

The refactor is complete when these conditions are true:

- The behavior and the contracts are the same as before the refactor.
- The selected measurement is better.
- Each changed line is part of the refactor.
- All the applicable checks pass.
