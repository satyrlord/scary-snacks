# 015: Calendar and act 1 dates

Status: Implemented, with spec 017.

## Outcome and scope

The game has a calendar. Each play day has a date, and the story happens on fixed dates.
Mara's grandmother dies on Friday 20 December of game year 0. The prologue of spec 016 runs from that day to Thursday 13 February of game year 1.
Mara leaves the city on 13 February. Act 1 starts on Saturday 15 February and ends with the community supper on Thursday 1 May of game year 1.

Each date of act 1 is a play day. The bistro opens every day. On Sunday, the bistro opens later and closes earlier.
The calendar paces the story: each chapter opens on a date. Inside a chapter, the player sets the pace.
The supper is fixed on 1 May. The calendar never passes 1 May in act 1.

The clock still counts merges, never seconds. The game has no timers and no waiting. Nothing changes while the game is not open.
A quest still has no deadline.

The feature covers these parts:

- the game calendar, its weekdays, and the date on the masthead;
- the dates of the prologue and of act 1;
- the opening hours of a weekday and of a Sunday;
- the rats on Sunday night only;
- the opening date of each chapter;
- the quests that open on a date;
- the supper on 1 May, and the hold of the calendar before the supper;
- the size of the day and the content that fills 76 days;
- the act 1 quest plan: the new, changed, and moved quests;
- the act 1 result, the content checks, and the campaign balance test.

The feature does not include these parts:

- the prologue (016);
- acts 2 and 3;
- a market day or another rule for a weekday other than Sunday.

Spec 017 gives the seasons, the weather, Lent, the holidays, and the seasonal sources.
The quest plan of this spec needs those rules, and spec 017 needs the calendar. So specs 015 and 017 ship together in one change, with one save version.
The acceptance checks of both specs apply to that change.

## The game calendar

The calendar follows the Gregorian calendar. The years have the names "year 0" and "year 1". The game never shows a real year.
Year 1 has 365 days and starts on a Wednesday. So 15 February of year 1 is a Saturday, and 1 May is a Thursday.
In year 1, the Orthodox Easter and the Western Easter are on the same day: Sunday 20 April. Spec 017 uses this date for the movable holidays.

| Date | Weekday | Event |
| --- | --- | --- |
| 20 December, year 0 | Friday | Mara's grandmother dies. |
| 23 December, year 0, to 13 February, year 1 | Different weekdays | The prologue events of spec 016. |
| 13 February, year 1 | Thursday | Mara leaves the city. |
| 14 February, year 1 | Friday | Mara travels. The day has no play. |
| 15 February, year 1 | Saturday | Act 1 starts. |
| 1 May, year 1 | Thursday | The community supper ends act 1. |

Act 1 has 76 dates, from 15 February to 1 May. The dates include 11 Sundays.

## The date on the masthead

The date replaces the day number. The masthead shows the short weekday, the day, the short month, and the time.
For example: "Sat 15 Feb · 07:00".
The accessible name gives the full weekday, the day, the full month, and the time. For example: "Saturday 15 February, 07:00".
The phone layout keeps its two rows: the date is above the time.

The saved day number gives the date. Day 1 is 15 February. The feature adds no saved field for the date.

## Opening hours

The bistro opens every day of act 1. Each date is a play day.

| Days | Opening time | Closing time | Booking time |
| --- | --- | --- | --- |
| Monday to Saturday | 07:00 | 22:00 | 20:00 |
| Sunday | 10:00 | 17:00 | No booking |

The closing of spec 013 applies on each day. After the closing of a Saturday, the clock shows 10:00 on Sunday.
After the closing of a Sunday, the clock shows 07:00 on Monday.
A Sunday holds fewer merges than a weekday. The upkeep of a Sunday is the same as the upkeep of a weekday.

A Sunday has no evening guest. The booking time is after the Sunday closing time.
So on a Sunday, the game fixes no evening guest. Each booked ticket shows "Booked for another evening".
The rules of spec 013 choose the evening guest again at 07:00 on Monday.

## Nights

