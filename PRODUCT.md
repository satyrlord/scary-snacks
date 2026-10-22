# Scary Snacks

<!-- impeccable:product-schema 1 -->

## Platform

web

## Purpose

Scary Snacks is an original single-player merge game in a fictional Transylvanian bistro. The owner chose the title Scary Snacks. The owner also chose local foods and drinks, black cats, bats, and the style of everyday Romanian neighbours. The tone is cosy and slightly eerie.

## Users

The primary player wants short, relaxed sessions of a merge game on a phone or a desktop. The player returns to permanent progress in the bistro and its story.

## Positioning

The player restores a Transylvanian bistro through local foods, drinks, and character quests. Each preparation is a paid job that visibly changes the room. The neighbours and their quests connect the merge board to the story. The restored room is a permanent reward for that work.

This campaign is act 1 of a larger game. The owner plans to extend the game after act 1.

## Operating Context

The player takes ingredients, merges dishes, delivers quests, and pays for preparations in a Chromium-based browser. Pointer, keyboard, and touch input support play on a phone and on a desktop. The board and the story progress stay in the browser save between visits. Export and import let the player move a supported save.

Quests have no deadline. A take is immediate. A take from a paid source costs coins, and herbs are free. The bistro day counts merges, never seconds. The days follow a calendar with fixed dates. Nothing changes while the game is not open. The player can read or replay story scenes under the rules in Play. The rules in Access and persistence apply to saves, recovery, and the use of more than one tab.

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

- 14 chains of four to six dishes each, which are 69 dishes and drinks. Two of the chains are seasonal.
- 28 mixed dishes, each cooked from dishes of two or three chains
- 14 ingredient sources (generators), one for each chain
- 23 characters
- 111 quests: 88 campaign quests of act 1, five March quests, nine quests of later acts, one supper quest, one recovery quest, and seven repeating quests
- 24 preparations in six chapters
- a calendar of 76 days, from Saturday 15 February to Thursday 1 May

In this document, "dish" also means a drink. An ingredient is a dish that a source gives. Each dish has an English name. If English has no name for the dish, the dish has its Romanian regional name with diacritics. The initial layout, the prices, the progression, the characters, and the dialogue are new works.

A quest is an authored task that a character gives to the player.

A campaign quest earns coins. Some preparations unlock a source. Each preparation unlocks story scenes and visibly changes the bistro.

Each chain follows one staple food family. Its source gives the stage-1 ingredient, and its dishes use only foods of that family. Three chains are open in a new game: Grain, Corn, and Herbs. Preparations 3, 5, 6, 7, and 8 open Dairy, Poultry, Vegetables, Fruits, and Pork. Preparations 11, 12, 13, and 16 open Beans, Fish, Lamb, and Veal. The scene of each of these preparations names its new source. The two seasonal chains, Preserved vegetables and Spring greens, open with their season. "Seasons and holidays" gives their rules. A mixed dish opens when each of its chains is open.

The economy has four levers:

- the take cost (1 coin)
- the blocker coin (1 coin)
- the work rate (2 coins)
- the recovery floor (10 coins)

A take from a paid source spends the take cost. A take from the Herb basket or from a seasonal source is free. Each cleared blocker gives the blocker coin. A formula gives the menu price of each dish. The price has two parts. The first part is the number of ingredients in the dish times the take cost. The second part is the number of merges in the dish times the work rate. An ingredient of a free source counts as zero. For example, Flour costs 1 coin, Elderflowers cost nothing, Linden tea costs 14 coins, and Bulz costs 46 coins.

The menu value of a quest is the sum of the prices of its portions. Every quest except the supper pays its menu value. So a delivery pays back its ingredients and earns the work rate for each merge. Quests and cleared blockers are the only income.

Each preparation has a work scope, a material cost, a labour cost, and an estimate of active person-hours. Its coin cost is the material cost plus the labour cost. The cost does not rise with the position of the preparation in the story. As a reference scale, the cost model uses one coin for about one Romanian leu. The model includes reuse of the furniture and supplies that the bistro has. The model does not include running costs. The [economy record](docs/economy.md) gives the quantities, the portions, the primary references, and the assumptions.

A campaign quest opens after a named preparation, or in a new game. A campaign quest that opens after preparation N is necessary for preparation N + 1. Each preparation needs every campaign quest that opens before it. The player delivers all 88 campaign quests of act 1 before the supper quest. A campaign quest can also have an opening date: "Calendar" gives its rules. The five quests of Dochia are March quests, and no preparation needs them. The nine quests of later acts stay in the game data with their act, and act 1 never opens them. A quest of a later act or a March quest is not an earlier quest of its character for a quest of act 1, and the quest-value check of the preparations does not count it.

A quest asks only for dishes that the player can place. When a quest gets its ticket, the player surely knows a set of dishes. Each dish of the quest is one merge beyond that set. Its parts, or the dish one stage below it, are in the recipe book. Otherwise, its source is on the board. The player surely knows the dishes of a new game. The player also surely knows the dishes of each quest that surely had a ticket before. A March quest and a quest of a later act do not count for this rule. When a quest gets a ticket, its dishes enter the recipe book. The data check enforces this rule for every quest of act 1, including the supper.

A quest is one meal at one sitting. It has at most three portions for each eater and at most two portions of one dish. A shared quest counts each of its characters: the character of the quest and each companion who shares the meal. Only the characters who order provisions ask for more. Adrian, Monica, and Janos pack food for days under the cathedral. Dochia packs food for her days on the hill. Sânziana buys food for her sisters. The supper has one plate for each guest. The data check enforces these limits.

The supper quest is Mara's last quest, "The community supper". It opens after preparation 24. It asks for one plate for each of the 11 guests. The guests are Mara, Ilie, Eszter, Sorin, Costel, Victor, Ana, Ileana, Bran, Cătălina, and Cezar. Each plate suits the diet of its guest. Each regular gets a favourite dish. The plates use the 12 chains that are open all year. The supper is in the courtyard on 1 May: "Calendar" gives its time. The quest pays nothing. Its ticket and its dialog show Serve, and its dialog names the guest of each plate. Serve removes the plates once and records the quest. Serve also queues the finale in place of a completion scene. The finale opens immediately.

The recovery quest is Ana's "Tea for the night ward". It asks for one Linden tea and pays its menu value. It is open in two cases:

- Another quest is open, and the purse holds less than the recovery floor.
- No other quest is open, and the purse cannot pay for the next preparation.

The supper quest counts as another quest, so the purse can pay for the ingredients of the supper. The recovery quest has its own ticket after the three quest tickets. So the recovery quest never moves a quest to waiting. A delivery pays the reward, records nothing, and queues no scene. The quest closes when neither case is true. The quest opens again each time a case becomes true. The quest is outside the order of Ana's quests. Its dialog says "Ana returns while the purse runs low. Herbs from the Herb basket are free." So a player who spends coins on extra food can always continue. The herbs are free, and blocker placement keeps room for the tea. One tea puts an empty purse above the recovery floor. In a new game, two Socată are next to the Herb basket. So on the first day, the player can make the tea with one merge.

The repeating quests give the bistro work when it has no other work. A quest has work if the player can act on it on the current day. Each open campaign quest, the supper quest, and an open recovery quest have work. A booked quest for another evening is different: the player can cook its meal now but cannot deliver it. So the booked meals for later evenings have work only while a portion is missing. The board must hold the portions of all of them together. The bistro has no work if no open quest has work and the next preparation is not ready to pay.

