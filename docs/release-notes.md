# Release notes and remaining risk

## Release contents

Scary Snacks is an original fictional Transylvanian bistro game.
Its title, cast, dialogue, initial board, item progression, economy, art, and sounds are original to this project.

The source is TypeScript 7. The build publishes its three runtime modules as browser scripts. The build allowlist contains these items:

- index.html
- four runtime files
- the authored game JavaScript Object Notation (JSON) data
- AV1 Image File Format (AVIF) and WebP variants of the approved generated Portable Network Graphics (PNG) masters
- two SIL Open Font License (OFL) fonts
- the license texts of the fonts
- an empty `.nojekyll` file

The fonts ship as Web Open Font Format 2 (WOFF2) files. These files are lossless repackagings of the upstream fonts. The build copies them unchanged.

The build excludes the PNG masters, the local folders `private/` and `analysis/`, and vendor code.
Tests check the asset hashes. Tests also check that the runtime files and the game data load assets only from the variant and font folders.
The Pages workflow uploads only `dist/`. The workflow runs on every push to `main` and when a person starts it manually.

## Legal limits

These limits reduce possible source confusion. They do not guarantee that no person can make a legal claim. They do not establish ownership of every generated output. They do not clear the title as a trademark. An intellectual-property lawyer should review the intended release and the applicable jurisdictions before publication.

The [U.S. Copyright Office](https://www.copyright.gov/register/tx-games.html) distinguishes game ideas and methods from expressive text and artwork. The [United States Patent and Trademark Office (USPTO)](https://www.uspto.gov/trademarks/search/likelihood-confusion) explains the risk of confusion for similar marks on related goods. These are general U.S. references. They are not a determination of the law that governs this project.

The only name check is a quick exact-name search. The search finds no exact game-title match for Scary Snacks.
The project has no comprehensive search of trademark registers, common-law rights, company names, domains, or international clearance.

## Public repository

The GitHub repository is public. The game is live at https://satyrlord.github.io/scary-snacks/.
Each tracked file is public. Private documents stay in the ignored folder `private/`.
`npm run release:source` makes a source export without Git history.
Do not publish the whole workspace, `private/`, or `analysis/`.

## Local folders

The ignored folder `private/` holds private documents and archives. The ignored folder `analysis/` holds the build manifest and the art-generation candidates.
They are not runtime dependencies. Do not use `private/` as an input for source code, content, art, or tests.

## Art provenance

The game ships image variants from 33 masters. The build excludes the PNG masters.

- The OpenAI Images API (gpt-image-2.5-flare, high quality) made the food atlas and the mascots.
  Each repaints an earlier atlas that the built-in in-chat imagegen tool made for this project. The mascots then had one correction of the grid fit.
- The same API made the timber tabletop and the embroidered runner from text-only prompts.
  The portraits are a revision of a text-only first candidate. The revision used only that candidate as its reference.
- The same API made the 25 painted room states.
  The two base states use generated room paintings of this project as references.
  Each later state edits the previous state of its area. A composite applies only the changed region.
- The same API made the two decoration edit paintings. Each edits a room state, with a design reference that the in-chat imagegen tool made.
  A composite applies only the changed regions. The app samples only their authored regions.
- The built-in chat image generator made the board-clutter atlas. It used the food atlas only as a style reference.
  Later edits corrected the fit of the sprite cells and removed webs from the four clutter objects.

The files `docs/asset-prompts.json` and `docs/asset-provenance.json` record the prompts and the hashes. Provenance is not an intellectual-property warranty.
