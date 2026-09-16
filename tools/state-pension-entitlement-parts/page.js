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
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ENT = window.PBEntitlement;
/* Pension age and the transition window belong to the shared module, which is
   loaded ahead of the entitlement one on this page. Read from there so this
   page, the reality check and both modules turn on the same two numbers. */
const SP = window.PBStatePension;

const $ = id => document.getElementById(id);
const euro = v => '€' + Math.round(v).toLocaleString('en-IE');
const euro2 = v => '€' + v.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* the module's money is integer cents. Every figure it hands over carries a
   euro mirror beside it; a band's rate is the one that does not, so this is
   the conversion for that, and it is display, not calculation. */
const euro2c = c => euro2(c / 100);
const num = v => v.toLocaleString('en-IE');
/* a year is a label, not a quantity, so it never takes a thousands separator */
const yr = v => String(v);
/* the TCA percentage is a multiple of 2.5 whenever the count is a multiple of
   52, which every slider guarantees, so two decimals is exact */
const pct = v => num(Math.round(v * 10000) / 100) + '%';

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

const APRIL_RULE = 'Before 2002 the contribution year ran from April to April. If your first payment was between January and 5 April of a year up to 2001, choose the year before.';

/* Screen readers otherwise announce a bare number, so each slider carries a
   formatted aria-valuetext, matching the other calculators. */
const VALTEXT = {
  birth: v => 'born in ' + yr(v) + ', reaching 66 in ' + yr(drawdownFor(v)),
  entry: v => 'first paid PRSI in the ' + yr(v) + ' contribution year',
  paid: v => num(v) + ' paid contributions, ' + (v / 52) + ' years',
  credited: v => num(v) + ' credited contributions, ' + (v / 52) + ' years',
  homecaring: v => num(v) + ' HomeCaring Periods, ' + (v / 52) + ' years'
};

function paintSlider(el) {
  const min = +el.min || 0, max = +el.max || 100, v = +el.value;
  el.style.setProperty('--fill', ((v - min) / (max - min)) * 100 + '%');
  if (VALTEXT[el.id]) el.setAttribute('aria-valuetext', VALTEXT[el.id](v));
}

/* The entry-year bounds move with the birth year. When a change of birth year
   pushes the entry year outside them it is clamped to the nearest bound and
   the subnote says so until the entry slider is next touched, so nothing
   changes silently. Spec S2, coupled bounds. */
let entryMoved = null;

function entryBounds(birthYear) {
  return {
    min: birthYear + ENTRY_AFTER_BIRTH_MIN,
    max: Math.min(CURRENT_YEAR, birthYear + ENTRY_AFTER_BIRTH_MAX)
  };
}

function syncEntryBounds() {
  const entry = $('entry');
  const b = entryBounds(+$('birth').value);
  // read the value before the bounds move: the browser re-clamps a range
  // input's value the moment min or max changes, and the note needs to know
  // whether that happened
  const was = +entry.value;
  // the note describes this change only; an earlier clamp is old news once
  // the birth year has moved again
  entryMoved = null;
  entry.min = b.min;
  entry.max = b.max;
  if (was < b.min) { entry.value = b.min; entryMoved = { year: b.min, which: 'earliest' }; }
  else if (was > b.max) { entry.value = b.max; entryMoved = { year: b.max, which: 'latest' }; }
  paintSlider(entry);
}

/* The band's range in words. The band comes back from the module carrying
   both its bounds, the top one having no upper bound and saying so with null,
   so this reads them out rather than working out where a band ends. */
const bandLabel = b => b.max === null ? b.min + ' or over' : b.min + ' to ' + b.max;

function show(id) {
  ['spHas', 'spNone', 'spUnfit'].forEach(k => { $(k).hidden = k !== id; });
}

