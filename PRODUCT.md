# Scary Snacks

<!-- impeccable:product-schema 1 -->

## Platform

web

## Purpose

Scary Snacks is an original single-player merge game in a fictional Transylvanian bistro. The user selected Scary Snacks, local foods and drinks, black cats, bats, and the style of everyday Romanian neighbours. The tone is cosy and slightly eerie.

## Stack

The game uses TypeScript 7 modules in strict mode, HyperText Markup Language (HTML), and Cascading Style Sheets (CSS). The repository has no JavaScript source files.

Node.js 24 runs the tools and the tests from TypeScript directly. Node.js removes the types from the three runtime modules for the browser. Node.js also serves and packages files locally.

The application has no runtime package and no backend. Playwright, TypeScript, Sharp (for image variants), and the Node.js type definitions are development dependencies.

## Play

The board has six columns and seven rows. Customer requests are deterministic. The game has five ingredient sources (generators), 30 dishes and drinks, four characters, 12 pantry spaces, and 24 preparations over six chapters. Each dish or drink has an English name. If English has no name for the dish, the dish has the Romanian regional name with its diacritics. The initial layout, the prices, the progression, the characters, and the dialogue are new works.

Serving earns coins. Preparations unlock generators and story. Each preparation visibly changes the bistro.

Each food has an explicit menu price for its portion. Flour and cornmeal earn 2 coins each. Elderflowers earn 1 coin. Prepared dishes earn more according to their ingredients, work, and portion. A new ordinary order pays the sum of its food prices, with no fixed order bonus or merge-stage multiplier. Clearance sales give one quarter of the menu price, rounded down, with a minimum of one coin. Sources cannot be sold. The optional level and quest rewards keep their authored values.

Each preparation has a defined work scope, material and labour costs, and estimated active person-hours. Its coin cost is materials plus labour. It does not increase with its position in the story. The cost model uses roughly one coin per Romanian leu as a reference scale. It models reuse of existing furniture and supplies. It abstracts running costs and keeps free production. The [economy record](docs/economy.md) gives the quantities, portions, primary sources, and assumptions.

Each half person-hour of authored work adds one served order and two merges to the cumulative goals. This is a play conversion, not measured player time or a waiting timer. Story shows each total and target. Cost details shows the work and budget. Service and merges are lifetime totals. They carry across chapters and are never spent. Only a successful ordinary order service adds service. Only a valid merge adds a merge. Sales still clear space and earn coins, but sales alone cannot complete a preparation.

The engine checks coins, both goals, any named quest prerequisite, and space for an unlocked source together. A failed check changes nothing. Payment spends coins once and advances one preparation. All three ordinary orders keep their requirements and rewards. Existing completed preparations stay complete, including those in saves with zero recorded service or merges. Only the remaining preparations require the new goals. The game never invents missing counters from XP or finished preparations. Authored goals must be nonnegative integers and must not decrease in campaign order. Unknown and cyclic quest prerequisites are invalid. The current campaign keeps quests optional.

Mara, Ilie, Eszter, and Sorin each have a three-request quest arc across the six chapters. Story opens Neighbour quests. Each neighbour has at most one active request, in authored order. A request shows its purpose, exact item quantities, and coin reward. Deliver takes all required items from the board in one change. Stored items must return to the board first. A missing item, stale request, repeated delivery, or overflowing reward changes nothing. Quests give coins once and give no XP. They keep all three ordinary orders and their random seed. The player can continue preparations and ordinary service without completing a quest.

Ilie also offers an optional bread tasting after his arc. Accept places one Tasting flour bin on the board, or in the pantry if the board is full. If both are full, nothing changes. This borrowed source takes no permanent source entitlement. It gives Tasting flour immediately and without a limit. Tasting flour, Tasting dough, and Tasting pogăcele have separate IDs and use the matching food pictures. They never enter ordinary orders or the permanent recipe collection. The source can move and enter the pantry, but cannot be sold. Before delivery, a review lists the source and leftover tasting items on the board and in the pantry. Confirmation consumes the requirements, returns only those exclusive supplies, and gives the reward in one change. A stale review changes nothing.

The story journal holds optional introductions for all four neighbours, plus the opening and completion scenes of finished quests. Reading, skipping, and replaying a scene give no reward. Quest scenes do not resume automatically after reload. Their completion remains recorded, and the journal can replay them. A failed quest save keeps the current session and shows an unsaved warning with Retry save. Export includes that session. Reload restores only durable progress.

