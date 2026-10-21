# Atlas generation and review

Read this module before prompt work or candidate review.

## Write one brief

Use one short brief.
Give the asset identifier, the layout, the objects, the counts, and the items that the image must not include.
Start from the accepted prompt of that asset in `docs/asset-prompts.json`.
For an edit, identify the cells and the features that must stay unchanged.

For an atlas, give these items in the prompt:

- One bitmap with the documented aspect ratio of the asset and a regular grid of equal cells.
- The number of columns and rows.
- The subject or group, count, placement, and transparent margin for each cell.
  Use the values from the accepted prompt.
- No object across a cell edge, no grid lines, and no shadow that goes into an adjacent cell.
- A transparent background with no checkerboard and no coloured matte.
- The full sequence of the objects, from left to right and then from top to bottom.

For food, match the `art.atlas` and `art.cell` fields in `tools/create-original-data.ts`.
For portraits, match the `sprite` indexes in that file.
For mascots, match the cell positions in `src/style.css`.
For blockers, match the frame rectangles `blockerFrames` and `preparationFrames` in `src/art.ts`.
For portraits, also match the crops `portraitFrames` in `src/art.ts`.
For blockers, preserve each transparent centre and the clear cell margins that `tests/assets.test.ts` checks.
Each chain atlas holds its source in cell 0, then its dishes in stage order.
The four mixed-dish atlases hold dishes in their assigned cells.
Get the dish names from `tools/create-original-data.ts`.
Write local dish names without diacritics in the prompt. Add a short description of how the picture must show each dish.

For the portrait atlas, give one brief for each character.
Use the accepted prompt of the character as the identity. Keep the hair, the clothes, and the age in each revision.

For a room state or a decoration painting, name the one change and the region of that change.
Give the previous accepted state as the reference.
Name the features that must stay unchanged.
`docs/specs/001-visible-renovation-art-plan.md` lists the features that every state keeps and the items that no state includes.
Do not paste an object onto a painting. Paint the change in the perspective and the light of the room.
For the API route, read [API generation](../../generate-game-art-openai/references/api-generation.md) for the masked edit and the composite.

## Measure the candidate

Open the saved image with an image viewer.
Measure the decoded width, the decoded height, the colour mode, and the alpha.
The asset test requires a width of more than 1000 pixels.
Check the image against the layout table in [`SKILL.md`](../SKILL.md).
Each food atlas must be a four-by-two grid of 2:1, with the source and the dishes in stage order.
Each portrait atlas and the mascot atlas must be square.
`board-clutter` must be a three-by-two grid, and `preparation-clutter` must be a four-by-three grid.
Each blocker cell must be square.
A room state and a decoration painting must be 3:4 portrait images.
Check that each atlas has transparent pixels.
The room states, the decoration paintings, the timber, and the runner are opaque.
The food atlases and both blocker atlases have transparent backgrounds.

## Examine each cell

Divide the atlas into its grid. Examine each cell as an isolated image.

- **Count:** each cell has its specified subject or group. No cell is empty unless the layout gives it as empty.
- **Sequence:** each object is in the cell that its index gives.
- **Identity:** each subject agrees with its accepted brief. For food, a player can identify the dish, and the dish agrees with the item name.
- **Containment:** no pixel of an object is in an adjacent cell.
- **Space:** the subject keeps the placement and the transparent margins that its accepted prompt specifies.
- **Alpha:** the background is transparent. Solid subjects have strong alpha, 128 or more, and look opaque.
- **Edges:** there is no halo, checkerboard, matte colour, or detached shadow.
- **Artifacts:** there is no text, number, logo, duplicate object, or blur.
- **Style:** the painting style agrees with the accepted cells in the same atlas.

Examine transparent edges on a light background and on a dark background.
Examine each food cell at 64 pixels. A correct pixel count does not show visual quality.
For portraits, compare each face with the accepted version of that character.

For a room state or a decoration painting, examine the whole painting at full size.

- **Change:** the change sits on a surface. It matches the perspective, the light, the scale, and the shadows of the room.
- **Stability:** no pixel outside the region of the change is different. A seam at the edge of the region is a defect.
- **Artifacts:** there is no text, number, or logo.
- **Themes:** the painting looks the same in the two themes, with the interface in front of it.

## Select the repair

Give each defect one of these causes:

1. The bitmap: the object, the cell position, the alpha, or the style.
2. The runtime code: the cell rectangle, the clip region, the scale, or the position in `src/art.ts` or `src/style.css`.
   The food rectangles use the `art.cell` field and the four-by-two grid in `src/art.ts`.
3. The data: an `art` field, a portrait `sprite` index, or a name in `tools/create-original-data.ts`.

Do not change a value until the evidence identifies the owner.
The interface clips each food tile to its source region. A pixel from an adjacent cell shows a bitmap defect or a runtime code defect.
Repair a bitmap defect with a corrective request. Do not paint pixels manually.
Repair a runtime code defect in the code, and add a browser assertion for it.
For a data defect, use [update-game-content](../../update-game-content/SKILL.md).

Record the candidate path, the decision, and the observed defects in one short work record.
Keep the work record in `tmp/`, as `AGENTS.md` tells you.
If you cannot view an image, give its path in the report.
Also give the visual review that you did not complete.
