# Scary Snacks

<!-- impeccable:product-schema 1 -->

## Platform

web

## Purpose

Scary Snacks is an original single-player merge game in a fictional Transylvanian bistro. The user chose the title Scary Snacks. The user also chose local foods and drinks, black cats, bats, and the style of everyday Romanian neighbours. The tone is cosy and slightly eerie.

## Users

The primary player wants relaxed, short merge-game sessions on a phone or desktop. The player comes back to permanent progress in the bistro and its story.

## Positioning

The player restores a Transylvanian bistro through local foods, drinks, and character quests. Each preparation is a paid job that visibly changes the room. The neighbours and their quests connect the merge board to the story. The restored room is a permanent reward for that work.

This campaign is act 1 of a larger game. The owner will extend the game after act 1.

## Operating Context

The player takes ingredients, merges dishes, delivers quests, and pays for preparations in a Chromium-based browser. Pointer, keyboard, and touch controls support phone and desktop play. The board and the story progress stay in the browser save between visits. Export and import let the player move a supported save.

Quests have no deadline. A take is immediate. A take from a paid source costs coins, and herbs are free. The bistro day counts merges, never seconds, and nothing changes while the game is closed. The player can read or replay story scenes under the rules in Play. The rules in Access and persistence control saves, recovery, and more than one tab.

## Evidence on Hand

- `public/data/game.json` contains the authored game content. `tools/create-original-data.ts` is its source.
- `public/assets/original/` contains the project-generated art. `docs/asset-provenance.json`, `docs/asset-prompts.json`, and `docs/asset-variants.json` record where the art comes from and how the project converts it.
- `docs/font-provenance.json` records the self-hosted fonts and their licences.
- `tests/` and `tests/browser/` contain automated checks. `docs/verification.md` gives their scope and limits.
- `docs/economy.md` gives the cost model, its references, and the limits of the campaign balance checks.

These records support content and technical verification. They do not establish player-study results, adoption figures, or commercial performance. Such claims need their own evidence.

## Product Principles

- Respect the player's pace. Keep production immediate and quests free of deadlines.
- Make progress visible and permanent. Connect completed preparations to changes in the bistro and in the story.
- Keep actions clear and consistent. Show the item, the action that it needs, and the result of the action.
- Protect saved progress. Validate changes and imports. Explain save failures with a recovery action.
- Keep the authored setting coherent. Keep the local dishes, the neighbours, and the cosy, slightly eerie tone.

## Play

The board has six columns and seven rows. The game has these authored parts:

- 12 staple chains of four to six dishes each, which are 61 dishes and drinks
- 24 mixed dishes, each cooked from dishes of two or three chains
- 12 ingredient sources (generators), one for each chain
- 22 characters
- 83 quests: 81 campaign quests, one supper quest, and one recovery quest
- 24 preparations in six chapters

In this document, "dish" also means a drink. An ingredient is a dish that a source gives. Each dish has an English name. If English has no name for the dish, the dish has its Romanian regional name with diacritics. The initial layout, the prices, the progression, the characters, and the dialogue are new works.

A quest is a task that a character gives to the player. The quests are authored.

A campaign quest earns coins. Some preparations unlock a source. Each preparation unlocks story scenes and visibly changes the bistro.

Each chain follows one staple food family. Its source gives the raw staple, and its dishes use only foods of that family. Three chains are open in a new game: Grain, Corn, and Herbs. Preparations 3, 5, 6, 7, 8, 11, 13, 16, and 20 open Dairy, Poultry, Vegetables, Fruits, Pork, Beans, Lamb, Veal, and Fish. The scene of each of these preparations names its new source. A mixed dish opens when each of its chains is open.

The economy has four levers: the take cost (1 coin), the blocker coin (1 coin), the work rate (2 coins), and the recovery floor (10 coins). A take from a paid source spends the take cost. A take from the Herb basket is free. Each cleared blocker gives the blocker coin. A formula gives the menu price of each dish: the stage-1 staples that it uses times the take cost, plus its merges times the work rate. A Herbs staple counts as zero. So Flour costs 1 coin, Elderflowers cost nothing, Linden tea costs 14 coins, and Bulz costs 46 coins.

The menu value of a quest is the sum of the prices of its portions. Every quest except the supper pays its menu value, so a delivery pays back its staples and earns the work rate for each merge. Quests and cleared blockers are the only income.

Each preparation has a work scope, a material cost, a labour cost, and an estimate of active person-hours. Its coin cost is the material cost plus the labour cost. The cost does not rise with the position of the preparation in the story. The cost model uses one coin for about one Romanian leu as a reference scale. It includes reuse of the furniture and supplies that the bistro has. It leaves out running costs. The [economy record](docs/economy.md) gives the quantities, the portions, the primary references, and the assumptions.

A campaign quest opens after a named preparation, or in a new game. A campaign quest that opens after preparation N is necessary for preparation N + 1. Each preparation needs every campaign quest that opens before it. The player delivers all 81 campaign quests before the supper quest.

A quest asks only for dishes that the player can place. Each dish is one merge beyond the dishes that the player surely knows when the quest takes its ticket: its parts, or the dish one stage below it, are in the recipe book, or its source is on the board. The player surely knows the dishes of a new game and the dishes of every quest that surely held a ticket before. When a quest takes a ticket, its dishes go into the recipe book. The data check enforces this rule for every quest, the supper included.

