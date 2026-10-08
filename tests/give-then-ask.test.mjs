#!/usr/bin/env node
/* Give, then ask (Run 43, rebuilt in Run 45): under each calculator's result,
   on real frames with real, trusted input.

       node tests/give-then-ask.test.mjs            # the working tree
       node tests/give-then-ask.test.mjs <root>     # any checkout

   One headless Chrome, driven over the DevTools protocol (Node 24: global
   fetch and WebSocket, no packages), as tests/floating-chrome.test.mjs is:
   a 1440x900 window, the analytics choice already answered ("No thanks",
   stored before any script runs, unless a check says otherwise), the Google
   Fonts links left out. Keys and mouse presses go in through
   Input.dispatch*, so the page sees them as a reader's own (event.isTrusted),
   which is what assets/js/pb-after.js asks for before the booking button
   may say where the reader came from.

   What it proves:
     G1  on each calculator and tool with a result: its "What this doesn't
         show" line, word for word, where it has one, and one block: one
         booking button, in the wording pb-cta.js picked for this visit
         (A "Book a free 20-minute call with us" or B "See what this
         means for you - free 20-min call"), and "Free. No obligation. No
         pressure." under it
     G2  at load the button is plain booking.html, as in the markup (no tag
         inside the site for a search engine to read); pointed at, it carries
         the four tags (utm_source=site, utm_medium=cta, utm_campaign=<page>,
         utm_content=<A or B>) and no #from=
     G3  after a trusted move of one of the calculator's own controls, the
         button stays without #from= while a figure is behind "Take a guess
         first", and carries #from=<calculator> once the figure is revealed
     G3b the guess slider and Reveal on their own do not count as a move
     G4  a shared link replaying its figures is not the reader's move; one
         trusted key afterwards is
     G4b nor is an input event a script fires later
     G5  the reality check's jar: a trusted press on it is the reader's move
     G6  the reality check showing no figure ("No entitlement"): no #from=
     G7  in page order: the line, the button, then "Email me this result";
         no other booking link in the results; my-pensions: no form at all,
         and printed, the line stays and the block does not
     G8  the comparison: the line follows the card holding its rates caveat
     G9  the waitcards hold no booking link
     G10 without JavaScript: the line and the button (plain booking.html);
         "Email me this result" and its form stay hidden
     G11 booking.html: "Book a call with us" and one line, no "seen your
         number" line for any #from=; the calendar at once, with no form before it; the tags taken off the
         address and handed to the calendar, utm_term saying the situation
     G12 "Email me this result": the link opens the form under it and the
         result stays where it was; the form asks for a name, a valid email
         and the box, never ticked for the reader, and sends nothing without
         them; its post refused, a pre-filled email to Damian, and it says so
     G13 the button test: before "That's fine" nothing is stored and the
         button says the visit's wording; after it the pick is kept in
         localStorage 'pb-ab-cta' and is the same on the next page; "No
         thanks" deletes it
     G14 what is counted, after "That's fine": calculator_complete once,
         cta_view, cta_click and booking_click, email_result_submit, each
         with the page and the wording, and no name or email in any event
   Not in tests/run-tests.py: about a minute. Exit 0 or 1. */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.argv[2] || join(HERE, '..'));
// Damian's calendar, from the one shared copy
const CALENDLY = JSON.parse(readFileSync(join(ROOT, 'shared', 'site-links.json'), 'utf8')).calendly;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let passed = 0, failed = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else failed++;
  console.log('  %s %s', ok ? 'ok  ' : 'FAIL', label);
  if (!ok) console.log('         expected %s\n         actual   %s', JSON.stringify(want), JSON.stringify(got).slice(0, 900));
};


