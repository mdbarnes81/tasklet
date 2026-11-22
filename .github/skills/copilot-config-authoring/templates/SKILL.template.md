---
name: my-skill
description: 'Use when <trigger phrases and situations>. <What the skill provides: steps, scripts, references>.'
license: MIT
---

# <Skill title>

## When to use

<Concrete triggers. The description above is what the model matches on; keep both in sync.>

## Steps

1. <Step, referencing bundled files by relative path, e.g. `scripts/run.mjs`>
2. <Step>

## Bundled resources

- `scripts/`: executable helpers (read-only, no network)
- `references/`: long checklists or specs, loaded only when needed
- `templates/`: starter files the agent copies and adapts
