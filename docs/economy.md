# Campaign economy

`PRODUCT.md` controls the rules. `tools/create-original-data.ts` defines the numbers.
This record explains the price model and the work estimates.

## Money and levers

One coin uses approximately one Romanian leu as its reference scale.
This scale relates small food purchases to repair budgets.
The model is a game budget, not a precise profit account. The daily upkeep stands for wood, wages, and the other daily costs of the bistro.

Four levers set the economy. The levers are starting values. The campaign balance check measures the levers, and play tunes them.

| Lever | Value |
| --- | ---: |
| Take cost: the coins that one take from a paid source spends | 1 |
| Blocker coin: the coins that each cleared blocker gives | 1 |
| Work rate: the coins that each merge adds to a menu price | 2 |
| Recovery floor: the purse below which the recovery quest opens while a quest is open | 10 |

The bistro day has these levers. These levers are also starting values.

| Lever | Value |
| --- | ---: |
| Opening time, Monday to Saturday | 07:00 |
| Closing time, Monday to Saturday | 22:00 |
| Booking time, Monday to Saturday | 20:00 |
| Opening time, Sunday | 10:00 |
| Closing time, Sunday | 17:00 |
| Merge time: the minutes that one merge adds to the clock | 15 |
| Upkeep: the coins that each closing spends | 20 |
| Rat take: the most loose raw ingredients that the thief rat takes in one night | 3 |
| Rat hole limit: the most rat holes that can be open at one time | 3 |
| Gift stage | 4 |
| Gift space: the fewest free cells that a gift needs | 5 |

So a weekday holds 60 merges, and a Sunday holds 28 merges. Act 1 has 76 fixed days and 75 closings. The data check refuses a meal that needs more merges than one weekday holds. Provisions and the supper can take more than one day.

A quest without provisions is one meal. One meal has at most three portions for each eater and at most two portions of one dish.
The work rate of 2 lets these small meals pay for the preparations. The merge time of 15 minutes keeps the campaign quests at approximately 80% of the merges that the days of act 1 hold. The repeating quests fill the rest. The upkeep of 20 coins at 75 closings keeps the purse after the supper inside the balance band.

A take from the Herb basket, the pickle barrel, or the forage basket is free. A take from each other source spends the take cost.
The bistro buys its ingredients. For example, the Windmill sells grain, and the butcher sells pork and veal.

## Menu prices

A formula gives the menu price of each dish:

price = paid ingredients × take cost + merges × work rate

- Paid ingredients are the stage-1 ingredients that the dish uses. A Herbs ingredient counts as zero.
- Merges are the merges from the ingredients to the dish, recipe merges included.

A dish at stage s of a chain uses 2^(s-1) ingredients and 2^(s-1) - 1 merges.
A mixed dish adds the ingredients and the merges of its two parts, plus one merge.
For example, Bulz uses Mămăligă (8 Corn ingredients, 7 merges) and Telemea (8 Dairy ingredients, 7 merges).
Bulz also needs one recipe merge. The price of Bulz is 16 × 1 + 15 × 2 = 46 coins.

Merge chains are game rules, not recipes for food preparation.

