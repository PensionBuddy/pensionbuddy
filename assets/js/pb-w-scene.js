/* The welcome band's picture (11 October 2026, Damian's brief: "get rid of
   'Pensions, in plain English'; just have a motion design image").

   Buddy's run to 66. A road from 25 to 66 with the ages on it, and a jar at
   the end. Buddy (the games' own pixel Buddy, games/buddy-sprites.js) runs
   along it; as he passes each age a coin jumps out of the ground and drops
   into the jar: slate for what you put in, amber for what Revenue adds. At
   66 he celebrates beside a full jar, then the road starts again. Tap the
   picture and he jumps, and a bonus coin flies in.

   A picture: no figure, no words beyond the ages, aria-hidden. With motion
   off it is drawn once: Buddy sitting beside a full jar at 66. */
(function () {
  'use strict';
  var box = document.querySelector('.pb-w-scene'), cv = box && box.querySelector('canvas');
  var SPR = window.PBSprites;
  if (!cv || !cv.getContext || !SPR || !SPR.buddy) { return; }
  var cx = cv.getContext('2d'), root = document.documentElement;
  function motion() { return root.classList.contains('pb-motion'); }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  var AGES = [25, 35, 45, 55, 66], LOOP = 7.2, RUN = 5.2;
  var W = 0, H = 0, dpr = 1, sc = 3;
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    sc = W < 420 ? 2 : 3;
  }
  function geo() {
    var ground = H - 24, x0 = Math.max(W * 0.06, SPR.buddy.w * sc * 0.62 + 4), jarW = W < 420 ? 40 : 54, jarH = W < 420 ? 50 : 66, jarX = W - jarW - W * 0.04, x1 = jarX - 18;
    return { ground: ground, x0: x0, x1: x1, jarX: jarX, jarW: jarW, jarH: jarH };
  }
  function ageX(g, a) { return g.x0 + (g.x1 - g.x0) * (a - 25) / (66 - 25); }

  var bxNow = 0, coins = [], sparks = [], level = { x: 0, v: 0, t: 0 }, jump = { y: 0, v: 0 }, lastLoop = -1, passed = 0, t0 = 0, last = 0;
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function coin(x, y, amber, s) {
    cx.save(); cx.translate(x, y); cx.scale(s, 1);
    cx.beginPath(); cx.arc(0, 0, 7, 0, Math.PI * 2); cx.fillStyle = amber ? '#F4B740' : '#586B85'; cx.fill();
    cx.lineWidth = 1.4; cx.strokeStyle = amber ? '#B9852A' : '#3D4B60'; cx.stroke();
    cx.beginPath(); cx.arc(0, 0, 3.6, 0, Math.PI * 2); cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.stroke();
    cx.restore();
  }
  function launch(g, x, amber) {
    /* a ballistic arc from the ground to the jar's mouth, in 0.8 s */
    var T = 0.8, tx = g.jarX + g.jarW / 2, ty = g.ground - g.jarH - 4, gr = 900;
    coins.push({ x: x, y: g.ground - 6, vx: (tx - x) / T, vy: (ty - (g.ground - 6) - 0.5 * gr * T * T) / T, g: gr, t: 0, T: T, amber: amber, spin: Math.random() * 6 });
  }

  function draw(now, dt) {
    var g = geo();
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var still = !motion();
    var t = still ? RUN + 0.6 : (now - t0) % LOOP, loop = Math.floor((now - t0) / LOOP);
    if (!still && loop !== lastLoop) { lastLoop = loop; passed = 0; level.t = 0; coins = []; }
    var run = clamp(t / RUN, 0, 1), e = run < 0.5 ? 2 * run * run : 1 - Math.pow(-2 * run + 2, 2) / 2;
    var bx = g.x0 + (g.x1 - g.x0) * (still ? 1 : e);
    bxNow = bx;

    /* the road and its ages */
    cx.strokeStyle = 'rgba(11,31,28,.18)'; cx.lineWidth = 3; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(g.x0 - 6, g.ground); cx.lineTo(g.jarX + g.jarW + 6, g.ground); cx.stroke();
    cx.strokeStyle = '#14CBB1'; cx.beginPath(); cx.moveTo(g.x0 - 6, g.ground); cx.lineTo(Math.max(g.x0 - 6, bx), g.ground); cx.stroke();
    cx.font = '700 12px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
    AGES.forEach(function (a, i) {
      var x = ageX(g, a), on = bx >= x - 2;
      if (i === AGES.length - 1) { x = g.jarX + g.jarW / 2; }
      cx.fillStyle = on || still ? '#0B1F1C' : 'rgba(11,31,28,.4)'; cx.fillText(String(a), x, g.ground + 18);
      if (i < AGES.length - 1) { cx.fillStyle = on ? '#14CBB1' : 'rgba(11,31,28,.18)'; cx.beginPath(); cx.arc(x, g.ground, 4, 0, Math.PI * 2); cx.fill(); }
      /* passing an age pops a coin toward the jar */
      if (!still && i < AGES.length - 1 && on && passed <= i) { passed = i + 1; launch(g, x, i % 2 === 1); }
    });

    /* the jar */
    var jl = g.jarX, jt = g.ground - g.jarH, jw = g.jarW, jh = g.jarH;
    if (still) { level.x = 1; } else { level.v += (140 * (level.t - level.x) - 12 * level.v) * dt; level.x += level.v * dt; }
    cx.save(); rr(jl, jt, jw, jh, 10); cx.fillStyle = 'rgba(255,255,255,.8)'; cx.fill(); cx.clip();
    var fy = jt + jh - (jh - 6) * clamp(level.x, 0, 1.05);
    var gg = cx.createLinearGradient(0, fy, 0, jt + jh); gg.addColorStop(0, '#7D8DA6'); gg.addColorStop(1, '#586B85'); cx.fillStyle = gg;
    cx.beginPath(); cx.moveTo(jl, jt + jh); for (var x = jl; x <= jl + jw; x += 3) { cx.lineTo(x, fy + Math.sin(x * 0.3 + now * 5) * 1.5 * Math.min(1, Math.abs(level.v) * 0.5 + 0.2)); } cx.lineTo(jl + jw, jt + jh); cx.closePath(); cx.fill();
    for (var yy = jt + jh - 5, r = 0; yy > fy; yy -= 7, r++) { cx.fillStyle = r % 3 === 1 ? 'rgba(244,183,64,.6)' : 'rgba(255,255,255,.12)'; cx.beginPath(); cx.ellipse(jl + jw / 2 + (r % 2 ? 6 : -6), yy, jw * 0.3, 2, 0, 0, Math.PI * 2); cx.fill(); }
    cx.restore();
    rr(jl, jt, jw, jh, 10); cx.lineWidth = 2.2; cx.strokeStyle = 'rgba(11,31,28,.55)'; cx.stroke();
    rr(jl + jw * 0.18, jt - 8, jw * 0.64, 9, 3); cx.fillStyle = '#0B1F1C'; cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.6)'; rr(jl + 6, jt + 8, 4, jh * 0.5, 2); cx.fill();

    /* coins in flight */
    coins = coins.filter(function (c) {
      c.t += dt; c.vy += c.g * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.spin += dt * 10;
      if (c.t >= c.T) {
        level.t = Math.min(1, level.t + 0.25); level.v += 1.2;
        for (var i = 0; i < 6; i++) { sparks.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 120, t: 0, c: c.amber ? '#F4B740' : '#14CBB1' }); }
        return false;
      }
      coin(c.x, c.y, c.amber, Math.abs(Math.cos(c.spin)) * 0.75 + 0.25);
      return true;
    });

    /* Buddy */
    var B = SPR.buddy, arrived = still || t > RUN, frames = arrived ? (B.happy || B.idle) : (jump.y < -2 ? B.jump : B.run);
    var fi = arrived ? Math.floor(now * 3) % frames.length : (jump.y < -2 ? Math.min(frames.length - 1, 1) : Math.floor(now * 12) % frames.length);
    if (still) { frames = B.idle; fi = 0; }
    if (!still) { jump.v += 2600 * dt; jump.y += jump.v * dt; if (jump.y > 0) { jump.y = 0; jump.v = 0; } }
    var img = SPR.bake(frames[fi], Math.round(sc * dpr), false), bw = B.w * sc, bh = B.h * sc;
    cx.imageSmoothingEnabled = false;
    var fade = still ? 1 : t > LOOP - 0.5 ? clamp((LOOP - t) / 0.5, 0, 1) : t < 0.3 ? t / 0.3 : 1;
    cx.globalAlpha = fade; cx.drawImage(img, bx - bw * 0.62, g.ground - bh + 2 + jump.y, bw, bh); cx.globalAlpha = 1;
    cx.imageSmoothingEnabled = true;

    /* sparkles: from coins landing, and a cheer at 66 */
    if (!still && t > RUN && t - dt <= RUN) { for (var k = 0; k < 16; k++) { var an = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, sp = 120 + Math.random() * 160; sparks.push({ x: jl + jw / 2, y: jt - 6, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, c: ['#14CBB1', '#F4B740', '#7FE3D3'][k % 3] }); } }
    sparks = sparks.filter(function (p) {
      p.t += dt; if (p.t > 0.8) { return false; }
      p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      cx.globalAlpha = 1 - p.t / 0.8; cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); cx.fill(); cx.globalAlpha = 1;
      return true;
    });
  }

  var raf = 0, onScreen = true;
  function frame(ms) {
    raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    if (!W) { size(); }
    if (W > 120 && H > 40) { draw(now, dt); }
    if (motion() && onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function kick() { if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  t0 = performance.now() / 1000 + 0.9; /* starts after the welcome's own intro has begun */
  cv.addEventListener('pointerdown', function () {
    if (!motion()) { return; }
    if (jump.y === 0) { jump.v = -620; }
    var g = geo(); launch(g, clamp(bxNow || g.x0, g.x0, g.x1 - 30), Math.random() < 0.5); kick();
  });
  window.addEventListener('resize', function () { W = 0; kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; kick(); }); }
  if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { onScreen = es[es.length - 1].isIntersecting; if (onScreen) { kick(); } }).observe(cv); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', kick);
  kick();
}());
