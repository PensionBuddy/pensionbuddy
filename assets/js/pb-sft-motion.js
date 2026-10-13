/* The Standard Fund Threshold, in motion (12 October 2026; it replaces the
   skyline of glasses of 9 October, Damian: "calm and clear, never chaotic").
   A module of the sft record in tools/pagebuild.py. It works nothing out
   and writes no figure: the page script sizes every column and places the
   line, and the page's own drag and taps work with or without this.

   The first time "Year by year" comes into view, the columns rise from the
   floor one after another, 40ms apart, and then the line of your pensions
   settles across them. After that a column or the line only ever glides to
   its new place (page.css). With motion turned off this does nothing, and
   the columns stand at their heights from the first frame.

   13 October 2026 (Damian: "numbers that roll"). The headline figures, the
   threshold, its year and the share used, roll: when one changes, only the
   characters that changed rise into place, so 2026 to 2027 moves one digit
   and the share moves only its last. The text is never rewritten to an
   in-between value, so what a screen reader, the results bar or a test reads
   is always the page's. While a slider or the line is being dragged the
   figures simply follow, unrolled, so nothing flickers under a finger; the
   roll is for a change you make in one go: a year, a tap, a key (a key held
   down, repeating, changes the figures plainly after its first step).
   The limit bar and the lump-sum bar stay still on purpose (Run 43: they
   follow the sliders in the same frame). The line under the limit bar
   settles in softly when it turns from headroom to what is over, and the
   card that works out the tax opens and closes on its own height, last in
   the column, so nothing above it moves (page.css; 13 October 2026 review,
   SP-9). */
(function () {
  'use strict';
  var root = document.documentElement, cols = document.getElementById('sftCols');
  if (!cols || !root.classList.contains('pb-motion')) { return; }
  root.classList.add('pb-sft-alive');

  /* ------------------------------------------------------- the columns -- */
  if (window.IntersectionObserver && window.requestAnimationFrame) {
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
  }

  /* -------------------------------------------------- figures that roll -- */
  if (!window.MutationObserver) { return; }
  var held = false;   // a slider or the line is under a pointer
  document.addEventListener('pointerdown', function (e) {
    var t = e.target;
    held = !!(t && t.closest && t.closest('input[type="range"],#sftCols'));
  }, true);
  function letGo() { held = false; }
  document.addEventListener('pointerup', letGo, true);
  document.addEventListener('pointercancel', letGo, true);

  var now = function () { return window.performance && performance.now ? performance.now() : Date.now(); };
  function roll(el, last) {
    var t = el.textContent;
    if (el.getAttribute('data-roll') === t) { return; }
    var old = el.getAttribute('data-roll') || '';
    el.setAttribute('data-roll', t);
    /* and a figure that changed under a quarter of a second ago changes
       plainly, so a held arrow key reads as one steady count */
    var at = now(), quiet = at - last.t >= 250;
    last.t = at;
    if (held || !quiet || !root.classList.contains('pb-motion')) { return; }
    /* what is new is what lies between the longest common start and the
       longest common end: EUR 2,200,000 to 2,400,000 moves one digit, and
       "The threshold for 2027" to "... 2030 or later" moves only the words
       after "20" */
    var a = 0, z = 0;
    while (a < t.length && a < old.length && t.charAt(a) === old.charAt(a)) { a++; }
    while (z < t.length - a && z < old.length - a && t.charAt(t.length - 1 - z) === old.charAt(old.length - 1 - z)) { z++; }
    var frag = document.createDocumentFragment(), k = 0, word = null;
    t.split('').forEach(function (c, i) {
      /* a space stays a plain space: an inline-block holding one collapses */
      if (c === ' ') { frag.appendChild(document.createTextNode(' ')); word = null; return; }
      /* each word is one unbreakable run, so "At least EUR 2,800,000" still
         breaks at a space only, as the plain text does */
      if (!word) { word = document.createElement('span'); word.style.whiteSpace = 'nowrap'; frag.appendChild(word); }
      var s = document.createElement('span');
      s.textContent = c;
      if (!old || (i >= a && i < t.length - z)) {
        s.className = 'pb-roll';
        s.style.animationDelay = (k++ * 24) + 'ms';
      }
      word.appendChild(s);
    });
    el.textContent = '';
    el.appendChild(frag);
  }
  ['thr', 'thrL', 'shareL', 'share'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) { return; }
    el.setAttribute('data-roll', el.textContent);
    var last = { t: -1e9 };
    new MutationObserver(function () { roll(el, last); })
      .observe(el, { childList: true, characterData: true, subtree: true });
  });
}());
