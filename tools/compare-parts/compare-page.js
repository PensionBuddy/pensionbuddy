/* broker-vs-autoenrolment.html
   Maths lives in assets/js/autoenrolment.js and assets/js/pension-tax-relief.js,
   which are the single source of truth and are covered by
   tests/compare-calc.test.js. This file only reads the controls and paints
   the result panels, so the page cannot hold a second copy of the rules.

   Two modes, two different questions, one shared input panel:
     Mode 1, Equivalent layer: for the same money out of pocket, auto-enrolment
                               against a personal pension instead.
     Mode 2, Combined:         auto-enrolment at its set rate PLUS a personal
                               top-up for anything extra, because My Future
                               Fund does not currently take contributions
                               above that rate (see the source warning in
                               autoenrolment.js).
   Both are computed on every change so switching is instant and they can
   never disagree about the shared auto-enrolment layer.

   HONESTY RULE: this page reports the numbers for the inputs entered and
   nothing more. When auto-enrolment produces the larger total in Mode 1 it
   says so in exactly the same words and prominence as the opposite result.
   Mode 2 is stated matter of fact, as a consequence of what the scheme
   currently allows, never as a pitch. */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode = 1;

/* Relief is worked out at the rate each euro actually attracts, split at the
   standard rate cut-off point, so the page asks how the visitor is assessed
   for tax rather than which rate to apply. Figures live in PBRelief. */
const STATUS = [
  { srcop: PBRelief.SRCOP.single,            who: 'single' },
  { srcop: PBRelief.SRCOP.marriedOneIncome,  who: 'married or in a civil partnership with one income' },
  { srcop: PBRelief.SRCOP.marriedTwoIncomes, who: 'married or in a civil partnership with two incomes' }
];
let statusIx = 0;
const relief = () => ({ srcop: STATUS[statusIx].srcop });

const $ = id => document.getElementById(id);
const euro = v => '€' + Math.round(v).toLocaleString('en-IE');
const pct = v => (Math.round(v * 1000) / 10).toLocaleString('en-IE') + '%';

/* the user has moved the Mode 1 contribution slider themselves, so stop re-matching it */
let grossTouched = false;

/* Screen readers otherwise announce a bare number, so each slider carries a
   formatted aria-valuetext, matching the other two calculators (issue D4). */
const VALTEXT = {
  age: v => v + ' years',
  salary: v => euro(v),
  phase: v => 'Year ' + v + (v >= 10 ? ' or later' : ''),
  gross: v => euro(v) + ' a year',
  match: v => v + '% of salary',
  extra: v => euro(v) + ' a month',
  tmatch: v => v + '% of your top-up'
};

function paintSlider(el) {
  const min = +el.min || 0, max = +el.max || 100, v = +el.value;
  el.style.setProperty('--fill', ((v - min) / (max - min)) * 100 + '%');
  if (VALTEXT[el.id]) el.setAttribute('aria-valuetext', VALTEXT[el.id](v));
}

