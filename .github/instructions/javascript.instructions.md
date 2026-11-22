---
name: 'JavaScript source'
description: 'Conventions for Tasklet browser modules in src/'
applyTo: 'src/**/*.js'
---

# JavaScript source rules

- Native ES modules with relative `./file.js` imports (extension required; there is no bundler).
- `src/tasks.js` is pure: no `window`, `document`, `localStorage`, `fetch`, timers or `console`.
- Exported functions take data and return new data. Freeze task objects (`Object.freeze`).
- Validate at boundaries: user input via `normaliseTitle()`, persisted data via `deserialise()`.
- Throw `TypeError` for wrong types and `RangeError` for out-of-range values, with a human-readable message
  (it is shown to the user in `#form-error`).
- DOM: build with `document.createElement`, set text with `textContent`, attributes with `setAttribute`
  or properties. Use `replaceChildren()` to re-render lists.
- Event handlers call `commit()` with a new task array; do not mutate `state.tasks` in place.
- Add a JSDoc block to every export. Keep functions under roughly 30 lines.
