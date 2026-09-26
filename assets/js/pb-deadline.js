/* Revenue's deadline, in one place (Run 29; counts to the online date since Run 31).

   The countdown is to REVENUE'S ONLINE DEADLINE: the last day a pension
   contribution can be set against the previous tax year if you pay and
   file online through the Revenue Online Service (ROS). Revenue sets it
   each year; for the 2025 tax year it is 18 November 2026 (revenue.ie,
   "Filing your tax return", published 19 March 2026; Revenue eBrief No.
   034/26). ROS below holds one date a year. For everyone who does not pay
   and file online the date is 31 October, stated beside it as a second
   line and never counted to while an online date is known.

   A year with no entry in ROS counts to 31 October instead, and says the
   online date is "usually later, in mid-November" rather than guess: add
   the year's date when Revenue publishes it (docs/STATUS.md, Launch
   status, Parked). Once the year's deadline has passed, everything moves
   on to the next year's deadline and tax year.

   The dates are written without a year, beside the tax year they are for:
   tools/verify.py warns (E1) when the band shows two years, and "the 2025
   tax year ... 18 November 2026" is two.

   Every page loads this at the foot of <body>. What it writes, when the
   element is on the page:
     #ntVal, #navTick   the chip: "53d 12h 59m", and its accessible name
     #tkD #tkH #tkM #tkS  the band's clock, per second (per minute with
                        reduced motion); .tick h2, #tkRev, #tkYear, #tkSr
     #deadlineText      the calculators' row
   The markup carries what this writes today, for a reader without
   JavaScript; the chip's label and the band's eyebrow, "to Revenue's
   deadline" and "Revenue's deadline", never change and are markup only. PBDeadline.at(date) is the arithmetic alone, for
   tests/deadline.test.py. */
(function () {
  'use strict';

  var REVENUE = { month: 9, day: 31 };         /* 31 October, Revenue's date for everyone: months count from 0 */
  /* the Revenue Online Service date, by the year it falls in */
  var ROS = { 2026: { month: 10, day: 18 } };  /* 18 November 2026 */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  function endOf(y, md) { return new Date(y, md.month, md.day, 23, 59, 59); }
  function named(md) { return md.day + ' ' + MONTHS[md.month]; }
  /* the last day Revenue takes a contribution against the year before */
  function last(y) { return endOf(y, ROS[y] || REVENUE); }

  function at(now) {
    var y = now.getFullYear();
    if (now > last(y)) y += 1;
    var target = last(y);
    var diff = Math.max(0, target - now);
    return {
      target: target,
      year: y,
      taxYear: y - 1,
      revenue: named(REVENUE),
      ros: ROS[y] ? named(ROS[y]) : null,
      octPassed: now > endOf(y, REVENUE),
      days: Math.floor(diff / 86400000),
      hrs: Math.floor(diff % 86400000 / 3600000),
      min: Math.floor(diff % 3600000 / 60000),
      sec: Math.floor(diff % 60000 / 1000)
    };
  }

  /* what the countdown counts to: "18 November, Revenue's deadline for the
     2025 tax year if you pay and file online through the Revenue Online
     Service" */
  function targetLine(d) {
    return d.ros
      ? d.ros + ', Revenue’s deadline for the ' + d.taxYear + ' tax year if you pay and file online through the Revenue Online Service'
      : d.revenue + ', Revenue’s deadline for the ' + d.taxYear + ' tax year';
  }

  /* the second line: 31 October for everyone else, or, in a year with no
     online date yet, that the online date is later */
  function revenueLine(d) {
    var online = 'pay and file online through the Revenue Online Service';
    if (!d.ros) return 'If you ' + online + ', it is usually later, in mid-November.';
    return d.octPassed
      ? 'If you do not ' + online + ', it was 31 October, and that has passed.'
      : 'If you do not ' + online + ', it is 31 October.';
  }

  function heading(d) {
    return 'Revenue’s deadline is ' + (d.ros ? d.ros + ' if you pay and file online.' : d.revenue + '.');
  }

  window.PBDeadline = { at: at, targetLine: targetLine, revenueLine: revenueLine, heading: heading };

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var $ = function (id) { return document.getElementById(id); };
  var chip = $('navTick'), chipVal = $('ntVal'),
      bD = $('tkD'), bH = $('tkH'), bM = $('tkM'), bS = $('tkS'),
      sr = $('tkSr'), rev = $('tkRev'), who = $('tkYear'), row = $('deadlineText'),
      head = document.querySelector('.tick h2');

  function tick() {
    var d = at(new Date());
    var left = 'About ' + d.days + ' days left until ' + targetLine(d) + '.';
    if (chipVal) chipVal.textContent = d.days + 'd ' + pad(d.hrs) + 'h ' + pad(d.min) + 'm';
    if (chip) chip.setAttribute('aria-label', left + ' Opens the full explanation.');
    if (bD) {
      bD.textContent = pad(d.days); bH.textContent = pad(d.hrs);
      bM.textContent = pad(d.min); bS.textContent = pad(d.sec);
    }
    if (head) head.textContent = heading(d);
    if (rev) rev.textContent = revenueLine(d);
    if (who) who.textContent = d.taxYear;
    if (sr) sr.textContent = left + ' ' + revenueLine(d);
    if (row) row.innerHTML = 'About <b>' + d.days + ' days</b> left until ' + targetLine(d) + '. ' +
      revenueLine(d) + ' After that, ' + d.taxYear + '’s allowance is gone for good.';
  }

  tick();
  /* the band ticks per second; the chip and the row only need a minute */
  if (chip || bD || row) setInterval(tick, (bD && !reduce) ? 1000 : 60000);
})();
