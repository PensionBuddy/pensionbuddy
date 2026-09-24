# CALC-SPEC: what a pension's charges cost (pension-fees-calculator.html)

The contract for `assets/js/pension-fees.js` (`window.PBFees`) and the page
built on it, item #3 of the ranked build list (Run 20). Every formula here is
asserted by `tests/pension-fees.test.js`.

## F0. What it answers

"What do my plan's charges take out of my pot by the time I retire, and how
would that compare with lower charges?" One pot, one monthly amount, one
period, one growth assumption, and two sets of charges side by side, with a
third line, no charges at all, as the yardstick for what charges take.

It does not name a provider, does not say anyone's charges are too high, and
does not say moving is better: a transfer can mean giving up terms that are
worth more than a charge saved, and the page says so beside the figures.

## F1. Sources, checked 2026-09-24

| | Source |
|---|---|
| 5% of each contribution, 1% a year of the fund | the Standard PRSA maximums: Pensions Act 1990 s.104(5) and (6) (consolidated to 13 May 2026); the Pensions Authority's own pension calculator uses the same two as its charge assumptions |
| the kinds of charge | CCPC, "Pension costs, fees and charges in Ireland": set-up fee, allocation rate, annual management charge, exit and switching charges, early encashment, policy fee |
| 5% growth | the site's own default, the pension calculator's |

## F2. The model, month by month

With a yearly growth `g`, an annual management charge `a` (a share of the
fund a year) and a contribution charge `c` (a share of each payment):

    gm = (1 + g)^(1/12)          the month's growth
    am = (1 - a)^(1/12)          what the month's charge leaves

    each month, in this order:
      pot = pot * gm             growth
      amc = pot * (1 - am)       the charge, taken from the grown fund
      pot = pot - amc
      pot = pot + monthly * (1 - c)   the payment, less its charge

So a year of charge leaves exactly `(1 - a)` of the fund, and a pot with no
payments grows by exactly `(1 + g)(1 - a)` a year. With no charges at all the
month is the calculators' own: growth, then an end-of-month payment, which is
`project()` in `assets/js/cost-of-waiting.js` to the cent; the suite asserts
it.

`amcPaid` adds up every month's `amc`; `contributionPaid` adds up every
payment's `monthly * c`. Their sum is what the charges took in euro at the
time. What they cost by retirement is larger, because every euro taken stops
growing: `cost = pot(no charges) - pot(these charges)`.

## F3. compare(o)

Input `{ pot, monthly, years, growth, a: {amc, contribution}, b: {amc,
contribution} }`, percentages as fractions. Output:

| field | value |
|---|---|
| `a`, `b`, `none` | each plan's projection: `pot`, `amcPaid`, `contributionPaid`, `paidIn`, `yearly` (the pot at the end of each whole year, year 0 first) |
| `costA`, `costB` | `none.pot - a.pot`, `none.pot - b.pot` |
| `difference` | `b.pot - a.pot`: positive when plan B ends higher |

## F4. The page

- Sliders: the pot now, the monthly payment, years to retirement; plan A's
  annual charge and contribution charge (defaults 1% and 5%), plan B's
  (defaults 0.5% and 0%); growth, 5% by default, folded under More options.
- Figures: each plan's pot at retirement, what the charges cost each plan by
  then, the difference between the two, and a line chart of both pots and the
  no-charge line, year by year.
- Beside the figures: the prescribed warnings (Regs 372 and 392), and the
  other side: a lower charge is not the only thing that matters, and moving a
  pension can mean giving up terms worth more than the charge saved.
- Assumptions under the tool, all of them, on the page.
