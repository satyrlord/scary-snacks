---
name: design-scary-snacks-ui
description: Design, audit, add, repair, or examine the Scary Snacks browser interface through the Impeccable workflow. Use for the room, the drawer, the board, quest tickets, requests, story, dialogs, the phone bar, themes, typography, interaction, or motion.
---

# Design the Scary Snacks interface

## Use the Impeccable workflow

Use the installed `$impeccable` skill. Its other name is `/impeccable`.
Use it as the workflow that controls the design.
The `impeccable` skill is installed in the home folder of the user. It is not in this repository.
The `.impeccable/` folder is local, and Git ignores it.
If one of them is not available, stop the design work, and give that blocker in the report.
Do not use rules from this skill as an alternative to the Impeccable workflow.

1. Load the full `impeccable` skill before design work.
2. Run its context command once in each session.
   Use the requested user interface (UI) surface or source path as the target.
3. Obey its routing rules.
   Load only the playbook for the command that the user gives or that the task makes necessary.
   For a new surface or a replacement visual system, use its new-work playbook.
4. Examine the target and at least one typical source file of the visual implementation.
   Do this before you make a recommendation or an edit.
5. Before an approved UI edit, load the Impeccable craft-floor playbook.

`PRODUCT.md` and `DESIGN.md` give the product context and the design context.
`.impeccable/config.json` records the detector findings to ignore.
The user confirmed some entries, and an agent verified the other entries as false findings.
Do not invent tokens, a palette, typography, or a component language that `DESIGN.md` does not give.
If the design and the code do not agree, give the difference in the report.
Repair the difference only in the scope that the user approved, and only through the applicable Impeccable workflow.

## Select the mode

- Use audit mode to examine the interface without edits.
- Use implementation mode to design or repair an approved scope.
- Use verification mode to collect evidence from the production build.

Audit mode:

- Inputs: the target surface, the owner documents, and the source files of the surface.
- Approval: no file change.
- Files: none.
- Output: findings that have evidence and a verification step.
- Completion: each selected UI contract has a finding or recorded evidence.

Implementation mode:

- Inputs: the approved scope, the owner documents, and the Impeccable brief.
- Approval: only the approved scope.
- Files: the source code, the styles, the tests, and the owner documents in that scope.
- Output: the changed files, the check results, and the evidence from a browser.
- Completion: each changed UI contract has evidence or a blocker.

Verification mode:

- Inputs: the production build and the contracts to examine.
- Approval: no repair.
- Files: none.
- Output: the evidence and the defects that you found.
- Completion: each examined UI contract has evidence or a blocker.

Impeccable selects the design command and the playbook.
Do not make a different design process in this skill.
If the user changes the scope, select the mode again before the next edit.

## Keep the target contract

`DESIGN.md` and `PRODUCT.md` control the interface. Read them in full before each design decision.
`.impeccable/surfaces/index-html.md` gives the Impeccable direction for the main screen.
`DESIGN.md` controls the design. If the two files do not agree, obey `DESIGN.md`.
The named rules and the Do and Don't lists of `DESIGN.md` are limits for the Impeccable brief.
Do not copy these rules into this skill or into a brief. Point to the owner document.

For new or replacement bitmaps, use [generate-game-art](../generate-game-art/SKILL.md).
The code rules in `AGENTS.md` apply to interface work.
They include the module boundaries, `textContent`, and the limit on resources from a different origin.

## Test the full interaction

Obey the limits of the user on edits and tests.
In the report, give each check that you did not run.
Run browser tests in headless mode.

In implementation mode and verification mode, do these tests:

- Test pointer selection, drag input, keyboard movement, selection, and the Escape key.
- Test the desktop size and the phone size that `DESIGN.md` names in The One Screen Rule.
- Test the Light theme and the Dark theme at each size.
- Measure the contrast of the main text and the muted text. `DESIGN.md` gives the limit.
- Examine overlap, horizontal scroll, the phone bar, the dialogs, and the focus ring.
- Examine each atlas tile for pixels from an adjacent sprite.

Use a fresh game or a deterministic save for geometry and screenshots.
A screenshot does not show interaction.
For production evidence, use [verify-game](../verify-game/SKILL.md).
The tests do not include physical touch devices or assistive technology. Give that limit in the report.

## Complete the task

Complete the mode when its completion condition is true.
Each finding must have a verification step.
Complete the review steps that the applicable Impeccable workflow makes necessary.
`DESIGN.md`, the source code, the tests, and the behavior that the user sees must agree.