const RSQ = '’';
const WORDS = { A: 'Book a free 20-minute call with us', B: 'See what this means for you - free 20-min call' };
const WHY = 'Free. No obligation. No pressure.';
/* page: [data-pb-from, what it does not show (null: no line), the email offer] */
const AFTER = {
  'pension-calculator.html': ['pension-calculator', 'product charges, the tax on your income when you draw it.', true],
  'director-calculator.html': ['director-calculator', `your company${RSQ}s exact funding limit, product charges.`, true],
  'broker-vs-autoenrolment.html': ['broker-vs-autoenrolment', `your old pensions, product charges, your employer${RSQ}s own scheme.`, true],
  'pension-fees-calculator.html': ['pension-fees-calculator', 'policy, set-up and exit charges, the terms an older plan may carry, your tax relief.', true],
  'state-pension-reality-check.html': ['state-pension-reality-check', `your old pensions, your tax position, your employer${RSQ}s scheme.`, true],
  'state-pension-entitlement.html': ['state-pension-entitlement', `your old pensions, your tax position, your employer${RSQ}s scheme.`, true],
  'standard-fund-threshold.html': ['standard-fund-threshold', 'what your pensions are worth, your tax position, a Personal Fund Threshold you may hold.', true],
  'pia.html': ['pia', `your old pensions, fees and charges, your employer${RSQ}s scheme.`, true],
  'my-pensions.html': ['my-pensions', 'what your pensions could grow to, your tax position, the terms each one carries.', false],
  'director-pension-rules.html': ['director-pension-rules', null, true],
};
const tags = (page, v) => `utm_source=site&utm_medium=cta&utm_campaign=${page.replace(/\.html$/, '')}&utm_content=${v}`;
/* the address without its tags, for the checks about #from= */
const bare = h => h == null ? h : h.replace(/\?[^#]*/, '');

/* ---- the server ---------------------------------------------------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const [rawPath, query = ''] = req.url.split('?');
  const path = decodeURIComponent(rawPath);
  const f = join(ROOT, path === '/' ? 'index.html' : path);
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  let body = readFileSync(f);
  if (extname(f) === '.html') {
    let t = body.toString('utf8').split('\n')
      .filter(l => !l.includes('fonts.googleapis.com') && !l.includes('fonts.gstatic.com')).join('\n');
    /* ?nojs: the page as a reader without JavaScript gets it */
    if (/(^|&)nojs(=|&|$)/.test(query)) t = t.replace(/<script\b[\s\S]*?<\/script>/g, '');
    body = Buffer.from(t);
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(body);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;

/* ---- Chrome ---------------------------------------------------------- */
const prof = mkdtempSync(join(tmpdir(), 'pb-gta-'));
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
let seq = 0; const pending = new Map(); const waiters = []; const navs = [];
ws.onmessage = m => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(JSON.stringify(d.error))) : p.res(d.result); }
  else if (d.method) {
    if (d.method === 'Page.frameRequestedNavigation' || d.method === 'Page.frameStartedNavigating') navs.push(d.params.url);
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
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
let answerScript = null;
async function answer(v) {
  if (answerScript) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: answerScript });
  answerScript = (await send('Page.addScriptToEvaluateOnNewDocument', {
    source: v ? `try{localStorage.setItem('pb-consent',${JSON.stringify(v)})}catch(e){}` : 'void 0' })).identifier;
}
await answer('rejected');

async function open(page) {
  /* by way of a blank page, so a new #fragment on the same address is a new load */
  let loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: 'about:blank' });
  await loaded;
  loaded = once('Page.loadEventFired', 30000);
  await send('Page.navigate', { url: ORIGIN + '/' + page });
  await loaded;
  await ev('document.fonts ? document.fonts.ready.then(() => 1) : 1', true);
  await sleep(400);
}
const href = () => ev(`(() => { const a = document.querySelector('#pbAfter a'); return a ? a.getAttribute('href') : null; })()`);
const variant = () => ev('window.PBCta ? window.PBCta.variant : null');
/* what the button says once the pointer is on it, before any other input on
   the page: a trusted mouse move to its centre (pb-cta.js tags a link the
   reader points at; on a page with no input yet a script's focus() may move
   focus without the focus events, so G2 points rather than focuses) */
async function hrefOnPoint() {
  const at = await ev(`(async () => {
    const a = document.querySelector('#pbAfter a');
    a.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise(r => setTimeout(r, 200));
    const r = a.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`, true);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y, button: 'none', buttons: 0 });
  await sleep(100);
  const h = await href();
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2, button: 'none', buttons: 0 });
  return h;
}
/* what the link says when the reader reaches it: focus runs pb-after.js's refresh */
const hrefOnFocus = async () => { await ev(`document.querySelector('#pbAfter a').focus({ preventScroll: true })`); await sleep(80); return href(); };
async function key(name, code) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code });
  await sleep(150);
}
/* a trusted press and release at the centre of the element sel; false if
   something else lies on top of it there */
