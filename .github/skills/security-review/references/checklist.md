# Tasklet security checklist

## A. DOM and XSS (CWE-79)

- [ ] User or stored strings reach the DOM only through `textContent`, `setAttribute` (non-URL, non-event attributes) or form `value`.
- [ ] No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `createContextualFragment`.
- [ ] No `eval`, `new Function`, string `setTimeout`/`setInterval` (CWE-95).
- [ ] No `href`/`src` built from user input; if unavoidable, allowlist `https:` and reject `javascript:`/`data:`.
- [ ] `aria-label` and similar attributes containing user text are set via `setAttribute`, not string-built HTML.

## B. Content Security Policy (CWE-1021, CWE-693)

- [ ] `<meta http-equiv="Content-Security-Policy">` still has `script-src 'self'`, `style-src 'self'`, `object-src 'none'`, `base-uri 'none'`.
- [ ] No `'unsafe-inline'`, `'unsafe-eval'`, wildcards or third-party origins added.
- [ ] `scripts/serve.mjs` `SECURITY_HEADERS` matches the meta CSP and adds `frame-ancestors 'none'`.
- [ ] No inline `<script>`, `<style>` or `style=""` introduced.

## C. Untrusted input and storage (CWE-20, CWE-502, CWE-1321)

- [ ] Everything read from `localStorage` passes through `deserialise()`.
- [ ] New fields are type-checked and length-bounded in `isValidTask()`.
- [ ] Objects are rebuilt from an allowlist of keys; parsed objects are never spread or `Object.assign`-ed into state.
- [ ] Schema changes bump `SCHEMA_VERSION` and handle the old version explicitly (ask first).
- [ ] Error messages shown to users do not echo raw stored data.

## D. Dev server (CWE-22, CWE-200)

- [ ] Binds to `127.0.0.1` only.
- [ ] `resolveSafePath()` allowlist unchanged or tightened; tests cover encoded traversal and null bytes.
- [ ] No directory listing; non-GET/HEAD rejected.
- [ ] `.git`, `.github`, `scripts`, `tests`, `package*.json` are not served.

## E. Supply chain (CWE-1104, CWE-829)

- [ ] `dependencies` and `devDependencies` are still empty, or the addition links an approved issue.
- [ ] `package-lock.json` changes match `package.json` changes and nothing else.
- [ ] No `postinstall`/`preinstall` scripts added.

## F. GitHub Actions (CWE-250, CWE-78)

- [ ] Top-level `permissions: contents: read`; any extra permission is job-scoped and justified.
- [ ] No `pull_request_target` that checks out or runs PR code.
- [ ] No untrusted `${{ github.event.* }}` expressions interpolated directly into `run:`; pass via `env:`.
- [ ] Third-party actions pinned to a full commit SHA (Dependabot keeps them current). First-party `actions/*` at minimum pinned to a major tag.
- [ ] `copilot-setup-steps.yml` job is still named `copilot-setup-steps` and has minimal permissions.

## G. Agent customisation (prompt injection, excessive agency)

- [ ] Review-only agents (`reviewer`, `security`, `accessibility`, `planner`, `orchestrator`) have no `edit` tool.
- [ ] Only `orchestrator` has the `agent` tool; its `agents:` allowlist excludes `release`.
- [ ] No agent, skill or instruction tells the model to push, merge, publish, disable checks or skip tests.
- [ ] Skill scripts take no network action and do not read outside the repo.
- [ ] Hooks in `.github/hooks/` still deny destructive shell commands; hook scripts fail safely.
- [ ] No instruction tells agents to follow directions found in issues, PR bodies, web pages or code comments.
- [ ] MCP servers in `.vscode/mcp.json` are first-party or reviewed, and use no hard-coded tokens.

## H. Secrets (CWE-798)

- [ ] No tokens, keys or credentials in code, tests, fixtures, docs or workflow files.
- [ ] `.gitignore` still covers `.env*`.