Seven repeating quests take turns in this order:

- Sorin's "Staff meal", for Sorin and Mara: 2 Loaf and 2 Socată.
- Bela's "Another cold night": 1 Mămăligă and 1 Linden tea. It joins the cycle after the delivery of "A warm cup at the gate".
- Cezar's "Before the rounds": 1 Bean soup and 1 Loaf. It joins the cycle after the delivery of "Lights on the hill".
- Ana's "Pickles for the night shift": 1 Pogăcele and 1 Mixed pickles. It joins the cycle after the delivery of "Mittens for the ward", while the pickle barrel is on the board.
- Ilie's "A plain bowl": 1 Green beans, 1 Mămăligă, and 1 Socată. It joins the cycle after the delivery of "The cellar shelves", only during Lent.
- Victor's "Nettles for the nerves": 1 Nettle soup, 1 Loaf, and 1 Linden tea. It joins the cycle after the delivery of "The thesis supper", while the forage basket is on the board.
- Costel's "Tea for the tower": 1 Papanași and 2 Socată. It joins the cycle after the delivery of "Time for something sweet".

A repeating quest with a season joins the cycle only in its season. An open repeating quest stays open after its season until its delivery.

If the bistro has no work, the next repeating quest that can join the cycle opens in the same change. The next quest comes after the last delivered repeating quest. A repeating quest stays open until its delivery. A campaign quest gets a ticket before a repeating quest, so a repeating quest can wait without a ticket. A repeating quest pays its menu value, records nothing, queues no scene, and has no journal entry. No preparation needs a repeating quest. Its dialog shows one opening line, which does not introduce the character again. The two cases of the recovery quest do not count the repeating quests. After the supper, the bistro has no other work, so the repeating quests continue. The data check limits each repeating quest to 15 merges and one meal for each eater. At least three repeating quests exist, and one can join the cycle in a new game.

The data check adds the work value of the quests that open before each preparation. The work value is the merges of their dishes times the work rate. The check also adds the costs of the preparations up to that preparation. The work value must cover the costs. Consider a player who delivers every open quest and pays only for its ingredients. That player always has the coins for the next preparation. The coins that remain after the last preparation must pay for the ingredients of the supper. Only the supper quest opens after the last preparation. The data has exactly one supper quest and one recovery quest. The data check also counts the merges of each quest: each meal fits in one weekday. Provisions and the supper can take more than one day.

The campaign balance test plays the campaign with 20 fixed seeds. An efficient strategy cooks only for quests and lights the lanterns for each booking. It delivers the repeating quests when the bistro has no other work. For each seed, the efficient strategy has these results:

- The purse never goes below zero.
- Each payment comes on or after the opening date of its chapter. Preparation 24 comes before the closing of 30 April, so no day holds.
- The supper is served on 1 May.
- The purse pays the upkeep 75 times. A rat comes on each of the 11 Sunday nights.
- The repeating quests use at most 20% of the merges of act 1. No three days in a row have work only from repeating quests.
- Each holiday quest is delivered on its holiday, and each March quest in March. An outdoor quest never waits more than two rain days.
- After the supper, the purse holds 0 to 20% of the total cost of preparations, takes, and upkeep.

A strategy that misses each booking once also pays preparation 24 before the closing of 30 April. Another strategy starts each preparation window with a debt of 20 coins. That strategy gets to each preparation through the recovery quest, and it can use the hold of 30 April.

Story is a card on a wide screen and a sheet on a narrow screen. A narrow screen is 1023px wide or less. Story shows the current chapter and the next preparation. Its list of requirements shows only the coins, the quests, the source cell, and the opening date that the player still needs. Before the opening date of its chapter, the first preparation of a chapter shows the date, for example "Opens on Thursday 27 February." When the player meets all the requirements, one line says "Ready to prepare." Cost details expands below Pay inside Story. Cost details shows the work, the budget, and the exact current and required totals. The player can pay while the details are open. If the player opens or closes the details, no game state changes.

The story journal (the journal) is a dialog that Story opens.

The game checks the coins, the necessary quests, the free cell for an unlocked source, and the opening date of the chapter at the same time. A failed check changes nothing. A payment spends the coins once and completes one preparation. A quest prerequisite that is unknown or cyclic is not valid. The authored quests are in the order in which they open. Every campaign quest opens before the last preparation.

Three quest tickets are on the counter. The first three open quests, in authored order, get the tickets. The other open quests wait without a ticket. The next open quest gets the first free ticket. A character has at most one open campaign quest, because each quest waits for the earlier quests of its character. An open repeating quest gets a ticket after the campaign quests. Among the quests that open after the same preparation, a dated quest comes first, a March quest comes after the other quests, and the quest of a booked guest comes last. So a holiday quest gets its ticket before its holiday. So the quests before the evening put the dishes of the dinner in the recipe book. While the recovery quest is open, it has a fourth ticket with a dashed edge.

A ticket shows the portrait and the name of the character and the dishes. The ticket face is the portrait, the name, the title, and the dishes. A tap on the face opens the quest dialog. A ticket with more than four dishes shows the first three and the count of the others. On a wider screen, the ticket also shows the quest title and Deliver with its reward. A phone ticket has one target: its face. The phone player delivers, serves the supper, and lights the lanterns in the quest dialog. The quest dialog and the accessible name of the ticket face give the board count of each dish. On phones, each shown dish has its board count and required quantity. On a wider screen, a dish that needs more than one portion has that count. Deliver is available when the board holds every portion. The label of the ticket section is "Neighbour quests".

The quest dialog shows who asks and why. It also shows each dish with its board count, the reward, and Deliver. If more than one character speaks, the name of the speaker starts each change of speaker. The dish rows give the exact dishes, so the dialogue does not list them. Each dish row opens the item dialog of its dish. If a portion is missing, its row also has a Find button. Find closes the dialog and marks the next board step for another portion. A row with enough portions has no Find button. Deliver removes all the required portions from the board in one change. A delivery changes nothing in these cases:

- An item is missing.
- The quest has no ticket.
- The quest is out of date.
- The player repeats the delivery.
- The purse cannot hold the reward.
- The quest is a booked quest, and the time is not from 20:00 on the evening of its guest.
- The quest is a holiday quest, and its holiday has not come.
- The quest is an outdoor quest, and the day is not a terrace day.
- The quest is the supper, and the time is not from 20:00 on 1 May.

Character introductions, quest dialogs, quest completion scenes, and quest replays use parchment pages. All 23 characters have individual pencil sketches. A quest shows the sketch of its character. Mara has a second sketch at the stove, which shows for her cooking quests. The nine supply quests, Ionatan's dinner, Mina and Avram's meal, Mara's baskets for the Easter blessing, Mara's chimney sweep, Mara's Easter of the Blajini, Bela's snowman, and Costel's icicle clock are exceptions: they show their own scene illustrations. The illustration stays with the quest through speaker changes and journal replays. Introductions show the individual character sketch. Other story scenes keep their usual presentation. Victor draws these sketches while he waits for his meal. He is an anatomy student, and he studies anatomy, proportions, and perspective. He draws light but clear facial features. Awake people have open eyes, and sleepers have closed eyelids. He is secretly in love with Mara, so he draws her face with the most care.

The dishes fly to the ticket. A temporary notice reports the delivery and the reward. While the completion scene is unread, the notice also offers "Read [Name]’s reply", which opens that scene. The next open quest gets the ticket. If no quest is open, the counter shows "No quests wait now. Pay for the next preparation." After the supper, the repeating quests keep a ticket on the counter.

