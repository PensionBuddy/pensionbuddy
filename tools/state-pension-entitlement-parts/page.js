/* state-pension-entitlement.html

   Maths lives in assets/js/state-pension-entitlement.js, which is the single
   source of truth and is covered by tests/state-pension-entitlement.test.js.
   This file only reads the five controls and paints the panels, so the page
   cannot hold a second copy of the rules. Every figure, and the band it falls
   in, comes back from PBEntitlement.entitlement(): nothing here works out a
   rate, a yearly average, a band, or where one band ends and the next begins.
   The arithmetic that is left is formatting: cents to euros, a fraction to a
   percentage, a count of contributions to years, and the slider bounds.

   TONE: the two figures do the work. State which calculation is paid, by how
   much it differs, and stop. No pressure language, no urgency. */
const ENT = window.PBEntitlement;
/* Pension age and the transition window belong to the shared module, which is
   loaded ahead of the entitlement one on this page. Read from there so this
   page, the reality check and both modules turn on the same two numbers. */
const SP = window.PBStatePension;

/* Formatting, the slider fill and the wiring are the same on all five
   calculators and live in assets/js/calc-page.js. pct is two decimals there,
   which is exact for this page: the TCA percentage is a multiple of 2.5
   whenever the count is a multiple of 52, and every slider guarantees that. */
const { $, euro, euro2, num, yr, pct, paintSlider, wireRanges } = window.PBPage;
/* the module's money is integer cents. Every figure it hands over carries a
   euro mirror beside it; a band's rate is the one that does not, so this is
   the conversion for that, and it is display, not calculation. */
const euro2c = c => euro2(c / 100);
/* two rates to compare, or one: the same question the Method 2 row asks */
const hasBoth = r => !r.method2.reason;

/* The current year comes from the clock once, so the birth-year bounds and
   the entry-year ceiling move on 1 January without an edit. The module never
   reads the clock; the drawdown year is passed to it. Spec S2. */
const CURRENT_YEAR = new Date().getFullYear();
const PENSION_AGE = SP.PENSION_AGE;
/* The pension starts at 66, so the birth year fixes the drawdown year. The
   page needs pension age for its own slider bounds anyway, so it works this
   out rather than asking the entitlement module for a second name for it. */
const drawdownFor = birthYear => birthYear + PENSION_AGE;
/* Reaching 66 this year is the earliest the page offers, so the earliest
   drawdown year it can produce is the current one. That is why the page has
   three result panels and not four: the module's fourth state,
   'before-transition', needs a drawdown year before 2025 and no setting of
   these controls can ask for one. Proven in section 21 of
   tests/state-pension-entitlement.test.js, which walks this whole range. */
const BIRTH_MIN = CURRENT_YEAR - PENSION_AGE;
const BIRTH_MAX = CURRENT_YEAR - 18;
const BIRTH_DEFAULT = CURRENT_YEAR - 64;           // the default reader is always 64. Revisit before 2032, spec S2
const ENTRY_AFTER_BIRTH_MIN = 16;                  // the earliest a contribution year of entry can be
const ENTRY_AFTER_BIRTH_MAX = PENSION_AGE - 1;     // the last year before 66
const ENTRY_DEFAULT_AFTER_BIRTH = 23;

/* #27, Damian's S11 item 4: the last contribution year that ran April to April */
const APRIL_LAST = 2001;

/* Screen readers otherwise announce a bare number, so each slider carries a
   formatted aria-valuetext. */
const VALTEXT = {
  birth: v => 'born in ' + yr(v) + ', reaching 66 in ' + yr(drawdownFor(v)),
  entry: v => 'first paid PRSI in the ' + yr(v) + ' contribution year',
  paid: v => num(v) + ' paid contributions, ' + (v / 52) + ' years',
  credited: v => num(v) + ' credited contributions, ' + (v / 52) + ' years',
  homecaring: v => num(v) + ' HomeCaring Periods, ' + (v / 52) + ' years'
};

const paint = el => paintSlider(el, VALTEXT);

