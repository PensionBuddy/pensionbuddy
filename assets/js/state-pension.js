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
    return Math.max(0, 66 - (Number(age) || 0));
  }

  return {
    MAX_WEEKLY_CENTS: MAX_WEEKLY_CENTS,
    FULL_CONTRIBUTIONS: FULL_CONTRIBUTIONS,
    MIN_CONTRIBUTIONS: MIN_CONTRIBUTIONS,
    WEEKS_PER_YEAR: WEEKS_PER_YEAR,
    STANDARDS: STANDARDS,
    STANDARD_ORDER: STANDARD_ORDER,
    statePension: statePension,
    gapTo: gapTo,
    gaps: gaps,
    yearsUntilPensionAge: yearsUntilPensionAge
  };
}));
