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

## S1. Sources, verified 2026-09-09

Checked against primary sources, not secondary summaries. gov.ie and
citizensinformation.ie both return 403 to an automated fetch, so those two were
read through search extracts of the primary pages; the Pensions Council PDF was
downloaded and its text extracted directly.

| Figure | Brief said | Verified | Result |
|---|---|---|---|
| Maximum weekly personal rate, 2026 | €299.30 | €299.30 from 1 January 2026, up €10 from €289.30 | **Confirmed** |
| Contributions for the maximum | 2,080 (40 years) | 2,080 | **Confirmed** |
| Minimum to qualify | 520 (10 years) | 520 | **Confirmed, with a correction.** See "reckonable" below |
| Rate below the maximum | proportional | "a pro rata rate depending on the number of contributions ... where those contributions are less than 2080" | **Confirmed** |
| Retirement Living Standards, single | €19,200 / €27,600 / €33,600 | Same three figures, read out of the Pensions Council PDF itself | **Confirmed** |
| Edition | 2024, check for a newer one | Irish Retirement Living Standards, Pensions Council, **September 2024**, published December 2024. No 2025 or 2026 edition exists | **Confirmed, still current** |
| Annualising at 52 weeks | €15,563.60 | Independent sources cite the 2026 rate as "around €15,564 a year" | **Confirmed.** Uses 52, as instructed |

> **Pending, 2026-09-11.** Later research for the entitlement check found
> two wording corrections this page needs, both awaiting Damian: the 520
> minimum is on *paid* contributions, and HomeCaring Periods are capped at
> 1,040 (and at 1,040 combined with credits). See
> `docs/CALC-SPEC-STATE-PENSION-ENTITLEMENT.md` S11, items 1 and 2.

### Correction 1: contributions are "reckonable", not "paid"

The brief says 2,080 **paid** contributions. The Total Contributions Approach
counts **reckonable** contributions: paid contributions **plus** credited
contributions **plus** HomeCaring Periods. Credits are themselves capped at 520.

This matters for who the tool speaks to. Someone with 10 years paid and 15
years of HomeCaring Periods has 25 years reckonable, not 10. The input label
must say "PRSI contributions, including credits and HomeCaring Periods", not
"paid contributions", or the tool tells carers they have no entitlement when
they may have a substantial one.

### Correction 2: the transition is a best-of, not a blend

The brief describes "a blended Yearly Average and TCA method". The actual rule
during the 2025 to 2034 transition is:

- **Method 1:** pure TCA. If it produces the full rate, that is the award and
  nothing further is calculated.
- **Method 2:** a combined rate, a proportion of TCA plus a proportion of
  Yearly Average. In 2026 that proportion is **80% Yearly Average, 20% TCA**,
  with the Yearly Average share falling 10 points a year until it reaches zero
  in 2034.
- **The higher of Method 1 and Method 2 is awarded.**

**What this means for this tool, and it matters:**

This tool computes Method 1 only. Since the award is the higher of the two
methods, the real payment is always **greater than or equal to** what this tool
reports. So:

- At the default 2,080 contributions, Method 1 gives the full rate, so the
  headline figure is **exact**.
- Below 2,080, the tool reports a **floor**. The real payment may be higher,
  which means **the gap this tool shows may be larger than the real one**.

That is the direction that flatters the page's own argument, so it has to be
stated plainly on the page rather than left in a code comment. See S6.

### Also found, not currently modelled

- The personal rate rises to **€309.30 from age 80**. Out of scope for a tool
  about age 66, but worth a line if Damian wants it.
- Below 520 reckonable contributions there is no Contributory entitlement. A
  **Non-Contributory** State Pension is means tested and may apply instead.
  Out of scope, and the page says so rather than guessing a figure.

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

Single person. **The brief's housing caveat is wrong and must not go on the
page as written.**

The brief says the figures "assume outright home ownership". The report says
the opposite: housing costs are **included** in every one of these figures.
Read out of the PDF verbatim, under "What the standards mean":

| Standard | Annual, single | Housing, from the report |
|---|---|---|
| Modest | **€19,200** | "typically a home-owner, but may be renting (most commonly from a local authority)". **38%** of a single person's monthly costs |
| Moderate | **€27,600** | "almost always a home-owner, with some money spent on home decorating". **33%** |
| Comfortable | **€33,600** | "almost always a home-owner, can afford to spend more on home decorating and the occasional use of a cleaner". **29%** |

The only "mortgage and rent free" statement anywhere in the document is
footnote [b] on a chart comparing Ireland to the **UK** PLSA standards, and it
describes the UK methodology. Attributing it to the Irish figures on a
regulated adviser's site would be misattribution.

### Decision: no housing caveat on the page at all

Damian's call, 2026-09-10: drop the "assumes outright home ownership" line
entirely and do not replace it with a corrected version. The page therefore
says nothing about housing next to the comparison. The assumptions list notes
only that the figures are 2024 prices for a single person.

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
| Reckonable PRSI contributions expected by 66, including credits and HomeCaring Periods | slider | 0 to 2,080, step 52 (one year) | **2,080** | The whole calculation. Defaults to the maximum so the headline case is the best case. |
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

