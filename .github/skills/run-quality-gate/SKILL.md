---
name: run-quality-gate
description: Run or repair the full Scary Snacks quality gate. Use when the user tells you to run the full gate or to repair a failed gate. Also use when the user tells you to collect the evidence for a release.
---

# Run the full quality gate

## Select the mode

- **Verification:** Use this mode by default. Run the gate and give the evidence.
  Inputs: the scope of the change, if the user gives one.
  Approval: the instruction to run the gate.
  Files to change: none.
  Output: the report with a status for each check.
  Complete when each applicable check has a status.
- **Repair:** Use this mode only if the user tells you to repair failed checks.
  Inputs: the failed check and its full diagnostic message.
  Approval: the instruction to repair. The list of additions that need separate approval is below.
  Files to change: only the files that the repair of the failed checks needs.
  Output: the report and the changed files.
  Complete when the failed check passes and the gate passes again.
- **Release:** Use this mode if the user tells you to collect all the release evidence.
  Inputs: the instruction to collect the evidence.
  Approval: the instruction. This mode does not deploy, push, or change the repository.
  Files to change: none. Change `docs/verification.md` only if the user tells you to update that record.
  Output: the report with the release evidence.
  Complete when each release check has a status.

The full gate is `npm run quality:full`.
It runs `npm run typecheck`, `npm run deadcode`, `npm run test`, `npm run build`, and `npm run test:browser` in that order.
A pass of only `npm test` is not full-gate evidence and is not release evidence.
If the user tells you not to run tests, do not run a check. Give the missing evidence in the report.
If the user changes the scope, select the mode again before the next edit.

The build writes `dist/` and `analysis/build-manifest.json`. Git ignores both paths. Do not track files under these paths.
Each addition below needs approval before you make it, unless the approved scope includes it:

- A test exclusion, a skipped test, or a retry setting.
- A less strict compiler option, an `any` type, or a comment that hides a type error.
- A changed pin or a new command.
- A lower limit, for example a contrast limit or a size limit.
- A new entry in a build allowlist or a provenance record.
- A new entry, ignore pattern, or rule in `.fallowrc.json`, or a `fallow-ignore` comment.

## Find the gate configuration

Read `package.json`, `package-lock.json`, `tsconfig.json`, `.fallowrc.json`, `playwright.config.ts`, and `.github/workflows/pages.yml`.
Read `DELIVERY.md` and `docs/verification.md`.
Examine the Git status. Do not change files that the gate does not need.
For each change, find the related checks.

A script name is a check only if `package.json` has the script.
If a necessary script is missing, give that check the status `BLOCKED`.
Do not create an equivalent command and give it the status `PASS`.

`AGENTS.md` gives the browser of the browser phase and the command that installs it.
The browser phase starts its servers on ports 4181 and 4182. It does not use a server that already runs.
If a port is not available, give the browser phase the status `BLOCKED`. Do not stop a process that you did not start.

## Run the checks

Run the applicable related checks first.
Then run `npm run quality:full` once.
The gate stops at the first phase that fails.
Before a related browser check, obey the build order in `AGENTS.md`.
If a skill package changed, validate that package with [create-skill](../create-skill/SKILL.md).

Do not run a passed phase again, unless a file changed, a check failed, or a problem is open.
Do not retry a failed test to hide the failure.
A test that fails and then passes at the next run has a defect. Record the defect, and repair its cause.

In release mode, run the full gate.
Run `npm run release:source`, and then run `npm ci` and `npm test` in `.release/scary-snacks-source/`.
Run `git diff --check`.
Examine the final status and the final diff.
Release mode does not remove the risks in `docs/release-notes.md`.

In repair mode, record the full diagnostic message.
Repair the smallest approved cause.
Run the failed check again.
Then continue.

## Give the report

Give each check one of these statuses: `PASS`, `FAIL`, `BLOCKED`, or `N-A`.
For each check, give its command or procedure and its result.
Give the number of Node.js checks and the number of browser checks that passed.
Separate failures that existed before your work from regressions in the scope.
Give the changed files, or write `none`.
For each blocker, give the smallest next step.

If the user reduces the scope or prevents a check, give that check the status `N-A`.
Give the cause.
In that condition, do not give a pass for the full gate.
Give a pass for the full gate only if each phase passes.
List the checks that the gate does not include: physical touch devices, assistive technology, and sound that a person hears.

## Complete the task

The gate report is complete when these conditions are true:

- Each applicable check has a status.
- Each failure has an owner or a next step.
- The report includes each check.
