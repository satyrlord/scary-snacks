---
name: verify-game
description: Examine Scary Snacks in its production browser build. Use for evidence about gameplay, desktop and phone layout, themes, persistence, assets, security, or the GitHub Pages subpath.
---

# Examine the production game

## Select the mode

- **Verification:** Use this mode by default.
  Inputs: the contracts to examine and the build to use.
  Approval: the instruction to verify.
  Files to change: no tracked file. Update `docs/verification.md` only if the user tells you to update that record.
  The build writes the ignored outputs `dist/` and `analysis/build-manifest.json`.
  Output: the report with a status for each contract.
  Complete when each applicable contract has a status.
- **Repair:** Use this mode only if the user tells you directly to repair a defect.
  Inputs: the defect and its evidence.
  Approval: the instruction to repair.
  Files to change: only the files that the repair needs.
  Output: the report, the changed files, and the new evidence.
  Complete when the defect has a verification step that passes.

If the user changes the scope, select the contracts again before the next test.
If the user tells you not to run tests, do not start browsers or commands. Give the missing evidence in the report.
If the user tells you not to edit files, use verification mode.

## Prepare the artifact

Read `PRODUCT.md`, the changed contracts, `package.json`, `playwright.config.ts`, and `.github/workflows/pages.yml`.
Build with `npm run build`. The build changes no tracked file.
For the automated flows, run `npm run test:browser`.
The command serves `dist/` in Chromium.
The full suite uses `/scary-snacks/` on port 4182.
The asset and path test also uses the root path on port 4181.

For a manual check, serve the build with `npm run preview` and open `http://127.0.0.1:4178`.
For the Pages subpath, set the `BASE_PATH` environment variable to `/scary-snacks/` before that command.
Use a different `PORT` value if port 4178 is not available. Do not stop a server that you did not start.
Run automated browsers in headless mode.
Start from empty browser storage or from a save file that you recorded.
Record the operating system, the browser and its version, the viewport, the theme, and the build commit or status.

If the build or the preview fails, give each related contract the status `BLOCKED`.
Do not use the development server from `npm run dev` as an alternative.

## Test the behavior that the user can see

Use the controls that the interface shows, with the gestures that each control needs.
Test generator output, merges, swaps, orders, coins, sale values, and the pantry.
Test the preparations, the chain unlocks, the dialogue, and the orders after the story.
Test the room painting, the area switch, and the reveal after a paid preparation.
Test pointer selection, drag input, the arrow keys, Enter, Space, and Escape.

Test the save after a reload. Test export, import, and reset.
Test a malformed save. The game must keep the stored data and show a recovery message.
Test the Light, Dark, and System appearance modes and their persistence.
Test the desktop and phone viewports that "The One Screen Rule" and the "Do" list in `DESIGN.md` name.
Test the two fonts and each atlas tile.

Use test assertions for state, stored values, roles, and names.
Use test assertions for geometry, overlap, scrolling, and computed styles.
Use test assertions for network requests, console errors, the Content Security Policy (CSP), and asset loads.
Each request must stay in the local origin and in the active base path.
The paths of `private/` and `analysis/` must give the status 404.
Screenshots can show a visual result. They do not show state or interaction.

For sound, record a manual listening procedure.
Automation shows only that the sound setup runs.
Automation cannot do these checks. Give them as limits in the report:

- A drag with a finger on a physical phone.
- A session with assistive technology.
- Sound that a person hears.

## Complete the run

Keep temporary evidence in an ignored path for this run, for example `test-results/`.
Close only the browsers and servers that you started for this verification.
Give each contract one of these statuses: `PASS`, `FAIL`, `BLOCKED`, or `N-A`.
In the report, give the limits of the run, the manual checks, and all the necessary evidence.
Do not give results that the recorded build and environment do not show.
A local pass does not show that a deployment is live or correct.
