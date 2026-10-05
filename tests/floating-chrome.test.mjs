#!/usr/bin/env node
/* Floating chrome gives way, on real frames (Run 32, part 3b of
   docs/UX-MOTION-AUDIT.md; kept after the pre-merge review found no test
   that would notice Ask Buddy back on a warning box).

       node tests/floating-chrome.test.mjs            # the working tree
       node tests/floating-chrome.test.mjs <root>     # any checkout

   One headless Chrome, driven over the DevTools protocol (Node 24: global
   fetch and WebSocket, no packages). A device-metrics override gives a true
   375px phone (a headless window cannot be narrower than about 500px), and
   focus emulation treats the page as focused, so IntersectionObserver fires
   on real frames and focus() fires focusin, as for a reader. Reduced motion
   is on, so every move lands at once and each stop is read at rest; the
   positions and the timing rules are the same with motion. The pages come
   from a small server here, with the analytics choice already answered ("No
   thanks", stored before any script runs) and the Google Fonts links left
   out, so no third party is reached.

   What it proves:
     1. at every scroll stop, 80% of a screen apart, on the home page, the
        pension and director calculators (where, since Run 45, the booking bar
        shows too), director, starter and booking at 375, and the home page
        and the pension calculator at 1440: no caveat
        (PBMotion.CAVEATS, pagebuild's list) and no form field lies under
        Ask Buddy's button, no caveat under the booking bar, no warning box
        under the results bar; and nothing scrolls sideways
     2. focusing every control in order (the tab walk), on the director
        rules, booking and the home page at 375: none lies under the button
        or a bar
     3. a click on page text, which focuses <main tabindex="-1">, does not
        send Ask Buddy away while nothing lies under it
     4. focus in the booking bar while it has stepped down for a caveat
        brings it back at once
     5. the results bar steps down while a warning box is behind it (the
        box pinned into its band: on the calculators no scroll position puts
        one there), and focus in it brings it back at once
   and, on every page in 1, that each layer under test was on screen at
   some stop, so no check passes because its layer never appeared.
   Not in tests/run-tests.py: about three minutes. Exit 0 or 1. */
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

/* ---- the server ---------------------------------------------------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  const f = join(ROOT, path === '/' ? 'index.html' : path);
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  let body = readFileSync(f);
  if (extname(f) === '.html') {
    body = Buffer.from(body.toString('utf8').split('\n')
      .filter(l => !l.includes('fonts.googleapis.com') && !l.includes('fonts.gstatic.com')).join('\n'));
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(body);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

/* ---- Chrome ---------------------------------------------------------- */
const prof = mkdtempSync(join(tmpdir(), 'pb-fc-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + prof,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--disable-extensions',
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill('SIGKILL'); } catch {} try { rmSync(prof, { recursive: true, force: true }); } catch {} };
process.on('exit', cleanup);
setTimeout(() => { console.log('  FAIL timed out'); process.exit(1); }, 420000).unref();
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
let seq = 0; const pending = new Map(); const waiters = [];
ws.onmessage = m => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(JSON.stringify(d.error))) : p.res(d.result); }
  else if (d.method) for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === d.method) { waiters[i].res(d.params); waiters.splice(i, 1); }
};
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method, ms) => new Promise(res => { waiters.push({ method, res }); setTimeout(() => res(null), ms); });
const ev = async (expr, awaitPromise = false) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('pb-consent','rejected')}catch(e){}" });

async function open(page, w) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 700 ? 812 : 900, deviceScaleFactor: 1, mobile: w < 700 });
  const loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: ORIGIN + '/' + page });
  await loaded;
  await ev('document.fonts ? document.fonts.ready.then(() => 1) : 1', true);
  /* Ask Buddy starts after the first frame (type="text/pb-late") */
  await ev("new Promise(r => { let n = 0; (function t() { if (document.getElementById('pbBuddyBtn') || ++n > 60) r(1); else setTimeout(t, 50); })(); })", true);
  await sleep(500);
}

