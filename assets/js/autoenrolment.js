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
   Loads as a plain script (window.PBCompare) or via require() in node. */
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

  return {
    AE_SALARY_CAP: AE_SALARY_CAP,
    AE_PHASES: AE_PHASES,
    phaseForYear: phaseForYear,
    autoEnrolment: autoEnrolment,
    personalPension: personalPension,
    matchedGross: matchedGross,
    aboveCap: aboveCap,
    compare: compare,
    combined: combined
  };
}));
