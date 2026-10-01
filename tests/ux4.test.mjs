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
     6. the long guides (Run 37, re-applied in Run 39), at 375 and 1440 (a written guide and two built
        ones): no bar at the top; past the page's own list, a bar names each
        section as it is read, sits under the nav, and its line only grows;
        its button opens the list, a link closes it and lands the section
        below the bar and the nav; without JavaScript the list is in the page
        and there is no bar
     9. slider feel (Run 37, built in Run 39), at 1440: marks on the pension
        calculator's age and earnings sliders and the comparison's age, at
        the relief module's own values, over the track, hidden from screen
        readers; on a mark the value bubble shows it, off it does not
    10. figures that wait (Run 37, built in Run 39): on four pages, each
        figure a script writes at load shows a bar in its own box until the
        page is ready, then its text, and nothing moves between the two;
        without JavaScript the markup's text; with reduced motion no pulse
   Run 38, 1. the game cards' videos, at 1440: nothing fetched while the
        cards are far; near, both play and the button says Pause video; the
        button's pause holds; far away the other pauses and plays on return;
        each file 6 to 10 seconds with no more than three flashes a second,
        read off the decoded frames; reduced motion and no JavaScript get
        the picture alone
   Run 38, 2. media pops in, and nothing else can: on seven pages and
        widths, scrolled through, everything that pops (armed by pb-pop.js,
        or any animation named pbPop or on a view timeline) holds no words
        and nothing never to pop, and sits in nothing that is; each element
        the list names is media only; nothing on the first screen is armed;
        nothing is left faded or low; no layout shift is of a popped
        element. Where scroll timelines work a picture follows the scroll
        and, stopped part way, still arrives on the clock; at 375 a picture
        behind the book bar waits, and arrives as it clears the bar; it
        never plays again; reduced motion, from the start or turned on part way, leaves
        nothing armed; without scroll timelines it waits faded and arrives
        in 320ms
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

