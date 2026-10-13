/* broker-vs-autoenrolment.html (13 October 2026).
   The maths is assets/js/autoenrolment.js, PBCompare.monthly(), covered by
   tests/compare-calc.test.js; the motion is assets/js/pb-cmp-motion.js.
   This file reads the two controls and paints the result, nothing else.

   Damian, 13 October 2026: "I'm messing around with the auto enrolment
   calculator and it's not changing. 'For the same 1,200 from you ... 2,000
   personal.' Why are we choosing an arbitrary figure? We should be able to
   compare apples for apples. If you want to put in more, you can, and show
   clearly that the personal pension is better after 80k."

   Why it was "not changing": the old page worked the amount from you out
   of salary (1.5% of it), so past €80,000 of salary every figure on it
   froze at €1,200 against €2,000; age moved nothing above the fold; and
   the tax status moved nothing below the 40% band. Now the reader sets the
   amount itself, and every control moves every figure it should:

     You put in, a month   both cards, the bars, the line under the slider,
                           and past the limit the notice and the best of both
     Your tax rate         the personal pension, its bar, the best of both
                           and the line at the top

   HONESTY RULE: up to the limit auto-enrolment puts in more, and the page
   says so in the same words and the same place as the opposite. Nothing
   here suggests leaving or reducing auto-enrolment. */
const { $, euro, pct, paintSlider, wireRanges, announce } = window.PBPage;
const M = window.PBCmpMotion || {
  num(el, v, fmt) { if (el) el.textContent = (fmt || euro)(v); },
  width(el, p) { if (el) el.style.width = p.toFixed(3) + '%'; },
  left(el, p) { if (el) el.style.left = p.toFixed(3) + '%'; },
  arm() {}, open(w, on) { if (w) w.hidden = !on; }, pop() {}, nudge() {}, swap() {}
};

/* The auto-enrolment year is worked out from today's date: 2026 is year 1. */
const SCHEME_START = 2025;
const YEAR = Math.max(1, new Date().getFullYear() - SCHEME_START);
const PHASE = PBCompare.phaseForYear(YEAR);
const LIMIT = PBCompare.monthlyLimit(YEAR);          // the most auto-enrolment takes from you, a month
const R = Math.round;
/* auto-enrolment's most, a month, as the card shows it (each part rounded, then added) */
const AE_MOST = R(LIMIT) + R(LIMIT * PHASE.employer / PHASE.employee) + R(LIMIT * PHASE.state / PHASE.employee);
/* the top rate of income tax the switch offers: the bars' scale is set at it */
const TOP_RATE = 40;

/* the limit, and the pay it stands for: Damian's "better after 80k" */
const PAST = 'Past ' + euro(LIMIT) + ' a month (pay over ' + euro(PBCompare.AE_SALARY_CAP) + '), auto-enrolment takes no more.';

let rate = 20;
const VALTEXT = { extra: v => euro(v) + ' a month' };
const plus = v => '+' + euro(v);
const per = v => '€' + v.toFixed(2);

