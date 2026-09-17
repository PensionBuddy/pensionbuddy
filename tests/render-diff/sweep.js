'use strict';
/* The render-diff sweep: the old page script and the new one, driven through
   the same states, compared after each.

   Two of the four pages have an input space small enough to walk in full. Two
   do not, by a very long way, so those get a stratified sweep instead and the
   report says exactly what that covered and what it did not. An honest "3.1
   million of 1.2e13" beats a green tick that implies more than was done.

     node sweep.js state-pension --exhaustive
     node sweep.js entitlement --exhaustive --birth 1960:1970
     node sweep.js pension-calculator --axes --corners --random 500000
     node sweep.js compare --axes --corners --random 500000
*/
const { makePage, shippedHtml } = require('./runpage');
const { PAGES, currentScript, baselineScript, BASELINE_REF } = require('./pages');
const { compareState, lcg, pick, axisValues } = require('./compare');

const AXES = {
  'pension-calculator': {
    age: [18, 70, 1], ret: [50, 75, 1], pot: [0, 1500000, 5000], mine: [0, 5000, 25],
    earn: [10000, 300000, 1000], emp: [0, 5000, 25], growth: [1, 8, 0.5],
  },
  'director-calculator': {
    age: [25, 70, 1], ret: [50, 75, 1], sal: [30000, 1000000, 5000],
    pot: [0, 3000000, 10000], contrib: [0, 500000, 2500], growth: [1, 8, 0.5],
  },
  compare: {
    age: [18, 70, 1], salary: [20000, 250000, 1000], phase: [1, 12, 1],
    gross: [0, 50000, 250], match: [0, 15, 0.5], extra: [0, 2000, 5], tmatch: [0, 100, 5],
  },
  'state-pension': { contribs: [0, 2080, 52], age: [18, 66, 1] },
  entitlement: {
    birth: [1960, 2008, 1], paid: [0, 2600, 52], credited: [0, 1040, 52], homecaring: [0, 1040, 52],
  },
};

const DEFAULTS = {
  'pension-calculator': { age: 40, ret: 66, pot: 50000, mine: 300, earn: 50000, emp: 150, growth: 5, tax: 40 },
  'director-calculator': { age: 48, ret: 66, sal: 100000, pot: 150000, contrib: 40000, growth: 5 },
  compare: { age: 35, salary: 50000, phase: 1, gross: 0, match: 0, extra: 0, tmatch: 0,
             futureOn: false, matchOn: false, tmatchOn: false, status: 0, mode: 1 },
  'state-pension': { contribs: 2080, age: 40 },
  entitlement: { birth: 1962, entry: 1985, paid: 1560, credited: 260, homecaring: 0 },
};

/* the non-slider controls, which multiply the space and are always walked in
   full because they are few */
const FLAGS = {
  'pension-calculator': [{ tax: 20 }, { tax: 40 }],
  'director-calculator': [{}],
  compare: (() => {
    const out = [];
    for (const futureOn of [false, true])
      for (const matchOn of [false, true])
        for (const tmatchOn of [false, true])
          for (const status of [0, 1, 2])
            for (const mode of [1, 2]) out.push({ futureOn, matchOn, tmatchOn, status, mode });
    return out;
  })(),
  'state-pension': [{}],
  entitlement: [{}],
};

function entryRange(birth) {
  return [birth + 16, Math.min(2026, birth + 65)];
}

function* exhaustive(name, opts) {
  const A = AXES[name];
  if (name === 'state-pension') {
    for (const contribs of axisValues(...A.contribs))
      for (const age of axisValues(...A.age)) yield { contribs, age };
    return;
  }
  if (name === 'entitlement') {
    const [b0, b1] = opts.birth || [A.birth[0], A.birth[1]];
    for (let birth = b0; birth <= b1; birth++) {
      const [e0, e1] = entryRange(birth);
      for (let entry = e0; entry <= e1; entry++)
        for (const paid of axisValues(...A.paid))
          for (const credited of axisValues(...A.credited))
            for (const homecaring of axisValues(...A.homecaring))
              yield { birth, entry, paid, credited, homecaring };
    }
    return;
  }
  throw new Error('no exhaustive plan for ' + name);
}

/* one slider swept over its whole range, everything else at the page default:
   the sweep that would catch a formatter applied to the wrong control */
