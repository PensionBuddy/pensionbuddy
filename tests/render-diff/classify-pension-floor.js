'use strict';
/* Run 30, R29-9: the pension calculator's retirement age no longer goes
   below 50, as the director calculator's has not since Run 29
   (classify-director-floor.js). Not a refactor, so the claim is about WHERE
   the page differs. Every state is compared, working tree against
   BASELINE_REF, at both tax rates, and each differing one is put in a class:

     A  age 49 or over: the floor is age + 1 on both sides, so NOTHING may
        differ.
     B  age 48 or under, retirement age 50 or over (every state the sliders'
        own bounds allow): only the retirement slider's `min` and the fill it
        paints may differ, and the figures may not.
     C  age 48 or under, retirement age set below 50, which the old page let a
        reader drag to: the new page moves it to 50, so the figures differ.
        This is the fix, and the class is reported, not failed.

     BASELINE_REF=HEAD node classify-pension-floor.js [random count]

   Exits 1 if a state in A differs at all, or a state in B differs anywhere
   but the slider. */
const { makePage, shippedHtml } = require('./runpage');
const { PAGES, currentScript, baselineScript, BASELINE_REF } = require('./pages');
const { compareState, lcg, pick, axisValues } = require('./compare');

const name = 'pension-calculator';
const cfg = PAGES[name];
const html = shippedHtml(cfg.html);
const mk = src => makePage({ html, modules: cfg.modules, pageScript: src, scriptName: name });
const OLD = mk(baselineScript(name)), NEW = mk(currentScript(name));

const AX = { age: [18, 70, 1], ret: [50, 75, 1], pot: [0, 1500000, 5000], mine: [0, 5000, 25],
  earn: [10000, 300000, 1000], emp: [0, 5000, 25], growth: [1, 8, 0.5] };
const DEF = { age: 40, ret: 66, pot: 50000, mine: 300, earn: 50000, emp: 150, growth: 5, tax: 40 };
const SLIDER = new Set(['#ret min', '#ret style:--fill']);

function* states(nRandom) {
  for (const tax of [20, 40]) {
    for (const id of Object.keys(AX))                     // every slider over its range
      for (const v of axisValues(...AX[id])) yield Object.assign({}, DEF, { tax, [id]: v });
    for (let age = 18; age <= 70; age++)                  // every age against every retirement age
      for (let ret = 50; ret <= 75; ret++) yield Object.assign({}, DEF, { tax, age, ret });
    for (let age = 18; age <= 48; age++)                  // class C: below 50, as the old page allowed
      for (let ret = age + 1; ret <= 49; ret++) yield Object.assign({}, DEF, { tax, age, ret });
  }
  const rand = lcg(20260926);
  for (let i = 0; i < nRandom; i++) {
    const s = { tax: rand() < 0.5 ? 20 : 40 };
    for (const id of Object.keys(AX)) s[id] = pick(rand, ...AX[id]);
    yield s;
  }
}

const n = Number(process.argv[2] || 20000);
const count = { A: [0, 0], B: [0, 0], C: [0, 0] };
const bad = [];
let total = 0;
for (const s of states(n)) {
  total++;
  const cls = s.age >= 49 ? 'A' : s.ret >= 50 ? 'B' : 'C';
  const { diffs } = compareState(OLD, NEW, cfg, s);
  count[cls][0]++;
  if (!diffs.length) continue;
  count[cls][1]++;
  const where = new Set(diffs.map(d => d.el + ' ' + d.prop));
  if (cls === 'A' || (cls === 'B' && [...where].some(k => !SLIDER.has(k)))) {
    if (bad.length < 8) bad.push({ cls, s, where: [...where].slice(0, 6) });
  }
}
const errs = [...OLD.errors, ...NEW.errors];
console.log(`pension-calculator, the retirement-age floor, working tree vs ${BASELINE_REF}: ${total} states, ${errs.length} errors`);
for (const c of ['A', 'B', 'C'])
  console.log(`  class ${c}: ${count[c][0]} states, ${count[c][1]} differing`);
for (const b of bad) console.log(`  UNEXPECTED in ${b.cls}: ${JSON.stringify(b.s)} -> ${b.where.join(', ')}`);
for (const e of errs.slice(0, 5)) console.log('  error: ' + e);
process.exit(bad.length || errs.length ? 1 : 0);
