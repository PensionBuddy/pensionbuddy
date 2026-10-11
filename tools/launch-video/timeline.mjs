/* The launch video's one timeline: the beat grid, the shots, every cue,
   and the copy. film.html draws from it and audio.mjs plays from it, so a
   picture and its sound cannot drift apart.

   96 BPM: a beat is 0.625 s, a bar 2.5 s. Times are in beats from the first
   frame (beat 0 = bar 1, beat 1). Twelve bars carry the story; the end card
   is a short tail after them. Every shot change and every arrival is on the
   grid (a beat, or an eighth or sixteenth inside one for the quick bits:
   letters, coins, the jargon's letters locking).

   Reading time: every line stays fully readable for at least
   max(2.0 s, 1.0 s + 0.3 s a word). The shot lengths below are set by that,
   not by the music: contact.mjs --check measures it frame by frame. */

export const BPM = 96;
export const BEAT = 60 / BPM;          // 0.625 s
export const BAR = 4 * BEAT;           // 2.5 s
export const FPS = 60;
export const DURATION = 36.25;         // 58 beats: 12 bars + the end card's tail
export const FRAMES = Math.round(DURATION * FPS);
export const b = n => n * BEAT;        // beats -> seconds

/* the shots: [from, to) in beats; ground is the background */
export const SHOTS = [
  { id: 'intro',  from: 0,  to: 8,    ground: 'dark'  },
  { id: 'gap',    from: 8,  to: 20,   ground: 'light' },
  { id: 'calc',   from: 20, to: 29,   ground: 'dark'  },
  { id: 'tax',    from: 29, to: 37,   ground: 'light' },
  { id: 'jargon', from: 37, to: 46,   ground: 'dark'  },
  { id: 'people', from: 46, to: 51,   ground: 'light' },
  { id: 'end',    from: 51, to: DURATION / BEAT, ground: 'light' },
];
export const shotAt = t => SHOTS.find(s => t >= b(s.from) && t < b(s.to)) || SHOTS[SHOTS.length - 1];

/* the copy, verbatim; figures are the storyboard's (see README for sources) */
export const COPY = {
  wordmark: 'Pensionbuddy',
  tagline: 'Pensions, made friendly.',
  gapH1: 'The State Pension pays €15,564 a year.',
  gapH2: 'Even a modest retirement costs more.',
  gapSource: 'Pensions Council, Irish Retirement Living Standards, 2024 prices. State Pension (Contributory), maximum personal rate, 2026.',
  colState: 'State Pension',
  colCost: 'What it costs',
  calcH: 'See what you’re on track for.',
  calcSub: 'Two minutes, no sign-up.',
  calcSmall: 'Illustration only. The value of a pension can fall as well as rise.',
  taxH1: 'Put in €100 a month.',
  taxH2: 'It could cost you €60.',
  taxYou: 'You pay €60',
  taxRev: 'Revenue adds €40',
  taxSmall: 'At the higher rate of tax, within Revenue’s age-related limits.',
  jargonKicker: 'Jargon buster',
  /* glossary.html's own definitions */
  terms: [
    { term: 'PRSA', def: 'A flexible personal pension you own, which moves with you between jobs.' },
    { term: 'AVC', def: 'Extra payments into a workplace pension, usually with tax relief.' },
  ],
  damianName: 'Damian Condon',
  damianRole: 'Qualified Financial Adviser (QFA)',
  damianYears: '30 years’ experience',
  buddyName: 'Buddy',
  buddyRole: 'Chief Napping Officer',
  url: 'pensionbuddy.ie',
  cta: 'Book a free 20-minute call',
  reg: 'Pensionbuddy is a trading name of Damian Condon T/A Gresham Wealth Management, which is regulated by the Central Bank of Ireland.',
};