A quest is one meal at one sitting: at most three portions for each eater, and at most two portions of one dish. A shared quest counts each of its characters. Only the characters who order provisions ask for more: Adrian, Monica, and Janos pack food for days under the cathedral, Dochia packs food for her days on the hill, and Sânziana buys for her sisters. The supper has one plate for each guest. The data check enforces these limits.

The supper quest is Mara's last quest, "The community supper". It opens after preparation 24. It asks for one plate for each of the 11 guests: Mara, Ilie, Eszter, Sorin, Costel, Victor, Ana, Ileana, Bran, Cătălina, and Cezar. Each plate suits the diet of its guest, each regular gets a favourite dish, and the plates use all 12 chains. The quest pays nothing. Its ticket and its dialog show Serve, and its dialog names the guest of each plate. Serve takes the plates once, records the quest, and queues the finale in place of a completion scene. The finale opens immediately.

The recovery quest is Ana's "Tea for the night ward". It asks for one Linden tea and pays its menu value. It is open in two cases: another quest is open and the purse holds less than the recovery floor, or no other quest is open and the purse cannot pay the next preparation. The supper quest counts as another quest, so the purse can buy the staples of the supper. It has its own ticket after the three quest tickets, so it never moves a quest to waiting. A delivery pays the reward, records nothing, and queues no scene. The quest closes when neither case is true, and it opens again each time a case becomes true. It stands outside the order of Ana's quests. Its dialog says "Ana returns while the purse runs low. Herbs from the Herb basket are free." So a player who spends coins on spare food is never stuck: the herbs are free, and blocker placement keeps room for the tea. One tea lifts an empty purse above the floor. Two Socată wait by the Herb basket in a new game, so the tea is one merge away from the first day.

The data check adds the work value of the quests that open before each preparation: the merges of their dishes times the work rate. It adds the costs of the preparations up to that one. The work value must cover the costs. So a player who delivers every open quest and buys only its staples always has the coins for the next preparation. The coins that remain after the last preparation must buy the staples of the supper. Only the supper quest opens after the last preparation, and the data has exactly one supper quest and one recovery quest. The data check also counts the merges of each quest: each quest fits in one day.

The campaign balance test plays the campaign with 20 fixed seeds. An efficient strategy cooks only for quests and lights the lanterns for each booking. For each seed, its purse never goes below zero, act 1 lasts from 18 to 30 days, and the purse after the supper holds 0 to 10% of the coins that the run spent on preparations, takes, and upkeep. A strategy that misses each booking once also finishes act 1. A strategy that starts each preparation window with a debt of 20 coins reaches each preparation through the recovery quest.

Story is a card on a wide screen and a sheet on a narrow screen. A narrow screen is 1023px wide or less. Story shows the current chapter and the next preparation. Its requirement list shows only the coins, quests, or source space still needed. When all requirements are met, one line says "Ready to prepare." Cost details expands below Pay inside Story. It shows the work, the budget, and the exact current and required totals. The player can pay while the details are open. Opening or closing the details changes no game state.

The game checks the coins, the necessary quests, and the space for an unlocked source at the same time. A failed check changes nothing. A payment spends the coins once and completes one preparation. A quest prerequisite that is unknown or cyclic is not valid. The authored quests are in the order in which they open. Every campaign quest opens before the last preparation.

Three quest tickets sit on the counter. The first three open quests, in authored order, take the tickets. The other open quests wait without a ticket. The next open quest takes the first free ticket. A character has at most one open campaign quest, because each quest waits for the earlier quests of its character. A booked guest comes last among the quests that open after the same preparation, so the quests before the evening bring the dishes of the dinner into the recipe book. While the recovery quest is open, it has a fourth ticket with a dashed edge.

A ticket shows the portrait and the name of the character, the dishes, and Deliver with its reward. A ticket with more than four dishes shows the first three and the count of the others. On a wider screen, the ticket also shows the quest title. The quest dialog and the accessible name of the ticket face give the board count of each dish. On a wider screen, a dish that needs several portions also shows that count on the ticket. Deliver is available when the board holds every portion. The face of the ticket is the portrait, the name, the title, and the dishes. A tap on the face opens the quest dialog. The label of the ticket section is "Neighbour quests".

The quest dialog shows who asks and why, each dish with its board count, the reward, and Deliver. If more than one character speaks, the name of the speaker starts each change of speaker. The dish rows give the exact dishes, so the dialogue does not list them. Each dish row opens the help for that item. A missing portion also gives a Find control beside its row. Find closes the dialog and marks the next board step for another portion. A row with enough portions has no Find control. Deliver takes all the required portions from the board in one change. A delivery changes nothing in these cases:

- An item is missing.
- The quest has no ticket.
- The quest is out of date.
- The player repeats the delivery.
- The coin total cannot hold the reward.
- The quest is booked, and it is not the evening of its guest from 20:00.

Character introductions, quest dialogs, quest replies, and quest replays use parchment pages. All 22 characters have individual pencil sketches. A quest shows its owner's sketch, except that the nine cathedral supply quests, Ionatan's dinner, and Mina and Avram's meal show their own scene illustrations. The illustration stays with the quest through speaker changes and journal replays. Introductions show the individual character sketch. Other story scenes keep their existing presentation. Victor draws these sketches while he waits for his meal. As an anatomy student, he studies anatomy, proportions, and perspective. He draws light but present facial features, including open eyes for awake people and closed eyelids for sleepers. He has a secret crush on Mara, so hers is the most carefully drawn face.

