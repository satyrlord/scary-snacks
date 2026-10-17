# 012 Post-campaign goals

Status: Proposed. Not implemented. Priority: Optional. Dependencies: [008](008-chapter-story-and-finale.md), [011](011-discovery-and-recipe-book.md).

## Current behavior and outcome

In `storyContent` ([`src/app.ts`](../../src/app.ts)), the game shows a supper-complete message after task 24. The message invites the player to serve more. [`src/engine.ts`](../../src/engine.ts) continues to replace served orders. This is an intentional valid ending. It is not a failed terminal state.

Provide a few voluntary goals after the finale, so that players who continue have a clear purpose. The finite campaign must stay visibly complete. This is an original design extension.

## Proposed scope and rules

1. Keep ordinary orders available immediately after task 24. The story presentation can still be pending under 009. Finishing or skipping the story never withholds the board.
2. Show a separate optional bistro-goals panel after the player acknowledges the finale. Do not replace the completed campaign status with a bar for an unfinished campaign.
3. The initial goals are:
   - Discover all permanent dishes.
   - Serve each permanent dish at least once.
   - Finish one additional service challenge for each of the four core characters after campaign completion.

   The regulars from 013 have no challenge in this first set.
4. A character challenge requires the player to serve three ordinary orders for that character after the challenge starts. The player chooses one active character challenge at a time. Existing orders of other characters stay valid. When the game replaces served orders, each character stays reachable.
5. Starting or abandoning a challenge costs nothing. If the player resumes, the game keeps the earned challenge progress of that character. The player cannot restart a completed challenge for another one-time reward.
6. Track dish service by distinct item identifier (ID). One order with two copies of a dish counts as one newly served dish. Selling, discovering, storing, or replaying dialogue does not count as service.
7. The initial rewards are permanent marks in the book or the goal panel, and an original short thank-you scene. The game grants no currency, experience points (XP), energy, upgrade, or mandatory unlock. All rewards are idempotent: a repeated claim grants nothing more.
8. Goals have no deadline, streak, login requirement, leaderboard, or reset. When the player completes all goals, ordinary orders stay available and the completed marks stay visible.

## State and ownership

The engine owns these records:

- A set of served permanent dish IDs.
- The challenge statuses.
- The service count of each character, limited to the required total.
- The claimed goal IDs.

Data owns the stable goal IDs, the requirements, and the scene references. The user interface (UI) displays progress and explains what counts.

Record service events from successful order fulfilment only. A future special quest counts toward dish service only if the quest consumes the dish through the common delivery contract. Do not let a story-only completion claim food service. 008 owns the chapter status and the finale status. Do not duplicate them in this panel.

## Save compatibility

Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
Persist the records for each dish and post-campaign challenge. Do not infer individual dishes or customers from the `served` total.
Existing discoveries count toward the collection goal. Make an earned mark available once without changing currency.
Specs 008 and 009 determine the finale acknowledgement and replay.

## Thin implementation slices

1. **Collection and dish service.** Add counters and two optional goals. Exit: past discoveries count, new service records distinct dishes, and claims survive reload.
2. **Character challenges.** Add one active challenge and four permanent outcomes. Exit: when the player switches or resumes, the game never loses progress and never awards a reward twice. All ordinary orders stay playable.
3. **Finale integration.** Show the panel after the story acknowledgement, with a clear completed-campaign status. Exit: new and reloaded completed saves can continue without a reset or another story payment.

## Acceptance checks

- Engine: discovery and service are separate. Selling does not advance goals. Duplicated required items do not give duplicate credit for a unique dish.
- Engine: orders served before a character challenge starts give no challenge credit. An order created earlier counts if the player serves it while that character's challenge is active.
- Engine: a repeated claim, replay, switch, or reload does not grant duplicate marks or scenes. Every arrived neighbour stays serviceable under the rules of 005 and 013, including the rest rule of 013.
- Saves: totals, discoveries, partial challenges, and claimed goals survive save and reload. A completed game opens the goals after the finale acknowledgement without another task reward.
- Browser: acknowledge the finale, select a goal, make progress, reload, and claim the goal once. Ordinary orders stay available before and after all goals finish.

## Remaining design work

Three orders for each character is a draft default for balance. The 16-neighbour roster in 013 makes one core character appear far less often. Measure how many orders a challenge takes. Before release, measure the effort to complete a challenge. Use a simulation of legal actions. Author the reward marks and the thank-you text as new content. Do not require new bitmap assets, unless the chosen design needs them.
