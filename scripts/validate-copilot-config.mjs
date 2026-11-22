#!/usr/bin/env node
// Validates the repo's GitHub Copilot customisation files. Dependency-free, so the YAML handling is a
// deliberately small frontmatter reader that understands only the shapes this repo uses.
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const GH = join(ROOT, '.github');
const BUILTIN_AGENTS = new Set(['agent', 'ask', 'plan', 'edit']);
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TOOL_ALIASES = new Set(['read', 'search', 'edit', 'execute', 'agent', 'web', 'todo', '*']);

/** Extract frontmatter and parse top-level scalars, inline arrays and `handoffs[].agent`. */
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const fm = { handoffAgents: [] };
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const top = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (top) {
      const [, key, value] = top;
      fm[key] = parseValue(value);
      continue;
    }
    const handoff = line.match(/^\s+(?:-\s+)?agent:\s*(.+)$/);
    if (handoff) fm.handoffAgents.push(parseValue(handoff[1]));
  }
  return fm;
}

function parseValue(raw) {
  const v = raw.replace(/\s+#.*$/, '').trim();
  if (v === '') return '';
  if (v.startsWith('[')) {
    return v
      .slice(1, -1)
      .split(',')
      .map((s) => unquote(s.trim()))
      .filter(Boolean);
  }
  if (v === 'true' || v === 'false') return v === 'true';
  return unquote(v);
}
const unquote = (s) => s.replace(/^(['"])(.*)\1$/, '$2');

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
async function list(dir, filter) {
  if (!(await exists(dir))) return [];
  return (await readdir(dir, { withFileTypes: true })).filter(filter).map((d) => join(dir, d.name));
}

export async function validate() {
  const errors = [];
  const warn = [];
  const err = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`);

  // ---- Agents ----
  const agentFiles = await list(join(GH, 'agents'), (d) => d.isFile() && d.name.endsWith('.agent.md'));
  const agents = new Map();
  for (const file of agentFiles) {
    const fm = parseFrontmatter(await readFile(file, 'utf8'));
    if (!fm) {
      err(file, 'missing YAML frontmatter');
      continue;
    }
    const stem = basename(file, '.agent.md');
    if (fm.name !== stem) err(file, `name "${fm.name}" must equal file stem "${stem}"`);
    if (!KEBAB.test(stem)) err(file, 'file stem must be lowercase-hyphenated');
    if (!fm.description) err(file, 'description is required');
    if (!Array.isArray(fm.tools)) err(file, 'tools must be an inline array');
    for (const t of fm.tools ?? []) {
      if (!TOOL_ALIASES.has(t) && !t.includes('/')) warn.push(`${relative(ROOT, file)}: unrecognised tool "${t}"`);
    }
    agents.set(stem, { file, fm });
  }
  for (const [name, { file, fm }] of agents) {
    const body = await readFile(file, 'utf8');
    if (!/## Output contract/.test(body)) err(file, 'body must include an "## Output contract" section');
    if (fm.agents) {
      if (!fm.tools?.includes('agent')) err(file, '"agents" requires the "agent" tool');
      for (const a of fm.agents) if (a !== '*' && !agents.has(a)) err(file, `agents: unknown agent "${a}"`);
    } else if (fm.tools?.includes('agent')) {
      warn.push(`${relative(ROOT, file)}: has "agent" tool but no "agents" allowlist`);
    }
    for (const a of fm.handoffAgents) {
      if (!agents.has(a) && !BUILTIN_AGENTS.has(a)) err(file, `handoff to unknown agent "${a}"`);
    }
    const reviewOnly = ['orchestrator', 'planner', 'reviewer', 'security', 'accessibility'];
    if (reviewOnly.includes(name) && fm.tools?.includes('edit')) err(file, 'review-only agent must not have "edit"');
  }

  // ---- Skills ----
  const skillDirs = await list(join(GH, 'skills'), (d) => d.isDirectory());
  for (const dir of skillDirs) {
    const file = join(dir, 'SKILL.md');
    if (!(await exists(file))) {
      err(dir, 'skill directory must contain SKILL.md');
      continue;
    }
    const fm = parseFrontmatter(await readFile(file, 'utf8'));
    const dirName = basename(dir);
    if (!fm) {
      err(file, 'missing YAML frontmatter');
      continue;
    }
    if (fm.name !== dirName) err(file, `name "${fm.name}" must equal directory "${dirName}"`);
    if (!KEBAB.test(dirName)) err(file, 'skill name must be lowercase-hyphenated');
    if (!fm.description) err(file, 'description is required');
    else if (fm.description.length > 1024) err(file, 'description must be 1024 characters or fewer');
    else if (!/^Use when/i.test(fm.description)) warn.push(`${relative(ROOT, file)}: description should start "Use when ..."`);
    // Relative links inside SKILL.md must resolve.
    const body = await readFile(file, 'utf8');
    for (const [, target] of body.matchAll(/\]\(((?!https?:|#|\.\.\/\.\.\/)[^)]+)\)/g)) {
      if (!(await exists(join(dir, target)))) err(file, `broken relative link "${target}"`);
    }
  }

  // ---- Instructions ----
  for (const file of await list(join(GH, 'instructions'), (d) => d.isFile() && d.name.endsWith('.instructions.md'))) {
    const fm = parseFrontmatter(await readFile(file, 'utf8'));
    if (!fm) err(file, 'missing YAML frontmatter');
    else if (!fm.applyTo) err(file, 'applyTo is required');
    if (fm?.excludeAgent && !['code-review', 'cloud-agent', 'coding-agent'].includes(fm.excludeAgent)) {
      err(file, `excludeAgent "${fm.excludeAgent}" is not a known value`);
    }
  }

  // ---- Prompts (legacy) ----
  for (const file of await list(join(GH, 'prompts'), (d) => d.isFile() && d.name.endsWith('.prompt.md'))) {
    const fm = parseFrontmatter(await readFile(file, 'utf8'));
    if (!fm?.description) err(file, 'description is required');
    if (fm?.agent && !agents.has(fm.agent) && !BUILTIN_AGENTS.has(fm.agent)) err(file, `unknown agent "${fm.agent}"`);
  }

  // ---- Hooks ----
  for (const file of await list(join(GH, 'hooks'), (d) => d.isFile() && d.name.endsWith('.json'))) {
    let json;
    try {
      json = JSON.parse(await readFile(file, 'utf8'));
    } catch (e) {
      err(file, `invalid JSON: ${e.message}`);
      continue;
    }
    if (json.version !== 1) err(file, '"version": 1 is required');
    for (const [event, entries] of Object.entries(json.hooks ?? {})) {
      if (!Array.isArray(entries)) err(file, `hooks.${event} must be an array`);
      for (const e of entries ?? []) {
        if (!e.bash && !e.command) err(file, `hooks.${event}: cloud agent needs "bash" or "command"`);
      }
    }
  }

  // ---- Required top-level files ----
  for (const p of ['AGENTS.md', '.github/copilot-instructions.md', '.github/workflows/copilot-setup-steps.yml']) {
    if (!(await exists(join(ROOT, p)))) errors.push(`${p}: missing`);
  }
  const setup = await readFile(join(GH, 'workflows', 'copilot-setup-steps.yml'), 'utf8').catch(() => '');
  if (setup && !/^\s{2}copilot-setup-steps:\s*$/m.test(setup)) {
    errors.push('.github/workflows/copilot-setup-steps.yml: job must be named "copilot-setup-steps"');
  }

  // ---- Roster in AGENTS.md matches agent files ----
  const roster = await readFile(join(ROOT, 'AGENTS.md'), 'utf8');
  for (const name of agents.keys()) {
    if (!roster.includes(`\`${name}\``)) warn.push(`AGENTS.md: roster does not mention agent "${name}"`);
  }

  return { errors, warn, counts: { agents: agents.size, skills: skillDirs.length } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { errors, warn, counts } = await validate();
  for (const w of warn) console.warn(`⚠ ${w}`);
  for (const e of errors) console.error(`✖ ${e}`);
  if (errors.length) process.exit(1);
  console.log(`✔ Copilot config valid (${counts.agents} agents, ${counts.skills} skills).`);
}
