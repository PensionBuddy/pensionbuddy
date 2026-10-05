# Give before ask (Run 42)

Run 42, 3 October 2026. Item 3 of the brief: find every place a page asks
for a booking before it has given a figure, a fact or a tool; list the page,
the ask in its own words, and what to give first; apply the clear ones by
moving the ask below the give. The nav button and the closing booking band
are never removed.

**Applied in this run:** the home page (by item 1, which rebuilt the hero),
the 404 page and the directors' rules page. Every other page is either
already giving first, or is held for you with a ready edit (the UNCLEAR rows
and the edits after the table). No words were changed by a move; each ask
keeps its reason line, "Free, 20 minutes, no obligation.", byte for byte.

**Run 43 (4 October 2026):** Damian answered question 7 "yes". S1, T1 and
D1 are applied as written below, and P1 as its cut (the three chat
pictures keep their question and answer; the link and its reason are
gone), commit `f9363a7` (STATUS, Run 43, item 1). Question 9's link
stays, words unchanged (C1 is not applied), and moved after "Email me my
results" under the results (Run 43, item 5). B1 is not applied
(question 8, default). Question 13: no band added on my-pensions, and
question 10: the threshold page's band and card kept (default); item 5
adds one ask after each result, so my-pensions gains a booking link after
its list and the threshold page ends with three asks (STATUS, Run 43). At
main `6af9f77` the starter's hero lines were 2487-2488 and S1's anchor
2582/2583, one line later than below. Every reason line quoted here now
reads "Free · 20 minutes · no obligation · easy to reschedule.".

Line numbers are this branch's after item 1 (the home page) and after this
item's two moves (the 404 page and the directors' rules page). Every other
page's lines are unchanged from main.

## What counts

- **An ask** is a booking link or button, with or without its reason line,
  that a reader meets in the page.
- **A give** is a figure, a fact with a source, or a tool the reader can use
  (a slider, a picker, a checklist, a search box, a list of topics).
- **Exempt everywhere:** the nav button "Book a call with Damian for free";
  the footer's "Book a call"; each page's closing band.
- **Not asks:** the announce bar's "Free first consultation" (no link); Ask
  Buddy's panel button (its booking link follows the answers); the saved
  report's booking line (`assets/js/pb-report.js:133`, after the figures).

## The table

Verdicts: **CLEAR, applied** (moved in this run); **UNCLEAR, for you** (a
ready edit below, waiting on your answer); **no move** (the give already
comes first, or the ask is exempt).

