# Campaign economy

`PRODUCT.md` owns the rules. `tools/create-original-data.ts` owns the numbers.
This record explains the authored price and work model.

## Money and portions

One coin uses roughly one Romanian leu as its reference scale. This keeps a small food purchase
and a repair budget comparable. It is a game budget, not a precise profit account.
Production stays free. The game abstracts ingredient replenishment and operating expenses.

Each ordinary food has an explicit menu price for the portion below. A new order pays the sum
of these prices. It has no flat order bonus and no multiplier based on merge stage.
A later merge stage is not necessarily a more expensive food. Portions and the actual dish matter.

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
| Warm | Cabbage rolls, one main portion | 50 |
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
| Drinks | Blueberry liqueur, one small carafe | 35 |
| Drinks | Plum brandy, one small carafe | 40 |
| Pantry | Aubergine, one small vegetable | 3 |
| Pantry | Peppers, one small ingredient portion | 3 |
| Pantry | Roasted vegetables, one side plate | 18 |
| Pantry | Zacuscă, one small jar | 24 |
| Pantry | Wild mushroom sauce, two small portions | 28 |
| Pantry | Sharing board, a board for two | 65 |

The temporary tasting ingredients use the prices of their matching bread ingredients.
They do not enter ordinary orders.

These are authored portion prices, informed by Romanian shop and restaurant offers. They are not
copied menus or claims that every restaurant has these prices. The raw ingredient limit of 1 to 3
coins follows the user's requirement. The merge chains remain game rules, not cooking recipes.

A sale without a customer is a clearance action. It gives one quarter of the menu price, rounded
down, with a minimum of one coin. The discount is a stated game rule, not a claim about a resale
market. It preserves the space-clearing action while keeping prepared customer orders more valuable.

## Work before price

The bistro repairs and reuses existing furniture. It does not buy a new room at each chapter.
Each preparation has a scope, a material or stock allowance, a labour allowance, and estimated
active person-hours. Its price is materials plus labour. Its place in the story does not set its price.

The figures below are scoped estimates. Retail offers and service starting rates inform them.
No supplier has quoted this fictional bistro. Quantities, labour hours, and the allocation of a
part-used tin or supply pack are assumptions. No drying, curing, or delivery wait enters play.

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

The specific scopes prevent several false costs:

- Window: replace one pane, seal it, and prepare and paint the existing frame and shutters.
  The 200 material coins allow about 120 for glass and 80 for glazing supplies and finish.
  The four hours allow removal, preparation, fitting, sealing, and painting. The frame is reused.
- Sign: the wood is sound. Sanding and repainting need small amounts of finish and 1.5 hours.
- Shelves: the paintings already show the timber. Clean, secure, touch up, and stock it.
  Do not charge for a new shelving unit.
- Lamps: two fittings are supplied. Pay for bulbs, small materials, mounting, and connection work.
- Table and chairs: restore the existing long table and two chairs. The eight hours cover several
  pieces and their decorative finish. This is more work than moving finished furniture.
- Tableware: allow six handmade bowls and six cups with saucers. Later tasks reuse this purchase.
  The allowance uses 300 for bowls, about 160 for cups and saucers, and 20 for small supplies.
- Courtyard: sweep about 20 square metres and bag leaves. No paving or landscaping is included.
- Herb pots: three clay pots, three small plants, soil, and drainage. The material allowance is 100.
- Door hood: reuse the sound structure. Replace about two square metres of wood shingles.
  Allow 800 for shingles and 100 for fixings and weather seals, plus eight active labour hours.
- First menu: one small slate, chalk, and half an hour to write and draw it.
- Supper menus: ten sturdy prints and simple stands cost about 40. The labour also moves the
  existing long table into the courtyard. The table is not purchased again.
- Invitations: twenty small prints plus the depicted wreath, lantern, and three geraniums.
  Existing towels are reused. This scope includes the gate decoration in the painting.
- Final flowers: one outdoor light string and hanging supplies, plus gathered flowers in reused
  vases. The light string must be suitable for outdoors.
- Supper: twelve guests. Tasting stock, drinks, and the first serving batches have their own tasks.
  The final task pays only for top-ups and hosting. It does not charge for all the furniture and food again.

## Effort in play

Each estimated half person-hour contributes one served order and two merges to the cumulative
campaign goals. This is an explicit play conversion. It is not a measured claim that one order
performs carpentry or takes thirty minutes. More labour adds more effort; writing a menu adds
much less than repairing the hood. The goals total 114 service and 228 merges over 57 modelled
person-hours. All 24 prices total 5585 coins.

