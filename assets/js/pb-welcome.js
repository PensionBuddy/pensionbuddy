/* The home page's welcome band (#welcome): "Welcome to Pensionbuddy", alive.

   The markup is the finished picture, so with no script, or with motion
   turned off (html without .pb-motion), it simply sits there. With motion:

   - the intro: the paw springs in and its toes land one by one, "Welcome to"
     rises word by word, the twelve letters of "Pensionbuddy" spring up from
     below, and the teal line sweeps under the name;
   - the letters are springs: they lean away from a mouse or a finger and
     wobble back;
   - tap the paw and it squashes and bursts a handful of paw prints;
   - click or tap anywhere else in the band and it stamps a paw print there;
     moving the pointer leaves a trail of prints that fade;
   - small paws drift up the background and part around the pointer;
   - scrolling away scatters the letters upward, each at its own speed, and a
     line of paw prints walks down to the hero.

   Everything moves on damped springs, stepped once a frame, and the loop
   only runs while the band is on screen and the tab is visible. */
(function () {
  'use strict';
  var sec = document.getElementById('welcome');
  if (!sec || !window.requestAnimationFrame) { return; }
  var root = document.documentElement;
  function motion() { return root.classList.contains('pb-motion'); }

  var chars = [].slice.call(sec.querySelectorAll('.pb-w-ch'));
  var words = [].slice.call(sec.querySelectorAll('.pb-w-word'));
  var toes = [].slice.call(sec.querySelectorAll('.pb-w-toe'));
  var mark = sec.querySelector('.pb-w-mark');
  var line = sec.querySelector('.pb-w-line');
  var inner = sec.querySelector('.pb-w-in');
  var go = sec.querySelector('.pb-w-go');
  var hint = sec.querySelector('.pb-w-hint');
  var cv = sec.querySelector('.pb-w-fx');
  var cx = cv && cv.getContext ? cv.getContext('2d') : null;

  /* ---------------------------------------------------------- springs -- */
  function S(x, y, r, s) { return { x: x || 0, y: y || 0, r: r || 0, s: s === undefined ? 1 : s, vx: 0, vy: 0, vr: 0, vs: 0, tx: 0, ty: 0, tr: 0, ts: 1, o: 1 }; }
  function step(p, dt, k, c) {
    var a;
    a = k * (p.tx - p.x) - c * p.vx; p.vx += a * dt; p.x += p.vx * dt;
    a = k * (p.ty - p.y) - c * p.vy; p.vy += a * dt; p.y += p.vy * dt;
    a = k * (p.tr - p.r) - c * p.vr; p.vr += a * dt; p.r += p.vr * dt;
    a = k * (p.ts - p.s) - c * p.vs; p.vs += a * dt; p.s += p.vs * dt;
  }
  function put(el, p, dy, dr) {
    el.style.transform = 'translate3d(' + p.x.toFixed(2) + 'px,' + (p.y + (dy || 0)).toFixed(2) + 'px,0) rotate(' + (p.r + (dr || 0)).toFixed(2) + 'deg) scale(' + p.s.toFixed(4) + ')';
  }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function easeOut(p) { p = clamp(p, 0, 1); return 1 - Math.pow(1 - p, 3); }
  var seed = 20261008;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }

  var CH = chars.map(function () { return S(); });
  var WD = words.map(function () { return S(); });
  var TO = toes.map(function () { return S(); });
  var MK = S();

  /* -------------------------------------------------- the paw, drawn -- */
  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  /* a paw print size px across, centred on (x, y), toes towards angle a */
  function paw(x, y, size, a, alpha, color) {
    if (!PAD || alpha <= 0.002 || size <= 0.5) { return; }
    cx.save(); cx.globalAlpha = alpha; cx.fillStyle = color || '#14CBB1';
    cx.translate(x, y); cx.rotate(a); var k = size / 64; cx.scale(k, k); cx.translate(-32, -36);
    TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); });
    cx.fill(PAD);
    cx.restore();
  }

  /* -------------------------------------------------------- geometry -- */
  var W = 0, H = 0, dpr = 1, base = [], fontPx = 100, markC = { x: 0, y: 0 }, goB = 0;
  function measure() {
    var r = sec.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    /* the letters' resting centres, in the band's own coordinates */
    var saved = chars.map(function (el) { var t = el.style.transform; el.style.transform = 'none'; return t; });
    var savedIn = inner.style.transform; inner.style.transform = 'none';
    base = chars.map(function (el) { var b = el.getBoundingClientRect(); return { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top }; });
    var mr = mark.getBoundingClientRect(); markC = { x: mr.left + mr.width / 2 - r.left, y: mr.top + mr.height / 2 - r.top, w: mr.width };
    goB = go ? go.getBoundingClientRect().bottom - r.top : H * 0.8;
    fontPx = parseFloat(getComputedStyle(chars[0]).fontSize) || 100;
    chars.forEach(function (el, i) { el.style.transform = saved[i]; });
    inner.style.transform = savedIn;
    seedFloaters();
  }

  /* -------------------------------------------- the background paws -- */
  var floaters = [];
  function seedFloaters() {
    var n = Math.round(clamp(W * H / 52000, 10, 30)), keep = floaters;
    seed = 4242; floaters = [];
    for (var i = 0; i < n; i++) {
      var z = 0.35 + rnd() * 0.65;
      floaters.push({ x: rnd() * W, y: rnd() * H, z: z, size: 12 + 22 * z, a: (rnd() - 0.5) * 1.2, ph: rnd() * 6.28,
        p: keep[i] ? keep[i].p : S() });
    }
  }
  var prints = [];   /* stamps, trail prints and bursts: {x, y, vx, vy, a, size, born, life, alpha} */
  function stamp(x, y, a, size, life, alpha, vx, vy) {
    prints.push({ x: x, y: y, vx: vx || 0, vy: vy || 0, a: a, size: size, born: now, life: life, alpha: alpha });
    if (prints.length > 90) { prints.splice(0, prints.length - 90); }
  }
  function burst(x, y, n, speed) {
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 + rnd() * 0.5, v = speed * (0.6 + rnd() * 0.6);
      stamp(x, y, ang + Math.PI / 2, 16 + rnd() * 14, 1.1 + rnd() * 0.5, 0.55, Math.cos(ang) * v, Math.sin(ang) * v);
    }
  }

  /* ---------------------------------------------------------- pointer -- */
  var ptr = { x: -9999, y: -9999, on: false, lx: null, ly: null, side: 1 }, interacted = false;
  function local(e) { var r = sec.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function firstTouch() {
    if (interacted) { return; }
    interacted = true; if (hint) { hint.classList.remove('pb-w-on'); }
  }
  sec.addEventListener('pointermove', function (e) {
    if (!motion()) { return; }
    var p = local(e); ptr.x = p.x; ptr.y = p.y; ptr.on = true;
    if (ptr.lx === null) { ptr.lx = p.x; ptr.ly = p.y; }
    var dx = p.x - ptr.lx, dy = p.y - ptr.ly, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 74) {
      /* a trail: left, right, left, a little either side of the path, toes forward */
      var a = Math.atan2(dy, dx), nx = -Math.sin(a), ny = Math.cos(a);
      ptr.side = -ptr.side;
      stamp(p.x + nx * 11 * ptr.side, p.y + ny * 11 * ptr.side, a + Math.PI / 2, 22, 1.5, 0.22);
      ptr.lx = p.x; ptr.ly = p.y;
      wake();
    }
    if (d > 4) { firstTouchSoon(); }
  }, { passive: true });
  var moved = 0;
  function firstTouchSoon() { if (++moved > 30) { firstTouch(); } }
  sec.addEventListener('pointerleave', function () { ptr.on = false; ptr.x = ptr.y = -9999; ptr.lx = null; }, { passive: true });
  sec.addEventListener('pointercancel', function () { ptr.on = false; ptr.x = ptr.y = -9999; ptr.lx = null; }, { passive: true });
  sec.addEventListener('pointerdown', function (e) {
    if (!motion()) { return; }
    if (e.target.closest && e.target.closest('a,button')) { return; }
    var p = local(e);
    firstTouch();
    if (mark.contains(e.target)) {
      /* the paw: squash, spin a touch, re-land the toes, burst */
      MK.vs = -9; MK.vy = 260; MK.vr += (p.x < markC.x ? -1 : 1) * 420;
      TO.forEach(function (t, i) { t.s = 0.2; t.vs = 0; t.delay = now + 0.06 + i * 0.07; });
      burst(markC.x, markC.y, 12, 520);
    } else {
      stamp(p.x, p.y, (rnd() - 0.5) * 0.8, 34, 2.2, 0.45);
      burst(p.x, p.y, 5, 260);
    }
    wake();
  });

  /* ---------------------------------------------------------- the loop -- */
  var now = 0, last = 0, t0 = 0, running = false, visible = true, raf = 0;
  var INTRO = { words: 0.12, chars: 0.34, per: 0.045, mark: 0.0, toes: 0.28, line: 0, fade: 0 };
  INTRO.line = INTRO.chars + chars.length * INTRO.per + 0.12;
  INTRO.fade = INTRO.line + 0.15;

  function frame(ms) {
    raf = 0;
    now = ms / 1000;
    var dt = clamp(now - last, 0, 1 / 30); last = now;
    var t = now - t0;
    var r = sec.getBoundingClientRect();
    var sp = clamp(-r.top / Math.max(1, r.height), 0, 1);   /* how far the band is scrolled away */

    /* the paw mark: springs in, leans towards the pointer */
    if (t < INTRO.mark) { MK.s = 0.35; MK.r = -24; }
    var lean = ptr.on ? clamp((ptr.x - markC.x) / 600, -1, 1) : 0, lift = ptr.on ? clamp((ptr.y - markC.y) / 600, -1, 1) : 0;
    MK.tr = lean * 10; MK.tx = lean * 10; MK.ty = lift * 8 - sp * 60; MK.ts = 1;
    step(MK, dt, 200, 13);
    put(mark, MK);
    TO.forEach(function (p, i) {
      var at = p.delay !== undefined ? p.delay - t0 : INTRO.toes + i * 0.09;
      if (t < at) { p.s = 0; p.vs = 0; p.ts = 0; } else { p.ts = 1; }
      step(p, dt, 320, 14);
      toes[i].style.transform = 'scale(' + Math.max(0, p.s).toFixed(4) + ')';
    });

    /* "Welcome to" */
    WD.forEach(function (p, i) {
      var at = INTRO.words + i * 0.09;
      if (t < at) { p.y = fontPx * 0.5; p.vy = 0; words[i].style.opacity = 0; }
      else { words[i].style.opacity = clamp((t - at) / 0.25, 0, 1); }
      p.ty = -sp * 90;
      step(p, dt, 170, 18);
      put(words[i], p);
    });

    /* the name: each letter a spring, pushed by the pointer and by the scroll */
    var R = fontPx * 1.7;
    CH.forEach(function (p, i) {
      var at = INTRO.chars + i * INTRO.per;
      if (t < at) {
        p.y = fontPx * 0.95; p.r = (i % 2 ? 1 : -1) * (8 + (i * 7) % 10); p.s = 0.9; p.vy = p.vr = p.vs = 0;
        chars[i].style.opacity = 0;
      } else {
        chars[i].style.opacity = clamp((t - at) / 0.22, 0, 1);
      }
      var b = base[i] || { x: 0, y: 0 }, tx = 0, ty = 0, tr = 0, ts = 1;
      if (ptr.on) {
        var dx = b.x - ptr.x, dy = b.y - ptr.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < R) {
          var f = Math.pow(1 - d / R, 2);
          tx = dx / d * f * fontPx * 0.5; ty = dy / d * f * fontPx * 0.62; tr = dx / d * f * 22; ts = 1 + f * 0.18;
        }
      }
      /* scrolling away: up, each at its own pace, with a little turn */
      ty -= sp * fontPx * (0.5 + ((i * 5) % 7) / 6);
      tr += sp * ((i % 2) ? 9 : -9);
      p.tx = tx; p.ty = ty; p.tr = tr; p.ts = ts;
      step(p, dt, 190, 11);
      put(chars[i], p);
    });

    /* the line under the name, and the rest */
    if (line) { var lp = easeOut((t - INTRO.line) / 0.6); line.style.transform = 'scaleX(' + lp.toFixed(4) + ')'; }
    if (t >= INTRO.fade && !sec.classList.contains('pb-w-shown')) { sec.classList.add('pb-w-shown'); }
    if (hint && !interacted && t > 2.6 && !hint.classList.contains('pb-w-on')) { hint.classList.add('pb-w-on'); }
    inner.style.opacity = (1 - clamp(sp * 1.25, 0, 1)).toFixed(3);

    /* the canvas */
    if (cx) {
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, W, H);
      var px = ptr.on ? (ptr.x - W / 2) : 0, py = ptr.on ? (ptr.y - H / 2) : 0;
      floaters.forEach(function (f) {
        f.y -= (5 + 12 * f.z) * dt;
        if (f.y < -40) { f.y = H + 40; f.x = rnd() * W; }
        var fx = f.x + Math.sin(now * 0.6 + f.ph) * 10 * f.z - px * 0.025 * f.z, fy = f.y - py * 0.025 * f.z;
        var q = f.p; q.tx = 0; q.ty = 0;
        if (ptr.on) {
          var dx = fx - ptr.x, dy = fy - ptr.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d < 150) { var g = Math.pow(1 - d / 150, 2) * 70; q.tx = dx / d * g; q.ty = dy / d * g; }
        }
        step(q, dt, 60, 9);
        paw(fx + q.x, fy + q.y, f.size, f.a + Math.sin(now * 0.4 + f.ph) * 0.15, 0.05 + 0.08 * f.z);
      });
      prints = prints.filter(function (p) {
        var age = now - p.born; if (age > p.life) { return false; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.04, dt); p.vy *= Math.pow(0.04, dt);
        var pop = easeOut(age / 0.18), fade = 1 - clamp((age - p.life * 0.55) / (p.life * 0.45), 0, 1);
        paw(p.x, p.y, p.size * (0.6 + 0.4 * pop), p.a, p.alpha * fade);
        return true;
      });
      /* the walk down to the hero, as the band scrolls away */
      if (sp > 0.01) {
        var n = 7, y0 = goB + 34, y1 = H - 26;
        for (var i = 0; i < n; i++) {
          var a2 = clamp((sp - 0.03 - i * 0.045) / 0.06, 0, 1);
          if (a2 <= 0) { break; }
          var yy = y0 + (y1 - y0) * i / (n - 1);
          paw(W / 2 + (i % 2 ? 16 : -16), yy, 26 * (0.6 + 0.4 * easeOut(a2)), Math.PI, 0.35 * a2, '#0B7A6E');
        }
      }
    }

    if (running) { raf = requestAnimationFrame(frame); }
  }
  function wake() { if (running && !raf) { raf = requestAnimationFrame(frame); } }
  function start() {
    if (running || !motion() || !visible || document.hidden) { return; }
    running = true; last = performance.now() / 1000; raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  /* still: the finished picture, a few paws drawn once */
  function still() {
    stop();
    sec.classList.remove('pb-w-armed'); sec.classList.add('pb-w-shown');
    chars.concat(words, toes, [mark, line, inner]).forEach(function (el) { if (el) { el.style.transform = ''; el.style.opacity = ''; } });
    if (cx) {
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      floaters.forEach(function (f) { paw(f.x, f.y, f.size, f.a, 0.05 + 0.08 * f.z); });
    }
  }

  function init() {
    measure();
    if (!motion()) { still(); return; }
    t0 = performance.now() / 1000;
    sec.classList.add('pb-w-run');
    if (hint) { hint.textContent = window.matchMedia && matchMedia('(pointer: coarse)').matches ? 'Drag across the name. Tap the paw.' : 'Run your mouse over the name. Click the paw.'; }
    start();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { start(); } else { stop(); } }).observe(sec);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else { start(); } });
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); if (!motion()) { still(); } }, 120); });
  document.addEventListener('pb:motion', function (e) { if (e.detail && e.detail.motion) { sec.classList.add('pb-w-run'); start(); } else { still(); } });
  /* measure once the face is in, so the letters' centres are true */
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { if (W) { measure(); if (!motion()) { still(); } } }); }
  init();
}());
