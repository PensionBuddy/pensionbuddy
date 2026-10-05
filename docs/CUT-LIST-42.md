# Cut list (Run 42)

Run 42, 3 October 2026. Item 5 of the brief: list every paragraph that
only pushes booking, repeats another section, or says nothing a figure
doesn't; cut the clear ones on the home page; list the rest per page for
you; keep every fact, source, caveat and warning; report every cut word
for word.

**Cut in this run:** on the home page only. The hero's three lines went
with item 1 (the hero rebuilt on the gap); this item cut the closing
section "Which of these sounds most like you?" and the story's last
paragraph (D2 below). Everything else here is a list for you: nothing on
any other page was cut.

Every quoted sentence in sections 2 and 3 was checked word for word
against the files as they now stand, and its line number refreshed. Line
numbers are this branch's after this item: the home page after its cuts,
the 404 page and the directors' rules after item 3's moves, and the
starter page, the pension calculator and the director calculator after
item 4's colour edits (one, two and five lines further down than main).
Every other page's lines are main's. A page built from parts is cited by
its part file (`:77` is a line of the part file named in its heading).
A sentence a script writes (the calculators' results) was checked against
the page as a browser draws it with its first values.

**Run 43 (4 October 2026).** Damian's brief: "apply every cut that only
removes repetition. List the rest." Applied, each marked below: S-8, T-6,
D-9, D-8 (its second sentence only), B-2, Y-2, Y-3, R-3, C-2 and M1, nine
edits (Y-2 and Y-3 are one), commit `e53afba` (STATUS, Run 43, item 3; pack
section 7). Kept, each marked: D7 (the home FAQ: its answer holds facts,
and SUBTRACTION-AUDIT question 6 is open), O-2 and Z-2 (each would leave a
bare ask), and D-8's first sentence. Every other row stays a list for you,
for the reason its row gives. Run 43 also removed the three chat pictures'
booking links and reason lines (S-2, T-2, D-2: the link and reason only,
by Damian's "yes" to question 7) and changed every reason line's words to
"Free · 20 minutes · no obligation · easy to reschedule." (the S-1, T-1,
D-1, R-1, O-3, E-1, U-1, C-3, Z-3 and F-1 rows quote the old words). Line
numbers below are Run 42's.

## The three tests, and what is never a cut

A paragraph is listed when it (i) only pushes booking; (ii) repeats
another section of the page, or a page it links to; or (iii) says nothing
a figure beside it does not.

Q numbers are the run's questions for you (STATUS, Run 42, "Needs
Damian"); check numbers are `tests/build.test.py`'s.

Never a cut: every `.pb-warn`, `.infoadvice`, `.pb-reg`, `.pb-reviewed`,
`.ck-note`, `.dr-src`, `.pb-src`, `.pb-sa-note`, `.pb-lad-note`, `.qnote`,
`.pb-caveat`, `.announce`, `.sft-note`, `.hc-note`, `res-hero .foot`,
`max-card .mnote`, `.pia-asat`, the footer, "Rules as at" lines, the
closing bands, privacy lines, and every FAQ answer that holds a fact.

## 1. Home: cut in this run (word for word)

By item 1 (the hero):

1. h1: "One call. To know where you stand." (test i)
2. "A pension should be something you understand, not something you avoid." (ii: the story's "One idea: a pension should be something you understand, not something you avoid." stays, `index.html:2779`)
3. "Most people in Ireland have a pension they’ve never really looked at." (iii: "79% feel unprepared." with its source says it)

Moved, not cut: "Get my free review", "Free, 20 minutes, no obligation.", "Try the calculator" (to `#life`); "The gap" (to `#life`); "What’s changed?" and its six links (after `#life`); the Buddy chat picture whole, to `#call` after the three steps: "Buddy" · "Chief Pension Dog" · "Is the first chat really free?" · "Yes, completely, with no obligation afterwards. Twenty minutes to understand your situation and answer your questions." · "Which of these sounds most like you?" · "Just starting out" (name "Just starting out: starting a pension") · "Changed jobs a few times" (name "Changed jobs a few times: finding old pensions") · "Run my own company" (name "Run my own company: pensions for directors") · "Book a call with Damian for free" · "Illustration only · the value of investments can fall as well as rise" (a `CAVEAT_CLASSES` line, kept) · image alt "Buddy, the Pensionbuddy dog". Its removal is Q2 (every sentence but the caption repeats FAQ 2, the fork or Six places, or the nav button).

By item 5 (this item):

4. The closing section, main `index.html:2884-2891` (2948-2955 on this branch before this item), with its 16 lines of CSS (main 1890-1905, from `/* CLOSING FORK (.pb-fork).` through its reduced-motion rule): the heading "Which of these sounds most like you?" and the three cards "Just starting out" / "No pension yet, or one you’ve never looked at? We’ll make starting simple, and it’s never too late to begin."; "Changed jobs a few times" / "Changed jobs a few times and lost the thread? We’ll find what you’ve built up and tell you what it’s worth."; "Run my own company" / "Your company can fund your pension far beyond personal limits, and cut its tax bill doing it." (ii: character for character "Six places to begin." cards 2, 1 and 3, `index.html:2700`, 2699 and 2701, to the same pages; the same three sentences stand on the 404 page, `404.html:2103`, 2102 and 2104). No fact, source, caveat or warning was in it. The three cards were links, not an interactive piece. Your veto: Q18.
5. The story's last paragraph, main `index.html:2751` (2798 on this branch before this item): "The goal is simple: get you from “I’ve no idea what’s happening with my pension” to an actual conversation with someone qualified to help." (i: it only pushes booking; it holds no fact). The story keeps its kicker "Our story", its heading "Father, son, dog.", "One idea: a pension should be something you understand, not something you avoid." and its two paragraphs on Damian and Adam (`index.html:2777-2781`); `#story` is intact. Build check 31's mutant "the story's copy put back" anchored on this paragraph's close; it now anchors on the paragraph before it ("…So they built Pensionbuddy together.", `tests/build.test.py:1295-1296`) and is still caught. The search index carried none of its words (it holds the page's headings); regenerated, it lost only the closing section's heading.

"Twenty minutes"/"20 minutes" on the page after this run: the reason line in `#life` (`index.html:2615`), step 2 of "How a call with Damian works" (2892), the moved picture's Buddy line in `#call` (2900), the FAQ's second answer (2924), and the closing band's heading and line (2934, 2935).

## 2. Home: for you (D1–D12)

- **D1** 2676 `p#pbPtDesc`: "Pop in a few numbers and watch the projection build, including how much Revenue adds back through tax relief. Two minutes, no sign-up." — (ii) word for word the Six places card 2702, pagebuild's RELATED table (`tools/pagebuild.py:916`) and the 404 (`404.html:2105`); it is the tab panel's live description (`T[0].desc`, 3224) and check 40 pins the 404 copy. Which copy, if any?
- **D2** done: cut in this run (section 1, cut 5).
- **D3** 2781: "Adam, freshly out of Trinity, saw the same gap from the other side. Nobody was explaining any of it in a fun and digestible way that actually made sense. So they built Pensionbuddy together." — (ii) Adam's pullquote 2811 and bio 2812.
- **D4** the team block 2785-2828 (SUBTRACTION-AUDIT Q4 open): 2793 "I’ve spent thirty years explaining how money can best serve real people. Clarity is the whole point."; 2795 "Thirty years of that work leaves you with one firm opinion: hardly anyone is bad with money. They have just never had it explained to them in words they felt allowed to ask questions about."; 2811 "Nobody out there was explaining any of it in a way that actually made sense. That is the part I wanted to fix."; 2812 "Adam graduated from Trinity College Dublin this year with an honours degree in Business, Economics and Social Sciences. He’s bringing a fresh perspective to how pensions get talked about, transforming three decades of his dad’s experience into something people can actually follow, from auto-enrolment to retirement planning."; 2813 "Adam runs the social and education side of Pensionbuddy, the goal being to educate and remove the fear around pensions."; 2825 "Buddy is a beloved boxer, and the namesake of Pensionbuddy. He is the mascot, and the paw print in the logo is his."; 2826 "He is also the point, in a way. A pension should feel like something with someone in your corner, and Buddy is the loyal embodiment of that." Keep 2794 (facts) and 2797-2800 (check 31). `#story` must survive (nav 2514, footer 2945, verify.py:660).
- **D5** 2862-2863 "Who you are actually dealing with." — repeats the footer disclosure; holds the legal name, registered office and register reference: compliance's call only.
- **D6** 2888 h2 "Most people brace for a sales pitch. This is a chat." (i); steps 2892 "Twenty relaxed minutes, phone or video. Your questions answered, nothing assumed." = 2935; 2893 "You'll leave with a clear picture and a sensible next step. If we're not the right fit, we'll say so." = FAQ 1 (2922). Check 45 pins kicker, h2 and steps word for word. (The Buddy picture now sits in this section; its Buddy line repeats FAQ 2.)
- **D7** *(kept in Run 43: the answer holds facts, and SUBTRACTION-AUDIT question 6 is open)* the FAQ 2914-2929 (SUBTRACTION-AUDIT Q6): Q3 (2925) and Q5 (2927) hold facts and stay; Q2 "Is the first chat really free?" / "Yes, completely, with no obligation afterwards. Twenty minutes to understand your situation and answer your questions." (2924) is still a same-page repeat of the picture's Buddy line (now in `#call`, 2900, one section above). Any cut edits the FAQPage JSON-LD at index.html:32 too (check 30).
- **D8** 2935 "Twenty minutes. Phone or video. Free, with no pressure." — (ii) its own h2 and step 2; it is B.16's reason for "Book your free call".
- **D9** 2761 "See it for your age and salary" and 2763 "See what it’s worth to you", both to pension-calculator.html (R8 counts buttons; not text).
- **D10** answered by this run: the provider logos directly under the hero, as the brief asks (Q17 settled by the brief), then `#life`, then "What’s changed?".
- **D11** answered: the brief's sub-line is not in the home hero; the hero's Buddy chat picture, which held its only "Twenty minutes" sentence, moved whole into `#call` (section 1: moved, not cut).
- **D12** answered: €25,296 stays.

## 3. Per page, for you (nothing cut this run)

Guards: G1 a `p.pb-why` is cut whole, never reworded (trust_drift; each is a B.16 line); G2 check 38 (tests/build.test.py:1756-1804) needs one "On this page" list and one "Next step" card per GUIDES page; G3 check 31 pins the booking page's qualification strip; G4 initialisms spelled out at first use (tools/check-initialisms.py); G5 FAQPage JSON-LD at :32 on starter/tracker/director mirrors the FAQ; G6 no interactive piece removed; G7 "Topics to discuss, not advice" is a build check.

### starter.html

- **S-1** 2488 "Free, 20 minutes, no obligation." (i; clean, G1).
- **S-2** *(Run 43: the link and its reason removed by item 1, P1; the question and answer stay)* 2500-2503 "Have I left it too late to start?" / "Almost certainly not. Earlier gives money more time to grow, but starting now beats waiting longer, and tax relief is there at any age." / "Book a call with Damian for free" / "Free, 20 minutes, no obligation." (ii: FAQ 2796 word for word; clean).
- **S-3** 2511-2515 "Sound familiar?" / "If any of this is you, you're in the right place." / "Not started · No pension at all yet · You've been meaning to sort one for a while, but never quite knew where to begin or who to ask." / "Ignored · A scheme you've never looked at · There's a workplace pension ticking away, but you've no real idea what's in it or whether it's set up well." / "Worried it's late · Feeling behind · You think you've left it too long to bother. The good news: starting now still makes a real difference." (ii: lede 2485, FAQ 2798, h1; clean).
- **S-4** 2520-2524 "How we'll get you going" / "Three steps. Plain English, no pressure." / "1 Tell us where you're at · A quick, relaxed chat about your situation. There's nothing you need to prepare or know in advance." / "2 We explain your options · What a pension is, how the tax relief works in your favour, and what makes sense to start with, all in plain English." / "3 You start with confidence · If you decide to go ahead, we'll help you set it up properly and make sure it's working from day one." (i, ii: booking's steps; clean).
- **S-5** 2655 "Pension contributions get tax relief, so some of what you'd have paid in tax goes into your future instead. Our calculator shows how much that could add up to." (iii: the slider's line 2659; clean).
- **S-6** 2660 "See it for your age and salary" (ii: 2662 same page; clean).
- **S-7** 2672 "Tax relief is there at any age. Revenue's limit on the contributions that get it rises with age, as a share of earnings." (sentence 1 only; sentence 2 is the bars' caption).
- **S-8** *(applied in Run 43, 4 October 2026)* 2686 "My Future Fund is the auto-enrolment scheme. The comparison tool shows both, side by side, for your salary and age." (ii: related card 2820; clean).
- **S-9** 2715 second sentence "From 2026 to 2028 that is 1.5% of your gross pay from you, 1.5% from your employer and 0.5% from the State, on pay up to €80,000 a year." (ii: 2710 `pb-sa-note` keeps the fact).
- **S-10** 2725 "Compare the two side by side" (ii; the block's only button: yours).
- **S-11** 2733 "The reality check shows the difference, for a full record and for your own." (iii; clean).
- Not cuts: 2812 (band), 2541-2545 (facts), 2710/2723/2726/2763/2679 (caveats, sources), FAQ 2797.

### tracker.html

- **T-1** 2279 "Free, 20 minutes, no obligation." (i; clean).
- **T-2** *(Run 43: the link and its reason removed by item 1, P1; the question and answer stay)* 2291-2294 "I don’t have any of the paperwork, is that a problem?" / "Not at all. Roughly when you worked somewhere, and who for, is usually enough to start tracing a pension." / "Book a call with Damian for free" / "Free, 20 minutes, no obligation." (ii: FAQ 2380; clean).
- **T-3** 2302-2306 "Sound familiar?" / "If any of this rings true, you're in the right place." / "A few jobs in · Pensions all over the place · You've worked for two, three or more employers, and joined a scheme with some of them." / "Long gone · The paperwork vanished · Statements binned years ago, and some of those providers have merged or changed names since." / "A mystery · No idea what it's worth · You genuinely don't know how much is in any of them, or whether it's growing or just sitting there." (ii; clean).
- **T-4** 2311, 2321-2323 "How we'll sort it" / "Three steps. No paperwork to begin." / "1 Tell us where you worked · Rough employer names and rough dates are plenty. We don't need the old statements." / "2 We trace and value them · We help locate each pension you built up and find out what it's actually worth today." / "3 We explain your options · In plain English, including whether bringing them together into one plan makes sense for you." (ii: FAQ 2380-2381, thank-you 2064; clean as a block, step 2 said nowhere else).
- **T-5** 2326-2329 "Tick these off as you go" / "Listed the employers I have had" / "Found out what each pension is worth" / "Talked the options through" (ii, but interactive: G6, yours).
- **T-6** *(applied in Run 43, 4 October 2026)* 2330 "Know roughly what some are worth already? List them in one view, with the total and what the charges come to." (ii: related card 2405; clean).
- **T-7** 2339-2342 "Forgotten pensions are more common than you'd think." / "Bringing scattered pensions together can make them easier to manage and, sometimes, work harder. We'll tell you honestly whether it's worth it for you." / "Start finding mine" / "Free, 20 minutes, no obligation." (ii, i: FAQ 2381 and the footer keep the caveat; clean).
- **T-8** 2382 "Is it really worth the hassle?" / "There usually is money there. Knowing what you've got, and making sure it's invested rather than sitting forgotten, can make a real difference." (borderline, G5; not proposed).
- Note for Q7: T-1 and T-7 are the two asks the tracker move would stack.

### director.html

- **D-1** 2273 "Free, 20 minutes, no obligation." (clean).
- **D-2** *(Run 43: the link and its reason removed by item 1, P1; the question and answer stay)* 2285-2288 "How much can my company actually contribute?" / "Often a lot more than you’d expect. Company contributions are based on your salary, service and existing funding, not the salary-percentage caps that limit personal contributions." / "Book a call with Damian for free" / "Free, 20 minutes, no obligation." (ii: FAQ 2427; clean).
- **D-3** 2300 "Fund well beyond personal limits" / "Personal pension contributions are capped as a percentage of salary. Company contributions to a director's pension can be far larger, letting you build a serious fund faster." (ii ×4; rewrite: the h2 2296 counts "Four things").
- **D-4** 2304 "Cut your corporation tax" / "Money your company puts into your pension normally counts as a business expense, so it can cut the company’s tax bill while the money works for your future rather than the tax bill." (ii; rewrite).
- **D-5** 2308 "Take it as salary and it is taxed three ways: income tax, the Universal Social Charge (USC) and Pay-Related Social Insurance (PRSI). Put it into a pension instead and far more of it stays yours." (NOT clean: G4, the page's only spelled-out USC and PRSI).
- **D-6** 2314 "Use the funding headroom you've built" / "Years of trading often create room to make large one-off contributions based on your salary and service." (ii; rewrite).
- **D-7** 2331-2335 "Sound familiar?" / "If any of this is you, it's worth a chat." / "Profit sitting still · Cash building in the company · The business is doing well and profit is accumulating, but it's just sitting there rather than working for your retirement." / "Paying more tax than needed · Taking it all as salary · You're drawing profit as income and feeling the full weight of income tax, USC and PRSI on money you don't immediately need." / "No clear plan · Pension on the long finger · You've meant to sort a proper pension for years, but running the business always came first. It's not too late to make it count." (i, ii; clean).
- **D-8** *(second sentence applied in Run 43, 4 October 2026; the first kept: it holds the claim the figures support, said nowhere else)* 2345-2347 "Directors and the self-employed are the least likely group to have retirement provision behind them, and the ones with the most room to fix it. Company funding is not capped by the salary percentages that limit everyone else." (iii/ii; clean; the 57% / 68% stats and the CSO source stay).
- **D-9** *(applied in Run 43, 4 October 2026)* 2348 "Try the director calculator" (ii: 2274, 2367; clean).
- **D-10** 2366 "The director calculator shows the pot you could build, the income it could provide, and the corporation tax your company could save. Two minutes, no sign-up." (ii: related card 2452, its own h2; clean).
- **D-11** 2377-2393 "The rules for 2026" / "What changed, and how close you are to the cap." and four cards: "Directors’ pensions in 2026 · Executive pensions set up before April 2021, a company’s payments into a Personal Retirement Savings Account (PRSA), the October window and small self-administered schemes, dated and sourced, with four questions to see which of it applies to you." / "The Standard Fund Threshold check · The threshold rises every year to 2029. See how much of it your pensions would use in the year you take them, and how a retirement lump sum is taxed." / "The year-end checklist · Nine things to check before your company’s year end and the October deadline, on one page you can print for your accountant." / "The new Personal Investment Account (PIA) · Proposed, as at 25 September 2026, and not yet law: an account for investing from your own take-home pay, with no tax relief going in and a flat yearly tax. See it next to a pension, which your company can pay into." (cards 1 and 3 clean: related 2453-2454; cards 2 and 4 are the page's only in-body links to those pages: yours).
- **D-12** 2427 last clause "The right figure is specific to you, and the free chat works it out." (i; rewrite + G5).
- **D-13** 2430 "What does the first chat involve?" / "Twenty minutes, phone or video, free and with no obligation. We'll talk through your company, your goals and your options in plain English." (i; clean + G5).
- Not cuts: 2326 (`pb-lad-note`), 2310, 2355, 2437, 2445.

### booking.html

- **B-1** 2035-2036 "The house promise" / "No jargon. No pressure. No obligation." (ii; clean; pack 3092-3096 cites it).
- **B-2** *(applied in Run 43, 4 October 2026)* 2042 "20 minutes, that's it" / "A short, no-strings chat about your pension." (ii; clean).
- **B-3** 2046 "Phone or video" / "Pick whichever you prefer when you book." (ii; clean).
- **B-4** 2050-2051 "Damian’s qualifications and memberships" / "Qualified Financial Adviser (QFA)" / "Life Insurance Association (LIA)" (NOT clean: G3).
- **B-5** 2063 "Three quick details, then pick a time that suits. You will get a confirmation by email straight away." (ii; clean).
- Never: 2070, 2106, 2029-2031.

### thank-you.html

- **Y-1** 2033-2034 "The house promise" / "No jargon. No pressure. No obligation." (clean).
- **Y-2** *(applied in Run 43, 4 October 2026)* 2040 "20 minutes, that’s it" / "A short, no-strings chat about your pension." (clean).
- **Y-3** *(applied in Run 43, 4 October 2026)* 2044 "Phone or video" / "Whichever you picked when you booked." (ii: 2028; clean).
- **Y-4** 2072 "And if you have none of it, come anyway" / "Bring what you remember, Damian will help track down the rest." (ii: 2057, 2064, tracker 2397; clean).
- Borderline: 2068 "Whatever you have been wondering" / "No question is too basic. That is what the twenty minutes are for."

### 404.html

- **F-1** 2109-2110 "Book a call with Damian for free" / "Free, 20 minutes, no obligation." (i; moved by item 3; a cut is yours).
- **F-2** 2090 "Looking for something in particular? The jargon buster or the pension calculator are good places to start." (ii: the search box and Six places; clean).

### how-we-work.html

Nothing.

### games

Nothing (the end-screen lines come after the game).

### director-pension-rules.html (edit `tools/director-rules-parts/main.html`)

- **R-1** :77 "Free, 20 minutes, no obligation." (i; clean, G1).
- **R-2** :30 "The director’s year-end checklist puts these dates and limits on one page you can print for your accountant." (ii: related card; clean, low value).
- **R-3** *(applied in Run 43, 4 October 2026)* :36 last sentence "The Standard Fund Threshold check shows how much of it your pensions would use in a given year." (ii; clean; the €2.2m→€2.8m and €500,000 facts before it stay).
- Not a cut: the Next-step card (G2).

### pensions-over-50.html

- **O-1** 2060 list item "Want to go through it?" (i; clean while the list keeps two items).
- **O-2** *(kept in Run 43: the paragraph would be left a bare ask)* 2084 clause ", or check how much of the Standard Fund Threshold your pensions would use" (ii; clean).
- **O-3** 2085 "Free, 20 minutes, no obligation." (clean).
- **O-4** 2087 "Next step · Pension calculator · Pop in a few numbers and watch the projection build, including how much Revenue adds back through tax relief. Two minutes, no sign-up." (NOT clean: G2).

### self-employed-pensions.html

- **E-1** 2079 "Free, 20 minutes, no obligation." (clean).
- **E-2** 2081 "Next step · Pension calculator · Pop in a few numbers …" (NOT clean: G2).

### uk-pensions-in-ireland.html

- **U-1** 2077 "Free, 20 minutes, no obligation." (clean).
- **U-2** 2079 "Next step · Track down old pensions · Changed jobs a few times and lost the thread? We’ll find what you’ve built up and tell you what it’s worth." (NOT clean: G2).
- **U-3** 2060 list item "Worth a conversation" (low value; yours).
- The closing paragraph 2076 stays (caveat).

### old-pension-checklist.html

- **C-1** 2102 "We can do the asking for you: see how we help you find old pensions." (ii: related 2110; clean).
- **C-2** *(applied in Run 43, 4 October 2026; "Or book a free call with Damian." keeps its "Or")* 2102 "Once you know what you have, the pension charges calculator shows what its charges could take by retirement." (ii: related 2112; clean, "Or book…" loses its "Or").
- **C-3** 2103 "Free, 20 minutes, no obligation." (clean).

### director-year-end-checklist.html

- **Z-1** 2101 "Damian works through year-end funding with directors all the time." (i; clean).
- **Z-2** *(kept in Run 43: the paragraph would be left a bare ask)* 2101 clause ", or read what changed for directors in 2026 first" (ii; clean).
- **Z-3** 2102 "Free, 20 minutes, no obligation." (clean).

### glossary.html

- **L-1** 2293 sentence 2 "If you're a higher-rate taxpayer, for every €100 you put in, around €40 can come back to you as relief, so it really costs you about €60." (iii: the slider's line 2297; clean only while the slider stays).
- **L-2** 2298 "See it for your age and salary" (ii: related card; clean).
- For your eye only: 2341 "One of the reasons director pensions are powerful." and 2335 "but for most people it isn't enough on its own to fund the retirement they'd like."

### privacy / terms / complaints

- **P-1** privacy 2093 "Prefer to talk it through? Book a time on the booking page and we will be glad to help." (i; clean).
- **P-2** terms 2083 "Prefer to talk it through? Book a time on the booking page." (clean).
- **P-3** complaints 2074 "We will acknowledge your complaint and respond as quickly as we can. You can also book a time to talk it through on the booking page." (textually clean; may be a deliberate oral route: compliance).

### pension-calculator.html

- **P1** 2551-2552 "Talk it through, free" + "Free, 20 minutes, no obligation." (i: the band 2609-2610; clean; the card's figure sentence stays).
- **P2** 2588 "And what they'd look like for your actual situation." (i; rewrite: it says the form is a request for follow-up).
- **P3** 2561/2846 "Your €300/month really costs you about €180. Tax relief covers the other €120." (iii: the keys 2564; cut the branch only, the over-limit caveat 2843-2845 and the empty state 2848 stay).
- **P4** 2581-2584/2867 "Add just €100 a month and your pot grows by about €62,729 more. That is roughly €209 extra income every month in retirement." (merge into the chart caption; the figures are printed nowhere else).
- **P5** 2521 "At 40, with €450 a month going in and €50,000 saved already, your pot could reach €460,066 by 66: an income of about €1,534 a month." (class A, not recommended).
- **P6** 2609 "These are just illustrations. Damian builds the real ones." / "A free 20-minute chat. No obligation afterwards." (band).
- **P7** 2547 "Damian will work out your exact figures." (caveat).

### director-calculator.html

- **D1** 2694-2695 "Talk it through, free" + reason (clean).
- **D2** 2711 "And a proper funding calculation for your company." (rewrite).
- **D3** 2654 "Corporation tax saved" inside the drawn safe (iii; clean; a still picture).
- **D4** 2688 "Both routes are an allowable expense for the company, so the corporation tax position is the same either way. The comparison is about how much of the money reaches you." (ii: the foot 2659 is a caveat; you pick).
- **D5** 2705 (caveat; not a cut).
- **D6** 2732 "Director funding is where the big wins are." / "The numbers above are illustrations. Your exact funding limit and tax saving need a proper calculation, and Damian does this for directors all the time. Free 20-minute call, no pitch." (band).
- **D7** 2656 "With €40,000 a year from the company, from 48 to 66, your pot could reach €1,511,849, and the company could save €90,000 in corporation tax." (class A).

### broker-vs-autoenrolment.html (`tools/compare-parts/`)

- **B1** main.html:71-72 "Talk through what this means for you" + reason (i: the band :241 word for word; clean).
- **B2** :85-90 "Side by side" / "One year of contributions each, at year 1 of the phase-in, on the same scale. The longer bar reaches the end of the scale." (iii: `#aeTotal`/`#ppTotal`; clean; the bars follow the sliders, so the planner notes it as a reading, not a control).
- **B3** :133 "Both cost you the same, so the totals above are like for like." / "The personal pension costs you €X more out of pocket." (ii; clean).
- **B4** :70 "Since it is 2026, you are in year 1 of the phase-in: you put in 1.5%, your employer matches 1.5%, and the State adds 0.5%." (ii; decision: the only visible statement of the rates with the toggle closed).
- **B5** :142 "Revenue allows relief on up to €10,000 a year at your age." (ii: the ladder; rewrite: keep the over-limit clause and Mode 2's twin :199).
- **B6** :240 band.
- **B7** :255, :265, :266 (sourced assumptions; not cuts).

### pension-fees-calculator.html

- nothing clean.
- Found: main.html:87 grammar "…has a guide to pension fees and charges explains each one."

### my-pensions.html (`tools/pots-parts/`)

- **M1** *(applied in Run 43, 4 October 2026)* :36 "What could the charges cost by retirement? The charges calculator." (ii: related card; clean).
- **M2** :37 "Near €2 million altogether? The Standard Fund Threshold check." (ii; clean).
- Keep :35.

### state-pension-reality-check.html (`tools/state-pension-parts/`)

- **R1a** :142 "Since the switch to the Total Contributions Approach (TCA), your rate depends on how many reckonable contributions you have built up. Reckonable does not just mean paid. It includes contributions you were credited, for example while unemployed or ill, and HomeCaring Periods, time spent looking after a child or someone who needed care. If you have ever taken time out to care for someone, that time may still count toward your pension even though nothing came out of a payslip during it." (ii: :16, :166; clean).
- **R1b** :143 "The shape of it: 2,080 reckonable contributions gets the full rate, €299.30 a week from January 2026. Qualifying takes 520 paid contributions, ten years; credits and HomeCaring Periods count toward the rate but not toward that minimum. Between 520 and 2,080, it is a pro rata share." (rewrite: carry "Between 520 and 2,080, it is a pro rata share." into :165 or :167).
- **R1c** :144 "One honest caveat. Until the transition finishes, the Department calculates this two ways, once on TCA alone and once blending TCA with the older Yearly Average method, and pays whichever comes out higher. This tool shows the TCA-only figure. If your record has gaps, that means what you see here is a floor rather than your exact number, and your real entitlement could be a little higher once the blended calculation is checked. Worth confirming your own figure at MyWelfare.ie rather than treating this as final. The State Pension entitlement check works the rate out both ways and shows which one the Department would pay." (ii: :164-165; clean).
- **R2** :96 "On 2,080 reckonable contributions, 40 years, this shows €299.30 a week, €15,564 a year, which covers 81% of a modest standard of living." (class A).
- **R3** :87 "Each dot is a year of reckonable contributions." / "40 of 40 years, a full record" (the jar's legend; not a cut).
- **R4** :150 band.

### state-pension-entitlement.html (`tools/state-pension-entitlement-parts/`)

- **E1** :191 "Until the end of 2033 the Department of Social Protection works the rate out two ways, Method 1 the Total Contributions Approach on its own and Method 2 a mix of the Yearly Average rate and the TCA rate, and pays whichever is higher. From 2034 only the Total Contributions Approach applies. This page does the same on the details entered." (clean but for the last sentence → :157).
- **E2** :192 "The year the pension starts sets the mix. Everything here assumes you take the pension at 66, so the year you were born sets it. Starting later, at 67 to 70, is not modelled, and the Yearly Average band rates at those ages are not published for 2026." (rewrite: carry the unpublished-rates fact into :171).
- **E3** :193 "The qualifying minimum is 520 paid contributions, ten years. Credits and HomeCaring Periods do not count toward it, however many there are. Below it there is no State Pension (Contributory) under either method. A means-tested State Pension (Non-Contributory) may apply instead, on a different basis, and this page does not calculate it." (rewrite: carry the Non-Contributory sentence).
- **E4** :194 "Under the Total Contributions Approach, credited contributions count up to 520, HomeCaring Periods up to 1,040, and the two together up to 1,040. Under the Yearly Average method credited contributions count in full and HomeCaring Periods do not count at all." (ii: :115-116; clean).
- **E5** :195 "The yearly average is paid plus credited contributions divided by the years from the contribution year you first paid PRSI to the year before you turn 66, rounded half up to a whole number, as the Department does. Below 10 it falls into no band and the Yearly Average method gives nothing. No more than 52 contributions count in any year." (rewrite: carry "No more than 52 contributions count in any year.").
- **E6** :203 "Before 2002 the contribution year ran from April to April. For a first payment between 1 January and 5 April of a year up to 2001, the box under the entry year counts from the year before, as the Department does; left unticked, the page takes the entry year as entered, and if that is the calendar year of such a payment the years divided by are one too few and the figure may be too high. The floor statement is on the details entered." (rewrite, not clean: at most the first two sentences go).
- **E7** :107 "Jump to how the two calculations work or the assumptions." (clean once E1-E6 shrink).
- **E8** :84 "The Department pays the higher. That is €280.86, €18.97 a week more than the Total Contributions Approach alone." (accessible statement of the aria-hidden bars; not recommended).
- **E9** :177 band.

### standard-fund-threshold.html (`tools/sft-parts/`)

- **S1** :88 "Next step" / "Book a call with Damian for free" / "Free, 20 minutes, no obligation." (i, ii: the band :64-68; clean as text, class F: GUIDES at tests/build.test.py:1758 and the mutant :1831).
- **S2** :8 "On this page" / "Your details" / "Close to the threshold, or over it?" / "The rules behind these numbers" (class F; goes with S1 and :89 `pb-guide.js`).
- **S3** :14 clause "…which Damian can work out with you." (rewrite; the fact before it stays).
- **S4** :66 band.

### pia.html (`tools/pia-parts/`)

- **I1** :17-36 "What it offers": "No deemed disposal every eight years, no exit tax and no Capital Gains Tax (CGT) on what happens inside it." / "The provider pays the tax for you." / "No lock-in: you can take money out at any time." / "No tax at all while the account’s average value stays under the threshold." and "What it costs you, and the risks": "Tax is due every year the average is over the threshold, even a year the account falls in value." / "No tax relief on what you pay in, unlike a pension." / "Not a deposit and not capital-guaranteed: what it holds can fall, and you can get back less than you paid in." / "Fees are unknown: no provider has published a price, and none is named here." (ii: "Confirmed in the Roadmap" :49-53, :66; clean but for "No tax at all while the account’s average value stays under the threshold.", carried into :50; :14 stays).
- **I2** :84-124 the four-way table (NOT clean: "Normally from 60, and from 50 in some cases", "At 66", "The State adds €1 for every €3 you pay", "the first €200,000 of it tax-free" live only here).
- **I3** :204-214 "Who it might suit" / "It depends on your circumstances, and on figures that are not out yet. Where there is employer money or tax relief on offer, look at the pension first. Where the money is for something before 60, the PIA is the one to look at." (suitability copy approved in Runs 23-24; pack question (c) open).
- **I4** :242 "Next step" / "Pension calculator" / "Pop in a few numbers …" (class F).
- **I5** :8 "On this page" (class F).
- **I6** :160 "Each costs you €24,000 from take-home pay over 10 years. The pension gets €16,000 of tax relief going in and is taxed on the way out." (class A).
- **I7** :219 band.

### find-my-pension.html (held; `tools/finder-parts/`)

- **F1** :3 the words "no obligation" in "Old pension finder · about five minutes, no obligation" (ii; clean).
- **F2** :85 "Free to start, with no obligation. Finding a pension is not the same as moving it." (ii: :5, :98; clean).
- **F3** :87 "Nothing is moved or changed. The letter allows questions, not transactions." (ii; clean).
- **F4** :86, :88 (a caveat and a privacy line: move, not cut).
- **F5** :75 "What you do with it, if anything, is up to you." (clean, trivial).

### pension-readiness-check.html (held)

- nothing under the rule (:5 "Nothing you answer leaves this page." is a privacy line the pack quotes at :1654; :50 is a caveat).
