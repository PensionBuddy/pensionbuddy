#!/usr/bin/env node
/* The auto-enrolment comparison (broker-vs-autoenrolment.html), on real
   frames in real Chrome (13 October 2026; Damian: "I'm messing around with
   the auto enrolment calculator and it's not changing").

       node tests/compare-page.test.mjs            # the working tree
       node tests/compare-page.test.mjs <root>     # any checkout

   One headless Chrome over the DevTools protocol (Node 22+: global fetch and
   WebSocket, no packages), as tests/give-then-ask.test.mjs does. The page is
   driven the way a reader drives it: the slider through input events, the
   tax rate through trusted presses on its two buttons. The figures are
   checked against PBCompare.monthly(), asked in the page itself, so this
   file holds no rate of its own.

     C1  every control moves every figure it should: both totals, at once
         with motion off, and landed with it
     C2  what is on screen adds up: each total is the sum of its parts
     C3  past auto-enrolment's limit, and only past it: the notice, word for
         word, "At its limit", and the best of both, which adds up too
     C4  one euro scale: the two bars stand as their totals do, and the best
         of both's auto-enrolment part is as long as the card's
     C5  crossing the limit moves nothing in the panel
     C6  an amount typed past the slider's end is taken, and the figures follow
     C7  without JavaScript: the default's figures, its bars, no notice and no
         best of both, nothing sideways
     C8  the scale holds still: auto-enrolment's bar is as long at EUR 105 as
         at EUR 500, and at 20% as at 40%, while the personal pension's grows
     C9  the result never bobs: from EUR 25 to EUR 500, at both rates, the
         result and the best of both keep their heights except where the
         best of both comes or goes
     C10 an amount handed over in the link (#you=200, from the starter page)
         opens the page at it, the best of both showing
     C11 with motion, the best of both opens and shuts smoothly: nothing
         under it moves in the same frame as the slider, and nothing snaps
         once it has shut
   Exit 0 or 1. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.argv[2] || join(HERE, '..'));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = 'broker-vs-autoenrolment.html';
const NOTICE = 'Past €100 a month (pay over €80,000), auto-enrolment takes no more. A personal pension takes the rest.';
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
  const [rawPath, query = ''] = req.url.split('?');
  const f = join(ROOT, decodeURIComponent(rawPath) === '/' ? 'index.html' : decodeURIComponent(rawPath));
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  let body = readFileSync(f);
  if (extname(f) === '.html' && /(^|&)nojs(=|&|$)/.test(query)) body = Buffer.from(body.toString('utf8').replace(/<script\b[\s\S]*?<\/script>/g, ''));
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(body);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

/* ---- Chrome ---------------------------------------------------------- */
const prof = mkdtempSync(join(tmpdir(), 'pb-cmp-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + prof,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--disable-extensions',
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank'], { stdio: 'ignore' });
const cleanup = () => { try { chrome.kill('SIGKILL'); } catch {} try { rmSync(prof, { recursive: true, force: true }); } catch {} };
process.on('exit', cleanup);
setTimeout(() => { console.log('  FAIL timed out'); process.exit(1); }, 240000).unref();
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
let seq = 0; const pending = new Map(), waiters = [];
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
await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('pb-consent','rejected')}catch(e){}window.__errs=[];addEventListener('error',function(e){window.__errs.push(String(e.message||e.type));},true);" });

async function open(w, reduce, q = '') {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 812 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
  let loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: 'about:blank' }); await loaded;
  loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: ORIGIN + '/' + PAGE + q }); await loaded;
  await sleep(500);
  if (!q.startsWith('?')) await ev(`scrollTo(0, document.querySelector('.calc-wrap').getBoundingClientRect().top + scrollY - 80)`);
  await sleep(reduce ? 200 : 1300);
}
/* a trusted press at the centre of the element */
async function press(sel) {
  const at = await ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  for (const type of ['mousePressed', 'mouseReleased'])
    await send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
}
const set = v => ev(`(() => { const s = document.getElementById('extra'); s.value = ${JSON.stringify(String(v))}; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);

/* what the page shows, and what the module says it should, both read in the page */
const READ = `(() => {
  const t = id => document.getElementById(id).textContent, n = s => +String(s).replace(/[^0-9]/g, '');
  const vis = el => el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible';
  const px = ids => ids.reduce((a, id) => a + document.getElementById(id).getBoundingClientRect().width, 0);
  const you = +document.getElementById('extra').value, rate = document.getElementById('tx40').getAttribute('aria-pressed') === 'true' ? 40 : 20;
  const m = PBCompare.monthly({ you, taxRate: rate, year: Math.max(1, new Date().getFullYear() - 2025) }), R = Math.round;
  const ae = R(m.autoEnrolment.you) + R(m.autoEnrolment.employer) + R(m.autoEnrolment.state);
  const top = R(m.best.personal.you) + R(m.best.personal.relief);
  return {
    you, rate,
    shown: [n(t('aeTotal')), n(t('ppTotal'))],
    want: [ae, R(m.personal.you) + R(m.personal.relief)],
    aeSum: n(t('aeYou')) + n(t('aeEmp')) + n(t('aeState')), ppSum: n(t('ppYou')) + n(t('ppRel')),
    over: m.autoEnrolment.capped,
    marks: [vis(document.getElementById('cmpNote')), t('aeTag'), !document.getElementById('cmpBestW').hidden && vis(document.getElementById('cmpBest'))],
    notice: t('cmpNoteT'),
    best: [n(t('bestTotal')), n(t('bAe')) + n(t('bTop')), ae + top],
    bars: [px(['aeBarYou', 'aeBarEmp', 'aeBarState']), px(['ppBarYou', 'ppBarRev']), px(['bBarYou', 'bBarEmp', 'bBarState'])],
    taxTop: Math.round(document.getElementById('taxLabel').getBoundingClientRect().top + scrollY),
    errs: window.__errs
  };
})()`;

for (const [w, reduce] of [[1440, false], [375, false], [1440, true], [375, true]]) {
  const tag = `${w}${reduce ? ', motion off' : ''}`;
  await open(w, reduce);
  let r = await ev(READ);
  eq(`C1. ${tag}: at load, EUR 50 at 20%, the module's figures`, [r.you, r.rate, r.shown], [50, 20, r.want]);
  const taxTop = r.taxTop;
  for (const [x, rate] of [[25, 20], [100, 20], [105, 20], [105, 40], [150, 40], [480, 40], [480, 20], [60, 20]]) {
    if (rate !== r.rate) await press(`#tx${rate}`);
    await set(x);
    if (reduce) { const now = await ev(READ); eq(`C1. ${tag}, EUR ${x} at ${rate}%: written at once`, now.shown, now.want); }
    await sleep(reduce ? 120 : 1100);
    r = await ev(READ);
    eq(`C1. ${tag}, EUR ${x} at ${rate}%: both totals are the module's`, [r.you, r.rate, r.shown], [x, rate, r.want]);
    eq(`C2. ${tag}, EUR ${x} at ${rate}%: each total is the sum of its parts on screen`, [r.aeSum, r.ppSum], r.shown);
    eq(`C3. ${tag}, EUR ${x} at ${rate}%: ${r.over ? 'past the limit: the notice, "At its limit", the best of both' : 'under the limit: none of them'}`,
       r.marks, r.over ? [true, 'At its limit', true] : [false, '', false]);
    if (r.over) eq(`C3. ${tag}, EUR ${x} at ${rate}%: the best of both is the module's, and its two parts add up to it`, [r.best[0], r.best[1]], [r.best[2], r.best[2]]);
    eq(`C4. ${tag}, EUR ${x} at ${rate}%: the bars stand as the totals do${r.over ? ', and the best of both\'s auto-enrolment part is the card\'s length' : ''}`,
       [Math.abs(r.bars[0] / r.bars[1] - r.shown[0] / r.shown[1]) < 0.06, r.over ? Math.abs(r.bars[2] - r.bars[0]) <= 3 : true], [true, true]);
    eq(`C5. ${tag}, EUR ${x} at ${rate}%: nothing in the panel moved`, r.taxTop, taxTop);
  }
  eq(`C3. ${tag}: the notice, word for word`, r.notice, NOTICE);
  /* C6: typed past the end, through the page's own tap-to-type */
  await press('#extraV');
  await sleep(150);
  await ev(`(() => { const i = document.querySelector('.val-edit'); i.value = '1000'; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
  await sleep(reduce ? 150 : 1100);
  r = await ev(READ);
  eq(`C6. ${tag}: EUR 1,000 typed: taken, and the figures follow`, [r.you, r.shown, r.marks], [1000, r.want, [true, 'At its limit', true]]);
  eq(`C1. ${tag}: no script error`, r.errs, []);
}

/* C8 and C9, with motion off so every step is where it ends */
const GEO = `(() => {
  const h = id => Math.round(document.getElementById(id).getBoundingClientRect().height);
  const w = ids => Math.round(ids.reduce((a, id) => a + document.getElementById(id).getBoundingClientRect().width, 0));
  return { hero: h('cmpHero'), best: document.getElementById('cmpBestW').hidden ? 0 : h('cmpBestW'),
    ae: w(['aeBarYou', 'aeBarEmp', 'aeBarState']), pp: w(['ppBarYou', 'ppBarRev']) };
})()`;
for (const w of [1440, 1360, 1100, 375]) {
  await open(w, true);
  const seen = {};
  const bob = [];
  for (const rate of [20, 40]) {
    await press(`#tx${rate}`);
    let prev = null;
    for (let v = 25; v <= 500; v += 5) {
      await set(v);
      const g = await ev(GEO);
      seen[rate + ':' + v] = g;
      if (prev && (prev.best > 0) === (g.best > 0) && (g.hero !== prev.hero || g.best !== prev.best))
        bob.push(`${rate}% EUR ${v - 5} to ${v}: result ${prev.hero} to ${g.hero}, best of both ${prev.best} to ${g.best}`);
      prev = g;
    }
  }
  eq(`C8. ${w}: auto-enrolment's bar the same length at EUR 105 and EUR 500, at 20% and at 40%`,
     [seen['20:105'].ae, seen['20:500'].ae, seen['40:105'].ae, seen['40:500'].ae].every(x => Math.abs(x - seen['20:105'].ae) <= 1), true);
  eq(`C8. ${w}: and the personal pension's grows`, seen['20:500'].pp > seen['20:105'].pp * 3 && seen['40:500'].pp > seen['20:500'].pp, true);
  eq(`C9. ${w}: sliding EUR 25 to EUR 500 at both rates, nothing bobs`, bob, []);
}