| Chain | Dish | Paid ingredients | Merges | Coins |
| --- | --- | ---: | ---: | ---: |
| Grain | Flour | 1 | 0 | 1 |
| Grain | Dough | 2 | 1 | 4 |
| Grain | Loaf | 4 | 3 | 10 |
| Grain | Pogăcele | 8 | 7 | 22 |
| Grain | Langoș | 16 | 15 | 46 |
| Grain | Bread basket | 32 | 31 | 94 |
| Corn | Corn cob | 1 | 0 | 1 |
| Corn | Shelled corn | 2 | 1 | 4 |
| Corn | Cornmeal | 4 | 3 | 10 |
| Corn | Mămăligă | 8 | 7 | 22 |
| Herbs | Elderflowers | 0 | 0 | 0 |
| Herbs | Herb bunch | 0 | 1 | 2 |
| Herbs | Socată | 0 | 3 | 6 |
| Herbs | Linden tea | 0 | 7 | 14 |
| Dairy | Milk | 1 | 0 | 1 |
| Dairy | Sour cream | 2 | 1 | 4 |
| Dairy | Cottage cheese | 4 | 3 | 10 |
| Dairy | Telemea | 8 | 7 | 22 |
| Dairy | Smoked cheese | 16 | 15 | 46 |
| Dairy | Cheese board | 32 | 31 | 94 |
| Poultry | Eggs | 1 | 0 | 1 |
| Poultry | Chicken | 2 | 1 | 4 |
| Poultry | Chicken broth | 4 | 3 | 10 |
| Poultry | Roast chicken | 8 | 7 | 22 |
| Vegetables | Potatoes | 1 | 0 | 1 |
| Vegetables | Vegetable basket | 2 | 1 | 4 |
| Vegetables | Pickled cabbage | 4 | 3 | 10 |
| Vegetables | Roasted vegetables | 8 | 7 | 22 |
| Vegetables | Zacuscă | 16 | 15 | 46 |
| Vegetables | Vegetable stew | 32 | 31 | 94 |
| Fruits | Plums | 1 | 0 | 1 |
| Fruits | Fruit bowl | 2 | 1 | 4 |
| Fruits | Cherry compote | 4 | 3 | 10 |
| Fruits | Plum jam | 8 | 7 | 22 |
| Fruits | Red wine | 16 | 15 | 46 |
| Fruits | Plum brandy | 32 | 31 | 94 |
| Pork | Pork | 1 | 0 | 1 |
| Pork | Minced pork | 2 | 1 | 4 |
| Pork | Sausages | 4 | 3 | 10 |
| Pork | Smoked bacon | 8 | 7 | 22 |
| Pork | Roast pork | 16 | 15 | 46 |
| Beans | White beans | 1 | 0 | 1 |
| Beans | Lentils | 2 | 1 | 4 |
| Beans | Green beans | 4 | 3 | 10 |
| Beans | Bean dip | 8 | 7 | 22 |
| Beans | Bean stew | 16 | 15 | 46 |
| Lamb | Lamb | 1 | 0 | 1 |
| Lamb | Lamb cuts | 2 | 1 | 4 |
| Lamb | Lamb chops | 4 | 3 | 10 |
| Lamb | Lamb stew | 8 | 7 | 22 |
| Lamb | Roast lamb | 16 | 15 | 46 |
| Veal | Veal | 1 | 0 | 1 |
| Veal | Diced veal | 2 | 1 | 4 |
| Veal | Minced veal | 4 | 3 | 10 |
| Veal | Meatballs | 8 | 7 | 22 |
| Veal | Veal stew | 16 | 15 | 46 |
| Veal | Roast veal | 32 | 31 | 94 |
| Fish | Fresh trout | 1 | 0 | 1 |
| Fish | Fried trout | 2 | 1 | 4 |
| Fish | Smoked trout | 4 | 3 | 10 |
| Fish | Saramură | 8 | 7 | 22 |
| Mixed | Bulz (Mămăligă + Telemea) | 16 | 15 | 46 |
| Mixed | Papanași (Dough + Cottage cheese) | 6 | 5 | 16 |
| Mixed | Cheese pie (Dough + Telemea) | 10 | 9 | 28 |
| Mixed | Sweet dough (Dough + Eggs) | 3 | 2 | 7 |
| Mixed | Chicken noodle soup (Chicken broth + Dough) | 6 | 5 | 16 |
| Mixed | Zacuscă toast (Loaf + Zacuscă) | 20 | 19 | 58 |
| Mixed | Plum dumplings (Potatoes + Plums) | 2 | 1 | 4 |
| Mixed | Fruit tea (Herb bunch + Fruit bowl) | 2 | 3 | 8 |
| Mixed | Cabbage rolls (Minced pork + Pickled cabbage) | 6 | 5 | 16 |
| Mixed | Stuffed peppers (Minced pork + Vegetable basket) | 4 | 3 | 10 |
| Mixed | Tochitură (Roast pork + Mămăligă) | 24 | 23 | 70 |
| Mixed | Sharing board (Smoked cheese + Sausages) | 20 | 19 | 58 |
| Mixed | Bean soup (White beans + Smoked bacon) | 9 | 8 | 25 |
| Mixed | Beans with sausages (Bean stew + Sausages) | 20 | 19 | 58 |
| Mixed | Drob (Lamb cuts + Eggs) | 3 | 2 | 7 |
| Mixed | Goulash pot (Diced veal + Vegetable basket) | 4 | 3 | 10 |
| Mixed | Meatball soup (Meatballs + Herb bunch) | 8 | 9 | 26 |
| Mixed | Mici (Minced veal + Minced pork) | 6 | 5 | 16 |
| Mixed | Fish soup (Fresh trout + Vegetable basket) | 3 | 2 | 7 |
| Mixed | Cabbage rolls with mămăligă (Cabbage rolls + Mămăligă) | 14 | 13 | 40 |
| Mixed | Bean soup in a bread bowl (Bean soup + Loaf) | 13 | 12 | 37 |
| Mixed | Saramură with mămăligă (Saramură + Mămăligă) | 16 | 15 | 46 |
| Mixed | Cozonac (Sweet dough + Fruit bowl) | 5 | 4 | 13 |
| Mixed | Chimney cake (Sweet dough + Milk) | 4 | 3 | 10 |

