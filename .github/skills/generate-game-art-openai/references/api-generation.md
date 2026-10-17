# Generate through the OpenAI Images API

Read this module before a plan, a request, a measurement, or a record of the route.
API means application programming interface. PNG means Portable Network Graphics.
RGB means red, green, and blue. RGBA adds an alpha channel.
MB means megabytes.

## Keep the route fixed

Run the helper from the repository root: `.github/skills/generate-game-art-openai/scripts/art-image.ts`.
The helper sends `gpt-image-2.5-flare`, high quality, PNG output, and one image to the fixed endpoint `https://api.openai.com/v1/images/`.
It does not accept a different model, quality, format, or endpoint.
`art-image.ts` uses only Node.js built-in modules.
`art-composite.ts` also uses Sharp, a development dependency in `package.json`.

For a helper repair, inspect these modules before the edit:

- [`art-image.ts`](../scripts/art-image.ts): command arguments, safe paths, references, keys, and run records.
- [`openai-api.ts`](../scripts/openai-api.ts): asset contracts and the API transport.
- [`png-facts.ts`](../scripts/png-facts.ts): PNG decoding and measurements.
- [`art-composite.ts`](../scripts/art-composite.ts): masks and region composites.

Run `node --test tests/art-image.test.ts` after a helper repair.
Run `npm run typecheck` to check the helper types.
Keep credentials and paid requests out of those checks.

The helper reads `OPENAI_API_KEY` from `.env.local` when it sends a request.
It stops if Git tracks the file or does not ignore the file.
Do not print the file, and do not put the key in a command argument.
Do not read the file with a shell command.
The helper does not expose a provider error body.
If the key is not available, give the request the status `BLOCKED`.

## Plan the request

Print the plan. The command reads no key and sends nothing:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts plan --asset menu-atlas
```

The plan rejects a size that does not agree with the asset.
It requires multiples of 16 and an aspect ratio of 1:3 to 3:1.
It requires an edge of at most 3840 pixels and 655,360 to 8,294,400 pixels in total.
It also requires the shape of the asset:

- Square for the food, core portrait, regular portrait, and mascot atlases, and the timber.
- 3:1 for the runner.
- 3:2 for the board-clutter atlas.
- 3:4 for a room state and a decoration painting.

The size must divide into equal grid cells.
The plan sets `experimentalResolution` for a size of more than 2560 by 1440 pixels. Avoid such a size.

Write the final prompt in a file that is not in the repository, or in an ignored folder.
Then run the dry run:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts generate `
  --asset menu-atlas --prompt <prompt-file> `
  --out analysis/art-generation/<task>/<run> --dry-run
```

The dry run builds the request, hashes the prompt and the references, and sends nothing.
It does not show provider access or visual quality.

## Prepare the references

Use text-only generation for a new asset.
For a revision, use one `--reference <image>` for each accepted image that the revision must keep.
The helper accepts only these references:

- A shipping bitmap in `public/assets/original/` that matches its provenance hash.
- A `candidate.png` in `analysis/art-generation/` that matches its generation-record hash.
- A `composite.png` there that matches its `composite.json` hash.

The helper rejects every other path, including `private/` and the other folders under `analysis/`.
The helper accepts at most 16 references. Each reference must be a static PNG, JPEG, or WebP image of less than 50 MB.
The prompt and each reference leave the computer. Do not put a secret or private data in them.
Give each reference a role in the prompt, and name the cells and the features that must stay unchanged.

## Make a masked edit of a room state

A room state after the base is a masked edit of the previous accepted state.