/* The entry-year bounds move with the birth year. When a change of birth year
   pushes the entry year outside them it is clamped to the nearest bound and
   the subnote says so, so nothing changes silently. Spec S2, coupled bounds.

   THE READER'S OWN YEAR IS KEPT (13 October 2026 review, SP-4). The year
   the reader chose (entryWanted) changes only when the entry slider itself
   is moved; a clamp is drawn from it every time the birth year moves, and
   lasts only while the bounds force it. So sliding the birth year to 2008
   and back brings 1985 back with it, and the note goes when the year is
   the reader's again. Before, the clamped year stayed for good and the
   result turned into "Check the details" that the reader never caused. */
let entryMoved = null;
let entryWanted = null;

function entryBounds(birthYear) {
  return {
    min: birthYear + ENTRY_AFTER_BIRTH_MIN,
    max: Math.min(CURRENT_YEAR, birthYear + ENTRY_AFTER_BIRTH_MAX)
  };
}

function syncEntryBounds() {
  const entry = $('entry');
  const b = entryBounds(+$('birth').value);
  // the year the reader chose, not the slider's value: the slider may hold a
  // clamp from an earlier birth year (and the browser re-clamps a range
  // input's value the moment min or max changes)
  const want = entryWanted === null ? +entry.value : entryWanted;
  entryMoved = null;
  entry.min = b.min;
  entry.max = b.max;
  if (want < b.min) { entry.value = b.min; entryMoved = { year: b.min, which: 'earliest' }; }
  else if (want > b.max) { entry.value = b.max; entryMoved = { year: b.max, which: 'latest' }; }
  else entry.value = want;
  paint(entry);
}

/* The band's range in words. The band comes back from the module carrying
   both its bounds, the top one having no upper bound and saying so with null,
   so this reads them out rather than working out where a band ends. */
const bandLabel = b => b.max === null ? b.min + ' or over' : b.min + ' to ' + b.max;

/* The rate ladder in the explainer is static markup: it is the Department's
   own table and does not depend on the reader. The one live part is the tag
   marking the reader's own band, and this is the order of the rungs, read out
   of the module by walking every average a reader can have, highest first, so
   the tag can never point at the wrong rung if the table changes. A yearly
   average is never more than 52, and below 10 falls in no band at all. */
const LADDER_MINS = (function () {
  const out = [];
  let prev = null;
  for (let a = 52; a >= 10; a--) {
    const b = ENT.band(a);
    if (!prev || b.min !== prev.min) { out.push(b.min); prev = b; }
  }
  return out;
})();

function show(id) {
  ['spHas', 'spNone', 'spUnfit'].forEach(k => { $(k).hidden = k !== id; });
}

