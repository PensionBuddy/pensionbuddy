'use strict';
/* Run 30, R29-5: the director calculator's retirement age now runs 50 to 70
   (was 50 to 75), and so "Your age now" stops at 69 (was 70), or a
   70-year-old would get a floor of 71 above the slider's top. R29-6 adds a
   line of markup under the slider, which no script writes.

   The change is in the MARKUP, so unlike the other classifiers this one runs
   the old bounds against the new: the old side is the working tree's html
   with the two old maxima put back (checked against BASELINE_REF's html,
   which must carry exactly those two inputs) and BASELINE_REF's script; the
   new side is the working tree's html and script. Taking the old side's
   html from BASELINE_REF itself would compare nothing useful: the line
   R29-6 adds is one more element, every unnamed element after it is
   numbered one higher, and all of them read as differences. That line is
   static markup that no script writes. Every state the new sliders can
   reach is compared, and the claim is:

     the only cells that may differ are the two sliders' fills, because a
     fill is (value - min) / (max - min) and both maxima moved; no figure,
     no wording and no other attribute may differ anywhere.

   States the new page can no longer reach (age 70, or a retirement age of
   71 to 75) are counted and reported, not compared.

     BASELINE_REF=HEAD node classify-director-bounds.js [random count]

   Exits 1 if any reachable state differs anywhere but the two fills. */
const { makePage, shippedHtml } = require('./runpage');
const { PAGES, currentScript, baselineScript, BASELINE_REF, fromGit } = require('./pages');
const { compareState, lcg, pick, axisValues } = require('./compare');

const name = 'director-calculator';
const cfg = PAGES[name];
const NEW_AGE = '<input type="range" id="age" min="25" max="69" value="48">';
const NEW_RET = '<input type="range" id="ret" min="50" max="70" value="66">';
const OLD_AGE = '<input type="range" id="age" min="25" max="70" value="48">';
const OLD_RET = '<input type="range" id="ret" min="50" max="75" value="66">';
const baseHtml = fromGit(BASELINE_REF, cfg.html), newHtml = shippedHtml(cfg.html);
for (const [h, want, label] of [[baseHtml, [OLD_AGE, OLD_RET], BASELINE_REF], [newHtml, [NEW_AGE, NEW_RET], 'working tree']])
  for (const w of want)
    if (h.split(w).length !== 2) { console.log(`the ${label} html does not carry ${w} exactly once`); process.exit(1); }
const OLD = makePage({ html: newHtml.replace(NEW_AGE, OLD_AGE).replace(NEW_RET, OLD_RET), modules: cfg.modules,
                       pageScript: baselineScript(name), scriptName: name });
const NEW = makePage({ html: shippedHtml(cfg.html), modules: cfg.modules,
                       pageScript: currentScript(name), scriptName: name });

// the old page's bounds; reach() says whether the new page's own bounds allow a state
const AX = { age: [25, 70, 1], ret: [50, 75, 1], sal: [30000, 1000000, 5000],
  pot: [0, 3000000, 10000], contrib: [0, 500000, 2500], growth: [1, 8, 0.5], split: [0, 100, 5] };
const DEF = { age: 48, ret: 66, sal: 100000, pot: 150000, contrib: 40000, growth: 5, split: 100 };
const reach = s => s.age <= 69 && s.ret <= 70 && s.ret >= Math.max(50, s.age + 1);
const FILLS = new Set(['#ret style:--fill', '#age style:--fill']);

function* states(nRandom) {
  for (const id of Object.keys(AX))                       // every slider over its old range
    for (const v of axisValues(...AX[id])) yield Object.assign({}, DEF, { [id]: v });
  for (let age = 25; age <= 70; age++)                    // every age against every retirement age
    for (let ret = 50; ret <= 75; ret++) yield Object.assign({}, DEF, { age, ret });
  const rand = lcg(20260926);
  for (let i = 0; i < nRandom; i++) {
    const s = {};
    for (const id of Object.keys(AX)) s[id] = pick(rand, ...AX[id]);
    yield s;
  }
}

/* the load render too: the first paint of every slider */
const { diffRenders } = require('./runpage');
const atLoad = new Set(diffRenders(OLD.load, NEW.load).map(d => d.el + ' ' + d.prop));

const n = Number(process.argv[2] || 20000);
let total = 0, gone = 0, same = 0, fillsOnly = 0;
const where = new Map(), bad = [];
for (const s of states(n)) {
  total++;
  if (!reach(s)) { gone++; continue; }
  const { diffs } = compareState(OLD, NEW, cfg, s);
  if (!diffs.length) { same++; continue; }
  const cells = new Set(diffs.map(d => d.el + ' ' + d.prop));
  for (const c of cells) where.set(c, (where.get(c) || 0) + 1);
  if ([...cells].every(c => FILLS.has(c))) { fillsOnly++; continue; }
  if (bad.length < 8) bad.push({ s, cells: [...cells].filter(c => !FILLS.has(c)).slice(0, 6) });
}
const errs = [...OLD.errors, ...NEW.errors];
const loadBad = [...atLoad].filter(c => !FILLS.has(c));
console.log(`director-calculator, retirement 50 to 70 and age to 69, old page vs new page (${BASELINE_REF}): ${total} states, ${errs.length} errors`);
console.log(`  at load: ${atLoad.size ? [...atLoad].join(', ') : 'nothing'} differs`);
console.log(`  no longer reachable (age 70, or retirement above 70): ${gone}`);
console.log(`  reachable: ${total - gone}, identical ${same}, only the fills differ ${fillsOnly}, anything else ${bad.length ? 'SEE BELOW' : 0}`);
for (const [c, k] of where) console.log(`    ${c}: ${k} states`);
for (const b of bad) console.log(`  UNEXPECTED: ${JSON.stringify(b.s)} -> ${b.cells.join(', ')}`);
for (const c of loadBad) console.log(`  UNEXPECTED at load: ${c}`);
for (const e of errs.slice(0, 5)) console.log('  error: ' + e);
process.exit(bad.length || loadBad.length || errs.length ? 1 : 0);
