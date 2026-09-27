/* PRSI on additional income, by date, in one place (Run 32; the
   assets/js/pb-deadline.js pattern: one dated table, read by every page that
   states the rate).

   RATES is the employee rate on additional income from the day each rate
   came in: 4.2% from 1 October 2025, 4.35% from 1 October 2026 (Department of
   Social Protection, PRSI Contribution Rates and User Guide 2026, SW14). Add
   the next step here when it is announced; nothing else changes. A date
   before the first entry takes the first entry's rate. Each change starts at
   local midnight, as new Date(2026, 9, 1) did in the two scripts this
   replaces.

   Each rate carries its percentage as written ('4.35%'), because the scripts
   this replaces formatted it with Math.round(rate * 1000) / 10, which turns
   0.0435 into '4.4%'.

   Read by director.html (the "€1,000 of profit, two ways" line) and
   director-calculator.html (the rate itself, and the key under "Taken as
   salary"). Their markup carries the LATEST rate here, so a reader without
   JavaScript sees the rate that applies from its date: tests/build.test.py
   check 18 holds the markup to this table.

   PBPrsi.at(date)   { rate: 0.0435, pct: '4.35%', from: Date, said: '1 October 2026' }
   PBPrsi.latest()   the last entry, in the same shape */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBPrsi = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* from: [year, month counted from 0, day] */
  var RATES = [
    { from: [2025, 9, 1], rate: 0.042, pct: '4.2%', said: '1 October 2025' },
    { from: [2026, 9, 1], rate: 0.0435, pct: '4.35%', said: '1 October 2026' }
  ];

  function shape(r) {
    return { rate: r.rate, pct: r.pct, from: new Date(r.from[0], r.from[1], r.from[2]), said: r.said };
  }

  function at(now) {
    var cur = RATES[0];
    for (var i = 1; i < RATES.length; i++) {
      var r = RATES[i];
      if (now >= new Date(r.from[0], r.from[1], r.from[2])) cur = r;
    }
    return shape(cur);
  }

  function latest() { return shape(RATES[RATES.length - 1]); }

  return { RATES: RATES, at: at, latest: latest };
}));
