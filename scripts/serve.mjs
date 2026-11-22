#!/usr/bin/env node
// Dependency-free static server for local development only.
// Binds to 127.0.0.1, refuses path traversal and sends the security headers a real host should send.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT ?? 5173);
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

// Only these top-level paths are served; .git, .github, scripts, tests etc. are never exposed.
const ALLOWED = [join(ROOT, 'index.html'), join(ROOT, 'src') + sep];

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function resolveSafePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const rel = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const full = resolve(ROOT, normalize(rel));
  const allowed = ALLOWED.some((p) => (p.endsWith(sep) ? full.startsWith(p) : full === p));
  return allowed ? full : null;
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': type });
  res.end(body);
}

async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed');
  const file = resolveSafePath(req.url ?? '/');
  if (!file) return send(res, 404, 'Not Found');
  try {
    if (!(await stat(file)).isFile()) return send(res, 404, 'Not Found');
    const body = await readFile(file);
    send(res, 200, req.method === 'HEAD' ? '' : body, MIME[extname(file)] ?? 'application/octet-stream');
  } catch {
    send(res, 404, 'Not Found');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer(handler).listen(PORT, HOST, () => {
    console.log(`Tasklet running at http://${HOST}:${PORT}/`);
  });
}
