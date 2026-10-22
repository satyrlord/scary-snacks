# 014: Repeating quests

Status: Implemented.

## Outcome and scope

The clock of spec 013 moves only with merges.
Sometimes no quest has work. For example, the only open quest is a booked quest for another evening, and its meal is on the board.
Then the player must cook food that no quest needs to bring the night. Spec 013 does not permit this.

Repeating quests give the bistro work in this case.
Three neighbours ask again and again for a simple meal: the bistro staff, the graveyard keeper, and the night watchman.
The repeating quests take turns in a fixed order.

The feature also makes the economy more generous.
A mistake must not put the purse in danger. So the balance band becomes 0 to 20%, and each preparation costs 10% less.

The feature covers these parts:

- the rule that opens a repeating quest, and the order of the repeating quests;
- the reward and the size of a repeating quest;
- the graveyard keeper, a new regular with one campaign quest;
- the optional save record of the repeating quests;
- the balance band and the preparation costs;
- the content checks and the campaign balance test.

The feature does not include these parts:

- a timer, a deadline, or a penalty;
- new chains or new dishes;
- a completion scene, a journal entry, or a reward other than coins for a repeating quest.

## Work

A quest has work if the player can act on the quest on the current day.

- An open campaign quest, the supper quest, and an open recovery quest have work.
- The booked quest of the evening guest has work until its delivery. The player can cook, light the lanterns, or deliver.
- A booked quest for another evening has work only while a portion is missing from the board.
  The booked meals for later evenings share no portion. The board must hold the portions of all of them together.

The bistro has no work if no open quest has work and the next preparation is not ready to pay.
A repeating quest does not count in this rule.

## Repeating quests

The game data gives the repeating quests in their cycle order.

- If the bistro has no work, the next repeating quest opens. The quest gets the first free ticket.
- At most one repeating quest is open at a time.
- An open repeating quest stays open until the player delivers it.
- After a delivery, if the bistro still has no work, the next repeating quest opens in the same change.
- The next repeating quest comes after the last delivered quest, in cycle order. It is the first quest that can join the cycle.
  In a new game, the cycle starts at the first quest.
- A repeating quest can join the cycle if its character has arrived. The chain of each of its dishes must also be open.
- A repeating quest can also name a campaign quest. Then the repeating quest joins the cycle only after the delivery of that campaign quest.

A campaign quest gets a ticket before a repeating quest.
If a campaign quest opens and no ticket is free, the campaign quest takes the ticket of the repeating quest.
The repeating quest then waits without a ticket, and it gets the next free ticket. Its dishes stay on the board.

The recovery quest does not count the repeating quests. Its two cases use only the campaign quests and the supper quest.
An open recovery quest has work, so a repeating quest does not open while the recovery quest is open.
An open repeating quest stays open.

After the supper, the bistro has no other work. So the repeating quests continue after act 1.
The clock stays stopped, and the act 1 result does not change.

A repeating quest uses the usual ticket: the portrait, the name, the title, the dishes, and Deliver with the reward.
Its dialog shows one opening line of its character. The line does not introduce the character again.
When the quest gets a ticket, its dishes enter the recipe book, as for each quest.

The delivery of a repeating quest removes its portions, pays its reward, and moves the cycle to the next quest.
The delivery records nothing in the delivered quests, queues no scene, and adds no journal entry.
No preparation needs a repeating quest, and the funding check does not count a repeating quest.

## Reward and size

A repeating quest pays its menu value.
The menu value is the cost of the paid ingredients plus the work value. The formula of spec 012 has only these two parts.
So the reward pays back the ingredients and the work, and nothing more.

Each repeating quest is a simple meal:

- The quest needs at most 15 merges from its ingredients.
- The one-meal limits of `PRODUCT.md` apply. Each eater gets at most three portions, and one dish has at most two portions.
- The one-merge rule applies. The data check uses the dishes that the player surely knows when the quest can first join the cycle.

## The cycle

The rewards use the current levers.

| Order | Title | Character | Joins the cycle | Dishes | Merges | Reward |
| --- | --- | --- | --- | --- | ---: | ---: |
| 1 | Staff meal | Sorin, with Mara | New game | 2 Loaf, 2 Socată | 12 | 32 |
| 2 | Another cold night | Bela, the graveyard keeper | The delivery of `bela-warm-cup` | 1 Mămăligă, 1 Linden tea | 14 | 36 |
| 3 | Before the rounds | Cezar, the night watchman | The delivery of `cezar-long-night` | 1 Bean soup, 1 Loaf | 11 | 35 |

The staff meal feeds two eaters: Sorin, the bistro helper, and Mara, the bistro owner.
A companion is a visitor. A repeating quest can also have a core character as a companion.
Bela's opening line: "The graves send their regards. Mămăligă and a hot linden tea, please, before the night gets cold."
Cezar's quest includes Bean soup, one of his favourite dishes. So the favourite rule of spec 010 applies without an exception.
The player first surely knows Bean soup from `cezar-long-night`. So his quest follows that quest, and the one-merge rule holds.

## The graveyard keeper

Bela is a new regular. He is present from a new game.