The dishes fly to the ticket. A temporary notice reports the delivery and the reward. While the completion scene waits, the notice also offers "Read [Name]’s reply", which opens that scene. The next open quest takes the ticket. If no quest is open, the counter shows "No quests wait now. Pay for the next preparation." After the last quest, it shows "Every quest is delivered. The bistro is yours."

A waiting scene is a scene that the player has not finished.

The four core characters are Mara, Ilie, Eszter, and Sorin. They have quest arcs in the six chapters. Each of their campaign quests has at least two turns at its opening and at its completion. It gives its character a want, a small complication, and a change at the end. Mara worries as a host. Ilie keeps the habits of his family. Eszter is proud of her craft. Sorin tells what he sees on his round. Mara, Ilie, and Sorin have six campaign quests each, and Eszter has eight. Mara also has the supper quest, and Ana has the recovery quest. These two quests have no completion scene. Dochia and Costel have five quests each. Victor, Ana, Sânziana, Dorian, Ileana, and Cezar have four quests each. Cătălina and Bran have three quests each. Vlad and Elisabeta have two quests each.

A visitor is a character who does not live in the neighbourhood. Adrian, Monica, and Janos are returning visitors who come from time to time. Each has three supply quests. The nine supply quests alternate in that order. They open after preparations 6, 8, 9, 13, 14, 17, 19, 21, and 22.

Each supply quest also waits for the delivery of the previous supply quest. So only one cathedral supply quest is open at a time. These visitors do not join the finale.

A cathedral supply quest asks for supplies for a stay under the cathedral. The visitors explore the passages under the cathedral, one level deeper on each visit. In each opening, a visitor tells a core character what the visitors found, and the core character answers. Each later visit follows from the finding of the visit before. The mystery stays open at the end of act 1. A quest has one of two sizes: provisions of 12 to 16 portions of chain dishes from stage 3, or meals of 4 to 6 portions of mixed dishes. The story journal (the journal) is a dialog that Story opens.

Ionatan is a foreign real estate agent who visits once in each save. His quest opens after preparation 9 and after Vlad's quest "A guest at the castle". It needs a plum brandy, a sharing board, and a tochitură. He stops for dinner on his way to a nearby castle. At the castle, he plans to close a property deal with a local noble.

The dinner pays its menu value. His quest does not depend on the cathedral supply quests. It can be open at the same time as one of them. He never joins the finale.

The delivery records his quest identifier (ID) once and ends his visit. His farewell scene waits in Story. A reload, an export, and an import keep the record of his departure. A new game allows a new visit.

The neighbourhood has 16 neighbours: the four core characters and 12 regulars. The six visitors are not neighbours. Each regular has a name, a trade, a portrait, an introduction, and two or three favourite dishes. Each quest of a regular asks for at least one favourite dish. Each regular refers to a horror novel, a horror film, local folklore, or a historical figure. The reference is in the name, the trade, or one habit. Vlad refers to Vlad III Dracula. Elisabeta refers to Elizabeth Báthory (Báthory Erzsébet).

Dochia, Victor, Ana, and Costel are present from the start. Sânziana and Dorian arrive with preparation 4. Vlad, Elisabeta, Ileana, and Cezar arrive with preparation 8, and their arrival scenes queue in that order. Cătălina and Bran arrive with preparation 12. Dorian is a wealthy gentleman of leisure. He sits for portraits and attends social meals.

A regular arrives only when a preparation is complete. Each regular who arrives later has a short arrival scene. In the scene, a core character introduces the regular, and the regular answers. The payment that brings a regular queues the arrival scene. The arrival scene follows the preparation scene and the closing scene that the payment earns. The arrival scene follows the rules of the story for waiting scenes.

Vlad is a local baron who calls himself a count and lives in a castle in the countryside. Elisabeta is an Austro-Hungarian countess who sometimes visits her land nearby. Each of their quests asks for red wine and a meat dish, and no dish of theirs has garlic. Vlad and Elisabeta do not join the finale. They book a table for the evening, and they never dine on the same evening: Vlad keeps moving the fence between their lands. Bookings, under Day and night, gives their delivery rules.

Some characters have a diet. The game does not show a diet. The data check enforces it with the content tags of each dish: meat, pork, dairy, egg, fish, alcohol, and garlic. A mixed dish has every tag of its parts. Mina eats no meat or fish. Cătălina keeps an Orthodox fast: no meat, dairy, or egg, and fish is allowed. Avram eats no pork, and no quest of his has both meat and dairy. In a shared quest, each character of the quest accepts each dish.

Mina and Doctor Avram share one visit in each save. Mina is a young British middle-class woman in Victorian dress. She looks for her fiancé Ionatan. He came to sign a property contract. She has no news from him. Avram is a Hungarian Jewish doctor who travels with her.

Their quest opens after the player delivers Ionatan's dinner and completes preparation 10. Mina and Avram arrive together and leave together. They never join the finale. They cannot meet Ionatan at the bistro.

Their shared quest is a vegetarian meal for two: two portions of zacuscă, two roasted vegetable plates, one smoked cheese, and one fruit tea. The meal can contain eggs and dairy. It contains no meat and no fish. The meal pays its menu value of 190 coins. The delivery ends the visit and sends them to find Ionatan.

