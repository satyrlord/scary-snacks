# Progression feature specifications

These specifications define features for the Scary Snacks game. A specification does not implement its feature. [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), and [DELIVERY.md](../../DELIVERY.md) own the current behavior. After the team implements a feature, change the related sections of the owner documents.

The current game has six chapters, 24 preparations, and 63 authored quests. It also has dialogue replay and item discovery. The specs extend those systems. They do not replace those systems.

## Product direction

Scary Snacks should have the features that players expect in a story-driven merge game. These features are a growing neighbourhood, character quests, visible renovation, chapter story, producer upgrades, and collections. The game should also differ clearly from the genre in the points that players dislike. The differences are:

- unlimited energy;
- no waiting;
- no purchases, advertisements, or accounts;
- requests without a deadline;
- neighbours whose tastes the player can read and plan for (013);
- the cats of the bistro as part of play (014).

The team authors the content, the art, and the rules.

## Feature register

Specs 001 and 002 are implemented. The [verification record](../verification.md) gives the evidence for spec 001. Spec 002 has three second finishes. Three quests unlock them, and a switch on each detail in the room changes the finish. Its [acceptance section](002-decoration-choices.md#acceptance-and-evidence) gives the checks.

Spec 003 implements generator tiers, output choices, and persistence. Its acceptance section records the automated evidence.

Spec 005 implements the quest campaign: 63 authored quests, three quest tickets, the four core character arcs, the quests of the regulars, three recurring cathedral travellers, a single-visit dinner guest, a shared single visit with later local news, optional introductions, atomic delivery, journal replay, and persistence. Each preparation needs every quest that opens before it. Spec 006 includes all quests in its economy fixture. Spec 008 names one quest of a core character as the contribution of each chapter.

Spec 006 implements explicit food prices, work-based preparation budgets, the quest reward rule, the funding check, requirement feedback, and a legal campaign fixture. The fixture includes generator upgrades and all quests. The economy record gives the real-world source anchors and the authored assumptions.

Spec 007 implements blocked board cells, matching merges into visible blocked ingredients, and original blocker art. Each preparation earns two or three contextual blockers with a deferred placement queue. Automated checks cover the rules and the production browser build.

Spec 008 implements chapter objectives and steps, chapter closing scenes, neighbour contributions, the finale, journal replay, and persistence. Automated engine, save, and browser checks cover the rules. A scripted browser playthrough from a fresh save reaches the finale.

Spec 009 implements durable dialogue continuation. Preparation scenes and quest completion scenes wait with the chapter scenes, and each waiting scene resumes at its saved line after a reload. Its acceptance section records the automated checks.

Spec 013 implements the roster, the arrivals, the arrival scenes, the portraits, the neighbours list, and the quests of the regulars. Taste-driven orders are not part of the game.

Each entry is proposed, unless its specification records an implemented slice. Spec 011 has discovery cloches, notices, and item help. Its chain-completion marks are proposed. Priority is a suggested order of work. It does not change the approved product.

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
| 010 | [Guided introduction](010-guided-introduction.md) | Medium | 006, 009, 015 |
| 011 | [Discovery and recipe book](011-discovery-and-recipe-book.md) | Optional | None |
| 012 | [Post-campaign goals](012-post-campaign-goals.md) | Optional | 005, 008, 011 |
| 013 | [Neighbourhood regulars](013-neighbourhood-regulars.md) | High | 009 for arrival scenes |
| 014 | [Miez's visits](014-miez-visits.md) | Medium | 006 for balance, 009 for the first-visit scene |
| 015 | [The front door](015-front-door.md) | Medium | None |

A reference to another specification is not always a prerequisite. Early slices can be independent. The table lists the dependencies of the complete feature. The register keeps optional entries, so that planning does not lose them.

## Coverage

The table maps each gap in the current game to the specifications that close it.

| Gap | Owning specifications |
| --- | --- |
| The finale names no regulars yet | 008, 013 |
| Hints exist but no staged introduction | 010 |
| The recipe book has no chain-completion marks | 011 |
| No requests remain after the supper, so the game has no goals after the campaign | 012 |
| The browser tests for story and chapters are incomplete | Acceptance checks in 001, 005, 010, 012 |
| The resident cat has no part in play | 014 |
| No start screen. Reduced motion can be on without a notice, and the player cannot change it | 015 |

Neighbour introductions (005) are optional journal reading. Miez's visits (014) and optional post-campaign goals (012) remain proposed. Decoration choices (002) are visual choices, not a branching story.

## Shared product boundaries

- Keep the original Transylvanian bistro, the four core characters (Mara, Ilie, Eszter, and Sorin), black cats, bats, and local dishes. Spec 013 adds regulars to the neighbourhood. The regulars do not replace the core characters. The first implementation targets the existing six chapters and 24 preparations.
- Keep unlimited energy, immediate production, browser-local saves, and requests without a deadline. Do not add timers, purchases, advertisements, accounts, a backend, or runtime calls to an external origin. A temporary effect lasts a counted number of actions, never a span of time.
- Author all content and art independently. Do not use `private/` or `analysis/` as implementation, asset, or test inputs. Use the current source and these independently authored requirements.
- Put the rules in `src/engine.ts`, the persistence in `src/storage.ts`, and the interaction in `src/app.ts`. Do not use the Document Object Model (DOM) in the first two files. Author data through `tools/create-original-data.ts`.
- The game state has no random seed. A feature with random outcomes adds a seed to the state. Failed actions do not use resources, advance progress, change a seed, or grant part of a reward.
- Give every objective and reward a stable identifier (ID). Claim each one-time reward once. Journal replay, scene viewing, repeated input, and reload must not claim the reward again.
- Show a reachable next goal. A mandatory task must not require a reward, area, item, or quest that the same task unlocks. Validate the combined prerequisite graph before release.

## Shared save compatibility

Current saves use game state version 10 in envelope version 9 at `scary-snacks-save-v9`. Only this format is supported. Load reads only this key. If no current save exists, start a new campaign. Earlier local bytes stay unchanged and are not read or converted. Import rejects earlier formats.

The optional preparation obstacle baseline and placement history use this format. A missing record receives no past preparation batches. It starts at the next paid preparation. `PRODUCT.md` owns the queue and placement rules.

Validate the full envelope and state before import. Adopt the candidate only after its write succeeds. A failed write or invalid input keeps the previous save and offers recovery. Test fresh, partial, and completed current saves, malformed records, unsupported versions, oversized imports, and failed writes.

Later features must coordinate their state and envelope versions. Individual specs do not reserve version numbers. Any future conversion needs explicit approval and a contract. Preserve current progress through reload and export/import. Never repeat a preparation payment or reward.

A reward on a full board must have an atomic outcome: where possible, give a defined reward that needs no board cell. Otherwise, do not commit the action, and explain the space that the action needs. Never lose an item or pay a reward twice. Mandatory progression must not depend on an exhausted, sold, or inaccessible producer.

## Suggested delivery order

1. Build Miez's visits in 014 on the quest campaign of 005. Exit: every open request stays possible, and the 006 fixture measures income with the blessing.
2. Build the guided start in 010 on the chapter story of 008. Exit: a fresh campaign and a reloaded campaign reach the supper without added resources.
3. Add the remaining work of 011 and 012 as separate slices. These slices must not delay the core progression.

Spec 015 adds no game state and is not part of this order. Build it before 010, so that the guided start begins behind the front door.

## Verification and release

Each spec lists automated acceptance checks. A spec has no manual acceptance gate: it is complete when its automated checks pass. During implementation, add the smallest useful regression tests for the engine, the saves, and the browser. Use `npm run quality:full` for the integrated acceptance check. Browser evidence must use a fresh `dist/` build. The full browser suite runs in Chromium under the `/scary-snacks/` path. The asset and path test also runs at the root path. Examine desktop and phone layouts, both themes, keyboard input, reduced motion, and the changed art in the browser screenshots.

Record performance measurements only from a stated environment and workload. Test resources that the player earns in play. Report actions, merges, deliveries, chapter checkpoints, and each deadlock.

These files are repository planning documents. They are not runtime inputs, and the allowlist of the source export does not include them. If a source release needs a document, add the document through the export owner in the same slice.

## Completion record

When you implement a spec, update its status, implemented scope, acceptance checks, and remaining decisions. Do not mark a spec complete from an engine test alone if the spec requires scene, story, or browser evidence. Keep deferred items in this register with a reason.
