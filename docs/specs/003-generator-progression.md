# 003: Ingredient sources

Status: Implemented.

## Outcome and scope

Each unlocked chain has one source. A source gives only its stage-1 ingredient. The player makes every higher-stage dish by merging.

## Rules

1. Three sources start on the board. Preparations 3 and 6 unlock the other two.
2. Tapping a source or pressing Enter or Space on its focused tile gives one stage-1 ingredient. A take is free, immediate, and predictable.
3. A source never changes its output. Preparations 12 and 20 do not change production.
4. The selected-source line names the source and its ingredient. It shows Clear selection. A source cannot merge.
5. A take fails if the selected cell has no source or the board has no free space. Failure changes nothing.
6. Open quests keep their authored requirements and rewards. Higher-stage dishes require merges at every point in the campaign.

## Data and state

- `tools/create-original-data.ts` authors one stage-1 output for each source.
- `src/content.ts` checks that each source has one valid output and that the merge chains are complete.
- `src/model.ts` returns the stage-1 output for an unlocked source. `src/engine.ts` applies each take.
- Existing version-11 saves have an `outputChoices` field. It is required by the current save format but has no effect on production. A nonempty field is accepted only if its chain and stage match an earned milestone in `generatorTiers`. New games have an empty field, and takes leave it unchanged.
- The saved-choice milestones in game data support validation of current-format saves. They do not unlock outputs.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index. Loads and imports keep valid progress; invalid data and failed writes do not replace a valid save.

## Balance with the campaign test

The campaign fixture makes each required item from stage-1 ingredients and merges. It pays all 24 preparations and delivers all required quests without injected coins or items. It checks for board deadlocks and records actions, takes, merges, deliveries, and coins by preparation and chapter. These counts measure one deterministic strategy, not player time.

## Acceptance and evidence

- Engine: check production before and after preparations 12 and 20, blocked takes, merge paths, and strict validation of saved choices.
- Save: check current-format loads, export, import, failed writes, and a saved higher-stage choice that does not affect later takes.
- Browser: check repeated taps, keyboard activation, touch emulation, full boards, reduced motion, source help, and the shared line on phones and desktops in both themes.
