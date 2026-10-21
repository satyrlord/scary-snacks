# 017: Seasons and holidays

Status: Proposed.

## Outcome and scope

The calendar of spec 015 has seasons, weather, and holidays.
The prologue happens in winter. Act 1 starts at the end of winter and ends in spring.
The village keeps the Orthodox holidays, the Catholic and Reformed customs of the Hungarian neighbours, the customs of the Saxons, and old folk beliefs.
A holiday brings a quest with a traditional dish. The season changes the produce, the courtyard, and the look of the room.

A season never stops play. A holiday quest has no deadline. Weather never removes an item or coins.
The tone stays cosy and slightly eerie. The witches of Saint George's Eve and the Blajini are folklore, not threats.

The feature covers these parts:

- the seasons and the authored weather of each date;
- the holidays of act 1 and the holiday quests;
- Lent and the fasting diets;
- the seasonal sources and their chains;
- the courtyard by season, and the outdoor quests;
- the seasonal look of the room, the rain, the snow, and the holiday decorations;
- the seasonal repeating quests;
- the season fit of the current quests;
- the art, the content checks, and the balance test.

The feature does not include these parts:

- random weather;
- a setback, a loss of items, or a loss of coins from weather;
- the summer and autumn content of acts 2 and 3.

## Seasons

The game uses the seasons of the weather calendar:

| Season | Months |
| --- | --- |
| Winter | December, January, February |
| Spring | March, April, May |
| Summer | June, July, August |
| Autumn | September, October, November |

The prologue happens in winter. Act 1 has 14 days of winter and 62 days of spring.
1 March is the first day of spring, as in the folk calendar of Mărțișor.

## Weather

The game data gives the weather of each date of the prologue and act 1. The weather is fair, rain, or snow.
The weather is authored, so the weather is the same in each save. The weather does not use the random seed.

The data check enforces these rules:

- Snow occurs only before 15 March.
- Rain occurs on at most two days in a row from 1 April.
- Each holiday of the table below has fair weather, except the authored snow of the prologue.
- 1 May has fair weather.

## Holidays

A holiday is a date with a custom of the village. Some holidays have a holiday quest. The update-game-content skill writes the quests.

| Date | Holiday | Custom | Holiday quest |
| --- | --- | --- | --- |
| Monday 24 February | Dragobete | The Romanian day of lovers. The birds choose their mates. | Victor asks for a sweet for two. He does not say who the second person is. |
| 1 to 9 March | Mărțișor and the days of Baba Dochia | Red and white strings welcome the spring. Baba Dochia takes off one of her nine sheepskins on each day. | Dochia's quests "One sheepskin fewer" and "The last cold week" fit these days. |
| Sunday 2 March | Carnival Sunday | The last feast before Lent: Lăsata secului, the Hungarian farsang, and the masks of the Saxon carnival | Eszter asks for carnival doughnuts and a big meal before the fast. |
| Saturday 8 March | Women's Day | Men give flowers and sweets. | Sorin takes a sweet to each woman on his round. |
| Sunday 9 March | The Forty Martyrs (Mucenici) | Sweet pastries in the shape of an eight. The custom gives forty small glasses of wine to the men. | Costel asks for mucenici. His clock counts the glasses. |
| Tuesday 25 March | The Annunciation (Buna Vestire) | The first fish day of Lent. The cuckoo sings for the first time. | Cătălina asks for a fish meal. |
| Sunday 13 April | Palm Sunday (Florii) | The church blesses willow catkins. Fish is permitted. | Sânziana sells catkins at the church gate and asks for fish. |
| Thursday 17 April | Holy Thursday (Joia Mare) | The families dye eggs red. Joimărița visits the girls who did not finish their spinning. | Ileana's quest "Before Thursday" fits this day. |
| Saturday 19 April | Holy Saturday | The families take baskets of Easter food to the church for the blessing at midnight. | The core characters share one quest: the Easter baskets. |
| Sunday 20 April | Easter Sunday | The fast ends with lamb, red eggs, pască, and cozonac. | Mara asks for the Easter lunch of the staff. |
| Monday 21 April | Easter Monday | In the Hungarian custom of sprinkling (locsolás), young men sprinkle scent on young women and get red eggs. | Eszter asks for red eggs and chimney cakes for the young men at her door. |
| 22 and 23 April | Saint George's Eve and Saint George (Sângeorz) | On the eve, witches and strigoi walk. Families put green branches on the gates and garlic on the doors. Hidden treasures burn with blue flames. | Ana's quest "Garlic duty" fits the eve. |
| Monday 28 April | The Easter of the Blajini | Eggshells float down the river to tell the Blajini, the gentle little people at the edge of the world, that Easter came. Families take food to the graves. | Bela asks for food for the graves. |
| Wednesday 30 April | Walpurgis Night and the eve of Arminden | The Saxons tell of witches on this night. Green branches go up for May Day. | None. The hold of spec 015 applies. |
| Thursday 1 May | Arminden | The May Day feast | The community supper |

