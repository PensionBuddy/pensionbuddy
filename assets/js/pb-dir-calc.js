/* The director page's calculator (#drCalc), 11 October 2026, Damian's brief:
   "a simpler calculator; super motion design, super simple, super
   interactive; no unnecessary text".

   Three sliders and a pair of pills: your age (25 to 65), what the company
   pays in each year (€5,000 to €150,000), what you have in pensions already
   (€0 to €2 million; Damian, 12 October 2026: "we're missing something")
   and when the payments start (this year, or a year later). One answer: the
   pot at 66, in today's money.
     The pot      y = 66 - age years of the company's payments, monthly, on
                  top of what you have now, both at PBAssume.assets.cap a
                  year (6% before charges, the most the Pensions Authority
                  lets a projection assume):
                  PBDirector.project(12y, have, pay / 12, monthlyRate(cap)),
                  then PBAssume.today(that, y) for today's money (the ECB's
                  2%). €989,032 at the defaults, €1,412,582 before inflation.
     A year later PBDirector.waiting({ delay: 1 }): the same payments, a year
                  fewer of them. €77,467 less at 66 in today's money; pressed,
                  the pot shows today - gapToday and waiting's later.
     Each year    the company's payment into the pension, all of it; as
                  salary, pay x window.PBDirKeep.rate (the page's inline
                  script: 1 - income tax - USC - PRSI by date, from
                  PBDirector.keepRate and PBPrsi), rounded to the cent and
                  then the euro: €19,060; left as profit, pay x (1 -
                  PBDirector.CT): €35,000.
     Your limit   paying in yourself: PBRelief.reliefLimit(age, EARN_CAP),
                  a share of earnings up to €115,000 by age: €28,750 at 48.
     The SFT      the Standard Fund Threshold in the year you reach 66
                  (window.PBSft when the page loads sft.js; else its four
                  steps, Finance Act 2024 s.13, and at least €2.8 million
                  from 2029). The line shows when the pot before inflation
                  (as pressed: this year, or a year later) passes it.
   The markup is the finished answer at the defaults: without script every
   figure still reads, and every figure here starts on the markup's.

   THE TOWER. One stack; one coin is the first of €5k, €10k ... €1m that
   keeps this year's pot at 66 within 28 coins (€50,000 at the defaults:
   17.8 coins); a part coin on top shows as a part (its opacity). Coins drop
   in blue, the company's money, and turn over silver as they land: yours.
   A dashed slate string across the tower is the pot your own limit would
   build, when the company pays more than it; it bows as coins drop through.
   "A year later": the top coins turn coral and tumble off to the right,
   leaving a dashed coral outline of what waiting costs; "This year" flies
   them back.

   Motion: just before the figures come on screen they go back to your age
   (€0), and the first time the tower is 35% on screen the years run from
   there to 66 in 2.4 seconds, on a steady beat: #drAt and the pot tick a
   year at a time (each one readable) and roll into place at 66, and a coin
   or so a year drops; the "Your own limit" string fades in first, so the
   coins pass it on the way up. Then "Drag to run the years.". A sideways
   drag (past 6px, so a finger can still scroll the page) runs the age back
   and forth: going back, the top coins lift off and fade; going on, they
   drop; on release it springs back to 66. The tower leans away from the
   pointer and riffles round it, smoothly through the middle; a tap sends a
   wave up it that rings off the top. A slider drops coins on or knocks them
   off sideways; a new coin size squashes the coins out and restacks the
   same money, silver, in the new size, and its label hops. One rAF loop,
   only while the tower is on screen, stopping after 0.6s of calm; its clock
   is the frames', so a slow phone slows the run rather than skipping it.
   With motion off it is drawn once, at 66, per change (a drag still
   scrubs). */
