/* What a pension's charges cost: one pot and one monthly payment, grown to
   retirement under two sets of charges and under none.

   ------------------------------------------------------------------------
   SOURCES, checked 2026-09-24 (Run 20, #3):
     5% of each contribution and 1% a year of the fund are the maximum
     charges on a Standard PRSA, Pensions Act 1990 s.104(5) and (6); the
     Pensions Authority's own pension calculator assumes the same two. They
     are the page's defaults for "your plan", as an example, never as a
     claim about any provider.
   ------------------------------------------------------------------------

   The month runs in one order: growth, then the annual management charge
   taken from the grown fund (a year of it leaves exactly 1 - amc), then the
   payment less its contribution charge. With no charges that is the
   calculators' own month, growth then an end-of-month payment, and the
   suite holds it to cost-of-waiting.js's project() to the cent.

   Contract: docs/CALC-SPEC-FEES.md. Tests: tests/pension-fees.test.js.
   Loads as a plain script (window.PBFees) or via require() in node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBFees = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STANDARD_PRSA = { amc: 0.01, contribution: 0.05 };   // Pensions Act 1990 s.104(5), (6)

  /* one plan, month by month; every figure a euro float */
  function project(o) {
    var years = Math.max(0, Math.round(o.years));
    var gm = Math.pow(1 + o.growth, 1 / 12);
    var am = Math.pow(1 - (o.amc || 0), 1 / 12);
    var c = o.contribution || 0;
    var pot = o.pot, amcPaid = 0, contributionPaid = 0, paidIn = 0, yearly = [pot];
    for (var m = 1; m <= years * 12; m++) {
      pot = pot * gm;
      var charge = pot * (1 - am);
      pot -= charge;
      amcPaid += charge;
      pot += o.monthly * (1 - c);
      contributionPaid += o.monthly * c;
      paidIn += o.monthly;
      if (m % 12 === 0) yearly.push(pot);
    }
    return { pot: pot, amcPaid: amcPaid, contributionPaid: contributionPaid, paidIn: paidIn, yearly: yearly };
  }

  function plan(o, charges) {
    return project({ pot: o.pot, monthly: o.monthly, years: o.years, growth: o.growth,
                     amc: charges ? charges.amc : 0, contribution: charges ? charges.contribution : 0 });
  }

  function compare(o) {
    var a = plan(o, o.a), b = plan(o, o.b), none = plan(o, null);
    return {
      a: a, b: b, none: none,
      costA: none.pot - a.pot,
      costB: none.pot - b.pot,
      difference: b.pot - a.pot
    };
  }

  return { STANDARD_PRSA: STANDARD_PRSA, project: project, compare: compare };
}));
