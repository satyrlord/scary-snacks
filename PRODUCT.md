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

Quests have no deadline. Ingredient production is free and immediate. The player can read, skip, or resume story scenes under the rules in Play. The rules in Access and persistence control saves, recovery, and more than one tab.

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

- five chains of six items each, which are 30 dishes and drinks
- five ingredient sources (generators), one for each chain
- 22 characters
- 83 quests: 81 campaign quests, one supper quest, and one recurring quest
- 24 preparations in six chapters

In this document, "dish" also means a drink. An ingredient is a dish that a source gives. Each dish has an English name. If English has no name for the dish, the dish has its Romanian regional name with diacritics. The initial layout, the prices, the progression, the characters, and the dialogue are new works.

A quest is a task that a character gives to the player. The quests are authored.

A campaign quest earns coins. Some preparations unlock a source. Each preparation unlocks story scenes and visibly changes the bistro.

Each dish has an explicit menu price for its portion. Flour and cornmeal cost 2 coins each. Elderflowers cost 1 coin. The price of a dish depends on its ingredients, its work, and its portion. A later stage does not always cost more.

The menu value of a quest is the sum of the prices of its portions. Every quest pays its menu value. Quests are the only income.

Each preparation has a work scope, a material cost, a labour cost, and an estimate of active person-hours. Its coin cost is the material cost plus the labour cost. The cost does not rise with the position of the preparation in the story. The cost model uses one coin for about one Romanian leu as a reference scale. It includes reuse of the furniture and supplies that the bistro has. It leaves out running costs and keeps production free. The [economy record](docs/economy.md) gives the quantities, the portions, the primary references, and the assumptions.

A campaign quest opens after a named preparation, or in a new game. A campaign quest that opens after preparation N is necessary for preparation N + 1. Each preparation needs every campaign quest that opens before it. The player delivers all 81 campaign quests before the supper quest. The quests that open before a preparation pay for it.

The supper quest is Mara's last quest, "The community supper". It opens after preparation 24. It asks for no dishes and gives no reward. It costs 1,000 coins. Its ticket shows Pay with the cost, and its dialog shows the cost and the coins in the purse. Pay is available when the purse holds the cost. The payment spends the coins once, records the quest, and queues the finale in place of a completion scene. The finale opens immediately.

The recurring quest is Ilie's "Sarmale for the supper". It asks for two cabbage rolls and pays their menu value of 100 coins. It is open only while the supper quest is open and the purse holds less than the cost of the supper. A delivery pays the reward. It records nothing, queues no scene, and leaves the quest open until the purse holds the cost. Its dialog says "This quest returns until the purse holds enough for the supper." The recurring quest is a safety net: a player who delivers every campaign quest and pays every preparation has 2,195 coins after preparation 24.

The data check adds the rewards of the quests that open before each preparation. It adds the costs of the preparations up to that one. The rewards must cover the costs. So a player who delivers every open quest always has the coins for the next preparation. The coins that remain after the last preparation must cover the supper. Only the supper quest and the recurring quests open after the last preparation, and the data has exactly one supper quest.

Story is a card on a wide screen and a sheet on a narrow screen. A narrow screen is 1023px wide or less. Story shows the current chapter and the next preparation. It shows the coins and the delivered quests that the next preparation needs. Cost details shows the work and the budget.

The game checks the coins, the necessary quests, and the space for an unlocked source at the same time. A failed check changes nothing. A payment spends the coins once and completes one preparation. A quest prerequisite that is unknown or cyclic is not valid. The authored quests are in the order in which they open. Every campaign quest opens before the last preparation.

Three quest tickets sit on the counter. The first three open quests, in authored order, take the tickets. The other open quests wait without a ticket. The next open quest takes the first free ticket. A character has at most one open quest, because each quest waits for the earlier quests of its character.

A ticket shows the portrait and the name of the character, the dishes, and Deliver with its reward. On a wider screen, the ticket also shows the quest title. The quest dialog and the accessible name of the ticket face give the board count of each dish. On a wider screen, a dish that needs several portions also shows that count on the ticket. Deliver is available when the board holds every portion. The face of the ticket is the portrait, the name, the title, and the dishes. A tap on the face opens the quest dialog. The label of the ticket section is "Neighbour quests".

