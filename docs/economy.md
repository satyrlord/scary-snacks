# Campaign economy

`PRODUCT.md` controls the rules. `tools/create-original-data.ts` defines the numbers.
This record explains the price model and the work estimates.

## Money and levers

One coin uses approximately one Romanian leu as its reference scale.
This scale relates small food purchases to repair budgets.
The model is a game budget, not a precise profit account. The daily upkeep stands for wood, wages, and the other daily costs of the bistro.

Four levers set the economy. They are starting values: the campaign balance check measures them, and play tunes them.

| Lever | Value |
| --- | ---: |
| Take cost: the coins that one take from a paid source spends | 1 |
| Blocker coin: the coins that each cleared blocker gives | 1 |
| Work rate: the coins that each merge adds to a menu price | 2 |
| Recovery floor: the purse below which the recovery quest opens while a quest is open | 10 |

The bistro day has these levers. They are starting values too.

| Lever | Value |
| --- | ---: |
| Opening time | 07:00 |
| Closing time | 22:00 |
| Booking time | 20:00 |
| Merge time: the minutes that one merge adds to the clock | 6 |
| Upkeep: the coins that each closing spends | 10 |
| Rat take: the most loose raw ingredients that the thief rat takes in one night | 3 |
| Rat hole limit: the most rat holes that can be open at one time | 3 |
| Gift stage | 4 |
| Gift space: the fewest free cells that a gift needs | 5 |

So a day holds 150 merges. The biggest provisions fill most of one day. The data check refuses a quest that needs more merges than one day holds.

A quest without provisions is one meal: at most three portions for each eater, and at most two portions of one dish.
The work rate of 2 lets these small meals pay for the preparations. The merge time of 6 minutes keeps act 1 at about three weeks.

A take from the Herb basket is free. A take from each other source spends the take cost.
The bistro buys its staples: the Windmill sells grain, the butcher sells pork and veal, and so on.

## Menu prices

A formula gives the menu price of each dish:

price = paid staples × take cost + merges × work rate

- Paid staples are the stage-1 staples that the dish uses. A Herbs staple counts as zero.
- Merges are the merges from the staples to the dish, recipe merges included.

A dish at stage s of a chain uses 2^(s-1) staples and 2^(s-1) - 1 merges.
A mixed dish adds the staples and the merges of its two parts, plus one merge.
For example, Bulz uses Mămăligă (8 Corn staples, 7 merges) and Telemea (8 Dairy staples, 7 merges), plus one recipe merge.
Its price is 16 × 1 + 15 × 2 = 46 coins.

Merge chains are game rules, not recipes for food preparation.

| Chain | Dish | Paid staples | Merges | Coins |
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
So a delivery pays back the staples of its dishes and earns the work rate for each merge. The supper pays nothing.

A quest that opens after preparation N is necessary for preparation N + 1.
The work value of a quest is the merges of its dishes times the work rate.
For each preparation, the work value of the quests that open before it must total at least the cost of all preparations to that point.
The coins that remain after the last preparation must buy the staples of the supper.
`questProblems` in `src/content.ts` checks these rules before the data can ship.
A player who delivers every open quest and buys only its staples has enough coins for the next preparation.

A new game starts with no coins. The first quest asks only for free herbs.
The early quests also ask for herb bunches, Linden tea, and socată, which need no paid staple. Their work value gives the purse the coins to buy staples for the next quests.

The recovery quest is the safety net. Ana asks for one Linden tea while a quest is open and the purse is below the recovery floor, or while no quest is open and the purse cannot pay the next preparation.
A player who spends coins on spare food repays the shortfall with tea, and is never stuck.

## Work and price

The bistro repairs and reuses its furniture.
Each preparation defines work, materials or stock, labour, and estimated active person-hours.
Materials plus labour determine the cost. The story position does not determine the cost.

These figures are estimates for the stated work.
Retail examples and minimum service rates inform the estimates.
No supplier gives a quote for this fictional bistro.
Quantities, hours, and the share of a partly used supply pack are assumptions.
The game has no wait for paint to dry, materials to cure, or supplies to arrive.

