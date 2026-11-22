---
name: security-review
description: 'Use when reviewing code, configuration, CI workflows or Copilot customisation for security issues, or when asked for a security audit, threat model or XSS/CSP check. Provides the Tasklet threat model, a checklist with CWE mappings and the automated DOM-sink scan.'
license: MIT
---

# Security review skill

## 1. Automated scans (always run first)

```bash
npm run lint:security        # DOM XSS sinks and dynamic code execution in src/ and index.html
npm test                     # includes path-traversal tests for the dev server
git diff --stat              # what actually changed
```

The scanner lives at `scripts/check-dom-sinks.mjs`. A line can be suppressed only with
`// dom-sink-ok: <reason>`; treat every suppression in a diff as a finding to justify.

## 2. Scope the review

Map each changed file to a checklist section in [`references/checklist.md`](references/checklist.md):

| Changed path | Sections |
| --- | --- |
| `src/main.js`, `index.html` | A (DOM/XSS), B (CSP) |
| `src/tasks.js`, `src/storage.js` | C (untrusted input) |
| `scripts/serve.mjs` | D (dev server) |
| `package.json`, `package-lock.json` | E (supply chain) |
| `.github/workflows/**` | F (Actions) |
| `.github/agents/**`, `.github/skills/**`, `.github/hooks/**`, `AGENTS.md` | G (agent customisation) |

## 3. Report

Use the Security agent's output contract. Every Blocking finding needs: CWE, file:line, a concrete fix and
the name of a regression test to add.

## Severity guide

- **Blocking**: exploitable now (XSS path, traversal, secret in repo, `pull_request_target` with checkout of PR head).
- **Should fix**: defence in depth missing (unpinned action, broad `permissions`, missing header).
- **Info**: theoretical or accepted risk; state why it is accepted.
