/* The gap (#gap), 11 October 2026, Damian's brief: "Hemingway. Here's the
   gap. Make it clear as day. As interactive as the welcome."

   "Is the State Pension enough?" Modest, Moderate or Comfortable, Single or
   Couple. The answer, in one word and one figure, and a tower of coins: the
   whole tower is what that life costs a year; the teal coins are what the
   State Pension pays; the coral coins on top are the gap. One coin is a
   fixed sum for every answer (the dearest, Comfortable for two, is 28 coins),
   so a dearer life is a taller tower.

   Motion: the tower builds coin by coin the first time it is seen; a new
   answer drops coins on (they land with a bounce) or knocks them off (they
   tumble away); a change of colour turns a coin over. The tower sways like
   jelly, leans away from the pointer, and takes a push: flick across it and
   it wobbles. Tap it and a wave runs up it and paws fly out of the top. The
   answer stamps down; the figures roll. With motion off it is drawn once
   per answer, finished.

   Figures: assets/js/living-standards.js and state-pension.js only. */
(function () {
  'use strict';
  var sec = document.getElementById('gap'), K = window.PBKit, LS = window.PBLivingStandards, SP = window.PBStatePension, C = window.PBCoins;
  if (!sec || !K || !LS) { return; }
  var chart = document.getElementById('pbG2Chart'), pick = document.getElementById('pbG2Pick');
  if (!chart || !pick) { return; }
  var $ = function (id) { return document.getElementById(id); };
  var fmt = K.fmt;
  var ONE = SP ? SP.MAX_WEEKLY_CENTS * SP.WEEKS_PER_YEAR / 100 : 15563.6;
  function statePension(hh) { return Math.round((hh === 'couple' ? 2 : 1) * ONE); }
  var WHAT = { modest: 'The bare minimum.', moderate: 'Some breathing room.', comfortable: 'A few luxuries.' };
  var YEARS = 20, COINS = 28, TOP = LS.standard('comfortable', 'couple').annual, COIN = TOP / COINS;

  /* ------------------------------------------------- the words -- */
  var rBig = new K.Roll(document.querySelector('#pbG2Big .pb-g2-big-n')), bigW = document.querySelector('#pbG2Big .pb-g2-big-w');
  var key = { need: $('pbG2KNeed'), st: $('pbG2KSt'), gap: $('pbG2KGap') };
  var kv = {}, kl = {};
  ['need', 'st', 'gap'].forEach(function (k) { if (key[k]) { kv[k] = new K.Roll(key[k].querySelector('dd')); kl[k] = key[k].querySelector('dt'); } });
  function figures() {
    var a = K.aim, s = LS.standard(a.level, a.hh), st = statePension(a.hh);
    return { s: s, need: s.annual, st: st, gap: s.annual - st, two: a.hh === 'couple', label: s.label };
  }
  function words(fromUser) {
    var f = figures(), covered = f.gap <= 0;
    $('pbG2What').textContent = WHAT[K.aim.level];
    var no = $('pbG2No');
    no.textContent = covered ? 'Yes.' : 'No.';
    sec.classList.toggle('pb-g2-is-covered', covered);
    if (covered) { rBig.set(fmt(-f.gap)); bigW.textContent = 'a year to spare.'; }
    else { rBig.set(fmt(f.gap)); bigW.textContent = 'a year short.'; }
    $('pbG2Month').textContent = covered
      ? (f.two ? 'Two full State Pensions cover it.' : 'The full State Pension covers it.')
      : fmt(f.gap / 12) + ' a month. ' + fmt(f.gap * YEARS) + ' over ' + YEARS + ' years.';
    if (kl.need) {
      kl.need.textContent = 'A ' + f.label.toLowerCase() + ' life' + (f.two ? ' for two' : '');
      kv.need.set(fmt(f.need));
      kl.st.textContent = f.two ? 'Two State Pensions' : 'State Pension';
      kv.st.set(fmt(f.st));
      kl.gap.textContent = covered ? 'Spare' : 'The gap';
      kv.gap.set(fmt(Math.abs(f.gap)));
    }
    chart.setAttribute('aria-label', 'A ' + f.label.toLowerCase() + ' life ' + (f.two ? 'for two' : 'for one') + ' costs ' +
      Math.round(f.need).toLocaleString('en-IE') + ' euro a year. ' + (f.two ? 'Two State Pensions pay ' : 'The State Pension pays ') +
      f.st.toLocaleString('en-IE') + '. ' + (covered ? 'That covers it, with ' + Math.round(-f.gap).toLocaleString('en-IE') + ' to spare.' : 'The gap is ' + Math.round(f.gap).toLocaleString('en-IE') + ' a year.'));
    if (fromUser && K.motion()) {
      var ans = $('pbG2Ans');
      ans.classList.remove('pb-g2-stamp', 'pb-g2-yay'); void ans.offsetWidth; ans.classList.add(covered ? 'pb-g2-yay' : 'pb-g2-stamp');
    }
    split();
  }

  /* where the money goes: the month, category by category */
  var more = $('pbG2More'), box = $('pbG2Split');
  function split() {
    if (!box) { return; }
    var a = K.aim, s = LS.standard(a.level, a.hh), top = 0;
    s.categories.forEach(function (c) { top = Math.max(top, c.monthly); });
    box.innerHTML = '<p class="pb-g2-split-h">' + s.label + (a.hh === 'couple' ? ', for two' : ', for one') + ': <b>' + fmt(s.monthly) + ' a month</b></p>' +
      '<ul class="pb-g2-rows">' + s.categories.map(function (c, i) {
        return '<li style="--i:' + i + '"><span>' + c.label + '</span><i style="--w:' + (c.monthly / top * 100).toFixed(2) + '%" aria-hidden="true"></i><b>' + fmt(c.monthly) + '</b></li>';
      }).join('') + '</ul>';
  }
  if (more && box) {
    more.hidden = false;
    more.addEventListener('click', function () {
      var open = more.getAttribute('aria-expanded') !== 'true';
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
      box.hidden = !open;
      if (open && K.motion()) { box.classList.remove('pb-g2-pour'); void box.offsetWidth; box.classList.add('pb-g2-pour'); }
    });
  }

  /* ------------------------------------------------- the tower -- */
  var cv = chart.querySelector('canvas'), cx = cv && cv.getContext ? cv.getContext('2d') : null;
  var W = 0, H = 0, dpr = 1, G = null, fx = C ? new C.FX() : null;
  var coins = [], gone = [], lean = { x: 0, v: 0, t: 0 }, ptr = { x: -1, y: -1, in: false, vx: 0, lx: 0, lt: 0 };
  var mark = { st: new K.Spring(0, 120, 16), need: new K.Spring(0, 120, 16) }, built = false, seen = false;
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var w = Math.max(56, Math.min(132, W * 0.36, (H - 64) / (COINS * 0.105 + 0.3)));
    var h = C.sliceH(Math.round(w));
    G = { w: Math.round(w), e: h.e, ry: h.ry, x: W < 460 ? W * 0.27 : W * 0.3, base: H - 14 };
  }
  function slotY(i) { return G.base - G.ry - G.e - i * G.e; }
  function want() {
    var f = figures(), nT = Math.round(f.st / COIN), nAll = Math.round(f.need / COIN);
    var nC = f.gap > 0 ? Math.max(1, nAll - nT) : 0;
    return { nT: nT, nC: nC, f: f };
  }
  /* bring the tower to the answer: coins turn over, drop on, or are knocked off */
  function sync(animate) {
    var w = want(), list = [], i;
    for (i = 0; i < w.nT; i++) { list.push('teal'); }
    for (i = 0; i < w.nC; i++) { list.push('coral'); }
    var add = 0;
    for (i = 0; i < list.length; i++) {
      var c = coins[i];
      if (c) {
        if (c.kind !== list[i]) { if (animate) { c.next = list[i]; c.flip = 0; c.fdelay = i * 0.02; } else { c.kind = list[i]; } }
      } else {
        coins.push({ kind: list[i], y: animate ? -(H + 40 + add * 26) : 0, vy: 0, delay: animate ? add * 0.055 + (list[i] === 'coral' ? 0.18 : 0) : 0, x: 0, vx: 0, hop: 0, vh: 0, flip: 1, landed: !animate });
        add++;
      }
    }
    while (coins.length > list.length) {
      var o = coins.pop();
      if (animate) {
        o.ox = G.x + o.x; o.oy = slotY(coins.length) + o.y + o.hop; o.vx = (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 160); o.vy = -(260 + Math.random() * 220);
        o.a = 0; o.va = (Math.random() - 0.5) * 10; o.age = 0; gone.push(o);
      }
    }
    mark.st.t = w.nT; mark.need.t = w.f.need / COIN;
    if (!animate) { mark.st.x = mark.st.t; mark.need.x = mark.need.t; }
    kick();
  }

  /* ------------------------------------------------- the frame -- */
  var raf = 0, last = 0, onScreen = true, t0 = 0, calm = 0;
  function kick() { calm = 0; if (!raf && onScreen && !document.hidden && cx) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    if (!W || !G) { size(); }
    if (W < 120 || H < 120) { return; }
    var moving = step(now, dt);
    draw(now);
    calm = moving ? 0 : calm + dt;
    if (K.motion() && onScreen && !document.hidden && (calm < 0.8 || ptr.in)) { raf = requestAnimationFrame(frame); }
  }
  function step(now, dt) {
    if (!K.motion()) {
      coins.forEach(function (c) { c.y = 0; c.vy = 0; c.x = 0; c.hop = 0; c.flip = 1; if (c.next) { c.kind = c.next; c.next = null; } c.landed = true; });
      gone = []; mark.st.x = mark.st.t; mark.need.x = mark.need.t; return false;
    }
    var moving = false, n = Math.max(1, coins.length);
    /* the pointer leans the tower away; a flick pushes it */
    var lt = 0;
    if (ptr.in) {
      var dx = G.x - ptr.x, near = Math.max(0, 1 - Math.abs(dx) / (G.w * 2.2));
      lt = (dx > 0 ? 1 : -1) * near * 22;
    }
    lean.v += (90 * (lt - lean.x) - 9 * lean.v) * dt; lean.x += lean.v * dt;
    if (Math.abs(lean.v) > 0.5 || Math.abs(lt - lean.x) > 0.3) { moving = true; }
    coins.forEach(function (c, i) {
      var h = (i + 1) / n, tx = lean.x * Math.pow(h, 1.5) + Math.sin(now * 1.4 + i * 0.22) * 0.8 * h;
      c.vx += (230 * (tx - c.x) - 11 * c.vx) * dt; c.x += c.vx * dt;
      if (Math.abs(c.vx) > 1) { moving = true; }
      if (c.delay > 0) { c.delay -= dt; moving = true; return; }
      if (!c.landed) {
        moving = true; c.vy += 2600 * dt; c.y += c.vy * dt;
        if (c.y >= 0) {
          c.y = 0;
          if (c.vy > 260) { c.vy = -c.vy * 0.22; c.squash = 1; } else { c.vy = 0; c.landed = true; }
          if (fx && !c.rang) { c.rang = true; fx.ring(G.x + c.x, slotY(i) + G.ry * 0.2, c.kind === 'coral' ? 'rgba(229,122,96,.8)' : 'rgba(20,203,177,.7)', G.w * 0.4); }
        }
      }
      if (c.vh || c.hop) { c.vh += 2600 * dt; c.hop += c.vh * dt; if (c.hop > 0) { c.hop = 0; c.vh = Math.abs(c.vh) > 120 ? -c.vh * 0.2 : 0; } moving = true; }
      if (c.squash) { c.squash = Math.max(0, c.squash - dt * 5); moving = true; }
      if (c.flip < 1) { c.fdelay = (c.fdelay || 0) - dt; if (c.fdelay <= 0) { c.flip = Math.min(1, c.flip + dt * 5); if (c.flip >= 0.5 && c.next) { c.kind = c.next; c.next = null; } } moving = true; }
    });
    gone = gone.filter(function (o) { o.age += dt; o.vy += 1800 * dt; o.ox += o.vx * dt; o.oy += o.vy * dt; o.a += o.va * dt; return o.age < 1.1; });
    if (gone.length) { moving = true; }
    mark.st.step(dt); mark.need.step(dt);
    if (!mark.st.done() || !mark.need.done()) { moving = true; }
    if (fx) { fx.step(dt); if (fx.busy()) { moving = true; } }
    return moving;
  }
  function draw(now) {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var g = G, n = coins.length;
    /* the floor */
    var sh = cx.createRadialGradient(g.x, g.base + 2, 2, g.x, g.base + 2, g.w * 0.9);
    sh.addColorStop(0, 'rgba(11,31,28,.16)'); sh.addColorStop(1, 'rgba(11,31,28,0)');
    cx.fillStyle = sh; cx.beginPath(); cx.ellipse(g.x, g.base + 2, g.w * 0.9, g.ry * 0.9, 0, 0, Math.PI * 2); cx.fill();
    /* the brackets: the State's coins, then the gap (or what is spare) */
    /* the brackets grow with the coins that have landed, not ahead of them */
    var nT = 0, nAll = 0;
    for (var q = 0; q < n; q++) { var cq = coins[q]; if (cq.delay > 0 || !cq.landed) { break; } nAll = q + 1; if (cq.kind === 'teal' && !cq.next) { nT = q + 1; } }
    var bx = g.x + g.w / 2 + 16, yb = g.base - g.ry, yst = yb - Math.min(mark.st.x, nT) * g.e, yneed = yb - (mark.need.x > nAll + 0.5 ? nAll : mark.need.x) * g.e;
    var covered = sec.classList.contains('pb-g2-is-covered');
    bracket(bx, yb, yst, '#0FB39C');
    if (!covered) { bracket(bx, yst - 3, yneed, '#E07A60'); }
    /* the line for what the life costs */
    cx.save(); cx.setLineDash([5, 5]); cx.lineWidth = 1.5; cx.strokeStyle = 'rgba(11,31,28,.45)';
    cx.beginPath(); cx.moveTo(g.x - g.w / 2 - 10, yneed); cx.lineTo(bx + 6, yneed); cx.stroke(); cx.restore();
    /* the coins, bottom up */
    for (var i = 0; i < n; i++) {
      var c = coins[i]; if (c.delay > 0) { continue; }
      var y = slotY(i) + c.y + c.hop, fl = c.flip < 1 ? Math.abs(Math.cos(c.flip * Math.PI)) : 1;
      var w = g.w * fl * (1 + (c.squash || 0) * 0.06);
      C.slice(cx, g.x + c.x, y, w, c.kind, c.kind === 'coral' ? 0.95 : 1, i === n - 1 && c.landed && fl > 0.9);
    }
    /* a slow glint up the gap, so it is never still for long */
    gone.forEach(function (o) { var k = o.age / 1.1; cx.save(); cx.translate(o.ox, o.oy); cx.rotate(o.a); C.slice(cx, 0, 0, g.w * (1 - k * 0.3), o.kind, 1 - k); cx.restore(); });
    if (fx) { fx.draw(cx); }
    place(bx, yb, yst, yneed, covered);
  }
  function bracket(x, y0, y1, col) {
    if (Math.abs(y1 - y0) < 2) { return; }
    cx.save(); cx.strokeStyle = col; cx.lineWidth = 2.5; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(x - 6, y0); cx.lineTo(x, y0); cx.lineTo(x, y1); cx.lineTo(x - 6, y1); cx.stroke(); cx.restore();
  }
  /* the words beside the tower follow it */
  function place(bx, yb, yst, yneed, covered) {
    if (!key.need) { return; }
    var lx = bx + 14, SP = 62, mGap = (yst + yneed) / 2, mSt = (yb + yst) / 2, yN, yG, yS = mSt;
    if (covered) {
      /* the life's line in the middle of the State's coins; what is spare above the tower */
      yN = yneed; yG = Math.min(yst, yN) - SP;
    } else {
      yG = mGap; yN = Math.min(yneed - 26, yG - SP);
    }
    if (yS - Math.max(yG, yN) < SP) { yS = Math.max(yG, yN) + SP; }
    var hi = Math.min(yN, yG);
    if (hi < 30) { var sh = 30 - hi; yN += sh; yG += sh; yS += sh; }
    [['need', yN], ['gap', yG], ['st', yS]].forEach(function (p) { key[p[0]].style.setProperty('--x', lx.toFixed(1) + 'px'); key[p[0]].style.setProperty('--y', p[1].toFixed(1) + 'px'); });
  }

  /* ------------------------------------------------- the pointer -- */
  function local(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  if (cv) {
    cv.addEventListener('pointermove', function (e) {
      var p = local(e), t = performance.now() / 1000;
      ptr.vx = (p.x - ptr.lx) / Math.max(0.008, t - ptr.lt); ptr.lx = p.x; ptr.lt = t;
      ptr.x = p.x; ptr.y = p.y; ptr.in = true;
      /* a fast pass across the tower pushes it */
      if (G && Math.abs(p.x - G.x) < G.w * 0.6 && Math.abs(ptr.vx) > 600) { lean.v += Math.max(-900, Math.min(900, ptr.vx * 0.25)); }
      kick();
    });
    cv.addEventListener('pointerleave', function () { ptr.in = false; kick(); });
    cv.addEventListener('pointerdown', function (e) {
      if (!K.motion() || !G) { return; }
      var p = local(e), now = performance.now() / 1000;
      coins.forEach(function (c, i) { setTimeout(function () { c.vh = -(260 + Math.random() * 80) * (0.6 + 0.4 * (i / coins.length)); kick(); }, i * 22); });
      if (fx) {
        var topY = slotY(Math.max(0, coins.length - 1)) - G.ry;
        setTimeout(function () { fx.paws(G.x, topY, 7); fx.spark(G.x, topY, 10); kick(); }, coins.length * 22);
        fx.ring(p.x, p.y, 'rgba(20,203,177,.8)', 30);
      }
      lean.v += (p.x < G.x ? 1 : -1) * 160;
      kick();
    });
  }

  /* ------------------------------------------------- the answers -- */
  var lv = K.seg(pick.querySelector('.pb-g2-lv'), function (b) { K.setAim(b.getAttribute('data-level'), K.aim.hh, 'gap'); });
  var hh = K.seg(pick.querySelector('.pb-g2-hh'), function (b) { K.setAim(K.aim.level, b.getAttribute('data-hh'), 'gap'); });
  document.addEventListener('pb:aim', function (e) {
    var d = e.detail || {};
    lv.press(function (b) { return b.getAttribute('data-level') === d.level; }, d.by === 'gap');
    hh.press(function (b) { return b.getAttribute('data-hh') === d.hh; }, d.by === 'gap');
    words(true);
    if (C && cx && seen) { sync(K.motion()); }
  });
  pick.hidden = false; lv.place(true); hh.place(true);
  words(false);

  /* ------------------------------------------------- housekeeping -- */
  if (!C || !cx) { return; }
  chart.classList.add('pb-g2-live');
  window.addEventListener('resize', function () { W = 0; G = null; kick(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; G = null; kick(); }); }
  document.addEventListener('visibilitychange', kick);
  document.addEventListener('pb:motion', kick);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting;
      if (onScreen && !seen) {
        seen = true; size();
        /* the first look: the tower builds itself, unless it was on screen
           before the page settled (then it is simply there) */
        sync(K.motion() && built);
        if (K.motion() && built) {
          var ans = $('pbG2Ans'); setTimeout(function () { ans.classList.remove('pb-g2-stamp'); void ans.offsetWidth; ans.classList.add(sec.classList.contains('pb-g2-is-covered') ? 'pb-g2-yay' : 'pb-g2-stamp'); }, 900);
        }
      }
      if (onScreen) { W = 0; kick(); }
    }, { threshold: 0.25 }).observe(chart);
  } else { seen = true; size(); sync(false); }
  /* below the fold at load: build it when it arrives */
  function settle() { var r = chart.getBoundingClientRect(); built = !(r.top < innerHeight && r.bottom > 0); }
  if (document.readyState === 'complete') { settle(); } else { addEventListener('load', settle); }
  t0 = performance.now() / 1000;
}());
