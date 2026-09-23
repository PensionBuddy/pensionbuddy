# CALC-SPEC: state-pension-entitlement.html

The contract for the State Pension entitlement check. Written before any
code, the same way as `docs/CALC-SPEC-STATE-PENSION.md` and `docs/CALC-SPEC.md`.
Every formula and every figure here is asserted by
`tests/state-pension-entitlement.test.js`, exact to the cent.

Revision 2, 2026-09-11. The first draft was put through an adversarial review
(three lenses, two skeptics per finding). Sixteen findings stood and are
folded in below; the ones that changed a rule are called out where they land.

> **Source warning.** Every rate below is a real third-party figure published
> on a regulated adviser's site. All of them were verified against primary
> sources on 2026-09-11; the evidence, with verbatim quotes and URLs, is in
> `docs/RESEARCH-YEARLY-AVERAGE.md`. Damian must confirm the band table before
> launch. That document lists six UNCONFIRMED items; every one is accounted
> for in S1.

Vocabulary: `CONTEXT.md`. The terms below are used exactly as defined there.

---

## S0. What this page answers

One question: **what would the State Pension actually pay me?**

The reality check deliberately computes Method 1 only and says every partial
figure is a floor. This page does the other half: it works the rate out both
ways the Department does during the transition, Method 1 and Method 2, and
shows which one would be paid and by how much it differs.

It is a different question from the reality check's, for a different reader.
The reality check stays as it is. This page links to it for the gap.

---

## S1. Sources, verified 2026-09-11

Full evidence in `docs/RESEARCH-YEARLY-AVERAGE.md`. Summary:

| Figure or rule | Result | Authority |
|---|---|---|
| Yearly Average bands, 2026: 48+ €299.30; 40 to 47 €293.50; 30 to 39 €269.10; 20 to 29 €254.80; 15 to 19 €195.00; 10 to 14 €119.60 | **Confirmed** | DSP *Rates of Payment 2026 (SW19)*, p.33; Citizens Information agrees to the cent |
| Band boundaries | **Confirmed** | S.I. 592/2024, Schedule 8C |
| Transition: 2025 90/10 … 2033 10/90, 2034 TCA only | **Confirmed** | SWCA 2005 s.109(6D), inserted by the 2023 Act s.46(e) |
| The drawdown year sets the mix, not the current year | **Confirmed** | s.109(6D); gov.ie; SW19 p.35 |
| Denominator: the contribution year of entry to the year before drawdown, inclusive | **Confirmed** | SWCA 2005 s.108(2); gov.ie worked example |
| Contribution years before 2002 ran 6 April to 5 April, labelled by their April year | **Confirmed** | s.108(2) and (3); gov.ie's "1978/79" worked example |
| Yearly average rounded to a whole number, half up | **Confirmed as practice** | Operational Guidelines; Citizens Information. No statutory citation exists, so none is given |
| Numerator: paid + credited (+ voluntary), credits uncapped | **Confirmed** | s.108(2); gov.ie |
| HomeCaring Periods count under TCA only | **Confirmed** | gov.ie, stated explicitly |
| 520 minimum is on paid contributions; credits never count | **Confirmed** | S.I. 592/2024 Art. 62D(2)(b); SWCA 2005 s.2(1) |
| Yearly average below 10 removes Method 2 | **Confirmed** | S.I. 592/2024 Art. 62D(2)(a) |
| TCA caps: credits 520, HomeCaring 1,040, combined 1,040 | **Confirmed** | Operational Guidelines |
| No more than 52 contributions count in any year | **Confirmed** | gov.ie |

### The six UNCONFIRMED items in the research, and where each lands

| # | Item | Handling |
|---|---|---|
| 1 | The exact day in January 2026 the rate took effect | The page says "from January 2026" and no day. S11 |
| 2 | No statutory citation for the yearly-average rounding rule | The rule is published; no section number is cited for it |
| 3 | Whether the Method 2 blend is rounded, and to what | Rounded half up to the cent, stated on the page as an assumption. S4, S11 |
| 4 | Band rates at deferred ages 67 to 70 | Deferral is out of scope. S10 |
| 5 | Whether half-up rounding survives unchanged under s.109(6D) | Research: very likely, low risk. Recorded here; no page copy |
| 6 | gov.ie's own rate pages still show the 2025 bands | The page cites SW19 2026 by name and page, and says so. S6 |

### Three corrections this research makes to the existing reality check

1. **The qualifying minimum is 520 paid contributions.** The reality check
   gates on the reckonable total. Someone with 400 paid and 300 credited is
   shown a pension they would not get. This page implements the rule
   correctly. The reality check's wording is reported in S11, not changed
   here, because changing live copy is Damian's call.
2. **The caps.** The reality check's slider subnote and assumptions list say
   only that credits are capped at 520. HomeCaring Periods are also capped at
   1,040, and credits plus HomeCaring at 1,040 combined. A reader with 520
   credits and 1,040 HomeCaring Periods is invited to enter 1,560 on top of
   paid where the Department counts 1,040. Reported in S11, not changed.
