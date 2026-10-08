/* Revenue's deadline band on the home page, alive (8 October 2026, Damian's
   brief): the relief jar, and the countdown's flipping digits (at the end).

   THE RELIEF JAR: the relief widget's sentence as a jar of coins.

   The widget (.pb-rw, assets/js/pb-relief-widget.js) says what putting in an
   amount could cost after tax relief at the higher and standard rates. The
   jar draws the same arithmetic: the amount in coins, yours (grey-green) poured
   in first, Revenue's (amber) landing on top. The key under it names the split
   in euro, from the same two rates the widget uses, so the €100 example
   reads "You pay €60, Revenue adds €40" at the higher rate, the widget's
   "about €60".

   - the coins pour in when the band comes into view;
   - drag the widget's amount and coins drop in or pop out (about one coin
     for every €10, between 3 and 60);
   - the rate buttons flip coins between yours and Revenue's;
   - tap or click the jar and it shakes them up.

   The coins are circles on a little physics step (gravity, the jar's walls,
   each other), which sleeps when they settle. With motion turned off they
   are stacked in place, with no fall. */
(function () {
  'use strict';
  var jar = document.getElementById('pbJar');
  var w = document.querySelector('#deadline .pb-rw');
  var r = w && w.querySelector('input[type=range]');
  var cv = jar && jar.querySelector('canvas');
  if (!jar || !r || !cv || !cv.getContext || !window.requestAnimationFrame) { return; }
  var cx = cv.getContext('2d'), root = document.documentElement;
  var youB = jar.querySelector('.pb-jar-you b'), revB = jar.querySelector('.pb-jar-rev b');
  var btns = [].slice.call(jar.querySelectorAll('[data-rate]'));
  var rate = 0.4;
  var fmt = function (v) { return '€' + Math.round(v).toLocaleString('en-IE'); };
  function motion() { return root.classList.contains('pb-motion'); }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

  /* the site's colours for this split (the calculator's "You really pay" and
     "Revenue adds"): ink-2 for yours, amber for Revenue's; teal is the State's */
  var YOU = ['#54635F', '#3E4A47'], REV = ['#F4B740', '#C98A12'];
  var W = 0, H = 0, dpr = 1, R = 15, J = null, coins = [], idx = 0, raf = 0, last = 0, calm = 0, seen = false, queue = [];

  function size() {
    var b = cv.getBoundingClientRect();
    W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    R = clamp(W / 20, 11, 15);
    /* the jar's inside: walls, floor, a rounded foot */
    J = { l: W * 0.16, r: W * 0.84, top: H * 0.14, b: H - 14, rad: W * 0.12 };
  }
  function count() { return clamp(Math.round(+r.value / 10), 3, 60); }
  function yours() { return Math.round(count() * (1 - rate)); }
  function key() {
    var n = +r.value;
    if (youB) { youB.textContent = fmt(n * (1 - rate)); }
    if (revB) { revB.textContent = fmt(n * rate); }
    btns.forEach(function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-rate') === rate ? 'true' : 'false'); });
  }
  /* a coin's side is its place in the pour: the first yours() coins are yours */
  function colour(c) { return c.rank < yours() ? 'you' : 'rev'; }
  function rank() { coins.filter(function (c) { return !c.gone; }).sort(function (a, b) { return a.i - b.i; }).forEach(function (c, k) { c.rank = k; }); }

  /* ------------------------------------------------------------ coins -- */
  function add(n) {
    for (var k = 0; k < n; k++) {
      var live = coins.filter(function (x) { return !x.gone; }).length;
      var c = { rank: live, i: idx++, x: J.l + R + Math.random() * (J.r - J.l - 2 * R), y: -R - k * R * 1.4 - Math.random() * 10,
        vx: (Math.random() - 0.5) * 40, vy: 0, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 6, s: 1, gone: 0, flip: 1, was: null };
      c.was = colour(c);
      coins.push(c);
    }
  }
  /* the coins wanted now: drop the missing ones, pop the extra (the last added first) */
  function sync(pour) {
    var want = count(), have = coins.filter(function (c) { return !c.gone; });
    if (have.length < want) {
      if (pour) {
        /* yours first, then a beat, then Revenue's */
        var y = yours(), q = [];
        for (var k = have.length; k < want; k++) { q.push(k < y ? 0 : 1); }
        var t = 0, prev = 0;
        q.forEach(function (who) { if (who !== prev) { t += 0.35; prev = who; } queue.push(t); t += 0.07; });
      } else { add(want - have.length); }
    } else if (have.length > want) {
      have.sort(function (a, b) { return b.i - a.i; }).slice(0, have.length - want).forEach(function (c) { c.gone = 0.0001; });
    }
    rank();
    /* the rate or the count moved the line between yours and Revenue's: flip the coins that changed sides */
    coins.forEach(function (c) { var now = colour(c); if (c.was !== now) { c.flip = -1; c.was = now; } });
  }

  /* ---------------------------------------------------------- physics -- */
  function physics(dt) {
    var g = 1500, i, j, c, d;
    for (i = 0; i < coins.length; i++) {
      c = coins[i];
      c.vy += g * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; c.va *= Math.pow(0.2, dt);
      /* walls */
      if (c.y > J.top - R * 3) {
        if (c.x < J.l + R) { c.x = J.l + R; c.vx = Math.abs(c.vx) * 0.35; }
        if (c.x > J.r - R) { c.x = J.r - R; c.vx = -Math.abs(c.vx) * 0.35; }
      }
      /* the floor, and the rounded corners of the foot */
      var fl = J.b - R;
      if (c.y > fl) { c.y = fl; c.vy = -Math.abs(c.vy) * 0.28; c.vx *= 0.9; }
      var cxl = J.l + J.rad, cxr = J.r - J.rad, cyb = J.b - J.rad;
      if (c.y > cyb && (c.x < cxl || c.x > cxr)) {
        var ox = c.x < cxl ? cxl : cxr, dx = c.x - ox, dy = c.y - cyb, dist = Math.sqrt(dx * dx + dy * dy), lim = J.rad - R;
        if (dist > lim) { c.x = ox + dx / dist * lim; c.y = cyb + dy / dist * lim; var vn = (c.vx * dx + c.vy * dy) / dist; if (vn > 0) { c.vx -= 1.3 * vn * dx / dist; c.vy -= 1.3 * vn * dy / dist; } }
      }
    }
    /* each other */
    for (i = 0; i < coins.length; i++) {
      for (j = i + 1; j < coins.length; j++) {
        var a = coins[i], b = coins[j], dx2 = b.x - a.x, dy2 = b.y - a.y, d2 = dx2 * dx2 + dy2 * dy2, min = R * 2 * 0.98;
        if (d2 < min * min && d2 > 0.0001) {
          d = Math.sqrt(d2); var nx = dx2 / d, ny = dy2 / d, push = (min - d) / 2;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
          var rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) { var imp = -rel * 0.6; a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp; }
          a.vx *= 0.995; b.vx *= 0.995;
        }
      }
    }
  }

  /* ------------------------------------------------------------- draw -- */
  function drawJar() {
    var l = J.l - 6, rr = J.r + 6, t = J.top - 8, b = J.b + 6, rad = J.rad + 6;
    /* the glass */
    cx.save();
    cx.beginPath();
    cx.moveTo(l, t); cx.lineTo(l, b - rad); cx.quadraticCurveTo(l, b, l + rad, b); cx.lineTo(rr - rad, b); cx.quadraticCurveTo(rr, b, rr, b - rad); cx.lineTo(rr, t);
    cx.fillStyle = 'rgba(255,255,255,.55)'; cx.fill();
    cx.lineWidth = 3; cx.strokeStyle = 'rgba(11,31,28,.22)'; cx.stroke();
    /* the rim */
    cx.beginPath(); cx.moveTo(l - 10, t); cx.lineTo(rr + 10, t); cx.lineWidth = 6; cx.lineCap = 'round'; cx.strokeStyle = 'rgba(11,31,28,.28)'; cx.stroke();
    cx.restore();
  }
  function drawShine() {
    var l = J.l - 6;
    cx.save(); cx.globalAlpha = 0.5; cx.strokeStyle = '#fff'; cx.lineWidth = 5; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(l + 14, J.top + 16); cx.lineTo(l + 14, J.b - J.rad); cx.stroke(); cx.restore();
  }
  function coin(c) {
    var s = c.s * (c.gone ? 1 - c.gone : 1);
    if (s <= 0.02) { return; }
    var side = c.was === 'you' ? YOU : REV;
    cx.save(); cx.translate(c.x, c.y); cx.rotate(c.a);
    cx.scale(s * Math.abs(c.flip) || 0.001, s);
    /* half a flip shows the old colour, the second half the new */
    if (c.flip < 0) { side = c.was === 'you' ? REV : YOU; }
    cx.beginPath(); cx.arc(0, 0, R, 0, Math.PI * 2); cx.fillStyle = side[1]; cx.fill();
    cx.beginPath(); cx.arc(0, -1.5, R - 2, 0, Math.PI * 2); cx.fillStyle = side[0]; cx.fill();
    cx.beginPath(); cx.arc(0, -1.5, R - 5.5, 0, Math.PI * 2); cx.lineWidth = 1.5; cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.stroke();
    cx.fillStyle = '#fff'; cx.font = '700 ' + Math.round(R * 1.05) + 'px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText('€', 0, -0.5);
    cx.restore();
  }
  function draw() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    drawJar();
    cx.save();
    /* coins inside the glass are clipped to it; falling ones above it are not */
    coins.forEach(coin);
    cx.restore();
    drawShine();
  }

  /* ------------------------------------------------------------- loop -- */
  var t0 = 0;
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    /* the pour queue */
    while (queue.length && now - t0 >= queue[0]) { queue.shift(); add(1); }
    var n = 3;
    for (var k = 0; k < n; k++) { physics(dt / n); }
    var moving = queue.length > 0;
    coins.forEach(function (c) {
      if (c.flip < 1) { c.flip = Math.min(1, c.flip + dt * 6); moving = true; }
      if (c.gone) { c.gone += dt * 5; moving = true; }
      if (Math.abs(c.vx) + Math.abs(c.vy) > 14) { moving = true; }
    });
    coins = coins.filter(function (c) { return !(c.gone >= 1); });
    draw();
    calm = moving ? 0 : calm + dt;
    if (calm < 0.6) { raf = requestAnimationFrame(frame); }
  }
  function wake() { calm = 0; if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }

  /* motion off: stack the coins in rows, no fall */
  function stack() {
    queue = []; coins = coins.filter(function (c) { return !c.gone; });
    var want = count();
    while (coins.length < want) { var c = { i: idx++, s: 1, gone: 0, flip: 1, a: 0, va: 0, vx: 0, vy: 0, x: 0, y: 0 }; coins.push(c); }
    coins.sort(function (a, b) { return a.i - b.i; });
    if (coins.length > want) { coins.length = want; }
    rank();
    var per = Math.max(1, Math.floor((J.r - J.l) / (2 * R)));
    coins.forEach(function (c, k) {
      var row = Math.floor(k / per), col = k % per, off = row % 2 ? R : 0;
      c.x = J.l + R + off + col * 2 * R; if (c.x > J.r - R) { c.x = J.r - R; }
      c.y = J.b - R - row * R * 1.75; c.was = colour(c); c.flip = 1;
    });
    draw();
  }
  function update(pour) {
    key();
    if (!motion()) { stack(); return; }
    sync(pour); wake();
  }

  /* ----------------------------------------------------------- wiring -- */
  jar.hidden = false;
  size(); key();
  r.addEventListener('input', function () { if (seen) { update(false); } else { key(); } });
  btns.forEach(function (b) {
    b.addEventListener('click', function () { rate = +b.getAttribute('data-rate'); if (seen) { update(false); } else { key(); } });
  });
  cv.addEventListener('pointerdown', function () {
    if (!motion() || !seen) { return; }
    coins.forEach(function (c) { c.vy -= 380 + Math.random() * 420; c.vx += (Math.random() - 0.5) * 360; c.va += (Math.random() - 0.5) * 18; });
    jar.classList.remove('pb-jar-shake'); void jar.offsetWidth; jar.classList.add('pb-jar-shake');
    wake();
  });
  function go() {
    if (seen) { return; }
    seen = true; t0 = performance.now() / 1000;
    update(true);
  }
  if (!motion()) { seen = true; stack(); }
  else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { threshold: 0.35 });
    io.observe(jar);
  } else { go(); }
  var rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var oW = W, oH = H; size();
      coins.forEach(function (c) { c.x *= W / (oW || W); c.y *= H / (oH || H); });
      if (!motion()) { stack(); } else { wake(); }
    }, 150);
  });
  document.addEventListener('pb:motion', function () { if (!motion()) { stack(); } else { wake(); } });
}());

