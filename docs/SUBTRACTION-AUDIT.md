# Subtraction audit

Run 41, 1 October 2026. Every page, at 375 and at 1440, judged against
`docs/DESIGN-RUBRIC.md` and the seven reference captures, for one question
only: **what to cut, and what to merge.** Nothing has been built or
changed; nothing new is proposed. Each row names the rule it serves (R1 to
R10, or the section caps in the rubric's section 5) and roughly how many
phone screens it gives back.

## How it was done

- **Captures.** Every page as real screens, 375 x 812 and 1440 x 900, one
  per scroll position (JavaScript on, reduced motion forced, the cookie
  choice made): 539 screens in all, cut into sheets of four. The first set,
  taken the way `verify.py` takes its full-page shots, in one window as
  tall as the page, was wrong on three captures: "Your pension through life"
  on the home page, and a section on the starter page, are sized in
  viewport heights, so in a 14,000px window they swelled and pushed
  everything after them out of the picture (8 of 18 screens blank on the
  home page at 1440, 6 of 22 on starter at 375). Every page was shot again
  screen by screen, and the two audits that had read the bad sheets read the
  new ones. **The same trap is in `verify.py`'s full-page screenshots** for
  those two pages: worth knowing before trusting them.
- **Measurement.** Sections, buttons, pictures, colours and type per page,
  from the same headless Chrome run that gives the rubric its numbers.
- **Reading.** Six agents read every sheet of their pages against the
  rubric, with one brief (cut and merge only; the warnings, the information
  box, the regulator and review lines, sources, inputs and results, the nav,
  the footer and the countdown untouchable). Their findings were checked
  against the screens before going in here: the home page in full at both
  widths, the glossary's games block and risk tiles, PIA's comparison table
  and "Who it might suit", the starter page's three small calculators and
  its auto-enrolment block, the director calculator's safe (still on the page:
  Run 32 kept it as a still picture), and the compliance pack's B.16 for the
  booking lines.
- **Screens** below are whole pages, footer included (the footer alone is
  2.8 screens at 375). The rubric's caps count to the top of the footer.

## The summary

| Page | Type | Sections now → after | Screens at 375 now → after | Cuts and merges |
|---|---|---|---|---|
| `index` | Home | 19 → 8 | 24.4 → about 10 | 11 |
| `starter` | Audience | 13 → 5 | 21.4 → about 8.5 | 8 |
| `director` | Audience | 8 → 5 | 13.9 → 9.8 | 5 |
| `tracker` | Audience | 6 → 5 | 11.2 → 8.6 | 5 |
| `booking` | Booking | 1 | 5.7 → 4.9 | 3 |
| `pension-calculator` | Calculator | tool + 2 | 13.5 → 11.8 | 7 |
| `director-calculator` | Calculator | tool + 2 | 14.8 → 12.8 | 6 |
| `broker-vs-autoenrolment` | Calculator | tool + 2 | 18.4 → 15.5 | 6 |
| `pension-fees-calculator` | Calculator | tool + 2 | 11.6 → 11.3 | 1 |
| `state-pension-reality-check` | Calculator | tool + 3 → tool + 2 | 13.4 → 11.3 | 2 |
| `state-pension-entitlement` | Calculator | tool + 3 → tool + 2 | 19.2 → 16.2 | 4 |
| `standard-fund-threshold` | Calculator | tool + 3 → tool + 2 | 10.9 → 10.2 | 2 |
| `pia` | Calculator | 7 → 3 | 24.5 → 16.8 | 5 |
| `my-pensions` | Calculator | tool + 2 | 6.2 → 6.0 | 1 |
| `pension-readiness-check` (held) | Calculator | tool + 1 | 5.0 → 5.0 | 2 |
| `find-my-pension` (held) | Calculator | tool + 2 | 6.4 → 5.8 | 3 |
| `director-pension-rules` | Guide | article + 2 → + 1 | 10.2 → 9.9 | 1 |
| `director-year-end-checklist` | Guide | article + 2 | 6.7 → 6.7 | 1 |
| `old-pension-checklist` | Guide | article + 2 | 6.5 → 6.3 | 1 |
| `pensions-over-50` | Guide | article + 3 → + 2 | 8.3 → 7.8 | 3 |
| `self-employed-pensions` | Guide | article + 2 → + 1 | 6.9 → 6.4 | 1 |
| `uk-pensions-in-ireland` | Guide | article + 2 → + 1 | 7.1 → 6.6 | 1 |
| `glossary` | Guide | article + 3 → + 2 | 15.2 → 12.3 | 4 |
| `privacy` | Legal | text + related | 7.8 → 7.7 | 1 |
| `terms` | Legal | text + related | 11.4 → 11.3 | 1 |
| `complaints` | Legal | text + related | 5.3 → 5.25 | 1 |
| `how-we-work` (held) | Legal | text | 8.0 | none |
| `404` | Booking | 3 | 4.9 → 4.8 | 1 |
| `thank-you` | Booking | about 4 → 3 | 6.0 → about 5 | 3 |
| `games/buddys-run`, `games/jargon-battle` | Game | 1 | 1 | none |

