# PensionBuddy — Fix Status

Tracks every code in `docs/ISSUES.md`. Verified with `python3 tools/verify.py`
(headless Chrome audit at 375 / 1360 / 1440px + full-page screenshots in
`verify-out/shots/`). Run-1 baseline before any fix: **26 FAIL** across 12 pages.

---

# Run 19 — 2026-09-22/23 · Overnight build of the interactive audit

Damian's overnight brief. Branch `claude/interactive-audit-2-efbbbb`, pushed as
`origin/claude/interactive-audit-2`. Not merged: Damian reviews first. Built
one item at a time in the order the brief gives, each gated, render-diffed if
protected, committed and pushed before the next. An item that fails its gate
twice is reverted and logged here. The audit itself is
`docs/INTERACTIVE-AUDIT-2.md`.

**RESUME FROM:** the first row below marked "not reached". Every row marked
"done" is committed and pushed.

## Fixes

| Fix | Result | Commit |
|---|---|---|
| "roughly €15,000" → €15,564 (pension calculator assumptions, jargon bank) | Done | `f939b6a` |
| Buddy's Run "floor" → "qualifying minimum" | Done | `f939b6a` |
| PRSI rate | **Report only. 4% is out of date.** Department of Social Protection, *PRSI Contribution Rates and User Guide 2026* (SW14, January 2026): Class A employee and Class S both "4.2% until 30 September 2026 (4.35% from 1 October 2026)"; for 2026 self-employed income the blended rate is 4.2375%. The director calculator's "up to 52% (40% income tax, 8% USC, 4% PRSI)" and its 48c-in-the-pocket split both rest on 4%. Calculator maths not changed. #21 therefore not built; #25 skipped for the same reason (see below). | — |
| CSO coverage | **Report only. Newer release exists.** CSO *Pension Coverage 2025*, released 17 April 2026, Q3 2025: 68% of employees and 57% of the self-employed and/or assisting relatives have pension cover. director.html still cites Q3 2021 (67.4% / 54.6%). Check the definitions match before swapping. | — |

## Build list

| # | Item | Result | Commit |
|---|---|---|---|
| 3 | Regulatory lockup | done: regulator line and name as one type-only mark under the hero call to action, four pages, linked to the register | |
| 4 | Result sentence | done: the headline figures as one plain sentence under them on the pension, director and reality check pages, written from the same final values and veiled with them | |
| 15 | Success motion | done: the success tick draws itself once (300ms, ease-out) on the guide, calculator email and booking confirmations and beside thank-you's heading; focus lands on each confirmation; drawn and still under reduced motion | |
| 5 | Mobile booking bar | done: below 921px on home, starter, director, tracker and glossary, a closable "Book a call with Damian for free" bar shows once the hero is gone and tucks away at the closing band; Ask Buddy lifts above it; it stands aside while the cookie bar or the Ask Buddy panel is up; closed stays closed for the session, Back included | |
| 1 | Results peek bar | done: peek bar on the five calculators below 921px, mirroring the headline cells; figure-free while the guess veil is up | |
| 14 | 3 : 3 : 1 split | done: salary slider, three bars in a year at this year's rates from PBCompare.autoEnrolment; the ratio note | |
| 8 | Transition glide | **skipped** (fail-once rule): verify.py flagged the visually-hidden "Your year:" marker text at 1.1:1 contrast on its teal dot; reverted. A one-line colour fix away; render-diff had proved only the new #pbGlideY cells differ | — |
| 7 | Relief limit ladder | not reached | |
| 11 | State Pension on top of monthly income | not reached | |
| 6 | Gap band drag | not reached | |
| 2 | Relief widget | not reached | |
| 10 | TCA capped part | not reached | |
| 19 | Phase staircase | not reached | |
| 16 | 20% → 40% marker | not reached | |
| 22 | Glossary index + entitlement jump row | not reached | |
| 23 | Drawdown mini calc | not reached | |
| 25 | €1,000 profit toggle | **skipped**: it draws the director calculator's 52% / 48c, which rests on the 4% PRSI the check found out of date; building it would repeat a stale figure on a second page | — |
| 24 | Buddy's facts links | not reached | |
| 13 | Product band tabs | not reached | |
| 20 | Screenshot arrows | not reached | |
| 27 | "Before 6 April?" control | not reached | |
| 26 | Two-tone headlines | not reached | |
| 28 | Footer wordmark | not reached | |
| 18 | Mess to order | not reached | |
| 29 | Show the workings (Mercury) | not reached | |
| 30 | Share results (Mercury) | not reached | |
| 31 | Closing fork (Mercury) | not reached | |
| 32 | Calculators dropdown (Mercury) | not reached | |
| 33 | Colour fade between bands (Mercury) | not reached | |
| 34 | Static grain on dark bands (Mercury) | not reached | |
| 21 | 52% as three segments | **not built**: the PRSI check did not confirm 4% | — |
| 17 | Scrollytelling | not reached | |
| — | Re-shoot product rasters after the calculator changes | not reached | |

## Held, not built

#12 (cross-page memory: privacy notice wording drafted only), #9 (costs
card: wording drafted only, from the Terms of Business), every N item (N9
and N11 dropped entirely). The home hero's "30 years" is untouched; the repo
says it is Damian's: "Damian has spent 30 years advising people on pensions"
(index.html `#story`) and "I've spent thirty years…" (`#damian`).

## New copy needing Damian's sign-off

Every new user-facing string this run adds is listed here by item.

- #3: the register link's accessible name (read by screen readers, not shown): "Regulated by the Central Bank of Ireland: check the Central Bank's register at registers.centralbank.ie". Nothing else in the lockup is new wording: "Regulated by the Central Bank of Ireland", "Damian Condon, QFA" and each page's own "30 years looking after Irish savers" / "30 years in financial services" are the existing strings, rearranged. The link itself is new: the site only ever named registers.centralbank.ie as text, so there was no existing href to reuse; it goes to https://registers.centralbank.ie/ in the same tab with rel="noopener", like the site's other outside links.
- #4 (pension calculator, under the two headline figures): "At [age], with [own + employer contribution] a month going in and [pot so far] saved already, your pot could reach [projected pot] by [retirement age]: an income of about [income] a month." At the defaults: "At 40, with €450 a month going in and €50,000 saved already, your pot could reach €460,066 by 66: an income of about €1,534 a month." The brief's wording was "…by [retirement age]: about [income] a month"; "an income of" was added so the monthly figure cannot be read as the pot, and it echoes the cell's label "Estimated income, per month".
- #4 (pension calculator, edge wording): with no monthly contribution the middle reads "with nothing going in each month and [pot] saved already"; with nothing saved, "with [contribution] a month going in and nothing saved yet"; with neither, the whole sentence is "At [age], with nothing saved yet and nothing going in each month, there is no pot to grow by [retirement age]."
- #4 (director calculator, under the pot and the corporation tax figure): "With [company contribution] a year from the company, from [age] to [retirement age], your pot could reach [projected pot], and the company could save [corporation tax relief] in corporation tax." At the defaults: "With €40,000 a year from the company, from 48 to 66, your pot could reach €1,511,849, and the company could save €90,000 in corporation tax." The brief said "your pension could reach"; "pot" was kept to match the cell's label "Projected pot at retirement" and the pension calculator's sentence, so a lump sum is never read as a yearly pension.
- #4 (director calculator, edge wording): with no company contribution, "With no company contribution, from [age] to [retirement age], your pot could reach [projected pot], and there is no corporation tax to save."; with no contribution and nothing built up, "With no company contribution and nothing built up so far, there is no pot to grow from [age] to [retirement age], and no corporation tax to save."
- #4 (State Pension reality check, under the weekly and yearly figures): "On [N] reckonable contributions, [N/52] years, this shows €[weekly] a week, €[annual] a year, which covers [x]% of a modest standard of living." At the default: "On 2,080 reckonable contributions, 40 years, this shows €299.30 a week, €15,564 a year, which covers 81% of a modest standard of living." The share is the Modest bar's own "The State Pension covers 81%". Below 520 the sentence is hidden with the eligible panel, so "No entitlement" speaks alone; there is no below-520 wording.
- #15: no new wording. The ticks are decorative (aria-hidden) and each confirmation keeps its existing text; what changes is that focus now lands on it, and the booking one (#qualDone) is now a status region.
- #5: "Close", the accessible name of the booking bar's close button (read by screen readers, not shown; the button shows a drawn ×). The Ask Buddy panel's close button already uses the same name; the bar stands aside while that panel is open, so the two are never on screen together. The bar's link text, "Book a call with Damian for free", is the nav's and Ask Buddy's existing wording, byte for byte; nothing else in the bar is text.
- #1: "Jump to your results", the peek bar's accessible name; labels are the pages' own, one shortened: "Income, per month" (from "Estimated income, per month"). While the veil is up the bar shows pb-guess's own title, "Take a guess first".
- #14: "Your gross salary", "You pay in", "Your employer adds", "The State adds" are the comparison page's own labels; new: "A year, at the [2026 to 2028] rates: [1.5% of salary each from you and your employer, and 0.5% from the State], on salary up to €80,000. Whatever the rates, the ratio is always 3 to 3 to 1." (the bracketed parts come from the module).

---

# Run 18 — 2026-09-22 · The new logo pack, and the flagged advice lines cut

Damian's second brief of the day, in two halves. Branch
`claude/pensionbuddy-4-fixes-cbb679`. The calculator disclaimers stayed locked
and are byte-identical, checked per file against the pre-session baseline
rather than by a grep whose traversal order is not stable.

## What the brief assumed, and what was actually here

Five premises in the brief did not match the repository, two of them the steps
it named as riskiest. Worth recording, because the same assumptions will be
made again by anyone reading the pack's README:

| Assumed | Actually |
|---|---|
| `brand/` already unzipped | Still a zip in Downloads. Extracted here. |
| Replace `assets/paw.svg` | **No SVG files exist in this repository at all.** The paw is inline markup, 41 times over. |
| `assets/logo-mark.svg` viewBox 34 → 180 | There is no such file and no 34-unit viewBox. The 34 is a CSS pixel size: `.logo-mark{width:34px;height:34px}` in 34 rules plus 16 `nav.scrolled` ones. |
| `--teal-700` is `#08453E` | It is `#08655A`. Left untouched either way. |
| Repoint the `og:image` | There was no `og:image` on any of the eighteen pages. Created, not repointed. |

Two further findings: the mark was already painted `--aqua` `#16C9B0`, one
shade off the pack's `#14CBB1`; and 92% of every SVG in the pack is a C2PA
content-credential blob (`pensionbuddy-paw.svg` is 8,410 bytes of which 636 is
artwork).

## A — the logo

| Item | Status | Note |
|---|---|---|
| Pack in `assets/brand` | **Done** | Six SVGs stripped of `<metadata>` and the c2pa namespace, 58,745 bytes to 12,101, every viewBox asserted intact by parsing rather than by eye. `PensionbuddyLogo.jsx` copied for reference and unused: no build step, no React. |
| Schibsted Grotesk 800 | **Done, 18 pages** | One weight only. Inter's own request untouched in both its variants. The first check of it was wrong, not the change: a declared webfont is not fetched until something uses it, so `document.fonts.check` read false. Forced with `document.fonts.load`: passes, and "Pensionbuddy" measures 518.45px against 436.22 for a missing face and 516.06 for Inter. |
| The fanned paw | **Done, all 41** | Five variants, differing in `aria-hidden`, in per-shape `fill="#fff"` (36), `fill` on the `<svg>` (4, one single-quoted) and no fill at all (1, painted by CSS). Each kept its own mechanism; only the viewBox and shapes changed. |
| No layout shift | **Measured** | Header logo, footer logo, letterhead and the decorative panel crop to identical pixel dimensions before and after: 408×140, 677×140, 1124×174, 2200×1112. |
| The lockup | **Done, 18 pages** | The pack's recipe on the existing `.logo` / `.logo-mark` hooks, everything derived from `--pb-logo-h`. H is **34px**, what the mark already measured, so the nav does not move, and above the pack's 28px floor. Jargon Battle's narrow-screen rule now shrinks H to exactly that floor instead of shrinking the wordmark alone. |
| Why not `.pb-lockup` | **Deliberate** | A dozen other rules already address those two elements — scrolled-nav size, three border-radius passes, the brand background, footer spacing — across eighteen separate copies of the stylesheet. Renaming would strand every one of them eighteen times. The recipe is the pack's; the hooks are this site's. |
| A7, no colour moved | **Proved** | `--teal`, `--teal-700`, `--aqua`, `--ink`, `--teal-bright` all byte-identical. Ten button and link selectors compared before and after: none changed. One appeared to — `footer a` — and that selector's first match is the footer logo anchor itself; every non-logo footer link keeps both its exact colours, `rgb(84,99,95)` and `rgb(8,101,90)`. `--pb-teal` and `--pb-ink` are local to `.logo`. |
| Favicon and og:image | **Done** | SVG first, then 32px and 192px PNGs and a 180px apple-touch icon, rasterised from the mark by headless Chrome and each asserted for exact size and a quarter-area of opaque pixels. `og:image` created on all eighteen pages at an absolute `https://pensionbuddy.ie/...`, the domain taken from this repository's own sitemap and robots.txt. Card type is `summary`, so a square 512px mark is the right shape. |

## B — the flagged lines, now cut

All four were on run 17's flagged list. Damian's call on the third was to take
all three copies, not the two the brief named.

| Line | Where | Now |
|---|---|---|
| "Buddy sticks to the facts. What any of it means for you is a conversation…" | `games/buddys-run.html` game-over | Gone. The booking button stays, relabelled. Nothing dangles: what precedes it is a button, not prose. `.cta-lead` styled nothing else and its three rules went too. |
| "Buddy gives you the facts; the free call is where the advice happens." | `glossary.html` arcade intro | "Pick a game." No booking link exists in that section to relabel. |
| "A game, and general information. Nothing here is personal financial advice." | **three** copies: `buddys-run` start **and** game-over, `jargon-battle` | All gone. `.fine` and `.note` styled nothing else and went with them. Regulatory-flavoured copy, removed on instruction rather than judgement. |
| "Buddy shares general information… that's a job for Damian." | Ask Buddy footer, all 16 pages | Gone. The button under it now carries the whole message. `.pb-b-foot .d` went too. |