The quest dialog shows who asks and why, each dish with its board count, the reward, and Deliver. If more than one character speaks, the name of the speaker starts each change of speaker. The dish rows give the exact dishes, so the dialogue does not list them. Each dish row opens the help for that item. Deliver takes all the required portions from the board in one change. A delivery changes nothing in these cases:

- An item is missing.
- The quest has no ticket.
- The quest is out of date.
- The player repeats the delivery.
- The coin total cannot hold the reward.

Character introductions, quest dialogs, quest replies, and quest replays use parchment pages. All 22 characters have individual pencil sketches. A quest shows its owner's sketch, except that the nine cathedral supply quests, Ionatan's dinner, and Mina and Avram's meal show their own scene illustrations. The illustration stays with the quest through speaker changes and journal replays. Introductions show the individual character sketch. Other story scenes keep their existing presentation. Victor draws these sketches while he waits for his meal. As an anatomy student, he studies anatomy, proportions, and perspective. He draws light but present facial features, including open eyes for awake people and closed eyelids for sleepers. He has a secret crush on Mara, so hers is the most carefully drawn face.

The dishes fly to the ticket. A temporary notice reports the delivery and the reward. While the completion scene waits, the notice also offers "Read [Name]’s reply", which opens that scene. The next open quest takes the ticket. If no quest is open, the counter shows "No quests wait now. Pay for the next preparation." After the last quest, it shows "Every quest is delivered. The bistro is yours."

A waiting scene is a scene that the player has not finished or skipped.

The four core characters are Mara, Ilie, Eszter, and Sorin. They have quest arcs in the six chapters. Each campaign quest has at least two turns at its opening and at its completion. A campaign quest gives its character a want, a small complication, and a change at the end. Mara worries as a host. Ilie keeps the habits of his family. Eszter is proud of her craft. Sorin tells what he sees on his round. Mara, Ilie, and Sorin have six campaign quests each, and Eszter has eight. Mara also has the supper quest, and Ilie has the recurring quest. These two quests have no completion scene. Dochia and Costel have five quests each. Victor, Ana, Sânziana, Dorian, Ileana, and Cezar have four quests each. Cătălina and Bran have three quests each. Vlad and Elisabeta have two quests each.

A visitor is a character who does not live in the neighbourhood. Adrian, Monica, and Janos are returning visitors who come from time to time. Each has three supply quests. The nine supply quests alternate in that order. They open after preparations 6, 8, 9, 13, 14, 17, 19, 21, and 22.

Each supply quest also waits for the delivery of the previous supply quest. So only one cathedral supply quest is open at a time. These visitors do not join the finale.

A cathedral supply quest asks for supplies for a stay under the cathedral. The visitors explore the passages under the cathedral, one level deeper on each visit. In each opening, a visitor tells a core character what the visitors found, and the core character answers. Each later visit follows from the finding of the visit before. The mystery stays open at the end of act 1. A quest has one of two sizes. The first size is 12 to 16 portions of stage 3 or stage 4 dishes. The second size is 4 to 6 portions of stage 5 or stage 6 dishes. The story journal (the journal) is a dialog that Story opens. The journal holds the introduction of each returning visitor and each completed quest.

Ionatan is a foreign real estate agent who visits once in each save. His quest opens after preparation 9 and after Vlad's quest "A guest at the castle". It needs one goulash pot, one sharing board, one chimney cake, and one plum brandy. He stops for dinner on his way to a nearby castle. At the castle, he plans to close a property deal with a local noble.

The dinner pays its menu value of 220 coins. His quest does not depend on the cathedral supply quests. It can be open at the same time as one of them. He never joins the finale.

The delivery records his quest identifier (ID) once and ends his visit. His farewell scene waits in Story. A reload, an export, and an import keep the record of his departure. A new game allows a new visit.

The neighbourhood has 16 neighbours: the four core characters and 12 regulars. The six visitors are not neighbours. Each regular has a name, a trade, a portrait, an introduction, and two favourite chains. Each quest of a regular asks for at least one dish from those chains. Each regular refers to a horror novel, a horror film, local folklore, or a historical figure. The reference is in the name, the trade, or one habit. Vlad refers to Vlad III Dracula. Elisabeta refers to Elizabeth Báthory (Báthory Erzsébet).

Dochia, Victor, Ana, and Costel are present from the start. Sânziana and Dorian arrive with preparation 4. Vlad, Elisabeta, Ileana, and Cezar arrive with preparation 8, and their arrival scenes queue in that order. Cătălina and Bran arrive with preparation 12. Dorian is a wealthy gentleman of leisure. He sits for portraits and attends social meals.

