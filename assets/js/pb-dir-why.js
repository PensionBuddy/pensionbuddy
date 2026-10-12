/* Why directors leave it (#drWhy) and the executive pension (#drExec),
   11 October 2026, Damian's brief: "super motion design, super simple,
   super interactive; as fluid as the welcome".

   Three small stages, each a picture over words that already say it all.

   The coverage rows. Two rows of ten coins, one coin for one in ten
   people: employees 6.8 coins lit (68%), the self-employed 5.7 (57%). On
   the self-employed's row the 1.1 coins between the two are a coral
   outline: the gap. The percentages are read from the sentence above the
   rows (#drS1, #drS2: Central Statistics Office, Pension Coverage, Quarter
   3 2025), so the picture and the words can never disagree.

   The year-end ring. A year round a clock, January at the top, each month
   an equal twelfth. The ink dot is today, the blue coin is the company's
   year end (31 December unless the reader moves it), and the ink arc
   between them is the time left to pay in this accounting period: company
   payments count in the year they are paid, with no backdating (Revenue
   Pensions Manual, chapters 4 and 24). Days: from today's local midnight to
   the last day of the chosen month, or of the same month next year once
   that day has passed; 81 to 31 December on 11 October 2026. Worked out
   from the reader's own clock each time the page opens.

   The executive-pension row. Fourteen small blue coins, company schemes
   (never silver: they are not anyone's savings); ten roll away and four
   stay. The counts are read from the fine print beside it (the Pensions
   Authority: 141,500 one-member arrangements in January 2023, 40,644 on
   1 September 2026): 14 x 40,644 / 141,500 = 4.0.

   Motion: the first time each is seen (35% on screen), the coins pop in
   left to right on springs that overshoot while the percentages roll up
   from 0, and the coral gap pulses once; the arc draws round from today
   while the days roll up, then the coin lands on the year end with a ring;
   ten of the fourteen roll out to the right with a hop, leaving dashed
   outlines. Then the reader plays. Coins near the pointer lift like piano
   keys and a tap sends a hop wave out from where it landed. The coin on the
   ring drags round and springs to the nearest month end; a tap on a month
   sends it there; dragged back past today it knocks against today's dot,
   then rolls the long way round to next year. The slider under the ring
   (#drYe, unseen) is the same coin for the keyboard and screen readers. A
   tap on the fourteen plays them again. Each stage runs one frame loop,
   only while on screen, and stops once still. With motion off each is
   drawn once, finished.

   12 October 2026: the year-end reminder (#pbyForm, tools/lead-parts/
   yearend.html) sits straight under this section, so the ring hands it the
   reader's month: a settled choice on the ring (a tap, the end of a drag, a
   key) ticks the same month in the form, which draws its own line and asks
   only for the email. Once the reader picks a month in the form, the ring
   leaves it alone. */
