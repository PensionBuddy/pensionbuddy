/* The pension charges calculator, in motion (12 October 2026; it replaces
   the leaking jars of 9 October, Damian: "calm and clear, never chaotic").
   A module of the fees record in tools/pagebuild.py. It works nothing out
   and writes no figure.

   The first time "How your pot could grow" comes into view, the chart
   unrolls from now to retirement: the three lines and the coral area
   between them are revealed left to right together, once, in the house
   curve. After that the chart follows the sliders at once, as the page
   draws it; nothing animates on input, so a drag is never behind the hand.

   Web Animations on the chart's <svg>, so no rule in the page holds a
   transition or an animation name. With motion turned off this does
   nothing at all. */
(function () {
  'use strict';
  var root = document.documentElement, box = document.getElementById('feeChart');
  if (!box || !root.classList.contains('pb-motion') || !window.IntersectionObserver || !Element.prototype.animate) { return; }
  var io = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) { return; }
    io.disconnect();
    var svg = box.querySelector('svg');
    if (!svg || !root.classList.contains('pb-motion')) { return; }
    svg.animate([{ clipPath: 'inset(-12px 100% -12px 0)' }, { clipPath: 'inset(-12px 0% -12px 0)' }],
      { duration: 640, easing: 'cubic-bezier(.16,1,.3,1)' });
  }, { threshold: 0.45 });
  io.observe(box);
}());
