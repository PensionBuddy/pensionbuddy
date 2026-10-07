# Design rubric

Run 41, 1 October 2026. The rules every page is judged against, and the
yardstick for the subtraction audit (`docs/SUBTRACTION-AUDIT.md`). Each rule
is a number you can measure, not a matter of taste, and each one gives what
the site does today beside it. Nothing on the site has been changed to fit
these rules yet: this is the target, and the audit says what to cut to
reach it.

Where the numbers come from:

- **The site:** every page rendered in headless Chrome at 375 and 1440
  (29 pages and the two games; JavaScript on, reduced motion forced so
  everything is settled). For every visible element: its font size and
  weight, its margins, paddings and gaps, its text, background and border
  colours; for every screen (375 x 812, 1440 x 900): which colour families
  appear and how many filled aqua buttons; and every section, image and
  button. The nav, the top strip, the footer and the cookie bar are left out
  of the counts: they are the same on every page.
- **The references:** the seven full-page captures in `~/Downloads` that
  stand in for `/refs/` (`docs/INTERACTIVE-AUDIT-2.md`, "Reference sites"):
  Stripe, Plaid, Ramp, Revolut, Klarna, Lemonade and Mercury, each read
  screen by screen. Mercury's middle did not render in its capture, and some
  of the others have blank screens or missing images, so their image counts
  are lower bounds.

What the references agree on, in five lines:

1. One accent colour, kept for the action. One filled accent button per
   screen; everything else is neutral.
2. One primary action, at the top and at the close (and in the nav), not
   a button on every card. Two to four button labels a page; the rest are
   plain text links.
3. One family, four or five type sizes, and the headline clearly the
   biggest thing on the page (about 1.5 times a section heading).
4. Seven to twelve sections on a home page (median about 8.5), each with
   one idea, at the same rhythm all the way down.
5. Pictures of the real product or real people, or one illustration style,
   never a mix. Not every section needs a picture.

What none of them has on its home page: a grid of team headshots; a "why
choose us" list of ticks; a values or mission paragraph; an FAQ; a
calculator; contact details in the body; more than six icon cards in a
grid. Long legal text sits in the footer or in numbered notes, and only the
warnings the regulator requires sit beside the claim they qualify.

This site differs from them in one way that the rubric keeps: it is a
regulated adviser's site. The two warnings, the "information, not advice"
box, the regulator line and the review line stay exactly where they are on
every page. No rule here moves, shrinks or cuts any of them.

---

## 1. Type scale

**One family, Inter. Five roles, seven sizes. Three weights.**

| Role | 375 | 1440 | Used for |
|---|---|---|---|
| Meta | 13px | 13px | sources, footnotes, captions, form hints, the dates under a figure |
| Body | 16.5px (1rem) | 16.5px | all running text, list items, buttons, form fields, card text |
| Lead | 20px | 20px | the line under a headline, card and h3 headings, a figure inside a card |
| Section | 28px | 46px | h2; a big figure in a stat row |
| Page | 34px | 68px | h1, once per page; the one hero figure, if there is one |

- 1rem is 16.48px because the pages set `html{font-size:103%}`; "16.5" means
  1rem, not a new size.
