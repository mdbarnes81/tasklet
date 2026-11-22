# Copilot surface support matrix

What each customisation file does, and which Copilot surface reads it. Compiled from GitHub and VS Code
documentation in November 2026. These features move quickly: re-check the sources before relying on a cell.

Legend: ✔ documented as supported · ✖ documented as unsupported or ignored · ? not documented either way

| File | VS Code agent mode | Copilot CLI | Cloud agent (GitHub.com) | Code review |
| --- | --- | --- | --- | --- |
| `.github/copilot-instructions.md` | ✔ | ✔ | ✔ | ✔ |
| `.github/instructions/*.instructions.md` (`applyTo`) | ✔ | ✔ | ✔ | ✔ |
| `excludeAgent` in instructions | n/a | n/a | ✔ (`cloud-agent`) | ✔ (`code-review`) |
| `AGENTS.md` (root) | ✔ | ✔ | ✔ | ? |
| Nested `AGENTS.md` | ✔ (setting) | ✔ | ✔ | ? |
| `.github/agents/*.agent.md` | ✔ | ✔ | ✔ | n/a |
| Agent `handoffs` | ✔ (Local harness) | ✖ | ✖ ignored | n/a |
| Agent `model` | ✔ | ? | ✖ ignored | n/a |
| Agent `agents:` subagent allowlist | ✔ (Local harness) | ? (`/fleet` instead) | ? | n/a |
| Agent `mcp-servers` | ✖ not used | ? | ✔ | n/a |
| `.github/skills/*/SKILL.md` | ✔ | ✔ | ✔ | n/a |
| `.github/hooks/*.json` | ? (VS Code has its own hooks, `chat.useHooks`) | ✔ | ✔ (subset of events) | n/a |
| `.github/prompts/*.prompt.md` | ✔ (deprecated Local harness, removal Feb 2027) | ? | ✖ | n/a |
| `.github/workflows/copilot-setup-steps.yml` | n/a | n/a | ✔ | n/a |
| `.vscode/mcp.json` | ✔ | ✖ | ✖ | n/a |

## Notes on specific behaviour

- **Hooks under cloud agent** fire for `sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`,
  `postToolUse`, `postToolUseFailure`, `agentStop`, `subagentStart`, `subagentStop`, `errorOccurred` and
  others; `notification` does not fire and `permissionRequest` has no effect. A `preToolUse` decision of
  `"ask"` is treated as `"deny"` because nobody is present to answer. Cloud agent honours `bash` (or `command`)
  and ignores `powershell`. The hooks file must be on the default branch for cloud agent to use it.
- **preToolUse exit codes**: `0` parses stdout as the decision, `2` denies, any other non-zero denies
  (fail-closed), and a timeout lets the call proceed (fail-open).
- **Subagents in VS Code**: custom agents are available as subagents unless they set
  `disable-model-invocation: true`; listing one explicitly in a coordinator's `agents:` overrides that.
  This repo deliberately leaves `release` out of the orchestrator's list as well.
- **`infer`** in agent frontmatter is deprecated in VS Code in favour of `user-invocable` and
  `disable-model-invocation`.

## Sources

- [VS Code: Custom agent file reference](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference)
- [VS Code: Custom agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [VS Code: Subagents](https://code.visualstudio.com/docs/agents/subagents)
- [VS Code: Prompt files](https://code.visualstudio.com/docs/copilot/customization/prompt-files)
- [VS Code: Custom instructions reference](https://code.visualstudio.com/docs/agents/reference/custom-instructions-reference)
- [GitHub: Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [GitHub: Create agent skills](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-skills)
- [GitHub: Hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
- [GitHub: Agent-specific instructions with excludeAgent (changelog)](https://github.blog/changelog/2025-11-12-copilot-code-review-and-coding-agent-now-support-agent-specific-instructions/)
- [GitHub: Copilot CLI custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions)