async function click(sel) {
  const at = await ev(`(async () => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null;
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise(r => setTimeout(r, 250));
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return { x, y, hit: !!top && (top === el || el.contains(top)) };
  })()`, true);
  if (!at || !at.hit) return false;
  for (const type of ['mousePressed', 'mouseReleased'])
    await send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  await sleep(200);
  return true;
}
const veiled = () => ev(`!!document.querySelector('.pb-veiled') || document.documentElement.classList.contains('pb-preveil')`);

/* G1, G2, G7 and G9 read the page as it loads */
const PARTS = `(() => {
  const t = el => el ? el.textContent.replace(/\\s+/g, ' ').trim() : null;
  const not = document.querySelectorAll('#pbAfterNot'), blk = document.querySelectorAll('#pbAfter');
  const b = blk[0], links = b ? b.querySelectorAll('a[href^="booking.html"]') : [];
  const before = (x, y) => !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
  const res = document.querySelector('.results') || document.getElementById('ptSum') || document.getElementById('drOut');
  const shown = e => e.getClientRects().length && getComputedStyle(e).visibility === 'visible';
  const stray = res ? [...res.querySelectorAll('a[href^="booking.html"]')].filter(a => shown(a) && !a.closest('#pbAfter')).map(a => t(a)) : ['no results'];
  const prev = not[0] ? not[0].previousElementSibling : null;
  const more = document.getElementById('ecMore');
  return {
    nots: not.length, notText: t(not[0]), notCaveat: !!not[0] && not[0].classList.contains('pb-caveat'),
    blocks: blk.length, from: b ? b.getAttribute('data-pb-from') : null,
    links: links.length, words: t(links[0] && links[0].querySelector('.pb-ab-t')), ab: links[0] ? links[0].getAttribute('data-pb-ab') : null,
    why: [...(b ? b.querySelectorAll('p.pb-after-why') : [])].map(t), reason: b ? b.querySelectorAll('p.pb-why').length : null,
    href: links[0] ? links[0].getAttribute('href') : null,
    order: (not[0] ? before(not[0], links[0]) : true) && before(links[0], more) && before(more, document.getElementById('ecForm')),
    more: more ? [t(more), more.hidden, getComputedStyle(more).display !== 'none'] : null,
    form: !!document.getElementById('ecForm'),
    stray,
    prevCaveat: !!prev && prev.classList.contains('chart-card') && !!prev.querySelector('.srcwarn'),
    waitLinks: document.querySelectorAll('.waitcard a.wlink, .waitcard a[href^="booking"]').length,
    waitcards: document.querySelectorAll('.waitcard').length,
    variant: window.PBCta ? window.PBCta.variant : null,
  };
})()`;

