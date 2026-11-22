---
name: accessibility-audit
description: 'Use when building or reviewing UI in index.html, src/main.js or src/styles.css, or when asked for an accessibility or WCAG check. Runs a bundled static HTML checker, then guides a manual WCAG 2.2 AA review of keyboard, focus, names, live regions and contrast.'
license: MIT
---

# Accessibility audit skill

## 1. Static check

Run the bundled script from the repo root (it is also `npm run lint:a11y`):

```bash
node .github/skills/accessibility-audit/scripts/a11y-static-check.mjs index.html
```

It checks: `<html lang>`, `<title>`, one `<main>`, one `<h1>`, labels for every `<input>`,
accessible names for `<button>`, `alt` on `<img>`, and that live regions exist. It cannot see DOM built at
runtime by `src/main.js`, so step 2 matters.

## 2. Runtime DOM review (read `src/main.js`)

- Dynamically created controls: each checkbox has a `<label for>`; each icon button has `aria-label`.
- Re-render with `replaceChildren()` destroys focused elements. After delete or clear, focus must move to
  something sensible (the input or the next item), never to `<body>`.
- Status text changes go to the `role="status"` element; validation errors to `role="alert"`.

## 3. Styles review (`src/styles.css`)

- `:focus-visible` outline present and not removed anywhere.
- Contrast in **both** colour schemes: compute ratios for `--fg`/`--bg`, `--muted`/`--bg`, `--accent`/`--bg`.
  Body text needs 4.5:1, UI boundaries and focus rings 3:1 (WCAG 1.4.3, 1.4.11).
- State is never colour-only (WCAG 1.4.1): pressed filters also get `font-weight`, done tasks a strikethrough.

## 4. Optional browser check

If the Playwright MCP server from `.vscode/mcp.json` is available, start `npm start`, open
http://127.0.0.1:5173 and walk the page with the keyboard only. Record what you tested.

## Reference

Success criteria most relevant here: 1.3.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7, 2.4.11, 3.3.1, 4.1.2, 4.1.3.
