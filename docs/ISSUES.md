# PensionBuddy — Consolidated Issue Backlog

Merged from two audit reports on 2026-09-03. Original issue codes are preserved
so progress stays traceable. Report 1 is the full bug audit (A–E). Report 2's
structural/strategic gaps were provided in summary form only and are logged
here as F-codes.

Fix order (as both reports proposed): **A → B → C → D → E → F**. One git commit
per category. No issue is marked fixed without a passing run of
`tools/verify.py` and, for visual fixes, a fresh screenshot at 375px and 1440px.

Status is tracked in `docs/STATUS.md`, not here.

---

## A. Legal / content blockers (publish blockers)

Files owned by this pass: `terms.html`, `privacy.html`, `complaints.html`, `404.html`.

| Code | File:line | Issue | Fix |
|---|---|---|---|
| **A1** | `terms.html:1547` | `€[LIABILITY_CAP_EUR]` renders literally in the liability clause (§5). | **NEEDS DAMIAN INPUT** — the figure is a business decision. Replace with a clearly-marked placeholder that does not read as a broken token, flag in STATUS.md. |
| **A2** | `terms.html:1495`, `terms.html:1530`, `privacy.html:1495`, `complaints.html:1494` | Four internal template notes render publicly: "Template document…", "Draft for legal review… including the liability cap figure in section 5", "Template notice…", "Template process…". | Remove all four blocks. |
| **A3** | `privacy.html:1490`+`1492`, `terms.html:1490`+`1492` | Two contradictory "Last updated" dates on each page ("June 2026" and "9 July 2026"). Terms §8 explicitly refers to "the date at the top of this page". | Keep a single line with the later date. |
| **A4** | `complaints.html:1513`, `terms.html:1523` | Unfinished contact block with live `<!-- DEVELOPER: replace the two placeholders -->` comment. "Phone:" renders as "book a call"; email is `hello@pensionbuddy.ie` (unconfirmed). Terms §10 points readers at contact details that don't exist. | **NEEDS DAMIAN INPUT** for phone + email confirmation. Remove the developer comment; restructure the block so it reads correctly with or without a phone line; flag in STATUS.md. |
| **A5** | `404.html:1509` | 404 page carries the complaints page's disclosure paragraph. | Replace with the generic site disclosure used on index. |
| **A6** | `privacy.html:1523`, `privacy.html:1529` | Privacy Notice publishes no email or postal address; data-subject rights route to the Calendly page. Terms and complaints both publish the registered address. | Add the registered office address (already public on every footer) and the contact email placeholder shared with A4. |

## B. Functionality

Files owned by this pass: `pension-calculator.html`, `director-calculator.html`, `booking.html`, `starter.html`, `tracker.html`, `director.html` (lead endpoint only).

| Code | File:line | Issue | Fix |
|---|---|---|---|
| **B1** | `director-calculator.html:2355` | `KEEP=['age','ret','pot','mine','salary','contrib']` — the salary slider's id is `sal` and `mine` belongs to the other calculator. The salary control gets collapsed into "More options" at 0px height while the page headlines the figure it drives. | Correct the array to `['age','ret','pot','sal','contrib']`. |
| **B2** | `booking.html:1418` | No failure path when Calendly's `widget.js` fails to load (ad blocker, CSP, outage): blank 680px box, fallback link stays hidden. | Add `onerror` + a load timeout that reveals the fallback panel and its link. |
| **B3** | `booking.html:1399` | No 4-column footer at all — booking is the only page with zero links to `director-calculator.html`. The `.foot-top` CSS is also absent from this file. | Port the shared footer markup **and** its CSS from a sibling page. |
| **B4** | `pension-calculator.html:1702` | Tax relief is a flat 20/40% on the whole contribution. The page copy (line 1558) promises Revenue's age-related limits and the €115,000 earnings cap, but there is no earnings input so neither can be applied. | Add an earnings input, apply the age bands (15/20/25/30/35/40%) and the €115k cap to the relievable amount, and show the capped figure. |
| **B5** | `pension-calculator.html:1705` | Over-cap warning fires only above €46,000/yr — the age-60+ maximum. Under-60s never see it. | Superseded by B4: warn when the contribution exceeds the user's actual band. |
| **B6** | `director-calculator.html:1860`, `:1866` | Corporation tax saving is presented as exclusive to the pension route. Salary is equally deductible, so against "taken as salary instead" the incremental CT saving is nil; the hero tile claims €90,000 saved. | Reframe: keep the CT-deductibility fact, drop the "saved vs salary" framing, remove the misleading hero tile or relabel it honestly. |
| **B7** | `director-calculator.html:1900`, `pension-calculator.html:1780` | Cross-wired lead payloads read ids that only exist on the other page (`incOut` / `taxOut`); emailed results include a dangling "Estimated monthly income:" line. | Each page reads only its own result ids. |
| **F1a** | all pages, e.g. `index.html:1871` | `ANALYTICS_SRC='[ANALYTICS_SCRIPT_URL]'` — analytics self-disables. | **NEEDS DAMIAN INPUT** (which provider). Leave the guard in place; document in STATUS.md. |
| **F1b** | `pension-calculator.html:1446`, `director-calculator.html:1610`, `starter.html:1489`, `tracker.html`, `director.html` | `LEAD_ENDPOINT=''` — every capture point falls back to a `mailto:` link, which silently loses the lead on devices with no mail client. | **NEEDS DAMIAN INPUT** for the endpoint URL. Harden the fallback so the visitor is never left with a dead button: show the figures on screen and offer the booking CTA when no endpoint is set. |