The prologue events of spec 016 are the holidays of the winter.

Saint George's Eve, Tuesday 22 April, has no evening guest. Garlic hangs on every door that night, and Vlad and Elisabeta stay away.
The rule of the Sunday in spec 015 applies: the game fixes no evening guest, and each booked ticket shows "Booked for another evening".
The opening of a booked quest can mention the garlic.

### Holiday quests

A holiday quest is a campaign quest with a holiday date. The rules of campaign quests apply.

- The opening date of spec 015 is at most three days before the holiday date. So the player can cook the meal before the holiday.
- Before the holiday date, the ticket shows the holiday and its date. For example: "For Easter, Sunday 20 April".
  The quest has work only while a portion is missing from the board, as a booked quest for another evening.
- Deliver works from the opening time of the holiday date.
- After the holiday date, the quest stays open. The ticket shows "Late for Easter". Deliver works, and the reward is the same.
- The completion scene is the same on the holiday and after the holiday.
- A holiday quest that opens after its holiday date shows "Late for [holiday]" immediately.

A holiday quest pays its menu value, as other campaign quests. A holiday gives no extra reward.

### New dishes

The holidays need these dishes: colivă, ritual bread rings (colaci), mucenici, pască, red eggs, carnival doughnuts, and Christmas Eve wafers (turte).
Each new dish is a mixed dish of spec 012 or a dish of a seasonal chain. The update-game-content skill authors the recipes.
Existing dishes cover the other holiday meals: cabbage rolls, sausages, cozonac, drob, roast lamb, chimney cake, and red wine.

## Lent

The Great Lent of year 1 is from Monday 3 March to Saturday 19 April.
During Lent, a character who keeps the fast eats no meat, dairy, egg, or fish. Fish is permitted on 25 March and on 13 April.
Wine is permitted.
Cătălina keeps the Orthodox fast all year. During Lent, her fish days are only the two days above.
Ilie keeps Lent, as the habits of his family tell him.
Only Cătălina and Ilie keep Lent. The other characters eat by their usual diets.

The Fish source opens with preparation 12, at the end of chapter 3. So the Fish chain is open before the fish day of 25 March.
Preparation 20 opens no source. The scene of preparation 12 names the Fish source.

The data check uses the date range of each quest. A quest of a character who keeps the fast obeys the Lent diet if its date range touches Lent.
The date range starts on the opening date of the quest, or else on the opening date of its chapter. The range ends on the day before the opening date of the next chapter.

## Seasonal sources

A seasonal source is a source that is on the board only in its season.

| Source | Season | Chain | Candidate dishes |
| --- | --- | --- | --- |
| The pickle barrel | 1 December to 20 March | Preserved vegetables | Gherkins, pickled green tomatoes (gogonele), pickled peppers, and mixed pickles |
| The forage basket | 21 March to 31 May | Spring greens | Nettles, wild garlic (leurdă), sorrel, nettle soup, and a pie of spring greens |

The chains follow the rules of spec 012. No dish of a seasonal chain has the name of a dish of another chain.
A dish with wild garlic has the garlic tag.

A take from a seasonal source is free, as a take from the Herb basket. Its ingredient counts as zero in the menu price.
The pickle barrel holds the stores of the grandmother's cellar. The forage basket holds the greens of the hill.

### Placement and departure

At the opening time of the first day of its season, the seasonal source takes the first free cell in board order.
The placement keeps at least four free cells, as for blockers. If the board has too few free cells, the source waits.
Each successful move, take, delivery, and payment tries the placement again.
In act 1, the pickle barrel is on the initial board of 15 February.

