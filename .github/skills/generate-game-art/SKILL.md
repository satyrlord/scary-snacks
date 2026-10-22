---
name: generate-game-art
description: Generate, review, repair, or replace Scary Snacks bitmap art with the built-in chat image generator. If the agent has no image generator, give the user a complete prompt. Start here for the OpenAI Images API route also. This skill gives that request to generate-game-art-openai. Use for food, portrait, mascot, and blocker atlases, the timber, and the runner. Also use for room states, decoration paintings, the supper painting, and the night sky. Also use for the rat sheets, the rat hole, the parchment, character sketches, and quest scenes. Also use for cell defects and for prompt and provenance records.
---

# Generate game art in chat

## Select the mode

- **Review:** Examine the selected bitmaps, candidates, and records.
  Inputs: the asset identifiers or the candidate files.
  Approval: no generation request and no edit.
  Files to change: none.
  Output: the findings, each with evidence and a verification step.
  Complete when each finding has evidence and a verification step.
- **Generation:** Generate and review candidates.
  Inputs: the asset identifier, the brief, and the request limit.
  Approval: an instruction to generate or edit art approves the chat requests in that scope. Obey a request limit.
  Files to change: only the task folder in `analysis/art-generation/` and the files of the task in `tmp/`.
  Output: the candidates and one work record.
  Complete when each candidate has a decision and its observed defects.
- **Replacement:** Install an accepted candidate, update the records, and integrate it.
  Inputs: an accepted candidate and the instruction to replace the shipped file.
  Approval: the instruction to replace the shipped file. A review task or a preview task does not approve that change.
  Files to change: the files that [integration](references/integration.md) lists.
  Output: the changed files, the checks, and the open limits.
  Complete when the bitmap, the prompt record, the provenance record, the variant record, the tests, and the browser checks agree.

If the scope changes, select the mode and the modules again before the next edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In that condition, give each edit or check that you did not complete in the report.

## Read the task contract

Read `PRODUCT.md`, `DESIGN.md`, `docs/asset-prompts.json`, and `docs/asset-provenance.json`.
Read `tests/assets.test.ts` and the code that shows the selected asset.
To find that code, search `index.html` and `src/` for the asset identifier.
Examine the repository status before an edit.
Examine the file to replace.

The next table lists the layouts of the Portable Network Graphics (PNG) masters in `public/assets/original/`.
`docs/asset-provenance.json` lists each master with its size, its mode, and the `promptId` of its prompt.

| File | Role | Layout | Alpha |
| --- | --- | --- | --- |
| `food-<atlas>.png` | The source and the dishes of one chain, or one group of mixed dishes | 4 columns by 2 rows, 2048 by 1024 pixels; unused cells stay empty | Transparent |
| `portraits.png` | The four core characters | 2 columns by 2 rows | Transparent |
| `visitor-portraits.png` | Adrian, Monica, Janos, and Ionatan | 2 columns by 2 rows | Transparent |
| `guests.png` | Vlad, Elisabeta, Mina, and Avram | 2 columns by 2 rows | Transparent |
| `regulars-1.png`, `regulars-2.png` | Eight regulars, in arrival order | 2 columns by 2 rows | Transparent |
| `regulars-3.png` | Three regulars; the lower-right cell stays empty | 2 columns by 2 rows | Transparent |
| `board-clutter.png` | Six blockers with open centres | 3 columns by 2 rows | Transparent |
| `preparation-clutter.png` | Twelve blockers with open centres | 4 columns by 3 rows, 1448 by 1086 pixels | Transparent |
| `mascots.png` | Three poses of the black cat and one bat | 2 columns by 2 rows | Transparent |
| `timber-tabletop.png` | The timber under the board | One tileable square | Opaque |
| `embroidered-runner.png` | The runner strips beside the board | One image, 3:1. The game repeats only the region at x 161 with width 503 | Opaque |
| `front-room-NN.png`, `courtyard-NN.png` | One painted room state | One image, 3:4, 1536 by 2048 pixels | Opaque |
| `decoration-front.png`, `decoration-courtyard.png` | One decoration edit of a room state | One image, 3:4, 1536 by 2048 pixels | Opaque |
| `finale-supper.png` | The supper painting: an edit of `courtyard-23` with the guests | One image, 3:4, 1536 by 2048 pixels | Opaque |
| `rat-thief.png`, `rat-soricescu.png` | Eight poses of one rat of the night | 4 columns by 2 rows, 2048 by 1024 pixels; each cell is 512 pixels square | Transparent |
| `rat-hole.png` | The rat hole blocker | One image, square, 1024 by 1024 pixels | Transparent |
| `night-sky.png` | The night sky behind the window glass | One image, 2:1, 2048 by 1024 pixels | Opaque |
| `parchment-page.png` | The paper of the quest dialogs | One tileable square, 1254 by 1254 pixels | Opaque |
| `sketch-sheet-<n>.png` | Eight character sketches | 4 columns by 2 rows, 2688 by 1344 pixels; each cell is 672 pixels square | Transparent |
| `scene-sheet-<n>.png` | Four quest scenes | 2 columns by 2 rows, 2304 by 1536 pixels; each cell is 1152 by 768 pixels | Transparent |

