# Generate through the OpenAI Images API

Read this module before a plan, a request, a measurement, or a record of the route.
API means application programming interface. PNG means Portable Network Graphics.
MB means megabytes.
RGB means red, green, and blue. RGBA adds an alpha channel.

## Keep the route fixed

Run the helper from the repository root: `.github/skills/generate-game-art-openai/scripts/art-image.ts`.
The helper sends `gpt-image-2.5-flare`, high quality, PNG output, and one image to the fixed endpoint `https://api.openai.com/v1/images/`.
It does not accept a different model, quality, format, or endpoint.
`art-image.ts` uses only Node.js built-in modules.
`art-composite.ts` also uses Sharp, a development dependency in `package.json`.

For a helper repair, read these modules before the edit:

- [`art-image.ts`](../scripts/art-image.ts): command arguments, safe paths, references, keys, and run records.
- [`openai-api.ts`](../scripts/openai-api.ts): asset contracts and the API transport.
- [`png-facts.ts`](../scripts/png-facts.ts): PNG decoding and measurements.
- [`art-composite.ts`](../scripts/art-composite.ts): masks, region composites, the ink conversion, paper copies, and patches.

Run `node --test tests/art-image.test.ts` after a helper repair.
Run `npm run typecheck` to check the helper types.
Keep credentials and paid requests out of those checks.

The helper reads `OPENAI_API_KEY` from `.env.local` when it sends a request.
The helper stops if Git tracks the file or does not ignore the file.
Do not print the file, and do not put the key in a command argument.
Do not read the file with a shell command.
The helper does not expose a provider error body.
If the key is not available, give the request the status `BLOCKED`.

## Plan the request

Print the plan. The command reads no key and sends nothing:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts plan --asset food-grain
```

The plan rejects a size that does not agree with the asset.
It requires multiples of 16 and an aspect ratio of 1:3 to 3:1.
It requires an edge of at most 3840 pixels and 655,360 to 8,294,400 pixels in total.
It also requires the shape of the asset:

- Square for the core portrait, regular portrait, family portrait, and mascot atlases, and the timber.
  Also square for the rat hole and the two rat reference poses.
- 2:1 for the food atlases, the character sketch sheets, the family photographs, the two rat sheets, and the night sky.
- 3:1 for the runner and the notebook pages.
- 3:2 for the board-clutter atlas and the quest scenes.
- 3:4 for a room state, a decoration painting, the supper painting, and a window view.

The size must divide into equal grid cells.
The plan sets `experimentalResolution` for a size of more than 3,686,400 pixels (2560 by 1440).
You should use a smaller size.

Write the final prompt in a file in `tmp/`.
Then run the dry run:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts generate `
  --asset food-grain --prompt <prompt-file> `
  --out analysis/art-generation/<task>/<run> --dry-run
```

The dry run builds the request, hashes the prompt and the references, and sends nothing.
It does not show provider access or visual quality.

## Prepare the references

Use text-only generation for a new asset.
For a revision, use one `--reference <image>` for each accepted image that the revision must keep.
The helper accepts only these references:

- A shipped bitmap in `public/assets/original/` that matches its provenance hash.
- A `candidate.png` in `analysis/art-generation/` that matches its generation-record hash.
- A `composite.png` there that matches its `composite.json` hash.
- A `paper.png` there that matches its `paper.json` hash.
- A `halo.png` there that matches its `halo.json` hash.
- A `text.png` there that matches its `text.json` hash.

The helper rejects every other path, including `private/` and the other folders under `analysis/`.
The helper accepts at most 16 references. Each reference must be a PNG image of less than 50 MB.
The prompt and each reference leave the computer. Do not put a secret or private data in them.
Give each reference a role in the prompt.
Name the cells and the features that must stay unchanged.

## Edit a room state

A room state after the base is an edit of the previous accepted state.
Only the changed region of the edit goes into the new state.

