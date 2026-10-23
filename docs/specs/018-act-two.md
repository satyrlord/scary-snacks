# 018: Act 2

Status: Implemented. `PRODUCT.md`, `DESIGN.md`, and `DELIVERY.md` control the behavior.

## Outcome and scope

Act 2 starts on Friday 2 May of year 1, the day after the community supper, and ends on Sunday 31 August. Act 3 starts on Monday 1 September.
The interior of the bistro and the courtyard are complete. In the summer, the bistro grows past its walls. Mara cooks in a summer kitchen, plants the vegetable garden, and prepares the summer festival in the town square for the mayor.

Mara has two reasons. She feels a duty to the village. She also wants money: a neglected orchard near the bistro is for sale, and she saves to buy it. The purchase of the orchard is the last goal of act 2. The orchard is a location of act 3.

The mystery of the cathedral continues. A monk of the cathedral, Ambrozie, cannot sleep, because the sleeper behind the red door snores. He spends a day and a night in the village and dines at the bistro.
The story of the page has two events, and Ambrozie gives both:

- The page discovery, at his lunch on Sunday 13 July. He looks at Mamaia's notebook and sees that the Cyrillic page is printed, not handwritten. The page comes from a book of the cathedral library. Mamaia tore it out and pasted it into her notebook.
- The debt revelation, at the feast on Friday 15 August. The theft bound the family to the cathedral. Mara came back to the village to inherit the bistro, and she pays back the theft through service.

The tone stays cosy, eerie, and comic. The sleeper is a threat of mischief, not of harm.

The feature covers these parts:

- the dates, the held days, the chapters, and the 24 preparations of act 2;
- the clock of act 2;
- the three areas of act 2: the summer kitchen, the vegetable garden, and the town square;
- the garden benefits, and the purchase of the orchard;
- the festival: its contract, its stall quests, and its day;
- Ambrozie, his visit, and the story of the page;
- the mayor Gavril Hămălescu and the piper Tarka Miklós;
- the quests of Sânziana for her sisters, and her decorations for the festival;
- the five quests of act 2 that follow the stories of act 1;
- the pickle barrel as a paid source in act 1 and act 2;
- the hail;
- the new dishes, the new characters, and the new art;
- the change from act 1 to act 2, the end of act 2, and the saves;
- the acceptance checks.

The feature does not include these parts:

- the orchard area, which belongs to act 3;
- the interior of the bistro and the courtyard in the room of act 2.

## Dates

Act 2 has the weekdays of year 1 in spec 015.

| Date | Event | Use |
| --- | --- | --- |
| Friday 2 May | The day after the supper | Act 2 starts. |
| Saturday 3 May | The eve of the departure of Ionatan for the castle | `ionatan-castle-dinner`. In the novel, he dines in the town on 3 May and reaches the castle in the night of 4 May. |
| Thursday 29 May | The Ascension (Ispas) | A holiday quest of Cătălina: the Ispas bells. |
| Saturday 7 June | The summer Saturday of the dead (Moșii de vară) | A holiday quest of Bela. Families give pots of food and water for the dead. Eszter makes the pots. |
| Sunday 8 June | Pentecost (Rusalii) | A quest of Sânziana. The Rusalii are wild fairies. Wormwood and garlic keep them away. |
| Saturday 14 June | The six-month memorial of Mamaia Paraschiva | Mamaia died on 20 December, so six months fall on Friday 20 June. The family holds the memorial on the Saturday before, because Saturday belongs to the dead. A quest of Mara. It opens after preparation 10, so preparation 11 needs it, and preparation 10 does not wait for the memorial. |
| Saturday 21 June | The summer solstice | The summer festival in the town square. |
| Monday 23 June | Midsummer Eve (Sânziene) | `sanziana-midsummer`. |
| Tuesday 24 June | Sânziene and the day of the embroidered blouse (Ziua iei) | A holiday quest of Ileana. Ana gathers medicinal herbs on this day, when herbs are strongest. |
| Saturday 12 and Sunday 13 July | The visit of Ambrozie | A day and a night in the village. |
| Friday 18 July | The hail | The hail blockers. |
| Sunday 20 July | Saint Elijah (Sfântul Ilie) | The name day of Ilie. Saint Elijah brings thunder and hail, so the hail and `catalina-hail` are in the same week. The quests of Ilie and Victor for this day open after preparation 17, from 17 July, so the player can cook them before the holiday. |
| 1 to 14 August | The Dormition fast | The fasting rules of Lent apply to Ilie and Cătălina. |
| August | The search of Mina | `mina-avram-search`. |
| Friday 15 August | The Dormition (Sfânta Maria Mare) | The feast of the cathedral in the town square. |
| Sunday 31 August | The last day of act 2 | The purchase of the orchard. |

### Held days

The calendar of act 2 has seven held days. Each held day uses the hold rule of 30 April and 1 May in spec 015: a merge that reaches the closing time does not close the day, and the clock stays one merge before the closing. The day has no upkeep and no night while it holds.

| Day | Holds until | Mara's line while the day holds |
| --- | --- | --- |
| Friday 20 June | the payment of preparation 12 | "The square must be ready by morning." |
| Saturday 21 June | the delivery of the fifth stall quest | "The festival lasts until the last stall is full." |
| Saturday 12 July | the delivery of Ambrozie's dinner | "Ambrozie waits for his dinner." |
| Sunday 13 July | the delivery of Ambrozie's lunch | "Ambrozie waits for his lunch and the notebook." |
| Thursday 14 August | the payment of preparation 24 | "The feast tables must be ready by morning." |
| Friday 15 August | the feast | "The village waits for the feast." |
| Sunday 31 August | the purchase of the orchard | "The cathedral sells the orchard today." |

The action that releases a held day comes at one of two clock positions:

- Before the held position: the day continues. The merge that reaches the closing time closes the day as usual.
- At the held position, one merge before the closing: the action closes the day in the same change, as the payment of preparation 24 does on 30 April. The closing has all its usual steps, and the next day starts once.

While 20 June or 14 August holds, each booked delivery ends the evening of its guest, and the game fixes the next evening guest at once, as on 30 April. The other held days have no evening guest of Vlad or Elisabeta. A held day permits the recovery quest and the repeating quests by their usual rules, so the player can always earn the coins of a held payment.
The weather of each held day is fair, so an outdoor quest can deliver on it.

#### Each held day can end

The release of a held day needs some preparations and quests: the preparations and quests that it needs directly, and their prerequisites. These are the release requirements of the held day. A late player can reach a held day with each of them open or unpaid. So the data check proves that the player can complete each of them on the held day.

The check uses the earliest delivery of each quest. The earliest delivery is the latest of these days:

- the opening date of the quest;
- the opening date of the chapter of the preparation after which the quest opens;
- the holiday of a holiday quest;
- the evening of a fixed booking;
- the earliest delivery of each quest that it needs, and the earliest payment of each preparation that it needs.

The earliest payment of a preparation is the latest of the opening date of its chapter and the earliest delivery of each quest that it needs.

An earlier held day holds until its release, so each of its release requirements is complete before a later held day starts. The check of a held day therefore examines only its new release requirements: the release requirements that no earlier held day has. For example, the purchase needs each booked quest of Vlad and Elisabeta, but preparation 24 needs them too, so the hold of 14 August completes them before 31 August.
The check fails if a new release requirement:

