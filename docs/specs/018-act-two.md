# 018: Act 2

Status: Draft. This file collects the decisions and the ideas for act 2. The "Open decisions" section lists the decisions that the team has not made. The owner documents do not include this feature.

## Outcome and scope

Act 2 starts on the day after the community supper and ends on Sunday 31 August of year 1. Act 3 starts on Monday 1 September.
The interior of the bistro and the courtyard are complete. In the summer, the bistro grows past its walls. Mara cooks in a summer kitchen, plants the vegetable garden, and prepares the summer festival in the town square for the mayor.

Mara has two reasons. She feels a duty to the village. She also wants money: a neglected orchard near the bistro is for sale, and she saves to buy it. The purchase of the orchard is the last goal of act 2. The orchard is a location of act 3.

The mystery of the cathedral continues. A monk of the cathedral, Ambrozie, cannot sleep, because the sleeper behind the red door snores. He spends a day and a night in the village and dines at the bistro.
He looks at Mamaia's notebook and sees that the Cyrillic page is printed, not handwritten. The page comes from a book of the cathedral library. Mamaia tore it out and pasted it into her notebook.
The reveal: the theft bound the family to the cathedral. Mara came back to the village to inherit the bistro, and she pays back the theft through service.

The tone stays cosy, eerie, and comic. The sleeper is a threat of mischief, not of harm.

The feature covers these parts:

- the dates, the chapters, and the 24 preparations of act 2;
- the three areas of act 2: the summer kitchen, the vegetable garden, and the town square;
- the garden benefits, and the purchase of the orchard;
- the festival: its contract, its stall quests, and its day;
- Ambrozie, his visit, and the story of the page;
- the mayor Gavril Hămălescu and the piper Tarka Miklós;
- the quests of Sânziana for her sisters, and her decorations for the festival;
- the five quests of act 2 that the game data already holds;
- the new dishes, the new characters, and the new art;
- the change from act 1 to act 2, and the saves.

The feature does not include these parts:

- the orchard area, which belongs to act 3;
- the interior of the bistro and the courtyard in the room of act 2.

## Dates

Act 2 has the weekdays of year 1 in spec 015.

| Date | Event | Use |
| --- | --- | --- |
| Friday 2 May | The day after the supper | Act 2 starts. |
| Saturday 3 May | The eve of the departure of Ionatan for the castle | `ionatan-castle-dinner`. In the novel, he dines in the town on 3 May and reaches the castle in the night of 4 May. |
| Thursday 29 May | The Ascension (Ispas) | A holiday quest. |
| Sunday 8 June | Pentecost (Rusalii) | A quest of Sânziana. The Rusalii are wild fairies. Wormwood and garlic keep them away. |
| Saturday 21 June | The summer solstice | The summer festival in the town square. |
| Monday 23 June | Midsummer Eve (Sânziene) | `sanziana-midsummer`. |
| Saturday 12 and Sunday 13 July | The visit of Ambrozie | A day and a night in the village. |
| Sunday 20 July | Saint Elijah (Sfântul Ilie) | The name day of Ilie. Saint Elijah brings thunder and hail, so `catalina-hail` is in the same week. |
| 1 to 14 August | The Dormition fast | The fasting rules of Lent apply to Ilie and Cătălina. |
| August | The search of Mina | `mina-avram-search`. |
| Friday 15 August | The Dormition (Sfânta Maria Mare) | The feast of the cathedral in the town square, and the finale of act 2. |
| Sunday 31 August | The last day of act 2 | The last day for the purchase of the orchard. |

## The size of act 2

Act 2 has 122 days. At the act 1 merge time of 15 minutes, the days of act 2 hold about 6,700 merges. The days of act 1 hold about 4,100 merges.
Act 2 has as many preparations as act 1, so act 2 uses a merge time of 25 minutes. A weekday holds 36 merges, and a Sunday holds 17 merges. The days of act 2 hold about 4,050 merges, the same work as act 1.
The story reason: the summer kitchen has one clay oven and one stove, so each dish takes longer.
The merge time is a lever. The balance test of act 2 measures it.

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

The festival on 21 June follows preparation 12. 20 June holds until the payment of preparation 12, as 30 April holds in act 1.
The feast on 15 August follows preparation 24. 14 August holds until the payment of preparation 24.

## Story outline

The update-game-content skill writes the dialogue.

