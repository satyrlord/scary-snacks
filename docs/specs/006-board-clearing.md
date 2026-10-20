# 006: Board clearing

Status: Implemented.

## Behavior

The six-by-seven board starts with seven movable items and eight blocked edge cells.
Every blocker shows its blocked dish through a transparent center.
Any legal merge into that cell clears the blocker: a matching dish of its chain, or a recipe partner of spec 012.
The result of the merge stays in the blocked cell. The source cell becomes empty.
The purse gains the blocker coin of spec 012 in the same change. All blocker pictures use this one rule.
A merge beside a blocker clears nothing.

A blocked dish cannot move, swap, or fill a quest. It is not an empty cell.
A dish that does not merge with the blocked dish changes nothing. A legal merge needs no free space.
The merge, the blocker removal, the blocker coin, and the discovery form one change.
Each blocker clears once. Clearing is optional for the campaign.

Each preparation earns two or three contextual blockers, including the final payment.
Their dishes belong to chains that the payment has opened.
A new source takes its cell first. Blockers use empty cells in board order.
Placement keeps four usable empty cells, so one Linden tea for the recovery quest fits from scratch.
At most three preparation blockers can remain unresolved.
Ordinary actions can use the empty cells that placement keeps.
Blockers can share sides. The remaining blockers wait in preparation order.
A successful move, take, quest delivery, or payment tries placement again.
A failed action, a load, and an import place nothing. Placement never replaces an item.

## Board layout

Cell numbers start at zero. They count from left to right, then from top to bottom.

| Cell | Blocker | Picture | Blocked dish |
| --- | --- | --- | --- |
| 0 | Old crate | Crate | Loaf (`grain_3`) |
| 5 | Tied sack | Sack | Shelled corn (`corn_2`) |
| 36 | Covered crock | Crock | Herb bunch (`herbs_2`) |
| 41 | Linen bundle | Linen | Dough (`grain_2`) |
| 6 | Tied dough | Twine | Dough (`grain_2`) |
| 11 | Tied corn cobs | Twine | Corn cob (`corn_1`) |
| 37 | Tied elderflowers | Twine | Elderflowers (`herbs_1`) |
| 40 | Tied shelled corn | Twine | Shelled corn (`corn_2`) |

Webs cover the crate, the sack, the crock, and the linen until preparation 1.
When preparation 1 removes the webs, the blockers stay.
There are no spiders on the board.

## Input and help

Every blocked tile stays in the keyboard path. Its label names the blocked dish
and the merge rule. A small help mark and hover text show the rule.
A tap selects the blocker. It shows the name of the blocker, the blocked dish,
each recipe partner that the player has made, and Clear selection below the board.
Movable matches get a steady focus outline.
Tapping a marked dish merges it into the blocker and clears it in one action.
Help replaces item actions and preparation offers. It changes no game state until a merge.
Escape, Clear selection, a dish that does not merge, or a second tap dismisses it.
A selected matching dish also merges directly into the blocked cell.
Selecting a movable dish marks each movable dish and each blocked cell that it merges with.
Sources, and final dishes that are part of no recipe, mark no merge target.
Board hints can show any matching blocked dish.

## Data and saves

`tools/create-original-data.ts` owns the layouts and the batches. Obstacle identifiers (IDs) stay
stable. The `clutter` and `anchored` values select art only.
They do not select different clearing rules.
Validation checks unique positions, known dishes with a merge partner,
available chains, and separation from initial items.

The state keeps the layout ID and the resolved obstacle IDs.
Movable items cannot occupy unresolved cells.
A blocker does not discover its dish. The recipe book keeps that dish covered
until the player takes or makes it.
A resolved blocker needs a discovered dish that merges with its blocked dish.
A save can list a blocked dish that the player has not made. The game keeps it.

The optional preparation record holds a baseline and the placed IDs with their cells.
Waiting blockers come from paid batches after that baseline.
A missing record starts before the next successful payment and adds no past batches.
Resolved history can share a cell with a later placement. Active positions must be unique.
An invalid import and a failed write keep the previously saved bytes.

## Art

The transparent `board-clutter` atlas has three columns and two rows.
Four cells show open material frames, one shows corner webs, and one shows twine and a nail.
The transparent `preparation-clutter` atlas has four columns and three rows of contextual frames.
Each frame leaves the blocked dish visible in its open center.
Both atlases use built-in chat image generation. The game loads their WebP variants.
The prompt, provenance, and variant records identify the generated art.

## Acceptance and evidence

- Engine checks cover every blocker type, matching dishes, recipe partners, dishes that do not merge,
  the blocker coin, unchanged neighbours, full boards, discoveries, and atomic failure.
- Data and save checks cover IDs, positions, blocked cells, placement history, and queue order.
  They cover the limit of three active preparation blockers and the four cells that placement keeps.
- Browser checks cover visible blocked dishes, help targets, pointer, drag,
  keyboard, emulated touch, reload, and preparation batches.
- Art checks cover hashes, cell margins, and transparent centers. Browser
  captures cover desktop and phone sizes in both themes.
