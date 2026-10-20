# 013: Bistro day and night

Status: Implemented.

## Outcome and scope

The bistro has a working day. Each merge is kitchen work, and kitchen work moves the clock.
The bistro opens at 07:00 and closes at 22:00. At closing, the bistro pays its daily upkeep, and the night comes.
At night, the thief rat takes loose raw ingredients from the board. If the board has no loose raw ingredient, Șoricescu, the good rat, leaves a gift.
Two guests come only in the evening: Vlad and Elisabeta book a table.

The clock counts merges, never seconds. The game has no timers and no waiting. Nothing changes while the game is closed.
A quest has no deadline. A booked guest who does not get the meal books again for a later evening.
The player never has to cook food that no quest needs to move the clock.

This specification does not add a calendar, seasons, a yearly report, or more repeating quests. Later specifications own those features.

## Size of the change

This change touches these parts:

- the clock, the closing, the upkeep, the bookings, and the two rats in `src/engine.ts` and `src/model.ts`;
- the quest data of Vlad and Elisabeta and the levers in `tools/create-original-data.ts`;
- the content checks in `src/content.ts`, for the quest size and the bookings;
- the save format, for the clock, the random seed, the rat holes, the night report, the act 1 result, and a purse below zero;
- the kitchen interface, for the clock, the booked tickets, the lantern control, and the night notice;
- the room, for the night sequence;
- new art: the two rats, the rat hole, and the night sky;
- the campaign balance test.

## The clock

Each successful merge adds the merge time to the clock. This includes a chain merge, a mixed merge, and a blocker merge.
A failed merge does not move the clock.
A move, a take, a delivery, a payment, and a scene do not move the clock.
The lantern control is the only other action that moves the clock. The section on bookings defines it.

The clock shows the day and the time, for example "Day 3 · 14:24". A new game starts on day 1 at 07:00.
The time is the opening time plus the merge time for each merge of the day.
With the starting levers, a day holds 150 merges.

A day holds about the merges of one set of provisions and a few meals.
So the biggest quest fills most of one day, and the bistro must keep its trade moving.
The data check counts the merges that each quest needs from its staples. Each quest must fit in one day.
`DESIGN.md` gives the place of the clock.

## Closing and the night

The merge that reaches the closing time closes the day. The closing applies in the same change as that merge, in this order:

1. The merge applies with all its usual effects, including the placement of queued preparation blockers.
2. The purse pays the daily upkeep.
3. The thief rat or Șoricescu visits the board.
4. The day number increases by one, and the clock shows 07:00.
5. The game fixes the evening guest of the new day. The section on bookings gives the rule.
6. The state records the night report.

The night has no turns, and the player does not play during the night.

### Upkeep

The upkeep pays for wood, wages, and the other daily costs.
The upkeep is 10 coins at the starting levers.

### Loose raw ingredients

A loose raw ingredient is a stage-1 dish of a chain other than Herbs, on a board cell without a blocker.
Cooked dishes and herbs are safe overnight.

### The thief rat

If the board has a loose raw ingredient at closing, the thief rat comes.
The thief rat picks up to three loose raw ingredients at random.
The game gives no warning of the picks, and the player cannot protect a cell.

If fewer than three rat holes are open, the thief rat drops its first pick in a new rat hole.
That cell keeps that ingredient, and the ingredient becomes blocked. The other picks leave the board.
If three rat holes are open, the thief rat makes no rat hole, and all its picks leave the board.

### Random seed

The state holds a random seed. A new game makes the seed.
Only a closing with the thief rat uses the seed, and that closing advances the seed.
A reload, an export, and an import keep the seed. A failed action does not change the seed.

### Rat holes

A rat hole is a blocker. The usual blocker rules apply to it.
A merge of a matching staple into the blocked ingredient clears the rat hole.
The result stays in the cell, and the cleared blocker gives the blocker coin.

A rat hole replaces a staple in the same cell. So a rat hole does not reduce the free cells.
Rat holes do not count toward the limit of the preparation blockers.

### Șoricescu's gift

If the board has no loose raw ingredient at closing, Șoricescu comes in place of the thief rat.
Șoricescu is the good rat of the neighbourhood. He leaves a gift, so a tidy kitchen earns the gift.

The gift is the stage-4 dish of an open chain. The chains take turns in their data order, by the number of earlier gifts.
The gift goes into the free cell nearest to the bottom left of the board. The gift is not blocked.
The gift adds its dish to the recipe book, as a take does.