| N | Preparation | Materials or stock | Labour | Person-hours | Total coins |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | Fix the broken window | 200 | 200 | 4 | 400 |
| 2 | Mend the welcome board | 30 | 60 | 1.5 | 90 |
| 3 | Set up the pastry shelf | 30 | 40 | 1 | 70 |
| 4 | Light the front room | 40 | 200 | 3 | 240 |
| 5 | Repair the kitchen worktop | 90 | 150 | 3 | 240 |
| 6 | Bring in market produce | 80 | 40 | 1 | 120 |
| 7 | Hang the kitchen shelves | 80 | 100 | 2 | 180 |
| 8 | Write the first menu | 25 | 25 | 0.5 | 50 |
| 9 | Choose the tableware | 480 | 40 | 1 | 520 |
| 10 | Sand the long table | 120 | 480 | 8 | 600 |
| 11 | Make a recipe corner | 20 | 20 | 0.5 | 40 |
| 12 | Open the shared table | 20 | 80 | 2 | 100 |
| 13 | Clear the courtyard | 20 | 120 | 4 | 140 |
| 14 | Plant the herb pots | 100 | 40 | 1 | 140 |
| 15 | Repair the door hood | 900 | 400 | 8 | 1300 |
| 16 | Set the outdoor tables | 10 | 80 | 2 | 90 |
| 17 | Collect family recipes | 15 | 60 | 2 | 75 |
| 18 | Prepare the tasting plates | 90 | 60 | 2 | 150 |
| 19 | Stock the drinks cabinet | 160 | 40 | 1 | 200 |
| 20 | Print the supper menu | 40 | 80 | 2 | 120 |
| 21 | Send the invitations | 160 | 60 | 2 | 220 |
| 22 | Prepare the serving station | 120 | 80 | 2 | 200 |
| 23 | Add the final flowers | 120 | 60 | 1.5 | 180 |
| 24 | Welcome the community supper | 60 | 60 | 2 | 120 |

The work estimates have these limits:

- Window: one new pane, seals, and the preparation and paint of the existing frame and shutters.
  Materials allow approximately 120 coins for glass and 80 for supplies and finish.
  The four hours cover removal, preparation, installation, seals, and paint. The frame stays in use.
- Sign: the wood is sound. The work is to sand and repaint the sign. It uses small amounts of finish and 1.5 hours.
- Shelves: the paintings show timber that is already in the bistro.
  The work is to clean and secure the shelves, repair the finish, and stock the shelves.
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
- Supper menus: ten strong prints and simple stands cost approximately 40 coins.
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
The 24 preparations total 57 estimated person-hours and 5585 coins.

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

Run `node tools/campaign-balance.ts efficient`, `node tools/campaign-balance.ts miss-bookings`, or `node tools/campaign-balance.ts debt`.
For each of the 20 fixed seeds, the report gives the days, the lantern uses, the thefts, the stolen ingredients, the gifts, the lowest purse, the merges made only to move the clock, the purse after the supper, the spending, and the free cells at each preparation.
The test file also reports the costs, work, actions, takes, merges, deliveries, recovery deliveries, and coins for each preparation and chapter.

The campaign fixture is the play code in `tools/campaign-balance.ts`.
The fixture plays a fresh game with one repeatable policy, with no injected coins or items.
The fixture pays each preparation when payment becomes available.
Otherwise, it delivers tonight's booked quest first, and it lights the lanterns when the meal is ready before 20:00.
Then it delivers the unbooked ticket whose staples cost the least.
With only booked quests for later evenings left, it cooks them, and their merges bring the night.
Before a quest, a short purse makes recovery teas. Within 30 merges of the closing, a purse short of the upkeep makes recovery teas, so the purse never goes below zero.
While fewer than 24 cells are free, the fixture clears the cheapest blocker between quests.
The fixture makes each required dish from spare food on the board, or from stage-one staples, merges, and recipes.
If the board is full, the fixture merges spare food: a pair, a recipe, or a match for a blocked dish. A full board without such a merge is a deadlock, and the fixture fails.
After the last preparation, the fixture serves the supper.
The balance band: the purse after the supper holds 0 to 10% of the coins that the fixture spent on preparations, takes, and upkeep.

`tests/campaign-balance.test.ts` enforces the bounds that `PRODUCT.md` gives for the three strategies.
The efficient fixture never leaves a raw staple loose at a closing: it takes two staples and merges them at once.
So the thief rat never comes, and the 20 seeds give the same run.

This check measures actions under that policy. This check does not establish a satisfactory human play experience.
The campaign needs more actions than a free-production campaign, because each merge earns only the work rate. Raise the work rate to shorten it, and then reduce the provisions to keep the balance band.
Play an early chapter and a late chapter before a lever change.
Record the device, initial save, action counts, and elapsed human play time.
Do not convert automated execution time to player time.

A lever change changes the price of each dish and the reward of each quest.
Run `npm run data:generate`, `node tools/campaign-balance.ts`, and `npm test` after each lever or quest change.
