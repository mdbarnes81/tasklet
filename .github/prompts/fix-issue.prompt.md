---
name: fix-issue
description: 'Reproduce, root-cause and fix a bug with a regression test'
argument-hint: 'Paste the error, failing test or issue text'
agent: debugger
---

Fix this bug in Tasklet. Follow your method exactly: reproduce, hypothesise, isolate, regression test, fix, verify.

${input:bug:Paste the error message, failing test name or bug report}

If the active file is relevant, start there: ${file}
