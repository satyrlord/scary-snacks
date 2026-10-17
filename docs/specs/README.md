# Progression feature specifications

These specifications define features for the Scary Snacks game. A specification does not implement its feature. [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), and [DELIVERY.md](../../DELIVERY.md) own the current behavior. After the team implements a feature, change the related sections of the owner documents.

The current game has six chapters and 24 preparations. It also has dialogue replay, item discovery, orders that become harder, and endless orders. The specs extend those systems. They do not replace those systems.

## Product direction

Scary Snacks should have the features that players expect in a story-driven merge game. These features are a neighbourhood of customers, character quests, visible renovation, chapter story, producer upgrades, and collections. The game should also differ clearly from the genre in the points that players dislike. The differences are:

- unlimited energy;
- no waiting;
- no purchases, advertisements, or accounts;
- orders that never expire;
- customers whose tastes the player can read and plan for (013);
- the cats of the bistro as part of play (014).

The team authors the content, the art, and the rules.

## Feature register

Specs 001 and 002 are implemented. The [verification record](../verification.md) gives the evidence for spec 001. Spec 002 adds three free choices in the House book. The user verified it and accepted it. Its [acceptance section](002-decoration-choices.md#acceptance-and-evidence) gives the checks.

Spec 003 implements generator tiers, output choices, and persistence. Its acceptance section records the automated evidence.

Spec 004 implements the finite coin rewards, the House book level panel, and claim persistence. Its acceptance section records the automated checks.

Spec 005 implements four core character arcs, three recurring cathedral travellers, a single-visit dinner guest, optional introductions, a temporary bread-tasting source, atomic delivery, journal replay, and persistence. Automatic scene continuation waits for 009. Spec 006 includes all quests in its economy fixture. Spec 008 names one regular quest of each arc as a chapter contribution.

Spec 006 implements explicit food prices, work-based preparation budgets and effort, requirement feedback, saved quotes, and legal campaign comparisons. The fixture includes generator upgrades, all level rewards, and optional quests. The economy record gives the real-world source anchors and the authored assumptions.

Spec 007 implements blocked board cells, adjacent merge reveals, anchored ingredients, and original clutter art. Automated checks cover the rules and the production browser build.

Spec 008 implements chapter objectives and steps, chapter closing scenes, neighbour contributions, the finale, journal replay, and persistence. Automated engine, save, and browser checks cover the rules. A scripted browser playthrough from a fresh save reaches the finale.

Each entry is proposed, unless its specification records an implemented slice. Spec 011 has discovery cloches, notices, and order help. Its chain-completion marks are proposed. Priority is a suggested order of work. It does not change the approved product.

| Number | Specification | Priority | Full-feature dependencies |
| --- | --- | --- | --- |
| 001 | [Visible renovation and areas](001-visible-renovation.md), with its [room-states art plan](001-room-states-art-plan.md) | High | None |
| 002 | [Decoration choices](002-decoration-choices.md) | Optional | 001 |
| 003 | [Generator progression](003-generator-progression.md) | High | None |
| 004 | [Level rewards](004-level-rewards.md) | Medium | None |
| 005 | [Character quests](005-character-quests.md) | High | 009 for scene continuation |
| 006 | [Campaign goals and economy](006-campaign-goals-and-economy.md) | High | None |
| 007 | [Board clearing](007-board-clearing.md) | Optional | None |
| 008 | [Chapter story and finale](008-chapter-story-and-finale.md) | High | 001, 005, 009 |
| 009 | [Dialogue continuation](009-dialogue-continuation.md) | Medium | None |
| 010 | [Guided introduction](010-guided-introduction.md) | Medium | 006, 009, 015 |
| 011 | [Discovery and recipe book](011-discovery-and-recipe-book.md) | Optional | None |
| 012 | [Post-campaign goals](012-post-campaign-goals.md) | Optional | 008, 011 |
| 013 | [Neighbourhood regulars](013-neighbourhood-regulars.md) | High | 009 for arrival scenes |
| 014 | [Miez's visits](014-miez-visits.md) | Medium | 006 for balance, 009 for the first-visit scene |
| 015 | [The front door](015-front-door.md) | Medium | None |

A reference to another specification is not always a prerequisite. Early slices can be independent. The table lists the dependencies of the complete feature. The register keeps optional entries, so that planning does not lose them.

## Coverage

The table maps each gap in the current game to the specifications that close it.

| Gap | Owning specifications |
| --- | --- |
| The finale names no regulars yet | 008, 013 |
| Dialogue has no automatic continuation after reload | 009 |
| Hints exist but no staged introduction | 010 |
| The recipe book has no chain-completion marks | 011 |
| Endless orders exist but have few long-term goals after the supper | 012 |
| The browser tests for story and chapters are incomplete | Acceptance checks in 001, 005, 009, 010, 012 |
| Four customers are too few for a business | 013 |
| The resident cat has no part in play | 014 |
| No start screen. Reduced motion can be on without a notice, and the player cannot change it | 015 |

Customer introductions (005) are optional journal reading. Regulars (013), Miez's visits (014), and optional post-campaign goals (012) remain proposed. Decoration choices (002) are visual choices, not a branching story.

## Shared product boundaries

- Keep the original Transylvanian bistro, the four core characters (Mara, Ilie, Eszter, and Sorin), black cats, bats, and local dishes. Spec 013 adds regulars as customers. The regulars do not replace the core characters. The first implementation targets the existing six chapters and 24 preparations.
- Keep unlimited energy, immediate production, browser-local saves, and ordinary orders after the campaign. Do not add timers, purchases, advertisements, accounts, a backend, or runtime calls to an external origin. A temporary effect lasts a counted number of actions, never a span of time.
- Author all content and art independently. Do not use `private/` or `analysis/` as implementation, asset, or test inputs. Use the current source and these independently authored requirements.
- Put the rules in `src/engine.ts`, the persistence in `src/storage.ts`, and the interaction in `src/app.ts`. Do not use the Document Object Model (DOM) in the first two files. Author data through `tools/create-original-data.ts`.
- Use seeded state for random outcomes. Failed actions do not use resources, advance progress, change the seed, or grant part of a reward.
- Give every objective and reward a stable identifier (ID). Claim each one-time reward once. Journal replay, scene viewing, repeated input, and reload must not claim the reward again.
- Show a reachable next goal. A mandatory task must not require a reward, area, item, or quest that the same task unlocks. Validate the combined prerequisite graph before release.

## Shared save compatibility

Current saves use game state version 9 in envelope version 8 at `scary-snacks-save-v8`. Only this format is supported. Load reads only this key. If no current save exists, start a new campaign. Earlier local bytes stay unchanged and are not read or converted. Import rejects earlier formats.

Validate the full envelope and state before import. Adopt the candidate only after its write succeeds. A failed write or invalid input keeps the previous save and offers recovery. Test fresh, partial, and completed current saves, malformed records, unsupported versions, oversized imports, and failed writes.

Later features must coordinate their state and envelope versions. Individual specs do not reserve version numbers. Any future conversion needs explicit approval and a contract. Preserve current progress through reload and export/import. Never repeat a preparation payment or reward.

A reward on a full board must have an atomic outcome: where possible, give a defined reward that needs no board cell. Otherwise, do not commit the action, and explain the space that the action needs. Never lose an item or pay a reward twice. Mandatory progression must not depend on an exhausted, sold, or inaccessible producer.

## Suggested delivery order

1. Implement durable story continuation in 009. Exit: after a reload, a task scene resumes its conversation without another payment.
2. Add the four starting regulars in 013. Check them with the campaign goals in 006 and character quests in 005. Exit: a fresh game serves eight distinct neighbours. A legal path in a fresh game needs real kitchen service and cannot be circular.
3. Build on the generator improvement in 003 with level rewards in 004 and Miez's visits in 014. Exit: chapter rewards improve play while every outstanding order stays possible. The 006 fixture measures income with the blessing.
4. Build the guided start in 010 on the chapter story of 008. Exit: a fresh campaign and a reloaded campaign reach the supper without added resources.
5. Add optional 007, the remaining work of 011, and 012 as separate slices. These slices must not delay the core progression fixes.

Spec 015 adds no game state and is not part of this order. Build it before 010, so that the guided start begins behind the front door.

## Verification and release

Each spec lists automated acceptance checks. A spec has no manual acceptance gate: it is complete when its automated checks pass. During implementation, add the smallest useful regression tests for the engine, the saves, and the browser. Use `npm run quality:full` for the integrated acceptance check. Browser evidence must use a fresh `dist/` build. The full browser suite runs in Chromium under the `/scary-snacks/` path. The asset and path test also runs at the root path. Examine desktop and phone layouts, both themes, keyboard input, reduced motion, and the changed art in the browser screenshots.

Record performance measurements only from a stated environment and workload. Test resources that the player earns in play. Report actions, merges, orders, chapter checkpoints, and each deadlock.

These files are repository planning documents. They are not runtime inputs, and the allowlist of the source export does not include them. If a source release needs a document, add the document through the export owner in the same slice.

## Completion record

When you implement a spec, update its status, implemented scope, acceptance checks, and remaining decisions. Do not mark a spec complete from an engine test alone if the spec requires scene, story, or browser evidence. Keep deferred items in this register with a reason.
