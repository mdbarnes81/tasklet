# AGENTS.md (tests/)

Nested instructions that apply when an agent works inside `tests/`. They add to the root `AGENTS.md`.

- Use only `node:test` (`describe`, `it`) and `node:assert/strict`. No third-party test libraries.
- One test file per source module: `tests/<module>.test.js`.
- Inject time and ids (`createTask(title, { now, id })`) so tests are deterministic. Never depend on `Date.now()` or random UUIDs.
- Never touch real `localStorage`; pass an in-memory backend to `createStore()`.
- Test names describe behaviour, not implementation: "drops duplicate ids", not "calls Set.has".
- A failing test is a signal. Do not weaken assertions, add `.skip` or delete cases to get green.
