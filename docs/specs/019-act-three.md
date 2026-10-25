# 019: Act 3

Status: Implemented. `PRODUCT.md`, `DESIGN.md`, and `DELIVERY.md` control the behavior.

## Outcome and scope

Act 3 starts on Monday 1 September of year 1 and ends on Friday 31 October, All Hallows' Eve. The game has no act 4.

The sleeper behind the red door wakes every forty years and demands a feast. The cathedral kitchen always fed him, and the cathedral library keeps the menus of his old feasts.
Forty years ago, the archbishop left the village with the money for the church roof, and nobody cooked. The hungry sleeper raided each pantry in the village. In the same year, Mamaia took the prayer from the library to protect the bistro.
This year, the service falls to Mara. She pays the debt of the stolen page in service, as Ambrozie tells her in act 2.
The sleeper orders a large meal for All Hallows' Eve. After the meal, he goes back to sleep for forty years.

The tone stays cosy, eerie, and comic. The sleeper is a threat of mischief, not of harm. His raid forty years ago empties pantries, not houses.

The feature covers these parts:

- the dates, the holidays, the chapters, and the 18 preparations of act 3;
- the three areas of act 3: the orchard, the cathedral kitchen, and the bistro cellar;
- the pickles of the family, which the bistro cellar makes free;
- the orchard benefits and the apple tree;
- the scrolls and the six parts of the sleeper's order;
- the dinner of the sleeper on All Hallows' Eve, and the finale painting;
- the visitors, the quest plan, and the two quests of act 3 that the game data already holds;
- the new dishes and the new art;
- the change from act 2 to act 3, the end of act 3, and the saves.

The feature does not include these parts:

- Saint Andrew's Eve, the one-year memorial of Mamaia, and the longest night. They belong to act 4.

## Dates

Act 3 has the weekdays of year 1 in spec 015.

| Date | Event | Use |
| --- | --- | --- |
| Monday 1 September | The day after the purchase of the orchard | Act 3 starts. Ambrozie brings the first scroll. |
| Tuesday 30 September | The last day of the Garden beds | The Garden beds leave by their season. |
| Thursday 30 October | The eve of the dinner | 30 October holds until the payment of preparation 18. |
| Friday 31 October | All Hallows' Eve, the night the sleeper wakes | The sixth part of the order. 31 October holds until the player serves it. |

The game text calls 31 October "All Hallows' Eve".

### Holidays

These holidays of act 3 have a quest:

| Date | Holiday | Quest |
| --- | --- | --- |
| Sunday 14 September | Holy Cross Day (Ziua Crucii) | A holiday quest of Sânziana. The village takes basil to the church for the blessing, and Sânziana picks the last herbs of the year. On this day, the snakes and the small creatures go under the ground to sleep for the winter. |
| Tuesday 14 October | Saint Parascheva, the name day of Mamaia Paraschiva | A holiday quest of Mara. |
| Saturday 25 October | The autumn Saturday of the dead (Moșii de toamnă) | A holiday quest of Bela. |
| Sunday 26 October | Saint Demetrius (Sâmedru) | A holiday quest of Dochia. The shepherds come down from the mountains on this day, and Dochia comes back from the high pasture. |

Holy Cross Day is a custom of the village. It is not a fast, so the fasting rule does not apply to it.
Each holiday has fair weather, as the data check requires.

## The size of act 3

Act 3 has 61 days: 53 weekdays and 8 Sundays. In the autumn, Mara cooks in the bistro kitchen again, so the merge time of act 1 applies: 15 minutes. A weekday holds 60 merges, and a Sunday holds 28 merges. The days of act 3 hold about 3,400 merges.
The 18 preparations and the six parts of the order use this work. The parts replace the work of six preparations.
The merge time is a lever. The balance test of act 3 measures it.

## Chapters and preparations