/* the figures */
export const STATE_PENSION = 15564;    // EUR 299.30 a week x 52, 2026, maximum personal rate
export const LEVELS = [                // Pensions Council, IRLS, one person, 2024 prices
  { name: 'Modest', cost: 19200 },
  { name: 'Moderate', cost: 27600 },
  { name: 'Comfortable', cost: 33600 },
];
export const CALC = { pot: '€460,066', income: '€1,534' };   // checked against the page by shots.mjs

/* the cues: name -> beat. sfx names what audio.mjs plays there. */
const C = [];
const cue = (id, beat, sfx, extra) => C.push({ id, beat, t: b(beat), sfx, ...extra });

// 1. intro: the mark, its toes one a beat, the wordmark, the line
cue('mark', 0, 'bloom');
cue('toe1', 0, 'pop', { note: 0 });
cue('toe2', 1, 'pop', { note: 1 });
cue('toe3', 2, 'pop', { note: 2 });
cue('toe4', 3, 'pop', { note: 3 });
cue('glide', 3, 'swish');
for (let i = 0; i < 12; i++) cue('letter' + i, 3 + i / 8, 'tick', { note: i });
cue('underline', 4, 'sweep');
cue('tagline', 4, 'chime');
cue('riser1', 8, 'riser', { len: 6 });   // ends on the drop
// 2. the gap
cue('gap.in', 8, 'drop');
cue('gap.teal', 9, 'grow');
cue('gap.h2', 14, 'whoosh-s');
cue('gap.cost0', 14, 'step', { note: 0 });
cue('gap.cost1', 15, 'step', { note: 1 });
cue('gap.cost2', 16, 'step', { note: 2 });
// 3. the calculator
cue('calc.in', 20, 'cut');
cue('calc.sub', 21, 'tick2');
cue('calc.lift0', 22, 'lift');
cue('calc.lift1', 24, 'lift');
cue('calc.scroll', 25.5, 'scroll');
cue('calc.lift2', 26, 'lift');
// 4. tax relief: three dark coins (you pay EUR 60), two amber (Revenue adds
//    EUR 40), one a beat. (On eighths, three dark coins crossing the same
//    part of the screen inside a second sat exactly at the flash limit.)
cue('tax.in', 29, 'cut');
cue('tax.h2', 30, 'tick2');
cue('tax.c0', 30, 'coin', { kind: 'ink' });
cue('tax.c1', 31, 'coin', { kind: 'ink' });
cue('tax.c2', 32, 'coin', { kind: 'ink' });
cue('tax.you', 32);
cue('tax.c3', 33, 'coin', { kind: 'amber' });
cue('tax.c4', 34, 'coin', { kind: 'amber' });
cue('tax.rev', 33);
// 5. jargon: letters lock on sixteenths, the meaning lands on the next beat
cue('jargon.in', 37, 'cut');
cue('term0', 37, 'scramble', { len: 1 });
cue('def0', 38, 'tick2');
cue('term1', 38, 'scramble', { len: 0.75 });
cue('def1', 39, 'tick2');
cue('riser2', 46, 'riser', { len: 3 });
// 6. people, then the end card
cue('people.in', 46, 'photo');
cue('people.buddy', 47, 'photo');
cue('reg', 46);
cue('end.in', 51, 'cut');
cue('end.mark', 51, 'pop', { note: 0 });
cue('end.url', 52, 'tick2');
cue('end.cta', 53, 'chime');
cue('end.wink', 56, 'wink');   // the last downbeat, on the final chord
export const CUES = C;
export const cueT = id => { const c = C.find(x => x.id === id); if (!c) throw new Error('no cue ' + id); return c.t; };

/* the whooshes into each cut end exactly on it */
export const CUTS = SHOTS.slice(1).map(s => b(s.from));

/* the harmony, a chord a bar: G, A into the drop, then D Bm G A, ending on D */
export const CHORDS = ['G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D'];

/* words in a line, for the reading-time rule */
export const words = s => s.trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
export const needs = s => Math.max(2.0, 1.0 + 0.3 * words(s));