- **Weights:** 400 for text, 600 for labels, buttons and figures in the
  calculators' results, 800 for headings. 300 only for the big marketing
  figures (the decision of 19 September, Plaid and Stripe's way). No 500,
  700 or 900.
- **Line height:** 1.65 for body and meta, 1.24 for Lead, 1.06 to 1.14 for
  Section and Page.
- **Line length:** body text at most 65 characters a line; ledes at most
  32em (already the rule).
- **Floors:** nothing under 13px anywhere; nothing under 16px inside a
  calculator's `<main>` (Run 21).
- **Case:** sentence case, never tracked, never capitals for effect;
  `verify.py`'s CASE guard already fails a page that does it.
- **The second face:** Schibsted Grotesk 800 is the wordmark in the logo
  and the footer, and nothing else.
- **Two-tone headings** (the second sentence in `--ink-2`) count as one
  heading, not two sizes, and are the way to give a heading two beats
  instead of a second size or a colour.

**Today:** 43 distinct sizes at 375 and 48 at 1440; seven weights (300 to
900). 40% of all visible text elements sit off the five roles (at 13.3,
13.5, 14, 14.5, 15, 15.8, 17, 18 and so on). The h1 alone comes in four
sizes at 375 (26, 32, 34 and 42.5px) and four at 1440 (34, 42.5, 48 and
68px). The references use four or five steps.

## 2. Spacing scale

**Nine steps: 4, 8, 12, 16, 24, 32, 48, 64, 88.**

| Use | Steps |
|---|---|
| inside a control (icon to label, chip padding) | 4, 8 |
| inside a card (between lines, label to field, card padding) | 12, 16, 24 |
| between cards in a grid; heading to its first paragraph | 16, 24, 32 |
| between blocks inside a section | 32, 48 |
| section padding, top and bottom | 88 at 1440, 64 at 375 |

- Page gutters stay as they are: 24px, 18px on a phone (`.wrap`).
- One section rhythm on every page: no section sets its own padding in a
  `style=""` attribute (36 sections across the site do, four of them in
  the home page's story).
- Two sections in a row never share a background without the full section
  padding between them; two bands of the same colour never touch.

**Today:** 39 distinct spacing values at 375 and 42 at 1440; 58% of the
margins, paddings and gaps measured are off the nine steps (6, 9, 10, 13, 14,
18, 22, 26, 30 among the commonest). Sections pad 88 and 60, and the large values
62, 90, 101 and 162 also recur. The references hold one section rhythm, about a quarter to
two-fifths of a screen, top to bottom.

## 3. Colour

**Neutrals carry the page. One accent. Three chart colours with one meaning each: blush coral (`--gap`) is money missing, amber is money coming back, teal is what the State pays; everything else in a chart is slate, a neutral.**

| Token | Value | The only things it is for |
|---|---|---|
| `--bg` | #FAFAF9 | the canvas |
| `--surface` | #FFFFFF | cards, fields |
| `--surface-2` | #F4F5F3 | a quiet band, the top strip, the warning box |
| `--ink` | #0B1F1C | headings and body text |
| `--ink-2` | #54635F | secondary text, the muted half of a two-tone heading |
| `--ink-3` | #5D6C67 | meta text (13px), hints |
| `--aqua` | #16C9B0 | **the accent:** the primary button's fill, a slider's track; in a chart, bar or figure, what the State pays (the State Pension) and nothing else |
| `--aqua-ink` | #04302A | text on aqua (7.4:1) |
| `--teal-700` | #08655A | links and small accent text on light; a State Pension figure or mark (the entitlement check's rates, its paid contributions) |
| `--teal-900` | #0A332E | the dark band's surface (a surface, not an accent) |
| `--mint` | #5EEAD4 | small accent text on the dark band (eyebrows) |
| `--amber` | #F4B740 | in a chart or bar: money that comes back or is added (tax relief, Revenue's contribution, an employer's or the State's top-up). Nowhere else |
| `--gap` | #FADCD3 | blush coral, chosen 6 October 2026 by the owner from six pale options (`docs/gap-orange-shots/pale-options.png`) after burnt orange and the old pale yellow. A fill only (blocks, chart areas, key swatches), with dark text on it: `--ink` 13.24:1, `--ink-2` 4.88:1; never white text and never a text colour. Gap figures are `--ink`. The cost of waiting is teal, the director tax bar three greys, Jargon Battle terracotta, all as before Run 42. A different hue from amber (money back), so the two no longer share a family |
| `--red` | #A4291D | a form's error state, and nothing else. White text on it 7.21:1; as text 6.49:1 on the wash |
| `--slate` | #586B85 | in a chart, bar, line, key or figure: everything that is not the State's, not money missing, not money back and not what you need (your own pot, a projection, the other plan, a way of life's costs, a statistic, a scale), as decided in Run 43. A neutral blue-grey (saturation 0.20; `tools/design-measure.py` counts it as no hue). As text AA on every light surface (4.98:1 on `--surface-2`, 5.00:1 on the wash); white text on it 5.45:1; 3.14:1 against `--ink`; never the only cue beside `--red` (1.32:1), `--ink-3` (1.01:1) or `--ink-2` (1.16:1): a key, a dash, a pattern, a white edge or a label carries the difference; at a lighter strength (opacity, never a second token) only inside one bar whose parts are named in words |

- **The accent is one hue family.** Aqua, teal-700 and mint are the same
  colour at three strengths, for three backgrounds; together they are the
  one accent. In a chart, a bar or a figure the accent's hue means one thing, what the State pays (Run 43); a reader's own pot, a projection or a statistic in teal would read as the State's. The reader's own place on a scale (a "You" chip, the picked year, the step that applies) is neutral: ink on `--surface-2`, or a slate mark.
- **Amber and the gap coral are data.** Inside a chart, a bar or a figure's key, amber means money that comes back or is added (tax relief, Revenue's contribution, an employer's or the State's top-up) and blush coral (`--gap`) means money missing (a gap, a shortfall, a loss, the cost of waiting, tax you would pay, charges taken from the pot), as decided in Run 42 (superseding Run 32's amber = gap; the red of Run 42 became blush coral, #FADCD3, on 6 October 2026); teal is what the State pays (the State Pension, and only that; the State's top-up into auto-enrolment is money back, amber), what you need is soft grey (`--line-2`, dark until 7 October 2026), and slate is everything else (Run 43). A gap or slate mark always has its label in words beside it; colour is never the only signal. Neither is ever a badge, a highlight, a callout's border or an icon.
- **No other hues.** A form's error state uses `--red`, and only a form's error state does. The warnings are black on `--surface-2` with a rule, as they are now.
- **Text colours on a page:** the three inks, teal-700, white and mint; and, for a figure or its label only, slate (Run 43); gap figures are ink, never body text.
- **Dark bands:** at most two on a page besides the footer, never one
  straight after the other.
- **Mist teal, not dark (6 October 2026):** the calculator result card
  (`.res-hero`), the closing "book a call" band (`.final`), the visitor's chat
  bubble (`.msg.them`) and the booking "house promise" card (`.promise`) are
  `--teal-50` with a `--teal-100` border and ink text (labels `--ink-2`,
  eyebrows `--teal-700`); the closing band's button is the aqua primary.
  Also mist teal: the homepage free-tool band (`#calc`), the "see your own
  numbers" band (`.callout.pb-dark`, starter, tracker, director), the
  "Reveal the illustration" button (`.pb-guess-btn`, teal text, teal edge),
  the tracker's "One picture of what you have" box and the glossary's
  risk-rating tile; and (7 October 2026, the owner's call) the homepage
  deadline band (`.tick`, its countdown boxes white on the mist) and the
  homepage "what you need" bar, now soft grey `--line-2` with ink figures.
  Still dark on purpose: the cookie bar (it must be seen). Mock-ups and
  before/after shots in `docs/pale-mockups/`.
- **Contrast:** AA, 4.5:1 for body and meta, 3:1 for text 24px and over;
  aqua is never text on a light background.
- `--ink-3` is defined twice in every stylesheet (#647270, then #5D6C67
  later): one value, the later one.

**Today:** 20 text colours and 18 background colours in use. Besides the
table: #9FDDD2, #A7DED4 and #CBEBE4 (three more mints), #0C8175 and
#0D9488 (two more teals, #0D9488 on the `.hl` heading highlight), #FBF7EF,
and four ambers and browns for amber's text (#5E4408, #3F2D04, #8C6010,
#7A5A12), and three reds (#C0392B, #A4291D, #C1502E) before Run 42 made them one. 14 border colours. Run 43 moved every chart, bar, figure and place marker that was teal but not the State's onto `--slate` or a neutral.

## 4. One accent per screen

**On any one screen (375 x 812 or 1440 x 900): one filled aqua element at
most, and no second chromatic colour except amber or red inside a chart.**

- The filled aqua element is the screen's primary action, or the State Pension's own bar or figure meant to be the thing you read first; not both.
- The nav's booking button is an outline and does not count (already the
  rule, "von Restorff", in PB-AUDIT).
- Every other button on that screen is an outline or a text link.
- A chart's own colours (teal, amber, red; slate is a neutral) do not count as the screen's accent,
  but a screen with a chart has no other decoration in colour: no tinted
  icon squares, no coloured chips, no aqua highlight in a heading beside
  it.
- Coloured heading highlights (`.hl`, teal words inside a black heading)
  are an accent; a screen that has one has no filled button.

**Today:** the home page at 375 and the starter page at 1440 each have a
screen with two filled aqua buttons. Twenty screens (12 at 375, 8 at
1440) on ten pages show amber beside aqua: booking, thank-you, glossary,
starter (six of the twenty), the pension and director calculators, the
entitlement check, the home page and Jargon Battle. Where the amber is a
chart's (the pension calculator's tax-relief bar, the home page's gap)
the screen passes; the audit says which of the rest are decoration. Of
the references, Lemonade alone breaks the rule (five
filled buttons in one row); the others hold one. Run 42 moved the gap from amber to red; the amber-beside-aqua counts above predate it, and tools/design-measure.py now reports red beside aqua in its own column.

## 5. Sections and length

**A section is one idea with one heading and at most one button. A page
has at most this many, between its hero and its footer:**

| Page type | Pages | Sections | Screens at 375 |
|---|---|---|---|
| Home | `index` | 8 | 14 |
| Audience | `starter`, `director`, `tracker` | 6 | 10 |
| Calculator | the five calculators and the two checks, `my-pensions`, `pia`, `standard-fund-threshold`, `find-my-pension` | the tool and its results, then 3 (how it works, what it does not cover, the next step) | the tool, plus 5 |
| Guide | the six guides, `glossary` | the article, then 2 (related, the next step) | no cap; past 8 screens it opens with its own contents list |
| Booking and confirmation | `booking`, `thank-you`, `404` | 3 | 5 |
| Legal | `privacy`, `terms`, `complaints`, `how-we-work` | the text, then nothing | no cap |

- **Screens are counted to the top of the footer.** The footer is 2.8
  screens at 375 (2,291px) and 1.2 at 1440 on its own, the same on every
  page, and counts against nothing.
- **The hero counts separately** and is one screen at most at 1440.
- **One primary action a page,** "Book a free call with Damian": after the first give (on the home page, under the gap and the way-of-life picker; on the other pages, in the hero), once in the middle if the page is over 8 screens, and in the closing band. Calculators and guides add their own one secondary action
  (try the calculator, get the guide). No more than four button labels on
  any page.
- **A section doing another page's job is a link, not a section.** The
  home page points to the calculators; it does not hold one.
- **Things that stay, and do not count against the cap:** the two warnings,
  the "information, not advice" box, the regulator and review lines, the
  related-pages list at the end, the footer.
- **Repeated ideas are merged:** the same claim, figure or reassurance on
  one page twice is one section too many. "How it works" in three steps
  appears once a page.

**Today** (whole page, footer included): the home page has 19 sections
and is 24 screens long at 375 (18 at 1440), about 21 above the footer; starter 14 and 21 screens; PIA 12 and 25; the auto-enrolment
comparison 6 and 18; the entitlement check 7 and 19. The references'
home pages have 7 to 12 sections (median about 8.5) over 7 to 17 desktop
screens.

## 6. Pictures

**Real people, the real product, or one painted style. One picture a
section at most.**

- **What may appear:** photographs of Damian, Adam and Buddy; Dublin; the
  real calculators photographed by `tools/shoot-product.py` (re-shot after
  any change to the calculator they show, `product-rasters-go-stale`); the
  games' own art; the provider logos (one row, on the home page only, each
  set to the same optical height); and, once painted, the illustrations in
  `docs/ILLUSTRATIONS.md`, in one style across the site. No stock
  photographs, no generated people, no 3D renders, no clip art.
