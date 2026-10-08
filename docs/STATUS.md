# PensionBuddy — Fix Status

Tracks every code in `docs/ISSUES.md`. Verified with `python3 tools/verify.py`
(headless Chrome audit at 375 / 1360 / 1440px + full-page screenshots in
`verify-out/shots/`). Run-1 baseline before any fix: **26 FAIL** across 12 pages.

---

# Launch status — as at 4 October 2026, after Run 42's merge (Run 43)

Kept current at the top of this file. The runs below say how each item got
here.

## Live: 26 pages, all indexable and all in `sitemap.xml`

- **Home and the audiences:** `index.html`, `starter.html`, `tracker.html`,
  `director.html`, `booking.html`.
- **Calculators and tools:** `pension-calculator.html`,
  `director-calculator.html`, `broker-vs-autoenrolment.html`,
  `pension-fees-calculator.html`, `my-pensions.html`,
  `state-pension-reality-check.html`, `state-pension-entitlement.html`,
  `standard-fund-threshold.html`, `pia.html`.
- **Guides:** `director-pension-rules.html`, `pensions-over-50.html`,
  `self-employed-pensions.html`, `uk-pensions-in-ireland.html`,
  `old-pension-checklist.html`, `director-year-end-checklist.html`,
  `glossary.html`, and the two games, `games/buddys-run.html` and
  `games/jargon-battle.html`.
- **Legal:** `privacy.html`, `terms.html`, `complaints.html`.

`python3 tools/sitemap.py` rewrites the sitemap from the pages themselves
(held pages out, each lastmod the file's last commit); `verify.py` reports
any drift as a site row. The lead forms post to Netlify Forms under five
names (since Run 45: `calculator-results`, "Email me this result", on
every calculator that offers it, and the guide and finder forms; the
booking page has no form), with a pre-filled email as the fallback;
`hello@pensionbuddy.ie` is a real inbox and in every footer.

Since Run 35 (29 September 2026) the home page shows the six provider logos
under its hero ("Providers we hold agencies with", switched on once Damian
confirmed that written permission is held for every logo; the files are
the logos on the providers' own websites; each drawn at a height set by
eye, Run 36) and two cards for the games after its gap chart, and "Damian's
qualifications and memberships" (Qualified Financial Adviser (QFA), Life
Insurance Association (LIA)) is under Damian's section, beside the booking
form and in the footer of every page but the two games' own.

Since Run 36 (29 September 2026) Run 34 is live too: the typefaces are the
site's own files (`assets/fonts/`), so no page asks Google for anything;
every page carries its search and sharing tags (`tools/seo.py`), with share
cards for the home page and the six audience pages; the calculators' held
inputs panel lets a keyboard reach every control; and the motion parts
Damian's decisions did not wait on (Run 34, item 4).

Since 1 October 2026 (main `09c5f80`, Run 39) Runs 37 and 38 are live too:
"What's changed?" under the home page's hero, jargon defined where it is
used, site search (the nav button and "/"), "Your pension through life",
Save as A on the pension calculator, related pages at the end of each page,
the new 404 page, short loops of the two games on the home page's game
cards, and media that pops in on scroll. A flaw found on the live 404 at
375 (its two buttons overlap) was fixed on `claude/ux-5` (Run 39) and is
live with it (next paragraph).

Since 1 October 2026 (main `31cf29e`) Runs 39 and 40 are live, and since
2 October 2026 (main `84a75cd`) Run 41: the live countdown, the design
rubric, the subtraction audit, verify.py's screen-by-screen shots and
tools/design-measure.py. Run 42 (the home page opening on the gap, red
for money missing and amber for money back, booking asks after the give,
the home cuts) was merged to main as `6af9f77` on 4 October 2026 and
pushed. Run 43 follows it on `claude/give-then-ask`: the starter, tracker
and director heroes give first, teal for the State alone, cuts that only
repeated, small interactive figures, the reason to book beside every ask,
and under each calculator's results what it doesn't show, "Email me my
results" and one booking link; merged once its docs commit passes the
gate.

## Held back (noindex, unlinked, out of the sitemap), and why

| Page | Why | Comes back when |
|---|---|---|
| `how-we-work.html` | The Reg 32 disclosure of how we are paid is a template: the Central Bank reference number (R20-9a) and every commission and fee figure (R20-9b to 9e) are placeholders | The figures are in and compliance signs it off; the footer then gains "How we are paid" and the Terms sentence changes (STATUS, Run 21) |
| `find-my-pension.html` | The Letter of Authority is a draft for compliance (R20-1a); the Privacy Notice does not yet describe the finder (R20-1b), which should name Netlify (pack 1.15) | Compliance signs off the letter and the privacy wording; the footer then gains "Old pension finder" and the tracker page's links come back |
| `pension-readiness-check.html` | A score is a gamified element (Central Bank General Guidance 3.5.7): compliance needs the brief on it (pack section 4) | Compliance signs off the questions, points and zone names |

Not held, noindex by design: `thank-you.html` (the booking confirmation)
and `404.html`. `about.html` does not exist: it was folded into
`index.html#story` in Run 4, and `verify.py` fails the site if it returns.

## Needs Damian

1. **Netlify (R27-1).** In the site's Forms settings, turn form detection on
   before the deploy, then set a notification for each form:
   `calculator-results` ("Email me this result" on nine calculators and
   tools since Run 45, the pension and director calculators included),
   `director-guide`, `starter-guide`, `tracker-guide`, `pension-finder`.
   Since Run 45 `booking`, `pension-calculator-results` and
   `director-calculator-results` receive nothing (their forms are gone);
   their old requests stay in Netlify. Send one test request from a
   calculator on the deploy preview and see it arrive under
   `calculator-results`, with the name, the email and consent=yes.
   Without detection every form falls back to email.
2. **The Privacy Notice's missing sentences.** R20-A2, the optional
   emails: the placeholder is back on `privacy.html` (Run 31), because
   the tick box is live on every form but the six `calculator-results`
   forms (Run 43 leaves it out until pack 3.2 is approved), so visitors
   read "[Wording to be
   confirmed: ...]" there until compliance approves the sentence (pack
   3.2). R27-GTM, Tag Manager's tools and cookies: a draft (Run 30's
   "Drafts") until you say the tags are live. R20-1b, the finder: off,
   while the finder is held.
3. **The comparison's fund figures (R1, R2).** The card "Choosing your
   funds, and how much risk" on `broker-vs-autoenrolment.html`, and the
   assumption that called its six figures placeholders, are hidden (Run
   30), not deleted. The six figures, and which fund ranges Gresham can
   arrange; then delete `hidden` on `#riskCard` and `li#riskAssume` in
   `tools/compare-parts/main.html` and run `python3 tools/pagebuild.py
   compare`. Since Run 43 that alone fails the build: the card's "Talk
   the choice through with Damian" would be a booking link in the results
   before the "Email me my results" block, and build check 49 exempts the
   card only while it carries `hidden` (`tests/build.test.py:2543`; plan
   risk 6). Move the link after that block, cut it, or change check 49.
4. **Compliance.** Send the pack (`docs/COMPLIANCE-PACK.md`, covering email
   drafted in `docs/COMPLIANCE-EMAIL.md`); the three held pages come back
   as it signs each off. Its open questions include 1.14 to 1.18 (the review
   line, Netlify, the Terms clause, analytics, and the three directors'
   statements in the Pensions Manual's words).
5. **About.** The brief asked to add `about.html` to the sitemap; there is no
   such page (see above), so it was not added. Say if you want a standalone
   About page again.
6. **Run 35:** the provider ticker is on. R29-1: Damian confirmed on 29
   September 2026 that written permission is held for every provider logo;
   the files are the providers' logos as published on their own websites,
   not files the providers sent, and compliance is asked whether the
   permissions cover showing them in grey (pack 1.19). Still open: its six
   names must match the agencies How we work names when that page is
   released (R29-2, now R35-1; the brief switched the ticker on first); a
   Zurich SVG (R35-2); the QFA and LIA logo files, if the strip is to show
   logos, and whether the B.A. belongs in it (R35-6). R35-5 (balance the
   logos) and R35-7 (one strip on the home page) were answered in Run 36,
   and R35-10 (merge Run 34) done. R29-3 to R29-9 were answered in Run 30.
10. **Run 34's questions, answered by Damian on 29 September (Run 36).**
   Share cards: no full regulatory sentence on the picture, the page it
   links to carries it; the "50" in the over-50 card's headline is fine;
   the fourteen shortened search lines are approved (all three still go to
   compliance, pack 1.20). The PIA's results tables scrolling sideways at
   320 to 351px: accepted. The glossary's term index and the tracker's
   papers: accepted as Run 34 left them (one scrolling row; the pile), read
   the same way as the PIA answer. Parts 7, 12c, 3d and 9a: parked. Still
   open from Run 34: the site shows no phone number, so the business's
   search data has none (a public number goes on the site first, then in
   `tools/seo.py`); accessibility points left as they are (Run 34, question
   4); and, small and optional, a WebP of `buddy-beach.jpg` from the
   original photo and a smaller copy of Buddy's 320px avatar.
7. **Run 30's calls** were answered in Run 31 (below).
8. **Smaller calls, none blocking:** the review line spells out QFA (Run
   26); the initialism exceptions (UK, KPMG, CEO, CMO, B.A., HM, PDF, the
   quiz: Runs 22 and 25); whether the nav and footer get the 16px floor (Run
   21).
9. **Run 32, found, not fixed:** the pension and director
   calculators' chart labels ask for Plus Jakarta Sans, which is never
   loaded, so they are not in Inter (a one-line CSS fix, `svg text`); and
   the comparison's share row (link, print, email) sits in the first mode
   only, so "On top of auto-enrolment" has none.
11. **Run 42** (merged as `6af9f77`): Damian answered 2, 7, 14 (i), 18
   and 19 and confirmed 17 on 4 October 2026; every other question took its most
   conservative option (Run 42, "Decisions, 4 October 2026", below).
12. **Run 43** (on `claude/give-then-ask`): the Calendly setting behind
   "reschedule any time"; the Netlify notification for
   `calculator-results` and replying to each request; how "yes" to
   question 7's chat pictures was read; my-pensions without an email
   offer; the asks near the closing bands; the booking page's "Last step";
   Run 43's "Needs Damian", below.
13. **Run 45** (on `claude/clever-fermi-rgdc2a`): give then ask, built to
   Damian's brief of 5 October 2026; its "Needs Damian", in Run 45 below.

## Parked, with a date or a trigger

- **Any change to a game's look: its picture on the home page.**
  `assets/img/product-buddys-run.*` and `product-jargon-battle.*` are
  photographs of the games mid-play, like the calculators' pictures, so a
  change to a game does not reach them. Re-shoot:
  `python3 tools/shoot-product.py buddys-run jargon-battle`, then
  `python3 tools/stamp-images.py` (the size stays 2400x1350; check it).
- **A new or better logo file.** `python3 tools/logos.py <folder>
  <name>=<file>` writes it into `assets/logos/` and proves it is the
  provider's own artwork; then its entry in `assets/js/pb-providers.js`
  and the `<noscript>` row in `index.html` (`tests/providers.test.py`
  says what width and height they need).
- **1 October 2026, PRSI to 4.35%: done ahead of the day (Run 36).**
  The director photograph was re-shot as at 1 October (4.35%, EUR 19,060,
  EUR 9,530), so it shows the new rate two days early; the calculator's two
  sentences about the rate now come from `assets/js/pb-prsi.js` and say
  the day's (52.2% with the rise to come until 30 September, 52.35% from
  1 October), and read true on any date with JavaScript off. Nothing to do
  on the day.
- **PRSI's next step.** The rate lives in one table,
  `assets/js/pb-prsi.js` (4.2% from 1 October 2025, 4.35% from 1 October
  2026). When the next rise is announced, add it there; the director pages'
  markup must then carry it (tests/build.test.py check 17 says so).

- **Calendly redirect.** An event-type setting in the Calendly account, not
  code: Calendly → Event Types → `pensionbuddy-1-1` → Confirmation page →
  "Redirect to an external site" → `https://pensionbuddy.ie/thank-you.html`.
  Until then the booking page's own listener is the only route to the
  thank-you page.
- **GTM tags (R27-3).** Container `GTM-KQCRZDNB` loads only after "That's
  fine", but it was empty on 25 September 2026 (version 1, no tags), so
  nothing is measured until tags (for example Google Analytics 4, with
  triggers on `booking_form_submit`, `calendly_booking` and
  `calculator_first_interaction`) are added and published. The games load no consent script, by
  choice.
- **Revenue's online date for 2027.** When Revenue publishes the 2027 Pay
  and File date for the Revenue Online Service (usually in the spring), add
  it to `ROS` in `assets/js/pb-deadline.js` (`2027: { month: 10, day: N }`).
  Without it, from 19 November 2026 the countdown runs to 31 October 2027,
  says the online date is "usually later, in mid-November", and moves on
  to 2028 on 1 November 2027 while the online date may still be open.
  **On 19 November 2026 `tests/deadline.test.py` fails, on purpose,**
  (sections 2 and 6) until the words a reader without JavaScript gets move
  on, because it holds the markup to `PBDeadline.statics()` by the real
  clock. The failures print the new words. Move: the nav chip's static span
  and its `aria-label` in the skeleton's nav (`pension-calculator.html`; with
  no online date the span has no `nt-more` part, so drop that span), then
  `python3 tools/sync-chrome.py`, `python3 tools/pagebuild.py`,
  `python3 tools/sync-chrome.py` again; the three calculators' "Tax
  deadline" row (`pension-calculator.html`, `director-calculator.html`,
  `tools/compare-parts/main.html`); and the home band's heading, `#tkRev` and
  `#tkYear` in `index.html`. Tried on a copy with the clock moved to 19
  November: 50 checks fail before, none after.
- **6 October 2026, Budget 2027.** `pia.html` per `docs/PIA-BUDGET-DAY.md`
  (threshold, rate, annual limit, launch date, the as-at stamps); re-check
  the pages dated "Rules as at 24 September 2026" (SFT, directors' rules)
  and the over-50s and self-employed guides, and the UK page after the UK
  Budget; move "Last reviewed September 2026" on the pages that change.
  Run 34 found seven pages saying "Budget 2027 is on 6 October 2026 and
  could change them", the PIA lines "Proposed, as at 25 September 2026,
  and not yet law", and the State Pension's "€299.30 a week from January
  2026", which the same Budget may change from January 2027.
- **October 2026, the month turns** (Run 34, item 7): "Last reviewed
  September 2026" on the ten review lines, "Rules as at 24 September 2026"
  on eight guides, and the checked-on dates (the comparison's gov.ie rates,
  the entitlement check, the reality check) all age a month; dated figures
  (My Future Fund's 835,000 members, the Pensions Authority's 40,644
  one-member arrangements, the living standards of September 2024, the
  complaints page's "Last updated: June 2026") stay true as at their dates.

## Closed in Run 36 (Run 34 merged, Run 35's calls, merged to main on 29 September)

R35-7: Damian's qualifications and memberships are on the home page once,
under his own section (the copy at the end of the story is off). R35-5: the
six logos are drawn at heights set by eye, so none looks heavier or
smaller. R35-10: Run 34 (`claude/overnight-3`) is merged: self-hosted
fonts, search and sharing tags, the motion parts, the accessibility and
image fixes, and Damian answered its questions. PRSI's rise on 1 October
is handled ahead of the day: the director calculator's sentences read the
date, and its photograph shows 4.35%. Details: Run 36, below.

## Closed in Run 35 (the logos, the strip and the games, merged to main on 29 September)

R29-1, as far as it can be: Damian confirmed on 29 September 2026 that
written permission is held for every provider logo, and the ticker is on,
with each provider's logo as published on its own website. The home page
also gains Damian's qualifications and memberships and the two games'
cards; the strip is beside the booking form and in the footer of every
page but the two games' own. Details: Run 35, below.

## Closed in Run 33 (the cookie bar on a phone, merged to main on 28 September)

On a phone the cookie bar no longer covers the regulator and QFA line on
the first screen (Launch status item 9, as it was). The bar is one line
and two buttons, "May we use a little analytics? Privacy Notice" (the
wording goes to compliance with pack 1.17), and on phones, upright or
sideways, the hero's lockup and the page header's review line come up
under the eyebrow, above the headline. Checked on 14 pages at 320x568,
375x667, 375x812, 412x915, 560x800, 667x375 and 915x412: the line drawn,
whole, on the first screen and the bar below it (`tests/consent.test.py`
check 9). Details: Run 33, below.

## Closed in Run 32 (UX motion, merged to main on 28 September)

The UX motion work (`docs/UX-MOTION-AUDIT.md`, Step 3, the parts Damian
picked, with his decisions: defaults): caveats never revealed, delayed or
moved; the reveal system gone, so words are there on arrival; one motion
vocabulary, calm under reduced motion; Ask Buddy one script, tucking to its
photo and stepping aside for caveats, fields and focus; the booking and
results bars stepping down for caveats; the deadline in days with no
ticking clock or pulse (the clock is back since Run 41, in days, hours
and minutes, turning each minute, never seconds; still no pulse); no celebration on the jar or the safe. Without
JavaScript the calculators' "Tax deadline" row and the nav chip give the
date. Damian checked it on an iPhone (Safari) and accepted one Lighthouse
point on the pension and director calculators (99 to 98). Details: Run 32
(continued), below.

## Closed in Run 32 (urgent fixes, merged to main)

PRSI is stated from one dated table, `assets/js/pb-prsi.js`, and the
director pages are right with JavaScript off (4.35%, EUR 477, EUR 9,530;
both scripts would also have printed "4.4%" from 1 October). Buddy's Run
flashes nothing more than three times a second (the hit blink was six; a
held pause key toggled the pause card at key-repeat speed). The
comparison's warning shows in both modes. The regulator line and the QFA
line are at full opacity from the first frame on every page: the whole-page
fade is gone. With it gone, two older layout shifts showed and are fixed:
the font swap (a metric-matched Arial fallback for Inter) and the
calculators' deadline row (the script loads straight after it).

## Closed in Run 31

The countdown on every page counts to Revenue's online deadline, 18
November, with 31 October beside it, and moves on a year once it has
passed; it no longer counts to any date of ours (R30-6).
The director calculator's line reads "Retiring before your scheme's
normal retirement age?" (R30-1); the over-50s guide quotes the PRSA
footnote in full (R30-5); the optional-emails placeholder is back on the
Privacy Notice (R30-2, above).

## Closed in Run 30

R29-3 to R29-9: the nav's booking button is an outline again; the
countdown's handling of Revenue's deadline (since replaced, Run 31); both calculators' retirement age starts at 50,
and the director's stops at 70; the 20% test is in the Pensions Manual's
words (Chapter 9.6) on the two pages that state it, and the over-50s
guide's PRSA line says "may be allowed". The comparison's risk card and
the Privacy Notice's three placeholders are off the site, both restorable.

## Closed in Run 29

"Out of office" is switched off, not deleted (restore: delete `hidden` on
`<section class="snaps">` in `index.html`). Every live page is now in the
nav. The countdown moved into one script, `assets/js/pb-deadline.js`
(what it counts to: Run 31). The director calculator can no longer be set to retire before
50.

## Closed in Run 28

R27-2 (the forms' success messages promised things nothing sends), A4
(`hello@pensionbuddy.ie` confirmed), and the stale calculator pictures
(re-shot, merged `6e556ec`).

---

# Run 48 — 2026-10-08 · Live fixes: rules date, the threshold, how a call works, one booking wording, one regulator line, Cookies (on `claude/live-fixes-1008`)

Damian's seven fixes of 8 October 2026, one commit each, off live main
`a1f7122`.

| # | Fix | Where |
|---|---|---|
| 1 | Every "Rules as at 24 September 2026 / Budget 2027 could change them" line reads "Rules as at 8 October 2026." until Damian gives the Budget 2027 changes; the UK guide's "Either country's Budget can change them" too, and the four guides' search descriptions ("as at September 2026") | home, threshold, directors' rules, four guides; their parts; `pagebuild.py` checks; build check 36 |
| 2 | Standard Fund Threshold: "€2.2 million in 2026, and €2.4 million from 1 January 2027" wherever it is described in words (the threshold page's opening line, the jargon buster, the directors' rules paragraph and question, the year-end checklist, the "all your pensions" pointer, both calculators' notes). The over-50 guide's €2 million is the ARF 6% rule, unchanged | |
| 3, 4 | "How a call works.": the three placeholder pictures gone (files and CSS); step 1 "Pick a time that suits you." ("No forms." gone); the kicker and "Three steps." replaced by the heading. The comment over the section says where Run 39's video slots are | `index.html`; build check 45 rewritten |
| 5 | Every booking button reads "Book a free 20-minute call with us" (nine wordings replaced, listed in the commit). One filled booking button per page: the home page keeps the one after the way-of-life picker, its closing band ("Talk it through with Damian.") goes and its second ask is an outline under "Questions before you call."; the director, starter and tracker closing bands and the tracker's "Forgotten pensions" band go quiet. **Run 45's button test ends** (its second wording broke the one wording): everyone is variant A, nothing stored, the old key deleted on load | build check 52 holds both rules, nav, bar and Ask Buddy included; checks 46, 48, 50; give-then-ask G13, G14 |
| 6 | The home page loses the grey announce bar ("Regulated by the Central Bank of Ireland · Free first consultation"); the hero's lockup, with the register link and the QFA, is the one regulator line at the top | `chrome_drift` wants no bar on the home page; check 9 mutant |
| 7 | A Cookies section in the Privacy Notice (`privacy.html#cookies`): what the site keeps always, each analytics and advertising cookie set only after "That's fine" with what it does and how long it lasts as each vendor's own page states it (read 8 October 2026), the Calendly calendar's own cookies, and how to change the choice. "Cookies" in every footer. "No thanks" now also deletes `ttcsid*`, `ttclid` and `_dc_gtm_*` | `privacy.html`, skeleton foot-top, `pb-consent.js` |

Left as they were, by judgement: the footer's "Book a call" (a link in a
list, not a button); the guides' "Talk it through" section headings over
their booking links; links inside sentences ("book a free 20-minute call
with us", the legal pages' "booking page"); the 404's filled "way home".

## Needs Damian (Run 48)

1. **Budget 2027.** Give the changes; then the rules lines move again.
   Already stale since 6 October: the year-end checklist's "Watch Budget
   2027 on 6 October 2026", the PIA page's "to be announced on 6 October
   2026, in Budget 2027", and the source notes in `assets/js/pia.js` and
   `assets/js/sft.js`.
2. **The same doubled regulator line** is on the director, starter and
   tracker pages (grey bar plus the hero lockup on a phone). Fix 6 was
   asked for the home page only; the same change is one line each.
3. **Calendly loads before the cookie choice** on the booking page and,
   by Calendly's own help page, "uses cookies even if the banner is
   hidden"; Calendly suggests waiting for consent. The Cookies section says
   Calendly sets its own cookies there. Compliance question.
4. **LinkedIn's Insight Tag terms** say the tag "should not be installed"
   on pages offering financial services to consumers
   (linkedin.com/help/lms/answer/a489169). For Damian or counsel.
5. **The compliance pack** quotes the old booking wordings and the button
   test (1.25); it is stale on both.
6. **Not from this run:** `tools/check-initialisms.py` fails on four
   calculators for "ECB" in the "today's money" text (live main, commit
   `e642782`).

# Run 46 — 2026-10-06 · Copy cut (on `claude/clever-wozniak-dmpzph`, merged to main)

Damian's order, in two rounds. First a cut that left the compliance pack's
copy alone; then, the same day, "ignore the pack freeze, cut every page
hard, at least 40%". Kept word for word: the prescribed warnings, the
Central Bank lines, consent and privacy text, figures, dates and sources,
calculator labels and logic. 27,171 words to 18,879 (31%) across the
changed pages; 8 pages reached 40%. Sections that repeated others are gone
(the home page's six places and call chat picture, the audience pages'
pain cards, the reality check's explainer). One commit per page. Gate: no
failing line live main does not have. Everything, with the reasons some
pages are under 40%: `docs/COPY-CUT-2026-10-06.md`. The pack carries a
note that its quotations are stale.

# Run 45 — 2026-10-05 · Give, then ask: one button after each result, "Email me this result", the calendar first, a bar on every content page, a button test (on `claude/clever-fermi-rgdc2a`)

Damian's brief, 5 October 2026: show each calculator's result with no gate
and no email; directly under it one booking button, "Book a free
20-minute call with Damian", with "Free. No obligation. No pressure." under
it, from one shared component; below it an optional "Email me this
result" (name and email only, a consent box not ticked in advance, one
line on what is stored, why and where), sent to the existing lead
destination, storing no calculator input unless sent; one primary booking
button per page, the home page keeping its three situations and losing
any competing button; a phone booking bar, "Book free 20 min call",
clear of the safe areas, the inputs and the keyboard, hidden while a
booking section is in view; a 50/50 test of two wordings ("See what this
means for you - free 20-min call" the second), stored first-party with no
non-essential storage before consent; tags on every booking link
(utm_source=site, utm_medium=cta, utm_campaign=<page>,
utm_content=<variant>); the events calculator_complete, cta_view,
cta_click, booking_click and email_result_submit, as the cookie choice
allows; and less effort at booking (embed or deep-link). No questions:
reasonable choices, listed below.

| # | Item | Where |
|---|---|---|
| 1 | One shared block after each result: what it does not show (Run 43's lines, unchanged), the button, its line, "Email me this result". `pagebuild.AFTER` and `after_block()`, written between `<!-- AFTER:BEGIN -->` and `<!-- AFTER:END -->` by `pagebuild.py` (from the part's `<!-- AFTER -->` line) and `sync-chrome.py` (the two hand-written calculators); `after_drift()` the guard (verify.py, build check 49). On the nine calculators and tools and the directors' rules page | `tools/pagebuild.py`, the part files, `pension-calculator.html`, `director-calculator.html` |
| 2 | "Email me this result": hidden in the markup, shown by `assets/js/pb-after.js`; opens a form under the button (the result never moves); name, email, a box never ticked for the reader, the one line; sends nothing without all three; then the shared Netlify form `calculator-results` (fields: `pagebuild.AFTER_FIELDS`), the mailto fallback as before. The pension and director calculators' own forms (and their `sendResults()`, and their occasional-emails box) are gone | `assets/js/pb-after.js` |
| 3 | The button test, the tags and the counts: new `assets/js/pb-cta.js` on every root page straight after `pb-consent.js`. Wording A in the markup, B by script; the pick in page memory until "That's fine", then `localStorage['pb-ab-cta']`; `pb-consent.js` deletes the key on "No thanks" or a reset and announces every answer as `pb:consent`. Every `booking.html` link tagged the moment it is pointed at, focused, pressed or opened in a new tab, never at load (no tagged link inside the site for a search engine to read). cta_view, cta_click, booking_click here; calculator_complete and email_result_submit from `pb-after.js`; all through `PBTrack` | `assets/js/pb-cta.js`, `assets/js/pb-consent.js` |
| 4 | The booking page: the calendar at once, no form in front of it (the three routing fields and the Netlify form `booking` are gone; Calendly asks for the name and email). The heading script keeps the link's tags and takes them off the address (`history.replaceState`), and the calendar gets them, with `utm_term` for the situation; without tags, `utm_source=pensionbuddy&utm_medium=booking-page`. On a phone the calendar card comes straight after the heading (`.lead`, the card, `.lead-more`). `verify.py`'s F4 rewritten to match, and its load-time Calendly rule accepts the B2 fallback where Calendly cannot load (a blank box still fails) | `booking.html`, `tools/verify.py` |
| 5 | The phone bar: "Book free 20 min call", no reason line; on every page built from the skeleton, the director calculator and the five guides as well as the five content pages; stops on a noindex page; tucks away while a calculator's inputs, the peek bar, any booking link in the page, `#pbAfter`, a closing band or the footer is in view or 80px off, and while a text field has focus; padded by `env(safe-area-inset-*)` on three sides. Its CSS moved from the five pages into the new shared CTA block | `assets/js/pb-bookbar.js`, `SHARED_CSS` CTA |
| 6 | One primary ask per page: a link drawn as a filled button leads to booking (build check 52). Outlines now: home "Open the calculator" and "See what it’s worth to you" (`btn-quiet-dark`, new), starter "See what I could build" (quiet-dark), "Compare the two side by side" and "See the State Pension reality check" (`btn-ghost`), directors' "Open the director calculator" (quiet-dark), the three "Send me the guide" (ghost). Home: "Try the calculator" beside "Get my free review" cut; the hero gains the three situations, in the chat picture's own words: under the figure and the lockup on a wide screen, after the chart and its caveat on a phone (so the first screen stays as Run 42 measured it: interactive-43's H2 caught the chart under the cookie bar when they sat under the figure) | `index.html`, `starter.html`, `director.html`, `tracker.html` |
| 7 | Privacy Notice: the calculators sentence (name, the box), "Booking and third parties" (no booking form; Calendly records the page and the wording), Cookies (the new counts, the button test). Last updated 5 October 2026 | `privacy.html` |
| 8 | Tests: build checks 9 (the CTA block), 14 (five form names, the shared field list, the box unticked, no booking form), 21 (the note after the calendar, no form), 48 (the block's own line), 49 (rewritten for the block), and new 50 (pb-cta.js), 51 (the bar's pages and rules), 52 (one primary ask; the home hero). `give-then-ask.test.mjs` rewritten (G1 to G14, 157 checks); `lead-forms.test.py`, `consent.test.py` check 7, `search.test.mjs` and `floating-chrome.test.mjs` follow | `tests/` |
| 9 | Compliance pack: question 1.25, Appendix B.25, sections 3.3 and 3.4, the head paragraph | `docs/COMPLIANCE-PACK.md` |

## Where the data from "Email me this result" lands

Netlify → the site → Forms → `calculator-results`: one entry per request,
with `name`, `email`, `consent` (yes), `results` (the words and figures on
screen), `inputs` (the figures chosen), `link` (the link that opens those
figures again) and `page`. Netlify emails nobody unless a notification is
set for that form (Needs Damian 1). If Netlify refuses the post, or the
site is not on Netlify, the reader's email app opens addressed to
`hello@pensionbuddy.ie`, subject "Results request". Nothing is sent or
stored before the form is sent. No new server-side handler: the
destination already existed.

## What is counted (Google Tag Manager, after "That's fine" only)

| Event | When | Fields |
|---|---|---|
| `calculator_complete` | the first time a result is on screen after the reader's own move (a number, or the directors' rules list), once per page view | `calculator`, `page`, `variant` |
| `cta_view` | the button after a result, or the phone bar, at least half on screen; once per button per page view | `cta` (after, bookbar), `page`, `variant` |
| `cta_click` | one of those pressed | `cta`, `page`, `variant` |
| `booking_click` | any link to booking.html or Calendly pressed, anywhere | `cta` (after, bookbar, nav, footer, buddy, band, hero, calendar, inline), `page`, `variant` |
| `email_result_submit` | "Email me this result" sent with all three given | `calculator`, `page`, `variant` |

Existing: `calculator_first_interaction`, `calendly_booking`.
`booking_form_submit` is gone with the form. The GTM container is still
empty (Parked, "GTM tags"): nothing is measured until tags are published.
Calendly records each booking's tags, so bookings per page and per wording
can be read in Calendly without GTM.

## Defaults taken (no questions asked, per the brief)

1. The new line under the button is Damian's "Free. No obligation. No
   pressure." The reason line "Free · 20 minutes · no obligation · easy to
   reschedule." (Run 44) stays beside every other booking link, the closing
   bands included; build check 48 accepts either beside a link.
2. "One primary booking CTA" read as one primary action, booking, which
   may repeat (after the result, the closing band, the bar): the
   principles say to repeat the ask on every page. Other links went quiet.
3. The button test covers the button after each result only; the bar keeps
   its own words, "Book free 20 min call". Every booking link carries the
   visitor's wording in `utm_content`, so bookings can be compared by arm
   whichever link was used.
4. Before consent the wording is picked per page view and stored nowhere,
   so it can change from page to page for a visitor who never answers;
   their events are never sent anyway.
5. The tags are on the internal booking.html links, as the brief asked,
   added when a link is used rather than at load, so search engines never
   read tagged links inside the site; the booking page strips them (and
   nothing else) from its address before analytics could read them, so
   they never overwrite a visit's real source in Google Analytics, and
   passes them to Calendly.
6. "Reduce effort at booking": embed, the calendar at once. The routing
   form, its persona question and the Netlify form `booking` are gone:
   Calendly already asks for the name and email. Lost: the name and email
   of someone who fills the form but never picks a time.
7. The consent box is required: the form sends nothing unticked.
8. The name is required as well as the email.
9. Without JavaScript the email link and form stay hidden (they could not
   carry the figures); the button shows, as plain booking.html.
10. my-pensions keeps "nothing leaves this page": the button, no form.
11. The directors' rules page counts as a tool with a result: the block
    follows its list, with "Email me this result" (the list is sent), and
    no "doesn't show" line. Its old link (`#drBook`, `#persona=director`)
    is gone; the booking page now reads the situation from the page name.
12. The readiness check (held) keeps its own button; the finder (held)
    and the 404 keep their filled buttons (a form's steps; the way home).
    Tool buttons that run a tool ("Show what to talk about") stay filled:
    they are the give, before the ask.
13. The home page's three situations go into the hero, in the chat
    picture's own words ("Which of these sounds most like you?", "Just
    starting out", "Changed jobs a few times", "Run my own company"), so no
    new words; "Six places to begin" and the chat picture keep theirs. On
    a phone they follow the chart, not the figure: under the figure they
    pushed the chart's foot under the cookie bar on a first visit.
14. The bar's reason line is dropped: "Book free 20 min call" says free
    and 20 minutes, and the bar is half the height (it now sits on the
    calculators and guides too).
15. The guides keep their own closing link and reason line; on a phone
    the bar gives them a button.
16. The games load neither pb-cta.js nor the bar: their booking links
    carry no tags.
17. Printing hides the block after a result on every calculator (the
    "doesn't show" line still prints).
18. The `.email-cap` CSS on the two hand-written calculators and the
    booking page's `.qual` CSS are left in place, unused; the TRUST
    block's two `.pb-bookbar p.pb-why` rules likewise (the block must stay
    byte-identical on every page).

## Needs Damian (Run 45)

1. **Netlify:** the notification for `calculator-results` (top, Needs
   Damian 1); the pension and director calculators' requests now arrive
   there too, with a name.
2. **Calendly:** the tags arrive on each booking (utm_source, utm_medium,
   utm_campaign, utm_content, utm_term). Check one test booking shows
   them, and that the event's own questions ask for the name and email
   only. The redirect to thank-you.html is still the Calendly setting
   (Parked).
3. **GTM:** to measure anything, publish tags for the five new events
   (and `calendly_booking`), each with its fields, and an A/B report on
   `variant`.
4. **Compliance:** question 1.25 (a) to (f), sections 3.3 and 3.4.
5. **How long to run the test:** the brief left it open. Bookings per arm
   will be small; read Calendly's `utm_content` before deciding anything.

## The gate

Run against main `bb3d372`'s own run on the same machine (headless
Chromium 141, `TZ=Europe/Dublin`, Pillow installed), one suite at a time.
Pass: no failing line main did not have.

| Suite | Main | Run 45 |
|---|---|---|
| build.test.py | 459/0 | 467/0 |
| give-then-ask.test.mjs | 118/0 | 157/0 |
| lead-forms.test.py | 379/2 (booking, Calendly) | 398/0 (no booking form) |
| consent.test.py | 731/14 | 732/14, the same 14 (check 9 at 320 x 568) |
| interactive-43, deadline, games, providers, regulator-lines, runner, gap-band, boxes, search, run-tests | pass | pass |
| nav.test.py | 464/6 | 464/6, the same (no mouse) |
| floating-chrome.test.mjs | 31/4 | 31/4, the same checks (2 on booking, rules, home; 5) |
| terms.test.mjs | 45/3 | 45/3, the same (one run caught the home page once; its test now leaves out the button's wording, which changes per view) |
| ux4.test.mjs | crashes (H.264) | the same |
| verify.py --no-shots | 0 FAIL | 0 FAIL |
| stamp, site-index, seo, initialisms, sync --check | clean | clean |
| sitemap.py --check | stale lastmods | stale lastmods (rewrite after merge) |

Found on the way: `broker-vs-autoenrolment.html` is now 254 KB, over
verify.py's 250 KB warning (F3), from the CTA block of CSS; a warning, not
a failure. `interactive-43`'s H2 caught the hero's three situations
pushing the chart under the cookie bar at 500px; they moved after the
chart on phones (item 6).

# Run 44 — 2026-10-05 · "Easy to reschedule" (on `claude/easy-reschedule`)

Damian's brief: change "reschedule any time" to "easy to reschedule"
sitewide, update the compliance pack, gate, merge, push main.

- The reason line beside every booking link is now "Free · 20 minutes ·
  no obligation · easy to reschedule.": `pagebuild.REASON`, every
  hand-written page, the part files and the built pages, both games, the
  phone booking bar (`pb-bookbar.js`), Ask Buddy (`pb-buddy.js`), the
  saved report (`pb-report.js`), and the tests and render-diff classifier
  that quote it. Scripts restamped by `tools/stamp-images.py`.
- This settles Run 43's "Needs Damian" 1 (the Calendly setting behind
  "any time"): "easy to reschedule" claims only that moving a booking is
  simple, which the confirmation email's links make true.
- Compliance pack: a dated head paragraph, question 1.24 (a) and its
  note, and every quotation of the line (Appendix B.16 and the page
  appendices) updated; Damian's Run 43 brief is still quoted as he wrote
  it. `docs/CUT-LIST-42.md` and `docs/GIVE-BEFORE-ASK-42.md` follow.
- Gate: as main's, no new failure (environment lines only, as Run 42).

# Run 43 — 2026-10-04 · Give, then ask: the audience heroes, teal for the State alone, cuts that only repeated, the S proposals, and the asks after each result (on `claude/give-then-ask`)

Damian's brief, 4 October 2026: build it with agents on a new branch off
main, `claude/give-then-ask`; gate each item, merge, push main; record his
decisions on Run 42's questions in STATUS ("What's changed?" position OK;
Q2 keep; Q7 yes; Q14 non-State teal to neutral slate, teal for the State
only; Q18 keep the cut; Q19 accept), take the most conservative option on
every other open question and list them for him. Five items: (1) Q7: the
starter, tracker and director heroes put their booking button below the
first figure; (2) Q14: a slate token, AA contrast, a colours-only
render-diff; (3) apply every cut in `docs/CUT-LIST-42.md` that only
removes repetition and list the rest; (4) build the S-effort items of
`docs/INTERACTIVE-PROPOSALS-42.md`, under the same motion rules; (5) sales
tactics, compliant (no fake urgency, no pressure, the "no" always
visible): (a) after every calculator result, one line and a booking link;
(b) under each result, "What this doesn't show: your old pensions, your
tax position, your employer's scheme."; (c) on the booking page, "You've
seen your number. Last step: 20 minutes with Damian."; (d) beside every
ask, "Free · 20 minutes · no obligation · reschedule any time."; (e)
"Email me my results" offered before the booking ask on each calculator.
New copy to the compliance pack; screenshots at 375 and 1440; Lighthouse
before and after; report the hash. Planned, built and reviewed by Claude
agents, each commit reviewed before it was made.

| # | Item | State | Commit |
|---|---|---|---|
| 1 | The starter, tracker and director heroes give first: the booking button follows the first figure (tracker: its tick list); the three chat pictures lose their booking link (Q7) | done | f9363a7 |
| 2 | Teal is what the State pays: one slate token for everything else in a chart, a bar or a figure, and neutral marks for the reader's own place on a scale; a colours-only render-diff (Q14) | done | a613784 |
| 3 | Nine edits that only removed repetition, from `docs/CUT-LIST-42.md`; the rest listed | done | e53afba |
| 4a | Interactive proposals 7, 2, 4 and 1: my-pensions' charges figure in red; the threshold page's two bars; the charges chart's red area | done | bcdea74 |
| 4b | Interactive proposals 3 and 14, the home page: the hero figures say where they come from; a "Your age" slider on the phone timeline | done | ad48b21 |
| 4c | Interactive proposals 6, 15 and 9: "Your age" sliders on four relief ladders (two of them new, on two guides); the starter's auto-enrolment phases, with their caveat | done | b801ad0 |
| 5a | 5d, part 1: the reason line, in Damian's words, everywhere a reason line stood | done | adc7db4 |
| 5b | 5d, part 2: the reason line beside every ask that had none (the 13 closing bands, the home chat picture, Jargon Battle, the saved report) | done | 09d4c71 |
| 5c | 5a, 5b, 5c and 5e: under each calculator's results, what it doesn't show, "Email me my results", one booking link; the booking page's line; the Privacy Notice's calculator sentence | done | d369306 |
| 6 | This entry, Run 42's decisions, the compliance pack (1.24, B.22 to B.24 and the edits), the three Run 42 lists marked, the sitemap | done | this commit |

Main was `6af9f77` (Run 42's merge) when the branch began and has not
moved. The merge to main follows this commit's gate.

**Two of Damian's sentences ship as he wrote them, where the plan had
proposed other words** (the plan's words are recorded as alternatives for
compliance, pack 1.24 (a) and (b)):
- the reason line, "Free · 20 minutes · no obligation · reschedule any
  time." The plan proposed "Free · 20 minutes · no obligation · reschedule
  from your confirmation email.", the words of the booking confirmation
  page ("Need to change or cancel the time? The links are in your Calendly
  confirmation email.", `thank-you.html:2094`). "Any time" is true only if
  the Calendly event `pensionbuddy-1-1` lets every booking be moved with no
  minimum notice; nobody has checked that (Needs Damian 1);
- the booking page's line, "You’ve seen your number. Last step: 20 minutes
  with Damian." The plan proposed "You’ve seen your figures. Next step: 20
  minutes with Damian.". The reviewer's note: "Last step" sits directly
  above the heading "You've been meaning to sort the pension. Twenty
  minutes with Damian starts it." (`booking.html:2035`) and above the
  page's own "a clear sense of your next step" (`:2041`), so the line
  contradicts both, and "20 minutes with Damian" is said twice in a row
  (Needs Damian 6).

## Item 1, the audience heroes give first (Q7)

- **Moved, words unchanged** (each into a new `<div class="hero-cta"
  style="margin-top:22px">`, with its arrow and its reason line; the
  reason's words became Damian's in item 5d):
  - **starter.html:** "Help me get started" and its reason, from the
    hero (main `starter.html:2487-2488`) to after the chart "The same
    monthly amount, started at 30, 40 and 50.", its two warnings and its
    note "Illustration only · the value of investments can fall as well as
    rise. …", before "If you wait." (`starter.html:2603-2606`). The hero
    keeps "Try the calculator".
  - **tracker.html:** "Help me find my pensions" and its reason, from the
    hero (main 2278-2279) to after the tick list "Tick these off as you go"
    (`#pbTrace`) and its badges strip (`tracker.html:2332-2335`). The page
    gives no figure, so the tick list is its first give (plan 0.3, item
    2). The "Worth knowing" band's "Start finding mine" follows with its
    own reason (2344-2345): both kept (question 7's rest, default).
  - **director.html:** "Book a call with Damian for free" and its reason,
    from the hero (main 2272-2273) to after the €1,000 example ("€1,000 of
    profit taken as salary is about €477 in your pocket, …") and the
    ladder "The personal limit: the share of salary that gets tax relief,
    by age." with its note (`director.html:2341-2344`). The hero keeps
    "Try the director calculator".
- **Cut (P1), how "yes" to "And their chat pictures?" was read:** from
  each of the three chat pictures, the link "Book a call with Damian for
  free" and its reason line "Free, 20 minutes, no obligation.". Main
  lines: starter 2502-2503, tracker 2293-2294, director 2287-2288. Each
  picture keeps its avatar, the question and Buddy's answer:
  - starter: "Have I left it too late to start?" / "Almost certainly not.
    Earlier gives money more time to grow, but starting now beats waiting
    longer, and tax relief is there at any age." (`starter.html:2522-2523`);
  - tracker: "I don’t have any of the paperwork, is that a problem?" /
    "Not at all. Roughly when you worked somewhere, and who for, is usually
    enough to start tracing a pension." (`tracker.html:2293-2294`);
  - director: "How much can my company actually contribute?" / "Often a
    lot more than you’d expect. Company contributions are based on your
    salary, service and existing funding, not the salary-percentage caps
    that limit personal contributions." (`director.html:2299-2300`).
  "Yes" could not mean "keep"; moving the links would have put two
  identical asks side by side after the first figure; the cut removes
  asks, so it carries the least compliance risk, and every hero is now
  ask-free on every phone. Each page has one booking link fewer (after
  item 1: starter and director 2 in `main`, tracker 3). The home page's chat picture is
  untouched (question 2). Revert: Needs Damian 3.
- **First screens, measured in Chrome** (booking links in `main`; the nav
  button is exempt):

| Page | 375 x 812 | 412 x 915 | 1440 x 900 |
|---|---|---|---|
| starter, main → branch | "Help me get started" at y 515 → none | y 515 → none | y 567 → none |
| tracker, main → branch | "Help me find my pensions" at y 513 → none | y 513 → none | y 565 → none |
| director, main → branch | "Book a call with Damian for free" at y 673 → none | y 637 → none | y 813 → none |

  Hero heights, 375 / 1440: starter 909 → 762 / 1001 → 908px; tracker 907
  → 760 / 999 → 906px; director 1128 → 981 / 1308 → 1215px. The moved
  buttons sit at page y 5407 / 5346 / 4847 (starter, at 375 / 412 /
  1440), 3356 / 3356 / 2665 (tracker) and 2546 / 2418 / 2273 (director).
- **The phone bar** (`pb-bookbar.js`, unchanged, question 8) rises earlier
  because the heroes are shorter: at 375 x 812, starter 1025 → 900px,
  tracker 1025 → 875, director 1250 → 1100 (412 x 915: the same, director
  1200 → 1050). It now shares screens with the moved buttons (at 375:
  starter about 4600-5475, tracker 2550-3425, director 1750-2600), so two
  booking asks with their reasons can be on one phone screen.
- **Build check 46** (`tests/build.test.py:2319`): each hero has no booking
  link and keeps its ghost button and its chat picture's question and
  answer; the moved block (button, arrow, `pagebuild.REASON`) stands once,
  after the first figures, directly before the expected next section.
  Four mutants caught, among them the chat picture's link put back on
  tracker. Build 436 → 441.
- The six protected calculators, their part folders and `assets/js`:
  byte-identical.

## Item 2, teal for the State alone (Q14)

- **The token:** `--slate:#586B85`, a blue-grey (hue 215°, saturation
  0.20, lightness 0.43; `tools/design-measure.py` counts it as a neutral),
  after `--red` in the first `:root` of the 19 hand-written pages and both
  games; the ten built pages take it from the skeleton.
- **Contrast** (WCAG relative luminance, computed):

| Pair | Ratio |
|---|---|
| Slate on white / white on slate | 5.45 / 5.45 |
| Slate on `--bg` / on `--surface-2` / on the hero wash / on `--amber-soft` | 5.21 / 4.98 / 5.00 / 4.77 |
| Slate on `--teal-50` | 4.90 against the token #E8F6F3 (the rubric's figure); 5.06 against #E6FBF7, the later `:root` value the entitlement page renders |
| Slate against `--ink` | 3.14 |
| Never the only cue: slate against `--red` / `--ink-3` (#5D6C67; 1.08 against the first root's #647270) / `--ink-2` | 1.32 / 1.01 / 1.16 |
| The neutral chips: ink on `--surface-2`, with a `--line-2` border | 15.65 |
| The readiness scale's "On the way": slate at .5 on white | about 2.1 (it was about 1.2 in teal-100; named in words) |

  Where slate meets red, ink-3 or ink-2, a key, a dash, a pattern, a white
  edge or a label carries the difference (the rubric's `--slate` row).
- **What moved off teal, aqua or mint** (colours only):
  - home: the way-of-life figures (`.pb-life-n`) and the month's category
    bars (`.pb-life-rows i`); the "through life" card's age, ruler fill and
    marker (`.pb-tl-age`, `.pb-tl-fill`, `.pb-tl-mark`); the timeline's
    active dot, fill and ring;
  - starter: the pot bars (`.pb-sa-fill`) in the three time charts;
  - every page's stat figure (`.pb-stat-n`), which shows only on
    director.html: "57%" and "68%";
  - pension calculator (and the ten built pages through the skeleton):
    the key dot of "Your plan", the growth chart's line #0B7A6E and its
    shading (by two CSS rules over the script-drawn SVG; the script still
    draws #0B7A6E, build check 47 pins it), and the "Add just €100 a
    month…" card (light grey, dark text);
  - director calculator: "Into your pension" (`.vs-pension`, `.vt`,
    `.amt`) and the same two chart rules;
  - the comparison: "Personal pension" and "Your top-up" (`.vs-pension`),
    the two lanes of "Side by side" and of "Everything paid in, by 66",
    the scale's end mark, and the "Your year" chip;
  - the charges calculator: the other plan's line and its key;
  - my-pensions: the bars;
  - readiness check (held): "On the way" (slate at .5) and "In good shape";
  - the jargon buster's risk tiles: 1 and 2 light grey, 3 and 4 a darker
    grey, 5 to 7 slate with white digits;
  - the reader's own place on a scale, to ink on light grey or a slate
    mark: the "You" chip on every relief ladder (`.pb-lad-you`); the picked
    year on the threshold page's strip (`.sft-on`); on the entitlement
    check, the "Your average" chip (`.yal-you`), the transition glide's
    "Your year" dot (`.pb-glide-you`, slate, white text) and its bar's
    edge.
- **What stayed teal:** the State's: the home gap chart's State bar, the
  starter's State bar and figure, the reality check's bars and jar, the
  entitlement check's State marks and the glide's own bars. Amber stays the
  State's top-up into auto-enrolment. The accent stays: buttons, links,
  slider tracks and values, eyebrows, the dark band, mint, card hovers
  (`.pb-tl-step:hover` included), the pressed state of a button.
- **Colours only, proved** against `BASELINE_REF=f9363a7` (item 1):
  `tests/render-diff/classify-pain-red.py`, with a new `--touched` option
  naming the eleven pages the change paints at load (index, starter,
  director, glossary, the pension and director calculators, the
  comparison, charges, readiness, threshold, entitlement): PASS at 375 and
  1440, "every difference is paint, in the site's own colours"; 62
  page-widths, 282 frames, 17,784 elements, 203 differing in colour, 44
  distinct (property, old, new). Per width: pension calculator 13,
  director calculator 5, comparison 20, entitlement 20, director.html 8,
  glossary 13, starter 13, home 3 at 375 and 6 at 1440, charges 2,
  readiness 2, threshold 1; every other page 0 (the `:root` token only).
  New colours: slate rgb(88,107,133), surface-2 rgb(244,245,243), line-2
  rgb(216,223,220) and ink rgb(11,31,28) only; opacity 1 → 0.12 (the
  growth-chart shading) and 1 → 0.5 (readiness). The self-test: FAIL
  text, FAIL geometry, FAIL hidden, PASS colour-only. `browser-diff.py`: 0
  differing on all six calculators (pension 1,008 cells, director 348,
  comparison 6,832, reality 198, entitlement 902, PIA 1,248). No script
  changed. `verify.py`: 0 FAIL, contrast included. my-pensions' bars draw
  only after input, so a Chrome probe checked them, the home life bars,
  the timeline and its active dot, both growth charts and the
  entitlement glide (at load on 2028, and on 2031 after the birth slider
  moves to 1965).
- **Build check 47** (`tests/build.test.py:2390`): none of the selectors
  above may be teal again (a teal, aqua or mint token, or one of their raw
  hex values; grouped rules caught); the skeleton carries `--slate:#586B85`;
  the growth-chart scripts still draw #0B7A6E. Three mutants. Build 445.
- **Docs:** `docs/DESIGN-RUBRIC.md` (three chart colours with one meaning
  each, the new `--slate` row, the accent rule, "for a figure or its label
  only"), `CONTEXT.md` ("What the State pays"), `tests/render-diff/README.md`.
- **Deviations from the plan**, each a fix a reviewer asked for: the
  entitlement check's "Your average" chip and the glide's "Your year" dot,
  missed by the plan, are neutral too; the timeline's active dot has a
  slate ring as well as a slate fill; check 47's matcher is stricter. The
  classifier's counts are higher than the prototype's (it counts the
  descendants that inherit a colour).
- **Gate:** the implementer's last gate did not finish; the reviewer's
  re-run (`gate43-C2-rev`) and the orchestrator's (`gate43-C2-final`)
  passed: no new FAIL, no crash.

## Item 3, cuts that only repeated

Nine edits, words removed only; nothing added or reworded; no colour
changed. Each was checked against the page before it was cut.

1. **S-8, starter.html, "Already being auto-enrolled?":** "My Future Fund
   is the auto-enrolment scheme. The comparison tool shows both, side by
   side, for your salary and age." The page's Related pages card
   "Auto-enrolment comparison" says it word for word
   (`starter.html:2847`). "Compare the two side by side" stays.
2. **T-6, tracker.html, under the tick list:** "Know roughly what some are
   worth already? List them in one view, with the total and what the
   charges come to." The Related pages card "All your pensions in one
   view" says it.
3. **D-9, director.html, "The coverage gap":** the button "Try the
   director calculator". The hero keeps the same button, and "Open the
   director calculator" follows two sections later (`director.html:2382`).
4. **D-8, sentence 2 only, the same band:** "Company funding is not capped
   by the salary percentages that limit everyone else." It stands word for
   word in the ladder's note one section above (`director.html:2339`).
   Sentence 1, the 57% and 68% and their source (Central Statistics
   Office (CSO), Pension Coverage, Quarter 3 2025) stay.
5. **B-2, booking.html:** the card "20 minutes, that's it" / "A short,
   no-strings chat about your pension." The heading, the line under it
   ("Twenty minutes with Damian, by phone or video, at a time you choose.
   Free, with no obligation.") and "The house promise" say it. "Phone or
   video" / "Pick whichever you prefer when you book." stays.
6. **Y-2 and Y-3, thank-you.html:** the cards "20 minutes, that’s it" / "A
   short, no-strings chat about your pension." and "Phone or video" /
   "Whichever you picked when you booked.". The line under the heading
   ("Twenty minutes with Damian, by phone or video, at the time you chose.
   Free, with no obligation.") and the step "Damian gets in touch" ("Phone
   or video, whichever you picked when you booked.") say them.
7. **R-3, director-pension-rules.html** (`tools/director-rules-parts/`):
   "The Standard Fund Threshold check shows how much of it your pensions
   would use in a given year." Its Related pages card says it; the
   threshold and €500,000 facts before it stay. One focusable link fewer,
   so floating-chrome's baseline line relabels (59) → (58).
8. **C-2, old-pension-checklist.html:** "Once you know what you have, the
   pension charges calculator shows what its charges could take by
   retirement." Its Related pages card says it. The paragraph now reads
   "We can do the asking for you: see how we help you find old pensions.
   Or book a free call with Damian."
9. **M1, my-pensions.html** (`tools/pots-parts/`): "What could the charges
   cost by retirement? The charges calculator." Its Related pages card
   says it.

No fact, figure, source, caveat, warning, consent or privacy line, reason
line, FAQ answer or JSON-LD left any page. Diff: 10 files, 4 insertions,
25 deletions. **Not cut, by the conservative rule:** the home FAQ "Is the
first chat really free?" (D7: its answer holds facts, and SUBTRACTION-AUDIT
question 6 is open); O-2 (Pensions after 50) and Z-2 (the year-end
checklist), each of which would leave a bare ask; D-8's first sentence
(the claim the figures support, said nowhere else). Every other row stays
listed in `docs/CUT-LIST-42.md` with the reason it was not cut (a reason
line, a chat picture, an FAQ answer, a guard such as check 31 or 38, a
caveat, a sentence a script writes, or a rewrite needed); this commit
marks the list. `tracker.html:333-334`, the two `.pb-trace-more` rules,
now match nothing (left; harmless).

## Item 4, the S proposals

Built: ranks 1, 2, 3, 4, 6, 7, 9, 14 and 15 (1, 2, 3, 4, 9 and 14
adapted). Not built: rank 13 (waits for Budget day, 6 October, and
`docs/PIA-BUDGET-DAY.md`) and rank 16 (question 19 accepted). Every new
moving part follows the motion rules: a figure changes only because the
reader moved a control; the markup carries the finished default; no
transition, reveal or easing on any new part; nothing stored.

**4a (bcdea74): ranks 7, 2, 4 and 1.**
- **Rank 7, my-pensions:** the euro figure in "The annual charges you know
  of come to about €[x] a year…" is bold red (charges taken from a pot).
  No words changed.
- **Rank 2 (adapted), the threshold page, "The threshold, year by
  year":** a bar, hidden from screen readers, whose key repeats the page's
  figures: "Your pensions €1,650,000", "The threshold for 2026
  €2,200,000" (from 2030: "The threshold for 2030 or later", "At least
  €2,800,000"), and when over, "€550,000 over" (from 2030: "Up to €200,000
  over"). Your pensions solid slate; the part over the threshold hatched
  slate, not red (the excess is not money missing; its tax is in "Over the
  threshold"); the threshold a 2px ink mark.
- **Rank 4 (adapted), "Tax on the lump sum":** a bar after the table's
  qualifier, hidden from screen readers, keyed "Tax-free €200,000", "In
  the 20% band €200,000" and, above €500,000, "Taxed as income €[x]".
  Slate in three patterns (an outline, a hatch, solid) with 3px gaps; no
  red (the table's "Tax at 20%" stays red).
- **Rank 1 (adapted), the charges chart:** one solid red area between the
  no-charge line and your plan's line; the other plan's slate line gets a
  white edge where it crosses the red (slate on red is 1.32:1); the key
  gains "What your plan’s charges take"; the chart's spoken label gains
  "The red area is what your plan’s charges take: €58,754 by retirement."
  when the cost is €0.50 or more. No right-edge labels.
- **Proof:** the six protected pages byte-identical. New
  `tests/interactive-43.test.py` (the gap-band pattern: a probe first in
  `<head>`, a layout-shift observer, POSTed records): 9 scenarios, 167
  checks, ALL PASS; six hand-run mutants each caught. `pagebuild.py` gains
  three marker checks (build total unchanged at 445). The chart keeps its
  height (222.3px at 1440, 170.8px at 500); the lump-sum bar's parts 2:3:5
  at a €1,000,000 lump; no layout shift from a new part.
- **Deviations:** the plan's F8 ("under 140px tall at 500") cannot hold
  (the chart's fixed viewBox gives 170.8px on main too); the test holds
  the plot (133.9px) and the chart's ratio instead. The layout-shift check
  counts only shifts before the probe acts (synthetic input does not set
  `hadRecentInput`); every shift is still recorded.

**4b (ad48b21): ranks 3 and 14, the home page.**
- **Rank 3 (adapted), the hero chart:** with JavaScript, its three figures
  become toggle buttons, named "€40,860 What people expect to need",
  "€25,296 a year short" and "€15,564 What the State Pension pays", each
  covering its own bar (the whole bar is the tap target, the words "a year
  short" included); `#pbGap` becomes a labelled group; a dotted underline,
  solid while pressed. A press writes one line **after** the caveat "These
  are survey averages…" ("Royal London Ireland, 2026." stays): "€40,860 a
  year is the survey average for what people expect to need (Royal London
  Ireland, 2026)."; "€[x] a year is your own figure, set with the slider
  above."; "€[x] a year is the Pensions Council’s [Modest | Moderate |
  Comfortable] standard of living [for one person | for a couple], at 2024
  prices."; "€15,564 a year is the State Pension (Contributory) at the
  maximum personal rate: €299.30 a week from January 2026, 52 weekly
  payments. Rates change, usually at each Budget." (a couple: "€31,127 a
  year is two State Pensions (Contributory), each at the maximum personal
  rate: …"); "€25,296 a year is €40,860 less €15,564."
  (`index.html:3167-3172`).
  The rate comes from `PBStatePension.MAX_WEEKLY_CENTS`, €299.30 as the
  fallback. A press changes no figure and moves nothing; the line is
  polite to a screen reader only after a press. Without JavaScript the
  chart is as it was.
- **Rank 14 (adapted), "What changes, and when.", below 921px only:** a
  "Your age" slider (18 to 75, default 40) and a line, "25% From 40",
  that picks the **relief** step only (18, 30, 40, 50, 55, 60): at 62 it
  reads "40% From 60", never the ARF's "4%". Its spoken value: "62: 40%,
  From 60". The picked step turns light grey with a slate dot and ring;
  no step moves.
- **Proof:** rects of the figures, bars, gap block, source and caveat
  identical to bcdea74 at 1440, 500 and 375; only `#through-life` grows
  (+142.64px at narrow widths). `interactive-43`: 15 scenarios, 278
  checks; ten mutants caught. `tests/gap-band.py` measures the clipping
  bar from `closest('.pb-gap-bar,.pb-gap-short')` (the figure now sits in
  a button); 11 scenarios pass. Floating-chrome's index line relabels
  (86) → (90): three hero buttons and the slider.
- **Deviations** (reviewers'): the picked step's ring is slate too; the
  empty line sits at zero height, so its live region exists before its
  first words; the buttons cover their bars; the caption "a year short"
  lets taps through to its button.

**4c (b801ad0): ranks 6, 15 and 9.**
- **Ranks 6 and 15:** a "Your age" slider over the relief ladders on
  starter (default 30) and director (48), and two new ladders with sliders
  on the guides: pensions-over-50 (default 50; caption "Revenue's limit on
  the contributions that get tax relief, as a share of earnings.", note
  "Earnings count up to €115,000.", after "Catching up"'s bands paragraph)
  and self-employed-pensions (default 40; caption "Revenue's limit on the
  contributions that get tax relief, as a share of net relevant
  earnings.", note "Net relevant earnings count up to €115,000.", after
  "Tax relief", before "The October deadline"); six rows each, "Under 30
  15%" to "60 and over 40%", as on starter. The slider moves the "You"
  chip; its spoken value reads "30, 20%". The control is drawn only with
  script.
- **Rank 9 (adapted), starter, "Already being auto-enrolled?":** four
  buttons, "2026 to 2028", "2029 to 2031", "2032 to 2034", "2035 onward"
  (spoken "Auto-enrolment rates, by years"), each showing that phase's
  contributions at the reader's salary, at the rates the page and the
  comparison state; and, always shown, the comparison's reviewed caveat
  shortened by one clause (`starter.html:2736`; the comparison's
  `broker-vs-autoenrolment.html:2910` goes on "…the later phase rates and
  years, and the position that the scheme does not currently accept
  contributions above its set rate."): "Checked against gov.ie on 10 September 2026: the
  2026 contribution rates, and that all three contributions stop at
  €80,000 of salary. Still taken from third-party summaries rather than
  the primary text: the later phase rates and years. Confirm those against
  gov.ie or the National Automatic Enrolment Retirement Savings Authority
  (NAERSA) before relying on them. Rates and rules can change." The
  pressed button uses the control accent (teal-700 on teal-50), not data.
  The default phase follows the clock.
- **Proof**, against `BASELINE_REF=ad48b21`: `load.js` the same writes in
  the same order on all six protected pages; `sequences.js all 400 40` 6 x
  16,000 events, 0 differing; `browser-diff.py` 0 differing (the new
  `pb-ladder.js` really loaded on the pension calculator and the
  comparison). `interactive-43`: 24 scenarios, 404 checks; twelve mutants
  caught. No row moves when the "You" chip changes row.
- **Deviations:** an extra rule (`margin:-2px` on the chip, age-only
  ladders) stops every row below the chip moving 1.45px; the calculators'
  ladders keep that pre-existing reflow. Inserting the caveat moved the
  starter's auto-enrolment jargon chip into it, splitting the authority's
  name; the caveat carries `pb-noterms` and `assets/js/pb-jargon-chips.js`'s
  SKIP gains `.pb-noterms`, so the chips are where they were.

## Item 5, the asks after each result

**5d, the reason line (adc7db4, 09d4c71).**
- **Cut:** "Free, 20 minutes, no obligation." **Added, in Damian's
  words:** "Free · 20 minutes · no obligation · reschedule any time." (a
  middle dot, U+00B7, a space either side; written `\u00b7` in the three
  scripts, which stay ASCII). One string, `pagebuild.REASON`
  (`tools/pagebuild.py:152`).
- **Swapped where it stood (22 places: 20 in pages and the game, and the two scripts):** the comparison (twice: the
  results link and the hidden `#riskCard`), the directors' rules, the
  held finder and readiness check, the threshold page's "Next step" card,
  the pension and director calculators' "Talk it through, free", home
  "Get my free review", the three moved audience buttons, tracker's
  "Start finding mine", the five guides, the 404 page, Buddy's Run, the
  phone bar and the Ask Buddy panel. Twelve more pages changed only in
  their scripts' `?v=` stamps.
- **Added where there was none:** under the button of the 13 closing
  bands (five dark: home, starter, tracker, director, glossary; eight
  calculator and tool bands); under the home chat picture's link (Buddy's
  line above it stays); at the end of Jargon Battle (one new rule in the
  game's own CSS); on the saved or printed report, after "Talk them
  through with Damian in a free 20-minute call: …/booking.html". The
  TRUST CSS recipe stays byte-identical on all 29 root pages
  (`trust_drift {}`).
- **Not beside, by name** (plan 0.3 item 8, Run 26's judgement): the nav's
  "Book a call with Damian for free" and the footer's "Book a call" (site
  furniture); the booking page itself, where every ask leads ("Free, with
  no obligation." is its own sub-line); the inline "booking page" links on
  Privacy, Terms and Complaints; "book a free call" inside the email
  forms' error and fallback messages.
- **Where it stands now:** 39 times on 23 root pages, once in each game,
  and in three scripts (the phone bar, the Ask Buddy panel, the report).
- **Measured** (Chrome, CSS px): the phone bar 100 → 122px at 375 x 812
  and 152 → 174px at 320 x 568 (the line wraps to two lines, "time." alone
  on the second at 375); no sideways scroll. Dark bands +58px at 320 and
  375, +34px at 1440, the line 10px under the button; calculator bands
  keep their height at 1440 (pension calculator 265 → 265), +60px at 375
  and +84px at 320, the line 12px under the button (10 at 1440). Home
  `#call` picture 43px taller. Jargon Battle's panel scrolls inside the
  glossary's frame at 1440 and 768; nothing clipped.
- **Build check 48** (`tests/build.test.py:2459`): every booking link in a
  root page's own content has `pagebuild.REASON` after it, before the next
  booking link and within 700 characters; the nav, footer and scripts
  aside; booking.html and "booking page" links exempt. Two mutants. Build
  448. The check reads root pages only: the games' and the report's lines
  have no test of their own.
- **Proof:** new `tests/render-diff/classify-give-then-ask.py`. `--reason`
  (`BASELINE_REF=b801ad0`): every differing cell is the old cell with the
  line swapped, PASS on all six (pension 32 of 1,008 cells over 16 frames,
  director 12 of 348, comparison 183 of 6,832, reality 6 of 198,
  entitlement 11 of 902, PIA 16 of 1,248). `--bands`
  (`BASELINE_REF=adc7db4`): only `#main` differs, in every frame, by the
  line inserted once after the band's button; PASS on all six. Its
  self-test judges 11 cases.

**5a, 5b and 5e: under each calculator's results (d369306).** In this
order, as the last thing in the results column and before the closing
band: what it doesn't show (`#pbAfterNot`, a caveat, 16px); the offer to
email the results; then `#pbAfter`: "Want to go through this with
Damian?", one booking link, and the reason line. It is the only booking
link in the results.

| Page | "What this doesn’t show: …" | The email offer | The link |
|---|---|---|---|
| pension-calculator | "product charges, inflation, the tax on your income when you draw it." | its own form, button now "Email me my results" | "Talk it through, free" (moved from "The cost of waiting") |
| director-calculator | "your company’s exact funding limit, product charges, inflation." | its own form, button now "Email me my results" | "Talk it through, free" (moved from "The cost of waiting") |
| broker-vs-autoenrolment, after "Before you rely on these rates" | "your old pensions, product charges, your employer’s own scheme." | new (calculator-results) | "Talk through what this means for you" (moved from "In one sentence") |
| pension-fees-calculator | "policy, set-up and exit charges, the terms an older plan may carry, your tax relief." | new | "Talk it through, free" |
| state-pension-reality-check | "your old pensions, your tax position, your employer’s scheme." (Damian's words) | new | "Talk it through, free" |
| state-pension-entitlement | "your old pensions, your tax position, your employer’s scheme." (Damian's words) | new | "Talk it through, free" |
| standard-fund-threshold | "what your pensions are worth, your tax position, a Personal Fund Threshold you may hold." | new | "Talk it through, free" |
| pia | "your old pensions, fees and charges, your employer’s scheme." | new | "Talk it through, free" |
| my-pensions, after "Print or save this list" | "what your pensions could grow to, your tax position, the terms each one carries." | none (below) | "Talk it through, free" |

- **The loop lines:** Damian's sentence word for word where it is true for
  every reader, the two State Pension pages. Elsewhere an item that would
  not be true for every reader is swapped for one the page's own
  assumptions state, so each page names only what it says it leaves out
  ("not adjusted for inflation and ignore product charges"; "This tool
  does not perform that calculation."; "None of these is included"; "does
  not value your pensions, does not know your tax position"; "Fees and
  charges are left out of all three"; "Nothing here is a projection"), in
  Damian's form.
- **The new email offer, six pages** (one Netlify form name,
  `calculator-results`, the same fields in the same order: form-name,
  results, inputs, link, page, bot-field, email): "Want these figures
  emailed to you?", "Damian sends them himself, so they will not arrive
  straight away.", the field "Your email", "Email me my results", "Please
  enter a valid email address.", "We use your email to reply to this
  request, and for nothing else. See our Privacy Notice. This is
  information, not advice.", and "Thanks - we've got it. Damian will be in
  touch personally.". No opt-in box: the Privacy Notice's sentence on the
  occasional emails is still a placeholder (pack 3.2). Sent through
  `PBForms`; if Netlify refuses, the reader's email app opens addressed to
  `hello@pensionbuddy.ie`, subject "Results request", body "Please send me
  my results." then "My email:", "Results:", "Figures used:", "Open these
  figures again:" and "From:", and the page says "Your email app should
  have opened with the figures ready to send to Damian." Netlify stores the
  request and emails the reader nothing; the figures reach the reader only
  if Damian sends them (Needs Damian 2). The pension and director forms
  keep their own names, words and opt-in box; only their button changed
  ("Email my results" → "Email me my results"). Their failure messages
  ("…If it didn't, book a free call…") now sit a block above the new ask.
- **Moved, words unchanged** (5e puts the offer before the ask): "Talk it
  through, free" and its reason left the pension and director calculators'
  "The cost of waiting" card (which keeps its title and figure) for after
  the email form; "Talk through what this means for you" and its reason
  left the comparison's "In one sentence" for after "Before you rely on
  these rates" and the new offer.
- **my-pensions: 5e is not met.** The page says "nothing leaves this page"
  and "Nothing you type is sent or stored", so it has no form; "Print or
  save this list" comes before the line and the ask. The printout keeps
  the line and leaves the ask out (`tools/pots-parts/page.css`, the
  review's fix).
- **5c, the booking page** (`booking.html:2033`), above the heading:
  "You’ve seen your number. Last step: 20 minutes with Damian." (Damian's
  words). An inline script shows it before the first paint when the
  address ends `#from=` with one of the nine calculators' names; never
  without JavaScript; anyone else sees the page as before. The
  calculators' new link (`assets/js/pb-after.js`) adds `#from=<calculator>`
  only when (1) the reader has moved one of that calculator's own controls
  themselves (a trusted input, change or button press inside
  `[data-pb-calc]`, never the guess card, Save as A, the share row, the
  email form or the block; one exception, the input the reality check's
  jar fires within a second of a trusted press on it; a shared link's
  replayed figures never count), (2) no figure is still behind "Take a
  guess first", and (3) a result on screen shows a number. The site sends
  nothing with the fragment; if the reader accepted analytics, Tag Manager
  may record the page address as for any page.
- **The Privacy Notice** (`privacy.html:2069`, "Last updated: 4 October
  2026"): "The figures you enter into them are not sent to us or stored,
  unless you ask us to email you the results: then what the calculator
  shows, the figures you chose and your email address reach us through a
  form on this website. “Email them to yourself” opens your own email app
  and sends us nothing." It read "…unless you separately choose to email
  yourself the results.", which pack 3.3 had flagged. On the site,
  proposed (pack 3.3).
- **Tests:** build check 14 knows eight form names and holds the six
  calculator-results forms to one field list (+6); new build check 49
  (`tests/build.test.py:2502`): each calculator's line, offer and ask, in
  that order, word for word, and no other booking link in the results
  before it (`#riskCard` exempt only while hidden); the booking page
  answers only the nine (5 assertions; build 459). `tests/lead-forms.test.py`
  gains the six pages (27 jobs; 379 passed, the baseline's two Calendly
  failures). New `tests/give-then-ask.test.mjs`, G1 to G13 with G3b, G4b
  and G7b: the parts, the plain link at load, a trusted move, a shared
  link (and an untrusted event) not counting, the jar, a nil result, the
  order, the comparison's place, no link left in the waitcards, no-JS,
  the booking page's line, the mailto fallback, no checkbox, and the
  my-pensions printout; 118 checks at the final gate. Mutation: dropping
  the `isTrusted` guard fails G4b, the veil check G3, `aNumber()` G6.
- **Proof:** `classify-give-then-ask.py`, default mode,
  `BASELINE_REF=09d4c71`: PASS on all six (pension 32 differing cells in
  16 frames, all explained; director 12 in 6; comparison 61 in 61;
  reality 6 in 6; entitlement 11 in 11; PIA 32 in 16); four more runs
  PASS. `load.js` the same writes; `sequences.js all 400 40` 0 differing.
- **Measured** (the gap from the block's link to the closing band's
  button, CSS px):

| Calculator | 375 | 1440 |
|---|---|---|
| pension | 839 | 436 |
| director | 953 | 438 |
| comparison (the band's button has the same words) | 981 | 478 |
| charges | 594 | 240 |
| reality check | 2,168 | 1,128 |
| entitlement | 3,496 | 1,794 |
| threshold | 622 | 227 |
| PIA | 2,390 | 1,009 |
| my-pensions | no band | no band |

  The plan said the band follows the new link within a screen on every
  calculator: false on the reality check, the entitlement check and PIA,
  which have explainers between; true at 1440 on the other five. The
  threshold page ends with three asks: the block's link, the band (622 /
  227 below it) and the "Next step" card (2,440 / 1,186 below it). The
  block is 210px tall at 375 and 161px at 1440; no sideways scroll.
- **Deviations:** the classifier's MOVED rule carries a count (the
  comparison's moved words also stand on its band since 5b); and an Ask
  Buddy set-aside, not in the plan: Ask Buddy's cells are built by a
  late-started script, so a load frame can catch them on one side only;
  such cells are set aside only when on one side and only while
  `assets/js/pb-buddy.js` is byte-identical to the baseline, counted and
  printed, with three self-test cases. The proof is timing-sensitive
  (a reviewer's re-runs each failed one load frame on a page this item
  does not change before passing).

## Booking calls to action after Run 43: which reason each has

| Where | Its reason |
|---|---|
| Home "Get my free review" (end of `#life`) | the line |
| Home chat picture's link, under "How a call with Damian works" | the line, added; Buddy's line above it stays |
| Home, starter, tracker, directors' and glossary closing bands | the line, added under the button |
| Starter "Help me get started", tracker "Help me find my pensions", directors' "Book a call with Damian for free" | the line; moved after the first give (item 1) |
| Starter, tracker and directors' chat pictures | no link since Run 43 (P1) |
| Tracker "Start finding mine" ("Worth knowing" band) | the line |
| The nine calculators' one link after their results | the line; pension and director "Talk it through, free" and the comparison's "Talk through what this means for you" moved there |
| The comparison's "Talk the choice through with Damian" (card hidden since Run 30) | the line |
| The eight calculator and tool bands | the line, added under the button |
| The threshold page's "Next step" card | the line's words in its own span |
| Directors' rules, five guides, 404, held finder and readiness check | the line |
| Ask Buddy panel, phone booking bar | the line |
| Buddy's Run, Jargon Battle | the line (Jargon Battle's added) |
| The saved report | the line, added after "Talk them through with Damian in a free 20-minute call" |
| Not beside, by name | the nav's "Book a call with Damian for free" and the footer's "Book a call" (site furniture), the booking page itself, "booking page" in the Privacy Notice, Terms and complaints text, "book a free call" inside the email forms' messages |

## The gate, per commit

Each commit ran the full gate (`run-tests.py`, every `tests/*.test.py`,
`tests/gap-band.py`, every `tests/*.test.mjs`, `tools/verify.py
--no-shots`), one suite at a time, compared line by line with main
`6af9f77`'s own run on the same machine before the first commit. Pass: no
failing line main did not have, no crash; three relabels were expected
(same check, same page, a new count) and are the only new lines.

| Commit | Result |
|---|---|
| f9363a7 | pass. build 441/0, ux4 64/0, boxes 8/0, verify 0 FAIL; no relabel |
| a613784 | pass (the reviewer's and the orchestrator's runs; see item 2). build 445/0, verify 0 FAIL, its five WARNs main's own |
| e53afba | pass on the re-run. build 445/0, ux4 64/0; relabel: floating-chrome director-pension-rules (59) → (58). The first run also had ux4's R38-2 time out on index.html, which this commit does not touch; ux4 alone then passed 64/64 three times |
| bcdea74 | pass. build 445/0, interactive-43 167/0, verify 0 FAIL |
| ad48b21 | pass. build 445/0, interactive-43 278/0, gap-band 11 scenarios; relabel: floating-chrome index (86) → (90) |
| b801ad0 | pass. build 445/0, interactive-43 404/0, terms the baseline's three, verify 0 FAIL |
| adc7db4 | pass. build 445/0, ux4, games, boxes, interactive-43 and verify clean |
| 09d4c71 | pass. build 448/0, games 168/0, verify 0 FAIL |
| d369306 | pass, run after the review's fix to the my-pensions printout. build 459/0, lead-forms 379 passed and 2 failed (relabel: its summary, 211 → 379, the six new pages), give-then-ask 118/0, interactive-43 404/0, providers 86/0, search 22/0, ux4 64/0, boxes 8/0, verify 0 FAIL |
| this commit | docs and the sitemap only; the orchestrator gates it before the merge |

Every commit also ran `stamp-images.py --check`, `site-index.py --check`,
`seo.py --check`, `check-initialisms.py` and `sync-chrome.py --check`
(all clean) and a second `pagebuild.py` (the tree byte for byte).
`sitemap.py --check` reported stale lastmods from C1 on; this commit
rewrites the sitemap.

**What failed, and why it was the environment's, not the site's** (as in
Run 42). This machine's headless Chromium cannot play H.264, has no mouse,
cannot load Calendly and draws the cookie bar a little wider at 320px; ux4
ran from a copy with WebM videos only. Main printed 34 failing lines in
five suites: `consent.test.py` 15 (check 9 at 320 x 568 on 14 pages, and
its summary, 700 passed, 14 failed); `floating-chrome.test.mjs` 5 (check
2 on booking, the directors' rules and the home page, check 5, and its
summary, 31 passed, 4 failed); `lead-forms.test.py` 3 (the booking form's
two "no script error" lines, Calendly, and its summary); `nav.test.py` 7
(hovering on the home page and the director calculator, and its summary,
464 passed, 6 failed); `terms.test.mjs` 4 (the directors' rules marking
check, hovering on the over-50s and threshold pages at 1440, and its
summary, 45 passed, 3 failed). Every other suite exited 0 on every
commit.

## Screenshots and Lighthouse

**Screenshots.** Every page at 375 and 1440, taken by `tools/verify.py`
screen by screen (frames 900px tall, reduced motion forced, the cookie
choice made). Before: main `6af9f77` (identical in every page to Run
42's after-set, so that set was reused). After: `claude/give-then-ask`
at `d369306`, 62 shots; `verify.py` on the after tree: TOTAL FAIL 0 at
375, 1360 and 1440. The shots are kept outside the repo (`verify-out/`
is git-ignored). The environment is Run 42's: headless Chromium 141 on
Linux as root (`--no-sandbox` through a wrapper), `TZ=Europe/Dublin`,
and a Pillow stand-in for macOS `sips`; the repo's tools are unchanged.

**Lighthouse** 13.5.0, mobile (default throttling), performance and
accessibility, before (`6af9f77`) and after (`d369306`) interleaved, the
order alternating, median. Three runs a side; nine a side on the four
pages whose first three runs moved by three points or more.

| Page | Performance | Accessibility | LCP, s | CLS | TBT, ms |
|---|---|---|---|---|---|
| index.html | 87 to 93 | 97 to 97 | 3.15 to 2.93 | 0 to 0 | 157 to 39 |
| starter.html (9 a side) | 94 to 95 | 96 to 96 | 2.55 to 2.71 | 0.0012 to 0.0012 | 0 to 0 |
| tracker.html | 94 to 96 | 96 to 96 | 2.93 to 2.48 | 0 to 0 | 0 to 0 |
| director.html | 95 to 96 | 97 to 97 | 2.85 to 2.56 | 0 to 0 | 0 to 0 |
| pension-calculator.html (9 a side) | 91 to 91 | 97 to 97 | 3.00 to 3.00 | 0 to 0 | 0 to 0 |
| director-calculator.html | 91 to 92 | 97 to 97 | 3.00 to 2.85 | 0 to 0 | 0 to 0 |
| broker-vs-autoenrolment.html (9 a side) | 89 to 89 | 97 to 97 | 3.08 to 3.15 | 0 to 0 | 0 to 0 |
| pension-fees-calculator.html (9 a side) | 91 to 90 | 97 to 97 | 3.00 to 3.08 | 0 to 0 | 0 to 0 |
| booking.html | 96 to 96 | 96 to 96 | 2.40 to 2.41 | 0 to 0 | 0 to 0 |

- Accessibility is unchanged on all nine pages; no layout shift added.
- The home page's 87 to 93 is noise, not a gain: its three before-runs
  read 83, 87 and 94, its after-runs 92, 93 and 94.
- On the first three runs the fees calculator read 94 to 88, and the
  pension calculator and the comparison 91 to 88; nine runs a side put
  every one within a point. The fees page's LCP is 0.08 s later on the
  median (its new charges area, email form and after-result block), and
  starter's 0.16 s; neither is isolated further.

## Found on the way (not changed unless said)

- `director.html` `#pbTwoOut`: without script it reads "…4.35% PRSI (the
  rate from 1 October 2026)."; once the script runs, "…and 4.35% PRSI."
  without the date. The same on main.
- `tools/fees-parts/main.html:112`: "… has a guide to pension fees and
  charges explains each one." (a word missing; Run 42 found it too).
- The starter's later auto-enrolment rates are sourced to the Act
  (sections 54, 55, 61-63) while the comparison's reviewed caveat, now on
  starter too (shortened by one clause), says they are still from third-party summaries. For
  compliance.
- `docs/CUT-LIST-42.md:108` (`T-1`) names only the tracker hero's reason
  line, "Free, 20 minutes, no obligation.", though its note at line 116
  calls T-1 an ask; the button above it is in no row. "Neither T-1 nor
  T-7 cut" in the Decisions table means the button and its line both
  stay.
- At 1440 on the directors' page the ladder's caption ("The personal
  limit: the share of salary that gets tax relief") starts exactly where
  the benefits grid ends, with no space between (measured in headless
  Chromium: grid bottom and caption top both 1980px; the plan measured
  2px before item 4 added the age control).
- The ladder CSS comment (`starter.html:1844`, `director.html:1679`,
  `self-employed-pensions.html:2009`, `pensions-over-50.html:2009`) still
  says the ladders are "on the pension calculator and the comparison
  page"; it is now incomplete. Kept byte-identical; the new `.pb-lad-ctl`
  comment says where the control stands.
- With "2035 onward" picked, the starter's `#aeNote` reads "A year, at the
  2035 onward rates: …" (the module's own words; unreachable before).
- The starter's "THE 3 : 3 : 1 SPLIT" script comment still says "at this
  year's rates"; the new comment under it describes the picker.
- The pension calculator and the comparison's ladders still move the rows
  below the "You" chip 1.45px when it changes row (under Chrome's
  layout-shift threshold, visible).
- The ladders' age control is shown by CSS when script runs, not by
  `pb-ladder.js` having run: if that file failed to load, the slider would
  move and the chip would not.
- The starter page now has two age sliders ("Your age now" in "If you
  wait." and the ladder's "Your age") that do not follow each other.
- Build check 46 matches only a literal `href="booking.html"` in a hero, so
  a hero link to `booking.html#…` or `./booking.html` would pass; check 48
  reads root pages only.
- `tracker.html:333-334`: two `.pb-trace-more` rules match nothing since
  item 3.
- ux4's R38-2 ("reduced motion turned on part way") can time out on its
  200ms wait under load (once, at e53afba).
- Not updated in this commit, for a later run: `docs/ILLUSTRATIONS.md`
  (booking now has only "Phone or video" in its top cards; the
  confirmation page has none); `docs/SUBTRACTION-AUDIT.md` (thank-you row 2
  done; booking row 2 half done); `docs/PIA-BUDGET-DAY.md` (after Budget
  day, also check the home hero's State line, "€299.30 a week from
  January 2026" and its fallback in `index.html`, the starter's
  auto-enrolment phases and caveat, and the relief steps).

## Needs Damian (Run 43)

1. **Calendly, for "reschedule any time".** The line beside every ask
   promises it. In Calendly → Event Types → `pensionbuddy-1-1`, check
   that a booking can be rescheduled from its confirmation email right up
   to the start, with no minimum notice. If not, the line becomes "Free ·
   20 minutes · no obligation · reschedule from your confirmation email."
   (the confirmation page's own words): one string, `pagebuild.REASON`
   (`tools/pagebuild.py:152`), the literal line in the hand-written pages,
   the part files and the two games, the threshold page's "Next step"
   span, and the escaped line in `assets/js/pb-bookbar.js`, `pb-buddy.js`
   and `pb-report.js` (`grep -rl "reschedule any time"` lists them); then
   `pagebuild.py`, `stamp-images.py`, and build check 48 and the
   classifier follow `REASON`.
2. **"Email me my results" on six more calculators.** Netlify: set a
   notification for the new form name `calculator-results` before or on
   the deploy that carries it (Needs Damian 1 at the top). Until then
   requests sit in Netlify unseen. The six forms share that one name, so
   Netlify relies on their identical field lists: send one test request
   from a calculator on the deploy preview and see it arrive under
   `calculator-results` (plan risk 5). The offer says "Damian sends them
   himself, so they will not arrive straight away." and, once sent,
   "Damian will be in touch personally."; Netlify emails the reader
   nothing. Will you reply to each request yourself? If not, hide the six
   offers: `hidden` on `#ecCap` in the six part files, then `pagebuild.py`
   (the ask stays; the share row's "Email them to yourself" still comes
   before it).
3. **Question 7's "And their chat pictures?" was read as the cut** (P1):
   the starter, tracker and directors' pictures keep their question and
   Buddy's answer and lost their booking link. To put a link back, add
   these two lines after Buddy's answer in the picture (starter.html,
   tracker.html, director.html):
   `<p class="pb-phone-link"><a href="booking.html">Book a call with Damian for free</a></p>`
   and `pagebuild.REASON`'s line; build check 46 then needs its tracker
   mutant and its hero rule changed.
4. **my-pensions has no email offer** (5e not met): the page promises
   "nothing leaves this page" and "Nothing you type is sent or stored", and
   its "Print or save this list" already comes before the ask. Option: an
   "Email me this list" that opens the reader's own email app, addressed
   to no one, like "Email them to yourself" elsewhere; it sends the site
   nothing, but the eyebrow "nothing leaves this page" would need new
   words.
5. **The asks after each result, and the band after them.** On the
   threshold page three asks now end the page (the block's link, the band,
   the "Next step" card); on the comparison the block's link and the band's
   button have the same words; on the pension, director, comparison,
   charges and threshold pages the band follows the block within a screen
   at 1440. The gaps are in item 5's table. Keep all, or drop one (the
   threshold page's card, or the comparison's block link)?
6. **The booking page's line** (your words): "Last step" sits above the
   heading "…Twenty minutes with Damian starts it." and above "a clear
   sense of your next step", and says "20 minutes with Damian" just before
   the heading says "Twenty minutes with Damian"; "your number" is a
   stretch on the threshold page ("An illustration of Revenue’s rules, not
   a calculation of your own tax") and on my-pensions (a list). The
   alternative is "You’ve seen your figures. Next step: 20 minutes with
   Damian." Both go to compliance (pack 1.24 (b)).
7. **5a is met once per calculator, after its results,** not after each
   result. Not built: the design that puts the email offer, the line and
   the ask straight after the headline result, above the charts (it would
   ask for an email before the charts give). Not given an ask, by name:
   the home hero (ask-free since Run 42), the relief widgets (each links to
   the calculator), the glossary's drawdown and inflation sliders, the
   audience pages' illustrations (item 1's buttons serve them) and the
   held readiness check.
8. **"What this doesn’t show":** your words on the two State Pension
   pages; on the other seven each names only what that page's assumptions
   say it leaves out, so it is true for every reader (item 5's table).
9. **Colour, left for you:** the pension calculator's teal icon square
   (`.boost-ico`) beside a non-State figure; the teal rings of the home
   timeline's inactive dots (relief steps, not the State); the starter's
   pressed phase button (teal-700 on teal-50, the controls' accent);
   readiness "On the way" at about 2.1:1 (named in words); slate beside red
   on the starter's bars (1.32:1, the words carry it); the comparison's
   two lanes now one colour (named beside each).
10. **The hero's source line** sits after the caveat, so on a phone a
    press shows only the underline turning solid: at 375 x 812 the line
    starts 116px below the first screen, and at 1280 x 720 it starts at
    745px. A reader who picks a Pensions Council card and then lets it go
    hears "€[x] a year is your own figure, set with the slider above."
    though the card set it; a neutral alternative is "€[x] a year is the
    figure on the slider above.". The polite announcement was checked only
    in headless Chrome, not with a real screen reader. When the need is
    just above €15,564, the gap figure's focus ring is clipped.
11. **The phone timeline's line** ("35% From 55") does not say the figure
    is the share of earnings that gets tax relief (the list below says
    so); at 75 it repeats "40% From 60".
12. **Repetition near the asks:** at 375 the home `#call` picture's reason
    line and the phone bar's identical line are on screen together, about
    200px apart; the phone bar now shares screens with the three moved
    audience buttons. The pack asks compliance whether this reads as
    pressure (1.24 (g)).
13. **Budget day, 6 October:** the State rate in the hero's line (€299.30,
    from `PBStatePension`), the auto-enrolment phase rates and caveat, and
    the relief steps may change; rank 13 waits for it.
14. **The comparison's fund card, when it comes back** (Needs Damian 3
    at the top): since Run 43, deleting `hidden` on `#riskCard` fails the
    build. Its "Talk the choice through with Damian" sits in the results
    before the "Email me my results" block
    (`broker-vs-autoenrolment.html:2887` to 2896; `#pbAfter` at 2930),
    and build check 49 exempts the card only while it is hidden
    (`tests/build.test.py:2543`; plan risk 6). When you restore it, move
    that link after the email block, cut it, or change check 49.

Defaults taken without asking: Run 42's questions are in "Decisions, 4
October 2026" under Run 42; the build's own choices are below.

### Defaults taken in the build (one line each)

1. Questions 1, 3, 4, 5, 6, 20, 21, 22 and 24 are left as they are.
2. "Yes" to question 7 includes the chat pictures, read as P1's cut: the
   three audience pictures keep their question and answer and lose their
   booking link and reason line. The revert is two lines per page
   (Needs Damian 3).
3. The tracker keeps both asks: the moved button, then "Start finding
   mine".
4. The phone bar's code is unchanged. It rises earlier now that the
   heroes are shorter, and it is 22px taller with the longer reason line.
5. The calculators' in-results asks keep their words but move after
   "Email me my results"; 5a is met once per calculator, after its
   results, not after each result (Needs Damian 7).
6. Not given an ask: the relief widgets, the glossary's drawdown and
   inflation sliders, the home hero, the audience illustrations and the
   held readiness check.
7. The threshold page keeps its band and "Next step" card, so it ends
   with three asks; the distances to the band are measured and listed, not
   cut (Needs Damian 5).
8. my-pensions has no email form, because the page says nothing typed
   leaves it (Needs Damian 4).
9. The six new email forms carry no opt-in box until pack 3.2's sentence
   is approved. The pension and director calculators' forms keep theirs.
10. The reason line: Damian's words shipped ("Free · 20 minutes · no
    obligation · reschedule any time."); the alternative, "…reschedule
    from your confirmation email.", is in pack 1.24 (Needs Damian 1).
11. The booking page line: Damian's words shipped ("You’ve seen your
    number. Last step: 20 minutes with Damian."); the alternative, "You’ve
    seen your figures. Next step: 20 minutes with Damian.", is in pack
    1.24 (Needs Damian 6).
12. The reason line is not beside the nav button, the footer link, the
    booking page itself, the legal pages' inline "booking page" links or
    the forms' messages.
13. Colour: Run 42's other choices stand. The relief ladders stay amber,
    "The house promise" stays mint, the PIA rows wait for Budget day, the
    pictures are re-shot later. The "You" chips, the threshold strip's
    picked year and the timeline's step are neutral.
14. Cuts: nine edits that only repeat. The home FAQ (D7), O-2, Z-2, D-8's
    first sentence and every fact stay, as listed.
15. The red border on `#sftNote` and `#sftOver` is not made.
16. Interactive: ranks 1, 2, 3, 4, 9 and 14 are adapted (item 4); rank 9
    carries the comparison's reviewed caveat shortened by one clause.
    Rank 13 waits for Budget day; rank 16 is not built (question 19). The
    M proposals wait.
17. "What this doesn’t show": Damian's words on the two State Pension
    pages; on the other seven, only what each page's assumptions leave
    out (Needs Damian 8).
18. `#from=` is set only by the reader's own trusted move on the
    calculator, never by a shared link. The site sends nothing with it
    (`assets/js/pb-after.js:11-23`).
19. The Privacy Notice's calculators sentence is changed on the site,
    pending compliance (pack 3.3).

---

# Run 42 — 2026-10-03 · The home page opens on the gap; red for pain, amber for money back; give before ask; cuts (on `claude/pain-red`, merged to main as `6af9f77` on 4 October 2026)

Damian's brief, 3 October 2026: plan the run, build it with subagents, on
a new branch off main, `claude/pain-red`; gate each item, merge, push
main. Five items: (1) the home hero gives first and asks later: it opens
on the gap, the shortfall figure, its bars, their source and the slider,
with the provider logo ticker directly under the hero, as now; (2) keep
every interactive and moving part, and list where a static section could
teach its figure by being moved; (3) give before ask, a sitewide audit:
move each booking ask below the first give where that is clear, list the
rest; (4) red for pain, amber for money back: a gap, a shortfall, a loss
or a cost in red, as a fill with white text, tax relief and top-ups in
amber; (5) cut text that only pushes booking, repeats another section, or
says nothing a figure does not, keeping every fact, source, caveat and
warning. Add the colour change, the cuts and the moved asks to the
compliance pack; screenshots at 375 and 1440, before and after;
Lighthouse before and after; report the hash. Planned and built by
Claude agents, each item reviewed before its commit.

| # | Item | State | Commit |
|---|---|---|---|
| 1 | The home page opens on the gap: the regulator and QFA line, the heading, "€25,296 a year short.", the bars, their source, the slider, the caveat; the booking ask after the give | done | a6b1ba3 |
| 2 | `docs/INTERACTIVE-PROPOSALS-42.md`: sixteen places a static section could teach its figure by moving; nothing built | done, a list | ed79141 |
| 3 | Give before ask: the 404 page and the directors' rules list give first; `docs/GIVE-BEFORE-ASK-42.md`, the sitewide table | done (two pages moved; the rest for you) | 7177bda |
| 4 | Red for money missing, amber for money back: one red token, every chart, bar and figure; the rubric, the glossary, a render-diff proving colours only | done | 62019bd |
| 5 | Home cuts (the closing fork, one story line); `docs/CUT-LIST-42.md`, the per-page lists | done (home only; the rest for you) | 37e7048 |
| 6 | This entry, the compliance pack (1.23, B.21 and the edits), the sitemap | done | this commit |

Main was `84a75cd` (Run 41's merge) when the branch began and had not
moved. Merged to main as `6af9f77` on 4 October 2026.

## Item 1, the home page opens on the gap

- **What a reader meets first now** (`index.html:2524-2564`,
  `header.hero#gap`): the small label "Pensions, in plain English", the
  heading "People know roughly what they’ll need." with "Far fewer know
  what they’re on track for." under it (the gap band's own heading, split
  in two: no new words), the figure "€25,296 a year short." (the number
  large and light, the words beside it, one space between the two spans
  so a screen reader hears the sentence), and the regulator and QFA line,
  shown once: above the heading on a phone (`.pb-reg-top`), under the
  figure on a wide screen (`index.html:2238`, `2245-2247`); beside it on
  a wide screen, under it on a phone, the two bars, "Royal London Ireland,
  2026.", the slider "What you expect to need" and the caveat "These are
  survey averages, not a projection for you. …". No booking link in it.
  The nav button stays.
- **Cut, word for word** (all three from the old hero):
  1. the heading "One call. To know where you stand." (only pushes
     booking);
  2. "A pension should be something you understand, not something you
     avoid." (the story's "One idea: a pension should be something you
     understand, not something you avoid." stays, `index.html:2779`);
  3. "Most people in Ireland have a pension they’ve never really looked
     at." ("79% feel unprepared." and its source say it).
  A text diff of `<main>` shows nothing else changed in words: "€25,296 a
  year short." is the same sentence in two spans.
- **Moved, words unchanged:** "Get my free review", "Free, 20 minutes, no
  obligation." and "Try the calculator", from the hero to the end of a new
  band after the provider logos (`#life`, `index.html:2613-2617`), after
  the small label "The gap", "79% feel unprepared." with its Amárach
  source, and the way-of-life picker. The Buddy chat picture, its caption
  "Illustration only · the value of investments can fall as well as rise"
  included, byte for byte, from the hero into "How a call with Damian
  works" (`#call`), after the three steps (`index.html:2895-2911`). The
  provider logos (comment, mount and `<noscript>` row byte for byte) now
  sit directly under the hero; "What’s changed?" and its six links follow
  `#life`, before the games (build check 33 rewritten to hold that order).
- **First screen, measured in Chrome** (top to bottom of each block, in
  CSS pixels):

| Reading | 375 x 812 | 1440 x 900 |
|---|---|---|
| Before (main), cookie answered | lockup 204-268, heading 288-396, sub-line 414-468, booking block 551-699; the gap chart started at 2047 | heading 234-450, sub-line 468-535, booking block 609-703, tail lockup 729-776; the hero ended at 1447, the chart at 2113 |
| Before (main), first visit (no cookie choice yet) | the cookie bar 716-812; everything above it as answered (the booking block ends at 699, just clear of the bar); no figure on the first screen. At 390 x 844: bar 764-860 | bar 827-900; the hero's first screen as answered |
| After, cookie answered | lockup 168-232, heading 246-318, sub-line 328-382, figure 394-430, chart 444-679, source 689-712, slider 724-811, caveat 827-920; the hero ends at 948, the logos 948-1106 | hero 114-773: heading 200-416, sub-line 430-464, figure 486-558, tail lockup 586-652; chart 154-512 (each bar 246px wide), source 526-549, slider 565-652, caveat 668-737; the logos 773-939 |
| After, first visit (no cookie choice yet) | the cookie bar 716-812: lockup, heading, sub-line, figure, chart and source clear of it; the slider's label row (724-753) and track (763-811) under it until the reader chooses (question 19). At 390 x 844: bar 764-860, the track under it | bar 827-900: the whole hero clear of it |

The booking block ("Get my free review", its reason, "Try the
calculator") now starts at 1903 at 375 and at 1327 at 1440, after the
logos, "79% feel unprepared." and the picker. Measured with one script on
both trees (DevTools protocol, the device size set; cookie choice
pre-answered, or a fresh profile for the first visit).

- **Share picture:** `assets/brand/og/og-home.png` now reads "Pensions,
  in plain English / People know roughly what they’ll need." with
  "pensionbuddy.ie · Regulated by the Central Bank of Ireland";
  `og:image:alt` and `twitter:image:alt` say the same (`index.html:24`,
  29). Rendered over the DevTools protocol from the tool's own card,
  because `tools/og-images.py`'s command-line screenshot clips the card's
  foot on this Linux build (question 22).
- **The count-up:** with the chart on the first screen, `tests/gap-band.py`
  scenarios 8 and 9 (scrolled to from the top) now expect the finished
  figures. Two new scenarios keep the count-up tested: loaded at `#learn`
  (1440 x 900) and at `#call` (500 x 900), then scrolled back to the
  chart; a copy with the count-up stopped fails both. It now plays only
  when the page opens part-way down (question 4). Eleven scenarios.
- **Search:** the home record's heading is now "People know roughly what
  they’ll need."; the record lost its `#gap` section entry (the index keeps
  `<h2>` headings only, and the gap's heading is now the `<h1>`), so search
  no longer lands on the gap (question 20). The readiness check's "Start
  from a way of life" link and its test point at `index.html#life`.
- **Layout kept still:** until the page is ready, the slider and the logo
  strip keep their room (166px; 158px at 600px and below; with reduced
  motion 154, 226, 210, 274 or 338px, measured from the built strip at
  each width). Without them Chrome measured layout shifts of 0.0168 at
  1440 and 0.0115 at 375 (0.0096 to 0.027 with reduced motion in tall
  narrow windows); with them, none.
- **One cost:** at 1440 the games' section now starts at 1615px, inside
  Chrome's lazy-load distance, so the home page's first load fetches the
  two game pictures (`product-buddys-run.webp`, 30 KB, and
  `product-jargon-battle.webp`, 61 KB). No video and no poster is fetched;
  `tests/ux4.test.mjs` R38-1 now pins exactly that.
- **No figure changed:** €40,860, €15,564 and €25,296 as before;
  `data-pb-count` 10 before and after. Tests changed: build checks 28, 32
  and 33, `tests/gap-band.py`, `tests/readiness.test.js` (`#life`), ux4
  R38-1.

## Item 2, the interactive proposals

`docs/INTERACTIVE-PROPOSALS-42.md`: sixteen proposals, ranked by how much
each teaches, eleven small and five medium, each with its page, section,
file and line, the figure it teaches and the interaction; the rules every
one keeps (a figure moves only because the reader moved a control; the
markup carries the finished default; no reveal on text, figures or
caveats); what was skipped and why; and four questions (folded into
question 16 below). Nothing was built. This commit makes the two fixes a
reviewer asked for after item 2: the "Colour, not interaction" line now
names the calculators' threshold note `#sftNote`
(`pension-calculator.html:2547`, `director-calculator.html:2663`) and the
threshold page's "Over the threshold" card `#sftOver`
(`tools/sft-parts/main.html:42-46`); and proposal 12's figure now reads
"the first €200,000 tax-free, the next €300,000 (up to €500,000) at 20%",
since only the first €200,000 is tax-free.

## Item 3, give before ask

- **Moved, words unchanged:**
  - **404 page:** "Book a call with Damian for free" and "Free, 20
    minutes, no obligation." left the top row (where "Back to the
    homepage" now stands alone) and follow the search box and "Six places
    to begin." (`404.html:2109-2110`). Measured: the button moved from the
    first screen to y 1735 at 375 and 1294 at 1440.
  - **Directors' rules:** "Topics to discuss, not advice. Book a call with
    Damian for free to go through them." is now two paragraphs: "Topics
    to discuss, not advice." stays above the list; "Book a call with
    Damian for free to go through them." and its reason follow it
    (`tools/director-rules-parts/main.html:74-77`). Driven in Chrome with
    real clicks: the list, then the sentence 16px below it, then the
    reason; focus lands on "Worth talking through"; the link still opens
    `booking.html#persona=director`.
  - **Home page:** done by item 1 (the hero's ask and the chat picture).
- **`docs/GIVE-BEFORE-ASK-42.md`:** every booking ask on every page, word
  for word with its file and line, what to give first, and a verdict, with
  ready edits for the rows held for you: the starter, director and tracker
  heroes (tracker gives nothing first, but its move would stack two asks,
  question 7), their chat pictures, the comparison's "Talk through what
  this means for you" (question 9), and the phone booking bar on the
  glossary and the three audience pages (question 8).

## Item 4, red for money missing, amber for money back

> **Final, 6 October 2026: the gap is blush coral, `--gap:#FADCD3`.** Picked
> by the owner from six pale options (`docs/gap-orange-shots/pale-options.png`).
> Same rules as the pale yellow below, one token changed; dark text on it
> (ink 13.24:1, ink-2 4.88:1); a different hue from amber (money back).
>
> **Superseded, 6 October 2026: the gap is pale yellow again, as before
> Run 42.** Burnt orange (#C2410C) was tried the same day and rejected by the
> owner. Token `--gap:#FCEFCF` after `--red` in the first `:root` of all 31
> pages; dark text on it (ink 14.99:1). Restored as before Run 42: the home
> block's dark figure and words, the hero figure in ink, the cost of waiting
> in teal, the director tax bar in three greys, Jargon Battle in terracotta.
> Rules added after Run 42: the charges chart's area and key swatch use
> `--gap`; the charges row, the my-pensions charges figure and the threshold
> tax figure are ink. `--red` (#A4291D) is for form errors only. Trade-off
> accepted: the gap yellow and amber (money back) share a hue family. Shots
> in `docs/gap-orange-shots/` (after-* is the yellow).

- **The rule** (`docs/DESIGN-RUBRIC.md` section 3, `CONTEXT.md` "Gap",
  "Covered" and the new "Money back"): in a chart, a bar or a figure, red
  is money missing (a gap, a shortfall, a loss, the cost of waiting, tax
  you would pay, charges taken from a pot) and amber is money that comes
  back or is added (tax relief, Revenue's contribution, an employer's or
  the State's top-up); dark stays what you need, teal what the State
  pays. A red figure always has its words beside it. Red is also a form's
  error colour, and never sits on a dark band.
- **One token:** `--red:#A4291D`, after `--amber-soft` in the first
  `:root` of all 31 pages (29 root pages, typed into the 19 hand-written
  ones and taken by the ten built ones from the skeleton, and the two
  games). It was already the form-error red in four part stylesheets; the
  site had three reds before (#C0392B, #A4291D, #C1502E) and has one
  (the games' drawn art keeps its terracotta).
- **What changed colour:**

| Page | What it shows | Old → new | Why |
|---|---|---|---|
| Home | The gap block "€25,296 / a year short" on the State's bar | amber tint, dark figure → red fill, white figure and words | the gap |
| Home | The hero figure "€25,296" (beside "a year short.") | dark → red; the span is empty when the need is covered, so "Covered by the State Pension." is never red | the shortfall |
| Starter | The two "a year to find" blocks (€3,636, €18,036) | amber tint → red | the gap |
| Starter | The tails of the time charts ("€164,659 less", "€265,746 less", "€92,322 less", "€52,672 less") | amber tint → red | the cost of waiting |
| Starter | My Future Fund rows "Your employer adds" and "The State adds" | grey and aqua → amber ("You pay in" stays grey) | top-ups |
| Pension calculator, comparison, starter, director, glossary | The relief ladder's bars (the age-related limit) | aqua → amber | tax relief |
| Pension and director calculators | "The cost of waiting": the figure in its sentence and the card's rule | teal figure, aqua rule → red (the comparison's "In one sentence" card shares the style and keeps aqua) | the price of delay |
| Pension calculator | "You really pay": the bar and its key dot | aqua bar, brown dot → one grey | the dot did not match its bar; yours is neutral |
| Director calculator | The 40% / 8% / 4.35% bar and its key | three greys → red at three strengths (1 / .82 / .65) | tax you would pay |
| Director calculator | "Roughly what you could aim for" card | amber tint, brown text → light grey, dark text | a ceiling is neither pain nor money back |
| Comparison | The staircase: the State's and the employer's shares | aqua; grey at .6 → amber; amber at .6 ("You" stays grey) | top-ups |
| Reality check | The jar's bottom row (the first 520 contributions) | amber → aqua like every lit dot | it carried no label and was not money back (UX-MOTION-AUDIT D15 (a)) |
| Charges calculator | "What they cost you by retirement" row's figures | dark → red (the row header stays dark) | charges taken from the pot |
| Threshold page | "Tax at 20%" | dark → red | tax you would pay |
| Readiness check (held) | The "Early days" third of the scale | amber tint → grey | not money |
| Glossary | Risk rating tiles 5 to 7 (hidden from screen readers) | amber tint → dark teal, white digits | not money; keeps the "more" reading |
| Booking, thank-you | "The house promise" label on the dark card | amber → mint | amber is never decoration |
| Booking, thank-you | A field in error, and the error box | brown border; amber box → red border; white box with a red border | an error |
| Every form | Error text (`#ecErr`, `#mErr`, the part forms) | #C0392B or a literal #A4291D → `var(--red)` | one red |
| Jargon Battle | Low health, a wrong answer | terracotta → red (the pale tint stays; the drawn art unchanged) | a pain state |

  Left as they were, on purpose: the need bar (dark), the State's bars
  (aqua), Revenue's share and the relief card (amber), the entitlement
  check's tail (amber: the extra the higher method adds, which the
  Department pays; its three comments rewritten to say so), the PIA
  table's tax rows (placeholders until Budget day), `#taxOut`, the
  calculators' threshold note and the threshold page's "Over the
  threshold" card (colour proposals, question 16), and three teal things
  that are not the State (question 14 (i)).
- **Every red figure and its words:** home block "€25,296" with "a year
  short" inside it and "What the State Pension pays" under it, and the
  chart's screen-reader label; hero figure "€25,296" with "a year short."
  beside it; starter blocks "€3,636 a year to find", "€18,036 a year to
  find" and the chart's label; starter tails "€164,659 less", "€265,746
  less", "€92,322 less", "€52,672 less"; the cost of waiting, its own
  sentence ("… roughly €X less" / "… lands roughly €X lower") under "The
  cost of waiting"; the director bar, its key "40% income tax", "8% USC",
  "4.35% PRSI" and the sentence above it; the charges row, its header
  "What they cost you by retirement"; the threshold page, its row header
  "Tax at 20%"; the form errors, their message; Jargon Battle, the
  answer's words and the hearts.
- **Contrast** (WCAG relative luminance, computed):

| Pair | Ratio |
|---|---|
| Red text on white | 7.21 |
| Red text on the page background #FAFAF9 | 6.90 |
| Red text on the light grey surface | 6.59 |
| Red text on the palest teal (the wash's darkest stop) | 6.49 |
| Red text on the amber tint | 6.31 |
| White text on red | 7.21 |
| Red fill beside aqua / amber / the grey rule | 3.44 / 4.01 / 5.32 |
| Never done: red on the dark teal band / against ink / against teal-700 | 1.91 / 2.37 / 1.04 |
| The director bar on white: 1, .82, .65 | #A4291D 7.21, #B45046 5.03, #C4746C 3.46 |
| The same on its grey track | 6.59, 4.72, 3.33 |
| Its parts against each other | 1.43 and 1.45 on white, 1.40 and 1.42 on the track (told apart by the key, as the three greys were) |
| The aim-for card: label / figure / note on light grey | 5.04 / 15.65 / 5.77 |
| Risk tiles: white on dark teal | 6.95 |
| "The house promise": mint on the dark card | 9.30 |
| The form errors' text (`.qerr`, ink on white) | 17.12 |
| Jargon Battle's wrong-answer key: white on red | 7.21 |
| The staircase's employer (amber at .6) against "you" (ink-2) | 4.44 |
| The relief ladder's amber against its track | 1.64 (the aqua before: 1.92; question 14 (b)) |

- **Colours only, proved** against `BASELINE_REF=7177bda` (item 3's
  commit):
  - The existing render-diff: `load.js` the same render on every page;
    `sequences.js all 400 40` 0 differing, 0 reordered, 0 errors on the
    six calculators, 16,000 events each; `mutate-shared.js 200` every
    claim held (it had crashed since Run 34, see below); `browser-diff.py`
    0 differing on all six (frames and cells: pension calculator 16 /
    1,008, director calculator 6 / 348, comparison 61 / 6,832, reality
    check 6 / 198, entitlement 11 / 902, PIA 16 / 1,248).
  - **New: `tests/render-diff/classify-pain-red.py`** (README row added).
    Real Chrome, every page at 375 and 1440, every frame of the six
    calculators: an element may differ only in paint (colours, opacity
    between two non-zero values, the `:root` tokens); text, hidden flag,
    classes, attributes, geometry and every other style must match, and
    every new colour must be one of the site's own tokens. Its self-test:
    FAIL "text changed" (the pension calculator's boost figure, €62,729),
    FAIL "geometry changed" (the ladder's "Under 30" rung), FAIL "hidden
    flag changed" (the home page's switched-off "Out of office." section),
    PASS on a colour-only change (3 elements, 10 distinct changes, at
    each width). The six calculators: PASS, 12 page-widths, 232 frames,
    5,684 elements, 102 differing in colour, 67 distinct (property, old,
    new) changes. The full run, 31 pages at both widths: PASS, 62
    page-widths, 282 frames, 17,848 elements, 188 differing in colour, 112
    distinct changes. It runs with reduced motion and CSS transitions off
    on every page, the six calculators included: with motion on, a run of
    the tree against itself caught bars mid-slide (`browser-diff.py`,
    which reads no colour, still drives the six with motion on).
  - The diff grep over every changed page and part stylesheet: no
    transition, animation, width, height or count added or changed; no
    script under `assets/js` changed; the entitlement page's script
    changed in comments only.
- **`tools/design-measure.py` R5** (a second colour beside aqua on one
  screen), before → after. A new "R5 red" column: starter 375 screens 7,
  8 and 16, starter 1440 screens 6 and 12, the charges calculator 1440
  screen 3, the threshold page 1440 screen 3. "R5 amber", before: booking
  (375 and 1440, screen 2), glossary (7 / 4), pension calculator (6 / 4),
  starter (7, 8, 16 / 6, 12), entitlement (9 / 4), thank-you 375 (2),
  Jargon Battle (1 / 1); after: pension calculator 1440 (4), entitlement
  (9 / 4), Jargon Battle (1 / 1). Text colours site-wide 20 → 19. Every
  red beside aqua was checked against the rubric: starter's reds are its
  charts' bars (`.pb-lsb-amber`, `.pb-sa-gap`); the charges
  calculator's (`.fee-t`'s last row, `tools/fees-parts/main.html:56`)
  and the threshold page's (`#lumpTax`, `tools/sft-parts/main.html:55`)
  are table figures beside a chart's aqua, which section 4's "inside a
  chart" does not strictly cover (question 24). The home page is in no
  column: the tool skips `header`, and the hero is now `header#gap`
  (question 21); the calculators' cost-of-waiting card and
  the director bar share no screen with aqua.
- **Docs:** `docs/DESIGN-RUBRIC.md` and `CONTEXT.md` carry the rule;
  `docs/UX-MOTION-AUDIT.md` (three lines) and `docs/INTERACTIVE-AUDIT-2.md`
  (one) are marked "historic: Run 42 moved the gap to red".
- Build check 27 (the still safe) gains a fourth mutant, a red fill; 436
  checks.

## Item 5, the cuts

- **Cut on the home page, word for word:**
  1. The closing section (main `index.html:2884-2891`, and its 16 lines of
     CSS): the heading "Which of these sounds most like you?" and three
     cards: "Just starting out" / "No pension yet, or one you’ve never
     looked at? We’ll make starting simple, and it’s never too late to
     begin."; "Changed jobs a few times" / "Changed jobs a few times and
     lost the thread? We’ll find what you’ve built up and tell you what
     it’s worth."; "Run my own company" / "Your company can fund your
     pension far beyond personal limits, and cut its tax bill doing it."
     The same three sentences stand in "Six places to begin." on the home
     page (`index.html:2699-2701`) and on the 404 page
     (`404.html:2102-2104`), linking to the same pages. Your veto:
     question 18.
  2. The story's last paragraph (main `index.html:2751`): "The goal is
     simple: get you from “I’ve no idea what’s happening with my
     pension” to an actual conversation with someone qualified to help."
     It only pushes the call and holds no fact. The story keeps "Our
     story", "Father, son, dog.", "One idea: …" and the paragraphs on
     Damian and Adam; `#story` is intact. Build check 31's mutant now
     anchors on the paragraph before.
  And the three hero lines item 1 cut (above).
- No fact, source, caveat or warning left the page. The search index lost
  only the closing section's heading. "Twenty minutes" or "20 minutes"
  stays on the home page six times: the reason line in `#life`, step 2,
  the chat picture's Buddy line, the second FAQ answer, and the closing
  band's heading and line.
- **`docs/CUT-LIST-42.md`:** the cuts above; D1 to D12 on the home page
  for you (D2 done here; D10 to D12 answered); and every other page,
  27 headings, 130 items, nothing cut. Its 265 quoted fragments were
  checked against the files: 257 word for word at the cited lines, 2 are
  check names, 6 are sentences a script writes, checked against the page
  as Chrome draws it.
- Losing the fork's three cards also loses their hover (interactivity
  audit row 34): a border colour and a shadow, kept by every other card
  link on the page. Nothing moved on hover.

## Booking calls to action after Run 42

The four Run 26 rows ("Booking calls to action: which reason each has")
that moved, as they now stand:

| Where | Where it is now, and its reason |
|---|---|
| Home hero "Get my free review" | under the gap, the provider logos and the way-of-life picker (`#life`); the reason line under it still |
| Home phone picture's link | the picture now sits under "How a call with Damian works", after the three steps; Buddy's line above the link still |
| Directors' rules: "Book a call with Damian for free to go through them." | after the list, with its reason |
| 404 page's booking button | after the search box and "Six places to begin", with its reason |

## The gate, per commit

Each commit ran the full gate (`run-tests.py`, every `tests/*.test.py`,
`tests/gap-band.py`, every `tests/*.test.mjs`, `tools/verify.py
--no-shots`), one suite at a time, and its failing lines were compared
with main's own run of the same gate on the same machine (`84a75cd`,
before the first commit). Pass: no failing line that main did not have,
and no crash.

| Commit | Result |
|---|---|
| a6b1ba3 | pass. build 435/0, gap-band 11 scenarios, providers 86/0, ux4 64/0, verify 0 FAIL |
| ed79141 | pass, the same lines as item 1 |
| 7177bda | pass, build 435/0 |
| 62019bd | pass. build 436/0, games 168/0, boxes 8/0, verify 0 FAIL, 0 contrast findings, no token drift |
| 37e7048 | pass. build 436/0, search 22/0, ux4 64/0, verify 0 FAIL; one baseline line relabelled (below) |
| this commit | pass. build 436/0, gap-band 11 scenarios, ux4 64/0, verify 0 FAIL; `tools/sitemap.py --check`, `sync-chrome.py`, `stamp-images.py`, `site-index.py` and `seo.py --check` and `check-initialisms.py` clean; a fresh `pagebuild.py` leaves the tree byte for byte. lead-forms 211 passed, 2 failed, the baseline's two Calendly lines; the only baseline line not seen is floating-chrome's home line under its old label (89), now (86) |

**What failed, and why it was the environment's, not the site's.** This
machine's headless Chromium cannot play H.264, has no mouse, cannot load
Calendly, and draws the cookie bar a little wider at 320px; ux4 ran from a
copy with WebM videos only. On main the gate printed 34 failing lines, in
five suites; the baseline list has 35 lines because one of them appears
under two labels:
- `consent.test.py`, 15: check 9 at 320 x 568 on 14 pages (the bar is one
  line, 100px or less), and its summary line (700 passed, 14 failed);
- `floating-chrome.test.mjs`, 6: check 2 (focused controls under the
  floating chrome at 375) on booking, the directors' rules and the home
  page, the home line counting 89 focus stops on main and 86 once item 5
  cut the fork's three links (the same failure, so both labels are on the
  list), check 5 (focus brings it back), and its summary (31 passed, 4
  failed);
- `lead-forms.test.py`, 3: the booking form's two "no script error" lines
  (Calendly) and its summary (211 passed, 2 failed);
- `nav.test.py`, 7: hovering on the home page and the director
  calculator (opens, closes, reports a mouse) and its summary (464 passed,
  6 failed);
- `terms.test.mjs`, 4: the directors' rules marking check, hovering on
  the over-50s and threshold pages at 1440, and its summary (45 passed, 3
  failed).
Every other suite exited 0 on every commit.

## Lighthouse, before and after

Lighthouse 13.5.0, mobile (default throttling), performance and
accessibility; before is main `84a75cd`, after is `37e7048` (items 1 to
5); three runs a side, interleaved, median; starter nine a side.

| Page | Performance | Accessibility | LCP, s | CLS | TBT, ms |
|---|---|---|---|---|---|
| index.html | 93 to 92 | 97 to 97 | 2.85 to 3.01 | 0 to 0 | 3 to 0 |
| pension-calculator.html | 92 to 91 | 97 to 97 | 2.86 to 3.01 | 0 to 0 | 0 to 0 |
| director-calculator.html | 92 to 92 | 97 to 97 | 2.85 to 2.85 | 0 to 0 | 0 to 0 |
| starter.html (9 a side) | 92 to 93 | 96 to 96 | 3.00 to 2.93 | 0.0012 to 0.0012 | 22 to 10 |
| broker-vs-autoenrolment.html | 90 to 90 | 97 to 97 | 3.01 to 3.01 | 0 to 0 | 10 to 0 |
| director-pension-rules.html | 92 to 93 | 96 to 96 | 2.85 to 2.71 | 0 to 0 | 0 to 13 |
| 404.html | 96 to 96 | 96 to 96 | 2.70 to 2.55 | 0 to 0.00001 | 0 to 0 |

- Every page within two points; accessibility unchanged on all seven.
- The home page's LCP element is the h1 on both sides. Its three
  after-runs read 2.85, 3.08 and 3.01 s against 2.85 s three times before.
  The spread equals pension-calculator's, a page this run changed in
  colour only (2.78 to 3.23 s across both sides). Not isolated further.
- Starter's first three runs: after 3.80, 3.84, 2.55 s against before
  2.48, 2.55, 2.93 s (performance 94 to 84). The six extra runs: before
  3.83, 3.81, 3.86, 3.00, 2.55 and one more, after 3.00, 2.93, 2.93, 3.00,
  2.86 and one more. The slow mode (about 3.8 s) is the simulation, not
  the change: starter changed in colour only, and its LCP element is the
  h1 text on both sides.
- Lighthouse runs a fresh profile, so the cookie bar shows on both sides.
- Not taken: Lighthouse at desktop size on the home page. The layout
  shift that the logo strip could have caused at 1440 was measured in
  Chrome instead (item 1: none with the reservations).

## Screenshots

Not in the repo (about 150 MB; `verify-out/` is ignored by git). Taken
with `tools/verify.py`, screen by screen (frames 900px tall, reduced
motion forced, the cookie choice answered), every page at 375 and 1440:
62 before (main `84a75cd`, in a worktree) and 62 after (`37e7048`); on the
after tree verify.py reported 0 FAIL at 375, 1360 and 1440. The home
page's first screen was also shot at 375 x 812, 390 x 844 and 1440 x 900,
before and after, cookie answered and on a first visit (no cookie choice),
through the DevTools protocol with the device size set (a bare
`--screenshot` lays the page out wider than 375). Every Chrome run used
this machine's Chromium 141, headless, `TZ=Europe/Dublin`.

## Found on the way (not changed unless said)

- The switched-off "Out of office." section is in the site search's index
  (`["Out of office.",""]`): `tools/site-index.py` does not skip hidden
  sections.
- `tools/fees-parts/main.html:87`: "… has a guide to pension fees and
  charges explains each one." (a word missing; `docs/CUT-LIST-42.md` lists
  it).
- `my-pensions.html` has no closing booking band (question 13).
- `director-calculator.html`'s CSS comment over the tax bar said "52.2%";
  fixed in item 4 ("52.35% (52.2% before 1 October 2026)").
- `tests/render-diff/mutate-shared.js` had crashed before its first
  mutation ("A is not a function") since Run 34 added the PIA page to
  `pages.js`, on main too. Item 4 gave it a PIA generator from
  `sequences.js`'s ranges; it now runs, and its 10 "must differ" mutants
  are caught (6 of them on the PIA page too).
- `browser-diff.py` prints "both sides loaded the same script URLs" on all
  six for a change that touches no script: true, and it means
  browser-diff alone cannot tell the two trees apart; the new
  classifier's vacuity rule does.
- Jargon Battle's wrong-answer states never appear at load, so only the
  CSS diff checks their new red.
- `index.html:1185` and `1526` still name `.gapband .eyebrow`; the class is
  gone. Harmless ("The gap" in `#life` computes the same teal).
- The directors' rules' booking sentence is in a `dr-src` paragraph, a
  class on pagebuild's caveat list, so a sentence that only asks is
  treated as a caveat (never revealed; floating chrome steps aside). It
  already was before the move; nothing changed.
- A Chrome window asked for 390 x 844 lays the page out 397px wide, on
  main and on the branch alike.
- `docs/DESIGN-RUBRIC.md:141` says the warnings are "black on
  `--surface-2` with a rule"; on every page that carries them they are
  bold black words on white (`--surface`) in a 2px black frame. The
  rubric's words, not the pages, are off; the compliance pack (B.21)
  describes them as they are.
- `docs/SUBTRACTION-AUDIT.md`, the home page: row 11 (merge "Which of
  these sounds most like you?" into "Six places to begin.") is done; rows
  1 (the chat picture) and 2 ("What's changed?") moved out of the hero's
  way, not cut. `docs/UX-MOTION-AUDIT.md` D15 (a) (the jar's first row)
  and D16 (the fees shading and the director's tax: now red) are settled
  by the colour rule; D23 (the count-up) is open (question 4).

## Needs Damian

Numbered as the run's other docs cite them. Questions 15 and 17 were
answered in the build and are kept only so the numbers stay stable;
neither asks for a decision.

1. **The hero lede** "Most people in Ireland have a pension they’ve never
   really looked at." is cut outright (no source; "79% feel unprepared."
   says it with one). Keep it anywhere, or confirm?
2. **The Buddy chat picture** moved whole from the hero into "How a call
   with Damian works", after the three steps, because its caption
   "Illustration only · the value of investments can fall as well as
   rise" is one of the site's classified caveats and SUBTRACTION-AUDIT
   question 7 about it is open. Its Buddy line repeats the second FAQ
   answer and its link the nav button; with the closing section cut, its
   "Which of these sounds most like you?" now appears only here. Keep it
   there, or remove it, caption included?
3. **The share picture** (og-home.png) and its alt text read "People know
   roughly what they’ll need." without the second sentence. Acceptable,
   or have `tools/og-images.py` print the sub-line too?
4. **The gap chart's count-up** (UX-MOTION-AUDIT D23) no longer plays on a
   normal load; it plays only when the page opens part-way down and the
   reader scrolls back to the chart. Retire it, or leave it?
5. **The booking ask** taken from the hero ("Get my free review", "Free,
   20 minutes, no obligation.", "Try the calculator") sits at the end of
   the band after the logos (`#life`). Keep it there, or none until the
   closing band (the nav button, Ask Buddy, the phone bar and the band
   remain)?
6. **The way-of-life picker** now sits one logo strip below the slider it
   sets. At 1440, when a card is tapped, the chart and the big figure are
   490px above the window, so the reader sees only the picker's own
   breakdown change (on main at 1440 both stayed on screen; on a phone
   they were already off it). Live with it, move the picker into the hero
   at the cost of one screen at 1440, or cut it (SUBTRACTION-AUDIT index
   row 3)?
7. **The three audience heroes** ask on the first screen. Starter's
   heading states a rule first and director's lede two facts, so neither
   is a clear move. Tracker's hero gives nothing first, but moving its
   button lands it directly above the dark band's "Start finding mine":
   move it, cut one of the two (T-1 or T-7), or keep it? Apply the moves on
   starter and director too? And their chat pictures? Ready edits in
   `docs/GIVE-BEFORE-ASK-42.md`.
8. **The phone booking bar** on starter, tracker, director and the
   glossary rises as soon as the hero or page heading scrolls off, before
   any figure. Have it wait for the first figures (one line in
   `assets/js/pb-bookbar.js:76` and an attribute per page), or leave it
   (Run 41's question 20)?
9. **The comparison's "Talk through what this means for you"** in "In one
   sentence": cut (Run 41), move to the end of "Everything paid in, by
   66", or leave?
10. **The threshold page** ends with two booking asks (the band and the
    "Next step" card). Merge the card into the band (a test change)? And
    the guides' "Next step" cards generally (O-4, E-2, U-2, the rules
    page)?
11. **"The cost of waiting"'s "Talk it through, free"** on the two
    calculators: keep or cut (P1, D1)?
12. **Privacy, Terms and Complaints** each end with one booking sentence;
    the complaints one may be a deliberate spoken route. Keep?
13. **`my-pensions.html` has no closing booking band.** Intended?
14. **Colour.** (a) My Future Fund's State contribution and the
    comparison's staircase drawn as top-ups (amber, applied) rather than
    the State's teal; the employer's share amber too (applied), or grey?
    (b) The relief ladders amber (applied) or back to aqua? Either way the
    fill is under 3:1 against its track (amber 1.64:1, aqua 1.92:1); the
    percentage beside each rung says it in words. (c) Jargon Battle: the
    one red in its two states only (applied), in the drawn art too, or
    not at all? (d) The glossary's risk tiles 5 to 7 dark teal with white
    digits (applied), or all one grey? (e) Solid red fills with white
    figures (applied, the brief's "as a fill with white text") rather
    than a second, lighter red? (f) "The house promise" label is now
    mint; item 5 lists the card as a cut: cut or keep? (g) The director's
    "Roughly what you could aim for" card grey (applied), or a dark "what
    you need" panel? (h) "Corporation tax relief on contributions"
    (`#taxOut`) white (kept) or amber on the dark panel? (i) Teal still
    draws things that are not what the State pays: starter's time charts'
    "your pot" fill (`starter.html`, `.pb-sa-fill`), the way-of-life
    picker's category bars, what a household needs
    (`.pb-life-rows i`), the charges chart's other-plan line, and your
    plan's line and dot, "Into your pension", the comparison's lanes, the
    my-pensions bars. Move each off teal in a later run (yours to grey,
    need to dark)? (j) The extra-€100 dashed line: keep amber? (k) The
    PIA table's tax rows: colour them when the Budget figures land? (l)
    The entitlement check's tail kept amber as the extra the higher
    method adds: amber, red or grey? (m) The calculator pictures still
    show the old aqua cost-of-waiting rule and brown key dot: re-shoot now
    or with the next image run? (n) The director's 40% / 8% / 4.35% bar
    in one red at three strengths (every part 3.3:1 or better against
    the page; the parts 1.4:1 to each other, told apart by the key, as
    the three greys were): keep, or one flat red? (o) Not in the run and
    left alone: the review stars still name amber on 16 pages (the
    skeleton's rule fills them aqua, so it may not show), and Buddy's
    Run's buttons are amber (game, not money). Leave them?
15. **Answered in the build (the brief's €25,336):** the page shows
    €25,296 (€40,860 less €15,564); €25,336 is the slider at €40,900.
    €40,860 and €25,296 stay, as `docs/CUT-LIST-42.md` D12 says.
16. **The lists for you.** The cuts in `docs/CUT-LIST-42.md` (home D1 and
    D3 to D9; every other page); the colour proposals, a red left border
    on the calculators' threshold note `#sftNote` and on the threshold
    page's "Over the threshold" card `#sftOver`; and
    `docs/INTERACTIVE-PROPOSALS-42.md`'s four questions: may proposals 5,
    8, 10 and 12 (protected pages, compliance-reviewed words) be queued;
    should 6, 9, 14 and 15 wait for the subtraction audit's answers;
    proposal 12's wording (the 25% route only); and proposal 16
    (question 19).
17. **Answered by the brief:** the provider logos sit directly under the
    hero; "What’s changed?" follows the way-of-life band.
18. **The closing section "Which of these sounds most like you?"** (three
    cards that repeat "Six places to begin." character for character) is
    cut as item 5's one clear home cut, while item 1 said everything else
    on the home page stays. Confirm, or put it back?
19. **On a phone's first visit** the cookie bar covers the hero's slider
    (label and track) until the reader chooses; the lockup, heading,
    figure, chart and source are clear of it. Live with it, or draw the
    slider above the chart on phones (proposal 16)? Measured: the slider
    would then be clear (444-532), but the bar would cover the foot of
    the chart, its two labels and the source line (788-811) instead.
20. **Site search** no longer lands on the gap or "79% feel unprepared."
    (the index keeps `<h2>` headings, and the gap's heading is the page's
    `<h1>`). Live with it, or give the band after the logos a heading of
    its own (new words, yours)?
21. **`tools/design-measure.py` skips `header`,** so the home page's hero,
    now the gap chart, is in none of its columns (R5 included). Have it
    count the hero?
22. **`tools/og-images.py`'s command-line screenshot clips the card's
    foot** (the regulator line) on this Linux build; the home card was
    rendered another way. Switch the tool to a capture with the device
    size set?
23. **To know, nothing to decide:** the room kept for the logo strip
    before the page is ready (166 and 158px; with reduced motion 154, 226,
    210, 274 and 338px) is measured from today's logos and sizes in
    `assets/js/pb-providers.js`. If a logo is added, removed or resized,
    measure again; a wrong height shows as a layout shift in ux4 check 4,
    not as a broken page.
24. **Red or amber in a table, beside a chart's aqua.** Rubric section 4
    allows "no second chromatic colour except amber or red inside a
    chart". The charges calculator's last table row (`.fee-t`,
    `tools/fees-parts/main.html:56`) and the threshold page's tax cell
    (`#lumpTax`, `tools/sft-parts/main.html:55`) are red table figures
    on the same 1440 screen as a chart's aqua. Accept them, or reword
    the rubric to "in a chart, bar or figure", as its section 3 has it?

## Decisions, 4 October 2026

Damian's brief for Run 43 answered questions 2, 7, 14 (i), 18 and 19 and
confirmed 17. For every other open question it asked for the most
conservative option, the one with the least change to the live site and
the least compliance risk, and a list of the choices for him. They are
below, with what Run 43 did about each. Damian's decisions, word for
word from the brief:

> "What's changed?" position OK. Q2 keep. Q7 yes. Q14 non-State teal ->
> neutral slate (teal = State only). Q18 keep cut. Q19 accept.

The Decision column quotes them; how Run 43 read them is in the last
column. "Default" means the conservative option was taken
without asking. Damian's choices are not compliance's
sign-off: pack questions 1.21, 1.23 and B.21 stay open for compliance.

| # | Question | Decision | In Run 43 |
|---|---|---|---|
| 1 | The cut hero lede | the cut stands (default) | nothing changed |
| 2 | The Buddy chat picture in "How a call with Damian works" | **"keep"** (Damian) | kept where it is, caption included; the reason line now stands under its link (item 5d) |
| 3 | The share picture without the sub-line | as it is (default) | nothing changed |
| 4 | The gap chart's count-up | left as it is (default) | nothing changed |
| 5 | The booking ask at the end of `#life` | stays there (default) | stays; its reason line now reads "Free · 20 minutes · no obligation · reschedule any time." (item 5d) |
| 6 | The way-of-life picker | as it is (default) | nothing changed |
| 7 | The three audience heroes' booking button, and their chat pictures | **"yes"** (Damian) | item 1: S1 and D1 applied as drafted in `docs/GIVE-BEFORE-ASK-42.md`; T1 after the tick list (the tracker page has no figure), above the "Worth knowing" band's "Start finding mine", both kept (default: neither T-1 nor T-7 cut). "And their chat pictures?" was read as P1's cut: each keeps its question and Buddy's answer and lost its booking link and reason, so no hero asks on any phone. The revert (two lines per page: the link paragraph and its reason line) is in Run 43's "Needs Damian" (3) |
| 8 | The phone booking bar waiting for the first figures | as it is (default; B1 not applied) | its code unchanged; it rises earlier, because the heroes are shorter (at 375: starter 1025 → 900px, tracker 1025 → 875, director 1250 → 1100), and is 22px taller with the longer reason line |
| 9 | The comparison's "Talk through what this means for you" | kept, words unchanged (default) | moved by item 5 from "In one sentence" to the one booking link after the results, after "Email me my results" (the brief's 5e) |
| 10 | The threshold page's two closing asks; the guides' "Next step" cards | kept (default); build check 38 unchanged | item 5 adds the calculator's booking link above them, so the threshold page ends with three asks (measured; Run 43, "Needs Damian" 5) |
| 11 | "Talk it through, free" in "The cost of waiting" | kept on both calculators, words unchanged (default) | moved by item 5 to after "Email me my results"; the card keeps its title and its figure |
| 12 | The booking sentence on Privacy, Terms and Complaints | kept (default) | kept; inline links, not beside the reason line (Run 26's judgement) |
| 13 | No closing band on `my-pensions.html` | none added (default) | item 5 adds one booking link after its result, after "Print or save this list"; the printout leaves it out |
| 14 (i) | Teal on things that are not what the State pays | **"non-State teal -> neutral slate (teal = State only)"** (Damian) | item 2: `--slate:#586B85`. Teal is what the State pays and nothing else in a chart, a bar, a figure's key or a scale; the reader's own place on a scale (the "You" chips, the picked year, the entitlement check's "Your average" and "Your year", the timeline's step) is neutral too. The accent stays: buttons, links, slider tracks, eyebrows, the dark band |
| 14 (d) | The risk tiles | slate, with 14 (i) | tiles 1 and 2 light grey, 3 and 4 a darker grey, 5 to 7 slate with white digits |
| 14 (b) | The relief ladders | amber, with 14 (i) (default) | the bars stay amber; their "You" chips went neutral |
| 14 (a), (c), (e), (g), (h), (j), (l), (n), (o) | Run 42's other colours | as applied (default) | nothing changed |
| 14 (f) | "The house promise" | kept, mint label (default) | nothing changed (B-1, Y-1 not cut) |
| 14 (k) | The PIA table's tax rows | not coloured until the Budget figures are in (default) | nothing changed; rank 13 waits too |
| 14 (m) | The calculator pictures | re-shot with the next image run (default) | not re-shot; they still show the old colours, Run 43's included |
| 16 | The cuts | only edits whose words the same page, its Related pages card or its chat picture already says, and which take no fact and no alternative from an ask (default) | item 3 makes nine edits; the home FAQ (D7: it holds facts, and SUBTRACTION-AUDIT question 6 is open), O-2 and Z-2 (each would leave a bare ask) and D-8's first sentence stay; the rest stay listed |
| 16 | The red left border on `#sftNote` and `#sftOver` | not made (default: red is never a callout's border) | nothing changed |
| 16 | The interactive proposals and their four questions | build the small ones (the brief's item 4 is the more specific instruction, so 6, 9, 14 and 15 do not wait for the subtraction audit); the medium ones wait, their words to the pack first; no line for proposal 12 (default) | built 1, 2, 3, 4, 6, 7, 9, 14 and 15 (1, 2, 3, 4, 9 and 14 adapted); 13 waits for Budget day; 16 not built (question 19); 5, 8, 10, 11 and 12 wait |
| 17 | "What’s changed?" after the way-of-life band | **"position OK"** (Damian) | the position stays; nothing changed; SUBTRACTION-AUDIT home row 2 not done |
| 18 | The closing section | **"keep cut"** (Damian) | the cut stands; nothing changed |
| 19 | The cookie bar over the hero's slider | **"accept"** (Damian) | the cookie bar over the slider is accepted; proposal 16 not built |
| 20 | Site search | as it is (default) | nothing changed |
| 21 | `tools/design-measure.py` | as it is (default) | nothing changed |
| 22 | `tools/og-images.py` | as it is (default) | nothing changed |
| 24 | Red table figures beside aqua | accepted; the rubric unchanged (default) | nothing changed |

Questions 15 and 23 asked for no decision.

---

# Run 41 — 2026-10-01 · The live countdown back; a design rubric; a subtraction audit (on `claude/countdown-rubric`, merged to main as `84a75cd` on 2 October 2026)

Damian's brief, three items: bring back the live countdown (days, hours,
minutes, each minute, no seconds; the nav chip and the home page's band);
write `docs/DESIGN-RUBRIC.md`; audit every page at 375 and 1440 against it
and the references, listing only what to cut or merge, building nothing.

| # | Item | State | Commit |
|---|---|---|---|
| 1 | The countdown in days, hours and minutes, turning each minute | done | 0eb295f |
| 2 | `docs/DESIGN-RUBRIC.md` | done | 4fea3a3 |
| 3 | `docs/SUBTRACTION-AUDIT.md`, page by page; 20 calls for Damian at its end | done, nothing built | 4fea3a3 |
| 4 | `verify.py`'s full-page shots taken screen by screen (the tall-window bug) | done | this commit |
| 5 | `tools/design-measure.py`, the rubric's measurement kept | done | this commit |

## Item 1, the countdown

- The chip reads "48d 06h 14m" on every page; the home band has three
  boxes, Days, Hours, Minutes. `pb-deadline.js` sets one timeout to the
  turn of the count's minute (the deadline's 23:59:59, not the wall
  clock's), set afresh each time; it still recounts when you come back to
  the tab or from the back-forward cache. The screen-reader sentence, the
  chip's name and the calculators' row stay in days. Without JavaScript,
  nothing changes. No pulse.
- This reverses Run 32's D21 (days only, no timer), by Damian's call.
- Chip 121px (130 at a three-digit count), 37px wider: measured at ten
  widths from 1600 to 375, no nav row overruns or wraps.
- `tests/deadline.test.py` 360 checks; four mutants caught (no timer, a
  per-second interval, a wall-clock minute, seconds shown).
- Compliance pack section 7 names the band's boxes.

## Items 2 and 3, the rubric and the audit

- Measured: 43 type sizes at 375 and 48 at 1440, seven weights; 39 to 42
  spacing values, 58% off a 4-based scale; 20 text and 18 background
  colours; home page 19 sections and 24 phone screens.
- References: there is no `/refs/` folder; the seven captures in
  `~/Downloads` stand in for it, as in `docs/INTERACTIVE-AUDIT-2.md`.
  Mercury's capture rendered only its hero and footer.
- The `frontend-design` skill is not installed in this session;
  `design:design-critique` was used.
- **A screenshot trap:** a capture in one window as tall as the page (how
  `verify.py` shoots) is wrong for the home page at 1440 and the starter
  page, whose timelines are sized in viewport heights: 8 of 18 and 6 of 22
  screens came out blank. The audit shot every page screen by screen
  instead (stacked viewport-sized frames).

## Items 4 and 5, Damian's follow-up: merge, fix the shots, keep the tool

- **`verify.py` screenshots**: a new wrapper, `/__screens`, stacks one frame
  per screen, each as tall as the audits' viewport (`SHOT_VIEWPORT`, 900,
  which `run_audit` now takes as its default, so the page height the audit
  measures is the height the frames add up to), each scrolled to its
  screen; the last is clipped to the page's foot. Every frame is what a
  reader sees there, sticky and fixed parts included (Ask Buddy appears on
  each screen; the nav hides on scroll as it does live). The cookie choice
  is made in the wrapper, or the bar would cover the foot of each screen.
  The 16,000px cap is gone: Chrome drew a 22,100px window, and the home
  page at 375 is 19,643. Checked: home and starter at 375 and 1440, a game
  and the 404, no blank screen in any (the home page at 1440 had 8 of 18
  before), the last frame meeting the footer cleanly.
- **`tools/design-measure.py`**: one Chrome launch, every page at 375 x
  812 and 1440 x 900; prints R1, R2, R3, R5, R6 and R7 per page and the
  site's totals, which reproduce the rubric's figures (43 and 48 sizes,
  seven weights, 39 and 42 spacing values, 58% off the steps, 20, 18 and
  14 colours). Reports only; `--json` keeps the raw figures.
- The audit's 20 numbered calls are for Damian; nothing in it is built.

---

# Run 39 — 2026-10-01 · Runs 37 and 38 merged and live; then boxes kept, the clips, the guides, sliders, skeletons and the call (on `claude/ux-5`, merged to main as `31cf29e` on 1 October 2026)

Damian's brief: merge `claude/overnight-ux-4` (9453be1) into main after a
full gate on the merged tree, push main, check the live site; then a new
branch off the new main for the rest, each item gated and pushed, not
merged.

## The merge

- **main `09c5f80`** (`30f8d12..09c5f80`), the merge of 9453be1. Main had not
  moved, so the merged tree is the branch's own. The full gate on it passed:
  every suite, render-diff unchanged against `30f8d12`, `verify.py` 0
  failures at 375 and 1440.
- **The live site**, checked headless at 1440 and 375 once the deploy was
  up (about 30 s): the merged build is served; "What's changed?" shows its
  six chips, each page answering 200; media below the fold is armed and
  pops in, and nothing on the first screen is; both game videos play
  (MP4), the picture as poster, with a Pause button; the search opens from
  its button and from "/", and "annuity" finds the jargon buster's entry
  first; the 404 answers 404 with Buddy, its search box and six places to
  begin. 21 checks, all passing.
- **One flaw, live:** on the 404 at 375 the two buttons lie over each other,
  their sides gone (item 1 below fixes it on this branch).

## Decisions on Run 38's questions (Damian, 1 October 2026)

| # | Question | Decision |
|---|---|---|
| 1 | Run 38 on the same branch as Run 37 | yes |
| 2 | Show a wrong answer in the Jargon Battle clip | no |
| 3 | Pop a card's frame behind its words | no |
| 4 | The pop's feel (12px rise from 97% size) | keep |
| 5 | Keep the tracker photograph's box before it loads | yes: item 1 |
| 6 | Pop the provider logos too | no |
| 7 | Hide the recorded game's own Pause label | yes: item 2 |

## Items

| # | Item | State | Commit |
|---|---|---|---|
| 1 | Boxes kept: the tracker photograph's space before it loads (Q5), and the 404's buttons on a phone | done | c404c75 |
| 2 | Both clips re-recorded without the game's own Pause label (Q7) | done | 15a3757 |
| 3 | Run 37's item 6 (the long guides) re-applied, with the 16px and ETF fixes | done | dd2f09d |
| 4 | Run 37's item 9, slider feel | done | 372a16c |
| 5 | Run 37's item 10, loading skeletons | done | 471f66d |
| 6 | "How a call with Damian works", three steps, a video slot each | done | 044ced4 |
| 7 | "Your worries, answered", a draft for the compliance pack, not published | done | 0e19b4d |
| 8 | Where painted illustrations would replace icons, a list | done | 0e19b4d |
| 9 | Lighthouse, before (`30f8d12`) and after, seven pages | done | aaf9afb |
| 10 | Q2 answered yes: the Buddy's Run still re-shot without its own pause control | done | this commit |

## Item 1, boxes kept

- **The tracker photograph (Q5).** Its figure is centred by auto margins in
  the product band's grid, which makes a grid item shrink to its contents.
  Until the lazy image arrived, the only content with a width was the
  caption, so the photograph was drawn about 127px wide and 158px tall, then
  407 by 507 at 1440 (329 by 409 at 375) once it loaded, and everything
  below it moved down. `width:100%` (still at most 420px) gives it its box
  from the start, the image's own width and height making the height. The
  rule is identical on `starter.html`, `tracker.html` and `director.html`,
  so it changed on all three; only the tracker uses it.
- **The 404's buttons.** The site's last reach pass pads every link inside
  `.legal` for running text (padding 13px 0, margin −13px 0), and the 404
  sits in `.legal`, so its two buttons lost their sides at every width and,
  wrapped on a phone, lay one over the other. They keep the house button's
  padding now (13px 22px), with no negative margin. No other page has a
  button inside `.legal`.
- **Guard: `tests/boxes.test.mjs`**, new, in the gate. Every page at 375
  and 1440: each lazy image keeps its box before it loads; no two buttons
  overlap, and each keeps its sides; and the two cases by name. With either
  fix taken out it fails at both widths. A probe of every page before the
  fixes found these two and nothing else.

## Item 2, the clips without the game's own pause control (Q7)

- **Buddy's Run** shows its own "P to pause" and a Pause button in its top
  bar; beside the card's real pause button it read as a second one. The
  recorder now hides both in their place (`visibility:hidden`), so the score
  chips do not move, and the clip was recorded again: 8 s, 240 frames, at
  most 2 changes a second in any cell against the limit of 6, MP4 834 KB,
  WebM 1.11 MB. Its frames are reproducible: the WebM, encoded in software,
  came out byte for byte the same twice. (The MP4s differ in their bytes
  from run to run: the Mac's H.264 encoder is not byte-stable. What they
  show is the same.)
- **Jargon Battle** has no pause control of its own; its clip is unchanged
  and its files are the committed ones. Recording it twice showed something
  Run 38 did not say: the game plays the same answers, questions and hearts
  every time (the recorder checks all three), but 27 of its 240 frames,
  around the answers, come out a little different, the most 7% of the
  picture, in the top of the frame where the battle is drawn. The recorder
  turns the game's own clock, but not everything on the page follows it
  (its CSS transitions and the dialogue's blinking caret run on the real
  clock), and I have not pinned down which part moves the battle's frames.
  See question 1.
- **Guard:** build check 43 now fails if the recorder stops hiding Buddy's
  Run's pause control (a new mutant), beside its checks on seeding, size and
  markup; the recorder's own flash check and the ux4 decoded-frame flash
  check passed.

## Item 3, the long guides (Run 37's item 6, re-applied)

- **What it is,** as Run 37 built it: the six long guides
  (`pensions-over-50`, `self-employed-pensions`, `uk-pensions-in-ireland`,
  `pia`, `standard-fund-threshold`, `director-pension-rules`) get "On this
  page", a numbered list after the introduction (all a reader without
  JavaScript needs); a bar that keeps it in reach once it has scrolled away
  (`assets/js/pb-guide.js`: the section being read, the list again, and a
  reading line along its foot); and a "Next step" card at the end. The CSS
  is the GUIDE block, byte for byte on every page, after POP.
- **From `claude/overnight-ux-4-guides`** (0f8ad49, and c89dc45's 16px fix),
  re-applied by a three-way merge of each guide's source onto today's
  files; every merge was clean. Both fixes are in: the list's label and the
  next step's words are 16px (the calculators' floor, which the PIA and
  Standard Fund Threshold pages failed in Run 37), and the PIA's list spells
  out "exchange-traded fund (ETF)".
- **New since Run 37:** every page now ends with related pages (Run 37,
  item 7). On `pia` and `director-pension-rules` the related list repeated
  the next step (the pension calculator; the director calculator), so that
  card came off those two lists, which keep two each.
- **Guards,** as Run 37 wrote them: build check 38, and ux4 section 6 (the
  bar names each section as it is read, sits under the nav, its line only
  grows, and a link from its list lands the section clear of both).

## Item 4, slider feel (Run 37's item 9)

- **What it is:** the calculators already float the value above the thumb
  while a slider moves. Now a slider whose values mean something the relief
  module already knows carries small marks just under its track: the
  pension calculator's and the comparison's age (where the relief band
  changes: 30, 40, 50, 55 and 60) and earnings (the earnings that count for
  relief, €115,000). When the thumb lands on a mark the bubble shows a ring,
  and with motion allowed it grows a little as it arrives.
- **No new figures:** every mark comes from `assets/js/pension-tax-relief.js`
  (`PBRelief.reliefBand()`, `PBRelief.EARN_CAP`). The script never sets a
  slider or writes a figure, adds no datalist (so the browser never snaps),
  and the marks are hidden from screen readers. Render-diff shows the
  calculators' writes unchanged.
- **Fixed on the way:** Run 37's prepared version drew the marks below the
  slider's box, where the earnings mark touched the note under it, and its
  script tag would have loaded before the slider polish that draws the
  bubble. The marks now sit inside the slider's own box, 3px under the
  thumb, and load after it; check 41 holds the order (a new mutant).
- **Guards:** build check 41 (marks only where the module gives meaning,
  none typed in, no snapping, no slider set, loaded after the bubble; 5
  mutants) and ux4 section 9 (the marks at the module's values, over the
  track, hidden from screen readers; the bubble signs a mark and only a
  mark).

## Item 5, figures that wait (Run 37's item 10)

- **What it is:** a figure a script writes as the page loads shows a quiet
  bar in its own box until the page's own scripts have run, instead of the
  "--" or "€0" its markup holds for a reader without JavaScript. The head
  script on every page says when (`html.pb-ready`, at DOMContentLoaded);
  the bar pulses only when motion is allowed; nothing moves when it goes.
  Without JavaScript the markup's text shows, as before.
- **Which figures:** found by loading every page and comparing each
  placeholder with what the page then shows: 25, the pension calculator's
  pot, income and two workings, the director calculator's four headline
  figures, sixteen on the comparison, and the home page's day count; and
  the nav's deadline count on every page. A placeholder that is already a
  figure's true first value (a slider at 0%, an empty list's €0) is left
  alone.
- **Fixed on the way:** the comparison's sixteen figures fade their colour
  over 0.2 s when they change. At the moment the page became ready they
  would have faded in rather than arrived, and figures never wait. The
  head script now also sets `html.pb-readying` for that moment (100 ms),
  which stops their own transition, so they arrive at once; their fades for
  later changes are untouched.
- **Guards:** build check 42 (ready from the head script, the readying
  moment, a bar only before it and only with JavaScript, only over
  placeholders, the nav chip on every page; 5 mutants) and ux4 section 10
  (on four pages a bar in each figure's own box before ready and its text
  after, nothing moving; no figure fading in on a real load, which fails
  with the readying rule taken out; no bar without JavaScript; no pulse
  with reduced motion).

## Item 6, "How a call with Damian works"

- **Where:** the home page's section that already told the call in three
  steps ("What to expect": You reach out, We talk it through, You decide).
  Its small label is now your title, "How a call with Damian works"; its
  heading ("Most people brace for a sales pitch. This is a chat.") and the
  three steps' words are as they were, word for word. The booking page has
  its own three steps, about booking itself, so it was left alone (question
  3).
- **The video slots:** over each step, a 16:9 box for your own short video,
  showing a placeholder poster until you have filmed it: the paw on the
  palest teal, 8 KB. The box is kept by its ratio, so nothing moves when a
  video arrives. To put one in: save it as `assets/video/call-step-1.mp4`
  (H.264) and `.webm` (and 2, 3), and give its slot the game cards' markup
  (the comment over the section says how); `pb-video.js` then fetches it
  near the viewport, plays it muted and pauses it off screen, with the
  pause button. Film landscape, 16:9; under 30 seconds keeps each file
  small.
- **New words:** "How a call with Damian works" (your title). Nothing else.
- **Guards:** build check 45 (the steps word for word, each slot the
  placeholder in a 16:9 box, sized, lazy, hidden from screen readers; a
  video put in one later must follow the game cards' rules; 5 mutants) and
  `tests/boxes.test.mjs` (the slots keep their boxes before they load).

## Items 7 and 8, the worries draft and the illustration list

- **"Your worries, answered"** is in the compliance pack, not on the site:
  question 1.22 and Appendix C.1. Twelve questions a first call brings,
  each answered in words already live, with the page each answer is on
  (the home page's "Good to know" and steps, the tracker's and starter's
  questions, the booking confirmation). Nine of the questions are already
  on the site; three are new lines, marked "new words": "Will it be a sales
  pitch?", "What happens on the call?" and "What if we're not the right
  fit?". Where it would go, once approved, is your call.
- **The pack also catches up:** Runs 37 and 38 went live today with words
  compliance has not seen. Question 1.21 lists them all (from "What's
  changed?" to the game videos' pause button), and the update log says so.
- **`docs/ILLUSTRATIONS.md`:** nine places where a small painting would
  replace an icon or a plain number, in order of worth, each with what it
  could show and the size it is drawn today at 1440 and 375 (measured),
  then what to leave alone (the warnings' "i", the paw, the working icons,
  the photographs) and a short brief for the illustrator.

## Item 9, Lighthouse, before and after (mobile, median of three, interleaved)

Before is `30f8d12`, where Run 37 began; after is `0e19b4d`, this branch with
items 1 to 8 (so Runs 37 to 39 together).

| Page | Performance | LCP, s | CLS | TBT, ms |
|---|---|---|---|---|
| index.html | 93 to 91 | 3.08 to 3.23 | 0 to 0 | 0 to 0 |
| pension-calculator.html | 87 to 86 | 3.31 to 3.46 | 0 to 0 | 0 to 0 |
| director-calculator.html | 87 to 88 | 3.31 to 3.16 | 0 to 0 | 0 to 0 |
| glossary.html | 91 to 91 | 2.87 to 2.85 | 0 to 0 | 0 to 0 |
| tracker.html | 94 to 93 | 2.94 to 3.11 | 0 to 0 | 0 to 0 |
| starter.html | 90 to 91 | 3.46 to 3.31 | 0.0012 to 0.0012 | 0 to 0 |
| 404.html | 97 to 96 | 2.40 to 2.70 | 0 to 0 | 0 to 0 |

Every page within two points; no layout shift added anywhere, no blocking
time. The home page sits 0.15 s later than before Run 37. Runs 37 to 39
added a few small scripts to it, and I did not isolate which costs the
0.15 s; it is not the 1.7 s the posters cost before Run 38's follow-up. Lighthouse 13.5.0 was put back from
the machine's own npm cache, offline (the copy Run 32 had used was cleared
from its temporary folder overnight); nothing was downloaded.

## Item 10, the Buddy's Run still without its own pause control

- **Damian's answers, 1 October 2026:** Jargon Battle frame for frame, no;
  re-shoot the stills to match the clip, yes; the call steps on the
  booking page too, no; a hotfix of the 404's buttons to main ahead of the
  rest, no (this branch is merged instead).
- **The still:** `tools/shoot-product.py` hides Buddy's Run's "P to pause"
  and Pause button in their place, as the clip's recorder does, and the
  still was shot again: the same frame (score 30, three lives, "Plenty of
  time" jumped, the Poolbeg stacks behind), so the home page's alt text
  still says what it shows; only the top-right corner where the two sat
  differs. 2400 x 1350 as before; JPG 90 KB, WebP 29 KB. It is the card's
  picture, the video's poster (the same WebP) and all a reader with
  reduced motion sees. Jargon Battle's still has no pause control; it is
  unchanged.
- **Guard:** build check 43 now also fails if the still stops hiding it (a
  new mutant).

## Questions for Damian (answered 1 October 2026: no, yes, no; see item 10)

1. **Jargon Battle, frame for frame.** To make every frame of its clip
   reproducible, I would find what still runs on the real clock and put it
   on the recorder's. Want that? What the clip shows would not change.
2. **The still pictures.** The game cards' pictures, which are also the
   videos' posters and all a reader gets with reduced motion, still show
   Buddy's Run's own "P to pause" and Pause. Re-shoot them without, to
   match the clip?
3. **The call steps on the booking page too?** They are on the home page,
   where the three steps already were. The booking page could carry the
   same three slots under its form, beside its own booking steps.

# Run 38 — 2026-09-30 · The game cards' videos, and media that pops in on scroll (on `claude/overnight-ux-4`, merged to main as `09c5f80` on 1 October 2026)

Damian's brief, two items, built on the same branch as Run 37 (it is under
review as one deploy preview), each gated, committed and pushed; not merged.
Run 37's items 9 and 10 are still not reached.

## Items

| # | Item | State | Commit |
|---|---|---|---|
| 1 | The two game cards' pictures get short loops of the real games | done | 6e54253 |
| 2 | Pop-ins on scroll, media only | done | c916a6b |
| 1, follow-up | The posters load only as a video comes near (Lighthouse found them slowing the home page) | done | this commit |

## Item 1, the videos

- **Recorded headless from the real games** by `tools/record-games.mjs`:
  each game in the stills' own 1200 x 675 frame and CSS (read from
  `tools/shoot-product.py`), its clock turned by the script, the stills'
  seed (20260929) and autopilot; eight seconds at 30 frames. Buddy's Run
  keeps its three lives with the Poolbeg stacks on the far shore; Jargon
  Battle answers its second and third questions right and ends on the
  fourth. Chrome's own encoder (WebCodecs) makes H.264 and VP8, every frame
  exactly 1/30 s, written by `tools/video-mux.js` (no other software): MP4
  839 and 749 KB, WebM 1.13 and 1.18 MB, 1280 x 720.
- **On the page:** the picture stays (it is the poster, and all a reader gets
  without JavaScript or with reduced motion); the video sits over it, muted,
  looping, inline, `preload="none"`, aria-hidden, fetched only within about
  a screen of the viewport, paused off it and when the tab is hidden. The
  button (WCAG 2.2.2) is a pause or play icon in the top corner, named
  "Pause video: Buddy's Run" and so on.
- **No flashing:** the frames are checked before encoding and the decoded
  files again in Chrome, as the games' own probe does (at most 2 changes a
  second in any cell, against a limit of 6).
- **Why VP8 and not VP9 in the WebM:** a Mac's hardware VP9 decoder refused
  one VP9 clip that Chrome's software decoder played; VP8 is only ever
  decoded in software. The MP4 is listed first, so every current browser
  plays the H.264.
- **Gate:** every suite passed on the committed tree. `floating-chrome` timed
  out once in the full run while the machine was busy (other sessions);
  alone on the same checkout it passed 35 of 35 in 165 s, the same time as
  the branch without the videos (165 s).
- **Follow-up, the posters:** a `poster` in the markup is fetched with the
  page, however far down it is. The two JPGs (302 KB) went out in the first
  20 ms, and on Lighthouse's phone the home page's LCP went from 3.23 s to
  4.95 s (performance 92 to 80). The poster is now the card picture's own
  WebP, carried as `data-poster`. `pb-video.js` makes it the poster only as
  the video comes near, by which time the lazy picture has loaded that same
  file. Nothing extra loads, and reduced motion loads no poster at all. The
  home page is back to 92 and 93, LCP 3.23 s and 3.08 s (two runs). Build
  check 43 and ux4 R38-1 now fail if a poster comes back into the markup
  or is never set.

## Item 2, media pops in on scroll

- **What pops, once:** the game cards' pictures and videos, the calculator
  photograph and the three portraits (home), the photographs beside the
  director and tracker pages' copy, the jargon buster's two game tiles, and
  Buddy on the 404 page. The whole list is `POP` in `assets/js/pb-pop.js`.
- **Never:** headings, words, figures, caveats, warnings, the regulator and
  QFA lines, forms. Every element on the list must hold no words and sit in
  none of those, or it is left alone. The portraits pop but the "B.A.,
  Q.F.A." badge on Damian's does not. A card's picture pops but its heading
  and words do not.
- **Left out on purpose:** Starter's annotated calculator photograph (its
  arrows and labels would float over a moving picture); Buddy beside the
  booking button (motion rule 8, nothing moves near a call to action); the
  provider logos (see question 6); the "Out of office" photo strip, which is
  switched off (Run 29). Add the strip to the list if it comes back.
- **The first gate failed** on `providers.test` check 2. It measures each
  logo as drawn, under Chrome's virtual time, where an observer never fires.
  The waiting strip was drawn at 97%, so every logo read 3% short. The
  logos came off the list, and that test was left as it was.
- **How it moves:** it rises 12px (`--pb-rise`, the site's limit) from 97%
  size and fades in. Where scroll timelines work (Chrome, Edge, Safari 26)
  it follows the scroll over the first 40% of its entry. If the reader
  stops part way, it finishes on the clock 300 ms later (`--pb-arrive`), so
  nothing is left half there. Elsewhere (Firefox), and for anything inside
  a box that clips, it arrives in 320 ms (`--pb-t-state`) as it first
  shows. "Shows" means below the nav and above the book bar or cookie bar,
  the same room the site keeps as scroll-padding, so on a phone a picture
  pops as it clears the book bar, not behind it. It is armed only off
  screen, so nothing on the first screen moves. It never plays again,
  moves only opacity and transform (no layout shift), and does nothing
  with reduced motion (from the start or turned on part way) or on paper.
- **Written `:root.pb-motion`, not `html.pb-motion`:** it is the same element.
  Build check 19 treats any fade rule that names `html` as a page fade, and
  that check stays as strict as it was.
- **Guards:** build check 44 (the list names only media; opacity and
  transform, by `--pb-rise`, over at most half the entry or on a pair of
  320 ms or less; only with motion allowed; paper gets everything; on
  every page, late; 13 mutants). ux4 R38-2, 14 checks on seven pages and
  widths, each scrolled through:
  - everything that pops holds no words and nothing that must never pop;
  - nothing on the first screen is armed, and nothing is left faded;
  - no heading, paragraph, list item or listed element moves in the layout;
  - it completes when the reader stops, never replays, waits behind the
    book bar, and does nothing with reduced motion;
  - the fallback's 320 ms is checked.

  I broke it ten ways (a heading on the list, a heading popped by CSS alone,
  a whole card armed, two layout-moving pops, reduced motion ignored, the
  first screen armed, no clock, the book bar ignored, replaying). The guard
  caught all ten.
- **Found on the way (not changed):** the tracker page's photograph of
  Damian and Buddy has no box kept for it before it loads. It is 161px tall
  until the lazy image arrives, then 523px, so the page below it moves down
  as it loads (69px at 1440, where it sits beside the copy). At a normal
  pace that happens off screen. On a slow connection it could happen in
  view. See question 5.

## Lighthouse, before and after (mobile, median of three, interleaved)

Before is `30f8d12`, where Run 37 began. After is `c916a6b`, Runs 37 and 38
up to item 2, without the posters' follow-up.

| Page | Performance | LCP, s | CLS | TBT, ms |
|---|---|---|---|---|
| index.html | 92 to 81 | 3.15 to 4.95 | 0 to 0 | 0 to 0 |
| index.html, with the follow-up (two runs) | 92, 93 | 3.23, 3.08 | 0 | 0 |
| pension-calculator.html | 87 to 86 | 3.31 to 3.46 | 0 to 0 | 0 to 0 |
| director-calculator.html | 87 to 87 | 3.31 to 3.31 | 0 to 0 | 0 to 0 |
| glossary.html | 91 to 91 | 2.86 to 2.86 | 0 to 0 | 0 to 0 |
| tracker.html | 95 to 93 | 2.93 to 3.08 | 0 to 0 | 0 to 0 |
| starter.html | 91 to 91 | 3.30 to 3.31 | 0.0012 to 0.0012 | 0 to 0 |
| 404.html | 97 to 96 | 2.25 to 2.71 | 0 to 0 | 0 to 0 |

The 404 page gained Buddy's picture and a search box in Run 37 (item 8).
The pension calculator and the tracker page are about 0.15 s slower. Run 37
added scripts to both (search, jargon definitions, related pages), and I did
not isolate which one costs it.

## New words on the site (for the pack)

- **Item 1:** the video button's names, "Pause video: Buddy's Run", "Play
  video: Buddy's Run", and the same for Jargon Battle (for a screen reader;
  the button shows an icon).
- **Item 2:** none.

## Questions for Damian

1. **Same branch.** Run 38 went on `claude/overnight-ux-4`, after Run 37's
   item 8, so one deploy preview shows both. Say if you wanted it apart.
2. **The clips.** Buddy's Run: eight seconds after a five-second run-up, no
   life lost. Jargon Battle: two questions answered right, second to fourth.
   Want a wrong answer shown too (a heart lost), or other moments?
3. **Cards.** The brief lets cards pop and never headings or body text. A
   card holds both, so only a card's picture pops, and its heading and words
   stay still. A card's frame (border and shadow) could pop without its
   words, drawn behind them. Want that?
4. **The feel.** A 12px rise from 97% size, and the first 40% of the entry
   or 320 ms. Want it bigger, smaller or slower? The motion system's
   limits are 12px and 640 ms.
5. **The tracker photograph** (above): keep its box before it loads, one
   line of CSS? It would not change how the page looks once loaded.
6. **The provider logos.** The brief lets logos pop. These already move, in
   their ticker, and `providers.test` checks their drawn size, which a
   waiting pop shrinks to 97%. Want them to pop as well, with that test
   measuring the settled size instead?

# Run 37 — 2026-09-29 overnight · UX 4 on `claude/overnight-ux-4` (merged to main as `09c5f80` on 1 October 2026)

Damian's brief: a UX audit (`docs/UX-AUDIT-4.md`), then ten items in order,
each built, gated, committed and pushed; the branch is NOT merged (he reviews
on the Netlify deploy preview). Branch off main `30f8d12`.

**Where to resume:** the table says which items are pushed. Start at the first
row that is not "done", on `claude/overnight-ux-4`, with the gate in
`docs/UX-AUDIT-4.md` ("How each item is built and gated").

## Items

| # | Item | State | Commit |
|---|---|---|---|
| 0 | Audit, `docs/UX-AUDIT-4.md` | done | this commit |
| 1 | Life-event picker on the home page: "What's changed?", six links under the hero | done | this commit |
| 2 | Jargon definitions at first use: the jargon buster's own words, on 21 pages | done | this commit |
| 3 | Site search: the magnifier in the nav and "/", over pages, sections and the jargon buster, in the browser | done | this commit |
| 4 | "Your pension through life": nine ages from 18 to 71 on the home page, each a link; a card follows the reader on a wide screen | done | this commit |
| 5 | Save as A on the pension calculator: A beside your figures now, a copy of what the page shows | done | this commit |
| 6 | Long guides: on this page, progress, next step | skipped: failed the gate twice (an initialism first used in the new list; then 14-15px text under the calculators' 16px floor on the PIA and threshold pages). Reverted here; parked, with the 16px fix, on `claude/overnight-ux-4-guides` (not gated after the fix) | |
| 7 | Related pages: two or three cards at the end of 22 pages, one shared component written into the markup | done | this commit |
| 8 | The 404: Buddy, a search box in the page, and the home page's six places to begin | done | this commit |
| 9 | Slider feel | not reached | |
| 10 | Figures that wait: skeletons | not reached | |

## Found and fixed on the way

- **Ask Buddy came back over a focused link (item 2's gate).** When the
  booking bar comes up after a control has taken focus, Ask Buddy's place
  moves up above the bar, but it had decided whether the focused control was
  underneath it from its old place; so, once its step-aside timer ran out, it
  came back onto the "Pension calculator" link in "Six places to begin" (the
  floating-chrome test, tab walk, home page at 375). Item 2 did not cause it:
  one more focusable control on the page moved the walk's timing onto it, and
  the same walk with the definitions blocked fails too once its pace changes.
  The fix is one line in `assets/js/pb-buddy.js`: when a bar comes or goes,
  ask again whether the focused control is under the button.

## New words on the site (for the pack)

- **Item 1**, the home page, under the hero: the heading "What's changed?"
  and six links, "New job" (to the auto-enrolment comparison), "Left a job"
  (Find a pension), "Started a company" (Pensions for company directors),
  "Turning 50" (Pensions after 50), "Had a baby or a career break" (the State
  Pension entitlement check) and "Moved from the UK" (A UK pension, and living
  in Ireland). Each link's name for a screen reader adds the page's nav name.

- **Item 2**, no new words: the definition shows the jargon buster's name for
  the term, its first paragraph word for word, and "See it in the jargon
  buster" (the jargon chips' link text); a screen reader hears "What this
  means" after the term (the chips' own title). Where they appear today:
  director rules (PRSA, Standard Fund Threshold, AVCs, tax relief, lump
  sums), over-50s (tax relief, AVCs, PRSA, Personal Retirement Bond, lump
  sum, annuity, ARF), self-employed (tax relief, PRSA, annuity), Standard
  Fund Threshold (tax relief, lump sum, defined benefit), the home page, the
  PIA page (tax relief) and the UK guide (State Pension).
- **Item 3**, the search: the nav button's name "Search"; in the search,
  "Search Pensionbuddy", "Search pages, guides and the jargon buster" (in
  the empty field), "Close", "1 result" / "N results", "Nothing found. Try
  one word, such as PRSA, or see the jargon buster.", "Jargon buster" under
  a buster entry, and "The search could not load. Every page is in the
  menu." Results show each page's own title and description, and the
  heading of the section that matched.
- **Item 4**, the home page, after "Six places to begin": the kicker "Your
  pension through life" and the heading "What changes, and when."; step
  headings "Under 30", "From 30" ... "At 66", "From 71". Every step's
  sentence is the site's own (the relief bands from the self-employed and
  over-50s guides, early access and the Approved Retirement Fund from the
  over-50s guide, pension age from the starter page), under the guides' own
  "Rules as at 24 September 2026" line; build check 36 finds each step's
  figures on the page it links to.
- **Item 5**, the pension calculator, after the two warnings: "Save as A",
  "Keep these figures as A, then move the sliders to see A beside them.
  Nothing is stored.", "A is saved. Change the sliders to see it beside your
  figures now.", the table's caption "A beside your figures now" with columns
  "A" and "Now", "Clear A", and (for a screen reader) "changed" beside a
  value that differs. While the guess card still hides the figures, the
  button says the saved report's own "Reveal the illustration first, then
  save it." Every figure in the table is copied off the page as the page
  wrote it: nothing is worked out.
- **Item 7**, the end of 22 pages: the label "Related pages" over two or
  three cards, each a page's name (as the nav or the home page's six places
  writes it) and a line already on the site (its line in the six places, the
  first sentence of its own description, or a sentence of its introduction
  where that sentence carries an initialism a page might not have spelled
  out). The table is `RELATED` in `tools/pagebuild.py`; build check 39 finds
  every line on its page.
- **Item 8**, the 404, below its own words (kept as they were): Buddy's
  picture ("Buddy, the Pensionbuddy dog", his usual alt text), the search
  box with the search's own words (drawn only with JavaScript), and "Six
  places to begin." with the home page's six names and lines, word for word.

## Questions for Damian

1. **Age 75 is not on the site.** The brief lists "75 vesting" among the
   milestones the site covers; no page or module mentions 75. The timeline
   stops its milestones at 71 (the ARF's 5%, the last age the site names).
   Words for 75, or leave it out?
2. **Terms with no glossary entry get no definition:** auto-enrolment and My
   Future Fund, PRSI, USC, small self-administered schemes, HomeCaring
   Periods, credits. New glossary entries would be new copy.
3. **Where "What's changed?" sits, and where each change goes.** Under the
   hero, above the provider logos (the brief's "under the hero"). "New job"
   goes to the auto-enrolment comparison (what a new job starts), "Had a baby
   or a career break" to the entitlement check (HomeCaring Periods and
   credits are there). Say if either should go elsewhere.
4. **Where the definitions do not go.** Not on the jargon buster, the legal
   pages, How we work, booking, the thank-you page, the 404 or the games; not
   in headings, links, a calculator's panel or results, the FAQ (Ask Buddy
   copies it), the family's story (locked copy) or any caveat; not for
   "Pension" (the subject of every page); and not for a term a jargon chip
   already explains on the three audience pages. So today they appear on
   seven pages. The buster's "Tax relief" entry carries its own figure
   ("for every €100 you put in, around €40 can come back"), which now also
   shows beside "tax relief" on six pages. Wider, narrower, or as it is?
5. **"Works offline".** Read as: no outside service, everything in the
   browser. The index (18 KB) comes from the site the first time a reader
   opens the search or points at the button, and from then on the search
   works with no network. A search that works on a page opened with no
   network at all would need the site installed (a service worker): say if
   that is what you meant.
6. **The nav made room for the search button.** From 1301px, where the nav
   is one row, each item's side padding went from 8px to 5px and the row
   starts 6px nearer the logo: 42px, which the 40px button and its gap
   needed (the row had 25px spare at 1301 and 27px at 1440 with the chip).
   Measured to fit from 1301 to 1920 and in the drawer.
7. **Where the timeline sits.** On the home page, after "Six places to
   begin" and before Revenue's deadline: the brief named no page, and the
   home page is where every audience starts. It adds 1,474px to the home
   page on a phone and 2,364px at 1440 (the audit's third finding is the
   page's length). Starter, or its own page, instead?
8. **Which pages the related cards pick, and where there are none.** The
   table in `tools/pagebuild.py` (RELATED) is mine: say where it sends a
   reader somewhere you would not. None on the home page (it is the map, and
   ends on its own call), booking and the thank-you page (one job each), the
   404 (its own six places), the held pages or the games.

# Run 36 — 2026-09-29 · Run 35's calls, Run 34 merged, and PRSI's rise on 1 October ahead of the day

Damian's brief, in two parts. First: take the qualifications strip off Our
story (keep the one under his section); balance the six ticker logos by
eye; merge `claude/overnight-3` (Run 34) into `main` per R35-10, with the
full gate on the merged tree and Lighthouse before and after; push `main`;
report the hash and what Run 34 still needs. The usage limit stopped the
session after the merge commit, before the gate. Resumed with more: before
1 October, make the director calculator's "up to 52.2% ... 52.35% from 1
October 2026" line read right from that date with JavaScript on and off,
re-shoot the director photograph at 4.35%, and list any September-dated
text that claims a "current" rate (the dates themselves stay); and his
answers to Run 34's questions. Branch `claude/r35-calls-run34-merge` off
`main` (`c19cb5a`).

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| 1 | One strip on the home page (R35-7) | done. The copy at the end of Our story is off; the story's words are as they were before Run 35. The strip stays under Damian's section, beside the booking form and in every footer. Check 31 holds the three places and catches the story's copy put back (a twelfth fault). | `db2531c` |
| 2 | The logos balanced by eye (R35-5) | done. Each has a `size` in `assets/js/pb-providers.js`, its height on a computer (seven-eighths on a phone): Zurich 30, Irish Life 29, Aviva 23, New Ireland 44, Royal London 34, Standard Life 27. Found by measuring each one's width and ink in grey at one height (Aviva carried about three times Royal London's ink at a similar width; New Ireland's crest the least), trying four sets side by side, and choosing by eye, in grey and in colour, at both sizes. The strip, its still row and the no-JavaScript row all use them. `tests/providers.test.py` 86 checks, two more faults caught. | `9d5df15` |
| 3 | Run 34 merged (R35-10) | done. Four conflicts: `tests/build.test.py` (both added checks after 28: kept both, 29 to 32 in order), `sitemap.xml` (regenerated), `docs/STATUS.md` (both sections kept, newest first), `docs/COMPLIANCE-PACK.md` (both added a question 1.19: Run 35's keeps it, being live; Run 34's search-and-share question is 1.20, in the present tense). The ten built pages came out of `tools/pagebuild.py` byte for byte as git had merged them; `seo.py --check`, sync-chrome, stamps and the sitemap clean; the two game pictures re-shoot byte for byte the same with the site's own fonts. | `b7c5405` |
| 4 | The game cards and Run 34's card rule | done. Run 34 gave every whole-card link a shadow under the pointer and on focus (MOTION rule 5, `.pb-card-link`); Run 35's game cards now carry it. The card no longer clips (its `overflow:hidden` hid the shadow); the picture rounds its own corners. Check 32 holds the class. | `49c07d6` |
| 5 | PRSI on 1 October, ahead of the day | done. The director calculator's two sentences about the rate now come from `assets/js/pb-prsi.js` (`lines`, `statics`, `write`): with JavaScript, the day's words (unchanged to 30 September; "up to 52.35% ..." from 1 October, with nothing still to come); without, words true on any date ("up to 52.35% ..., the rate from 1 October 2026 (52.2% before then)"). Checked in Chrome at 23:59 on 30 September, 00:01 on 1 October and with JavaScript off. The photograph re-shot as at noon on 1 October (`tools/shoot-product.py --clock=`): EUR 19,060, 4.35%, EUR 9,530; 2184x3149 (was 3187), the two pages' sizes to match. `tests/prsi.test.js` 23 checks (was 14), build check 17 two more faults (339). | `8fc442e` |

## September-dated text that claims a current rate (listed, not changed)

The review and as-at dates stay: they say when the content was checked.
Searched every live page's main text for a rate, a euro figure or a limit
in a sentence that says current, currently, now, today or this year, and
for the September-dated pages:

- `pia.html` ("How the same money is taxed today, outside the account":
  the 38% exit tax and the deemed disposal every eight years; "selling is
  taxed under today's rules"), and the jargon buster's PIA entry
  ("Instead of today's exit tax, deemed disposal and Capital Gains Tax"),
  both as at 25 September 2026: Budget 2027, on 6 October, may change
  them.
- `broker-vs-autoenrolment.html`: "My Future Fund does not currently
  accept contributions above its set rate", and "The 2026 rates are
  confirmed at gov.ie" (checked 10 September 2026).
- `state-pension-entitlement.html` (and the reality check and starter
  guide): "The maximum personal rate is €299.30 a week from January 2026,
  and the six Yearly Average band rates are the 2026 rates": dated
  correctly; the Budget may set 2027's.
- `pension-calculator.html`: "Check gov.ie for the current rate.": a
  pointer, not a figure.
- The director pages' PRSI: now read by date (item 5).

The "Rules as at 24 September 2026" guides (directors' rules, year-end
checklist, over 50, self-employed, the Standard Fund Threshold, UK
pensions) state their date and claim nothing as current.

## Damian's answers to Run 34 (29 September 2026)

Share cards carry no full regulatory sentence on the picture, the page
does; the "50" in the over-50 card's headline is fine; the fourteen
shortened search lines are approved (pack 1.20 keeps all three for
compliance to confirm). The PIA tables scrolling sideways at 320 to 351px:
accepted. The glossary's term index and the tracker's papers: accepted,
read as keeping what Run 34 shipped (one scrolling row; the pile), the way
the PIA answer is. Parts 7, 12c, 3d and 9a: parked.

## Proof

- The full gate on the merged tree (`8fc442e`, everything but these
  notes): every suite passes, Run 34's with them (`build.test.py` 339,
  `providers.test.py` 86, `consent.test.py` 714, the PRSI suite 23 in
  Chrome); the render-diff against `main` (`c19cb5a`) loads every page to
  the same render, write for write, and 8,000 events a page differ nowhere,
  the PIA page (Run 34's addition) included; `verify.py` 0 FAIL, `main`'s
  four WARNs, no site rows. Item 1's own tree (`9d5df15`) passed the same
  gate before the merge.
- Lighthouse, mobile, five runs a side interleaved; before = `9d5df15`
  (Google Fonts over the network), after = the merged tree (the site's own
  fonts); medians:

| Page | Perf | First paint ms | Largest paint ms | Layout shift |
|---|---|---|---|---|
| Home | 98 → 99 | 1684 → 1058 | 2030 → 2182 | 0 → 0 |
| Directors | 90 → 99 | 2895 → 1063 | 2895 → 2113 | 0.0004 → 0 |
| Pension calculator | 99 → 97 | 1683 → 1816 | 1744 → 2264 | 0.0007 → 0 |
| Booking | 100 → 99 | 1529 → 1359 | 1529 → 1809 | 0 → 0 |
| PIA | 99 → 98 | 1681 → 1807 | 1744 → 2107 | 0.0013 → 0 |

  As Run 34 found: first paint sooner where the page is light, and every
  small layout shift gone; the simulated largest paint 0.3 to 0.5s later,
  because Lighthouse's simulation counts the site's own font files, which
  now finish before that paint (Google's, from another origin, finished
  after it and were not counted, though every reader waited for them behind
  a render-blocking stylesheet). Accessibility and search scores unchanged
  on all five.
- Looked at: the balanced strip at 1440 and 375, in grey and in colour; a
  hovered game card (the shadow, the corners); the director photograph old
  and new side by side; the two director sentences in Chrome either side of
  midnight on 1 October and with JavaScript off.

# Run 35 — 2026-09-29 · The provider logos on, Damian's qualifications and memberships, the games on the home page

Damian's brief: branch `claude/trust-logos-games` off `main` (`669becc`),
fast mode, locked rules, the gate before each item, merge and push `main` at
the end. Four items: sort the logo folder; switch the provider ticker on
with the real logos; a strip of Damian's qualifications and professional
bodies; a "Just here to learn?" section for the games. The new copy and the
logo list go into `docs/COMPLIANCE-PACK.md` (question 1.19, Appendix B.18
to B.20). Run 34 (`claude/overnight-3`) is pushed but not merged, so this
run is 35, and its build checks are 31 and 32 (29 and 30 are that
branch's).

## Recorded, 29 September 2026

- **Damian confirms: written permission is held for every provider logo
  and every qualification or professional body logo in `incoming-logos/`.**
- There was no `incoming-logos/` folder on this Mac. The only logo files
  were in `~/Downloads/PensionBuddy_Provider_Logos`: 22 files, provider
  logos only (the list is below). Asked, Damian confirmed the same day that
  his permission covers that folder, and that only the six providers
  already on the ticker go live. The other seven brands in it are not on
  the agency list and are not on the site; the folder's own README calls
  its files sourced from the providers' websites and "not a grant of
  brand-use permission", which is why the question was asked.
- The folder held no qualification or professional-body logo. The
  question put to Damian said the site named one qualification, the QFA;
  the portrait on the home page also carries a badge, "B.A., Q.F.A." (R35-6).
  Asked what the strip should show, Damian answered: the LIA as well. So
  the strip is text: "Qualified Financial Adviser (QFA)" and "Life
  Insurance Association (LIA)".
- No Central Bank of Ireland logo was in the folder, so none was skipped
  and none is used anywhere.

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| 1 | Sort the folder | done. Every file listed below. The six ticker providers' logos are in `assets/logos/`, made by `tools/logos.py` (new): the four SVGs (Irish Life, Aviva, Royal London, Standard Life) lose their editor leftovers, keep their paths (numbers to three decimals) and have their viewBox trimmed to the artwork; the two PNGs (Zurich, New Ireland) are lossless WebP, trimmed to their visible pixels, New Ireland also scaled down from 5,691px tall to 120px (three times the height it is drawn at) and Zurich kept at its own 34px. All one height: every SVG 40px tall, and every logo drawn at one height on the page. Proved to be the providers' artwork, unchanged: every SVG coordinate within 0.0005 of the original's (Aviva and Royal London exactly), and drawn at four times the size over the whole of the original, the two differ by more than an eighth, in any of red, green and blue, on at most 60 of 142,870 pixels (Standard Life's edges); six faults put in on purpose were caught (see the review). **Flagged:** Zurich's file is low resolution (R35-2); New Ireland's is its round crest (R35-3). | `e877f77` |
| 2 | Provider ticker, on | done. `assets/js/pb-providers.js`: `ON` true, each provider with its logo file and size; the label is still "Providers we hold agencies with". The logos are 32px tall (28px on a phone), fully greyscale at 72% opacity until the pointer is on one, when it shows its own colours; hovering pauses the strip and the Pause button stops it, as before. The button's name now changes with its word ("Pause the provider logos", "Play the provider logos"), with no aria-pressed: it said "Pause the provider logos" while showing "Play" (WCAG 2.5.3, found in the pre-merge review). Reduced motion: a still, centred row (one line from 1200px). Without JavaScript: the same row, still, from a `<noscript>` straight after the mount, held to the same list by the test. Under the hero, where the mount already was; built at the page's foot, with no layout shift, because the hero ends below the first screen at every size measured (1,325 to 1,447px down at 375x812, 390x844, 768x1024, 1280x720, 1440x900, 1920x1080). The file's comment and `index.html`'s now say the list must match How we work's agencies when that page is released. `tests/providers.test.py` rewritten for "on" (80 checks after the review, ten faults caught). | `8520e6e`, `b4d4839` |
| 3 | Qualifications strip | done. "Damian's qualifications and memberships", then "Qualified Financial Adviser (QFA)" and "Life Insurance Association (LIA)", each by its full name, in text (no logo files exist; R35-6). In four places: the end of the home page's Our story; under Damian's section, after his signature (the locked copy of both sections is unchanged, only added to); the left-hand column beside the booking form (on a phone, straight above the form's card); and small, in the brand column of the footer of every page (the skeleton's foot-top, synced to all 29 root pages and held there by chrome_drift; the two games keep their own footer, R35-9). Static. The label says whose they are, so neither body seems to endorse Pensionbuddy, and the strip says nothing else. Styles in a new shared block, `QUALS` (`pagebuild.SHARED_CSS`). `tests/build.test.py` check 31 (eleven faults caught, two of them added in the review). | `b0e533a` |
| 4 | "Just here to learn?" | done. On the home page, straight after the first section (the gap band), before the calculator band: "Learn it the fun way" over "Just here to learn? Play the jargon buster.", and two cards: Buddy's Run ("Collect the benefits, jump the excuses.") and Jargon Battle ("Pick the right meaning to bust the Jargon Blob."), the glossary's own lines, each with a play link to the game ("Play Buddy's Run", "Play Jargon Battle") that the whole card answers to. The pictures are real games, mid-play, photographed by `tools/shoot-product.py` like the calculators (1200px at 2x, cropped to the game; the glossary arcade's layout, 16:9): Buddy at the top of a jump over "Plenty of time", three lives, score 30, the Poolbeg stacks behind him; Jargon Battle on its fourth term, "A wild Trustee appears!", two hits landed and a heart lost. Seeded, and the game's own frame loop is held still for the shot, so the frame measured is the frame shot and a re-shoot is byte for byte the same (the first shots were not: the world scrolled on before the play began); a shot that never reaches its frame stops rather than photograph another. The section sits on the gap band's last colour (#EEF8F5), so the dark band below still fades in from it. Static: no motion, and the home page offers nothing for playing. `tests/build.test.py` check 32 (six faults caught). | `55f3c64` |

## The folder (item 1)

`~/Downloads/PensionBuddy_Provider_Logos`, as it was on 29 September 2026.
"Used" means in `assets/logos/`, on the site.

| File | What it is | Format | Size | Used |
|---|---|---|---|---|
| `README.txt` | The collection's notes: scope, outstanding providers, "not a grant of brand-use permission" | text | 2,524 B | no |
| `index.html` | A catalogue page of the 13 brands | HTML | 5,527 B | no |
| `preview.jpg` | Contact sheet of the 13 brands | JPEG 1400x1200 | 112,849 B | no |
| `sources.csv` | Where each file came from, and its quality | CSV | 3,235 B | no |
| `originals/zurich.png` | Zurich | PNG 150x45, **low resolution** | 2,492 B | yes, `zurich.webp` (145x34, 1,280 B) |
| `originals/irish-life.svg` | Irish Life (the header SVG from irishlife.ie) | SVG 217x100 | 10,365 B | yes, `irish-life.svg` (9,260 B) |
| `originals/aviva.svg` | Aviva | SVG 226.8x40.6 (no viewBox) | 1,543 B | yes, `aviva.svg` (1,087 B) |
| `originals/new-ireland.png` | New Ireland, the round crest | PNG 5658x5691 | 527,793 B | yes, `new-ireland.webp` (119x120, 7,478 B) |
| `originals/royal-london.svg` | Royal London Ireland | SVG 646.3x143.8 | 9,059 B | yes, `royal-london.svg` (8,376 B) |
| `originals/standard-life.svg` | Standard Life | SVG 380x88 | 17,653 B | yes, `standard-life.svg` (11,566 B) |
| `originals/davy.svg` | Davy | SVG 80x80 | 2,876 B | no: not on the agency list |
| `originals/itc.svg` | Independent Trustee Company | SVG 400x290 | 14,550 B | no: not on the agency list |
| `originals/newcourt.png` | Newcourt Retirement Fund Managers | PNG 2596x498 | 27,497 B | no: not on the agency list |
| `originals/quest.png` | Quest Retirement Solutions | PNG 294x142, **low resolution** | 2,761 B | no: not on the agency list |
| `png/aib-life-2000px.png` | AIB Life (its SVG original is not in the folder) | PNG 2000x813 | 105,166 B | no: not on the agency list |
| `png/lifesight-2000px.png` | LifeSight by WTW (its SVG original is not in the folder) | PNG 2000x918 | 59,060 B | no: not on the agency list |
| `png/davy-2000px.png` | Davy | PNG 2000x2000 | 68,588 B | no |
| `png/itc-2000px.png` | Independent Trustee Company | PNG 2000x1450 | 109,698 B | no |
| `png/aviva-2000px.png` | Aviva, a 2000px copy of the SVG | PNG 2000x358 | 42,586 B | no: the SVG is used |
| `png/irish-life-2000px.png` | Irish Life, 2000px copy | PNG 2000x922 | 140,092 B | no: the SVG is used |
| `png/royal-london-2000px.png` | Royal London, 2000px copy | PNG 2000x445 | 87,137 B | no: the SVG is used |
| `png/standard-life-2000px.png` | Standard Life, 2000px copy | PNG 2000x463 | 45,587 B | no: the SVG is used |

Named in the catalogue and `sources.csv` but not in the folder:
`originals/bcwm.png` (BCWM), `originals/aib-life.svg`,
`originals/lifesight.svg`. Not in the folder at all: any qualification or
professional-body logo, and any Central Bank of Ireland logo.

## NEEDS DAMIAN INPUT from this run

- **R35-1 The ticker's list and How we work** (R29-2, still open). R29-2
  said both should name the same providers before either went live; the
  brief switched the ticker on first and asked for this line instead. When
  `how-we-work.html` is released, its list of the product producers we hold
  agencies with must name exactly these six: Zurich, Irish Life, Aviva, New
  Ireland, Royal London, Standard Life. Change `assets/js/pb-providers.js`,
  the `<noscript>` row in `index.html` and the page together.
- **R35-2 Zurich's logo is low resolution**: the 150x45 image from
  zurich.ie, 34px tall once trimmed, drawn 32px tall. Sharp enough on an
  ordinary screen, soft on a phone's or a Mac's. The README gives Zurich's
  logo library (blueroom.zurich.com); an SVG from there goes in with
  `tools/logos.py`. More generally, R29-1 asked for the logo files from
  each provider: these are the logos from their websites, so a provider's
  own approved file can replace any of them the same way.
- **R35-3 New Ireland's logo is its round crest**, "New Ireland, 1918,
  Securing your future" round the javelin thrower. At the strip's one
  height it reads as a mark, not as words. A horizontal version, if New
  Ireland has one, would read better; the brief asked for one height, so it
  is not drawn larger.
- **R35-4 Seven brands not used**: Davy, Independent Trustee Company,
  Newcourt, Quest, AIB Life, LifeSight and (named, no file) BCWM. If any is
  an agency, it needs its permission and a line on How we work first.
- **R35-5 One height, as asked** (answered in Run 36: balanced by eye). At one height Aviva reads heaviest and
  New Ireland's crest smallest. Balancing them by eye is a one-line change
  per logo, if you want it.
- **R35-6 The strip is text only.** No QFA or LIA logo file exists. When
  you have them (and the LIA's permission to show its logo, if it asks for
  one), each goes inside its item as an image with the full name as alt
  text; the styles are already in the QUALS block. The LIA's own website
  now calls itself "LIA"; its history page says "Life Insurance
  Association Ireland" (lia.ie, read 29 September 2026); the site already
  said "the Life Insurance Association (LIA)" in the gap chart's source
  line, so the strip says the same. Your portrait's badge says "B.A.,
  Q.F.A."; the strip leaves the degree out, because your answer named the
  QFA and the LIA. Say if the B.A. belongs in it too.
- **R35-7 The home page shows the strip twice** (answered in Run 36: the one under Damian's section stays), at the end of Our story
  and under your own section, a screen apart, because the brief named both.
  Say if you want one (the one under your section reads as yours). Every
  page's footer carries the small one as well.
- **R35-8 The Poolbeg stacks are Buddy's Run's.** Jargon Battle's scene is
  Buddy and the Blob on a green hill, with no skyline, so its picture has
  no stacks; nothing in the game was changed to add any.
- **R35-9 The games' own pages** keep their one-line footer, which is not
  the site's, so the small strip is not on them.
- **R35-10 Run 34 (`claude/overnight-3`)** (done in Run 36), when you merge it onto this
  `main`: git merges every page by itself; `sitemap.xml` and
  `tests/build.test.py` conflict (both add to the same places: regenerate
  the sitemap with `tools/sitemap.py`, keep both sets of checks), and then
  run `tools/pagebuild.py`, `tools/sync-chrome.py --check` and
  `tools/stamp-images.py --check`.
- **Compliance**: question 1.19 in the pack (the logos under "Providers we
  hold agencies with", the strip's wording, the games on the home page).

## The pre-merge review

Two reviewers, one on the code, accessibility and tests, one on the copy,
compliance and these notes: 18 findings between them, 17 different (both
found the Pause button), every one accepted and fixed before the merge.

- **A live accessibility fault**: the ticker's Pause button, once pressed,
  showed "Play" but was still named "Pause the provider logos" (and
  pressed), so "click Play" found nothing by voice (WCAG 2.5.3). Its name
  now changes with its word, with no aria-pressed; tests/providers.test.py
  holds the name to the word in both states.
- **The seams round the dark band**: the new games section sat on the
  page colour between the gap band's wash and the calculator band, which
  fades in from the wash's last colour, so two hard edges appeared. The
  section now sits on that colour (#EEF8F5), so both seams are soft again.
- **Focus on the play links**: the link's outline was switched off and the
  card's ring drawn with `:has()`, so a browser without `:has()`, or
  forced colours, showed no focus. The outline is now transparent, and only
  where `:has()` works.
- **Proofs that could pass wrongly**, all fixed and shown to fail on the
  fault: `tools/logos.py` compared lightness only (a purple logo drawn
  black passed) and only inside the trimmed box (a crop passed), and
  dropped fills given only by a class, the usual editor export; it now
  compares red, green and blue, over the whole original, applies class
  fills, and refuses strokes, markers and filters. The ticker test's
  no-JavaScript check ignored an item written another way (a stray brand
  passed); it now counts every item and image. Check 31 passed a logo with
  no alt text, or the other body's name; each logo's alt text must now be
  its own item's name (two more faults caught). `tools/shoot-product.py`
  shot whatever was on screen if a game never reached its frame; it now
  stops instead, since the alt text describes that frame. Checking that
  fix found one more: Buddy's Run's world scrolls from the moment the page
  loads, so the tool's two Chrome launches (one measures, one shoots) could
  stop on different frames; the game's own frame loop is now held still for
  the shot, and two shoots come out byte for byte the same.
- **These notes and the pack**, made to say no more than was given: the
  permission is Damian's confirmation, not a fact the site states; the
  files are the logos on the providers' own websites, not files the
  providers sent, and the pack asks whether the permissions cover showing
  them in grey; the ticker went live ahead of R29-2, as the brief asked;
  "every footer" is every page's but the two games'; only Buddy's Run's
  picture shows a score, which the pack now names as a gamified element
  (Guidance 3.5.7), and finishing a game earns a paw print, so "nothing is
  offered for playing" is said of the home page only; the portrait's
  "B.A." badge is noted where the question to Damian named only the QFA.
- Rejected: none. Not done: the home page's two strips (R35-7) and the
  games' own footers (R35-9) are left for Damian.

## Proof

- The gate before each item, each on a clean checkout of exactly what was
  committed: `tests/run-tests.py` ALL SUITES PASS; `build.test.py`,
  `runner.test.py`, `games.test.py`, `deadline.test.py`, `nav.test.py`,
  `consent.test.py`, `lead-forms.test.py`, `providers.test.py`,
  `gap-band.py`, `regulator-lines.test.py` (and `--caveats`),
  `floating-chrome.test.mjs`, `check-initialisms.py`, `stamp-images.py
  --check`, `sync-chrome.py --check`, render-diff (load, and 8,000 events
  a page) against `main`, and `verify.py` at 375 and 1440: 0 FAIL.
  `build.test.py` 303 on `main`, 313 after item 3, 320 after item 4, 322
  after the review; `providers.test.py` 39 on `main`, 75, then 80.
- Each new check shown able to fail: the logo proof 2 faults, then 4 more
  after the review (a colour change, a crop, a stroke refused, and a file
  whose fills are only in classes, now kept); the ticker 8, then 2 more (the
  button's old name, a stray item in the no-JavaScript row); check 31 11;
  check 32 6.
- The final gate, on `33c3ae0` (everything but this paragraph): every
  suite above passes (`build.test.py` 322, `providers.test.py` 80), the
  render-diff against `main` is identical, and `verify.py` finds 0 FAIL,
  the same four WARNs as `main`, and no site rows.
- Lighthouse, mobile, five runs each, `main` and this tree interleaved,
  fonts served locally to both (medians, [range]): home 98 [97-98] to 98
  [98-98], largest paint 2.34s to 2.33s, layout shift 0 to 0; booking 99 to
  99, largest paint 1.66s to 1.81s, but both sides range 1.66 to 1.81s (the
  page's two usual values, not a change); pension calculator 98 to 98,
  largest paint 2.26s both, layout shift 0.0007 both. Total blocking time
  0 everywhere.
- Looked at, at 1440 and 375: the ticker moving, still (reduced motion),
  without JavaScript and with a logo under the pointer; the strip in all
  four places; the games section; the two game pictures at full size.

# Run 34 — 2026-09-28 overnight · Seven items on `claude/overnight-3` (merged into main in Run 36, 29 September)

Damian's brief: an unattended run, one item at a time, each built, gated,
committed and pushed; the branch is reviewed on the Netlify deploy preview
and not merged. Anything needing his judgement: the most conservative
option, logged as a question. Branch off `main` (`669becc`).

Where it stands: all seven items reached, each gated and pushed; nothing
is merged. What was not done, and why, is in each row; the questions are
below. To pick up: the Budget-day and deadline dates under item 7, and
the parts of item 4 left for a daytime run (3d, 9a).

## Items

| # | Item | Status | Commit | Note |
|---|---|---|---|---|
| 1 | Leftovers | **Done** | see git log | The cookie bar's "Privacy Notice" opens the notice at its Cookies section (`privacy.html#cookies`; consent check 9). At 320 to 351px wide the starter guide's "See the State Pension reality check" takes two lines (`.pb-btn-long`), and the PIA page's two results tables each scroll inside their own box, which the keyboard can reach (`.pia-stwrap`, named by its caption); no page is wider than a 320px screen (all 29 measured). A follow-up commit: the first version clipped the tables' last column from 352px to about 400px, where on main they ran into the card's padding (and, below 370px, past its border); the box now spans the padding, and below 370px the card and cells have a little less side padding, so from 352px up nothing is clipped, from 390px the page is main's pixel for pixel (370 and 375: anti-aliasing only), and below 352px the tables scroll. The PIA page is now in the render-diff harness (load, sequences, browser-diff); `classify-pia-tablewrap.py` proves the only differences are whitespace and the two captions' new ids. Question 1. |

| 2 | Self-hosted fonts | **Done** | see git log | Inter and the footer wordmark's Schibsted Grotesk 800 are in `assets/fonts/` (the nine woff2 files Google Fonts served on 28 September, byte for byte, with their SIL Open Font License texts); the `@font-face` rules are in the shared FONTS block, with the Inter Fallback metrics kept; each page preloads `inter-latin.woff2`; no page, the two games included, asks Google for anything (build check 29; verify F2). Every page at 375 and 1440 is pixel for pixel main's (62 full-page shots; the games' animation aside). The Privacy Notice never mentioned Google Fonts, so it is unchanged; pack 1.17's note says the fonts are now the site's own. Lighthouse below. |

| 3 | SEO basics | **Done** | see git log | `tools/seo.py` writes each page's block (between `SEO:BEGIN` and `SEO:END` in its `<head>`; `pagebuild.assemble()` calls it, so a rebuild keeps it): the canonical address, the Open Graph and Twitter card tags from the page's own title and description, and its JSON-LD. The 26 pages in the sitemap each get a canonical and og:url at their sitemap address; the five held pages (404, thank-you, how-we-work, the finder, the readiness check) the sharing tags only. Fourteen titles and descriptions over 60 or 155 characters are shortened by taking words out of the approved text (pack 1.20 (1.19 on its branch) lists each, old and new). Seven share cards, 1200x630 (`tools/og-images.py`, `assets/brand/og/`): the home page and the six audience pages, each with the logo, the page's eyebrow and headline word for word, the address and "Regulated by the Central Bank of Ireland"; no figures. JSON-LD: the business on the home page as a FinancialService in the footer's own sentence, address and email (no phone: the site shows none); a two-step BreadcrumbList, Home then the page, everywhere else; the four existing FAQPages kept, one answer (starter's third) brought into line with the words the page now shows. Build check 30 holds all of it (lengths, uniqueness, addresses, pictures, JSON-LD shape, the business against the footer, every FAQ against the page), with four faults it catches. Question 2 and pack 1.20 (1.19 on its branch). |

| 4 | UX-motion audit parts with no decision of Damian's | **Done, in part** | see git log | One commit each, in the audit's order: **3c** in part (the glossary's term index is held over the terms only, no longer over the not-advice note); **4d** (director rules: "Topics to discuss, not advice." and its reason to book before the list); **4e** (my pensions: an added pension rises 6px into place, nothing fades); **14a** (home, "Six places to begin": every explanation always readable at 1440, only the other names soften); **14c** (MOTION rule 5: whole-card links show a shadow, nothing travels; the thank-you tool cards no longer lift their "Illustration only." caveats 3px on hover); **15b** (the glossary's relief ladder fills once, in age order, on arrival); **6b** (starter: no figure counts up any more, the living-standards bars grow once, teal then amber, and "What time does" follows its slider with no in-between values: 195 on one step on main, none now); **15a** in part (the tracker's paperwork gathers on transform, its card's words there from the first frame). Not done: **7** and **12c** (both need part 1b, which waits on D9 and D10); **3d** (the director panel held by its bottom edge hides its top controls from the keyboard unless focus scrolling is rebuilt with it, on a protected calculator: not safe to half-build); **9a** (every slider page, a geometry probe and a 4x CPU drag: larger than the night allowed); 3c's wrapping index and 15a's fan (design calls: question 3). Every other part carries a decision. |

| 5 | Accessibility sweep | **Done** | see git log | All 31 pages at 375 and 1440 (and the home page with the cookie bar up): axe 4.13 (WCAG 2.2 A and AA, and best practice), a keyboard-only Tab walk checking each stop is on screen, uncovered and ringed, the heading outline, and every control's size. Headings: one h1 a page, no level skipped. Names: no control, link or image without one. Fixed, two clear errors: (1) on a short window the calculators' held inputs panel is taller than the screen, so a keyboard user tabbed into controls below it with nothing to bring them up (WCAG 2.4.11): on main at 1280x720, 3 such stops on the pension calculator, 4 on the director calculator, 2 on the comparison; now none on any calculator at 1280x720 or 1440x900 (while focus is in an off-screen control the panel lets go of the window; a pointer is untouched); (2) the home page's product picture had the tab-panel role on a `<figure>` with a caption, which ARIA does not allow: the role is on a wrapper round the shot now. Judgement calls, question 4. |

| 6 | Images | **Done** | see git log | Every `<img>` on the 31 pages at 375 and 1440, in Chrome. All 35 in the markup had width and height, and all but one a WebP beside it. Fixed: Buddy's avatar on the eight calculator pages, 2,000 to 14,000px down, loaded at once: now `loading="lazy"` (and on the home page, the founder portrait, 6,500px down); the Ask Buddy photo the script draws (a 96x96 image, twice a page) now carries its width and height. Left: `buddy-beach.jpg` on the home page has no WebP (one made from the JPEG saves 6KB, 8%, for a second round of compression; one from the original photo would do better, and the original is not in the repository); the avatar is 320px wide where it is drawn at 28 or 78 (9KB; a smaller copy would save about 6KB a page); the hero avatars on the four audience pages stay eager, as they are on the first screen. |

| 7 | Broken links and stale content | **Report** | see git log | No broken link: every internal link and `#anchor` on the 31 pages resolves (verify.py, every gate tonight), and all 18 outside addresses answer 200 with the page they name (fetched 29 September; Revenue's soft 404s checked by title). One outside link redirects: the held how-we-work page's CCPC "money tools" now lands on CCPC's general "Manage your money" page. Stale content, below, is reported, not changed. |

What Google's Rich Results Test would say (checked against Google's
structured-data rules by hand and by check 30; no page was sent to Google):

- FinancialService (a LocalBusiness): valid; "telephone" is recommended
  and absent, as are "openingHoursSpecification", "priceRange" and "geo",
  none of which the site states.
- FAQPage: valid, but since August 2023 Google shows FAQ results only for
  well-known government and health sites, so expect none.
- BreadcrumbList: valid; the pages show no breadcrumb trail, which Google
  allows.
- Every page answers at both `/page` and `/page.html` (and `/` and
  `/index.html`), all 200 from Netlify: the canonical now names one, and
  Search Console will list the others as "Alternate page with proper
  canonical tag", which is expected.

### Stale content, by the date it turns (item 7)

- **1 October 2026 (two days):** PRSI rises to 4.35%. The director
  calculator's assumption line says "up to 52.2% ... 4.2% PRSI), and
  52.35% from 1 October 2026", which will read backwards from Thursday;
  the scripts already switch (pb-prsi.js). The director photo re-shoot
  for 4.35% (Run 32) falls due the same day.
- **6 October 2026, Budget 2027:** seven pages say "Budget 2027 is on 6
  October 2026 and could change them" (director rules, year-end checklist,
  over 50, self-employed, SFT, UK pensions, and the PIA page), and the PIA
  page, the glossary's PIA entry and the starter and director pages'
  PIA lines say "Proposed, as at 25 September 2026, and not yet law".
  docs/PIA-BUDGET-DAY.md lists what changes. The State Pension's
  "€299.30 a week from January 2026" (starter, both State Pension pages)
  may change from January 2027 in the same Budget.
- **31 October and 18 November 2026:** the tax deadlines for the 2025
  tax year on the calculators, the director pages, self-employed and the
  countdown; after 18 November the countdown needs Revenue's 2027 date
  (tests/deadline.test.py fails from 19 November, on purpose).
- **October 2026, the month turns:** "Last reviewed September 2026" on the
  ten review lines, "Rules as at 24 September 2026" on eight guides, and
  the checked-on dates (the comparison's gov.ie rates, 10 September; the
  entitlement check, 11 September; the reality check, 9 September) all
  age by a month.
- **Dated figures that are true as at their date, but will be
  overtaken:** My Future Fund "more than 835,000 people in it on 14
  September 2026" (starter); the Pensions Authority's 40,644 one-member
  arrangements "on 1 September 2026" (director rules); the Pensions
  Council's living standards, "September 2024" (starter, reality check);
  the complaints page's "Last updated: June 2026".

### Lighthouse, item 2 (interleaved, 5 runs a side, median; before = main with Google Fonts over the network)

| Page | Perf | FCP ms | LCP ms | Speed Index ms | CLS |
|---|---|---|---|---|---|
| Home | 98 → 98 | 1683 → 1056 | 1958 → 2330 | 1683 → 1056 | 0 → 0 |
| Directors | 99 → 99 | 1682 → 1057 | 1682 → 2107 | 1682 → 1057 | 0.0004 → 0 |
| Starter | 99 → 99 | 1683 → 1056 | 1683 → 1958 | 1683 → 1056 | 0.0011 → 0.0012 |
| Tracker | 99 → 99 | 1682 → 1060 | 1682 → 2183 | 1682 → 1060 | 0.0029 → 0 |
| Pension calculator | 99 → 98 | 1681 → 1209 | 1742 → 2259 | 1681 → 1209 | 0.0007 → 0 |
| Director calculator | 99 → 99 | 1681 → 1209 | 1681 → 2106 | 1681 → 1209 | 0.0007 → 0 |
| PIA | 99 → 99 | 1680 → 1056 | 1742 → 2256 | 1680 → 1056 | 0.0013 → 0 |

First paint is about 0.6s sooner everywhere. The simulated LCP is 0.3 to 0.5s
later: Lighthouse's simulation counts every request that finishes before
the LCP paint, and the site's own font files (about 73KB on a page) now
finish in time and are counted, where Google's, on another origin, finished
after it and were not, though every reader downloaded them too, behind a
render-blocking stylesheet. With the fonts self-hosted but not preloaded,
LCP is the same and first paint 0.45s later, with the small layout shifts
back (index, directors, tracker, pension calculator), so the preload stays.

## Questions for Damian

1. On the narrowest phones (320 to 351px) the PIA's results tables scroll
   sideways inside their card, so the "A fall" column is partly off the
   screen until scrolled. The other ways: type under the 16px floor below
   352px, or one stacked card per product (the column labels change with the
   growth rate, so that needs a script change). Picked the scroll.
2. The site shows no phone number, so the business data for search
   engines has none, and Google will call that a missing recommended field.
   If there is a public number to show, it goes on the site first, then in
   `tools/seo.py`. Also pack 1.20 (1.19 on its branch): whether a share card must carry the full
   regulatory disclosure (the footer's sentence) rather than "Regulated by
   the Central Bank of Ireland", and the "50" in the over-50 card's
   headline (an age, not a figure). Picked: the short line, as the
   announcement bar has it, and the headline as the page has it.
3. Two motion parts built only in part, where the rest is a design call:
   the glossary's term index showing all 22 terms from 920px (it becomes
   four to five rows, 159px tall at 1440 and 195px at 1024, over the terms
   it indexes; left as one scrolling row), and the tracker's paperwork as a
   fan with the summary card beside it (five papers and the card do not fit
   side by side at 720px without their labels overlapping, less so at 375;
   left as the pile, which now gathers on transform with its card's words
   always shown).
4. Accessibility, left as they are (item 5): the footer's large
   "Pensionbuddy" wordmark measures 1.14:1 (it is the brand name, hidden
   from screen readers and drawn at 7% ink on purpose; WCAG exempts a
   logotype); the announcement bar ("Regulated by the Central Bank of
   Ireland") sits outside any landmark on every page (axe best practice,
   not a WCAG failure: it would go inside the page's banner, a change to
   the shared chrome); the sliders' tap-to-type values are 23px wide
   (11px for a single "0") and the PIA page's two "myfuturefund.ie" links
   20px tall, under 24px in one direction, but with nothing else within
   reach, which WCAG 2.5.8 allows; the PIA threshold field's focus shows
   on its box (a teal border and glow) rather than on the input.

# Run 33 — 2026-09-28 · The cookie bar on a phone: one line and two buttons, the lockup on the first screen

Damian's brief: on phones the cookie bar must not cover the hero's QFA and
regulator line; make it compact (one line and two buttons) and check at
320, 375 and 412 that the lockup is fully visible on first load; gate,
merge, push. Branch `claude/consent-compact` off `main` (`8ea6714`).

The compact bar alone was not enough: the lockup is the last thing in the
hero, so at 320x568 and 375x667 it sat below the first screen whatever the
bar did (it started 691px down on the home page at 320). Put to Damian: on
phones the lockup comes up under the eyebrow, above the headline, and the
bar's words become one line. Both agreed on 28 September.

## Items

| # | Item | Status | Note |
|---|---|---|---|
| 1 | The bar: one line and two buttons | **Done** | "May we use a little analytics? Privacy Notice"; "That's fine" and "No thanks" side by side under it, the same width, 44px tall. 96px tall on a phone, where it was 154. On a wide screen, and on a phone held sideways, one row (73px). |
| 2 | The lockup on the first screen | **Done** | On a phone (560px wide and below) or a phone held sideways (500px tall and below, up to 1000px wide), the home, director, starter and tracker heroes show their lockup under the eyebrow, above the headline. It is a second copy in the markup (`.pb-reg-top`), straight after the eyebrow; each copy is `display:none` where the other shows, so a keyboard and a screen reader meet exactly one, where it is drawn (it holds the register link). The page header's review line on the 10 pages that carry one is drawn under the eyebrow on the same screens; it holds no link, so only the drawing order changes (`:has()`; a browser without it keeps the old order). Desktop is unchanged (pixel for pixel at 1440 on six pages). |
| 3 | Focus clear of the bar | **Done** | While the bar is up, a focused link is scrolled clear of it (`html.pb-consent-open`, the bar's height in `--pb-consent-h` on `<html>`), as the booking and results bars already did. Missing before this run. |
| 4 | The guards | **Done** | The shared FIRSTSCREEN block of CSS (drift-guarded); `tests/build.test.py` check 28 (the approved words; the four heroes: a copy straight after the eyebrow and one last, saying the same; faults for a dropped class, a dropped copy, copies that differ); `tests/consent.test.py` check 9 (real layouts, 14 pages, 5 phone sizes, 2 sideways, and 1200x800: exactly one lockup copy drawn, before the headline on a phone, the line whole on the first screen above the bar, the bar's words, link and buttons) and check 1 (the room kept while the bar is up, gone after an answer). |

## Proof

- At first load, with the bar up, on the 14 pages at 320x568, 375x667,
  375x812, 390x844 and 412x915: before, the line was covered or off the
  first screen on 40 of the 70; after, on none. With 667x375, 844x390,
  915x412 and 768x1024 too, 126 of 126 pass, one lockup drawn on each.
- Faults put in on purpose, each caught by consent check 9 or check 1: the
  top copy never shown; both copies shown; the buttons' 44px floor gone;
  the old wording back; the review line's move gone; the bar's line not
  forced onto its own row (at 540 to 560px the buttons then squeeze to
  67px with their labels on two lines); the room for focus never kept, or
  never given back.
- Desktop at 1440, with the bar declined: the home, director, starter,
  tracker, pension calculator and Standard Fund Threshold pages are pixel
  for pixel main's. Lighthouse against main: equal on the home, director,
  starter, tracker, pension calculator and State Pension entitlement pages.

## The pre-merge review

Three reviewers (layout and accessibility, consent and compliance, tests
and build), each followed by a skeptic: 18 findings, 6 confirmed, all
fixed. The lockup moved by CSS `order` was drawn above the headline but
reached by the keyboard after the hero's buttons (WCAG 2.4.3): now two
copies, one shown at a time. No room was kept for focus behind the bar
(WCAG 2.4.11, from before this run): now kept. Check 9 passed with the line
not drawn at all, and never looked at the buttons or the link: now it
does. The pack still put the review line at the foot of the heading, and
had no 28 September entry: both written. Of the 12 rejected, two were done
anyway because they were cheap and real on a device: phones held sideways
(the bar covered the pension calculator's review line at 915x412) and the
buttons' 44px floor (they were 42 and 44).

## Open

- Compliance: the bar's new wording (pack 1.17, which now says what
  changed, and asks whether one line says enough for the consent to be
  informed), and the lines' new place on a phone (1.14, B.15).
- Rejected in review, noted: the bar's link opens the Privacy Notice at its
  top, not its Cookies section; check 9's heights are the device's screen,
  not the smaller window a phone's browser gives on first load. At 320
  wide the line ends at most 309px down, so it stays above the 96px bar in
  any window 405px tall or more (an iPhone SE's Safari gives about 460).
- Found, not fixed: at 320 the starter guide and the PIA page are wider
  than the screen, so a phone shows them zoomed out (true before this run
  too).

# Run 32 (continued) — 2026-09-28 · UX motion, Step 3: built, reviewed, merged

Damian's brief (26 September): make the site feel premium, every movement
helping someone understand their pension or book a call; research, then an
audit (`docs/UX-MOTION-AUDIT.md`), then build only what he picked, one
commit each, gated, on `claude/ux-motion`. Picked: 1a, 1c, 2a, 2b, 3a, 3b,
decisions "defaults", and three gamification risks: the ticking clock, the
jar spill, the director safe ("neutral reveal, no reward"). On 28
September: accept the Lighthouse point, give the deadline without
JavaScript, iPhone check passed, gate, merge, push.

## Items

| # | Item | Status | Note |
|---|---|---|---|
| 1a | Caveats held still | **Done** | No warning, source, "information, not advice", "as at" date or legal notice, nor anything holding one, is revealed, delayed or moved. One caveat list, `pagebuild.caveat_selector()`; checks 20, 22; `tests/regulator-lines.test.py --caveats`. |
| 1c | Booking's note | **Done** | The not-advice and privacy note stays above the calendar once the form is done (check 21). |
| 2a | The motion system | **Done** | The MOTION block of tokens (three curves, five durations, pairs), byte for byte on every page; rule 2 holds caveats still. |
| 2b | Words never wait | **Done** | The reveal system, the nav's height hop, smooth arrival, the hero chat's play-out and the answers' height animations are gone (check 23). |
| 3a | Ask Buddy, one script | **Done** | `assets/js/pb-buddy.js`, loaded by every page (check 24); about 7.5KB off each page. |
| 3b | Floating chrome gives way | **Done** | Ask Buddy moves only by `translate`, tucks to a 58px photo after the first scroll (no layout shift), slides aside for caveats, fields and a focused control, waits unseen while the analytics choice is open; the booking bar steps down for caveats, the results bar for warning boxes (checks 25; consent check 8; `tests/floating-chrome.test.mjs`). |
| Clock | The deadline in days | **Done** | "52 days", no timer, no pulse; the count again on return to the tab (deadline section 5). |
| Jar | No spill at a full record | **Done** | Check 26. |
| Safe | A still picture | **Done** | Closed, the same for every figure; its driver script gone (check 27); the director photo re-shot. |
| LH | Two requests fewer | **Done** | `pb-motion.js` folded into the head script (`pagebuild.MOTION_HEAD`); Ask Buddy starts after the first frame (`type="text/pb-late"`). |
| JS off | The deadline as a date | **Done** | The calculators' row: "18 November 2026, Revenue's deadline for the 2025 tax year if you pay and file online ...". The chip: "18 Nov 2026, online" ("18 Nov 2026" beside the links from 1440, where more overruns the row), shown only while `<html>` lacks `pb-js`. The home band's clock is the other way round: shown only with `pb-js`, from the first paint, so without JavaScript the band gives its date sentence alone. Deadline sections 2 and 6. |

## The pre-merge review

Two rounds, each of independent reviewers followed by a skeptic per
reviewer trying to refute its findings. The first, six reviewers over the
whole branch (JavaScript off, the floating chrome, compliance and copy, the
tests, calculator integrity and the build, motion and performance): 20
findings, 12 confirmed, all fixed. The second, three reviewers over those
fixes: 16 findings, 9 confirmed, all fixed (the `#spFoot` exclusion had
also caught the entitlement check's own `#spFoot`, which is a caveat, so it
now names the calculator; the 19 November check could never have passed
again, now held to the real clock; the results bar's step-down had no
kept test; and three sentences here were wrong). The ones a reader would
meet: a click on page text focused `<main tabindex="-1">` and sent Ask
Buddy away for the rest of the page (it now counts only a control in the
tab order, focused from the keyboard or typed in); the reality check's
result sentence, `#spFoot`, had been swept into the caveat list and so
un-blurred behind its guess card (now `CAVEAT_NOT`); a keyboard focus in a
stepped-down bar waited 600ms off screen; the home band's clock, hidden in
the markup, grew the band after the first paint; and a page from the
back-forward cache let Ask Buddy slide. The rest were guards that could
pass without testing what they said, now fixed, and the missing kept test
for the floating chrome, now `tests/floating-chrome.test.mjs` (real
frames, a 375px phone, every scroll stop, the tab walk, a click on text, a
focused bar; it fails on the pre-review tree and on each mutant).

## Proof

- Every commit gated in a detached worktree: every suite, the render-diffs
  (the five calculators' figures unchanged throughout), `tools/verify.py`
  0 FAIL.
- Lighthouse mobile, local fonts, 5 interleaved runs a page, the branch
  base (`25dc9f2`) against the merged tree (`c8836d2`), medians: the
  director calculator 99 to 98 (LCP 1.96s to 2.12s) and the pension
  calculator 98 to 98 in that session (99 to 98 in earlier ones: the base
  itself flips between 98 and 99 from session to session), the point Damian
  accepted; the home page, the reality check, starter, booking, the
  glossary and director equal; blocking time 0 (one home-page run 127ms);
  layout shift lower on every page (the calculators 0.007 to 0.001, the
  home page 0.007 to 0).
- Headless Chrome, the branch's scratch probes at 3b: caveats under a
  floating layer at some scroll stop, 41 at 375 and 6 at 1440 before, none
  after; focused controls under Ask Buddy at 375, 71 of 350 before, none
  after (none at 1440 either way). `tests/floating-chrome.test.mjs` now
  keeps the same checks.

## Open

- The consent bar still covers the hero's QFA line on phones until it is
  answered (closed in Run 33).
- 1 October: re-shoot the director photo for PRSI 4.35% (Parked).
- 19 November: move the JavaScript-off deadline words on (Parked).

# Run 32 — 2026-09-27 · Urgent fixes: PRSI with JavaScript off, a flash in the game, the comparison's warning, the regulator line from the first frame

Damian's four urgent items, on `claude/urgent-fixes`, reviewed twice by
independent agents and fixed after each review, merged to main. (Step 3
of the UX motion work, `docs/UX-MOTION-AUDIT.md`, carries on separately
on `claude/ux-motion` and is not merged.)

## Items

| # | Item | Status | Note |
|---|---|---|---|
| 1 | N1: no hard-coded PRSI on `director.html` and the director calculator | **Done** | `assets/js/pb-prsi.js` holds the rates by date, the `pb-deadline.js` pattern; both pages read it. Markup carries the latest rate for JavaScript-off readers: the key 4.35%, "EUR 477 ... 4.35% PRSI (the rate from 1 October 2026)", and "EUR 20,000 as salary is EUR 9,530". Both old scripts formatted 0.0435 as "4.4%"; now "4.35%". Guards: `tests/prsi.test.js` (14, in the runner), `tests/build.test.py` check 17. |
| 2 | Buddy's Run: nothing flashes more than 3 times a second | **Done** | The hit blink (6 a second) is a steady see-through Buddy; the shake and tint no longer freeze behind the game-over and pause cards; the pause keys ignore key repeats (holding one toggled the pause card 15 to 30 times a second). `tests/games.test.py` measures flashes frame by frame (whole canvas, a 6 x 3 grid, Buddy, every label, and pixel by pixel behind both cards) and fails on each of seven mutants. |
| 3 | The comparison's warning in both modes | **Done** | The second mode carries the first mode's box, byte for byte, under its own figures. Check 18 and `tests/render-diff/classify-compare-warning.py`. |
| 4 | The regulator and QFA lines: never faded, every page | **Done** | The page fade is gone from all 29 pages; the hero lockup, the review line, three legal documents and the home page's QFA bio and badge carry no reveal or delay. Check 19 (static) and the new `tests/regulator-lines.test.py` (real Chrome, every frame from the first, all 31 pages; not in the runner). |
| 4a | What the fade had been hiding | **Done** | Lighthouse saw two older layout shifts once the page stopped fading in: the font swap (director 98 -> 94) and the calculators' deadline row. Fixed: a `FONTS` shared block declaring a metric-matched Arial fallback for Inter's own characters (`tools/pagebuild.py` SHARED_CSS), and `pb-deadline.js` loading straight after the row on the three calculators (guarded by `deadline.test.py` and pagebuild). |

## Proof

- Render-diff against main: every calculator loads to the same render,
  scripted sessions 0 differing; the director calculator swept at
  2026-09-16 and 2026-10-02 (201,507 states each, 0 differing; from local
  midnight on 1 October only its key's "4.4%" becomes "4.35%"). Real
  Chrome: the comparison differs only by the added warning (122 of 122
  cells explained); the others are identical.
- Every test suite, `tools/verify.py` (0 FAIL), stamps and sync-chrome
  clean.
- Lighthouse mobile, local fonts, interleaved against main, median of 3:
  no page's performance score is lower (index 97 -> 98, broker 97 -> 98,
  starter 98 -> 99, reality check 98 -> 99, the rest equal), largest
  contentful paint equal or faster. Layout shift is lower on the
  calculators (0.04 -> 0.008) and a little higher on starter (0.003 ->
  0.009) and the glossary (0.007 -> 0.017): with no fade, a heading that
  wraps differently in the fallback now counts. Real readers, fonts held
  back a second: director 0.126 -> 0.0004 and starter 0.091 -> 0.0008.

# Run 31 — 2026-09-26 · The countdown counts to Revenue's online deadline; Run 30's calls answered

Damian's brief: fast mode, the gate, merge and push; branch
`claude/r30-calls` off `main` (`4d2b0a9`). Run 30's open calls, and R30-6,
the countdown.

A note on numbering: the report at the end of Run 30 listed its five calls
in a different order from this file. Damian's R30-2 (the optional-emails
sentence) is this file's R30-3, and his R30-4 ("accepted") is the report's
fourth, the director calculator's age slider stopping at 69, this file's
R30-2. Either reading of R30-4 needs no change: the slider stays at 69,
and the words after 15 October are gone with R30-6.

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| R30-1 | The director calculator's line | "Retiring before your scheme's normal retirement age? Revenue's Pensions Manual, Chapter 9.6:" then the manual's sentence, unchanged. Static markup (`#retNote`); the director picture leaves the line out, so no re-shoot | `27890e0` |
| R30-5 | The PRSA line quotes the whole footnote | "A PRSA (Personal Retirement Savings Account) is normally taken from 60. Revenue's Pensions Manual (Chapter 24.5, footnote 5) says: “Benefits may be taken at any age, if an individual is permanently incapacitated through infirmity from carrying on their occupation (see Chapter 9). In addition, retirement from age 50 may be allowed in the case of employed contributors and of individuals whose occupation is one from which people customarily retire before age 60.”" Copied from the Chapter 24 PDF (last updated May 2025) | `bec600a` |
| R30-2 | The optional-emails passage back on `privacy.html` | restored from Run 30's draft, byte for byte the line that was removed, in its old place under "How we use it". **It is the placeholder**, "[Wording to be confirmed: the optional emails about pension deadlines and rule changes, sent only to people who tick the separate box, and how to stop them]": the only wording in the draft, because the sentence itself is compliance's to approve (pack 3.2 has the proposal). So `verify.py` warns on privacy again (NEEDS-INPUT R20-A2). The Tag Manager passage stays a draft | `62f47e0` |
| R30-6 | The countdown counts to Revenue's online deadline | done, below. Every mention of the 15 October cut-off is gone from the site: the nav chip on all 29 pages, the home page's band, the calculators' row, `assets/js/pb-deadline.js`, and this file's Launch status. `tests/deadline.test.py` rewritten, 228 checks (was 207), eight mutants caught (below) | `9ea7204` |
| — | Compliance pack | question 1.18 (the calculator's new opening, the whole footnote, its two points closed), 1.9 and section 3 (the optional-emails placeholder back), section 7 (the countdown's words, new: the cut-off was never in the pack), Appendix A.10 and B.17 | this commit |

## The countdown now (R30-6)

`assets/js/pb-deadline.js` counts to one date a year: Revenue's online
deadline (`ROS`, 18 November in 2026), or 31 October in a year with no
online date yet. Once it has passed, everything moves on to the next
year's deadline and tax year. 31 October is the second line.

| Where | Today (26 September 2026) |
|---|---|
| Nav chip, every page | days, hours and minutes to the end of 18 November ("53d …"), label "to Revenue's deadline"; a screen reader hears "About 53 days left until 18 November, Revenue's deadline for the 2025 tax year if you pay and file online through the Revenue Online Service. Opens the full explanation." |
| Home page band | eyebrow "Revenue's deadline"; heading "Revenue's deadline is 18 November if you pay and file online."; then "If you do not pay and file online through the Revenue Online Service, it is 31 October. Pay into a pension before your deadline and you can set it against last year's tax bill. Miss it and that year is gone for good."; the clock; "Applies to anyone claiming relief for the 2025 tax year, ..." as before |
| Calculators' "Tax deadline" row | "About 53 days left until 18 November, Revenue's deadline for the 2025 tax year if you pay and file online through the Revenue Online Service. If you do not pay and file online through the Revenue Online Service, it is 31 October. After that, 2025's allowance is gone for good." |

From 1 November the second line reads "... it was 31 October, and that has
passed." From 19 November: 31 October 2027 and the 2026 tax year, with
"If you pay and file online through the Revenue Online Service, it is
usually later, in mid-November." until the 2027 online date is added
(Launch status, Parked). The markup of the band and the chip says what the
script writes today, for a reader without JavaScript; the chip's static
name gives no date ("Countdown to Revenue's deadline for setting a pension
contribution against last year's tax."), so it does not go stale.

Left as they are, because they state Revenue's dates and are not the
countdown: `self-employed-pensions.html`, `director-year-end-checklist.html`
and `director-pension-rules.html` (31 October and 18 November 2026), the
glossary's quiz and Buddy's Run's fact card ("usually have until
mid-November").

## NEEDS DAMIAN INPUT from this run

- **The optional-emails sentence (pack 3.2).** The placeholder is what
  visitors read now; the sentence replaces it once compliance approves.
- **Nothing else new.** Revenue's 2027 online date stays parked (Launch
  status).

## Proof

- **The gate, on a clean checkout of exactly what was committed**, one
  Chrome suite at a time: on `62f47e0` (the three copy commits) and on
  `9ea7204` (the countdown): `tests/run-tests.py` ALL SUITES PASS;
  `build.test.py` 213; `nav.test.py` 470; `providers.test.py` 39;
  `deadline.test.py` 207 then 228; `runner.test.py` 95; `games.test.py`
  157; `lead-forms.test.py` 213; `consent.test.py` 263; `gap-band.py` and
  `check-initialisms.py` pass; `stamp-images.py`, `sync-chrome.py` and
  `sitemap.py` `--check` clean; `verify.py` over 31 pages at 375, 1360
  and 1440: 0 FAIL, and four WARNs: the placeholders on the two held
  pages and, again, on privacy (R20-A2, restored on purpose), and
  glossary's C4. The docs commit changes no page.
- **The new deadline test can fail:** eight mutants, all caught (never
  moving on after the deadline, the online date ignored, 31 October never
  marked passed, a guessed 2027 online date, the heading naming 31 October
  while an online date is known, the band's markup or one page's chip
  still carrying the cut-off, the chip's screen-reader name never
  written). A ninth, the chip's label never written, went unnoticed,
  correctly: the markup already said it, so the write was dead and has
  been taken out, with the eyebrow's.
- **render-diff at load:** all five calculator pages identical, write for
  write (their scripts are untouched; the countdown is not theirs).
- **Looked at:** the home page's chip and band at 1440 as they ship
  today (53 days to 18 November).

---

# Run 30 — 2026-09-26 · Run 29's calls answered: the nav button, after 15 October, directors' ages in the manual's words; the risk card and the privacy placeholders off the site

Damian's brief: branch `claude/r29-calls` off `main` (`3e865bf`), fast
mode, locked rules; the gate before each commit; merge and push `main` at
the end. Seven of Run 29's calls (R29-3 to R29-9), answered, and three
more: hide the comparison's risk card, take the three placeholders off the
Privacy Notice, and put the new director statements in the compliance pack.

Revenue's Pensions Manual was read again on 26 September 2026 (revenue.ie,
Tax and Duty Manuals, Pensions, the chapter PDFs): Chapter 9, "Retirement
before 'normal retirement age'", last reviewed June 2025; Chapter 24,
"Personal Retirement Savings Accounts", last updated May 2025; Chapter 6,
last reviewed August 2026. Every sentence below that quotes it was copied
from those files, not from Run 29's notes.

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| R29-3 | Nav booking button back to an outline | done. Run 29's three `#nav #navLinks .btn-primary` rules are gone from the NAV block (skeleton, then `tools/sync-chrome.py` and `tools/pagebuild.py`, all 29 pages), so PB-AUDIT's outline draws it again: transparent, a 1.5px aqua border, dark teal text, a pale teal wash on hover. It is the same rule set as before Run 29, not a new one: every page's stylesheet still carries PB-AUDIT's `#nav .btn-primary` block. The hero's button is again the only filled aqua button above the fold. `tests/nav.test.py` check 1 now asserts no control in the nav is filled and the booking button is an aqua outline (470 checks, was 441) | `49a169e` |
| R29-4 | After 15 October, count to Revenue's deadline | done. Three stretches a year now, in `assets/js/pb-deadline.js` (the one home for both dates): **to 15 October** everything is as Run 29 left it; **from the end of 15 October until Revenue's deadline for the year has passed** the chip, the home page's band and the calculators' row count to Revenue's deadline, 18 November in 2026 (pay and file online through the Revenue Online Service), and say the cut-off has passed; **after 18 November** everything moves on to 15 October next year and the next tax year. The words, as written, are in the table below. A year with no Revenue Online Service date in `ROS` (2027 today) counts to 31 October after the cut-off, rather than guess at the online date. `tests/deadline.test.py` 207 checks (was 161), part 5 new | `0e3f71f` |
| R29-9 | Pension calculator: retirement never below 50 | done, the same line as the director calculator's (Run 29): the floor is the higher of 50 and the age plus one; it was the age plus one, so an 18-year-old could retire at 19. Render-diff: of 25,924 states at both tax rates, age 49 and over identical (9,543), age 48 and under with retirement 50 or over different only in the slider's `min` and fill (15,389), and the 992 below-50 states the old page allowed now read 50 (`tests/render-diff/classify-pension-floor.js`, new; fails on a floor of 51 and on a changed figure). At load: `min` 41 to 50, fill 73.5% to 64%. The pension picture (home and starter pages) re-shot: the retirement thumb further left, same size, 2184x2691, so the annotation labels' gaps and the `width`/`height` attributes hold | `cdb4e74` |
| R29-5 | Director calculator: retirement slider top 70 | done: 50 to 70 (was 75). **And "Your age now" stops at 69 (was 70)**, which the brief did not ask for: at 70 the floor would be 71, above the new top, and Chrome would then show 71 on a slider that ends at 70 and project nothing. See R30-2. Render-diff (`tests/render-diff/classify-director-bounds.js`, new; the change is in the markup, so the old side is the new html with the old maxima put back and the old script): of 22,001 states, 8,130 are no longer reachable; of the 13,871 that are, nothing differs but the two sliders' fills, at load or after; it fails on a floor of 51 and on a figure changed at 69 and 70. The script itself is unchanged (sweep 1,507 states and 8,000 scripted events, identical). The director picture re-shot: two thumbs further right, same size, 2184x3187 | `2888f1e` |
| R29-6 | Director calculator: the 20% rule | done, a line under the retirement age slider, always shown: "Retiring before 60? Revenue's Pensions Manual, Chapter 9.6: “Generally, where a director with at least 20% interest in a company takes early retirement benefits, the director must sever all links with the business, including the disposal of all shares in the company.”" Static markup, which no script writes (`#retNote`). The manual's rule is about any early retirement, not only before 60: see R30-1. Left out of the director picture, as the pension picture leaves out its State Pension line (`tools/shoot-product.py`) | `2888f1e` |
| R29-7 | One wording for the 20% test | done. The manual's early retirement chapter (9.6) says "a director with at least 20% interest in a company". The site said it in one other place, the over-50s guide ("A director with 20% or more of the company generally has to cut all links with it first, including selling the shares."), which now quotes 9.6 whole: "For a company director, Revenue's Pensions Manual (Chapter 9.6) says: “Generally, where …”". Those two are the only places the site states the test (every page and every page part searched for a 20% beside a director, shares, voting or a company). `tests/build.test.py` check 16 (new) fails any other wording, with three mutants: Run 29's "20% or more of the company", the manual glossary's "more than 20%" (both flagged) and a 20% that is not about directors (left alone) | `cdc6a31` |
| R29-8 | Over-50s guide: PRSA from 50 | done: "A PRSA (Personal Retirement Savings Account) is normally taken from 60. In the words of Revenue's Pensions Manual (Chapter 24.5), “retirement from age 50 may be allowed in the case of employed contributors”." (was "…normally taken from 60, and from 50 if you retire from an employment."). The quote is the first half of footnote 5 to 24.5: R30-5 | `cdc6a31` |
| — | Comparison: the risk card hidden | done: "Choosing your funds, and how much risk" (`#riskCard`, the three risk tiles) and the assumption that said "All six figures are placeholders awaiting confirmation…" (now `li#riskAssume`) both carry `hidden`, with a comment in `tools/compare-parts/main.html` saying why and how to restore, and one CSS rule (`#riskCard[hidden],#riskAssume[hidden]{display:none}`) so nothing overrides the attribute. Nothing else on the page mentions the card. The script still fills the tiles, so it is unchanged: render-diff, load and axes, identical. The home page's picture of the comparison already left the card out. **To restore:** delete `hidden` from `<div class="chart-card reveal" id="riskCard" …>` and from `<li id="riskAssume" hidden>` in `tools/compare-parts/main.html`, then `python3 tools/pagebuild.py compare` | `cbbfa30` |
| — | Privacy: the three "[to be confirmed]" passages | done: R20-1b (the finder, a list item under "What we collect"), R20-A2 (the optional emails, a list item under "How we use it") and R27-GTM (the last sentence of the cookies section's second paragraph) are off `privacy.html`, each whole; nothing around them changed. Kept word for word under "Drafts" below. `verify.py`'s NEEDS-INPUT warning on privacy is gone. **What the notice now leaves out** is R30-3 | `0d93b80` |
| — | Compliance pack | done: question 1.18 (new), the three director statements with their sources and two points for compliance; section 7 and Appendix A.10 (the over-50s text) and B.17 (new, the calculator's line); section 3 and questions 1.9 and 1.17 now say the privacy placeholders are off the site and the notice is silent on those subjects | this commit |

## The countdown, stretch by stretch (R29-4)

| When (the reader's clock) | Chip | Band: eyebrow, then heading | Calculators' row |
|---|---|---|---|
| Up to the end of 15 October | "20d 11h 59m", "to book by 15 October" | "Damian's cut-off"; "Book by 15 October so we have time to process before the Revenue deadline." | as in Run 29 |
| 16 to 31 October | days to the end of 18 November ("34d 00h 59m" a second after the cut-off), "to Revenue's deadline" | "Revenue's deadline"; "Our 15 October cut-off has passed. Revenue's deadline is 18 November if you pay and file online." | a second after the cut-off: "Our 15 October cut-off has passed. About 34 days left until 18 November, Revenue's deadline for the 2025 tax year if you pay and file online through the Revenue Online Service. If you do not pay and file online, it is 31 October. After that, 2025's allowance is gone for good." |
| 1 to 18 November | the same | the same | the same, without "If you do not…" |
| From 19 November | to 15 October next year, "to book by 15 October" | as in the first row, for the 2026 tax year | as in the first row, for 2026 |

The band's paragraph keeps "Revenue's own deadline is 31 October, or 18
November if you pay and file online through the Revenue Online Service."
until 31 October, then "…is 18 November if you pay and file online
through the Revenue Online Service (the 31 October date has passed)."
The chip's name for a screen reader and the band's hidden line say the
same as the row. The clocks go back on 25 October, so a count from 16
October has an hour more in it than the calendar suggests ("34d 00h 59m"
a second after the cut-off); that is right, and the test pins it.

## Drafts: the three privacy passages, as they were on the site

Taken off `privacy.html` in Run 30, word for word. The wording the pack
proposes for each is in `docs/COMPLIANCE-PACK.md` section 3.

- Under "What we collect", a list item (R20-1b): "[Wording to be
  confirmed: what the old pension finder asks for (employers and years,
  names used, date of birth, address, email, phone) and the signed Letter
  of Authority; why we hold them, that we share them only with the
  providers and trustees named, and how long we keep them]"
- Under "How we use it", a list item (R20-A2): "[Wording to be confirmed:
  the optional emails about pension deadlines and rule changes, sent only
  to people who tick the separate box, and how to stop them]"
- In "Cookies", the last sentence of the second paragraph, after "…it is
  never loaded." (R27-GTM): "[To be confirmed: which analytics tools
  Google Tag Manager runs for us, the cookies they set, how long they last,
  and where Google processes the data]"

Each was a `<span class="needs-input" data-issue="…">` (the two list items
each a whole `<li>`). When compliance approves a sentence, it goes where
its placeholder was.

## NEEDS DAMIAN INPUT from this run

- **R30-1 "Retiring before 60?"** The calculator's line opens with the
  brief's words. The manual's rule (9.6) is about taking early retirement
  benefits, that is, before the scheme's normal retirement age, which for
  these directors must be between 60 and 70 (6.7). So a director retiring
  at 62 from a scheme whose normal retirement age is 65 is caught too, and
  the line does not say so. "Retiring before your scheme's normal
  retirement age?" would cover it. One word change in
  `director-calculator.html` (`#retNote`) and the pack.
- **R30-2 "Your age now" on the director calculator stops at 69.** Forced
  by R29-5's top of 70 (see the table). If a 70-year-old director should
  still be able to use it, the retirement slider needs to reach 71, or the
  page needs a sentence for a reader already at the top.
- **R30-3 The Privacy Notice is now silent on two live things.** The box
  to receive occasional emails is on every form, and the notice no longer
  mentions those emails at all; and Tag Manager (after "That's fine") runs
  tools the notice does not name. Both were placeholders because the
  sentences need compliance's approval (pack section 3, questions 1.9 and
  1.17). Until then the notice is quieter, not wrong about anything it
  says, but these two sentences are the ones to get approved first.
- **R30-4 After 15 October.** The words in the table are mine, built from
  Revenue's dates and nothing else; say if you want them changed. Two
  things carried over: a reader without JavaScript still sees "Book by 15
  October" after it has passed (the markup is written for the first
  stretch, as it always was), and next year's online date must be added to
  `ROS` in `assets/js/pb-deadline.js` when Revenue publishes it, or after
  15 October 2027 the count runs to 31 October and moves on to 2028 on 1
  November, while the online date may still be open.
- **R30-5 The PRSA line quotes half the footnote.** Footnote 5 to 24.5
  goes on: "and of individuals whose occupation is one from which people
  customarily retire before age 60". Not on the page; say if it should be.

## Proof

- **The gate, on a clean checkout of exactly what was committed** (a
  detached worktree per commit, one Chrome suite at a time). Full gate on
  `49a169e`, `0e3f71f`, `cdb4e74` and `0d93b80` (the last code commit,
  which holds every change): `tests/run-tests.py` ALL SUITES PASS;
  `build.test.py` 208, then 213 from `cdc6a31` (check 16); `nav.test.py`
  470; `providers.test.py` 39; `deadline.test.py` 161, then 207;
  `runner.test.py` 95; `games.test.py` 157; `lead-forms.test.py` 213;
  `consent.test.py` 263; `gap-band.py` and `check-initialisms.py` pass;
  `stamp-images.py`, `sync-chrome.py` and `sitemap.py` `--check` clean;
  `verify.py` over 31 pages at 375, 1360 and 1440: 0 FAIL every time, and
  `main`'s four WARNs until `0d93b80`, after which three (the placeholders
  on the two held pages, find-my-pension and how-we-work, and glossary's
  C4). The quick gate (the runner, `build.test.py`, the three checks, and
  `verify.py` on the pages the commit touched) on `2888f1e`, `cdc6a31` and
  `cbbfa30`: pass.
- **Not as Run 29 did it, said plainly:** the first commit went in before
  its gate, which then failed one step, `sitemap.py --check` (I had not
  rewritten the sitemap, so 24 lastmod dates were a day old); it was
  amended with the rewritten sitemap before anything else was committed,
  and the amended tree passes. Commits `cdb4e74` to `0d93b80` were made
  while their gates ran; every gate passed before the merge.
- **Each new test shown able to fail:** the nav test on a page with the
  filled button back (caught); the deadline test on six mutants, all
  caught (no after-cut-off stretch, the online date ignored, 31 October
  never marked passed, the eyebrow or the chip's label never changing, a
  guessed 2027 online date); check 16 on its three in-memory mutants;
  both new render-diff classifiers on a floor of 51 and on a changed
  figure.
- **render-diff**, each against the commit before: at load, only the
  pension calculator differs, in the two cells R29-9 moves; the director
  calculator, the comparison and both State Pension pages load to the same
  render write for write. The two classifiers as in the items table. The
  director script is unchanged (axes and corners 1,507 states, 8,000
  scripted events: identical), and so is the comparison's (axes and
  corners, 150,576 states: identical).
- **Looked at:** the director calculator at 1440 and 375 with its new line,
  the nav's outline button at 1440, the over-50s guide at 1440, the home
  page's band with the clock pinned to a second after the cut-off at 1440,
  and both calculator pictures old against new (only the thumbs move).

---

# Run 29 — 2026-09-25 · Nav, provider ticker, the 15 October cut-off, clickable things, directors' ages, Poolbeg

Damian's brief: branch `claude/nav-providers-fixes` off `main`, fast mode,
locked rules; the gate before each commit; merge and push `main` at the
end. Seven items. The branch was cut from `6e556ec`; Run 28 landed on
`main` (`fbd5b6f`) while it was open, so the work was moved onto it before
the first commit and this run is 29.

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| 1 | Hide "Out of office" | done: the one section of that name, the photo strip on `index.html` ("Off duty" / "Out of office.", eight photos and their clones). Hidden, not deleted: the `<section class="snaps">` carries `hidden`, a comment above it says why and how to restore, and one CSS rule (`.snaps[hidden]{display:none}`) makes sure nothing overrides the attribute. **To restore: delete the word `hidden` from `<section class="snaps" hidden>` in `index.html`.** Nothing else changes; the eight photos stay in `assets/img/` and lazy-load, so while hidden they are never fetched | `a724d6d` |
| 2 | Nav: bigger, and every page reachable | done. **The row**: Find a pension, Start a pension, then four dropdowns, Directors, Tools, State Pension, Guides, then "Book a call with Damian for free". Items are 17px at weight 600 (were 14.4px at 500), dark ink, a teal underline on hover and on the current page or section, a chevron on each dropdown. **Every page a reader can reach is in the nav**, 19 of them (list below); "About" is now "About Pensionbuddy", the last line of Guides, under a rule, because the row had no room for it. The three held pages stay out, and `tests/nav.test.py` fails if one appears. **The button** is now the one filled control in the nav, aqua with dark text. It was an outline since the PB-AUDIT pass (von Restorff: one filled aqua button per screen, the hero's); the brief says it is the filled one, so it is, and on pages whose hero has a filled button there are now two above the fold. Deleting the three `#nav #navLinks .btn-primary` rules in the NAV block puts the outline back. **Widths**, measured in Chrome: at 17px the row needs 1,228px, 1,365px with the deadline chip, and the content column gives it 1,092, so the header now has its own container up to 1,440px wide (the logo and button sit nearer the window's edges than the page text does). The row runs from 1301px, the chip joins it from 1440px, and at 1300px and below the nav is the drawer (was 1200px): the logo, the chip (from 561px) and the menu button, with the dropdowns opening in place as lists, the drawer scrolling if it is taller than the screen. No sideways scroll at 375, 768, 1200, 1300, 1301, 1360, 1440 or 1920. **How the dropdowns work**: each is a button (`aria-expanded`, `aria-controls`) and the list of ordinary links it opens, the disclosure pattern, so a screen reader hears "Directors, collapsed, button" and then a list. Click, tap, Enter or Space opens and closes; opening one closes the others; with a mouse on the row, hovering opens and leaving closes after a moment, and a click on a hovered panel keeps it open; Escape closes and returns focus to the button (in the drawer, a second Escape closes the drawer); ArrowDown and ArrowUp move through a panel; Tab out of a panel, a click outside, or the header hiding on scroll closes it. Without JavaScript a panel opens on hover and on keyboard focus. Focus rings: 3px teal on every item and link | `242645d` |
| 3 | Provider ticker, built and switched off | done, **off**. `assets/js/pb-providers.js` is the one file to edit: `ON` (false), `LABEL` ("Providers we hold agencies with") and `PROVIDERS` (Zurich, Irish Life, Aviva, New Ireland, Royal London, Standard Life, each `logo: null`, which draws a box with the name in text; no logo files anywhere). With `ON` false the script returns before doing anything, and the home page's mount, `<div data-pb-providers hidden>` under the hero, stays empty and hidden: nothing shows on the live site. Switched on, it builds a strip under the label: the boxes scroll right to left in a loop, faded at both edges, pausing on hover; a small Pause button stops it for keyboard and touch users (moving content needs a way to stop it, WCAG 2.2.2); with reduced motion it is a still, centred, wrapped row with no button. Screen readers get one list of the six names; the copies that make the loop seamless are hidden from them. The label is "Providers we hold agencies with", nowhere "partners" or "we work with". **To switch on:** set `var ON = true;` in that file, after R29-1 and R29-2 below. `tests/providers.test.py` (new, 39 checks, two Chrome launches): off as shipped, and switched on in the served bytes only (label, order, boxes, fades, motion, Pause and Play, hover, reduced motion, no overflow at 375 and 1440px); nine mutants caught | `855e1d0` |
| 4 | The 15 October cut-off | done. The chip, the home page's band and the calculators' row all count to the end of 15 October and say "Book by 15 October so we have time to process before the Revenue deadline."; Revenue's own deadline is stated beside it wherever the cut-off is: **31 October, or 18 November if you pay and file online through the Revenue Online Service** (revenue.ie, "Filing your tax return", published 19 March 2026: "The Pay and File deadline for the 2025 Income Tax Return (Form 11) is Saturday 31 October 2026 ... Wednesday 18 November 2026" on ROS; Revenue eBrief No. 034/26). The dates carry no year, like the cut-off, beside the tax year they are for (2025), because `verify.py` warns (E1) when the band shows two years. After 15 October everything moves on to the next year's cut-off and tax year, as the old countdown did after 31 October (R29-4). Every place changed is listed below. `tests/deadline.test.py` (new, 161 checks, one Chrome launch with the clock pinned): every page, the band's words with and without JavaScript, the three calculators' rows, an hour before the cut-off, a second after it; seven mutants caught | `f2d6cf6` |
| 5 | Clickable looks clickable | done. Audited first, in headless Chrome: every link, button, summary, label and control on all 31 pages at 1440 and 375px, 1,357 of them, for an underline or arrow, the pointer cursor, what a hover rule changes, and the focus ring when focused. **Already true, unchanged**: every link and button shows the pointer; every one has a visible focus ring (outline or a 3-4px teal ring); every button is filled or outlined (the segmented controls sit in a bordered track); the cards that are links already lift on hover (the home page's fork cards and product picture, the glossary's game cards); no card that is not a link lifts. **Changed**, in one `CLICK` block of CSS, byte for byte the same on all 29 pages, copied and guarded like the NAV block (`click-css`): (1) links in running text, 48 of them on 11 pages (the glossary's index, the checklists' and guides' links, the calculators' glossary references) and the four card titles on the directors' page, were coloured text only: underlined, thicker on hover; (2) the footer's links on every page were plain text: a faint underline, teal on hover; (3) the six big names under "Six places to begin" on the home page gave no sign they were links until hovered: a teal arrow after each, which moves on hover; (4) the three cards on the thank-you page did nothing on hover: they lift, with a shadow and a teal border; (5) the unchosen option in a segmented control did nothing on hover: a pale teal tint. After it, the same audit finds nothing left (the six home page names count as bare to it only because it cannot see an arrow drawn by CSS). No product picture shows a link the block changes | `3701e2e` |
| 6 | Directors: the ages, against Revenue's Pensions Manual | checked; **one clear error, fixed**: the director calculator's retirement-age slider is `min="50"` in the markup, but its script replaced that with the reader's age plus one on every change, so a 25-year-old director could retire at 26 and the default reader (48) at 49. Before 50, benefits are paid only on ill health (Manual 9.1, 9.2). The floor is now the higher of 50 and the age plus one. Everything else the director pages, the calculator and the glossary say about ages is right, or says nothing (the director pages and the glossary give no age for taking benefits at all). Five things need your call, listed below with the manual's words. **Render-diff** against the commit before: at load two cells differ, both the slider (`min` 49 to 50, its fill 65.4% to 64%); across 22,301 states every state with the age at 49 or over is identical (10,175), every state at 48 or under with retirement at 50 or over differs in the slider's `min` and fill and nowhere else (11,826: no figure moves), and the 300 states with retirement below 50, which the old page allowed, now read 50 (`tests/render-diff/classify-director-floor.js`, which fails on a floor of 51 and on a changed figure). The director picture on the home and directors' pages was re-shot: the retirement thumb sits 1.4% further left, same size, 2184x3187 | `0a80a55` |
| 7 | Buddy's Run: the Poolbeg chimneys | done. The two towers on the far shore were cream with two thin red stripes near the top. Now they are the Poolbeg stacks: a grey concrete base (with a darker shaded side), then red and white bands the rest of the way up, red at the top and at the bottom, an odd number of whole bands of about 6px (nine each) so none ends in a sliver, each band shaded on its right so the stack reads round. Drawn in `chimney()` only: the same place, heights (62 and 54px), footprint and parallax as before, and nothing in the game reads it, so play is unchanged. `tests/games.test.py` passes, 157 checks as before | `43ec100` |


## NEEDS DAMIAN INPUT from this run

- **R29-1 Each provider's written permission** before the ticker is
  switched on: Zurich, Irish Life, Aviva, New Ireland, Royal London,
  Standard Life. Permission to show the name as well as the logo; and the
  logo files themselves, from each provider, once it is given.
- **R29-2 The agencies match How we work.** `how-we-work.html` (held) lists
  "The product providers we hold agencies with" as a placeholder (R20-9c),
  so there is nothing yet to check the six names against. The ticker's list
  and that sentence should name the same providers before either goes live.
- **R29-3 The nav button is filled.** The brief called it the one filled
  button, so it is; since the PB-AUDIT pass it had been an outline, so that
  only the hero's call to action was filled. Pages whose hero has a filled
  button (home, directors, starter, tracker) now show two above the fold.
  Deleting the three `#nav #navLinks .btn-primary` rules in the NAV block
  (skeleton, then `tools/sync-chrome.py` and `tools/pagebuild.py`) puts the
  outline back.
- **R29-4 After 15 October.** From 16 October the chip, the band and the
  calculators' row count to 15 October 2027 and the 2026 tax year, while
  Revenue's own deadline for 2025 (31 October, 18 November online) is still
  open. That is how the old countdown behaved after 31 October. If you
  would rather they count to Revenue's deadline between your cut-off and
  Revenue's, that is a change to `assets/js/pb-deadline.js` and some words.
- **R29-5 to R29-9, directors' ages**: the five calls listed under item 6
  (the slider's top, a line about 50 to 59, "20% or more" or "more than
  20%", "may be allowed" for a PRSA from 50, and the same floor bug on the
  pension calculator).
- **Not a question, a note**: "About" moved from the row into the Guides
  menu as "About Pensionbuddy"; the header now runs wider than the page's
  text column at wide screens. Both were forced by the width of 17px items.

## Proof

- The gate before each of the seven commits, each run on a clean checkout
  of exactly what was committed (the working tree already held the next
  item): `tests/run-tests.py` ALL SUITES PASS; `build.test.py` 202 on
  `main`, then 206, then 208; `nav.test.py` 441, `providers.test.py` 39 and
  `deadline.test.py` 161 (new); `runner.test.py` 95, `games.test.py` 157,
  `lead-forms.test.py` 213, `consent.test.py` 263, `gap-band.py` and
  `check-initialisms.py` pass; `stamp-images.py --check` and
  `sync-chrome.py --check` clean; `verify.py` over 31 pages at 375, 1360 and
  1440: 0 FAIL every time, and the same four WARNs as `main` (the
  placeholders on find-my-pension, how-we-work and privacy, and glossary's
  C4).
- Each new test was shown able to fail: nav 12 mutants, ticker 9, deadline
  7; the director classifier on a floor of 51 and on a changed figure.
- render-diff against the branch's base (`fbd5b6f`): the pension
  calculator, the comparison, and both State Pension pages load to the same
  render write for write; the pension calculator's axes and corners (6,550
  states) and the comparison's axes (45,600) differ nowhere. Only the
  director calculator differs, as item 6 says.
- Looked at: the nav at 1440 (two menus open), 1301, 1200 and 375 (the
  drawer with a menu open); the ticker switched on at 1440 and 375; the
  band and the calculators' row; the offer arrows and the footer; the
  chimneys before and after.

## The nav, as built (item 2)

| Dropdown | Links, in order |
|---|---|
| Directors | Pensions for company directors (`director.html`) · Director calculator · What changed for directors in 2026 (`director-pension-rules.html`) · Year-end pension checklist (`director-year-end-checklist.html`) |
| Tools | Pension calculator · Pension charges calculator · Auto-enrolment comparison · All your pensions in one view (`my-pensions.html`) · The Standard Fund Threshold |
| State Pension | State Pension reality check · State Pension entitlement check |
| Guides | The old pension hunt: a checklist · Pensions after 50 · Pensions when you are self-employed · A UK pension, and living in Ireland · Personal Investment Account (PIA) · Pension jargon buster · About Pensionbuddy (`index.html#story`) |

The labels are the pages' own titles or footer names, shortened where a
title is a sentence. Each page is in the nav once, so the director
calculator is under Directors, not Tools. Four pages were reachable from
no menu or footer before: the directors' rules, the year-end checklist,
the old pension checklist and the Standard Fund Threshold.

How it is kept one nav: the markup is the skeleton's
(`pension-calculator.html`) as before, and its styling is now one block,
`/* NAV:BEGIN */` to `/* NAV:END */`, last in every page's stylesheet in
place of the old Calculators menu block, byte for byte the same on all 29
pages. `tools/sync-chrome.py` copies it with the nav, `pagebuild.chrome_drift()`
fails a page whose copy differs (kind `nav-css`), and every rule in it is
scoped by id, so none of the five older layers of nav CSS can reach in.
`assets/js/pb-navmenu.js` drives the dropdowns; it builds nothing. Every
built page in the nav now marks itself current (`nav=` in `PAGES`), and
`assemble()` no longer looks for the label "Calculator".

Tests: `tests/nav.test.py` (new, 441 checks, one Chrome launch, about 5 s):
every root page at 1440px (one nav, inside the window, 17px at 600, four
collapsed buttons each controlling the list after it, the booking button
the one filled control, the page's own link current once and its dropdown
underlined), every reachable page in every page's nav and no held page,
the keyboard and pointer behaviour above, the no-JavaScript fallback, the
drawer at 1200 and 375px on three pages, and the row at 1301px. Twelve
mutants, each caught (Escape doing nothing, a hovered panel closing on
click, no hover grace, two panels open at once, no no-JavaScript fallback,
the drawer breakpoint lowered, a drawer panel floating, a held page linked,
a guide dropped from one page's nav, the button outlined again, 14.4px
items, the row too wide at 1301px); the first run missed two, and the test
was tightened until it caught them. `tests/build.test.py` 206 (was 202 on
`main`: the nav targets are now nineteen, and a new check that none is
held; three new mutants, a relabelled dropdown and the NAV block changed
or missing).

## Every place the deadline changed (item 4)

- **`assets/js/pb-deadline.js`** (new): the one home for both dates. The
  cut-off (`CUTOFF`, 15 October) and Revenue's online date by year (`ROS`,
  `{2026: '18 November'}`; a year with no entry says "mid-November") are
  written once. It replaces the two scripts every page carried inline: the
  countdown for the chip and the band (29 copies, 28 identical and one on
  `index.html` that also set the tax year) and the calculators' row (12
  copies). Every root page loads it once, at the foot of `<body>`.
- **The nav chip, on every page** (the skeleton's nav, synced): counts to
  23:59:59 on 15 October, "20d 11h 59m"; its name for a screen reader is
  "About 20 days left to book by 15 October, so we have time to process your
  contribution before the Revenue deadline for the 2025 tax year. Opens the
  full explanation."; its hidden label says "to book by 15 October". It
  still links to the band.
- **The home page's band (`index.html#deadline`)**: the eyebrow "Damian's
  cut-off" (was "Revenue deadline"); the heading "Book by 15 October so we
  have time to process before the Revenue deadline." (was "Contributions for
  the 2025 tax year close on 31 October."); the paragraph "Revenue's own
  deadline is 31 October, or 18 November if you pay and file online through
  the Revenue Online Service. Pay into a pension before it and you can set it
  against last year's tax bill. Miss it and that year is gone for good."
  (was "... If you file your return online, you usually have until
  mid-November."); the clock to 15 October; the screen reader's sentence
  adds Revenue's deadline. The markup says the same as the script writes.
- **The calculators' "Tax deadline" row** (`pension-calculator.html`,
  `director-calculator.html`, `broker-vs-autoenrolment.html`): "About 20
  days left to book by 15 October, so we have time to process before the
  Revenue deadline. Revenue's deadline for a contribution against your 2025
  tax bill is 31 October, or 18 November if you pay and file online through
  the Revenue Online Service. After that, 2025's allowance is gone for
  good." (was a count of days to 31 October and "mid-November if you file
  online").

Checked and left as they are, because they state Revenue's deadline
correctly and are not the countdown: `self-employed-pensions.html` and
`director-year-end-checklist.html` (31 October 2026, 18 November 2026
through the Revenue Online Service), `director-pension-rules.html` ("The
October window", the same dates), the glossary's quiz bank ("Pay and File
deadline (31 October)", online filers "usually get until the middle of
November"), and Buddy's Run's fact card ("usually have until mid-November",
which cites the home page's band; still true).

## Directors' ages: the rules, and what needs your call (item 6)

Revenue's Pensions Manual, read 25 September 2026 (revenue.ie, Tax and Duty
Manuals, Pensions):

- **Normal retirement age**, Chapter 6.7 (last reviewed August 2026): the
  scheme's rules set it "between 60 and 70 years"; Revenue can accept
  another age for some occupations, "but 20% directors must be within the
  60-70 years age range".
- **Early retirement**, Chapter 9.1 (June 2025): benefits "may be provided
  on or after the employee reaches 50 years of age", on leaving the
  employment. Chapter 9.6: a director "with at least 20% interest" who takes
  early retirement benefits "must sever all links with the business,
  including the disposal of all shares in the company". Ill health, 9.2: at
  any age.
- **Personal Retirement Savings Account (PRSA)**, Chapter 24.5 (May 2025):
  "Benefits may be taken when the individual reaches age 60 years"; its
  footnote: "retirement from age 50 may be allowed in the case of employed
  contributors" (and occupations that customarily retire before 60). A PRSA
  is deemed to vest at 75 (24.5, 24.14).

What the site says, checked: `pensions-over-50.html` (from 50 on leaving the
job, with the scheme's and trustees' agreement; a 20% director cuts all
links first, including selling the shares; a PRSA normally from 60, from
50 on retiring from an employment; a personal pension from 60) is right.
`pia.html`'s "normally from 60, and from 50 in some cases" is right as a
summary. The directors' rules page's "A move to a PRSA is not allowed after
the scheme's normal retirement age" matches Chapter 13, paragraph 2.1. The director pages and the glossary give no age for
taking benefits.

**R29-5 to R29-9, for your call** (nothing changed):

- **R29-5 The top of the director calculator's retirement slider: 75 or
  70?** A company scheme's normal retirement age is at most 70 (6.7), and a
  deferred pension from a job left starts by 70 (Chapter 12); but a PRSA the
  company pays into vests at 75, and the manual's own example (8.7) has a
  20% director retiring at 73. The page does not say which kind of pension
  it models. Now 50 to 75.
- **R29-6 Say something about 50 to 59?** The slider allows it, and nothing
  on the calculator mentions the condition. A line under the slider that
  keeps to the manual: "Before the scheme's normal retirement age, a
  director with 20% or more of the company generally has to cut all links
  with it, including selling the shares." Not added: new copy.
- **R29-7 "20% or more" or "more than 20%"?** The site (and Chapter 9.6)
  say at least 20%; the manual's glossary (Appendix I, December 2024)
  defines a 20% director as one who "owned or controlled more than 20% of
  the voting rights" in the last three years. The manual disagrees with
  itself; one wording should be picked.
- **R29-8 PRSA from 50.** The over-50s guide says "from 50 if you retire
  from an employment"; the manual says it "may be allowed" for employed
  contributors. "can be taken from 50" would match it more closely.
- **R29-9 The pension calculator has the same bug.** `pension-calculator.html`
  replaces its retirement slider's `min="50"` with the age plus one, so an
  18-year-old can retire at 19. The fix is the same line; it moves that
  slider's fill at the default (age 40: 41 to 50) and so the home page's
  pension picture needs a re-shoot. Outside this brief, so left.
---

# Run 28 — 2026-09-25 · Tidy-up before launch

Damian's brief, fast mode, locked rules: first merge
`claude/reshoot-product-rasters` into `main`; then branch `claude/tidy-up`
off `main` for the sitemap, the forms' success messages, the contact
address, a stale check of the live pages and a launch status at the top of
this file; gate before commit; merge and push `main`.

## Items

| # | Item | Result |
|---|---|---|
| 0 | The re-shot pictures | merged: `main` (Run 27, `5174f45`) merged into the branch with no conflicts. Run 27 changed the calculators only outside what the pictures show, and a re-shoot on the merged tree was pixel-identical to the branch's five pictures, so they stand. The arrow labels still cover no text at 1024 and 1440 on the home and starter pages. Gate green (below), merged to `main` as `6e556ec`, pushed; its worktree removed |
| 1 | Sitemap | the list was already right: exactly the 26 live, indexable pages, no held page, 404 or thank-you. 25 of the 26 lastmod dates were stale (as old as 9 July); each is now the date of the file's last commit, all 25 September 2026 except `games/jargon-battle.html`, 22 September. **`about.html` not added**: there is no such page (folded into `index.html#story` in Run 4; `verify.py`'s F5 fails the site if it comes back), so an entry would list a 404. New `tools/sitemap.py` rewrites the file (and `--check`s it) from the pages themselves; `verify.py`'s sitemap rows now come from it (the old "exists but is not in sitemap.xml" loop checked nothing); `tests/build.test.py` 15 guards the list, with three mutants |
| 2 | Success messages | every form's success message is now "Thanks - we've got it. Damian will be in touch personally.", shown only after a real success: the pension and director calculators' "Email my results" (was "Thanks. Your figures are on the way."), the director, starter and tracker guide forms (was "Thanks. The guide is on its way."), and the held finder (was "…and the search has started."), in the page's HTML and in its script. "If nothing arrives in a few minutes, check your spam folder." is gone from those five forms and from `thank-you.html`, and so is the sentence after it on the five forms, "Delivery depends on email providers outside our control.", which was about an email to the visitor. Kept: the thank-you page's "Calendly emails you the details and a reminder before the call." (Calendly sends it by itself), the booking form's "Thanks, [name]. Pick a time below…" (a step, not a promise), and every "Your email app should have opened…" line. Left alone: the readiness check's "On the way" score band and "tax on the way out". Pack section 7 updated. Closes R27-2 |
| 3 | Contact details | `hello@pensionbuddy.ie` is the only address we give: the Privacy Notice, Terms and Complaints pages (link and text on each) and the email fallback of all 15 pages with a form or the shared calculator script (`LEAD_FALLBACK_ADDRESS`). **The footer had no address at all**; it is now in the Company column on all 29 pages (added once in the skeleton, carried by `sync-chrome.py` and `pagebuild.py`). The three "A4: email address awaiting confirmation" comments are gone. Other addresses on the site: `info@fspo.ie`, the Financial Services and Pensions Ombudsman, on the complaints page; `you@example.com`, the booking form's input hint. Closes A4 |
| 4 | Stale check, live pages | 1,017 internal links and 15 external links, 0 broken (external fetched with a browser user agent, titles read for soft 404s); no live page links to a held one. No TODO, FIXME, lorem, `CALENDLY_URL` or test data. Needing Damian, all visible to visitors: the three `privacy.html` placeholders (R20-A2, R27-GTM, R20-1b) and the comparison's "All six figures are placeholders…" (R1, R2). Fixed: the A4 comments. Left: `booking.html`'s `DEVELOPER NOTE` comment (it is the Calendly redirect instructions, invisible, and still needed) |
| 5 | Launch status | the section above |

## Proof

On the branch before commit, one suite at a time: `tests/run-tests.py`
ALL SUITES PASS; `build.test.py` 202 (15 is new), `lead-forms.test.py` 213,
`consent.test.py` 263, `games.test.py` 157, `runner.test.py` 95,
`gap-band.py` all pass; `tools/sitemap.py --check`, `stamp-images.py
--check`, `sync-chrome.py --check` and `check-initialisms.py` clean;
`verify.py` on every page at 375, 1360 and 1440: 0 FAIL, every site-level
row passing, and the WARNs as on `main` (the placeholders above and
glossary's C4). `lead-forms.test.py` had asserted a success by the word
"Thanks." and failed on the new wording (6 forms); it now pins the message
word for word and fails any success message that promises a delivery.

Run alongside each other, the Chrome suites fail at random (the runner test
failed 2 or 3 checks that pass alone, and `verify.py` once lost the font
service): run them one at a time.

---

# Run 27 — 2026-09-25 · Launch gaps: the forms, the liability clause, analytics after consent

Damian's brief: branch `claude/launch-gaps` off `main` (`faf4c0e`), fast
mode, locked rules; the gate before each commit; merge and push `main` at
the end. While it was open, two other sessions merged Runs 25 and 26 into
`main` and pushed it (`d6ff3dc`), so this run was merged with them at the
end and numbered 27, and its pack questions became 1.15 to 1.17. The gate
each time: `tests/run-tests.py`, `tests/build.test.py`,
`tests/runner.test.py`, `tests/games.test.py`, the two new browser tests
below, `stamp-images.py --check`, `sync-chrome.py --check`, and
`tools/verify.py` over every page at 375, 1360 and 1440; after the merge,
also `tests/gap-band.py` and `tools/check-initialisms.py` from Runs 25-26.

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| 1 | Netlify Forms, every lead form | done: seven `<form data-netlify="true" netlify-honeypot="bot-field" method="POST">` forms, each in its page's static HTML with a hidden `form-name`, a honeypot, and every field it posts declared as an element, since Netlify stores only declared fields (the form itself is the static copy Netlify reads at deploy). `assets/js/pb-forms.js` posts the form urlencoded to `/`; only a 2xx shows the existing success state, and a refusal, a network failure or 4 s of silence opens the existing pre-filled email. The booking form posts without waiting: Calendly gets the same details, so it needs no email route. The occasional-emails box stays separate and unticked, sent as `yes` or `no`. Privacy Notice: one sentence naming Netlify, our website host (pack 1.15, 3.3, proposed). `LEAD_ENDPOINT` removed everywhere. `tests/lead-forms.test.py` (207 checks) submits every form in headless Chrome against a stand-in for Netlify, accepted and refused; `build.test.py` check 12 pins the seven names; the finder suite gains `fields()` (gate 65 to 76) | `3309bb4` |
| 2 | Terms liability clause | done: the A1 cap sentence is replaced by "This website provides information and booking only. No advice is given through it, whether by its calculators, guides, glossary, Buddy or any form on it. Advice is only given after a fact-find with Damian Condon." No cap figure. "Last updated" 25 September 2026. Pack 1.16 | `02c86c0` |
| 3 | Analytics, GTM-KQCRZDNB | done: `assets/js/pb-consent.js` on all 29 root pages replaces the dormant inline scaffold; Google's snippet runs only after "That's fine" (now or on an earlier page); "No thanks" or no answer loads nothing, and "No thanks" deletes any `_ga`/`_gid`/`_gat` cookies. No `<noscript>` iframe, on purpose. `PBTrack` events: `booking_form_submit`, `calendly_booking`, `calculator_first_interaction` with `calculator` (the page name) on eleven tools marked `data-pb-calc`; an event before the answer is sent only on a yes. Privacy Notice cookies section rewritten with a "Change your cookie choice" button (pack 1.17, 3.4, proposed). `tests/consent.test.py` (263 checks) | `87d0fbd` |
| 4 | Central Bank reference number | report only, not filled: one placeholder on the site, `how-we-work.html:1618` (R20-9a, the held page). In the docs: `docs/COMPLIANCE-PACK.md:84` (question 1.1 asks for it) and `:1008` (Appendix A.1 quotes the page). Line numbers as merged with `main`. No other page shows or asks for the number | this commit |
| 5 | Compliance email | done: `docs/COMPLIANCE-EMAIL.md`, 195 words with the subject line: the pack attached, the pages waiting on sign-off, five questions | this commit |

## The form names, for Netlify's notifications

`booking` (booking.html) · `pension-calculator-results` (pension-calculator.html) ·
`director-calculator-results` (director-calculator.html) · `director-guide`
(director.html) · `starter-guide` (starter.html) · `tracker-guide`
(tracker.html) · `pension-finder` (find-my-pension.html, held back).

## Found and fixed on the way

- The bar had never been shown, and two faults came with it. "That's fine"
  put dark text on the page's accent colour: 3.3:1 to 3.6:1 on 28 pages,
  1.24:1 on director.html (verify.py: 87 FAIL, three widths each). Its fill is now cream. And on a phone
  the bar wraps to about 154px, but Ask Buddy was lifted a fixed 96px, so
  Buddy covered "That's fine"; the bar now publishes its height
  (`--pb-consent-h`) and Buddy sits on it (consent test section 8, at 320,
  375 and 1200px).

## NEEDS DAMIAN INPUT from this run

- **R27-1 Netlify setup.** In the Netlify site's Forms settings, check that
  form detection is on before this deploy: without it no form is
  registered, and every form falls back to email. Then set a notification
  for each form name above.
- **R27-2 Promises the forms now make.** On a successful post the pages say
  "Thanks. Your figures are on the way." and "Thanks. The guide is on its
  way.", under a note "If nothing arrives in a few minutes, check your spam
  folder." Netlify stores the submission and can email you; it sends nothing
  to the visitor. Someone has to send the figures or the guide, or the
  wording changes, or an automatic reply is set up. Kept as they were (the
  brief said keep the existing success state).
- **R27-3 The GTM container is empty.** Fetched 25 September 2026: version
  1, no tags. Nothing is measured until tags are added and published in
  Google Tag Manager (for example a Google Analytics 4 tag, and triggers on
  the three custom events above).
- **R27-GTM** (privacy.html): which tools Tag Manager runs, their cookies,
  how long they last, where Google processes the data. The notice's "We do
  not use it for advertising" holds only if the tags are set up that way
  (the banner no longer says "nothing for ads, never sold": Run 33).
- **Pack 1.15 and 3.3**: Netlify as processor, retention of submissions,
  and the finder's date of birth, address and signature in Netlify; the
  finder's own privacy sentence (R20-1b) should name Netlify before the page
  is released. The notice's line that calculator figures go nowhere
  "unless you separately choose to email yourself the results" does not
  describe the "Email my results" forms, which send them to us; unchanged.
- **Not tracked, by choice**: the two game pages (`games/`) load no consent
  script (they are chromeless and run inside the glossary's iframe); the
  home and starter pages' small calculators are not marked. Either can be
  added.

## Proof

- On the merge with `main` (`d6ff3dc`, Runs 25 and 26), the whole gate
  again: every suite at its gate, `build.test.py` 197 (Run 26's checks 12
  and 13, this run's lead-form check now 14), `lead-forms.test.py` 207,
  `consent.test.py` 263, `gap-band.py` and `check-initialisms.py` pass (no
  initialism in this run's copy), `verify.py` 0 FAIL with the same WARNs
  as below. The built pages were rebuilt from their merged parts, not
  merged by hand.
- Gate before each of the three code commits, final run on `87d0fbd`:
  every suite at its gate (`pension-finder` 76), ALL SUITES PASS;
  `build.test.py` 185, `runner.test.py` 95, `games.test.py` 157,
  `lead-forms.test.py` 207, `consent.test.py` 263, all pass;
  `stamp-images.py --check` and `sync-chrome.py --check` clean;
  `verify.py`, 31 pages at 375, 1360 and 1440: 0 FAIL. WARNs: the
  placeholders (find-my-pension R20-1a, how-we-work R20-9a to 9e, privacy
  R20-1b, R20-A2 and the new R27-GTM) and glossary's C4, all as on `main`
  except R27-GTM added and terms.html's A1 gone.
- Both new tests were shown able to fail. Lead forms: a dropped hidden
  field, a send that always succeeds, a missing page value. Consent: loading
  without consent, counting replayed events, keeping the cookies, keeping
  events after a no, a page without the script, the old fixed lift.
- Rendered and looked at: the bar at 500 and 1300px, the Privacy Notice's
  new section and button at 375px.

---

# Run 26 — 2026-09-25 · Trust copy: a subhead, the review line, the gap chart, the reason to book

Damian's brief, branch `claude/trust-copy` off `main` `faf4c0e`, merged with Run 25 (`d202369`, which landed on `main` meanwhile) before its own merge: the home
hero's subhead from Our story, word for word; "Reviewed by Damian Condon,
QFA · Last reviewed September 2026" on every calculator, the State Pension
pages, the directors' rules, the SFT and the PIA page, as one shared
component; readers never see €0 in the gap chart, tested with JavaScript off
and with the band in view on load; a list (no changes) of every "best",
"leading", "top", "number one" and "better than"; next to every booking call
to action one reason from existing copy, no new claims. Then gate, commit,
push, merge, push `main`.

## Items

| # | Item | Result |
|---|---|---|
| 1 | Home hero subhead | done: "A pension should be something you understand, not something you avoid." under the heading, above the existing line, in Inter 500 at 1.12 to 1.4rem. The story section's line ("One idea: a pension should be…") stays where it is |
| 2 | The review line | done, as one component: the string is `pagebuild.REVIEWED`, `assemble()` puts it at the foot of the page header of every record with `reviewed=True` (8 built pages), the two hand-written calculators carry it by hand, and `pagebuild.trust_drift()` fails any page that should carry it and does not, carries it and should not, or carries a different wording (in `verify.py` as a chrome FAIL, and `tests/build.test.py` section 12 with six mutants). On: pension calculator, director calculator, auto-enrolment comparison, charges calculator, pensions list, both State Pension pages, directors' rules, SFT, PIA. Not on the held finder and readiness check (not signed off). **Wording: QFA is spelled out**, "Reviewed by Damian Condon, Qualified Financial Adviser (QFA) · Last reviewed September 2026", because Run 22's rule spells out every initialism at its first use and this line is the first QFA on all ten pages |
| 3 | The gap chart never shows €0 | fixed. Two faults on `main`: the script wrote "€0" into the figures as the page loaded, and arming the chart shrank the bars with a 1.15 s transition, so a reader who landed with the band on screen watched €0 bars collapse and regrow. Now the figures are never written as zero (they keep the markup's until the count-up starts, whose first frame is already 16% of the way); the band is judged once the page has loaded: on screen then, or reached by a link to `#gap`, it stays finished; below the fold, it is armed in one frame with no transition and counts up when scrolled to. Moving the slider mid-count now stops the count-up instead of being overwritten by it, and a printed page shows the bars. `tests/gap-band.py` (new, real frames, not in the runner: about 40 s) drives nine scenarios: no JavaScript at two widths, #gap at two widths, a tall window, a slow page scrolled before load, reduced motion, and two where the count-up must still play. 45/45 on the branch; on `main` 13 fail, with €0 on screen in three of them. `tests/build.test.py` section 13 guards the markup's three figures and the script statically |
| 4 | Superlatives scan | listed below, nothing changed: 49 hits, all "top" (36) or "best" (13); no "leading", "number one", "No. 1" or "better than" anywhere a reader can see, and none in code either. None is a claim about the firm |
| 5 | A reason next to every booking call to action | done where missing, from existing copy only: "Free, 20 minutes, no obligation." (the booking page's own terms: "Free, with no obligation", "Twenty minutes with Damian"). One string, `pagebuild.REASON`, one CSS recipe, guarded like item 2. Where the call to action's own block already gives the reason, nothing was added, so no card says "free" three times. The inventory is below |

The two components share one block of CSS (`/* TRUST:BEGIN` to `TRUST:END */`),
byte-identical on all 29 pages and guarded (the games carry their own one rule). `assets/js/pb-bookbar.js` changed,
so its `?v=` stamp moved on the five pages that load it. render-diff against
`main`: the five calculators load to the same render write for write, and
80,000 scripted events (16,000 a page) differ nowhere.

## Booking calls to action: which reason each has

| Where | Reason next to it |
|---|---|
| Home hero "Get my free review"; the director, starter and tracker heroes | added: the reason line under the two buttons |
| Director, starter and tracker phone pictures' link | added, under the link |
| Home phone picture's link | already: Buddy's line above it, "Yes, completely, with no obligation afterwards. Twenty minutes…" |
| Tracker "Start finding mine" (dark band) | added |
| "The cost of waiting" link, pension and director calculators | added |
| Auto-enrolment comparison: "In one sentence" link, and the funds-and-risk link | added, both |
| Directors' rules: "Book a call with Damian for free to go through them." | added, under the list's source line |
| Five guides (director year-end checklist, old pension checklist, over-50s, self-employed, UK pensions) | added, under the paragraph with the link |
| 404 page's booking button | added |
| Held finder and readiness check, their booking buttons | added (the pages stay held) |
| Ask Buddy panel's button, every page | added |
| Buddy's Run, the game-over panel's booking button | added (hidden in a very shallow game box, with the panel's other extras) |
| Jargon Battle, the end screen's booking button | already: "Damian explains them for a living, and the first call is free." |
| Booking bar on phones (5 pages) | added: a line under the button, so the bar is one line taller; its measured height already lifts the Ask Buddy button |
| The 8 calculator cards (pension, comparison, director, charges, SFT, PIA, both State Pension pages) | already: each card's paragraph says "a free 20-minute chat/call" |
| Closing bands: home, director, starter, tracker, glossary | already: "Twenty minutes. Phone or video. Free, with no pressure." and the like |
| The saved report's line (`pb-report.js`) | already: "…in a free 20-minute call" |
| Not calls to action, left as they are: the nav button ("…for free"), the footer's "Book a call", "booking page" in the privacy notice, terms and complaints text, and "book a free call" inside the email forms' error and thank-you messages | none added |

3 October 2026: Run 42 moved four of these; the table under Run 42 has them as they now stand. 4 October 2026: Run 43 put the line, as "Free · 20 minutes · no obligation · reschedule any time.", beside every booking call to action; the table under Run 43 has them.

## The scan: every hit (item 4, not changed)

Word-bounded, case-insensitive, over the text a reader can meet on all 29
pages and the two games: page text, visible attributes, meta and JSON-LD, and strings the
scripts write (`assets/js` included). CSS and code (`r.top`, `best` as a
variable) are not copy and are left out; a raw grep confirms no
"leading", "number one" or "better than" anywhere at all. Line numbers are on
this branch.

**"best" (13): the games' score labels, Damian's pull quote, the reality check's starting point, the checklist's "best made with advice", and the held readiness check's scoring**

| Where | Kind | Words around it |
|---|---|---|
| `glossary.html:1763` | text | …llect the benefits, jump the excuses. Endless, three lives, best score kept. Play <svg class="ico" viewBox="0 0 24 2 |
| `index.html:2106` | text | ndon I’ve spent thirty years explaining how money can best serve real people. Clarity is the whole point. After gradua… |
| `old-pension-checklist.html:1643` | text | …ned benefit scheme promised. Moving is a separate decision, best made with advice. Want help with it? We can |
| `pension-readiness-check.html:1895` | text | id="rdMoves"> Nothing to add: you gave the best answer to every question. Things change, so it is worth a l… |
| `pension-readiness-check.html:1911` | text | …stions after the first is worth up to 20 points: 20 for the best answer, 10 for a partial one, and 0 otherwise. The first qu… |
| `state-pension-reality-check.html:2082` | text | …using the Pensions Council's own research. It starts at the best case, a full forty years of contributions, and you can move… |
| `games/buddys-run.html:183` | text | ="k">Score 0 Best 0 Lives</span |
| `games/buddys-run.html:220` | text | ie down. Score 0 Best 0 New be |
| `games/buddys-run.html:221` | text | st 0 New best. Buddy is delighted with himself. <p class="pb-paw-note" da… |
| `games/buddys-run.html:1123` | script text | …howOver(); say('Game over. Score ' + S.score + '. ' + (S.newBest ? 'A new best.' : 'Best ' + S.best + '.')); } else if (S.ph… |
| `games/buddys-run.html:1123` | script text | wOver(); say('Game over. Score ' + S.score + '. ' + (S.newBest ? 'A new best.' : 'Best ' + S.best + '.')); } else if (S.ph… |
| `games/jargon-battle.html:249` | text | > 0 of 8 Best ever 0 of 8 <p class="pb- |
| `games/jargon-battle.html:974` | script text | …nap. ') + 'Hits landed: ' + s.hits + ' of ' + s.total + '. Best ever: ' + best + ' of ' + s.total + '.'); if (againBtn) { a… |

**"top" (36): every one means "in addition" ("on top of", "top-up"), a position ("off the top of your taxable income", "at the top of this page") or is the jargon quiz**

| Where | Kind | Words around it |
|---|---|---|
| `broker-vs-autoenrolment.html:2188` | text | …esults" tabindex="-1" type="button" onclick="setMode(2)">On top of auto-enrolment Same money |
| `broker-vs-autoenrolment.html:2205` | text | …"0" max="2000" step="5" value="0"> From your own pocket, on top of auto-enrolment. It goes through a personal pension, beca… |
| `broker-vs-autoenrolment.html:2209` | text | data-for="tmatchOn" hidden> How much of your top-up they would match 0% <input type="ran |
| `broker-vs-autoenrolment.html:2209` | text | …match" min="0" max="100" step="5" value="0"> A share of the top-up itself, not of your salary. |
| `broker-vs-autoenrolment.html:2327` | text | iv> €0 Of which your top-up adds €0 </d |
| `broker-vs-autoenrolment.html:2329` | text | v> Auto-enrolment plus your top-up. One year, at your salary and age. An illustration only.… |
| `broker-vs-autoenrolment.html:2343` | text | smark">+ Your top-up €0 <div class="lab |
| `broker-vs-autoenrolment.html:2352` | text | iv> Your top-up, broken down You pay in <span clas |
| `broker-vs-autoenrolment.html:2357` | text | " id="cMatch">€0 Total from the top-up €0 <p class="subnote" id="cRe |
| `broker-vs-autoenrolment.html:2365` | text | …pension here, whether it is instead of auto-enrolment or on top of it. Funds carry a risk rating from 1 (lowest) to 7 (high… |
| `broker-vs-autoenrolment.html:2418` | text | …arginal income tax relief. The employer match and the State top-up are the benefit on that layer. My Future Fund does not c… |
| `broker-vs-autoenrolment.html:2420` | text | …nd at 20% on the rest, because a contribution comes off the top of your taxable income. It is limited to Revenue’s age-rela… |
| `broker-vs-autoenrolment.html:2420` | text | …iversal Social Charge (USC) are not modelled. In Mode 2 the top-up is treated as its own contribution, independent of the a… |
| `broker-vs-autoenrolment.html:2423` | text | …a percentage of salary; in Mode 2 it is a percentage of the top-up itself. Both are zero unless you set them, and only appl… |
| `broker-vs-autoenrolment.html:2540` | script text | …tra: v => euro(v) + ' a month', tmatch: v => v + '% of your top-up' }; /* paintSlider takes the wording map as an argument,… |
| `broker-vs-autoenrolment.html:2771` | script text | …of your pocket puts ' + euro(c.totalIn) + ' in.' : 'With no top-up this is just auto-enrolment: ' + euro(ae.netCost) + ' pu… |
| `broker-vs-autoenrolment.html:2778` | script text | …chCap').textContent = tmatch > 0 ? '(' + tmatch + '% of the top-up)' : '(none)'; $('cReliefNote').textContent = extraMonthl… |
| `broker-vs-autoenrolment.html:2788` | script text | …+= ' Add an amount on the left to see what saving extra on top would put in.'; } $('leadOut').textContent = mode === 1 ? v… |
| `glossary.html:1836` | text | …on Extra payments you can make into a workplace pension, on top of the standard contributions, to build your pot faster. Th… |
| `glossary.html:1860` | text | …Social Insurance (PRSI) contributions. It may be payable on top of your own pension, but for most people it isn't enough on… |
| `my-pensions.html:1887` | text | …RSA) and additional voluntary contributions (AVCs), paid on top of a pension from a job. |
| `old-pension-checklist.html:1629` | text | …al pension, or AVCs (additional voluntary contributions) on top of a work scheme. Finding them <ul class="ck-li |
| `pension-calculator.html:2032` | text | …h work differently, and the State Pension may be payable on top. Warning: These figures are estimates onl |
| `pension-calculator.html:2114` | text | …rgon buster">State Pension (Contributory) may be payable on top, €15,564 a year for a full entitlement. Check gov.ie for th… |
| `pia.html:2269` | text | …gure. If your employer would pay into a pension, that is on top. <div |
| `starter.html:2110` | text | …te Pension pays €15,564 a year at the maximum. What sits on top of it is up to you, and the chart below shows what time doe… |
| `state-pension-entitlement.html:2308` | text | ure> Now you have the figure, the question is what sits on top of it. Whichever calculation the Department uses, the State… |
| `state-pension-entitlement.html:2308` | text | …ributory) is the starting point, not the plan. What goes on top, and how much of it you need, depends on when you start and… |
| `state-pension-reality-check.html:2229` | text | …ion. The State Pension is a floor, not a plan. What sits on top of it, and how much of it you need, depends on when you sta… |
| `state-pension-reality-check.html:2310` | script text | …return 'You would need ' + euro(g.gapAnnual) + ' a year on top, about ' + euro(g.gapMonthly) + ' a month .'; } function re… |
| `terms.html:1659` | text | …ese terms from time to time. The "Last updated" date at the top of this page shows the current version, and your continued… |
| `games/buddys-run.html:256` | script text | …========= */ var LABELS = { good: [ 'Tax relief', 'Employer top-up', 'Compound growth', 'Tax-free lump sum', 'Tax back', 'S… |
| `games/buddys-run.html:270` | script text | …var FACTS = [ { text: 'A pension contribution comes off the top of your taxable income, so for a higher-rate taxpayer a hun… |
| `assets/js/pb-jargon-bank.js:24` | script text | …, "correct": "Extra money you put into your work pension on top.", "wrong": [ "Advanced Vocal Coaching, for anyone who sing… |
| `assets/js/pb-jargon-bank.js:52` | script text | …he January sales.", "A savings stamp book, filled in at the top of the kitchen press." ], "buddySays": "The A stands for ac… |
| `assets/js/pb-jargon-bank.js:120` | script text | …n tax relief?", "correct": "Your contribution comes off the top of your taxable income.", "wrong": [ "The great relief of g… |

## NEEDS DAMIAN INPUT from this run

- The review line spells out QFA (Run 22's rule). If you want the shorter
  "Reviewed by Damian Condon, QFA", it is one string in `tools/pagebuild.py`
  (`REVIEWED`) plus the two hand-written calculators, and QFA joins the
  exceptions in `tools/check-initialisms.py` (Run 25's check, which fails
  the short form today).
- "Last reviewed September 2026" is fixed text. After Budget 2027 on 6
  October 2026 the SFT, directors' rules and PIA pages change; the date
  should move with them.
- The scan's "best" lines to look at: the reality check's "It starts at the
  best case" and the old pension checklist's "Moving is a separate decision,
  best made with advice". Neither is a claim about the firm.
- The compliance pack gains question 1.14 (what "Reviewed by" covers) and
  Appendix B.14 to B.16.
- Out of scope, found on the way: the calculator product pictures
  (`assets/img/product-*`) predate Run 21's 16px floor and Run 22's
  initialisms, so all five are shorter than the pages they show. A re-shoot
  (`python3 tools/shoot-product.py && python3 tools/stamp-images.py`, then
  the declared width/height) changes the home page's pictures, so it is left
  for its own review. `tools/shoot-product.py` now leaves the reason line out
  of its frames, as it does the share link.

---

# Run 25 — 2026-09-25 · Run 22 confirmed on main, and three initialisms it missed

Damian's instructions: confirm on `main` (`faf4c0e`) that the auto-enrolment
comparison has the locked warning box under "Everything paid in, by 66" and
that initialisms are spelled out at first use on each page; if not, do it,
gate, merge, push. Branch `claude/initialisms-first-use` off `faf4c0e`.

## Items

| # | Item | Result |
|---|---|---|
| 1 | The comparison's warning box | confirmed, no change: in `tools/compare-parts/main.html` and the built page, the two prescribed warnings sit inside the "Everything paid in, by 66" card directly after its second figure, with nothing between (16px gap), above the card's note. Probed in Chrome at two widths: visible in mode 1 with both figures; hidden with the card in mode 2 (the card is mode 1's); visible again on return. Word for word the same as the other 7 boxes on the site (8 boxes on 6 pages, one distinct text). `pb-warn` is still on the copy editor's deny list, `tools/edit-server.py` |
| 2 | Initialisms at first use | confirmed on every page except three first uses, now spelled out. Run 22's scan was never committed, so it was rebuilt, wider: it finds every token of two or more capitals instead of checking a list, reads hidden text (folded panels, jargon chip definitions, results not shown yet) and what each tab shows once clicked. The three: "S.I. No. 128 of 2021" in the directors' rules page's sources, now "Statutory Instrument (S.I.) No. 128 of 2021"; "the EEA" on the UK page, which followed "the European Economic Area" in the same sentence without linking the two, now "the European Economic Area (EEA)"; and "first PRSI year" in the alt text of the entitlement check's photograph, which the home page's tool picker swaps in when that tab is clicked (a screen reader reads it; the home page never spells out PRSI), now "the year you first paid Pay-Related Social Insurance (PRSI)". Every new PIA-page initialism (PIA, ETF, CGT, DIRT, PPSN, SIA, USC, PRSI) and the footer's "Personal Investment Account (PIA)" on every page pass. The compliance pack's 5.3, section 7, A.6 and A.12 are updated to match |
| 3 | The check, kept | `tools/check-initialisms.py`: every page, or named pages, `--all` to list what passes; exit 1 on any initialism not spelled out at first use. Accepted forms: "Full name (INIT)", "INIT (Full name)", and the full name right before or after (the glossary's headings, "a qualifying recognised overseas pension scheme, a QROPS", "The Money Advice and Budgeting Service, MABS"). Exceptions carry their reasons in the file. Shown to fail: run against an untouched copy of `faf4c0e` it reports exactly the three above (the PRSI one through the tab), and a planted mutant (pia.html's h1 without its expansion) |

Not covered by the check, searched by hand instead: text a script writes only
after other interaction. Every string in `assets/js` and the parts' page
scripts carrying an initialism was listed and read against its page: all
are preceded by the spelled-out form (director topics' PRSA, the pensions
list's "A PRSA", the entitlement check's PRSI and TCA lines, the PIA page's
sentences), except "PDF" in the old pension finder's closing message.

## NEEDS DAMIAN INPUT from this run

- Two exceptions added to Run 22's list, both left as they are: "HM" in "HM
  Revenue and Customs (HMRC)" (part of the department's name) and "PDF" in
  the old pension finder's closing message, "then save it as a PDF" (the
  name of the option in the reader's own print window; the page is held
  back). Say if either should be spelled out.

## Proof

- `tools/check-initialisms.py`: 29 pages, every one ok, exit 0.
- `tests/run-tests.py` ALL SUITES PASS; `tests/build.test.py` 148,
  `tests/runner.test.py` 95, `tests/games.test.py` 157, all pass;
  `stamp-images.py --check` and `sync-chrome.py --check` clean.
- `tools/verify.py` on the three changed pages (index, the UK page, the
  directors' rules) at 375, 1200 and 1440: 0 FAIL, 0 WARN. No calculator
  page changed, so render-diff does not apply.

---

# Run 24 — 2026-09-25 · Damian's answers on the PIA page, and the merge

Damian's instructions after Run 23: fill the placeholders with his answers,
cite the specific Revenue pages, add the page's copy to the compliance pack,
then gate, commit, push, merge to `main` and push `main`.

## Items

| # | Item | Result |
|---|---|---|
| 1 | PIA-1, the name | done: "What it is" now reads "Official documents call it the Investment Account, and the media the Savings and Investment Account (SIA): all three names mean the same account." Still four sentences. The glossary entry says the same |
| 2 | PIA-2, My Future Fund | done: guarantee "No"; tax while it grows and tax on the way out "See myfuturefund.ie", linked (checked live on 25 September 2026). No tax treatment is stated |
| 3 | PIA-3, employer money into a PIA | done: "Not mentioned in the proposals" |
| 4 | Pension "tax while it grows" wording; the illustration choices | approved as they are; no change |
| 5 | Revenue citations | done: one source per rule, each fetched and read on 25 September 2026 to confirm it states the figure. Funds and ETFs: Tax and Duty Manual Part 27-01A-02, Investment Undertakings (updated January 2026: 38% on or after 1 January 2026, and the deemed disposal at the end of each eight-year period). Shares: "How to calculate CGT" (33%, the €1,270 personal exemption). Deposits: "What DIRT rate is applicable?" (33%). Three plausible-looking revenue.ie addresses were rejected: they answer 200 with a "Page not found" page. `assets/js/pia.js` names the manual in its header |
| 6 | Compliance pack | done: `docs/COMPLIANCE-PACK.md` gains question 1.13 (what the page does, and four questions for compliance: the statements, illustrating a product that does not exist yet with reader-chosen tax figures, whether "Who it might suit" stays information, and the assumptions Damian approved), a section 7 entry quoting every sentence the calculator writes, Appendix A.13 (the page's full text, generated from the built page, tables row by row) and B.11 to B.13 (the starter line, the director card, the glossary entry). Insertions only: nothing already in the pack changed |

The page has no placeholders left, so the unused `.needs-input` rule is out
of `tools/pia-parts/page.css`.

---

# Run 23 — 2026-09-25 · The Personal Investment Account page

Damian's brief: a new page, `pia.html`, "The new Personal Investment Account
(PIA)", on branch `claude/pia-page` off `main` (`c3120b8`); linked from the
footer's Tools column, the glossary (new entry), starter.html and
director.html; in the sitemap. Every PIA fact dated "as at 25 September
2026" and "proposed". No figure for the rate, the threshold, the launch
month, take-up, any provider or any fee. Not merged: Damian reviews first.

## Items

| # | Item | Result |
|---|---|---|
| 1 | The page | done: built by `tools/pagebuild.py` (record `pia`, parts in `tools/pia-parts/`), a calculator like the charges page (16px floor, pb-warn, share and report rows). Sections: what it is (four sentences) with what it offers and what it costs you side by side under one CSS rule, so the risks cannot be set smaller than the benefits; confirmed vs still to come (threshold, rate, annual limit on 6 October 2026; accounts during 2027; not yet law); today's rules outside it (38% exit tax and eight-year deemed disposal, 33% CGT with the €1,270 exemption, 33% DIRT); a four-way table (PIA, pension, ETF, My Future Fund) on the six rows asked for, one card per row on a phone; the calculator; who it might suit, six personas, each "it depends on", pension first where there is employer money or relief, PIA for money needed before 60; the call to action; the information box; the assumptions |
| 2 | The calculator | done: the same take-home cost into a pension, the PIA and an ETF. Inputs: amount, years, growth, tax rate 20/40 (visible, not folded), the PIA rate (slider starting at 0%) and threshold (empty text field), both labelled "not yet announced, try a figure"; age and earnings under More options, for the pension's relief limit and the access age. Until a threshold is typed the PIA shows "No figure yet" and says why; at 0% it says there is no PIA tax at all. A lower-growth (half the rate) and a fall (a 20% fall in the last year) scenario beside the reader's own; the tax table shows where each product's tax comes in. The prescribed warnings box directly under the figures, then the share row. Static fallback: the markup carries the page's own default render (pension €36,018, ETF €28,235, PIA prompt) |
| 3 | New maths in its own module | done: `assets/js/pia.js` (`PBPia`), pension via `PBRelief.grossForNetCost` (age each year) and `PBSft.lumpSum`; ETF per-lot deemed disposal and exit tax; the PIA's tax on the twelve-month-end average. Spec `docs/CALC-SPEC-PIA.md`; `tests/pia.test.js`, 44 assertions, gated in `tests/run-tests.py` and run under node by `tests/runner.test.py`. Section 1 asserts the module holds no PIA rate or threshold |
| 4 | Links | done: footer Tools column "Personal Investment Account (PIA)" in the skeleton, carried to every page by `sync-chrome.py` and `pagebuild.py` (proved the only change to the other 29 pages); glossary `#pia` with an index entry; a line under starter's auto-enrolment section; a fourth card under director's "The rules for 2026"; sitemap |
| 5 | Budget day | done: `docs/PIA-BUDGET-DAY.md`, each item (threshold, rate, annual limit, valuation method, launch date, the as-at stamps, "proposed") with the file and line it lives on |

## NEEDS DAMIAN INPUT from this run

- **PIA-1** What "SIA" stands for. The brief gives the name only; the page
  says it is the same account and shows a placeholder for the expansion.
- **PIA-2** My Future Fund in the comparison table: tax while it grows, tax
  on the way out, and any guarantee. The site's modules do not state them,
  so they are placeholders. "At 66" for access is the site's own (starter.html).
- **PIA-3** Employer money into a PIA: not among the confirmed facts, so a
  placeholder.
- **Wording to confirm, not in the confirmed list:** the pension column's
  "None while it stays in the pension" (tax while it grows). The site's
  calculators all grow a pension untaxed, but no page says so in words.
- **Illustration choices to sign off:** lower growth is half the reader's
  rate; the fall is 20% in the final year; the PIA's average is the twelve
  month-end values; the pension is taxed in one go at the end, a quarter as
  a lump sum and the rest at the reader's rate. Each is said on the page.
- **Sources:** the Roadmap is linked through the gov.ie press release of
  31 August 2026, which links the document on assets.gov.ie; today's rates
  cite revenue.ie's home page. Deeper links if you want them.
- New copy on every section of `pia.html`, the glossary entry, and the
  starter and director lines needs the usual sign-off; the compliance pack
  has not been rebuilt for it.

## Proof

- `tests/run-tests.py`: every suite at its gate, `pia` 44; ALL SUITES PASS.
  `tests/build.test.py` 148, `tests/runner.test.py` 95, `tests/games.test.py`
  157, all pass. `stamp-images.py --check` and `sync-chrome.py --check` clean.
- The built page driven headless through a scripted session (threshold typed,
  rate moved to 1%, 20% tax, 30 years, threshold cleared): every figure
  followed, the loss-year line appeared, and clearing the threshold put the
  prompt back.
- `tools/verify.py` over every page (31) at 375, 1200 and 1440: 0 FAIL.
  WARNs: the placeholder lists (pia PIA-1 to PIA-3, and the older ones on
  privacy, terms, how-we-work, find-my-pension) and glossary's C4 deep link
  to #tax-relief, which main `c3120b8` shows too.

---

# Run 22 — 2026-09-24 · The comparison's warning box, and every initialism spelled out

Damian's instructions after Run 21: add the locked warning box to the
auto-enrolment comparison's "Everything paid in, by 66" card, same as the
other calculators; spell out every initialism on first use on each page;
gate, commit, push, merge to `main`.

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| 1 | The comparison's warning box, locked | done: the two prescribed warnings (Regs 372 and 392), the same box as on the other calculators, directly under the card's two figures and above its note. "Locked": `pb-warn` joins the copy editor's deny list (`tools/edit-server.py`), so no warning sentence on any page can be edited there; shown with the editor's own parser, 2 editable warning sentences per calculator and 6 on starter before, none after. render-diff against HEAD identical | `5d75967` |
| 2 | Every initialism spelled out at first use | done: a scan of each page's text as Chrome renders it (28 initialisms: PRSA, PRSI, USC, ROS, AVC, ARF, PRB, SFT, TCA, QFA, CCPC, CSO, HMRC, QROPS, EEA, EU, NAERSA, PPS, MABS, IORP, HR, DB, DC, PAO, FPSB, IOB, LIA, RPCI) found 54 first uses not spelled out on 20 pages; each now reads "Full name (INITIALISM)" where it first appears, and the scan finds none. Among them: the credentials line on four pages ("Damian Condon, Qualified Financial Adviser (QFA)"), the research source line on the home page (the four bodies named in full), the glossary's term index, two State Pension slider labels, the director calculator's take-home line, the readiness check's State Pension step (script-written), and the pensions list's hint, which now explains PRSA and AVCs above the kinds instead of below them. Left as they are: "UK" and GOV.UK, "KPMG" (a firm's name), "CEO"/"CMO" (job titles), "B.A.", and the jargon quiz, which asks what PRSI stands for. The compliance pack is updated to match (questions 1.4 and 1.7, finding 5.3, the copy list) | `9cb7d57` |

## NEEDS DAMIAN INPUT from this run

- The exceptions above ("UK", "KPMG", "CEO", "CMO", "B.A.", the quiz): say
  if any should be spelled out too.
- New wording from the expansions is in the compliance pack's section 7.

---

# Run 21 — 2026-09-24 · Damian's decisions on Run 20

Damian's instructions after reading Run 20: push `claude/next-step-features`
(done, at `c615a3d`); hold three pages back until compliance signs them off;
apply his decisions on the accessibility findings, the starter page's closing
line, the four-paws link and WhatsApp; write a compliance pack; then gate,
commit, push, merge to `main` and push `main`. Same worktree and branch, one
commit per item, the same gates as Run 20.

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| 1 | Held back until signed off: How we work, the old pension finder, the readiness check | done: all three stay live at their addresses but carry `<meta name="robots" content="noindex">` (how-we-work.html in its head; the two built pages through a new `noindex` field on their `tools/pagebuild.py` records, which the build checks) and nothing links to them: out of the footer's Tools and Company columns on every page (skeleton, sync-chrome, pagebuild) and out of sitemap.xml. tracker.html's "Help me find my pensions" and "Start finding mine" point at booking.html again, as before the finder. Cross-links reworded so each sentence still reads whole: the charges calculator's call to action, the pensions list, the UK guide and the old pension checklist now point at tracker.html ("we can help you find it", "we can help you find them", "We can do the asking for you: see how we help you find old pensions"); the self-employed guide no longer mentions the readiness check; terms.html has its original "A full summary of fees and any commission arrangements is available on request." again. The readiness check's two steps that led to the finder lead to tracker.html (suite still 41). New guard in `tools/verify.py`: a page that links to any page carrying the noindex meta FAILs, and a noindex page in the sitemap is a site-level row; shown to fire on both, in memory, and to leave 404.html and thank-you.html, already noindex and unlinked, alone | `948f1ef` |
| 2a | Footer headings: one level, not a skip | done: the footer's three column titles ("Who we help", "Tools", "Company") are `<h2>`, the level after the page's own, instead of `<h4>`, the only `<h4>`s on the site. Markup in the skeleton, carried by sync-chrome and pagebuild; the six layered `.foot-col h4` rules on each of the 28 pages retargeted to `h2`, plus `line-height:1.24`, which the `<h4>`s had taken from the shared `h3,h4` rule. Proved styled as before: every title's computed font, size, weight, line height, spacing, colour and margins, its box and the footer's height, on all 28 pages at 375 and 1200, identical before and after (0 differences). The build test's chrome-drift mutant now uses `<h2>` | `24276fc` |
| 2b | Checkboxes and radios at 24px | done: every checkbox and radio on the site is at least 24 x 24 (WCAG 2.2, 2.5.8), measured on every page at 375 and 1200 with folded and hidden ones shown: the "occasional emails" boxes (18px; the skeleton, director-calculator, director, starter, tracker), the auto-enrolment comparison's three toggles and the entitlement check's April box (20px wide), the two checklists (20px), the tick lists (20px, in the CSS `assets/js/pb-badges.js` injects), the director rules page's radios (18px), and the finder's and readiness check's boxes (20px). Each box's top margin came down by half its growth so it stays level with the first line of its label (screenshots at 375). The booking page's persona radios are already whole cards. render-diff against HEAD identical | `fe30942` |
| 2c | 16px minimum text on the calculators | done, on the seven calculators (pension, director, auto-enrolment comparison, State Pension reality check and entitlement check, charges, Standard Fund Threshold): no text in their `<main>` under 16px, at 375, 1200 and 1440, with folded parts open. How: one "16px floor" block at the end of the skeleton's stylesheet (pagebuild keeps it on the five calculator records, new `floor16` field, and leaves it out of the other four pages built on the skeleton) and a copy in director-calculator.html. It re-declares, one element more specific, each of the 148 rules that drew calculator text under 16px (`main <selector>{font-size:1rem}`, 1rem being 16.48px here; `!important` only where the rule it lifts was), plus `main{font-size:1rem}` for text that inherits and a zero-specificity rule for buttons at the browser's 13.3px. The list was generated from the pages: for every small text run, the rule it resolved to in the browser, at three widths, plus rules only reached in other states (focused field, copied link, earned paw). Proved: every element on the seven pages at 375, 1200 and 1440, before and after: 63 to 314 raised per page, **none smaller** (the one rule that would have lowered text, `.sft-asat`, is left out), none under 16px. Chart labels are drawn in scaled SVG, so 16 chart units showed as 7.6px on a phone: they now step with the viewport and measure 16.0 to 21.1px on screen at 33 widths from 320 to 1440. Layouts the larger text broke, found by audit and screenshots and fixed: the email row (the button now wraps under the field on a phone), the comparison's risk tiles (one a row) and rate staircase (two by two on a phone), its closing card's button (may wrap on a phone), and the entitlement check's ten-year glide (two rows of five on a phone). The site's nav and footer are not calculator content and stay as on every other page. `tools/verify.py` now fails a calculator with any text in its `<main>` under 16px (shown to fire with the floor taken out). render-diff against HEAD identical (load, and 80,000 events) | `4a7f0d6` |
| 2d | "The best time to start is now" cut | done: the eyebrow over starter.html's closing band is gone; the band now opens on "Let's get your pension started." (screenshot at 1200 beside tracker's band) | `7b43716` |
| 2e | No booking reward in the paw prints | done: at 4/4 the strip says "4/4 paws." and nothing more; the "Book your free call" link after it, its CSS and the arrow helper that only it used are out of `assets/js/pb-badges.js`, whose header now says that nothing in the file builds a link. The badges themselves are unchanged. Probed on tracker.html and the pension calculator with all four paws held: "4/4 paws.", no link, no errors. Script hashes restamped on every page that loads it | `9997902` |
| 2f | WhatsApp | not building, as decided | `9997902` |
| 3 | Compliance pack | done: `docs/COMPLIANCE-PACK.md`, plain text to email, one section each: the open questions (twelve, each saying what the site does now, the rule, and what is needed), the Letter of Authority word for word as the finder writes it and the email it prepares, the two Privacy Notice placeholders with proposed wording marked as proposed (the retention period and the way to stop the emails left as bracketed decisions), the readiness check brief (situations, all fifteen questions with points, zones, every step and link, and four questions under Guidance 3.5.7), the Reg 71, 56 and 88 findings with the current wording quoted, the other findings, every new line of copy by page, and the full text of every new page and new section as appendices. Everything quoted is read from the site's own files when the pack is built, so it says what the pages say | `5bcfbe3` |
| 2a, cont. | The last skipped heading level | done: the readiness check's "How the score works" is an `<h2>`, styled as the `<h3>` it was (computed style, box and spacing identical at 375 and 1200), so the page no longer goes `<h1>` to `<h3>` while its result is hidden. The site now has no skipped heading level on any page (the sweep's 30 pages) | `f5fdaa7` |

## Proof, at the end of the run

- `tests/run-tests.py`: every suite at its exact assertion gate, ALL SUITES
  PASS; `tests/build.test.py` 135, `tests/runner.test.py` 93,
  `tests/games.test.py` 157, all pass. `stamp-images.py --check`,
  `sync-chrome.py --check` and `pagebuild.py --check`: clean.
- render-diff against `c615a3d` (Run 20's end) and against `ebe1cbe` (this
  branch's base): the five calculator pages load to the same render, write
  for write, and 80,000 scripted events each way compare identical. No
  calculator script changed in this run; the floor, the boxes and the
  footer's headings are CSS and markup.
- `verify.py`, every page at 375 / 1200 / 1440 with screenshots: 0 FAIL,
  with the new checks live (no link to a held page; no text under 16px in
  a calculator's main). The five WARNs are the ones Run 20 ended with: the
  open placeholders and glossary.html's C4 deep link. The readiness check
  was changed after that run and re-audited on its own: 0 FAIL.
- The accessibility sweep over every page: no skipped heading level and no
  checkbox or radio under 24px anywhere.

## Corrections to Run 20, found while writing the pack

- Run 20's A4 row says the auto-enrolment comparison projects no investment
  growth and so carries no warning box. It does project growth: its card
  "Everything paid in, by 66" adds both paths' contributions "grown at 5% a
  year" (added in `d71c1b9`, before this branch). It has no box. Not
  changed; the pack puts it to compliance with the boxes' question.
- Run 20's NEEDS DAMIAN INPUT says the pages new in this run spell out every
  initialism they use (Reg 88). Several do not: the directors' rules page
  (AVC, PRSA, ROS), the charges calculator (CCPC, PRSA), the threshold check
  (CSO, PRSI, USC), the three guides (CCPC; PRSI, ROS; HMRC, PRSI, USC), the
  year-end checklist (ROS) and the finder (PPS). The pack lists every page.
  Not changed.

## NEEDS DAMIAN INPUT from this run

- **Send the compliance pack** to the compliance officer; the three held
  pages come back per the list below as each is signed off.
- **The 16px floor's reach:** it covers each calculator's own content. The
  site's nav and footer, shared by every page, stay as they are everywhere,
  so a calculator page still has small text in its footer. Say if the
  footer and nav should get the floor too; that is a sitewide change.
- **Two offers, not done:** a box with the two warnings under the
  comparison's "Everything paid in, by 66" card, if compliance keeps the
  boxes; and a pass spelling out every initialism on every page, if
  compliance says the jargon buster is not enough.

## To re-link after compliance sign-off

Per page, once it is signed off. The wording each place had is in `c615a3d`,
the commit before this run.

- **How we work** (how-we-work.html): delete its robots meta; put `<a
  href="how-we-work.html">How we are paid</a>` back in the skeleton's footer
  Company column after "Terms of Business", then run `tools/sync-chrome.py`
  and `tools/pagebuild.py`; put its sitemap entry back (priority 0.4); in
  terms.html, replace "A full summary of fees and any commission arrangements
  is available on request." with "Our summary of the commission we receive
  from product providers, and our fees, are published on our How we work
  page." linking `how-we-work.html#paid`.
- **Old pension finder** (find-my-pension.html): delete `noindex=True` from
  its record in `tools/pagebuild.py`; put `<a href="find-my-pension.html">Old
  pension finder</a>` back in the footer Tools column after "State Pension
  entitlement check"; sitemap entry back (0.7); tracker.html's two buttons
  back to find-my-pension.html; the four sentences back to the finder
  (`tools/fees-parts/main.html`, `tools/pots-parts/main.html`,
  uk-pensions-in-ireland.html, old-pension-checklist.html); and the readiness
  check's two steps (`assets/js/readiness.js` and its test), if the readiness
  check is live by then. Then rebuild.
- **Readiness check** (pension-readiness-check.html): delete `noindex=True`
  from its record; put `<a href="pension-readiness-check.html">Pension
  readiness check</a>` back in the footer Tools column after "All your
  pensions in one view"; sitemap entry back (0.6); the self-employed guide's
  "and the readiness check takes a minute". Then rebuild.
- `tools/verify.py` fails any link to a page that still carries the meta, so
  a link put back before the meta comes off is caught, and the check lifts
  by itself once it does.

---

# Run 20 — 2026-09-24 · The next-step features (ranked build list)

Damian's brief: "Pensionbuddy.ie: Missing Features & Content — Ranked Build
List (Sept 2026)". Its thesis is that the site needs a way to take action and
follow up rather than another calculator. Built in its own worktree,
`.claude/worktrees/next-step-features`, on branch `claude/next-step-features`,
from `ebe1cbe`: the newest commit of any worktree (the two most recently used
worktrees both hold it) and `main` = `origin/main`. **Not pushed, not merged.**

Every item is gated before its commit: `tests/run-tests.py`, the build, runner
and games suites, `stamp-images.py --check`, `sync-chrome.py --check`, a
rebuild with no diff, render-diff against HEAD (load, axes and corners, event
path) whenever a calculator page's script is touched, and `verify.py` at
375 / 1200 / 1440 with screenshots on every page the item changes. Facts that
go on a page were checked against primary sources first (Revenue, the Pensions
Authority, the Central Bank, gov.ie, the Pensions Council's own report); where
a figure or a legal sentence is Damian's to give, the page carries a
`needs-input` placeholder and it is listed under NEEDS DAMIAN INPUT below.

## What the brief assumed, and what was actually here

| Assumed | Actually |
|---|---|
| "Email or save your results" is missing | Email capture exists on the two hand-written calculators and as a guide request on tracker, starter and director, but `LEAD_ENDPOINT` is empty on every page, so each one hands the visitor a pre-filled email to hello@pensionbuddy.ie (A4 still asks whether that address is real). Save-and-resume half exists: run 19's share link (#30) carries the inputs after the #. |
| Marketing consent is separate from calculator data | It was not. All five email forms said "No spam, unsubscribe any time" over a single email field, so asking for figures read as joining a list. Fixed first (A2). |
| The paw badges and games might reward booking or contributing | Neither does. Badges are earned by using a tool; the games award nothing for booking. One thing for compliance: collecting all four paws shows "4/4 paws. Book your free call", a booking link at the completion moment, which is already on Damian's open list from the gamification branch. |
| Reg 32 commission disclosure "if it isn't live yet" | Not live. terms.html says "A full summary of fees and any commission arrangements is available on request." |
| #8 "cost of waiting" is new | The pension and director calculators already carry a "The cost of waiting" card (`#waitOut`). #8 is built as the start-age comparison the card does not do. |
| #2 fills "the need bar on your existing gap chart" | That is the home page's gap chart (`#pbGap`) and run 19's need slider (`#pbNeed`). |
| Run 19's table is current | It is not quite: #8, #11, #2, #21 and #25, skipped or not built there, were built afterwards on `claude/fixes-after-audit-2` (`bbc0f9d`, `b3febf2`, `bf35e0d`, `4624c72`), with the PRSI and CSO fixes (`a1aabeb`, `09a6a13`). All of that is in this run's base. |

## Items

| # | Item | Result | Commit |
|---|---|---|---|
| A2 | Marketing consent kept apart from the request | done: a separate, unticked "Also send me occasional emails…" box on all five email forms; the request and the choice travel apart (`marketingConsent` in the JSON, "Occasional emails: yes, please / no" in the fallback email); the notes no longer say "No spam, unsubscribe any time" over a request; the share link never carries the box; privacy notice placeholder R20-A2 | `57d2446` |
| A3 | Gamification check | report only: see the table above | `57d2446` (this table) |
| 21 | WhatsApp | not built: it needs your WhatsApp Business number, who answers it and when, and how chats would be kept on record, for compliance to confirm. Once there is a number, a "Message us on WhatsApp" link is one line in the skeleton and a sync | `6a168e8` |
| 22 | Accessibility pass | report only, per the audit-then-approve workflow: see "Accessibility, #22" below. Nothing blocks a keyboard or screen reader user; the findings are heading levels, target sizes and small text | `6a168e8` |
| 15 | Career breaks | done: "Time out." on starter.html under "If you wait.": the chart's monthly amount paid from 30 to 66, with and without a break ("The break starts at" 30 to 65, "Years out" 1 to 10); the two pots, the difference, and one sentence with the pot's share against the payments' share and the monthly top-up from the break's end that would make it up. At the default, three years from 32 leave the pot €52,672 smaller, 15% of it from 8% of the payments; ten years from 50 cost €62,058, not much more. A break that would run past 66 stops there and the card says so. The prescribed warnings are under the figures. Then the State Pension side, checked against Citizens Information (page edited 24 September 2026): full-time care of a child under 12, or of an older child or adult who needs an increased level of care, can add HomeCaring Periods, up to 1,040, counted under the Total Contributions Approach once the 520 paid contributions are there, and claimed with the pension; linked to the entitlement check. New `PBWaiting.withBreak()` (spec W4b), suite cost-of-waiting now 77 assertions, the figures worked out month by month a second time and three mutations shown to fail it. **Not built:** a gender pension gap figure, which needs a sourced Irish statistic; the card is written for anyone taking time out | `8df5234` |
| 14 | My Future Fund, what happens when | done: on starter.html under the 3 : 3 : 1 split, "Once you are enrolled: what happens when.", seven rows down a line: month 1 (the 2026 to 2028 rates on pay up to €80,000), the opt-out window in months 7 and 8 (your own contributions come back; the employer's and the State's stay invested until 66), pausing from month 7 for one to two years (still possible after month 8, when opting out is not), automatic re-enrolment two years after an opt-out (under 66 and in a job with no pension through payroll, which is not the first enrolment's test), and the rises of 2029, 2032 and 2035 with a window after each, when opting out refunds only the extra the rise added. From the Automatic Enrolment Retirement Savings System Act 2024 (ss.54, 55, 61, 62 and 63), gov.ie and Citizens Information; the 835,000 in it is the Department's figure of 14 September 2026. Plain markup, no script | `61f95d2` |
| 12 | All your pensions in one view | done: new page `my-pensions.html` (parts `tools/pots-parts/`): up to ten pensions, each a name, a kind (six), what it is worth now and, if known, the annual charge; the total, each one's share as a bar, and the known annual charges in euro a year at today's values, saying how many charges are not known. Nothing is projected or judged. A value or a charge that is not a number is said beside its field ("Not counted: enter an amount in euro, like 40,000.") rather than dropped without a word, and a comma in a charge is a decimal point, so "0,75" is 0.75% and never 75%. Nothing is stored or sent; "Print or save this list" prints the title, the summary, then the list (found while checking it: the first print rule hid the summary, which is a section too). New module `assets/js/pots.js`, suite 33 assertions, both reading hazards shown to fail the suite when put back. Linked from the footer's Tools column on every page, under tracker.html's tick list, and the sitemap | `bbc2c6e` |
| 18, 20, 11 | Over 50, self-employed, and a UK pension in Ireland | done: three guide pages in the legal pages' family, each dated "Rules as at 24 September 2026" and closing on its sources. `pensions-over-50.html` (#18): catching up (the age-related limits from 50, AVCs within them), taking benefits early (a job you have left from 50 with the scheme's and employer's agreement, a 20% director cutting links first; a PRSA from 60, or 50 on retiring from an employment; a personal pension from 60; a Personal Retirement Bond following its old scheme), why early is smaller, and an ARF against an annuity (the imputed 4% from 61, 5% from 71, 6% over €2 million; AMRFs abolished from 2022). `self-employed-pensions.html` (#20): auto-enrolment enrols employees only, a PRSA or a personal pension (no new personal pension products approved since 1 January 2024), relief on net relevant earnings at the age-related shares up to €115,000, carry-forward, Form 11, and 31 October 2026 or 18 November 2026 on ROS. `uk-pensions-in-ireland.html` (#11): a move only to a QROPS, the 25% Overseas Transfer Charge since 30 October 2024 and when it still does not apply, the UK State Pension paid into Ireland and uprated in the EEA, Irish tax on UK pensions under the treaty (UK government service pensions the exception), and the Pension Tracing Service. None gives a recommendation; each ends on a free call. Linked from a new "Over 50", "Self-employed" and "Worked in the UK" in the footer's Who we help column on every page, and the sitemap | `fb41ce7` |
| 13, 16, 17, 19 | Glossary: inflation, risk rating, pension adjustment order, Personal Retirement Bond | done: four new entries in the jargon buster and its term index. Inflation (#13) carries the build list's "shrink-ray": years and a rate (2% by default, the ECB's medium-term aim, said in the entry) give what €1,000 today would cost then and what €1,000 then buys today. Risk rating (#16) draws the 1 to 7 scale and says why two funds with the same number are not always alike (the older and newer scales' different bands, the holding period, recalculation, pension products outside the newer rules). Pension adjustment order (#17): only a court can share a pension out, the court may adjust other assets instead, the share can move into the other person's own pension, and it needs a solicitor. Personal Retirement Bond (#19): what one is, that its access follows the old scheme's rules, that it cannot move to or from a PRSA, and what a transfer can give up. The Standard Fund Threshold entry now points at the new check instead of "best confirmed in conversation" | `53f1eee` |
| 10 | Checklists, videos and a monthly email | partly done: the two lead magnets the build list names, as printable pages with tick boxes and a "Print or save this checklist" button (the browser's own dialog, so a PDF too): `old-pension-checklist.html` (ten steps: employers, names, papers, your own plans, asking trustees, closed employers, the UK tracing service, MyWelfare, what to ask a provider, and not moving anything yet) and `director-year-end-checklist.html` (nine: the company's year end, its funding limit, the PRSA 100% test, an executive pension set up before April 2021, the October deadline, the age-related limit, the threshold, salary against pension, Budget 2027), both built from the legal pages' family like how-we-work.html. Today the guide requests on tracker and director reach Damian as an email asking for "the guide"; these are a guide he can send. Linked from the finder, the director rules page, director.html and the sitemap. **Not built:** the videos (they need Damian on camera; the Central Bank's guidance 2.2.11 does suggest video or an infographic can help) and the monthly "Pension Pulse" email (it needs an email service and his content, and each email is an advertisement needing the regulatory disclosure statement, Reg 71(1)(c)) | `c6d2653` |
| 6 | Directors' 2026 rules and "which structure" | done: new page `director-pension-rules.html` (parts `tools/director-rules-parts/`), dated "Rules as at 24 September 2026. Budget 2027 is on 6 October 2026 and could change them.", five short sections each with its sources: executive pensions set up before 22 April 2021 (the five years' grace ended 21 April 2026; since then a one-member scheme can carry on only under the full rules, and most have moved to a master trust, a PRSA before normal retirement age, or a buy-out bond; the Pensions Authority's 40,644 on 1 September 2026, from 141,500), a company paying into a PRSA (100% of pay from 1 January 2025, then a benefit-in-kind and not deductible), the October window (31 October 2026, 18 November 2026 on ROS; company contributions follow its year end), the threshold, and SSAPs. Four questions list topics to discuss, never a recommendation (new module `assets/js/director-topics.js`, suite 10). The build list's "every executive pension had to move to a Master Trust or PRSA by 22 April 2026" is not what the law says (it required compliance, not a move); the page says what it does. Linked from director.html | `47a4582` |
| 7 | The Standard Fund Threshold and lump sums | done: new calculator `standard-fund-threshold.html` (parts `tools/sft-parts/`), same date stamp: the total of your pensions, the year taken (2026 to "2030 or later") and a lump sum; the threshold for that year and the share used, the statute's steps as a strip with the year marked, the chargeable excess tax at 40% when over ("at most" from 2030, when the threshold is only known to be at least €2.8m), the €60,000 lump sum credit, the combined rate of up to 68.8%, or 71.2% with PRSI, from the Department of Finance's 2024 examination, and the lump sum's three bands (€200,000 tax-free, €300,000 at 20%, the rest as income; the €500,000 fixed since 1 January 2025). New module `assets/js/sft.js` carrying every source, suite 37. The build list's "up to 71% (100% - 40% x 52%)": that formula gives 79.2%; the right sum is 40% + 60% x 52% = 71.2%, and the page cites the government's report, not Davy. Linked from director.html and the rules page | `47a4582` |
| 4 | The 60-second readiness check | done, not for launch before the compliance brief the build list asks for: new page `pension-readiness-check.html` (parts `tools/readiness-parts/`): which of the three situations fits (the booking form's three), then five questions for that situation, 20 points each, a score out of 100 in three named zones (Early days, On the way, In good shape) shown as a number, in words and on a labelled scale, and a step for every point not scored, each linked to the page that helps (the finder, the charges calculator, the entitlement check, the way-of-life picker, the calculators). Only things the reader can do are scored; paying in alone scores the same as with an employer; nothing scores booking. Answers never leave the page; "Talk it through with Damian, free" goes to `booking.html#persona=…`, and booking.html now ticks that one choice and nothing else. New module `assets/js/readiness.js`, suite 41 assertions. Footer Tools column | `bb0d0b1` |
| 3 | What your pension's charges cost | done: new calculator `pension-fees-calculator.html` (parts `tools/fees-parts/`): the pot, the monthly payment and the years; your plan's annual management charge and charge on each payment (defaults 1% and 5%, the Standard PRSA maximums, Pensions Act 1990 s.104(5) and (6)) against another plan's (defaults 0.5% and none), growth folded under More options. The two pots at retirement, one sentence, a table of what each plan's charges took and what they cost by retirement, a chart of both pots and the no-charge line, the prescribed warnings beside the figures, and "The other side" card (a lower charge is not the only thing that matters; moving can mean giving up terms worth more). Labels stay neutral ("the other plan") so a higher comparison reads right. New module `assets/js/pension-fees.js` (spec `docs/CALC-SPEC-FEES.md`), suite 35 assertions, the defaults worked out a second time in Python first; the no-charge line is the calculators' own projection to the cent. Linked from the footer's Tools column, the nav's Calculator menu and the finder; pb-share now keeps the warning box directly under the figures | `b24bf2c` |
| 5 | Save or send your results | done: "Save or print these figures" (a one-page report: the headline figures under the page's own labels, the result sentence, the workings, what was entered, the page's assumptions, the link that reopens the figures, any warning box, and the footer's regulatory statement and disclaimer) and "Email them to yourself" (the reader's own email app, addressed to no one) beside "Copy a link to these figures" on all five calculators; new `assets/js/pb-report.js`, which reads only what the page shows, stands aside while the guess card's veil is up, and leaves out switched-off controls; pb-share.js exposes its link builder so there is one definition of a resume link; the two calculators' "Email my results" now carry that link too | `0fe1b65` |
| A4 | Warnings beside the figures | done, for compliance to confirm: the two warnings the Regulations prescribe word for word (Reg 372, "Warning: These figures are estimates only. They are not a reliable guide to the future performance of your investment."; Reg 392, "Warning: The value of your investment may go down as well as up."), boxed, bold and no smaller than the text around them (Reg 45), directly under the projected figures (Reg 82) on the pension and director calculators and under both of starter's growth charts; the printed report carries them. The State Pension pages and the comparison project no investment growth and carry none. Found while re-shooting: the director calculator's sliders drew at Chrome's default 129px inside a 423px column (its base slider rule never set a width); fixed. All five product photographs re-shot (the pension and entitlement shots were stale since `b3febf2` and `bbc0f9d`), the pension one without the State Pension line so the home page's arrow label stays clear, and every declared width and height corrected, the product tabs' data included | `0fe1b65` |
| 1 | Old pension finder with a signed Letter of Authority | done: new page `find-my-pension.html` (built by `tools/pagebuild.py` from new parts `tools/finder-parts/`), four steps: where you worked (up to ten employers, years optional), about you (name, other names, date of birth, address, email, optional phone; no PPS number), the Letter of Authority filled in and signed (typed name, an optional drawn signature, an unticked confirm box), and what happens next (a Requested / Found / Valued line per employer). Phone and email consent are separate unticked boxes. With `LEAD_ENDPOINT` set it posts JSON; today it opens a pre-filled email to Damian and offers the letter to save as a PDF and attach. New module `assets/js/pension-finder.js`, suite 65 assertions. tracker.html's "Help me find my pensions" and "Start finding mine" go to it; "Old pension finder" joined the footer's Tools column | `73ad89b` |
| A1 + 9 | Reg 32 commission summary, and the trust page | done as a template: new page `how-we-work.html` ("How we work, and how we are paid"): who advises you (Damian Condon, QFA, 30 years' experience, the Central Bank register linked), the Reg 32 summary laid out per product type as Reg 32(3) asks (when you start, trail commission, clawback), other fees and non-monetary benefits, agencies held, whether commission is set against a fee (Reg 33), a fees section (Reg 68), the rules any review shown will follow (Reg 85), and the CCPC, MABS and Pensions Authority (the Central Bank's guidance 2.2.7). Every figure is a placeholder. terms.html's "available on request" now links to it, and "How we are paid" is in the footer's Company column on every page (skeleton + sync-chrome + pagebuild) | `399f861` |
| 2 | Way-of-life picker (Irish Retirement Living Standards) | done: under the home page's gap chart, Modest / Moderate / Comfortable for one person or a couple; a card sets run 19's need slider to its annual figure, so the chart, the sentence and the spoken label follow; the chosen card opens its month in the report's seven categories; a couple is set against two State Pensions at the maximum rate (€31,127, from the weekly rate, not twice the rounded €15,564), which is how the report built its couple Modest figure; the chart's source line follows the figure it shows. New module `assets/js/living-standards.js` (all six columns of the report's p. 12 table, read from the PDF), suite 66 assertions, cross-checked against the single totals in `state-pension.js`; CONTEXT.md's entry updated | `9a2daaa` |
| 8 | Cost of waiting | done: "If you wait." under starter's 30/40/50 chart: the reader's age and a wait of 1 to 10 years, the two pots, the difference, and the monthly amount the later start needs to catch up; the assumptions in the card itself; new module `assets/js/cost-of-waiting.js` (spec `docs/CALC-SPEC-COST-OF-WAITING.md`, suite 51 assertions), which the 30/40/50 chart now reads instead of its inline copy (proved identical at all 39 slider values). Also fixed: the chart's and the 3 : 3 : 1 split's sliders drew at Chrome's default 129px inside their 420px controls | `a48164b` |

## Proof, at the end of the run

- `tests/run-tests.py`: every suite at its exact assertion gate (the new ones:
  cost-of-waiting 77, living-standards 66, pension-finder 65, pension-fees 35,
  readiness 41, sft 37, director-topics 10, pots 33), ALL SUITES PASS, with
  the State Pension pages' probe and panel check. `tests/build.test.py` 135,
  `tests/runner.test.py` 93, `tests/games.test.py` 157, all pass.
- `stamp-images.py --check`, `sync-chrome.py --check` and `pagebuild.py
  --check`: clean, so every page carries the current nav, footer and hashes.
- render-diff against `ebe1cbe`, the run's base: the five calculator pages load
  to the same render, write for write, and 400 scripted sessions of 40 events
  on each (80,000 events) compare identical. The run changed their markup and
  the shared scripts around them, not what their own scripts write.
- `verify.py`, every page at 375 / 1360 / 1440 with screenshots: 0 FAIL. Five WARNs, none new: the open placeholders on find-my-pension.html (R20-1a), how-we-work.html (R20-9a to R20-9e), privacy.html (R20-1b, R20-A2) and terms.html (A1), and glossary.html's deep link #tax-relief landing further below the header than the check likes, which the audit reported before this run began (C4).

## Accessibility, #22 (report only)

Swept every page at 1200px in headless Chrome with a scripted check, on top of
what `verify.py` already fails or warns on at 375 / 1200 / 1440 (contrast, the
focus ring, the drawer's targets, the `<main>` landmark, sliders'
`aria-valuetext`, overflow). Nothing was changed.

**Clean on every page:** `lang="en-IE"`; one `<h1>`; one `<main>`; a skip link
to it (not on the two games, which have no site chrome); every image has alt
text; every field, button and link has an accessible name; no "click here"
links; no duplicate ids; no positive `tabindex`; no autoplaying media; no link
opens a new window without saying so; the viewport allows zoom
(`width=device-width, initial-scale=1.0`, no maximum scale). Keyboard: the two
games, every slider (arrow keys; a single click also works) and every form
work without a mouse; the finder's drawn signature is optional, the typed name
being the signature.

**Findings, for you to approve or not:**

1. **Heading levels skip** (WCAG 1.3.1, advisory): the shared footer's column
   titles ("Who we help", "Tools", "Company") are `<h4>`, the only `<h4>`s on
   the site, so they skip a level on the 17 pages whose last heading before
   the footer is an `<h2>`, and 404.html goes `<h1>` to `<h4>`. Making them
   `<h2>` (styled as now) is one edit to the skeleton and a sync.
   pension-readiness-check.html goes `<h1>` to `<h3>` ("How the score works")
   while the result, which holds the `<h2>`, is hidden.
2. **Targets under 24px** (WCAG 2.2, 2.5.8): the "occasional emails" boxes are
   18 x 18 on the calculators and persona pages; the checklist and tick-list
   boxes are 20 x 20; the director rules page's answers 18 x 18. All sit inside
   clickable labels with room around them, so they very likely pass by the
   criterion's spacing exception, but 24px would remove the doubt.
3. **Small text:** the share of visible text under 16px is about 48% on the home
   page, 89% on the pension calculator, 91% on the finder and 13% on the terms;
   under 13px it is 0 to 3%, the smallest being the 9.5px "Chief Pension Dog"
   label. WCAG sets no minimum size; zoom works. A floor of 14px for notes and
   16px for body copy would be a design change across the stylesheet families
   (the stylesheet sync was refused before, so this is not proposed as one).

## NEEDS DAMIAN INPUT from this run

- **#22, accessibility:** say which of the three findings above to fix (footer headings, 24px boxes, a text-size floor). **#21:** the WhatsApp number, if you want it.

- **#18, #20 and #11, the three guide pages:** every rule on them is from Revenue, the Pensions Authority, gov.ie, GOV.UK and HMRC, read on 24 September 2026, but they are regulated content and yours to sign. Re-check after Budget 2027 on 6 October 2026, and the UK page after the UK Budget. The UK page states the overseas transfer allowance as "usually £1,073,100"; confirm that is how you want it put, since a person's own allowance can differ.

- **#6 and #7, every tax and regulatory statement:** both pages state rules
  from primary sources (Finance Act 2024 ss.12 and 13, S.I. 128 of 2021, the
  Pensions Act s.61B, Revenue's Pensions Manual chapters 4, 13, 19, 24, 25
  and 27 and appendix III, Revenue eBrief 034/26, the Pensions Authority's
  notices and conference figures), all read on 24 September 2026, but they
  are regulated content and yours to sign. Re-check both after Budget 2027 on
  6 October 2026. Two points the research could not settle: how a Personal
  Fund Threshold below the rising SFT is treated (the page only says a PFT
  may apply instead), and Revenue's defined benefit valuation factors (the
  page says Damian can work that out, and gives no factor).

- **#4, before the readiness check goes live:** the build list's own condition,
  a brief to compliance on the check (a score is a gamified element, which the
  Central Bank's General Guidance 3.5.7 names), and sign-off of its questions,
  points and zone names. It is information only and says so; it scores
  nothing out of the reader's hands and nothing for booking.

- **A4, the warnings:** whether a generic calculator's projection counts as an
  illustration of an investment product under Reg 372 is a judgement the
  research could not settle; the boxes were added as the cautious reading, and
  compliance may take them off. Starter's chart note still says "the value of
  investments can fall as well as rise" in small print, which the box now says
  in the prescribed words; trim it if you like.

- **R20-1a, find-my-pension.html: the Letter of Authority's wording** is a
  draft, for Gresham Wealth's compliance officer (the page flags it where the
  letter shows). It authorises requests for information only and says it
  cannot move, change, cash in or transfer anything. Also for them: whether
  the providers you deal with accept an e-signed letter (the typed name is
  the signature; a drawn one is optional), and whether tracing is a regulated
  activity for the firm. If it is not, the Regulations treat it as an
  unregulated activity: its own web page (Reg 72), no regulatory disclosure
  statement on it (Reg 71(2)-(3)), and a set warning in written communications
  about it (Reg 73(1)(c)). The Central Bank's guidance (3.5.10) suggests an
  information form like this one is not a "digital platform", but that is
  a judgement for compliance.
- **R20-1b, privacy.html:** a sentence on what the finder collects and the
  signed letter: why, who sees it (the providers and trustees named), and how
  long it is kept. Reg 117(2) allows a record of someone who did not become
  a client to be kept for 12 months, subject to their consent.
- **The finder's promises for Damian to confirm he can keep:** "As the
  replies come in, Damian will tell you what was found and what it is
  worth"; "You can withdraw the letter at any time, in writing, and we stop
  asking"; and that a PPS number is asked for later, on a call, if a
  provider insists.

- **R20-9a to R20-9e, how-we-work.html:** the Central Bank reference number;
  for each product type, the commission when a plan starts, the trail, and any
  clawback (a single figure where possible; where it is a range, what decides
  the point in it, per the Central Bank's guidance 3.4.4); other fees,
  administration costs and non-monetary benefits, or "none"; the providers you
  hold agencies with; whether commission is set against a fee; the schedule of
  fees after the free first consultation; and any reviews. Correct the product
  list if it is not the list you are paid for.
- **Compliance findings from reading the 2025 Regulations (S.I. 81 of 2025)
  and the Central Bank's General Guidance, for your compliance officer. Nothing
  below was changed:**
  - Reg 71(4) prescribes the regulatory disclosure statement's exact form,
    "[Full legal name], [trading as …] is regulated by the Central Bank of
    Ireland", with no other text. The footer's sentence ("Pensionbuddy is a
    trading name of … which is regulated by …" followed by the registered
    office and the register) is a different form. Reg 71(2)-(3) also limit
    the statement to pages solely about regulated activities.
  - Reg 56: an intermediary may say "broker" only if its principal regulated
    activities are on a fair analysis of the market. The comparison page's
    name and copy use "broker" ("a personal pension arranged through a
    broker").
  - Reg 68: a schedule of fees and charges must be displayed on the website.
    how-we-work.html has the section; it needs the schedule.
  - Regs 45, 82, 372 and 392: where a page illustrates investment growth, the
    prescribed warnings ("Warning: These figures are estimates only. They are
    not a reliable guide to the future performance of your investment.";
    "Warning: The value of your investment may go down as well as up.") go
    in a box, in bold, no smaller than the main text, at the same time as the
    benefit. The calculators and the charts carry plain small-print
    illustration notes instead. Whether a generic calculator is caught is a
    judgement call the research could not settle; see A4.
  - Reg 88: an advertisement must spell out every initialism it uses (PRSA,
    AVC, ARF, PRB, SFT). New pages in this run do; older pages rely on the
    jargon buster.
  - Comparative claims: a scan of every page's copy for superlatives and
    comparisons ("best", "cheapest", "lowest", "better than", "the only",
    "guaranteed", "independent" and others) found none setting Pensionbuddy
    or any product against another. Every hit is descriptive: the 1 to 7 risk
    scale, "not guaranteed", the Ombudsman and the CCPC as independent, the
    games' best scores. One line reads as a general claim: starter.html's
    closing heading "The best time to start is now", which predates this run.

- **R20-A2, privacy.html:** a sentence for "How we use it" on the optional
  emails: who gets them (only people who tick the box), what they are, and how
  to stop them. Placeholder in the list.

- **#2, the couple comparison:** a couple is set against two State Pensions
  at the maximum rate, the report's own basis for its couple Modest figure. A
  couple with one pension, or reduced rates, would have a smaller State bar
  than the chart draws. Say if the bar should carry that caveat in words.
- **Research findings on figures the site already quotes (nothing changed):**
  the home page's "79% feel unprepared." matches the Amárach report's p. 5
  (79% of *employees surveyed* feel financially unready); the phrase "nearly 8
  in 10" in the build list is the Irish Examiner's, not the report's. The
  €40,860 is Royal London Ireland's press release of 16 July 2026 (iReach, 896
  adults not yet retired), a total that already counts the State Pension; a
  more exact source line would be "Royal London Ireland / iReach, July 2026".
  The build list's "only 42% felt financially prepared" is on the living
  standards report's p. 8, but the Council's own raw survey file gives 38%
  across all 500, so cite it as the report's figure, never "42% of 500".

## New copy needing Damian's sign-off

- #15: on starter.html, "Time out."; the lead "Time away from work, to care for someone, to study or to travel: what a break in payments does to the pot, and, for time spent caring, what can still count toward the State Pension."; labels "The break starts at", "Years out"; rows "Paying in all along" and "[n] years out at [age]"; the sentence "A break of [n] years at [age] leaves the pot at 66 about €[x] smaller: [p]% of it, from [q]% of the payments[, because early payments have the longest to grow]. Paying about €[y] a month more from [age] would make it up." or "... The break runs to pension age, so there are no years after it to make that up."; the HomeCaring Periods paragraph; and the note, which adds "the pot keeps growing through the break, with nothing paid in, and a break stops at 66".

- #14: on starter.html, the heading "Once you are enrolled: what happens when.", its seven rows ("Month 1", "Months 7 and 8", "From month 7", "Two years after an opt-out", "2029", "2032", "2035 on") and the source note, as on the page.

- #12: the whole of my-pensions.html: h1 "All your pensions, in one view.", eyebrow "The free tool · nothing leaves this page", the lede, "Your pensions" and its hint, the field labels ("Name or provider", "Kind", "Value now, in euro", "Annual charge, % (optional)"), the six kinds ("A pension from a job", "A PRSA", "A personal pension", "A Personal Retirement Bond", "AVCs", "Something else"), "Add another pension", "Remove", "A PRSA is a Personal Retirement Savings Account. AVCs are additional voluntary contributions, paid on top of a pension from a job.", "In one view", "[total] across [n] pensions.", "The annual charges you know of come to about €[x] a year at today's values, with [n] charges not known.", "Add an annual charge to see what the charges come to in euro a year.", the two field messages, "Print or save this list", the note "Values are what you entered, as they are today. Nothing here is a projection, and nothing here says whether any pension is right for you.", the three next-step lines, and "This is a list, not advice. ... Bringing pensions together is not always right: some carry terms worth more than the convenience." On tracker.html, under the ticks: "Know roughly what some are worth already? List them in one view, with the total and what the charges come to." Footer link "All your pensions in one view".

- #18, #20, #11: the three pages whole: "Pensions after 50: catching up, taking benefits early, and what comes after", "Pensions when you are self-employed" and "A UK pension, and living in Ireland", including "Early access is a trade, not a bonus.", "Neither suits everyone: one gives certainty, the other flexibility and the risk that comes with it." and "There is no general answer, and this page does not give one." Footer links "Over 50", "Self-employed", "Worked in the UK".

- #13, #16, #17, #19: the four glossary entries whole, the inflation widget's
  labels ("Years from now", "Inflation a year") and sentence ("At [r] a
  year, what €1,000 buys today would cost about €[x] in [n] years. The other
  way round, €1,000 then buys what €[y] buys today."), and the Standard Fund
  Threshold entry's new last sentence.

- #10: both checklists whole, the button "Print or save this checklist", and
  on director.html a third card "The year-end checklist".

- #6 and #7: both pages whole, including the four questions and five topics
  on the rules page ("Topics to discuss, not advice.") and every sentence the
  threshold check writes ("[total] taken in [year] uses [x]% of that year's
  threshold, leaving [y] of headroom." / "... is [z] over ..."; "Chargeable
  excess tax at 40% on the [z] over is [cet] ..."). On director.html, a new
  section "The rules for 2026. What changed, and how close you are to the
  cap." with two cards linking the pages.

- #4: the whole of pension-readiness-check.html: the h1 "How ready is your
  pension? Six questions to find out.", the three situations ("I have pensions
  from old jobs to sort out." and so on), the fifteen questions and their
  answers, the zones ("Early days. Plenty you can do, and the first steps are
  simple ones." / "On the way. A few gaps are worth closing." / "In good
  shape. Worth keeping under review as things change."), the ten steps and
  their link names, and "How the score works". Footer link "Pension
  readiness check".

- #3: the whole of pension-fees-calculator.html: h1 "What your pension's
  charges cost you by retirement.", slider labels, the subnotes ("A share of
  the fund taken every year. On an older plan it may be called a fund
  management charge."; "Sometimes shown as an allocation rate: 95% allocated
  means a 5% charge."), "Over [n] years, your plan's charges would take about
  €[x] out of your pot. With the other plan's charges, you would have about
  €[y] more [or less] at retirement.", the table's rows, "The other side",
  the call to action "Not sure what your old plans charge?" and every
  assumption. Footer link and menu line "Pension charges calculator", "What
  your plan's charges take out of your pot by retirement."

- #5: buttons "Save or print these figures" and "Email them to yourself";
  status lines "Reveal the illustration first, then save it." and "Your email
  app should have opened. Add your own address and send."; report headings
  "Your figures", "How we got this", "What you entered", "The assumptions
  behind these numbers", "Next steps"; lines "Pensionbuddy. Saved on
  [date].", "Open these figures again: [link]", "Talk them through with
  Damian in a free 20-minute call: [link]"; the self-email's first line
  "[page], saved on [date]" and "What I entered:". In the two calculators'
  emails to Damian, the new line "Open these figures again: [link]".
- A4: none; the two warnings are the Regulations' own words.

- #1: the whole of find-my-pension.html, including the h1 "Lost track of an
  old pension? Start the search here.", the step names, the side card "What
  this is, and what it is not" ("We cannot promise every pension will be
  found: schemes close, merge and change hands, and old records are not
  always complete."), the consent boxes "You can phone me about this search."
  and the site's occasional-emails box, the draft letter, and the two
  confirmations: "Thanks. Your signed letter and your details are with
  Damian, and the search has started." (only after a real success from the
  endpoint) and "Your email app should have opened with your details ready to
  send to Damian. Nothing has been sent until you press send there. Please
  attach your signed letter: choose \"Save or print your letter\" below, then
  save it as a PDF." Footer link "Old pension finder".

- A1/#9: the whole of how-we-work.html (title "How we work, and how we are
  paid"), which reuses the Terms of Business' "fee you agree with us …
  commission from the company whose product you take out … set out in
  writing before any work begins", and says of reviews: "We show a review
  here only if it is genuine and unedited, with the reviewer's name, the date
  and their permission, and only if it is about our service rather than
  investment returns. If a reviewer works for us, is connected to us, or was
  paid anything, we say so beside the review." terms.html: "A full summary of
  fees and any commission arrangements is available on request." became "Our
  summary of the commission we receive from product providers, and our fees,
  are published on our How we work page." Footer link label "How we are paid".

- A2: box label "Also send me occasional emails about pension deadlines and
  rule changes. Optional, and you can unsubscribe at any time." Note, replacing
  "No spam, unsubscribe any time.": "We use your email to reply to this
  request, and for nothing else unless you tick the box." (the rest of each
  note is unchanged). Fallback email line "Occasional emails: yes, please" or
  "Occasional emails: no".
- #2: "Not sure what you'll need? Start from a way of life."; toggle "Single" /
  "Couple" (group name for screen readers "Who it is for"); card lines "The
  basics, with a little left for extras.", "More room to manoeuvre, and more
  security.", "More freedom, and room for a few luxuries." (paraphrasing the
  report's p. 9 definitions); need bar "[Level], for one" or "[Level], for a
  couple"; for a couple the State bar reads "Two State Pensions, both at the
  maximum" and a covered need "Covered by two State Pensions."; month head
  "[Level], for one person: €[x] a month" or "…, for a couple: …"; category
  names the report's own, lightly shortened ("Housing, including utilities",
  "Once-off costs"); note "Once-off costs are holidays, Christmas and gifts,
  insurance, car and property tax, and bigger one-off buys, spread over the
  year. These are national averages at 2024 prices, not a budget for you.";
  source lines "Standards of living: Pensions Council, Irish Retirement Living
  Standards, researched by KPMG, 2024 prices." and, under the chart while a
  card is chosen, "Pensions Council, Irish Retirement Living Standards, 2024
  prices."
- #8: heading "If you wait."; lead "The same monthly amount, from your own
  age: started now, or a few years from now."; labels "Your age now", "If you
  start in"; rows "Now, at [age]" and "In [n] years, at [age]", "€[x] less";
  "To end up with the same pot, starting at [age] would take about €[x] a
  month instead of €[m]: €[y] more each month." and, from 66 on, "By [age]
  there are no years left to pay in before pension age, 66, so there is no
  catch-up figure to show."; note "Illustration only · the value of
  investments can fall as well as rise. The monthly amount is the one set
  above. Assumes 5% growth a year, contributions to 66, and no pension to
  start with. Figures ignore charges, tax relief and inflation."

---

# Run 19 — 2026-09-22/23 · Overnight build of the interactive audit

Damian's overnight brief. Branch `claude/interactive-audit-2-efbbbb`, pushed as
`origin/claude/interactive-audit-2`. Not merged: Damian reviews first. Built
one item at a time in the order the brief gives, each gated, render-diffed if
protected, committed and pushed before the next. An item that fails its gate
twice is reverted and logged here. The audit itself is
`docs/INTERACTIVE-AUDIT-2.md`.

**RUN COMPLETE, 2026-09-23.** Every row below is done, skipped with its reason, or
not built by the brief's own condition; every done row is committed and pushed.
Final gate: run-tests all suites pass; build 69; runner 77; games 157; stamp,
chrome and pagebuild clean; verify.py 18 pages at 375/1200/1440 with
screenshots, 0 FAIL (WARNs: terms A1, existing; glossary C4, from #22).
Render-diff against main (0a2461c), with the run's new cells and the
deliberately reworded #entryNote set aside: load identical on all five
calculators; 160,871 swept states and 9,000 event-path comparisons, 0
differing.

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
| 3 | Regulatory lockup | done: regulator line and name as one type-only mark under the hero call to action, four pages, linked to the register | `8d5b72b` |
| 4 | Result sentence | done: the headline figures as one plain sentence under them on the pension, director and reality check pages, written from the same final values and veiled with them | `15494a7` |
| 15 | Success motion | done: the success tick draws itself once (300ms, ease-out) on the guide, calculator email and booking confirmations and beside thank-you's heading; focus lands on each confirmation; drawn and still under reduced motion | `6d15c55` |
| 5 | Mobile booking bar | done: below 921px on home, starter, director, tracker and glossary, a closable "Book a call with Damian for free" bar shows once the hero is gone and tucks away at the closing band; Ask Buddy lifts above it; it stands aside while the cookie bar or the Ask Buddy panel is up; closed stays closed for the session, Back included | `0ab51a7` |
| 1 | Results peek bar | done: peek bar on the five calculators below 921px, mirroring the headline cells; figure-free while the guess veil is up | `6374107` |
| 14 | 3 : 3 : 1 split | done: salary slider, three bars in a year at this year's rates from PBCompare.autoEnrolment; the ratio note | `32ecd62` |
| 8 | Transition glide | **skipped** (fail-once rule): verify.py flagged the visually-hidden "Your year:" marker text at 1.1:1 contrast on its teal dot; reverted. A one-line colour fix away; render-diff had proved only the new #pbGlideY cells differ | — |
| 7 | Relief limit ladder | done: six-step ladder from PBRelief.reliefBand; live marker and limit in euro on the pension calculator and compare (pb-ladder.js, no page-script change); static on starter, director, glossary | `d79ac7a` |
| 11 | State Pension on top of monthly income | **skipped** (fail-once rule): verify.py flagged the new line at 2.18:1 contrast (grey --ink-2 on the dark results panel); reverted. Render-diff had proved only the new #pbSpTop cell differs, and the veil covered it; a colour fix away | — |
| 6 | Gap band drag | done: need slider under the gap chart; chart re-scales against €15,564, covered at or under it; tap-for-source part left out (simplest option) | `5425e0b` |
| 2 | Relief widget | **skipped** (fail-once rule): verify.py's link check read the static hand-off link `pension-calculator.html#monthly=100` as a missing anchor on three pages; reverted. Everything else had passed (contrast 6.31:1 and up, render-diff clean, the calculator taking #monthly=500 and ignoring an off-step value); the fix is a plain href with the fragment added by script | — |
| 10 | TCA capped part | done: the record as one bar to the larger of 2,080 and everything entered: paid, credits and HomeCaring Periods counted, the part over the caps greyed; full-record tick | `ba29618` |
| 19 | Phase staircase | done: four phases from AE_PHASES as a staircase in the rates assumption, stacked you / employer / State, the phase in use tagged | `a1ec57f` |
| 16 | 20% → 40% marker | done: the salary as one bar split at the cut-off the page uses for the chosen status, with both parts in euro | `663735c` |
| 22 | Glossary index + entitlement jump row | done: glossary term index held under the nav (follows it as it slides away) with the term in view marked; entitlement jump row under the result. New WARN: glossary deep links land below the index (C4) | `94f847c` |
| 23 | Drawdown mini calc | done: pot slider in the Drawdown entry, a month out at the calculator's own 4% illustration | `d4def54` |
| 25 | €1,000 profit toggle | **skipped**: it draws the director calculator's 52% / 48c, which rests on the 4% PRSI the check found out of date; building it would repeat a stale figure on a second page | — |
| 24 | Buddy's facts links | done: each game-over fact's "More on this in …" names its page as a link (target _top, glossary anchors where they exist) | `af86c03` |
| 13 | Product band tabs | done: five tabs on the home product band swapping shot, line and button; three new shots (compare, reality check, entitlement) via shoot-product.py | `d622ea4` |
| 20 | Screenshot arrows | done: two labelled arrows over the pension calculator photo (home band, pension tab only; starter callout); 600px and up | `ea6b40b` |
| 27 | "Before 6 April?" control | done: box under the entry year for years up to 2001; ticked, the module gets the year before; subnote and assumption reworded; spec S11 item 4 marked built | `1008d81` |
| 26 | Two-tone headlines | done: the second sentence of 17 two-sentence headings set quieter (opacity .68), index's locked sections and every h1 excepted | `820a843` |
| 28 | Footer wordmark | done: "Pensionbuddy" full width at the foot of every footer, in the logo's own face, ink at 7%, aria-hidden | `aaece61` |
| 18 | Mess to order | done: five pieces of paperwork scatter and settle under one card as the tracker's steps come into view; words only | `37441b7` |
| 29 | Show the workings (Mercury) | done: "How we got this" under the pension and director results: paid in, already saved, growth, the pot, and the income or corporation tax line; list veiled; the reality check's footnote already shows its sum | `f772818` |
| 30 | Share results (Mercury) | done: "Copy a link to these figures" on the five calculators; the inputs travel after the #, and opening the link replays them through each page's own handlers | `4a1ff49` |
| 31 | Closing fork (Mercury) | done: three situation cards before the home page's closing band, the hero chat's question and chips, each to its page | `264e003` |
| 32 | Calculators dropdown (Mercury) | done: a panel of the five tools, one line each, under the nav's Calculator link from 1201px; script-built, so the guarded nav markup is unchanged | `9fbd842` |
| 33 | Colour fade between bands (Mercury) | done: the home page's dark product band fades in from the wash above and out to the page below, inside its own padding; static seams, not a scroll-driven theme | `7bb81ce` |
| 34 | Static grain on dark bands (Mercury) | done: static white-noise grain at 7% over every dark band, one layer added to the shared .pb-dark rule on all sixteen pages; no motion | `ff9ad9b` |
| 21 | 52% as three segments | **not built**: the PRSI check did not confirm 4% | — |
| 17 | Scrollytelling | done: "First payslip to 66" on starter, a pinned card beside five steps (52 a year, 520, 15% to 40%, 2,080, 66), before the start-age chart | `f2c6395` |
| — | Re-shoot product rasters after the calculator changes | done: all five re-shot; the relief-limit card, the workings and the share link are left out of the shots like the boost card; width/height corrected on index, starter and director; home tab data re-embedded; the annotation label moved clear of the result sentence | `2a60920` |

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
- #7: card heading "Your relief limit"; caption "Revenue's limit on the contributions that get tax relief, as a share of earnings."; live line "At [age], relief applies to contributions up to €[limit] a year: [x]% of €[earnings]." (above the cap: "…of €115,000, the most Revenue counts."); note "Earnings count up to €115,000."; starter caption "Tax relief is there at any age. Revenue's limit on the contributions that get it rises with age, as a share of earnings."; director caption "The personal limit: the share of salary that gets tax relief, by age." (its note reuses the page's own "Company funding is not capped by the salary percentages that limit everyone else."); row labels "Under 30", "30 to 39" … "60 and over", tag "You".
- #6: slider label "What you expect to need"; value "€[x] a year"; result line "€[gap] a year short." or "Covered by the State Pension."; once moved, the need bar's caption reads "What you expect to need" (was the signed "What people expect to need", which it keeps until the slider moves); the chart's spoken label "Two bars. You expect to need [x] euro a year. The State Pension pays 15,564. The gap is [y]." / "…That is covered."
- #10: key "Paid [n]", "Credits and HomeCaring Periods counted [n]", "Over the caps [n]" (the page's own "credits and HomeCaring Periods" wording).
- #19: tag "Your year"; key "You", "Your employer", "The State"; column labels are the module's years ("2026 to 2028" …) and rates.
- #16: key "€[x] of your salary taxed at 20%" and "€[y] at 40%".
- #22: glossary index label (for screen readers) "Terms on this page"; entitlement "Jump to how the two calculations work or the assumptions."
- #23: label "A pot of"; "Drawing 4% a year from it is about €[x] a month." (the entry's own "not a recommendation" sentence sits directly above).
- #24: none: the line "More on this in [page]." is unchanged; the page name is now a link.
- #13: tablist label (screen readers) "The free tools"; tab names are the footer's tool names; new button "Open the entitlement check"; new line for the entitlement tab "What the State Pension would actually pay you, worked out both ways the Department does."; three new alt texts: "The auto-enrolment comparison: sliders for age, salary and contribution, with what goes into your pension each way and what each costs you.", "The State Pension reality check: a contributions slider, the weekly and yearly State Pension, and how much of three living standards it covers.", "The State Pension entitlement check: sliders for birth year, first PRSI year and contributions, with the weekly rate and both calculations side by side." Other lines and buttons reuse each tool's existing wording.
- #20: labels "Drag a slider" and "The figures follow" (decorative, aria-hidden).
- #27: box "My first payment was between 1 January and 5 April"; entry subnote now "Before 2002 the contribution year ran from April to April. If your first payment was between 1 January and 5 April of a year up to 2001, tick the box below and the page counts from the year before."; assumption bullet rewritten to describe the box (see the entitlement page's assumptions list).
- #26: no new words; only the treatment of existing headings changes.
- #28: none (the wordmark is the name, decorative and hidden from screen readers).
- #18: paper labels "Old statement", "P60", "Unopened envelope", "Which provider?", "Pension booklet"; card "One picture of what you have" (all decorative, aria-hidden).
- #29: summary "How we got this"; lines "Paid in, €[x] a month to [age]" / "Paid in by the company, €[x] a year to [age]", "Saved already" / "Built up already", "Growth at [g]% a year", "Your pot at [age]", "4% of it a year, over twelve months", "Corporation tax, 12.5% of each year's contribution".
- #30: button "Copy a link to these figures"; status "Link copied." or "Could not copy. The link is in the address bar."
- #31: none: the heading is the hero chat's "Which of these sounds most like you?", the card titles its three chips, the lines the offering list's.
- #32: none new beyond reuse: tool names from the footer; lines from the thank-you page (pension, director), the comparison page's lede, the offering list and the entitlement check's h1.
- #17: kicker "First payslip to 66"; heading "What builds up, and when."; steps "Your first payslip" / "Ten years in" / "All along the way" / "Forty years in" / "Sixty-six", each with a sentence built from existing site wording; card captions "contributions a year", "paid contributions: the qualifying minimum", "of earnings can get tax relief, rising with age", "reckonable contributions: a full record", "pension age"; bar label "Toward a full record of 2,080 contributions".

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
