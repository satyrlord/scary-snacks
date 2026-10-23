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

The bistro day of each act has these levers. These levers are also starting values.

| Lever | Act 1 | Act 2 |
| --- | ---: | ---: |
| Opening time, Monday to Saturday | 07:00 | 07:00 |
| Closing time, Monday to Saturday | 22:00 | 22:00 |
| Booking time, Monday to Saturday | 20:00 | 19:30 |
| Opening time, Sunday | 10:00 | 10:00 |
| Closing time, Sunday | 17:00 | 17:30 |
| Merge time: the minutes that one merge adds to the clock | 15 | 25 |
| Upkeep: the coins that each closing spends | 20 | 20 |
| Rat take: the most loose raw ingredients that the thief rat takes in one night | 3 | 3 |
| Rat hole limit: the most rat holes that can be open at one time | 3 | 3 |
| Gift stage | 4 | 4 |
| Gift space: the fewest free cells that a gift needs | 5 | 5 |

So in act 1, a weekday holds 60 merges, and a Sunday holds 28 merges. In act 2, a weekday holds 36 merges, and a Sunday holds 18 merges. Act 1 has 76 fixed days and 75 closings. Act 2 has 122 fixed days, and its accounts count 122 closings, from 1 May to 30 August. The data check refuses a meal that needs more merges than one weekday of its act holds. Provisions, the stall quests, and the finales can take more than one day.

A quest without provisions is one meal. One meal has at most three portions for each eater and at most two portions of one dish.
The work rate of 2 lets these small meals pay for the preparations. The merge time of 15 minutes keeps the campaign quests of act 1 at approximately 80% of the merges that the days of act 1 hold. Act 2 has more days for the same work as act 1, so its merge time is 25 minutes. The repeating quests fill the rest. The upkeep of 20 coins keeps the purse at the end of each act inside the balance band.

A take from the Herb basket, the forage basket, or the Garden beds is free. From garden stage 1, a take from the Vegetable crate is also free. A take from each other source spends the take cost, including the pickle barrel.

The garden has three stages. Preparations 6, 14, and 22 of act 2 each open the next stage. The garden value of the stage is 1, 2, and 3 coins. From garden stage 1, a garden ingredient counts its garden value in the menu price. The garden ingredients are the ingredients of the Vegetable crate and of the Garden beds. The garden values are levers.

The starting gift of Mara's parents is 20 coins, a lever from 10 to 20. The price of the orchard is 2,000 coins. Both are levers that the balance check measures.
The bistro buys its ingredients. For example, the Windmill sells grain, and the butcher sells pork and veal.

## Menu prices

A formula gives the menu price of each dish:

price = sum of the ingredient values + merges × work rate

- The ingredients are the stage-1 ingredients that the dish uses. An ingredient of a paid source counts the take cost. An ingredient of a free source counts as zero. From garden stage 1, a garden ingredient counts its garden value.
- Merges are the merges from the ingredients to the dish, recipe merges included.

A dish has no saved price. Its price comes from the current garden stage. For example, the Summer salad costs 4, 6, and 8 coins at the three garden stages. The Tomato salad with telemea costs 28, 30, and 32 coins: 2 garden ingredients, 8 Dairy ingredients, and 9 merges.

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

The table gives the prices before garden stage 1. The seasonal chains and the four mixed dishes of act 2 follow the same formula. For example, Gherkins cost 1 coin and Mixed pickles cost 10 coins, because the pickle barrel is a paid source.

## Quest rewards

Quests and cleared blockers are the only income.
A sale of a dish pays back only the take costs of its ingredients at the current garden stage, so it earns nothing. For example, Bulz sells for 16 coins.
Every quest except a finale quest and the piper's fee pays its menu value: the sum of the prices of its portions.
So a delivery repays the ingredients of its dishes and earns the work rate for each merge. The supper, the feast, and the piper's fee pay nothing.
A campaign quest of act 2 pays its menu value at the garden stage of the preparation after which it opens. A repeating quest and the recovery quest pay their menu value at the current garden stage.

A quest that opens after preparation N is necessary for payment N + 1.
The funding of a quest is its reward minus the take costs of its ingredients, at the garden stage of the preparation after which it opens.
A quest with no reward has a negative funding.
In each act, the funding of the quests that open before a preparation must cover the total cost of the preparations of that act up to and including that preparation.
The check does not count the purse that an earlier act carries.
The coins that remain after the last preparation of an act, with the funding of the quests of the same act that open after it and before the finale, must buy the ingredients of the finale. A quest of the next act does not count.
The purchase of the orchard is outside this check. The balance check covers it.
`questProblems` in `src/content.ts` checks these rules before the data can ship.
A player who delivers every open quest and buys only its ingredients has enough coins for the next preparation.

The prologue has no purse, and act 1 starts with the starting gift of Mara's parents. The pickle barrel is a paid source on the initial board, so the gift pays for the first takes of act 1. The purse stays at or above zero at the start. The balance run plays the prologue first, then act 1 with the gift, and then act 2. For each fixed seed, the efficient run ends act 1 with 1,696 coins of 10,392 spent, 16.3 percent. It ends act 2 with 1,314 coins of 12,679 spent, 10.4 percent. Both results are inside the balance band of 0 to 20 percent. The spending of act 2 includes the price of the orchard.
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

