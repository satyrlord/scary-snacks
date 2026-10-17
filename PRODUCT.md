# Scary Snacks

<!-- impeccable:product-schema 1 -->

## Platform

web

## Purpose

Scary Snacks is an original single-player merge game in a fictional Transylvanian bistro. The user selected Scary Snacks, local foods and drinks, black cats, bats, and the style of everyday Romanian neighbours. The tone is cosy and slightly eerie.

## Users

The primary player wants relaxed, short merge-game sessions on a phone or desktop. The player returns to lasting progress in the bistro and its story.

## Positioning

The player restores a Transylvanian bistro through local foods, drinks, and character quests. Preparations visibly change the room. The neighbours and their requests connect the merge board to the story. The restored room is a lasting reward for that work.

## Operating Context

The player takes ingredients, merges dishes, delivers requests, and pays for preparations in a Chromium-based browser. Pointer, keyboard, and touch controls support phone and desktop play. The board and story progress stay in the browser save between visits. Export and import let the player transfer a supported save.

Quests have no deadline, and ingredient production is free and immediate. The player can read, skip, or return to story scenes under the rules in Play. The rules in Access and persistence control saves, recovery, and concurrent tabs.

## Evidence on Hand

- `public/data/game.json` contains the authored game content. `tools/create-original-data.ts` is its source.
- `public/assets/original/` contains the project-generated art. `docs/asset-provenance.json`, `docs/asset-prompts.json`, and `docs/asset-variants.json` record its source and processing.
- `docs/font-provenance.json` records the self-hosted fonts and their licences.
- `tests/` and `tests/browser/` contain automated checks. `docs/verification.md` gives their scope and limits.
- `docs/economy.md` gives the cost model, its sources, and the limits of the campaign balance checks.

These records support content and technical verification. They do not establish player-study results, adoption figures, or commercial performance. Such claims need their own evidence.

## Product Principles

- Respect the player's pace. Keep production immediate and requests free of deadlines.
- Make progress visible and lasting. Connect completed preparations to changes in the bistro and its story.
- Keep actions clear and consistent. Show the ingredient, the action it needs, and the result of the action.
- Protect saved progress. Validate changes and imports. Explain save failures with a recovery action.
- Keep the authored setting coherent. Preserve the local dishes, the neighbours, and the cosy, slightly eerie tone.

## Play

The board has six columns and seven rows. The requests are authored. The game has five ingredient sources (generators), 30 dishes and drinks, 22 characters, 81 quests, and 24 preparations over six chapters. Each dish or drink has an English name. If English has no name for the dish, the dish has the Romanian regional name with its diacritics. The initial layout, the prices, the progression, the characters, and the dialogue are new works.

Quests earn coins. Preparations unlock generators and story. Each preparation visibly changes the bistro.

Each food has an explicit menu price for its portion. Flour and cornmeal have a price of 2 coins each. Elderflowers have a price of 1 coin. Prepared dishes have higher prices according to their ingredients, work, and portion.

The menu value of a quest is the sum of the prices of its portions. Every quest pays its menu value. No chapter, character, or visit multiplies a reward. Quests are the only income.

Each preparation has a defined work scope, material and labour costs, and estimated active person-hours. Its coin cost is materials plus labour. It does not increase with its position in the story. The cost model uses roughly one coin per Romanian leu as a reference scale.

It models reuse of existing furniture and supplies. It abstracts running costs and keeps free production. The [economy record](docs/economy.md) gives the quantities, portions, primary sources, and assumptions.

Each quest opens after a preparation, or in a new game. A quest that opens after preparation N is necessary for preparation N + 1. Thus each preparation needs every quest that opens before it, and the player delivers every quest before the finale. Each preparation is paid by the quests that open before it.

The data check compares cumulative quest rewards with cumulative preparation costs. The rewards must cover the costs at each preparation. Thus a player who delivers every open quest always has the coins for the next preparation.

Story shows the coins and the quests delivered for the next preparation. Cost details shows the work and budget.

The engine checks coins, the necessary quests, and space for an unlocked source together. A failed check changes nothing. Payment spends coins once and advances one preparation. Unknown and cyclic quest prerequisites are invalid. The quests are in the order in which they open, and every quest opens before the last preparation.

