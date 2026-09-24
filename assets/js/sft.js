/* The Standard Fund Threshold, chargeable excess tax, and the tax bands on a
   retirement lump sum (Run 20 #7).

   ------------------------------------------------------------------------
   SOURCES, checked 2026-09-24. Re-check after Budget 2027 (6 October 2026).

     SFT by year         Finance Act 2024 s.13(a)(ii), substituting the
                         definition in TCA 1997 s.787O(1): EUR 2,000,000 for
                         2014 to 2025; 2,200,000 for 2026; 2,400,000 for 2027;
                         2,600,000 for 2028; 2,800,000 for 2029. Revenue's
                         chargeable excess tax page (2 September 2026) gives
                         the same four steps.
     2030 on             the higher of EUR 2,800,000 and 2,800,000 grown by CSO
                         average weekly earnings (Q3 2029 over Q1 2025); from
                         2031 the higher of the year before and that grown by
                         a year of earnings. It can never fall. Nothing here
                         guesses the figure: from 2030 it is "at least" 2.8m.
     CET 40%             chargeable excess tax at the higher rate of income
                         tax, ring-fenced (Revenue Pensions Manual ch. 25,
                         para 6; Revenue's CET page).
     Lump sum            first EUR 200,000 tax-free (a lifetime limit); the
                         next 300,000 at the standard rate, 20%; anything above
                         500,000 taxed as income at the marginal rate, with
                         USC. The 500,000 has been a fixed figure since
                         1 January 2025 (Finance Act 2024 s.13(b); Revenue
                         Pensions Manual ch. 27, January 2026) and no longer
                         rises with the SFT.
     Credit              tax paid on the 20% slice of a lump sum can be set
                         against CET: at most 20% of 300,000, EUR 60,000
                         (Revenue's CET page; ch. 27 para 9).
     Up to about 71%     what is left of an excess after CET is taxed again
                         as income when drawn. The Department of Finance's
                         independent examination of the SFT (de Buitleir,
                         September 2024, section 4.2) puts the combined rate
                         at up to 68.8%, or 71.2% with PRSI: 40% + 60% x 52%.
   ------------------------------------------------------------------------

   Contract: this header and tests/sft.test.js.
   Loads as a plain script (window.PBSft) or via require() in node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBSft = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STEPS = { 2025: 2000000, 2026: 2200000, 2027: 2400000, 2028: 2600000, 2029: 2800000 };
  var LAST_KNOWN = 2029;
  var CET_RATE = 0.40;
  var TAX_FREE = 200000;          // lifetime, across every retirement lump sum since 7 December 2005
  var STANDARD_TOP = 500000;      // fixed since 1 January 2025
  var STANDARD_RATE = 0.20;
  var CREDIT_MAX = STANDARD_RATE * (STANDARD_TOP - TAX_FREE);   // EUR 60,000

  /* { value, atLeast } for a year: the statute's figure to 2029, a floor after */
  function threshold(year) {
    if (year <= 2025) return { value: 2000000, atLeast: false };
    if (year <= LAST_KNOWN) return { value: STEPS[year], atLeast: false };
    return { value: STEPS[LAST_KNOWN], atLeast: true };
  }

  /* a total pension value set against a year's threshold */
  function used(total, year) {
    var t = threshold(year);
    var excess = Math.max(0, total - t.value);
    return {
      threshold: t.value,
      atLeast: t.atLeast,
      share: total / t.value,
      headroom: Math.max(0, t.value - total),
      excess: excess,
      cet: excess * CET_RATE
    };
  }

  /* a retirement lump sum, split across its three bands */
  function lumpSum(amount) {
    var a = Math.max(0, amount);
    var free = Math.min(a, TAX_FREE);
    var standard = Math.min(Math.max(0, a - TAX_FREE), STANDARD_TOP - TAX_FREE);
    return {
      taxFree: free,
      atStandardRate: standard,
      standardTax: standard * STANDARD_RATE,
      asIncome: Math.max(0, a - STANDARD_TOP)
    };
  }

  /* the combined rate on an excess once the rest of it is drawn as income */
  function combinedRate(incomeRate) { return CET_RATE + (1 - CET_RATE) * incomeRate; }

  return {
    STEPS: STEPS, LAST_KNOWN: LAST_KNOWN, CET_RATE: CET_RATE, TAX_FREE: TAX_FREE,
    STANDARD_TOP: STANDARD_TOP, STANDARD_RATE: STANDARD_RATE, CREDIT_MAX: CREDIT_MAX,
    threshold: threshold, used: used, lumpSum: lumpSum, combinedRate: combinedRate
  };
}));