Act 1 has 75 closings, from 15 February to 30 April. 1 May never closes, because the supper stops the clock.
The rats come only on Sunday night, so the night stays an event.

- After the closing of a Sunday, the night of spec 013 applies in full: the thief rat or Șoricescu, the closing dialog, the night sequence, and the morning dialog.
- After each other closing, the purse pays the upkeep, and the next day starts. No rat comes, and no dialog opens.
  A toast reports the upkeep and the new date. For example: "The bistro closed for the night. Upkeep: 20 coins. Good morning, Tuesday 18 February."
  The toast is the temporary notice of `DESIGN.md`, as for a delivery. The toast is not a modal dialog.
  The toast does not stop play, does not take focus, and needs no action. The toast leaves by itself after the usual time.
- On a Sunday night, the thief rat looks at the loose raw ingredients at the Sunday closing.
- Only a Sunday night with the thief rat uses and advances the random seed.
- The night report records each closing. The report of a closing without rats has no rat and no morning dialog.

Act 1 has 11 Sunday nights. So the count of rat visits stays near the count of nights in the campaign of spec 013, and the gifts of Șoricescu do not fill the board.

## The size of the day

The merge time sets the number of merges in a day. The merge time is a lever.
The days of act 1 are fixed, so the merge time sets the work that act 1 needs.

The merge time is 15 minutes. A weekday holds 60 merges, and a Sunday holds 28 merges.
The lantern control shortens a day when the player lights the lanterns before 20:00.
The largest provisions do not fit in one day.
So the data check applies the one-day limit only to meals. Provisions and the supper can take more than one day.

## Chapter dates

Each chapter has an opening date. The first preparation of a chapter can have a payment only from the opening date of its chapter.
The quests of the earlier chapter can open and get their deliveries before the opening date.
If the bistro has no other work before the opening date, the repeating quests of spec 014 give the work.

| Chapter | Opening date | Days | Preparations |
| --- | --- | ---: | --- |
| 1 | Saturday 15 February | 12 | 1 to 4 |
| 2 | Thursday 27 February | 14 | 5 to 8 |
| 3 | Thursday 13 March | 14 | 9 to 12 |
| 4 | Thursday 27 March | 13 | 13 to 16 |
| 5 | Wednesday 9 April | 11 | 17 to 20 |
| 6 | Sunday 20 April | 11 | 21 to 24 |
| Supper | Thursday 1 May | 1 | None |

Before the opening date, the requirement list of Story shows the date. For example: "Opens on Thursday 27 February".
That line replaces "Ready to prepare." while the player meets the other requirements.
A failed payment before the opening date changes nothing.

## Dated quests

A campaign quest can have an opening date.
The quest opens after its preparation and its earlier quests, and not before 07:00 on its opening date. On a Sunday, the quest opens at 10:00.
A quest without an opening date opens by the current rules.
Spec 017 uses opening dates for the holiday quests and for the March quests of Dochia.
A March quest is the only quest that is not necessary for a preparation or for the supper. Spec 017 gives its rules.

The ticket rule does not change: the first three open quests in authored order get the tickets.
So a dated quest that opens can take the ticket of an open quest that comes later in authored order. That quest then waits, and its dishes stay on the board.
The repeating quest already follows this rule.
The data authors each dated quest first among the quests that open after its preparation, except a booked quest, which stays last.
Mara's "Three months" is another exception. It comes after her other quests in the same preparation window, so it does not hold up her line.
So a holiday quest gets its ticket before the holiday, and the player can cook ahead.

## The supper on 1 May

The supper quest opens after preparation 24, as before. Its ticket shows "Booked for 1 May".
The player can cook the plates on earlier days. The supper quest has work only while a plate is missing from the board, as a booked quest for another evening.
On 1 May, the ticket shows "Booked for 20:00". Serve works from 20:00. Before 20:00, the lantern control "Light the lanterns" replaces Serve.
The lantern control works when the board holds every plate.
1 May has no evening guest for Vlad or Elisabeta.

## The hold before the supper

The calendar never passes 1 May in act 1. Two days hold:

- 30 April holds until the payment of preparation 24.
- 1 May holds until the supper.

