# 005 - Character quests and introductions

Status: Implemented independent slices, including the optional temporary producer.
Automatic scene continuation waits for 009. Spec 006 includes all quests in its economy fixture. Spec 008 names one regular quest of each arc as a chapter contribution. Human balance assessment remains open.

## Result and ownership

Each of Mara, Ilie, Eszter, and Sorin has three authored quests across the six chapters.
A thirteenth quest lends a temporary flour bin for Ilie's bread tasting.
The journal has an optional introduction for each neighbour and replay of completed quest scenes.
All four characters remain eligible for ordinary orders. Introductions never block service.

The engine owns eligibility, delivery, validation, and migration. Storage owns the envelopes and durable writes.
The app owns the quest sheet, the dialogue, and focus return.
`tools/create-original-data.ts` authors every record. `public/data/game.json` is generated.
PRODUCT, DESIGN, and README own the current product, interface, and delivery contracts.

The five permanent chains, 30 permanent dishes, four core characters, 24 preparation IDs, and three ordinary orders stay.
The temporary source and its three outputs have separate IDs and use the matching existing bread pictures.
There is no new currency, timer, energy limit, runtime dependency, backend, or network service.

## Authored requests

A preparation number in the opening column means that preparation must be complete.
Each neighbour's earlier quests must also be complete or legacy-satisfied.
Quantities are explicit. Rewards are coins only and give no XP.

| Quest ID | Opens after | Requirements | Coins | Legacy preparation |
| --- | --- | --- | --- | --- |
| mara-welcome | New game | 1 Socată | 16 | 1 |
| ilie-counter | 1 | 1 Pogăcele | 16 | 4 |
| eszter-bowls | 4 | 2 Mămăligă | 16 | 8 |
| sorin-lunch | 6 | 1 Pogăcele, 1 Socată | 16 | 8 |
| mara-table | 8 | 1 Bulz | 24 | 12 |
| eszter-table | 9 | 1 Papanași | 24 | 12 |
| ilie-courtyard | 12 | 1 Langoș | 24 | 16 |
| sorin-path | 13 | 1 Roasted vegetables, 1 Socată | 24 | 16 |
| ilie-family | 16 | 1 Smoked cheese plate | 32 | 18 |
| eszter-tasting | 17 | 1 Plum dumplings | 32 | 20 |
| mara-supper | 20 | 1 Zacuscă toast, 1 Smoked cheese plate | 32 | 24 |
| sorin-welcome | 20 | 2 Fruit tea, 1 Roasted vegetables | 32 | 24 |
| ilie-bread-tasting | 17 and Ilie's arc | 2 Tasting pogăcele | 24 | None |

The regular arcs give at most 288 coins. The optional tasting adds 24 coins.
Mara tests a welcome and a supper service. Ilie prepares the bread counter and a family tasting dish.
Eszter checks bowl and plate sizes. Sorin prepares food around errands and the courtyard welcome.
These purposes do not depend on random customer arrival or an inferred identity.

## Quest rules

1. A quest has a stable ID, character ID, opening prerequisites, item quantities, coin reward, opening scene, and completion scene.
2. At most one quest per character is active or offered. Authored order resolves eligibility.
3. Delivery consumes the full requirement from the board in one action. The pantry does not count.
4. Repeated requirement entries count separately. Missing items, a stale ID, a completed ID, or a reward overflow change nothing.
5. Success records completion and pays once. It does not replace ordinary orders, advance their seed, or change the served-order count.
6. Every required permanent chain is available before activation. The combined quest and preparation graph must have no cycle.
7. The engine supports a preparation's `requiresQuest` prerequisite. The authored campaign has no quest gate. Ordinary orders and preparations remain playable independently.
8. Reading, skipping, replaying, reloading, and repeated clicks give no second reward.
9. Quest scenes use the existing dialogue controls. They do not automatically resume after reload. Recorded completion and journal replay remain available.

`questProblems` checks IDs, scenes, quantities, rewards, source ownership, chain availability, authored order, legacy thresholds, and combined prerequisite reachability.
The content generator refuses invalid quest data.

## Temporary bread-tasting source

`ilie-bread-tasting` is an offer until Accept succeeds.
Acceptance places exactly one `quest_bread_source` on the board, or in the pantry when the board is full.
If both are full, the offer remains and nothing changes.
The interface explains the required space before acceptance.

