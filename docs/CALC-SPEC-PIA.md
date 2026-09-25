# CALC-SPEC: the same take-home cost, pension vs PIA vs ETF (pia.html)

The contract for `assets/js/pia.js` (`window.PBPia`) and the calculator on
`pia.html` (Run 23). Every formula here is asserted by `tests/pia.test.js`.
What changes on Budget day is in `docs/PIA-BUDGET-DAY.md`.

## P0. What it answers

"If I put the same amount from my take-home pay into a pension, into the
proposed Personal Investment Account, or into an ETF held the way I would
hold one today, what could each leave me after its tax?" It does not say
which is better, and the page frames every persona as "it depends on".

## P1. Sources, as at 25 September 2026

| | Source |
|---|---|
| The PIA: no relief in; a flat yearly tax on the average value above a tax-free threshold, due in a falling year too; no deemed disposal, exit tax or CGT inside; provider pays; no lock-in | Department of Finance, Roadmap for the Taxation of Retail Investment, 31 August 2026. **Proposed, not yet law** |
| The PIA's rate, threshold and annual limit | not announced: due 6 October 2026. **The module holds none of them.** The rate and threshold are the reader's inputs; no limit is applied |
| ETF: 38% exit tax, deemed disposal every eight years | Revenue |
| Pension tax relief | `assets/js/pension-tax-relief.js`, `grossForNetCost` (flat marginal rate, age-related limit, €115,000 earnings cap) |
| Pension lump sum bands | `assets/js/sft.js`, `lumpSum` (first €200,000 tax-free, next €300,000 at 20%, the rest as income) |
| A quarter as a lump sum; a pension normally from 60 | the site's own copy (director-calculator.html, standard-fund-threshold.html; pensions-over-50.html) |

## P2. The month, and the growth path

Every product runs month by month, as the calculators do: the pot grows by
`(1 + g)^(1/12)`, then the month's payment goes in at the end of the month.
`g` is the rate for that year, from `path`, one rate per year. Every product
gets the same path.

`scenarios(o)` builds three paths from the reader's growth `g` and years `n`:

| scenario | path |
|---|---|
| yours | `g` every year |
| lower | `g x 0.5` every year (`LOWER_SHARE`) |
| fall | `g` every year, then `-20%` in year `n` (`FALL`) |

Both are illustrations and are labelled on the page as examples, not
forecasts.

## P3. The three products

**Pension.** Each year, the take-home amount `12 x monthly` is grossed up with
`PBRelief.grossForNetCost(net, age + y, salary, taxRate)`, so the age-related
limit moves with the reader's age each year and anything above it gets no
relief. `gross / 12` goes in each month. At the end, `pot x 0.25` goes
through `PBSft.lumpSum`: its standard-rate tax, plus its "as income" part at
`taxRate`. The other `pot x 0.75` is taxed at `taxRate`. `afterTax = pot -
both`. `beforeAccess` is true when `age + n < 60`.

**PIA.** Nothing is worked out (`null`) until the reader has typed a
threshold. Each year: the twelve month-end values are averaged; tax is
`rate x max(0, average - threshold)`, taken from the account at the year end,
never more than the account holds. A year whose end value (before tax) is
below its start value plus the year's payments is a loss year; the tax paid
in loss years is counted separately so the page can say it is still due.
No annual limit. No tax on the way out. The twelve-month-end average is this
illustration's assumption: the valuation method has not been published.

**ETF outside a wrapper.** Each month's purchase is a lot with a base (its
cost). On every eighth anniversary of a lot (month `bought + 96k`), if its
value is above its base, 38% of the difference is paid by selling part of the
lot and the base becomes what is left. A lot at or below its base pays
nothing and keeps its base. At the end every lot is sold: 38% of any gain
over its base; a lot below its base gets back tax it paid on earlier deemed
disposals, at most 38% of the shortfall and never more than it paid. An
accumulating fund: no distributions.

## P4. Output

`compare(o)` returns `{ pension, pia, etf }`; `scenarios(o)` returns
`{ yours, lower, fall }`, each a `compare`. Every product carries `paidIn`
(the same for all three), `taxDuring`, `taxOut` and `afterTax`; the pension
also `gross`, `relief`, `pot`, `lumpTaxFree`, `endAge`, `beforeAccess`; the
PIA `taxes` (per year), `lossYears`, `taxedLossYears`, `lossYearTax`; the ETF
`value` before exit tax. Euro floats; the page rounds.

## P5. Left out, and said on the page

Fees and charges (the PIA's are unknown), inflation, the Universal Social
Charge and PRSI, employer contributions, the PIA's annual limit, and
drawing a pension over years rather than all at the end.

## P6. Worked examples (asserted)

- EUR 100 a month, one year, 0% growth, 40%, age 35, EUR 50,000: pension
  gross EUR 2,000, relief EUR 800, lump EUR 500 tax-free, EUR 600 tax on the
  rest, EUR 1,400 after tax.
- Same, PIA at a 1% test rate and a EUR 0 test threshold: month-ends 100 to
  1,200 average 650, tax EUR 6.50, EUR 1,193.50 left. At a EUR 500 threshold:
  EUR 1.50.
- ETF, EUR 100 a month at 6% for nine years: the first twelve lots reach
  their eighth anniversary in year nine, each grown exactly 96 months, so
  deemed-disposal tax is `12 x 0.38 x 100 x (1.06^8 - 1)`.
