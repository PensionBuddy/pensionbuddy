# PensionBuddy — Issue Backlog, Run 2

Supersedes the run-1 backlog (preserved in git history at `95c08cb` and in
`docs/STATUS.md`). Original issue codes are kept so progress stays traceable.

**This run:** A–E and F1 are **verify only** — re-run the suite, confirm no
regression from run 1, change nothing unless a check newly fails. F2–F6 are
**build**, in the order F2 → F3 → F4 → F5 → F6.

Verification is `python3 tools/verify.py` (headless Chrome, audits at
375/1360/1440px, full-page screenshots at 375 and 1440). Nothing is marked
done without a passing run, and for anything visual, a screenshot I have
actually looked at.

---

## Three claims in the incoming reports that the repo contradicts

Recorded here rather than silently accepted. All three were left as
NEEDS DAMIAN INPUT at the end of run 1 and are **still open**:

| Claim | Repo state |
|---|---|
| Report 1, A1: "now uses Damian's wording … low nominal figure flagged for solicitor" | `terms.html` §5 still renders the run-1 placeholder `€[amount to be confirmed]` (`data-issue="A1"`). No figure and no revised wording has reached the file. The described wording is a business/legal decision — it will not be invented here. **Still NEEDS DAMIAN INPUT.** |
| Report 2, F1: "lead endpoint + analytics wiring — already resolved" | `LEAD_ENDPOINT` is still `''` on all five capture pages; `ANALYTICS_SRC` is still `'[ANALYTICS_SCRIPT_URL]'`. Both fail safely (mailto fallback with honest on-screen copy; analytics self-disables) but no lead reaches a backend and nothing is measured. **Still NEEDS DAMIAN INPUT.** |
| Report 2, F3: "index.html is 476KB from three base64-inlined photos" | Already fixed in run 1 (`e028438`): index.html is **125,862 bytes**, photos live in `assets/img/` as JPEG + WebP inside `<picture>`. Description is stale — demoted to verify-only. |

Also open from run 1: **A4** — phone number placeholder in `terms.html` and
`complaints.html`, and confirmation that `hello@pensionbuddy.ie` is a real
monitored mailbox.

---

## Verify only — A–E, F1

No edits expected. Re-run the full suite on all 12 existing pages and confirm
these run-1 outcomes still hold. Fix only what newly fails, and say so.

| Group | What must still be true |
|---|---|
| **A** legal/content | No template/draft notes rendering; one "Last updated" per legal page; 404 carries the site disclosure, not the complaints text; privacy publishes a postal address + email. A1/A4 placeholders remain marked and flagged. |
| **B** functionality | Salary slider outside the collapsed `<details>`; Calendly `onerror` + timeout reveals the fallback; booking has the 4-column footer and links to the director calculator; tax relief applies the age bands and €115,000 cap; CT framing honest; lead payloads reference only ids on their own page. |
| **C** layout | `.pains` single column ≤920px with nothing clipped; drawer flush to the nav when scrolled; wordmark visible at 375px; glossary deep links land ~17px below the header; one FAQ icon style; nav inside the column at 1360; footer links stacked; `a.gref` underline on its own line; footer clears the Ask Buddy button. |
| **D** accessibility | Focus ring ≥3:1 (currently 3.99:1 on white); skip link in source HTML; `<main id="main" tabindex="-1">` on every page; calculators announce results via `#srSummary` and every slider has `aria-valuetext`. |
| **E** polish | Countdown year derived, not hardcoded; SFT notice appears only above the threshold constant; Escape closes the mobile menu on index; no orphaned marquee CSS. |
| **F1** capture wiring | Guards still in place and still failing safely. **Expected to remain NEEDS DAMIAN INPUT** — see the table above. |
| Regression floor | 0 broken links/anchors · 0 console errors · 0 horizontal overflow at 375px · 0 contrast failures · 0 image decode failures · calculator projection exact (101,685) · Calendly ready-branch verified. |

---

## Found during run 2

| Code | File | Issue | Fix |
|---|---|---|---|
| **C10** | `index.html` | Surfaced by the F2 pass: `.pain h3{font-size:19px;font-weight:700;margin-bottom:8px}` exists on director/starter/tracker but was never on index, so the three homepage "pain" card titles rendered at the browser's default h3 size and — with the global `*{margin:0}` — sat flush against their paragraph. Pre-existing, not caused by F2. | Add the rule index was missing, matching the other three pages; tracking is reset with the other classed headings in the F2 block. **Fixed.** |

