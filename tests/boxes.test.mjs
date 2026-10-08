#!/usr/bin/env node
/* Boxes kept, and buttons apart, on every page (Run 39).

       node tests/boxes.test.mjs            # the working tree
       node tests/boxes.test.mjs <root>     # any checkout

   One headless Chrome over the DevTools protocol (Node 24, no packages), the
   pages from a small server here, as tests/ux4.test.mjs. Every page git
   tracks at the root, at 375 and 1440:
     - each lazy image in <main> keeps its box before it loads: its width
       and height the same before and after it arrives (the tracker page's
       photograph was 161px tall until it loaded, then 523px, and moved
       everything below it);
     - no two buttons (.btn) in <main> lie over each other, and each keeps
       its own side padding (the 404's two buttons lost theirs to the reach
       pass's rule for links in running text, and overlapped on a phone).
   The two cases found, then fixed, are checked by name too.
   Not in tests/run-tests.py. Exit 0 or 1. */
import { spawn, execSync } from 'node:child_process';
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
const has = (file, needle) => existsSync(join(ROOT, file)) && readFileSync(join(ROOT, file), 'utf8').includes(needle);

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

const prof = mkdtempSync(join(tmpdir(), 'pb-ux4-'));
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
let seq = 0; const pending = new Map(); const waiters = []; const requests = [];
ws.onmessage = m => {
  const d = JSON.parse(m.data);
  if (d.method === 'Network.requestWillBeSent') requests.push(d.params.request.url);
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

async function open(page, w, opts = {}) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 700 ? 812 : 900, deviceScaleFactor: 1, mobile: w < 700 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: opts.reduce ? 'reduce' : 'no-preference' }] });
  await send('Emulation.setScriptExecutionDisabled', { value: !!opts.nojs });
  requests.length = 0;
  const loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: ORIGIN + '/' + page });
  await loaded;
  if (opts.nojs) { await sleep(400); return; }
  await ev('document.fonts ? document.fonts.ready.then(() => 1) : 1', true);
  await sleep(500);
}
const at = async (sel, frac) => ev(`(function(){var e=document.querySelector(${JSON.stringify(sel)});var y=e.getBoundingClientRect().top+scrollY-innerHeight*${frac};window.scrollTo({top:y,behavior:'instant'});return Math.round(scrollY);})()`);


const pages = execSync('git ls-files', { cwd: ROOT }).toString().split('\n').filter(n => /^[^/]+\.html$/.test(n));
const BOX = `(function(){return [].map.call(document.querySelectorAll('main img'),function(i){var r=i.getBoundingClientRect();
  return [(i.currentSrc||i.src).split('/').pop().split('?')[0],Math.round(r.width),Math.round(r.height),i.complete&&i.naturalWidth>0];});})()`;
const LOAD = `Promise.race([Promise.all([].map.call(document.images,function(i){if(i.loading==='lazy')i.loading='eager';
  return i.complete?0:new Promise(function(r){i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});});})),
  new Promise(function(r){setTimeout(r,8000);})]).then(function(){return new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r);});});})`;
const BTN = `(function(){var b=[].filter.call(document.querySelectorAll('main .btn'),function(e){var r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden';});
  var name=function(e){return (e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,28);},over=[],i,j;
  for(i=0;i<b.length;i++)for(j=i+1;j<b.length;j++){var p=b[i].getBoundingClientRect(),q=b[j].getBoundingClientRect();
    var x=Math.min(p.right,q.right)-Math.max(p.left,q.left),y=Math.min(p.bottom,q.bottom)-Math.max(p.top,q.top);if(x>2&&y>2)over.push(name(b[i])+' / '+name(b[j]));}
  return {over:over,thin:b.filter(function(e){return parseFloat(getComputedStyle(e).paddingLeft)<12||parseFloat(getComputedStyle(e).paddingRight)<12;}).map(name),n:b.length};})()`;
for (const w of [375, 1440]) {
  const grew = [], over = [], thin = [];
  let photo = null, nf = null;
  for (const page of pages) {
    await open(page, w);
    const before = await ev(BOX);
    await ev(LOAD, true);
    const after = await ev(BOX);
    before.forEach((x, k) => {
      const y = after[k];
      if (y && !x[3] && (Math.abs(y[1] - x[1]) > 1 || Math.abs(y[2] - x[2]) > 1)) grew.push(`${page}: ${x[0]} ${x[1]}x${x[2]} then ${y[1]}x${y[2]}`);
      if (page === 'tracker.html' && /damian-and-buddy/.test(x[0])) photo = Math.abs(y[1] - x[1]) <= 1 && Math.abs(y[2] - x[2]) <= 1;   // loaded early or not, the box is the one it ends with
    });
    const b = await ev(BTN);
    b.over.forEach(o => over.push(`${page}: ${o}`));
    b.thin.forEach(o => thin.push(`${page}: ${o}`));
    if (page === '404.html') nf = [b.n, b.over.length, b.thin.length];
  }
  eq(`${w}: every page: each lazy image keeps its box before it loads`, grew, []);
  eq(`${w}: every page: no two buttons lie over each other, and each keeps its sides`, [over, thin], [[], []]);
  eq(`${w}: the tracker photograph has the box it ends with before it loads`, photo, true);
  eq(`${w}: the 404's two buttons: apart, each with its sides`, nf, [2, 0, 0]);
}

console.log(failed ? `FAILURES  ${passed} passed, ${failed} failed` : `ALL PASS  ${passed} passed, 0 failed`);
cleanup();
process.exit(failed ? 1 : 0);
