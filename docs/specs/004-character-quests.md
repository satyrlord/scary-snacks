# 004: Character quests and introductions

Status: Implemented.

## Result and ownership

The game has 83 authored quests: 81 campaign quests, one supper quest, and one recovery quest.
Quests and cleared blockers earn every coin of the campaign.
The journal has an optional introduction for each neighbour and replay of completed quest scenes.
Spec 005 owns the funding check and the economy fixture. Spec 007 names one quest of a core character as the contribution of each chapter. Spec 010 owns the regulars.
Spec 012 owns the diets, the favourite dishes, the supper plates, and the recovery quest.

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
4. Three quest tickets sit on the counter. The first three open quests, in authored order, take the tickets. Other open quests wait without a ticket. The next open quest takes the first ticket that is free.
5. While the recovery quest is open, it has a fourth ticket with a dashed edge. It never moves a quest to waiting.
6. There is no deadline and no expiry.

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

Spec 005 owns the reward rule.
Every quest except the supper pays its menu value in coins. The supper pays nothing.
Spec 012 gives the formula of the menu prices.

## Core character arcs

| Quest ID | Opens after | Requirements |
| --- | --- | --- |
| mara-welcome | New game | 2 Socată, 1 Linden tea |
| sorin-first-ride | New game | 2 Dough, 1 Socată, 1 Langoș |
| ilie-stove | New game | 2 Bread basket, 2 Pogăcele, 1 Mămăligă, 1 Loaf, 2 Linden tea |
| eszter-cups | New game | 2 Linden tea, 2 Pogăcele, 2 Langoș, 2 Socată |
| mara-cellar | New game | 1 Bread basket, 1 Langoș, 2 Linden tea, 1 Mămăligă |
| ilie-counter | 1 | 2 Pogăcele, 2 Socată |
| eszter-first-plate | 1 | 2 Mămăligă, 1 Pogăcele, 1 Linden tea |
| mara-lamp-supper | 3 | 2 Bulz, 3 Linden tea, 1 Loaf |
| sorin-tyre | 3 | 2 Langoș, 2 Papanași, 3 Linden tea, 2 Cheese pie |
| eszter-bowls | 4 | 2 Mămăligă, 2 Sour cream, 1 Linden tea |
| ilie-pickles | 4 | 2 Bulz, 2 Cheese pie, 2 Langoș, 1 Cottage cheese, 1 Linden tea |
| eszter-kiln | 5 | 1 Papanași, 2 Pogăcele, 2 Chimney cake, 2 Roast chicken, 1 Sweet dough, 3 Linden tea, 1 Socată |
| sorin-lunch | 6 | 1 Pogăcele, 1 Socată, 1 Roasted vegetables |
| mara-table | 8 | 1 Bulz, 1 Cheese pie, 1 Stuffed peppers |
| mara-candles | 8 | 1 Sharing board, 2 Roasted vegetables, 2 Cabbage rolls, 2 Socată, 1 Cheese pie |
| eszter-table | 9 | 2 Papanași, 2 Cozonac, 2 Chimney cake |
| eszter-green-bowls | 9 | 2 Bulz, 2 Cabbage rolls with mămăligă, 2 Papanași, 1 Plum jam |
| sorin-postbag | 9 | 2 Roasted vegetables, 2 Langoș, 2 Fruit tea, 2 Sausages, 1 Cherry compote |
| ilie-courtyard | 12 | 1 Langoș, 1 Socată |
| sorin-path | 13 | 2 Roasted vegetables, 1 Socată |
| eszter-kiln-party | 14 | 2 Plum dumplings, 2 Zacuscă, 2 Fruit tea, 2 Beans with sausages, 2 Roast lamb, 1 Cheese board, 1 Langoș, 1 Plum jam, 2 Linden tea |
| ilie-cellar | 14 | 2 Bread basket, 2 Bean soup in a bread bowl, 2 Roast lamb, 1 Lamb stew, 2 Linden tea |
| ilie-family | 16 | 1 Cheese board |
| eszter-tasting | 17 | 1 Plum dumplings, 3 Cozonac |
| mara-supper | 20 | 2 Zacuscă toast, 1 Cheese board, 1 Cheese pie |
| sorin-welcome | 20 | 2 Fruit tea, 2 Linden tea, 2 Roasted vegetables, 1 Zacuscă, 1 Meatball soup |

