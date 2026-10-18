# 004 - Character quests and introductions

Status: Implemented. The quests are the campaign.
Spec 008 queues each quest completion scene and resumes it after reload. Spec 005 owns the reward rule, the funding check, and the economy fixture. Spec 007 names one quest of a core character as the contribution of each chapter. Spec 010 owns the regulars.

## Result and ownership

The game has 81 authored quests. Quests are the only requests, and they earn every coin of the campaign.
The journal has an optional introduction for each neighbour and replay of completed quest scenes.

The engine owns eligibility, the tickets, delivery, and validation. Storage owns the envelopes and durable writes.
The app owns the tickets, the request dialog, the dialogue, and focus return.
`tools/create-original-data.ts` authors every record and generates `public/data/game.json`.
PRODUCT, DESIGN, and DELIVERY own the current product, interface, and delivery contracts.

The five permanent chains, 30 permanent dishes, and 24 preparation identifiers (IDs) stay.
Quests use only ordinary dishes and drinks. No quest lends a source or adds quest-only items.
There is no currency other than coins, and no timer, energy limit, runtime dependency, backend, or network service.

## The quest campaign

1. Each quest opens after a preparation (`afterTask`), or in a new game. A quest can also wait for one earlier quest (`afterQuest`). Each quest waits for the earlier quests of its character, so a character has at most one open quest.
2. A quest that opens after preparation N is necessary for preparation N + 1. Thus each preparation needs every quest that opens before it, and the player delivers every quest before the finale.
3. The quests are in the order in which they open. Every quest opens before the last preparation.
4. Three quest tickets sit on the counter. The first three open quests, in authored order, take the tickets. Other open quests wait without a ticket. The next open quest takes the first ticket that is free.
5. There is no deadline and no expiry.

| Character group | Quests |
| --- | --- |
| Mara, Ilie, Eszter, and Sorin | 6, 6, 8, and 6 |
| Ten regulars from spec 010 | 5 for Dochia and Costel; 4 for Victor, Ana, Sânziana, Dorian, Ileana, and Cezar; 3 for Cătălina and Bran |
| Vlad and Elisabeta | 2 each |
| Adrian, Monica, and Janos | 3 each |
| Ionatan | 1 |
| Mina and Avram | 1, shared |

## Rewards

Spec 005 owns the reward rule.
Every quest pays its menu value. No chapter, character, or visit multiplies a reward. Rewards are coins only.

## Core character arcs

| Quest ID | Opens after | Requirements |
| --- | --- | --- |
| mara-welcome | New game | 1 Socată |
| sorin-first-ride | New game | 2 Dough, 1 Socată |
| ilie-stove | New game | 2 Bulz, 2 Pogăcele |
| eszter-cups | New game | 2 Fruit tea, 2 Pogăcele |
| mara-cellar | New game | 1 Smoked cheese plate, 1 Fruit tea |
| ilie-counter | 1 | 1 Pogăcele |
| eszter-first-plate | 1 | 1 Mămăligă, 1 Pogăcele |
| mara-lamp-supper | 3 | 1 Bulz, 1 Fruit tea |
| sorin-tyre | 3 | 1 Papanași, 1 Langoș, 1 Fruit tea |
| eszter-bowls | 4 | 2 Mămăligă |
| ilie-pickles | 4 | 2 Bulz, 1 Fruit tea |
| eszter-kiln | 5 | 1 Papanași, 1 Pogăcele |
| sorin-lunch | 6 | 1 Pogăcele, 1 Socată |
| mara-table | 8 | 1 Bulz |
| mara-candles | 8 | 1 Smoked cheese plate, 1 Roasted vegetables, 1 Socată |
| eszter-table | 9 | 1 Papanași |
| eszter-green-bowls | 9 | 2 Bulz, 1 Papanași |
| sorin-postbag | 9 | 2 Roasted vegetables, 1 Langoș, 1 Fruit tea |
| ilie-courtyard | 12 | 1 Langoș |
| sorin-path | 13 | 1 Roasted vegetables, 1 Socată |
| eszter-kiln-party | 14 | 2 Plum dumplings, 2 Zacuscă, 2 Fruit tea |
| ilie-cellar | 14 | 1 Goulash pot, 1 Zacuscă toast |
| ilie-family | 16 | 1 Smoked cheese plate |
| eszter-tasting | 17 | 1 Plum dumplings |
| mara-supper | 20 | 1 Zacuscă toast, 1 Smoked cheese plate |
| sorin-welcome | 20 | 2 Fruit tea, 1 Roasted vegetables |

Mara tests a welcome, explores the cellar, and plans a supper service. Ilie tests the stove, fills the cellar, and prepares the bread counter and a family tasting dish.
Eszter checks cups, bowls, plates, and her kiln, and her second glaze unlocks a finish from spec 002. Sorin prepares food around errands, a patched tyre, the post, and the courtyard welcome.
The generator owns the exact rewards.

## Visiting travellers

Adrian, Monica, and Janos each return for three supply requests. Their nine visits alternate in that order. Each visit also waits for the previous visitor delivery, so only one cathedral supply request is open at a time. There is no timer.

| Quest ID | Opens after | Requirements |
| --- | --- | --- |
| adrian-first-pack | 6 | 8 Pogăcele, 4 Bulz, 4 Fruit tea |
| monica-first-pack | 8 | 2 Zacuscă toast, 2 Wild mushroom sauce, 2 Cabbage rolls |
| janos-first-pack | 9 | 4 Langoș, 4 Papanași, 4 Fruit tea |
| adrian-second-pack | 13 | 2 Goulash pot, 2 Bread basket |
| monica-second-pack | 14 | 6 Roasted vegetables, 6 Pogăcele, 4 Cherry compote |
| janos-second-pack | 17 | 2 Chimney cake, 2 Sharing board, 2 Cabbage rolls |
| adrian-third-pack | 19 | 6 Langoș, 6 Smoked cheese plate, 4 Fruit tea |
| monica-third-pack | 21 | 2 Bread basket, 2 Goulash pot, 2 Sharing board |
| janos-third-pack | 22 | 2 Cozonac, 2 Cabbage rolls, 2 Wild mushroom sauce |

