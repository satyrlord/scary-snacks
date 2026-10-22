---
name: update-game-content
description: Add or change Scary Snacks items, merge chains, generators, characters, chapters, preparations, dialogue, quests, or the initial board. Use for game-content changes that the project keeps. Do not use it for interface text only.
---

# Update game content

## Select the mode

- **Audit:** Use this mode if the user tells you to examine content without edits.
  Inputs: the content area to examine.
  Approval: none. The mode changes no file.
  Files to change: none.
  Output: the findings, each with evidence and a verification step.
  Complete when each finding has evidence and a verification step.
- **Edit:** Use this mode if the user tells you to add, change, or remove content.
  Inputs: the approved content change.
  Approval: the instruction of the user. Confirm that the approved scope includes any count change.
  Files to change: only the data tool, the generated data, the tests, and the owner documents in the approved scope.
  Output: the changed files and the checks.
  Complete when the items in "Complete the task" agree.

If the user changes the scope, select the mode again before the next edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In that condition, give each edit or check that you did not complete in the report.

## Read the content contract

Read `PRODUCT.md`, `DELIVERY.md`, and `tools/create-original-data.ts`.
This skill calls that file the data tool. Only the data tool writes the game data.
Read `validateGame` in `src/engine.ts`, `dataProblems` in `src/content.ts`, and the quest rules in `src/model.ts` and `src/engine.ts`.
`validateGame` checks a save against the game data.
`dataProblems` runs each data check. It checks that the first event of the prologue makes a valid new game.
It also checks that the initial board makes a valid start of act 1.
The data tool and the game both call `dataProblems`. The game does not open if the data has a problem.
Read the content test in `tests/engine.test.ts` and the campaign test in `tests/campaign-balance.test.ts`.
If the change affects quests, read `tests/quests.test.ts` and `tests/campaign-goals.test.ts`.
If the change affects guests, regulars, or the story, read `tests/guests.test.ts`, `tests/regulars.test.ts`, and `tests/story.test.ts`.
If the change affects the prologue, read `tests/prologue.test.ts` and `tests/browser/prologue.spec.ts`.
Read the code in `src/art.ts`, `src/tickets.ts`, and `src/story.ts` that shows items, portraits, and dialogue.

`PRODUCT.md` gives the board size and these counts: generators, dishes and drinks, characters, quests, preparations, and chapters.
The content test in `tests/engine.test.ts` checks the board size and the counts of the items, the characters, and the preparations.
`tests/quests.test.ts` checks the count of the quests.
A change to one of these counts is a product change.
Confirm that the approved scope includes that product change.
Then update `PRODUCT.md`, `DELIVERY.md`, and the tests.

## Define the change

Change the data only in the data tool, as `AGENTS.md` tells you.
Then run `npm run data:generate`.
Examine the diff of the generated file. Confirm that it contains only the approved change.

Use stable identifiers.
A chain dish has the identifier `<chain>_<stage>`, a mixed dish has `mixed_<slug>`, and a generator has `generator_<chain>`.
A save refers to these identifiers. A changed identifier makes that save invalid.
If a change makes the saves of players invalid, tell the user before the edit.
A new save version is a product decision. Use [add-feature](../add-feature/SKILL.md) for it.

Each item has an `art` field: its food atlas and its cell in the four-by-two grid of that atlas.
A chain atlas holds the source in cell 0 and the dishes in stage order. Four atlases hold the mixed dishes.
Each dish has its content `tags`, and each mixed dish has every tag of its two parts.
The data tool gives each price by the formula in `docs/economy.md`. Do not write a price by hand.
The four core characters use the two-by-two portrait atlas.
The first four visitors use the two-by-two visitor portrait atlas.
Characters with `portraitAtlas: 'guest'` use the two-by-two guest portrait atlas.
Eleven regulars use the two-by-two atlases `regulars-1`, `regulars-2`, and `regulars-3`.
The lower-right cell of `regulars-3` stays transparent.
Mara's parents use the two upper cells of `family-portraits`. Its two lower cells stay transparent.
Their dialogs use the individual photographs from `family-photos`.
Verify each assignment against `portraitAtlas` and `sprite` in the data tool.
The cell index increases from left to right, and then from top to bottom.
A new item or a changed dish must have its own art, and that art must agree with the item.
Each preparation has one authored room state.
A room state has the fields `id`, `area`, `after`, `focus`, `mark`, `label`, and `text`.
The `id` also names the painting. The field `after` names the preparation.
The initial room state of act 1 has `null` in `after`.
The new game uses a family kitchen state from `prologue.rooms`.
The data tool stops if an entry of `roomPaintings` in `src/model.ts` has no approved master in `docs/asset-provenance.json`.
Use [generate-game-art](../generate-game-art/SKILL.md) for new art. Make the name agree with the picture.

Write new names, dialogue, and room-state text for this game.
Do not use `private/` or `analysis/` as an input, as `AGENTS.md` tells you.
Do not copy text, names, item tables, or progression from a protected work.
Keep the characters fictional. `PRODUCT.md` gives the references that a regular can have.
Do not use the full name of a real person or the name of a real business.
Keep the tone that `PRODUCT.md` gives.
Name each dish or drink as `PRODUCT.md` tells you. The letters ș and ț take a comma below.
A merge chain is a game rule. Do not write it as a recipe for real food.
Do not add content that `PRODUCT.md` prohibits.

## Validate gameplay and provenance

Confirm that each identifier is unique. Examine each `next` reference.
Examine each chain unlock and its preparation.
Examine the initial board. It must hold one generator for each chain that is open at the start. Each start item must belong to an open chain.
Confirm that the player can complete each preparation with the generators that are available at that point.
The campaign test shows this result for every preparation with no added resources.
`questProblems` in `src/content.ts` checks that the quests that open before each preparation pay for that preparation. A quest change must keep this check true.
For each content defect that the validation did not find, add a regression test.

Run the checks that `AGENTS.md` gives for the scope.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.

## Complete the task

Edit mode is complete when these items agree:

- The data tool and the generated data.
- The engine validation and the tests.
- The atlas art and the item names.
- `PRODUCT.md` and `DELIVERY.md`.