Three quest tickets sit on the counter. The first three open quests, in authored order, take the tickets. Other open quests wait without a ticket, and the next one takes the first ticket that is free. Each character has at most one open quest, because each quest waits for the earlier quests of its character.

A ticket shows the character portrait and name, the dishes, and Deliver with its reward. Each dish that needs several portions shows its count on the board. Deliver is available when the board holds every portion. A tap on the dishes opens the request.

The request shows who asks and why, each dish with its board count, the reward, and Deliver. Each dish row opens its item help. Deliver takes all required portions from the board in one change. A missing item, a quest without a ticket, a stale request, a repeated delivery, or an overflowing reward changes nothing.

The dishes fly to the ticket. A temporary notice reports the delivery and reward. The next quest takes the ticket. The completion scene stays waiting in Story. There is no deadline. The four core characters have quest arcs across the six chapters.

Mara, Ilie, and Sorin have six quests each, and Eszter has eight. Dochia and Costel have five quests each. Victor, Ana, Sânziana, Dorian, Ileana, and Cezar have four. Cătălina and Bran have three. Vlad and Elisabeta have two quests each.

Adrian, Monica, and Janos are occasional travelling visitors. Each has three supply quests. Their nine visits alternate in that order. They open after preparations 6, 8, 9, 13, 14, 17, 19, 21, and 22.

Each visit also needs the previous visitor delivery, so only one cathedral supply request is open at a time. There is no timer or expiry. The visitors do not join the community supper scene.

Cathedral supply requests concern several days of supplies for a quiet investigation near the cathedral. A request needs 12 to 16 portions at merge stages 3 or 4, or 4 to 6 portions at stages 5 or 6. The journal has each visitor introduction and each completed request.

Ionatan is a foreign real estate agent who visits once per save. His request opens after preparation 9 and Vlad's quest "A guest at the castle". It needs one goulash pot, one sharing board, one chimney cake, and one plum brandy. He stops for dinner on his way to a nearby castle.

There, he plans to close a property deal with a local noble. The dinner pays its menu value of 220 coins. His request is independent of the cathedral supply sequence and can be open beside it. It has no deadline.

He never joins the finale.

Delivery records his quest ID once and ends his visit. His farewell scene waits in Story. Reload and export/import preserve his departure. A new game permits a new visit.

The neighbourhood has 16 neighbours besides the travellers: the four core characters and 12 regulars. Each regular has a name, a trade, a portrait, an introduction, and two favourite chains. Each quest of a regular asks for at least one dish from those chains. Each regular refers to a horror novel, a horror film, or local folklore in the name, the trade, or one habit.

Dochia, Victor, Ana, and Costel are present from the start. Sânziana and Dorian arrive with preparation 4. Vlad, Elisabeta, Ileana, and Cezar arrive with preparation 8, and their arrival scenes play in that order. Cătălina and Bran arrive with preparation 12.

Arrival comes only from completed preparations. Each later arrival has a short scene: a core character introduces the regular, and the regular answers. The payment that brings a regular queues the arrival scene after the preparation scene, the chapter scene, and the finale that it earns.

The arrival scene follows the waiting-scene rules of the story.

Vlad is a local baron who styles himself as a count and lives in a countryside castle. Elisabeta is an Austro-Hungarian countess who sometimes visits her land nearby. They like the warm kitchen and the drinks counter, and their quests ask for cabbage rolls, goulash, and red wine. Red wine uses the stable item ID `drinks_5` and costs 35 coins per small carafe. They do not join the community supper scene.

Mina and Doctor Avram share one visit per save. Mina is a young British middle-class woman in Victorian dress. She seeks her fiancé Ionatan, who came to sign a property contract and stopped writing. Avram is a Hungarian Jewish doctor who travels with her.

Their visit opens after Ionatan's dinner is delivered and after preparation 10. Mina and Avram arrive and leave together. They never join the finale, and they cannot meet Ionatan at the bistro.

Their shared request is a vegetarian meal for two: two zacuscă toasts, two roasted vegetable plates, one smoked cheese plate, and two fruit teas. It permits eggs and dairy, and contains no meat or fish. The meal pays its menu value of 168 coins. Delivery ends the visit and sends them to find Ionatan.

The third delivery after it earns local news: they found him gravely ill, and all three left for Britain. They do not visit the bistro on the return journey. The news uses only local speakers and gives no reward. It can be read later in the journal.

