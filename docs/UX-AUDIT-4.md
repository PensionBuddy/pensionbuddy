# UX audit 4 — 29 September 2026 (Run 37, overnight)

Every page walked at 375 and 1440 as three people, on main `30f8d12`: 29 root
pages and the two games. The walk was a headless Chrome pass that recorded,
per page and width: the page height, every visible `h2` and where it sits,
where the first booking link is, the last thing in `<main>` before the footer
and where it links, the sliders, and a picture of the first screen and of the
last screen before the footer. It was one pass of about half an hour, as the
brief allowed, not a usability study: "stuck", "bored" and "lost" below are
read from the page, never from a real person.

The three people:

- **A Starter**: no pension yet, or one never looked at. Arrives on the home
  page, tries the pension calculator, meets jargon, may book.
- **A Tracker**: two or three old jobs, statements in a drawer. Arrives on the
  home page or `tracker.html`, wants to know where to start and what it costs.
- **A Director**: runs a company. Arrives on `director.html`, tries the
  director calculator, reads the 2026 rule changes, may book before the
  October deadline.

## What the walk found

### The Starter

| Where | What happens | Stuck, bored or lost | Built in |
|---|---|---|---|
| Home, first screen | Clear: one heading, "Get my free review" and "Try the calculator". The three "sounds like you" chips sit in the phone picture beside the hero on a wide screen, under it on a phone. | Nothing here says "something just changed in my life, where do I go?"; the six places to begin are at 5,488px on a phone and the "Which of these sounds most like you?" band at 14,025px. | Item 1 |
| Pension calculator | Works. Ends on "The assumptions behind these numbers", a list of caveats, then the footer. | **Stuck at the end:** the last thing the page says is its caveats; there is no next page offered. The same on all eight calculators and tools. | Item 7 |
| Pension calculator | Change one input to see the difference and the old figure is gone. | Has to remember numbers to compare two plans. | Item 5 |
| Any page with a term | "PRSA", "AVC", "Standard Fund Threshold" are expanded (the initialism rule) but not explained; the glossary is one click away only where a page links it. | **Lost** on the first term; the jargon chips exist only on the three audience pages. | Item 2 |
| Glossary | 22 terms in one long page (11,688px on a phone). | Finding one term means scrolling or the index row. | Items 2, 3 |
| 404 | "This page is gone" with four links. | A dead end with nowhere obvious to go next. | Item 8 |

### The Tracker

| Where | What happens | Stuck, bored or lost | Built in |
|---|---|---|---|
| `tracker.html` | Good first screen. | Fine. | |
| Old pension checklist | Ten steps and "Want help with it?" links. | Fine; ends well. | |
| All your pensions in one view | Ends on the summary card and three small links. | **Stuck at the end**: small links only. | Item 7 |
| Charges calculator | Ends on its assumptions. | As the Starter. | Item 7 |
| UK pensions guide | 4,775px on a phone, five sections, ends on "Worth a conversation" and a paragraph of sources. | Can't see the page's shape before reading it. | Item 6 |
| Search for "ARF" or "PRSA" | There is no search. The nav has 19 destinations in four menus. | **Lost** if the word isn't in a menu label. | Item 3 |

### The Director

| Where | What happens | Stuck, bored or lost | Built in |
|---|---|---|---|
| `director.html` | Clear first screen, booking in reach (673px on a phone). | Fine. | |
| Director calculator | Ends on its assumptions, like the others. | **Stuck at the end.** | Item 7 |
| What changed for directors | Six sections, 7,279px on a phone; ends on the four questions and the list they produce, then nothing. | **Stuck at the end**, and no view of the page's shape. | Items 6, 7 |
| Standard Fund Threshold | Ends on "The rules behind these numbers". | **Stuck at the end.** | Items 6, 7 |
| PIA page | The longest page on the site: 18,824px on a phone (2,213 words); the first booking link is at 14,524px. | **Bored**: no index, no sense of how far is left. | Item 6 |
| Sliders, all calculators | The value is written beside the label, away from the thumb; nothing marks where the relief bands change on the age slider. | Has to look away from the thumb to read the value. | Item 9 |

### Everyone

- **Figures that wait.** Every page's deadline chip in the nav reads "--"
  until `pb-deadline.js` has run (it runs at the foot of most pages); the home
  page's deadline clock the same (`#tkD`). The calculators' headline figures
  are "€0" in the markup until the page script writes them. On a fast
  connection this is a flash; on a slow one it is a wrong number. (Item 10.)
- **Where the pages end.** Ten live pages end with no next page offered: the
  eight calculators and tools on their assumptions or rules, and the
  directors' rules and All your pensions on their form. (Item 7.)
- **Nothing is broken.** No FAIL in the page audit; the four WARN rows are the
  known ones (find-my-pension R20-1a, glossary C4, how-we-work R20-9a,
  privacy R20-A2).

## Found by the audit, not on the brief's list

Nothing S or M that the ten items do not already cover. The walk's findings
all land in items 1 to 10 (the tables above say which). Three things are
bigger than M or are not mine to decide, and are questions in STATUS, Run 37:

1. **Age 75 is not on the site.** The brief lists "75 vesting" as a milestone
   the site already covers. No page and no module says anything about 75
   (searched every page, every module and every parts file). The timeline
   (item 4) stops its milestones at 71, the last age the site names (the ARF's
   5% from the year you turn 71), and asks for words for 75.
2. **Terms the site uses that the glossary does not define.** Auto-enrolment
   and My Future Fund, Pay-Related Social Insurance (PRSI), the Universal
   Social Charge (USC), small self-administered schemes, HomeCaring Periods,
   credits. The tooltips (item 2) take their words from the glossary only, so
   these get none. Adding entries is new copy.
3. **The home page is 17 screens on a phone** (17,267px, 14 sections). The
   life-event picker (item 1) gives a route out from the first screen; making
   the page shorter is an edit to locked copy.

## How each item is built and gated

The brief's rules, restated once so each commit can point here:

- One commit per item, pushed; the full gate on each (every suite, the page
  audit at 375 and 1440, render-diff at load and on 8,000 events a page).
  Fails twice: reverted, one line in STATUS, skipped.
- No new figures, rates or claims. Every number an item shows is already on
  a page or in a module, and each item's commit says where.
- No page copy changes. New words are labels and headings only (the picker's
  chips, "On this page", "Search"), and each is listed in STATUS, Run 37, for
  the compliance pack.
- Every interactive element has a static fallback: with JavaScript off the
  page still reads and every destination is still a link.
- Motion: nothing animates for a reader who asks for reduced motion; nothing
  scroll-jacks; caveats never animate; nothing rewards booking.
- A calculator page that is touched is proved with render-diff: its figures
  are written exactly as before.