Act 3 has six chapters and 18 preparations. Each area has six preparations. Each chapter has three preparations.
Each chapter opens with one scroll from Ambrozie.
The payment of the third preparation of a chapter completes the chapter and queues its closing scene.

| Chapter | Title | Opening date | Days | Preparations | Scroll | Story |
| --- | --- | --- | ---: | --- | ---: | --- |
| 1 | The orchard creaks | Monday 1 September | 10 | 1 to 3 | 1 | The orchard. The apple tree. The news of the sleeper. |
| 2 | Jars and gates | Thursday 11 September | 10 | 4 to 6 | 2 | The bistro cellar. Ilie's jars. The kitchen gate. |
| 3 | Forty years of dust | Sunday 21 September | 10 | 7 to 9 | 3 | Forty years of dust. The raid forty years ago. |
| 4 | The pumpkin fair | Wednesday 1 October | 10 | 10 to 12 | 4 | The apple loft. Bran's pumpkin fair. |
| 5 | Every family's best brandy | Saturday 11 October | 10 | 13 to 15 | 5 | The brandy still. The village boils its plum brandy. The name day of Mamaia. |
| 6 | A chair for the sleeper | Tuesday 21 October | 11 | 16 to 18 | 6 | The long table. All Hallows' Eve. |

The opening dates are levers.

Each chapter names one quest of a core character as its neighbour help. That quest opens during the chapter.

| Chapter | Neighbour help |
| ---: | --- |
| 1 | Sorin, who asks to see the sleeper |
| 2 | Ilie, "Jars for winter" |
| 3 | Eszter, whose first plate for the sleeper cracks when he snores |
| 4 | Sorin, who gets halfway to the red door |
| 5 | Mara: the name day of Mamaia on 14 October |
| 6 | Eszter, who makes the plate the size of a cartwheel |

Each preparation of act 3 leaves two or three preparation blockers, as in act 1 and act 2. The blockers use the current preparation-clutter pictures, the board-clutter packing pictures, and tied food. They need no new art.

| Number | Area | Preparation | Benefit |
| ---: | --- | --- | --- |
| 1 | Orchard | Cut back the brambles | |
| 2 | Orchard | Prune the old apple trees | Orchard stage 1. The apple tree opens. |
| 3 | Bistro cellar | Clear the cellar stairs | |
| 4 | Bistro cellar | Scrub the old barrels | |
| 5 | Bistro cellar | Build the wine racks | |
| 6 | Cathedral kitchen | Unlock the kitchen gate | |
| 7 | Cathedral kitchen | Sweep forty years of dust | |
| 8 | Cathedral kitchen | Light the great hearth | |
| 9 | Orchard | Mend the stone wall | |
| 10 | Orchard | Build the apple loft | Orchard stage 2. |
| 11 | Bistro cellar | Shelve the winter jars | |
| 12 | Cathedral kitchen | Scour the giant pots | |
| 13 | Orchard | Fire the brandy still | Orchard stage 3. |
| 14 | Bistro cellar | Hang the smoked hams | |
| 15 | Orchard | Hang lanterns in the branches | |
| 16 | Bistro cellar | Fit the cold-room door | The pickles of the family. A take from the pickle barrel becomes free. |
| 17 | Cathedral kitchen | Lay the long table | |
| 18 | Cathedral kitchen | Set the sleeper's chair | |

The brandy still is art only. It tells where the plum brandy comes from. It adds no new drink.

## Story outline

The update-game-content skill writes the dialogue.