The story journal holds optional introductions for the neighbours and the three recurring travellers, plus the opening and completion scenes of finished quests. Its neighbours list shows the core characters, then the regulars in order of arrival. Each arrived neighbour shows the portrait, the name, the trade, the favourite chains, and the count of delivered quests. A neighbour who has not arrived is a "Not yet" outline without a name or a portrait.

A waiting arrival scene opens from the entry of its regular. After the scene, the entry opens the introduction. Ionatan, Mina, and Avram have introductions only while their request is open. Their completed requests have no journal replay.

Local news about the search becomes available after its delivery gate. Reading, skipping, and replaying a scene give no reward.

Delivery queues the completion scene in the same change. A temporary notice reports the delivery without opening the scene or blocking play. Read now opens the waiting scene from Story. Recurring characters also have a Read completion entry in the journal. Finish and Skip mark the scene as read.

Close and Escape leave the scene waiting. The completion stays recorded, and the journal can replay the scenes of recurring characters. A failed quest save keeps the current session. The delivery notice includes the unsaved warning, and Options offers Retry save. Export includes that session.

Reload restores only durable progress.

The campaign has six chapters with four preparations each. Story shows the title and the objective of the current chapter. It also shows one step for each preparation of the chapter: done, now, or not yet. A chapter opens at its first preparation and needs no separate payment. Its closing scene stays hidden until the chapter is complete. Each chapter names one quest of a core character that opens during the chapter.

Each payment queues the scene of its preparation. The payment for the last preparation of a chapter also records the chapter as complete and queues its closing scene, in one change. After preparation 24, the finale waits after the closing scene of chapter 6. One payment queues its scenes in this order: the preparation scene, the closing scene, and then the finale.

The game records the finale once. A failed payment queues nothing. The preparation scene opens at once, and its last line leads to the reveal. Skip scene moves the preparation scene to the journal and starts the reveal.

Close and Escape start the reveal and leave the scene waiting. After the reveal, the next scene that the payment earned opens. If the player opens another dialog first, the scene waits. Finish or Skip moves a scene to the journal and opens the next waiting scene.

Close and Escape leave the scene waiting. Story shows the first waiting scene with Read now. After a reload, Mara's line says that a scene is waiting. A preparation scene that resumes after its reveal ends with the usual end label, not with "See what changed".

The next preparation and all tickets stay available while a scene waits. Reading, skipping, and replaying give no coins or items. If a saved scene has no content, the game shows a recoverable error and keeps the progress. It does not invent story text.

Each waiting scene keeps the line that the player sees. Back and Continue save the line. Read now and a "New scene" journal entry resume the scene at that line. If the player opens a different waiting scene, the line of the first scene stays.

A replay of a read scene starts at the first line, keeps its position only in the dialog, and changes nothing in the save. If a saved line is past the last line, the scene starts at the first line. The notice says "Someone lost the thread. The conversation starts again from the beginning." If a line save fails, the scene shows an unsaved-session warning.

The warning appears once per scene. The player can continue to read.

The journal lists each chapter that is open or complete. A running chapter shows its opening context, its goal, its neighbour help when that quest is open, and the state of each preparation. A complete chapter shows its payoff, its neighbour help, its preparations with the name of each room change, and its closing scene. After the supper, the journal also holds the finale.

The finale names the result of each chapter, and all four neighbours speak. It ends with a return to the kitchen. No requests remain after the supper. The board and the recipe book stay available.

The room is the home of the game and its reward. On phones, the kitchen is a drawer over the room. On wider screens, the kitchen is a panel beside the room. The room shows one painted area of the bistro, as the completed preparations leave it:

- The front room starts unfinished, with cobwebs and a few small spiders in the broken window. The preparation "Fix the broken window" clears them. One resident spider stays under the upper wall shelf permanently.
- The courtyard opens with the preparation "Clear the courtyard" in chapter 4.

Each area has one painting for each of its states. The room shows the state of the highest completed preparation in that area. The room shows the area of the latest change. Preparations 13 to 16 and 18 to 23 show the courtyard.

Preparations 17 and 24 return to the front room. An area switch in the corner of the room shows the other area. A locked area shows only its name and the preparation that opens it. A small "New" pin marks the latest change in the area.

