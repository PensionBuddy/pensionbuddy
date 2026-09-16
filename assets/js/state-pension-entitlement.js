/* State Pension (Contributory) entitlement check: the rate worked out both
   ways the Department of Social Protection works it during the 2025 to 2033
   transition, Method 1 and Method 2, and which of the two would be paid.

   ------------------------------------------------------------------------
   SOURCES, verified 2026-09-11. Re-check before launch and after each Budget.
   Full evidence, with verbatim quotes and URLs, in
   docs/RESEARCH-YEARLY-AVERAGE.md. Damian must confirm the band table before
   launch.

     Yearly Average bands        DSP, Rates of Payment 2026 (SW19), May 2026
       48+        EUR 299.30     edition, p.33 "Weekly Rates". Citizens
       40 to 47   EUR 293.50     Information agrees to the cent. The band
       30 to 39   EUR 269.10     boundaries are S.I. 592/2024, Schedule 8C.
       20 to 29   EUR 254.80     gov.ie's own calculation-methods pages still
       15 to 19   EUR 195.00     showed the 2025 bands when checked, which is
       10 to 14   EUR 119.60     why the booklet is cited and not the pages.
     Transition mix              SWCA 2005 s.109(6D), inserted by the Social
       2025 90/10 to 2033 10/90  Welfare (Miscellaneous Provisions) Act 2023
       2034 on, TCA only         s.46(e). The drawdown year sets the mix.
     Years divided by            SWCA 2005 s.108(2): the contribution year of
                                entry into insurance to the last complete year
                                before pension age, both inclusive.
     Yearly average rounding     half up to a whole number, 9.5 to 10, 47.5 to
                                48. DSP Operational Guidelines and Citizens
                                Information. No statutory citation exists for
                                the rule, so none is given.
     520 paid contributions      the qualifying minimum, on paid contributions
                                only. S.I. 592/2024 Art. 62D(2)(b) with SWCA
                                2005 s.2(1). Credits never count toward it.
     Yearly average below 10     removes Method 2. S.I. 592/2024 Art. 62D(2)(a).
     TCA caps                    credits 520, HomeCaring Periods 1,040, the two
                                together 1,040. DSP Operational Guidelines.
     52 a year                   no more than 52 contributions count in any
                                year. gov.ie.
     Method 1                    PBStatePension.statePension(), the existing
                                module, never re-implemented here.

   WHAT THIS DOES NOT MODEL, and which way each omission errs. See the spec,
   docs/CALC-SPEC-STATE-PENSION-ENTITLEMENT.md S10.

   Left out and can only RAISE the Method 2 figure, so on the details entered
   that figure is a FLOOR:
     The Homemaker's Scheme, which drops whole caring years from 1994 out of
       the years divided by, at most 20. Fewer years, higher average.
     The Alternative Yearly Average, counted from 1979, which applies only
       when it reaches 48.
     Voluntary contributions and Long-Term Carer's Contributions, which add to
       the numerator and can count toward the 520.
     Contributions in the year of the 66th birthday, which count under TCA
       and sit outside the inputs as defined. The TCA figure is a floor by
       that much.

   Left out and can LOWER the figure or remove the entitlement, so the floor
   claim is scoped to exclude them:
     Mixed-rate, EU and pro-rata records, which use different formulas.
     The condition of first paying PRSI before 56, which is not checked.
     The April-to-April contribution year before 2002. The entry year is taken
       as entered; a calendar year given for a January-to-5-April first
       payment up to 2001 is one year too few in the divisor and the figure
       may be too high. The page says so beside the input.

   Out of scope entirely: deferral (everything here is drawdown at 66; the
   band rates for 67 to 70 are not published for 2026 and are not
   interpolated) and pensions that started before 2025, which were awarded
   under earlier rules and get a state with no figure.

   ROUNDING ASSUMPTION. The Method 2 figure is a weighted sum of two cent
   amounts and can land on a fraction of a cent (60% of EUR 293.50 plus 40% of
   EUR 261.89 is EUR 280.856). This module rounds it half up to the cent. No
   published rule governs that rounding (research, unconfirmed item 3). The
   most it can move a figure is half a cent a week, and the page states the
   assumption. Spec S4.

   Contributions here are split, not pooled. Paid, credited and HomeCaring
   Periods are separate inputs because the two methods count them
   differently: Yearly Average takes paid plus credited with no cap and
   ignores HomeCaring Periods; TCA takes all three, capped.
   ------------------------------------------------------------------------

   Contract: docs/CALC-SPEC-STATE-PENSION-ENTITLEMENT.md, S3 and S4.
   Tests: tests/state-pension-entitlement.test.js.
   Loads as a plain script (window.PBEntitlement) after state-pension.js, or
   via require() in node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./state-pension.js'));
  } else {
    root.PBEntitlement = factory(root.PBStatePension);
  }
}(typeof self !== 'undefined' ? self : this, function (SP) {
  'use strict';

  /* Failing here, at load, is clearer than a TypeError on the first call
     because the only way to get here is a wrong script order on the page. */
  if (!SP || typeof SP.statePension !== 'function' || typeof SP.transition !== 'function') {
    throw new Error('PBEntitlement needs state-pension.js loaded first');
  }

  var PAID_MIN            = 520;   // qualifying minimum, on PAID contributions.
                                   // S.I. 592/2024 Art. 62D(2)(b); SWCA 2005 s.2(1)
  var CREDITS_CAP_TCA     = 520;   // credits counted under TCA. Operational Guidelines
  var HOMECARING_CAP_TCA  = 1040;  // HomeCaring Periods under TCA. Operational Guidelines
  var CREDITS_PLUS_HC_CAP = 1040;  // credits and HomeCaring Periods together under
                                   // TCA. Operational Guidelines
  var MAX_PER_YEAR        = 52;    // contributions that count in any one year. gov.ie
  var YA_MIN              = 10;    // below this there is no Yearly Average rate at all.
                                   // S.I. 592/2024 Art. 62D(2)(a)
  var YA_MAX              = 52;    // a yearly average can never exceed a year's weeks.
                                   // A guard: the consistency check below means the
                                   // full flow never reaches it

  /* Pension age and the transition window are NOT redeclared here. Which
     calculations apply to a drawdown year is a fact both pages need and this
     module is loaded on only one of them, so it lives in state-pension.js and
     is read from there: SP.PENSION_AGE, SP.transition(). The mix DURING the
     window is this module's own business and is the table below. */

  /* Yearly Average rate bands, personal rate at 66, weekly cents. Lower bound
     inclusive, highest first, so the lookup walks down and stops at the first
     bound the average reaches. Rates: DSP Rates of Payment 2026 (SW19) p.33.
     Boundaries: S.I. 592/2024 Schedule 8C. */
  var YA_BANDS = [
    { min: 48, weeklyCents: 29930 },   // EUR 299.30, the maximum personal rate
    { min: 40, weeklyCents: 29350 },   // EUR 293.50
    { min: 30, weeklyCents: 26910 },   // EUR 269.10
    { min: 20, weeklyCents: 25480 },   // EUR 254.80
    { min: 15, weeklyCents: 19500 },   // EUR 195.00
    { min: 10, weeklyCents: 11960 }    // EUR 119.60
  ];

  /* The Yearly Average share of Method 2, percent, by drawdown year. The TCA
     share is the remainder. SWCA 2005 s.109(6D), inserted by the 2023 Act
     s.46(e): paragraphs (a) to (i) run 2025 to 2033 on this pattern and (j)
     makes 2034 on TCA only.

     This table is only ever read for a year SP.transition() has already
     called 'during', so it must have a key for every year of the window and
     none outside it. The test suite asserts exactly that against
     SP.TRANSITION_FIRST and SP.TRANSITION_LAST, which is what keeps the table
     and the window from drifting apart now that they live in different
     files. */
  var YA_SHARE = {
    2025: 90, 2026: 80, 2027: 70, 2028: 60, 2029: 50,
    2030: 40, 2031: 30, 2032: 20, 2033: 10
  };

  /* Same coercion as the existing module: a missing or unreadable value is a
     zero, never a NaN, and a slider value that arrives as text still counts.
     Counts cannot be negative; a year can be anything, the checks below sort
     the nonsense out. */
  function count(x) {
    return Math.max(0, Math.floor(Number(x) || 0));
  }
  function year(x) {
    return Math.floor(Number(x) || 0);
  }

  /* Every money value is an integer cent count and every yearly average is an
     integer over an integer, so a half lands exactly on .5 rather than on a
     float approximation of it. Math.round takes a half toward positive
     infinity, which is the half-up rule the Department applies to the yearly
     average and the rule the spec assumes for Method 2. Every input here is
     positive. */
  function roundHalfUp(n) {
    return Math.round(n);
  }

  /* The yearly average: paid plus credited over the years from entry to the
     year before drawdown, rounded half up to a whole number as the Department
     does. Null over no years, since there is nothing to divide by. Capped at
     52 as a guard only. */
  function yearlyAverage(numerator, years) {
    var n = count(numerator);
    var y = year(years);
    if (y < 1) return null;
    return Math.min(YA_MAX, roundHalfUp(n / y));
  }

  /* The rate of the highest band whose lower bound the average reaches. Below
     10 there is no band and no Yearly Average rate, so null rather than zero:
     a zero would blend, and the statute says the method simply does not
     apply. */
  function bandRate(average) {
    var a = Number(average) || 0;
    for (var i = 0; i < YA_BANDS.length; i++) {
      if (a >= YA_BANDS[i].min) return YA_BANDS[i].weeklyCents;
    }
    return null;
  }

  /* The lower bound of that band, for the page's "falls in the 40 to 47
     band" line. Null below 10, as bandRate is. */
  function bandMin(average) {
    var a = Number(average) || 0;
    for (var i = 0; i < YA_BANDS.length; i++) {
      if (a >= YA_BANDS[i].min) return YA_BANDS[i].min;
    }
    return null;
  }

  /* Birth year to drawdown year. Exact for drawdown at 66, which is all this
     page models. */
  function drawdownYear(birthYear) {
    return year(birthYear) + SP.PENSION_AGE;
  }

  /* The whole check. Returns one of four states. The three non-eligible
     states carry no weekly or annual figure anywhere, so a page cannot find
     one nested somewhere and render a pension for someone who has none. */
  function entitlement(input) {
    var o = input || {};
    var paid       = count(o.paid);
    var credited   = count(o.credited);
    var homeCaring = count(o.homeCaring);
    var entryYear  = year(o.entryYear);
    var drawdown   = year(o.drawdownYear);

    // The qualifying minimum is on paid contributions alone. Credits and
    // HomeCaring Periods do not count toward it however many there are, so
    // this gate runs before anything is added together.
    if (paid < PAID_MIN) {
      return { state: 'no-entitlement', paid: paid, paidShortBy: PAID_MIN - paid };
    }

    // The years the Yearly Average divides by: the contribution year of entry
    // to the year before drawdown, both inclusive, which is the difference of
    // the two labels. At most 52 contributions fit in each of them, so a
    // paid-plus-credited total above that means the entry year is wrong, not
    // the pension. Past this check years is at least 10, because 520 paid
    // need ten years at 52 a year, so no later division is over zero years.
    var years = drawdown - entryYear;
    var maxForYears = MAX_PER_YEAR * Math.max(0, years);
    var entered = paid + credited;
    if (entered > maxForYears) {
      return { state: 'inconsistent', years: years, maxForYears: maxForYears, entered: entered };
    }

    // Which calculations apply to this drawdown year. One question, asked
    // once, answered in three named states, so the two ends of the window can
    // never be confused for each other further down.
    var transitionState = SP.transition(drawdown);

    // Pensions that started before 2025 were awarded under earlier rules this
    // module does not describe. A state and the year, nothing else.
    if (transitionState === 'before') {
      return { state: 'before-transition', drawdownYear: drawdown };
    }

    // Method 1, the Total Contributions Approach, through the existing module.
    // Only the three caps are applied here; statePension() caps the total at
    // 2,080 itself. capBit says whether any cap reduced what was entered, so
    // the page can say how much of the credits and HomeCaring Periods counted.
    var creditsCounted    = Math.min(credited, CREDITS_CAP_TCA);
    var homeCaringCounted = Math.min(homeCaring, HOMECARING_CAP_TCA);
    var extrasCounted     = Math.min(CREDITS_PLUS_HC_CAP, creditsCounted + homeCaringCounted);
    var reckonable        = paid + extrasCounted;
    var capBit = credited > CREDITS_CAP_TCA ||
                 homeCaring > HOMECARING_CAP_TCA ||
                 creditsCounted + homeCaringCounted > CREDITS_PLUS_HC_CAP;

    var sp = SP.statePension(reckonable);
    var tca = {};
    Object.keys(sp).forEach(function (k) { tca[k] = sp[k]; });
    tca.reckonable        = reckonable;
    tca.creditsCounted    = creditsCounted;
    tca.homeCaringCounted = homeCaringCounted;
    tca.extrasCounted     = extrasCounted;
    tca.capBit            = capBit;

    // Method 2, the Yearly Average blend. Paid plus credited, credits
    // uncapped, HomeCaring Periods not counted: the Homemaker's Scheme is the
    // Yearly Average's treatment of caring time and it is not modelled.
    var ya = null;
    var method2 = null;
    var method2Unavailable = null;

    if (transitionState === 'after') {
      method2Unavailable = 'after-transition';
    } else {
      var numerator = paid + credited;
      var average = yearlyAverage(numerator, years);
      var rate = bandRate(average);
      ya = {
        years: years,
        numerator: numerator,
        average: average,
        bandMin: bandMin(average),
        weeklyCents: rate,
        weekly: rate === null ? null : rate / 100
      };
      if (rate === null) {
        method2Unavailable = 'yearly-average-below-10';
      } else {
        // 'during' by here, both other states having returned or branched
        // above, so the table has a key for this year.
        var share = YA_SHARE[drawdown];
        // The sum is an integer number of hundredths of a cent, so dividing
        // by 100 puts any half exactly on .5 before the half-up rounding. The
        // rounding itself is the assumption stated in the header.
        var m2Cents = roundHalfUp((rate * share + tca.weeklyCents * (100 - share)) / 100);
        method2 = {
          yaShare: share,
          tcaShare: 100 - share,
          weeklyCents: m2Cents,
          weekly: m2Cents / 100
        };
      }
    }

    // The best-of. The statute says "whichever is the more favourable" and
    // gives no tie rule; on a tie the amount is the same either way, so the
    // label is presentation and never moves the figure.
    var basis;
    if (method2 === null || method2.weeklyCents < tca.weeklyCents) basis = 'method1';
    else if (method2.weeklyCents > tca.weeklyCents) basis = 'method2';
    else basis = 'tie';

    var awardCents = basis === 'method2' ? method2.weeklyCents : tca.weeklyCents;
    var gainCents  = basis === 'method2' ? method2.weeklyCents - tca.weeklyCents : 0;
    var annualCents = awardCents * SP.WEEKS_PER_YEAR;

    return {
      state: 'eligible',
      paid: paid,
      credited: credited,
      homeCaring: homeCaring,
      entryYear: entryYear,
      drawdownYear: drawdown,
      years: years,
      tca: tca,
      yearlyAverage: ya,
      method2: method2,
      method2Unavailable: method2Unavailable,
      award: {
        basis: basis,
        weeklyCents: awardCents,
        weekly: awardCents / 100,
        annualCents: annualCents,
        annual: annualCents / 100,
        gainCents: gainCents,
        gain: gainCents / 100
      }
    };
  }

  return {
    PAID_MIN: PAID_MIN,
    CREDITS_CAP_TCA: CREDITS_CAP_TCA,
    HOMECARING_CAP_TCA: HOMECARING_CAP_TCA,
    CREDITS_PLUS_HC_CAP: CREDITS_PLUS_HC_CAP,
    MAX_PER_YEAR: MAX_PER_YEAR,
    YA_MIN: YA_MIN,
    PENSION_AGE: SP.PENSION_AGE,   // re-exported from its one home, not a copy
    YA_BANDS: YA_BANDS,
    YA_SHARE: YA_SHARE,
    entitlement: entitlement,
    yearlyAverage: yearlyAverage,
    bandRate: bandRate,
    drawdownYear: drawdownYear
  };
}));