function render() {
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

  // Which side of the transition window the drawdown year falls on. Asked of
  // the shared module by name, so 'after' cannot be confused with 'before':
  // the two want opposite wording and the reader only ever sees one of them.
  $('birthNote').innerHTML = SP.transition(drawdown) === 'after'
    ? 'You reach 66 in <b>' + yr(drawdown) + '</b>, after the transition ends in ' + yr(SP.TRANSITION_LAST) + ', so only the Total Contributions Approach applies. This page assumes you take your pension at 66.'
    : 'You reach 66 in <b>' + yr(drawdown) + '</b>, the year this page assumes your pension starts. That year sets the mix of the two calculations.';

  $('entryNote').innerHTML = (entryMoved
    ? 'Moved to <b>' + yr(entryMoved.year) + '</b>, the ' + entryMoved.which + ' it can be for that birth year. '
    : '') + APRIL_RULE;

  const res = ENT.entitlement({
    paid: paid, credited: credited, homeCaring: homeCaring,
    entryYear: entryYear, drawdownYear: drawdown
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
    const fit = num(res.entered) + ' paid and credited contributions is more than the ' + num(res.maxForYears) +
      ' that fit between ' + yr(entryYear) + ' and the end of ' + yr(drawdown - 1) + ' at 52 a year.';
    $('spUnfitFoot').innerHTML = 'These details don\'t fit together. ' + fit +
      ' Check the contribution year you first paid PRSI.';
    sr = 'These details do not fit together. ' + fit + ' Check the contribution year you first paid PRSI.';

  } else {
    show('spHas');
    const tca = res.tca, ya = res.yearlyAverage, m2 = res.method2, award = res.award;
    const basis = award.basis;
    const starting = 'for a pension starting in ' + yr(res.drawdownYear);

    $('spWeekly').textContent = euro2(award.weekly);
    $('spAnnual').textContent = euro(award.annual);
    $('spFoot').textContent = basis === 'tie'
      ? 'Both calculations give this figure, ' + starting + '.'
      : 'Worked out under the ' + (basis === 'method2' ? 'Yearly Average blend' : 'Total Contributions Approach') +
        ', ' + starting + '.';

    // Method 1 row
    $('m1Rate').textContent = euro2(tca.weekly) + ' a week';
    $('m1Detail').innerHTML = tca.capped
      ? '<b>' + num(tca.reckonable) + '</b> reckonable contributions, more than a full record of 2,080, so the maximum rate.'
      : '<b>' + num(tca.reckonable) + '</b> reckonable contributions, <b>' + pct(tca.fraction) + '</b> of a full record of 2,080.';
    $('m1Cap').hidden = !tca.capBit;
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
    $('mFloor').hidden = !hasM2;

    if (hasM2) {
      $('bothSub').textContent = 'Until the end of ' + yr(SP.TRANSITION_LAST) + ' the Department works the rate out both ways and pays the higher.';
      const band = bandLabel(ya.band);
      $('m2Rate').textContent = euro2(m2.weekly) + ' a week';
      $('m2Detail').innerHTML = 'A yearly average of <b>' + ya.average + '</b> over <b>' + ya.years + '</b> years, ' +
        yr(res.entryYear) + ' to ' + yr(res.drawdownYear - 1) + ', falls in the ' + band + ' band at ' +
        euro2c(ya.band.weeklyCents) + ' a week. For a pension starting in ' + yr(res.drawdownYear) + ' the mix is <b>' +
        m2.yaShare + '%</b> of that rate and <b>' + m2.tcaShare + '%</b> of the Total Contributions Approach rate.';

      if (basis === 'method2') {
        $('mClose').innerHTML = 'The Department pays the higher. That is <b>' + euro2(award.weekly) + '</b>, <b>' +
          euro2(award.gain) + ' a week</b> more than the Total Contributions Approach alone.';
      } else if (basis === 'tie') {
        $('mClose').innerHTML = 'Both calculations give the same figure. At a full record the Total Contributions Approach already gives the maximum.';
      } else if (res.homeCaring > 0) {
        $('mClose').innerHTML = 'The Department pays the higher. That is the Total Contributions Approach figure. Your HomeCaring Periods count under it and not under Yearly Average.';
      } else {
        $('mClose').innerHTML = 'The Department pays the higher. That is the Total Contributions Approach figure. A yearly average of ' +
          ya.average + ' over ' + ya.years + ' years falls in the ' + band +
          ' band, and the blend of that band\'s rate with the TCA rate comes to less.';
      }

      sr = 'State Pension (Contributory) ' + euro2(award.weekly) + ' a week, ' + euro(award.annual) + ' a year, ' +
        (basis === 'tie'
          ? 'and both calculations give this figure.'
          : basis === 'method2'
            ? 'under the Yearly Average blend. The Total Contributions Approach alone gives ' + euro2(tca.weekly) + '.'
            : 'under the Total Contributions Approach. The Yearly Average blend gives ' + euro2(m2.weekly) + '.');
    } else {
      $('bothSub').textContent = 'Only one calculation applies to these details.';
      $('mWhy').textContent = m2.reason === 'after-transition'
        ? 'You reach 66 in ' + yr(res.drawdownYear) + ', after the transition ends in ' + yr(SP.TRANSITION_LAST) + '. Only the Total Contributions Approach applies, so on the contributions entered this is your rate.'
        : 'Your yearly average is ' + ya.average + ' over ' + ya.years + ' years. Below 10 the Yearly Average method gives nothing, so the Total Contributions Approach figure is paid. The Homemaker\'s Scheme, which this page leaves out, can shorten the years and bring the average back above 10.';
      sr = 'State Pension (Contributory) ' + euro2(award.weekly) + ' a week, ' + euro(award.annual) +
        ' a year. Only the Total Contributions Approach applies.';
    }
  }

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
})();

document.querySelectorAll('input[type=range]').forEach(el => {
  paintSlider(el);
  el.addEventListener('input', () => {
    if (el.id === 'birth') syncEntryBounds();
    if (el.id === 'entry') entryMoved = null;
    paintSlider(el);
    render();
  });
});

render();
