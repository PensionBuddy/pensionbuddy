/* Acceptance tests for the pension / PIA / ETF comparison on pia.html.
   Contract: docs/CALC-SPEC-PIA.md.

   Runs BOTH ways with no build step:
       node tests/pia.test.js
       python3 tests/run-tests.py pia      (headless Chrome)

   Every expected figure is worked by hand in the spec, at 0% growth where
   that makes the arithmetic visible. No PIA rate or threshold is asserted as
   a fact anywhere: the ones used here are test inputs, chosen for easy
   arithmetic, and the page never shows them as defaults. Euro floats,
   half-cent tolerance. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('pia', { tolerance: 0.005 });
  var eq = t.eq, group = t.group;
  function yes(label, cond) { return eq(label, cond ? 1 : 0, 1); }

  var R = isNode ? require('../assets/js/pension-tax-relief.js') : root.PBRelief;
  var P = isNode ? require('../assets/js/pia.js') : root.PBPia;
  var steady = P.steady;

  function base(extra) {
    var o = { monthly: 100, path: [0], age: 35, salary: 50000, taxRate: 40, piaRate: 0, piaThreshold: null };
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }

  group('1  the rules the module carries, and the ones it must not');
  eq('1. ETF exit tax 38%', P.ETF_EXIT_TAX, 0.38);
  eq('1. deemed disposal every 8 years', P.DEEMED_YEARS, 8);
  eq('1. lump sum a quarter of the pot', P.LUMP_SHARE, 0.25);
  eq('1. a pension normally from 60', P.PENSION_ACCESS_AGE, 60);
  yes('1. no PIA rate held in the module', !('PIA_RATE' in P) && !('RATE' in P));
  yes('1. no PIA threshold held in the module', !('THRESHOLD' in P) && !('PIA_THRESHOLD' in P));

  group('2  the pension, through PBRelief and PBSft');
  var p1 = P.pension(base());
  eq('2. EUR 100 a month from take-home pay at 40%: EUR 2,000 goes in', p1.gross, 2000);
  eq('2. EUR 800 of it is tax relief', p1.relief, 800);
  eq('2. at 0% growth the pot is EUR 2,000', p1.pot, 2000);
  eq('2. a quarter, EUR 500, is taken tax-free', p1.lumpTaxFree, 500);
  eq('2. the other EUR 1,500 taxed at 40%: EUR 600', p1.taxOut, 600);
  eq('2. so EUR 1,400 after tax', p1.afterTax, 1400);
  eq('2. at 20%: EUR 1,500 goes in', P.pension(base({ taxRate: 20 })).gross, 1500);
  var cap = P.pension(base({ monthly: 500, age: 25, salary: 20000 }));
  eq('2. the age-related limit applies: 25, EUR 20,000, EUR 500 a month', cap.gross,
     R.grossForNetCost(6000, 25, 20000, 40));
  eq('2. which is EUR 7,200, not EUR 10,000', cap.gross, 7200);
  var turn = P.pension(base({ age: 29, path: [0, 0], monthly: 1000, salary: 30000 }));
  eq('2. the limit follows the age each year: 29, then 30', turn.gross,
     R.grossForNetCost(12000, 29, 30000, 40) + R.grossForNetCost(12000, 30, 30000, 40));
  var big = P.pension(base({ monthly: 2300, age: 60, salary: 115000, path: steady(0, 25) }));
  eq('2. EUR 46,000 a year for 25 years at 60 and over: EUR 1,150,000', big.pot, 1150000);
  eq('2. lump sum EUR 287,500: 200,000 free, 87,500 at 20%; the rest at 40%', big.taxOut, 17500 + 862500 * 0.4);
  yes('2. 35 plus 10 years is before 60', P.pension(base({ path: steady(0, 10) })).beforeAccess);
  yes('2. 50 plus 10 years is not', !P.pension(base({ age: 50, path: steady(0, 10) })).beforeAccess);
  var g5 = P.pension(base({ path: [0.05] }));
  var f = Math.pow(1.05, 1 / 12), ann = 0;
  for (var k = 0; k < 12; k++) ann = ann * f + 2000 / 12;
  eq('2. growth is the calculators\' month: growth, then the payment', g5.pot, ann);

  group('3  the PIA, with the reader\'s own rate and threshold');
  yes('3. nothing is worked out until there is a threshold', P.pia({ monthly: 100, path: [0.05], rate: 0.01, threshold: null }) === null);
  var a = P.pia({ monthly: 100, path: [0], rate: 0.01, threshold: 0 });
  eq('3. month-ends 100 to 1,200 average 650; 1% of it is EUR 6.50', a.taxDuring, 6.5);
  eq('3. taken from the account: EUR 1,193.50 left', a.afterTax, 1193.5);
  eq('3. no tax on the way out', a.taxOut, 0);
  eq('3. a threshold above the average: no tax', P.pia({ monthly: 100, path: [0], rate: 0.01, threshold: 1000 }).taxDuring, 0);
  eq('3. only the part above the threshold: 1% of 150', P.pia({ monthly: 100, path: [0], rate: 0.01, threshold: 500 }).taxDuring, 1.5);
  var zero = P.pia({ monthly: 100, path: steady(0.05, 8), rate: 0, threshold: 0 });
  var etf0 = P.etf(base({ path: steady(0.05, 8) }));
  eq('3. at a 0% rate the account is untaxed growth, the ETF\'s value before tax, inside 8 years', zero.afterTax, etf0.value);
  var fall = P.pia({ monthly: 100, path: [-0.2], rate: 0.01, threshold: 0 });
  yes('3. a year the account falls still carries tax', fall.taxDuring > 0);
  eq('3. and is counted as a loss year that was taxed', fall.taxedLossYears, 1);
  var two = P.pia({ monthly: 100, path: [0, 0], rate: 0.01, threshold: 0 });
  eq('3. year two is taxed on its own average, after year one\'s tax', two.taxes[1],
     0.01 * ((1193.5 * 12 + 100 * 78) / 12));

  group('4  the ETF outside a wrapper');
  var e0 = P.etf(base({ path: steady(0, 9) }));
  eq('4. at 0% growth there is no tax', e0.taxDuring + e0.taxOut, 0);
  eq('4. and EUR 10,800 back', e0.afterTax, 10800);
  var e1 = P.etf(base({ path: [0.1] }));
  eq('4. one year: 38% of the gain on the way out', e1.taxOut, 0.38 * (e1.value - 1200));
  eq('4. no deemed disposal inside 8 years', P.etf(base({ path: steady(0.06, 8) })).taxDuring, 0);
  var e9 = P.etf(base({ path: steady(0.06, 9) }));
  eq('4. year 9: the first 12 purchases reach their eighth anniversary', e9.taxDuring,
     12 * 0.38 * 100 * (Math.pow(1.06, 8) - 1));
  var eFall = P.etf(base({ path: steady(0.06, 8).concat([-0.5]) }));
  yes('4. a fall after a deemed disposal gives some of that tax back', eFall.taxOut < 0);
  yes('4. never more than was paid', -eFall.taxOut <= eFall.taxDuring + 1e-9);

  group('5  the same take-home cost, and the scenarios');
  var s = P.scenarios({ monthly: 200, years: 10, growth: 0.05, age: 35, salary: 50000, taxRate: 40, piaRate: 0.01, piaThreshold: 0 });
  eq('5. every product costs the same from take-home pay', s.yours.pension.paidIn, s.yours.pia.paidIn);
  eq('5. the ETF too', s.yours.etf.paidIn, 24000);
  eq('5. lower growth is half the reader\'s rate', s.lower.etf.value,
     P.etf(base({ monthly: 200, path: steady(0.025, 10) })).value);
  eq('5. the fall is the reader\'s growth then a 20% fall in the last year', s.fall.etf.value,
     P.etf(base({ monthly: 200, path: steady(0.05, 9).concat([-0.2]) })).value);
  yes('5. in the fall, the PIA still pays tax in the losing year', s.fall.pia.taxedLossYears >= 1);
  yes('5. with no threshold entered, no PIA figure in any scenario',
      P.scenarios({ monthly: 200, years: 5, growth: 0.05, age: 35, salary: 50000, taxRate: 40, piaRate: 0, piaThreshold: null }).fall.pia === null);
}(typeof self !== 'undefined' ? self : this));
