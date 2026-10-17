# 008 - Chapter objectives, story payoffs, and finale

Status: Implemented. Automated engine, save, and browser checks cover the rules. A scripted browser playthrough from a fresh save through the finale shows that the goals, the contributions, and the payoffs agree. The manual playthrough by a person remains open.

## Result

`tools/create-original-data.ts` authors six chapters and one finale. Each chapter has a stable ID, its title, an objective, an opening context, a payoff, one neighbour contribution, and a closing scene.
The 24 preparations keep their IDs, their three dialogue lines, and their chapter numbers. The chapter number of a preparation is the only link between a chapter and its preparations.
Each preparation has one room state from 001. The journal names that change beside the preparation.
The player can see the goal of the current chapter, the state of its four preparations, and the result of each complete chapter.
The finale names the result of each chapter. All four core characters speak. It ends with a return to the kitchen, where ordinary orders continue.

## Scope and ownership

- The six chapter titles, their four preparations each, and the original cast stay.
- The story is linear. There are no branching endings and no other campaign.
- Unlimited energy, local play, and the absence of timers and accounts stay.
- `tools/create-original-data.ts` authors the content. `src/engine.ts` owns `resolveChapters`, `storyScenes`, `storyProblems`, the `readScene` action, and save validation.
- `src/app.ts` owns the story card, the scene dialogs, and the journal. `src/storage.ts` owns the envelope version.
- PRODUCT owns the behavior. DESIGN owns the interface.

## Chapter outline

| Chapter and preparations | Objective | Payoff | Contribution |
| --- | --- | --- | --- |
| 1. Open the shutters; 1-4 | Make the neglected front room ready to greet neighbours | A clean, lit room, free of webs, with a place for Ilie's bread | ilie-counter |
| 2. A kitchen for everyone; 5-8 | Arrange a shared kitchen where anyone can help | The team can cook together, and the first menu explains each dish | sorin-lunch |
| 3. Around one table; 9-12 | Make shared seating that is useful and welcoming | Eszter's tableware sets every place, and the recipe corner keeps room for memories | eszter-table |
| 4. The courtyard; 13-16 | Open an outdoor space where everyone can gather and move easily | Sorin's practical help clears the way for outdoor service | sorin-path |
| 5. Recipes to share; 17-20 | Test the dishes of the neighbourhood and write them down | Neighbours can find their own recipes on the menu | ilie-family |
| 6. The first community supper; 21-24 | Bring every preparation together and welcome the guests | Mara and the team share the completed supper | mara-supper |

Miez, the bats, and the early spiders stay quiet setting details. They are not obstacles and not supernatural villains.
The spiders and their webs leave with preparation 1, as 001 describes. The closing scene of chapter 1 names the one friendly spider that stays under the upper wall shelf.

## Rules

1. A chapter opens at its first preparation. Story shows its objective and the state of its preparations. Later scenes stay hidden. The chapter needs no separate payment.
2. The payment for the last preparation of a chapter queues the closing scene of that chapter in the same state change. Chapter completion is derived from the completed preparations. The next preparation never waits for the scene.
3. Each preparation keeps its one room state from 001, with the same stable IDs. The game keeps no second count of completed preparations.
4. Each contribution is a regular quest. It opens after the previous chapter closes and before the last preparation of its chapter. The contributions together cover all four core characters. The contributions stay optional, and no preparation needs them. `questProblems` validates the combined graph of preparations and quests for cycles and reachability.
5. After preparation 24, the finale waits after the closing scene of chapter 6. The game records it once. A preparation is not charged again, and its reward is not given again.
6. The finale names the outcome of each chapter, and all four core characters speak. It ends with "Back to the kitchen" and its ending line. Ordinary orders continue.
7. The journal replays each complete chapter scene and, after the supper, the finale. Replay, Skip, Back, and closing a dialog have no economic effect.
8. A failed payment, missing goals, a missing required quest, and a full board and pantry for a new source change nothing. They complete no chapter, queue no scene, and open no finale.
9. `storyProblems` rejects missing or blank scenes, unknown speakers, duplicate or unstable IDs, unknown or optional-producer contributions, contributions that open outside their chapter, empty chapters, and preparations with an unknown or out-of-order chapter. The generator and the game refuse such data. If a saved scene ID has no scene, the game shows a recoverable error and keeps the progress. It does not invent story text.

## Scene order and reading

The state holds `pendingScenes`: the earned scenes that the player did not finish or skip, in story order.
After the reveal of a payment, the first scene that the payment queued opens, unless another dialog is open.
Finish and Skip send `readScene`, which removes only that scene. Then the next waiting scene opens.
A repeated, stale, or unknown `readScene` changes nothing.
Close and Escape leave the scene waiting. Story shows the first waiting scene with Read now. After a reload, Mara's line says that a scene is waiting.
A scene restarts at its first line. Spec 009 owns the saved line position and the reading state of preparation and quest scenes.

## State and save compatibility

Game state 8 in envelope 7 at `scary-snacks-save-v7` adds `pendingScenes`.
Validation accepts only the closing scenes of complete chapters and, after preparation 24, the finale. Each ID occurs once, in story order. Unknown IDs and scenes that the preparations did not earn fail validation.
State 7 in envelope 6 converts by the addition of an empty list. Earlier chapters stay complete, and the journal replays their scenes. A finished game gets the finale in the journal.
Conversion queues no old scene, gives no reward, and claims no reading. A repeated conversion gives the same result. The older bytes stay unchanged.
Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.

## Acceptance and evidence

- `tests/story.test.ts` covers the outline, the content checks, every chapter boundary, failed payments, the finale once, reading events, continued orders, and the validation of saved scene queues.
- `tests/storage.test.ts` covers the conversion of state-7 saves at every chapter boundary, a failed conversion write, malformed state-7 saves, and the round trip of each valid scene queue.
- `tests/campaign-balance.test.ts` shows that a legal fresh campaign ends with each chapter scene and one finale waiting. A campaign that converts at preparation 12 queues only the chapters that close after the conversion.
- `tests/browser/story.spec.ts` covers the objective and step display, the chapter change, Escape and reload with a waiting scene, the finale with Skip and replay, continued service after the finale, a finished older save, and the layout at 1440×900, 390×844, and 390×800 in both themes.

The playthrough in `tests/browser/story.spec.ts` starts from a fresh save in the built game. Between payments, the engine makes legal moves: it claims each level reward, delivers each open request, and serves or merges. The interface makes every payment, tells every preparation story, runs every reveal, plays every closing scene and the finale, and checks the journal.
The playthrough shows that the story agrees. Each closing scene names the room changes of its four preparations. Each contribution is delivered during its chapter, and the journal shows it beside the payoff. The finale names each chapter result. Ordinary service continues after the finale.
The engine makes the moves between payments, so the playthrough does not measure human pacing. Spec 006 owns human pacing.
The manual check remains open: a person plays from a fresh save through the finale. The person judges whether the goals, the contributions, and the payoffs agree, and whether the scene after each reveal feels natural.
Spec 012 owns goals after the story. Spec 013 can add the names of the regulars who have arrived to the finale. Scene art is a content decision.