/* THE CLOCK: pb-deadline.js writes the days, hours and minutes; here each
   change flips the digit into place, and the first time the band comes into
   view the three numbers spin like a fruit machine and land on the real
   count. Days, hours and minutes only, as ever (Run 41: never seconds). */
(function () {
  'use strict';
  var ns = [].slice.call(document.querySelectorAll('#deadline .tk-n'));
  var band = document.getElementById('deadline'), root = document.documentElement;
  if (!ns.length || !band || !window.PBDeadline) { return; }
  function motion() { return root.classList.contains('pb-motion'); }
  var spinning = false;
  function flip(el) {
    el.classList.remove('pb-flip'); void el.offsetWidth; el.classList.add('pb-flip');
  }
  ns.forEach(function (el) {
    new MutationObserver(function () { if (!spinning && motion()) { flip(el); } })
      .observe(el, { childList: true, characterData: true, subtree: true });
  });
  function real() {
    var d = window.PBDeadline.at(new Date()), pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return ['' + d.days, pad(d.hrs), pad(d.min)];
  }
  function spin() {
    if (!motion()) { return; }
    spinning = true;
    var t0 = performance.now(), stops = [900, 1150, 1400], done = [false, false, false];
    (function step(now) {
      var want = real(), all = true;
      ns.forEach(function (el, i) {
        if (done[i]) { return; }
        if (now - t0 >= stops[i]) { done[i] = true; el.textContent = want[i]; flip(el); return; }
        all = false;
        var n = Math.floor(Math.random() * (i === 0 ? 100 : i === 1 ? 24 : 60));
        el.textContent = i === 0 ? '' + n : (n < 10 ? '0' + n : '' + n);
      });
      if (all) { spinning = false; return; }
      requestAnimationFrame(step);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(spin, 150); } }, { threshold: 0.5 });
    io.observe(band.querySelector('.tk-clock') || band);
  }
}());
