#!/usr/bin/env node
/* Search the site (Run 37, item 3), on real frames.

       node tests/search.test.mjs            # the working tree
       node tests/search.test.mjs <root>     # any checkout

   One headless Chrome over the DevTools protocol (Node 24, no packages), the
   pages from a small server here, the analytics choice already answered.

   What it proves:
     1. the nav still fits with the button in it: from 1301px (the row) to
        1920px, and at 1440px with the deadline chip, nothing in the row runs
        past the header's edge and the button is on screen; on a phone (320,
        375) and in the drawer range (1024) it sits beside the menu button,
        and nothing scrolls sideways
     2. the index is not fetched when a page loads, only when the search opens
     3. the button opens the search with focus in the field; a word brings
        results, the jargon buster's entry first for its own initialism; Down
        steps into the list and Up back to the field; Enter follows the first
        result; Escape closes it and focus goes back to the button
     4. "/" opens it from the page, and does nothing while a text field has
        focus
     5. once the index is here, it works with the network gone, and nothing
        in any search goes to another site
     6. without JavaScript the button is not drawn, and the menu is still
        there
   Not in tests/run-tests.py: about a minute. Exit 0 or 1. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.argv[2] || join(HERE, '..'));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let passed = 0, failed = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else failed++;
  console.log('  %s %s', ok ? 'ok  ' : 'FAIL', label);
  if (!ok) console.log('         expected %s\n         actual   %s', JSON.stringify(want), JSON.stringify(got).slice(0, 900));
};

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  const f = join(ROOT, path === '/' ? 'index.html' : path);
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

const prof = mkdtempSync(join(tmpdir(), 'pb-search-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + prof,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--disable-extensions',
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill('SIGKILL'); } catch {} try { rmSync(prof, { recursive: true, force: true }); } catch {} };
process.on('exit', cleanup);
setTimeout(() => { console.log('  FAIL timed out'); process.exit(1); }, 300000).unref();
let port;
for (let i = 0; i < 150 && !port; i++) {
  await sleep(100);
  const f = join(prof, 'DevToolsActivePort');
  if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0].trim();
}
if (!port) { console.log('  FAIL no DevTools port from Chrome'); process.exit(1); }
const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map(); const waiters = []; const requests = [];
ws.onmessage = m => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(JSON.stringify(d.error))) : p.res(d.result); }
  else if (d.method) {
    if (d.method === 'Network.requestWillBeSent') requests.push(d.params.request.url);
    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === d.method) { waiters[i].res(d.params); waiters.splice(i, 1); }
  }
};
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method, ms) => new Promise(res => { waiters.push({ method, res }); setTimeout(() => res(null), ms); });
const ev = async (expr, awaitPromise = false) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('pb-consent','rejected')}catch(e){}" });

async function open(page, w, h, nojs) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h || (w < 700 ? 812 : 900), deviceScaleFactor: 1, mobile: w < 700 });
  requests.length = 0;
  const loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: ORIGIN + '/' + page });
  await loaded;
  if (nojs) { await sleep(400); return; }   /* no timers run without script: nothing to wait for */
  await ev('document.fonts ? document.fonts.ready.then(() => 1) : 1', true);
  await ev(`new Promise(r => { let n = 0; (function t() { if (window.PBSearchReady || ++n > 80) r(1); else setTimeout(t, 50); })(); })`, true);
  await sleep(250);
}
async function key(k, code, vk, text) {
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk }, text ? { text } : {}));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
}
async function type(s) { for (const ch of s) await key(ch, 'Key' + ch.toUpperCase(), ch.toUpperCase().charCodeAt(0), ch); }
async function click(sel) {
  const c = await ev(`(function(){var e=document.querySelector(${JSON.stringify(sel)});var r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: c.x, y: c.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: c.x, y: c.y, button: 'left', clickCount: 1 });
}
const STATE = `(function(){var d=document.getElementById('pbSearch');var a=document.activeElement;
  return {open:!!(d&&d.open),focus:a.id||a.className||a.tagName,n:d?d.querySelectorAll('.pb-search-list li').length:0,
    first:d&&d.querySelector('.pb-search-list a')?d.querySelector('.pb-search-list a .pb-sr-t').textContent:null,
    count:d?d.querySelector('.pb-search-count').textContent:null};})()`;

/* ---- 1. the nav still fits ---- */
const FIT = `(function(){var n=document.querySelector('#nav .nav-in');var r=n.getBoundingClientRect();var s=document.getElementById('navSearch').getBoundingClientRect();
  var kids=[].slice.call(n.children).filter(function(e){var q=e.getBoundingClientRect();return q.width&&q.height;});
  var over=kids.filter(function(e){var q=e.getBoundingClientRect();return q.right>r.right+0.5||q.left<r.left-0.5;}).map(function(e){return e.id||e.className;});
  var inner=[].slice.call(document.querySelectorAll('#navLinks > a, #navLinks .nav-dd-btn, #navLinks .btn')).filter(function(e){return e.getBoundingClientRect().width;}).filter(function(e){var q=e.getBoundingClientRect();return q.right>r.right+0.5;}).length;
  var btn=getComputedStyle(document.getElementById('navSearch')).display;
  return {over:over,inner:inner,shown:btn!=='none'&&s.width>0&&s.left>=0&&s.right<=innerWidth,wide:document.documentElement.scrollWidth<=innerWidth,oneRow:Math.round(s.height)<=48};})()`;
for (const w of [1301, 1366, 1439, 1440, 1600, 1920, 1024, 375, 320]) {
  await open('index.html', w);
  eq(`1. the nav at ${w}: nothing past the edge, the button on screen, nothing sideways`, await ev(FIT), { over: [], inner: 0, shown: true, wide: true, oneRow: true });
}
await open('pension-calculator.html', 1301);
eq('1. the nav at 1301 on a calculator (its own item marked current)', await ev(FIT), { over: [], inner: 0, shown: true, wide: true, oneRow: true });

/* ---- 2. not fetched at load ---- */
await open('pensions-over-50.html', 1440);
eq('2. the index is not fetched when a page loads', requests.filter(u => /pb-search-index\.js/.test(u)).length, 0);

/* ---- 3. the button, the field, the list, the keys ---- */
await click('#navSearch'); await sleep(300);
eq('3. the button opens the search, focus in the field', (await ev(STATE)).open && (await ev(STATE)).focus, 'pbSearchQ');
eq('2. and only then is the index fetched', requests.filter(u => /pb-search-index\.js/.test(u)).length, 1);
await type('prsa'); await sleep(300);
let s = await ev(STATE);
eq('3. "prsa": results, the jargon buster\'s entry first, the count said', [s.n > 1, s.first, /results?$/.test(s.count)], [true, 'Personal Retirement Savings Account (PRSA)', true]);
await key('ArrowDown', 'ArrowDown', 40); await sleep(100);
const down = await ev(`document.activeElement.classList.contains('pb-sr') && document.activeElement === document.querySelector('.pb-search-list a')`);
await key('ArrowDown', 'ArrowDown', 40); await sleep(50);
const second = await ev(`document.activeElement === document.querySelectorAll('.pb-search-list a')[1]`);
await key('ArrowUp', 'ArrowUp', 38); await key('ArrowUp', 'ArrowUp', 38); await sleep(100);
eq('3. Down steps into the list, Down again to the next, Up twice back to the field', [down, second, (await ev(STATE)).focus], [true, true, 'pbSearchQ']);
await key('Escape', 'Escape', 27); await sleep(200);
s = await ev(STATE);
eq('3. Escape closes it and focus goes back to the button', [s.open, s.focus], [false, 'navSearch']);
await click('#navSearch'); await sleep(200);
await ev(`(function(){var i=document.getElementById('pbSearchQ');i.value='';i.dispatchEvent(new Event('input'));})()`);
await type('annuity'); await sleep(300);
const firstHref = await ev(`document.querySelector('.pb-search-list a').getAttribute('href')`);
const landed = once('Page.loadEventFired', 10000);
await key('Enter', 'Enter', 13, '\r');
await landed; await sleep(200);
eq('3. Enter follows the first result', [firstHref, await ev('location.pathname + location.hash')], ['glossary.html#annuity', '/glossary.html#annuity']);

/* ---- 4. the "/" key ---- */
await open('pension-calculator.html', 1440);
await ev(`document.body.focus()`);
await key('/', 'Slash', 191, '/'); await sleep(250);
eq('4. "/" opens it', (await ev(STATE)).open, true);
await key('Escape', 'Escape', 27); await sleep(150);
await ev(`document.getElementById('ecEmail').focus()`);
await key('/', 'Slash', 191, '/'); await sleep(250);
eq('4. "/" in a text field types a slash and opens nothing', [(await ev(STATE)).open, await ev(`document.getElementById('ecEmail').value`)], [false, '/']);

/* ---- 5. offline, and nothing to another site ---- */
await open('index.html', 375);
await click('#navSearch'); await sleep(400);
await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await type('over 50'); await sleep(300);
s = await ev(STATE);
eq('5. with the network gone, it still finds the over-50s guide', [s.n > 0, await ev(`[].some.call(document.querySelectorAll('.pb-search-list a'),function(a){return a.getAttribute('href').indexOf('pensions-over-50.html')===0;})`)], [true, true]);
await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
eq('5. nothing in any search went to another site', requests.filter(u => !u.startsWith(ORIGIN) && !u.startsWith('data:')), []);

/* ---- 6. without JavaScript ---- */
await send('Emulation.setScriptExecutionDisabled', { value: true });
await open('index.html', 1440, 900, true);
eq('6. without JavaScript: no button, the menu still there', await ev(`[getComputedStyle(document.getElementById('navSearch')).display, getComputedStyle(document.getElementById('navLinks')).display]`), ['none', 'flex']);
await send('Emulation.setScriptExecutionDisabled', { value: false });

console.log(failed ? `FAILURES  ${passed} passed, ${failed} failed` : `ALL PASS  ${passed} passed, 0 failed`);
cleanup();
process.exit(failed ? 1 : 0);
