# CALC-SPEC: broker-vs-autoenrolment.html

The contract for the side-by-side comparison calculator. Written before any
UI. Every formula here is asserted by `tests/compare-calc.test.js`.

> **Source status, checked 2026-09-10 against gov.ie.** Confirmed at source:
> the 2026 rates (employee 1.5%, employer 1.5%, State 0.5%), and that
> contributions "will not be levied on any gross pay over €80,000", which
> applies to **all three** contributions including the employee's own. Still
> from third-party summaries, not primary text: the later phase rates and
> years, and the position that the scheme takes nothing above its set rate.
> **Damian should still confirm those two against gov.ie or NAERSA.** The
> same status is repeated as a code comment above the rate table.
>
> **Correction, 2026-09-10.** The original brief said the €80,000 cap applied
> to the employer and State contributions only. gov.ie says otherwise, and the
> employee's contribution is now capped in the same way. Section 2 records the
> old and new formulas; Cases 2 and 4 in section 7 changed as a result.

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
pensionable = min(salary, 80000)

employee = employeeRate x pensionable               // capped
employer = employerRate x pensionable               // capped
state    = stateRate    x pensionable               // capped

totalIn  = employee + employer + state
netCost  = employee
```

**All three contributions are calculated on salary up to €80,000.** gov.ie:
"Contributions will not, however, be levied on any gross pay over €80,000",
and "once an employee has reached the €80,000 gross pay threshold in a given
year, they will cease to make contributions". The brief had the employee's
contribution uncapped; that was wrong and is corrected here.

The one nuance gov.ie adds: payroll stops the deduction after the pay period
in which the threshold is crossed, so in practice a little can be paid on
earnings above €80,000 in that final period. An annual illustration ignores
that, and the assumptions list says so.

The money **above** the cap is not lost to the person, it is simply outside
the scheme. Section 3b makes something of that.

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

### Relief at the rate the euros actually attract, added 2026-09-10

The page originally asked the visitor to pick 20% or 40% and applied that flat.
For most people that overstates relief: someone single on €50,000 pays 40% on
only the top €6,000, so a €8,000 contribution attracts 40% on €6,000 and 20% on
the rest. A pension contribution comes off the top of taxable income, so:

```
SRCOP_2026 = { single: 44000, marriedOneIncome: 53000, marriedTwoIncomes: 88000 }
   // revenue.ie, checked 2026-09-10. The €88,000 is a maximum: the €35,000
   // increase cannot exceed the lower earner's income. A single-earner couple
   // is €53,000. These move most years; review at each Budget.

limit = reliefLimit(age, salary)                    // the age-related cap, unchanged
t40   = min(max(0, salary - srcop), limit)          // euros of contribution relieved at 40%
t20   = max(0, limit - t40)                         // euros relieved at 20%
                                                    // anything past t40 + t20 gets no relief
relief(gross) = 0.40 x min(gross, t40)
              + 0.20 x min(max(0, gross - t40), t20)
