/* Acceptance tests for the Standard Fund Threshold, CET and lump sum bands.
   Contract: the header of assets/js/sft.js, which carries the sources.

   Runs BOTH ways with no build step:
       node tests/sft.test.js
       python3 tests/run-tests.py sft      (headless Chrome)

   Every statutory figure is asserted as the statute states it, so a Budget
   that changes one fails here first and the page cannot quietly go stale.
   Euro floats, half-cent tolerance. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('sft', { tolerance: 0.005 });
  var eq = t.eq, group = t.group;
  function yes(label, cond) { return eq(label, cond ? 1 : 0, 1); }

  var S = isNode ? require('../assets/js/sft.js') : root.PBSft;

  group('1  the threshold, year by year (Finance Act 2024 s.13)');
  eq('1. 2025 and before: EUR 2.0m', S.threshold(2025).value, 2000000);
  eq('1. 2014: EUR 2.0m', S.threshold(2014).value, 2000000);
  eq('1. 2026: EUR 2.2m', S.threshold(2026).value, 2200000);
  eq('1. 2027: EUR 2.4m', S.threshold(2027).value, 2400000);
  eq('1. 2028: EUR 2.6m', S.threshold(2028).value, 2600000);
  eq('1. 2029: EUR 2.8m', S.threshold(2029).value, 2800000);
  yes('1. to 2029 the figure is the statute\'s, not a floor', !S.threshold(2029).atLeast);
  eq('1. 2030: at least EUR 2.8m', S.threshold(2030).value, 2800000);
  yes('1. and said to be at least that, since it follows earnings', S.threshold(2030).atLeast);
  yes('1. so is every year after', S.threshold(2041).atLeast && S.threshold(2041).value === 2800000);

  group('2  a pension set against the threshold');
  var u = S.used(1650000, 2026);
  eq('2. EUR 1.65m is 75% of 2026\'s', Math.round(u.share * 10000) / 100, 75);
  eq('2. with EUR 550,000 of headroom', u.headroom, 550000);
  eq('2. and nothing over', u.excess, 0);
  eq('2. so no CET', u.cet, 0);
  var at = S.used(2200000, 2026);
  eq('2. exactly at the threshold: all of it used', at.share, 1);
  eq('2. no headroom', at.headroom, 0);
  eq('2. and no excess', at.excess, 0);
  var over = S.used(2500000, 2026);
  eq('2. EUR 2.5m in 2026 is EUR 300,000 over', over.excess, 300000);
  eq('2. CET at 40% on that is EUR 120,000', over.cet, 120000);
  eq('2. the same EUR 2.5m in 2029 is under', S.used(2500000, 2029).excess, 0);
  eq('2. with EUR 300,000 of headroom then', S.used(2500000, 2029).headroom, 300000);

  group('3  the lump sum bands (Revenue Pensions Manual ch. 27)');
  var l1 = S.lumpSum(150000);
  eq('3. EUR 150,000: all tax-free', l1.taxFree, 150000);
  eq('3. none at 20%', l1.atStandardRate + l1.standardTax, 0);
  var l2 = S.lumpSum(350000);
  eq('3. EUR 350,000: EUR 200,000 tax-free', l2.taxFree, 200000);
  eq('3. EUR 150,000 at 20%', l2.atStandardRate, 150000);
  eq('3. which is EUR 30,000 of tax', l2.standardTax, 30000);
  eq('3. nothing as income', l2.asIncome, 0);
  var l3 = S.lumpSum(700000);
  eq('3. EUR 700,000: the 20% band is full at EUR 300,000', l3.atStandardRate, 300000);
  eq('3. EUR 60,000 of tax on it', l3.standardTax, 60000);
  eq('3. and EUR 200,000 taxed as income', l3.asIncome, 200000);
  eq('3. the three bands add up to the lump sum', l3.taxFree + l3.atStandardRate + l3.asIncome, 700000);
  eq('3. the 20% band stops at EUR 500,000 whatever the threshold', S.STANDARD_TOP, 500000);
  eq('3. a negative amount is nothing', S.lumpSum(-5).taxFree, 0);

  group('4  what a lump sum\'s tax can take off CET');
  eq('4. at most 20% of EUR 300,000', S.CREDIT_MAX, 60000);

  group('5  the combined rate on an excess (de Buitleir, 2024, section 4.2)');
  eq('5. at 48% on drawdown (no PRSI): 68.8%', Math.round(S.combinedRate(0.48) * 1000) / 10, 68.8);
  eq('5. at 52% (with 4% PRSI): 71.2%', Math.round(S.combinedRate(0.52) * 1000) / 10, 71.2);
  eq('5. CET itself is 40%', S.CET_RATE, 0.40);
}(typeof self !== 'undefined' ? self : this));
