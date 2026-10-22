---
name: generate-game-art-openai
description: Plan, send, and measure OpenAI Images API requests for Scary Snacks bitmap candidates. Use only when the user tells you to use the OpenAI Images API, the paid image route, or this skill. Use for the asset identifiers in this skill. They include room states, decoration paintings, the supper painting, the board-clutter atlas, character sketches, and quest scenes. For built-in chat generation or a prompt handoff to the user, use generate-game-art.
---

# Generate game art through the OpenAI Images API

The application programming interface (API) route is an alternative to the built-in chat image generator.
The chat route in [generate-game-art](../generate-game-art/SKILL.md) is the default.
Use this skill only if the user chooses the API route, or tells you to use this skill.
Codex does not select this skill automatically, because `agents/openai.yaml` sets `allow_implicit_invocation` to `false`.
Codex reaches this skill by its name or through [generate-game-art](../generate-game-art/SKILL.md).
Other agents select this skill from its `description`.
The handoff route is in [generate-game-art](../generate-game-art/SKILL.md).
Without the built-in chat image generator, use that handoff route, unless the user chose the API route.

## Select the mode

- **Plan:** Validate a request without a key and without a network request.
  Inputs: the asset identifier and an optional size. A request dry run also needs a prompt file.
  Approval: none. The mode sends no request.
  Files to change: none.
  Output: the route, the size, the background, the grid, and the missing inputs.
  Complete when `plan` prints the asset contract.
  For a request dry run, also confirm that the output contains `"networkRequest":false`.
- **Generation:** Send one request for each candidate, and measure the candidate.
  Inputs: the plan, the final prompt, and the approved scope.
  Approval: see "Obey the approval limits".
  Files to change: only `analysis/art-generation/<task>/`.
  Output: the candidate and the run records.
  Complete when each candidate has measurements, a decision, and its observed defects.
- **Replacement:** Install an accepted candidate and update the records.
  Inputs: an accepted candidate and the instruction to replace the shipped file.
  Approval: the instruction to replace the shipped file. A plan, a review, or a preview task does not approve that change.
  Files to change: the files that [integration](../generate-game-art/references/integration.md) lists, and the files in "Record the route" of [API generation](references/api-generation.md).
  Output: the changed files and the checks.
  Complete when the bitmap, the records, the tests, and the browser checks agree.

Review mode and design review have no API request. Use [generate-game-art](../generate-game-art/SKILL.md) for them.
If the scope changes, select the mode and the modules again before the next request or edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In that condition, give each edit or check that you did not complete in the report.

## Obey the approval limits

An instruction to use the API route for named assets approves one request for each named asset.
Obey a request limit, a size, or a reference limit that the user gives.
After a visible defect, make at most one corrective request for each asset, unless the user gives a different limit.
Get approval from the user before an additional request.
A new asset identifier needs a change to the contracts in `openai-api.ts`.
A new room state or a new character in `tools/create-original-data.ts` also adds an identifier.
Confirm that the approved scope includes the identifier before you add it.
A plan, a review, or a preview task does not approve a request or a change to a shipped file.

Do not repeat a request that finished or a request with an unknown result.
Stop after a refusal, an authentication failure, or a timeout.
Do not infer a model name from a tool name. The helper records the model that it sent.

## Read the contract

Read `PRODUCT.md`, `DESIGN.md`, `docs/asset-prompts.json`, `docs/asset-provenance.json`, and `tests/assets.test.ts`.
Obey the art direction, the layouts, and the release limits in [generate-game-art](../generate-game-art/SKILL.md).
These limits prohibit images from `private/` and images that this project did not generate.
The limits permit new project-generated candidates in `analysis/art-generation/`, with their generation records.
Examine the repository status before edits.

The helper always sends the model `gpt-image-2.5-flare`, high quality, Portable Network Graphics (PNG) output, and one image.
The helper reads each other value from the contract of the asset:

| Asset identifier | Default size | Background | Grid |
| --- | --- | --- | --- |
| `food-<atlas>` for each food atlas: `grain`, `corn`, `herbs`, `dairy`, `poultry`, `vegetables`, `fruits`, `pork`, `beans`, `lamb`, `veal`, `fish`, `soups`, `mains`, `sweets`, `breads`, and the seasonal `pickles` and `greens` | `2048x1024` | `transparent` | 4 columns by 2 rows; the cells after the last picture stay fully transparent |
| `portraits` | `1536x1536` | `transparent` | 2 columns by 2 rows |
| `regulars-1`, `regulars-2` | `1536x1536` | `transparent` | 2 columns by 2 rows |
| `regulars-3` | `1536x1536` | `transparent` | 2 columns by 2 rows; the lower-right cell stays fully transparent |
| `mascots` | `1536x1536` | `transparent` | 2 columns by 2 rows |
| `timber-tabletop` | `1536x1536` | `opaque` | One image, square, tileable |
| `embroidered-runner` | `1536x512` | `opaque` | One image, 3:1, repeats horizontally |
| Each room state and each family kitchen state in `public/data/game.json` | `1536x2048` | `opaque` | One image, 3:4 portrait, a painted room state |
| `decoration-front`, `decoration-courtyard` | `1536x2048` | `opaque` | One image, 3:4 portrait, a decoration edit of a room state |
| `holiday-front`, `holiday-courtyard` | `1536x2048` | `opaque` | One image, 3:4 portrait, a room state with the holiday decorations painted in; the decorations are then cut out |
| `finale-supper` | `1536x2048` | `opaque` | One image, 3:4 portrait, the supper painting: an edit of `courtyard-23` with the guests |
| `board-clutter` | `1536x1024` | `transparent` | 3 columns by 2 rows, six blockers with open centres |
| `rat-thief-reference`, `rat-soricescu-reference` | `1024x1024` | `transparent` | One image, square, one reference pose of a rat of the night |
| `rat-thief`, `rat-soricescu` | `2048x1024` | `transparent` | 4 columns by 2 rows, eight poses of one rat |
| `rat-hole` | `1024x1024` | `transparent` | One image, square, the rat hole blocker |
| `night-sky` | `2048x1024` | `opaque` | One image, 2:1, the night sky behind the window glass |
| `sketch-sheet-1` to `sketch-sheet-3` | `2688x1344` | `opaque`, then `ink` and `sepia` | 4 columns by 2 rows, eight character sketches in one request |
| `scene-sheet-1` to `scene-sheet-5` | `2304x1536` | `opaque`, then `ink` and `sepia` | 2 columns by 2 rows, four quest scenes in one request |
| `scene-sheet-6` | `2304x1536` | `opaque`, then `ink` and `sepia` | 2 columns by 2 rows; the quest scenes of the mourning year; the cells after the last scene stay blank |
| `notebook-pages` | `2304x768` | `opaque` | 2 columns by 1 row, two painted notebook pages |
| `family-photos` | `2048x1024` | `transparent`, then `halo` | 2 columns by 1 row, two old photographs |
| `family-portraits` | `1536x1536` | `transparent`, then `halo` | 2 columns by 2 rows; the lower cells stay fully transparent |
| `window-view-late-winter`, `window-view-early-spring`, `window-view-spring` | `1152x1536` | `opaque` | One image, 3:4 portrait, the seasonal view behind the six panes of the front-room window |

The helper does not accept `visitor-portraits`, `guests`, `preparation-clutter`, or `parchment-page`.
Use the chat route for these assets unless the approved scope includes an API contract change.

To print the contract of one asset, run `plan --asset <identifier>`, as [API generation](references/api-generation.md) tells you.

[The art plan](../../../docs/specs/001-visible-renovation-art-plan.md) lists the room states.
Each later state is an edit of the previous accepted state, with a mask or without a mask.
Use `art-composite.ts` to copy only the changed region into the previous state, as [API generation](references/api-generation.md) tells you.
Before a new bitmap ships, follow "Add a new bitmap" in [integration](../generate-game-art/references/integration.md).

Before a change to the model or to the request contract, read the [official image generation guide](https://developers.openai.com/api/docs/guides/image-generation).
Get approval from the user for that change.

## Load only the necessary modules

- Before you write a prompt or review a candidate, read [atlas generation and review](../generate-game-art/references/atlas-review.md).
- Before you plan, send a request, or measure, read [API generation](references/api-generation.md).
- Before you change a shipped file or a record, read [integration](../generate-game-art/references/integration.md).
  Also read the section "Record the route" in [API generation](references/api-generation.md).

If a necessary module is missing, stop the action that uses it and give its path in the report.

## Keep the results

Obey "Limit requests and keep results" in [generate-game-art](../generate-game-art/SKILL.md).
Keep every candidate, prompt, and run record in the ignored folder `analysis/art-generation/<task>/<run>/`.
The helper saves the initial output unchanged and records its hash.
Do not paint pixels manually. Repair a defect with a corrective request.

## Complete the task

Obey "Complete the task" in [generate-game-art](../generate-game-art/SKILL.md).
In the report, also give the model that the helper recorded and the run folders.
