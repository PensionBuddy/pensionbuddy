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

   After 15 October the countdown does not jump a year (R29-4, Run 30):
   until Revenue's own deadline has passed it counts to it, the online date
   (18 November in 2026) where ROS has one for that year and 31 October
   where it has none, and says the cut-off has passed. Only after that does
   it move on to the next year's cut-off and tax year. at() names the two
   stretches: phase 'cutoff' and phase 'revenue'.

   Every page loads this at the foot of <body>, in place of the two inline
   scripts each page carried (the chip-and-band countdown, and the
   calculators' row). What it writes, when the element is on the page:
     #ntVal, #navTick   the chip: "20d 04h 33m", its accessible name, and
                        its label (.nt-l): "to book by 15 October", or
                        "to Revenue's deadline" once the cut-off has passed
     #tkD #tkH #tkM #tkS  the band's clock, per second (per minute with
                        reduced motion); #tkTag (the eyebrow), .tick h2,
                        #tkRev, #tkYear, #tkSr
     #deadlineText      the calculators' row
   PBDeadline.at(date) is the arithmetic alone, for tests/deadline.test.py. */
(function () {
  'use strict';

  var CUTOFF = { month: 9, day: 15 };          /* 15 October: months count from 0 */
  var REVENUE = { month: 9, day: 31 };         /* 31 October, Revenue's date for everyone */
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
    var cut = endOf(y, CUTOFF);
    var phase = now > cut ? 'revenue' : 'cutoff';
    var target = phase === 'cutoff' ? cut : last(y);
    var diff = Math.max(0, target - now);
    return {
      phase: phase,
      target: target,
      cutoff: cut,
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

  /* "31 October, or 18 November if you pay and file online through the
     Revenue Online Service"; once 31 October has passed, the online date
     alone */
  function revenueLine(d) {
    var online = ' if you pay and file online through the Revenue Online Service';
    if (d.octPassed) return d.ros + online + ' (the 31 October date has passed)';
    return d.revenue + ', or ' + (d.ros || 'mid-November') + online;
  }

  /* what the countdown is counting to, once the cut-off has passed:
     "18 November, Revenue's deadline for the 2025 tax year if you pay and
     file online through the Revenue Online Service" */
  function targetLine(d) {
    return d.ros
      ? d.ros + ', Revenue’s deadline for the ' + d.taxYear + ' tax year if you pay and file online through the Revenue Online Service'
      : d.revenue + ', Revenue’s deadline for the ' + d.taxYear + ' tax year';
  }

  window.PBDeadline = { at: at, revenueLine: revenueLine, targetLine: targetLine };

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var $ = function (id) { return document.getElementById(id); };
  var chip = $('navTick'), chipVal = $('ntVal'),
      bD = $('tkD'), bH = $('tkH'), bM = $('tkM'), bS = $('tkS'),
      sr = $('tkSr'), rev = $('tkRev'), who = $('tkYear'), row = $('deadlineText'),
      tag = $('tkTag'), head = document.querySelector('.tick h2'),
      chipLab = chip && chip.querySelector('.nt-l');

  function tick() {
    var d = at(new Date()), before = d.phase === 'cutoff';
    /* after the cut-off, while 31 October is still ahead of an online date */
    var otherwise = d.ros && !d.octPassed ? ' If you do not pay and file online, it is 31 October.' : '';
    var left = before
      ? 'About ' + d.days + ' days left to book by 15 October, so we have time to process ' +
        'your contribution before the Revenue deadline for the ' + d.taxYear + ' tax year.'
      : 'Our 15 October cut-off has passed. About ' + d.days + ' days left until ' + targetLine(d) + '.';
    if (chipVal) chipVal.textContent = d.days + 'd ' + pad(d.hrs) + 'h ' + pad(d.min) + 'm';
    if (chip) chip.setAttribute('aria-label', left + ' Opens the full explanation.');
    if (chipLab) chipLab.textContent = before ? 'to book by 15 October' : 'to Revenue’s deadline';
    if (bD) {
      bD.textContent = pad(d.days); bH.textContent = pad(d.hrs);
      bM.textContent = pad(d.min); bS.textContent = pad(d.sec);
    }
    if (tag) tag.textContent = before ? 'Damian’s cut-off' : 'Revenue’s deadline';
    if (head) head.textContent = before
      ? 'Book by 15 October so we have time to process before the Revenue deadline.'
      : 'Our 15 October cut-off has passed. Revenue’s deadline is ' + (d.ros || d.revenue) +
        (d.ros ? ' if you pay and file online.' : '.');
    if (rev) rev.textContent = revenueLine(d);
    if (who) who.textContent = d.taxYear;
    if (sr) sr.textContent = before
      ? left + ' Revenue’s deadline is ' + revenueLine(d) + '.'
      : left + otherwise;
    if (row) row.innerHTML = before
      ? 'About <b>' + d.days + ' days</b> left to book by 15 October, so we have ' +
        'time to process before the Revenue deadline. Revenue’s deadline for a contribution against your ' +
        d.taxYear + ' tax bill is ' + revenueLine(d) + '. After that, ' + d.taxYear +
        '’s allowance is gone for good.'
      : 'Our 15 October cut-off has passed. About <b>' + d.days + ' days</b> left until ' +
        targetLine(d) + '.' + otherwise + ' After that, ' + d.taxYear + '’s allowance is gone for good.';
  }

  tick();
  /* the band ticks per second; the chip and the row only need a minute */
  if (chip || bD || row) setInterval(tick, (bD && !reduce) ? 1000 : 60000);
})();
