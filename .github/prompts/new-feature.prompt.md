---
name: new-feature
description: 'Deliver a feature end to end through the orchestrator and its specialist agents'
argument-hint: 'Describe the feature'
agent: orchestrator
---

Deliver this feature for Tasklet using the full workflow in your instructions
(plan, tests first, implement, review, security, accessibility if UI, docs):

${input:feature:Describe the feature, e.g. "let users edit a task title by double-clicking it"}

Constraints: no new dependencies, keep the CSP unchanged, and stop to ask me before crossing any
**Ask first** boundary in AGENTS.md.
