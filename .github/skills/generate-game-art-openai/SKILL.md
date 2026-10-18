---
name: generate-game-art-openai
description: Plan, send, and measure OpenAI Images API requests for Scary Snacks bitmap candidates. Use only when the user tells you to use the OpenAI Images API, the paid image route, or this skill. Use for the asset identifiers in this skill, including room states, decoration paintings, and the board-clutter atlas. For built-in chat generation or a prompt handoff to the user, use generate-game-art.
---

# Generate game art through the OpenAI Images API

The application programming interface (API) route is an alternative to the built-in chat image generator.
The chat route in [generate-game-art](../generate-game-art/SKILL.md) stays the default.
Use this skill only if the user chooses the API route, or tells you to use this skill.
Codex does not select this skill automatically, because `agents/openai.yaml` sets `allow_implicit_invocation` to `false`.
Codex reaches this skill by its name or through [generate-game-art](../generate-game-art/SKILL.md).
Other agents select this skill from its `description`.
The handoff route is in [generate-game-art](../generate-game-art/SKILL.md).
Use it if the chat tool is not available and the user did not choose the API route.

## Select the mode

- **Plan:** Validate a request without a key and without a network request.
  Inputs: the asset identifier and an optional size. A request dry run also needs a prompt file.
  Approval: none. The mode sends no request.
  Files to change: none.
  Output: the route, the size, the background, the grid, and the missing inputs.
  Complete when `plan` prints the asset contract.
  For a request dry run, also confirm that the output contains `"networkRequest":false`.
- **Generation:** Send one request for each candidate, and measure the candidate.
  Inputs: the plan, the final prompt, and the authorized scope.
  Approval: see "Obey the approval limits".
  Files to change: only `analysis/art-generation/<run>/`.
  Output: the candidate and the run records.
  Complete when each candidate has measurements, a decision, and its observed defects.
- **Replacement:** Install an accepted candidate and update the records.
  Inputs: an accepted candidate and the instruction to replace the shipping file.
  Approval: a plan, a review, or a preview task does not approve a shipping change.
  Files to change: the files that [integration](../generate-game-art/references/integration.md) lists, and the statements that the route changes.
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
A new asset identifier needs a change to the contract in `openai-api.ts`, or to the room states in `tools/create-original-data.ts`.
Confirm that the approved scope includes the identifier before you add it.
A plan, a review, or a preview task does not approve a request or a shipping change.

Do not repeat a request that finished or a request with an unknown result.
Stop after a refusal, an authentication failure, or a timeout.
Do not infer a model name from a tool name. The helper records the model that it sent.

## Read the contract

Read `PRODUCT.md`, `DESIGN.md`, `docs/asset-prompts.json`, `docs/asset-provenance.json`, and `tests/assets.test.ts`.
Obey the art direction, the layouts, and the release limits in [generate-game-art](../generate-game-art/SKILL.md).
These limits ban images from `private/` and images that this project did not generate.
The limits permit new project-generated candidates in `analysis/art-generation/`, with their generation records.
Examine the repository status before edits.

The helper fixes the model `gpt-image-2.5-flare`, high quality, Portable Network Graphics (PNG) output, and one image.
It reads each other value from the asset:

| Asset identifier | Default size | Background | Grid |
| --- | --- | --- | --- |
| `menu-atlas` | `1536x1536` | `transparent` | 6 columns by 6 rows |
| `portraits` | `1536x1536` | `transparent` | 2 columns by 2 rows |
| `regulars-1`, `regulars-2` | `1536x1536` | `transparent` | 2 columns by 2 rows |
| `regulars-3` | `1536x1536` | `transparent` | 2 columns by 2 rows; the lower cells stay fully transparent |
| `mascots` | `1536x1536` | `transparent` | 2 columns by 2 rows |
| `timber-tabletop` | `1536x1536` | `opaque` | One image, square, tileable |
| `embroidered-runner` | `1536x512` | `opaque` | One image, 3:1, repeats horizontally |
| Each room state in `public/data/game.json` | `1536x2048` | `opaque` | One image, 3:4 portrait, a painted room state |
| `decoration-front`, `decoration-courtyard` | `1536x2048` | `opaque` | One image, 3:4 portrait, a decoration edit of a room state |
| `board-clutter` | `1536x1024` | `transparent` | 3 columns by 2 rows, six blockers with open centers |

The helper does not accept `visitor-portraits`, `guests`, `red-wine`, or `preparation-clutter`.
Use the chat route for these assets unless the approved scope includes an API contract change.

To print the contract of one asset, run `plan --asset <identifier>`, as [API generation](references/api-generation.md) tells you.

[The art plan](../../../docs/specs/001-visible-renovation-art-plan.md) lists the room states.
Each later state is a masked edit of the previous accepted state.
Composite the region back with `art-composite.ts`, as [API generation](references/api-generation.md) tells you.
Before a new bitmap ships, follow "Add a new bitmap" in [integration](../generate-game-art/references/integration.md).

Before a change to the model or to the request contract, read the [official image generation guide](https://developers.openai.com/api/docs/guides/image-generation).
Get approval from the user for that change.

## Load only the necessary modules

- Before you write a prompt or review a candidate, read [atlas generation and review](../generate-game-art/references/atlas-review.md).
- Before you plan, send a request, or measure, read [API generation](references/api-generation.md).
- Before you change a shipping file or a record, read [integration](../generate-game-art/references/integration.md).
  Also read the section "Record the route" in [API generation](references/api-generation.md).

If a necessary module is missing, stop the action that uses it and give its path in the report.

## Keep the results

Obey "Limit requests and keep results" in [generate-game-art](../generate-game-art/SKILL.md).
Keep every candidate, prompt, and run record in the ignored folder `analysis/art-generation/<run>/`.
The helper saves the initial output unchanged and records its hash.
Do not paint pixels manually. Repair a defect with a corrective request.

## Complete the task

Obey "Complete the task" in [generate-game-art](../generate-game-art/SKILL.md).
In the report, also give the model that the helper recorded and the run folders.
