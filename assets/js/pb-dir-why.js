/* Why directors leave it (#drWhy: the order and the year-end ring) and the
   executive pension (#drExec),
   11 October 2026, Damian's brief: "super motion design, super simple,
   super interactive; as fluid as the welcome".

   Each a picture over words that already say it all. (13 October 2026:
   the coverage rows went, the Central Statistics Office's self-employed
   against employees; "not a figure for company directors", so a third
   idea in a section that must explain one.)

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

   Motion: the first time each is seen (35% on screen), the arc draws round
   from today while the days roll up, then the coin lands on the year end
   with a ring; ten of the fourteen roll out to the right with a hop,
   leaving dashed outlines. Then the reader plays. The coin on the
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
   leaves it alone.

   13 October 2026 (Damian: "I don't know what it means", of "The company
   comes first. The pension comes last."): the section now opens on the
   order itself (#drQ), "Everyone gets paid before your pension." Four rows,
   who the company pays and in what order: the business, the staff, the
   bills, your pension. Two radios hold the order (#drQLast, #drQFirst) and
   the page's CSS draws it, so it reads and works without JavaScript; this
   file only moves it. The first look: the rows rise in as the list comes
   on screen, so the card is never empty in view; the company pays the
   business, the staff and the bills a blue coin each, in turn, and comes
   to the pension with nothing: its empty place shakes and "Nothing left"
   appears. A pause, then the order turns round. Each beat waits for its
   own row to be wholly on
   screen (clear of the nav at the top and of the bottom tenth, where the
   booking bar and Ask Buddy sit; the turn, for all four rows), then plays
   a moment after it arrives, so nothing plays to no one: a reader who
   stops with the pension row below the fold finds it waiting, and one
   back to it after a look away gets a beat on "Nothing left" before the
   turn (1.2s). In the turn the pension is picked up and carried over the
   others to the top while they step down out of its way, every number
   rolls on, and a coin drops in and comes round silver (the company's
   money, now yours) with a ring and a light along the row: "Business
   expense". The reader turns it back and forth with the two buttons (or a
   tap on the pension row); a tap on a paid row hops its coin. The facts
   are the page's own: the company's payment is a cost it deducts
   (assets/js/director-calc.js, PBDirector.split), with no income tax, USC
   or PRSI for the director going in, within Revenue's limits. The two
   paragraphs beside it rise in each as it comes on screen, or are simply
   there if the page opens on or below them, so neither is ever blank in
   view. With motion off it is drawn once, by the CSS, and the words are
   simply there. */
