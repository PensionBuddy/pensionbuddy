# CALC-SPEC: broker-vs-autoenrolment.html

The contract for the side-by-side comparison calculator. Written before any
UI. Every formula here is asserted by `tests/compare-calc.test.js`.

> **Source warning.** The My Future Fund contribution rates and phase years
> below are taken from third-party summaries of the scheme, not from the
> primary NAERSA or gov.ie text. **Damian must confirm the current phase year
> and the exact rates against gov.ie or NAERSA before this page goes live.**
> The same warning is repeated as a code comment above the rate table.

---

## 0. Two modes, two different questions

The page answers two distinct questions. They are labelled separately so the
page never appears to contradict itself.

| Mode | Question it answers | Sections |
|---|---|---|
| **Mode 1: Equivalent layer** | "For the same money out of my pocket, what goes into my pension under auto-enrolment versus a personal pension?" | 1 to 3 |
| **Mode 2: Combined** | "I want to save more than the auto-enrolment minimum. What does auto-enrolment plus a personal top-up put in?" | 3a |

Mode 2 exists because **My Future Fund does not currently accept contributions
above the fixed statutory rate: no AVCs are supported.** So for anyone who
wants to save more than the minimum, the practical choice is not
auto-enrolment *or* a personal pension, it is auto-enrolment *plus* a personal
top-up, because the extra money has nowhere else to go inside auto-enrolment
itself. That is a factual statement of what the scheme currently allows, and
the page states it in that register, not as a recommendation.

> **Source warning, Mode 2.** The "no AVCs" position is current as of the
> research date (September 2026) and comes from third-party summaries and one
> community forum thread, not from the primary legislation text. The
> underlying Act reportedly allows for AVCs in principle even though the live
> implementation does not support them. **Reconfirm against gov.ie or NAERSA
> before launch.** If AVCs become available, the premise of Mode 2 changes.
> Repeated as a code comment above `combined()` in `autoenrolment.js`.

---

## 1. Mode 1, Equivalent layer: what the page compares

Two paths for the same person, for one year, at the salary and age entered:

- **Path A, auto-enrolment (My Future Fund).** Employee, employer and State
  contributions at the statutory rate for the phase year.
- **Path B, personal pension or PRSA arranged through a broker.** The
  person's own contribution, grossed up by marginal-rate income tax relief
  subject to Revenue's limits, plus an employer contribution only if the
  employer separately agrees to one.

For each path the page shows **total into the pension** and **the employee's
own net cost**, so the two are compared like for like.

---

## 2. Path A: auto-enrolment

### Rate table

Ratio is always 3 employee : 3 employer : 1 State.

| Phase | Years | Employee | Employer | State |
|---|---|---|---|---|
| 1 | 1 to 3 (2026 to 2028) | 1.5% | 1.5% | 0.5% |
| 2 | 4 to 6 (2029 to 2031) | 3% | 3% | 1% |
| 3 | 7 to 9 (2032 to 2034) | 4.5% | 4.5% | 1.5% |
| 4 | 10 onward (2035+) | 6% | 6% | 2% |

### Formulas

```
AE_SALARY_CAP = 80000

employee = employeeRate x salary                    // NOT capped
employer = employerRate x min(salary, 80000)        // capped
state    = stateRate    x min(salary, 80000)        // capped

totalIn  = employee + employer + state
netCost  = employee
```

**The employee's contribution is not capped. The employer and State
contributions are, at €80,000 of salary.**

`netCost = employee` because auto-enrolment contributions are deducted from
**net, after-tax pay**. They attract **no marginal income tax relief**. The
employer match and the State top-up are the entire benefit. This is the single
most important difference between the two paths and the page says so plainly.

---

## 3. Path B: broker-arranged personal pension

### Tax relief, reused not reimplemented

Relief uses the logic already implemented and fixed in
`pension-calculator.html` (issues B4 and B5). It is lifted verbatim into
`assets/js/pension-tax-relief.js` as the single source of truth:

```
EARN_CAP = 115000

reliefBand(age) = age < 30 ? 0.15
                : age < 40 ? 0.20
                : age < 50 ? 0.25
                : age < 55 ? 0.30
                : age < 60 ? 0.35
                :            0.40

reliefLimit      = round(reliefBand(age) x min(earnings, 115000))
relievableAnnual = min(grossContribution, reliefLimit)
relief           = relievableAnnual x (taxRate / 100)
```

