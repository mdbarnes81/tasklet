#!/usr/bin/env node
// preToolUse hook for Copilot CLI and Copilot cloud agent.
// Reads the hook payload on stdin and denies shell commands that this repo never wants an agent to run.
//
// Contract (GitHub Copilot hooks reference):
//   input  : { toolName, toolArgs, cwd, ... }   (camelCase event name "preToolUse")
//   output : { "permissionDecision": "deny", "permissionDecisionReason": "..." } on stdout, exit 0
//   no output + exit 0 means "no opinion" and the normal permission flow continues.
//
// Failure policy: if the payload cannot be parsed we exit 0 with no decision (fail-open) and warn on
// stderr, so a hook bug cannot brick every session. Cloud agent still runs with its own sandbox and
// branch protections. Change to fail-closed (exit 2) if your threat model requires it.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DENY_RULES = [
  { pattern: /\bgit\s+push\b/, reason: 'Agents must not push. A human pushes after review.' },
  { pattern: /\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f)/, reason: 'Destructive git operations are not allowed.' },
  { pattern: /\bgit\s+tag\b(?!\s+(-l|--list)\b)/, reason: 'Tagging is a human release step.' },
  { pattern: /\brm\s+-[a-z]*r[a-z]*f?\s+(\/|~|\*|\.\s*$|\.\.)/, reason: 'Recursive delete of root, home or parent paths is blocked.' },
  { pattern: /\b(npm|pnpm|yarn)\s+(publish|unpublish)\b/, reason: 'Publishing packages is not allowed.' },
  { pattern: /\b(npm|pnpm|yarn)\s+(i|install|add)\b(\s+-\S+)*\s+[^\s-]/, reason: 'Tasklet has zero dependencies. Adding one needs maintainer approval.' },
  { pattern: /\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b/, reason: 'Piping remote scripts into a shell is blocked.' },
  { pattern: /\bgh\s+(pr\s+merge|release\s+create|repo\s+delete)\b/, reason: 'Merging, releasing and deleting repos are human actions.' },
  { pattern: /(^|\s)(cat|less|more|head|tail)\s+[^|;]*\.env\b/, reason: 'Reading .env files is blocked to avoid leaking secrets.' },
];

const SHELL_TOOLS = /^(bash|shell|powershell|pwsh|terminal|execute|run_in_terminal|runInTerminal)$/i;

/** Extract a command string from whatever shape toolArgs arrives in. */
export function extractCommand(toolArgs) {
  let args = toolArgs;
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch {
      return args; // already a raw command string
    }
  }
  if (args && typeof args === 'object') {
    return String(args.command ?? args.cmd ?? args.script ?? args.input ?? '');
  }
  return '';
}

/** @returns {{ permissionDecision: 'deny', permissionDecisionReason: string } | null} */
export function decide(payload) {
  const toolName = payload?.toolName ?? payload?.tool_name ?? '';
  if (!SHELL_TOOLS.test(String(toolName))) return null;
  const command = extractCommand(payload.toolArgs ?? payload.tool_input);
  for (const rule of DENY_RULES) {
    if (rule.pattern.test(command)) {
      return { permissionDecision: 'deny', permissionDecisionReason: `Blocked by .github/hooks/guardrails.json: ${rule.reason}` };
    }
  }
  return null;
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  let payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    console.error('[guard-shell] could not parse hook payload; no decision made');
    return;
  }
  const decision = decide(payload);
  if (decision) process.stdout.write(JSON.stringify(decision));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
