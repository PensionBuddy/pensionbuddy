/* Acceptance tests for the broker vs auto-enrolment comparison.
   Written before the UI. Contract: docs/CALC-SPEC.md

   Node is not installed on this machine, so this file is written to run
   BOTH ways with no build step:
       node tests/compare-calc.test.js
       python3 tests/run-tests.py      (drives the same file in headless Chrome)

   Cases 1 and 2 are the worked examples supplied with the brief. Cases 3 and 4
   are the two additional ones required: a year 4 to 6 phase, and a salary above
   the €80,000 cap combined with an employer match on the personal pension side.
   Cases 2, 4 and 5 were corrected on 2026-09-10 when gov.ie confirmed the
   employee's own contribution is capped at €80,000 too. Cases 13 to 22 cover
   the tiered relief and the money-above-the-cap signal added the same day. */
(function (root) {
  'use strict';

  var Compare = (typeof module === 'object' && module.exports)
    ? require('../assets/js/autoenrolment.js') : root.PBCompare;
  var Relief = (typeof module === 'object' && module.exports)
    ? require('../assets/js/pension-tax-relief.js') : root.PBRelief;

  var pass = 0, fail = 0, lines = [];

  function eq(label, actual, expected) {
    // money compared to the cent, so a drift of even 1c fails
    var ok = Math.abs(actual - expected) < 0.005;
    (ok ? pass++ : fail++);
    lines.push((ok ? '  PASS  ' : '  FAIL  ') + label +
      (ok ? '  = ' + expected : '  expected ' + expected + ', got ' + actual));
    return ok;
  }

  function group(name) { lines.push(''); lines.push(name); }

  // ---------------------------------------------------------------- case 1
  group('CASE 1  salary EUR 50,000, phase year 1  (worked example from brief)');
  var c1 = Compare.autoEnrolment(50000, 1);
  eq('employee', c1.employee, 750);
  eq('employer', c1.employer, 750);
  eq('State', c1.state, 250);
  eq('total in', c1.totalIn, 1750);
  eq('net cost is the employee contribution, no relief', c1.netCost, 750);
  eq('salary cap does not apply', c1.salaryCapApplies ? 1 : 0, 0);

  // ---------------------------------------------------------------- case 2
  group('CASE 2  salary EUR 100,000, phase year 1  (worked example from brief)');
  // Corrected 2026-09-10: gov.ie says contributions "will not be levied on any
  // gross pay over EUR 80,000", the employee's own included. The brief had the
  // employee uncapped (EUR 1,500 here); that was wrong.
  var c2 = Compare.autoEnrolment(100000, 1);
  eq('employee, capped at 80k like the other two', c2.employee, 1200);
  eq('employer, capped at 80k', c2.employer, 1200);
  eq('State, capped at 80k', c2.state, 400);
  eq('total in', c2.totalIn, 2800);
  eq('salary cap applies', c2.salaryCapApplies ? 1 : 0, 1);
  eq('salary above the cap', c2.salaryAboveCap, 20000);
  var ac2 = Compare.aboveCap(100000, 1, 45, { srcop: Relief.SRCOP.single });
  eq('money above the cap: 1.5% of the 20,000 the scheme never sees', ac2.strandedNet, 300);

  // ---------------------------------------------------------------- case 3
  group('CASE 3  salary EUR 60,000, phase year 5, age 35  (phase 2, 3/3/1)');
  var c3 = Compare.autoEnrolment(60000, 5);
  eq('phase number', c3.phase, 2);
  eq('employee at 3%', c3.employee, 1800);
  eq('employer at 3%', c3.employer, 1800);
  eq('State at 1%', c3.state, 600);
  eq('total in', c3.totalIn, 4200);
  eq('net cost', c3.netCost, 1800);

  // ---------------------------------------------------------------- case 4
  group('CASE 4  salary EUR 120,000, phase year 10, age 45, single, 5% employer match');
  // Corrected 2026-09-10 for the employee cap: A was 13,600 with a 7,200 net
  // cost when the employee's 6% ran on the whole salary.
  var a4 = Compare.autoEnrolment(120000, 10);
  eq('A  phase number', a4.phase, 4);
  eq('A  employee at 6%, capped at 80k', a4.employee, 4800);
  eq('A  employer at 6%, capped at 80k', a4.employer, 4800);
  eq('A  State at 2%, capped at 80k', a4.state, 1600);
  eq('A  total in', a4.totalIn, 11200);
  eq('A  net cost', a4.netCost, 4800);

  eq('B  relief limit, 25% of the 115k cap', Relief.reliefLimit(45, 120000), 28750);
  // single: salary less the 44,000 cut-off exceeds the limit, so every
  // relievable euro sits in the 40% tier and tiered equals flat 40% here
  var single = { srcop: Relief.SRCOP.single };
  eq('B  every relievable euro is in the 40% tier', Relief.reliefTiers(45, 120000, Relief.SRCOP.single).t40, 28750);
  var gross4 = Compare.matchedGross(120000, 10, 45, single);
  eq('B  gross matched to the same net cost', gross4, 8000);
  eq('B  the flat-rate path agrees for this person', Compare.matchedGross(120000, 10, 45, 40), 8000);
  var b4 = Compare.personalPension(gross4, 45, 120000, single, 5);
  eq('B  relief, all at 40%', b4.relief, 3200);
  eq('B  relief split reports it all at 40%', b4.reliefSplit.at40, 3200);
  eq('B  and none at 20%', b4.reliefSplit.at20, 0);
  eq('B  net cost, same as path A', b4.netCost, 4800);
  eq('B  employer match, 5% of salary', b4.employer, 6000);
  eq('B  total in', b4.totalIn, 14000);

  var cmp4 = Compare.compare({ salary: 120000, year: 10, age: 45, srcop: Relief.SRCOP.single, gross: gross4, employerMatchPct: 5 });
  eq('B  is larger for these inputs', cmp4.larger === 'personal' ? 1 : 0, 1);
  eq('B  by this much', cmp4.difference, 2800);

  var ac4 = Compare.aboveCap(120000, 10, 45, single);
  eq('above the cap: 40,000 of salary', ac4.above, 40000);
  eq('above the cap: 6% of it is money the scheme never sees', ac4.strandedNet, 2400);
  eq('above the cap: a personal pension could turn that into', ac4.couldBe, 4000);

  // ------------------------------------------------- auto-enrolment winning
  // The honesty rule: this is a correct and expected outcome, so it is asserted
  // as deliberately as any other. Same inputs, no employer match on path B.
  group('CASE 5  the same person with NO employer match on the personal pension');
  var b5 = Compare.personalPension(gross4, 45, 120000, single, 0);
  eq('B  total in, own contribution only', b5.totalIn, 8000);
  var cmp5 = Compare.compare({ salary: 120000, year: 10, age: 45, srcop: Relief.SRCOP.single, gross: gross4, employerMatchPct: 0 });
  eq('auto-enrolment is larger here', cmp5.larger === 'autoEnrolment' ? 1 : 0, 1);
  eq('by this much', cmp5.difference, 3200);

  // ------------------------------------------------------- relief limit edge
  group('CASE 6  contribution above the relief limit still reaches the pension');
  var over = Compare.personalPension(40000, 45, 120000, 40, 0);
  eq('relief only on the first 28,750', over.relief, 11500);
  eq('the excess gets no relief', over.aboveReliefLimit, 11250);
  eq('net cost', over.netCost, 28500);
  eq('total in is still the full contribution', over.totalIn, 40000);
  eq('grossForNetCost inverts it exactly', Relief.grossForNetCost(28500, 45, 120000, 40), 40000);

  // ================================================== MODE 2: COMBINED
  // Auto-enrolment at the statutory minimum PLUS a personal top-up for the
  // extra, because My Future Fund has nowhere else to put it (no AVCs in the
  // current implementation, see the source warning in autoenrolment.js).
  // The extra is the NET amount the person pays each month, grossed up through
  // the same shared relief function Mode 1 uses.

  group('CASE 7  Mode 2: salary EUR 50,000, year 1, extra EUR 100 a month, 20% rate, no top-up match');
  var c7 = Compare.combined({ salary: 50000, year: 1, age: 35, taxRate: 20, extraMonthly: 100, employerMatchPct: 0 });
  eq('auto-enrolment layer is unchanged from case 1', c7.autoEnrolment.totalIn, 1750);
  eq('extra paid from pocket, per year', c7.extraNet, 1200);
  eq('extra grosses up at 20%', c7.extra.gross, 1500);
  eq('relief on the extra', c7.extra.relief, 300);
  eq('extra net cost equals what was paid, exactly', c7.extra.netCost, 1200);
  eq('no employer top-up', c7.extra.employer, 0);
  eq('combined total', c7.totalIn, 3250);
  eq('combined net cost: AE employee share plus the extra', c7.netCost, 1950);

  group('CASE 8  Mode 2: same person at the 40% rate');
  var c8 = Compare.combined({ salary: 50000, year: 1, age: 35, taxRate: 40, extraMonthly: 100, employerMatchPct: 0 });
  eq('auto-enrolment layer still unchanged', c8.autoEnrolment.totalIn, 1750);
  eq('extra grosses up at 40%', c8.extra.gross, 2000);
  eq('relief on the extra', c8.extra.relief, 800);
  eq('extra net cost still exactly what was paid', c8.extra.netCost, 1200);
  eq('combined total', c8.totalIn, 3750);

  group('CASE 9  Mode 2: same person, 5% employer top-up match on the extra layer');
  // The top-up match scales with the TOP-UP'S GROSS, not with salary. Mode 1's
  // salary-based match is a fixed benefit in a full-replacement scenario; this
  // is an employer matching what the person chooses to add on.
  var c9 = Compare.combined({ salary: 50000, year: 1, age: 35, taxRate: 40, extraMonthly: 100, topUpMatchPct: 5 });
  eq('grossed-up extra unchanged by the match', c9.extra.gross, 2000);
  eq('employer top-up, 5% of the EUR 2,000 gross top-up', c9.extra.employer, 100);
  eq('NOT 5% of salary (that would be 2,500)', c9.extra.employer === 2500 ? 1 : 0, 0);
  eq('combined total: AE + grossed-up extra + match', c9.totalIn, 3850);
  eq('the match does not change what the person pays', c9.netCost, 1950);
  // the relief and cap still come from Mode 1's own function, unchanged
  var m1 = Compare.personalPension(2000, 35, 50000, 40, 0);
  eq('identical relief to Mode 1 personalPension()', c9.extra.relief, m1.relief);
  eq('identical relief limit to Mode 1 personalPension()', c9.extra.reliefLimit, m1.reliefLimit);
  eq('identical net cost to Mode 1 personalPension()', c9.extra.netCost, m1.netCost);
  // and Mode 1 itself is untouched: its match is still salary-based
  eq('Mode 1 match is still 5% of salary', Compare.personalPension(2000, 35, 50000, 40, 5).employer, 2500);

  group('CASE 12  Mode 2: same person, a tiny EUR 10 a month top-up (the bug this rule fixes)');
  var c12 = Compare.combined({ salary: 50000, year: 1, age: 35, taxRate: 40, extraMonthly: 10, topUpMatchPct: 5 });
  eq('extra paid from pocket, per year', c12.extraNet, 120);
  eq('grosses up at 40%', c12.extra.gross, 200);
  eq('match is proportionally tiny: 5% of 200', c12.extra.employer, 10);
  eq('match is one tenth of case 9, exactly as the top-up is', c12.extra.employer / c9.extra.employer, 0.1);
  eq('match is NOT the flat salary-based 2,500', c12.extra.employer === 2500 ? 1 : 0, 0);
  eq('match is NOT the same as case 9 either', c12.extra.employer === c9.extra.employer ? 1 : 0, 0);
  eq('combined total', c12.totalIn, 1960);
  eq('combined net cost', c12.netCost, 870);

  group('CASE 10  Mode 2 edge: zero extra collapses to plain auto-enrolment');
  var c10 = Compare.combined({ salary: 50000, year: 1, age: 35, taxRate: 40, extraMonthly: 0, topUpMatchPct: 5 });
  eq('a 5% match on nothing is nothing', c10.extra.employer, 0);
  eq('total equals the AE figure', c10.totalIn, 1750);
  eq('net cost equals the AE employee share', c10.netCost, 750);
  eq('extra gross is zero', c10.extra.gross, 0);

  group('CASE 11  Mode 2 edge: extra above the relief limit is capped like Mode 1');
  // age 29 (15% band) on EUR 40,000: limit is 6,000. Paying 1,000 a month net
  // (12,000) needs a gross above the limit, so the excess gets no relief.
  var c11 = Compare.combined({ salary: 40000, year: 1, age: 29, taxRate: 20, extraMonthly: 1000, topUpMatchPct: 0 });
  eq('relief limit for this person', c11.extra.reliefLimit, 6000);
  eq('gross: 6,000 relieved plus the unrelieved remainder', c11.extra.gross, 6000 + (12000 - 6000 * 0.8));
  eq('relief only on the first 6,000', c11.extra.relief, 1200);
  eq('net cost is still exactly the 12,000 paid', c11.extra.netCost, 12000);
  eq('some of the extra sits above the limit', c11.extra.aboveReliefLimit > 0 ? 1 : 0, 1);

  // ================================================== TIERED RELIEF
  // Relief at the rate each euro actually attracts: 40% on the part of a
  // contribution sitting above the standard rate cut-off point, 20% below,
  // still within the age-related limit. Added 2026-09-10. The flat-rate
  // functions above are untouched, and the drift test still guards them.

  group('CASE 13  tiers: single, EUR 50,000, age 35');
  var t13 = Relief.reliefTiers(35, 50000, Relief.SRCOP.single);
  eq('age-related limit, 20% of 50,000', t13.limit, 10000);
  eq('euros relieved at 40%: salary less the 44,000 cut-off', t13.t40, 6000);
  eq('euros relieved at 20%: the rest of the limit', t13.t20, 4000);

  group('CASE 14  same person, gross EUR 2,000 sits entirely in the 40% tier');
  eq('relief', Relief.reliefOnTiered(2000, 35, 50000, Relief.SRCOP.single), 800);
  eq('identical to flat 40% for this contribution', Relief.reliefOn(2000, 35, 50000, 40), 800);
  eq('net cost', Relief.netCostOfTiered(2000, 35, 50000, Relief.SRCOP.single), 1200);

  group('CASE 15  same person, gross EUR 8,000 spills into the 20% tier');
  var s15 = Relief.reliefSplitTiered(8000, 35, 50000, Relief.SRCOP.single);
  eq('6,000 at 40%', s15.at40, 2400);
  eq('2,000 at 20%', s15.at20, 400);
  eq('relief in total', s15.total, 2800);
  eq('net cost', Relief.netCostOfTiered(8000, 35, 50000, Relief.SRCOP.single), 5200);
  eq('flat 40% would have overstated relief by 400', Relief.reliefOn(8000, 35, 50000, 40) - s15.total, 400);

  group('CASE 16  married, one income, EUR 50,000: nothing reaches the 40% band');
  eq('no euros in the 40% tier', Relief.reliefTiers(35, 50000, Relief.SRCOP.marriedOneIncome).t40, 0);
  eq('gross 2,000 relieved entirely at 20%', Relief.reliefOnTiered(2000, 35, 50000, Relief.SRCOP.marriedOneIncome), 400);

  group('CASE 17  inverse: single, EUR 50,000, age 35, net EUR 4,000');
  var g17 = Relief.grossForNetCostTiered(4000, 35, 50000, Relief.SRCOP.single);
  eq('gross: 6,000 at 60c then 500 at 80c', g17, 6500);
  eq('relief checks back', Relief.reliefOnTiered(g17, 35, 50000, Relief.SRCOP.single), 2500);
  eq('net cost checks back exactly', Relief.netCostOfTiered(g17, 35, 50000, Relief.SRCOP.single), 4000);

  group('CASE 18  inverse past the limit: net EUR 9,000');
  var g18 = Relief.grossForNetCostTiered(9000, 35, 50000, Relief.SRCOP.single);
  eq('gross: both tiers then 2,200 unrelieved', g18, 12200);
  eq('relief stops at the limit', Relief.reliefOnTiered(g18, 35, 50000, Relief.SRCOP.single), 3200);
  eq('net cost checks back exactly', Relief.netCostOfTiered(g18, 35, 50000, Relief.SRCOP.single), 9000);
  eq('the module reports the excess above the limit', Compare.personalPension(g18, 35, 50000, single50(), 0).aboveReliefLimit, 2200);

  group('CASE 19  tiers: two incomes, EUR 100,000, age 45');
  var t19 = Relief.reliefTiers(45, 100000, Relief.SRCOP.marriedTwoIncomes);
  eq('limit, 25% of 100,000', t19.limit, 25000);
  eq('40% tier: salary less the 88,000 maximum band', t19.t40, 12000);
  eq('20% tier: the rest of the limit', t19.t20, 13000);

  group('CASE 20  Mode 2 on the tiered path reproduces case 8');
  var c20 = Compare.combined({ salary: 50000, year: 1, age: 35, srcop: Relief.SRCOP.single, extraMonthly: 100, employerMatchPct: 0 });
  eq('extra still grosses up to 2,000', c20.extra.gross, 2000);
  eq('relief still 800', c20.extra.relief, 800);
  eq('split reports it all at 40%', c20.extra.reliefSplit.at40, 800);
  eq('combined total unchanged by the switch', c20.totalIn, 3750);

  group('CASE 21  money above the cap: EUR 100,000, year 1, single, age 45');
  var ac21 = Compare.aboveCap(100000, 1, 45, { srcop: Relief.SRCOP.single });
  eq('salary above the cap', ac21.above, 20000);
  eq('the rate that never gets applied to it', ac21.rate, 0.015);
  eq('stranded: 1.5% of 20,000', ac21.strandedNet, 300);
  eq('a personal pension could turn that 300 into', ac21.couldBe, 500);

  group('CASE 22  money above the cap: at or below EUR 80,000 there is none');
  var ac22 = Compare.aboveCap(80000, 1, 45, { srcop: Relief.SRCOP.single });
  eq('nothing above the cap', ac22.above, 0);
  eq('nothing stranded', ac22.strandedNet, 0);
  eq('nothing to route elsewhere', ac22.couldBe, 0);

  group('EXTRA C  cut-off point constants, revenue.ie 2026');
  eq('year the constants were checked for', Relief.SRCOP_YEAR, 2026);
  eq('single', Relief.SRCOP.single, 44000);
  eq('married, one income', Relief.SRCOP.marriedOneIncome, 53000);
  eq('married, two incomes, the maximum band', Relief.SRCOP.marriedTwoIncomes, 88000);

  function single50() { return { srcop: Relief.SRCOP.single }; }

  // --------------------------------------------------------- phase boundaries
  group('EXTRA A  phase boundaries');
  eq('year 3 is still phase 1', Compare.phaseForYear(3).phase, 1);
  eq('year 4 starts phase 2', Compare.phaseForYear(4).phase, 2);
  eq('year 6 is still phase 2', Compare.phaseForYear(6).phase, 2);
  eq('year 7 starts phase 3', Compare.phaseForYear(7).phase, 3);
  eq('year 9 is still phase 3', Compare.phaseForYear(9).phase, 3);
  eq('year 10 starts phase 4', Compare.phaseForYear(10).phase, 4);
  eq('year 40 is still phase 4', Compare.phaseForYear(40).phase, 4);
  // phaseForYear returns the rates directly; the nested `rates` object is on
  // the autoEnrolment() result, not on the phase record
  eq('ratio holds: employee is 3x State', Compare.phaseForYear(1).employee / Compare.phaseForYear(1).state, 3);
  eq('ratio holds in every phase', Compare.AE_PHASES.every(function (p) {
    return Math.abs(p.employee / p.state - 3) < 1e-9 && p.employee === p.employer;
  }) ? 1 : 0, 1);

  // ------------------------------------------------------------ relief bands
  group('EXTRA B  age bands match pension-calculator.html');
  eq('under 30', Relief.reliefBand(29), 0.15);
  eq('30 to 39', Relief.reliefBand(30), 0.20);
  eq('40 to 49', Relief.reliefBand(40), 0.25);
  eq('50 to 54', Relief.reliefBand(50), 0.30);
  eq('55 to 59', Relief.reliefBand(55), 0.35);
  eq('60 and over', Relief.reliefBand(60), 0.40);
  eq('earnings cap', Relief.EARN_CAP, 115000);

  var summary = '\n' + (fail === 0 ? 'ALL PASS' : 'FAILURES') + '  ' + pass + ' passed, ' + fail + ' failed';
  var report = lines.join('\n') + summary;

  if (typeof module === 'object' && module.exports) {
    console.log(report);
    process.exit(fail === 0 ? 0 : 1);
  } else {
    root.__TEST_REPORT__ = report;
    root.__TEST_FAILED__ = fail;
  }
}(typeof self !== 'undefined' ? self : this));
