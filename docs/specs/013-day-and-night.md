# 013: Bistro day and night

Status: Implemented.

## Outcome and scope

The bistro has a work day. Each merge is kitchen work, and kitchen work moves the clock.
The bistro opens at 07:00 and closes at 22:00. At closing, the bistro pays its daily upkeep, and the night comes.
At night, the thief rat takes loose raw ingredients from the board. If the board has no loose raw ingredient, Șoricescu, the good rat, leaves a gift.
Two guests come only in the evening: Vlad and Elisabeta book a table.

The clock counts merges, never seconds. The game has no timers and no waiting. Nothing changes while the game is not open.
A quest has no deadline. A booked guest who does not get the meal books again for a later evening.
To move the clock, the player never has to cook food that no quest needs.

The feature covers these parts:

- the clock, the closing, the upkeep, the bookings, and the two rats;
- the booked quests of Vlad and Elisabeta and the levers of the day;
- the content checks for the quest size and the bookings;
- the saved clock, random seed, rat holes, night report, act 1 result, and a purse below zero;
- the clock, the booked tickets, the lantern control, and the night dialogs in the kitchen;
- the night sequence in the room;
- the art of the two rats, the rat hole, and the night sky;
- the campaign balance test.

## The clock

Each successful merge adds the merge time to the clock. A successful merge can be a chain merge, a mixed merge, or a blocker merge.
A failed merge does not move the clock.
A move, a take, a delivery, a payment, and a scene do not move the clock.
The lantern control is the only other action that moves the clock. The section on bookings defines the lantern control.

The clock shows the day and the time, for example "Day 3 · 14:24". A new game starts on day 1 at 07:00.
The time is the opening time plus the merge time for each merge of the day.
With the starting levers, a day holds 150 merges.

A day holds approximately the merges of one set of provisions and a few meals.
So the biggest quest fills most of one day, and the bistro must work steadily.
The data check counts the merges that each quest needs from its ingredients. Each quest must fit in one day.
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

A loose raw ingredient is a stage-1 dish of a chain other than Herbs.
The dish is on a board cell without a blocker.
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

A rat hole is a blocker. The usual blocker rules apply to rat holes.
A merge of a matching ingredient into the blocked ingredient clears the rat hole.
The result stays in the cell, and the cleared blocker gives the blocker coin.

A rat hole replaces an ingredient in the same cell. So a rat hole does not reduce the free cells.
Rat holes do not count toward the limit of the preparation blockers.

### Șoricescu's gift

If the board has no loose raw ingredient at closing, Șoricescu comes in place of the thief rat.
Șoricescu is the good rat of the neighbourhood. He leaves a gift, so a tidy kitchen earns the gift.

The gift is the stage-4 dish of an open chain. The gift chains rotate in their data order. The number of earlier gifts selects the chain.
The gift goes into the free cell nearest to the bottom left of the board. The gift is not blocked.
The gift adds its dish to the recipe book, as a take does.

Șoricescu leaves a gift only if the board has at least five free cells. So four free cells stay free for the recovery quest after the gift.
If the board has fewer free cells, Șoricescu leaves no gift, and the gift count does not change.

## Debt

The upkeep can take the purse below zero. The game has no defeat and no game-over screen.
A purse below zero is a debt. Mara writes the debt "pe caiet", in the notebook of the village shop.
The purse shows a debt with a minus sign, for example "−12".

The purse can hold an integer below zero. A paid take and a payment need the coins. Each action that adds coins also works with a debt.
The recovery quest stays open while the purse is short.

## Bookings

Vlad and Elisabeta book a table for the evening. Each of their quests is a booked quest.
A booked quest opens and takes a ticket by the usual rules.
A booked ticket is a booked quest with a ticket on the counter. A booked quest that waits without a ticket does not count.

### The evening guest

Vlad and Elisabeta never have the same evening. They do not like each other. Vlad often moves the fence between their lands.
Each day has one evening guest at most. These rules choose the evening guest:

