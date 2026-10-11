/* The home page's calculator (#calc), 11 October 2026, Damian's brief: "a
   really interactive pension calculator people can use straight away, as
   simple as possible."

   Three questions (age, saved so far, put in a month) and the tax rate for
   the relief. The answer is one line, in today's money, from 66: the State
   Pension plus what the pot could pay, against the way of life picked in the
   gap above (or here: the two share PBKit.aim). "Close my gap" works out the
   monthly amount that would cover it and slides the slider there.

   The maths is the pension calculator's own (pension-calculator.html):
   monthly compounding at 5% a year, 4% of the pot a year as income, and
   today's money at the European Central Bank's 2% (assets/js/pb-assumptions.js).
   Contributions stay level. Retirement is at 66. The relief line is the
   amount times the tax rate, within Revenue's age-related limits.

   The jar: the pot at 66, in today's money, as a pile of coins. Coins drop
   in as fast as the monthly amount says: slate for the reader's own,
   amber for Revenue's share. A dashed line marks the pot that would cover
   the way of life; cross it and the line turns teal and the jar cheers.
   With motion off the jar is drawn once per change, with no falling coins. */
(function () {
  'use strict';
  var sec = document.getElementById('calc'), K = window.PBKit, LS = window.PBLivingStandards, SP = window.PBStatePension;
  if (!sec || !K || !LS) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var age = $('pbC2Age'), pot = $('pbC2Pot'), mine = $('pbC2Mine');
  if (!age || !pot || !mine) { return; }
  var fmt = K.fmt;
  var G = 0.05, DRAW = 0.04, AT = (SP && SP.PENSION_AGE) || 66;
  var INF = (window.PBAssume && window.PBAssume.inflation && window.PBAssume.inflation.rate) || 0.02;
  var ONE = SP ? SP.MAX_WEEKLY_CENTS * SP.WEEKS_PER_YEAR / 100 : 15563.6;
  var tax = 0.4;

  function mr() { return Math.pow(1 + G, 1 / 12) - 1; }
  function project(a, p, m) {
    var n = Math.max(1, AT - a), months = n * 12, r = mr(), g = Math.pow(1 + r, months);
    var fv = p * g + (r > 0 ? m * (g - 1) / r : m * months), today = fv / Math.pow(1 + INF, n);
    return { n: n, fv: fv, today: today, month: today * DRAW / 12 };
  }
  /* the level monthly amount that brings the income to `want` a month, in today's money */
  function needed(a, p, want) {
    var n = Math.max(1, AT - a), months = n * 12, r = mr(), g = Math.pow(1 + r, months);
    var potNom = want * 12 / DRAW * Math.pow(1 + INF, n), rest = potNom - p * g;
    return Math.max(0, rest / ((g - 1) / r));
  }
  function statePerMonth(hh) { return (hh === 'couple' ? 2 : 1) * ONE / 12; }

  /* ------------------------------------------------------------ sliders -- */
  function fill(r) { r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  var VT = { pbC2Age: function (v) { return v + ' years old'; }, pbC2Pot: function (v) { return fmt(v); }, pbC2Mine: function (v) { return fmt(v) + ' a month'; } };
  var rTotal = new K.Roll($('pbC2Total'));
  var rAge = new K.Roll($('pbC2AgeV')), rPot = new K.Roll($('pbC2PotV')), rMine = new K.Roll($('pbC2MineV'));

  /* ------------------------------------------------------------ the bar -- */
  var bar = $('pbC2Bar');
  var mark = bar.querySelector('.pb-c2-need');
  var B = { sp: new K.Spring(0, 160, 18), you: new K.Spring(0, 160, 18), gap: new K.Spring(0, 140, 16), need: new K.Spring(0, 160, 18) };

  /* ------------------------------------------------------------ the jar -- */
  var cv = sec.querySelector('.pb-c2-jar'), cx = cv && cv.getContext ? cv.getContext('2d') : null;
  var J = { wob: new K.Spring(0, 260, 7) };
  var coins = [], rings = [], sparks = [], nextCoin = 0, W = 0, Hh = 0, dpr = 1;
  var S = {}, srT = 0; /* the latest figures */

  function calc(fromUser) {
    var a = +age.value, p = +pot.value, m = +mine.value, aim = K.aim;
    var pr = project(a, p, m), st = statePerMonth(aim.hh), std = LS.standard(aim.level, aim.hh);
    var need = std.monthly, total = st + pr.month, short = need - total;
    var targetPot = Math.max(0, need - st) * 12 / DRAW;
    var wasCovered = S.covered;
    S = { a: a, p: p, m: m, pr: pr, st: st, need: need, total: total, short: short, covered: short <= 0.5, targetPot: targetPot, label: std.label, two: aim.hh === 'couple' };

    [age, pot, mine].forEach(function (r) { fill(r); r.setAttribute('aria-valuetext', VT[r.id](+r.value)); });
    /* the answers themselves follow the thumb exactly; only the result rolls */
    rAge.set(String(a), true); rPot.set(fmt(p), true); rMine.set(fmt(m), true);
    $('pbC2Relief').innerHTML = m > 0
      ? 'Costs you about <b class="pb-c2-you-t">' + fmt(m * (1 - tax)) + '</b> a month. <b class="pb-c2-rev-t">Revenue adds ' + fmt(m * tax) + '</b> in tax relief.'
      : 'Put something in to see what Revenue adds.';

    rTotal.set(fmt(total));
    $('pbC2Parts').innerHTML = '<span class="pb-c2-k-sp"><i aria-hidden="true"></i>' + (S.two ? 'Two State Pensions ' : 'State Pension ') + '<b>' + fmt(st) + '</b></span>' +
      '<span class="pb-c2-k-you"><i aria-hidden="true"></i>Your pension <b>' + fmt(pr.month) + '</b></span>' +
      (S.covered ? '' : '<span class="pb-c2-k-gap"><i aria-hidden="true"></i>Short <b>' + fmt(short) + '</b></span>');

    /* the bar: what comes in, against what the life costs */
    var top = Math.max(need, total) * 1.06;
    B.sp.t = st / top; B.you.t = pr.month / top; B.gap.t = S.covered ? 0 : short / top; B.need.t = need / top;
    mark.querySelector('span').textContent = std.label + ' life ' + fmt(need);
    bar.classList.toggle('pb-c2-ok', S.covered);

    var life = 'a ' + std.label.toLowerCase() + ' life' + (S.two ? ' for two' : '');
    var v = $('pbC2Verdict'), close = $('pbC2Close');
    var up = aim.level === 'modest' ? 'moderate' : aim.level === 'moderate' ? 'comfortable' : null;
    if (S.covered) {
      v.innerHTML = '<b class="pb-c2-yes">On track.</b> That covers ' + life + ', with ' + fmt(-short) + ' a month to spare.';
      close.hidden = !up; close.setAttribute('data-act', 'up');
      if (up) { close.querySelector('span').textContent = 'Aim higher: ' + LS.LABELS[up]; }
    } else {
      var want = needed(a, p, need - st), max = +mine.max;
      v.innerHTML = '<b class="pb-c2-no">' + fmt(short) + ' a month short</b> of ' + life + '.' +
        (want <= max ? ' About <b>' + fmt(Math.ceil(want / 10) * 10) + ' a month</b> going in would cover it.' : ' Even ' + fmt(max) + ' a month would not cover it by ' + AT + '.');
      close.hidden = false; close.setAttribute('data-act', 'close');
      close.querySelector('span').textContent = 'Close my gap';
    }
    sec.classList.toggle('pb-c2-is-ok', S.covered);
    $('pbC2MiniN').textContent = fmt(total);
    $('pbC2MiniV').textContent = S.covered ? 'On track' : fmt(short) + ' short';
    /* said once the reader pauses, not on every step of a drag */
    var said = 'At ' + AT + ', in today’s money: about ' + fmt(total) + ' a month. ' + (S.covered ? 'That covers ' + life + '.' : fmt(short) + ' a month short of ' + life + '.');
    clearTimeout(srT); srT = setTimeout(function () { $('pbC2Sr').textContent = said; }, fromUser ? 700 : 0);

    if (fromUser && wasCovered === false && S.covered && K.motion()) { cheer(); }
    if (!K.motion()) { snap(); }
    kick();
  }
  function snap() { for (var k in B) { B[k].x = B[k].t; } }

  /* ------------------------------------------------------- the frame loop -- */
  var raf = 0, last = 0, onScreen = true, scaleS = new K.Spring(1, 90, 14), potS = new K.Spring(0, 80, 12), tgtS = new K.Spring(0, 110, 15);
  function kick() { if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    var busy = false, k;
    for (k in B) { B[k].step(dt); if (!B[k].done()) { busy = true; } }
    bar.style.setProperty('--sp', (B.sp.x * 100).toFixed(3) + '%');
    bar.style.setProperty('--you', (Math.max(0, B.you.x) * 100).toFixed(3) + '%');
    bar.style.setProperty('--gap', (Math.max(0, B.gap.x) * 100).toFixed(3) + '%');
    bar.style.setProperty('--need', (B.need.x * 100).toFixed(3) + '%');
    if (cx && S.pr) { if (draw(now, dt)) { busy = true; } }
    if (busy && onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }

  function size() {
    if (!cv) { return; }
    var b = cv.getBoundingClientRect(); W = b.width; Hh = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function text(s, x, y, size, weight, color, align) {
    cx.font = weight + ' ' + size + 'px Figtree, system-ui, sans-serif'; cx.fillStyle = color; cx.textAlign = align || 'left'; cx.textBaseline = 'middle'; cx.fillText(s, x, y);
  }
  function cheer() { sparks.push({ burst: true }); }

  function draw(now, dt) {
    if (!W) { size(); }
    if (W < 120 || Hh < 120) { return false; }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, Hh);
    var narrow = W < 420, jw = Math.min(230, W * (narrow ? 0.44 : 0.4)), jx = narrow ? W * 0.05 : W * 0.1, jy = 34, jh = Hh - jy - 30, r = 26;
    var potToday = S.pr.today, tgt = S.targetPot;
    var scaleT = Math.max(tgt * 1.35, potToday * 1.15, 20000);
    scaleS.t = scaleT; potS.t = potToday; tgtS.t = tgt;
    if (!K.motion()) { scaleS.x = scaleT; potS.x = potToday; tgtS.x = tgt; } else { scaleS.step(dt); potS.step(dt); tgtS.step(dt); J.wob.step(dt); }
    var busy = !(scaleS.done() && potS.done() && tgtS.done() && J.wob.done());
    var inner = jh - 14, base = jy + jh - 7;
    var surf = base - inner * Math.min(1, potS.x / scaleS.x), line = base - inner * Math.min(1, tgtS.x / scaleS.x);

    /* the glass, behind */
    cx.save();
    rr(jx, jy, jw, jh, r); cx.fillStyle = 'rgba(255,255,255,.75)'; cx.fill();
    /* the pile */
    rr(jx + 4, jy + 4, jw - 8, jh - 8, r - 4); cx.clip();
    var wob = J.wob.x;
    cx.beginPath(); cx.moveTo(jx, base + 10);
    for (var x = jx; x <= jx + jw + 4; x += 4) { cx.lineTo(x, surf + Math.sin((x - jx) * 0.09 + now * 4) * Math.min(4, Math.abs(wob)) * 0.6 + Math.sin((x - jx) * 0.05 - now * 2) * 1.2); }
    cx.lineTo(jx + jw, base + 10); cx.closePath();
    var g = cx.createLinearGradient(0, surf, 0, base); g.addColorStop(0, '#7D8DA6'); g.addColorStop(1, '#586B85'); cx.fillStyle = g; cx.fill();
    /* coin edges in the pile, and Revenue's amber ones among them */
    cx.save(); cx.clip();
    for (var yy = base - 6, row = 0; yy > surf - 6; yy -= 9, row++) {
      for (var cxp = jx + 10 + (row % 2) * 12; cxp < jx + jw - 6; cxp += 24) {
        var amber = ((row * 7 + Math.round(cxp)) % 10) / 10 < tax;
        cx.fillStyle = amber ? 'rgba(244,183,64,.55)' : 'rgba(255,255,255,.10)';
        cx.beginPath(); cx.ellipse(cxp, yy, 10, 3.2, 0, 0, Math.PI * 2); cx.fill();
      }
    }
    cx.restore();
    cx.restore();
    /* the glass, over: rim, shine */
    rr(jx, jy, jw, jh, r); cx.lineWidth = 2.5; cx.strokeStyle = 'rgba(11,31,28,.55)'; cx.stroke();
    /* an open jar: a thick lip either side of the mouth */
    cx.lineCap = 'round'; cx.lineWidth = 7; cx.strokeStyle = '#0B1F1C';
    cx.beginPath(); cx.moveTo(jx + 6, jy + 2); cx.lineTo(jx + jw * 0.2, jy + 2); cx.moveTo(jx + jw * 0.8, jy + 2); cx.lineTo(jx + jw - 6, jy + 2); cx.stroke(); cx.lineCap = 'butt';
    cx.fillStyle = 'rgba(255,255,255,.55)'; rr(jx + 12, jy + 16, 8, jh * 0.55, 4); cx.fill();
    text('At ' + AT, jx + jw / 2, jy + jh + 16, 13, 600, '#54635F', 'center');

    /* the line that covers the way of life */
    var ok = S.covered, lx = jx + jw + 12, labW = W - lx - 4;
    if (tgt > 0) {
      cx.save(); cx.setLineDash(ok ? [] : [7, 6]); cx.lineWidth = ok ? 3 : 2; cx.strokeStyle = ok ? '#0B7A6E' : '#0B1F1C';
      cx.beginPath(); cx.moveTo(jx - 4, line); cx.lineTo(lx - 4, line); cx.stroke(); cx.restore();
    }
    /* labels: the line's on the right at its height, the pile's under or over it */
    var fsS = narrow ? 12 : 13, fsB = narrow ? 16 : 19, ly = line, py = surf;
    if (Math.abs(py - ly) < 46) { py = ly + (py >= ly ? 46 : -46); }
    py = Math.max(jy + 14, Math.min(base - 10, py)); ly = Math.max(jy + 14, Math.min(base - 10, ly));
    if (labW > 70) {
      if (tgt > 0) {
        text(ok ? '✓ Covered' : 'Enough for', lx, ly - 10, fsS, 700, ok ? '#0B7A6E' : '#0B1F1C');
        text((ok ? '' : 'a ') + S.label.toLowerCase() + ' life', lx, ly + 8, fsS, ok ? 700 : 600, ok ? '#0B7A6E' : '#0B1F1C');
      } else {
        text('✓ The State Pension', lx, ly - 10, fsS, 700, '#0B7A6E');
        text('covers this life', lx, ly + 8, fsS, 600, '#0B7A6E');
      }
      text('Your pot', lx, py - 11, fsS, 600, '#54635F');
      text(fmt(potS.x), lx, py + 9, fsB, 800, '#586B85');
      cx.strokeStyle = 'rgba(88,107,133,.6)'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(jx + jw - 6, Math.max(surf, jy + 6)); cx.lineTo(lx - 6, py + 9); cx.stroke();
    }

    /* falling coins */
    if (K.motion() && S.m > 0 && onScreen) {
      var rate = Math.min(9, 0.7 + S.m / 110);
      if (now > nextCoin) {
        coins.push({ x: jx + jw * 0.26 + Math.random() * jw * 0.48, y: -10, vy: 40 + Math.random() * 60, s: Math.random() * 6, amber: Math.random() < tax });
        nextCoin = now + 1 / rate * (0.6 + Math.random() * 0.8);
      }
    }
    coins = coins.filter(function (c) {
      c.vy += 1500 * dt; c.y += c.vy * dt; c.s += dt * 9;
      if (c.y >= surf - 3) { rings.push({ x: c.x, y: surf, t: 0, amber: c.amber }); J.wob.v += 14; return false; }
      var sx = Math.abs(Math.cos(c.s)) * 0.8 + 0.2;
      cx.save(); cx.translate(c.x, c.y); cx.scale(sx, 1);
      cx.beginPath(); cx.arc(0, 0, 9, 0, Math.PI * 2); cx.fillStyle = c.amber ? '#F4B740' : '#586B85'; cx.fill();
      cx.lineWidth = 1.5; cx.strokeStyle = c.amber ? '#B9852A' : '#3D4B60'; cx.stroke();
      cx.beginPath(); cx.arc(0, 0, 5, 0, Math.PI * 2); cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.stroke();
      cx.restore();
      return true;
    });
    rings = rings.filter(function (q) {
      q.t += dt; if (q.t > 0.45) { return false; }
      var k = q.t / 0.45; cx.globalAlpha = 1 - k; cx.strokeStyle = q.amber ? '#F4B740' : '#FFFFFF'; cx.lineWidth = 2;
      cx.beginPath(); cx.ellipse(q.x, q.y, 6 + 18 * k, 2 + 5 * k, 0, 0, Math.PI * 2); cx.stroke(); cx.globalAlpha = 1;
      return true;
    });
    /* the cheer: a burst of paws and coins from the line */
    if (sparks.length && sparks[0].burst) {
      sparks = [];
      for (var i = 0; i < 26; i++) {
        var an = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, sp = 220 + Math.random() * 260;
        sparks.push({ x: jx + jw / 2 + (Math.random() - 0.5) * jw * 0.6, y: line, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, c: ['#14CBB1', '#F4B740', '#7FE3D3', '#0B7A6E'][i % 4], r: 3 + Math.random() * 4 });
      }
    }
    sparks = sparks.filter(function (q) {
      q.t += dt; if (q.t > 1.1) { return false; }
      q.vy += 700 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      cx.globalAlpha = Math.max(0, 1 - q.t / 1.1); cx.fillStyle = q.c; cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, Math.PI * 2); cx.fill(); cx.globalAlpha = 1;
      return true;
    });
    return busy || coins.length > 0 || rings.length > 0 || sparks.length > 0 || (K.motion() && S.m > 0);
  }

  /* ------------------------------------------------------ the controls -- */
  [age, pot, mine].forEach(function (r) { r.addEventListener('input', function () { calc(true); }); r.hidden = false; });
  var taxSeg = sec.querySelector('.pb-c2-tax');
  if (taxSeg) { K.seg(taxSeg, function (b) { tax = +b.getAttribute('data-rate') / 100; calc(true); }); }
  var lvSeg = sec.querySelector('.pb-c2-lv'), hhSeg = sec.querySelector('.pb-c2-hh'), lv = null, hh = null;
  if (lvSeg) { lv = K.seg(lvSeg, function (b) { K.setAim(b.getAttribute('data-level'), K.aim.hh, 'calc'); }); }
  if (hhSeg) { hh = K.seg(hhSeg, function (b) { K.setAim(K.aim.level, b.getAttribute('data-hh'), 'calc'); }); }
  document.addEventListener('pb:aim', function (e) {
    var d = e.detail || {};
    if (lv) { lv.press(function (b) { return b.getAttribute('data-level') === d.level; }, d.by === 'calc'); }
    if (hh) { hh.press(function (b) { return b.getAttribute('data-hh') === d.hh; }, d.by === 'calc'); }
    calc(true);
  });

  /* "Close my gap": slide the monthly amount to what covers it; when it is
     covered already, "Aim higher" moves the way of life up one */
  var tw = 0;
  $('pbC2Close').addEventListener('click', function () {
    var b = this;
    if (b.getAttribute('data-act') === 'up') {
      var up = K.aim.level === 'modest' ? 'moderate' : 'comfortable';
      K.setAim(up, K.aim.hh, 'button'); return;
    }
    var want = Math.min(+mine.max, Math.ceil(needed(S.a, S.p, S.need - S.st) / +mine.step) * +mine.step);
    var from = +mine.value, t0 = performance.now(), dur = K.motion() ? 1100 : 0;
    cancelAnimationFrame(tw);
    (function go(ms) {
      var k = dur ? Math.min(1, (ms - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      mine.value = Math.round((from + (want - from) * e) / +mine.step) * +mine.step;
      calc(true);
      if (k < 1) { tw = requestAnimationFrame(go); } else { mine.focus({ preventScroll: true }); }
    }(t0));
  });

  /* ------------------------------------------------------ housekeeping -- */
  window.addEventListener('resize', function () { W = 0; kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; kick(); }); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { onScreen = es[es.length - 1].isIntersecting; if (onScreen) { W = 0; kick(); } }, { rootMargin: '80px 0px' }).observe(sec);
  }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', function () { snap(); kick(); });
  $('pbC2Live').hidden = false;
  sec.classList.add('pb-c2-on');
  calc(false); snap();
}());
