/* The calculator (#calc), 11 October 2026, Damian's brief: "a pot and coins,
   as interactive as the welcome; bare minimum; no fluff."

   Age, saved so far, what you put in a month, what your employer puts in,
   and the tax rate for the relief. One answer: what you would have a month
   at 66, the State Pension plus what the pot could pay, against the way of
   life picked in the gap above (PBKit.aim, shared). "Close my gap" slides
   your monthly amount to what covers it.

   The sums are the pension calculator's own (pension-calculator.html):
   monthly compounding at 5% a year, 4% of the pot a year as income, all in
   today's money at the ECB's 2% (assets/js/pb-assumptions.js), level
   contributions, retirement at 66.

   THE POT. A glass pot of coins: the pot you would have at 66. Silver coins
   are yours, gold are Revenue's (the tax relief), blue are your employer's,
   in the shares the sums give. A dashed line marks the pot that covers the
   way of life; one coin is that pot over 44, whatever the answer.
     - More going in: the lid lifts and coins pour in, bounce and settle.
       Less: coins pop and vanish from the top of the heap.
     - Move over the coins and you stir them. Grab the pot and shake it:
       the coins slosh. Tap the coins: they jump, and paws fly out.
     - Cross the line: it turns teal, the coins jump and the pot cheers.
   The coins are real little bodies (Verlet circles: gravity, the glass,
   each other) stepped at 120 Hz while anything moves, asleep otherwise.
   With motion off the heap is settled in one go and drawn once. */
