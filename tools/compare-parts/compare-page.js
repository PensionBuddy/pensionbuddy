/* broker-vs-autoenrolment.html
   Maths lives in assets/js/autoenrolment.js and assets/js/pension-tax-relief.js,
   which are the single source of truth and are covered by
   tests/compare-calc.test.js. This file only reads the controls and paints
   the results, so the page cannot hold a second copy of the rules.

   12 October 2026 (Damian: "simplify all the calculators", "we don't need to
   know their income necessarily"). Two questions, three controls each:

     Instead of:  the same money from you, auto-enrolment or a personal
                  pension. The personal pension is always the one that costs
                  what auto-enrolment costs that year (matchedGross), so there
                  is nothing to set; by 66, every year is matched again.
     On top of:   auto-enrolment as it is, plus an extra amount each month
                  through a personal pension, because My Future Fund takes
                  nothing above its set rate (the source warning in
                  autoenrolment.js).

   Salary stays: auto-enrolment is a share of it. Age stays: Revenue's limit
   and the years to 66 are worked from it. How you are taxed sets where 20%
   becomes 40%. The auto-enrolment year is today's.

   HONESTY RULE: this page reports the numbers for the inputs entered and
   nothing more. Whichever path puts more in, it is said in the same words
   and the same place. Nothing here suggests leaving auto-enrolment. */
let mode = 1;

/* relief at the rate each euro attracts, split at the standard rate cut-off
   point; figures live in PBRelief */
const STATUS = [
  { srcop: PBRelief.SRCOP.single },
  { srcop: PBRelief.SRCOP.marriedOneIncome },
  { srcop: PBRelief.SRCOP.marriedTwoIncomes }
];
let statusIx = 0;
const relief = () => ({ srcop: STATUS[statusIx].srcop });

/* Pension age, and the growth the by-66 cards assume: risk level 4 of
   assets/js/pb-assumptions.js, about half shares and half bonds, 5% a year,
   the pension calculator's own figure. Both are said on the page. */
const PENSION_AGE = 66;
const GROWTH = window.PBAssume ? Math.round(PBAssume.level(4).rate * 1000) / 10 : 5;

const { $, euro, pct, paintSlider, wireRanges, announce } = window.PBPage;
const REDUCE = !document.documentElement.classList.contains('pb-motion');

/* screen readers otherwise announce a bare number (issue D4) */
const VALTEXT = {
  age: v => v + ' years',
  salary: v => euro(v) + ' a year',
  extra: v => euro(v) + ' a month'
};
const paint = el => paintSlider(el, VALTEXT);

/* The auto-enrolment year is worked out from today's date. Year 1 is 2026. */
const SCHEME_START = 2025;
const thisYearsPhase = () => Math.max(1, new Date().getFullYear() - SCHEME_START);

/* A headline figure glides to its new value; under reduced motion it is
   simply written. Every tween ends on the exact figure. */
const tweens = {};
function show(id, v) {
  const el = $(id);
  if (!el) return;
  const to = Math.round(v);
  const was = tweens[id] ? tweens[id].to : +String(el.textContent).replace(/[^0-9]/g, '');
  if (tweens[id]) cancelAnimationFrame(tweens[id].raf);
  if (REDUCE || !isFinite(was) || was === to || !el.offsetParent) { el.textContent = euro(to); delete tweens[id]; return; }
  const t = { to: to, raf: 0 }, t0 = performance.now();
  tweens[id] = t;
  (function step(now) {
    const k = Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - k, 3);
    el.textContent = euro(was + (to - was) * e);
    if (k < 1) t.raf = requestAnimationFrame(step); else delete tweens[id];
  })(t0);
}

/* a bar's parts, each as wide as its share of the scale */
function bars(parts, top) {
  parts.forEach(([id, v]) => { $(id).style.width = (top > 0 ? Math.max(0, v) / top * 100 : 0).toFixed(3) + '%'; });
}

