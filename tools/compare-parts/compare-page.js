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

/* Pension age, and the growth the multi-year card assumes. 66 is what every
   figure on this site assumes; 5% a year is the pension calculator's own
   default, reused rather than a second rate invented for this page. Both are
   said on the card in words. */
const PENSION_AGE = 66;
const GROWTH = 5;

/* Formatting, the slider fill, the wiring and the debounced live region are
   the same on all five calculators and live in assets/js/calc-page.js. */
const { $, euro, pct, paintSlider, wireRanges, announce } = window.PBPage;

/* Three illustrative risk levels for the personal pension side, on the 1 to 7
   Summary Risk Indicator every fund's Key Information Document carries.

   NEEDS DAMIAN INPUT. The return and bad-year figures below are placeholders.
   They must be confirmed against the actual fund ranges Gresham can arrange,
   and kept consistent with the 1% to 8% growth slider (default 5%) on
   pension-calculator.html and director-calculator.html, so no two calculators
   imply different growth. The bad-year figures are rough indications of a
   fall, not floors. Nothing here names an asset class; which fund ranges and
   structures can be offered, and whether any wider access should be
   mentioned at all, is also for Damian to confirm. See docs/STATUS.md. */
const RISK_LEVELS = [
  { name: 'Lower risk',  sri: '2 to 3', ret: 3, fall: 10, note: 'Mostly bonds and cash-like assets. Smaller swings, slower growth.' },
  { name: 'Medium risk', sri: '4',      ret: 5, fall: 20, note: 'A mix of shares and bonds. The level most default funds sit around.' },
  { name: 'Higher risk', sri: '5 to 6', ret: 7, fall: 30, note: 'Mostly shares. Bigger swings, more room to grow, and to fall.' }
];

function renderRisk() {
  $('riskTiles').innerHTML = RISK_LEVELS.map(l =>
    '<div class="risktile">'
    + '<div class="rk-name">' + l.name + '</div>'
    + '<div class="rk-sri">Risk rating <b>' + l.sri + '</b> of 7</div>'
    + '<div class="rk-row"><span>Illustrative return</span><b>around ' + l.ret + '% a year</b></div>'
    + '<div class="rk-row"><span>In a bad year, could fall</span><b>around ' + l.fall + '%' + (l.fall >= 30 ? ' or more' : '') + '</b></div>'
    + '<div class="rk-note">' + l.note + '</div>'
    + '<div class="rk-warn">Can fall as well as rise. Not a recommendation.</div>'
    + '</div>').join('');
}

/* the user has moved the Mode 1 contribution slider themselves, so stop re-matching it */
let grossTouched = false;

/* Screen readers otherwise announce a bare number, so each slider carries a
   formatted aria-valuetext (issue D4). */
const VALTEXT = {
  age: v => v + ' years',
  salary: v => euro(v),
  phase: v => 'Year ' + v + (v >= 10 ? ' or later' : ''),
  gross: v => euro(v) + ' a year',
  match: v => v + '% of salary',
  extra: v => euro(v) + ' a month',
  tmatch: v => v + '% of your top-up'
};

/* paintSlider takes the wording map as an argument, so bind it once here. A
   bare `paintSlider` handed to forEach would receive the array index as that
   argument and quietly fall back to euro formatting on every slider. */
const paint = el => paintSlider(el, VALTEXT);

