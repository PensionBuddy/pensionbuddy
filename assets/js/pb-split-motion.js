/* The director calculator's split, alive (9 October 2026, Damian's brief):
   "Salary or pension: how to split it" as a machine. It copies the figures
   the page's own script writes and works nothing out.

   Coins pour out of the company and fall to a valve. The valve is the
   split: the share the slider sends into your pension goes right, down to
   the pension jar, and lands whole. The rest goes left, through the tax
   gate: every coin is cut there, and the wedge the page's rates take (the
   settled figures in its own "every step" table) flies off to the bin for
   income tax, USC and PRSI; what is left drops into take-home pay.

   The three jars always hold the company's whole payment between them, on
   one scale. The dashed line in the tax bin is where it would sit with
   nothing in your pension; the empty part under that line is the page's
   "Tax saved". The key under the jars carries every figure, as text.

   Drag sideways to turn the valve, or tap a jar to send it more: either one
   moves the page's own slider, which stays the control. With motion turned
   off none of this is added. */
(function () {
  'use strict';
  var root = document.documentElement, $ = function (id) { return document.getElementById(id); };
  var card = $('splitCard'), slider = $('split'), table = $('splitSteps'), grid = card && card.querySelector('.pb-split-grid');
  if (!card || !slider || !table || !grid || !root.classList.contains('pb-motion') || !window.requestAnimationFrame || !window.IntersectionObserver) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function num(t) { var m = /€\s*([\d,]+)/.exec(t || ''); return m ? +m[1].replace(/,/g, '') : 0; }
  function text(id) { return (($(id) || {}).textContent || '').trim(); }
  var INK = '#2C3B38', SLATE = '#586B85', AMBER = '#F4B740';

  var stage = document.createElement('div'); stage.className = 'pb-sp-stage'; stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = '<canvas class="pb-sp-cv"></canvas><div class="pb-sp-key">' +
    '<div class="pb-sp-k"><span class="pb-sp-n"><i style="background:' + AMBER + '"></i>Income tax, USC and PRSI</span><span class="pb-sp-saved"><i></i>Tax saved <b data-id="taxNow"></b></span></div>' +
    '<div class="pb-sp-k"><span class="pb-sp-n"><i style="background:' + INK + '"></i>Take home</span><b data-id="salaryNet"></b></div>' +
    '<div class="pb-sp-k"><span class="pb-sp-n"><i style="background:' + SLATE + '"></i>Into your pension</span><b data-id="pensionFull"></b></div></div>' +
    '<p class="pb-sp-hint">Drag sideways to turn the valve, or tap a jar.</p>';
  card.insertBefore(stage, grid);
  var cv = stage.querySelector('canvas'), cx = cv.getContext('2d'), hint = stage.querySelector('.pb-sp-hint');
  var cols = stage.querySelectorAll('.pb-sp-k'), figs = [].slice.call(stage.querySelectorAll('[data-id]'));
  var W = 0, H = 0, dpr = 1, c = [0, 0, 0], jw = 0, coins = [], rings = [], acc = 0, next = 0, burst = 0;
  var lv = [{ h: 0, v: 0 }, { h: 0, v: 0 }, { h: 0, v: 0 }], knob = { a: 0, v: 0 }, gateFlash = 0;
  /* the jars stand over the key's three columns */
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    [].forEach.call(cols, function (k, i) { var r = k.getBoundingClientRect(); c[i] = r.left + r.width / 2 - b.left; });
    jw = clamp(Math.min(c[1] - c[0], c[2] - c[1]) - 18, 46, 132);
  }
  /* the settled figures for this split, from the page's own table */
  function settled() {
    var rows = table.tBodies[0] ? table.tBodies[0].rows : [], on = null, zero = null;
    for (var i = 0; i < rows.length; i++) { if (rows[i].classList.contains('on')) { on = rows[i]; } if (/^0%/.test(rows[i].cells[0].textContent.trim())) { zero = rows[i]; } }
    var pay = num(text('contribV'));
    if (!on || !pay) { return null; }
    var home = num(on.cells[1].textContent), pen = num(on.cells[2].textContent), home0 = zero ? num(zero.cells[1].textContent) : home;
    var tax = Math.max(0, pay - home - pen), sal = pay - pen;
    return { pay: pay, home: home, pen: pen, tax: tax, tax0: Math.max(0, pay - home0), cut: sal > 0 ? clamp(tax / sal, 0, 1) : 0 };
  }
  function geo() {
    var top = Math.round(H * 0.6), bot = H - 6;
    return { bx: (c[1] + c[2]) / 2, by: 8, bh: 40, vy: 104, gy: top - 30, top: top, bot: bot, jh: bot - top };
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function bez(p, t) { var u = 1 - t; return [u * u * p[0][0] + 2 * u * t * p[1][0] + t * t * p[2][0], u * u * p[0][1] + 2 * u * t * p[1][1] + t * t * p[2][1]]; }
  function paths(g) {
    return {
      home: [[g.bx, g.vy], [c[1] + (g.bx - c[1]) * 0.15, g.vy + 8], [c[1], g.gy]],
      pen: [[g.bx, g.vy], [c[2] - (c[2] - g.bx) * 0.15, g.vy + 8], [c[2], g.top - 6]],
      tax: [[c[1], g.gy], [(c[0] + c[1]) / 2, g.gy - 70], [c[0], g.top - 6]]
    };
  }
  /* a coin, or the part of one left after the cut: from angle a0, a share of the whole */
  function piece(x, y, r, a0, share, col, flat) {
    cx.save(); cx.translate(x, y); cx.scale(flat, 1); cx.fillStyle = col; cx.beginPath();
    if (share >= 0.999) { cx.arc(0, 0, r, 0, Math.PI * 2); } else { cx.moveTo(0, 0); cx.arc(0, 0, r, a0, a0 + Math.PI * 2 * share); cx.closePath(); }
    cx.fill(); cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.lineWidth = 1.3; cx.stroke(); cx.restore();
  }
  var raf = 0, last = 0, onScreen = false, S = null;
  function frame(ms) {
    raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    if (!W) { size(); }
    S = settled() || S;
    figs.forEach(function (f) { var t = text(f.getAttribute('data-id')); if (f.textContent !== t) { f.textContent = t; } });
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (W > 120 && H > 160 && S) { draw(now, dt); }
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function draw(now, dt) {
    var g = geo(), P = paths(g), s = clamp(+slider.value / 100, 0, 1);
    /* the pipes, under everything */
    cx.lineCap = 'round';
    [P.home, P.pen].forEach(function (p, i) {
      var share = i ? s : 1 - s;
      cx.beginPath(); cx.moveTo(p[0][0], p[0][1]); cx.quadraticCurveTo(p[1][0], p[1][1], p[2][0], p[2][1]);
      cx.strokeStyle = '#EEF1F0'; cx.lineWidth = 26; cx.stroke();
      cx.strokeStyle = share > 0 ? 'rgba(11,31,28,.10)' : 'rgba(11,31,28,.04)'; cx.lineWidth = 2; cx.setLineDash([3, 7]); cx.stroke(); cx.setLineDash([]);
    });
    /* the jars: tax, take home, pension, on one scale; full is the company's whole payment */
    var want = [S.tax / S.pay, S.home / S.pay, S.pen / S.pay], fill = [AMBER, INK, SLATE];
    for (var i = 0; i < 3; i++) {
      var L = lv[i]; L.v += (110 * (want[i] - L.h) - 14 * L.v) * dt; L.h += L.v * dt;
      var l = c[i] - jw / 2, y = g.bot - g.jh * clamp(L.h, 0, 1.03);
      cx.save(); rr(l, g.top, jw, g.jh, 14); cx.clip();
      cx.fillStyle = 'rgba(11,31,28,.035)'; cx.fillRect(l, g.top, jw, g.jh);
      cx.beginPath(); cx.moveTo(l, g.bot);
      for (var x = l; x <= l + jw + 4; x += 4) { cx.lineTo(x, y + (L.h > 0.02 ? Math.sin(x * 0.08 + now * 3 + i * 2) * 2.2 : 0)); }
      cx.lineTo(l + jw, g.bot); cx.closePath(); cx.fillStyle = fill[i]; cx.fill();
      if (i === 0) {
        /* where tax would sit with nothing in the pension: the gap under it is tax saved */
        var y0 = g.bot - g.jh * clamp(S.tax0 / S.pay, 0, 1);
        if (S.tax0 - S.tax > 1) { cx.fillStyle = 'rgba(244,183,64,.16)'; cx.fillRect(l, y0, jw, Math.max(0, y - y0)); }
        cx.setLineDash([5, 5]); cx.strokeStyle = '#B07A12'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(l, y0); cx.lineTo(l + jw, y0); cx.stroke(); cx.setLineDash([]);
      }
      cx.restore();
      rr(l, g.top, jw, g.jh, 14); cx.lineWidth = 3; cx.strokeStyle = 'rgba(11,31,28,.22)'; cx.stroke();
      cx.save(); cx.globalAlpha = 0.5; cx.strokeStyle = '#fff'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(l + 10, g.top + 14); cx.lineTo(l + 10, g.bot - 14); cx.stroke(); cx.restore();
      L.y = y;
    }
    /* the tax gate: a hoop over take-home pay that flashes as it cuts */
    gateFlash = Math.max(0, gateFlash - dt * 4);
    cx.save(); cx.translate(c[1], g.gy); cx.lineWidth = 3 + gateFlash * 2; cx.strokeStyle = gateFlash > 0.05 ? AMBER : '#C99A3A';
    cx.beginPath(); cx.ellipse(0, 0, 17 + gateFlash * 3, 6 + gateFlash, 0, 0, Math.PI * 2); cx.stroke(); cx.restore();
    /* the company, and its payment */
    var bw = clamp(W * 0.36, 120, 200), bl = g.bx - bw / 2;
    cx.save(); cx.shadowColor = 'rgba(11,31,28,.18)'; cx.shadowBlur = 12; cx.shadowOffsetY = 4; rr(bl, g.by, bw, g.bh, 12); cx.fillStyle = '#0B1F1C'; cx.fill(); cx.restore();
    /* a little building, and the payment beside it */
    cx.fillStyle = '#7FE3D3'; var ix = bl + 14, iy = g.by + 11;
    cx.fillRect(ix, iy + 4, 14, 15); cx.fillRect(ix + 4, iy, 6, 4);
    cx.fillStyle = '#0B1F1C'; [[2, 7], [8, 7], [2, 12], [8, 12]].forEach(function (w) { cx.fillRect(ix + w[0], iy + w[1], 4, 3); });
    cx.fillStyle = '#fff'; cx.font = '800 17px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText(text('contribV'), bl + bw / 2 + 10, g.by + g.bh / 2 + 1);
    cx.fillStyle = '#0B1F1C'; cx.fillRect(g.bx - 5, g.by + g.bh, 10, 8);
    /* the valve: its pointer shows where the money goes, straight down at half and half */
    var aim = (s - 0.5) * 2.2;
    knob.v += (160 * (aim - knob.a) - 16 * knob.v) * dt; knob.a += knob.v * dt;
    cx.save(); cx.translate(g.bx, g.vy);
    cx.beginPath(); cx.arc(0, 0, 17, 0, Math.PI * 2); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = '#0B1F1C'; cx.stroke();
    cx.rotate(-knob.a); cx.beginPath(); cx.moveTo(0, -4); cx.lineTo(0, 24); cx.lineWidth = 5; cx.lineCap = 'round'; cx.strokeStyle = '#0B1F1C'; cx.stroke();
    cx.beginPath(); cx.arc(0, 0, 5, 0, Math.PI * 2); cx.fillStyle = '#14CBB1'; cx.fill(); cx.restore();
    /* coins: a steady pour, faster just after a change */
    if (S.pay > 0 && now > next) {
      coins.push({ st: 0, x: g.bx + (Math.random() - 0.5) * 4, y: g.by + g.bh + 6, vy: 40, a: Math.random() * 6, a0: Math.random() * 6, share: 1, col: INK });
      next = now + (now < burst ? 0.06 : 0.16) * (0.7 + Math.random() * 0.6);
    }
    var out = [];
    coins.forEach(function (k) {
      k.a += dt * 6;
      if (k.st === 0) {
        k.vy += 900 * dt; k.y += k.vy * dt;
        if (k.y >= g.vy) { acc += s; k.side = acc >= 1 ? 'pen' : 'home'; if (acc >= 1) { acc -= 1; } k.st = 1; k.t = 0; }
      } else if (k.st === 1 || k.st === 3) {
        var p = k.st === 1 ? P[k.side] : P.tax; k.t += dt / (k.st === 1 ? 0.5 : 0.62);
        var e = k.st === 1 ? k.t * k.t : k.t, q = bez(p, clamp(e, 0, 1)); k.x = q[0]; k.y = q[1];
        if (k.side === 'pen' && k.t > 0.5) { k.col = SLATE; }
        if (k.t >= 1) {
          if (k.st === 1 && k.side === 'home') {
            /* the cut: the tax's wedge flies to its bin, the rest drops into take-home pay */
            gateFlash = 1;
            if (S.cut > 0.005) { out.push({ st: 3, side: 'tax', x: k.x, y: k.y, t: 0, a: k.a, a0: k.a0, share: S.cut, col: AMBER }); }
            k.a0 += Math.PI * 2 * S.cut; k.share = 1 - S.cut; k.st = 2; k.vy = 60; k.into = 1;
          } else { k.into = k.st === 3 ? 0 : 2; k.st = 2; k.vy = 120; }
        }
      } else if (k.st === 2) {
        k.vy += 900 * dt; k.y += k.vy * dt;
        if (k.y >= lv[k.into].y - 4) { rings.push({ x: k.x, y: lv[k.into].y, col: k.col, born: now }); k.gone = true; }
      }
      if (!k.gone && k.share > 0.004) { piece(k.x, k.y, 9, k.a0, k.share, k.col, Math.max(0.25, Math.abs(Math.cos(k.a)))); }
      if (!k.gone) { out.push(k); }
    });
    coins = out;
    rings = rings.filter(function (r) {
      var a = (now - r.born) / 0.45; if (a >= 1) { return false; }
      cx.save(); cx.globalAlpha = 1 - a; cx.strokeStyle = r.col; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(r.x, r.y, 4 + a * 14, 1.5 + a * 4, 0, 0, Math.PI * 2); cx.stroke(); cx.restore();
      return true;
    });
  }
  function wake() { if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }

  /* turning the valve moves the page's own slider */
  function setSplit(p) {
    p = clamp(Math.round(p / 10) * 10, 0, 100);
    if (+slider.value === p) { return; }
    slider.value = p; slider.dispatchEvent(new Event('input', { bubbles: true })); slider.dispatchEvent(new Event('change', { bubbles: true }));
    burst = performance.now() / 1000 + 0.5; hint.classList.add('pb-off');
  }
  var drag = null;
  cv.addEventListener('pointerdown', function (e) {
    var b = cv.getBoundingClientRect();
    drag = { x0: e.clientX, y0: e.clientY, s0: +slider.value, moved: false, x: e.clientX - b.left, y: e.clientY - b.top };
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    wake();
  });
  cv.addEventListener('pointermove', function (e) {
    var b = cv.getBoundingClientRect(), x = e.clientX - b.left;
    if (!drag) { var g = geo(); cv.style.cursor = e.clientY - b.top < g.top - 40 ? 'ew-resize' : (Math.abs(x - c[1]) < jw / 2 + 8 || Math.abs(x - c[2]) < jw / 2 + 8 ? 'pointer' : 'ew-resize'); return; }
    var dx = e.clientX - drag.x0;
    if (Math.abs(dx) > 6) { drag.moved = true; }
    if (drag.moved) { setSplit(drag.s0 + dx / Math.max(120, c[2] - c[0]) * 100); }
  });
  function end(e) {
    if (!drag) { return; }
    if (!drag.moved && e.type === 'pointerup') {
      var g = geo();
      if (drag.y > g.top - 40) {
        if (Math.abs(drag.x - c[2]) < jw / 2 + 8) { setSplit(+slider.value + 10); }
        else if (Math.abs(drag.x - c[1]) < jw / 2 + 8) { setSplit(+slider.value - 10); }
      } else { burst = performance.now() / 1000 + 0.8; }
    }
    drag = null;
  }
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  slider.addEventListener('input', function () { burst = performance.now() / 1000 + 0.5; });
  new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { W = 0; burst = performance.now() / 1000 + 1; wake(); } }).observe(cv);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', wake); window.addEventListener('focus', wake); document.addEventListener('resume', wake);
  window.addEventListener('resize', function () { W = 0; });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; }); }
}());
