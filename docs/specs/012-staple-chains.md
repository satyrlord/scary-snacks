# 012: Staple chains and mixed dishes

Status: Implemented.

## Outcome and scope

The chains follow real staple foods. Each chain is one food family. Each chain starts with one stage-1 ingredient. The later dishes of a chain use only foods of its family. For example, the Vegetables chain starts with Potatoes. A later dish of that chain is a basket of other vegetables.
A mixed dish uses dishes from two or three chains. The player cannot cook a mixed dish without progress in each of its chains.
Each dish records what it contains. The data check uses these records to enforce the diet of each character.

The game has 12 chains, 61 chain dishes, 24 mixed dishes, and 12 sources.
The recovery quest has a fourth ticket, and the preparation blockers keep four cells free.

## Implementation scope

These parts implement the feature:

- the merge rule in `src/engine.ts` and the merge queries in `src/model.ts`, for the mixed merge;
- the content checks in `src/content.ts`, for the chain lengths, the recipes, the diets, and the favourite dishes;
- the save format and its supported item IDs;
- the item requirements of all quests, of the initial board, of the blocker layout, and of the preparation batches;
- the quest and story text that names a dish, and the preparation scenes that open a source;
- the recipe book, the item dialog, the guide, "Find a match", and the blocker help;
- the menu art: one picture for each dish and each source;
- the economy: paid takes, blocker coins, formula prices, a recovery quest, and a balance band;
- the economy record and the campaign balance test.

`PRODUCT.md` owns the rules for takes, income, the supper, the recovery quest, blockers, tickets, and campaign balance.
The game has 83 quests, including Ana's recovery quest.
Takes are immediate. The game has no energy limit and no waiting.

## The chains

The game has 12 chains. A chain has from four to six dishes. Each chain has one source, and the source gives the stage-1 ingredient.
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
The scene of each preparation that opens a chain names its new source.

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

A recipe can use a mixed dish as a part only if two chain dishes make that mixed dish. So recipes nest one level deep. A mixed dish can be a part of more than one recipe. For example, Sweet dough is a part of Cozonac and of Chimney cake. A mixed dish uses at most three chains.
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
For example, a drop of Telemea on a blocked Mămăligă clears the blocker and leaves Bulz in that cell.
The blocker help names the blocked dish and each recipe partner that the player has made. The help also marks each movable match. The help does not name a partner that the player has not made.

## Cathedral supply quests

A cathedral supply quest has one of two sizes:

- provisions: 12 to 16 portions of chain dishes of stage 3 or higher;
- meals: 4 to 6 portions of mixed dishes.

## Contents and diets

Each dish records its contents as tags: `meat`, `pork`, `dairy`, `egg`, `fish`, `alcohol`, and `garlic`.
Poultry meat counts as `meat`. Eggs count only as `egg`.
A mixed dish has every tag of its parts. A mixed dish can also add a tag of its own.

| Tag | Chain dishes | Added by a mixed dish |
| --- | --- | --- |
| `meat` | all Veal, Pork, and Lamb dishes; Chicken, Chicken broth, Roast chicken | |
| `pork` | all Pork dishes | |
| `dairy` | all Dairy dishes | |
| `egg` | Eggs | |
| `fish` | all Fish dishes | |
| `alcohol` | Red wine, Plum brandy | |
| `garlic` | Sausages, Bean dip, Lamb stew, Saramură | Mici, Drob |

A character can have a diet. A diet can forbid tags. A diet can also require dishes in each quest of the character. The game does not show the diet or the tags. The data check enforces the diets.

| Character | Diet | Rule |
| --- | --- | --- |
| Mina | Vegetarian | No dish with `meat` or `fish`. |
| Vlad, Elisabeta | Red wine and meat, no garlic | Each quest has Red wine and a dish with `meat`. No dish with `garlic`. |
| Cătălina | Orthodox fast, fish allowed | No dish with `meat`, `dairy`, or `egg`. |
| Avram | Kosher-style | No dish with `pork`. No quest with both `meat` and `dairy`. |

The data check rejects a quest that breaks the diet of a character of that quest.
For a shared quest, each character of the quest must accept each dish.

## The supper

