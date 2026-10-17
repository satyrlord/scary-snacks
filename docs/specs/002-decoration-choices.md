# 002 Decoration choices

Status: Implemented. The user verified it in the game and accepted it. Priority: Optional. Dependency: [001](001-visible-renovation.md).

## Outcome and scope

The House book lets the player choose three earned details. Each has two finishes. The existing artwork is the default. Choices are free, and the player can change a choice again. Choices do not change dialogue, campaign progress, income, or rewards.

| Slot | Opens after | Default | Alternative |
| --- | --- | --- | --- |
| Tableware | 9: Choose the tableware | Blue bowls | Green bowls |
| Courtyard table cloth | 22: Prepare the serving station | Red embroidery | Blue embroidery |
| Final flowers | 24: Welcome the community supper | Wildflowers | Lilacs |

The cloth choice applies to the serving table. The flowers choice applies to the jug on the front-room dresser. The courtyard flowers stay as painted. These narrow locations fit the current room paintings and keep all later preparations visible. Stable prerequisite identifiers (IDs) in authored data control the unlocks.

## Rules and ownership

1. An unlocked slot shows its default without a mandatory choice. Story and rewards never wait for the editor.
2. Change opens a local preview. Apply updates one slot only after a successful save. Cancel, Escape, and Close discard the preview and restore focus to the invoking slot. A queued Apply also cancels if the editor closes while it waits for the write lock.
3. The room and the House book thumbnail show the committed choice. A preview changes neither surface nor exported data.
4. A failed Apply keeps the prior state and the pending preview. The error says that the choice is not saved. Retry attempts the complete selected state again.
5. Locked slots name the required preparation. The engine rejects unknown slots, unknown or mismatched variants, and locked choices without a state change. Repeated Apply grants nothing.
6. A change from another tab closes a stale editor and adopts the latest saved game before another action can run.

`tools/create-original-data.ts` authors slot IDs, names, variants, asset IDs, defaults, prerequisites, areas, and crop bounds. `decorationProblems` checks defaults, IDs, bounds, prerequisites, areas, and recorded assets. Saves never supply an asset path.

`src/engine.ts` owns `decorationChoices`, `resolveDecorations`, validation, and the `decorate` action. The existing `decorations` list remains the prefix of completed preparations. `src/app.ts` owns the transient preview state, the display, the focus, and the save-before-apply boundary. `src/storage.ts` owns the current save format and key.

Two full paintings supply the alternatives. The app clips each to its authored region. The 25 room paintings supply the defaults. Prompts, dimensions, hashes, agent review, and the acceptance of the user are in the asset records. The user accepted the two paintings.

## Save compatibility

The [shared save compatibility](README.md#shared-save-compatibility) section gives the supported format.
A missing choice entry means the authored default. A missing or malformed map is invalid, as are unknown or locked choices.
Import validates and saves the full candidate before adoption. A failed write preserves the prior save and offers Retry.
An explicit new game replaces only the current save.

## Completion slices

1. Tableware: authored alternatives, engine validation, local preview, durable Apply, and Cancel.
2. All three slots: House book rows, keyboard controls, shared thumbnail and room rendering, and locked explanations.
3. Persistence: malformed-map rejection, reload, export/import, failed writes, Retry, reset, and tab coordination.

PRODUCT.md owns these behaviors. DESIGN.md owns the design of the editor and of the painted regions. README.md describes the controls, assets, and compatibility.

## Acceptance and evidence

`tests/decorations.test.ts` covers reducer isolation, invalid choices, defaults, and content validation. `tests/storage.test.ts` covers the versioned key, failed writes, malformed input, and atomic reset. `tests/browser/decorations.spec.ts` covers previews, cancellation, keyboard selection, repeated Apply, persistence, export/import, save failure and Retry, and tab changes. The asset check at the root and at the subdirectory loads both decoration paintings.

The two decoration masters are each 1536 by 2048 pixels, RGB, and fully opaque, the size of the room states. The OpenAI Images API made both as edits of front-room-24 and courtyard-22. A composite keeps every pixel of the room state outside the changed regions, so each crop edge meets the room painting. `docs/asset-prompts.json` holds the prompts.

The user verified the three choices in the game with a checkpoint save and accepted the feature.
