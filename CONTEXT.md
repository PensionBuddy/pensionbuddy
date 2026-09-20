# Pensionbuddy

The domain language of this site. A glossary, nothing else: no formulas, no
file paths, no decisions. The formulas live in `docs/CALC-SPEC*.md` and are
asserted by the test suites.

Where two words exist for one thing, this file picks one. The other is listed
under _Avoid_, and the reason is usually that the rejected word is wrong in a
way that costs a reader money or trust, not that it is ugly.

Figures are deliberately absent, with a handful of exceptions: 66, 520, 2,080,
1,040, and the years 2025 and 2034. Those are rules, not prices, and they will
outlive any Budget. Every euro figure changes and belongs in the specs and the
modules.

## The pension

**State Pension (Contributory)**:
The social-insurance pension paid from pension age, earned through PRSI
contributions. Not means tested.
_Avoid_: the old-age pension, the government pension, and a bare "the State
Pension" anywhere the Non-Contributory one could be meant.

**State Pension (Non-Contributory)**:
A means-tested payment for people who do not qualify for the Contributory
pension. Named here so it can be excluded: nothing on this site calculates it.

**Personal rate**:
The weekly amount paid to the pensioner alone, before any increase for a
qualified adult or child. Every figure on this site is a personal rate.
_Avoid_: "your pension", "the payment", for the amount. Both hide that
dependants are out. For timing ("take your pension at 66") the phrase is fine.

**Pension age**:
66.
_Avoid_: retirement age. When a person stops working and when the State starts
paying are different dates, and conflating them is how a reader ends up with an
unfunded gap between the two.

**Drawdown year**:
The calendar year in which the pension starts. It is the year of reaching 66
unless the person defers, and it fixes which transition mix applies, once and
for all.
_Avoid_: "the year you retire", "the year you claim". Neither is the rule.

**Deferral**:
Starting the pension at any age from 67 to 70, at a higher rate. Open to
anyone born in 1958 or later. Named so it can be excluded: nothing on this site
models it, and every figure assumes drawdown at 66.

## Contributions

**Paid contribution**:
A full-rate contribution made from a person's own earnings. One component of
a reckonable total, never a synonym for it, and the only kind that counts
toward the qualifying minimum.
_Avoid_: qualifying contribution, which is the statute's term for the same
thing and reads as something else to everyone who is not a solicitor.

**Credited contribution**:
A contribution awarded without earnings, for example while unemployed or ill.
Counts in full under Yearly Average; capped at 520 under the Total
Contributions Approach; never toward the qualifying minimum.
_Avoid_: credit, used alone, which reads as tax relief.

**HomeCaring Period**:
Time spent caring for a child or for someone who needed care, added to the
contribution count although nothing was paid. Counts under the Total
Contributions Approach only, capped at 1,040, and at 1,040 combined with
credits.
_Avoid_: Homemaker's Scheme. That is the Yearly Average's different, weaker
treatment of the same years, and the two are not interchangeable.

**Homemaker's Scheme**:
The Yearly Average's treatment of caring time: whole caring years from 1994
on, at most 20, are left out of the years divided by, rather than added to the
contributions. Counts under Yearly Average only.
_Avoid_: HomeCaring Period.

**Reckonable contribution**:
A contribution that counts under the Total Contributions Approach: paid,
credited and HomeCaring Periods, added together and subject to the caps.
_Avoid_: paid contribution (that is one of the three parts), stamp, PRSI
credit. Also avoid reading gov.ie's "520 reckonable contributions" as this
total: there the word means paid contributions only.

**Full record**:
2,080 reckonable contributions, forty years. The point at which the maximum
personal rate is payable.
_Avoid_: "full contributions", "maxed out".

**Qualifying minimum**:
520 paid contributions, ten years. Below it there is no Contributory
entitlement at all, at any rate, under either method. Credits and HomeCaring
Periods do not count toward it, however many there are.
_Avoid_: "520 reckonable contributions", "ten years of contributions". Both
let credits in.

