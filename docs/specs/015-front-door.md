# 015: The front door

Status: Proposed. Not implemented. Wording, layout, and the motion notice below are draft defaults.
Owner: `PRODUCT.md` for the start flow and the motion choice; `DESIGN.md` for the front door,
the House book Motion section, and every reduced-motion rule; `README.md` for the controls.

## Current evidence

- The page opens straight onto the board. `src/app.ts` fetches `data/game.json`, loads the save,
  renders, and writes a welcome line or a first-merge line into Mara's line. Until the data arrives, the
  board is empty and Mara's line reads "Opening the kitchen…".
- If the game cannot load the save, `src/app.ts` opens the House book over the board at once.
- If the data fails to load, Mara's line reads "The kitchen could not open." with the reason.
  The Find a match button becomes "Try again" and reloads the page.
- `src/app.ts` holds the media query `prefers-reduced-motion: reduce` in the constant `still`.
  It does not listen for changes to the query. `src/style.css` switches
  every animation and transition off under the same media query. The game never tells the player
  about this, and nothing in the game can change it.
- Windows sets this preference when "Animation effects" is off or the system is set for best
  performance. Remote desktop sessions and some phone power-saving modes do the same. Many players
  with the preference on do not know that it is on. These players miss the serve flight, the
  rising neighbours, the first-taste flourish, and the bats, without an explanation.
- The House book holds level rewards, decorations, appearance, sound, the saved game, About, and a new game.
  It is the only menu of the game and stays so.

## Outcome and scope

A short front door greets the player on every visit. It shows the room as it stands, the wordmark,
the progress of the game, and one button into the kitchen. The front door is also where a player
learns that their device asks for less motion. The player can choose the full motion in one tap.

- One tap, click, or Enter opens the kitchen. Use no timer, no splash delay, no animation that
  must finish first, and no second screen.
- The House book stays the only settings menu. The front door links to the House book and does
  not copy it.
- Add a Motion choice to the House book: System, Reduced, and Full. System stays the default, so
  nothing changes for a player who never chooses.
- Add no new bitmap. The front door reuses the room painting variants that the room already loads.
- Make no change to game state, no save migration, and no engine rule. The browser stores the
  motion choice as a preference, like the appearance choice.

## Proposed rules

1. The front door shows on every page load, before the board accepts input. The game behind the
   front door is rendered but inert, so opening the kitchen shows the board at once.
2. The front door shows the room as it stands. It shows the painting that the room shows for the
   completed preparations. A fresh game shows `front-room-00`. It never previews an unearned room
   (the Covered Dish Rule).
3. A state line names the progress of the game. A fresh game shows "A new bistro". Any other game
   shows "Chapter C · name" and "P of 24 preparations done". C is the number of the current
   chapter, and P is the number of completed preparations. Text from the save uses `textContent`.
4. The primary button reads "Open the kitchen" for a fresh game and "Back to the kitchen" for a
   saved game. "Continue" stays reserved for dialogue. While the data loads, the button is
   disabled and reads "Opening the kitchen…". If the data fails, the front door shows the existing
   failure message and the "Try again" button instead.
5. A secondary "House book" button opens the existing House book. Closing the House book returns
   to the front door. "Start a new game" stays in the House book only, behind its confirmation.
6. If the game cannot load the save, the front door shows the save error and points to the House
   book. The House book does not open over the board for this error.
7. Opening the kitchen moves focus to the first occupied cell of the board. Opening the kitchen
   also writes the usual welcome line or first-merge line into Mara's line. Pressing Escape on the
   front door does nothing. The front door has no close button, only its way in.
8. The game stores the motion choice under `scary-snacks-motion` in browser storage:
   - **System** follows `prefers-reduced-motion`. This is the default.
   - **Reduced** switches motion off as reduced motion does in the current game, regardless of the device setting.
   - **Full** plays every animation, regardless of the device setting.

   A new game keeps the choice, like the appearance choice. The game save does not hold the
   choice. The game does not export or import the choice.