On a day that holds, a merge that reaches the closing time does not close the day. The clock stays one merge time before the closing.
Later merges do not move the clock. The day has no upkeep and no night while the day holds.

A booked guest must not block the hold. While 30 April holds, each booked delivery ends the evening of its guest.
Then the game fixes the evening guest again at once, by the rules of spec 013. Deliver works again for the new evening guest, because the clock is after 20:00.
So the player can deliver every booked quest that remains, one after the other, during the hold.
Spec 017 makes 30 April and 1 May terrace days, so an outdoor quest also never blocks the hold.
On 30 April, the payment of preparation 24 while the day holds closes the day in the same change. The closing then applies as in spec 013, and 1 May starts.
On 1 May, Serve on the supper stops the clock, as before.

While 30 April holds, Mara's line says "Walpurgis Night lasts until the bistro is ready."
While 1 May holds, Mara's line says "The village waits for the supper."
The campaign balance test checks that the efficient strategy never needs the hold.

## Content that fills act 1

Act 1 needs more quests to fill 76 days. The repeating quests fill only the gaps.

- The holiday quests of spec 017 add a quest on each holiday.
- New campaign quests fill the chapters that have few holidays.
- More repeating quests join the cycle of spec 014, so that the gap days do not repeat one meal.
- Seasonal repeating quests of spec 017 join the cycle only in their season.

The repeating quests fill at most 20% of the merges of act 1.
Act 1 has 89 campaign quests, five March quests, and the supper quest.
The cycle has seven repeating quests, including the seasonal repeating quests.

Some current quests do not fit the season of act 1. Spec 017 gives the rule. This spec moves them out of act 1.

The section "Act 1 quest plan" gives each new, changed, and moved quest.

## Act 1 quest plan

### Rules of the plan

The plan gives the character, the place in the campaign, the date, the dishes, and the story of each quest.
The data check enforces the discovery rule, the diets, the Lent rule of spec 017, and the quest-size rule.
The update-game-content skill writes the dialogue. The user approves the dialogue.

"After N" means that the quest opens after preparation N. A quest after preparation N is necessary for preparation N + 1, as before.
A holiday quest after preparation N therefore holds preparation N + 1 until the holiday. The plan uses this rule to place each holiday in its chapter.
The merges are approximate, at stage merges of 1, 3, 7, 15, and 31 for stages 2 to 6.

### Work in each chapter

| Chapter | Dates | Merges that the days hold |
| --- | --- | ---: |
| 1 | 15 to 26 February | 656 |
| 2 | 27 February to 12 March | 776 |
| 3 | 13 to 26 March | 776 |
| 4 | 27 March to 8 April | 716 |
| 5 | 9 to 19 April | 628 |
| 6 | 20 to 30 April | 596 |

The efficient strategy delivers Dochia's March quests in March.
Campaign quests, repeating quests, and blocker merges use the days. The lantern control can skip part of a day.
The balance test measures the merges and the share for repeating quests.

### Quests that leave act 1

These quests do not fit the season of act 1. The game data keeps each quest with its act. Act 1 does not open the quest.

A quest of a later act and a March quest of spec 017 do not take part in the rules of act 1 for prerequisites:

- A preparation does not need the quest.
- A later quest of the same character does not wait for the quest. So `ilie-clean-monday` does not wait for `ilie-pickles`.
- The discovery rule does not count the dishes of the quest as surely known.
- The work-value check of the preparations does not count the quest.

The March quests of Dochia keep their order among themselves. Spec 017 gives their rules.

| Quest | Character | Act |
| --- | --- | --- |
| `sanziana-midsummer`, "Midsummer Eve" | Sânziana | 2 |
| `sanziana-meadow`, "A picnic in the meadow" | Sânziana | 2 |
| `catalina-hail`, "Bell-ringer's appetite" | Cătălina | 2 |
| `ilie-pickles`, "Jars for winter" | Ilie | 3 |
| `bran-pumpkins`, "The pumpkin fair" | Bran | 3 |
| `ana-saint-andrew`, "Saint Andrew's Eve" | Ana | 4 |
| `cezar-long-night`, "The longest night" | Cezar | 4 |
| `ionatan-castle-dinner`, "Dinner before the castle" | Ionatan | 2 |
| `mina-avram-search`, "A meal before the search" | Mina and Avram | 2 |