**Assumption, stated rather than asked:** I was told to reuse the function
rather than reimplement it, and separately told not to touch
`pension-calculator.html`. Those two pull against each other, because the
logic currently lives inline in that page. Resolution: the shared module is
copied verbatim, and `tests/compare-calc.test.js` includes a **drift test**
that drives the real `pension-calculator.html` in headless Chrome, reads its
rendered relief figure, and fails if the shared module disagrees. So the two
cannot silently diverge. Pointing `pension-calculator.html` at the shared
module is a one-line follow-up whenever touching that file is in scope.

### Formulas

```
gross    = the person's own annual contribution (gross)
relief   = as above
netCost  = gross - relief
employer = employerMatchPct x salary        // 0 unless the employer agrees
totalIn  = gross + employer
```

There is **no automatic employer or State contribution** on this path. The
employer match input defaults to **0** and the page states that a personal
pension only carries an employer contribution if the employer separately
agrees to one.

### Contribution above the relief limit

Contributions above `reliefLimit` still reach the pension, they simply get no
relief. Net cost is therefore:

```
netCost = reliefLimit x (1 - taxRate/100) + (gross - reliefLimit)   // when gross > reliefLimit
netCost = gross x (1 - taxRate/100)                                 // otherwise
```

### Default: match the net cost of Path A

So the comparison opens like for like, Path B's contribution defaults to the
gross that costs the person **the same net amount** as their auto-enrolment
employee contribution. Inverting the above:

```
targetNet = Path A netCost
gross = targetNet / (1 - taxRate/100)                        // if that result <= reliefLimit
gross = targetNet - reliefLimit x (1 - taxRate/100) + reliefLimit   // otherwise
```

The user can move the contribution slider away from this default at any time.

---

## 3a. Mode 2, Combined: auto-enrolment plus a personal top-up

### Inputs

Everything Mode 1 takes (age, salary, phase year, marginal rate), plus two
fields of its own:

| Input | Control | Range | Default |
|---|---|---|---|
| Extra you want to save each month, on top of the minimum | slider | €0 to €2,000, step €25 | **0** |
| Employer match on your top-up, as a percentage **of the top-up** | slider | 0% to 100%, step 5 | **0%** |

The extra is the **net** amount, what the person is prepared to pay from
their own pocket each month.

The top-up match is a **separate input from Mode 1's employer match, on a
different basis.** Mode 1's match is a percentage of salary: a fixed,
salary-based benefit in a full-replacement scenario. Mode 2's represents an
employer matching what the person personally chooses to add on, so it is a
percentage of the top-up's grossed-up contribution. A €10-a-month top-up gets
a proportionally tiny match, never a flat salary-based figure (Case 12).
Sharing one slider between the two would have made the same number mean two
different things, so they are not shared.

### Formulas

```
ae         = autoEnrolment(salary, year)                       // Mode 1, unchanged
extraNet   = extraMonthly x 12
extraGross = grossForNetCost(extraNet, age, salary, taxRate)   // SAME shared relief function as Mode 1
layer      = personalPension(extraGross, age, salary, taxRate, 0)
             // Mode 1's own function, so relief and the age-band cap are
             // reused rather than rewritten; asked for with no match because
             // the match is applied on the top-up basis below
topUpMatch = topUpMatchPct x extraGross                        // % of the top-up, NOT of salary

extra.totalIn = extraGross + topUpMatch
extra.netCost = layer.netCost                    // == extraNet, by construction

totalIn    = ae.totalIn + extra.totalIn          // AE + grossed-up extra + any match
netCost    = ae.netCost + extra.netCost
```

The extra is treated as its own contribution, independent of whatever the
auto-enrolment layer is doing. Auto-enrolment contributions attract no relief
and do not consume the age-related limit, so the limit applies to the top-up
alone. Above the limit the excess still reaches the pension with no relief,
exactly as in Mode 1 (asserted in Case 11).

### Outputs

- The unchanged auto-enrolment figure, itemised as in Mode 1.
- The top-up layer: what you pay, the relief on it, the grossed-up amount, and
  any employer match.
- The combined total and the combined net cost.

### Tone

Mode 2 reads as the practical answer for most people who want to save more
than the minimum: keep the auto-enrolment minimum because the match on it is
hard to beat, and route anything extra through a personal pension because
auto-enrolment has nowhere else to put it. Stated matter of fact, as a
consequence of what the scheme currently allows. Not persuasive, not a pitch,
and carrying the same information-not-advice framing as the rest of the page.

---

## 4. Inputs (Mode 1)