- has an earliest delivery or an earliest payment after the held day;
- is a booked quest of Vlad or Elisabeta, and the held day has no evening of theirs: 21 June, 12 July, 13 July, 15 August, or 31 August.

These authoring rules follow from the check:

- No booked quest of Vlad or Elisabeta opens after preparation 12, 13, or 14. Such a quest would gate preparations 13 to 15, and Ambrozie's dinner opens only after preparation 15.
- No booked quest of Vlad or Elisabeta opens after preparation 24. Preparation 24 or an earlier preparation needs each of their quests, so the 14 August hold completes each one before the purchase on a Sunday, and the check of 31 August does not examine them.
- No quest that preparations 1 to 15 need has an earliest delivery after 12 July.
- No holiday quest that a held day needs has its holiday after that held day. Cătălina's quest for the bell of the feast is a holiday quest of 15 August. It opens after preparation 24, so only the purchase needs it.

#### Tickets on a held day

On a held day, the open release requirements get the quest tickets first, in authored order. The other open quests take the free tickets after them, also in authored order. So a quest that cannot deliver on the held day never keeps a release requirement off the counter. For example, on 21 June the open stall quest gets the first ticket, and a holiday quest of 23 or 24 June waits without a ticket if the counter is full. The recovery quest keeps its own ticket. An open March quest follows the same rule: it can wait without a ticket on a held day.

The discovery check of act 2 uses this ticket order. A release requirement can get its first ticket on its held day, before the other quests that come earlier in authored order. So, for a release requirement of a held day, the check counts only the dishes of the quests that it waits for and of the earlier release requirements of the same held day. An earlier quest that is not a release requirement of that held day teaches it no dish.


## The clock of act 2

Act 2 has 122 days: 104 weekdays and 18 Sundays. At the act 1 merge time of 15 minutes, the days of act 2 hold about 6,700 merges. The days of act 1 hold about 4,200 merges.
Act 2 has as many preparations as act 1, so act 2 uses a merge time of 25 minutes. The story reason: the summer kitchen has one clay oven and one stove, so each dish takes longer.

| Days | Opening time | Closing time | Booking time | Merges |
| --- | --- | --- | --- | ---: |
| Monday to Saturday | 07:00 | 22:00 | 19:30 | 36 |
| Sunday | 10:00 | 17:30 | No booking | 18 |

Each time of act 2 is on the 25-minute grid, so the clock needs no rounding. The weekday clock shows 07:00, 07:25, 07:50, and so on to 22:00. The booking time is the 30th merge of a weekday. The lantern control moves the clock to 19:30 in one change. A Sunday closes half an hour later than in act 1.
In act 2, the evening bookings are at 19:30: supper in the summer kitchen comes before the mosquitoes. The opening of each booked quest of act 2 names 19:30.
The days of act 2 hold about 4,070 merges, the same work as act 1.

The game data gives the day levers of each act. The act comes from the day number: 1 May and earlier days use the levers of act 1, and 2 May to 31 August use the levers of act 2. The data check keeps the times of each act on the merge grid of that act.

The merge time is a lever. The balance test of act 2 measures it. A change of the merge time also changes the opening, closing, and booking times, so that they stay on the grid.

### Meals in one weekday

A meal fits in one weekday of its act. In act 2, a meal needs at most 36 merges. Provisions, the stall quests, and the feast can need more.
These three meals of act 2 follow the stories of act 1, and their dishes fit the weekday of act 2:

| Quest | Dishes | Merges |
| --- | --- | ---: |
| `ionatan-castle-dinner` | Red wine and a sharing board | 34 |
| `mina-avram-search` | Zacuscă, roasted vegetables, telemea, and two fruit teas | 35 |
| `catalina-hail` | Zacuscă toast and two plum dumplings | 21 |

A meal on a short day also fits that day. Ambrozie's lunch on Sunday 13 July is one fish soup and two cherry compotes, 8 merges, so the lunch fits a Sunday of 18 merges after the work of the evening before. On 15 August, the Dormition quests of Cătălina and Bela open in the morning. They are small, so the feast keeps the dishes that the player cooks before its day: Cătălina's "The bell of the feast" is a plum dumpling and a fish soup, and Bela's "The Dormition" is a linden tea and a colivă.

## Chapters and preparations

Act 2 has six chapters and 24 preparations. Each area has eight preparations. Each chapter has four preparations.

| Chapter | Opening date | Days | Preparations | Story |
| --- | --- | ---: | --- | --- |
| 1 | Friday 2 May | 17 | 1 to 4 | The summer kitchen. Ionatan dines on his way to the castle. Mara sees the orchard and learns its price. |
| 2 | Monday 19 May | 17 | 5 to 8 | The garden gives its first vegetables. The mayor offers the festival contract. Pentecost. |
| 3 | Thursday 5 June | 17 | 9 to 12 | The square is ready for the festival on 21 June. |
| 4 | Sunday 22 June | 22 | 13 to 16 | Midsummer Eve. The piper's fee. Ambrozie visits and reads the notebook. |
| 5 | Monday 14 July | 19 | 17 to 20 | The missing page. Saint Elijah and the hail. The Dormition fast starts. |
| 6 | Saturday 2 August | 30 | 21 to 24 | The feast of the cathedral on 15 August. Then the purchase of the orchard. |

Chapter 6 is longer, because the player saves for the orchard after the feast.

Each chapter names one quest of a core character as its neighbour help. That quest opens during the chapter.

As in act 1, the payment of the fourth preparation of a chapter completes the chapter and queues its closing scene. The payoff and the closing scene tell only what the four preparations and the quests that they need give. The festival, the feast, and the purchase come after the payments of preparations 12 and 24, so they have their own scenes: the completion scene of the fifth stall quest, the finale of act 2, and the scene of the purchase.

| Chapter | Title | Objective | Payoff | Neighbour help |
| ---: | --- | --- | --- | --- |
| 1 | A kitchen outside | Turn the old shed into a summer kitchen. | The clay oven is warm, and the first loaf comes out of it. | Eszter, who builds the clay oven |
| 2 | Beds and benches | Plant the garden and take the mayor's contract. | The beds are dug, and the square has room for the village. | Sorin, who brings the news of the contract |
| 3 | The summer festival | Make the square ready for 21 June. | Sânziana's garlands hang over the square, and the five stalls wait for the festival. | Mara: the six-month memorial, which opens after preparation 10 |
| 4 | A guest who snores | Mend the garden and the kitchen after the festival. | The well pump runs, and Ambrozie has read the notebook. | Ilie, whose family notebook meets Mamaia's notebook |
| 5 | The missing page | Let the garden climb while the visitors search the library. | The scarecrow keeps the crows away, and everybody knows which page is missing. | Eszter: the hail and the mended pots |
| 6 | What the family owes | Lay the tables for the feast of the cathedral. | The feast tables stand under the awnings, and the village waits for 15 August. | Sorin, who keeps the secret |

