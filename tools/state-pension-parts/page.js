/* state-pension-reality-check.html

   Maths lives in assets/js/state-pension.js, which is the single source of
   truth and is covered by tests/state-pension.test.js. This file only reads
   the two controls and paints the panels, so the page cannot hold a second
   copy of the rules.

   TONE: the Pensions Council's figures do the work. State the difference,
   give it in euro and in words, and stop. No pressure language, no urgency,
   nothing that dramatises a number that is already plain enough. */
const SP = window.PBStatePension;

/* Whether the figure is exact, a floor under the real rate, or simply the
   rate is the module's decision (SP.floorStatus, asserted in
   tests/state-pension.test.js sections 15 to 17). This page no longer words
   it: the sentence under the result was removed on 2026-09-20, Damian's
   call, along with the other caveat cards. CONTEXT.md, "Floor". */

/* Formatting, the slider fill and the wiring are the same on all five
   calculators and live in assets/js/calc-page.js. What is this page's own is
   below: the wording of its two sliders, and render(). */
const { $, euro, euro2, num, wireRanges } = window.PBPage;

/* Screen readers otherwise announce a bare number, so each slider carries a
   formatted aria-valuetext. */
const VALTEXT = {
  contribs: v => num(v) + ' reckonable contributions, ' + (v / 52) + ' years',
  age: v => v + ' years old'
};

/* Whole euro reads better in a sentence than euro and cents, but the cents
   matter in the headline figures, so the two are formatted differently on
   purpose. */
function gapWords(g) {
  if (g.covered) return 'The State Pension covers this in full.';
  return 'You would need <b>' + euro(g.gapAnnual) + ' a year</b> on top, about <b>' +
         euro(g.gapMonthly) + ' a month</b>.';
}

function render() {
  const contribs = +$('contribs').value;
  const age = +$('age').value;
  const res = SP.statePension(contribs);
  const years = contribs / 52;

  $('contribsV').textContent = num(contribs);
  $('ageV').textContent = age;

  const toGo = SP.yearsUntilPensionAge(age);
  $('ageNote').innerHTML = toGo > 0
    ? 'You have <b>' + toGo + (toGo === 1 ? ' year' : ' years') + '</b> until 66. Used for this line only: it does not change the pension figure, and this page does not project investment growth.'
    : 'You are at or past 66. This line does not change the pension figure, and this page does not project investment growth.';

  $('spHas').hidden = !res.eligible;
  $('spNone').hidden = res.eligible;

  let annualCents;

  if (res.eligible) {
    annualCents = res.annualCents;
    $('spWeekly').textContent = euro2(res.weekly);
    $('spAnnual').textContent = euro(res.annual);

    const pctOfMax = Math.round(res.fraction * 100);
    $('spFoot').innerHTML = res.fraction === 1
      ? 'The maximum rate, which takes a full 2,080 reckonable contributions, or forty years.'
      : num(contribs) + ' contributions is ' + years + (years === 1 ? ' year' : ' years') +
        ', <b>' + pctOfMax + '%</b> of a full record, so the rate is ' + pctOfMax +
        '% of the maximum.';

  } else {
    annualCents = 0;
    $('spNoneFoot').innerHTML = num(contribs) + ' contributions is ' + years +
      (years === 1 ? ' year' : ' years') + '. Below 520, ten years, this tool shows no State Pension (Contributory): <b>' +
      num(res.shortBy) + ' more</b> would bring the total to 520. Qualifying itself needs 520 paid contributions.';
  }

  /* Bars are drawn against each standard's own total, so the fill reads as
     "how much of this standard the State Pension covers" rather than as a
     comparison between the three standards. */
  $('lsIntro').textContent = res.eligible
    ? 'The bar shows how much of each one the State Pension covers.'
    : 'With no Contributory entitlement, none of these is covered by it.';

  SP.gaps(annualCents).forEach(g => {
    const row = document.querySelector('.lsrow[data-std="' + g.standard + '"]');
    const covered = Math.max(0, Math.min(1, annualCents / g.targetCents));
    const bar = row.querySelector('.lsbar i');
    bar.style.width = (covered * 100) + '%';
    row.querySelector('.lsbar').setAttribute('aria-hidden', 'true');
    row.querySelector('.lsgap').innerHTML = res.eligible
      ? 'The State Pension covers <b>' + Math.round(covered * 100) + '%</b>. ' + gapWords(g)
      : 'You would need <b>' + euro(g.target) + ' a year</b> from somewhere else.';
    row.classList.toggle('is-covered', g.covered && res.eligible);
  });

  /* One spoken summary rather than eight, so a screen reader gets the point
     of the page and not a list of fragments. */
  const g = SP.gaps(annualCents);
  $('srSummary').textContent = res.eligible
    ? 'State Pension ' + euro2(res.weekly) + ' a week, ' + euro(res.annual) +
      ' a year. Against a modest standard of living that is ' + euro(g[0].gapAnnual) +
      ' a year short, moderate ' + euro(g[1].gapAnnual) + ' short, comfortable ' +
      euro(g[2].gapAnnual) + ' short.'
    : 'With ' + num(contribs) + ' reckonable contributions there is no State Pension (Contributory) entitlement. ' +
      num(res.shortBy) + ' more contributions would bring the total to 520. Qualifying needs 520 paid contributions.';
}

