---
name: security-audit
description: 'Full security audit of the repository using the security agent and checklist'
agent: security
---

Run a full security audit of the whole repository, not just the current diff.

1. Run the automated scans from the `security-review` skill.
2. Work through every section (A to H) of `.github/skills/security-review/references/checklist.md`.
3. Report using your output contract. For each checklist section write ✔, ✖ (with finding) or N/A.