Ionatan reaches the castle on Saint George's Eve of the old calendar, in May, and Mina finds him in August. So their visits follow the chronology of the novel and belong to act 2. Vlad's "A guest at the castle" stays in act 1 and announces Ionatan.

### Changed quests

| Quest | Change | Reason |
| --- | --- | --- |
| `ana-garlic`, "Garlic duty" | From after 2 to after 21. Holiday quest of Saint George's Eve, Tuesday 22 April. Opening date 20 April. | The text tells the garlic custom of the eve. |
| `ileana-thursday`, "Before Thursday" | From after 14 to after 18. Holiday quest of Holy Thursday, 17 April. Opening date 14 April. | The text tells the custom of Joimărița. |
| `ilie-cellar`, "The cellar shelves" | New dishes: 1 Lentils, 1 Pickled cabbage, and 1 Mămăligă. | The quest opens during Lent, and Ilie keeps Lent. |
| `ilie-family`, "A dish from the notebook" | Stays after 16, as the neighbour help of chapter 5. New dishes: 2 Zacuscă and 1 Lentils. The great-aunt's recipe becomes her zacuscă, with "a good amount of peppers". | The quest opens during Lent, and Ilie keeps Lent. The closing scene of chapter 5 does not name the dish. |
| `dorian-birthday`, "A quiet birthday" | From after 20 to after 18. | The move balances chapters 5 and 6. |
| `ilie-courtyard`, "Bread for outside" | From after 12 to after 13. | The quest is an outdoor quest. The courtyard opens with preparation 13, and the terrace season starts on 1 April. After 12, the quest blocks preparation 13 and the last March quest of Dochia. |
| `cezar-before-rounds`, "Before the rounds" | Joins the cycle after the delivery of `cezar-castle-lights`, "Lights on the hill". | `cezar-long-night` leaves act 1, and that quest puts Bean soup in the recipe book. |
| `sorin-postbag`, "A heavy post bag" | From after 9 to after 10. | Ionatan leaves act 1, so preparation 11 needs a new quest. |
| `ana-ward-tea`, "Tea for the ward" | From after 9 to after 11. | "The last cold week" becomes a March quest, so preparation 12 needs a new quest. |
| Quests of chapters 1 to 4 | New dishes keep the discovery rule and the work value: `mara-cellar` asks for Gherkins and `eszter-first-plate` for Pickled green tomatoes; `mara-lamp-supper` for Sour cream; `bran-last-bus` for Lamb; `sorin-path` for Nettles; `victor-thesis` for Lamb chops and Wild garlic and sorrel; `bran-horse` for Diced veal; `sorin-welcome` for Minced veal; larger meals for `cezar-round`, `eszter-green-bowls`, `mara-candles` (with Sorin), `cezar-castle-lights`, `ilie-courtyard`, and the supply packs of Adrian, Monica, and Janos. | The March quests of Dochia no longer put dishes in the recipe book, and Ionatan and Mina leave act 1. |
| `dorian-gallery`, "The exhibition" | 1 Cheese board, 1 Cozonac, and 1 Red wine. | Each meal fits in one weekday of 60 merges. |
| The five quests of Dochia | March quests. Spec 017 gives their dates, and two of them get new text. | The legend of Baba Dochia belongs to March. |

### New holiday quests

Spec 017 gives the customs of the holidays.

