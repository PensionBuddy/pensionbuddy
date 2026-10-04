# Interactive proposals (Run 42)

Run 42, 3 October 2026. Item 2 of the brief: keep every interactive and
moving part, and list where a section that stands still today could teach
its figure better by being moved, dragged or revealed. **This is a list
only. Nothing here has been built.** Each row names the page and section,
the figure it would teach, what the reader would do, and how big a job it
is.

Effort: **S** is a small change, in one or two files, with no new
figure. **M** is a bigger one, usually because it reworks a calculator's
own script or changes compliance-reviewed words. Whatever its size, a
change on a protected page also needs the render-diff proof. The
protected pages are the six the render-diff harness covers
(`tests/render-diff/pages.js`): the pension
calculator, the director calculator, the auto-enrolment comparison, the
State Pension reality check, the entitlement check and the PIA page.

Every file and line was checked against the branch after item 1, which
rebuilt the home page's hero (so the home page's line numbers are not
main's). Later items in this run moved lines on index.html, starter.html
and the two calculators; find each place by the id or text quoted beside
its line number. The calculators' line numbers below are as they stand at
the end of this run; the home and starter pages' are as they stood after
item 1 (starter's are one line short since item 4).

**Run 43 (4 October 2026).** Damian's brief: "build the S-effort items.
Same motion rules." Built (STATUS, Run 43, item 4): ranks 7, 2, 4 and 1
(`bcdea74`), 3 and 14 (`ad48b21`), 6, 15 and 9 (`b801ad0`). Adapted: 1
is one red area for your plan only, with no right-edge labels (the
figure is in the table, the summary and the spoken label); 2 and 4 are
slate, not red (an excess and a lump sum's bands are not money missing;
4 is three patterns, not three strengths); 3 shows its line after the
caveat, so nothing comes between the figures and their caveat; 9 carries
the comparison's reviewed caveat shortened by one clause, always shown; 14 picks the relief steps
only (18, 30, 40, 50, 55, 60), so 62 reads "40% From 60". 6 and 15 as
proposed. Not built: 13 (waits for Budget day, 6 October, with
`docs/PIA-BUDGET-DAY.md`) and 16 (question 19: the cookie bar over the
slider is accepted). Waiting: the M proposals 5, 8, 10, 11 and 12, their
words to the compliance pack first; no line for 12 (question 3). The
questions at the end were answered by default (STATUS, Run 42,
"Decisions, 4 October 2026"). The Run 43 column below marks each row.

## The rules every row keeps

- A figure changes only because the reader moved a control.
- The markup carries the finished default, so the page reads the same with
  JavaScript off, with reduced motion and in print.
- No reveal animation on text, figures or caveats. The only motion is a bar
  following a control with no easing, or a highlight that changes colour
  only.
- Any new control on a calculator gets an id, so the share link
  (`pb-share`) carries it.
- A protected page proves itself with the render-diff: the default load is
  identical, and only the new cell differs.

## The proposals, ranked by how much each teaches

| Rank | Page, section | The figure it teaches | The interaction | Effort | Run 43 |
|---|---|---|---|---|---|
| 1 | pension-fees-calculator, "How your pot could grow, three ways" (`tools/fees-parts/main.html:38-40`, the chart `#feeChart` at 40) | "What they cost you by retirement" (`#costA`, €58,754 at the defaults, `main.html:56`) | Shade the area between the no-charge line and your plan's line in red (the other plan's in a lighter red), with the two cost figures labelled at the right edge. The shading follows the sliders as the lines do; the chart's `role="img"` label is extended to say so | S | built, adapted (`bcdea74`) |
| 2 | standard-fund-threshold, the result and "The threshold, year by year" (`tools/sft-parts/main.html:21-39`) | The share you would use (75%) and the excess over the threshold | One limit bar: the year's threshold as the full width, your total as the fill, the part over the line in red with `#sftOverText`'s figure beside it. Driven by `#total` and `#year` | S | built, adapted (`bcdea74`) |
| 3 | index.html, the gap chart in the hero (`index.html:2554-2570`; the source line `.pb-src` at 2570) | Where each figure comes from: Royal London Ireland 2026 for €40,860; €299.30 × 52 for €15,564; the subtraction for €25,296 | Each printed figure becomes a button (`aria-pressed`); the pressed one shows its source line under the chart, below the existing "Royal London Ireland, 2026.", which always stays. This is the half of `docs/INTERACTIVE-AUDIT-2.md` #6 (Stripe's clickable figures) left out when the slider was built. Two things to settle when it is built: the chart is one `role="img"` today, and buttons inside an image are hidden from screen readers, so the wrapper becomes a labelled group; and once the slider has moved, the need figure is the reader's own, so its source line says so | S | built, adapted (`ad48b21`) |
| 4 | standard-fund-threshold, "Tax on the lump sum" (`tools/sft-parts/main.html:53-56`) | €200,000 tax-free, the next €300,000 at 20%, the rest taxed as income | One stacked bar under the table, its slices sized from `#lump`, the taxed slices red, each labelled in euro. The table stays as the readable form | S | built, adapted (`bcdea74`) |
| 5 | state-pension-reality-check, "Against what retirement costs" (`tools/state-pension-parts/main.html:112-115`) | What the State Pension leaves you to find, for each standard of living | Draw the uncovered rest of each standard's bar as a red segment, sized by the `covered` share that `tools/state-pension-parts/page.js:88-91` already works out, and labelled by the sentence under each bar (`.lsgap`) that already says it | M (page.js; render-diff) | waits (M) |
| 6 | starter.html, the relief ladder (`starter.html:2670-2680`); director.html's ladder (`director.html:2318-2327`) | "Tax relief is there at any age" (starter); the personal limit by age (director) | One "Your age" slider (18 to 70) above each ladder, named by `data-pb-age` on the `.pb-lad`. The page loads `assets/js/pension-tax-relief.js` and `assets/js/pb-ladder.js` (neither page loads them today). pb-ladder.js gets a small change so that an age slider on its own marks "You" on the reader's row and skips the euro line: today it marks nothing unless `data-pb-earn` and a `.pb-lad-out` are there too (`assets/js/pb-ladder.js:28-31`). No new figure appears | S (pb-ladder.js and two script tags; both ladders are subtraction-audit cut candidates, starter 6 and director 2) | built (`b801ad0`) |
| 7 | my-pensions, the summary line `#ptCharges` (`tools/pots-parts/main.html:30`, written by `tools/pots-parts/page.js:108`) | The yearly charges in euro | page.js wraps the euro figure in a `<b>` so the charges can be red, as this run's colour rule (item 4) says charges eating the pot are | S (page.js) | built (`bcdea74`) |
| 8 | state-pension-reality-check, the living-standard bars (`#lsRows`, `tools/state-pension-parts/main.html:115`) | What the State Pension covers of a couple's costs (the page says today that couple figures are not shown, `main.html:170`) | A Single / Couple pair of buttons above `#lsRows`. Couple draws the bars against `PBLivingStandards.standard(level,'couple')` with two State Pensions at the maximum, as the home page's way-of-life picker already does (`index.html:3084-3092`). Single stays the default in the markup | M (protected; compliance saw the caveat wording) | waits (M) |
| 9 | starter.html, auto-enrolment (`starter.html:2683-2709`; its dated list "Once you are enrolled: what happens when." at 2711-2723) | The rates rise 1.5 / 1.5 / 0.5 now, then 3 / 3 / 1, 4.5 / 4.5 / 1.5 and 6 / 6 / 2, always 3 : 3 : 1 | A four-step picker ("2026 to 2028", "2029 to 2031", "2032 to 2034", "2035 on") above `#aeSalary` (2690), repainting `#aeYou`, `#aeEmp` and `#aeState` (2696-2706) from `PBCompare.AE_PHASES` (`assets/js/autoenrolment.js:37`), at the reader's own salary | S (waits on subtraction audit question 18) | built, adapted (`b801ad0`) |
| 10 | broker-vs-autoenrolment, beside `#capCard` (`tools/compare-parts/main.html:109`) | Who auto-enrolment reaches: employees aged 23 to 59, earning €20,000 or more, not in a pension through payroll | One sentence written from the existing `#age` and `#salary`: "At 35 on €50,000 you would be enrolled", or "…so not enrolled", with the starter page's source line (`starter.html:2722`) | M (protected) | waits (M) |
| 11 | pension-calculator, the growth chart (`#chart`, `pension-calculator.html:2557`) | The cost of waiting (`#waitOut`, 2550) | A red "€X less" tick at the retirement year on the chart | M (the page's inline script; render-diff) | waits (M) |
| 12 | director-calculator, under `#pbSay` (`director-calculator.html:2656`) | A quarter of the pot, and how it would be taxed: the first €200,000 tax-free, the next €300,000 (up to €500,000) at 20% | One line written from `#potOut` and the threshold module's limits. The wording must say "under the 25% route", because directors can also take the salary-and-service route (`director-calculator.html:2748` states the 25%) | M (protected; a question below) | waits (M); no line (Q3) |
| 13 | pia.html, "What each could leave you after 10 years, after its tax" (`tools/pia-parts/main.html:154-158`) | The three outcomes on one scale | Three horizontal bars under the headline figures, on one scale; the PIA bar outlined until a rate and a threshold are typed | S (protected, so the render-diff too; after Budget day, 6 October, once `docs/PIA-BUDGET-DAY.md` is done) | not built: waits for Budget day |
| 14 | index.html, "What changes, and when." at phone width (`index.html:2734-2758`) | The relief band for the reader's age, and the ages 50, 60, 61, 66 and 71 | At phone widths only, an age slider above the list: the step for that age takes `.pb-on` (as `assets/js/pb-timeline.js` already does on a wide screen) and a one-line card shows its `data-show` figure | S (the timeline is a subtraction-audit cut candidate) | built, adapted (`ad48b21`) |
| 15 | pensions-over-50, "Catching up" (`pensions-over-50.html:2062`); self-employed-pensions, "Tax relief" (`self-employed-pensions.html:2071`) | 30%, 35% and 40% at 50, 55 and 60 | The starter page's `.pb-lad` ladder, with an age slider, after the paragraph that states the bands (neither guide has a ladder today). The same pb-ladder.js change and the same two script tags as rank 6 apply, and each guide takes the ladder's CSS from starter.html, since neither has it today | S (costs about half a screen on guides the rubric measures by length) | built (`b801ad0`) |
| 16 | index.html, the hero at phone widths (`#pbNeedCtl`, `index.html:2571`) | The slider that the cookie bar hides on a first visit | Draw the slider above the chart below 921px wide, with CSS `order` inside `.pb-hero-chart` made a flex column. No change to the markup; nothing in that column before it can take focus. Measured on this branch at 375 x 812, first visit: the slider is at 724-811 and the cookie bar at 716-812; the heading, the figure, the chart (444-679) and its source (689-712) are clear of it. With the slider drawn first, measured the same way: slider 444-532, chart 544-778, source 788-811. The cookie bar (716-812) would then cover the foot of the chart, its two labels and the source line instead of the slider | S (what is seen would then differ from the reading order; a question below) | not built (Q19) |

## Skipped, and why

- **Already built:** everything in `docs/INTERACTIVE-AUDIT-2.md` #1 to #34
  except #2, #9 and #12; and parts 1a to 3b, 4d-e, 6b, 9a, 14a and 14c,
  and 15a-b of `docs/UX-MOTION-AUDIT.md`.
- **Rejected by the motion audit** (its "Not recommended" list):
  scrubbing a bar or chart with the scroll, count-ups, magnetic buttons,
  cross-document page transitions, a Buddy who reacts to figures,
  scroll-played video, mid-scroll pop-ups, a live gap card in the hero at
  375, and anything that moves by itself.
- **Larger than M:** the home hero scene, and 9c (the display tween).
- **Waiting on your answers already:** motion audit 12a, 12b, 4c, 9b, 11a
  to 11d, 13a-b, 14b, 1b and 1d, 5a-b; audit 2's #9 (costs card) and #12
  (memory across pages).
- **Static is right:** "79% feel unprepared.", the director figures 57% and
  68%, the FAQ answers, the legal pages.
- **Needs a figure the site does not have:** audit 2's N1, N3, N5, N7, and
  N9 to N13.
- **Colour, not interaction:** a red left border on the calculators'
  threshold note `.sft-note` (`#sftNote`, pension-calculator.html:2547 and
  director-calculator.html:2663), and on the threshold page's "Over the
  threshold" card `#sftOver` (`tools/sft-parts/main.html:42-46`), S each.
  They are colour proposals, put to you with the Run 42 colour questions.
- **`#taxOut` in amber** on the director calculator's dark panel: also a
  colour proposal, put to you with the Run 42 colour questions.

## Questions for you

1. Proposals 5, 8, 10 and 12 change protected pages whose words compliance
   has reviewed. May they be queued for a later run, with the new lines
   going into the compliance pack first?
2. Proposals 6, 9, 14 and 15 sit on blocks the subtraction audit lists
   as cuts (both ladders in 6: starter row 6 and director row 2, each
   pointing at the other), or on guides it wants shorter. Should they wait
   until you have answered that audit?
3. Proposal 12 holds only for the 25% route; directors can also take the
   salary-and-service route. Do you want that line at all, and if so in
   what words?
4. Proposal 16: on a first visit at 375, the cookie bar covers the hero's
   slider until the reader chooses. Live with it, or draw the slider above
   the chart on phones (a small CSS change; what is seen would then differ
   from the reading order, and on a first visit the cookie bar would cover
   the chart's labels and its source line instead of the slider)?
