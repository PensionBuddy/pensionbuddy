/* "How a call works" on the home page, settled in step by step (12 October
   2026, Damian's brief: crisp, calm, clear).

   With motion allowed, the steps are marked .pb-hc (the HOME-CALL block of
   CSS in index.html): each waits faded, a little low. As a step comes into
   view it is marked .pb-hc-on, and steps arriving together take their turn
   (--i): a dot lands under the number, the rule draws from it, the number
   turns teal, then the clip and the words rise into place. Once shown, a
   step stays shown. A step already on screen or scrolled past when this runs
   is shown at once. Nothing is stored; nothing scrolls. Without script, or
   with less motion asked for (html.pb-motion off, now or later), the steps
   simply stand. */
(function () {
  'use strict';
  var root = document.documentElement;
  var sec = document.getElementById('call'), wrap = sec && sec.querySelector('.steps');
  if (!wrap || !root.classList.contains('pb-motion') || !('IntersectionObserver' in window)) { return; }
  var steps = [].slice.call(wrap.querySelectorAll('.step'));
  if (!steps.length) { return; }
  /* the steps keep to their own build: pb-alive.js leaves them alone */
  wrap.classList.add('pb-hc', 'pb-al-skip');

  function show(list) {
    list.sort(function (a, b) { return steps.indexOf(a) - steps.indexOf(b); });
    list.forEach(function (s, i) {
      s.style.setProperty('--i', String(i));
      s.classList.add('pb-hc-on');
    });
  }

  /* on screen, or above it, already: shown together, still in turn */
  var now = steps.filter(function (s) { return s.getBoundingClientRect().top < window.innerHeight * 0.88; });
  show(now);

  var io = new IntersectionObserver(function (es) {
    var arriving = [];
    es.forEach(function (e) {
      if ((e.isIntersecting || e.boundingClientRect.top < 0) && !e.target.classList.contains('pb-hc-on')) {
        arriving.push(e.target); io.unobserve(e.target);
      }
    });
    if (arriving.length) { show(arriving); }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  steps.forEach(function (s) { if (!s.classList.contains('pb-hc-on')) { io.observe(s); } });
}());
