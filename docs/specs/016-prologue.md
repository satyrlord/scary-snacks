# 016: The prologue

Status: Implemented.

## Outcome and scope

A new game starts with the prologue, before act 1.
On Friday 20 December of year 0, Mara's grandmother, Mamaia Paraschiva, dies in the village. She leaves her old bistro to Mara.
In the following weeks, Mara cooks in the kitchen of her parents' flat in the city. She cooks for the funeral, for the winter holidays, and for the memorial service of the fortieth day.
On Thursday 13 February of year 1, her parents give her some money and their blessing. Mara leaves the city to open the family bistro again. Act 1 starts on 15 February.

The prologue is a short playable story. It has seven events. Each event is one play day with a meal on the board.
The prologue teaches the merge loop through play. The prologue has no tutorial text.
The prologue is calm. It has no purse, no clock, no upkeep, and no night.

The tone stays cosy and slightly eerie. The death of the grandmother is sad, but the scenes stay warm and comic.
The grandmother's voice continues in her recipe notebook, which Mara reads during the prologue.

The feature covers these parts:

- the seven events, their dates, their boards, their quests, and their scenes;
- two new dishes: colaci and turte;
- the play rules of the prologue, and the order of its scenes;
- the change from the prologue to act 1, and the skip of the prologue;
- the prologue discoveries in act 1;
- the family kitchen in the room, and Miez;
- the prologue in Story and in the journal;
- the saved prologue progress;
- the art of the prologue;
- the content checks, the balance run, and the browser checks.

The feature does not include these parts:

- a clock, coins, preparations, or a night in the prologue;
- a return to the prologue after act 1 starts.

## Events

Each event has a date, an opening scene, an authored board, one to three event quests, and a closing scene.

| Number | Date | Event | Diet |
| --- | --- | --- | --- |
| 1 | Monday 23 December, year 0 | The funeral meal (pomană) in the village | Fasting day |
| 2 | Tuesday 24 December | Christmas Eve | Fasting day |
| 3 | Wednesday 25 December | Christmas dinner | None |
| 4 | Tuesday 31 December | New Year's Eve | None |
| 5 | Monday 6 January, year 1 | Epiphany (Boboteaza) | None |
| 6 | Saturday 25 January | The memorial service of the fortieth day | None |
| 7 | Thursday 13 February | The farewell dinner | None |

A fasting day applies to each quest of its event: no dish with the meat, dairy, egg, or fish tag. Wine and garlic are permitted.
The opening scene of event 1 also tells the death of the grandmother on Friday 20 December, the day of Saint Ignatius.
The fortieth day after the death is Tuesday 28 January. The family holds the memorial on the Saturday before it, because Saturday is the day of the dead in the Orthodox week. Many families move a memorial this way.
The calendar shows no other dates of the prologue. Spec 015 gives the weekdays.

### Story outline

The scenes follow this outline. The update-game-content skill writes the dialogue.

1. The funeral meal. A telephone call came on 20 December. Mara and her mother cook the funeral food in the city and drive it to the village.
   At the funeral, Mara sees the closed bistro for the first time in years. Miez, the grandmother's black cat, waits on its steps.
   The scene illustration of the funeral shows the four core characters: Mara, and Ilie, Eszter, and Sorin among the guests. Ilie, Eszter, and Sorin do not speak to Mara in the prologue.
   After the meal, Miez walks into Mara's bag and comes to the city.
2. Christmas Eve. Children sing carols at the door. Mara's father pays them in colaci and complains that the songs get shorter each year.
3. Christmas dinner. The family eats the grandmother's recipe for cabbage rolls from her notebook. The rolls taste nearly right.
4. New Year's Eve. At the midnight table, the family talks about the bistro. Mara's father wants to sell the bistro. Mara's mother says nothing, which is worse.
5. Epiphany. The priest blesses the flat. The frost is hard. Mara reads the notebook again and finds a note to her in it.
6. The memorial of the fortieth day. The family goes back to the village. A notary reads the will: the bistro belongs to Mara. Mara decides to open the bistro again.
7. The farewell dinner. Mara's mother cooks the cabbage rolls from the notebook again, and this time they taste right.
   Mara's parents give her the starting gift and their blessing. Mara leaves for the village with Miez in a basket.

