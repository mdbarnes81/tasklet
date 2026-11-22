# Architecture

```text
index.html ──loads──▶ src/main.js ──uses──▶ src/tasks.js   (pure logic)
                          │
                          └──uses──▶ src/storage.js ──uses──▶ src/tasks.js (serialise/deserialise)
                                          │
                                          └──▶ localStorage (injectable backend)
```

## Layers

| Module | Responsibility | Side effects |
| --- | --- | --- |
| `src/tasks.js` | Create, toggle, remove, filter, (de)serialise tasks; validation | None |
| `src/storage.js` | Load/save the task list under `tasklet:v1` | Storage only, guarded |
| `src/main.js` | Render list, handle events, show errors and status | DOM only |

## Data model

```json
{ "version": 1, "tasks": [{ "id": "uuid", "title": "string ≤ 120", "done": false, "createdAt": 1700000000000 }] }
```

`deserialise()` treats stored data as hostile: wrong version or corrupt JSON yields `[]`, invalid entries
and duplicate ids are dropped, and only known fields are copied onto new frozen objects.

## Security posture

- Rendering uses `textContent` exclusively; `scripts/check-dom-sinks.mjs` fails CI on HTML-parsing sinks.
- Strict CSP in a `<meta>` tag, mirrored with `frame-ancestors 'none'` as a header by the dev server.
- The dev server binds to `127.0.0.1`, serves an allowlist (`index.html`, `src/`) and rejects traversal.

## Decisions

- **No dependencies.** Keeps supply-chain risk at zero and the agents' job focused.
- **No build step.** Native ES modules; what you read is what runs.
- **Immutable updates.** Makes tests simple and state changes explicit through `commit()`.