/* ---- 6. the long guides ---- */
if (has('pensions-over-50.html', 'class="pb-toc"')) {
  const BAR = `(function(){var b=document.querySelector('.pb-tocbar');var n=document.getElementById('nav').getBoundingClientRect();
    if(!b)return null;var r=b.getBoundingClientRect();var p=b.querySelector('.pb-tocbar-prog');var m=(p.style.transform.match(/scaleX\\(([\\d.]+)\\)/)||[])[1];
    return {shown:!b.hidden&&r.height>0,top:Math.round(r.top),navBottom:Math.max(0,Math.round(n.bottom)),now:b.querySelector('.pb-tocbar-now').textContent,p:m?+m:null,
      open:!document.getElementById('pbTocbarList').hidden};})()`;
  for (const [page, w] of [['pensions-over-50.html', 375], ['pensions-over-50.html', 1440], ['pia.html', 375], ['director-pension-rules.html', 1440]]) {
    await open(page, w);
    const b0 = await ev(BAR);
    const links = await ev(`[].map.call(document.querySelectorAll('.pb-toc a'),function(a){return [a.getAttribute('href').slice(1),a.textContent];})`);
    const seen = [];
    let lastP = -1, mono = true, under = true;
    for (const [id, words] of links) {
      await ev(`(function(){var e=document.getElementById(${JSON.stringify(id)});window.scrollTo({top:e.getBoundingClientRect().top+scrollY-innerHeight*0.3,behavior:'instant'});})()`);
      await sleep(300);
      const b = await ev(BAR);
      seen.push(b.now === words);
      if (b.p < lastP) mono = false;
      lastP = b.p;
      if (b.shown && Math.abs(b.top - b.navBottom) > 1) under = false;
    }
    eq(`6. ${page} at ${w}: no bar at the top; past the list it names each section as it is read, sits under the nav, and the line only grows`,
       [b0.shown, seen.every(Boolean), mono, under], [false, true, true, true]);
    await ev(`document.querySelector('.pb-tocbar-btn').click()`); await sleep(150);
    const opened = (await ev(BAR)).open;
    const [id] = links[1];
    await ev(`document.querySelector('#pbTocbarList a[href="#${id}"]').click()`);
    /* a smooth scroll up a long page takes a while: wait until it has stopped */
    await ev(`new Promise(r => { let last = -1, same = 0, n = 0; (function t() { same = scrollY === last ? same + 1 : 0; last = scrollY; if (same >= 4 || ++n > 80) r(1); else setTimeout(t, 100); })(); })`, true);
    await sleep(500);
    const land = await ev(`(function(){var h=document.getElementById(${JSON.stringify(id)});var b=document.querySelector('.pb-tocbar').getBoundingClientRect();var n=document.getElementById('nav').getBoundingClientRect();return {open:!document.getElementById('pbTocbarList').hidden,clear:h.getBoundingClientRect().top>=Math.max(b.bottom,n.bottom)-1,hash:location.hash};})()`);
    eq(`6. ${page} at ${w}: the button opens the list; a link closes it and lands its section below the bar and the nav`, [opened, land.open, land.clear, land.hash], [true, false, true, '#' + id]);
  }
  await open('pensions-over-50.html', 375, { nojs: true });
  eq('6. without JavaScript: the list in the page, and no bar', await ev(`[document.querySelectorAll('.pb-toc a').length > 2, !!document.querySelector('.pb-tocbar')]`), [true, false]);
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


/* ---- 9. slider feel (Run 37, built in Run 39) ---- */
if (has('pension-calculator.html', 'data-pb-ticks=')) {
  for (const [page, id, want] of [['pension-calculator.html', 'age', [30, 40, 50, 55, 60]], ['pension-calculator.html', 'earn', [115000]], ['broker-vs-autoenrolment.html', 'age', [30, 40, 50, 55, 60]]]) {
    await open(page, 1440);
    const before = await ev(`document.getElementById('potOut') ? document.getElementById('potOut').textContent : document.body.innerText.length`);
    const t = await ev(`(function(){var r=document.getElementById(${JSON.stringify(id)});var w=r.closest('.slider-wrap');var ts=[].slice.call(w.querySelectorAll('.pb-tick'));
      var rr=r.getBoundingClientRect();
      return {vals:ts.map(function(x){return +x.getAttribute('data-v');}),inside:ts.every(function(x){var q=x.getBoundingClientRect();return q.left>=rr.left&&q.right<=rr.right;}),
        hidden:w.querySelector('.pb-ticks').getAttribute('aria-hidden'),value:r.value};})()`);
    eq(`9. ${page} #${id}: marks at the relief module's own values, over the track, hidden from screen readers; the slider's value untouched`,
       [t.vals, t.inside, t.hidden], [want, true, 'true']);
    /* land on a mark: the bubble signs it */
    const land = await ev(`(function(){var r=document.getElementById(${JSON.stringify(id)});var w=r.closest('.slider-wrap');w.classList.add('dragging');
      r.value=String(${want[0]});r.dispatchEvent(new Event('input',{bubbles:true}));var b=w.querySelector('.sbubble');var on=b.classList.contains('pb-tick-on');
      r.value=String(${want[0]}+ (+r.step||1));r.dispatchEvent(new Event('input',{bubbles:true}));var off=b.classList.contains('pb-tick-on');return [on,off];})()`);
    eq(`9. ${page} #${id}: on a mark the bubble shows it, off it does not`, land, [true, false]);
  }
}

/* ---- 10. figures that wait (Run 37, built in Run 39) ---- */
if (has('pension-calculator.html', 'data-pb-wait')) {
  for (const [page, w] of [['pension-calculator.html', 1440], ['director-calculator.html', 375], ['broker-vs-autoenrolment.html', 1440], ['index.html', 1440]]) {
    await open(page, w);
    const r = await ev(`(function(){var h=document.documentElement;var els=[].slice.call(document.querySelectorAll('[data-pb-wait]'));
      function snap(){return els.map(function(e){var q=e.getBoundingClientRect();var c=getComputedStyle(e);return [Math.round(q.left),Math.round(q.top),Math.round(q.width),Math.round(q.height),c.color,c.backgroundImage!=='none'];});}
      var ready=h.classList.contains('pb-ready');var after=snap();
      /* as a page loading: the state before ready, switched as the head script switches it */
      h.classList.add('pb-readying');h.classList.remove('pb-ready');var before=snap();h.classList.add('pb-ready');h.classList.remove('pb-readying');
      var same=after.every(function(a,i){return a[0]===before[i][0]&&a[1]===before[i][1]&&a[2]===before[i][2]&&a[3]===before[i][3];});
      return {n:els.length,ready:ready,same:same,barBefore:before.every(function(b){return b[4]==='rgba(0, 0, 0, 0)'&&b[5];}),textAfter:after.every(function(a){return a[4]!=='rgba(0, 0, 0, 0)'&&!a[5];})};})()`);
    eq(`10. ${page} at ${w}: ${r.n} waiting figures; loaded, they show their text; before, a bar in the same box; nothing moves between the two`,
       [r.n > 0, r.ready, r.barBefore, r.textAfter, r.same], [true, true, true, true, true]);
  }
  /* on a real load, the moment the page is ready a waiting figure arrives
     at once: two frames later none of them is part way through a transition */
  const rec = await send('Page.addScriptToEvaluateOnNewDocument', { source: "document.addEventListener('DOMContentLoaded',function(){requestAnimationFrame(function(){requestAnimationFrame(function(){window.__waitFades=document.getAnimations().filter(function(a){return a.effect&&a.effect.target&&a.effect.target.hasAttribute&&a.effect.target.hasAttribute('data-pb-wait')&&a.transitionProperty;}).map(function(a){return a.effect.target.id+':'+a.transitionProperty;});});});});" });
  await open('broker-vs-autoenrolment.html', 1440);
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: rec.identifier });
  eq('10. when the page is ready its waiting figures arrive at once, none fading in', await ev('window.__waitFades'), []);
  await open('pension-calculator.html', 1440, { nojs: true });
  eq('10. without JavaScript the markup\'s own text shows, no bar', await ev(`(function(){var e=document.getElementById('potOut');var c=getComputedStyle(e);return [c.color!=='rgba(0, 0, 0, 0)', c.backgroundImage];})()`), [true, 'none']);
  await open('pension-calculator.html', 1440, { reduce: true });
  eq('10. asking for less motion: the bar does not pulse', await ev(`(function(){var h=document.documentElement;h.classList.remove('pb-ready');var a=getComputedStyle(document.getElementById('potOut')).animationName;h.classList.add('pb-ready');return a;})()`), 'none');
}

