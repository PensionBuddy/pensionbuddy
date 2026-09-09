# CALC-SPEC: state-pension-reality-check.html

The contract for the State Pension reality check. Written before any UI, the
same way `docs/CALC-SPEC.md` was written before `broker-vs-autoenrolment.html`.
Every formula here is asserted by `tests/state-pension.test.js`.

> **Source warning.** Every figure below is a real third-party number being
> used on a regulated adviser's site to make a point. Damian must confirm all
> of them before launch. See section S1 for exactly what needs checking and
> against which source. The same warning is repeated as a code comment above
> the rate constants.

---

## S0. What this page answers

One question: **if the State Pension is all you have, what does retirement
actually look like?**

The page puts the maximum State Pension next to the three Retirement Living
Standards published by the Pensions Council, and states the difference. It
then explains, in general terms, what closing that difference involves.

It is not a projection of anyone's own pension, and it does not model
investment returns. It reports two sets of published figures and subtracts one
from the other.

---

## S1. Sources, and what must be reconfirmed before launch

| Figure | Value used | Source to check against | Status |
|---|---|---|---|
| State Pension (Contributory) maximum personal rate | **€299.30 a week** | gov.ie Budget 2026, or Citizens Information "State Pension (Contributory)" | **Confirm.** Supplied in the brief as a 2026 rate. Not independently verified. |
| Contributions for the maximum rate | **2,080** (40 years x 52) | Citizens Information, Total Contributions Approach | **Confirm.** Internally consistent: 40 x 52 = 2,080. |
| Minimum to qualify at all | **520** (10 years x 52) | Citizens Information | **Confirm.** Internally consistent: 10 x 52 = 520. |
| Retirement Living Standards, single person | **€19,200 / €27,600 / €33,600** | Pensions Council, research by KPMG | **Confirm, and check for a newer edition.** Brief says the current published edition is 2024 data. |
| Weeks used to annualise | **52** | n/a, a choice | **Decide.** See below. |

### Annualising

The State Pension is paid weekly. This spec multiplies the weekly rate by
**52**, not 52.18, because:

- `€299.30 x 52 = €15,563.60`, which rounds to **€15,564**
- the home page already cites **€15,564** for the State Pension in its gap
  statistics, so 52 keeps the two pages consistent

If Damian prefers 52.18, both pages change together. Flagging rather than
deciding quietly, because the two figures differ by about €54 a year and this
page is built on subtraction.

### What the tool does not model

The real Department of Social Protection calculation is more complicated than
the proportional method below. During the current transition period the
Department works out an entitlement under **both** the Yearly Average method
and the Total Contributions Approach and pays whichever is better, and TCA
itself can include **HomeCaring Periods** and **credited contributions** on
top of paid ones.

This tool uses the **simplified proportional TCA approximation only**. That
sentence must appear on the page in plain English, not only in a code comment.
See S6.

Below 520 paid contributions there is no Contributory entitlement. A
**Non-Contributory** State Pension is means tested and may apply instead. That
is out of scope here and the page says so rather than guessing at a figure.

---

## S2. The State Pension formula

Module: `assets/js/state-pension.js`, matching the shape of
`assets/js/autoenrolment.js` so it loads in node and in the browser with no
build step.

```
MAX_WEEKLY_CENTS = 29930      // €299.30
FULL_CONTRIBUTIONS = 2080     // 40 years
MIN_CONTRIBUTIONS  = 520      // 10 years
WEEKS_PER_YEAR     = 52
```

### statePension(contributions)

```
if contributions < MIN_CONTRIBUTIONS:
    return { eligible: false, contributions, shortBy: MIN_CONTRIBUTIONS - contributions }

counted = min(contributions, FULL_CONTRIBUTIONS)      // never more than 100%
weeklyCents = roundHalfUp(MAX_WEEKLY_CENTS * counted / FULL_CONTRIBUTIONS)
return {
    eligible: true,
    contributions,
    counted,                                  // shown when the cap bites
    fraction: counted / FULL_CONTRIBUTIONS,   // for the "x% of the maximum" line
    weeklyCents,
    weekly:  weeklyCents / 100,
    annual: (weeklyCents * WEEKS_PER_YEAR) / 100
}
```

