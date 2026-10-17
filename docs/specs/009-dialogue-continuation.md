# 009 - Dialogue continuation and reading state

Status: Proposed. Not implemented. All rules below are draft defaults.

## Evidence and intended result

`src/app.ts` implements `showStory` with a local `cursor` that starts at zero.
The journal lists the completed preparations and can replay their scenes. The cursor is not in `GameState` in `src/engine.ts` and not in exported saves.
Spec 008 stores `pendingScenes`: the chapter closing scenes and the finale that the player did not finish or skip. Preparation and quest scenes have no unread state.
If the player closes the tab during a conversation, the game loses the reading position. It does not lose the completed task.
Keep the existing journal. Add a reliable route back to interrupted scenes that the player newly earned.

## Scope and ownership

- Add persistent scene eligibility, pending reading, and a position within the active scene.
- Keep Back, Continue, Back to the kitchen, and journal replay.
- Add an explicit Skip scene action and a visible Resume story entry.
- Do not block cooking until the player reads. Do not replay rewards when the player reopens a scene.
- Use `src/engine.ts` for validated transitions and `src/storage.ts` for persistence.
- Use `src/app.ts` for dialogs, focus, reading controls, and save-status messages.
- Author stable scene identifiers (IDs) with `tools/create-original-data.ts`. During implementation, update the owner documents.
- Do not add a network, timers, energy limits, or a runtime dependency.

## Proposed rules

1. Task completion and the eligibility of its scene belong to one game-state transition.
   A failed task queues nothing. A successful task cannot give its reward a second time.
2. Use a stable scene ID and a zero-based line index. Save the line that the game currently shows.
   Then a reload or Resume returns to the same text and does not silently skip ahead.
3. Opening a new scene is separate from acknowledging its last line. Only Finish or Skip
   marks the scene as read. Escape or Close suspends the scene and leaves a Resume entry in the journal.
4. Advance, Back, Finish, and Skip must validate the active scene ID and the allowed index.
   Duplicate or stale events must not advance another scene or complete a gameplay task.
5. Queue scenes in event order. For one preparation, use this order: task scene, quest outcome if
   that action earned it, chapter payoff, then finale. Never interrupt an active scene.
6. Pending scene IDs are unique and bounded by the authored scene catalogue. Validated progress gives eligibility. An imported ID must not unlock future dialogue.
7. The player can return to cooking with unread scenes. A later reward adds to the queue.
   Show the unread count and offer Resume. Do not force a new modal over another action.
8. Journal replay starts at the first line. Replay does not change coins, items, quest
   state, or task progress. Replay does not change the saved position of an unrelated pending scene.
9. If the player reads an unread scene from the journal, the game may finish the pending entry of that scene. Keep
   later pending entries in order. Clearly distinguish Resume from the replay of a read scene.
10. Do not let navigation trap focus. Return focus to the trigger. If the trigger no longer exists,
    return focus to a stable story control. Give controls accessible names and a count of the current line.
11. Show speakers and text with `textContent`. Keyboard, pointer, and touch use the same
    transitions. Reduced motion changes the presentation only. It does not change scene ordering or state.

## Failure and recovery behavior

If a save write fails, show the existing warning that the state is unsaved. The current session may
continue reading. Do not report the new position as durably saved. Retry with a complete state.
A crash can restore the last durable position. Replay of that line must never give a reward.
Reject missing scene IDs, out-of-range indices, duplicate queue entries, and future scenes.
If content fails to load, keep the save and show a retry action. Do not discard the reading state.
If scene content changes in a later release, require an explicit content migration mapping.
Do not clamp an invalid index silently. Do not interpret another scene as the missing scene.

## State and save compatibility

Store the read scene IDs, the pending sequence, and the active continuation only where they cannot
be derived. When the player replays a scene that is already read, keep the replay position transient.
Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
Validate the older input. Derive eligible scenes from completed preparations. Then validate the result.
Keep the old stored bytes, the completed preparations, and all gameplay resources.
For older saves, mark past eligible scenes as legacy-available for journal replay. Do not mark them read or pending.
Their acknowledgement is unknown. Do not infer the interrupted line. Do not queue a backlog of old scenes.
Read means an actual Finish or Skip in the new system. A repeated migration gives the same result.
An already-completed legacy campaign may use a legacy exemption to open the goals of spec 012. The exemption does not
claim that the player read the finale. The finale stays available in the journal.
Quest, chapter, and finale scene IDs use this same state contract when 005 and 008 integrate.
Reset clears the current continuation of this game with its game state. Import replaces the continuation only
after full validation and the existing confirmation flow. Older saved bytes stay protected.

## Thin implementation slices and exit checks

1. Add stable scene references, validation, and reading transitions. Exit: the engine tests pass for the atomicity
   of task rewards, illegal navigation, queue order, and replay isolation.
2. Add coordinated migration and serialization. Exit: every valid line resumes after a
   round trip. Malformed records and write failures keep the previous durable save.
3. Add Resume, Skip, and journal states. Exit: if the player closes or reloads at each scene position,
   the scene resumes predictably. All controls work with keyboard and touch.
4. Connect quest events, chapter events, and finale events as those features ship. Exit: several earned scenes
   form one ordered queue with no duplicate scenes and no duplicate gameplay rewards.

## Acceptance and dependencies

Engine tests must cover the boundaries of the first line and last line, stale actions, skip, replay, and queue limits.
Save tests must cover interrupted lines, empty queues, imports, repeated migration, and denied storage.
Assert that legacy scenes are replayable without a pending backlog and without a fabricated read acknowledgement.
Built browser tests must interrupt a scene by Close, Escape, reload, and export and import, then resume it.
Follow [Verification and release](README.md#verification-and-release) for the browser evidence.
Check these items manually: the reading comfort, the focus return, the order of the screen reader output, and the message about an unsaved position.
There is no hard dependency. Specs 005, 008, 010, 012, 013, 014, and 015 use this continuation behavior.
The final labels remain design decisions. Whether an unobtrusive Resume prompt appears on startup also remains a design decision.