Șoricescu leaves a gift only if the board has at least five free cells. So four free cells stay free for the recovery quest after the gift.
If the board has fewer free cells, Șoricescu leaves no gift, and the gift count does not change.

## Debt

The upkeep can take the purse below zero. The game has no defeat and no game-over screen.
A purse below zero is a debt. Mara writes the debt "pe caiet", in the notebook of the village shop.
The purse shows a debt with a minus sign, for example "−12".

The rules of spec 012 for takes, payments, and the recovery quest do not change.
The only change: the purse can hold an integer below zero. Each action that adds coins also works with a debt.

## Bookings

Vlad and Elisabeta book a table for the evening. Each of their quests is a booked quest.
A booked quest opens and takes a ticket by the usual rules.
A booked ticket is a booked quest with a ticket on the counter. A booked quest that waits without a ticket does not count.

### The evening guest

Vlad and Elisabeta never have the same evening. They do not like each other: Vlad keeps moving the fence between their lands.
Each day has one evening guest at most. These rules choose the evening guest:

- At 07:00, if a booked ticket is on the counter, the game fixes the evening guest.
- If no evening guest is fixed and a booked ticket comes to the counter, the game fixes the evening guest in that change.
- If only one guest has a booked ticket, that guest is the evening guest.
- If both guests have a booked ticket, the evening guest is the guest who did not have the last evening.
- If neither guest had an evening, the evening guest is the guest whose quest is first in authored order.
- After the game fixes the evening guest, the evening guest does not change until the next closing.

An evening counts for its guest whether or not the player delivers the meal.
The state records the evening guest of the current day and the guest of the last evening.

| Case | Result |
| --- | --- |
| Both guests get a booked ticket in the same change, and neither had an earlier evening | The guest whose quest is first in authored order has the evening. |
| The second guest gets a booked ticket after the game fixes the evening guest | The evening guest does not change. |
| A booked quest waits without a ticket | The quest does not take part in the choice. |
| The delivery of the evening guest opens the next quest of that guest | The next quest waits for a later evening. |
| The player does not deliver to the evening guest before closing | The evening counts for that guest. At the next 07:00, the other guest has the evening if that guest has a booked ticket. |
| A guest has no open quest for some time, then gets a new quest | The same rules apply. The guest of the last evening decides a tie. |

### Booked tickets and delivery

Each day admits one booked delivery, to the evening guest.
Deliver works from the booking time to the closing time.

The ticket of the evening guest shows "Booked for 20:00". The other booked tickets show "Booked for another evening".
The ticket text comes from the evening guest that the game fixed. A ticket never promises a day that the rules do not fix.

### The lantern control

Before the booking time, the ticket of the evening guest has the lantern control in place of Deliver.
The lantern control works when the board holds every portion of the booked quest. Its label is "Light the lanterns".
The lantern control moves the clock to the booking time in one change. The player then delivers with Deliver.
The lantern control spends no coins. The skipped time brings the closing, the upkeep, and the night sooner.
So the player never has to cook food that no quest needs to wait for a guest.

The opening of each booked quest names the booking time. The openings can mention the fence.
The diets of spec 012 do not change.

## End of act 1

The supper delivery stops the clock. After the supper, merges do not move the clock, and no night comes.
The supper delivery records the act 1 result: the number of days and the purse at that moment.
The act 1 result does not change after the supper, although the purse can change.

The supper card gives the act 1 result.
For example: "The bistro worked for 22 days. The purse holds 312 coins." A debt shows as "The shop notebook holds a debt of 40 coins."
The result can be a debt. The game has no defeat condition.

## Night report

Each closing records one night report in the state. The report holds these items:

- the day that closed;
- the upkeep;
- which rat came;
- each ingredient that left the board, with its cell;
- the trapped ingredient and its cell, or the reason for no rat hole;
- the gift and its cell, or the reason for no gift;
- the purse after the closing.

The next closing replaces the report. The state also records whether the player saw the notice of the report.
The night sequence and the night notice use only the report.

## Night sequence

The closing change applies at once. Then the interface plays a short night sequence of about three seconds:

- The room dims to night. A dark tint can cover the whole room painting.
- The window of the front room shows a night sky behind the glass, as for the bat.
- The rat of the night runs across the floor of the area that the room shows. The rat is not dimmed.
- On a theft night, the thief rat breaks up through the board, takes its picks, and leaves. If the report has a trapped ingredient, a rat hole appears in its cell.
- On a gift night, Șoricescu climbs out of the board, puts down the gift, lifts his hat, and leaves.
- If the report has no gift, Șoricescu climbs out, looks around, and leaves.
- The tint goes away, and the window shows the morning sky again.

The tint keeps the painting readable: the player still sees the room and its decorations.
The tint is the same in both themes. Review examines the tint at the desktop size and the phone size, in both themes, and the user accepts it.
If the room shows the courtyard, or if the window of the front room is not mended, the room shows no night sky. The tint and the rat still show.
If the room painting did not load, the room shows no rat.

A tap or a key stops the sequence at once. That input does no other action.
The sequence does not play while the page is hidden, or with reduced motion. The notice then shows at once.
If the page reloads before the notice shows, the notice shows after the load, without the sequence.

### Night notice

After the sequence, a notice reports the night. The notice marks the report as seen.
The notice gives the upkeep and the purse, and one of these results:

- the ingredients that the thief rat took, and the rat hole;
- the ingredients that the thief rat took, and that the three open rat holes left no room for a new one;
- the gift of Șoricescu, and a new dish if the gift is the first of its dish;
- that Șoricescu found no room for his gift.

If the purse holds a debt, the notice gives the debt.

## Art

### The two rats

The two rats are original characters. They must look different at board-tile size. Neither rat wears a chef's hat or kitchen clothes.

- The thief rat is scruffy and comical: patchy grey fur, a torn ear, crooked front teeth, and sly eyes. It causes mischief, and it is not frightening.
- Șoricescu is small, round, and cute, with warm brown fur and bright eyes. He wears a clop, the small straw hat of Maramureș, with an embroidered band. He carries the gift in a traistă, a small woven shoulder bag.

Each rat has one sprite sheet of eight poses. The two rats never share a sheet, so that their looks stay apart.

| Cells | Thief rat | Șoricescu |
| --- | --- | --- |
| 1 and 2 | Breaks up through the board | Climbs out of the board |
| 3 and 4 | Looks around, then grabs an ingredient | Opens the traistă, then puts down the gift |
| 5 and 6 | Drags the ingredients, then looks back | Lifts his hat, then waves |
| 7 and 8 | Scurries: two alternate poses | Scurries: two alternate poses |

- The code gives the motion: the path, a small bounce, a squash on landing, and the tail. The poses give only the shapes.
- Two scurry poses and the bounce give the run. At board-tile size, more run frames do not look better.
- The room uses the scurry poses of the rat of the night at a smaller size. So the room needs no other rat art.
- Each sheet is a painted PNG master in the style of the food art. The build makes its variants.
- Each sheet uses the format of the food atlases: a 2048 by 1024 pixel grid of 4 columns and 2 rows of equal cells.
- Each pose stays inside its cell with a clear margin. Each pose has hard, clean edges and a fully transparent background.
- Generate one reference pose of each rat first. Use that reference pose as the image input for the sheet.
- Review rejects a sheet if one pose changes the body, the colours, or the clothes of its rat.

### Other pictures

- The rat hole: a blocker picture of a hole in the board cell.
- The night sky: a sky for the window glass of the front room.

Each picture has records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.
Review examines each picture at its game size on a phone, in both themes. The user accepts each picture.

## Levers

These values are starting values. The campaign balance test measures them, and the user tunes them after play.

| Lever | Starting value |
| --- | ---: |
| Opening time | 07:00 |
| Closing time | 22:00 |
| Merge time: the minutes that one merge adds to the clock | 6 |
| Upkeep: the coins that each closing spends | 10 |
| Rat take: the most loose raw ingredients that the thief rat takes in one night | 3 |
| Rat hole limit: the most rat holes that can be open at one time | 3 |
| Gift stage | 4 |
| Gift space: the fewest free cells that a gift needs | 5 |
| Booking time | 20:00 |

## Data and state

- `tools/create-original-data.ts` authors the levers and marks the booked quests.
- `src/model.ts` gives the time, the day, the loose raw ingredients, the evening guest, and the text of each booked ticket.
- `src/engine.ts` moves the clock with each merge and with the lantern control. It applies the closing in the same change as the merge that reaches the closing time.
- `src/content.ts` checks that each quest fits in one day and that only Vlad and Elisabeta have booked quests.
- The state records the day number, the merges of the current day, and the random seed.
- The state records the cell of each open rat hole and the number of gifts.
- The state records the evening guest of the current day, the guest of the last evening, and whether the day had its booked delivery.
- The state records the night report and whether the player saw its notice.
- The state records the act 1 result after the supper.
- The purse can hold an integer below zero. Save validation accepts a debt.
- The game state version and the save key change. The game does not read or convert a save in an earlier format. Each player starts a new game.

