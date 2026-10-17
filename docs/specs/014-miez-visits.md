# 014: Miez's visits

Status: Proposed. Not implemented. Intervals, dish stages, and the blessing length below are draft defaults.
Owner: `PRODUCT.md` for the visit and reward rules; `DESIGN.md` for the request and the doubled-pay marker.

## Current evidence

- Miez, the resident black cat, is a sprite button (`#cat-button` in `index.html`) over the left
  end of the windowsill in the front-room painting.
  Miez takes input only while the sill shows above the drawer. The Story sheet also holds a Miez card.
  The story card on wider screens does not show that card.
- In `src/app.ts`, the player can pet Miez, which toggles between a sitting sprite and a sleeping
  sprite. This is presentation only. `src/engine.ts` has no Miez rule, and the save has no Miez field.
- The story introduces Miez in preparation 2, "Mend the welcome board".
- `src/engine.ts` pays each served order its stored `reward`. `validateGame` checks the `reward`
  against `orderReward`. Nothing changes what an order pays.

## Outcome and scope

Sometimes Miez asks for a meal. She cannot pay, but a fed cat gives a blessing:
the next five ordinary orders pay double. The cat becomes part of play and not only decoration.
The mascot of the bistro gives the game a feature of its own.

- Count the reward in served orders, not in seconds. Use no timer, countdown, deadline, or
  real-time check. Closing the tab, reloading, or waiting changes nothing.
- Keep three ordinary orders. The request of Miez is a fourth request beside them. It is not an
  order slot.
- Keep unlimited energy and no purchases. The player has no penalty for ignoring the cat.
- Do not change order rewards, sale prices, or preparation costs. The blessing multiplies the
  payout of an order at service time only.

## Proposed rules

1. Visits begin after preparation 2 is complete. When the player completes preparation 2, the
   game sets `due` to `served` plus a seeded interval of 10 to 16 (draft). The completion of
   preparation 2 draws that interval.
2. The visit of Miez begins in the same action as a successful service that reaches the `due`
   count. Her request is one dish of stage 2 or 3 from an unlocked chain. Feeding her therefore
   takes at least one merge. That service draws the request. Only the actions in rules 1, 2,
   7, and 8 draw a Miez value from the seed.
3. Feeding Miez is one atomic hand-in. It consumes the dish from the board, following the rules
   for ordinary orders. A failed feed changes nothing.
4. Feeding pays no coins and no experience points (XP). Feeding does not count as service.
   Feeding adds nothing to `served` or to the 006 goals. Feeding adds nothing to the dish service
   of 012 or to the count of a neighbour from 013.
5. Feeding sets the blessing to five orders. While the blessing is above zero, each ordinary order
   served pays twice its stored reward. The blessing drops by one.
6. The blessing applies to ordinary orders only. It does not change quest rewards (005), level
   rewards (004), sales, preparation costs, or XP.
7. While a visit waits or a blessing is active, no new visit becomes due. When the blessing
   reaches zero, the game sets `due` to `served` plus a new seeded interval, as in rule 1. The
   service that ends the blessing draws that interval.
8. Miez waits as long as the player likes. Orders, preparations, and every other action stay
   available. "Not now" ends the visit with no reward and no penalty. It schedules the next
   visit by rule 7, as if the blessing ended at that moment.
9. Repeated input, reload, import, and journal replay cannot feed her twice. They cannot grant a
   second blessing, and they cannot restore a used blessing.
10. Visits continue after the community supper, with ordinary orders.

## Presentation

Draft presentation. `DESIGN.md` decides the final placement at implementation.

- While the sill shows above the drawer: Miez on the sill sits up (she wakes if asleep). A small
  parchment bubble beside her holds the wanted dish, Feed, and Not now. Petting stays as it is.
- When the drawer covers the sill: the Story tab shows a small paw mark. The Miez card in the
  Story sheet shows the request with Feed and Not now. The three order tickets do not move.
- During the blessing, the ticket of every waiting order shows the doubled amount with a small
  crescent-paw marker and "×2". The status line counts down in orders: "Miez's luck:
  3 orders left". The service message names the doubled pay.
- The first visit plays a short original scene. A core character explains the custom.
- Use the existing sitting sprite. A begging pose is new mascot art. The begging pose needs the
  approval of the user for the asset and for each paid request. The pose is optional for the first slice.
- Keep motion short and respect reduced motion. Keep the cat glow in dark mode.

## Data and state

- Add `miez: { due: number; request: string | null; blessing: number }` to `GameState`.
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
  Save and reload preserve the request, blessing, due count, and seed.

## Thin implementation slices

1. Engine visits, feeding, and the blessing. Exit: on the fixture seed, a visit begins at its
   due count. Feeding doubles exactly the next five orders. Failed feeds, Not now, and
   repeated input behave as specified. Reload is deterministic.
2. The request bubble, the phone card, and the doubled-pay marker. Exit: the player can see the
   request, feed Miez with keyboard and touch, and see how many lucky orders remain.
3. Balance with 006. Exit: the full-campaign fixture reports income with visits and without
   visits. The measurement sets the interval and the blessing length.

## Acceptance and evidence

- Engine: test the due count, the request stages and unlocked chains, and the atomic feed.
  Test that no visit begins before preparation 2. Test that feeding gives no service credit.
  Test exactly five doubled orders and no double blessing. Test that no visit begins while one
  waits or a blessing runs. Test Not now. Test that the seed changes only in successful actions.
- Save: fresh, mid-blessing, waiting-visit, and completed saves survive a save and a load.
  Import rejects malformed `miez` records and keeps the current save.
- Browser: follow [Verification and release](README.md#verification-and-release). Trigger a visit, feed Miez, serve a doubled order, and reload in
  the middle of the blessing. Check that the request bubble does not crowd the third order ticket.

## Dependencies and remaining decisions

Slice 1 has no hard dependency. Balance integrates with 006. The first-visit scene uses 009.

Open decisions: the interval, the dish stages, the blessing length, and whether the Miez card shows a
count of feedings. Tune with the 006 fixture.
