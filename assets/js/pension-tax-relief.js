/* Revenue's age-related limit on tax-relievable personal contributions:
   a percentage of earnings, with earnings capped at EARN_CAP.

   SINGLE SOURCE OF TRUTH for this logic. Lifted verbatim from
   pension-calculator.html (issues B4/B5) so the calculators cannot drift.
   tests/compare-calc.test.js drives the real pension-calculator.html in a
   headless browser and fails if that page and this module ever disagree.

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

  return {
    EARN_CAP: EARN_CAP,
    reliefBand: reliefBand,
    reliefLimit: reliefLimit,
    reliefOn: reliefOn,
    netCostOf: netCostOf,
    grossForNetCost: grossForNetCost
  };
}));
