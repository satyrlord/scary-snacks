# 005 - Character quests and introductions

Status: Implemented independent slices.
Spec 009 queues each quest completion scene and resumes it after reload. Spec 006 includes all quests in its economy fixture. Spec 008 names one regular quest of each arc as a chapter contribution.

## Result and ownership

Each of Mara, Ilie, Eszter, and Sorin has three authored quests across the six chapters.
The journal has an optional introduction for each neighbour and replay of completed quest scenes.
All four core characters remain eligible for ordinary orders. Introductions never block service.

The engine owns eligibility, delivery, and validation. Storage owns the envelopes and durable writes.
The app owns the quest sheet, the dialogue, and focus return.
`tools/create-original-data.ts` authors every record. `public/data/game.json` is generated.
PRODUCT, DESIGN, and README own the current product, interface, and delivery contracts.

The five permanent chains, 30 permanent dishes, four core characters, 24 preparation IDs, and three ordinary orders stay.
Quests use only ordinary dishes and drinks. No quest lends a source or adds quest-only items.
There is no new currency, timer, energy limit, runtime dependency, backend, or network service.

## Visiting travellers

Adrian, Monica, and Janos each return for three optional supply requests. They do not enter ordinary orders. Each visit waits for the previous visitor delivery and its service and preparation goals. Milestones are cumulative, so an established player can complete waiting visits in order. There is no timer. Each reward pays twice the menu value.

| Quest ID | Preparation | Orders served | Requirements | Coins |
| --- | --- | --- | --- | --- |
| adrian-first-pack | 6 | 24 | 8 Pogăcele, 4 Bulz, 4 Fruit tea | 592 |
| monica-first-pack | 6 | 48 | 2 Zacuscă toast, 2 Wild mushroom sauce, 2 Cabbage rolls | 424 |
| janos-first-pack | 6 | 72 | 4 Langoș, 4 Papanași, 4 Fruit tea | 576 |
| adrian-second-pack | 12 | 96 | 2 Goulash pot, 2 Bread basket | 460 |
| monica-second-pack | 12 | 120 | 6 Roasted vegetables, 6 Pogăcele, 4 Cherry compote | 520 |
| janos-second-pack | 12 | 144 | 2 Chimney cake, 2 Sharing board, 2 Cabbage rolls | 600 |
| adrian-third-pack | 20 | 168 | 6 Langoș, 6 Smoked cheese plate, 4 Fruit tea | 888 |
| monica-third-pack | 20 | 192 | 2 Bread basket, 2 Goulash pot, 2 Sharing board | 720 |
| janos-third-pack | 20 | 216 | 2 Cozonac, 2 Cabbage rolls, 2 Wild mushroom sauce | 472 |

## Single-visit dinner

Ionatan is a foreign real estate agent. His only quest, `ionatan-castle-dinner`, opens after preparation 16 and 120 ordinary services. It needs one goulash pot, one sharing board, one chimney cake, and one plum brandy. The 220-coin dinner pays 1,100 coins. It has no previous-quest prerequisite and blocks no other quest or preparation.

His introduction appears only while his request is active. Delivery records the quest ID once and shows his farewell. After that scene, his introduction and quest replays are absent. He never becomes an ordinary customer. Reload and export/import preserve his completed visit. A new game permits another visit. A failed write keeps the departure in the session; reload restores only durable progress.

## Shared search visit

Mina and Doctor Avram share one optional visit per save. Their quest, `mina-avram-search`, has `mina` as its character and `avram` as its companion.
It opens after preparation 16, after Ionatan's dinner is complete, and after three more ordinary services.
It also waits until no order from Vlad or Elisabeta is at the counter.
From the time the visit can open until its delivery, Vlad and Elisabeta get no new orders.
The request needs two zacuscă toasts, two roasted vegetable plates, one smoked cheese plate, and two fruit teas.
The meal is vegetarian. It has a menu value of 168 coins and pays 336 coins.

Their introductions appear only while their request is active. The request card shows both names and both portraits.
Delivery records the quest ID once and shows their farewell. After that scene, their introductions and quest replays are absent.
They never become ordinary customers and never meet Ionatan at the bistro. A new game permits another visit.

Three ordinary services after the delivery, the local news scene `mina-avram-news` ("News from the road") becomes a waiting scene.
Sorin and Mara tell that Mina and Avram found Ionatan gravely ill, and that all three left for Britain.
The scene has only local speakers and gives no reward. After its service gate, the journal shows it under Local news.

## Authored requests

A preparation number in the opening column means that preparation must be complete.
Each neighbour's earlier quests must also be complete.
Quantities are explicit. Rewards are coins only and give no XP.

| Quest ID | Opens after | Requirements | Coins |
| --- | --- | --- | --- |
| mara-welcome | New game | 1 Socată | 16 |
| ilie-counter | 1 | 1 Pogăcele | 16 |
| eszter-bowls | 4 | 2 Mămăligă | 16 |
| sorin-lunch | 6 | 1 Pogăcele, 1 Socată | 16 |
| mara-table | 8 | 1 Bulz | 24 |
| eszter-table | 9 | 1 Papanași | 24 |
| ilie-courtyard | 12 | 1 Langoș | 24 |
| sorin-path | 13 | 1 Roasted vegetables, 1 Socată | 24 |
| ilie-family | 16 | 1 Smoked cheese plate | 32 |
| eszter-tasting | 17 | 1 Plum dumplings | 32 |
| mara-supper | 20 | 1 Zacuscă toast, 1 Smoked cheese plate | 32 |
| sorin-welcome | 20 | 2 Fruit tea, 1 Roasted vegetables | 32 |

