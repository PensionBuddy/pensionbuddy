/* The long guides, each with a scene of its own (9 October 2026, Damian's
   brief). One small canvas under each guide's opening lines, a picture of
   what the guide is about, to play with. It says nothing the guide does not
   and carries no figures; the guide's text is untouched.

     pensions-over-50.html        an hourglass whose sand falls as coins;
                                  tap it to turn it over
     self-employed-pensions.html  your invoices: each drops a coin into your
                                  pension, and Revenue's coin follows it
     uk-pensions-in-ireland.html  a boat with a chest of coins, between the
                                  UK and Ireland; tap to sail across
     director-pension-rules.html  the company pays into your pension through
                                  a pipe; tap the company to pay in

   The reader's own money is slate, Revenue's amber, the company's ink. The
   loop runs only while the scene is on screen. With motion turned off none
   of this is added. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame || !window.IntersectionObserver) { return; }
  var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  var KIND = { 'pensions-over-50': 'glass', 'self-employed-pensions': 'invoice', 'uk-pensions-in-ireland': 'boat', 'director-pension-rules': 'pipe' }[page];
  var h1 = document.querySelector('main h1');
  if (!KIND || !h1) { return; }
  var HINT = { glass: 'Tap the hourglass to turn it over.', invoice: 'Tap to send in another payment.', boat: 'Tap to sail across.', pipe: 'Tap the company to pay in.' }[KIND];
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  var SLATE = '#586B85', AMBER = '#F4B740', INK = '#2C3B38', MARK = '#14CBB1';

  /* under the guide's opening lines */
  var anchor = h1, n = h1.nextElementSibling;
  while (n && /^(P)$/.test(n.tagName) && /\b(updated|intro|lede)\b/.test(n.className) && !/pb-toc/.test(n.className)) { anchor = n; n = n.nextElementSibling; }
  var box = document.createElement('div'); box.className = 'pb-gs'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<canvas class="pb-gs-cv"></canvas><p class="pb-gs-hint"></p>';
  box.querySelector('p').textContent = HINT;
  anchor.parentNode.insertBefore(box, anchor.nextSibling);
  var cv = box.querySelector('canvas'), cx = cv.getContext('2d'), hint = box.querySelector('p');
  var W = 0, H = 0, dpr = 1, raf = 0, last = 0, onScreen = false, now = 0, ptr = { x: -1, y: -1, on: false };
  function size() { var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function coin(x, y, r, col, spin) { if (!(r > 0.5)) { return; } cx.save(); cx.translate(x, y); cx.scale(Math.max(0.2, Math.abs(Math.cos(spin || 0))), 1); cx.fillStyle = col; cx.beginPath(); cx.arc(0, 0, r, 0, Math.PI * 2); cx.fill(); cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.lineWidth = 1.3; cx.beginPath(); cx.arc(0, 0, r * 0.6, 0, Math.PI * 2); cx.stroke(); cx.restore(); }
  /* a jar of coins that settle in rows: shared by three scenes */
  function Jar() { return { n: 0, shown: 0, bump: 0 }; }
  function drawJar(j, x, y, w, h, dt) {
    j.shown += (j.n - j.shown) * Math.min(1, dt * 6); j.bump = Math.max(0, j.bump - dt * 3);
    cx.save(); rr(x, y, w, h, 14); cx.clip(); cx.fillStyle = 'rgba(11,31,28,.04)'; cx.fillRect(x, y, w, h);
    var per = Math.max(3, Math.floor((w - 8) / 15)), cap = per * Math.floor((h - 8) / 9), k = Math.min(Math.floor(j.shown), cap);
    for (var i = 0; i < k; i++) { var row = Math.floor(i / per), col = i % per; cx.fillStyle = j.cols ? j.cols[i % j.cols.length] : SLATE; cx.beginPath(); cx.ellipse(x + 10 + col * 15 + (row % 2) * 6, y + h - 8 - row * 9, 7, 3.6, 0, 0, Math.PI * 2); cx.fill(); }
    cx.restore();
    if (j.n >= cap) { j.n = Math.floor(cap * 0.4); j.shown = j.n; if (j.cols) { j.cols = j.cols.slice(0, 2); } }
    rr(x, y - j.bump * 3, w, h + j.bump * 3, 14); cx.lineWidth = 3; cx.strokeStyle = 'rgba(11,31,28,.25)'; cx.stroke();
    cx.save(); cx.globalAlpha = 0.5; cx.strokeStyle = '#fff'; cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(x + 9, y + 12); cx.lineTo(x + 9, y + h - 12); cx.stroke(); cx.restore();
  }

  var S = {
    /* ------------------------------------------------ the hourglass -- */
    glass: (function () {
      var st = { a: 0, av: 0, flips: 0, top: 1, falling: [], jar: Jar(), next: 0 };
      return {
        draw: function (dt) {
          var c = W * 0.5, cy = H * 0.5, gh = Math.min(H * 0.78, 150), gw = gh * 0.62;
          /* the glass leans toward you and turns over on a spring */
          var lean = ptr.on ? clamp((ptr.x - c) / W, -0.5, 0.5) * 0.25 : 0, want = st.flips * Math.PI + lean;
          st.av += (90 * (want - st.a) - 11 * st.av) * dt; st.a += st.av * dt;
          var upright = Math.abs(Math.sin(st.a)) < 0.2;
          if (upright && st.top > 0) {
            st.top = Math.max(0, st.top - dt * 0.07);
            if (now > st.next) { st.falling.push({ y: 0, v: 20, spin: Math.random() * 6 }); st.next = now + 0.32; }
          }
          if (st.top <= 0 && upright && !st.auto) { st.auto = now + 2.2; }
          if (st.auto && now > st.auto) { st.auto = 0; flip(); }
          /* the jar beside it collects what fell */
          var jx = c + gw * 0.9, jw = Math.min(110, W * 0.22), jh = gh * 0.62;
          drawJar(st.jar, jx, cy + gh / 2 - jh, jw, jh, dt);
          cx.save(); cx.translate(c, cy); cx.rotate(st.a);
          var hw = gw / 2, hh = gh / 2, neck = 6;
          function bulb(s) { cx.beginPath(); cx.moveTo(-hw, s * hh); cx.bezierCurveTo(-hw, s * hh * 0.3, -neck, s * 12, -neck, 0); cx.lineTo(neck, 0); cx.bezierCurveTo(neck, s * 12, hw, s * hh * 0.3, hw, s * hh); cx.closePath(); }
          /* sand: what is left above, what has fallen below */
          var upper = st.flips % 2 ? 1 : -1;
          cx.save(); bulb(upper); cx.clip(); cx.fillStyle = '#E8D9B5'; var ht = hh * 0.85 * st.top; cx.fillRect(-hw, upper < 0 ? -ht : 0, gw, Math.max(0, ht)); cx.restore();
          cx.save(); bulb(-upper); cx.clip(); cx.fillStyle = '#E8D9B5'; var hb = hh * 0.85 * (1 - st.top); cx.fillRect(-hw, upper < 0 ? hh - hb : -hh, gw, Math.max(0, hb)); cx.restore();
          bulb(-1); cx.lineWidth = 3; cx.strokeStyle = '#0B1F1C'; cx.stroke(); bulb(1); cx.stroke();
          cx.fillStyle = '#0B1F1C'; rr(-hw - 8, -hh - 8, gw + 16, 8, 4); cx.fill(); rr(-hw - 8, hh, gw + 16, 8, 4); cx.fill();
          cx.restore();
          /* each grain through the neck becomes a coin, and rolls into the jar */
          st.falling = st.falling.filter(function (f) {
            f.v += 700 * dt; f.y += f.v * dt; f.spin += dt * 8;
            var t = clamp(f.y / (gh * 0.5), 0, 1), x = c + (jx + jw / 2 - c) * t * t, y = cy + f.y * 0.55;
            if (t >= 1) { st.jar.n += 1; st.jar.bump = 1; return false; }
            coin(x, Math.min(y, cy + gh / 2 - 8), 7, SLATE, f.spin); return true;
          });
        },
        tap: function (x) { if (Math.abs(x - W * 0.5) < W * 0.25) { flip(); } }
      };
      function flip() { st.flips += 1; st.top = 1 - st.top; st.auto = 0; }
    }()),
    /* --------------------------------------------------- the invoices -- */
    invoice: (function () {
      var st = { sheets: [], coins: [], jar: Jar(), next: 0 };
      st.jar.cols = [SLATE, AMBER];
      function send(x) { st.sheets.push({ t: 0, x: x === undefined ? W * 0.2 : clamp(x, 40, W * 0.45), y: H * 0.45, r: (Math.random() - 0.5) * 0.4 }); }
      return {
        draw: function (dt) {
          if (now > st.next) { send(); st.next = now + 2.6; }
          var jx = W * 0.68, jw = Math.min(120, W * 0.24), jh = H * 0.62, jy = H - 14 - jh;
          drawJar(st.jar, jx, jy, jw, jh, dt);
          /* the slope the coins roll down */
          cx.strokeStyle = '#D8DFDC'; cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(W * 0.12, H * 0.72); cx.lineTo(jx - 8, jy - 10); cx.stroke();
          st.sheets = st.sheets.filter(function (s) {
            s.t += dt; var pop = clamp(s.t / 0.35, 0, 1), y = s.y - 30 * Math.sin(pop * Math.PI * 0.5) + (s.t > 1.1 ? (s.t - 1.1) * 60 : 0), a = s.t > 1.1 ? 1 - (s.t - 1.1) / 0.5 : 1;
            if (a <= 0) { return false; }
            cx.save(); cx.globalAlpha = a; cx.translate(s.x, y); cx.rotate(s.r); cx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
            cx.fillStyle = '#fff'; cx.strokeStyle = 'rgba(11,31,28,.25)'; cx.lineWidth = 1.5; rr(-22, -28, 44, 56, 4); cx.fill(); cx.stroke();
            cx.fillStyle = '#C9D3D0'; for (var i = 0; i < 4; i++) { cx.fillRect(-14, -18 + i * 9, i === 3 ? 14 : 28, 3); }
            cx.fillStyle = '#0B1F1C'; cx.font = '800 16px Figtree, system-ui, sans-serif'; cx.textAlign = 'right'; cx.fillText('€', 16, 22);
            cx.restore();
            if (s.t > 0.55 && !s.paid) { s.paid = true; st.coins.push({ x: s.x, y: y + 10, t: 0, col: SLATE, r: 8, spin: 0 }); }
            return true;
          });
          /* your coin rolls down into the jar; Revenue's drops in after it */
          st.coins = st.coins.filter(function (k) {
            k.t += dt; k.spin += dt * 9;
            if (k.drop) { k.vy += 800 * dt; k.y += k.vy * dt; if (k.y > jy + 6) { st.jar.n += 1; st.jar.bump = 1; return false; } coin(k.x, k.y, k.r, k.col, k.spin); return true; }
            var u = clamp(k.t / 1.1, 0, 1), x = k.x + (jx + jw * 0.5 - k.x) * u, y = k.y + (jy - 14 - k.y) * u - Math.sin(u * Math.PI) * 20;
            if (u >= 1) {
              st.jar.n += 1; st.jar.bump = 1;
              st.coins.push({ drop: true, x: jx + jw * (0.35 + Math.random() * 0.3), y: -10, vy: 60, col: AMBER, r: 6.5, spin: 0 });
              return false;
            }
            coin(x, y, k.r, k.col, k.spin); return true;
          });
        },
        tap: function (x) { send(x); }
      };
    }()),
    /* ------------------------------------------------------- the boat -- */
    boat: (function () {
      var st = { side: 0, x: 0, v: 0, ripples: [] };
      return {
        draw: function (dt) {
          var sea = H * 0.62, shoreW = Math.min(110, W * 0.2);
          /* the two shores, named */
          cx.fillStyle = '#E3E8E6'; rr(-20, sea - 12, shoreW + 20, H, 18); cx.fill(); rr(W - shoreW, sea - 12, shoreW + 20, H, 18); cx.fill();
          cx.fillStyle = '#0B1F1C'; cx.font = '800 16px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
          cx.fillText('UK', shoreW / 2, sea - 22); cx.fillText('Ireland', W - shoreW / 2, sea - 22);
          /* the boat crosses on a spring when asked */
          var to = st.side ? W - shoreW - 50 : shoreW + 50;
          if (!st.x) { st.x = to; }
          st.v += (6 * (to - st.x) - 3.2 * st.v) * dt; st.x += st.v * dt;
          /* the sea, and the ripples a pointer leaves on it */
          if (ptr.on && Math.random() < 0.25) { st.ripples.push({ x: ptr.x, born: now }); }
          st.ripples = st.ripples.filter(function (r) { return now - r.born < 1.4; });
          function wave(x) { var y = Math.sin(x * 0.035 + now * 1.6) * 4 + Math.sin(x * 0.09 - now * 2.3) * 2; st.ripples.forEach(function (r) { var a = now - r.born, d = Math.abs(x - r.x); y += Math.sin(d * 0.2 - a * 10) * 5 * Math.exp(-d / 40) * (1 - a / 1.4); }); return sea + y; }
          cx.beginPath(); cx.moveTo(shoreW - 6, H); for (var x = shoreW - 6; x <= W - shoreW + 6; x += 4) { cx.lineTo(x, wave(x)); } cx.lineTo(W - shoreW + 6, H); cx.closePath();
          var g = cx.createLinearGradient(0, sea - 6, 0, H); g.addColorStop(0, '#9FDCD2'); g.addColorStop(1, '#6CC3B5'); cx.fillStyle = g; cx.fill();
          /* the boat, its chest of coins, bobbing on the water under it */
          var bx = st.x, by = wave(bx) - 6, tilt = Math.atan2(wave(bx + 12) - wave(bx - 12), 24) + clamp(st.v / 900, -0.15, 0.15);
          cx.save(); cx.translate(bx, by); cx.rotate(tilt);
          cx.fillStyle = '#0B1F1C'; cx.beginPath(); cx.moveTo(-42, -6); cx.lineTo(42, -6); cx.lineTo(30, 14); cx.lineTo(-30, 14); cx.closePath(); cx.fill();
          cx.fillStyle = '#fff'; cx.fillRect(-2, -58, 4, 52);
          cx.beginPath(); cx.moveTo(2, -56); cx.lineTo(32 * (st.v >= 0 ? 1 : 0.8), -18); cx.lineTo(2, -18); cx.closePath(); cx.fillStyle = MARK; cx.fill();
          cx.fillStyle = '#8A5A2B'; rr(-30, -24, 26, 18, 3); cx.fill();
          for (var i = 0; i < 3; i++) { coin(-25 + i * 8, -26 - (i % 2) * 3, 4.5, AMBER, now * 2 + i); }
          cx.restore();
        },
        tap: function () { st.side = 1 - st.side; }
      };
    }()),
    /* ------------------------------------------------------- the pipe -- */
    pipe: (function () {
      var st = { coins: [], jar: Jar(), next: 0, burst: 0, lit: 0 };
      return {
        draw: function (dt) {
          var bw = Math.min(110, W * 0.22), bh = H * 0.66, bx = W * 0.1, by = H - 14 - bh;
          var jw = Math.min(120, W * 0.24), jh = H * 0.62, jx = W * 0.9 - jw, jy = H - 14 - jh;
          /* the company: a building whose windows light as it pays */
          st.lit = Math.max(0, st.lit - dt * 2);
          cx.fillStyle = '#0B1F1C'; rr(bx, by, bw, bh, 8); cx.fill();
          for (var r = 0; r < 4; r++) { for (var c = 0; c < 3; c++) { var on = ((r * 3 + c + Math.floor(now * 2)) % 5 === 0) || st.lit > 0.2; cx.fillStyle = on ? '#7FE3D3' : '#2C3B38'; cx.fillRect(bx + 14 + c * (bw - 28) / 3, by + 14 + r * (bh - 28) / 4, (bw - 28) / 3 - 8, (bh - 28) / 4 - 10); } }
          drawJar(st.jar, jx, jy, jw, jh, dt);
          /* the pipe between them */
          var p0 = [bx + bw, by + bh * 0.3], p1 = [(bx + bw + jx) / 2, by - 30], p2 = [jx + jw / 2, jy - 16];
          cx.lineCap = 'round'; cx.strokeStyle = '#E3E8E6'; cx.lineWidth = 22; cx.beginPath(); cx.moveTo(p0[0], p0[1]); cx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); cx.stroke();
          cx.strokeStyle = 'rgba(11,31,28,.12)'; cx.lineWidth = 2; cx.setLineDash([3, 7]); cx.stroke(); cx.setLineDash([]);
          if (now > st.next) { st.coins.push({ t: 0, spin: 0 }); st.next = now + (now < st.burst ? 0.09 : 0.7); }
          st.coins = st.coins.filter(function (k) {
            k.t += dt / 1.1; k.spin += dt * 8; if (k.t >= 1) { st.jar.n += 1; st.jar.bump = 1; return false; }
            var u = k.t, v = 1 - u, x = v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], y = v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1];
            coin(x, y, 7, u > 0.6 ? SLATE : INK, k.spin); return true;
          });
        },
        tap: function (x) { if (x < W * 0.45) { st.burst = now + 1.2; st.lit = 1; st.next = 0; } }
      };
    }())
  }[KIND];

  function frame(ms) {
    raf = 0; var t = ms / 1000, dt = clamp(t - last, 0, 1 / 30); last = t; now = t;
    if (!W) { size(); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (W > 120 && H > 100) { S.draw(dt); }
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function wake() { if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  cv.addEventListener('pointermove', function (e) { var b = cv.getBoundingClientRect(); ptr.x = e.clientX - b.left; ptr.y = e.clientY - b.top; ptr.on = e.pointerType !== 'touch'; });
  cv.addEventListener('pointerleave', function () { ptr.on = false; });
  cv.addEventListener('click', function (e) { var b = cv.getBoundingClientRect(); S.tap(e.clientX - b.left, e.clientY - b.top); hint.classList.add('pb-off'); wake(); });
  new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { W = 0; wake(); } }).observe(cv);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', wake); window.addEventListener('focus', wake); document.addEventListener('resume', wake);
  window.addEventListener('resize', function () { W = 0; });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; }); }
}());
