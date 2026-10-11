/* Inflation, in one picture (#inflation), 11 October 2026, Damian's brief:
   "the little inflation egg basket from the jargon buster, just below the
   calculator, so people have an idea."

   Two baskets, each bought with the same €1,000. Today's is full. The other
   holds what that €1,000 buys in the years chosen, at the rate chosen: the
   same sum as the jargon buster's (assets/js/pb-gl-motion.js and
   glossary.html): €1,000 then buys what €1,000 / (1 + rate)^years buys today.
   Move the years and the shopping jumps out of the basket and falls away,
   or drops back in and bounces into place. Tap a basket and it hops.

   With motion off the baskets are drawn once per change. */
(function () {
  'use strict';
  var sec = document.getElementById('inflation'), K = window.PBKit;
  if (!sec || !K) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var yrs = $('pbB2Yrs'), out = $('pbB2Out'), cv = sec.querySelector('.pb-b2-cv');
  if (!yrs || !out || !cv || !cv.getContext) { return; }
  var cx = cv.getContext('2d'), fmt = K.fmt, rate = 0.02;
  var rBuy = new K.Roll($('pbB2Buy')), rYrs = new K.Roll($('pbB2YrsV'));

  /* the shopping: half of it eggs */
  var KINDS = ['egg', 'apple', 'egg', 'milk', 'egg', 'bread', 'egg', 'cheese', 'egg', 'tomato', 'egg', 'carrot'];
  var ROWS = [6, 6, 5, 4, 3], N = 24;
  function Item(i, side) { return { i: i, kind: KINDS[i % KINDS.length], side: side, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, st: 'in', alpha: 1, sx: 0, sy: 0, landed: true }; }
  var today = [], later = [];
  for (var i = 0; i < N; i++) { today.push(Item(i, 0)); later.push(Item(i, 1)); }
  var hop = [new K.Spring(0, 260, 12), new K.Spring(0, 260, 12)];

  function share() { var n = +yrs.value; return 1 / Math.pow(1 + rate, n); }

  /* ---------------------------------------------------------- geometry -- */
  var W = 0, H = 0, dpr = 1, geo = null;
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var bw = Math.min(260, W * 0.42), bh = Math.min(110, H * 0.34), floor = H - 40, s = bw / 6.4;
    geo = { bw: bw, bh: bh, floor: floor, s: s, cxs: [W * 0.27, W * 0.73] };
    [today, later].forEach(function (arr, side) { arr.forEach(function (it) { var p = slot(it.i, side); it.sx = p.x; it.sy = p.y; if (it.st === 'in' && it.landed) { it.x = p.x; it.y = p.y; } }); });
  }
  function slot(i, side) {
    var g = geo, row = 0, k = i;
    while (row < ROWS.length && k >= ROWS[row]) { k -= ROWS[row]; row++; }
    var n = ROWS[row] || 1, span = g.bw - g.s * 1.6 - (6 - n) * g.s * 0.35;
    var x = g.cxs[side] - span / 2 + (n === 1 ? span / 2 : span * k / (n - 1));
    var y = g.floor - g.s * 0.3 - row * g.s * 0.8;
    return { x: x + ((i * 37) % 7 - 3) * 0.6, y: y };
  }

  /* --------------------------------------------------- the shopping, drawn -- */
  function draw1(it) {
    var s = geo.s;
    cx.save(); cx.globalAlpha = it.alpha; cx.translate(it.x, it.y); cx.rotate(it.a);
    cx.lineWidth = 1.5;
    switch (it.kind) {
      case 'egg':
        cx.fillStyle = '#FFF4DF'; cx.strokeStyle = '#D9C4A0'; cx.beginPath(); cx.ellipse(0, 0, s * 0.36, s * 0.46, 0, 0, Math.PI * 2); cx.fill(); cx.stroke();
        cx.fillStyle = 'rgba(255,255,255,.9)'; cx.beginPath(); cx.ellipse(-s * 0.12, -s * 0.18, s * 0.08, s * 0.13, -0.4, 0, Math.PI * 2); cx.fill(); break;
      case 'apple':
        cx.fillStyle = '#E5484D'; cx.beginPath(); cx.arc(0, s * 0.04, s * 0.4, 0, Math.PI * 2); cx.fill();
        cx.strokeStyle = '#6B4423'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(0, -s * 0.3); cx.lineTo(s * 0.04, -s * 0.48); cx.stroke();
        cx.fillStyle = '#3FA34D'; cx.beginPath(); cx.ellipse(s * 0.16, -s * 0.42, s * 0.14, s * 0.07, -0.5, 0, Math.PI * 2); cx.fill(); break;
      case 'milk':
        cx.fillStyle = '#FFFFFF'; cx.strokeStyle = '#B8C4CC'; cx.beginPath(); cx.rect(-s * 0.28, -s * 0.3, s * 0.56, s * 0.72); cx.fill(); cx.stroke();
        cx.beginPath(); cx.moveTo(-s * 0.28, -s * 0.3); cx.lineTo(0, -s * 0.55); cx.lineTo(s * 0.28, -s * 0.3); cx.closePath(); cx.fill(); cx.stroke();
        cx.fillStyle = '#3B82F6'; cx.fillRect(-s * 0.28, -s * 0.02, s * 0.56, s * 0.18); break;
      case 'bread':
        cx.fillStyle = '#D9A066'; cx.strokeStyle = '#A86F3A'; cx.beginPath(); cx.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, Math.PI * 2); cx.fill(); cx.stroke();
        cx.strokeStyle = '#F2CC9A'; cx.lineWidth = 2; for (var q = -1; q <= 1; q++) { cx.beginPath(); cx.moveTo(q * s * 0.2 - s * 0.06, -s * 0.12); cx.lineTo(q * s * 0.2 + s * 0.06, s * 0.08); cx.stroke(); } break;
      case 'cheese':
        cx.fillStyle = '#F4C542'; cx.strokeStyle = '#C99A1E'; cx.beginPath(); cx.moveTo(-s * 0.46, s * 0.3); cx.lineTo(s * 0.46, s * 0.3); cx.lineTo(s * 0.46, -s * 0.1); cx.lineTo(-s * 0.46, s * 0.06); cx.closePath(); cx.fill(); cx.stroke();
        cx.fillStyle = '#D9A81F'; cx.beginPath(); cx.arc(s * 0.12, s * 0.14, s * 0.07, 0, Math.PI * 2); cx.arc(-s * 0.2, s * 0.2, s * 0.05, 0, Math.PI * 2); cx.fill(); break;
      case 'tomato':
        cx.fillStyle = '#F05A3E'; cx.beginPath(); cx.arc(0, 0, s * 0.38, 0, Math.PI * 2); cx.fill();
        cx.fillStyle = '#3FA34D'; cx.beginPath(); for (var t = 0; t < 5; t++) { var an = t / 5 * Math.PI * 2; cx.moveTo(0, -s * 0.34); cx.lineTo(Math.cos(an) * s * 0.18, -s * 0.34 + Math.sin(an) * s * 0.08); } cx.lineWidth = 3; cx.strokeStyle = '#3FA34D'; cx.stroke(); break;
      default: /* carrot */
        cx.fillStyle = '#F28C28'; cx.beginPath(); cx.moveTo(-s * 0.16, -s * 0.3); cx.lineTo(s * 0.16, -s * 0.3); cx.lineTo(0, s * 0.45); cx.closePath(); cx.fill();
        cx.strokeStyle = '#3FA34D'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(0, -s * 0.3); cx.lineTo(-s * 0.12, -s * 0.52); cx.moveTo(0, -s * 0.3); cx.lineTo(s * 0.1, -s * 0.54); cx.stroke();
    }
    cx.restore();
  }
  function basket(side, dy) {
    var g = geo, c = g.cxs[side], l = c - g.bw / 2, top = g.floor - g.bh + dy, bot = g.floor + dy;
    /* the handle, behind */
    cx.lineWidth = 6; cx.strokeStyle = '#B9884F'; cx.lineCap = 'round';
    var ht = g.floor - g.s * 0.8 + dy; cx.beginPath(); cx.moveTo(l + 14, ht); cx.bezierCurveTo(l + 20, ht - g.bh * 1.6, l + g.bw - 20, ht - g.bh * 1.6, l + g.bw - 14, ht); cx.stroke();
    return { l: l, top: top, bot: bot };
  }
  function front(side, dy) {
    var g = geo, c = g.cxs[side], l = c - g.bw / 2, top = g.floor - g.s * 0.8 + dy, bot = g.floor + g.s * 0.35 + dy, inset = 14;
    cx.save();
    cx.beginPath(); cx.moveTo(l - 4, top); cx.lineTo(l + g.bw + 4, top); cx.lineTo(l + g.bw - inset, bot); cx.lineTo(l + inset, bot); cx.closePath();
    cx.fillStyle = '#E2B677'; cx.fill(); cx.clip();
    cx.strokeStyle = 'rgba(150,100,45,.45)'; cx.lineWidth = 2;
    for (var y = top + 9; y < bot; y += 10) { cx.beginPath(); cx.moveTo(l - 4, y); cx.lineTo(l + g.bw + 4, y); cx.stroke(); }
    for (var x = l + 6, n = 0; x < l + g.bw; x += 16, n++) { cx.beginPath(); cx.moveTo(x, top); cx.lineTo(x + (n % 2 ? 4 : -4), bot); cx.stroke(); }
    cx.restore();
    cx.fillStyle = '#B9884F'; cx.beginPath(); cx.moveTo(l - 8, top - 5); cx.lineTo(l + g.bw + 8, top - 5); cx.lineTo(l + g.bw + 6, top + 5); cx.lineTo(l - 6, top + 5); cx.closePath(); cx.fill();
  }
  function note(side, label, dy) {
    var c = geo.cxs[side], y = 22 + dy;
    cx.fillStyle = '#E3F7F2'; cx.strokeStyle = '#0B7A6E'; cx.lineWidth = 2;
    cx.beginPath(); var w = 74, h = 30; cx.moveTo(c - w / 2 + 6, y); cx.arcTo(c + w / 2, y, c + w / 2, y + h, 6); cx.arcTo(c + w / 2, y + h, c - w / 2, y + h, 6); cx.arcTo(c - w / 2, y + h, c - w / 2, y, 6); cx.arcTo(c - w / 2, y, c + w / 2, y, 6); cx.closePath(); cx.fill(); cx.stroke();
    cx.fillStyle = '#0B1F1C'; cx.font = '800 15px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('€1,000', c, y + h / 2 + 1);
    cx.fillStyle = '#54635F'; cx.font = '600 15px Figtree, system-ui, sans-serif'; cx.fillText(label, c, H - 12);
  }

  /* ------------------------------------------------------------ the loop -- */
  var raf = 0, last = 0, onScreen = true;
  function kick() { if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function step(it, dt) {
    if (it.st === 'gone') { return false; }
    if (it.st === 'out') {
      it.vy += 1500 * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.a += it.va * dt;
      if (it.y > geo.floor + 6 && it.vy > 0 && !it.bounced) { it.bounced = true; it.vy *= -0.42; it.vx *= 0.7; }
      it.alpha = Math.max(0, it.alpha - dt * (it.bounced ? 1.6 : 0.2));
      if (it.alpha <= 0 || it.y > H + 40) { it.st = 'gone'; it.alpha = 0; }
      return true;
    }
    /* in: falls under gravity to its place, bounces, settles */
    var busy = false;
    if (!it.landed) {
      it.vy += 1700 * dt; it.y += it.vy * dt; it.x += (it.sx - it.x) * Math.min(1, dt * 10); it.a *= Math.pow(0.02, dt);
      if (it.y >= it.sy && it.vy > 0) { it.y = it.sy; it.vy *= -0.32; if (Math.abs(it.vy) < 60) { it.landed = true; it.vy = 0; it.y = it.sy; } }
      busy = true;
    } else { it.x = it.sx; it.y = it.sy; it.a = 0; }
    it.alpha = Math.min(1, it.alpha + dt * 5);
    return busy || it.alpha < 1;
  }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    if (!geo || !W) { size(); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (W < 200) { return; }
    var busy = false;
    hop.forEach(function (h) { h.step(dt); if (!h.done()) { busy = true; } });
    var label = (+yrs.value) + ' years on';
    [today, later].forEach(function (arr, side) {
      var dy = -hop[side].x * 18;
      basket(side, dy);
      arr.forEach(function (it) {
        if (step(it, dt)) { busy = true; }
        if (it.st !== 'gone' && it.st !== 'out') { var y0 = it.y; it.y += dy; draw1(it); it.y = y0; }
      });
      front(side, dy);
      arr.forEach(function (it) { if (it.st === 'out') { draw1(it); } });
      note(side, side ? label : 'Today', dy);
    });
    if (busy && K.motion()) { raf = requestAnimationFrame(frame); }
  }

  /* --------------------------------------------------------- the figures -- */
  function update(fromUser) {
    var n = +yrs.value, f = share(), want = Math.round(N * f), moving = K.motion() && fromUser && geo;
    yrs.style.setProperty('--fill', ((n - yrs.min) / (yrs.max - yrs.min) * 100) + '%');
    yrs.setAttribute('aria-valuetext', n + (n === 1 ? ' year' : ' years'));
    rYrs.set(String(n));
    rBuy.set(fmt(1000 * f));
    $('pbB2Cost').textContent = fmt(1000 / f);
    $('pbB2YrsW').textContent = n === 1 ? 'year' : 'years';
    /* the extra shopping jumps out, from the top of the heap down; missing shopping drops back in */
    if (geo) {
      later.forEach(function (it) {
        if (it.i >= want && it.st === 'in') {
          if (moving) { it.st = 'out'; it.bounced = false; it.vx = (it.x - geo.cxs[1]) * 2.2 + (Math.random() - 0.5) * 160; it.vy = -(300 + Math.random() * 260); it.va = (Math.random() - 0.5) * 9; }
          else { it.st = 'gone'; it.alpha = 0; }
        } else if (it.i < want && (it.st === 'out' || it.st === 'gone')) {
          it.st = 'in'; it.a = (Math.random() - 0.5) * 1.2;
          if (moving) { it.landed = false; it.x = it.sx + (Math.random() - 0.5) * 30; it.y = -20 - Math.random() * 80 - (want - it.i) * 6; it.vy = 0; it.alpha = 1; }
          else { it.landed = true; it.x = it.sx; it.y = it.sy; it.alpha = 1; }
        }
      });
    }
    kick();
  }
  yrs.addEventListener('input', function () { update(true); });
  var seg = sec.querySelector('.pb-b2-rate');
  if (seg) { K.seg(seg, function (b) { rate = +b.getAttribute('data-rate') / 100; $('pbB2RateW').textContent = b.textContent; update(true); }); }
  cv.addEventListener('pointerdown', function (e) {
    var b = cv.getBoundingClientRect(), side = (e.clientX - b.left) > W / 2 ? 1 : 0;
    hop[side].v += 9; kick();
  });
  window.addEventListener('resize', function () { W = 0; geo = null; kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; geo = null; kick(); }); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { onScreen = es[es.length - 1].isIntersecting; if (onScreen) { kick(); } }, { rootMargin: '60px 0px' }).observe(cv);
  }
  document.addEventListener('visibilitychange', kick);
  $('pbB2Ctl').hidden = false;
  size(); update(false);
}());
