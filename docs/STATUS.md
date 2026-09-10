# PensionBuddy — Fix Status

Tracks every code in `docs/ISSUES.md`. Verified with `python3 tools/verify.py`
(headless Chrome audit at 375 / 1360 / 1440px + full-page screenshots in
`verify-out/shots/`). Run-1 baseline before any fix: **26 FAIL** across 12 pages.

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