3. **The floor caveat is only true for the transition cohort.** Anyone
   reaching 66 from 2034 on is paid under TCA alone. The reality check's
   caveat card becomes age-aware (S9) so it stops hedging where there is
   nothing to hedge. This one is applied, because it is copy in the card this
   build already rewrites and it makes the page more accurate, not less.
   *2026-09-20: the card and its sentence are gone from the page (Damian's
   decision, docs/STATUS.md run 16); the module's `floorStatus` stays.*

---

## S2. Inputs

**Revised after review.** The first draft asked for age. Age cannot fix the
year a person turns 66: someone aged 64 on 11 September 2026 was born between
12 September 1961 and 11 September 1962 and reaches 66 in 2027 or 2028, and
the year is the legally operative input. So the page asks for year of birth.

| Input | Control | Range | Default | What it drives |
|---|---|---|---|---|
| Year you were born | slider, step 1 | current year − 66 to current year − 18 | **current year − 64** | Drawdown year = birth year + 66. That sets the Method 2 mix and the end of the Yearly Average's years |
| Contribution year you first paid PRSI | slider, step 1 | birth year + 16 to the smaller of the current year and birth year + 65 | **birth year + 23** | The start of the Yearly Average's years |
| Paid contributions to the end of the year before you turn 66 | slider, step 52 | 0 to 2,600 | **1,560** | The 520 gate. Both numerators |
| Credited contributions to the same date | slider, step 52 | 0 to 1,040 | **260** | Yearly Average in full; TCA capped at 520 |
| HomeCaring Periods | slider, step 52 | 0 to 1,040 | **0** | TCA only, capped at 1,040 and at 1,040 combined with credits |

### The contribution year

The Yearly Average's years start at the contribution year of entry, not the
calendar year of the first payment. Before 2002 the contribution year ran
from 6 April to 5 April and is labelled by its April year, so a first payment
between 1 January and 5 April of any year up to 2001 belongs to the year
before. The subnote under the slider says exactly that: "Before 2002 the
contribution year ran from April to April. If your first payment was between
January and 5 April of a year up to 2001, choose the year before." The
calculation takes the year as entered. See S10 for what that means for the
floor claim.

### "To the end of the year before you turn 66"

Both contribution counts are defined to the end of the last complete year
before 66, because that is the period the Yearly Average is measured over.
Contributions in the year of the 66th birthday itself are not in the
numerator. Defining the inputs this way makes the Yearly Average exact on
what is entered, and the TCA figure, which would also count that final partial
year, a floor by a few weeks' contributions at most.

### Coupled bounds

