/* Bars that grow, and figures that count up, once, when they scroll into view.

   The home page's gap band did this inline first and this is the same contract,
   made shareable so the second and third figure to need it do not each grow
   their own copy:

     THE MARKUP CARRIES THE FINISHED PICTURE. Every bar's height is in its own
     `--h` (and `--from`, where a segment starts part of the way up), and every
     figure is written out in full. A reader with no JavaScript, or with
     reduced motion, or on a browser without IntersectionObserver, gets the
     chart as written and never sees a zero. That is why this file ARMS the
     figure (heights to nothing, figures to zero) rather than the stylesheet
     starting it empty: nothing can leave a reader looking at an empty chart
     except a script that has already decided it can fill it again.

     THE COUNT IS THE CALCULATORS' DISPLAY ENGINE. Each frame closes a fixed
     fraction of what is left, `cur += (target - cur) * 0.16`, the same easing
     the five calculators use for every figure they tween, so a number moves
     the same way everywhere on the site.

     IT RUNS ONCE. A figure that re-counts every time it scrolls past reads as
     a toy. The observer disconnects on the first hit, and a timer covers the
     band that was already past the fold when the observer attached.

   A figure opts in with data-pb-bars on its container; the numbers inside it
   are the elements carrying data-pb-count. The container is what takes the
   .pb-armed and .pb-go classes, so the CSS that animates it is the page's own.
   Figures are formatted in euro to the nearest unit, which is what every
   counted figure on the site shows. */
(function () {
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function euro(v) {
    return '€' + Math.round(v).toLocaleString('en-IE');
  }

  function drive(root) {
    var nums = [].slice.call(root.querySelectorAll('[data-pb-count]'));
    root.classList.add('pb-armed');
    nums.forEach(function (n) { n.textContent = euro(0); });

    var done = false;
    function run() {
      if (done) return;
      done = true;
      root.classList.add('pb-go');
      var anims = nums.map(function (n) {
        return { el: n, cur: 0, target: +n.getAttribute('data-pb-count') };
      });
      function step() {
        var active = false;
        anims.forEach(function (a) {
          var d = a.target - a.cur;
          /* the calculators' own stop condition: within 0.6 of the target, or
             within 0.04% of it, whichever is looser */
          if (Math.abs(d) > Math.max(0.6, Math.abs(a.target) * 0.0004)) {
            a.cur += d * 0.16;
            active = true;
          } else {
            a.cur = a.target;
          }
          a.el.textContent = euro(a.cur);
        });
        if (active) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); run(); }
      });
    }, { threshold: 0.3 });
    io.observe(root);
    /* never leave a figure at zero: a band already past the fold when the
       observer attached, or a browser that never fires it */
    setTimeout(function () {
      var r = root.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) run();
    }, 1200);
  }

  function start() {
    if (REDUCE || !('IntersectionObserver' in window) || !('requestAnimationFrame' in window)) return;
    [].slice.call(document.querySelectorAll('[data-pb-bars]')).forEach(drive);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