## C. Layout / visual

Files owned by this pass: `index.html`, `starter.html`, `tracker.html`, `director.html`, `glossary.html` (CSS only).

| Code | File:line | Issue | Fix |
|---|---|---|---|
| **C1** | `index.html:879`, `starter.html:987`, `tracker.html:983`, `director.html:987` | A later unconditional `.pains{grid-template-columns:repeat(3,1fr)}` overrides the ≤920px `1fr` rule. Measured at 375px: three ~150px columns, ~99px usable text, and **the third card clipped off entirely** by `overflow:hidden`. | Move the 3-column rule inside a `min-width` query or re-declare the single-column rule after it. |
| **C2** | `index.html:260`, subpages `:261` | Open mobile drawer is pinned `top:72px`; the header shrinks to 62px on scroll. Measured 9px gap. | Anchor the drawer at `top:100%` of the nav. |
| **C3** | `starter.html:413`, `tracker.html:413`, `director.html:413`, `glossary.html:412` | `font-size:0` hides the "Pensionbuddy" wordmark at ≤380px on these four pages only. | Remove the rule so the header matches index. |
| **C4** | `glossary.html:595` + `:418` | `scroll-margin-top:96px` stacks with `scroll-padding-top:90px`; deep links land ~162px below the header. | Drop the per-term `scroll-margin-top`; rely on `scroll-padding-top`. |
| **C5** | `index.html:1658` vs `1661–1664` | First FAQ row uses an SVG plus icon; the other four use a text `+`. | Make all five identical. |
| **C6** | `index.html:1153` and subpage equivalents | Between ~1321–1405px the nav needs ~1226px inside a 1092px box; the CTA clips. | Hide the chip label up to ~1420px (or let the chip wrap). **Decision taken:** with the label the nav needs ~1258px and can never fit the 1140px column at any width, so the label is hidden at every width — consistent with what every viewer under 1320px already saw. The countdown chip keeps its full `aria-label`. |
| **C8** | all 12 pages, e.g. `director.html:1209` | Found by the Category C screenshots: `a.gref{display:inline-block;padding:13px 0;margin:-13px 0}` (tap-target hack on inline glossary links) makes the link's underline render across the *following* line of prose at 375px ("corporation tax" on director, "tax relief" on starter). | `display:inline` with the same vertical padding — inline boxes accept vertical padding as hit area without affecting line layout — and drop the negative margin. |
| **C9** | all 12 pages | Found by the post-C screenshots: the fixed "Ask Buddy" button (bottom-right, ~52px tall + 18px offset) sits over the footer's last line of legal links on mobile once the page is scrolled to the end — "Complaints" is partly covered at 375px. | Reserve space: extra bottom padding on the footer at ≤600px so the last line clears the button. |
| **C7** | all pages with `.foot-top`, e.g. `404.html:1141` | Found by the verification screenshots: a later tap-target rule `.foot-col a,.foot-links a{display:inline-block;padding:9px 0}` overrides the earlier `.foot-col a{display:block}`, so footer column links flow inline and collide — "About DamianBook a call", "Terms of BusinessComplaints" — at every width. | Make the tap-target rule `display:block` (keeps the 44px target). |

## D. Accessibility

Files owned by this pass: all 12 HTML files (CSS token + landmark markup only).

