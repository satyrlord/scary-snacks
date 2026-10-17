# 005 - Character quests and introductions

Status: Implemented. The quests are the campaign.
Spec 009 queues each quest completion scene and resumes it after reload. Spec 006 owns the reward rule, the funding check, and the economy fixture. Spec 008 names one quest of a core character as the contribution of each chapter. Spec 013 owns the regulars.

## Result and ownership

The game has 63 authored quests. Quests are the only requests, and they earn the coins of the campaign. Clearance sales also earn a few coins.
The journal has an optional introduction for each neighbour and replay of completed quest scenes.

The engine owns eligibility, the tickets, delivery, and validation. Storage owns the envelopes and durable writes.
The app owns the tickets, the request dialog, the dialogue, and focus return.
`tools/create-original-data.ts` authors every record. `public/data/game.json` is generated.
PRODUCT, DESIGN, and DELIVERY own the current product, interface, and delivery contracts.

The five permanent chains, 30 permanent dishes, and 24 preparation IDs stay.
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
| Mara, Ilie, Eszter, and Sorin | 4, 3, 5, and 4 |
| Ten regulars from spec 013 | 3 each, or 4 for Sânziana and Ileana |
| Vlad and Elisabeta | 2 each |
| Adrian, Monica, and Janos | 3 each |
| Ionatan | 1 |
| Mina and Avram | 1, shared |

## Rewards

Spec 006 owns the reward rule. A personal request pays its menu value times the rate of the chapter in which it opens: 3, 2.5, 2, 1.5, 1, and 1 for chapters 1 to 6. The result is rounded to an even number of coins. The supply packs of the travellers and the meal for Mina and Avram pay their menu value. Ionatan pays 1,100 coins. Rewards are coins only.

## Core character arcs

| Quest ID | Opens after | Requirements |
| --- | --- | --- |
| mara-welcome | New game | 1 Socată |
| sorin-first-ride | New game | 2 Dough, 1 Socată |
| ilie-counter | 1 | 1 Pogăcele |
| eszter-first-plate | 1 | 1 Mămăligă, 1 Pogăcele |
| mara-lamp-supper | 3 | 1 Bulz, 1 Fruit tea |
| eszter-bowls | 4 | 2 Mămăligă |
| sorin-lunch | 6 | 1 Pogăcele, 1 Socată |
| mara-table | 8 | 1 Bulz |
| eszter-table | 9 | 1 Papanași |
| eszter-green-bowls | 9 | 2 Bulz, 1 Papanași |
| ilie-courtyard | 12 | 1 Langoș |
| sorin-path | 13 | 1 Roasted vegetables, 1 Socată |
| ilie-family | 16 | 1 Smoked cheese plate |
| eszter-tasting | 17 | 1 Plum dumplings |
| mara-supper | 20 | 1 Zacuscă toast, 1 Smoked cheese plate |
| sorin-welcome | 20 | 2 Fruit tea, 1 Roasted vegetables |

Mara tests a welcome and a supper service. Ilie prepares the bread counter and a family tasting dish.
Eszter checks bowl and plate sizes, and her second glaze unlocks a finish from spec 002. Sorin prepares food around errands and the courtyard welcome.
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

Ionatan is a foreign real estate agent. His only quest, `ionatan-castle-dinner`, opens after preparation 16 and after Vlad's quest "A guest at the castle" (`vlad-guest`). It needs one goulash pot, one sharing board, one chimney cake, and one plum brandy. The 220-coin dinner pays 1,100 coins. It is independent of the traveller sequence.

His introduction appears only while his request is open. Delivery records the quest ID once and shows his farewell. After that scene, his introduction and quest replays are absent. Reload and export/import preserve his completed visit. A new game permits another visit. A failed write keeps the departure in the session; reload restores only durable progress.

## Shared search visit

Mina and Doctor Avram share one visit per save. Their quest, `mina-avram-search`, has `mina` as its character and `avram` as its companion.
It opens after preparation 17 and after Ionatan's dinner is delivered.
The request needs two zacuscă toasts, two roasted vegetable plates, one smoked cheese plate, and two fruit teas.
The meal is vegetarian. It has a menu value of 168 coins and pays 168 coins.

