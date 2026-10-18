# 006: Board clearing

Status: Implemented.

## Behavior

The six-by-seven board starts with seven movable items and eight blocked edge cells.
Every blocker shows its ingredient through a transparent center.
A merge of a matching movable ingredient into that cell clears the blocker and leaves the normal successor.
The source cell becomes empty. All blocker pictures use this one rule.
A merge beside a blocker clears nothing.

A blocked ingredient cannot move, swap, or fill a quest. It is not an empty cell.
A wrong ingredient changes nothing. A matching merge needs no free space.
The merge, the blocker removal, and the discovery form one change.
Each blocker clears once. Clearing is optional for the campaign.

Each preparation earns two or three contextual blockers, including the final payment.
Their ingredients belong to chains that the payment has opened.
A new source takes its cell first. Blockers use empty cells in board order.
Placement keeps three usable empty cells. At most three preparation blockers can remain unresolved.
Ordinary actions can use the empty cells that placement keeps.
Blockers can share sides. The remaining blockers wait in preparation order.
A successful move, take, quest delivery, or payment tries placement again.
A failed action, a load, and an import place nothing. Placement never replaces an item.

## Board layout

Cell numbers start at zero. They count from left to right, then from top to bottom.

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

Webs cover the crate, the sack, the crock, and the linen until preparation 1.
When preparation 1 removes the webs, the blockers stay.
There are no spiders on the board.

## Input and help

Every blocked tile stays in the keyboard path. Its label names the ingredient
and the matching-merge rule. A small help mark and hover text show the rule.
A tap selects the blocker. It shows the name of the blocker, the exact ingredient to merge,
and Clear selection below the board. Movable matches get a steady focus outline.
Help replaces item actions and preparation offers. It changes no game state.
Escape, Clear selection, another item, or a second tap dismisses it.
A selected matching ingredient merges directly into the blocked cell.
Board hints can show any matching blocked ingredient.

## Data and saves

`tools/create-original-data.ts` owns the layouts and the batches. Obstacle identifiers (IDs) stay
stable. The `clutter` and `anchored` values select art only.
They do not select different clearing rules.
Validation checks unique positions, known ingredients with successors,
available chains, and separation from initial items.

The state keeps the layout ID and the resolved obstacle IDs.
Movable items cannot occupy unresolved cells.
A blocker does not discover its ingredient. The recipe book keeps that dish covered
until the player takes or makes it.
A resolved blocker needs its ingredient in the discoveries.
A save can list a blocked ingredient that the player has not made. The game keeps it.

The optional preparation record holds a baseline and the placed IDs with their cells.
Waiting blockers come from paid batches after that baseline.
A missing record starts before the next successful payment and adds no past batches.
Resolved history can share a cell with a later placement. Active positions must be unique.
An invalid import and a failed write keep the previously saved bytes.

## Art

The transparent `board-clutter` atlas has three columns and two rows.
Four cells show open material frames, one shows corner webs, and one shows twine and a nail.
The transparent `preparation-clutter` atlas has four columns and three rows of contextual frames.
Each frame leaves the ingredient visible in its open center.
Both atlases use built-in chat image generation. The game loads their WebP variants.
The prompt, provenance, and variant records identify the generated art.

## Acceptance and evidence

- Engine checks cover every blocker type, matching and wrong ingredients,
  unchanged neighbours, full boards, discoveries, and atomic failure.
- Data and save checks cover IDs, positions, blocked cells, placement history, and queue order.
  They cover the limit of three active preparation blockers and the space that placement keeps.
- Browser checks cover visible ingredients, help targets, pointer, drag,
  keyboard, emulated touch, reload, and preparation batches.
- Art checks cover hashes, cell margins, and transparent centers. Browser
  captures cover desktop and phone sizes in both themes.