The campaign has six chapters with four preparations each. Story shows the title and the objective of the current chapter. It also shows one step for each preparation of the chapter: done, now, or not yet. A chapter opens at its first preparation and needs no separate payment. Its closing scene stays hidden until the chapter is complete. Each chapter names one regular neighbour quest that opens during the chapter. That quest stays optional.

The payment for the last preparation of a chapter also records the chapter as complete and queues its closing scene, in one change. After preparation 24, the finale waits after the closing scene of chapter 6. The game records the finale once. A failed payment queues nothing. After the reveal of the payment, the scene that the payment earned opens. If the player opens another dialog first, the scene waits. Finish or Skip moves a scene to the journal and opens the next waiting scene. Close and Escape leave the scene waiting. Story shows the first waiting scene with Read now. After a reload, Mara's line says that a scene is waiting. The next preparation and all orders stay available while a scene waits. Reading, skipping, and replaying give no coins, XP, or items. If a saved scene has no content, the game shows a recoverable error and keeps the progress. It does not invent story text.

The journal lists each chapter that is open or complete. A running chapter shows its opening context, its goal, its neighbour help when that quest is open, and the state of each preparation. A complete chapter shows its payoff, its neighbour help, its preparations with the name of each room change, and its closing scene. After the supper, the journal also holds the finale. The finale names the result of each chapter, and all four neighbours speak. It ends with a return to the kitchen. Ordinary orders continue after the supper.

Merges, service, and preparations earn experience points (XP). Every 100 XP raises the level by one. Levels 2 through 10 each give one optional reward of 20 coins. The House book shows the level, XP progress, the next reward, and earned rewards. Its copper mark stays visible while a reward is available. Each Claim gives the coins and records its reward ID in one change. Rewards give no XP. Claims are independent and never automatic. Unknown, unreached, repeated, and overflowing claims change nothing. A reward that cannot fit within the coin limit stays available. After level 10, levels continue without more rewards.

A failed reward save keeps the claim and coins in the current session. The level panel says that the session is not saved and offers Retry save. A later successful save includes that claim. Export also includes the current session. Reload can lose unsaved progress.

The room is the home of the game and its reward. On phones, the kitchen is a drawer over the room. On wider screens, the kitchen is a panel beside the room. The room shows one painted area of the bistro, as the completed preparations leave it:

- The front room starts unfinished, with cobwebs and a few small spiders in the broken window. The preparation "Fix the broken window" clears them. One resident spider stays under the upper wall shelf permanently.
- The courtyard opens with the preparation "Clear the courtyard" in chapter 4.

Each area has one painting for each of its states. The room shows the state of the highest completed preparation in that area. The room shows the area of the latest change. Preparations 13 to 16 and 18 to 23 show the courtyard. Preparations 17 and 24 return to the front room. An area switch in the corner of the room shows the other area. A locked area shows only its name and the preparation that opens it. A small "New" pin marks the latest change in the area. The pin gives the short name of the change, for example "New: lamps lit". The pin points at the edge of the change and does not cover the change. If the name does not fit, the pin says only "New".

To merge, the player taps an item and then a matching item, or drags an item onto a matching item. A tap on an empty space moves the selected item there. A drag onto a different item swaps the two items. A tap on a dish in an order opens its item dialog. "Show me on the board" shows the next step to make the dish. "Find a match" in Mara's line shows a pair to merge.

One tap on an ingredient source takes one ingredient and selects the source. Each further tap takes another ingredient. A drag moves the source and takes nothing. If the board is full, the source takes nothing and Mara says why.

A new game starts with eight blocked edge cells on the six-by-seven board: four dusty clutter wrappers and four anchored ingredients. Webs cover the wrappers until "Fix the broken window" is complete. A pair merge clears each wrapper that shares a side with its destination. The wrapper reveals its own ingredient. An anchored ingredient stays in place until a matching movable ingredient merges into it. That merge releases the anchor and leaves the normal successor. An anchor cannot move, enter the pantry, be sold, fill an order, or fill a quest. Reveals give no extra XP or merge credit. They need no free space. Clearing is optional for campaign progress and orders. A blocked cell is not a free space for any placement or space count. The board hint can point to a matching anchor. Converted saves keep an open board with no obstacles.

Each chain keeps one source. All sources gain stage-two output when preparation 12 completes and stage-three output when preparation 20 completes. Lower outputs stay available. The selected source has one Take button for each earned output, with its picture and name. A successful Take sets the output for later taps on that source. A new or converted source starts with stage one. An upgrade, a move, or pantry storage keeps the chosen output. Production is free and immediate, and does not change the random seed. Sources cannot merge or be sold.

