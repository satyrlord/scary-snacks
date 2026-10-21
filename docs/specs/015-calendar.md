# 015: Calendar and act 1 dates

Status: Proposed.

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
- the act 1 result, the content checks, and the campaign balance test.

The feature does not include these parts:

- the prologue (016);
- the seasons, the weather, and the holidays (017);
- acts 2 and 3;
- a market day or another rule for a weekday other than Sunday.

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

Act 1 has 76 closings. The rats come only on Sunday night, so the night stays an event.

- After the closing of a Sunday, the night of spec 013 applies in full: the thief rat or Șoricescu, the closing dialog, the night sequence, and the morning dialog.
- After each other closing, the purse pays the upkeep, and the next day starts. No rat comes, and no dialog opens.
  A toast reports the upkeep and the new date. For example: "The bistro closed for the night. Upkeep: 10 coins. Good morning, Tuesday 18 February."
  The toast is the temporary notice of `DESIGN.md`, as for a delivery. The toast is not a modal dialog.
  The toast does not stop play, does not take focus, and needs no action. The toast leaves by itself after the usual time.
- On a Sunday night, the thief rat looks at the loose raw ingredients at the Sunday closing.
- Only a Sunday night with the thief rat uses and advances the random seed.
- The night report records each closing. The report of a closing without rats has no rat and no morning dialog.

Act 1 has 11 Sunday nights. So the count of rat visits stays near the count of nights in the campaign of spec 013, and the gifts of Șoricescu do not fill the board.

## The size of the day

The merge time sets the number of merges in a day. The merge time is a lever.
The days of act 1 are fixed, so the merge time sets the work that act 1 needs.

| Merge time | Weekday | Sunday | Merges in act 1 | Merges of content to add |
| --- | ---: | ---: | ---: | ---: |
| 6 minutes | 150 | 70 | approximately 10,500 | approximately 7,500 |
| 10 minutes | 90 | 42 | approximately 6,300 | approximately 3,300 |
| 15 minutes | 60 | 28 | approximately 4,200 | approximately 1,200 |

The current campaign needs approximately 3,000 merges.
The last column gives the merges that new quests must add before repeating quests fill the rest. The lantern control shortens some days, so the figures are approximate.

The merge time is 15 minutes. A weekday holds 60 merges, and a Sunday holds 28 merges.
The content work then stays near the size of the holiday quests of spec 017 and some new campaign quests.
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
Spec 017 uses opening dates for the holiday quests.

The authored order of the quests stays the ticket order. A dated quest that opens later than a quest after it in authored order gets the next free ticket.

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
On 30 April, the payment of preparation 24 closes the day in the same change. The closing then applies as in spec 013, and 1 May starts.
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
The content plan has these sizes. The balance test gives the final counts.

- Approximately 10 to 12 new campaign quests, in addition to the holiday quests of spec 017.
- A cycle of 6 to 8 repeating quests, including the seasonal repeating quests.

Some current quests do not fit the season of act 1. Spec 017 lists them.
A later change moves them to act 2 or act 3, so act 1 then needs more new quests.

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
The upkeep of 10 coins applies on 76 days in place of approximately 22 days. The balance test sets a new upkeep value.

## Data and state

- `tools/create-original-data.ts` authors the calendar start, the opening hours, the chapter dates, and the quest dates.
- `src/model.ts` gives the date and the weekday of a day number, the opening hours of a day, and the date text.
- `src/engine.ts` applies the Sunday hours, the rats on Sunday night only, the chapter dates, the quest dates, the supper date, and the hold.
- `src/content.ts` checks that the chapter dates rise and that each quest date is inside act 1.
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
- Content: the chapter dates rise. Each quest date is inside act 1 and on or after the opening date of its chapter. Each meal fits in one day.
- Campaign: the balance check passes for each seed.
- Save: a reload, an export, and an import keep the day number, so the date stays the same. Import rejects a save of an earlier version.
- Browser: the tests cover the date on the masthead at phone and desktop sizes, the closing toast, a Sunday, the date line in Story, the supper ticket, and the hold. Phone and desktop in both themes.

## Open decisions

- The characters and the stories of the new campaign quests. Each new character follows the cast rule.
