/* Acceptance tests for assets/js/pb-assumptions.js: the rates every
   calculator assumes, the seven risk levels and today's money (Job 5).

   Runs BOTH ways with no build step:
       node tests/assumptions.test.js
       python3 tests/run-tests.py assumptions      (headless Chrome)

   Every figure here is the one the source states; the test fails if a rate
   loses its source, if a level stops rising with the one below it, or if
   today's money stops being value / 1.02^years. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('assumptions');
  var group = t.group;
  /* strict (===); arrays and objects compared as JSON */
  function eq(label, a, b) { return (a !== null && typeof a === 'object') ? t.eq(label, JSON.stringify(a), JSON.stringify(b)) : t.eq(label, a, b); }
  var A = isNode ? require('../assets/js/pb-assumptions.js') : root.PBAssume;

  group('1  the rates and their sources');
  eq('1. inflation: the ECB target, 2%', A.inflation.rate, 0.02);
  eq('1. said as 2%', A.inflation.pct, '2%');
  eq('1. cash: 0.15% a year', A.cash.rate, 0.0015);
  eq('1. cash: dated', A.cash.month, 'July 2026');
  eq('1. the Pensions Authority maximums: shares 6.65%, bonds 3.40%, cash 2.65%, 6% overall',
     [A.assets.shares, A.assets.bonds, A.assets.cash, A.assets.cap], [0.0665, 0.034, 0.0265, 0.06]);
  ['inflation', 'cash', 'assets', 'bands', 'mixes'].forEach(function (k) {
    eq('1. a source for ' + k, typeof A.sources[k] === 'string' && A.sources[k].length > 40, true);
  });
  eq('1. the ECB is named', A.sources.inflation.indexOf('European Central Bank') === 0, true);
  eq('1. the Central Bank of Ireland is named', A.sources.cash.indexOf('Central Bank of Ireland') === 0, true);
  eq('1. the Pensions Authority is named', A.sources.assets.indexOf('The Pensions Authority') === 0, true);
  eq('1. the EU scale is named', A.sources.bands.indexOf('CESR/10-673') === 0, true);

  group('2  the seven risk levels');
  eq('2. seven of them', A.risk.length, 7);
  eq('2. numbered 1 to 7', A.risk.map(function (r) { return r.level; }), [1, 2, 3, 4, 5, 6, 7]);
  eq('2. the illustrative rates', A.risk.map(function (r) { return A.pct(r.rate); }), ['2.7%', '3.4%', '4.3%', '5%', '5.4%', '5.8%', '6%']);
  eq('2. the low end of a typical year', A.risk.map(function (r) { return A.pct(r.low); }), ['2%', '2%', '1%', '-3%', '-7%', '-14%', '-19%']);
  eq('2. the high end of a typical year', A.risk.map(function (r) { return A.pct(r.high); }), ['3%', '5%', '8%', '13%', '18%', '26%', '31%']);
  var rising = true, wider = true, falls = true;
  for (var i = 1; i < 7; i++) {
    if (!(A.risk[i].rate > A.risk[i - 1].rate)) rising = false;
    if (!(A.risk[i].high - A.risk[i].low > A.risk[i - 1].high - A.risk[i - 1].low)) wider = false;
    if (!(A.risk[i].low <= A.risk[i - 1].low)) falls = false;
  }
  eq('2. a higher level has a higher rate', rising, true);
  eq('2. a higher level has a wider range: it can rise more and fall more', [wider, falls], [true, true]);
  eq('2. no rate above the 6% cap', A.risk.every(function (r) { return r.rate <= A.assets.cap; }), true);
  eq('2. each mix adds up to the whole', A.risk.every(function (r) { return Math.abs(r.mix.shares + r.mix.bonds + r.mix.cash - 1) < 1e-9; }), true);
  eq('2. each rate is its mix of the maximums, capped, to 0.1%', A.risk.every(function (r) {
    var raw = r.mix.shares * A.assets.shares + r.mix.bonds * A.assets.bonds + r.mix.cash * A.assets.cash;
    return Math.abs(r.rate - Math.min(raw, A.assets.cap)) <= 0.0005 + 1e-9;
  }), true);
  eq('2. each range is the rate less and plus its band\'s middle (level 7: its floor)', A.risk.every(function (r, i) {
    var b = A.bands[i], vol = b[1] === null ? b[0] : (b[0] + b[1]) / 2;
    return r.vol === vol && Math.abs(r.low - (r.rate - vol)) < 0.006 && Math.abs(r.high - (r.rate + vol)) < 0.006;
  }), true);
  eq('2. level 2 is mostly bonds and cash', [A.level(2).mix.bonds + A.level(2).mix.cash > 0.5, A.level(2).holds], [true, 'Mostly bonds and cash. Steadier, lower growth.']);
  eq('2. level 6 is mostly shares', [A.level(6).mix.shares > 0.5, A.level(6).holds], [true, 'Mostly shares. Bigger ups and downs, higher growth over time.']);
  eq('2. level(n) keeps to 1 to 7', [A.level(0).level, A.level(9).level, A.level('4').level], [1, 7, 4]);
  eq('2. no line says what to do', A.risk.filter(function (r) { return /should|recommend|best/i.test(r.holds); }).length, 0);

  group('3  today\'s money');
  eq('3. nothing to take off now', A.today(1000, 0), 1000);
  eq('3. one year: 1000 / 1.02', A.today(1020, 1), 1000);
  eq('3. 18 years at 2%: the director calculator\'s default pot', Math.round(A.today(1511849, 18)), 1058535);
  eq('3. 26 years: the pension calculator\'s default pot', Math.round(A.today(460066, 26)), 274926);
  eq('3. a negative number of years counts as none', A.today(500, -3), 500);
  eq('3. cash at 0.15% for 18 years, in today\'s money, buys less', Math.round(A.today(10000 * Math.pow(1.0015, 18), 18)), 7193);
  eq('3. pct', [A.pct(0.05), A.pct(0.034), A.pct(-0.03), A.pct(0)], ['5%', '3.4%', '-3%', '0%']);
}(this));