## Quest rewards

Quests and cleared blockers are the only income.
Every quest except the supper pays its menu value: the sum of the prices of its portions.
So a delivery repays the ingredients of its dishes and earns the work rate for each merge. The supper pays nothing.

A quest that opens after preparation N is necessary for preparation N + 1.
The work value of a quest is the merges of its dishes times the work rate.
Each preparation has a minimum work value for the quests that open before that preparation.
That minimum is the total cost of all preparations up to and including that preparation.
The coins that remain after the last preparation must buy the ingredients of the supper.
`questProblems` in `src/content.ts` checks these rules before the data can ship.
A player who delivers every open quest and buys only its ingredients has enough coins for the next preparation.

A new game starts with no coins. The first quest asks only for free herbs.
The early quests also ask for herb bunches, Linden tea, and socată, which need no paid ingredient. The work value of these quests gives the purse the coins to buy ingredients for the next quests.

The recovery quest prevents a stop in the campaign. Ana asks for one Linden tea in two conditions:

- A quest is open, and the purse is below the recovery floor.
- No quest is open, and the purse cannot pay the next preparation.

A player who spends coins on spare food repays the shortfall with tea. So the player can always continue.

## Work and price

The bistro repairs and reuses its furniture.
Each preparation defines work, materials or stock, labour, and estimated active person-hours.
The materials and the labour determine the cost. The story position does not determine the cost.

These figures are estimates for the stated work.
The table and the game use 90% of each estimate of materials and labour, rounded to whole coins.
The allowances below give the full estimates.
Retail examples and minimum service rates inform the estimates.
No supplier gives a quote for this fictional bistro.
Quantities, hours, and the share of a partly used supply pack are assumptions.
The game has no wait for paint to dry, materials to cure, or supplies to arrive.

| N | Preparation | Materials or stock | Labour | Person-hours | Total coins |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | Fix the broken window | 180 | 180 | 4 | 360 |
| 2 | Mend the welcome board | 27 | 54 | 1.5 | 81 |
| 3 | Set up the pastry shelf | 27 | 36 | 1 | 63 |
| 4 | Light the front room | 36 | 180 | 3 | 216 |
| 5 | Repair the kitchen worktop | 81 | 135 | 3 | 216 |
| 6 | Bring in market produce | 72 | 36 | 1 | 108 |
| 7 | Hang the kitchen shelves | 72 | 90 | 2 | 162 |
| 8 | Write the first menu | 23 | 23 | 0.5 | 46 |
| 9 | Choose the tableware | 432 | 36 | 1 | 468 |
| 10 | Sand the long table | 108 | 432 | 8 | 540 |
| 11 | Make a recipe corner | 18 | 18 | 0.5 | 36 |
| 12 | Open the shared table | 18 | 72 | 2 | 90 |
| 13 | Clear the courtyard | 18 | 108 | 4 | 126 |
| 14 | Plant the herb pots | 90 | 36 | 1 | 126 |
| 15 | Repair the door hood | 810 | 360 | 8 | 1170 |
| 16 | Set the outdoor tables | 9 | 72 | 2 | 81 |
| 17 | Collect family recipes | 14 | 54 | 2 | 68 |
| 18 | Prepare the tasting plates | 81 | 54 | 2 | 135 |
| 19 | Stock the drinks cabinet | 144 | 36 | 1 | 180 |
| 20 | Print the supper menu | 36 | 72 | 2 | 108 |
| 21 | Send the invitations | 144 | 54 | 2 | 198 |
| 22 | Prepare the serving station | 108 | 72 | 2 | 180 |
| 23 | Add the final flowers | 108 | 54 | 1.5 | 162 |
| 24 | Welcome the community supper | 54 | 54 | 2 | 108 |

The work estimates have these limits:

