#!/usr/bin/env node
// Minimal, dependency-free static accessibility check for a single HTML file.
// Deliberately conservative: it catches mechanical issues only. A manual review is still required.
// Usage: node a11y-static-check.mjs <file.html>
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : null;
};
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);

/** @returns {{ rule: string, message: string }[]} */
export function checkHtml(html) {
  const issues = [];
  const add = (rule, message) => issues.push({ rule, message });

  const htmlTag = tags(html, 'html')[0];
  if (!htmlTag || !attr(htmlTag, 'lang')) add('3.1.1', '<html> must have a lang attribute');

  const title = html.match(/<title>([^<]*)<\/title>/i);
  if (!title || title[1].trim() === '') add('2.4.2', 'Document needs a non-empty <title>');

  if (tags(html, 'main').length !== 1) add('1.3.1', 'Exactly one <main> landmark expected');
  if (tags(html, 'h1').length !== 1) add('1.3.1', 'Exactly one <h1> expected');

  const labelFor = new Set(tags(html, 'label').map((t) => attr(t, 'for')).filter(Boolean));
  for (const input of tags(html, 'input')) {
    const type = (attr(input, 'type') ?? 'text').toLowerCase();
    if (['hidden', 'submit', 'button'].includes(type)) continue;
    const id = attr(input, 'id');
    if (!(id && labelFor.has(id)) && !attr(input, 'aria-label') && !attr(input, 'aria-labelledby')) {
      add('4.1.2', `<input${id ? ` id="${id}"` : ''}> has no associated label`);
    }
  }

  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (!text && !attr(`<b ${m[1]}>`, 'aria-label')) add('4.1.2', 'A <button> has no accessible name');
  }

  for (const img of tags(html, 'img')) {
    if (attr(img, 'alt') === null) add('1.1.1', `<img> without alt: ${img}`);
  }

  if (!/role\s*=\s*["']status["']|aria-live\s*=/i.test(html)) {
    add('4.1.3', 'No live region found for status messages');
  }
  if (/\bstyle\s*=\s*["']/i.test(html)) add('CSP', 'Inline style attribute found (also breaks the CSP)');
  if (/\btabindex\s*=\s*["'][1-9]/i.test(html)) add('2.4.3', 'Positive tabindex disrupts focus order');

  return issues;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: a11y-static-check.mjs <file.html>');
    process.exit(2);
  }
  const issues = checkHtml(await readFile(file, 'utf8'));
  for (const i of issues) console.error(`✖ [WCAG ${i.rule}] ${i.message}`);
  if (issues.length) process.exit(1);
  console.log(`✔ ${file}: no static accessibility issues found (manual review still required).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