Mara's supper quest, "The community supper", opens after preparation 24. The quest asks for one plate for each of the 11 guests. The quest has no coin cost.
Each plate suits the diet of its guest. Each regular gets a favourite dish. Together, the plates use all 12 chains.
The delivery pays no reward and queues the finale. After the delivery, the courtyard shows the supper painting.

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
- `src/model.ts` gives the merge result of two items.
  The result is the next dish of the chain, the dish of a recipe, or none.
- `src/engine.ts` applies a mixed merge in one change. A failed merge changes nothing.
- `src/content.ts` checks each chain, each recipe, the recipe depth, and the tags.
  The module also checks each diet, each favourite, and the opening of each quest dish.
- [Shared save compatibility](README.md#shared-save-compatibility) gives the supported format. The game does not read or convert an earlier format. If no current save exists, the player starts a new game.
- "Show me on the board" for a mixed dish guides toward the missing part with the fewest steps.

## Art

The food art is one consistent set of 16 atlases: 85 dishes and 12 sources.

- Each chain has one atlas. The atlas holds the source and the dishes of the chain, in stage order.
- Four atlases hold the 24 mixed dishes:
  - soups and stews: Meatball soup, Chicken noodle soup, Fish soup, Bean soup, Bean soup in a bread bowl, Goulash pot, Beans with sausages, Tochitură;
  - mains: Bulz, Cabbage rolls, Cabbage rolls with mămăligă, Stuffed peppers, Mici, Drob, Saramură with mămăligă;
  - sweets: Sweet dough, Cozonac, Chimney cake, Papanași, Plum dumplings;
  - breads, boards, and drinks: Cheese pie, Zacuscă toast, Sharing board, Fruit tea.
- Each atlas is a 2048 by 1024 pixel grid of 4 columns and 2 rows of equal cells. Each picture stays inside its cell with a clear margin. Unused cells are transparent. The code finds a picture from its atlas and its cell, with no measured bounds.
- Each picture has one cue that makes the picture different from similar foods. For example, Flour is an open paper sack of fine white powder with an ear of wheat. The Flour picture shows no grains. The Windmill is a small wooden village windmill. A tied flour sack and ears of wheat are at its door. The bistro buys its grain there.
- Each picture has hard, clean edges and a fully transparent background. No picture has a glow, a halo, a haze, or a soft fringe. The review measures the ratio of soft pixels (alpha from 8 to 127) to solid pixels. The review rejects a visible fringe.
- Each atlas uses the same painted style.
- Each atlas has records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.
- The review examines each picture at the board-tile size on a phone, in both themes. The reviewer names each picture before the reviewer reads its prompt. The review rejects a picture that gets the wrong name. The user accepts each atlas.

## Economy

The player cooks with a plan. Coins pay for ingredients, and quests pay for the work of the cook.

### Levers and prices

`PRODUCT.md` gives the four levers of the economy and the formula of the menu price. The levers are the take cost, the blocker coin, the work rate, and the recovery floor. The [economy record](../economy.md) gives the price of each dish and the evidence for the levers.

### Takes

A take from the Herbs source is free at all times.
A take from each other source spends the take cost.
A take needs the coins and a free cell. A failed take spends nothing.
If the purse holds less than the take cost, a paid source takes nothing, and Mara says why.

### Blockers

Each cleared blocker gives the blocker coin, in the same change as the merge.
The rule includes the eight blockers of a new game and each preparation blocker.

### Rewards

Every quest except the supper pays its menu value. The supper pays nothing. No quest has a reward multiplier.
So every delivery earns at least the work rate for each merge, and no delivery loses coins.
The preparation costs keep their work estimates in lei-equivalent coins.

### Recovery quest

Ana's "Tea for the night ward" asks for one Linden tea. The recovery quest is the only recurring quest.
The recovery quest is open in each of these cases:

- the campaign has an open quest, and the purse holds less than the recovery floor;
- the campaign has no open quest, and the purse holds less than the cost of the next preparation.

The recovery quest closes when neither case is true. The recovery quest opens again each time a case becomes true.
So a player who spends coins on spare food can always continue to the next preparation. The player repays the shortfall with tea. At the starting levers, one Linden tea pays 14 coins. The tea can pay for spare takes and daily upkeep.
While the recovery quest is open, the quest has its own ticket after the three quest tickets. The recovery quest never moves a quest to waiting.
A recovery delivery pays its menu value. The delivery records nothing, queues no scene, and has no journal entry.
The recovery quest is outside the order of Ana's quests. The recovery quest needs no earlier Ana quest, and no Ana quest needs the recovery quest. The recovery quest and an Ana campaign quest can be open at the same time. Save validation rejects the recovery quest in the delivered quests.

To cook one Linden tea from Elderflowers, the player needs four free cells. Three cells hold the stages 1 to 3 while a fourth cell takes the next Elderflowers.
So the preparation blockers keep at least four cells free. The other preparation blockers wait in preparation order.
A board that the player fills with dishes that cannot merge and that no quest needs stays full.

### Balance check

The campaign balance test plays one efficient strategy with no injected coins or items.
The test pays all 24 preparations and delivers the supper.
The strategy spends coins on preparations, takes, and upkeep. After the supper, the purse must hold from 0 to 20% of those coins.
The test prints the purse, the takes, the coins from blockers, and the free cells at each preparation.

## Acceptance checks

- Content: each chain is complete. Each recipe has two parts and one result. No pair has two results. A mixed dish can be a part of two recipes. The check rejects a recipe if one of its parts is a mixed dish that uses another mixed dish. No dish uses more than three chains. No quest breaks a diet. No quest asks for a dish before its chains open. Each quest of a regular has a favourite dish. Each cathedral supply quest has one of the two sizes.
- Engine: the tests cover a chain merge, a mixed merge in both directions, and a three-chain dish from ingredients. Other tests cover a blocker that a recipe partner clears, a refused pair, and a failed merge that changes nothing.
- Supper: each plate suits its guest, and each regular gets a favourite. The plates use all 12 chains, and the delivery queues the finale once.
- Campaign: the campaign balance test pays all 24 preparations and delivers the supper with no injected coins or items. The purse after the supper is inside the balance band. The test records the free cells at each preparation and each deadlock. Another check starts from the state before each preparation. The check buys one spare ingredient, so the purse cannot pay. The check then cooks Linden tea from free herbs and reaches the preparation through the recovery quest.
- Economy: a paid take spends the take cost, and a Herbs take spends nothing. A take without the coins changes nothing. A cleared blocker gives the blocker coin. Each menu price equals the formula. The recovery quest opens if the purse is below the floor while a quest is open. The recovery quest also opens if no quest is open and the purse cannot pay the next preparation. The recovery quest closes when neither case is true. The recovery quest shows on the fourth ticket and moves no quest to waiting. A test has three quest tickets, and only the third quest is deliverable. The third quest stays deliverable. With four free cells and queued blockers, the player can cook one Linden tea from Elderflowers and deliver it. Ana's campaign quests open and close in their order, with or without an open recovery quest. Save validation rejects a save that lists the recovery quest as delivered.
- Save: a new game, reload, export, and import in the current format. The game does not read an earlier save. Import rejects an earlier save.
- Browser: a mixed merge by tap, by drag, and by keyboard. The recipe book, the item dialog, the guide, and "Find a match" for a mixed dish. Phone and desktop in both themes.

## Quests and interface

- The quest requirements are in `tools/create-original-data.ts`. The work value of the quests in each window pays for the next preparation. The quests also give enough coins for daily upkeep and the ingredients of the supper. These figures use the efficient strategy of spec 013.
- A new game has no coins. The first quest of Mara asks only for free herbs. The early quests also ask for Linden tea and socată, which need no paid ingredient. As a result, the purse has the coins for the ingredients of the next quests.
- The game marks each dish and each blocked space that merges with the selected dish. The mark is the dotted mark of a matching pair.
- The recipe book has one section for each chain, in chain order, and then one section for the mixed dishes. The item dialog of a mixed dish shows its two parts. The item dialog of a part names the mixed dishes that it makes.
- A paid source shows its take cost on its tile: a coin mark and the figure. The Herb basket shows no take cost.
- A cleared blocker adds the blocker coin to the merge notice, and the purse shows the gain.
- The recovery ticket is a fourth column of the ticket row, with a dashed edge.
- A ticket with more than four dishes shows its first three dishes and the count of the others. The supper ticket is an example. The supper dialog lists each plate with the name of its guest. Serve replaces Deliver.
