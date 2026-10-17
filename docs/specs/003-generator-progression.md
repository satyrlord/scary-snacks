# 003: Generator progression

Status: Implemented.
Owner: `PRODUCT.md` for play; `DESIGN.md` for generator controls.

## Current evidence

- `tools/create-original-data.ts` authors the base outputs and production tiers.
- Three generators start on the board. Preparations 3 and 6 unlock the other two.
- `src/engine.ts` derives earned outputs from completed preparations and validates the chosen outputs.
- A take gives the chosen output and leaves the seed unchanged.
- `validateGame` requires exactly one generator for each unlocked chain on the board.
- `tests/engine.test.ts` covers free output, generator counts, and full-board failure.
- The campaign test in `tests/engine.test.ts` completes all 24 preparations with legal actions.
  The test compares both production schedules and reports orders, merges, actions, and XP by chapter.
- `src/storage.ts` validates and persists the current save format.
- The Covered Dish Rule in `DESIGN.md` forbids a preview of anything that the player has not earned.

## Outcome and scope

Give later chapters permanent production improvements. Keep every dish reachable.
Keep the five chains, unlimited output, no timers, and no consumable generator parts.
Do not add purchases, a backend, runtime packages, or imported game content.
Generator assembly is outside this feature.

## Implemented behavior

1. Each unlocked chain has a permanent production tier and one physical generator.
2. Tier one produces stage one. Tier two adds a stage-two output. Tier three adds a stage-three output.
3. A generator keeps all its lower outputs. The player chooses the output of each take.
4. A take gives exactly the chosen output. A take does not use the random seed. A take has no waiting period.
5. All unlocked chains get tier two when preparation 12 completes.
   All unlocked chains get tier three when preparation 20 completes.
6. The tier of a chain comes only from the completed preparations.
   A generator that a preparation unlocks starts at the current tier of its chain.
7. The game shows nothing about an upgrade before the player pays for its preparation.
   The story card, Mara's line, and the selected source do not name a future tier, output, or preparation.
8. After the player pays, the completion message names each new output, for example "The Flour bin can now make Dough."
   The reveal of the room does not change.
9. An upgrade creates no item, uses no board space, and does not change the identity of the generator.
10. The selected source shows one Take button for each output that the source can make now.
    Each Take button shows the picture of its output and names the output, for example "Take Dough".
    At tier one, the selected source shows one Take button, as before.
11. A Take button takes one item of its output and makes that output the chosen output.
    A tap on the source takes one item of the chosen output.
12. A new generator has stage one as the chosen output. An upgrade does not change the chosen output.
13. Orders already on the counter keep their requirements and rewards after an upgrade.
14. A take of an unearned output, a take from a cell without a generator, or a take on a full board fails.
    The failure changes no state, no random seed, no chosen output, and no tier.
    The failure message does not name an unearned output or preparation.
15. The game does not allow the sale or the merge of a generator.

## Data and state

- Author the tiers in `tools/create-original-data.ts`. Each tier has a chain, a stage, and the ID of the preparation that grants it.
- Check the tiers before the generator writes the data. Each tier stage must belong to its chain.
  The tier stages of a chain must increase in preparation order. A tier must not come before the preparation that unlocks its chain.
- Store the chosen outputs in `outputChoices`. Store one item ID for each chain whose chosen output is not stage one.
- Validate `outputChoices` with strict bounds. Each key must be an unlocked chain.
  Each value must be a non-generator item of that chain, from stage two to the earned tier.
- `src/engine.ts` owns the tiers, the chosen outputs, and the output validation. `src/app.ts` owns their presentation.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
- Save and reload preserve the sparse `outputChoices` map and all current progress.
- An invalid write or a failed write preserves the prior save and does not report success.

## Implemented slices

1. Engine and content: `generatorTierProblems` checks the authored tiers. `generatorOutputs` returns earned outputs. The spawn action takes an optional output and changes the choice only on success.
2. Persistence: the current envelope stores sparse `outputChoices` and validates each chosen output.
3. Interface: the selected source has pictorial Take buttons with a pressed state. The paid story names new outputs. The owner documents define the controls and their compact phone row.

## Balance with the campaign test

The campaign test in `tests/engine.test.ts` uses seed 84017. It chooses the order with the lowest total stage-one ingredient cost. It takes the highest earned output that each required item needs, then merges. It injects no coins or items. It validates every action and completes all 24 preparations with no deadlock.

Compare actions, merges, orders, and XP for both production schedules. The fixture measures one seeded strategy.

## Acceptance and evidence

- Engine: test both tier boundaries and a full board.
  Also test unearned outputs, repeated actions, and every output that outstanding low-stage orders need.
  Test that a take does not change the seed.
- Save: test save and reload of a complete campaign and a partial campaign.
  Also test invalid chosen outputs, unknown IDs, write failure, import, export, and repeated load.
  No load can duplicate a reward or a generator.
- Browser: follow [Verification and release](README.md#verification-and-release).
  Check the Take labels, focus, and reduced motion.
  Check the selected source with three Take buttons at 360px, in both themes.
  Check that no unearned output shows before the payment of its preparation.
- Implementation checks: run `npm run typecheck` and `npm test`. Then run `npm run build` and
  `npm run test:browser`. Update the delivery evidence and the visual evidence with the measured results.

## Dependencies and open decisions

The first slice depends only on the current rules for completed preparations and generators.
Specs 004 and 005 may later grant tiers. Such a spec must extend the tier rule in item 6. Neither spec is required to ship this feature.
Spec 006 must include upgraded output in its economy checks.
Each merge gives one XP, so upgraded production gives less XP. Spec 004 must set its level thresholds with the upgraded production.
The selected tier preparations are 12 and 20.