| Number | Area | Preparation | Benefit |
| ---: | --- | --- | --- |
| 1 | Summer kitchen | Clear the shed | |
| 2 | Summer kitchen | Mend the roof | |
| 3 | Summer kitchen | Build the clay oven | |
| 4 | Summer kitchen | Set the stove and the chimney | |
| 5 | Vegetable garden | Clear the weeds | |
| 6 | Vegetable garden | Dig the beds | Garden stage 1. The Garden beds source opens. |
| 7 | Town square | Sweep the square | |
| 8 | Town square | Set the tables and the benches | |
| 9 | Town square | Build the food stalls | |
| 10 | Town square | Raise the stage | |
| 11 | Town square | Hang the lanterns | |
| 12 | Town square | Hang Sânziana's garlands | Sânziana's decorations. No material cost. |
| 13 | Vegetable garden | Mend the fence | |
| 14 | Vegetable garden | Repair the well pump | Garden stage 2. |
| 15 | Summer kitchen | Hang the shelves | |
| 16 | Summer kitchen | Fit the screen door | |
| 17 | Vegetable garden | Build the bean trellis | |
| 18 | Vegetable garden | Put up the scarecrow | |
| 19 | Summer kitchen | Plant the vine arbour | |
| 20 | Summer kitchen | Lay the brick floor | |
| 21 | Vegetable garden | Set the rain barrels | |
| 22 | Vegetable garden | Build the drying racks | Garden stage 3. The racks prepare the preserves of act 3. |
| 23 | Town square | Raise the awnings | |
| 24 | Town square | Lay the feast tables | |

The festival on 21 June follows preparation 12. The feast on 15 August follows preparation 24. The "Held days" section gives the holds.
The "Garden beds" section gives the arrival of the Garden beds.

The IDs of the preparations, the chapters, and their scenes in act 2 are different from the IDs of act 1.

## Story outline

1. May. The bistro kitchen is too hot for summer. Mara clears the old shed between the bistro and the garden and makes it a summer kitchen. Ionatan dines on his way to the castle. Mara sees the neglected orchard and learns its price.
2. Late May and early June. Mara clears the vegetable garden, and the first beds give vegetables. The mayor offers Mara a contract for the summer festival. Sânziana asks for food for her sisters on Pentecost.
3. June. Mara prepares the town square. Sânziana gives all the decorations of the festival. She does not come to the festival: she and her sisters gather bedstraw in the meadows for their own night on 23 June. Tarka Miklós plays at the festival.
4. Late June and early July. The mayor does not want to pay the piper, so Mara pays him. Ambrozie spends a day and a night in the village. He dines at the bistro and reads Mamaia's notebook. He says that the Cyrillic page is printed, and that it comes from the cathedral library.
5. Late July. Ambrozie and the visitors look for the book. The librarian under the cathedral screams when a page turns. Now everybody knows why: one page is missing. Hail falls on the summer kitchen. Ilie celebrates his name day.
6. August. At the feast of the cathedral, Ambrozie tells Mara why Mamaia took the page, and what the family owes. He does not take the page back. A stolen page is paid back in service, not in paper. Mina and Avram pass through. Janos has his proper meal. Mara buys the orchard on the last day of summer.

The page discovery and the debt revelation come from Ambrozie. He knows the library, the book, and the rules of the cathedral. The loose pages of the archbishop, which Janos reads, confirm the year of the theft. Janos tells this over the proper meal that he promised in act 1, after the feast.

### Continuity with act 1

- The archbishop left the village forty years ago with the money for the church roof. Mamaia never forgave him. In her will, she left her savings to the church roof.
- In the year that the archbishop left, Mamaia took the prayer from the library. With no archbishop in the cathedral, she wanted to protect the bistro from what lives under it. Her gift to the church roof is a first payment of the debt.
- The page is a prayer against strigoi. The painting in `notebook-pages` shows a printed page with a red initial. In the prologue, Mara says only that the letters look like the letters of old church books.
- In act 2, Ambrozie shows that Mamaia tore the page from a printed church book and pasted it in.

## Areas of act 2

Act 2 has three areas: the summer kitchen, the vegetable garden, and the town square. They replace the areas of act 1 in the room from 2 May. The interior of the bistro and the courtyard are complete, and they show only in the sketches of the quest scenes.
Preparations repaint each area, as in act 1. The cats stay in the room.

Later acts can add other areas, for example the attic or the cellar of the bistro, when the story needs them.

### The summer kitchen

The summer kitchen is a shed between the bistro and the vegetable garden. Many village houses cook in a summer kitchen, so the house stays cool. In act 2, the summer kitchen is the main room. Mara cooks all the dishes there.

### The vegetable garden

The garden has three stages. Each stage changes the garden value: the coins that one garden ingredient adds to a menu price.

| Garden stage | Preparation | Garden value |
| ---: | --- | ---: |
| 1 | 6, "Dig the beds" | 1 |
| 2 | 14, "Repair the well pump" | 2 |
| 3 | 22, "Build the drying racks" | 3 |

The garden ingredients are the ingredients of the Vegetable crate and of the Garden beds. From garden stage 1, a take from these sources is free.
In the menu price, a garden ingredient counts its garden value, not the take cost and not zero. This rule replaces the zero of a seasonal source for the Garden beds.
So the free take is profit, and each later stage raises the price of each dish with garden vegetables.
Before garden stage 1, the Vegetable crate is a paid source, and its ingredient counts the take cost.

#### When a price changes

A dish on the board has no saved value. Its price comes from the current garden stage. These rules apply:

- The game shows no menu price. The reward of a ticket shows the price of its dishes.
- A repeating quest and the recovery quest pay their menu value at the current garden stage, at the delivery. The ticket shows the current reward, so the reward goes up when the player pays a stage preparation while the quest is open.
- A campaign quest of act 2 has an authored reward. The generator writes the menu value at the garden stage of the preparation after which the quest opens. A campaign quest that opens after preparation N gets its delivery before the payment of preparation N + 1, so the garden stage does not change while the quest is open. A dated quest follows the same rule.
- A quest of act 1, for example an open March quest, keeps its authored reward.

Two examples, with the take cost of 1 coin and the work rate of 2 coins:

| Dish | Ingredients | Merges | Before stage 1 | Stage 1 | Stage 2 | Stage 3 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Summer salad, a chain dish | 2 garden | 1 | — | 4 | 6 | 8 |
| Tomato salad with telemea, a mixed dish | 2 garden and 8 dairy | 9 | — | 28 | 30 | 32 |

Before stage 1, the Garden beds are absent from the source tab, so the player cannot take their ingredients.
For the Summer salad at stage 2: 2 × 2 + 1 × 2 = 6. For the Tomato salad with telemea at stage 2: 2 × 2 + 8 × 1 + 9 × 2 = 30.

The garden values are levers. The balance test of act 2 measures them.

## The town square and the festival

The mayor, Gavril Hămălescu, gives Mara a contract for the summer festival. Mara prepares the square in preparations 7 to 12.
Gavril is a regular. He arrives with preparation 6. His arrival scene is the offer of the contract.

### Sânziana's decorations

Sânziana gives all the decorations of the festival: bedstraw crowns, garlands, and flowers for the stalls.
Her quest "Garlands for the square" opens after preparation 11. It is a campaign quest, so preparation 12 needs it. It asks for provisions for her sisters and pays its menu value.
Its completion scene brings the decorations. Preparation 12, "Hang Sânziana's garlands", has a labour cost and no material cost.
On Midsummer Eve, girls throw their crowns onto a roof. A crown that stays on the roof tells of a wedding in the year. Her letter can tell this custom.

