/* Inflation (#inflation), 11 October 2026, Damian's brief: "€1,000 buys less
   every year. Then why a pension: it can grow faster than prices. Clear as
   day. Go all out on the motion."

   Two stacks of coins, each worth €1,000 today; one coin is €100 of today's
   shopping. Cash: prices rise 2% a year (the ECB's target), so after n years
   it buys what 1,000 / 1.02^n buys today. In a pension: 5% a year before
   charges (the calculator's own rate), so 1,000 x 1.05^n / 1.02^n in today's
   money. Not guaranteed; the note says so.

   Motion: the first time it is seen the years run from 0 to 30 by
   themselves: the cash crumbles to dust coin by coin while pension coins
   drop onto their stacks. Then the reader runs time: the slider, or a drag
   across the picture. The stacks sway, lean away from the pointer, and a tap
   sends a wave up them. With motion off it is drawn once per change. */
(function () {
  'use strict';
  var sec = document.getElementById('inflation'), K = window.PBKit, C = window.PBCoins;
  if (!sec || !K) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var yrs = $('pbI2Yrs'), cv = sec.querySelector('.pb-i2-cv');
  if (!yrs) { return; }
  var fmt = K.fmt, INF = 0.02, GROW = 0.05, PER = 100, BASE = 1000 / PER;
  var rCash = new K.Roll($('pbI2Cash')), rPen = new K.Roll($('pbI2Pen'));
  var tCash = $('pbI2TCash'), tPen = $('pbI2TPen'), rTC = tCash ? new K.Roll(tCash.querySelector('b')) : null, rTP = tPen ? new K.Roll(tPen.querySelector('b')) : null;
  var hint = sec.querySelector('.pb-i2-hint');

  function cashOf(n) { return 1000 / Math.pow(1 + INF, n); }
  function penOf(n) { return 1000 * Math.pow((1 + GROW) / (1 + INF), n); }
  function words() {
    var n = +yrs.value;
    yrs.style.setProperty('--fill', ((n - yrs.min) / (yrs.max - yrs.min) * 100) + '%');
    yrs.setAttribute('aria-valuetext', n + (n === 1 ? ' year' : ' years'));
    $('pbI2YrsV').textContent = n;
    $('pbI2Y').textContent = n === 1 ? '1 year' : n + ' years';
    rCash.set(fmt(cashOf(n))); rPen.set(fmt(penOf(n)));
    if (rTC) { rTC.set(fmt(cashOf(n))); rTP.set(fmt(penOf(n))); }
  }

  /* --------------------------------------------------------- the stacks -- */
  var cx = cv && cv.getContext ? cv.getContext('2d') : null;
  var W = 0, H = 0, dpr = 1, g = null, fx = C ? new C.FX() : null;
  var cash = [], pen = [], gone = [];
  var show = { cash: new K.Spring(BASE, 26, 10), pen: new K.Spring(BASE, 26, 10), yr: new K.Spring(+yrs.value, 40, 12) };
  var lean = [{ x: 0, v: 0 }, { x: 0, v: 0 }], ptr = { in: false, x: 0, y: 0, down: false, sx: 0, sy0: 0, scrub: false };
  var PCOL = 16;   /* pension coins per column: past this a second column starts */
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var room = H - 132, w = Math.max(44, Math.min(118, W * 0.2, room / (PCOL * 0.105 + 0.3)));
    var h = C.sliceH(Math.round(w));
    g = { w: Math.round(w), e: h.e, ry: h.ry, base: H - 34, cashX: W * 0.26, penX: W * 0.62, gap: Math.round(w) * 1.08 };
  }
  function slot(i) { return g.base - g.ry - g.e - i * g.e; }
  function penPos(i) { var col = Math.floor(i / PCOL), k = i % PCOL; return { x: g.penX + col * g.gap, y: slot(k), col: col, k: k }; }
  function mkCoin(drop) { return { y: drop ? -(H * 0.6 + Math.random() * 40) : 0, vy: 0, landed: !drop, hop: 0, vh: 0, sq: 0 }; }

  /* bring the coins to the shown values: whole coins, and a part coin on top */
  function syncCoins() {
    var nc = Math.ceil(show.cash.x - 0.001), np = Math.ceil(show.pen.x - 0.001), motion = K.motion() && seen;
    while (cash.length > nc) {
      var c = cash.pop();
      if (motion && fx) { var y = slot(cash.length); fx.dust(g.cashX, y, 16, 'silver'); fx.dust(g.cashX - g.w * 0.3, y + 4, 6, 'silver'); fx.dust(g.cashX + g.w * 0.3, y + 4, 6, 'silver'); }
    }
    while (cash.length < nc) { var n = mkCoin(false); n.pop = motion ? 1 : 0; cash.push(n); }
    while (pen.length > np) {
      var o = pen.pop(), p = penPos(pen.length);
      if (motion) { gone.push({ x: p.x, y: p.y + o.y, vx: (Math.random() - 0.5) * 200, vy: -200 - Math.random() * 150, a: 0, va: (Math.random() - 0.5) * 8, age: 0 }); }
    }
    while (pen.length < np) { pen.push(mkCoin(motion)); }
  }

  /* ---------------------------------------------------------- the frame -- */
  var raf = 0, last = 0, onScreen = true, seen = false, calm = 0, intro = null;
  function kick() { calm = 0; if (cx && !raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    if (!W || !g) { size(); }
    if (W < 160 || H < 160) { return; }
    var moving = false;
    if (intro) {
      var k = Math.min(1, (now - intro.t0) / intro.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      var y = Math.round(intro.from + (intro.to - intro.from) * e);
      if (+yrs.value !== y) { yrs.value = y; words(); target(); }
      if (k >= 1) { intro = null; if (hint) { setTimeout(function () { if (!touched) { hint.classList.add('pb-on'); } }, 400); } }
      moving = true;
    }
    if (K.motion()) {
      for (var s in show) { show[s].step(dt); if (!show[s].done()) { moving = true; } }
    } else { for (var s2 in show) { show[s2].x = show[s2].t; } }
    syncCoins();
    if (K.motion()) { if (stepCoins(now, dt)) { moving = true; } }
    if (fx) { fx.step(dt); if (fx.busy()) { moving = true; } }
    draw(now);
    calm = moving ? 0 : calm + dt;
    if (K.motion() && onScreen && !document.hidden && (calm < 0.6 || ptr.in)) { raf = requestAnimationFrame(frame); }
  }
  function stepCoins(now, dt) {
    var moving = false;
    [[cash, g.cashX, 0], [pen, g.penX + (pen.length > PCOL ? g.gap / 2 : 0), 1]].forEach(function (s) {
      var arr = s[0], L = lean[s[2]], lt = 0;
      if (ptr.in && !ptr.scrub) { var dx = s[1] - ptr.x, near = Math.max(0, 1 - Math.abs(dx) / (g.w * 2)); lt = (dx > 0 ? 1 : -1) * near * 16; }
      L.v += (90 * (lt - L.x) - 9 * L.v) * dt; L.x += L.v * dt;
      if (Math.abs(L.v) > 0.5) { moving = true; }
      arr.forEach(function (c, i) {
        if (!c.landed) {
          c.vy += 2400 * dt; c.y += c.vy * dt; moving = true;
          if (c.y >= 0) { c.y = 0; if (c.vy > 240) { c.vy = -c.vy * 0.24; c.sq = 1; } else { c.vy = 0; c.landed = true; } if (fx && !c.rang) { c.rang = true; var p = penPos(i); fx.ring(p.x, p.y + g.ry * 0.3, 'rgba(244,183,64,.85)', g.w * 0.45); } }
        }
        if (c.vh || c.hop) { c.vh += 2400 * dt; c.hop += c.vh * dt; if (c.hop > 0) { c.hop = 0; c.vh = Math.abs(c.vh) > 100 ? -c.vh * 0.2 : 0; } moving = true; }
        if (c.sq) { c.sq = Math.max(0, c.sq - dt * 5); moving = true; }
        if (c.pop) { c.pop = Math.max(0, c.pop - dt * 4); moving = true; }
      });
    });
    gone = gone.filter(function (o) { o.age += dt; o.vy += 1600 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.a += o.va * dt; return o.age < 0.9; });
    if (gone.length) { moving = true; }
    return moving;
  }
  function draw(now) {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    /* the years, large and faint, behind everything */
    var yv = Math.round(show.yr.x);
    cx.save(); cx.globalAlpha = 0.07; cx.fillStyle = '#0B1F1C'; cx.font = '800 ' + Math.round(H * 0.42) + 'px Figtree, system-ui, sans-serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(String(yv), W / 2, H * 0.38); cx.restore();
    /* floors */
    floor(g.cashX); floor(g.penX + (pen.length > PCOL ? g.gap / 2 : 0), pen.length > PCOL ? 1.6 : 1);
    /* cash: whole coins, the top one crumbling as it goes */
    var fc = show.cash.x - Math.floor(show.cash.x - 0.001);
    cash.forEach(function (c, i) {
      var top = i === cash.length - 1, part = top && fc < 0.999 ? fc : 1, h = (i + 1) / Math.max(1, cash.length);
      var x = g.cashX + lean[0].x * Math.pow(h, 1.5) + Math.sin(now * 1.3 + i * 0.3) * 0.6 * h, y = slot(i) + c.hop;
      var w = g.w * (part < 1 ? 0.55 + 0.45 * part : 1) * (1 + (c.pop || 0) * 0.1);
      C.slice(cx, x, y, w, 'silver', part < 1 ? 0.35 + 0.65 * part : 1, top);
      if (part < 1 && K.motion() && fx && Math.abs(show.cash.v) > 0.02 && Math.random() < 0.5) { fx.dust(x + (Math.random() - 0.5) * w * 0.8, y + 2, 1, 'silver'); }
    });
    /* the pension: coins land on one stack, then a second */
    var fp = show.pen.x - Math.floor(show.pen.x - 0.001);
    pen.forEach(function (c, i) {
      var p = penPos(i), top = i === pen.length - 1, part = top && fp < 0.999 ? fp : 1, colN = Math.min(PCOL, pen.length - p.col * PCOL), h = (p.k + 1) / Math.max(1, colN);
      var x = p.x + lean[1].x * Math.pow(h, 1.5) + Math.sin(now * 1.2 + i * 0.27) * 0.6 * h, y = p.y + c.y + c.hop;
      var w = g.w * (part < 1 ? 0.6 + 0.4 * part : 1) * (1 + (c.sq || 0) * 0.07);
      C.slice(cx, x, y, w, 'gold', part < 1 ? 0.45 + 0.55 * part : 1, (top || p.k === PCOL - 1) && c.landed);
    });
    gone.forEach(function (o) { var k = o.age / 0.9; cx.save(); cx.translate(o.x, o.y); cx.rotate(o.a); C.slice(cx, 0, 0, g.w, 'gold', 1 - k); cx.restore(); });
    if (fx) { fx.draw(cx); }
    /* one coin is */
    cx.fillStyle = 'rgba(84,99,95,.85)'; cx.font = '600 12px Figtree, system-ui, sans-serif'; cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
    cx.fillText('One coin = €100 of today’s shopping', 16, H - 10);
    place();
  }
  function floor(x, k) {
    var s = cx.createRadialGradient(x, g.base + 2, 2, x, g.base + 2, g.w * 0.85 * (k || 1));
    s.addColorStop(0, 'rgba(11,31,28,.15)'); s.addColorStop(1, 'rgba(11,31,28,0)');
    cx.fillStyle = s; cx.beginPath(); cx.ellipse(x, g.base + 2, g.w * 0.85 * (k || 1), g.ry * 0.85, 0, 0, Math.PI * 2); cx.fill();
  }
  function place() {
    if (!tCash) { return; }
    var cTop = slot(Math.max(0, cash.length - 1)) - g.ry - 10, pN = Math.min(PCOL, pen.length), pTop = slot(Math.max(0, pN - 1)) - g.ry - 10;
    tCash.style.setProperty('--x', g.cashX.toFixed(1) + 'px'); tCash.style.setProperty('--y', Math.max(56, cTop).toFixed(1) + 'px');
    var px = g.penX + (pen.length > PCOL ? g.gap / 2 : 0);
    tPen.style.setProperty('--x', px.toFixed(1) + 'px'); tPen.style.setProperty('--y', Math.max(56, pTop).toFixed(1) + 'px');
  }

  /* ----------------------------------------------------- the reader's time -- */
  function target() {
    var n = +yrs.value;
    show.cash.t = cashOf(n) / PER; show.pen.t = penOf(n) / PER; show.yr.t = n;
    if (!K.motion() || !seen) { show.cash.x = show.cash.t; show.pen.x = show.pen.t; show.yr.x = n; }
    kick();
  }
  var touched = false;
  function touch() { touched = true; intro = null; if (hint) { hint.classList.remove('pb-on'); } }
  yrs.addEventListener('input', function () { touch(); words(); target(); });
  function local(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  if (cx) {
    cv.addEventListener('pointermove', function (e) {
      var p = local(e); ptr.x = p.x; ptr.y = p.y; ptr.in = true;
      if (ptr.down) {
        var dx = p.x - ptr.sx;
        if (!ptr.scrub && Math.abs(dx) > 6) { ptr.scrub = true; touch(); }
        if (ptr.scrub) {
          var span = Math.max(220, W * 0.9), v = Math.round(Math.max(+yrs.min, Math.min(+yrs.max, ptr.y0 + dx / span * (+yrs.max - +yrs.min))));
          if (+yrs.value !== v) { yrs.value = v; words(); target(); }
        }
      }
      kick();
    });
    cv.addEventListener('pointerleave', function () { ptr.in = false; kick(); });
    cv.addEventListener('pointerdown', function (e) {
      var p = local(e); ptr.down = true; ptr.sx = p.x; ptr.y0 = +yrs.value; ptr.scrub = false;
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
    });
    var up = function (e) {
      if (!ptr.down) { return; }
      ptr.down = false;
      if (!ptr.scrub && K.motion() && g) {
        /* a tap: a wave up the stack it was nearest */
        var p = local(e), isPen = Math.abs(p.x - g.penX) < Math.abs(p.x - g.cashX), arr = isPen ? pen : cash;
        arr.forEach(function (c, i) { setTimeout(function () { c.vh = -(220 + Math.random() * 60); kick(); }, (isPen ? i % PCOL : i) * 24); });
        if (fx) {
          var top = isPen ? penPos(Math.max(0, Math.min(PCOL, pen.length) - 1)) : { x: g.cashX, y: slot(Math.max(0, cash.length - 1)) };
          if (isPen) { fx.spark(top.x, top.y - g.ry, 12, ['#F4B740', '#FFE08A', '#14CBB1', '#FFFFFF']); } else { fx.dust(top.x, top.y, 14, 'silver'); }
        }
        touch();
      }
      ptr.scrub = false; kick();
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }

  /* ------------------------------------------------------ housekeeping -- */
  window.addEventListener('resize', function () { W = 0; g = null; kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; g = null; kick(); }); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', kick);
  $('pbI2Ctl').hidden = false;
  words(); target();
  if (!cx || !C) { return; }
  sec.classList.add('pb-i2-on');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting;
      if (onScreen && !seen) {
        seen = true;
        if (K.motion()) {
          /* the first look: time runs from today to the slider's year */
          var to = +yrs.value; yrs.value = 0; words(); show.cash.x = show.cash.t = BASE; show.pen.x = show.pen.t = BASE; show.yr.x = 0;
          cash = []; pen = []; syncCoins();
          intro = { t0: performance.now() / 1000 + 0.5, dur: 2.6, from: 0, to: to };
        }
      }
      if (onScreen) { kick(); }
    }, { threshold: 0.35 }).observe(cv);
  } else { seen = true; kick(); }
}());
