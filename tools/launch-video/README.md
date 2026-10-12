# Pensionbuddy launch video

A 36.25-second launch film made entirely in code: one canvas page draws every
frame as a pure function of time, a Node script synthesises the music and
sound effects from the same cue list, headless Chromium renders 60 fps with
motion blur, and ffmpeg encodes. No video editor, no stock music, no samples.

Outputs, in `docs/launch-video/`:

| File | What |
| --- | --- |
| `pensionbuddy-launch-16x9.mp4` | 1920x1080, 60 fps, H.264 High + AAC 192k, 36.25 s, 6.5 MB |
| `pensionbuddy-launch-9x16.mp4` | 1080x1920 for Reels / TikTok / Shorts, same, 6.1 MB |
| `pensionbuddy-launch-16x9-poster.png`, `pensionbuddy-launch-9x16-poster.png` | posters (the lockup and line, 4.6 s) |
| `contact-16x9-{1,2,3}.jpg`, `contact-9x16-{1,2,3}.jpg` | the final review sheets |

Measured on the final files (ffmpeg loudnorm, first pass, and ebur128):
-14.11 LUFS integrated, -2.39 dBTP true peak, LRA 3.0 LU, in both. Flash
check: at most 1 whole-frame and 4 (16:9) / 3 (9:16) per-cell transitions in
any second, against a limit of 6.

## Re-render

Needs Node 22, Playwright with its Chromium (a global install is found
through `NODE_PATH` or `npm root -g`; nothing is downloaded), and ffmpeg/ffprobe 6.
Intermediates (screenshots, WAVs, review stills) go to `$LV_WORK`, default
`<os tmpdir>/pb-launch-video`, never into the repo.

```sh
export LV_WORK=/tmp/pb-launch-video            # optional
node tools/launch-video/shots.mjs              # photograph the real calculator (fails if its figures change)
node tools/launch-video/audio.mjs              # synthesise, master to -14 LUFS / -1 dBTP, loudnorm two-pass
node tools/launch-video/contact.mjs --check    # reading time of every line, frame by frame (exit 1 on a miss)
node tools/launch-video/contact.mjs --guides   # review sheets with the safe area drawn, into $LV_WORK/review
node tools/launch-video/contact.mjs --stills=11.4,17.5 --fmt=9x16   # full-size stills
node tools/launch-video/render.mjs             # both cuts, posters, flash check, loudness report (~5 min a cut)
node tools/launch-video/render.mjs --fmt=9x16 --frames=720-900      # a test slice, into $LV_WORK
node tools/launch-video/contact.mjs --final    # the review sheets for docs/launch-video
```

To preview in a browser, serve the repo root (`python3 -m http.server`) after
`shots.mjs`, copy `$LV_WORK/calc-*` next to it under `__work/`, and open
`/tools/launch-video/film.html?fmt=9x16`; `FILM.still(t)` draws any moment.

## Files

| File | Job |
| --- | --- |
| `timeline.mjs` | The one source of truth: 96 BPM grid, shots, every cue, the copy, the figures, the chords. Both the film and the audio import it. |
| `film.html` | The canvas film. `?fmt=16x9` or `?fmt=9x16`; `&guides` draws the safe area. Exposes `FILM.frame(i)`, `FILM.still(t)`, `FILM.step(t)` (reading-time tracking) and `FILM.sheet(...)`. |
| `shots.mjs` | Serves the repo, opens `pension-calculator.html` at 1200 CSS px and device scale 2, verifies the defaults show EUR 460,066 and EUR 1,534 a month, screenshots the page and measures the crop rectangles (sliders, results down to their divider, growth chart) from DOM bounding boxes. |
| `audio.mjs` | The synth, the mix, a BS.1770-4 meter, a 4x true-peak meter, a look-ahead limiter, a 48 kHz 16-bit WAV writer, then ffmpeg loudnorm two-pass. |
| `render.mjs` | Frames from Chromium into ffmpeg (image2pipe, libx264 CRF 19 preset slow, yuv420p, BT.709, +faststart), muxed with the master; WCAG 2.3.1 flash check; poster; final loudness via ffmpeg ebur128. |
| `contact.mjs` | Contact sheets, stills, and the frame-by-frame reading-time check. |
| `lib.mjs` | Paths, the static server, the browser. |

## Method

- **Pure function of time.** Every motion is a closed-form damped spring,
  `1 - e^(-zwt)(cos w_d t + (zw/w_d) sin w_d t)`, evaluated at the time since
  its cue. Pops and coins are started early by the spring's first-crossing
  time so they *land* on their beat; coins fall under gravity and touch down
  on their cue. No state is carried between frames.
