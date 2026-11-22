#!/usr/bin/env node
// Draft release notes from Conventional Commit subjects. Read-only: runs `git` via execFile (no shell).
// Usage: node draft-release-notes.mjs [fromRef]
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SECTIONS = {
  feat: 'Added',
  fix: 'Fixed',
  perf: 'Changed',
  refactor: 'Changed',
  security: 'Security',
  revert: 'Removed',
};
const PATTERN = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<subject>.+)$/;

/** @param {string[]} subjects */
export function groupCommits(subjects) {
  const groups = new Map();
  const skipped = [];
  for (const line of subjects) {
    const m = line.match(PATTERN);
    if (!m) {
      skipped.push(line);
      continue;
    }
    const { type, scope, bang, subject } = m.groups;
    const section = scope === 'security' ? 'Security' : SECTIONS[type];
    if (!section) continue; // docs, test, chore, ci, build, style
    const text = `${bang ? '**BREAKING** ' : ''}${subject}${scope && scope !== 'security' ? ` (${scope})` : ''}`;
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(text);
  }
  return { groups, skipped };
}

export function toMarkdown({ groups, skipped }) {
  const order = ['Added', 'Changed', 'Fixed', 'Security', 'Removed'];
  const out = [];
  for (const section of order) {
    if (!groups.has(section)) continue;
    out.push(`### ${section}`, ...groups.get(section).map((s) => `- ${s}`), '');
  }
  if (skipped.length) {
    out.push('<!-- Non-conventional commits (review manually):', ...skipped.map((s) => `  ${s}`), '-->');
  }
  return out.length ? out.join('\n') : '_No user-visible changes found._';
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function main() {
  let from = process.argv[2];
  try {
    git(['rev-parse', '--is-inside-work-tree']);
  } catch {
    console.error('Not a git repository.');
    process.exit(1);
  }
  if (!from) {
    try {
      from = git(['describe', '--tags', '--abbrev=0']);
    } catch {
      from = null; // no tags yet: use full history
    }
  }
  const range = from ? [`${from}..HEAD`] : [];
  let log = '';
  try {
    log = git(['log', '--no-merges', '--pretty=format:%s', ...range]);
  } catch {
    log = ''; // empty repository
  }
  console.log(`<!-- Commits ${from ? `since ${from}` : 'in full history'} -->`);
  console.log(toMarkdown(groupCommits(log ? log.split('\n') : [])));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