A regular arrives only when a preparation is complete. Each regular who arrives later has a short arrival scene. In the scene, a core character introduces the regular, and the regular answers. The payment that brings a regular queues the arrival scene. The arrival scene follows the preparation scene and the closing scene that the payment earns. The arrival scene follows the rules of the story for waiting scenes.

Vlad is a local baron who calls himself a count and lives in a castle in the countryside. Elisabeta is an Austro-Hungarian countess who sometimes visits her land nearby. They like the Warm kitchen and Drinks counter chains. Their quests ask for cabbage rolls, goulash, and red wine. Red wine has the stable item ID `drinks_5` and costs 35 coins for one small carafe. Vlad and Elisabeta do not join the finale.

Mina and Doctor Avram share one visit in each save. Mina is a young British middle-class woman in Victorian dress. She looks for her fiancé Ionatan. He came to sign a property contract. She has no news from him. Avram is a Hungarian Jewish doctor who travels with her.

Their quest opens after the player delivers Ionatan's dinner and completes preparation 10. Mina and Avram arrive together and leave together. They never join the finale. They cannot meet Ionatan at the bistro.

Their shared quest is a vegetarian meal for two: two zacuscă toasts, two roasted vegetable plates, one smoked cheese plate, and two fruit teas. The meal can contain eggs and dairy. It contains no meat and no fish. The meal pays its menu value of 168 coins. The delivery ends the visit and sends them to find Ionatan.

The third delivery after theirs earns local news. The news says that they found him gravely ill and that all three left for Britain. They do not visit the bistro on the return journey. Only local speakers tell the news, and it gives no reward. The player can read it later in the journal.

The journal holds optional introductions for the neighbours and the three returning visitors. It also holds the opening scene and the completion scene of each finished quest. Its neighbours list shows the core characters, then the regulars in order of arrival. Each neighbour who has arrived shows a portrait, a name, a trade, and the number of delivered quests. A regular also shows the favourite chains. A neighbour who has not arrived shows as a "Not yet" outline without a name and without a portrait.

A waiting arrival scene opens from the journal entry of its regular. After the scene, the entry opens the introduction. Ionatan, Mina, and Avram have introductions only while their quest is open. The journal does not replay their completed quests.

A campaign quest delivery queues the completion scene in the same change. The delivery notice does not open the scene and does not stop play. Read now opens the waiting scene from Story. The delivery notice also offers the scene by the name of the character. The journal has a Read completion entry for each completed campaign quest of a neighbour or a returning visitor. It also has a Read quest button for each recorded quest opening. The supper quest has no Read completion entry. The recurring quest has no journal entry. Finish and Skip mark the scene as read.

Close and Escape leave the scene waiting. The delivery stays recorded. The journal can replay the scenes of neighbours and returning visitors. If the save of a delivery fails, the game keeps the current session. The delivery notice then includes a warning that the session is not saved. Options offers Retry save. An export includes the current session. A reload restores only the progress that the game saved.

If the supper save fails, the finale also shows the save warning immediately inside its dialog.

The campaign has six chapters with four preparations each. Story shows the title and the objective of the current chapter. It also shows one step for each preparation of the chapter: done, now, or not yet. A chapter opens at its first preparation and needs no payment of its own. Its closing scene stays hidden until the chapter is complete. Each chapter names one quest of a core character. That quest opens during the chapter.

Each payment queues the scene of its preparation. The payment for the last preparation of a chapter also records the chapter as complete. In the same change, it queues the closing scene of the chapter. A payment queues its scenes in this order: the preparation scene, then the closing scene. The payment of the supper quest queues the finale.

The game records the finale once. A failed payment queues nothing. The reveal is the change of the room that a paid preparation earns. After a payment, the preparation scene opens immediately. Its last line leads to the reveal. Skip scene moves the preparation scene to the journal and starts the reveal.

Close and Escape start the reveal and leave the preparation scene waiting. After the reveal, the next scene that the payment earned opens. If the player opens another dialog first, that scene stays waiting. Finish or Skip moves a scene to the journal and opens the next waiting scene.

Story shows the first waiting scene with Read now. After a reload, Mara's line says that a scene is waiting. When a preparation scene resumes after its reveal, its last button has the usual end label. It does not have the label "See what changed".

