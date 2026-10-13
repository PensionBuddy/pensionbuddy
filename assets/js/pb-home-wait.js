/* The cost of waiting (#wait), 13 October 2026, Damian's brief: "the clearest
   pain on the page. Simple, visual, animated: start now against wait five
   years, the same monthly amount as the calculator above, the money lost in a
   big rolling figure, two bars growing to their values. Future euros."

   The reader's plan is the calculator's (PBKit.plan, 'pb:plan'): their age,
   what is saved, and what goes in each month, theirs and their employer's,
   the same growth (6% a year before charges, PBAssume.assets.cap). The slider
   is the years they wait, from 1 to 20, and never past 65.
     Start now   what is saved, grown to 66, plus the monthly amount from now:
                 the calculator's own pot
     Wait        the same, with the monthly amount from the later age
     The cost    the difference: the payments not made, and their growth
   The sums are assets/js/cost-of-waiting.js (PBWaiting.costOfWaiting for the
   payments, PBWaiting.project for what is saved: it grows either way, so it
   sits in both bars and never in the cost). Catching up is what the later
   start would need each month to reach the same pot (catchUpMonthly).

   Motion (html.pb-motion only; .pb-w2-armed is set here, so without this
   script the bars simply stand at the markup's values): as the bars come
   into view they grow to their values, the later one a beat behind, then the
   hatch fills the gap and the bracket draws under it; the three figures
   roll up from nought, digit by digit. After that the slider moves the bars
   on a spring and the figures roll to their new values. Nothing moves in
   the layout: the bars scale, the figures roll in boxes that keep their
   size. */
(function () {
  'use strict';
  var sec = document.getElementById('wait'), K = window.PBKit, W = window.PBWaiting;
  if (!sec || !K || !W) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var yrs = $('pbW2Yrs');
  if (!yrs) { return; }
  var PA = window.PBAssume, G = ((PA && PA.assets && PA.assets.cap) || 0.06) * 100, AT = W.PENSION_AGE, fmt = K.fmt;
  var big = $('pbW2Lost'), rLost = new K.Roll(big), rNow = new K.Roll($('pbW2Now')), rLater = new K.Roll($('pbW2Later'));
  var row = $('pbW2LaterRow'), card = sec.querySelector('.pb-w2-card');

  function plan() {
    var p = K.plan || {}, m = (+p.mine || 0) + (+p.emp || 0);
    return { age: +p.age || 35, monthly: m > 0 ? m : 100, saved: +p.saved || 0, own: m > 0 };
  }
  function years(n) { return n + (n === 1 ? ' year' : ' years'); }
  /* the wait the reader picked: only the slider sets it. An age near 66 holds the slider to the
     years left, for now; a younger age gives the reader's own wait back */
  var chosen = +yrs.value || 5;
  function paint() {
    var p = plan(), max = Math.max(1, Math.min(20, AT - 1 - p.age));
    if (+yrs.max !== max) { yrs.max = max; }
    var w = Math.max(1, Math.min(max, chosen));
    if (+yrs.value !== w) { yrs.value = w; }
    var c = W.costOfWaiting({ age: p.age, wait: w, monthly: p.monthly, growth: G });
    var kept = W.project((AT - p.age) * 12, p.saved, 0, W.monthlyRate(G));
    var now = kept + c.now, then = kept + c.later;
    yrs.style.setProperty('--fill', ((w - yrs.min) / (yrs.max - yrs.min || 1) * 100) + '%');
    yrs.setAttribute('aria-valuetext', years(w));
    $('pbW2YrsV').textContent = w;
    $('pbW2M').textContent = fmt(p.monthly) + ' a month';
    /* nothing going in above: an example amount, said as one */
    $('pbW2Same').textContent = p.own ? 'Same' : 'Say';
    $('pbW2Age').textContent = p.age;
    $('pbW2K').textContent = 'Wait ' + years(w) + ' and you have';
    var lost = fmt(c.less);
    big.parentNode.style.setProperty('--len', lost.length);
    rLost.set(lost); rNow.set(fmt(now)); rLater.set(fmt(then));
    $('pbW2NowL').textContent = 'Start now, at ' + p.age;
    $('pbW2LaterL').textContent = c.tooLate ? 'Wait ' + years(w) + ': no time left to pay in' : 'Wait ' + years(w) + ', start at ' + c.startLater;
    row.style.setProperty('--w', (now > 0 ? Math.max(0, then / now) : 0).toFixed(4));
    $('pbW2Less').textContent = lost + ' less';
    $('pbW2Catch').innerHTML = c.tooLate ? 'Start at ' + AT + ' and there is no time left to catch up.'
      : 'To catch up from ' + c.startLater + ': <b>' + fmt(c.catchUpMonthly) + ' a month</b>, not ' + fmt(p.monthly) + '.';
  }

  /* the figures roll up from nought: each digit's column back to 0, then on to its place, the
     right-hand digits first, as an odometer turns */
  function spin(el, delay) {
    var cols = [].slice.call(el.querySelectorAll('.pb-odo-s')), n = cols.length;
    cols.forEach(function (s, i) {
      var to = s.style.transform;
      s.style.transition = 'none'; s.style.transform = 'translateY(0)';
      void s.offsetHeight;
      s.style.transition = 'transform 1.9s cubic-bezier(.35,.05,.15,1) ' + (delay + (n - 1 - i) * 70) + 'ms';
      s.style.transform = to;
    });
    setTimeout(function () { cols.forEach(function (s) { s.style.transition = ''; }); }, delay + 2000 + n * 70);
  }

  yrs.addEventListener('input', function () { chosen = +yrs.value; paint(); });
  document.addEventListener('pb:plan', paint);
  $('pbW2Ctl').hidden = false;
  paint();

  if (!K.motion() || !('IntersectionObserver' in window)) { return; }
  card.classList.add('pb-w2-armed');
  var io = new IntersectionObserver(function (es) {
    if (!es[es.length - 1].isIntersecting) { return; }
    io.disconnect();
    card.classList.add('pb-w2-go');
    spin($('pbW2Now'), 0); spin($('pbW2Later'), 200); spin(big, 120);
    setTimeout(function () { card.classList.add('pb-w2-live'); }, 2600);
  }, { threshold: 0.4 });
  io.observe(sec.querySelector('.pb-w2-chart'));
  /* reduced motion turned on part way: everything simply stands */
  document.addEventListener('pb:motion', function () { if (!K.motion()) { io.disconnect(); card.classList.add('pb-w2-go', 'pb-w2-live'); } });
}());