The home page and the starter page are where most of it is: 14 of the
home page's 24 phone screens go, and 13 of starter's 21. The calculators
lose their add-ons, not their results. The guides and legal pages are
already close to the rubric and lose only duplicated links.

---

## Cut once, site-wide

Twelve things repeat across pages; each is one decision, made once.

| # | What | Where | Rule | Saves at 375 |
|---|---|---|---|---|
| S1 | **"Your paw prints"**, the four-badge tracker (Runner, Buster, Cruncher, Tracker Paw) | pension, director and auto-enrolment calculators, reality check, entitlement check, glossary | §5 one idea a section; not a result | 0.45 to 0.8 a page |
| S2 | **"Take a guess first"** and the blur over the results until "Reveal the illustration" | pension, director and auto-enrolment calculators | R8; a game that holds the result back | about 0.4 a page |
| S3 | **"The cost of waiting"** card and its "Talk it through, free" | pension and director calculators | §5 one action; repeats the closing band | 0.4 a page |
| S4 | **Two email routes**: the "Email them to yourself" button and the "Want these figures emailed to you?" card: keep one | pension and director calculators | R8 | 0.07 to 0.55 a page |
| S5 | **A "Next step" card** straight above "Related pages", doing a related page's job | `director-pension-rules`, `pensions-over-50`, `self-employed-pensions`, `uk-pensions-in-ireland`, `standard-fund-threshold`, `pia` | §5, R8 | 0.3 to 0.5 a page |
| S6 | **Extra links in a guide's closing paragraph** ("Want to go through it?", "Want help with it?") that repeat the related cards below: keep only the booking link | `director-year-end-checklist`, `old-pension-checklist`, `pensions-over-50`, `my-pensions` | §5 repeated ideas | about 0.1 a page |
| S7 | **"Prefer to talk it through? Book a time…"** inside the legal text | `privacy`, `terms`, `complaints` | §5 legal pages are the text alone | 0.05 to 0.1 a page |
| S8 | **Tinted icon squares and tinted ticks** beside text | `thank-you` (six cards), the email card on the calculators, `pension-readiness-check`, `find-my-pension` | R9 working icons only | 0.3 on thank-you, else 0 |
| S9 | **Amber as decoration** (keep the figures, lose the fill) | the pension calculator's "What Revenue adds" card fill (the bar inside keeps its amber), the director calculator's "Roughly what you could aim for", the glossary's risk tiles 5 to 7, thank-you's "house promise" eyebrow | R4, R5: amber means tax relief or the gap, in a chart | 0 |
| S10 | **The Buddy chat card under the hero**, each a copy of the page's first FAQ question | `index`, `starter`, `director`, `tracker` | §5 repeated | about 0.5 a page (0.9 on the home page) |
| S11 | **"If any of this is you…"**, three reassurance cards | `starter`, `director`, `tracker` | R6 | 1.1 a page |
| S12 | **Repeated reassurance**, "Free, 20 minutes, no obligation" said more than once a page | the home page three times, thank-you three times, the finder three times | §5 repeated ideas | small |

---

## Page by page

### index.html — Home; 19 sections (cap 8); 24.4 screens at 375 (cap 14 above the footer)

