# PensionBuddy — Fix Status

Tracks every code in `docs/ISSUES.md`. Verified with `python3 tools/verify.py`
(headless Chrome audit at 375 / 1360 / 1440px + full-page screenshots in
`verify-out/shots/`). Baseline before any fix: **26 FAIL** across 12 pages.

## NEEDS DAMIAN INPUT

| Code | Where | What is needed |
|---|---|---|
| **A1** | `terms.html` §5 Limitation of liability | The liability cap figure. Currently renders as a marked placeholder "€[amount to be confirmed]". Search for `data-issue="A1"`. |
| **A4** | `terms.html` and `complaints.html` Contact sections | (1) A phone number — currently a marked placeholder "[phone number to be confirmed]", search for `data-issue="A4"`. (2) Confirmation that `hello@pensionbuddy.ie` is a real, monitored mailbox — it is used on terms, complaints and privacy. |
| **F1a** | every page, `ANALYTICS_SRC` | Which analytics provider (Plausible / GA4 / none). The guard self-disables until set; nothing loads. |
| **F1b** | both calculators, starter, tracker, director — `LEAD_ENDPOINT` | A form endpoint (Formspree, Netlify Forms, CRM webhook). Until set, capture points open a pre-filled email and show an honest on-screen fallback. |

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
