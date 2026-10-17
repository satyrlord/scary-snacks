---
name: deslop
description: Remove unsupported Scary Snacks repository content without a change to correct behavior, information, tests, or contracts. Use for a read-only audit, or for a cleanup that the user tells you directly to do.
---

# Remove unsupported repository content

## Select the mode

- Use audit mode to find unsupported content without edits.
- Use cleanup mode only when the user tells you directly to edit files.

Audit mode:

- Inputs: the scope, each file in the scope, and the owner of each file.
- Approval: no file change.
- Files: none.
- Output: the status, the evidence, and a verification step for each candidate.
- Completion: each candidate has a status, evidence, and a verification step.

Cleanup mode:

- Inputs: the scope that the user approved and the evidence for each candidate.
- Approval: the direct instruction of the user to edit files.
- Files: only the files in the approved scope.
- Output: the report that the section "Complete the task" describes.
- Completion: each removal has evidence and all the related checks pass.

In this skill, "slop" is content that does not agree with one of these items:

- Its controlling contract.
- The behavior of the code.
- A repository rule.
- A correct file of the same type.

A warning does not show that there is a defect.
If you get a warning, examine the content.

If the user changes the scope, select the mode again before the next edit.
If the user prohibits edits, use audit mode.
If the user tells you not to run checks, give each check that you did not run in the report.

## Get the evidence

Record each file in the scope.
Give each file one of these types:

- Source code.
- Test.
- Owner document.
- Documentation.
- Content.
- Configuration.
- Generated file.
- Provenance record.
- Locked file.
- Media.
- Binary file.

For each group of files, select the owner and one correct file of the same type.
Read each candidate, its owner, and the correct file of the same type.
If the repository has a command for tests or generated output, record the output before you edit.

## Examine each content type

- Code: remove only defects that have evidence.
  Examine debug output, comments that do not agree with the code, and policy that the code gives twice.
  Examine items that the code does not use.
  Also examine failures that the code does not show, and abstractions that do not decrease work for the callers.
- Prose: remove meaning that the text gives more than once, and facts that are not correct at this time.
  Remove unclear sentences, text that gives no information, and rules from other products.
  Keep accurate rules, sources, the legal limits, and the voice of the user.
- Data and configuration: compare the generator, the validator, the consumers, and files of the same type.
  Keep identifiers, prices, sprite indexes, provenance, hashes, and pinned package versions.
  Change them only when the contract that controls them gives approval for the change.
- Tests: find a defect signal that is different from the other tests.
  Coverage, file length, test count, and the name of a code smell do not show a defect.

Remove history: retired items, dated results, audit figures, and notes about an earlier state.
`AGENTS.md` gives this rule. Do not remove provenance or a hash of a shipped asset.

Do not change approved bitmaps, fonts, license texts, lockfiles, or the files in ignored paths.
Do not edit `public/data/game.json` by hand. Change its generator and run `npm run data:generate`.
Keep uncommitted work that is not related to the task.
For reachability, use [dead-code-audit](../dead-code-audit/SKILL.md).

## Remove the content

Remove only the smallest set of unsupported content that has evidence.
After each group of related edits, run the related checks.
Obey the limits of the user on checks.
In the report, give each check that you did not run.
Read the full scope again.

## Complete the task

In the report, give these items:

- The number of changed files and the number of files that you did not change.
- The files that you did not examine.
- The failures that occurred before your edits.
- The behavior that you did not examine.

Complete the mode when its completion condition is true.