### The stall quests

The festival has five stall quests. Each stall quest belongs to the mayor and names its stall. The stall quests are provisions for the crowd, so the one-meal limit does not apply. For the same reason, a stall quest does not need a favourite dish of the mayor. Each stall quest is a holiday quest of the festival on 21 June.

The stall quests are sequential orders. They follow the usual rule for the quests of one character: each stall quest opens after the delivery of the stall quest before it. So the mayor has one open stall quest at a time, and the stall quests take at most one ticket. On 21 June, the open stall quest gets the first ticket. The "Tickets on a held day" section gives the rule.

- The grill opens after preparation 12, with an opening date of Wednesday 18 June. Before 21 June, its ticket shows "For the festival, Saturday 21 June", and Later takes the place of Deliver. It has work only while a portion is missing.
- Deliver works from the opening time of 21 June.
- Each delivery of a stall quest opens the next stall quest in the same change. The four later stall quests open on 21 June, so their Deliver works at once.
- 21 June holds until the delivery of the fifth stall quest.

| Order | Stall | Dishes |
| ---: | --- | --- |
| 1 | The grill | 3 Mici and 3 Loaf |
| 2 | The bakery stall | 2 Langoș and 2 Chimney cake |
| 3 | The garden stall | 3 Summer salad and 2 Tomato salad with telemea |
| 4 | The drinks stall | 3 Socată and 1 Wormwood wine |
| 5 | The sweets stall | 2 Papanași, 2 Plum dumplings, and 2 Cherry compote |

21 June has no evening guest: the whole village is at the festival.
The player sees only the open stall quest. The four later stalls need about 100 merges from fresh ingredients, more than one day of 36 merges.
Cezar's "The shortest night" is also a holiday quest of 21 June. The stall quests take the tickets first on 21 June, so the holiday quests of 21 to 24 June can wait one to three days after their holidays. A late holiday quest keeps its reward. So the festival usually uses the hold of 21 June, and Mara's line tells it: "The festival lasts until the last stall is full."

The completion scene of the fifth stall quest ends with the festival painting. Its last button, "See the festival", opens the painting. A replay of the scene from the journal also ends with the painting. The painting shows only in the scene. The room keeps the state of the square, so the later preparations of the square show as usual.

### The festival painting

The painting shows the square on the evening of 21 June, under Sânziana's garlands. It has eight named people in a crowd of villagers:

- Tarka Miklós plays on the stage. A line of rats follows his tune.
- Gavril Hămălescu makes a speech at the front.
- Mara works at the grill stall.
- Mama and Tata sit at a table. Tata wanted to sell the bistro, and now he sees the village full.
- Ilie, Eszter, and Sorin move between the stalls.

Mara's parents visit the bistro for the festival. Their visit has one quest and one scene.

### The piper

Tarka Miklós plays at the festival. The mayor does not want to pay him, so Mara pays him in food.
Tarka is a single-visit visitor. His quest "The piper's fee" opens after the delivery of the mayor's budget lunch, not before Sunday 22 June. At that lunch, the mayor refuses to pay the piper. The quest pays no coins. Its delivery ends his visit, and his farewell scene stays unread in Story. His tune leads the thief rats away: the thief rat does not come at the next four Sunday closings after the delivery. If the delivery is on a Sunday, the closing of that Sunday is the first of the four.
At these four closings, Șoricescu comes by his usual rule. If the board has a loose raw ingredient, no rat comes, and the morning dialog says "The piper's tune still plays in the cellar. No rat came." A closing without the thief rat does not use the random seed.
The story repeats the theme of the act: a debt is paid.

## The feast of the cathedral

The feast is the finale of act 2. It is on Friday 15 August, in the town square. Ambrozie's quest for the feast opens after preparation 24. As the supper, it asks for one plate for each guest and pays no coins.

- Before 15 August, the feast ticket shows "Booked for 15 August", and it has work only while a plate is missing. The player can cook the plates on earlier days.
- On 15 August, the ticket shows "Booked for 19:30". Serve works from 19:30 to the closing. Before 19:30, the lantern control replaces Serve, and it works when the board holds every plate.
- 15 August holds until the feast, and it has no evening guest. The "Held days" section gives the release.
- The feast does not stop the clock. Play continues in act 2 after the feast.

Serve on the feast queues the finale of act 2. The finale ends with the feast painting, and a replay from the journal also ends with it. After the feast, the square of the room shows the feast painting until the end of act 2, as the courtyard shows the supper painting after the supper. No preparation of the square comes after the feast, so the painting hides no state.

The feast has nine guests and asks for eleven dishes:

- Ambrozie blesses the table at its head.
- Mara stands with the last pot.
- Ilie, Eszter, and Sorin sit at the table.
- Cătălina rings the bell of the cathedral.
- Adrian, Monica, and Janos come up from the red door.
- One chair stays empty, with a candle and one mended plate for Mamaia that holds two dishes: colivă and colaci. On the Dormition, families give food in memory of their dead. The quest dialog names these two dishes "Mamaia’s chair".

Villagers and the doors of the cathedral are in the background.
In year 1, the Dormition is on a Friday. On that day, the Church permits fish, wine, and oil, but no meat, dairy, or eggs. Each plate of the feast obeys this rule. Monk's stew and the fish dishes suit it.
Mamaia's plates hold a colivă and colaci, the food of a memorial.

## The orchard

The neglected orchard near the bistro belongs to the cathedral. Nobody in the village buys it, because the old trees creak at night. The cathedral sells it to finish the church roof, on the last day of summer. So Mara's purchase also helps to pay the old debt.

The purchase is the last payment of act 2. Story shows it after preparation 24, as a preparation. The purchase has no new control.

- From the feast, Story shows the purchase and its price.
- The purchase needs these items: the price in the purse, every campaign quest of act 2, and the date of Sunday 31 August.
- Janos's proper meal is a campaign quest. It opens after the feast, so the purchase needs it. The other campaign quests that open after the feast follow the same rule.
- Before 31 August, the list of requirements shows "Opens on Sunday 31 August". A failed payment changes nothing. A player with enough coins on 15 August cannot pay before 31 August.
- 31 August holds until the purchase.

The payment follows the rules of a preparation payment: the game saves it before the progress becomes active. If the write fails, the purchase spends no coins and gives no progress.

### The price

The price is a lever. The price is 2,000 coins.
The efficient run of act 1 carries its purse into act 2. Act 2 has the same work as act 1, a larger upkeep, and the garden profit.
The accounts of act 2 start at the supper, when the game records the result of act 1, and end at the purchase. They count 122 closings: 1 May to 30 August. They count 17 Sunday nights: 4 May to 24 August. The closing of 31 August is not in the accounts of act 2. The balance report states this boundary.
The price leaves the efficient run with about 10% of the spending of act 2 after the purchase. That is the middle of the balance band of 0 to 20%. The balance test measures the price by this rule.

## Ambrozie

Ambrozie lives at the cathedral. The sleeper behind the red door snores, and Ambrozie cannot sleep. He takes one day and one night away.
Ambrozie is a returning visitor. He comes back in act 3. The journal holds his introduction, as for Adrian, Monica, and Janos.
He is the monk of the cathedral who sells the pickle barrels to the bistro. His introduction tells that Mara knows his pickles before she knows his face. "The pickle barrel" section gives the rule.