An unread scene is a scene that the player has not read.

The four core characters are Mara, Ilie, Eszter, and Sorin. Their quests continue through the six chapters. Each of their campaign quests has at least two turns at its opening and at its completion. Each of these quests gives its character a want, a small complication, and a change at the end. Mara worries as a host. Ilie keeps the habits of his family. Eszter is proud of her craft. Sorin tells what he sees on his round.

In act 1, Mara and Eszter have ten campaign quests each, and Ilie and Sorin have eight each. Mara also has the supper quest, and Ana has the recovery quest. These two quests have no completion scene. Costel has seven quests. Dochia has five March quests. Victor and Dorian have five quests each. Ana and Ileana have four quests each. Sânziana, Cezar, Cătălina, and Bran have three quests each. Bela, Vlad, and Elisabeta have two quests each.

A visitor is a character who does not live in the neighbourhood. Adrian, Monica, and Janos are returning visitors who visit more than once. Ionatan, Mina, and Avram are single-visit visitors. Each returning visitor has three supply quests. The nine supply quests alternate in that order. They open after preparations 6, 8, 9, 13, 14, 17, 19, 21, and 22.

Each supply quest also waits for the delivery of the previous supply quest. So only one supply quest is open at a time. The returning visitors do not join the finale.

A supply quest asks for food for a stay under the cathedral. The visitors explore the passages under the cathedral, one level deeper on each visit. In each opening, a visitor tells a core character what the visitors found, and the core character answers. Each later visit follows from the finding of the visit before. The mystery stays open at the end of act 1. A supply quest has one of two sizes. Provisions are 12 to 16 portions of chain dishes from stage 3. Meals are 4 to 6 portions of mixed dishes.

Ionatan is a foreign real estate agent who visits once in each save. He stops for dinner on his way to a nearby castle. At the castle, he plans to close a property deal with a local noble. He reaches the castle on Saint George's Eve of the old calendar, in May, so his dinner is a quest of act 2. It follows Vlad's quest "A guest at the castle", in which Vlad announces him. His quest needs a red wine, a sharing board, and a tochitură. He never joins the finale.

The delivery records his quest identifier (ID) once and ends his visit. His farewell scene stays unread in Story. A reload, an export, and an import keep the record of his departure. A new game permits a new visit.

The neighbourhood has 17 neighbours: the four core characters and 13 regulars. The six visitors are not neighbours. Each regular has a name, a trade, a portrait, an introduction, and two or three favourite dishes. Each quest of a regular asks for at least one favourite dish. Each regular refers to a horror novel, a horror film, local folklore, or a historical figure. The reference is in the name, the trade, or one habit. Vlad refers to Vlad III Dracula. Elisabeta refers to Elizabeth Báthory (Báthory Erzsébet).

Dochia, Victor, Ana, Costel, and Bela are present from the start. Sânziana and Dorian arrive with preparation 4. Vlad, Elisabeta, Ileana, and Cezar arrive with preparation 8, and their arrival scenes queue in that order. Cătălina and Bran arrive with preparation 12. Dorian is a rich gentleman who does not work. He sits for portraits and attends social meals. Bela is the graveyard keeper, and he has two campaign quests. He sleeps through the day, and his smile unsettles the other guests, so the supper does not invite him.

A regular arrives only when a preparation is complete. Each regular who arrives after the start has a short arrival scene. In the scene, a core character introduces the regular, and the regular answers. The payment that brings a regular queues the arrival scene. The arrival scene follows the preparation scene and the closing scene that the payment earns. The arrival scene follows the story rules for unread scenes.

Vlad is a local baron who calls himself a count. He lives in a castle in the countryside. Elisabeta is an Austro-Hungarian countess who sometimes visits her land nearby. Each of their quests asks for red wine and a meat dish. No dish of their quests has garlic. Vlad and Elisabeta do not join the finale. They book a table for the evening, and they never dine on the same evening. The reason is that Vlad keeps moving the fence between their lands. The Bookings section under Day and night gives their delivery rules.

Some characters have a diet. The game does not show a diet. The data check enforces each diet with the content tags of the dishes. The tags are meat, pork, dairy, egg, fish, alcohol, and garlic. A mixed dish has every tag of its parts. Mina eats no meat or fish. Cătălina keeps an Orthodox fast: no meat, dairy, or egg, and she can eat fish outside Lent. Ilie and Cătălina keep Lent: "Seasons and holidays" gives its rules. Avram eats no pork, and no quest of his has both meat and dairy. In a shared quest, each character of the quest accepts each dish.

Mina and Doctor Avram share one visit in each save. Mina is a young British middle-class woman in Victorian dress. She looks for her fiancé Ionatan. He is in the area to sign a property contract. She has no news from him. Avram is a Hungarian Jewish doctor who travels with her.

Mina finds Ionatan in August, so their quest is a quest of act 2. It opens after the player delivers Ionatan's dinner. Mina and Avram arrive together and leave together. They never join the finale. They cannot meet Ionatan at the bistro.

Their shared quest is a vegetarian meal for two. The meal is two portions of zacuscă, two roasted vegetable plates, one telemea, and one fruit tea. The meal can contain eggs and dairy. The meal contains no meat and no fish. The meal pays its menu value of 166 coins. The delivery ends the visit and sends them to find Ionatan.

The third delivery after theirs earns local news. The news says that they found him gravely ill and that all three left for Britain. They do not visit the bistro on the return journey. Only local speakers tell the news, and the news gives no reward. The player can read the news later in the journal.

The journal holds optional introductions for the neighbours and the three returning visitors. Its neighbours list shows the core characters, then the regulars in order of arrival. Each neighbour who has arrived shows a portrait, a name, a trade, and the number of delivered quests. A regular also shows the favourite dishes. A neighbour who has not arrived shows as a "Not yet" outline without a name and without a portrait.

An unread arrival scene opens from Unread scenes. The neighbour rows open introductions. Ionatan, Mina, and Avram have introductions only while their quest is open. The journal does not replay their completed quests.

A campaign quest delivery queues the completion scene in the same change. The delivery notice does not open the scene and does not stop play. Read now opens the unread scene from Story. The delivery notice also offers the scene by the name of the character. The journal has one conversation entry for each completed campaign quest of a neighbour or a returning visitor. The supper quest has only its opening entry, and the finale is separate. The recovery quest has no journal entry. The completion action marks the scene as read.

A quest journal page shows Quest, then Reply, with the exact text and speakers and one shared illustration. The page has one Return action. While the completion scene is unread, the whole conversation shows once under Unread scenes. Return marks only that completion scene as read and moves the same entry to Earlier conversations. A replay changes no game state. Story and delivery notices open the completion scene alone. A single-visit visitor has only an unread farewell scene, with no combined replay.

The game keeps the record of the delivery. The journal can replay the scenes of neighbours and returning visitors. If the save of a delivery fails, the game keeps the current session. The delivery notice then includes a warning that the session is not saved. Options offers Retry save. An export includes the current session. A reload restores only the progress that the game saved.

If the supper save fails, the finale also shows the save warning immediately inside its dialog.

The campaign has six chapters with four preparations each. Story shows the title and the objective of the current chapter. Story also shows one step for each preparation of the chapter: done, now, or not yet. A chapter opens at its first preparation and needs no payment of its own. Its closing scene stays hidden until the chapter is complete. Each chapter names one quest of a core character as its neighbour help. That quest opens during the chapter.