| Regular | Trade | Favourite dishes | Reference |
| --- | --- | --- | --- |
| Bela | Graveyard keeper | Pogăcele, Linden tea | Bela Lugosi, who played Ygor, the grave robber, in *Son of Frankenstein* (film, 1939). Bela is Székely. He keeps the old churchyard and says good night to each grave |

- Bela has one campaign quest, `bela-warm-cup`, "A warm cup at the gate". The quest opens after preparation 2 and asks for 1 Pogăcele and 1 Linden tea. Its opening introduces him.
- Bela is not a guest of the supper. He sleeps through the day, and his smile unsettles the other guests. The supper guest list does not change.
- The neighbours list shows Bela from a new game, with his introduction.
- Bela has no diet.

The `regulars-3` atlas holds his portrait in cell 2. The `sketch-bela` master is his character sketch.
Each picture has records in `docs/asset-provenance.json` and `docs/asset-prompts.json`. The user accepted both pictures.

## Economy

The balance band of spec 012 becomes 0 to 20%.
The run spends coins on preparations, takes, and upkeep. The purse after the supper must hold 0 to 20% of these coins.

The material cost and the labour cost of each preparation decrease by 10%, rounded to whole coins.
The cost of each preparation stays the material cost plus the labour cost.
The total of the preparations is 5028 coins.

These results come from the fixture, with seed 1:

| Strategy | Purse after the supper | Share of the spending |
| --- | ---: | ---: |
| Efficient | 1010 of 8345 | 12.1% |
| Miss bookings | 1066 of 8389 | 12.7% |
| Debt | 8 of 8356 | 0.1% |

The efficient purse is near the middle of the band.
After each payment, the efficient purse holds 40 to 560 more coins than at the full estimates.

## Data and state

- `tools/create-original-data.ts` authors the repeating quests in cycle order and the lower preparation costs.
- `src/model.ts` gives whether the bistro has work, whether a repeating quest can join the cycle, and the next repeating quest.
- `src/model.ts` gives the open repeating quest a ticket after the campaign quests.
- `src/engine.ts` opens the next repeating quest in the change that removes the last work.
  The module also delivers a repeating quest and moves the cycle.
- `src/content.ts` checks that the data has at least three repeating quests, with at most 15 merges each.
  The module checks the one-meal limits and the one-merge rule of each repeating quest.
  The module also checks that at least one repeating quest can join the cycle in a new game.
- The state has an optional record of the repeating quests. The record holds the ID of the last delivered repeating quest and the ID of the open one.
  Each ID can be empty.
- A missing record means no repeating delivery and no open repeating quest.
  So a current save loads without a change, as for the optional record of the preparation blockers.
- The game state version and the envelope version do not change.
- Save validation rejects a record that names an unknown quest. The quest must be a repeating quest that can join the cycle.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.

## Owner contracts

- `PRODUCT.md` controls the work rule, the repeating quests, the optional save record, and the balance band.
- `docs/economy.md` gives the preparation costs and the measured results.

## Balance check

- The efficient strategy does not change. Its purse after the supper is inside the band of 0 to 20%.
- The miss-bookings strategy delivers repeating quests while the bistro has no work.
- The miss-bookings strategy cooks spare food only while it lets tonight's guest wait. Then the bistro has work, so no repeating quest opens.
- The efficient strategy and the debt strategy cook no dish that no quest needs.

## Acceptance checks

- No work: after preparation 8, the player delivers the window quests and serves Vlad. The player cooks Elisabeta's meal and Vlad's next meal. Then the player serves Elisabeta. The first repeating quest that can join the cycle opens.
- Work: each of these items prevents a repeating quest from opening:
  - a campaign quest with work;
  - a booked quest for another evening with a missing portion;
  - a preparation that is ready to pay;
  - an open recovery quest.
- Cycle: the deliveries follow the cycle order. The cycle skips a quest that cannot join the cycle. After a delivery with no work, the next quest opens in the same change.
- Bela: his repeating quest does not join the cycle before the delivery of `bela-warm-cup`. The data check rejects a repeating quest that names an unknown campaign quest.
- Tickets: a campaign quest that opens with no free ticket takes the ticket of the repeating quest. The repeating quest waits and gets the next free ticket.
- Delivery: the reward equals the menu value. The delivered quests, the scenes, and the journal do not change. No preparation needs the quest.
- Recovery: the repeating quests do not change the two cases of the recovery quest.
- Act 1: after the supper, the repeating quests open. The clock stays stopped, and the act 1 result does not change.
- Content: the data check rejects a repeating quest with more than 15 merges. The check rejects a repeating quest that breaks the one-meal limits or the one-merge rule. The check also rejects data without a repeating quest that can join the cycle in a new game.
- Save: a reload, an export, and an import keep the record. A save without the record loads. Save validation rejects an invalid record. A failed action does not change the record.
- Economy: each preparation cost equals its material cost plus its labour cost. The balance check passes for each seed and each strategy.
- Art: the asset test accepts Bela's portrait cell and his sketch with their records.
- Browser: the tests cover a repeating ticket in a state without work. The tests also cover its delivery and the next quest of the cycle. The tests also cover a campaign quest that takes the ticket. Phone and desktop in both themes.