| # | Action | What, where (screen at 375) | Rule | Why | Saves at 375 |
|---|---|---|---|---|---|
| 1 | CUT | The Buddy chat card in the hero ("Is the first chat really free?", "Which of these sounds most like you?" chips, its link and caption) (s2) | §5 repeated ideas; hero at most a screen | It is the FAQ's question and the chooser's three cards again; at 1440 it fills the second screen, so the hero is 1.5 screens | 0.9 |
| 2 | CUT | "What's changed?" life-event chips (s2.5) | §5 repeated ideas | A third "which one are you" before the page has said anything | 0.3 |
| 3 | CUT | In "The gap": the "Start from a way of life" chooser (Single, Couple; Modest, Moderate, Comfortable), its source and caveat (s4–5) | §5 no calculator on the home page; one idea a section | A second tool inside the gap. The three-figure chart, its sources and the slider stay | 1.0 |
| 4 | CUT | "Just here to learn? Play the jargon buster." and the two game cards (s5–6) | R9 two pictures; §5 another page's job | The games stay in the nav and the footer | 1.3 |
| 5 | CUT | The dark product band, "You know what goes in. This shows what comes out.", its five tool chips, "Open the calculator" and the product shot (s6–8) | R5 (two filled aqua on one screen), §3 (a third dark band), R8 | The hero's "Try the calculator" and "Six places to begin" already go there | 1.6 |
| 6 | CUT | "What changes, and when.", the age timeline (s9–11; screens 8 to 11 at 1440, its sticky card mostly empty and out of step) | §5 another page's job | Guide content on the home page | 1.6 |
| 7 | MERGE | "Father, son, dog." with "Damian Condon", "Adam Condon" and "Buddy" (s12–17: four sections, three full-height portraits). The story and its words survive with one picture; the long bios, the qualifications chips (in the hero and the footer already), and the Adam and Buddy profiles go | R6, R9 one picture a section; no team headshots | Six screens of team page; the footer's "About" points at `#story`, so the section stays | 3.8 |
| 8 | CUT | "No small print: Who you are actually dealing with." (s17–18) | §5 repeated; legal text in the footer | Very nearly the footer's own paragraph. The information box under it stays where it is | 0.7 |
| 9 | CUT | The three empty video slots with a paw in "How a call with Damian works" (s18–20); the three steps stay | R9 nothing empty ships | Placeholders | 1.2 |
| 10 | CUT | "You'll have questions before you call." FAQ, five questions (s20–21) | no FAQ on a home page (all seven references) | "Is the first chat really free?" is the hero's own line | 1.0 |
| 11 | MERGE | "Which of these sounds most like you?" (s21–22) into "Six places to begin." (s8–9) | §5 repeated ideas | Its three cards are Six places' first three, nearly word for word | 0.9 |
| — | Note, R1 | "Six places to begin.": the six link headings are about 46px, bigger than the section's own heading; the section is 1.7 screens at 1440 | R1 | The heading is outranked by its own items | — |

