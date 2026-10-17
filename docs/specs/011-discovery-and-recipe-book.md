# 011 Discovery and recipe book

Status: Partly implemented; remaining work is proposed. Priority: Optional. Dependencies: none.

## Current behavior and outcome

[`src/engine.ts`](../../src/engine.ts) records the item codes that the player discovers.
In `recipeBook` ([`src/app.ts`](../../src/app.ts)), the game shows each discovered dish.
The game keeps every undiscovered dish under a "Not yet" cloche that the player cannot use.
The user interface (UI) shows the dish count from the authored data, which has 30 dishes.
After a take or merge discovers dishes, the UI announces the first new dish and marks the book.
The book marker counts all dishes discovered by that take or merge.
Other successful actions can discover visible blocker ingredients without that notice or marker.
The details of a requested dish give production help and do not add a discovery.
Persistent chain-completion marks remain proposed.

`DESIGN.md` controls the current cloche presentation. The proposal below for a silhouette and a stage number does not replace the cloche. Decide this design question before you do the remaining work.

Make discovery visible in the recipe book, so that a new dish shows progress. Keep enough information available to plan deliveries. This proposal adds no discovery-reward economy.

## Proposed rules

1. Show every chain as a stable list of six positions. Show the full art and details of a discovered dish. Show a clear silhouette and the stage number of an undiscovered dish.
2. A successful game action that creates or receives a real item discovers the item once. Reading a request, previewing an upgrade, or viewing a recipe does not discover an item.
3. Each quest ticket and request dialog shows the name, chain, stage, and production path of the required dish. An undiscovered dish gets the same help. The planning help does not show the dish as collected.
4. The player must be able to understand the next step from a selected known item. Do not hide a required generator instruction or merge instruction to make the game artificially difficult.
5. The book shows a dish-only count out of 30. Generators can appear in a separate help section. They do not increase the count. When content changes in the future, derive the denominator from the active authored dish catalog.
6. When the player completes a chain, the book adds a persistent completion mark. The game derives the mark from the discoveries. In this slice, the mark gives no coins, generators, or task credit.
7. A new discovery can show a brief notice that the player can dismiss. If one action makes multiple discoveries, show one combined notice. The notice must not trap focus and must not block the board.

## State and data

Reuse the existing permanent `discovered` set. Derive chain completion and book completion from the authored dish identifiers (IDs). Do not save another count that can change by itself. Validate the discoveries against the available item definitions and the applicable progression rules.

The engine owns the discovery transitions.
The proposed UI distinguishes discovered dishes, undiscovered dishes on quest tickets, and other undiscovered dishes.
Text from a save never becomes HyperText Markup Language (HTML).

Generator tiers from [003](003-generator-progression.md) must not erase old discoveries. Content may assign an item to the permanent catalog explicitly.

## Save compatibility

Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
Keep valid discoveries through save and reload.
The discoveries must include every movable item on the board, as validation requires.
New games also discover all visible blocker ingredients.
Current saves can omit discoveries for unresolved clutter, as [007](007-board-clearing.md) describes.
A repeated load must not replay every discovery notice. Notice acknowledgements are presentation-only and grant no reward.

## Thin implementation slices

1. **Book states (implemented with cloches).** Keep the known and unknown entries on the existing discovery state. Exit: a new game and a partially played game show the correct dish count and placeholders.
2. **Production and item help (implemented).** Keep the notices and the required-item hints. Exit: the player can still plan an unknown requested dish. The book reveals the dish permanently when the player creates the dish. Combined notices for future multi-item actions remain proposed.
3. **Chain completion.** Add the marks and the checks of saved state. Exit: after reload, all 30 discovered dishes show a complete book, with no other reward.

## Acceptance checks

- Engine: the create, merge, and grant paths discover an item once. Failed actions and previews do not discover. A sold dish stays discovered.
- Data: every dish that a quest requests has a readable production path. The book totals exclude generators.
- Saves: discoveries survive a save and a load. The game rejects unknown item IDs without a change to the original save.
- Browser: examine an undiscovered dish on a quest ticket. Make the dish with legal actions. Examine the revealed entry. Sell the dish and reload. The entry must stay revealed.
- Accessibility: unknown entries have useful names. The known or unknown status does not use color alone. Focus stays stable after a discovery refresh.

## Remaining design work

Resolve the proposed silhouette design against the cloche contract in `DESIGN.md` before implementation.
Keep cloches unless the user approves a design change.
If silhouettes receive approval, draw original art.
Choose the notice position in a small UI model.
Keep production help for every requested dish, including undiscovered dishes.