The closing of the last day of its season removes the seasonal source from the board. Its cell becomes free.
The dishes of its chain stay on the board.
A slow player can still need the source after its season. So the source stays while an undelivered campaign quest asks for a dish of its chain.
The source then leaves at the first closing after the delivery of the last such quest.
The closing toast of spec 015 says that the source left. On a Sunday night, the morning dialog says it. For example: "The pickle barrel is empty until next winter."

A seasonal source is not a chain of Șoricescu's gifts.
The stage-1 dish of a seasonal chain is a loose raw ingredient, so the thief rat can take the dish.

### Content rules

A quest asks for a dish of a seasonal chain only if the date range of the quest is inside the season of that chain.
The date range is the range of the Lent check.
A seasonal repeating quest joins the cycle only while its source is on the board.
The supper can ask for a dish of the forage basket, because the forage basket is in season on 1 May.

## Courtyard by season

The terrace season is from 1 April to 31 October. A terrace day is a date in the terrace season with fair weather.
The courtyard seats guests only on a terrace day, after the preparation "Clear the courtyard".

An outdoor quest is a quest that the game data marks as outdoor.
Deliver on an outdoor quest works only on a terrace day.
On another day, the ticket shows "Waits for fair weather". The quest has work only while a portion is missing from the board.

In act 1, the outdoor quests are Ilie's "Bread for outside", Sorin's "A courtyard break", and the community supper.
The data check enforces that 1 May is a terrace day.

## Seasonal look of the room

### Window views

By day, the upper panes of the front-room window show a view of the season, as the night sky shows the night.
The view uses the clip of the night sky. The night sky replaces the view at night.

| View | Dates |
| --- | --- |
| Late winter: snow on the roofs | Until 9 March |
| Early spring: thaw, bare trees, and the first green | 10 March to 5 April |
| Spring: blossom on the trees | From 6 April |

The broken window of the first front-room state shows no view. The courtyard shows the spring of its painting.

### Rain and snow

On a rain day, rain falls over the courtyard, and drops run down the window glass of the front room.
On a snow day, snow falls over the courtyard and outside the window glass.
In the prologue, snow falls outside the window of the family kitchen.
The code draws the rain and the snow. The rain and the snow are not bitmap art.
With reduced motion, the rain and the snow show as still marks. They do not move.
The rain and the snow never cover the board, the tickets, or the food art.

### Holiday decorations

A holiday decoration is a small transparent picture in an authored region of the room. The decoration shows in its dates.

| Decoration | Area | Dates |
| --- | --- | --- |
| A mărțișor on the door handle | Front room | 1 to 9 March |
| Willow catkins in a jar | Front room | 13 to 19 April |
| A bowl of red eggs on the counter | Front room | 17 to 27 April |
| Green branches at the gate | Courtyard | 22 April to 1 May |

Each decoration region shows above the drawer at the phone size, as for the finishes.
A decoration does not change the room state, the progress, or the rewards.

## Seasonal repeating quests

A repeating quest of spec 014 can have a season. The quest joins the cycle only in its season.
For example, a fasting meal joins the cycle only during Lent, and a nettle soup joins the cycle only in the season of the forage basket.
The data check enforces the diets and the seasonal chains of each seasonal repeating quest.

## Season fit of the current quests

Each quest fits the season of its dates. Its text and its dishes do not name a custom, a crop, or weather of another season.
These current quests do not fit act 1. A later change moves them to act 2 or act 3:

| Quest | Season of the quest | Target act |
| --- | --- | --- |
| Sânziana, "Midsummer Eve" | Summer, 23 June | Act 2 |
| Sânziana, "A picnic in the meadow" | Summer | Act 2 |
| Dochia, "Shearing day" | Late spring or summer | Act 2 |
| Cătălina, "Bell-ringer's appetite" (hail) | Summer | Act 2 |
| Ilie, "Jars for winter" | Autumn | Act 3 |
| Bran, "The pumpkin fair" | Autumn | Act 3 |
| Dochia, "The sheep fair" | Autumn | Act 3 |
| Ana, "Saint Andrew's Eve" | 29 November | Act 3 |
| Cezar, "The longest night" | 21 December | Act 3 |