### His dinner

His dinner is a fixed booking: a booked quest with a fixed evening, Saturday 12 July.

- The dinner opens after preparation 15, with an opening date of Thursday 10 July. Preparation 16 needs it.
- The evening of 12 July belongs to Ambrozie. Vlad and Elisabeta never get that evening. The evening of Ambrozie does not change the guest of the last evening, so the turns of Vlad and Elisabeta continue on the next evening.
- At the opening time of 12 July, if his ticket is on the counter, Ambrozie is the evening guest. Otherwise the arrival of his ticket on the counter makes him the evening guest.
- His ticket shows "Booked for 19:30" on 12 July and "Booked for Saturday 12 July" before. Deliver and the lantern control follow the usual rules of an evening guest.
- 12 July holds until his dinner. So the player cannot miss the dinner. If the player has not paid preparation 15 by 12 July, the hold permits the payments and the deliveries before the dinner.

Vlad and Elisabeta share the other evenings by the rules of spec 013. The data check keeps exactly two guests in that rotation. A fixed booking is not in the rotation.

### His night and his lunch

He sleeps in the courtyard of the bistro on the night of 12 July. A Saturday closing opens no dialog, so the closing notice of 12 July says only "Ambrozie sleeps in the courtyard."
His lunch is a dated quest on Sunday 13 July: one fish soup and two cherry compotes. It opens at the delivery of his dinner, not before the opening time of 13 July. Deliver works from the opening time of 13 July. Preparation 16 needs it. 13 July holds until his lunch.
The opening of the lunch tells his night: Ambrozie snores too, and Miez slept on the roof. At lunch, he reads the notebook.
The closing of Sunday 13 July has the usual Sunday night.

## Sânziana and her sisters

Sânziana has two quests of act 2 in the game data: "Midsummer Eve" and "A picnic in the meadow". Both are provisions for her sisters.
She has two new quests:

- Pentecost: food and wormwood wine for the sisters, to keep the Rusalii away.
- "Garlands for the square", the mandatory quest of the festival decorations. Her letter comes with the decorations.

## Quest plan

Act 2 has about as many campaign quests as act 1, because it has the same work. The balance test of act 2 measures the count.

| Character | Campaign quests |
| --- | --- |
| Mara, Ilie, Eszter, and Sorin | Six each |
| Gavril Hămălescu | Seven: the contract lunch, the five stall quests, and the budget lunch |
| Tarka Miklós | One: "The piper's fee" |
| Ambrozie | Two: his dinner and his lunch. The feast is the finale. |
| Sânziana | Four |
| Adrian, Monica, and Janos | Three watch visits, and the meal of Janos |
| Mama and Tata | One: the festival visit |
| Ionatan, and Mina and Avram | One each |
| Ileana, Costel, Victor, Dorian, Cezar, Bran, and Ana | Six each |
| Bela and Cătălina | Four each |
| Vlad and Elisabeta | Three each |
| Dochia | None. She is on the high pasture with her flock until act 3. |

Act 2 has 101 campaign quests and the feast. Gavril keeps seven quests: the five stall quests and his two lunches. The balance test of act 2 can change the counts of the other regulars with quests. Each of those regulars keeps two to six quests. Dochia has no quest in act 2.
The core characters step back a little in act 2. The new characters and the regulars carry more of the act.

### The funding check

In act 1, the data check adds the work value of the quests that open before each preparation: the merges of their dishes times the work rate. In act 2, a quest can earn more or less than its work value. A garden ingredient adds its garden value, and "The piper's fee" pays nothing. So the check of act 2 uses the funding of each quest:

- The funding is the authored reward minus the take costs of the ingredients.
- A take from a free source costs nothing: the Herb basket, the forage basket, the Garden beds, and the Vegetable crate from garden stage 1.
- The take costs use the garden stage of the preparation after which the quest opens, as the reward does.
- A quest with no reward has a negative funding: the player pays for its ingredients and earns nothing. "The piper's fee" is such a quest.

The check adds the funding of the quests of act 2 that open before each preparation of act 2. It also adds the costs of the preparations of act 2 up to that preparation. The funding must cover the costs. The check does not count the purse that act 1 carries. The coins that remain after preparation 24, with the funding of the quests of act 2 that open after it and before the feast, must pay for the ingredients of the feast. The same rule applies to act 1 and the supper. A quest of act 2 that opens after the last preparation of act 1 funds act 2, not the supper. The balance test covers the upkeep and the price of the orchard.

### The core characters

Each core character has one arc for the act. The change comes in chapter 5 or 6. The table names the event that starts each change: the page discovery on 13 July, the hail on 18 July, or the debt revelation on 15 August.

| Character | Want | Complication | Change |
| --- | --- | --- | --- |
| Mara | She saves for the orchard and wants the festival to go well. | Her duty to the village costs coins: the piper's fee and the stalls. The memorial on 14 June brings back her grief. | After the debt revelation, the orchard is part of the family debt, not only profit. Her change shows in the finale and in the scene of the purchase. Her crown stays on the roof of the summer kitchen. |
| Ilie | He wants to bake in the new clay oven as his grandmother did, from his family notebook. | The oven does not do what the notebook says. On his name day, 20 July, the whole village expects his bread. | After the page discovery, he sees that each page of his notebook is handwritten. He writes the first summer recipes in it himself. This prepares his act 3 quest "Jars for winter". |
| Eszter | She wants to show her craft: she builds the clay oven and makes the pots for Moșii de vară and the plates of the festival. | The hail on 18 July breaks her pots and her pride. | After the hail, a wandering tinker mends the pots with wire, an old craft of the villages. The tinker has no quest. Eszter keeps the mended pots for the feast, and Mamaia's plate is one of them. |
| Sorin | He carries the summer news: the orchard that creaks, Ambrozie on the road, and the rats that follow the piper. | After the page discovery, Mara asks him to keep the story of the page secret. | He keeps the secret, with comic near-misses in each of his later quests. |

### The regulars

Each quest of a regular asks for at least one favourite dish, except a stall quest.

| Regular | Quests | Summer thread |
| --- | ---: | --- |
| Gavril Hămălescu | 7 | He haggles over the contract lunch in chapter 2. In chapter 4, at his budget lunch, he refuses to pay the piper. His favourite dishes are Mici, Socată, and Papanași. |
| Ileana | 6 | She sews embroidered blouses for half the village before Ziua iei on 24 June. Her brother has left his spinning again. |
| Costel | 6 | He builds a mechanical nightingale for the stage of the festival. It sings only for shiny spoons. After the festival, it does not stop. |
| Victor | 6 | He has exams in June. Then his summer project needs lightning, and he waits for the thunder of Saint Elijah on 20 July. The project is a soufflé again. |
| Dorian | 6 | The summer season: a garden party, a portrait in summer light, and the festival. He does not age in the heat. |
| Cezar | 6 | 21 June is the shortest night, so he has almost no time to rest his eyes. This prepares his act 4 quest "The longest night". |
| Bran | 6 | He drives night buses for the festival crowd and for Sânziene. His horse refuses the woods on Midsummer Eve. This prepares his act 3 quest "The pumpkin fair". |
| Ana | 6 | A heat wave on the night ward, and the medicinal herbs that she gathers on 24 June. |
| Bela | 4 | The pots for the graves on Moșii de vară, 7 June. Mamaia's grave on 14 June. The Dormition, when families remember their dead. The feast does not invite him. |
| Cătălina | 4 | The Ispas bells on 29 May, `catalina-hail` on 18 July, and the bell of the feast on 15 August. Her quests obey her fasts. |
| Vlad | 3 | Booked dinners. His house guest, Ionatan, arrives in May, sleeps all day in July, and leaves through a window in August, before the news of Mina. Vlad complains only about the manners of his guest. |
| Elisabeta | 3 | Booked dinners. Vlad moves the fence between their lands all summer. |

