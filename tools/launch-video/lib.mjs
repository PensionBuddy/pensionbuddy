/* Shared plumbing for the launch video: where things live, a static server
   for the repo (and the work directory), and a headless Chromium.

   Intermediates (screenshots, the WAV, review stills) go to the work
   directory, never into the repo: $LV_WORK, or <os tmpdir>/pb-launch-video. */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(join(HERE, '..', '..'));
export const WORK = resolve(process.env.LV_WORK || join(tmpdir(), 'pb-launch-video'));
export const OUT = join(ROOT, 'docs', 'launch-video');
mkdirSync(WORK, { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.json': 'application/json', '.woff2': 'font/woff2', '.wav': 'audio/wav' };

/* The repo at /, the work directory at /__work/. Nothing else. */
export async function serve() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    const base = path.startsWith('/__work/') ? WORK : ROOT;
    const f = resolve(join(base, path.startsWith('/__work/') ? path.slice(8) : path));
    if (!f.startsWith(base) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(readFileSync(f));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, origin: 'http://127.0.0.1:' + server.address().port, close: () => server.close() };
}

/* Playwright, wherever it is installed: a local install, $NODE_PATH, or the
   global npm root. Never downloads a browser. */
export async function playwright() {
  try { return await import('playwright'); } catch {}
  const roots = (process.env.NODE_PATH || '').split(':').filter(Boolean);
  roots.push('/opt/node22/lib/node_modules');
  try { roots.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()); } catch {}
  for (const r of roots) {
    const p = join(r, 'playwright', 'index.mjs');
    if (existsSync(p)) return await import(pathToFileURL(p).href);
  }
  throw new Error('Playwright not found: set NODE_PATH to the folder that holds it');
}

export async function browser() {
  const { chromium } = await playwright();
  const args = ['--force-color-profile=srgb', '--hide-scrollbars', '--mute-audio', '--disable-lcd-text',
    '--font-render-hinting=none', '--disable-background-networking', '--disable-component-update', '--no-default-browser-check',
    '--disable-domain-reliability', '--disable-sync', '--metrics-recording-only'];
  const opts = { headless: true, args };
  if (process.env.CHROME) opts.executablePath = process.env.CHROME;
  return chromium.launch(opts);
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
