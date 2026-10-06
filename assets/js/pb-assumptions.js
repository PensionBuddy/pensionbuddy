/* The rates the calculators assume, in one place, each with its source.

   Read by the calculator pages (today's money, the risk levels, the cash
   line) and by assets/js/pb-after.js (the figures sent with "Email me this
   result"). Node reads it too (tests/assumptions.test.js). Change a rate
   here, with its source and date, and nothing else.

   INFLATION is the European Central Bank's target, used to put a future
   figure into today's money. It is a target, not a forecast.

   PBAssume.inflation          { rate, pct, source }
   PBAssume.today(v, years)    v in today's money: v / (1 + inflation)^years

   Classic script. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBAssume = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var INFLATION = {
    rate: 0.02,
    pct: '2%',
    source: 'European Central Bank, monetary policy strategy (8 July 2021, reaffirmed 30 June 2025): ' +
            'inflation of 2% over the medium term. ecb.europa.eu'
  };

  function today(v, years) {
    var y = Math.max(0, +years || 0);
    return v / Math.pow(1 + INFLATION.rate, y);
  }

  return { inflation: INFLATION, today: today };
}));
