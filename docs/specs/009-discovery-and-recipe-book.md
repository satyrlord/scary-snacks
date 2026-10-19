# 009: Discovery and recipe book

Status: Implemented.

## Behavior

[`src/engine.ts`](../../src/engine.ts) records the item codes that the player discovers in the permanent `discovered` set.
A new game discovers only the items on its initial board.
After that, only a successful take or merge discovers a dish.
A blocker shows its ingredient on the board, but it does not discover that ingredient.
A delivery, a blocker placement, and a dialog do not discover a dish.
A preparation payment discovers the source that it unlocks. A source is not a dish.
Thus one action discovers at most one dish.

The `recipeBook` function in [`src/dishes.ts`](../../src/dishes.ts) shows each chain as a list of six dishes in a fixed order.
A discovered dish shows its art and name and opens its item dialog.
An undiscovered dish shows a "Not yet" covered dish: a plate under a dome cover. The player cannot use it.
`DESIGN.md` controls the covered dish.

When a take or a merge discovers a dish, the action message starts with "[Dish] is a new dish! It is in the recipe book now."
The other parts of the message stay, for example a blocker placement.
The book link shows the new marker until the player opens the book.
The book link also shows the count of discovered dishes, for example "12 of 30 dishes discovered".
While the marker shows, the count ends with ", N new". N is the number of new dishes.
The marker is for display only. A reload clears it and does not replay a notice. The marker gives no reward.

The book covers dishes only. It does not hide a source instruction or a merge instruction that the player needs.

## Chain-completion marks

1. A chain is complete when the player has discovered all six of its dishes.
   The game derives this from `discovered` and the authored dish identifiers (IDs).
2. The book heading of a complete chain shows a check mark and the word "Complete" after the chain name.
   The accessible name of the heading is "[Chain], complete". The mark does not use color alone.
3. Only the book heading shows the mark. The item dialog and the book link do not show it.
4. The mark gives no coins, sources, quest credit, or other reward.
5. The mark has no notice. The new-dish notice of the last dish stays the only notice.
6. When every chain is complete, every heading shows its mark. The book has no other full-book state.

## State and save compatibility

Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
Use the `discovered` set. Do not save a mark or a count.
Keep valid discoveries through save and reload.
Sources from [003](003-generator-progression.md) do not erase discoveries. Higher-stage dishes remain discovered after a merge.

Validation accepts a discovery only for a known item of an open chain.
Each movable item on the board must be discovered.
Each resolved blocker must have its ingredient discovered, because the player merged that ingredient.
An unresolved blocker needs no discovery.
Validation also accepts the ingredient of an unresolved blocker in `discovered`. The game keeps that discovery.
Text from a save never becomes HyperText Markup Language (HTML).

## Acceptance and evidence

- Engine: a new game discovers only its initial board items.
  A take and a merge discover a dish once.
  A visible blocker, a delivery, a failed action, and a dialog add no dish discovery.
  A delivered dish stays discovered.
- Engine: a merge that makes a new dish and places a waiting blocker keeps both parts of the message.
- Saves: discoveries survive a save and a load. The game rejects unknown item IDs without a change to the original save.
- Browser: a dish that a quest needs and the player has not made stays covered.
  Make the dish with legal actions, deliver it, and reload. The book entry must stay revealed.
- Browser: a chain with six discovered dishes shows the mark. A chain with five dishes does not.
  Reload keeps the mark, and the save does not change.
  Examine both themes at the desktop size and the phone size.
- Accessibility: an unknown entry has the name "Not yet".
  The known or unknown status and the mark do not use color alone.
  Focus stays stable after a discovery refresh.
