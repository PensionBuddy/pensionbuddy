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
  var SP = isNode ? require('../assets/js/state-pension.js') : root.PBStatePension;
  var E  = isNode ? require('../assets/js/state-pension-entitlement.js') : root.PBEntitlement;

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
    eq(row + ' tca.contributions echoes the reckonable count', t.contributions, t.reckonable);
    eq(row + ' tca.eligible is true past the gate', t.eligible, true);
    eq(row + ' tca annual is 52 weeks of tca weekly', t.annualCents, t.weeklyCents * 52);
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
    if (m2 === null) {
      eq(row + ' method2 null means a reason is given', typeof r.method2Unavailable, 'string');
    } else {
      eq(row + ' method2 present means no unavailable reason', r.method2Unavailable, null);
      eq(row + ' the two shares sum to 100', m2.yaShare + m2.tcaShare, 100);
      eq(row + ' method2.weekly is weeklyCents / 100', m2.weekly, m2.weeklyCents / 100);
      eq(row + ' yearlyAverage.weekly is weeklyCents / 100',
         r.yearlyAverage.weekly, r.yearlyAverage.weeklyCents / 100);
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
    eq('1. band 48', r1.yearlyAverage.bandMin, 48);
    money('1. band rate', r1.yearlyAverage.weeklyCents, 299.30);
    eq('1. mix 80/20, yaShare', r1.method2.yaShare, 80);
    eq('1. mix 80/20, tcaShare', r1.method2.tcaShare, 20);
    money('1. Method 2 weekly', r1.method2.weeklyCents, 299.30);
    eq('1. basis tie', r1.award.basis, 'tie');
    money('1. award weekly', r1.award.weeklyCents, 299.30);
    eq('1. gain 0', r1.award.gainCents, 0);
    money('1. award annual', r1.award.annualCents, 15563.60);
    eq('1. no unavailable reason', r1.method2Unavailable, null);
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
    eq('2. band 40', r2.yearlyAverage.bandMin, 40);
    money('2. band rate', r2.yearlyAverage.weeklyCents, 293.50);
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
    eq('3. band 20', r3.yearlyAverage.bandMin, 20);
    money('3. band rate', r3.yearlyAverage.weeklyCents, 254.80);
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
    eq('4. unavailable: yearly-average-below-10', r4.method2Unavailable, 'yearly-average-below-10');
    eq('4. method2 is null', r4.method2, null);
    eq('4. yearlyAverage.years 56', r4.yearlyAverage.years, 56);
    eq('4. yearlyAverage.numerator 520', r4.yearlyAverage.numerator, 520);
    eq('4. 520 / 56 = 9.29 rounds to 9', r4.yearlyAverage.average, 9);
    eq('4. bandMin null', r4.yearlyAverage.bandMin, null);
    eq('4. band weeklyCents null', r4.yearlyAverage.weeklyCents, null);
    eq('4. band weekly null', r4.yearlyAverage.weekly, null);
    eq('4. basis method1', r4.award.basis, 'method1');
    money('4. award weekly', r4.award.weeklyCents, 74.83);
    consistent('4.', r4);

    // ------------------------------------------------------------------ 5, 6
    // Half up at the top band. 47.5 becomes 48 and takes the maximum; 47.4
    // stays at 47 and takes the band below. The Department's own examples.

    eq('5. yearlyAverage(1900, 40) = 47.5 rounds to 48', E.yearlyAverage(1900, 40), 48);
    eq('5. bandRate(48)', E.bandRate(48), 29930);
    eq('6. yearlyAverage(1896, 40) = 47.4 rounds to 47', E.yearlyAverage(1896, 40), 47);
    eq('6. bandRate(47)', E.bandRate(47), 29350);

    // ------------------------------------------------------------------ 7
    // Half up at the floor of the lowest band. This is where the rounding
    // decides between a pension and nothing under Method 2.

    eq('7. yearlyAverage(570, 60) = 9.5 rounds to 10', E.yearlyAverage(570, 60), 10);
    eq('7. bandRate(10)', E.bandRate(10), 11960);
    eq('7. yearlyAverage(564, 60) = 9.4 rounds to 9', E.yearlyAverage(564, 60), 9);
    eq('7. bandRate(9) is null', E.bandRate(9), null);

    // ------------------------------------------------------------------ 8
    // The guards. Never more than 52 a year, and no average over no years.

    eq('8. yearlyAverage(2600, 40) capped at 52', E.yearlyAverage(2600, 40), 52);
    eq('8. yearlyAverage(520, 0) is null', E.yearlyAverage(520, 0), null);
    eq('8. yearlyAverage(520, -1) is null', E.yearlyAverage(520, -1), null);

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
    eq('9. band 40', r9.yearlyAverage.bandMin, 40);
    money('9. band rate', r9.yearlyAverage.weeklyCents, 293.50);
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
    eq('10. band 20', r10.yearlyAverage.bandMin, 20);
    money('10. band rate', r10.yearlyAverage.weeklyCents, 254.80);
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
    eq('11. unavailable: after-transition', r11.method2Unavailable, 'after-transition');
    eq('11. yearlyAverage is null', r11.yearlyAverage, null);
    eq('11. method2 is null', r11.method2, null);
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
    eq('15. band 30', r15.yearlyAverage.bandMin, 30);
    money('15. band rate', r15.yearlyAverage.weeklyCents, 269.10);
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
    eq('16. band 40', r16.yearlyAverage.bandMin, 40);
    money('16. band rate', r16.yearlyAverage.weeklyCents, 293.50);
    money('16. Method 1 weekly', r16.tca.weeklyCents, 299.30);
    eq('16. mix 80/20, yaShare', r16.method2.yaShare, 80);
    eq('16. mix 80/20, tcaShare', r16.method2.tcaShare, 20);
    money('16. Method 2 weekly (29466 cents exactly)', r16.method2.weeklyCents, 294.66);
    eq('16. basis method1', r16.award.basis, 'method1');
    money('16. award weekly', r16.award.weeklyCents, 299.30);
    eq('16. gain 0', r16.award.gainCents, 0);
    consistent('16.', r16);

    // ------------------------------------------------------------------ 17
    // Every band boundary, both sides. Lower bounds are inclusive.

    var bands = [48, 47, 40, 39, 30, 29, 20, 19, 15, 14, 10, 9];
    var bandExpected = [29930, 29350, 29350, 26910, 26910, 25480, 25480, 19500, 19500, 11960, 11960, null];
    bands.forEach(function (avg, i) {
      eq('17. bandRate(' + avg + ')', E.bandRate(avg), bandExpected[i]);
    });

    // ------------------------------------------------------------------ 18
    // Every transition year, and the year on either side of it.
    //
    // Which side of the window a year falls on is SP.transition()'s answer and
    // is asserted in tests/state-pension.test.js section 15. What is this
    // module's own business is the MIX during the window, and the one thing
    // that can now break as those two live in different files: a share table
    // whose keys no longer line up with the window. entitlement() reads
    // YA_SHARE[year] unguarded for every year SP.transition() calls 'during',
    // so a missing key would be an undefined share silently blended into a
    // rate. This asserts the table against the window on both counts, a key
    // for every year inside it and no key outside.

    var shareExpected = [null, 90, 80, 70, 60, 50, 40, 30, 20, 10, null];
    for (var y = 2024; y <= 2034; y++) {
      var inWindow = SP.transition(y) === 'during';
      var share = Object.prototype.hasOwnProperty.call(E.YA_SHARE, y) ? E.YA_SHARE[y] : null;
      eq('18. YA_SHARE[' + y + ']', share, shareExpected[y - 2024]);
      eq('18. and ' + y + ' is ' + (shareExpected[y - 2024] === null ? 'outside' : 'inside') +
         ' the window', inWindow, shareExpected[y - 2024] !== null);
    }

    eq('18. the table starts where the window opens',
       Math.min.apply(null, Object.keys(E.YA_SHARE).map(Number)), SP.TRANSITION_FIRST);
    eq('18. and ends where it closes',
       Math.max.apply(null, Object.keys(E.YA_SHARE).map(Number)), SP.TRANSITION_LAST);
    eq('18. with no year of the window missing from it',
       Object.keys(E.YA_SHARE).length, SP.TRANSITION_LAST - SP.TRANSITION_FIRST + 1);

    eq('18. the overloaded share lookup is gone: transition() answers that now',
       typeof E.yaShare, 'undefined');

    // ------------------------------------------------------------------ 19
    // Drawdown at 66, the only case the page models.

    eq('19. drawdownYear(1962) = 2028', E.drawdownYear(1962), 2028);
    eq('19. drawdownYear(1960) = 2026', E.drawdownYear(1960), 2026);
    eq('19. drawdownYear(2008) = 2074', E.drawdownYear(2008), 2074);

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
    eq('20. band 30', r20b.yearlyAverage.bandMin, 30);
    money('20. band rate', r20b.yearlyAverage.weeklyCents, 269.10);
    eq('20. mix 60/40, yaShare', r20b.method2.yaShare, 60);
    eq('20. mix 60/40, tcaShare', r20b.method2.tcaShare, 40);
    money('20. Method 2 weekly (25125.2 cents)', r20b.method2.weeklyCents, 251.25);
    eq('20. basis method2', r20b.award.basis, 'method2');
    money('20. award weekly', r20b.award.weeklyCents, 251.25);
    consistent('20.', r20b);

    // ---------------------------------------------------------- constants
    // Guarding the constants themselves against a typo, since every rule
    // above is a comparison against one of these numbers. The band and share
    // tables are proven through bandRate and YA_SHARE in rows 17 and 18.

    eq('constants. PAID_MIN', E.PAID_MIN, 520);
    eq('constants. CREDITS_CAP_TCA', E.CREDITS_CAP_TCA, 520);
    eq('constants. HOMECARING_CAP_TCA', E.HOMECARING_CAP_TCA, 1040);
    eq('constants. CREDITS_PLUS_HC_CAP', E.CREDITS_PLUS_HC_CAP, 1040);
    eq('constants. MAX_PER_YEAR', E.MAX_PER_YEAR, 52);
    eq('constants. YA_MIN', E.YA_MIN, 10);
    eq('constants. PENSION_AGE', E.PENSION_AGE, 66);
    eq('constants. PENSION_AGE is state-pension.js\'s, not a second copy',
       E.PENSION_AGE, SP.PENSION_AGE);
    eq('constants. YA_BANDS is exported', typeof E.YA_BANDS, 'object');
    eq('constants. YA_SHARE is exported', typeof E.YA_SHARE, 'object');
  }

  /* An uncaught throw would leave the runner with no report at all. Recording
     it as a failure, with the last assertion that completed, keeps the report
     flowing whether the module is missing or breaks partway through. */
  try {
    run();
  } catch (err) {
    var last = lines.length ? lines[lines.length - 1].split('\n')[0].replace(/^\s*(ok|FAIL)\s+/, '') : '(none)';
    fail++;
    lines.push('  FAIL  uncaught: ' + (err && err.message ? err.message : String(err)) +
               '\n         after: ' + last);
  }

  // ------------------------------------------------------------------ report
  // Same reporting contract as tests/state-pension.test.js, so one runner
  // handles every file.
  var summary = '\n' + (fail === 0 ? 'ALL PASS' : 'FAILURES') +
                '  ' + pass + ' passed, ' + fail + ' failed';
  var report = lines.join('\n') + summary;

  if (isNode) {
    console.log(report);
    process.exit(fail === 0 ? 0 : 1);
  } else {
    root.__TEST_REPORT__ = report;
    root.__TEST_FAILED__ = fail;
  }
}(typeof self !== 'undefined' ? self : this));