(function () {
  'use strict';
  var sec = document.getElementById('calc'), K = window.PBKit, LS = window.PBLivingStandards, SP = window.PBStatePension, C = window.PBCoins;
  if (!sec || !K || !LS) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var age = $('pbC2Age'), pot = $('pbC2Pot'), mine = $('pbC2Mine'), emp = $('pbC2Emp');
  if (!age || !pot || !mine) { return; }
  var fmt = K.fmt;
  var G5 = 0.05, DRAW = 0.04, AT = (SP && SP.PENSION_AGE) || 66;
  var INF = (window.PBAssume && window.PBAssume.inflation && window.PBAssume.inflation.rate) || 0.02;
  var ONE = SP ? SP.MAX_WEEKLY_CENTS * SP.WEEKS_PER_YEAR / 100 : 15563.6;
  var tax = 0.4;

  /* ----------------------------------------------------------- the sums -- */
  function mr() { return Math.pow(1 + G5, 1 / 12) - 1; }
  function project(a, p, m, e) {
    var n = Math.max(1, AT - a), months = n * 12, r = mr(), g = Math.pow(1 + r, months), A = (g - 1) / r;
    var fv = p * g + (m + e) * A, defl = Math.pow(1 + INF, n);
    var shares = fv > 0 ? { gold: m * tax * A / fv, blue: e * A / fv } : { gold: 0, blue: 0 };
    return { n: n, fv: fv, today: fv / defl, month: fv / defl * DRAW / 12, shares: shares };
  }
  /* the level amount of your own a month that brings the income to `want` a month, in today's money */
  function needed(a, p, e, want) {
    var n = Math.max(1, AT - a), months = n * 12, r = mr(), g = Math.pow(1 + r, months);
    var potNom = want * 12 / DRAW * Math.pow(1 + INF, n), rest = potNom - p * g - e * (g - 1) / r;
    return Math.max(0, rest / ((g - 1) / r));
  }
  function statePerMonth(hh) { return (hh === 'couple' ? 2 : 1) * ONE / 12; }

  /* ----------------------------------------------------------- the words -- */
  function fill(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  var VT = { pbC2Age: function (v) { return v + ' years old'; }, pbC2Pot: function (v) { return fmt(v); }, pbC2Mine: function (v) { return fmt(v) + ' a month'; }, pbC2Emp: function (v) { return fmt(v) + ' a month'; } };
  var rTotal = new K.Roll($('pbC2Total'));
  var S = {}, srT = 0;
  function calc(fromUser) {
    var a = +age.value, p = +pot.value, m = +mine.value, e = emp ? +emp.value : 0, aim = K.aim;
    var pr = project(a, p, m, e), st = statePerMonth(aim.hh), std = LS.standard(aim.level, aim.hh);
    var need = std.monthly, total = st + pr.month, short = need - total;
    var targetPot = Math.max(0, need - st) * 12 / DRAW;
    var was = S.covered;
    S = { a: a, p: p, m: m, e: e, pr: pr, st: st, need: need, total: total, short: short, covered: short <= 0.5, targetPot: targetPot, label: std.label, two: aim.hh === 'couple' };

    [age, pot, mine, emp].forEach(function (r) { if (r) { fill(r); r.setAttribute('aria-valuetext', VT[r.id](+r.value)); } });
    $('pbC2AgeV').textContent = a; $('pbC2PotV').textContent = fmt(p); $('pbC2MineV').textContent = fmt(m);
    if (emp) { $('pbC2EmpV').textContent = fmt(e); }
    $('pbC2Relief').innerHTML = m > 0 ? 'Costs you <b>' + fmt(m * (1 - tax)) + '</b>. <b class="pb-c2-rev-t">Revenue adds ' + fmt(m * tax) + '</b>.' : 'Revenue adds tax relief to what you put in.';
    var le = $('pbC2LEmp'); if (le) { le.hidden = !(e > 0); }
    var lr = $('pbC2LRev'); if (lr) { lr.hidden = !(m > 0); }

    rTotal.set(fmt(total));
    $('pbC2Parts').innerHTML = '<span class="pb-c2-k-sp"><i aria-hidden="true"></i>' + (S.two ? 'Two State Pensions ' : 'State Pension ') + '<b>' + fmt(st) + '</b></span>' +
      '<span class="pb-c2-k-you"><i aria-hidden="true"></i>Your pension <b>' + fmt(pr.month) + '</b></span>';
    var life = 'a ' + std.label.toLowerCase() + ' life' + (S.two ? ' for two' : '');
    var v = $('pbC2Verdict'), close = $('pbC2Close');
    var up = aim.level === 'modest' ? 'moderate' : aim.level === 'moderate' ? 'comfortable' : null;
    if (S.covered) {
      v.innerHTML = '<span class="pb-c2-yes">Covered.</span> ' + fmt(-short) + ' a month to spare.';
      close.hidden = !up; close.setAttribute('data-act', 'up');
      if (up) { close.querySelector('span').textContent = 'Aim higher: ' + LS.LABELS[up]; }
    } else {
      v.innerHTML = '<span class="pb-c2-no">' + fmt(short) + ' a month short.</span>';
      close.hidden = false; close.setAttribute('data-act', 'close');
      close.querySelector('span').textContent = 'Close my gap';
    }
    sec.classList.toggle('pb-c2-is-ok', S.covered);
    $('pbC2MiniN').textContent = fmt(total);
    $('pbC2MiniV').textContent = S.covered ? 'Covered' : fmt(short) + ' short';
    var said = 'At ' + AT + ', in today’s money: about ' + fmt(total) + ' a month. ' + (S.covered ? 'That covers ' + life + '.' : fmt(short) + ' a month short of ' + life + '.');
    clearTimeout(srT); srT = setTimeout(function () { $('pbC2Sr').textContent = said; }, fromUser ? 700 : 0);
    potSync(fromUser, was === false && S.covered);
  }

  /* ============================================================ THE POT == */
  var cv = sec.querySelector('.pb-c2-pot'), cx = cv && cv.getContext ? cv.getContext('2d') : null;
  var hint = sec.querySelector('.pb-c2-hint');
  var TARGET = 44, MAXC = 72, P = 2.6;
  var W = 0, H = 0, dpr = 1, g = null, fx = C ? new C.FX() : null;
  var coins = [], queue = 0, lastSpawn = 0, nextIdx = 0;
  var body = { ox: new K.Spring(0, 140, 7), tilt: new K.Spring(0, 160, 8), sq: new K.Spring(0, 260, 9) };
  var lid = { y: new K.Spring(0, 170, 11), a: new K.Spring(0, 150, 10), open: 0, spin: 0 };
  var shown = new K.Spring(0, 60, 14), line = { flash: 0 };
  var ptr = { in: false, x: 0, y: 0, down: false, sx: 0, sy: 0, shaking: false, moved: 0, t: 0 };

  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var wide = W >= 460, B = Math.min(wide ? W * 0.25 : W * 0.33, 150, (H - 70) * 0.5), Hb = B * 1.02;
    var n = B * 0.6, r = Math.max(7.5, Math.min(15, B * 0.105)), bottom = H - 22, cy = bottom - Hb;
    var ySh = cy - Hb * Math.pow(1 - Math.pow(n / B, P), 1 / P), neckH = Math.max(14, B * 0.16);
    g = { wide: wide, cx: W / 2, B: B, Hb: Hb, n: n, r: r, cy: cy, bottom: bottom, ySh: ySh, top: ySh - neckH, t: 4 };
    /* where 44 coins reach: the area from the bottom up, packed */
    var want = TARGET * Math.PI * r * r / 0.74, acc = 0, y = bottom, dy = 1;
    while (y > g.top && acc < want) { acc += 2 * Math.max(0, halfW(y)) * dy; y -= dy; }
    g.line = y;
    coins.forEach(function (c) { c.r = r; });
  }
  /* the inside's half width at height y, in the pot's own frame */
  function halfW(y) {
    if (y < g.ySh) { return g.n; }
    var k = Math.abs(y - g.cy) / g.Hb; if (k >= 1) { return 0; }
    return g.B * Math.pow(1 - Math.pow(k, P), 1 / P);
  }

  /* ------------------------------------------------------------ physics -- */
  var H2 = 1 / 120, GRAV = 2300;
  function toLocal(x, y) {
    /* the pot's frame: shifted by the shake, turned by the tilt about its foot */
    var a = -body.tilt.x, ox = body.ox.x, px = g.cx + ox, py = g.bottom, dx = x - px, dy = y - py;
    return { x: g.cx + dx * Math.cos(a) - dy * Math.sin(a), y: py + dx * Math.sin(a) + dy * Math.cos(a) };
  }
  function toWorld(x, y) {
    var a = body.tilt.x, ox = body.ox.x, px = g.cx, py = g.bottom, dx = x - px, dy = y - py;
    return { x: px + ox + dx * Math.cos(a) - dy * Math.sin(a), y: py + dx * Math.sin(a) + dy * Math.cos(a) };
  }
  function contain(c) {
    if (c.out) { return; }
    var L = toLocal(c.x, c.y), x = L.x, y = L.y, r = c.r, hit = false;
    if (y > g.top - r) {
      if (y < g.ySh) {
        var lim = g.n - r; if (x < g.cx - lim) { x = g.cx - lim; hit = true; } else if (x > g.cx + lim) { x = g.cx + lim; hit = true; }
      } else {
        var bx = g.B - r, by = g.Hb - r, ux = (x - g.cx) / bx, uy = (y - g.cy) / by;
        var f = Math.pow(Math.abs(ux), P) + Math.pow(Math.abs(uy), P);
        if (f > 1) { var s = Math.pow(f, -1 / P); x = g.cx + ux * s * bx; y = g.cy + uy * s * by; hit = true; if (y < g.ySh) { var l2 = g.n - r; x = Math.max(g.cx - l2, Math.min(g.cx + l2, x)); } }
      }
    }
    if (hit) {
      var Wd = toWorld(x, y); c.x = Wd.x; c.y = Wd.y;
      /* the glass is a little rough: a touch slows the coin */
      c.px += (c.x - c.px) * 0.08; c.py += (c.y - c.py) * 0.08;
    }
  }
  var grid = {};
  function collide() {
    var cell = g.r * 2, i, c, k;
    grid = {};
    for (i = 0; i < coins.length; i++) {
      c = coins[i]; if (c.out || c.wait > 0) { continue; }
      k = Math.floor(c.x / cell) + ',' + Math.floor(c.y / cell);
      (grid[k] || (grid[k] = [])).push(c);
    }
    for (i = 0; i < coins.length; i++) {
      c = coins[i]; if (c.out || c.wait > 0) { continue; }
      var gx = Math.floor(c.x / cell), gy = Math.floor(c.y / cell);
      for (var ax = -1; ax <= 1; ax++) {
        for (var ay = -1; ay <= 1; ay++) {
          var list = grid[(gx + ax) + ',' + (gy + ay)]; if (!list) { continue; }
          for (var j = 0; j < list.length; j++) {
            var o = list[j]; if (o === c || o.id < c.id) { continue; }
            var dx = o.x - c.x, dy = o.y - c.y, d2 = dx * dx + dy * dy, m = c.r + o.r;
            if (d2 < m * m && d2 > 1e-6) {
              var d = Math.sqrt(d2), p = (m - d) / 2, nx = dx / d, ny = dy / d;
              c.x -= nx * p; c.y -= ny * p; o.x += nx * p; o.y += ny * p;
              /* friction between coins */
              c.px += (c.x - c.px) * 0.03; c.py += (c.y - c.py) * 0.03; o.px += (o.x - o.px) * 0.03; o.py += (o.y - o.py) * 0.03;
            }
          }
        }
      }
    }
  }
  function stir() {
    if (!ptr.in || ptr.down || ptr.shaking || performance.now() - ptr.t > 160) { return; }
    var R = g.r * 1.6;
    coins.forEach(function (c) {
      if (c.out || c.wait > 0) { return; }
      var dx = c.x - ptr.x, dy = c.y - ptr.y, d2 = dx * dx + dy * dy, m = R + c.r;
      /* a gentle push, never a throw: at most a pixel and a half a step */
      if (d2 < m * m && d2 > 1e-6) { var d = Math.sqrt(d2), k = Math.min(1.5, (m - d) * 0.25); c.x += dx / d * k; c.y += dy / d * k; }
    });
  }
  function physics() {
    var d2 = H2 * H2;
    coins.forEach(function (c) {
      if (c.wait > 0) { c.wait -= H2; return; }
      if (c.out) { c.out += H2; c.x += c.vx * H2; c.y += c.vy * H2; c.vy += GRAV * 0.3 * H2; return; }
      var vx = (c.x - c.px) * 0.994, vy = (c.y - c.py) * 0.994;
      c.px = c.x; c.py = c.y; c.x += vx; c.y += vy + GRAV * d2;
      c.spin += vx * 0.05;
      if (c.flip < 1) { c.flip = Math.min(1, c.flip + H2 * 6); if (c.flip >= 0.5 && c.next) { c.kind = c.next; c.next = null; } }
    });
    for (var it = 0; it < 3; it++) { collide(); coins.forEach(contain); stir(); }
    coins = coins.filter(function (c) { return !(c.out > 0.45); });
  }
  function speed() { var s = 0; coins.forEach(function (c) { if (!c.out && !(c.wait > 0)) { s = Math.max(s, Math.abs(c.x - c.px) + Math.abs(c.y - c.py)); } }); return s; }

  /* ------------------------------------------------ the coins wanted -- */
  function kindOf(i, sh) { var u = (i * 0.6180339887) % 1; return u < sh.gold ? 'gold' : u < sh.gold + sh.blue ? 'blue' : 'silver'; }
  function wanted() {
    if (!S.pr) { return 0; }
    var unit = Math.max(S.targetPot, 40000) / TARGET;
    return Math.max(0, Math.min(MAXC, Math.round(S.pr.today / unit)));
  }
  function spawn(i) {
    var w = g.n * 0.55, x = g.cx + body.ox.x + (Math.random() * 2 - 1) * w, y = g.top - 30 - Math.random() * 30;
    var c = { id: nextIdx++, i: i, x: x, y: y, px: x - (Math.random() - 0.5) * 1.2, py: y - 2.5, r: g.r, kind: kindOf(i, S.pr.shares), spin: Math.random() * 6, flip: 1, wait: 0 };
    coins.push(c);
  }
  function potSync(fromUser, crossed) {
    if (!cx || !g) { return; }
    var want = wanted(), live = coins.filter(function (c) { return !c.out; });
    /* colours: each coin's place in the heap keeps its colour unless the shares move */
    live.forEach(function (c) { var k = kindOf(c.i, S.pr.shares); if (k !== c.kind && !c.next) { if (K.motion() && seen) { c.next = k; c.flip = 0; } else { c.kind = k; } } });
    var have = live.length + queue;
    if (want > have) { queue += want - have; }
    else if (want < have) {
      var cut = have - want, q = Math.min(queue, cut); queue -= q; cut -= q;
      /* the top of the heap goes first */
      live.sort(function (a, b) { return a.y - b.y; }).slice(0, cut).forEach(function (c) {
        if (K.motion() && seen) { c.out = 0.0001; c.vx = (Math.random() - 0.5) * 60; c.vy = -60 - Math.random() * 60; if (fx) { fx.dust(c.x, c.y, 4, c.kind); } }
        else { c.out = 1; }
      });
    }
    if (!K.motion() || !seen) { settleNow(); }
    if (crossed && fromUser === true && K.motion() && seen && onScreen) { cheer(); }
    kick();
  }
  /* with motion off, or before the pot is seen: settle in one go */
  function settleNow() {
    coins = coins.filter(function (c) { return !c.out; });
    var idx = coins.length;
    while (queue > 0) {
      queue--;
      var row = Math.floor(idx / 7), x = g.cx + ((idx % 7) - 3) * g.r * 2 * 0.95 + (row % 2 ? g.r * 0.5 : 0), y = g.bottom - g.r - row * g.r * 1.8;
      coins.push({ id: nextIdx++, i: idx, x: x, y: y, px: x, py: y, r: g.r, kind: kindOf(idx, S.pr.shares), spin: Math.random() * 6, flip: 1, wait: 0 });
      idx++;
    }
    coins.forEach(function (c, k) { c.y -= 2 + (k % 3); c.py = c.y; });
    for (var s = 0; s < 260; s++) { physics(); }
    coins.forEach(function (c) { c.px = c.x; c.py = c.y; });
  }
  function cheer() {
    line.flash = 1;
    coins.forEach(function (c) { if (!c.out) { c.py = c.y + 3 + Math.random() * 4; } });
    body.sq.v -= 9; lid.y.v -= 900; lid.a.v += 14;
    if (fx) { var top = toWorld(g.cx, g.top); fx.paws(top.x, top.y - 10, 12); fx.spark(top.x, top.y - 10, 18); }
  }
  function splash(x, y) {
    var R = g.r * 4;
    coins.forEach(function (c) {
      if (c.out) { return; }
      var dx = c.x - x, dy = c.y - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < R) { var k = (1 - d / R); c.py = c.y + 4 + k * 9; c.px = c.x - dx / (d + 1) * k * 3; }
    });
    body.sq.v -= 5;
    if (fx) { fx.ring(x, y, 'rgba(20,203,177,.8)', 26); var top = toWorld(g.cx, g.top); fx.paws(top.x, top.y - 6, 5); }
  }

  /* -------------------------------------------------------------- draw -- */
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function outline(t) {
    /* the glass's outer edge, in the pot's frame */
    cx.beginPath();
    var y, step = 3;
    cx.moveTo(g.cx - g.n - t, g.top);
    for (y = g.top; y <= g.bottom + t; y += step) { cx.lineTo(g.cx - halfW(Math.min(y, g.bottom - 0.01)) - t, y); }
    cx.quadraticCurveTo(g.cx, g.bottom + t * 2.2, g.cx + halfW(g.bottom - 0.01) + t, g.bottom + t);
    for (y = g.bottom; y >= g.top; y -= step) { cx.lineTo(g.cx + halfW(y) + t, y); }
    cx.lineTo(g.cx + g.n + t, g.top);
  }
  function text(s, x, y, size, weight, color, align, base) {
    cx.font = weight + ' ' + size + 'px Figtree, system-ui, sans-serif'; cx.fillStyle = color; cx.textAlign = align || 'left'; cx.textBaseline = base || 'middle'; cx.fillText(s, x, y);
  }
  function pill(x, y, w, h, fillC, strokeC) { rr(x, y, w, h, h / 2); cx.fillStyle = fillC; cx.fill(); if (strokeC) { cx.lineWidth = 1.5; cx.strokeStyle = strokeC; cx.stroke(); } }
  function heapTop() { var t = g.bottom; coins.forEach(function (c) { if (!c.out && !(c.wait > 0)) { var L = toLocal(c.x, c.y); if (L.y > g.top && L.y - c.r < t && Math.abs(c.x - c.px) + Math.abs(c.y - c.py) < 1.5) { t = L.y - c.r; } } }); return t; }
  function draw(now) {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var a = body.tilt.x, ox = body.ox.x, sq = body.sq.x;
    /* the floor */
    var sh = cx.createRadialGradient(g.cx + ox, g.bottom + 6, 2, g.cx + ox, g.bottom + 6, g.B * 1.15);
    sh.addColorStop(0, 'rgba(11,31,28,.18)'); sh.addColorStop(1, 'rgba(11,31,28,0)');
    cx.fillStyle = sh; cx.beginPath(); cx.ellipse(g.cx + ox, g.bottom + 8, g.B * 1.15 * (1 - sq * 0.02), 12, 0, 0, Math.PI * 2); cx.fill();
    /* into the pot's frame */
    cx.save();
    cx.translate(g.cx + ox, g.bottom); cx.rotate(a); cx.scale(1 + sq * 0.025, 1 - sq * 0.03); cx.translate(-g.cx, -g.bottom);
    /* the glass, behind */
    outline(g.t);
    var gl = cx.createLinearGradient(g.cx - g.B, 0, g.cx + g.B, 0);
    gl.addColorStop(0, 'rgba(20,203,177,.07)'); gl.addColorStop(0.35, 'rgba(255,255,255,.7)'); gl.addColorStop(1, 'rgba(20,203,177,.08)');
    cx.fillStyle = gl; cx.fill();
    /* the line for the way of life (behind the coins, so the heap rises over it) */
    var covered = S.covered, lc = covered ? '#0FA88F' : 'rgba(11,31,28,.5)';
    if (S.targetPot > 0) {
      var lw = halfW(g.line) + g.t;
      cx.save(); cx.setLineDash(covered ? [] : [7, 6]); cx.lineWidth = covered ? 3 : 2; cx.strokeStyle = lc;
      cx.beginPath(); cx.moveTo(g.cx - lw, g.line); cx.lineTo(g.cx + lw, g.line); cx.stroke(); cx.restore();
    }
    cx.restore();
    /* the coins, in the world (the physics already holds them in the pot) */
    coins.forEach(function (c) {
      if (c.wait > 0) { return; }
      var al = c.out ? Math.max(0, 1 - c.out / 0.45) : 1, sc = c.out ? 1 + c.out * 1.2 : 1;
      var fl = c.flip < 1 ? Math.abs(Math.cos(c.flip * Math.PI)) : 1;
      C.face(cx, c.x, c.y, c.r * sc, c.kind, c.spin, al, fl);
    });
    /* the glass, in front: edge, shine, the paw, the lip */
    cx.save();
    cx.translate(g.cx + ox, g.bottom); cx.rotate(a); cx.scale(1 + sq * 0.025, 1 - sq * 0.03); cx.translate(-g.cx, -g.bottom);
    outline(g.t); cx.lineWidth = 2.5; cx.strokeStyle = 'rgba(11,31,28,.26)'; cx.stroke();
    outline(g.t - 2.5); cx.lineWidth = 1; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.stroke();
    cx.lineCap = 'round'; cx.strokeStyle = 'rgba(255,255,255,.75)'; cx.lineWidth = Math.max(4, g.B * 0.05);
    cx.beginPath(); var y0 = g.ySh + (g.bottom - g.ySh) * 0.12, y1 = g.ySh + (g.bottom - g.ySh) * 0.55;
    for (var y = y0; y <= y1; y += 4) { var xx = g.cx - halfW(y) + g.B * 0.12; if (y === y0) { cx.moveTo(xx, y); } else { cx.lineTo(xx, y); } }
    cx.stroke();
    cx.lineWidth = Math.max(2, g.B * 0.025); cx.beginPath(); var y2 = g.ySh + (g.bottom - g.ySh) * 0.62; cx.moveTo(g.cx - halfW(y2) + g.B * 0.12, y2); cx.lineTo(g.cx - halfW(y2 + 6) + g.B * 0.12, y2 + 6); cx.stroke();
    if (C) { C.paw(cx, g.cx, g.cy + g.Hb * 0.42, g.B * 0.42, 0, '#FFFFFF', 0.32); }
    /* the lip */
    rr(g.cx - g.n - g.t - 7, g.top - 7, (g.n + g.t + 7) * 2, 12, 6);
    var lp = cx.createLinearGradient(0, g.top - 7, 0, g.top + 5); lp.addColorStop(0, 'rgba(255,255,255,.95)'); lp.addColorStop(1, 'rgba(205,220,216,.95)');
    cx.fillStyle = lp; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = 'rgba(11,31,28,.22)'; cx.stroke();
    /* the lid: teal, with a paw on its knob; it lifts while coins pour */
    var lx = g.cx + lid.y.x * -0.25 + 0, ly = g.top - 9 + lid.y.x;
    cx.save(); cx.translate(lx + (g.n + 10) * 0.9 * Math.min(1, lid.open), ly); cx.rotate(lid.a.x + lid.spin);
    var lwid = (g.n + g.t + 9) * 2;
    rr(-lwid / 2, -12, lwid, 14, 7);
    var lg = cx.createLinearGradient(0, -12, 0, 2); lg.addColorStop(0, '#5BEBD5'); lg.addColorStop(1, '#14CBB1');
    cx.fillStyle = lg; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = '#0E9E8A'; cx.stroke();
    cx.beginPath(); cx.ellipse(0, -15, g.n * 0.22, g.n * 0.12, 0, 0, Math.PI * 2); cx.fillStyle = '#14CBB1'; cx.fill(); cx.strokeStyle = '#0E9E8A'; cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,.65)'; rr(-lwid / 2 + 8, -9, lwid * 0.35, 3, 1.5); cx.fill();
    cx.restore();
    cx.restore();
    /* the words: the pot, and the line */
    label(now);
    if (fx) { fx.draw(cx); }
  }
  function label(now) {
    var covered = S.covered, top = heapTop(), Lw = toWorld(g.cx, g.line);
    var potY = Math.max(g.top + 10, Math.min(g.bottom - 16, top)), PW = toWorld(g.cx - halfW(potY), potY);
    var val = fmt(shown.x), sm = g.wide ? 13 : 12, big = g.wide ? 20 : 17;
    if (g.wide) {
      cx.font = '800 ' + big + 'px Figtree, system-ui, sans-serif';
      var lx = Math.max(cx.measureText(val).width + 10, PW.x - 26);
      text('Your pot', lx, PW.y - 12, sm, 700, '#54635F', 'right'); text(val, lx, PW.y + 9, big, 800, '#0B1F1C', 'right');
      cx.strokeStyle = 'rgba(84,99,95,.45)'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(lx + 6, PW.y); cx.lineTo(Math.max(lx + 8, PW.x + 8), PW.y); cx.stroke();
    } else {
      cx.font = '800 ' + big + 'px Figtree, system-ui, sans-serif'; var tw = Math.max(cx.measureText(val).width, 60) + 22;
      pill(8, 8, tw, 46, 'rgba(255,255,255,.94)', 'rgba(11,31,28,.08)');
      text('Your pot', 19, 21, sm, 700, '#54635F'); text(val, 19, 40, big, 800, '#0B1F1C');
    }
    if (S.targetPot > 0) {
      var right = toWorld(g.cx + halfW(g.line) + g.t, g.line), msg1 = covered ? '✓ Enough' : 'Enough for', msg2 = (covered ? 'for a ' : 'a ') + S.label.toLowerCase() + ' life';
      var fl = line.flash, col = covered ? '#0B7A6E' : '#0B1F1C';
      if (g.wide) {
        cx.font = '800 ' + sm + 'px Figtree, system-ui, sans-serif';
        var tw2 = Math.max(cx.measureText(msg1).width, cx.measureText(msg2).width), rx = Math.min(right.x + 16, W - tw2 - 10);
        if (fl > 0) { cx.globalAlpha = fl; pill(rx - 10, right.y - 22, tw2 + 20, 44, 'rgba(20,203,177,.22)'); cx.globalAlpha = 1; }
        text(msg1, rx, right.y - 9, sm, 800, col); text(msg2, rx, right.y + 9, sm, 700, col);
      } else {
        cx.font = '800 ' + sm + 'px Figtree, system-ui, sans-serif'; var w2 = Math.max(cx.measureText(msg1).width, cx.measureText(msg2).width) + 20;
        var bx = W - w2 - 8, by = Math.max(60, Math.min(H - 52, right.y - 20));
        pill(bx, by, w2, 40, covered ? 'rgba(231,250,246,.96)' : 'rgba(255,255,255,.94)', covered ? 'rgba(15,168,143,.35)' : 'rgba(11,31,28,.1)');
        text(msg1, bx + 10, by + 13, sm, 800, col); text(msg2, bx + 10, by + 28, sm, 700, col);
        cx.strokeStyle = covered ? 'rgba(15,168,143,.6)' : 'rgba(11,31,28,.35)'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(bx, by + 20); cx.lineTo(right.x - 4, right.y); cx.stroke();
      }
    }
  }

  /* -------------------------------------------------------------- loop -- */
  var raf = 0, last = 0, acc = 0, onScreen = true, seen = false, calm = 0;
  function kick() { calm = 0; if (cx && !raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 20, Math.max(0, now - last)); last = now;
    if (!W || !g) { size(); }
    if (W < 120 || H < 120) { return; }
    var moving = false;
    if (K.motion()) {
      /* the pour: the lid lifts first, then a stream of coins */
      if (queue > 0) {
        lid.open = Math.min(1, lid.open + dt * 5); lid.y.t = -34; lid.a.t = 0.5;
        if (lid.open > 0.6 && now - lastSpawn > 1 / 45) { var k = Math.min(queue, 2); for (var q = 0; q < k; q++) { spawn(nextIdx); } queue -= k; lastSpawn = now; }
        moving = true;
      } else if (lid.open > 0 && now - lastSpawn > 0.5) {
        lid.open = Math.max(0, lid.open - dt * 4); lid.y.t = 0; lid.a.t = 0;
        if (lid.open === 0 && !lid.clink) { lid.clink = true; if (fx) { fx.ring(g.cx + body.ox.x, g.top - 4, 'rgba(14,158,138,.7)', g.n * 0.9); } }
        moving = true;
      }
      if (queue > 0) { lid.clink = false; }
      acc += dt;
      var steps = 0;
      while (acc >= H2 && steps < 6) { physics(); acc -= H2; steps++; }
      if (acc > H2 * 6) { acc = 0; }
      for (var key in body) { body[key].step(dt); if (!body[key].done()) { moving = true; } }
      lid.y.step(dt); lid.a.step(dt); if (!lid.y.done() || !lid.a.done()) { moving = true; }
      if (lid.spin) { lid.spin *= Math.pow(0.02, dt); if (Math.abs(lid.spin) < 0.01) { lid.spin = 0; } moving = true; }
      if (line.flash > 0) { line.flash = Math.max(0, line.flash - dt * 1.2); moving = true; }
      if (speed() > 0.05) { moving = true; }
      if (fx) { fx.step(dt); if (fx.busy()) { moving = true; } }
    }
    shown.t = S.pr ? S.pr.today : 0; shown.step(dt); if (!shown.done()) { moving = true; }
    draw(now);
    calm = moving ? 0 : calm + dt;
    if (K.motion() && onScreen && !document.hidden && (calm < 0.5 || ptr.in)) { raf = requestAnimationFrame(frame); }
  }

  /* ------------------------------------------------------- the pointer -- */
  function local(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function seenHint() { if (hint && hint.classList.contains('pb-on')) { hint.classList.remove('pb-on'); } hinted = true; }
  var hinted = false;
  if (cx) {
    cv.addEventListener('pointerenter', function () { ptr.in = true; kick(); });
    cv.addEventListener('pointerleave', function () { ptr.in = false; if (!ptr.down) { body.ox.t = 0; body.tilt.t = 0; } kick(); });
    cv.addEventListener('pointermove', function (e) {
      var p = local(e); ptr.x = p.x; ptr.y = p.y; ptr.t = performance.now(); ptr.in = true;
      if (ptr.down) {
        var dx = p.x - ptr.sx, dy = p.y - ptr.sy;
        if (!ptr.shaking && Math.abs(dx) + Math.abs(dy) > 7) { ptr.shaking = true; cv.classList.add('pb-grabbing'); seenHint(); }
        if (ptr.shaking) { body.ox.t = Math.max(-80, Math.min(80, dx)); body.tilt.t = Math.max(-0.22, Math.min(0.22, dx * 0.003)); }
      }
      kick();
    });
    cv.addEventListener('pointerdown', function (e) {
      if (!K.motion()) { return; }
      var p = local(e); ptr.down = true; ptr.sx = p.x; ptr.sy = p.y; ptr.x = p.x; ptr.y = p.y; ptr.shaking = false;
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
      kick();
    });
    var up = function (e) {
      if (!ptr.down) { return; }
      ptr.down = false; cv.classList.remove('pb-grabbing');
      if (!ptr.shaking && g) {
        var p = local(e), lidY = g.top - 9 + lid.y.x;
        if (Math.abs(p.y - lidY) < 16 && Math.abs(p.x - g.cx - body.ox.x) < g.n + 16) { lid.spin += 6.28; lid.y.v -= 600; }
        else { splash(p.x, p.y); }
        seenHint();
      }
      ptr.shaking = false; body.ox.t = 0; body.tilt.t = 0;
      kick();
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }

  /* ------------------------------------------------------ the controls -- */
  [age, pot, mine, emp].forEach(function (r) { if (r) { r.addEventListener('input', function () { calc(true); }); } });
  var taxSeg = sec.querySelector('.pb-c2-tax');
  if (taxSeg) { K.seg(taxSeg, function (b) { tax = +b.getAttribute('data-rate') / 100; calc(true); }); }
  var lvSeg = sec.querySelector('.pb-c2-lv'), hhSeg = sec.querySelector('.pb-c2-hh'), lv = null, hh = null;
  if (lvSeg) { lv = K.seg(lvSeg, function (b) { K.setAim(b.getAttribute('data-level'), K.aim.hh, 'calc'); }); }
  if (hhSeg) { hh = K.seg(hhSeg, function (b) { K.setAim(K.aim.level, b.getAttribute('data-hh'), 'calc'); }); }
  document.addEventListener('pb:aim', function (e) {
    var d = e.detail || {};
    if (lv) { lv.press(function (b) { return b.getAttribute('data-level') === d.level; }, d.by === 'calc'); }
    if (hh) { hh.press(function (b) { return b.getAttribute('data-hh') === d.hh; }, d.by === 'calc'); }
    calc(d.by === 'calc' || d.by === 'button' ? true : 'aim');
  });
  var tw = 0;
  $('pbC2Close').addEventListener('click', function () {
    if (this.getAttribute('data-act') === 'up') { K.setAim(K.aim.level === 'modest' ? 'moderate' : 'comfortable', K.aim.hh, 'button'); return; }
    var step = +mine.step || 10, want = Math.min(+mine.max, Math.ceil(needed(S.a, S.p, S.e, S.need - S.st) / step) * step);
    var from = +mine.value, t0 = performance.now(), dur = K.motion() ? 1200 : 0;
    cancelAnimationFrame(tw);
    (function go(ms) {
      var k = dur ? Math.min(1, (ms - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      mine.value = Math.round((from + (want - from) * e) / step) * step;
      calc(true);
      if (k < 1) { tw = requestAnimationFrame(go); } else { mine.focus({ preventScroll: true }); }
    }(t0));
  });

  /* ---------------------------------------------------- housekeeping -- */
  window.addEventListener('resize', function () { if (!cx) { return; } var old = g; W = 0; size(); if (old) { coins.forEach(function (c) { c.x = g.cx + (c.x - old.cx) * g.B / old.B; c.y = g.bottom - (old.bottom - c.y) * g.B / old.B; c.px = c.x; c.py = c.y; }); } kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(kick); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', function () { if (g && !K.motion()) { settleNow(); } kick(); });
  $('pbC2Live').hidden = false;
  sec.classList.add('pb-c2-on');
  if (cx) { size(); }
  calc(false);
  if (cx && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting;
      if (onScreen && !seen) {
        seen = true;
        /* the first look: empty the pot and pour */
        if (K.motion()) { coins = []; queue = wanted(); setTimeout(function () { if (hint && !hinted) { hint.classList.add('pb-on'); } }, 2600); }
      }
      if (onScreen) { kick(); }
    }, { threshold: 0.3 }).observe(cv);
  } else { seen = true; }
}());
