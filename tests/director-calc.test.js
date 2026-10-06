/* Acceptance tests for assets/js/director-calc.js: the director
   calculator's split, its steps, the funding limit, the company tax and the
   cost of waiting (Job 5).

   Runs BOTH ways with no build step:
       node tests/director-calc.test.js
       python3 tests/run-tests.py director-calc      (headless Chrome)

   At 4.35% PRSI a euro of salary loses 52.35%: 40% income tax, 8% USC. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('director-calc');
  var group = t.group;
  /* strict (===); arrays and objects compared as JSON */
  function eq(label, a, b) { return (a !== null && typeof a === 'object') ? t.eq(label, JSON.stringify(a), JSON.stringify(b)) : t.eq(label, a, b); }
  var D = isNode ? require('../assets/js/director-calc.js') : root.PBDirector;
  var A = isNode ? require('../assets/js/pb-assumptions.js') : root.PBAssume;
  var P = 0.0435;
  var r = function (v) { return Math.round(v); };

  group('1  the rates');
  eq('1. 40% income tax, 8% USC, 12.5% company tax, two-thirds', [D.INCOME_TAX, D.USC, D.CT, D.LIMIT], [0.40, 0.08, 0.125, 2 / 3]);
  eq('1. the share of a salary euro you keep at 4.35% PRSI', Math.round(D.keepRate(P) * 10000), 4765);

  group('2  the split, in steps of 10%');
  var S = D.steps(40000, P);
  eq('2. eleven steps, 0% to 100%', S.map(function (s) { return s.pct; }), [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  eq('2. take home as salary, after tax', S.map(function (s) { return r(s.takeHome); }),
     [19060, 17154, 15248, 13342, 11436, 9530, 7624, 5718, 3812, 1906, 0]);
  eq('2. into your pension', S.map(function (s) { return r(s.toPension); }),
     [0, 4000, 8000, 12000, 16000, 20000, 24000, 28000, 32000, 36000, 40000]);
  eq('2. tax saved: 52.35% of the pension part', S.map(function (s) { return r(s.taxSaved); }),
     [0, 2094, 4188, 6282, 8376, 10470, 12564, 14658, 16752, 18846, 20940]);
  eq('2. company tax: 12.5% of the whole, the same at every step', S.map(function (s) { return r(s.companyTax); }),
     [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000]);
  eq('2. at every step the money adds up: salary part + pension part = what the company pays',
     S.every(function (s) { return Math.abs(s.asSalary + s.toPension - 40000) < 1e-6; }), true);
  eq('2. at every step take home + tax on the salary part = the salary part',
     S.every(function (s) { return Math.abs(s.takeHome + s.asSalary * (0.48 + P) - s.asSalary) < 1e-6; }), true);
  eq('2. 20%: you keep €15,248 now, your pension gets €8,000', [r(D.split(40000, 20, P).takeHome), r(D.split(40000, 20, P).toPension)], [15248, 8000]);
  eq('2. before 1 October 2026, at 4.2%: 50% keeps €9,560', r(D.split(40000, 50, 0.042).takeHome), 9560);
  eq('2. nothing from the company, nothing anywhere', D.split(0, 50, P).takeHome + D.split(0, 50, P).toPension + D.split(0, 50, P).companyTax, 0);

  group('3  the pot, the funding limit and the company tax');
  eq('3. the default pot, 5% (level 4) from 48 to 66', r(D.project(18 * 12, 150000, 40000 / 12, D.monthlyRate(A.level(4).rate))), 1511849);
  eq('3. no growth: the payments added up', r(D.project(120, 0, 100, 0)), 12000);
  eq('3. the funding limit: two-thirds of €100,000', r(D.funding(100000).pension), 66667);
  eq('3. company tax: €40,000 for 18 years', D.companyTax(40000, 18), 90000);
  eq('3. no years, no tax', D.companyTax(40000, -1), 0);

  group('4  the cost of waiting, in today\'s money');
  var w1 = D.waiting({ pot: 150000, yearly: 40000, years: 18, delay: 1, rate: 0.05, today: A.today });
  eq('4. a year\'s wait: the gap, and in today\'s money', [r(w1.gap), r(w1.gapToday)], [93763, 65649]);
  eq('4. today\'s money is the gap / 1.02^18', r(w1.gapToday), r(A.today(w1.gap, 18)));
  var gaps = [];
  for (var d = 1; d <= 10; d++) gaps.push(D.waiting({ pot: 150000, yearly: 40000, years: 18, delay: d, rate: 0.05, today: A.today }).gapToday);
  eq('4. a longer wait always costs more', gaps.every(function (g, i) { return i === 0 || g > gaps[i - 1]; }), true);
  eq('4. the pot already there is not counted in the gap', r(D.waiting({ pot: 500000, yearly: 0, years: 18, delay: 5, rate: 0.05, today: A.today }).gap), 0);
  eq('4. no growth: the gap is the payments not made', r(D.waiting({ pot: 0, yearly: 12000, years: 10, delay: 2, rate: 0, today: function (v) { return v; } }).gap), 24000);
}(this));
