/* Three small moments (9 October 2026, Damian's brief), each on its page:

     booking.html    under "Free. 20 minutes.", a clock whose hand sweeps
                     out twenty minutes; tap it and it sweeps again
     thank-you.html  "booked in": once the tick has drawn itself, paws and
                     coins burst out of it, once
     404.html        a trail of paw prints walks from Buddy to the button
                     back to the homepage; point at Buddy and it walks again

   Nothing here touches the calendar, the page's text or its links. With
   motion turned off none of this runs. */
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

  /* --------------------------------------------- thank you: booked in -- */
  var ok = document.querySelector('.lead h1 .pb-ok-tick');
  if (ok) {
    setTimeout(function () {
      var r = ok.getBoundingClientRect();
      if (window.PBAlive && r.width && r.bottom > 0 && r.top < innerHeight) { window.PBAlive.confetti(r.left + r.width / 2, r.top + r.height / 2, 46, 780); }
    }, 800);
  }

  /* --------------------------------------------- 404: follow the paws -- */
  var nf = document.querySelector('.pb-nf'), buddy = nf && nf.querySelector('.pb-nf-buddy'), home = nf && nf.querySelector('a.btn');
  if (nf && buddy && home) {
    /* behind the page's words: its own stacking context, the trail at the back of it */
    if (getComputedStyle(nf).position === 'static') { nf.style.position = 'relative'; }
    nf.style.isolation = 'isolate';
    var trail = canvas('position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:-1');
    nf.insertBefore(trail, nf.firstChild);
    var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
    var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
    var walks = 0, start = 0, going = 0;
    var step = function (ms) {
      going = 0; if (!PAD) { return; }
      var C = fit(trail), cx = C.cx, nb = nf.getBoundingClientRect(), b = buddy.getBoundingClientRect(), h = home.getBoundingClientRect();
      var p0 = [b.left + b.width * 0.75 - nb.left, b.bottom - nb.top - 6], p2 = [h.left - nb.left - 18, h.top + h.height / 2 - nb.top], p1 = [p0[0] + 140, (p0[1] + p2[1]) / 2 - 30];
      var t = ms / 1000 - start, n = 12, alive = false;
      cx.clearRect(0, 0, C.W, C.H);
      for (var i = 0; i < n; i++) {
        var born = i * 0.16, age = t - born; if (age < 0) { alive = true; continue; }
        var u = i / (n - 1), v = 1 - u, x = v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], y = v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1];
        var u2 = Math.min(1, u + 0.02), v2 = 1 - u2, dx = (v2 * v2 * p0[0] + 2 * v2 * u2 * p1[0] + u2 * u2 * p2[0]) - x, dy = (v2 * v2 * p0[1] + 2 * v2 * u2 * p1[1] + u2 * u2 * p2[1]) - y;
        var ang = Math.atan2(dy, dx) + Math.PI / 2, side = i % 2 ? 7 : -7, alpha = clamp(age / 0.2, 0, 1) * clamp(1 - (age - 1.8) / 0.8, 0, 1) * 0.55;
        if (alpha > 0) { alive = true; } else if (age < 1.8) { alive = true; }
        cx.save(); cx.globalAlpha = alpha; cx.fillStyle = '#14CBB1'; cx.translate(x + Math.cos(ang) * side, y + Math.sin(ang) * side); cx.rotate(ang); cx.scale(0.3, 0.3); cx.translate(-32, -36);
        TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); }); cx.fill(PAD); cx.restore();
      }
      if (alive) { going = requestAnimationFrame(step); }
      else if (++walks < 3) { start = ms / 1000 + 0.6; going = requestAnimationFrame(step); }
    };
    var walk = function () { if (going) { return; } walks = 0; start = performance.now() / 1000 + 0.3; going = requestAnimationFrame(step); };
    buddy.addEventListener('pointerenter', walk);
    buddy.style.transition = 'transform .35s cubic-bezier(.2,1.6,.4,1)';
    buddy.addEventListener('pointerenter', function () { buddy.style.transform = 'rotate(-8deg) scale(1.06)'; });
    buddy.addEventListener('pointerleave', function () { buddy.style.transform = ''; });
    setTimeout(walk, 700);
  }
}());