The third delivery after theirs earns local news. The news says that they found him gravely ill and that all three left for Britain. They do not visit the bistro on the return journey. Only local speakers tell the news, and it gives no reward. The player can read it later in the journal.

The journal holds optional introductions for the neighbours and the three returning visitors. Its neighbours list shows the core characters, then the regulars in order of arrival. Each neighbour who has arrived shows a portrait, a name, a trade, and the number of delivered quests. A regular also shows the favourite dishes. A neighbour who has not arrived shows as a "Not yet" outline without a name and without a portrait.

Waiting arrival scenes open from Unread scenes. The neighbour rows open introductions. Ionatan, Mina, and Avram have introductions only while their quest is open. The journal does not replay their completed quests.

A campaign quest delivery queues the completion scene in the same change. The delivery notice does not open the scene and does not stop play. Read now opens the waiting scene from Story. The delivery notice also offers the scene by the name of the character. The journal has one conversation entry for each completed campaign quest of a neighbour or a returning visitor. The supper quest has only its opening entry, with the finale separate. The recovery quest has no journal entry. The completion action marks the scene as read.

A quest journal page shows Quest, then Reply, with the exact text and speakers and one shared illustration. It has one Return action. While the reply is unread, the whole conversation appears once under Unread scenes. Return marks only that reply as read and moves the same entry to Earlier conversations. A replay changes no game state. Story and delivery notices open the reply alone. Single-visit guests keep only their waiting farewell, with no combined replay.

The delivery stays recorded. The journal can replay the scenes of neighbours and returning visitors. If the save of a delivery fails, the game keeps the current session. The delivery notice then includes a warning that the session is not saved. Options offers Retry save. An export includes the current session. A reload restores only the progress that the game saved.

If the supper save fails, the finale also shows the save warning immediately inside its dialog.

The campaign has six chapters with four preparations each. Story shows the title and the objective of the current chapter. It also shows one step for each preparation of the chapter: done, now, or not yet. A chapter opens at its first preparation and needs no payment of its own. Its closing scene stays hidden until the chapter is complete. Each chapter names one quest of a core character. That quest opens during the chapter.

Each payment queues the scene of its preparation. The payment for the last preparation of a chapter also records the chapter as complete. In the same change, it queues the closing scene of the chapter. A payment queues its scenes in this order: the preparation scene, then the closing scene. Serving the supper queues the finale.

The game records the finale once. A failed payment queues nothing. The reveal is the change of the room that a paid preparation earns. After a payment, the preparation scene opens immediately. The complete conversation appears as a transcript. Its "See what changed" action moves the scene to the journal and starts the reveal.

Close and Escape start the reveal and leave the preparation scene waiting. After the reveal, the next scene that the payment earned opens. If the player opens another dialog first, that scene stays waiting. The completion action moves a scene to the journal and opens the next waiting scene.

Story shows the first waiting scene with Read now. After a reload, Mara's line says that a scene is waiting. When a preparation scene resumes after its reveal, its last button has the usual end label. It does not have the label "See what changed".

The next preparation and all tickets stay available while a scene waits. A scene gives no coins and no items when the player reads or replays it. If a saved scene has no content, the game shows an error with a recovery action and keeps the progress. The game does not invent story text.

Each scene shows its full transcript in order, with a portrait and name for each speaker. A combined quest journal page, introductions, and replays use the same presentation. One completion action follows the text. The dialog focuses its title and starts at the top. Close and Escape leave a waiting scene unread. Reopening starts at the top. Opening and scrolling a scene change no saved state. A waiting scene shows a save warning when its session is not saved.

The journal starts with Unread scenes, in their saved waiting order. Each waiting scene has one entry here, including the farewell of a single-visit guest. A read farewell has no replay. An empty list says "No unread scenes." The current chapter follows, or the latest chapter when all preparations are complete. Earlier chapters and Earlier conversations are collapsed groups below it. Earlier chapters lists the other complete chapters, newest first. Earlier conversations keeps each completed quest in one entry, with the most recently delivered quest first. It also holds earned local news and the read finale. Neighbours is a collapsed group for character browsing. Groups start closed when the journal opens. Return, Close, and Escape from a conversation keep the open groups and reading position, and focus its entry. When reading moves an entry, its group opens and the entry comes into view. A read arrival returns to its neighbour; a read single-visit farewell returns to the Unread scenes heading. Reading or opening groups gives no reward.

The journal lists each chapter that is current or complete. A current chapter shows its opening context, its goal, and the state of each preparation. It also shows its neighbour help after that quest opens. A complete chapter shows its payoff and its neighbour help. It also shows its preparations, each with the name of its room change, and its closing scene. After the supper, the journal also holds the finale.

In the finale, the four core characters speak, and the finale names the result of each chapter. Its last button, "See the supper", opens the supper painting. The painting shows 11 neighbours in the courtyard: Mara stands at the long table with a steaming pot. Ilie, Costel, Sorin, and Victor sit on one bench, and Eszter, Ana, Ileana, and Bran sit on the other. Cătălina and Cezar share the small table. Miez and the second black cat wait for scraps. The finale ending line is under the painting, and its button returns to the kitchen. A replay of the finale from the journal also ends with the painting. After the supper is served, the courtyard of the room shows the supper painting and no finishes. No quests remain after the supper. While the supper waits, the supper card names the supper quest on the counter. When the supper is complete, the card says "The community supper is open, and every quest is delivered. The board and the recipe book stay yours." Then it gives the result of act 1, for example "The bistro worked for 22 days. The purse holds 312 coins." A debt shows as "The shop notebook holds a debt of 40 coins."

