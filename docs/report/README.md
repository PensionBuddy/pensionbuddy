# The pension snapshot

The one page a client leaves the free 20-minute call with. It shows what we
found, what it charges, the gap, and one next step.

## Open question for the owner

Does Damian give clients anything written after the call? If yes, make this
match it. If no, this is the proposal.

## The files

| File | What it is |
|---|---|
| `pension-snapshot-template.html` | The blank page. Damian fills it in after each call. |
| `pension-snapshot-sample.html` | The same page with made-up figures, to show prospects. |
| `../../assets/img/sample-pension-snapshot.png` | The sample as a picture: 900 x 1273 px, 64 KB. |
| `../../assets/img/sample-pension-snapshot.webp` | The same picture: 50 KB. |

The picture is not on any page yet. To use it, put it in a `<picture>`: the
`.webp` first, the `.png` as the fallback, `width="900" height="1273"`, and
alt text that says it is a sample.

## How Damian fills in the template

1. Open `pension-snapshot-template.html` in Chrome or Edge. Double-click it.
2. Click a [bracket]. Type over it.
3. One row per pension. "Add a pension row" adds one. "Remove the last row"
   takes one away. Four pensions fit on the page.
4. Add up "In all" yourself. The page does not do sums.
5. The bar at the top counts the blanks left. It warns if the page gets too
   long for one sheet.
6. Click "Print or save as PDF". Pick "Save as PDF" and A4.
7. Send the PDF to the client.

The page does not keep what you type. Close it and it is blank again. The PDF
is the copy to keep.

Leave the file in this folder. It takes the Figtree font from
`assets/fonts/`. Moved anywhere else, it still works, in the computer's own
font.

## Before a client sees it

- Compliance signs off the footer and any advice wording: the gap section,
  the next step, and anything Damian types in. A comment in each file says so.
  The footer cannot be edited in the browser.
- The sample's banner says "Sample. Made-up names and figures." No real
  client sits behind it, so it does not say "changed".

## Figures to check after each Budget

| Figure | Now | From |
|---|---|---|
| State Pension (Contributory), maximum personal rate | €15,564 a year (€299.30 a week x 52), 2026 | `assets/js/state-pension.js` |
| A modest life for one person | €19,200 a year, 2024 prices | Pensions Council, Irish Retirement Living Standards; `assets/js/living-standards.js` |
| The gap | €3,636 a year, €303 a month | the two above |

If one changes, change both pages: the sentence, the bar labels, the
`aria-label` on the bars, and the teal bar's width in the CSS (State Pension
divided by a modest life, now 81.06%). Then make the picture again.

## Making the picture again

Open the sample in headless Chromium (Playwright). Screenshot the `.sheet`
element on a white page with no shadow, at device scale 900 / 793.7 (the
sheet is 210 mm, 793.7 CSS px), so it comes out 900 px wide. Then, in Pillow:
the PNG quantised to 256 colours (median cut, no dither, optimised), and the
WebP lossless.
