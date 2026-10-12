/* The director page's hero (#drHero), 11 October 2026, Damian's brief: "at
   the very top, as simply as possible, why a director is different; super
   motion design, super simple, super interactive".

   €1,000 of company profit, three ways: three stacks of ten coins, one coin
   is €100. Every coin starts blue: the company's money.
     As salary         income tax, USC and PRSI come off now. What reaches you
                       is 1,000 x PBDirector.keepRate(PRSI), the figure the
                       page's inline script works out from PBPrsi by date
                       (window.PBDirKeep.per1000: €476.50 with PRSI at 4.35%
                       from 1 October 2026). 4.765 coins turn silver (yours);
                       5.235 turn gold and fly up to the tax tray: €477 and
                       -€523.
     Left as profit    corporation tax at the trading rate (PBDirector.CT,
                       12.5%) takes 1.25 coins; 8.75 stay blue, in the
                       company: €875 and -€125.
     Into your pension all ten go in and turn silver. No tax now: it is taxed
                       when it is taken. €1,000 and €0.
   A dashed outline keeps the €1,000 a stack was, so what it lost is a hole
   you can see; a part coin shows as a part (its opacity). The words in the
   markup are the finished answer: without script, or before this runs, the
   base row and the fine print carry every figure, and every figure here ends
   on the markup's.

   Motion: the H1 rises word by word as the page arrives. The first time the
   stage is seen (35% on screen) thirty blue coins drop into three stacks;
   then salary peels (the top coins hop off one by one and follow one
   another along the same curve, out to the right, over and down onto the
   tax tray, flipping over in the air and coming round gold; the sixth
   splits and its part follows; the rest turn silver, a ripple up the
   stack), then profit, then the pension's ten turn silver, a teal ring
   spreads off the top coin and a sheen of light runs up the stack.
   The figures roll. Then the reader plays it: the stacks lean away from the
   pointer and riffle round it; a sideways drag runs it back to "before tax"
   and forward again (each coin on its own spring, so the stacks bend), and on
   release it snaps to the nearer end; a tap on a stack, or on its figure
   below, rains its gold back down and runs it again. With motion off it is
   drawn once, finished; a drag still shows "before" while it is held. */