(function () {
  'use strict';
  var K = window.PBKit, C = window.PBCoins;
  if (!K || !C) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var TAU = Math.PI * 2, FONT = 'Figtree, system-ui, sans-serif';
  var INK = '#0B1F1C', INK2 = '#54635F', TRACK = '#E7EBE9';
  var GREY = 'rgba(84,99,95,', CORAL = 'rgba(212,87,61,', TEAL = 'rgba(20,203,177,', BLUE = 'rgba(75,97,135,';
  var LIVE = 'IntersectionObserver' in window;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function clock() { return performance.now() / 1000; }
  function dist(a, b) { var x = a.x - b.x, y = a.y - b.y; return Math.sqrt(x * x + y * y); }
  /* a damped spring on o = { x, v } toward t; false once it has landed */
  function spring(o, t, k, c, dt, eps) {
    o.v += (k * (t - o.x) - c * o.v) * dt; o.x += o.v * dt;
    if (Math.abs(o.v) < eps * 6 && Math.abs(t - o.x) < eps) { o.x = t; o.v = 0; return false; }
    return true;
  }
  function S(x) { return { x: x, v: 0 }; }
  /* an empty place: a dashed circle whose dashes close evenly round it */
  function dashed(cx, x, y, r, stroke, fill, off) {
    var n = Math.max(6, Math.round(TAU * r / 6.2)), d = TAU * r / n / 2;
    cx.beginPath(); cx.arc(x, y, r, 0, TAU);
    if (fill) { cx.fillStyle = fill; cx.fill(); }
    cx.setLineDash([d, d]); cx.lineDashOffset = off || 0; cx.lineWidth = 1.3; cx.strokeStyle = stroke; cx.stroke();
    cx.setLineDash([]); cx.lineDashOffset = 0;
  }
  /* a soft shadow on the floor under a coin */
  function shadow(cx, x, y, r, k, flat) {
    if (k <= 0.01) { return; }
    cx.save(); cx.translate(x, y); cx.scale(1, flat || 0.26);
    var g = cx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(11,31,28,' + (0.2 * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(11,31,28,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.restore();
  }
  /* rings that spread from a tap, at the speed of the wave they send */
  function Ripples() { this.p = []; }
  Ripples.prototype.add = function (x, y, o) {
    o = o || {};
    this.p.push({ x: x, y: y, t: 0, r0: o.r0 || 0, v: o.v || 600, life: o.life || 0.55, c: o.c || TEAL, a: o.a || 0.5, w: o.w || 1.6 });
  };
  Ripples.prototype.step = function (dt) { this.p = this.p.filter(function (q) { q.t += dt; return q.t < q.life; }); return this.p.length > 0; };
  Ripples.prototype.draw = function (cx) {
    this.p.forEach(function (q) {
      var k = q.t / q.life;
      cx.beginPath(); cx.arc(q.x, q.y, q.r0 + q.v * q.t, 0, TAU);
      cx.lineWidth = q.w; cx.strokeStyle = q.c + (q.a * (1 - k) * (1 - k)).toFixed(3) + ')'; cx.stroke();
    });
  };
  Ripples.prototype.clear = function () { this.p = []; };

  /* One stage: its canvas sized to its box (the device pixel ratio capped at
     2) on resize and once the font has loaded; one frame loop that runs only
     while the stage is on screen and stops after 0.6s of calm; the first
     look once it is 35% on screen. h: layout(W, H), step(dt) -> moving,
     settle() (the finished state, for motion off), draw(cx), first(). */
  function stage(cv, h) {
    var cx = cv && cv.getContext ? cv.getContext('2d') : null;
    if (!cx) { return null; }
    var st = { W: 0, H: 0, dpr: 1, on: false, seen: false }, raf = 0, last = 0, calm = 0;
    function size() {
      var b = cv.getBoundingClientRect();
      st.W = b.width; st.H = b.height; st.dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(st.W * st.dpr)); cv.height = Math.max(1, Math.round(st.H * st.dpr));
      if (st.W > 0 && st.H > 0) { h.layout(st.W, st.H, cx); }
    }
    function frame(ms) {
      raf = 0;
      var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
      if (!st.W) { size(); }
      if (st.W < 40 || st.H < 30) { return; }
      var moving = false;
      if (K.motion()) { moving = h.step(dt); } else { h.settle(); }
      cx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0); cx.clearRect(0, 0, st.W, st.H);
      h.draw(cx);
      calm = moving ? 0 : calm + dt;
      if (K.motion() && st.on && !document.hidden && calm < 0.6) { raf = requestAnimationFrame(frame); }
    }
    st.kick = function () { calm = 0; if (!raf && st.on && !document.hidden) { last = clock(); raf = requestAnimationFrame(frame); } };
    st.local = function (e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    st.ready = function () { if (!st.W) { size(); } return st.W > 0; };
    function again() { st.W = 0; st.kick(); }
    window.addEventListener('resize', again);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(again); }
    document.addEventListener('visibilitychange', st.kick);
    document.addEventListener('pb:motion', function () { if (!K.motion()) { h.settle(); } st.kick(); });
    if (LIVE) {
      new IntersectionObserver(function (es) {
        var e = es[es.length - 1];
        st.on = e.isIntersecting;
        if (st.on && !st.seen && e.intersectionRatio >= 0.34) {
          st.seen = true; size();
          if (K.motion()) { h.first(); } else { h.settle(); }
        }
        if (st.on) { st.kick(); }
      }, { threshold: [0, 0.35] }).observe(cv);
    } else { st.on = st.seen = true; h.settle(); st.kick(); }
    return st;
  }

  /* ================================================ A. the coverage rows -- */
  (function () {
    var sec = $('drWhy'), cv = sec && sec.querySelector('.drw-rows'), eSe = $('drS1'), eEmp = $('drS2');
    if (!cv || !eSe || !eEmp) { return; }
    function num(t) { var m = /(\d+(?:\.\d+)?)/.exec(t); return m ? +m[1] : NaN; }
    var tSe = eSe.textContent.trim(), tEmp = eEmp.textContent.trim(), vSe = num(tSe) / 10, vEmp = num(tEmp) / 10;
    if (!(vSe >= 0 && vSe <= 10 && vEmp >= 0 && vEmp <= 10)) { return; }
    var rows = [{ label: 'Employees', v: vEmp, c: [] }, { label: 'Self-employed', v: vSe, gap: vEmp > vSe ? vEmp : 0, c: [] }];
    rows.forEach(function (row) { for (var i = 0; i < 10; i++) { row.c.push({ sp: S(1), li: S(0), d: 0, h: 0, vh: 0, hd: -1, hv: 0 }); } });
    function lit(row, i) { return clamp(row.v - i, 0, 1); }
    function gapOf(row, i) { if (!row.gap) { return null; } var a = clamp(row.v - i, 0, 1), b = clamp(row.gap - i, 0, 1); return b > a ? [a, b] : null; }

    /* the figures roll up from 0 as the sentence comes into view; screen
       readers hear the real figure all along */
    var rSe = new K.Roll(eSe), rEmp = new K.Roll(eEmp), rolled = true;
    function zero(t) { return t.replace(/\d+(?:\.\d+)?/, '0'); }
    function roll() { if (rolled) { return; } rolled = true; var q = !K.motion(); rSe.set(tSe, q); rEmp.set(tEmp, q); }
    var G = null, ptr = { in: false, x: 0, y: 0 }, press = null, rip = new Ripples(), gapA = 1, pulse = -1, pulseAt = -1, intro = null;

    function layout(W, H, cx) {
      var g = { wide: W >= 430, fs: W >= 430 ? 13.5 : 12.5 }, r, p;
      cx.font = '600 ' + g.fs + 'px ' + FONT;
      var lw = Math.ceil(Math.max(cx.measureText(rows[0].label).width, cx.measureText(rows[1].label).width));
      if (H >= 230 && W >= 430) {
        /* a tall stage: each label over its row, bigger coins across the width */
        g.wide = false; g.fs = 14;
        r = Math.min(20, (W - 60) / 10 / 2.36); p = r * 2.36;
        g.x0 = (W - 9 * p) / 2; g.lx = g.x0 - r;
        var tt = (H - (2 * (g.fs + 10 + 2 * r) + 34)) / 2;
        g.y = [tt + g.fs + 10 + r, tt + 2 * (g.fs + 10) + 3 * r + 34];
      } else if (g.wide) {
        /* the labels in a column at the left, the coins beside them, the whole centred */
        r = clamp((W - lw - 26 - 80) / 23.3, 11, 15); p = r * 2.36;
        g.lx = Math.round((W - (lw + 26 + 9 * p + 2 * r)) / 2); g.x0 = g.lx + lw + 26 + r;
        g.y = [H / 2 - r - 11, H / 2 + r + 11];
      } else {
        /* a phone: each label sits over its row, the coins take the width */
        p = Math.min(34, (W - 36) / 10); r = Math.min(14, p / 2.3);
        g.x0 = (W - 9 * p) / 2; g.lx = g.x0 - r;
        var top = (H - (2 * (g.fs + 8 + 2 * r) + 18)) / 2;
        g.y = [top + g.fs + 8 + r, top + 2 * (g.fs + 8) + 3 * r + 18];
      }
      g.r = r; g.p = p;
      /* the middle of the gap, where its pulse starts */
      var a = Math.floor(vSe), b = Math.max(a, Math.ceil(vEmp) - 1);
      g.gx = g.x0 + (a + b) / 2 * p;
      G = g;
    }
    function pre() { rows.forEach(function (row) { row.c.forEach(function (c) { c.sp.x = 0; c.sp.v = 0; }); }); gapA = 0; }
    function first() {
      roll();
      var lastPop = 0;
      rows.forEach(function (row, ri) {
        row.c.forEach(function (c, i) { c.sp.x = 0; c.sp.v = 0; c.d = 0.12 + 0.06 * i + 0.05 * ri; if (lit(row, i) > 0) { lastPop = Math.max(lastPop, c.d); } });
      });
      gapA = 0; intro = { t: 0, gap: lastPop + 0.3 };
    }
    function finish() {
      if (!intro) { return; }
      intro = null; gapA = 1; pulseAt = -1;
      rows.forEach(function (row) { row.c.forEach(function (c) { if (c.sp.x < 1) { c.sp.x = 1; c.sp.v = 0; } }); });
    }
    function settle() {
      roll(); finish(); pulse = -1; pulseAt = -1; gapA = 1; rip.clear();
      rows.forEach(function (row) { row.c.forEach(function (c) { c.sp.x = 1; c.sp.v = 0; c.li.x = 0; c.li.v = 0; c.h = 0; c.vh = 0; c.hd = -1; }); });
    }
    function step(dt) {
      var moving = false, g = G, sg = g.p * 0.8;
      if (intro) {
        intro.t += dt; moving = true;
        if (intro.t >= intro.gap) { gapA = Math.min(1, gapA + dt * 3.5); if (!intro.pulsed) { intro.pulsed = true; pulseAt = 0.15; } }
        if (intro.t > intro.gap + 1.2) { intro = null; }
      }
      if (pulseAt >= 0) { pulseAt -= dt; if (pulseAt < 0) { pulse = 0; } moving = true; }
      if (pulse >= 0) { pulse += dt; if (pulse > 0.8) { pulse = -1; } moving = true; }
      rows.forEach(function (row, ri) {
        var y = g.y[ri];
        row.c.forEach(function (c, i) {
          var x = g.x0 + i * g.p, on = lit(row, i) > 0;
          if (intro && intro.t < c.d) { moving = true; } else if (spring(c.sp, 1, 340, 12.5, dt, 0.002)) { moving = true; }
          /* piano keys: the coins nearest the pointer lift, up to 4px */
          var lt = 0;
          if (ptr.in && on) { var dx = ptr.x - x, dy = (ptr.y - y) * 1.25; lt = 4 * Math.exp(-(dx * dx + dy * dy) / (2 * sg * sg)); }
          if (spring(c.li, lt, 260, 17, dt, 0.02)) { moving = true; }
          if (c.hd >= 0) { c.hd -= dt; if (c.hd < 0) { c.vh = -c.hv; } moving = true; }
          if (c.vh || c.h) {
            c.vh += 2400 * dt; c.h += c.vh * dt;
            if (c.h > 0) { c.h = 0; c.vh = Math.abs(c.vh) > 110 ? -c.vh * 0.22 : 0; }
            moving = true;
          }
        });
      });
      if (rip.step(dt)) { moving = true; }
      return moving;
    }
    /* a tap: a ring spreads from it at 600px a second, and each coin hops as it passes */
    function wave(p) {
      var g = G, top = Math.sqrt(2400 * g.r);
      rip.add(p.x, p.y, { v: 600, life: 0.6, a: 0.45 });
      rows.forEach(function (row, ri) {
        row.c.forEach(function (c, i) {
          if (lit(row, i) <= 0) { return; }
          var d = dist(p, { x: g.x0 + i * g.p, y: g.y[ri] });
          c.hd = d / 600; c.hv = top - Math.min(70, d * 0.12);
        });
      });
      if (rows[1].gap) { pulseAt = dist(p, { x: g.gx, y: g.y[1] }) / 600; }
    }
    /* a strip of a coin's width, from fraction a to fraction b of it */
    function band(cx, x, y, r, a, b) {
      var L = a <= 0 ? x - r - 8 : x - r + 2 * r * a, R = b >= 1 ? x + r + 8 : x - r + 2 * r * b;
      cx.rect(L, y - r - 40, R - L, 2 * r + 80);
    }
    function draw(cx) {
      var g = G; if (!g) { return; }
      var r = g.r, pb = pulse >= 0 ? Math.sin(Math.PI * clamp(pulse / 0.8, 0, 1)) : 0;
      cx.font = '600 ' + g.fs + 'px ' + FONT; cx.fillStyle = INK2; cx.textAlign = 'left';
      rows.forEach(function (row, ri) {
        var y = g.y[ri];
        if (g.wide) { cx.textBaseline = 'middle'; cx.fillText(row.label, g.lx, y + 0.5); }
        else { cx.textBaseline = 'alphabetic'; cx.fillText(row.label, g.lx, y - r - (g.fs > 13 ? 10 : 8)); }
        for (var i = 0; i < 10; i++) {
          var c = row.c[i], x = g.x0 + i * g.p, f = lit(row, i), gp = gapOf(row, i), g0 = gp ? gp[1] : f;
          /* the empty place, grey: where no coin is and the gap is not. Under
             a coin only while it pops in, so a coin that lifts or hops leaves
             its floor clean, not a second dashed rim */
          if (g0 < 1) {
            cx.save();
            if (g0 > 0) { cx.beginPath(); band(cx, x, y, r, g0, 1); cx.clip(); }
            dashed(cx, x, y, r - 0.7, GREY + '.4)', GREY + '.04)');
            cx.restore();
          }
          if (f > 0 && c.sp.x < 1) {
            cx.save(); cx.globalAlpha = 1 - clamp(c.sp.x, 0, 1);
            if (f < 1) { cx.beginPath(); band(cx, x, y, r, 0, f); cx.clip(); }
            dashed(cx, x, y, r - 0.7, GREY + '.4)', GREY + '.04)');
            cx.restore();
          }
          /* the gap: coral, a faint fill; it swells once as it pulses (grey until it arrives) */
          if (gp && gapA < 1) {
            cx.save(); cx.globalAlpha = 1 - gapA;
            cx.beginPath(); band(cx, x, y, r, gp[0], gp[1]); cx.clip();
            dashed(cx, x, y, r - 0.7, GREY + '.4)', GREY + '.04)');
            cx.restore();
          }
          if (gp && gapA > 0) {
            var sc = 1 + 0.12 * pb;
            cx.save(); cx.globalAlpha = gapA;
            cx.translate(x, y); cx.scale(sc, sc); cx.translate(-x, -y);
            cx.beginPath(); band(cx, x, y, r, gp[0], gp[1]); cx.clip();
            dashed(cx, x, y, r - 0.7, CORAL + (0.75 + 0.25 * pb).toFixed(3) + ')', CORAL + (0.12 + 0.13 * pb).toFixed(3) + ')', pulse >= 0 ? -pulse * 14 : 0);
            cx.restore();
          }
          /* the coin, lit as far as the figure goes */
          if (f > 0 && c.sp.x > 0.02) {
            var s = c.sp.x, rs = r * s, yy = y - c.li.x + c.h;
            cx.save();
            if (f < 1) { cx.beginPath(); band(cx, x, y, rs, 0, f); cx.clip(); }
            shadow(cx, x, y + r * 0.96, r * 0.92, Math.min(1, s) * (1 - clamp((y - yy) / 16, 0, 0.75)));
            C.face(cx, x, yy, rs, 'silver');
            cx.restore();
          }
        }
      });
      rip.draw(cx);
    }

    var st = stage(cv, { layout: layout, step: step, settle: settle, draw: draw, first: first });
    if (!st) { return; }
    if (K.motion() && LIVE) {
      rolled = false; pre();
      rSe.set(zero(tSe), true); rEmp.set(zero(tEmp), true); rSe.sr.textContent = tSe; rEmp.sr.textContent = tEmp;
      var stat = eSe.closest ? eSe.closest('.dr-stat') : null;
      if (stat) {
        new IntersectionObserver(function (es, o) {
          var e = es[es.length - 1];
          if (e.isIntersecting && e.intersectionRatio >= 0.95) { roll(); o.disconnect(); }
        }, { threshold: [0, 0.95, 1] }).observe(stat);
      }
      /* printed before it was ever seen: the figures, not 0% */
      window.addEventListener('beforeprint', function () { if (!rolled) { rolled = true; rSe.set(tSe, true); rEmp.set(tEmp, true); } });
    }
    cv.addEventListener('pointermove', function (e) {
      var p = st.local(e);
      ptr.x = p.x; ptr.y = p.y; ptr.in = e.pointerType === 'mouse' || !!press;
      if (press && (Math.abs(p.x - press.x) > 6 || Math.abs(p.y - press.y) > 6)) { press.moved = true; }
      st.kick();
    });
    cv.addEventListener('pointerleave', function () { ptr.in = false; st.kick(); });
    cv.addEventListener('pointerdown', function (e) { var p = st.local(e); press = { x: p.x, y: p.y, moved: false }; finish(); st.kick(); });
    cv.addEventListener('pointerup', function (e) {
      if (press && !press.moved && G && K.motion()) { wave(st.local(e)); }
      press = null; if (e.pointerType !== 'mouse') { ptr.in = false; }
      st.kick();
    });
    cv.addEventListener('pointercancel', function () { press = null; ptr.in = false; st.kick(); });
  }());

  /* ================================================== B. the year-end ring -- */
  (function () {
    var sec = $('drWhy'), cv = sec && sec.querySelector('.drw-ring'), rng = $('drYe');
    if (!cv || !rng) { return; }
    var dEl = $('drYeDays'), onEl = $('drYeOn'), nxEl = $('drYeNext'), hint = $('drYeHint');
    var NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var now0 = new Date(), today = new Date(now0.getFullYear(), now0.getMonth(), now0.getDate()), Y = today.getFullYear();
    /* where a day sits round the ring, in months from 1 January; a month's
       end is the whole number after it (31 December is 12) */
    var qT = today.getMonth() + (today.getDate() - 1) / new Date(Y, today.getMonth() + 1, 0).getDate();
    /* the chosen month's last day, this year, or next year once it has passed */
    function end(m) {
      var d = new Date(Y, m, 0), next = d < today;
      if (next) { d = new Date(Y + 1, m, 0); }
      return { d: d, next: next, days: Math.round((d - today) / 864e5), q: m + (next ? 12 : 0) };
    }
    function nearest(q) { var best = 12, bd = 1e9; for (var m = 1; m <= 12; m++) { var dd = Math.abs(end(m).q - q); if (dd < bd) { bd = dd; best = m; } } return best; }
    function inYear(q) { while (q < qT) { q += 12; } while (q > qT + 12) { q -= 12; } return q; }
    var sel = clamp(Math.round(+rng.value) || 12, 1, 12);
    var rDays = dEl ? new K.Roll(dEl) : null, zeroed = false, touched = false;

    function words(quiet) {
      var e = end(sel), n = e.days;
      zeroed = false;
      if (rDays) { rDays.set(String(n), quiet || !K.motion()); }
      if (onEl) { onEl.textContent = e.d.getDate() + ' ' + NAMES[sel - 1]; }
      if (nxEl) {
        var was = nxEl.hidden; nxEl.hidden = !e.next;
        if (was && e.next && !quiet && K.motion() && nxEl.animate) {
          nxEl.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.3,1.7,.5,1)' });
        }
      }
      if (+rng.value !== sel) { rng.value = sel; }
      rng.setAttribute('aria-valuetext', NAMES[sel - 1] + (e.next ? ' next year' : '') + ', ' + n + (n === 1 ? ' day' : ' days'));
    }
    function touch() { touched = true; if (hint) { hint.classList.remove('pb-on'); } }
    /* the month, handed to the reminder below; a pause first, so a run of
       arrow keys hands over once */
    var remind = $('pbyForm'), own = false, handT = 0;
    if (remind) { remind.addEventListener('change', function (e) { if (e.isTrusted && e.target.name === 'year_end') { own = true; } }); }
    function handoff() {
      if (!remind || own) { return; }
      clearTimeout(handT);
      handT = setTimeout(function () {
        var r = remind.querySelector('input[name="year_end"][value="' + NAMES[sel - 1] + '"]');
        if (!r || r.checked || own) { return; }
        r.checked = true;
        r.dispatchEvent(new Event('change', { bubbles: true }));
      }, 400);
    }
    function offer() { if (hint) { setTimeout(function () { if (!touched) { hint.classList.add('pb-on'); } }, K.motion() ? 450 : 0); } }

    /* the coin: kq is where it is round the ring (in months), kt where it is
       going; each way of moving has its own spring */
    var MODE = { drag: [900, 55], snap: [300, 21], send: [130, 18], roll: [44, 12.5] };
    var G = null, kq = S(end(sel).q), kt = kq.x, mode = 'snap', kS = S(1), kA = 1, kn = S(0), dotS = S(1);
    var arcEnd = kq.x, intro = null, knockT = 0, drag = null, press = null, ptr = { in: false, x: 0, y: 0 }, rip = new Ripples();
    var lets = []; for (var i = 0; i < 12; i++) { lets.push({ z: S(1), h: S(0), hd: -1 }); }

    function layout(W, H) {
      /* the hint sits over the top of the ring, the letters round the outside of the track */
      var L = Math.min((H / 2 - 41) / 0.966, W / 2 - 22), R = L - 17;
      G = { x: W / 2, y: H / 2, L: L, R: R, kr: R >= 90 ? 16 : 14, tw: R >= 90 ? 10 : 9, fs: R >= 90 ? 12 : 11 };
    }
    function ang(q) { return q / 12 * TAU; }
    function at(q, r) { var a = ang(q); return { x: G.x + Math.sin(a) * r, y: G.y - Math.cos(a) * r }; }
    function knob() { var p = at(kq.x, G.R), a = ang(kq.x); return { x: p.x + Math.cos(a) * kn.x, y: p.y + Math.sin(a) * kn.x }; }
    function onKnob(p) { return G && dist(p, knob()) <= 24; }
    function rad(p) { return dist(p, G); }
    function qAt(p) { var a = Math.atan2(p.x - G.x, G.y - p.y); if (a < 0) { a += TAU; } return a / TAU * 12; }
    function letterAt(p) { for (var m = 1; m <= 12; m++) { if (dist(p, at(m - 0.5, G.L)) < 17) { return m; } } return 0; }
    function onBand(p) { var d = rad(p); return d > G.R - 22 && d < G.L + 14; }
    function focused() { try { return rng.matches(':focus-visible'); } catch (e) { return document.activeElement === rng; } }

    /* how near the coin may come to today's dot, in months */
    function gap() { return (G.kr + 9) / G.R / TAU * 12; }
    /* the dot is a wall: a coin whose year end is right by today rests
       against it, not on it, and the arc still ends at the year end itself */
    function wall(q) { return clamp(q, qT + gap(), qT + 12 - gap()); }
    /* dragged back past today, the coin knocks against the dot and then
       rolls the long way round, to the same month next year (and forward
       past today, back again the other way) */
    function knock(dir) {
      if (!K.motion()) { return; }
      var gq = gap();
      kt = dir > 0 ? qT + gq : qT + 12 - gq; mode = 'drag'; knockT = 0.22;
      kn.v = dir * 190; dotS.v = 7;
      var d = at(qT, G.R); rip.add(d.x, d.y, { r0: 8, v: 60, life: 0.45, c: 'rgba(11,31,28,', a: 0.4, w: 1.4 });
    }
    function dragTo(p, fresh) {
      if (rad(p) < 14) { return; }
      var qp = qAt(p), q;
      if (fresh) { q = inYear(qp); }
      else {
        q = qp + 12 * Math.round((drag.q - qp) / 12);
        if (q < qT) { q += 12; knock(1); } else if (q > qT + 12) { q -= 12; knock(-1); }
      }
      drag.q = q;
      var m = nearest(q);
      if (m !== sel) { sel = m; words(); }
      if (knockT <= 0) { kt = q; }
    }
    function tap(p) {
      rip.add(p.x, p.y, { v: 600, life: 0.5, a: 0.4 });
      lets.forEach(function (l, i) { l.hd = dist(p, at(i + 0.5, G.L)) / 600; });
      var m = letterAt(p);
      if (!m && onBand(p)) { m = nearest(inYear(qAt(p))); }
      if (m) { touch(); sel = m; kt = end(m).q; mode = 'send'; words(); handoff(); }
    }

    function first() {
      intro = { t: -0.15, dur: 0.9 };
      kt = end(sel).q; kq.x = wall(kt); arcEnd = qT; kA = 0;
      if (rDays) { rDays.set('0', true); zeroed = true; }
    }
    function finish() {
      if (!intro) { return; }
      intro = null; kA = 1; kS.x = 1; kS.v = 0; arcEnd = kq.x + kt - wall(kt); words(true); offer();
    }
    function settle() {
      finish();
      if (zeroed) { words(true); }
      knockT = 0; kt = drag ? drag.q : end(sel).q; mode = 'snap';
      kq.x = wall(kt); kq.v = 0; arcEnd = kt; kA = 1; kS.x = drag ? 1.12 : 1; kS.v = 0; kn.x = kn.v = 0; dotS.x = 1; dotS.v = 0;
      lets.forEach(function (l) { l.z.x = 1; l.z.v = 0; l.h.x = 0; l.h.v = 0; l.hd = -1; });
      rip.clear();
      if (st && st.seen && !intro) { offer(); }
    }
    function step(dt) {
      var moving = false;
      if (knockT > 0) { knockT -= dt; moving = true; if (knockT <= 0) { knockT = 0; mode = 'roll'; kt = drag ? drag.q : end(sel).q; } }
      var kk = MODE[mode];
      if (spring(kq, wall(kt), kk[0], kk[1], dt, 0.0015)) { moving = true; }
      if (mode === 'roll' && Math.abs(kq.x - kt) < 0.3) { mode = drag ? 'drag' : 'snap'; }
      if (spring(kn, 0, 520, 15, dt, 0.05)) { moving = true; }
      if (spring(dotS, 1, 420, 13, dt, 0.002)) { moving = true; }
      if (intro) {
        intro.t += dt; moving = true;
        var k = clamp(intro.t / intro.dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
        if (intro.t >= 0 && !intro.rolled) { intro.rolled = true; words(); }
        arcEnd = qT + (kt - qT) * e;
        if (k >= 1 && !intro.landed) { intro.landed = true; kS.x = 1.6; kS.v = 0; }
        if (intro.landed) {
          /* solid within a few frames: a coin that drops in, not a ghost over the arc */
          kA = Math.min(1, kA + dt * 16);
          if (!intro.rang && kS.x < 1.06) { intro.rang = true; var kp = knob(); rip.add(kp.x, kp.y, { r0: G.kr, v: 90, life: 0.55, a: 0.7, w: 2 }); }
          if (intro.rang && intro.t > intro.dur + 0.75) { intro = null; offer(); }
        }
      } else { arcEnd = kq.x + kt - wall(kt); }
      var ht = drag ? 1.12 : (ptr.in && onKnob(ptr)) ? 1.07 : 1;
      if (spring(kS, intro && !intro.landed ? kS.x : ht, intro ? 260 : 320, intro ? 15 : 18, dt, 0.002)) { moving = true; }
      /* the letters swell near the pointer and hop outwards as a tap's ring passes */
      lets.forEach(function (l, i) {
        var zt = 1;
        if (ptr.in && !drag) { var c = at(i + 0.5, G.L), dx = ptr.x - c.x, dy = ptr.y - c.y; zt = 1 + 0.42 * Math.exp(-(dx * dx + dy * dy) / 800); }
        if (spring(l.z, zt, 300, 20, dt, 0.002)) { moving = true; }
        if (l.hd >= 0) { l.hd -= dt; if (l.hd < 0) { l.h.v = 80; } moving = true; }
        if (spring(l.h, 0, 260, 11, dt, 0.02)) { moving = true; }
      });
      if (rip.step(dt)) { moving = true; }
      return moving;
    }
    function draw(cx) {
      var g = G; if (!g) { return; }
      var R = g.R, m;
      cx.lineCap = 'butt';
      cx.lineWidth = g.tw; cx.strokeStyle = TRACK; cx.beginPath(); cx.arc(g.x, g.y, R, 0, TAU); cx.stroke();
      /* the time left: ink, from today round to the year end */
      var ae = clamp(arcEnd, qT, qT + 12);
      if (ae - qT > 0.003) { cx.strokeStyle = INK; cx.beginPath(); cx.arc(g.x, g.y, R, ang(qT) - Math.PI / 2, ang(ae) - Math.PI / 2); cx.stroke(); }
      /* the month ends: thin cuts across the track */
      cx.lineWidth = 2; cx.strokeStyle = '#fff';
      for (m = 0; m < 12; m++) { var p0 = at(m, R - g.tw / 2 - 1), p1 = at(m, R + g.tw / 2 + 1); cx.beginPath(); cx.moveTo(p0.x, p0.y); cx.lineTo(p1.x, p1.y); cx.stroke(); }
      /* the months: the chosen one in ink, those already gone this year lighter */
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      lets.forEach(function (l, i) {
        var mm = i + 1, c = at(i + 0.5, g.L + l.h.x), on = mm === sel;
        cx.save(); cx.translate(c.x, c.y); if (l.z.x !== 1) { cx.scale(l.z.x, l.z.x); }
        cx.font = (on ? '800 ' : '600 ') + g.fs + 'px ' + FONT;
        cx.fillStyle = on ? INK : end(mm).next ? 'rgba(84,99,95,.55)' : INK2;
        cx.fillText('JFMAMJJASOND'.charAt(i), 0, 0.5);
        cx.restore();
      });
      /* today */
      var d = at(qT, R), ds = dotS.x;
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(d.x, d.y, 8 * ds, 0, TAU); cx.fill();
      cx.fillStyle = INK; cx.beginPath(); cx.arc(d.x, d.y, 5 * ds, 0, TAU); cx.fill();
      /* the coin, rolling: one turn a month, so it rests upright on every month end */
      if (kA > 0.01) {
        var k = knob(), s = kS.x, rr = g.kr * s;
        /* its shadow: darker as it is picked up; as it drops in from above,
           faint and wide at first, tightening as it lands */
        var up = Math.max(0, s - 1), sk = up <= 0.12 ? 0.9 + up * 2 : 1.14 * (1 - clamp((up - 0.12) / 0.5, 0, 0.75));
        shadow(cx, k.x + 1, k.y + rr * 0.55 + up * 14, rr * (1.15 + up * 0.4), kA * sk, 0.5);
        C.face(cx, k.x, k.y, rr, 'blue', (kq.x - Math.round(kq.x)) * TAU, kA);
        if (focused()) { cx.lineWidth = 3; cx.strokeStyle = '#14CBB1'; cx.beginPath(); cx.arc(k.x, k.y, rr + 5, 0, TAU); cx.stroke(); }
      }
      rip.draw(cx);
    }

    var st = stage(cv, { layout: layout, step: step, settle: settle, draw: draw, first: first });
    if (!st) { return; }
    words(true);
    if (K.motion() && LIVE) { kA = 0; arcEnd = qT; if (rDays) { rDays.set('0', true); zeroed = true; } }
    rng.hidden = false;

    /* only the coin's own 48px stops the page scrolling under a finger */
    cv.addEventListener('touchstart', function (e) {
      if (!G || e.touches.length !== 1) { return; }
      if (onKnob(st.local(e.touches[0]))) { e.preventDefault(); }
    }, { passive: false });
    cv.addEventListener('pointerdown', function (e) {
      if (!st.ready() || (e.pointerType === 'mouse' && e.button !== 0)) { return; }
      var p = st.local(e), onK = onKnob(p);
      finish();
      if (onK || (e.pointerType === 'mouse' && e.button === 0 && onBand(p) && !letterAt(p))) {
        drag = { q: kq.x };
        cv.style.touchAction = 'none'; cv.style.cursor = 'grabbing';
        try { cv.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
        mode = 'drag'; touch();
        if (!onK) { dragTo(p, true); }
        st.kick(); return;
      }
      press = { x: p.x, y: p.y, moved: false };
    });
    cv.addEventListener('pointermove', function (e) {
      var p = st.local(e);
      ptr.x = p.x; ptr.y = p.y; ptr.in = e.pointerType === 'mouse';
      if (drag) { dragTo(p, false); }
      else {
        if (press && (Math.abs(p.x - press.x) > 6 || Math.abs(p.y - press.y) > 6)) { press.moved = true; }
        if (e.pointerType === 'mouse') { cv.style.cursor = onKnob(p) ? 'grab' : ''; }
      }
      st.kick();
    });
    cv.addEventListener('pointerleave', function () { ptr.in = false; st.kick(); });
    function up(e, cancel) {
      if (drag) {
        drag = null; knockT = 0; cv.style.touchAction = ''; cv.style.cursor = '';
        kt = end(sel).q; mode = Math.abs(kq.x - kt) > 1.5 ? 'roll' : 'snap';
        words(); st.kick(); if (!cancel) { handoff(); } return;
      }
      if (press && !press.moved && !cancel && G) { tap(st.local(e)); }
      press = null; st.kick();
    }
    cv.addEventListener('pointerup', function (e) { up(e, false); });
    cv.addEventListener('pointercancel', function (e) { up(e, true); });
    cv.addEventListener('lostpointercapture', function (e) { if (drag) { up(e, true); } });
    rng.addEventListener('input', function () {
      sel = clamp(Math.round(+rng.value) || 12, 1, 12); finish();
      kt = end(sel).q; mode = 'send'; touch(); words(); st.kick(); handoff();
    });
    rng.addEventListener('focus', st.kick);
    rng.addEventListener('blur', st.kick);
  }());

  /* ======================================= C. the executive-pension row -- */
  (function () {
    var sec = $('drExec'), cv = sec && sec.querySelector('.dre-cv');
    if (!cv) { return; }
    var N = 14, keep = 4, src = sec.querySelector('.pb-src');
    var ns = src ? (src.textContent.match(/\d{1,3}(?:,\d{3})+/g) || []).map(function (s) { return +s.replace(/,/g, ''); }) : [];
    if (ns.length >= 2 && ns[0] > 0) { keep = clamp(Math.round(N * ns[1] / ns[0]), 1, N - 1); }
    var LEAVE = 0.8, BACK = 0.7;
    var coins = [];
    for (var i = 0; i < N; i++) { coins.push({ st: i < keep ? 'home' : 'gone', t: 0, d: 0, o: S(0), h: 0, vh: 0, hd: -1 }); }
    var G = null, ptr = { in: false, x: 0, y: 0 }, press = null, rip = new Ripples(), cue = -1;

    function layout(W, H) {
      var p = Math.min(26, (W - 24) / N);
      G = { p: p, r: p * 0.44, x0: (W - (N - 1) * p) / 2, y: H / 2 + 1, W: W };
    }
    /* ten roll out to the right, the last first, each with a hop */
    function leave(t0) {
      var lastD = 0;
      coins.forEach(function (c, j) { if (j >= keep) { c.st = 'leave'; c.t = 0; c.d = t0 + (N - 1 - j) * 0.075; lastD = Math.max(lastD, c.d); } });
      /* then the four that stay give a small hop, left to right */
      coins.forEach(function (c, j) { if (j < keep) { c.hd = lastD + LEAVE + 0.1 + j * 0.07; c.hv = 120; } });
    }
    function first() { leave(0.3); }
    function settle() {
      cue = -1; rip.clear();
      coins.forEach(function (c, j) { c.st = j < keep ? 'home' : 'gone'; c.t = 0; c.d = 0; c.o.x = c.o.v = 0; c.h = 0; c.vh = 0; c.hd = -1; });
    }
    function busy() { return cue >= 0 || coins.some(function (c) { return c.st === 'leave' || c.st === 'back'; }); }
    function step(dt) {
      var moving = false, g = G;
      if (cue >= 0) { cue -= dt; moving = true; if (cue < 0) { cue = -1; leave(0); } }
      coins.forEach(function (c, j) {
        var x = g.x0 + j * g.p;
        if (c.st === 'leave' || c.st === 'back') {
          moving = true;
          if (c.d > 0) { c.d -= dt; } else {
            c.t += dt;
            if (c.st === 'leave' && c.t >= LEAVE) { c.st = 'gone'; }
            if (c.st === 'back' && c.t >= BACK) { c.st = 'home'; c.vh = -90; }
          }
        }
        /* the coins at home part round the pointer */
        var ot = 0;
        if (ptr.in && c.st === 'home') { var dx = x - ptr.x; ot = (dx >= 0 ? 1 : -1) * 4 * Math.exp(-dx * dx / (2 * g.p * g.p * 1.2)) * (Math.abs(ptr.y - g.y) < 40 ? 1 : 0); }
        if (spring(c.o, ot, 280, 17, dt, 0.02)) { moving = true; }
        if (c.hd >= 0) { c.hd -= dt; if (c.hd < 0) { c.vh = -(c.hv || 150); } moving = true; }
        if (c.vh || c.h) { c.vh += 2200 * dt; c.h += c.vh * dt; if (c.h > 0) { c.h = 0; c.vh = Math.abs(c.vh) > 90 ? -c.vh * 0.2 : 0; } moving = true; }
      });
      if (rip.step(dt)) { moving = true; }
      return moving;
    }
    /* where a coin is: its offset from home, its hop, its turn, its opacity */
    function pose(c, j) {
      var g = G, x = g.x0 + j * g.p, far = g.W - x + g.r * 2 + 8, dx = 0, dy = 0, u;
      if (c.st === 'gone') { return null; }
      if (c.st === 'leave' && c.d <= 0) {
        u = clamp(c.t / LEAVE, 0, 1); dx = far * Math.pow(u, 2.1);
        dy = -10 * Math.sin(Math.PI * clamp(c.t / 0.34, 0, 1));
      } else if (c.st === 'back') {
        u = c.d > 0 ? 0 : clamp(c.t / BACK, 0, 1); dx = far * Math.pow(1 - u, 3);
      }
      var px = x + dx + c.o.x;
      return { x: px, y: g.y + dy + c.h, a: (dx) / g.r, al: clamp((g.W - px + g.r) / (g.r * 3), 0, 1), dx: dx };
    }
    function outline(c) {
      if (c.st === 'gone') { return 1; }
      if (c.st === 'leave') { return c.d > 0 ? 0 : clamp(c.t / 0.3, 0, 1); }
      if (c.st === 'back') { return c.d > 0 ? 1 : 1 - clamp((c.t / BACK - 0.7) / 0.3, 0, 1); }
      return 0;
    }
    function draw(cx) {
      var g = G; if (!g) { return; }
      coins.forEach(function (c, j) {
        var a = outline(c);
        if (a > 0.01) { dashed(cx, g.x0 + j * g.p, g.y, g.r - 0.6, BLUE + (0.5 * a).toFixed(3) + ')', BLUE + (0.05 * a).toFixed(3) + ')'); }
      });
      coins.forEach(function (c, j) {
        var q = pose(c, j);
        if (!q || q.al <= 0.01) { return; }
        shadow(cx, q.x, g.y + g.r * 0.96, g.r * 0.95, q.al * (1 - clamp((g.y - q.y) / 14, 0, 0.7)) * (1 - clamp(q.dx / 30, 0, 0.6)));
        C.face(cx, q.x, q.y, g.r, 'blue', q.a, q.al);
      });
      rip.draw(cx);
    }

    var st = stage(cv, { layout: layout, step: step, settle: settle, draw: draw, first: first });
    if (!st) { return; }
    if (K.motion() && LIVE) { coins.forEach(function (c) { c.st = 'home'; }); }
    /* a tap: they roll back in, wait, and go again */
    function replay(p) {
      rip.add(p.x, p.y, { r0: 4, v: 160, life: 0.4, c: BLUE, a: 0.45 });
      if (busy()) { return; }
      var lastD = 0;
      coins.forEach(function (c, j) { if (j >= keep) { c.st = 'back'; c.t = 0; c.d = (j - keep) * 0.05; lastD = c.d; } });
      cue = lastD + BACK + 0.5;
    }
    cv.addEventListener('pointermove', function (e) {
      var p = st.local(e);
      ptr.x = p.x; ptr.y = p.y; ptr.in = e.pointerType === 'mouse' || !!press;
      if (press && (Math.abs(p.x - press.x) > 6 || Math.abs(p.y - press.y) > 6)) { press.moved = true; }
      st.kick();
    });
    cv.addEventListener('pointerleave', function () { ptr.in = false; st.kick(); });
    cv.addEventListener('pointerdown', function (e) { var p = st.local(e); press = { x: p.x, y: p.y, moved: false }; });
    cv.addEventListener('pointerup', function (e) {
      if (press && !press.moved && G && K.motion() && st.seen) { replay(st.local(e)); }
      press = null; if (e.pointerType !== 'mouse') { ptr.in = false; }
      st.kick();
    });
    cv.addEventListener('pointercancel', function () { press = null; ptr.in = false; st.kick(); });
  }());
}());