The prologue does not explain the mystery of the village. The scenes can show small strange details. For example, the notebook has a recipe page that nobody can read.

### Boards and quests

Each event has its own sources and its own authored board. The sources stand in the source tab of spec 003, and the board holds the prepared dishes of the event.
The prologue sources are the pantry of the family flat. They can belong to chains that act 1 opens later.
The seasons of spec 017 do not apply in the prologue. The event gives its sources.

The quests of an event belong to Mama, Tata, or Mara. An event has at most one quest for each character.
A quest of Mara cooks for the guests of the event. It shows the scene illustration of its event in place of a character sketch, as the quests with a scene illustration in act 1.

| Event | Sources | Prepared dishes | Quests, in authored order | New part of the loop |
| --- | --- | --- | --- | --- |
| 1 | Legume sacks | Colivă, Colaci, Green beans | Mama: 1 Colivă and 1 Colaci. Mara: 1 Bean dip. | Serve, a take, and merges of two matching dishes |
| 2 | Windmill, Herb basket, Cornucopia | Loaf, Herb bunch, Dough, Fruit bowl | Tata: 2 Colaci for the carol singers. Mama: 2 Turte. | A mixed dish from two chains |
| 3 | Butcher's hook, Vegetable crate, Cornucopia | Minced pork, Pickled cabbage, Sweet dough | Mama: 2 Cabbage rolls. Tata: 1 Sausages and 1 Cozonac. | A larger meal with more chains |
| 4 | Butcher's hook, Vegetable crate, Pickle barrel, Windmill, Milk churn | Vegetable basket, Pickled green tomatoes, Cottage cheese | Mama: 2 Stuffed peppers. Tata: 1 Sausages and 1 Mixed pickles. Mara: 2 Papanași. | Three tickets at the same time |
| 5 | Hen's nest, Windmill, Herb basket | Chicken broth, Socată | Tata: 2 Chicken noodle soup and 1 Linden tea. | A small meal, with no new part |
| 6 | Windmill, Herb basket, Cornucopia, Legume sacks | Flour, and three blockers | Mama: 2 Colivă. Mara: 2 Colaci and 1 Bean dip. | Blockers |
| 7 | Butcher's hook, Vegetable crate, Windmill | None | Mama: 2 Cabbage rolls. Tata: 2 Pogăcele for the journey. | No prepared dish: the player plans each route |

The source tab has each listed source, in the listed order. The board has one of each listed prepared dish. The other cells are empty.
In event 1, the first quest is ready to serve, so the first action of the game can be Serve.
The second quest needs four takes and four merges of matching dishes. Event 1 has no recipe merge.

Event 6 has three blockers: the things from the grandmother's house. They use the crate, sack, and linen art of the act 1 blockers, with no webs.
The crate holds a Loaf, the sack holds a Fruit bowl, and the linen bundle holds a Herb bunch.
Each blocked dish is a part of a quest dish of event 6. So the shortest route clears each blocker with a recipe merge, for example Flour into the blocked Fruit bowl to make Colivă.
A cleared blocker gives no coin.

The quantities and the prepared dishes are levers. The content check and the balance run in "Size and route" control them.

## New dishes

The prologue adds two mixed dishes of spec 012. They have no content tags, so they suit a fasting day.

| Dish | ID | Recipe | Art |
| --- | --- | --- | --- |
| Colaci, the ritual bread rings with a sprig of basil | `mixed_colaci` | Loaf and Herb bunch | Sweets atlas, cell 5 |
| Turte, the Christmas Eve wafers with honey and walnuts | `mixed_turte` | Dough and Fruit bowl | Sweets atlas, cell 6 |

Colaci serve as the ritual bread of the funeral and the memorial, and as the bread rings of the carol singers.
The recipe book discovers each new dish by the rules of act 1.

## Play rules

The prologue uses the board, the tickets, the recipe book, and the merge rules of act 1, with these changes:

