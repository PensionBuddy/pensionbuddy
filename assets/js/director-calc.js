/* The director calculator's arithmetic, apart from the page, so node can test
   it (tests/director-calc.test.js). Nothing here is new tax law: every rate
   is the one the page already used, with its source.

   RATES
     income tax   40%    the higher rate (Revenue, Tax rates, bands and reliefs)
     USC          8%     the top Universal Social Charge rate (Revenue, USC
                         rates and thresholds)
     PRSI         from assets/js/pb-prsi.js, by date (4.35% from 1 October 2026)
     company tax  12.5%  the trading rate of corporation tax (Revenue,
                         Corporation Tax rates; Taxes Consolidation Act 1997,
                         section 21A)
   LEFT OUT, and said so on the page: employer PRSI on salary, the lower
   income tax and USC bands, the company's other income, and the tax on the
   pension when it is taken.

   PBDirector.keepRate(prsi)            share of a euro of salary that reaches you
   PBDirector.split(c, pct, prsi)       one step of the salary and pension split:
       { pct, asSalary, takeHome, toPension, taxSaved, companyTax }
       taxSaved: income tax, USC and PRSI not paid now on the part put in
       the pension. companyTax: corporation tax saved on the whole amount,
       the same at every step, because salary and pension contributions are
       both a cost the company can deduct.
   PBDirector.steps(c, prsi)            split() at 0%, 10% ... 100%
   PBDirector.project(months, pot, monthly, mRate)
   PBDirector.monthlyRate(yearly)       (1 + yearly)^(1/12) - 1
   PBDirector.funding(salary)           Revenue's two-thirds limit, as steps
   PBDirector.companyTax(c, years)      12.5% of each year's payment, added up
   PBDirector.waiting(o)                the cost of starting later, in today's money:
       o = { pot, yearly, years, delay, rate, today(v, y) } ->
       { now, later, gap, gapToday } */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBDirector = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var INCOME_TAX = 0.40, USC = 0.08, CT = 0.125, LIMIT = 2 / 3;

  function keepRate(prsi) { return 1 - (INCOME_TAX + USC + prsi); }

  function split(c, pct, prsi) {
    var toPension = c * pct / 100, asSalary = c - toPension;
    return {
      pct: pct,
      asSalary: asSalary,
      takeHome: asSalary * keepRate(prsi),
      toPension: toPension,
      taxSaved: toPension * (INCOME_TAX + USC + prsi),
      companyTax: c * CT
    };
  }

  function steps(c, prsi) {
    var out = [];
    for (var p = 0; p <= 100; p += 10) out.push(split(c, p, prsi));
    return out;
  }

  function monthlyRate(yearly) { return Math.pow(1 + yearly, 1 / 12) - 1; }

  function project(months, pot, monthly, mRate) {
    var grownPot = pot * Math.pow(1 + mRate, months);
    var grownContrib = mRate > 0 ? monthly * ((Math.pow(1 + mRate, months) - 1) / mRate) : monthly * months;
    return grownPot + grownContrib;
  }

  function funding(salary) {
    return { salary: salary, share: LIMIT, pension: salary * LIMIT };
  }

  function companyTax(c, years) { return c * CT * Math.max(0, years); }

  /* the pot still grows while the payments wait; only the payments start late */
  function waiting(o) {
    var m = monthlyRate(o.rate), months = o.years * 12, wait = Math.min(o.delay, o.years) * 12;
    var now = project(months, o.pot, o.yearly / 12, m);
    var later = project(months - wait, o.pot * Math.pow(1 + m, wait), o.yearly / 12, m);
    var gap = Math.max(0, now - later);
    return { now: now, later: later, gap: gap, gapToday: o.today ? o.today(gap, o.years) : gap };
  }

  return {
    INCOME_TAX: INCOME_TAX, USC: USC, CT: CT, LIMIT: LIMIT,
    keepRate: keepRate, split: split, steps: steps, monthlyRate: monthlyRate, project: project,
    funding: funding, companyTax: companyTax, waiting: waiting
  };
}));