wireRanges(VALTEXT, render);
render();

/* ---- the contributions jar -------------------------------------------

   Forty dots under the contributions slider, one per 52 reckonable
   contributions, filling bottom row up. It is a second reading of the number
   the slider already carries, so it is decorative: aria-hidden in the markup,
   no live region, and nothing here is part of the pension calculation.

   THE WHOLE FEATURE HANGS OFF ONE STATEMENT, the last line of this file.
   render() above is not touched by a single byte, and the jar gets its own
   listener rather than a line inside render(), so the render-diff harness can
   be asked the one question that matters:

       cd tests/render-diff
       MUTATE='state-pension|<that last line>|' BASELINE_REF=main \
         node sweep.js state-pension --exhaustive

   The find string is that call, semicolon included. This comment describes it
   rather than quoting it on purpose: MUTATE replaces the FIRST occurrence in
   the file (tests/render-diff/pages.js), so a copy of it up here would be the
   text that got deleted and the call site would survive the mutation.

   With that one call site deleted this script must be observably identical to
   main across all 2,009 states. The unmutated runs DO differ, because the
   harness counts a write to a node the baseline never touched as a
   difference; the differing keys are the jar's own and are listed in the
   commit message.

   WRITES ARE GUARDED BY AN EXPLICIT READ. In tests/render-diff/minidom.js,
   classList.toggle(name, force) records a write whether or not anything
   changed, so toggle(n, want) on its own would add forty entries to the write
   bag on every drag frame. Reading first keeps the bag honest, and in the
   browser it stops the spill animation restarting while the slider moves. */
function paintJar() {
  var jar = $('pbJar');
  var slider = $('contribs');
  if (!jar || !slider) return;
  var dots = document.querySelectorAll('.pb-jar-dot');
  if (!dots.length) return;

  /* one dot per 52, clamped to the dots that exist, so no typed value can ask
     for a forty-first */
  var max = dots.length * 52;
  var v = +slider.value;
  if (!(v > 0)) v = 0;
  if (v > max) v = max;
  var lit = Math.floor(v / 52);

  var i, want;
  for (i = 0; i < dots.length; i++) {
    want = i < lit;
    if (dots[i].classList.contains('pb-on') !== want) dots[i].classList.toggle('pb-on', want);
  }

  var full = lit >= dots.length;
  if (jar.classList.contains('pb-full') !== full) jar.classList.toggle('pb-full', full);

  /* The spill rests over the rim as soon as the record is full, including at
     load. It only ANIMATES when the slider ARRIVES at a full record during
     the session, which is why the previous value is kept: on the first paint
     there is no previous value and nothing moves. */
  var spill = jar.classList.contains('pb-spill');
  if (!full) spill = false;
  else if (paintJar.prev !== undefined && paintJar.prev < max) spill = true;
  if (jar.classList.contains('pb-spill') !== spill) jar.classList.toggle('pb-spill', spill);
  paintJar.prev = v;

  var cap = $('pbJarCap');
  if (cap) {
    var text = full
      ? dots.length + ' of ' + dots.length + ' years, a full record'
      : lit + ' of ' + dots.length + ' years';
    if (cap.textContent !== text) cap.textContent = text;
  }
}

function initJar() {
  var slider = $('contribs');
  if (!slider || !$('pbJar')) return;
  slider.addEventListener('input', paintJar);
  paintJar();
}

initJar();