/* the geometry, read in the page: what of the page lies under each layer */
const PROBE = `(() => {
  const CAV = PBMotion.CAVEATS, FIELDS = 'input:not([type=hidden]),select,textarea';
  const CH = '.pb-bookbar,.pb-peek,.pb-consent,#pbBuddyPanel,#pbBuddyBtn';
  const shown = e => { if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility !== 'visible') return null;
    const r = e.getBoundingClientRect(); return r.width && r.height && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? r : null; };
  const name = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : ''));
  const out = [];
  [['Ask Buddy', document.getElementById('pbBuddyBtn'), CAV + ',' + FIELDS],
   ['the booking bar', document.querySelector('.pb-bookbar.pb-bookbar-on'), CAV],
   ['the results bar', document.querySelector('.pb-peek.pb-peek-on'), '.pb-warn']].forEach(([layer, el, sel]) => {
    const L = shown(el); if (!L) return;
    document.querySelectorAll(sel).forEach(c => {
      if (c.closest(CH)) return;
      const r = shown(c); if (!r) return;
      const w = Math.min(r.right, L.right) - Math.max(r.left, L.left), h = Math.min(r.bottom, L.bottom) - Math.max(r.top, L.top);
      if (w > 1 && h > 1) out.push(layer + ' on ' + name(c) + ' ' + Math.round(w * h / (r.width * r.height) * 100) + '%');
    });
  });
  return { y: Math.round(scrollY), covered: out, sideways: document.documentElement.scrollWidth > innerWidth,
    seen: { buddy: !!shown(document.getElementById('pbBuddyBtn')), book: !!shown(document.querySelector('.pb-bookbar.pb-bookbar-on')),
            peek: !!shown(document.querySelector('.pb-peek.pb-peek-on')) } };
})()`;

/* 1 */
/* and each layer the page has was on screen at some stop, so no check passes
   because its layer never appeared: [page, width, the layers it must show] */
const COVER = [['index.html', 375, ['buddy', 'book']], ['pension-calculator.html', 375, ['buddy', 'peek', 'book']],
  ['director-calculator.html', 375, ['buddy', 'peek', 'book']], ['director.html', 375, ['buddy', 'book']],
  ['starter.html', 375, ['buddy', 'book']], ['booking.html', 375, ['buddy']], ['index.html', 1440, ['buddy']],
  ['pension-calculator.html', 1440, ['buddy']]];
