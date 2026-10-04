#!/usr/bin/env node
/* Give, then ask: under each calculator's result (Run 43, items 5a, 5b, 5c
   and 5e), on real frames with real, trusted input.

       node tests/give-then-ask.test.mjs            # the working tree
       node tests/give-then-ask.test.mjs <root>     # any checkout

   One headless Chrome, driven over the DevTools protocol (Node 24: global
   fetch and WebSocket, no packages), as tests/floating-chrome.test.mjs is:
   a 1440x900 window, the analytics choice already answered ("No thanks",
   stored before any script runs), the Google Fonts links left out. Keys and
   mouse presses go in through Input.dispatch*, so the page sees them as a
   reader's own (event.isTrusted), which is what assets/js/pb-after.js asks
   for before the booking link may say where the reader came from.

   What it proves:
     G1  on each of the nine calculators: one "What this doesn't show" line,
         word for word, and one block: "Want to go through this with
         Damian?", one booking link with its words, and the reason
         (pagebuild.REASON)
     G2  at load the link is plain booking.html
     G3  after a trusted move of one of the calculator's own controls, the
         link stays plain while a figure is behind "Take a guess first", and
         is booking.html#from=<calculator> once the figure is revealed
     G3b the guess slider and Reveal on their own do not count as a move
     G4  a shared link replaying its figures is not the reader's move; one
         trusted key afterwards is
     G4b nor is an input event a script fires later
     G5  the reality check's jar: a trusted press on it is the reader's move
     G6  the reality check showing no figure ("No entitlement"): plain link
     G7  in page order: the line, the email offer, the ask (my-pensions: its
         print button first); no other booking link in the results
     G7b my-pensions printed: the line prints, the ask does not
     G8  the comparison: the line follows the card holding its rates caveat
     G9  the waitcards hold no booking link
     G10 without JavaScript, G1 and G2 hold
     G11 booking.html shows its line only for #from= naming a calculator
     G12 the shared form, its post refused: a pre-filled email, and it says so
     G13 the shared form has no checkbox
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

/* the reason line's words, from its one definition (tools/pagebuild.py REASON) */
const pb = readFileSync(join(ROOT, 'tools', 'pagebuild.py'), 'utf8');
const REASON = (/^REASON = '<p class="pb-why">([^<]*)<\/p>'$/m.exec(pb) || [])[1];
if (!REASON) { console.log('  FAIL no REASON in tools/pagebuild.py'); process.exit(1); }

const RSQ = '’';
const TALK = 'Talk it through, free';
/* page: [data-pb-from, what it does not show, the link's words] */
const AFTER = {
  'pension-calculator.html': ['pension-calculator', 'product charges, inflation, the tax on your income when you draw it.', TALK],
  'director-calculator.html': ['director-calculator', `your company${RSQ}s exact funding limit, product charges, inflation.`, TALK],
  'broker-vs-autoenrolment.html': ['broker-vs-autoenrolment', `your old pensions, product charges, your employer${RSQ}s own scheme.`, 'Talk through what this means for you'],
  'pension-fees-calculator.html': ['pension-fees-calculator', 'policy, set-up and exit charges, the terms an older plan may carry, your tax relief.', TALK],
  'state-pension-reality-check.html': ['state-pension-reality-check', `your old pensions, your tax position, your employer${RSQ}s scheme.`, TALK],
  'state-pension-entitlement.html': ['state-pension-entitlement', `your old pensions, your tax position, your employer${RSQ}s scheme.`, TALK],
  'standard-fund-threshold.html': ['standard-fund-threshold', 'what your pensions are worth, your tax position, a Personal Fund Threshold you may hold.', TALK],
  'pia.html': ['pia', `your old pensions, fees and charges, your employer${RSQ}s scheme.`, TALK],
  'my-pensions.html': ['my-pensions', 'what your pensions could grow to, your tax position, the terms each one carries.', TALK],
};
/* Damian's words (Run 43, 4 October 2026) */
const FROM_LINE = `You${RSQ}ve seen your number. Last step: 20 minutes with Damian.`;

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
await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('pb-consent','rejected')}catch(e){}" });

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