for (const [page, [from, loop, mail]] of Object.entries(AFTER)) {
  await open(page);
  if (page === 'director-pension-rules.html') {
    /* its result is a list, shown once the four questions are answered */
    for (const q of ['drExec', 'drMore', 'drAge', 'drBig']) await click(`input[name="${q}"][value="yes"]`);
    eq(`G3. ${page}: four trusted answers and "Show what to talk about"`, await click('#drGo'), true);
    await sleep(300);
  }
  const p = await ev(PARTS);
  if (loop) eq(`G1. ${page}: one line, "What this doesn${RSQ}t show: ${loop.slice(0, 30)}...", a caveat`,
               [p.nots, p.notText, p.notCaveat], [1, `What this doesn${RSQ}t show: ${loop}`, true]);
  else eq(`G1. ${page}: no "doesn${RSQ}t show" line (its list says it is topics, not advice)`, p.nots, 0);
  eq(`G1. ${page}: one block, one booking button in this visit's wording (${p.variant}), its line`,
     [p.blocks, p.from, p.links, p.ab, p.words, p.why, p.reason], [1, from, 1, 'cta', WORDS[p.variant] || '?', [WHY], 0]);
  if (page !== 'director-pension-rules.html') {
    eq(`G2. ${page}: at load the button is plain booking.html`, p.href, 'booking.html');
    eq(`G2. ${page}: pointed at, it carries the four tags, and no #from=`, await hrefOnPoint(), 'booking.html?' + tags(page, p.variant));
  }
  if (page === 'my-pensions.html') {
    eq(`G7. ${page}: no form, and no "Email me this result"`, [p.form, p.more], [false, null]);
    const RM = [{ name: 'prefers-reduced-motion', value: 'reduce' }];
    await send('Emulation.setEmulatedMedia', { media: 'print', features: RM });
    const printed = await ev(`[getComputedStyle(document.getElementById('pbAfterNot')).display !== 'none',
      getComputedStyle(document.getElementById('pbAfter')).display]`);
    await send('Emulation.setEmulatedMedia', { media: '', features: RM });
    eq(`G7. ${page}: printed, the line stays and the block is left out`, printed, [true, 'none']);
  } else {
    eq(`G7. ${page}: the line, the button, then "Email me this result", shown by the script`, [p.order, p.more], [true, ['Email me this result', false, true]]);
  }
  eq(`G7. ${page}: no other booking link in the results`, p.stray, []);
  if (page === 'broker-vs-autoenrolment.html')
    eq(`G8. ${page}: the line follows the card holding "Before you rely on these rates"`, p.prevCaveat, true);
  if (['pension-calculator.html', 'director-calculator.html', 'broker-vs-autoenrolment.html'].includes(page))
    eq(`G9. ${page}: its waitcard holds no booking link`, [p.waitcards > 0, p.waitLinks], [true, 0]);
  if (page === 'director-pension-rules.html') continue;

  /* G3: the reader's own move */
  if (page === 'my-pensions.html') {
    const hit = await click('#ptValue0');
    await send('Input.insertText', { text: '40000' });
    await sleep(300);
    eq(`G3. ${page}: a trusted click on the first value and typing`, hit, true);
  } else {
    const which = await ev(`(() => {
      const r = [...document.querySelectorAll('[data-pb-calc] input[type=range]')]
        .find(e => e.id && e.id !== 'pbGuessRange' && !e.closest('.pb-guess') && e.getClientRects().length && getComputedStyle(e).visibility === 'visible');
      if (!r) return null;
      r.focus({ preventScroll: true });
      return { id: r.id, left: +r.value >= +r.max, focused: document.activeElement === r, v: r.value };
    })()`);
    if (which && which.left) await key('ArrowLeft', 37); else await key('ArrowRight', 39);
    const v = which ? await ev(`document.getElementById(${JSON.stringify(which.id)}).value`) : null;
    eq(`G3. ${page}: a trusted key moved #${which && which.id}`, !!which && which.focused && v !== which.v, true);
  }
  if (await veiled()) {
    eq(`G3. ${page}: while a figure is behind the guess, no #from=`, bare(await hrefOnFocus()), 'booking.html');
    eq(`G3. ${page}: Reveal pressed`, await click('#pbGuessGo'), true);
  }
  const h = await hrefOnFocus();
  eq(`G3. ${page}: after the reader's own move, the button says where they came from, tags kept`,
     h, 'booking.html?' + tags(page, p.variant) + '#from=' + from);
}

/* G3b: the guess card on its own is not a move of the calculator */
await open('pension-calculator.html');
await ev(`document.getElementById('pbGuessRange').focus({ preventScroll: true })`);
await key('ArrowRight', 39);
eq('G3b. pension-calculator.html: the guess slider and Reveal, nothing else: Reveal pressed', await click('#pbGuessGo'), true);
eq('G3b. pension-calculator.html: no #from=', bare(await hrefOnFocus()), 'booking.html');

/* G4: a shared link replays its figures with untrusted events */
await open('pension-calculator.html#pb=1&age=50&ret=66');
eq('G4. a shared link: its figures arrived', await ev(`[document.getElementById('age').value, document.getElementById('ret').value]`), ['50', '66']);
if (await veiled()) await click('#pbGuessGo');
eq('G4. a shared link, no reader action: no #from=', bare(await hrefOnFocus()), 'booking.html');
await ev(`document.getElementById('pot').focus({ preventScroll: true })`);
await key('ArrowRight', 39);
eq('G4. then one trusted key on #pot: the button says where they came from', bare(await hrefOnFocus()), 'booking.html#from=pension-calculator');

/* G4b: a script's event is not the reader's move either */
await open('pension-calculator.html');
if (await veiled()) await click('#pbGuessGo');
await ev(`(() => { const r = document.getElementById('pot'); r.value = String(+r.value + 5000);
  r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); })()`);
await sleep(150);
eq('G4b. an untrusted input and change on #pot, from a script: no #from=', bare(await hrefOnFocus()), 'booking.html');

