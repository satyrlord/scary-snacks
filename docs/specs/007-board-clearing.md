# 007: Board clearing

Status: Proposed. Not implemented. The layout and contents below are draft defaults.
Owner: `PRODUCT.md` for board rules; `DESIGN.md` for blocked-space presentation.

## Current evidence

- `tools/create-original-data.ts` authors a 42-cell board with seven initial items: three ingredient sources and four ingredients.
- All other cells are usable immediately. No obstacle data and no locked-cell data exist.
- `src/engine.ts` treats every `null` cell as available. Spawn, retrieval, quest-source acceptance, and preparation unlocks use the first `null` cell.
  The free-space requirement of a preparation that unlocks a source counts every `null` cell.
- `src/app.ts` counts every empty cell as free and allows board navigation across all cells.
- Tests cover recovery of a full board. They do not cover boards that are partially locked.

## Outcome and scope

Let merges reveal workbench space and ingredients. Give anchored items a distinct goal.
Keep the six-by-seven board, the 12 pantry spaces, unlimited generation, and no waiting.
Author the layout and the clutter art for this game.
Reveals use ordinary ingredients from existing chains. Do not add consumable tools,
currencies, reward chests, timers, energy costs, or a paid Clear action.

## Proposed behavior

1. A new game uses the authored blocked layout. Eight edge cells hold four clutter wrappers and four
   anchored ingredients. The remaining 34 cells keep the ordinary board behavior.
   The obstacle cells must not overlap the initial items.
   Theme: a clutter wrapper is old bistro clutter under dust. Until preparation 1, spider webs also cover each wrapper.
   Preparation 1, "Fix the broken window", removes the webs from the wrappers and from the room at the same time.
   The dusty clutter stays until a merge clears it. Spiders do not appear on the board.
   An anchored ingredient is tied to a nail in the workbench with old twine.
2. Each obstacle has a stable identifier (ID), a position, a readable name, a type, and an ordinary ingredient
   code. Its chain must be available at the start of the game. Its merge successor must exist.
3. A successful pair merge clears each clutter wrapper that shares a side with the destination of the merge. Each wrapper clears one time.
   Reveal the configured ingredient of the wrapper in its own cell. Diagonal contact does not clear clutter. Adjacency to the source cell does not clear clutter.
4. An anchored ingredient is visible. It cannot move, swap, enter storage, sell, serve an order, or fill a quest.
   Merge a matching movable ingredient into its cell to remove the anchor and leave the
   normal successor in that cell. The source becomes empty, as in an ordinary merge.
5. Both ordinary pair merges and anchor-releasing pair merges can clear neighbouring clutter.
   A revealed ingredient does not start a merge and does not clear clutter.
6. The merge, the anchor removal, the adjacent reveals, and the discoveries form one atomic transition.
   Give normal experience points (XP) and merge credit one time for the pair merge. Never give them for each reveal.
7. A full board or a full pantry cannot lose revealed ingredients: each ingredient uses its own obstacle
   cell. Do not use the first empty cell, an inventory fallback, or an overflow queue.
8. One shared rule decides which cells are available. These paths use it:
   - placement: spawn, retrieval from the pantry, moves and swaps, quest-source acceptance, and the source that a preparation unlocks;
   - counts: the free-space requirement of a preparation, the free-space count in the board label, and the full-board messages;
   - matches: order service, quest delivery, and the hint.
   No placement path can put an item in an unresolved obstacle. Only the defined matching merge can target an anchored ingredient.
   The hint treats a movable ingredient and a matching anchored ingredient as a pair. The anchored cell is the destination.
9. Failed merges, wrong items, terminal items, moves, and swaps clear nothing and reveal nothing.
   A failed action changes no state and no seed. A resolved obstacle never gives its ingredient a second time.
10. Obstacle cells stay keyboard-focusable for explanation. Labels give the location, the type,
    the visible ingredient where applicable, and the merge rule. Do not use colour alone.
11. Clearing stays optional. The campaign and the current orders must stay achievable with
    all obstacles intact. Keep the recovery routes for merge, storage, service, and sale.

### Draft layout

Cell numbers count from 0, left to right and then top to bottom. Each corner holds a wrapper, and an anchored ingredient sits beside it.
A merge into the anchored cell therefore also clears the wrapper beside it.

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

- Author the layout records and the obstacle records in `tools/create-original-data.ts`. Validate unique
  IDs and positions, valid bounds and types, reachable ingredient codes, and separation from initial items.
