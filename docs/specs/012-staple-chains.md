# 012: Staple chains and mixed dishes

Status: Implemented.

## Outcome and scope

The chains follow real staple foods. Each chain is one food family. It starts with one raw staple, and its later dishes use only foods of that family. For example, the Vegetables chain starts with Potatoes and later holds a basket of other vegetables.
A mixed dish uses dishes from two or three chains. The player cannot cook a mixed dish without progress in each of its chains.
Each dish records what it contains. The data check uses these records to enforce the diet of each character.

The game has 12 chains, 61 chain dishes, 24 mixed dishes, and 12 sources.
The recovery quest has a fourth ticket, and the preparation blockers keep four cells free.

## Implementation scope

These parts implement the feature:

- the merge rule in `src/engine.ts` and the merge queries in `src/model.ts`, for the mixed merge;
- the content checks in `src/content.ts`, for the chain lengths, the recipes, the diets, and the favourite dishes;
- the save format and its supported item IDs;
- the item requirements of all quests, the initial board, the blocker layout, and of the preparation batches;
- the quest and story text that names a dish, and the preparation scenes that open a source;
- the recipe book, the item dialog, the guide, "Find a match", and the blocker help;
- the menu art: one picture for each dish and each source;
- the economy: paid takes, blocker coins, formula prices, a recovery quest, and a balance band;
- the economy record and the campaign balance test.

`PRODUCT.md` owns the rules for takes, income, the supper, the recovery quest, blockers, tickets, and campaign balance.
The game has 83 quests, including Ana's recovery quest.
Takes are immediate. The game has no energy limit and no waiting.

## The staple chains

The game has 12 chains. A chain has from four to six dishes. Each chain has one source, and the source gives the stage-1 staple.
Two matching dishes of a chain merge into the next dish of that chain.

| Chain | Source | Stage 1 | Stage 2 | Stage 3 | Stage 4 | Stage 5 | Stage 6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Grain | Windmill | Flour | Dough | Loaf | Pogăcele | Langoș | Bread basket |
| Corn | Corn basket | Corn cob | Shelled corn | Cornmeal | Mămăligă | | |
| Herbs | Herb basket | Elderflowers | Herb bunch | Socată | Linden tea | | |
| Dairy | Milk churn | Milk | Sour cream | Cottage cheese | Telemea | Smoked cheese | Cheese board |
| Poultry | Hen's nest | Eggs | Chicken | Chicken broth | Roast chicken | | |
| Vegetables | Vegetable crate | Potatoes | Vegetable basket | Pickled cabbage | Roasted vegetables | Zacuscă | Vegetable stew |
| Fruits | Cornucopia | Plums | Fruit bowl | Cherry compote | Plum jam | Red wine | Plum brandy |
| Pork | Butcher's hook | Pork | Minced pork | Sausages | Smoked bacon | Roast pork | |
| Beans | Legume sacks | White beans | Lentils | Green beans | Bean dip | Bean stew | |
| Lamb | Shepherd's bag | Lamb | Lamb cuts | Lamb chops | Lamb stew | Roast lamb | |
| Veal | Butcher's block | Veal | Diced veal | Minced veal | Meatballs | Veal stew | Roast veal |
| Fish | Fish trap | Fresh trout | Fried trout | Smoked trout | Saramură | | |

The vegetable basket holds onions, tomatoes, peppers, aubergines, and cabbage. The fruit bowl holds plums, cherries, apples, grapes, and walnuts.

## When each chain opens

Three chains are open in a new game. Preparations open the other nine, up to preparation 20.
The scene of each opening preparation names its new source.

| Preparation | Chain |
| --- | --- |
| New game | Grain, Corn, Herbs |
| 3, "Set up the pastry shelf" | Dairy |
| 5, "Repair the kitchen worktop" | Poultry |
| 6, "Bring in market produce" | Vegetables |
| 7, "Hang the kitchen shelves" | Fruits |
| 8, "Write the first menu" | Pork |
| 11, "Make a recipe corner" | Beans |
| 13, "Clear the courtyard" | Lamb |
| 16, "Set the outdoor tables" | Veal |
| 20, "Print the supper menu" | Fish |