- **Beat grid.** 96 BPM: beat 0.625 s, bar 2.5 s. Every shot change and
  arrival is a beat or a subdivision of one (letters on 32nds, coins on
  beats, jargon letters locking on 16ths).
- **Motion blur without smeared type.** Each frame averages four subframes
  over half a frame (a 180-degree shutter) with a running average in the
  page. Shapes and photos move on the subframe clock; text, counters and the
  camera push use the frame's clock, so they are identical in all four
  subframes and stay sharp. The shot is chosen by the frame clock, so a cut
  never blends two shots.
- **The real product.** The calculator shot is a screenshot of
  `pension-calculator.html` as it ships, cropped by measured DOM rectangles;
  the logo is drawn from the brand geometry in `assets/brand/`; Figtree is
  the site's own variable font; the photos are `assets/img/`.
- **Two cuts, one timeline.** Sizes are in units of 1% of the short side;
  each shot lays out per format inside its safe area (16:9: 120 px sides,
  90 px top and bottom; 9:16: 120 px sides, 250 px top, 440 px bottom, clear
  of Reels/TikTok's interface).
- **Reading time.** `contact.mjs --check` records, for every line on every
  frame, whether it is fully readable (opaque, settled, unscrambled) and
  checks its longest readable stretch against max(2.0 s, 1.0 s + 0.3 s a
  word). Every line passes in both cuts. The only exceptions are the gap
  counter's passing values (EUR 3,636 and EUR 12,036 a year short, 0.4 s
  each as the cost steps up a beat at a time); its final value, EUR 18,036,
  holds 2.4 s.
- **Flashes.** Every rendered frame's relative luminance (whole frame and a
  6x3 grid, at full resolution) is checked as `tools/record-games.mjs`
  does: a change of 0.1 from the last turning point is a transition; more
  than six in a second fails. No full-screen strobes; dark and light grounds
  alternate only at cuts, at least 3 s apart.
- **Audio.** Kick (pitch-dropping sine), clap (three shaped noise bursts and
  a tail), hats (high-passed noise), bass, a detuned wavetable pad, a
  Karplus-Strong pluck arpeggio, an FM bell hook with a ping-pong echo, a
  Freeverb-style reverb send, risers and whooshes that end exactly on each
  cut, pops for the toes, ticks for letters, clinks for coins (amber coins
  add a sparkle), blips for the scramble. Bass and pad duck under the kick.
  Progression: G, A into the drop, then D Bm G A, ending on D.

## Shot list

| # | Shot | Beats | Time | Ground |
| --- | --- | --- | --- | --- |
| 1 | Intro: the mark springs in, a toe a beat (beats 0-3), the wordmark letter by letter riding the mark into the lockup, underline, "Pensions, made friendly." | 0-8 | 0.00-5.00 | dark |
| 2 | The gap: "The State Pension pays EUR 15,564 a year." (teal bar, beat 9), then "Even a modest retirement costs more." with what it costs stepping Modest, Moderate, Comfortable on beats 14, 15, 16 and the blush gap growing to "EUR 18,036 a year short"; source line throughout | 8-20 | 5.00-12.50 | light |
| 3 | The calculator: "See what you're on track for." / "Two minutes, no sign-up."; the real page lands, the sliders lift (beat 22), the results lift (24), the page scrolls (25.5) and the growth chart lifts (26); "Illustration only. The value of a pension can fall as well as rise." | 20-29 | 12.50-18.13 | dark |
| 4 | Tax relief: "Put in EUR 100 a month." / "It could cost you EUR 60."; three ink coins, one a beat (30, 31, 32), "You pay EUR 60", two amber coins (33, 34), "Revenue adds EUR 40"; the small print | 29-37 | 18.13-23.13 | light |
| 5 | Jargon buster: PRSA and AVC decode from random letters, their glossary definitions land a beat later | 37-46 | 23.13-28.75 | dark |
| 6 | People: Damian Condon, Qualified Financial Adviser (QFA), 30 years' experience; Buddy, Chief Napping Officer; the regulatory line arrives here and stays to the end | 46-51 | 28.75-31.88 | light |
| 7 | End card: the lockup, pensionbuddy.ie, "Book a free 20-minute call", the regulatory line; the toes wink on the last downbeat (56), the final D chord | 51-58 | 31.88-36.25 | light |

