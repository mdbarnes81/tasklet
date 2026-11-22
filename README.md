# Tasklet

A deliberately tiny to-do app that exists to show a **complete, multi-agent GitHub Copilot repository setup**:
custom agents with an orchestrator, agent skills with bundled scripts, layered instructions, `AGENTS.md`,
hooks, a cloud agent setup workflow and the CI that keeps it all honest.

The app is under 400 lines of HTML, CSS and JavaScript with **zero dependencies**, so every agent has
something real (but small) to plan, test, review and secure.

## Quick start

Requires Node.js 22 or later.

```bash
npm start          # http://127.0.0.1:5173
npm run check      # tests + security lint + a11y check + Copilot config validation
```

ES modules do not load from `file://`, so use `npm start` rather than double-clicking `index.html`.

## Using the agent team

### VS Code (agent mode)

1. Open the folder and trust the workspace. Custom agents from `.github/agents/` appear in the agent picker.
2. Choose **orchestrator** and describe a feature, e.g. *"Let users edit a task title by double-clicking it"*.
3. The orchestrator plans with **planner**, has **tester** write failing tests, **implementer** make them pass,
   then runs **reviewer**, **security** and **accessibility** before **docs** updates the changelog.
4. Prefer to drive it yourself? Pick **planner** directly and use the handoff buttons
   (*Write failing tests → Implement → Request review*) that appear under each response.

Skills load automatically when relevant, or invoke one by name: `/security-review`, `/unit-testing`.

### Copilot CLI

```bash
copilot                                   # in the repo root; reads AGENTS.md, instructions, agents, skills, hooks
/agent                                    # pick a custom agent, e.g. orchestrator
/skills info security-review              # confirm a skill loaded (/skills reload after edits)
```

### Copilot cloud agent (GitHub.com)

Assign an issue to Copilot (the feature template captures acceptance criteria in the right shape) and
choose a custom agent if prompted. The environment is prepared by
`.github/workflows/copilot-setup-steps.yml`, and `.github/hooks/guardrails.json` blocks pushes, publishes,
dependency installs and other destructive shell commands.

## What is in the box

```text
.
├── AGENTS.md                         cross-agent rules: commands, boundaries, roster, definition of done
├── tests/AGENTS.md                   nested rules that apply only inside tests/
├── .github/
│   ├── copilot-instructions.md       always-on coding rules (also read by Copilot code review)
│   ├── instructions/                 path-scoped rules (applyTo globs)
│   │   ├── javascript.instructions.md       src/**/*.js
│   │   ├── tests.instructions.md            tests/**/*.test.js
│   │   ├── html-css.instructions.md         **/*.html, **/*.css
│   │   ├── docs.instructions.md             **/*.md
│   │   ├── copilot-config.instructions.md   .github/agents, skills, hooks ...
│   │   └── code-review.instructions.md      code review only (excludeAgent: cloud-agent)
│   ├── agents/                       10 custom agents (see roster below)
│   ├── skills/                       5 agent skills with scripts, references, templates
│   │   ├── unit-testing/
│   │   ├── security-review/
│   │   ├── accessibility-audit/
│   │   ├── release-notes/
│   │   └── copilot-config-authoring/
│   ├── prompts/                      3 prompt files (legacy; see note below)
│   ├── hooks/                        preToolUse guardrails for CLI and cloud agent
│   ├── workflows/                    ci.yml, copilot-setup-steps.yml
│   ├── ISSUE_TEMPLATE/  CODEOWNERS  dependabot.yml  pull_request_template.md
├── .vscode/                          settings, MCP servers, extension recommendations
├── docs/                             architecture, agent workflow, surface support matrix
├── index.html  src/  tests/  scripts/  the app itself
```

### Agent roster

| Agent | Tools | Purpose |
| --- | --- | --- |
| `orchestrator` | agent, read, search, todo | Plans, delegates, gates. Never edits. |
| `planner` | read, search, web | Acceptance criteria, file list, tests, risks |
| `tester` | read, search, edit, execute | Test-first and hardening in `tests/` |
| `implementer` | read, search, edit, execute, todo | Production code to the plan |
| `reviewer` | read, search, execute | Independent review, re-runs checks |
| `security` | read, search, execute, web | Threat-led review with CWE mapping |
| `accessibility` | read, search, execute | WCAG 2.2 AA review |
| `docs` | read, search, edit | README, docs, CHANGELOG |
| `debugger` | read, search, edit, execute | Reproduce, root-cause, regression test, fix |
| `release` | read, search, edit, execute | Human-only (`disable-model-invocation`). Version bump and notes |

Design choices worth copying:

- **Least privilege.** Reviewers cannot edit, so they cannot "fix" what they are meant to judge.
- **Independent verification.** The reviewer re-runs `npm run check`; the orchestrator never trusts the implementer's report alone.
- **Output contracts.** Every agent ends with a fixed reply format so the orchestrator can gate mechanically.
- **Bounded loops.** At most two fix iterations before escalating to a human.
- **Deterministic guardrails.** Hooks block dangerous commands regardless of what the model decides.
- **Config is tested.** `npm run validate:copilot` catches broken agent references, mismatched names and missing frontmatter in CI.

## Platform support (as documented in November 2026)

Not every file is honoured by every Copilot surface. Full matrix with sources: [`docs/copilot-surface-matrix.md`](docs/copilot-surface-matrix.md).
The key caveats:

- `handoffs` and `model` in agent files work in VS Code but are **ignored by Copilot cloud agent**.
- The `agents:` subagent allowlist is a VS Code (Local harness) feature; other surfaces delegate in their own way (Copilot CLI uses `/fleet`).
- Repository hooks in `.github/hooks/` are for **Copilot CLI and cloud agent**; VS Code has its own hook support behind `chat.useHooks`.
- **Prompt files** are documented by VS Code as part of the deprecated Local harness, scheduled for removal in **February 2027**, with skills as the recommended replacement. They are included here for completeness; new procedures should be skills.

## Adapting this for your own project

1. Replace the app (`index.html`, `src/`, `tests/`) and update the **Commands** and **Layout** sections of `AGENTS.md`.
2. Rewrite the non-negotiables in `.github/copilot-instructions.md` for your stack.
3. Change the `applyTo` globs in `.github/instructions/`.
4. Keep the agent files; edit their **Scope** sections and tool lists. Add `model:` if you want per-agent models in VS Code.
5. Update `copilot-setup-steps.yml` with your real install and build steps.
6. Replace `@example-org/...` in `CODEOWNERS` and the URLs in `ISSUE_TEMPLATE/config.yml` and `SECURITY.md`.
7. Run `npm run validate:copilot` (or port `scripts/validate-copilot-config.mjs`) in CI.

## Licence

MIT. See [LICENSE](LICENSE).
