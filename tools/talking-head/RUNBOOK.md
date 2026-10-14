# Pensionbuddy talking-head edit: runbook

For a Claude Code session on the Mac that has the footage in `~/Downloads`.
`brief.toml` holds the brief (scripts, on-screen text, style, safe zones,
regulator line). `pb_edit.py` does the work. This file is the order of work.

## Rules from the brief (do not break)

- Do not move, rename, edit or delete originals. `pb_edit.py` only reads them.
  It writes to `~/Downloads/pensionbuddy-edit/` and `~/Downloads/pensionbuddy-finals/`.
- Captions show what is said, not the script.
- Never fill a missing or failed line with AI voice or text only. It stays a reshoot flag.
- Do not hide fails. Every flag goes to the user.

## 0. Open items: ask the user, do not block on them

Check `brief.toml` and ask the user for what is still open:

1. Video 1 script: `enabled = false` until it is pasted into `lines`.
2. The regulator line from Gresham compliance: `[regulator] text`, then `approved = true`.
   The current text is a draft in the form of Regulation 71(4).
3. Font: the brief says Geist. The site and logo use Figtree.
   To use Figtree: `font = "{work}/fonts/Figtree-Variable.ttf"`, `font_weight = 700`.
4. Regulator line on screen for 2 s (brief). The reading-time rule from the launch video
   needs about 6 s for it. To change: `[regulator] hold_seconds`.

If the user is not there, continue with the draft values. The flag list shows them.

## 1. Set up (once)

```sh
cd "<this folder>"
./setup_mac.sh
```

If it says Homebrew is missing: ask the user to paste the line it prints into
Terminal (Homebrew asks for the Mac password). Then run `./setup_mac.sh` again.

```sh
PY=~/Downloads/pensionbuddy-edit/.venv/bin/python
$PY pb_edit.py check
```

Every row must be OK or WARN. Optional (about 10 minutes): `tests/run_selftest.sh`
(synthetic shoot, real whisper). It must end `selftest: PASS`.

## 2. Footage list (brief task 0)

```sh
$PY pb_edit.py inventory
```

Show the user the table: video files, newest first, date and length, and the
shoot it chose (the latest one). Then continue. Do not wait.
Wrong shoot: `$PY pb_edit.py inventory --shoot N`.

## 3. Transcribe, match, rank (brief tasks 1 and 2)

```sh
$PY pb_edit.py run --from transcribe --until rank
```

- `pensionbuddy-edit/ranking.md`: every take of every line, best first, why, and
  its words numbered. Clips that match no script line are listed in `takes.json`
  and later in the flag list.
- Look at every review sheet: `pensionbuddy-edit/review/v2-line1.jpg` and the rest.
  For each pick check by eye: eyes on the lens (not on notes), natural expression,
  framing and light like the other picks. The automatic eye-line score is rough.
- To change a pick: `$PY pb_edit.py pick 2 3 T014 --reason "eyes on lens; T012 looks at notes"`
- Only flawed takes for a line: you may cut it from two takes at a pause between
  sentences, words in script order, only words actually said:
  `$PY pb_edit.py pick 2 4 T009:1-7 T008:8-` (word numbers from `ranking.md`).
  The flag list then asks the user to listen to the join.

## 4. Render and check (brief tasks 3 to 7)

```sh
$PY pb_edit.py run --from render
```

- Read `pensionbuddy-edit/qc/qc.md`. Every check must be PASS.
- Look at every contact sheet (`pensionbuddy-edit/qc/*-sheet.jpg`, one frame a
  second, red box = safe zone): all text inside the box, no text over the eyes or
  mouth, no jump in framing or light, no black or odd frame.
- Fix and run `run --from render` again until clean. Common fixes:
  - pause too long: whisper put a word in the silence. Check that take in
    `ranking.md`; pick another take, or accept it and say so.
  - captions not equal to audio: the two whisper passes heard a word differently.
    Do not guess. Flag it for the user to check by ear (set `second_model` in
    `brief.toml` for a second opinion).
  - text over the face: lower `title_size` or `caption_size`, or change the
    `[safe.*]` top or bottom in `brief.toml`.
- What you cannot fix stays in the flag list. Add what you saw on the sheets.

## 5. Deliver

In `~/Downloads/pensionbuddy-finals/`:

- `pensionbuddy-v2-9x16.mp4`, `pensionbuddy-v2-4x5.mp4`, `pensionbuddy-v2.srt` (and v1, v3)
- `pensionbuddy-v2-take-log.md`: line, clip, timecode, why picked, second best
- `pensionbuddy-flags.md`: reshoots, spoken lines that differ from the script,
  clips that match no script, QC results, open compliance items

A video with a wrong figure or a missing line goes to `_blocked/` with `-BLOCKED`
in its name. It is not a final.

Tell the user in short lines: what is ready, what is flagged, what needs a
reshoot, and the status of the regulator line and Video 1.

## How it decides

- Takes: found by matching each clip's transcript to the script lines (one clip
  may hold several takes). Numbers and dates compare by value: "€1,000" and
  "a thousand euro", "18 November" and "the 18th of November" are equal.
- Ranking: figures right and the line complete, then fewest wording changes, then
  fewest stumbles (fillers, repeats, restarts, a take much longer than the others),
  then eye-line (YuNet face landmarks), clean audio (signal to noise, clipping),
  natural energy (pitch and loudness range, pace) and steadiness. A pick far from
  the others in face size, brightness or colour gives way to a clean runner-up.
- Cuts: in and out at the first and last sound of each line (line 1 starts at
  0.08 s); pauses and breaths over 0.3 s cut to 0.20 s (0.27 s between sentences)
  at their silent middle; never inside a word.
- Audio: high-pass 80 Hz, light noise reduction (afftdn, 10 dB), each line's
  level matched, -14 LUFS with a limiter at -2.5 dBFS (true peak checked at or
  under -1.0 dBTP after AAC).
- Picture: 9:16 and 4:5 crops centred on the face, 30 fps, H.264 High, AAC 192k.