- **Never mixed in one section:** a photograph beside an illustration
  beside an icon.
- **One picture a section;** a section can have none, and most should. A
  strip of photographs is one picture.
- **Nothing empty ships:** a slot waiting for a video or a picture (a
  placeholder with a paw on it) stays off the live page until it is filled.
- **No words inside a picture,** except a product shot, whose figures carry
  the caption "Example figures." or "Illustration only." beside it.
- **Shape:** corners 8px (the radius scale is 4 for inputs and chips, 8 for
  cards and pictures, 999 for pills); no shadows (the site's tokens already
  set them to nothing); width and height on every image, so nothing moves
  as it loads.
- **On a phone:** a picture is never taller than one screen, and nothing
  sits above the h1.
- **Words:** `alt` says what the picture shows, or is empty when the
  picture repeats the text beside it.
- **Video:** a poster frame, never sound by itself, a pause control, and
  it stops (already so on the games' clips).
- **Icons:** only working icons (search, menu, close, arrows, play and
  pause). An icon in a tinted square beside a heading is decoration, and
  is one of the things `ILLUSTRATIONS.md` would replace or the audit
  would cut.

**Today:** the home page shows 11 pictures and video slots at 375 and 13 at
1440, three of them empty video slots with a paw. Radii in use: 2, 3, 4,
5, 6, 8, 9, 10, 12, 13, 99 and 999px.

---

## How a page is scored

`python3 tools/design-measure.py` prints R1, R2, R3, R5, R6 and R7 for
every page at both widths, and the site's totals, in one Chrome launch
(`--pages` for some, `--json` to keep the raw figures). It reports and
judges nothing. Then, for each page and each width:

| # | Check | Passes when |
|---|---|---|
| R1 | Type sizes | every text element is on one of the five roles |
| R2 | Weights | 300 (big figures only), 400, 600, 800 |
| R3 | Spacing | every margin, padding and gap is a step, or under 4px |
| R4 | Colour | text, background and border colours are all in the table |
| R5 | Accent per screen | no screen has two filled aqua elements, or a second hue outside a chart |
| R6 | Sections | at or under its type's cap |
| R7 | Length | at or under its type's screens at 375, above the footer |
| R8 | Actions | at most four button labels; the primary action after the first give and at the close |
| R9 | Pictures | one a section; none empty; one style; width and height set |
| R10 | Legal | the warnings, the information box, the regulator and review lines are present and unchanged |

R10 is the one that never gives way: if passing another rule would move
or shorten anything in it, the other rule loses.
