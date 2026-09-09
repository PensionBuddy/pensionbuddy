/* Acceptance tests for the State Pension reality check.
   Written before the UI. Contract: docs/CALC-SPEC-STATE-PENSION.md

   Node is not installed on this machine, so this file runs BOTH ways with no
   build step:
       node tests/state-pension.test.js
       python3 tests/run-tests.py state-pension    (headless Chrome)

   Every assertion is exact to the cent. No tolerances anywhere: the two worked
   examples in the brief are exact figures and the gap arithmetic is plain
   subtraction, so an approximate match would be hiding something. */
(function (root) {
  'use strict';

  var SP = (typeof module === 'object' && module.exports)
    ? require('../assets/js/state-pension.js') : root.PBStatePension;

  var pass = 0, fail = 0, lines = [];

  function eq(label, actual, expected) {
    var ok = actual === expected;
    if (ok) { pass++; } else { fail++; }
    lines.push((ok ? '  ok   ' : '  FAIL ') + label +
      (ok ? '' : '\n         expected ' + JSON.stringify(expected) +
                  '\n         actual   ' + JSON.stringify(actual)));
  }

  function money(label, actualCents, expectedEuro) {
    // compare in cents so nothing depends on float formatting
    eq(label + ' = EUR ' + expectedEuro.toFixed(2),
       actualCents, Math.round(expectedEuro * 100));
  }

  // ---------------------------------------------------------------- 1, 2, 5
  // The two worked examples supplied with the brief, plus the 520 boundary,
  // which is the one true half cent in the whole range: 29930 * 520 / 2080
  // is exactly 7482.5, so it proves the half-up rule rather than relying on
  // a float landing on the helpful side of the line.

  var full = SP.statePension(2080);
  eq('1. given 2,080 contributions, eligible', full.eligible, true);
  money('1. given 2,080 contributions, weekly', full.weeklyCents, 299.30);
  eq('1. fraction is exactly 1', full.fraction, 1);
  eq('1. counted is 2,080', full.counted, 2080);
  eq('1. that is 40 years', full.years, 40);

  var partial = SP.statePension(1560);
  eq('2. given 1,560 contributions, eligible', partial.eligible, true);
  money('2. given 1,560 contributions, weekly', partial.weeklyCents, 224.48);
  eq('2. fraction is exactly 0.75', partial.fraction, 0.75);
  eq('2. that is 30 years', partial.years, 30);

  var atMin = SP.statePension(520);
  eq('5. given exactly 520, the boundary, eligible', atMin.eligible, true);
  money('5. given exactly 520, weekly (7482.5 cents, rounds half up)',
        atMin.weeklyCents, 74.83);
  eq('5. fraction is exactly 0.25', atMin.fraction, 0.25);

  // ------------------------------------------------------------------- 3, 4
  // Below the threshold the module must return a state, not a number. A page
  // that renders "EUR 0.00 a week" there would be telling someone they have an
  // entitlement worth nothing, when what is true is that this scheme does not
  // apply to them and a different, means-tested one might.

  var justUnder = SP.statePension(519);
  eq('3. given 519 contributions, not eligible', justUnder.eligible, false);
  eq('3. short by 1', justUnder.shortBy, 1);
  eq('3. no weekly figure at all', justUnder.weekly, undefined);
  eq('3. no weeklyCents either', justUnder.weeklyCents, undefined);
  eq('3. no annual figure at all', justUnder.annual, undefined);

  var none = SP.statePension(0);
  eq('4. given 0 contributions, not eligible', none.eligible, false);
  eq('4. short by 520', none.shortBy, 520);
  eq('4. no weekly figure', none.weekly, undefined);

  // ----------------------------------------------------------------------- 6
  // More than a full record cannot buy more than the maximum.

  var over = SP.statePension(2500);
  money('6. given 2,500 contributions, capped at the maximum weekly',
        over.weeklyCents, 299.30);
  eq('6. counted is capped at 2,080', over.counted, 2080);
  eq('6. fraction is exactly 1, not more', over.fraction, 1);
  eq('6. flagged as capped', over.capped, true);
  eq('6. the raw figure is still reported back', over.contributions, 2500);

  // ----------------------------------------------------------------------- 7
  // 52 weeks, not 52.18, so this page agrees with the EUR 15,564 already on
  // the home page.

  money('7. given 2,080 contributions, annual', full.annualCents, 15563.60);
  eq('7. annual is exactly 52 weeks of the weekly figure',
     full.annualCents, full.weeklyCents * 52);
  eq('7. and rounds to the EUR 15,564 the home page cites',
     Math.round(full.annual), 15564);

  // ------------------------------------------------------------------ 8 - 10
  // The gaps at the maximum rate. These are the figures the page leads with,
  // so they are asserted to the cent in both euro a year and euro a month.

  var g = SP.gaps(full.annualCents);
  eq('8-10. three standards, in page order', g.length, 3);
  eq('8-10. order is modest, moderate, comfortable',
     g[0].standard + ',' + g[1].standard + ',' + g[2].standard,
     'modest,moderate,comfortable');

  money('8. modest, gap a year', g[0].gapAnnualCents, 3636.40);
  money('8. modest, gap a month', Math.round(g[0].gapMonthly * 100), 303.03);
  eq('8. modest, not covered', g[0].covered, false);

  money('9. moderate, gap a year', g[1].gapAnnualCents, 12036.40);
  money('9. moderate, gap a month', Math.round(g[1].gapMonthly * 100), 1003.03);

  money('10. comfortable, gap a year', g[2].gapAnnualCents, 18036.40);
  money('10. comfortable, gap a month', Math.round(g[2].gapMonthly * 100), 1503.03);

  // ---------------------------------------------------------------------- 11
  // A partial record still has to subtract correctly.

  money('11. given 1,560 contributions, annual', partial.annualCents, 11672.96);
  var g11 = SP.gapTo(partial.annualCents, 'comfortable');
  money('11. and the gap to comfortable', g11.gapAnnualCents, 21927.04);
  eq('11. which is the target minus the pension',
     g11.gapAnnualCents, 3360000 - partial.annualCents);

  // ---------------------------------------------------------------------- 12
  // A pension at or above a standard is covered, not a negative shortfall.

  var rich = SP.gapTo(3360000, 'comfortable');
  eq('12. a pension exactly at the standard is covered', rich.covered, true);
  eq('12. with a zero gap', rich.gapAnnualCents, 0);
  var richer = SP.gapTo(4000000, 'comfortable');
  eq('12. a pension above the standard is covered', richer.covered, true);
  eq('12. and the gap is negative, for the page to suppress',
     richer.gapAnnualCents < 0, true);

  // ---------------------------------------------------------------------- 13
  // Guarding the constants themselves against a typo, since the whole page is
  // three subtractions from these three numbers.

  money('13. modest target', SP.STANDARDS.modest.annualCents, 19200);
  money('13. moderate target', SP.STANDARDS.moderate.annualCents, 27600);
  money('13. comfortable target', SP.STANDARDS.comfortable.annualCents, 33600);
  money('13. maximum weekly rate constant', SP.MAX_WEEKLY_CENTS, 299.30);
  eq('13. full contributions constant', SP.FULL_CONTRIBUTIONS, 2080);
  eq('13. minimum contributions constant', SP.MIN_CONTRIBUTIONS, 520);
  eq('13. weeks per year constant', SP.WEEKS_PER_YEAR, 52);

  // ---------------------------------------------------------------------- 14
  // Age is display only. It must not appear anywhere in the pension result.

  eq('14. age 40 gives 26 years to 66', SP.yearsUntilPensionAge(40), 26);
  eq('14. age 66 gives 0, never negative', SP.yearsUntilPensionAge(66), 0);
  eq('14. age 70 gives 0, never negative', SP.yearsUntilPensionAge(70), 0);
  eq('14. statePension takes no age argument and ignores one',
     SP.statePension(2080, 25).weeklyCents, SP.statePension(2080).weeklyCents);

  // ------------------------------------------------------------------ report
  // Same reporting contract as tests/compare-calc.test.js, so one runner
  // handles both files.
  var summary = '\n' + (fail === 0 ? 'ALL PASS' : 'FAILURES') +
                '  ' + pass + ' passed, ' + fail + ' failed';
  var report = lines.join('\n') + summary;

  if (typeof module === 'object' && module.exports) {
    console.log(report);
    process.exit(fail === 0 ? 0 : 1);
  } else {
    root.__TEST_REPORT__ = report;
    root.__TEST_FAILED__ = fail;
  }
}(typeof self !== 'undefined' ? self : this));
