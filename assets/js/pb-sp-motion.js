/* The two State Pension pages in motion (12 October 2026, Damian's brief:
   calm and clear, never chaotic). A module of both page records in
   tools/pagebuild.py, loaded before each page's own script. It watches what
   the page scripts write and never writes a figure or a word itself.

   - Figures. When a figure changes, only the characters that changed rise
     into place. The text is never rewritten to an in-between value, so what
     a screen reader, the results bar or a test reads is always the page's.
   - The forty dots (reality check). The first time they are seen they fill
     once, in order. After that the page script sets each change's order
     before it moves a class (paintJar in tools/state-pension-parts/page.js):
     a year added fills its socket in the order the record grows, a year
     taken away empties from the top down, all in under half a second.
   - Bars. The first time a card comes into view its bars grow from nothing;
     after that they ease to each new width.
   - The lead (13 October 2026). The figures in the answer under each
     headline roll their digits into place, over the real text.

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
  function roll(el) {
    var t = el.textContent;
    if (el.getAttribute('data-roll') === t) { return; }
    var old = el.getAttribute('data-roll') || '';
    el.setAttribute('data-roll', t);
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

  /* ------------------------------------------- the lead's figures roll -- */
  /* 13 October 2026. The answer under each page's headline: each digit of a
     figure rolls up from nought to its own value, a full turn and a bit,
     left to right, and lands. The reel is a layer laid over the real figure
     (aria-hidden), which keeps its place and its words throughout and is
     uncovered, unchanged, once the last digit has landed. */
  function odometer(el, delay) {
    var text = el.textContent;
    if (!/[0-9]/.test(text)) { return; }
    var over = document.createElement('span');
    over.className = 'pb-odo';
    over.setAttribute('aria-hidden', 'true');
    over.style.color = getComputedStyle(el).color;
    var k = 0;
    text.split('').forEach(function (c) {
      if (c < '0' || c > '9') { over.appendChild(document.createTextNode(c)); return; }
      var to = 10 + (+c), lines = [];
      for (var i = 0; i <= to; i++) { lines.push(i % 10); }
      var win = document.createElement('span'), reel = document.createElement('span');
      win.className = 'pb-odo-win';
      reel.className = 'pb-odo-reel';
      reel.textContent = lines.join('\n');
      reel.style.setProperty('--to', String(to));
      reel.style.animationDelay = (delay + k++ * 50) + 'ms';
      win.appendChild(reel);
      over.appendChild(win);
    });
    el.appendChild(over);
    el.classList.add('pb-odo-on');
    var gone = false;
    function done() {
      if (gone) { return; }
      gone = true;
      if (over.parentNode) { over.parentNode.removeChild(over); }
      el.classList.remove('pb-odo-on');
    }
    setTimeout(done, delay + k * 50 + 1300);
    document.addEventListener('pb:motion', function (e) { if (!(e.detail && e.detail.motion)) { done(); } });
  }
  /* each figure starts as its own line starts to rise (page.css staggers the
     lines), and a second figure on a line a beat after the first */
  [].forEach.call(document.querySelectorAll('.phead .sp-fig'), function (el) {
    var line = el.parentNode, rise = parseFloat(getComputedStyle(line).animationDelay) || 0;
    var nth = [].indexOf.call(line.querySelectorAll('.sp-fig'), el);
    odometer(el, Math.round(rise * 1000) + 80 + nth * 170);
  });

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