### The visitors

Adrian, Monica, and Janos keep the watch at the red door. They do not want to wake the sleeper. Each visitor has one supply quest, in turn. Each quest asks for food that makes a sleeper sleep, for example linden tea and heavy stews.

| Chapter | Visitor | Finding |
| ---: | --- | --- |
| 2 | Adrian | The watch at the red door starts. The snoring is louder this summer. |
| 4 | Monica | She finds the shelf of the library with the torn book. |
| 5 | Janos | He reads the loose pages of the archbishop and finds the year of the theft. |

All three come up for the feast. After the feast, Janos has the proper meal that he promised in act 1. The purchase of the orchard needs that meal.

## Other quests of act 2

These quests of act 2 follow the stories of act 1:

| Quest | Character |
| --- | --- |
| `ionatan-castle-dinner`, "Dinner before the castle" | Ionatan |
| `mina-avram-search`, "A meal before the search" | Mina and Avram |
| `sanziana-midsummer`, "Midsummer Eve" | Sânziana |
| `sanziana-meadow`, "A picnic in the meadow" | Sânziana |
| `catalina-hail`, "Bell-ringer's appetite" | Cătălina |

The "Meals in one weekday" section gives the sizes of three of them.

### The news of Mina and Avram

The third delivery after `mina-avram-search` earns the local news that they found Ionatan. Deliveries of the recovery quest and of the repeating quests do not count. Act 2 must always earn the news before the purchase, so the data check proves that at least three campaign quests of act 2 can open only after that delivery. Each of them opens after a preparation that needs `mina-avram-search`, or waits for it. The purchase needs every campaign quest of act 2, so the player delivers those three quests, and earns the news, before the purchase.

## The hail

Hail falls on the summer kitchen at the opening time of Friday 18 July. The weather of 18 July is rain. The hail is one authored batch of three blockers:

- two hailstones, and each covers a Tomatoes;
- one broken pot, which covers a Herb bunch.

The hail takes nothing from the player: each blocker goes only in a free cell and adds its covered item. The player clears a hail blocker by a merge into its item and gets the blocker coin.
The hail blockers follow the placement rules of the preparation blockers:

- A blocker goes only in a free cell, in board order. Placement keeps at least four cells free, so the recovery quest has room.
- At most three preparation blockers and hail blockers can be on the board at the same time. The eight blockers of the start of act 1 and the rat holes do not count.
- The hail batch waits in the queue after the batches that wait at the opening time of 18 July. A successful move, take, delivery, or payment tries placement again. A failed action places nothing.
- A placement never replaces an item and never moves an item.

The record of preparation blockers also holds the hail. It stores the ID and the cell of each placed hail blocker. The hail batch waits from the opening time of 18 July until its three blockers are placed. A hail blocker that the record holds as placed or cleared never waits again. So a reload, an import, or a change from another tab does not repeat the hail.

If a save has no blocker record, its next preparation payment starts the record. On or after 18 July, the record queues the hail before the new preparation batch. It adds no batch for an earlier payment. A save without the record cannot contain a cleared hail blocker.

Cătălina's quest `catalina-hail` opens on 18 July, after the hail. In her dialogue, the first cloud got past her bell and broke Mara's pots, and she rang the second cloud away. Eszter's "Mended pots" opens on 19 July: a wandering tinker mends the pots with wire.

## Small details

- Kittens play with Miez in the later states of the vegetable garden. They are art only.
- Sânziana's letter tells the Midsummer custom: a crown on a roof tells of a wedding in the year. Mara's crown stays on the roof of the summer kitchen. A later act can use this hint.

## New dishes

### The Garden beds

The Garden beds are a seasonal source of spec 017. Their season is 1 June to 30 September. Their chain is Summer garden.
The Garden beds need both preparation 6 and their season:

- If the player pays preparation 6 before 1 June, the source waits. At the opening time of 1 June, it joins the source tab.
- If 1 June comes before the payment, the payment of preparation 6 adds the source in the same change, also to a full board.

| Source | Stage 1 | Stage 2 | Stage 3 | Stage 4 |
| --- | --- | --- | --- | --- |
| Garden beds | Tomatoes | Summer salad | Aubergine salad (salată de vinete) | Bulion |

The summer salad holds tomatoes, cucumbers, and onions. Bulion is the tomato passata that village families bottle in August, in the summer kitchen. It prepares the preserves of act 3.

### Mixed dishes

| Mixed dish | Part 1 | Part 2 | Chains | Use |
| --- | --- | --- | --- | --- |
| Wormwood wine (vin pelin) | Red wine | Herb bunch | Fruits, Herbs | Pentecost, the drinks stall |
| Tomato salad with telemea | Summer salad | Telemea | Summer garden, Dairy | The garden stall |
| Monk's stew (ghiveci călugăresc) | Bulion | Green beans | Summer garden, Beans | Ambrozie, the Dormition fast |
| Meatballs in tomato sauce (chiftele marinate) | Meatballs | Bulion | Veal, Summer garden | Summer dinners |

Wormwood wine has the alcohol tag. Monk's stew has no tag, so it suits each fast.
Existing dishes cover the other summer meals: mici, langoș, chimney cake, socată, papanași, plum dumplings, cherry compote, colivă, and colaci.

## New characters

Each new character refers to a horror novel, a horror film, local folklore, or a historical figure.

| Character | Role | Kind | Reference |
| --- | --- | --- | --- |
| Ambrozie | A monk of the cathedral | Returning visitor | The novel "The Monk" (1796) |
| Gavril Hămălescu | The mayor | Regular, from preparation 6 | The mayor of Hamelin in the folk tale of the Pied Piper. He haggles over each coin. |
| Tarka Miklós | The piper | Single-visit visitor | The Pied Piper of Hamelin. "Tarka" means pied in Hungarian. He wears a coat of many colours. |

With Gavril, the neighbourhood has 18 neighbours: the four core characters and 14 regulars.

## Art

- The summer kitchen, the vegetable garden, and the town square: one painted state for each preparation, as in spec 001. The game ships all 25 states.
- The festival painting and the feast painting.
- Portraits and sketches of Ambrozie, Gavril Hămălescu, and Tarka Miklós: the summer-guests atlas holds Ambrozie and Tarka, the third regulars atlas holds Gavril, and the fourth sketch sheet holds all three.
- The menu art of the Garden beds, the Summer garden chain, and the four mixed dishes: the food-garden and food-summer atlases.
- The hailstone and broken-pot blockers: the hail-clutter atlas.
- The quest scenes of act 2 show the interior of the bistro and the courtyard as pencil sketches.
- In the room, Miez sits on the windowsill of the summer kitchen, on the windowsill beside the garden, and on the rim of the fountain in the town square.