Counters are lifetime totals. Earlier excess service and merges still count. Prices may go down
from one preparation to the next. Cheap writing or arranging tasks do not become expensive because
they are late in the story. No extra goal currency, timer, or per-chapter reset is added.

## Reference offers

These primary sources support the scale and the distinctions. Supplier prices can change.
Their amounts are reference inputs, not live promises in the game.

- [Auchan flour](https://www.auchan.ro/faina-alba-superioara-000-auchan-1-kg/p): a 1 kg bag at 1.99 lei.
- [Sergiana food menu](https://delivery.sergiana.ro/ro/meniu-restaurant/fel-principal): side mamaliga at 7 lei,
  sliced bread at 2 lei, and mushroom stew with mamaliga at 35 lei. These distinguish ingredients,
  sides, and prepared main dishes. The search index exposes the menu text; the page can show a cookie panel.
- [Paradisul Transilvaniei menu](https://paradisultransilvaniei.ro/ro/restaurant): tea 10 lei,
  socata 18, cooked vegetables 20 to 22, desserts 15 to 25, and a cheese board 65.
  The bistro's authored portions need not equal these restaurant portions.
- [Simple glass](https://www.sticla-termopan.ro/preturi.php): advertised from 120 lei.
  The page does not give enough detail to treat this as a fitted-window quote.
- [Wood shingles](https://mobicam-furniture.ro/produse/sindrile-acoperis/): advertised from 400 lei per square metre.
- [Exterior wood finish](https://www.dedeman.ro/ro/lac/-lazura-pentru-lemn-sadolin-extra-incolor-exterior-0-75-l/p/5000519): 79 lei per 0.75 litre.
  This is a frame-finish price anchor, not a food-contact worktop product specification.
- [HandySmart services](https://handysmart.ro/preturi.html): shelf mounting from 50 lei and edge or surface repairs from 75 lei.
  The published list has starting rates, not an hourly quote for this bistro.
- [HandySmart restoration guide](https://handysmart.ro/blog-posts/reconditionari-mobila-veche.html): a table repair and refinish estimate of 150 to 400 lei.
- [The Print Store](https://www.theprintstore.ro/print-preturi/): colour A4 at 1 leu on light paper or 2 lei on heavier paper.
- [Terracotta pot](https://www.leroymerlin.ro/produse/ghiveci-flori-teracota-17-cm-maro-teracota-11389175.html): 9.90 lei for a 17 cm pot.
- [Herb plants](https://www.hornbach.ro/c/gradina/plante/fructe-legume-plante-aromatice/plante-aromatice/S19821/): small herbs around 18 lei each.
  The game's three herbs remain rosemary, parsley, and lovage.
- [Corund plate](https://www.invietraditia.ro/farfurie-ceramica-corund-albastru-cobalt-16-cm/): one handmade small plate at 60 lei.
  [Corund sets](https://www.invietraditia.ro/arta-populara-romaneasca-si-obiecte-de-artizanat/ceramica-de-corund-korond/)
  include six cups and saucers at 159 lei. These anchor handmade tableware, not disposable plates.
- [Outdoor light string](https://www.dedeman.ro/ro/ghirlanda-luminoasa-party-hoff-interior/-exterior-12-led-uri-multicolore-soclu-g45-10-5-m-controler/p/1051995): 104.89 lei for an outdoor-rated example.
  This is a price anchor only; the game keeps its existing warm lights.

## Verification and limits

Run `node tools/campaign-balance.ts`. The report includes costs, work, actions, service, merges,
sales, and separate order, sale, level, and quest income for each preparation and chapter.
The same tests compare the former rules with the current rules at the same seed and policy.
They also check a policy that selects quoted income per production action, existing saves,
and all rewards. Historical rules exist only in this comparison fixture and in save compatibility.

This shows how the model changes effort. It does not establish a satisfying human session.
The largest balance uncertainty is the first repair: it is substantial work before the first room
reward. Play an early and late chapter before changing the next price revision. Record the device,
seed, start save, action counts, and elapsed human play time. Do not convert bot runtime to player time.

`menu-1` is the first explicit menu revision. Once shipped, its values must stay available for
outstanding quotes. A later price change needs a new revision and exact validation for previous quotes.
Unmarked saved orders keep the original formula and their original payouts until served.
