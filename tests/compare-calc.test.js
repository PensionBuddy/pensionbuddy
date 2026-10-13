/* Acceptance tests for the broker vs auto-enrolment comparison.
   Written before the UI. Contract: docs/CALC-SPEC.md

   Written to run BOTH ways with no build step:
       node tests/compare-calc.test.js
       python3 tests/run-tests.py      (drives the same file in headless Chrome)

   The Chrome run is the one that counts, because it loads the modules through
   script tags the way a page does. Node was absent from this machine when
   this file was written, which is where the two-way design came from; it is
   installed now, and the design is worth keeping regardless.

   Cases 1 and 2 are the worked examples supplied with the brief. Cases 3 and 4
   are the two additional ones required: a year 4 to 6 phase, and a salary above
   the €80,000 cap combined with an employer match on the personal pension side.
   Cases 2, 4 and 5 were corrected on 2026-09-10 when gov.ie confirmed the
   employee's own contribution is capped at €80,000 too. Cases 13 to 22 cover
   the tiered relief and the money-above-the-cap signal added the same day. */
(function (root) {
  'use strict';

  var isNode = (typeof module === 'object' && module.exports);
  var H = isNode ? require('./harness.js') : root.PBTest;
  // the modules return euro floats, compared to the cent: a drift of even
  // 1c fails. The tolerance is declared once, here, and applies to numbers
  // only; the harness's own test asserts it is applied.
  var t = H.suite('compare', { tolerance: 0.005 });
  var eq = t.eq, group = t.group;

  var Compare = isNode ? require('../assets/js/autoenrolment.js') : root.PBCompare;
  var Relief = isNode ? require('../assets/js/pension-tax-relief.js') : root.PBRelief;

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

  // ------------------------------------------------- every year, added up
  group('EXTRA C  cumulative(): compare() over the years to pension age');
  var CUM = { salary: 50000, firstYear: 1, age: 35, retireAge: 66,
              srcop: 44000, gross: 3000, employerMatchPct: 0 };
  function withOpts(extra) {
    var o = {}, k;
    for (k in CUM) o[k] = CUM[k];
    for (k in extra) o[k] = extra[k];
    return o;
  }
  eq('one year for every year between the two ages',
     Compare.cumulative(withOpts({ growth: 0.05 })).years, 31);
  eq('nobody at pension age has a year left',
     Compare.cumulative(withOpts({ age: 66, growth: 0.05 })).years, 0);
  eq('and nothing is added up for them',
     Compare.cumulative(withOpts({ age: 66, growth: 0.05 })).autoEnrolment, 0);
  eq('past pension age is not a negative run',
     Compare.cumulative(withOpts({ age: 70, growth: 0.05 })).years, 0);

  /* With no growth it must be exactly compare(), year by year, added up:
     that is what makes the growth a wrapper around the module's own maths
     rather than a second opinion about it. */
  var flatAe = 0, flatPp = 0;
  for (var cy = 0; cy < 31; cy++) {
    var one = Compare.compare({ salary: CUM.salary, year: CUM.firstYear + cy, age: CUM.age + cy,
                                srcop: CUM.srcop, gross: CUM.gross, employerMatchPct: CUM.employerMatchPct });
    flatAe += one.autoEnrolment.totalIn;
    flatPp += one.personal.totalIn;
  }
  eq('no growth is the plain sum of every year, auto-enrolment',
     Compare.cumulative(withOpts({ growth: 0 })).autoEnrolment, flatAe);
  eq('no growth is the plain sum of every year, personal pension',
     Compare.cumulative(withOpts({ growth: 0 })).personal, flatPp);

  /* The last year's contributions are not grown: a one-year run is that one
     year at face value, whatever the growth rate. */
  var oneYear = Compare.compare({ salary: CUM.salary, year: CUM.firstYear, age: 65,
                                  srcop: CUM.srcop, gross: CUM.gross, employerMatchPct: CUM.employerMatchPct });
  eq('a single year is that year, ungrown',
     Compare.cumulative(withOpts({ age: 65, growth: 0.05 })).autoEnrolment, oneYear.autoEnrolment.totalIn);

  eq('growth only ever adds', Compare.cumulative(withOpts({ growth: 0.05 })).autoEnrolment >
     Compare.cumulative(withOpts({ growth: 0 })).autoEnrolment ? 1 : 0, 1);
  /* The same number of years starting at scheme year 10 is worth MORE than
     starting at year 1, because the first nine years of the phase-in are
     below the 6% the scheme settles at. The run that skips them is larger. */
  eq('a run that starts after the phase-in beats one that lives through it',
     Compare.cumulative(withOpts({ firstYear: 10, growth: 0 })).autoEnrolment >
     Compare.cumulative(withOpts({ growth: 0 })).autoEnrolment ? 1 : 0, 1);
  /* this suite compares under a tolerance, which is a numeric test, so the
     verdict is asserted as the answer to a question rather than as a word */
  var cum = Compare.cumulative(withOpts({ growth: 0.05 }));
  eq('the verdict names whichever of the two is larger',
     cum.larger === (cum.personal > cum.autoEnrolment ? 'personal' : 'autoEnrolment') ? 1 : 0, 1);

  // ------------------------------------------------- 12 October 2026, by 66
  /* matched: the personal side costs what auto-enrolment costs in EVERY year,
     not only the first. Single, EUR 50,000, so the EUR 6,000 at 40% covers
     every matched contribution here and each net euro grosses up at 0.60. */
  group('EXTRA D  cumulative({ matched }): the same cost to you every year');
  var M = { salary: 50000, srcop: 44000, matched: true, gross: 999999, employerMatchPct: 0 };
  function withM(o) { var r = {}, k; for (k in M) r[k] = M[k]; for (k in o) r[k] = o[k]; return r; }
  var m1 = Compare.cumulative(withM({ firstYear: 1, age: 65, retireAge: 66, growth: 0.05 }));
  eq('one year, phase 1: auto-enrolment', m1.autoEnrolment, 1750);
  eq('one year: the personal side is the matched EUR 1,250, opts.gross ignored', m1.personal, 1250);
  /* years 3 and 4 straddle phases 1 and 2: 750 then 1,500 from the reader */
  var m2 = Compare.cumulative(withM({ firstYear: 3, age: 64, retireAge: 66, growth: 0.05 }));
  eq('two years across a phase step: auto-enrolment 1,750 x 1.05 + 3,500', m2.autoEnrolment, 5337.5);
  eq('two years: personal 1,250 x 1.05 + 2,500, matched again in year 4', m2.personal, 3812.5);
  eq('matched off: the old fixed gross is still what it was',
     Compare.cumulative({ salary: 50000, srcop: 44000, firstYear: 3, age: 64, retireAge: 66, growth: 0, gross: 1250 }).personal, 2500);

  group('EXTRA E  cumulativeCombined(): auto-enrolment plus the same extra every year');
  var k1 = Compare.cumulativeCombined({ salary: 50000, srcop: 44000, firstYear: 1, age: 35, retireAge: 36, growth: 0.05, extraMonthly: 100 });
  eq('one year: auto-enrolment alone', k1.autoEnrolment, 1750);
  eq('one year: EUR 100 a month grosses up to EUR 2,000 (case 20)', k1.extra, 2000);
  eq('one year: together, case 8', k1.total, 3750);
  var k2 = Compare.cumulativeCombined({ salary: 50000, srcop: 44000, firstYear: 3, age: 64, retireAge: 66, growth: 0.05, extraMonthly: 100 });
  eq('two years: the extra grown, 2,000 x 1.05 + 2,000', k2.extra, 4100);
  eq('two years: together 5,337.50 + 4,100', k2.total, 9437.5);
  eq('no years left: nothing', Compare.cumulativeCombined({ salary: 50000, srcop: 44000, firstYear: 1, age: 66, retireAge: 66, growth: 0.05, extraMonthly: 100 }).total, 0);

  // ================================================== A MONTH, FROM YOUR POCKET
  // 13 October 2026: what the page asks now. What you put in a month, and
  // your tax rate; no salary. Auto-enrolment is you X, your employer X and
  // the State X/3, up to the phase's rate on EUR 80,000 a month (EUR 100 in
  // 2026); a personal pension is X / (1 - rate); the best of both is
  // auto-enrolment up to the limit and a personal pension for the rest.
  function near(a, b) { return Math.abs(a - b) < 0.005; }

  group('CASE 23  EUR 50 a month, 20%, year 1: under the limit');
  var n23 = Compare.monthly({ you: 50, taxRate: 20, year: 1 });
  eq('the limit, 1.5% of 80,000 a month', n23.limit, 100);
  eq('the pay it means: 50 a month is 1.5% of 40,000', n23.pay, 40000);
  eq('auto-enrolment: you', n23.autoEnrolment.you, 50);
  eq('auto-enrolment: your employer, the same', n23.autoEnrolment.employer, 50);
  eq('auto-enrolment: the State, a third of yours', n23.autoEnrolment.state, 50 / 3);
  eq('auto-enrolment: in all', n23.autoEnrolment.total, 350 / 3);
  eq('auto-enrolment takes all of it', n23.autoEnrolment.notTaken, 0);
  eq('not capped', n23.autoEnrolment.capped ? 1 : 0, 0);
  eq('personal pension: relief at 20%', n23.personal.relief, 12.5);
  eq('personal pension: in all, 50 / 0.8', n23.personal.total, 62.5);
  eq('personal pension: no employer unless they agree', n23.personal.employer, 0);
  eq('best of both is all auto-enrolment here', n23.best.total, n23.autoEnrolment.total);
  eq('and nothing left for a personal pension', n23.best.personal.total, 0);
  eq('each EUR 1 becomes 2.33 in auto-enrolment', n23.perEuro.autoEnrolment, 7 / 3);
  eq('and 1.25 in a personal pension at 20%', n23.perEuro.personal, 1.25);
  eq('and nothing past the limit', n23.perEuro.aboveLimit, 0);
  eq('auto-enrolment is larger here', n23.larger === 'autoEnrolment' ? 1 : 0, 1);

  group('CASE 24  the same at 40%');
  var n24 = Compare.monthly({ you: 50, taxRate: 40, year: 1 });
  eq('relief at 40%', n24.personal.relief, 100 / 3);
  eq('in all, 50 / 0.6', n24.personal.total, 250 / 3);
  eq('auto-enrolment does not move with the tax rate', n24.autoEnrolment.total, n23.autoEnrolment.total);

  group('CASE 25  EUR 100 a month, 40%: exactly the limit');
  var n25 = Compare.monthly({ you: 100, taxRate: 40, year: 1 });
  eq('auto-enrolment takes all 100', n25.autoEnrolment.you, 100);
  eq('in all, 100 + 100 + 33.33', n25.autoEnrolment.total, 700 / 3);
  eq('not capped at the limit itself', n25.autoEnrolment.capped ? 1 : 0, 0);
  eq('the pay it means is the cap', n25.pay, 80000);

  group('CASE 26  EUR 150 a month, 40%: past the limit');
  var n26 = Compare.monthly({ you: 150, taxRate: 40, year: 1 });
  eq('auto-enrolment takes 100 of it', n26.autoEnrolment.you, 100);
  eq('and not the other 50', n26.autoEnrolment.notTaken, 50);
  eq('capped', n26.autoEnrolment.capped ? 1 : 0, 1);
  eq('your employer stops at the limit too', n26.autoEnrolment.employer, 100);
  eq('and the State', n26.autoEnrolment.state, 100 / 3);
  eq('auto-enrolment in all, held at 233.33', n26.autoEnrolment.total, 700 / 3);
  eq('the pay stays at the cap', n26.pay, 80000);
  eq('a personal pension takes all 150: 150 / 0.6', n26.personal.total, 250);
  eq('a personal pension alone now puts in more', n26.larger === 'personal' ? 1 : 0, 1);
  eq('best of both: the other 50 in a personal pension, 50 / 0.6', n26.best.personal.total, 250 / 3);
  eq('best of both: its relief', n26.best.personal.relief, 100 / 3);
  eq('best of both in all, 233.33 + 83.33', n26.best.total, 950 / 3);

  group('CASE 27  EUR 150 a month, 20%: past the limit, auto-enrolment alone still larger');
  var n27 = Compare.monthly({ you: 150, taxRate: 20, year: 1 });
  eq('a personal pension: 150 / 0.8', n27.personal.total, 187.5);
  eq('auto-enrolment alone is larger at 20%', n27.larger === 'autoEnrolment' ? 1 : 0, 1);
  eq('best of both: 233.33 + 62.50', n27.best.total, 700 / 3 + 62.5);

  group('CASE 28  where a personal pension alone overtakes: limit x 7/3 x (1 - rate)');
  eq('at 40%, EUR 140 a month: the two are level', Compare.monthly({ you: 140, taxRate: 40, year: 1 }).larger === 'equal' ? 1 : 0, 1);
  eq('at 20%, EUR 190 a month: a personal pension is larger', Compare.monthly({ you: 190, taxRate: 20, year: 1 }).larger === 'personal' ? 1 : 0, 1);
  eq('at 20%, EUR 185 a month: auto-enrolment still is', Compare.monthly({ you: 185, taxRate: 20, year: 1 }).larger === 'autoEnrolment' ? 1 : 0, 1);

  group('CASE 29  the limit rises with the rates');
  eq('2026 to 2028: EUR 100 a month', Compare.monthlyLimit(1), 100);
  eq('2029 to 2031: EUR 200', Compare.monthlyLimit(4), 200);
  eq('2032 to 2034: EUR 300', Compare.monthlyLimit(7), 300);
  eq('2035 on: EUR 400', Compare.monthlyLimit(10), 400);
  eq('2035: EUR 50 a month is 6% of EUR 10,000', Compare.payFor(50, 10), 10000);
  var n29 = Compare.monthly({ you: 300, taxRate: 40, year: 10 });
  eq('2035: EUR 300 a month is under its limit', n29.autoEnrolment.capped ? 1 : 0, 0);
  eq('2035: 300 + 300 + 100', n29.autoEnrolment.total, 700);
  eq('2035: the ratio is the same, so each EUR 1 still becomes 2.33', n29.perEuro.autoEnrolment, 7 / 3);

  group('CASE 30  a month agrees with the yearly functions');
  eq('auto-enrolment at EUR 50,000 a year, over 12, is EUR 62.50 a month in',
     Compare.monthly({ you: 62.5, taxRate: 20, year: 1 }).autoEnrolment.total, Compare.autoEnrolment(50000, 1).totalIn / 12);
  eq('capped the same way: EUR 100,000 a year, over 12, is EUR 200 a month in',
     Compare.monthly({ you: 200, taxRate: 20, year: 1 }).autoEnrolment.total, Compare.autoEnrolment(100000, 1).totalIn / 12);
  eq('a personal pension: EUR 600 a year net at 40% is EUR 1,000, over 12',
     Compare.monthly({ you: 50, taxRate: 40, year: 1 }).personal.total, Relief.grossForNetCost(600, 35, 50000, 40) / 12);

  group('CASE 31  every amount, both rates, every phase');
  var ok31 = { aeShape: true, bestTop: true, sameCost: true, below: true, flat: true }, prevAe = -1;
  [20, 40].forEach(function (rate) {
    [1, 4, 7, 10].forEach(function (year) {
      prevAe = -1;
      for (var x = 25; x <= 1000; x += 5) {
        var m = Compare.monthly({ you: x, taxRate: rate, year: year }), L = Compare.monthlyLimit(year);
        if (!near(m.autoEnrolment.total, 7 / 3 * Math.min(x, L))) ok31.aeShape = false;
        if (m.best.total + 1e-9 < Math.max(m.autoEnrolment.total, m.personal.total)) ok31.bestTop = false;
        if (!near(m.autoEnrolment.you + m.autoEnrolment.notTaken, x) || !near(m.best.personal.you + m.autoEnrolment.you, x)) ok31.sameCost = false;
        if (x <= L && (m.larger !== 'autoEnrolment' || !near(m.best.total, m.autoEnrolment.total))) ok31.below = false;
        if (x > L && prevAe >= 0 && !near(m.autoEnrolment.total, prevAe)) ok31.flat = false;
        prevAe = m.autoEnrolment.total;
      }
    });
  });
  eq('auto-enrolment is 7/3 of what it takes, and takes at most the limit', ok31.aeShape ? 1 : 0, 1);
  eq('the best of both is never less than either alone', ok31.bestTop ? 1 : 0, 1);
  eq('all three cost you the same: what auto-enrolment takes plus what it leaves', ok31.sameCost ? 1 : 0, 1);
  eq('up to the limit auto-enrolment puts in more, and is the best of both', ok31.below ? 1 : 0, 1);
  eq('past the limit auto-enrolment stands still', ok31.flat ? 1 : 0, 1);
  eq('nothing from you, nothing in', Compare.monthly({ you: 0, taxRate: 40, year: 1 }).best.total, 0);
  eq('a negative amount is nothing', Compare.monthly({ you: -50, taxRate: 40, year: 1 }).personal.total, 0);

  // ------------------------------------------------------------ relief bands
  group('EXTRA B  age bands match pension-calculator.html');
  eq('under 30', Relief.reliefBand(29), 0.15);
  eq('30 to 39', Relief.reliefBand(30), 0.20);
  eq('40 to 49', Relief.reliefBand(40), 0.25);
  eq('50 to 54', Relief.reliefBand(50), 0.30);
  eq('55 to 59', Relief.reliefBand(55), 0.35);
  eq('60 and over', Relief.reliefBand(60), 0.40);
  eq('earnings cap', Relief.EARN_CAP, 115000);
}(typeof self !== 'undefined' ? self : this));