function* perAxis(name) {
  const A = AXES[name], base = DEFAULTS[name];
  for (const id of Object.keys(A)) {
    for (const v of axisValues(...A[id])) {
      const s = Object.assign({}, base);
      s[id] = v;
      if (name === 'entitlement' && id === 'birth') {
        const [e0, e1] = entryRange(v);
        s.entry = Math.min(Math.max(base.entry, e0), e1);
      }
      yield s;
    }
  }
}

/* every slider at its minimum, maximum or default, all combinations: the
   corners are where rounding, capping and division by zero live */
function* corners(name) {
  const A = AXES[name], base = DEFAULTS[name], ids = Object.keys(A);
  const opts = ids.map(id => [A[id][0], A[id][1], base[id]]);
  const total = opts.reduce((n, o) => n * o.length, 1);
  for (let i = 0; i < total; i++) {
    const s = Object.assign({}, base);
    let k = i;
    for (let j = 0; j < ids.length; j++) { s[ids[j]] = opts[j][k % 3]; k = (k / 3) | 0; }
    if (name === 'entitlement') {
      const [e0, e1] = entryRange(s.birth);
      s.entry = [e0, e1, Math.min(Math.max(base.entry, e0), e1)][i % 3];
    }
    yield s;
  }
}

function* random(name, n, seed) {
  const rand = lcg(seed);
  const A = AXES[name];
  for (let i = 0; i < n; i++) {
    const s = {};
    for (const id of Object.keys(A)) s[id] = pick(rand, ...A[id]);
    if (name === 'entitlement') {
      const [e0, e1] = entryRange(s.birth);
      s.entry = pick(rand, e0, e1, 1);
    }
    yield s;
  }
}

/* ------------------------------------------------------------------ main */

function parse(argv) {
  const o = { name: argv[0], modes: [], random: 0, seed: 20260916, birth: null, quiet: false };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--exhaustive' || a === '--axes' || a === '--corners') o.modes.push(a.slice(2));
    else if (a === '--random') { o.modes.push('random'); o.random = Number(argv[++i]); }
    else if (a === '--seed') o.seed = Number(argv[++i]);
    else if (a === '--birth') o.birth = argv[++i].split(':').map(Number);
    else if (a === '--quiet') o.quiet = true;
  }
  if (!o.modes.length) o.modes = ['axes', 'corners'];
  return o;
}

function main() {
  const o = parse(process.argv.slice(2));
  const cfg = PAGES[o.name];
  if (!cfg) { console.error('unknown page: ' + o.name); process.exit(2); }

  const html = shippedHtml(cfg.html);
  const mk = src => makePage({ html, modules: cfg.modules, pageScript: src, scriptName: o.name });
  const A = mk(baselineScript(o.name));
  const B = mk(currentScript(o.name));

  const flags = FLAGS[o.name];
  let n = 0, bad = 0, reord = 0;
  const shown = [];
  const t0 = process.hrtime.bigint();

  const gens = {
    exhaustive: () => exhaustive(o.name, o),
    axes: () => perAxis(o.name),
    corners: () => corners(o.name),
    random: () => random(o.name, o.random, o.seed),
  };

  for (const mode of o.modes) {
    for (const base of gens[mode]()) {
      for (const f of flags) {
        const state = Object.assign({}, DEFAULTS[o.name], base, f);
        const { diffs, reordered } = compareState(A, B, cfg, state);
        n++;
        if (reordered) reord++;
        if (diffs.length) {
          bad++;
          if (shown.length < 5) shown.push({ state, diffs: diffs.slice(0, 4) });
        }
      }
    }
  }

  const secs = Number(process.hrtime.bigint() - t0) / 1e9;
  const errs = [...A.errors, ...B.errors];
  const label = `${o.name} [${o.modes.join('+')}${o.birth ? ' birth ' + o.birth.join(':') : ''}] vs ${BASELINE_REF}`;
  console.log(`${bad || errs.length ? 'FAIL' : 'ok  '}  ${label.padEnd(46)} ${n} states, ${bad} differing, ` +
              `${reord} reordered, ${errs.length} errors, ${secs.toFixed(1)}s`);
  for (const e of errs.slice(0, 5)) console.log(`        error: ${e}`);
  for (const x of shown) {
    console.log(`        at ${JSON.stringify(x.state)}`);
    for (const d of x.diffs) {
      console.log(`          [${d.phase}] ${d.el} ${d.prop}`);
      console.log(`            old ${JSON.stringify(String(d.old).slice(0, 110))}`);
      console.log(`            new ${JSON.stringify(String(d.now).slice(0, 110))}`);
    }
  }
  process.exit(bad || errs.length ? 1 : 0);
}

main();