The entry-year slider's bounds move with the birth year. When a change of
birth year puts the current entry year outside its bounds, the page clamps it
to the nearest bound and the subnote says so ("moved to 1978, the earliest it
can be for that birth year"), the way the comparison page re-matches its
contribution and says so. Nothing changes silently.

### Why these defaults

In 2026 the defaults describe a 64-year-old, born 1962, in insurance since
1985, with thirty years paid and five credited. They reach 66 in 2028 and are
paid **€280.86** under Method 2 against **€261.89** under Method 1 (S8,
example 2). The two methods visibly disagree, which is the point of the page.
A full-record default would show them agreeing.

The birth-year default is relative to the clock, so the default reader is
always 64. The worked figures above are for 2026; from 2027 the default
drawdown moves a year and the figures move with it, and from 2032 the default
reader reaches 66 in 2034, after the transition. **Revisit the default before
2032.**

### The current year

Derived at runtime, the way the comparison page derives its scheme year, so
the page does not go stale on 1 January. The module takes the drawdown year
as an explicit argument and never reads the clock, so the tests are
deterministic.

### Step sizes

Every contribution slider steps in 52 so every value is a whole number of
years. This has a second purpose: the existing Method 1 module rounds the
weekly rate directly from `29930 × counted / 2080`, while the Department
rounds the *percentage* to two decimals first. Those two routes agree
whenever `counted` is a multiple of 52 (the percentage is then an exact
multiple of 2.5) and can differ by up to two cents otherwise (523
contributions: €75.26 direct against €75.24 by the Department's route). With
every slider stepping in 52 and every cap a multiple of 52, the page can never
reach a value where they differ. The module-level tests that use other
values (S8, examples 5 to 7) assert on the yearly average and band only, for
that reason.

---

## S3. The calculation

Module: `assets/js/state-pension-entitlement.js`. Loads in node and in the
browser with no build step, after `assets/js/state-pension.js`, which it uses
for Method 1 and never re-implements. Every input is coerced with
`Number(x) || 0` and floored, as the existing module does, so a missing value
is a zero, never a NaN.

The module's public interface is two functions, `entitlement(input)` and
`band(average)`. The numbers and tables below are internal to it: they are
facts it applies, not questions a caller asks, and each is proven from the
outside at the boundary where it decides something (S8, row 19).

```
PAID_MIN            = 520
CREDITS_CAP_TCA     = 520
HOMECARING_CAP_TCA  = 1040
CREDITS_PLUS_HC_CAP = 1040
MAX_PER_YEAR        = 52

Pension age is NOT one of this module's numbers. It is not read here at all:
entitlement() is handed a drawdown year and never works one out from a birth
year. PENSION_AGE lives in state-pension.js and the page reads it there, for
its own slider bounds and for the drawdown year it passes in.

YA_BANDS (lower bound inclusive, weekly cents):
  48 → 29930    40 → 29350    30 → 26910
  20 → 25480    15 → 19500    10 → 11960
  The lowest bound, 10, is also the floor of the whole method: below it an
  average falls in no band and Method 2 does not apply. There is no separate
  YA_MIN constant to drift from the table.

YA_SHARE (percent of the Yearly Average rate, by drawdown year):
  2025 90   2026 80   2027 70   2028 60   2029 50
  2030 40   2031 30   2032 20   2033 10
  before 2025: not modelled     2034 on: none, TCA only

The window itself is not a constant of this module. Which side of it a
drawdown year falls on is `PBStatePension.transition(year)`, answering
`before` / `during` / `after`, and the window's two ends are
`TRANSITION_FIRST` and `TRANSITION_LAST` there. YA_SHARE above says only what
the mix IS inside the window. The test suite asserts that through the
calculation rather than by reading the table: year by year across the window
and past both its ends, a year inside it has to come back with a numeric share
and a figure that is a real number, which is exactly what a missing key would
break. A key OUTSIDE the window is not asserted against, because it cannot be
read: `transition()` has already answered `before` or `after` by then.
```

### entitlement({ paid, credited, homeCaring, entryYear, drawdownYear })

```
if paid < PAID_MIN:
    return { state: 'no-entitlement', paid, paidShortBy: PAID_MIN - paid }

years = drawdownYear - entryYear              # entryYear .. drawdownYear-1, inclusive
maxForYears = MAX_PER_YEAR * max(0, years)
if paid + credited > maxForYears:
    return { state: 'inconsistent', years, maxForYears, entered: paid + credited }

if drawdownYear < 2025:
    return { state: 'before-transition', drawdownYear }   # no award, no figures: not modelled

# Method 1, via the existing module
creditsCounted    = min(credited, CREDITS_CAP_TCA)
homeCaringCounted = min(homeCaring, HOMECARING_CAP_TCA)
extrasCounted     = min(CREDITS_PLUS_HC_CAP, creditsCounted + homeCaringCounted)
tcaReckonable     = paid + extrasCounted
method1 = PBStatePension.statePension(tcaReckonable)      # caps at 2,080 itself

# Method 2
if drawdownYear >= 2034:          method2 = { reason: 'after-transition' }
else:
    average = yearlyAverage(paid + credited, years)      # years >= 10 here, see below
    yaBand  = band(average)                              # null below 10
    if yaBand is null:            method2 = { reason: 'yearly-average-below-10' }
    else:
        yaShare  = YA_SHARE[drawdownYear]
        method2Cents = roundHalfUp((yaBand.weeklyCents * yaShare + method1.weeklyCents * (100 - yaShare)) / 100)
        method2 = { yaShare, tcaShare, weeklyCents, weekly }

# Best-of
award = method2 has a figure and method2Cents > method1.weeklyCents ? method2 : method1
return { state: 'eligible', ... }
```

The consistency check makes `years < 1` impossible past the gate: 520 paid
contributions need at least ten years at 52 a year. So there is no
"no complete year" case, and `years` is at least 10 wherever a yearly average
is computed.

### band(average)

The rate band the average falls in: the highest band whose lower bound the
average reaches.

```
{ min, max, weeklyCents }   max is null for the top band, which has no upper bound
null                        below 10, where the method does not apply at all
```

The upper bound is one below the next band's lower bound and is worked out
here, once, so a caller naming the band ("40 to 47", "48 or over") never walks
the table to find where one band ends.

### The yearly average itself

Internal. Paid plus credited over the years from entry to the year before
drawdown, rounded half up to a whole number as the Department does: 9.5 becomes
10, 47.5 becomes 48, 9.4 becomes 9. It is capped at 52 and refuses a division
over no years, both guards only: the consistency gate returns `inconsistent`
before either can fire, because 520 paid contributions need ten years at 52 a
year. S8 row 8 asserts the gate, not the guard.

### Drawdown at 66

`entitlement()` takes the drawdown year; it does not work one out from a birth
year. The page does that, as `birthYear + PENSION_AGE`, reading pension age
from `state-pension.js` where it lives and which the page already loads for its
own slider bounds.

### Return shape

```
state: 'no-entitlement' | 'inconsistent' | 'before-transition' | 'eligible'

no-entitlement:   { state, paid, paidShortBy }
inconsistent:     { state, years, maxForYears, entered }
before-transition:{ state, drawdownYear }
eligible: {
  state, paid, credited, homeCaring, entryYear, drawdownYear,
  years,                        # the years the Yearly Average divides by:
                                # entryYear to drawdownYear - 1, both inclusive
  tca: { reckonable, creditsCounted, homeCaringCounted, extrasCounted, capBit,
         counted, capped, fraction, years,      # NB: tca.years is counted / 52,
         weeklyCents, weekly, annualCents, annual }   # the years of record the
                                                      # TCA counts, which is not
                                                      # the top-level `years`
  yearlyAverage: null | { years, numerator, average,
                          band: null | { min, max, weeklyCents } }
  method2: { yaShare, tcaShare, weeklyCents, weekly }    # there is a figure
          | { reason: 'after-transition' | 'yearly-average-below-10' }
  award: { basis: 'method1' | 'method2' | 'tie', weeklyCents, weekly, annualCents, annual, gainCents, gain }
}
```

`method2` is **one field with two shapes**, never null: the figure, or the
reason there is no figure. The two shapes share no key, so `reason` is the
whole test and there is nothing to find beside it. A figure plus a separate
`method2Unavailable` flag was two fields for one fact, and two fields for one
fact can disagree.

`tca` is Method 1's result plus what the caps did to get there, named field by
field rather than copied wholesale from `statePension()`. Two of that result's
fields are deliberately absent: `eligible`, which past the 520 gate is always
true, and `contributions`, which is the same number as `reckonable`. `capBit`
is true when any of the three TCA caps reduced the count.

`yearlyAverage` is populated whenever a yearly average was computed: for
`yearly-average-below-10` it carries `years`, `numerator` and `average` with
`band` null. For `after-transition` it is null, because no average was worked
out at all. The band is one object, not a lower bound and a rate scattered
beside it.

`gainCents` is `method2 − method1` when Method 2 is paid, otherwise 0. When
the two figures are equal the basis is `'tie'` and the amount is the same
either way. The statute says only "whichever is the more favourable" and
gives no tie rule; with the 2026 bands and 52-step inputs a tie can only
occur at a full record, so the label is a presentation choice and never
changes the amount.

The three non-eligible states carry **no weekly or annual figure anywhere**.

Nothing else is exported. `yearlyAverage()`, `bandRate()`, `bandMin()` and
`drawdownYear()` were steps of `entitlement()` that a caller repeating them
could only get out of step with it, and the constants and both tables were
facts the module applies. A wide interface is a promise about internals; the
promise here is `entitlement()` and `band()`.

There is no `yaShare(year)` either. It returned null both before 2025 and from
2034, two opposite facts under one value, and a caller could only tell them
apart by already knowing the answer. `PBStatePension.transition(year)` names
all three states instead.

---

## S4. Rounding

All money in **integer cents**, rounded **half up**, as in the existing
module. The yearly average is rounded half up to a whole number before the
band lookup, as the Department does.

The Method 2 figure is a weighted sum of two cent amounts and can land on a
fraction of a cent (60% of €293.50 plus 40% of €261.89 is €280.856). This
page rounds it half up to the cent. **No published rule governs that
rounding** (research, unconfirmed item 3). The most the choice can move a
figure is half a cent a week, and the page states the assumption. See S11.

---

## S5. Outputs

### State A: fewer than 520 paid contributions

No weekly figure at all. The panel says the pension needs 520 paid
contributions, ten years, that credits and HomeCaring Periods do not count
toward that minimum however many there are, and how many more paid
contributions are needed. Then the Non-Contributory note from the reality
check, unchanged. *2026-09-20: that note is gone from both pages' panels.*

### State D: the details do not fit

No weekly figure. "These details don't fit together. 1,820 paid and credited
contributions is more than the 1,404 that fit between 2001 and the end of
2027 at 52 a year. Check the contribution year you first paid PRSI." The
numbers are the module's `entered`, `maxForYears`, `entryYear` and
`drawdownYear − 1`.

That is the page's own default record, 1,560 paid and 260 credited for someone
born in 1962, with only the entry year moved to 2001: 2001 to the end of 2027
is 27 years and 27 × 52 is 1,404.

### State B: eligible, Method 2 available

Headline: the award, **a week** and **a year** (the annual figure to the
whole euro, as on the reality check; every other figure to the cent), with a
foot line naming the basis and the drawdown year: "Worked out under the Yearly Average blend, for
a pension starting in 2028", or "…under the Total Contributions Approach…",
or, on a tie, "Both calculations give this figure."

Then a card, **"Both calculations"**, with the two methods as rows:

- **Method 1, Total Contributions Approach**: the reckonable count used,
  the percentage of a full record, the weekly rate. When `capBit` is true, a
  note: "1,040 of your 1,560 credits and HomeCaring Periods count; the rest
  are over the caps."
- **Method 2, the Yearly Average blend**: the yearly average and the years it
  was averaged over, the band and its rate, the mix for the drawdown year,
  the weekly rate.
- The closing line, one of four:
  - Method 2 paid: "The Department pays the higher. That is **€280.86**,
    **€18.97 a week** more than the Total Contributions Approach alone."
  - Method 1 paid, HomeCaring above zero: "The Department pays the higher.
    That is the Total Contributions Approach figure. Your HomeCaring Periods
    count under it and not under Yearly Average."
  - Method 1 paid, no HomeCaring: "The Department pays the higher. That is
    the Total Contributions Approach figure. A yearly average of 42 over 50
    years falls in the 40 to 47 band, and the blend of that band's rate with
    the TCA rate comes to less."
  - Tie: "Both calculations give the same figure. At a full record the Total
    Contributions Approach already gives the maximum."
- **The floor statement, in this state only**: "On the details entered, the
  Method 2 figure is a floor. This page leaves out the Homemaker's Scheme and
  the Alternative Yearly Average, both of which can only raise it. It does
  not cover mixed-rate, EU or pro-rata records, and it does not check that
  you first paid PRSI before 56." *2026-09-20: deleted, with the toggle that
  showed it and the probe line that asserted it (Damian's decision, V4-5,
  docs/STATUS.md run 16). The assumptions below the tool still list what the
  page leaves out.*

### State C: eligible, Method 2 unavailable

Headline as in B, basis "Total Contributions Approach". The card carries the
Method 1 row and a sentence saying why there is no second calculation:

- `after-transition`: "You reach 66 in 2052, after the transition ends in
  2033. Only the Total Contributions Approach applies, so on the
  contributions entered this is your rate." **No floor statement.**
- `yearly-average-below-10`: cannot be reached from the sliders. With entry
  no earlier than the 16th year the years never exceed 50, and 520 paid over
  50 years is 10.4, which rounds to 10 and is in a band. The module still
  handles it (S8, example 4) and the page carries one defensive line for it:
  "Your yearly average is 9 over 56 years. Below 10 the Yearly Average
  method gives nothing, so the Total Contributions Approach figure is paid.
  The Homemaker's Scheme, which this page leaves out, can shorten the years
  and bring the average back above 10."

`before-transition` cannot be reached from the sliders either, and the page
has **no panel for it**. The birth-year slider starts at the current year minus
66, because someone older has already passed pension age, so the earliest
drawdown year the page can produce is the current year itself; 2025 is past, so
that is inside the transition window or after it, never before. The panel that
once stood ready for it was dead markup, dead CSS and a dead branch, and the
page now has three result states because three is what its controls can
produce. Section 21 of the test suite walks every birth year and entry year the
page offers and asserts the set of states that come back: that the fourth
never appears, and that the other three all do. The module keeps the state:
`entitlement()` is not the page, and a drawdown year before 2025 is a real
answer for it to give.

The entry-year slider stays live in State C. It changes nothing there, and
the after-transition sentence says why.

### In every eligible state

- "This assumes you take your pension at 66."
- One line linking to the reality check: "To see what this pays for, put it
  next to what retirement costs."

*2026-09-20: both lines are gone, with the card that held them (Damian's
decision, docs/STATUS.md run 16). The birth slider's own subnote still says
the page assumes drawdown at 66.*

### Screen readers

One spoken summary in a polite live region, per state: State B, the award,
the basis, and the other method's figure; State C, the award and that only
the Total Contributions Approach applies; State A, the shortfall in paid
contributions; State D, that the details do not fit and why.

---

## S6. What must appear on the page itself

1. **How the two methods work**, in plain terms: TCA counts everything you
   have against forty years; Yearly Average divides paid and credited
   contributions by the years since your first contribution year and reads a
   rate off a band; until the end of 2033 the Department runs both and pays
   the higher, with the Yearly Average share of the blend falling each year.
2. **That the drawdown year sets the mix**, and that this page assumes
   drawdown at 66.
3. **The 520 paid rule**, with the words "credits and HomeCaring Periods do
   not count toward it".
4. **That HomeCaring Periods count under TCA only**, next to the input.
5. **The April-to-April rule** for contribution years before 2002, next to
   the entry-year input.
6. **The floor statement** (State B) and what is left out (S10).
7. **The Method 2 rounding assumption** (S4), in the assumptions list.
8. **Sources, named and linked**: the Department's *Rates of Payment 2026
   (SW19)*, page 33, for the bands, with a line saying the Department's own
   web pages on the calculation methods still showed 2025 rates when this was
   checked, which is why the booklet is cited; Citizens Information for the
   rules; MyWelfare.ie for a person's own record.
9. **The date the figures were checked**: 11 September 2026.

---

## S7. Compliance and tone

Identical to the reality check, S7 of `docs/CALC-SPEC-STATE-PENSION.md`:
illustration only, not a personal recommendation, not a statement of what
anyone will be paid, rules change at each Budget, regulated advice happens in
a consultation. Matter of fact. The figures do the work. No urgency.

One addition, because this page shows a figure the Department itself would
compute: it says, in the information box, that the Department's own
calculation on a person's actual record is the only one that counts, and
that a person can request a contribution statement at MyWelfare.ie.

---

## S8. Acceptance tests, given / when / then

In `tests/state-pension-entitlement.test.js`, run by
`python3 tests/run-tests.py state-pension-entitlement`. All money in cents.
No tolerances.

Worked by hand here so the test is checking the module against the spec, not
the module against itself. Method 1 figures reuse the existing module's
proven values (€261.89 at 1,820; €224.48 at 1,560; €74.83 at 520).

| # | Given | Then |
|---|---|---|
| 1 | paid 2,080, credited 0, HC 0, entry 1986, drawdown 2026 | Method 1 €299.30. Years 40, average 52, band 48, Method 2 = 80% × 299.30 + 20% × 299.30 = **€299.30**. Basis **tie**, award **€299.30**, gain 0, annual **€15,563.60** |
| 2 | **the 2026 default**: paid 1,560, credited 260, HC 0, entry 1985, drawdown 2028 | reckonable 1,820 → Method 1 **€261.89**. Years 43, 1,820 / 43 = 42.33 → **42**, band 40 → €293.50. Mix 60/40: (29350 × 60 + 26189 × 40) / 100 = 28085.6 → **€280.86**. Award **€280.86** on **method2**, gain **€18.97**, annual **€14,604.72** |
| 3 | HomeCaring makes TCA win: paid 1,040, credited 0, HC 780, entry 1990, drawdown 2030 | reckonable 1,820 → Method 1 **€261.89**. Years 40, 1,040 / 40 = **26**, band 20 → €254.80. Mix 40/60: (25480 × 40 + 26189 × 60) / 100 = 25905.4 → **€259.05**. Award **€261.89** on **method1**, gain 0, `capBit` false |
| 4 | yearly average below 10, module level: paid 520, credited 0, HC 0, entry 1970, drawdown 2026 | Method 1 **€74.83**. Years 56, 520 / 56 = 9.29 → **9**. `method2` = { reason: `yearly-average-below-10` } and carries no figure; `yearlyAverage` = { years 56, numerator 520, average 9, band null }. Award **€74.83** on method1 |
| 5 | half up at the top band: paid 1,900, entry 1986, drawdown 2026 | 1,900 / 40 = 47.5 → **48**, `band(48)` = { min 48, max null, weeklyCents 29930 } |
| 6 | one below: paid 1,896, same years | 1,896 / 40 = 47.4 → **47**, `band(47)` = { min 40, max 47, weeklyCents 29350 } |
| 7 | half up at the floor: paid 570, entry 1966, drawdown 2026 | 9.5 → **10**, band { min 10, max 14, weeklyCents 11960 }, and a Method 2 figure. Paid 564 over the same years: 9.4 → **9**, band **null**, `method2.reason` = `yearly-average-below-10` |
| 8 | the consistency gate at its boundary: 520 paid over exactly ten years | **eligible**, average **52**, the most a yearly average can be. One year's contributions more: **inconsistent**, `maxForYears` 520. 520 paid over nine years: **inconsistent**, `maxForYears` 468. So nothing past the gate divides by fewer than ten years, and the guards inside the average cannot fire |
| 9 | credits uncapped under YA, capped under TCA: paid 1,040, credited 780, HC 0, entry 1990, drawdown 2030 | reckonable 1,040 + 520 = 1,560 → Method 1 **€224.48**, `creditsCounted` 520, `capBit` true. Years 40, 1,820 / 40 = 45.5 → **46**, band 40 → €293.50. Mix 40/60: (29350 × 40 + 22448 × 60) / 100 = 25208.8 → **€252.09**. Award **€252.09** on **method2**, gain **€27.61** |
| 10 | combined credits + HomeCaring cap: paid 520, credited 520, HC 1,040, entry 1986, drawdown 2026 | `creditsCounted` 520, `homeCaringCounted` 1,040, `extrasCounted` 1,040, reckonable 1,560 → Method 1 **€224.48**, `capBit` true. Years 40, 1,040 / 40 = **26**, band 20 → €254.80. Mix 80/20: (25480 × 80 + 22448 × 20) / 100 = 24873.6 → **€248.74**. Award **€248.74** on **method2** |
| 11 | after the transition: paid 1,560, credited 0, HC 0, entry 2004, drawdown 2052 | Years 48. Method 1 **€224.48**. `method2` = { reason: `after-transition` } and carries no figure; `yearlyAverage` null, no average worked out at all. Award **€224.48** on method1 |
| 12 | before the transition: paid 1,560, credited 0, HC 0, entry 1990, drawdown 2024 | `state` = `before-transition`. No `award`, no `tca`, no weekly or annual figure anywhere in the result |
| 13 | paid below 520 with reckonable above it: paid 468, credited 260, HC 0 | `state` = `no-entitlement`, `paidShortBy` **52**, no weekly or annual figure anywhere in the result |
| 14 | the details do not fit: paid 520, credited 0, HC 0, entry 2026, drawdown 2026 | `state` = `inconsistent`, `years` 0, `maxForYears` **0**, `entered` 520, no figures. And paid 1,560, credited 0, entry 2000, drawdown 2026: years 26, `maxForYears` **1,352**, `entered` 1,560, `inconsistent` |
| 15 | the last transition year: paid 1,560, credited 260, HC 0, entry 1985, drawdown 2033 | Method 1 **€261.89**. Years 48, 1,820 / 48 = 37.92 → **38**, band 30 → €269.10. Mix 10/90: (26910 × 10 + 26189 × 90) / 100 = 26261.1 → **€262.61**. Award **€262.61** on **method2**, gain **€0.72** |
| 16 | Method 1 wins with no HomeCaring: paid 2,080, credited 0, HC 0, entry 1976, drawdown 2026 | Years 50, 2,080 / 50 = 41.6 → **42**, band 40 → €293.50. Method 1 **€299.30**. Mix 80/20: (29350 × 80 + 29930 × 20) / 100 = 29466 → **€294.66**. Award **€299.30** on **method1** |
| 17 | every band boundary, both sides: `band()` at 52, 48, 47, 40, 39, 30, 29, 20, 19, 15, 14, 10 | the six published bands with both bounds: 48/null, 40/47, 30/39, 20/29, 15/19, 10/14, at 29930, 29350, 26910, 25480, 19500, 11960. `band(9)` and `band(0)` null |
| 18 | every transition year, through the calculation: one eligible record with the years held at 43, drawdown 2024 … 2034 | shares 90, 80, 70, 60, 50, 40, 30, 20, 10 for 2025 … 2033, each with a real figure and not a NaN; 2024 `before-transition`, 2034 `after-transition`. Swept over 2015 … 2045, the years with a share start at `TRANSITION_FIRST`, end at `TRANSITION_LAST` and miss none between |
| 19 | the public interface, whole | `Object.keys` is exactly `band, entitlement`. `yearlyAverage`, `bandRate`, `bandMin`, `drawdownYear`, `yaShare`, `YA_BANDS`, `YA_SHARE` and every constant are undefined on it. The numbers those constants held are asserted at the boundaries where they decide something: 519 paid short by one and 520 eligible; credits capped at 520, HomeCaring at 1,040, the two together at 1,040; `maxForYears` 2,080 over 40 years; 10 in a band and 9 in none |
| 20 | coercion: `entitlement({})` | `state` = `no-entitlement`, `paidShortBy` 520. And `entitlement({ paid: '1560', credited: undefined, homeCaring: null, entryYear: '1985', drawdownYear: 2028 })` gives the same award as example 2 with credited 0: reckonable 1,560, Method 1 €224.48, years 43, 1,560 / 43 = 36.28 → 36, band 30 → €269.10, mix 60/40: (26910 × 60 + 22448 × 40) / 100 = 25125.2 → **€251.25** on method2 |
| 21 | the page's own input space: every birth year and entry year the five controls offer, against paid 0 … 2,600, credited 0 … 1,040 and HomeCaring 0 … 1,040 spanning both gates and all three caps | exactly three states come back, `eligible`, `inconsistent` and `no-entitlement`. `before-transition` never does, which is why the page has three result panels. No eligible result divides by fewer than ten years, none averages more than 52, and the lowest average reachable is 10 |
| 22 | past a full record: paid 2,080, credited 0, HC 1,040, entry 1986, drawdown 2026 | reckonable **3,120**, over the 2,080 a full record is, so `counted` **2,080**, `capped` **true**, `fraction` **1**, Method 1 **€299.30**. `capBit` is **false**: the 2,080 cap is statePension()'s, not one of the three TCA caps on credits and HomeCaring Periods, and neither of those bit. The yearly average ignores the HomeCaring Periods: 2,080 / 40 = **52**, top band €299.30, so the two methods **tie** at €299.30. This is the only state in which the page prints "more than a full record of 2,080" instead of a percentage |

Every eligible result is also checked for internal consistency:
`award.weeklyCents` equals whichever of `tca.weeklyCents` and
`method2.weeklyCents` is named by `basis` (either, on a tie), and
`annualCents` equals `weeklyCents × 52`.

The built page is driven at these rows too, by `tests/page-probe.js` in the
same run, under a clock pinned to 2026 so the drawdown years above stay on
the birth slider: the five sliders are set through real input events, birth
first because the entry-year bounds follow it, and every cell the page writes
is read back against the figures above and against the module. Rows 1, 2, 3,
8, 9, 10, 11, 13, 14 (second case), 15, 16 and 22 are driven, and so is the
birth-to-entry clamp of S2. Six cases the sliders cannot reach stay
module-only, and the probe prints the live bound or step that blocks each:
row 4 and row 7 (an entry year below the slider's floor of birth + 16), rows
5, 6 and 7 (a paid count that is not on the step of 52), row 12 (a 2024
drawdown needs a 1958 birth, below the floor), and the first case of row 14
(an entry year equal to the drawdown year, above the slider's ceiling). Rows
17 to 21 have no page state. Row 2 is the page's shipped default, so its
figures are in the static markup and prove the least; rows 1 and 9 are the
ones that show the page writing a figure.

---

## S9. Changes to the reality check

Confined to `tools/state-pension-parts/`. Every existing assertion in
`tests/state-pension.test.js` must pass unchanged, and the page's figures do
not move. There are 80 of them as of Run 11, up from the 55 this section was
written against; Run 10 added 25 when the transition window moved into
`state-pension.js`.

1. **The caveat card (`#spFloor`) becomes age-aware.** *2026-09-20: the card
   and its sentence were removed from the page on Damian's decision; the
   module's `floorStatus` stays and is still tested, and the probe still
   checks it against the spec rows.* The reality check
   keeps its age slider, and age alone cannot fix the year of the 66th
   birthday: at age *a* it is either `currentYear + 65 − a` or one later. So
   the card never names the year, and it uses the **earlier** candidate to
   decide, so that the "not a floor" wording can never be shown to someone
   who is still in the transition. Three states:
   - full record: exact, unchanged wording;
   - below a full record and `currentYear + 65 − age ≤ 2033` (in 2026, ages
     58 to 66): "You reach 66 while the Department still runs the older
     Yearly Average calculation alongside this one, which it does until the
     end of 2033, and pays whichever is higher. So this is a floor: your real
     rate may be higher." with a link, "Work out both calculations", to the
     entitlement check;
   - below a full record and `currentYear + 65 − age ≥ 2034` (in 2026, ages
     18 to 57): "You reach 66 in 2034 or later, after the older Yearly
     Average method has gone. Only the Total Contributions Approach applies,
     so on these contributions this is your rate rather than a floor." with a
     quieter link to the entitlement check for the paid-contribution minimum
     and the caps.
   The age subnote stays true: age still does not change the pension figure
   on that page. *2026-09-20: with the note under the result gone, the
   subnote reads "Used for this line only".*
2. **The explainer's "one honest caveat" paragraph** gets one sentence at
   the end linking to the entitlement check.
3. **The assumptions list** item about the two methods gets the same link.

Not changed, pending Damian: the reckonable-520 wording and the caps
wording. See S11.

---

## S10. Not modelled, by choice

Each of these is stated on the page in the assumptions list, with its
direction.

Can only raise the Method 2 figure, so leaving them out keeps it a floor:

- **The Homemaker's Scheme.** Whole caring years from 1994 are left out of
  the Yearly Average's divisor, at most 20, and only years with no credits.
  A smaller divisor means a higher average.
- **The Alternative Yearly Average**, counted from 1979, which applies only
  when it reaches 48.
- **Voluntary contributions** and **Long-Term Carer's Contributions**, both
  of which add to the numerator and can count toward the 520.
- **Contributions in the year of the 66th birthday**, which count under TCA
  but are outside the inputs as defined. The TCA figure is a floor by that
  much.

Can lower the figure or remove entitlement, so the floor claim is scoped to
exclude them:

- **Mixed-rate, EU and pro-rata records**, which use different formulas.
- **The condition of first paying PRSI before 56.** With the inputs as
  bounded, an entry at 56 with the minimum 520 contributions is the only
  reachable case, and the page does not check it.
- **The April-to-April rule** is stated beside the input rather than
  computed. A reader who enters the calendar year of a January-to-April first
  payment before 2002 gets one year too few in the divisor and a figure that
  may be too high. The floor claim is "on the details entered".

Out of scope entirely:

- **Deferral.** Everything assumes drawdown at 66. The Yearly Average band
  rates at 67 to 70 are not published for 2026 and will not be interpolated.
- **Pensions that started before 2025**, which were awarded under earlier
  rules this page does not describe.

---

## S11. Open items

### NEEDS DAMIAN INPUT

1. **The reality check's qualifying minimum.** `docs/CALC-SPEC-STATE-PENSION.md`
   S2 and the live page gate on 520 *reckonable* contributions. The statute
   gates on 520 *paid*. For anyone with fewer than 520 paid but 520 or more
   reckonable, the reality check shows a pension they would not get.
   Proposed fix, one sentence added to the slider's subnote and one to the
   assumptions list: "At least 520 of these must be contributions you paid
   yourself; credits and HomeCaring Periods do not count toward that
   minimum." The module is unchanged either way because it has one input.
   **Not applied. Approve or amend.**
2. **The reality check's caps wording.** The subnote and the assumptions
   list say credits are capped at 520 and stop there. Proposed fix: "Credits
   count up to 520, HomeCaring Periods up to 1,040, and the two together up
   to 1,040." **Not applied. Approve or amend.**
3. **The band table**, S3, before launch. All six figures are confirmed
   against SW19 2026 p.33 and Citizens Information; this is the sign-off
   the source warning at the top asks for.
4. **The April-to-April rule** is handled by a subnote. If you would rather
   the page asked "was that before 6 April?" for pre-2002 entries, that is a
   small control and a follow-up. **Built 2026-09-23 (#27 on Damian's build
   list):** a box under the entry year, shown for entry years up to 2001;
   ticked, the module gets the entry year minus one. Unticked, nothing
   changes.

### Stated on the page as assumptions, no action needed

5. Method 2 is rounded half up to the cent; no published rule governs it.
6. The €299.30 rate applies "from January 2026". No day is given anywhere
   primary, so the page does not give one.