Their introductions appear only while their request is open. The ticket and the request dialog show both names and both portraits.
Delivery records the quest ID once and shows their farewell. After that scene, their introductions and quest replays are absent.
They never meet Ionatan at the bistro. A new game permits another visit.

The third delivery after their meal makes the local news scene `mina-avram-news` ("News from the road") a waiting scene.
Sorin and Mara tell that Mina and Avram found Ionatan gravely ill, and that all three left for Britain.
The scene has only local speakers and gives no reward. After its delivery gate, the journal shows it under Local news.

## Quest rules

1. A quest has a stable ID, character ID, opening preparation, item quantities, coin reward, opening scene, and completion scene.
   A quest can also have an earlier quest that it waits for, companions, a finish that it unlocks, and a later news scene.
2. A companion counts as a character of the quest. Authored order resolves the tickets.
3. Delivery consumes the full requirement from the board in one action.
4. Repeated requirement entries count separately. A missing item, a quest without a ticket, a stale ID, a completed ID, or a reward overflow change nothing.
5. Success records completion in delivery order, pays once, and queues the completion scene in the same change.
6. Every required chain is available before the quest opens. The combined quest and preparation graph must have no cycle.
7. Reading, skipping, replaying, reloading, and repeated clicks give no second reward.
8. Quest scenes use the existing dialogue controls. The completion scene waits until the player finishes or skips it, as spec 009 gives. Recorded completion and journal replay remain available.

`questProblems` checks IDs, scenes, quantities, rewards, ordinary requested items, chain availability, companions, finishes, news scenes, authored order, the combined prerequisite graph, and the campaign funds.
The content generator refuses invalid quest data.

## Interface

A ticket shows the portrait and the name of the character, the dishes with the count on the board, and Deliver with the reward.
Deliver is unavailable until the board holds every required item.
A tap on the dishes opens the request dialog: who asks and why, each dish with its count on the board, the reward, and Deliver. Each dish row opens ingredient help.
Deliver takes the dishes from the board. The dishes fly to the ticket, and the completion scene opens. Then the next open quest takes the ticket.
A failed save keeps the session and shows an unsaved warning with Retry save.

The journal starts with the neighbours list and the optional introductions. Completed quests keep both their opening and completion scenes, except the quests of single-visit guests.
Local news shows an earned news scene. It reads as a new scene while it waits, and as a replay after that.
Close, Escape, and Return from a quest scene restore the journal focus.

## Save compatibility

The state stores unique, known `completedQuests` in delivery order. Each completed quest has its prerequisites earlier in the list. Every completed preparation has its necessary quests in the list.
The delivery order determines local news. A waiting news scene is valid only after its delivery gate.
Unknown IDs and contradictory state are rejected.
See [Shared save compatibility](README.md#shared-save-compatibility).

A failed quest write keeps the session state and a visible unsaved warning.
Retry save and export can preserve that session. Reload restores only durable progress.
Import adopts a valid quest state only after its write succeeds.

## Acceptance and evidence

The Node.js tests cover the tickets, repeated quantities, atomic failure, reward-once behavior, coin overflow, prerequisite cycles, unavailable chains, the funding check, and malformed quest records.
The storage tests cover fresh, middle, and completed saves, malformed and oversized input, invalid completion lists, failed writes, and rejection of unsupported versions.
They cover the traveller sequence, Ionatan's visit, the shared visit, the vegetarian request, and the news scene three deliveries later.
`tests/campaign-balance.test.ts` completes all 24 preparations and all 63 quests through legal actions without injected resources. The fixture fails on a deadlock.

The built browser tests cover delivery from a ticket and from the request dialog, board-only delivery, keyboard focus, touch emulation, reload, export, import, scene replay, and unavailable storage.
They cover the shared request with both portraits, its departure through reload and import, a failed delivery save, and the news scene in the journal.
The tickets and the request dialog have geometry, contrast, and screenshot checks at desktop and phone sizes in both themes.
Use `npm run quality:full` for the integrated acceptance check.
