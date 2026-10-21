# 011: Motion choice

Status: Implemented.

## Behavior

Options has a Motion section after Appearance. The section has three options: System, Reduced, and Full.

- **System** follows the `prefers-reduced-motion` media query of the device. System is the default.
- **Reduced** removes every animation and transition on all devices.
- **Full** plays every animation and transition, even if the device asks for reduced motion.

The note under the Motion legend tells the player if the device asks for less motion.
The note is the only message about the device setting.
The note updates when the device setting changes while Options is open.

## Rules

1. The browser stores the choice under `scary-snacks-motion`, in the same way as the appearance choice.
   The game save does not hold the choice. Export and import do not include the choice.
   A new game keeps the choice.
2. `src/preferences.ts` sets `data-motion` on the root element to the choice.
   The function `still()` gives the result: Reduced, or System on a device that asks for reduced motion.
   Each motion in the interface modules asks `still()` when the motion starts.
   When reduced motion becomes active, the script animations that run finish immediately.
   Their cleanup and delivery notices complete.
   When full motion returns, the entrance effects that reduced motion hid do not replay.
   These effects are on the board, the tickets, the coins, and the notices.
3. `src/style.css` removes animations and transitions under `:root[data-motion='reduced']`.
   Under `prefers-reduced-motion: reduce`, the stylesheet removes them on each root that is not `[data-motion='full']`.
   Before the script runs, the root has no `data-motion`, so the device setting applies.
4. If browser storage is unavailable, the choice applies for this visit.
   The status line says "Motion changed for this session. Browser storage is unavailable."

## Acceptance and evidence

Browser tests in `tests/browser/game.spec.ts`:

- Under emulated reduced motion, Full plays the delivery flight and the button transitions.
  The choice stays after a reload and after a new game.
- Without the emulation, Reduced removes the delivery flight and the button transitions.
  System then follows the emulation.
- Options lists the Motion section after Appearance.
- A blocked storage getter or write keeps the choice for this visit and reports the storage failure.
- A change to Reduced, or to the device setting under System, ends a delivery flight that runs.
  The delivery notice appears once.
- A painting that finishes its load after reduced motion becomes active does not start a fade.
- The device note updates while Options stays open, without a change of focus.
- Full does not replay a delivery that completed under Reduced.