`AGENTS.md` gives the rules for the masters, the variants, and their records.
Keep each candidate in its task folder `analysis/art-generation/<task>/` until the user decides.
`AGENTS.md` gives the folder for the other files of the task.

## Use the approved direction and route

Use the built-in chat image generator by default.
Use the OpenAI Images application programming interface (API) only if the user tells you to.
If the user chooses the API route, use [generate-game-art-openai](../generate-game-art-openai/SKILL.md) for the request and the measurement.
That skill uses this skill for the direction, the layouts, the review, and the integration.
Its asset table gives the supported subset of the masters.
Do not assume that its helper accepts every master.
Without the built-in chat image generator, use the handoff route, unless the user chose the API route:

1. Write the prompt from the brief in [atlas generation and review](references/atlas-review.md).
   Write a prompt that a person can use without this repository.
   Give the subject, the style, the size, the aspect ratio, the alpha, and the grid.
   Name the features that must stay unchanged.
2. Give the prompt to the user. Name the reference bitmap, if the request uses one.
3. Stop the task until the user supplies the image.
4. Ask the user for the name of the tool that made the image and for each change to the prompt.
5. Save the supplied image unchanged in the task folder. Then continue with the measurement and the review.

Do not use a paid API route that the user did not choose.
Do not replace a missing bitmap with Cascading Style Sheets (CSS) art or Scalable Vector Graphics (SVG) art.
Make the shipped variants only with `npm run assets:build`, as `AGENTS.md` tells you.
Do not add another image package.

Use the art direction in `DESIGN.md` and in the accepted prompts.
Make each food silhouette readable at 64 pixels.
Do not use a glossy plastic style or a mobile-cartoon style with oversized heads.
Do not put text, numbers, logos, grid lines, or interface controls in a bitmap.

These limits protect the release. They have no exceptions:

- Do not open, upload, or refer to an image from `private/`.
  In `analysis/`, use only `analysis/art-generation/`.
- Use `analysis/art-generation/` only for project-generated candidates, their run records, and the reference images in `references/`.
  For an API reference, verify the candidate hash against its generation record.
- Give the generator only names and style references that this project authored.
- As an image input, use only a bitmap that this project generated before.
- Set `sourceGameImageInput` to `false` only if that statement is accurate.

Provenance is a record. It is not legal clearance.

## Load only the necessary procedure

- Before you write a prompt or review a candidate, read [atlas generation and review](references/atlas-review.md).
- Before you change a shipped file or a record, read [integration](references/integration.md).

For review mode, the atlas generation and review module is sufficient.
If a necessary module is missing, stop the action that uses it and give its path in the report.

## Limit requests and keep results

Generate one candidate in each request.
Save the initial output unchanged before you examine it.
Measure its dimensions and its alpha. Do not use the description from the generator as a measurement.
After a visible defect, make a corrective request that names the defect.
In a corrective request, keep the accepted cells and the accepted identity unchanged.
Do not generate an accepted asset again without an instruction to replace it.
Do not enlarge an image to pass a dimension check.
Stop after a refusal or a failure with an unknown result. Do not repeat that request.
Do not infer a model name from the tool name.

## Complete the task

In the report, give the route, the measured dimensions, the generated files, the checks, and the open limits.
Keep the review by the agent apart from the acceptance by the user.
Do not record a visual approval that the user did not give.
Do not commit or publish unless the user tells you to.
After the user accepts or rejects each candidate, do these steps, as `AGENTS.md` tells you:

1. Copy each new reference image of `docs/asset-provenance.json` to `analysis/art-generation/references/`.
   For an API reference, copy its run folder with `candidate.png` and `generation.json`.
2. Move the task folder to `tmp/`.