/* G1, G2, G7, G9 and G13 read the page as it loads */
const PARTS = `(() => {
  const t = el => el ? el.textContent.replace(/\\s+/g, ' ').trim() : null;
  const not = document.querySelectorAll('#pbAfterNot'), blk = document.querySelectorAll('#pbAfter');
  const b = blk[0], links = b ? b.querySelectorAll('a[href^="booking.html"]') : [];
  const before = (x, y) => !!x && !!y && !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
  const res = document.querySelector('.results') || document.getElementById('ptSum');
  const shown = e => e.getClientRects().length && getComputedStyle(e).visibility === 'visible';
  const stray = res ? [...res.querySelectorAll('a[href^="booking.html"]')].filter(a => shown(a) && !a.closest('#pbAfter')).map(a => t(a)) : ['no results'];
  const prev = not[0] ? not[0].previousElementSibling : null;
  return {
    nots: not.length, notText: t(not[0]), notCaveat: !!not[0] && not[0].classList.contains('pb-caveat'),
    blocks: blk.length, from: b ? b.getAttribute('data-pb-from') : null,
    q: t(b && b.querySelector('.pb-after-q')), links: links.length, words: t(links[0]),
    why: [...(b ? b.querySelectorAll('p.pb-why') : [])].map(t),
    href: links[0] ? links[0].getAttribute('href') : null,
    order: before(not[0], document.getElementById('ecForm')) && before(document.getElementById('ecForm'), links[0]),
    printFirst: before(document.getElementById('ptPrint'), not[0]) && before(not[0], links[0]),
    stray,
    prevCaveat: !!prev && prev.classList.contains('chart-card') && !!prev.querySelector('.srcwarn'),
    waitLinks: document.querySelectorAll('.waitcard a.wlink, .waitcard a[href^="booking"]').length,
    waitcards: document.querySelectorAll('.waitcard').length,
    shared: !!document.querySelector('form[name="calculator-results"]'),
    boxes: document.querySelectorAll('#ecForm input[type=checkbox]').length,
  };
})()`;

for (const [page, [from, loop, words]] of Object.entries(AFTER)) {
  await open(page);
  const p = await ev(PARTS);
  eq(`G1. ${page}: one line, "What this doesn${RSQ}t show: ${loop.slice(0, 30)}...", a caveat`,
     [p.nots, p.notText, p.notCaveat], [1, `What this doesn${RSQ}t show: ${loop}`, true]);
  eq(`G1. ${page}: one block, its question, one booking link ("${words}") and the reason`,
     [p.blocks, p.from, p.q, p.links, p.words, p.why], [1, from, 'Want to go through this with Damian?', 1, words, [REASON]]);
  eq(`G2. ${page}: at load the link is plain booking.html`, p.href, 'booking.html');
  if (page === 'my-pensions.html') {
    eq(`G7. ${page}: "Print or save this list", then the line, then the ask`, p.printFirst, true);
    /* G7b: the printout is the reader's own list: the line prints, the ask does not */
    const RM = [{ name: 'prefers-reduced-motion', value: 'reduce' }];
    await send('Emulation.setEmulatedMedia', { media: 'print', features: RM });
    const printed = await ev(`[getComputedStyle(document.getElementById('pbAfterNot')).display !== 'none',
      getComputedStyle(document.getElementById('pbAfter')).display]`);
    await send('Emulation.setEmulatedMedia', { media: '', features: RM });
    eq(`G7b. ${page}: printed, the line stays and the ask is left out`, printed, [true, 'none']);
  } else {
    eq(`G7. ${page}: the line, then the email offer, then the ask`, p.order, true);
    eq(`G13. ${page}: ${p.shared ? 'the shared form' : 'its own form'}${p.shared ? ' has no checkbox' : ''}`,
       p.shared ? p.boxes : 'own', p.shared ? 0 : 'own');
  }
  eq(`G7. ${page}: no other booking link in the results`, p.stray, []);
  if (page === 'broker-vs-autoenrolment.html')
    eq(`G8. ${page}: the line follows the card holding "Before you rely on these rates"`, p.prevCaveat, true);
  if (['pension-calculator.html', 'director-calculator.html', 'broker-vs-autoenrolment.html'].includes(page))
    eq(`G9. ${page}: its waitcard holds no booking link`, [p.waitcards > 0, p.waitLinks], [true, 0]);

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
    eq(`G3. ${page}: while a figure is behind the guess, the link stays plain`, await hrefOnFocus(), 'booking.html');
    eq(`G3. ${page}: Reveal pressed`, await click('#pbGuessGo'), true);
  }
  eq(`G3. ${page}: after the reader's own move, the link says where they came from`, await hrefOnFocus(), 'booking.html#from=' + from);
}

/* G3b: the guess card on its own is not a move of the calculator */
await open('pension-calculator.html');
await ev(`document.getElementById('pbGuessRange').focus({ preventScroll: true })`);
await key('ArrowRight', 39);
eq('G3b. pension-calculator.html: the guess slider and Reveal, nothing else: Reveal pressed', await click('#pbGuessGo'), true);
eq('G3b. pension-calculator.html: the link stays plain', await hrefOnFocus(), 'booking.html');

/* G4: a shared link replays its figures with untrusted events */
await open('pension-calculator.html#pb=1&age=50&ret=66');
eq('G4. a shared link: its figures arrived', await ev(`[document.getElementById('age').value, document.getElementById('ret').value]`), ['50', '66']);
if (await veiled()) await click('#pbGuessGo');
eq('G4. a shared link, no reader action: the link stays plain', await hrefOnFocus(), 'booking.html');
await ev(`document.getElementById('pot').focus({ preventScroll: true })`);
await key('ArrowRight', 39);
eq('G4. then one trusted key on #pot: the link says where they came from', await hrefOnFocus(), 'booking.html#from=pension-calculator');

