/* My Future Fund (auto-enrolment) contribution maths, and the side-by-side
   comparison against a broker-arranged personal pension or PRSA.

   ------------------------------------------------------------------------
   SOURCE STATUS, checked 2026-09-10 against gov.ie.
   Confirmed at source: the 2026 rates (1.5% / 1.5% / 0.5%), and that
   contributions "will not be levied on any gross pay over EUR 80,000",
   which covers ALL THREE contributions, the employee's own included.
   Still from third-party summaries: the later phase rates and years, and
   the position that the scheme takes nothing above its set rate. Damian
   should confirm those two against gov.ie or NAERSA.
   ------------------------------------------------------------------------

   Contract: docs/CALC-SPEC.md. Tests: tests/compare-calc.test.js.
   Loads as a plain script (window.PBCompare) or via require() in node.

   13 October 2026: the page asks only what you put in a month and your tax
   rate, and works through monthly() at the foot of this file. The yearly,
   salary-based functions above it stay, unchanged and tested: the starter
   page uses autoEnrolment() and AE_PHASES. */
(function (root, factory) {
  var relief = (typeof module === 'object' && module.exports)
    ? require('./pension-tax-relief.js')
    : root.PBRelief;
  var api = factory(relief);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBCompare = api;
}(typeof self !== 'undefined' ? self : this, function (PBRelief) {
  'use strict';

  /* Every contribution is calculated on gross pay up to this cap: employee,
     employer and State alike. gov.ie: "Contributions will not, however, be
     levied on any gross pay over EUR 80,000." Corrected 2026-09-10; the
     original brief had the employee's own contribution uncapped, which was
     wrong. Payroll actually stops after the pay period in which the threshold
     is crossed, so a little can be paid on earnings above it in that period;
     an annual illustration ignores that. */
  var AE_SALARY_CAP = 80000;

  /* Phased in three-year steps, ratio always 3 employee : 3 employer : 1 State.
     See the source warning above before trusting these in production. */
  var AE_PHASES = [
    { phase: 1, fromYear: 1,  toYear: 3,        years: '2026 to 2028', employee: 0.015, employer: 0.015, state: 0.005 },
    { phase: 2, fromYear: 4,  toYear: 6,        years: '2029 to 2031', employee: 0.03,  employer: 0.03,  state: 0.01  },
    { phase: 3, fromYear: 7,  toYear: 9,        years: '2032 to 2034', employee: 0.045, employer: 0.045, state: 0.015 },
    { phase: 4, fromYear: 10, toYear: Infinity, years: '2035 onward',  employee: 0.06,  employer: 0.06,  state: 0.02  }
  ];

  function phaseForYear(year) {
    for (var i = 0; i < AE_PHASES.length; i++) {
      if (year >= AE_PHASES[i].fromYear && year <= AE_PHASES[i].toYear) return AE_PHASES[i];
    }
    return AE_PHASES[AE_PHASES.length - 1];
  }

  /* Path A. Auto-enrolment contributions come out of net, after-tax pay and
     attract no marginal income tax relief, so netCost is the employee's own
     contribution in full. The employer match and State top-up are the benefit. */
  function autoEnrolment(salary, year) {
    var p = phaseForYear(year);
    var capped = Math.min(salary, AE_SALARY_CAP);
    var above = Math.max(0, salary - AE_SALARY_CAP);
    var employee = p.employee * capped;          // capped, like the other two
    var employer = p.employer * capped;
    var state    = p.state    * capped;
    return {
      phase: p.phase,
      years: p.years,
      rates: { employee: p.employee, employer: p.employer, state: p.state },
      salaryCapApplies: salary > AE_SALARY_CAP,
      cappedSalary: capped,
      salaryAboveCap: above,
      employee: employee,
      employer: employer,
      state: state,
      totalIn: employee + employer + state,
      netCost: employee                          // no tax relief on this path
    };
  }

  /* Relief is pluggable. A number is a flat marginal rate in percent, the way
     the page originally worked and the way pension-calculator.html still
     does. An object { srcop } splits the contribution at that standard rate
     cut-off point, 40% above and 20% below, which is what Revenue actually
     does; the page now works this way. Both routes go through PBRelief. */
  function reliefOn(gross, age, salary, relief) {
    return typeof relief === 'number'
      ? PBRelief.reliefOn(gross, age, salary, relief)
      : PBRelief.reliefOnTiered(gross, age, salary, relief.srcop);
  }
  function grossForNet(net, age, salary, relief) {
    return typeof relief === 'number'
      ? PBRelief.grossForNetCost(net, age, salary, relief)
      : PBRelief.grossForNetCostTiered(net, age, salary, relief.srcop);
  }
  function reliefFrom(opts) {
    return opts.srcop != null ? { srcop: opts.srcop } : opts.taxRate;
  }

  /* Path B. A personal pension or PRSA through a broker: marginal-rate relief
     within Revenue's limits, and an employer contribution ONLY where the
     employer separately agrees to one (defaults to none). */
  function personalPension(grossAnnual, age, salary, relief, employerMatchPct) {
    var r        = reliefOn(grossAnnual, age, salary, relief);
    var employer = (employerMatchPct || 0) / 100 * salary;
    var split    = typeof relief === 'number' ? null
                 : PBRelief.reliefSplitTiered(grossAnnual, age, salary, relief.srcop);
    return {
      gross: grossAnnual,
      reliefLimit: PBRelief.reliefLimit(age, salary),
      relief: r,
      reliefSplit: split,                         // { at40, at20, ... } when tiered
      aboveReliefLimit: Math.max(0, grossAnnual - PBRelief.reliefLimit(age, salary)),
      employer: employer,
      totalIn: grossAnnual + employer,
      netCost: grossAnnual - r
    };
  }

  /* The gross personal contribution that costs the same net amount as the
     auto-enrolment employee contribution, so the comparison opens like for like. */
  function matchedGross(salary, year, age, relief) {
    return grossForNet(autoEnrolment(salary, year).netCost, age, salary, relief);
  }

  /* Money above the cap. Auto-enrolment takes nothing on salary above
     AE_SALARY_CAP, so the person's own rate on that part never leaves their
     take-home pay. A personal pension could take that same net amount. An
     additive signal for salaries over the cap; it does not change the
     like-for-like basis and it claims no crossover. */
  function aboveCap(salary, year, age, relief) {
    var ae = autoEnrolment(salary, year);
    var strandedNet = ae.rates.employee * ae.salaryAboveCap;
    return {
      above: ae.salaryAboveCap,
      rate: ae.rates.employee,
      strandedNet: strandedNet,
      couldBe: strandedNet > 0 ? grossForNet(strandedNet, age, salary, relief) : 0
    };
  }

  /* MODE 2: COMBINED. Auto-enrolment at the statutory rate, plus a personal
     top-up for anything the person wants to save above the minimum.

     ------------------------------------------------------------------------
     SOURCE WARNING. My Future Fund does not currently accept contributions
     above the fixed statutory rate: no AVCs are supported in the current
     implementation. That is current as of the research date (September 2026)
     and is sourced from third-party summaries and one community forum thread,
     NOT from the primary legislation text. The underlying Act reportedly
     allows for AVCs in principle even though the live scheme does not support
     them. Reconfirm against gov.ie or NAERSA before launch. If AVCs become
     available, the premise of this mode changes.
     ------------------------------------------------------------------------

     The extra amount is what the person is willing to pay from their own
     pocket each month. It is grossed up through the SAME shared relief
     function Mode 1 uses (grossForNetCost) and the relief limit is applied by
     calling Mode 1's own personalPension(), treated as its own contribution
     independent of the auto-enrolment layer.

     The employer top-up match is deliberately on a DIFFERENT basis to Mode 1.
     Mode 1's match is a percentage of salary, a fixed salary-based benefit in
     a full-replacement scenario. Here it represents an employer matching what
     the person personally chooses to add on, so it is a percentage of the
     top-up's grossed-up contribution. A tiny top-up gets a tiny match; it can
     never come out as a flat salary-based figure (Case 12). */
  function combined(opts) {
    var ae = autoEnrolment(opts.salary, opts.year);
    var extraNet = (opts.extraMonthly || 0) * 12;
    var relief = reliefFrom(opts);
    var extraGross = grossForNet(extraNet, opts.age, opts.salary, relief);
    // relief and the age-band cap come from Mode 1's function, asked for with
    // no employer match because the match is applied on the top-up basis below
    var layer = personalPension(extraGross, opts.age, opts.salary, relief, 0);
    var topUpMatch = (opts.topUpMatchPct || 0) / 100 * extraGross;
    var extra = {
      gross: layer.gross,
      reliefLimit: layer.reliefLimit,
      relief: layer.relief,
      reliefSplit: layer.reliefSplit,
      aboveReliefLimit: layer.aboveReliefLimit,
      employer: topUpMatch,                     // % of the top-up, not of salary
      totalIn: layer.gross + topUpMatch,
      netCost: layer.netCost                    // == extraNet by construction
    };
    return {
      autoEnrolment: ae,            // unchanged Mode 1 figures
      extraNet: extraNet,           // what the person pays for the top-up
      extra: extra,                 // gross, relief, employer, totalIn, netCost
      totalIn: ae.totalIn + extra.totalIn,
      netCost: ae.netCost + extra.netCost
    };
  }

  /* Reports which path puts more in for THESE inputs. Auto-enrolment winning
     is a correct and expected outcome, never something to correct for. */
  function compare(opts) {
    var a = autoEnrolment(opts.salary, opts.year);
    var b = personalPension(opts.gross, opts.age, opts.salary, reliefFrom(opts), opts.employerMatchPct);
    var diff = b.totalIn - a.totalIn;
    return {
      autoEnrolment: a,
      personal: b,
      difference: Math.abs(diff),
      larger: Math.abs(diff) < 0.005 ? 'equal' : (diff > 0 ? 'personal' : 'autoEnrolment')
    };
  }

  /* EVERY YEAR TO PENSION AGE, ADDED UP. compare() answers one year; this
     walks the years from the reader's age to pension age and adds them,
     growing each year's contributions to pension age at a rate the CALLER
     supplies, because this module has no opinion about growth and should not
     acquire one. The page passes the same assumption the calculators use.

     Both paths change as the years pass and both changes are the module's
     own: auto-enrolment's rates phase up through AE_PHASES, and the personal
     pension's relief limit rises with the age bands. Everything else is held
     where the reader put it, which is the assumption the page has to name:
     salary, the personal contribution and any employer match do not move.

       age, retireAge   the reader's age now and the age the money is for
       firstYear        the auto-enrolment scheme year the first of these is
       growth           a yearly rate as a fraction, 0.05 for 5%

     Contributions are grown from the end of the year they are paid, so the
     last year's are not grown at all. Nothing is deducted for charges or
     inflation, which the page also says.

       matched          (12 October 2026) when true, opts.gross is ignored and
                        each year's personal contribution is the one that
                        costs the reader what that year's auto-enrolment
                        costs them, matchedGross() for that year and age. So
                        the two paths cost the same in every year, not only
                        the first: held flat, the personal side stood still
                        while auto-enrolment's own rate rose fourfold. */
  function cumulative(opts) {
    var years = Math.max(0, Math.round(opts.retireAge - opts.age));
    var growth = opts.growth || 0;
    var relief = reliefFrom(opts);
    var ae = 0, personal = 0, i, one, grown;
    for (i = 0; i < years; i++) {
      one = compare({
        salary: opts.salary,
        year: opts.firstYear + i,
        age: opts.age + i,
        srcop: opts.srcop,
        taxRate: opts.taxRate,
        gross: opts.matched ? matchedGross(opts.salary, opts.firstYear + i, opts.age + i, relief) : opts.gross,
        employerMatchPct: opts.employerMatchPct
      });
      grown = Math.pow(1 + growth, years - 1 - i);
      ae += one.autoEnrolment.totalIn * grown;
      personal += one.personal.totalIn * grown;
    }
    var diff = personal - ae;
    return {
      years: years,
      autoEnrolment: ae,
      personal: personal,
      difference: Math.abs(diff),
      larger: Math.abs(diff) < 0.005 ? 'equal' : (diff > 0 ? 'personal' : 'autoEnrolment')
    };
  }

  /* MODE 2, EVERY YEAR TO PENSION AGE (12 October 2026). combined() walked
     over the same years as cumulative(): auto-enrolment at each year's rate,
     and the same extra each month on top, grossed up at each year's age.
     Grown the same way, at the caller's rate. Returns auto-enrolment alone,
     the top-up's own total, and the two together. */
  function cumulativeCombined(opts) {
    var years = Math.max(0, Math.round(opts.retireAge - opts.age));
    var growth = opts.growth || 0;
    var ae = 0, extra = 0, i, one, grown;
    for (i = 0; i < years; i++) {
      one = combined({
        salary: opts.salary,
        year: opts.firstYear + i,
        age: opts.age + i,
        srcop: opts.srcop,
        taxRate: opts.taxRate,
        extraMonthly: opts.extraMonthly,
        topUpMatchPct: opts.topUpMatchPct
      });
      grown = Math.pow(1 + growth, years - 1 - i);
      ae += one.autoEnrolment.totalIn * grown;
      extra += one.extra.totalIn * grown;
    }
    return { years: years, autoEnrolment: ae, extra: extra, total: ae + extra };
  }

  /* ======================================================================
     A MONTH, FROM YOUR OWN POCKET (13 October 2026). What the page now
     asks, and all it asks. Damian: "Why are we choosing an arbitrary
     figure? We should be able to compare apples for apples. If you want to
     put in more, you can, and show clearly that the personal pension is
     better after 80k." And: "anything that doesn't need to be in the
     calculator, like income: just use contributions instead."

     Two inputs: what the reader puts in each month from their own pocket,
     and the rate their income tax tops out at. No salary: under
     auto-enrolment the contribution IS a share of pay, so pay is what the
     contribution means (payFor), never something to ask for.

       auto-enrolment    you X; your employer the same; the State a third
                         of X (the 3 : 3 : 1 of every phase). All three on
                         pay up to AE_SALARY_CAP, so X can be at most the
                         phase's rate on AE_SALARY_CAP, a month:
                         monthlyLimit(), EUR 100 in 2026. Past it the scheme
                         takes nothing more, from anyone.
       personal pension  your X, with tax relief at your rate:
                         X / (1 - rate). No employer money unless the
                         employer agrees to pay (none here), no State money.
       best of both      auto-enrolment up to its limit, a personal pension
                         for the rest. The same cost to you as the other two.

     Relief is at the rate given on all of it, and assumed inside Revenue's
     age-related limit: with no age or pay there is nothing to apply that
     limit to, and the page says so. Euros a month, exact; the page rounds.
     ====================================================================== */
  function monthlyLimit(year) {
    return phaseForYear(year).employee * AE_SALARY_CAP / 12;
  }

  /* the pay a month's contribution from you is that phase's rate of, a year */
  function payFor(monthlyYou, year) {
    return monthlyYou * 12 / phaseForYear(year).employee;
  }

  function monthly(opts) {
    var year = opts.year || 1;
    var p = phaseForYear(year);
    var you = Math.max(0, +opts.you || 0);
    var rate = (+opts.taxRate || 0) / 100;
    var limit = p.employee * AE_SALARY_CAP / 12;
    var inAe = Math.min(you, limit), rest = you - inAe;
    function withRelief(net) { return net / (1 - rate); }

    var ae = {
      you: inAe,                                   // what the scheme takes from you
      employer: inAe * p.employer / p.employee,    // the same again
      state: inAe * p.state / p.employee,          // a third of yours
      notTaken: rest,                              // past the limit: stays in your pay
      capped: you > limit
    };
    ae.total = ae.you + ae.employer + ae.state;

    var personal = { you: you, relief: withRelief(you) - you, employer: 0, total: withRelief(you) };
    var top = { you: rest, relief: withRelief(rest) - rest, total: withRelief(rest) };
    var diff = personal.total - ae.total;

    return {
      phase: p.phase,
      years: p.years,
      rates: { employee: p.employee, employer: p.employer, state: p.state },
      you: you,
      taxRate: rate,
      limit: limit,
      pay: payFor(inAe, year),                     // the pay that is, capped at AE_SALARY_CAP
      autoEnrolment: ae,
      personal: personal,
      best: { autoEnrolment: ae.total, personal: top, total: ae.total + top.total },
      /* what each euro from you becomes, below the limit and above it */
      perEuro: {
        autoEnrolment: (p.employee + p.employer + p.state) / p.employee,
        personal: withRelief(1),
        aboveLimit: 0
      },
      larger: Math.abs(diff) < 0.005 ? 'equal' : (diff > 0 ? 'personal' : 'autoEnrolment')
    };
  }

  return {
    AE_SALARY_CAP: AE_SALARY_CAP,
    AE_PHASES: AE_PHASES,
    phaseForYear: phaseForYear,
    monthlyLimit: monthlyLimit,
    payFor: payFor,
    monthly: monthly,
    autoEnrolment: autoEnrolment,
    personalPension: personalPension,
    matchedGross: matchedGross,
    aboveCap: aboveCap,
    compare: compare,
    cumulative: cumulative,
    cumulativeCombined: cumulativeCombined,
    combined: combined
  };
}));
