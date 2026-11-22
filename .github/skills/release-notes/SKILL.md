---
name: release-notes
description: 'Use when preparing a release, writing release notes, updating CHANGELOG.md or choosing a SemVer bump. Drafts notes from Conventional Commit messages since the last tag and maps them to Keep a Changelog sections.'
license: MIT
---

# Release notes skill

## Draft from git history

```bash
node .github/skills/release-notes/scripts/draft-release-notes.mjs          # since latest tag
node .github/skills/release-notes/scripts/draft-release-notes.mjs v0.1.0   # since a given ref
```

The script groups Conventional Commit subjects and prints Markdown. It never writes files and never runs
anything other than read-only `git` commands. Use its output to **cross-check** `CHANGELOG.md`: every
user-visible commit should have a changelog line, and every changelog line should trace to a commit.

## Commit type → changelog section

| Commit type | Section | Bump (≥ 1.0) |
| --- | --- | --- |
| `feat` | Added | minor |
| `fix` | Fixed | patch |
| `perf`, `refactor` (user-visible) | Changed | patch |
| `security` or `fix(security)` | Security | patch |
| `revert` | Removed / Changed | depends |
| any with `!` or `BREAKING CHANGE:` | Changed (prefix **BREAKING**) | major |
| `docs`, `test`, `chore`, `ci`, `build`, `style` | omit unless user-visible | none |

Before 1.0.0, breaking changes bump **minor**, not major.

## Writing good entries

- Write for users, not developers: "Tasks can now be filtered by status", not "add filterTasks()".
- One line per change, present tense, no trailing full stop.
- Link the PR or issue when there is one: `([#12](../../pull/12))`.

See [`templates/release-body.md`](templates/release-body.md) for the GitHub release body layout.
