# Campaign economy

`PRODUCT.md` controls the rules. `tools/create-original-data.ts` defines the numbers.
This record explains the price model and the work estimates.

## Money and portions

One coin uses approximately one Romanian leu as its reference scale.
This scale relates small food purchases to repair budgets.
The model is a game budget, not a precise profit account.
Production is free. The model does not charge for replacement ingredients or operating expenses.

Each food has a menu price for the portion below.
The menu value of a quest is the sum of its portion prices.
Merge stage does not multiply the price.
A later stage does not always cost more. The portion and dish determine the price.

| Chain | Item and reference portion | Coins |
| --- | --- | ---: |
| Bread | Flour, one small bag | 2 |
| Bread | Dough, one portion to prepare | 4 |
| Bread | Pogăcele, three small pieces | 12 |
| Bread | Langoș, one dressed piece | 22 |
| Bread | Zacuscă toast, one plate | 28 |
| Bread | Bread basket, one table basket | 35 |
| Warm | Cornmeal, one small bag | 2 |
| Warm | Mămăligă, one side portion | 8 |
| Warm | Bulz, one main portion | 32 |
| Warm | Smoked cheese plate, one plate | 40 |
| Warm | Cabbage rolls, one meat main portion | 50 |
| Warm | Goulash pot, two main portions | 80 |
| Sweets | Walnuts, one small ingredient portion | 3 |
| Sweets | Doughnut, one piece | 8 |
| Sweets | Papanași, one dessert portion | 32 |
| Sweets | Plum dumplings, one dessert portion | 28 |
| Sweets | Cozonac, one small loaf | 40 |
| Sweets | Chimney cake, one cake | 35 |
| Drinks | Elderflowers, one small fresh bunch | 1 |
| Drinks | Socată, one glass | 12 |
| Drinks | Fruit tea, one small pot | 18 |
| Drinks | Cherry compote, one small jar | 20 |
| Drinks | Red wine, one small carafe | 35 |
| Drinks | Plum brandy, one small carafe | 40 |
| Produce | Aubergine, one small vegetable | 3 |
| Produce | Peppers, one small ingredient portion | 3 |
| Produce | Roasted vegetables, one side plate | 18 |
| Produce | Zacuscă, one small jar | 24 |
| Produce | Wild mushroom sauce, two small portions | 28 |
| Produce | Sharing board, a board for two | 65 |

Vlad and Elisabeta request only meat cabbage rolls, goulash, and red wine.
Mina and Avram share a vegetarian meal with a menu value and reward of 168 coins.
Their request has two zacuscă toasts, two roasted vegetable plates, one smoked cheese plate, and two fruit teas.
The request permits eggs and dairy. The later local news pays nothing.

The project defines these portion prices with reference to Romanian shops and restaurants.
The model does not copy a menu or claim that every restaurant has these prices.
The raw ingredient prices stay between 1 and 3 coins.
Merge chains are game rules, not recipes for food preparation.

A sale without a request clears space on the board.
The sale gives one quarter of the menu price, rounded down, with a minimum of one coin.
This discount is a game rule. The discount does not represent a resale market.
Quest deliveries give more value than clearance sales.

## Quest rewards

Quests earn campaign coins.
A personal request multiplies its menu value by the rate of the chapter in which the request opens.
The reward rounds to an even number of coins.

| Chapter | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Rate | 3 | 2.5 | 2 | 1.5 | 1 | 1 |

Early chapters pay more to make the first room changes available sooner.
Traveller supply requests and Mina and Avram's meal pay their menu value.
Ionatan's dinner has a menu value of 220 coins and pays 1,100 coins.

A quest that opens after preparation N is necessary for preparation N + 1.
For each preparation, total available quest rewards must equal or exceed total preparation costs to that point.
`questProblems` in `src/engine.ts` checks this rule before the data can ship.
A player who delivers every open quest has sufficient coins for the next preparation.
The rule does not count sale income.

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

- Window: one replacement pane, seals, and preparation and paint for the existing frame and shutters.
  Materials allow approximately 120 coins for glass and 80 for supplies and finish.
  The four hours include removal, preparation, installation, seals, and paint. The frame stays in use.
