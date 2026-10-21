# 004: Character quests and introductions

Status: Implemented.

## Result and ownership

The game has 83 authored quests: 81 campaign quests, one supper quest, and one recovery quest.
Quests and cleared blockers earn every coin of the campaign.
The journal has an optional introduction for each neighbour. The journal also replays completed quest scenes.
Spec 005 records the funding check and the economy fixture. Spec 007 names one quest of a core character as the contribution of each chapter. Spec 010 records the regulars.
Spec 012 records the diets, the favourite dishes, the supper plates, and the recovery quest. `PRODUCT.md` controls all of them.

The engine owns eligibility, the tickets, delivery, and validation. Storage owns the envelopes and durable writes.
The app owns the tickets, the quest dialog, the dialogue, and focus return.
`tools/create-original-data.ts` authors every record and generates `public/data/game.json`.

Every quest uses only ordinary dishes and drinks. The supper quest asks for one plate for each guest and pays nothing.
The campaign rules below apply to the 81 campaign quests. `PRODUCT.md` owns the two special quests and save compatibility.

## The quest campaign

1. Each quest opens after a preparation (`afterTask`), or in a new game. A quest can also wait for one earlier quest (`afterQuest`). Each quest waits for the earlier quests of its character, so a character has at most one open campaign quest.
2. A campaign quest that opens after preparation N is necessary for preparation N + 1. Each preparation needs every campaign quest that opens before it. The player delivers all campaign quests before the supper quest.
3. The quests are in the order in which they open. Every campaign quest opens before the last preparation. The supper quest opens after preparation 24.
   The recovery quest opens and closes with the purse, as spec 012 gives.
4. Three quest tickets are on the counter. The first three open quests, in authored order, take the tickets. Other open quests wait without a ticket. The next open quest takes the first ticket that is free.
5. While the recovery quest is open, the recovery quest has a fourth ticket with a dashed edge. The recovery quest never takes a ticket from another quest.
6. A quest has no deadline and no expiry.

| Character group | Quests |
| --- | --- |
| Mara, Ilie, Eszter, and Sorin | 6, 6, 8, and 6 campaign quests |
| Mara and Ana | 1 supper quest and 1 recovery quest, respectively |
| Ten regulars of spec 010, without Vlad and Elisabeta | 5 for Dochia and Costel; 4 for Victor, Ana, Sânziana, Dorian, Ileana, and Cezar; 3 for Cătălina and Bran |
| Vlad and Elisabeta | 2 each |
| Adrian, Monica, and Janos | 3 each |
| Ionatan | 1 |
| Mina and Avram | 1, shared |

## Rewards

Spec 005 records the reward rule.
Every quest except the supper pays its menu value in coins. The supper pays nothing.
`PRODUCT.md` gives the formula of the menu prices.

## Core character arcs

| Quest ID | Opens after | Requirements |
| --- | --- | --- |
| mara-welcome | New game | 2 Herb bunch, 1 Linden tea |
| sorin-first-ride | New game | 2 Dough, 1 Socată |
| ilie-stove | New game | 2 Langoș, 1 Cornmeal |
| eszter-cups | New game | 1 Pogăcele, 2 Langoș |
| mara-cellar | New game | 1 Bread basket, 1 Langoș, 1 Mămăligă |
| ilie-counter | 1 | 2 Pogăcele, 1 Socată |
| eszter-first-plate | 1 | 1 Mămăligă, 1 Pogăcele, 1 Linden tea |
| mara-lamp-supper | 3 | 2 Milk, 1 Linden tea |
| sorin-tyre | 3 | 1 Langoș, 2 Cottage cheese |
| eszter-bowls | 4 | 2 Mămăligă, 1 Sour cream |
| ilie-pickles | 4 | 2 Bulz, 1 Cheese pie |
| eszter-kiln | 5 | 2 Sweet dough, 1 Chicken |
| sorin-lunch | 6 | 1 Pogăcele, 1 Potatoes, 1 Socată |
| mara-table | 8 | 1 Fruit bowl, 1 Pork, 1 Vegetable basket |
| mara-candles | 8 | 1 Pickled cabbage, 1 Sausages, 1 Socată |
| eszter-table | 9 | 2 Cozonac, 1 Chimney cake |
| eszter-green-bowls | 9 | 1 Bulz, 2 Pickled cabbage |
| sorin-postbag | 9 | 2 Roasted vegetables, 1 Langoș |
| ilie-courtyard | 12 | 1 Langoș, 1 Socată |
| sorin-path | 13 | 2 Roasted vegetables, 1 Socată |
| eszter-kiln-party | 14 | 1 Plum dumplings, 1 Lamb cuts, 1 Fruit tea |
| ilie-cellar | 14 | 2 Bean soup, 1 Lamb chops |
| ilie-family | 16 | 1 Cheese board, 1 Lentils |
| eszter-tasting | 17 | 1 Plum dumplings, 2 Cozonac |
| mara-supper | 20 | 1 Cheese board, 2 Fresh trout |
| sorin-welcome | 20 | 1 Zacuscă, 2 Diced veal |