The pin gives the short name of the change, for example "New: lamps lit". The pin points at the edge of the change and does not cover the change. If the name does not fit, the pin says only "New".

To merge, the player taps an item and then a matching item, or drags an item onto a matching item. A tap on an empty space moves the selected item there. A drag onto a different item swaps the two items. A tap on the dishes of a ticket opens the request, and each dish there opens its item dialog. "Show me on the board" shows the next step to make the dish. "Find a match" in Mara's line shows a pair to merge.

One tap on an ingredient source takes one ingredient and selects the source. Each further tap takes another ingredient. A drag moves the source and takes nothing. If the board is full, the source takes nothing and Mara says why.

A dish leaves the board only when the player merges it or delivers it. The game has no sale and no other way to remove a dish. A board full of dishes that cannot merge and that no request needs stays full; only a new game clears it.

A new game starts the guide. The guide has five steps: Merge, Take, Deliver, Prepare, and Read and return. While the guide runs, Mara's line shows the current step and Skip guide. They replace the last message and Find a match. The status line still announces each message.

Each step ends with one kind of successful action: a merge, a take from a source, a delivery, a preparation payment, and a scene that the player finishes or skips. The guide records these actions in any order and then shows the first step that is not done. A failed action, a move, a swap, a hover, or an animation records no step. When the current step is done, the selection clears, so that Mara's line shows the next step.

The guide finds its targets on the current board, not in fixed cells. Merge marks the pair of the lowest stage, or else a match for a blocked ingredient, or else a source. Take marks a source. Deliver marks one ticket: a request that the board can fill, or else the request with the most of its dishes on the board. Prepare names the coins, quests, and space that the next preparation still needs, and marks Pay when the preparation is ready. Read and return marks Read now.

On a full board, the guide tells the player to merge or deliver. The guide never adds, removes, moves, or reorders items or quests. It gives no coins and unlocks nothing. Story scenes open as usual and take precedence, because the guide is not a dialog.

Skip guide closes the guide and changes nothing else. After the last step, the guide is complete, and Mara's line names the further help in Options.

Options has a Guide section that opens the kitchen guide. The kitchen guide explains the five steps and marks the steps that the current run has done. It also explains room on the board, the recipe book, Find a match, and blocked spaces. Reading the page changes nothing. Its button skips an active guide, resumes a closed guide at its step, or starts a new run on the current board. A new run starts after a complete run or in a save without a run.

A new game starts with eight blocked edge cells on the six-by-seven board. Each cell shows its ingredient through the open center of its blocker. Four blockers use crate, sack, crock, or linen art, and four use twine. Webs cover the first four until "Fix the broken window" is complete.

Every blocker has the same rule: merge a matching movable ingredient into the blocked ingredient. The blocker clears and the normal successor stays in that cell. The source cell becomes empty. A merge beside a blocker clears nothing.

A blocked ingredient cannot move or fill a quest. Clearing needs no free space and is optional for campaign progress and quests. A blocked cell is not a free space for any placement or space count. The board hint can point to any matching blocked ingredient.

Each blocker has a small help mark. A tap selects the blocker. Its name and clearing rule replace the item actions or preparation offer under the board. The help names the exact matching ingredient and marks movable matches.

The tile label gives the meaning of each marked space. Tap the blocker again, select another item, use Clear selection, or press Escape to leave the help. Help changes no game state. A matching selected ingredient merges directly into the blocked space.

Each of the 24 preparation payments earns one authored batch of two or three new blockers. The batch describes the work just completed: repair supplies, courtyard leaves, planting supplies, recipe papers, menu packing, or supper supplies. Its ingredients come only from chains that the payment has opened. Each batch mixes a contextual picture with familiar clutter or an anchored ingredient.

The existing clearing rules apply. Payments, not quest deliveries, earn batches. The final preparation also earns its batch. No further batches arrive after the campaign.

Blockers use empty cells only. A new source from the payment takes its space first. Placement follows board order and keeps at least three usable cells empty. Blockers can share sides.

At most three preparation blockers can be unresolved at once, in addition to the initial obstacles. The remaining blockers wait in preparation order. A successful move, take, quest delivery, or payment tries placement again. A failed action places nothing.