1. Early September. Mara clears the orchard, and the apple tree gives its first fruit. Ambrozie brings the first scroll and the news: the chronicle of the cathedral says that the sleeper wakes on All Hallows' Eve, every forty years.
2. Mid-September. The bistro cellar opens, and Ilie brings his jars for winter. The visitors find the kitchen gate under the cathedral. Nobody has opened it since the archbishop left.
3. Late September. The cathedral kitchen holds forty years of dust. Ambrozie tells how the hungry sleeper raided each pantry forty years ago. The oldest villagers remember the night and still keep a spare loaf hidden.
4. Early October. The apple loft fills, and Bran holds his pumpkin fair.
5. Mid-October. The village boils its plum brandy in Mara's still. Each family brings its plums, and each family says that its brandy is the best. On 14 October, the name day of Mamaia, Mara remembers her grandmother.
6. Late October. The long table and the sleeper's chair are ready. 31 October is a Friday, a fasting day, and Cătălina is shocked by a menu of roasts and brandy. Ambrozie answers that the sleeper keeps his own calendar. On All Hallows' Eve, the sleeper eats everything, complains that the cheerful mortals tire him, says "See you in forty years!", and goes back to sleep.

### Continuity with act 2

- The sleeper snores in act 2, and the visitors keep the watch at the red door. In act 3, they keep the last watch.
- Ambrozie tells Mara in act 2 that a stolen page is paid back in service. The dinner of the sleeper is that service.
- The drying racks and the bulion of act 2 prepare the bistro cellar.
- In act 1 and act 2, the bistro buys its pickle barrels from Ambrozie. From preparation 16, the family keeps its own pickles in the cellar.
- Ilie writes his own recipes in his notebook at the end of act 2. In act 3, he fills the cellar jars from these recipes.
- Eszter keeps the pots that the tinker mended in act 2. Sorin still keeps the secret of the page.
- Dochia is on the high pasture for all of act 2. She comes back on Sâmedru, 26 October.

### The core characters

Each core character has one arc for act 3. The change comes in chapter 5 or 6.

| Character | Want | Complication | Change |
| --- | --- | --- | --- |
| Mara | She wants to pay the debt of the stolen page with one perfect dinner. | On 14 October, the name day of Mamaia, she cooks for the thing that Mamaia stole the prayer to keep out. | She stops seeing the dinner as a debt. She cooks it generously, as Mamaia would, and she carries the suckling pig to the table herself. |
| Ilie | He wants to fill the cellar with his own jars, from the recipes that he writes himself. | The village trusts only the pickle barrels of the cathedral. | With preparation 16, the family keeps its own pickles. Ambrozie buys a jar. |
| Eszter | She wants to set a table that is worthy of the cathedral. | The plate of the sleeper: her first plate cracks when he snores. | She makes a plate the size of a cartwheel, with mended rims, and she signs it on the back. |
| Sorin | He wants to be the first to see the sleeper. | Everybody tells him to stay away, and he still keeps the secret of the page. | On All Hallows' Eve, he looks in from the kitchen door. For once, he has news, and he decides never to tell it. |

### The witnesses of the raid

Two regulars remember the raid forty years ago. They tell it in their quests of act 3.

| Regular | Campaign quests | Thread |
| --- | ---: | --- |
| Dorian | 4 | He looked the same forty years ago. He dined at the bistro on the night of the raid, and the sleeper ate his dessert. He still complains about it. |
| Bela | 3, with the autumn Saturday of the dead | He was in the churchyard that night. He saw the pantries of the village open one by one. |

## The scrolls and the order

The sleeper's order has six parts. Each scroll from Ambrozie is one part: the menu of one course of an old feast.
A part is a quest of Ambrozie. Its ticket shows his portrait. In its dialog, Ambrozie reads the scroll to Mara.
Parts 1 to 5 are campaign quests, and they follow the usual prerequisites. A campaign quest that opens after a preparation is needed by each later payment. So the first preparation of each chapter needs the part of that chapter.

| Part | Opens after | Earliest date | First payment that needs it |
| ---: | --- | --- | --- |
| 1 | the start of act 3 | Monday 1 September | Preparation 1 |
| 2 | Preparation 3 | Thursday 11 September | Preparation 4 |
| 3 | Preparation 6 | Sunday 21 September | Preparation 7 |
| 4 | Preparation 9 | Wednesday 1 October | Preparation 10 |
| 5 | Preparation 12 | Saturday 11 October | Preparation 13 |
| 6, the dinner | Preparation 15 and the delivery of part 5 | Tuesday 21 October | None |