/* G5: the jar sets the slider through a synthetic input after a trusted press */
await open('state-pension-reality-check.html');
if (await veiled()) await click('#pbGuessGo');
eq('G5. the reality check, the guess revealed and nothing moved: no #from=', bare(await hrefOnFocus()), 'booking.html');
const before = await ev(`document.getElementById('contribs').value`);
eq('G5. a trusted press on the jar', await click('.pb-jar-body'), true);
eq('G5. moved the contributions slider', (await ev(`document.getElementById('contribs').value`)) !== before, true);
eq('G5. and the button says where they came from', bare(await hrefOnFocus()), 'booking.html#from=state-pension-reality-check');

/* G6: no figure on screen, no claim to have seen one */
await open('state-pension-reality-check.html');
await ev(`document.getElementById('contribs').focus({ preventScroll: true })`);
await key('ArrowLeft', 37);
if (await veiled()) await click('#pbGuessGo');
eq('G6. the reality check, moved and revealed: the button says where they came from', bare(await hrefOnFocus()), 'booking.html#from=state-pension-reality-check');
await ev(`document.getElementById('contribs').focus({ preventScroll: true })`);
await key('Home', 36);
eq('G6. Home on the contributions slider: "No entitlement" shows', await ev(`[document.getElementById('contribs').value, !document.getElementById('spNone').hidden]`), ['0', true]);
eq('G6. and no #from=', bare(await hrefOnFocus()), 'booking.html');

/* G10: without JavaScript */
for (const page of ['pension-calculator.html', 'pia.html']) {
  const [from, loop] = AFTER[page];
  await open(page + '?nojs');
  const p = await ev(PARTS);
  eq(`G10. ${page} without JavaScript: the line`, [p.nots, p.notText], [1, `What this doesn${RSQ}t show: ${loop}`]);
  eq(`G10. ${page} without JavaScript: the button, wording A, plain booking.html, and its line`,
     [p.blocks, p.from, p.links, p.words, p.href, p.why], [1, from, 1, WORDS.A, 'booking.html', [WHY]]);
  eq(`G10. ${page} without JavaScript: "Email me this result" and its form stay hidden`,
     [p.more && p.more[2], await ev(`getComputedStyle(document.getElementById('ecCap')).display`)], [false, 'none']);
}

/* G11: the booking page */
const H1 = 'Book a call with us', SUB = 'Free. 20 minutes. No obligation.';
for (const [q, hash, shows, term] of [
    ['', '#from=pension-calculator', true, ''], ['', '#from=nope', false, ''], ['', '', false, ''],
    ['', '#persona=director&from=pia', true, 'director'],
    ['?utm_source=site&utm_medium=cta&utm_campaign=director-calculator&utm_content=B', '#from=director-calculator', true, 'director']]) {
  await open('booking.html' + q + hash);
  const b = await ev(`(() => { const p = document.getElementById('pbFrom'), w = document.getElementById('calWidget');
    return { line: !!p, sub: (document.querySelector('.lead .sub') || {}).textContent, h1: document.querySelector('h1').textContent,
             form: !!document.querySelector('main form'), widget: !!w, url: w ? w.getAttribute('data-url') : null,
             open: (document.getElementById('calOpenBtn') || {}).href || null, search: location.search, hash: location.hash }; })()`);
  const label = 'booking.html' + (q ? '?<tags>' : '') + (hash || ' (no hash)');
  eq(`G11. ${label}: no "seen your number" line, whatever the hash`, b.line, false);
  eq(`G11. ${label}: the heading and its one line`, [b.h1, b.sub], [H1, SUB]);
  eq(`G11. ${label}: the calendar at once, with no form before it`, [b.form, b.widget], [false, true]);
  const want = CALENDLY + '?' +
    (q ? 'utm_source=site&utm_medium=cta&utm_campaign=director-calculator&utm_content=B' : 'utm_source=pensionbuddy&utm_medium=booking-page') +
    (term ? '&utm_term=' + term : '');
  eq(`G11. ${label}: the calendar, and its fallback link, carry the tags`, [b.url, b.open], [want, want]);
  if (q) eq(`G11. ${label}: the tags are off the address, the fragment kept`, [b.search, b.hash], ['', hash]);
}