1. **Make the mask.** The mask must be an RGBA PNG of the same size as the image that it edits. Transparent pixels mark the region to repaint:

   ```powershell
   node .github/skills/generate-game-art-openai/scripts/art-composite.ts mask `
     --size 1536x2048 --box <left>,<top>,<width>,<height> --out analysis/art-generation/<task>/<state>-mask.png
   ```

   Use `--ellipse <x>,<y>,<rx>,<ry>` for a round region.
   Use `--polygon <x1>,<y1>,<x2>,<y2>,<x3>,<y3>,...` for an outline in the perspective of a wall or a floor.
   You can give more than one region.

2. **Send the edit.** Give the previous state as the first `--reference`.
   Most room states use an edit without `--mask`.
   To guide the provider to the region, also give the mask as `--mask`.
   The mask must be inside `analysis/art-generation/`.
   The helper sends the mask with that image and records the hash of the mask in the run.
3. **Composite the region.** The provider uses a mask only as guidance. The provider can change pixels outside the region.
   Copy only the changed region into the previous state:

   ```powershell
   node .github/skills/generate-game-art-openai/scripts/art-composite.ts composite `
     --base <previous state> --candidate analysis/art-generation/<task>/<run>/candidate.png `
     --mask <mask> --out analysis/art-generation/<task>/<run>-composite
   ```

   The composite keeps every pixel of the previous state outside the region and its outward feather (24 pixels by default).
   It takes the generated pixels inside the region.
   `composite.json` records the hashes of the base, the candidate, the mask, and the result.
   An accepted `composite.png` with its record can be the reference for the next state.
   Review both the candidate and the composite. A seam or a lighting change at the edge of the region is a defect.
   Repair the defect with a corrective request or a larger mask.

   A newly lit lamp is a change of light.
   For a change of light, a mask in the request causes a defect.
   The model stops the light at the edge of the mask.
   Send that edit without `--mask`.
   Then composite with the mask of the region, `--ramp`, and a wide `--feather` (64 to 128).
   Without a ramp, the weight drops to one half at the edge of the region. That drop shows as a line when the light changes.
   A ramp widens the region by the feather first, so the fade starts at full strength.
   `composite.json` then records `"ramp": true`.

## Convert a pencil drawing

A pencil sheet holds eight character sketches or four quest scenes, drawn in one request, so that they share one hand. Each drawing is pencil on transparency.
With a transparent background, the provider makes only the area around the drawing clear. The paper inside closed shapes stays as a fill.
Ask for the drawing on plain white paper, with no paper texture and no fills.
Then make the paper transparent:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-composite.ts ink `
  --candidate analysis/art-generation/<task>/<run>/candidate.png --out analysis/art-generation/<task>/<run>-ink
```

The input is a `candidate.png`, or a `composite.png` that joins regions of pencil candidates on the same white paper.
The command finds the paper colour and makes the paper clear.
Each pencil mark keeps the colour that it shows over the paper, and faint red chalk stays red.
`ink.json` records the hashes of the candidate and the result, the paper colour, and the alpha floor.
Measure the transparent result with `inspect --processed`:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts inspect `
  --asset sketch-sheet-1 --input analysis/art-generation/<task>/<run>-ink/ink.png --processed
```

Use `--processed` only with `inspect`, for the `ink.png`, the `patch.png`, or the `sepia.png` of a pencil sheet.
The option requires transparency in the result.
Without the option, the measurement requires the opaque paper that the request specifies.
Review `ink.png` on the parchment and on a dark background. A tinted area on the paper stays visible in the result.

## Clear a halo

The provider can leave a faint glow of partial alpha around the objects of a transparent asset.
Clear it without painted pixels:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-composite.ts halo `
  --candidate analysis/art-generation/<task>/<run>/candidate.png --out analysis/art-generation/<task>/<run>-halo [--floor 32] [--ceiling 224]