- Sign: the wood is sound. Sand and repaint the sign with small amounts of finish and 1.5 hours.
- Shelves: the paintings show existing timber. Clean, secure, repair the finish, and stock the shelves.
  The estimate does not include a new shelf unit.
- Lamps: two existing fittings. The estimate covers bulbs, small materials, installation, and connection work.
- Table and chairs: the existing long table and two chairs.
  Eight hours cover the three pieces and their decorative finish.
- Tableware: six handmade bowls and six cups with saucers. Later preparations reuse this purchase.
  The allowance has 300 coins for bowls, approximately 160 for cups and saucers, and 20 for small supplies.
- Courtyard: sweep approximately 20 square metres and collect leaves in bags.
  The estimate has no pavement or landscape work.
- Herb pots: three clay pots, three small plants, soil, and drainage material.
  The material allowance is 100 coins.
- Door hood: the sound structure stays in use. Replace approximately two square metres of wood shingles.
  The estimate allows 800 coins for shingles and 100 for fasteners and weather seals.
  The estimate includes eight active labour hours.
- First menu: one small slate, chalk, and half an hour for text and pictures.
- Supper menus: ten strong prints and simple stands cost approximately 40 coins.
  The labour includes movement of the existing long table into the courtyard.
- Invitations: twenty small prints, the wreath, the lantern, and three geraniums in the painting.
  Existing towels stay in use. The estimate includes the gate decoration.
- Final flowers: one outdoor light string, supplies to attach the string, and flowers in existing vases.
  The light string must be suitable for outdoor use.
- Supper: twelve guests. Earlier preparations pay for food samples, drinks, and the first portions.
  The final preparation pays only for additional supplies and service.

## Effort in play

The estimated person-hours describe the work. The hours do not set a timer or a play goal.
The 24 preparations total 57 estimated person-hours and 5585 coins.

A preparation can cost less than the preparation before it.
Late menu or display work does not cost more only because the work occurs late in the story.
The necessary quests determine the play effort.
The game has no separate goal currency, timer, or chapter reset.

## Reference inputs

The links below explain the scale of the model.
The amounts are reference inputs, not live offers or supplier quotes for the game.
A supplier can change prices or remove a page.
Verify the source and the portion before a price revision.

- [Auchan flour](https://www.auchan.ro/faina-alba-superioara-000-auchan-1-kg/p): 1.99 lei for a 1 kg bag.
- [Sergiana menu](https://delivery.sergiana.ro/ro/meniu-restaurant/fel-principal): 7 lei for a mămăligă side and 2 lei for sliced bread.
  Mushroom stew with mămăligă uses 35 lei. These examples distinguish ingredients, side dishes, and main dishes.
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
  [Corund sets](https://www.invietraditia.ro/arta-populara-romaneasca-si-obiecte-de-artizanat/ceramica-de-corund-korond/) inform the 159 lei allowance for six cups and saucers.
  These examples inform the handmade tableware budget. The game does not use disposable plates.
- [Outdoor light string](https://www.dedeman.ro/ro/ghirlanda-luminoasa-party-hoff-interior/-exterior-12-led-uri-multicolore-soclu-g45-10-5-m-controler/p/1051995): 104.89 lei for an outdoor example.
  The example informs the budget only. The game retains its warm lights.

## Verification and limits

Run `node tools/campaign-balance.ts`.
The report gives costs, work, actions, takes, merges, sales, and deliveries for each preparation and chapter.
The report separates quest income from sale income.

The fixture plays a fresh game with one repeatable policy.
The fixture sells the initial food and pays each preparation when payment becomes available.
Otherwise, the fixture delivers the first quest that has a ticket.
The fixture makes each requested dish from the highest available source output.
If the board is full, the fixture sells the lowest-value food that the current delivery does not need.

This check measures actions under that policy. This check does not establish a satisfactory human play experience.
The first repair remains the largest balance uncertainty: the player does substantial work before the first room reward.
Play an early chapter before a price revision.
Play a late chapter before a price revision.
Record the device, initial save, action counts, and elapsed human play time.
Do not convert automated execution time to player time.

A price change changes the reward of each quest that requests the item.
Run the campaign reward check after each price or reward change.
