/* The cost of waiting: the same monthly amount started now or later, and what
   a later start would need each month to catch up.

   The growth maths is the pension calculator's own: a yearly assumption
   turned into a monthly rate as (1 + g/100)^(1/12) - 1, and project()
   exactly as the calculators write it. The calculators keep their own copy,
   which tests/render-diff holds byte-identical; this module is the one the
   pages outside them share, starting with starter.html (the 30/40/50 chart
   and the "If you wait" card under it).

   withBreak() is the "Time out." card under it (Run 20 #15): the same
   monthly amount paid from 30 to 66 with and without a few years' break.

   Nothing here is a projection for a particular reader: no starting pot, no
   tax relief, no charges, no inflation. The page says so beside the figures.

   Contract: docs/CALC-SPEC-COST-OF-WAITING.md.
   Tests: tests/cost-of-waiting.test.js.
   Loads as a plain script (window.PBWaiting) or via require() in node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBWaiting = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PENSION_AGE = 66;       // CONTEXT.md: pension age, and where the chart stops
  var DEFAULT_GROWTH = 5;     // the calculators' default yearly assumption, in %

  function monthlyRate(growthPct) {
    return Math.pow(1 + growthPct / 100, 1 / 12) - 1;
  }

  /* the pension calculator's project(), unchanged */
  function project(months, startPot, monthly, rate) {
    var grownPot = startPot * Math.pow(1 + rate, months);
    var grownContrib = rate > 0 ? monthly * ((Math.pow(1 + rate, months) - 1) / rate) : monthly * months;
    return grownPot + grownContrib;
  }

  function potFrom(startAge, retireAge, monthly, growthPct) {
    if (startAge >= retireAge) return 0;
    return project((retireAge - startAge) * 12, 0, monthly, monthlyRate(growthPct));
  }

  /* the level monthly amount that grows to target in the given months */
  function monthlyFor(target, months, rate) {
    if (!(months > 0)) return null;
    return rate > 0 ? target * rate / (Math.pow(1 + rate, months) - 1) : target / months;
  }

  function costOfWaiting(o) {
    var retire = o.retireAge == null ? PENSION_AGE : o.retireAge;
    var growth = o.growth == null ? DEFAULT_GROWTH : o.growth;
    var later = o.age + o.wait;
    var now = potFrom(o.age, retire, o.monthly, growth);
    var then = potFrom(later, retire, o.monthly, growth);
    var tooLate = later >= retire;
    var catchUp = tooLate ? null : monthlyFor(now, (retire - later) * 12, monthlyRate(growth));
    return {
      startNow: o.age,
      startLater: later,
      now: now,
      later: then,
      less: Math.max(0, now - then),
      catchUpMonthly: catchUp,
      extraMonthly: catchUp == null ? null : catchUp - o.monthly,
      tooLate: tooLate
    };
  }

  var BREAK_FROM = 30;         // the break card pays in from 30, as the chart's first row does

  /* A break in payments (Run 20 #15): paying in from `from` to pension age,
     except for `years` years starting at `breakAge`. The pot keeps growing
     through the break with nothing paid in, so what the break costs is the
     missed payments grown to pension age. A break that would run past pension
     age stops there. extraMonthly is what paying in more after the break,
     every month to pension age, would take to make it up. */
  function withBreak(o) {
    var retire = o.retireAge == null ? PENSION_AGE : o.retireAge;
    var growth = o.growth == null ? DEFAULT_GROWTH : o.growth;
    var from = o.from == null ? BREAK_FROM : o.from;
    var rate = monthlyRate(growth);
    var start = Math.min(Math.max(o.breakAge, from), retire);
    var end = Math.min(start + o.years, retire);
    var full = potFrom(from, retire, o.monthly, growth);
    var missed = project((end - start) * 12, 0, o.monthly, rate) * Math.pow(1 + rate, (retire - end) * 12);
    var after = (retire - end) * 12;
    return {
      from: from,
      breakStart: start,
      breakEnd: end,
      yearsOut: end - start,
      full: full,
      withBreak: full - missed,
      less: missed,
      share: full > 0 ? missed / full : 0,
      extraMonthly: after > 0 ? monthlyFor(missed, after, rate) : null,
      tooLate: after <= 0
    };
  }

  return {
    PENSION_AGE: PENSION_AGE,
    DEFAULT_GROWTH: DEFAULT_GROWTH,
    BREAK_FROM: BREAK_FROM,
    monthlyRate: monthlyRate,
    project: project,
    potFrom: potFrom,
    monthlyFor: monthlyFor,
    costOfWaiting: costOfWaiting,
    withBreak: withBreak
  };
}));