## Single-visit dinner

Ionatan is a foreign real estate agent. His only quest, `ionatan-castle-dinner`, opens after preparation 9 and after Vlad's quest "A guest at the castle" (`vlad-guest`). It needs one goulash pot, one sharing board, one chimney cake, and one plum brandy. The dinner pays its menu value of 220 coins. It is independent of the traveller sequence.

His introduction appears only while his request is open. Delivery records the quest ID once and queues his farewell in Story. His introduction and quest replays are then absent from the journal. Reload and export/import preserve his completed visit. A new game permits another visit. A failed write keeps the departure in the session; reload restores only durable progress.

## Shared search visit

Mina and Doctor Avram share one visit per save. Their quest, `mina-avram-search`, has `mina` as its character and `avram` as its companion.
It opens after preparation 10 and delivery of Ionatan's dinner.
The request needs two zacuscă toasts, two roasted vegetable plates, one smoked cheese plate, and two fruit teas.
The meal is vegetarian. It has a menu value of 168 coins and pays 168 coins.

Their introductions appear only while their request is open. The ticket and the request dialog show both names and both portraits.
Delivery records the quest ID once and queues their farewell in Story. Their introductions and quest replays are then absent from the journal.
They never meet Ionatan at the bistro. A new game permits another visit.

The third delivery after their meal makes the local news scene `mina-avram-news` ("News from the road") a waiting scene.
Sorin and Mara tell that Mina and Avram found Ionatan gravely ill, and that all three left for Britain.
The scene has only local speakers and gives no reward. After its delivery gate, the journal shows it under Local news.

## Quest rules

1. A quest has a stable ID, character ID, opening preparation, item quantities, coin reward, opening scene, and completion scene.
   A quest can also wait for an earlier quest.
   Optional fields define companions, a finish that the quest unlocks, and a later news scene.
2. A companion counts as a character of the quest. Authored order resolves the tickets.
3. Delivery consumes the full requirement from the board in one action.
4. Repeated requirement entries count separately. A missing item, a quest without a ticket, a stale ID, a completed ID, or a reward overflow change nothing.
5. Success records completion in delivery order, pays once, and queues the completion scene in the same change.
6. Every required chain is available before the quest opens. The combined quest and preparation graph must have no cycle.
7. Reading, skipping, replaying, reloading, and repeated clicks give no second reward.
8. Quest scenes use the existing dialogue controls. The completion scene waits until the player finishes or skips it, as spec 008 gives. Recorded completion and journal replay remain available.

`questProblems` checks IDs, scenes, quantities, rewards, requested items, and chain availability.
It also checks companions, finishes, news scenes, authored order, the combined prerequisite graph, and the campaign funds.
The content generator refuses invalid quest data.

## Interface

A ticket shows the character portrait, name, dishes, and Deliver with the reward.
If a dish needs multiple portions, the ticket also shows its count on the board.
Deliver is unavailable until the board holds every required item.
A tap on the dishes opens the request dialog.
The dialog explains who asks and why.
It shows each dish with its count on the board, the reward, and Deliver.
Each dish row opens ingredient help.

Deliver takes the dishes from the board. The dishes fly to the ticket, and a temporary notice reports the delivery and reward. The completion scene waits in Story. The next open quest takes the ticket.

The notice does not block play or take focus.
After a failed save, the notice includes the unsaved warning.
Options offers Retry save.
A failed save keeps the current session.

The journal starts with the neighbours list and the optional introductions. Completed quests keep both their opening and completion scenes, except the quests of single-visit guests.
Local news shows an earned news scene. It reads as a new scene while it waits, and as a replay after that.
Close, Escape, and Return from a quest scene restore the journal focus.

## Save compatibility

The state stores unique, known `completedQuests` in delivery order. Each completed quest has its prerequisites earlier in the list. Every completed preparation has its necessary quests in the list.
The delivery order determines local news. A waiting news scene is valid only after its delivery gate.
The game rejects unknown IDs and contradictory state.
See [Shared save compatibility](README.md#shared-save-compatibility).

A failed quest write keeps the session state and a visible unsaved warning.
Retry save and export can preserve that session. Reload restores only durable progress.
Import adopts a valid quest state only after its write succeeds.

## Acceptance and evidence

The Node.js tests cover tickets, repeated quantities, atomic failure, single rewards, and coin overflow.
They also cover prerequisite cycles, unavailable chains, the funding check, and malformed quest records.
The storage tests cover fresh, partial, and completed saves, malformed and oversized input, and invalid completion lists.
They also cover failed writes and rejection of unsupported versions.
They cover the traveller sequence, Ionatan's visit, the shared visit, the vegetarian request, and the news scene three deliveries later.
`tests/campaign-balance.test.ts` completes all 24 preparations and all 81 quests through legal actions without injected resources. The fixture fails on a deadlock.

The browser tests use the built game.
They cover delivery from a ticket and from the request dialog, with items from the board only.
They cover keyboard focus, touch emulation, reload, export, import, scene replay, and unavailable storage.
They cover the shared request with both portraits and its departure through reload and import.
They also cover a failed delivery save and the news scene in the journal.
The tickets and the request dialog have geometry, contrast, and screenshot checks at desktop and phone sizes in both themes.
Use `npm run quality:full` for the integrated acceptance check.