- At 07:00, if a booked ticket is on the counter, the game fixes the evening guest.
- A booked ticket can come to the counter when the game has no fixed evening guest.
  Then the game fixes the evening guest in that change.
- If only one guest has a booked ticket, that guest is the evening guest.
- If both guests have a booked ticket, the evening guest is the guest who did not have the last evening.
- If neither guest had an evening, the evening guest is the guest whose quest is first in authored order.
- After the game fixes the evening guest, the evening guest does not change until the next closing.

An evening counts for its guest, with or without a delivery of the meal.
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

Each day allows one booked delivery, to the evening guest.
Deliver works from the booking time to the closing time.

The ticket of the evening guest shows "Booked for 20:00". The other booked tickets show "Booked for another evening".
The ticket text comes from the evening guest that the game fixed. A ticket never promises a day that the rules do not fix.

### The lantern control

Before the booking time, the ticket of the evening guest has the lantern control in place of Deliver.
The lantern control works only if the board holds every portion of the booked quest. Its label is "Light the lanterns".
The lantern control moves the clock to the booking time in one change. The player then delivers with Deliver.
The lantern control spends no coins. Because the lantern control skips time, the closing, the upkeep, and the night come sooner.
So to wait for a guest, the player never has to cook food that no quest needs.

The opening of each booked quest names the booking time. The openings can mention the fence.
The diets of spec 012 apply to the booked quests.

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
- each ingredient that left the board;
- the trapped ingredient and its cell, or the reason for no rat hole;
- the gift or the reason for no gift;
- the purse after the closing.

The next closing replaces the report. The state also records whether the player saw the morning dialog of the report.
The closing dialog, the night sequence, and the morning dialog use only the report.

## Closing dialog

The closing change applies immediately. Then the closing dialog opens. The dialog says that the day is over.
The dialog has two actions: Watch the night and Skip.
Until the player chooses an action, the board shows the dishes that the night takes.
The board also hides the cells that the night changes.
Watch the night, Close, and Escape play the night sequence. Skip opens the morning dialog immediately.

## Night sequence

The night sequence plays in this order:

- The room becomes dark for the night. A dark tint can cover the whole room painting.
- The window of the front room shows a night sky behind the glass, as for the bat.
- The rat of the night runs across the floor of the area that the room shows. The tint does not darken the rat. On a phone with a movable drawer, the drawer lowers for this run and rises after the run.
- Then, on a theft night, the thief rat breaks through the board from below, takes its picks, and leaves. If the report has a trapped ingredient, a rat hole appears in its cell.
- On a gift night, Șoricescu climbs out of the board, places the gift, lifts his hat, and leaves.
- If the report has no gift, Șoricescu climbs out of the board, looks left and right, and leaves.
- The tint and the night sky fade.

The tint keeps the painting readable: the player still sees the room and its decorations.
The tint is the same in both themes. The review examines the tint at the desktop size and the phone size, in both themes.
The user accepts the tint.
If the room shows the courtyard, the room shows no night sky.
If the window of the front room is not mended, the room also shows no night sky. The tint and the rat still show.
If the room painting did not load, the room shows no rat.

No tap and no key stops a watched sequence. A tap or a key during the sequence does no action.
The closing dialog and the sequence do not show while the page is hidden or while reduced motion is active.
In these cases, the morning dialog opens immediately.
The sequence stops if the page becomes hidden or if reduced motion becomes active. The morning dialog then opens.
If the page reloads before the player closes the morning dialog, the dialog opens without the sequence.

### Morning dialog

After the sequence, the morning dialog reports the night. The dialog has one action: Open the bistro.
Each way to close the dialog marks the report as seen.
The dialog shows the rat of the night, the upkeep, the purse, and one of these results:

