# Interactive audit 2 — 2026-09-22

Audit only. Nothing on the site was changed. Branch
`claude/interactive-audit-2-efbbbb`, off `main` at `0a2461c`.

Locked rules applied throughout: Inter only, no mono, no caps, sentence case,
tabular figures; colour mapping dark = need, amber = gap, teal = State; no
invented figures; render-diff proof on protected pages; a static fallback for
every interactive element; locked disclaimer text.

**Protected** below means one of the five pages `tests/render-diff/pages.js`
drives: `pension-calculator`, `director-calculator`,
`broker-vs-autoenrolment`, `state-pension-reality-check`,
`state-pension-entitlement`. Also noted where they apply: the home page's
locked `#story` / `#damian` / `#adam` / `#buddy` sections, the v3 hero order
(headline, subcopy, CTA, trust line, phone), and copy Damian signed in V4-3/V4-4.

**Skipped as already interactive** (last build, `4a1dd6f`..`d71c1b9`): starter
floor bars; starter start-age slider; entitlement two methods on one scale;
entitlement band ladder; compare lanes naming their year; director salary/pension
split; reality-check jar as the control; compare cumulative total by 66. Also
skipped: everything that was already a live control before that build (every
calculator slider, toggle and tweened output, the countdowns, the director safe,
the tracker checklist, the guess veil, badges).

Method: every page's visible text was extracted from source (script and style
excluded, image alts and numeric ARIA labels included), 1,251 blocks over 18
pages, and read in full. Page lengths and mobile positions were measured in
headless Chrome at 375 and 1440.

---

## Part 1 — fact sweep