/* G12: "Email me this result" on the shared form */
await open('standard-fund-threshold.html');
const resultBefore = await ev(`(() => { const r = document.querySelector('.results .res-hero'); const b = r.getBoundingClientRect(); return [r.textContent.replace(/\s+/g, ' ').trim(), Math.round(b.top + scrollY)]; })()`);
eq('G12. the form is closed at first', await ev(`[document.getElementById('ecCap').hidden, document.getElementById('ecMore').getAttribute('aria-expanded')]`), [true, 'false']);
eq('G12. a trusted press on "Email me this result"', await click('#ecMore'), true);
eq('G12. opens the form under it', await ev(`[document.getElementById('ecCap').hidden, document.getElementById('ecMore').getAttribute('aria-expanded'),
  getComputedStyle(document.getElementById('ecForm')).display !== 'none']`), [false, 'true', true]);
eq('G12. the box is not ticked for the reader', await ev(`document.getElementById('ecConsent').checked`), false);
await ev(`window.fetch = function () { return Promise.reject(new TypeError('refused for the test')); }`);
navs.length = 0;
eq('G12. a trusted press on the send button, the form empty', await click('#ecForm button[type=submit]'), true);
eq('G12. sends nothing, and says what is missing',
   [await ev(`[document.getElementById('ecErr').hidden, document.getElementById('ecErr').textContent, document.getElementById('ecOk').hidden]`), navs.filter(u => /^mailto:/.test(u)).length],
   [[false, 'Please enter your name. Please enter a valid email address. Please tick the box if you want this result emailed to you.', true], 0]);
await click('#ecName'); await send('Input.insertText', { text: 'Test Person' });
await click('#ecEmail'); await send('Input.insertText', { text: 'test@example.com' });
await click('#ecForm button[type=submit]');
eq('G12. a name and an email but no tick: still nothing sent',
   [await ev(`document.getElementById('ecErr').textContent`), navs.filter(u => /^mailto:/.test(u)).length],
   ['Please tick the box if you want this result emailed to you.', 0]);
eq('G12. a trusted press on the box', await click('#ecConsent'), true);
await click('#ecForm button[type=submit]');
await sleep(800);
const said = await ev(`[document.getElementById('ecOkText').textContent, document.getElementById('ecOk').hidden,
  getComputedStyle(document.getElementById('ecForm')).display]`);