The preparations of act 2 follow the same model. The summer kitchen reuses the old shed, the garden reuses the old beds, and the town square borrows the tables and benches of the village.

| N | Preparation of act 2 | Materials or stock | Labour | Person-hours | Total coins |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | Clear the shed | 27 | 108 | 3 | 135 |
| 2 | Mend the roof | 108 | 72 | 2 | 180 |
| 3 | Build the clay oven | 72 | 108 | 3 | 180 |
| 4 | Set the stove and the chimney | 126 | 54 | 1.5 | 180 |
| 5 | Clear the weeds | 18 | 108 | 3 | 126 |
| 6 | Dig the beds | 90 | 108 | 3 | 198 |
| 7 | Sweep the square | 18 | 72 | 2 | 90 |
| 8 | Set the tables and the benches | 36 | 108 | 3 | 144 |
| 9 | Build the food stalls | 252 | 180 | 5 | 432 |
| 10 | Raise the stage | 144 | 108 | 3 | 252 |
| 11 | Hang the lanterns | 126 | 72 | 2 | 198 |
| 12 | Hang Sânziana’s garlands | 0 | 72 | 2 | 72 |
| 13 | Mend the fence | 108 | 108 | 3 | 216 |
| 14 | Repair the well pump | 270 | 144 | 4 | 414 |
| 15 | Hang the shelves | 72 | 54 | 1.5 | 126 |
| 16 | Fit the screen door | 126 | 72 | 2 | 198 |
| 17 | Build the bean trellis | 54 | 54 | 1.5 | 108 |
| 18 | Put up the scarecrow | 18 | 36 | 1 | 54 |
| 19 | Plant the vine arbour | 216 | 108 | 3 | 324 |
| 20 | Lay the brick floor | 216 | 252 | 7 | 468 |
| 21 | Set the rain barrels | 108 | 36 | 1 | 144 |
| 22 | Build the drying racks | 108 | 108 | 3 | 216 |
| 23 | Raise the awnings | 288 | 144 | 4 | 432 |
| 24 | Lay the feast tables | 90 | 90 | 2.5 | 180 |

The garlands of preparation 12 have no material cost, because Sânziana gives the flowers. The purchase of the orchard, "Buy the orchard", costs 2,000 coins of materials and no labour. The cathedral uses the money to finish the church roof.

## Effort in play

The estimated person-hours describe the work. The hours do not set a timer or a play goal.
The 24 preparations of act 1 total 57 estimated person-hours and 5028 coins. The 24 preparations of act 2 total 66 estimated person-hours and 5067 coins.

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

For each of the 20 fixed seeds, the report gives these values for each act:

- The purse at the end of the act, the spending of the act, and the share of the purse in the spending.
- The merges, the share of the merges for repeating quests, and the days with work only from repeating quests.
- The closings and the Sunday rats.

The report also gives the share of the repeating merges after the feast, and the days that reached a held position. The accounts of act 1 end at the supper. The accounts of act 2 start at the supper and end at the purchase.

`tests/campaign-balance.test.ts` also reports the costs, work, actions, takes, merges, deliveries, recovery deliveries, and coins.
The test file gives these values for each preparation and each chapter.

The campaign fixture is the play code in `tools/campaign-balance.ts`.
The fixture plays a new game with one repeatable policy, with no injected coins or items. It plays the prologue first, with legal actions only, and continues from the start of act 1.
The fixture pays each preparation when payment becomes available.
If the fixture cannot pay, the fixture delivers a holiday quest on its holiday first, and it cooks a holiday meal ahead.
In the middle of a long order, the fixture delivers a holiday quest whose dishes are on the board as soon as its holiday comes.
Then the fixture delivers tonight's booked quest, and it lights the lanterns if the meal is ready before the booking time.
Then the fixture delivers the unbooked campaign ticket whose ingredients cost the least, before a repeating quest.
If only quests for later days remain, the fixture cooks them.
Then the bistro has no work, and the fixture delivers the repeating quests until the night.
Before a quest, the fixture delivers the recovery quest while the purse is short.
Within 30 merges of the closing, the fixture delivers the recovery quest while the purse is below the upkeep.
So the purse never goes below zero.
If a quest opens overnight while the fixture makes a recovery tea, the recovery quest can close. The tea then stays on the board as spare food.
While the quests of the next payment wait for their dates and the purse is short, the fixture makes recovery teas.
While fewer than 24 cells are free, the fixture clears the cheapest blocker between quests.
The fixture makes each required dish from spare food on the board, or from stage-1 ingredients, merges, and recipes.
If the board is full, the fixture merges spare food. The merge uses a pair, a recipe, or a match for a blocked dish.
A full board without such a merge is a deadlock, and the fixture fails.
After the last preparation of act 1, the fixture delivers the repeating quests until 1 May, and then it serves the supper. Act 2 follows in the same run. After the feast, the fixture delivers the quests that open after the feast and the repeating quests until 31 August, and then it buys the orchard.
The balance band is the range of the purse at the end of each act: after the supper, and after the purchase.
The purse must hold 0 to 20% of the coins that the fixture spent in that act on preparations, takes, upkeep, and the orchard.
The miss-bookings strategy lets the first evening of each booking without a fixed evening pass. A fixed evening holds its day, so the strategy never misses it.

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
