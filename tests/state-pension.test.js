/* Acceptance tests for the State Pension reality check.
   Written before the UI. Contract: docs/CALC-SPEC-STATE-PENSION.md

   Runs BOTH ways with no build step:
       node tests/state-pension.test.js            (quick, for a red/green loop)
       python3 tests/run-tests.py state-pension    (headless Chrome)

   The Chrome run is the one that counts, because it loads the module through
   a script tag the way a page does. Node was absent from this machine when
   this file was written, which is where the two-way design came from; it is
   installed now, and the design is worth keeping regardless.

   Every assertion is exact to the cent. No tolerances anywhere: the two worked
   examples in the brief are exact figures and the gap arithmetic is plain
   subtraction, so an approximate match would be hiding something. eq is the
   harness's strict comparison and money compares whole cents. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('state-pension');
  var eq = t.eq, money = t.money;

  var SP = isNode ? require('../assets/js/state-pension.js') : root.PBStatePension;

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

  // ---------------------------------------------------------------------- 15
  // The transition window, by drawdown year. Until the end of 2033 the
  // Department works the rate out both ways, Total Contributions Approach and
  // the older Yearly Average, and pays the higher. From 2034 only the TCA
  // applies. Before 2025 the best-of in its present form did not exist.
  //
  // Three named states rather than a share that is null at both ends, because
  // "before" and "after" are opposite facts about the same year and a caller
  // that cannot tell them apart eventually renders one of them as the other.
  //
  // The years asserted are the two boundaries and the year outside each, taken
  // from SWCA 2005 s.109(6D)(a) to (j) and not from the constants below, so a
  // typo in a constant cannot make this row agree with itself.

  eq('15. 2024, the year before the window', SP.transition(2024), 'before');
  eq('15. 2025, the first year of the window', SP.transition(2025), 'during');
  eq('15. 2033, the last year of the window', SP.transition(2033), 'during');
  eq('15. 2034, the year after the window', SP.transition(2034), 'after');
  eq('15. every year in between is during', [2026, 2027, 2028, 2029, 2030, 2031, 2032]
     .map(SP.transition).join(','), 'during,during,during,during,during,during,during');
  eq('15. and a year long after is still after', SP.transition(2074), 'after');

  eq('15. the window opens in 2025', SP.TRANSITION_FIRST, 2025);
  eq('15. the window closes in 2033', SP.TRANSITION_LAST, 2033);
  eq('15. pension age is 66', SP.PENSION_AGE, 66);

  // ---------------------------------------------------------------------- 16
  // Age to the earliest drawdown year. The reality check knows a reader's age
  // and not their birthday, and those two candidate years straddle the one
  // question that matters, so the page has to take the EARLIER of them: the
  // cautious answer, the one that can never tell someone still inside the
  // window that the window has closed for them.
  //
  // Worked from birth years rather than from the formula, so the assertion has
  // an independent source. Someone aged 58 in 2026 was born in 1967 if their
  // birthday has passed and 1968 if it has not. Born 1967 they reach 66 in
  // 2033, born 1968 in 2034; 2033 is the earlier, and it is inside the window.
  // A year younger, 57 in 2026, is born 1968 or 1969, reaching 66 in 2034 or
  // 2035; 2034 is the earlier, and it is outside. One year of age moves a
  // reader across the boundary, so both sides of it are asserted.

  eq('16. age 58 in 2026 could reach 66 as early as 2033',
     SP.earliestDrawdownYear(58, 2026), 2033);
  eq('16. age 57 in 2026 not before 2034',
     SP.earliestDrawdownYear(57, 2026), 2034);
  eq('16. so 58 is still inside the window',
     SP.transition(SP.earliestDrawdownYear(58, 2026)), 'during');
  eq('16. and 57 is already outside it',
     SP.transition(SP.earliestDrawdownYear(57, 2026)), 'after');

  eq('16. age 66 in 2026 could already have reached it in 2025',
     SP.earliestDrawdownYear(66, 2026), 2025);
  eq('16. age 18 in 2026 reaches 66 no earlier than 2073',
     SP.earliestDrawdownYear(18, 2026), 2073);
  eq('16. a year later, every reader of a given age is a year later too',
     SP.earliestDrawdownYear(58, 2027), 2034);

  // ---------------------------------------------------------------------- 17
  // Whether the reality check's figure is exact, a floor, or simply the rate.
  // This is the one decision on that page that changes what the reader is
  // told a number MEANS, and until now it was made in the page script, where
  // no test could reach it.
  //
  //   exact   a full record. The Total Contributions Approach gives the
  //           maximum personal rate outright, EUR 299.30, which is also the
  //           top Yearly Average band, so no second calculation can beat it
  //           and there is nothing to hedge.
  //   floor   a partial record, reaching 66 while the Department still runs
  //           both calculations. The real rate may be higher.
  //   rate    a partial record, reaching 66 after the window. Only the TCA
  //           applies, so on the contributions entered this IS the rate.

  var fullRec = SP.statePension(2080);
  var partRec = SP.statePension(1560);

  eq('17. a full record is exact, inside the window',
     SP.floorStatus(fullRec, 58, 2026), 'exact');
  eq('17. a full record is exact outside it too',
     SP.floorStatus(fullRec, 57, 2026), 'exact');
  eq('17. over a full record is still exact',
     SP.floorStatus(SP.statePension(2500), 58, 2026), 'exact');

  eq('17. a partial record at 58 in 2026 is a floor',
     SP.floorStatus(partRec, 58, 2026), 'floor');
  eq('17. the same record at 57 in 2026 is the rate',
     SP.floorStatus(partRec, 57, 2026), 'rate');
  eq('17. at the 520 boundary the same rule applies',
     SP.floorStatus(SP.statePension(520), 58, 2026), 'floor');

  // Reaching 66 BEFORE 2025 is a floor too, and for its own reason: those
  // pensions were awarded under earlier rules that also paid the better of
  // two calculations. The page cannot reach this case, because its age slider
  // stops at 66, but the module can be asked and must not answer 'rate'.
  eq('17. already past 66 before the window opened is a floor, not the rate',
     SP.floorStatus(partRec, 70, 2026), 'floor');
  eq('17. and that year really is before the window',
     SP.transition(SP.earliestDrawdownYear(70, 2026)), 'before');

  // There is no fourth answer for someone with no entitlement. A result with
  // no figure in it has no meaning to qualify, and quietly returning 'floor'
  // there would let a page caption a pension that does not exist.
  var threw = false;
  try { SP.floorStatus(SP.statePension(0), 40, 2026); } catch (e) { threw = true; }
  eq('17. an ineligible result throws rather than being captioned', threw, true);
}(typeof self !== 'undefined' ? self : this));
