'use strict';
/* Load a PensionBuddy page script, unmodified, into a vm context behind the
   mini-DOM and the page's real calculation modules.

   The point is to run the OLD and the NEW copy of a page script side by side in
   one process, drive both through the same states, and compare what each wrote
   to the DOM. Everything here exists to make that comparison honest:

     - the DOM is built from the SHIPPED html, so ids, bounds and defaults are
       the page's own;
     - the clock is fixed, because three of the four scripts read the year at
       load and a sweep that straddled midnight would diff against itself;
     - timers are collected, not scheduled, so the debounced screen-reader
       summary can be settled on demand and compared;
     - requestAnimationFrame is drained to a fixed point, so the pension
       calculator's tweened figures are compared settled rather than mid-flight;
     - a throw anywhere is recorded rather than swallowed: an input listener
       that throws never reaches dispatchEvent, which is how a broken page can
       look clean.
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Document } = require('./minidom');

const ROOT = path.resolve(__dirname, '..', '..');

function fixedDateClass(iso) {
  const fixed = new Date(iso).getTime();
  return class FixedDate extends Date {
    constructor(...a) { if (a.length === 0) super(fixed); else super(...a); }
    static now() { return fixed; }
  };
}

function makePage(opts) {
  const {
    html,                       // the shipped page, as a string
    modules = [],               // assets/js/*.js, in load order
    pageScript,                 // the page's own script, as a string
    scriptName = 'page.js',
    now = '2026-09-16T12:00:00Z',
    reduce = true,              // matchMedia('(prefers-reduced-motion: reduce)')
  } = opts;

  const doc = new Document(html);
  const errors = [];
  const timers = [];
  let rafQueue = [];
  let timerId = 0;

  /* `window` IS the global object, as in a browser: the calculation modules
     publish themselves with `window.PBRelief = ...` and the page scripts then
     read `PBRelief` by bare name. A window that was merely a property of the
     global would break that, and only that. */
  const sandbox = {
    document: doc,
    console: { log() {}, warn() {}, error(...a) { errors.push('console.error: ' + a.join(' ')); } },
    Date: fixedDateClass(now),
    matchMedia: () => ({ matches: reduce, addEventListener() {}, addListener() {} }),
    location: { hash: '', pathname: '/page.html', search: '', href: 'http://localhost/page.html' },
    history: { replaceState() {}, pushState() {} },
    setTimeout(fn, ms) { const id = ++timerId; timers.push({ id, fn, ms }); return id; },
    clearTimeout(id) { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
    setInterval() { return 0; },
    clearInterval() {},
    requestAnimationFrame(fn) { rafQueue.push(fn); return rafQueue.length; },
    cancelAnimationFrame() {},
    IntersectionObserver: class { constructor() {} observe() {} unobserve() {} disconnect() {} },
    ResizeObserver: class { constructor() {} observe() {} unobserve() {} disconnect() {} },
    Event: class { constructor(type, o) { this.type = type; this.bubbles = !!(o && o.bubbles); } },
    fetch: () => Promise.resolve({ ok: false }),
    innerWidth: 1440,
    innerHeight: 900,
    scrollY: 0,
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);

  const runFile = (src, name) => {
    try {
      new vm.Script(src, { filename: name }).runInContext(ctx);
    } catch (e) {
      errors.push(`${name}: ${e && e.message}`);
      throw e;
    }
  };

  for (const rel of modules) {
    let src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    /* Breaking the shared runtime on purpose only affects the NEW script: the
       baseline copies predate it and never read window.PBPage. That asymmetry
       is what makes calc-page.js mutation-testable through the same sweep. */
    if (opts.sharedMutation && rel.endsWith('calc-page.js')) {
      const [find, repl] = opts.sharedMutation;
      if (!src.includes(find)) throw new Error('shared mutation not found: ' + find);
      src = src.replace(find, repl);
    }
    runFile(src, rel);
  }
  /* What the page does before anyone touches it is rendered output too: the
     first paint of every slider, the first render(), the panels the page opens
     on. Recording starts before the page script runs so that load is a
     comparable render like any other -- without this a refactor that dropped
     the initial paint entirely would sweep clean, because every later
     comparison begins after load. */
  doc.__rec = [];
  runFile(pageScript, scriptName);
  const loadLog = doc.__rec;
  doc.__rec = null;
  const loadFinal = Object.create(null);
  for (const [k, prop, value] of loadLog) loadFinal[k + '\u0000' + prop] = value;

  const page = {
    doc, ctx, errors, sandbox,

    /* the render the page performs as it loads */
    load: { final: loadFinal, log: loadLog },
    loadPending: timers.length,

    el(id) {
      const e = doc.getElementById(id);
      if (!e) throw new Error('no element #' + id + ' in ' + scriptName);
      return e;
    },
    /* set a control the way a browser does: the value lands, no event fires */
    set(id, v) { this.el(id).attributes.value = String(v); },
    setChecked(id, on) {
      const e = this.el(id);
      if (on) e.attributes.checked = ''; else delete e.attributes.checked;
    },
    get(id) { return this.el(id).attributes.value; },

    begin() { doc.__rec = []; },
    fire(id, type = 'input') {
      try {
        this.el(id).dispatchEvent({ type, bubbles: true });
      } catch (e) {
        // a throw inside a listener never reaches dispatchEvent in a browser,
        // so record it here or a broken page looks clean
        errors.push(`${scriptName}: throw in ${type} on #${id}: ${e && e.message}`);
      }
    },
    fireChange(id) { this.fire(id, 'change'); },
    click(id) { this.fire(id, 'click'); },

    /* how many timers are waiting. A page that used to write a live region
       synchronously and now debounces it differs here before it differs
       anywhere else. */
    pendingTimers() { return timers.length; },

    /* run every pending timer, shortest delay first, once */
    flushTimers() {
      const due = timers.splice(0, timers.length).sort((a, b) => a.ms - b.ms);
      for (const t of due) {
        try { t.fn(); } catch (e) { errors.push(`${scriptName}: timer threw: ${e && e.message}`); }
      }
    },
    /* settle the tween/chart loop: drain until nothing asks for another frame */
    drainRaf(cap = 4000) {
      let n = 0;
      while (rafQueue.length && n < cap) {
        const q = rafQueue; rafQueue = [];
        for (const fn of q) {
          n++;
          try { fn(16.7 * n); } catch (e) { errors.push(`${scriptName}: raf threw: ${e && e.message}`); }
        }
      }
      return n;
    },

    /* the render, as a map: the LAST value written to each cell. That is what
       a reader sees when the render is over, and it is order-insensitive on
       purpose - a reordering that leaves every cell the same is not a change
       to rendered output. The ordered log is kept alongside for reporting. */
    end() {
      const log = doc.__rec || [];
      doc.__rec = null;
      const final = Object.create(null);
      for (const [k, prop, value] of log) final[k + '\u0000' + prop] = value;
      return { final, log };
    },
  };
  return page;
}

