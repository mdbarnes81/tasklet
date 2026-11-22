---
name: my-agent
description: 'Use when <trigger>. <What it does in one sentence>. <Read-only | May edit X>.'
argument-hint: '<what the user should pass>'
tools: ['read', 'search']
# agents: []            # only for coordinators; requires the 'agent' tool
# model: ['<preferred model>', '<fallback model>']
# disable-model-invocation: true   # human-invoked only
# user-invocable: false            # subagent-only, hidden from the picker
handoffs:
  - label: '<Next step button text>'
    agent: reviewer
    prompt: '<Pre-filled prompt for the next agent>'
    send: false
---

# <Agent title>

<One paragraph: role, what it owns, what it must never do.>

## Scope

- **May edit:** <paths, or "nothing">
- **Must not edit:** <paths>

## Method

1. <Step>
2. <Step>

## Output contract

```text
STATUS:   done | blocked
SUMMARY:  <...>
```
