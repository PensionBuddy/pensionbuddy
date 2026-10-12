/* The PIA page's one comparison, played (rewritten 12 October 2026, the
   owner: "PIA needs to be simplified greatly ... motion design"). A module of
   the pia record in tools/pagebuild.py, loaded before the page's own script
   (tools/pia-parts/page.js), which paints the three bars and figures and then
   calls PBPiaMotion.update(). This file works nothing out and writes no
   figure the page did not write first.

   - The first time the bars come into view, each builds in the order the
     money arrives: your money, then the pension's tax relief, then growth;
     then its tax slides back over the end. One bar after another, calm, in
     under two and a half seconds (the timings are the MOTION block of
     tools/pia-parts/page.css). The figure above each bar counts up with it.
   - After that, a change to any input slides the bars to their new lengths
     (CSS) and each figure glides from the old number to the new.

   With motion off (no html.pb-motion) none of this runs: the bars are drawn
   at once and the figures are written as they are. If motion is switched
   off part way, everything is put straight to its end. */
(function () {
  'use strict';
  var root = document.documentElement, bars = document.getElementById('piaBars');
  if (!bars || !window.requestAnimationFrame || !window.IntersectionObserver) { return; }
  function motion() { return root.classList.contains('pb-motion'); }
  var euro = function (v) { return '€' + Math.round(v).toLocaleString('en-IE'); };
  var IDS = ['penOut', 'piaOut', 'etfOut'];
  var figs = IDS.map(function (id) { return document.getElementById(id); });
  var now = [null, null, null];      // the number each figure shows at this moment
  var tw = [null, null, null];       // a running glide: {from, to, t0, ms, delay, text}
  var played = false, raf = 0;

  function target(el) { var v = el.getAttribute('data-v'); return v ? +v : null; }
  function easeOut(u) { return 1 - Math.pow(1 - u, 3); }

  function frame(ms) {
    raf = 0;
    var busy = false;
    tw.forEach(function (t, i) {
      if (!t) { return; }
      var u = (ms - t.t0 - t.delay) / t.ms;
      if (u < 0) { busy = true; return; }
      if (u >= 1) { figs[i].textContent = t.text; now[i] = t.to; tw[i] = null; return; }
      now[i] = t.from + (t.to - t.from) * easeOut(u);
      figs[i].textContent = euro(now[i]);
      busy = true;
    });
    if (busy) { raf = requestAnimationFrame(frame); }
  }
  function glide(i, from, to, ms, delay) {
    var el = figs[i];
    if (to === null) { tw[i] = null; now[i] = null; return; }   /* "No figure yet": as the page wrote it */
    tw[i] = { from: from === null ? 0 : from, to: to, t0: performance.now(), ms: ms, delay: delay || 0, text: el.textContent };
    if (!raf) { raf = requestAnimationFrame(frame); }
  }
  function finish() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    tw.forEach(function (t, i) { if (t) { figs[i].textContent = t.text; now[i] = t.to; } });
    tw = [null, null, null];
    bars.classList.add('pia-in');
  }

  /* the page has just painted new figures */
  function update() {
    if (!played || !motion()) {
      figs.forEach(function (el, i) { now[i] = target(el); });
      return;
    }
    figs.forEach(function (el, i) {
      var to = target(el);
      if (to !== now[i] || tw[i]) { glide(i, now[i], to, 420, 0); }
    });
  }

  function play() {
    if (played) { return; }
    played = true;
    void bars.offsetWidth;            /* the armed state is the one the bars transition from */
    bars.classList.add('pia-in');
    /* each figure counts up while its bar builds and its tax comes off: the
       row's start (.14s a row) to the tax's end (1.45s + .75s) */
    figs.forEach(function (el, i) {
      var to = target(el);
      if (to === null) { return; }
      glide(i, 0, to, 2100, i * 140);   /* keeps the page's own text for the end */
      el.textContent = euro(0);
    });
  }

  window.PBPiaMotion = { update: update };
  if (!motion()) { return; }

  bars.classList.add('pia-armed');
  var io = new IntersectionObserver(function (es) {
    if (es[0].isIntersecting && es[0].intersectionRatio >= 0.3) { io.disconnect(); play(); }
  }, { threshold: [0, 0.3, 0.6] });
  io.observe(bars);

  /* motion switched off part way: straight to the end, and stay there */
  document.addEventListener('pb:motion', function (e) {
    if (e.detail && !e.detail.motion) { io.disconnect(); played = true; finish(); }
  });
}());