function setStatus(i) {
  statusIx = i;
  grossTouched = false;                          // relief changed, so re-match
  for (let k = 0; k < STATUS.length; k++) {
    const b = $('st' + k), on = k === i;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  $('segInd').style.transform = 'translateX(' + (i * 100) + '%)';
  const st = STATUS[i];
  $('statusNote').innerHTML = 'Tax is 40% above <b>' + euro(st.srcop) + '</b> for you, so relief on a personal pension is 40% on that part and 20% below.'
    + (i === 2 ? ' The ' + euro(88000) + ' is a maximum; it needs the lower earner to have ' + euro(35000) + ' of their own.' : '');
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
  1: 'Same money out of your pocket. Auto-enrolment, or a personal pension instead?',
  2: 'Auto-enrolment as it is, plus extra saving through a personal pension.'
};

/* The auto-enrolment year is worked out from today's date. Year 1 is 2026.
   Nobody has to think about it unless they are planning for a future year,
   which is a toggle in More options, off by default. */
const SCHEME_START = 2025;                       // year 1 is SCHEME_START + 1
function thisYearsPhase() {
  return Math.min(+$('phase').max, Math.max(1, new Date().getFullYear() - SCHEME_START));
}
function schemeYear() {
  return $('futureOn').checked ? +$('phase').value : thisYearsPhase();
}

/* Yes/no toggles that reveal a secondary slider. Off means the slider is
   hidden and counts as zero, whatever it was last set to. */
function toggled(id) { return $(id).checked; }
function syncToggles() {
  document.querySelectorAll('.togbody[data-for]').forEach(b => {
    b.hidden = !$(b.getAttribute('data-for')).checked;
  });
}

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

function calc() {
  const age = +$('age').value;
  const salary = +$('salary').value;
  const year = schemeYear();
  const match = toggled('matchOn') ? +$('match').value : 0;
  const extraMonthly = +$('extra').value;
  const tmatch = toggled('tmatchOn') ? +$('tmatch').value : 0;

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
  $('matchV').textContent = (+$('match').value) + '%';
  $('extraV').textContent = euro(extraMonthly);
  $('tmatchV').textContent = (+$('tmatch').value) + '%';
  $('phaseNote').textContent = 'Phase ' + ae.phase + ' (' + ae.years + '): you '
    + pct(ae.rates.employee) + ', employer ' + pct(ae.rates.employer) + ', State ' + pct(ae.rates.state) + '.';

  /* the one line about the year, said plainly, up where the answer is */
  const calYear = SCHEME_START + year;
  $('phaseLine').textContent = ($('futureOn').checked ? 'Planning for ' + calYear : 'Since it is ' + calYear)
    + ', you are in year ' + year + ' of the phase-in: you put in ' + pct(ae.rates.employee)
    + ', your employer matches ' + pct(ae.rates.employer) + ', and the State adds ' + pct(ae.rates.state) + '.';

  /* where 20% becomes 40%: the salary split at the cut-off this status uses */
  const cut = relief().srcop, bandLo = Math.min(salary, cut), bandHi = Math.max(0, salary - cut);
  $('pbBandLo').style.width = (bandLo / salary * 100).toFixed(4) + '%';
  $('pbBandHi').style.width = (bandHi / salary * 100).toFixed(4) + '%';
  $('pbBandLoN').textContent = euro(bandLo);
  $('pbBandHiN').textContent = euro(bandHi);

  /* the phase staircase in the assumptions: tag the phase these figures use */
  for (let i = 1; i <= 4; i++) $('pbStair' + i).hidden = ae.phase !== i;

  /* ---------- shared: the auto-enrolment layer ---------- */
  $('aeEmployee').textContent = euro(ae.employee);
  $('aeEmployer').textContent = euro(ae.employer);
  $('aeState').textContent = euro(ae.state);
  $('aeTotal2').textContent = euro(ae.totalIn);
  const capNote = ae.salaryCapApplies ? '(on the first ' + euro(PBCompare.AE_SALARY_CAP) + ')' : '';
  $('aeEmployerCap').textContent = capNote;
  $('aeStateCap').textContent = capNote;
  $('aeRatesNote').textContent = (ae.salaryCapApplies
        ? 'All three are worked out on the first ' + euro(PBCompare.AE_SALARY_CAP) + ' of your salary only.'
        : 'All three are worked out on your whole salary.')
    + ' Yours comes out of take-home pay, so there is no tax relief on it.';

  /* money above the cap: shown only when there is some */
  const ac = PBCompare.aboveCap(salary, year, age, relief());
  $('capCard').hidden = !(ac.above > 0);
  if (ac.above > 0) {
    $('capAbove').textContent = euro(ac.above);
    $('capRate').textContent = '(' + pct(ac.rate) + ')';
    $('capStranded').textContent = euro(ac.strandedNet);
    $('capCouldBe').textContent = euro(ac.couldBe);
    $('capNote').textContent = 'Auto-enrolment takes nothing on salary above ' + euro(PBCompare.AE_SALARY_CAP)
      + ', so this ' + euro(ac.strandedNet) + ' stays in your pay. A personal pension could take it and, with tax relief, put '
      + euro(ac.couldBe) + ' in. Not a reason to leave My Future Fund, which never sees it either way.';
  }

  /* ---------- Mode 1 panel ---------- */
  $('aeTotal').textContent = euro(ae.totalIn);
  $('ppTotal').textContent = euro(pp.totalIn);
  $('ppTotal2').textContent = euro(pp.totalIn);
  $('aeNet').textContent = euro(ae.netCost);
  $('ppNet').textContent = euro(pp.netCost);
  $('ppNetLab').textContent = pp.relief > 0
    ? euro(pp.gross) + ' in, less ' + euro(pp.relief) + ' of tax relief.'
    : 'Your contribution. No relief at this level.';

  const netGap = Math.round(pp.netCost - ae.netCost);
  $('vsNote').textContent = Math.abs(netGap) < 1
    ? 'Both cost you the same, so the totals above are like for like.'
    : (netGap > 0
        ? 'The personal pension costs you ' + euro(Math.abs(netGap)) + ' more out of pocket.'
        : 'The personal pension costs you ' + euro(Math.abs(netGap)) + ' less out of pocket.');

  $('ppGross').textContent = euro(pp.gross);
  $('ppRelief').textContent = euro(pp.relief);
  $('ppEmployer').textContent = euro(pp.employer);
  $('ppReliefCap').textContent = reliefAt(pp.reliefSplit);
  $('ppEmployerCap').textContent = match > 0 ? '(' + match + '% of salary)' : '(none)';
  $('ppReliefNote').textContent = reliefSentence(pp, age);

  /* the Mode 1 verdict, stated the same way whichever path is larger */
  const cmp = PBCompare.compare({ salary, year, age, srcop: relief().srcop, gross, employerMatchPct: match });

  /* EVERYTHING PAID IN, BY 66. The same comparison over every year that is
     left rather than one of them. The growth assumption is the calculators'
     own default, 5% a year, named on the card; the module is told it rather
     than owning it. Pension age is 66, which is what every figure on this
     site assumes. */
  const my = PBCompare.cumulative({
    salary, firstYear: year, age, retireAge: PENSION_AGE, srcop: relief().srcop,
    gross: +$('gross').value, employerMatchPct: match, growth: GROWTH / 100
  });
  $('pbMySub').textContent = my.years > 0
    ? 'Both paths, every year from ' + age + ' to ' + PENSION_AGE + ', grown at ' + GROWTH + '% a year.'
    : 'You are at or past ' + PENSION_AGE + ', so there are no years left to add up.';
  $('pbMyAe').textContent = euro(my.autoEnrolment);
  $('pbMyPp').textContent = euro(my.personal);
  const myTop = Math.max(my.autoEnrolment, my.personal);
  [['pbMyAeBar', my.autoEnrolment], ['pbMyPpBar', my.personal]].forEach(function (lane) {
    $(lane[0]).style.width = (myTop > 0 ? lane[1] / myTop * 100 : 0) + '%';
  });

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
    : ' They do not cost you the same out of pocket, though.';

  /* ---------- Mode 2 panel ---------- */
  const x = c.extra;
  $('cTotal').textContent = euro(c.totalIn);
  $('cTopUp').textContent = euro(x.totalIn);
  $('cTopUp2').textContent = euro(x.totalIn);
  $('cAeNet').textContent = euro(ae.netCost);
  $('cExtraNet').textContent = euro(c.extraNet);
  $('cExtraLab').textContent = extraMonthly > 0
    ? euro(extraMonthly) + ' a month, before relief.'
    : 'Nothing yet. Move the slider to add an amount.';
  $('cNote').textContent = extraMonthly > 0
    ? euro(c.netCost) + ' out of your pocket puts ' + euro(c.totalIn) + ' in.'
    : 'With no top-up this is just auto-enrolment: ' + euro(ae.netCost) + ' puts ' + euro(ae.totalIn) + ' in.';

  $('cPaid').textContent = euro(c.extraNet);
  $('cRelief').textContent = euro(x.relief);
  $('cGross').textContent = euro(x.gross);
  $('cMatch').textContent = euro(x.employer);
  $('cReliefCap').textContent = reliefAt(x.reliefSplit);
  $('cMatchCap').textContent = tmatch > 0 ? '(' + tmatch + '% of the top-up)' : '(none)';
  $('cReliefNote').textContent = extraMonthly > 0 ? reliefSentence(x, age) : '';

  /* the Mode 2 statement: matter of fact, a consequence of what the scheme allows */
  let cv = 'Auto-enrolment puts ' + euro(ae.totalIn) + ' into your pension this year.';
  if (extraMonthly > 0) {
    cv += ' Your extra ' + euro(extraMonthly) + ' a month becomes ' + euro(x.gross) + ' with tax relief'
      + (x.employer > 0 ? ', plus ' + euro(x.employer) + ' from your employer' : '')
      + '. Together, ' + euro(c.totalIn) + ' goes in for ' + euro(c.netCost) + ' out of your pocket.';
  } else {
    cv += ' Add an amount on the left to see what saving extra on top would put in.';
  }
  $('leadOut').textContent = mode === 1 ? verdict : cv;

  /* one live region, announcing whichever mode is showing */
  announce(mode === 1
    ? verdict + ' Auto-enrolment costs you ' + euro(ae.netCost) + ', the personal pension costs you ' + euro(pp.netCost) + '.'
    : cv);

  ['age', 'salary', 'phase', 'gross', 'match', 'extra', 'tmatch'].forEach(id => paint($(id)));
}

/* the relief sentence is the same for Mode 1's personal path and Mode 2's top-up */
function reliefSentence(layer, age) {
  return 'Revenue allows relief on up to ' + euro(layer.reliefLimit) + ' a year at your age.'
    + (layer.aboveReliefLimit > 0
        ? ' ' + euro(layer.aboveReliefLimit) + ' of this is above that limit, so it goes in without relief.'
        : '');
}

/* ---- the two Mode 1 totals, drawn to one scale ----
   The bars are read back from #aeTotal and #ppTotal, the two cells calc() has
   just written, so the picture is scaled from exactly the figures on screen
   and can never contradict them. No maths module is called here.

   calc() itself is not edited: the `calc` binding is wrapped once, after the
   function is defined, and every call site resolves `calc` by name at call
   time, so the load render and every later one go through the wrapper.

   Both lanes travel at one speed. Each bar's transition-duration is set in
   proportion to the length it has to cover, so the longer bar is still moving
   after the shorter one has stopped. There is no line to reach and no marker
   on either lane: the end rule is identical on both tracks and is simply where
   the scale ends. Under prefers-reduced-motion the CSS drops the transition
   and the bars sit at their lengths. */
function pbScaleValue(id) {
  const el = $(id);
  if (!el) return 0;
  const n = +String(el.textContent).replace(/[^0-9]/g, '');
  return isFinite(n) ? n : 0;
}

function renderScale() {
  /* which year the lanes are drawn for: they already move with the
     auto-enrolment year slider, and this says so, so a reader dragging it can
     see what changed and why */
  const sub = $('pbScaleSub');
  if (sub) {
    const y = +$('phase').value;
    sub.textContent = 'One year of contributions each, at year ' + y + (y >= 10 ? '+' : '') +
      ' of the phase-in, on the same scale. The longer bar reaches the end of the scale.';
  }
  const ae = pbScaleValue('aeTotal');
  const pp = pbScaleValue('ppTotal');
  /* the bars read parsed text, so a parse failure would give both of them 0 */
  const top = Math.max(ae, pp);
  const lanes = [['pbScaleAeBar', ae], ['pbScalePpBar', pp]];
  for (let i = 0; i < lanes.length; i++) {
    const bar = $(lanes[i][0]);
    if (!bar) continue;
    const f = top > 0 ? lanes[i][1] / top : 0;
    bar.style.setProperty('transition-duration', Math.max(0.2, 0.9 * f).toFixed(2) + 's');
    bar.style.width = (f * 100) + '%';
  }
}

var pbCalcFigures = calc;
calc = function () {
  pbCalcFigures();
  renderScale();
};

wireRanges(VALTEXT, el => {
  if (el.id === 'gross') grossTouched = true;
  /* a new salary or age means a new auto-enrolment cost, so the contribution
     goes back to matching it; a value dragged at one salary must not survive
     into another */
  if (el.id === 'salary' || el.id === 'age') grossTouched = false;
  calc();
});

/* the phase slider, behind its toggle, starts on this year's phase */
$('phase').value = thisYearsPhase();
paint($('phase'));
['futureOn', 'matchOn', 'tmatchOn'].forEach(id => {
  $(id).addEventListener('change', () => {
    syncToggles();
    /* a slider that was hidden has no width until now, so repaint it */
    document.querySelectorAll('.togbody:not([hidden]) input[type=range]').forEach(paint);
    calc();
  });
});
syncToggles();
renderRisk();
setStatus(0);
/* a shared link can open straight onto Mode 2 */
setMode(location.hash === '#combined' ? 2 : 1);
