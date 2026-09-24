/* Acceptance tests for the cost of waiting (starter.html).
   Contract: docs/CALC-SPEC-COST-OF-WAITING.md

   Runs BOTH ways with no build step:
       node tests/cost-of-waiting.test.js
       python3 tests/run-tests.py cost-of-waiting      (headless Chrome)

   The expected values are worked out a second way wherever that is possible:
   a pot by stepping month by month (grow, then pay in) rather than by the
   closed form, and a catch-up figure by growing it back into the pot it has
   to reach. The three figures the 30/40/50 chart has always printed at its
   default, from its own inline copy of project(), are asserted to the euro,
   so the chart reading the module instead cannot have moved them.

   The module returns euro floats; a drift of even 1c fails. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  var t = H.suite('cost-of-waiting', { tolerance: 0.005 });
  var eq = t.eq, group = t.group;
  /* under a tolerance the harness compares numbers only, so a yes/no or a
     missing figure is asserted as 1 or 0, the way compare-calc does it */
  function yes(label, cond) { return eq(label, cond ? 1 : 0, 1); }

  var W = isNode ? require('../assets/js/cost-of-waiting.js') : root.PBWaiting;

  /* a pot the long way round: every month the pot grows, then a payment lands */
  function stepped(months, startPot, monthly, rate) {
    var pot = startPot;
    for (var i = 0; i < months; i++) pot = pot * (1 + rate) + monthly;
    return pot;
  }

  var r5 = W.monthlyRate(5);

  group('1  the growth rate is the calculators\' own conversion');
  eq('1. twelve months of it is 5% a year', Math.round(Math.pow(1 + r5, 12) * 1e12) / 1e12, 1.05);
  eq('1. zero growth is a zero monthly rate', W.monthlyRate(0), 0);
  eq('1. defaults: pension age 66', W.PENSION_AGE, 66);
  eq('1. defaults: growth 5%', W.DEFAULT_GROWTH, 5);

  group('2  project() against the month-by-month pot');
  eq('2. 36 years of EUR 300, nothing to start', W.project(432, 0, 300, r5), stepped(432, 0, 300, r5));
  eq('2. ten years of EUR 100 on EUR 10,000', W.project(120, 10000, 100, r5), stepped(120, 10000, 100, r5));
  eq('2. a starting pot alone', W.project(60, 5000, 0, r5), stepped(60, 5000, 0, r5));
  eq('2. no growth: pot plus payments', W.project(12, 100, 10, 0), 220);
  eq('2. no months: the starting pot', W.project(0, 750, 300, r5), 750);

  group('3  the 30/40/50 chart\'s own figures at EUR 300 a month (its markup)');
  eq('3. started at 30', Math.round(W.potFrom(30, 66, 300, 5)), 352848);
  eq('3. started at 40', Math.round(W.potFrom(40, 66, 300, 5)), 188188);
  eq('3. started at 50', Math.round(W.potFrom(50, 66, 300, 5)), 87102);
  eq('3. potFrom is project() from nothing', W.potFrom(45, 66, 425, 5), W.project(252, 0, 425, r5));
  eq('3. at pension age there is nothing to grow', W.potFrom(66, 66, 300, 5), 0);
  eq('3. past it, likewise', W.potFrom(70, 66, 300, 5), 0);

  group('4  monthlyFor is the inverse of project()');
  eq('4. back to EUR 300 over 432 months', W.monthlyFor(W.project(432, 0, 300, r5), 432, r5), 300);
  eq('4. back to EUR 1,000 over 12 months', W.monthlyFor(W.project(12, 0, 1000, r5), 12, r5), 1000);
  eq('4. no growth: the target over the months', W.monthlyFor(1200, 24, 0), 50);
  yes('4. no months left: no figure', W.monthlyFor(1000, 0, r5) === null);
  yes('4. negative months: no figure', W.monthlyFor(1000, -12, r5) === null);

  group('5  waiting nothing costs nothing');
  var c0 = W.costOfWaiting({ age: 30, wait: 0, monthly: 300 });
  eq('5. the same pot', c0.later, c0.now);
  eq('5. nothing less', c0.less, 0);
  eq('5. the catch-up is the monthly amount itself', c0.catchUpMonthly, 300);
  eq('5. nothing extra', c0.extraMonthly, 0);
  yes('5. not too late', c0.tooLate === false);

  group('6  the card at its default: 30, five years, EUR 300 a month');
  var c = W.costOfWaiting({ age: 30, wait: 5, monthly: 300 });
  eq('6. starts now at 30', c.startNow, 30);
  eq('6. starts later at 35', c.startLater, 35);
  eq('6. now is the chart\'s started-at-30 pot', c.now, W.potFrom(30, 66, 300, 5));
  eq('6. later is the pot from 35', c.later, stepped(372, 0, 300, r5));
  eq('6. less is the difference', c.less, c.now - c.later);
  eq('6. to the euro: now', Math.round(c.now), 352848);
  eq('6. to the euro: later', Math.round(c.later), 260525);
  eq('6. to the euro: less', Math.round(c.less), 92322);
  eq('6. to the euro: the catch-up', Math.round(c.catchUpMonthly), 406);
  eq('6. to the euro: the extra', Math.round(c.extraMonthly), 106);
  eq('6. the catch-up, paid from 35, reaches the pot from 30', stepped(372, 0, c.catchUpMonthly, r5), c.now);
  eq('6. extra is catch-up less the monthly amount', c.extraMonthly, c.catchUpMonthly - 300);

  group('7  a longer wait always costs more, never less');
  var prevLess = -1, prevCatch = 0, rising = true;
  for (var w = 0; w <= 10; w++) {
    var k = W.costOfWaiting({ age: 30, wait: w, monthly: 300 });
    if (!(k.less > prevLess) || !(k.catchUpMonthly > prevCatch)) rising = false;
    prevLess = k.less; prevCatch = k.catchUpMonthly;
  }
  yes('7. less and the catch-up both rise with every extra year, 0 to 10', rising);
  eq('7. ten years later is the chart\'s started-at-40 pot', Math.round(W.costOfWaiting({ age: 30, wait: 10, monthly: 300 }).later), 188188);

  group('8  no months left: no catch-up figure');
  var late = W.costOfWaiting({ age: 60, wait: 6, monthly: 300 });
  yes('8. starting at 66 is too late', late.tooLate === true);
  eq('8. nothing grows from 66', late.later, 0);
  eq('8. so the whole pot from 60 is less', late.less, late.now);
  yes('8. no catch-up figure', late.catchUpMonthly === null);
  yes('8. no extra figure', late.extraMonthly === null);
  var last = W.costOfWaiting({ age: 60, wait: 5, monthly: 300 });
  yes('8. one year left is not too late', last.tooLate === false);
  eq('8. the catch-up over the last twelve months', last.catchUpMonthly, W.monthlyFor(last.now, 12, r5));
  eq('8. and it reaches the pot', stepped(12, 0, last.catchUpMonthly, r5), last.now);

  group('9  what the caller may leave out, and what it may set');
  var d = W.costOfWaiting({ age: 40, wait: 3, monthly: 200 });
  var e = W.costOfWaiting({ age: 40, wait: 3, monthly: 200, growth: 5, retireAge: 66 });
  eq('9. defaults are 5% and 66', d.now, e.now);
  var g0 = W.costOfWaiting({ age: 40, wait: 2, monthly: 100, growth: 0 });
  eq('9. no growth: 26 years of EUR 100', g0.now, 31200);
  eq('9. no growth: the catch-up spreads the same total over 24 years', g0.catchUpMonthly, 31200 / 288);
  var r70 = W.costOfWaiting({ age: 40, wait: 2, monthly: 100, retireAge: 70 });
  eq('9. a later retirement age is honoured', r70.now, W.potFrom(40, 70, 100, 5));
}(typeof self !== 'undefined' ? self : this));