A part opens when its preparation is paid and its date comes. If the player pays the preparation before the date, the part opens at the opening time of that date. If the player pays it after the date, the part opens at that payment. So the scroll comes at the opening of its chapter, or at the last payment of the chapter before, for a late player.
A preparation needs only the parts that open before it. So a preparation of September never needs a part of October.
Each part also waits for the part before it, because each quest of a character waits for the earlier quests of that character. The payment that opens a part needs the part before it, so this wait never delays a part.

Part 6 is the finale of act 3. No preparation needs its delivery, so its open ticket does not block preparations 16 to 18. This early opening applies only to the dinner. The supper of act 1 and the feast of act 2 open after the last preparation of their act.
The funding check counts the take costs of the dinner in the window after preparation 15, as a quest with no reward.

- Parts 1 to 5: the player delivers each part early. Adrian, Monica, and Janos carry the food down to the cellar under the cathedral, so the part leaves the board. The completion scene of each part is their report of the trip.
- Part 6: the dinner. Its ticket shows "Booked for All Hallows' Eve". On 31 October, the ticket shows "Booked for 20:00". Serve works on 31 October from 20:00 when parts 1 to 5 are delivered and preparation 18 is paid. Before 20:00, the lantern control replaces Serve, as for the supper of act 1. Serve opens the finale.

A part pays no coins. The parts are service, as the supper of act 1 and the feast of act 2. The balance test of act 3 sets the prices of the preparations with this cost.
A part has at most 11 portions, as many as the supper of act 1. So a part fits on the board with four free cells.
Each part asks for meat dishes and for red wine or plum brandy. The quantities are levers. The balance test of act 3 measures them.
The order is an exception to two rules, as the provisions of the visitors are:

- the rule of one meal for each eater;
- the rule that the work of a quest fits in one weekday of its act. A part can take more than one day. For example, one Roast veal and one Plum brandy need 62 merges, and a weekday of act 3 holds 60.

#### The dinner as a finale

The dinner is a finale quest with one eater, the sleeper. The sleeper is not a character, so the dinner has no guest list. It is an exception to the plate rule of a finale: one plate for each known guest, one portion on each plate, and a favourite for each regular.
The dinner follows the rules of a part: at most 11 portions, meat dishes, and red wine or plum brandy, with the suckling pig. Its ticket and its dialog show Ambrozie's portrait. Its dialog names the course of the old feast, not a guest for each plate.
The supper of act 1 and the feast of act 2 keep the plate rule.

### The dishes of the order

The order uses the meat dishes that the player knows, red wine, plum brandy, and the three feast dishes. Only the sleeper orders the feast dishes. Part 6 asks for the suckling pig.

## Areas of act 3

Act 3 has three areas: the orchard, the cathedral kitchen, and the bistro cellar. They replace the areas of act 2 in the room.
Preparations repaint each area, as in act 1. The cats stay in the room.

### The orchard

Mara buys the orchard from the cathedral at the end of act 2. The orchard has three stages, as the vegetable garden of act 2. Each stage changes the orchard value: the coins that one fruit ingredient adds to a menu price.

| Orchard stage | Preparation | Orchard value |
| ---: | --- | ---: |
| 1 | 2, "Prune the old apple trees" | 1 |
| 2 | 10, "Build the apple loft" | 2 |
| 3 | 13, "Fire the brandy still" | 3 |

The fruit ingredients are the ingredients of the Cornucopia and of the apple tree. From orchard stage 1, a take from these sources is free.
In the menu price, a fruit ingredient counts its orchard value, not zero.
So the free take is profit, and each later stage raises the price of each dish with fruit.
The orchard values are levers. The balance test of act 3 measures them.

