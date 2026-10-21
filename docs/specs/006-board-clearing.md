# 006: Board clearing

Status: Implemented.

## Behavior

The six-by-seven board starts with nine items and eight blocked edge cells. The items are three sources and six dishes.
Every blocker shows its blocked dish through a transparent centre.
Any legal merge into that cell clears the blocker.
The merge uses a matching dish of its chain or a recipe partner of spec 012.
The result of the merge stays in the blocked cell. The source cell becomes empty.
The purse gains the blocker coin of spec 012 in the same change. All blocker pictures use this one rule.
A merge beside a blocker clears nothing.

A blocked dish cannot move, swap, or fill a quest. A blocked cell is not a free cell.
A dish that does not merge with the blocked dish changes nothing. A legal merge needs no free cell.
The merge, the blocker removal, the blocker coin, and the discovery form one change.
Each blocker clears once. The campaign does not need the player to clear blockers.

Each preparation payment, including the final payment, earns two or three contextual blockers.
Their dishes belong to chains that the payment has opened.
A new source takes its cell first. Blockers use free cells in board order.
Placement keeps four free cells.
These cells give room to make one Linden tea for the recovery quest from new takes.
At most three preparation blockers can stay uncleared at the same time.
Ordinary actions can use the free cells that placement keeps.
Blockers can share sides. The other blockers wait in preparation order.
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
The board has no spiders.

## Input and help

Every blocked tile stays in the keyboard path. Its label names the blocked dish
and the merge rule. A small help mark and hover text show the rule.
A tap selects the blocker. Below the board, the game then shows the name of the blocker and the blocked dish.
The game also shows each recipe partner that the player has made, and Clear selection.
Movable matches get a dotted outline.
A tap on a marked dish merges the dish into the blocked cell and clears the blocker in one action.
Help replaces item actions and preparation offers. Help changes no game state until a merge.
Escape, Clear selection, a dish that does not merge, or a second tap closes the help.
A selected matching dish also merges directly into the blocked cell.
After the player selects a movable dish, the game marks each dish and blocked cell that can merge with it.
Sources, and final dishes that are part of no recipe, mark no merge target.
Board hints can show any matching blocked dish.

## Data and saves

`tools/create-original-data.ts` owns the layouts and the batches. Blocker identifiers (IDs) stay
stable. The `clutter` and `anchored` values select art only.
They do not change the rule that clears a blocker.
Validation checks unique positions, known dishes with a merge partner,
available chains, and separation from initial items.

The state keeps the layout ID and the IDs of the cleared blockers.
Movable items cannot occupy the cells of uncleared blockers.
A blocker does not discover its dish. The recipe book keeps that dish covered
until the player takes or makes it.
A cleared blocker needs a discovered dish that merges with its blocked dish.
A save can list a blocked dish that the player has not made. The game keeps that blocked dish.

The optional preparation blocker record holds a baseline and the ID and cell of each placed blocker.
Waiting blockers come from paid batches after that baseline.
A missing record starts before the next successful payment and adds no past batches.
A cleared blocker in the history can share a cell with a later placement. The cells of uncleared blockers must be unique.
An invalid import and a failed write keep the bytes of the current save.

## Art

The transparent `board-clutter` atlas has three columns and two rows.
Four cells show open material frames, one shows corner webs, and one shows twine and a nail.
The transparent `preparation-clutter` atlas has four columns and three rows of contextual frames.
Each frame leaves the blocked dish visible in its open centre.
The built-in chat image generator made both atlases. The game loads their WebP variants.
The prompt, provenance, and variant records identify the generated art.

## Acceptance and evidence

- Engine checks cover every blocker type, matching dishes, recipe partners, and dishes that do not merge.
  They also cover the blocker coin, unchanged neighbours, full boards, discoveries, and atomic failure.
- Data and save checks cover IDs, positions, blocked cells, placement history, and queue order.
  They cover the limit of three active preparation blockers and the four cells that placement keeps.
- Browser checks cover visible blocked dishes, help targets, pointer, drag,
  keyboard, emulated touch, reload, and preparation batches.
- Art checks cover hashes, cell margins, and transparent centres. Browser
  captures cover desktop and phone sizes in both themes.
