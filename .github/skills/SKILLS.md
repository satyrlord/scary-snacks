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
Treat a proposed specification as planned work, not as implemented behavior.
Verify each implementation claim against the source code and its tests.
Preserve approval that the user already gave for the current scope.
For the full gate, use [`run-quality-gate`](run-quality-gate/SKILL.md).

- [`add-feature`](add-feature/SKILL.md): Add or change product behavior and its
  contracts in the owner documents.
- [`create-skill`](create-skill/SKILL.md): Make, import, adapt, change, or audit
  a repository skill.
- [`dead-code-audit`](dead-code-audit/SKILL.md): Audit reachability and give a
  status for each candidate. Remove dead items that have evidence only when the user tells you to.
- [`design-scary-snacks-ui`](design-scary-snacks-ui/SKILL.md): Design,
  audit, add, repair, or examine the browser interface through the Impeccable workflow.
- [`deslop`](deslop/SKILL.md): Remove unsupported repository content without a change to correct behavior.
  Use it for a read-only audit, or for a cleanup that the user tells you directly to do.
- [`diagnose`](diagnose/SKILL.md): Find the cause of failures and performance regressions
  that are difficult to find. Repair only when the user tells you to.
- [`full-code-review`](full-code-review/SKILL.md): Review a diff, a branch,
  or a checkout. Repair only when the user tells you to.
- [`generate-game-art`](generate-game-art/SKILL.md): Generate, review, repair, or
  replace bitmap art with the built-in chat image generator.
  The art includes the atlases, the timber, the runner, and the separate item pictures.
  It also includes the painted room states and the two decoration paintings.
  If the agent has no image generator, give the user a prompt to run.
  Also start here for the OpenAI Images application programming interface (API) route.
- [`generate-game-art-openai`](generate-game-art-openai/SKILL.md): Plan, send, and measure
  OpenAI Images API requests, only when the user chooses the API route.
  Its asset table gives the supported bitmaps, including the two decoration paintings.
- [`grill-me`](grill-me/SKILL.md): Challenge a plan one decision at a time,
  when the user tells you to interview them.
- [`improve-codebase-architecture`](improve-codebase-architecture/SKILL.md):
  Review ownership, module boundaries, coupling, data flow, and test boundaries, and improve them.
- [`refactor`](refactor/SKILL.md): Improve the structure without a change
  to behavior or contracts.
- [`run-quality-gate`](run-quality-gate/SKILL.md): Run or repair the full
  quality gate. Also collect the evidence for a release.
- [`update-game-content`](update-game-content/SKILL.md): Add or change items, merge chains,
  generators, characters, chapters, preparations, dialogue, quests, or the initial board.
  Do not use it for interface text only.
- [`verify-game`](verify-game/SKILL.md): Examine the game in its production
  browser build, and collect the evidence.

Do not change files that the task does not need.

`AGENTS.md` gives the command that lets the skill discovery tools find these packages.
The command makes the ignored folder links `.claude/skills`, `.agents/skills`, and `.codex/skills`.
Each folder link points to `.github/skills/`. A folder link is not a copy.
