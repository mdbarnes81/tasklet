---
name: 'HTML and CSS'
description: 'Markup, styling and accessibility rules for index.html and src/styles.css'
applyTo: '**/*.html,**/*.css'
---

# HTML and CSS rules

- Semantic elements first: `<main>`, `<nav>`, `<form>`, `<button>`, `<label>`. No clickable `<div>`.
- Every form control has a programmatic label (`<label for>` or `aria-label`).
- Status messages use `role="status"` + `aria-live="polite"`; errors use `role="alert"`.
- Toggle buttons expose state with `aria-pressed`.
- No inline `<script>`, `<style>` or `style=""`: the CSP forbids them.
- If you change the CSP `<meta>`, mirror the change in `SECURITY_HEADERS` in `scripts/serve.mjs`.
- CSS uses custom properties in `:root`; support `prefers-color-scheme` and `prefers-reduced-motion`.
- Keep a visible `:focus-visible` outline with at least 3:1 contrast against its background.
- Text colour contrast must meet WCAG 2.2 AA (4.5:1 body text).