/* C11: with motion, the best of both opening and shutting, frame by frame */
const GLIDE = to => `new Promise(res => {
  const after = document.querySelector('.calc-wrap .results > .pb-after') || document.querySelector('.infoadvice');
  const y = () => after.getBoundingClientRect().top, rows = [], t0 = performance.now(), y0 = y();
  const s = document.getElementById('extra'); s.value = '${to}'; s.dispatchEvent(new Event('input', { bubbles: true }));
  const same = y();
  (function f() { rows.push([performance.now() - t0, y()]); if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res({ y0, same, rows }); })();
})`;
for (const w of [1440, 375]) {
  await open(w, false);
  await set(90); await sleep(1200);
  const up = await ev(GLIDE(150), true);
  await sleep(300);
  const down = await ev(GLIDE(90), true);
  const lateStep = r => r.rows.filter(([t]) => t > 560).reduce((m, [, v], i, a) => i ? Math.max(m, Math.abs(v - a[i - 1][1])) : m, 0);
  eq(`C11. ${w}: opening, nothing under it moves in the slider's own frame; it glides down`,
     [Math.abs(up.same - up.y0) < 0.5, up.rows[up.rows.length - 1][1] - up.y0 > 100], [true, true]);
  eq(`C11. ${w}: shutting, nothing moves in the slider's own frame, nothing snaps at the end, and it ends where it began`,
     [Math.abs(down.same - down.y0) < 0.5, lateStep(down) < 0.5, Math.abs(down.rows[down.rows.length - 1][1] - up.y0) < 0.5], [true, true, true]);
}

