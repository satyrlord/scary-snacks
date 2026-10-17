# 013: Neighbourhood regulars

Status: Proposed. Vlad and Elisabeta are implemented. The other regulars are not implemented. Roster size, arrivals, and tastes below are draft defaults.
Owner: `PRODUCT.md` for the cast and order rules; `DESIGN.md` for portraits and the neighbours page.

In this spec, a neighbour is a core character or a regular. A customer is a neighbour who has an order.

## Current evidence

- `tools/create-original-data.ts` defines four ordinary customers: Mara, Ilie, Eszter, and Sorin.
  It defines two occasional customers: Vlad and Elisabeta. It also defines six quest-only visitors:
  Adrian, Monica, Janos, Ionatan, Mina, and Avram.
- In `makeOrder` (`src/engine.ts`), the game picks the requirements first. Then it picks a customer
  at random from the ordinary customers that do not wait. Three orders wait at the counter at all times.
- Vlad and Elisabeta order only items from their `orderItems` list: meat cabbage rolls, goulash, and red wine.
  Their list opens after preparation 15. Each new ticket with an eligible noble then has a one-in-eight
  chance to go to a noble. The nobles get no new tickets during the Mina and Avram visit.
- With four ordinary customers, the replacement of a served order excludes all three current customers.
  This includes the departing neighbour. Before preparation 15, the fourth person therefore always fills the replacement.
  A bistro with four customers does not look like a business.
- `validateGame` accepts an order only if its customer is a known customer who is not a visitor.
  A noble's order must use only items from the `orderItems` list of that noble.
- The `portraits` master holds the four core portraits. The `visitor-portraits` master holds the portraits of Adrian,
  Monica, Janos, and Ionatan. The `guests` master holds the portraits of Vlad, Elisabeta, Mina, and Avram.

## Outcome and scope

The bistro serves a growing neighbourhood. New regulars arrive as the renovation progresses.
Each regular has a name, a trade, a portrait, and an authored taste that shapes the orders of that
regular. The player can find who lives nearby and what they like.

- Keep Mara, Ilie, Eszter, and Sorin as the four core characters. They drive the story,
  the preparations, and the quests in 005. Regulars add customers. They do not replace the core
  characters.
- Only the four core characters are generic neighbours. Each regular refers to a famous horror novel,
  a horror film, or local folklore.
- Keep three orders at the counter, the layout of the order tickets, and the order reward formula.
  A measured balance decision under 006 owns reward changes.
- Keep unlimited energy, no waiting, and no expiry. A regular never leaves an order unserved.
  A regular never sulks, queues, or charges a penalty. Play earns the arrival. Time does not.
- Do not add a currency, purchases, a backend, a dependency, or imported game content.

## Proposed rules

1. The roster has 16 neighbours: the four core characters and 12 regulars. Vlad and Elisabeta are two of the 12 regulars.
2. Draft arrival schedule: four regulars are present from the start, so a new game has eight
   neighbours. Two more regulars arrive after the last preparation of each chapter from 1 to 3.
   These are preparations 4, 8, and 12. Vlad and Elisabeta can order after preparation 15, when their
   order list opens. The full roster is present from chapter 5.
3. Each regular records an `arrivesAfter` preparation ID or none. The game derives arrival from
   completed preparations and does not save it. The game can choose only arrived neighbours for
   an order.
4. Arrival does not reroll, replace, or reprice waiting orders. A new regular appears the next
   time the game creates an order.
5. Each neighbour has two authored preferred chains. A requirement draws from a chain as follows:
   - If at least one preferred chain is unlocked, the requirement draws from an unlocked
     preferred chain with draft probability 2/3. With the remaining probability, it draws from
     any unlocked chain.
   - If no preferred chain is unlocked, the requirement draws from any unlocked chain.

   Every requirement stays makeable with chains already unlocked.
6. Author the taste of each person from their trade and story. Never derive taste from the
   appearance or age of a neighbour. Never derive taste from an inferred ethnic or national identity.
7. `makeOrder` chooses the customer first and then the requirements. The neighbours that wait at
   the counter are always different people.
8. A neighbour served in the last two orders rests. The game does not choose that neighbour
   again until it creates two other orders. If resting leaves no eligible neighbour, the rest
   rule relaxes first. The rule of different people never relaxes.
9. Successful service adds one to the served count of that neighbour. Failed service, sale,
   generation, and story replay change no count, no rest list, and no seed.
10. The arrival of each regular plays a short original scene. A core character introduces the
    regular. The regular answers in one or two lines. The scene joins the continuation
    system from 009 when integrated. Reading or skipping the scene does not change arrival.
11. A neighbours page in the journal lists every arrived neighbour.
    Each entry shows the portrait, the name, the trade, the preferred dishes as chain names, and
    the served count. For Vlad and Elisabeta, the entry shows their order list. A neighbour who has
    not arrived appears as a "not yet" outline without a name. The page therefore does not spoil later chapters.
12. Thank-you lines stay per neighbour (three each). The game chooses them as the current game does.
13. Vlad and Elisabeta keep the order rules in `PRODUCT.md`: their order list, the one-in-eight chance,
    and no new tickets during the Mina and Avram visit. Rules 3 and 5 do not apply to them.
    Their order list opens after preparation 15 and sets their arrival.

## Draft roster

Names, trades, and tastes are draft content. Portrait descriptions keep the grounded,
everyday Romanian-neighbour styling of the current four. Exact lines are content decisions.

Each reference is in the name, the trade, or one habit of the regular.
A reference never copies text, a plot, or a design from the work.