1. May. The bistro kitchen is too hot for summer. Mara clears the old shed between the bistro and the garden and makes it a summer kitchen. Ionatan dines on his way to the castle. Mara sees the neglected orchard and learns its price.
2. Late May and early June. Mara clears the vegetable garden, and the first beds give vegetables. The mayor offers Mara a contract for the summer festival. Sânziana asks for food for her sisters on Pentecost.
3. June. Mara prepares the town square. Sânziana gives all the decorations of the festival. She does not come to the festival: she and her sisters gather bedstraw in the meadows for their own night on 23 June. Tarka Miklós plays at the festival.
4. Late June and early July. The mayor does not want to pay the piper, so Mara pays him. Ambrozie spends a day and a night in the village. He dines at the bistro and reads Mamaia's notebook. He says that the Cyrillic page is printed, and that it comes from the cathedral library.
5. Late July. Ambrozie and the visitors look for the book. The librarian under the cathedral screams when a page turns. Now everybody knows why: one page is missing. Ilie celebrates his name day.
6. August. At the feast of the cathedral, Ambrozie tells Mara why Mamaia took the page, and what the family owes. He does not take the page back. A stolen page is paid back in service, not in paper. Mina and Avram pass through. Mara buys the orchard on the last day of summer.

The reveal comes from Ambrozie. He knows the library, the book, and the rules of the cathedral. The loose pages of the archbishop, which Janos reads, confirm the year of the theft. Janos tells this over the proper meal that he promised in act 1, after the feast.

### Continuity with act 1

- The archbishop left the village forty years ago with the money for the church roof. Mamaia never forgave him. In her will, she left her savings to the church roof.
- In the year that the archbishop left, Mamaia took the prayer from the library. With no archbishop in the cathedral, she wanted to protect the bistro from what lives under it. Her gift to the church roof is a first payment of the debt.
- The page is a prayer against strigoi. The painting in `notebook-pages` already shows a printed page with a red initial. In the prologue, Mara says only that the letters look like the letters of old church books.
- Spec 016 says that the page was "copied from an old church book". Act 2 changes that sentence: Mamaia tore the page from a printed church book and pasted it in.

## Areas of act 2

Act 2 has three areas: the summer kitchen, the vegetable garden, and the town square. They replace the areas of act 1 in the room. The interior of the bistro and the courtyard are complete, and they show only in the sketches of the quest scenes.
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
In the menu price, a garden ingredient counts its garden value, not zero.
So the free take is profit, and each later stage raises the price of each dish with garden vegetables.
The garden values are levers. The balance test of act 2 measures them.

## The town square and the festival

The mayor, Gavril Hămălescu, gives Mara a contract for the summer festival. Mara prepares the square in preparations 7 to 12.

### Sânziana's decorations

Sânziana gives all the decorations of the festival: bedstraw crowns, garlands, and flowers for the stalls.
Her quest "Garlands for the square" opens after preparation 11. It is a campaign quest, so preparation 12 needs it. It asks for provisions for her sisters and pays its menu value.
Its completion scene brings the decorations. Preparation 12, "Hang Sânziana's garlands", has a labour cost and no material cost.
On Midsummer Eve, girls throw their crowns onto a roof. A crown that stays on the roof tells of a wedding in the year. Her letter can tell this custom.

### The stall quests

The festival has five stall quests. Each stall quest belongs to the mayor and names its stall. The stall quests are provisions for the crowd, so the one-meal limit does not apply.
The stall quests open after preparation 12, with an opening date of Wednesday 18 June. The player delivers them on 21 June, as for a holiday quest of spec 017. 21 June holds until the last stall quest.

| Stall | Dishes |
| --- | --- |
| The grill | Mici and Loaf |
| The bakery stall | Langoș and Chimney cake |
| The garden stall | Summer salad and Tomato salad with telemea |
| The drinks stall | Socată and Wormwood wine |
| The sweets stall | Papanași, Plum dumplings, and Cherry compote |

The last stall quest opens the festival painting, as the supper opens its painting.

### The piper

Tarka Miklós plays at the festival. The mayor does not want to pay him, so Mara pays him in food.
His quest "The piper's fee" opens on Sunday 22 June. It pays no coins. His tune leads the rats away: no rat comes on the next four Sunday nights.
The story repeats the theme of the act: a debt is paid.

## The feast of the cathedral