Mara tests a welcome, explores the cellar, and plans a supper service. Ilie tests the stove, fills the cellar, and prepares the bread counter and a family tasting dish.
Eszter checks cups, bowls, plates, and her kiln. Her second glaze unlocks a finish from spec 002. Sorin's quests are about errands, a patched tyre, the post, and the courtyard welcome.
The generator owns the exact rewards.

## Visitors who return

Adrian, Monica, and Janos each return for three supply quests. Each quest supplies a stay in the passages under the cathedral, one level deeper on each visit. Each opening scene tells a core character what the visitor found.
A supply quest has one of two sizes. Provisions are 12 to 16 portions of chain dishes from stage 3. Meals are 4 to 6 portions of mixed dishes.
The nine visits rotate in that order: Adrian, Monica, then Janos. Each visit also waits for the delivery of the previous visitor. As a result, only one cathedral supply quest is open at a time. The visits have no timer.

| Quest ID | Opens after | Requirements |
| --- | --- | --- |
| adrian-first-pack | 6 | 4 Langoș, 2 Smoked cheese, 6 Pogăcele |
| monica-first-pack | 8 | 4 Plum jam, 4 Sausages, 4 Smoked cheese |
| janos-first-pack | 9 | 3 Langoș, 1 Bread basket, 2 Red wine, 6 Pogăcele |
| adrian-second-pack | 13 | 1 Bread basket, 5 Loaf, 6 Pogăcele |
| monica-second-pack | 14 | 1 Bread basket, 6 Cherry compote, 7 Lamb stew |
| janos-second-pack | 17 | 1 Chimney cake, 2 Tochitură, 1 Sharing board |
| adrian-third-pack | 19 | 2 Langoș, 4 Socată, 6 Loaf |
| monica-third-pack | 21 | 1 Loaf, 4 Meatballs, 4 Smoked trout, 3 Pickled cabbage |
| janos-third-pack | 22 | 4 Saramură, 1 Veal stew, 4 Cherry compote, 3 Pickled cabbage |

## Single-visit dinner

Ionatan is a foreign real estate agent. His only quest, `ionatan-castle-dinner`, opens after preparation 9 and after Vlad's quest "A guest at the castle" (`vlad-guest`).
It needs one plum brandy, one sharing board, and one tochitură.
The dinner pays its menu value of 222 coins. The dinner is independent of the visitor sequence.

His introduction appears only while his quest is open. Delivery records the quest ID once and queues his farewell in Story. His introduction and quest replays are then absent from the journal. Reload, export, and import preserve his completed visit. A new game permits another visit. A failed write keeps the departure in the session. A reload restores only durable progress.

## Shared search visit

Mina and Doctor Avram share one visit per save. Their quest, `mina-avram-search`, has `mina` as its character and `avram` as its companion.
It opens after preparation 10 and after the delivery of Ionatan's dinner.
The quest needs two portions of zacuscă, two roasted vegetable plates, one smoked cheese, and one fruit tea.
The meal is vegetarian, and it suits the diets of both characters. It has a menu value of 190 coins and pays 190 coins.

Their introductions appear only while their quest is open. The ticket and the quest dialog show both names and both portraits.
Delivery records the quest ID once and queues their farewell in Story. Their introductions and quest replays are then absent from the journal.
They never meet Ionatan at the bistro. A new game permits another visit.

The third delivery after their meal makes the local news scene `mina-avram-news` ("News from the road") an unread scene.
Sorin and Mara say that Mina and Avram found Ionatan gravely ill. They say that all three left for Britain.
The scene has only local speakers and gives no reward. After its delivery gate, the journal shows the scene under Unread scenes while the scene is unread. After the player reads the scene, the journal shows it under Local news in Earlier conversations.

## Quest rules

These rules apply to campaign quests. The supper quest pays nothing and queues the finale in place of a completion scene.
The recovery quest pays each valid delivery, records nothing, and queues no scene.

1. A quest has a stable ID, character ID, opening preparation, item quantities, coin reward, opening scene, and completion scene.
   A quest can also wait for an earlier quest.
   Optional fields define companions, a finish that the quest unlocks, and a later news scene.
2. A companion counts as a character of the quest. Authored order resolves the tickets.
3. Delivery consumes the full requirement from the board in one action.
4. Repeated requirement entries count separately. A missing item, a quest without a ticket, a stale ID, a completed ID, or a reward overflow change nothing.
5. A successful delivery records the completion in delivery order, pays once, and queues the completion scene in the same change.
6. Each chain of each required dish is open before the quest opens. The combined graph of quests and preparations must have no cycle.
7. Each dish suits the diet of each character of the quest. Each quest of a regular asks for at least one favourite dish.
8. A read, a replay, a reload, or a repeated click gives no second reward.
9. Quest scenes use the transcript. The completion scene stays unread until the player completes it, as spec 008 gives.

