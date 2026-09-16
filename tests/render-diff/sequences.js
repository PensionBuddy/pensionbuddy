'use strict';
/* Setting a value and re-rendering never produces the state an event handler
   produces. Three things on these pages exist only on the event path, and two
   of them are lines this refactor actually changed:

     compare   the toggle `change` handler repaints the sliders it just
               revealed with
               document.querySelectorAll('.togbody:not([hidden]) input[type=range]')
                       .forEach(paint)
               That line used to read `.forEach(paintSlider)`. Under the new
               two-argument signature a bare paintSlider would have taken the
               array INDEX as its wording map and quietly fallen back to euro
               on every revealed slider. Nothing but firing the real `change`
               event reaches it.

     compare   grossTouched: the Mode 1 contribution tracks the cost of
               auto-enrolment until the reader drags it, and goes back to
               tracking when salary or age moves. Only the input handler sets it.

     entitlement  the entry-year clamp. Moving the birth year can push the entry
               year out of bounds; syncEntryBounds() moves it and leaves a note
               that survives until the entry slider is next touched.

   So: scripted sessions of real events, both scripts driven through the same
   one, compared after every single action rather than at the end. */
const { makePage, shippedHtml } = require('./runpage');
const { PAGES, currentScript, baselineScript, BASELINE_REF } = require('./pages');
const { compareState, lcg, pick } = require('./compare');
const { diffRenders, diffWriteBag, orderDiffers } = require('./runpage');

const SLIDERS = {
  'pension-calculator': { age: [18, 70, 1], ret: [50, 75, 1], pot: [0, 1500000, 5000],
    mine: [0, 5000, 25], earn: [10000, 300000, 1000], emp: [0, 5000, 25], growth: [1, 8, 0.5] },
  'director-calculator': { age: [25, 70, 1], ret: [50, 75, 1], sal: [30000, 1000000, 5000],
    pot: [0, 3000000, 10000], contrib: [0, 500000, 2500], growth: [1, 8, 0.5] },
  compare: { age: [18, 70, 1], salary: [20000, 250000, 1000], phase: [1, 12, 1],
    gross: [0, 50000, 250], match: [0, 15, 0.5], extra: [0, 2000, 5], tmatch: [0, 100, 5] },
  'state-pension': { contribs: [0, 2080, 52], age: [18, 66, 1] },
  entitlement: { birth: [1960, 2008, 1], entry: null, paid: [0, 2600, 52],
    credited: [0, 1040, 52], homecaring: [0, 1040, 52] },
};

/* one action, applied identically to both sides */
function act(p, a) {
  switch (a.kind) {
    case 'slide':
      p.set(a.id, a.value);
      p.fire(a.id, 'input');
      break;
    case 'toggle':
      p.setChecked(a.id, a.on);
      p.fire(a.id, 'change');
      break;
    case 'tax': p.ctx.setTax(a.value); break;
    case 'status': p.ctx.setStatus(a.value); break;
    case 'mode': p.ctx.setMode(a.value, a.focus); break;
    case 'modekey':
      p.doc.querySelector('.modeseg').dispatchEvent({ type: 'keydown', key: a.key, bubbles: false });
      break;
    default: throw new Error('unknown action ' + a.kind);
  }
}

