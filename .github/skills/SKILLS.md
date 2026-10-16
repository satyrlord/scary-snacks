# Scary Snacks repository skills

Before you use a skill, read [`PRODUCT.md`](../../PRODUCT.md), [`DESIGN.md`](../../DESIGN.md), and [`DELIVERY.md`](../../DELIVERY.md).
These owner documents control the product, the design, and the delivery.
[`AGENTS.md`](../../AGENTS.md) gives the code rules, the commands, and the verification steps. All skills obey it.
Its rules include the limits on `private/`, `analysis/`, public documents, commits, pushes, deployment, and legal clearance.
Use only the scripts that `package.json` has in the working tree.

Read the entry point of the selected skill first.
Load a reference only at the procedure step that names it.
If the scope changes, select the modules again.

Obey the limits of the user on edits and tests.
A link to a different skill does not increase the approval that the user gave.
For the full gate, use [`run-quality-gate`](run-quality-gate/SKILL.md).

- [`add-feature`](add-feature/SKILL.md): Add or change product behavior and its
  contracts in the owner documents.
- [`create-skill`](create-skill/SKILL.md): Make, import, adapt, change, or audit
  repository skills.
- [`dead-code-audit`](dead-code-audit/SKILL.md): Audit reachability and give a
  status for each candidate. Remove dead items only when the user tells you to.
- [`design-scary-snacks-ui`](design-scary-snacks-ui/SKILL.md): Design,
  audit, add, repair, or examine the browser interface.
- [`deslop`](deslop/SKILL.md): Find and remove unsupported content that has evidence.
  Use it for a read-only audit, or for a cleanup that the user tells you directly to do.
- [`diagnose`](diagnose/SKILL.md): Reproduce and isolate failures that are
  difficult to find. Repair only when the user tells you to.
- [`full-code-review`](full-code-review/SKILL.md): Review a diff, a branch,
  or a full checkout. Repair only when the user tells you to.
- [`generate-game-art`](generate-game-art/SKILL.md): Generate, review, or
  replace bitmap art with the built-in chat image generator.
  The art is the atlases, the timber, the runner, the painted room states, and the two decoration paintings.
  If the agent has no image generator, give the user a prompt to run.
  Also start here for the OpenAI Images API route.
- [`generate-game-art-openai`](generate-game-art-openai/SKILL.md): Plan, send, and
  measure OpenAI Images API requests for the same bitmaps, except the two decoration paintings, when the user chooses that route.
  Codex does not select it automatically. In Codex, use it by its name or through `generate-game-art`.
  Other agents select it from its description.
- [`grill-me`](grill-me/SKILL.md): Challenge a plan one decision at a time,
  when the user tells you to interview them.
- [`improve-codebase-architecture`](improve-codebase-architecture/SKILL.md):
  Review ownership and module boundaries, and improve them.
- [`refactor`](refactor/SKILL.md): Make the structure better without a change
  to behavior.
- [`run-quality-gate`](run-quality-gate/SKILL.md): Run or repair the full
  quality gate of the repository. Also collect the evidence for a release.
- [`update-game-content`](update-game-content/SKILL.md): Change items, merge chains,
  generators, characters, chapters, preparations, dialogue, order inputs, or the initial board.
- [`verify-game`](verify-game/SKILL.md): Examine the game in its production
  browser build, and collect the evidence.

Audits, reviews, and diagnosis do not change files unless the user tells you to make a change.
Do not change work that is not related to the task.
Do not edit a generated file by hand. Run its generator.

To show these packages to the skill discovery tools, run this command on Windows:

```powershell
pwsh -File .github/scripts/setup-skill-links.ps1
```

The command makes ignored junctions at `.claude/skills`, `.agents/skills`, and `.codex/skills`.
The junctions show the files in `.github/skills/`. They are not copies.