### Rounding

All money is computed in **integer cents** and rounded **half up**. The two
worked examples happen to come out right through plain floating point as well,
because `1560 / 2080 * 299.30` lands fractionally above `224.475`. That is
luck, not a guarantee. The cents route is exact by construction, and the 520
boundary is a true half cent (`7482.5`) where luck should not be relied on.

`roundHalfUp(n) = Math.round(n)` is correct here because every value is a
positive cent count, and JavaScript's `Math.round` rounds a half toward
positive infinity.

---

## S3. Retirement Living Standards

Single person, and these figures **assume the person owns their home
outright**.

| Standard | Annual | Description used on the page |
|---|---|---|
| Modest | **€19,200** | The basics, no frills |
| Moderate | **€27,600** | Some comfort, occasional treats |
| Comfortable | **€33,600** | More freedom, travel, running a car |

The home ownership assumption is not a footnote. Anyone renting or still
paying a mortgage in retirement needs **more** than these figures, not less,
so the gaps shown are the **best** case. This must be stated in the body copy
next to the comparison, not buried in the disclaimer. It makes the page more
honest, and it happens to make the point stronger.

### gapTo(annualPension, standard)

```
target = STANDARDS[standard].annual
gapAnnual  = target - annualPension          // may be negative or zero
gapMonthly = gapAnnual / 12
return { standard, target, gapAnnual, gapMonthly, covered: gapAnnual <= 0 }
```

At the maximum rate, the arithmetic is:

| Standard | Target | State Pension | Gap a year | Gap a month |
|---|---|---|---|---|
| Modest | €19,200 | €15,563.60 | **€3,636.40** | €303.03 |
| Moderate | €27,600 | €15,563.60 | **€12,036.40** | €1,003.03 |
| Comfortable | €33,600 | €15,563.60 | **€18,036.40** | €1,503.03 |

---

## S4. Inputs

| Input | Control | Range | Default | What it drives |
|---|---|---|---|---|
| Total PRSI contributions expected by 66 | slider | 0 to 2,080, step 52 (one year) | **2,080** | The whole calculation. Defaults to the maximum so the headline case is the best case. |
| Age now | slider | 18 to 66 | 40 | **Nothing in the pension figure.** See below. |

### What age is for

The brief lists age as an input without saying what it changes. It changes
**nothing** in the State Pension calculation, which depends only on
contributions. Specifying it as display only:

> "You have **26 years** until 66."

That frames the gap in the time available to do something about it, and leads
into the explainer and the CTA. It never feeds a projection, because a
projection needs a growth assumption and this page deliberately has none.

**Decision needed:** keep age as this single framing line, or drop it. It
earns its place only if the years-to-66 line is wanted.

### Step size

The contributions slider steps in **52**, one year of contributions, because
that is how people think about it and it keeps every value a whole number of
years. The label reads both ways: "2,080 contributions, 40 years".

---

## S5. Outputs

Headline, at the default 2,080:

- **€299.30 a week**, **€15,563.60 a year**
- "the maximum State Pension, and that needs a full 40 years of contributions"

Then, for each of the three standards, a bar and a plain sentence:

- the target figure
- the gap in euro a year and a month
- the gap in words, for example "about **€1,003 a month** short of a moderate
  standard of living"

When contributions are below 520:

- **no weekly figure at all.** The panel states that there is no Contributory
  entitlement below 10 years of contributions, that a means-tested
  Non-Contributory payment may apply instead, and that this tool does not
  calculate it.

When contributions are between 520 and 2,080:

- the proportional rate, plus "that is **x%** of the maximum"

When a gap is zero or negative, the page says the standard is covered. It
never renders a negative gap as if it were a shortfall.

### Chart

The site has no chart component. `pension-calculator.html` and the home page
both use simple CSS bars (`.hc-bars`, `.cbars`, `.rv-bar`). Reuse that
language: four horizontal bars on a shared scale, the State Pension first, then
the three standards, with the gap shaded. No new dependency.