function render() {
  /* which rung of the rate ladder is the reader's, or -1: only a band that
     would actually be used is marked, so nobody is shown standing on a rate
     that does not apply to them */
  let hereIdx = -1;
  const birth = +$('birth').value;
  const entryYear = +$('entry').value;
  const paid = +$('paid').value;
  const credited = +$('credited').value;
  const homeCaring = +$('homecaring').value;
  const drawdown = drawdownFor(birth);

  $('birthV').textContent = yr(birth);
  $('entryV').textContent = yr(entryYear);
  $('paidV').textContent = num(paid);
  $('creditedV').textContent = num(credited);
  $('homecaringV').textContent = num(homeCaring);
  // A first payment between 1 January and 5 April of a year up to 2001 fell
  // in the contribution year that began the April before: the module gets
  // that year. It changes only the yearly average, so the box shows only
  // where it can apply: a year up to 2001, and a pension that starts while
  // Method 2 is still worked out (SP-15). Hidden, it counts for nothing.
  const aprilApplies = entryYear <= APRIL_LAST && SP.transition(drawdown) !== 'after';
  $('pbAprilRow').hidden = !aprilApplies;
  const aprilOn = aprilApplies && $('aprilOn').checked;
  const effectiveEntry = aprilOn ? entryYear - 1 : entryYear;

  /* the folded refinements say what they hold while closed */
  $('pbMoreSum').textContent = num(credited) + ' credited, ' + num(homeCaring) + ' caring' +
    (aprilOn ? ', first paid before 6 April' : '');

  // Which side of the transition window the drawdown year falls on. Asked of
  // the shared module by name, so 'after' cannot be confused with 'before':
  // the two want opposite wording and the reader only ever sees one of them.
  $('birthNote').innerHTML = SP.transition(drawdown) === 'after'
    ? 'You reach 66 in <b>' + yr(drawdown) + '</b>. By then only Method 1 applies.'
    : 'You reach 66 in <b>' + yr(drawdown) + '</b>.';

  // The transition glide: mark the column for the reader's drawdown year, or
  // the last one ("2034 on") once the transition is over.
  const glideYear = Math.min(Math.max(drawdown, SP.TRANSITION_FIRST), SP.TRANSITION_LAST + 1);
  for (let y = SP.TRANSITION_FIRST; y <= SP.TRANSITION_LAST + 1; y++) {
    $('pbGlideY' + y).hidden = y !== glideYear;
  }

  // 8 October 2026: the April rule is the tick box's own label; the note
  // speaks only when the year was moved
  $('entryNote').innerHTML = entryMoved
    ? 'Moved to <b>' + yr(entryMoved.year) + '</b>, the ' + entryMoved.which + ' it can be for that birth year.'
    : '';
  $('entryNote').hidden = !entryMoved;

  const res = ENT.entitlement({
    paid: paid, credited: credited, homeCaring: homeCaring,
    entryYear: effectiveEntry, drawdownYear: drawdown
  });

  let sr;

  if (res.state === 'no-entitlement') {
    show('spNone');
    $('spNoneFoot').innerHTML = 'The State Pension (Contributory) needs 520 paid contributions, ten years. ' +
      'Credits and HomeCaring Periods do not count toward that minimum, however many there are. With ' +
      num(res.paid) + ' paid you would need <b>' + num(res.paidShortBy) + ' more</b> to qualify.';
    sr = 'With ' + num(res.paid) + ' paid contributions there is no State Pension (Contributory) entitlement. ' +
      num(res.paidShortBy) + ' more paid contributions would be needed to qualify. Credits and HomeCaring Periods do not count toward the minimum.';

  } else if (res.state === 'inconsistent') {
    show('spUnfit');
    const span = entryYear === drawdown - 1 ? 'in ' + yr(entryYear) : 'from ' + yr(entryYear) + ' to ' + yr(drawdown - 1);
    const fit = num(res.entered) + ' paid and credited contributions is more than the ' + num(res.maxForYears) +
      ' that fit ' + span + '.';
    $('spUnfitFoot').innerHTML = fit + ' Check the year you first paid PRSI.';
    sr = 'These details do not fit together. ' + fit + ' Check the year you first paid PRSI.';

  } else {
    show('spHas');
    const tca = res.tca, ya = res.yearlyAverage, m2 = res.method2, award = res.award;
    const basis = award.basis;

    $('spWeekly').textContent = euro2(award.weekly);
    $('spAnnual').textContent = euro(award.annual);
    /* Marketing Bible A6, specific beats general: the reader's own gap to the
       full rate, a week and a year, in place of "many people get less" */
    const gapC = SP.MAX_WEEKLY_CENTS - Math.round(award.weekly * 100);
    $('spGap').textContent = gapC > 0 ? euro2c(gapC) + ' a week under the full rate: ' + euro(gapC * SP.WEEKS_PER_YEAR / 100) + ' a year.' : 'The full rate.';
    /* which method is paid is the card's to say, once (mClose) */
    $('spFoot').textContent = 'For a pension from ' + yr(res.drawdownYear) + '.';

    /* The two bars, on one scale: the maximum personal rate. Each fill is
       that method's own rate, and the LOWER of the two carries an amber tail
       up to the higher: the extra the higher method adds, which the closing
       sentence names.
       Nothing is decided here: the module has already said which method wins
       and by how much, and this only measures the two figures the rows show. */
    const scale = c => (Math.max(0, Math.min(c, SP.MAX_WEEKLY_CENTS)) / SP.MAX_WEEKLY_CENTS * 100).toFixed(4) + '%';
    $('m1Fill').style.width = scale(tca.weeklyCents);
    $('mScale').textContent = 'Both bars are on the same scale. The maximum personal rate is ' +
      euro2c(SP.MAX_WEEKLY_CENTS) + ' a week.';
    if (hasBoth(res) && ya.band) hereIdx = LADDER_MINS.indexOf(ya.band.min);

    const lowCents = hasBoth(res) ? Math.min(tca.weeklyCents, res.method2.weeklyCents) : tca.weeklyCents;
    const highCents = hasBoth(res) ? Math.max(tca.weeklyCents, res.method2.weeklyCents) : tca.weeklyCents;
    const tailOn = highCents > lowCents ? (tca.weeklyCents < res.method2.weeklyCents ? 'm1' : 'm2') : null;
    /* One label a row: the lower method is labelled with the extra the higher
       one adds, and whichever method the Department actually pays is labelled as
       paid. At a tie both are paid, which is what the closing sentence says. */
    const paidOn = { m1: res.award.basis !== 'method2', m2: hasBoth(res) && res.award.basis !== 'method1' };
    /* the row the Department pays is marked; at a tie, both */
    $('m1Row').classList.toggle('is-paid', paidOn.m1);
    $('m2Row').classList.toggle('is-paid', paidOn.m2);
    ['m1', 'm2'].forEach(function (m) {
      const gap = $(m + 'Gap'), lab = $(m + 'Lab');
      gap.hidden = tailOn !== m;
      if (tailOn === m) {
        gap.style.left = scale(lowCents);
        gap.style.width = ((highCents - lowCents) / SP.MAX_WEEKLY_CENTS * 100).toFixed(4) + '%';
        lab.hidden = false;
        lab.style.left = scale(lowCents + (highCents - lowCents) / 2);
        lab.textContent = '+' + euro2c(highCents - lowCents);
      } else if (paidOn[m]) {
        lab.hidden = false;
        lab.style.left = scale(m === 'm1' ? tca.weeklyCents : res.method2.weeklyCents);
        lab.textContent = 'Paid';
      } else {
        lab.hidden = true;
      }
      /* centred on its point, but never past either end of the bar */
      const at = parseFloat(lab.style.left);
      lab.style.transform = at > 88 ? 'translateX(-100%)' : at < 12 ? 'none' : '';
    });

    // Method 1 row
    $('m1Rate').textContent = euro2(tca.weekly) + ' a week';
    $('m1Detail').innerHTML = tca.capped
      ? '<b>' + num(tca.reckonable) + '</b> reckonable contributions, more than a full record of 2,080, so the maximum rate.'
      : '<b>' + num(tca.reckonable) + '</b> reckonable contributions, <b>' + pct(tca.fraction) + '</b> of a full record of 2,080.';
    $('m1Cap').hidden = !tca.capBit;
    // The record as the TCA counts it: the module's counts over the larger of
    // a full record and everything entered.
    const over = res.credited + res.homeCaring - tca.extrasCounted;
    const recTop = Math.max(SP.FULL_CONTRIBUTIONS, res.paid + res.credited + res.homeCaring);
    const recW = n => (n / recTop * 100).toFixed(4) + '%';
    $('pbRecPaid').style.width = recW(res.paid);
    $('pbRecExtra').style.width = recW(tca.extrasCounted);
    $('pbRecOver').style.width = recW(over);
    $('pbRecFull').style.left = recW(SP.FULL_CONTRIBUTIONS);
    $('pbRecPaidN').textContent = num(res.paid);
    $('pbRecExtraN').textContent = num(tca.extrasCounted);
    $('pbRecOverN').textContent = num(over);
    $('pbRecOverK').hidden = over <= 0;
    if (tca.capBit) {
      $('m1Cap').textContent = num(tca.extrasCounted) + ' of your ' + num(res.credited + res.homeCaring) +
        ' credits and HomeCaring Periods count; the rest are over the caps.';
    }

    // Method 2 row, or the sentence saying why there is none. One field
    // answers that: the figure, or a reason.
    const hasM2 = !m2.reason;
    $('m2Row').hidden = !hasM2;
    $('mClose').hidden = !hasM2;
    $('mWhy').hidden = hasM2;

    /* with one calculation there is one bar and no Method 2 to show the
       working of: its sentence and the "both bars" scale go, and the card
       is named for what it now holds (SP-5) */
    $('m2Detail').hidden = !hasM2;
    $('mScale').hidden = !hasM2;
    $('bothH').textContent = hasM2 ? 'Two ways to work it out' : 'How it\u2019s worked out';

    if (hasM2) {
      $('m2Fill').style.width = scale(m2.weeklyCents);
      $('bothSub').textContent = 'Until the end of ' + yr(SP.TRANSITION_LAST) + ' the higher of the two is paid.';
      const band = bandLabel(ya.band);
      $('m2Rate').textContent = euro2(m2.weekly) + ' a week';
      $('m2Detail').innerHTML = 'A yearly average of <b>' + ya.average + '</b> over <b>' + ya.years + '</b> years, ' +
        yr(res.entryYear) + ' to ' + yr(res.drawdownYear - 1) + ', falls in the ' + band + ' band at ' +
        euro2c(ya.band.weeklyCents) + ' a week. For a pension starting in ' + yr(res.drawdownYear) + ' the mix is <b>' +
        m2.yaShare + '%</b> of that rate and <b>' + m2.tcaShare + '%</b> of the Method 1 rate.';

      /* the card names the methods one way: Method 1 and Method 2 (their
         full names are in "How the two methods work") */
      if (basis === 'method2') {
        $('mClose').innerHTML = 'Method 2 is paid: <b>' + euro2(award.gain) + ' a week</b> more than Method 1.';
      } else if (basis === 'tie') {
        $('mClose').innerHTML = 'Both give the same figure. At a full record Method 1 already gives the maximum.';
      } else if (res.homeCaring > 0) {
        $('mClose').innerHTML = 'Method 1 is paid. Your HomeCaring Periods count under it and not in the yearly average.';
      } else {
        $('mClose').innerHTML = 'Method 1 is paid. A yearly average of ' + ya.average + ' over ' + ya.years +
          ' years falls in the ' + band + ' band, and Method 2&rsquo;s blend comes to less.';
      }

      sr = 'State Pension (Contributory) ' + euro2(award.weekly) + ' a week, ' + euro(award.annual) + ' a year, ' +
        (basis === 'tie'
          ? 'and both methods give this figure.'
          : basis === 'method2'
            ? 'under Method 2. Method 1 alone gives ' + euro2(tca.weekly) + '.'
            : 'under Method 1. Method 2 gives ' + euro2(m2.weekly) + '.');
    } else {
      $('bothSub').textContent = 'Only one calculation applies to these details.';
      $('mWhy').textContent = m2.reason === 'after-transition'
        ? 'You reach 66 in ' + yr(res.drawdownYear) + ', after the transition ends in ' + yr(SP.TRANSITION_LAST) + '. Only Method 1 applies, so on the contributions entered this is your rate.'
        : 'Your yearly average is ' + ya.average + ' over ' + ya.years + ' years. Below 10 the yearly average gives nothing, so Method 1 is paid. The Homemaker\'s Scheme, which this page leaves out, can shorten the years and bring the average back above 10.';
      sr = 'State Pension (Contributory) ' + euro2(award.weekly) + ' a week, ' + euro(award.annual) +
        ' a year. Only Method 1 applies.';
    }
  }

  LADDER_MINS.forEach(function (min, i) {
    const you = $('yal' + i + 'You');
    you.hidden = i !== hereIdx;
    if (i === hereIdx) you.textContent = 'You: ' + res.yearlyAverage.average;
  });

  /* One spoken summary rather than a dozen fragments, so a screen reader gets
     the point of the page. */
  $('srSummary').textContent = sr;
}

/* Bounds and defaults first, from the clock, before any slider is painted or
   the shared click-to-edit script records the ranges it clamps to. */
(function init() {
  const birth = $('birth');
  birth.min = BIRTH_MIN;
  birth.max = BIRTH_MAX;
  birth.value = BIRTH_DEFAULT;
  const entry = $('entry');
  const b = entryBounds(BIRTH_DEFAULT);
  entry.min = b.min;
  entry.max = b.max;
  entry.value = BIRTH_DEFAULT + ENTRY_DEFAULT_AFTER_BIRTH;
  entryWanted = +entry.value;
})();

wireRanges(VALTEXT, el => {
  if (el.id === 'birth') syncEntryBounds();
  if (el.id === 'entry') { entryMoved = null; entryWanted = +el.value; }
  render();
});
$('aprilOn').addEventListener('change', render);

render();
