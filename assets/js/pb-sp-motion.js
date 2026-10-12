/* The two State Pension pages in motion (12 October 2026, Damian's brief:
   calm and clear, never chaotic). A module of both page records in
   tools/pagebuild.py, loaded before each page's own script. It watches what
   the page scripts write and never writes a figure or a word itself.

   - Figures. When a figure changes, only the characters that changed rise
     into place. The text is never rewritten to an in-between value, so what
     a screen reader, the results bar or a test reads is always the page's.
   - The forty dots (reality check). A year that is added fills its socket,
     one after another in the order the record grows; a year taken away
     empties, from the top down. A whole change takes under half a second.
   - Bars. The first time a card comes into view its bars grow from nothing;
     after that they ease to each new width.

   Nothing overshoots, bounces, flashes or celebrates. With motion off none
   of this runs, and every rule it relies on is behind :root.pb-motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.MutationObserver) { return; }
  var calc = document.querySelector('[data-pb-calc="state-pension-reality-check"],[data-pb-calc="state-pension-entitlement"]');
  if (!calc) { return; }
  root.classList.add('pb-sp-alive');

  /* ------------------------------------------------------------ figures -- */
  function roll(el) {
    var t = el.textContent;
    if (el.getAttribute('data-roll') === t) { return; }
    var old = el.getAttribute('data-roll') || '';
    el.setAttribute('data-roll', t);
    var frag = document.createDocumentFragment(), k = 0, shift = t.length - old.length;
    t.split('').forEach(function (c, i) {
      /* a space stays a plain space: an inline-block holding one collapses */
      if (c === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
      var s = document.createElement('span');
      s.textContent = c;
      /* only the characters that changed move; the rest stand still. Aligned
         from the right, so €9.80 to €19.80 moves the one new digit. */
      if (!old || c !== old.charAt(i - shift)) {
        s.className = 'pb-roll';
        s.style.animationDelay = (k++ * 24) + 'ms';
      }
      frag.appendChild(s);
    });
    el.textContent = '';
    el.appendChild(frag);
  }
  function watchFigure(el, settled) {
    if (!el) { return; }
    /* a settled figure moves only when it changes; the headline figures
       also rise into place once as the page opens */
    if (settled) { el.setAttribute('data-roll', el.textContent); }
    new MutationObserver(function () { roll(el); })
      .observe(el, { childList: true, characterData: true, subtree: true });
  }
  ['spWeekly', 'spAnnual', 'm1Rate', 'm2Rate'].forEach(function (id) {
    watchFigure(document.getElementById(id), false);
  });
  [].forEach.call(document.querySelectorAll('#pbJarCap,.lspct,.lsmon'), function (el) { watchFigure(el, true); });

  /* --------------------------------------------------- the forty dots -- */
  var grid = document.querySelector('.pb-jar-dots');
  var dots = grid ? [].slice.call(grid.querySelectorAll('.pb-jar-dot')) : [];
  var lit = dots.map(function (d) { return d.classList.contains('pb-on'); });
  function stagger(list, most) {
    var step = list.length > 1 ? Math.min(22, most / list.length) : 0;
    list.forEach(function (i, k) { dots[i].style.setProperty('--pb-d', Math.round(k * step) + 'ms'); });
  }
  if (grid) {
    /* one callback for a whole change, however many dots it touched: the
       delays are set before the next frame, so each transition starts on its
       own beat */
    new MutationObserver(function () {
      var on = [], off = [];
      dots.forEach(function (d, i) {
        var now = d.classList.contains('pb-on');
        if (now !== lit[i]) { (now ? on : off).push(i); lit[i] = now; }
      });
      stagger(on, 420);
      stagger(off.reverse(), 300);
    }).observe(grid, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }

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
    stagger(dots.map(function (d, i) { return i; }).filter(function (i) { return lit[i]; }), 560);
  });
  reveal(document.querySelector('.vs-card'));
  reveal(document.querySelector('.bothcard'));
}());
