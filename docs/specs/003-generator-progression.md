# 003: Generator progression

Status: Implemented. Human pacing acceptance remains open.
Owner: `PRODUCT.md` for play; `DESIGN.md` for generator controls.

## Current evidence

- `tools/create-original-data.ts` authors the base outputs and production tiers.
- Three generators start on the board. Preparations 3 and 6 unlock the other two.
- `src/engine.ts` derives earned outputs from completed preparations and validates the chosen outputs.
- A take gives the chosen output and leaves the seed unchanged.
- `validateGame` requires exactly one generator for each unlocked chain across the board and the pantry.
- `tests/engine.test.ts` covers free output, pantry storage, generator counts, and full-board failure.
- The campaign test in `tests/engine.test.ts` completes all 24 preparations with legal actions.
  The test compares both production schedules and reports orders, merges, actions, and XP by chapter.
- `src/storage.ts` converts envelopes 1, 2, and 3 to envelope 4, with a validated step for each version.
- The Covered Dish Rule in `DESIGN.md` forbids a preview of anything that the player has not earned.

## Outcome and scope

Give later chapters permanent production improvements. Keep every dish reachable.
Keep the five chains, unlimited output, no timers, and no consumable generator parts.
Do not add purchases, a backend, runtime packages, or imported game content.
Generator assembly and temporary producers are outside this feature.

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
   An upgrade also applies to a generator in the pantry.
10. The selected source shows one Take button for each output that the source can make now.
    Each Take button shows the picture of its output and names the output, for example "Take Dough".
    At tier one, the selected source shows one Take button, as before.
11. A Take button takes one item of its output and makes that output the chosen output.
    A tap on the source takes one item of the chosen output.
12. A new generator and a converted generator have stage one as the chosen output. An upgrade does not change the chosen output.
13. Orders already on the counter keep their requirements and rewards after an upgrade.
14. A take of an unearned output, a take from a cell without a generator, or a take on a full board fails.
    The failure changes no state, no random seed, no chosen output, and no tier.
    The failure message does not name an unearned output or preparation.
15. The game does not allow the sale or the merge of a generator. A generator in the pantry keeps its chosen output.

## Data, state, and migration

- Author the tiers in `tools/create-original-data.ts`. Each tier has a chain, a stage, and the ID of the preparation that grants it.
- Check the tiers before the generator writes the data. Each tier stage must belong to its chain.
  The tier stages of a chain must increase in preparation order. A tier must not come before the preparation that unlocks its chain.
- Store the chosen outputs in `outputChoices`. Store one item ID for each chain whose chosen output is not stage one.
- Validate `outputChoices` with strict bounds. Each key must be an unlocked chain.
  Each value must be a non-generator item of that chain, from stage two to the earned tier.
- `src/engine.ts` owns the tiers, the chosen outputs, and the output validation. `src/app.ts` owns their presentation.
- Current saves use game state version 6 in envelope version 5 at `scary-snacks-save-v5`. They include level claims and quest progress.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
- Convert every older supported save one version at a time through envelopes 1, 2, 3, 4, and 5.
  Validate the state before and after each conversion. Keep the bytes of every older key.
- Load the newest key that exists. Convert from an older key only if no newer key exists.
- Preserve items, pantry positions, counters, completed preparations, and outstanding orders.
  The conversion adds an empty `outputChoices`.
- Conversion and reload must not duplicate a generator or a reward.
  An invalid write or a failed write preserves the prior save and does not report success.

## Implemented slices

1. Engine and content: `generatorTierProblems` checks the authored tiers. `generatorOutputs` returns earned outputs. The spawn action takes an optional output and changes the choice only on success.
2. Persistence: envelopes 1 and 2 convert through each state version. Each conversion validates its input and output. The current envelope stores sparse `outputChoices`.
3. Interface: the selected source has pictorial Take buttons with a pressed state. The paid story names new outputs. The owner documents define the controls and their compact phone row.

## Balance with the campaign test

The campaign test in `tests/engine.test.ts` uses seed 84017. It chooses the order with the lowest total stage-one ingredient cost. It takes the highest earned output that each required item needs, then merges. It injects no coins or items. It validates every action and completes all 24 preparations with no deadlock.

The table gives chapter totals as actions / merges / orders / XP. An action is one engine action, not one physical tap.

| Chapter | Tier one only | Tiers at 12 and 20 |
| --- | --- | --- |
| 1 | 30 / 4 / 9 / 136 | 30 / 4 / 9 / 136 |
| 2 | 76 / 20 / 16 / 228 | 76 / 20 / 16 / 228 |
| 3 | 143 / 46 / 20 / 358 | 143 / 46 / 20 / 358 |
| 4 | 231 / 85 / 22 / 493 | 121 / 30 / 22 / 438 |
| 5 | 330 / 135 / 22 / 591 | 170 / 55 / 22 / 511 |
| 6 | 528 / 243 / 14 / 667 | 138 / 48 / 14 / 472 |
| Total | 1,338 / 533 / 103 / 2,473 | 678 / 203 / 103 / 2,143 |

The selected schedule improves all chains together. It reduces production actions while keeping 48 merges in the last chapter and the same number of orders. This is evidence from one seed and one order strategy. It does not establish human pacing. Spec 004 must account for the lower XP total.

## Acceptance and evidence

- Engine: test both tier boundaries, generators in the pantry, and a full board.
  Also test unearned outputs, repeated actions, and every output that outstanding low-stage orders need.
  Test that a take does not change the seed.
- Save: test the conversion of a complete campaign and a partial campaign from envelope 1 and from envelope 2.
  Also test invalid chosen outputs, unknown IDs, write failure, import, export, and repeated load.
  No load can duplicate a reward or a generator.
- Browser: follow [Verification and release](README.md#verification-and-release).
  Check the Take labels, focus, retrieval from the pantry, and reduced motion.
  Check the selected source with three Take buttons at 360px, in both themes.
  Check that no unearned output shows before the payment of its preparation.
- Manual: complete a late chapter with tier one only and with the upgraded production.
  Record the action counts, and record if low-stage orders stay clear. Do not infer balance from unit tests.
- Implementation checks: run `npm run typecheck` and `npm test`. Then run `npm run build` and
  `npm run test:browser`. Update the delivery evidence and the visual evidence with the measured results.

## Dependencies and open decisions

The first slice depends only on the current rules for completed preparations and generators.
Specs 004 and 005 may later grant tiers. Such a spec must extend the tier rule in item 6. Neither spec is required to ship this feature.
Spec 006 must include upgraded output in its economy checks.
Each merge gives one XP, so upgraded production gives less XP. Spec 004 must set its level thresholds with the upgraded production.
The selected tier preparations are 12 and 20. Human acceptance remains open: complete chapter 6 once with only stage-one Take buttons and once with the highest useful outputs. Count takes, merges, serves, and payments. Check that low-stage orders remain clear. Physical touch and assistive technology also need a person to check them.
