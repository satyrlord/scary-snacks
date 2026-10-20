# 009: Discovery and recipe book

Status: Implemented.

## Behavior

[`src/engine.ts`](../../src/engine.ts) records the item codes that the player discovers in the permanent `discovered` set.
A new game discovers the items on its initial board and the dishes of the quests that hold a ticket.
After that, a successful take or merge discovers its dish, and a gift of Șoricescu discovers the gift.
A quest that takes a ticket discovers its dishes, so a ticket never shows a dish that the recipe book hides.
A blocker shows its blocked dish on the board, but it does not discover that dish.
A blocker placement and a dialog do not discover a dish.
A delivery can reveal a new ticket and discover its dishes.
A preparation payment discovers the source that it unlocks. A source is not a dish.

The `recipeBook` function in [`src/dishes.ts`](../../src/dishes.ts) shows one section for each of the 12 chains, with its dishes in stage order.
A last section, Mixed dishes, lists the 24 mixed dishes of spec 012 in a fixed order.
A discovered dish shows its art and name and opens its item dialog.
The item dialog of a mixed dish shows its recipe. The item dialog of a part names the mixed dishes that it makes.
Close or Escape from that dialog returns to the same scroll position in the book and focuses its dish entry.
"Show me on the board" closes the dialog and focuses the next board step.
For a mixed dish, it guides toward the missing part with the fewest steps.
Board guidance raises a lowered kitchen drawer before it focuses the next step.
If the dish is not yet on the board, a temporary guide names the requested dish and updates its next step after actions. A dish that is already on the board needs only the one-time pointer. The guide marks useful board cells and never takes, moves, merges, or delivers for the player. A successful take or merge that makes another requested dish ends the guide. Stop, Escape from the board or a guide control, or another tap on the selected dish or blocker cancels it. A tap on a selected source takes another ingredient. The guide is not saved and ends when the game is replaced. On a narrow screen, a ready preparation leaves the guide's Stop control visible. Pay stays available in Story until the guide ends.
When the board is full, the guide points to a legal merge toward the dish, a ready delivery that removes dishes, or another legal pair or blocker merge, in that order. The ready Deliver button gets the same dotted cue as a board target. Blocked items do not count as movable matches. If none can make space, the guide explains this and keeps Stop available. It does not recommend a source take while the board is full.
An item opened from a quest returns to the quest instead.
An undiscovered dish shows a "Not yet" covered dish: a plate under a dome cover. The player cannot use it.
`DESIGN.md` controls the covered dish.

When a take or a merge discovers a dish, the action message starts with "[Dish] is a new dish! It is in the recipe book now."
The other parts of the message stay, for example a blocker placement.
The book link shows the new marker until the player opens the book.
The book link also shows the count of discovered dishes, for example "12 of 85 dishes discovered".
While the marker shows, the count ends with ", N new". N is the number of new dishes.
The marker is for display only. A reload clears it and does not replay a notice. The marker gives no reward.

The book covers dishes only. It does not hide a source instruction or a merge instruction that the player needs.

## Section-completion marks

1. A book section is a chain or the Mixed dishes section.
   A section is complete when the player has discovered all its dishes.
   The game derives this from `discovered` and the authored dish identifiers (IDs).
2. The heading of a complete section shows a check mark and the word "Complete" after the section name.
   The accessible name of the heading is "[Section], complete". The mark does not use color alone.
3. Only the book heading shows the mark. The item dialog and the book link do not show it.
4. The mark gives no coins, sources, quest credit, or other reward.
5. The mark has no notice. The new-dish notice of the last dish stays the only notice.
6. When every section is complete, every heading shows its mark. The book has no other full-book state.

## State and save compatibility

Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
Use the `discovered` set. Do not save a mark or a count.
Keep valid discoveries through save and reload.
Sources from [003](003-generator-progression.md) do not erase discoveries. Higher-stage dishes remain discovered after a merge.

Validation accepts a discovery only for a known item whose chains are all open.
Each movable item on the board must be discovered.
Each resolved blocker needs a discovered dish that merges with its blocked dish, because the player merged that dish into it.
An unresolved blocker needs no discovery.
Validation also accepts the dish of an unresolved blocker in `discovered`. The game keeps that discovery.
Text from a save never becomes HyperText Markup Language (HTML).

## Acceptance and evidence

- Engine: a new game discovers its initial board items and the dishes of its tickets.
  A take, a merge, and a gift discover a dish once.
  A new ticket discovers its dishes, including when a delivery makes that ticket available.
  A visible blocker, a failed action, and a dialog add no dish discovery.
  A delivered dish stays discovered.
- Engine: a merge that makes a new dish and places a waiting blocker keeps both parts of the message.
- Saves: discoveries survive a save and a load. The game rejects unknown item IDs without a change to the original save.
- Browser: a dish that a ticket needs is revealed before the player makes it.
  A dish with no discovery stays covered.
  Make a dish with legal actions, deliver it, and reload. The book entry must stay revealed.
- Browser: open a discovered dish near the end of the book. Close and Escape return to that dish and restore the book's scroll position. "Show me on the board" goes straight to the board. Quest help still returns to its quest.
- Browser: a temporary guide updates after takes, merges, moves, blocker clearing, and delivery. It ends when one requested dish is made, when the player stops it, or when another game replaces this one. It changes no saved field and does not move or merge an item on its own.
- Browser: on a full board, guide a ready delivery, an ordinary merge, and a blocker merge. If no action can make room, give an accurate note. A blocked pair is not a legal merge, and no full-board guide suggests a source take.
- Browser: a section with all its dishes discovered shows the mark. A section with one covered dish does not.
  Reload keeps the mark, and the save does not change.
  Examine both themes at the desktop size and the phone size.
- Accessibility: an unknown entry has the name "Not yet".
  The known or unknown status and the mark do not use color alone.
  Focus stays stable after a discovery refresh.