The next preparation and all tickets stay available while a scene waits. A scene gives no coins and no items when the player reads, skips, or replays it. If a saved scene has no content, the game shows an error with a recovery action and keeps the progress. The game does not invent story text.

Each waiting scene keeps the line that the player sees. Back and Continue save the line. Read now and a "New scene" journal entry resume the scene at that line. If the player opens a different waiting scene, the first scene keeps its line.

A replay of a read scene starts at the first line. It keeps its position only in the dialog and changes nothing in the save. If a saved line is past the last line, the scene starts at the first line and shows this notice: "Someone lost the thread. The conversation starts again from the beginning." If a line save fails, the scene shows a warning that the session is not saved. The warning appears once for each scene. The player can continue to read.

The journal lists each chapter that is current or complete. A current chapter shows its opening context, its goal, and the state of each preparation. It also shows its neighbour help after that quest opens. A complete chapter shows its payoff and its neighbour help. It also shows its preparations, each with the name of its room change, and its closing scene. After the supper, the journal also holds the finale.

In the finale, the four core characters speak, and the finale names the result of each chapter. Its last button, "See the supper", opens the supper painting. The painting shows 11 neighbours in the courtyard: Mara stands at the long table with a steaming pot. Ilie, Costel, Sorin, and Victor sit on one bench, and Eszter, Ana, Ileana, and Bran sit on the other. Cătălina and Cezar share the small table. Miez and the second black cat wait for scraps. The finale ending line is under the painting, and its button returns to the kitchen. A replay of the finale from the journal also ends with the painting. No quests remain after the supper. While the supper needs payment, the supper card names the supper quest on the counter. When the supper is complete, the card says "The community supper is open, and every quest is delivered. The board and the recipe book stay yours."

The kitchen is the board with the tickets and Mara's line. Mara's line is the line of text under the board. Mara says what the player can do next. The room is the home of the game and its reward. On a narrow screen, the kitchen is a drawer over the room. On a wider screen, the kitchen is a panel beside the room. The room shows one painted area of the bistro. The area shows the state that the completed preparations leave. The bistro has two areas:

- The front room starts unfinished, with cobwebs and a few small spiders in the broken window. The preparation "Fix the broken window" clears them. One resident spider always stays under the upper wall shelf.
- The courtyard opens with the preparation "Clear the courtyard" in chapter 4.

Each area has one painting for each of its states. The room shows the state of the highest completed preparation in that area. Preparations 1 to 12, 17, and 24 change the front room. Preparations 13 to 16 and 18 to 23 change the courtyard. The room opens on the area that the player chose last. A reveal moves the room to the area of its change. Without a stored choice, the room shows the area of the latest change.

An area switch in a corner of the room shows the other area. A locked area shows only its name and the preparation that opens it. A small "New" pin marks the latest change in the area. The pin shows the short name of the change, for example "New: lamps lit". The pin points at the edge of the change and does not cover the change. If the name does not fit, the pin says only "New".

To merge, the player taps an item and then a matching item. The player can also drag an item onto a matching item. A tap on an empty space moves the selected item there. A drag onto a different item swaps the two items. The item dialog names the neighbours whose tickets need the dish. If no ticket needs it, the dialog says "No quest on the counter needs it now." "Show me on the board" shows the next step to make the dish. "Find a match" in Mara's line shows a pair to merge.

One tap on a source takes one ingredient and selects the source. Each further tap takes another ingredient. A drag moves the source and takes nothing. If the board is full, the source takes nothing and Mara says why.

A dish leaves the board only when the player merges it or delivers it. If the board is full of dishes that cannot merge and that no quest needs, only a new game clears the board. The board-full notice says "The board is full. Merge a pair or deliver a quest."

The recipe book lists the six dishes of each chain. A new game discovers the items on its initial board. After that, only a take or a merge discovers a dish. A dish that the player has not discovered shows as a covered dish with the label "Not yet". A discovered dish shows its picture and its name and opens its item dialog. The first take or merge of a dish shows the notice "[Dish] is a new dish! It is in the recipe book now." A chain with six discovered dishes shows "Complete" in its heading. The recipe book button shows how many dishes the player has discovered. These marks give no reward.

A new game starts with eight blocked cells at the edge of the board. A blocker covers each of these cells. Each cell shows its blocked item through the open centre of the blocker. Four blockers use crate, sack, crock, or linen art, and four use twine. Webs cover the crate, sack, crock, and linen blockers until the preparation "Fix the broken window" is complete.