The kitchen is the board with the tickets and Mara's line. Mara's line is the line of text under the board. Mara says what the player can do next. The room is the home of the game and its reward. On a narrow screen, the kitchen is a drawer over the room. On a wider screen, the kitchen is a panel beside the room. The room shows one painted area of the bistro. The area shows the state that the completed preparations leave. The bistro has two areas:

- The front room starts unfinished, with cobwebs and a few small spiders in the broken window. The preparation "Fix the broken window" clears them. One resident spider always stays under the upper wall shelf.
- The courtyard opens with the preparation "Clear the courtyard" in chapter 4.

Each area has one painting for each of its states. The room shows the state of the highest completed preparation in that area. Preparations 1 to 12, 17, and 24 change the front room. Preparations 13 to 16 and 18 to 23 change the courtyard. The room opens on the area that the player chose last. A reveal moves the room to the area of its change. Without a stored choice, the room shows the area of the latest change.

An area switch in a corner of the room shows the other area. A locked area shows only its name and the preparation that opens it. A small "New" pin marks the latest change in the area. The pin shows the short name of the change, for example "New: lamps lit". The pin points at the edge of the change and does not cover the change. If the name does not fit, the pin says only "New".

To merge, the player taps an item and then a matching item. Two matching dishes of a chain make the next dish of the chain. Two parts of a recipe make a mixed dish: the player merges one part into the other, in either order, and the mixed dish takes the cell of the target. A recipe has two parts from different chains, or one part that is a mixed dish of two chain dishes, so recipes nest one level deep. A mixed dish uses at most three chains. Selecting a movable dish marks each movable dish and each blocked space that it merges with. Sources, and final dishes that are part of no recipe, mark no merge target. The player can also drag an item onto a matching item. A tap on an empty space moves the selected item there. A drag onto a different item swaps the two items. The item dialog names the neighbours whose tickets need the dish. If no ticket needs it, the dialog says "No quest on the counter needs it now." "Show me on the board" shows the next step to make the dish. "Find a match" in Mara's line shows a pair or a recipe to merge.

Each chain has one source. One tap on a source takes one stage-1 ingredient and selects the source. Each further tap takes another ingredient. Enter or Space on the focused source also takes one ingredient. A take from a paid source spends the take cost, and a paid source shows that cost on its tile. Higher-stage dishes come only from merges. A drag moves the source and takes nothing. Sources cannot merge. The selected-source line names the source and says that another tap takes its ingredient. Clear selection ends the selection. If the board is full or the purse cannot pay, the source takes nothing and Mara says why. A failed take changes nothing.

A dish leaves the board when the player merges it, delivers it, or the thief rat takes it at closing. If the board is full of dishes that cannot merge and that no quest needs, only a new game clears the board. The board-full notice says "The board is full. Merge a pair or deliver a quest."

The recipe book lists the dishes of each chain, then the mixed dishes. A new game discovers the items on its initial board. After that, a take, a merge, a gift of Șoricescu, or a quest ticket discovers a dish: a quest that takes a ticket puts its dishes in the recipe book. A dish that the player has not discovered shows as a covered dish with the label "Not yet". A discovered dish shows its picture and its name and opens its item dialog. Close or Escape from an item opened in the book returns to the same book position and focuses that dish. "Show me on the board" leaves the book and goes to the board. Quest dish help returns to its quest. Board guidance raises a lowered kitchen drawer before it focuses the next step. If the requested dish is not on the board, this guidance keeps its target while the player acts. Find on a quest always guides toward another needed portion. The board marks the next useful cells, and the selected-item line names the goal and next step. A successful take or merge that makes another requested dish ends the guide. Stop, Escape from the board or a guide control, or a second tap on the selected dish or blocker cancels it. A tap on a selected source takes another ingredient. A reload, import, reset, or update from another tab also clears it. Guidance changes no game state and performs no action for the player. The first take or merge of a dish that is not in the recipe book shows the notice "[Dish] is a new dish! It is in the recipe book now." A section whose dishes are all discovered shows "Complete" in its heading. The item dialog of a mixed dish shows its recipe, and the item dialog of a part names the mixed dishes that it makes. "Show me on the board" for a mixed dish guides toward the missing part with the fewest steps. The recipe book button shows how many dishes the player has discovered. These marks give no reward.

When the board is full, the guide first points to a legal merge toward its dish. If that is not available, it points to a ready quest delivery that removes a dish, then to another legal pair or blocker merge. A ready delivery gets the same dotted cue on its ticket button. Blocked ingredients are not counted as movable matches. The guide does not suggest taking from a source without a free space. If no delivery or merge can make room, it says so and keeps Stop available. The guide does not change the board or deliver a quest for the player.

A new game starts with eight blocked cells at the edge of the board. A blocker covers each of these cells. Each cell shows its blocked item through the open centre of the blocker. Four blockers use crate, sack, crock, or linen art, and four use twine. Webs cover the crate, sack, crock, and linen blockers until the preparation "Fix the broken window" is complete.

Every blocker has the same rule: any legal merge into the blocked item clears it, with a matching dish of its chain or a recipe partner. The blocker clears, the dish of the merge stays in that cell, and the purse gains the blocker coin in the same change. The cell of the moved item becomes empty. A merge next to a blocker clears nothing.

