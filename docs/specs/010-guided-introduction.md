# 010 - Guided introduction and resumable help

Status: Implemented. [PRODUCT.md](../../PRODUCT.md) owns the guide rules and the guide record. [DESIGN.md](../../DESIGN.md) owns the guide line, the target ring, and the kitchen guide.

## Implemented scope

A new game starts a short guide in Mara's line. The guide uses the real board, ordinary actions, and the existing content.
It keeps the existing hints: the note for a selected item, item help, source instructions, blocker help, and Find a match.

| Step | Instruction | Observable success |
| --- | --- | --- |
| Merge | The pair of the lowest stage and its result, if the player has discovered it | A legal merge succeeds |
| Take | The source and its plus badge | A legal take succeeds |
| Deliver | One real ticket and the control that opens its dishes | A quest is delivered |
| Prepare | The coins, quests, and space that the next preparation still needs | A preparation payment succeeds under spec 006 |
| Read and return | Read now in Story, Skip scene, and the Journal | The player finishes or skips a scene |

The kitchen guide in Options reviews the five steps and gives help for room on the board, the recipe book, Find a match, and blocked spaces.

## Rules

1. A new game starts an active guide. Skip guide closes it. Skip changes no resource and blocks no feature.
2. A step records only its successful action. A click, a move, an animation, a hover, or a failed action records nothing. The guide record is apart from campaign progress.
3. An active run records each success in any order and shows the first step that is not done. It repeats no reward and rearranges no item. A closed run records nothing.
4. The guide finds its targets by rule on each render, not by fixed cells. A moved, merged, or delivered target leaves no stale mark.
5. With no pair, the guide points to a match for a blocked ingredient or to a source. On a full board, it names the ordinary remedies. It never deletes items.
6. Deliver points to a request on a ticket that the board can fill, or else to the request with the most of its dishes on the board. The guide adds and reorders no quests.
7. Prepare names each requirement that the engine imposes. The guide waives no requirement.
8. The kitchen guide works on the current save. It resets nothing and gives no reward. It marks the steps that the current run has done.
9. The guide is not a dialog, so story dialogs always take precedence. Skip scene completes Read and return.
10. Find a match returns when the guide closes. The step text names each target, so colour, motion, and position are never the only cues.

## State and save compatibility

`GameState.guide` is optional. It holds the status, the current step, and one boolean for each step. It holds no cell or interface target.
A save without the record has no run. The kitchen guide can start one. The [shared save compatibility](README.md#shared-save-compatibility) section gives the supported format.
Load and import validate the record. A failed write keeps the unsaved warning, and a reload repeats the last saved step.

## Acceptance

`tests/guide.test.ts` covers the recorded successes, skipped steps, reordered play, full-board recovery, Skip and resume, unchanged resources, and new, active, dismissed, complete, imported, and failed saves.
`tests/browser/guide.spec.ts` plays the first three steps from a fresh game and reloads during a step. It completes the guide with a payment and a skipped scene. It also skips and resumes the guide, opens the kitchen guide on a late save, and checks failed writes, import, and the layout in both themes at 360px, 390px, and 1440px.

## Remaining decisions

- The wording of each step and the order of the further help are draft defaults.
- The guide starts when the kitchen opens. When spec 015 adds the front door, the guide starts after the front door.
- A run that starts after the finale cannot complete Deliver or Prepare, because no request or preparation remains. Read and return can complete if an unread scene remains. Skip ends such a run.
