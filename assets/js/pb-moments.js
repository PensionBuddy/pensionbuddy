/* The booking page's moment (9 October 2026, Damian's brief): under "Free.
   20 minutes.", a clock whose hand sweeps out twenty minutes; tap it and it
   sweeps again. Nothing here touches the calendar, the page's text or its
   links. (The thank-you page's party is assets/js/pb-thanks.js, the 404's
   lost paw assets/js/pb-404.js.) With motion turned off none of this runs. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function ease(u) { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); }
  function canvas(style) { var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); cv.style.cssText = style; return cv; }
  function fit(cv) { var b = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(b.width * d); cv.height = Math.round(b.height * d); var cx = cv.getContext('2d'); cx.setTransform(d, 0, 0, d, 0, 0); return { cx: cx, W: b.width, H: b.height }; }

  /* ------------------------------------------- booking: twenty minutes -- */
  var sub = document.querySelector('#calStage') && document.querySelector('.lead .sub');
  if (sub) {
    var clock = canvas('display:block;width:132px;height:132px;margin:18px 0 6px;cursor:pointer');
    sub.parentNode.insertBefore(clock, sub.nextSibling);
    var t0 = 0, run = 0;
    var tick = function (ms) {
      run = 0; var C = fit(clock), cx = C.cx, r = C.W / 2 - 6, x = C.W / 2, y = C.H / 2, u = ease((ms / 1000 - t0) / 1.6), a = -Math.PI / 2;
      cx.clearRect(0, 0, C.W, C.H);
      cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = '#0B1F1C'; cx.stroke();
      /* twenty minutes: a third of the face */
      cx.beginPath(); cx.moveTo(x, y); cx.arc(x, y, r - 8, a, a + Math.PI * 2 / 3 * u); cx.closePath(); cx.fillStyle = 'rgba(20,203,177,.35)'; cx.fill();
      for (var i = 0; i < 12; i++) { var q = i / 12 * Math.PI * 2; cx.beginPath(); cx.moveTo(x + Math.cos(q) * (r - 4), y + Math.sin(q) * (r - 4)); cx.lineTo(x + Math.cos(q) * (r - (i % 3 ? 9 : 13)), y + Math.sin(q) * (r - (i % 3 ? 9 : 13))); cx.lineWidth = i % 3 ? 2 : 3; cx.stroke(); }
      var h = a + Math.PI * 2 / 3 * u + Math.sin(ms / 1000 * 18) * 0.02 * (1 - u);
      cx.lineCap = 'round'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(h) * (r - 14), y + Math.sin(h) * (r - 14)); cx.stroke();
      cx.lineWidth = 5; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(-Math.PI / 2 + Math.PI / 6 * 0.1) * (r * 0.45), y + Math.sin(-Math.PI / 2 + Math.PI / 6 * 0.1) * (r * 0.45)); cx.stroke();
      cx.beginPath(); cx.arc(x, y, 7, 0, Math.PI * 2); cx.fillStyle = '#14CBB1'; cx.fill();
      if (u < 1) { run = requestAnimationFrame(tick); }
    };
    var sweep = function () { t0 = performance.now() / 1000; if (!run) { run = requestAnimationFrame(tick); } };
    clock.addEventListener('click', sweep);
    if (window.IntersectionObserver) { var once = false; new IntersectionObserver(function (es) { if (es[0].isIntersecting && !once) { once = true; sweep(); } }).observe(clock); } else { sweep(); }
    window.addEventListener('resize', function () { if (!run) { run = requestAnimationFrame(tick); } });
  }

}());