The orchard value works as the garden value does. Before orchard stage 1, the Cornucopia is a paid source, and a fruit ingredient counts the take cost. A dish on the board has no saved value: its price comes from the current orchard stage. The current orchard stage gives these values:

- the menu price in the recipe book, also for a mixed dish with a fruit ingredient, for example the Suckling pig with an apple;
- the reward of a repeating quest and of the recovery quest, and the reward on their tickets.

The orchard value does not count in a sale. A sale pays back only the take costs, and a free source has no take cost. So from orchard stage 1, a fruit ingredient sells for 0 coins. Before orchard stage 1, it sells for the take cost. A mixed dish with paid and free ingredients sells for the take costs of its paid ingredients only. So a take and a sale never make a profit.

A campaign quest of act 3 pays its menu value at the orchard stage of the preparation after which it opens. The orchard stage does not change while such a quest is open. The funding check uses the same stage for the take costs.

Plum brandy stays the last stage of the Fruits chain. The orchard makes it cheaper in coins, not in merges.

### The vegetable garden

The vegetable garden of act 2 keeps garden stage 3 in act 3. A take from the Vegetable crate stays free, and a garden ingredient counts the garden value of stage 3.

### The cathedral kitchen

The cathedral kitchen and its dining hall are under the cathedral. Nobody has cooked there since the archbishop left. Mara restores the kitchen and the hall for the dinner of the sleeper. Each preparation of this area shows the night coming closer.

### The bistro cellar

The bistro cellar holds the barrels of wine and plum brandy, the smoked hams, and the jars of preserves for the winter.

#### The pickles of the family

Preparation 16, "Fit the cold-room door", completes the cellar. From that payment, the pickles of the family fill the cold room, and the bistro no longer buys the barrels of the cathedral.

- A take from the pickle barrel is free.
- In the menu price, a pickle ingredient counts the cellar value, not the take cost and not zero. So the free take is profit, as in the garden and the orchard.
- In a sale, a pickle ingredient counts 0 coins from the payment, because its take is free. The cellar value does not count in a sale.
- The cellar value is 2 coins. For example, Gherkins cost 2 coins, and Mixed pickles cost 14 coins: 4 × 2 + 3 × 2.
- The pickle barrel follows the rules of a seasonal source for its season, its arrival in the source tab, and its departure.

The season of the barrel is 1 December to 20 March. So the barrel is usually absent from the source tab in act 3, and the player first sees the free pickles when the barrel comes back on 1 December, in act 4.
An open quest can keep the barrel after its season, by the retention rule of a seasonal source. For example, an open "Pickles for the night shift" keeps the barrel until its delivery. If the barrel is in the source tab at the payment of preparation 16, its takes are free from that payment until the barrel leaves.
The cellar value is a lever. The balance test of act 4 measures it.

## The finale painting

The finale painting shows the long table in the dining hall of the cathedral kitchen, with empty plates and bottles.

- The sleeper sits at the far end, in a dark corner. Only his two red eyes show, grumpy like an old man who has just woken up, and his two horns come out of the shadow, each with a tiny nightcap.
- Mara carries the suckling pig.
- Ambrozie pours him plum brandy at the table.
- Adrian, Monica, and Janos wait at the table in aprons.
- Ilie, Eszter, and Sorin look in from the kitchen door with trays.
- Miez sits under the table.

The sleeper shows only in this painting. His design is original. It does not copy the design of a sleeper, a demon, or a lord of another work.

## The visitors

Adrian, Monica, and Janos carry each part of the order down to the cellar under the cathedral.
Each visitor also has one supply quest for the last watch at the red door, in turn.

| Chapter | Visitor |
| ---: | --- |
| 2 | Adrian |
| 3 | Monica |
| 4 | Janos |

## Quest plan

Act 3 has 45 campaign quests and the dinner. Act 3 has half the days of act 2, and the six parts of the order use much of its work.

