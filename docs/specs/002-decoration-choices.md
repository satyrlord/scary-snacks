# 002: Decoration choices

Status: Implemented.

## Outcome and scope

Three details of the bistro each have two finishes. The room painting is the default finish. A quest unlocks the second finish. A switch on the detail in the room changes the finish. Switches are free. The player can switch again at any time. Finishes do not change dialogue, campaign progress, income, or rewards.

| Slot | Detail shows after | Default | Second finish | Unlocking quest |
| --- | --- | --- | --- | --- |
| Tableware | 9: Choose the tableware | Blue bowls | Green bowls | Eszter's "A second glaze", after preparation 9 |
| Courtyard table cloth | 22: Prepare the serving station | Red embroidery | Blue embroidery | Ileana's "A blue table cloth", after preparation 22 |
| Final flowers | 24: Welcome the community supper | Wildflowers | Lilacs | Sânziana's "Lilacs for the dresser", after preparation 23 |

The cloth finish applies to the serving table. The flowers finish applies to the jug on the front-room dresser. The courtyard flowers stay as painted. These narrow locations fit the room paintings and keep all later preparations visible. Stable identifiers (IDs) in authored data control the details and the finishes.

## Rules and ownership

1. A detail shows its default finish. Story and rewards never wait for a finish.
2. Delivery of the required quest adds the second finish.
   After delivery, the switch shows when the detail is visible in the room.
3. A tap on the switch applies the other finish only after a successful save. The status line names the new finish. Focus stays on the switch.
4. A failed write keeps the previous finish and says that the finish is not saved.
5. The switch shows only in the area that the room shows. The completion line of each finish quest says where the switch is.
6. The engine rejects unknown slots, unknown finishes, mismatched finishes, and locked finishes. A rejection changes no state. A repeated switch grants nothing.
7. If another tab changes the saved game, the game adopts the latest saved game before the next action can run.

`tools/create-original-data.ts` authors the decoration slots and the `unlocks` field of the three quests.
Each slot has IDs, names, finishes, asset IDs, defaults, prerequisites, areas, and crop bounds.
`decorationProblems` checks defaults, IDs, bounds, prerequisites, areas, and recorded assets.
`questProblems` checks that each second finish has exactly one quest.
Saves never supply an asset path.

`src/engine.ts` owns `decorationChoices`, `resolveDecorations`, `decorationUnlocked`, the validation, and the `decorate` action. The `decorations` list holds the completed preparation IDs in order. `src/app.ts` owns the switch, the focus, and the boundary that saves before the game applies a finish. `src/storage.ts` owns the current save format and key.

Two full paintings supply the second finishes. The app clips each painting to its authored region. The 25 room paintings supply the defaults. The asset records hold the prompts, the dimensions, the hashes, the agent review, and the acceptance of the user.

## Save compatibility

The [shared save compatibility](README.md#shared-save-compatibility) section gives the supported format.
A missing choice entry means the authored default. A missing or malformed map is invalid. A saved choice must name a finish that its quest unlocked.
Import validates and saves the full candidate before the game adopts it. If the write fails, the game keeps the previous save and offers Retry save.
An explicit new game replaces only the current save.

PRODUCT.md owns these behaviors. DESIGN.md owns the design of the finish switch and of the painted regions.

## Acceptance and evidence

`tests/decorations.test.ts` covers the slot data, the quest that unlocks each finish, the locked finishes, invalid choices, defaults, and reducer isolation. `tests/storage.test.ts` covers the versioned key, failed writes, malformed input, and atomic reset. `tests/browser/decorations.spec.ts` covers the finish switches, keyboard focus, persistence, export and import, save failure, and tab changes. The asset check at the root and at the subdirectory loads both decoration paintings.

The two decoration masters are each 1536 by 2048 pixels and fully opaque, like the room states.
The masters use red, green, and blue (RGB) colour channels.
The OpenAI Images application programming interface (API) made both masters as edits of front-room-24 and courtyard-22.
A composite keeps every pixel outside the changed regions.
Thus each crop edge meets the room painting.
`docs/asset-prompts.json` holds the prompts.
