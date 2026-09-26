# The render-diff harness

Proves that a change to a calculator page changes nothing a reader sees.

It loads the page script from the working tree and the same script from a git
ref, drives both through the same states, and compares every write each makes to
the DOM. The baseline comes out of git rather than a copy someone remembered to
take, so this is usable for the next refactor and not only the one it was
written for:

```bash
cd tests/render-diff
BASELINE_REF=HEAD~1 node load.js          # against the previous commit
node sweep.js compare --axes --corners    # against HEAD, i.e. "does my working tree change anything"
```

This is **not** part of `python3 tests/run-tests.py`. It needs a baseline to
compare against, and a full entitlement sweep is over an hour of CPU. Reach for
it when a change claims to be a refactor. The runner has its own probe of the
two State Pension pages, `tests/page-probe.js`, which asserts the page against
the spec's worked examples and the module rather than against a baseline; it
pins the same instant `runpage.js` does, and it borrows the traps below.

| file | what it does |
|---|---|
| `minidom.js` | a DOM built from the SHIPPED html, recording every write as `[element, property, value]` |
| `runpage.js` | loads a page script into a `vm` behind that DOM and the page's real modules; fixed clock, collected timers, drained animation frames |
| `pages.js` | the five pages, and where the baseline comes from |
| `compare.js` | one state through both copies, compared four ways |
| `load.js` | the render each page performs **as it loads** |
| `sweep.js` | the state sweep: exhaustive where the input space allows, stratified where it does not |
| `sequences.js` | the **event path**: scripted sessions of real `input`/`change`/`click`/`keydown`, compared after every action |
| `browser-diff.py` | the same pages in **real headless Chrome**, baseline checkout against working tree; each run makes its own checkout in a fresh temp directory and names its probe page by process id, so runs can overlap |
| `mutate-shared.js` | breaks `assets/js/calc-page.js` on purpose, one change at a time, and requires the sweep to notice |
| `classify-director-floor.js` | Run 29: not a refactor, so the claim is WHERE the director calculator differs once its retirement age cannot go below 50: nowhere at age 49 and over, only in the slider's `min` and fill at 48 and under, and the figures only where retirement was below 50 |
| `classify-pension-floor.js` | Run 30 (R29-9): the same claim for the pension calculator's floor of 50, at both tax rates |

## What "the same" means here

Four comparisons, because three of them can each be passed by a page that has
genuinely changed:

1. **Final state.** The last value written to each cell. What a reader sees. On
   its own it misses anything transient.
2. **The bag of writes, values included.** A wrong value immediately corrected by
   a later write is invisible in the final state and is still a difference in
   behaviour — and the next edit that reorders those two lines puts it on the
   screen. This is what caught a `forEach(paintSlider)` passing the array index
   as the wording map.
3. **Pending timers, and a snapshot taken before any timer runs.** A live region
   that used to be written synchronously and is now on a 700ms debounce leaves
   the settled render identical. Comparing only the settled render calls that
   clean. It is not.
4. **Write order**, reported but not failed. Everything in a handler lands before
   the browser paints, so two independent groups of writes swapping places inside
   one synchronous handler is not something a reader can observe. Worth knowing
   about, so it is counted and named rather than hidden.

The render each page performs **at load** is compared too. Every other
comparison starts after load, so a change that dropped the first paint of every
slider would otherwise sweep clean.

## Running it

```bash
cd tests/render-diff
export BASELINE_REF=HEAD~1

node load.js                                     # the load render, all five pages
node sequences.js all 400 40                     # real events, 16,000 per page
node mutate-shared.js 200                        # can the sweep fail?
python3 browser-diff.py                          # real Chrome; makes its own baseline checkout

node sweep.js state-pension --exhaustive         # 2,009 states: the whole space
node sweep.js pension-calculator --axes --corners
node sweep.js director-calculator --axes --corners --random 600000
node sweep.js compare --axes --corners

# the entitlement page's whole space is 29,733,102 states. Shard it:
for r in 1960:1964 1965:1969 1970:1974 1975:1979 1980:1984 1985:2008; do
  node sweep.js entitlement --exhaustive --birth $r > /tmp/ent-$r.log 2>&1 &
done
```

Two pages have an input space small enough to walk in full. Three do not, by a
very long way, and get a stratified sweep instead: every slider over its whole
range with the others at their default, every combination of minimum, maximum
and default, and a large deterministic random sample. Say so when reporting it.
"600,000 of about 1e12" is worth more than a green tick that implies more.

## Traps it is built around

- A throw inside an input listener never reaches `dispatchEvent`, so a probe's
  own try/catch sees nothing. Both the node harness and the browser probe add a
  capture-phase error listener, or a broken page looks clean.
- `window` must BE the global object. The calculation modules publish themselves
  with `window.PBRelief = ...` and the page scripts read `PBRelief` by bare name;
  a `window` that is merely a property of the global breaks that, and only that.
- Element ids are numbered per document. Numbered globally, two parses of the
  same page give the chart's synthetic `<path>` elements different identities and
  every one of them reads as a difference.
- The baseline must be served from its own tree. A built page links its scripts
  by URL, so serving the old page from the repository root silently loads the NEW
  modules and the comparison comes out clean for the wrong reason.
  `browser-diff.py` makes that checkout itself rather than leaving it to be
  remembered.
- Settle the tween before snapshotting. Sampling a running animation compares how
  far it has got, not what the page says, and one extra script request is enough
  to move the sampling point. The two hand-written calculators draw DIFFERENT
  charts: the pension one has two series (`b`, `u`), the director one a single
  `v`. A settle routine that names the arrays works on one page and throws on the
  other, leaving its axis label mid-animation, which reads exactly like a
  regression. Copy whatever arrays the target has.
- The nav carries a live countdown to the tax deadline. Two Chrome runs minutes
  apart disagree about it and it is nothing to do with any calculator, so it is
  excluded by id.

## Mutation testing

A sweep that cannot fail is worse than no sweep, because it ends in a green tick
either way. `mutate-shared.js` breaks the shared runtime one change at a time and
requires the sweep to notice. It also carries two mutations that must NOT be
noticed, because they are claims the shared runtime rests on:

- `pct` at one decimal instead of two changes nothing, because no value on either
  page that uses it can reach a second decimal.
- the defensive `valtext &&` in `paintSlider` is unreachable, because no call site
  omits the map.

Both are assertions about the pages rather than about the code, and they are the
kind that quietly stop being true. Leaving them in the list is how anyone finds
out.

To mutate a PAGE script instead of the shared runtime, set
`MUTATE="<page>|<find>|<replace>"` and run any sweep:

```bash
MUTATE="director-calculator|paint(\$('ret'))|paintSlider(\$('ret'))" node sequences.js director-calculator 40 40
```

A call site that loses its wording map does not fail loudly. It silently
announces "€66" where the page used to say "66 years".