The regular arcs give at most 288 coins.
Mara tests a welcome and a supper service. Ilie prepares the bread counter and a family tasting dish.
Eszter checks bowl and plate sizes. Sorin prepares food around errands and the courtyard welcome.
These purposes do not depend on random customer arrival or an inferred identity.

## Quest rules

1. A quest has a stable ID, character ID, opening prerequisites, item quantities, coin reward, opening scene, and completion scene.
   A quest can also have companions, a number of services after its previous quest, customers that it waits for, and a later news scene.
2. At most one quest per character is active. A companion counts as a character of the quest. Authored order resolves eligibility.
3. Delivery consumes the full requirement from the board in one action.
4. Repeated requirement entries count separately. Missing items, a stale ID, a completed ID, or a reward overflow change nothing.
5. Success records completion and the service total at delivery, and pays once. It does not replace ordinary orders, advance their seed, or change the served-order count.
6. Every required permanent chain is available before activation. The combined quest and preparation graph must have no cycle.
7. The engine supports a preparation's `requiresQuest` prerequisite. The authored campaign has no quest gate. Ordinary orders and preparations remain playable independently.
8. Reading, skipping, replaying, reloading, and repeated clicks give no second reward.
9. Quest scenes use the existing dialogue controls. The completion scene waits until the player finishes or skips it, as spec 009 gives. Recorded completion and journal replay remain available.

`questProblems` checks IDs, scenes, quantities, rewards, ordinary requested items, chain availability, authored order, and combined prerequisite reachability.
It also checks companions, service delays, the order lists of occasional customers, the customers that a quest waits for, and news scenes.
Each customer that stays away during a quest must be a customer that the quest waits for.
The content generator refuses invalid quest data.

## Interface

Story opens Neighbour quests without adding another ticket above the board.
Each section shows the neighbour, request title, quantities, board counts, and reward. A shared request shows both visitors.
Read request opens the purpose. Ingredient help shows the source and merge chain.
Deliver is unavailable until the board holds every required item.
When a load or an action makes a request ready, a request dialog offers Deliver once. The dialog delivers nothing by itself.
It waits for other dialogs, stories, reveals, and the level-up dialog. Close leaves the request in Neighbour quests.
Saves do not record the offer, so each load offers the ready requests again.
An import, a change from another tab, and Neighbour quests mark the ready requests as shown.
Delivery from the dialog plays the completion scene, then returns to the kitchen. A failed save returns to Neighbour quests with Retry save.

The journal starts with optional introductions. Completed quests keep both their opening and completion scenes, except the quests of single-visit guests.
Local news shows an earned news scene. It reads as a new scene while it waits, and as a replay after that.
Close, Escape, and Return from a quest scene restore the quest list or journal focus.
The ordinary orders keep their requirements and rewards during all these flows.

## Save compatibility

The state stores unique, known `completedQuests`, consistent with prerequisites.
Unknown IDs and contradictory state are rejected.
A current save can hold Ilie's borrowed bread tasting, which the game does not have. `removeBreadTasting` in `src/engine.ts` removes it before validation, at load, at import, and before a write over such a save. It removes the record of borrowed sources, the tasting source and tasting items on the board and in the discovered list, and the quest from the completed list, the service totals, the waiting scenes, and the saved lines. The coins of a delivered tasting stay. A load alone does not rewrite the save.
See [Shared save compatibility](README.md#shared-save-compatibility).

The optional `questCompletedAt` records the service total at each delivery. Each entry names a completed quest.
Its value is an integer from 0 to the current service total. It is not before the service goal of the quest or the delivery of a previous quest.
A quest with a service delay must have an entry that agrees with that delay.
A current save without these entries stays valid. On its first successful ordinary service, the game records the service total
before that service as the entry for a completed quest that a delay or a news scene needs. That service counts as the first of the three.
A waiting news scene is valid only after its service gate.

A failed quest write keeps the session state and a visible unsaved warning.
Retry save and export can preserve that session. Reload restores only durable progress.
Import adopts a valid quest state only after its write succeeds.

## Acceptance and evidence

The Node.js tests cover repeated quantities, atomic failure, reward-once behavior, coin overflow, prerequisite cycles, unavailable chains, and malformed quest records.
The storage tests cover fresh, middle, and completed saves, malformed and oversized input, invalid completion lists, the removal of the bread tasting from a save, failed writes, and rejection of unsupported versions.
They cover the shared visit: its three-service delay, the wait for noble orders, the noble exclusion, the vegetarian request, the news scene, and service totals in current saves.
A legal engine campaign completes all 24 preparations and all 23 quests without injected resources. Its diagnostic output reports actions, merges, served orders, and chapter checkpoints. The fixture fails on a deadlock.

The built browser tests cover all four neighbours, board-only delivery, unchanged orders, keyboard focus, touch emulation, reload, export, import, scene replay, and unavailable storage.
They cover a save with the bread tasting, which opens without it.
They cover the shared request with both portraits, its departure through reload and import, a failed delivery save, and the news scene in the journal.
They cover the request dialog: one offer after a merge, Close, Deliver, the order after a level-up, a failed save, and the offer at each load.
The changed sheets have geometry, contrast, and screenshot checks at desktop and phone sizes in both themes.
Use `npm run quality:full` for the integrated acceptance check.

## Remaining integration

- 006 owns campaign gates and economy tuning. The legal simulation measures the current request schedule.
- 008 owns the chapter scenes and the finale. Each chapter names one regular quest that opens during it as its neighbour contribution. The journal shows the state of that quest beside the chapter. The contributions stay optional.
- 009 owns durable dialogue continuation. Quest completion scenes wait in that queue. Scene acknowledgement stays independent of rewards.
- 013 owns the neighbours page. The current optional introductions live in the story journal and do not gate ordinary orders.