- Validate that each wrapper shares a side with at least one cell that is not a wrapper. Otherwise no merge can clear it.
- Store a layout ID and the resolved obstacle IDs. The layout data defines the contents of unresolved obstacles. These contents are separate from movable board items. Reject movable items inside unresolved obstacles.
- A layout never changes after it ships. A changed layout gets a new layout ID, and the old layout stays in the data for the saves that use it.
- Validate that the layout ID is known, that the resolved IDs are known and unique, and that the cell state is consistent. Discover visible anchored
  ingredients at the start of a new game. Discover hidden ingredients only when the game reveals them.
- `engine.ts` owns availability and clear transitions. `app.ts` owns visuals and input.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
- If this spec ships first, it takes game state version 7 in save envelope version 6 at `scary-snacks-save-v6`.
  If another feature took that version first, use the next free version. Validate before and after conversion,
  keep the original bytes, and make a repeated conversion give the same result.
- All converted saves use a legacy open layout with no blocked cells. Do not put
  obstacles beneath existing items, move items, reduce usable space, or revoke progress.
- Keep the board order, pantry, counters, coins, preparations, orders, and discoveries exactly as they are.
- Every new game uses the authored blocked layout. This includes a first visit with no save, a new game after an unreadable save, and "Start a new game" in the House book.
- Invalid imports and failed writes keep the previously saved bytes and report the failure clearly.

## Art

One new transparent atlas, `board-clutter`, holds the board art. It is 1536 by 1024 pixels, with 3 columns by 2 rows of 512-pixel cells.
It has the gouache style and the three-quarter view of the food atlas, so the clutter sits on the board timber like the food.

| Cell | Contents |
| --- | --- |
| 1 | Old crate: a small dusty wooden crate with a loose lid |
| 2 | Tied sack: a dusty burlap sack, tied at the neck |
| 3 | Covered crock: a dusty clay crock with a cloth tied over its mouth |
| 4 | Linen bundle: a dusty stack of folded old linen, tied with string |
| 5 | Webs: an overlay of grey cobwebs. Before preparation 1, it sits over each wrapper |
| 6 | Twine: an overlay of old twine and a rusty nail. It sits over the food picture of each anchored ingredient |

The clutter is dusty and muted, so it does not look like food or an ingredient source.
The overlays leave the middle of the cell open, so the object under them stays readable.
The generated candidate waits in `analysis/art-generation/board-clutter/` until slice 3 installs it, with its prompt, provenance, and variant records.

## Thin implementation slices

1. Add obstacle data, shared availability rules, and atomic clearing by pair merge.
   Exit: only clutter that is adjacent to the destination clears. Anchor matching works. Reveals do not
   cascade and do not lose items on a full board. Every path in item 8 enforces the same rules.
2. Add validated persistence and legacy migration.
   Exit: resolved obstacles never give items twice. Every valid old board keeps every occupied cell and usable cell after import and reload. This includes full boards and full pantries.
3. Add board visuals, the web removal at preparation 1, accessible explanations, hint updates, and owner-document changes.
   Exit: all input methods can inspect and clear obstacles. The free-space counts are exact.

## Acceptance and evidence

- Engine: test adjacency to the destination, to the source, and diagonally. Test several adjacent wrappers, no reveal cascade, and matching and wrong anchor merges. Test terminal items, blocked service, blocked quest delivery, blocked storage, and blocked sale. Test spawn, retrieval, quest-source acceptance, and preparation unlocks on a board whose only `null` cells are obstacles. Test a full board, a full pantry, discoveries, exact XP, repeated actions, and atomic failure.
- Data: test that a layout with a wrapper surrounded by wrappers fails validation.
- Save: cover no clearing, partial clearing, and full clearing. Also cover legacy full boards, export, import, unknown layout IDs, and duplicate IDs. Also cover migration retries and failed writes. Show that a reload keeps the layout and the resolved list, and that every new-game path selects the blocked layout.
- Browser: follow [Verification and release](README.md#verification-and-release). Also cover keyboard navigation, pointer actions, touch actions, text labels, hints, the web removal at preparation 1, and reduced motion.
- Manual: finish early production and late production with obstacles intact. Record the available space
  and the recovery actions. Confirm that clutter, anchors, and movable ingredients are distinct at the phone cell size.
- Implementation checks: typecheck, Node tests, build, browser tests, and a legal campaign
  simulation that proves no prerequisite for clearing. The atlas needs the asset checks of `tests/assets.test.ts`.

## Dependencies and open decisions

The first slice needs no other new feature. Spec 006 must include revealed items
in the balance fixtures. The scene areas of spec 001 are separate from board availability.
Confirm the draft layout, the names, the ingredient codes, and the introductory explanation. Use legal campaign play and visual review. Do not claim that tests cover these choices.
