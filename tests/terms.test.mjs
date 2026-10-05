#!/usr/bin/env node
/* Jargon definitions at first use (Run 37, item 2), on real frames.

       node tests/terms.test.mjs            # the working tree
       node tests/terms.test.mjs <root>     # any checkout

   One headless Chrome over the DevTools protocol (Node 24, no packages), the
   pages from a small server here, the analytics choice already answered.

   What it proves:
     1. on every page that loads assets/js/pb-terms.js, at 375: the page's
        words are exactly what they were without it (main's text, compared
        with a load where the glossary data is blocked), no definition sits in
        a heading, a link, a calculator, the FAQ, the family's story, the
        hero's chat or a caveat, no term is marked twice, none on a page whose
        heading names it, and marking the terms moves nothing (no layout
        shift after it starts)
     2. on the over-50s guide at 375 and 1440, and the threshold page at
        1440: a press opens the definition, the
        glossary's own words and a link to the entry, inside the screen with
        16px to spare, and moves nothing; Escape closes it and gives focus
        back; Enter opens it, Tab reaches the link, Tab again closes it; a
        press elsewhere closes it; at 1440 the pointer resting on a term opens
        it and leaving closes it; scrolling the term away closes it
     3. pages that do not load it (the jargon buster itself, the legal pages,
        booking) mark nothing
   Not in tests/run-tests.py: about a minute. Exit 0 or 1. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, rmSync, statSync, readdirSync } from 'node:fs';
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

const prof = mkdtempSync(join(tmpdir(), 'pb-terms-'));
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
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('pb-consent','rejected')}catch(e){}
  window.__shifts=[];try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.hadRecentInput)return;var nav=(e.sources||[]).every(function(s){return s.node&&s.node.closest&&s.node.closest('#nav');});window.__shifts.push({v:e.value,t:e.startTime,nav:nav});});}).observe({type:'layout-shift',buffered:true});}catch(e){}` });

async function open(page, w, block) {
  await send('Network.setBlockedURLs', { urls: block ? ['*pb-glossary.js*'] : [] });
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 700 ? 812 : 900, deviceScaleFactor: 1, mobile: w < 700 });
  const loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: ORIGIN + '/' + page });
  await loaded;
  await ev('document.fonts ? document.fonts.ready.then(() => 1) : 1', true);
  /* the two late scripts start after the first frame; Ask Buddy's copy of
     the FAQ too */
  await ev(`new Promise(r => { let n = 0; (function t() { if ((${block ? 'true' : 'window.PBGlossary && window.PBTermsBoot'} && document.getElementById('pbBuddyBtn')) || ++n > 80) r(1); else setTimeout(t, 50); })(); })`, true);
  await sleep(300);
}

/* the button after a result says one of two wordings, picked per page view
   before the cookie choice (Run 45, assets/js/pb-cta.js): its words are left out */
const MAIN_TEXT = `(function(){var m=document.getElementById('main').cloneNode(true);[].forEach.call(m.querySelectorAll('.pb-term-pop'),function(p){p.remove();});[].forEach.call(m.querySelectorAll('.pb-ab-t'),function(t){t.textContent='';});return m.textContent.replace(/\\s+/g,' ');})()`;

const GLOSSARY = (() => { const s = readFileSync(join(ROOT, 'assets/js/pb-glossary.js'), 'utf8'); return JSON.parse(s.slice(s.indexOf('= ') + 2, s.indexOf(';\n'))); })();

/* the pages that load it, from the pages themselves */
const pages = readdirSync(ROOT).filter(f => f.endsWith('.html') && readFileSync(join(ROOT, f), 'utf8').includes('assets/js/pb-terms.js')).sort();
eq('1. the pages that load it', pages.length >= 21, true);

