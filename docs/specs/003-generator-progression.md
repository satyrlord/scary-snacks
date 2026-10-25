# 003: Ingredient sources and the source tab

Status: Implemented.

## Outcome and scope

Each open chain has one source. A source gives only its stage-1 ingredient. The player makes every other dish by a merge.
Spec 012 gives the chains, their sources, and the mixed dishes. Spec 017 gives the seasonal sources.
The sources stand in the source tab beside the board, so a late game with many sources keeps the whole board for dishes.

## Rules

1. A source is never on the board. The sources are in the source tab, on the left side of the board.
   The tab has one place for each source of the game. A place without a source shows nothing, so the tab keeps space for the sources that the player has not met.
2. At the start of act 1, the tab holds the Windmill, the Corn basket, the Herb basket, and the pickle barrel, in this order.
   Preparations 3, 5, 6, 7, 8, 11, 12, 13, and 16 unlock the other nine sources of the year-round chains. Each event of the prologue has its own sources.
3. A new source goes into the place after the last source, so the default order is the order of arrival.
   A source that leaves frees its place, and the sources after it move up one place.
4. The player can drag a source up or down to another place. The other sources move to make room. A drop on a free place puts the source last.
   A drop outside the tab changes nothing. With the keyboard, Alt and the Up or Down arrow key move the focused source by one place.
   A move changes only the order. It does not move the clock. The save keeps the order.
5. A tap on a source, or Enter or Space on the focused source, gives one stage-1 ingredient in the first free cell of the board.
   A take is immediate and predictable. A take keeps the selection on the board.
6. A take from a paid source spends the take cost. A paid source shows that cost.
   A take from the Herb basket is free.
7. A source always gives the same stage-1 ingredient. A source cannot merge.
8. A take fails if the board has no free cell or the purse holds less than the take cost.
   Mara says why. A failed take changes nothing and spends nothing.
9. Open quests keep their authored requirements and rewards. Higher-stage dishes always require merges.

## Data and state

- `tools/create-original-data.ts` authors one stage-1 output for each source. It marks the Herb basket as free.
  It authors the sources of act 1 and of each prologue event as lists of chains. The boards hold only dishes.
- `src/content.ts` checks that each source has one valid output, that each source list names known sources once, that no board holds a source, and that the merge chains are complete.
- `src/model.ts` returns the stage-1 output for an unlocked source and the take cost of a source. `src/engine.ts` applies each take and spends its cost, adds each new source at the end of the source list, and applies a move of a source.
- The game state records the source list in the order of the tab. Save validation rejects a source that is not open, a source that is in the list twice, a source that is not discovered, an open chain without its source, and a source on the board. After its season, a seasonal source must stay while an undelivered campaign quest or an open repeating quest needs its chain. The save also keeps the source between the last such delivery and the next closing.
- `src/sources.ts` draws the tab, takes on a tap, and moves a source on a drag or with the keyboard.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index. Loads and imports keep valid progress. Invalid data and failed writes do not replace a valid save.

## Balance with the campaign test

The campaign fixture makes each required item from spare food on the board, or from stage-1 ingredients, merges, and recipes.
It pays for each take from a paid source.
It pays all 66 preparations, delivers all required quests and the three finales, and buys the orchard without injected coins or items.
It checks for board deadlocks. It records actions, takes, merges, deliveries, free cells, and coins by preparation and chapter.
These counts measure one deterministic strategy, not player time.

## Acceptance and evidence

- Engine: check stage-1 production after each unlock and the take cost of a paid source.
  Check a free take from the Herb basket and the merge paths.
  Check that a take on a full board or with a short purse changes nothing.
  Check that a move of a source changes only the order, that a refused move changes nothing, and that a new source joins the end of an arranged tab.
  Check that a new source comes to a full board.
- Save: check current-format loads, export, import, and failed writes.
- Browser: check repeated taps, keyboard activation, touch emulation, full boards, a short purse, reduced motion, and source help.
  Check a drag of a source and a keyboard move, and the order after a reload.
  Check the take cost on a paid source and the shared line on phones and desktops in both themes.
