---
name: unit-testing
description: 'Use when writing, extending or debugging unit tests for Tasklet. Covers node:test conventions, deterministic task factories, in-memory storage fakes, hostile-input cases and the coverage workflow. Includes a starter test template.'
license: MIT
---

# Unit testing skill (node:test)

## Quick start

1. Copy [`templates/module.test.js`](templates/module.test.js) to `tests/<module>.test.js`.
2. Replace the imports and cases. Keep the `describe` per exported function.
3. Run `npm test`. For coverage on changed files: `npm run test:coverage`.

## Conventions

| Need | Do this |
| --- | --- |
| Fixed time and ids | `createTask(title, { now: () => 1, id: () => 'id-1' })` |
| Many tasks | a `factory()` closure with an incrementing id (see template) |
| Storage | `createStore(memoryBackend())`; never real `localStorage` |
| Storage failure | a backend whose `getItem`/`setItem` throw |
| Expected errors | `assert.throws(() => fn(), RangeError)` |
| Equality | `assert.deepEqual` (strict via `node:assert/strict`) |
| Many inputs | table-driven `for (const [input, expected] of cases)` |

## Case checklist for any validator or parser

- [ ] happy path
- [ ] boundary: exactly at the limit, and one past it
- [ ] empty string, whitespace only
- [ ] wrong types: `null`, `undefined`, number, object, array
- [ ] duplicates
- [ ] markup as data: `<img src=x onerror=alert(1)>` is stored verbatim, not interpreted
- [ ] prototype keys: `__proto__`, `constructor`
- [ ] corrupt JSON and wrong schema version

## Test-first mode

When asked for failing tests before implementation, run them and check the failure is an **assertion**
failure on the new behaviour. An import error or `ReferenceError` means the test is wrong, not that the
feature is missing. Export a stub from the module first if needed, and say so.

## Reading coverage

`npm run test:coverage` prints a per-file table. Look at the *branch* column for changed files; uncovered
`if` branches usually mean a missing edge case from the checklist above.