| Arrives | Regular | Trade | Preferred chains | Reference |
| --- | --- | --- | --- | --- |
| Start | Dochia | Shepherdess | warm, bakery | Baba Dochia, the old woman of March who sheds her nine sheepskins (Romanian folklore) |
| Start | Victor | Anatomy student | warm, drinks | *Frankenstein* (Mary Shelley, 1818) |
| Start | Ana | Night-shift nurse | warm, drinks | She leaves garlic at the ward door on Saint Andrew's Eve, when the strigoi walk (Romanian folklore) |
| Start | Costel | Clock and automaton maker | sweet, drinks | *The Sandman* (E. T. A. Hoffmann, 1816) |
| After preparation 4 | Sânziana | Florist | sweet, produce | The Sânziene, the midsummer flower fairies. She weaves bedstraw crowns on 24 June (Romanian folklore) |
| After preparation 4 | Dorian | Portrait painter who never seems to age | sweet, drinks | *The Picture of Dorian Gray* (Oscar Wilde, 1890) |
| After preparation 8 | Ileana | Seamstress | produce, drinks | She finishes every spindle before Maundy Thursday, for fear of Joimărița, who punishes idle spinners (Romanian folklore) |
| After preparation 8 | Cezar | Night watchman who seems to sleepwalk his rounds | warm, produce | *The Cabinet of Dr. Caligari* (film, 1920) |
| After preparation 12 | Cătălina | Church bell-ringer | sweet, warm | She rings the bell against hailstorms and the solomonari who ride the storm clouds (village custom) |
| After preparation 12 | Bran | Night-bus driver who rides a horse on his days off | bakery, warm | The Headless Horseman of *The Legend of Sleepy Hollow* (Washington Irving, 1820) |
| After preparation 15 | Vlad | Local baron | Order list: meat cabbage rolls, goulash, red wine | Implemented |
| After preparation 15 | Elisabeta | Visiting countess | Order list: meat cabbage rolls, goulash, red wine | Implemented |

The night-shift nurse, the night watchman, and the bell-ringer add a slightly eerie side to the
village. They are awake when the bats are. Costel is present from the start, but his sweet
chain unlocks at preparation 3. Sânziana arrives before the produce chain unlocks at preparation 6.
Rule 5 therefore matters for their early orders.

## Data and state

- Extend `Character` in `src/engine.ts` with `core: boolean`, `arrivesAfter?: string`,
  `prefers: string[]`, and `arrival` dialogue. Author the records in `tools/create-original-data.ts`.
  Validate unique IDs, known chain IDs, known preparation IDs, and two distinct preferences.
  Vlad and Elisabeta keep `occasional`, `orderItems`, and `absentDuringQuest` instead of `arrivesAfter` and `prefers`.
- Add `recentCustomers` (at most two IDs) and `servedBy` (count for each neighbour) to `GameState`.
- `validateGame` also requires that the customer of each waiting order has arrived.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
  Validate and persist the new fields. Do not infer a history for each neighbour from the service total.
- A change to the draw order changes the order sequence for a given seed. The game keeps saved
  waiting orders. Only orders that the game creates after the update use the new rules.

## Art

- The 10 regulars without art need new portraits in the same style, framing, and scale as the
  `portraits` master. The likely route is one new master (draft ID `portraits-regulars`).
  Vlad and Elisabeta keep their portraits in the `guests` master.
- Generate the master through the repository art skill. Get the approval of the user first for
  each new asset ID and each paid request. Before you propose a portrait, examine it at full size
  for coherent anatomy and clothing. Say what you checked.
- To add a master, follow "Add a new bitmap" in
  `integration.md` of the repository skill `generate-game-art`. Update the provenance records and the prompt
  records. Make the `assets:build` variants. Update the asset test count. Update the bitmap count
  in `PRODUCT.md`, `DESIGN.md`, `README.md`, and `AGENTS.md`.
- Until the art is in the asset records, a slice with the engine only may ship with only the core
  and guest portraits. Do not ship a regular with a placeholder portrait or a borrowed portrait.

## Thin implementation slices

1. Roster data, arrival, preferences, and the rest rule in the engine, with four start
   regulars. Exit: on the fixture seed, a fresh game shows eight distinct customers within its
   first 20 orders. Every created order is makeable. Reload keeps waiting orders.
2. Portrait art and order tickets for the start regulars. Exit: the
   player can read the name and the portrait of each regular at the counter. This applies in both
   themes and at both sizes.
3. Chapter arrivals with their scenes. Exit: completing preparation 4 introduces Sânziana and
   Dorian once. The introduction survives reload. The introduction never reprices or replaces a
   waiting order.
4. The neighbours page. Exit: arrived neighbours show tastes and counts. Later neighbours stay
   hidden.

## Acceptance and evidence

- Engine: test arrival gating for each preparation, different people at the counter, and the
  rest rule with its relaxation. Test preference draws over a seeded sample and locked preferred
  chains. Test that no order is unmakeable. Test that failed actions change no count, rest list,
  or seed. Test that replay is deterministic. Test that Vlad and Elisabeta keep their order list and their absence during the Mina and Avram visit.
- Save: test fresh, mid-campaign, and completed saves of the current game state version.
  Import rejects an order whose customer has not arrived. Repeated reload gives an identical
  result. Failed imports keep the current save.
- Browser: follow [Verification and release](README.md#verification-and-release). Serve a regular, complete an arrival preparation, reload, and
  open the neighbours page. Check that the portraits and names fit the order tickets at every size.

## Dependencies and remaining decisions

Slice 1 has no hard dependency. Arrival scenes use 009 when integrated. Quests in 005 stay
with the four core characters. 008 may let the finale name the regulars who arrived. The challenges in 012 stay with the core four.

Open decisions: the final roster size, the arrival spacing, the 2/3 preference weight, the
rest length, and whether Vlad and Elisabeta keep the one-in-eight chance in the larger roster.
Measure each one in a simulation of legal actions.
