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

   Every page loads this at the foot of <body>, except the three calculators
   with the "Tax deadline" row (pension-calculator, director-calculator and
   broker-vs-autoenrolment), which load it straight after that row (Run 32):
   filled from the foot, the row grew from nothing after the first paint and
   pushed the calculator down. Nothing here needs more of the page than the
   nav and the element it writes. What it writes, when the element is on
   the page:
     #ntVal, #navTick   the chip: "54d 06h 41m", and its accessible name
     #tkD #tkH #tkM     the band's days, hours and minutes; .tick h2,
                        #tkRev, #tkYear, #tkSr
     #deadlineText      the calculators' row, in days
   Days, hours and minutes, never seconds (Run 41, Damian's call; Run 32
   had cut it to days with no timer, D21). It counts again on the turn of
   each minute, on a timeout set to that moment rather than a 60-second
   interval, so it neither drifts nor lags a sleeping laptop by up to a
   minute; and, as before, when the browser brings the page back from its
   back-forward cache and when you come back to the tab. The words a
   screen reader gets (#tkSr, the chip's name) and the calculators' row
   stay in days: a sentence that changes every minute is noise there.
   For a reader without JavaScript the markup carries the date instead
   (Run 32): the band what this writes today, its clock not shown (it
   shows only with html.pb-js, from the first paint, so filling it moves
   nothing); the
   calculators' row and the chip's name the words of PBDeadline.statics(),
   with no count; and the chip a static span, "18 Nov 2026, online" (just
   "18 Nov 2026" beside the nav's links, from 1440) (.nt-off), which shows
   only while <html> lacks pb-js, the class the
   script in <head> sets before anything paints. With JavaScript the chip
   shows its live spans (.nt-on) as before. The chip's
   live label and the band's eyebrow, "to Revenue's deadline" and "Revenue's
   deadline", never change and are markup only. PBDeadline.at(date) is the
   arithmetic alone, for tests/deadline.test.py. */
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

  /* What the markup says for a reader without JavaScript (Run 32): the same
     words with no count, and the year on each date, since nothing tells that
     reader which year it is. Nothing here runs on the page: the chip's
     static spans, its accessible name and the calculators' row carry these
     strings as markup (and the home band its bandHead, bandRev and
     bandYear), and tests/deadline.test.py holds the markup to this by the
     real clock, so it fails once the deadline has moved on a year, until
     the markup moves on to what this gives then. They change only when the
     deadline moves on to the next year, so they never say "was". */
  function statics(d) {
    var date = (d.ros || d.revenue) + ' ' + d.year;
    var target = date + ', Revenue’s deadline for the ' + d.taxYear + ' tax year' +
      (d.ros ? ' if you pay and file online through the Revenue Online Service' : '');
    var online = 'pay and file online through the Revenue Online Service';
    var second = d.ros
      ? 'If you do not ' + online + ', it is ' + d.revenue + ' ' + d.year + '.'
      : 'If you ' + online + ', it is usually later, in mid-November.';
    /* the chip has room for the short month alone, and beside the nav's links
       (1440 and wider) for the date alone: its ", online" is a span the NAV
       block hides there, where "18 Nov 2026, online" overruns the row */
    var md = d.ros ? ROS[d.year] : REVENUE;
    return {
      /* the home band's markup, as this writes it before 31 October */
      bandHead: heading(d),
      bandRev: d.ros ? 'If you do not ' + online + ', it is ' + d.revenue + '.' : second,
      bandYear: '' + d.taxYear,
      chipDate: md.day + ' ' + MONTHS[md.month].slice(0, 3) + ' ' + d.year,
      chipMore: d.ros ? ', online' : '',
      chipName: target + '. Opens the full explanation.',
      row: '<b>' + date + '</b>' + target.slice(date.length) + '. ' + second +
        ' After that, ' + d.taxYear + '’s allowance is gone for good.'
    };
  }

  window.PBDeadline = { at: at, targetLine: targetLine, revenueLine: revenueLine, heading: heading, statics: statics };

  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var chip = $('navTick'), chipVal = $('ntVal'), bD = $('tkD'), bH = $('tkH'), bM = $('tkM'),
      sr = $('tkSr'), rev = $('tkRev'), who = $('tkYear'), row = $('deadlineText'),
      head = document.querySelector('.tick h2');

  function tick() {
    var d = at(new Date());
    var left = 'About ' + d.days + ' days left until ' + targetLine(d) + '.';
    if (chipVal) chipVal.textContent = d.days + 'd ' + pad(d.hrs) + 'h ' + pad(d.min) + 'm';
    if (chip) chip.setAttribute('aria-label', left + ' Opens the full explanation.');
    if (bD) bD.textContent = '' + d.days;
    if (bH) bH.textContent = pad(d.hrs);
    if (bM) bM.textContent = pad(d.min);
    if (head) head.textContent = heading(d);
    if (rev) rev.textContent = revenueLine(d);
    if (who) who.textContent = d.taxYear;
    if (sr) sr.textContent = left + ' ' + revenueLine(d);
    if (row) row.innerHTML = 'About <b>' + d.days + ' days</b> left until ' + targetLine(d) + '. ' +
      revenueLine(d) + ' After that, ' + d.taxYear + '’s allowance is gone for good.';
  }

  /* on the turn of the count's minute, which is the deadline's (23:59:59),
     not the wall clock's: worked out afresh each time, a few milliseconds
     late so the count has moved when it runs */
  var timer = null;
  function next() {
    clearTimeout(timer);
    var now = new Date();
    timer = setTimeout(function () { tick(); next(); }, Math.max(0, at(now).target - now) % 60000 + 20);
  }

  tick();
  if (chip || bD) next();
  window.addEventListener('pageshow', function (e) { if (e.persisted) { tick(); if (chip || bD) next(); } });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { tick(); if (chip || bD) next(); } });
})();