Each payment queues the scene of its preparation. The payment for the last preparation of a chapter also records the chapter as complete. In the same change, that payment queues the closing scene of the chapter. A payment queues its scenes in this order: the preparation scene, then the closing scene. Serve on the supper quest queues the finale.

The game records the finale once. A failed payment queues nothing. The reveal is the change of the room that a paid preparation earns. After a payment, the preparation scene opens immediately. The complete conversation shows as a transcript. Its "See what changed" action moves the scene to the journal and starts the reveal.

Close and Escape start the reveal and leave the preparation scene unread. After the reveal, the next scene that the payment earned opens. If the player opens another dialog first, that scene stays unread. The completion action moves a scene to the journal and opens the next unread scene.

Story shows the first unread scene with Read now. After a reload, Mara's line says that a scene is waiting. When a preparation scene opens again after its reveal, its last button has the usual end label. That button does not have the label "See what changed".

The next preparation and all tickets stay available while a scene is unread. A scene gives no coins and no items when the player reads or replays it. If a saved scene has no content, the game shows an error with a recovery action and keeps the progress. The game does not invent story text.

Each scene shows its full transcript in order, with a portrait and a name for each speaker. A combined quest journal page, introductions, and replays use the same presentation. One completion action follows the text. The dialog focuses its title and starts at the top. Close and Escape do not mark an unread scene as read. A scene that opens again starts at the top. If the player opens or scrolls a scene, no saved state changes. An unread scene shows a save warning when its session is not saved.

The journal starts with Unread scenes, in their saved order. Each unread scene has one entry here, including the farewell scene of a single-visit visitor. A read farewell scene has no replay. An empty list says "No unread scenes." The current chapter follows, or the latest chapter when all preparations are complete. Earlier chapters and Earlier conversations follow as collapsed groups. Earlier chapters lists the other complete chapters, newest first. Earlier conversations keeps each completed quest in one entry, with the most recently delivered quest first. Earlier conversations also holds earned local news and the read finale. Neighbours is a collapsed group that lists the characters. The journal opens with all groups closed. Return, Close, and Escape from a conversation keep the open groups and the position in the journal. They also focus the entry of the conversation. When an entry moves after the player reads it, its group opens and the entry becomes visible. After a read arrival scene, the journal returns to the neighbour of the scene. After a read farewell scene of a single-visit visitor, the journal returns to the Unread scenes heading. The player gets no reward when the player reads an entry or opens a group.

The journal lists each chapter that is current or complete. A current chapter shows its opening context, its objective, and the state of each preparation. After the quest of its neighbour help opens, the chapter also shows its neighbour help. A complete chapter shows its payoff and its neighbour help. The complete chapter also shows its preparations, each with the name of its room change, and its closing scene. After the supper, the journal also holds the finale.

In the finale, the four core characters speak, and the finale names the result of each chapter. Its last button, "See the supper", opens the supper painting. The painting shows 11 neighbours in the courtyard. Mara stands at the long table with a steaming pot. Ilie, Costel, Sorin, and Victor sit on one bench. Eszter, Ana, Ileana, and Bran sit on the other bench. Cătălina and Cezar share the small table. Miez and the second black cat wait for scraps. The ending line of the finale is under the painting, and its button returns to the kitchen. A replay of the finale from the journal also ends with the painting. After the player serves the supper, the courtyard of the room shows the supper painting and no finishes. Only repeating quests remain after the supper.

While the supper waits, the supper card names the supper quest on the counter. When the supper is complete, the card says "The community supper is open, and every campaign quest is delivered. The board and the recipe book stay yours." Then the card gives the result of act 1. An example is "The bistro worked from 15 February to 1 May. The purse holds 312 coins." The card shows a debt as "The shop notebook holds a debt of 40 coins."

The kitchen is the board with the tickets and Mara's line. Mara's line is the line of text under the board. Mara says what the player can do next. The room is the main screen of the game and the reward of the game. On a narrow screen, the kitchen is a drawer over the room. On a wide screen, the kitchen is a panel next to the room. The room shows one painted area of the bistro. The area shows the state that the completed preparations give. The bistro has two areas:

- The front room starts in poor condition, with cobwebs and some small spiders in the broken window. The preparation "Fix the broken window" removes them. One resident spider always stays under the upper wall shelf.
- The courtyard opens with the preparation "Clear the courtyard" in chapter 4.

Each area has one painting for each of its states. The room shows the state of the highest completed preparation in that area. Preparations 1 to 12, 17, and 24 change the front room. Preparations 13 to 16 and 18 to 23 change the courtyard. The room opens on the area that the player chose last. A reveal moves the room to the area of its room change. If the browser has no stored choice, the room shows the area of the latest room change.

An area switch in a corner of the room shows the other area. A locked area shows only its name and the preparation that opens it. A small "New" pin marks the latest room change in the area. The pin shows the short name of the change, for example "New: lamps lit". The pin points at the edge of the change and does not cover the change. If the name does not fit, the pin says only "New".

To merge, the player taps an item and then a matching item. Two matching dishes of a chain make the next dish of the chain. Two parts of a recipe make a mixed dish. The player merges one part into the other, in either order. The mixed dish goes in the cell of the target. A recipe has two parts. The parts come from different chains, or one part is a mixed dish of two chain dishes. So recipes nest only one level deep. A mixed dish uses at most three chains. If the player selects a movable dish, the board marks its merge targets. A merge target is a movable dish or a blocked cell that can merge with the selected dish. Sources mark no merge target. Final dishes that are part of no recipe mark no merge target. The player can also drag an item onto a matching item. A tap on a free cell moves the selected item to that cell. A drag onto a different item swaps the two items.

The item dialog names the neighbours whose tickets need the dish. If no ticket needs the dish, the dialog says "No quest on the counter needs it now." "Show me on the board" starts the guide. The guide shows the next step to make the dish. Seasonal dish help states whether its source is present, has left, or waits for its season or space. If the source is absent, "Show me on the board" appears only when a board step remains. "Find a match" in Mara's line shows a pair or a recipe to merge.

Each chain has one source. One tap on a source takes one stage-1 ingredient and selects the source. Each further tap takes another ingredient. Enter or Space on the focused source also takes one ingredient. A take from a paid source spends the take cost, and a paid source shows that cost. Dishes above stage 1 come only from merges. A drag moves the source and takes nothing. Sources cannot merge. The selected-source line names the source and says that another tap takes its ingredient. Clear selection ends the selection. If the board is full or the purse cannot pay, the source takes nothing and Mara says why. A failed take changes nothing.

A dish leaves the board when the player merges it or delivers it. A dish also leaves the board when the thief rat picks it at closing. Consider a full board of dishes that cannot merge and that no quest needs. Only a new game clears that board. The board-full notice says "The board is full. Merge a pair or deliver a quest."

The recipe book lists the dishes of each chain, then the mixed dishes. A new game discovers the items on its initial board. After that, a take, a merge, a gift of Șoricescu, or a quest ticket discovers a dish. A quest that gets a ticket puts its dishes in the recipe book. A dish that the player has not discovered shows as a covered dish with the label "Not yet". A discovered dish shows its picture and its name and opens its item dialog. Close or Escape from an item dialog that the book opened returns to the same position in the book. Then the book focuses that dish. "Show me on the board" leaves the book and goes to the board. Close or Escape from an item dialog that a quest opened returns to its quest. If a take or a merge makes a dish that is not in the recipe book, a notice shows. The notice says "[Dish] is a new dish! It is in the recipe book now." A section whose dishes are all discovered shows "Complete" in its heading. The item dialog of a mixed dish shows its recipe. The item dialog of a part names the mixed dishes that the part makes. The recipe book button shows how many dishes the player has discovered. These marks give no reward.

