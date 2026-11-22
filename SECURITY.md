# Security policy

## Reporting a vulnerability

Please **do not** open a public issue. Use GitHub's private vulnerability reporting:
**Security → Report a vulnerability** on the repository (replace with your own contact if you fork this).

Include steps to reproduce, affected files and the impact you expect. We aim to acknowledge within five
working days.

## Scope

- XSS or script injection in the app (including via crafted `localStorage` data)
- CSP bypasses
- Path traversal or source disclosure in `scripts/serve.mjs` (development use only, but still in scope)
- Weaknesses in agent customisation that would let repository content steer an agent into unsafe actions
  (prompt injection through issues, comments or files; hook bypasses)
- Workflow misconfiguration (excessive permissions, script injection)

## Supported versions

Only the latest commit on `main`.