### What age is also for: the caveat card

> **2026-09-20:** the card, and the sentence it held, are gone from the page
> (Damian's decision, docs/STATUS.md run 16). The three module functions below
> stay and are still asserted in tests/state-pension.test.js; the entitlement
> page still turns on the same window. What follows describes the module.

Age has one other job, and it is not a figure either. Whether the pension
shown is an exact rate, a floor under the real one, or simply the rate turns
on the year the reader reaches 66, and age is the only clue the page has to
that year.

`transition(drawdownYear)` → `before` | `during` | `after`

> Which calculations apply to a pension starting that year. `during` is 2025
> to 2033, when the Department works the rate out both ways and pays the
> higher; `after` is 2034 on, TCA only; `before` is earlier rules. Three named
> states rather than a share that comes back empty at both ends: `before` and
> `after` are opposite facts about the same year and want opposite wording.

`earliestDrawdownYear(age, thisYear)` → year

> At age *a* in year *t* a 66th birthday lands in *t* + 65 − *a* or one year
> later, depending on the birthday, and nothing the reader has entered says
> which. This returns the earlier. Used against the window it can tell someone
> the window is open when it has just closed for them, never the reverse:
> being told a figure is a floor when it is exact costs a reader nothing,
> being told it is exact when the Department may pay more costs them the
> difference.

`floorStatus(result, age, thisYear)` → `exact` | `floor` | `rate`

> `exact` at a full record, where the TCA gives the maximum personal rate
> outright and no second calculation can beat it. `floor` for a partial record
> reaching 66 during the window, or before it. `rate` for a partial record
> reaching 66 after it. Throws on a result with no entitlement: there is
> nothing there for a caption to qualify.

These live in `state-pension.js` and not in the page script, and not in
`state-pension-entitlement.js`, because both State Pension pages turn on the
same window and only one of them loads the entitlement module. `PENSION_AGE`,
`TRANSITION_FIRST` and `TRANSITION_LAST` have their one home there too; the
entitlement module re-exports `PENSION_AGE` rather than declaring its own.

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
  calculate it. *2026-09-20: the Non-Contributory sentence is no longer in the
  panel (Damian's decision, docs/STATUS.md run 16); the assumptions list below
  the tool still says it.*

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
   pension out in a more detailed way than this. Until 2034 it calculates your
   rate two ways, a Total Contributions Approach and a blend of that with the
   older Yearly Average method, and pays whichever is higher. This tool uses
   the Total Contributions Approach on its own."
2. **That partial figures are a floor.** "Because the Department pays whichever
   method gives more, anyone with less than a full 40 years may be paid more
   than this tool shows, and the gap may be smaller."
3. **The housing wording** from S3, next to the comparison.
4. **Sources, named and linked**: the Pensions Council for the living
   standards, Citizens Information for the State Pension rules and rate.
5. **The date the figures were checked**, so the page ages visibly rather than
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
| 14 | age 40 / 66 / 70 | `yearsUntilPensionAge` | 26, 0, 0, never negative. And `statePension` ignores an age argument entirely |
| 15 | drawdown years 2024, 2025, 2033, 2034 | `transition` | `before`, `during`, `during`, `after`. Every year between is `during`; 2074 is still `after` |
| 16 | age 58 and age 57, both in 2026 | `earliestDrawdownYear` | **2033** and **2034**: one year of age crosses the boundary. Born 1967 or 1968 at 58, reaching 66 in 2033 or 2034, and the earlier decides |
| 17 | a full and a partial record, at 58 and 57 in 2026 | `floorStatus` | full record `exact` on both sides of the boundary; partial record `floor` at 58 and `rate` at 57. Reaching 66 before 2025 is `floor`, not `rate`. An ineligible result throws |

Every assertion is exact to the cent. No tolerances.

The built page is driven at these rows too, by `tests/page-probe.js` in the
same run: the sliders are set through real input events and every cell the
page writes is read back, against the figures above and against the module.
Three rows the page cannot reach stay module-only, and the probe says so on
every run: row 3 (519 is not on the slider's step of 52), row 6 (2,500 is
above the slider's maximum of 2,080), and row 12 (the maximum annual figure
is below the lowest standard, so no standard is ever covered; the probe
asserts that the other way round, on every driven state).

---

## S10. Resolved

1. **Explainer copy** received 2026-09-10 and placed verbatim as its own
   section, "How your State Pension is actually worked out", between the
   calculator and the CTA. It carries the MyWelfare.ie pointer.
2. **Age** is display only, one "You have X years until 66" line.
3. **52 weeks**, matching the €15,564 on the home page.
4. **All five S1 figures verified** against primary sources, two corrections
   applied: the slider is labelled as reckonable contributions with its three
   components named beside it, and the best-of floor is stated beside the
   result and again in the explainer. *2026-09-20: no longer beside the
   result; the explainer still states it.*
5. **Linked from** the main nav (label "State pension"), the footer Tools
   column, `starter.html`, and `sitemap.xml`.
6. Not modelled, by choice: the €309.30 rate from age 80, qualified adult and
   child increases, and the Non-Contributory pension.