| Character | Campaign quests |
| --- | --- |
| Mara, Ilie, Eszter, and Sorin | Four each. Mara's holiday quest of 14 October and Ilie's "Jars for winter" are two of them. |
| Ambrozie | Five: parts 1 to 5 of the order. Part 6, the dinner, is the finale. |
| Adrian, Monica, and Janos | One supply quest each |
| Dorian and Bela | Four for Dorian and three for Bela: the witnesses of the raid |
| Vlad and Elisabeta | Two booked quests each |
| Ileana, Costel, Victor, Cezar, Bran, Ana, Cătălina, Sânziana, Gavril Hămălescu, and Dochia | One each. Bran's is "The pumpkin fair", Sânziana's is her quest of Holy Cross Day, and Dochia's is her quest of Sâmedru. |

The regulars' quests follow the story of their chapter.
Act 3 has no new characters.
The balance test of act 3 checks these quest counts.
Vlad and Elisabeta stay the two guests that take turns on the evenings. 31 October has no evening guest. The hold of 30 October keeps the evening rules of the hold of 14 August.

The game data already holds these quests of act 3:

| Quest | Character | Chapter |
| --- | --- | ---: |
| `ilie-pickles`, "Jars for winter" | Ilie | 2 |
| `bran-pumpkins`, "The pumpkin fair" | Bran | 4 |

## New dishes

### The apple tree

The apple tree is a seasonal source of spec 017. Its season is 1 September to 31 October. Preparation 2 adds it to the source tab.
Its chain is Orchard.

| Source | Stage 1 | Stage 2 | Stage 3 | Stage 4 |
| --- | --- | --- | --- | --- |
| Apple tree | Apples | Dried apple rings | Baked apples | Apple strudel |

The dried apple rings hang on the drying racks of act 2. The baked apples hold walnuts and honey. Apple strudel (rétes) is a dish of the Saxon and Hungarian kitchens of Transylvania.
The season is a lever.

### The feast dishes

| Mixed dish | Part 1 | Part 2 | Chains | Tags |
| --- | --- | --- | --- | --- |
| Suckling pig with an apple | Roast pork | Apples | Pork, Orchard | `meat`, `pork` |
| Lamb roasted in red wine | Roast lamb | Red wine | Lamb, Fruits | `meat`, `alcohol` |
| Wooden platter (fatányéros) | Roast veal | Sausages | Veal, Pork | `meat`, `pork`, `garlic` |

The wooden platter is a Transylvanian platter of roasts on a wooden board.

## Art

- The orchard, the cathedral kitchen, and the bistro cellar: one painted state for each preparation, as in spec 001.
- The finale painting.
- The menu art of the Orchard chain and the three feast dishes. The Apple tree shows its Apples, as each source shows its first ingredient.
- Eight quest scenes, as pencil sketches on two scene sheets in the hand of the earlier sheets: the trips of Adrian, Monica, and Janos with parts 1 to 5 of the order, and the holiday quests "The last herbs" of Sânziana, "Mamaia’s name day" of Mara, and "Down from the mountain" of Dochia.
- The sleeper has no portrait.

## From act 2 to act 3

The purchase of the orchard releases the hold of 31 August. If the player buys the orchard before the held position, 31 August continues, and the merge that reaches the closing time closes the day. If the player buys the orchard at the held position, the purchase closes 31 August in the same change.
After the purchase, until the closing of 31 August, Story shows the result card of act 2.

The closing of 31 August is an ordinary Sunday closing: the purse pays the upkeep once, and the night comes. Monday 1 September starts at 07:00 with the times of act 3. Act 3 starts with that day. The purse or the debt, the board, the open rat holes, the recipe book, the finishes, the random seed, the unread scenes, the open repeating quest, and the record of preparation blockers carry over without change.

