# 011: Motion choice

Status: Implemented. Priority: Medium. Dependencies: none.
Owner: `PRODUCT.md` controls the motion choice. `DESIGN.md` controls the Options Motion section and the reduced-motion rules.

## Current behavior

Options has a Motion section after Appearance. It has three options: System, Reduced, and Full.

- **System** follows the `prefers-reduced-motion` media query of the device. This is the default.
- **Reduced** removes every animation and transition on all devices.
- **Full** plays every animation and transition, also when the device asks for reduced motion.

The game does not show a notice about the device setting. The game has no start screen.
The note under the Motion legend tells the player if the device asks for less motion.
The note updates when the device setting changes while Options is open.

## Rules

1. The browser stores the choice under `scary-snacks-motion`, as it stores the appearance choice.
   The game save does not hold the choice. Export and import do not include the choice.
   A new game keeps the choice.
2. `src/app.ts` sets `data-motion` on the root element to the choice.
   The function `still()` gives the result: Reduced, or System on a device that asks for reduced motion.
   Each motion in `src/app.ts` asks `still()` at the time that the motion starts.
   When reduced motion becomes active, running script animations finish at once.
   Their cleanup and delivery notices still complete.
   When full motion returns, earlier board, ticket, coin, and notice entrance effects do not replay.
3. `src/style.css` removes animations and transitions under `:root[data-motion='reduced']`.
   Under `prefers-reduced-motion: reduce`, it removes them on each root that is not `[data-motion='full']`.
   Before the script runs, the root has no `data-motion`, so the device setting applies.
4. If browser storage is unavailable, the choice applies for this visit.
   The status line says "Motion changed for this session. Browser storage is unavailable."

## Out of scope

- A start screen before the board. It adds one tap to each visit.
- A notice about the device setting.

## Acceptance checks

Browser tests in `tests/browser/game.spec.ts`:

- Under emulated reduced motion, Full plays the delivery flight and the button transitions.
  The choice stays after a reload and after a new game.
- Without the emulation, Reduced removes the delivery flight and the button transitions.
  System then follows the emulation.
- Options lists the Motion section after Appearance.
- A blocked storage getter or write keeps the choice for this visit and reports the storage failure.
- A change to Reduced, or to the device setting under System, ends a running delivery flight.
  The delivery notice still appears once.
- A painting that finishes loading after reduced motion becomes active does not start a fade.
- The device note updates while Options stays open, without a change of focus.
- Full does not replay a delivery that completed under Reduced.