1. **Make the mask.** The mask must be the size of the image that it edits. Transparent pixels mark the region to repaint:

   ```powershell
   node .github/skills/generate-game-art-openai/scripts/art-composite.ts mask `
     --size 1536x2048 --box <left>,<top>,<width>,<height> --out analysis/art-generation/<task>/<state>-mask.png
   ```

   Use `--ellipse <x>,<y>,<rx>,<ry>` for a round region.
   Use `--polygon <x1>,<y1>,<x2>,<y2>,<x3>,<y3>,...` for an outline in the perspective of a wall or a floor.
   You can give more than one region.

2. **Send the edit.** Give the previous state as the first `--reference` and the mask as `--mask`.
   The mask must be inside `analysis/art-generation/`.
   The helper sends the mask with that image and records the hash of the mask in the run.
3. **Composite the region.** The provider uses the mask only as guidance. The provider can change pixels outside the mask.
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
   For a change of light, a mask makes the model stop the light at the edge of the mask.
   Send the edit without `--mask` instead. Then composite with the mask of the region, `--ramp`, and a wide `--feather` (64 to 128).
   Without a ramp, the weight drops to one half at the edge of the region. That drop shows as a line when the light changes.
   A ramp widens the region by the feather first, so the fade starts at full strength.
   `composite.json` then records `"ramp": true`.

## Send the request

Remove `--dry-run` only for an authorized request:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts generate `
  --asset menu-atlas --prompt <prompt-file> `
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

Keep those files as the only record of the paid request. Do not make a second ledger.
Read `status.json` before you continue:

| State | Meaning | Next step |
| --- | --- | --- |
| `request-started` | The result is unknown. | Do not repeat the request. Examine the folder, and ask the user. |
| `request-failed` | The provider refused the request. The record has a code. | Report the code. Do not retry without approval. |
| `request-failed` with the code `network-outcome-unknown` | A network error or a timeout stopped the request. The billing result is unknown. | Do not repeat the request. Report the unknown result to the user. |
| `response-saved` | The candidate is saved. | Measure it. |
| `candidate-undecodable` | The file is not an 8-bit RGB or RGBA PNG. | Examine the file. Do not send a new request without approval. |
| `measurement-review-required` | A measurement failed. | Read `inspection.json`, and select the repair. |
| `visual-review-required` | The measurements passed. | Examine the candidate in an image viewer. |

After a timeout or an interruption, recover the previous result before you consider another request.
The helper never makes a second request for a folder that exists.

## Measure the candidate

Run the measurement for a candidate, or for any bitmap:

```powershell
node .github/skills/generate-game-art-openai/scripts/art-image.ts inspect `
  --asset menu-atlas --input analysis/art-generation/<task>/<run>/candidate.png --size 1536x1536
```

The command prints the hash, the dimensions, the mode, and the alpha counts.
It sets the exit code to 1 for an `issues` entry. An issue is one of these items:

- The size does not agree with `--size`, or the width is not more than 1000 pixels.
- The image does not divide into the grid.
- A transparent asset has no alpha channel or no fully transparent pixel.
- A cell of a transparent asset has no visible object. A visible object has pixels with an alpha of 128 or more.
- An opaque painting has a transparent or partly transparent pixel.

The decoder rejects PNG color-key transparency (`tRNS`).
Use an RGB image without a color key, or an RGBA image, so that the alpha is exact.

A `warnings` entry reports visible pixels in the edge band of a cell.
Generated grids are not exact, and the accepted atlases also give this warning.
Examine each listed cell for containment, as [atlas generation and review](../../generate-game-art/references/atlas-review.md) tells you.
A passing measurement does not show visual quality. Examine the candidate cell by cell, at 64 pixels for food.

## Record the route

Use this section only for a replacement, after the candidate review passes.
Install the candidate and update the records with [integration](../../generate-game-art/references/integration.md).
Add these route details:

- In `docs/asset-provenance.json`, set `generation` to `OpenAI Images API, gpt-image-2.5-flare, high quality`.
  For an edit, add a clause after a semicolon. The clause names the kind of edit and the composite.
- In `docs/asset-prompts.json`, copy the text of `prompt.txt` unchanged into the new entry.
  Add a `generation` field to that entry with the model, the quality, the size, and the run folder name.
  If the run used a reference or a mask, add its description to that field.
  Change the top-level `mode` field so that it names each route that made an entry.
- Examine the statements that name the in-chat imagegen tool in `docs/release-notes.md` (section "Art provenance").
  Change a statement if it is no longer true.
- Set `sourceGameImageInput` to `false` only if each reference was a shipping bitmap or a candidate of this project.

Run `npm run assets:build`, `npm test`, `npm run build`, and `npm run test:browser`.
Examine the changed assets in the game in both themes at the desktop size and the phone size.
