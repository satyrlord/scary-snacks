# 012 Post-campaign goals

Status: Proposed. Not implemented. Priority: Optional. Dependencies: [005](005-character-quests.md), [008](008-chapter-story-and-finale.md), [011](011-discovery-and-recipe-book.md).

## Current behavior and outcome

After preparation 24, the story shows that the supper is complete. Every quest opens before the last preparation, so no requests remain after the supper. The board and the recipe book stay available. This is an intentional valid ending. It is not a failed terminal state.

Provide a few voluntary goals after the finale, so that players who continue have a clear purpose. The finite campaign must stay visibly complete. This is an original design extension.

## Proposed scope and rules

1. Keep the board and the recipe book available immediately after preparation 24. The story presentation can still be pending under 009. Finishing or skipping the story never withholds the board.
2. Show a separate optional bistro-goals panel after the player acknowledges the finale. Do not replace the completed campaign status with a bar for an unfinished campaign.
3. The initial goals are:
   - Discover all permanent dishes.
   - Deliver each permanent dish at least once.
   - Finish one challenge for each of the four core characters after campaign completion.

   The regulars from 013 have no challenge in this first set.
4. A character challenge is a sequence of three authored post-campaign requests from that character. The requests use the quest tickets, the request dialog, and the delivery rules of 005. The player chooses one active challenge at a time. Its next request takes a ticket.
5. Starting or abandoning a challenge costs nothing. If the player resumes, the game keeps the delivered requests of that challenge. The player cannot restart a completed challenge for another one-time reward.
6. Count dish deliveries by distinct item identifier (ID). One delivery with two copies of a dish counts as one newly delivered dish. Campaign deliveries count. Selling, discovering, storing, or replaying dialogue does not count as a delivery.
7. The initial rewards are permanent marks in the book or the goal panel, and an original short thank-you scene. The game grants no coins, energy, upgrade, or mandatory unlock. All rewards are idempotent: a repeated claim grants nothing more.
8. Goals have no deadline, streak, login requirement, leaderboard, or reset. When the player completes all goals, the board stays available and the completed marks stay visible.

## State and ownership

The engine owns these records:

- The challenge statuses.
- The delivered requests of each challenge, in delivery order.
- The claimed goal IDs.

The engine derives the delivered dishes from the completed quests and the delivered challenge requests. Data owns the stable goal IDs, the challenge requests, and the scene references. The user interface (UI) displays progress and explains what counts.

Record deliveries only from successful deliveries under the common delivery contract. Do not let a story-only completion claim a dish delivery. 008 owns the chapter status and the finale status. Do not duplicate them in this panel.

## Save compatibility

Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
Persist the records of each post-campaign challenge and each claimed goal. Do not save a delivered-dish set that can disagree with the completed quests.
Existing discoveries count toward the collection goal. Make an earned mark available once without changing coins.
Specs 008 and 009 determine the finale acknowledgement and replay.

## Thin implementation slices

1. **Collection and dish delivery.** Add two optional goals. Exit: past discoveries and campaign deliveries count, and claims survive reload.
2. **Character challenges.** Add one active challenge and four permanent outcomes. Exit: when the player switches or resumes, the game never loses progress and never awards a reward twice.
3. **Finale integration.** Show the panel after the story acknowledgement, with a clear completed-campaign status. Exit: new and reloaded completed saves can continue without a reset or another story payment.

## Acceptance checks

- Engine: discovery and delivery are separate. Selling does not advance goals. Duplicated required items do not give duplicate credit for a unique dish.
- Engine: campaign deliveries give no challenge credit. Only the requests of the active challenge advance it.
- Engine: a repeated claim, replay, switch, or reload does not grant duplicate marks or scenes.
- Saves: discoveries, partial challenges, and claimed goals survive save and reload. A completed game opens the goals after the finale acknowledgement without another task reward.
- Browser: acknowledge the finale, select a goal, make progress, reload, and claim the goal once. The board stays available before and after all goals finish.

## Remaining design work

Three requests for each character is a draft default. Measure the effort to complete a challenge with a simulation of legal actions before release. Author the requests, the reward marks, and the thank-you text as new content. Do not require new bitmap assets, unless the chosen design needs them.