- The prologue has no purse. The masthead shows the date and no coins.
- Each take is free. A full board refuses a take, as in act 1.
- An event quest pays nothing. Its ticket and its dialog show Serve, as the supper does.
- An event quest has an opening, as other quests. It has no reply scene. The scenes of the event replace the replies.
- A cleared blocker gives no coin.
- The prologue has no clock. Merges do not move the time. The masthead shows the date of the current event only, for example "Tue 24 Dec".
- The prologue has no upkeep, no night, no rats, no preparations, no recovery quest, and no repeating quests.
- The bat does not cross.
- The item help, "Find a match", and the blocker help of act 1 are available. The prologue adds no other help.

### Event order and scenes

The scenes of the prologue are pending scenes until the player completes them.
The prologue scenes have a story order: opening 1, closing 1, opening 2, and so on to closing 7.
The story order controls the reading. Only the first pending prologue scene can open. A later pending prologue scene waits until the player completes each earlier one.

The game earns the prologue scenes at these times:

- A new game earns opening 1.
- The completion of event N, for N from 1 to 6, earns closing N and opening N+1.
- The completion of event 7 earns closing 7.

The prologue goes in this sequence:

1. A new game is at event 1. Opening 1 is pending, and the quests of event 1 are open.
   The new game opens opening 1 immediately.
2. The quests of an event get the tickets in authored order. The ticket rules of act 1 apply. The player can serve the quests of an event in any order.
3. When the player serves the last quest of events 1 to 6, the event is complete. In the same change:
   1. Closing N and opening N+1 become pending, after the earlier pending scenes.
   2. The date moves to the date of the next event.
   3. The sources and the authored board of the next event replace the sources and the board. The dishes of the old board leave the board: the family eats the leftovers.
   4. The sources and the prepared dishes of the next event become discovered. The blockers add no discovery and remove no discovery.
      As in act 1, a merge that clears a blocker discovers the result of the merge.
   5. The quests of the next event open.
4. After that change, the first pending prologue scene opens immediately. It is closing N, or an earlier scene that the player did not complete.
5. When the player completes a prologue scene, the next pending prologue scene opens immediately, if one is pending.
6. If the player closes a scene with Close or Escape, the scene stays pending, and no other scene opens. Play on the board continues.
   Story offers the first pending prologue scene with Read now.
7. A reload opens no scene. The pending scenes stay in story order.

When the player serves the last quest of event 7, the prologue waits for its last scene:

- Closing 7 becomes pending. The first pending prologue scene opens immediately.
- The game stays at event 7. The board of event 7 stays, and the counter has no ticket.
- The date stays on Thursday 13 February. No quest of act 1 opens.
- Takes and merges on the board work by the prologue rules. They change nothing else.

Closing 7 is the last scene in story order. So when it opens, the player has completed each other prologue scene.

A quest has one delivery. A quest of a later event does not open before its event.

## From the prologue to act 1

When the player completes the closing scene of event 7, act 1 starts in the same change:

- The board becomes the authored initial board of act 1.
- The purse holds the starting gift of Mara's parents.
- The clock shows Saturday 15 February at 07:00. The day number is 1.
- The room shows the front room in its first state.
- The first quests of act 1 open.

The start of act 1 happens once. The completion of a scene that is not the first pending prologue scene changes nothing.
A journal replay of a prologue scene changes nothing: the board, the purse, the date, and the pending scenes stay the same.
If the player closes closing 7 with Close or Escape, the scene stays pending, and act 1 does not start. The counter offers the scene with Read now. The Story sheet also offers the scene.

When act 1 starts, no prologue scene is pending. The journal keeps the prologue scenes for replay.

The player can also skip the prologue at any time in the prologue, with Skip tutorial and a confirmation. The skip starts act 1 by the same rules, with each event quest served and the discoveries of a full run of each event in the recipe book. The journal keeps each prologue scene for replay. `PRODUCT.md` gives the rules, and `DESIGN.md` gives the link and its confirmation.