for (const [page, w, layers] of COVER) {
  await open(page, w);
  const H = await ev('innerHeight'), max = await ev('document.documentElement.scrollHeight - innerHeight');
  const bad = [], sideways = [], seen = {};
  let stops = 0;
  for (let y = 0; ; y = Math.min(max, y + Math.round(H * 0.8))) {
    await ev(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
    await sleep(800);
    const r = await ev(PROBE);
    stops++;
    r.covered.forEach(c => bad.push('at ' + r.y + ': ' + c));
    if (r.sideways) sideways.push(r.y);
    for (const k in r.seen) if (r.seen[k]) seen[k] = true;
    if (y >= max) break;
  }
  eq(`1. ${page} at ${w}px: the floating chrome under test was on screen (${layers.join(', ')})`, layers.filter(k => !seen[k]), []);
  eq(`1. ${page} at ${w}px: nothing a reader needs under the floating chrome, at ${stops} stops`, bad, []);
  eq(`1. ${page} at ${w}px: nothing scrolls sideways`, sideways, []);
}

/* 2 */
const WALK = `(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const CH = '.pb-bookbar,.pb-peek,.pb-consent,#pbBuddyPanel,#pbBuddyBtn';
  const shown = e => { if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility !== 'visible') return null;
    const r = e.getBoundingClientRect(); return r.width && r.height && r.bottom > 0 && r.top < innerHeight ? r : null; };
  const all = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])')]
    .filter(e => !e.closest(CH) && !e.disabled && e.getClientRects().length && getComputedStyle(e).visibility === 'visible');
  const bad = []; let n = 0;
  for (const el of all) {
    el.focus({ focusVisible: true });
    if (document.activeElement !== el) continue;
    n++;
    await sleep(150);
    const r = el.getBoundingClientRect();
    for (const [layer, L] of [['Ask Buddy', shown(document.getElementById('pbBuddyBtn'))],
        ['the booking bar', shown(document.querySelector('.pb-bookbar.pb-bookbar-on'))], ['the results bar', shown(document.querySelector('.pb-peek.pb-peek-on'))]]) {
      if (!L) continue;
      const w = Math.min(r.right, L.right) - Math.max(r.left, L.left), h = Math.min(r.bottom, L.bottom) - Math.max(r.top, L.top);
      if (w > 1 && h > 1) bad.push(layer + ' on ' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' "' + (el.textContent || el.value || '').trim().slice(0, 30) + '"');
    }
  }
  return { n, bad };
})()`;
for (const page of ['director-pension-rules.html', 'booking.html', 'index.html']) {
  await open(page, 375);
  const r = await ev(WALK, true);
  eq(`2. ${page} at 375px: no control, focused in order (${r.n}), lies under the floating chrome`, r.bad, []);
}

/* 3 and 4, on the home page at 375 */
await open('index.html', 375);
/* 3: a stop where nothing lies under Ask Buddy's corner, and a paragraph clear of it */
const spot = await ev(`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const b = document.getElementById('pbBuddyBtn');
  for (let y = 900; y < document.documentElement.scrollHeight - innerHeight; y += 150) {
    scrollTo({ top: y, behavior: 'instant' }); await sleep(900);
    if (b.classList.contains('pb-b-aside')) continue;
    const br = b.getBoundingClientRect();
    const p = [...document.querySelectorAll('main p')].find(e => { const r = e.getBoundingClientRect();
      return r.top > 120 && r.bottom < br.top - 20 && r.height > 20 && !e.closest('a,button,label,summary,[tabindex]:not(main)'); });
    if (p) { const r = p.getBoundingClientRect(); return { y, x: Math.round(r.left + 12), cy: Math.round(r.top + r.height / 2) }; }
  }
  return null;
})()`, true);
eq('3. the home page at 375px: a stop with nothing under Ask Buddy and a paragraph to click was found', !!spot, true);
if (spot) {
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: spot.x, y: spot.cy, button: 'left', clickCount: 1 });
  await sleep(1200);
  const r = await ev(`({ focus: document.activeElement && (document.activeElement.id || document.activeElement.tagName), aside: document.getElementById('pbBuddyBtn').classList.contains('pb-b-aside') })`);
  eq('3. a click on page text focuses <main> (the case under test)', r.focus, 'main');
  eq('3. and Ask Buddy stays in its corner', r.aside, false);
}
/* 4: the booking bar stepped down for the deadline band's caveat, then focused */
const bar = await ev(`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const c = document.querySelector('.tk-who'), R = document.documentElement.classList;
  if (!c) return { found: 'no .tk-who' };
  scrollTo({ top: Math.round(c.getBoundingClientRect().top + scrollY - innerHeight + 40), behavior: 'instant' });
  await sleep(900);
  const before = { on: R.contains('pb-bookbar-on'), yielded: R.contains('pb-bookbar-yield') };
  const a = document.querySelector('.pb-bookbar a');
  if (!a) return { before, found: 'no bar link' };
  a.focus({ focusVisible: true });
  await sleep(60);
  return { before, focused: document.activeElement === a, yieldedAfter: R.contains('pb-bookbar-yield') };
})()`, true);
eq('4. the booking bar, up, has stepped down for the deadline band\'s caveat (the case under test)', bar.before, { on: true, yielded: true });
eq('4. focus in it brings it back at once', [bar.focused, bar.yieldedAfter], [true, false]);

/* 5: the results bar steps down while a warning box is behind it, and focus
   brings it back at once. On the calculators the bar shows only while their
   headline figures are off screen, and their warning box sits below those, so
   no scroll position puts the box behind the bar: the box is pinned into the
   bar's band here instead, which is what the bar's observer sees */
await open('pension-calculator.html', 375);
const peek = await ev(`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const R = document.documentElement.classList, bar = document.querySelector('.pb-peek'), warn = document.querySelector('.pb-warn');
  if (!bar || !warn) return { found: false };
  let on = false;
  for (let y = 0; y < document.documentElement.scrollHeight && !on; y += 120) {
    scrollTo({ top: y, behavior: 'instant' }); await sleep(250); on = R.contains('pb-peek-on');
  }
  if (!on) return { found: false };
  warn.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:1';
  await sleep(700);
  const stepped = R.contains('pb-peek-yield');
  bar.focus({ focusVisible: true });
  await sleep(60);
  const back = !R.contains('pb-peek-yield'), focused = document.activeElement === bar;
  bar.blur(); warn.style.cssText = ''; await sleep(900);
  return { found: true, stepped, focused, back, afterwards: R.contains('pb-peek-yield') };
})()`, true);
eq('5. the pension calculator at 375px: the results bar, up, steps down for a warning box behind it', [peek.found, peek.stepped], [true, true]);
eq('5. focus in it brings it back at once', [peek.focused, peek.back], [true, true]);
eq('5. and with the box gone and focus out, it stays up', peek.afterwards, false);

server.close();
console.log('\n%s  %d passed, %d failed', failed ? 'FAILURES' : 'ALL PASS', passed, failed);
cleanup();
process.exit(failed ? 1 : 0);