```

Each alpha below the floor becomes 0, and each alpha above the ceiling becomes 255. The edge between them keeps its alpha.
`halo.json` records the hashes of the candidate and the result, the floor, the ceiling, and the number of changed pixels.
A `halo.png` can be the candidate of a composite, and a reference.
Review the result on a dark and a light background.

## Typeset a text

A painting can show a text that must be exact, for example a prayer in old Romanian Cyrillic letters.
The provider can change letters or repeat letter shapes. Give the provider the exact letters as a reference:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-composite.ts text `
  --text analysis/art-generation/<task>/<name>.txt --font <font file> --size 1024x768 --out analysis/art-generation/<task>/<name>-text
```

The text file must be in the task folder. The font must be a font file on this computer that has each letter of the text.
The current project text references use Noto Serif. Check the font license and each required letter before use.
The command sets the text in dark ink on white paper. It does not resample or paint a painting.
`text.json` records the text file, the hashes of the text, the font, and the result.
A `text.png` can be a reference. Also give the lines of the text in the prompt.
Examine each letter of the candidate against the text.

## Set the line colour

Each pencil line has one sepia colour. The transparency of the line gives its light and dark. Then run the `sepia` command on the `ink.png` or the `patch.png`:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-composite.ts sepia `
  --input analysis/art-generation/<task>/<run>-ink/ink.png --out analysis/art-generation/<task>/<run>-sepia --keep-gold
```

The command keeps the alpha of each pixel. `--keep-gold` keeps the gold of flames and crowns. `--keep-red` keeps red chalk.
Give `--keep-red` only to a sheet whose quests name a red object. Then examine each cell: red outside a named object is a defect.
`sepia.json` records the hashes of the input and the result, the colours, and the number of kept pixels.
`sepia.png` is the master.

## Repair a region of a pencil drawing

Use this procedure to change one region of an accepted pencil sheet.

1. **Make a paper copy.** The drawing must be a reference that the helper accepts, for example a shipped bitmap:

   ```powershell
   node .github/skills/generate-game-art-openai/scripts/art-composite.ts paper `
     --base public/assets/original/sketch-sheet-1.png --out analysis/art-generation/<task>/<name>-paper
   ```

   The command puts the drawing on white paper. The command pads each side to the next multiple of 16 pixels, and does not resample a pixel.
   `paper.json` records the drawing, its hash, the padding, and the hash of `paper.png`.
2. **Make the mask** with `mask --size` set to the size of `paper.png`. Transparent pixels mark the region to repaint.
3. **Send the edit.** Give `paper.png` as the first `--reference`, the mask as `--mask`, and the size of `paper.png` as `--size`.
4. **Patch the drawing.** Run the `patch` command:

   ```powershell
   node .github/skills/generate-game-art-openai/scripts/art-composite.ts patch `
     --base analysis/art-generation/<task>/<name>-paper/paper.png `
     --candidate analysis/art-generation/<task>/<run>/candidate.png `
     --mask <mask> --out analysis/art-generation/<task>/<run>-patch
   ```

   The command takes only the masked region of the candidate.
   The ink conversion makes the paper of that region clear.
   The command composites that region into the drawing, with a feather of 8 pixels by default.
   Every other pixel of the drawing stays unchanged.
   The command stops if the drawing changed after the paper copy.
   `patch.json` records the hashes of the drawing, the paper copy, the candidate, the mask, and the result.
5. **Set the line colour.** Run the `sepia` command on `patch.png`.
6. **Measure the result.** Run `inspect --processed` on `sepia.png`. Review `sepia.png` as you review `ink.png`.

## Send the request

Remove `--dry-run` only for an approved request:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts generate `
  --asset food-grain --prompt <prompt-file> `
  --out analysis/art-generation/<task>/<run>
```

The output folder must be a new path inside `analysis/art-generation/`.
The helper sends one request and does not retry.
It saves these files in the run folder:

