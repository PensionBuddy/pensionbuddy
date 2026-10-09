/* The audience pages' heroes, alive (9 October 2026, Damian's brief): each a
   scene of its own, behind its headline, on one canvas.

     <header class="hero aud-hero"><div class="wrap hero-grid" data-pb-scene="starter|tracker|director">
   (on the wrapper, so the header's own tag stays as build check 46 reads it)

   - starter: "Tax relief is there at any age." Tap anywhere and your coin
     drops in; Revenue's coin drops in straight after it. A pile builds up.
   - tracker: "The pension didn't." Seven pension pots are hidden round the
     hero; a torch finds them. Move it (or tap where to shine it), and tap a
     pot to find it. The count of found pots sits top right.
   - director: "Your profit is sitting in the company account." Tap, hold,
     or grab and throw: coins fly from the company account into your pension.

   Every scene: the headline's words spring in, "the pension didn't" and the
   others get a teal sweep under them, and a line says what to try. Coins and
   pots are pictures: no scene shows a figure. Colours keep their meanings:
   the reader's own money ink-2, Revenue's amber (as on the calculators'
   "You really pay" and "Revenue adds"). With motion turned off nothing is
   drawn and the hero is as it was. */
(function () {
  'use strict';
  var root = document.documentElement;
  var mark = document.querySelector('.aud-hero [data-pb-scene]'), hero = mark && mark.closest('.aud-hero');
  if (!hero || !root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  var kind = mark.getAttribute('data-pb-scene');
  var cv = document.createElement('canvas'); cv.className = 'pb-scene-cv'; cv.setAttribute('aria-hidden', 'true');
  hero.insertBefore(cv, hero.firstChild);
  var cx = cv.getContext('2d'); if (!cx) { return; }
  hero.classList.add('pb-scene', 'pb-scene-' + kind);
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  var W = 0, H = 0, dpr = 1, now = 0, copyBox = null;
  function size() {
    var b = hero.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var c = hero.querySelector('.pb-hero-copy'), r = c ? c.getBoundingClientRect() : null;
    copyBox = r ? { l: r.left - b.left, t: r.top - b.top, r: r.right - b.left, b: r.bottom - b.top } : null;
  }

  /* ---------------------------------------------- the headline's words -- */
  var h1 = hero.querySelector('h1'), n = 0;
  if (h1) {
    (function wrap(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          /* a full stop straight after a highlighted phrase stays on its line: it joins the last word */
          var lead = /^[.,!?;:\u2019']+/.exec(c.textContent), prev = c.previousSibling;
          if (lead && prev && prev.nodeType === 1) {
            var words = prev.querySelectorAll('.pb-word'), lastW = words[words.length - 1];
            if (lastW) { lastW.textContent += lead[0]; c.textContent = c.textContent.slice(lead[0].length); }
          }
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) { return; }
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement('span'); s.className = 'pb-word'; s.style.animationDelay = (120 + n++ * 70) + 'ms'; s.textContent = w; frag.appendChild(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) { wrap(c); }
      });
    })(h1);
    h1.classList.add('pb-words');
    setTimeout(function () { h1.classList.add('pb-words-done'); }, 200 + n * 70 + 500);
  }
  var hint = document.createElement('p'); hint.className = 'pb-scene-hint'; hint.setAttribute('aria-hidden', 'true');
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  hint.textContent = {
    starter: coarse ? 'Tap anywhere: your coin, then Revenue’s.' : 'Click anywhere: your coin goes in, then Revenue’s.',
    tracker: coarse ? 'Tap to shine the torch. Tap a pot to find it.' : 'Move the torch to find the pots. Click one to find it.',
    director: coarse ? 'Tap, or hold, to move money into your pension.' : 'Click, hold, or grab a coin and throw it into your pension.'
  }[kind] || '';
  hero.appendChild(hint);
  setTimeout(function () { hint.classList.add('pb-on'); }, 1600);

  /* ------------------------------------------------------ the drawings -- */
  var YOU = ['#54635F', '#3E4A47'], REV = ['#F4B740', '#C98A12'];
  function coin(x, y, r, col, a, sx, alpha) {
    /* a shrinking coin never asks for a negative radius (a canvas throws, and the frame stops) */
    if (!(r > 1)) { return; }
    cx.save(); cx.globalAlpha = alpha === undefined ? 1 : alpha; cx.translate(x, y); cx.rotate(a || 0); cx.scale(sx === undefined ? 1 : sx, 1);
    cx.beginPath(); cx.arc(0, 0, r, 0, Math.PI * 2); cx.fillStyle = col[1]; cx.fill();
    cx.beginPath(); cx.arc(0, -1.5, Math.max(0, r - 2), 0, Math.PI * 2); cx.fillStyle = col[0]; cx.fill();
    if (r > 7) {
      cx.beginPath(); cx.arc(0, -1.5, r - 5.5, 0, Math.PI * 2); cx.lineWidth = 1.5; cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.stroke();
      cx.fillStyle = '#fff'; cx.font = '700 ' + Math.round(r * 1.05) + 'px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText('€', 0, -0.5);
    }
    cx.restore();
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function label(t, x, y, col, size, weight) {
    cx.fillStyle = col || '#54635F'; cx.font = (weight || 600) + ' ' + (size || 14) + 'px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText(t, x, y);
  }

  /* ------------------------------------------- coins, and their physics -- */
  var coins = [], R = 16;
  function step(dt, walls) {
    var g = 1500, i, j;
    coins.forEach(function (c) {
      if (c.held || now < c.born) { return; }
      c.vy += g * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; c.va *= Math.pow(0.3, dt);
      walls(c);
    });
    for (i = 0; i < coins.length; i++) {
      for (j = i + 1; j < coins.length; j++) {
        var a = coins[i], b = coins[j]; if (a.gone || b.gone || now < a.born || now < b.born) { continue; }
        var dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, m = a.r + b.r - 0.5;
        if (d2 < m * m && d2 > 0.01) {
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, p = (m - d) / 2;
          if (!a.held) { a.x -= nx * p; a.y -= ny * p; } if (!b.held) { b.x += nx * p; b.y += ny * p; }
          var rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) { var k = -rel * 0.55; if (!a.held) { a.vx -= nx * k; a.vy -= ny * k; } if (!b.held) { b.vx += nx * k; b.vy += ny * k; } }
        }
      }
    }
  }
  function floorWalls(c) {
    var fl = H - 10 - c.r;
    if (c.y > fl) { c.y = fl; c.vy = -Math.abs(c.vy) * 0.3; c.vx *= 0.86; }
    if (c.x < c.r) { c.x = c.r; c.vx = Math.abs(c.vx) * 0.5; }
    if (c.x > W - c.r) { c.x = W - c.r; c.vx = -Math.abs(c.vx) * 0.5; }
  }
  function drop(x, y, col, delay) { coins.push({ x: x, y: y, vx: (Math.random() - 0.5) * 60, vy: 0, a: Math.random() * 6, va: (Math.random() - 0.5) * 8, r: R, col: col, born: now + (delay || 0), gone: 0 }); }

  /* =============================================================== starter */
  var tags = [];
  var starter = {
    init: function () { R = W < 600 ? 13 : 16; for (var i = 0; i < 6; i++) { this.pair(W * (0.15 + 0.7 * Math.random()), -30 - i * 40, i * 0.32); } },
    pair: function (x, y, d) {
      drop(x, y, YOU, d); drop(x + (Math.random() - 0.5) * 8, y - 50, REV, (d || 0) + 0.28);
      tags.push({ c: coins[coins.length - 1], born: now + (d || 0) + 0.28, t: '+ Revenue' });
      if (coins.length > 90) { coins.slice(0, coins.length - 90).forEach(function (c) { c.gone = c.gone || now; }); }
    },
    tap: function (x, y) { this.pair(x, Math.min(y, H * 0.5) - 20, 0); },
    step: function (dt) { step(dt, floorWalls); },
    draw: function () {
      coins.forEach(function (c) { if (now < c.born) { return; } var f = c.gone ? 1 - (now - c.gone) / 0.4 : 1; if (f > 0) { coin(c.x, c.y, c.r, c.col, c.a, 1, f); } });
      tags = tags.filter(function (t) {
        var a = now - t.born; if (a < 0) { return true; } if (a > 1.4) { return false; }
        cx.save(); cx.globalAlpha = Math.min(1, (1.4 - a) / 0.5); label(t.t, t.c.x, t.c.y - t.c.r - 10, '#A06A00', 14, 800); cx.restore(); return true;
      });
    }
  };

  /* =============================================================== tracker */
  var KINDS = ['From a job', 'A PRSA', 'Bond (PRB)', 'Top-ups (AVCs)', 'First job', 'Personal pension', 'Old scheme'];
  var pots = [], light = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }, found = 0, lastMove = -99, allDone = 0;
  var tracker = {
    init: function () {
      /* places for the pots: round the hero, clear of the words */
      var seed = 7, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      var cand = [], m = 46;
      for (var y = 70; y < H - 50; y += 38) {
        for (var x = 50; x < W - 50; x += 38) {
          var cb = copyBox, inCopy = cb && x > cb.l - m && x < cb.r + m && y > cb.t - m && y < cb.b + m;
          if (!inCopy) { cand.push({ x: x + (rnd() - 0.5) * 20, y: y + (rnd() - 0.5) * 20 }); }
        }
      }
      pots = [];
      for (var k = 0; k < KINDS.length && cand.length; k++) {
        /* the candidate furthest from the pots already placed */
        var best = null, bd = -1;
        cand.forEach(function (c) { var d = pots.reduce(function (s, p) { return Math.min(s, Math.hypot(p.x - c.x, p.y - c.y)); }, 1e9); d += rnd() * 30; if (d > bd) { bd = d; best = c; } });
        pots.push({ x: best.x, y: best.y, t: KINDS[k], found: 0, wob: 0, a: 0 });
        cand.splice(cand.indexOf(best), 1);
      }
      light.x = W * 0.2; light.y = H * 0.6;
    },
    tap: function (x, y) {
      var hit = pots.filter(function (p) { return !p.found && p.a > 0.35 && Math.abs(x - p.x) < 34 && Math.abs(y - p.y) < 34; })[0];
      if (hit) {
        hit.found = now; found++;
        burstAt(hit.x, hit.y, 14);
        if (found === pots.length) { allDone = now; burstAt(W / 2, H * 0.4, 50); }
      } else { light.tx = x; light.ty = y; lastMove = now; }
    },
    move: function (x, y) { light.tx = x; light.ty = y; lastMove = now; },
    step: function (dt) {
      if (now - lastMove > 3) {
        /* nobody's holding the torch: it wanders */
        light.tx = W * (0.5 + 0.42 * Math.sin(now * 0.37)); light.ty = H * (0.55 + 0.33 * Math.sin(now * 0.61 + 1));
      }
      var k = 60, c = 13;
      light.vx += (k * (light.tx - light.x) - c * light.vx) * dt; light.vy += (k * (light.ty - light.y) - c * light.vy) * dt;
      light.x += light.vx * dt; light.y += light.vy * dt;
      var LR = W < 600 ? 110 : 150;
      pots.forEach(function (p) {
        var d = Math.hypot(p.x - light.x, p.y - light.y), want = p.found ? 1 : clamp((LR - d) / (LR * 0.55), 0, 1);
        p.a += (want - p.a) * Math.min(1, dt * 10);
      });
    },
    draw: function () {
      var LR = W < 600 ? 110 : 150;
      var g = cx.createRadialGradient(light.x, light.y, 0, light.x, light.y, LR);
      g.addColorStop(0, 'rgba(244,183,64,.34)'); g.addColorStop(0.6, 'rgba(244,183,64,.12)'); g.addColorStop(1, 'rgba(244,183,64,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(light.x, light.y, LR, 0, Math.PI * 2); cx.fill();
      pots.forEach(function (p, i) {
        var tF = p.found ? clamp((now - p.found) / 0.7, 0, 1) : 0;
        /* a found pot flies to the tray, top right */
        var tx = W - 40 - (found - 1 - pots.filter(function (q, j) { return q.found && j > i; }).length) * 0, ty = 40;
        var e = 1 - Math.pow(1 - tF, 3), x = p.x + (W - 34 - (pots.filter(function (q) { return q.found && q.found < p.found; }).length) * 26 - p.x) * e;
        var y = p.y + (54 - p.y) * e - Math.sin(e * Math.PI) * 60, sc = 1 - e * 0.55;
        if (p.a < 0.02 && !p.found) { return; }
        var wob = p.found ? 0 : Math.sin(now * 8 + i) * 0.06 * p.a;
        cx.save(); cx.globalAlpha = p.found ? 1 : p.a; cx.translate(x, y); cx.rotate(wob); cx.scale(sc, sc);
        /* the pot: a jar with a lid and a paw on it */
        cx.shadowColor = 'rgba(11,31,28,.2)'; cx.shadowBlur = 12; cx.shadowOffsetY = 4;
        rr(-24, -18, 48, 40, 12); cx.fillStyle = '#586B85'; cx.fill(); cx.shadowColor = 'transparent';
        rr(-27, -25, 54, 10, 5); cx.fillStyle = '#3E4A5C'; cx.fill();
        cx.fillStyle = '#fff'; cx.font = '700 16px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('€', 0, 2);
        if (!p.found) { label(p.t, 0, 40, '#3E4A47', 13, 700); }
        cx.restore();
      });
      if (found) {
        label('Found ' + found + ' of ' + pots.length, W - 34 - (found - 1) * 13, 96, '#0B1F1C', 14, 800);
      }
      if (allDone) { var a = clamp((now - allDone) / 0.6, 0, 1); cx.save(); cx.globalAlpha = a; label('All found. Yours could be out there too.', W / 2, H - 28, '#0B1F1C', 17, 800); cx.restore(); }
    }
  };

  /* ============================================================== director */
  /* The jar knows when it is full (Damian, 9 October 2026: coins kept
     arriving in a full jar and the pile jittered). Its capacity is what fits
     above its level; when it is full it refuses more coins (the account
     shakes its head), says so, and melts the coins into its level, which
     rises: your pension, growing. Then it takes coins again. Coins that miss
     and lie on the floor fade after a few seconds. */
  var V = null, auto = 0, autoN = 0, holding = 0, held = null, lastLaunch = -9;
  var JS = { level: 0, v: 0, want: 0, full: 0, melt: 0, nope: -9, bubbles: [] };
  function jarBox() { var J = V.jar; return { l: J.x - J.w / 2, r: J.x + J.w / 2, top: J.base - J.h, floor: J.base - JS.level }; }
  function inJar(c) { var b = jarBox(); return c.x > b.l && c.x < b.r && c.y > b.top - c.r * 0.3; }
  function capacity() {
    var b = jarBox(), cols = Math.max(1, Math.floor((b.r - b.l - 4) / (2 * R))), rows = Math.max(1, Math.floor((b.floor - b.top - R * 0.6) / (R * 1.72)));
    return Math.max(4, cols * rows - 1);
  }
  var director = {
    init: function () {
      var wide = copyBox && (copyBox.l > 230), vw = wide ? clamp(copyBox.l * 0.5, 110, 170) : clamp(W * 0.26, 92, 150), vh = vw * 1.05;
      /* on a narrow screen, high enough to clear the floating Ask Buddy button at the foot of the screen */
      var base = wide ? Math.min(H - 60, copyBox.t + (copyBox.b - copyBox.t) * 0.72) : H - 118;
      var ax = wide ? copyBox.l / 2 : W * 0.06 + vw / 2, jx = wide ? copyBox.r + (W - copyBox.r) / 2 : W - W * 0.06 - vw / 2;
      V = { acct: { x: ax, w: vw, h: vh * 0.8, base: base }, jar: { x: jx, w: vw, h: vh, base: base } };
      R = clamp(vw / 9, 10, 15);
      auto = 1; autoN = 0; JS.level = JS.want = JS.v = 0; JS.full = JS.melt = 0;
    },
    launch: function () {
      if (JS.full) { JS.nope = now; return false; }
      var A = V.acct, J = V.jar;
      var x0 = A.x + (Math.random() - 0.5) * A.w * 0.5, y0 = A.base - A.h - 8;
      var tx = J.x + (Math.random() - 0.5) * J.w * 0.3, ty = J.base - J.h - 10, T = 0.85 + Math.random() * 0.15, g = 1500;
      coins.push({ x: x0, y: y0, vx: (tx - x0) / T, vy: (ty - y0 - 0.5 * g * T * T) / T, a: 0, va: 8, r: R, col: YOU, born: now, gone: 0 });
      lastLaunch = now; return true;
    },
    tap: function () { auto = 0; this.launch(); },
    step: function (dt) {
      if (auto && autoN < 8 && now - lastLaunch > 1.1) { if (this.launch()) { autoN++; } }
      if (holding && now - lastLaunch > 0.09) { this.launch(); }
      var A = V.acct, b = jarBox();
      step(dt, function (c) {
        if (c.melt) { return; }
        /* the jar's walls, and its floor: the top of its level */
        if (c.y > b.top - c.r && c.x > b.l && c.x < b.r) {
          if (c.x < b.l + c.r) { c.x = b.l + c.r; c.vx = Math.abs(c.vx) * 0.3; }
          if (c.x > b.r - c.r) { c.x = b.r - c.r; c.vx = -Math.abs(c.vx) * 0.3; }
          if (c.y > b.floor - c.r) { c.y = b.floor - c.r; c.vy = Math.abs(c.vy) < 30 ? 0 : -Math.abs(c.vy) * 0.25; c.vx *= 0.8; }
        }
        floorWalls(c);
        if (c.y >= H - 10 - c.r - 0.5 && Math.abs(c.vy) < 30) { c.vy = 0; }
        /* the account's box: coins thrown back land on it */
        var al = A.x - A.w / 2, ar = A.x + A.w / 2, at = A.base - A.h;
        if (c.x > al && c.x < ar && c.y > at - c.r && c.y < at + 10 && c.vy > 0) { c.y = at - c.r; c.vy = -Math.abs(c.vy) * 0.3; }
        /* quiet coins rest, so a full pile stands still */
        if (Math.abs(c.vx) < 6 && Math.abs(c.vy) < 6) { c.vx = 0; c.vy = 0; c.va = 0; }
      });
      var inside = coins.filter(function (c) { return !c.gone && !c.melt && now >= c.born && inJar(c); });
      /* full: no more coins, then they melt into the level */
      /* full by count, or by a resting coin at the rim, whichever comes first */
      var brim = inside.some(function (c) { return c.vy === 0 && c.y - c.r < b.top + 4; });
      if (!JS.full && (inside.length >= capacity() || brim)) {
        JS.full = now; holding = 0; auto = 0;
        /* coins still in the air when it fills vanish in a puff, rather than land on a full jar */
        coins.forEach(function (c) { if (!c.gone && now >= c.born && !inJar(c) && c.vy !== 0) { c.gone = now; burstAt(c.x, c.y, 5); } });
      }
      if (JS.full && !JS.melt && now - JS.full > 0.9) {
        JS.melt = now;
        inside.sort(function (p, q) { return p.y - q.y; }).forEach(function (c, k) { c.melt = now + k * 0.035; c.mx = c.x; c.my = c.y; });
        JS.want = Math.min(V.jar.h * 0.6, JS.level + V.jar.h * 0.13);
      }
      coins.forEach(function (c) {
        if (c.melt && !c.gone && now >= c.melt) {
          /* each coin sinks into the level as it goes */
          var k = clamp((now - c.melt) / 0.35, 0, 1); c.y = c.my + (b.floor - c.my) * k * k; c.x = c.mx + (V.jar.x - c.mx) * k * 0.3;
          if (k >= 1) { c.gone = now; JS.bubbles.push({ x: c.x, y: b.floor, born: now }); }
        }
        /* a coin that missed, lying on the floor, fades */
        if (!c.gone && !c.melt && !inJar(c) && c.vy === 0 && c.y >= H - 10 - c.r - 1) { c.rest = c.rest || now; if (now - c.rest > 2.5) { c.gone = now; } } else if (!c.melt) { c.rest = 0; }
      });
      if (JS.melt && !coins.some(function (c) { return c.melt && !c.gone; })) { JS.full = 0; JS.melt = 0; }
      JS.v += (90 * (JS.want - JS.level) - 12 * JS.v) * dt; JS.level += JS.v * dt;
    },
    draw: function () {
      var A = V.acct, J = V.jar, b = jarBox();
      /* the company account: a box with a pile of coins on it; it shakes its head at a full jar */
      var shake = now - JS.nope < 0.4 ? Math.sin((now - JS.nope) * 60) * 5 * (1 - (now - JS.nope) / 0.4) : 0;
      var al = A.x - A.w / 2 + shake, at = A.base - A.h;
      rr(al, at, A.w, A.h, 14); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = 'rgba(11,31,28,.22)'; cx.stroke();
      rr(al + A.w * 0.3, at + A.h * 0.38, A.w * 0.4, 8, 4); cx.fillStyle = 'rgba(11,31,28,.18)'; cx.fill();
      for (var i = 0; i < 9; i++) { var row = Math.floor(i / 4), col = i % 4; coin(al + A.w * (0.2 + col * 0.2) + row * A.w * 0.1, at - R * 0.8 - row * R * 1.5, R, YOU, 0, 1, 1); }
      label('Company account', A.x, A.base + 24, '#54635F', 14, 700);
      /* the level: your pension, a slate tide with a moving surface and rising bubbles */
      if (JS.level > 1) {
        var lv = b.floor;
        cx.save(); cx.beginPath(); cx.moveTo(b.l + 2, J.base - 16);
        for (var x = b.l + 2; x <= b.r - 2; x += 4) { cx.lineTo(x, lv + Math.sin(x * 0.09 + now * 3.2) * 2.5 + Math.sin(x * 0.05 - now * 2) * 1.5); }
        cx.lineTo(b.r - 2, J.base - 16); cx.quadraticCurveTo(b.r - 2, J.base - 2, b.r - 16, J.base - 2); cx.lineTo(b.l + 16, J.base - 2); cx.quadraticCurveTo(b.l + 2, J.base - 2, b.l + 2, J.base - 16);
        var g = cx.createLinearGradient(0, lv, 0, J.base); g.addColorStop(0, '#8A97A8'); g.addColorStop(1, '#586B85');
        cx.fillStyle = g; cx.fill(); cx.restore();
        JS.bubbles = JS.bubbles.filter(function (q) {
          var a = now - q.born; if (a > 1.2) { return false; }
          cx.save(); cx.globalAlpha = 0.7 * (1 - a / 1.2); cx.strokeStyle = '#fff'; cx.lineWidth = 1.5; cx.beginPath();
          cx.arc(q.x + Math.sin(a * 9 + q.x) * 3, q.y + a * Math.min(40, JS.level * 0.6), 2 + a * 3, 0, Math.PI * 2); cx.stroke(); cx.restore(); return true;
        });
      }
      /* coins in flight and in the jar */
      coins.forEach(function (c) {
        if (now < c.born) { return; }
        var f = c.gone ? 1 - (now - c.gone) / 0.35 : 1, sk = c.melt && now >= c.melt ? 1 - clamp((now - c.melt) / 0.35, 0, 1) * 0.6 : 1;
        if (f > 0) { coin(c.x, c.y, c.r * sk, c.col, c.a, 1, f); }
      });
      coins = coins.filter(function (c) { return !c.gone || now - c.gone < 0.35; });
      /* the pension: a glass jar, over the coins, glowing when full */
      var l = b.l, top = b.top, glow = JS.full ? 0.5 + 0.5 * Math.sin((now - JS.full) * 10) : 0;
      cx.save();
      if (glow) { cx.shadowColor = 'rgba(88,107,133,' + (0.6 * glow).toFixed(2) + ')'; cx.shadowBlur = 22; }
      cx.beginPath(); cx.moveTo(l, top); cx.lineTo(l, J.base - 18); cx.quadraticCurveTo(l, J.base, l + 18, J.base); cx.lineTo(l + J.w - 18, J.base); cx.quadraticCurveTo(l + J.w, J.base, l + J.w, J.base - 18); cx.lineTo(l + J.w, top);
      cx.lineWidth = 3; cx.strokeStyle = JS.full ? 'rgba(88,107,133,.9)' : 'rgba(11,31,28,.25)'; cx.stroke();
      cx.shadowColor = 'transparent';
      cx.beginPath(); cx.moveTo(l - 8, top); cx.lineTo(l + J.w + 8, top); cx.lineWidth = 6; cx.lineCap = 'round'; cx.strokeStyle = 'rgba(11,31,28,.3)'; cx.stroke();
      cx.globalAlpha = 0.45; cx.strokeStyle = '#fff'; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(l + 10, top + 14); cx.lineTo(l + 10, J.base - 20); cx.stroke();
      cx.restore();
      if (JS.full) {
        var pk = clamp((now - JS.full) / 0.25, 0, 1), sc = 0.6 + 0.4 * pk + Math.sin(pk * Math.PI) * 0.25;
        cx.save(); cx.translate(J.x, top - 18); cx.scale(sc, sc); label(JS.melt ? 'Growing' : 'Full', 0, 0, '#0B1F1C', 16, 800); cx.restore();
      }
      label('Your pension', J.x, J.base + 24, '#54635F', 14, 700);
      if (held) { coin(held.x, held.y, R, YOU, 0, 1, 1); }
    }
  };

  /* ----------------------------------------------------- shared bursts -- */
  var sparks = [];
  function burstAt(x, y, n) {
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, v = 150 + Math.random() * 380; sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, born: now, c: ['#F4B740', '#586B85', '#7FE3D3', '#0B7A6E'][i % 4], s: 3 + Math.random() * 4 }); }
  }
  function drawSparks(dt) {
    sparks = sparks.filter(function (p) {
      var a = now - p.born; if (a > 0.9) { return false; }
      p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      cx.save(); cx.globalAlpha = 1 - a / 0.9; cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, Math.PI * 2); cx.fill(); cx.restore(); return true;
    });
  }

  var S = { starter: starter, tracker: tracker, director: director }[kind];
  if (!S) { return; }

  /* ------------------------------------------------------------ input -- */
  function local(e) { var b = hero.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
  function onLink(e) { return e.target.closest && e.target.closest('a,button,input,label'); }
  hero.addEventListener('pointerdown', function (e) {
    if (onLink(e)) { return; }
    var p = local(e);
    hint.classList.remove('pb-on');
    if (kind === 'director') {
      var A = V.acct;
      if (Math.abs(p.x - A.x) < A.w / 2 + 10 && p.y > A.base - A.h - R * 4 && p.y < A.base) {
        held = { x: p.x, y: p.y, lx: p.x, ly: p.y, t: now, vx: 0, vy: 0, id: e.pointerId }; auto = 0;
        try { hero.setPointerCapture(e.pointerId); } catch (x) {}
        wake(); return;
      }
      holding = now; auto = 0; S.launch(); wake(); return;
    }
    S.tap(p.x, p.y); wake();
  });
  hero.addEventListener('pointermove', function (e) {
    var p = local(e);
    if (held && e.pointerId === held.id) {
      var dt = Math.max(0.008, now - held.t); held.vx = (p.x - held.lx) / dt; held.vy = (p.y - held.ly) / dt; held.lx = held.x = p.x; held.ly = held.y = p.y; held.t = now; wake(); return;
    }
    if (S.move && e.pointerType !== 'touch') { S.move(p.x, p.y); wake(); }
  });
  function release(e) {
    holding = 0;
    if (held && (!e || e.pointerId === held.id)) {
      if (JS.full) { JS.nope = now; } else {
        coins.push({ x: held.x, y: held.y, vx: clamp(held.vx, -2200, 2200), vy: clamp(held.vy, -2200, 2200), a: 0, va: 6, r: R, col: YOU, born: now, gone: 0 });
      }
      held = null; wake();
    }
  }
  hero.addEventListener('pointerup', release); hero.addEventListener('pointercancel', release); hero.addEventListener('pointerleave', function () { holding = 0; });

  /* ------------------------------------------------------------- loop -- */
  var raf = 0, last = 0, onScreen = true;
  function frame(ms) {
    raf = 0; now = ms / 1000;
    var dt = clamp(now - last, 0, 1 / 30); last = now;
    for (var k = 0; k < 3; k++) { S.step(dt / 3); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    S.draw(); drawSparks(dt);
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function wake() { if (!raf && onScreen) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { wake(); } }).observe(hero); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { wake(); } });
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { var oW = W; size(); if (kind !== 'starter') { coins = []; S.init(); } else { coins.forEach(function (c) { c.x *= W / (oW || W); }); } }, 150); });
  function go() { size(); now = performance.now() / 1000; S.init(); wake(); }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); } else { go(); }
}());
