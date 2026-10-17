# 013: Neighbourhood regulars

Status: Proposed. Not implemented. Roster size, arrivals, and tastes below are draft defaults.
Owner: `PRODUCT.md` for the cast and order rules; `DESIGN.md` for portraits and the neighbours page.

In this spec, a neighbour is a core character or a regular. A customer is a neighbour who has an order.

## Current evidence

- `tools/create-original-data.ts` defines four ordinary customers: Mara, Ilie, Eszter, and Sorin. It also defines four quest-only visitors: Adrian, Monica, Janos, and Ionatan.
- In `makeOrder` (`src/engine.ts`), the game picks the requirements first. Then it picks a customer
  at random from the ordinary customers that do not wait. Three orders wait at the counter at all times.
- With four ordinary customers, the replacement of a served order excludes all three current customers.
  This includes the departing neighbour. The fourth person therefore always fills the replacement.
  A bistro with four customers does not look like a business.
- `validateGame` accepts an order only if its customer is a known ordinary customer.
- The `portraits` master holds the four core portraits. The `visitor-portraits` master holds the four visitor portraits.

## Outcome and scope

The bistro serves a growing neighbourhood. New regulars arrive as the renovation progresses.
Each regular has a name, a trade, a portrait, and an authored taste that shapes the orders of that
regular. The player can find who lives nearby and what they like.

- Keep Mara, Ilie, Eszter, and Sorin as the four core characters. They drive the story,
  the preparations, and the quests in 005. Regulars add customers. They do not replace the core
  characters.
- Keep three orders at the counter, the layout of the order tickets, and the order reward formula.
  A measured balance decision under 006 owns reward changes.
- Keep unlimited energy, no waiting, and no expiry. A regular never leaves an order unserved.
  A regular never sulks, queues, or charges a penalty. Play earns the arrival. Time does not.
- Do not add a currency, purchases, a backend, a dependency, or imported game content.

## Proposed rules

1. The roster has 16 neighbours: the four core characters and 12 regulars.
2. Draft arrival schedule: four regulars are present from the start, so a new game has eight
   neighbours. Two more regulars arrive after the last preparation of each chapter from 1 to 4.
   These are preparations 4, 8, 12, and 16. The full roster is present from chapter 5.
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
    the served count. A neighbour who has not arrived appears as a "not yet" outline without a
    name. The page therefore does not spoil later chapters.
12. Thank-you lines stay per neighbour (three each). The game chooses them as the current game does.

## Draft roster

Names, trades, and tastes are draft content. Portrait descriptions keep the grounded,
everyday Romanian-neighbour styling of the current four. Exact lines are content decisions.

| Arrives | Regular | Trade | Preferred chains |
| --- | --- | --- | --- |
| Start | Doina | Schoolteacher | bakery, drinks |
| Start | Vasile | Retired postman | warm, bakery |
| Start | Ana | Night-shift nurse | warm, drinks |
| Start | Tibor | Clockmaker | sweet, drinks |
| After preparation 4 | Rodica | Florist | sweet, produce |
| After preparation 4 | Matei | Music student | bakery, sweet |
| After preparation 8 | Ileana | Seamstress | produce, drinks |
| After preparation 8 | Grigore | Night watchman | warm, produce |
| After preparation 12 | Katalin | Church bell-ringer | sweet, warm |
| After preparation 12 | Radu | Bus driver | bakery, warm |
| After preparation 16 | Elena | Pharmacist | produce, drinks |
| After preparation 16 | Andrei | Carpenter | warm, produce |

The night-shift nurse, the watchman, and the bell-ringer add a slightly eerie side to the
village. They are awake when the bats are. Tibor is present from the start, but his sweet
chain unlocks at preparation 3. Rodica arrives before the produce chain unlocks at preparation 6.
Rule 5 therefore matters for their early orders.

## Data and state

- Extend `Character` in `src/engine.ts` with `core: boolean`, `arrivesAfter?: string`,
  `prefers: string[]`, and `arrival` dialogue. Author the records in `tools/create-original-data.ts`.
  Validate unique IDs, known chain IDs, known preparation IDs, and two distinct preferences.
- Add `recentCustomers` (at most two IDs) and `servedBy` (count for each neighbour) to `GameState`.
- `validateGame` also requires that the customer of each waiting order has arrived.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
  Validate and persist the new fields. Do not infer a history for each neighbour from the service total.
- A change to the draw order changes the order sequence for a given seed. The game keeps saved
  waiting orders. Only orders that the game creates after the update use the new rules.

## Art

- The 12 regulars need new portraits in the same style, framing, and scale as the
  `portraits` master. The likely route is one new master (draft ID `portraits-regulars`).
- Generate the master through the repository art skill. Get the approval of the user first for
  each new asset ID and each paid request. Before you propose a portrait, examine it at full size
  for coherent anatomy and clothing. Say what you checked.
- To add a master, follow "Add a new bitmap" in
  `integration.md` of the repository skill `generate-game-art`. Update the provenance records and the prompt
  records. Make the `assets:build` variants. Update the asset test count. Update the bitmap count
  in `PRODUCT.md`, `DESIGN.md`, `README.md`, and `AGENTS.md`.
- Until the art is in the asset records, a slice with the engine only may ship with only the four core
  portraits. Do not ship a regular with a placeholder portrait or a borrowed portrait.

## Thin implementation slices

1. Roster data, arrival, preferences, and the rest rule in the engine, with four start
   regulars. Exit: on the fixture seed, a fresh game shows eight distinct customers within its
   first 20 orders. Every created order is makeable. Reload keeps waiting orders.
2. Portrait art and order tickets for the start regulars. Exit: the
   player can read the name and the portrait of each regular at the counter. This applies in both
   themes and at both sizes.
3. Chapter arrivals with their scenes. Exit: completing preparation 4 introduces Rodica and
   Matei once. The introduction survives reload. The introduction never reprices or replaces a
   waiting order.
4. The neighbours page. Exit: arrived neighbours show tastes and counts. Later neighbours stay
   hidden.

## Acceptance and evidence

- Engine: test arrival gating for each preparation, different people at the counter, and the
  rest rule with its relaxation. Test preference draws over a seeded sample and locked preferred
  chains. Test that no order is unmakeable. Test that failed actions change no count, rest list,
  or seed. Test that replay is deterministic.
- Save: test fresh, mid-campaign, and completed saves of the current game state version.
  Import rejects an order whose customer has not arrived. Repeated reload gives an identical
  result. Failed imports keep the current save.
- Browser: follow [Verification and release](README.md#verification-and-release). Serve a regular, complete an arrival preparation, reload, and
  open the neighbours page. Check that the portraits and names fit the order tickets at every size.

## Dependencies and remaining decisions

Slice 1 has no hard dependency. Arrival scenes use 009 when integrated. Quests in 005 stay
with the four core characters. 008 may let the finale name the regulars who arrived. The challenges in 012 stay with the core four.

Open decisions: the final roster size, the arrival spacing, the 2/3 preference weight, and the
rest length. Measure each one in a simulation of legal actions.