Mara tests a welcome, explores the cellar, and plans a supper service. Ilie tests the stove, fills the cellar, and prepares the bread counter and a family tasting dish.
Eszter checks cups, bowls, plates, and her kiln, and her second glaze unlocks a finish from spec 002. Sorin prepares food around errands, a patched tyre, the post, and the courtyard welcome.
The generator owns the exact rewards.

## Recurring travellers

Adrian, Monica, and Janos each return for three supply quests. Each quest supplies a stay in the passages under the cathedral, one level deeper on each visit. Each opening reports a finding to a core character.
A supply quest has one of two sizes: provisions of 12 to 16 portions of chain dishes from stage 3, or meals of 4 to 6 portions of mixed dishes.
Their nine visits alternate in that order. Each visit also waits for the delivery of the previous visitor. Thus only one cathedral supply quest is open at a time. There is no timer.

| Quest ID | Opens after | Requirements |
| --- | --- | --- |
| adrian-first-pack | 6 | 6 Langoș, 4 Smoked cheese, 2 Roasted vegetables, 4 Pogăcele |
| monica-first-pack | 8 | 4 Zacuscă, 4 Smoked cheese, 4 Roast pork |
| janos-first-pack | 9 | 6 Langoș, 2 Bread basket, 2 Smoked cheese, 2 Red wine, 2 Pogăcele |
| adrian-second-pack | 13 | 2 Bread basket, 2 Roast lamb, 2 Loaf, 2 Pogăcele, 2 Lamb chops, 2 Lamb stew |
| monica-second-pack | 14 | 4 Cherry compote, 4 Bread basket, 4 Roast lamb |
| janos-second-pack | 17 | 1 Chimney cake, 3 Tochitură, 2 Sharing board |
| adrian-third-pack | 19 | 6 Langoș, 4 Smoked cheese, 2 Socată, 1 Veal stew |
| monica-third-pack | 21 | 2 Bread basket, 2 Veal stew, 2 Roast veal, 6 Roasted vegetables |
| janos-third-pack | 22 | 2 Zacuscă, 2 Roast veal, 4 Saramură, 4 Plum jam |

## Single-visit dinner

Ionatan is a foreign real estate agent. His only quest, `ionatan-castle-dinner`, opens after preparation 9 and after Vlad's quest "A guest at the castle" (`vlad-guest`).
It needs two plum brandies, two sharing boards, two tochitură, two chimney cakes, and one roast pork.
The dinner pays its menu value of 343 coins. It is independent of the traveller sequence.

His introduction appears only while his quest is open. Delivery records the quest ID once and queues his farewell in Story. His introduction and quest replays are then absent from the journal. Reload and export/import preserve his completed visit. A new game permits another visit. A failed write keeps the departure in the session. A reload restores only durable progress.

## Shared search visit

Mina and Doctor Avram share one visit per save. Their quest, `mina-avram-search`, has `mina` as its character and `avram` as its companion.
It opens after preparation 10 and delivery of Ionatan's dinner.
The quest needs two zacuscă toasts, two roasted vegetable plates, one smoked cheese, and two fruit teas.
The meal is vegetarian, and it suits the diets of both characters. It has a menu value of 149 coins and pays 149 coins.

Their introductions appear only while their quest is open. The ticket and the quest dialog show both names and both portraits.
Delivery records the quest ID once and queues their farewell in Story. Their introductions and quest replays are then absent from the journal.
They never meet Ionatan at the bistro. A new game permits another visit.

The third delivery after their meal makes the local news scene `mina-avram-news` ("News from the road") a waiting scene.
Sorin and Mara say that Mina and Avram found Ionatan gravely ill. They say that all three left for Britain.
The scene has only local speakers and gives no reward. After its delivery gate, the journal shows it under Unread scenes while it waits, then under Local news in Earlier conversations.

## Quest rules

These rules apply to campaign quests. The supper quest pays nothing and queues the finale in place of a completion scene.
The recovery quest pays each valid delivery, records nothing, and queues no scene.

1. A quest has a stable ID, character ID, opening preparation, item quantities, coin reward, opening scene, and completion scene.
   A quest can also wait for an earlier quest.
   Optional fields define companions, a finish that the quest unlocks, and a later news scene.