From 1 September, the room shows the three areas of act 3, and Story shows chapter 1 of act 3. The journal keeps the chapters of act 1 and act 2 under Earlier chapters. Part 1 of the order opens at the opening time of 1 September.

### Seasonal sources after their season

The retention rule of a seasonal source covers the campaign quests of act 3. A seasonal source stays after its season while an undelivered campaign quest of act 1, act 2, or act 3, or the open repeating quest, asks for a dish of its chain. So a September quest that asks for a dish of the Garden beds keeps the beds after 30 September until its delivery.

## The end of act 3

Serve on 31 October records the result of act 3: the purse after the dinner.
The game has no act 4, so Serve stops the clock. Merges then do not move the clock, and no night comes. Story shows the result card of act 3. The card gives the result, for example "The bistro worked from 1 September to 31 October. The purse holds 214 coins." The board, the recipe book, and the repeating quests stay. The recovery quest opens when the purse holds less than the recovery floor.

## Data and state

- Act 3 continues the save of act 2: the purse, the board, the recipe book, and the finishes.
- The act comes from the saved day number, as in act 2. It needs no separate saved field.
- The state records the preparations of act 3 in the completed preparations, and the delivered parts of the order, including the dinner, in the completed quests. The save keeps its key, its envelope version, and its state version. Act 3 adds one optional saved field: the result of act 3, the purse at Serve, as the results of act 1 and act 2 keep their purse. An absent field means that the dinner is not served, so each current save stays valid. The save validation requires the field after the dinner and rejects it before the dinner. Later earnings and payments do not change it. A save of act 2 continues into act 3 without a new campaign. This includes a save after the purchase of the orchard: its 31 August continues, and the closing of 31 August starts 1 September. The save validation permits the days of act 3.
- `tools/create-original-data.ts` authors the dates, the chapters, the preparations, the parts, the quests, the dishes, the cellar value, and the scenes.
- The free pickles come from the completed preparations, so they need no saved field.
- The data check enforces the size of each part and the meat and the drink in each part.
- The balance test of act 3 measures the merge time, the orchard values, the quantities of the parts, the quest counts, and the prices of the preparations.
- The accounts of act 3 start at the purchase of the orchard and end at the dinner. The upkeep of 31 August counts in act 3. At the end of act 3, the purse holds 0 to 20% of the spending of the act: the cost of the preparations, the takes, and the upkeep.
- For each seed, the efficient strategy pays preparation 18 before the held position of 30 October, delivers each holiday quest on its holiday, and serves the dinner on 31 October before the held position. So the efficient strategy reaches no held position in act 3, and a hold never hides work that the merge budget does not hold. The repeating quests use at most 20% of the merges of act 3.
- The two other strategies of the balance test play act 3 too, with the 20 seeds:
  - The missed-booking strategy misses each booking of Vlad and Elisabeta in act 3 once. It still pays preparation 18 before the closing of 30 October and serves the dinner on 31 October.
  - The debt strategy starts each preparation window of act 3 with a debt of 20 coins. It gets to each payment through the recovery quest, and it can use the holds of 30 and 31 October. It serves the dinner on 31 October.
- The late player on the held days: a test state starts at the opening time of Thursday 30 October with preparations 1 to 15 paid, parts 1 to 5 delivered, the dinner open, each open quest that preparations 16 to 18 need, including the booked quests of Vlad and Elisabeta among them, and a purse of 0. The player uses only legal actions: takes, merges, deliveries, the recovery quest, and payments. The player pays preparations 16 to 18 on 30 October, and 30 October ends once. A reload at the held position of 30 October keeps the hold. On 31 October, the player cooks the dinner, lights the lanterns, and serves the dinner. A reload at the held position of 31 October keeps the hold. Each hold releases once.

## Acceptance checks