**CTA wording is now split, deliberately and temporarily.** Both games and the
Ask Buddy footer say "Book a call with Damian for free". The hero chat still
says "Book a call with Damian to learn more" — left alone on instruction. The
nav's own "Book a free call" is a third control the brief did not name. Three
booking calls to action, two wordings, worth settling in one pass.

`tests/games.test.py:834` gates both games on the exact agreed button words and
caught the first version of that change, which relabelled one page and not the
other. The gate now names the new words.

**Verified:** `run-tests.py` all suites pass · `build.test.py` 69 · 
`games.test.py` 157 · `verify.py` 18 pages at 375 / 1360 / 1440, **0 FAIL**,
1 WARN (terms.html A1, the pre-existing placeholder) · `stamp-images.py
--check` and `sync-chrome.py --check` clean · the three `pagebuild.py` pages
regenerate byte-identically.

**Still open from run 17:** `tests/runner.test.py` is red at `d71c1b9` and was
not touched here.

# Run 17 — 2026-09-22 · Four fixes: the slider thumb, a photo, the advice turn, the chat on scroll

Damian's brief, four items. Branch `claude/pensionbuddy-4-fixes-cbb679`. The
calculator disclaimers were locked and are byte-identical: the md5 over the
whole set of "the value of investments can fall as well as rise" lines is the
same before and after.