The source gives `quest_bread_1` immediately. Two matching items merge through `quest_bread_2` to `quest_bread_3`.
The source and outputs belong only to this quest. They are excluded from ordinary orders, permanent source counts, generator upgrades, and the permanent recipe collection.
The source can move and enter the pantry. It cannot merge or be sold.
Its deterministic sequence has no cooldown, charge limit, or exhaustion.

Before delivery, a preview lists the exclusive leftovers after the required portions are consumed.
It includes the source and every remaining exclusive item on the board and in the pantry, with space numbers.
Keep items is the safe initial choice.
Confirmation consumes the requirements, removes only the explicitly exclusive IDs, records completion, and pays once.
The preview token covers the full state. Any intervening state change requires a new preview.
Ordinary items and items owned by another quest remain.

## Interface

Story opens Neighbour quests without adding another ticket above the board.
Each section shows the neighbour, request title, quantities, board counts, and reward.
Read request opens the purpose. Ingredient help shows the source and merge chain.
Deliver is unavailable until the board holds every required item.
The sheet states that stored items must return from the pantry.

The journal starts with optional introductions. Completed quests keep both their opening and completion scenes.
Close, Escape, and Return from a quest scene restore the quest list or journal focus.
Cleanup cancellation returns focus to the quest heading.
The ordinary orders keep their requirements and rewards during all these flows.

## Save compatibility

State version 6 uses envelope version 5 at `scary-snacks-save-v5`.
The state stores `completedQuests`, `legacySatisfiedQuests`, and `activeQuestProducers`.
The first two lists are unique, known, disjoint, and consistent with prerequisites.
Each active temporary source stores the next position in its output sequence.
Exactly one live source must exist across the board and pantry while its quest is active.
Exclusive leftovers cannot remain after completion or without ownership.

Valid older envelopes convert step by step. Each input and result is validated.
Regular quests tied to completed preparations become legacy-satisfied, without coins or items.
Their scenes are available in the journal. No completed preparation reopens.
Migration inserts no temporary source and does not accept the optional offer.
Repeated migration of the same input gives the same result. Old stored bytes remain unchanged.
Unknown IDs and contradictory state are rejected. A failed conversion never replaces a save.
See [Shared save compatibility](README.md#shared-save-compatibility).

A failed quest write keeps the session state and a visible unsaved warning.
Retry save and export can preserve that session. Reload restores only durable progress.
Import adopts a valid quest state only after its write succeeds.

## Acceptance and evidence

The Node.js tests cover repeated quantities, atomic failure, reward-once behavior, coin overflow, prerequisite cycles, unavailable chains, and malformed quest records.
They cover deterministic acceptance, full-board fallback, full-board and full-pantry failure, source protection, reload, stale previews, and exact cleanup.
The storage tests cover fresh, middle, and completed older saves, repeated conversion, malformed and oversized input, conflicting completion lists, source ownership, failed writes, and preservation of older keys.
A legal engine campaign completes all 24 preparations and all 13 quests without injected resources. Its diagnostic output reports actions, merges, served orders, and chapter checkpoints. The fixture fails on a deadlock.

The built browser tests cover all four neighbours, board-only delivery, unchanged orders, keyboard focus, touch emulation, reload, export, import, scene replay, and unavailable storage.
They cover temporary-source placement, pantry recovery, cleanup cancellation, and confirmation.
The changed sheets have geometry, contrast, and screenshot checks at desktop and phone sizes in both themes.
Use `npm run quality:full` for the integrated acceptance check.

Automated simulation does not establish human pacing. The remaining manual check is a short phone playthrough that judges each request's purpose and the effort between preparations.
Physical touch, assistive technology, and listening remain manual checks.

## Remaining integration

- 006 owns campaign gates and economy tuning. The current request schedule is measured by the legal simulation but has no human balance acceptance.
- 008 owns the chapter scenes and the finale. Each chapter names one regular quest that opens during it as its neighbour contribution. The journal shows the state of that quest beside the chapter. The contributions stay optional.
- 009 owns durable dialogue continuation. Quest completion scenes must enter that system when it is implemented. Scene acknowledgement must remain independent of rewards.
- 013 owns the neighbours page. The current optional introductions live in the story journal and do not gate ordinary orders.