2. A companion counts as a character of the quest. Authored order resolves the tickets.
3. Delivery consumes the full requirement from the board in one action.
4. Repeated requirement entries count separately. A missing item, a quest without a ticket, a stale ID, a completed ID, or a reward overflow change nothing.
5. Success records completion in delivery order, pays once, and queues the completion scene in the same change.
6. Each chain of each required dish is open before the quest opens. The combined quest and preparation graph must have no cycle.
7. Each dish suits the diet of each character of the quest. Each quest of a regular asks for at least one favourite dish.
8. Reading, replaying, reloading, and repeated clicks give no second reward.
9. Quest scenes use the transcript. The completion scene waits until the player completes it, as spec 008 gives.

`questProblems` checks IDs, scenes, quantities, rewards, required items, and chain availability.
It also checks companions, finishes, news scenes, authored order, the combined prerequisite graph, and the campaign funds.
It also checks the diets, the favourite dishes, the sizes of the cathedral supply quests, the supper plates, and the recovery quest.
The content generator refuses invalid quest data.

## Interface

A ticket shows the character portrait, name, dishes, and Deliver with the reward. A wider screen also shows the quest title.
The supper ticket and its dialog show Serve in place of Deliver. The supper dialog names the guest of each plate.
The accessible name of the ticket face gives the board count of each dish.
On a wider screen, a dish that needs multiple portions also shows that count on the ticket.
Deliver is unavailable until the board holds every required item.
A tap on the face of the ticket (the portrait, name, title, and dishes) opens the quest dialog.
The dialog explains who asks and why.
It shows each dish with its count on the board, the reward, and Deliver.
Each dish row opens ingredient help. If the board lacks a portion, Find beside that row closes the dialog and starts a temporary guide for another portion. The guide updates its next step while the player acts and ends when that portion is made or the player stops it.

Deliver takes the dishes from the board. The dishes fly to the ticket, and a temporary notice reports the delivery and reward. The notice offers the reply of the character. The completion scene waits in Story. The next open quest takes the ticket.

The notice does not block play or take focus.
After a failed save, the notice includes the unsaved warning.
Options offers Retry save.
A failed save keeps the current session.

The journal starts with waiting scenes in saved order, then the current or latest chapter. Each waiting scene appears once. This includes the farewells of single-visit guests until they are read. Earlier chapters, Earlier conversations, and Neighbours are collapsed groups. Completed campaign quests have one conversation entry with Request then Reply, except the quests of single-visit guests. Each page keeps all text, speakers, and the accepted illustration, with one Return action. A combined page uses one transcript. A quest with an unread reply has its whole conversation only under Unread scenes; it has no separate archived opening. The most recently delivered quest comes first in Earlier conversations. The neighbour rows open optional introductions.
The supper quest keeps only its opening. The finale has its own entry. The recovery quest has no entry.
An earned news scene appears once under Unread scenes while it waits. After reading, Local news in Earlier conversations offers its replay.
Close, Escape, and Return from a quest scene keep the open groups and reading position, and restore the journal entry focus. Completing a combined conversation marks only its pending reply as read, moves the same entry to Earlier conversations, and opens that group. Close and Escape keep the reply unread. A read replay changes no game state. Story and delivery notices keep reply-only reading. A read single-visit farewell returns to the Unread scenes heading.

## Save compatibility

The state stores unique, known `completedQuests` in delivery order. Each completed quest has its prerequisites earlier in the list. Every completed preparation has its necessary quests in the list.
The recovery quest never enters the list.
The delivery order determines local news. A waiting news scene is valid only after its delivery gate.
The game rejects unknown IDs and contradictory state.
See [Shared save compatibility](README.md#shared-save-compatibility).

A failed quest write keeps the session state and a visible unsaved warning.
Retry save and export can preserve that session. Reload restores only durable progress.
Import adopts a valid quest state only after its write succeeds.

## Acceptance and evidence

The Node.js tests cover tickets, repeated quantities, atomic failure, single rewards, and coin overflow.
They also cover prerequisite cycles, unavailable chains, the funding check, and malformed quest records.
They also cover the diets, the favourite dishes, the sizes of the cathedral supply quests, the supper plates, and the recovery quest with its fourth ticket.
The storage tests cover fresh, partial, and completed saves, malformed and oversized input, and invalid completion lists.
They also cover failed writes and rejection of unsupported versions.
`tests/quests.test.ts` covers the traveller sequence and Ionatan's visit. It also rejects a save that lists the recovery quest.
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
