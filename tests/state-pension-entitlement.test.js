/* Acceptance tests for the State Pension entitlement check.
   Written before the module. Contract: docs/CALC-SPEC-STATE-PENSION-ENTITLEMENT.md,
   S8 for the rows, S3 for the return shape.

   Runs BOTH ways with no build step:
       node tests/state-pension-entitlement.test.js
       python3 tests/run-tests.py state-pension-entitlement    (headless Chrome)

   The Chrome run is the one that counts, because it loads both modules
   through script tags in the order a page loads them, which is the only run
   that can catch a wrong script order. Node was absent from this machine when
   this file was written, which is where the two-way design came from; it is
   installed now, and the design is worth keeping regardless.

   Every figure is in cents and exact. No tolerances anywhere: every row in S8
   was worked by hand from the published bands and the statutory mix, so the
   test checks the module against the spec rather than against itself. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('state-pension-entitlement');
  var eq = t.eq, money = t.money;

  var SP = isNode ? require('../assets/js/state-pension.js') : root.PBStatePension;
  var E  = isNode ? require('../assets/js/state-pension-entitlement.js') : root.PBEntitlement;

  /* The three non-eligible states must carry no weekly or annual figure
     anywhere, not just at the top level: a page that finds one nested under
     tca or award would render a pension for someone who has none. Returns
     the paths of any offending keys, so the assertion is against ''. */
  var FIGURE_KEYS = ['weeklyCents', 'weekly', 'annualCents', 'annual'];
  function figureKeys(obj, prefix) {
    var found = [];
    if (obj === null || typeof obj !== 'object') return found;
    Object.keys(obj).forEach(function (k) {
      var path = prefix ? prefix + '.' + k : k;
      if (FIGURE_KEYS.indexOf(k) >= 0) found.push(path);
      found = found.concat(figureKeys(obj[k], path));
    });
    return found;
  }

  /* Internal consistency, applied to every eligible result (S8, below the
     table, and S3). The award has to be the figure its basis names, Method 1
     has to be the existing module's own figure for the same reckonable count,
     and the euro fields have to be the cent fields divided by 100. */
  function consistent(row, r) {
    var a = r.award, t = r.tca, m2 = r.method2;
    eq(row + ' state is eligible', r.state, 'eligible');
    eq(row + ' tca is the existing module\'s result for the reckonable count',
       t.weeklyCents, SP.statePension(t.reckonable).weeklyCents);
    // The count appears once, under the name the page and the spec use for
    // it. The old second copy under `contributions` could only ever agree.
    eq(row + ' the reckonable count is not duplicated', t.contributions, undefined);
    // Past the 520 gate the Method 1 result is always an eligible one, so an
    // `eligible` field could only ever be true and a `shortBy` never set.
    // Fields that cannot vary tell a caller nothing and invite a check that
    // never fires.
    eq(row + ' no always-true eligible field', t.eligible, undefined);
    eq(row + ' no never-set shortBy field', t.shortBy, undefined);
    eq(row + ' tca annual is 52 weeks of tca weekly', t.annualCents, t.weeklyCents * 52);
    // tca is assembled field by field in this module, so every field it carries
    // over is checked against the value statePension() itself gives for the same
    // count. A field wired to the wrong source would pass a typeof check.
    var sp1 = SP.statePension(t.reckonable);
    ['counted', 'capped', 'fraction', 'years', 'weekly', 'annualCents', 'annual']
      .forEach(function (k) {
        eq(row + ' tca.' + k + ' is statePension()\'s own ' + k, t[k], sp1[k]);
      });
    if (a.basis === 'method1') {
      eq(row + ' award matches the basis, method1', a.weeklyCents, t.weeklyCents);
    } else if (a.basis === 'method2') {
      eq(row + ' award matches the basis, method2', a.weeklyCents, m2.weeklyCents);
      eq(row + ' method2 is the higher on a method2 award', m2.weeklyCents > t.weeklyCents, true);
    } else {
      eq(row + ' basis is one of method1, method2, tie', a.basis, 'tie');
      eq(row + ' tie: award matches method1', a.weeklyCents, t.weeklyCents);
      eq(row + ' tie: award matches method2', a.weeklyCents, m2.weeklyCents);
    }
    eq(row + ' award annual is 52 weeks of award weekly', a.annualCents, a.weeklyCents * 52);
    eq(row + ' award.weekly is weeklyCents / 100', a.weekly, a.weeklyCents / 100);
    eq(row + ' award.annual is annualCents / 100', a.annual, a.annualCents / 100);
    eq(row + ' award.gain is gainCents / 100', a.gain, a.gainCents / 100);
    eq(row + ' gainCents is method2 minus method1 when method2 is paid, else 0',
       a.gainCents, a.basis === 'method2' ? m2.weeklyCents - t.weeklyCents : 0);
    eq(row + ' method2 is always an object, never null', m2 !== null && typeof m2, 'object');
    eq(row + ' and the separate unavailable flag is gone', r.method2Unavailable, undefined);
    if (m2.reason) {
      // no figure at all beside the reason: a page cannot find one and print it
      eq(row + ' a reason carries no weekly figure', m2.weeklyCents, undefined);
      eq(row + ' a reason carries no share', m2.yaShare, undefined);
      eq(row + ' the award falls back to Method 1', a.basis, 'method1');
    } else {
      eq(row + ' a figure carries no reason', m2.reason, undefined);
      eq(row + ' the two shares sum to 100', m2.yaShare + m2.tcaShare, 100);
      eq(row + ' method2.weekly is weeklyCents / 100', m2.weekly, m2.weeklyCents / 100);
      var yb = r.yearlyAverage.band;
      eq(row + ' the yearly average sits inside the band it was given',
         yb.min <= r.yearlyAverage.average &&
         (yb.max === null || r.yearlyAverage.average <= yb.max), true);
      eq(row + ' the band carries no loose bandMin beside it',
         r.yearlyAverage.bandMin, undefined);
      eq(row + ' and no loose weeklyCents beside it',
         r.yearlyAverage.weeklyCents, undefined);
    }
  }

  function run() {
    if (typeof E !== 'object' || E === null) {
      throw new Error('PBEntitlement is not defined: assets/js/state-pension-entitlement.js did not load');
    }

    // ------------------------------------------------------------------ 1
    // A full record at the top band. Both methods land on the maximum, so
    // this is the one reachable tie and proves the basis label on it.

    var r1 = E.entitlement({ paid: 2080, credited: 0, homeCaring: 0, entryYear: 1986, drawdownYear: 2026 });
    eq('1. full record, echoes paid', r1.paid, 2080);
    eq('1. echoes entryYear', r1.entryYear, 1986);
    eq('1. echoes drawdownYear', r1.drawdownYear, 2026);
    eq('1. years is 40', r1.years, 40);
    eq('1. reckonable 2,080', r1.tca.reckonable, 2080);
    eq('1. capBit false', r1.tca.capBit, false);
    money('1. Method 1 weekly', r1.tca.weeklyCents, 299.30);
    eq('1. yearly average years', r1.yearlyAverage.years, 40);
    eq('1. yearly average numerator', r1.yearlyAverage.numerator, 2080);
    eq('1. yearly average is 52', r1.yearlyAverage.average, 52);
    eq('1. band 48 or over, lower bound', r1.yearlyAverage.band.min, 48);
    eq('1. the top band has no upper bound', r1.yearlyAverage.band.max, null);
    money('1. band rate', r1.yearlyAverage.band.weeklyCents, 299.30);
    eq('1. mix 80/20, yaShare', r1.method2.yaShare, 80);
    eq('1. mix 80/20, tcaShare', r1.method2.tcaShare, 20);
    money('1. Method 2 weekly', r1.method2.weeklyCents, 299.30);
    eq('1. basis tie', r1.award.basis, 'tie');
    money('1. award weekly', r1.award.weeklyCents, 299.30);
    eq('1. gain 0', r1.award.gainCents, 0);
    money('1. award annual', r1.award.annualCents, 15563.60);
    eq('1. method2 is the figure, not a reason', r1.method2.reason, undefined);
    consistent('1.', r1);

    // ------------------------------------------------------------------ 2
    // The 2026 default. The two methods visibly disagree, which is the point
    // of the page, and the blend lands on 28085.6 so it proves the half-up
    // rounding of Method 2 (S4, unconfirmed item 3, stated as an assumption).

    var r2 = E.entitlement({ paid: 1560, credited: 260, homeCaring: 0, entryYear: 1985, drawdownYear: 2028 });
    eq('2. the default, echoes credited', r2.credited, 260);
    eq('2. reckonable 1,820', r2.tca.reckonable, 1820);
    eq('2. creditsCounted 260', r2.tca.creditsCounted, 260);
    eq('2. homeCaringCounted 0', r2.tca.homeCaringCounted, 0);
    eq('2. extrasCounted 260', r2.tca.extrasCounted, 260);
    eq('2. capBit false', r2.tca.capBit, false);
    money('2. Method 1 weekly', r2.tca.weeklyCents, 261.89);
    eq('2. years is 43', r2.years, 43);
    eq('2. yearly average numerator 1,820', r2.yearlyAverage.numerator, 1820);
    eq('2. 1,820 / 43 = 42.33 rounds to 42', r2.yearlyAverage.average, 42);
    eq('2. band 40 to 47, lower bound', r2.yearlyAverage.band.min, 40);
    eq('2. band 40 to 47, upper bound', r2.yearlyAverage.band.max, 47);
    money('2. band rate', r2.yearlyAverage.band.weeklyCents, 293.50);
    eq('2. mix 60/40, yaShare', r2.method2.yaShare, 60);
    eq('2. mix 60/40, tcaShare', r2.method2.tcaShare, 40);
    money('2. Method 2 weekly (28085.6 cents, rounds half up)', r2.method2.weeklyCents, 280.86);
    eq('2. basis method2', r2.award.basis, 'method2');
    money('2. award weekly', r2.award.weeklyCents, 280.86);
    money('2. gain', r2.award.gainCents, 18.97);
    money('2. award annual', r2.award.annualCents, 14604.72);
    consistent('2.', r2);

    // ------------------------------------------------------------------ 3
    // HomeCaring Periods count under TCA only. They lift Method 1 to 1,820
    // reckonable while the yearly average sees only the 1,040 paid, so
    // Method 1 wins and the award must say so.

    var r3 = E.entitlement({ paid: 1040, credited: 0, homeCaring: 780, entryYear: 1990, drawdownYear: 2030 });
    eq('3. HomeCaring, echoes homeCaring', r3.homeCaring, 780);
    eq('3. homeCaringCounted 780', r3.tca.homeCaringCounted, 780);
    eq('3. extrasCounted 780', r3.tca.extrasCounted, 780);
    eq('3. reckonable 1,820', r3.tca.reckonable, 1820);
    eq('3. capBit false', r3.tca.capBit, false);
    money('3. Method 1 weekly', r3.tca.weeklyCents, 261.89);
    eq('3. years is 40', r3.years, 40);
    eq('3. yearly average numerator is paid plus credited only', r3.yearlyAverage.numerator, 1040);
    eq('3. 1,040 / 40 = 26', r3.yearlyAverage.average, 26);
    eq('3. band 20 to 29, lower bound', r3.yearlyAverage.band.min, 20);
    eq('3. band 20 to 29, upper bound', r3.yearlyAverage.band.max, 29);
    money('3. band rate', r3.yearlyAverage.band.weeklyCents, 254.80);
    eq('3. mix 40/60, yaShare', r3.method2.yaShare, 40);
    eq('3. mix 40/60, tcaShare', r3.method2.tcaShare, 60);
    money('3. Method 2 weekly (25905.4 cents)', r3.method2.weeklyCents, 259.05);
    eq('3. basis method1', r3.award.basis, 'method1');
    money('3. award weekly', r3.award.weeklyCents, 261.89);
    eq('3. gain 0', r3.award.gainCents, 0);
    consistent('3.', r3);

    // ------------------------------------------------------------------ 4
    // A yearly average below 10 removes Method 2 entirely (S.I. 592/2024,
    // Art. 62D(2)(a)). The module must not blend a nil band; it falls back
    // to Method 1 and still reports the average it found, so the page can
    // say why there is no second calculation.

    var r4 = E.entitlement({ paid: 520, credited: 0, homeCaring: 0, entryYear: 1970, drawdownYear: 2026 });
    money('4. Method 1 weekly at the qualifying minimum', r4.tca.weeklyCents, 74.83);
    eq('4. years is 56', r4.years, 56);
    eq('4. method2 is the reason, not a figure', r4.method2.reason, 'yearly-average-below-10');
    eq('4. and carries no weekly figure', r4.method2.weeklyCents, undefined);
    eq('4. yearlyAverage.years 56', r4.yearlyAverage.years, 56);
    eq('4. yearlyAverage.numerator 520', r4.yearlyAverage.numerator, 520);
    eq('4. 520 / 56 = 9.29 rounds to 9', r4.yearlyAverage.average, 9);
    eq('4. no band at all below 10', r4.yearlyAverage.band, null);
    eq('4. basis method1', r4.award.basis, 'method1');
    money('4. award weekly', r4.award.weeklyCents, 74.83);
    consistent('4.', r4);

    // ------------------------------------------------------------------ 5, 6
    // Half up at the top band. 47.5 becomes 48 and takes the maximum; 47.4
    // stays at 47 and takes the band below. The Department's own examples,
    // asked through the whole calculation rather than of a helper, because
    // what the rounding is FOR is which band the average lands in.

    var r5 = E.entitlement({ paid: 1900, credited: 0, homeCaring: 0, entryYear: 1986, drawdownYear: 2026 });
    eq('5. 1,900 over 40 years is 47.5 and rounds up to 48', r5.yearlyAverage.average, 48);
    eq('5. which is the top band', r5.yearlyAverage.band.min, 48);
    money('5. at the maximum personal rate', r5.yearlyAverage.band.weeklyCents, 299.30);

    var r6 = E.entitlement({ paid: 1896, credited: 0, homeCaring: 0, entryYear: 1986, drawdownYear: 2026 });
    eq('6. 1,896 over the same 40 years is 47.4 and stays at 47', r6.yearlyAverage.average, 47);
    eq('6. one band down', r6.yearlyAverage.band.min, 40);
    money('6. at that band\'s rate', r6.yearlyAverage.band.weeklyCents, 293.50);

    // ------------------------------------------------------------------ 7
    // Half up at the floor of the lowest band. This is where the rounding
    // decides between a Method 2 figure and none at all.

    var r7a = E.entitlement({ paid: 570, credited: 0, homeCaring: 0, entryYear: 1966, drawdownYear: 2026 });
    eq('7. 570 over 60 years is 9.5 and rounds up to 10', r7a.yearlyAverage.average, 10);
    eq('7. which is the lowest band', r7a.yearlyAverage.band.min, 10);
    money('7. at that band\'s rate', r7a.yearlyAverage.band.weeklyCents, 119.60);
    eq('7. so there is a Method 2 figure', typeof r7a.method2.weeklyCents, 'number');

    var r7b = E.entitlement({ paid: 564, credited: 0, homeCaring: 0, entryYear: 1966, drawdownYear: 2026 });
    eq('7. 564 over the same 60 years is 9.4 and stays at 9', r7b.yearlyAverage.average, 9);
    eq('7. which falls in no band', r7b.yearlyAverage.band, null);
    eq('7. and removes Method 2 entirely', r7b.method2.reason, 'yearly-average-below-10');

    // ------------------------------------------------------------------ 8
    // The consistency gate, at its boundary on both sides.
    //
    // Inside the module the yearly average is capped at 52 and refuses a
    // division over no years. Neither guard can fire through entitlement(),
    // and this is why: 520 paid contributions need ten years at 52 a year, so
    // anything that reaches the average has at least ten years to divide by
    // and can never exceed 52. The gate is what the page depends on, so the
    // gate is what is asserted, not the dead guard behind it.

    var r8a = E.entitlement({ paid: 520, credited: 0, homeCaring: 0, entryYear: 2016, drawdownYear: 2026 });
    eq('8. 520 paid over exactly ten years fits', r8a.state, 'eligible');
    eq('8. and averages 52, the most a yearly average can be', r8a.yearlyAverage.average, 52);

    var r8b = E.entitlement({ paid: 520, credited: 52, homeCaring: 0, entryYear: 2016, drawdownYear: 2026 });
    eq('8. one year\'s contributions more than those years hold does not', r8b.state, 'inconsistent');
    eq('8. maxForYears is 52 a year', r8b.maxForYears, 520);

    var r8c = E.entitlement({ paid: 520, credited: 0, homeCaring: 0, entryYear: 2017, drawdownYear: 2026 });
    eq('8. and 520 paid can never fit in nine years', r8c.state, 'inconsistent');
    eq('8. so nothing past the gate divides by fewer than ten', r8c.maxForYears, 468);

    // ------------------------------------------------------------------ 9
    // Credits are uncapped under Yearly Average and capped at 520 under TCA.
    // The same 780 credits count in full in one numerator and as 520 in the
    // other, and capBit has to say the cap bit.

    var r9 = E.entitlement({ paid: 1040, credited: 780, homeCaring: 0, entryYear: 1990, drawdownYear: 2030 });
    eq('9. creditsCounted 520', r9.tca.creditsCounted, 520);
    eq('9. extrasCounted 520', r9.tca.extrasCounted, 520);
    eq('9. reckonable 1,560', r9.tca.reckonable, 1560);
    eq('9. capBit true', r9.tca.capBit, true);
    money('9. Method 1 weekly', r9.tca.weeklyCents, 224.48);
    eq('9. years is 40', r9.years, 40);
    eq('9. yearly average numerator is 1,820, credits uncapped', r9.yearlyAverage.numerator, 1820);
    eq('9. 1,820 / 40 = 45.5 rounds to 46', r9.yearlyAverage.average, 46);
    eq('9. band 40 to 47', r9.yearlyAverage.band.min, 40);
    money('9. band rate', r9.yearlyAverage.band.weeklyCents, 293.50);
    eq('9. mix 40/60, yaShare', r9.method2.yaShare, 40);
    eq('9. mix 40/60, tcaShare', r9.method2.tcaShare, 60);
    money('9. Method 2 weekly (25208.8 cents)', r9.method2.weeklyCents, 252.09);
    eq('9. basis method2', r9.award.basis, 'method2');
    money('9. award weekly', r9.award.weeklyCents, 252.09);
    money('9. gain', r9.award.gainCents, 27.61);
    consistent('9.', r9);

    // ------------------------------------------------------------------ 10
    // The combined cap. 520 credits and 1,040 HomeCaring Periods are each
    // within their own cap and together over the 1,040 combined cap.

    var r10 = E.entitlement({ paid: 520, credited: 520, homeCaring: 1040, entryYear: 1986, drawdownYear: 2026 });
    eq('10. creditsCounted 520', r10.tca.creditsCounted, 520);
    eq('10. homeCaringCounted 1,040', r10.tca.homeCaringCounted, 1040);
    eq('10. extrasCounted 1,040, the combined cap', r10.tca.extrasCounted, 1040);
    eq('10. reckonable 1,560', r10.tca.reckonable, 1560);
    eq('10. capBit true', r10.tca.capBit, true);
    money('10. Method 1 weekly', r10.tca.weeklyCents, 224.48);
    eq('10. years is 40', r10.years, 40);
    eq('10. yearly average numerator 1,040', r10.yearlyAverage.numerator, 1040);
    eq('10. 1,040 / 40 = 26', r10.yearlyAverage.average, 26);
    eq('10. band 20 to 29', r10.yearlyAverage.band.min, 20);
    money('10. band rate', r10.yearlyAverage.band.weeklyCents, 254.80);
    eq('10. mix 80/20, yaShare', r10.method2.yaShare, 80);
    eq('10. mix 80/20, tcaShare', r10.method2.tcaShare, 20);
    money('10. Method 2 weekly (24873.6 cents)', r10.method2.weeklyCents, 248.74);
    eq('10. basis method2', r10.award.basis, 'method2');
    money('10. award weekly', r10.award.weeklyCents, 248.74);
    consistent('10.', r10);

    // ------------------------------------------------------------------ 11
    // From 2034 only the Total Contributions Approach applies. No yearly
    // average is computed at all, so nothing is reported for it.

    var r11 = E.entitlement({ paid: 1560, credited: 0, homeCaring: 0, entryYear: 2004, drawdownYear: 2052 });
    eq('11. years is 48', r11.years, 48);
    money('11. Method 1 weekly', r11.tca.weeklyCents, 224.48);
    eq('11. method2 is the reason, not a figure', r11.method2.reason, 'after-transition');
    eq('11. and carries no weekly figure', r11.method2.weeklyCents, undefined);
    eq('11. no yearly average was computed at all', r11.yearlyAverage, null);
    eq('11. basis method1', r11.award.basis, 'method1');
    money('11. award weekly', r11.award.weeklyCents, 224.48);
    consistent('11.', r11);

    // ------------------------------------------------------------------ 12
    // Pensions that started before 2025 were awarded under earlier rules the
    // page does not describe. A state, and no figure of any kind.

    var r12 = E.entitlement({ paid: 1560, credited: 0, homeCaring: 0, entryYear: 1990, drawdownYear: 2024 });
    eq('12. state before-transition', r12.state, 'before-transition');
    eq('12. carries the drawdownYear', r12.drawdownYear, 2024);
    eq('12. no award', r12.award, undefined);
    eq('12. no tca', r12.tca, undefined);
    eq('12. no weekly or annual figure anywhere in the result', figureKeys(r12, '').join(','), '');

    // ------------------------------------------------------------------ 13
    // The qualifying minimum is on paid contributions. 468 paid and 260
    // credited is 728 reckonable, above 520, and still no entitlement.

    var r13 = E.entitlement({ paid: 468, credited: 260, homeCaring: 0, entryYear: 1990, drawdownYear: 2030 });
    eq('13. state no-entitlement', r13.state, 'no-entitlement');
    eq('13. echoes paid', r13.paid, 468);
    eq('13. paidShortBy 52', r13.paidShortBy, 52);
    eq('13. no award', r13.award, undefined);
    eq('13. no weekly or annual figure anywhere in the result', figureKeys(r13, '').join(','), '');

    // ------------------------------------------------------------------ 14
    // More contributions than the years can hold. Entry in the drawdown year
    // leaves no years at all; entry in 2000 leaves 26, which hold 1,352.

    var r14a = E.entitlement({ paid: 520, credited: 0, homeCaring: 0, entryYear: 2026, drawdownYear: 2026 });
    eq('14. entry 2026 for drawdown 2026, state inconsistent', r14a.state, 'inconsistent');
    eq('14. years 0', r14a.years, 0);
    eq('14. maxForYears 0', r14a.maxForYears, 0);
    eq('14. entered 520', r14a.entered, 520);
    eq('14. no weekly or annual figure anywhere in the result', figureKeys(r14a, '').join(','), '');

    var r14b = E.entitlement({ paid: 1560, credited: 0, homeCaring: 0, entryYear: 2000, drawdownYear: 2026 });
    eq('14. entry 2000 for drawdown 2026, state inconsistent', r14b.state, 'inconsistent');
    eq('14. years 26', r14b.years, 26);
    eq('14. maxForYears 1,352', r14b.maxForYears, 1352);
    eq('14. entered 1,560', r14b.entered, 1560);
    eq('14. no weekly or annual figure anywhere in the second result', figureKeys(r14b, '').join(','), '');

    // ------------------------------------------------------------------ 15
    // The last transition year. At 10/90 Method 2 still edges Method 1 by
    // 72 cents, so the best-of still has work to do in 2033.

    var r15 = E.entitlement({ paid: 1560, credited: 260, homeCaring: 0, entryYear: 1985, drawdownYear: 2033 });
    money('15. Method 1 weekly', r15.tca.weeklyCents, 261.89);
    eq('15. years is 48', r15.years, 48);
    eq('15. 1,820 / 48 = 37.92 rounds to 38', r15.yearlyAverage.average, 38);
    eq('15. band 30 to 39', r15.yearlyAverage.band.min, 30);
    money('15. band rate', r15.yearlyAverage.band.weeklyCents, 269.10);
    eq('15. mix 10/90, yaShare', r15.method2.yaShare, 10);
    eq('15. mix 10/90, tcaShare', r15.method2.tcaShare, 90);
    money('15. Method 2 weekly (26261.1 cents)', r15.method2.weeklyCents, 262.61);
    eq('15. basis method2', r15.award.basis, 'method2');
    money('15. award weekly', r15.award.weeklyCents, 262.61);
    money('15. gain', r15.award.gainCents, 0.72);
    consistent('15.', r15);

    // ------------------------------------------------------------------ 16
    // Method 1 wins with no HomeCaring at all: a full record spread over 50
    // years averages 42, one band down, and the blend comes to less.

    var r16 = E.entitlement({ paid: 2080, credited: 0, homeCaring: 0, entryYear: 1976, drawdownYear: 2026 });
    eq('16. years is 50', r16.years, 50);
    eq('16. 2,080 / 50 = 41.6 rounds to 42', r16.yearlyAverage.average, 42);
    eq('16. band 40 to 47', r16.yearlyAverage.band.min, 40);
    money('16. band rate', r16.yearlyAverage.band.weeklyCents, 293.50);
    money('16. Method 1 weekly', r16.tca.weeklyCents, 299.30);
    eq('16. mix 80/20, yaShare', r16.method2.yaShare, 80);
    eq('16. mix 80/20, tcaShare', r16.method2.tcaShare, 20);
    money('16. Method 2 weekly (29466 cents exactly)', r16.method2.weeklyCents, 294.66);
    eq('16. basis method1', r16.award.basis, 'method1');
    money('16. award weekly', r16.award.weeklyCents, 299.30);
    eq('16. gain 0', r16.award.gainCents, 0);
    consistent('16.', r16);

    // ------------------------------------------------------------------ 17
    // Every band boundary, both sides. Lower bounds are inclusive, and the
    // band carries its own upper bound so a caller never has to walk the
    // table to find where the band ends. The top band has no upper bound and
    // says so with null rather than with a number nobody published.
    //
    // The expected values are the six published bands (SW19 2026 p.33,
    // boundaries S.I. 592/2024 Schedule 8C), written out here rather than
    // derived from the module's own table.

    var bandCases = [
      // average, min,  max,  weeklyCents
      [52,        48,   null, 29930],
      [48,        48,   null, 29930],
      [47,        40,   47,   29350],
      [40,        40,   47,   29350],
      [39,        30,   39,   26910],
      [30,        30,   39,   26910],
      [29,        20,   29,   25480],
      [20,        20,   29,   25480],
      [19,        15,   19,   19500],
      [15,        15,   19,   19500],
      [14,        10,   14,   11960],
      [10,        10,   14,   11960]
    ];
    bandCases.forEach(function (c) {
      var b = E.band(c[0]);
      eq('17. band(' + c[0] + ').min', b && b.min, c[1]);
      eq('17. band(' + c[0] + ').max', b && b.max, c[2]);
      eq('17. band(' + c[0] + ').weeklyCents', b && b.weeklyCents, c[3]);
    });

    // Below 10 there is no band at all: null, not a zero rate. A zero would
    // blend; the statute says the method simply does not apply.
    eq('17. band(9) is null', E.band(9), null);
    eq('17. band(0) is null', E.band(0), null);

    // ------------------------------------------------------------------ 18
    // Every transition year, and the years on either side of the window.
    //
    // Which side of the window a year falls on is SP.transition()'s answer and
    // is asserted in tests/state-pension.test.js section 15. What is this
    // module's own business is the MIX during the window, and the one thing
    // that can break now the two live in different files: a share table whose
    // keys no longer line up with the window. entitlement() looks the share up
    // unguarded for every year transition() calls 'during', so a missing key
    // would be an undefined share blended silently into a rate.
    //
    // The table is no longer exported, and it does not need to be: a missing
    // key shows up as a year inside the window that comes back with no figure
    // or a NaN one. This asks the calculation itself, year by year, which is
    // the thing that would actually be wrong.

    // one record, eligible in every year, with the years divided by held at 43
    // so only the year's own mix can move the answer
    function forYear(y) {
      return E.entitlement({ paid: 1560, credited: 260, homeCaring: 0,
                             entryYear: y - 43, drawdownYear: y });
    }

    var shareExpected = [null, 90, 80, 70, 60, 50, 40, 30, 20, 10, null];
    for (var y = 2024; y <= 2034; y++) {
      var expected = shareExpected[y - 2024];
      var r18 = forYear(y);
      if (expected === null) {
        eq('18. ' + y + ' is outside the window, so no Yearly Average share',
           r18.state === 'before-transition' ? 'before-transition' : r18.method2.reason,
           y < 2025 ? 'before-transition' : 'after-transition');
      } else {
        eq('18. ' + y + ' blends ' + expected + '% of the Yearly Average rate',
           r18.method2.yaShare, expected);
        eq('18. and ' + (100 - expected) + '% of the TCA rate', r18.method2.tcaShare, 100 - expected);
        // what a missing share would actually produce
        eq('18. ' + y + ' gives a real figure, not a NaN',
           isFinite(r18.method2.weeklyCents), true);
      }
    }

    // The window's own two ends, read back from the calculation rather than
    // from the table, and checked against the module that owns the window.
    var withShare = [];
    for (var wy = 2015; wy <= 2045; wy++) {
      var rw = forYear(wy);
      // a missing share would leave yaShare undefined and the figure NaN while
      // method2 still looked like a figure, so both are required here
      if (rw.state === 'eligible' && !rw.method2.reason &&
          typeof rw.method2.yaShare === 'number' &&
          isFinite(rw.method2.weeklyCents)) withShare.push(wy);
    }
    eq('18. the mix starts where the window opens',
       Math.min.apply(null, withShare), SP.TRANSITION_FIRST);
    eq('18. and ends where it closes',
       Math.max.apply(null, withShare), SP.TRANSITION_LAST);
    eq('18. with no year of the window missing from it',
       withShare.length, SP.TRANSITION_LAST - SP.TRANSITION_FIRST + 1);

    // ------------------------------------------------------------------ 19
    // The public interface, whole.
    //
    // entitlement() is the calculation and band() is the one lookup a caller
    // has any business doing on its own: naming the band an average falls in.
    // Everything else the module once exported was either a step of
    // entitlement() that callers had no reason to repeat, or a table they
    // would have to walk themselves to get an answer this module can give
    // them. A wide interface is a promise about internals; this is the
    // promise, and nothing more.

    eq('19. the module exports exactly entitlement and band',
       Object.keys(E).sort().join(','), 'band,entitlement');

    ['yearlyAverage', 'bandRate', 'bandMin', 'drawdownYear', 'yaShare',
     'YA_BANDS', 'YA_SHARE', 'PAID_MIN', 'CREDITS_CAP_TCA', 'HOMECARING_CAP_TCA',
     'CREDITS_PLUS_HC_CAP', 'MAX_PER_YEAR', 'YA_MIN', 'PENSION_AGE'
    ].forEach(function (name) {
      eq('19. ' + name + ' is not public', typeof E[name], 'undefined');
    });

    // The numbers those constants held are still asserted, at the boundaries
    // where they decide something, which is where a typo would show.

    eq('19. PAID_MIN: 519 paid is short by one',
       E.entitlement({ paid: 519, credited: 1040, homeCaring: 1040, entryYear: 1986, drawdownYear: 2026 }).paidShortBy, 1);
    eq('19. and 520 paid qualifies',
       E.entitlement({ paid: 520, credited: 0, homeCaring: 0, entryYear: 1986, drawdownYear: 2026 }).state, 'eligible');

    // every count here is ABOVE its cap, or the assertion would pass at any cap
    // at or above the input and prove nothing
    var caps = E.entitlement({ paid: 520, credited: 1040, homeCaring: 1560, entryYear: 1966, drawdownYear: 2026 }).tca;
    eq('19. CREDITS_CAP_TCA: 1,040 credits count as 520', caps.creditsCounted, 520);
    eq('19. HOMECARING_CAP_TCA: 1,560 HomeCaring Periods count as 1,040', caps.homeCaringCounted, 1040);
    eq('19. CREDITS_PLUS_HC_CAP: 520 and 1,040 together count as 1,040', caps.extrasCounted, 1040);
    eq('19. and the caps say so', caps.capBit, true);
    // one below each cap, to show the cap is where it is said to be and not lower
    var under = E.entitlement({ paid: 520, credited: 468, homeCaring: 520, entryYear: 1966, drawdownYear: 2026 }).tca;
    eq('19. 468 credits are under the cap and all count', under.creditsCounted, 468);
    eq('19. 520 HomeCaring Periods are under theirs and all count', under.homeCaringCounted, 520);
    eq('19. 988 together are under the combined cap', under.extrasCounted, 988);
    eq('19. and no cap bit', under.capBit, false);

    eq('19. MAX_PER_YEAR: 52 a year is what the years hold',
       E.entitlement({ paid: 2600, credited: 0, homeCaring: 0, entryYear: 1986, drawdownYear: 2026 }).maxForYears, 2080);

    eq('19. YA_MIN: 10 is in a band', E.band(10) !== null, true);
    eq('19. and 9 is in none', E.band(9), null);

    eq('19. PENSION_AGE stays in state-pension.js, which both pages read',
       SP.PENSION_AGE, 66);

    // ------------------------------------------------------------------ 20
    // Coercion. A missing value is a zero, never a NaN, and strings are read
    // as numbers, so a slider value that arrives as text still calculates.

    var r20a = E.entitlement({});
    eq('20. entitlement({}) is no-entitlement', r20a.state, 'no-entitlement');
    eq('20. paidShortBy 520', r20a.paidShortBy, 520);
    eq('20. no weekly or annual figure anywhere in the result', figureKeys(r20a, '').join(','), '');

    var r20b = E.entitlement({ paid: '1560', credited: undefined, homeCaring: null, entryYear: '1985', drawdownYear: 2028 });
    eq('20. strings and nulls, state eligible', r20b.state, 'eligible');
    eq('20. paid read as 1,560', r20b.paid, 1560);
    eq('20. credited undefined read as 0', r20b.credited, 0);
    eq('20. homeCaring null read as 0', r20b.homeCaring, 0);
    eq('20. entryYear read as 1985', r20b.entryYear, 1985);
    eq('20. reckonable 1,560', r20b.tca.reckonable, 1560);
    money('20. Method 1 weekly', r20b.tca.weeklyCents, 224.48);
    eq('20. years is 43', r20b.years, 43);
    eq('20. 1,560 / 43 = 36.28 rounds to 36', r20b.yearlyAverage.average, 36);
    eq('20. band 30 to 39', r20b.yearlyAverage.band.min, 30);
    money('20. band rate', r20b.yearlyAverage.band.weeklyCents, 269.10);
    eq('20. mix 60/40, yaShare', r20b.method2.yaShare, 60);
    eq('20. mix 60/40, tcaShare', r20b.method2.tcaShare, 40);
    money('20. Method 2 weekly (25125.2 cents)', r20b.method2.weeklyCents, 251.25);
    eq('20. basis method2', r20b.award.basis, 'method2');
    money('20. award weekly', r20b.award.weeklyCents, 251.25);
    consistent('20.', r20b);

    // ------------------------------------------------------------------ 21
    // The page's own input space, walked, and what comes out of it.
    //
    // The page has three result panels because three states are all its five
    // controls can produce. The fourth state the module can return,
    // 'before-transition', is not one of them: the birth-year slider starts at
    // this year minus 66, because someone older than that has already passed
    // pension age, so the earliest drawdown year the page can produce is this
    // year itself. 2025 is past, so that is inside the transition window or
    // after it, never before.
    //
    // This walks every birth year and every entry year the page offers,
    // against contribution counts that straddle both gates, and asserts the
    // set of states that come back. Asserting the SET is what makes this a
    // proof rather than an assumption: it says the fourth state never appears
    // AND that the other three all do, so a panel is not being kept for a
    // state that cannot happen or dropped for one that can.
    //
    // The bounds below mirror tools/state-pension-entitlement-parts/page.js,
    // which this suite cannot read: it runs in node and in a browser harness
    // that loads the two modules and nothing else. A mirror can go stale, so
    // the same claim is also checked against the REAL built page, by the panel
    // check in tests/run-tests.py: that one reads the page's own slider bounds
    // in Chrome and fails if a state turns up with no panel for it. This
    // section is the fast proof; that one is the one that cannot drift.

    var THIS_YEAR = new Date().getFullYear();
    eq('21. the premise: this year is not before the window opened',
       THIS_YEAR >= SP.TRANSITION_FIRST, true);

    var BIRTH_MIN = THIS_YEAR - SP.PENSION_AGE;   // reaches 66 this year
    var BIRTH_MAX = THIS_YEAR - 18;
    var ENTRY_AFTER_BIRTH_MIN = 16;
    var ENTRY_AFTER_BIRTH_MAX = SP.PENSION_AGE - 1;
    // every slider step would take minutes; these straddle both gates, the
    // three TCA caps and a full record
    var PAID = [0, 468, 520, 1040, 1560, 2080, 2600];
    var CREDITED = [0, 520, 1040];
    var HOMECARING = [0, 1040];

    var statesFromPage = {}, walked = 0;
    var minAverage = Infinity, minYears = Infinity, maxAverage = -Infinity;
    for (var b = BIRTH_MIN; b <= BIRTH_MAX; b++) {
      var drawdown = b + SP.PENSION_AGE;
      var eMin = b + ENTRY_AFTER_BIRTH_MIN;
      var eMax = Math.min(THIS_YEAR, b + ENTRY_AFTER_BIRTH_MAX);
      for (var e = eMin; e <= eMax; e++) {
        for (var pi = 0; pi < PAID.length; pi++) {
          for (var ci = 0; ci < CREDITED.length; ci++) {
            for (var hi = 0; hi < HOMECARING.length; hi++) {
              var rp = E.entitlement({
                paid: PAID[pi], credited: CREDITED[ci], homeCaring: HOMECARING[hi],
                entryYear: e, drawdownYear: drawdown
              });
              statesFromPage[rp.state] = true;
              walked++;
              if (rp.state === 'eligible' && rp.yearlyAverage) {
                minYears = Math.min(minYears, rp.yearlyAverage.years);
                minAverage = Math.min(minAverage, rp.yearlyAverage.average);
                maxAverage = Math.max(maxAverage, rp.yearlyAverage.average);
              }
            }
          }
        }
      }
    }

    eq('21. the walk covered the page\'s whole birth and entry range',
       walked > 50000, true);
    eq('21. and produced exactly the three states the page has panels for',
       Object.keys(statesFromPage).sort().join(','),
       'eligible,inconsistent,no-entitlement');
    eq('21. before-transition is not among them', statesFromPage['before-transition'], undefined);

    // The same walk proves section 8's guards unreachable from the page too:
    // nothing divides by fewer than ten years and no average exceeds 52.
    eq('21. no eligible result divides by fewer than ten years', minYears >= 10, true);
    eq('21. and none averages more than 52', maxAverage <= 52, true);
    // and, with it, that the page's defensive below-10 line is defence only
    eq('21. the lowest yearly average the page can reach is 10', minAverage, 10);

    // ------------------------------------------------------------------ 22
    // Past a full record. 2,080 paid and 1,040 HomeCaring Periods is 3,120
    // reckonable, over the 2,080 a full record is, so statePension()'s own cap
    // takes it back to 2,080 and the maximum rate.
    //
    // This is the only state in which the page prints "more than a full record
    // of 2,080, so the maximum rate" instead of a percentage, and it turns on
    // tca.capped. It is reachable from the sliders (the HomeCaring count does
    // not go into the paid-plus-credited total the consistency gate measures)
    // and no other row here reaches it, so without this one `capped` could be
    // wired to a constant and nothing would notice.
    //
    // It also separates the two caps that could be confused: the 2,080 full
    // record is statePension()'s, and capBit is about the three TCA caps on
    // credits and HomeCaring Periods, none of which bit here.

    var r22 = E.entitlement({ paid: 2080, credited: 0, homeCaring: 1040, entryYear: 1986, drawdownYear: 2026 });
    eq('22. reckonable 3,120, over a full record', r22.tca.reckonable, 3120);
    eq('22. counted back to 2,080', r22.tca.counted, 2080);
    eq('22. capped is true', r22.tca.capped, true);
    eq('22. fraction is exactly 1', r22.tca.fraction, 1);
    eq('22. but no TCA cap bit: 1,040 HomeCaring Periods are within theirs',
       r22.tca.capBit, false);
    eq('22. homeCaringCounted 1,040', r22.tca.homeCaringCounted, 1040);
    money('22. Method 1 weekly is the maximum personal rate', r22.tca.weeklyCents, 299.30);
    eq('22. the yearly average ignores HomeCaring Periods', r22.yearlyAverage.numerator, 2080);
    eq('22. 2,080 / 40 = 52', r22.yearlyAverage.average, 52);
    money('22. top band rate', r22.yearlyAverage.band.weeklyCents, 299.30);
    money('22. Method 2 blends two equal rates', r22.method2.weeklyCents, 299.30);
    eq('22. so the two methods tie', r22.award.basis, 'tie');
    money('22. award weekly', r22.award.weeklyCents, 299.30);
    money('22. award annual', r22.award.annualCents, 15563.60);
    consistent('22.', r22);
  }

  /* An uncaught throw is recorded by the harness as a failure after the last
     assertion that completed, so the report keeps flowing whether a module is
     missing or the calculation breaks partway through. */
  run();
}(typeof self !== 'undefined' ? self : this));