---

## S6. What must appear on the page itself

Not only in code comments:

1. **The simplified method.** "The Department of Social Protection works your
   pension out in a more detailed way than this, including a Yearly Average
   calculation during the current transition period and credits for time spent
   caring. This tool uses a simplified proportional method for illustration."
2. **The home ownership assumption** on the living standards, next to the
   comparison.
3. **Sources, named and linked**: the Pensions Council for the living
   standards, Citizens Information for the State Pension rules and rate.
4. **The date the figures were checked**, so the page ages visibly rather than
   silently.

---

## S7. Compliance

Same framing as every other calculator on the site:

- illustration only, not a personal recommendation
- figures and rules change, and Budget changes them most years
- information, not personalised advice
- regulated advice happens in a consultation with Damian

### Tone

Matter of fact. The Pensions Council's own figures do the work. The page
states the gap and stops. No "shocking", no "crisis", no "are you prepared?",
no counting down. If the numbers are not persuasive on their own then adding
pressure language is not the fix.

---

## S8. Where the page is linked from

The brief asks for the main nav. §6a of `docs/CALC-SPEC.md` had ruled that out
on the grounds of 16px of header headroom, so this was measured again rather
than assumed:

| Viewport | Nav row | 7 items today | With an 8th item | Page overflow |
|---|---|---|---|---|
| 1440px | 1140px | 676px of links | 774px | none |
| 1360px | 1140px | 676px | 774px | none |
| 1200px | 1140px | 676px | 774px | none |
| 1024px | burger | n/a | n/a | none |

An eighth item fits at every width with no overflow. The 16px figure in §6a
does not reproduce today and that section should be corrected. `verify.py`'s
nav overrun check is the gate either way.

So: **main nav**, plus `starter.html` alongside the other calculator CTAs, the
footer Tools column, and `sitemap.xml`.

Proposed nav label: **State pension**.

---

## S9. Acceptance tests, given / when / then

In `tests/state-pension.test.js`. `tests/run-tests.py` currently hardcodes
`compare-calc.test.js` and needs a small change to take a file argument or run
both.

| # | Given | When | Then |
|---|---|---|---|
| 1 | 2,080 contributions | weekly rate | exactly **€299.30**, and `fraction` is exactly 1 |
| 2 | 1,560 contributions | weekly rate | exactly **€224.48**, and `fraction` is exactly 0.75 |
| 3 | 519 contributions | statePension | `eligible: false`, **no weekly or annual figure**, `shortBy` 1 |
| 4 | 0 contributions | statePension | `eligible: false`, `shortBy` 520 |
| 5 | 520 contributions, the boundary | weekly rate | **€74.83**, the true half cent case (7482.5 cents) |
| 6 | 2,500 contributions | statePension | capped: **€299.30**, `counted` 2,080, `fraction` 1 |
| 7 | 2,080 contributions | annual | exactly **€15,563.60** |
| 8 | the maximum annual figure | gap to Modest | **€3,636.40** a year, **€303.03** a month |
| 9 | the maximum annual figure | gap to Moderate | **€12,036.40** a year, **€1,003.03** a month |
| 10 | the maximum annual figure | gap to Comfortable | **€18,036.40** a year, **€1,503.03** a month |
| 11 | 1,560 contributions | gap to Comfortable | annual pension €11,672.96, gap **€21,927.04** |
| 12 | an annual pension above a standard | gap | `covered: true`, gap not rendered as a shortfall |
| 13 | every standard | target figures | €19,200, €27,600, €33,600 exactly, guarding against a typo in the constants |

Every assertion is exact to the cent. No tolerances.

---

## S10. Open, and blocking

1. **The investing explainer copy has not been supplied.** Step 4 of the brief
   says "using the copy I've given", but no copy came with it. Section 4 of the
   build cannot start without it. Everything else can.
2. **Age**: keep it for the years-to-66 line, or drop it. See S4.
3. **52 or 52.18 weeks.** See S1.
4. **All five figures in S1 need confirming** against gov.ie, Citizens
   Information and the Pensions Council before launch.
