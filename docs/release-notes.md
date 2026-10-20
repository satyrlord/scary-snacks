# Release notes and remaining risk

## Release contents

Scary Snacks is a fictional Transylvanian bistro game.
The project authors its cast, dialogue, board, item progression, economy, art, and sounds.

The source is TypeScript 7.
The build publishes the runtime modules as browser scripts.
The build file list contains these items:

- `index.html`.
- The runtime scripts and one stylesheet.
- The authored game data in JavaScript Object Notation (JSON).
- AV1 Image File Format (AVIF) and WebP variants of the approved masters.
- Two fonts under the SIL Open Font License (OFL).
- The complete font license texts.
- An empty `.nojekyll` file.

The fonts use Web Open Font Format 2 (WOFF2).
The font records describe the conversion from the source fonts.
The build copies the WOFF2 files without a change.

The build excludes the Portable Network Graphics (PNG) masters, local work folders, and installed packages.
Tests compare asset hashes with their records.
Tests also check that runtime files and game data load assets only from the variant and font folders.
[`DELIVERY.md`](../DELIVERY.md) gives the Pages workflow.

## Legal limits

The project records do not guarantee that no person can make a legal claim.
The records do not establish ownership of every generated output.
The records do not give trademark clearance for the title.
A lawyer should review the intended release and the applicable jurisdictions before publication.

The [United States Copyright Office](https://www.copyright.gov/register/tx-games.html) distinguishes game ideas and methods from expressive text and artwork.
The [United States Patent and Trademark Office](https://www.uspto.gov/trademarks/search/likelihood-confusion) explains confusion between similar marks for related goods.
These sources describe United States law in general.
These sources do not determine which law applies to this project.

The project has no comprehensive title clearance.
Such clearance requires more than an exact-name search.
Relevant searches cover trademark registers, unregistered rights, company names, domains, and jurisdictions outside the United States.

## Publication

The configured Pages address is https://satyrlord.github.io/scary-snacks/.
The checkout does not establish the current availability or contents of that site.
Treat every tracked file as public.
`npm run release:source` makes a source export without Git history.
Publish only the intended export or build output.
Do not publish the whole workspace or its ignored local work folders.

## Local folders

`AGENTS.md` (repository only) defines the ignored local work folders and their input limits.
These folders are not runtime dependencies.
The build writes its manifest to `analysis/`.
Art candidates are not in the published assets.

## Art provenance

The game ships image variants from 89 masters.
[Asset provenance](asset-provenance.json) records each master, its references, processing, review limits, and hash.
[Asset prompts](asset-prompts.json) preserves the exact generation prompts.
These records describe the source of the current assets. These records do not give legal clearance.

The built-in chat image generator supplies these assets:

- The guest portrait atlas, with the visitor portraits as its style reference.
- The board-clutter atlas, with an earlier food atlas as its style reference.
- The preparation-clutter atlas, with a precise alpha correction that the user approved.
- The visitor portraits, with the core portraits as their style reference.
- The parchment, and the first versions of the character sketches and quest scenes.

Fixed-cell assembly gives the visitor atlas the complete Ionatan cell.
The dress of Adrian, Monica, and Janos follows the recorded local references.
The provenance record distinguishes recorded user acceptance from agent review.

The OpenAI Images application programming interface (API) supplies these assets through `gpt-image-2.5-flare` at high quality:

- The mascots, with a project-generated chat atlas as its reference.
- The timber tabletop and embroidered runner, from text prompts.
- The core portraits, as a revision of a text-generated candidate.
- The three regulars atlases, with project-generated portraits as style references.
- The 25 room states, with project-generated room paintings as the base references.
- The two decoration paintings, with project-generated design references.
- The supper painting, with the final courtyard state and project-generated portraits as references.
- Revisions of five character sketches and four quest scenes, with their previous versions as references.
- The 16 food atlases, with two accepted food atlases of the same set as style references.

A correction edit keeps each pose of the mascot atlas inside its grid cell.
A masked edit changes one cell of the first regulars atlas.
A masked edit removes paint from one sleeve in the second regulars atlas.
A fixed conversion makes the white paper of a revised pencil drawing transparent.
The Sharp image library scales the two portraits of the third regulars atlas inside their cells.
Alpha cuts, moves, box clears, and cell copies between candidates correct the food atlases without painted pixels.
Each later room state edits the previous state of its area.
A composite applies only the changed region.
The decoration composites also apply only their changed regions.
The application displays the authored decoration regions.