The starting gift is 20 coins. It lets the bistro pay for its first takes, so the first days of act 1 do not need recovery teas.
The gift is a lever from 10 to 20 coins. Its value keeps the purse of the act 1 balance run in the balance band. `docs/economy.md` records the balance evidence.

### Prologue discoveries in act 1

The recipe book keeps each dish that the player discovered in the prologue.
A prologue discovery can belong to a chain that act 1 has not opened yet. The discovery does not open its source.
The recipe book shows such a dish with its recipe and "The [source] comes to the bistro later." It shows no "Show me on the board" for it.

The act 1 discovery check counts the sure prologue discoveries as known dishes: the prepared dishes of the event boards and the dishes of the event quests.
It does not count a dish that a player can make in the prologue but does not have to make.
The other checks of act 1 do not change. A quest of act 1 still opens only when the sources of its dishes are open.

## Size and route

The prologue is short. The content check counts the merges of each event from the raw staples:
for each portion of each event quest, the merges that the dish needs from its sources, as the menu price counts them.
The count does not subtract the prepared dishes or the blocked dishes. So the count is the upper limit of the work of an event.

| Event | Merges from raw staples |
| --- | --- |
| 1 | 14 |
| 2 | 16 |
| 3 | 17 |
| 4 | 22 |
| 5 | 17 |
| 6 | 21 |
| 7 | 24 |
| All | 131 |

The content check limits each event to 40 merges and the prologue to 250 merges.

The content check applies the discovery rule of act 1 to each event quest, with these known dishes:
the prepared dishes of the board of the event and of each earlier event, the sources of the event, the dishes of the quests of earlier events, and the dishes of the earlier quests of the event.
A quest dish that the board of the event holds in the full quantity passes the rule.
The content check also applies the diet of each event, and the quest-size rule of act 1: at most three portions for each quest, and at most two portions of one dish.
The content check confirms that each source of an event, each dish of an event board, each blocked dish, and each quest dish is an item of the game data. An event board holds no source.

The balance run plays the prologue from a new game with legal actions only, with no injected items or coins.
It serves each quest when its dishes are ready, completes each scene, and records the merges, the takes, and the free cells of each event.
It continues from the state at the start of act 1 into the act 1 balance run.

## Room

The prologue room has one area: the family kitchen, in a flat of a city apartment block.
The area switch does not show in the prologue.
The kitchen window shows the city in winter. The door to the balcony shows the pickle barrel.

The family kitchen has four painted states:

| State | Events | Look |
| --- | --- | --- |
| Mourning | 1 and 6 | The mirror has a cloth over it. A candle burns beside a photograph of the grandmother with a black ribbon. |
| Christmas | 2 and 3 | Fir branches, colaci, and the carol star of the children |
| New year | 4 and 5 | Streamers from the midnight table, and frost on the window |
| Farewell | 7 | A packed suitcase and an empty cat basket by the door |

The room shows the state of the current event. The change of state happens with the change of event. With reduced motion, the change is immediate.

Miez appears in the family kitchen from event 2. Miez sits on the windowsill and sleeps on the radiator.
The Miez card in Story works as in act 1. In the farewell state, Miez sits next to the cat basket and refuses to go in.

## Story and journal

Story shows the prologue as one part before chapter 1.
The prologue part shows its title, "Prologue: The inheritance", and one step for each event: done, now, or not yet.
While the game waits for closing 7, step 7 shows done. The counter and the Story sheet offer the first pending prologue scene with Read now. The Story card does not repeat the counter action.
Story shows no Pay and no cost details in the prologue. Mara's line names the meal of the current event.

The journal lists the prologue before chapter 1. The prologue entry gives each event, its opening scene, and its closing scene.
Unread scenes shows only the first pending prologue scene. The later pending prologue scenes show there when the earlier ones are complete.
The journal can replay each completed prologue scene. A replay gives no reward.
Each prologue scene shows the scene illustration of its event.
An event quest has no reply, so it has no entry in Earlier conversations.

During the prologue, the journal has no Neighbours group. Mara has not met the neighbours yet.
In act 1, the Neighbours group keeps its rules. It does not list Mama or Tata, because they are not neighbours.