netCost       = gross - relief
```

The visitor now picks **how they are assessed for tax** (single, married with
one income, married with two incomes) rather than a rate. The flat-rate
functions stay in `pension-tax-relief.js` untouched, because
`pension-calculator.html` still uses them and the drift test guards them; the
tiered ones are added alongside as `reliefTiers`, `reliefOnTiered`,
`netCostOfTiered` and `grossForNetCostTiered`.

Inverse, for the like-for-like default and for section 3b: fill the 40% tier
first at €0.60 per euro of net cost, then the 20% tier at €0.80, then the
unrelieved remainder at €1.00.

### Formulas

```
gross    = the person's own annual contribution (gross)
relief   = tiered, as above
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
gross     = grossForNetCostTiered(targetNet, age, salary, srcop)
```

The user can move the contribution slider away from this default at any time.

---

## 3b. Money above the cap, added 2026-09-10

Shown in Mode 1 only when salary exceeds €80,000. Auto-enrolment takes nothing
on the part of salary above the cap, so the person's own contribution rate on
that part is money the scheme never sees:

```
above     = max(0, salary - 80000)
stranded  = employeeRate x above              // net, it never left take-home pay
couldBe   = grossForNetCostTiered(stranded, age, salary, srcop)
```

Stated plainly: "€above of your salary is above the €80,000 the scheme works
on. Your own rate on that, €stranded, gets no match and no top-up. A personal
pension could take that same €stranded, relieved at your rate, and put
€couldBe into your pension." No crossover is claimed. The idea comes from the
sibling "Is My Future Fund enough?" build, which held the take-home pay given
up constant across both routes; here it is an additive signal on top of the
like-for-like basis, not a change of basis.

### Honesty rule, restated

Below €80,000 the card does not appear and nothing suggests the scheme is
short. Nothing on the page suggests opting out of or reducing auto-enrolment.

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
| Auto-enrolment phase year | slider | 1 to 10+ | **the current calendar year minus 2025**, clamped to 1 to 12 | So the default stays where the scheme actually is without an annual edit |
| How you are assessed for tax | segmented control, three options, reusing the `.seg` pattern | single, married one income, married two incomes | single | Sets the standard rate cut-off point, and so the split of relief between 40% and 20% on Path B and on the Mode 2 top-up. Replaced the 20%/40% picker on 2026-09-10 |
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

> **Corrected 2026-09-09.** That 16px measurement no longer reproduces. Measured
> again with a three-digit countdown, the seven nav items use 676px of a 1140px
> row, and an eighth fits at 1440, 1360 and 1200px with no overflow. See
> `docs/CALC-SPEC-STATE-PENSION.md` §S8. The placements below are still correct
> for this page, but the headroom argument behind them is not.


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
| 2 | Salary €100,000, phase year 1 | employee **€1,200** (capped, was €1,500 before the 2026-09-10 correction), employer €1,200, State €400, total **€2,800**. Money above the cap: €20,000 of salary, **€300** stranded at 1.5% |
| 3 | Salary €60,000, phase year 5, age 35 | employee €1,800, employer €1,800, State €600, total €4,200 |
| 4 | Salary €120,000, phase year 10, age 45, single, 5% employer match on the personal pension | **A:** employee **€4,800** (capped), employer €4,800, State €1,600, total **€11,200**, net cost €4,800. **B**, matched to that net cost: relief limit €28,750, t40 = €28,750 (salary less €44,000 exceeds the limit, so every relievable euro is at 40%), gross **€8,000**, relief €3,200, net cost €4,800, employer €6,000, total €14,000. Money above the cap: €40,000 of salary, **€2,400** stranded at 6%, which a personal pension could turn into **€4,000** |

Mode 2 acceptance tests, all exact:

| # | Case | Expected |
|---|---|---|
| 7 | Salary €50,000, year 1, extra €100 a month (€1,200 a year), 20% rate, no top-up match | AE layer **€1,750** unchanged. Extra grosses up to **€1,500** (relief €300). Combined **€3,250**. Net cost €1,950 |
| 8 | Same person, 40% rate | Extra grosses up to **€2,000** (relief €800). Combined **€3,750** |
| 9 | Same person, 40%, 5% employer top-up match on the extra layer | Match **€100** (5% of the €2,000 gross top-up, explicitly asserted **not** the salary-based €2,500). Combined **€3,850**. Net cost still €1,950. Relief, cap and net cost asserted identical to `personalPension()` directly, and Mode 1's own match asserted still salary-based |
| 12 | Same person, a tiny €10 a month top-up, 5% match | Gross €200, match **€10**, exactly one tenth of Case 9's, and explicitly asserted not the flat €2,500 and not equal to Case 9's. Combined €1,960. This is the assertion that catches the salary-basis bug |
| 10 | Zero extra, 5% match | Collapses exactly to the Mode 1 auto-enrolment figure; a match on nothing is nothing |
| 11 | Extra above the relief limit (age 29, €40,000, €1,000 a month) | Limit €6,000; relief only on that; net cost still exactly the €12,000 paid |

Tiered relief, all exact, added 2026-09-10:

| # | Case | Expected |
|---|---|---|
| 13 | Single, €50,000, age 35 | limit €10,000, t40 €6,000, t20 €4,000 |
| 14 | Same, gross €2,000 | relief €800, net €1,200, identical to flat 40% because it all sits in the 40% tier |
| 15 | Same, gross €8,000 | relief **€2,800** (€2,400 at 40% plus €400 at 20%), net €5,200. Flat 40% would have said €3,200 |
| 16 | Married one income, €50,000, age 35, gross €2,000 | t40 €0, relief **€400**, everything at 20% |
| 17 | Single, €50,000, age 35, net €4,000 | gross **€6,500**: €6,000 at €0.60 then €500 at €0.80. Relief €2,500 checks back to net €4,000 |
| 18 | Same, net €9,000 | gross **€12,200**: the 40% tier, the whole 20% tier, then €2,200 unrelieved. Relief €3,200 checks back to net €9,000 |
| 19 | Two incomes, €100,000, age 45 | limit €25,000, t40 €12,000, t20 €13,000 |
| 20 | Case 8 re-run on the tiered path, single €50,000 age 35 | extra still grosses up to €2,000, so Mode 2's worked example is unchanged by the switch |
| 21 | Money above the cap, €100,000 year 1, single age 45 | above €20,000, stranded €300, could be **€500** |
| 22 | Money above the cap, €80,000 or less | above €0, stranded €0, card hidden |

Plus the drift test in section 3, and a check that the rendered page reports
the same figures as the module.
