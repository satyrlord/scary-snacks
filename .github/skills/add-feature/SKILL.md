---
name: add-feature
description: Add or change Scary Snacks product behavior and its contracts in the owner documents. Use for approved features, behavior changes, and repairs that change a contract in PRODUCT.md, DESIGN.md, or DELIVERY.md.
---

# Add or change a feature

## Select the mode

- Use definition mode when the user tells you to write only a contract or a decision.
- Use implementation mode when the user tells you to add the behavior to the product.
- Use repair mode when a defect makes a contract change necessary.

Definition mode:

- Inputs: the request of the user and the owner documents.
- Approval: the request of the user to write the contract.
- Files: only the owner documents and related documentation. Do not change source code, tests, content, or assets.
- Output: the changed contract text and its verification steps.
- Completion: all the related contracts agree.

Implementation mode and repair mode:

- Inputs: the approved scope, the owner documents, and, in repair mode, the evidence of the defect.
- Approval: only the approved scope.
- Files: all the files that the approved scope includes.
- Output: the changed files, the check results, and the open risks.
- Completion: the owner documents, the source code, the tests, the documentation, and the verification results agree.

Do not stop after a document change in implementation mode or repair mode.

If the user changes the scope, select the mode again before the next edit.
If the user tells you not to edit files, give the necessary changes in the report.
If the user tells you not to run checks, give each check that you did not run in the report.

## Read the owners

Read `PRODUCT.md`, `DESIGN.md`, `DELIVERY.md`, and `package.json`.
Examine the repository status.
Read the source code, the callers, the tests, and the tools that control the behavior.
Identify each contract that the change touches.
Examine the engine, content, persistence, and user interface (UI) contracts.
Also examine the asset, security, build, and deployment contracts.

Give each changed behavior one owner and one verification step that gives a measured result.

## Define and implement the change

Record the result for the user, the accurate behavior, and the items that the change does not include.
Record the failure behavior and the automated acceptance checks. Do not add a manual acceptance gate.
If the behavior changes, update the smallest owner document section that controls it.

Make the full approved change in the layer that controls the behavior.
`AGENTS.md` names the layers and the code rules. `PRODUCT.md` gives the play limits.
For game data, use [update-game-content](../update-game-content/SKILL.md).

If the save shape changes, obey "Access and persistence" in `PRODUCT.md`.
Also obey "Shared save compatibility" in `docs/specs/README.md`.
These sections give the supported save format, the storage key, and the recovery rules.
`validateGame` in `src/engine.ts` validates saves.
If the save shape changes, coordinate the game state version in `src/model.ts` and `src/engine.ts` with `VERSION` in `src/storage.ts`.
Do not add support for an earlier save format without user approval.

If you add, move, or remove a file, examine `runtimeFiles` in `tools/build.ts`.
Examine `sourceFiles` in `tools/export-source.ts` also.
Update each list that names the file.
The build publishes each runtime `.ts` module as a `.js` script in `dist/`. `index.html` names the `.ts` source.

Add the smallest tests that fail before the change and pass after the change.
Update the related developer and user documentation.
For behavior that the user can see, add evidence from a browser test in `tests/browser/`.
For sound, state in the report that an automated check does not measure how the sound plays.

## Verify the change

Run the checks for the changed behavior first.
Then run the checks that `AGENTS.md` gives for the scope.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
For evidence from the production browser build, use [verify-game](../verify-game/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.

## Complete the task

Give the changed files, the check results, and the open risks in the report.
Complete the mode when its completion condition is true.