## Mixed dishes

A recipe has exactly two parts. The parts come from different chains, or one part is a mixed dish.
The player merges one part into the other part. The two parts leave the board, and the mixed dish takes the cell of the target part.
This merge uses the same tap, drag, and keyboard actions as a chain merge.

A recipe can use a mixed dish as a part, but only a mixed dish made from two chain dishes. So recipes nest one level deep. A mixed dish can be a part of more than one recipe: Sweet dough is a part of Cozonac and of Chimney cake. A mixed dish uses at most three chains.
A recipe can use the last dish of a chain. So the last dish of a chain can have a merge target.
Each pair of parts makes at most one dish, and each mixed dish has exactly one recipe.

| Mixed dish | Part 1 | Part 2 | Chains |
| --- | --- | --- | --- |
| Bulz | Mămăligă | Telemea | Corn, Dairy |
| Papanași | Dough | Cottage cheese | Grain, Dairy |
| Cheese pie | Dough | Telemea | Grain, Dairy |
| Sweet dough | Dough | Eggs | Grain, Poultry |
| Chicken noodle soup | Chicken broth | Dough | Poultry, Grain |
| Zacuscă toast | Loaf | Zacuscă | Grain, Vegetables |
| Plum dumplings | Potatoes | Plums | Vegetables, Fruits |
| Fruit tea | Herb bunch | Fruit bowl | Herbs, Fruits |
| Cabbage rolls | Minced pork | Pickled cabbage | Pork, Vegetables |
| Stuffed peppers | Minced pork | Vegetable basket | Pork, Vegetables |
| Tochitură | Roast pork | Mămăligă | Pork, Corn |
| Sharing board | Smoked cheese | Sausages | Dairy, Pork |
| Bean soup | White beans | Smoked bacon | Beans, Pork |
| Beans with sausages | Bean stew | Sausages | Beans, Pork |
| Drob | Lamb cuts | Eggs | Lamb, Poultry |
| Goulash pot | Diced veal | Vegetable basket | Veal, Vegetables |
| Meatball soup | Meatballs | Herb bunch | Veal, Herbs |
| Mici | Minced veal | Minced pork | Veal, Pork |
| Fish soup | Fresh trout | Vegetable basket | Fish, Vegetables |
| Cabbage rolls with mămăligă | Cabbage rolls | Mămăligă | Pork, Vegetables, Corn |
| Bean soup in a bread bowl | Bean soup | Loaf | Beans, Pork, Grain |
| Saramură with mămăligă | Saramură | Mămăligă | Fish, Corn |
| Cozonac | Sweet dough | Fruit bowl | Grain, Poultry, Fruits |
| Chimney cake | Sweet dough | Milk | Grain, Poultry, Dairy |

Sweet dough is the enriched yeast dough of both cakes. Cozonac has a walnut and raisin filling. Chimney cake has a milk and butter brush and a sugar crust.

A mixed dish opens only when each of its chains is open.
The data check rejects a quest that asks for a dish before its chains open.

## Blocker merges

Any legal merge into a blocked item clears the blocker: a matching dish of the chain, or a recipe partner.
The result stays in the blocked cell, and the cell of the moved item becomes empty.
For example, Telemea dropped on a blocked Mămăligă clears the blocker and leaves Bulz in that cell.
The blocker help names the blocked dish and each recipe partner that the player has made, and marks each movable match. It does not name a partner that the player has not made.

## Cathedral supply quests

A cathedral supply quest has one of two sizes:

- provisions: 12 to 16 portions of chain dishes from stage 3 up;
- meals: 4 to 6 portions of mixed dishes.