### The notebook

The recipe notebook shows as two painted notebook pages. Each page is a scene illustration of one scene, in place of the illustration of its event:

| Page | Scene | Look |
| --- | --- | --- |
| The cabbage rolls | Opening 3 | An open notebook. The left page has the recipe for cabbage rolls in faded ink, with a small drawing of a roll and a grease stain. The right page has a short old prayer in Cyrillic letters, under a small red cross. Mara cannot read it. |
| The note to Mara | Closing 5 | The same notebook, open at a later page. A short note in handwriting fills the page, beside a pressed basil sprig. |

The handwriting is part of the painting. The game adds no handwriting font.
The recipe and the note show the look of handwriting. The Cyrillic page shows the authored prayer recorded in the asset prompt. Nobody in the family can read that page.
The recipe and the note have real scene text: Mara reads them aloud in her own lines, in quotation marks. The notebook is not a speaker and has no portrait.
The page with the Cyrillic letters is Romanian in the old Cyrillic alphabet, copied from an old church book. Romanian used this alphabet until about 1860, so Mara cannot read it. The prologue does not explain the page.
Each painting has a text description for screen readers. A replay in the journal shows the same painting and text.

## Characters

Mara's mother and Mara's father speak in the prologue. They have portraits, and they have no sketches.
In place of a sketch, the dialogs of Mama and Tata show an old family photograph of each parent.
Victor draws the sketches in the bistro, and he does not meet Mara's parents. So the parents show only in photographs.
They have no names. Their speaker labels are "Mama" and "Tata", as Mara calls them.
The grandmother is Mamaia Paraschiva. "Mamaia" is a regional word for a grandmother. The name Paraschiva means Friday, and she dies on a Friday.
The name refers to Sfânta Vineri, the kind old woman of the folk tales who helps travellers.
Paraschiva does not speak in a scene. Her words come from her recipe notebook, which Mara reads aloud. "The notebook" gives the presentation.
Mara's parents do not move to the village. In act 1, letters and parcels from the parents can appear in later content.

Ilie, Eszter, and Sorin show only in the scene illustration of the funeral. They do not speak, give quests, or meet Mara in the prologue.
Their introductions in act 1 do not change.

## Art

Each picture follows the art rules of the existing masters. Each picture has records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.

- Four painted states of the family kitchen, in the format of the room states.
- One sheet of four event scene illustrations, in the format of the quest scene sheets:
  the village churchyard in snow, with Mara, Ilie, Eszter, and Sorin among the guests (events 1 and 6), the carol singers at the door (events 2 and 3), the midnight table with frost on the window (events 4 and 5), and the bus stop at dawn (event 7).
- Portraits of Mama and Tata.
- One family photograph of Mama and one of Tata, in place of the character sketches.
  Each is an old studio photograph in sepia: one person in Transylvanian folk dress, a painted backdrop, a plain wooden floor, soft grain, and worn paper edges.
  The person looks at the camera with the serious face of an old studio portrait. The photograph is a rectangle with its paper border, not a transparent cut-out.
- The photograph of Paraschiva, as a detail of the mourning state, in the same style.
- One sheet of two notebook pages, in one row of two cells of the quest scene format. "The notebook" gives each page.
- Colaci and turte in cells 5 and 6 of the sweets atlas.

The blockers of event 6 use the existing blocker art.
The review examines each picture at its game size on a phone, in both themes. The user accepts each picture.

## Data and state

- `tools/create-original-data.ts` authors the events, their boards, their quests, their scenes, the two new dishes, and the starting gift.
- `src/model.ts` gives the current part of the game: the prologue or act 1. The module also gives the current event, its date, and the prologue scenes in story order.
- `src/engine.ts` applies the prologue rules: free takes, Serve, no purse, no clock, the change of event, the wait at event 7, and the start of act 1.
- `src/content.ts` checks the boards, the size of each event, the discovery rule, the diets, and the quest-size rule.
- `tools/campaign-balance.ts` plays the prologue before act 1.
- `tools/create-checkpoint-saves.ts` writes the act 1 checkpoints from the state at the start of act 1.