- Window: one new pane, seals, and the preparation and paint of the existing frame and shutters.
  Materials allow approximately 120 coins for glass and 80 for supplies and finish.
  The four hours cover removal, preparation, installation, seals, and paint. The frame stays in use.
- Sign: the wood is sound. The work sands and repaints the sign. The work uses small amounts of finish and 1.5 hours.
- Shelves: the paintings show timber that is already in the bistro.
  The work cleans and secures the shelves, repairs the finish, and stocks the shelves.
  The estimate does not include a new shelf unit.
- Lamps: two supplied lamps and the existing connections.
  The estimate covers bulbs, small materials, installation, and a check of the connections.
- Table and chairs: the existing long table and two chairs.
  Eight hours cover the three pieces and their decorative finish.
- Tableware: six handmade bowls and six cups with saucers. Later preparations reuse this purchase.
  The allowance has 300 coins for bowls, approximately 160 for cups and saucers, and 20 for small supplies.
- Courtyard: sweep approximately 20 square metres and collect leaves in bags.
  The estimate has no pavement or landscape work.
- Herb pots: three clay pots, three small plants, soil, and drainage material.
  The material allowance is 100 coins.
- Door hood: the sound structure stays in use. The work replaces approximately two square metres of wood shingles.
  The estimate allows 800 coins for shingles and 100 for fasteners and weather seals.
  The estimate includes eight active labour hours.
- First menu: one small slate, chalk, and half an hour for text and pictures.
- Supper menu: ten strong prints and simple stands cost approximately 40 coins.
  The labour includes movement of the existing long table into the courtyard.
- Invitations: twenty small prints and a wreath on the kitchen door.
  The gate has a lantern and pots of red geraniums, and more pots line the wall.
  Existing towels stay in use. The estimate includes the gate decoration.
- Final flowers: one outdoor light string, supplies to attach the string, and flowers in existing vases.
  The light string must be suitable for outdoor use.
- Supper: eleven guests. Earlier preparations pay for food samples, drinks, and the first portions.
  The final preparation pays only for additional supplies and service.

## Effort in play

The estimated person-hours describe the work. The hours do not set a timer or a play goal.
The 24 preparations total 57 estimated person-hours and 5028 coins.

A preparation can cost less than the preparation before it.
Late menu or display work does not cost more only because the work occurs late in the story.
The necessary quests determine the play effort. The campaign balance report gives the merges and the takes.
The game has no separate goal currency, timer, or chapter reset.

## Reference inputs

The links below explain the scale of the model.
The amounts are reference inputs, not live offers or supplier quotes for the game.
A supplier can change prices or remove a page.
Verify the source and the portion before a price revision.

