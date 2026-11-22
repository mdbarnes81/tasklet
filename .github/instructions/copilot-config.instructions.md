---
name: 'Copilot customisation files'
description: 'Rules for editing agents, skills, instructions, prompts and hooks'
applyTo: '.github/agents/**,.github/skills/**,.github/instructions/**,.github/prompts/**,.github/hooks/**,AGENTS.md,**/AGENTS.md'
---

# Copilot customisation rules

Run `npm run validate:copilot` after any change here. It checks the rules below that can be automated.

## Agents (`.github/agents/<name>.agent.md`)

- `name` must equal the file stem, lowercase and hyphenated. Handoffs and `agents:` lists reference this name.
- `description` is required and says *when* to use the agent, not just what it is.
- Give each agent the **least** tools it needs. Built-in aliases: `read`, `search`, `edit`, `execute`,
  `agent`, `web`, `todo`. Review-only agents never get `edit`.
- Only the orchestrator gets the `agent` tool and an `agents:` allowlist.
- `handoffs` and `model` are honoured by VS Code but ignored by Copilot cloud agent. Never rely on them for
  correctness; the body text must stand on its own.
- Every agent body ends with an **Output contract** section so the orchestrator can parse results.

## Skills (`.github/skills/<name>/SKILL.md`)

- Directory name equals the `name` field: lowercase, hyphens, no spaces.
- `description` (max 1024 chars) states the trigger: "Use when ...". This is what the model matches on.
- Bundle scripts in `scripts/`, reference material in `references/`, starter files in `templates/`.
  Reference them by relative path from the skill directory.
- Keep `SKILL.md` focused; move long checklists to `references/` so they load only when needed.

## Instructions (`.github/instructions/*.instructions.md`)

- Always set `applyTo`. Use comma-separated globs for multiple patterns.
- Use `excludeAgent: "code-review"` or `excludeAgent: "cloud-agent"` to target one GitHub surface.
- Short, imperative bullets. No duplication of `copilot-instructions.md`.

## Hooks (`.github/hooks/*.json`)

- `"version": 1` is required. Cloud agent honours `bash` (or `command`), not `powershell`.
- Hook scripts must be fast (under 10 s) and must never print secrets.
