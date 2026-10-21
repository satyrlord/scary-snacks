# 016: The prologue

Status: Proposed.

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

- the seven events, their dates, their meals, and their scenes;
- the play rules of the prologue;
- the change from the prologue to act 1;
- the family kitchen in the room, and Miez;
- the prologue in Story and in the journal;
- the saved prologue progress;
- the art of the prologue;
- the content checks and the browser checks.

The feature does not include these parts:

- a skip of the prologue;
- a clock, coins, preparations, or a night in the prologue;
- a return to the prologue after act 1 starts.

## Events

Each event has a date, an opening scene, an authored board, one to three event quests, and a closing scene.
The quests of an event belong to the people at the meal: Mara's mother, Mara's father, or a group of guests.
A group quest shows the scene illustration of its event in place of a character sketch.
The diets of spec 012 apply. A fasting day of the Orthodox calendar gives a fasting diet: no meat, dairy, or egg.

| Number | Date | Event | Meal | Diet |
| --- | --- | --- | --- | --- |
| 1 | Monday 23 December, year 0 | The funeral meal (pomană) in the village | Colivă, ritual bread (colaci), and a bean dish for the funeral guests | Fasting day |
| 2 | Tuesday 24 December | Christmas Eve | Bread rings for the carol singers at the door, and a fasting supper | Fasting day |
| 3 | Wednesday 25 December | Christmas dinner | Cabbage rolls, sausages, and cozonac | None |
| 4 | Tuesday 31 December | New Year's Eve | The midnight table | None |
| 5 | Monday 6 January, year 1 | Epiphany (Boboteaza) | A warm meal after the cold blessing of the waters | None |
| 6 | Saturday 25 January | The memorial service of the fortieth day | Colivă and ritual bread for the memorial | None |
| 7 | Thursday 13 February | The farewell dinner | Mara's favourite meal, and food for the journey | None |

The opening scene of event 1 also tells the death of the grandmother on Friday 20 December, the day of Saint Ignatius.
The calendar shows no other dates of the prologue. Spec 015 gives the weekdays.

### Story outline

The scenes follow this outline. The update-game-content skill writes the dialogue.

1. The funeral meal. A telephone call came on 20 December. Mara and her mother cook the funeral food in the city and drive it to the village.
   At the funeral, Mara sees the closed bistro for the first time in years. Miez, the grandmother's black cat, waits on its steps.
   The scene illustration of the funeral shows the four core characters: Mara, and Ilie, Eszter, and Sorin among the guests. Ilie, Eszter, and Sorin do not speak to Mara in the prologue.
   After the meal, Miez walks into Mara's bag and comes to the city.
2. Christmas Eve. Children sing carols at the door. Mara's father pays them in bread rings and complains that the songs get shorter each year.
3. Christmas dinner. The family eats the grandmother's recipe for cabbage rolls from her notebook. The rolls taste nearly right.
4. New Year's Eve. At the midnight table, the family talks about the bistro. Mara's father wants to sell the bistro. Mara's mother says nothing, which is worse.
5. Epiphany. The priest blesses the flat. The frost is hard. Mara reads the notebook again and finds a note to her in it.
6. The memorial of the fortieth day. The family goes back to the village. A notary reads the will: the bistro belongs to Mara. Mara decides to open the bistro again.
7. The farewell dinner. Mara's parents give her the starting gift and their blessing. Mara leaves for the village with Miez in a basket.

The prologue does not explain the mystery of the village. The scenes can show small strange details. For example, the notebook has a recipe page that nobody can read.

## Play rules

The prologue uses the board, the tickets, the recipe book, and the merge rules of act 1, with these changes:

- The prologue has no purse. The masthead shows the date and no coins.
- Each take is free.
- An event quest pays nothing. Its ticket and its dialog show Serve, as the supper does.
- A cleared blocker gives no coin.
- The prologue has no clock. Merges do not move the time. The masthead shows the date only, for example "Tue 24 Dec".
- The prologue has no upkeep, no night, no rats, no preparations, no recovery quest, and no repeating quests.
- The bat does not cross.

The quests of an event open at the start of the event, in authored order. The ticket rules of act 1 apply.
When the player serves the last quest of the event, the event is complete. In the same change:

1. The closing scene of the event enters the unread scenes.
2. The calendar moves to the date of the next event.
3. The authored board of the next event replaces the board. The dishes of the old board leave the board: the family eats the leftovers.
4. The quests of the next event open.

The closing scene opens immediately. A completed event cannot have a second delivery.

### Board and sources

Each event has its own authored board. The board holds the sources that the meal needs.
The prologue sources are the pantry of the family flat. The prologue can use chains that act 1 opens later.
For example, the Christmas board can have the Butcher's hook. The pickle barrel of spec 017 stands on the balcony in winter.

The events teach the loop in this order:

| Event | New part of the loop |
| --- | --- |
| 1 | A take, a merge of two matching dishes, and Serve |
| 2 | A mixed dish from two chains |
| 3 | A larger meal with more chains |
| 4 | Three tickets at the same time |
| 5 | A small meal, with no new part |
| 6 | Blockers: the boxes from the grandmother's house, tied with twine |
| 7 | A free choice of route to the meal |

The item help, "Find a match", and the blocker help of act 1 are available. The prologue adds no other help.

### Size

The prologue is short. The data check limits each event to 40 merges and the prologue to 250 merges.
The data check also applies the discovery rule of act 1 to each event quest.
The quest-size rule of act 1 applies: at most three portions for each eater and at most two portions of one dish.
A group quest counts each guest of the group.

## From the prologue to act 1

The closing scene of event 7 ends the prologue. When the player completes that scene, act 1 starts in one change:

- The board becomes the authored initial board of act 1.
- The purse holds the starting gift of Mara's parents.
- The clock shows Saturday 15 February at 07:00. The day number is 1.
- The room shows the front room in its first state.
- The first quests of act 1 open.

The recipe book keeps each dish that the prologue discovered. The discovery rule of act 1 counts these dishes as known.
The journal keeps the prologue scenes.
If the player closes the scene with Close or Escape, the scene stays unread, and act 1 does not start. Story offers the scene with Read now.

The starting gift is a lever. The balance test of spec 015 sets its value.

## Room

The prologue room has one area: the family kitchen, in a flat of a city apartment block.
The area switch does not show in the prologue.
The kitchen window shows the city in winter. The door to the balcony shows the pickle barrel.

The family kitchen has four painted states:

| State | Events | Look |
| --- | --- | --- |
| Mourning | 1 and 6 | The mirror has a cloth over it. A candle burns beside a photograph of the grandmother with a black ribbon. |
| Christmas | 2 and 3 | Fir branches, bread rings, and the carol star of the children |
| New year | 4 and 5 | Streamers from the midnight table, and frost on the window |
| Farewell | 7 | A packed suitcase and an empty cat basket by the door |

The room shows the state of the current event. The change of state happens with the change of event. With reduced motion, the change is immediate.

Miez appears in the family kitchen from event 2. Miez sits on the windowsill and sleeps on the radiator.
The Miez card in Story works as in act 1. In the farewell state, Miez sits next to the cat basket and refuses to go in.

## Story and journal

Story shows the prologue as one part before chapter 1.
The prologue part shows its title, "Prologue: The inheritance", and one step for each event: done, now, or not yet.
Story shows no Pay and no cost details in the prologue. Mara's line names the meal of the current event.

The journal lists the prologue before chapter 1. The prologue entry gives each event, its opening scene, and its closing scene.
The journal can replay each prologue scene. A replay gives no reward.

## Characters

Mara's mother and Mara's father speak in the prologue. They have portraits and sketches.
They have no names. Their speaker labels are "Mama" and "Tata", as Mara calls them.
The grandmother is Mamaia Paraschiva. "Mamaia" is a regional word for a grandmother. The name Paraschiva means Friday, and she dies on a Friday.
The name refers to Sfânta Vineri, the kind old woman of the folk tales who helps travellers.
Paraschiva does not speak in a scene. Her lines come from her recipe notebook, in her handwriting.
Mara's parents do not move to the village. In act 1, letters and parcels from the parents can appear in later content.

Ilie, Eszter, and Sorin show only in the scene illustration of the funeral. They do not speak, give quests, or meet Mara in the prologue.
Their introductions in act 1 do not change.

## Art

Each picture follows the art rules of the existing masters. Each picture has records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.

- Four painted states of the family kitchen, in the format of the room states.
- Four event scene illustrations on parchment, in the style of the quest scenes:
  the village churchyard in snow, with Mara, Ilie, Eszter, and Sorin among the guests (events 1 and 6), the carol singers at the door (events 2 and 3), the midnight table with frost on the window (events 4 and 5), and the bus stop at dawn (event 7).
- Portraits and sketches of Mara's mother and Mara's father.
- The photograph of Paraschiva, as a detail of the mourning state.

The review examines each picture at its game size on a phone, in both themes. The user accepts each picture.

## Data and state

- `tools/create-original-data.ts` authors the events, their boards, their quests, their scenes, and the starting gift.
- `src/model.ts` gives the current part of the game: the prologue or act 1. The module also gives the current event.
- `src/engine.ts` applies the prologue rules: free takes, Serve, no purse, no clock, the change of event, and the start of act 1.
- `src/content.ts` checks the size of each event, the discovery rule, the diets, and the quest-size rule.
- The state records the part of the game, the current event, and the served event quests.
  The state also records the board of the current event and the unread prologue scenes.
- A new game starts the prologue at event 1.
- The completed quest list holds the event quests. The quest IDs of the prologue start with `prologue-`.

The save shape changes. The game state version and the envelope version change together. The game does not read a save of an earlier version.

## Owner contracts

`PRODUCT.md` controls the prologue rules, the events, the start of act 1, and the starting gift.
`DESIGN.md` controls the family kitchen, the masthead without coins, the prologue in Story, and the prologue in the journal.

## Acceptance checks

- New game: a new game starts at event 1 on Monday 23 December, year 0. The masthead shows the date and no coins.
- Takes: each take in the prologue is free. A full board refuses a take, as in act 1.
- Serve: an event quest pays nothing. The last delivery of an event queues the closing scene and starts the next event in one change.
- Board: the next event replaces the board with its authored board. A reload keeps the board of the current event.
- No clock: merges in the prologue do not move the time. The prologue has no closing and no night.
- Start of act 1: the completion of the last closing scene starts act 1. The board becomes the initial board of act 1. The purse holds the starting gift. The clock shows Saturday 15 February at 07:00.
- Recipe book: the dishes that the prologue discovered stay in the recipe book in act 1.
- Close: Close or Escape on the last closing scene keeps the prologue. Read now in Story opens the scene again.
- Content: each event fits in 40 merges, and the prologue fits in 250 merges. Each event quest obeys the discovery rule, the diet of its date, and the quest-size rule.
- Story and journal: Story shows the seven event steps. The journal replays each prologue scene with no reward.
- Save: a reload, an export, and an import keep the part of the game, the event, the board, and the unread scenes. Import rejects a save of an earlier version.
- Browser: the tests cover the first event, the change of event, the room state of each event, Miez, and the start of act 1. Phone and desktop in both themes. Reduced motion.

## Open decisions

- The value of the starting gift. The balance test sets the value.