A blocked item cannot move and cannot fill a quest. Clearing a blocker needs no free space. It is optional for campaign progress and for quests. A blocked cell is not a free space for any placement or space count. "Find a match" and "Show me on the board" can show any matching blocked item. A blocker does not add its item to the recipe book.

Each blocker has a small help mark. A tap selects the blocker. The name of the blocker and its clearing rule replace the item actions or the preparation offer under the board. The help names the blocked dish and each recipe partner that the player has made, and marks the movable matches. A recipe partner that the player has not made stays covered: the help does not name it. A tap on a marked item merges it into the blocker and clears it in the same action. A selected matching item also merges directly into the blocked space. To leave the help without a merge, tap the blocker again, select an item that does not match, use Clear selection, or press Escape. The help changes no game state until a merge.

Each of the 24 preparation payments earns one authored batch of two or three new blockers. The batch describes the work that the player completed with that payment: repair supplies, courtyard leaves, planting supplies, recipe papers, menu packing, or supper supplies. The items of a batch come only from chains that the payment has opened. Each batch has one blocker with a contextual picture. The other blockers use familiar clutter art or an anchored item.

The same clearing rules apply. Quest deliveries earn no batch. No batches arrive after the campaign.

A blocker takes an empty cell only. A new source from the payment takes its space first. Placement follows board order and keeps at least four usable cells empty, so the recovery quest always has room for one Linden tea. Blockers can touch each other.

At most three preparation blockers can be uncleared at the same time. This limit does not count the eight blockers of a new game or the rat holes. The other blockers wait in preparation order. A successful move, take, delivery, or payment tries placement again. A failed action places nothing.

A placement never replaces an item and never moves an item. A blocked cell can receive another blocker only after the earlier blocker is cleared and the cell is empty. Each blocker appears once. Its name and its explanation give its context. The label of the board gives the number of blockers that wait.

The screen shows one Pay control at a time. If the story card is on the screen, only the story card has Pay. If Story is a sheet, Mara's line has Pay. Mara's line offers the next preparation by name with a Pay button.

Mara's line makes this offer if the player meets all the requirements, has not selected a board tile, and has no active dish guide. If a guide is active, Mara's line keeps the next-step note and Stop control visible. If the player selects a tile, Mara's line shows the actions of that tile. While the story card is not on the screen, the Story button has a copper dot if the player can pay or if a scene waits. The Story sheet keeps Pay available during a dish guide. If the player cannot pay yet, Mara's line does not change. Pay in Mara's line works like Pay in Story.

After the player pays for a preparation, its preparation scene plays. When the scene ends, the reveal runs. The new painting replaces the old painting, and the pin marks the change. The drawer can move on a narrow screen that is taller than 600px. There, the drawer lowers for the reveal and then rises again. On a narrow screen that is 600px high or less, the drawer does not move, and the drawer body stays active during the reveal. [`DESIGN.md`](DESIGN.md) gives the order and the timing of the reveal. With reduced motion (defined in Access and persistence), the game shows the result immediately. The reveal does not spend coins and does not earn coins again.

Every preparation repaints one area. Miez, the bistro cat, sits on the windowsill of the front room. When the supper is ready, a second black cat sleeps on the counter. Captions describe every earned change.

Story has a Miez card. A tap on the card or on the cat on the windowsill changes the cat between sitting and sleeping. The change shows a short notice and plays a sound if sound is on. It does not change the save.

A bat crosses the dusk beyond the mended window of the front room after each preparation. It also crosses after every third delivered quest. It crosses only while the room shows the front room. It never crosses while the page is hidden, with reduced motion, before the player mends the window, or if the room painting failed to load.

Recovery deliveries count towards this motion only during the current tab visit. A reload, import, reset, or adopted save clears that temporary count.

A caption stays available if a painting cannot load. If a state has no accepted painting, the room shows the latest earlier painting of its area. It shows the caption of the new state. Authored lamps and lanterns light the room at story milestones.

The game has no energy limit, no timers, no purchases, no ads, and no accounts.

### Day and night

The bistro has a working day. Each merge is kitchen work, and kitchen work moves the clock. Each successful merge adds 6 minutes: a chain merge, a mixed merge, and a blocker merge. A failed merge, a move, a take, a delivery, a payment, and a scene do not move the clock. A new game starts on day 1 at 07:00. A day holds 150 merges, from 07:00 to 22:00. The masthead shows the day and the time, for example "Day 3 · 14:24". The accessible name gives the exact day and time.

The merge that reaches 22:00 closes the day in the same change, in this order:

1. The merge applies with all its usual effects, including the placement of preparation blockers.
2. The purse pays the upkeep of 10 coins.
3. The thief rat or Șoricescu visits the board.
4. The next day starts at 07:00.
5. The game fixes the evening guest of the new day.
6. The state records the night report.

A loose raw ingredient is a stage-1 dish of a chain other than Herbs, on a cell without a blocker. Cooked dishes and herbs are safe overnight. If the board has a loose raw ingredient at closing, the thief rat comes. It picks up to three loose raw ingredients at random, by the random seed of the save. The game gives no warning, and the player cannot protect a cell. If fewer than three rat holes are open, the first pick stays in its cell, blocked in a new rat hole. The other picks leave the board. A rat hole is a blocker under the usual blocker rules: a merge of a matching dish clears it, the dish stays in the cell, and the purse gains the blocker coin. A rat hole replaces the pick in its cell, so it does not reduce the free cells.

