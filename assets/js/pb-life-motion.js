/* "Or start from a way of life", alive (9 October 2026, Damian's brief: go
   all out). The three Pensions Council standards, Modest, Moderate and
   Comfortable, as three cards that are each a small work of their own. The
   page's own script (index.html, A WAY OF LIFE) still sets every figure and
   the slider; this only draws and moves.

   - Each card holds a stack of coins as tall as its yearly figure, on the
     same scale for all three. The coins under the State Pension's line are
     aqua, the State's (two State Pensions for a couple); the ones above it
     are the gap, in the chart's pink. The stack builds itself coin by coin
     the first time it is seen, sways when you hover, and a glint runs up it.
   - The cards tilt toward the pointer in 3D, with a light that follows it.
   - Choose one and its coins fly up into the chart above, which takes them
     with a pulse; the chosen card's stack glows.
   - Single or Couple turns the cards over, one after another, to their new
     figures.
   - The month, category by category, pours in: rows slide in one after
     another and their bars grow, and the amounts roll.

   With motion turned off none of this is drawn. */
(function () {
  'use strict';
  var root = document.documentElement;
  var life = document.getElementById('pbLife');
  var LS = window.PBLivingStandards, SP = window.PBStatePension;
  if (!life || !LS || !root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  var cards = [].slice.call(life.querySelectorAll('.pb-life-card'));
  if (!cards.length) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function household() { var c = document.getElementById('pbLifeCouple'); return c && c.getAttribute('aria-pressed') === 'true' ? 'couple' : 'single'; }
  /* the State Pension at the maximum rate, a year: one, or two for a couple, as the chart counts it */
  function statePension(hh) { var one = SP ? SP.MAX_WEEKLY_CENTS * SP.WEEKS_PER_YEAR / 100 : 15564; return hh === 'couple' ? 2 * one : one; }

  /* ------------------------------------------------------- the stacks -- */
  var arts = cards.map(function (card) {
    var cv = document.createElement('canvas'); cv.className = 'pb-lc-art'; cv.setAttribute('aria-hidden', 'true');
    card.insertBefore(cv, card.firstChild);
    var sheen = document.createElement('span'); sheen.className = 'pb-lc-sheen'; sheen.setAttribute('aria-hidden', 'true');
    card.appendChild(sheen);
    card.classList.add('pb-lc');
    return { card: card, cv: cv, cx: cv.getContext('2d'), level: card.getAttribute('data-level'), shown: 0, want: 0, v: 0, built: 0, hover: 0, hv: 0,
      tilt: { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }, glint: -1, W: 0, H: 0 };
  });
  var COINS = 26;   /* the tallest stack, Comfortable for this household, is this many coins */
  function figures() {
    var hh = household(), top = 0;
    arts.forEach(function (a) { a.annual = LS.standard(a.level, hh).annual; top = Math.max(top, a.annual); });
    var v = top / COINS, sp = statePension(hh);
    arts.forEach(function (a) { a.coinV = v; a.want = a.annual / v; a.sp = sp / v; });
  }
  function size(a) {
    var b = a.cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    a.W = b.width; a.H = b.height; a.cv.width = Math.round(a.W * d); a.cv.height = Math.round(a.H * d); a.d = d;
  }
  function draw(a, now) {
    var cx = a.cx, W = a.W, H = a.H; if (!W) { return; }
    cx.setTransform(a.d, 0, 0, a.d, 0, 0); cx.clearRect(0, 0, W, H);
    var base = H - 8, th = (H - 22) / (COINS + 1), cw = Math.min(64, W * 0.34), x0 = 18 + cw / 2;
    var n = Math.max(0, a.shown), whole = Math.floor(n), chosen = a.card.getAttribute('aria-pressed') === 'true';
    /* the floor */
    cx.fillStyle = 'rgba(11,31,28,.08)'; cx.beginPath(); cx.ellipse(x0, base + 2, cw * 0.62, 5, 0, 0, Math.PI * 2); cx.fill();
    for (var i = 0; i < Math.ceil(n); i++) {
      var built = clamp((now - a.built) * 30 - i, 0, 1);
      if (built <= 0) { break; }
      var drop = (1 - built) * (1 - built) * 40;
      var sway = Math.sin(now * 2.2 + i * 0.35) * (1.2 + a.hover * 3) * (i / COINS);
      var y = base - i * th - th / 2 - drop, x = x0 + sway, frac = i + 1 > n ? n - i : 1;
      var state = i + 0.5 < a.sp, col = state ? ['#16C9B0', '#0E9E8A'] : ['#F7C6B7', '#E59C86'];
      if (chosen && !state) { var p = 0.5 + 0.5 * Math.sin(now * 5); col = ['rgba(247,198,183,1)', 'rgba(' + Math.round(229 - 20 * p) + ',' + Math.round(156 - 30 * p) + ',134,1)']; }
      cx.save(); cx.globalAlpha = built * (frac < 1 ? frac : 1);
      /* a coin, side on: an edge and a face */
      cx.fillStyle = col[1]; cx.beginPath(); cx.ellipse(x, y + th * 0.3, cw / 2, th * 0.55, 0, 0, Math.PI * 2); cx.fill();
      cx.fillStyle = col[0]; cx.beginPath(); cx.ellipse(x, y - th * 0.05, cw / 2, th * 0.5, 0, 0, Math.PI * 2); cx.fill();
      /* the glint, running up the stack */
      if (a.glint >= 0) { var gi = (now - a.glint) * 40 - i; if (gi > 0 && gi < 3) { cx.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - Math.abs(gi - 1.5) / 1.5)).toFixed(2) + ')'; cx.beginPath(); cx.ellipse(x, y - th * 0.05, cw / 2, th * 0.5, 0, 0, Math.PI * 2); cx.fill(); } }
      cx.restore();
    }
    /* the State Pension's line, and what is above it */
    var ly = base - a.sp * th, lx1 = x0 + cw / 2 + 8;
    /* the labels arrive with the coins they name: the State's under its line,
       the gap over it, so the two never meet */
    var la = clamp((now - a.built) * 30 - Math.min(a.sp, n), 0, 1), top = base - n * th;
    if (la > 0) {
      cx.save(); cx.globalAlpha = la; cx.font = '700 12px Figtree, system-ui, sans-serif'; cx.textAlign = 'left';
      var sl = household() === 'couple' ? 'Two State Pensions' : 'State Pension', room = W - lx1 - 6;
      var two = cx.measureText(sl).width > room, cut = sl.lastIndexOf(' ');
      if (a.sp < n + 0.5) {
        cx.strokeStyle = '#0E9E8A'; cx.lineWidth = 2; cx.setLineDash([5, 4]); cx.beginPath(); cx.moveTo(10, ly); cx.lineTo(W - 10, ly); cx.stroke(); cx.setLineDash([]);
        cx.fillStyle = '#0B5C52'; cx.textBaseline = 'top';
        if (two) { cx.fillText(sl.slice(0, cut), lx1, ly + 4); cx.fillText(sl.slice(cut + 1), lx1, ly + 18); } else { cx.fillText(sl, lx1, ly + 4); }
        if (n - a.sp > 0.6) { cx.fillStyle = '#B4553C'; cx.textBaseline = 'bottom'; cx.fillText('The gap', lx1, ly - 4); }
      } else {
        /* the State's line is over the whole stack: it is covered */
        cx.fillStyle = '#0B5C52'; cx.textBaseline = 'bottom';
        cx.fillText('Covered by', lx1, top + 10); cx.fillText(two ? sl.slice(0, cut) : sl, lx1, top + 24); if (two) { cx.fillText(sl.slice(cut + 1), lx1, top + 38); }
      }
      cx.restore();
    }
  }

  /* ------------------------------------------------------------ tilt -- */
  arts.forEach(function (a) {
    var c = a.card;
    c.addEventListener('pointermove', function (e) {
      var b = c.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
      a.tilt.tx = (py - 0.5) * -14; a.tilt.ty = (px - 0.5) * 16; a.hover = 1;
      c.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      if (a.glint < 0 || performance.now() / 1000 - a.glint > 1.6) { a.glint = performance.now() / 1000; }
      wake();
    });
    c.addEventListener('pointerleave', function () { a.tilt.tx = a.tilt.ty = 0; a.hover = 0; wake(); });
    c.addEventListener('pointerdown', function () { c.classList.remove('pb-lc-press'); void c.offsetWidth; c.classList.add('pb-lc-press'); });
    c.addEventListener('click', function () {
      /* after the page's own handler: chosen now? then the coins go up into the chart */
      setTimeout(function () { if (c.getAttribute('aria-pressed') === 'true') { launch(a); } wake(); }, 0);
    });
  });

  /* ------------------------------------------- coins up into the chart -- */
  var fly = null, fcx = null, bits = [];
  function launch(a) {
    var tgt = document.querySelector('#pbGap .pb-gap-need .pb-gap-stage') || document.getElementById('pbGap');
    if (!tgt) { return; }
    if (!fly) { fly = document.createElement('canvas'); fly.className = 'pb-lc-fly'; fly.setAttribute('aria-hidden', 'true'); document.body.appendChild(fly); fcx = fly.getContext('2d'); }
    var d = Math.min(window.devicePixelRatio || 1, 2); fly.width = Math.round(innerWidth * d); fly.height = Math.round(innerHeight * d);
    var s = a.cv.getBoundingClientRect(), t = tgt.getBoundingClientRect(), now = performance.now() / 1000;
    for (var i = 0; i < 18; i++) {
      var state = i < 18 * clamp(a.sp / a.want, 0, 1);
      bits.push({ x0: s.left + s.width * 0.25 + (Math.random() - 0.5) * 30, y0: s.top + s.height * (0.3 + Math.random() * 0.6),
        x1: t.left + t.width * (0.2 + Math.random() * 0.6), y1: t.top + Math.random() * 20,
        cx1: s.left + (Math.random() - 0.5) * 300, cy1: Math.min(s.top, t.top) - 120 - Math.random() * 160,
        born: now + i * 0.035, dur: 0.75 + Math.random() * 0.25, c: state ? '#16C9B0' : '#F2B8A8', tgt: tgt });
    }
    loopFly();
  }
  var fraf = 0;
  function loopFly() {
    if (fraf) { return; }
    fraf = requestAnimationFrame(function step() {
      fraf = 0;
      var now = performance.now() / 1000, d = Math.min(window.devicePixelRatio || 1, 2);
      fcx.setTransform(d, 0, 0, d, 0, 0); fcx.clearRect(0, 0, innerWidth, innerHeight);
      var landed = false;
      bits = bits.filter(function (b) {
        var k = (now - b.born) / b.dur; if (k < 0) { return true; }
        if (k >= 1) { landed = b.tgt; return false; }
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, u = 1 - e;
        var x = u * u * b.x0 + 2 * u * e * b.cx1 + e * e * b.x1, y = u * u * b.y0 + 2 * u * e * b.cy1 + e * e * b.y1;
        fcx.save(); fcx.translate(x, y); fcx.scale(Math.cos(now * 12 + b.x0), 1); fcx.fillStyle = b.c; fcx.beginPath(); fcx.arc(0, 0, 8 * (1 - k * 0.4), 0, Math.PI * 2); fcx.fill();
        fcx.strokeStyle = 'rgba(255,255,255,.6)'; fcx.lineWidth = 1.5; fcx.beginPath(); fcx.arc(0, 0, 5 * (1 - k * 0.4), 0, Math.PI * 2); fcx.stroke(); fcx.restore();
        return true;
      });
      if (landed) { var g = document.getElementById('pbGap'); if (g) { g.classList.remove('pb-lc-hit'); void g.offsetWidth; g.classList.add('pb-lc-hit'); } }
      if (bits.length) { loopFly(); } else { fcx.clearRect(0, 0, innerWidth, innerHeight); }
    });
  }

  /* -------------------------------------- Single or Couple: turn them over -- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#pbLifeSingle,#pbLifeCouple');
    if (!b || b.getAttribute('aria-pressed') === 'true') { return; }
    /* before the page's handler changes the figures: keep the old face to turn away */
    arts.forEach(function (a, i) {
      var old = document.createElement('span'); old.className = 'pb-lc-old'; old.setAttribute('aria-hidden', 'true');
      [].forEach.call(a.card.querySelectorAll('b,.pb-life-n,.pb-life-d'), function (n) { old.appendChild(n.cloneNode(true)); });
      a.card.appendChild(old);
      setTimeout(function () {
        a.card.classList.remove('pb-lc-flip'); void a.card.offsetWidth; a.card.classList.add('pb-lc-flip');
        setTimeout(function () { a.built = performance.now() / 1000 - 0.2; a.shown = 0; }, 350);
        setTimeout(function () { if (old.parentNode) { old.parentNode.removeChild(old); } a.card.classList.remove('pb-lc-flip'); }, 760);
      }, i * 110);
    });
    setTimeout(function () { figures(); wake(); }, 0);
  }, true);

  /* ------------------------------------------------- the month, pouring -- */
  var rows = document.getElementById('pbLifeRows');
  if (rows) {
    new MutationObserver(function () {
      [].forEach.call(rows.children, function (li, i) {
        if (li.classList.contains('pb-lr')) { return; }
        li.classList.add('pb-lr'); li.style.animationDelay = (i * 55) + 'ms';
        var bar = li.querySelector('i'); if (bar) { bar.style.animationDelay = (120 + i * 55) + 'ms'; }
      });
    }).observe(rows, { childList: true });
  }

  /* ------------------------------------------------------------- loop -- */
  var raf = 0, last = 0, onScreen = false;
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now, busy = false;
    arts.forEach(function (a) {
      if (!a.W) { size(a); }
      if (!a.built) { return; }
      /* the stack's height springs to its figure */
      var acc = 120 * (a.want - a.shown) - 16 * a.v; a.v += acc * dt; a.shown += a.v * dt;
      var t = a.tilt;
      t.vx += (220 * (t.tx - t.x) - 20 * t.vx) * dt; t.x += t.vx * dt;
      t.vy += (220 * (t.ty - t.y) - 20 * t.vy) * dt; t.y += t.vy * dt;
      a.card.style.transform = 'perspective(800px) rotateX(' + t.x.toFixed(2) + 'deg) rotateY(' + t.y.toFixed(2) + 'deg) translateZ(' + (Math.abs(t.x) + Math.abs(t.y)).toFixed(1) + 'px)';
      draw(a, now);
    });
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  var busy = false;
  function wake() { if (!raf && onScreen) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  figures();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[0].isIntersecting;
      if (onScreen) {
        var now = performance.now() / 1000;
        /* the first time: each stack builds itself, one card after another */
        arts.forEach(function (a, i) { if (!a.built) { a.built = now + 0.25 + i * 0.35; a.shown = a.want; } });
        wake();
      }
    }, { threshold: 0.25 }).observe(life);
  }
  window.addEventListener('resize', function () { arts.forEach(function (a) { a.W = 0; }); wake(); });
}());
