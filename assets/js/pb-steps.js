/* STEPS (assets/js/pb-steps.js): a row of numbered steps that plays as a
   journey. Used by the "How it works" rows on tracker.html and starter.html,
   and by any <ol class="pbs" data-pb-steps> that follows the markup there.

   The markup is the finished picture: every node lit, every icon drawn,
   every connecting line full. That is what a reader gets with no script,
   with reduced motion, and in a screenshot. With motion allowed, the row is
   armed while it is off screen (each node back to an outline, its icon
   undrawn, the lines empty) and, when it comes into view, plays once:

     node 1 lights and its icon draws itself, the line runs on to node 2,
     node 2 lights, the line runs on to node 3, node 3 lights; then one dot
     travels the whole line, and each node gives a soft halo as it passes.

   About three and a half seconds in all, then it stops (nothing loops, so
   nothing needs a pause button). The words never move: only the nodes, the
   icons and the lines do. Scrolled fully out of view and back, it plays
   again. With a mouse, resting on a step replays that step's icon.
   If motion is switched off mid-play, the row settles at once. */
(function () {
  'use strict';
  var roots = document.querySelectorAll('[data-pb-steps]');
  if (!roots.length) return;
  var STEP = 640, LINK_AT = 260, RUN = 1280;

  function motionOn() { return !!(window.PBMotion && window.PBMotion.on()); }

  [].forEach.call(roots, function (root) {
    var steps = [].slice.call(root.querySelectorAll('.pbs-step'));
    if (steps.length < 2) return;
    steps.forEach(function (s, i) { s.style.setProperty('--i', i); });
    var timers = [], state = 'still', io = null;
    var STEP_CLS = ['pbs-on', 'pbs-link', 'pbs-ping'];

    function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function reset() {
      root.classList.remove('pbs-run');
      steps.forEach(function (s) { STEP_CLS.forEach(function (c) { s.classList.remove(c); }); });
    }
    /* the finished picture, as the markup has it */
    function settle() { clear(); reset(); root.classList.remove('pbs-armed'); state = 'still'; }
    /* the start state, in one frame, only ever while off screen */
    function arm() { clear(); reset(); root.classList.add('pbs-armed'); state = 'armed'; }

    function ping(s) {
      s.classList.remove('pbs-ping');
      void s.offsetWidth;   /* restart the icon's own little move */
      s.classList.add('pbs-ping');
    }

    /* where the travelling dot (the list's own ::after, so the list holds
       nothing but its steps) starts and ends: the first and last node's
       centres, measured now, so the row's layout (a row, or a column on a
       phone) never has to be guessed */
    function measure() {
      var box = root.getBoundingClientRect();
      var a = steps[0].querySelector('.pbs-node').getBoundingClientRect();
      var b = steps[steps.length - 1].querySelector('.pbs-node').getBoundingClientRect();
      var x0 = a.left + a.width / 2 - box.left, y0 = a.top + a.height / 2 - box.top;
      var x1 = b.left + b.width / 2 - box.left, y1 = b.top + b.height / 2 - box.top;
      root.style.setProperty('--pbs-x0', x0.toFixed(1) + 'px');
      root.style.setProperty('--pbs-y0', y0.toFixed(1) + 'px');
      root.style.setProperty('--pbs-x1', x1.toFixed(1) + 'px');
      root.style.setProperty('--pbs-y1', y1.toFixed(1) + 'px');
    }

    function play() {
      if (state !== 'armed') return;
      state = 'playing';
      var last = steps.length - 1;
      steps.forEach(function (s, i) {
        later(i * STEP, function () { s.classList.add('pbs-on'); ping(s); });
        if (i < last) later(i * STEP + LINK_AT, function () { s.classList.add('pbs-link'); });
      });
      var runAt = last * STEP + STEP + 160;
      later(runAt, function () {
        measure();
        root.style.setProperty('--pbs-gapms', Math.round(RUN / last) + 'ms');
        root.classList.add('pbs-run');
      });
      /* then the markup's own finished state: the same picture, nothing armed */
      later(runAt + RUN + 700, function () {
        reset();
        root.classList.remove('pbs-armed');
        state = 'done';
        if (!inView()) arm();   /* scrolled away mid-play: ready for the next look */
      });
    }

    function inView() {
      var r = root.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
    }

    function start() {
      if (!motionOn() || !('IntersectionObserver' in window) || io) return;
      /* on screen already (a reload half way down): leave it as it is, and
         play it the next time it comes into view */
      if (!inView()) arm(); else state = 'done';
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && e.intersectionRatio >= 0.3) play();
          else if (!e.isIntersecting && state === 'done') arm();
        });
      }, { threshold: [0, 0.3] });
      io.observe(root);
    }

    function stop() {
      if (io) { io.disconnect(); io = null; }
      settle();
    }

    /* resting on a step replays its icon (mouse only: a tap is a scroll) */
    if (window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches) {
      steps.forEach(function (s) {
        s.addEventListener('mouseenter', function () {
          if (motionOn() && (state === 'done' || state === 'still')) {
            ping(s);
            clearTimeout(s._pbsPing);
            s._pbsPing = setTimeout(function () { s.classList.remove('pbs-ping'); }, 1400);
          }
        });
      });
    }

    document.addEventListener('pb:motion', function (ev) {
      if (ev.detail && ev.detail.motion) start(); else stop();
    });
    start();
  });
})();