(function () {
  'use strict';
  var sec = document.getElementById('drCalc'), K = window.PBKit, C = window.PBCoins;
  var PD = window.PBDirector, PA = window.PBAssume, PR = window.PBRelief;
  if (!sec || !K || !PD || !PA || !PR || !PA.assets) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var age = $('drAge'), pay = $('drPay'), have = $('drHave'), ctl = $('drCalcCtl');
  if (!age || !pay || !ctl) { return; }
  var fmt = K.fmt, GROW = PA.assets.cap, MR = PD.monthlyRate(GROW), CAP = PR.EARN_CAP || 115000;
  /* the page's retirement age: every figure is "at 66" */
  var AT = 66, MAXC = 28, SIZES = [5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  function keep() {
    if (window.PBDirKeep && window.PBDirKeep.rate > 0) { return window.PBDirKeep.rate; }
    return window.PBPrsi ? PD.keepRate(window.PBPrsi.at(new Date()).rate) : 0;
  }
  /* the Standard Fund Threshold for a year: { value, atLeast } */
  var SFT_STEPS = { 2026: 2200000, 2027: 2400000, 2028: 2600000, 2029: 2800000 };
  function sft(year) {
    if (window.PBSft && window.PBSft.threshold) { return window.PBSft.threshold(year); }
    if (year <= 2026) { return { value: SFT_STEPS[2026], atLeast: false }; }
    if (year <= 2029) { return { value: SFT_STEPS[year], atLeast: false }; }
    return { value: SFT_STEPS[2029], atLeast: true };
  }

  /* ------------------------------------------------------------ the sums -- */
  var st = { a: AT, later: false };
  function A() { return +age.value; }
  function P() { return +pay.value; }
  function Hv() { return have ? +have.value : 0; }
  /* the pot at age a, for the reader's age and payment: { now, today, nom, gap } */
  function pot(a, ag, py, later) {
    var n = Math.max(0, Math.min(AT, a) - ag);
    var nom = PD.project(12 * n, Hv(), py / 12, MR), today = PA.today(nom, n);
    var w = PD.waiting({ pot: Hv(), yearly: py, years: n, delay: 1, rate: GROW, today: PA.today });
    return { now: today, today: later ? today - w.gapToday : today, nom: later ? w.later : nom, gap: w.gapToday };
  }
  /* one coin: the first size that keeps this year's pot at 66 within 28 coins */
  function coinFor(ag, py) {
    var t = pot(AT, ag, py, false).today;
    for (var i = 0; i < SIZES.length; i++) { if (t / SIZES[i] <= MAXC) { return SIZES[i]; } }
    return SIZES[SIZES.length - 1];
  }

  /* ----------------------------------------------------------- the words -- */
  /* the figures that stand alone roll (PBKit.Roll); a figure that gains or
     loses a digit is set at once, so no row of noughts rolls in ahead of it */
  function roll(id) {
    var e = $(id), r = e ? new K.Roll(e) : null;
    return { set: function (t, quiet) { if (r) { r.set(t, quiet || (r.text && r.text.length !== t.length)); } } };
  }
  function text(id) { var e = $(id); return { set: function (t) { if (e && e.textContent !== t) { e.textContent = t; } } }; }
  var rAt = roll('drAt'), rToday = roll('potToday'), rOut = roll('potOut'), rWait = roll('drWaitV');
  var rPen = roll('drYrPen'), rSal = roll('drYrSal'), rPro = roll('drYrPro');
  /* the two inside sentences stay plain words */
  var rYrPay = text('drYrPay'), rLim = text('drLimV');
  var haveV = $('drHaveV'), ageV = $('drAgeV'), payV = $('drPayV'), limAge = $('drLimAge'), limPct = $('drLimPct'), sftP = $('drSft'), sftV = $('drSftV'), sr = $('drSr');
  function fill(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  function sftText(t) {
    var m = (t.value / 1e6).toFixed(1).replace(/\.0$/, '');
    return t.atLeast ? 'at least €' + m + ' million by ' : '€' + m + ' million in ';
  }
  /* the panel: everything that does not run with the years */
  function panel(quiet) {
    var ag = A(), py = P(), lim = PR.reliefLimit(ag, CAP), end = pot(AT, ag, py, st.later), year = new Date().getFullYear() + (AT - ag);
    fill(age); fill(pay); if (have) { fill(have); have.setAttribute('aria-valuetext', fmt(Hv())); if (haveV) { haveV.textContent = fmt(Hv()); } }
    age.setAttribute('aria-valuetext', 'Age ' + ag);
    pay.setAttribute('aria-valuetext', fmt(py) + ' a year');
    /* where the reader's own limit sits on the payment track, 0 to 1, for a notch */
    pay.style.setProperty('--dr-lim', Math.max(0, Math.min(1, (lim - pay.min) / (pay.max - pay.min))).toFixed(4));
    if (ageV) { ageV.textContent = ag; }
    if (payV) { payV.textContent = fmt(py); }
    if (limAge) { limAge.textContent = ag; }
    if (limPct) { limPct.textContent = Math.round(lim / CAP * 100) + '%'; }
    rLim.set(fmt(lim), quiet);
    rYrPay.set(fmt(py), quiet); rPen.set(fmt(py), quiet);
    rSal.set(fmt(Math.round(Math.round(py * keep() * 100) / 100)), quiet);
    rPro.set(fmt(py * (1 - PD.CT)), quiet);
    rWait.set(fmt(end.gap), quiet);
    var t = sft(year), over = end.nom > t.value;
    if (sftP) { sftP.hidden = !over; }
    if (sftV && over) { sftV.textContent = sftText(t) + year; }
  }
  /* the answer at the age shown. While the years run (fast) the age and the
     pot tick, each year set at once, so they read at every moment (rolled at
     seven years a second they are a blur); the last step rolls into place */
  function answer(quiet, fast) {
    var s = pot(st.a, A(), P(), st.later);
    rAt.set(String(st.a), quiet || fast); rToday.set(fmt(s.today), quiet || fast); rOut.set(fmt(s.nom), quiet || fast);
  }
  /* the summary for screen readers, once the reader stops */
  var srT = 0;
  function speak() {
    if (!sr) { return; }
    clearTimeout(srT);
    srT = setTimeout(function () {
      var ag = A(), py = P(), e = pot(AT, ag, py, st.later), t = sft(new Date().getFullYear() + AT - ag);
      sr.textContent = 'Age ' + ag + ', ' + fmt(Hv()) + ' in pensions now, the company paying ' + fmt(py) + ' a year' + (st.later ? ', starting a year later' : '') +
        ': about ' + fmt(e.today) + ' at ' + AT + ' in today’s money, ' + fmt(e.nom) + ' before inflation. ' +
        (st.later ? fmt(e.gap) + ' less than starting this year.' : 'Starting a year later: about ' + fmt(e.gap) + ' less.') +
        (e.nom > t.value ? ' That could pass the Standard Fund Threshold.' : '');
    }, 600);
  }

  /* ---------------------------------------------------------- the tower -- */
  var stage = sec.querySelector('.drc-stage'), cv = stage ? stage.querySelector('.drc-cv') : null;
  var cx = cv && cv.getContext && C ? cv.getContext('2d') : null, hint = $('drcHint');
  var W = 0, H = 0, dpr = 1, G = null, fx = C ? new C.FX() : null;
  var COIN = coinFor(A(), P());
  var T = {
    n: new K.Spring(0, 70, 16),       /* coins in the tower: the pot shown over one coin */
    gh: new K.Spring(0, 70, 16),      /* this year's pot, for the outline "a year later" leaves */
    lim: new K.Spring(0, 70, 15),     /* where the string is, in coins */
    limA: 0, limAt: 0, ghA: 0, ghAt: 0,
    bow: { x: 0, v: 0 }, lean: { x: 0, v: 0 }, lab: { y: 0, v: 0 }
  };
  var coins = [], gone = [], outs = [], why = '';
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    var small = W < 480, top = 46, base = H - (small ? 34 : 40);
    /* as wide as the stage allows, then narrower until 28 coins fit under the hint */
    var w = Math.max(56, Math.min(96, W * 0.22));
    w = Math.max(30, Math.min(w, (base - top) / (MAXC * 0.105 + 0.3)));
    var h = C.sliceH(Math.round(w));
    G = { w: Math.round(w), e: h.e, ry: h.ry, base: base, x: Math.round(W / 2), small: small };
  }
  function slotY(i) { return G.base - G.ry - G.e - i * G.e; }
  function levelY(n) { return G.base - G.ry - n * G.e; }
  /* each coin's own small offset, so a stack is a stack and not a cylinder */
  function jit(i) { var v = Math.sin(i * 12.9898 + 4 * 78.233) * 43758.5453; return (v - Math.floor(v) - 0.5) * 1.6; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  /* how far to lean from a pointer d to the side: none with it dead centre,
     the most at s either side, fading beyond; smooth all the way across, so
     a pointer crossing the tower never flips it from one side to the other */
  function away(d, s) { var u = d / s; return u * Math.exp(0.5 * (1 - u * u)); }
  /* a coin: 'drop' falls in blue and lands silver; 'back' flies in coral
     from the right and lands silver; 'settle' is already yours, restacked
     after a new coin size: silver, a short drop; 'still' is simply there */
  function mkCoin(i, mode) {
    var c = { y: 0, vy: 0, land: true, hit: true, hop: 0, vh: 0, wd: 0, wv: 0, sq: 0, o: 0, vo: 0, kind: 'silver', next: null, flip: 1, dl: 0, fx: 0, y0: 1 };
    if (mode === 'settle') { c.y = c.y0 = -(12 + G.e * 1.5); c.land = false; return c; }
    if (mode === 'drop' || mode === 'back') {
      /* it falls from a little above the tower, fading in as it comes */
      c.y = c.y0 = -Math.min(slotY(i) + G.w * 0.3, 110 + G.w * 0.4); c.land = false; c.hit = false;
      c.kind = mode === 'back' ? 'coral' : 'blue'; c.next = 'silver'; c.flip = 0;
      if (mode === 'back') { c.fx = Math.min(W * 0.38, G.w * 2.4); c.back = true; }
    }
    return c;
  }
  /* the coins follow the count: whole coins for it, the part coin on top */
  function sync() {
    var want = Math.max(0, Math.ceil(T.n.x - 0.001)), live = K.motion() && seen;
    while (coins.length > want) {
      var i = coins.length - 1, o = coins.pop();
      if (!live || !G || o.dl > 0) { continue; }
      var x = G.x + jit(i) + o.o + T.lean.x * Math.pow((i + 1) / Math.max(i + 1, 6), 1.4), y = slotY(i) + o.y + o.hop;
      if (why === 'scrub') {
        /* time running back: the coin lifts off the top and fades */
        gone.push({ x: x, y: y, kind: o.next || o.kind, next: null, flip: 1, pre: 0, vx: 0, vy: -240, a: 0, va: 0, age: 0, up: true, life: 0.28 });
      } else if (why === 'later') {
        /* what waiting costs: it turns coral where it is, then tumbles off to the right */
        gone.push({ x: x, y: y, kind: o.next || o.kind, next: 'coral', flip: 0, pre: 0.3, vx: 150 + Math.random() * 110, vy: -(240 + Math.random() * 120), a: 0, va: 2.5 + Math.random() * 3, age: 0, life: 1.1 });
      } else if (gone.length > 5) {
        /* a slider pulled down fast: a handful tumble, the rest lift off and fade */
        gone.push({ x: x, y: y, kind: o.next || o.kind, next: null, flip: 1, pre: 0, vx: 0, vy: -240, a: 0, va: 0, age: 0, up: true, life: 0.28 });
      } else {
        var side = Math.random() < 0.5 ? -1 : 1;
        gone.push({ x: x, y: y, kind: o.next || o.kind, next: null, flip: 1, pre: 0, vx: side * (120 + Math.random() * 150), vy: -(200 + Math.random() * 160), a: 0, va: side * (3 + Math.random() * 4), age: 0, life: 1.1 });
      }
    }
    while (coins.length < want) { coins.push(mkCoin(coins.length, live && G ? (why === 'back' ? 'back' : 'drop') : 'still')); }
  }
  /* bring the tower to the age shown */
  function target(snap) {
    var ag = A(), py = P(), s = pot(st.a, ag, py, st.later), lim = PR.reliefLimit(ag, CAP), end = pot(AT, ag, py, st.later);
    var nc = coinFor(ag, py);
    if (nc !== COIN) { recoin(nc, s.today / nc, s.now / nc); }
    T.n.t = s.today / COIN; T.gh.t = s.now / COIN;
    /* the string: what your own limit would build by 66, the same way */
    T.limAt = py > lim ? 1 : 0;
    if (py > lim) { T.lim.t = pot(AT, ag, lim, false).today / COIN; if (T.limA < 0.05) { T.lim.x = T.lim.t; T.lim.v = 0; } }
    T.ghAt = st.later ? 1 : 0;
    if (snap || !K.motion() || !seen) {
      T.n.x = T.n.t; T.gh.x = T.gh.t; T.lim.x = T.lim.t; T.limA = T.limAt; T.ghA = T.ghAt;
      T.n.v = T.gh.v = T.lim.v = 0;
    }
    kick();
  }
  /* a new coin size: the coins squash out from the top down, 8ms apart, and
     the same money restacks in the new size from the floor up, 12ms apart:
     silver, a short drop, no new money. Only coins the reader can see go
     out, each as it is drawn (a coin still falling goes out where it is, as
     faint as it is), so a size change in the middle of another, while a
     slider runs, never leaves a coin hanging in the air */
  function recoin(nc, nt, gt) {
    var k = COIN / nc, live = K.motion() && seen && G, fr = T.n.x - Math.floor(T.n.x - 0.001);
    COIN = nc;
    T.n.x *= k; T.gh.x *= k; T.lim.x *= k; T.n.v *= k; T.gh.v *= k; T.lim.v *= k;
    /* a fall restacks straight to where it is going (the new size says it);
       a rise restacks what is there and the new money drops on in blue */
    if (nt < T.n.x) { T.n.x = nt; T.n.v = 0; }
    if (gt < T.gh.x) { T.gh.x = gt; T.gh.v = 0; }
    if (!live) { coins = []; return; }
    var m = coins.length, n = T.lean.x;
    coins.forEach(function (c, i) {
      if (c.dl > 0) { return; }
      var ff = c.y0 < 0 ? clamp(c.y / c.y0, 0, 1) : 0, a = c.land ? 1 : clamp((1 - ff) / 0.35, 0, 1);
      if (i === m - 1 && fr < 0.999) { a *= 0.12 + 0.88 * fr; }
      if (a < 0.03) { return; }
      var h = (i + 1) / Math.max(m, 6);
      outs.push({ x: G.x + jit(i) + c.o + n * Math.pow(h, 1.4) + c.fx * ff * ff, y: slotY(i) + c.y + c.hop, kind: c.next && c.flip >= 0.5 ? c.next : c.kind, a: a, age: -(m - 1 - i) * 0.008 });
    });
    coins = [];
    var want = Math.ceil(T.n.x - 0.001);
    for (var i = 0; i < want; i++) { var c = mkCoin(i, 'settle'); c.dl = 0.08 + i * 0.012; coins.push(c); }
    T.lab.v = -230;
  }

  /* ---------------------------------------------------------- the frame -- */
  var raf = 0, last = 0, onScreen = true, seen = false, calm = 0, intro = null, back = null, touched = false, inFrame = false;
  /* one loop: a kick from inside a frame only keeps it going */
  function kick() { calm = 0; if (cx && !raf && !inFrame && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function frame(ms) {
    raf = 0; inFrame = true;
    try { tick(ms); } finally { inFrame = false; }
  }
  function tick(ms) {
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    if (!W || !G) { size(); }
    if (W < 120 || H < 120) { return; }
    var motion = K.motion(), moving = false;
    if (!motion) { still(); } else { moving = step(now, dt); }
    draw();
    calm = moving ? 0 : calm + dt;
    if (motion && onScreen && !document.hidden && calm < 0.6 && !raf) { raf = requestAnimationFrame(frame); }
  }
  /* motion off: the finished picture, at the age shown */
  function still() {
    if (intro || back) { intro = null; back = null; st.a = ptr.scrub ? st.a : AT; answer(true); target(true); }
    T.n.step(0); T.gh.step(0); T.lim.step(0); T.limA = T.limAt; T.ghA = T.ghAt;
    why = ''; sync();
    coins.forEach(function (c) { c.y = c.vy = c.hop = c.vh = c.wd = c.sq = c.o = c.vo = c.dl = 0; c.land = c.hit = true; c.flip = 1; c.kind = 'silver'; c.next = null; c.fx = 0; });
    gone = []; outs = []; if (fx) { fx.p = []; }
    T.bow.x = T.bow.v = T.lean.x = T.lean.v = T.lab.y = T.lab.v = 0;
  }
  /* the years' beat: steady, a little quicker through the middle, soft at
     both ends; never stalled, so the first coin falls within a quarter second */
  function ease(k) { return 0.55 * k + 0.45 * k * k * (3 - 2 * k); }
  function step(now, dt) {
    var moving = false;
    /* the first look: the years run from the reader's age to 66 */
    if (intro) {
      moving = true;
      /* on the frame's own clock, so on a slow phone the coins keep up with the years */
      intro.t += dt;
      var k = clamp(intro.t / intro.dur, 0, 1), a = Math.round(intro.from + (AT - intro.from) * ease(k));
      if (a !== st.a) { st.a = a; answer(false, a !== AT); target(); }
      if (k >= 1) { intro = null; showHint(500); }
    }
    /* after a drag: back to 66 on a spring */
    if (back) {
      back.v += (60 * (AT - back.x) - 13 * back.v) * dt; back.x = Math.min(AT, back.x + back.v * dt);
      var b = Math.round(back.x);
      if (b !== st.a) { st.a = b; answer(false, b !== AT); target(); }
      if (AT - back.x < 0.02 && Math.abs(back.v) < 0.05) { back = null; if (st.a !== AT) { st.a = AT; answer(); target(); } }
      moving = true;
    }
    T.n.step(dt); T.gh.step(dt); T.lim.step(dt);
    if (!T.n.done() || !T.gh.done() || !T.lim.done()) { moving = true; }
    sync();
    var fa = Math.min(1, dt * 7);
    T.limA += (T.limAt - T.limA) * fa; T.ghA += (T.ghAt - T.ghA) * fa;
    if (Math.abs(T.limAt - T.limA) > 0.003 || Math.abs(T.ghAt - T.ghA) > 0.003) { moving = true; } else { T.limA = T.limAt; T.ghA = T.ghAt; }
    /* the string bows back up; the label settles after a hop */
    var B = T.bow; B.v += (300 * (0 - B.x) - 10 * B.v) * dt; B.x += B.v * dt;
    if (Math.abs(B.v) > 0.3 || Math.abs(B.x) > 0.1) { moving = true; }
    var L = T.lab; L.v += (320 * (0 - L.y) - 15 * L.v) * dt; L.y += L.v * dt;
    if (Math.abs(L.v) > 0.3 || Math.abs(L.y) > 0.1) { moving = true; }
    if (stepCoins(dt)) { moving = true; }
    gone = gone.filter(function (o) {
      if (o.flip < 1) { o.flip = Math.min(1, o.flip + dt / 0.26); if (o.flip >= 1 && o.next) { o.kind = o.next; o.next = null; } }
      if (o.pre > 0) { o.pre -= dt; return true; }
      o.age += dt; o.x += o.vx * dt; o.y += o.vy * dt; o.a += o.va * dt;
      if (o.up) { o.vy *= Math.exp(-dt * 4); } else { o.vy += 1800 * dt; }
      return o.age < o.life;
    });
    outs = outs.filter(function (o) { o.age += dt; return o.age < 0.16; });
    if (gone.length || outs.length) { moving = true; }
    if (fx) { fx.step(dt); if (fx.busy()) { moving = true; } }
    ptr.vx *= Math.exp(-dt * 7);
    return moving;
  }
  function stepCoins(dt) {
    var moving = false, L = T.lean, lt = 0, n = Math.max(1, coins.length), line = T.limA > 0.5 ? levelY(T.lim.x) : null;
    /* it leans away from the pointer, or trails a drag */
    if (ptr.scrub) { lt = clamp(-ptr.vx * 0.02, -16, 16); }
    else if (ptr.in) { lt = 12 * away(G.x - ptr.x, G.w * 0.75); }
    L.v += (110 * (lt - L.x) - 10 * L.v) * dt; L.x += L.v * dt;
    if (Math.abs(L.v) > 0.4 || Math.abs(lt - L.x) > 0.2) { moving = true; }
    coins.forEach(function (c, i) {
      if (c.dl > 0) { c.dl -= dt; moving = true; return; }
      if (!c.land) {
        var y0 = slotY(i) + c.y;
        c.vy += 3000 * dt; c.y += c.vy * dt; moving = true;
        /* a coin dropping through the string bows it */
        if (line !== null && y0 < line && slotY(i) + c.y >= line && c.vy > 0) { T.bow.v += 120; }
        if (c.y >= 0) {
          c.y = 0;
          if (!c.hit) {
            c.hit = true; c.flip = 0;
            if (fx) { fx.ring(G.x + jit(i), slotY(i) + G.ry * 0.2, c.back ? 'rgba(20,203,177,.7)' : 'rgba(255,255,255,.95)', G.w * 0.4); }
          }
          if (c.vy > 260) { c.vy = -c.vy * 0.2; c.sq = 1; } else { c.vy = 0; c.land = true; }
        }
      }
      if (c.hit && c.flip < 1) { c.flip = Math.min(1, c.flip + dt / 0.3); if (c.flip >= 1 && c.next) { c.kind = c.next; c.next = null; } moving = true; }
      /* the riffle: coins near the pointer's height step aside, the nearer the
         further, easing through the middle rather than jumping sides */
      var to = 0;
      if (ptr.in && !ptr.scrub) {
        var dy = slotY(i) - ptr.y, f0 = Math.max(0, 1 - Math.abs(ptr.x - G.x) / (G.w * 1.3));
        if (f0 > 0) { to = clamp((G.x - ptr.x) / (G.w * 0.15), -1, 1) * 11 * f0 * Math.exp(-dy * dy / (2 * Math.pow(G.e * 2.4, 2))); }
      }
      var kk = 280 - 5 * Math.min(i, 30);
      c.vo += (kk * (to - c.o) - 17 * c.vo) * dt; c.o += c.vo * dt;
      if (Math.abs(c.vo) > 0.5 || Math.abs(to - c.o) > 0.2) { moving = true; }
      if (c.wd > 0) { c.wd -= dt; if (c.wd <= 0) { c.vh = c.wv; } moving = true; }
      if (c.vh || c.hop) { c.vh += 2600 * dt; c.hop += c.vh * dt; if (c.hop > 0) { c.hop = 0; c.vh = Math.abs(c.vh) > 100 ? -c.vh * 0.18 : 0; } moving = true; }
      if (c.sq) { c.sq = Math.max(0, c.sq - dt * 6); moving = true; }
    });
    return moving;
  }

  /* ----------------------------------------------------------- the draw -- */
  var FONT = '600 12px Figtree, system-ui, sans-serif';
  function draw() {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var n = coins.length, frac = T.n.x - Math.floor(T.n.x - 0.001), top = -1, i;
    for (i = 0; i < n; i++) { if (coins[i].dl <= 0 && coins[i].land) { top = i; } }
    floor();
    if (T.ghA > 0.01) { ghost(top >= 0 ? slotY(top) : G.base, T.ghA); }
    for (i = 0; i < n; i++) {
      var c = coins[i];
      if (c.dl > 0) { continue; }
      var h = (i + 1) / Math.max(n, 6), part = i === n - 1 && frac < 0.999 ? frac : 1;
      var ff = c.y0 < 0 ? clamp(c.y / c.y0, 0, 1) : 0, fade = c.land ? 1 : clamp((1 - ff) / 0.35, 0, 1);
      var x = G.x + jit(i) + c.o + T.lean.x * Math.pow(h, 1.4) + c.fx * ff * ff;
      var y = slotY(i) + c.y + c.hop, w = G.w * (1 + c.sq * 0.06), a = (part < 1 ? 0.12 + 0.88 * part : 1) * fade;
      turn(x, y, w, c.kind, c.next, c.flip, a, i === top);
    }
    outs.forEach(function (o) {
      if (o.age < 0) { C.slice(cx, o.x, o.y, G.w, o.kind, o.a, false); return; }
      var k = o.age / 0.16;
      cx.save(); cx.globalAlpha = (1 - k) * o.a; cx.translate(o.x, o.y); cx.scale(1 + k * 0.25, Math.max(0.05, 1 - k)); C.slice(cx, 0, 0, G.w, o.kind, 1, false); cx.restore();
    });
    if (T.limA > 0.01) { string(T.limA); }
    gone.forEach(function (o) {
      var k = o.age / o.life;
      cx.save(); cx.translate(o.x, o.y); cx.rotate(o.a);
      turn(0, 0, G.w * (1 - k * (o.up ? 0.1 : 0.3)), o.kind, o.next, o.flip, 1 - k, false);
      cx.restore();
    });
    if (fx) { fx.draw(cx); }
    cx.fillStyle = 'rgba(84,99,95,.88)'; cx.font = FONT; cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
    cx.fillText('One coin = ' + fmt(COIN), G.small ? 4 : 6, H - (G.small ? 8 : 12) + T.lab.y);
  }
  /* a coin from the side (PBCoins.slice); part way through turning from one
     metal to another (q < 1) it lifts a little and the new metal comes up
     through the old with a glint, as the hero's coins do */
  function turn(x, y, w, kind, next, q, a, top) {
    if (!next || q >= 1) { C.slice(cx, x, y, w, next && q >= 1 ? next : kind, a, top); return; }
    var bump = Math.sin(Math.PI * q), s = q * q * (3 - 2 * q);
    y -= 3 * bump;
    C.slice(cx, x, y, w, kind, a, top);
    C.slice(cx, x, y, w, next, a * s, top);
    if (bump > 0.05) {
      cx.save(); cx.globalCompositeOperation = 'lighter'; C.slice(cx, x, y, w, next, a * 0.24 * bump, top); cx.restore();
    }
  }
  function floor() {
    var x = G.x, y = G.base + 3, rw = G.w * 0.85, s = cx.createRadialGradient(x, y, 1, x, y, rw);
    s.addColorStop(0, 'rgba(11,31,28,.16)'); s.addColorStop(1, 'rgba(11,31,28,0)');
    cx.save(); cx.translate(x, y); cx.scale(1, G.ry * 0.9 / rw); cx.translate(-x, -y);
    cx.fillStyle = s; cx.beginPath(); cx.arc(x, y, rw, 0, Math.PI * 2); cx.fill(); cx.restore();
  }
  /* what waiting a year costs: a coral outline of this year's pot, above the coins left */
  function ghost(solid, a) {
    var hgt = T.gh.x;
    if (hgt <= 0.02) { return; }
    var x = G.x, rx = G.w / 2 + 1, ry = G.ry + 1, top = levelY(hgt), bot = G.base - G.ry;
    if (top >= solid - 0.5) { return; }
    cx.save(); cx.globalAlpha = a;
    cx.beginPath(); cx.rect(0, 0, W, solid); cx.clip();
    cx.beginPath(); cx.ellipse(x, top, rx, ry, 0, Math.PI, 0); cx.lineTo(x + rx, bot); cx.ellipse(x, bot, rx, ry, 0, 0, Math.PI); cx.closePath();
    cx.fillStyle = 'rgba(212,87,61,.08)'; cx.fill();
    cx.setLineDash([4, 4]); cx.lineWidth = 1.6; cx.strokeStyle = 'rgba(212,87,61,.8)'; cx.stroke();
    cx.beginPath(); cx.ellipse(x, top, rx, ry, 0, 0, Math.PI); cx.stroke();
    cx.restore();
  }
  /* "Your own limit": a dashed slate string across the tower that bows */
  function string(a) {
    var y = levelY(T.lim.x), ext = G.small ? 16 : 24, xa = G.x - G.w / 2 - ext, xb = G.x + G.w / 2 + ext, bow = clamp(T.bow.x, -14, 14);
    cx.save(); cx.globalAlpha = a;
    cx.setLineDash([5, 4]); cx.lineWidth = 1.6; cx.lineCap = 'round'; cx.strokeStyle = 'rgba(88,107,133,.9)';
    cx.beginPath(); cx.moveTo(xa, y); cx.quadraticCurveTo(G.x, y + 2 * bow, xb, y); cx.stroke();
    cx.setLineDash([]); cx.fillStyle = '#586B85';
    cx.beginPath(); cx.arc(xa, y, 2.4, 0, Math.PI * 2); cx.arc(xb, y, 2.4, 0, Math.PI * 2); cx.fill();
    var txt = 'Your own limit';
    cx.font = FONT; cx.textBaseline = 'middle'; cx.fillStyle = '#4C5D75';
    var tw = cx.measureText(txt).width;
    if (xb + 8 + tw <= W - 4) { cx.textAlign = 'left'; cx.fillText(txt, xb + 8, y); }
    else if (xa - 8 - tw >= 4) { cx.textAlign = 'right'; cx.fillText(txt, xa - 8, y); }
    else { cx.textAlign = 'right'; cx.textBaseline = 'alphabetic'; cx.fillText(txt, xb, y - 7); }
    cx.restore();
  }

  /* ------------------------------------------------------ the first look -- */
  /* the figures stand above the tower, so they go back to the reader's age
     just before they come on screen, where the run will start from, rather
     than turning from the answer to €0 in front of the reader */
  var armed = false;
  function arm() {
    if (armed || seen || touched || !K.motion()) { return; }
    armed = true; st.a = A(); answer(true);
  }
  function startIntro() {
    if (!G) { size(); }
    var from = A();
    st.a = from; answer(true);
    T.n.x = T.n.t = 0; T.gh.x = T.gh.t = 0; T.n.v = T.gh.v = 0; coins = []; gone = [];
    target();
    /* the string is in place before the coins and fades in as they start */
    T.lim.x = T.lim.t; T.lim.v = 0; T.limA = 0;
    intro = { t: -0.12, dur: clamp((AT - from) * 0.135, 1, 2.4), from: from };
    kick();
  }
  /* any press ends it, at its end */
  function finishIntro() {
    if (!intro) { return; }
    intro = null; st.a = AT; answer(); target();
  }
  function showHint(ms) {
    if (!hint) { return; }
    setTimeout(function () { if (!touched) { hint.classList.add('pb-on'); } }, ms);
  }
  function touch() { touched = true; if (hint) { hint.classList.remove('pb-on'); } }

  /* ---------------------------------------------------------- the reader -- */
  var ptr = { in: false, x: -1, y: -1, down: false, sx: 0, sy: 0, scrub: false, moved: false, a0: AT, vx: 0, lx: 0, lt: 0 };
  function local(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function changed(snap) {
    touch(); finishIntro(); back = null;
    if (st.a !== AT) { st.a = AT; }
    panel(); answer(); target(snap); speak();
  }
  age.addEventListener('input', function () { why = ''; changed(); });
  pay.addEventListener('input', function () { why = ''; changed(); });
  if (have) { have.addEventListener('input', function () { why = ''; changed(); }); }
  var segEl = sec.querySelector('.dr-start'), seg = null;
  if (segEl) {
    seg = K.seg(segEl, function (b) {
      st.later = b.getAttribute('data-start') === '1';
      why = st.later ? 'later' : 'back';
      changed();
    });
  }
  if (cx) {
    cv.addEventListener('pointermove', function (e) {
      var p = local(e), t = performance.now() / 1000;
      ptr.x = p.x; ptr.y = p.y; ptr.in = true;
      if (ptr.down && G) {
        var dx = p.x - ptr.sx, dy = p.y - ptr.sy;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) { ptr.moved = true; }
        if (!ptr.scrub && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          /* a sideways drag: the years run under it */
          ptr.scrub = true; touch(); finishIntro(); why = 'scrub';
          try { cv.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
          ptr.a0 = back ? back.x : st.a; back = null; ptr.sx = p.x; dx = 0;
        }
        if (ptr.scrub) {
          var span = Math.max(220, W * 0.8), ag = A(), af = clamp(ptr.a0 + dx / span * (AT - ag), ag, AT), a = Math.round(af);
          ptr.af = af;
          ptr.vx = ptr.vx * 0.5 + 0.5 * (p.x - ptr.lx) / Math.max(0.008, t - ptr.lt);
          if (a !== st.a) { st.a = a; answer(false, true); target(); }
        }
      }
      ptr.lx = p.x; ptr.lt = t;
      kick();
    });
    cv.addEventListener('pointerleave', function () { if (!ptr.down) { ptr.in = false; } kick(); });
    cv.addEventListener('pointerdown', function (e) {
      var p = local(e);
      ptr.down = true; ptr.sx = p.x; ptr.sy = p.y; ptr.moved = false; ptr.scrub = false; ptr.af = undefined; ptr.lx = p.x; ptr.lt = performance.now() / 1000;
      kick();
    });
    var up = function (e, cancel) {
      if (!ptr.down) { return; }
      ptr.down = false;
      if (ptr.scrub) {
        ptr.scrub = false; why = '';
        /* back to 66 on a spring */
        if (K.motion() && st.a !== AT) { back = { x: ptr.af === undefined ? st.a : ptr.af, v: 0 }; }
        else if (st.a !== AT) { st.a = AT; answer(); target(); }
      } else if (!cancel && !ptr.moved && G) { tap(local(e)); }
      ptr.in = e.pointerType === 'mouse';
      kick();
    };
    cv.addEventListener('pointerup', function (e) { up(e, false); });
    cv.addEventListener('pointercancel', function (e) { up(e, true); });
  }
  /* a tap: a wave runs up the tower and rings off the top */
  function tap(p) {
    touch();
    if (!K.motion() || !seen) { return; }
    finishIntro();
    var n = coins.length;
    coins.forEach(function (c, i) { c.wd = 0.001 + i * 0.024; c.wv = -(200 + i * 5); });
    if (fx) {
      fx.ring(p.x, p.y, 'rgba(20,203,177,.75)', 26);
      var topY = n ? slotY(n - 1) - G.ry : G.base;
      setTimeout(function () {
        fx.ring(G.x, topY + G.ry, 'rgba(20,203,177,.8)', G.w * 0.6);
        fx.spark(G.x, topY + G.ry * 0.5, 6, ['#FFFFFF', '#D8DFDE', '#7FE3D3', '#B4BFBC']); kick();
      }, n * 24 + 60);
    }
    T.lean.v += (p.x < G.x ? 1 : -1) * 120;
    kick();
  }

  /* -------------------------------------------------------- housekeeping -- */
  ctl.hidden = false;
  if (seg) { seg.press(function (b) { return b.getAttribute('data-start') === '0'; }, true); }
  panel(true); answer(true);
  if (!cx) { if (stage) { stage.style.display = 'none'; } return; }
  window.addEventListener('resize', function () { W = 0; G = null; kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; G = null; kick(); }); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', function () { if (!K.motion()) { intro = null; back = null; st.a = AT; answer(true); target(true); } kick(); });
  if ('IntersectionObserver' in window) {
    onScreen = false;
    new IntersectionObserver(function (es) { if (es[es.length - 1].isIntersecting) { arm(); } }, { rootMargin: '0px 0px 25% 0px' }).observe($('drRes') || stage);
    /* on screen at all: the loop may run; 35% on screen: the first look */
    new IntersectionObserver(function (es) {
      var e = es[es.length - 1];
      onScreen = e.isIntersecting;
      if (onScreen && !seen && (e.intersectionRatio >= 0.34 || !K.motion())) {
        seen = true;
        if (K.motion() && !touched) { startIntro(); }
        else { target(true); showHint(0); }
      }
      if (onScreen) { kick(); }
    }, { threshold: [0, 0.35] }).observe(stage);
  } else { seen = true; target(true); kick(); }
}());
