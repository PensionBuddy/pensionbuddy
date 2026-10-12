/* "Are you a director?" (#pbDrb), the band at the foot of the home page's
   inflation section (Run 54, Damian's brief: "in big bold writing: are you
   a director? This differs for you. Click here").

   Three coins stand side by side: blue, the company's money. The first time
   the band is seen they turn over one by one and land silver: the company's
   money becoming yours, which is the director page's whole point. They lean
   away from the pointer; moving over the band, or tapping it, sends a hop
   along them. With motion off they are drawn once, silver. No figures. */
(function () {
  'use strict';
  var band = document.getElementById('pbDrb'), K = window.PBKit, C = window.PBCoins;
  if (!band || !K || !C) { return; }
  var link = band.querySelector('.pb-drb-in'), cv = band.querySelector('.pb-drb-cv');
  var cx = cv && cv.getContext ? cv.getContext('2d') : null;
  if (!cx) { return; }
  var W = 0, H = 0, dpr = 1, r = 0, fx = new C.FX();
  var coins = [0, 1, 2].map(function (i) { return { flip: 1, kind: 'silver', delay: 0, hop: 0, vh: 0, lean: new K.Spring(0, 160, 11) }; });
  var ptr = { in: false, x: 0 };

  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    r = Math.min(H * 0.36, W / 7.2);
  }
  function at(i) { return { x: W / 2 + (i - 1) * r * 2.3, y: H * 0.56 }; }

  var raf = 0, last = 0, calm = 0, seen = false, onScreen = false;
  function kick() { calm = 0; if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    if (!W) { size(); }
    if (W < 20 || H < 20) { return; }
    var moving = false;
    coins.forEach(function (c, i) {
      var p = at(i);
      c.lean.t = ptr.in ? Math.max(-1, Math.min(1, (p.x - ptr.x) / (W * 0.6))) * 0.35 : 0;
      c.lean.step(dt); if (!c.lean.done()) { moving = true; }
      if (c.delay > 0) { c.delay -= dt; moving = true; return; }
      if (c.flip < 1) {
        c.flip = Math.min(1, c.flip + dt * 3.2); moving = true;
        if (c.flip >= 0.5 && c.kind !== 'silver') { c.kind = 'silver'; c.vh = -170; fx.ring(p.x, p.y + r * 0.9, 'rgba(84,99,95,.5)', r * 0.9); }
      }
      if (c.vh || c.hop) { c.vh += 1500 * dt; c.hop += c.vh * dt; if (c.hop > 0) { c.hop = 0; c.vh = Math.abs(c.vh) > 60 ? -c.vh * 0.25 : 0; } moving = true; }
    });
    fx.step(dt); if (fx.busy()) { moving = true; }
    draw();
    calm = moving ? 0 : calm + dt;
    if (K.motion() && onScreen && !document.hidden && (calm < 0.5 || ptr.in)) { raf = requestAnimationFrame(frame); }
  }
  function draw() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    coins.forEach(function (c, i) {
      var p = at(i), fl = c.flip < 1 ? Math.max(0.04, Math.abs(Math.cos(c.flip * Math.PI))) : 1;
      var sh = cx.createRadialGradient(p.x, p.y + r * 1.05, 1, p.x, p.y + r * 1.05, r);
      sh.addColorStop(0, 'rgba(11,31,28,.14)'); sh.addColorStop(1, 'rgba(11,31,28,0)');
      cx.save(); cx.translate(p.x, p.y + r * 1.05); cx.scale(1, 0.22); cx.fillStyle = sh;
      cx.beginPath(); cx.arc(0, 0, r, 0, Math.PI * 2); cx.fill(); cx.restore();
      C.face(cx, p.x, p.y + c.hop, r, c.kind, c.lean.x, 1, fl);
    });
    fx.draw(cx);
  }
  function wave() {
    if (!K.motion()) { return; }
    coins.forEach(function (c, i) { setTimeout(function () { if (!c.vh && !c.hop) { c.vh = -150; } kick(); }, i * 70); });
  }

  link.addEventListener('pointermove', function (e) { var b = cv.getBoundingClientRect(); ptr.x = e.clientX - b.left; if (!ptr.in) { ptr.in = true; wave(); } kick(); });
  link.addEventListener('pointerleave', function () { ptr.in = false; kick(); });
  link.addEventListener('pointerdown', wave);
  window.addEventListener('resize', function () { W = 0; kick(); draw1(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; draw1(); }); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', function () { draw1(); kick(); });
  function draw1() { if (!W) { size(); } if (W > 20) { draw(); } }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting;
      if (onScreen && !seen) {
        seen = true;
        if (K.motion()) {
          /* the first look: the company's coins turn into yours, one by one */
          coins.forEach(function (c, i) { c.kind = 'blue'; c.flip = 0; c.delay = 0.35 + i * 0.18; });
        }
      }
      if (onScreen) { kick(); draw1(); }
    }, { threshold: 0.6 }).observe(cv);
  } else { onScreen = true; draw1(); }
  draw1();
}());