- the ingredients that the thief rat took, and the rat hole;
- the ingredients that the thief rat took, and no new rat hole because three rat holes are open;
- the gift of Șoricescu, and a new dish if the gift is the first of its dish;
- that Șoricescu found no space for his gift.

If the purse holds a debt, the dialog gives the debt.

## Art

### The two rats

The two rats are original characters. They must look different at board-tile size. Neither rat wears a chef's hat or kitchen clothes.

- The thief rat is scruffy and comical: patchy grey fur, a torn ear, crooked front teeth, and sly eyes. The thief rat causes mischief, and it is not frightening.
- Șoricescu is small, round, and cute, with warm brown fur and bright eyes. He wears a clop, the small straw hat of Maramureș, with an embroidered band. He carries the gift in a traistă, a small woven shoulder bag.

Each rat has one sprite sheet of eight poses. The two rats never share a sheet, so that their looks stay different.

| Cells | Thief rat | Șoricescu |
| --- | --- | --- |
| 1 and 2 | Breaks through the board from below | Climbs out of the board |
| 3 and 4 | Looks left and right, then grabs an ingredient | Opens the traistă, then places the gift |
| 5 and 6 | Drags the ingredients, then looks back | Lifts his hat, then waves |
| 7 and 8 | Scurries: two alternate poses | Scurries: two alternate poses |

- The code gives the motion: the path, a small bounce, a squash when the rat lands, and the tail. The poses give only the shapes.
- Two scurry poses and the bounce give the run. At board-tile size, more run frames do not look better.
- The room uses the scurry poses of the rat of the night at a smaller size. So the room needs no other rat art.
- Each sheet is a painted Portable Network Graphics (PNG) master in the style of the food art. The build makes its variants.
- Each sheet uses the format of the food atlases. The format is a 2048 by 1024 pixel grid of 4 columns and 2 rows of equal cells.
- Each pose stays inside its cell with a clear margin. Each pose has hard, clean edges and a fully transparent background.
- First, generate one reference pose of each rat. Use that reference pose as the image input for the sheet.
- The review rejects a sheet if one pose changes the body, the colours, or the clothes of its rat.

### Other pictures

- The rat hole: a blocker picture of a hole in the board cell.
- The night sky: a sky for the window glass of the front room.

Each picture has records in `docs/asset-provenance.json` and `docs/asset-prompts.json`.
The review examines each picture at its game size on a phone, in both themes. The user accepts each picture.

## Levers

`PRODUCT.md` gives the values of these levers of the day:

- the opening time, the closing time, and the booking time;
- the merge time and the upkeep;
- the rat take and the rat hole limit;
- the gift stage and the gift space.

The [economy record](../economy.md) gives the evidence for the levers.

## Data and state

- `tools/create-original-data.ts` authors the levers and marks the booked quests.
- `src/model.ts` gives the time, the day, the loose raw ingredients, the evening guest, and the text of each booked ticket.
- `src/engine.ts` moves the clock with each merge and with the lantern control. The module applies the closing in the same change as the merge that reaches the closing time.
- `src/content.ts` checks that each quest fits in one day and that only Vlad and Elisabeta have booked quests.
- The state records the day number, the merges of the current day, and the random seed.
- The state records the cell of each open rat hole and the number of gifts.
- The state records the evening guest of the current day and the guest of the last evening.
  The state also records whether the day had its booked delivery.
- The state records the night report and whether the player saw its morning dialog.
- The state records the act 1 result after the supper.
- The purse can hold an integer below zero. Save validation accepts a debt.

## Owner contracts

`PRODUCT.md` controls the clock, bookings, rat holes, gifts, debt, saved seed, and act 1 result.
`DESIGN.md` controls the clock, booked tickets, lantern control, night sequence, and night dialogs.
The rat appears over the room, and the window glass can show the night sky.
A night tint changes the room painting. The Untouched Plate Rule keeps food, portraits, and timber in their original colours.

## Balance check

