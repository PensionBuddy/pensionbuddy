#!/usr/bin/env node
/* Run 37 (UX audit 4), items 4 onwards, on real frames.

       node tests/ux4.test.mjs            # the working tree
       node tests/ux4.test.mjs <root>     # any checkout

   One headless Chrome over the DevTools protocol (Node 24, no packages), the
   pages from a small server here, the analytics choice already answered,
   focus emulated so IntersectionObserver fires on real frames.

   What it proves, item by item (each section runs only when its item is in
   the tree):
     4. "Your pension through life": at 1440 the card follows the step in the
        middle of the screen (its figure, its heading, the mark on the ruler)
        as the page scrolls, and the page scrolls exactly as far as it was
        asked; at 375, and without JavaScript, there is no card, only the
        list; opening the section moves nothing above it
     5. Save as A, at 375 and 1440: the table shows A and now as the page's
        own figures; move a slider and A stays while now follows the page,
        the rows that changed marked; Clear A takes it away and gives focus
        back; without JavaScript there is no Save as A
     7. related pages: last in <main>, two or three cards of at least 44px,
        side by side on a wide screen and stacked on a phone, nothing
        sideways; none on the home page
     8. the 404, at 375 and 1440: Buddy, the search box and the six places;
        a search there finds the buster's entry; nothing moves as it loads;
        without JavaScript no box and the six places still there
   (item 6 was reverted: its section is on claude/overnight-ux-4-guides)
   Not in tests/run-tests.py. Exit 0 or 1. */
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
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('pb-consent','rejected')}catch(e){}
  window.__shifts=[];try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.hadRecentInput)return;var nav=(e.sources||[]).every(function(s){return s.node&&s.node.closest&&s.node.closest('#nav');});window.__shifts.push({v:e.value,t:e.startTime,nav:nav});});}).observe({type:'layout-shift',buffered:true});}catch(e){}` });

async function open(page, w, opts = {}) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 700 ? 812 : 900, deviceScaleFactor: 1, mobile: w < 700 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: opts.reduce ? 'reduce' : 'no-preference' }] });
  await send('Emulation.setScriptExecutionDisabled', { value: !!opts.nojs });
  const loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: ORIGIN + '/' + page });
  await loaded;
  if (opts.nojs) { await sleep(400); return; }
  await ev('document.fonts ? document.fonts.ready.then(() => 1) : 1', true);
  await sleep(500);
}
const at = async (sel, frac) => ev(`(function(){var e=document.querySelector(${JSON.stringify(sel)});var y=e.getBoundingClientRect().top+scrollY-innerHeight*${frac};window.scrollTo({top:y,behavior:'instant'});return Math.round(scrollY);})()`);

/* ---- 4. Your pension through life ---- */
if (has('index.html', 'id="through-life"')) {
  await open('index.html', 1440);
  const card = `(function(){var s=document.querySelector('.pb-tl-stage');var cs=getComputedStyle(s);
    return {shown:cs.display!=='none'&&s.getBoundingClientRect().height>0,age:document.getElementById('pbTlAge').textContent,
      what:document.getElementById('pbTlWhat').textContent,mark:document.getElementById('pbTlMark').style.left,
      on:(document.querySelector('.pb-tl-step.pb-on h3')||{}).textContent||null};})()`;
  const steps = await ev(`[].map.call(document.querySelectorAll('.pb-tl-step'),function(li){return {show:li.getAttribute('data-show'),head:li.querySelector('h3').textContent,age:+li.getAttribute('data-age')};})`);
  const seen = [];
  for (let i = 0; i < steps.length; i++) {
    const asked = await at(`.pb-tl-step:nth-child(${i + 1})`, 0.5);
    await sleep(350);
    const c = await ev(card);
    const now = await ev('Math.round(scrollY)');
    seen.push([c.shown, c.age === steps[i].show && c.what === steps[i].head && c.on === steps[i].head, now === asked]);
  }
  eq('4. at 1440 the card follows each step in the middle of the screen, and the page stays where it was put', seen.every(s => s[0] && s[1] && s[2]), true);
  if (!seen.every(s => s[0] && s[1] && s[2])) console.log('         ', JSON.stringify(seen));
  const marks = await ev(`(function(){var r=[];var s=document.querySelectorAll('.pb-tl-step');return [].map.call(s,function(li){return li.getAttribute('data-age');});})()`);
  eq('4. the ruler runs 18 to 75 and the last step\'s mark sits where its age falls', await ev(`document.getElementById('pbTlMark').style.left`),
     (((+marks[marks.length - 1] - 18) / (75 - 18)) * 100).toFixed(2) + '%');
  eq('4. nothing moved while it followed', await ev(`window.__shifts.filter(function(s){return !s.nav;}).reduce(function(a,s){return a+s.v;},0) < 0.001`), true);
  await open('index.html', 375);
  await at('#through-life', 0.2);
  eq('4. at 375 the list alone: no card, every step a link', await ev(`[getComputedStyle(document.querySelector('.pb-tl-stage')).display, document.querySelectorAll('.pb-tl-step h3 a[href]').length === document.querySelectorAll('.pb-tl-step').length]`), ['none', true]);
  await open('index.html', 1440, { nojs: true });
  eq('4. without JavaScript at 1440, the list alone', await ev(`getComputedStyle(document.querySelector('.pb-tl-stage')).display`), 'none');
  await open('index.html', 1440, { reduce: true });
  eq('4. asking for less motion: the fill and the mark jump, they do not slide', await ev(`[getComputedStyle(document.getElementById('pbTlFill')).transitionDuration, getComputedStyle(document.getElementById('pbTlMark')).transitionDuration]`), ['0s', '0s']);
}

/* ---- 5. Save as A ---- */
if (has('pension-calculator.html', 'id="pbAb"')) {
  const TABLE = `(function(){var rows=[].map.call(document.querySelectorAll('#pbAbRows tr'),function(tr){var c=tr.children;return [c[0].textContent,c[1].textContent,c[2].firstChild?c[2].firstChild.textContent:'',c[2].className];});
    return {box:!document.getElementById('pbAbBox').hidden,rows:rows,pot:document.getElementById('potOut').textContent,inc:document.getElementById('incOut').textContent};})()`;
  for (const w of [375, 1440]) {
    await open('pension-calculator.html', w);
    /* the guess card veils the figures until it is answered or skipped */
    await ev(`(function(){var b=document.querySelector('.pb-guess-skip,[data-pb-guess-skip]');if(b)b.click();document.documentElement.classList.remove('pb-preveil');[].forEach.call(document.querySelectorAll('.pb-veiled'),function(e){e.classList.remove('pb-veiled');});})()`);
    await sleep(900);
    await ev(`document.getElementById('pbAbSave').click()`); await sleep(700);
    const saved = await ev(TABLE);
    const first = saved.rows[0], second = saved.rows[1];
    eq(`5. at ${w}: Save as A shows the table, A and now the same, both the page's own figures`,
       [saved.box, first[1] === saved.pot && first[2] === saved.pot, second[1] === saved.inc && second[2] === saved.inc, saved.rows.every(r => r[1] === r[2] && r[3] === '')],
       [true, true, true, true]);
    await ev(`(function(){var r=document.getElementById('age');r.value=String(+r.value+5);r.dispatchEvent(new Event('input',{bubbles:true}));r.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await sleep(1500);
    const moved = await ev(TABLE);
    const ageRow = moved.rows.find(r => r[0] === 'Your age now');
    eq(`5. at ${w}: move a slider and A stays, now follows the page, the changed rows marked`,
       [moved.rows[0][1] === saved.pot, moved.rows[0][2] === moved.pot, moved.pot !== saved.pot, !!ageRow && ageRow[3] === 'pb-ab-diff', moved.rows[0][3] === 'pb-ab-diff'],
       [true, true, true, true, true]);
    await ev(`document.getElementById('pbAbClear').click()`); await sleep(200);
    eq(`5. at ${w}: Clear A takes the table away and focus goes back to Save as A`, await ev(`[document.getElementById('pbAbBox').hidden, document.activeElement.id]`), [true, 'pbAbSave']);
  }
  await open('pension-calculator.html', 1440, { nojs: true });
  eq('5. without JavaScript there is no Save as A', await ev(`getComputedStyle(document.getElementById('pbAb')).display`), 'none');
}

/* ---- 7. related pages ---- */
if (has('terms.html', 'class="pb-related"')) {
  for (const [page, w] of [['pension-calculator.html', 375], ['pensions-over-50.html', 1440], ['privacy.html', 1440]]) {
    await open(page, w);
    const r = await ev(`(function(){var s=document.querySelector('.pb-related');var m=document.getElementById('main');var cards=[].slice.call(s.querySelectorAll('a.pb-related-card'));
      var after=[].slice.call(m.querySelectorAll('*')).filter(function(e){return s.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING&&!s.contains(e)&&e.tagName!=='SCRIPT'&&e.getClientRects().length;}).length;
      var rs=cards.map(function(a){return a.getBoundingClientRect();});
      return {inMain:m.contains(s),after:after,n:cards.length,wide:document.documentElement.scrollWidth<=innerWidth,
        tall:rs.every(function(q){return q.height>=44;}),sameRow:rs.length>1&&Math.abs(rs[0].top-rs[1].top)<1};})()`);
    eq(`7. ${page} at ${w}: related pages last in <main>, two or three cards, each at least 44px tall, nothing sideways`,
       [r.inMain, r.after, r.n >= 2 && r.n <= 3, r.tall, r.wide], [true, 0, true, true, true]);
    eq(`7. ${page} at ${w}: cards side by side on a wide screen, stacked on a phone`, r.sameRow, w >= 1024);
  }
  await open('index.html', 1440);
  eq('7. not on the home page', await ev(`!!document.querySelector('.pb-related')`), false);
}


/* ---- 8. the 404 ---- */
if (has('404.html', 'class="pb-nf-six"')) {
  for (const w of [375, 1440]) {
    await open('404.html', w);
    const shifts = await ev(`window.__shifts.filter(function(s){return !s.nav;}).reduce(function(a,s){return a+s.v;},0)`);
    const r = await ev(`(function(){var b=document.querySelector('.pb-nf-buddy img');var q=document.getElementById('pbSearchIn');
      return {buddy:!!b&&b.complete&&b.naturalWidth>0&&b.getBoundingClientRect().width>0,box:getComputedStyle(document.querySelector('.pb-nf-search')).display!=='none'&&q.getBoundingClientRect().height>=44,
        six:document.querySelectorAll('.pb-nf-six a').length};})()`);
    await ev(`(function(){var q=document.getElementById('pbSearchIn');q.focus();q.value='annuity';q.dispatchEvent(new Event('input'));})()`);
    await sleep(900);
    const hits = await ev(`[].map.call(document.querySelectorAll('#pbSearchInList a'),function(a){return a.getAttribute('href');})`);
    eq(`8. the 404 at ${w}: Buddy, the search box, six places; a search finds the buster's entry; nothing moved as it loaded`,
       [r.buddy, r.box, r.six, hits[0], shifts < 0.001], [true, true, 6, 'glossary.html#annuity', true]);
  }
  await open('404.html', 375, { nojs: true });
  eq('8. the 404 without JavaScript: no search box, the six places still there', await ev(`[getComputedStyle(document.querySelector('.pb-nf-search')).display, document.querySelectorAll('.pb-nf-six a').length]`), ['none', 6]);
}


console.log(failed ? `FAILURES  ${passed} passed, ${failed} failed` : `ALL PASS  ${passed} passed, 0 failed`);
cleanup();
process.exit(failed ? 1 : 0);