The recipe book uses the available width on a desktop and one column of sections on a phone. Its title and close button stay visible while the dishes scroll. A section picker moves directly to a chain or to the mixed dishes. An expandable group explains the book. Clicking outside the book closes it and focuses the control that opened it.

The guide raises the kitchen drawer if the drawer is low, and then focuses the next step. If the target dish is not on the board, the guide keeps its target while the player acts. The Find button of a quest always guides toward another portion that the quest needs. The board marks the next useful cells, and the selected-item line names the target and the next step. A successful take or merge that makes another target dish ends the guide. Stop cancels the guide. Escape from the board or from a guide control also cancels the guide. A second tap on the selected dish or blocker also cancels the guide. A tap on a selected source takes another ingredient. A reload, an import, a reset, or an update from another tab also cancels the guide. The guide changes no game state and does no action for the player. "Show me on the board" for a mixed dish guides toward the missing part with the fewest steps.

When the board is full, the guide first points to a legal merge toward its dish. If no such merge is available, the guide points to a ready quest delivery that removes a dish. After that, the guide points to another legal pair or blocker merge. A ready delivery gets the same dotted mark on its ticket button. The guide does not count blocked items as movable matches. The guide does not suggest a take from a source if no free cell is available. If no delivery or merge can make room, the guide says so and keeps Stop available. The guide does not change the board or deliver a quest for the player.

A new game starts with eight blocked cells at the edge of the board. A blocker covers each of these cells. Each cell shows its blocked item through the open centre of the blocker. Four blockers use crate, sack, crock, or linen art, and four use twine. Webs cover the crate, sack, crock, and linen blockers until the preparation "Fix the broken window" is complete.

Every blocker has the same rule. Any legal merge into the blocked item clears the blocker. The merge can use a matching dish of its chain or a recipe partner. The blocker clears, and the dish of the merge stays in that cell. In the same change, the purse gets the blocker coin. The cell of the moved item becomes empty. A merge next to a blocker clears nothing.

A blocked item cannot move and cannot fill a quest. The player can clear a blocker without a free cell. Campaign progress and quests do not need cleared blockers. A blocked cell is not a free cell for any placement or cell count. "Find a match" and "Show me on the board" can show any matching blocked item. A blocker does not add its item to the recipe book.

Each blocker has a small help mark. A tap selects the blocker. Then the name of the blocker and its rule replace the item actions or the preparation offer under the board. The blocker help names the blocked dish and each recipe partner that the player has made. The help also marks the movable matches. The help does not name a recipe partner that the player has not made, and that partner stays covered. A tap on a marked item merges the item into the blocker and clears the blocker in the same action. A selected matching item also merges directly into the blocked cell. To leave the help without a merge, the player can tap the blocker again. The player can also select an item that does not match, use Clear selection, or press Escape. The help changes no game state until a merge.

Each of the 24 preparation payments earns one authored batch of two or three new blockers. The batch shows the work that the player completed with that payment. Each batch has one of these themes: repair supplies, courtyard leaves, planting supplies, recipe papers, menu packing, or supper supplies. The items of a batch come only from chains that the payment has opened. Each batch has one blocker with a contextual picture. The other blockers use familiar clutter art or an anchored item.

The usual blocker rules apply. Quest deliveries earn no batch. No batches arrive after the campaign.

A blocker goes only in a free cell. A new source from the payment gets its cell first. Placement follows board order and keeps at least four cells free. So the recovery quest always has room for one Linden tea. Blockers can touch each other.

At most three preparation blockers can be on the board at the same time. This limit does not count the eight blockers of a new game or the rat holes. The other blockers wait in preparation order. A successful move, take, delivery, or payment tries placement again. A failed action places nothing.

A placement never replaces an item and never moves an item. A blocked cell can get another blocker only after the player clears the earlier blocker and the cell is empty. Each blocker appears once. Its name and its explanation give its context. The label of the board gives the number of blockers that wait.

On the first opening with no saved game, Mara's line explains how two Socată make Linden tea for Ana's 14-coin recovery quest. The two starting Socată have the hint pulse. The selected Socată and tea keep the delivery instruction until the player earns coins. This instruction does not block any action. A loaded game keeps its welcome message and ordinary guidance.

If an action on a selected cell fails, the visible selection strip shows the reason and recovery action in place of the ordinary item text. The next selection or game action clears that message. The failure does not change the board or the purse.

The screen shows one Pay button at a time. If the story card is on the screen, only the story card has Pay. If Story is a sheet, Mara's line has Pay. Mara's line offers the next preparation by name with a Pay button.

Mara's line makes this offer if all of these conditions are true:

- The player meets all the requirements.
- The player has not selected a board cell.
- No guide is active.

If a guide is active, Mara's line keeps the next-step note and the Stop button visible. If the player selects a cell, Mara's line shows the actions of that cell. While the story card is not on the screen, the Story button can have a copper dot. The dot shows if the player can pay or if a scene is unread. The Story sheet keeps Pay available during a guide. If the player cannot pay yet, Mara's line does not change. Pay in Mara's line works like Pay in Story.

After the player pays for a preparation, its preparation scene plays. When the scene ends, the reveal runs. The new painting replaces the old painting, and the pin marks the change. The drawer can move on a narrow screen that is more than 600px high. There, the drawer lowers for the reveal and then rises again. On a narrow screen that is 600px high or less, the drawer does not move. There, the drawer body stays active during the reveal. [`DESIGN.md`](DESIGN.md) gives the order and the timing of the reveal. With reduced motion (defined in Access and persistence), the game shows the result immediately. The reveal does not spend coins and does not earn coins again.

Every preparation repaints one area. Miez, the bistro cat, sits on the windowsill of the front room. When the supper is ready, a second black cat sleeps on the counter. Captions describe every earned change.

Story has a Miez card. A tap on the card or on the cat on the windowsill changes the cat between sitting and sleeping. The change shows a short notice and plays a sound if sound is on. The change does not affect the save.

A bat crosses the dusk sky beyond the mended window of the front room after each preparation. A bat also crosses after every third delivered quest. Only the bat is clipped to the six repaired glass panes, so the painted wooden frames hide it. The broken window has different frames and never shows a bat. The bat crosses only while the room shows the front room. The bat never crosses in these cases:

- The page is hidden.
- Reduced motion is on.
- The player has not mended the window.
- The room painting did not load.

Deliveries of the recovery quest and the repeating quests count for the bat only during the current tab visit. A reload, an import, a reset, or an adopted save clears that temporary count.

A caption stays available if a painting cannot load. If a state has no accepted painting, the room shows the latest earlier painting of its area. The room shows the caption of the new state. Authored lamps and lanterns light the room at story milestones.

The game has no energy limit, no timers, no purchases, no advertisements, and no accounts.

Three quests offer a second finish for a detail of the bistro:

- Eszter's "A second glaze" opens after preparation 9. It offers Green bowls for the shelf tableware (default: Blue bowls).
- Ileana's "A blue table cloth" opens after preparation 22. It offers Blue embroidery for the courtyard table cloth (default: Red embroidery).
- Sânziana's "Lilacs for the dresser" opens after preparation 23. It offers Lilacs for the final dresser flowers (default: Wildflowers).

