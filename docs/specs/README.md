# Progression feature specifications

These specifications define features for Scary Snacks. A specification does not implement its feature. [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), and [DELIVERY.md](../../DELIVERY.md) control the current behavior. After you implement a feature, update the related owner documents.

The current game has six chapters, 24 preparations, and 81 authored quests. It also has dialogue replay and item discovery. The specs extend those systems. They do not replace those systems.

## Product direction

The following boundaries apply to the planned features:

- unlimited energy;
- no waiting;
- no purchases, advertisements, or accounts;
- requests without a deadline;
- neighbours whose tastes the player can read and plan for (013).

The team authors the content, the art, and the rules.

## Feature register

Specs 001 and 002 are implemented. The [verification record](../verification.md) gives the test coverage for spec 001. Spec 002 has three second finishes. Three quests unlock them, and a switch on each detail in the room changes the finish. Its [acceptance section](002-decoration-choices.md#acceptance-and-evidence) gives the checks.

Spec 003 implements generator tiers, output choices, and persistence. Its acceptance section records the automated evidence.

Spec 005 implements 81 authored quests and three quest tickets.
The quests include the four core character arcs, regulars, three recurring travellers, and three guests who visit once.
The shared guest visit also earns later local news.
The feature includes optional introductions, atomic delivery, journal replay, and persistence.
Each preparation needs every quest that opens before it.
Spec 006 includes all quests in its economy fixture.
Spec 008 names one quest of a core character as the contribution of each chapter.

Spec 006 implements food prices, preparation budgets, quest rewards, and the funding check.
The feature also includes requirement feedback and a legal campaign fixture.
The fixture includes generator upgrades and all quests.
The economy record gives the price sources and the authored assumptions.

Spec 007 implements blocked board cells, matching merges into visible blocked ingredients, and original blocker art. Each preparation earns two or three contextual blockers with a deferred placement queue. Automated checks cover the rules and the production browser build.

Spec 008 implements chapter objectives and steps, chapter closing scenes, neighbour contributions, the finale, journal replay, and persistence. Automated engine, save, and browser checks cover the rules. A scripted browser playthrough from a fresh save reaches the finale.

Spec 009 implements saved dialogue continuation.
Preparation scenes and quest completion scenes wait with chapter scenes, arrivals, local news, and the finale.
Each waiting scene resumes at its saved line after a reload.
Its acceptance section describes the automated checks.

Spec 011 implements discovery, covered dishes for undiscovered dishes, the new-dish notice, and chain-completion marks.

Spec 013 implements the regulars, their arrivals, arrival scenes, portraits, and quests.
The journal lists the neighbours.

Each entry is proposed, unless its specification records an implemented slice. Priority is a suggested order of work. It does not change the approved product.

| Number | Specification | Priority | Full-feature dependencies |
| --- | --- | --- | --- |
| 001 | [Visible renovation and areas](001-visible-renovation.md), with its [room-states art plan](001-room-states-art-plan.md) | High | None |
| 002 | [Decoration choices](002-decoration-choices.md) | Optional | 001 |
| 003 | [Generator progression](003-generator-progression.md) | High | None |
| 005 | [Character quests](005-character-quests.md) | High | 009 for scene continuation |
| 006 | [Campaign goals and economy](006-campaign-goals-and-economy.md) | High | None |
| 007 | [Board clearing](007-board-clearing.md) | Optional | None |
| 008 | [Chapter story and finale](008-chapter-story-and-finale.md) | High | 001, 005, 009 |
| 009 | [Dialogue continuation](009-dialogue-continuation.md) | Medium | None |
| 011 | [Discovery and recipe book](011-discovery-and-recipe-book.md) | Optional | None |
| 012 | [Post-campaign goals](012-post-campaign-goals.md) | Optional | 005, 008, 011 |
| 013 | [Neighbourhood regulars](013-neighbourhood-regulars.md) | High | 009 for arrival scenes |
| 015 | [The front door](015-front-door.md) | Medium | None |

A reference to another specification is not always a prerequisite. Early slices can be independent. The table lists the dependencies of the complete feature. The register keeps optional entries, so that planning does not lose them.

## Coverage

The table maps each gap in the current game to the specifications that close it.

| Gap | Owning specifications |
| --- | --- |
| The finale names no regulars yet | 008, 013 |
| No requests remain after the supper, so the game has no goals after the campaign | 012 |
| Proposed features need browser coverage when implemented | Acceptance checks in 012, 015 |
| No start screen. Reduced motion can be on without a notice, and the player cannot change it | 015 |

Neighbour introductions (005) are optional journal reading. Optional post-campaign goals (012) remain proposed. Decoration choices (002) are visual choices, not a branching story.

## Shared product boundaries

- Keep the original Transylvanian bistro, black cats, bats, and local dishes.
  Keep the four core characters: Mara, Ilie, Eszter, and Sorin.
  Spec 013 adds regulars to the neighbourhood. The regulars do not replace the core characters.
  The features use the existing six chapters and 24 preparations.
- Keep unlimited energy, immediate production, browser-local saves, and requests without a deadline. Do not add timers, purchases, advertisements, accounts, a backend, or runtime calls to an external origin. A temporary effect lasts a counted number of actions, never a span of time.
- Author all content and art independently.
  Obey the source-input limits in [AGENTS.md](../../AGENTS.md).
  Use the current source and these independently authored requirements.
- Put the rules in `src/engine.ts`, the persistence in `src/storage.ts`, and the interaction in `src/app.ts`. Do not use the Document Object Model (DOM) in the first two files. Author data through `tools/create-original-data.ts`.
- The game state has no random seed. A feature with random outcomes adds a seed to the state. Failed actions do not use resources, advance progress, change a seed, or grant part of a reward.
- Give every objective and reward a stable identifier (ID). Claim each one-time reward once. Journal replay, scene viewing, repeated input, and reload must not claim the reward again.
- Show a reachable next goal. A mandatory task must not require a reward, area, item, or quest that the same task unlocks. Validate the combined prerequisite graph before release.

## Shared save compatibility

Current saves use game state version 12 in envelope version 11 at `scary-snacks-save-v11`.
The game supports only this format.
Load reads only this key.
If no current save exists, the game starts a new campaign.
The game leaves earlier local bytes unchanged and does not read or convert them.
Import rejects earlier formats.

The optional preparation obstacle baseline and placement history use this format. A missing record receives no past preparation batches. It starts at the next paid preparation. `PRODUCT.md` owns the queue and placement rules.

Validate the full envelope and state before import. Adopt the candidate only after its write succeeds. A failed write or invalid input keeps the previous save and offers recovery. Test fresh, partial, and completed current saves, malformed records, unsupported versions, oversized imports, and failed writes.

Later features must coordinate their state and envelope versions. Individual specs do not reserve version numbers. Any future conversion needs explicit approval and a contract. Preserve current progress through reload and export/import. Never repeat a preparation payment or reward.

A reward on a full board must have an atomic outcome.
Give a defined reward that needs no board cell, if the feature permits that reward.
Otherwise, reject the action.
Explain the space that the action needs.
Never lose an item or pay a reward twice.
Mandatory progression must not depend on an exhausted or inaccessible generator.

## Suggested delivery order

Add the slices of 012 separately. These slices must not delay the core progression.

Spec 015 adds no game state and is not part of this order.

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

These files are repository planning documents. They are not runtime inputs, and the allowlist of the source export does not include them. If a source release needs a document, add the document through the export owner in the same slice.

## Completion record

When you implement a spec, update its status, implemented scope, acceptance checks, and remaining decisions. Do not mark a spec complete from an engine test alone if the spec requires scene, story, or browser evidence. Keep deferred items in this register with a reason.