- `prompt.txt`: the prompt that the helper sent.
- `request-record.json`: the model, the size, the references, and the hashes.
- `candidate.png`: the initial output.
- `generation.json`: the request record and the hash of the candidate.
- `inspection.json`: the measurements.
- `status.json`: the state of the run.

Keep those files as the only record of the paid request. Do not make a second record.
Read `status.json` before you continue:

| State | Meaning | Next step |
| --- | --- | --- |
| `request-started` | The result is unknown. | Do not repeat the request. Examine the folder. Ask the user what to do. |
| `request-failed` | The request gave no image. The provider rejected it, the provider failed, the response had no usable image, or a local error stopped it. The record has a code. | Report the code. Do not retry without approval. |
| `request-failed` with the code `network-outcome-unknown` | A network error or a timeout stopped the request. The billing result is unknown. | Do not repeat the request. Report the unknown result to the user. |
| `response-saved` | The candidate is saved. | Measure it. |
| `candidate-undecodable` | The file is not an 8-bit RGB or RGBA PNG. | Examine the file. Do not send a new request without approval. |
| `measurement-review-required` | A measurement failed. | Read `inspection.json`, and select the repair. |
| `visual-review-required` | The measurements passed. | Examine the candidate in an image viewer. |

After a timeout or an interruption, find the result of the previous request before you consider another request.
The helper never makes a second request for a folder that exists.

## Measure the candidate

Run the measurement for a candidate, or for any bitmap:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts inspect `
  --asset food-grain --input analysis/art-generation/<task>/<run>/candidate.png --size 2048x1024
```

The command prints the hash, the dimensions, the mode, and the alpha counts.
It sets the exit code to 1 for an `issues` entry. An issue is one of these items:

- The size does not agree with `--size`, or the width is not more than 1000 pixels.
- The image does not divide into the grid.
- A required blank cell in a food atlas, `regulars-3`, or `family-portraits` has a pixel that is not transparent.
- A transparent asset has no alpha channel or no fully transparent pixel.
- A cell of a transparent asset has no visible object. A visible object has pixels with an alpha of 128 or more.
- An opaque painting has a transparent or partly transparent pixel.

The decoder rejects PNG colour-key transparency (`tRNS`).
Use an RGB image without a colour key, or an RGBA image, so that the alpha is exact.

A `warnings` entry reports visible pixels in the edge band of a cell.
Generated grids are not exact, and the accepted atlases also give this warning.
Examine each listed cell for containment, as [atlas generation and review](../../generate-game-art/references/atlas-review.md) tells you.
A measurement that passes does not show visual quality. Examine the candidate cell by cell, at 64 pixels for food.

## Record the route

Use this section only for a replacement, after the candidate review passes.
Install the candidate and update the records with [integration](../../generate-game-art/references/integration.md).
Add these route details:

- In `docs/asset-provenance.json`, set `generation` to `OpenAI Images API, gpt-image-2.5-flare, high quality`.
  For an edit, add a clause after a semicolon. The clause names the kind of edit and the composite.
  For a pencil drawing, add a clause that names the `ink` conversion or the `patch` command.
- In `docs/asset-prompts.json`, copy the text of `prompt.txt` unchanged into the new entry.
  Add a `generation` field to that entry with the keys `model`, `quality`, `size`, and `run`. The `run` value is the run folder name.
  If the run used a reference or a mask, add the keys `reference` and `mask` with their descriptions.
  Change the top-level `mode` field so that it names each route that made an entry.
- Examine the statements that name the built-in chat image generator in `docs/release-notes.md` (section "Art provenance").
  Change a statement that is not true.
- Set `sourceGameImageInput` to `false` only if each reference comes from this project.
  References can include the helper's composites, paper copies, cleared halos, and typeset text.

Run `npm run assets:build`, `npm test`, `npm run build`, and `npm run test:browser`.
Examine the changed assets in the game in both themes at the desktop size and the phone size.