function plan(name, rand, len) {
  const ids = Object.keys(SLIDERS[name]);
  const out = [];
  let birth = 1962;
  for (let i = 0; i < len; i++) {
    const r = rand();
    if (name === 'compare' && r < 0.22) {
      out.push({ kind: 'toggle', id: ['futureOn', 'matchOn', 'tmatchOn'][Math.floor(rand() * 3)], on: rand() < 0.5 });
    } else if (name === 'compare' && r < 0.30) {
      out.push({ kind: 'status', value: Math.floor(rand() * 3) });
    } else if (name === 'compare' && r < 0.36) {
      out.push({ kind: 'mode', value: rand() < 0.5 ? 1 : 2, focus: rand() < 0.5 });
    } else if (name === 'compare' && r < 0.40) {
      out.push({ kind: 'modekey', key: ['ArrowLeft', 'ArrowRight', 'Home', 'End'][Math.floor(rand() * 4)] });
    } else if (name === 'pension-calculator' && r < 0.15) {
      out.push({ kind: 'tax', value: rand() < 0.5 ? 20 : 40 });
    } else {
      // the entitlement page's entry slider has bounds that move with birth, so
      // its range has to be worked out at the moment the action is planned
      const id = ids[Math.floor(rand() * ids.length)];
      if (name === 'entitlement' && id === 'birth') birth = pick(rand, 1960, 2008, 1);
      let range = SLIDERS[name][id];
      if (name === 'entitlement' && id === 'entry') {
        range = [birth + 16, Math.min(2026, birth + 65), 1];
        // deliberately reach outside the bounds too: the browser clamps a range
        // input, and so must anything claiming to reproduce it
        if (rand() < 0.25) range = [1960, 2026, 1];
      }
      out.push({ kind: 'slide', id, value: id === 'birth' ? birth : pick(rand, ...range) });
    }
  }
  return out;
}

function main() {
  const only = process.argv[2];
  const sessions = Number(process.argv[3] || 400);
  const len = Number(process.argv[4] || 40);
  let bad = 0;
  console.log(`event path, working tree against ${BASELINE_REF}\n`);

  for (const name of Object.keys(PAGES)) {
    if (only && only !== 'all' && only !== name) continue;
    const cfg = PAGES[name];
    const html = shippedHtml(cfg.html);
    const A = makePage({ html, modules: cfg.modules, pageScript: baselineScript(name), scriptName: name });
    const B = makePage({ html, modules: cfg.modules, pageScript: currentScript(name), scriptName: name });

    const rand = lcg(4242);
    let steps = 0, differing = 0, reordered = 0;
    const shown = [];

    for (let s = 0; s < sessions; s++) {
      for (const a of plan(name, rand, len)) {
        const snap = p => {
          p.begin();
          act(p, a);
          const sync = p.end();
          const pend = p.pendingTimers();
          p.begin();
          cfg.settle(p);
          return { sync, settled: p.end(), pend };
        };
        const x = snap(A), y = snap(B);
        steps++;
        const d = [
          ...diffRenders(x.sync, y.sync).map(z => ({ phase: 'sync', ...z })),
          ...diffRenders(x.settled, y.settled).map(z => ({ phase: 'settled', ...z })),
        ];
        if (x.pend !== y.pend) d.push({ phase: 'timers', el: '(pending)', prop: 'count', old: x.pend, now: y.pend });
        for (const ph of ['sync', 'settled']) {
          const w = diffWriteBag(x[ph], y[ph]);
          if (w) d.push({ phase: ph + ' writes', el: w.key[0], prop: w.key[1],
                          old: `${w.old} write(s) of ${JSON.stringify(w.key[2]).slice(0, 70)}`,
                          now: `${w.now} write(s) of the same` });
          if (orderDiffers(x[ph], y[ph])) reordered++;
        }
        if (d.length) {
          differing++;
          if (shown.length < 4) shown.push({ action: a, diffs: d.slice(0, 3) });
        }
      }
    }

    const errs = [...A.errors, ...B.errors];
    const ok = !differing && !errs.length;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(20)} ${sessions} sessions x ${len} events = ${steps} compared, ${differing} differing, ${reordered} reordered, ${errs.length} errors`);
    for (const e of errs.slice(0, 4)) console.log(`        error: ${e}`);
    for (const x of shown) {
      console.log(`        after ${JSON.stringify(x.action)}`);
      for (const d of x.diffs) {
        console.log(`          [${d.phase}] ${d.el} ${d.prop}`);
        console.log(`            old ${JSON.stringify(String(d.old).slice(0, 100))}`);
        console.log(`            new ${JSON.stringify(String(d.now).slice(0, 100))}`);
      }
    }
  }
  process.exit(bad ? 1 : 0);
}

main();
