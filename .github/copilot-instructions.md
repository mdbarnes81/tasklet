# Copilot repository instructions: Tasklet

Tasklet is a deliberately tiny, dependency-free to-do app (HTML + ES modules + `node:test`).
It exists to demonstrate a multi-agent GitHub Copilot setup, so keep the app small and the
customisation files exemplary.

Cross-agent rules (commands, boundaries, structure) live in [`AGENTS.md`](../AGENTS.md).
This file holds the always-on coding rules that every Copilot surface, including code review, should apply.

## Non-negotiables

- **No runtime or dev dependencies.** Use the platform: DOM APIs, `node:test`, `node:assert/strict`, `node:http`.
  Adding a package requires an issue and maintainer approval first.
- **No HTML-parsing sinks.** Never use `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`,
  `eval`, `new Function` or string timers. Render with `createElement` + `textContent`.
  `npm run lint:security` enforces this.
- **Keep the CSP strict.** No inline `<script>` or `<style>`, no `style=""` attributes, no third-party origins.
- **Logic stays pure.** `src/tasks.js` must not touch `window`, `document` or storage. Side effects live in
  `src/main.js` (DOM) and `src/storage.js` (persistence, injectable backend).
- **Treat stored data as untrusted.** Anything read from `localStorage` goes through `deserialise()` validation.
- **Every behaviour change ships with a test** in `tests/` and passes `npm run check`.

## Style

- ES2022 modules, 2-space indent, single quotes, semicolons, trailing commas in multi-line literals.
- Prefer small named functions and immutable updates (`map`, `filter`, spread) over mutation.
- JSDoc types on exported functions. No TypeScript build step.
- UK English in user-facing copy and docs (e.g. "colour", "organise"); code identifiers follow web platform spelling.
- Accessible by default: real `<button>`/`<label>` elements, visible focus, `aria-live` for status changes.

## When unsure

Prefer asking in the PR description over guessing. Flag assumptions explicitly as **Assumption:**.