| Code | Scope | Issue | Fix |
|---|---|---|---|
| **D1** | `--ring` token, all pages | Focus ring `rgba(11,122,110,.28)` composites to 1.49:1 on white — fails SC 1.4.11 (3:1). | Raise alpha to ≥0.7 (measured pass) or use solid teal (4.76:1). |
| **D2** | all pages | Skip link and decorative-SVG `aria-hidden` are injected by JavaScript; with JS off there is no skip link. | Put the skip link in the source HTML. |
| **D3** | all pages | Skip target is a runtime-assigned `<div id="main">` with no `tabindex="-1"`; focus does not move, and no page exposes a `main` landmark. | Wrap page content in a real `<main id="main" tabindex="-1">`. |
| **D4** | both calculators | Results update with no `aria-live`; sliders have no `aria-valuetext`, so "€50,000" is announced as "50000". | Add `aria-live="polite"` to the results block; set `aria-valuetext` on each slider from the formatted value. |

## E. Polish

| Code | File:line | Issue | Fix |
|---|---|---|---|
| **E1** | `index.html:1554` | Countdown heading is rewritten each tick but the line beneath hardcodes "2025 tax year" — contradicts itself from 1 Nov 2026. | Derive the year in the same script. |
| **E2** | both calculators, `glossary.html` | Standard Fund Threshold is disclaimed in prose but never applied; director page can project €437m with no flag. Glossary lacks an SFT entry. | Show an SFT notice when the projected pot exceeds the threshold; add a glossary entry. |
| **E3** | `index.html:1699` | Index's mobile menu can't be closed with Escape; `aria-label` stays "Open menu" while open. Subpages ship the better handler. | Port the subpage handler. |
| **E4** | `404.html:1491` | "Last updated: June 2026" on a 404 page. | Remove. |
| **E5** | `booking.html:1321–1328`, `:1392`, `:1407–1434` | Stale "Replace CALENDLY_URL" comments, dead `PLACEHOLDER` sentinel, hidden copy saying "once the Calendly link is connected". | Clean up alongside B2. |
| **E6** | all pages | `ANALYTICS_SRC` / `LEAD_ENDPOINT` placeholders. | Tracked as F1a / F1b. |
| **E7** | index + subpages | Dead media rules overridden by later unconditional rules (`.hero h1`, `.callout,.final`, `.strip-item`, `.nav-tick`, `.nav-links a.lnk`); `.aud-figure{order:-1}` is a no-op (not a grid child); `.strip*` CSS ships on pages with no strip markup. | Remove the dead rules; fix `.aud-figure` targeting. |

## F. Structural / strategic gaps (from report 2)

| Code | Scope | Gap | Plan |
|---|---|---|---|
| **F1** | see F1a / F1b above | Capture wiring: analytics + lead endpoint. | Config-dependent — placeholders hardened, flagged. |
| **F2** | all pages | Typography mismatch: `.pb-b-head .t{font-family:Fraunces,…}` — Fraunces is never loaded, so the Ask Buddy title falls back to Georgia serif against a Sora site. | Delete the dead rule (use Sora). |
| **F3** | `index.html` (476KB), both calculators | Six base64 JPEGs inline in index.html; two more in each calculator. Whole page must download before first paint. | Extract to `assets/img/*.webp` (with `.jpg` fallback via `<picture>`), reference by path, keep `loading="lazy"`. |
| **F4** | funnel | No qualifying form before the booking step — every visitor lands straight on Calendly with no context captured. | Structural addition; scoped separately from the bug backlog. Deferred unless time permits. |
| **F5** | site | No About page — `index.html#about` is the only "about" content. | Structural addition. Deferred unless time permits. |
| **F6** | funnel | No thank-you page after booking or lead capture — inline "Thanks" states only; no conversion event to measure. | Depends on Calendly redirect config (business setting) and F1. Deferred; flagged. |

---

## Verified correct — must stay correct after every pass

Re-run `tools/verify.py` after each category. These were confirmed working at audit time:

- All internal links and `#anchors` resolve (0 broken).
- Zero console errors on all 12 pages.
- Zero horizontal overflow at 375px.
- Calculator maths (future-value projection, cost-of-waiting, +€100 boost, 12.5% CT, two-thirds salary cap) — independently recomputed.
- Calendly embed takes the ready branch, injects script + CSS, hides the fallback.
- Text contrast passes on every rendered pair measured.
- All images decode and carry correct alt text.
