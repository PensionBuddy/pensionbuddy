/* Acceptance tests for assets/js/pb-prsi.js, PRSI on additional income by
   date (Run 32). Contract: the header of that file.

   Runs BOTH ways with no build step:
       node tests/prsi.test.js
       python3 tests/run-tests.py prsi      (headless Chrome)

   The change of rate is asserted on either side of local midnight, and the
   figures the two director pages print from it are asserted as they print
   them: '4.35%', not the '4.4%' that Math.round(rate * 1000) / 10 gave. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('prsi');                   /* strict: strings and rates compared with === */
  var eq = t.eq, group = t.group;
  function yes(label, cond) { return eq(label, cond ? 1 : 0, 1); }

  var P = isNode ? require('../assets/js/pb-prsi.js') : root.PBPrsi;
  /* the director pages' own arithmetic on a round amount */
  function keep(rate) { return Math.round(Math.round(1000 * (1 - (0.40 + 0.08 + rate)) * 100) / 100); }

  group('1  the rate on either side of 1 October 2026');
  var before = P.at(new Date(2026, 8, 30, 23, 59, 59)), after = P.at(new Date(2026, 9, 1, 0, 0, 0));
  eq('1. 30 September 2026, 23:59:59: 4.2%', before.rate, 0.042);
  eq('1. written as 4.2%', before.pct, '4.2%');
  eq('1. 1 October 2026, 00:00: 4.35%', after.rate, 0.0435);
  eq('1. written as 4.35%, not 4.4%', after.pct, '4.35%');
  eq('1. and said to apply from 1 October 2026', after.said, '1 October 2026');
  eq('1. still 4.35% in 2027', P.at(new Date(2027, 5, 1)).pct, '4.35%');
  eq('1. a date before the table takes its first rate', P.at(new Date(2024, 0, 1)).pct, '4.2%');

  group('2  the latest rate, which the markup carries');
  eq('2. latest is 4.35%', P.latest().pct, '4.35%');
  eq('2. from 1 October 2026', P.latest().said, '1 October 2026');

  group('3  the table itself');
  var ordered = true, written = true;
  for (var i = 0; i < P.RATES.length; i++) {
    var r = P.RATES[i];
    if (Math.abs(parseFloat(r.pct) / 100 - r.rate) > 1e-12) written = false;
    if (i && +new Date(r.from[0], r.from[1], r.from[2]) <= +new Date(P.RATES[i - 1].from[0], P.RATES[i - 1].from[1], P.RATES[i - 1].from[2])) ordered = false;
  }
  yes('3. every percentage is its rate, as written', written);
  yes('3. the dates run forwards', ordered);

  group('4  what the two director pages print from it');
  eq('4. EUR 1,000 as salary keeps EUR 478 at 4.2%', keep(before.rate), 478);
  eq('4. and EUR 477 at 4.35% (476.5 rounds up)', keep(after.rate), 477);
  eq('4. the calculator\'s share that reaches the pocket from 1 October: 47.65%',
     Math.round((1 - (0.40 + 0.08 + after.rate)) * 1e6) / 1e6, 0.4765);

  group('5  the two sentences in words (Run 36)');
  var LB = P.lines(new Date(2026, 8, 30, 23, 59, 59)), LA = P.lines(new Date(2026, 9, 1, 0, 0, 0));
  eq('5. to 30 September: the salary line as it always read',
     LB.salary, 'lands in your pocket after up to 52.2% in income tax, the Universal Social Charge (USC) and Pay-Related Social Insurance (PRSI), or 52.35% from 1 October 2026');
  eq('5. to 30 September: the assumption as it always read',
     LB.assume, 'The salary comparison assumes a higher-rate taxpayer facing up to 52.2% on additional income (40% income tax, 8% USC, 4.2% PRSI), and 52.35% from 1 October 2026, when PRSI rises to 4.35%. Your rate may differ.');
  eq('5. from 1 October: 52.35%, and nothing still to come',
     LA.salary, 'lands in your pocket after up to 52.35% in income tax, the Universal Social Charge (USC) and Pay-Related Social Insurance (PRSI)');
  eq('5. from 1 October: the assumption at 4.35%',
     LA.assume, 'The salary comparison assumes a higher-rate taxpayer facing up to 52.35% on additional income (40% income tax, 8% USC, 4.35% PRSI). Your rate may differ.');
  eq('5. still so in 2027', P.lines(new Date(2027, 5, 1)).salary, LA.salary);
  var S = P.statics();
  eq('5. without JavaScript, the salary line is true on any date',
     S.salary, 'lands in your pocket after up to 52.35% in income tax, the Universal Social Charge (USC) and Pay-Related Social Insurance (PRSI), the rate from 1 October 2026 (52.2% before then)');
  eq('5. without JavaScript, so is the assumption',
     S.assume, 'The salary comparison assumes a higher-rate taxpayer facing up to 52.35% on additional income from 1 October 2026 (40% income tax, 8% USC, 4.35% PRSI), and 52.2% before then, with PRSI at 4.2%. Your rate may differ.');
  var cells = { pbPrsiSalary: { textContent: 'old' }, pbPrsiAssume: { textContent: 'old' } };
  P.write({ getElementById: function (id) { return cells[id] || null; } }, new Date(2026, 9, 2));
  eq('5. write() puts the day\'s sentences into both elements',
     [cells.pbPrsiSalary.textContent, cells.pbPrsiAssume.textContent].join(' | '), LA.salary + ' | ' + LA.assume);
  var none = true;
  try { P.write({ getElementById: function () { return null; } }, new Date()); P.write(null, new Date()); } catch (e) { none = false; }
  yes('5. and does nothing on a page without them', none);
}(typeof self !== 'undefined' ? self : this));
