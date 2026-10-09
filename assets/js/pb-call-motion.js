/* "How a call works", alive (9 October 2026, Damian's brief: go all out).
   The three steps stay exactly as written (build check 45 holds their words
   and no pictures in the markup); this adds, by script only, a path that
   draws itself through them as you scroll, a traveller on it, and a short
   film above each step:

     1. You reach out    a calendar: a paw taps a time, it fills, and a paper
                         plane takes off toward step 2
     2. We talk it through   you and Damian, speech bubbles taking turns,
                         round a twenty-minute dial
     3. You decide       a road comes to a fork; the paw stops, thinks, takes
                         its way, and a tick draws itself with a burst

   Each step lifts into place, and its number pops, when the path reaches it.
   Hover a step and its film quickens; click it and the film starts again
   from the top. With motion turned off none of this is added. */
(function () {
  'use strict';
  var root = document.documentElement;
  var sec = document.getElementById('call'), wrap = sec && sec.querySelector('.steps');
  if (!wrap || !root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  var steps = [].slice.call(wrap.querySelectorAll('.step'));
  if (steps.length !== 3) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function ease(k) { k = clamp(k, 0, 1); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  wrap.classList.add('pb-cs');

  /* -------------------------------------------------- the path and the paw -- */
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'pb-cs-svg'); svg.setAttribute('aria-hidden', 'true');
  var track = document.createElementNS(NS, 'path'); track.setAttribute('class', 'pb-cs-track');
  var ink = document.createElementNS(NS, 'path'); ink.setAttribute('class', 'pb-cs-ink');
  svg.appendChild(track); svg.appendChild(ink); wrap.insertBefore(svg, wrap.firstChild);
  var walker = document.createElement('span'); walker.className = 'pb-cs-walker'; walker.setAttribute('aria-hidden', 'true');
  walker.innerHTML = '<svg viewBox="0 0 64 64"><g fill="#fff"><ellipse cx="23.2" cy="17.6" rx="6.1" ry="8.3" transform="rotate(-9 23.2 17.6)"/><ellipse cx="40.8" cy="17.6" rx="6.1" ry="8.3" transform="rotate(9 40.8 17.6)"/><ellipse cx="9.8" cy="28.6" rx="5.5" ry="7.4" transform="rotate(-31 9.8 28.6)"/><ellipse cx="54.2" cy="28.6" rx="5.5" ry="7.4" transform="rotate(31 54.2 28.6)"/><path d="M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z"/></g></svg>';
  wrap.appendChild(walker);
  var len = 1, at = [0, 0.5, 1];
  function layout() {
    var b = wrap.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    var pts = steps.map(function (s) { var r = s.querySelector('.sx').getBoundingClientRect(); return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top }; });
    var d = 'M ' + pts[0].x + ' ' + pts[0].y, vertical = Math.abs(pts[1].y - pts[0].y) > Math.abs(pts[1].x - pts[0].x);
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i - 1], q = pts[i];
      if (vertical) {
        /* one column: out to the margin, down beside the words, back in to the next number */
        var mx = Math.max(14, Math.min(p.x, q.x) - 44);   /* the lane the steps are indented for */
        d += ' C ' + (p.x - 20) + ' ' + p.y + ', ' + mx + ' ' + (p.y + 10) + ', ' + mx + ' ' + (p.y + 50) +
             ' L ' + mx + ' ' + (q.y - 50) + ' C ' + mx + ' ' + (q.y - 10) + ', ' + (q.x - 20) + ' ' + q.y + ', ' + q.x + ' ' + q.y;
      } else {
        /* a row: along the line of the numbers, with a gentle wave */
        var lift = (i % 2 ? -1 : 1) * 16;
        d += ' C ' + (p.x + (q.x - p.x) * 0.35) + ' ' + (p.y + lift) + ', ' + (q.x - (q.x - p.x) * 0.35) + ' ' + (q.y - lift) + ', ' + q.x + ' ' + q.y;
      }
    }
    track.setAttribute('d', d); ink.setAttribute('d', d);
    len = ink.getTotalLength() || 1;
    ink.style.strokeDasharray = len + ' ' + len;
    /* where each step's number sits along the path */
    at = pts.map(function (pt) { var best = 0, bd = 1e9; for (var s = 0; s <= 60; s++) { var q = ink.getPointAtLength(len * s / 60), dd = Math.hypot(q.x - pt.x, q.y - pt.y); if (dd < bd) { bd = dd; best = s / 60; } } return best; });
  }

  /* ---------------------------------------------------------- the films -- */
  var films = steps.map(function (s, i) {
    var cv = document.createElement('canvas'); cv.className = 'pb-cs-film'; cv.setAttribute('aria-hidden', 'true');
    s.insertBefore(cv, s.firstChild);
    s.classList.add('pb-cs-step');
    var f = { el: s, cv: cv, cx: cv.getContext('2d'), t0: 0, speed: 1, local: 0, on: false, sparks: [], W: 0, H: 0 };
    s.addEventListener('pointerenter', function () { f.speed = 1.8; });
    s.addEventListener('pointerleave', function () { f.speed = 1; });
    s.addEventListener('click', function () { f.local = 0; burst(f, f.W / 2, f.H / 2, 16); s.classList.remove('pb-cs-pop'); void s.offsetWidth; s.classList.add('pb-cs-pop'); });
    return f;
  });
  function size(f) { var b = f.cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); f.W = b.width; f.H = b.height; f.d = d; f.cv.width = Math.round(f.W * d); f.cv.height = Math.round(f.H * d); }
  function rr(cx, x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  function paw(cx, x, y, s, col, a) {
    if (!PAD) { return; } cx.save(); cx.translate(x, y); cx.rotate(a || 0); var k = s / 64; cx.scale(k, k); cx.translate(-32, -36); cx.fillStyle = col;
    TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); }); cx.fill(PAD); cx.restore();
  }
  function burst(f, x, y, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, v = 90 + Math.random() * 200; f.sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, age: 0, c: ['#0B1F1C', '#586B85', '#F4B740', '#14CBB1'][i % 4], r: 2 + Math.random() * 3 }); } }
  var INK = '#0B1F1C', SLATE = '#586B85', LINE = '#E1E7E5';

  /* 1. a calendar, a tap, a plane (a 4.6 s loop) */
  function film1(f, t, cx, W, H) {
    var cw = Math.min(150, W * 0.62), ch = 96, x0 = W / 2 - cw / 2 - 18, y0 = (H - ch) / 2 + 6;
    rr(cx, x0, y0, cw, ch, 12); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = LINE; cx.stroke();
    rr(cx, x0, y0, cw, 22, 12); cx.fillStyle = INK; cx.fill(); cx.fillRect(x0, y0 + 12, cw, 10);
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x0 + 22, y0 - 1, 3.5, 0, Math.PI * 2); cx.arc(x0 + cw - 22, y0 - 1, 3.5, 0, Math.PI * 2); cx.fill();
    var cols = 4, rows = 3, gw = (cw - 20) / cols, gh = (ch - 34) / rows, pick = 6, px = 0, py = 0;
    for (var i = 0; i < cols * rows; i++) {
      var c = i % cols, r = Math.floor(i / cols), sx = x0 + 10 + c * gw, sy = y0 + 28 + r * gh;
      var fill = i === pick ? ease((t - 1.5) / 0.3) * (t < 4.2 ? 1 : 1 - (t - 4.2) / 0.4) : 0;
      rr(cx, sx + 2, sy + 2, gw - 4, gh - 4, 4); cx.fillStyle = fill > 0 ? 'rgba(11,31,28,' + (0.08 + 0.92 * fill).toFixed(2) + ')' : '#F1F4F3'; cx.fill();
      if (i === pick) { px = sx + gw / 2; py = sy + gh / 2; if (fill > 0.6) { cx.strokeStyle = '#fff'; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(px - 5, py); cx.lineTo(px - 1, py + 4); cx.lineTo(px + 6, py - 4); cx.stroke(); } }
    }
    /* the paw comes in, taps, leaves */
    var k = t < 1.4 ? ease(t / 1.4) : t < 2.2 ? 1 : 1 - ease((t - 2.2) / 0.8);
    var hx = W + 10 + (px - W - 10) * k, hy = H + 10 + (py + 10 - H - 10) * k, press = t > 1.35 && t < 1.65 ? 0.85 : 1;
    if (t > 1.45 && t < 2.1) { cx.strokeStyle = 'rgba(11,31,28,' + (0.5 * (1 - (t - 1.45) / 0.65)).toFixed(2) + ')'; cx.lineWidth = 2; cx.beginPath(); cx.arc(px, py, 6 + (t - 1.45) * 40, 0, Math.PI * 2); cx.stroke(); }
    paw(cx, hx, hy, 26 * press, SLATE, -0.4);
    /* the plane: off the card, a dashed trail, away to the right */
    if (t > 2.4) {
      var q = ease((t - 2.4) / 1.6), ax = x0 + cw - 10, ay = y0 + 10, bx = W + 30, by = 8;
      var mx = ax + 40, my = ay - 60, u = 1 - q, x = u * u * ax + 2 * u * q * mx + q * q * bx, y = u * u * ay + 2 * u * q * my + q * q * by;
      cx.save(); cx.setLineDash([3, 5]); cx.strokeStyle = 'rgba(88,107,133,.6)'; cx.lineWidth = 2; cx.beginPath();
      for (var s2 = 0; s2 <= q; s2 += 0.04) { var uu = 1 - s2; cx.lineTo(uu * uu * ax + 2 * uu * s2 * mx + s2 * s2 * bx, uu * uu * ay + 2 * uu * s2 * my + s2 * s2 * by); }
      cx.stroke(); cx.restore();
      var ang = Math.atan2(2 * (1 - q) * (my - ay) + 2 * q * (by - my), 2 * (1 - q) * (mx - ax) + 2 * q * (bx - mx));
      cx.save(); cx.translate(x, y); cx.rotate(ang); cx.fillStyle = INK; cx.beginPath(); cx.moveTo(12, 0); cx.lineTo(-9, -8); cx.lineTo(-4, 0); cx.lineTo(-9, 8); cx.closePath(); cx.fill();
      cx.fillStyle = SLATE; cx.beginPath(); cx.moveTo(12, 0); cx.lineTo(-4, 0); cx.lineTo(-9, 8); cx.closePath(); cx.fill(); cx.restore();
    }
  }
  /* 2. two of you, taking turns, round twenty minutes (a 6 s loop) */
  function film2(f, t, cx, W, H) {
    var cy = H / 2 + 6, R = Math.min(52, H * 0.42), mx = W / 2;
    /* the dial: twenty minutes going round */
    cx.lineWidth = 6; cx.strokeStyle = '#EEF2F1'; cx.beginPath(); cx.arc(mx, cy, R, 0, Math.PI * 2); cx.stroke();
    var sweep = (t / 6) * Math.PI * 2; cx.strokeStyle = SLATE; cx.lineCap = 'round'; cx.beginPath(); cx.arc(mx, cy, R, -Math.PI / 2, -Math.PI / 2 + sweep); cx.stroke();
    cx.fillStyle = INK; cx.font = '800 15px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('20', mx, cy - 6);
    cx.fillStyle = '#54635F'; cx.font = '600 12px Figtree, system-ui, sans-serif'; cx.fillText('minutes', mx, cy + 10);
    /* the two of you either side */
    var ax = mx - R - 34, bx = mx + R + 34;
    [[ax, 'You', '#54635F'], [bx, 'D', INK]].forEach(function (p, i) {
      var talk = Math.floor(t / 1.5) % 2 === i, bob = talk ? Math.sin(t * 14) * 1.5 : 0;
      cx.fillStyle = p[2]; cx.beginPath(); cx.arc(p[0], cy + 12 + bob, 17, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = '#fff'; cx.font = '800 ' + (i ? 15 : 11) + 'px Figtree, system-ui, sans-serif'; cx.fillText(p[1], p[0], cy + 12 + bob);
      /* the bubble: dots, then lines, as each takes a turn */
      var k = (t % 1.5) / 1.5;
      if (talk) {
        var bw = 46, bh = 28, bxx = p[0] - bw / 2 + (i ? -14 : 14), byy = cy - 40, pop = ease(k * 4);
        cx.save(); cx.translate(bxx + bw / 2, byy + bh / 2); cx.scale(pop, pop); cx.translate(-(bxx + bw / 2), -(byy + bh / 2));
        rr(cx, bxx, byy, bw, bh, 10); cx.fillStyle = i ? INK : '#fff'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = i ? INK : LINE; cx.stroke();
        cx.fillStyle = i ? '#fff' : SLATE;
        if (k < 0.45) { for (var d = 0; d < 3; d++) { cx.beginPath(); cx.arc(bxx + 14 + d * 9, byy + bh / 2 + Math.sin(t * 12 + d) * 2, 2.6, 0, Math.PI * 2); cx.fill(); } }
        else { cx.fillRect(bxx + 9, byy + 8, bw - 18, 3.5); cx.fillRect(bxx + 9, byy + 16, (bw - 18) * 0.6, 3.5); }
        cx.restore();
      }
    });
  }
  /* 3. a fork in the road, a choice, a tick (a 5 s loop) */
  function film3(f, t, cx, W, H) {
    var bx = W / 2, by = H - 8, fy = H * 0.52, lx = bx - 70, rx = bx + 70, ty = 22;
    cx.lineCap = 'round'; cx.lineWidth = 14; cx.strokeStyle = '#EEF2F1';
    cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(bx, fy); cx.quadraticCurveTo(bx, fy - 24, lx, ty); cx.moveTo(bx, fy); cx.quadraticCurveTo(bx, fy - 24, rx, ty); cx.stroke();
    cx.lineWidth = 2; cx.setLineDash([6, 8]); cx.strokeStyle = '#C9D3D0'; cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(bx, fy); cx.quadraticCurveTo(bx, fy - 24, lx, ty); cx.moveTo(bx, fy); cx.quadraticCurveTo(bx, fy - 24, rx, ty); cx.stroke(); cx.setLineDash([]);
    /* the paw walks up, stops at the fork, thinks, takes the right-hand road */
    var px, py, a = 0;
    if (t < 1.2) { var k = ease(t / 1.2); px = bx; py = by - 6 + (fy - by + 6) * k; }
    else if (t < 2.2) { px = bx; py = fy; }
    else { var q = ease((t - 2.2) / 1.1), u = 1 - q; px = u * u * bx + 2 * u * q * bx + q * q * rx; py = u * u * fy + 2 * u * q * (fy - 24) + q * q * ty; a = 0.6 * q; }
    if (t > 1.2 && t < 2.2) { var th = Math.sin((t - 1.2) / 1 * Math.PI); cx.save(); cx.globalAlpha = th; cx.fillStyle = INK; cx.font = '800 18px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.fillText('?', bx + 20, fy - 18); cx.restore(); }
    paw(cx, px, py, 22, SLATE, a);
    /* the tick, at the end of the road */
    if (t > 3.2) {
      var k2 = clamp((t - 3.2) / 0.5, 0, 1), cxx = rx, cyy = ty + 6, R = 15 * ease(k2 * 1.4);
      cx.fillStyle = INK; cx.beginPath(); cx.arc(cxx, cyy, Math.max(0, R), 0, Math.PI * 2); cx.fill();
      var s = clamp((t - 3.45) / 0.35, 0, 1);
      if (s > 0) { cx.strokeStyle = '#fff'; cx.lineWidth = 3; cx.lineJoin = 'round'; cx.beginPath(); cx.moveTo(cxx - 6, cyy); cx.lineTo(cxx - 6 + 4 * Math.min(1, s * 2), cyy + 4 * Math.min(1, s * 2)); if (s > 0.5) { cx.lineTo(cxx - 2 + 9 * (s - 0.5) * 2, cyy + 4 - 9 * (s - 0.5) * 2); } cx.stroke(); }
      if (!f.burst3 && t > 3.5) { f.burst3 = true; burst(f, cxx, cyy, 18); }
    }
    if (t < 1) { f.burst3 = false; }
  }
  var FILMS = [[film1, 4.6], [film2, 6], [film3, 5]];

  /* ------------------------------------------------------------- loop -- */
  var raf = 0, last = 0, onScreen = false, shown = 0, prog = 0;
  function progress() {
    var b = wrap.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh * 0.88 - b.top) / (b.height + vh * 0.25), 0, 1);
  }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    /* the path follows the scroll on a spring */
    var want = progress(); prog += (want - prog) * Math.min(1, dt * 7);
    ink.style.strokeDashoffset = (len * (1 - prog)).toFixed(1);
    var pt = ink.getPointAtLength(len * prog), ahead = ink.getPointAtLength(Math.min(len, len * prog + 2));
    walker.style.transform = 'translate(' + pt.x.toFixed(1) + 'px,' + pt.y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 57.3 + 90).toFixed(1) + 'deg)';
    walker.classList.toggle('pb-on', prog > 0.01 && prog < 0.995);
    films.forEach(function (f, i) {
      var on = prog >= at[i] - 0.02;
      if (on && !f.on) { f.on = true; f.local = 0; f.el.classList.add('pb-cs-on'); }
      if (!f.W) { size(f); }
      if (!f.on) { f.cx.setTransform(f.d, 0, 0, f.d, 0, 0); f.cx.clearRect(0, 0, f.W, f.H); return; }
      f.local += dt * f.speed;
      var spec = FILMS[i], t = f.local % spec[1];
      f.cx.setTransform(f.d, 0, 0, f.d, 0, 0); f.cx.clearRect(0, 0, f.W, f.H);
      f.cx.save(); spec[0](f, t, f.cx, f.W, f.H); f.cx.restore();
      f.sparks = f.sparks.filter(function (p) { p.age += dt; if (p.age > 0.8) { return false; } p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; f.cx.globalAlpha = 1 - p.age / 0.8; f.cx.fillStyle = p.c; f.cx.beginPath(); f.cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); f.cx.fill(); f.cx.globalAlpha = 1; return true; });
    });
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function wake() { if (!raf && onScreen) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { layout(); wake(); } }).observe(sec); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { wake(); } });
  window.addEventListener('resize', function () { films.forEach(function (f) { f.W = 0; }); layout(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(layout); }
  layout();
}());
