# 009 - Dialogue continuation and reading state

Status: Partly implemented through spec 008. The remaining work is proposed.

## Current behavior

`GameState` in `src/engine.ts` has `pendingScenes`. The list holds the earned scenes that the player did not finish or skip.
The list holds chapter closing scenes, the finale, and local news. Local news is the follow-up scene of a quest.
`validateGame` accepts only unique, earned IDs. Chapter scenes and the finale keep story order.
The `readScene` action removes one waiting scene. A stale, repeated, or unknown `readScene` changes nothing.

`showScene` in `src/app.ts` plays a waiting scene with a "Skip scene" button. Finish and Skip send `readScene`, and then the next waiting scene opens.
Close and Escape leave the scene waiting. The story card shows the first waiting scene with "Read now".
The journal marks a waiting scene "New scene" and a read scene "Replay". If the player finishes a waiting scene from the journal, the scene is read.
After a reload, the status line tells the player that a scene is waiting.
If a saved scene ID has no scene, the game shows a recoverable error and keeps the progress.

## Gap and intended result

`showStory` keeps the line position in a local `cursor` that starts at zero. The save does not keep the position.
If the player reloads during a scene, the scene starts again at the first line.
Preparation scenes and quest completion scenes do not enter `pendingScenes`.
If the player reloads during one of these scenes, the scene does not wait in Story. Only the journal replay keeps it.

After this work, each earned scene waits until the player finishes or skips it. A reload resumes the scene at its saved line.
The delivery order in the [specs index](README.md#suggested-delivery-order) gives the exit check. After a reload, a preparation scene resumes its conversation without another payment.

## Scope and ownership

- Add preparation scenes and quest completion scenes to `pendingScenes`.
- Save the line position of each waiting scene.
- Keep Back, Continue, "Skip scene", "Read now", the journal, and journal replay.
- Do not block cooking until the player reads. Do not give a reward again when the player opens a scene again.
- Use `src/engine.ts` for validated transitions. Use `src/storage.ts` for persistence.
- Use `src/app.ts` for dialogs, focus, reading controls, and save messages.
- Keep the scene IDs that `tools/create-original-data.ts` authors.
- Do not add a network call, timers, energy limits, or a runtime dependency.
- After implementation, update the owner documents.

## Rules

1. A preparation scene uses the ID of its preparation. A quest completion scene uses the ID of its quest.
   Each scene ID must be unique across preparations, quests, local news, chapters, and the finale.
   `storyProblems` must reject a duplicate ID.
2. The `task` action queues the preparation scene in the same state change as the payment.
   The `deliverQuest` action queues the quest completion scene in the same state change as the delivery.
   A failed action queues nothing.
3. One payment queues its scenes in this order: the preparation scene, the chapter closing scene, and then the finale.
   Other scenes join the end of the list in event order.
4. The paid preparation scene opens at once. Its last line leads to the room change.
   "Skip scene" on a paid scene marks the scene as read and starts the room change.
   Close and Escape start the room change and leave the scene waiting.
   After the room change, the next waiting scene opens, unless another dialog is open.
5. If the room change is already done, a resumed preparation scene ends with the usual end label.
   The scene does not offer "See what changed". This occurs after a reload.
6. A quest completion scene opens at once after delivery. Finish and Skip mark the scene as read. Close and Escape leave the scene waiting.
7. A new `sceneLine` action records the line that the player sees in a waiting scene.
   Continue and Back send `sceneLine`. Each change writes the save.
   The action must name a waiting scene and a line in the range of that scene. Otherwise, the action changes nothing.
8. The state keeps one line for each waiting scene. `readScene` removes the line with the scene.
   If the player opens a different waiting scene, the line of the first scene stays.
9. "Read now" and a "New scene" journal entry resume at the saved line.
   A replay of a read scene starts at the first line. A replay keeps its position only in the dialog.
   A replay does not change coins, items, quests, preparations, or the line of a waiting scene.
10. If a saved line is past the last line of its scene, the scene starts again at the first line.
    The scene shows the notice "Someone lost the thread. The conversation starts again from the beginning."
    This can occur after a release removes a line.
    The save stays valid, because a line position gives no reward.
11. If the save write fails, show the usual warning that the session is not saved. Show the warning once for each scene.
    The player can continue to read. Do not report the new line as saved.
12. Do not trap focus. Return focus to the control that opened the scene.
    If that control no longer exists, return focus to a stable story control.
    The line counter and the controls keep their accessible names.
13. Show speakers and text with `textContent`. Keyboard, pointer, and touch use the same transitions.
    Reduced motion changes only the presentation. Reduced motion does not change the scene order or the state.

## State and save compatibility

Add the optional field `sceneLines` to `GameState`. The field maps a waiting scene ID to a zero-based line index.
Store a line only if the line is after the first line.
A save without `sceneLines` starts each waiting scene at the first line. Current saves stay at state version 9.
A save without a waiting entry for a scene treats that scene as read.

`validateGame` accepts these scene IDs in `pendingScenes`:

- the ID of a complete preparation;
- the ID of a complete quest;
- the ID of earned local news;
- the ID of a complete chapter;
- the finale ID after preparation 24.

Preparation scenes, chapter scenes, and the finale keep one story order.
In that order, each chapter scene follows the four preparations of its chapter.
Quest scenes and local news may occur at any position.
`validateGame` rejects these `sceneLines` records:

- a record that is not a plain object;
- a key that is not in `pendingScenes`;
- a value that is not a safe integer of 1 or more.

Reset clears `pendingScenes` and `sceneLines` with the rest of the state.
Import replaces them only after full validation and the usual confirmation.
Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.

## Slices and exit checks

1. Add the preparation scenes and the quest completion scenes to the queue, and add the ID check.
   Exit: the engine tests pass for the queue order, failed actions, validation, and the ID check.
2. Add `sceneLine`, `sceneLines`, and their validation.
   Exit: each line of a waiting scene resumes after a save round trip. A failed write keeps the previous save.
3. Connect "Read now", the journal, the paid scene, and the quest delivery in `src/app.ts`.
   Exit: a scene resumes at the same line after Close, Escape, reload, and export and import.

## Acceptance

- `tests/story.test.ts` covers the queue order of one payment, the story order in validation, `sceneLine` at the first and last line, stale actions, and the line after `readScene`.
- `tests/quests.test.ts` covers the quest completion scene in the queue and a failed delivery that queues nothing.
- `tests/storage.test.ts` covers saves with and without `sceneLines`, malformed records, round trips, imports, and failed writes.
- `tests/campaign-balance.test.ts` expects each preparation scene and each delivered quest scene to wait at the end of a legal campaign.
- `tests/browser/story.spec.ts` covers Close, Escape, reload, and export and import in a preparation scene and a chapter scene. Each case resumes at the saved line.
  The tests also cover Skip on a paid scene, a resumed preparation scene after reload, and a replay that keeps the line of a waiting scene.
- `tests/browser/quests.spec.ts` covers a reload during a quest completion scene.

Follow [Verification and release](README.md#verification-and-release) for the browser evidence.

## Dependencies

There is no hard dependency. Specs 005, 010, 012, 013, and 014 use this continuation behavior.
Spec 015 can add a "Resume the story" entry to the front door if a scene is waiting.