Every blocker has the same rule: merge a matching movable item into the blocked item. The blocker clears, and the next dish of the chain stays in that cell. The cell of the moved item becomes empty. A merge next to a blocker clears nothing.

A blocked item cannot move and cannot fill a quest. Clearing a blocker needs no free space. It is optional for campaign progress and for quests. A blocked cell is not a free space for any placement or space count. "Find a match" and "Show me on the board" can show any matching blocked item. A blocker does not add its item to the recipe book.

Each blocker has a small help mark. A tap selects the blocker. The name of the blocker and its clearing rule replace the item actions or the preparation offer under the board. The help names the exact matching item and marks the movable matches. To leave the help, tap the blocker again, select another item, use Clear selection, or press Escape. The help changes no game state. A selected matching item merges directly into the blocked space.

Each of the 24 preparation payments earns one authored batch of two or three new blockers. The batch describes the work that the player completed with that payment: repair supplies, courtyard leaves, planting supplies, recipe papers, menu packing, or supper supplies. The items of a batch come only from chains that the payment has opened. Each batch has one blocker with a contextual picture. The other blockers use familiar clutter art or an anchored item.

The same clearing rules apply. Payments earn batches, and quest deliveries do not. The final preparation also earns its batch. No batches arrive after the campaign.

A blocker takes an empty cell only. A new source from the payment takes its space first. Placement follows board order and keeps at least three usable cells empty. Blockers can touch each other.

At most three preparation blockers can be uncleared at the same time. This limit does not count the eight blockers of a new game. The other blockers wait in preparation order. A successful move, take, delivery, or payment tries placement again. A failed action places nothing.

A placement never replaces an item and never moves an item. A blocked cell can receive another blocker only after the earlier blocker is cleared and the cell is empty. Each blocker appears once. Its name and its explanation give its context. The label of the board gives the number of blockers that wait.

Each chain has one source. When preparation 12 is complete, all sources also give stage 2 items. When preparation 20 is complete, all sources also give stage 3 items. Lower outputs stay available. A selected source has one Take button for each earned output, with its picture and name.

A successful Take sets the output for later taps on that source. A new source starts with stage 1. An upgrade or a move keeps the chosen output. Sources cannot merge.

An upgrade needs no board space. Open quests keep their requirements and rewards. Before the payment, the interface does not name a future tier or a future output. It also does not name the preparation that upgrades a source. After the payment, the completion message of the preparation scene names each new output. A failed take changes no state and no chosen output. It does not show an output that the player has not earned.

The screen shows one Pay control at a time. If the story card is on the screen, only the story card has Pay. If Story is a sheet, Mara's line has Pay. Mara's line offers the next preparation by name with a Pay button.

Mara's line makes this offer if the player meets all the requirements and has not selected a board tile. If the player selects a tile, Mara's line shows the actions of that tile. While the story card is not on the screen, the Story button has a copper dot if the player can pay or if a scene waits. If the player cannot pay yet, Mara's line does not change. Pay in Mara's line works like Pay in Story.

After the player pays for a preparation, its preparation scene plays. When the scene ends, the reveal runs. The new painting replaces the old painting, and the pin marks the change. The drawer can move on a narrow screen that is taller than 600px. There, the drawer lowers for the reveal and then rises again. On a narrow screen that is 600px high or less, the drawer does not move, and the drawer body stays active during the reveal. [`DESIGN.md`](DESIGN.md) gives the order and the timing of the reveal. With reduced motion (defined in Access and persistence), the game shows the result immediately. The reveal does not spend coins and does not earn coins again.

Every preparation repaints one area. Miez, the bistro cat, sits on the windowsill of the front room. When the supper is ready, a second black cat sleeps on the counter. Captions describe every earned change.

Story has a Miez card. A tap on the card or on the cat on the windowsill changes the cat between sitting and sleeping. The change shows a short notice and plays a sound if sound is on. It does not change the save.

A bat crosses the dusk beyond the mended window of the front room after each preparation. It also crosses after every third delivered quest. It crosses only while the room shows the front room. It never crosses while the page is hidden, with reduced motion, before the player mends the window, or if the room painting failed to load.

Recurring deliveries count towards this motion only during the current tab visit. A reload, import, reset, or adopted save clears that temporary count.