| Input | Control | Range | Default | Notes |
|---|---|---|---|---|
| Age | slider | 18 to 70 | 35 | Drives `reliefBand` only |
| Salary | slider | €20,000 to €250,000, step €1,000 | €50,000 | Gross annual |
| Auto-enrolment phase year | slider | 1 to 10+ | **1** | Defaults to year 1, where the scheme actually is today |
| Marginal rate | segmented control, reusing the existing `t20`/`t40` pattern | 20% or 40% | 40% | Applies to Path B relief only |
| Personal pension contribution | slider | €0 to €50,000 | net-cost-matched to Path A, see above | Gross annual |
| Employer match on a personal pension | slider | 0% to 15% | **0%** | "Would your employer match a personal pension, and at what percent" |

---

## 5. Outputs

Per path: **total into the pension** and **your net cost**. Plus:

- The Path A breakdown: employee, employer, State, with the €80,000 cap shown
  when it bites.
- The Path B breakdown: your contribution, tax relief, employer match if any.
- A plain statement of which path produces the larger total **for the figures
  entered**, and by how much.

### Honesty rule

The page must never say or imply that one path is generally better. It
reports only the numbers for the inputs entered. **When auto-enrolment
produces the larger total, the page says so plainly, in the same tone and
prominence it would use for the opposite result.** That is a correct and
expected outcome, not a defect. The CTA reads "talk through what this means
for you", never anything resembling "see why a broker beats the government
scheme".

---

## 6. Compliance

Reuses the exact sitewide language, unchanged:

- "Illustration only", and that the value of investments can fall as well as rise.
- "This is information, not advice", with regulated advice given in a personal
  consultation with Damian, matching the `.infoadvice` block used elsewhere.
- The standard footer disclosure and Central Bank authorisation line.

Rounding: all money is rounded for display with the existing `euro()` helper.
Percentages are exact in the maths and rounded only at the point of display.

---

## 6a. Where the page is linked from

The brief allowed "the nav **or** the calculators index". **Not the main nav.**
The F5 pass measured the header at 16px of headroom in its worst case (a
three-digit countdown, which is the normal state for about nine months of the
year) after fitting a seventh item. An eighth would overflow the 1140px column
and reintroduce issue C6. Instead:

- the footer **Tools** column, on all 15 pages, which is the site's de facto
  calculators index, alongside the pension and director calculators
- an in-body CTA on `starter.html`, mirroring how `director.html` promotes
  `director-calculator.html`, placed after the tax-relief callout where
  auto-enrolment is most relevant to that audience
- `sitemap.xml`

## 7. Acceptance tests

Asserted in `tests/compare-calc.test.js`, all four exact:

| # | Case | Expected |
|---|---|---|
| 1 | Salary €50,000, phase year 1 | employee €750, employer €750, State €250, total €1,750 |
| 2 | Salary €100,000, phase year 1 | employee €1,500, employer €1,200 (capped), State €400 (capped), total €3,100 |
| 3 | Salary €60,000, phase year 5, age 35 | employee €1,800, employer €1,800, State €600, total €4,200 |
| 4 | Salary €120,000, phase year 10, age 45, 40% rate, 5% employer match on the personal pension | **A:** employee €7,200, employer €4,800 (capped), State €1,600 (capped), total €13,600, net cost €7,200. **B:** relief limit €28,750, gross €12,000, relief €4,800, net cost €7,200, employer €6,000, total €18,000 |

Mode 2 acceptance tests, all exact:

| # | Case | Expected |
|---|---|---|
| 7 | Salary €50,000, year 1, extra €100 a month (€1,200 a year), 20% rate, no top-up match | AE layer **€1,750** unchanged. Extra grosses up to **€1,500** (relief €300). Combined **€3,250**. Net cost €1,950 |
| 8 | Same person, 40% rate | Extra grosses up to **€2,000** (relief €800). Combined **€3,750** |
| 9 | Same person, 40%, 5% employer top-up match on the extra layer | Match **€100** (5% of the €2,000 gross top-up, explicitly asserted **not** the salary-based €2,500). Combined **€3,850**. Net cost still €1,950. Relief, cap and net cost asserted identical to `personalPension()` directly, and Mode 1's own match asserted still salary-based |
| 12 | Same person, a tiny €10 a month top-up, 5% match | Gross €200, match **€10**, exactly one tenth of Case 9's, and explicitly asserted not the flat €2,500 and not equal to Case 9's. Combined €1,960. This is the assertion that catches the salary-basis bug |
| 10 | Zero extra, 5% match | Collapses exactly to the Mode 1 auto-enrolment figure; a match on nothing is nothing |
| 11 | Extra above the relief limit (age 29, €40,000, €1,000 a month) | Limit €6,000; relief only on that; net cost still exactly the €12,000 paid |

Plus the drift test in section 3, and a check that the rendered page reports
the same figures as the module.
