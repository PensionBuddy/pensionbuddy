/* The little script the MOTION block depends on (Run 32, docs/UX-MOTION-AUDIT.md,
   part 2a). Every root page loads it at the foot of <body>, once.

   html.pb-motion is set before anything paints, by one line in <head>
   placed directly after the viewport meta, and only when motion is allowed:
     if(matchMedia('(prefers-reduced-motion: no-preference)').matches&&'IntersectionObserver' in window)document.documentElement.classList.add('pb-motion');
   This file keeps it true while the page is open:

   - Live reduced motion. A reader who turns on reduced motion with the page
     open gets it at once: html.pb-motion and html.pb-smooth come off, so
     everything the MOTION block gates on them stops, and anything waiting
     for it is told through the 'pb:motion' event (detail { motion: false }).
   - Smooth scrolling only for in-page taps, never on arrival. html.pb-smooth
     is added once the page has loaded and has arrived where it was going
     (the MOTION block turns it into scroll-behavior:smooth), so a link to
     index.html#gap or a glossary term lands at once, and a tap on an in-page
     link afterwards still glides.

   PBMotion.on() says whether motion is allowed right now. */
(function () {
  'use strict';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function allowed() { return !(mq && mq.matches); }

  function sync() {
    var on = allowed() && ('IntersectionObserver' in window);
    root.classList.toggle('pb-motion', on);
    if (!on) root.classList.remove('pb-smooth');
    try { document.dispatchEvent(new CustomEvent('pb:motion', { detail: { motion: on } })); } catch (e) {}
  }

  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else if (mq.addListener) mq.addListener(sync);
  }

  function smooth() { if (allowed()) root.classList.add('pb-smooth'); }
  if (document.readyState === 'complete') setTimeout(smooth, 0);
  else window.addEventListener('load', function () { setTimeout(smooth, 0); });

  window.PBMotion = { on: function () { return root.classList.contains('pb-motion'); } };
})();