/* the shipped page, and the page script currently inside it */
function shippedHtml(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

function inlineCalculatorScript(html) {
  const m = /<script>\s*const REDUCE=/.exec(html);
  if (!m) throw new Error('could not find the calculator script');
  const start = m.index + '<script>'.length;
  const end = html.indexOf('</script>', m.index);
  return html.slice(start, end);
}

/* ------------------------------------------------------------------ diff */

function diffRenders(a, b) {
  const keys = new Set([...Object.keys(a.final), ...Object.keys(b.final)]);
  const diffs = [];
  for (const k of keys) {
    const av = a.final[k], bv = b.final[k];
    if (av !== bv) {
      const [el, prop] = k.split('\u0000');
      diffs.push({ el, prop, old: av === undefined ? '(not written)' : av,
                   now: bv === undefined ? '(not written)' : bv });
    }
  }
  return diffs;
}

/* The final value of every cell is what a reader sees, but it is not everything
   the code did. A write that is immediately overwritten by a correct one inside
   the same event is invisible to a reader and still a difference in behaviour:
   the compare page's toggle handler repaints the sliders it reveals and then
   calc() repaints them all again, so a wrong aria-valuetext in between never
   reaches the screen, and the next edit that reorders those two lines puts it
   there. So the BAG of writes is compared as well as the final state, values
   included. Any write whose value differs is a failure even when something
   later corrects it.

   ORDER is reported but is not a failure. Every write in a handler lands before
   the browser paints or an assistive technology reads, so two independent
   groups of writes swapping places inside one synchronous handler is not a
   difference a reader can observe. It is worth knowing about, so it is counted
   and named rather than hidden. */
function bagOf(r) {
  const m = new Map();
  for (const [k, prop, value] of r.log) {
    const key = k + '\u0001' + prop + '\u0001' + String(value);
    m.set(key, (m.get(key) || 0) + 1);
  }
  return m;
}

function diffWriteBag(a, b) {
  const x = bagOf(a), y = bagOf(b);
  for (const [k, n] of x) {
    const m = y.get(k) || 0;
    if (m !== n) return { key: k.split('\u0001'), old: n, now: m };
  }
  for (const [k, m] of y) {
    if (!x.has(k)) return { key: k.split('\u0001'), old: 0, now: m };
  }
  return null;
}

function orderDiffers(a, b) {
  if (a.log.length !== b.log.length) return true;
  for (let i = 0; i < a.log.length; i++) {
    const x = a.log[i], y = b.log[i];
    if (x[0] !== y[0] || x[1] !== y[1] || x[2] !== y[2]) return true;
  }
  return false;
}

module.exports = { makePage, shippedHtml, inlineCalculatorScript, diffRenders, diffWriteBag, orderDiffers, ROOT };