## Owner contracts

`PRODUCT.md` controls the clock, bookings, rat holes, gifts, debt, saved seed, and act 1 result.
`DESIGN.md` controls the clock, booked tickets, lantern control, night sequence, and night notice.
The rat appears over the room, and the window glass can show the night sky.
A night tint changes the room painting. The Untouched Plate Rule keeps food, portraits, and timber in their original colours.

## Balance check

The campaign balance test plays one efficient strategy with no injected coins or items, for 20 fixed seeds.
The efficient strategy cooks only for quests and uses the lantern control for each booking.
For each seed, the test must show these results:

- The purse never goes below zero.
- The strategy pays all 24 preparations and delivers the supper.
- The strategy never cooks a dish that no quest needs to move the clock.
- Act 1 lasts from 18 to 30 days.
- The purse after the supper is inside the balance band of spec 012, with the upkeep included.
- The board never reaches a deadlock.

The test prints, for each seed: the days, the lantern uses, the thefts, the stolen ingredients, the gifts, the lowest purse, and the free cells at each preparation.

Two more strategies play act 1 with the same seeds:

- A strategy that misses each booking once. It must finish act 1. Its purse can go below zero.
- A strategy that starts each preparation window with a debt of 20 coins. It must reach each preparation through the recovery quest.

## Acceptance checks

- Clock: each successful merge adds the merge time. A failed merge, a move, a take, a delivery, and a payment do not move the clock.
- Closing: the merge that reaches the closing time applies its effects, pays the upkeep, applies the thief rat or Șoricescu, starts the next day, fixes the evening guest, and records the night report, in one change. A failed save keeps the current session, as for other actions.
- Thief rat: with a given seed, the thief rat picks the same ingredients. It never picks a herb, a cooked dish, or a blocked item. It picks at most the rat take.
- Seed: a reload, an export, and an import keep the seed. A failed action and a closing with Șoricescu do not change the seed.
- Rat holes: the first pick becomes blocked in its cell. With three open rat holes, the thief rat makes no rat hole. A matching merge clears a rat hole and gives the blocker coin.
- Gift: on a board without a loose raw ingredient and with at least five free cells, Șoricescu leaves the gift of the next chain in turn. The gift discovers its dish. With fewer free cells, he leaves no gift.
- Gift and recovery: a board with exactly four free cells and no loose raw ingredient closes the day with a merge. Șoricescu leaves no gift, and a Linden tea for the recovery quest can still be made from scratch.
- Debt: with a purse of −20, a Herbs take works, and a paid take and a payment do not. A recovery delivery takes the purse from −20 to −6. A cleared blocker gives its coin with a debt. The recovery quest stays open across another closing.
- Debt and the next preparation: with no open campaign quest and a debt, the recovery quest is open, and its deliveries reach the cost of the next preparation.
- Evening guest: each case in the table of the evening guest gives its result. Vlad and Elisabeta never have the same evening.
- Booked tickets: the evening guest shows "Booked for 20:00", and each other booked ticket shows "Booked for another evening". Deliver works only from the booking time to closing, once per day.
- Lantern control: the lantern control works only on the ticket of the evening guest, before the booking time, with every portion on the board. It moves the clock to the booking time and spends no coins.
- Night report: theft with a rat hole, theft with three open rat holes, a gift, and no gift each give their report and their notice. A reload before the notice shows the notice once, without the sequence.
- End of act 1: the supper stops the clock and records the act 1 result. The supper card shows that result after the purse changes, including a debt.
- Content: each quest fits in one day. Only the quests of Vlad and Elisabeta are booked.
- Campaign: the balance check passes for each seed.
- Save: a new game, reload, export, and import keep the clock, the seed, the rat holes, the gift count, the evening guest, the night report, the act 1 result, and a debt. An earlier save is not read, and an import of an earlier save is rejected.
- Browser: the clock, a booked ticket, the lantern control, the night sequence for each result, a stop by tap, reduced motion, a hidden page, and the night notice. Phone and desktop in both themes.
