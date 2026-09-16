'use strict';
/* One state, driven through two copies of a page script, compared twice.

   TWICE is the point. The synchronous snapshot is taken the moment the input
   listener returns, before any timer runs; the settled one after the timers and
   the animation frames have been drained. A live region that used to be written
   synchronously and is now written on a 700ms debounce leaves the settled
   snapshots identical and the synchronous ones different, so comparing only the
   settled state would call that refactor clean. It is not clean, and this is
   where it shows up. */
const { diffRenders, diffWriteBag, orderDiffers } = require('./runpage');

function runState(page, cfg, state) {
  page.begin();
  cfg.apply.call(cfg, page, state);
  page.fire(cfg.driver);
  const sync = page.end();
  const pending = page.pendingTimers();

  page.begin();
  cfg.settle(page);
  const settled = page.end();
  return { sync, settled, pending };
}

/* Drive both sides through the same state and report every way they differ. */
function compareState(A, B, cfg, state) {
  const a = runState(A, cfg, state);
  const b = runState(B, cfg, state);
  const out = [];

  for (const phase of ['sync', 'settled']) {
    for (const d of diffRenders(a[phase], b[phase])) {
      out.push({ phase, ...d });
    }
  }
  if (a.pending !== b.pending) {
    out.push({ phase: 'timers', el: '(pending timers)', prop: 'count',
               old: String(a.pending), now: String(b.pending) });
  }
  let reordered = false;
  for (const phase of ['sync', 'settled']) {
    const w = diffWriteBag(a[phase], b[phase]);
    if (w) {
      out.push({ phase: phase + ' writes', el: w.key[0], prop: w.key[1],
                 old: `${w.old} write(s) of ${JSON.stringify(w.key[2]).slice(0, 80)}`,
                 now: `${w.now} write(s) of the same` });
    }
    if (orderDiffers(a[phase], b[phase])) reordered = true;
  }
  return { diffs: out, reordered };
}

/* A deterministic pseudo-random stream. Math.random would make a failing sweep
   impossible to re-run, and a sweep you cannot re-run cannot be bisected. */
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pick(rand, min, max, step) {
  const n = Math.floor((max - min) / step) + 1;
  return min + Math.min(n - 1, Math.floor(rand() * n)) * step;
}

function axisValues(min, max, step) {
  const out = [];
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

module.exports = { runState, compareState, lcg, pick, axisValues };