- [Auchan flour](https://www.auchan.ro/faina-alba-superioara-000-auchan-1-kg/p): 1.99 lei for a 1 kg bag.
- [Sergiana menu](https://delivery.sergiana.ro/ro/meniu-restaurant/fel-principal): 7 lei for a mămăligă side and 2 lei for sliced bread.
  Mushroom stew with mămăligă costs 35 lei. These examples distinguish ingredients, side dishes, and main dishes.
- [Paradisul Transilvaniei menu](https://paradisultransilvaniei.ro/ro/restaurant): tea at 10 lei and socată at 18 lei.
  Other inputs are vegetables at 20 to 22 lei, desserts at 15 to 25 lei, and cheese at 65 lei.
  The game portions can differ from the restaurant portions.
- [Simple glass](https://www.sticla-termopan.ro/preturi.php): a minimum price of 120 lei.
  This amount is not a quote for an installed window.
- [Wood shingles](https://mobicam-furniture.ro/produse/sindrile-acoperis/): a minimum price of 400 lei per square metre.
- [Exterior wood finish](https://www.dedeman.ro/ro/lac/-lazura-pentru-lemn-sadolin-extra-incolor-exterior-0-75-l/p/5000519): 79 lei per 0.75 litre.
  This example informs the frame budget. This example does not specify a finish for surfaces that touch food.
- [HandySmart services](https://handysmart.ro/preturi.html): 50 lei for shelf installation and 75 lei for edge or surface repairs.
  These minimum rates do not define an hourly rate for the bistro.
- [HandySmart restoration guide](https://handysmart.ro/blog-posts/reconditionari-mobila-veche.html): 150 to 400 lei for table repairs and finish.
- [The Print Store](https://www.theprintstore.ro/print-preturi/): 1 leu for colour A4 on light paper, or 2 lei on heavier paper.
- [Terracotta pot](https://www.leroymerlin.ro/produse/ghiveci-flori-teracota-17-cm-maro-teracota-11389175.html): 9.90 lei for a 17 cm pot.
- [Herb plants](https://www.hornbach.ro/c/gradina/plante/fructe-legume-plante-aromatice/plante-aromatice/S19821/): approximately 18 lei for each small plant.
  The game uses rosemary, parsley, and lovage.
- [Corund plate](https://www.invietraditia.ro/farfurie-ceramica-corund-albastru-cobalt-16-cm/): 60 lei for one small handmade plate.
  [Corund sets](https://www.invietraditia.ro/arta-populara-romaneasca-si-obiecte-de-artizanat/ceramica-de-corund-korond/) inform the 160 lei allowance for six cups and saucers.
  These examples inform the handmade tableware budget. The game does not use disposable plates.
- [Outdoor light string](https://www.dedeman.ro/ro/ghirlanda-luminoasa-party-hoff-interior/-exterior-12-led-uri-multicolore-soclu-g45-10-5-m-controler/p/1051995): 104.89 lei for an outdoor example.
  The example informs the budget only. The game shows warm lights.

## Verification and limits

Run one of these commands:

- `node tools/campaign-balance.ts efficient`
- `node tools/campaign-balance.ts miss-bookings`
- `node tools/campaign-balance.ts debt`

For each of the 20 fixed seeds, the report gives these values:

- The days, the closings, the Sunday rats, the lantern uses, the thefts, the stolen ingredients, and the gifts.
- The day of each payment, the merges for repeating quests, and the days with work only from repeating quests.
- The lowest purse and the merges that only move the clock.
- The purse after the supper, the spending, and the free cells at each preparation.

`tests/campaign-balance.test.ts` also reports the costs, work, actions, takes, merges, deliveries, recovery deliveries, and coins.
The test file gives these values for each preparation and each chapter.

The campaign fixture is the play code in `tools/campaign-balance.ts`.
The fixture plays a new game with one repeatable policy, with no injected coins or items.
The fixture pays each preparation when payment becomes available.
If the fixture cannot pay, the fixture delivers a holiday quest on its holiday first, and it cooks a holiday meal ahead.
In the middle of a long order, the fixture delivers a holiday quest whose dishes are on the board as soon as its holiday comes.
Then the fixture delivers tonight's booked quest, and it lights the lanterns if the meal is ready before 20:00.
Then the fixture delivers the unbooked campaign ticket whose ingredients cost the least, before a repeating quest.
If only quests for later days remain, the fixture cooks them.
Then the bistro has no work, and the fixture delivers the repeating quests until the night.
Before a quest, the fixture delivers the recovery quest while the purse is short.
Within 30 merges of the closing, the fixture delivers the recovery quest while the purse is below the upkeep.
So the purse never goes below zero.
While fewer than 24 cells are free, the fixture clears the cheapest blocker between quests.
The fixture makes each required dish from spare food on the board, or from stage-1 ingredients, merges, and recipes.
If the board is full, the fixture merges spare food. The merge uses a pair, a recipe, or a match for a blocked dish.
A full board without such a merge is a deadlock, and the fixture fails.
After the last preparation, the fixture delivers the repeating quests until 1 May, and then it serves the supper.
The balance band is the range of the purse after the supper.
The purse must hold 0 to 20% of the coins that the fixture spent on preparations, takes, and upkeep.

`tests/campaign-balance.test.ts` enforces the bounds that `PRODUCT.md` gives for the three strategies.
The efficient fixture takes two ingredients and merges them immediately, so its board holds no loose raw ingredient on Sunday night.
Șoricescu comes on each Sunday night of the efficient run, and the random seed is not used, so the 20 seeds give the same run.

This check measures actions under that policy. This check does not establish a satisfactory human play experience.
Each merge earns only the work rate. So the campaign needs more actions than a campaign with free production.
To shorten the campaign, increase the work rate. Then decrease the provisions to keep the balance band.
Play an early chapter and a late chapter before a lever change.
Record the device, initial save, action counts, and elapsed human play time.
Do not convert automated execution time to player time.

A lever change changes the price of each dish and the reward of each quest.
Run `npm run data:generate`, `node tools/campaign-balance.ts`, and `npm test` after each lever or quest change.
