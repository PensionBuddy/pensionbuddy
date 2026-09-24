/* Acceptance tests for what a pension's charges cost.
   Contract: docs/CALC-SPEC-FEES.md

   Runs BOTH ways with no build step:
       node tests/pension-fees.test.js
       python3 tests/run-tests.py pension-fees      (headless Chrome)

   The default figures in section 6 were worked out a second time, in Python,
   from the spec alone, before this module was run; they are pinned to the
   euro. Everything else is checked against a closed form or against another
   module: the no-charge line against cost-of-waiting.js's project(), which is
   the calculators' own. Euro floats, so a half-cent tolerance. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('pension-fees', { tolerance: 0.005 });
  var eq = t.eq, group = t.group;
  function yes(label, cond) { return eq(label, cond ? 1 : 0, 1); }

  var F = isNode ? require('../assets/js/pension-fees.js') : root.PBFees;
  var W = isNode ? require('../assets/js/cost-of-waiting.js') : root.PBWaiting;

  group('1  the Standard PRSA maximums, as the defaults');
  eq('1. 1% a year of the fund', F.STANDARD_PRSA.amc, 0.01);
  eq('1. 5% of each contribution', F.STANDARD_PRSA.contribution, 0.05);

  group('2  no charges is the calculators\' own projection');
  var r5 = W.monthlyRate(5);
  var none = F.project({ pot: 50000, monthly: 200, years: 25, growth: 0.05, amc: 0, contribution: 0 });
  eq('2. the pot, to the cent', none.pot, W.project(300, 50000, 200, r5));
  eq('2. nothing charged', none.amcPaid + none.contributionPaid, 0);
  eq('2. everything paid in counted', none.paidIn, 60000);
  var noneFlat = F.project({ pot: 1000, monthly: 100, years: 3, growth: 0, amc: 0, contribution: 0 });
  eq('2. no growth, no charges: pot plus payments', noneFlat.pot, 4600);

  group('3  a year of the annual charge leaves exactly 1 - amc');
  var amcOnly = F.project({ pot: 10000, monthly: 0, years: 10, growth: 0.05, amc: 0.01, contribution: 0 });
  eq('3. ten years at (1.05)(0.99)', amcOnly.pot, 10000 * Math.pow(1.05 * 0.99, 10));
  var flat = F.project({ pot: 10000, monthly: 0, years: 1, growth: 0, amc: 0.01, contribution: 0 });
  eq('3. with no growth, one year takes exactly 1%', flat.pot, 9900);
  eq('3. and the charge counted is that 1%', flat.amcPaid, 100);

  group('4  a contribution charge takes its share of every payment');
  var cOnly = F.project({ pot: 0, monthly: 200, years: 20, growth: 0.05, amc: 0, contribution: 0.05 });
  eq('4. the same as paying in 95% of each payment', cOnly.pot, W.project(240, 0, 190, r5));
  eq('4. 5% of 240 payments of EUR 200', cOnly.contributionPaid, 2400);
  eq('4. and all 240 payments counted as paid in', cOnly.paidIn, 48000);

  group('5  what charges cost is more than what they took, because a charge stops growing');
  var c = F.compare({ pot: 50000, monthly: 200, years: 25, growth: 0.05,
                      a: { amc: 0.01, contribution: 0.05 }, b: { amc: 0.005, contribution: 0 } });
  eq('5. costA is the no-charge pot less plan A', c.costA, c.none.pot - c.a.pot);
  eq('5. costB likewise', c.costB, c.none.pot - c.b.pot);
  eq('5. the difference is B less A', c.difference, c.b.pot - c.a.pot);
  yes('5. plan A cost more than it took', c.costA > c.a.amcPaid + c.a.contributionPaid);
  yes('5. so did plan B', c.costB > c.b.amcPaid + c.b.contributionPaid);
  yes('5. the dearer plan ends lower', c.a.pot < c.b.pot && c.b.pot < c.none.pot);

  group('6  the page\'s default, to the euro (worked out separately)');
  eq('6. plan A: 1% and 5%', Math.round(c.a.pot), 227710);
  eq('6. plan B: 0.5% and none', Math.round(c.b.pot), 258137);
  eq('6. no charges', Math.round(c.none.pot), 286465);
  eq('6. what plan A\'s charges cost', Math.round(c.costA), 58754);
  eq('6. what plan B\'s cost', Math.round(c.costB), 28327);
  eq('6. the difference', Math.round(c.difference), 30427);
  eq('6. plan A\'s annual charges, in euro at the time', Math.round(c.a.amcPaid), 31380);
  eq('6. plan A\'s contribution charges', Math.round(c.a.contributionPaid), 3000);

  group('7  the year-by-year line the chart draws');
  eq('7. one point a year and the start', c.a.yearly.length, 26);
  eq('7. it starts at the pot now', c.a.yearly[0], 50000);
  eq('7. and ends at the pot at retirement', c.a.yearly[25], c.a.pot);
  var rising = true;
  for (var i = 1; i < c.none.yearly.length; i++) if (!(c.none.yearly[i] > c.none.yearly[i - 1])) rising = false;
  yes('7. with payments and growth the no-charge line only rises', rising);

  group('8  edges');
  var zero = F.project({ pot: 5000, monthly: 100, years: 0, growth: 0.05, amc: 0.01, contribution: 0.05 });
  eq('8. no years: the pot as it is', zero.pot, 5000);
  eq('8. no years: nothing charged', zero.amcPaid + zero.contributionPaid, 0);
  eq('8. no years: one point on the line', zero.yearly.length, 1);
  var higher = F.project({ pot: 50000, monthly: 200, years: 25, growth: 0.05, amc: 0.015, contribution: 0.05 });
  yes('8. a higher annual charge always ends lower', higher.pot < c.a.pot);
  var missing = F.project({ pot: 1000, monthly: 0, years: 1, growth: 0.05 });
  eq('8. charges left out are no charges', missing.pot, 1050);
}(typeof self !== 'undefined' ? self : this));
