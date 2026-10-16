---
name: grill-me
description: Challenge a Scary Snacks plan one decision at a time before implementation. Use when the user tells you to interview them about decisions. It covers open product, architecture, economy, content, interface, art, verification, and release decisions.
---

# Challenge a plan one decision at a time

## Select the mode

- Use interview mode by default.
- Use record mode only when the user tells you directly to edit documents.

Interview mode:

- Inputs: the plan, the owner documents, `docs/release-notes.md`, the source code, and the tests.
- Approval: no file change.
- Files: none.
- Output: one decision at a time, and the necessary document changes in the report.
- Completion: the user decides each recorded branch or tells you to keep it open.

Record mode:

- Inputs: the same inputs as interview mode, and the decisions that the user approved.
- Approval: the direct instruction of the user to edit documents.
- Files: only the owner documents that control the decisions.
- Output: the updated owner documents and the decisions in the report.
- Completion: the user decides each recorded branch or tells you to keep it open, and the owner documents agree.

If the user changes the scope, select the mode again before the next edit.
If the user tells you not to edit files, use interview mode.

## Prepare the decision tree

Read `PRODUCT.md`, `DESIGN.md`, `README.md`, `docs/release-notes.md`, the source code in the working tree, and the tests.
Use repository evidence and approved sources to find all the facts that they can give.
Do not tell the user to find facts that you can find.

Record only the open decisions.
Put each decision after the decisions that control it.
Put first the decisions that are difficult to change and the decisions with the most dependencies.
Examine the applicable game rules, the economy, the progression, and the content.
Examine the effects on save compatibility, supported browsers, assets, provenance, and verification.
Also examine the effects on the release risks in `docs/release-notes.md`.
Do not give a legal conclusion. Give a legal question to the user as an open decision.

## Resolve one branch

For the active branch, do these steps:

1. Give the active contract and the evidence that is missing.
2. If there are alternatives, give two or three alternatives that have important differences.
3. Give the important effect of each alternative.
4. Recommend one alternative. Give the evidence for the recommendation and a verification step.
5. Give the user one decision to make.
6. Record the decision of the user and its effects before you examine the next decision that depends on it.

If a decision shows a new dependency, add it to the tree.
Do not add branches that have no evidence.
Open a closed branch again only if new evidence does not agree with the decision.
Give that evidence.

## Record the approved decisions

Identify one owner document for each decision that the project must keep.
`PRODUCT.md` controls the product, `DESIGN.md` controls the design, and `README.md` controls the delivery.
`docs/release-notes.md` gives the release limits.
In record mode, update only that owner and each owner document that does not agree with the decision.
In interview mode, give the necessary document changes in the report.
Do not make a different decision log.

## Complete the task

Complete the mode when its completion condition is true.
For each branch that stays open, give its owner, the reason, the dependency, and a verification step.
For approved implementation, use [add-feature](../add-feature/SKILL.md), [refactor](../refactor/SKILL.md), or [diagnose](../diagnose/SKILL.md).