**Pro rata rate**:
The proportional rate payable between the qualifying minimum and a full record.

**Entry into insurance**:
The year a person first paid PRSI. The start of the years the Yearly Average
divides by.
_Avoid_: "when you started work", which may be earlier.

## How a rate is worked out

**Total Contributions Approach (TCA)**:
The method that sets the rate from the total count of reckonable contributions
against a full record.
_Avoid_: "the new method". It will not be new for long, and the phrase dates
the copy. Also avoid "aggregated contributions method", the statute's name for
it, which nobody outside the Act uses.

**Yearly Average method**:
The older method: paid and credited contributions divided by the years from
entry into insurance to the year before drawdown, rounded to a whole number,
half up, then read off a rate band. Being phased out.
_Avoid_: "the old rules".

**Yearly average**:
The whole number that method produces. Never more than 52.

**Rate band**:
One of six ranges of yearly average, each carrying a fixed weekly rate. A
yearly average below 10 falls into no band and gives nothing.

**Alternative Yearly Average**:
A second yearly average counted from 1979 only, used instead of the ordinary
one when it is higher and reaches 48. Named so it can be excluded: nothing on
this site calculates it, and leaving it out can only lower a figure.

**Method 1**:
The Total Contributions Approach calculated on its own.

**Method 2**:
The combined calculation: a proportion of the Yearly Average rate plus a
proportion of the TCA rate, the Yearly Average share falling ten points a
year from ninety per cent for a 2025 drawdown to nothing from 2034.

**Best-of**:
The rule that the Department pays whichever of Method 1 and Method 2 gives the
higher amount, for every drawdown from 2025 to 2033.
_Avoid_: blend, blended rate. Method 2 on its own is a blend. The award is not,
and describing the award as blended states the rule wrongly.

**Floor**:
A figure that is a guaranteed lower bound rather than an estimate. Anything
this site shows that leaves out a rule which can only raise the figure is a
floor, and the page says which rule. Dropped for the State Pension reality
check on 2026-09-20 (Damian's decision, docs/STATUS.md run 16): nothing beside
its result names the rule any more, though the explainer and the assumptions
below the tool still do. The entitlement check still names what it leaves out
beside its Method 2 figure. The figures are still floors; the module still
decides which (SP.floorStatus).
_Avoid_: estimate, projection. A floor errs in a known direction; an estimate
does not, and the difference is the whole reason the word exists here.

## What retirement costs

**Retirement Living Standards**:
The three annual spending levels published by the Pensions Council: Modest,
Moderate and Comfortable. Always the single-person figures here, at 2024
prices, with housing costs included.
_Avoid_: attributing any "mortgage and rent free" assumption to them. That is
the UK PLSA methodology, not this report.

**Gap**:
The difference between a living standard and an annual pension, stated as a
year and a month.

**Covered**:
The state where a pension meets or exceeds a standard. Shown as covered, never
as a negative gap.

## Naming

**State Pension reality check**:
The page that puts the State Pension next to the Retirement Living Standards.
Nav label "State pension". It works from one reckonable count and Method 1
only, and answers "if this is all I have, what does retirement look like".
_Avoid_: "the TCA tool", which names a method rather than a page, and "the
State Pension calculator", which promises a personal entitlement this page
does not work out. That is the entitlement check.

**State Pension entitlement check**:
The page that works a rate out under both methods and shows which one the
Department would pay. It answers "what would I actually be paid".
_Avoid_: "the Method 2 calculator", "the best-of tool", "the TCA tool".

**Illustration**:
What every figure on this site is.
_Avoid_: projection, forecast, quote, and "what you will get".

---

Covers the State Pension domain only. The vocabulary of the other calculators,
tax relief, auto-enrolment and the Standard Fund Threshold among them, is not
captured yet.
