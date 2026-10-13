/* The pension charges calculator, in motion (12 October 2026; it replaces
   the leaking jars of 9 October, Damian: "calm and clear, never chaotic";
   13 October 2026: the two figures roll). A module of the fees record in
   tools/pagebuild.py, loaded before the page's script. It works nothing out
   and writes no figure the page did not hand it.

   - The chart. The first time "How your pot could grow" comes into view, it
     unrolls from now to retirement: the three lines and the coral area
     between them are revealed left to right together, once, in the house
     curve. After that the chart follows the sliders at once, as the page
     draws it; nothing on it animates on input, so a drag is never behind
     the hand.
   - The figures. PBFeeMotion.figure(el, value) is how the page writes its
     two pots: each rolls from the number it shows to the new one, quick
     and settling (an ease-out quart), and a newer value takes over from
     wherever the roll has got to. On the page's first paint, and with
     motion off, it simply writes the value.

   Web Animations on the chart's <svg> and requestAnimationFrame for the
   figures, so no rule in the page holds a transition or an animation name.
   With motion turned off this does nothing at all. */
(function () {
  'use strict';
  var root = document.documentElement;
  function motion() { return root.classList.contains('pb-motion'); }
  var euro = function (v) { return '€' + Math.round(v).toLocaleString('en-IE'); };

  /* ---- the two figures ---- */
  var rolls = {}, raf = 0, MS = 460;
  function frame() {
    raf = 0;
    var busy = false, now = performance.now();
    Object.keys(rolls).forEach(function (id) {
      var r = rolls[id];
      if (r.x === r.to) { return; }
      var u = Math.min(1, (now - r.t0) / MS);
      r.x = u >= 1 ? r.to : r.from + (r.to - r.from) * (1 - Math.pow(1 - u, 4));
      r.el.textContent = euro(r.x);
      if (u < 1) { busy = true; }
    });
    if (busy) { raf = requestAnimationFrame(frame); }
  }
  function figure(el, v) {
    if (!el) { return; }
    var r = rolls[el.id];
    if (!r || !motion() || !window.requestAnimationFrame || Math.round(r.x) === Math.round(v) && r.x === r.to) {
      rolls[el.id] = { el: el, x: v, from: v, to: v, t0: 0 };
      el.textContent = euro(v);
      return;
    }
    r.from = r.x; r.to = v; r.t0 = performance.now();
    if (!raf) { raf = requestAnimationFrame(frame); }
  }
  window.PBFeeMotion = { figure: figure };
  /* motion switched off part way: every figure straight to its value */
  document.addEventListener('pb:motion', function (e) {
    if (e.detail && !e.detail.motion) {
      Object.keys(rolls).forEach(function (id) { var r = rolls[id]; r.x = r.from = r.to; r.el.textContent = euro(r.to); });
    }
  });

  /* ---- the chart, unrolled once ---- */
  if (!root.classList.contains('pb-motion') || !window.IntersectionObserver || !Element.prototype.animate) { return; }
  function arm() {
    var box = document.getElementById('feeChart');
    if (!box) { return; }
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) { return; }
      io.disconnect();
      var svg = box.querySelector('svg');
      if (!svg || !motion()) { return; }
      svg.animate([{ clipPath: 'inset(-12px 100% -12px 0)' }, { clipPath: 'inset(-12px 0% -12px 0)' }],
        { duration: 640, easing: 'cubic-bezier(.16,1,.3,1)' });
    }, { threshold: 0.45 });
    io.observe(box);
  }
  if (document.getElementById('feeChart')) { arm(); } else { document.addEventListener('DOMContentLoaded', arm); }
}());
