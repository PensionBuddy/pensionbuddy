/* All your pensions in one view, in motion (12 October 2026; it replaces the
   floating pots of 8 October, Damian: "calm and clear, never chaotic"). A
   module of the pots record in tools/pagebuild.py, loaded before the page's
   own script. It works nothing out: the page script decides every arc's
   length and start from assets/js/pots.js and hands them here.

   Each pension is an arc of the ring. Type a value and the arcs glide to
   their new shares together, in the house curve; the first pension sweeps
   round from nothing; a pension removed folds away. The total in the middle
   counts in step (the page script). With motion turned off this defines
   nothing, and the page draws the arcs where they belong. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  var NS = 'http://www.w3.org/2000/svg', cur = {}, raf = 0, C = 1, D = 480;
  function ease(k) { return 1 - Math.pow(1 - k, 4); }
  function make(g, row) {
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', 'pt-seg');
    c.setAttribute('cx', 60); c.setAttribute('cy', 60); c.setAttribute('r', 48);
    c.setAttribute('data-row', row);
    g.appendChild(c);
    return c;
  }
  function put(a) {
    a.el.setAttribute('stroke-dasharray', Math.max(0, a.len).toFixed(2) + ' ' + C.toFixed(2));
    a.el.setAttribute('stroke-dashoffset', a.off.toFixed(2));
  }
  function step(t) {
    raf = 0;
    var busy = false;
    Object.keys(cur).forEach(function (k) {
      var a = cur[k], p = Math.min(1, (t - a.t0) / D), e = ease(p);
      a.len = a.from.len + (a.to.len - a.from.len) * e;
      a.off = a.from.off + (a.to.off - a.from.off) * e;
      put(a);
      if (p < 1) { busy = true; }
      else if (a.gone) { if (a.el.parentNode) { a.el.parentNode.removeChild(a.el); } delete cur[k]; }
    });
    if (busy) { raf = requestAnimationFrame(step); }
  }
  window.PBPotsRing = function (g, want, circ) {
    var now = performance.now(), seen = {};
    C = circ;
    /* the page's arcs from a static draw, if any, give way to these */
    [].forEach.call(g.querySelectorAll('.pt-seg'), function (c) {
      var k = c.getAttribute('data-row');
      if (!cur[k] || cur[k].el !== c) { c.parentNode.removeChild(c); }
    });
    want.forEach(function (w) {
      var a = cur[w.row];
      if (!a) { a = cur[w.row] = { el: make(g, w.row), len: 0, off: w.off }; }
      a.from = { len: a.len, off: a.off };
      a.to = { len: w.len, off: w.off };
      a.t0 = now; a.gone = false;
      a.el.style.setProperty('--o', w.o);
      seen[w.row] = 1;
    });
    Object.keys(cur).forEach(function (k) {
      if (seen[k]) { return; }
      var a = cur[k];
      a.from = { len: a.len, off: a.off }; a.to = { len: 0, off: a.off }; a.t0 = now; a.gone = true;
    });
    if (!raf) { raf = requestAnimationFrame(step); }
  };
}());