function setRate(r) {
  rate = r;
  [20, 40].forEach(k => {
    const b = $('tx' + k), on = k === r;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  $('segInd').style.transform = r === 40 ? 'translateX(100%)' : 'translateX(0)';
  $('taxRate').value = r + '%';   /* what the emailed result says (assets/js/pb-after.js) */
  calc();
}

/* text and properties are written only when they change, and the page's
   geometry is read only when it can have changed (a resize, the best of both
   opening), so dragging the slider costs as little as it can */
const put = (el, t) => { if (el.textContent !== t) el.textContent = t; };
const geo = { trk: 0, w: 0, w2: 0, limf: '', trkS: '' };
function measure() {
  const rr = $('cmpRail').getBoundingClientRect(), sr = $('extra').getBoundingClientRect();
  if (sr.height) geo.trk = sr.top - rr.top + sr.height / 2;
  geo.w = $('aeTrack').offsetWidth;
  /* the best of both's track, measured even while it is away: shown for the
     length of one read, in the same task, so it is never painted; then read
     away again, so its next arrival starts from nothing rather than from the
     shut state this read saw (which would glide it open at load) */
  const wrap = $('cmpBestW'), away = wrap.hidden;
  if (away) wrap.hidden = false;
  geo.w2 = $('bestTrack').offsetWidth;
  if (away) { wrap.hidden = true; void wrap.offsetHeight; }
}

/* every figure as it shows, each part rounded and the totals their sums,
   so what is on screen always adds up */
function figures(you, taxRate) {
  const m = PBCompare.monthly({ you, taxRate, year: YEAR });
  const A = { you: R(m.autoEnrolment.you), emp: R(m.autoEnrolment.employer), state: R(m.autoEnrolment.state) };
  A.total = A.you + A.emp + A.state;
  const P = { you: R(m.personal.you), rel: R(m.personal.relief) };
  P.total = P.you + P.rel;
  const T = { you: R(m.best.personal.you), rel: R(m.best.personal.relief) };
  T.total = T.you + T.rel;
  return { m, A, P, T, B: A.total + T.total, over: m.autoEnrolment.capped };
}

let wasOver = null, wasLead = '';
function calc() {
  const slider = $('extra');
  const you = +slider.value;
  const { m, A, P, T, B, over } = figures(you, rate);

  /* ---- the slider: what it means, and the limit on its rail ---- */
  put($('extraV'), euro(you));
  const lo = +slider.min, hi = +slider.max, f = (LIMIT - lo) / (hi - lo);
  const rail = $('cmpRail'), limf = Math.max(0, Math.min(1, f)).toFixed(4), trk = geo.trk.toFixed(1) + 'px';
  if (limf !== geo.limf) { geo.limf = limf; rail.style.setProperty('--limf', limf); }
  if (geo.trk && trk !== geo.trkS) { geo.trkS = trk; rail.style.setProperty('--trk', trk); }
  rail.classList.toggle('is-over', over);
  $('cmpLim').classList.toggle('cmp-lim-l', f < 0.12);
  if (!over) {
    put($('cmpPay'), euro(you) + ' a month is ' + pct(PHASE.employee) + ' of ' + euro(m.pay)
      + ' pay. Auto-enrolment takes up to ' + euro(LIMIT) + '.');
  }
  $('cmpSay').classList.toggle('is-over', over);

  /* ---- the line at the top: what each euro becomes ---- */
  const lead = over
    ? 'Each <b>€1</b> over ' + euro(LIMIT) + ' becomes <b>€0</b> in auto-enrolment, <b>' + per(m.perEuro.personal) + '</b> in a personal pension.'
    : 'Each <b>€1</b> you put in becomes <b>' + per(m.perEuro.autoEnrolment) + '</b> in auto-enrolment, <b>' + per(m.perEuro.personal) + '</b> in a personal pension.';
  if (lead !== wasLead) {
    $('leadOut').innerHTML = lead;
    if (wasLead) M.swap($('leadOut'));
    wasLead = lead;
  }

  /* ---- the two cards ---- */
  M.num($('aeTotal'), A.total);
  M.num($('aeYou'), A.you);
  M.num($('aeEmp'), A.emp);
  M.num($('aeState'), A.state);
  M.num($('ppTotal'), P.total);
  M.num($('ppYou'), P.you);
  M.num($('ppRel'), P.rel, plus);
  const card = $('aeTrack').closest('.cmp-card');
  card.classList.toggle('is-capped', over);
  put($('aeLeft'), over
    ? 'It takes ' + euro(A.you) + ' of your ' + euro(you) + '. The other ' + euro(T.you) + ' stays in your pay.'
    : 'The State adds €1 for every €3 you put in.');
  const tag = $('aeTag');
  if (over !== wasOver) {
    tag.textContent = over ? 'At its limit' : '';
    if (over && wasOver === false) M.pop(tag);
    if (wasOver !== null) M.nudge($('cmpLimV'));   /* the limit's mark, crossed either way */
  }

  /* ---- past the limit: the best of both ---- */
  const wrap = $('cmpBestW');
  M.open(wrap, over, wasOver === null);   // at load (an amount from the link) it is simply there
  /* while it is away, and as it arrives, its figures are simply right: they
     roll only once it is there to watch */
  const settled = over && wasOver === true;
  M.num($('bestTotal'), B, null, !settled);
  M.num($('bAe'), A.total, null, !settled);
  M.num($('bTop'), T.total, null, !settled);
  put($('bTopL'), 'Personal pension, the other ' + euro(T.you));
  wasOver = over;

  /* ---- the bars: one euro scale for all three, and it holds still ----
     Set by the most the slider reaches, at the top rate of tax, so neither
     a slide nor the tax switch rescales it: a bar moves only when its own
     figure does, and auto-enrolment's stops at its mark while the personal
     pension's goes on. k is the cards' track over the best of both's, which
     is wider on a wide screen, so a euro is as long on every bar. An amount
     typed past the slider's end widens the slider, and the scale with it. */
  const k = geo.w > 0 && geo.w2 > 0 ? geo.w / geo.w2 : 1;
  const top = figures(Math.max(+slider.max, you), TOP_RATE);
  const S = Math.max(AE_MOST, top.P.total, top.B * k) * 1.04;
  const at = v => v / S * 100;
  M.width($('aeBarYou'), at(A.you));
  M.width($('aeBarEmp'), at(A.emp));
  M.width($('aeBarState'), at(A.state));
  M.width($('ppBarYou'), at(P.you));
  M.width($('ppBarRev'), at(P.rel));
  M.left($('aeTrack').querySelector('.cmp-cap'), at(AE_MOST));
  M.width($('bBarYou'), at(A.you) * k);
  M.width($('bBarEmp'), at(A.emp) * k);
  M.width($('bBarState'), at(A.state) * k);
  M.width($('bBarTop'), at(T.you) * k);
  M.width($('bBarRev'), at(T.rel) * k);

  announce('For ' + euro(you) + ' a month from you: auto-enrolment puts in ' + euro(A.total)
    + ', a personal pension ' + euro(P.total) + '.'
    + (over ? ' ' + PAST + ' Best of both: ' + euro(B) + ' a month.' : ''));
}

/* the year's rates, and the limit as it rises with them, from the module */
(function () {
  const cal = SCHEME_START + YEAR;
  const later = PBCompare.AE_PHASES.filter(p => p.fromYear > YEAR)
    .map((p, i) => euro(PBCompare.monthlyLimit(p.fromYear)) + (i ? '' : ' a month') + ' from ' + (SCHEME_START + p.fromYear));
  $('phaseLine').textContent = cal + ' rates: ' + pct(PHASE.employee) + ' of pay from you, ' + pct(PHASE.employer)
    + ' from your employer, ' + pct(PHASE.state) + ' from the State, on pay up to ' + euro(PBCompare.AE_SALARY_CAP) + '. '
    + (later.length ? 'The limit rises with the rates: ' + later.join(', ') + '.'
                    : 'Its limit is now at its highest: ' + euro(LIMIT) + ' a month.');
  for (let i = 1; i <= 4; i++) { const t = $('pbStair' + i); if (t) t.hidden = PHASE.phase !== i; }
  $('cmpLimV').textContent = euro(LIMIT) + ' limit';
  $('cmpNoteT').textContent = PAST + ' A personal pension takes the rest.';
  $('taxHint').textContent = 'Your top rate is 40% if you earn over ' + euro(PBRelief.SRCOP.single) + ' (single).';
}());

/* Point at a source, in a bar or in its key, and it lights everywhere on the
   result; the rest step back. A tap does the same on a phone. Nothing here
   changes a figure. */
(function () {
  const res = document.querySelector('[data-pb-calc] .results');
  const AE = ['you', 'emp', 'state', 'ae'];
  function light(src) {
    const on = src === 'ae' ? AE : src ? [src] : [];
    if (on.length) res.setAttribute('data-hl', src); else res.removeAttribute('data-hl');
    res.querySelectorAll('.cmp-s[data-part], .cmp-key li[data-part]').forEach(el => {
      el.classList.toggle('cmp-on', on.indexOf(el.getAttribute('data-part')) >= 0);
    });
  }
  res.addEventListener('pointerover', e => {
    const s = e.target.closest('.cmp-s[data-part], .cmp-key li[data-part]');
    light(s ? s.getAttribute('data-part') : null);
  });
  res.addEventListener('pointerleave', () => light(null));
}());

/* the bars' scale follows the cards' widths, and the limit's mark the slider */
if (window.ResizeObserver) {
  const ro = new ResizeObserver(() => { measure(); calc(); });
  ro.observe($('aeTrack'));
  ro.observe($('cmpRail'));
}

/* An amount handed over in the link's fragment (#you=200), by the starter
   page's auto-enrolment block, so the page opens at the reader's own
   figure. Read once, before the first paint, rounded to the slider's step
   and held inside it; the fragment never reaches a server. With no
   fragment the page opens at its default, €50. */
(function () {
  const q = /(?:^#|&)you=(\d+)(?:&|$)/.exec(location.hash || '');
  const s = $('extra'), v = q ? +q[1] : 0;
  if (!(v > 0)) return;
  const step = +s.step || 5;
  s.value = String(Math.min(+s.max, Math.max(+s.min, Math.round(v / step) * step)));
}());

wireRanges(VALTEXT, calc);
measure();
setRate(20);
M.arm($('cmpHero'));
/* open at load (an amount from the link): its bars fill when it is seen, like the cards' */
if (!$('cmpBestW').hidden) M.arm($('cmpBest'));
