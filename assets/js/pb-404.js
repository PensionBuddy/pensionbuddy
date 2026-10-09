/* The 404 page, alive (9 October 2026, Damian's brief): a lost paw.

   The brand's paw wanders the screen, leaving footprints that fade. It is
   curious: come near and it trots over; click somewhere and it runs there.
   Pick it up and carry it to "Back to the homepage", and it hops in: the
   button bounces, paws burst out, and a line says it found its way.

   One fixed canvas over the page that never takes a click: links and the
   search work as ever; only a press on the paw itself is caught. With motion
   turned off nothing is drawn. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  var home = document.querySelector('.pb-nf a.btn[href="index.html"]');
  if (!home) { return; }
  var cv = document.createElement('canvas'); cv.className = 'pb-lost'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var cx = cv.getContext('2d'); if (!cx) { return; }
  var W = 0, H = 0, dpr = 1;
  function size() { W = innerWidth; H = innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  size(); window.addEventListener('resize', size);
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  function paw(x, y, size, a, col, alpha) {
    if (!PAD) { return; }
    cx.save(); cx.globalAlpha = alpha; cx.fillStyle = col; cx.translate(x, y); cx.rotate(a); var k = size / 64; cx.scale(k, k); cx.translate(-32, -36);
    TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); });
    cx.fill(PAD); cx.restore();
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

  /* the paw, in screen coordinates */
  var P = { x: W > 1000 ? W * 0.78 : W * 0.72, y: H * 0.45, vx: 0, vy: 0, tx: W * 0.7, ty: H * 0.4, face: 0, held: null, gone: 0, born: 0, side: 1, lx: 0, ly: 0 };
  var prints = [], bits = [], now = 0, nextWander = 0, ptr = null, lastClick = -9, homeAt = 0, S = 46;
  function wander() {
    /* somewhere on the screen, kept off the edges; on a wide screen, in the
       empty side beside the words rather than across them */
    var nf = document.querySelector('.pb-nf'), right = nf ? Math.min(nf.getBoundingClientRect().left + 780, W) : 0;
    var x0 = W - right > 260 ? right + 40 : 60;
    P.tx = x0 + Math.random() * (W - 60 - x0); P.ty = 110 + Math.random() * (H - 200);
    nextWander = now + 2.5 + Math.random() * 2.5;
  }
  function inHome(x, y) {
    var r = home.getBoundingClientRect();
    return x > r.left - 16 && x < r.right + 16 && y > r.top - 16 && y < r.bottom + 16;
  }
  function burst(x, y, n) {
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, v = 180 + Math.random() * 420; bits.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, a: Math.random() * 6, born: now, c: ['#14CBB1', '#0B7A6E', '#F4B740', '#7FE3D3'][i % 4] }); }
  }

  function frame(ms) {
    raf = 0; now = ms / 1000;
    var dt = clamp(now - last, 0, 1 / 30); last = now;
    if (!P.gone) {
      if (P.held) {
        P.x += (P.held.x - P.x) * Math.min(1, dt * 18); P.y += (P.held.y - P.y) * Math.min(1, dt * 18);
        home.classList.toggle('pb-lost-near', inHome(P.x, P.y));
      } else {
        /* curious: a pointer close by, and it trots over and sits beside it */
        if (ptr && now - ptr.t < 2 && Math.hypot(ptr.x - P.x, ptr.y - P.y) < 260 && now - lastClick > 1.5) {
          var d = Math.hypot(ptr.x - P.x, ptr.y - P.y) || 1; P.tx = ptr.x - (ptr.x - P.x) / d * 64; P.ty = ptr.y - (ptr.y - P.y) / d * 64;
        } else if (now > nextWander && now - lastClick > 2.2) { wander(); }
        var k = 7, c = 4.2;
        P.vx += (k * (P.tx - P.x) - c * P.vx) * dt; P.vy += (k * (P.ty - P.y) - c * P.vy) * dt;
        var sp = Math.hypot(P.vx, P.vy), max = 420;
        if (sp > max) { P.vx *= max / sp; P.vy *= max / sp; sp = max; }
        P.x += P.vx * dt; P.y += P.vy * dt;
        /* a footprint every so often, left and right of the path */
        if (Math.hypot(P.x - P.lx, P.y - P.ly) > 34) {
          var a = Math.atan2(P.y - P.ly, P.x - P.lx), nx = -Math.sin(a), ny = Math.cos(a); P.side = -P.side;
          prints.push({ x: P.x + nx * 9 * P.side, y: P.y + ny * 9 * P.side, a: a + Math.PI / 2, born: now });
          if (prints.length > 120) { prints.shift(); }
          P.lx = P.x; P.ly = P.y;
        }
      }
    }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    prints = prints.filter(function (p) { var age = now - p.born; if (age > 3.2) { return false; } paw(p.x, p.y, 15, p.a, '#0B7A6E', 0.32 * (1 - age / 3.2)); return true; });
    /* the paw itself: the mark, bobbing as it walks, swinging when carried */
    if (!P.gone || now - P.gone < 0.5) {
      var g = P.gone ? 1 - (now - P.gone) / 0.5 : 1, hr = P.gone ? home.getBoundingClientRect() : null;
      var x = P.gone ? P.x + (hr.left + hr.width / 2 - P.x) * (1 - g) : P.x, y = P.gone ? P.y + (hr.top + hr.height / 2 - P.y) * (1 - g) : P.y;
      var spd = Math.hypot(P.vx, P.vy), bob = P.held ? 0 : Math.abs(Math.sin(now * 12)) * Math.min(1, spd / 200) * 6;
      var tilt = P.held ? Math.sin(now * 9) * 0.25 : clamp(P.vx / 1200, -0.25, 0.25), s = S * g * (P.held ? 1.12 : 1);
      cx.save(); cx.translate(x, y - bob); cx.rotate(tilt);
      cx.shadowColor = 'rgba(11,31,28,.25)'; cx.shadowBlur = P.held ? 26 : 14; cx.shadowOffsetY = P.held ? 14 : 6;
      rr(-s / 2, -s / 2, s, s, s * 0.27); cx.fillStyle = '#14CBB1'; cx.fill(); cx.shadowColor = 'transparent';
      cx.restore();
      cx.save(); cx.translate(x, y - bob); cx.rotate(tilt); paw(0, 2, s * 0.58, 0, '#fff', 1); cx.restore();
      if (!P.held && !P.gone && !homeAt) {
        /* a little thought, now and then */
        var q = (now % 7) < 2.2 ? Math.min(1, (now % 7) / 0.3, (2.2 - now % 7) / 0.3) : 0;
        if (q > 0) { cx.save(); cx.globalAlpha = q; cx.fillStyle = '#0B1F1C'; cx.font = '800 15px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.fillText('Lost?', x, y - S / 2 - 12); cx.restore(); }
      }
    }
    bits = bits.filter(function (b) {
      var age = now - b.born; if (age > 1.3) { return false; }
      b.vy += 800 * dt; b.vx *= Math.pow(0.4, dt); b.x += b.vx * dt; b.y += b.vy * dt;
      paw(b.x, b.y, 18, b.a + age * 3, b.c, 1 - age / 1.3); return true;
    });
    if (homeAt && now - homeAt > 4 && P.gone) {
      /* it comes back out for another walk */
      P.gone = 0; var hr2 = home.getBoundingClientRect(); P.x = hr2.right + 30; P.y = hr2.top; P.lx = P.x; P.ly = P.y; homeAt = 0; wander();
    }
    if (!document.hidden) { raf = requestAnimationFrame(frame); }
  }
  var raf = 0, last = 0;
  function wake() { if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }

  function onPaw(x, y) { return !P.gone && Math.abs(x - P.x) < S / 2 + 10 && Math.abs(y - P.y) < S / 2 + 10; }
  document.addEventListener('pointermove', function (e) {
    ptr = { x: e.clientX, y: e.clientY, t: now };
    if (P.held && e.pointerId === P.held.id) { P.held.x = e.clientX; P.held.y = e.clientY; e.preventDefault(); }
    root.classList.toggle('pb-lost-hot', onPaw(e.clientX, e.clientY));
  }, { passive: false });
  document.addEventListener('pointerdown', function (e) {
    if (onPaw(e.clientX, e.clientY)) {
      e.preventDefault();
      P.held = { id: e.pointerId, x: e.clientX, y: e.clientY }; root.classList.add('pb-lost-carry');
      hintOff(); wake(); return;
    }
    if (e.target.closest && e.target.closest('a,button,input,label,select,textarea')) { return; }
    P.tx = e.clientX; P.ty = e.clientY; lastClick = now; wake();
  }, { passive: false });
  function drop(e) {
    if (!P.held || (e && e.pointerId !== P.held.id)) { return; }
    var hit = inHome(P.x, P.y); P.held = null; root.classList.remove('pb-lost-carry'); home.classList.remove('pb-lost-near');
    P.vx = P.vy = 0; P.tx = P.x; P.ty = P.y; nextWander = now + 2;
    if (hit) {
      P.gone = now; homeAt = now;
      var r = home.getBoundingClientRect(); setTimeout(function () { burst(r.left + r.width / 2, r.top + r.height / 2, 26); }, 450);
      home.classList.remove('pb-lost-home'); void home.offsetWidth; home.classList.add('pb-lost-home');
      said.textContent = 'It found its way home. Your turn.'; said.classList.add('pb-on');
    }
  }
  document.addEventListener('pointerup', drop); document.addEventListener('pointercancel', drop);
  /* on a touch screen a finger on the paw carries it, and does not scroll the page */
  document.addEventListener('touchstart', function (e) { var t = e.touches[0]; if (t && onPaw(t.clientX, t.clientY)) { e.preventDefault(); } }, { passive: false });
  document.addEventListener('touchmove', function (e) { if (P.held) { e.preventDefault(); } }, { passive: false });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { wake(); } });

  /* the line under the button: a hint first, then the happy ending */
  var said = document.createElement('p'); said.className = 'pb-lost-said'; said.setAttribute('aria-hidden', 'true');
  said.textContent = 'A paw got lost too. Carry it to the button.';
  var row = home.parentNode; row.parentNode.insertBefore(said, row.nextSibling);
  setTimeout(function () { said.classList.add('pb-on'); }, 2200);
  function hintOff() { if (!homeAt) { said.classList.remove('pb-on'); } }
  P.lx = P.x; P.ly = P.y;
  wake();
}());