## The pickle barrel

The pickle barrel is a paid source in act 1 and act 2. Ambrozie pickles vegetables at the cathedral and sells the barrels for the church roof. So each pickle that the bistro buys also pays a little of the old debt. In act 1, the dialogue calls him only "the monk of the cathedral". The bistro cellar of act 3 makes the pickles free. Spec 019 gives that rule.

For the pickle barrel, these rules apply:

- A take from the pickle barrel spends the take cost. With a debt or an empty purse, the take fails and changes nothing, as for each paid source.
- In the menu price, a pickle ingredient counts the take cost. For example, Gherkins cost 1 coin, and Mixed pickles cost 10 coins: 4 × 1 + 3 × 2.
- The season, the arrival, and the departure of the barrel are those of a seasonal source. The barrel gives no gift of Șoricescu.
- The forage basket is free.

The quests of act 1 that ask for pickles pay their menu value with the take cost, and so does Ana's repeating quest "Pickles for the night shift". The barrel is in the source tab at the start of act 1, so the first takes of pickles need the starting gift. The starting gift is 20 coins, at the top of its range of 10 to 20 coins.
The pickle season ends on 20 March, so the barrel normally leaves the source tab before act 2. The rule also applies to a barrel that stays after its season for an open quest of act 1.

The story of the barrel:

- In Mara's "A look at the cellar", the cellar of Mamaia holds empty barrels and no pickles. Mara tells that the barrel in the kitchen comes from the monk of the cathedral.
- The comments of the game data say that the barrel comes from the cathedral, not from the cellar of Mamaia.
- In the prologue, the barrel stands on the balcony of the family flat. The prologue has no purse, so each take is free.

## From act 1 to act 2

The supper no longer stops the clock. 1 May holds until the supper, and the supper releases the hold by the rule of the "Held days" section:

- If the player serves the supper before the held position, 1 May continues. The merge that reaches 22:00 closes 1 May.
- If the player serves the supper at the held position, Serve closes 1 May in the same change.

The closing of 1 May is an ordinary closing: the purse pays the upkeep once, and Friday 2 May starts at 07:00. Act 2 starts with that day, in the same change. The supper still records the result of act 1: the purse at the supper.

At the start of act 2, these items carry over without change:

- the purse or the debt, the board, the open rat holes, the recipe book, the finishes, and the random seed;
- the unread scenes, including the act 1 finale. The player reads them in act 2. The preparation scenes, the closing scenes, and the finale of act 2 follow the act 1 finale in story order;
- the open repeating quest and the recovery quest, by their usual rules;
- an open March quest. It stays open and keeps its reward until its delivery. It holds a ticket by the usual rules, so on a held day it can wait without a ticket while the release requirements fill the counter. It gets the next free ticket after that. A March quest that did not open waits for March of the next year, as in spec 017;
- the forage basket, until the end of its season on 31 May, or later by the retention rule below;
- the record of preparation blockers. The waiting batches of act 1 continue in the queue.

From 2 May, the room shows the three areas of act 2, Story shows chapter 1 of act 2, and the journal keeps the chapters of act 1 under Earlier chapters.

### Seasonal sources after their season

The retention rule of a seasonal source covers the campaign quests of act 2. A seasonal source stays after its season while an undelivered campaign quest of act 1 or act 2, or the open repeating quest, asks for a dish of its chain. It leaves at the first closing after the delivery of the last such quest. So a May quest that asks for a dish of the forage basket keeps the basket after 31 May until its delivery, and progression never waits for a source that left.

## The end of act 2

The purchase of the orchard records the result of act 2: the purse after the purchase.
Act 3 starts on Monday 1 September after the closing of 31 August. Spec 019 gives that change.
If the game has no act 3, the purchase stops the clock, as the supper of act 1 does without act 2. Merges then do not move the clock, and no night comes. Story shows the result card of act 2: "The orchard is yours. The trees creak, and they wait for autumn." The card gives the result, for example "The bistro worked from 2 May to 31 August. The purse holds 214 coins." The board, the recipe book, and the repeating quests stay.

## Data and state

