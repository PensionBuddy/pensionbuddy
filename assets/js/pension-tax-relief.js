/* Revenue's age-related limit on tax-relievable personal contributions:
   a percentage of earnings, with earnings capped at EARN_CAP.

   SINGLE SOURCE OF TRUTH for this logic. Lifted verbatim from
   pension-calculator.html (issues B4/B5) so the calculators cannot drift.
   tests/compare-calc.test.js drives the real pension-calculator.html in a
   headless browser and fails if that page and this module ever disagree.

   Two families of function live here:
     flat    reliefOn / netCostOf / grossForNetCost take a single marginal
             rate. pension-calculator.html works this way and is guarded by
             the drift test, so these are frozen.
     tiered  the *Tiered variants split a contribution at the standard rate
             cut-off point, 40% on the euros above it and 20% below, which is
             what actually happens. Added 2026-09-10 for the comparison page.

   Loads as a plain script (window.PBRelief) or via require() in node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBRelief = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EARN_CAP = 115000;

  function reliefBand(age) {
    return age < 30 ? 0.15
         : age < 40 ? 0.20
         : age < 50 ? 0.25
         : age < 55 ? 0.30
         : age < 60 ? 0.35
         :            0.40;
  }

  /* The most a contribution can attract relief on, for this age and salary. */
  function reliefLimit(age, earnings) {
    return Math.round(reliefBand(age) * Math.min(earnings, EARN_CAP));
  }

  /* Relief actually earned on a gross annual contribution.
     Anything above the limit still reaches the pension, it just gets no relief. */
  function reliefOn(grossAnnual, age, earnings, taxRatePct) {
    var relievable = Math.min(grossAnnual, reliefLimit(age, earnings));
    return relievable * (taxRatePct / 100);
  }

  /* What that gross contribution actually costs the person after relief. */
  function netCostOf(grossAnnual, age, earnings, taxRatePct) {
    return grossAnnual - reliefOn(grossAnnual, age, earnings, taxRatePct);
  }

  /* Inverse of netCostOf: the gross contribution that costs exactly targetNet.
     Used to open the comparison like for like against auto-enrolment. */
  function grossForNetCost(targetNet, age, earnings, taxRatePct) {
    if (targetNet <= 0) return 0;
    var limit = reliefLimit(age, earnings);
    var t = taxRatePct / 100;
    var withinLimit = targetNet / (1 - t);
    if (withinLimit <= limit) return withinLimit;
    return targetNet - limit * (1 - t) + limit;
  }

  /* ---- tiered relief, at the rate each euro actually attracts ------------

     Standard rate cut-off points: the taxable income above which the rate is
     40%. revenue.ie, checked 2026-09-10. These move most years; review at
     each Budget. The two-income figure is a MAXIMUM, reached only where the
     lower earner has at least EUR 35,000 of income of their own; a couple with
     one income is EUR 53,000. */
  var SRCOP_YEAR = 2026;
  var SRCOP = { single: 44000, marriedOneIncome: 53000, marriedTwoIncomes: 88000 };

  /* How many euros of a contribution are relieved at each rate. A pension
     contribution comes off the top of taxable income, so the euros of it that
     sit above the cut-off point are relieved at 40% and the rest at 20%. The
     age-related limit still decides how many euros get relief at all. */
  function reliefTiers(age, earnings, srcop) {
    var limit = reliefLimit(age, earnings);
    var t40 = Math.min(Math.max(0, earnings - srcop), limit);
    return { limit: limit, t40: t40, t20: Math.max(0, limit - t40) };
  }

  /* Relief on a gross contribution, tier by tier. Returns the split as well
     as the total so a page can say "at 40% and 20%" with the figures. */
  function reliefSplitTiered(grossAnnual, age, earnings, srcop) {
    var t = reliefTiers(age, earnings, srcop);
    var in40 = Math.min(Math.max(0, grossAnnual), t.t40);
    var in20 = Math.min(Math.max(0, grossAnnual - t.t40), t.t20);
    return { at40: 0.40 * in40, at20: 0.20 * in20, relievedAt40: in40, relievedAt20: in20,
             total: 0.40 * in40 + 0.20 * in20 };
  }

  function reliefOnTiered(grossAnnual, age, earnings, srcop) {
    return reliefSplitTiered(grossAnnual, age, earnings, srcop).total;
  }

  function netCostOfTiered(grossAnnual, age, earnings, srcop) {
    return grossAnnual - reliefOnTiered(grossAnnual, age, earnings, srcop);
  }

  /* Inverse of netCostOfTiered. Each euro of net cost buys 1/0.60 of gross
     while the 40% tier lasts, then 1/0.80 through the 20% tier, then one for
     one past the limit where nothing is relieved. */
  function grossForNetCostTiered(targetNet, age, earnings, srcop) {
    if (targetNet <= 0) return 0;
    var t = reliefTiers(age, earnings, srcop);
    var gross = 0, left = targetNet, take;
    take = Math.min(left / 0.60, t.t40); gross += take; left -= take * 0.60;
    take = Math.min(left / 0.80, t.t20); gross += take; left -= take * 0.80;
    return gross + left;
  }

  return {
    EARN_CAP: EARN_CAP,
    SRCOP_YEAR: SRCOP_YEAR,
    SRCOP: SRCOP,
    reliefBand: reliefBand,
    reliefLimit: reliefLimit,
    reliefOn: reliefOn,
    netCostOf: netCostOf,
    grossForNetCost: grossForNetCost,
    reliefTiers: reliefTiers,
    reliefSplitTiered: reliefSplitTiered,
    reliefOnTiered: reliefOnTiered,
    netCostOfTiered: netCostOfTiered,
    grossForNetCostTiered: grossForNetCostTiered
  };
}));