| ID | Characters | After | Opening date | Holiday | Dishes | Story |
| --- | --- | ---: | --- | --- | --- | --- |
| `victor-dragobete` | Victor | 3 | Friday 21 February | Monday 24 February, Dragobete | 1 Langoș, 1 Milk, and 1 Linden tea | Victor asks for a sweet langoș cut in two and a cup of milk with two straws, and does not say who the second person is. The second person was busy at the stove all day, so he eats both halves. |
| `eszter-carnival` | Eszter | 4 | Thursday 27 February | Sunday 2 March, Carnival Sunday | 1 Papanași, 1 Bulz, and 1 Cheese pie | The last feast before Lent. Eszter says that papanași are the doughnuts of her farsang, with better manners. |
| `sorin-womens-day` | Sorin and Ana | 5 | Wednesday 5 March | Saturday 8 March, Women's Day | 2 Papanași, 2 Linden teas, and 1 Pogăcele | Sorin brings sweets to the night ward. Ana accepts them for all the nurses. |
| `costel-mucenici` | Costel | 6 | Thursday 6 March | Sunday 9 March, the Forty Martyrs | 2 Mucenici and 1 Socată | The custom gives forty small glasses. Costel's clock counts them and stops at nine. |
| `mara-three-months` | Mara, with Ilie | 8 | Thursday 13 March | Saturday 15 March, the three-month memorial | 1 Colivă, 2 Colaci, and 1 Pickled cabbage | Mamaia Paraschiva died on 20 December. Three months fall on 20 March. The family holds the memorial on the Saturday before, the second Saturday of Lent, a Saturday of the dead. The meal keeps the Lenten fast. |
| `ilie-annunciation` | Ilie | 12 | Saturday 22 March | Tuesday 25 March, the Annunciation | 2 Fresh trout and 1 White beans | The first fish of Lent. Ilie's grandmother never missed it. |
| `sanziana-palm-sunday` | Sânziana | 17 | Thursday 10 April | Sunday 13 April, Palm Sunday | 2 Fried trout, 2 Fruit teas, and 2 Plum dumplings | Sânziana sells willow catkins at the church gate and buys fish for her sisters. |
| `mara-easter-baskets` | Mara, Eszter, and Sorin | 19 | Wednesday 16 April | Saturday 19 April, Holy Saturday | 2 Pască, 2 Red eggs, 2 Cozonac, and 1 Drob | The baskets for the blessing at midnight. Ilie guards the baskets and does not taste, because Lent is not over. |
| `mara-easter-lunch` | Mara and Ilie | 20 | Thursday 17 April | Sunday 20 April, Easter | 1 Roast lamb, 1 Drob, 2 Red eggs, and 1 Cozonac | The staff break the fast together. Ilie eats first, for the first time in seven weeks. |
| `eszter-sprinkling` | Eszter and Sorin | 21 | Sunday 20 April | Monday 21 April, Easter Monday | 2 Red eggs, 2 Chimney cakes, and 1 Plum brandy | Sorin comes to sprinkle Eszter with cologne, as the Hungarian custom asks. He uses too much. |
| `mara-blajini` | Mara | 23 | Friday 25 April | Monday 28 April, the Easter of the Blajini | 1 Colivă, 1 Bread basket, and 1 Red eggs | The Easter of the Dead. Mara takes food to the grave of Mamaia Paraschiva and floats the eggshells down the river, so that the Blajini know that Easter came. Bela, who is Székely, opens the gate and asks politely what a Blajin is. |

`ana-garlic` and `ileana-thursday` are the other holiday quests of act 1. The March quests of Dochia start on the days of Baba Dochia.

### New campaign quests