/* G4b: a script's event is not the reader's move either. pb-share.js replays
   a shared link before pb-after.js has loaded, so the replay above is never
   heard at all; this is the rule itself, for any script that fires one later */
await open('pension-calculator.html');
if (await veiled()) await click('#pbGuessGo');
await ev(`(() => { const r = document.getElementById('pot'); r.value = String(+r.value + 5000);
  r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); })()`);
await sleep(150);
eq('G4b. an untrusted input and change on #pot, from a script: the link stays plain', await hrefOnFocus(), 'booking.html');

/* G5: the jar sets the slider through a synthetic input after a trusted press */
await open('state-pension-reality-check.html');
if (await veiled()) await click('#pbGuessGo');
eq('G5. the reality check, the guess revealed and nothing moved: plain', await hrefOnFocus(), 'booking.html');
const before = await ev(`document.getElementById('contribs').value`);
eq('G5. a trusted press on the jar', await click('.pb-jar-body'), true);
eq('G5. moved the contributions slider', (await ev(`document.getElementById('contribs').value`)) !== before, true);
eq('G5. and the link says where they came from', await hrefOnFocus(), 'booking.html#from=state-pension-reality-check');

/* G6: no figure on screen, no claim to have seen one */
await open('state-pension-reality-check.html');
await ev(`document.getElementById('contribs').focus({ preventScroll: true })`);
await key('ArrowLeft', 37);
if (await veiled()) await click('#pbGuessGo');
eq('G6. the reality check, moved and revealed: the link says where they came from', await hrefOnFocus(), 'booking.html#from=state-pension-reality-check');
await ev(`document.getElementById('contribs').focus({ preventScroll: true })`);
await key('Home', 36);
eq('G6. Home on the contributions slider: "No entitlement" shows', await ev(`[document.getElementById('contribs').value, !document.getElementById('spNone').hidden]`), ['0', true]);
eq('G6. and the link is plain booking.html', await hrefOnFocus(), 'booking.html');

/* G10: without JavaScript */
for (const page of ['pension-calculator.html', 'pia.html']) {
  const [from, loop, words] = AFTER[page];
  await open(page + '?nojs');
  const p = await ev(PARTS);
  eq(`G10. ${page} without JavaScript: the line`, [p.nots, p.notText], [1, `What this doesn${RSQ}t show: ${loop}`]);
  eq(`G10. ${page} without JavaScript: the block`, [p.blocks, p.from, p.q, p.links, p.words, p.why], [1, from, 'Want to go through this with Damian?', 1, words, [REASON]]);
  eq(`G10. ${page} without JavaScript: plain booking.html`, p.href, 'booking.html');
}

/* G11: the booking page */
const H1 = "You've been meaning to sort the pension. Twenty minutes with Damian starts it.";
for (const [hash, shows] of [['#from=pension-calculator', true], ['#from=nope', false], ['', false], ['#persona=director&from=pia', true]]) {
  await open('booking.html' + hash);
  const b = await ev(`(() => { const p = document.getElementById('pbFrom'), d = document.getElementById('pDirector');
    return { display: p ? getComputedStyle(p).display : null, text: p ? p.textContent : null, h1: document.querySelector('h1').textContent,
             director: !!d && d.checked }; })()`);
  eq(`G11. booking.html${hash || ' (no hash)'}: the line ${shows ? 'shows' : 'is display:none'}`,
     shows ? [b.display !== 'none', b.text] : b.display, shows ? [true, FROM_LINE] : 'none');
  eq(`G11. booking.html${hash || ' (no hash)'}: the h1 unchanged`, b.h1, H1);
  if (hash.includes('persona')) eq('G11. and #persona=director still ticks Director', b.director, true);
}

/* G12: the shared form, its post refused */
await open('standard-fund-threshold.html');
await ev(`window.fetch = function () { return Promise.reject(new TypeError('refused for the test')); }`);
navs.length = 0;
eq('G12. a trusted click into the email field', await click('#ecEmail'), true);
await send('Input.insertText', { text: 'test@example.com' });
eq('G12. a trusted press on "Email me my results"', await click('#ecForm button[type=submit]'), true);
await sleep(800);
const said = await ev(`[document.getElementById('ecOkText').textContent, document.getElementById('ecOk').classList.contains('show'),
  getComputedStyle(document.getElementById('ecForm')).display]`);
eq('G12. it says the email app should have opened', said, ['Your email app should have opened with the figures ready to send to Damian.', true, 'none']);
const mail = navs.find(u => /^mailto:/.test(u)) || '';
function safeDecode(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
eq('G12. a pre-filled email to Damian, with the reader\'s address, the figures and the link',
   [mail.startsWith('mailto:hello@pensionbuddy.ie?subject=Results%20request&body='), mail.includes('test%40example.com'),
    mail.includes('standard-fund-threshold.html'), /Results: \S/.test(safeDecode(mail))],
   [true, true, true, true]);

server.close();
console.log('\n%s  %d passed, %d failed', failed ? 'FAILURES' : 'ALL PASS', passed, failed);
cleanup();
process.exit(failed ? 1 : 0);
