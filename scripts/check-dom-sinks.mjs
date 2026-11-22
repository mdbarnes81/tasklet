#!/usr/bin/env node
// Static guard against DOM XSS sinks and dynamic code execution in src/.
// Used by CI, the security-review skill and the Security agent.
// Suppress a single line only with a justified comment:  // dom-sink-ok: <reason>
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RULES = [
  { id: 'innerHTML', pattern: /\.(inner|outer)HTML\s*[+]?=/, hint: 'Use textContent or createElement.' },
  { id: 'insertAdjacentHTML', pattern: /\.insertAdjacentHTML\s*\(/, hint: 'Use insertAdjacentElement/Text.' },
  { id: 'document.write', pattern: /\bdocument\.write(ln)?\s*\(/, hint: 'Build nodes with the DOM API.' },
  { id: 'eval', pattern: /(^|[^.\w])eval\s*\(/, hint: 'Never evaluate strings as code.' },
  { id: 'new Function', pattern: /\bnew\s+Function\s*\(/, hint: 'Never evaluate strings as code.' },
  { id: 'string timer', pattern: /\bset(Timeout|Interval)\s*\(\s*['"`]/, hint: 'Pass a function, not a string.' },
  { id: 'createContextualFragment', pattern: /createContextualFragment\s*\(/, hint: 'Parses HTML; avoid.' },
  { id: 'javascript: URL', pattern: /['"`]\s*javascript:/i, hint: 'Never build javascript: URLs.' },
];

const SUPPRESS = /\/\/\s*dom-sink-ok:\s*\S+/;

/** @returns {{ line: number, rule: string, hint: string, text: string }[]} */
export function scanSource(source) {
  const findings = [];
  source.split('\n').forEach((text, i) => {
    const code = text.replace(/^\s*\/\/.*$/, ''); // ignore whole-line comments
    if (SUPPRESS.test(text)) return;
    for (const rule of RULES) {
      if (rule.pattern.test(code)) findings.push({ line: i + 1, rule: rule.id, hint: rule.hint, text: text.trim() });
    }
  });
  return findings;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(m?js|html)$/.test(entry.name)) yield p;
  }
}

async function main() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const targets = [join(root, 'src'), join(root, 'index.html')];
  let total = 0;
  for (const target of targets) {
    const files = target.endsWith('.html') ? [target] : walk(target);
    for await (const file of files) {
      for (const f of scanSource(await readFile(file, 'utf8'))) {
        total++;
        console.error(`${relative(root, file)}:${f.line}  [${f.rule}]  ${f.hint}\n    ${f.text}`);
      }
    }
  }
  if (total > 0) {
    console.error(`\n✖ ${total} dangerous sink(s) found.`);
    process.exit(1);
  }
  if (!process.argv.includes('--quiet')) console.log('✔ No dangerous DOM sinks found.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
