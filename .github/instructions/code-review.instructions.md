---
name: 'Code review focus'
description: 'Extra guidance read only by Copilot code review on pull requests'
applyTo: '**'
excludeAgent: 'cloud-agent'
---

# Copilot code review: what to prioritise

Order findings by severity: **Blocking**, **Should fix**, **Nit**. Skip nits if there are blocking issues.

1. **Security**: any new HTML-parsing sink, dynamic code execution, CSP relaxation or unvalidated read
   from storage is Blocking.
2. **Correctness**: mutation of state arrays, missing `preventDefault`, off-by-one at `MAX_TITLE_LENGTH`.
3. **Tests**: behaviour change without a test is Blocking. Weakened or skipped tests are Blocking.
4. **Dependencies**: any change to `package.json` dependencies is Blocking unless the PR links an approved issue.
5. **Accessibility**: new controls without labels, removed focus styles, colour-only state.
6. **Docs**: user-visible change without a `CHANGELOG.md` entry is Should fix.

Do not comment on formatting that `.editorconfig` already governs.
