/* The same take-home cost, three ways: a pension, the proposed Personal
   Investment Account (PIA), and an exchange-traded fund (ETF) held outside
   any wrapper (pia.html).

   ------------------------------------------------------------------------
   SOURCES, as at 25 September 2026. Re-check on 6 October 2026 (Budget 2027):
   docs/PIA-BUDGET-DAY.md lists every line to change.

     PIA            Department of Finance, Roadmap for the Taxation of Retail
                    Investment, 31 August 2026. PROPOSED, NOT YET LAW. No tax
                    relief going in; a flat annual tax on the account's
                    average value above a tax-free threshold, due even in a
                    year the account falls; no deemed disposal, exit tax or
                    Capital Gains Tax inside; the provider pays the tax.
                    The threshold, the rate and the annual limit are to be
                    announced on 6 October 2026. NOTHING HERE HOLDS A FIGURE
                    FOR ANY OF THEM: the rate and the threshold are the
                    reader's own inputs, and no limit is applied.
     ETF            38% exit tax on the gain, and a deemed disposal on each
                    eighth anniversary of a purchase (Revenue).
     Pension        tax relief from assets/js/pension-tax-relief.js (PBRelief),
                    the lump sum's bands from assets/js/sft.js (PBSft). Nothing
                    about pensions is restated here.
   ------------------------------------------------------------------------

   The reader pays the same amount out of take-home pay every month into
   each. The month is the calculators' own: growth, then an end-of-month
   payment. Every product grows at the same rate, year by year, from `path`.

   Contract: docs/CALC-SPEC-PIA.md. Tests: tests/pia.test.js.
   Loads as a plain script (window.PBPia) or via require() in node. */