| ID | Characters | After | Opening date | Dishes | Story |
| --- | --- | ---: | --- | --- | --- |
| `ilie-roof-snow` | Ilie and Sorin | 1 | None | 2 Mămăligă, 2 Linden teas, and 1 Langoș | Ilie and Sorin clear the snow from the roof. Sorin calls the snow a commons: everybody admires it, and nobody shovels it. |
| `bela-snowman` | Bela | 2 | None | 1 Pogăcele, 1 Linden tea, and 1 Mămăligă | Somebody built a snowman in the graveyard. Each morning, it faces a different grave. |
| `ana-mittens` | Ana | 2 | None | 2 Linden teas and 1 Pogăcele | The heating of the night ward broke. Ana knits mittens for the patients between rounds. |
| `mara-chimney-sweep` | Mara and Sorin | 3 | None | 2 Langoș, 1 Telemea, and 1 Socată | The chimney sweep comes. Mara touches his button for luck. In the flue, he finds a burnt page of Paraschiva's notebook. |
| `costel-icicle-clock` | Costel | 3 | None | 1 Langoș, 1 Papanași, and 1 Socată | Costel built a clock that drips the hours from an icicle. Near the stove, the clock runs fast. |
| `ilie-clean-monday` | Ilie | 5 | Monday 3 March | 1 Bread basket, 1 Mămăligă, and 1 Linden tea | The first day of Lent. Ilie scrubs every pot, as his grandmother did, and eats only fasting food. |
| `dorian-portrait` | Dorian | 16 | None | 1 Cozonac, 1 Cheese board, and 1 Red wine | The painter wants spring light for a new portrait. Dorian asks Mara if his old portrait looks tired lately. |
| `bran-pilgrims` | Bran | 17 | None | 2 Langoș and 1 Bean soup in a bread bowl | In Holy Week, pilgrims fill the night bus. They ate all of Bran's langoș. |
| `catalina-silent-bells` | Cătălina | 19 | Thursday 17 April | 1 Bean dip, 1 Green beans, and 1 Plum dumplings | From Holy Thursday to the night of Easter, the bells rest, and the wooden toaca calls the village. Cătălina has nothing to ring and is restless. |
| `sorin-mud` | Sorin | 19 | None | 1 Roasted vegetables, 1 Chicken broth, and 1 Langoș | The April rain turns the forest road to mud up to the pedals. |

`catalina-silent-bells` comes after `catalina-cloud-rider`, so the two quests of Cătălina keep their order.

### New repeating quests

The cycle of spec 014 has seven repeating quests. Four are new. Three are seasonal and join the cycle only in their season.

| ID | Character | Joins the cycle | Dishes | Story |
| --- | --- | --- | --- | --- |
| `ana-pickles` | Ana | After `ana-mittens`, while the pickle barrel is on the board | 1 Pogăcele and 1 Mixed pickles | Pickles keep the night nurses awake. |
| `ilie-lenten-bowl` | Ilie | After `ilie-cellar`, during Lent | 1 Green beans, 1 Mămăligă, and 1 Socată | A plain bowl for a fasting man. |
| `victor-nettles` | Victor | After `victor-thesis`, while the forage basket is on the board | 1 Nettle soup, 1 Loaf, and 1 Linden tea | Nettles are good for the nerves, Victor read. |
| `costel-tower-tea` | Costel | After the delivery of `costel-clock` | 1 Papanași and 2 Socată | Tea for the man who winds the church clock. |

A repeating quest joins after the campaign quest that puts its dishes in the recipe book.

## End of act 1

The supper delivery records the act 1 result: the purse at that time.
The days do not change, so the result does not count them.
The supper card says "The bistro worked from 15 February to 1 May. The purse holds 312 coins."
A debt shows as "The shop notebook holds a debt of 40 coins."

## Levers

`PRODUCT.md` gives the values of these levers:

- the opening time, the closing time, and the booking time of a weekday;
- the opening time and the closing time of a Sunday;
- the merge time and the upkeep;
- the opening date of each chapter;
- the opening date of each dated quest.

The [economy record](../economy.md) gives the evidence for the levers.
The upkeep is 20 coins at 75 closings. The balance test measured it: with this value, the purse after the supper is inside the balance band, and the efficient purse never goes below zero.

## Data and state

- `tools/create-original-data.ts` authors the calendar start, the opening hours, the chapter dates, and the quest dates.
- `src/model.ts` gives the date and the weekday of a day number, the opening hours of a day, and the date text.
- `src/engine.ts` applies the Sunday hours, the rats on Sunday night only, the chapter dates, the quest dates, the supper date, and the hold.
- `src/content.ts` checks the dated dependency graph of act 1. The check finds the earliest date of each preparation and each quest.
  The check uses the chapter dates, the opening dates, the holiday dates, and the terrace days. No preparation depends on a later-act quest or a March quest.
  The check fails if preparation 24 cannot come before the closing of 30 April, or if a March quest cannot open before 1 April.
