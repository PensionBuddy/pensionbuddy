/* All your pensions, in one view, alive (8 October 2026, Damian's brief).
   On top of my-pensions.html's own script, which still adds the pots up
   (assets/js/pots.js) and draws the ring; this reads the same rows.

   Each pension becomes a pot: a bubble whose area is its share of the total,
   floating round the ring and tied by a string to its own slice of it.

   - type a value and its pot swells to its new size; add a pension and a pot
     drops in from above; remove one and it pops;
   - a pot is in the shade of its own row, with its name and value on it;
     filling in a row makes its pot pulse;
   - grab a pot and throw it: it bounces off the others and floats back to
     its place by its slice; click one and its row's value box takes focus;
   - before anything is typed, three dashed pots wait, as examples of the
     kinds people bring: from a job, a PRSA, top-ups.

   Nothing here works out a figure. With motion turned off it is not drawn,
   and the ring shows as before. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame || !window.PBPots) { return; }
  var ring = document.querySelector('.pt-ring'), form = document.getElementById('ptForm'), list = document.getElementById('ptRows');
  if (!ring || !form || !list) { return; }
  var Pots = window.PBPots, euro = window.PBPage ? window.PBPage.euro : function (v) { return '€' + Math.round(v).toLocaleString('en-IE'); };
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function $(id) { return document.getElementById(id); }

  /* the stage: a box round the ring, with room for the pots */
  var orbit = document.createElement('div'); orbit.className = 'pt-orbit';
  ring.parentNode.insertBefore(orbit, ring); orbit.appendChild(ring);
  var cv = document.createElement('canvas'); cv.className = 'pt-orbit-cv'; cv.setAttribute('aria-hidden', 'true');
  orbit.appendChild(cv);
  var cx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, C = { x: 0, y: 0 }, RR = 100;
  function size() {
    var b = orbit.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var rb = ring.getBoundingClientRect(); C = { x: rb.left - b.left + rb.width / 2, y: rb.top - b.top + rb.height / 2 };
    RR = rb.width / 2 * (56 / 60);   /* the ring's outer edge: radius 48 + half its 16 stroke, in a 120 box */
  }

  /* the rows, read as the page reads them */
  function rows() { return [].slice.call(list.querySelectorAll('.pt-row')); }
  function read() {
    var out = [];
    rows().forEach(function (r, i) {
      var v = Pots.amount($('ptValue' + i) && $('ptValue' + i).value);
      if (v === v && v > 0) {
        var kind = $('ptKind' + i).value, k = Pots.KINDS.filter(function (x) { return x[0] === kind; })[0];
        out.push({ row: i, el: r, value: v, name: ($('ptName' + i).value || '').trim() || (k ? k[1].replace(/ \(.*\)$/, '') : 'Pension ' + (i + 1)) });
      }
    });
    return out.slice(0, Pots.MAX);
  }
  var SHADES = [1, 0.72, 0.5, 0.34, 0.22];

  /* ------------------------------------------------------------ pots -- */
  var pots = [], pops = [], ghosts = [], focusRow = -1, drag = null, now = 0;
  function byEl(el) { return pots.filter(function (p) { return p.el === el && !p.gone; })[0]; }
  function sync() {
    var kept = read(), total = kept.reduce(function (s, k) { return s + k.value; }, 0), at = 0;
    var Rmax = clamp(Math.min(W, H) * 0.2, 34, 66);
    kept.forEach(function (k) {
      var share = total ? k.value / total : 0, mid = at + share / 2; at += share;
      var p = byEl(k.el);
      if (!p) {
        p = { el: k.el, x: C.x + (Math.random() - 0.5) * 60, y: -40, vx: 0, vy: 0, r: 0, vr: 0, born: now, gone: 0 };
        pots.push(p);
      }
      p.row = k.row; p.name = k.name; p.value = k.value; p.share = share;
      p.R = Math.max(16, Math.sqrt(share) * Rmax * (kept.length === 1 ? 1 : 1.25));
      /* its place: out from the middle of its slice (the ring starts at the top, clockwise) */
      p.ang = -Math.PI / 2 + mid * Math.PI * 2;
    });
    pots.forEach(function (p) {
      if (p.gone) { return; }
      if (!kept.some(function (k) { return k.el === p.el; })) {
        p.gone = now;
        for (var i = 0; i < 14; i++) { var a = Math.random() * 6.28, v = 120 + Math.random() * 220; pops.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, born: now, s: 4 + Math.random() * 5 }); }
      }
    });
    wake();
  }
  function home(p) {
    var d = RR + 16 + p.R;
    return { x: C.x + Math.cos(p.ang) * d, y: C.y + Math.sin(p.ang) * d };
  }

  /* ------------------------------------------------------------ step -- */
  function physics(dt) {
    var live = pots.filter(function (p) { return !p.gone; });
    live.forEach(function (p) {
      /* the size springs to its new value */
      var ar = 200 * (p.R - p.r) - 14 * p.vr; p.vr += ar * dt; p.r += p.vr * dt;
      if (p === (drag && drag.p)) { return; }
      var h = home(p), k = 26, c = 6;
      p.vx += (k * (h.x - p.x) - c * p.vx) * dt; p.vy += (k * (h.y - p.y) - c * p.vy) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      /* keep inside the stage */
      if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx) * 0.6; } if (p.x > W - p.r) { p.x = W - p.r; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y > H - p.r) { p.y = H - p.r; p.vy = -Math.abs(p.vy) * 0.6; }
      if (p.y < p.r && now - p.born > 1) { p.y = p.r; p.vy = Math.abs(p.vy) * 0.6; }
      /* and off the ring */
      var dx = p.x - C.x, dy = p.y - C.y, d = Math.sqrt(dx * dx + dy * dy) || 1, min = RR + 6 + p.r;
      if (d < min) { p.x = C.x + dx / d * min; p.y = C.y + dy / d * min; var vn = (p.vx * dx + p.vy * dy) / d; if (vn < 0) { p.vx -= 1.6 * vn * dx / d; p.vy -= 1.6 * vn * dy / d; } }
    });
    /* off each other */
    for (var i = 0; i < live.length; i++) {
      for (var j = i + 1; j < live.length; j++) {
        var a = live[i], b = live[j], dx2 = b.x - a.x, dy2 = b.y - a.y, d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1, m = a.r + b.r + 4;
        if (d2 < m) {
          var nx = dx2 / d2, ny = dy2 / d2, push = (m - d2) / 2, ad = a === (drag && drag.p), bd = b === (drag && drag.p);
          if (!ad) { a.x -= nx * push * (bd ? 2 : 1); a.y -= ny * push * (bd ? 2 : 1); }
          if (!bd) { b.x += nx * push * (ad ? 2 : 1); b.y += ny * push * (ad ? 2 : 1); }
          var rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) { var imp = -rel * 0.8; if (!ad) { a.vx -= nx * imp; a.vy -= ny * imp; } if (!bd) { b.vx += nx * imp; b.vy += ny * imp; } }
        }
      }
    }
  }

  /* ------------------------------------------------------------ draw -- */
  function bubble(p, alpha) {
    var o = SHADES[p.row % SHADES.length], r = Math.max(0, p.r);
    if (r < 1) { return; }
    var pulse = p.row === focusRow ? 1 + Math.sin(now * 6) * 0.04 : 1;
    cx.save(); cx.globalAlpha = alpha; cx.translate(p.x, p.y); cx.scale(pulse, pulse);
    cx.shadowColor = 'rgba(11,31,28,.18)'; cx.shadowBlur = 16; cx.shadowOffsetY = 6;
    cx.beginPath(); cx.arc(0, 0, r, 0, Math.PI * 2);
    cx.fillStyle = 'rgba(88,107,133,' + o + ')'; cx.fill();
    cx.shadowColor = 'transparent';
    if (p.row === focusRow) { cx.lineWidth = 3; cx.strokeStyle = '#14CBB1'; cx.stroke(); }
    /* a highlight, so it reads as a pot and not a dot */
    cx.beginPath(); cx.arc(-r * 0.35, -r * 0.38, r * 0.22, 0, Math.PI * 2); cx.fillStyle = 'rgba(255,255,255,.28)'; cx.fill();
    var ink = o >= 0.5 ? '#fff' : '#0B1F1C';
    cx.fillStyle = ink; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    if (r > 26) {
      var n = p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name;
      cx.font = '600 ' + clamp(r * 0.27, 10, 14) + 'px Figtree, system-ui, sans-serif'; cx.fillText(n, 0, -r * 0.2);
      cx.font = '700 ' + clamp(r * 0.32, 11, 17) + 'px Figtree, system-ui, sans-serif'; cx.fillText(euro(p.value), 0, r * 0.22);
    } else {
      cx.font = '700 11px Figtree, system-ui, sans-serif'; cx.fillText(Math.round(p.share * 100) + '%', 0, 1);
    }
    cx.restore();
  }
  function draw() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var live = pots.filter(function (p) { return !p.gone; });
    /* the waiting pots, before anything is typed */
    var gA = live.length ? Math.max(0, 1 - (now - (live[0].born || 0)) * 3) : 1;
    if (gA > 0) {
      ghosts.forEach(function (g, i) {
        var a = -Math.PI / 2 + (i - 1) * 0.9, d = RR + 16 + g.r, x = C.x + Math.cos(a) * d * 1.02, y = C.y + Math.sin(a) * d + Math.sin(now * 1.6 + i * 2) * 5;
        if (i === 1) { y = C.y + RR + 16 + g.r + Math.sin(now * 1.6 + 2) * 5; x = C.x; }
        cx.save(); cx.globalAlpha = gA; cx.setLineDash([5, 5]); cx.lineWidth = 2; cx.strokeStyle = 'rgba(88,107,133,.45)';
        cx.beginPath(); cx.arc(x, y, g.r, 0, Math.PI * 2); cx.stroke();
        cx.fillStyle = 'rgba(88,107,133,.75)'; cx.font = '600 12px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText(g.t, x, y); cx.restore();
      });
    }
    /* strings: each pot to the middle of its slice, on the ring's outer edge */
    live.forEach(function (p) {
      if (p.r < 2) { return; }
      var ex = C.x + Math.cos(p.ang) * RR, ey = C.y + Math.sin(p.ang) * RR;
      var mx = (ex + p.x) / 2 + Math.sin(now * 2 + p.row) * 4, my = (ey + p.y) / 2 + 8;
      cx.save(); cx.strokeStyle = 'rgba(88,107,133,' + (0.35 * SHADES[p.row % SHADES.length] + 0.2) + ')'; cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(ex, ey); cx.quadraticCurveTo(mx, my, p.x, p.y); cx.stroke(); cx.restore();
    });
    live.forEach(function (p) { bubble(p, 1); });
    /* the ones going: a quick pop */
    pots.filter(function (p) { return p.gone; }).forEach(function (p) {
      var k = (now - p.gone) / 0.22; if (k < 1) { var s = { row: p.row, x: p.x, y: p.y, r: p.r * (1 + k * 0.4), name: p.name, value: p.value, share: p.share }; bubble(s, 1 - k); }
    });
    pots = pots.filter(function (p) { return !p.gone || now - p.gone < 0.25; });
    pops = pops.filter(function (q) {
      var a = now - q.born; if (a > 0.6) { return false; }
      q.x += q.vx / 60; q.y += q.vy / 60; q.vy += 8;
      cx.save(); cx.globalAlpha = 1 - a / 0.6; cx.fillStyle = '#586B85'; cx.beginPath(); cx.arc(q.x, q.y, q.s * (1 - a / 0.6), 0, Math.PI * 2); cx.fill(); cx.restore();
      return true;
    });
  }

  /* ------------------------------------------------------------ loop -- */
  var raf = 0, last = 0, calm = 0;
  function frame(ms) {
    raf = 0; now = ms / 1000;
    var dt = clamp(now - last, 0, 1 / 30); last = now;
    for (var i = 0; i < 3; i++) { physics(dt / 3); }
    draw();
    var moving = pots.some(function (p) { return Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.vr) > 3 || p.gone; }) || pops.length || drag || focusRow >= 0 ||
      !pots.some(function (p) { return !p.gone; });
    calm = moving ? 0 : calm + dt;
    if (calm < 0.5) { raf = requestAnimationFrame(frame); }
  }
  function wake() { calm = 0; if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }

  /* ----------------------------------------------------------- touch -- */
  function hit(e) {
    var b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    var live = pots.filter(function (p) { return !p.gone; });
    for (var i = live.length - 1; i >= 0; i--) { var p = live[i], dx = x - p.x, dy = y - p.y; if (dx * dx + dy * dy <= p.r * p.r) { return { p: p, x: x, y: y }; } }
    return null;
  }
  orbit.addEventListener('pointermove', function (e) {
    if (drag && e.pointerId === drag.id) {
      var b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, t = performance.now() / 1000, dt = Math.max(0.008, t - drag.t);
      drag.p.vx = (x - drag.lx) / dt; drag.p.vy = (y - drag.ly) / dt;
      drag.p.x = x - drag.ox; drag.p.y = y - drag.oy; drag.lx = x; drag.ly = y; drag.t = t; drag.moved = true;
      wake(); return;
    }
    orbit.classList.toggle('pt-orbit-hot', !!hit(e));
  });
  orbit.addEventListener('pointerdown', function (e) {
    var h = hit(e); if (!h) { return; }
    e.preventDefault();
    drag = { id: e.pointerId, p: h.p, ox: h.x - h.p.x, oy: h.y - h.p.y, lx: h.x, ly: h.y, t: performance.now() / 1000, moved: false };
    try { orbit.setPointerCapture(e.pointerId); } catch (x) {}
    orbit.classList.add('pt-orbit-drag'); wake();
  });
  function up(e) {
    if (!drag || e.pointerId !== drag.id) { return; }
    var p = drag.p, moved = drag.moved; drag = null; orbit.classList.remove('pt-orbit-drag');
    p.vx = clamp(p.vx, -2400, 2400); p.vy = clamp(p.vy, -2400, 2400);
    if (!moved) { var v = $('ptValue' + p.row); if (v) { v.focus(); } }
    wake();
  }
  orbit.addEventListener('pointerup', up); orbit.addEventListener('pointercancel', up);

  /* --------------------------------------------------------- wiring -- */
  ghosts = [{ t: 'From a job', r: 40 }, { t: 'A PRSA', r: 32 }, { t: 'Top-ups', r: 26 }];
  form.addEventListener('input', function () { setTimeout(sync, 0); });
  form.addEventListener('change', function () { setTimeout(sync, 0); });
  form.addEventListener('click', function (e) { if (e.target.closest('#ptAdd,.pt-x')) { setTimeout(sync, 0); } });
  list.addEventListener('focusin', function (e) { var r = e.target.closest('.pt-row'); focusRow = r ? rows().indexOf(r) : -1; wake(); });
  list.addEventListener('focusout', function () { focusRow = -1; wake(); });
  orbit.classList.add('pt-orbit-on');
  size(); sync();
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); sync(); }, 120); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { size(); wake(); }); }
}());
