# 001: Visible renovation and areas

Status: Implemented.

The [room states art plan](001-visible-renovation-art-plan.md) gives the 25 states, their focus points, and their paintings. [Spec 002](002-decoration-choices.md) owns the decoration choices. [Spec 007](007-chapter-story-and-finale.md) owns the story sequence.

## Rules

1. Each of the 24 preparations maps to a painted change that the player can identify. A result that is not physical maps to a distinct marker, for example the festive gate. No outcome depends only on a progress counter or on tiny text in an image.
2. The new-game front room shows unfinished work, cobwebs in the broken window, and a few small spiders. Preparation 1, "Fix the broken window", clears the webs. It also sends those spiders outside alive. One friendly resident spider stays under the upper wall shelf in every state, including the restored room. No other web or spider stays after preparation 1.
3. The courtyard opens after preparation 13, "Clear the courtyard", in chapter 4. Before that, the courtyard control shows only its name and its prerequisite. It shows no picture and no scene description.
4. Room state comes only from completed stable task identifiers (IDs).
   Viewing the room gives no progress and no reward. Selecting an area gives no progress and no reward.
   Completed work stays visible until an authored replacement includes it.
5. A preparation must save successfully before its progress becomes active. Its story and its room reward appear only after that. A failed action or a failed save write changes neither the coins nor the room. If images are missing, the captions keep the earned outcome readable. Missing images do not reset progress and do not block play.
6. With reduced motion, the game shows the completed state directly. Other players see a short reveal after the new images decode. If a decode fails, the game shows the captions and gives access to the kitchen again. Authored lighting appears at these points:
   - the lamps at preparation 4
   - the courtyard dusk at preparation 13
   - the invitation lantern at preparation 21
   - the supper lights at preparation 23

   Only the paintings change the light.

## Data, art, and ownership

[tools/create-original-data.ts](../../tools/create-original-data.ts) authors two areas and 25 room states: one for the new game and one for each preparation.
Each state has a stable ID, an area, and a preparation prerequisite.
Each state also has focus coordinates, a pin mark, a pin label, and a caption.
The ID of a state also names its painting.
`roomProblems` in `src/content.ts` checks the room states.
[DELIVERY.md "Game data"](../../DELIVERY.md#game-data) gives the conditions that prevent data generation.
The tests compare the painting list with the shipped variant plan.
The tests also resolve all 25 campaign checkpoints.

The engine owns eligibility and completed facts. Its pure function `resolveRooms` maps completed task IDs to unlocked areas, earned states, and the latest accepted painting. The function `latestArea` finds the area of the latest change. The interface draws the room and keeps the area preference. The game has no second mutable renovation counter. If an area preference is missing, invalid, or locked, the game uses the area of the latest change. A reveal selects the changed area.

All 25 states have accepted 1536 by 2048 Portable Network Graphics (PNG) masters. The game ships responsive AV1 Image File Format (AVIF) and WebP variants at 768 by 1024 and 1536 by 2048. The renderer downloads the current painting. It preloads the next painting during the story. If a state has no accepted painting, the resolver keeps the latest earlier painting in its area. The caption describes the earned state. No New pin marks a change with no painting. If a painting fails to load, the room shows its captions, and play stays available.

The [room states art plan](001-visible-renovation-art-plan.md) records the accepted paintings and their focus points. [Asset prompts](../asset-prompts.json), [provenance](../asset-provenance.json), and [variants](../asset-variants.json) record the generation, the hashes, the dimensions, and the shipped bytes.

## Preparation outcomes

The [art plan matrix](001-visible-renovation-art-plan.md#the-25-states) records all 25 painted states, including the new game. The generator owns the exact focus coordinates, pin marks, and captions.

Each later painting keeps the earned changes of its area, unless the authored outcome replaces them. The resident spider stays under the upper wall shelf. Captions give the meaning of the changes. The paintings have no small readable text.

## Save and failure behavior

The [shared compatibility contract](README.md#shared-save-compatibility) applies. The save has no room field. A valid prefix of the completed preparations resolves its earned rooms without payment and without repeated rewards. The game rejects invalid progression. The selected area is a browser preference outside the save.

Fresh, mid-campaign, and completed saves resolve the same rooms after reload and after export and import. A preparation must save before its progress becomes active. The story holds the previous painting until the story ends. Then, where the drawer moves (1023px or less wide and taller than 600px), the drawer lowers, and the room reveals the change. A failed write keeps the previous state and shows an error that the player can recover from. A failed image cannot change the saved list of completed preparations.

## Acceptance and evidence

The checks cover these areas:

- Engine and data: all 25 checkpoints, the exact state IDs, and locked areas. The tests also cover latest-area selection, approved paintings, invalid room data, and the fallback for a state with no painting.
- Engine and persistence: a failed or repeated preparation action leaves the room and the purse unchanged. A failed payment write leaves the coins, the progress, the story, and the reveal unchanged.
- Saves: fresh, partial, and completed states keep their rooms after reload and after export and import.
  The game rejects malformed, unsupported, and oversized imports.
- Browser: payment with earned coins, story completion, one reveal, and reload.
  The tests cover the courtyard unlock, area selection, and the area preference outside the save.
  The tests also cover hosting at the root and at `/scary-snacks/`, accessible area controls, and reduced motion.
  They also cover failed paintings, failed preloads, and late decode results from an earlier area.
- Layout: the room crop, the New pin, the area switch, and the drawer.
  The tests use desktop, phone, and short viewport sizes.
  The tests capture all 25 checkpoints at the desktop size in Light and at the phone size in Dark.
  A pass of the Document Object Model (DOM) checks or of the pixel-change checks does not show visual quality.

## Verification and limits

The [verification record](../verification.md) gives the procedure and the limits of the full gate. The gate does not measure the decode time or the display latency of a painting. A measurement of the production build needs a record of the host, the viewport, the workload, and the method.

The checks do not use a physical touch device or a screen reader. A physical Chromium phone playthrough should pay for a preparation, examine both areas, reload, and import a save.
