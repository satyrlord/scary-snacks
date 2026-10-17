---
name: diagnose
description: Find the cause of Scary Snacks failures and performance regressions that are difficult to find. Use when a result changes between runs or changes with the environment. Also use it when a failure is difficult to reproduce, or has no measurement or explanation. Repair only when the user tells you to.
---

# Diagnose a failure

## Select the mode

- Use diagnosis mode unless the user tells you to repair the cause.
- Use repair mode only after that instruction.

Diagnosis mode:

- Inputs: the symptom, the owner documents, the source code, the tests, the configuration, and the environment.
- Approval: no file change. Do not add logs or traces.
- Files: none.
- Output: the cause, the evidence, the rejected alternatives, and the regression test that the repair needs.
- Completion: the report gives all these items.

Repair mode:

- Inputs: the diagnosis and its evidence.
- Approval: the instruction of the user to repair the cause.
- Files: only the files that the repair and its regression test need.
- Output: the changed files, the regression test, and the results of the initial test sequence.
- Completion: the initial test sequence passes.

If the user changes the scope, select the mode again before the next edit.
If the user prohibits edits, use diagnosis mode.
If the user tells you not to run tests, use only the evidence that you have.
Report any proposed cause as unverified.
Name the test that can verify or reject that cause.

## Make the test sequence

Read the symptom, the owner documents, the source code, the tests, the configuration, and the environment.
If the start save and the action sequence change the result, record the start save and the action sequence.
Record each related environment value:

- The browser and its version.
- The viewport.
- The theme.
- The base path: the root or `/scary-snacks/`.
- The server mode: development or the built `dist/` output.
- The saved state and the save version.
- The Node.js version.
- The full command.

Use the smallest test sequence that can show that a possible cause is incorrect.
Select the first applicable test from this list:

1. Run an engine test with `createGame` and `reduceGame` if it applies to the symptom.
2. Run a storage test if it applies to the symptom.
3. Run a build test or a server test if it applies to the symptom.
4. Run a Playwright flow in headless mode against the built output if the failure occurs only in a browser.
5. If only one tool shows the failure, run that tool.

To run one Node.js test file, use `node --test tests/<file>.test.ts`.
To run one browser test, run `npm run build` and then `npx playwright test -g "<test name>"`.
Do not use the files in `analysis/` as production evidence.

## Reproduce and isolate the cause

Confirm that the test sequence shows a difference between the failure and the correct behavior.
Write three to five possible causes.
Put the cause with the most evidence first.
Each cause must be testable: one test can show that it is incorrect.
For each cause, give one test and the result that you expect.
Change only one condition at a time.
Stop after one cause agrees with all the evidence.

In diagnosis mode, use only tests that do not change tracked files or stored data.
The build changes no tracked file. [run-quality-gate](../run-quality-gate/SKILL.md) gives its outputs.
Do not show the content of a save file that a user gives, except the fields that the diagnosis needs.

## Complete the diagnosis or the repair

In repair mode, first make the smallest regression test that fails.
Repair the root cause.
Run the initial test sequence again.
Remove all temporary logs and traces.

The evidence must show that the cause is different from related alternatives.
If you cannot make a correct test sequence, give each attempt and the missing file or access in the report.
In that case, do not give a root cause.

Complete the mode when its completion condition is true.