The campaign balance test plays one efficient strategy with no injected coins or items, for 20 fixed seeds.
The efficient strategy cooks only for quests and uses the lantern control for each booking.
For each seed, the test must show these results:

- The purse never goes below zero.
- The strategy pays all 24 preparations and delivers the supper.
- To move the clock, the strategy never cooks a dish that no quest needs.
- Act 1 lasts from 18 to 30 days.
- The purse after the supper is inside the balance band of spec 012, with the upkeep included.
- The board never reaches a deadlock.

For each seed, the test prints the days, the lantern uses, the thefts, and the stolen ingredients.
The test also prints the gifts, the lowest purse, and the free cells at each preparation.

Two more strategies play act 1 with the same seeds:

- A strategy that misses each booking once. It must finish act 1. Its purse can go below zero.
- A strategy that starts each preparation window with a debt of 20 coins. It must reach each preparation through the recovery quest.

## Acceptance checks

- Clock: each successful merge adds the merge time. A failed merge, a move, a take, a delivery, and a payment do not move the clock.
- Closing: the merge that reaches the closing time makes one change. The change applies the merge effects and pays the upkeep. The change applies the thief rat or Șoricescu and starts the next day. The change fixes the evening guest and records the night report. A failed save keeps the current session, as for other actions.
- Thief rat: with a given seed, the thief rat picks the same ingredients. The thief rat never picks a herb, a cooked dish, or a blocked item. The thief rat picks at most the rat take.
- Seed: a reload, an export, and an import keep the seed. A failed action and a closing with Șoricescu do not change the seed.
- Rat holes: the first pick becomes blocked in its cell. With three open rat holes, the thief rat makes no rat hole. A matching merge clears a rat hole and gives the blocker coin.
- Gift: a board has no loose raw ingredient and at least five free cells. Șoricescu leaves the gift of the next chain in turn. The gift discovers its dish. With fewer free cells, Șoricescu leaves no gift.
- Gift and recovery: a merge closes the day on a board with exactly four free cells and no loose raw ingredient. Șoricescu leaves no gift. The player can still cook a Linden tea for the recovery quest from Elderflowers.
- Debt: with a purse of −20, a Herbs take works, and a paid take and a payment do not. A recovery delivery takes the purse from −20 to −6. A cleared blocker gives its coin with a debt. The recovery quest stays open across another closing.
- Debt and the next preparation: with no open campaign quest and a debt, the recovery quest is open. The recovery deliveries reach the cost of the next preparation.
- Evening guest: each case in the table of the evening guest gives its result. Vlad and Elisabeta never have the same evening.
- Booked tickets: the ticket of the evening guest shows "Booked for 20:00", and each other booked ticket shows "Booked for another evening". Deliver works only from the booking time to closing, once each day.
- Lantern control: the lantern control works only on the ticket of the evening guest. The control works only before the booking time and with every portion on the board. The control moves the clock to the booking time and spends no coins.
- Night report: each night gives its report and its morning dialog. The test covers a theft with a rat hole and a theft with three open rat holes. The test also covers a gift and no gift. A reload before the morning dialog closes shows the morning dialog once, without the sequence.
- End of act 1: the supper stops the clock and records the act 1 result. The supper card shows that result after the purse changes, including a debt.
- Content: each quest fits in one day. Only Vlad and Elisabeta have booked quests.
- Campaign: the balance check passes for each seed.
- Save: a new game, reload, export, and import keep the clock, the seed, the rat holes, and the gift count. These actions also keep the evening guest, the night report, the act 1 result, and a debt. The game does not read an earlier save. Import rejects an earlier save.
- Browser: the tests cover the clock, a booked ticket, the lantern control, the closing dialog, and Skip. The tests also cover the night sequence for each result, and taps and keys that do not stop the sequence. The tests also cover the drawer on a phone, reduced motion, a hidden page, and the morning dialog. Phone and desktop in both themes.
