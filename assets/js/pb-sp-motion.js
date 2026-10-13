/* The two State Pension pages in motion (12 October 2026, Damian's brief:
   calm and clear, never chaotic). A module of both page records in
   tools/pagebuild.py, loaded before each page's own script. It watches what
   the page scripts write and never writes a figure or a word itself.

   - Figures. When a figure changes in one go (a tap, a key, a typed value),
     only the characters that changed rise into place. The text is never
     rewritten to an in-between value, so what a screen reader, the results
     bar or a test reads is always the page's.
     WHILE A SLIDER OR THE DOTS ARE UNDER A POINTER the figures simply follow,
     unrolled: a roll starts each changed digit from nothing, so rolling on
     every step of a drag left the figures half blank under the reader's
     finger (13 October 2026 review, SP-1). For the same reason a figure that
     changed less than a quarter of a second ago changes plainly too, so a
     held arrow key reads as one steady count, not a flicker.
   - The forty dots (reality check). The first time they are seen they fill
     once, in order. After that the page script sets each change's order
     before it moves a class (paintJar in tools/state-pension-parts/page.js):
     a year added fills its socket in the order the record grows, a year
     taken away empties from the top down, all in under half a second.
   - Bars. The first time a card comes into view its bars grow from nothing;
     after that they ease to each new width.
   - The lead (13 October 2026). Its lines rise in after the headline's
     words (page.css); its figures are plain text from the first frame. The
     digit-by-digit roll they had until the review (SP-2) showed wrong
     amounts for over a second before the real answer, which has to be read
     at once.

   Nothing bounces, flashes or celebrates; the one overshoot is the lead's
   link, which lands on a gentle spring (page.css, 13 October 2026: Damian
   asked for "gentle springs"). With motion off none of this runs, and every
   rule it relies on is behind :root.pb-motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.MutationObserver) { return; }
  var calc = document.querySelector('[data-pb-calc="state-pension-reality-check"],[data-pb-calc="state-pension-entitlement"]');
  if (!calc) { return; }
  root.classList.add('pb-sp-alive');

  /* ------------------------------------------------------------ figures -- */
  /* a slider or the dots are under a pointer: set before the page script
     hears the press (capture phase), cleared when the pointer lets go */
  var held = false;
  document.addEventListener('pointerdown', function (e) {
    var t = e.target;
    held = !!(t && t.closest && t.closest('input[type="range"],.pb-jar-body'));
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
    /* a drag, a burst of key repeats, or motion turned off mid-visit: the
       page's own plain text stands, whole, as written */
    var at = now(), quiet = at - last.t >= 250;
    last.t = at;
    if (held || !quiet || !root.classList.contains('pb-motion')) { return; }
    var frag = document.createDocumentFragment(), k = 0, shift = t.length - old.length, word = null;
    t.split('').forEach(function (c, i) {
      /* a space stays a plain space: an inline-block holding one collapses */
      if (c === ' ') { frag.appendChild(document.createTextNode(' ')); word = null; return; }
      /* each word is one unbreakable run: a line may break at a space only,
         never between two characters of a figure */
      if (!word) { word = document.createElement('span'); word.style.whiteSpace = 'nowrap'; frag.appendChild(word); }
      var s = document.createElement('span');
      s.textContent = c;
      /* only the characters that changed move; the rest stand still. Aligned
         from the right, so €9.80 to €19.80 moves the one new digit. */
      if (!old || c !== old.charAt(i - shift)) {
        s.className = 'pb-roll';
        s.style.animationDelay = (k++ * 24) + 'ms';
      }
      word.appendChild(s);
    });
    el.textContent = '';
    el.appendChild(frag);
  }
  function watchFigure(el, settled) {
    if (!el) { return; }
    /* a settled figure moves only when it changes; the result figures also
       rise into place once, with the page's first render */
    if (settled) { el.setAttribute('data-roll', el.textContent); }
    var last = { t: -1e9 };
    new MutationObserver(function () { roll(el, last); })
      .observe(el, { childList: true, characterData: true, subtree: true });
  }
  ['spWeekly', 'spAnnual', 'm1Rate', 'm2Rate'].forEach(function (id) {
    watchFigure(document.getElementById(id), false);
  });
  [].forEach.call(document.querySelectorAll('#pbJarCap,.lspct,.lsmon'), function (el) { watchFigure(el, true); });

  /* --------------------------------------------------- the forty dots -- */
  var grid = document.querySelector('.pb-jar-dots');
  var dots = grid ? [].slice.call(grid.querySelectorAll('.pb-jar-dot')) : [];

  /* ---------------------------------------------- first sight of a card -- */
  function reveal(el, before) {
    if (!el || !('IntersectionObserver' in window)) { return; }
    el.classList.add('pb-sp-pre');
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) { return; }
      io.disconnect();
      if (before) { before(); }
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.remove('pb-sp-pre'); });
      });
    }, { threshold: 0.2 });
    io.observe(el);
  }
  /* the dots fill once, in order, the first time they are seen */
  reveal(grid && grid.closest('.pb-jar'), function () {
    var lit = dots.filter(function (d) { return d.classList.contains('pb-on'); });
    var step = lit.length > 1 ? Math.min(22, 560 / lit.length) : 0;
    lit.forEach(function (d, k) { d.style.setProperty('--pb-d', Math.round(k * step) + 'ms'); });
  });
  reveal(document.querySelector('.vs-card'));
  reveal(document.querySelector('.bothcard'));
}());