No placement replaces or moves an item. A blocked cell can receive another blocker only after its earlier obstacle is resolved and the cell is empty. Each blocker appears once. Its name and explanation give its context.

The board label gives the waiting count.

Each chain keeps one source. All sources gain stage-two output when preparation 12 completes and stage-three output when preparation 20 completes. Lower outputs stay available. The selected source has one Take button for each earned output, with its picture and name.

A successful Take sets the output for later taps on that source. A new source starts with stage one. An upgrade or a move keeps the chosen output. Production is free and immediate.

Sources cannot merge.

An upgrade uses no board space. Open quests keep their requirements and rewards. Before payment, the interface names no future tier, output, or upgrade preparation. After payment, the story completion message names each new output. A failed take changes no state or chosen output and does not reveal an unearned output.

The screen shows one Pay control at a time. If the story card is on the screen, only the story card has Pay. If the story is in a sheet, Mara's line has Pay. Mara's line offers the next preparation by name with a Pay button.

Mara's line does this if all requirements are met and the player has not selected a tile. If the player selects a tile, Mara's line shows the actions of that tile. While the offer shows, the Story button has a copper dot. If the player cannot pay yet, Mara's line does not change.

Pay in Mara's line works like Pay in the story.

After the player pays for a preparation, its story plays. When the story ends, the drawer lowers on phones. Next, the new painting fades in over the old painting. Next, the pin marks the change.

Last, the drawer rises again on phones. If the browser requests reduced motion, the game shows the result at once. The reveal does not spend coins and does not earn coins a second time.

Every preparation repaints one room. Miez sits on the windowsill of the front room. When the supper is ready, a second black cat sleeps on the counter. Captions describe every earned change.

Captions stay available if a painting cannot load. If a later state has no accepted painting, the room shows the latest earlier painting of its area. The room then shows the caption of the new state. Authored lamps and lanterns light the room at story milestones.

The game has no time-of-day clock.

The game has unlimited energy. The game has no timers, no purchases, no ads, and no accounts.

Three quests offer a second finish for a detail of the bistro. Eszter's "A second glaze" opens after preparation 9 and offers Green bowls for the shelf tableware (Blue bowls). Ileana's "A blue table cloth" opens after preparation 22 and offers Blue embroidery for the courtyard table cloth (Red embroidery). Sânziana's "Lilacs for the dresser" opens after preparation 23 and offers Lilacs for the final dresser flowers (Wildflowers). The existing paintings supply the defaults. The detail shows in the room after its preparation: 9, 22, and 24.

When a detail is in the room and its quest is delivered, a switch with a small badge sits on the detail in the room. A tap on the switch changes to the other finish. The change applies only after the save succeeds. A failed write keeps the prior finish and says so.

The player can switch again at any time. Finishes do not change progress or rewards. The switch shows only in the area that the room shows. It accepts input only when its painting has loaded and at least 44px by 44px of its target is visible above the drawer.

Lower the drawer to reach a detail outside the current crop. The completion line of each finish quest says where the switch is.

## Feature specifications

The repository-only backlog at `docs/specs/README.md` records 14 feature specifications, their status, the product limits, and the product direction.
This document owns the implemented behavior.
The repository-only art plan, `docs/specs/001-room-states-art-plan.md`, defines the 25 painted room states.

## Identity

The game has 40 generated Portable Network Graphics (PNG) masters. They provide these items:

- food
- a separate red wine picture for its menu item
- portraits, including three atlases for the regulars
- 25 painted room states
- two decoration edit paintings, sampled only within their authored regions
- the timber tabletop
- the embroidered runner
- cat sprites and bat sprites
- board clutter, with a web overlay and a twine overlay
- 12 contextual preparation clutter pictures

[`DELIVERY.md`](DELIVERY.md) gives the shipped image variants and the fonts.

The user selected the title. A preliminary name search is not trademark clearance. The project gives no guarantee against intellectual-property claims.

## Access and persistence

The game supports pointer, keyboard, and touch controls. The game supports Light, Dark, and System appearance, visible focus, and reduced motion. Forced colours (Windows high contrast) keep the spaces and the selection visible.

The browser stores the saves, the theme preferences, and the area that the player chose with the area switch. The area is a display preference. The area is not part of the save. The next reveal moves the room to the area of the change.

