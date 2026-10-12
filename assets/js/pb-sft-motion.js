/* The Standard Fund Threshold, in motion (12 October 2026; it replaces the
   skyline of glasses of 9 October, Damian: "calm and clear, never chaotic").
   A module of the sft record in tools/pagebuild.py. It works nothing out
   and writes no figure: the page script sizes every column and places the
   line, and the page's own drag and taps work with or without this.

   The first time "Year by year" comes into view, the columns rise from the
   floor one after another, 40ms apart, and then the line of your pensions
   settles across them. After that a column or the line only ever glides to
   its new place (page.css). With motion turned off this does nothing, and
   the columns stand at their heights from the first frame. */
(function () {
  'use strict';
  var root = document.documentElement, cols = document.getElementById('sftCols');
  if (!cols || !root.classList.contains('pb-motion') || !window.IntersectionObserver || !window.requestAnimationFrame) { return; }
  cols.classList.add('sft-pre');
  var io = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) { return; }
    io.disconnect();
    requestAnimationFrame(function () {
      cols.classList.add('sft-rise');
      cols.classList.remove('sft-pre');
      setTimeout(function () { cols.classList.remove('sft-rise'); }, 1300);
    });
  }, { threshold: 0.4 });
  io.observe(cols);
  document.addEventListener('pb:motion', function (e) {
    if (e.detail && e.detail.motion) { return; }
    io.disconnect(); cols.classList.remove('sft-pre', 'sft-rise');
  });
}());