const CONTEXT = `h1,h2,h3,h4,h5,h6,a,button,label,summary,figcaption,nav,footer,[data-pb-calc],.faq-list,#story,#damian,#adam,#buddy,.msg,.hint,.pb-changed,[aria-live]`;
let total = 0;
for (const page of pages) {
  await open(page, 375, true);
  const before = await ev(MAIN_TEXT);
  const none = await ev(`document.querySelectorAll('.pb-term').length`);
  await open(page, 375, false);
  const r = await ev(`(function(){
    var terms=[].slice.call(document.querySelectorAll('.pb-term'));
    var cav=window.PBMotion&&PBMotion.CAVEATS;
    var bad=terms.filter(function(b){var p=b.parentElement;return p.closest(${JSON.stringify(CONTEXT)})||(cav&&p.closest(cav))||!p.closest('main p, main li');}).map(function(b){return b.textContent;});
    var ids=terms.map(function(b){return b.getAttribute('data-pb-term');});
    var dup=ids.filter(function(x,i){return ids.indexOf(x)!==i;});
    var h1=(document.querySelector('h1')||{}).textContent||'';
    var t0=performance.getEntriesByType('resource').filter(function(e){return /pb-terms\\.js/.test(e.name);}).map(function(e){return e.responseEnd;})[0]||0;
    var late=window.__shifts.filter(function(s){return s.t>=t0&&!s.nav;}).reduce(function(a,s){return a+s.v;},0);
    return {n:terms.length,bad:bad,dup:dup,ids:ids,h1:h1,late:Math.round(late*1e4)/1e4};})()`);
  const after = await ev(MAIN_TEXT);
  const own = r.ids.filter(id => GLOSSARY.find(g => g.id === id).pats.some(([p, cs]) =>
    new RegExp('(^|[^A-Za-z0-9-])' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?(?![A-Za-z0-9-])', cs ? '' : 'i').test(r.h1)));
  total += r.n;
  eq(`1. ${page}: ${r.n} marked; words unchanged, none in the wrong place, none twice, none the page's own subject, nothing moved`,
     [none, after === before, r.bad, r.dup, own, r.late], [0, true, [], [], [], 0]);
}
eq('1. terms marked across the pages (some, not none)', total > 20, true);

/* ---- 2. behaviour ---- */
const firstTerm = `document.querySelector('.pb-term')`;
const state = `(function(){var b=${firstTerm};var p=b&&document.getElementById(b.getAttribute('aria-controls'));
  var r=p&&p.getBoundingClientRect();var vw=document.documentElement.clientWidth,vh=innerHeight;
  return {exp:b&&b.getAttribute('aria-expanded'),open:!!(p&&p.matches(':popover-open')),
    inside:!!(r&&r.left>=16&&r.right<=vw-16&&r.top>=0&&r.bottom<=vh),focus:document.activeElement===b?'button':(p&&p.contains(document.activeElement)?'link':document.activeElement.tagName)};})()`;
async function centre(sel) {
  return ev(`(function(){var e=${sel};e.scrollIntoView({block:'center',behavior:'instant'});var r=e.getClientRects()[0];return {x:r.left+Math.min(r.width/2,20),y:r.top+r.height/2};})()`);
}
async function mouse(type, x, y) { await send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1 }); }
async function key(k, code, vk) {
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk }, k === 'Enter' ? { text: '\r' } : {}));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
}
for (const [page, w] of [['pensions-over-50.html', 375], ['pensions-over-50.html', 1440], ['standard-fund-threshold.html', 1440]]) {
  await open(page, w, false);
  const c = await centre(firstTerm);
  const LAYOUT = `(function(){var r=${firstTerm}.getClientRects()[0];return [Math.round(r.left),Math.round(r.top),document.documentElement.scrollHeight];})()`;
  const layout0 = await ev(LAYOUT);
  await mouse('mousePressed', c.x, c.y); await mouse('mouseReleased', c.x, c.y); await sleep(150);
  const words = await ev(`(function(){var b=${firstTerm};var e=PBGlossary.filter(function(g){return g.id===b.getAttribute('data-pb-term');})[0];
    var p=document.getElementById(b.getAttribute('aria-controls'));
    return [p.querySelector('.pb-term-name').textContent===e.name,p.querySelector('.pb-term-def').textContent===e.def,
      p.querySelector('a').getAttribute('href')==='glossary.html#'+e.id,p.getAnimations().length];})()`);
  eq(`2. ${page} at ${w}: a press opens it, inside the screen, the glossary's words and link, nothing animated`,
     [await ev(state), words], [{ exp: 'true', open: true, inside: true, focus: 'button' }, [true, true, true, 0]]);
  eq(`2. ${page} at ${w}: opening it moved nothing`, await ev(LAYOUT), layout0);
  await key('Escape', 'Escape', 27); await sleep(100);
  eq(`2. ${page} at ${w}: Escape closes it and focus stays on the term`, await ev(state), { exp: 'false', open: false, inside: false, focus: 'button' });
  await key('Enter', 'Enter', 13); await sleep(100);
  const opened = await ev(state);
  await key('Tab', 'Tab', 9); await sleep(100);
  const onLink = await ev(state);
  await key('Tab', 'Tab', 9); await sleep(100);
  const past = await ev(state);
  eq(`2. ${page} at ${w}: Enter opens it, Tab reaches its link, Tab again closes it`,
     [opened.open, onLink.open && onLink.focus, past.open], [true, 'link', false]);
  await mouse('mousePressed', c.x, c.y); await mouse('mouseReleased', c.x, c.y); await sleep(100);
  await mouse('mousePressed', 5, 5); await mouse('mouseReleased', 5, 5); await sleep(100);
  eq(`2. ${page} at ${w}: a press elsewhere closes it`, (await ev(state)).open, false);
  if (w >= 1024) {
    const d = await centre(firstTerm);
    await mouse('mouseMoved', d.x, d.y); await sleep(600);
    const hov = (await ev(state)).open;
    await mouse('mouseMoved', 5, d.y + 300); await sleep(600);
    eq(`2. ${page} at ${w}: resting the pointer opens it, leaving closes it`, [hov, (await ev(state)).open], [true, false]);
  }
  const e = await centre(firstTerm);
  await mouse('mousePressed', e.x, e.y); await mouse('mouseReleased', e.x, e.y); await sleep(100);
  await ev(`window.scrollBy({top:innerHeight*2,behavior:'instant'})`); await sleep(200);
  eq(`2. ${page} at ${w}: scrolling the term away closes it`, (await ev(state)).open, false);
}

/* ---- 3. not everywhere ---- */
for (const page of ['glossary.html', 'privacy.html', 'terms.html', 'booking.html', 'how-we-work.html']) {
  await open(page, 375, true);
  eq(`3. ${page}: nothing marked`, await ev(`[document.querySelectorAll('.pb-term').length, !!document.querySelector('script[src*="pb-terms.js"]')]`), [0, false]);
}

console.log(failed ? `FAILURES  ${passed} passed, ${failed} failed` : `ALL PASS  ${passed} passed, 0 failed`);
cleanup();
process.exit(failed ? 1 : 0);
