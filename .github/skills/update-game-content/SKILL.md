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
  Files to change: only the content generator, the generated data, the tests, and the owner documents in the approved scope.
  Output: the changed files and the checks.
  Complete when the items in "Complete the task" agree.

If the user changes the scope, select the mode again before the next edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In that condition, give each edit or check that you did not complete in the report.

## Read the content contract

Read `PRODUCT.md`, `DELIVERY.md`, and `tools/create-original-data.ts`.
That tool is the only source of the game data.
Read `validateGame`, `dataProblems`, and the quest rules in `src/engine.ts`.
`validateGame` checks a save against the game data.
`dataProblems` runs each data check. It also checks that the starting board makes a valid new game.
The generator and the game both call `dataProblems`. The game does not start on data that has a problem.
Read the content test in `tests/engine.test.ts` and the campaign test in `tests/campaign-balance.test.ts`.
Read the code in `src/app.ts` that shows items, portraits, and dialogue.

`PRODUCT.md` gives the board size and the counts of the generators, the dishes and drinks, the preparations, and the chapters.
`PRODUCT.md` gives the count of the characters.
The content test in `tests/engine.test.ts` checks the board size and the counts of the items, the characters, and the preparations.
A change to one of these counts is a product change.
Confirm that the approved scope includes that product change.
Then update `PRODUCT.md`, `DELIVERY.md`, and the tests.

## Define the change

Change the data only in `tools/create-original-data.ts`.
Then run `npm run data:generate`.
Do not edit `public/data/game.json` manually.
Examine the diff of the generated file. Confirm that it contains only the approved change.

Use stable identifiers.
An item identifier has the form `<chain>_<stage>`, and a generator identifier has the form `generator_<chain>`.
A save refers to these identifiers. A changed identifier makes that save invalid.
If a change breaks the saves that players have, tell the user before the edit.
A new save version is a product decision. Use [add-feature](../add-feature/SKILL.md) for it.

Each item has a `sprite` index in the six-by-six food atlas.
The four core characters use the two-by-two portrait atlas.
The first four visitors use the two-by-two visitor portrait atlas.
Characters with `portraitAtlas: 'guest'` use the two-by-two guest portrait atlas.
Ten regulars use the two-by-two atlases `regulars-1`, `regulars-2`, and `regulars-3`, in order of arrival.
The lower cells of `regulars-3` stay transparent.
Vlad and Elisabeta use the guest atlas.
Verify each assignment against `portraitAtlas` and `sprite` in the generator.
The index goes from left to right, and then from top to bottom.
A new item or a changed dish must have its own matching art.
Red wine uses a separate picture for `drinks_5`.
Each preparation has one authored room state.
A room state has an identifier that also names its painting.
The state also gives its area and the preparation in `after`.
It also has a focus, a pin mark, a label, and a description.
The state of the new game has `null` in `after`.
The generator stops if an entry of `roomPaintings` in `src/engine.ts` has no approved master in `docs/asset-provenance.json`.
Use [generate-game-art](../generate-game-art/SKILL.md) for new art. Make the name agree with the picture.

Write new names, dialogue, and descriptions for this game.
Do not use `private/` or `analysis/` as an input, as `AGENTS.md` tells you.
Do not copy text, names, item tables, or progression from a protected work.
Keep the characters fictional. Do not name a real person or a real business.
Keep the cosy and slightly eerie tone of an everyday neighborhood.
Name each dish or drink as `PRODUCT.md` tells you. The letters ș and ț take a comma below.
A merge chain is a game rule. Do not write it as a cooking recipe.
Do not add timers, energy limits, purchases, or advertisements to the content.

## Validate gameplay and provenance

Examine identifier uniqueness and each `next` reference.
Examine each chain unlock and its preparation.
Examine the initial board. It must hold one generator for each chain that is open at the start. Each start item must belong to an open chain.
Confirm that the player can complete each preparation with the generators that are available at that point.
The campaign test shows this result for every preparation with no added resources.
`questProblems` checks that the quests that open before each preparation pay for it. A quest change must keep this check true.
For each content defect that the validation did not find, add a regression test.

Run `npm run typecheck` and `npm test`.
For a change that the user can see, run `npm run build` and then `npm run test:browser`.
For the full gate, use [run-quality-gate](../run-quality-gate/SKILL.md).
Obey the limits of the user on checks.
In the report, give each check that you did not run.

## Complete the task

Edit mode is complete when these items agree:

- The generator and the generated data.
- The engine validation and the tests.
- The atlas art and the item names.
- `PRODUCT.md` and `DELIVERY.md`.
