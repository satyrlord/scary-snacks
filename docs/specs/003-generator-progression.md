# 003: Ingredient sources

Status: Implemented.

## Outcome and scope

Each open chain has one source. A source gives only its stage-1 ingredient. The player makes every other dish by a merge.
Spec 012 gives the 12 chains, their sources, and the mixed dishes.

## Rules

1. Three sources start on the board: the Windmill, the Corn basket, and the Herb basket.
   Preparations 3, 5, 6, 7, 8, 11, 13, 16, and 20 unlock the other nine sources.
2. Tapping a source or pressing Enter or Space on its focused tile gives one stage-1 ingredient. A take is immediate and predictable.
3. A take from a paid source spends the take cost. A paid source shows that cost on its tile.
   A take from the Herb basket is free.
4. A source gives the same stage-1 ingredient at every point in the campaign.
5. The selected-source line names the source and says that another tap takes its ingredient. It shows Clear selection. A source cannot merge.
6. A take fails if the selected cell has no source, the board has no free space, or the purse holds less than the take cost.
   Mara says why. Failure changes nothing and spends nothing.
7. Open quests keep their authored requirements and rewards. Higher-stage dishes require merges at every point in the campaign.

## Data and state

- `tools/create-original-data.ts` authors one stage-1 output for each source. It marks the Herb basket as free.
- `src/content.ts` checks that each source has one valid output and that the merge chains are complete.
- `src/model.ts` returns the stage-1 output for an unlocked source and the take cost of a source. `src/engine.ts` applies each take and spends its cost.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index. Loads and imports keep valid progress; invalid data and failed writes do not replace a valid save.

## Balance with the campaign test

The campaign fixture makes each required item from spare food on the board, or from stage-1 ingredients, merges, and recipes.
It pays for each take from a paid source.
It pays all 24 preparations, delivers all required quests, and serves the supper without injected coins or items.
It checks for board deadlocks. It records actions, takes, merges, deliveries, free cells, and coins by preparation and chapter.
These counts measure one deterministic strategy, not player time.

## Acceptance and evidence

- Engine: check stage-1 production after each unlock, the take cost of a paid source, a free take from the Herb basket, and merge paths.
  Check that a take on a full board or with a short purse changes nothing.
- Save: check current-format loads, export, import, and failed writes.
- Browser: check repeated taps, keyboard activation, touch emulation, full boards, a short purse, reduced motion, and source help.
  Check the take cost on a paid source and the shared line on phones and desktops in both themes.
