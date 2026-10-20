# 007: Chapter objectives, story payoffs, and finale

Status: Implemented.

## Result

`tools/create-original-data.ts` authors six chapters and one finale.
Each chapter has a stable identifier (ID), a title, an objective, and opening context.
Each chapter also has a payoff, one neighbour contribution, and a closing scene.
Each of the 24 preparations has a stable ID, three dialogue lines, and a chapter number.
The chapter number of a preparation is the only link between a chapter and its preparations.
Each preparation has one room state from 001. The journal names that change beside the preparation.
The player can see the current chapter goal and the state of its four preparations.
The journal shows the result of each complete chapter.
The finale names the result of each chapter. All four core characters speak: Mara, Ilie, Eszter, and Sorin.
The finale ends with a return to the kitchen. No quests remain after the supper.
The board and the recipe book stay available.

## Scope and ownership

- The story has one path. It has no alternative endings and no other campaign.
- `tools/create-original-data.ts` authors the content.
  `src/model.ts` owns `resolveChapters` and `storyScenes`. `src/content.ts` owns `storyProblems`. `src/engine.ts` owns the `readScene` action and save validation.
- `src/story.ts` owns the story card, the scene dialogs, and the journal. `src/storage.ts` owns the envelope version.

## Chapter outline

The Objective column quotes the game. The Payoff column summarizes the payoff text of the game.

| Chapter | Preparations | Objective | Payoff | Contribution |
| --- | --- | --- | --- | --- |
| 1. Open the shutters | 1-4 | Make the neglected front room ready to greet neighbours. | The room is clean, lit, and free of webs. Ilie has a place for his bread. | ilie-counter |
| 2. A kitchen for everyone | 5-8 | Arrange a shared kitchen where anyone can help. | The team can cook together. The first menu explains each dish. | sorin-lunch |
| 3. Around one table | 9-12 | Make shared seating that is useful and welcoming. | Eszter's tableware sets every place. The recipe corner keeps room for memories. | eszter-table |
| 4. The courtyard | 13-16 | Open an outdoor space where everyone can gather and move easily. | Sorin's practical help clears the way. The courtyard is ready for outdoor service. | sorin-path |
| 5. Recipes to share | 17-20 | Test the dishes of the neighbourhood and write them down. | The supper menu shows each dish. Neighbours can find their own recipes on it. | ilie-family |
| 6. The first community supper | 21-24 | Bring every preparation together and welcome the guests. | Mara and the team have prepared the bistro for the community supper. | mara-supper |

Miez, the bats, and the early spiders are quiet details of the setting.
They are not obstacles. They are not supernatural villains.
The spiders and their webs leave with preparation 1, as 001 describes.
The closing scene of chapter 1 names the one friendly spider that stays under the upper wall shelf.

## Rules

1. A chapter opens at its first preparation. Story shows its objective and the state of its preparations.
   Later scenes stay hidden. The chapter needs no separate payment.
2. The payment for the last preparation of a chapter also queues the closing scene of that chapter.
   The game derives chapter completion from the completed preparations.
   The next preparation never waits for the scene.
3. The game keeps no second count of completed preparations.
4. Each contribution is a quest of a core character.
   It opens after the previous chapter closes. It opens before the last preparation of its chapter.
   The six contributions cover all four core characters.
   Like every quest, a contribution is necessary for the preparation that follows its opening.
   `questProblems` checks the combined graph of preparations and quests for cycles and unknown prerequisites.
5. After preparation 24, Mara's supper quest opens. It asks for one plate for each of the 11 guests and pays nothing.
   Spec 012 gives the plates.
   Serve takes the plates once, records the quest, and queues the finale. The finale opens immediately.
   The game records the finale once.
   The game does not charge a preparation again and does not give a reward again.
6. The finale names the outcome of each chapter, and all four core characters speak.
   Its last control, "See the supper", opens the supper painting with the ending line of the finale.
   The painting ends with "Back to the kitchen" if no other scene waits. No quests remain.
7. The journal replays the closing scene of each complete chapter and, after the supper, the finale with the supper painting.
   Replay and closing a dialog have no economic effect.
8. A failed payment, missing coins, a missing required quest, and a full board for a new source change nothing.
   They complete no chapter, queue no scene, and open no finale.
   Serve without every plate on the board also changes nothing.
9. `storyProblems` rejects missing or blank scenes, unknown speakers, and duplicate or unstable IDs.
   It rejects unknown contributions and contributions that open outside their chapter.
   It rejects empty chapters.
   It rejects preparations with an unknown chapter or a chapter that is out of order.
   The generator and the game refuse such data.
   If a saved scene ID has no scene, the game shows a recoverable error and keeps the progress.
   The game does not invent story text.

## Scene order and reading

A waiting scene is an earned scene that the player has not finished.
The state holds `pendingScenes`: the IDs of the waiting scenes.
Preparation scenes, closing scenes, and the finale keep story order in this list.
The paid preparation scene opens before the room reveal.
After the reveal, the next scene that the payment earned opens, unless another dialog is open.
The completion action sends `readScene`, which removes only that scene. Then the next waiting scene opens.
A repeated, stale, or unknown `readScene` changes nothing.
Close and Escape leave the scene waiting.
Story shows the first waiting scene with Read now.
After a reload, Mara's line says that a scene is waiting.
Spec 008 owns the transcript presentation and the reading rules.

## State and save compatibility

Validation accepts the closing scene of each complete chapter.
After the player serves the supper, validation also accepts the finale.
The completed quest ID of the supper quest records the served supper.
Each ID occurs once, and story scenes keep story order.
Validation rejects unknown IDs and scenes that the saved progress did not earn.
The same list holds the preparation scenes and the quest scenes of spec 008.
Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.

## Acceptance and evidence

- `tests/story.test.ts` covers the outline, the content checks, every chapter boundary, and failed payments.
  It also covers the served supper, the single finale, the scene actions, the board after the finale, and the validation of saved scenes.
- `tests/storage.test.ts` covers failed writes, malformed saves, and save and load of valid scene lists.
- `tests/campaign-balance.test.ts` shows that a legal fresh campaign leaves each chapter scene waiting, in story order.
  The campaign serves the supper with no injected coins or items.
- `tests/browser/story.spec.ts` covers the objective, the preparation steps, the chapter changes, and Escape and reload with a waiting scene.
  It covers the served supper, the finale with reading and replay, the supper painting, and the board after the finale.
  It checks the layout at 1440×900, 390×844, and 390×800 in both themes.

The playthrough in `tests/browser/story.spec.ts` starts from a fresh save in the built game.
Before each payment, the test writes a save with the quests that the payment needs and the exact coins.
`tests/campaign-balance.test.ts` covers legal play from a new game through the served supper.
The test makes every payment through the interface.
It reads every preparation scene, runs every reveal, and reads every chapter scene. It serves the supper and reads the finale.
The test also checks the journal.
The playthrough checks that the story agrees with the campaign.
The journal shows each contribution beside the payoff.
The finale names each chapter result.
The board stays available after the finale.
