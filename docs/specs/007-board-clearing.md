# 007: Board clearing

Status: Implemented.
Owner: `PRODUCT.md` for board rules; `DESIGN.md` for blocked-space presentation.

## Behavior

The six-by-seven board starts with seven movable items and eight blocked edge cells.
Every blocker shows its ingredient through a transparent center. Merge a matching
movable ingredient into that cell to clear the blocker and leave the normal
successor. The source cell becomes empty. All blocker pictures use this one rule.
Merges beside blockers clear nothing.

A blocked ingredient cannot move, swap, sell, or fill a quest. It is not an empty
cell. A wrong ingredient changes nothing. A matching merge needs no free space.
The merge, blocker removal, and discovery form one change. Each blocker clears
once. Clearing is optional for the campaign.

Each preparation earns two or three contextual blockers, including the final
payment. Their ingredients belong to chains that the payment has opened. A new
source takes its cell first. Blockers use empty cells in board order, keep three
usable empty cells, and have a limit of three unresolved preparation blockers.
Blockers can share sides. Remaining blockers wait in preparation order. A
successful move, take, sale, quest delivery, or payment tries placement again.
Failed actions, load, and import place nothing. Placement never replaces an item.

## Board layout

Cell numbers start at zero and count left to right, then top to bottom.

| Cell | Blocker picture | Ingredient |
| --- | --- | --- |
| 0 | Old crate | Pogăcele (`bakery_3`) |
| 5 | Tied sack | Mămăligă (`warm_2`) |
| 36 | Covered crock | Socată (`drinks_2`) |
| 41 | Linen bundle | Dough (`bakery_2`) |
| 6 | Twine | Dough (`bakery_2`) |
| 11 | Twine | Cornmeal (`warm_1`) |
| 37 | Twine | Elderflowers (`drinks_1`) |
| 40 | Twine | Mămăligă (`warm_2`) |

Webs cover the crate, sack, crock, and linen until preparation 1. Removing the
webs does not clear the blockers. There are no spiders on the board.

## Input and help

Every blocked tile stays in the keyboard path. Its label names the ingredient
and the matching-merge rule. A small help mark and hover text identify the rule.
A tap selects the blocker and shows its name, the exact ingredient to merge,
and Clear selection below the board. Movable matches get a steady focus outline.
Help replaces item actions and preparation offers. It changes no game state.
Escape, Clear selection, another item, or a second tap dismisses it.
A selected matching ingredient merges directly into the blocked cell.
Board hints can point to any matching blocked ingredient.

## Data and saves

`tools/create-original-data.ts` owns layouts and batches. Obstacle IDs stay
stable. The `clutter` and `anchored` values select art only; they do not select
different clearing rules. Validation checks unique positions, known ingredients
with successors, available chains, and separation from initial items.

The state keeps the layout ID and resolved obstacle IDs. Movable items cannot
occupy unresolved cells. A fresh game discovers every visible blocked ingredient.
Current saves can omit discoveries for unresolved clutter; successful actions
record those visible ingredients. This keeps the current save format valid.

The optional preparation record holds a baseline and placed IDs with cells.
Waiting blockers come from paid batches after that baseline. Missing records
start before the next successful payment and add no past batches. Resolved
history can share a cell with a later placement. Active positions must be unique.
The save format and envelope stay unchanged. Invalid imports and failed writes
keep the previously saved bytes.

## Art

The transparent `board-clutter` atlas has three columns and two rows. Four cells
show open material frames, one shows corner webs, and one shows twine and a nail.
The transparent `preparation-clutter` atlas has four columns and three rows of
contextual frames. Each frame leaves the ingredient visible in its open center.
Both use built-in chat image generation. The game loads their WebP variants.
Prompt, provenance, and variant records identify the generated art.

## Verification

- Engine checks cover every blocker type, matching and wrong ingredients,
  unchanged neighbours, full boards, discoveries, and atomic failure.
- Data and save checks cover IDs, positions, blocked cells, placement history,
  queue order, the three-active limit, and the working-space reserve.
- Browser checks cover visible ingredients, help targets, pointer, drag,
  keyboard, emulated touch, reload, and preparation batches.
- Art checks cover hashes, cell margins, and transparent centers. Browser
  captures cover desktop and phone sizes in both themes.
