/* state-pension-reality-check.html

   Maths lives in assets/js/state-pension.js, which is the single source of
   truth and is covered by tests/state-pension.test.js. This file only reads
   the two controls and paints the panels, so the page cannot hold a second
   copy of the rules.

   TONE: the Pensions Council's figures do the work. State the difference,
   give it in euro and in words, and stop. No pressure language, no urgency,
   nothing that dramatises a number that is already plain enough. */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SP = window.PBStatePension;

const $ = id => document.getElementById(id);
const euro = v => '€' + Math.round(v).toLocaleString('en-IE');
const euro2 = v => '€' + v.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = v => v.toLocaleString('en-IE');

/* Screen readers otherwise announce a bare number, so each slider carries a
   formatted aria-valuetext, matching the other three calculators. */
const VALTEXT = {
  contribs: v => num(v) + ' reckonable contributions, ' + (v / 52) + ' years',
  age: v => v + ' years old'
};

function paintSlider(el) {
  const min = +el.min || 0, max = +el.max || 100, v = +el.value;
  el.style.setProperty('--fill', ((v - min) / (max - min)) * 100 + '%');
  if (VALTEXT[el.id]) el.setAttribute('aria-valuetext', VALTEXT[el.id](v));
}

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

    /* The floor caveat only bites below a full record. At 2,080 the Total
       Contributions Approach gives the full rate outright and nothing further
       is calculated, so the figure is exact and saying otherwise would be
       hedging for its own sake. */
    $('spFloor').textContent = res.fraction === 1
      ? 'At a full record this figure is exact. The Total Contributions Approach gives the maximum rate outright, so no second calculation applies.'
      : 'This shows the Total Contributions Approach calculation only. If part of your working life falls under the older Yearly Average method, the Department pays whichever calculation gives the higher amount, so your real entitlement could be higher than the figure here.';
  } else {
    annualCents = 0;
    $('spNoneFoot').innerHTML = num(contribs) + ' contributions is ' + years +
      (years === 1 ? ' year' : ' years') + '. Below 520, ten years, there is no State Pension (Contributory) at all. You would need <b>' +
      num(res.shortBy) + ' more</b> to qualify.';
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
      num(res.shortBy) + ' more contributions would be needed to qualify.';
}

document.querySelectorAll('input[type=range]').forEach(el => {
  paintSlider(el);
  el.addEventListener('input', () => { paintSlider(el); render(); });
});

render();