The room paintings show the default finishes. A detail shows in the room after its preparation. The preparations are 9 for the tableware, 22 for the table cloth, and 24 for the flowers.

A finish switch with a small badge is on each detail. The switch shows when the detail is in the room and the player has delivered its quest. A tap on the switch changes the detail to the other finish. The change applies only after the save succeeds. If the write fails, the detail keeps its previous finish, and the game says so.

The player can change the finish again at any time. A finish does not change progress or rewards. The switch shows only in the area that the room shows. The switch accepts input only if its painting has loaded. The switch also needs at least 44px by 44px of the detail to be visible above the drawer. Where the drawer can move, the player can lower it to see a detail outside the current view. The completion line of each finish quest says where the switch is.

### Calendar

The game has a calendar. Each day of play has a date, and the story happens on fixed dates. The years have the names "year 0" and "year 1". The game never shows a real year. Year 1 has 365 days and starts on a Wednesday. In year 1, the Orthodox Easter and the Western Easter are on the same day: Sunday 20 April.

Act 1 starts on Saturday 15 February of year 1 and ends with the community supper on Thursday 1 May. Act 1 has 76 days, with 11 Sundays. Each day of act 1 is a day of play, and the bistro opens every day. The calendar paces the story: each chapter opens on a date. Inside a chapter, the player sets the pace. A new game starts on Saturday 15 February at 07:00.

The masthead shows the short weekday, the day, the short month, and the time, for example "Sat 15 Feb · 07:00". The accessible name gives the full weekday, the day, the full month, and the time, for example "Saturday 15 February, 07:00". On a phone, the date is above the time. The saved day number gives the date: day 1 is 15 February.

| Days | Opening time | Closing time | Booking time |
| --- | --- | --- | --- |
| Monday to Saturday | 07:00 | 22:00 | 20:00 |
| Sunday | 10:00 | 17:00 | No booking |

Each chapter has an opening date. The first preparation of a chapter can have a payment only from the opening date of its chapter. The quests of the earlier chapter can open and get their deliveries before that date. Before the opening date, Story shows the date in its list of requirements. A failed payment before the opening date changes nothing.

| Chapter | Opening date | Preparations |
| --- | --- | --- |
| 1 | Saturday 15 February | 1 to 4 |
| 2 | Thursday 27 February | 5 to 8 |
| 3 | Thursday 13 March | 9 to 12 |
| 4 | Thursday 27 March | 13 to 16 |
| 5 | Wednesday 9 April | 17 to 20 |
| 6 | Sunday 20 April | 21 to 24 |

A campaign quest can have an opening date. The quest opens after its preparation and its earlier quests, and not before its opening date. A quest without an opening date opens by the other rules. The data check keeps each opening date inside act 1 and on or after the opening date of the chapter of its preparation. Among the quests that open after the same preparation, a dated quest comes first. So a dated quest that opens can take the ticket of an open quest that comes later in authored order.

A holiday quest is a dated quest with a holiday. Its opening date is at most three days before the holiday. Before the holiday, its ticket shows the holiday and its date, for example "For Easter, Sunday 20 April", and Later takes the place of Deliver. The quest has work only while a portion is missing from the board. Deliver works from the opening time of the holiday. After the holiday, the quest stays open, its ticket shows "Late for Easter", and the reward is the same. The completion scene is the same on and after the holiday.

The supper quest opens after preparation 24. Before 1 May, its ticket shows "Booked for 1 May", and it has work only while a plate is missing. The player can cook the plates on earlier days. On 1 May, the ticket shows "Booked for 20:00". Serve works from 20:00. Before 20:00, the lantern control replaces Serve, and it works when the board holds every plate.

The calendar never passes 1 May in act 1. Two days hold:

- 30 April holds until the payment of preparation 24.
- 1 May holds until the supper.

On a day that holds, a merge that reaches the closing time does not close the day. The clock stays one merge before the closing, and later merges do not move it. The day has no upkeep and no night while it holds. While 30 April holds, Mara's line says "Walpurgis Night lasts until the bistro is ready." While 1 May holds, it says "The village waits for the supper." While 30 April holds, each booked delivery ends the evening of its guest, and the game fixes the next evening guest at once. So the player can deliver each booked quest that remains. On 30 April, the payment of preparation 24 at the end of the day closes the day in the same change, and 1 May starts.

### Day and night

The bistro has a work day. Each merge is kitchen work, and kitchen work moves the clock. Each successful chain merge, mixed merge, or blocker merge adds 15 minutes. A failed merge, a move, a take, a delivery, a payment, and a scene do not move the clock. A weekday holds 60 merges, and a Sunday holds 28 merges.

The merge that reaches the closing time closes the day in the same change, in this order:

1. The merge applies with all its usual effects, including the placement of preparation blockers.
2. The purse pays the upkeep of 20 coins.
3. A seasonal source whose season ends leaves the board.
4. On Sunday night only, the thief rat or Șoricescu visits the board.
5. The next day starts at its opening time, and a seasonal source whose season starts takes its cell.
6. The game fixes the evening guest of the new day.
7. The state records the night report.

The rats come only on Sunday night, so the night stays an event. After each other closing, no rat comes and no dialog opens. A notice reports the upkeep, each seasonal source that left or came, and the new date, for example "The bistro closed for the night. Upkeep: 20 coins. Good morning, Tuesday 18 February." The notice is the temporary notice of a delivery. It does not stop play, does not take focus, and needs no action.

A loose raw ingredient is a stage-1 dish of a chain other than Herbs, on a cell without a blocker. Cooked dishes and herbs are safe overnight. If the board has a loose raw ingredient at the closing of a Sunday, the thief rat comes. The thief rat picks at most three loose raw ingredients at random, by the random seed of the save. The game gives no warning, and the player cannot protect a cell. If fewer than three rat holes are open, a new rat hole blocks the first pick in its cell. The other picks leave the board. A rat hole is a blocker, and the usual blocker rules apply. A merge of a matching dish clears the rat hole. The dish stays in the cell, and the purse gets the blocker coin. A rat hole replaces the pick in its cell, so the rat hole does not reduce the free cells.

If the board has no loose raw ingredient on Sunday night, Șoricescu comes. He is the good rat of the neighbourhood. A tidy kitchen earns his gift: the stage-4 dish of an open chain that is open all year. These chains take turns in their data order, by the number of earlier gifts. The gift goes in the free cell nearest to the bottom left of the board. The gift is not blocked. He leaves a gift only if the board has at least five free cells. So four free cells stay free for the recovery quest.

The upkeep can make the purse less than zero. A purse below zero is a debt. Mara writes the debt "pe caiet", in the notebook of the village shop. The purse shows a debt with a minus sign, for example "−12". A paid take and a payment need the coins. A free take, a delivery, and a cleared blocker work with a debt. The recovery quest stays open while the purse has too few coins. The game has no defeat.

After a Sunday closing, the closing dialog says that the day is over, for example "Sunday 16 February is over." The dialog offers Watch the night and Skip. Until the player selects one, the board shows its state before the night. Watch the night, Close, and Escape play the night. The room dims, and the rat of the night runs across its floor. Then, on the board, the thief rat removes its picks and leaves its rat hole. If Șoricescu comes instead, he places his gift and lifts his hat. While the front room shows a mended window, its glass shows a night sky. No tap and no key ends a watched night, and that input does nothing. Skip opens the morning dialog, and the end of the night also opens the morning dialog. The morning dialog reports the upkeep, the visit of the rat, a seasonal source that left, and the purse or the debt. When the player closes the morning dialog, the game marks the report as seen.

