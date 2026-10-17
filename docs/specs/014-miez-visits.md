# 014: Miez's visits

Status: Proposed. Not implemented. Intervals, dish stages, and the blessing length below are draft defaults.
Owner: `PRODUCT.md` for the visit and reward rules; `DESIGN.md` for the request and the doubled-pay marker.

## Current evidence

- Miez, the resident black cat, is a sprite button (`#cat-button` in `index.html`).
  The button covers the left end of the windowsill in the front-room painting.
  Miez takes input only while the sill shows above the drawer. The Story sheet also holds a Miez card.
  The story card on wider screens does not show that card.
- In `src/app.ts`, the player can pet Miez, which toggles between a sitting sprite and a sleeping
  sprite. This is presentation only. `src/engine.ts` has no Miez rule, and the save has no Miez field.
- The story introduces Miez in preparation 2, "Mend the welcome board".
- `src/engine.ts` pays each delivered quest its authored `reward`. Nothing changes what a quest pays.
- The state has no random seed. The length of `completedQuests` is the count of deliveries.

## Outcome and scope

Sometimes Miez asks for a meal. She cannot pay, but a fed cat gives a blessing:
the next five quest deliveries pay double. The cat becomes part of play.

- Count the reward in deliveries, not in seconds. Use no timer, countdown, deadline, or
  real-time check. Closing the tab, reloading, or waiting changes nothing.
- Keep the three quest tickets. The request of Miez is a fourth request beside them. It does not take a ticket,
  and no preparation needs it.
- Keep unlimited energy and no purchases. The player has no penalty for ignoring the cat.
- Do not change authored quest rewards, sale prices, or preparation costs. The blessing multiplies the
  payout of a quest at delivery time only. The funding check of 006 stays true without the blessing.

## Proposed rules

1. Visits begin after preparation 2 is complete.
   That payment sets `due` to the delivery count plus an interval.
   The draft interval is 10 to 16 deliveries.
   An authored sequence or a seed that this feature adds gives the interval.
   The completion of preparation 2 selects that interval.
2. The visit of Miez begins in the same action as a successful delivery that reaches the `due`
   count. Her request is one dish of stage 2 or 3 from an unlocked chain. The player can use
   earned source outputs and merges to make it. That delivery selects the request.
   Only the actions in rules 1, 2, 7, and 8 select a Miez value.
3. Feeding Miez is one atomic action. It consumes the dish from the board, following the delivery
   rules of 005. A failed feed changes nothing.
4. Feeding pays no coins. Feeding does not count as a delivery.
   Feeding does not change `completedQuests`, the dish deliveries of 012, or a neighbour's delivered count from 013.
5. Feeding sets the blessing to five deliveries. While the blessing is above zero, each quest
   delivered pays twice its authored reward. The blessing drops by one.
6. The blessing applies to quest rewards only. It does not change sales or preparation costs.
7. While a visit waits or a blessing is active, no new visit becomes due.
   When the blessing reaches zero, the game selects a new interval, as in rule 1.
   The game sets `due` to the delivery count plus that interval.
   The delivery that ends the blessing selects that interval.
8. Miez waits as long as the player likes. Tickets, preparations, and every other action stay
   available. "Not now" ends the visit with no reward and no penalty. It schedules the next
   visit by rule 7, as if the blessing ended at that moment.
9. Repeated input, reload, import, and journal replay cannot feed her twice. They cannot grant a
   second blessing, and they cannot restore a used blessing.
10. No requests remain after the community supper, so no visit becomes due after it. A blessing that
    is active at the supper stays unused. Spec 012 decides whether post-campaign requests continue the visits.

## Presentation

Draft presentation. `DESIGN.md` decides the final placement at implementation.

- While the sill shows above the drawer: Miez on the sill sits up (she wakes if asleep). A small
  parchment bubble beside her holds the wanted dish, Feed, and Not now. Petting stays as it is.
- When the drawer covers the sill: the Story tab shows a small paw mark. The Miez card in the
  Story sheet shows the request with Feed and Not now. The three quest tickets do not move.
- During the blessing, Deliver on every ticket shows the doubled amount with a small
  crescent-paw marker and "×2". The status line counts down in deliveries: "Miez's luck:
  3 deliveries left". The delivery message names the doubled pay.
- The first visit plays a short original scene. A core character explains the custom.
- Use the existing sitting sprite. A begging pose is new mascot art. The begging pose needs the
  approval of the user for the asset and for each paid request. The pose is optional for the first slice.
- Keep motion short and respect reduced motion. Keep the cat glow in dark mode.

## Data and state

- Add `miez: { due: number; request: string | null; blessing: number }` to `GameState`.
  Add the seed or the position in the authored sequence that rules 1, 2, and 7 use.
  Put the rules in `src/engine.ts` and the presentation in `src/app.ts`. Put the visit scene and the
  draft constants in `tools/create-original-data.ts`.
- Validate these conditions:
  - `request` is null or a non-generator item of an unlocked chain at stage 2 or 3.
  - `blessing` is an integer from 0 to 5.
  - A request and a blessing are never both active.
  - `due` is an integer.

  Reject contradictory records on import. Do not replace the save.
- Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
  Start with no request and no blessing. Set the first due count when preparation 2 completes.
  Save and reload preserve the request, the blessing, the due count, and the draw position.

## Thin implementation slices

1. Engine visits, feeding, and the blessing. Exit: in a fixture game, a visit begins at its
   due count. Feeding doubles exactly the next five quest rewards. Failed feeds, Not now, and
   repeated input behave as specified. Reload is deterministic.
2. The request bubble, the phone card, and the doubled-pay marker. Exit: the player can see the
   request, feed Miez with keyboard and touch, and see how many lucky deliveries remain.
3. Balance with 006. Exit: the campaign fixture reports income with visits and without
   visits. The measurement sets the interval and the blessing length.

## Acceptance and evidence

- Engine: test the due count, the request stages and unlocked chains, and the atomic feed.
  Test that no visit begins before preparation 2 or after the supper. Test that feeding gives no delivery credit.
  Test exactly five doubled rewards and no double blessing. Test that no visit begins while one
  waits or a blessing runs. Test Not now. Test that the draw position changes only in successful actions.
- Save: fresh, mid-blessing, waiting-visit, and completed saves survive a save and a load.
  Import rejects malformed `miez` records and keeps the current save.
- Browser: follow [Verification and release](README.md#verification-and-release). Trigger a visit, feed Miez, deliver a doubled quest, and reload in
  the middle of the blessing. Check that the request bubble does not crowd the third quest ticket.

## Dependencies and remaining decisions

Slice 1 has no prerequisite specification.
The balance checks use 006. The first-visit scene uses 009.

The interval, dish stages, and blessing length remain open decisions.
Decide whether a seed or an authored sequence selects values.
Decide whether the Miez card shows a count of meals.
The campaign has 63 deliveries.
Measure the number of visits per campaign.
A doubled large reward, such as Ionatan's dinner, needs a balance decision.
Use the 006 fixture to adjust the balance.