(function (root, factory) {
  var node = typeof module === 'object' && module.exports;
  var api = factory(node ? require('./pension-tax-relief.js') : root.PBRelief,
                    node ? require('./sft.js') : root.PBSft);
  if (node) module.exports = api;
  else root.PBPia = api;
}(typeof self !== 'undefined' ? self : this, function (PBRelief, PBSft) {
  'use strict';
  if (!PBRelief || !PBSft) throw new Error('pia.js needs pension-tax-relief.js and sft.js loaded first');

  var ETF_EXIT_TAX = 0.38;        // Revenue: funds and ETFs
  var DEEMED_YEARS = 8;           // Revenue: deemed disposal every eighth anniversary
  var LUMP_SHARE = 0.25;          // the site's own: "up to 25% of the fund", director-calculator.html, standard-fund-threshold.html
  var PENSION_ACCESS_AGE = 60;    // the site's own: "normally taken from 60", pensions-over-50.html

  /* The example scenarios beside the reader's own growth. Illustrations,
     not forecasts, and the page says which is which. */
  var LOWER_SHARE = 0.5;          // "lower growth": half the reader's rate
  var FALL = -0.20;               // "a fall": the final year loses 20%

  function monthsFactor(g) { return Math.pow(1 + g, 1 / 12); }

  /* one rate for every year */
  function steady(g, years) {
    var out = [];
    for (var y = 0; y < years; y++) out.push(g);
    return out;
  }

  /* ---- the pension -------------------------------------------------------
     Each year the take-home amount is grossed up through PBRelief at the
     reader's age that year, so the age-related limit applies as it would.
     At the end, a quarter is taken as a lump sum through PBSft's bands and
     the rest is taxed as income at the reader's rate. */
  function pension(o) {
    var net = o.monthly * 12, pot = 0, gross = 0, relief = 0, yearly = [0];
    for (var y = 0; y < o.path.length; y++) {
      var g = PBRelief.grossForNetCost(net, o.age + y, o.salary, o.taxRate);
      var m = g / 12, f = monthsFactor(o.path[y]);
      for (var k = 0; k < 12; k++) pot = pot * f + m;
      gross += g;
      relief += g - net;
      yearly.push(pot);
    }
    var lump = PBSft.lumpSum(pot * LUMP_SHARE);
    var lumpTax = lump.standardTax + lump.asIncome * o.taxRate / 100;
    var restTax = pot * (1 - LUMP_SHARE) * o.taxRate / 100;
    var endAge = o.age + o.path.length;
    return {
      paidIn: net * o.path.length,
      gross: gross,
      relief: relief,
      pot: pot,
      taxDuring: 0,
      taxOut: lumpTax + restTax,
      lumpTaxFree: lump.taxFree,
      afterTax: pot - lumpTax - restTax,
      endAge: endAge,
      beforeAccess: endAge < PENSION_ACCESS_AGE,
      yearly: yearly
    };
  }

  /* ---- the PIA -----------------------------------------------------------
     Each year's tax is the reader's rate on the average of the twelve
     month-end values above the reader's threshold, taken from the account at
     the year end. How the average will really be measured is not yet
     published: this is the illustration's assumption, and the spec says so.
     No annual limit is applied, because none has been announced. */
  function pia(o) {
    if (o.threshold == null || !(o.threshold >= 0) || !(o.rate >= 0)) return null;
    var v = 0, tax = 0, lossYearTax = 0, lossYears = 0, taxedLossYears = 0, yearly = [0], taxes = [];
    for (var y = 0; y < o.path.length; y++) {
      var start = v, sum = 0, f = monthsFactor(o.path[y]);
      for (var k = 0; k < 12; k++) { v = v * f + o.monthly; sum += v; }
      var t = o.rate * Math.max(0, sum / 12 - o.threshold);
      t = Math.min(t, v);
      var fell = v < start + o.monthly * 12;          // the investments lost money this year
      v -= t;
      tax += t;
      taxes.push(t);
      if (fell) { lossYears++; lossYearTax += t; if (t > 0) taxedLossYears++; }
      yearly.push(v);
    }
    return {
      paidIn: o.monthly * 12 * o.path.length,
      taxDuring: tax,
      taxOut: 0,
      afterTax: v,
      lossYears: lossYears,
      taxedLossYears: taxedLossYears,
      lossYearTax: lossYearTax,
      taxes: taxes,
      yearly: yearly
    };
  }

  /* ---- the ETF outside a wrapper -----------------------------------------
     Every month's purchase is its own lot. On each eighth anniversary of a
     lot, 38% of its gain since its base is due, paid by selling part of the
     lot, and the base becomes what is left. A lot below its base pays
     nothing and keeps its base. At the end everything is sold: 38% of each
     lot's gain over its base; a lot below its base gets back tax it paid on
     earlier deemed disposals, up to 38% of the shortfall, as the credit for
     deemed-disposal tax works. Accumulating fund: no dividends paid out. */
  function etf(o) {
    var lots = [], dd = 0, yearly = [0], month = 0;
    for (var y = 0; y < o.path.length; y++) {
      var f = monthsFactor(o.path[y]);
      for (var k = 0; k < 12; k++) {
        month++;
        for (var i = 0; i < lots.length; i++) {
          var L = lots[i];
          L.value *= f;
          if ((month - L.bought) % (DEEMED_YEARS * 12) === 0) {
            var gain = L.value - L.base;
            if (gain > 0) {
              var t = ETF_EXIT_TAX * gain;
              L.value -= t;
              L.paid += t;
              dd += t;
              L.base = L.value;
            }
          }
        }
        lots.push({ bought: month, value: o.monthly, base: o.monthly, paid: 0 });
      }
      yearly.push(lots.reduce(function (s, L) { return s + L.value; }, 0));
    }
    var value = 0, exit = 0;
    lots.forEach(function (L) {
      value += L.value;
      var gain = L.value - L.base;
      exit += gain > 0 ? ETF_EXIT_TAX * gain : -Math.min(L.paid, ETF_EXIT_TAX * -gain);
    });
    return {
      paidIn: o.monthly * 12 * o.path.length,
      taxDuring: dd,
      taxOut: exit,
      value: value,
      afterTax: value - exit,
      yearly: yearly
    };
  }

  /* The three side by side, for one growth path. `o`: monthly (euro, from
     take-home pay), path (a yearly growth rate per year, as fractions), age,
     salary, taxRate (20 or 40), piaRate (a fraction), piaThreshold (euro, or
     null while the reader has not entered one). */
  function compare(o) {
    return {
      pension: pension(o),
      pia: pia({ monthly: o.monthly, path: o.path, rate: o.piaRate, threshold: o.piaThreshold }),
      etf: etf(o)
    };
  }

  /* The reader's growth, half of it, and the reader's growth with a 20%
     fall in the final year. `o` as compare() but with growth, a fraction,
     and years, in place of path. */
  function scenarios(o) {
    var years = Math.max(1, Math.round(o.years));
    function run(path) {
      var p = {};
      Object.keys(o).forEach(function (k) { p[k] = o[k]; });
      p.path = path;
      return compare(p);
    }
    var fall = steady(o.growth, years);
    fall[years - 1] = FALL;
    return {
      yours: run(steady(o.growth, years)),
      lower: run(steady(o.growth * LOWER_SHARE, years)),
      fall: run(fall)
    };
  }

  return {
    ETF_EXIT_TAX: ETF_EXIT_TAX, DEEMED_YEARS: DEEMED_YEARS, LUMP_SHARE: LUMP_SHARE,
    PENSION_ACCESS_AGE: PENSION_ACCESS_AGE, LOWER_SHARE: LOWER_SHARE, FALL: FALL,
    steady: steady, pension: pension, pia: pia, etf: etf, compare: compare, scenarios: scenarios
  };
}));