function setStatus(i) {
  statusIx = i;
  for (let k = 0; k < STATUS.length; k++) {
    const b = $('st' + k), on = k === i;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  $('segInd').style.transform = 'translateX(' + (i * 100) + '%)';
  calc();
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
  /* the extra amount belongs to the second question only */
  document.querySelectorAll('[data-mode]').forEach(el => { el.hidden = el.getAttribute('data-mode') !== String(m); });
  document.querySelectorAll('.panel input[type=range]').forEach(paint);
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
  const extraMonthly = +$('extra').value;
  const year = thisYearsPhase();
  const r = relief();

  const ae = PBCompare.autoEnrolment(salary, year);
  const gross = PBCompare.matchedGross(salary, year, age, r);
  const pp = PBCompare.personalPension(gross, age, salary, r, 0);
  const cmp = PBCompare.compare({ salary, year, age, srcop: r.srcop, gross, employerMatchPct: 0 });
  const c = PBCompare.combined({ salary, year, age, srcop: r.srcop, extraMonthly, topUpMatchPct: 0 });
  const x = c.extra;

  $('ageV').textContent = age;
  $('salaryV').textContent = euro(salary);
  $('extraV').textContent = euro(extraMonthly);

  /* ---------- the first question: the same money from you ---------- */
  show('aeTotal', ae.totalIn);
  show('ppTotal', pp.totalIn);
  $('aeNet').textContent = euro(ae.employee);
  $('aeEmployer').textContent = euro(ae.employer);
  $('aeState').textContent = euro(ae.state);
  $('ppNet').textContent = euro(pp.netCost);
  $('ppRelief').textContent = euro(pp.relief);
  const top1 = Math.max(ae.totalIn, pp.totalIn);
  bars([['aeBarYou', ae.employee], ['aeBarEmp', ae.employer], ['aeBarState', ae.state],
        ['ppBarYou', pp.netCost], ['ppBarRev', pp.relief]], top1);

  const cost = 'For the same ' + euro(ae.netCost) + ' a year from you, ';
  let lead;
  if (cmp.larger === 'equal') {
    lead = cost + 'both put ' + euro(ae.totalIn) + ' into your pension.';
  } else if (cmp.larger === 'autoEnrolment') {
    lead = cost + 'auto-enrolment puts ' + euro(ae.totalIn) + ' into your pension. A personal pension puts ' + euro(pp.totalIn) + '.';
  } else {
    lead = cost + 'a personal pension puts ' + euro(pp.totalIn) + ' into your pension. Auto-enrolment puts ' + euro(ae.totalIn) + '.';
  }
  $('leadOut').textContent = lead;

  const calYear = SCHEME_START + year;
  $('phaseLine').textContent = calYear + ' is year ' + year + ' of auto-enrolment: ' + pct(ae.rates.employee)
    + ' of salary from you, ' + pct(ae.rates.employer) + ' from your employer, ' + pct(ae.rates.state)
    + ' from the State' + (ae.salaryCapApplies ? ', on the first ' + euro(PBCompare.AE_SALARY_CAP) : '')
    + '. Into a personal pension, your employer pays only if they agree to.';
  for (let i = 1; i <= 4; i++) $('pbStair' + i).hidden = ae.phase !== i;

  /* money above the cap: said only when there is some */
  const ac = PBCompare.aboveCap(salary, year, age, r), cap = $('capCard');
  cap.hidden = !(ac.above > 0);
  if (ac.above > 0) {
    cap.innerHTML = 'Auto-enrolment stops at ' + euro(PBCompare.AE_SALARY_CAP) + '. On the other <b>' + euro(ac.above)
      + '</b> of your salary, your ' + pct(ac.rate) + ', <b>' + euro(ac.strandedNet) + '</b>, stays in your pay. '
      + 'A personal pension could take it and, with tax relief, put <b>' + euro(ac.couldBe) + '</b> in.';
  }

  /* by 66: the same cost to you every year, each year matched again */
  const my = PBCompare.cumulative({ salary, firstYear: year, age, retireAge: PENSION_AGE, srcop: r.srcop,
    matched: true, employerMatchPct: 0, growth: GROWTH / 100 });
  $('pbMySub').textContent = 'The same cost to you every year from ' + age + ' to ' + PENSION_AGE + ', grown at ' + GROWTH + '% a year.';
  show('pbMyAe', my.autoEnrolment);
  show('pbMyPp', my.personal);
  bars([['pbMyAeBar', my.autoEnrolment], ['pbMyPpBar', my.personal]], Math.max(my.autoEnrolment, my.personal));

  /* ---------- the second question: extra, on top ---------- */
  show('cTotal', c.totalIn);
  show('cNet', c.netCost);
  $('cAeNet').textContent = euro(ae.employee);
  $('cEmp').textContent = euro(ae.employer);
  $('cState').textContent = euro(ae.state);
  $('cExtraNet').textContent = euro(c.extraNet);
  $('cRelief').textContent = euro(x.relief);
  const some = extraMonthly > 0;
  $('cExtraNet').closest('li').hidden = !some;
  $('cRelief').closest('li').hidden = !some;
  bars([['cBarYou', ae.employee], ['cBarEmp', ae.employer], ['cBarState', ae.state],
        ['cBarExtra', c.extraNet], ['cBarRev', x.relief]], c.totalIn);
  bars([['cLabAe', ae.totalIn], ['cLabTop', x.totalIn]], c.totalIn);
  $('cLabTop').textContent = some ? 'Your extra' : '';

  let lead2 = 'Auto-enrolment puts ' + euro(ae.totalIn) + ' in for ' + euro(ae.netCost) + ' from you.';
  if (some) {
    lead2 = 'Auto-enrolment puts ' + euro(ae.totalIn) + ' in. Your extra ' + euro(extraMonthly) + ' a month becomes '
      + euro(x.gross) + ' with tax relief: ' + euro(c.totalIn) + ' a year, for ' + euro(c.netCost) + ' from you.';
    if (x.aboveReliefLimit > 0) {
      lead2 += ' ' + euro(x.aboveReliefLimit) + ' of it is over Revenue’s limit at ' + age + ', so it goes in without relief.';
    }
  } else {
    lead2 += ' Add an extra amount to see what saving more puts in.';
  }
  $('leadOut2').textContent = lead2;

  const k = PBCompare.cumulativeCombined({ salary, firstYear: year, age, retireAge: PENSION_AGE, srcop: r.srcop,
    extraMonthly, growth: GROWTH / 100 });
  $('pbMySub2').textContent = 'Auto-enrolment, and the same extra each month, from ' + age + ' to ' + PENSION_AGE + ', grown at ' + GROWTH + '% a year.';
  show('pbMyAe2', k.autoEnrolment);
  show('pbMyC', k.total);
  bars([['pbMyAeBar2', k.autoEnrolment], ['pbMyCBar', k.total]], Math.max(k.autoEnrolment, k.total));

  announce(mode === 1
    ? lead + ' By ' + PENSION_AGE + ': auto-enrolment ' + euro(my.autoEnrolment) + ', a personal pension ' + euro(my.personal) + '.'
    : lead2 + ' By ' + PENSION_AGE + ': ' + euro(k.total) + '.');
}

/* Point at a source, in a bar or in its key, and it lights in every bar on
   that card; the rest step back. A tap does the same on a phone. Nothing
   here changes a figure. */
document.querySelectorAll('.cmp-hero').forEach(hero => {
  function light(src) {
    if (src) hero.setAttribute('data-hl', src); else hero.removeAttribute('data-hl');
    hero.querySelectorAll('[data-part]').forEach(el => el.classList.toggle('cmp-on', !!src && el.getAttribute('data-part') === src));
  }
  hero.addEventListener('pointerover', e => { const s = e.target.closest('[data-part]'); light(s ? s.getAttribute('data-part') : null); });
  hero.addEventListener('pointerleave', () => light(null));
});

wireRanges(VALTEXT, calc);
setStatus(0);
/* a shared link can open straight onto the second question */
setMode(location.hash === '#combined' ? 2 : 1);
