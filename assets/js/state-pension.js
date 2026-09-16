/* State Pension (Contributory) illustration, and the gap against the Irish
   Retirement Living Standards.

   ------------------------------------------------------------------------
   SOURCES, verified 2026-09-09. Re-check before launch and after each Budget.

     EUR 299.30 a week          maximum personal rate from 1 January 2026,
                                up EUR 10 from EUR 289.30. gov.ie, Citizens
                                Information.
     2,080 contributions        the maximum rate under the Total Contributions
                                Approach, 40 years.
     520 contributions          the minimum to qualify at all, 10 years.
     19,200 / 27,600 / 33,600   Irish Retirement Living Standards, single
                                person, Pensions Council, researched by KPMG,
                                September 2024 edition. Read from the report
                                itself, not a summary. No newer edition exists
                                as of 2026-09-09.

   WHAT THIS DOES NOT MODEL. Until 2034 the Department of Social Protection
   calculates a rate two ways and pays whichever is HIGHER: a pure Total
   Contributions Approach rate, and a combined rate mixing TCA with the older
   Yearly Average method (in 2026, 20% TCA and 80% Yearly Average). This module
   computes the pure TCA rate only. So its figure is EXACT at a full 2,080
   contributions, and a FLOOR below that: the real payment may be higher, and
   the real gap correspondingly smaller. That understates the pension and
   overstates the gap, which is the direction that flatters the page, so the
   page has to say so. See docs/CALC-SPEC-STATE-PENSION.md S1 and S6.

   Contributions here are RECKONABLE: paid, plus credited (themselves capped at
   520), plus HomeCaring Periods. Not paid contributions alone.
   ------------------------------------------------------------------------

   Contract: docs/CALC-SPEC-STATE-PENSION.md.
   Tests: tests/state-pension.test.js.
   Loads as a plain script (window.PBStatePension) or via require() in node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBStatePension = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_WEEKLY_CENTS = 29930;   // EUR 299.30
  var FULL_CONTRIBUTIONS = 2080;  // 40 years
  var MIN_CONTRIBUTIONS = 520;    // 10 years
  var WEEKS_PER_YEAR = 52;        // see the spec: 52, not 52.18, to match the
                                  // EUR 15,564 already cited on the home page

  /* Pension age and the transition window. These three numbers decide which
     calculations apply to a person, which is a different question from what
     any one calculation pays, so they live here rather than in either page or
     in the entitlement module: both pages and both modules read them from
     this one place and none of them keeps a copy.

     PENSION_AGE           66. CONTEXT.md. Drawdown at 66 is the only case
                           modelled anywhere on this site; deferral to 67-70 is
                           out of scope.
     TRANSITION_FIRST      2025, the first drawdown year the best-of applies to.
     TRANSITION_LAST       2033, the last year with a Yearly Average share.
                           SWCA 2005 s.109(6D), inserted by the Social Welfare
                           (Miscellaneous Provisions) Act 2023 s.46(e):
                           paragraphs (a) to (i) run 2025 to 2033 and (j) makes
                           2034 on TCA only. */
  var PENSION_AGE      = 66;
  var TRANSITION_FIRST = 2025;
  var TRANSITION_LAST  = 2033;

  // Irish Retirement Living Standards, single person, annual, in cents.
  // Housing costs are INCLUDED in these figures. The report describes a group
  // that mostly owns its home, so the housing element reflects low or no
  // mortgage and, at the modest end, local authority rent. It does NOT assume
  // outright ownership; that is the UK PLSA methodology, not this report.
  var STANDARDS = {
    modest:      { key: 'modest',      label: 'Modest',      annualCents: 1920000, housingShare: 0.38 },
    moderate:    { key: 'moderate',    label: 'Moderate',    annualCents: 2760000, housingShare: 0.33 },
    comfortable: { key: 'comfortable', label: 'Comfortable', annualCents: 3360000, housingShare: 0.29 }
  };
  var STANDARD_ORDER = ['modest', 'moderate', 'comfortable'];

  /* Every money value is an integer cent count, so a half lands exactly on .5
     rather than a float approximation of it. Math.round takes a half toward
     positive infinity, which is the half-up rule the spec asks for, and every
     input here is positive. */
  function roundHalfUp(cents) {
    return Math.round(cents);
  }

  /* The pure Total Contributions Approach rate. Returns an ineligible result
     rather than a number below the 520 threshold, because there is no
     Contributory entitlement to report there. A means-tested Non-Contributory
     pension may apply instead; that is out of scope and the page says so. */
  function statePension(contributions) {
    var c = Math.max(0, Math.floor(Number(contributions) || 0));
    if (c < MIN_CONTRIBUTIONS) {
      return {
        eligible: false,
        contributions: c,
        shortBy: MIN_CONTRIBUTIONS - c
      };
    }
    var counted = Math.min(c, FULL_CONTRIBUTIONS);
    var weeklyCents = roundHalfUp(MAX_WEEKLY_CENTS * counted / FULL_CONTRIBUTIONS);
    var annualCents = weeklyCents * WEEKS_PER_YEAR;
    return {
      eligible: true,
      contributions: c,
      counted: counted,                            // shown when the cap bites
      capped: c > FULL_CONTRIBUTIONS,
      fraction: counted / FULL_CONTRIBUTIONS,      // the "x% of the maximum" line
      years: counted / 52,
      weeklyCents: weeklyCents,
      weekly: weeklyCents / 100,
      annualCents: annualCents,
      annual: annualCents / 100
    };
  }

  /* The difference between a living standard and an annual pension. A pension
     at or above the standard returns covered:true with a zero-or-negative gap,
     so the page can say the standard is met rather than rendering a negative
     number as a shortfall. */
  function gapTo(annualPensionCents, standardKey) {
    var s = STANDARDS[standardKey];
    if (!s) throw new Error('unknown standard: ' + standardKey);
    var have = Math.max(0, Math.round(Number(annualPensionCents) || 0));
    var gapCents = s.annualCents - have;
    return {
      standard: s.key,
      label: s.label,
      targetCents: s.annualCents,
      target: s.annualCents / 100,
      gapAnnualCents: gapCents,
      gapAnnual: gapCents / 100,
      gapMonthly: gapCents / 12 / 100,
      covered: gapCents <= 0,
      housingShare: s.housingShare
    };
  }

  /* Every standard at once, in the order the page shows them. */
  function gaps(annualPensionCents) {
    return STANDARD_ORDER.map(function (k) {
      return gapTo(annualPensionCents, k);
    });
  }

  /* Display only. Never feeds a projection: this page has no growth
     assumption and does not model investment returns. */
  function yearsUntilPensionAge(age) {
    return Math.max(0, PENSION_AGE - (Number(age) || 0));
  }

  /* Which calculations apply to a pension starting in this drawdown year.

       'before'   earlier than 2025. Awarded under earlier rules, which
                  neither module describes.
       'during'   2025 to 2033. The Department works the rate out both ways,
                  Total Contributions Approach and the older Yearly Average,
                  and pays whichever is higher.
       'after'    2034 on. Only the Total Contributions Approach.

     Three named states, not a share that comes back empty at both ends.
     'before' and 'after' are opposite facts about the same year and want
     opposite wording on the page, so a caller that cannot tell them apart
     will eventually print one of them as the other. This returns which side
     you are on; what the mix IS during the window is a separate question,
     answered by the band table in state-pension-entitlement.js. */
  function transition(drawdownYear) {
    var y = Math.floor(Number(drawdownYear) || 0);
    if (y < TRANSITION_FIRST) return 'before';
    if (y > TRANSITION_LAST) return 'after';
    return 'during';
  }

  /* The earliest calendar year in which someone of this age could reach
     pension age.

     An age alone cannot fix the year of a 66th birthday. At age a in year t
     the birthday lands in t + 66 - a - 1 if it has already happened this year
     and t + 66 - a if it has not, and nothing the reader has entered says
     which. This returns the EARLIER of the two, which is the cautious one:
     used against the transition window it can tell someone the window is
     still open when it has in fact just closed for them, and never the
     reverse. Being told a figure is a floor when it is exact costs a reader
     nothing; being told it is exact when the Department may pay more costs
     them the difference. */
  function earliestDrawdownYear(age, thisYear) {
    return (Math.floor(Number(thisYear) || 0) + PENSION_AGE - 1) -
           Math.floor(Number(age) || 0);
  }

  /* What the reality check's figure is: an exact rate, a floor under the real
     one, or simply the rate.

       'exact'  a full record. The Total Contributions Approach gives the
                maximum personal rate outright, which is also the top Yearly
                Average band, so no second calculation can beat it and hedging
                would be hedging for its own sake.
       'floor'  a partial record, reaching pension age while the Department
                still runs both calculations and pays the higher. The real
                rate may be above this one.
       'rate'   a partial record, reaching pension age after the window. Only
                the TCA applies, so on the contributions entered this is the
                rate and not a floor.

     'before' the window answers 'floor' as 'during' does: pensions awarded
     before 2025 also came from the better of two calculations, so a figure
     from this module is a floor there too.

     Throws on a result with no entitlement in it. There is no fourth answer:
     such a result carries no weekly or annual figure anywhere, so there is
     nothing for a caption to qualify, and returning 'floor' would let a page
     caption a pension that does not exist. Loud beats quietly wrong, as in
     gapTo() above. */
  function floorStatus(result, age, thisYear) {
    if (!result || !result.eligible) {
      throw new Error('floorStatus needs an eligible statePension() result');
    }
    if (result.fraction === 1) return 'exact';
    return transition(earliestDrawdownYear(age, thisYear)) === 'after'
      ? 'rate' : 'floor';
  }

  return {
    MAX_WEEKLY_CENTS: MAX_WEEKLY_CENTS,
    FULL_CONTRIBUTIONS: FULL_CONTRIBUTIONS,
    MIN_CONTRIBUTIONS: MIN_CONTRIBUTIONS,
    WEEKS_PER_YEAR: WEEKS_PER_YEAR,
    PENSION_AGE: PENSION_AGE,
    TRANSITION_FIRST: TRANSITION_FIRST,
    TRANSITION_LAST: TRANSITION_LAST,
    STANDARDS: STANDARDS,
    STANDARD_ORDER: STANDARD_ORDER,
    statePension: statePension,
    gapTo: gapTo,
    gaps: gaps,
    yearsUntilPensionAge: yearsUntilPensionAge,
    transition: transition,
    earliestDrawdownYear: earliestDrawdownYear,
    floorStatus: floorStatus
  };
}));