---

## Build — F2 to F6

### F2 · Typography: load Fraunces, take headlines editorial
**Owner:** typography/perf pass. **Files:** all 14 pages (12 + the 2 new ones once built).

Run 1 deleted the orphaned `font-family:Fraunces,Georgia,serif` rule on the
Ask Buddy header, which was silently rendering Georgia. **That decision is
reversed by this run's brief:** the brief specifies Fraunces, warm editorial.

- Add Fraunces to the existing Google Fonts `<link>` (keep the single
  request; keep `display=swap` and the existing `preconnect`s). Sora stays
  for body/UI, IBM Plex Mono stays for the mono eyebrow/label style.
- Route display type to Fraunces via a token (e.g. `--font-display`) applied
  to `h1`/`h2`/hero headlines/section headings and the Ask Buddy header —
  not to body copy, buttons, form controls, nav links or numeric readouts,
  which stay Sora.
- Fraunces has different metrics to Sora (wider, taller x-height, optical
  sizing). Re-check the tight spots at 375px: the hero headlines, the
  countdown band, the calculator result figures (`potOut`/`incOut` must not
  reflow or clip), and the director page's long hero line.
- Must not regress: text contrast, horizontal overflow, or LCP. Watch the
  added font weight — request only the weights actually used.

### F3 · Base64 image extraction — **verify only**
Completed in run 1. Confirm `assets/img/` still resolves, `images.failed` is
empty, and the photos render identically. No work expected.

### F4 · Qualifying / routing form before the calendar
**Owner:** booking-flow pass. **Files:** `booking.html`.

`booking.html` currently drops the visitor straight onto the calendar.

- Short form ahead of the embed: **name, email, persona** (Tracker /
  Starter / Director). Three fields, nothing more.
- The Calendly embed stays hidden until the form is completed, then reveals.
- Prefill name and email into the Calendly URL, and tag the persona so
  Director enquiries can be prioritised later — Calendly reads `name` and
  `email` query params for prefill, plus `utm_*` params which surface on the
  booking record. Use a UTM param for the persona tag.
- **Compliance line:** routing-level information only. No income, pension
  value, age or circumstances — nothing that edges toward a personal
  recommendation. Report 1's "information, not advice" position must hold.
- Accessibility to the same standard as the rest of the site: real
  `<label>`s, `aria-live` error messaging, keyboard operable, 44px targets,
  focus ring from the shared token.
- The existing fallback link (open Calendly in a new tab) must survive for
  the case where the embed script fails — that is B2 and must not regress.

### F5 · About / Our Story page
**Owner:** story pass. **Files:** creates `about.html`; edits the homepage
section and the nav on all existing pages.

- Build `about.html` reusing existing components and CSS — no new design
  language, no new patterns.
- Content: Damian's story, 30 years in financial services, the QFA
  credential, why Pensionbuddy exists, and the Gresham Wealth Management
  relationship stated plainly.
- **Source discipline:** use only facts already published on this site
  (homepage About section, footers, terms). Anything not already on the site
  — new biography detail, dates, firm names, client numbers, awards — is a
  placeholder with a `data-issue` flag, never a guess.
- Add "About" to the main nav on every page, and to the footer "Company"
  column where the existing `index.html#about` link sits.
- Shorten the homepage section to a teaser plus a "Read our story" link to
  `about.html`. Keep `id="about"` working — footers across the site link to
  `index.html#about`.

### F6 · Post-booking thank-you page
**Owner:** booking-flow pass. **Files:** creates `thank-you.html`.

- Content: confirmation the call is booked, what to expect on the call, what
  to have ready, reassurance ("no obligation, no jargon, no sales pressure"),
  and links back to the calculators and jargon buster.
- **Known dependency:** for an inline Calendly embed, "redirect after
  booking" is a setting on the **event type inside the Calendly account** —
  it cannot be forced from the page's markup. The page will be built and
  ready, but the redirect cannot be confirmed end-to-end from here.
  **Log as NEEDS DAMIAN INPUT in `docs/STATUS.md`** with the exact setting to
  change (Calendly → Event type → *pensionbuddy-1-1* → Confirmation page →
  Redirect to an external site → the deployed `/thank-you.html` URL).

### Tooling
Extend `tools/verify.py` so `about.html` and `thank-you.html` are audited
like every other page, and add checks that they exist, are reachable from the
nav / booking flow, and meet the same regression floor.
