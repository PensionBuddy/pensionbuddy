/* The calculator (#calc), 11 October 2026, Damian's brief: "a pot and coins,
   as interactive as the welcome; bare minimum; no fluff."

   Age, saved so far, what you put in a month, what your employer puts in,
   and the tax rate for the relief. One answer: what you would have a month
   at 66, the State Pension plus what the pot could pay, against the way of
   life picked in the gap above (PBKit.aim, shared).

   THE BUTTON (13 October 2026, Damian: "Can you close the gap? What does
   that mean?"): it says what it does. Short of the way of life, "Show what I
   need to put in" slides your monthly amount to what covers it. If that is
   more than the slider goes to (€2,000 a month), there is no button that
   cannot keep its word: the line under the verdict says what it would take
   a month, and offers a call. Covered, "Aim higher: a moderate life" (and so
   on) moves the aim up a step.

   The sums are the pension calculator's own (pension-calculator.html):
   monthly compounding, 4% of the pot a year as income, level
   contributions, retirement at 66. Growth (Damian, 11 October 2026: "use
   six percent"): 6% a year before charges, the most the Pensions
   Authority lets a projection assume (PBAssume.assets.cap); the full
   calculator's own default is its Level 4, 5%.
   Future euros (Damian, 13 October 2026: "every figure the actual future
   euro figure, before inflation"): the pot and its income are what they
   would be in euros at 66, and the two things they are measured against,
   the way of life and the State Pension, rise at the ECB's 2% a year
   (PBAssume.inflation) to 66, so future euros meet future euros. The
   verdict is the same as it was in today's money: every side moves by the
   same factor. Every figure shown is a whole euro, and the total is the
   sum of the two parts as shown. The card says so where the figures are:
   "Your income at 66, in 2057 euros", and one line on why the State
   Pension is the size it is ("Prices and the State Pension rise 2% a
   year.").

   THE LABELS (13 October 2026, "unmistakable"): "Your pension pot at 66"
   with its figure, and the line that is enough, each written onto the pot
   with an arrow drawn as if by hand (.pb-c2-anno: HTML and an SVG over the
   canvas, placed from the pot's own geometry). They write themselves on
   once, as soon as the first pour is in; with motion off they are simply
   there.

   THE PLAN: every change is told to the page (PBKit.setPlan): the cost of
   waiting follows the age, the savings and the monthly amounts, and the
   inflation section reads the reader's own money once they have moved the
   age or a monthly amount.

   THE POT. A glass pot of coins: the pot you would have at 66. Silver coins
   are yours, gold are Revenue's (the tax relief), blue are your employer's,
   in the shares the sums give. A dashed line marks the pot that covers the
   way of life; one coin is that pot over 44, whatever the answer.
     - More going in: the lid lifts a little and fades, coins pour in through
       the neck, one after another, and the lid comes back down. The coins
       never touch each other until they are in the pot, and never leave the
       neck, so nothing is flung about. The lid only ever moves within the
       room it has: never past the top of the picture, never over a label.
       Less going in: coins pop and vanish from the top of the heap.
     - Move over the coins and you stir them. Grab the pot and shake it:
       the coins slosh. Tap the coins: they jump, and paws float up. Tap the
       lid: it pops.
     - Cross the line: it turns teal, the coins jump, sparks rise from it.
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
  var PA = window.PBAssume, GROW = (PA && PA.assets && PA.assets.cap) || 0.06, DRAW = 0.04, AT = (SP && SP.PENSION_AGE) || 66;
  var INF = (window.PBAssume && window.PBAssume.inflation && window.PBAssume.inflation.rate) || 0.02;
  var ONE = SP ? SP.MAX_WEEKLY_CENTS * SP.WEEKS_PER_YEAR / 100 : 15563.6;
  /* this year: the year you turn 66 is this year plus the years to go */
  var YEAR = Math.max(2026, new Date().getFullYear());
  var tax = 0.4;

  /* ----------------------------------------------------------- the sums -- */
  function mr() { return Math.pow(1 + GROW, 1 / 12) - 1; }
  function project(a, p, m, e) {
    var n = Math.max(1, AT - a), months = n * 12, r = mr(), g = Math.pow(1 + r, months), A = (g - 1) / r;
    var fv = p * g + (m + e) * A;
    var shares = fv > 0 ? { gold: m * tax * A / fv, blue: e * A / fv } : { gold: 0, blue: 0 };
    /* up: what prices do by 66, for the target and the State Pension */
    return { n: n, fv: fv, up: Math.pow(1 + INF, n), month: fv * DRAW / 12, shares: shares };
  }
  /* the level amount of your own a month that brings the pot's income to `want` a month at 66, future euros */
  function needed(a, p, e, want) {
    var n = Math.max(1, AT - a), months = n * 12, r = mr(), g = Math.pow(1 + r, months);
    var rest = want * 12 / DRAW - p * g - e * (g - 1) / r;
    return Math.max(0, rest / ((g - 1) / r));
  }
  function statePerMonth(hh) { return (hh === 'couple' ? 2 : 1) * ONE / 12; }

  /* ----------------------------------------------------------- the words -- */
  function fill(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  var VT = { pbC2Age: function (v) { return v + ' years old'; }, pbC2Pot: function (v) { return fmt(v); }, pbC2Mine: function (v) { return fmt(v) + ' a month'; }, pbC2Emp: function (v) { return fmt(v) + ' a month'; } };
  var rTotal = new K.Roll($('pbC2Total'));
  var rPot = $('pbC2PotN') ? new K.Roll($('pbC2PotN')) : null;
  var S = {}, srT = 0, userSet = false;
  var close = $('pbC2Close'), take = $('pbC2Take');
  function say(btn, text) { var s = btn.querySelector('span'); if (s.textContent !== text) { s.textContent = text; } }
  function calc(fromUser) {
    var a = +age.value, p = +pot.value, m = +mine.value, e = emp ? +emp.value : 0, aim = K.aim;
    var pr = project(a, p, m, e), std = K.life(aim.level, aim.hh);
    /* whole euros, so what is shown adds up: the parts make the total, the total meets the need */
    var st = Math.round(statePerMonth(aim.hh) * pr.up), yours = Math.round(pr.month), need = Math.round(std.monthly * pr.up);
    var total = st + yours, short = need - total;
    var targetPot = Math.max(0, need - st) * 12 / DRAW;
    var step = +mine.step || 10, most = +mine.max;
    /* what covers it a month, to the slider's step; past the slider's end there is no button for it */
    var reach = short > 0 ? Math.ceil(needed(a, p, e, need - st) / step) * step : 0;
    var was = S.covered, yr = YEAR + pr.n;
    S = { a: a, p: p, m: m, e: e, pr: pr, st: st, yours: yours, need: need, total: total, short: short, covered: short <= 0, targetPot: targetPot, label: std.label, own: std.own, two: aim.hh === 'couple', reach: reach, far: short > 0 && reach > most };
    if (K.setPlan) { K.setPlan({ age: a, mine: m, emp: e, saved: p, set: userSet }, 'calc'); }

    [age, pot, mine, emp].forEach(function (r) { if (r) { fill(r); r.setAttribute('aria-valuetext', VT[r.id](+r.value)); } });
    $('pbC2AgeV').textContent = a; $('pbC2PotV').textContent = fmt(p); $('pbC2MineV').textContent = fmt(m);
    if (emp) { $('pbC2EmpV').textContent = fmt(e); }
    $('pbC2Relief').innerHTML = m > 0 ? 'Costs you <b>' + fmt(m * (1 - tax)) + '</b>. <b class="pb-c2-rev-t">Revenue adds ' + fmt(m * tax) + '</b>.' : 'Revenue adds tax relief to what you put in.';
    var le = $('pbC2LEmp'); if (le) { le.hidden = !(e > 0); }
    var lr = $('pbC2LRev'); if (lr) { lr.hidden = !(m > 0); }

    /* the euros these are: the year you turn 66 */
    var k = $('pbC2K'); if (k) { k.textContent = 'Your income at ' + AT + ', in ' + yr + ' euros'; }
    var rise = $('pbC2Rise'); if (rise) { rise.textContent = 'Prices and the State Pension rise ' + Math.round(INF * 100) + '% a year.'; }
    rTotal.set(fmt(total));
    if (rPot) { rPot.set(fmt(pr.fv)); }
    $('pbC2Parts').innerHTML = '<span class="pb-c2-k-sp"><i aria-hidden="true"></i>' + (S.two ? 'Two State Pensions ' : 'State Pension ') + '<b>' + fmt(st) + '</b></span>' +
      '<span class="pb-c2-k-you"><i aria-hidden="true"></i>Your pension <b>' + fmt(yours) + '</b></span>';
    var life = std.phrase, needEl = $('pbC2Need');
    if (needEl) { needEl.innerHTML = (std.own ? 'Your figure' + (S.two ? ' for two' : '') : life.charAt(0).toUpperCase() + life.slice(1)) + ' at ' + AT + ': <b>' + fmt(need) + '</b> a month.'; }
    var v = $('pbC2Verdict'), up = higher(), focused = document.activeElement === close;
    if (S.covered) {
      v.innerHTML = '<span class="pb-c2-yes">Covered.</span>' + (short < 0 ? ' ' + fmt(-short) + ' a month to spare.' : '');
      close.hidden = !up; close.setAttribute('data-act', 'up');
      if (up) { say(close, 'Aim higher: ' + K.life(up, aim.hh).phrase); }
    } else {
      v.innerHTML = '<span class="pb-c2-no">' + fmt(short) + ' a month short.</span>';
      close.hidden = S.far; close.setAttribute('data-act', 'close');
      say(close, 'Show what I need to put in');
    }
    if (take) {
      var t = S.far ? 'To cover it, you’d put in <b>' + fmt(reach) + ' a month</b>. Too much? <a href="booking.html">Book a free 20-minute call with us</a>.' : '';
      if (take.innerHTML !== t) { take.innerHTML = t; }
      take.hidden = !S.far;
      /* the button went from under the reader's finger: the line that took its place has the focus */
      if (focused && close.hidden && S.far) { take.querySelector('a').focus({ preventScroll: true }); }
    }
    sec.classList.toggle('pb-c2-is-ok', S.covered);
    $('pbC2MiniN').textContent = fmt(total);
    $('pbC2MiniV').textContent = S.covered ? 'Covered' : fmt(short) + ' short';
    var said = 'Your income at ' + AT + ', in ' + yr + ' euros: about ' + fmt(total) + ' a month, from a pension pot of ' + fmt(pr.fv) + '. ' +
      (S.covered ? 'That covers ' + life + ', ' + fmt(need) + ' a month.'
        : fmt(short) + ' a month short of ' + life + ', ' + fmt(need) + ' a month.' + (S.far ? ' To cover it, you’d put in ' + fmt(reach) + ' a month.' : ''));
    clearTimeout(srT); srT = setTimeout(function () { $('pbC2Sr').textContent = said; }, fromUser ? 700 : 0);
    ownRow();
    annoText();
    potSync(fromUser, was === false && S.covered);
  }
  /* the next way of life up: Modest, Moderate, Comfortable, then your own figure if it is higher */
  function higher() {
    var a = K.aim, i = ['modest', 'moderate', 'comfortable'].indexOf(a.level);
    if (i >= 0 && i < 2) { return ['moderate', 'comfortable'][i]; }
    if (a.level === 'comfortable' && K.life('own', a.hh).annual > K.life('comfortable', a.hh).annual) { return 'own'; }
    return null;
  }
  /* your own figure: a slider under "Aiming for", shown only with "Your own" */
  var own = $('pbC2Own'), ownR = $('pbC2OwnR'), ownV = $('pbC2OwnV');
  function ownRow() {
    if (!own) { return; }
    var v = K.aim.own[K.aim.hh];
    own.hidden = K.aim.level !== 'own';
    if (+ownR.value !== v) { ownR.value = v; }
    fill(ownR); ownV.textContent = fmt(v) + ' a year';
    ownR.setAttribute('aria-valuetext', fmt(v) + ' a year' + (K.aim.hh === 'couple' ? ' for two' : ''));
  }
  if (ownR) { ownR.addEventListener('input', function () { K.setOwn(+ownR.value, 'calc-own'); }); }

  /* ============================================================ THE POT == */
  var cv = sec.querySelector('.pb-c2-pot'), cx = cv && cv.getContext ? cv.getContext('2d') : null;
  var hint = sec.querySelector('.pb-c2-hint');
  var TARGET = 44, MAXC = 72, P = 2.6;
  var W = 0, H = 0, dpr = 1, g = null, fx = C ? new C.FX() : null;
  var coins = [], queue = 0, lastSpawn = 0, nextIdx = 0, rate = 30;
  var body = { ox: new K.Spring(0, 140, 7), tilt: new K.Spring(0, 160, 8), sq: new K.Spring(0, 260, 9) };
  /* the lid: open is 0 (on) to 1 (lifted away); y and a are its pop, a spring each */
  var lid = { y: new K.Spring(0, 170, 11), a: new K.Spring(0, 150, 10), open: 0, clink: true };
  var line = { flash: 0 };
  var ptr = { in: false, x: 0, y: 0, down: false, sx: 0, sy: 0, shaking: false, moved: 0, t: 0 };

  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    /* the pot is as big as the width allows, and short enough to leave room over its lid:
       from the floor to the knob is 2.09 B, and 62 px stay clear above the neck */
    var wide = W >= 460, B = Math.min(wide ? W * 0.25 : W * 0.33, 150, (H - 84) / 2.086), Hb = B * 1.02;
    var n = B * 0.6, r = Math.max(7.5, Math.min(15, B * 0.105)), bottom = H - 22, cy = bottom - Hb;
    var ySh = cy - Hb * Math.pow(1 - Math.pow(n / B, P), 1 / P), neckH = Math.max(14, B * 0.16);
    g = { wide: wide, cx: W / 2, B: B, Hb: Hb, n: n, r: r, cy: cy, bottom: bottom, ySh: ySh, top: ySh - neckH, t: 4, room: 0 };
    /* where 44 coins reach: the area from the bottom up, packed */
    var want = TARGET * Math.PI * r * r / 0.74, acc = 0, y = bottom, dy = 1;
    while (y > g.top && acc < want) { acc += 2 * Math.max(0, halfW(y)) * dy; y -= dy; }
    g.line = y;
    coins.forEach(function (c) { c.r = r; });
    annoLayout();
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
  /* the glass: inside the neck (and the column above it) a coin is held to the neck's width;
     below it, to the pot's curve. A coin still above the rim is "in the air": it touches nothing */
  function contain(c) {
    if (c.out) { return; }
    var L = toLocal(c.x, c.y), x = L.x, y = L.y, r = c.r, hit = false;
    c.air = y < g.top + r * 0.5;
    if (y < g.ySh) {
      var lim = g.n - r; if (x < g.cx - lim) { x = g.cx - lim; hit = true; } else if (x > g.cx + lim) { x = g.cx + lim; hit = true; }
    } else {
      var bx = g.B - r, by = g.Hb - r, ux = (x - g.cx) / bx, uy = (y - g.cy) / by;
      var f = Math.pow(Math.abs(ux), P) + Math.pow(Math.abs(uy), P);
      if (f > 1) { var s = Math.pow(f, -1 / P); x = g.cx + ux * s * bx; y = g.cy + uy * s * by; hit = true; if (y < g.ySh) { var l2 = g.n - r; x = Math.max(g.cx - l2, Math.min(g.cx + l2, x)); } }
    }
    if (hit) {
      var Wd = toWorld(x, y), dx = Wd.x - c.x, dy = Wd.y - c.y;
      c.x = Wd.x; c.y = Wd.y;
      /* a touch of the glass slows the coin a little; a correction deeper than a coin (a glitch,
         never a shake) is never turned into speed */
      if (dx * dx + dy * dy > r * r * 4) { c.px = c.x; c.py = c.y; }
      else { c.px += (c.x - c.px) * 0.08; c.py += (c.y - c.py) * 0.08; }
    }
  }
  var grid = {};
  function solid(c) { return !c.out && !(c.wait > 0) && !c.air; }
  function collide() {
    var cell = g.r * 2, i, c, k;
    grid = {};
    for (i = 0; i < coins.length; i++) {
      c = coins[i]; if (!solid(c)) { continue; }
      k = Math.floor(c.x / cell) + ',' + Math.floor(c.y / cell);
      (grid[k] || (grid[k] = [])).push(c);
    }
    for (i = 0; i < coins.length; i++) {
      c = coins[i]; if (!solid(c)) { continue; }
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
      if (!solid(c)) { return; }
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
      /* a falling coin tops out at 6.5 px a step (780 px/s): it drops quickly, never in a blur */
      var vx = (c.x - c.px) * 0.994, vy = Math.min(6.5, (c.y - c.py) * 0.994);
      c.px = c.x; c.py = c.y; c.x += vx; c.y += vy + GRAV * d2;
      c.spin += vx * 0.05;
      if (c.fade < 1) { c.fade = Math.min(1, c.fade + H2 * 9); }
      if (c.flip < 1) { c.flip = Math.min(1, c.flip + H2 * 6); if (c.flip >= 0.5 && c.next) { c.kind = c.next; c.next = null; } }
    });
    for (var it = 0; it < 3; it++) { collide(); coins.forEach(contain); stir(); }
    coins = coins.filter(function (c) { return !(c.out > 0.45); });
  }
  function speed() { var s = 0; coins.forEach(function (c) { if (!c.out && !(c.wait > 0)) { s = Math.max(s, Math.abs(c.x - c.px) + Math.abs(c.y - c.py)); } }); return s; }
  function airborne() { for (var i = 0; i < coins.length; i++) { if (coins[i].air && !coins[i].out) { return true; } } return false; }

  /* ------------------------------------------------ the coins wanted -- */
  function kindOf(i, sh) { var u = (i * 0.6180339887) % 1; return u < sh.gold ? 'gold' : u < sh.gold + sh.blue ? 'blue' : 'silver'; }
  function wanted() {
    if (!S.pr) { return 0; }
    var unit = Math.max(S.targetPot, 40000) / TARGET;
    return Math.max(0, Math.min(MAXC, Math.round(S.pr.fv / unit)));
  }
  /* one coin, just over the rim, at its own place across the neck (a low-discrepancy sequence
     spreads them evenly, and not in step with their colours), already falling; it fades in as it drops */
  function spawn(i) {
    var u = ((i * 0.7548776662 + 0.31) % 1) * 2 - 1, L = { x: g.cx + u * (g.n - g.r) * 0.72, y: g.top - g.r * 2.1 };
    var Wd = toWorld(L.x, L.y), x = Wd.x, y = Wd.y;
    var c = { id: nextIdx++, i: i, x: x, y: y, px: x - u * 0.25, py: y - 2.4, r: g.r, kind: kindOf(i, S.pr.shares), spin: Math.random() * 6, flip: 1, wait: 0, air: true, fade: 0 };
    coins.push(c);
  }
  function potSync(fromUser, crossed) {
    if (!cx || !g) { return; }
    var want = wanted(), live = coins.filter(function (c) { return !c.out; });
    /* colours: each coin's place in the heap keeps its colour unless the shares move */
    live.forEach(function (c) { var k = kindOf(c.i, S.pr.shares); if (k !== c.kind && !c.next) { if (K.motion() && seen) { c.next = k; c.flip = 0; } else { c.kind = k; } } });
    var have = live.length + queue;
    if (want > have) {
      /* a pour: spread over about a second, never faster than one coin a frame */
      if (!queue) { rate = Math.max(16, Math.min(56, (want - have) / 0.9)); }
      queue += want - have;
    } else if (want < have) {
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
      coins.push({ id: nextIdx++, i: idx, x: x, y: y, px: x, py: y, r: g.r, kind: kindOf(idx, S.pr.shares), spin: Math.random() * 6, flip: 1, wait: 0, air: false, fade: 1 });
      idx++;
    }
    coins.forEach(function (c, k) { c.y -= 2 + (k % 3); c.py = c.y; c.fade = 1; });
    for (var s = 0; s < 260; s++) { physics(); }
    coins.forEach(function (c) { c.px = c.x; c.py = c.y; });
    lid.open = 0; lid.clink = true;
  }
  /* the lid pops: up by at most what it has room for, with a small rock, then settles */
  function pop(k) {
    if (!g || !(g.room > 0)) { return; }
    var hw = g.n + g.t + 9;
    /* a spring's peak is about 0.045 of the kick (k 170, c 11) */
    lid.y.v -= Math.min(g.room * 0.7, 14 * k) / 0.0452;
    lid.a.v += (Math.random() < 0.5 ? -1 : 1) * Math.min(0.06, g.room * 0.3 / hw) / 0.049;
  }
  /* sparks that rise gently from a stretch of the line, inside the pot */
  function rise(x0, x1, y, n) {
    if (!fx || !fx.add) { return; }
    var cols = ['#14CBB1', '#7FE3D3', '#F4B740', '#FFFFFF'];
    for (var i = 0; i < n; i++) {
      fx.add({ t: 'spark', x: x0 + (x1 - x0) * (i + Math.random()) / n, y: y + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5) * 24, vy: -55 - Math.random() * 65, g: 110, life: 0.75 + Math.random() * 0.35, age: 0, s: 2.6 + Math.random() * 2.4, c: cols[i % cols.length], rot: Math.random() * 3 });
    }
  }
  function cheer() {
    line.flash = 1;
    if (anno) { anno.classList.remove('pb-c2-cheer'); void anno.offsetWidth; anno.classList.add('pb-c2-cheer'); }
    coins.forEach(function (c) { if (solid(c)) { c.py = c.y + 3 + Math.random() * 4; } });
    body.sq.v -= 9; pop(0.8);
    var a = toWorld(g.cx - halfW(g.line) * 0.85, g.line), b = toWorld(g.cx + halfW(g.line) * 0.85, g.line);
    rise(a.x, b.x, (a.y + b.y) / 2, 14);
  }
  function splash(x, y) {
    var R = g.r * 4;
    coins.forEach(function (c) {
      if (!solid(c)) { return; }
      var dx = c.x - x, dy = c.y - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < R) { var k = (1 - d / R); c.py = c.y + 4 + k * 9; c.px = c.x - dx / (d + 1) * k * 3; }
    });
    body.sq.v -= 5;
    if (fx) {
      fx.ring(x, y, 'rgba(20,203,177,.8)', 26);
      /* a few paws float up from where you tapped, and fade */
      if (fx.add) {
        var cols = ['#14CBB1', '#7FE3D3', '#0B7A6E'];
        for (var i = 0; i < 3; i++) { fx.add({ t: 'paw', x: x + (i - 1) * 10, y: y - 6, vx: (i - 1) * 26 + (Math.random() - 0.5) * 16, vy: -110 - Math.random() * 50, g: 150, life: 0.9 + Math.random() * 0.25, age: 0, s: 12 + Math.random() * 5, c: cols[i], rot: (Math.random() - 0.5) * 0.8, vr: (Math.random() - 0.5) * 2 }); }
      }
    }
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
  function ease(k) { return k * k * (3 - 2 * k); }
  function draw() {
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
    /* the line for the way of life (behind the coins, so the heap rises over it); it glows when crossed */
    var covered = S.covered, lc = covered ? '#0FA88F' : 'rgba(11,31,28,.5)';
    if (S.targetPot > 0) {
      var lw = halfW(g.line) + g.t;
      cx.save();
      if (line.flash > 0) { cx.globalAlpha = line.flash * 0.35; cx.lineWidth = 3 + 10 * line.flash; cx.strokeStyle = '#14CBB1'; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(g.cx - lw, g.line); cx.lineTo(g.cx + lw, g.line); cx.stroke(); cx.globalAlpha = 1; }
      cx.setLineDash(covered ? [] : [7, 6]); cx.lineWidth = covered ? 3 : 2; cx.strokeStyle = lc;
      cx.beginPath(); cx.moveTo(g.cx - lw, g.line); cx.lineTo(g.cx + lw, g.line); cx.stroke(); cx.restore();
    }
    cx.restore();
    /* the coins, in the world (the physics already holds them in the pot) */
    coins.forEach(function (c) {
      if (c.wait > 0) { return; }
      var al = c.out ? Math.max(0, 1 - c.out / 0.45) : (c.fade < 1 ? ease(c.fade) : 1), sc = c.out ? 1 + c.out * 1.2 : 1;
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
    /* the lid: teal, with its knob. To let coins in it lifts a little, steps back and fades;
       it comes back the same way. Its pop is held to the room it has */
    var op = ease(lid.open), hw = g.n + g.t + 9, room = g.room || 0;
    var amax = Math.min(0.06, room * 0.3 / hw), hop = Math.max(-room * 0.7, Math.min(4, lid.y.x)), tilt = Math.max(-amax, Math.min(amax, lid.a.x));
    if (op < 0.995) {
      cx.save(); cx.globalAlpha = 1 - op;
      cx.translate(g.cx, g.top - 9 + hop - Math.min(room, 10) * op); cx.rotate(tilt); cx.scale(1 - 0.08 * op, 1 - 0.08 * op);
      var lwid = hw * 2;
      rr(-lwid / 2, -12, lwid, 14, 7);
      var lg = cx.createLinearGradient(0, -12, 0, 2); lg.addColorStop(0, '#5BEBD5'); lg.addColorStop(1, '#14CBB1');
      cx.fillStyle = lg; cx.fill(); cx.lineWidth = 1.5; cx.strokeStyle = '#0E9E8A'; cx.stroke();
      cx.beginPath(); cx.ellipse(0, -15, g.n * 0.22, g.n * 0.12, 0, 0, Math.PI * 2); cx.fillStyle = '#14CBB1'; cx.fill(); cx.strokeStyle = '#0E9E8A'; cx.stroke();
      cx.fillStyle = 'rgba(255,255,255,.65)'; rr(-lwid / 2 + 8, -9, lwid * 0.35, 3, 1.5); cx.fill();
      cx.restore();
    }
    cx.restore();
    if (fx) { fx.draw(cx); }
  }
  /* ---------------------------------------------- the hand-drawn labels -- */
  /* "Your pension pot at 66" over the top left of the pot, and "Enough for ..." beside the line
     (on a phone, over the top right), each with an arrow that bows the way a hand draws one: a
     curve from the words to the coins or the line, and a two-stroke head, a little uneven.
     Placed from the pot's geometry whenever it is sized; the words are HTML, the strokes SVG.
     Placing them also measures the room the lid has to pop into: up to the top of the picture,
     and up to any words above it. */
  var anno = sec.querySelector('.pb-c2-anno'), ink = anno ? anno.querySelector('.pb-c2-ink') : null;
  var labPot = anno ? anno.querySelector('.pb-c2-lab-pot') : null, labNeed = anno ? anno.querySelector('.pb-c2-lab-need') : null;
  var inks = ink ? ink.querySelectorAll('path') : [];
  function n1(v) { return (Math.round(v * 10) / 10).toString(); }
  function stroke(a, b, bow, pShaft, pHead, flip) {
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L * bow, ny = dx / L * bow;
    var c1 = { x: a.x + dx * 0.25 + nx, y: a.y + dy * 0.25 + ny }, c2 = { x: a.x + dx * 0.72 + nx * 0.7, y: a.y + dy * 0.72 + ny * 0.7 };
    pShaft.setAttribute('d', 'M' + n1(a.x) + ' ' + n1(a.y) + 'C' + n1(c1.x) + ' ' + n1(c1.y) + ' ' + n1(c2.x) + ' ' + n1(c2.y) + ' ' + n1(b.x) + ' ' + n1(b.y));
    var tx = b.x - c2.x, ty = b.y - c2.y, tl = Math.sqrt(tx * tx + ty * ty) || 1;
    tx /= tl; ty /= tl;
    function back(deg, len) { var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return { x: b.x - (tx * c - ty * s) * len, y: b.y - (tx * s + ty * c) * len }; }
    var h1 = back(flip ? -29 : 29, 12), h2 = back(flip ? 34 : -34, 10);
    pHead.setAttribute('d', 'M' + n1(h1.x) + ' ' + n1(h1.y) + 'L' + n1(b.x) + ' ' + n1(b.y) + 'L' + n1(h2.x) + ' ' + n1(h2.y));
  }
  function place(el, x, y) { el.style.setProperty('--x', n1(x) + 'px'); el.style.setProperty('--y', n1(y) + 'px'); }
  /* where a label's lines of words end up, in the picture: placed at (x, y), turned by deg about
     its left middle (the CSS's transform), as boxes square to the picture */
  function inkBoxes(el, x, y, deg) {
    var h = el.offsetHeight, r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), out = [];
    [].forEach.call(el.children, function (k) {
      var u0 = k.offsetLeft, v0 = k.offsetTop, u1 = u0 + k.offsetWidth, v1 = v0 + k.offsetHeight, xs = [], ys = [];
      [[u0, v0], [u1, v0], [u0, v1], [u1, v1]].forEach(function (p) { var dx = p[0], dy = p[1] - h / 2; xs.push(x + dx * c - dy * s); ys.push(y + h / 2 + dx * s + dy * c); });
      out.push({ l: Math.min.apply(null, xs), r: Math.max.apply(null, xs), t: Math.min.apply(null, ys), b: Math.max.apply(null, ys) });
    });
    return out;
  }
  function lidRoom(boxes) {
    var hw = g.n + g.t + 9, kw = g.n * 0.22 + 2, bodyTop = g.top - 21, knobTop = g.top - 24 - g.n * 0.12;
    var room = knobTop - 3;
    boxes.forEach(function (q) {
      if (q.r > g.cx - hw && q.l < g.cx + hw) { room = Math.min(room, bodyTop - q.b - 4); }
      if (q.r > g.cx - kw && q.l < g.cx + kw) { room = Math.min(room, knobTop - q.b - 4); }
    });
    return Math.max(0, Math.min(16, room));
  }
  function annoLayout() {
    if (!g) { return; }
    if (!anno || !inks.length) { g.room = Math.max(0, Math.min(16, g.top - 27 - g.n * 0.12)); return; }
    var pw = labPot.offsetWidth, ph = labPot.offsetHeight, nw = labNeed.offsetWidth, nh = labNeed.offsetHeight;
    if (!pw) { g.room = 0; return; }
    var lineX = g.cx + halfW(g.line) + g.t, lid = g.n + g.t + 9;
    /* the pot's label, top left, clear of the lid; its arrow into the coins at the left of the heap */
    var px = g.wide ? Math.max(6, Math.min(g.cx - g.B - pw * 0.55, g.cx - lid - 12 - pw)) : 6, py = g.wide ? 22 : 10;
    place(labPot, px, py);
    /* on a phone the words sit over the lid's left end: the arrow drops down the outside of the
       pot first, clear of the lid, then hooks into the coins */
    var a = g.wide ? { x: px + Math.min(pw * 0.42, 64), y: py + ph + 7 } : { x: px + 22, y: py + ph + 7 };
    var b = g.wide ? { x: g.cx - g.B * 0.5, y: g.cy + g.Hb * 0.36 } : { x: g.cx - g.B * 0.55, y: g.cy + g.Hb * 0.4 };
    stroke(a, b, g.wide ? -26 : 16, inks[0], inks[1], false);
    /* the line's label, top right; its arrow down to the line's end */
    var qx = W - nw - (g.wide ? 10 : 4), qy = g.wide ? 22 : 10;
    var c = { x: qx + nw * 0.55, y: qy + nh + 7 }, d = { x: lineX + 5, y: g.line - 4 };
    stroke(c, d, g.wide ? 22 : 16, inks[2], inks[3], true);
    place(labNeed, qx, qy);
    g.room = lidRoom(inkBoxes(labPot, px, py, -3).concat(anno.classList.contains('pb-c2-anno-noline') ? [] : inkBoxes(labNeed, qx, qy, 2.5)));
  }
  /* the line's label says what the line is, and turns when it is reached */
  var needT = $('pbC2NeedT'), needWas = '';
  function annoText() {
    if (!needT) { return; }
    var w = (S.covered ? '✓ ' : '') + 'Enough for ' + (S.own ? 'your figure' : 'a ' + S.label.toLowerCase() + ' life') + (S.two ? ' for two' : '');
    if (w !== needWas) { needWas = w; needT.textContent = w; }
    if (anno) { anno.classList.toggle('pb-c2-anno-ok', !!S.covered); anno.classList.toggle('pb-c2-anno-noline', !(S.targetPot > 0)); }
    annoLayout();
  }
  /* the labels write themselves on once the first pour is in (or after a while, whatever happens) */
  var annoWait = false, annoT = 0, hinted = false;
  function annoOn() {
    annoWait = false; clearTimeout(annoT);
    if (anno) { anno.classList.add('pb-on'); }
    if (hint && K.motion()) { setTimeout(function () { if (!hinted) { hint.classList.add('pb-on'); } }, 1800); }
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
      /* the pour: the lid lifts away (a fifth of a second), then the coins come, one at a time */
      if (queue > 0) {
        lid.open = Math.min(1, lid.open + dt / 0.2); lid.clink = false;
        if (lid.open >= 1 && now - lastSpawn >= 1 / rate) { spawn(nextIdx); queue--; lastSpawn = now; }
        moving = true;
      } else if (lid.open > 0) {
        /* the last coin is in: the lid comes back down, and lands */
        if (!airborne() && now - lastSpawn > 0.18) {
          lid.open = Math.max(0, lid.open - dt / 0.24);
          if (lid.open === 0 && !lid.clink) { lid.clink = true; lid.y.v -= Math.min(g.room * 0.25, 4) / 0.0452; if (fx) { var top = toWorld(g.cx, g.top - 4); fx.ring(top.x, top.y, 'rgba(14,158,138,.6)', g.n * 0.9); } }
        }
        moving = true;
      }
      if (annoWait && queue === 0 && !airborne()) { annoOn(); }
      acc += dt;
      var steps = 0;
      while (acc >= H2 && steps < 6) { physics(); acc -= H2; steps++; }
      if (acc > H2 * 6) { acc = 0; }
      for (var key in body) { body[key].step(dt); if (!body[key].done()) { moving = true; } }
      lid.y.step(dt); lid.a.step(dt); if (!lid.y.done() || !lid.a.done()) { moving = true; }
      if (line.flash > 0) { line.flash = Math.max(0, line.flash - dt * 1.2); moving = true; }
      if (speed() > 0.05) { moving = true; }
      if (fx) { fx.step(dt); if (fx.busy()) { moving = true; } }
    }
    draw();
    calm = moving ? 0 : calm + dt;
    if (K.motion() && onScreen && !document.hidden && (calm < 0.5 || ptr.in)) { raf = requestAnimationFrame(frame); }
  }

  /* ------------------------------------------------------- the pointer -- */
  function local(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function seenHint() { if (hint && hint.classList.contains('pb-on')) { hint.classList.remove('pb-on'); } hinted = true; }
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
        if (lid.open < 0.5 && Math.abs(p.y - lidY) < 16 && Math.abs(p.x - g.cx - body.ox.x) < g.n + 16) {
          pop(1);
          if (fx) { var top = toWorld(g.cx, g.top - 4); fx.ring(top.x, top.y, 'rgba(14,158,138,.6)', g.n * 0.7); }
        } else { splash(p.x, p.y); }
        seenHint();
      }
      ptr.shaking = false; body.ox.t = 0; body.tilt.t = 0;
      kick();
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }

  /* ------------------------------------------------------ the controls -- */
  [age, pot, mine, emp].forEach(function (r) { if (r) { r.addEventListener('input', function () { if (r !== pot) { userSet = true; } calc(true); }); } });
  var taxSeg = sec.querySelector('.pb-c2-tax');
  var taxS = null;
  if (taxSeg) { taxS = K.seg(taxSeg, function (b) { tax = +b.getAttribute('data-rate') / 100; if (K.setTax) { K.setTax(tax, 'calc'); } calc(true); }); }
  /* the inflation section's rate is the same rate */
  document.addEventListener('pb:tax', function (e) {
    var d = e.detail || {};
    if (d.by === 'calc') { return; }
    tax = d.rate;
    if (taxS) { taxS.press(function (b) { return +b.getAttribute('data-rate') / 100 === d.rate; }, true); }
    calc('aim');
  });
  var lvSeg = sec.querySelector('.pb-c2-lv'), hhSeg = sec.querySelector('.pb-c2-hh'), lv = null, hh = null;
  if (lvSeg) { lv = K.seg(lvSeg, function (b) { K.setAim(b.getAttribute('data-level'), K.aim.hh, 'calc'); }); }
  if (hhSeg) { hh = K.seg(hhSeg, function (b) { K.setAim(K.aim.level, b.getAttribute('data-hh'), 'calc'); }); }
  document.addEventListener('pb:aim', function (e) {
    var d = e.detail || {};
    if (lv) { lv.press(function (b) { return b.getAttribute('data-level') === d.level; }, d.by === 'calc'); }
    if (hh) { hh.press(function (b) { return b.getAttribute('data-hh') === d.hh; }, d.by === 'calc'); }
    calc(d.by === 'calc' || d.by === 'button' || d.by === 'calc-own' ? true : 'aim');
  });
  var tw = 0;
  close.addEventListener('click', function () {
    if (this.getAttribute('data-act') === 'up') { var up = higher(); if (up) { K.setAim(up, K.aim.hh, 'button'); } return; }
    if (S.covered || S.far) { return; }
    var want = Math.min(+mine.max, S.reach), from = +mine.value, step = +mine.step || 10, t0 = performance.now(), dur = K.motion() ? 1200 : 0;
    userSet = true;
    cancelAnimationFrame(tw);
    (function go(ms) {
      var k = dur ? Math.min(1, (ms - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      mine.value = Math.round((from + (want - from) * e) / step) * step;
      calc(true);
      if (k < 1) { tw = requestAnimationFrame(go); } else { mine.focus({ preventScroll: true }); }
    }(t0));
  });

  /* ------------------------------------------------ the phone panel -- */
  /* 14 October 2026. Where the result follows the controls as a pill (920px
     wide or less), the pill sits on a band of the panel's own colour once it
     is stuck, so a control passes behind it whole, not half under it. And
     "Aiming for", asked just above in the gap section (the two share K.aim),
     is one line there, with a button that opens the pills. */
  var mini = sec.querySelector('.pb-c2-mini'), live = $('pbC2Live');
  if (mini && live && 'IntersectionObserver' in window) {
    var pin = document.createElement('i'); pin.className = 'pb-c2-pin'; pin.setAttribute('aria-hidden', 'true');
    live.appendChild(pin);
    new IntersectionObserver(function (es) {
      var e = es[es.length - 1];
      mini.classList.toggle('pb-c2-stuck', !e.isIntersecting && e.boundingClientRect.top < 83);
    }, { rootMargin: '-83px 0px 0px 0px', threshold: 0 }).observe(pin);
  }
  var aimBox = sec.querySelector('.pb-c2-aim'), aims = aimBox && aimBox.querySelector('.pb-c2-aims');
  if (aimBox && aims) {
    aims.id = aims.id || 'pbC2Aims';
    var sum = document.createElement('div'); sum.className = 'pb-c2-aimsum';
    sum.innerHTML = '<span id="pbC2AimSum"></span><button type="button" class="pb-c2-aimchg" aria-expanded="false" aria-controls="' + aims.id + '">Change</button>';
    aimBox.insertBefore(sum, aimBox.firstChild);
    var chg = sum.querySelector('button'), said = sum.querySelector('span');
    var aimSay = function () {
      var a = K.aim, two = a.hh === 'couple';
      said.innerHTML = 'Aiming for <b>' + (a.level === 'own' ? 'your own figure' : 'a ' + K.life(a.level, a.hh).label.toLowerCase() + ' life') + '</b>' + (two ? ', for two' : ', for one');
    };
    chg.addEventListener('click', function () {
      var open = !aimBox.classList.contains('pb-c2-aim-open');
      aimBox.classList.toggle('pb-c2-aim-open', open);
      chg.setAttribute('aria-expanded', open ? 'true' : 'false');
      chg.textContent = open ? 'Done' : 'Change';
      if (open) {
        if (lv) { lv.place(true); } if (hh) { hh.place(true); }
        var on = aims.querySelector('[aria-pressed="true"]'); if (on) { on.focus({ preventScroll: true }); }
      }
    });
    document.addEventListener('pb:aim', aimSay);
    aimSay();
  }

  /* ---------------------------------------------------- housekeeping -- */
  window.addEventListener('resize', function () { if (!cx) { return; } var old = g; W = 0; size(); if (old) { coins.forEach(function (c) { c.x = g.cx + (c.x - old.cx) * g.B / old.B; c.y = g.bottom - (old.bottom - c.y) * g.B / old.B; c.px = c.x; c.py = c.y; }); } kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { annoLayout(); kick(); }); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', function () { if (g && !K.motion()) { settleNow(); if (annoWait) { annoOn(); } } kick(); });
  $('pbC2Live').hidden = false;
  sec.classList.add('pb-c2-on');
  if (cx) { size(); }
  calc(false);
  if (cx && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting;
      if (onScreen && !seen) {
        seen = true;
        /* the first look: empty the pot and pour; the labels write themselves on once it is in */
        if (K.motion()) {
          coins = []; queue = wanted(); rate = Math.max(16, Math.min(56, queue / 0.9));
          if (anno) { annoWait = true; annoT = setTimeout(annoOn, 3200); }
        } else if (anno) { annoOn(); }
      }
      if (onScreen) { kick(); }
    }, { threshold: 0.3 }).observe(cv);
  } else { seen = true; if (anno) { anno.classList.add('pb-on'); } }
}());