If the board has no loose raw ingredient, Șoricescu, the good rat of the neighbourhood, comes. A tidy kitchen earns his gift: the stage-4 dish of an open chain. The open chains take turns in their data order, by the number of earlier gifts. The gift goes into the free cell nearest to the bottom left of the board. It is not blocked. He leaves a gift only if the board has at least five free cells, so four free cells stay free for the recovery quest.

The upkeep can take the purse below zero. A purse below zero is a debt: Mara writes it "pe caiet", in the notebook of the village shop. The purse shows a debt with a minus sign, for example "−12". A paid take and a payment need the coins. A free take, a delivery, and a cleared blocker work with a debt. The recovery quest stays open while the purse is short. The game has no defeat.

After the closing, the closing dialog says that the day is over. It offers Watch the night and Skip. Until the player chooses, the board shows how it was before the night. Watch the night, Close, and Escape play the night. The room dims, and the rat of the night runs across its floor. Then, on the board, the thief rat takes its picks and leaves its rat hole, or Șoricescu puts down his gift and lifts his hat. While the front room shows a mended window, its glass shows a night sky. No tap and no key ends a watched night, and that input does nothing. Skip, and the end of the night, open the morning dialog. The morning dialog reports the upkeep, what the rat did, and the purse or the debt. Closing it marks the report as seen. While the page is hidden or with reduced motion, the morning dialog opens at once, without the closing dialog or the night. If the page becomes hidden during the night, the night ends and the morning dialog opens. If the page reloads before the player closes the morning dialog, the morning dialog opens after the load, without the night.

#### Bookings

Each quest of Vlad and Elisabeta is a booked quest. A booked ticket is a booked quest on a ticket. Each day has one evening guest at most:

- At 07:00, if a booked ticket is on the counter, the game fixes the evening guest.
- If no evening guest is fixed, the change that brings a booked ticket to the counter fixes the evening guest.
- If only one guest has a booked ticket, that guest has the evening. If both have one, the guest who did not have the last evening has it. If neither had an evening, the guest whose quest is first in authored order has it.
- The evening guest does not change until the next closing. An evening counts for its guest whether or not the player delivers the meal.

The ticket of the evening guest shows "Booked for 20:00", and each other booked ticket shows "Booked for another evening". Each day admits one booked delivery, to the evening guest, from 20:00 to the closing. Before 20:00, the lantern control "Light the lanterns" takes the place of Deliver on the ticket of the evening guest. It works when the board holds every portion, and it moves the clock to 20:00 in one change. It spends no coins, and the closing comes sooner. So the player never has to cook food that no quest needs to wait for a guest. The opening of each booked quest names the booking time. A booked guest who does not get the meal books again for a later evening.

#### End of act 1

The supper delivery stops the clock. After the supper, merges do not move the clock, and no night comes. The supper records the result of act 1: the number of days and the purse at that moment. The result does not change after the supper, although the purse can change.

Three quests offer a second finish for a detail of the bistro:

- Eszter's "A second glaze" opens after preparation 9. It offers Green bowls for the shelf tableware (default: Blue bowls).
- Ileana's "A blue table cloth" opens after preparation 22. It offers Blue embroidery for the courtyard table cloth (default: Red embroidery).
- Sânziana's "Lilacs for the dresser" opens after preparation 23. It offers Lilacs for the final dresser flowers (default: Wildflowers).

The existing paintings supply the default finishes. A detail shows in the room after its preparation: 9 for the tableware, 22 for the table cloth, and 24 for the flowers.

A switch with a small badge sits on a detail. It shows when the detail is in the room and its quest is delivered. A tap on the switch changes the detail to the other finish. The change applies only after the save succeeds. If the write fails, the detail keeps its previous finish, and the game says so.

The player can switch again at any time. A finish does not change progress or rewards. The switch shows only in the area that the room shows. The switch accepts input only if its painting has loaded. It also needs at least 44px by 44px of the detail to be visible above the drawer. Where the drawer can move, the player can lower it to reach a detail outside the current crop. The completion line of each finish quest says where the switch is.

## Feature specifications

The register `docs/specs/README.md` records the feature specifications, their status, the product limits, and the product direction. It stays in the repository only.
This document owns the implemented behavior.
The art plan `docs/specs/001-visible-renovation-art-plan.md` defines the 25 painted room states. It stays in the repository only.

## Identity

The game has 93 generated Portable Network Graphics (PNG) masters. They provide these items:

- 16 food atlases: one for each chain, with its source and its dishes, and four for the mixed dishes
- portraits, including three atlases for the regulars
- parchment paper, 22 character sketches, nine cathedral scenes, and two visitor meal scenes
- 25 painted room states
- the supper painting
- two decoration edit paintings, sampled only within their authored regions
- the timber tabletop
- the embroidered runner
- cat sprites and bat sprites
- board clutter, with a web overlay and a twine overlay
- 12 contextual preparation clutter pictures
- two rat sprite sheets, the rat hole, and the night sky

[`DELIVERY.md`](DELIVERY.md) gives the shipped image variants and the fonts.

The [release notes](docs/release-notes.md) give the release limits, including the limits of title clearance.

## Access and persistence

The game supports pointer, keyboard, and touch controls. It supports Light, Dark, and System appearance, visible focus, and reduced motion. Dark is the appearance until the player chooses another one in Options. Sound is off until the player turns it on in Options.