While the page is hidden or with reduced motion, the morning dialog opens at once. The closing dialog and the night do not show. If the page becomes hidden during the night, the night ends and the morning dialog opens. If the page reloads before the player closes the morning dialog, the morning dialog opens after the load. The night does not play.

#### Bookings

Each quest of Vlad and Elisabeta is a booked quest. Vlad and Elisabeta are the booked guests. A booked ticket is a ticket that holds a booked quest. Each day has at most one evening guest:

- At the opening time, if a booked ticket is on the counter, the game fixes the evening guest.
- If the day has no evening guest, the arrival of a booked ticket on the counter fixes the evening guest.
- If only one guest has a booked ticket, that guest gets the evening. If both guests have one, the guest who did not have the last evening gets it. If neither guest had an evening, the guest whose quest is first in authored order gets it.
- The evening guest does not change until the next closing. An evening counts for its guest whether or not the player delivers the meal.
- A Sunday has no evening guest, because its booking time is after its closing time. Saint George's Eve, 22 April, has no evening guest: garlic hangs on every door that night. 1 May, the day of the supper, has no evening guest.

The ticket of the evening guest shows "Booked for 20:00". Each other booked ticket shows "Booked for another evening". Each day permits one booked delivery, to the evening guest, from 20:00 to the closing. Before 20:00, the lantern button "Light the lanterns" replaces Deliver on the ticket of the evening guest. The lantern button works when the board holds every portion. The lantern button moves the clock to 20:00 in one change. The lantern button spends no coins, and the closing comes sooner. So the player never cooks food that no quest needs only to wait for a guest. The opening of each booked quest names the booking time. A booked guest who does not get the meal books again for a later evening.

#### End of act 1

The supper delivery stops the clock. After the supper, merges do not move the clock, and no night comes. The supper records the result of act 1: the purse at that time. The result does not change after the supper, but the purse can change.

### Seasons and holidays

The game uses the seasons of the weather calendar: winter is December to February, spring is March to May, summer is June to August, and autumn is September to November. Act 1 has 14 days of winter and 62 days of spring. A season never stops play. A holiday quest has no deadline. Weather never removes an item or coins.

The game data gives the weather of each day: fair, rain, or snow. The weather is the same in each save and does not use the random seed. The data check enforces these rules: snow only before 15 March; from 1 April, rain on at most two days in a row; fair weather on each holiday; and fair weather on 30 April and 1 May.

A holiday is a date with a custom of the village. The village keeps the Orthodox holidays, the customs of the Hungarian neighbours, the customs of the Saxons, and old folk beliefs. These holidays have a quest:

| Date | Holiday | Quest |
| --- | --- | --- |
| Monday 24 February | Dragobete | Victor's "A sweet for two" |
| Sunday 2 March | Carnival Sunday | Eszter's "The last feast" |
| Saturday 8 March | Women's Day | Sorin's "Sweets for the night ward" |
| Sunday 9 March | the Forty Martyrs | Costel's "Forty small glasses" |
| Tuesday 25 March | the Annunciation | Ilie's "The first fish" |
| Sunday 13 April | Palm Sunday | Sânziana's "Willow catkins" |
| Thursday 17 April | Holy Thursday | Ileana's "Before Thursday" |
| Saturday 19 April | Holy Saturday | Mara's "Baskets for the blessing" |
| Sunday 20 April | Easter | Mara's "Easter lunch" |
| Monday 21 April | Easter Monday | Eszter's "Sprinkling day" |
| Tuesday 22 April | Saint George's Eve | Ana's "Garlic duty" |
| Monday 28 April | the Easter of the Blajini | Mara's "The Easter of the Blajini" |

Ilie's "Clean Monday" opens on 3 March, the first day of Lent, and Cătălina's "The silent bells" opens on Holy Thursday. They are dated quests without a holiday.

Dochia refers to Baba Dochia of the folk calendar, who takes her sheep up the mountain in March. Each of her five quests is a March quest. A March quest opens only in March, after its preparation, its earlier March quests, and its opening date. No preparation and no supper needs a March quest. If a March quest does not open by 31 March, it waits for March of the next year. An open March quest stays open after March until its delivery. The state records each March quest that opened. The five quests are "One sheepskin fewer" (1 March), "Lunch for the hill" (4 March, after preparation 3), "The last cold week" (7 March, after preparation 7), "Lambing time" (14 March, after preparation 7), and "The high pasture" (28 March, after preparation 13).

The Great Lent of year 1 is from Monday 3 March to Saturday 19 April. Ilie and Cătălina keep Lent. During Lent, they eat no meat, dairy, egg, or fish. Fish is permitted on the fish days, 25 March and 13 April, and wine is permitted. The data check uses the days of each quest. They start on the holiday of a holiday quest, or on the opening date of the quest, or else on the opening date of the chapter of its preparation. They end on the day before the chapter that follows the chapter of the preparation that needs the quest. If those days touch Lent, the Lent rule applies to each eater who keeps it. Fish is permitted only if the days start on a fish day.

A seasonal source is on the board only in its season. Its take is free, and its ingredient counts as zero in the menu price. Its stage-1 dish is a loose raw ingredient. It gives no gift of Șoricescu.

| Source | Season | Chain |
| --- | --- | --- |
| Pickle barrel | 1 December to 20 March | Preserved vegetables: Gherkins, Pickled green tomatoes, Mixed pickles, Cabbage-stuffed pickled peppers |
| Forage basket | 21 March to 31 May | Spring greens: Nettles, Wild garlic and sorrel, Nettle soup, Nettle purée with garlic |

The pickle barrel is on the board of a new game. At the opening time of the first day of its season, a seasonal source takes the first free cell in board order, if the board keeps at least four free cells. Otherwise the source waits, and each successful move, take, delivery, and payment tries the placement again. The closing of the last day of its season removes the source, and the dishes of its chain stay. The source stays while an undelivered campaign quest of act 1 or the open repeating quest asks for a dish of its chain. It then leaves at the first closing after the delivery of the last such quest. The closing notice, or the morning dialog of a Sunday, says that the source left, for example "The pickle barrel is empty until next winter." A quest asks for a dish of a seasonal chain only if the days of the quest are inside the season.

The terrace season is from 1 April to 31 October. A terrace day is a fair day in the terrace season. An outdoor quest delivers only on a terrace day. On another day, its ticket shows "Waits for fair weather", Later takes the place of Deliver, and it has work only while a portion is missing. The outdoor quests of act 1 are Ilie's "Bread for outside" and Sorin's "A courtyard break", which open after the preparation "Clear the courtyard", and the community supper.

The room shows the season. The front-room window shows the village in late winter until 9 March, at the thaw from 10 March to 5 April, and in blossom from 6 April. Rain and snow show on their days. Holiday decorations show in their dates: a mărțișor on the window latch from 1 to 9 March, willow catkins on the windowsill from 13 to 19 April, a bowl of red eggs on the windowsill from 17 to 27 April, and green branches on the courtyard gate from 22 April to 1 May. [`DESIGN.md`](DESIGN.md) gives how they look. The room look changes no progress and no reward.

## Feature specifications

The register `docs/specs/README.md` records the feature specifications, their status, the product limits, and the product direction. The register stays in the repository only.
This document owns the implemented behavior.
The art plan `docs/specs/001-visible-renovation-art-plan.md` defines the 25 painted room states. The art plan stays in the repository only.

