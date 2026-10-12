/* The auto-enrolment comparison, in motion (12 October 2026; it replaces the
   jars of 9 October, Damian: "calm and clear, never chaotic"). A module of
   the compare record in tools/pagebuild.py. It works nothing out and writes
   no figure: the page script sets every bar's width and every number.

   What it does: each card with bars waits, empty, until it comes into view,
   then its bars fill to their widths one source at a time, in the order the
   money arrives: you, then your employer, then the State or Revenue. After
   that a bar only ever glides to its new width (page.css). A card in the
   question not showing fills the first time that question is opened.

   With motion turned off this does nothing at all, and every bar is drawn
   at its width from the first frame. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.IntersectionObserver || !window.requestAnimationFrame) { return; }
  var cards = ['cmpHero1', 'cmpHero2', 'pbMyCard', 'pbMyCard2']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if (!cards.length) { return; }
  cards.forEach(function (c) { c.classList.add('cmp-pre'); });
  function fill(c) {
    requestAnimationFrame(function () {
      c.classList.add('cmp-intro');
      c.classList.remove('cmp-pre');
      setTimeout(function () { c.classList.remove('cmp-intro'); }, 1300);
    });
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) { return; }
      io.unobserve(e.target);
      fill(e.target);
    });
  }, { threshold: 0.3 });
  cards.forEach(function (c) { io.observe(c); });
  /* motion turned off mid-visit: let every bar stand at its width */
  document.addEventListener('pb:motion', function (e) {
    if (e.detail && e.detail.motion) { return; }
    cards.forEach(function (c) { io.unobserve(c); c.classList.remove('cmp-pre', 'cmp-intro'); });
  });
}());