| Page | The ask, word for word (file:line) | What to give first | Verdict |
|---|---|---|---|
| index.html | Main's hero: "Get my free review", "Free, 20 minutes, no obligation." and "Try the calculator" (main `index.html:2483-2485`), on the first screen, under the h1 "One call. To know where you stand." | The gap: the shortfall figure, the three bars, their source, the slider, "79% feel unprepared." and the way-of-life picker | **CLEAR, applied by item 1.** The hero is now the gap: the h1 "People know roughly what they’ll need.", the sub-line, "€25,296 a year short.", the bars, "Royal London Ireland, 2026.", the slider and the regulator and QFA line, with no booking link in it. The three lines moved whole, unchanged, into `#life` (`index.html:2628-2632`), after the provider logos, after "79% feel unprepared." and its source, and after the way-of-life picker. The nav button stays. On a phone the booking bar (`pb-bookbar.js`) now rises only once the gap hero has scrolled off, which is after the give |
| index.html | The Buddy chat picture: "Book a call with Damian for free" (main `index.html:2504`), in the hero beside the old h1 | Buddy's answer to "Is the first chat really free?" (the FAQ's second answer, word for word) precedes the link inside the picture | **CLEAR, applied by item 1.** The picture moved whole, its caption "Illustration only · the value of investments can fall as well as rise" included, into "How a call with Damian works" (`#call`), after the three steps (`index.html:2911-2927`; the link at 2923). Removing it is question 2 of the run (its caption is one of the site's classified caveats) |
| index.html | "How a call with Damian works", the three steps (`index.html:2907-2909`); the FAQ's "Is the first chat really free?" (2940); the closing band's "Book your free call" (2961) | They follow every give on the page | no move (the steps and the FAQ are not links; the band is exempt) |
| starter.html | "Help me get started" and "Free, 20 minutes, no obligation." (`starter.html:2486-2487`), in the hero, first screen | The h1 already states a rule: "No pension yet. Tax relief is there at any age." The first figures are "What builds up, and when." (2527-2547) and the 30, 40 and 50 chart (2549-2581) | **UNCLEAR, for you** (question 7): the h1 gives a rule first, and the four audience heroes were approved together. Ready edit S1 below |
| starter.html | The chat picture: "Have I left it too late to start?", Buddy's answer, "Book a call with Damian for free" and "Free, 20 minutes, no obligation." (`starter.html:2499-2502`) | The answer (the page's first FAQ, word for word) precedes the link inside the picture | **UNCLEAR, for you** (question 7): keep it, move the link with the hero button, or cut the link. Ready edit P1 below |
| starter.html | The guide form's failure text "If it didn't, book a free call and Damian will walk you through it." (`starter.html:2877`) | It follows the guide form | no move |
| tracker.html | "Help me find my pensions" and "Free, 20 minutes, no obligation." (`tracker.html:2278-2279`), in the hero | **Nothing, by the test.** The h1 "The statements went in the bin. The pension didn't." (2275) is a slogan, and the lede "Most people who've changed jobs have pension money sitting somewhere, often more than they'd guess." (2276) is a claim without a source. The page's gives are the three steps (2321-2323) and the tick list `#pbTrace` (2325-2332), a tool. The page has no figure | **UNCLEAR, for a different reason.** This is the home hero's case, but the move lands the button and its reason after `#pbTrace` (2332), directly above the dark band's own "Start finding mine" and its reason (2341-2342): two asks in a row. So the real choice is move, cut one of the two, or keep, which is a cut item 3 does not allow; item 5 lists the two as T-1 and T-7. Held with its siblings for that reason, not because it gives first (question 7). Ready edit T1 below |
| tracker.html | The chat picture's "Book a call with Damian for free" and its reason (`tracker.html:2293-2294`) | The page's first FAQ answer precedes it inside the picture | **UNCLEAR, for you** (question 7). Ready edit P1 below |
| tracker.html | "Start finding mine" and its reason in the dark band (`tracker.html:2341-2342`) | The steps and the tick list precede it | no move (item 5 lists it, T-7) |
| tracker.html | The guide form's failure text "If it didn't, book a free call and Damian will walk you through it." (`tracker.html:2463`) | It follows the form | no move |
| director.html | "Book a call with Damian for free" and "Free, 20 minutes, no obligation." (`director.html:2272-2273`), in the hero | The lede states two facts ("Your business can contribute far beyond personal limits, and those contributions can reduce its corporation tax."); the first figures are the €1,000 toggle (2309-2310) and the relief ladder (2318-2327) | **UNCLEAR, for you** (question 7). Ready edit D1 below. "Try the director calculator" (2274) stays in the hero |
| director.html | The chat picture's "Book a call with Damian for free" and its reason (`director.html:2287-2288`) | The page's first FAQ answer precedes it inside the picture | **UNCLEAR, for you** (question 7). Ready edit P1 below |
| director.html | FAQ sentences: "…the free chat works it out." (2427) and "Twenty minutes, phone or video, free and with no obligation." (2430) | They follow every give | not links; item 5 lists them (D-12, D-13) |
| booking.html | The form's "Show me the calendar" (`booking.html:2094`) | The page's gives are the terms of the call: the timeline (2029-2031), the promise, the tiles and the qualifications. The "what we do not ask" note is pinned after the form (build check 21) | no move (the page is the booking) |
| thank-you.html | None beyond the nav and footer | Nothing | nothing |
| 404.html | "Book a call with Damian for free" (`btn-ghost`) and "Free, 20 minutes, no obligation.", on the first screen beside "Back to the homepage" (main `404.html:2089`, 2091) | The search box (2094-2099) and "Six places to begin." (2100-2108) | **CLEAR, applied.** "Back to the homepage" stays alone in the top row; the booking button and its reason now follow the six places (`404.html:2109-2110`). Measured in Chrome: at 375 the button is at y 1735 (was in the first screen), at 1440 at y 1294 |
| how-we-work.html (held) | None | Nothing | nothing |
| games/buddys-run.html | "Book a call with Damian for free" and its reason (`games/buddys-run.html:246-247`), in the game-over panel `#ovOver` | The run and "Buddy's fact" precede it | no move (`tests/games.test.py:1024-1029` pins one link) |
| games/jargon-battle.html | "Book a call with Damian for free" (`games/jargon-battle.html:274`), after "Still puzzled by a term? Damian explains them for a living, and the first call is free." (273) | Eight terms answered | no move |
| pension-calculator.html | "Talk it through, free" and its reason (`pension-calculator.html:2549-2550`), in "The cost of waiting" | The sliders, `#potOut` and `#incOut`, and the card's own figure precede it | no move (item 5 lists it for you, P1) |
| pension-calculator.html | The email capture (2583-2600) | All the results | no move |
| director-calculator.html | "Talk it through, free" and its reason (`director-calculator.html:2689-2690`); the email capture (2703-2720) | The results | no move (item 5 lists the link, D1) |
| broker-vs-autoenrolment.html | "Talk through what this means for you" and its reason (`tools/compare-parts/main.html:71-72`), in "In one sentence", the first results card | `#leadOut`'s verdict sentence precedes it, but it sits above the big figures and the charts, and is the closing band's label word for word | **UNCLEAR, for you** (question 9): cut it (Run 41's subtraction audit, compare row 3), move it to the end of "Everything paid in, by 66" (`#pbMyCard`, after part line 106, inside the card), or leave it. Ready edit C1 below |
| broker-vs-autoenrolment.html | "Talk the choice through with Damian" and its reason (part lines 216-217) | It is inside `#riskCard`, hidden since Run 30 | nothing to move |
| pension-fees-calculator, state-pension-reality-check, state-pension-entitlement, pia, my-pensions | The closing band only (my-pensions has none) | Nothing | nothing (question 13: my-pensions has no band) |
| standard-fund-threshold.html | The panel's subnote "…which Damian can work out with you." (`tools/sft-parts/main.html:14`), under the first slider | The slider | not a link; no move |
| standard-fund-threshold.html | "Next step", "Book a call with Damian for free", "Free, 20 minutes, no obligation." (`tools/sft-parts/main.html:88`), after the rules | Everything on the page | no move: a second closing ask (question 10; build check 38's GUIDES list pins it) |
| find-my-pension.html (held) | "Book a call with Damian for free" and its reason in step 4 (`tools/finder-parts/main.html:76-77`) | The letter, signed and sent | no move |
| pension-readiness-check.html (held) | "Talk it through with Damian, free" and its reason (`tools/readiness-parts/main.html:33-34`), at the foot of `#rdResult` | The score | no move |
| director-pension-rules.html | "Book a call with Damian for free to go through them." and "Free, 20 minutes, no obligation." (main `tools/director-rules-parts/main.html:74-75`), above `#drList`, the list it points at | The list of topics | **CLEAR, applied.** "Topics to discuss, not advice." stays above the list; the booking sentence and its reason now follow the list (`tools/director-rules-parts/main.html:74-77`; `page.css:31-32` spaces it). Measured in Chrome after the four answers and "Show what to talk about": the list, then the booking sentence 16px below it, then the reason; focus lands on "Worth talking through"; `#drBook` still points to `booking.html#persona=director` |
| pensions-over-50, self-employed-pensions, uk-pensions-in-ireland, old-pension-checklist, director-year-end-checklist | One closing paragraph each with its ask: "Book a free call with Damian" (pensions-over-50, uk-pensions-in-ireland), "book a free call with Damian" (self-employed-pensions, old-pension-checklist), "Book a free call" (director-year-end-checklist), and its reason (`pensions-over-50.html:2084-2085`; `self-employed-pensions.html:2078-2079`; `uk-pensions-in-ireland.html:2076-2077`; `old-pension-checklist.html:2102-2103`; `director-year-end-checklist.html:2101-2102`) | All the fact sections | no move (each is its page's closing band) |
| glossary.html | The phone booking bar ("Book a call with Damian for free" and its reason, built by `assets/js/pb-bookbar.js`), rising as soon as `.page-head` scrolls off, while the game cards are on screen and before the first term (`glossary.html:2292`) | The first definitions | **UNCLEAR, for you** (question 8). Ready edit B1 below |
| starter, tracker, director | The same phone bar, rising as soon as the hero scrolls off, before any figure | The first figures | **UNCLEAR, for you** (question 8; Run 41's question 20). Ready edit B1 below |
| privacy.html (2093), terms.html (2083), complaints.html (2074) | "Prefer to talk it through? Book a time on the booking page and we will be glad to help." (privacy); "Prefer to talk it through? Book a time on the booking page." (terms); "You can also book a time to talk it through on the booking page." (complaints) | The whole notice | no move (legal pages; item 5 lists them, P-1 to P-3) |

## The ready edits, for the UNCLEAR rows

None of these is applied. Each moves words, never changes them; each keeps
the reason line byte for byte (`trust_drift` holds every `p.pb-why` to it).
These pages are hand-written, so the edit is made in the page itself.
After any of them: `python3 tests/build.test.py`, `node tests/boxes.test.mjs`,
`node tests/floating-chrome.test.mjs`, and `tools/verify.py` on the page;
measure the new block's spacing at 375 and 1440 before committing.

### S1. starter.html: the hero button after the first figures

*Applied in Run 43 (`f9363a7`), now `starter.html:2603-2606`.*

Take these two lines out of the hero's `.hero-cta` (`starter.html:2486-2487`),
leaving "Try the calculator" there alone:

```html
      <a class="btn btn-acc" href="booking.html">Help me get started <svg class="ico" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      <p class="pb-why">Free, 20 minutes, no obligation.</p>
```

and put them in a new block after the `</div>` that closes the first `.pb-sa`
(the 30, 40 and 50 chart, its warning and its note; `starter.html:2581`),
before `<div class="pb-sa pb-wait" id="pbWait">` (2582):

```html
  <div class="hero-cta" style="margin-top:22px">
      <a class="btn btn-acc" href="booking.html">Help me get started <svg class="ico" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      <p class="pb-why">Free, 20 minutes, no obligation.</p>
  </div>
```

Build check 28 is unaffected (the phone marker stays where it is).

### T1. tracker.html: the hero button after the tick list

*Applied in Run 43 (`f9363a7`), now `tracker.html:2332-2335`; both asks kept.*

Take `tracker.html:2278-2279` ("Help me find my pensions" and its reason) out
of the hero's `.hero-cta`, leaving "Try the calculator", and put them in a
new `<div class="hero-cta" style="margin-top:22px">` after the `</div>` that
closes `#pbTrace` (2332), before `</div></section>` (2333).

**Read this before applying it.** The dark band's "Start finding mine" and
its reason (2341-2342) follow seven lines later, so the page would ask twice
in a row. The alternatives: cut the hero button and its reason outright
(item 5's T-1), so the band is the page's one ask after the tick list; or
cut the band's button (T-7); or keep the hero as it is. (Corrected in Run
43: the dark band is the mid-page "Worth knowing" callout, not the closing
band, so this run's rule on closing bands did not forbid T-7; Run 43 kept
both asks, the conservative default.)

### D1. director.html: the hero button after the relief ladder

*Applied in Run 43 (`f9363a7`), now `director.html:2341-2344`.*

Take `director.html:2272-2273` ("Book a call with Damian for free" and its
reason) out of the hero's `.hero-cta`, leaving "Try the director
calculator", and put them in a new `<div class="hero-cta" style="margin-top:22px">`
after the `</div>` that closes `.pb-lad` (2327), before `</div></section>`
(2328).

### P1. The audience pages' chat pictures

*Run 43: the cut applied on all three pages (`f9363a7`), how "yes" to "And their chat pictures?" was read.*

Three choices, the same on each page: keep the picture as it is (the answer
already precedes the link); move the link with the hero button (only if S1,
T1 or D1 is applied); or cut the link and its reason from the picture, so it
holds the question and Buddy's answer only. The cut is these two lines:

- starter.html 2501-2502
- tracker.html 2293-2294
- director.html 2287-2288

each of them:

```html
        <p class="pb-phone-link"><a href="booking.html">Book a call with Damian for free</a></p>
        <p class="pb-why">Free, 20 minutes, no obligation.</p>
```

### C1. broker-vs-autoenrolment.html: "Talk through what this means for you"

*Not applied. Run 43 moved the link, words unchanged, to after "Before you rely on these rates" and the new "Email me my results" (item 5).*

The page is built from parts: edit `tools/compare-parts/main.html`, then
`python3 tools/pagebuild.py compare`, and the render-diff proof applies
(a protected page). Either cut lines 71-72:

```html
      <a class="wlink" href="booking.html">Talk through what this means for you <svg class="ico" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
      <p class="pb-why">Free, 20 minutes, no obligation.</p>
```

or move them to the end of `#pbMyCard`: after the note `<p class="pb-my-note">`
(line 106), before the card's closing `</div>` (line 107). The card shows in
Mode 1 only, so in Mode 2 the page's one ask is the closing band.

### B1. The phone booking bar: wait for the first figures

*Not applied in Run 43 (question 8, default).*

One line in `assets/js/pb-bookbar.js` (line 76) and a data attribute per page.

```js
  var hero = doc.querySelector('main header.hero, main .page-head');
```

becomes

```js
  var hero = doc.querySelector('main [data-pb-bookbar-after]') || doc.querySelector('main header.hero, main .page-head');
```

The plan wrote this as one selector list,
`doc.querySelector('main [data-pb-bookbar-after], main header.hero, main .page-head')`.
That would not work: `querySelector` returns the first match **in the page's
order**, not in the list's order, so the hero (or the glossary's
`.page-head`, which comes before `#games`) would still win and nothing would
change. The two-step lookup above is the fix.

Then `data-pb-bookbar-after` on the section whose end should raise the bar:

| Page | Element | So the bar rises |
|---|---|---|
| glossary.html | `<section class="arcade" id="games">` (2226) | after the game cards, at the first term |
| starter.html | `<section class="pb-story-sec">` (2527) | after "What builds up, and when." |
| tracker.html | `<section style="padding-top:0">` (2310), the steps and the tick list | after the tick list |
| director.html | `<section>` (2295), "Four things" | after the €1,000 toggle and the ladder |

The bar shows once that element has scrolled fully off the top of the screen
(the existing observer; nothing else changes). After the edit:
`python3 tools/stamp-images.py` (five pages' `?v=` for the script), the WHEN
paragraph of the file's head comment, and `docs/UX-MOTION-AUDIT.md` 3b;
then `node tests/floating-chrome.test.mjs` and `node tests/ux4.test.mjs`,
both of which drive the bar.

## Questions for you

These carry the run's numbers.

7. The three audience heroes ask on the first screen. Starter's h1 states a
   rule first and director's lede two facts, so they are not clear moves.
   Tracker's hero gives nothing first, but moving its button lands it
   directly above the dark band's "Start finding mine": move it there, cut
   one of the two (which?), or keep it? Apply S1 and D1 too? And the chat
   pictures (P1)?
8. The phone booking bar on starter, tracker, director and the glossary
   rises as soon as the hero or page heading scrolls off, before any figure.
   Have it wait for the first figures (B1), or leave it?
9. The comparison page's "Talk through what this means for you" in "In one
   sentence": cut it, move it to the end of "Everything paid in, by 66", or
   leave it (C1)?
10. standard-fund-threshold ends with two booking asks (the band and the
    "Next step" card). Merge the card into the band (a change to build check
    38's GUIDES list)?
13. my-pensions.html has no closing booking band. Intended?