A caption stays available if a painting cannot load. If a state has no accepted painting, the room shows the latest earlier painting of its area. It shows the caption of the new state. Authored lamps and lanterns light the room at story milestones.

The game has no time-of-day clock, no energy limit, no timers, no purchases, no ads, and no accounts.

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

The game has 75 generated Portable Network Graphics (PNG) masters. They provide these items:

- food
- a separate red wine picture for its menu item
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

A current save has game state version 12 in envelope version 11 at the key `scary-snacks-save-v11`. The game supports only this format. Load reads only this key. If no current save exists, the game starts a new campaign.

The optional `supperPayment` field has the value `true` when preparation 24 earns the supper quest. The supper then requires payment, and its completed quest ID records that payment. A current save with all preparations complete and no field retains its earned finale without another payment. Its waiting finale, saved line, journal replay, coins, and completed quests stay valid. A current save with unfinished preparations receives the field when preparation 24 is paid. This rule uses the current save format and does not convert earlier formats.

Saves in an earlier format stay unchanged. The game does not read them or convert them. Import rejects earlier formats. A new game uses the authored blocked layout. A save records the ID of the layout and the IDs of the cleared blockers. A layout ID must stay the same after release.

The optional preparation blocker record stores the baseline and, for each placed blocker, its ID and its cell. The baseline is the number of completed preparations when the record starts. The waiting blockers come from the paid batches after the baseline. A current save without this record starts the baseline before its next successful preparation payment. It gets no batch for an earlier payment.

A reload, an import, and a change from another tab keep the record. They do not place a blocker and do not repeat a blocker. If a preparation save fails, its payment, its batch, and its placements do not enter the session. If a save fails after a board action, the current session keeps the placement and the queue. Retry save and export include that session.

The state records the waiting scenes in a list. The list holds preparation scenes, quest completion scenes, chapter closing scenes, the finale, local news, and regular arrival scenes. Only earned scenes can enter the list. A preparation scene uses the ID of its preparation, and a quest completion scene uses the ID of its quest.

An arrival scene has the ID `arrival-` followed by the ID of its regular. Each scene ID is unique across preparations, quests, local news, chapters, the finale, and arrivals. Each ID occurs once in the list. Preparation scenes, closing scenes, and the finale keep one story order. Each closing scene follows the four preparation scenes of its chapter. Quest scenes, local news, and arrival scenes can wait at any position in the list.

The completed preparations decide which chapters are complete. The completed quests and their delivery order decide the local news. A scene ID must stay the same after release. If a save has no waiting entry for a scene, the game treats that scene as read.

The optional line record maps the ID of a waiting scene to the line that the player sees. The first line is line 0. The record holds only lines after the first line, and only for waiting scenes. When the player reads a scene, the game removes its line. A save without this record starts each waiting scene at its first line.

A line past the end of its scene is valid, because a line gives no reward. A reset clears the waiting scenes and their lines with the rest of the state. An import replaces them only after full validation and confirmation.

The state records the completed quest IDs in delivery order. Each ID occurs once. Each completed quest has its prerequisites earlier in the list. Every completed preparation has its necessary quests in the list. Saved finish choices name only unlocked finishes. Export and import include the quest progress and the board layout.

An explicit new game replaces only the current save, in one write. A normal save never replaces a current save that is not valid. Options then offers Retry saved game, and the game blocks changes until recovery.

In these cases, the game clears the new-dish marker of the recipe book. It also clears the delivery effects of the previous board:

- The game imports a save.
- The player resets the game.
- The game adopts the game of another tab.

If the browser offers locks on a secure origin, each game change uses one browser lock that all tabs share. Before a change, the game checks the latest saved state. If another tab has changed the state, the game shows that progress. It cancels the action that waits for the lock. The player can then make a new action on the updated board.

The game saves a preparation before its progress becomes active. The game also saves it before the story and the room change appear. If the write fails, the preparation does not spend coins, does not give progress, and does not show a reward. The player can try again if storage is available.

## Deployment

The game supports Chromium-based browsers (Chrome, Edge, and other browsers built on Chromium). The project does not test other browsers. The HyperText Markup Language (HTML) file has a Content Security Policy (CSP). The CSP and relative paths support static hosting.

The project publishes the game at https://satyrlord.github.io/scary-snacks/. [`DELIVERY.md`](DELIVERY.md) gives the Pages workflow.