The Motion choice in Options has three choices. System is the default. System follows the reduced-motion setting of the device. Reduced removes the motion on all devices. Full plays all the motion, also when the device asks for reduced motion. In this document, "reduced motion" means Reduced, or System on a device that asks for reduced motion. In forced colours mode (Windows high contrast), the board spaces and the selection stay visible.

The browser stores the save, the appearance choice, the Motion choice, and the area that the room shows. The area is a display preference and is not part of the save.

If the browser blocks storage, the player can play for the current visit only. Options and each change say that the game is not saved. A preparation or a finish switch needs a successful save, so it does not complete.

If the game is open in more than one tab, each tab follows the latest save. A tab does not replace the latest save with an older board. When a tab follows the latest save, an open dialog or a drag in that tab ends.

If the game data cannot load or does not pass its checks, the kitchen says so and offers Try again. The game also disables the Story button, the Options button, and the buttons that open the recipe book. The game does not read or write the save in that case.

An import validates the envelope and the state of the save. The envelope is the outer record with the format and the version. A load and an import accept a top-level state field that the save format does not define. Play, the next save, and an export keep that field. A load ignores an envelope field that the format does not define, and the next save drops it. A board cell with an undefined field makes the save not valid. An import rejects damaged saved data and keeps the current save. An import enforces a size limit of 2 mebibytes (MiB). Load, save, import, and reset use only the save key of this game. They do not change other browser data.

A current save has game state version 14 in envelope version 13 at the key `scary-snacks-save-v13`. The game supports only this format. Load reads only this key. If no current save exists, the game starts a new campaign.

The completed quest ID of the supper quest records the served supper. A current save with all preparations complete and no served supper shows the supper quest. It earns the finale only when the player serves the supper. If such a save holds the finale as a waiting scene, load and import remove the finale before the check.

Saves in an earlier format stay unchanged. The game does not read them or convert them. Import rejects earlier formats. A new game uses the authored blocked layout. A save records the ID of the layout and the IDs of the cleared blockers. A layout ID must stay the same after release.

The optional preparation blocker record stores the baseline and, for each placed blocker, its ID and its cell. The baseline is the number of completed preparations when the record starts. The waiting blockers come from the paid batches after the baseline. A current save without this record starts the baseline before its next successful preparation payment. It gets no batch for an earlier payment.

A reload, an import, and a change from another tab keep the record. They do not place a blocker and do not repeat a blocker. If a preparation save fails, its payment, its batch, and its placements do not enter the session. If a save fails after a board action, the current session keeps the placement and the queue. Retry save and export include that session.

The state records the waiting scenes in a list. The list holds preparation scenes, quest completion scenes, chapter closing scenes, the finale, local news, and regular arrival scenes. Only earned scenes can enter the list. A preparation scene uses the ID of its preparation, and a quest completion scene uses the ID of its quest.

An arrival scene has the ID `arrival-` followed by the ID of its regular. Each scene ID is unique across preparations, quests, local news, chapters, the finale, and arrivals. Each ID occurs once in the list. Preparation scenes, closing scenes, and the finale keep one story order. Each closing scene follows the four preparation scenes of its chapter. Quest scenes, local news, and arrival scenes can wait at any position in the list.

The completed preparations decide which chapters are complete. The completed quests and their delivery order decide the local news. A scene ID must stay the same after release. If a save has no waiting entry for a scene, the game treats that scene as read.

A reset clears the waiting scenes with the rest of the state. An import replaces them only after full validation and confirmation.

The state records the day and the merges of that day, the random seed, the cell and the ingredient of each open rat hole, the number of gifts, the evening guest, the guest of the last evening, and whether the day had its booked delivery. It records the last night report and whether the player saw its morning dialog, and the result of act 1 after the supper. The purse can hold a whole number below zero. A reload, an export, and an import keep all of these. Only a closing with the thief rat uses and advances the seed. A failed action does not change it.

The state records the completed quest IDs in delivery order. Each ID occurs once. Each completed quest has its prerequisites earlier in the list. Every completed preparation has its necessary quests in the list. Saved finish choices name only unlocked finishes. Export and import include the quest progress and the board layout.

An explicit new game or a confirmed import replaces only the current save, in one write. A normal save never replaces a current save that is not valid. Options then offers Retry saved game, and the game blocks changes until recovery. An import or a new game also ends the recovery.

In these cases, the game clears the new-dish marker of the recipe book. It also clears the delivery effects of the previous board:

- The game imports a save.
- The player resets the game.
- The game adopts the game of another tab.

If the browser offers locks on a secure origin, each game change uses one browser lock that all tabs share. Before a change, the game checks the latest saved state. If another tab has changed the state, the game shows that progress. It cancels the action that waits for the lock. The player can then make a new action on the updated board.

The game saves a preparation before its progress becomes active. The game also saves it before the story and the room change appear. If the write fails, the preparation does not spend coins, does not give progress, and does not show a reward. The player can try again if storage is available.

## Deployment

The game supports Chromium-based browsers (Chrome, Edge, and other browsers built on Chromium). The project does not test other browsers. The HyperText Markup Language (HTML) file has a Content Security Policy (CSP). The CSP and relative paths support static hosting.

The project publishes the game at https://satyrlord.github.io/scary-snacks/. [`DELIVERY.md`](DELIVERY.md) gives the Pages workflow.
