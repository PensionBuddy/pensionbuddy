/* The deadline, in one place (Run 29).

   Two dates, and they are not the same thing:

   - DAMIAN'S CUT-OFF, 15 October: "Book by 15 October so we have time to
     process before the Revenue deadline." The nav chip, the home page's
     countdown band and the calculators' "Tax deadline" row all count to the
     end of this day (23:59:59, the reader's clock).
   - REVENUE'S DEADLINE, stated beside it and never replaced by it: a
     contribution paid by 31 October can be set against the previous tax
     year; if you both pay and file online through the Revenue Online
     Service the date is later, and Revenue sets it each year. For the 2025
     tax year it is 18 November 2026 (revenue.ie, "Filing your tax return",
     published 19 March 2026; Revenue eBrief No. 034/26). ROS below holds
     one date a year; a year with no entry says "mid-November" rather than
     guess. The dates are written without a year, like the cut-off, beside
     the tax year they are for: tools/verify.py warns (E1) when the band
     shows two years, and "the 2025 tax year ... 31 October 2026" is two.

   After 15 October the countdown moves on to the next year's cut-off, as
   the old one did after 31 October (docs/STATUS.md, Run 29, R29-4).

   Every page loads this at the foot of <body>, in place of the two inline
   scripts each page carried (the chip-and-band countdown, and the
   calculators' row). What it writes, when the element is on the page:
     #ntVal, #navTick   the chip: "20d 04h 33m", and its accessible name
     #tkD #tkH #tkM #tkS  the band's clock, per second (per minute with
                        reduced motion); .tick h2, #tkRev, #tkYear, #tkSr
     #deadlineText      the calculators' row
   PBDeadline.at(date) is the arithmetic alone, for tests/deadline.test.py. */
(function () {
  'use strict';

  var CUTOFF = { month: 9, day: 15 };          /* 15 October: months count from 0 */
  var ROS = { 2026: '18 November' };           /* the Revenue Online Service date, by the year it falls in */

  function at(now) {
    var y = now.getFullYear();
    var cut = new Date(y, CUTOFF.month, CUTOFF.day, 23, 59, 59);
    if (now > cut) { y += 1; cut = new Date(y, CUTOFF.month, CUTOFF.day, 23, 59, 59); }
    var diff = Math.max(0, cut - now);
    return {
      cutoff: cut,
      year: y,
      taxYear: y - 1,
      revenue: '31 October',
      ros: ROS[y] || null,
      days: Math.floor(diff / 86400000),
      hrs: Math.floor(diff % 86400000 / 3600000),
      min: Math.floor(diff % 3600000 / 60000),
      sec: Math.floor(diff % 60000 / 1000)
    };
  }

  /* "31 October, or 18 November if you pay and file online through the
     Revenue Online Service" */
  function revenueLine(d) {
    return d.revenue + ', or ' + (d.ros || 'mid-November') +
      ' if you pay and file online through the Revenue Online Service';
  }

  window.PBDeadline = { at: at, revenueLine: revenueLine };

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var $ = function (id) { return document.getElementById(id); };
  var chip = $('navTick'), chipVal = $('ntVal'),
      bD = $('tkD'), bH = $('tkH'), bM = $('tkM'), bS = $('tkS'),
      sr = $('tkSr'), rev = $('tkRev'), who = $('tkYear'), row = $('deadlineText'),
      head = document.querySelector('.tick h2');

  function tick() {
    var d = at(new Date());
    var left = 'About ' + d.days + ' days left to book by 15 October, so we have time to process ' +
      'your contribution before the Revenue deadline for the ' + d.taxYear + ' tax year.';
    if (chipVal) chipVal.textContent = d.days + 'd ' + pad(d.hrs) + 'h ' + pad(d.min) + 'm';
    if (chip) chip.setAttribute('aria-label', left + ' Opens the full explanation.');
    if (bD) {
      bD.textContent = pad(d.days); bH.textContent = pad(d.hrs);
      bM.textContent = pad(d.min); bS.textContent = pad(d.sec);
    }
    if (head) head.textContent = 'Book by 15 October so we have time to process before the Revenue deadline.';
    if (rev) rev.textContent = revenueLine(d);
    if (who) who.textContent = d.taxYear;
    if (sr) sr.textContent = left + ' Revenue’s deadline is ' + revenueLine(d) + '.';
    if (row) row.innerHTML = 'About <b>' + d.days + ' days</b> left to book by 15 October, so we have ' +
      'time to process before the Revenue deadline. Revenue’s deadline for a contribution against your ' +
      d.taxYear + ' tax bill is ' + revenueLine(d) + '. After that, ' + d.taxYear +
      '’s allowance is gone for good.';
  }

  tick();
  /* the band ticks per second; the chip and the row only need a minute */
  if (chip || bD || row) setInterval(tick, (bD && !reduce) ? 1000 : 60000);
})();