After: 8 sections, about 10 screens at 375 and 8.5 at 1440 (from 17.6),
in this order: the hero; the provider logos; the gap (chart, sources, "79%
feel unprepared"); Six places to begin; the "Rules as at" line and the
deadline band; "Father, son, dog."; the information box, then how a call
works in three steps; the closing band. Two dark bands, not touching; one
filled aqua button a screen; four button labels.

The "Rules as at 24 September 2026" line sits under the timeline today;
when the timeline goes, it stays directly above the deadline band, whose
slider it also dates.

### 404.html — 3 sections (cap 3); 4.9 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "Looking for something in particular? The jargon buster or the pension calculator are good places to start." (s1) | §5 repeated | The search and "Six places to begin" below do this | 0.15 |

Already passes.

### thank-you.html — about 4 blocks (cap 3); 6.0 screens (cap 5)

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | The dark "house promise" card, "No jargon. No pressure. No obligation.", amber eyebrow (s1–2) | R4/R5 (amber as decoration), §5 repeated | The lede already says free, no obligation | 0.3 |
| 2 | CUT | The "20 minutes, that's it" and "Phone or video" cards (s2) | §5 repeated | The lede and the "On the day" step say both | 0.35 |
| 3 | CUT | The icon squares on the six cards (s2–4) | R9 (S8) | Decoration; the cards get shorter without them | 0.3 |

After: 3 sections, about 5 screens.

### The games — one screen each

Nothing around either game should go. Jargon Battle's amber "Start the
battle" is the game's own art, not decoration.

---

### starter.html — Audience; 13 sections (cap 6); 21.4 screens at 375 (cap 10 above the footer)

| # | Action | What, where (screen at 375) | Rule | Why | Saves at 375 |
|---|---|---|---|---|---|
| 1 | CUT | The Buddy chat card under the hero, "Have I left it too late to start?" (s1–2) | §5 repeated | The page's first FAQ question | 0.5 |
| 2 | CUT | "If any of this is you, you're in the right place.", three cards (s2–3) | R6 | Reassurance with no action | 1.1 |
| 3 | CUT | "Three steps. Plain English, no pressure." (s3–4) | R6, §5 | How a call works belongs to the booking page, which has it (First, Then, After) | 1.0 |
| 4 | CUT | "What builds up, and when.", the pinned State Pension timeline (520, 2,080, sixty-six) (s4–6) | §5 another page's job | The entitlement check's job; the page says it again lower down | 2.4 |
| 5 | MERGE | "The same monthly amount, started at 30, 40 and 50.": the 30/40/50 chart stays with its warnings; "If you wait." and "Time out." (with HomeCaring), each with its own warnings, go (s8–10) | R6, R7 | Three small calculators for one point; the pension calculator and the entitlement check do the rest | 3.0 |
| 6 | CUT | In "Revenue helps you save.": the product shot (s12), "See it for your age and salary" (s11) and the age-band bars below the band (s12–13) | R9, R8, §5 repeated | The link repeats "See what I could build"; the age table is on the director page too | 1.0 |
| 7 | CUT | "Your employer and the State pay into auto-enrolment…": the slider, "Once you are enrolled: what happens when", the rates to 2035, the PIA note, "Compare the two side by side" (s13–15) | §5 another page's job, R5 | The auto-enrolment comparison is in related pages and has all of it, sources included | 2.9 |
| 8 | CUT | "What the State Pension actually leaves you to find." and its filled button (s16–17) | R5, §5 | Its filled button shares a screen with "Send me the guide"; the reality check's job | 1.0 |

After: about 5 sections (the 30/40/50 chart, Revenue, the guide, the FAQ,
the closing band), about 8.5 screens at 375; button labels from 7 to 4.
Every amber screen on this page is a chart's (the "less" bars), so none is
cut for amber; the R5 failures are the filled buttons on screens 15 to 17
(12 at 1440), which rows 7 and 8 remove. Starter has 40 size and weight
combinations, the most of any page (R1).

### director.html — Audience; 8 sections (cap 6); 13.9 screens (cap 10)

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | The Buddy chat card, "How much can my company actually contribute?" (s2) | §5 repeated | Word for word the first FAQ question | 0.5 |
| 2 | CUT | The age-band relief table in "Four things only a director gets." (s3–4) | §5 repeated | The starter page's table; "not capped by salary percentages" is said four times here | 0.4 |
| 3 | CUT | "If any of this is you, it's worth a chat.", three cards (s4–5) | R6 | The same block as on starter and tracker | 1.1 |
| 4 | MERGE | "The coverage gap" band (57% and 68%, filled "Try the director calculator") into the dark "You don't know the number." band, which survives with its outline button and shot (s5–7) | R8, R5, R6 | Two calculator calls back to back | 0.8 |
| 5 | CUT | "What changed, and how close you are to the cap.", four links (s7–8) | §5 a link, not a section | Related pages has the 2026 rules and the checklist; the threshold and PIA are in the footer | 1.3 |

After: 5 sections, about 9.8 screens; two dark bands, not touching.

### tracker.html — Audience; 6 sections (cap 6); 11.2 screens (cap 10)

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | The Buddy chat card, "I don't have any of the paperwork, is that a problem?" (s1–2) | §5 repeated | Word for word the first FAQ question | 0.5 |
| 2 | CUT | "If any of this rings true, you're in the right place.", three cards (s2–3) | R6 | The same block as on the other two | 1.1 |
| 3 | CUT | The papers gathering into "One picture of what you have" in "Three steps" (s3) | R9 decoration | (`ILLUSTRATIONS.md` number 6 would paint it instead; the audit's answer is neither) | 0.4 |
| 4 | CUT | "Your paw prints" and "Tick these off as you go" (s4–5) | S1, R6 | The ticks are steps 1 to 3 again; four empty badges | 0.6 |
| 5 | CUT | "Start finding mine" in the dark "Forgotten pensions…" band (s5) | R8 | A fifth label doing the hero's job | 0 |

After: 5 sections, about 8.6 screens, four labels.

### booking.html — 1 section (cap 3); 5.7 screens (cap 5)

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | The dark "house promise" box, amber eyebrow (s2) | S9, §5 repeated | The lede says no obligation | 0.3 |
| 2 | CUT | The "20 minutes, that's it" and "Phone or video" tiles and their icon squares (s2) | S8, §5 repeated | The h1 and lede, word for word | 0.3 |
| 3 | CUT | "Damian's qualifications and memberships" chips (s2) | §5 repeated | The footer shows them a screen later | 0.2 |

After: about 4.9 screens; the form moves up from screen 3 to about 2.

The three audience pages share four blocks that go together, once: the
Buddy chat card under the hero (each a copy of its own first FAQ question),
"If any of this is you…" with three cards, "Three steps" (starter and
tracker; booking keeps its own), and the age-band relief table (starter
and director). Their shared tail (the guide, "Questions, answered.", the
information box, the closing band, related pages) is right, and stays.

---

### pension-calculator.html — tool + 2; 13.5 screens (the tool 7)

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "Take a guess first" and its reveal (s3) | S2 | | 0.4 |
| 2 | CUT | "Your paw prints" (s8) | S1 | | 0.45 |
| 3 | CUT | "The cost of waiting" (s5) | S3 | | 0.4 |
| 4 | MERGE | "Add just €100 a month…" card and its icon (s7) into "How your pot could grow", which already draws the "With an extra €100/month" line | §5 repeated, R9 | The same figure twice | 0.25 |
| 5 | MERGE | The two email routes (s5, s7): keep one | S4 | | 0.07–0.55 |
| 6 | CUT | The amber card fill on "What Revenue adds" (s6); the figures and the teal-and-amber bar stay | S9 | | 0 |
| 7 | CUT | "Save as A" (s4–5) | R8 | A second tool and another button label, not a result | 0.1 |

After: about 11.8 screens; button labels from 7 to about 4. Keep: the
sliders, the result card, "How we got this", the chart, "What Revenue
adds", "Your relief limit", the closing band, the assumptions, related.

### director-calculator.html — tool + 2; 14.8 screens (the tool 8)

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | The drawn safe, "Corporation tax saved" (`#pbSafe`), in the result card under the corporation tax figure (s4) | R9 | A picture inside a result, saying what the figure above it says | 0.15 |
| 2 | CUT | "Take a guess first" (s3–4) | S2 | | 0.4 |
| 3 | CUT | "Your paw prints" (s9) | S1 | | 0.45 |
| 4 | CUT | "The cost of waiting" (s7) | S3 | | 0.4 |
| 5 | MERGE | "Roughly what you could aim for" (s7–8): keep the two-thirds figure, lose the amber fill and the paragraph that repeats two assumption bullets | S9, §5 repeated | | 0.35 |
| 6 | MERGE | The two email routes (s5, s8–9) | S4 | | 0.07–0.55 |

After: about 12.8 screens. Keep "The same money, two ways" (a result), the
B.17 note under the retirement-age slider, the closing band.

### broker-vs-autoenrolment.html — tool + 2; 18.4 screens (the tool 8.2). Over R7

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "Take a guess first" (s3–4) | S2 | | 0.45 |
| 2 | CUT | "Your paw prints" (s9–10) | S1 | | 0.45 |
| 3 | CUT | "Talk through what this means for you" inside "In one sentence" (s4); the sentence and the closing band's button stay | §5 one action | The same action twice | 0.15 |
| 4 | MERGE | The assumptions (s11–15, 4.5 screens): the "Your year" phase-rate chart (s12), said by the bullet beside it and by "Since it is 2026, you are in year 1…" (s4); and the "My Future Fund does not currently accept…" text, which "Before you rely on these rates" (s8, with its gov.ie source) already says | §5 repeated, R7 | The same facts three times | 1.0 |
| 5 | MERGE | The PRSA relief bullet ("15% under 30, rising…") into the "Your relief limit" card (s7–8), which shows it | §5 repeated | | 0.4 |
| 6 | MERGE, to check | "Side by side" one-year bars (s5) against the dark card's two "Into your pension" figures (s4) | §5 repeated | Blurred in the capture (before Reveal): confirm they are the same two figures | 0.4 |

After: about 15.5 screens, at or near R7.

### pension-fees-calculator.html — tool + 2; 11.6 screens (the tool 4.7)

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | MERGE, a judgement | "The other side" card inside the results (s6) into the assumptions or the "Not sure what your old plans charge?" band | §5 | An explanation among results | 0.35 |

The cleanest of the calculators: no guess, no paw prints, no cost of
waiting, no email card. It is the model for the other three.

### state-pension-reality-check.html — tool + 3; 13.4 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | MERGE | "How your State Pension is actually worked out" (s6–7) into "The assumptions behind these numbers" (s9–10), which survives | §5 repeated, R6, R7 | The prose repeats the bullets nearly word for word: the Total Contributions Approach, 2,080 and 520, the two ways until 2034, the floor, the link to the entitlement check | 1.3 |
| 2 | CUT | "Your paw prints" in the results column (s5) | S1 | | 0.8 |

After: tool + 2, about 11.3 screens.

### state-pension-entitlement.html — tool + 3; 19.2 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | MERGE | "The assumptions behind these numbers" (s12–16) into "How the two calculations work" (s7–10), which keeps both its charts. Five assumption bullets go, each a restatement of "How": both until 2033, the start year sets the mix, the 520 minimum, the credit caps (520, 1,040), the yearly average | §5 repeated, R7 | Every point said twice | 1.8 |
| 2 | CUT | "Your paw prints" (s7) | S1 | | 0.7 |
| 3 | CUT | "Jump to how the two calculations work or the assumptions" (s7), once 1 is done | R7 | | 0.1 |
| 4 | CUT | The assumption "Before 2002 the contribution year ran from April to April…" (s15) | §5 repeated | The hint under the tool's 1 January to 5 April box says it | 0.4 |

After: tool + 2, about 16.2 screens: still about 5.5 over. The rest is
the list of what the tool leaves out (the Homemaker's Scheme, the
Alternative Yearly Average, voluntary contributions, records in other EU
countries, first PRSI at 56 or later, pensions before 2025, rounding),
which carries the spec's floor statements. Only Damian can shorten it.

### standard-fund-threshold.html — tool + 3; 10.9 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "On this page", three links (s1–2) | §5 contents lists are for guides over 8 screens | | 0.4 |
| 2 | MERGE | The "Next step: Book a call" card (s8) into "Close to the threshold, or over it?" (s5), which survives | S5, R8 | The same booking twice, related pages below | 0.3 |

Keep the rules bullets though they repeat the tiles: they carry the Finance
Act 2024 s.13 and Revenue's chapter 27 citations (R10).

### pia.html — 7 sections and a contents list (cap tool + 3); 24.5 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "Side by side with a pension, a fund and My Future Fund", the six-row table and its note (s7–10) | R6, R7, §5 another page's job | The tool's own "Where the tax comes in" shows tax going in, while it grows and on the way out for all three, from live figures; the My Future Fund column is the auto-enrolment comparison's job | 3.4 |
| 2 | CUT | "Who it might suit", its lede and seven "It depends…" cards (s16–18) | R6, R7 | All seven say "it depends" and point at the tool; the "Pension, PIA, or both?" band says it in one paragraph | 2.3 |
| 3 | MERGE | "What it is" (s2–3) into "What's confirmed, and what's coming on 6 October" (s4–6), which survives with its Department of Finance source; the opening definition becomes its first paragraph | §5 repeated | The same eight facts in two lists, back to back | 1.3 |
| 4 | CUT | "Next step: Pension calculator" (s21) | S5 | | 0.3 |
| 5 | CUT | "On this page" (s2), once 1 to 3 are done | §5 | Three sections need no contents list | 0.4 |

After: about 3 sections and 16.8 screens; the tool starts on screen 4
instead of 10. Keep "How the same money is taxed today", whose Revenue
citations source the tool's 38% and 33% (R10), "Still to come", the tool,
"If growth is lower, or it falls", "Where the tax comes in", the
assumptions.

### my-pensions.html — tool + 2; 6.2 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "The charges calculator" and "The Standard Fund Threshold check" links under the "In one view" result (s3) | S6 | Both are related cards on the same screen | 0.2 |

### pension-readiness-check.html (held) — 5.0 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "Nothing you answer leaves this page." at the end of the lede (s1) | §5 repeated | The information box says it | 0.05 |
| 2 | CUT | The tinted ticks on "How the score works" (s2–3) | S8 | | 0 |

### find-my-pension.html (held) — 6.4 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | MERGE | "What this is, and what it is not" (s2–3) into "Good to know" (s3); two items move across, "Free to start, with no obligation" and "Nothing is moved or changed" go | §5 repeated | "No obligation" three times, "nothing is moved" three times | 0.6 |
| 2 | CUT | "no obligation" from the eyebrow (s1) | S12 | The lede says it next | 0.03 |
| 3 | CUT | The tinted ticks on "Good to know" (s3–4) | S8 | | 0 |

### director-pension-rules.html — Guide; 10.2 screens; opens with "On this page"

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | MERGE | "Next step" and its single card (s7) become the first related card | S5 | Two link headings in a row | 0.3 |

Not a cut, a fault: the article (`.dr-wrap`, s2–6) has no side gutter at
375, so its text touches the screen's edge; at 1440 it sits to the right of
the hero's column.

### director-year-end-checklist.html — Guide; 6.7 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "or read what changed for directors in 2026 first" in "Want to go through it?" (s4) | S6 | A related card, and checklist item 4 links it too | 0.05 |

### old-pension-checklist.html — Guide; 6.5 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "see how we help you find old pensions" and "the pension charges calculator shows…" in "Want help with it?" (s3–4); the booking line stays | S6 | Both are related cards just below | 0.15 |

### pensions-over-50.html — Guide; article + 3 (cap 2); 8.3 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | MERGE | "Next step" and its pension calculator card (s5–6) into the related list | S5 | The third section after the article; "Catching up" links the calculator already | 0.4 |
| 2 | CUT | "or check how much of the Standard Fund Threshold your pensions would use" (s5) | S6 | The first related card | 0.05 |
| 3 | CUT | "4. Want to go through it?" from "On this page" (s1) | §5 | A call to action, not part of the article | 0.03 |

After: 7.8 screens, under 8, so the contents list becomes optional.

### self-employed-pensions.html — Guide; 6.9 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | MERGE | The "Next step" card, pension calculator (s4), into the article's own "See your own numbers" (s3–4), which survives with the booking link, the information line and the sources; the white gap before "Related pages" goes with it | S5, R3 | Both send you to the calculator, two blocks apart | 0.5 |

### uk-pensions-in-ireland.html — Guide; 7.1 screens

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | The "Next step" card, "Track down old pensions" (s4) | S5 | Tracing is linked twice already (s3, and the checklist in related); the page's real next step is "Worth a conversation" | 0.5 |

### glossary.html — Guide; article + 3; 15.2 screens (over 8: its term chips are its contents list)

| # | Action | What, where | Rule | Why | Saves |
|---|---|---|---|---|---|
| 1 | CUT | "Two ways to learn the lingo.": the two game cards and "Your paw prints" (s1–3) | §5 cap, another page's job; S1 | It pushes the term chips, the page's contents, down to screen 3; the cut brings them onto screen 1 | 1.4 |
| 2 | CUT | The tools inside entries: Tax relief's slider, "See it for your age and salary" and the age-band bars (s3–4); Drawdown's "A pot of" slider (s5); Inflation's two sliders (s6–7). The definitions stay | §5 another page's job | Three small calculators inside a glossary | 1.5 |
| 3 | CUT, colour only | The tint on the Risk rating tiles 1 to 7, amber on 5 to 7 (s7) | S9 | Amber here means "higher risk", which it never means elsewhere, and hints at a judgement the card itself disowns ("does not mean a better or a worse fund") | 0 |
| 4 | CUT, colour only | The mint fill on the initialism chips (AVC, ARF, DC, PRSA…) | R4, R5 | Tinted chips beside the tax-relief bars | 0 |

After: article + 2, about 12.3 screens, the term chips on screen 1.

### privacy.html, terms.html, complaints.html — Legal

One cut each, S7: the booking sentence inside "Contact". Everything else
is the legal text, and stays.

### how-we-work.html (held) — Legal

Nothing to cut.

---

## For Damian

Numbered so you can answer by number. Each is a cut the rubric supports
but that undoes something you asked for, or touches copy compliance has
seen.

1. **The gamification** (S1, S2): "Your paw prints" (five calculators,
   the glossary, and the tracker page with its "Tick these off as you
   go") and "Take a guess first" were your call (the gamification branch,
   19 September). Cut both, one, or neither?
2. **"The cost of waiting"** (S3) is named in compliance pack B.16. Cut?
3. **Which email route stays** on the pension and director calculators
   (S4): the button that opens your own mail, or the card that asks for an
   address?
4. **The home page's team section** (index 7): keep the story and one
   picture, and lose the Adam and Buddy profiles and the qualifications
   chips? The chips also go from the booking page (booking 3). Build checks
   31 and 32 guard them, and the same qualifications are in the hero line
   and every footer.
5. **"Who you are actually dealing with"** (index 8) is Run 26's trust
   copy, guarded by `trust_drift`. Cut it from the home page, given the
   footer says it?
6. **The home page's FAQ** (index 10) is the site's only FAQ. Cut it, or
   move it to the booking page? (Moving is a build, not a cut.)
7. **The gap section's "way of life" chooser** (index 3), which
   `tests/gap-band.py` tests, and the hero card's caption "the value of
   investments can fall as well as rise" (index 1), a risk line though not
   one of the boxed warnings: both go with their sections. Agree?
8. **The games on the home page and the glossary** (index 4, glossary 1),
   added in Run 35: links only from now on?
9. **The glossary's small calculators** (glossary 2), from Runs 39 and 40.
10. **PIA's comparison table and "Who it might suit"** (pia 1, 2), which
    each take a "Proposed · as at 25 September 2026" line with them, and
    "Who it might suit" is close to suitability copy you approved in Runs
    23 and 24.
11. **The assumptions text on the auto-enrolment comparison** (broker 4, 5)
    and **on the two State Pension checks** (reality 1, entitlement 1, 4)
    was compliance-reviewed. Merge as proposed?
12. **What the entitlement check leaves out** keeps it 5.5 screens over
    the rubric even after every other cut. Shorten that list, or accept the
    page as the exception?
13. **The over-50s guide quotes Revenue's manual word for word** (chapters
    9.6 and 24.5). Stating each rule and citing the chapter would save half
    a screen; you chose the verbatim quote in Run 31. Keep?
14. **"The other side"** on the fees calculator: a consumer-protection
    caveat. Leave it in the results?
15. **The share buttons** (copy a link, save or print, email) are on every
    calculator. With the closing button and Ask Buddy they take most pages
    past R8's four labels. Keep all three, or fewer?
16. **The primary action has three names**: "Get my free review" (home
    hero), "Book your free call" (closing band), "Book a call with Damian
    for free" (nav). One name everywhere?
17. **Related pages on the legal pages** repeat the footer's Company
    column. Keep?
18. **The starter page's timeline** "What builds up, and when." (starter 4)
    was built on purpose in Runs 37 and 38; and starter 5 and 7 take
    researched, cited figures with them (HomeCaring, the auto-enrolment
    Act's sections, the 835,000 enrolled), which live on their own pages.
19. **The directors page's coverage band** (director 4) carries the
    Central Statistics Office figures (57%, 68%) and their citation; the
    merge drops them.
20. **The booking bar on phones** is a filled aqua button pinned to the
    bottom of the audience pages, so every filled button in those pages
    shares a screen with it. Cut it on those pages, or rule in the rubric
    that it is chrome, like the nav?

## Found on the way, not cuts

- **Live placeholder on the Privacy Notice:** "[Wording to be confirmed:
  the optional emails about pension deadlines…]" shows on the page (R20-A2,
  already known and listed in STATUS).
- **The director rules guide has no side gutter at 375** (above).
- **`verify.py`'s full-page screenshots are wrong** for the home page at
  1440 and the starter page: a section sized in viewport heights swells in
  a window as tall as the page. Shooting screen by screen, as here, is the
  fix; it is a tool change, so it waits for your word.
- **The pension readiness check shows no "Reviewed" line** in the page
  (it is in the markup only); `my-pensions` shows one.