Colour meanings: the State Pension is teal and only the State Pension is
teal; the gap is blush coral with its figure and words beside it; money
back is amber; what a person needs is ink. (The person's own pot, slate,
appears only as the calculator's own chart line.)

Sources: State Pension (Contributory) maximum personal rate 2026, EUR 299.30
a week x 52 = EUR 15,564. Pensions Council, Irish Retirement Living
Standards, one person, 2024 prices: Modest EUR 19,200, Moderate EUR 27,600,
Comfortable EUR 33,600. Definitions from `glossary.html`. Calculator figures
read from the page by `shots.mjs`.

## Why 36.25 seconds

The storyboard asked for about 30 seconds (12 bars) and for every line to be
readable for max(2.0 s, 1.0 s + 0.3 s a word). The copy needs more than 12
bars at that rate, so reading time won: the twelve bars carry the story into
the people shot, and the end card is a 1.75-bar tail (4.4 s). The 21-word
regulatory line needs 7.3 s by the same rule; it arrives with the people
shot, at the same place on the same ground, and stays to the last frame, so
it is readable for 7.45 s (4.4 s of it on the end card).

## Review log

Each round rendered contact sheets of both cuts (and full-size stills),
which were looked at and scored before changing anything.

**Round 1** (first layout). Found: type far too small for a phone in both
cuts (headlines 6.4% of the short side); in 9:16 everything sat in the top
half; the wordmark's first letters drew over the still-large mark as it
glided (1.95 s); frame 0 showed only a tiny square; the 16:9 gap chart was
cramped into a corner; the lifted calculator parts, the jar, the jargon
cards, the people captions and the end card were all undersized; the reading
check flagged counter values in motion. Fixed: a type scale (headlines 8.4-8.8
units, small print 2.6-3.0 units); the wordmark now rides with the mark;
the square starts 0.1 s before the first frame so frame 0 shows it; 16:9 gap
redrawn as horizontal bars with level ticks under the cost bar; bigger
lifts, jar, cards and lockup; counters marked as passing values until settled.

**Round 2.** Found: 16:9 gap bars thin with an empty band above the source
line; "EUR 18,036a year short" (a leading space dropped by the wrapper); the
calculator headline wrapping into three short lines; the regulatory footer
pre-rolling into the last frames of the dark jargon shot (low contrast);
Damian's role wrapping in 16:9; in 9:16, the first coin falling across the
tax headline, and the people/end card leaving large empty bands. Fixed:
thicker bars and spacing, the gap figure and words drawn as two runs, a wider
copy column, the footer drawn only from the people shot's first frame, cards
further apart, coins appear just above the jar in 9:16, a zig-zag people
layout in 9:16, the end card lower with a bigger button.

**Round 2b** (full-size stills). Found: coins in the stack merged into two
colour blocks; the 9:16 Buddy photo touching the regulatory line; Damian's
name wrapping in 9:16; the lifted results showing a half-hidden footnote
under the chart; the 9:16 page outside the safe area. Fixed: coin seams, a
smaller 9:16 photo size, the results crop measured down to the results'
divider, the 9:16 page inside the safe area.

**Round 3** (sheets of the final build and frames from an encoded test
slice). Found: the flash check reporting 7 transitions a second in one cell
at the calculator cut; on inspection the full-resolution mean of that cell
changed smoothly (229 to 235) and the jumps came from measuring on a
20x nearest-neighbour downscale that aliased on moving page text. Fixed:
luminance is now measured at full resolution (every second pixel); worst
case is 2 transitions a second. Also found the 16:9 jargon block sitting high;
lowered it and enlarged the terms. Reading-time check: every line passes in
both cuts. Encoded frames: text and counters sharp, no ghosting.

**Round 4** (the first full render, measured). Found: the flash check passed
but exactly at its limit, 6 transitions in a second, in two cells at
18.4-19.3 s: the three dark coins falling on eighth notes through the same
part of the screen, each a dark shape crossing a light ground (two
transitions each). And the AAC encode raised the true peak to -1.2 dBTP,
close to the -1 limit. Fixed: the coins now drop one a beat, as the brief
says ("on the beat"), which made the tax shot a beat longer and the film
36.25 s; the master is limited to -1.9 dBTP before encoding.

## Judgement calls

- Two jargon terms, PRSA and AVC. Inflation's definition (13 words, 4.9 s)
  does not fit beside PRSA in the time the brief allows; AVC's (10 words,
  4.0 s) does.
- Coins drop one a beat, not on eighths: on eighths three dark coins sat at
  the flash limit (see round 4).
- The paw's first toe lands on beat 0 with the square, which springs in from
  0.1 s before the first frame; toes 2-4 land on beats 1-3, and the
  wordmark starts on beat 3 so it can be read for 2 s before the drop.
- The page screenshot keeps the site's live deadline chip in its nav as it
  showed on the day it was taken.