9. Motion notice. The front door shows a notice under the state line. This happens only if the
   choice is System and the device asks for reduced motion. The notice reads, for example:
   "Your device asks for less motion, so dishes won't fly to the counter and the bats stay home."
   The notice has two buttons: "Show the motion" (sets Full) and "Keep it still" (sets Reduced).
   The notice also has the line "You can change this any time in the House book." Each button
   stores an explicit choice. After an explicit choice, the notice does not return. If the player
   ignores the notice, the player sees it again on the next visit.
10. The notice is information, not an alarm. It has no warning icon and no error colour, and it
    never blocks the primary button. The game does not show the notice after an explicit choice.
    The game also does not show the notice if the device does not ask for reduced motion.
11. The House book Motion section uses the segmented choice of Appearance. Its text follows the
    device: "Your device asks for less motion." or "System follows your device's motion setting."
12. If browser storage is unavailable, a motion choice applies for this visit. The status says
    so, with the same wording as the appearance fallback.

## Presentation

Draft presentation. `DESIGN.md` decides the final layout at implementation.

- A full-viewport layer in Parchment covers the inert game. The painting sits at the top.
  The painting is a crop of the 3:4 room painting (draft). The crop keeps Miez on the sill, as in
  the room. Below the painting are these items, in order:
  1. The wordmark at display size, with the tagline.
  2. The state line.
  3. The motion notice, if it applies.
  4. The two buttons.
- The page keeps one h1. In the first option, the masthead wordmark stays the h1, and the large
  wordmark of the front door is decorative. In the second option, the front door holds the
  masthead. Decide at implementation.
- The front door fits 1440×900 and 390×844 without scrolling, with the notice shown. On phones
  the buttons sit in the lower part of the screen, and the primary button is full width.
- Both themes are authored: cream and parchment by day, lamplight by night. Never tint the painting.
- Opening the kitchen may fade the layer out over at most 200ms. The fade never delays input.
  Reduced motion (System with the device setting, or Reduced) removes the fade.

## Implementation notes

- `src/app.ts`: replace the constant `still` with a check that combines the stored choice and the
  media query. Listen for changes to both. Set `data-motion` on the root element, as the game sets
  `data-theme`.
- `src/style.css`: move the reduced-motion block to `:root[data-motion="reduced"]` and to
  `:root:not([data-motion="full"])` inside `@media (prefers-reduced-motion: reduce)`.
- `index.html`: add the front door markup, so that it shows before the script runs. Include the loading
  state from rule 4. Keep the Content Security Policy (CSP). Add no inline script and no inline style.
- Each `start()` helper in `tests/browser/` must pass the front door. Each browser test then changes once.

## Thin implementation slices

1. The Motion choice in the House book and the `data-motion` switch. Exit: Full plays the serve
   flight under emulated reduced motion. Reduced removes the flight without the emulation. System
   follows the emulation. The choice survives reload and a new game.
2. The front door with the state line, the loading and failure states, and the focus hand-off.
   Exit: a fresh game and a saved game open with one tap or Enter. A broken save shows its error
   there. The board takes no input until the kitchen opens.
3. The motion notice. Exit: under emulated reduced motion with System, the notice shows. Each
   button stores its choice and hides the notice for good. Without the emulation, the notice
   never shows.

## Acceptance and evidence

- Node: no engine or save change. The existing storage and build tests still pass.
- Browser: follow [Verification and release](README.md#verification-and-release), at 1440×900 and 390×844. Check the front doors for these cases: fresh, saved,
  finished-campaign, broken-save, and failed-data. Also check keyboard-only entry. Check the notice
  and both of its buttons under emulated reduced motion. Check the House book Motion choice.
  Check the behaviour when storage is denied.

## Dependencies and remaining decisions

No hard dependency. 009 may add a "Resume the story" entry to the front door when a scene is
pending. 010 starts its introductory prompt after the "Open the kitchen" button of a fresh game.

Open decisions:

1. The final wording.
2. Whether a returning player can choose to skip the front door.
3. The h1 arrangement and the crop of the painting.
4. Whether the front door shows the coin total.
