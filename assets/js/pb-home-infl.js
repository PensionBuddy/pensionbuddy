/* Inflation (#inflation), 11 October 2026, Damian's brief: "€1,000 buys less
   every year. Then why a pension: it keeps its value while it grows. And for
   every €60 you put in, the government adds €40: show that, a little dim,
   beside it. Clear as day; as fluid as the welcome."

   Three stacks of coins; one coin is €100 of today's shopping.
     Deposit   €1,000 that buys less every year: on deposit at the Central
               Bank's latest rate for household overnight deposits
               (PBAssume.cash, 0.15%), in today's money at the ECB's 2%
               target: 1,000 x 1.0015^n / 1.02^n. A faint outline, "Paid in",
               keeps the €1,000 it was, so the loss is a hole you can see.
     Pension   the same €1,000 growing at 6% a year before charges, the
               most the Pensions Authority lets a projection assume
               (PBAssume.assets.cap, as the calculator above): 1,000 x
               1.06^n / 1.02^n.
     Relief    beside it, dim: what the government adds in tax relief on that
               €1,000, grown the same way. At 40% the government adds €40 for
               every €60 you put in (2/3 of yours), at 20% €20 for every €80
               (1/4). The rate is shared with the calculator (PBKit.tax).
   Not guaranteed; the note says so.

   The reader's own money (13 October 2026, Damian: "comparing it ... the
   same figure they've put into that calculator above, showing the
   purchasing power compared to if they just left it on deposit"): once the
   reader has moved the calculator's age or a monthly amount
   (PBKit.plan.set), the section is the calculator's money. What is saved
   and what goes in each month (theirs and their employer's), to 66, two
   ways:
     In your pension   the calculator's own pot, to the euro ("a pot of
                       €165,412"), and what it buys at today's prices
     On deposit        the same money at the deposit rate, at today's prices
   "What your money will buy." The slider becomes the age you look at, from
   next year to 66 (66 to start). The outline is what was paid in; one coin
   is a round sum near a tenth of what is paid in by 66 (€5,000, say), so
   the outline is about ten coins at 66, as the €1,000 is. The amount going
   into the pension already holds the tax relief (the calculator's "Revenue
   adds"), so the government's own stack stands down, and so does this
   section's tax switch (the rate is the calculator's); the sentence about
   the relief stays.

   Motion: the first time it is seen the three stacks build, then the years
   run from the slider's start to its value by themselves: cash coins fade
   into the outline while pension and relief coins drop onto their stacks and
   settle. Then the reader runs time: the slider, or a drag across the
   picture. Every coin is a spring: the stacks part around the pointer like a
   riffled deck and lean away from it; a tap sends a wave up a stack. A part
   coin on top shows as a part (its opacity). With motion off it is drawn
   once per change. */
