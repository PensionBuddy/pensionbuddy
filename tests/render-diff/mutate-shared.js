'use strict';
/* Does the sweep still earn its keep now that the code under test has moved?

   Every helper the four pages used to own is now one copy in
   assets/js/calc-page.js. So that is what gets broken here, one change at a
   time, and the sweep is re-run on all four pages. Anything marked `catch`
   must be caught on at least the pages listed; the two marked otherwise are
   claims this refactor makes about what CANNOT be observed, and they have to
   stay green or the claims are wrong. */
const { makePage, shippedHtml, diffRenders, diffWriteBag, orderDiffers } = require('./runpage');
const { PAGES, currentScript, baselineScript, BASELINE_REF } = require('./pages');
const { compareState, lcg, pick } = require('./compare');

const M = [
  { name: 'slider fill 100% -> 99%', catch: true,
    find: "((v - min) / (max - min)) * 100 + '%'", repl: "((v - min) / (max - min)) * 99 + '%'" },
  { name: 'aria-valuetext never set', catch: true,
    find: "el.setAttribute('aria-valuetext', ((valtext && valtext[el.id]) || euro)(v));", repl: "" },
  { name: 'euro rounds down', catch: true,
    find: "+ Math.round(v).toLocaleString('en-IE')", repl: "+ Math.floor(v).toLocaleString('en-IE')" },
  { name: 'euro2 drops its cents', catch: true,
    find: "{ minimumFractionDigits: 2, maximumFractionDigits: 2 }",
    repl: "{ minimumFractionDigits: 0, maximumFractionDigits: 0 }" },
  { name: 'num loses its thousands separator', catch: true,
    find: "var num = function (v) { return v.toLocaleString('en-IE'); };",
    repl: "var num = function (v) { return String(v); };" },
  { name: 'a year takes a thousands separator', catch: true,
    find: "var yr = function (v) { return String(v); };",
    repl: "var yr = function (v) { return num(v); };" },
  { name: 'pct to whole numbers', catch: true,
    find: "return num(Math.round(v * 10000) / 100) + '%';", repl: "return num(Math.round(v * 100)) + '%';" },
  { name: 'announce writes synchronously', catch: true,
    find: "clearTimeout(srTimer);\n    srTimer = setTimeout(function () { $('srSummary').textContent = text; }, 700);",
    repl: "clearTimeout(srTimer);\n    $('srSummary').textContent = text;" },
  { name: 'wireRanges never paints on load', catch: true,
    find: "      paintSlider(el, valtext);\n      el.addEventListener('input', function () {",
    repl: "      el.addEventListener('input', function () {" },
  { name: 'wireRanges listens for the wrong event', catch: true,
    find: "el.addEventListener('input', function () {", repl: "el.addEventListener('change', function () {" },
  { name: 'wireRanges runs the page handler before the paint', catch: false, order: true,
    find: "        paintSlider(el, valtext);\n        if (onInput) onInput(el);",
    repl: "        if (onInput) onInput(el);\n        paintSlider(el, valtext);" },

  /* the two claims the merge rests on */
  { name: 'pct 2dp -> 1dp: unreachable, every value is a multiple of 0.5%', catch: false,
    find: "return num(Math.round(v * 10000) / 100) + '%';", repl: "return num(Math.round(v * 1000) / 10) + '%';" },
  { name: 'drop the defensive `valtext &&`: no call site omits the map', catch: false,
    find: "((valtext && valtext[el.id]) || euro)(v)", repl: "((valtext[el.id]) || euro)(v)" },
];

function states(name, n) {
  const rand = lcg(90210);
  const A = {
    'pension-calculator': () => ({ age: pick(rand, 18, 70, 1), ret: pick(rand, 50, 75, 1),
      pot: pick(rand, 0, 1500000, 5000), mine: pick(rand, 0, 5000, 25),
      earn: pick(rand, 10000, 300000, 1000), emp: pick(rand, 0, 5000, 25),
      growth: pick(rand, 1, 8, 0.5), tax: rand() < 0.5 ? 20 : 40 }),
    'director-calculator': () => ({ age: pick(rand, 25, 70, 1), ret: pick(rand, 50, 75, 1),
      sal: pick(rand, 30000, 1000000, 5000), pot: pick(rand, 0, 3000000, 10000),
      contrib: pick(rand, 0, 500000, 2500), growth: pick(rand, 1, 8, 0.5) }),
    compare: () => ({ age: pick(rand, 18, 70, 1), salary: pick(rand, 20000, 250000, 1000),
      phase: pick(rand, 1, 12, 1), gross: pick(rand, 0, 50000, 250), match: pick(rand, 0, 15, 0.5),
      extra: pick(rand, 0, 2000, 5), tmatch: pick(rand, 0, 100, 5), futureOn: rand() < 0.5,
      matchOn: rand() < 0.5, tmatchOn: rand() < 0.5, status: Math.floor(rand() * 3),
      mode: rand() < 0.5 ? 1 : 2 }),
    'state-pension': () => ({ contribs: pick(rand, 0, 2080, 52), age: pick(rand, 18, 66, 1) }),
    entitlement: () => { const birth = pick(rand, 1960, 2008, 1);
      return { birth, entry: pick(rand, birth + 16, Math.min(2026, birth + 65), 1),
        paid: pick(rand, 0, 2600, 52), credited: pick(rand, 0, 1040, 52), homecaring: pick(rand, 0, 1040, 52) }; },
  }[name];
  const out = []; for (let i = 0; i < n; i++) out.push(A()); return out;
}

const N = Number(process.argv[2] || 250);
const ST = {}; for (const n of Object.keys(PAGES)) ST[n] = states(n, N);

let bad = 0;
console.log(`mutating assets/js/calc-page.js, ${N} states per page, against ${BASELINE_REF}\n`);
for (const m of M) {
  const hit = [], reord = [];
  for (const name of Object.keys(PAGES)) {
    const cfg = PAGES[name];
    const html = shippedHtml(cfg.html);
    let A, B;
    try {
      A = makePage({ html, modules: cfg.modules, pageScript: baselineScript(name), scriptName: name });
      B = makePage({ html, modules: cfg.modules, pageScript: currentScript(name), scriptName: name,
                     sharedMutation: [m.find, m.repl] });
    } catch (e) { console.log(`  FAIL  ${name}: ${m.name}: ${e.message}`); bad++; continue; }
    let d = diffRenders(A.load, B.load).length + (diffWriteBag(A.load, B.load) ? 1 : 0)
          + (A.loadPending !== B.loadPending ? 1 : 0);
    let r = orderDiffers(A.load, B.load) ? 1 : 0;
    for (const s of ST[name]) {
      const c = compareState(A, B, cfg, s);
      d += c.diffs.length; if (c.reordered) r++;
    }
    if (d) hit.push(name);
    if (r) reord.push(name);
  }
  const caught = hit.length > 0;
  const ok = m.order ? (!caught && reord.length > 0) : caught === m.catch;
  if (!ok) bad++;
  const what = m.order ? `reordered on ${reord.join(', ') || 'nothing'}, no value change`
             : caught ? `caught on ${hit.join(', ')}` : 'no page differs';
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${(m.catch ? 'must differ' : 'must NOT   ').padEnd(12)} ${what.padEnd(58)} ${m.name}`);
}
console.log(bad ? `\nFAILURES: ${bad}` : '\nthe shared runtime is covered: every break is caught, and both no-change claims hold');
process.exit(bad ? 1 : 0);