## Contents and diets

Each dish records its contents as tags: `meat`, `pork`, `dairy`, `egg`, `fish`, `alcohol`, and `garlic`.
Poultry meat counts as `meat`. Eggs count only as `egg`.
A mixed dish has every tag of its parts, and it can add a tag of its own.

| Tag | Chain dishes | Added by a mixed dish |
| --- | --- | --- |
| `meat` | all Veal, Pork, and Lamb dishes; Chicken, Chicken broth, Roast chicken | |
| `pork` | all Pork dishes | |
| `dairy` | all Dairy dishes | |
| `egg` | Eggs | |
| `fish` | all Fish dishes | |
| `alcohol` | Red wine, Plum brandy | |
| `garlic` | Sausages, Bean dip, Lamb stew, Saramură | Mici, Drob |

A character can have a diet. A diet can forbid tags, and it can require dishes in each quest of the character. The game does not show the diet or the tags. The data check enforces them.

| Character | Diet | Rule |
| --- | --- | --- |
| Mina | Vegetarian | No dish with `meat` or `fish`. |
| Vlad, Elisabeta | Red wine and meat, no garlic | Each quest has Red wine and a dish with `meat`. No dish with `garlic`. |
| Cătălina | Orthodox fast, fish allowed | No dish with `meat`, `dairy`, or `egg`. |
| Avram | Kosher-style | No dish with `pork`. No quest with both `meat` and `dairy`. |

The data check rejects a quest that breaks the diet of a character of that quest.
For a shared quest, each character of the quest must accept each dish.

## The supper

Mara's supper quest, "The community supper", opens after preparation 24. It asks for one plate for each of the 11 guests and has no coin cost.
Each plate suits the diet of its guest. Each regular gets a favourite dish. Together, the plates use all 12 chains.
The delivery pays no reward and queues the finale. The courtyard then shows the supper painting.

| Guest | Plate | Chains |
| --- | --- | --- |
| Mara | Cabbage rolls with mămăligă | Pork, Vegetables, Corn |
| Ilie | Bean soup in a bread bowl | Beans, Pork, Grain |
| Eszter | Drob | Lamb, Poultry |
| Sorin | Plum dumplings | Vegetables, Fruits |
| Costel | Papanași | Grain, Dairy |
| Victor | Meatball soup | Veal, Herbs |
| Ana | Chicken noodle soup | Poultry, Grain |
| Ileana | Stuffed peppers | Pork, Vegetables |
| Bran | Mici | Veal, Pork |
| Cătălina | Saramură with mămăligă | Fish, Corn |
| Cezar | Tochitură | Pork, Corn |

The opening of the supper quest explains that each guest gets a plate and pays nothing.

## Favourite dishes

Each regular has two or three favourite dishes.
Each quest of a regular asks for at least one favourite dish.
Each regular has a favourite dish that is open at the window of each of their quests.
The journal shows the favourite dishes of a regular.

| Regular | Favourite dishes |
| --- | --- |
| Dochia | Mămăligă, Bulz, Drob |
| Victor | Linden tea, Chicken noodle soup, Meatball soup |
| Ana | Pogăcele, Linden tea, Chicken noodle soup |
| Costel | Socată, Papanași, Cozonac |
| Sânziana | Socată, Plum dumplings, Fruit tea |
| Dorian | Cheese board, Red wine, Cozonac |
| Ileana | Zacuscă toast, Fruit tea, Stuffed peppers |
| Cezar | Tochitură, Bean soup, Mici |
| Cătălina | Plum dumplings, Bean stew, Saramură with mămăligă |
| Bran | Langoș, Bean soup in a bread bowl, Mici |
| Vlad | Roast pork, Red wine, Roast lamb |
| Elisabeta | Red wine, Tochitură, Roast lamb |

## Data and state

