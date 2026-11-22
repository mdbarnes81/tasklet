---
name: copilot-config-authoring
description: 'Use when creating or changing GitHub Copilot customisation in this repo: custom agents (.agent.md), agent skills (SKILL.md), path-scoped instructions, prompt files, hooks or AGENTS.md. Provides templates, the surface-support matrix and the validator.'
license: MIT
---

# Copilot configuration authoring skill

## Pick the right mechanism

| You want to... | Use | Location |
| --- | --- | --- |
| Rules that apply to every request | Repository instructions | `.github/copilot-instructions.md`, `AGENTS.md` |
| Rules for certain files only | Path-scoped instructions | `.github/instructions/*.instructions.md` with `applyTo` |
| A persona with its own tools | Custom agent | `.github/agents/<name>.agent.md` |
| A reusable procedure loaded on demand | Agent skill | `.github/skills/<name>/SKILL.md` |
| Deterministic guardrails around tool calls | Hooks | `.github/hooks/*.json` |
| Tools from external systems | MCP server | `.vscode/mcp.json` (VS Code), agent `mcp-servers` (cloud agent) |
| Cloud agent environment setup | Setup workflow | `.github/workflows/copilot-setup-steps.yml` |

Prompt files (`.github/prompts/*.prompt.md`) still work but VS Code documents them as part of the
deprecated Local harness; prefer a skill for new reusable procedures.

## Templates

- [`templates/agent.template.md`](templates/agent.template.md)
- [`templates/SKILL.template.md`](templates/SKILL.template.md)

## Rules

1. Agent `name` equals the file stem. Skill `name` equals the directory name. Both lowercase-hyphenated.
2. Descriptions state **when** to use the thing. The model routes on the description.
3. Least privilege: start from `['read', 'search']` and add only what the role needs.
4. Do not rely on `handoffs` or `model` for correctness: Copilot cloud agent ignores them.
5. End agent bodies with an **Output contract** so the orchestrator can gate on the result.
6. A new specialist agent must also be added to the orchestrator's `agents:` list and the roster table
   in `AGENTS.md`, unless it is deliberately human-only (`disable-model-invocation: true`).

## Validate

```bash
npm run validate:copilot
```

Checks frontmatter presence, `name`/file agreement, that every agent referenced in `agents:` and `handoffs`
exists, skill naming, `applyTo` on instructions, prompt `agent` targets and hook JSON shape.
