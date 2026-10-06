/* The rates the calculators assume, in one place, each with its source.

   Read by the calculator pages (today's money, the risk levels, the cash
   line) and by assets/js/pb-after.js (the figures sent with "Email me this
   result"). Node reads it too (tests/assumptions.test.js). Change a rate
   here, with its source and date, and nothing else.

   INFLATION   the European Central Bank's target, used to put a future
               figure into today's money. A target, not a forecast.
   CASH        what Irish households earned on money in a bank account they
               can take out at any time (overnight deposits), the latest
               month the Central Bank of Ireland has published.
   ASSETS      the most a pension benefit statement may assume each asset
               earns in a year, before charges, from the Pensions Authority's
               guidance, and the most it may assume overall (CAP).
   RISK        seven levels, 1 lowest, 7 highest, on the EU's 1 to 7 scale
               for funds (the Synthetic Risk and Reward Indicator). Each level
               is a mix of shares, bonds and cash of OUR choosing, for
               illustration: it is not a fund. Its rate is the mix of the
               ASSETS figures, capped at CAP, to one decimal place. Its range
               is the rate less and plus the middle of the scale's band of
               yearly ups and downs (volatility) for that level (level 7: the
               band's floor, 25%), to the nearest whole number: roughly what
               one year in a typical run of years could do.

   PBAssume.inflation          { rate, pct, source }
   PBAssume.cash               { rate, pct, month, source }
   PBAssume.assets             { shares, bonds, cash, cap, source }
   PBAssume.risk               [ { level, mix, rate, vol, low, high, holds } ] x 7
   PBAssume.level(n)           one of those, n from 1 to 7
   PBAssume.today(v, years)    v in today's money: v / (1 + inflation)^years
   PBAssume.pct(x)             0.05 -> '5%', 0.034 -> '3.4%', -0.03 -> '-3%'

   Classic script. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBAssume = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function pct(x) {
    var v = Math.round(x * 1000) / 10;
    return (v === 0 ? 0 : v) + '%';
  }

  var INFLATION = {
    rate: 0.02,
    pct: '2%',
    source: 'European Central Bank, monetary policy strategy (8 July 2021, reaffirmed 30 June 2025): ' +
            'inflation of 2% over the medium term. ecb.europa.eu'
  };

  var CASH = {
    rate: 0.0015,
    pct: '0.15%',
    month: 'July 2026',
    source: 'Central Bank of Ireland, Retail Interest Rates statistics: household overnight deposits, ' +
            'weighted average rate, July 2026 (published September 2026). centralbank.ie'
  };

  var ASSETS = {
    shares: 0.0665,
    bonds: 0.034,
    cash: 0.0265,
    cap: 0.06,
    source: 'The Pensions Authority, Guidance in relation to pension benefit statement projection assumptions, ' +
            'version 1.2 (25 October 2024, from 1 January 2025): the most a projection may assume a year before charges, ' +
            'equities and property 6.65%, fixed interest 3.40%, cash 2.65%, and 6% overall. pensionsauthority.ie. ' +
            'Version 1.3 applies from 1 July 2026: confirm these four figures against it.'
  };

  /* the volatility bands of the EU scale, yearly, as fractions:
     1 under 0.5%, 2 0.5-2%, 3 2-5%, 4 5-10%, 5 10-15%, 6 15-25%, 7 25% and over */
  var BANDS = [[0, 0.005], [0.005, 0.02], [0.02, 0.05], [0.05, 0.10], [0.10, 0.15], [0.15, 0.25], [0.25, null]];
  var BANDS_SOURCE = 'CESR/10-673, Guidelines on the methodology for the calculation of the synthetic risk and ' +
                     'reward indicator in the Key Investor Information Document (1 July 2010), section 2: the seven ' +
                     'volatility intervals. esma.europa.eu';

  /* [shares, bonds, cash], and the one line on what the level holds */
  var MIXES = [
    [[0, 0, 1], 'Cash and deposits. Very steady, lowest growth.'],
    [[0.10, 0.50, 0.40], 'Mostly bonds and cash. Steadier, lower growth.'],
    [[0.30, 0.60, 0.10], 'More bonds than shares. Small ups and downs.'],
    [[0.50, 0.45, 0.05], 'About half shares, half bonds. Medium ups and downs.'],
    [[0.60, 0.40, 0], 'More shares than bonds. Bigger ups and downs.'],
    [[0.75, 0.25, 0], 'Mostly shares. Bigger ups and downs, higher growth over time.'],
    [[0.90, 0.10, 0], 'Nearly all shares. The biggest ups and downs.']
  ];

  var RISK = MIXES.map(function (m, i) {
    var mix = m[0];
    var raw = mix[0] * ASSETS.shares + mix[1] * ASSETS.bonds + mix[2] * ASSETS.cash;
    var rate = Math.round(Math.min(raw, ASSETS.cap) * 1000) / 1000;
    var b = BANDS[i], vol = b[1] === null ? b[0] : (b[0] + b[1]) / 2;
    return {
      level: i + 1,
      mix: { shares: mix[0], bonds: mix[1], cash: mix[2] },
      rate: rate,
      vol: vol,
      low: Math.round((rate - vol) * 100) / 100,
      high: Math.round((rate + vol) * 100) / 100,
      holds: m[1]
    };
  });

  function level(n) {
    var i = Math.max(1, Math.min(7, Math.round(+n || 0))) - 1;
    return RISK[i];
  }

  function today(v, years) {
    var y = Math.max(0, +years || 0);
    return v / Math.pow(1 + INFLATION.rate, y);
  }

  return {
    inflation: INFLATION, cash: CASH, assets: ASSETS, risk: RISK, bands: BANDS,
    sources: { inflation: INFLATION.source, cash: CASH.source, assets: ASSETS.source, bands: BANDS_SOURCE,
               mixes: 'Pensionbuddy: the share of shares, bonds and cash at each level is our own illustration, not a fund.' },
    level: level, today: today, pct: pct
  };
}));