The state records the part of the game and the current event.
The completed quest list holds the served event quests, in delivery order. The quest IDs of the prologue start with `prologue-`.
The board, the blockers, and the pending scenes use the fields of act 1.
During the prologue, the clock record stays at day 1 with no merges, and the purse stays at zero.

### The dishes of an event board

The dishes of an event board are the dishes that the board can hold. They are these dishes:

- the first dish of each source of the event;
- each prepared dish of the board;
- each blocked dish of the board;
- each result of a merge of two dishes of this list: the next dish of a matching pair, or the mixed dish of a recipe pair. The list grows until no merge adds a dish.

The list does not count the number of each dish on the board. A dish does not need its source in the tab.
For example, the dishes of the event 1 board include Colivă and Colaci, and the Legume sacks dishes up to Bean stew.
The dishes of the event 3 board include Cozonac, from the prepared Sweet dough and a Fruit bowl from the Cornucopia. They do not include Eggs or Chicken, because the source tab has no Hen's nest in that event.

The content check and the save validation use the same list. The content check confirms that each quest dish of an event is a dish of its board.

### Save validation

The save validation accepts a prologue save only if all these conditions are true:

- The source tab has each source of the current event once and no other source. The board holds no source.
- Each dish on the board is a dish of the board of the current event.
- Each discovered item is a source of the current event or of an earlier event, or a dish of the board of one of those events.
  The discovered items include each source and each prepared dish of the current event and of each earlier event.
- The completed quest list holds all the quests of the earlier events, and some quests of the current event, each once.
  The quests of one event can be in any order. The quests of an earlier event come before the quests of a later event.
- The current event is the first event with a quest that is not served. If each quest of all seven events is served, the current event is 7.
  So a save with each quest of event 1 to 6 served cannot stay at that event.
- The pending scenes are the last part of the earned scenes, in story order, with no gap. They can be no scenes.
  The player reads in story order, so the completed scenes are always the first part of the earned scenes.
- If each quest of event 7 is served, closing 7 is pending.
  A save at event 7 with each quest served and no pending scene is invalid, because it cannot start act 1.
- A new game earned opening 1, so a save before the first reading is valid.

The save validation accepts an act 1 save only if the completed quest list starts with all the prologue quests, with each event in event order. No prologue scene is pending.
In act 1, a discovered item is a source or a dish of an open chain, or a source or a dish of a prologue event.
The board rules of act 1 do not change: each dish on the board belongs to chains that are open by the source rules of act 1.
So Flour and Colaci on the board are valid on day 1, because the Grain and Herbs chains are open. Cozonac on the board before the Fruits chain opens is invalid.

The save uses game state version 19 in envelope version 18 at `scary-snacks-save-v18`. The skip keeps this format. Every valid save in this format must still load and import without lost progress. The game does not read a save of an earlier format.

## Owner contracts

`PRODUCT.md` controls the prologue rules, the events, the boards and quests, the new dishes, the scene order, the start of act 1, the prologue discoveries, the journal groups of each part, and the starting gift.
`DESIGN.md` controls the family kitchen, the masthead without coins, the prologue in Story, the prologue in the journal, the notebook pages, the scene illustrations of the prologue scenes, and the family photographs of Mama and Tata.
`docs/economy.md` records the balance evidence for the starting gift.

## Acceptance checks

- New game: a new game starts at event 1 on Monday 23 December, year 0. The masthead shows the date and no coins. Opening 1 opens immediately.
  A save, a reload, and an export and import before the player reads opening 1 keep opening 1 pending.
- First event: from a new game, a run with legal actions only serves the first quest with no take, then makes the Bean dip with four takes and four merges.
- Delivery order: a run that serves the quests of each event in reverse authored order stays valid after each delivery, through the start of act 1.
- Takes: each take in the prologue is free. A full board refuses a take.
- Serve: an event quest pays nothing. The last delivery of events 1 to 6 makes closing N and opening N+1 pending, in this order, and starts the next event, in one change.
- Scenes: after an event change, the first pending prologue scene opens immediately, and each completion opens the next one. Close or Escape keeps each scene pending, and play continues.
  A reload with several pending prologue scenes keeps them in story order. Story offers the first one with Read now. The completion of a later scene before an earlier one changes nothing.