- The dependency check permits preparations 16 to 18 while part 6 is open. It rejects data that makes a preparation depend on part 6.
- A player reaches the held position of 30 October with preparations 1 to 17 paid, parts 1 to 5 delivered, and part 6 open. With every dish of part 6 on the board, Serve before preparation 18 changes nothing. The player can pay preparation 18 without serving part 6. The payment releases the hold and starts 31 October once.
- The orchard: at each orchard stage from none to 3, a test gives the take cost of the Cornucopia, the menu price of Plums, Plum brandy, and the Suckling pig with an apple, and the reward of a repeating quest with a fruit dish. Each menu price and reward follows the orchard value of the stage. A reload gives the same values. A campaign quest of act 3 keeps the reward of the stage of its window.
- The sales: before orchard stage 1, Plums sell for the take cost. From orchard stage 1, Plums sell for 0 coins at each stage. The Suckling pig with an apple sells for the take costs of its pork only. From the payment of preparation 16, Gherkins sell for 0 coins. A test repeats a take and a sale of Plums 20 times at orchard stage 3, and the purse does not change.
- The parts: a late player pays preparation 3 on 15 September, and part 2 opens at that payment. Preparations 1 to 9 never need part 4 or part 5. Preparation 4 cannot be paid while part 2 is open.
- The finales: the dinner opens after preparation 15 and part 5. The data check rejects a supper or a feast that opens before the last preparation of its act.
- The result of act 3: after Serve, the player earns and spends coins. The result of act 3 does not change, also after a reload, an export, and an import. A save that holds the result before the dinner fails the save validation.
- The cellar pickles: before the payment of preparation 16, the recipe book gives Mixed pickles 10 coins. After it, the recipe book gives 14 coins. In a test state with the pickle barrel in the source tab, a take before the payment spends the take cost, and a take after it is free, also with a debt.
- The retained barrel: in a test state where an open "Pickles for the night shift" keeps the barrel into act 3, a take before the payment of preparation 16 spends the take cost, and a take after it is free. A reload keeps the free take. After the delivery, the barrel leaves at the next closing.
- The dinner: the data check accepts the dinner without a guest list. The authored feast stays valid with its two plates for the empty chair of Mamaia, the Colivă and the Colaci. For the supper and the feast, each of these test data sets still fails the check: a guest list that is absent, a guest list with a different length from the plates, an unknown guest, the same guest twice, and a second portion on a plate.
- The work of a part: the data check accepts a part that needs more than 60 merges. A campaign quest of a regular that needs more than 60 merges still fails the check.
- The recipes: the data check accepts the wooden platter with the tags `meat`, `pork`, and `garlic`. A test data set without `garlic` fails the check.
- The saves: each fixed save in `tests/fixtures/save-v18.json` loads, imports, exports, and continues without lost progress. A save after the purchase of the orchard continues to 1 September once, with one upkeep.
- The change from act 2: a purchase before the held position and a purchase at the held position each start 1 September once, with one upkeep and one night. A reload before and after the purchase gives the same result. An unread scene of act 2 and an open repeating quest stay after 1 September.
- The end: with no act 4 in the game, Serve on 31 October stops the clock, and Story shows the result card of act 3.
- On 31 October, Serve before 20:00 changes nothing. With every dish ready, the lantern control sets the time to 20:00. Serve then delivers part 6 and opens the finale once. A reload after the payment and after Serve keeps the date and progress and repeats neither action.

## Decisions

The user approved the story, the scrolls, the order, the orchard, the areas, the preparations, the apple tree, the feast dishes, the visitors, the finale painting, and the name of the night.
The user also approved the pickles of the family: free takes and a cellar value in the price after the bistro cellar is complete.
The user also approved the holidays, the chapter titles, the neighbour help, the arcs of the core characters, the witnesses of the raid, and the quest counts.
The user also approved the dialogue of the six chapters, the dishes and the titles of the quests, the text of the result card of act 3, and the eight quest scenes.
The user accepted the art of the 19 room states of act 3, the dinner painting, the two food atlases, and the two sheets of quest scenes.
