/* The gap (#gap), 11 October 2026, Damian's brief: "make it clear: here's the
   bare minimum, here's the State Pension, here's the gap. Fewer options."

   Three ways of life (the Pensions Council's Modest, Moderate and
   Comfortable) and Single or Couple, beside each other. Two bars: what that
   life costs a year, and what the State Pension pays (two State Pensions at
   the maximum for a couple, the report's own basis). The gap sits on top of
   the State's bar in blush coral, its figure above it; when the State
   Pension covers the life, there is no coral and the chart says "Covered".
   "Where the money goes" opens the month, category by category.

   Motion: the bars grow on springs the first time they are seen and spring
   to every new answer; the figures roll like an odometer; the pill slides to
   the pressed answer; the gap's stripes drift. With motion off every figure
   simply changes. The markup is the finished picture for Modest, one person.

   Figures: assets/js/living-standards.js and state-pension.js only. */
(function () {
  'use strict';
  var sec = document.getElementById('gap'), K = window.PBKit, LS = window.PBLivingStandards, SP = window.PBStatePension;
  if (!sec || !K || !LS) { return; }
  var chart = document.getElementById('pbG2Chart'), pick = document.getElementById('pbG2Pick');
  if (!chart || !pick) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var needBar = chart.querySelector('.pb-g2-need .pb-g2-bar'), stBar = chart.querySelector('.pb-g2-state .pb-g2-bar');
  var gapBlk = chart.querySelector('.pb-g2-gapblk'), gapN = chart.querySelector('.pb-g2-gn');
  var needL = chart.querySelector('.pb-g2-need .pb-g2-l'), stL = chart.querySelector('.pb-g2-state .pb-g2-l');
  var fmt = K.fmt;
  var ONE = SP ? SP.MAX_WEEKLY_CENTS * SP.WEEKS_PER_YEAR / 100 : 15563.6;
  function statePension(hh) { return Math.round((hh === 'couple' ? 2 : 1) * ONE); }
  var WHAT = {
    modest: 'is the bare minimum to get by.',
    moderate: 'gives more room to manoeuvre, and more security.',
    comfortable: 'gives more freedom, and room for a few luxuries.'
  };
  var YEARS = 20;

  /* the odometers */
  var rNeed = new K.Roll(needBar.querySelector('.pb-g2-n')), rSt = new K.Roll(stBar.querySelector('.pb-g2-n'));
  var bigN = $('pbG2Big').querySelector('.pb-g2-big-n'), bigW = $('pbG2Big').querySelector('.pb-g2-big-w');
  var rBig = new K.Roll(bigN);
  gapN.innerHTML = '<b></b> <span></span>';
  var gapW = gapN.querySelector('span'), rGap = new K.Roll(gapN.querySelector('b'));

  function figures(level, hh) {
    var s = LS.standard(level, hh), st = statePension(hh), top = st;
    LS.LEVELS.forEach(function (l) { top = Math.max(top, LS.standard(l, hh).annual); });
    return { s: s, need: s.annual, st: st, gap: s.annual - st, top: top * 1.04 };
  }

  /* bar heights, as shares of the stage, on springs */
  var H = { need: new K.Spring(0, 150, 15), st: new K.Spring(0, 150, 17), gap: new K.Spring(0, 130, 14) };
  var raf = 0, last = 0, seen = false;
  function paint() {
    needBar.style.setProperty('--h', (H.need.x * 100).toFixed(3) + '%');
    stBar.style.setProperty('--h', (H.st.x * 100).toFixed(3) + '%');
    gapBlk.style.setProperty('--from', (H.st.x * 100).toFixed(3) + '%');
    gapBlk.style.setProperty('--h', (Math.max(0, H.gap.x) * 100).toFixed(3) + '%');
  }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    var busy = false;
    for (var k in H) { H[k].step(dt); if (!H[k].done()) { busy = true; } }
    paint();
    if (busy) { raf = requestAnimationFrame(frame); }
  }
  function kick() { if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }

  function update(fromUser) {
    var a = K.aim, f = figures(a.level, a.hh), two = a.hh === 'couple', lab = f.s.label;
    H.need.t = f.need / f.top; H.st.t = f.st / f.top; H.gap.t = Math.max(0, f.gap) / f.top;
    if (fromUser) { seen = true; }
    if (seen) { kick(); }
    if (!K.motion()) { for (var k in H) { H[k].x = H[k].t; } paint(); }

    rNeed.set(fmt(f.need)); rSt.set(fmt(f.st));
    needL.textContent = 'A ' + lab.toLowerCase() + ' life ' + (two ? 'for two' : 'for one') + ' costs';
    stL.textContent = two ? 'Two State Pensions pay' : 'The State Pension pays';
    $('pbG2What').innerHTML = '<b>' + lab + '</b> ' + WHAT[a.level];
    var covered = f.gap <= 0;
    chart.classList.toggle('pb-g2-covered', covered);
    sec.classList.toggle('pb-g2-is-covered', covered);
    if (covered) {
      rGap.set('✓'); gapW.textContent = 'Covered';
      rBig.set('Covered.'); bigW.textContent = '';
      $('pbG2Month').innerHTML = (two ? 'Two State Pensions at the maximum cover it' : 'The State Pension at the maximum covers it') +
        ', with <b>' + fmt(-f.gap / 12) + ' a month</b> to spare. A bigger life costs more.';
    } else {
      rGap.set(fmt(f.gap)); gapW.textContent = 'short';
      rBig.set(fmt(f.gap)); bigW.textContent = 'a year short.';
      $('pbG2Month').innerHTML = 'That is <b>' + fmt(f.gap / 12) + ' a month</b>. Over a ' + YEARS + '-year retirement, <b>' + fmt(f.gap * YEARS) + '</b>.';
    }
    chart.setAttribute('aria-label', 'Two bars. A ' + lab.toLowerCase() + ' retirement ' + (two ? 'for a couple' : 'for one person') + ' costs ' +
      Math.round(f.need).toLocaleString('en-IE') + ' euro a year. ' + (two ? 'Two State Pensions at the maximum pay ' : 'The State Pension pays ') +
      f.st.toLocaleString('en-IE') + '. ' + (covered ? 'That is covered.' : 'The gap is ' + Math.round(f.gap).toLocaleString('en-IE') + ' a year.'));
    split();
    if (fromUser && K.motion()) {
      var big = $('pbG2Big');
      big.classList.remove('pb-g2-thud'); void big.offsetWidth; big.classList.add(covered ? 'pb-g2-yay' : 'pb-g2-thud');
      gapBlk.classList.remove('pb-g2-wob'); void gapBlk.offsetWidth; gapBlk.classList.add('pb-g2-wob');
    }
  }

  /* where the money goes: the month, category by category */
  var more = $('pbG2More'), box = $('pbG2Split');
  function split() {
    if (!box) { return; }
    var a = K.aim, s = LS.standard(a.level, a.hh), top = 0;
    s.categories.forEach(function (c) { top = Math.max(top, c.monthly); });
    box.innerHTML = '<p class="pb-g2-split-h">' + s.label + ', ' + (a.hh === 'couple' ? 'for two' : 'for one') + ': <b>' + fmt(s.monthly) + ' a month</b></p>' +
      '<ul class="pb-g2-rows">' + s.categories.map(function (c, i) {
        return '<li style="--i:' + i + '"><span>' + c.label + '</span><i style="--w:' + (c.monthly / top * 100).toFixed(2) + '%" aria-hidden="true"></i><b>' + fmt(c.monthly) + '</b></li>';
      }).join('') + '</ul>' +
      '<p class="pb-src">National averages at 2024 prices, not a budget for you. Housing costs are included.</p>';
  }
  if (more && box) {
    more.hidden = false;
    more.addEventListener('click', function () {
      var open = more.getAttribute('aria-expanded') !== 'true';
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
      box.hidden = !open;
      if (open && K.motion()) { box.classList.remove('pb-g2-pour'); void box.offsetWidth; box.classList.add('pb-g2-pour'); }
    });
  }

  /* the two rows of answers */
  var lv = K.seg(pick.querySelector('.pb-g2-lv'), function (b) { K.setAim(b.getAttribute('data-level'), K.aim.hh, 'gap'); });
  var hh = K.seg(pick.querySelector('.pb-g2-hh'), function (b) { K.setAim(K.aim.level, b.getAttribute('data-hh'), 'gap'); });
  document.addEventListener('pb:aim', function (e) {
    var d = e.detail || {};
    lv.press(function (b) { return b.getAttribute('data-level') === d.level; }, d.by === 'gap');
    hh.press(function (b) { return b.getAttribute('data-hh') === d.hh; }, d.by === 'gap');
    update(true);
  });
  pick.hidden = false;
  lv.place(true); hh.place(true);
  update(false);

  /* the first look: the bars grow from nothing when the chart comes into view;
     a chart already on screen when the page settles stays as it is */
  function inView() { var r = chart.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }
  function grow() { if (seen) { return; } seen = true; for (var k in H) { H[k].x = 0; H[k].v = 0; } paint(); setTimeout(kick, 60); }
  if (!K.motion() || !('IntersectionObserver' in window)) { seen = true; for (var k0 in H) { H[k0].x = H[k0].t; } paint(); return; }
  function arm() {
    if (inView()) { seen = true; for (var k1 in H) { H[k1].x = H[k1].t; } paint(); return; }
    for (var k2 in H) { H[k2].x = 0; } paint();
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); grow(); } }); }, { threshold: 0.35 });
    io.observe(chart);
    setTimeout(function () { if (!seen && inView()) { grow(); } }, 1500);
  }
  if (document.readyState === 'complete') { requestAnimationFrame(arm); } else { addEventListener('load', function () { requestAnimationFrame(arm); }); }
}());
