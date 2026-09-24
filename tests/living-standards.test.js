/* Acceptance tests for the Irish Retirement Living Standards data.
   Contract: the header of assets/js/living-standards.js.

   Runs BOTH ways with no build step:
       node tests/living-standards.test.js
       python3 tests/run-tests.py living-standards      (headless Chrome)

   Every expected figure below was read from the report (Pensions Council /
   KPMG, September 2024), p. 9 for the annual totals, p. 12 for the monthly
   split, pp. 13-14 for the published percentages. Whole euro throughout, so
   every comparison is exact: no tolerance. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('living-standards');
  var eq = t.eq, group = t.group;

  var LS = isNode ? require('../assets/js/living-standards.js') : root.PBLivingStandards;
  var SP = isNode ? require('../assets/js/state-pension.js') : root.PBStatePension;

  group('1  the six headline figures, a year (p. 9)');
  var ANNUAL = { single: [19200, 27600, 33600], couple: [28800, 37200, 43200] };
  LS.HOUSEHOLDS.forEach(function (hh) {
    LS.LEVELS.forEach(function (lv, i) {
      eq('1. ' + hh + ' ' + lv + ', a year', LS.standard(lv, hh).annual, ANNUAL[hh][i]);
    });
  });

  group('2  a month, and a year is exactly twelve months (p. 12)');
  var MONTH = { single: [1600, 2300, 2800], couple: [2400, 3100, 3600] };
  LS.HOUSEHOLDS.forEach(function (hh) {
    LS.LEVELS.forEach(function (lv, i) {
      var s = LS.standard(lv, hh);
      eq('2. ' + hh + ' ' + lv + ', a month', s.monthly, MONTH[hh][i]);
      eq('2. ' + hh + ' ' + lv + ', twelve of them', s.annual, s.monthly * 12);
    });
  });

  group('3  the seven categories add up to the total, with nothing left over');
  LS.HOUSEHOLDS.forEach(function (hh) {
    LS.LEVELS.forEach(function (lv) {
      var s = LS.standard(lv, hh), sum = 0, yr = 0;
      s.categories.forEach(function (c) { sum += c.monthly; yr += c.annual; });
      eq('3. ' + hh + ' ' + lv + ', seven categories', s.categories.length, 7);
      eq('3. ' + hh + ' ' + lv + ', they add up to the month', sum, s.monthly);
      eq('3. ' + hh + ' ' + lv + ', and to the year', yr, s.annual);
    });
  });

  group('4  the ability to save is its own row, outside the total (p. 12)');
  var SAVE = { single: [50, 100, 150], couple: [100, 200, 300] };
  LS.HOUSEHOLDS.forEach(function (hh) {
    LS.LEVELS.forEach(function (lv, i) {
      var s = LS.standard(lv, hh);
      eq('4. ' + hh + ' ' + lv + ', left to save', s.save, SAVE[hh][i]);
      eq('4. ' + hh + ' ' + lv + ', and not a category', s.categories.filter(function (c) { return c.key === 'save'; }).length, 0);
    });
  });

  group('5  every category share rounds to the percentage the report prints (pp. 13-14)');
  var PCT = {
    single: {
      modest:      [38, 25, 3, 9, 3, 3, 19],
      moderate:    [33, 20, 4, 11, 7, 4, 22],
      comfortable: [29, 19, 6, 11, 7, 6, 22]
    },
    couple: {
      modest:      [29, 23, 7, 8, 6, 5, 21],
      moderate:    [26, 20, 7, 10, 8, 6, 23],
      comfortable: [25, 19, 8, 10, 8, 6, 24]
    }
  };
  LS.HOUSEHOLDS.forEach(function (hh) {
    LS.LEVELS.forEach(function (lv) {
      var got = LS.standard(lv, hh).categories.map(function (c) { return Math.round(c.share * 100); });
      eq('5. ' + hh + ' ' + lv + ', shares', got.join(' '), PCT[hh][lv].join(' '));
    });
  });

  group('6  the report\'s order and names');
  eq('6. categories in order', LS.CATEGORIES.map(function (c) { return c.key; }).join(' '),
     'housing food transport health leisure clothing onceOff');
  eq('6. levels in order', LS.LEVELS.join(' '), 'modest moderate comfortable');
  eq('6. single is the default household', LS.standard('moderate').household, 'single');
  eq('6. labels', LS.LEVELS.map(function (l) { return LS.standard(l).label; }).join(' '), 'Modest Moderate Comfortable');
  var threw = false;
  try { LS.standard('lavish', 'single'); } catch (e) { threw = true; }
  eq('6. an unknown level throws rather than returning nothing', threw, true);

  group('7  state-pension.js carries the single totals too: the two agree');
  LS.LEVELS.forEach(function (lv) {
    var mine = LS.standard(lv, 'single'), theirs = SP.STANDARDS[lv];
    eq('7. ' + lv + ', the same annual figure', mine.annual * 100, theirs.annualCents);
    eq('7. ' + lv + ', the housing share it rounds to', Math.round(mine.categories[0].share * 100) / 100, theirs.housingShare);
  });
  eq('7. the same three, in the same order', LS.LEVELS.join(' '), SP.STANDARD_ORDER.join(' '));
}(typeof self !== 'undefined' ? self : this));