- `tools/create-original-data.ts` authors the day levers of each act, the dates, the held days, the chapters, the preparations, the quests, the dishes, the hail batch, and the scenes.
- The act, the date, the season, the garden stage, and the held day come from the saved day number and the completed preparations, so they need no saved field.
- The state records the preparations of act 2 and the purchase of the orchard in the completed preparations. It records the stall quests, Ambrozie's quests, and the feast in the completed quests.
- The state records the number of Sunday closings left without the thief rat, from 0 to 4.
- The record of preparation blockers holds the hail blockers.
- The state records the result of act 2 after the purchase.
- [Shared save compatibility](README.md#shared-save-compatibility) gives the current save format.
- Save validation applies these rules:
  - The saved day is never later than 31 August.
  - 2 May comes only after the supper. 21 June comes only after preparation 12. 22 June comes only after the fifth stall quest. 13 July comes only after Ambrozie's dinner. 14 July comes only after his lunch. 15 August comes only after preparation 24. 16 August comes only after the feast.
  - The merges of the day are fewer than the merges of the day in its act.
  - A served feast requires 15 August at or after 19:30, or a later day.
  - A served fixed booking requires its evening at or after the booking time, or a later day.
  - The purchase requires 31 August, the feast, and every campaign quest of act 2.
  - A stall quest is delivered on 21 June. A delivered stall quest has the stall quests before it earlier in the list.
- The checkpoint tool writes the act 1 checkpoint saves in the new format, and these act 2 checkpoint saves: 1 May before the supper, 1 May after the supper, 2 May, 20 June, 12 July, 18 July, 14 August, 15 August, and 31 August.
- The balance test of act 2 measures the merge time, the garden values, the price of the orchard, and the repeat work.

## Acceptance

### Balance

The Node.js and browser save-compatibility checks pass against the fixed saves of the current format. They keep the board, the purse, the clock, the progress, and the unread scenes through load, export, import, and continued play.

The balance test of act 2 plays act 2 with 20 fixed seeds. Each run continues the efficient run of act 1 with the same seed.

- The efficient run cooks only for quests and lights the lanterns for each booking. It delivers the repeating quests when the bistro has no other work. Each payment comes on or after the opening date of its chapter. Preparation 12 comes before the closing of 20 June, and preparation 24 comes before the closing of 14 August. It delivers Ambrozie's dinner and lunch and serves the feast before the held position. It buys the orchard on 31 August before the held position, so the hold of 31 August gives it no extra merges. It can use the hold of 21 June, because it cannot see the later stall quests before they open. After the purchase, the purse holds 0 to 20% of the total cost of the preparations, the takes, the upkeep, and the orchard, in the accounts of act 2. Each holiday quest is delivered on its holiday, except that a holiday quest of 21 to 24 June can wait up to three days, because the stall quests take the tickets first.
- The repeat work of the efficient run has the limits of act 1, from 2 May to the purchase. The repeating quests use at most 20% of the merges of act 2. No three days in a row have work only from repeating quests. The saving period after the feast, 16 to 30 August, is not exempt: the campaign quests that open after the feast spread over it. The balance test changes the quest counts, the quests after the feast, and the price of the orchard only inside these limits. For each of the 20 seeds, the report gives the share of repeating merges in act 2, the share from 16 August to the purchase, and the days with only repeating work.
- A test data set with an orchard price that the efficient run cannot pay before the held position of 31 August fails the efficient check.
- A festival run starts on 21 June from a board with no festival dish. It delivers the five stall quests through the hold of 21 June, and 22 June starts once.
- The missed-booking run misses each booking of Vlad and Elisabeta once. It never misses the fixed evening of Ambrozie, because that evening holds its day. It also pays preparation 24 before the closing of 14 August and buys the orchard on 31 August.
- The debt run starts each preparation window with a debt of 20 coins. It gets to each preparation through the recovery quest, and it can use the holds. While the quests of the next payment wait for their dates, it makes recovery teas. It buys the orchard on 31 August.
- The balance test of act 1 passes again with the paid pickle barrel. Its efficient run ends in the balance band, and its debt run still gets to each preparation.
- On each held day, a run that starts at the held position with a debt of 20 coins gets to the release through the recovery quest and the repeating quests.
- After the piper's delivery, the next four Sunday closings have no thief rat, also with loose raw ingredients on the board. The fifth Sunday closing follows the usual rule.

### Rules

- The clock: each time of act 2 is on the 25-minute grid. A weekday closes after 36 merges, and a Sunday closes after 18 merges. The lantern control moves the clock to 19:30. A save on each kind of day loads with the same clock.
- The meals: each meal of act 2 needs at most 36 merges.
- The change from act 1: a supper served before the held position and a supper served at the held position each start 2 May once, with one upkeep. A reload before and after the supper gives the same result. An unread act 1 finale and an open March quest stay after 2 May, and the March quest keeps its reward. The checkpoint tool writes the act 1 checkpoint saves again in the new format, and import of each one works. Import of an export in an earlier format fails and keeps the current save. A failed write at the closing of 1 May keeps the session, and Retry save and export include it.
- The held days: for each held day, the data check passes on the authored data. The checks of the held days with no evening of Vlad or Elisabeta pass, although their release requirements include earlier booked quests of Vlad and Elisabeta, because the hold of 20 June or 14 August completes those quests first. Each of these test data sets fails the check:
  - a booked quest of Vlad or Elisabeta after preparation 13;
  - a booked quest of Vlad or Elisabeta after preparation 24;
  - Cătălina's quest for the bell of the feast, a holiday quest of 15 August, that opens on 12 August after preparation 23, so that preparation 24 needs it.
- The late player on held days: a late player reaches 20 June and 14 August with the booked quests of Vlad and Elisabeta that the release needs still open. The player delivers them on the held day, and each day still ends. On 15 August, no booked quest of Vlad or Elisabeta is open. A late player reaches 31 August with each quest that opens after the feast open, including Janos's meal, and the purchase still ends the day.
- The tickets on held days: in a test data set, Sânziana's quest of 23 June and the quests of Ileana and Ana of 24 June come before the stall quests in authored order, and all three are open on 21 June. The grill gets the first ticket. After the delivery of the grill, the bakery stall gets the first ticket, one of the holiday quests waits, and 21 June ends after the fifth stall.
- The discovery check on held days: a test data set in which a stall quest asks for a dish that only the holiday quest of 23 June, earlier in authored order, teaches fails the check.
- The March quest on a held day: a late player reaches 20 June with three open release requirements and an open March quest. The March quest waits without a ticket. After the release, it gets the next free ticket with its authored reward, also after a reload.
- The seasonal sources: an undelivered May quest that asks for a dish of the forage basket keeps the basket after the closing of 31 May, also after a reload. The quest delivers in June, and the basket leaves at the first closing after that delivery.
- The news of Mina and Avram: a test data set in which only two campaign quests open after the delivery of `mina-avram-search` fails the check. A run that delivers `mina-avram-search` as late as the data permits earns the news before the purchase, also after a reload.
- The funding check: a test data set in which the funding before a preparation is one coin short of its cost fails the check. That data set with an added quest with no reward also fails the check.
- The chapters: the payments of preparations 12 and 24 show payoffs and closing scenes that do not tell of the festival, the feast, or the purchase.
- The festival: before 21 June, the grill ticket shows the festival date and Later, and the other four stall quests are not open. After each stall delivery, the next stall quest is open, the counter holds at most three tickets, and the mayor has one open stall quest. 21 June holds until the fifth delivery.
- Ambrozie: a player who reaches the closing of 12 July without the dinner stays on 12 July. A booked ticket of Vlad on the counter at the opening of 12 July does not take the evening from Ambrozie, and Vlad gets the next evening that has a booking. The lunch opens only on 13 July.
- The feast: a player who reaches the closing of 15 August without the plates stays on 15 August. Serve at the held position, 21:35, closes the day, and a reload gives 16 August exactly once. Serve at 19:30 keeps play on 15 August, and the merge that reaches 22:00 gives 16 August exactly once. A reload after each step gives the same result.
- The paintings: the festival painting shows at the end of the fifth stall scene and of its replay, and the square keeps its room state; preparations 23 and 24 then show in the square. After the feast, the square shows the feast painting, also after a reload.
- The orchard: a player with more coins than the price on 15 August, after the feast, cannot pay. Story shows "Opens on Sunday 31 August". On 31 August, the purchase needs Janos's meal.
- The Garden beds: a payment of preparation 6 in May adds the source on 1 June. A payment in June adds the source at once, also to a full board.
- The garden prices: for the Summer salad and the Tomato salad with telemea at each stage, the ticket, the delivery reward, and a reload give the same values.
- The pickle barrel: a take spends the take cost. With a debt, a take fails and changes nothing. The tickets and the delivery rewards give Gherkins 1 coin and Mixed pickles 10 coins. The take from the forage basket stays free.
- The hail: with a full board, the hail waits. With four free cells, the hail places nothing. With five free cells, it places one blocker. With three preparation blockers on the board, the hail waits. After placement, a reload places no other hail blocker.
- The end: with no act 3 in the game, the purchase stops the clock and Story shows the result card of act 2.

### Browser checks

Examine the production build at the desktop size and the phone size, in both themes:

- each painted state of the summer kitchen, the vegetable garden, and the town square;
- the festival painting and the feast painting;
- the tickets of the festival, of Ambrozie's dinner, and of the feast;
- the hail blockers on the board;
- the result card of act 2.

## Decisions

The user approved the orchard of the cathedral, the quest plan, the guests of the two paintings, the visitors, and the small details.
The user also approved the clock of act 2, the held days, the stall order, Ambrozie's fixed evening, the piper rule, the hail, the dishes of the three meals, Mara's lines on the held days, the result card of act 2, and the `catalina-hail` dialogue.
The user also approved the paid pickle barrel and Ambrozie as its seller.
The user also approved the kinds of the new characters, the quest counts, the arcs of the core characters, the threads of the regulars, the chapter titles, and the dialogue of act 2.
The user accepted the art of the 25 room states of act 2, the window of the summer kitchen, the netting of the screen door, the festival painting, the feast painting, the summer-guests atlas, the fourth sketch sheet, the two food atlases of act 2, the hail-clutter atlas, and Gavril in the third regulars atlas.

No decision is open.
