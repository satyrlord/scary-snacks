# Integration

Read this module before a change to a shipping file or a record.
Use it only after the candidate review passes and the scope includes a replacement.

## Replace the bitmap

Keep the file name and the asset identifier for a replacement.
Copy the accepted candidate to `public/assets/original/` with no change to its pixels.
Do not run background removal, colour changes, or compression on the candidate.
Do not put a second file in that folder. The test fails for a file with no record.
The game never loads a master.
If the replacement moves a subject inside an atlas, update the cell rectangles.
They are `spriteBounds`, `blockerFrames`, and `preparationFrames` in `src/app.ts`, and the mascot positions in `src/style.css`.
Update the records before you make variants with `npm run assets:build`.

## Update the two records

In `docs/asset-prompts.json`, add the prompt that made the accepted candidate with a new `id`.
Keep each prompt that leads to a shipped master, including each revision.
If a revision replaced the candidate that a prompt made, give the cause in the `disposition` field of that prompt.
If you remove a master from the game, remove its prompts and its provenance entry.
Record the prompt text that you sent. Do not write a better prompt after the generation.
For the handoff route, record the prompt with the changes that the user reported.

In `docs/asset-provenance.json`, update the entry of the asset with measured values:

- `sha256` and `bytes` of the shipping file.
- `width`, `height`, `mode`, and `hasTransparency`.
- `promptId`, which must be the new prompt `id`.
- `generation`, which gives the route. For the handoff route, give the tool that the user named.
- `sourceGameImageInput`.
- For an edit of another painting, set `referenceAsset` to the identifier of that painting.
  Set `referenceSha256` to its recorded `sha256`.
  The asset test compares the two values with the record of that painting.
- `review`, which states what the agent examined.
  Add `visualAcceptance` only after the user accepts the image.

Calculate the hash from the file in `public/assets/original/`:

```powershell
(Get-FileHash -Algorithm SHA256 public/assets/original/<file>.png).Hash.ToLower()
```

Update the top-level `note` field of `docs/asset-provenance.json` only when its statements change.

## Add a new bitmap

A new bitmap file is a product change.
Confirm that the approved scope includes that change.
Then do these steps:

1. Add the entry to `docs/asset-provenance.json` and the prompt to `docs/asset-prompts.json`.
2. Update the asset count in `tests/assets.test.ts`.
3. Add the asset to `imageVariants` in `tools/build-image-variants.ts`.
   "Required actions" in `DESIGN.md` gives the formats and the widths of each asset kind.
   The comments in `tools/build-image-variants.ts` give the reasons.
   Compare the required widths with the source dimensions before you generate variants.
4. Run `npm run assets:build`.
5. Add the code that shows a variant, with a path relative to the file that loads it.
   For a room state, also add its identifier to `roomPaintings` in `src/engine.ts`.
6. Update the asset statements in `PRODUCT.md`, `DESIGN.md`, and `DELIVERY.md`.

The build collects the variants. The source export collects the masters and the variants from their records.

## Examine the runtime use

Run `npm run assets:build`, then `npm test`.
The asset test compares each hash with its record. It fails on a variant that an older master made.
Run `npm run build` and then `npm run test:browser`.
For the production build, use [verify-game](../../verify-game/SKILL.md).
Examine the changed cells in the game in the Light theme and the Dark theme.
Use the desktop viewport and the phone viewport.
Do not report an isolated image as an examined game screen.

Obey the limits of the user on checks.
In the report, list the visual checks and the browser checks that you did not run.
Keep them apart from the automated checks that passed.