- `tools/create-original-data.ts` authors the chains, the dishes with their tags, the recipes, the diets, and the favourite dishes.
- `src/model.ts` gives the merge result of two items: the next dish of the chain, the dish of a recipe, or none.
- `src/engine.ts` applies a mixed merge in one change. A failed merge changes nothing.
- `src/content.ts` checks each chain, each recipe, the recipe depth, the tags, each diet, each favourite, and the opening of each quest dish.
- [Shared save compatibility](README.md#shared-save-compatibility) gives the supported format. The game does not read or convert an earlier format. Without a current save, the player starts a new game.
- "Show me on the board" for a mixed dish guides toward the missing part with the fewest steps.

## Art

The food art is one consistent set of 16 atlases: 85 dishes and 12 sources.

- Each chain has one atlas. It holds the source and the dishes of the chain, in stage order.
- Four atlases hold the 24 mixed dishes:
  - soups and stews: Meatball soup, Chicken noodle soup, Fish soup, Bean soup, Bean soup in a bread bowl, Goulash pot, Beans with sausages, Tochitură;
  - mains: Bulz, Cabbage rolls, Cabbage rolls with mămăligă, Stuffed peppers, Mici, Drob, Saramură with mămăligă;
  - sweets: Sweet dough, Cozonac, Chimney cake, Papanași, Plum dumplings;
  - breads, boards, and drinks: Cheese pie, Zacuscă toast, Sharing board, Fruit tea.
- Each atlas is a 2048 by 1024 pixel grid of 4 columns and 2 rows of equal cells. Each picture stays inside its cell with a clear margin. Unused cells are transparent. The code finds a picture from its atlas and its cell, with no measured bounds.
- Each picture has one cue that tells it apart from similar foods. For example, Flour is an open paper sack of fine white powder with an ear of wheat, and it shows no grains. The Windmill is a small wooden village windmill with a tied flour sack and ears of wheat at its door: the bistro buys its grain there.
- Each picture has hard, clean edges and a fully transparent background. No picture has a glow, a halo, a haze, or a soft fringe. Review measures the share of soft pixels (alpha from 8 to 127) against solid pixels and rejects a visible fringe.
- Each atlas uses the same painted style.
- Each atlas has records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.
- Review examines each picture at the board-tile size on a phone, in both themes. The reviewer names each picture before reading its prompt. A picture that gets the wrong name is rejected. The user accepts each atlas.

## Economy

The player cooks with a plan. Coins pay for staples, and quests pay for the cooking.

### Levers and prices

`PRODUCT.md` gives the four levers of the economy (the take cost, the blocker coin, the work rate, and the recovery floor) and the formula of the menu price. The [economy record](../economy.md) gives the price of each dish and the evidence for the levers.

### Takes

A take from the Herbs source is free at all times.
A take from each other source spends the take cost.
A take needs the coins and a free space. A failed take spends nothing.
When the purse holds less than the take cost, a paid source takes nothing, and Mara says why.

### Blockers

Each cleared blocker gives the blocker coin, in the same change as the merge.
This includes the eight blockers of a new game and each preparation blocker.

### Rewards

Every quest except the supper pays its menu value. The supper pays nothing. No quest has a reward multiplier.
So every delivery earns at least the work rate for each merge, and no delivery loses coins.
The preparation costs keep their work estimates in lei-equivalent coins.

### Recovery quest

Ana's "Tea for the night ward" asks for one Linden tea. It is the only recurring quest.
It is open in each of these cases:

- the campaign has an open quest, and the purse holds less than the recovery floor;
- the campaign has no open quest, and the purse holds less than the cost of the next preparation.

It closes when neither case is true, and it opens again each time a case becomes true.
So a player who spends coins on spare food is never stuck before a preparation. The player repays the shortfall with tea: one Linden tea pays 14 coins at the starting levers, and the tea can cover spare takes and daily upkeep.
While it is open, it has its own ticket after the three quest tickets. It never moves a quest to waiting.
A delivery pays its menu value. It records nothing, queues no scene, and has no journal entry.
The recovery quest is outside the order of Ana's quests. It needs no earlier Ana quest, and no Ana quest needs it. It can be open at the same time as an Ana campaign quest. Save validation rejects it in the delivered quests.

One Linden tea from scratch needs four free cells: three cells hold the stages 1 to 3 while a fourth takes the next Elderflowers.
So the preparation blockers keep at least four cells free. The other preparation blockers wait in preparation order.
A board that the player fills with dishes that cannot merge and that no quest needs stays full.

### Balance check

The campaign balance test plays one efficient strategy with no injected coins or items.
It pays all 24 preparations and delivers the supper.
After the supper, the purse must hold from 0 to 10% of the coins that the strategy spent on preparations, takes, and upkeep.
The test prints the purse, the takes, the coins from blockers, and the free cells at each preparation.

## Acceptance checks

- Content: each chain is complete. Each recipe has two parts and one result. No pair has two results. A mixed dish can be a part of two recipes, and a recipe whose part is itself made from a mixed dish fails the check. No dish uses more than three chains. No quest breaks a diet. No quest asks for a dish before its chains open. Each regular quest has a favourite dish. Each cathedral supply quest has one of the two sizes.
- Engine: a chain merge, a mixed merge in both directions, a three-chain dish cooked from staples, a blocker cleared by a recipe partner, a refused pair, and a failed merge that changes nothing.
- Supper: each plate suits its guest, each regular gets a favourite, the plates use all 12 chains, and the delivery queues the finale once.
- Campaign: the campaign balance test pays all 24 preparations and delivers the supper with no injected coins or items. The purse after the supper is inside the balance band. The test records the free cells at each preparation and each deadlock. From the state before each preparation, a check buys one spare staple so that the purse cannot pay, cooks Linden tea from free herbs, and reaches the preparation through the recovery quest.
- Economy: a paid take spends the take cost, a Herbs take spends nothing, and a take without the coins changes nothing. A cleared blocker gives the blocker coin. Each menu price equals the formula. The recovery quest opens below the floor while a quest is open, and when no quest is open and the purse cannot pay the next preparation. It closes when neither case is true. It shows on the fourth ticket and moves no quest to waiting: with three quest tickets and only the third deliverable, the third stays deliverable. With four free cells and queued blockers, one Linden tea can be made from scratch and delivered. Ana's campaign quests open and close in their order whether the recovery quest is open or not, and a save that lists the recovery quest as delivered is rejected.
- Save: a new game, reload, export, and import in the current format. An earlier save is not read, and an import of an earlier save is rejected.
- Browser: a mixed merge by tap, by drag, and by keyboard. The recipe book, the item dialog, the guide, and "Find a match" for a mixed dish. Phone and desktop in both themes.

## Quests and interface

- The quest requirements are in `tools/create-original-data.ts`. The work value of the quests in each window pays for the next preparation, with enough coins for daily upkeep and the staples of the supper under the efficient strategy of spec 013.
- A new game has no coins. The first quest of Mara asks only for free herbs. The early quests also ask for Linden tea and socată, which need no paid staple, so the purse has the coins for the staples of the next quests.
- Selection marks each dish and each blocked space that the selected dish merges with, with the same dotted mark as a matching pair.
- The recipe book has one section for each chain, in chain order, and then one section for the mixed dishes. The item dialog of a mixed dish shows its two parts. The item dialog of a part names the mixed dishes that it makes.
- A paid source shows its take cost on its tile: a coin mark and the figure. The Herb basket shows none.
- A cleared blocker adds the blocker coin to the merge notice, and the purse shows the gain.
- The recovery ticket is a fourth column of the ticket row, with a dashed edge.
- A ticket with more than four dishes, such as the supper, shows its first three dishes and the count of the others. Its dialog lists each plate with the name of its guest. Serve takes the place of Deliver.