- `src/content.ts` also checks that the chapter dates rise and that each quest date is inside act 1.
  The module also checks that each dated quest opens on or after the opening date of its chapter.
  The module applies the one-day limit to each meal.
- The state keeps the day number of spec 013. The date, the weekday, and the hold come from the day number and the progress.
- The act 1 result holds the purse only.
- The implementation changes the game state version and the envelope version. The game does not read a save of an earlier version.

## Owner contracts

`PRODUCT.md` controls the calendar, the opening hours, the chapter dates, the dated quests, the supper date, the hold, and the act 1 result.
`DESIGN.md` controls the date on the masthead, the date line in Story, and the supper ticket.

## Balance check

The campaign balance test plays the efficient strategy for 20 fixed seeds. For each seed, the test must show these results:

- The purse never goes below zero.
- The strategy pays each preparation on or after the opening date of its chapter.
- The strategy pays preparation 24 before the closing time of 30 April. So the strategy never needs the hold.
- The strategy serves the supper on 1 May.
- The purse pays the upkeep exactly 75 times. The thief rat or Șoricescu comes exactly 11 times.
- The repeating quests use at most 20% of the merges of act 1.
- No chapter has more than two days in a row with work from repeating quests only.
- The purse after the supper is inside the balance band.

The strategy that misses each booking once must also pay preparation 24 before the closing of 30 April.
The strategy that starts each preparation window with a debt must reach the supper. That strategy can use the hold.

For each seed, the test prints the date of each payment and the share of merges on repeating quests.
The test also prints the days with work only from repeating quests.

## Acceptance checks

- Calendar: day 1 is Saturday 15 February. Day 76 is Thursday 1 May. Each Sunday of act 1 has the weekday Sunday.
- Masthead: the masthead shows "Sat 15 Feb · 07:00" in a new act 1. The accessible name gives the full date and the time.
- Sunday: a Sunday opens at 10:00 and closes at 17:00. The Saturday closing leads to 10:00 on Sunday. A Sunday has no evening guest.
- Nights: only the Sunday closing brings a rat and the night dialogs. Each other closing pays the upkeep, shows the toast, and changes no board cell and no seed.
  The toast does not take focus, and the board accepts the next action while the toast shows.
- Chapter dates: the payment of the first preparation of a chapter fails before its opening date and changes nothing. Story shows the opening date.
- Dated quests: a dated quest does not open before its date. The quest opens at the opening time of its date if its other prerequisites are complete.
- Supper: the supper ticket shows "Booked for 1 May" before 1 May. Serve works only from 20:00 on 1 May. The lantern control works on 1 May before 20:00.
- Hold: on 30 April without preparation 24, a merge at the closing time does not close the day. The payment of preparation 24 closes the day. On 1 May, the day does not close before the supper.
- End of act 1: the supper card gives the dates and the purse.
- Quest plan: act 1 opens no quest of a later act. Each new and changed quest has the place, the date, and the characters of the plan.
- Prerequisites: no preparation and no act 1 quest waits for a later-act quest or a March quest. The dated graph check passes. The check fails for an outdoor quest after preparation 12.
- Tickets: on the morning that a dated quest opens, with three tickets in use, the dated quest takes a ticket only if it comes earlier in authored order. A reload gives the same tickets.
- Hold and bookings: a game reaches 30 April with booked quests of both guests and two quests of one guest still open. During the hold, the player delivers each of them, pays preparation 24, and reaches 1 May.
- Content: the chapter dates rise. Each quest date is inside act 1 and on or after the opening date of its chapter. Each meal fits in one day.
- Campaign: the balance check passes for each seed.
- Save: a reload, an export, and an import keep the day number, so the date stays the same. Import rejects a save of an earlier version.
- Browser: the tests cover the date on the masthead at phone and desktop sizes, the closing toast, a Sunday, the date line in Story, the supper ticket, and the hold. Phone and desktop in both themes.

## Open decisions

- The user approves the dialogue of the new and changed quests. The plan uses only current characters, so the cast rule adds no new name.
