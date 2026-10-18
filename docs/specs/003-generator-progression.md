# 003: Generator progression

Status: Implemented.

## Outcome and scope

Later chapters give permanent production improvements. Every dish stays reachable.

## Rules

1. Each unlocked chain has a permanent production tier and one physical generator.
   Three generators start on the board. Preparations 3 and 6 unlock the other two.
2. Tier one produces stage one. Tier two adds a stage-two output. Tier three adds a stage-three output.
3. A generator keeps all its lower outputs. The player chooses the output of each take.
4. A take gives exactly the chosen output. A take is not random. A take has no waiting period.
5. All unlocked chains get tier two when preparation 12 completes.
   All unlocked chains get tier three when preparation 20 completes.
6. The tier of a chain comes only from the completed preparations.
   A generator that a preparation unlocks starts at the current tier of its chain.
7. The game shows nothing about an upgrade before the player pays for its preparation.
   The story card, Mara's line, and the selected source do not name a future tier, output, or preparation.
   The Covered Dish Rule in `DESIGN.md` gives this limit.
8. After the player pays, the completion message names each new output, for example "The Flour bin can now make Dough."
   The reveal of the room does not change.
9. An upgrade creates no item, uses no board space, and does not change the identity of the generator.
10. The selected source shows one Take button for each output that the source can make.
    Each Take button shows the picture of its output and names the output, for example "Take Dough".
    The Take button of the chosen output shows a pressed state.
    At tier one, the selected source shows one Take button.
11. A Take button takes one item of its output and makes that output the chosen output.
    A tap on the source takes one item of the chosen output.
12. A new generator has stage one as the chosen output. An upgrade does not change the chosen output.
13. Open quests keep their requirements and rewards after an upgrade.
14. A take fails in these cases: the output is unearned, the cell has no generator, or the board is full.
    A failed take changes no state, no chosen output, and no tier.
    The failure message does not name an unearned output or preparation.
15. The game does not allow the merge of a generator.

## Data and state

- `tools/create-original-data.ts` authors the base outputs and the tiers.
  Each tier has a chain, a stage, and the identifier (ID) of the preparation that grants it.
- `generatorTierProblems` checks the tiers before the generator writes the data. Each tier stage must belong to its chain.
  The tier stages of a chain must increase in preparation order. A tier must not come before the preparation that unlocks its chain.
- `validateGame` requires exactly one generator for each unlocked chain on the board.
- Store the chosen outputs in `outputChoices`. Store one item ID for each chain whose chosen output is not stage one.
- Validate `outputChoices` with strict bounds. Each key must be an unlocked chain.
  Each value must be a non-generator item of that chain, from stage two to the earned tier.
- `src/engine.ts` owns the tiers, the chosen outputs, and the output validation.
  `generatorOutputs` returns the earned outputs.
  `src/app.ts` owns their presentation. `src/storage.ts` stores the sparse `outputChoices` map.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
- Save and reload preserve the sparse `outputChoices` map and all current progress.
- An invalid write or a failed write keeps the previous save and does not report success.

## Balance with the campaign test

The campaign test in `tests/campaign-balance.test.ts` delivers the first open quest ticket and pays each preparation when it is ready. It takes the highest earned output that each required item needs, then merges. It injects no coins and no items. It validates every action and completes all 24 preparations and all quests with no deadlock. At the end, every source has its stage-three output.

The fixture reports actions, takes, merges, and deliveries for each preparation and chapter. It measures one deterministic strategy.

## Acceptance and evidence

- Engine: `tests/engine.test.ts` covers free output, generator counts, and full-board failure.
  Test both tier boundaries, unearned outputs, repeated actions, and every output that open low-stage quests need.
- Save: test save and reload of a complete campaign and a partial campaign.
  Also test invalid chosen outputs, unknown IDs, write failure, import, export, and repeated load.
  No load can duplicate a reward or a generator.
- Browser: follow [Verification and release](README.md#verification-and-release).
  Check the Take labels, the focus, and reduced motion.
  Check the selected source with three Take buttons at 360px, in both themes.
  Check that no unearned output shows before the payment of its preparation.
