# Feature specifications

Each specification in this folder records one feature of Scary Snacks: its rules, its data, its saves, and its checks. [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), and [DELIVERY.md](../../DELIVERY.md) control the current behavior. A specification does not change a contract. When you change a feature, change its owner documents in the same task.

The implemented specifications cover the prologue, act 1, its calendar, and its seasons.

The game has a prologue of seven events with 16 event quests, six chapters, 24 preparations, and 111 authored quests.
The quests are 88 campaign quests of act 1, five March quests, nine quests of later acts, the supper quest, the recovery quest, and seven repeating quests.

## File names

A specification file has the name `NNN-title.md`. `NNN` is the number of the specification. Each number belongs to one specification.

A companion file has the same number and the same title prefix as its specification. A companion file has no row in the register. The file `001-visible-renovation-art-plan.md` is the companion of specification 001.

## Product direction

The following boundaries apply to every feature:

- unlimited energy;
- no waiting;
- no purchases, advertisements, or accounts;
- quests without a deadline;
- neighbours with tastes that the player can learn and anticipate (010).

The team authors the content, the art, and the rules.

## Feature register

The status column gives the state of each specification. The status of a specification changes only when its owner documents and its checks change.

| Number | Specification | Status | Full-feature dependencies |
| --- | --- | --- | --- |
| 001 | [Visible renovation and areas](001-visible-renovation.md), with its [room states art plan](001-visible-renovation-art-plan.md) | Implemented | None |
| 002 | [Decoration choices](002-decoration-choices.md) | Implemented | 001 |
| 003 | [Ingredient sources](003-generator-progression.md) | Implemented | None |
| 004 | [Character quests and introductions](004-character-quests.md) | Implemented | 008 for scene continuation |
| 005 | [Campaign goals and economy](005-campaign-goals-and-economy.md) | Implemented | None |
| 006 | [Board clearing](006-board-clearing.md) | Implemented | None |
| 007 | [Chapter objectives, story payoffs, and finale](007-chapter-story-and-finale.md) | Implemented | 001, 004, 008 |
| 008 | [Scene transcripts and reading state](008-dialogue-continuation.md) | Implemented | None |
| 009 | [Discovery and recipe book](009-discovery-and-recipe-book.md) | Implemented | None |
| 010 | [Neighbourhood regulars](010-neighbourhood-regulars.md) | Implemented | 008 for arrival scenes |
| 011 | [Motion choice](011-motion-choice.md) | Implemented | None |
| 012 | [Staple chains and mixed dishes](012-staple-chains.md) | Implemented | None |
| 013 | [Bistro day and night](013-day-and-night.md) | Implemented | 012 |
| 014 | [Repeating quests](014-repeating-quests.md) | Implemented | 010, 013 |
| 015 | [Calendar and act 1 dates](015-calendar.md) | Implemented | 013, 014, and 017 in the same change |
| 016 | [The prologue](016-prologue.md) | Implemented | 015, 017 for the pickle barrel |
| 017 | [Seasons and holidays](017-seasons-and-holidays.md) | Implemented | 012, 014, and 015 in the same change |
| 018 | [Act 2](018-act-two.md) | Draft | 015, 016, 017 |

A dependency is a specification that the complete feature needs. A reference to another specification is not always a dependency. Only this register lists the dependencies.

## Shared product boundaries

- Keep the original Transylvanian bistro, black cats, bats, and local dishes.
  Keep the four core characters: Mara, Ilie, Eszter, and Sorin.
  The regulars of spec 010 do not replace the core characters.
- Keep unlimited energy, immediate production, browser-local saves, and quests without a deadline. Do not add timers, purchases, advertisements, accounts, a backend, or runtime calls to an external origin. A temporary effect lasts a counted number of actions, never a span of time.
- Author all content and art independently.
  Obey the source-input limits in [AGENTS.md](../../AGENTS.md).
  Use the current source and these independently authored requirements.
- Put the rules in `src/model.ts`, `src/engine.ts`, and `src/content.ts`. Put the persistence in `src/storage.ts` and the interaction in the interface modules. [`AGENTS.md`](../../AGENTS.md) gives the owner of each module. Do not use the Document Object Model (DOM) in the rules or the persistence. Author data through `tools/create-original-data.ts`.
- The game state has one random seed (013). Only a closing with the thief rat uses and advances the seed. A feature with other random outcomes must coordinate its use of the seed. A failed action does not use resources, advance progress, change a seed, or grant part of a reward.
- Give every objective and reward a stable identifier (ID). Claim each one-time reward once. A journal replay, a scene view, a repeated input, and a reload must not claim the reward again.
- Show a reachable next goal. A mandatory task must not require a reward, area, item, or quest that the same task unlocks. Validate the combined prerequisite graph before release.

## Shared save compatibility

Current saves use game state version 16 in envelope version 15 at `scary-snacks-save-v15`.
The game supports only this format.
Load reads only this key.
If no current save exists, the game starts a new campaign.
The game leaves earlier local bytes unchanged and does not read or convert them.
Import rejects earlier formats.

The optional preparation blocker record uses this format. The record holds the baseline and the placement history. A missing record receives no past preparation batches. The record starts at the next paid preparation. `PRODUCT.md` owns the queue and placement rules.

Validate the full envelope and state before import. Adopt the candidate only after its write succeeds. If a write fails or the input is invalid, keep the previous save and offer recovery. Test fresh, partial, and completed current saves, malformed records, unsupported versions, oversized imports, and failed writes.

Later features must coordinate their state versions and envelope versions. Individual specs do not reserve version numbers. Any future conversion needs explicit approval and a contract. Preserve current progress through reload, export, and import. Never repeat a preparation payment or a reward.

A reward on a full board must have an atomic outcome.
Give a defined reward that needs no board cell, if the feature permits that reward.
Otherwise, reject the action.
Explain the free cells that the action needs.
Never lose an item or pay a reward twice.
Mandatory progression must not depend on an exhausted or inaccessible generator.

## Verification and release

Each specification lists automated acceptance checks.
Automated checks do not replace the interface examination that [AGENTS.md](../../AGENTS.md) requires.
During implementation, add useful regression tests for the changed engine, saves, and browser behavior.
Use `npm run quality:full` for the integrated acceptance check.
Use a fresh `dist/` build for browser evidence.
The full browser suite runs in Chromium under the `/scary-snacks/` path.
The asset and path test also runs at the root path.
Examine desktop and phone layouts in both themes.
Examine keyboard input, reduced motion, and changed art in the browser screenshots.

Record performance measurements only from a stated environment and workload. Test resources that the player earns in play. Report actions, merges, deliveries, chapter checkpoints, and each deadlock.

These files are repository documents. They are not runtime inputs, and the source export does not include them. To include a document in a source release, add it to the file list in `tools/export-source.ts` in the same change.

## Completion record

When you implement a specification, update its status, its scope, its acceptance checks, and its open decisions. Do not mark a specification complete from an engine test alone if the specification requires scene, story, or browser evidence. Keep each deferred item in the register with a reason.
