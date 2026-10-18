# 009 - Dialogue continuation and reading state

Status: Implemented.

## Implemented scope

Each earned scene waits until the player finishes or skips it. The waiting scenes are preparation scenes, quest completion scenes, local news, arrival scenes, chapter closing scenes, and the finale.
A reload resumes each waiting scene at its saved line. After a reload, a preparation scene resumes its conversation without another payment.
The game keeps Back, Continue, "Skip scene", "Read now", the journal, and journal replay. Cooking never waits for a scene. Opening a scene again gives no reward.

## Scope and ownership

- `src/engine.ts` owns the validated transitions: the scene queue, the `readScene` and `sceneLine` actions, `sceneDialogue`, `storyScenes`, `storyProblems`, and save validation.
- `src/storage.ts` owns persistence. The save envelope does not change.
- `src/app.ts` owns the dialogs, focus, the reading controls, and the save messages.
- `tools/create-original-data.ts` authors the scene identifiers (IDs). The IDs do not change.
- The feature adds no network call, timer, energy limit, or runtime dependency.

## Rules

1. A preparation scene uses the ID of its preparation. A quest completion scene uses the ID of its quest.
   An arrival scene uses the ID `arrival-` and the ID of its regular.
   Each scene ID must be unique across preparations, quests, local news, arrivals, chapters, and the finale.
   `storyProblems` rejects a duplicate ID.
2. The `task` action queues the preparation scene in the same state change as the payment.
   The `deliverQuest` action queues the quest completion scene in the same state change as the delivery.
   A failed action queues nothing.
3. One payment queues its scenes in this order: the preparation scene, the chapter closing scene, and then the finale.
   Other scenes join the end of the list in event order.
4. The paid preparation scene opens at once. Its last line leads to the room change.
   "Skip scene" on a paid scene marks the scene as read and starts the room change.
   Close and Escape start the room change and leave the scene waiting.
   After the room change, the next scene that the payment earned opens, unless another dialog is open.
5. If the room change is already done, a resumed preparation scene ends with the usual end label.
   The scene does not offer "See what changed". This occurs after a reload.
6. Delivery shows a temporary notice and leaves the quest completion scene waiting.
   Read now opens the scene from Story. Recurring characters also have a Read completion entry in the journal.
   Finish and Skip mark the scene as read. Close and Escape leave the scene waiting.
7. The `sceneLine` action records the line that the player sees in a waiting scene.
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
11. If the save write fails, the scene shows the warning that the session is not saved. The warning occurs once for each scene.
    The player can continue to read. The game does not report the new line as saved.
12. The modal dialog keeps keyboard focus inside while open.
    Close and Escape close the dialog.
    Focus returns to the control that opened the scene.
    If that control no longer exists, focus returns to a stable story control.
    The line counter and the controls keep their accessible names.
13. The game shows speakers and text with `textContent`. Keyboard, pointer, and touch use the same transitions.
    Reduced motion changes only the presentation. Reduced motion does not change the scene order or the state.

## State and save compatibility

`GameState` has the optional field `sceneLines`. The field maps a waiting scene ID to a zero-based line index.
The state stores a line only if the line is after the first line.
A save without `sceneLines` starts each waiting scene at the first line. The [shared save compatibility](README.md#shared-save-compatibility) section gives the state version.
A save without a waiting entry for a scene treats that scene as read.

`validateGame` accepts these scene IDs in `pendingScenes`:

- the ID of a complete preparation;
- the ID of a complete quest;
- the ID of earned local news;
- the arrival scene of an arrived regular;
- the ID of a complete chapter;
- the finale ID after preparation 24.

Preparation scenes, chapter scenes, and the finale keep one story order.
In that order, each chapter scene follows the four preparations of its chapter.
Quest scenes, local news, and arrival scenes may occur at any position.
`validateGame` rejects these `sceneLines` records:

- a record that is not a plain object;
- a key that is not in `pendingScenes`;
- a value that is not a safe integer of 1 or more.

Reset clears `pendingScenes` and `sceneLines` with the rest of the state.
Import replaces them only after full validation and the usual confirmation.
Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.

## Acceptance

- `tests/story.test.ts` covers payment queue order, story order in validation, and unique scene IDs.
  It covers `sceneLine` at the first and last line, stale actions, and the line after `readScene`.
  It also covers malformed line records.
- `tests/quests.test.ts` covers the quest completion scene in the queue and failed deliveries that queue nothing.
- `tests/storage.test.ts` covers saves with and without `sceneLines`, malformed records, save and load, imports, and failed writes.
- `tests/campaign-balance.test.ts` expects each preparation scene and each delivered quest scene to wait at the end of a legal campaign.
- `tests/browser/story.spec.ts` covers Escape, Close, reload, and export and import in a preparation scene and a chapter scene. Each case resumes at the saved line.
  The tests also cover Skip on a paid scene and a resumed preparation scene after reload.
  They cover replay without changes to a waiting scene, a line past the end, and a failed line write.
- `tests/browser/quests.spec.ts` covers delivery notices and a waiting quest completion scene across reload.

Follow [Verification and release](README.md#verification-and-release) for the browser evidence.

## Dependencies

The feature has no prerequisite specification.
Specs 005 and 013 use this continuation behavior.
