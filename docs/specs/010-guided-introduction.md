# 010 - Guided introduction and resumable help

Status: Proposed. Not implemented. All rules below are draft defaults.

## Evidence and intended result

`src/app.ts` already gives guidance for a selected item in Mara's line (`selectionLine`). It also gives
item details and generator instructions, and it implements Find a match. PRODUCT defines the controls.
`GameState` has no tutorial state. There is no staged introduction and no saved teaching position.
Keep the useful existing hints.
Add a short, optional sequence for production, merges, quest delivery, preparation payments, and story replay.

## Scope and ownership

- Guide the player with the real board, ordinary actions, and the existing original content.
- Do not create a separate economy for the guidance. Do not give resources that the game does not track. Do not fake a quest.
- Keep Skip and help available. Never require a guidance action to unlock ordinary controls.
- Support keyboard, pointer, and touch. Do not require dragging or timed input.
- Keep rules in `src/engine.ts`, saves in `src/storage.ts`, and guidance in `src/app.ts`.
- If content references are necessary, author the guidance metadata in `tools/create-original-data.ts`.
- Update PRODUCT and DESIGN with the implemented sequence and the reopening behavior.
- Do not add timers, energy limits, network calls, accounts, or a runtime dependency.

## Proposed guidance sequence

| Stage | Instruction purpose | Observable success |
| --- | --- | --- |
| Select and merge | Show the two initial flour items and the result preview | A legal merge succeeds |
| Take | Show the plus sign of the ingredient source and the available Take action | A legal generator action succeeds |
| Deliver | Inspect a real quest ticket and its complete requirements | A quest is successfully delivered |
| Prepare | Connect deliveries to the current bistro objective | The first preparation succeeds under spec 006 |
| Read and return | Show the task scene, the journal, and the Resume route | The player returns from the scene or skips the scene |

After the core sequence, offer optional help for selling, the recipe book, and Find a match.
Explain the sale value and the campaign requirements with the active economy rules. Do not say that coins alone complete a preparation: each preparation also needs its quests.
Add help for the blockers from spec 007 when the first reachable blocker becomes relevant.

## Proposed rules and failure behavior

1. New games start with a compact introductory prompt. A visible Skip guidance action
   exits the prompt. The action does not change resources and does not block any game feature. Help can reopen the prompt.
2. Advance a stage only after the appropriate successful action. A click, an animation,
   a hover, or a failed attempt does not advance a stage. Keep guidance completion separate from campaign progression.
3. A player may act out of order. Record the observed success for the current guidance run.
   Skip the stages that the run already satisfies. Do not repeat rewards and do not rearrange items.
4. Highlight the current valid targets by rule, not by fixed cell indices. If the player moves,
   merges, or sells a target, recompute the hint and keep the board usable.
5. If no matching pair exists, explain how to produce ingredients. If the board is full,
   use the ordinary remedies: merge, deliver, and sell. Never delete items for the guidance.
6. For Deliver, inspect a quest ticket that the player can fill or produce. Do not add or reorder quests.
   Do not require an inaccessible chain to produce a hint.
7. For Prepare, show every actual prerequisite and a route toward it. Guidance must not
   waive a coin requirement, quest requirement, or item requirement that the engine imposes.
8. Replay help operates on the current save. It does not reset the board and does not give a
   task reward again. Mark completed stages as explanations that the player can review.
9. Story dialogs take precedence over guidance overlays. Use 009 for saved scene positions.
   Never open competing modals. Never require the player to read every line to finish guidance.
10. Keep Find a match available outside the guidance. Guide text and target names must
    stay accessible without colour, animation, or positional directions alone.

## State and save compatibility

Persist three items for the current run: the guidance status, the current stage, and bounded flags of observed success.
Validate known stage identifiers (IDs), coherent status, and booleans. Do not store Document Object Model (DOM) selectors or cell targets.
Follow [Shared save compatibility](README.md#shared-save-compatibility) in the specs index.
Validate guidance during load and import. Keep Help available after dismissal. Guidance flags cannot create resources or unlock campaign content.
A failed save keeps a warning that the state is unsaved. On reload, repeat only the last durable guidance
step, without repeating its gameplay reward. Import adopts guidance only after full validation.

## Thin implementation slices and exit checks

1. Define the stages and the records of successful actions. Exit: out-of-order play and failure
   cases advance only valid stages. No guidance transition changes economic resources.
2. Add state validation and persistence. Exit: reload, import, repeated loads, and
   malformed flags keep the intended guidance status and all prior game progress.
3. Implement the first two stages and Skip. Exit: if the player moves the original flour or
   a generator, no stale target remains. Keyboard play needs no drag gesture.
4. Add delivery, preparation, story, and optional help. Exit: a fresh legal play session
   gives guidance for the complete loop. An existing save can review help without a reset.

## Acceptance and dependencies

Engine tests must cover the record of successful events, skipped stages, reordered play, and full-board recovery.
Save tests must cover new, active, dismissed, completed, and imported games, and write failures.
Built browser tests must complete guidance and skip guidance. They must reload during a step. They must reopen help on a late-game save.
Follow [Verification and release](README.md#verification-and-release) for the browser evidence.
Full integration depends on 006, 007, 009, and 015.
The exact prompt wording, the order of optional help, and the acceptable length of the introduction remain design decisions.
