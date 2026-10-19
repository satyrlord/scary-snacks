# 008: Scene transcripts and reading state

Status: Implemented.

## Outcome and scope

Each earned scene waits until the player completes it.
A waiting scene is one of these: a preparation scene, a quest completion scene, local news, an arrival scene, a chapter closing scene, or the finale.
Each scene shows its full transcript.
After a reload, a preparation scene still waits, without another payment.
Play never waits for a scene. Opening a scene again gives no reward.

## Ownership

- `src/engine.ts` owns the validated transitions: the `readScene` action and save validation. `src/model.ts` owns the scene list and `storyScenes`. `src/content.ts` owns `storyProblems`.
- `src/storage.ts` owns persistence.
- `src/story.ts` owns the dialogs, the focus, and the completion action. `src/session.ts` owns the save messages.
- `tools/create-original-data.ts` authors the scene identifiers (IDs).

## Rules

1. A preparation scene uses the ID of its preparation. A quest completion scene uses the ID of its quest.
   An arrival scene uses the ID `arrival-` followed by the ID of its regular.
   Each scene ID must be unique across preparations, quests, local news, arrivals, chapters, and the finale.
   `storyProblems` rejects a duplicate ID.
2. The `task` action queues the preparation scene in the same state change as the payment.
   A campaign `deliverQuest` action queues its completion scene in the same state change as the delivery.
   The supper payment queues the finale. The recurring quest queues no scene.
   A failed action queues nothing.
3. One payment queues its scenes in this order: the preparation scene, then the chapter closing scene. The payment of the supper quest queues the finale.
   Other scenes join the end of the list in event order.
4. The paid preparation transcript opens at once. Its "See what changed" action marks it as read and starts the room change.
   Close and Escape start the room change and leave the scene waiting.
   After the room change, the next scene that the payment earned opens, unless another dialog is open.
5. If the room change is already done, a resumed preparation scene ends with the usual end label.
   The scene does not offer "See what changed". This case occurs after a reload.
6. A campaign delivery shows a temporary notice and leaves the quest completion scene waiting.
   The supper payment opens the finale immediately. A recurring delivery shows its reward notice and queues no scene.
   Read now opens the scene from Story. The journal lists waiting replies under Unread scenes.
   The journal combines a recurring character’s completed quest opening and reply in one conversation.
   After reading, that same entry moves to Earlier conversations. Story and delivery notices open only the reply.
   The completion action marks the scene as read. Close and Escape leave the scene waiting.
7. A transcript shows every turn in order, with its speaker name, portrait, and exact text.
   A combined quest journal page has Request then Reply, one illustration, and one Return action.
   Its completion changes only the pending reply through `readScene`. A read replay changes no state.
   It has one completion action, with the same destination label as the scene.
   Focus starts on the title and scroll starts at the top. Close and Escape leave it unread. Reopening starts at the top.
   Opening and scrolling change no game state.
8. "Read now" and a "New scene" journal entry open the waiting scene at the top.
   A replay does not change coins, items, quests, preparations, or a waiting scene.
9. A waiting scene shows the warning that the session is not saved whenever it opens while the session is not saved.
   The player can continue to read.
10. The modal dialog keeps keyboard focus inside while it is open.
    Close and Escape close the dialog.
    Focus returns to the control that opened the scene.
    If that control is gone, focus returns to the Journal link on wider screens.
    On phones, focus returns to the Story button.
    Transcripts use static speaker headings and paragraphs; they do not announce the full transcript as a live update.
11. The game shows speakers and text with `textContent`. Keyboard, pointer, and touch use the same transitions.
    Reduced motion changes only the presentation. Reduced motion does not change the scene order or the state.

## State and save compatibility

The [shared save compatibility](README.md#shared-save-compatibility) section gives the state version.
A save without a waiting entry for a scene treats that scene as read.

`validateGame` accepts these scene IDs in `pendingScenes`:

- the ID of a complete preparation;
- the ID of a complete quest that has a completion scene;
- the ID of earned local news;
- the arrival scene of an arrived regular;
- the ID of a complete chapter;
- the finale ID after the payment of the supper quest.

Preparation scenes, chapter scenes, and the finale keep one story order.
In that order, each chapter scene follows the four preparations of its chapter.
Quest scenes, local news, and arrival scenes can occur at any position.

Reset clears `pendingScenes` with the rest of the state.
Import replaces it only after full validation and the usual confirmation.
Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.

## Acceptance and evidence

- `tests/story.test.ts` covers the payment queue order, the story order in validation, unique scene IDs, and `readScene`.
- `tests/quests.test.ts` covers the quest completion scene in the queue and failed deliveries that queue nothing.
- `tests/storage.test.ts` covers waiting scenes in save and load, imports, and failed writes.
- `tests/campaign-balance.test.ts` expects each preparation scene and each delivered quest scene to wait at the end of a legal campaign.
- `tests/browser/story.spec.ts` covers Escape, Close, and reload in a preparation scene, and export and import in a chapter scene.
  Scenes, including the finale, reopen with the full transcript, without another payment.
  The tests cover one-action paid transcripts, replay without changes to a waiting scene, and the save warning.
- `tests/browser/quests.spec.ts` covers delivery notices and a waiting quest completion scene across reload.

Follow [Verification and release](README.md#verification-and-release) for the browser evidence.