The feast is the finale of act 2. It is on Friday 15 August, in the town square. Ambrozie's quest for the feast opens after preparation 24. As the supper, it asks for one plate for each guest and pays no coins.
The feast opens the finale scene and the feast painting.

## The orchard

The neglected orchard near the bistro belongs to the cathedral. Nobody in the village buys it, because the old trees creak at night. The cathedral sells it to finish the church roof. So Mara's purchase also helps to pay the old debt.

The purchase is the last payment of act 2. It opens after the feast. 31 August holds until the purchase. The purchase closes 31 August, and act 3 starts on 1 September.
The player sees the price in Story, as a preparation. The purchase has no new control.

### The price

The price is a lever. The starting value is 1,700 coins.
The starting value uses the efficient run of act 1. That run carries its purse into act 2. Act 2 has the same work as act 1, a larger upkeep for 122 closings, and the garden profit.
The price leaves the efficient run with about 10% of the spending of act 2 after the purchase. That is the middle of the balance band of 0 to 20%.
When the data of act 2 exists, the balance test sets the final price by this rule.

## Ambrozie

Ambrozie lives at the cathedral. The sleeper behind the red door snores, and Ambrozie cannot sleep. He takes one day and one night away.
On Saturday 12 July, he books a dinner, as in the evening bookings of spec 013. He sleeps in the courtyard of the bistro. On Sunday 13 July, he eats lunch and reads the notebook.
The Sunday night dialog shows his night. Ambrozie snores too, and Miez moves to the roof.

## Sânziana and her sisters

Sânziana has two quests of act 2 in the game data: "Midsummer Eve" and "A picnic in the meadow". Both are provisions for her sisters.
She has two new quests:

- Pentecost: food and wormwood wine for the sisters, to keep the Rusalii away.
- "Garlands for the square", the mandatory quest of the festival decorations.

## Other quests of act 2

The game data already holds these quests of act 2:

| Quest | Character |
| --- | --- |
| `ionatan-castle-dinner`, "Dinner before the castle" | Ionatan |
| `mina-avram-search`, "A meal before the search" | Mina and Avram |
| `sanziana-midsummer`, "Midsummer Eve" | Sânziana |
| `sanziana-meadow`, "A picnic in the meadow" | Sânziana |
| `catalina-hail`, "Bell-ringer's appetite" | Cătălina |

More ideas:

- The visitors Adrian, Monica, and Janos camp at the red door. They do not want to wake the sleeper. Their supply quests ask for food that makes a sleeper sleep: linden tea and heavy suppers.
- Mara's parents visit for the festival. Tata wanted to sell the bistro. He sees it full.
- Hail on Saint Elijah can leave a blocker on the board: broken pots or hailstones. A blocker gives no loss of progress.
- Summer kittens in the garden, with Miez.

## New dishes

### The Garden beds

The Garden beds are a seasonal source of spec 017. Their season is 1 June to 30 September. Preparation 6 puts them on the board.
Their chain is Summer garden.

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

| Character | Role | Reference |
| --- | --- | --- |
| Ambrozie | A monk of the cathedral | The novel "The Monk" (1796) |
| Gavril Hămălescu | The mayor | The mayor of Hamelin in the folk tale of the Pied Piper. He haggles over each coin. |
| Tarka Miklós | The piper | The Pied Piper of Hamelin. "Tarka" means pied in Hungarian. He wears a coat of many colours. |

## Art

- The summer kitchen, the vegetable garden, and the town square: one painted state for each preparation, as in spec 001.
- The festival painting and the feast painting.
- Portraits and sketches of Ambrozie, Gavril Hămălescu, and Tarka Miklós.
- The menu art of the Garden beds, the Summer garden chain, and the four mixed dishes.
- The quest scenes of act 2 show the interior of the bistro and the courtyard as pencil sketches.

## Data and state

- Act 2 continues the save of act 1: the purse, the board, the recipe book, and the finishes.
- The state records the act, the preparations of act 2, the festival, the feast, and the purchase of the orchard. The save version changes, as each completed spec requires.
- `tools/create-original-data.ts` authors the dates, the chapters, the preparations, the quests, the dishes, and the scenes.
- The balance test of act 2 measures the merge time, the garden values, and the price of the orchard.

## Open decisions

The user approved the orchard of the cathedral.

- The guests of the festival painting and of the feast painting.
- The quests of the core characters in act 2.
- The dialogue of each scene. The user approves it.