/* C10: the starter's link hands over its amount */
for (const w of [1440, 375]) {
  await open(w, true, '#you=200');
  const r = await ev(READ);
  eq(`C10. ${w}: #you=200 opens at EUR 200, the module's figures, past the limit with the best of both`,
     [r.you, r.shown, r.marks], [200, r.want, [true, 'At its limit', true]]);
}

/* C7: without JavaScript */
for (const w of [375, 1440]) {
  await open(w, false, '?nojs');
  const r = await ev(`(() => ({ ae: document.getElementById('aeTotal').textContent, pp: document.getElementById('ppTotal').textContent,
    note: getComputedStyle(document.getElementById('cmpNote')).visibility, best: getComputedStyle(document.getElementById('cmpBestW')).display,
    bars: document.getElementById('aeBarYou').getBoundingClientRect().width > 10 && document.getElementById('ppBarRev').getBoundingClientRect().width > 2,
    sideways: document.documentElement.scrollWidth > innerWidth }))()`);
  eq(`C7. without JavaScript at ${w}: EUR 117 and EUR 63 with their bars, no notice, no best of both, nothing sideways`,
     r, { ae: '€117', pp: '€63', note: 'hidden', best: 'none', bars: true, sideways: false });
}

console.log(failed ? `FAILURES  ${passed} passed, ${failed} failed` : `ALL PASS  ${passed} passed, 0 failed`);
server.close();
process.exit(failed ? 1 : 0);