An upgrade uses no board space and applies to sources in the pantry. Outstanding orders keep their requirements and rewards. Before payment, the interface names no future tier, output, or upgrade preparation. After payment, the story completion message names each new output. A failed take changes no state or chosen output and does not reveal an unearned output.

The screen shows one Pay control at a time. If the story card is on the screen, only the story card has Pay. If the story is in a sheet, Mara's line has Pay. Mara's line offers the next preparation by name with a Pay button. Mara's line does this if all requirements are met and the player has not selected a tile. If the player selects a tile, Mara's line shows the actions of that tile. While the offer shows, the Story button has a copper dot. If the player cannot pay yet, Mara's line does not change. Pay in Mara's line works like Pay in the story.

After the player pays for a preparation, its story plays. When the story ends, the drawer lowers on phones. Next, the new painting fades in over the old painting. Next, the pin marks the change. Last, the drawer rises again on phones. If the browser requests reduced motion, the game shows the result at once. The reveal does not spend coins and does not earn coins a second time.

Every preparation repaints one room. Miez sits on the windowsill of the front room. When the supper is ready, a second black cat sleeps on the counter. Captions describe every earned change. Captions stay available if a painting cannot load. If a later state has no accepted painting, the room shows the latest earlier painting of its area. The room then shows the caption of the new state. Authored lamps and lanterns light the room at story milestones. The game has no time-of-day clock.

The game has unlimited energy. The game has no timers, no purchases, no ads, and no accounts.

The House book holds three free decoration choices. Preparation 9 opens shelf tableware (Blue bowls or Green bowls). Preparation 22 opens the courtyard table cloth (Red embroidery or Blue embroidery). Preparation 24 opens the final dresser flowers (Wildflowers or Lilacs). The existing paintings supply the defaults. Choices do not change progress or rewards. The player can change them again at any time.

Each decoration has a preview with Apply and Cancel. Preview affects only the editor. Apply changes one slot only after the save succeeds. Cancel, Escape, and Close discard the preview and return focus to the slot in the House book. A failed write keeps the prior choice and offers Retry. The room and the House book thumbnail use the same saved choice. A locked slot names the preparation that opens it.

## Planned progression work

The repository-only backlog at `docs/specs/README.md` records 15 feature specifications and the product direction. The direction is to include the features that players expect in a story-driven merge game. The direction is also to differ clearly from such games in the points that players dislike. The backlog index lists those points.

The game implements spec 001 (visible renovation and areas), spec 002 (decoration choices), spec 003 (generator progression), spec 004 (level rewards), the independent slices of spec 005 (character quests, introductions, and a temporary tasting source), the work-based goals and economy of spec 006, the board clearing of spec 007, and the chapter story and finale of spec 008. Spec 006 also supplies a legal campaign balance fixture with price and policy comparisons. Human pacing remains unverified. This document owns the implemented behavior. Quest scene continuation waits for spec 009. The repository-only art plan, `docs/specs/001-room-states-art-plan.md`, defines the 25 painted room states. Spec 011 is partly implemented: the game has the discovery cloches, the notices, and the order help. The other specs remain planned work.

## Identity

The game has 33 generated Portable Network Graphics (PNG) masters. They provide these items:

- food
- portraits
- 25 painted room states
- two decoration edit paintings, sampled only within their authored regions
- the timber tabletop
- the embroidered runner
- cat sprites and bat sprites
- board clutter, with a web overlay and a twine overlay

The room states are front-room-00 to front-room-12, front-room-17, front-room-24, courtyard-13 to courtyard-16, and courtyard-18 to courtyard-23. Each state has a painting.

The game ships AV1 Image File Format (AVIF) and WebP variants of the masters. The variants have the sizes that the screens need. The variants come only from these masters. The local folders `private/` and `analysis/` are not release inputs.

The game self-hosts the Inter font and Grenze Gotisch font as Web Open Font Format 2 (WOFF2) files. The files are lossless repackagings of the downloaded fonts. Each font has its SIL Open Font License (OFL) 1.1 license text.

The user selected the title. A preliminary name search is not trademark clearance. The project gives no guarantee against intellectual-property claims.

## Access and persistence

The game supports pointer, keyboard, and touch controls. The game supports Light, Dark, and System appearance, visible focus, and reduced motion. Forced colours (Windows high contrast) keep the spaces and the selection visible.

