# 008 - Chapter objectives, story payoffs, and finale

Status: Proposed. Not implemented. All rules below are draft defaults.

## Evidence and intended result

The story is already implemented. `tools/create-original-data.ts` supplies six named chapters,
24 preparations, and three dialogue lines for every preparation, including the final supper.
`src/app.ts` shows those conversations and a journal. In its end state, `src/app.ts` says that the table is ready.
The gap has four parts. The first part is explicit chapter objectives. The second part is lasting links to character quests and renovation. The third part is chapter summaries. The fourth part is a distinct finale that the player can replay. The finale ends with a clear return to play.
The player should understand why each preparation matters and what the chapter changed.

## Scope and ownership

- Keep all six chapter titles, their four preparations each, and the original cast.
- Add the opening context of a chapter, an objective summary, a closing payoff, and a finale scene.
- Connect scenes to the visible results in 001 and to the character quests in 005.
- Keep the story linear. Do not add branching endings or another campaign.
- Keep unlimited energy, local play, and the absence of timers and accounts.
- Author content in `tools/create-original-data.ts`. Keep eligibility rules in `src/engine.ts`.
- Put the viewing code in `src/app.ts` and persistence in `src/storage.ts`.
- After the team implements this proposed behavior, update PRODUCT, DESIGN, and README.

## Original chapter outline

| Chapter and preparations | Objective | Payoff |
| --- | --- | --- |
| 1. Open the shutters; 1-4 | Make the neglected front room ready to greet neighbours | A clean, lit, welcoming room, free of webs, and Ilie's first contribution |
| 2. A kitchen for everyone; 5-8 | Arrange a workable shared kitchen | The team can prepare and explain its first menu |
| 3. Around one table; 9-12 | Make shared seating useful and welcoming | Eszter's tableware and a space for recipe memories |
| 4. The courtyard; 13-16 | Open an accessible outdoor gathering space | Sorin's practical help makes outdoor service possible |
| 5. Recipes to share; 17-20 | Test and record the community's dishes | Neighbours can recognise their contributions on the menu |
| 6. The first community supper; 21-24 | Bring the preparations together for guests | Mara and the team share the completed supper |

This outline is original. It is for existing Scary Snacks content.
Keep Miez, the bats, and the early spiders as quiet setting details. They are not obstacles and not supernatural villains.
The spiders and their webs show the poor state of the bistro at the start. They leave with preparation 1, as 001 describes. One friendly spider is the exception. It stays under the upper wall shelf through the finale, as 001 describes.
Full dialogue, art staging, and the exact links from quests to preparations remain authored content work.

## Proposed rules and failure behavior

1. A chapter opens at its first eligible preparation. Show its objective and the four
   preparation states. Do not show later scenes. Do not require a separate unlock payment.
2. When the fourth preparation of a chapter completes, record the chapter completion and queue its closing
   scene. Do not make reading the closing scene a prerequisite for the next preparation.
3. Tie each preparation to a concrete result that 001 describes. Use the same stable identifiers (IDs).
   Never keep a second editable count of completed preparations for narrative purposes.
4. Any required quest must be reachable before its preparation. Validate the combined graph.
   Optional quests may add journal context. They must not block the finale.
5. After preparation 24 succeeds, record the campaign completion one time. Queue the finale
   after any pending preparation scene and chapter scene. Do not charge the preparation again. Do not give its reward again.
6. The finale acknowledges the six chapter outcomes and all four core characters. It may also
   name the regulars from 013 who have arrived. It ends with
   a clear return to the kitchen and continued ordinary orders, as the current game permits.
7. Offer finale replay in the journal. Replay, Skip, Back, and closing a dialog have no
   economic effect. Apply the interruption rules and ordering rules in 009.
8. Three cases must not complete a chapter, queue its payoff, or open the finale. The cases are a failed preparation payment, missing ingredients, and a full required reward destination.
9. Before release, reject content with missing scenes, invalid speakers, duplicate IDs, or cyclic gates.
   If a required scene cannot be displayed, show a recoverable content error.
   Keep the completed gameplay progress. Do not invent replacement story text.

## State and save compatibility

Derive chapter completion from the existing prefix of completed preparations. Persist only the scene
continuation and any information that cannot be derived. Spec 009 owns the reading state.
Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
Validate the old input and the migrated result. Keep the old bytes and all completed preparations.
For older saves, keep past chapters complete and show their summaries for replay. Do not
queue the old scenes automatically. A game that is already finished gets a journal entry for the finale.
Migration and reload must never give chapter rewards or repeat preparation rewards. A repeated migration gives the same result.
Unknown scene IDs and impossible combinations of chapter and scene must fail validation safely.

## Thin implementation slices and exit checks

1. Author the chapter outline and the scene metadata. Exit: the six objectives and payoffs cover all 24 current preparation IDs. No character is missing, and no content reference is unresolved.
2. Add chapter summaries and completion rules. Exit: boundary tests cover preparations
   4, 8, 12, 16, 20, and 24, including failure and migrated saves.
3. Integrate renovation and quests. Exit: each chapter has a visible result and a reachable
   character contribution. The complete dependency graph passes the cycle checks and reachability checks.
4. Add the finale and the journal entry. Exit: the final legal action produces exactly one
   finale opportunity, reload resumes it, and later orders stay playable.

## Acceptance and dependencies

Engine tests must cover chapter boundaries, failed actions, finale eligibility, and reward-once behavior.
Save tests must cover every chapter boundary, completed legacy saves, interruptions, and repeated migration.
Built browser tests must cover objective display, chapter change, finale skip and replay, and continued orders.
Follow [Verification and release](README.md#verification-and-release) for the browser evidence.
Play manually from a fresh save through the finale. Check if goals, contributions, and payoffs agree.
The outline slice is independent. Full integration depends on 001, 005, and 009.
Spec 012 owns additional goals after the story. The final text length and the scene art are still content decisions.
