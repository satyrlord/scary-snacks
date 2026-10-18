---
name: create-skill
description: Make, import, adapt, change, or audit a Scary Snacks repository skill. Use when a workflow must become repository guidance that agents use again. Also use when the user tells you to examine the skills.
---

# Make or change a repository skill

## Select the mode

- Use audit mode when the user tells you to examine skills without edits.
- Use revision mode when the user tells you to make, import, adapt, change, or repair a skill.

Audit mode:

- Inputs: the skill packages in the scope, the owner documents, `package.json`, and the skill index (`SKILLS.md`).
- Approval: no file change.
- Files: none.
- Output: the report with a status for each file and the findings. Each finding has evidence and a verification step.
- Completion: each file in the package has a status, and each finding has evidence and a verification step.

Revision mode:

- Inputs: the user request, the owner documents, `package.json`, the skill index, and, for an import, the source package.
- Approval: the instruction of the user to make, import, adapt, change, or repair a skill.
- Files: the selected packages in `.github/skills/`, `.github/skills/SKILLS.md`, and the documents that link to a changed skill.
- Output: the changed packages, the validation result, and the report.
- Completion: the conditions in the section "Complete the task" are true.

If the user changes the scope, select the mode again before the next edit.
If the user tells you not to edit files or not to run checks, obey that instruction.
In the report, give each edit or check that you did not do.

## Confirm that the skill is necessary

Read `PRODUCT.md`, `DESIGN.md`, `DELIVERY.md`, `package.json`, and the skill index.
Confirm that no skill in the index does the same work.
A skill must change the decisions of an agent or decrease the work that agents repeat in each task.
Do not make a skill for a general model function.
Do not make a skill for a task that has one occurrence.
Do not make a skill for rules that an owner document controls.
Refer to the owner document. Do not copy its rules, because the copy can drift.

For an import, record all the files in the source package.
Keep only the workflow steps that the repository can use again.
Remove names, paths, commands, tools, products, limits, and approval rules from other projects.
Do not import a script that uses a package that `package.json` does not have.

## Build the package

Use a folder name in `.github/skills/` that has only lowercase letters, numbers, and hyphens.
Put accurate conditions for skill selection in the `description` field of the `SKILL.md` metadata.
Keep the entry point short.
Put information in `references/` only when it applies to one selected branch.
Put a script in `scripts/` only for work that occurs again and gives the same output each time.
Write scripts as `.ts` modules that use only Node.js built-in modules and the packages in `package.json`.
`AGENTS.md` gives the other code rules for skill scripts.
Put a file in `assets/` only when the skill output uses it.

For a long procedure with conditions, keep these items in `SKILL.md`:

- The scope and the approval rules.
- The branch selection.
- The conditions that complete each branch.
- A link to each module.

For each module, give the condition that makes it necessary to read that module.
Also give that condition for a change of scope during the task.
Load only the modules that are necessary for the task.
Keep a short skill in one file when more files do not give a better selection.

## Write the text

Write all the files in the package in ASD-STE100 Simplified Technical English.
This skill must follow the same rules.
Obey the rules in `AGENTS.md` for public documents and for the current state.

Write the sentences with these rules:

- Use sentences of 20 words or fewer.
- Put one instruction in each sentence.
- Start each instruction with an imperative verb.
- Use the active voice and the present tense.
- Put one topic in each paragraph.

Choose the words with these rules:

- Use plain words from everyday English. Do not use idioms, slang, metaphors, humour, or marketing words.
- Use one word for one meaning and one term for one concept. Do not use a synonym for a defined term.
- Do not use phrasal verbs. Use one word. For example, use "install" and not "set up".
- Use at most three nouns in a noun cluster. Use "of" or a short sentence for a longer cluster.
- Do not use an -ing word as a noun or an adjective if a plain word exists.
- Use "must" for a mandatory action.
- Use "should" for a recommended action.
- Use "may" for permission.
- Use "can" for possibility or ability.
- Use "if" for a condition and "before" or "after" for order.
- Do not use "it" or "this" if the reference is not clear. Repeat the noun.

Write the lists and the terms with these rules:

- List every item. Do not use "and/or", "etc.", or "and so on".
- Give the full term when an abbreviation first occurs.
- Do not change identifiers, commands, paths, or quoted interface text.
- Preserve exact source quotations, license text, and recorded generation prompts.
- Define necessary technical terms before use.
- Treat automated word counts as review aids, not proof of full ASD-STE100 compliance.

For each branch, give these items:

- The necessary inputs.
- The approval limit.
- The files that the branch can change.
- The output.
- The condition that completes the branch.

Preserve approval that the user already gave for the current scope.
Do not request the same approval again.
Give the procedure for a change of scope.
Give the procedure for a user instruction that prevents edits or tests.
Keep automatic selection of the skill active.
Deactivate automatic selection only when the user tells you to start the skill only by its name.
Add `agents/openai.yaml` with quoted strings.
Give the file a default prompt that includes the skill name.
Update `SKILLS.md` and each link to the skill.

## Validate the package

Record each file in the package before validation.
For each branch, examine the selection condition, the inputs, the approval, and the owner.
Also examine the procedure, the output, and the condition that completes the branch.
Compare each command and path with the checkout.
Identify contract text that the code does not obey at this time.
Keep that contract text apart from the behavior that the code has at this time.
Keep proposed specifications separate from implemented contracts.
Compare external workflow requirements with the installed skill before you describe that workflow.
Remove workflow rules that do not agree with the owner document that controls the workflow.

Validate each changed skill package with the repository runner:

```text
node .github/skills/create-skill/scripts/validate-skill.ts <skill-folder>...
```

With no argument, the runner validates all the packages.
The runner finds `quick_validate.py` in the installed `skill-creator` package.
The runner tries an isolated `uv` environment with PyYAML first.
If that environment is not available, the runner tries an installed Python interpreter with PyYAML.
The runner does not change the system Python installation.
Set `CODEX_HOME` when the package is not in its default user location.
Do not put an absolute path from the computer of a user in the repository.
If the runner shows a `BLOCKED` message, give that message and its next step in the report.
Do not give a pass for a blocked run.

Examine links, terms from other products, placeholder text, and added scripts.
Confirm that the metadata files agree.
A pass from the validator does not show that the workflow helps the agent.

For a change to skill selection, try requests that are typical for the skill.
Check the module selection and the coverage of all the necessary steps.
Include a request that changes the scope.
Include a request that prevents edits or tests.

## Complete the task

Before you complete audit mode, confirm these conditions:

- Each file in the package has a status.
- Each finding has evidence and a verification step.

Before you complete revision mode, confirm these conditions:

- The selection condition is accurate.
- The workflow uses repository contracts that you examined.
- The skill can reach all its files.
- The metadata files agree.
- The validation passes.