| Item | Status | Note |
|---|---|---|
| Slider thumb, off-centre | **Fixed, sitewide** | Chrome lays `::-webkit-slider-thumb` against the TOP of `::-webkit-slider-runnable-track`, so the 28px thumb on the 6px track hung `(28-6)/2 = 11px` below the line. There was no `margin-top` anywhere: the hack was never there to be lost, which is why this is a different bug from Run 8 (fill boundary, horizontal) and Run 9 (two-tone track flattened by a later colour pass). Measured in both engines by repainting thumb and track in flat colours that touch no geometry property and reading the two centres out of the pixels: **Chrome +11.00px in 102 of 102 measurements** (6 calculator pages × every slider × 0/50/100%), no variance; **Firefox 0.00px in 81 of 81**. After: **0.00px in all 102 and all 81**. |
| The value, written as its formula | **Done** | `margin-top:calc((6px - 28px) / 2)`, not `-11px`, so the two numbers it depends on sit beside it. The offset does not depend on the input's own height — which is not uniform: `.field input{min-height:52px}` beats the 48px rule for most sliders, the rest stay 48px, and both measure the same 11px. |
| Firefox | **Correctly left alone** | `::-moz-range-thumb` is centred on the track by Firefox itself. A `margin-top` copied onto it would push it off by exactly the amount this removes. There was none to remove; checked across every thumb rule on every page. |
| Where it had to go | **All 16 pages** | The block was byte-identical in all sixteen, which is the likeliest reason earlier slider work did not stick everywhere. **Recommendation, deliberately not done: this stylesheet is duplicated sixteen ways with no shared file.** Consolidating it is a refactor of its own and was not smuggled into a bug fix. |
| Off-duty photo | **Removed** | `strip-rocky-head-tilt`, "Buddy tilting his head at the camera indoors": the figure, its aria-hidden marquee clone, both asset files and its entry in `tools/prepare-photos.py`. Eight photos remain, real and clone counts equal at 8 and 8, which is what `pbMarquee`'s `translateX(-50%)` over a `width:max-content` track needs. No reference survives anywhere. |
| The advice turn | **Cut** | "Can Buddy tell me what I should do?" / "That would be advice, and Buddy sticks to general information…" gone from the hero chat on index, starter, director and tracker, and from the Ask Buddy question bank on all sixteen pages. The chat now closes on a plain line, "Book a call with Damian to learn more" → `booking.html`. Nothing is orphaned: the widget's footer already carried both halves of what the deleted answer said, and the bank is built from the page's own FAQ before that entry was appended. |
| The comment that described it | **Rewritten** | The hero CSS comment on all four chat pages said the closing turn was the one that says Buddy never advises. It no longer exists, so the comment no longer claims it does. |
| Close variants | **Flagged, not removed — needs Damian** | `games/buddys-run.html` "Buddy sticks to the facts. What any of it means for you is a conversation" (the lead-in to that game's booking button); `glossary.html` "Buddy gives you the facts; the free call is where the advice happens"; the Ask Buddy widget's own standing labels on all 16 pages ("Quick answers. General info only — never advice." and "Buddy shares general information. For advice about your own situation, that's a job for Damian."); and the two games' "A game, and general information. Nothing here is personal financial advice." Each is either a sentence that breaks when cut, or a page's only information-not-advice statement. |
| Chat plays on scroll | **Built** | Each message arrives as the reader reaches it and un-arrives on the way back up. IntersectionObserver only. Its own class and observer, deliberately not `.reveal`: that one `unobserve`s on first sight and force-reveals everything at 900ms. The gate hangs off a class the script sets on `<html>`, so with no JS every bubble is simply visible; under reduced motion the class is never set, which is also what makes `verify.py`'s screenshot pass deterministic, since it forces `prefers-reduced-motion`. |
| Two bugs the testing found | **Fixed** | The gate was first a `.pb-said` rule competing with the directional ones — `.msg.them` is four classes and `.pb-said` three, so a sent bubble stayed pinned at its offset forever; the gate is now on `:not(.pb-said)` and no specificity race is possible. And the first safety net revealed the chat whenever it was visible and unplayed, which is the normal state of a chat still below the line: it fired before the reader scrolled and was exactly the fire-once-on-load behaviour the brief rejects. The net now waits on the observer never having reported at all. |
| How the animation was proved | **Real frames, not virtual time** | IntersectionObserver delivery is tied to the rendering lifecycle, and under `--virtual-time-budget` Chrome runs no frames, so the chat never plays and a run there proves nothing. Driven instead on real frames with a slow image holding the load event open. index.html down: `00000 → 11000 → 11100 → 11110 → 11111`; back up: `11110 → 11100 → 11000 → 00000`. In order, no gaps, symmetric. starter, director and tracker the same. |
| Pre-existing red, NOT from this run | **Needs a decision** | `tests/runner.test.py` already fails at `d71c1b9`, before any of this: that commit raised the compare gate 141 → 151 in `tests/run-tests.py:72` and left `tests/runner.test.py` pinning the old number at lines 155, 159 and 201. Proved by running it against a clean `git archive HEAD` tree: 73 passed, 4 failed. Not touched here — the suite really does make 151 assertions, so the fix is to update the three pinned strings, not to lower the gate. |

**Verified:** `tools/verify.py` 18 pages at 375 / 1360 / 1440 — **0 FAIL**, 1 WARN
(terms.html A1, the pre-existing NEEDS-DAMIAN-INPUT placeholder, unchanged from
baseline). `tests/run-tests.py` all suites pass. `tests/build.test.py` 69 pass.
`tests/games.test.py` 157 pass. `tools/stamp-images.py --check` and
`tools/sync-chrome.py --check` clean. The three `pagebuild.py` pages regenerate
byte-identically from the skeleton.

**No automated gate in this repo can see whether the slider thumb is centred** —
the node render-diff has no layout, `browser-diff.py` reads inline style only,
and nothing in `tests/` or `verify.py` asserts on computed slider style. The
proof is the pixel measurement above and the captures; a future regression here
will be silent again.

# Run 16 — 2026-09-19 · One case, one face, and the bands

Damian's brief, against full-page captures of Stripe, Plaid, Ramp, Revolut,
Mercury, Klarna and Lemonade: kill the caps-mono label system site-wide, add
what those sites have and this one did not (stat rows with no cards, full-bleed
colour breaks, the product itself on the page, a huge-type offering list, a
figure as a plain sentence, sentence-case buttons), and turn the two boxed
homepage figures into one visual of the gap. Calculator maths and the
disclaimers were locked and are byte-identical. Branch
`claude/remove-caps-mono-styling-8b6c42`.

| Item | Status | Note |
|---|---|---|
| Caps-mono system | **Gone, site-wide** | One script over all 16 root pages, both games and the three `tools/*-parts/page.css`, so every page got the identical edit and the `:root` token guard still holds: the IBM Plex Mono request, the `--font-num` and `--font-mono` tokens, every `text-transform:uppercase` and every positive `letter-spacing` removed; `var(--font-mono\|--font-num)` rewritten to `var(--font)`. Footer column heads, form labels, stat citations, chips, callout heads, step numbers, the countdown labels, "More options" and the phone's role tag are all sentence case in the body face at 600. Figures are the body face with `font-variant-numeric:tabular-nums`; the big marketing figures at 300, the way Plaid and Stripe set theirs; calculator readouts stay 600 because they are the product's live output. Google Fonts now requests `Inter:wght@300;400;500;700;800` and nothing else. |
| "Sora" | **Read as Inter, flagged** | The brief names Sora. Inter has been the one face since run 15 (`6b3ddeb`), and `tools/verify.py` fails any page that names or resolves Sora. The brief's own rule, "the SAME sans as body text", is satisfied by Inter. Switching the whole site to Sora is a one-line font change plus the guard, if that is what was meant; see NEEDS DAMIAN INPUT. |
| verify.py guard | **CASE** | A page now FAILS if any element renders `text-transform:uppercase`, with positive letter-spacing, or on a monospace family, or if `text-transform:uppercase` appears in source; IBM Plex Mono joined the dropped-family list. Footer `h4` labels are excluded from the heading recipe by `.closest('.foot-col')` rather than by face. Mutation-tested on a throwaway copy: an uppercase rule, a tracked rule and a monospace rule were each caught. `--shot-widths` added so screenshots can be taken at the brief's 375/1200/1440. |
| "One thing this does not show" and the other caveat boxes | **Boxes and headings deleted; sentences kept, then deleted on 2026-09-20 (see Decisions)** | The bordered `.waitcard` and its caps heading are gone from the reality check, and so are the three other caveat cards in that style: "Taken at 66" and "What may apply instead" on the entitlement check, "What may apply instead" on the reality check's no-entitlement panel. Each sentence stays as plain text under its result (`.pb-floor`). The floor sentence in particular has to: `page.js` writes `#spFloor` and `#spFloorLink`, `tests/page-probe.js` asserts that text at every spec row, and CONTEXT.md's rule is that a floor says which rule it leaves out. Deleting the sentences too is Damian's call, not mine. The skeleton's own `.waitcard` ("The cost of waiting") is a nudge with a live figure, not a caveat, and keeps its card with a sentence-case head. |
| Stat rows (2a) | **No cards anywhere** | `.pb-statrow` / `.pb-stat-n` (weight 300, line-height 1, tight tracking) / `.pb-stat-l` / `.pb-src` on every page; the old `.gapstats`, `.cover` and `.proofs` grids are borderless should any markup reach them again. director.html's boxed CSO figures are one row on a wash band with the source line beneath. |
| Full-bleed breaks (2b) | **3 to 4 per page** | Home: the gap wash, the dark product band, the deadline band, the closing band. Audience trio: the dark product band, the wash guide band, the closing band, and on director the wash stat band too. `.pb-bleed` runs a band edge to edge while its content keeps the `.wrap` measure. |
| The product on the page (2c) | **Real UI, photographed** | New `tools/shoot-product.py` renders the pension and director calculators in headless Chrome at 1200px at 2x, hides the chrome and the lead-capture, badge and boost rows, and crops the tool: `assets/img/product-pension-calculator` and `product-director-calculator` (.jpg + .webp). The homepage showcase card with made-up bars is gone; the calculator itself sits on the dark band and links to the tool. starter.html and director.html carry the same shots beside their existing copy; tracker.html, which has no calculator, carries the photo of Damian and Buddy. |
| Offering list (2d) | **Home, six items** | The three audience cards became `.pb-offer`: six links set at display size (Klarna's pattern), descriptions revealed on hover and on keyboard focus at 921px and up, always visible beneath the name below that, siblings fading to 38% on hover. Item copy is lifted from the cards, the calculator section and starter.html; the heading and one description are new (see below). |
| A figure as a sentence (2e) | **The 79%** | Beside the bars, as `.pb-plain`, with its source line: "79% of employees say they feel financially unprepared for retirement." |
| Buttons (2f) | **Already sentence case** | None used caps; the guard now keeps it that way. |
| The gap (Task 3) | **Two bars, counting** | `.pb-gap` on the wash: what adults expect to need (40,860, an ink bar at 100%) beside what the maximum State Pension pays (15,564, an aqua bar at 38.1%), the 25,296 shortfall drawn as an amber block from the top of the second bar to the height of the first, labelled "a year short". The bars grow and the figures count up once, when the band scrolls into view, with the calculators' display engine (each frame closes 16% of what is left); reduced motion gets the final state; the whole figure is one `role="img"` whose label carries the three figures and both captions, so the counting is never read out. Sources in small sentence-case grey underneath. Survey figures unchanged. Note: verify.py's screenshots catch the count mid-flight (a figure short of 40,860 in a capture is the tween, not the data). |
| Calculators | **Untouched, proved** | Only CSS and markup outside the script blocks changed on the five calculator pages. render-diff against HEAD: every page loads to the same render write for write; sweeps state-pension exhaustive 2,009 / pension-calculator 6,550 / director-calculator 1,513 / compare 150,576 / entitlement 223 states, all 0 differing, 0 reordered; sequences 16,000 compared, 0 differing. |
| Stray | **Noted, not changed** | The two hand-written calculators' chart axis labels name `Plus Jakarta Sans` inside the SVG text attributes, in the page script. Not mono, not loaded, falls back to sans; it sits inside the render-diff-protected script, so it is left for a calculator change. |

## Proof

- `python3 tools/verify.py --widths 375,1200,1440 --shot-widths 375,1200,1440`:
  **18 pages, 0 FAIL, 1 WARN** (terms.html A1, unchanged), **0 contrast
  pairs at any width**, no horizontal overflow. Identical to a baseline run on
  a pristine `git archive HEAD` tree before any edit: 0 new WCAG AA fails.
- `tests/build.test.py` 69 pass; `tests/run-tests.py` all suites pass;
  `tools/stamp-images.py --check` 0 stale; `tools/sync-chrome.py --check` 0
  behind; `tools/pagebuild.py` rebuild clean.
- render-diff as above: 160,871 states and 16,000 event-path comparisons, 0
  differing.
- A five-lens adversarial review (brief compliance, accessibility, copy and
  figures, calculator regression, robustness) over the three commits, each
  finding put to three skeptics. 22 findings; the account's session limit
  killed 30 of the 66 skeptic calls, so the findings whose panels did not
  finish were judged by hand. What it found, and what was done:

  | Finding | Done |
  |---|---|
  | Three more caveat boxes in the deleted card's style survived on the two State Pension pages ("Taken at 66", "What may apply instead" twice) and were not flagged. Confirmed 3 of 3. | Cards and heads removed; the sentences stayed as plain text under the result (`.pb-floor`), the way the floor sentence did, until Damian had all four deleted on 2026-09-20 (see Decisions). |
  | Inter 600 was declared everywhere (labels, buttons, footer heads) but never requested from Google Fonts, so browsers synthesised it from 500 or 700. Pre-existing for `.btn`, made general by the label recipe. | 600 added to the request on all 18 pages; every weight confirmed served (six faces each). |
  | Without JavaScript the gap visual was blank: bars at height 0 and "€0" in the markup until the script ran. | The markup now carries the finished chart (full bars, the real figures); the script arms the animation only when it will run it, and reduced motion or no observer leaves the markup as written. |
  | The home page's closing band put its content 24px from the viewport edge instead of on the page grid. | Same padding rule as the audience pages' bands. |
  | The offering list's hover fade dimmed the keyboard-focused item below AA; hovering one gap bar dimmed the other column's text to 2.3:1. | Focus-visible items are exempt from the fade; the gap columns no longer fade at all. |
  | The product screenshot link's accessible name was the 60-word alt plus the caption and the disclaimer. | The link is named "Open the pension calculator"; the alt is a sentence; the caption is a `figcaption` outside the link. |
  | About 110 lines of CSS on every page styled markup this change removed (`.aud-card`, `.calc-prev`, `.cbars`, `.gapstats`/`.gs-*`, `.cv-*`), with the old bordered stat rules sitting under the new borderless ones. | Removed from all 16 pages by one script (53 to 73 rules a page); only director's `.cover` wrapper keeps a rule, and it is borderless. |
  | `page.js` on the reality check still called the floor sentence "the caveat card" in four comments. | Comments corrected; render-diff re-run, 0 differing. |
  | verify.py's screenshots caught the count-up mid-flight, and the 9,000px cap cut the bottom off the home page. | Screenshots are taken with prefers-reduced-motion forced on, so every entry animation is captured settled; the cap is 16,000px. |
  | starter and director's product shots were not lazy-loaded; the buddy panel's close button rendered in the browser's default button face. | `loading="lazy"` on all three audience images; `button{font-family:inherit}` in the recipe. |
  | The CASE guard would fail a future `<pre>` or `<code>` on the browser's monospace default. | By design; said so in the guard's comment. Monospace is out of the project. |
  | The brief named Sora; the floor sentence survived the box. | Both already flagged: V4-1 and V4-2 below. |
  | The State Pension ratio (38.1%) lived in both the CSS and the markup. | The markup is the one place now (`--from`). |
  | Two full verify.py runs in a row died to a single stalled headless Chrome launch (one at an audit, one at a screenshot, different pages), each traceback losing the report for the seventeen pages that were fine. | `chrome()` retries a timed-out launch twice before giving up on that one page, and the audit waits at most eight seconds for `document.fonts.ready` rather than for ever. |

## Decisions, 2026-09-20

Damian closed V4-1 and V4-2 (table below). The caveat deletion was proved on
its own: `tools/verify.py` 18 pages at 375/1200/1440, **0 FAIL, 1 WARN**
(terms.html A1), 0 contrast pairs, 0 new fails against the baseline;
`tests/run-tests.py` all suites pass (the reality-check probe now makes 280
assertions, down from 300: the twenty that read the sentence are gone, the
module's `floorStatus` is still checked against every spec row);
`tests/build.test.py` 69 pass; stamp and chrome checks clean. render-diff at
load is no longer a clean comparison for the reality check, by design: the
previous commit's page script writes `#spFloor` and the page no longer has
one, so the baseline side throws (`TypeError: Cannot set properties of null`)
while the other three calculators still load identically. That is what a
deliberate behaviour change looks like to a refactor harness.

### 2026-09-20, later

- **V4-5 closed: deleted entirely.** The Method 2 floor paragraph on the
  entitlement check (`#mFloor`), the page-script line that showed it and the
  probe assertion that covered it are gone; CONTEXT.md's Floor entry and the
  entitlement spec's State B bullet carry the dated note. The probe makes 434
  assertions for that page now, down from 444. Neither State Pension page
  names a rule beside a result any more; both still list what they leave out
  in the assumptions below the tool.
- **The offering list.** Damian saw "Company directors" clipped at the bottom
  edge and the side description sitting off its item. The second reproduced
  in headless Chrome: with the description bottom-aligned, at 1024px it
  started above a one-line name and beside only the second line of a two-line
  one. The first did not reproduce in Chrome at 375, 768, 1024, 1280, 1440 or
  1920 (every name's glyph box measured inside its list item, the section's
  height equal to its scroll height), so it is treated as an engine
  difference and fixed for any engine: the names carry `line-height:1.06`
  with padding for the descenders, every ancestor down to the link declares
  `overflow:visible`, and the description centres on its item.
- The interactive audit (Damian's step 4) is a read-only workflow; its first
  run was killed by the account's session limit before any auditor finished
  and was relaunched. The list is delivered in the conversation, not built.

## NEEDS DAMIAN INPUT from this run

| Code | Where | What is needed |
|---|---|---|
| **V4-1** | **Closed 2026-09-20: Inter, no action.** | The brief says Sora; the site is on Inter and the guard drops Sora. Confirm Inter, or say Sora and the switch is the font request, the `--font` token and one line in verify.py. |
| **V4-2** | **Closed 2026-09-20: deleted entirely.** The four caveat sentences this run named are gone: the floor sentence and its link, from the page script that wrote them, the Non-Contributory note on both no-entitlement panels, and "Taken at 66" on the entitlement check. The reality check's age note, which pointed at "the note under the result", now reads "Used for this line only". One floor sentence remains, V4-5. `tests/page-probe.js` no longer asserts the wording (the module's `floorStatus` is still checked against the spec rows). CONTEXT.md's Floor entry and both CALC-SPEC files carry a dated note. Was: | The "One thing this does not show" box and heading are gone; the floor sentence stays as plain text because the page script writes it and the probe asserts it. Say if the sentence should go too. |
| **V4-5** | **Closed 2026-09-20: deleted entirely.** The paragraph, the page-script toggle that showed it and the probe assertion are gone; CONTEXT.md and the entitlement spec carry the dated note. Was: the paragraph `#mFloor`, shown by the page script whenever Method 2 applies and asserted by the probe, reads "On the details entered, the Method 2 figure is a floor. This page leaves out the Homemaker's Scheme and the Alternative Yearly Average, both of which can only raise it. It does not cover mixed-rate, EU or pro-rata records, and it does not check that you first paid PRSI before 56." Say if it should go too. |
| **V4-3** | **Closed 2026-09-20: Damian's copy applied.** Heading "Six places to begin."; description "What the State Pension leaves you to find."; captions "What people expect to need" / "What the State Pension pays"; "a year short"; source "Royal London Ireland, 2026."; "79% feel unprepared."; link "Open the calculator"; caption "Illustration only. Investments can fall as well as rise."; the bars' label and the product alt shortened to his wording. Item names unchanged. Was: | New copy to sign: the offering heading "Six places to begin. One of them is yours."; the item names "Company directors" and "Auto-enrolment comparison"; the reality-check line "What the State Pension actually leaves you to find, for a full record and for your own."; the bar captions "What adults in Ireland expect to need each year in retirement" and "What the maximum State Pension pays a year"; "a year short"; the product caption "The calculator, as it runs." |
| **V4-4** | **Closed 2026-09-20: Damian's copy applied.** Captions "Example figures." (starter, director) and "Damian and Buddy." (tracker); the three alts shortened to his wording. Was: | Captions "The pension calculator on this site, with example figures.", "The director calculator on this site, with example figures.", "Damian and Buddy in the Dublin hills." (the hill is named from the photo's filename; change the caption if it is elsewhere). |

# Run 15 — 2026-09-17 · Ruthless Standard v3: one face, one heading recipe, one hero

Damian's v3 standard, applied everywhere except `about.html` (which no longer
exists) and the `#damian` / `#adam` / `#buddy` / `#story` sections on the home
page. He added `#story` to that list when the audit pointed out it was the same
folded-in About content. Calculator maths and disclaimer text were locked and
are byte-identical.

Audited before anything was touched: 18 pages, 804 findings, reported and
approved by category before a single edit. Three decisions came back — replace
the hero card with the phone, keep the near-black body (the AAA palette lock
beats the standard's "muted grey", and `#0B1F1C` is not pure black so rule 2 is
satisfied either way), and lock `#story`.

| Item | Status | Note |
|---|---|---|
| Typography | **One face** | Inter at 400/500/700/800 replaces Fraunces, Hanken Grotesk and, on `broker-vs-autoenrolment` alone, Bricolage Grotesque. IBM Plex Mono is untouched on the numerals and the labels, as rule 2 says. Two `<link>` groups: the 15 pages that carry mono, and the two game pages that never did. Both hrefs checked against Google Fonts for a 200 and for exactly the four weights. |
| The dead 800 | **Found by measuring** | Every page declared its headings at 800 and every page rendered them at 600. The same selectors were declared twice at identical specificity, ~400 lines apart, and the later block won. Confirmed in headless Chrome on all 18 pages before any edit, not inferred from specificity. The duplicate block is gone; 800 is what ships. |
| One heading recipe | **Three fixed sizes** | 34/46/68 for h1 and 28/34/46 for h2 on the breakpoints the site already leans on (561, 921); h3 one size at 20. No fluid clamp. 88 bespoke per-section size, weight and leading declarations removed rather than left to fight the recipe. Every selector that used to carry its own headline size is named in it — a bare `h2` loses to any `.class h2`, which is what kept the first attempt leaking. Dense reference headings (glossary terms, legal subsections) take the recipe's smallest step rather than a number of their own. |
| Canvas fonts | **Caught** | Three `ctx.font` strings in the games are JS, not CSS variables, so a variable-only swap would have left them asking for a face the page no longer loads. Swapped with the rest. |
| FAQ | **One icon set** | Three treatments became one plus-that-turns-into-an-x: the FAQ `.pm`, the Ask Buddy panel's own unboxed plus, and the "More options" CSS chevron built from two borders. `.pm` had been restyled through six layers of one stylesheet; there is now a single owner and nothing above or below it restyles it. All three marks measured identical at runtime: 26×26, radius 8, same border, same colour, 20px Inter. |
| Hero | **One column, four pages** | `index`, `director`, `starter`, `tracker` — the only pages with `.hero-grid` markup. The five calculator pages use `.phead`, which rule 3 does not name and which was already single-column, so the hero work never touched a generated page or a render-diff page. Order is the standard's: headline, one line of subcopy, CTA, trust line, phone. Each lede lost the sentence that repeated what the CTA button already promises. |
| The phone | **Real Buddy chat** | A phone mockup did not exist anywhere on the site before this. Every word inside it is lifted verbatim from that page's own signed-off Ask Buddy answers, and the closing turn on all four is the one that says Buddy never advises and names the free call — so the mockup cannot claim anything the site does not already say. The home page's "Illustration only" line is kept verbatim beneath the phone, per Damian. The audience pages never carried one and none was invented for them. |
| Photos | **All kept** | Every photo of Damian, Adam and Buddy is untouched. The Buddy avatar is reused in the phone's title bar. |
| Writing | **22 contrast-pair headlines** | Applied only where the finding matched the file exactly, targeted a real headline rather than a mono label, and carried no instruction text. 30 proposals were skipped with the reason recorded. |
| Writing — reverted | **2, and 1 renamed back** | Two proposals leaked agent annotations into the markup (`" / <p>…</p>"` and `"(both facts on page: 1765, 1782)"`) and were caught by a scan of every new headline, not by reading them. Two more restated the paragraph directly beneath them, one hard-coding €299.30 and €19,200 into prose, which `CONTEXT.md` keeps in the specs and the modules. The jargon battle's `<h1>` went back to the game's name, which the glossary picker links to. |
| Writing — the three tax framings | **Held, then shipped on Damian's call** | `"Auto-enrolment gets no tax relief. A pension through a broker does."`, `"Your employer and the State pay into auto-enrolment. A personal pension pays you the tax relief instead."` and `"Profit can go to Revenue. Or it can go to your pension."` were reverted first and put to Damian rather than shipped on Claude's own call: each is accurate to its page's premise, and each is new regulated framing. He took all three. The first is grounded in the compare page's own body copy — *"Auto-enrolment contributions are deducted from net, after-tax pay and attract no marginal income tax relief"* — checked before it went in. The second made `starter.html`'s paragraph restate its own headline, so that paragraph lost the restatement and kept only what the headline does not say. |
| verify.py | **F2 inverted** | The check was keyed on the literal string `Fraunces` in eleven places. It now asserts the opposite: Inter requested and loaded, every display heading on it at 800, no dropped family named in source or resolving at runtime, and at most three heading sizes at a given width. That last clause caught four separate leaks during the run. Mono-faced `h4` footer labels are excluded by name rather than the expectation being loosened. |
| pagebuild.py | **One line** | `PAGES['compare'].fonts` deleted. `fonts=None` is the default and `assemble()` already guarded with `if page.fonts:`, so nothing else moved. |
| Existing suites | **Unchanged, all pass** | Nothing under `tests/` asserts anything about fonts, `.hero-grid` or FAQ icons; the coupling is to calculator behaviour and game logic. |

## Proof

- `tools/verify.py` — **0 FAIL** on 18 pages at 375/1360/1440. **One WARN**,
  down from three: the two placeholders Damian chose to delete rather than fill
  are gone (see below), leaving only `terms.html`'s A1 liability amount.
- `tests/run-tests.py` — **ALL SUITES PASS**, six suites, 0 failed.
- `tests/render-diff` against HEAD — every page loads to the same render, write
  for write; **159,135 states swept, 0 differing, 0 reordered, 0 errors**
  (compare 150,576 axes+corners, state-pension 2,009 exhaustive,
  pension-calculator 6,550 axes+corners). The calculator maths is untouched.
- `tools/pagebuild.py` ×3 rebuild clean; `tools/sync-chrome.py --check` 0 behind.

## Placeholders deleted, not filled — Damian's call

F5 and A4 had been open since run 1. Rather than invent a Central Bank
reference number or a phone number, Damian had them removed along with the
markup that existed only to hold them.

| Was | Now |
|---|---|
| `index.html` — "…publishes its register at registers.centralbank.ie. Our reference number is *[to be confirmed]*." | The clause is gone. The register sentence stays, because `site_checks()` in `tools/verify.py` fails index.html if `registers.centralbank.ie` leaves it. |
| `terms.html`, `complaints.html` — "Email: … `<br>`Phone: *[phone number to be confirmed]*`<br>`Post: …" | The `Phone:` label and its `<br>` are gone. No empty label, no doubled `<br>`, no dangling punctuation. |

**No check had to be weakened.** `needsInput` only *reports* `.needs-input`
elements, it does not require them; `SRC_PLACEHOLDERS` never matched either
string; and the one hard dependency, `registers.centralbank.ie` in
`site_checks()`, is the sentence that was kept.

The A4 comment on `terms.html` and `complaints.html` covered the phone number
**and** an open question about whether `hello@pensionbuddy.ie` is a monitored
mailbox. Deleting it whole would have erased the second half, so it was
narrowed to the email-only wording `privacy.html` already carried, and that
question stays flagged on all three legal pages.

verify.py after: **0 FAIL, 1 WARN** across 18 pages, down from 3 WARN. The one
left is `terms.html`'s A1 liability amount, which is still Damian's to set.

## Observed, not changed

- The phone reads as a chat card rather than a device at ≤560px, where it goes
  full-width for readability. Deliberate.
- The `.adv` "More options" mark is a `::after` on the summary rather than a
  `.pm` element, because that disclosure has no span to hang one on. It is
  styled by the same rule and measures identically.
- `games/jargon-battle.html` had its `<h1>` rewritten to a contrast pair by the
  writing pass and it was reverted: that heading is the game's name, and the
  glossary picker links to it by that name.
- The sitewide font swap necessarily reaches the excluded `#damian`, `#adam`,
  `#buddy` and `#story` sections, because it is a token change. Their content
  and layout were not touched. Pinning them to the old faces would mean keeping
  Fraunces and Hanken Grotesk loaded, which is the opposite of rule 2.

# Run 14 — 2026-09-17 · the jargon buster games: Buddy's Run and Jargon Battle

Two mini-games on glossary.html, on branch `feature/jargon-buster-games`. The
brief's prototype never arrived and Damian said to build without it, so both
games are built to the brief's own description of the mechanics. Zero build
tooling: three self-contained files in `games/`, the site's two fonts, nothing
else. Buddy gives facts, never advice, and every game ends on the free call.

| Item | Status | Note |
|---|---|---|
| Sprite sheet | **Built** | `games/buddy-sprites.js`: hand-authored string-matrix pixel art, one character per pixel, editable in a text editor. Buddy at 36x26 in sixteen frames (idle 2, run 6, jump 3, hurt 1, attack 2, happy 2), the Jargon Blob at 38x38 in six (idle 2, hurt 1, attack 2, faint 1), three props (paw, heart, paper). `draw()` paints a frame; `bake()` caches it on an offscreen canvas so a game draws one image per frame. Rendered on a contact sheet at 8x and at 3x on deep pine and looked at, three rounds; then an independent critique, whose four must-fixes (the faint frame's face, the sticky note eating the coffee ring, the paw not reading as the logo, the paper reading as a coin) were applied and re-rendered. |
| Buddy's Run | **Built** | `games/buddys-run.html`. Auto-run along Dollymount Strand (Howth behind, the Poolbeg chimneys on the horizon, sea, sand, dune grass, three parallax layers). Good labels are run into for +10, bad labels are jumped; a hit costs a life with 1.2s of invulnerability; three lives; endless; speed rises with score from 235 to a cap of 400 world px/s; best score in localStorage. Space, Up, W, tap anywhere, or the Jump button; P or Escape pauses; blur pauses. Fixed 1/120s simulation steps. Fairness is measured, not hoped for: a bad pill's collision core is the central 55% of its width (70 to 120px), so clipping the tail of "Pensions are boring" reads as a near miss, and a probe proved a well-timed jump clears every bad label at both the slowest and the capped speed. |
| Jargon Battle Quiz | **Built** | `games/jargon-battle.html`. RPG battle screen: Buddy left, the Jargon Blob (a grumpy stack of forms with a sticky note and a coffee ring) right. Eight questions a battle, drawn three easy, three medium, two hard; the Blob has eight HP segments, Buddy three hearts. A correct pick is a lunge and a BARK; a wrong one is a paper ball and a lost heart, and the dialogue box gives the right answer either way with a fact from Buddy. The brief's "eight correct before three wrong" cannot be met once a single answer is missed, so the win condition shipped is surviving all eight with a heart left; the heading is the brief's in both cases and the score reads hits out of eight. Answer menu is four real buttons (mouse, touch, keys 1 to 4, arrows), with a live region for the outcome. |
| Question bank | **26 questions, fact-checked** | Written three ways (72 drafts over 28 terms) by writers with different comic angles; every draft checked by two independent skeptics, one for legal and factual accuracy under Irish rules, one for harm and tone, with any revision re-checked from scratch; the best surviving variant per term judged; an editor pass for one voice and one format (27 edits, mostly recurring jokes: parish, biscuits, motoring, the good front room); then two whole-bank accuracy gates. Two terms dropped: pension age duplicated the State Pension question, and investment risk gave its own answer away. One gate edit (the QFA option called it "the" Irish qualification) was lost between the two gates and applied by hand. No figure, date, rate or threshold beyond what the site already publishes. |
| Run content | **14 + 14 labels, 9 facts** | Reviewed by a skeptic: "One tidy plan" (consolidation as an unqualified prize) and "The mortgage first" (an ordering of someone's money) removed as advice; "Can't afford it" replaced as a joke at the reader's expense; "Future you, sorted" replaced as a promised outcome; one statistic not on the site dropped. Each fact names the page it comes from. The CTA lead was corrected from "the first twenty minutes are free" to the site's own offer, a free first call of twenty minutes. |
| Picker | **glossary.html** | A section after the page head: eyebrow, "Two ways to learn the lingo.", two cards drawn from the same sprite sheet. Each card is a plain link to its game, so it works with no JS and on a phone opens the game full-window. At 720px and up the click is borrowed and the game plays in a 16:9 iframe stage under the cards, with Full screen and Close; the active card carries aria-current. |
| Game pages | **Chromeless inside the frame** | Each page carries a minimal header (paw mark, wordmark, back link), the game, and the site's regulated-by line; inside an iframe the header and footer hide. Every link is `target="_top"`; the CTA is "Book a free 20-minute call" to booking.html. Both pages added to the sitemap. |
| verify.py | **Extended** | `games/*.html` audited like every other page; a relative href resolves from the page's own folder; screenshot names flatten the slash. Expectations about the shared chrome (skip link, four-column footer, nav wordmark, story link) are scoped to root pages, with a comment saying why, and nothing else was relaxed. |
| Tests | **`tests/games.test.py`, 151 assertions** | Headless Chrome loads a probe copy of each real page and drives the API it exposes (`window.BuddysRun`, `window.JargonBattle`) with a deterministic rng: label and fact copy, the speed curve, collisions, scoring, lives, invulnerability, game over, the persisted best, no double jump, that a jump clears a bad label at both extremes of speed, pause; the bank's shape and wording, shuffle as a pure permutation, eight distinct questions a battle, the whole hit/heart/win/lose machine, and a click-through of the page's own buttons to the end panel. One real bug found and fixed: `pickQuestions(0)` returned the default eight instead of clamping to one as documented. Static checks on the files as they ship: no em dash, every link `_top`, the CTA href, no placeholders, and the glossary's hooks. |
| Existing suites | **Unchanged, all pass** | `build.test.py` 35, `run-tests.py` 608 plus the panel check. |
| verify.py | **0 FAIL** | 18 pages at 375 / 1360 / 1440. The three WARN are the standing A1 / A4 / F1 placeholders. The battle intro's overlay went from 90% to 96% pine so the contrast audit reads it as the background it is. |

## Signed off, 2026-09-17

Damian signed off the content as written: the 26 questions, the 28 run labels
and the 9 facts, all plain data at the top of each game's script. One change
asked for and made: the run label "Revenue chips in" is now "Tax back", so
nothing implies the State adds cash to the pot.

## Observed, not changed

- The Ask Buddy widget can sit over the corner of the Jump button when the
  stage's bottom-right corner meets the viewport's. Space, Up and tapping
  anywhere on the sand still jump.
- verify.py's 375px screenshots go through an iframe wrapper, so for the two
  game pages they show embed mode in a tall portrait frame rather than the
  standalone phone layout. That layout was checked at headless Chrome's 500px
  floor and with an overflow probe at 375, and the picker sends phones to it.
- On a wrong answer the live region announces the lost heart about 600ms
  before the visible heart fades, when the paper ball lands.
- The site limit killed two workflow phases mid-run; the finished agents'
  results were recovered from the workflow journal and the rest continued
  from them, so nothing was rebuilt twice.
# Run 13 — 2026-09-17 · one owner for the nav and the footer links

Candidate 6 from the architecture review, flagged Speculative there and taken
in two halves. The **stylesheet half was refused**: the "SHARED DESIGN SYSTEM
(identical on every page)" banner is false on 12 of 16 pages. Against the
skeleton's 1,455-line stylesheet the ten marketing and legal pages share 3
lines, booking and thank-you share 33, and only the three built calculators
share it all; the ten set h1 to h4 line-height 1.08 where the skeleton sets
1.1. Syncing it would delete those pages' layout CSS and move every heading
on ten pages. There is no marker separating shared from page CSS, so
reconciling it is design work with your sign-off, not a refactor. The nav and
footer halves were taken, guard first, then the sync.

| Item | Status | Note |
|---|---|---|
| What had drifted | **Nothing, in the nav and the link columns** | Byte-identical on all 16 pages apart from which item is marked current and index.html's same-page anchors (`#story`, `#deadline`, deliberate: they work whether the home page is loaded as `/` or `/index.html`). The fan-out cost was authoring effort: the last three commits that touched them touched 16, 16 and 18 pages. |
| The guard | **`pagebuild.chrome_drift()`, a FAIL in `tools/verify.py`, check 8 in `tests/build.test.py`** | Eight kinds of finding: `structure`, `nav` (the block, marker neutralised), `active` (the current item is the page's own, derived from the nav and pinned to the six pages it is today), `active-markup` (both halves of the marker), `foot-top` (whitespace between tags ignored, which is why index.html is not edited), `banner` (announce bar, skip link), and two things that are identical on all 16 and are guarded but never synced: `regulatory`, the disclosure's Central Bank sentence, and `tokens`, the 31 `:root` declarations. Never raises: a broken page is a finding, so verify's report is still written. |
| Mutation-tested | **12 mutants, 12 caught**, permanent in `build.test.py` | An extra nav item, a relabelled one, the marker on the wrong item, aria-current dropped, the class dropped, index reverting to absolute anchors, two footer links swapped, a column heading changed, the Central Bank sentence changed, a token changed, the announce bar changed, a second nav. Plus the tree as it ships as the negative control. |
| The sync | **`tools/sync-chrome.py`, same shape as `stamp-images.py`** | Edit the nav or the foot-top in `pension-calculator.html`, run it: the twelve hand-written pages follow; the three built pages follow on `pagebuild.py`, and `--check` names any that are behind. Pages come from `git ls-files`, every page is checked before any is written, `--check` exits 1 when stale. **Its first run changed zero bytes on every page**, which is the whole proof of no behaviour change. Tested end to end on a copy: `--check` clean, then 1 on a page that gained an item, then a plain run repairs it byte for byte. |
| The cost | **One home for 28 editable strings per page** | Nav labels, the CTA, the footer headings and links are all editable in edit mode; an edit applied to a single page now shows as a FAIL in verify rather than staying put. `docs/EDIT-MODE.md` says so. A per-page nav variation is no longer expressible without a new rule in `pagebuild.py`. |
| Not changed | **The disclosure paragraphs; the stylesheet; index's footer About link** | The disclosure carries different legal wording on the legal pages on purpose. The footer keeps the absolute `index.html#story` on index where the nav uses `#story`: today's behaviour, and collapsing it would turn a reload into a scroll. |
| Tests | `build.test.py` 35 → **69 assertions** | verify.py **0 FAIL**, 16 pages. |

---

# Run 12 — 2026-09-17 · one test harness, one Chrome launch, and a test surface for the built pages

Candidate 5 from the architecture review. Three suites carried their own `eq`,
`money` and report block in two formats, each paid its own Chrome launch, and
the only check that ever confirmed a built page shows the module's figures was
ad hoc and gone. Driven test-first.

| Item | Status | Note |
|---|---|---|
| Chrome launches | **4 → 1**, 5 → 1 with `--drift` | One parent page, one same-origin iframe per job, results copied up into one `<pre>`. Proved from outside: `tests/runner.test.py` points `CHROME` at a shim that counts launches. Per-suite frames rather than one document, so a suite runs with only its own modules and a module that fails to load is charged to the suite that needed it; measured, the frames cost nothing over one document. |
| Runtime | **12.1 to 12.8 s → about 4 s** for everything, including the two new page probes | About 2.2 s of that is starting Chrome. The review's "roughly a quarter" was reached with the panel check's 735 real renders untouched: the loop itself costs under half a second; the old entitlement command was simply two launches. |
| Report formats | **2 → 1** | `  ok   label` / `  FAIL label` with expected and actual on continuation lines, `  skip label  (reason)`, ALL PASS or FAILURES with the counts: the format the cent suites and `build.test.py` already used. compare-calc's `  PASS  employee  = 750` echo goes. `tests/harness.py` is the Python twin, used by both Python suites. |
| Throw guard | **1 suite of 3 → every suite** | `tests/harness.js`: node's uncaughtException listener and the browser's capture-phase error listener both record the error as a FAIL after the last label that completed. A suite that dies reports how far it got. |
| Assertions | **829, unchanged** (141 / 80 / 608), every label byte-identical in order | Each suite's node report was reduced to its labels before any edit and after the migration: empty diff for all three. Each suite is now also gated on its exact count, so a suite that ran nothing fails. |
| Temp files in the repo root | **2 → 0** | The panel and drift probes were written into the root as throwaway pages; every probe is served from memory now, and `runner.test.py` asserts the two files are absent and the untracked set unchanged after a full run. |
| Page probe, new | **`tests/page-probe.js`: 300 assertions on the reality check, 444 on the entitlement check**, 2 and 6 rows skipped with the live bound or step that blocks each | Drives the real built page's sliders through input events at the spec's worked examples (S9, S8) and reads back every cell. Three tiers: the spec's figures typed in by hand at rows that are not the shipped default; the module's figures through the page's own formatters on every sentence; structure, panels and the exact aria-valuetext of every slider. Every spec row is driven, skipped with a reason, or named module-only, and the probe asserts the three sets add up. The birth-to-entry clamp, which the panel check bypassed, is driven for the first time. |
| Clock | **Pinned for the page probe** to the instant `render-diff/runpage.js` uses; real for the panel check | The birth slider's floor is this year minus 66, so which spec rows are reachable changes every 1 January. The pin is asserted through that floor, and a pin to 2027 is a passing run with the 2026 rows reported as skips. |
| Mutation-tested | **11 faults, 11 caught**, permanent in `runner.test.py`; plus 12 in `harness.test.js` and `runner.test.py` for the harness itself | state-pension.js dropped from the entitlement frame; the modules loaded in the wrong order; a suite script that 404s; a parent page that never reports; a suite value changed; a pin that did not take; a page that stops writing the annual figure; the module and the page agreeing on a wrong maximum, which only the spec tier can see; a slider announcing different words; a finer slider step making skipped rows drivable; every one of them applied to the SERVED bytes and the repository untouched. Found by the tests, not by reasoning: a report longer than a 64 KB pipe written from node's exit handler is cut off; the harness writes from beforeExit instead. |
| Spec rows the pages cannot reach | reality check: S9 rows 3, 6, 12; entitlement: S8 rows 4, 5, 6, 7, 12, 14 first case | Noted in both spec files with the bound or step that blocks each. |
| CLI | unchanged, plus `harness` | All four suite forms, `--drift`, `node tests/<file>.test.js`. `PB_MUTATE`, `PB_BREAK`, `PB_CLOCK` are the test-only hooks. |
| Untouched | the four calculation modules, `calc-page.js`, both page scripts, every page | Confirmed by diff. verify.py **0 FAIL**, 16 pages. |
| Next | `--drift` still recomputes the relief band in Python, a third copy of that rule | Raised, not fixed here. |

---

# Run 11 — 2026-09-16 · the entitlement module's interface, narrowed

Candidate 3 from the architecture review. `state-pension-entitlement.js` exposed
almost its whole implementation — four functions and nine constants — and its
result carried the same fact twice in three places. The interface is now two
functions, and each duplicated pair is one field. Driven test-first; the page
renders identically before and after, proven across its entire input space.

| Item | Status | Note |
|---|---|---|
| Public interface | **2 functions, was 4 + 9 constants** | `entitlement(input)` and `band(average)`. Gone: `yearlyAverage()`, `bandRate()`, `drawdownYear()`, `PAID_MIN`, `CREDITS_CAP_TCA`, `HOMECARING_CAP_TCA`, `CREDITS_PLUS_HC_CAP`, `MAX_PER_YEAR`, `YA_MIN`, `PENSION_AGE`, `YA_BANDS`, `YA_SHARE`. Nothing outside needed a constant: the page reads `PENSION_AGE` from `state-pension.js`, where it lives, and works the drawdown year out itself, which it already had to do for its own slider bounds. |
| `band(average)` added | **Done** | Returns `{ min, max, weeklyCents }`, or null below 10. `max` is null for the top band, which has no upper bound. The page printed "40 to 47" and "48 or over" by walking `YA_BANDS` itself to find where one band ended; it now reads the band's own two bounds. |
| `method2`, one field not two | **Done** | Was `method2` plus `method2Unavailable`, a figure and a flag that could disagree. Now one field, never null, in one of two shapes with no key in common: `{ yaShare, tcaShare, weeklyCents, weekly }`, or `{ reason }`. `reason` is the whole test. |
| `yearlyAverage`, one band not three fields | **Done** | `bandMin`, `weeklyCents` and `weekly` scattered beside each other became `band`, the object `band()` returns, null below 10. |
| `tca`, the dead fields dropped | **Done** | Was the whole `statePension()` result copied wholesale plus five more. `contributions` was the same number as `reckonable`; `eligible` is always true past the 520 gate and `shortBy` never set with it. Now assembled field by field, so its shape is a decision rather than a side effect of the other module's. |
| The unreachable panel, deleted | **Done** | `#spBefore`, the "before-transition" panel: markup, CSS and the branch that painted it. The birth slider starts at this year minus 66, so the earliest drawdown year the page can offer is this year, and 2025 is past. Proven, not assumed, before deleting: driven across the page's whole input space, the panel never appeared once. The module keeps the state; `entitlement()` is not the page. |
| 520-contribution gate | **Untouched, still open** | Unchanged again, as in Run 10. Still Damian's wording decision. |
| `state-pension.js` | **Untouched** | Confirmed by diff and by content hash: both built pages load byte-identical `state-pension.js`. |
| Tests | **381 → 608 assertions** | Sections 5 to 8 and 18 now prove the rounding, the bands and the share table through `entitlement()` rather than through helpers that are no longer public; the constants block became boundary tests at the values where each constant decides something. New section 19 asserts the interface itself, whole. New section 21 walks every birth year and entry year the page offers and asserts the SET of states that come back, which is what makes the deletion a proof rather than an assumption. New section 22 covers a reckonable count past a full record, the one state in which the page prints "more than a full record of 2,080" instead of a percentage: no row reached it before, so `tca.capped` could have been wired to a constant unnoticed. |
| Mutation-tested | **19 mutants, 19 caught** | Every hand-rebuilt `tca` field pointed at the wrong source; both band bounds moved by one; a share key deleted and a share value changed; each of the four caps and the 520 gate moved; the Method 2 reason string changed; the before-transition state removed. Every one of them fails the suite. Two of the assertions in the first draft of this pass did NOT fail under mutation and were rewritten: a HomeCaring cap asserted at exactly the cap, and a window sweep that counted a year as covered when its share was missing. |
| New panel check | **In `tests/run-tests.py`, runs by default** | Reads the REAL built page's birth-year bounds in Chrome, drives 735 renders, and asserts the page has a panel for every state those bounds can reach and none it cannot. Deliberately broken to confirm it fires: lowering the birth floor by three years makes it fail on three counts, including the TypeError the unhandled state throws. |
| Proof of no behaviour change | **29,733,102 states, identical** | Every setting of all five sliders, old page against new, both behind their own module version: every element written, every `aria-valuetext`, every panel's hidden flag. Zero differences. Plus 64,778 birth-slider moves through the page's own event handlers, for the entry-clamp note the direct sweep cannot reach, and 1,764 cases in real headless Chrome on the two built pages. The module itself was compared field by field over 256,200 inputs: every difference is one of the four intended shape changes and nothing else. |
| verify.py | **0 FAIL** | 16 pages. |

---

# Run 10 — 2026-09-12 · one home for the transition window

Candidate 2 from the architecture review. The rule deciding whether the reality
check shows "a floor" or "your actual rate" was copied in two places no test
loaded: a transition-window constant inside `state-pension-entitlement.js` that
was never exported, and `LAST_TRANSITION_YEAR = 2033` inside the reality-check
page script. Driven test-first; both pages render identically before and after.

| Item | Status | Note |
|---|---|---|
| Moved into `state-pension.js` | **Done** | `PENSION_AGE`, `TRANSITION_FIRST`, `TRANSITION_LAST`, and three functions: `transition(drawdownYear)` → before / during / after, `earliestDrawdownYear(age, thisYear)`, `floorStatus(result, age, thisYear)` → exact / floor / rate. It goes here and not in the entitlement module because both pages turn on this window and only one of them loads that module. |
| The null overload, deleted | **Done** | `yaShare(year)` returned null both before 2025 and from 2034, two opposite facts under one value, and the entitlement page read it as "after 2033". On a pre-2025 drawdown year it told the reader they reach 66 *after the transition ends in 2033*. Unreachable from the birth slider, whose floor is clock-derived — one edit from reachable. The function is gone; `transition()` names all three states and `YA_SHARE` keeps the mix. |
| 520-contribution gate | **Untouched, still open** | The two modules gate it on different counts, reckonable in one and paid in the other. A wording decision, not a refactor; left exactly as found for Damian. |
| Tests | **25 new assertions** | `tests/state-pension.test.js` sections 15 to 17: years 2024, 2025, 2033, 2034, and age 57 against age 58 in 2026, the one year of age that crosses the boundary. 55 → 80 assertions. Entitlement row 18 now asserts the share table's keys against the window itself, since the two live in different files. 365 → 381. |
| Proof of no behaviour change | **2,254 states, byte-identical** | Headless Chrome drove both built pages across every slider combination that can move the decision — 41 contribution steps × 49 ages, and 49 birth years × 5 records — and dumped every element the decision paints, before and after. Identical. The unreachable before-2025 panel was driven separately and also matches. |
| verify.py | **0 FAIL** | 16 pages. The three WARNs are the open NEEDS-INPUT placeholders on other pages. |

---

# Run 9 — 2026-09-11 · state-pension-entitlement.html, the best-of calculation

Contract-first again, with one addition: the spec was put through an
adversarial review before any code was written against it. Research in
`docs/RESEARCH-YEARLY-AVERAGE.md` (primary sources, verbatim quotes, six
UNCONFIRMED items listed), contract in
`docs/CALC-SPEC-STATE-PENSION-ENTITLEMENT.md` (revision 2), maths in
`assets/js/state-pension-entitlement.js` (imports Method 1 from
`state-pension.js`, never re-implements it), tests in
`tests/state-pension-entitlement.test.js` (365 assertions, exact to the cent),
page assembled by `tools/build-state-pension-entitlement-page.py` from
`pension-calculator.html`'s skeleton. Glossary started: `CONTEXT.md`.

| Item | Status | Note |
|---|---|---|
| Research | **Done** | All six Yearly Average bands confirmed against SW19 2026 p.33 and Citizens Information; transition schedule and which-year-governs confirmed in SWCA 2005 s.109(6D). Two findings changed the design: HomeCaring Periods count under TCA only, and the 520 minimum is on paid contributions. gov.ie's own rate pages still show 2025 bands, so the page cites the booklet and says why. |
| Spec review | **16 findings applied** | Three lenses (arithmetic, statute, edge cases), two skeptics per finding. Two were wrong rules: age cannot fix the year of the 66th birthday, so the page asks for year of birth; and contribution years before 2002 ran April to April, so the entry-year input is defined as the contribution year with the rule beside it. Also: impossible inputs (more than 52 a year) are refused rather than awarded; the floor claim is confined to the state where a Method 2 figure exists; before-2025 drawdowns return no figure. |
| Page | **Built** | Five sliders. Leads with the award, then a "Both calculations" card showing Method 1, Method 2, and which is paid and by how much. Four states: eligible, no entitlement (520 paid), the details do not fit, and a defensive before-2025 panel. Not in the main nav: measured, an eighth text item overflows at 1200px. Linked from the reality check, the footer Tools column on every page, and the sitemap. |
| Page probe | **10 of 10** | Headless Chrome drove the built page at every slider-reachable worked example and compared the DOM to the module: all match, all match the spec's hand-worked figures. |
| Reality check | **Three copy changes** | The caveat card is now age-aware: exact at a full record; a floor for anyone reaching 66 by 2033 (decided on the earlier candidate year, so the "not a floor" wording can never show to someone still in the transition); and for 2034 or later, "this is your rate rather than a floor". Two links to the entitlement check. The age subnote now says age drives that note too. Figures untouched; 55 assertions pass unchanged. |
| After review | **Fixed** | The CTA card had been copied from the reality check and its heading made no sense here; rewritten. Both build scripts emitted `</main>` twice; fixed. Image URLs re-stamped after rebuilding. |
| Not in main nav | **By measurement** | 1236px wide at a 1200px viewport with one more item. S8 of the reality check spec is now out of date on nav headroom. |

## NEEDS DAMIAN INPUT

1. **Reality check, the 520 wording.** The live page gates on 520 *reckonable*
   contributions; the statute gates on 520 *paid*, and credits never count.
   Anyone with under 520 paid but 520 or more reckonable is shown a pension
   they would not get. Proposed one sentence for the subnote and the
   assumptions list is in the entitlement spec, S11 item 1. **Not applied.**
2. **Reality check, the caps wording.** The page names only the 520 cap on
   credits. HomeCaring Periods are capped at 1,040, and credits plus
   HomeCaring at 1,040 combined. Proposed wording in S11 item 2. **Not applied.**
3. **The band table**, before launch. Confirmed against two primary sources;
   this is the sign-off the source warning asks for.
4. **The April-to-April rule** is a subnote beside the entry-year slider. A
   small "before 6 April?" control would be more robust for pre-2002 entrants.
   Say if wanted.

## Observed, not changed

- The skeleton's Ask Buddy widget and consent bar carry three em dashes as
  `\u2014` escapes inside JavaScript strings, on every page. The build
  scripts' em-dash check looks for the literal character and misses them.
- `broker-vs-autoenrolment.html` has the same duplicate `</main>` the two
  State Pension pages had; its build script is not touched in this run.
- The Method 2 blend is rounded half up to the cent. No published rule
  governs that rounding; the page says so.

Tests: 561 assertions across three suites, all pass. **Verified:** 16 pages,
0 FAIL at 375 / 1360 / 1440, no console errors; the 3 WARN are the standing
A1 / A4 / F1 placeholders.

---

# Run 8 — 2026-09-10 · broker-vs-autoenrolment.html, funds and risk, sliders proved

| Item | Status | Note |
|---|---|---|
| Funds and risk | **Built** | A shared card for the personal pension side, in both modes: My Future Fund offers a small set of standard funds with limited choice; a broker-arranged personal pension gives a wider range and lets the person choose a risk level. Three illustrations on the 1 to 7 Summary Risk Indicator, each showing return, bad-year fall and the can-fall-as-well-as-rise line together. No asset class named. Not a recommendation of any level; the CTA reads as talking the choice through. |
| Risk figures | **NEEDS DAMIAN INPUT** | See the table below. Placeholders. |
| Slider geometry | **Fixed, sitewide** | Measured, not eyeballed: the fill boundary sat 14px short of the thumb centre at 0%, 7px short at 25%, 7px past at 75% and 14px past at 100%, on every slider. A fill of x% of the full width ignores that a 28px thumb's centre only travels the width minus 28px. The two-tone strip is now drawn across (width - 28px) starting 14px in, with an aqua cap under the first 14px and a light base beneath. After the fix every position measures within a pixel. Thumb shadow confirmed by render beside a flat, shadowless copy. |
| Default contribution | **Fixed** | The calculation was right at every salary (€39,000 gives €750). What stuck at 14,500 was the lock: once the slider had been moved it kept its value when salary changed. It now re-matches whenever salary, age or tax status changes, and the note under it says so. |

Tests unchanged, all 196 pass, drift check clean. **Verified:** 15 pages, 0 FAIL
at 375 / 1360 / 1440, no console errors.

---

# Run 7 — 2026-09-10 · broker-vs-autoenrolment.html, made plain

Presentation only. No maths, tests or shared modules changed: `git diff` on
`assets/js` and `tests` is empty, all 196 assertions pass unchanged, drift
check clean.

| Item | Status | Note |
|---|---|---|
| Sliders | **Fixed, sitewide** | The two-tone track was there at line 425 of the shared stylesheet and then flattened by a later brand-colour pass (lines 1241 and 1299) to a single-colour gradient with no `--fill` stops, so filled and empty read the same. The thumb's drop shadow had been replaced by a 1px ring at line 1300. Same class of bug as the logo paw and the giant info icon. Fixed in every page's copy of the stylesheet, since every calculator had it, and proved with captures at 10% and 90%. |
| Auto-enrolment year | **Removed as an input** | Worked out from today's date and stated in one line at the top of the results: "Since it is 2026, you are in year 1 of the phase-in: you put in 1.5%, your employer matches 1.5%, and the State adds 0.5%." A "plan for a future year" toggle in More options, off by default, reveals the slider. |
| Fewer things at once | **Done** | Visible by default: age, salary, and the amount slider for the mode. Employer match (both modes) sits behind a yes/no question and only shows its slider on yes; off counts as zero whatever the slider was set to. |
| One sentence first | **Done** | The results open with the outcome in plain words, before any number, in both modes, with the year line under it. The two per-mode verdict cards became this one lead. |
| Plainer words | **Done** | Tabs are "Instead of auto-enrolment" and "On top of auto-enrolment". Helper text cut to one glance each. |

**Verified:** 15 pages, 0 FAIL at 375 / 1360 / 1440, no console errors. Page
probe confirms the lead sentence, the year line, the toggles, and that the
worked examples still render the same figures.

---

# Run 6 — 2026-09-10 · broker-vs-autoenrolment.html, corrected and extended

Prompted by a sibling session's "Is My Future Fund enough?" build, supplied as
reference. Not ported. Used for ideas, and it surfaced one factual error.

| Item | Status | Note |
|---|---|---|
| €80,000 cap | **Corrected** | The page said the employee's own contribution was not capped. gov.ie: contributions "will not be levied on any gross pay over €80,000", the employee's included. Module, spec, tests and every sentence on the page now agree. At €100,000 the auto-enrolment total is €2,800, not €3,100. |
| Relief at the real rate | **Built** | Replaces the 20%/40% picker with "how you are assessed for tax". Relief is split at the standard rate cut-off point, 40% on the part of a contribution above it and 20% below, within the age-related limit. Cut-off points €44,000 / €53,000 / up to €88,000, confirmed at revenue.ie. Added to `pension-tax-relief.js` alongside the flat functions, which are untouched and still guarded by the drift test. |
| Money above the cap | **Built** | A Mode 1 card, shown only above €80,000: the salary above the cap, the person's own rate on it that the scheme never takes, and what a personal pension could turn that same net amount into. Additive; the like-for-like basis is unchanged and no crossover is claimed. |
| Phase default | **Built** | The phase slider starts on the current calendar year's phase rather than on year 1 forever. |
| Nav | **Fixed** | The page had shipped with "Calculator" marked as the current nav item. |
| Not taken | **By choice** | The reference's multi-year projection and adequacy bars would duplicate `pension-calculator.html` and the State Pension page. Its email capture waits on F1b. |

Tests: `compare-calc.test.js` went from 94 to 141 assertions. Cases 2, 4 and
5 changed with the cap; cases 13 to 22 cover the tiered relief and the cap
card. Drift check against `pension-calculator.html` still clean. A page probe
drives the built page and confirms the rendered figures at €50,000 single and
married, €100,000, and the €120,000 worked example.

**Verified:** 15 pages, 0 FAIL at 375 / 1360 / 1440, no console errors.

---

# Run 5 — 2026-09-10 · state-pension-reality-check.html

Contract-first, the same way as the comparison calculator: spec, then tests,
then the page. Contract in `docs/CALC-SPEC-STATE-PENSION.md`, maths in
`assets/js/state-pension.js`, tests in `tests/state-pension.test.js` (55
assertions, exact to the cent), page assembled by
`tools/build-state-pension-page.py` from `pension-calculator.html`'s skeleton.

| Item | Status | Note |
|---|---|---|
| Figures verified | **Done** | All five against gov.ie, Citizens Information and the Pensions Council PDF itself. Two corrections to the brief, both applied: contributions are reckonable, and the transition is a best-of, so partial figures are a floor. |
| Housing caveat | **Dropped** | The brief's "assumes outright home ownership" was UK PLSA methodology, not the Irish report. Removed entirely on Damian's call, no replacement. |
| Page | **Built** | Leads with the maximum, €299.30 a week, €15,564 a year. Three living-standard bars, each scaled to its own target, gap in euro a year, a month, and words. Sub-520 shows a no-entitlement state, never a figure. |
| Explainer | **Placed** | Damian's copy verbatim, as its own section before the CTA. |
| Links | **Done** | Main nav ("State pension", fits with no overflow, see spec S8), footer Tools on all pages, a CTA on `starter.html`, `sitemap.xml`. |
| Also fixed | **Done** | The comparison page had shipped with "Calculator" marked as the current nav item, because its build script's exact-string replace never matched the skeleton's attribute order. Both build scripts now match on attributes; the comparison page is rebuilt. |

**Verified:** 15 pages, 0 FAIL at 375 / 1360 / 1440, no console errors. A page
probe drives the built page and confirms it renders the module's figures at
2,080, 1,560, 520 and 468 contributions.

---

# Run 4 — 2026-09-08 · about.html folded into the home page, spartan copy pass

`about.html` is gone. Everything it carried moved onto `index.html`, the
duplication between the two pages was removed, and a copy pass across the site
cut the trailing sentences that repeated what the reader already had.

## Structure

| Change | Note |
|---|---|
| `about.html` deleted | Every nav and footer "About" link now points at `index.html#story`. Removed from `sitemap.xml`. |
| New `#story` section | The father-son story, under the heading "Father, son, dog." |
| `#damian`, `#adam` moved over | Full profile sections, replacing the short `#about` panel the home page had. |
| New `#buddy` section | The namesake and mascot, using `assets/img/buddy-beach.jpg`. |
| `.snaps` photo strip moved over | Now "Out Of Office". Its CSS was the only component `index.html` did not already style. |
| Regulatory section moved over | "Who you are actually dealing with", plus the information-not-advice box. |

## Removed as said twice

| Dropped | Why |
|---|---|
| The home page's short `#about` panel | The full `#damian` section replaces it. |
| The career timeline, five entries | The edited Damian bio now lists the same jobs in one sentence. |
| about's three story steps | Problem, idea and promise were each already covered by the pain band, Damian's bio and the "A chat, not a sales pitch" section. |
| Both team-card grids | The three profile sections replace them. Roles kept, moved into each profile's kicker. |
| One of two identical proofs blocks | Both pages carried the same three cards verbatim. |
| The "No testimonials yet" section | Its explanatory copy was emptied in the saved edits. |

## Copy pass

29 sentences removed across 8 pages, following the pattern in the saved edits:
keep the statement, drop the elaboration behind it. "If we're not the right
fit, we'll say so" went from 21 uses to 10, and no marketing page now says it
more than once. FAQ answers are mirrored into JSON-LD and the Ask Buddy widget,
so every cut landed in all three copies.

Untouched on purpose: the legal pages, every risk warning, the Standard Fund
Threshold notes, the auto-enrolment source warning, the email-delivery
disclaimer and every "information, not advice" statement.

**Verified:** 14 pages, 0 FAIL at 375 / 1360 / 1440. WARN only on the three
NEEDS DAMIAN INPUT placeholders below.

## Photo strip trimmed, illustration outstanding

Removed from the off-duty strip on the home page, files and pipeline entries
with them: `strip-adam-rocky-sitting`, `strip-rocky-helmet`, `strip-rocky-sofa`.
Nine photos remain, real figures and marquee clones still in balance.

**Outstanding:** a new illustration, "Buddy and Damian on the hill", to take the
slot the park photo held. Not produced. Two reasons:

1. No image generation is available in this session. The Adobe connector needs
   authorising and the session is non-interactive.
2. There is no illustration set to match. Every image asset in this repo, and
   every one in its history, is a photograph. The only vector art is 24x24 flat
   UI icons and a favicon letterform. The brief's palette maps onto real tokens
   for deep pine (`--teal-900`), jewel teal (`--teal` / `--aqua`), ochre
   (`--amber`) and warm near-black (`--ink`), but terracotta has no equivalent,
   and no paper-grain texture exists anywhere in the codebase.

If the brand illustrations live outside this repo, they need to come in before
a new one can be matched to them.

## Second follow-up, same day

Two real bugs, both mine, both from the about-page merge.

| Bug | Cause |
|---|---|
| A page-filling "i" icon above the footer | `index.html` never received the five `.infoadvice` component rules, including `.infoadvice .ii svg{width:18px;height:18px}`. My pre-merge check counted the string `.infoadvice` appearing in unrelated font-size and link-padding groups and wrongly concluded the component was styled. Ported from `starter.html`. |
| The new headshot appeared not to have landed | It had. Image URLs carry no cache key, so browsers kept serving the old colour file under the same name. `tools/stamp-images.py` now appends `?v=<content hash>` to every local image reference, the same trick the calculators use for their JS modules. |

Also: the logo paw was being overridden to `--aqua-ink` by a later rule and
rendered near black. Now white on all 14 pages. WCAG 1.4.11 exempts logotypes,
so the drop from 6.9:1 to 2.1:1 against the aqua is allowed.

Cut: the trust strip under the hero (all four claims appear elsewhere on the
page), Damian's second mission quote, and the story paragraph naming who does
what, which the two profiles directly below already say.

Home page is 1184px shorter.

## Follow-up, same day

| Change | Note |
|---|---|
| Damian's portrait swapped | New black and white headshot, `Damian-Headshot-BW.jpg` in the Photos folder, cropped to 4:5 by `tools/prepare-photos.py`. The previous colour portrait is in git at `5fbffb4`. |
| "What usually happens" removed | The three-card pain band on the home page. Abstract commentary rather than a concrete situation, and the audience section below it does the same self-identification job better. |
| The proofs grid removed | Its three cards restated the two paragraphs directly above them and Damian's bio. |

Home page `<main>` went from 1484 words to 1283. "Central Bank / regulated"
now appears 9 times rather than 11, QFA 7 rather than 9.

The `.pains` sections on `tracker.html`, `starter.html` and `director.html`
were left alone deliberately: they name concrete situations on targeted pages,
which is what the home page one failed to do.

---

# Run 3 — 2026-09-07 · broker-vs-autoenrolment.html

A new standalone comparison calculator. Contract in `docs/CALC-SPEC.md`,
maths in `assets/js/autoenrolment.js` + `assets/js/pension-tax-relief.js`,
tests in `tests/compare-calc.test.js` (run with `python3 tests/run-tests.py
--drift`), page assembled by `tools/build-compare-page.py` from
`pension-calculator.html`'s skeleton so chrome and a11y scaffolding are
identical.

| Item | Status | Note |
|---|---|---|
| Mode 1, Equivalent layer | **Built** | Same money out of pocket: auto-enrolment against a personal pension. Contribution defaults to the gross that matches auto-enrolment's net cost, so the comparison opens like for like. |
| Mode 2, Combined | **Built** | Auto-enrolment at its set rate plus a personal top-up, because My Future Fund does not currently accept contributions above that rate. Top-up match is a percentage of the top-up, not of salary (Cases 9 and 12). |
| Tax relief reuse | **Done, with a drift alarm** | Relief logic lifted verbatim into the shared module; `run-tests.py --drift` drives the real `pension-calculator.html` and fails on any disagreement. That page itself is untouched. |
| Tests | **94 assertions, all passing** | Both supplied worked examples exact; Cases 7 to 9 exact; Case 5 asserts an auto-enrolment win on purpose; Case 12 asserts the match scales with the top-up. Every figure also read off the rendered page in a real browser. |
| Verification | **0 FAIL, 0 WARN** at 375 / 1200 / 1360 / 1440 | No console errors, contrast failures, overflow or missing alt; `<main>`, skip link, focus ring, `aria-valuetext` on all seven sliders, one `aria-live` summary. |
| Linked from | footer Tools column (all pages), starter.html CTA, sitemap | **Not the main nav**: the header had 16px of headroom after About; an eighth item would overflow (C6). |
| Honesty rule | Enforced by test and by copy | The default state is an auto-enrolment win, stated in the same words and place as the opposite. Mode 2 is matter of fact. CTA reads "Talk through what this means for you". |

**NEEDS DAMIAN INPUT (before this page goes live):** the My Future Fund rate
table and phase years, and the "no AVCs above the set rate" position behind
Mode 2, both come from third-party summaries, not gov.ie or NAERSA. Confirm
the current phase year, the exact rates, and the AVC position before launch.
Flagged in CALC-SPEC.md, as a comment above the rate table and above
`combined()` in `autoenrolment.js`, and in a visible card on the page.

Deployment note: the two module script tags carry a content-hash query
(`?v=…`) written by the build script, because a cached old module under the
same URL would silently break the maths (observed once in a persistent
browser tab during testing; the verifier ignores `?query` when checking files).

---

# Run 2 — 2026-09-03

Scope: re-verify A–E and F1, then build F2–F6.

## Run 2 · verify-only gate — PASSED

Full suite re-run on all 12 existing pages before any run-2 edit
(`verify-out/run2-verifyonly-report.json`): **0 FAIL on every page, and zero
regression from run 1** — 0 broken links or anchors, 0 console errors, 0
horizontal overflow at 375px, 0 contrast failures, 0 image decode failures,
calculator projection still exact (101,685), focus ring 3.99:1, `<main>` on
12/12, and booking's Calendly ready-branch still verified (script + CSS
injected, fallback hidden, widget 984px, footer present).

Every warning left at that point was an open run-2 build item — F2 ×12,
F5 ×12, F4 ×1 — plus the two NEEDS-INPUT placeholders. So A–E all held.

## Run 2 · FINAL GATE — PASSED

`python3 tools/verify.py --widths 375,1200,1360,1440` across all **14** pages
(`verify-out/run2-finalgate-report.json`), with full-page screenshots at 375
and 1440:

| Measure | Result |
|---|---|
| Pages | 14 — the original 12, plus `thank-you.html` and `broker-vs-autoenrolment.html`. `about.html` was folded into the home page in run 4. |
| **FAIL** | **0** on every page |
| Broken links / anchors | 0 |
| Console errors | 0 |
| Contrast failures | 0 |
| Horizontal overflow at 375px | 0 |
| Image decode failures | 0 |
| Duplicate ids | 0 |
| Worst nav overrun (incl. 1200px) | −18px — the header fits at every width |
| Calculator projection | exact on both (101,685 = 101,685) |
| Booking gate | refuses an empty submit, reveals on a valid one, widget 984px with script + CSS injected, fallback link prefilled and tagged |
| New pages | Fraunces headings, `<main>`, skip link to `MAIN`, focus ring 3.99:1 |
| Site-level checks | all pass — both new pages exist, are linked, and are in the sitemap |

Remaining warnings: **3, all NEEDS DAMIAN INPUT** (A1 liability figure, A4
phone number, F5 register reference). Nothing else is outstanding.

The 1200px width was added to the audit specifically because the F5 pass
found the seventh nav item overran the viewport there — a width the previous
sampling (375/1360/1440) would have missed.

## Run 2 · corrections to the incoming reports

Two items the incoming reports described as resolved are **not** resolved in
the repo. They are unchanged, still flagged, and were not invented around:

- **A1** — Report 1 described a revised liability clause using Damian's
  wording with "a low nominal figure flagged for solicitor". `terms.html` §5
  still renders the run-1 placeholder `€[amount to be confirmed]`. No such
  wording or figure has reached the file. This is a legal decision and stays
  NEEDS DAMIAN INPUT.
- **F1** — Report 2 listed "lead endpoint + analytics wiring" as resolved.
  `LEAD_ENDPOINT` is still `''` on all five capture pages and `ANALYTICS_SRC`
  is still `'[ANALYTICS_SCRIPT_URL]'`. Both still fail safely, but no lead
  reaches a backend and nothing is measured. Stays NEEDS DAMIAN INPUT.

**F3** was already completed in run 1 (`e028438`) — Report 2's "476KB index"
is stale; index.html is 125,862 bytes with photos in `assets/img/`. Demoted
to verify-only and re-confirmed.

## Run 2 · build status

| Code | Status |
|---|---|
| F2 typography | **Fixed** — commit `8a9db85` |
| F3 image extraction | Verified — done in run 1, still holding |
| F4 qualifying form | **Built** — commit `678697b` |
| F5 about page | **Built** — commit `e2113c3` |
| F6 thank-you page | **Built**, redirect **Needs-Damian-Input** — commit `678697b` |
| C10 (found in run 2) | **Fixed** — commit `8a9db85` |

### F2 · typography — Fixed

Fraunces is now loaded and carries the display type; run 1's deletion of the
orphaned rule is reversed per the brief.

- One Google Fonts request, now `Fraunces:opsz,wght@144,600..700` alongside
  Sora and IBM Plex Mono. Pinning the optical size to 144 (the display cut)
  and keeping a 600–700 weight range yields a single 33.6KB latin file
  rather than two; the full variable axis would have been 67KB for no gain.
- The existing `--font-display` token already fed exactly `h1`–`h4` and
  `.phead h1`, so switching it moved display type and nothing else. Verified
  zero leakage into body copy, buttons, form controls and numeric readouts
  on all 12 pages.
- Display type retuned for a serif: tracking `-.03/-.035em` → `-.012/-.015em`
  (Fraunces letterforms genuinely collided at Sora's values), `h1` weight
  700 → 600, leading opened slightly. `clamp()` sizes unchanged — the opsz
  144 cut is narrower than the Sora it replaced, which actually relieved the
  worst 375px headline (the director hero dropped from four lines to three).
- `.logo` deliberately pinned back to Sora — the wordmark is a brand mark at
  20px inside a 72px nav, where a serif reads as a different brand. **This is
  a one-line reversible call** (`.logo{font-family:var(--font)}`) if you want
  the wordmark editorial too.
- `.pb-b-head .t` (Ask Buddy panel header) restored to the display token —
  this was the rule that had been silently rendering Georgia.

### F4 · qualifying / routing form — Built

`booking.html` no longer drops visitors straight onto a calendar. A
three-field form (name, email, persona) stands in front of it.

- The calendar stage is genuinely hidden until a valid submit, and the
  Calendly script is only injected at that point — so the third-party
  script no longer loads at all for visitors who never book.
- The persona rides the booking record as
  `utm_campaign=tracker|starter|director`, so Director enquiries are
  identifiable and can be prioritised. Name and email prefill the event.
- **B2 (the Calendly failure path) is preserved and slightly stronger:**
  the `onerror` handler and 8s deadline now arm at injection time and check
  for a real `<iframe>` rather than trusting `script.onload`, so a script
  that loads but never renders now also falls back. The fallback link
  carries the same prefilled, tagged URL.
- Validation refuses an empty or malformed submit without revealing the
  calendar, reports through an `aria-live` region, moves focus to the first
  invalid field, and every field clears 44px.
- **Compliance:** deliberately routing-level. It does not ask income,
  pension value, age or employer, and says so in copy — the site's position
  is information, not advice, and a form collecting circumstances would
  edge toward a personal recommendation.

### F6 · post-booking thank-you page — Built (redirect needs Damian)

`thank-you.html` is generated from `booking.html`'s own skeleton, so chrome,
nav, footer and accessibility scaffolding are identical. It confirms the
booking, sets expectations for the call, says what to have ready, repeats
the "no obligation, no jargon, no pressure" promise, and links back to both
calculators and the jargon buster. `noindex`, as a post-conversion page.
Every factual line is lifted from copy already published on the site.

**The redirect cannot be wired from the page.** For an inline Calendly
embed, "redirect after booking" is a setting on the event type inside the
Calendly account. `THANK_YOU_URL` is defined in `booking.html` and used by
an origin-checked `calendly.event_scheduled` listener, but that listener
could not be confirmed end-to-end without a real completed booking — treat
the account setting as the one that matters. See NEEDS DAMIAN INPUT.

### F5 · About / Our Story page — Built

`about.html` is assembled entirely from existing components — the hero,
`.about-grid`/`.about-port`/`.pullquote`/`.bio`, `.timeline`, `.steps`,
the `.team` blocks, `.proofs`, `.infoadvice` and the closing `.final` band.
Only 13 lines of new CSS, both blocks copied verbatim from sibling pages
(`.timeline` from booking, `.infoadvice` from director), so no new design
language was introduced.

Sections: hero → Damian's story → a five-stop career timeline → why
Pensionbuddy exists → Buddy → **who you are actually dealing with** (the
Gresham Wealth Management trading-name relationship in plain English, with
the Central Bank register) → the "no testimonials yet" honesty position →
book-a-call close.

**Source discipline held.** Every fact traces to copy already published on
this site — the homepage About/team/proof sections, the footer disclosure,
and director.html's information-not-advice notice. No dates, firm names,
qualifications, client numbers or fee claims were invented; the career
timeline uses era labels ("Where it started", "Then", "Sydney", "2012",
"Now") precisely so no dates had to be. One tracked placeholder:
`data-issue="F5"` on the Central Bank **register reference number** — the
site tells readers to check the register but never gives the number to look
up. See NEEDS DAMIAN INPUT.

**The nav needed a real fix, not just an extra link.** C6 had left zero
slack: a seventh item pushed the row 59px past the 1140px column, and at a
1200px viewport it overran the viewport itself — a width the verifier's
375/1360/1440 sampling would not have caught. Rather than drop an item, the
spacing was retuned inside the same C6 block (nav gap, link and CTA padding,
chip margin), measured against a three-digit countdown (`364d 06h 41m`,
the normal state for ~9 months of the year). Result: nav content 1076px
inside a 1092px box — 16px of headroom in the worst case — and
`navOverrun.overrun` back to −134 at 1360 on all 14 pages, identical to the
pre-change baseline.

Homepage section shortened to a teaser (portrait, pullquote, the career
paragraph, the three credential tiles) plus a "Read our story →" link.
`id="about"` is retained so old bookmarks still land, and the footer
"About Damian" link now points at `about.html` on all 14 pages — no
`index.html#about` links remain. `about.html` added to `sitemap.xml`.

### C10 · homepage card titles — Fixed

Surfaced by the F2 pass: `index.html` never carried the
`.pain h3{font-size:19px;font-weight:700;margin-bottom:8px}` rule that
director/starter/tracker all have, so the three "What usually happens" card
titles rendered at the browser's default h3 size and, with the global margin
reset, sat flush against their paragraphs. Pre-existing, not caused by F2.

---

## NEEDS DAMIAN INPUT

| Code | Where | What is needed |
|---|---|---|
| **A1** | `terms.html` §5 Limitation of liability | The liability cap figure. Currently renders as a marked placeholder "€[amount to be confirmed]". Search for `data-issue="A1"`. |
| **A4** | `terms.html` and `complaints.html` Contact sections | (1) A phone number — currently a marked placeholder "[phone number to be confirmed]", search for `data-issue="A4"`. (2) Confirmation that `hello@pensionbuddy.ie` is a real, monitored mailbox — it is used on terms, complaints and privacy. |
| **F1a** | every page, `ANALYTICS_SRC` | Which analytics provider (Plausible / GA4 / none). The guard self-disables until set; nothing loads. |
| **F1b** | both calculators, starter, tracker, director — `LEAD_ENDPOINT` | A form endpoint (Formspree, Netlify Forms, CRM webhook). Until set, capture points open a pre-filled email and show an honest on-screen fallback. |
| **R1 risk figures** | `broker-vs-autoenrolment.html`, "Choosing your funds, and how much risk"; constants in `tools/compare-parts/compare-page.js` (`RISK_LEVELS`) | The three illustrative levels use placeholder figures: lower risk, SRI 2 to 3, around 3% a year, could fall around 10%; medium, SRI 4, around 5%, could fall around 20%; higher, SRI 5 to 6, around 7%, could fall around 30% or more. **Confirm against the actual fund ranges Gresham can arrange**, and keep them consistent with the 1% to 8% growth slider (default 5%) on the two other calculators so no two pages imply different growth. |
| **R2 fund access** | same page | **Exactly which fund ranges and structures Gresham can actually arrange**, and whether any wider asset access should be mentioned at all. Standard personal pensions and PRSAs have restricted fund menus; wider access generally needs a self-directed or self-administered arrangement, and Revenue rules apply. Until answered the page says only that a broker gives access to a wider choice of funds and risk levels than My Future Fund, and names no asset class. |
| **F5 register no.** | `index.html`, "Who you are actually dealing with" | The Central Bank **register reference number**. The site tells readers to check the register at registers.centralbank.ie but never gives the number to look up. Renders as a marked placeholder — search `data-issue="F5"`. |
| **F6 redirect** | the Calendly account, not the code | The thank-you page is built, but the redirect is an event-type setting: **Calendly → Event Types → `pensionbuddy-1-1` → Confirmation page → Redirect to an external site → `https://pensionbuddy.ie/thank-you.html`**. Until that is set, a completed booking still lands on Calendly's own confirmation screen. The page's JS listener is a belt-and-braces fallback that could not be confirmed end-to-end from here. |

## Category A — legal / content blockers · commit `7b8799b`

| Code | Status | Note |
|---|---|---|
| A1 | **Needs-Damian-Input** | `€[LIABILITY_CAP_EUR]` token replaced with a marked placeholder; sentence reads correctly; figure pending. |
| A2 | Fixed | All four "Template document / notice / process" and "Draft for legal review" boxes removed from terms, privacy, complaints. |
| A3 | Fixed | Single "Last updated: 9 July 2026" on terms and privacy. |
| A4 | **Needs-Damian-Input** | Developer comment removed; fake "Phone: book a call" replaced with a marked placeholder; email retained pending confirmation. |
| A5 | Fixed | 404 footer now carries the site-wide disclosure, not the complaints text. |
| A6 | Fixed | Privacy Notice publishes the data controller's email and postal address; rights section points to it. |
| E4 | Fixed | Stray "Last updated" removed from 404 (same file as A5). |

Verification after A: 404, complaints, privacy, terms → **0 FAIL** each (were 0 / 4 / 7 / 7).

## Category B — functionality · commit `ebf43c2`

| Code | Status | Note |
|---|---|---|
| B1 | Fixed | `KEEP` corrected to the page's real ids; the salary slider now sits in the primary group (verified: not inside a closed `<details>` at any width). Pension page's array cleaned of dead ids too. |
| B2 | Fixed | Calendly embed has `onerror` + 8s timeout that hides the embed and reveals the fallback panel and link; dead placeholder branch removed. Tested: failing host → fallback; working script → embed stays. |
| B3 | Fixed | Four-column footer and its CSS ported to booking; booking now links to the director calculator. Screenshot-confirmed at 1440. |
| B4 | Fixed | New "Your annual earnings" slider; relief = min(contribution, age-band % × min(earnings, €115,000)) × tax rate. Independently checked: 35yo/€1,000/€50k → €333 relief on a €10,000 limit; 62yo/€5,000/€200k → €1,533 on €46,000; 28yo/€300/€30k → €120 (no cap). |
| B5 | Fixed | Over-cap note now fires when the contribution exceeds the user's own band and names the limit. Superseded by B4. |
| B6 | Fixed | Hero tile relabelled "Corporation tax relief on contributions" (figure unchanged); "saves €X vs salary" sentence removed; comparison note states both routes are deductible. Intro sentence aligned. |
| B7 | Fixed | Each page's lead payload and mailto body reference only its own result ids; dangling "Estimated monthly income:" line gone. |
| E5 | Fixed (in B) | Stale `CALENDLY_URL` sentinel, dead branch, comments and "once the Calendly link is connected" copy removed alongside B2. |
| F1b | Hardened, **Needs-Damian-Input** | No endpoint invented. With `LEAD_ENDPOINT` empty, the mailto path now also shows an honest on-page panel ("Your email app should have opened… if it didn't, book a free call") instead of "on its way". |
| F1a | **Needs-Damian-Input** | Untouched; guard self-disables. |

Verification after B: booking, director-calculator, pension-calculator → **0 FAIL**; calculator maths check still exact (101,685 = 101,685); Calendly ready-branch still verified. starter/tracker/director carry 1 FAIL each — C1, pre-existing, Category C.

## Category C — layout · commit `3f8d359`

| Code | Status | Note |
|---|---|---|
| C1 | Fixed | The unconditional 3-column `.pains` rule is now inside `@media(min-width:921px)`, so the ≤920px single-column rule wins. Screenshot-confirmed at 375: cards stacked with dividers, third card fully visible (was clipped off). |
| C2 | Fixed | Open drawer anchored at `top:100%` of the sticky nav on all 12 pages (booking and pension-calculator already were). Measured gap when scrolled: −1px (was 9px). |
| C3 | Fixed | The ≤380px `font-size:0` wordmark hiding removed from starter, tracker, director, glossary and both calculators; header now matches index at every width. |
| C4 | Fixed | Per-term `scroll-margin-top` removed on glossary; deep links from the calculators now land 17px below the header (was 113–123px). |
| C5 | Fixed | All five FAQ rows use the same text `+` marker. |
| C6 | Fixed (design call) | Chip label hidden at every width — see ISSUES.md for the reasoning. Nav fits the 1140px column at 1360 and above; no overrun at any width. |
| C7 | Fixed | Footer tap-target rule changed to `display:block` on all 12 pages; the redundant 11px margin zeroed on the same rule. Tool check `footerInlineLinks` = 0 everywhere. |
| C8 | Fixed | `a.gref` draws its dashed underline with `border-bottom`, and a tap-target hack (`display:inline-block;padding:13px 0;margin:-13px 0`) pushed that border a full line down. Two attempts at `a.gref` were silently beaten by a generic `p a:not(.btn):not(.aud-link), .lede a, …` tap-target rule of higher specificity (its multi-line selector hid it from grep); confirmed by reading computed styles in a real browser. Final rule matches that specificity (`p a.gref:not(.btn):not(.aud-link), .lede a.gref, … , a.gref{display:inline;padding:0 0 1px;margin:0}`) — inline text links are exempt from target-size minimums. Measured after: border 3px below the text on its own line. All 12 pages; screenshot-confirmed on director at 375. |
| C9 | Fixed | ≤600px footer `padding-bottom` raised 92→112px so the fixed "Ask Buddy" button (18px offset + ~52px + shadow) no longer sits over the last line of legal links. All 12 pages. |

Verification after C: **0 FAIL on all 12 pages** (full run with screenshots), then a no-screenshot re-run after C9 and a screenshot re-run on director/starter after the C8 correction. Measured at 375: clipped grids 0, colliding footer links 0, wordmark 20px (17px on the two calculators, which keep a mild ≤600px logo shrink), drawer gap −1px; at 1360: nav inside the column by 134px. Remaining warnings are all D / E3 / F2 / F3 / NEEDS-INPUT.

## Category D — accessibility · commit `293985b`

| Code | Status | Note |
|---|---|---|
| D1 | Fixed | `--ring` token changed from `rgba(11,122,110,.28)` (1.49:1) to `rgb(14,143,128)`: **3.99:1 on white**, ≈3.6:1 on the darkest band (`#1B2E2A`) — passes SC 1.4.11 on both. All 12 pages; every `:focus-visible` rule uses the token. |
| D2 | Fixed | `<a class="skip" href="#main">Skip to content</a>` is now the first element in `<body>` in the source HTML on all 12 pages; the runtime script no longer early-returns on it (its SVG `aria-hidden` and single-open FAQ duties still run — verified `svgUnhidden` = 0). |
| D3 | Fixed | Page content wrapped in `<main id="main" tabindex="-1">` on all 12 pages; runtime `id='main'` assignment removed; `#main:focus{outline:none}`. Verified in a real browser: activating the skip link leaves `document.activeElement` = `MAIN#main`. |
| D4 | Fixed | Both calculators: visually-hidden `#srSummary[aria-live=polite][aria-atomic]` updated once per change (debounced, after the tween) — e.g. "Projected pot at retirement €637,849. Estimated income €2,126 a month." Every slider carries `aria-valuetext` kept in sync ("€100,000", "40 years", "5%"). |

Verification after D: **0 FAIL on all 12 pages**; no runtime errors; calculator maths check still exact; Calendly still verified. Remaining warnings: F2, F3, E3, NEEDS-INPUT.

## Final gate — 2026-09-03

`python3 tools/verify.py` on all 12 pages (audits at 375 / 1360 / 1440px, full-page screenshots at 375 and 1440):

| Page | FAIL | WARN |
|---|---|---|
| 404, booking, director-calculator, director, glossary, index, pension-calculator, privacy, starter, tracker | 0 | 0 |
| complaints, terms | 0 | 1 — the marked A1 / A4 placeholders (NEEDS DAMIAN INPUT) |

Totals: **26 FAIL at baseline → 0.** Broken links/anchors 0 · runtime errors 0 · horizontal overflow at 375px 0 · text-contrast failures 0 · image decode failures 0 (all 7 index images, now served from `assets/img/`) · focus ring 3.99:1 · `<main>` landmark on 12/12 · calculator projection check exact (101,685 = 101,685) · Calendly ready-branch verified (script + CSS injected, fallback hidden, widget 984px, footer present).

Commits, in review order: `7b8799b` A · `ebf43c2` B · `3f8d359` C · `293985b` D · `e028438` E/F (tooling and backlog in `cbdccc1`, `2b78e19`). **Nothing has been pushed** — this environment has no GitHub credentials; run `git push -u origin main` from your own terminal.

Not done, deliberately: F4 / F5 / F6 (structural additions — see below), the two NEEDS-INPUT values, F1 endpoints. Review annually: the E2 Standard Fund Threshold constant.

## Category E — polish · Category F — structural · commit `e028438`

| Code | Status | Note |
|---|---|---|
| E1 | Fixed | The "2025 tax year" line under the countdown is now `#tkYear`, written from the same `taxYear` the heading uses, so the band can no longer contradict itself after 31 October. |
| E2 | Fixed, **confirm annually** | Both calculators show a Standard Fund Threshold notice (no figure in the copy) only when the projected pot exceeds a JS constant `SFT = 2200000` (2026 value under Finance Act 2024, stepping up to 2029 — commented for annual review); the D4 screen-reader summary gains "Above the Standard Fund Threshold." Glossary has a new `#standard-fund-threshold` entry, defined without a figure, which the notices link to. Tested: hidden at defaults, shown at maxed sliders, hidden again at minimums. |
| E3 | Fixed | index now uses the subpages' mobile-menu handler: Escape closes, `aria-label` flips "Open menu"/"Close menu", null-guarded. The subpages' Escape branch also now resets the label (parity fix). Tool: `escapeCloses` true on index. |
| E7 | Fixed | Five dead media rules removed from index and the three audience pages; all `.strip*` marquee CSS removed from the three pages that have no strip markup; the first FAQ's duplicate static wrapper removed. **`.aud-figure{order:-1}`: dead rule deleted rather than fixed** — the working version puts a content-free decorative tile above the H1 and pushes the headline and CTA ~330px below the 812px fold (checked on starter at 375). Residual: a dead `.callout{padding:44px 26px}` inside the ≤920 block on starter/tracker/director — harmless, left. |
| F2 | Fixed | `font-family:Fraunces,…` removed from `.pb-b-head .t` on all 12 pages; the Ask Buddy title inherits Sora. No "Fraunces" anywhere in source or at runtime. |
| F3 | Fixed | New `tools/extract-images.py` (stdlib + Pillow; SHA-256 dedupe; original JPEG bytes kept; WebP q80; `width`/`height` written to prevent layout shift; `<picture>` with WebP source and JPEG fallback; idempotent). `picture{display:contents}` keeps every existing `img` rule reaching the image. **index.html 476,032 → 125,862 bytes**; pension-calculator 166,056 → 144,091; director-calculator 175,054 → 153,090. `assets/img/`: buddy-avatar (17.3KB jpg / 9.1KB webp), damian-condon-portrait (52.6 / 28.8), damian-and-buddy-dublin-hills (97.4 / 78.5), damian-condon (17.4 / 10.5), buddy-beach (78.7KB jpg only — its WebP came out larger, so the script skipped it and emits a plain `<img>`). Pixel-diff of all 24 captures against pre-change copies: only the countdown digits differ; photos identical in crop, radius and position. The 3.7KB `AV` widget avatar stays inline by design. |
| E4 | Fixed (in A) | Stray "Last updated" removed from 404. |
| E5 | Fixed (in B) | Calendly placeholder sentinel, dead branch, stale comments and copy removed with B2. |
| E6 | Tracked as F1a / F1b | See NEEDS DAMIAN INPUT. |
| F1 | **Needs-Damian-Input** | Analytics provider and lead-form endpoint. Guards and honest fallbacks are in place; nothing is lost silently, but no lead reaches a backend until an endpoint is set. |
| F4 | **Deferred** — product decision | A qualifying form before Calendly changes the funnel's shape (what to ask, where it routes, how it affects booking rate). Calendly itself can carry custom questions on the event, which needs no code; if a site-hosted form is wanted it also depends on F1b. Not built in this pass. |
| F5 | **Deferred** — content decision | An About page needs content that only Damian can supply (career history, credentials, photo choices). `index.html#about` exists and is linked from every footer ("About Damian"), so the journey is not broken. Not built in this pass. |
| F6 | **Deferred** — depends on Calendly config + F1 | A thank-you page only becomes measurable once Calendly's "redirect after booking" is set to it and analytics (F1a) exists to record the conversion. Building the page alone would be dead weight. Not built in this pass. |