`questProblems` checks IDs, scenes, quantities, rewards, required items, and chain availability.
It also checks companions, finishes, news scenes, authored order, the combined prerequisite graph, and the campaign funds.
It also checks the diets, the favourite dishes, and the sizes of the cathedral supply quests.
It also checks the supper plates and the recovery quest.
The content generator refuses invalid quest data.

## Interface

A ticket shows the character portrait, name, dishes, and Deliver with the reward. A wider screen also shows the quest title.
The supper ticket and its dialog show Serve in place of Deliver. The supper dialog names the guest of each plate.
The accessible name of the ticket face gives the board count of each dish.
On a wider screen, a dish that needs more than one portion also shows that count on the ticket.
Deliver is unavailable until the board holds every required item.
A tap on the face of the ticket (the portrait, name, title, and dishes) opens the quest dialog.
The dialog explains who asks and why.
It shows each dish with its count on the board, the reward, and Deliver.
Each dish row opens ingredient help. If the board lacks a portion, Find beside that row closes the dialog. Find then starts a temporary guide for another portion. The guide updates its next step after each action of the player. The guide ends when the player makes that portion or stops the guide.

Deliver takes the dishes from the board. The dishes fly to the ticket, and a temporary notice reports the delivery and reward. The notice offers the reply of the character. The completion scene stays unread in Story. The next open quest takes the ticket.

The notice does not block play or take focus.
After a failed save, the notice includes the unsaved warning.
Options offers Retry save.
A failed save keeps the current session.

The journal starts with unread scenes in saved order, then the current or latest chapter. Each unread scene appears once. The unread scenes include the farewells of single-visit visitors until the player reads them. Earlier chapters, Earlier conversations, and Neighbours are collapsed groups. Completed campaign quests have one conversation entry with Quest then Reply, except the quests of single-visit visitors. Each page keeps all text, speakers, and the accepted illustration, with one Return action. A combined page uses one transcript. A quest with an unread reply has its whole conversation only under Unread scenes; it has no separate archived opening. The most recently delivered quest comes first in Earlier conversations. The neighbour rows open optional introductions.
The supper quest keeps only its opening. The finale has its own entry. The recovery quest has no entry.
An earned news scene appears once under Unread scenes while it is unread. After the player reads the scene, Local news in Earlier conversations offers its replay.
Close, Escape, and Return from a quest scene keep the open groups and the reading position. They also return the focus to the journal entry. When the player completes a combined conversation, the journal marks only its unread reply as read. The journal moves the same entry to Earlier conversations and opens that group. Close and Escape keep the reply unread. A read replay changes no game state. Story and the delivery notices open only the reply. After the player reads the farewell of a single-visit visitor, the journal returns to the Unread scenes heading.

## Save compatibility

The state stores unique, known `completedQuests` in delivery order. Each completed quest has its prerequisites earlier in the list. Every completed preparation has its necessary quests in the list.
The recovery quest never enters the list.
The delivery order determines local news. An unread news scene is valid only after its delivery gate.
The game rejects unknown IDs and contradictory state.
See [Shared save compatibility](README.md#shared-save-compatibility).

A failed quest write keeps the session state and a visible unsaved warning.
Retry save and export can preserve that session. Reload restores only durable progress.
Import adopts a valid quest state only after its write succeeds.

## Acceptance and evidence

The Node.js tests cover tickets, repeated quantities, atomic failure, single rewards, and coin overflow.
They also cover prerequisite cycles, unavailable chains, the funding check, and malformed quest records.
They also cover the diets, the favourite dishes, and the sizes of the cathedral supply quests.
They also cover the supper plates and the recovery quest with its fourth ticket.
The storage tests cover fresh, partial, and completed saves, malformed and oversized input, and invalid completion lists.
They also cover failed writes and rejection of unsupported versions.
`tests/quests.test.ts` covers the visitor sequence and Ionatan's visit. It also rejects a save that lists the recovery quest.
`tests/guests.test.ts` covers Ionatan's dinner, the shared visit, the vegetarian quest, and the news scene three deliveries later.
`tests/campaign-balance.test.ts` completes all 24 preparations and all 81 campaign quests through legal actions without injected resources.
The fixture then serves the supper. The purse after the supper must be inside the balance band of spec 012.
The fixture fails on a deadlock.

The browser tests use the built game.
They cover delivery from a ticket and from the quest dialog, with items from the board only.
They cover keyboard focus, touch emulation, reload, export, import, and scene replay.
They cover the shared quest with both portraits and its departure through reload and import.
They also cover a failed delivery save and the news scene in the journal.
The tickets and the quest dialog have geometry, contrast, and screenshot checks at desktop and phone sizes in both themes.
