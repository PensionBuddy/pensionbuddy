# PIA: what to update on Budget day, 6 October 2026

`pia.html` describes the Personal Investment Account as a proposal, as at
25 September 2026. Budget 2027 is expected to announce the figures the page
leaves blank. This is the list of what to change and where each lives. Line
numbers are as at the commit that added this file; search for the quoted
text if they have moved.

Rules while doing it: use the figures only as the Department of Finance or
Revenue publish them, cite each one, and keep the word "proposed" until the
Finance Act is passed. After editing any file under `tools/pia-parts/`, run
`python3 tools/pagebuild.py pia`.

## 1. The tax-free threshold

| Where | What it says now | Change |
|---|---|---|
| `tools/pia-parts/main.html` l.144, `#piaThreshold` | empty text field, label "PIA tax-free threshold: not yet announced, try a figure" | Decide with Damian: keep it a reader's input (relabel "Announced: €X. Try another figure", keep empty or prefill), or prefill with the announced figure. If prefilled, change the pagebuild check below |
| same file, l.60, "Still to come" list | "to be announced on 6 October 2026" | move to the "Confirmed" list with the figure and its source |
| same file, l.96, comparison table, PIA "Tax while it grows" | "Rate and threshold not yet announced" | the announced rate and threshold |
| `tools/pia-parts/page.js` l.9-13 (header), l.71-76 (`piaNote` wording) | "No PIA figure is a default"; "Neither the threshold nor the rate has been announced" | reword to match whatever the input does now |
| `tools/pagebuild.py` l.338, check "no threshold filled in" | asserts `value=""` | update or drop if the field is prefilled |
| `glossary.html` l.1853, `#pia` | "the threshold, the rate and the annual limit are due on 6 October 2026" | state them, with "proposed" until law |

## 2. The tax rate

| Where | What it says now | Change |
|---|---|---|
| `tools/pia-parts/main.html` l.143, `#piaRate` | slider 0% to 5%, starts at 0, "not yet announced, try a figure" | same decision as the threshold; check the announced rate is inside the slider's range and on its 0.05 step |
| same file, l.61, "Still to come" | "to be announced" | move to "Confirmed" |
| `tools/pia-parts/page.js` l.31, aria-valuetext | "a figure you are trying, not an announced rate" | reword |
| `tools/pagebuild.py` l.339, check "the rate starts at 0%" | asserts `value="0"` | update if the default changes |
| `assets/js/pia.js` header l.6-20 | "NOTHING HERE HOLDS A FIGURE" | if the page is to default to the announced figures, keep them out of the module anyway (the page supplies them) and update this header; `tests/pia.test.js` section 1 asserts the module holds no rate or threshold |

## 3. The annual limit

| Where | What it says now | Change |
|---|---|---|
| `tools/pia-parts/main.html` l.62, "Still to come" | "to be announced" | move to "Confirmed" |
| same file, l.230, assumptions | "No annual limit is applied, because none has been announced" | apply it: see below |
| `assets/js/pia.js` `pia()`, l.95-100 | no limit | add a cap on each year's payments in (the rest stays outside the account, or say it is ignored), spec in `docs/CALC-SPEC-PIA.md` P3, and tests in `tests/pia.test.js` (raise the gate in `tests/run-tests.py`, `'pia': ... 44`) |

## 4. How the average value is measured (the valuation method)

| Where | What it says now | Change |
|---|---|---|
| `assets/js/pia.js` `pia()`, l.95-99 | the average of the twelve month-end values, as the illustration's own assumption | change to the published method (for example daily, quarterly or start-and-end) |
| `tools/pia-parts/main.html` l.230, assumptions | "How the average will really be measured has not been published" | state the method and its source |
| `docs/CALC-SPEC-PIA.md` P3 | the month-end average | update, and the hand-worked figures in section 3 of `tests/pia.test.js` |

## 5. The launch date

| Where | What it says now | Change |
|---|---|---|
| `tools/pia-parts/main.html` l.6 (page head) and l.63 ("Still to come") | "Accounts are to open during 2027" / "during 2027" | the announced date, if one is given |
| `starter.html` l.2274, `director.html` l.1948 | "Proposed, as at 25 September 2026, and not yet law" | the new as-at date |

## 6. Everywhere: the as-at date and "proposed"

Every PIA fact carries "Proposed · as at 25 September 2026". After updating,
change every one to the date you checked:

    grep -rn "25 September 2026" tools/pia-parts glossary.html starter.html director.html tools/pagebuild.py assets/js/pia.js

That is the page head, "What it is", both halves of "What's confirmed", the
comparison table's note, "Who it might suit", the information box, the
Revenue source line, the glossary entry, the starter and director links, and
the pagebuild record (`desc` and the first check). Keep "proposed" and "not
yet law" until the Finance Act 2026 (or whichever Act) is signed; then drop
them in the same places, and the pagebuild check "said to be a proposal".

## 7. Also worth re-checking the same day

- The 38% exit tax, eight-year deemed disposal, 33% CGT with the €1,270
  exemption and 33% DIRT (`tools/pia-parts/main.html` "How the same money is
  taxed today", and `assets/js/pia.js` `ETF_EXIT_TAX`): Budgets have moved
  these before.
- The open placeholders in `docs/STATUS.md`, Run 23 (PIA-1 to PIA-3).
- The other dated rules pages, as Run 20 noted: director rules, Standard
  Fund Threshold, over-50s, self-employed, UK.

Then: `python3 tools/pagebuild.py`, `python3 tests/run-tests.py`,
`python3 tests/build.test.py`, `python3 tools/verify.py --pages pia.html
glossary.html starter.html director.html --widths 375,1200 --shot-widths
375,1200`.