- Deferred scenes: a run that closes every scene with Close through all seven events has all 14 prologue scenes pending at the end of event 7, in story order.
  The player then reads them in story order. Closing 7 opens last, and its completion starts act 1 with no prologue scene pending.
- Board: the next event replaces the board with its authored board. A reload keeps the board of the current event.
- Event discoveries: at the start of event 3, Sweet dough is in the recipe book before any merge, and after a reload.
  At the start of event 6, the discovered items are the earlier ones and the event 6 sources and Flour. The blockers add none.
  In a run that has not made Cherry compote, a merge of a Fruit bowl into the blocked Fruit bowl clears the blocker and discovers Cherry compote.
- Board dishes: a save, a reload, and an export and import keep these states valid: event 1 with Colivă and Colaci, and event 3 with a Cozonac from the prepared Sweet dough.
  A save at event 3 with Eggs on the board is invalid.
- Invalid prologue saves: import rejects each of these saves:
  a save at event N, from 1 to 6, with each quest of event N served; a save at event 7 with each quest served and no pending scene;
  a save with a gap in the pending scenes, for example closing 2 pending and opening 3 complete; and a save with a pending scene that the game has not earned.
- No clock: merges in the prologue do not move the time. The prologue has no closing and no night.
- Event 7: after the last delivery of event 7, the game stays at event 7 with no ticket, and closing 7 is the last pending scene.
  Close, Escape, a reload, and an export and import each keep this state.
- Start of act 1: the completion of closing 7 starts act 1. The board becomes the initial board of act 1. The purse holds the starting gift. The clock shows Saturday 15 February at 07:00.
  A second completion of the same scene changes nothing. A journal replay of any prologue scene leaves the board, the purse, the date, and the pending scenes unchanged. No scene of a later event becomes pending.
- Skip: at each event, and during the wait for closing 7, the skip gives the act 1 start that a legal run from the same state gives, with the same seed. The recipe book is the same as after the legal run: it keeps the earlier discoveries and gets the discoveries of a full run of each event. Each prologue scene replays from the journal. In act 1, the skip changes nothing.
- Recipe book: the dishes that the prologue discovered stay in the recipe book in act 1. A dish of a closed chain shows that its source comes later, and has no "Show me on the board".
- Discoveries: a reload, an export, and an import immediately after the start of act 1 keep each prologue discovery, including Cozonac and other dishes of chains that act 1 opens later.
- Act 1 board: an act 1 save with Flour or Colaci on the board on day 1 is valid. An act 1 save with Cozonac on the board before the Fruits chain opens is invalid.
- Journal: during the prologue, the journal has no Neighbours group. In act 1, the Neighbours group has its act 1 entries and no entry for Mama, Tata, or Paraschiva.
- Notebook: opening 3 and closing 5 show their notebook pages in place of the event illustration, in the scene and in its journal replay. Mara's lines give the words of the page as text. Each page has its screen reader description. Phone and desktop in both themes.
- Content: each event fits in 40 merges, and the prologue fits in 250 merges. Each event quest obeys the discovery rule, the diet of its event, and the quest-size rule. Each board item and each quest dish is an item of the game data.
- Balance: the balance run plays all seven events with legal actions only and with no injected items. It continues into the act 1 balance run, and the purse after the supper stays in the balance band with the starting gift.
- Story and journal: Story shows the seven event steps. The journal replays each completed prologue scene with no reward.
- Save: a reload, an export, and an import keep the part of the game, the event, the board, and the pending scenes. Import rejects a save of an earlier version.
- Browser: the tests cover the first event, the change of event, the deferred scenes, the wait at event 7, the room state of each event, Miez, the start of act 1, and Skip tutorial with its confirmation and a reload. Phone and desktop in both themes. Reduced motion.

## Open decisions

None.