Verdict column: **Yes (#n)** = an interaction would teach it better, #n is its place in
the ranked list; **No** = static is right, with the reason; **Done** = interactive
already; **Needs figure (Nn)** = would teach better but needs a figure the site
does not carry.

### Sitewide chrome (all 16 root pages)

| Text | Verdict |
|---|---|
| Announce bar: "Regulated by the Central Bank of Ireland · Free first consultation" | No. See Part 2, regulatory lockup. |
| Nav chip: "-- to the tax deadline" | Done (live countdown). |
| Footer: "Pensionbuddy is a trading name of Damian Condon T/A Gresham Wealth Management, which is regulated by the Central Bank of Ireland. Registered office: Bushfield House, Philipsburgh Avenue, Fairview, Dublin 3…" | No. Regulatory, locked. |
| Footer: "The value of investments may fall as well as rise and you may get back less than you invested…" | No. Locked disclaimer. |
| "© 2026 Gresham Wealth Management." | No. |

### index.html

| Text | Verdict |
|---|---|
| "Damian Condon, QFA · 30 years looking after Irish savers" | No. Part 2 lockup: the Central Bank line is missing from this one hero. |
| Hero chat: "Twenty minutes to understand your situation and answer your questions." | No. |
| "Illustration only · the value of investments can fall as well as rise" | No. Locked. |
| Gap band: "€40,860 / What people expect to need", "€15,564 / What the State Pension pays", "€25,296 a year short" | **Yes (#6).** Animated on scroll, not interactive. Let the reader drag the need bar to their own figure; the gap re-measures against €15,564. |
| "79% feel unprepared." / "Amárach Research for FPSB Ireland, IOB, LIA and the RPCI, May 2026." | No. A survey share; nothing for a reader to move. |
| "Royal London Ireland, 2026." | No. Source. |
| Calc band: "Two minutes, no sign-up." | No. |
| Offer list: "Your company can fund your pension far beyond personal limits, and cut its tax bill doing it." | Partly (#7 draws the personal limit). The company side has no figure to draw: it is actuarial. |
| Deadline band: "Contributions for the 2025 tax year close on 31 October." / "…you usually have until mid‑November." / "Applies to anyone claiming relief for the 2025 tax year, including AVCs, self-assessed income and company directors." | Countdown done. **Yes (#2)** for what the band promises ("See what it's worth to you"): the relief widget belongs here. The exact online date is N6. |
| Story, Damian, Adam: "30 years", "founded Gresham Wealth Management in 2012", "graduated … this year" | No. Locked sections. |
| Expect: "Twenty relaxed minutes, phone or video." | No. |
| FAQ: "…what it is likely to be worth at 66…" | No. |
| Final: "Twenty minutes ends that." / "Twenty minutes. Phone or video. Free, with no pressure." | No. |

### starter.html

| Text | Verdict |
|---|---|
| H1: "No pension yet. Tax relief is there at any age." | **Yes (#2, #7).** "At any age" is exactly what the age-band ladder shows. |
| Credline: "Damian Condon, QFA · Regulated by the Central Bank of Ireland · 30 years in financial services" | No. This is the lockup the home hero lacks. |
| Chat / pain card: "Earlier gives money more time to grow, but starting now beats waiting longer…" / "starting now still makes a real difference." | Done (start-age chart). |
| Start-age chart: "€352,848", "€188,188 €164,659 less", "€87,102 €265,746 less", "Assumes 5% growth a year…" | Done. |
| Callout: "Pension contributions get tax relief, so some of what you'd have paid in tax goes into your future instead. Our calculator shows how much that could add up to." | **Yes (#2).** |
| "Your employer and the State pay into auto-enrolment. A personal pension pays you the tax relief instead." | **Yes (#14).** The 3 : 3 : 1 split, live. |
| Floor bars: "€15,564", "€299.30 a week", "€19,200", "€3,636 a year to find", "€33,600", "€18,036 a year to find" | Done. |
| Source: "…September 2024, single person. The maximum personal rate is €299.30 a week from January 2026." | No. Source line. |
| FAQ: "There's no single right number." | No. Deliberately figure-free; a number here is advice. |

### director.html

| Text | Verdict |
|---|---|
| Lede and chat: "Your business can contribute far beyond personal limits…", "…not the salary-percentage caps that limit personal contributions." | Partly (#7, static ladder for the personal side). Company side: actuarial, no figure. |
| "Personal pension contributions are capped as a percentage of salary." | **Yes (#7).** |
| "Money your company puts into your pension normally counts as a business expense…" | No here. The calculator's safe already animates 12.5%. |
| "Take it as salary and it is taxed three ways: income tax, USC and PRSI." (also FAQ) | **Yes (#25),** small. The full version is the calculator's split slider. |
| "Years of trading often create room to make large one-off contributions based on your salary and service." | No. Actuarial. |
| "54.6% Self-employed with pension coverage", "67.4% Employees with pension coverage", "CSO Pension Coverage, Quarter 3 2021" | No. Two shares; a stat row is the right form. **Flag:** 2021 data; worth checking for a newer CSO release. |
| "Two minutes, no sign-up." / FAQ "Twenty minutes, phone or video…" | No. |

### tracker.html

| Text | Verdict |
|---|---|
| "Most people who've changed jobs have pension money sitting somewhere, often more than they'd guess." / "Forgotten pensions are more common than you'd think." | **Needs figure (N5).** |
| "Roughly when you worked somewhere, and who for, is usually enough…" / "two, three or more employers" | No. |
| Trace checklist | Done. |
| FAQ: "Some older pensions carry valuable guarantees worth keeping…" | No. |

### glossary.html

| Text | Verdict |
|---|---|
| Tax relief: "…for every €100 you put in, around €40 can come back to you as relief, so it really costs you about €60. Relief is subject to Revenue's age-related limits." | **Yes (#2, #7).** The widget's natural home. |
| Drawdown: "The 4% figure you'll see in our calculator is a simple illustration of drawing 4% of your pot a year, not a recommendation." | **Yes (#23),** small. |
| Lump sum: "…a tax-free lump sum, within limits set by Revenue." | **Needs figure (N2).** |
| SFT: "…legislated to rise in steps from 2026 to 2029, and the current figure is best confirmed in conversation." | **Needs figure (N1).** Deliberately figure-free today. |
| State Pension: "…people who've enough PRSI contributions…" | No. The reality check's jar already teaches it; link is there. |
| Games: "Endless, three lives…", "eight Irish pension terms" | No. |
| AVC, ARF, Annuity, DC, DB, Fund growth, PRSA, Consolidation, Employer contribution, Corporation tax relief, QFA | No. Definitions, no figure. (Employer contribution touches #14.) |

### booking.html, thank-you.html, 404.html

| Text | Verdict |
|---|---|
| "Twenty minutes with Damian…", "It takes under a minute.", "20 minutes, that's it", "Three fields, none about money.", "If nothing arrives in a few minutes…" | No. Success motion is Part 2. |
| 404: no figures. | — |

### pension-calculator.html (protected)

| Text | Verdict |
|---|---|
| "two minutes, no sign-up" | No. |
| Subnote: "Revenue allows an age-related percentage of earnings, with earnings capped at €115,000." | **Yes (#7).** |
| Result foot: "…the State Pension may be payable on top." | **Yes (#11).** |
| Assumption: "…draw down 4% of your fund each year…" | No here: the income figure already moves with the pot. |
| Assumption: "…(15% under 30, rising in steps to 40% at 60 and over), with earnings capped at €115,000…" | **Yes (#7).** |
| Assumption: "The State Pension (Contributory) may be payable on top, roughly €15,000 a year for a full entitlement. Check gov.ie for the current rate." | **Yes (#11).** **Flag:** every other page says €15,564. |
| Assumptions on inflation and charges; "A free 20-minute chat." | No. |

### director-calculator.html (protected)

| Text | Verdict |
|---|---|
| "…every contribution is an allowable expense for the company." | No. |
| "Worth 12.5% of each contribution, added up to retirement" | Done (the safe). |
| "lands in your pocket after up to 52% income tax, USC and PRSI" / assumption "(40% income tax, 8% USC, 4% PRSI)" | **Yes (#21),** as three segments. **Flag:** check the 4% PRSI figure against the current Class S/A rate before building on it. |
| Split slider | Done. |
| Max card: "…up to two-thirds of salary (with sufficient service)… For older directors it can run well into six figures." | No. `#maxOut` is already live; the rest is actuarial. |
| Assumption: "…up to 25% of the fund may usually be taken as a tax-free lump sum, within limits." | **Needs figure (N2)** for the limit. |
| "Free 20-minute call, no pitch." | No. |

### broker-vs-autoenrolment.html (protected)

| Text | Verdict |
|---|---|
| H1: "Auto-enrolment gets no tax relief. A pension through a broker does." | Done (vs-card and lanes show it). |
| "Auto-enrolment works on salary up to €80,000. Above that it takes nothing." | Done (money-above-the-cap card). |
| "Rates rise in three-year steps." / assumption "1.5% employee, 1.5% employer and 0.5% State in years 1 to 3, rising in three-year steps to 6%, 6% and 2% from year 10. The ratio is always 3 employee to 3 employer to 1 State." | **Yes (#19).** |
| "Sets where your tax moves from 20% to 40%…" / assumption "€44,000 single, €53,000 … €88,000 … at least €35,000…" / "relief at 40% on the part … above your standard rate cut-off point and at 20% on the rest" | **Yes (#16).** |
| Assumption: "…(15% under 30, rising in steps to 40% at 60 and over), with earnings capped at €115,000…" | **Yes (#7).** |
| Cumulative card: "…grown at 5% a year." | Done. |
| Risk card: "from 1 (lowest) to 7 (highest)…" and the three illustrations | **Needs figure (N3).** The figures exist but are unsigned placeholders (STATUS R1/R2). |
| srcwarn: "Checked against gov.ie on 10 September 2026…" | No. |
| "My Future Fund does not currently accept contributions above its set rate…" / payroll pay-period note | No. Rules with nothing to vary. |
| "Eligibility for auto-enrolment … depends on your age, earnings…" | **Needs figure (N8).** |
| "One year, at your salary and age." / "free 20-minute chat" | No. |

### state-pension-reality-check.html (protected)

| Text | Verdict |
|---|---|
| Subnote: "Reckonable means all three kinds added together… 2,080 is a full forty years." | Done (jar and slider). |
| Result: "€299.30", "€15,564", "The maximum rate, which takes a full 2,080 reckonable contributions." | **Yes (#4).** A sentence from the reader's own count. |
| No-entitlement foot: "Below 520 contributions, ten years…" | Done (jar). |
| Living standards: "€19,200", "€27,600", "€33,600 a year" | Done (bars). |
| "The shape of it: 2,080 … €299.30 a week … 520 paid … pro rata share." | Done (jar). |
| "One honest caveat. Until the transition finishes, the Department calculates this two ways…" / assumption "Until 2034…" | No here; #8 teaches it on the entitlement page, which this links to. |
| "Credited contributions are themselves capped at 520." | No here; #10 on the entitlement page. |
| "…the higher rate that applies from age 80." | **Needs figure (N7).** |
| "Couple figures are higher in total and lower per person, and are not shown here." | **Needs figure (N4).** |
| "52 weekly payments", "2024 prices…", "Figures checked 9 September 2026.", "free 20-minute chat" | No. |

### state-pension-entitlement.html (protected)

| Text | Verdict |
|---|---|
| Lede: "Until the end of 2033 … works a … rate out two ways and pays whichever is higher." | Done (both bars). |
| Birth note: "You reach 66 in 2028, the year this page assumes your pension starts. That year sets the mix of the two calculations." | **Yes (#8).** |
| Entry note: "Before 2002 the contribution year ran from April to April…" | **Yes (#27),** Damian's open S11 item 4. |
| Paid note: "Every 52 is a year. The pension needs at least 520 of these…" | No. It is a slider. |
| Credits note: "…in full under the Yearly Average method and up to 520 under the TCA." / HomeCaring note "…up to 1,040, and up to 1,040 combined with credited contributions." | **Yes (#10).** |
| Method 1 detail: "1,820 reckonable contributions, 87.5% of a full record of 2,080." | **Yes (#10):** show which parts counted and which the caps cut. |
| Method 2 detail: "…the mix is 60% of that rate and 40% of the Total Contributions Approach rate." | **Yes (#8).** |
| Bars and closing sentence; band ladder | Done. |
| Explainer: "…the Yearly Average share falls ten points a year, from 90% for a pension starting in 2025 to 10% for one starting in 2033… From 2034 only the Total Contributions Approach applies." | **Yes (#8).** |
| "Starting later, at 67 to 70, … is not modelled." | No. Deferral is out of scope. |
| "…first paid PRSI before 56. This page does not check that…" | No. Checking it changes the maths; locked. |
| Rounding half up; Homemaker's Scheme; Alternative Yearly Average (1979, 48); voluntary contributions; year of 66; mixed-rate records; pre-2025 pensions; "age 80"; "€299.30 … 2026 rates"; "SW19, page 33 … checked 11 September 2026" | No. Exclusions and sources; nothing to move. |

### games/buddys-run.html, games/jargon-battle.html

| Text | Verdict |
|---|---|
| "Three lives, and it gets faster the better you do." / "eight Irish pension terms" / "keys 1 to 4" | No. |
| Buddy's Run, the nine "Buddy's fact" lines (relief costs about sixty; fifteen to forty per cent; 520 paid; 31 October; and the rest) | **Yes (#24),** small: each fact links to where it moves. **Flag:** "Ten years of paid PRSI, 520 contributions, is the floor…" uses *floor*, which CONTEXT.md reserves for a guaranteed lower bound; the term is *qualifying minimum*. |
| Jargon Battle bank, State Pension: "A full personal rate comes to roughly €15,000 a year." | No. **Flag:** €15,564 elsewhere. |
| Bank: "Pay and File deadline (31 October)", "1 at the lowest to 7 at the highest" | No. |

### terms.html, privacy.html, complaints.html

| Text | Verdict |
|---|---|
| "Last updated: 9 July 2026" (terms, privacy); "Last updated: June 2026" (complaints) | No. |
| terms: "…capped at €[amount to be confirmed]." | No. Existing A1 placeholder, still open. |
| complaints: "…normally within five business days."; FSPO "Lincoln House, Lincoln Place, Dublin 2, D02 VH29. Phone 01 567 7000." | No. |
| privacy: "The pension calculators on this site run entirely in your browser. The figures you enter into them are not sent to us or stored…" | No. **Constrains Part 2 cross-page memory.** |

### Flags found in the sweep (not interactions)

1. **€15,000 vs €15,564.** `pension-calculator.html:1727` and `assets/js/pb-jargon-bank.js:138` say "roughly €15,000 a year"; every other page says €15,564.
2. **"Floor" for the 520 rule** in Buddy's Run's fact list, against CONTEXT.md.
3. **4% PRSI** in the director calculator's 52%: worth confirming against the current rate before any build draws it.
4. **CSO Q3 2021** on director.html: worth checking for a newer release.
5. **Home hero** carries QFA but not the Central Bank line; the audience heroes carry both.

---

## Part 2 — design cues not yet on the site

| Cue | Verdict | Where | Why |
|---|---|---|---|
| Scrollytelling | **Yes, later** | starter.html, one pinned section, "first payslip to 66" | Every step can come from figures the site already carries: 52 contributions a year, 520 at ten years, 2,080 at forty, the relief limit stepping 15% to 40%, auto-enrolment's 1.5% to 6%, and the start-age projection at the page's own €300 and 5%. CSS `position:sticky` plus an IntersectionObserver per step; reduced motion and no-JS get the steps as a plain list. It is L effort and overlaps the start-age chart, so it ranks below the smaller wins (#17). |
| Chapter nav | **No, as asked. Yes for glossary and entitlement, differently.** | glossary: sticky term index; entitlement: a jump row under the result | Measured at 1440: starter 6,909px with 9 h2s, director 5,866px with 6. Both are single-path pages that end at a booking button, and a side rail needs width the 1140px column does not leave below ~1360px. Entitlement is 5,592px (11,196 at 375) but has **two** h2s: a jump row ("How it's worked out", "Assumptions") beats a rail. Glossary has **19** terms on one page (7,827px at 375): that one earns an index. A scroll-spy already exists in the page scripts (`rootMargin:'-45% 0px -50% 0px'`) and can be reused. (#22) |
| Try-before-you-book | **Yes** | Home hero, as one turn inside the existing phone, so the v3 hero order stands; the same widget in the deadline band, glossary and starter callout | One input (a monthly amount), one output in a sentence: "€100 into your pension costs you about €60 at the higher rate" (the glossary's own example, worked by `PBRelief`). It hands the amount to the pension calculator through the URL **fragment** (`#monthly=100`): a fragment never reaches the server, so the privacy notice stays true. The phone's words must be signed copy (run 15 rule). (#2) |
| Cross-page memory | **Yes, opt-in only** | All five calculators and starter's slider | **Carry:** age now (pension, director, compare, reality check); gross salary (pension "annual earnings" ↔ compare "gross salary"); monthly contribution (starter → pension); growth rate (pension ↔ director). **Must not carry:** a guess (it has to be blind); the reality check's reckonable total into the entitlement check's *paid* (CONTEXT.md: never a synonym); age into birth year (off by one either side of a birthday); the 20/40 toggle into compare's tax status (different model); employer € a month into employer % of salary (different units); anything from the director calculator into the employee pages; **anything at all into booking.html or the Calendly link** (the booking page promises "We do not ask what you earn…"). The privacy notice says figures are "not sent to us or stored", so this needs a visible "Remember my figures on this device" switch with a Forget link, and Damian's wording change to that sentence. (#12) |
| Personal result sentence | **Partly there** | Missing on pension calculator, director calculator, reality check | Compare already has "In one sentence"; entitlement has its closing sentence; the pension calculator has "The cost of waiting". The headline results are bare figures. Build from outputs only, "could" never "will" (CONTEXT: illustration). (#4) |
| Regulatory lockup | **Yes, typographic** | Home hero trust line; same lockup on audience heroes, replacing the credline text | The line exists three times as text (announce bar, audience credlines, footer) but the home hero carries QFA without the Central Bank line. One mark: "Damian Condon, QFA · Regulated by the Central Bank of Ireland", linked to registers.centralbank.ie. Keep "regulated": the brief says "authorised", and the site never does; changing the word is Damian's call. No Central Bank crest or logo (regulated firms may not use it) and no QFA badge without the LIA's say-so. (#3) |
| Success micro-interactions | **Yes, small** | Guide forms (starter, director, tracker), calculator email forms, booking qualifier | Today the email success swaps `display:none` for `block` (the `role="status"` is right, the change is invisible); the booking qualifier collapses with no confirmation; the pension calculator's result has a 2px `resPulse`. Add a drawn tick (SVG stroke, ~300ms) and focus on the success heading; nothing under reduced motion. (#15) |
| Mobile: bottom sheet and thumb reach | **Yes for the peek; thumb reach is fine** | All five calculators below 921px | Measured at 375: the headline figure sits **1,160px** below the first slider on the pension calculator, 1,150 on director, 1,430 on compare, 1,010 on the reality check, 1,600 on entitlement, against an 812px screen. Nobody sees a figure move while dragging. A peek bar pinned to the bottom carrying the headline figure, shown while the inputs are on screen, hidden once the results are, mirroring the existing result element by `MutationObserver`, so no calculator write changes. Must not collide with the fixed Ask Buddy button. Sliders are 48–52px tall: thumb reach is already met. (#1) |
| Reference sites | See below | | |

### Reference sites

The captures are in `~/Downloads`, not a `/refs/` folder: Stripe, Plaid, Ramp,
Revolut, Klarna, Lemonade and, found on 2026-09-22 under the name "Online
Business Banking For Startups, Small Businesses & Scaling Companies", Mercury.

Each capture was sliced into 52 pieces and read, and each saved page's markup
was searched for what a still frame cannot show. Where the evidence is markup
only, it says so. Patterns the site already has were checked off and left out:
huge-type offering list, borderless stat rows, full-bleed bands, real product
shots, hero phone, logo-free marquee, FAQ accordions, three-step "how it
works", the trust block with the register link, warnings beside claims,
audience chips, email capture, count-ups, floating help, top strip, cookie bar,
glossary.

| Pattern the site lacks | Seen on | Fit | Rank |
|---|---|---|---|
| Closable booking bar pinned to the bottom on mobile | Klarna (capture), Revolut (page data), Ramp (top variant) | Content pages only, appears once the hero scrolls off, hides near the final band | #5 |
| Clickable figures: a row of figures as buttons, the chosen one dark, the explanation and source below swap | Stripe, global band (capture and markup) | The gap band's three figures | #6 |
| "What it costs" card beside the closing call to action | Stripe, Revolut, Lemonade | Beside the home page's final band, built only from the Terms of Business wording ("fee, commission or a mix", set out in writing before any work) | #9 |
| Tabs that swap the product picture | Revolut, Klarna (markup: one image per tab) | The dark product band: one tab per calculator | #13 |
| Mess-to-order: scattered fragments tidy into one card on scroll | Ramp (capture; the motion is inferred from markup) | tracker.html: old statement, P60, unopened envelope, settling into one summary card. CSS transforms, no library | #18 |
| Annotated product shot: two or three arrows with short labels | Lemonade | The existing calculator shot: the relief line, the monthly figure, one slider | #20 |
| Two-tone headline, second sentence muted in the same line | Stripe, Ramp (markup) | Most headings here are already two sentences in one colour. Needs an AA-contrast muted token | #26 |
| Giant wordmark at the base of the footer | Klarna | Decorative, `aria-hidden` | #28 |
| Client reviews block (named cards, "these are hand-picked" line) | Klarna, Lemonade, Ramp, Stripe | After "What to expect". `.tcard` testimonial styles already sit unused in index.html's CSS | N9 |
| Independent rating as a figure in the trust row | Klarna, Revolut, Lemonade | Hero trust line | N10 |
| Case-study accordion with outcome figures | Stripe | After the offering list | N11 |
| Press or membership logo strip | Lemonade, Stripe, Ramp, Plaid | Under the hero. Never provider logos (implied endorsement) | N12 |
| Drifting pill list on a dark band | Plaid (markup) | The pension types Damian advises on | N13 |

Seen and not recommended: a live running total in the hero (competes with the
countdown and needs a defensible source); a rotating hero; scroll-scrubbed
video (ruled out by the brief); a spinning gradient ring round the main button;
offer cards that open into a pop-up (overlaps the offering list).


### Mercury, added 2026-09-22

Most of Mercury's page came out blank in the capture: every section starts
invisible and fades in at 35% up the screen, which never happened during the
capture (a warning for any reveal here: keep content visible without script).
Evidence is the hero, the footer and the saved markup, CSS and JS. None of
these needs a new figure.

| Pattern | Evidence | Fit | Build list |
|---|---|---|---|
| "Show the workings": a collapsible breakdown under the headline result | Fee-calculator chunk shipped with the homepage (`CollapsibleTrigger`, 600ms) | Under each calculator's one-sentence result, from the calculator's own intermediate values | **#29** |
| "Share results": inputs kept in the link, a copy button that reads "Copied" | Same chunk (`urlKeys`, clipboard helper, 2s reset) | All five calculators, inputs after the `#` so they never reach a server | **#30** |
| Closing fork: a last line, the CTA, then situation cards, each one next step | `data-section="wayfinding-module-record"` | Home, before the final band: the hero chat's three personas as cards | **#31** |
| Mega-menu with a one-line description per item and "Jump to" links | Capture (nav) and markup | A "Calculators" dropdown naming the five tools | **#32** |
| The page's colour fades between bands as you scroll | `data-theme` on 11 sections, `.transition-theme{transition-duration:.5s}` | Home only, into and out of the dark product band | **#33** |
| Grain over dark areas, off for reduced motion | `styles_grainSvg` (feTurbulence) | The dark bands, static (no jitter), ~1 KB inline SVG | **#34** |
| Numbered footnotes on claims | Superscripts linked to a notes list | **Not queued.** Every figure here already carries its source directly beneath it, which a footnote would move further away | — |
| Feathered blur behind text on a photo | `styles_featheredBlur` | **Not queued.** No text sits on a photo anywhere on the site | — |

---

## Part 3 — ranked

Ranked by: does it teach the number, or move someone toward booking.
**Effort** S = one page, no new module; M = a shared component or a protected
page with render-diff proof; L = a multi-step motion section.

| # | Item | Where | Teaches / moves | Effort | Protected | New figure |
|---|---|---|---|---|---|---|
| 1 | **Results peek bar on mobile.** The headline figure pinned to the bottom while the inputs are on screen. It mirrors the existing result cell by `MutationObserver`, so no calculator write changes. It joins pb-guess's veil list, and it must not collide with Ask Buddy | All five calculators, below 921px | Every calculator lesson. At 375 the result sits 1,000–1,600px below the first slider | M | Yes | No |
| 2 | **Relief widget, "try before you book".** One amount in, one sentence out: "€100 into your pension costs you about €60 at the higher rate", worked by `PBRelief`. It opens the pension calculator with the amount through the URL fragment, which never reaches the server | Home hero as a turn in the phone (so the v3 order stands); deadline band; glossary Tax relief; starter callout | The site's most repeated number, then into the calculator | M | Yes (the pension calculator's load reads the fragment; with no fragment, load is identical) | No |
| 3 | **Regulatory lockup.** "Damian Condon, QFA · Regulated by the Central Bank of Ireland", linked to the register. Typographic only: no Central Bank crest, no QFA badge | Home hero trust line; the same mark on the audience heroes | Booking: trust at the button | S | No | No |
| 4 | **Personal result sentence**, built from outputs, "could" not "will", on the veil list | Pension calculator, director calculator, reality check (compare and entitlement already have one) | Makes the headline figure the reader's own | S each | Yes | No |
| 5 | **Closable booking bar on mobile** (Klarna) | Home, starter, director, tracker, glossary; never on calculators, where #1 has the bottom edge | Booking | S | No | No |
| 6 | **Gap band made explorable.** Drag "what you expect to need" to your own figure, and the gap re-measures against €15,564. Tap a figure for its source (Stripe). The markup keeps the survey chart for no-JS and reduced motion | index.html `#gap` (V4-3 copy stays as signed) | The gap, personally; ends at the booking link | M | No | No |
| 7 | **Relief limit ladder.** Six steps from 15% to 40%, the reader's age marked, their limit in euro from `PBRelief.reliefLimit`, earnings capped at €115,000. Static version on the marketing pages | Pension calculator and compare (live); starter, director, glossary (static) | "Tax relief at any age", "personal limits" | M | Yes | No |
| 8 | **Transition glide.** 2025 to 2034, the Yearly Average share falling from 90% to 10% then gone, the reader's drawdown year marked from their birth year (`YA_SHARE`) | Entitlement, beside the birth-year note | Why the year you turn 66 matters | S | Yes | No |
| 9 | **"What it costs" card** (Stripe, Revolut, Lemonade): first chat free, then fee, commission or a mix, agreed in writing first. Words from the Terms of Business only | Home final band | Booking: answers the unspoken question | S | No | No |
| 10 | **What counts under TCA.** The reader's record as one stacked bar: paid, credits up to 520, HomeCaring up to 1,040, the capped-off part greyed with its count | Entitlement, under Method 1's detail | The caps, on the reader's own record | M | Yes | No |
| 11 | **State Pension on top.** Monthly income with and without a full-record State Pension (€15,564 ÷ 12 from `PBStatePension`), linked to the reality check. Also retires the "roughly €15,000" line (a copy change) | Pension calculator result | Answers "is that all I get?" | M | Yes | No |
| 12 | **Cross-page memory, opt-in.** "Remember my figures on this device" with a Forget link. Carries age, employee gross salary, monthly contribution and growth, and nothing else (Part 2 lists what must not carry) | All five calculators and starter's slider | Less retyping, more calculators finished | M | Yes (every load path) | No. Needs Damian's wording for the privacy notice |
| 13 | **Product tabs** (Revolut, Klarna): one tab per tool on the dark band, each swapping its screenshot and one line | index.html `#calc` | Shows all five tools; into a calculator | M | No (the protected pages are only photographed; three new shots via `shoot-product.py`, then re-stamp) | No |
| 14 | **Auto-enrolment split, live.** A monthly amount showing yours, your employer's and the State's at this year's phase, always 3 : 3 : 1 (`AE_PHASES`) | starter.html "Already being auto-enrolled?" | "Your employer and the State pay into auto-enrolment" | S | No | No |
| 15 | **Success motion.** A drawn tick and focus moved to the success heading; nothing under reduced motion | Guide forms, calculator email forms, booking qualifier | Confirms the step; booking | S | Partly (the email forms sit on two protected pages, outside the calculations) | No |
| 16 | **Where 20% becomes 40%.** The reader's salary as a bar with the cut-off marked for their status (€44,000 / €53,000 / up to €88,000, from `PBRelief.SRCOP`) | Compare, beside the status buttons | Why relief splits across two rates | M | Yes | No |
| 17 | **Scrollytelling, "first payslip to 66".** One pinned section: 52 a year, 520 at ten years, 2,080 at forty, the relief limit stepping up, the start-age projection at the page's €300 and 5%. Reduced motion and no-JS get a plain list | starter.html | Several numbers in order | L | No | No (example inputs are the page's own defaults, captioned "Example figures.") |
| 18 | **Mess to order** (Ramp): old statements settle into one card on scroll. Choose this **or** #17 if only one pinned section is wanted | tracker.html | Tracker readers see themselves; booking | M | No | No |
| 19 | **Phase staircase.** Four steps, 1.5% to 6%, the current year's step lit, driven by the existing year slider | Compare assumptions | "Rates rise in three-year steps" | S | Yes | No |
| 20 | **Annotated product shot** (Lemonade): two or three arrows naming the relief line, the monthly figure, one slider | Home `#calc`, starter callout | Where to look | S | No | No |
| 21 | **52% as three segments** (40 income tax, 8 USC, 4 PRSI) in the salary column. **Blocked** on confirming the PRSI rate | Director calculator | Why salary loses half | S | Yes | No, but an existing figure to re-check |
| 22 | **Glossary term index; entitlement jump row** (the chapter nav, where it earns its place). Reuses the existing scroll-spy | glossary.html; entitlement under the result | Navigation | S | Entitlement yes (markup only) | No |
| 23 | **Drawdown at 4%.** A pot in, a monthly figure out, with the page's "not a recommendation" line | Glossary Drawdown | The 4% | S | No | No |
| 24 | **Buddy's facts link to where they move** (the source page is already named per fact). Fix "floor" in the 520 fact while there | games/buddys-run.html | Game into the live tool | S | No | No |
| 25 | **€1,000 of profit, two ways.** A two-state toggle; the full version is the calculator's split | director.html benefit card | Salary against pension | S | No | No |
| 26 | **Two-tone headlines** (Stripe, Ramp) | Sitewide headings, locked sections excepted | Scanning | S | No | No |
| 27 | **"Before 6 April?"** control for pre-2002 entry years. Your open S11 item 4 | Entitlement entry year | Removes a known one-year error | S | Yes (a new input to the module, not new maths) | No |
| 28 | **Footer wordmark** (Klarna) | All footers | Cosmetic | S | No | No |
| 29 | **Show the workings** (Mercury): a collapsible breakdown under each result sentence, the calculator's own intermediate values | Pension, director, reality check | Teaches how the figure is made | S | Yes | No |
| 30 | **Share results** (Mercury): copy a link to these figures, inputs after the `#` | All five calculators | Brings the scenario to the call | M | Yes | No |
| 31 | **Closing fork** (Mercury): three situation cards before the final band | Home | One next step at the end | S | No | No |
| 32 | **Calculators dropdown** (Mercury) in the nav, one line per tool | Sitewide nav | Wayfinding to the tools | M | Yes (nav is shared) | No |
| 33 | **Colour fade between bands** (Mercury) | Home | Cosmetic | S | No | No |
| 34 | **Static grain on dark bands** (Mercury) | Dark bands | Cosmetic | S | No | No |

**Not recommended:** a sticky side rail on starter and director (both are
single-path pages ending at a booking button; 6,909px and 5,866px at 1440, 9
and 6 h2s; the 1140px column leaves no room for a rail below ~1360px). The
refs' rejects are listed above.

### Needs a new figure or new material, with the source

| # | Item | Where | Source it would need | Effort | Protected |
|---|---|---|---|---|---|
| N1 | SFT step chart, 2026 to 2029. €2.2m is already in `director-calculator.html:1972` and was deliberately not shown; the later steps are not on the site | Glossary; director calculator's SFT note | Finance Act 2024; Revenue Pensions Manual, SFT chapter | M | Director calculator yes |
| N2 | Lump sum: the 25% is on the site, the tax-free limit is not | Glossary; director calculator assumptions | Revenue, retirement lump sum limits | S | Yes |
| N3 | Risk levels as a picker. The six figures exist but are unsigned placeholders | Compare risk card | The fund ranges Gresham can arrange (STATUS R1/R2) | M | Yes |
| N4 | Couple toggle on the living standards | Reality check | Pensions Council, Irish Retirement Living Standards, Sept 2024, couple figures | M | Yes |
| N5 | How common forgotten pensions are | tracker.html | A published estimate: Pensions Authority or an industry survey | S | No |
| N6 | The exact online filing date in the deadline band and the countdown | Home band, nav chip | Revenue's yearly Pay and File announcement | S | No |
| N7 | The increase from age 80 | Reality check and entitlement assumptions | DSP, Rates of Payment 2026 (SW19) | S | Yes |
| N8 | Auto-enrolment eligibility check (age and earnings) | Compare | gov.ie or NAERSA | M | Yes |
| N9 | Client reviews block | Home, after "What to expect" | Genuine clients, with consent; compliance check | M | No |
| N10 | Independent rating in the trust row | Home hero | A genuine third-party score | S | No |
| N11 | Case studies with outcomes | Home | Real, anonymised cases; compliance sign-off | M | No |
| N12 | Membership or press logos | Under the home hero | Genuine memberships or coverage only | S | No |
| N13 | Pension types as drifting pills | Home dark band | Damian's own list of what he advises on | S | No |