eq('G12. its post refused, it says the email app should have opened', said, ['Your email app should have opened with the figures ready to send to us.', false, 'none']);
const mail = navs.find(u => /^mailto:/.test(u)) || '';
function safeDecode(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
eq('G12. a pre-filled email to Damian, with the reader\'s name and address, the figures and the link',
   [mail.startsWith('mailto:hello@pensionbuddy.ie?subject=Results%20request&body='), mail.includes('test%40example.com'),
    mail.includes('Test%20Person'), mail.includes('standard-fund-threshold.html'), /Results: \S/.test(safeDecode(mail))],
   [true, true, true, true, true]);
const resultAfter = await ev(`(() => { const r = document.querySelector('.results .res-hero'); const b = r.getBoundingClientRect(); return [r.textContent.replace(/\s+/g, ' ').trim(), Math.round(b.top + scrollY)]; })()`);
eq('G12. the result stayed where it was, as it was', resultAfter, resultBefore);

/* G13: the button test and the cookie choice */
await open('pension-fees-calculator.html');
const v0 = await variant();
eq('G13. before "That\'s fine": nothing stored, and the button says this visit\'s wording',
   [await ev(`localStorage.getItem('pb-ab-cta')`), ['A', 'B'].includes(v0), await ev(`document.querySelector('#pbAfter .pb-ab-t').textContent`)],
   [null, true, WORDS[v0]]);
let seen = new Set();
for (let i = 0; i < 12 && seen.size < 2; i++) { await open('pia.html'); seen.add(await variant()); }
eq('G13. before an answer, both wordings come up across visits (each half the time)', [...seen].sort(), ['A', 'B']);
await answer(null);
await ev(`localStorage.removeItem('pb-consent'); localStorage.removeItem('pb-ab-cta')`);
await open('pia.html');
const v1 = await variant();
eq('G13. no answer yet: nothing stored', await ev(`localStorage.getItem('pb-ab-cta')`), null);
await ev(`document.querySelector('.pb-consent .pb-c-yes').click()`);
eq('G13. "That\'s fine": the pick of this visit is kept', await ev(`localStorage.getItem('pb-ab-cta')`), v1);
await answer('accepted');
for (const page of ['state-pension-entitlement.html', 'director-calculator.html']) {
  await open(page);
  eq(`G13. after "That's fine", the same wording on ${page}`, [await variant(), await ev(`document.querySelector('#pbAfter .pb-ab-t').textContent`)], [v1, WORDS[v1]]);
}
await open('privacy.html');
await ev(`document.querySelector('[data-pb-consent-reset]').click()`);
/* read in the same task as the press: with Tag Manager already running, "No
   thanks" reloads the page, and this test's own start-up script answers again */
eq('G13. "No thanks" deletes the kept pick',
   await ev(`(() => { document.querySelector('.pb-consent .pb-c-no').click(); return [localStorage.getItem('pb-consent'), localStorage.getItem('pb-ab-cta')]; })()`),
   ['rejected', null]);
await sleep(500);

/* G14: what is counted, after "That's fine" (Google is never reached: every
   host but this server resolves to nothing, so GTM's script fails to load,
   and dataLayer is read as the page wrote it) */
await answer('accepted');
await ev(`localStorage.setItem('pb-ab-cta', 'B')`);
await open('pension-calculator.html');
const events = () => ev(`(window.dataLayer || []).filter(e => e && e.event && !/^gtm/.test(e.event)).map(e => JSON.stringify(e))`);
eq('G14. nothing counted at load but the page itself', (await events()).filter(e => /calculator_complete|cta_|booking_click|email_result/.test(e)), []);
await ev(`document.getElementById('pot').focus({ preventScroll: true })`);
await key('ArrowRight', 39);
if (await veiled()) await click('#pbGuessGo');
await key('ArrowRight', 39);
await ev(`document.getElementById('pot').focus({ preventScroll: true })`);
await key('ArrowRight', 39);
await sleep(200);
const complete = (await events()).filter(e => /calculator_complete/.test(e));
eq('G14. calculator_complete once, with the calculator, the page and the wording', complete,
   [JSON.stringify({ event: 'calculator_complete', page: 'pension-calculator', variant: 'B', calculator: 'pension-calculator' })]);
await ev(`document.getElementById('pbAfter').scrollIntoView({ block: 'center', behavior: 'instant' })`);
await sleep(500);
eq('G14. cta_view once the button is on screen', (await events()).filter(e => /cta_view/.test(e)),
   [JSON.stringify({ event: 'cta_view', page: 'pension-calculator', variant: 'B', cta: 'after' })]);
await ev(`window.addEventListener('click', function (e) { if (e.target.closest('a')) e.preventDefault(); })`);
await click('#pbAfter .pb-after-btn');
eq('G14. cta_click and booking_click on a press of the button', (await events()).filter(e => /cta_click|booking_click/.test(e)),
   [JSON.stringify({ event: 'cta_click', page: 'pension-calculator', variant: 'B', cta: 'after' }),
    JSON.stringify({ event: 'booking_click', page: 'pension-calculator', variant: 'B', cta: 'after' })]);
await click('nav a.nav-cta, nav a[href^="booking.html"]');
eq('G14. booking_click alone for the nav\'s booking link', (await events()).filter(e => /cta_click|booking_click/.test(e)).slice(2),
   [JSON.stringify({ event: 'booking_click', page: 'pension-calculator', variant: 'B', cta: 'nav' })]);
await ev(`window.fetch = function () { return Promise.reject(new TypeError('refused for the test')); }`);
await click('#ecMore');
await click('#ecName'); await send('Input.insertText', { text: 'Test Person' });
await click('#ecEmail'); await send('Input.insertText', { text: 'test@example.com' });
await click('#ecConsent');
await click('#ecForm button[type=submit]');
await sleep(500);
const all = await events();
eq('G14. email_result_submit on a complete form', all.filter(e => /email_result_submit/.test(e)),
   [JSON.stringify({ event: 'email_result_submit', page: 'pension-calculator', variant: 'B', calculator: 'pension-calculator' })]);
eq('G14. no name or email in any event', all.filter(e => /Test Person|test@example/.test(e)), []);
await answer('rejected');

server.close();
console.log('\n%s  %d passed, %d failed', failed ? 'FAILURES' : 'ALL PASS', passed, failed);
cleanup();
process.exit(failed ? 1 : 0);
