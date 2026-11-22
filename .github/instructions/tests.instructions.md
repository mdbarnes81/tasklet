---
name: 'Tests'
description: 'How to write node:test suites for Tasklet'
applyTo: 'tests/**/*.test.js'
---

# Test rules

- `import { describe, it } from 'node:test'` and `import assert from 'node:assert/strict'`.
- Arrange, act, assert. One behaviour per `it`.
- Cover the boundary on both sides (e.g. `MAX_TITLE_LENGTH` and `MAX_TITLE_LENGTH + 1`).
- For every parser or validator, include hostile input: wrong types, empty, oversized, duplicated,
  `__proto__` keys and markup such as `<img src=x onerror=alert(1)>`.
- Table-driven tests (`for (const [input, expected] of cases)`) are preferred over copy-paste.
- Use `assert.throws(fn, ErrorClass)`; never `try/catch` + `assert.fail` for expected errors.
- See the `unit-testing` skill for templates and the coverage workflow.
