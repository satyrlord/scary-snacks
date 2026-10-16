# 007: Board clearing

Status: Implemented. Human pacing and visual acceptance remain open.
Owner: `PRODUCT.md` for board rules; `DESIGN.md` for blocked-space presentation.

## Implemented state

- `tools/create-original-data.ts` authors a 42-cell board with seven initial items and eight edge obstacles.
- `src/engine.ts` owns the shared available-cell rule, adjacent reveals, anchored merges, and layout validation.
- `src/storage.ts` writes state 7 in save envelope 6. Earlier valid saves convert to the open layout.
- `src/app.ts` shows blocked cells, gives their merge rules in accessible labels, and counts only usable empty cells.
- The Node and browser tests cover blocked cells, migration, keyboard, pointer, touch, drag, and reload.

## Outcome and scope

Let merges reveal workbench space and ingredients. Give anchored items a distinct goal.
Keep the six-by-seven board, the 12 pantry spaces, unlimited generation, and no waiting.
Use newly authored bistro clutter and layouts. Do not reproduce archived layouts or assets.
Reveals use ordinary ingredients from existing chains. Do not add consumable tools,
currencies, reward chests, timers, energy costs, or a paid Clear action.

## Behavior

1. A fresh game uses eight authored edge cells with four clutter wrappers and four
   anchored ingredients. The remaining 34 cells keep the ordinary board behavior.
   These positions must not overlap initial items or generators.
   A clutter wrapper is old bistro clutter under dust and spider webs.
   Preparation 1, "Fix the broken window", removes the webs from each wrapper and the room at the same time.
   A merge beside the wrapper clears its dusty clutter. Spiders do not appear on the board.
   The webs are not creatures, so the rule of spec 008 about setting details still holds.
2. Each obstacle has a stable identifier (ID), a position, a readable name, a type, and an ordinary ingredient
   code. Its chain must be available at the start of the game. Its merge successor must exist.
3. A successful pair merge clears each clutter wrapper that shares a side with the destination of the merge. Each wrapper clears one time.
   Reveal the configured ingredient of the wrapper in its own cell. Diagonal contact does not clear clutter. Adjacency to the source cell does not clear clutter.
4. An anchored ingredient is visible. It cannot move, swap, enter storage, sell, or serve.
   Merge a matching movable ingredient into its cell to remove the anchor and leave the
   normal successor in that cell. The source becomes empty, as in an ordinary merge.
5. Both ordinary pair merges and anchor-releasing pair merges can clear neighbouring clutter.
   A revealed ingredient never merges alone and never clears another wrapper alone.
6. The merge, the anchor removal, the adjacent reveals, and the discoveries form one atomic transition.
   Give normal experience points (XP) and merge credit one time for the pair merge. Never give them for each reveal.
7. A full board or a full pantry cannot lose revealed ingredients: each ingredient uses its own obstacle
   cell. Do not use the first empty cell, an inventory fallback, or an overflow queue.
8. All placement searches, free counts, service checks, and hints use the same obstacle rules.
   Spawn, retrieval, movement, and generator unlocks must not occupy unresolved obstacles. Only the defined matching merge can target an anchored ingredient.
9. Failed merges, wrong items, terminal items, moves, and swaps clear nothing. They change
   no state and no seed. A resolved obstacle never gives its ingredient a second time.
10. Obstacle cells stay keyboard-focusable for explanation. Labels give the location, the type,
   the visible ingredient where applicable, and the merge rule. Do not use colour alone.
11. Clearing stays optional. The campaign and the current orders must stay achievable with
    all obstacles intact. Keep the recovery routes for merge, storage, service, and sale.

### Board layout

Cell numbers start at 0. The board counts left to right, then top to bottom.

| Cell | Type | Name | Ingredient |
| --- | --- | --- | --- |
| 0 | Clutter | Old crate | Pogăcele (`bakery_3`) |
| 5 | Clutter | Tied sack | Mămăligă (`warm_2`) |
| 36 | Clutter | Covered crock | Socată (`drinks_2`) |
| 41 | Clutter | Linen bundle | Dough (`bakery_2`) |
| 6 | Anchored | Tied dough | Dough (`bakery_2`) |
| 11 | Anchored | Tied cornmeal | Cornmeal (`warm_1`) |
| 37 | Anchored | Tied elderflowers | Elderflowers (`drinks_1`) |
| 40 | Anchored | Tied mămăligă | Mămăligă (`warm_2`) |

## Data, state, and migration

- `tools/create-original-data.ts` authors the layout and obstacle records. `dataProblems` checks IDs, positions, types, ingredients, and separation from initial items. It also rejects clutter with no open side.
- State 7 stores a layout ID and resolved obstacle IDs. The layout supplies unresolved contents. Movable items cannot occupy unresolved cells.
- Save envelope 6 uses `scary-snacks-save-v6`. `validateGame` checks layout IDs, resolved IDs, blocked cells, and discoveries.
- A fresh game discovers visible anchored ingredients. A hidden ingredient enters discovery when its wrapper clears.
- Earlier valid saves convert to `legacy-open`, with no blocked cells. Conversion keeps their board, pantry, counters, coins, preparations, orders, and discoveries in place. Earlier bytes remain unchanged.
- `engine.ts` owns availability and clear transitions. `app.ts` owns visuals and input.
- Invalid imports and failed writes keep the previously saved bytes and report the failure.

## Art

The transparent `board-clutter` atlas is 1536 by 1024 pixels. It has three columns and two rows of square cells. Four cells show dusty clutter. One cell supplies the web overlay, and one supplies the twine and nail overlay. The game ships its WebP variant. The master, prompt, provenance, and variant records identify the generated art.

## Implemented slices

1. Obstacle data, shared availability, and atomic pair-merge clearing are in the engine.
2. Validated state 7 saves keep resolved obstacles. Migration gives older saves the open layout.
3. The board shows clutter, webs, anchored ingredients, readable labels, and exact free-space counts. Hints can point to an anchor.

## Acceptance and evidence

- Engine tests cover destination-side, source-side, and diagonal contact; several wrappers; no cascade; matching and wrong anchors; full board and pantry; discoveries; XP; and atomic failure.
- Data tests reject duplicate positions, unknown ingredients, and trapped clutter. The asset test checks the atlas hash, variant hash, cell seams, and open overlay centers.
- Save tests cover open, partly cleared, and fully cleared layouts through export, import, and reload. They cover old full boards, invalid IDs, migration retries, and failed writes.
- Browser tests cover keyboard, pointer, drag, and emulated touch actions; labels; order hints; reload; the preparation 1 web removal; and reduced motion.
- The deterministic legal campaign fixture reaches all 24 preparations with every obstacle intact. It does not measure human pace.
- Manual play must assess early and late production, recovery actions, phone cell legibility, and the new art. A user has not accepted the visual result.

## Remaining acceptance

The legal campaign fixture reaches every preparation with obstacles intact. A person has not measured play pace or accepted the new art. Manual play must check early and late production, available space, recovery actions, and the distinction between clutter, anchors, and movable food on a phone.