(function () {
  'use strict';
  var hero = document.getElementById('drHero'), K = window.PBKit, C = window.PBCoins, PD = window.PBDirector;
  if (!hero || !K) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var stage = hero.querySelector('.dr3-stage'), cv = stage ? stage.querySelector('.dr3-cv') : null;
  if (!stage || !cv) { return; }
  var cx = cv.getContext ? cv.getContext('2d') : null;
  var KEEP = window.PBDirKeep && window.PBDirKeep.per1000;
  if (!(KEEP > 0) && PD && window.PBPrsi) { KEEP = Math.round(1000 * PD.keepRate(window.PBPrsi.at(new Date()).rate) * 100) / 100; }
  /* nothing to draw with: the empty card goes, the words stay */
  if (!cx || !C || !PD || !(KEEP > 0) || !(PD.CT >= 0)) { stage.style.display = 'none'; return; }

  var fmt = K.fmt, TEN = 10, PER = 100;
  /* the peel, in seconds: each coin that goes hops, then flies; the next one
     goes STAG later; the coins that stay turn over FSTAG apart, bottom up */
  var STAG = 0.12, HOP = 0.12, FL = 0.44, SQ = 0.18, FLIP = 0.3, FSTAG = 0.04, LIFT = 14, SHINE = 0.9;
  var MINUS = '\u2212';

  /* ------------------------------------------------------- the stacks -- */
  function coin() { return { o: 0, vo: 0, hop: 0, vh: 0, wd: 0, wv: 0, dy: 0, vy: 0, land: true, sq: 0, dl: 0 }; }
  function Col(id, kc, stay, fig) {
    var tag = $('dr3T' + id.charAt(0).toUpperCase() + id.slice(1)), b = $('dr3' + id.charAt(0).toUpperCase() + id.slice(1));
    var c = {
      id: id, stay: stay, fig: fig, tax: 1000 - fig, taxC: TEN - kc, fly: [], coins: [], tray: [], flipAt: [],
      u: 1, v: 0, tau: 0, drv: null, x: 0, lean: { x: 0, v: 0 }, sh: -1,
      bR: b ? new K.Roll(b) : null, bEl: b, tag: tag, tB: tag ? tag.querySelector('b') : null, tR: null,
      tA: { x: 1, v: 0 }, tY: { x: 0, v: 0 }, tOn: true, tSet: false
    };
    if (c.tB) { c.tR = new K.Roll(c.tB); }
    var whole = Math.floor(kc + 1e-6), frac = kc - whole, i, s = 0;
    if (frac < 0.005) { frac = 0; } else if (frac > 0.995) { whole++; frac = 0; }
    c.whole = whole; c.frac = frac; c.split = frac ? whole : -1;
    /* the top coin goes first and lands at the bottom of the tray; a part
       coin splits, and its part goes last */
    for (i = TEN - 1; i >= whole + (frac ? 1 : 0); i--) { c.fly.push({ from: i, val: 1, slot: s++ }); }
    if (frac) { c.fly.push({ from: whole, val: 1 - frac, slot: s++, piece: true }); }
    /* every coin takes the same arc, out to the right and over: a stream,
       not a scatter */
    c.fly.forEach(function (f, m) { f.s0 = m * STAG; f.up = f.s0 + HOP; f.land = f.up + FL; f.side = 1; });
    var F0 = c.fly.length ? c.fly[c.fly.length - 1].s0 + HOP + 0.1 : 0.05, end = 0.3;
    for (i = 0; i < TEN; i++) {
      c.coins.push(coin());
      c.flipAt.push(stay !== 'blue' && i < whole + (frac ? 1 : 0) ? F0 + i * FSTAG : -1);
      if (c.flipAt[i] >= 0) { end = Math.max(end, c.flipAt[i] + FLIP); }
    }
    c.fly.forEach(function (f) { c.tray.push(coin()); end = Math.max(end, f.land + SQ); });
    c.D = end; c.tau = end;
    return c;
  }
  var COLS = [
    Col('sal', KEEP / PER, 'silver', Math.round(KEEP)),
    Col('pro', 1000 * (1 - PD.CT) / PER, 'blue', Math.round(1000 * (1 - PD.CT))),
    Col('pen', TEN, 'silver', 1000)
  ];
  var hint = $('dr3Hint');

  /* ----------------------------------------------------------- layout -- */
  var W = 0, H = 0, dpr = 1, G = null;
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    /* top: clear of the hint (13px type at 14px from the top) */
    var small = W < 480, bot = small ? 32 : 42, top = 46, tagH = (COLS[0].tag && COLS[0].tag.offsetHeight) || 41;
    var maxT = 1; COLS.forEach(function (c) { maxT = Math.max(maxT, c.fly.length); });
    /* the coins as wide as the stage allows, then narrower until the stack,
       the tray, its figure and the hint all fit one above the other */
    var w = Math.min(112, W * 0.2), hS, wt, hT, stackH, trayH, room;
    for (;;) {
      hS = C.sliceH(Math.round(w)); wt = Math.round(w * 0.62); hT = C.sliceH(wt);
      stackH = TEN * hS.e + 2 * hS.ry; trayH = maxT * hT.e + 2 * hT.ry;
      room = (H - bot) - top - tagH - 8 - trayH - stackH;
      if (room >= 26 || w <= 30) { break; }
      w -= 2;
    }
    var gap = Math.max(26, Math.min(room, H * 0.18)), baseY = H - bot;
    G = { w: Math.round(w), e: hS.e, ry: hS.ry, wt: wt, et: hT.e, ryt: hT.ry, base: baseY, shelf: baseY - stackH - gap, small: small };
    COLS.forEach(function (c, j) { c.x = W * (0.2 + 0.3 * j); if (!c.tSet) { c.tY.x = tagTarget(c); } });
  }
  function slotY(i) { return G.base - G.ry - G.e - i * G.e; }
  function trayY(s) { return G.shelf - G.ryt - G.et - s * G.et; }
  /* each coin's own small offset, so a stack is a stack and not a cylinder */
  function jit(i, k) { var v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return (v - Math.floor(v) - 0.5) * 1.6; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function easeOut(k) { return 1 - Math.pow(1 - k, 3); }

  /* --------------------------------------------- where a coin is at tau -- */
  /* 0 at home, 1 hopping, 2 in the air, 3 in the tray */
  function phase(f, tau) { return tau <= f.s0 ? 0 : tau < f.up ? 1 : tau < f.land ? 2 : 3; }
  function figures(c, quiet) {
    var got = 0;
    c.fly.forEach(function (f) { if (c.tau >= f.land) { got += f.val; } });
    var tax = c.taxC > 0.0001 ? Math.round(c.tax * got / c.taxC) : 0;
    if (c.bR) { c.bR.set(fmt(1000 - tax), quiet); }
    if (c.tR) { c.tR.set(tax > 0 ? MINUS + fmt(tax) : fmt(0), quiet); }
  }
  /* the figure rides on its tray, and lifts a little while a coin is coming */
  function tagTarget(c) {
    var n = 0, lift = 0;
    c.fly.forEach(function (f) { if (c.tau >= f.land - FL * 0.45) { n = Math.max(n, f.slot + 1); } if (c.tau > f.up && c.tau < f.land) { lift = 10; } });
    return (n ? trayY(n - 1) - G.ryt : G.shelf - G.ryt) - 8 - lift;
  }

  /* -------------------------------------------------------- the frame -- */
  var raf = 0, last = 0, onScreen = true, seen = false, calm = 0, intro = null, touched = false;
  function kick() { calm = 0; if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    if (!W || !G) { size(); }
    if (W < 120 || H < 120) { return; }
    var motion = K.motion(), moving = false;
    if (!motion) { still(); } else { moving = step(now, dt); }
    draw();
    calm = moving ? 0 : calm + dt;
    if (motion && onScreen && !document.hidden && calm < 0.6) { raf = requestAnimationFrame(frame); }
  }
  /* motion off: the finished picture, or "before" while a drag holds it */
  function still() {
    intro = null; rings = [];
    COLS.forEach(function (c) {
      c.drv = null; c.sh = -1; c.u = ptr.scrub ? ptr.t : 1; c.tau = c.u * c.D; c.lean.x = c.lean.v = 0; c.tOn = true; c.tA.x = 1; c.tY.x = tagTarget(c);
      c.coins.concat(c.tray).forEach(function (o) { o.dy = o.vy = o.o = o.vo = o.hop = o.vh = o.sq = o.dl = o.wd = 0; o.land = true; });
      figures(c, true);
    });
    hideHint();
  }
  function step(now, dt) {
    var moving = false;
    if (intro && now >= intro.end) { intro = null; setTimeout(function () { if (!touched && hint && K.motion()) { hint.classList.add('pb-on'); } }, 500); }
    if (intro) { moving = true; }
    COLS.forEach(function (c, j) {
      var a = c.tau;
      if (drive(c, now, dt)) { moving = true; }
      c.tau = c.u * c.D;
      if (c.tau > a) { events(c, a, c.tau); }
      figures(c);
      /* its figure: fades and drops in when its column first goes, then rides */
      var ta = c.tOn ? 1 : 0, ty = tagTarget(c);
      c.tA.v += (220 * (ta - c.tA.x) - 26 * c.tA.v) * dt; c.tA.x += c.tA.v * dt;
      c.tY.v += (210 * (ty - c.tY.x) - 17 * c.tY.v) * dt; c.tY.x += c.tY.v * dt;
      if (Math.abs(c.tA.v) > 0.01 || Math.abs(ta - c.tA.x) > 0.005 || Math.abs(c.tY.v) > 0.3 || Math.abs(ty - c.tY.x) > 0.2) { moving = true; }
      if (c.sh >= 0) { c.sh += dt; if (c.sh > SHINE) { c.sh = -1; } moving = true; }
    });
    if (stepCoins(dt)) { moving = true; }
    if (stepRings(dt)) { moving = true; }
    ptr.vx *= Math.exp(-dt * 7);
    return moving;
  }
  /* a column's progress u, 0 before tax, 1 after: tweened in time (the
     choreography has its own easing) or, under a drag, on a spring */
  function drive(c, now, dt) {
    var d = c.drv;
    if (!d) { return false; }
    if (d.sp) {
      var acc = 300 * (d.to - c.u) - 32 * c.v; c.v += acc * dt; c.u = clamp(c.u + c.v * dt, 0, 1);
      return Math.abs(d.to - c.u) > 1e-4 || Math.abs(c.v) > 1e-3;
    }
    if (now < d.t0) { return true; }
    if (!d.go) { d.go = true; if (d.start) { d.start(); } }
    var k = d.dur > 0 ? clamp((now - d.t0) / d.dur, 0, 1) : 1;
    c.u = d.from + (d.to - d.from) * k; c.v = 0;
    if (k >= 1) { c.drv = d.next || null; if (d.then) { d.then(); } }
    return true;
  }
  function tw(to, t0, rate, more) {
    /* rate: how fast against the choreography's own pace */
    var d = { to: to, t0: t0, rate: rate || 1 };
    for (var k in more) { if (more.hasOwnProperty(k)) { d[k] = more[k]; } }
    return d;
  }
  function begin(c, d) {
    /* a tween's length, from where it starts; the next one starts where it ends */
    if (d.from === undefined) { d.from = c.u; }
    d.dur = Math.max(0.2, Math.abs(d.to - d.from) * c.D / d.rate);
    if (d.next) { d.next.from = d.to; d.next.t0 = d.t0 + d.dur + (d.next.wait || 0); begin(c, d.next); }
    return d;
  }
  /* a ripple where a part coin splits, and where each coin lands: it
     starts as the coin's own outline and spreads out from under it */
  function events(c, a, b) {
    c.fly.forEach(function (f) {
      if (f.piece && a < f.s0 && b >= f.s0) { ring(c.x, slotY(f.from), G.w / 2, G.ry, 'rgba(96,122,168,.5)', 0.45, true); }
      if (a < f.land && b >= f.land) { ring(c.x, trayY(f.slot) + G.et, G.wt / 2, G.ryt, 'rgba(170,128,46,.55)', 0.5, false); }
    });
  }
  /* the pension's ten are all yours: a teal ring off the top coin and a
     sheen of light up the stack, no confetti */
  function finale(c) {
    ring(c.x, slotY(TEN - 1), G.w / 2, G.ry, 'rgba(20,203,177,.8)', 0.7, true);
    c.sh = 0;
    pulse(c.bEl, 1.1); pulse(c.tB, 1.18);
  }
  /* how much light the sheen puts on coin i: a soft band, bottom to top */
  function sheen(c, i) {
    if (c.sh < 0) { return 0; }
    var s = c.sh / SHINE * 1.5 - 0.25, d = (i / (TEN - 1) - s) / 0.14;
    return 0.22 * Math.exp(-d * d) * Math.min(1, (SHINE - c.sh) * 6);
  }
  var rings = [];
  function ring(x, y, rx, ry, col, life, front) { rings.push({ x: x, y: y, rx: rx, ry: ry, c: col, age: 0, life: life, front: front }); }
  function stepRings(dt) { rings = rings.filter(function (r) { r.age += dt; return r.age < r.life; }); return rings.length > 0; }
  function drawRings(front) {
    rings.forEach(function (r) {
      if (r.front !== front) { return; }
      var k = r.age / r.life, s = 1 + 0.5 * (1 - Math.pow(1 - k, 3));
      cx.globalAlpha = (1 - k) * (1 - k); cx.strokeStyle = r.c; cx.lineWidth = 1.7 - k;
      cx.beginPath(); cx.ellipse(r.x, r.y, r.rx * s, r.ry * s, 0, 0, Math.PI * 2); cx.stroke();
    });
    cx.globalAlpha = 1;
  }
  function pulse(el, s) {
    if (!el || !el.animate || !K.motion()) { return; }
    try { el.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + s + ')' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.3,1.5,.5,1)' }); } catch (e) { /* fine */ }
  }

  /* the coins' own springs: the drop, the lean, the riffle, a wave */
  function stepCoins(dt) {
    var moving = false;
    COLS.forEach(function (c) {
      var L = c.lean, lt = 0;
      if (ptr.scrub) { lt = clamp(-ptr.vx * 0.022, -18, 18); }
      else if (ptr.in) { var dx = c.x - ptr.x, near = Math.max(0, 1 - Math.abs(dx) / (G.w * 2.2)); lt = (dx > 0 ? 1 : -1) * near * 9; }
      L.v += (110 * (lt - L.x) - 10 * L.v) * dt; L.x += L.v * dt;
      if (Math.abs(L.v) > 0.4 || Math.abs(lt - L.x) > 0.2) { moving = true; }
      c.coins.forEach(function (o, i) { if (spring(o, i, c, slotY(i), G.w, G.e, (i + 1) / TEN, dt)) { moving = true; } });
      c.tray.forEach(function (o, s) { if (spring(o, s, c, trayY(s), G.wt, G.et, 0.35 * (s + 1) / 6, dt)) { moving = true; } });
    });
    return moving;
  }
  function spring(o, i, c, y, w, e, h, dt) {
    var moving = false;
    if (o.dl > 0) { o.dl -= dt; return true; }
    if (!o.land) {
      o.vy += 2600 * dt; o.dy += o.vy * dt; moving = true;
      if (o.dy >= 0) { o.dy = 0; if (o.vy > 260) { o.vy = -o.vy * 0.2; o.sq = 1; } else { o.vy = 0; o.land = true; } }
    }
    /* the stack leans away from the pointer and bends: each coin on its own
       spring, the top ones softer, so they catch up last */
    var to = c.lean.x * Math.pow(h, 1.4);
    if (ptr.in && !ptr.scrub) {
      var dy = y - ptr.y, fx0 = Math.max(0, 1 - Math.abs(ptr.x - c.x) / (w * 1.3));
      if (fx0 > 0) { to += (c.x >= ptr.x ? 1 : -1) * 11 * fx0 * Math.exp(-dy * dy / (2 * Math.pow(e * 2.4, 2))); }
    }
    var k = 260 - 12 * i;
    o.vo += (k * (to - o.o) - 17 * o.vo) * dt; o.o += o.vo * dt;
    if (Math.abs(o.vo) > 0.5 || Math.abs(to - o.o) > 0.2) { moving = true; }
    if (o.wd > 0) { o.wd -= dt; if (o.wd <= 0) { o.vh = o.wv; } moving = true; }
    if (o.vh || o.hop) { o.vh += 2600 * dt; o.hop += o.vh * dt; if (o.hop > 0) { o.hop = 0; o.vh = Math.abs(o.vh) > 100 ? -o.vh * 0.18 : 0; } moving = true; }
    if (o.sq) { o.sq = Math.max(0, o.sq - dt * 6); moving = true; }
    return moving;
  }
  function wave(list, base, per) { list.forEach(function (o, i) { o.wd = 0.001 + i * 0.026; o.wv = -(base + i * per); }); }

  /* --------------------------------------------------------- the draw -- */
  function draw() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    shelf();
    drawRings(false);
    var air = [];
    COLS.forEach(function (c, j) {
      var tau = c.tau, home = -1, gone = 0, i;
      /* which coins are still in the stack */
      var fl = [];
      for (i = 0; i < TEN; i++) { fl.push(null); }
      c.fly.forEach(function (f, m) { var p = phase(f, tau); if (!f.piece) { fl[f.from] = { f: f, p: p }; } if (p >= 2) { gone += f.val; } if (p === 2 || (f.piece && p === 1)) { air.push({ c: c, f: f, j: j }); } });
      for (i = 0; i < TEN; i++) { if (c.coins[i].dl <= 0 && (!fl[i] || fl[i].p < 2)) { home = i; } }
      floor(c.x, G.base + 3, G.w * 0.8, G.ry * 0.9, 1);
      if (gone > 0) { ghost(c, home >= 0 ? slotY(home) : G.base, clamp(gone * 2, 0, 1)); }
      for (i = 0; i < TEN; i++) {
        var o = c.coins[i];
        if (o.dl > 0) { continue; }
        var st = fl[i], lift = 0;
        if (st && st.p >= 2) { continue; }
        if (st && st.p === 1) { lift = LIFT * easeOut((tau - st.f.s0) / HOP); }
        var a = 1, q = 0;
        if (i === c.split) {
          var pc = c.fly[c.fly.length - 1];
          a = 1 - (1 - (0.12 + 0.88 * c.frac)) * clamp((tau - pc.s0) / 0.15, 0, 1);
        }
        if (c.flipAt[i] >= 0) { q = clamp((tau - c.flipAt[i]) / FLIP, 0, 1); }
        var x = c.x + jit(i, j) + o.o, y = slotY(i) + o.dy + o.hop - lift, w = G.w * (1 + o.sq * 0.06), top = i === home && o.land;
        /* a coin that becomes yours turns over in place: a ripple runs up
           the stack, each coin lifts a little and the silver comes up through
           the blue with a glint */
        var gl = sheen(c, i);
        if (q <= 0) { metal(x, y, w, 'blue', a, top, 1, 0, gl); }
        else if (q >= 1) { metal(x, y, w, c.stay, a, top, 1, 0, gl); }
        else {
          var bump = Math.sin(Math.PI * q);
          metal(x, y - 3 * bump, w, 'blue', a, top, 1, 0, 0);
          metal(x, y - 3 * bump, w, c.stay, a * q * q * (3 - 2 * q), top, 1, 0, 0.16 * bump + gl);
        }
      }
      /* the tax tray */
      var n = 0;
      c.fly.forEach(function (f) { if (phase(f, tau) === 3) { n = Math.max(n, f.slot + 1); } });
      if (n) { floor(c.x, G.shelf + 2, G.wt * 0.75, G.ryt * 0.9, Math.min(1, n)); }
      c.fly.forEach(function (f) {
        if (phase(f, tau) !== 3) { return; }
        var t = c.tray[f.slot], sq = Math.max(0, 1 - (tau - f.land) / SQ);
        metal(c.x + jit(f.slot, j + 5) * 0.6 + t.o, trayY(f.slot) + t.hop + sq * 2, G.wt * (1 + sq * 0.08), 'gold', f.val < 1 ? 0.12 + 0.88 * f.val : 1, f.slot === n - 1, 1, 0, sq * 0.2);
      });
    });
    /* the coins in the air, over everything */
    air.forEach(function (q) { flying(q.c, q.f, q.j); });
    drawRings(true);
    cx.fillStyle = 'rgba(84,99,95,.85)'; cx.font = '600 12px Figtree, system-ui, sans-serif'; cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
    cx.fillText('1 coin = €100', G.small ? 14 : 18, H - (G.small ? 11 : 15));
    place();
  }
  /* a coin from the side (PBCoins.slice), turned about its middle: sx < 1
     is part way through a flip, glint brightens it for a moment */
  function metal(x, y, w, kind, a, top, sx, rot, glint) {
    if (sx >= 0.999 && !rot && !(glint > 0.01)) { C.slice(cx, x, y, w, kind, a, top); return; }
    cx.save(); cx.translate(x, y); if (rot) { cx.rotate(rot); } if (sx < 0.999) { cx.scale(Math.max(0.04, sx), 1); }
    C.slice(cx, 0, 0, w, kind, a, top && sx > 0.85);
    if (glint > 0.01) { cx.globalCompositeOperation = 'lighter'; C.slice(cx, 0, 0, w, kind, a * glint, top && sx > 0.85); }
    cx.restore();
  }
  /* a coin in the air: it rises off its stack, arcs out to one side and
     drops onto the tray. Half way up it flips over, and comes round gold */
  function flying(c, f, j) {
    var tau = c.tau, x0 = c.x, y0 = slotY(f.from) - LIFT, x1 = c.x, y1 = trayY(f.slot);
    var alpha = f.piece ? 0.12 + 0.88 * f.val : 1;
    if (tau < f.up) {
      /* the part coin rises out of its coin */
      var k = easeOut((tau - f.s0) / HOP);
      C.slice(cx, c.x + jit(f.from, j) + c.coins[f.from].o, slotY(f.from) - LIFT * k, G.w, 'blue', alpha * k, false);
      return;
    }
    /* one curve for every coin (a cubic Bezier): off the stack up and out
       to the right, over, and down onto the tray with some weight, so each
       one lands rather than drifts in */
    var p = clamp((tau - f.up) / FL, 0, 1), side = f.side, d = Math.max(40, y0 - y1);
    var ax = x0 + side * G.w * 0.8, ay = y0 - d * 0.6, bx = x1 + side * G.w * 0.6, by = y1 - Math.min(G.wt, d * 0.45 + 16);
    var m = 1 - p, k0 = m * m * m, k1 = 3 * m * m * p, k2 = 3 * m * p * p, k3 = p * p * p;
    var x = k0 * x0 + k1 * ax + k2 * bx + k3 * x1, y = k0 * y0 + k1 * ay + k2 * by + k3 * y1;
    var w = G.w + (G.wt - G.w) * easeOut(p);
    var q = clamp((p - 0.16) / 0.46, 0, 1), sx = Math.abs(Math.cos(Math.PI * q)), gold = q >= 0.5;
    var glint = gold ? 0.2 * Math.max(0, 1 - (q - 0.5) * 2.2) : 0;
    metal(x, y, w, gold ? 'gold' : 'blue', alpha, false, sx, side * 0.16 * Math.sin(Math.PI * p), glint);
  }
  /* the €1,000 a stack was: a faint outline, only above the coins left */
  function ghost(c, solid, a) {
    var x = c.x, rx = G.w / 2 + 1, ry = G.ry + 1, top = slotY(TEN - 1), bot = G.base - G.ry;
    cx.save(); cx.globalAlpha = a;
    cx.beginPath(); cx.rect(0, 0, W, solid); cx.clip();
    cx.beginPath(); cx.ellipse(x, top, rx, ry, 0, Math.PI, 0); cx.lineTo(x + rx, bot); cx.ellipse(x, bot, rx, ry, 0, 0, Math.PI); cx.closePath();
    cx.fillStyle = 'rgba(84,99,95,.045)'; cx.fill();
    cx.setLineDash([4, 5]); cx.lineWidth = 1.4; cx.strokeStyle = 'rgba(84,99,95,.38)'; cx.stroke();
    cx.beginPath(); cx.ellipse(x, top, rx, ry, 0, 0, Math.PI); cx.stroke();
    cx.restore();
  }
  function floor(x, y, rw, rh, a) {
    var s = cx.createRadialGradient(x, y, 1, x, y, rw);
    s.addColorStop(0, 'rgba(11,31,28,' + (0.16 * a).toFixed(3) + ')'); s.addColorStop(1, 'rgba(11,31,28,0)');
    cx.save(); cx.translate(x, y); cx.scale(1, rh / rw); cx.translate(-x, -y);
    cx.fillStyle = s; cx.beginPath(); cx.arc(x, y, rw, 0, Math.PI * 2); cx.fill(); cx.restore();
  }
  /* "tax now": a faint gold line the trays sit on, an empty place on it for each */
  function shelf() {
    var y = G.shelf, g = cx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(182,139,55,0)'); g.addColorStop(0.12, 'rgba(182,139,55,.42)'); g.addColorStop(0.88, 'rgba(182,139,55,.42)'); g.addColorStop(1, 'rgba(182,139,55,0)');
    cx.save(); cx.setLineDash([2, 6]); cx.lineCap = 'round'; cx.lineWidth = 1.5; cx.strokeStyle = g;
    cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke();
    cx.setLineDash([3, 4]); cx.lineWidth = 1.2; cx.strokeStyle = 'rgba(182,139,55,.5)'; cx.fillStyle = '#fff';
    COLS.forEach(function (c) { cx.beginPath(); cx.ellipse(c.x, y - G.ryt, G.wt / 2 + 2, G.ryt + 1, 0, 0, Math.PI * 2); cx.fill(); cx.stroke(); });
    cx.restore();
  }
  /* the tags sit on their trays */
  function place() {
    COLS.forEach(function (c) {
      if (!c.tag) { return; }
      c.tSet = true;
      c.tag.style.setProperty('--x', c.x.toFixed(1) + 'px');
      c.tag.style.setProperty('--y', c.tY.x.toFixed(1) + 'px');
      var a = clamp(c.tA.x, 0, 1);
      c.tag.style.opacity = a > 0.995 ? '' : a.toFixed(3);
    });
  }

  /* ------------------------------------------------- the first look -- */
  function startIntro() {
    if (!G) { size(); }
    var now = performance.now() / 1000, t0 = now + 0.05, AT = [1.25, 2.25, 2.85];
    COLS.forEach(function (c, j) {
      c.u = 0; c.tau = 0; c.v = 0; c.tOn = false; c.tA.x = 0; c.tA.v = 0;
      c.coins.forEach(function (o, i) { o.land = false; o.vy = 0; o.dy = -(slotY(i) + G.w * 0.6 + 20 + i * 6); o.dl = 0.05 + (i * 3 + j) * 0.022; });
      figures(c, true);
      c.drv = begin(c, tw(1, t0 + AT[j], 1, {
        from: 0,
        start: function () { c.tOn = true; c.tY.x = tagTarget(c) - 16; c.tY.v = 0; },
        then: c.id === 'pen' ? function () { finale(c); } : null
      }));
    });
    intro = { end: t0 + AT[2] + COLS[2].D + 0.3 };
  }
  /* any press ends it, finished */
  function finishIntro() {
    if (!intro) { return; }
    intro = null;
    COLS.forEach(function (c) {
      c.drv = null; c.u = 1; c.tau = c.D; c.tOn = true;
      c.coins.forEach(function (o) { o.dl = 0; o.dy = 0; o.vy = 0; o.land = true; });
      figures(c);
    });
  }

  /* ------------------------------------------------------ the reader -- */
  var ptr = { in: false, x: -1, y: -1, down: false, sx: 0, sy: 0, scrub: false, moved: false, t: 1, t0: 1, tv: 0, vx: 0, lx: 0, lt: 0, lT: 1 };
  function hideHint() { if (hint) { hint.classList.remove('pb-on'); } }
  function touch() { touched = true; hideHint(); }
  function local(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function nearest(x) {
    var best = 0;
    COLS.forEach(function (c, j) { if (Math.abs(x - c.x) < Math.abs(x - COLS[best].x)) { best = j; } });
    return best;
  }
  /* a tap: the column's gold rains back down as blue, then it goes again */
  function tapCol(j) {
    touch();
    if (!K.motion() || !G || !seen) { return; }
    finishIntro();
    var c = COLS[j], now = performance.now() / 1000;
    wave(c.coins, c.fly.length ? 150 : 220, c.fly.length ? 3 : 4);
    c.drv = begin(c, tw(0, now, c.fly.length ? 1.9 : 3, { next: tw(1, 0, 1, { wait: 0.4, then: c.id === 'pen' ? function () { finale(c); } : null }) }));
    kick();
  }
  function release() {
    var end = ptr.t + 0.12 * ptr.tv >= 0.5 ? 1 : 0, now = performance.now() / 1000;
    ptr.scrub = false;
    if (!K.motion()) { kick(); return; }
    COLS.forEach(function (c, j) {
      c.v = 0;
      if (end === 1) { c.drv = begin(c, tw(1, now, 1.6)); }
      else {
        /* back to before, then the peel runs again, column by column */
        c.drv = begin(c, tw(0, now, 2.2, { next: tw(1, 0, 1, { wait: 0.6 + j * 0.45, then: c.id === 'pen' ? function () { finale(c); } : null }) }));
      }
    });
    kick();
  }
  cv.addEventListener('pointermove', function (e) {
    var p = local(e), t = performance.now() / 1000;
    ptr.x = p.x; ptr.y = p.y; ptr.in = true;
    if (ptr.down && G) {
      var dx = p.x - ptr.sx, dy = p.y - ptr.sy;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) { ptr.moved = true; }
      if (!ptr.scrub && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        ptr.scrub = true; touch(); finishIntro();
        try { cv.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
        ptr.t0 = 0; COLS.forEach(function (c) { ptr.t0 += c.u / COLS.length; });
        ptr.sx = p.x; ptr.lT = ptr.t0; ptr.tv = 0;
        dx = 0;
      }
      if (ptr.scrub) {
        var span = Math.max(200, W * 0.75), tt = clamp(ptr.t0 + dx / span, 0, 1), el = Math.max(0.008, t - ptr.lt);
        ptr.tv = ptr.tv * 0.6 + 0.4 * (tt - ptr.lT) / el; ptr.lT = tt; ptr.t = tt;
        ptr.vx = ptr.vx * 0.5 + 0.5 * (p.x - ptr.lx) / el;
        COLS.forEach(function (c) { c.drv = { sp: true, to: tt }; });
      }
    }
    ptr.lx = p.x; ptr.lt = t;
    kick();
  });
  cv.addEventListener('pointerleave', function () { if (!ptr.down) { ptr.in = false; } kick(); });
  cv.addEventListener('pointerdown', function (e) {
    var p = local(e);
    ptr.down = true; ptr.sx = p.x; ptr.sy = p.y; ptr.moved = false; ptr.scrub = false; ptr.lx = p.x; ptr.lt = performance.now() / 1000;
    kick();
  });
  function up(e, cancel) {
    if (!ptr.down) { return; }
    ptr.down = false;
    if (ptr.scrub) { release(); }
    else if (!cancel && !ptr.moved && G) { var p = local(e); tapCol(nearest(p.x)); }
    ptr.in = e.pointerType === 'mouse';
    kick();
  }
  cv.addEventListener('pointerup', function (e) { up(e, false); });
  cv.addEventListener('pointercancel', function (e) { up(e, true); });
  /* the figures below are the stacks' too */
  var IDS = COLS.map(function (c) { return c.id; }), baseRow = $('dr3Base');
  if (baseRow) {
    [].forEach.call(baseRow.querySelectorAll('li[data-col]'), function (li) {
      li.addEventListener('click', function () { var j = IDS.indexOf(li.getAttribute('data-col')); if (j >= 0) { tapCol(j); } });
    });
  }

  /* ------------------------------------------------------ the headline -- */
  /* its words rise out of a mask, one after another (the site's own rise,
     the ALIVE block's classes; pb-alive.js leaves the audience heroes' h1
     alone). The markup stays plain words. */
  function rise() {
    var h = $('drH1');
    if (!h || !K.motion() || h.children.length || h.classList.contains('pb-al-split')) { return; }
    var n = 0, frag = document.createDocumentFragment();
    h.textContent.split(/(\s+)/).forEach(function (w) {
      if (!w) { return; }
      if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
      var m = document.createElement('span'); m.className = 'pb-al-m';
      var s = document.createElement('span'); s.className = 'pb-al-w'; s.style.setProperty('--i', n++); s.textContent = w;
      m.appendChild(s); frag.appendChild(m);
    });
    h.textContent = ''; h.appendChild(frag); h.classList.add('pb-al-split');
    requestAnimationFrame(function () { h.classList.add('pb-al-on'); });
  }

  /* ---------------------------------------------------- housekeeping -- */
  window.addEventListener('resize', function () { W = 0; G = null; kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; G = null; kick(); }); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', function () { if (!K.motion()) { finishIntro(); hideHint(); } kick(); });
  rise();
  if ('IntersectionObserver' in window) {
    onScreen = false;
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting;
      if (onScreen && !seen) {
        seen = true;
        if (K.motion()) { startIntro(); }
      }
      if (onScreen) { kick(); }
    }, { threshold: 0.35 }).observe(stage);
  } else { seen = true; kick(); }
}());