## Identity

The game has 74 generated Portable Network Graphics (PNG) masters. They give these items:

- 18 food atlases: one for each chain, with its source and its dishes, and four for the mixed dishes
- portraits, including three atlases for the regulars
- parchment paper, three sheets of character sketches, and four sheets of quest scenes
- 25 painted room states
- the supper painting
- two decoration edit paintings, which the game samples only in their authored regions
- the timber tabletop
- the embroidered runner
- cat sprites and bat sprites
- board clutter, with a web overlay and a twine overlay
- 12 contextual preparation clutter pictures
- two rat sprite sheets, the rat hole, and the night sky
- three views of the village for the front-room window: late winter, early spring, and spring
- two holiday images, one for each area, which the game samples only in the regions of their decorations

[`DELIVERY.md`](DELIVERY.md) gives the shipped image variants and the fonts.

The [release notes](docs/release-notes.md) give the release limits, including the limits of title clearance.

## Access and persistence

The game supports pointer, keyboard, and touch input. It supports Light, Dark, and System appearance, visible focus, and reduced motion. The appearance is Dark until the player selects another appearance in Options. Sound is off until the player enables sound in Options.

The Motion setting in Options has three values. System is the default. System follows the reduced-motion setting of the device. Reduced removes the motion on all devices. Full plays all the motion, also when the device asks for reduced motion. In this document, "reduced motion" means Reduced, or System on a device that asks for reduced motion. In forced colours mode (Windows high contrast), the board cells and the selection stay visible.

The browser stores the save, the appearance setting, the Motion setting, and the area that the room shows. The area is a display preference and is not part of the save.

If the browser blocks storage, the player can play only for the current visit. Options and each change say that the game is not saved. A preparation or a finish switch needs a successful save, so the preparation or the switch does not complete.

If the game is open in more than one tab, each tab follows the latest save. A tab does not replace the latest save with an older board. When a tab follows the latest save, an open dialog or a drag in that tab ends.

If the game data cannot load or does not pass its checks, the kitchen says so and offers Try again. The game also disables the Story button, the Options button, and the buttons that open the recipe book. In that case, the game does not read or write the save.

An import validates the envelope and the state of the save. The envelope is the outer record with the format and the version. A load and an import accept a top-level state field that the save format does not define. Play, the next save, and an export keep that field. A load ignores an envelope field that the format does not define, and the next save removes that field. If a board cell has an undefined field, the save is not valid. An import rejects damaged saved data and keeps the current save. An import enforces a size limit of 2 mebibytes (MiB). Load, save, import, and reset use only the save key of this game. They do not change other browser data.

A current save has game state version 15 in envelope version 14 at the key `scary-snacks-save-v14`. The game supports only this format. Load reads only this key. If no current save exists, the game starts a new campaign.

The ID of the supper quest in the completed quests records the served supper. If a current save has all preparations complete and no served supper, the game shows the supper quest. The save earns the finale only when the player serves the supper. If such a save holds the finale as an unread scene, load and import remove the finale before the check.

Saves in an earlier format stay unchanged. The game does not read them or convert them. Import rejects earlier formats. A new game uses the authored blocked layout. A save records the ID of the layout and the IDs of the cleared blockers. A layout ID must stay the same after release.

The optional record of the repeating quests stores the last delivered repeating quest and the open repeating quest. A missing record means neither. Save validation rejects a record that names an unknown quest or a quest that is not in the cycle.

The record of the March quests lists each March quest that opened, in the order of opening. Save validation rejects a quest that is not a March quest, a quest whose prerequisites are not met, and a March quest that opens on the saved day but is not in the list. A delivered March quest must be in the list.

The board holds at most one source of each seasonal chain. The date, the season, the weather, and the holiday come from the saved day number, so they need no saved field.

The optional record of preparation blockers stores the baseline. For each placed blocker, the record also stores its ID and its cell. The baseline is the number of completed preparations when the record starts. The waiting blockers come from the paid batches after the baseline. A current save without this record starts the baseline before its next successful preparation payment. The save gets no batch for an earlier payment.

A reload, an import, and a change from another tab keep the record. They do not place a blocker and do not repeat a blocker. If a preparation save fails, its payment, its batch, and its placements do not enter the session. If a save fails after a board action, the current session keeps the placement and the queue. Retry save and export include that session.

The state records the unread scenes in a list. The list holds preparation scenes, quest completion scenes, chapter closing scenes, the finale, local news, and regular arrival scenes. Only earned scenes can enter the list. A preparation scene uses the ID of its preparation. A quest completion scene uses the ID of its quest.

An arrival scene has the ID `arrival-` followed by the ID of its regular. Each scene ID is unique across preparations, quests, local news, chapters, the finale, and arrivals. Each ID occurs once in the list. Preparation scenes, closing scenes, and the finale keep one story order. Each closing scene follows the four preparation scenes of its chapter. Quest completion scenes, local news, and arrival scenes can be at any position in the list.

The completed preparations decide which chapters are complete. The completed quests and their delivery order decide the local news. A scene ID must stay the same after release. If a save does not list a scene as unread, the game treats that scene as read.

A reset clears the unread scenes with the rest of the state. An import replaces them only after full validation and confirmation.

The state records these items:

- the day and the merges of that day
- the March quests that opened
- the random seed
- the cell and the ingredient of each open rat hole
- the number of gifts
- the evening guest, the guest of the last evening, and whether the day had its booked delivery
- the last night report, the seasonal sources that left at that closing, and whether the player saw its morning dialog
- the result of act 1, after the supper: the purse

The purse can hold a whole number below zero. A reload, an export, and an import keep all of these items. The saved day is never later than 1 May, and 1 May comes only after preparation 24. The saved day cannot precede the opening date of a chapter with a paid preparation. A served supper requires 1 May at or after 20:00. A report of a closing without a rat is seen at once, and only a Sunday report has a rat. Only a closing with the thief rat uses and advances the seed. A failed action does not change the seed.

The state records the completed quest IDs in delivery order. Each ID occurs once. Each completed quest has its prerequisites earlier in the list, and its opening date and its holiday are not later than the saved day. A quest of a later act cannot be in the list. Every completed preparation has its necessary quests in the list. Saved finish choices name only unlocked finishes. Export and import include the quest progress and the board layout.

An explicit new game or a confirmed import replaces only the current save, in one write. A normal save never replaces a current save that is not valid. In that case, Options offers Retry saved game, and the game blocks changes until recovery. An import or a new game also ends the recovery.

In these cases, the game clears the new-dish marker of the recipe book. The game also clears the delivery effects of the previous board:

- The game imports a save.
- The player resets the game.
- The game adopts the game of another tab.

If the browser offers locks on a secure origin, each game change uses one browser lock that all tabs share. Before a change, the game checks the latest saved state. If another tab has changed the state, the game shows that progress. The game cancels the action that waits for the lock. The player can then do a new action on the updated board.

The game saves a preparation before its progress becomes active. The game also saves the preparation before the story and the room change appear. If the write fails, the preparation does not spend coins, does not give progress, and does not show a reward. The player can try again if storage is available.

## Deployment

The game supports Chromium-based browsers: Chrome, Edge, and other browsers built on Chromium. The project does not test other browsers. The HyperText Markup Language (HTML) file has a Content Security Policy (CSP). The CSP and relative paths support static hosting.

The project publishes the game at https://satyrlord.github.io/scary-snacks/. [`DELIVERY.md`](DELIVERY.md) gives the Pages workflow.