(function () {
  'use strict';
  var K = window.PBKit, C = window.PBCoins;
  if (!K || !C) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var TAU = Math.PI * 2, FONT = 'Figtree, system-ui, sans-serif';
  var INK = '#0B1F1C', INK2 = '#54635F', TRACK = '#E7EBE9';
  var TEAL = 'rgba(20,203,177,', BLUE = 'rgba(75,97,135,';
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

  /* ================================================== A. the year-end ring -- */
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

  /* ======================================= B. the executive-pension row -- */
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

  /* ========================================================= C. the order -- */
  (function () {
    var box = $('drQ'), rL = $('drQLast'), rF = $('drQFirst'), list = box && box.querySelector('.dr-q-list');
    if (!list || !rL || !rF) { return; }
    var sr = $('drQSr'), copy = box.parentNode.querySelector('.dr-q-copy');
    var SAY = {
      last: 'Your pension last: the business, the staff and the bills are paid first, and nothing is left for it.',
      first: 'Your pension first: the company pays into it as a business expense, then the business, the staff and the bills.'
    };
    var rows = [].map.call(list.querySelectorAll('.dr-q-row'), function (el) {
      var pen = el.classList.contains('dr-q-pen'), rest = pen ? 180 : 0;
      return {
        el: el, pen: pen, slot: el.querySelector('.dr-q-slot'), coin: el.querySelector('.dr-q-coin'),
        nn: el.querySelector('.dr-q-nn'), badge: el.querySelector('.dr-q-n'),
        y: S(0), y0: 0, hold: 0, nod: S(0), lift: S(0), lt: 0, a: 1, sh: -1, dirty: false, near: false,
        /* its coin: a drop under gravity, a squash as it lands, a turn (the
           pension's comes round silver: the company's money, now yours) */
        c: { ph: '', t: 0, y: 0, vy: 0, op: 1, hit: false, turn: false, hide: false, sq: S(0), rot: S(rest), rt: rest, rest: rest, dirty: false }
      };
    });
    var pen = rows.filter(function (r) { return r.pen; })[0];
    if (!pen || rows.some(function (r) { return !r.slot || !r.coin || !r.nn || !r.badge; })) { return; }
    var none = pen.el.querySelector('.dr-q-none'), exp = pen.el.querySelector('.dr-q-exp');
    var raf = 0, last = 0, T = 0, plan = [], seen = false, playing = false, turn = null;
    /* The story's beats wait for their subjects: a beat with a need (rows)
       holds the clock until each of them is wholly on screen, then plays a
       moment (grace) after they arrive, the beats after it keeping their
       spacing. A reader's own presses need nothing: the reader is looking. */
    var held = false, nav = $('nav');
    function ease(k) { return 1 - Math.pow(1 - k, 3); }
    function at(t, fn, need, grace) {
      plan.push({ t: T + t, fn: fn, need: need || null, grace: grace || 0 });
      plan.sort(function (a, b) { return a.t - b.t; });
    }
    /* wholly on screen: below the nav while it shows (it hides as the page
       goes down and slides back as it comes up) and above the bottom tenth,
       where the booking bar and Ask Buddy sit */
    function inBand(r) {
      var b = r.el.getBoundingClientRect(), n = nav ? nav.getBoundingClientRect() : null;
      return b.top >= (n && n.bottom > 0 ? n.bottom : 0) && b.bottom <= (window.innerHeight || 0) * 0.9;
    }
    function ready(q) {
      if (!q.need || q.need.every(inBand)) { return true; }
      /* a screen too short to hold all four: the pension's own row will do */
      return q.need.length > 1 && inBand(pen) && list.offsetHeight > (window.innerHeight || 0) * 0.82;
    }
    function kick() { if (!raf && K.motion()) { last = clock(); raf = requestAnimationFrame(frame); } }
    function frame(ms) {
      raf = 0;
      var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
      var moving = step(dt);
      paint();
      if (moving && K.motion()) { raf = requestAnimationFrame(frame); }
    }
    function anim(el, kf, o) { if (el && el.animate) { try { return el.animate(kf, o); } catch (e) { /* fine */ } } return null; }
    function stop(el) { if (el && el.getAnimations) { el.getAnimations().forEach(function (a) { a.cancel(); }); } }

    function step(dt) {
      var moving = false, nx = plan[0];
      if (nx && !ready(nx)) {
        /* held: still looking while any of its rows is on screen at all
           (the observer at the end wakes it when one comes back) */
        held = true;
        if (nx.need.some(function (r) { return r.near; })) { moving = true; }
      } else {
        if (held && nx) { T = nx.t - nx.grace; }
        held = false; T += dt;
        while (plan.length && plan[0].t <= T && ready(plan[0])) { plan.shift().fn(); }
        if (plan.length) { moving = true; }
      }
      rows.forEach(function (r) {
        if (r.hold > 0) { r.hold -= dt; moving = true; }
        else {
          if (r.a < 1) { r.a = Math.min(1, r.a + dt / 0.38); moving = true; }
          if (spring(r.y, 0, r.pen ? 125 : 190, r.pen ? 15.5 : 21, dt, 0.04)) { moving = true; } else { r.y0 = 0; }
        }
        /* the pension is picked up for the journey and set down as it arrives */
        if (r.pen) { r.lt = r.y0 && (r.hold > 0 || 1 - r.y.x / r.y0 < 0.62) ? 1 : 0; }
        if (spring(r.lift, r.lt, 240, 22, dt, 0.002)) { moving = true; }
        if (spring(r.nod, 0, 620, 20, dt, 0.02)) { moving = true; }
        if (r.sh >= 0) { r.sh += dt; moving = true; if (r.sh > 0.7) { r.sh = -1; } }
        var c = r.c;
        if (c.ph === 'drop') {
          moving = true; c.t += dt; c.vy += 2600 * dt; c.y += c.vy * dt; c.op = Math.min(1, c.t / 0.09);
          if (c.y >= 0) {
            c.y = 0;
            if (!c.hit) { c.hit = true; landed(r, c.vy); }
            if (c.vy > 170) { c.vy = -c.vy * 0.26; } else { c.vy = 0; c.ph = ''; }
          }
        } else if (c.ph === 'out') {
          moving = true; c.t += dt;
          var k = clamp(c.t / 0.26, 0, 1);
          c.y = -26 * k * k; c.op = 1 - k;
          /* gone: the CSS of "last" hides it from here */
          if (k >= 1) { c.ph = ''; c.y = 0; c.op = 1; }
        }
        if (spring(c.sq, 0, 560, 15, dt, 0.002)) { moving = true; }
        if (spring(c.rot, c.rt, 150, 14, dt, 0.2)) { moving = true; }
      });
      return moving;
    }
    function paint() {
      rows.forEach(function (r) {
        var s = r.el.style, p = r.y0 ? 1 - r.y.x / r.y0 : 1;
        /* on its way the pension swings out to the right, as if carried */
        var ax = r.pen && r.y0 ? 9 * Math.sin(Math.PI * clamp(p, 0, 1)) : 0, ty = r.y.x + r.nod.x;
        if (Math.abs(ty) < 0.05 && Math.abs(ax) < 0.05 && r.lift.x < 0.003 && r.a >= 1) {
          if (r.dirty) { s.translate = ''; s.scale = ''; s.opacity = ''; s.removeProperty('--lift'); r.dirty = false; }
        } else {
          s.translate = ax.toFixed(2) + 'px ' + ty.toFixed(2) + 'px';
          s.scale = r.lift.x > 0.003 ? (1 + 0.025 * r.lift.x).toFixed(4) : '';
          s.opacity = r.a < 1 ? ease(r.a).toFixed(3) : '';
          s.setProperty('--lift', r.lift.x.toFixed(3));
          r.dirty = true;
        }
        r.slot.style.translate = r.sh >= 0 ? (5.5 * Math.exp(-6.5 * r.sh) * Math.sin(TAU * 6.5 * r.sh)).toFixed(2) + 'px 0' : '';
        var c = r.c, cs = r.coin.style;
        if (c.hide) { cs.opacity = '0'; cs.transform = ''; c.dirty = true; }
        else if (c.ph || Math.abs(c.sq.x) > 0.002 || Math.abs(c.rot.x - c.rest) > 0.2) {
          cs.transform = 'translateY(' + c.y.toFixed(2) + 'px) rotateY(' + c.rot.x.toFixed(1) + 'deg) scale(' + (1 + c.sq.x).toFixed(3) + ',' + (1 - c.sq.x).toFixed(3) + ')';
          cs.opacity = c.op < 1 ? c.op.toFixed(3) : '';
          c.dirty = true;
        } else if (c.dirty) { cs.transform = ''; cs.opacity = ''; c.dirty = false; }
      });
    }

    /* a coin drops into a row: the row dips, its number pops */
    function drop(r, silver) {
      var c = r.c;
      c.hide = false; c.ph = 'drop'; c.t = 0; c.y = -38; c.vy = 0; c.op = 0; c.hit = false; c.turn = !!silver;
      if (r.pen) { c.rot.x = 0; c.rot.v = 0; c.rt = 0; }
      kick();
    }
    function landed(r, v) {
      r.c.sq.x = Math.min(0.22, v / 1500); r.c.sq.v = 0;
      r.nod.v += Math.min(120, v * 0.1);
      anim(r.badge, [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
      if (r.c.turn) {
        r.c.rt = r.c.rest;
        at(0.2, function () { ring(r); sheen(r); });
      }
    }
    /* the coin comes round silver: a ring spreads off it, a light runs along the row */
    function ring(r) {
      var e = document.createElement('i'); e.className = 'dr-q-ring'; r.slot.appendChild(e);
      var a = anim(e, [{ transform: 'scale(.8)', opacity: 0.7 }, { transform: 'scale(2.1)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.7,.3,1)' });
      setTimeout(function () { if (e.parentNode) { e.parentNode.removeChild(e); } }, a ? 720 : 0);
    }
    function sheen(r) {
      var e = document.createElement('i'), b = document.createElement('i');
      e.className = 'dr-q-sheen'; e.appendChild(b); r.el.appendChild(e);
      var a = anim(b, [{ transform: 'translateX(-110%)' }, { transform: 'translateX(260%)' }], { duration: 900, easing: 'cubic-bezier(.4,0,.2,1)' });
      setTimeout(function () { if (e.parentNode) { e.parentNode.removeChild(e); } }, a ? 920 : 0);
    }
    /* the pension's turn, and nothing comes: its empty place shakes its head */
    function nothing() {
      pen.sh = 0;
      if (none) {
        none.style.opacity = '';
        anim(none, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,1.3,.4,1)' });
      }
      anim(pen.badge, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
      kick();
    }

    /* The order changes: each row is where it was, on the screen, and springs
       to its new place; the pension lifts and swings round the others, which
       step aside one after another, nearest first; every number rolls on.
       The radios hold the order and the CSS draws it, so this only moves the
       parts from where they were to where the CSS now puts them. */
    function flip(first, auto) {
      plan = []; turn = null; playing = false; T = 0; held = false; box.classList.remove('dr-q-pre');
      rows.forEach(function (r) { r.hold = 0; if (!r.pen && r.c.hide) { r.c.hide = false; } });
      (first ? rL : rF).checked = true;
      rows.forEach(function (r) { r.vis = r.el.offsetTop + r.y.x; r.nf = getComputedStyle(r.nn).transform; });
      var tf = [none, exp].map(function (t) { return t ? +getComputedStyle(t).opacity : 0; });
      (first ? rF : rL).checked = true;
      if (sr && !auto) { sr.textContent = first ? SAY.first : SAY.last; }
      if (!K.motion()) { settle(); return; }
      rows.forEach(function (r) { var d = r.vis - r.el.offsetTop; r.y.x = d; r.y0 = Math.abs(d) > 1 ? d : 0; });
      anim(box.querySelector('.dr-q-pill'), [{ scale: '1' }, { scale: '1.06 .9', offset: 0.4 }, { scale: '1' }], { duration: 460, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      /* a beat to pick it up while the others make way, the one in the place
         it is going to first */
      var to = pen.el.offsetTop;
      pen.hold = 0.1;
      rows.filter(function (r) { return !r.pen; })
        .sort(function (a, b) { return Math.abs(a.vis - to) - Math.abs(b.vis - to); })
        .forEach(function (r, i) { r.hold = 0.035 * i; });
      rows.forEach(function (r, i) {
        stop(r.nn);
        anim(r.nn, [{ transform: r.nf && r.nf !== 'none' ? r.nf : 'translateY(0)' }, { transform: first ? 'translateY(-50%)' : 'translateY(0)' }],
          { duration: 620, delay: (r.pen ? 0.16 : 0.2 + 0.05 * i) * 1000, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
      });
      stop(none); stop(exp);
      if (first) {
        if (none) { none.style.opacity = ''; anim(none, [{ opacity: tf[0] }, { opacity: 0 }], { duration: 160 }); }
        if (exp) { exp.style.opacity = '0'; }
        pen.c.ph = ''; pen.c.hide = true; pen.sh = -1;
        /* the story's own turn: the coin and its tag wait for the pension row, now at the top */
        var want = auto ? [pen] : null;
        at(0.5, function () { drop(pen, true); }, want, 0.2);
        at(0.78, function () {
          if (!exp) { return; }
          exp.style.opacity = '';
          anim(exp, [{ opacity: 0, transform: 'scale(.55)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.3,1.6,.5,1)' });
        }, want, 0.2);
      } else {
        if (exp) { exp.style.opacity = ''; anim(exp, [{ opacity: tf[1] }, { opacity: 0 }], { duration: 160 }); }
        if (none) { none.style.opacity = '0'; }
        /* its coin goes up and away, turning as it goes */
        var c = pen.c;
        c.rt = c.rest;
        if (c.hide) { c.ph = ''; c.hide = false; c.rot.x = c.rest; c.rot.v = 0; } else { c.ph = 'out'; c.t = 0; c.y = 0; c.vy = 0; c.op = 1; }
        at(0.8, nothing);
      }
      paint(); kick();
    }
    /* everything where the CSS puts it, at once */
    function settle() {
      plan = []; turn = null; playing = false; held = false; box.classList.remove('dr-q-pre');
      rows.forEach(function (r) {
        r.y.x = r.y.v = 0; r.y0 = 0; r.hold = 0; r.nod.x = r.nod.v = 0; r.lift.x = r.lift.v = 0; r.lt = 0; r.a = 1; r.sh = -1; r.dirty = true;
        var c = r.c;
        c.ph = ''; c.hide = false; c.y = 0; c.vy = 0; c.op = 1; c.sq.x = c.sq.v = 0; c.rot.x = c.rt = c.rest; c.rot.v = 0; c.dirty = true;
      });
      [none, exp].forEach(function (t) { if (t) { t.style.opacity = ''; } });
      [].forEach.call(box.querySelectorAll('*'), stop);
      [].forEach.call(box.querySelectorAll('.dr-q-ring,.dr-q-sheen'), function (e) { e.parentNode.removeChild(e); });
      paint();
    }

    /* The first look: the order most directors run. The rows rise in, the
       company pays the business, the staff and the bills a coin each, in
       turn, and comes to the pension with nothing left. A pause, then the
       order turns round: the pension goes first. */
    function pre() {
      rL.checked = true; box.classList.add('dr-q-pre');
      rows.forEach(function (r) { r.a = 0; r.y.x = 22; r.c.hide = !r.pen; });
      if (none) { none.style.opacity = '0'; }
      paint();
    }
    function intro(own) {
      plan = []; T = 0; playing = true; held = false; box.classList.remove('dr-q-pre');
      rows.forEach(function (r, i) { r.hold = 0.07 * i; r.a = 0; r.y.x = 22; r.y.v = 0; r.y0 = 0; });
      /* each coin as its row is on screen, "Nothing left" as the pension's is */
      var k = 0;
      rows.forEach(function (r) { if (!r.pen) { at(0.62 + 0.3 * k++, function () { drop(r, false); }, [r], 0.25); } });
      var tNone = 0.62 + 0.3 * k + 0.12;
      at(tNone, nothing, [pen], 0.3);
      /* the turn is ours to make only while the reader has not touched the
         buttons: 1.5s on "Nothing left", with all four rows in view; back to
         it after a look away, a reader gets 1.2s on "Nothing left" first */
      if (!own) { turn = function () { turn = null; flip(true, true); }; at(tNone + 1.5, turn, rows, 1.2); }
      kick();
    }
    /* a press on the buttons before the turn, even on the one already chosen: the reader has it now */
    function mine() {
      if (sr) { sr.textContent = rF.checked ? SAY.first : SAY.last; }
      if (!K.motion()) { return; }
      if (!seen) { seen = true; intro(true); return; }
      if (turn) { var t = turn; turn = null; plan = plan.filter(function (q) { return q.fn !== t; }); }
    }
    rL.addEventListener('click', mine);
    rF.addEventListener('click', mine);

    /* the coins: the page's own metal (PBCoins), drawn once per size */
    var spr = '';
    function coins() {
      var w = pen.slot.offsetWidth, d = Math.min(window.devicePixelRatio || 1, 2), key = w + '/' + d;
      if (!(w > 4) || key === spr) { return; }
      var url = {};
      ['blue', 'silver'].forEach(function (k) {
        var c = document.createElement('canvas'), x;
        c.width = c.height = Math.ceil(w * d); x = c.getContext && c.getContext('2d');
        if (!x) { return; }
        x.scale(d, d); C.face(x, w / 2, w / 2, w / 2 - 0.5, k);
        try { url[k] = c.toDataURL(); } catch (e) { /* the CSS coin stays */ }
      });
      if (!url.blue || !url.silver) { return; }
      spr = key;
      [].forEach.call(box.querySelectorAll('.dr-q-fb'), function (e) { e.style.backgroundImage = 'url(' + url.blue + ')'; });
      [].forEach.call(box.querySelectorAll('.dr-q-fs'), function (e) { e.style.backgroundImage = 'url(' + url.silver + ')'; });
      box.classList.add('dr-q-spr');
    }
    coins();
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { spr = ''; coins(); }); }
    var rz = 0;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(coins, 150); });

    function chose() { seen = true; flip(rF.checked, false); }
    rL.addEventListener('change', chose);
    rF.addEventListener('change', chose);
    /* a tap on the pension turns the order round; a tap on a paid row checks its coin is there */
    list.addEventListener('click', function (e) {
      var li = e.target.closest ? e.target.closest('.dr-q-row') : null, r = null;
      rows.forEach(function (x) { if (x.el === li) { r = x; } });
      if (!r) { return; }
      if (r.pen) { (rF.checked ? rL : rF).click(); return; }
      if (K.motion() && !r.c.hide && !r.c.ph) { var c = r.c; c.ph = 'drop'; c.t = 1; c.y = -0.01; c.vy = -330; c.op = 1; c.hit = false; c.turn = false; kick(); }
    });

    var words = copy ? [].slice.call(copy.querySelectorAll('.dr-q-lead,.dr-q-fix')) : [];
    if (K.motion() && LIVE) {
      pre();
      /* the rows rise in as the list comes on screen at all, so the card is
         never empty in view; the beats then wait for their rows */
      new IntersectionObserver(function (es, o) {
        var e = es[es.length - 1];
        if (seen) { o.disconnect(); return; }
        if (e.isIntersecting) { seen = true; o.disconnect(); if (K.motion()) { intro(); } else { rF.checked = true; settle(); } }
      }).observe(list);
      /* each row on screen at all or not: a held beat looks for its rows
         only while one of them is, and wakes when one comes back */
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { rows.forEach(function (r) { if (r.el === e.target) { r.near = e.isIntersecting; } }); });
        if (plan.length) { kick(); }
      });
      rows.forEach(function (r) { rio.observe(r.el); });
      /* the words beside it rise in, each as it comes on screen at all. Only
         one still below the screen waits; one on it or above it (a reload
         lower down, a link to further on) is simply there */
      if (words.length) {
        var wio = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting || e.boundingClientRect.bottom <= 0) { wio.unobserve(e.target); e.target.classList.remove('dr-q-wait'); }
          });
        });
        words.forEach(function (w) {
          if (w.getBoundingClientRect().top < (window.innerHeight || document.documentElement.clientHeight)) { return; }
          w.classList.add('dr-q-wait'); wio.observe(w);
        });
      }
    }
    /* motion turned off, or the page printed, before the end: the finished order */
    function done() { words.forEach(function (w) { w.classList.remove('dr-q-wait'); }); if (!seen || playing) { seen = true; rF.checked = true; } settle(); }
    document.addEventListener('pb:motion', function () { if (!K.motion()) { done(); } });
    window.addEventListener('beforeprint', done);
  }());
}());
