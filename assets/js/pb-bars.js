/* Bars that grow once, when they arrive on screen. The figures never move.

   Run 34 (part 6b of docs/UX-MOTION-AUDIT.md) rewrote this under the motion
   rules: a figure is never shown at a value it does not have, so nothing
   counts up any more (the old count ran every euro from zero, and the page
   retargeted it on each slider move); only the bars grow, once, from empty
   to their true size.

     THE MARKUP CARRIES THE FINISHED PICTURE. Every bar's size and every
     figure are in the markup. A reader with no JavaScript, with reduced
     motion, or on a browser without IntersectionObserver gets the chart as
     written. A chart already on screen when the script runs is left as it
     is; one below the fold is armed (its bars emptied, in one frame, before
     it can be seen) and takes .pb-go on arrival, and the page's own CSS
     grows the bars on transform.

     ARRIVAL is the motion system's: the chart fully on screen, or 300ms
     after any of it first shows, whichever comes first. It runs once.

   A chart opts in with data-pb-bars on its container, which is what takes
   .pb-armed and .pb-go. window.PBBars.whenSeen(el, fn) runs fn once, on
   el's arrival, for a page with its own picture to start. */
(function (root) {
  var REDUCE = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LIVE = !REDUCE && ('IntersectionObserver' in root) && ('requestAnimationFrame' in root);

  function euro(v) {
    return '€' + Math.round(v).toLocaleString('en-IE');
  }

  function whenSeen(el, fn) {
    if (!LIVE) return;
    var done = false, t = 0, io;
    function go() { if (!done) { done = true; clearTimeout(t); io.disconnect(); fn(); } }
    io = new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1];
      if (e.intersectionRatio >= 0.99) go();
      else if (e.isIntersecting && !t) t = setTimeout(go, 300);
    }, { threshold: [0, 1] });
    io.observe(el);
  }

  function onScreen(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < root.innerHeight;
  }

  function drive(el) {
    if (onScreen(el)) return;          // already in view: it stays as written
    el.classList.add('pb-armed');
    whenSeen(el, function () { el.classList.add('pb-go'); });
  }

  function start() {
    if (!LIVE) return;
    [].slice.call(document.querySelectorAll('[data-pb-bars]')).forEach(drive);
  }

  root.PBBars = { whenSeen: whenSeen, euro: euro, live: LIVE };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
