# 007: Board clearing

Status: Proposed. Not implemented. The layout and contents below are draft defaults.
Owner: `PRODUCT.md` for board rules; `DESIGN.md` for blocked-space presentation.

## Current evidence

- `tools/create-original-data.ts` authors a 42-cell board with seven initial items.
- All other cells are usable immediately. No obstacle data and no locked-cell data exist.
- `src/engine.ts` treats every `null` cell as available for spawn, retrieval, and unlocks.
- `src/app.ts` counts every empty cell as free and allows board navigation across all cells.
- Tests cover recovery of a full board. They do not cover boards that are partially locked.

## Outcome and scope

Let merges reveal workbench space and ingredients. Give anchored items a distinct goal.
Keep the six-by-seven board, the 12 pantry spaces, unlimited generation, and no waiting.
Use newly authored bistro clutter and layouts. Do not reproduce archived layouts or assets.
Reveals use ordinary ingredients from existing chains. Do not add consumable tools,
currencies, reward chests, timers, energy costs, or a paid Clear action.

## Proposed behavior

1. Draft layout for a fresh game: eight authored edge cells hold four clutter wrappers and four
   anchored ingredients. The remaining 34 cells keep the ordinary board behavior.
   These positions must not overlap initial items or generators.
   Draft theme: a clutter wrapper is old bistro clutter that dust and spider webs cover.
   A merge beside the wrapper removes the webs. Spiders do not appear on the board.
   The webs are not creatures, so the rule of spec 008 about setting details still holds.
2. Each obstacle has a stable identifier (ID), a position, a readable name, a type, and an ordinary ingredient
   code. Its chain must be available at the start of the game. Its merge successor must exist.
3. A successful pair merge clears each clutter wrapper that shares a side with the destination of the merge. Each wrapper clears one time. Reveal the configured ingredient of the wrapper in its own cell.
   Diagonal contact does not clear clutter. Adjacency to the source cell does not clear clutter.
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

## Data, state, and migration

- Author the layout records and the obstacle records in `tools/create-original-data.ts`. Validate unique
  IDs and positions, valid bounds and types, reachable ingredient codes, and separation from initial items.
- Store a layout ID and the resolved obstacle IDs. The layout data defines the contents of unresolved obstacles. These contents are separate from movable board items. Reject movable items inside unresolved obstacles.
- Validate that the resolved IDs are known and unique and that the cell state is consistent. Discover visible anchored
  ingredients at a fresh start. Discover hidden ingredients only when the game reveals them.
- `engine.ts` owns availability and clear transitions. `app.ts` owns visuals and input.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
- Agree on one target schema and key across features. Validate before and after conversion,
  keep the original bytes, and make a repeated conversion give the same result.
- All migrated saves use a legacy open layout with no blocked cells. Do not put
  obstacles beneath existing items, move items, reduce usable space, or revoke progress.
- Keep the board order, pantry, counters, coins, preparations, orders, and discoveries exactly as they are.
  Only a confirmed fresh start selects the authored blocked layout.
- Invalid imports and failed writes keep the previously saved bytes and report the failure clearly.

## Thin implementation slices

1. Add obstacle data, shared availability rules, and atomic clearing by pair merge.
   Exit: only clutter that is adjacent to the destination clears. Anchor matching works. Reveals do not
   cascade and do not lose items on a full board. All placement paths enforce the same rules.
2. Add validated persistence and legacy migration.
   Exit: resolved obstacles never give items twice. Every valid old board keeps every occupied cell and usable cell after import and reload. This includes full boards and full pantries.
3. Add board visuals, accessible explanations, hint updates, and owner-document changes.
   Exit: all input methods can inspect and clear obstacles. The free-space counts are exact.

## Acceptance and evidence

- Engine: test adjacency to the destination, to the source, and diagonally. Test several adjacent wrappers, no reveal cascade, and matching and wrong anchor merges. Test terminal items, blocked service, blocked storage, and blocked sale. Test a full board, a full pantry, discoveries, exact XP, repeated actions, and atomic failure.
- Save: cover no clearing, partial clearing, and full clearing. Also cover legacy full boards, export, import, and duplicate IDs. Also cover migration retries, failed writes, and a fresh start that uses the new layout only one time.
- Browser: follow [Verification and release](README.md#verification-and-release). Also cover keyboard navigation, pointer actions, touch actions, text labels, hints, and reduced motion.
- Manual: finish early production and late production with obstacles intact. Record the available space
  and the recovery actions. Confirm that clutter, anchors, and movable ingredients are distinct.
- Implementation checks: typecheck, Node tests, build, browser tests, and a legal campaign
  simulation that proves no prerequisite for clearing. Asset work needs its own provenance checks.

## Dependencies and open decisions

The first slice needs no other new feature. Spec 006 must include revealed items
in the balance fixtures. The scene areas of spec 001 are separate from board availability.
Confirm the eight original positions, the names, the ingredient codes, and the introductory explanation. Use legal campaign play and visual review. Do not claim that tests cover these choices.