/* ---- Run 38, 1. the game cards' videos ---- */
if (has('index.html', 'data-pb-video')) {
  const vids = () => requests.filter(u => /\/assets\/video\//.test(u));
  /* the cards' own pictures, in any format: a poster in the markup would be
     fetched with the page, however far down it is */
  const stills = () => requests.filter(u => /\/assets\/img\/product-(buddys-run|jargon-battle)\./.test(u));
  const V = `(function(){return [].map.call(document.querySelectorAll('video[data-pb-video]'),function(v){var b=v.parentNode.querySelector('[data-pb-video-btn]');
    return {paused:v.paused,t:Math.round(v.currentTime*10)/10,shown:getComputedStyle(v).display!=='none',btn:b.getAttribute('aria-label').split(':')[0],name:b.getAttribute('aria-label'),state:b.getAttribute('data-state'),btnShown:getComputedStyle(b).display!=='none',
      poster:!!v.poster&&v.poster===v.parentNode.querySelector('picture img').currentSrc};});})()`;
  await open('index.html', 1440);
  const far = [vids().length, stills().length];
  await at('#learn', 0.2); await sleep(2500);
  const near = await ev(V);
  eq('R38-1. nothing fetched while the cards are far, not even a poster; near, both videos play, the poster is the card\'s own picture, the button shows pause and is named Pause video: the game',
     [far, vids().length >= 2, near.map(v => [v.shown, !v.paused, v.t > 0.3, v.btn, v.state, v.btnShown, v.poster])],
     [[0, 0], true, [[true, true, true, 'Pause video', 'playing', true, true], [true, true, true, 'Pause video', 'playing', true, true]]]);
  await ev(`document.querySelector('[data-pb-video-btn]').click()`); await sleep(600);
  const held = (await ev(V))[0];
  await ev(`window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})`); await sleep(800);
  const away = await ev(V);
  await at('#learn', 0.2); await sleep(1500);
  const back = await ev(V);
  eq('R38-1. its button pauses it and it stays paused; scrolled far away the other pauses, and plays again on return',
     [held.paused, held.btn, away[1].paused, back[0].paused, back[1].paused, back[0].btn],
     [true, 'Play video', true, true, false, 'Play video']);
  /* the flash check on the decoded video, frame by frame, as the games' probe */
  const flash = await ev(`(async function(){
    function lin(c){c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
    function turns(s){var e=s[0],dir=0,at=[],i,v;for(i=1;i<s.length;i++){v=s[i];if(dir>=0&&v<=e-0.1){at.push(i);dir=-1;e=v;}else if(dir<=0&&v>=e+0.1){at.push(i);dir=1;e=v;}else if((dir>0&&v>e)||(dir<0&&v<e)){e=v;}}return at;}
    function most(at,per){var b=0,i,j;for(i=0;i<at.length;i++){for(j=i;j<at.length&&at[j]-at[i]<per;j++){}b=Math.max(b,j-i);}return b;}
    var out=[];
    for (var src of ['assets/video/buddys-run.mp4','assets/video/buddys-run.webm','assets/video/jargon-battle.mp4','assets/video/jargon-battle.webm']){
      var v=document.createElement('video');v.muted=true;v.src=src;v.preload='auto';
      await new Promise(function(r){v.addEventListener('loadeddata',r,{once:true});});
      var c=document.createElement('canvas');c.width=320;c.height=180;var cx=c.getContext('2d',{willReadFrequently:true}),fr=[],last=-1;
      await new Promise(function(res){function cb(now,md){ if(md.mediaTime!==last){last=md.mediaTime;cx.drawImage(v,0,0,320,180);
          var d=cx.getImageData(0,0,320,180).data,G=[],n=[],k,x,y,L,all=0,cnt=0;for(k=0;k<18;k++){G.push(0);n.push(0);}
          for(y=0;y<180;y+=2){for(x=0;x<320;x+=2){k=(y*320+x)*4;L=0.2126*lin(d[k])+0.7152*lin(d[k+1])+0.0722*lin(d[k+2]);var gi=Math.min(2,Math.floor(y/180*3))*6+Math.min(5,Math.floor(x/320*6));G[gi]+=L;n[gi]++;all+=L;cnt++;}}
          for(k=0;k<18;k++){G[k]/=n[k];}fr.push({t:md.mediaTime,whole:all/cnt,cells:G});}
        if(v.ended||md.mediaTime>7.9){res();}else{v.requestVideoFrameCallback(cb);}}
        v.requestVideoFrameCallback(cb);v.addEventListener('ended',res,{once:true});v.play();});
      var per=30,worst=most(turns(fr.map(function(f){return f.whole;})),per),cell=0;
      for(var ci=0;ci<18;ci++){cell=Math.max(cell,most(turns(fr.map(function(f){return f.cells[ci];})),per));}
      out.push({src:src,frames:fr.length,duration:v.duration,whole:worst,cell:cell});}
    return out;})()`, true);
  eq('R38-1. each file plays 6 to 10 seconds, and nothing in it flashes more than three times a second (at most 6 changes a second, frame by frame)',
     flash.map(f => [f.duration >= 6 && f.duration <= 10, f.frames >= 150, f.whole <= 6 && f.cell <= 6]), flash.map(() => [true, true, true]));
  if (!flash.every(f => f.whole <= 6 && f.cell <= 6 && f.frames >= 150)) console.log('         ', JSON.stringify(flash));
  await open('index.html', 1440, { reduce: true });
  await at('#learn', 0.2); await sleep(2000);
  const still = await ev(`[].map.call(document.querySelectorAll('.pb-learn-media'),function(m){var p=m.querySelector('picture img').getBoundingClientRect();return [getComputedStyle(m.querySelector('video')).display,getComputedStyle(m.querySelector('button')).display,p.width>0,m.querySelector('video').getAttribute('poster')];})`);
  eq('R38-1. asking for less motion: the picture only, nothing fetched, no button, no poster', [still, vids().length], [[['none', 'none', true, null], ['none', 'none', true, null]], 0]);
  await open('index.html', 1440, { nojs: true });
  eq('R38-1. without JavaScript: the picture only', await ev(`[].map.call(document.querySelectorAll('.pb-learn-media video'),function(v){return getComputedStyle(v).display;})`), ['none', 'none']);
}

/* ---- Run 38, 2. media pops in, and nothing else can ---- */
if (has('assets/js/pb-pop.js', 'window.PBPop')) {
  /* the guard, written here and not borrowed from pb-pop.js. Everything that
     pops, however it was made to (armed by pb-pop.js, or any animation
     named pbPop or on a view timeline), must hold no words (read from the
     text itself, so a paragraph, a list item or a caption is caught by what
     it says) and nothing that is never to pop, words or not (a heading, a
     form and its parts, a table, a figure, a caveat, a warning, the
     regulator or QFA line), and sit in nothing that is; and every element
     the list names must be media only, wherever it is drawn */
  const GUARD = `(function(){
    var cav=(window.PBMotion&&PBMotion.CAVEATS)||'';
    var NEVER='h1,h2,h3,h4,h5,h6,label,legend,input,select,textarea,button,form,table,.big,[data-pb-count],.pb-warn,.pb-reg,.pb-reviewed,.pb-quals,.badge'+(cav?','+cav:'');
    var INSIDE='form,.pb-warn,.pb-reg,.pb-reviewed,.pb-quals'+(cav?','+cav:'');
    function words(el){var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false),n;while((n=w.nextNode())){if(/\\S/.test(n.nodeValue))return n.nodeValue.trim().slice(0,30);}return '';}
    function name(el){return el.tagName.toLowerCase()+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\\s+/).join('.'):'');}
    function wrong(el){var w=words(el);return w?' "'+w+'"':(el.closest(INSIDE)||el.matches(NEVER)||el.querySelector(NEVER))?' (holds or sits in something never to pop)':'';}
    var bad=[],listed=0;
    [].forEach.call(document.querySelectorAll(PBPop.selector),function(el){if(!el.getClientRects().length)return;listed++;var w=wrong(el);if(w)bad.push('listed: '+name(el)+w);});
    var armed=[].slice.call(document.querySelectorAll('[data-pb-pop]')),popping=armed.slice();
    armed.forEach(function(el){if(!el.matches(PBPop.selector))bad.push('armed, not on the list: '+name(el));});
    document.getAnimations().forEach(function(a){var t=a.effect&&a.effect.target;if(!t)return;
      if(a.animationName==='pbPop'||(window.ViewTimeline&&a.timeline instanceof ViewTimeline)){if(popping.indexOf(t)<0)popping.push(t);}});
    popping.forEach(function(el){var w=wrong(el);if(w)bad.push('pops: '+name(el)+w);});
    return {listed:listed,armed:armed.length,sd:armed.filter(function(e){return e.getAttribute('data-pb-pop')==='sd';}).length,
      io:armed.filter(function(e){return e.getAttribute('data-pb-pop')==='io';}).length,popping:popping.length,bad:bad.slice(0,6)};})()`;
  /* a pop moves nothing: no layout shift is of, or inside, a listed element
     (the page's own shifts, such as the gap chart's bars growing, are other
     tests' business) */
  const popRec = await send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__popShift=[];try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.hadRecentInput)return;(e.sources||[]).forEach(function(s){if(s.node)window.__popShift.push({n:s.node,v:e.value});});});}).observe({type:'layout-shift',buffered:true});}catch(e){}" });
  /* and directly: the layout box (offsets, which a transform does not
     touch) of every heading, paragraph, list item and listed element,
     taken once everything is armed, is where it was at every scroll
     (sticky and fixed things, which move by design, left out) */
  const LAY = `function(e){var y=0,x=0,o=e;while(o){y+=o.offsetTop;x+=o.offsetLeft;o=o.offsetParent;}return [y,x,e.offsetWidth,e.offsetHeight];}`;
  const LAY_BASE = `(function(){var at=${LAY};window.__lay=[];[].forEach.call(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,'+PBPop.selector),function(e){
    for(var a=e;a;a=a.parentElement){var q=getComputedStyle(a).position;if(q==='sticky'||q==='fixed')return;}window.__lay.push([e,at(e)]);});return window.__lay.length;})()`;
  const LAY_MOVED = `(function(){var at=${LAY};return window.__lay.filter(function(r){if(!r[0].isConnected)return false;var n=at(r[0]);
    return n.some(function(v,i){return Math.abs(v-r[1][i])>0.5;});}).slice(0,3).map(function(r){return r[0].tagName.toLowerCase()+(typeof r[0].className==='string'&&r[0].className?'.'+r[0].className.trim().split(/\\s+/)[0]:'');});})()`;
  const PAGES_POP = [['index.html', 1440], ['index.html', 375], ['glossary.html', 1440], ['director.html', 375], ['tracker.html', 1440], ['pension-calculator.html', 375], ['404.html', 375]];
  const seen = {};
  for (const [page, w] of PAGES_POP) {
    await open(page, w);
    const first = await ev(`[].filter.call(document.querySelectorAll('[data-pb-pop]'),function(e){return e.getBoundingClientRect().top<innerHeight;}).length`);
    /* every image loaded first, so a lazy image arriving (the tracker's
       photograph grows from 161 to 523px as it loads) is not taken for a pop */
    await ev(`Promise.race([Promise.all([].map.call(document.images,function(i){if(i.loading==='lazy')i.loading='eager';
      return i.complete?0:new Promise(function(r){i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});});})),
      new Promise(function(r){setTimeout(r,8000);})]).then(function(){return new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r);});});})`, true);
    await ev(LAY_BASE);
    const moved = [];
    const h = await ev('document.documentElement.scrollHeight');
    const vh = w < 700 ? 812 : 900;
    const bads = [];
    const most = { listed: 0, armed: 0, sd: 0, io: 0, popping: 0 };
    for (let y = 0; y <= h; y += Math.round(vh * 0.6)) {
      await ev(`window.scrollTo({top:${y},behavior:'instant'})`); await sleep(120);
      const g = await ev(GUARD);
      for (const k of Object.keys(most)) most[k] = Math.max(most[k], g[k]);
      g.bad.forEach(b => { if (!bads.includes(b)) bads.push(b); });
      (await ev(LAY_MOVED)).forEach(m => { if (!moved.includes(m)) moved.push(m); });
    }
    await sleep(500);
    /* a flick can pass a picture before its clock starts; it is then at its
       end already, above the reader, so what matters is nothing left faded */
    const left = await ev(`[].filter.call(document.querySelectorAll(PBPop.selector),function(e){if(!e.getClientRects().length)return false;var cs=getComputedStyle(e);return cs.opacity!=='1'||!/^(none|matrix\\(1, 0, 0, 1, 0, 0\\))$/.test(cs.transform);}).length`);
    const shift = await ev(`window.__popShift.filter(function(s){var n=s.n.nodeType===1?s.n:s.n.parentElement;return n&&n.isConnected&&n.closest(PBPop.selector);}).reduce(function(a,s){return a+s.v;},0)`);
    seen[page + w] = most;
    eq(`R38-2. ${page} at ${w}: every element the list names is media only, and nothing with words, a figure, a caveat, a warning, the regulator or QFA line or a form pops, at any scroll; nothing on the first screen is armed; scrolled through, none of it is left faded or low; nothing shifts, and no heading, paragraph, list item or listed element moves in the layout`,
       [bads, first, left, shift < 0.001, moved], [[], 0, 0, true, []]);
  }
  const home = seen['index.html1440'];
  eq('R38-2. the home page has media below the fold to pop, on the scroll where it can be, and on the clock inside a box that clips (the portraits)',
     [home.listed > 4, home.sd > 0, home.io > 0], [true, true, true]);

  /* the scroll carries it; a reader who stops is not left with it half there */
  await open('index.html', 1440);
  const P = `.pb-learn-media picture`;
  const kind = await ev(`[document.querySelector(${JSON.stringify(P)}).getAttribute('data-pb-pop'),document.querySelector('.about-port img').getAttribute('data-pb-pop')]`);
  await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),r=p.getBoundingClientRect();window.scrollTo({top:r.top+scrollY-innerHeight+r.height*0.15,behavior:'instant'});})()`);
  await ev('new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r);});})', true);
  const mid = await ev(`+getComputedStyle(document.querySelector(${JSON.stringify(P)})).opacity`);
  await sleep(900);
  const end = await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),cs=getComputedStyle(p);return [p.hasAttribute('data-pb-pop'),p.classList.contains('pb-popped'),cs.opacity,cs.transform];})()`);
  eq('R38-2. where scroll timelines work: the picture follows the scroll (part way in, part way up), and stopped there it still arrives, in full, on the clock',
     [kind, mid > 0.05 && mid < 0.95, end], [['sd', 'io'], true, [false, true, '1', 'none']]);
  /* once */
  await ev(`window.scrollTo({top:0,behavior:'instant'})`); await sleep(300);
  await at(P, 0.9); await sleep(80);
  eq('R38-2. once: scrolled away and back, it does not play again',
     await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),cs=getComputedStyle(p);return [p.hasAttribute('data-pb-pop'),cs.animationName,cs.opacity,cs.transform];})()`),
     [false, 'none', '1', 'none']);

  /* on a phone the book bar covers the foot of the screen, and the site
     keeps its height as scroll-padding: a picture behind it waits, and pops
     as it clears the bar */
  await open('index.html', 375);
  await at(P, 1.3); await sleep(400);
  await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),r=p.getBoundingClientRect();window.scrollTo({top:r.top+scrollY-innerHeight+40,behavior:'instant'});})()`);
  await sleep(800);
  const behind = await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),cs=getComputedStyle(p);return [document.documentElement.classList.contains('pb-bookbar-on'),parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom)>40,p.getAttribute('data-pb-pop'),cs.opacity];})()`);
  await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),r=p.getBoundingClientRect(),pad=parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom)||0;window.scrollTo({top:r.top+scrollY-innerHeight+pad+r.height*0.2,behavior:'instant'});})()`);
  await sleep(900);
  const clear = await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),cs=getComputedStyle(p);return [p.hasAttribute('data-pb-pop'),p.classList.contains('pb-popped'),cs.opacity];})()`);
  eq('R38-2. at 375 with the book bar up: a picture behind the bar waits, unseen; once it clears the bar it arrives, in full',
     [behind, clear], [[true, true, 'sd', '0'], [false, true, '1']]);

  /* a reader who turns on reduced motion part way: everything shows at once */
  await open('index.html', 1440);
  const before = await ev(`document.querySelectorAll('[data-pb-pop]').length`);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(200);
  eq('R38-2. reduced motion turned on part way: nothing is left armed, faded or low',
     [before > 0, await ev(`[document.querySelectorAll('[data-pb-pop]').length,[].filter.call(document.querySelectorAll(PBPop.selector),function(e){var cs=getComputedStyle(e);return cs.opacity!=='1'||cs.transform!=='none';}).length]`)],
     [true, [0, 0]]);
  await open('index.html', 1440, { reduce: true });
  await at('#learn', 0.2); await sleep(400);
  await at('#damian', 0.2); await sleep(400);
  eq('R38-2. asking for less motion: nothing is armed, nothing animates', await ev(`[document.querySelectorAll('[data-pb-pop]').length,document.getAnimations().filter(function(a){return a.animationName==='pbPop';}).length]`), [0, 0]);

  /* the fallback, where scroll timelines are not supported (Firefox) */
  const fake = await send('Page.addScriptToEvaluateOnNewDocument', { source: "(function(){var s=CSS.supports.bind(CSS);CSS.supports=function(a,b){if(String(a).indexOf('animation-timeline')>-1)return false;return b===undefined?s(a):s(a,b);};})();" });
  await open('index.html', 1440);
  const waiting = await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),cs=getComputedStyle(p);return [p.getAttribute('data-pb-pop'),cs.opacity,cs.animationName];})()`);
  await at(P, 0.9);
  await ev('new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r);});})', true);
  const going = await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),cs=getComputedStyle(p);return [p.getAttribute('data-pb-pop'),cs.transitionDuration];})()`);
  await sleep(700);
  const arrived = await ev(`(function(){var p=document.querySelector(${JSON.stringify(P)}),cs=getComputedStyle(p);return [p.hasAttribute('data-pb-pop'),p.classList.contains('pb-popped'),cs.opacity,cs.transform];})()`);
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fake.identifier });
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: popRec.identifier });
  eq('R38-2. without scroll timelines: it waits faded, arrives in 320ms as it first shows, and stays',
     [waiting, going, arrived], [['io', '0', 'none'], ['go', '0.32s, 0.32s'], [false, true, '1', 'none']]);
}

console.log(failed ? `FAILURES  ${passed} passed, ${failed} failed` : `ALL PASS  ${passed} passed, 0 failed`);
cleanup();
process.exit(failed ? 1 : 0);
