# AGENTS.md

Instructions for any AI coding agent working in this repository (GitHub Copilot cloud agent, Copilot CLI,
VS Code agent mode, Claude Code, Codex and others that read `AGENTS.md`).

## Project in one paragraph

Tasklet is a single-page to-do app with zero dependencies. `index.html` loads `src/main.js` (DOM wiring),
which uses `src/tasks.js` (pure logic) and `src/storage.js` (localStorage adapter). Tests run on Node's
built-in test runner. The real point of the repo is the Copilot customisation under `.github/`.

## Commands

| Task | Command |
| --- | --- |
| Serve locally (http://127.0.0.1:5173) | `npm start` |
| Unit tests | `npm test` |
| Coverage | `npm run test:coverage` |
| DOM-sink security lint | `npm run lint:security` |
| Static accessibility check | `npm run lint:a11y` |
| Validate Copilot config files | `npm run validate:copilot` |
| **Everything CI runs** | `npm run check` |

There is no install step beyond Node 22+. Do not run `npm install <pkg>`.

## Layout

```
index.html            entry point, strict CSP
src/tasks.js          pure logic, no DOM, no storage
src/storage.js        persistence adapter, injectable backend
src/main.js           DOM rendering and events (textContent only)
src/styles.css        no inline styles anywhere
tests/                node:test suites, one file per module
scripts/              dev server, security lint, config validator
.github/agents/       custom agents (*.agent.md)
.github/skills/       agent skills (SKILL.md + scripts/templates)
.github/instructions/ path-scoped instructions (*.instructions.md)
.github/prompts/      legacy prompt files (*.prompt.md)
.github/hooks/        Copilot CLI / cloud agent hooks
docs/                 architecture and agent workflow docs
```

## Boundaries

**Always**
- Run `npm run check` before declaring work complete, and paste the summary line.
- Add or update tests for every behaviour change.
- Keep diffs minimal and focused on the task; no drive-by reformatting.

**Ask first**
- Adding any dependency, build step or framework.
- Changing the storage schema (`SCHEMA_VERSION`) or the CSP.
- Editing anything under `.github/workflows/` or `.github/hooks/`.

**Never**
- Introduce HTML-parsing sinks or dynamic code execution (see `.github/copilot-instructions.md`).
- Commit secrets, tokens or `.env` files.
- Push, force-push, tag, publish or merge. Humans do that.
- Weaken or delete a test to make it pass.

## Agent roster

The multi-agent team lives in `.github/agents/`. Start with **orchestrator** for anything larger than a one-line fix.

| Agent | Role | Edits code? |
| --- | --- | --- |
| `orchestrator` | Plans, delegates to specialists, enforces quality gates | No |
| `planner` | Turns a request into a scoped, testable plan | No |
| `implementer` | Writes production code to the plan | Yes (`src/`, `index.html`) |
| `tester` | Writes and runs tests | Yes (`tests/`) |
| `reviewer` | Code review against repo standards | No |
| `security` | Threat-focused review and lint | No |
| `accessibility` | WCAG 2.2 AA review | No |
| `docs` | README, docs/, CHANGELOG, JSDoc | Yes (Markdown, comments) |
| `debugger` | Reproduces and root-causes failures | Yes (minimal fix + regression test) |
| `release` | Version bump and release notes (human-invoked only) | Yes (`package.json`, `CHANGELOG.md`) |

## Definition of done

1. Plan acceptance criteria met.
2. `npm run check` green.
3. Reviewer, security and (for UI changes) accessibility agents report no blocking findings.
4. `CHANGELOG.md` has an entry under **Unreleased**.
5. PR description uses `.github/pull_request_template.md`.