function setStatus(i) {
  statusIx = i;
  for (let k = 0; k < STATUS.length; k++) {
    const b = $('st' + k), on = k === i;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  $('segInd').style.transform = 'translateX(' + (i * 100) + '%)';
  const st = STATUS[i];
  $('statusNote').innerHTML = 'Income tax is 40% on salary above <b>' + euro(st.srcop) + '</b> when you are ' + st.who
    + (i === 2 ? ' (the maximum band, reached only where the lower earner has at least ' + euro(35000) + ' of their own income)' : '')
    + ', so relief on a personal pension is 40% on that part of a contribution and 20% on the rest. Auto-enrolment contributions come out of your take-home pay and get no income tax relief.';
  calc();
}

/* "EUR 2,400 at 40%, EUR 400 at 20%", or just the one rate when only one applies */
function reliefAt(split) {
  if (!split) return '';
  const parts = [];
  if (split.at40 > 0) parts.push(euro(split.at40) + ' at 40%');
  if (split.at20 > 0) parts.push(euro(split.at20) + ' at 20%');
  return parts.length ? parts.join(', ') : '';
}

/* ---- mode tabs ---- */
const MODE_NOTE = {
  1: 'For the same money out of your pocket: what goes into your pension under auto-enrolment, against a personal pension instead.',
  2: 'Saving more than the minimum: auto-enrolment as it stands, plus a personal top-up for the extra, because My Future Fund does not currently take contributions above its set rate.'
};

function setMode(m, focusTab) {
  mode = m;
  [1, 2].forEach(n => {
    const tab = $('m' + n), on = n === m;
    tab.classList.toggle('on', on);
    tab.setAttribute('aria-selected', on ? 'true' : 'false');
    tab.tabIndex = on ? 0 : -1;
    $('mode' + n + 'Results').hidden = !on;
  });
  $('modeInd').style.transform = m === 1 ? 'translateX(0)' : 'translateX(100%)';
  $('modeNote').textContent = MODE_NOTE[m];
  /* mode-specific controls live in the shared panel and simply show or hide */
  document.querySelectorAll('[data-mode]').forEach(el => { el.hidden = el.getAttribute('data-mode') !== String(m); });
  if (focusTab) $('m' + m).focus();
  try { history.replaceState(null, '', m === 2 ? '#combined' : location.pathname + location.search); } catch (e) {}
  calc();
}

/* arrow keys move between the two tabs, as a tablist should */
document.querySelector('.modeseg').addEventListener('keydown', e => {
  if (!/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) return;
  e.preventDefault();
  setMode(e.key === 'Home' ? 1 : e.key === 'End' ? 2 : (mode === 1 ? 2 : 1), true);
});

let srTimer = null;
function announce(text) {
  clearTimeout(srTimer);
  srTimer = setTimeout(() => { $('srSummary').textContent = text; }, 700);
}

function calc() {
  const age = +$('age').value;
  const salary = +$('salary').value;
  const year = +$('phase').value;
  const match = +$('match').value;
  const extraMonthly = +$('extra').value;
  const tmatch = +$('tmatch').value;

  const ae = PBCompare.autoEnrolment(salary, year);

  /* ---------- Mode 1: equivalent layer ---------- */
  /* Until the user touches it, the personal contribution tracks the net cost of
     auto-enrolment so the comparison opens genuinely like for like. */
  if (!grossTouched) {
    const matched = Math.round(PBCompare.matchedGross(salary, year, age, relief()) / 250) * 250;
    $('gross').value = Math.min(matched, +$('gross').max);
  }
  const gross = +$('gross').value;
  const pp = PBCompare.personalPension(gross, age, salary, relief(), match);

  /* ---------- Mode 2: combined ---------- */
  const c = PBCompare.combined({ salary, year, age, srcop: relief().srcop, extraMonthly, topUpMatchPct: tmatch });

  /* control labels */
  $('ageV').textContent = age;
  $('salaryV').textContent = euro(salary);
  $('phaseV').textContent = 'Year ' + year + (year >= 10 ? '+' : '');
  $('grossV').textContent = euro(gross);
  $('matchV').textContent = match + '%';
  $('extraV').textContent = euro(extraMonthly);
  $('tmatchV').textContent = tmatch + '%';
  $('phaseNote').textContent = 'Phase ' + ae.phase + ' of the phase-in (' + ae.years + '): you '
    + pct(ae.rates.employee) + ', employer ' + pct(ae.rates.employer)
    + ', State ' + pct(ae.rates.state) + '. Rates rise in three-year steps.';

  /* ---------- shared: the auto-enrolment layer ---------- */
  $('aeEmployee').textContent = euro(ae.employee);
  $('aeEmployer').textContent = euro(ae.employer);
  $('aeState').textContent = euro(ae.state);
  $('aeTotal2').textContent = euro(ae.totalIn);
  const capNote = ae.salaryCapApplies ? '(on the first ' + euro(PBCompare.AE_SALARY_CAP) + ')' : '';
  $('aeEmployerCap').textContent = capNote;
  $('aeStateCap').textContent = capNote;
  $('aeRatesNote').textContent = 'You pay ' + pct(ae.rates.employee) + ', your employer ' + pct(ae.rates.employer)
    + ' and the State ' + pct(ae.rates.state)
    + (ae.salaryCapApplies
        ? ', all on the first ' + euro(PBCompare.AE_SALARY_CAP) + ' of your salary only, which is why none of the three rises past that.'
        : ', all on your whole salary, since it is under the ' + euro(PBCompare.AE_SALARY_CAP) + ' cap.')
    + ' Your contribution comes out of your take-home pay, so there is no income tax relief on it.';

  /* money above the cap: shown only when there is some */
  const ac = PBCompare.aboveCap(salary, year, age, relief());
  $('capCard').hidden = !(ac.above > 0);
  if (ac.above > 0) {
    $('capAbove').textContent = euro(ac.above);
    $('capRate').textContent = '(' + pct(ac.rate) + ')';
    $('capStranded').textContent = euro(ac.strandedNet);
    $('capCouldBe').textContent = euro(ac.couldBe);
    $('capNote').textContent = 'Auto-enrolment takes nothing on salary above ' + euro(PBCompare.AE_SALARY_CAP)
      + ', so the ' + euro(ac.strandedNet) + ' your own rate would have taken from that part stays in your take-home pay. '
      + 'A personal pension could take that same ' + euro(ac.strandedNet) + ', relieved at your rate, and put '
      + euro(ac.couldBe) + ' into your pension. That is where the money could go, not a suggestion to leave or reduce My Future Fund, which never sees it either way.';
  }

  /* ---------- Mode 1 panel ---------- */
  $('aeTotal').textContent = euro(ae.totalIn);
  $('ppTotal').textContent = euro(pp.totalIn);
  $('ppTotal2').textContent = euro(pp.totalIn);
  $('aeNet').textContent = euro(ae.netCost);
  $('ppNet').textContent = euro(pp.netCost);
  $('ppNetLab').textContent = pp.relief > 0
    ? 'Your ' + euro(pp.gross) + ' contribution, less ' + euro(pp.relief) + ' of tax relief.'
    : 'Your contribution. No relief applies at this level.';

  const netGap = Math.round(pp.netCost - ae.netCost);
  $('vsNote').textContent = Math.abs(netGap) < 1
    ? 'Both paths cost you the same this year, so the totals above are a like-for-like comparison.'
    : (netGap > 0
        ? 'The personal pension costs you ' + euro(Math.abs(netGap)) + ' more out of pocket this year.'
        : 'The personal pension costs you ' + euro(Math.abs(netGap)) + ' less out of pocket this year.');

  $('ppGross').textContent = euro(pp.gross);
  $('ppRelief').textContent = euro(pp.relief);
  $('ppEmployer').textContent = euro(pp.employer);
  $('ppReliefCap').textContent = reliefAt(pp.reliefSplit);
  $('ppEmployerCap').textContent = match > 0 ? '(' + match + '% of salary)' : '(none set)';
  $('ppReliefNote').textContent = reliefSentence(pp, age);

  /* the Mode 1 verdict, stated the same way whichever path is larger */
  const cmp = PBCompare.compare({ salary, year, age, srcop: relief().srcop, gross, employerMatchPct: match });
  let verdict;
  if (cmp.larger === 'equal') {
    verdict = 'Both paths put the same amount into your pension this year, ' + euro(ae.totalIn) + '.';
  } else if (cmp.larger === 'autoEnrolment') {
    verdict = 'Auto-enrolment puts ' + euro(cmp.difference) + ' more into your pension this year, '
      + euro(ae.totalIn) + ' against ' + euro(pp.totalIn) + '.';
  } else {
    verdict = 'The personal pension puts ' + euro(cmp.difference) + ' more into your pension this year, '
      + euro(pp.totalIn) + ' against ' + euro(ae.totalIn) + '.';
  }
  verdict += Math.abs(netGap) < 1
    ? ' Both cost you the same out of pocket.'
    : ' Bear in mind the two do not cost you the same out of pocket.';
  $('verdictOut').textContent = verdict;

  /* ---------- Mode 2 panel ---------- */
  const x = c.extra;
  $('cTotal').textContent = euro(c.totalIn);
  $('cTopUp').textContent = euro(x.totalIn);
  $('cTopUp2').textContent = euro(x.totalIn);
  $('cAeNet').textContent = euro(ae.netCost);
  $('cExtraNet').textContent = euro(c.extraNet);
  $('cExtraLab').textContent = extraMonthly > 0
    ? 'Your ' + euro(extraMonthly) + ' a month, before relief.'
    : 'Nothing set yet. Move the slider to add an amount.';
  $('cNote').textContent = extraMonthly > 0
    ? 'Together, ' + euro(c.netCost) + ' out of your pocket this year puts ' + euro(c.totalIn) + ' into your pension.'
    : 'With no top-up, this is just auto-enrolment: ' + euro(ae.netCost) + ' out of your pocket puts ' + euro(ae.totalIn) + ' in.';

  $('cPaid').textContent = euro(c.extraNet);
  $('cRelief').textContent = euro(x.relief);
  $('cGross').textContent = euro(x.gross);
  $('cMatch').textContent = euro(x.employer);
  $('cReliefCap').textContent = reliefAt(x.reliefSplit);
  $('cMatchCap').textContent = tmatch > 0 ? '(' + tmatch + '% of the top-up)' : '(none set)';
  $('cReliefNote').textContent = extraMonthly > 0 ? reliefSentence(x, age) : '';

  /* the Mode 2 statement: matter of fact, a consequence of what the scheme allows */
  let cv = 'Auto-enrolment puts ' + euro(ae.totalIn) + ' into your pension this year at its set rate.';
  if (extraMonthly > 0) {
    cv += ' My Future Fund does not currently take contributions above that rate, so your extra goes through a personal pension. '
      + euro(extraMonthly) + ' a month from you becomes ' + euro(x.gross) + ' with tax relief'
      + (x.employer > 0 ? ', and your employer adds ' + euro(x.employer) + ' on top' : '')
      + '. Combined, ' + euro(c.totalIn) + ' goes into your pension for ' + euro(c.netCost) + ' out of your pocket.';
  } else {
    cv += ' My Future Fund does not currently take contributions above that rate. Add an amount above to see what routing it through a personal pension alongside auto-enrolment would put in.';
  }
  $('cVerdict').textContent = cv;

  /* one live region, announcing whichever mode is showing */
  announce(mode === 1
    ? verdict + ' Auto-enrolment costs you ' + euro(ae.netCost) + ', the personal pension costs you ' + euro(pp.netCost) + '.'
    : cv);

  ['age', 'salary', 'phase', 'gross', 'match', 'extra', 'tmatch'].forEach(id => paintSlider($(id)));
}

/* the relief sentence is the same for Mode 1's personal path and Mode 2's top-up */
function reliefSentence(layer, age) {
  return 'Revenue allows relief on up to ' + euro(layer.reliefLimit)
    + ' a year at your age, which is ' + pct(PBRelief.reliefBand(age)) + ' of earnings, counting earnings up to '
    + euro(PBRelief.EARN_CAP) + '.'
    + (layer.aboveReliefLimit > 0
        ? ' ' + euro(layer.aboveReliefLimit) + ' of your contribution is above that limit. It still goes into your pension, it just gets no relief.'
        : '');
}

['age', 'salary', 'phase', 'gross', 'match', 'extra', 'tmatch'].forEach(id => {
  const el = $(id);
  el.addEventListener('input', () => {
    if (id === 'gross') grossTouched = true;
    paintSlider(el);
    calc();
  });
  paintSlider(el);
});

/* the phase slider starts on the current year's phase (year 1 is 2026), so the
   default stays where the scheme actually is without an annual edit */
$('phase').value = Math.min(+$('phase').max, Math.max(1, new Date().getFullYear() - 2025));
paintSlider($('phase'));

setStatus(0);
/* a shared link can open straight onto Mode 2 */
setMode(location.hash === '#combined' ? 2 : 1);
