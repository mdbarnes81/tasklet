---
name: 'Documentation'
description: 'Writing style for Markdown documentation'
applyTo: '**/*.md'
---

# Documentation rules

- UK English spelling ("behaviour", "customisation", "licence" as a noun).
- Sentence-case headings. One H1 per file.
- Lead with what the reader needs to do; background afterwards.
- Commands in fenced blocks with a language tag (`bash`, `json`, `yaml`).
- Link to files with relative paths so links work on GitHub and in VS Code.
- Do not document behaviour the code does not have. If unsure, check the source or mark **TODO(verify)**.
- Files under `.github/agents`, `.github/skills`, `.github/instructions` and `.github/prompts` are also
  governed by `copilot-config.instructions.md`.