Each move changes the prerequisites of a preparation. Cezar's "Before the rounds" joins the cycle after "The longest night", so its join rule also changes.

## Levers

`PRODUCT.md` gives the values of these levers:

- the season of each seasonal source;
- the terrace season;
- the dates of each window view and each holiday decoration.

## Data and state

- `tools/create-original-data.ts` authors the weather, the holidays, the holiday quests, the seasonal sources and chains, the outdoor quests, and the decorations.
- `src/model.ts` gives the season, the weather, and the holiday of a date. The module also gives the ticket text of a holiday quest and an outdoor quest.
- `src/engine.ts` places and removes the seasonal sources. The module applies the holiday dates and the terrace days to Deliver.
- `src/content.ts` checks the weather rules, the Lent diets, the seasonal chains of each quest, the holiday dates, and the outdoor quests.
- The feature adds no saved field. The date of spec 015 gives the season, the weather, and the holiday. The board holds the seasonal sources.
- The implementation changes the game state version and the envelope version. The game does not read a save of an earlier version.
- Save validation rejects a seasonal source on the board outside its season, unless an undelivered campaign quest needs its chain.

## Owner contracts

`PRODUCT.md` controls the seasons, the weather, the holidays, Lent, the seasonal sources, the terrace days, and the season fit.
`DESIGN.md` controls the holiday tickets, the outdoor tickets, the window views, the rain, the snow, and the holiday decorations.
The Untouched Plate Rule applies: the rain, the snow, and the decorations never change the colours of food, portraits, or timber.

## Art

Each picture follows the art rules of the existing masters. Each picture has records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.

- Two food atlases: the pickle barrel with its chain, and the forage basket with its chain.
- The new holiday dishes in a mixed-dish atlas.
- Three window views for the upper panes of the front-room window.
- One sheet of the four holiday decorations.
- One scene illustration for the shared quest of the Easter baskets.

The food art has no glow and no halo. The review measures the soft fringe of the alpha before the user sees an atlas.
The review examines each picture at its game size on a phone, in both themes. The user accepts each picture.

## Balance check

The campaign balance test of spec 015 includes the holiday quests, the seasonal sources, and the terrace days.
For each seed, the test must show these results:

- The efficient strategy delivers each holiday quest on its holiday date.
- An outdoor quest never waits for more than two days for fair weather.
- The free takes of the seasonal sources keep the purse after the supper inside the balance band.

## Acceptance checks

- Weather: the weather of each date comes from the data. The data check rejects snow from 15 March, three rain days in a row from 1 April, and rain on 1 May.
- Holiday quest: before the holiday, the ticket shows "For [holiday], [date]", and Deliver does not work.
  On the holiday, Deliver works from the opening time. After the holiday, the ticket shows "Late for [holiday]", and Deliver gives the same reward.
- Lent: the data check rejects a quest of a fasting character with meat, dairy, egg, or fish if the quest can open during Lent. The check accepts fish on 25 March and on 13 April.
- Seasonal source: the source takes the first free cell on the first day of its season and keeps four cells free.
  With too few free cells, the source waits and appears after a later action. The closing of the last day of the season removes the source and keeps its dishes.
  An undelivered campaign quest that needs the chain keeps the source after its season.
- Free take: a take from a seasonal source spends no coins.
- Seasonal chains: the data check rejects a quest that asks for a dish of a seasonal chain outside its season.
- Terrace: an outdoor quest delivers only on a terrace day. On another day, the ticket shows "Waits for fair weather".
- Saint George's Eve: 22 April has no evening guest. Each booked ticket shows "Booked for another evening".
- Room: the window view changes on its dates and gives way to the night sky at night. A holiday decoration shows only in its dates.
  Rain and snow show on their days and do not move with reduced motion.
- Save: a save outside the season of a seasonal source fails validation if the source is on the board and no undelivered campaign quest needs its chain.
- Browser: the tests cover a holiday ticket before, on, and after its holiday, an outdoor ticket on a rain day, the placement of a seasonal source, a window view, rain, snow, and a decoration. Phone and desktop in both themes. Reduced motion.

## Open decisions

- The two new chains. Each chain needs the approval of the user before its art.
