/* Bars that grow, and figures that count up, once, when they scroll into view.

   The home page's gap band did this inline first and this is the same contract,
   made shareable so the second and third figure to need it do not each grow
   their own copy:

     THE MARKUP CARRIES THE FINISHED PICTURE. Every bar's height or width is in
     its own `--h` (and `--from`, where a segment starts part of the way up),
     and every figure is written out in full. A reader with no JavaScript, or
     with reduced motion, or on a browser without IntersectionObserver, gets
     the chart as written and never sees a zero. That is why this file ARMS the
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

   window.PBBars exposes the same two pieces to a page that has its own figures
   to drive, so the easing and the once-on-scroll rule live here and not in
   three page scripts: countTo(el, target, fmt) retargets a running count the
   way the calculators' tween() does, and whenSeen(el, fn) runs fn the first
   time el is on screen. A page that uses them is responsible for its own
   static fallback, exactly as above. */
(function (root) {
  var REDUCE = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LIVE = !REDUCE && ('IntersectionObserver' in root) && ('requestAnimationFrame' in root);

  function euro(v) {
    return '€' + Math.round(v).toLocaleString('en-IE');
  }

  /* One record per element, so a second call while a count is still running
     retargets it rather than starting a second loop against the first. */
  var anims = [];
  var rafId = null;

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
      a.el.textContent = a.fmt(a.cur);
    });
    rafId = active ? requestAnimationFrame(step) : null;
  }

  function countTo(el, target, fmt, from) {
    var rec = null;
    for (var i = 0; i < anims.length; i++) if (anims[i].el === el) rec = anims[i];
    if (!rec) {
      rec = { el: el, cur: typeof from === 'number' ? from : target, fmt: fmt || euro };
      anims.push(rec);
    }
    rec.target = target;
    if (fmt) rec.fmt = fmt;
    if (typeof from === 'number') rec.cur = from;
    if (!LIVE) {
      rec.cur = target;
      rec.el.textContent = rec.fmt(target);
      return;
    }
    if (!rafId) rafId = requestAnimationFrame(step);
  }

  function whenSeen(el, fn) {
    if (!LIVE) return;
    var done = false;
    function go() { if (!done) { done = true; fn(); } }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); go(); } });
    }, { threshold: 0.3 });
    io.observe(el);
    /* never leave a figure at zero: a band already past the fold when the
       observer attached, or a browser that never fires it */
    setTimeout(function () {
      var r = el.getBoundingClientRect();
      if (r.top < root.innerHeight && r.bottom > 0) go();
    }, 1200);
  }

  function drive(el) {
    var nums = [].slice.call(el.querySelectorAll('[data-pb-count]'));
    el.classList.add('pb-armed');
    nums.forEach(function (n) { n.textContent = euro(0); });
    whenSeen(el, function () {
      el.classList.add('pb-go');
      nums.forEach(function (n) { countTo(n, +n.getAttribute('data-pb-count'), euro, 0); });
    });
  }

  function start() {
    if (!LIVE) return;
    [].slice.call(document.querySelectorAll('[data-pb-bars]')).forEach(drive);
  }

  root.PBBars = { countTo: countTo, whenSeen: whenSeen, euro: euro, live: LIVE };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