(function () {
  'use strict';
  var sec = document.getElementById('inflation'), K = window.PBKit, C = window.PBCoins;
  if (!sec || !K) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var yrs = $('pbI2Yrs'), cv = sec.querySelector('.pb-i2-cv');
  if (!yrs) { return; }
  var PA = window.PBAssume, fmt = K.fmt, INF = (PA && PA.inflation && PA.inflation.rate) || 0.02, GROW = (PA && PA.assets && PA.assets.cap) || 0.06, PER = 100, BASE = 1000 / PER;
  var DEP = PA && PA.cash ? PA.cash.rate : 0.0015, AT = 66;
  /* the reader's own money: null until the calculator is set, then
     { m: a month in, p: saved, age: the calculator's age, per: one coin } */
  var own = null;
  var rCash = new K.Roll($('pbI2Cash')), rPen = new K.Roll($('pbI2Pen'));
  var tags = { cash: $('pbI2TCash'), pen: $('pbI2TPen'), gov: $('pbI2TGov') }, rT = {};
  Object.keys(tags).forEach(function (k) { if (tags[k]) { rT[k] = new K.Roll(tags[k].querySelector('b')); } });
  var hint = sec.querySelector('.pb-i2-hint');
  var head = $('pbI2H'), cashW = $('pbI2CashW'), penW = $('pbI2PenW'), yrsL = $('pbI2YrsL');
  /* 2026-10-15 (Damian: the inflation box "has nothing to do with the
     calculator"): its own tax switch, its own EUR 1,000; it no longer follows
     the calculator's rate or money */
  var LOCAL = 0.4;
  function rate() { return LOCAL; }

  /* a monthly amount m paid for n years at a yearly rate y, grown month by month (the calculator's project()) */
  function monthly(m, n, y) { var r = Math.pow(1 + y, 1 / 12) - 1, k = n * 12; return r > 0 ? m * (Math.pow(1 + r, k) - 1) / r : m * k; }
  /* what is saved plus what goes in a month, after n years at a yearly rate y, in euros of the day */
  function grown(n, y) { return own.p * Math.pow(1 + y, n) + monthly(own.m, n, y); }
  function cashOf(n) { return own ? grown(n, DEP) / Math.pow(1 + INF, n) : 1000 * Math.pow((1 + DEP) / (1 + INF), n); }
  function penOf(n) { return own ? grown(n, GROW) / Math.pow(1 + INF, n) : 1000 * Math.pow((1 + GROW) / (1 + INF), n); }
  function govOf(n) { var r = rate(); return own ? 0 : penOf(n) * r / (1 - r); }
  /* what was paid in, in coins: the outline */
  function paidCoins(n) { return own ? (own.p + own.m * 12 * n) / own.per : BASE; }
  function per() { return own ? own.per : PER; }
  /* the slider is years with the €1,000, and the age you look at with the reader's money */
  function years() { return own ? +yrs.value - own.age : +yrs.value; }
  /* a round sum for one coin: 1, 2, 2.5 or 5 of a power of ten, the nearest to x */
  function nice(x) {
    var e = Math.pow(10, Math.floor(Math.log(x) / Math.LN10)), best = e;
    [1, 2, 2.5, 5, 10].forEach(function (f) { if (Math.abs(Math.log(f * e / x)) < Math.abs(Math.log(best / x))) { best = f * e; } });
    return best;
  }
  function money() {
    var a = own.p > 0 ? fmt(own.p) : '', b = own.m > 0 ? fmt(own.m) + ' a month' : '';
    return a && b ? a + ' and ' + b : a || b;
  }
  function words() {
    var v = +yrs.value, n = years(), r = rate();
    yrs.style.setProperty('--fill', ((v - yrs.min) / (yrs.max - yrs.min || 1) * 100) + '%');
    $('pbI2YrsV').textContent = v;
    if (own) {
      yrs.setAttribute('aria-valuetext', 'At ' + v);
      if (head) { head.textContent = 'What your money will buy.'; }
      if (yrsL) { yrsL.textContent = 'At age'; }
      /* 14 October 2026: the pension first, the deposit second */
      if (penW) { penW.textContent = 'At ' + v + ', your ' + money() + ' in your pension, a pot of ' + fmt(grown(n, GROW)) + ', could buy what'; }
      if (cashW) { cashW.textContent = 'On deposit, the same money would buy what'; }
    } else {
      yrs.setAttribute('aria-valuetext', n + (n === 1 ? ' year' : ' years'));
      if (head) { head.textContent = '€1,000 buys less every year.'; }
      if (yrsL) { yrsL.textContent = 'Years'; }
      if (penW) { penW.textContent = 'In ' + (n === 1 ? '1 year' : n + ' years') + ', €1,000 in a pension could buy what'; }
      if (cashW) { cashW.textContent = 'On deposit, it would buy what'; }
    }
    rCash.set(fmt(cashOf(n))); rPen.set(fmt(penOf(n)));
    /* what Revenue adds is the Tax panel's now (14 October 2026); a page that still says it here gets it */
    if ($('pbI2Put')) { $('pbI2Put').textContent = fmt(100 * (1 - r)); $('pbI2Add').textContent = fmt(100 * r); }
    if (rT.cash) { rT.cash.set(fmt(cashOf(n))); rT.pen.set(fmt(penOf(n))); if (!own) { rT.gov.set('+' + fmt(govOf(n))); } }
  }

  /* --------------------------------------------------------- the stacks -- */
  var cx = cv && cv.getContext ? cv.getContext('2d') : null;
  var W = 0, H = 0, dpr = 1, g = null;
  function Stack(kind, alpha) { return { kind: kind, alpha: alpha, coins: [], n: new K.Spring(BASE, 24, 9.5), lean: { x: 0, v: 0 }, x: 0 }; }
  var S = { cash: Stack('silver', 1), pen: Stack('silver', 1), gov: Stack('gold', 0.5) };
  var ORDER = ['cash', 'gov', 'pen'];
  var ptr = { in: false, x: 0, y: 0, down: false, sx: 0, y0: 0, scrub: false };
  /* coins are sized so the pension's stack fits at 30 years; past that the
     view eases back, like a camera stepping away, so 40 years still fits */
  var FIT = Math.ceil(penOf(30) / PER);
  function zoom() { return Math.min(1, FIT / Math.max(FIT, S.pen.n.x)); }
  function pivot(k) { return k === 'cash' ? S.cash.x : S.pen.x; }
  function shown(k) { var z = zoom(), px = pivot(k); return S[k].x === px ? px : px + (S[k].x - px) * z; }
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var base = H - 44, w = Math.max(40, Math.min(104, W * 0.17, (base - 128) / (0.105 * FIT + 0.3)));
    var h = C.sliceH(Math.round(w));
    g = { w: Math.round(w), e: h.e, ry: h.ry, base: base };
    /* with the reader's own money there are two stacks, so they move to the middle */
    /* 14 October 2026: the pension's stack first, on the left, the deposit's on the right */
    S.pen.x = W * (own ? 0.32 : 0.2); S.gov.x = S.pen.x + g.w * 1.14; S.cash.x = W * (own ? 0.7 : 0.76);
  }
  function slot(i) { return g.base - g.ry - g.e - i * g.e; }
  /* each coin's own small offset, so a stack is a stack and not a cylinder */
  function jit(i, k) { var v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return (v - Math.floor(v) - 0.5) * 1.6; }
  /* 'drop': falls in from above; 'pop': grows in where it is; 'still': simply there */
  function mkCoin(mode, i) {
    return { y: mode === 'drop' ? -(g.base + 60 + i * 3) : 0, vy: 0, landed: mode !== 'drop', hop: 0, vh: 0, sq: 0, o: 0, vo: 0, pop: mode === 'pop' ? 0 : 1 };
  }
  /* whole coins for the shown value, the part coin on top */
  function syncCoins() {
    var motion = K.motion() && seen;
    ORDER.forEach(function (k) {
      var s = S[k], want = Math.max(0, Math.ceil(s.n.x - 0.001));
      while (s.coins.length > want) { s.coins.pop(); }
      while (s.coins.length < want) { s.coins.push(mkCoin(!motion ? 'still' : k === 'cash' ? 'pop' : 'drop', s.coins.length)); }
    });
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
      var k = Math.max(0, Math.min(1, (now - intro.t0) / intro.dur)), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      var y = Math.round(intro.from + (intro.to - intro.from) * e);
      if (+yrs.value !== y) { yrs.value = y; words(); target(); }
      if (k >= 1) { intro = null; if (hint) { setTimeout(function () { if (!touched) { hint.classList.add('pb-on'); } }, 500); } }
      moving = true;
    }
    for (var s in S) { S[s].n.step(dt); if (!S[s].n.done()) { moving = true; } }
    syncCoins();
    if (K.motion() && stepCoins(dt)) { moving = true; }
    draw();
    calm = moving ? 0 : calm + dt;
    if (K.motion() && onScreen && !document.hidden && (calm < 0.6 || ptr.in)) { raf = requestAnimationFrame(frame); }
  }
  function stepCoins(dt) {
    var moving = false, z = zoom();
    ORDER.forEach(function (k) {
      var s = S[k], L = s.lean, lt = 0, px = pivot(k);
      /* the pointer in the stack's own frame, before the view eases back */
      var qx = px + (ptr.x - px) / z, qy = g.base + (ptr.y - g.base) / z;
      /* the stack leans away from the pointer */
      if (ptr.in && !ptr.scrub) { var dx = s.x - qx, near = Math.max(0, 1 - Math.abs(dx) / (g.w * 2.2)); lt = (dx > 0 ? 1 : -1) * near * 9; }
      L.v += (110 * (lt - L.x) - 10 * L.v) * dt; L.x += L.v * dt;
      if (Math.abs(L.v) > 0.4 || Math.abs(lt - L.x) > 0.2) { moving = true; }
      s.coins.forEach(function (c, i) {
        /* the riffle: coins near the pointer's height step aside, the nearer the further */
        var to = 0;
        if (ptr.in && !ptr.scrub) {
          var dy = slot(i) - qy, fx = Math.max(0, 1 - Math.abs(qx - s.x) / (g.w * 1.3));
          if (fx > 0) { to = (s.x >= qx ? 1 : -1) * 11 * fx * Math.exp(-dy * dy / (2 * Math.pow(g.e * 2.4, 2))); }
        }
        c.vo += (300 * (to - c.o) - 17 * c.vo) * dt; c.o += c.vo * dt;
        if (Math.abs(c.vo) > 0.5 || Math.abs(to - c.o) > 0.2) { moving = true; }
        if (!c.landed) {
          c.vy += 2600 * dt; c.y += c.vy * dt; moving = true;
          if (c.y >= 0) { c.y = 0; if (c.vy > 260) { c.vy = -c.vy * 0.2; c.sq = 1; } else { c.vy = 0; c.landed = true; } }
        }
        if (c.vh || c.hop) { c.vh += 2600 * dt; c.hop += c.vh * dt; if (c.hop > 0) { c.hop = 0; c.vh = Math.abs(c.vh) > 100 ? -c.vh * 0.18 : 0; } moving = true; }
        if (c.sq) { c.sq = Math.max(0, c.sq - dt * 6); moving = true; }
        if (c.pop < 1) { c.pop = Math.min(1, c.pop + dt * 5); moving = true; }
      });
    });
    return moving;
  }
  function draw() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var z = zoom();
    ORDER.forEach(function (k) {
      var s = S[k], n = s.coins.length, frac = s.n.x - Math.floor(s.n.x - 0.001), px = pivot(k);
      cx.save(); cx.translate(px, g.base); cx.scale(z, z); cx.translate(-px, -g.base);
      if (k === 'cash') { floor(S.cash.x, 1); ghost(z); }
      if (k === 'gov') { floor(S.pen.x + g.w * 0.57, 1.75); }
      s.coins.forEach(function (c, i) {
        var top = i === n - 1, part = top && frac < 0.999 ? frac : 1, h = (i + 1) / Math.max(BASE, n);
        var x = s.x + jit(i, k.length) + c.o + s.lean.x * Math.pow(h, 1.4), y = slot(i) + c.y + c.hop;
        var w = g.w * (1 + c.sq * 0.06) * (0.92 + 0.08 * c.pop);
        var a = s.alpha * (part < 1 ? 0.12 + 0.88 * part : 1) * (0.4 + 0.6 * c.pop);
        C.slice(cx, x, y, w, s.kind, a, top && c.landed);
      });
      cx.restore();
    });
    cx.fillStyle = 'rgba(84,99,95,.85)'; cx.font = '600 12px Figtree, system-ui, sans-serif'; cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
    cx.fillText('One coin = ' + fmt(per()) + ' of today’s shopping', 18, H - 14);
    place();
  }
  /* what was paid in (the €1,000, or the reader's money): a faint outline over what is left, and
     beside it its name and its sum, once there is a hole to see */
  function ghost(z) {
    var paid = Math.max(1, paidCoins(years()));
    var x = S.cash.x, rx = g.w / 2 + 1, ry = g.ry + 1, top = slot(paid - 1), bot = g.base - g.ry;
    var n = S.cash.coins.length, solid = n ? slot(n - 1) : g.base;
    cx.save();
    /* only above the coins that are left: the outline is the part that went */
    cx.beginPath(); cx.rect(0, 0, W, solid); cx.clip();
    cx.beginPath(); cx.ellipse(x, top, rx, ry, 0, Math.PI, 0); cx.lineTo(x + rx, bot); cx.ellipse(x, bot, rx, ry, 0, 0, Math.PI); cx.closePath();
    cx.fillStyle = 'rgba(84,99,95,.045)'; cx.fill();
    cx.setLineDash([4, 5]); cx.lineWidth = 1.4; cx.strokeStyle = 'rgba(84,99,95,.38)'; cx.stroke();
    cx.beginPath(); cx.ellipse(x, top, rx, ry, 0, 0, Math.PI); cx.stroke();
    cx.restore();
    /* its name and sum beside it, at its top, on the side with room: "Paid in / €1,000" */
    var hole = paid - S.cash.n.x;
    if (hole < 0.6) { return; }
    var fs = 12, sum = fmt(paidCoins(years()) * per()), lx = x - rx - 9 * (1 / z), rx2 = x + rx + 9 * (1 / z);
    cx.save();
    cx.font = '700 ' + (fs / z).toFixed(1) + 'px Figtree, system-ui, sans-serif';
    var tw = Math.max(cx.measureText('Paid in').width, cx.measureText(sum).width);
    /* the left when it fits (in the view, after the zoom), else the right */
    var px = pivot('cash'), leftOk = px + (lx - tw - px) * z > 8, tx = leftOk ? lx : rx2;
    cx.textAlign = leftOk ? 'right' : 'left'; cx.textBaseline = 'alphabetic';
    var ty = top + ry * 0.3, lh = (fs + 3) / z;
    cx.globalAlpha = Math.min(1, (hole - 0.6) / 0.6);
    cx.fillStyle = '#54635F'; cx.font = '600 ' + (fs / z).toFixed(1) + 'px Figtree, system-ui, sans-serif'; cx.fillText('Paid in', tx, ty - lh * 0.15);
    cx.fillStyle = '#0B1F1C'; cx.font = '700 ' + (fs / z).toFixed(1) + 'px Figtree, system-ui, sans-serif'; cx.fillText(sum, tx, ty + lh * 0.85);
    cx.restore();
  }
  function floor(x, k) {
    var rw = g.w * 0.8 * k, y = g.base + 3, s = cx.createRadialGradient(x, y, 2, x, y, rw);
    s.addColorStop(0, 'rgba(11,31,28,.16)'); s.addColorStop(1, 'rgba(11,31,28,0)');
    cx.save(); cx.translate(x, y); cx.scale(1, g.ry * 0.9 / rw); cx.translate(-x, -y);
    cx.fillStyle = s; cx.beginPath(); cx.arc(x, y, rw, 0, Math.PI * 2); cx.fill(); cx.restore();
  }
  /* the figures sit over their stacks; the pension's keeps clear of the relief's */
  function place() {
    if (!tags.cash) { return; }
    var z = zoom();
    function Zy(y) { return g.base + (y - g.base) * z; }
    function topOf(s) { return Zy(slot(Math.max(0, Math.ceil(s.n.x - 0.001) - 1)) - g.ry) - 10; }
    var yc = Zy(slot(Math.max(1, paidCoins(years())) - 1) - g.ry) - 12, yg = Math.max(84, topOf(S.gov)), yp = Math.max(80, topOf(S.pen));
    /* the relief's figure keeps clear of the pension's coins and of the edge */
    var gw = tags.gov.offsetWidth, xg = Math.min(W - gw / 2 - 8, Math.max(shown('gov') + 6, S.pen.x + g.w / 2 * z + gw / 2 + 6));
    /* side by side when they fit, else the pension's rises clear of the relief's */
    if (!own && S.pen.x + tags.pen.offsetWidth / 2 + 8 > xg - gw / 2) { yp = Math.max(80, Math.min(yp, yg - 52)); }
    [['cash', S.cash.x, yc], ['pen', S.pen.x, yp], ['gov', xg, yg]].forEach(function (t) {
      tags[t[0]].style.setProperty('--x', t[1].toFixed(1) + 'px'); tags[t[0]].style.setProperty('--y', t[2].toFixed(1) + 'px');
    });
  }

  /* ----------------------------------------------------- the reader's time -- */
  function target() {
    var n = years(), u = per();
    S.cash.n.t = cashOf(n) / u; S.pen.n.t = penOf(n) / u; S.gov.n.t = govOf(n) / u;
    if (!K.motion() || !seen) { for (var s in S) { S[s].n.x = S[s].n.t; } }
    kick();
  }
  var touched = false;
  function touch() { touched = true; intro = null; if (hint) { hint.classList.remove('pb-on'); } }
  yrs.addEventListener('input', function () { touch(); words(); target(); });
  var taxSeg = sec.querySelector('.pb-i2-tax'), taxS = null;
  function pressTax(quiet) { if (taxS) { taxS.press(function (b) { return +b.getAttribute('data-rate') / 100 === rate(); }, quiet); } }
  if (taxSeg) { taxS = K.seg(taxSeg, function (b) { LOCAL = +b.getAttribute('data-rate') / 100; touch(); words(); target(); }); }
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
        var p = local(e), best = null;
        ORDER.forEach(function (k) { var d = Math.abs(p.x - shown(k)); if (!best || d < best.d) { best = { k: k, d: d }; } });
        S[best.k].coins.forEach(function (c, i) { setTimeout(function () { c.vh = -(200 + i * 4); kick(); }, i * 26); });
        touch();
      }
      ptr.scrub = false; ptr.in = e.pointerType === 'mouse'; kick();
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }

  /* ------------------------------------------------- the reader's money -- */
  /* from the calculator, once the reader has set it: what is saved and what goes in a month, to 66.
     The slider becomes the age you look at, next year to 66; it stays at 66 unless the reader moved it */
  var YRS = { min: yrs.min, max: yrs.max, value: yrs.value };
  function fromPlan() {
    var p = K.plan;
    if (!p || !p.set) { return false; }
    var m = (+p.mine || 0) + (+p.emp || 0), saved = +p.saved || 0, a = Math.min(AT - 1, +p.age || 35);
    /* nothing saved and nothing going in: back to the €1,000 */
    if (!(m > 0) && !(saved > 0)) {
      if (!own) { return false; }
      own = null; sec.classList.remove('pb-i2-own'); W = 0; g = null;
      yrs.min = YRS.min; yrs.max = YRS.max; yrs.value = YRS.value;
      return true;
    }
    var k = m + '/' + saved + '/' + a;
    if (own && own.k === k) { return false; }
    /* where the slider is, or is going (the first look runs it there) */
    var was = own ? (intro ? intro.to : +yrs.value) : AT, wasMax = own ? +yrs.max : AT;
    own = { m: m, p: saved, age: a, per: nice((saved + m * 12 * (AT - a)) / BASE), k: k };
    sec.classList.add('pb-i2-own');
    W = 0; g = null;
    yrs.min = a + 1; yrs.max = AT;
    yrs.value = was >= wasMax ? AT : Math.max(a + 1, Math.min(AT, was));
    return true;
  }
  /* standalone since 2026-10-15: the calculator's plan is not read (fromPlan stays for the record) */

  /* ------------------------------------------------------ housekeeping -- */
  window.addEventListener('resize', function () { W = 0; g = null; kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; g = null; kick(); }); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', kick);
  $('pbI2Ctl').hidden = false;
  var dep = $('pbI2Dep');
  if (dep && PA && PA.cash) { dep.textContent = PA.cash.pct + ' a year, the Central Bank’s average for household overnight deposits in ' + PA.cash.month; }
  pressTax(true);
  words(); target();
  if (!cx || !C) { return; }
  sec.classList.add('pb-i2-on');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting;
      if (onScreen && !seen) {
        seen = true;
        if (K.motion()) {
          /* the first look: the stacks build, then time runs from the slider's start to its value */
          var to = +yrs.value, from = +yrs.min; yrs.value = from; words();
          var n0 = years();
          S.cash.n.x = S.cash.n.t = cashOf(n0) / per(); S.pen.n.x = S.pen.n.t = penOf(n0) / per(); S.gov.n.x = S.gov.n.t = govOf(n0) / per();
          if (!g) { size(); }
          ['cash', 'pen', 'gov'].forEach(function (k, j) {
            S[k].coins = [];
            var want = Math.ceil(S[k].n.x - 0.001);
            for (var i = 0; i < want; i++) { var c = mkCoin('drop', i); c.y -= i * 22 + j * 120; S[k].coins.push(c); }
          });
          intro = { t0: performance.now() / 1000 + 0.9, dur: 2.8, from: from, to: to };
        }
      }
      if (onScreen) { kick(); }
    }, { threshold: 0.35 }).observe(cv);
  } else { seen = true; kick(); }
}());
