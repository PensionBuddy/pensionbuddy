# CALC-SPEC: the cost of waiting (starter.html)

The contract for `assets/js/cost-of-waiting.js` (`window.PBWaiting`) and the
two things on starter.html that draw from it: the existing chart "The same
monthly amount, started at 30, 40 and 50", and the card under it, "If you
wait", built for item #8 of the ranked build list (Run 20). Every formula here
is asserted by `tests/cost-of-waiting.test.js`.

## W0. What it answers

"If I start later, how much less do I end up with, and what would I have to
pay in each month to catch up?" For one reader's own age and one delay. It
does not ask what anyone earns and it does not project a particular pension:
no pot to start with, no tax relief, no charges, no inflation, and the page
says all four on screen, in the card itself, not behind a link (the build
list's compliance line for #8).

## W1. Growth, the same as the calculators

The monthly rate is the pension calculator's own conversion of a yearly
growth assumption:

    monthlyRate(g) = (1 + g/100)^(1/12) - 1

and a pot is the calculator's `project()`, unchanged:

    project(months, startPot, monthly, r)
      = startPot * (1+r)^months + monthly * ((1+r)^months - 1) / r     (r > 0)
      = startPot + monthly * months                                     (r = 0)

Growth is 5% a year, the calculators' default. The starter page copied
`project()` inline for the 30/40/50 chart before this module existed; that
chart now reads it from here, and the figures it prints are proved identical
for every value of its slider (Run 20, item #8).

## W2. potFrom(startAge, retireAge, monthly, g)

Contributions every month from `startAge` to `retireAge`, nothing to start
with: `project((retireAge - startAge) * 12, 0, monthly, monthlyRate(g))`.
Zero when `startAge >= retireAge`.

## W3. monthlyFor(target, months, r)

The level monthly contribution that reaches `target` in `months`, the inverse
of `project` with no starting pot:

    monthlyFor = target * r / ((1+r)^months - 1)      (r > 0)
               = target / months                       (r = 0)

Undefined (null) when `months <= 0`.

## W4. costOfWaiting({ age, wait, monthly, growth, retireAge })

| field | value |
|---|---|
| `startNow` | `age` |
| `startLater` | `age + wait` |
| `now` | `potFrom(age, retireAge, monthly, growth)` |
| `later` | `potFrom(age + wait, retireAge, monthly, growth)` |
| `less` | `now - later`, never negative |
| `catchUpMonthly` | `monthlyFor(now, (retireAge - age - wait) * 12, r)`: what the later start needs each month to reach the same pot |
| `extraMonthly` | `catchUpMonthly - monthly` |
| `tooLate` | `true` when `age + wait >= retireAge`: there are no months left, so there is no catch-up figure (`catchUpMonthly` and `extraMonthly` are null) |

`wait = 0` gives `less = 0`, `catchUpMonthly = monthly` and `extraMonthly = 0`
exactly: the formula is its own inverse, and the tests assert it to the cent.

## W4b. withBreak({ breakAge, years, monthly, growth, retireAge, from })

Run 20 #15, the "Time out." card. Paying `monthly` from `from` (default 30,
`BREAK_FROM`) to `retireAge` (default 66), except for `years` years from
`breakAge`. `breakAge` below `from` is read as `from`; a break that would run
past `retireAge` stops there.

| field | value |
|---|---|
| `breakStart`, `breakEnd` | the break's first and last age, after the clamps |
| `yearsOut` | `breakEnd - breakStart` |
| `full` | `potFrom(from, retireAge, monthly, growth)` |
| `less` | the missed payments grown to `retireAge`: `project(yearsOut * 12, 0, monthly, r) * (1 + r)^((retireAge - breakEnd) * 12)` |
| `withBreak` | `full - less`; the same as the pot before the break grown on, plus the pot paid in after it |
| `share` | `less / full` |
| `extraMonthly` | `monthlyFor(less, (retireAge - breakEnd) * 12, r)`: paying this much more every month from the break's end makes the pot whole |
| `tooLate` | `true` when the break reaches `retireAge`; then `extraMonthly` is null |

At the card's default (€300 a month, 5%, three years from 32) the pot is
€352,847.61 without the break and €300,175.54 with it: €52,672.07 less, 14.9%
of the pot for 8% of the payments, and about €60.65 a month more from 35 makes
it up. Ten years out from 50 costs €62,058.42, not much more: an early break
costs more a year because the missed payments had longest to grow. Worked out
a second time month by month; the tests assert both.

## W5. On the page

- Inputs: "Your age now" 18 to 60, default 30; "If you start in" 0 to 10
  years, default 5; the monthly amount is the chart's own slider above it, so
  one amount drives both.
- Outputs: the two pots, the difference, and the catch-up sentence. Once the
  later start is at or past 66, the card says there is nothing left to catch
  up with rather than printing a figure.
- The note under it, always visible: an illustration; the value of
  investments can fall as well as rise; 5% growth a year; contributions to 66;
  no pension to start with; charges, tax relief and inflation ignored.
- Tone: "less" and "to catch up". No urgency words, no "lose", no countdown.
- "Time out." (withBreak): "The break starts at" 30 to 65, default 32, and
  "Years out" 1 to 10, default 3, with the same monthly amount; the two pots,
  the difference, one sentence, and the HomeCaring Periods paragraph for the
  State Pension side. The prescribed warnings sit under the figures, as under
  the chart.

## W6. Not built

The build list's optional "missed employer money" version (for people who
never joined a workplace scheme) is not built: it needs an employer's rate,
which varies by scheme and is not something the page can assume.