If the browser blocks storage, the game is playable for the current visit only. Options and each change say that the game is not saved. Preparations and finish switches need a successful save, so they do not complete.

If the game is open in two tabs, each tab follows the latest save. A tab does not overwrite the latest save with an older board. When a tab follows the latest save, an open dialog or a drag in that tab ends.

If the game data cannot load or does not pass its checks, the kitchen says so and offers Try again. The kitchen also disables the Story, Recipes, and Options buttons. The game does not read or write the save in that case.

An import validates the envelope and the state of the save. An import rejects malformed saved data and keeps the current save. An import enforces a size limit. Load, save, import, and reset use only the save keys of this game. They do not change other browser data.

Current saves use game state version 12 in envelope version 11 at `scary-snacks-save-v11`. Only this format is supported. Load reads only this key. With no current save, the game starts a new campaign.

Earlier local saves stay unchanged and are not read or converted. Import rejects earlier formats. New games use the authored blocked layout. Saves record its layout ID and resolved obstacle IDs.

A layout ID must remain stable after release.

The optional preparation obstacle record stores the completed-preparation baseline and each placed blocker ID and cell. Waiting blockers come from the paid batches after that baseline. A current save without this record starts the baseline before its next successful preparation payment. It receives no batch for an earlier payment.

Reload, import, and changes from another tab preserve the record and do not place or repeat blockers. If a preparation save fails, its payment, batch, and placements do not enter the session. A failed save after a board action keeps the placement and queue in the current session. Retry save and export include that session.

The state records waiting scenes. The list holds preparation scenes, quest completion scenes, chapter closing scenes, the finale, local news, and regular arrival scenes. Only earned scenes can enter the list. A preparation scene uses the ID of its preparation, and a quest completion scene uses the ID of its quest.

An arrival scene uses the ID `arrival-` and the ID of its regular. Each scene ID is unique across preparations, quests, local news, chapters, the finale, and arrivals, and occurs once in the list. Preparation scenes, chapter scenes, and the finale keep one story order: each chapter scene follows the four preparations of its chapter. Quest scenes, local news, and arrival scenes can wait at any position.

Completed preparations determine chapter completion. Completed quests and their delivery order determine local news. Scene IDs must remain stable after release. A save without a waiting entry for a scene treats that scene as read.

The optional line record maps a waiting scene ID to the zero-based line that the player sees. It holds only lines after the first line, and only for waiting scenes. Reading a scene removes its line. A save without this record starts each waiting scene at its first line.

A line past the end of its scene stays valid, because a line gives no reward. Reset clears the waiting scenes and their lines with the rest of the state. Import replaces them only after full validation and confirmation.

The optional guide record stores the guide status (active, dismissed, or complete), the current step, and one boolean for each step. The current step is the first step that is not done. A complete run has every step done. A save without this record has no guide run.

Load and import reject a record with an unknown status or step, a missing or extra field, or a step that does not agree with the booleans. The record stores no board cell or interface target, and it gives no resource. A failed write keeps the unsaved warning, and a reload repeats the last saved step.

The state records the unique completed quest IDs in delivery order. Each completed quest has its prerequisites earlier in the list, and every completed preparation has its necessary quests in the list. Saved finish choices name only unlocked finishes. Export and import include quest progress and the board layout.

An explicit new game replaces only the current save, in one write. Invalid current saves remain unchanged. Options offers Retry saved game and blocks game changes until recovery.

The game clears the discovery notification and the delivery effects of the previous board in these cases:

- The game imports a save.
- The player resets the game.
- The game adopts the game of another tab.

On supported secure origins, each game change uses one browser lock that all tabs share. Before a change, the game checks the latest saved state. If another tab has changed the state, the game shows that progress and cancels the waiting action. The player can then make a new action on the updated board.

The game saves a preparation before the progress of the preparation becomes active. The game also saves a preparation before the story and the scene change appear. If the write fails, the preparation does not spend coins, does not grant progress, and does not show a reward. The player can retry if storage is available.

## Deployment

The game supports Chromium-based browsers (Chrome, Edge, and other browsers built on Chromium). The project does not test other browsers. Relative paths and the Content Security Policy (CSP) in the HTML support static hosting.

The project publishes the game at https://satyrlord.github.io/scary-snacks/. [`DELIVERY.md`](DELIVERY.md) gives the Pages workflow.