The browser stores the saves, the theme preferences, and the area that the player chose with the area switch. The area is a display preference. The area is not part of the save. The next reveal moves the room to the area of the change.

If the browser blocks storage, the game is playable for the current visit only. The House book and each change say that the game is not saved. Preparations and decoration choices need a successful save, so they do not complete.

If the game is open in two tabs, each tab follows the latest save. A tab does not overwrite the latest save with an older board. When a tab follows the latest save, an open dialog or a drag in that tab ends.

If the game data cannot load or does not pass its checks, the kitchen says so and offers Try again. The kitchen also disables the Story, Recipes, Pantry, and House book buttons. The game does not read or write the save in that case.

An import validates the envelope and the state of the save. An import rejects malformed saved data and keeps the current save. An import enforces a size limit. Load, save, import, and reset use only the save keys of this game. They do not change other browser data.

Current saves have game state version 8 in envelope version 7, at `scary-snacks-save-v7`. Load uses the newest key that exists. Valid state-2 through state-7 saves use envelopes 1 through 6 at the matching `scary-snacks-save-v1` through `scary-snacks-save-v6` keys. They convert through each intervening state to state 8. Each step validates its input and output. Conversion keeps progress, items, pantry positions, counters, outstanding orders, choices, and reward claims. It adds default decorations, an empty `outputChoices` map, and an empty `claimedLevelRewards` list only where needed. Existing XP makes level rewards available, but conversion gives no coins. Conversion gives each older save the open board layout with no resolved obstacles. New games use the authored blocked layout. State 7 records the layout ID and resolved obstacle IDs. A layout ID must remain stable after release.

State 8 adds the list of waiting scenes. The list holds only the closing scenes of complete chapters and, after the supper, the finale. Each scene ID occurs once, in story order. Chapter completion is not stored: the completed preparations give it. Conversion to state 8 adds an empty list. Earlier chapters stay complete, and the journal replays their scenes. A finished game gets the finale in the journal. Conversion queues no old scene, gives no reward, and claims no reading. Scene IDs must remain stable after release.

An order can have the pricing marker `menu-1`. That marker selects the exact authored menu-price sum. An unmarked order uses the original formula: 12 plus the sum of 3 times 2 to the power of each item's stage minus one. Unknown, null, and explicitly undefined markers are invalid. States 2 through 5 accept unmarked orders only. State 6 accepts both kinds together. Existing orders retain their exact requirements, reward, customer, and ID. Serving one pays its existing quote and creates a menu-1 replacement with the same seeded selection rules. This optional field requires no save rewrite or conversion step. A future price revision must retain exact validation for each earlier quote revision.

State 7 keeps the quest progress first recorded in state 6: unique completed quest IDs, legacy-satisfied quest IDs, and active temporary sources with the next position in their output sequence. The two completion lists cannot overlap. A temporary quest has exactly one live source while active and no exclusive items after completion. Conversion marks regular quests associated with completed preparations as legacy-satisfied. It gives no reward and inserts no source. Their scenes are available in the journal. No preparation reopens. Conversion writes the current save before play uses it. Every older key stays unchanged. A failed conversion or write offers Retry saved game in the House book and blocks game changes until recovery. An invalid newer save never restores older progress. Export and import include quest progress and the board layout. An explicit new game replaces only the current save, in one write.

A load, an import, or a change from another tab can find duplicate customer names in a valid save. In that case, the game replaces each duplicate with an unused neighbour. The order requirements, the rewards, the progress, and the random seed stay unchanged. A load alone does not rewrite the save.

The game clears the discovery notification and the serving effects of the previous board in these cases:

- The game imports a save.
- The player resets the game.
- The game adopts the game of another tab.

On supported secure origins, each game change uses one browser lock that all tabs share. Before a change, the game checks the latest saved state. If another tab has changed the state, the game shows that progress and cancels the waiting action. The player can then make a new action on the updated board.

The game saves a preparation before the progress of the preparation becomes active. The game also saves a preparation before the story and the scene change appear. If the write fails, the preparation does not spend coins, does not grant progress, and does not show a reward. The player can retry if storage is available.

## Deployment

The game supports Chromium-based browsers (Chrome, Edge, and other browsers built on Chromium). The project does not test other browsers. Relative paths and the Content Security Policy (CSP) in the HTML support static hosting.

The project publishes the game at https://satyrlord.github.io/scary-snacks/. [`DELIVERY.md`](DELIVERY.md) gives the Pages workflow.
