/* The auto-enrolment comparison, alive (9 October 2026, Damian's brief). A
   module of the compare record in tools/pagebuild.py; it copies the figures
   the page's own script writes and works nothing out.

   After "Side by side", two jars on one scale, one for each way in, filled in
   layers by who puts the money in this year:

     auto-enrolment     what it costs you (#aeNet), your employer
                        (#aeEmployer), the State (#aeState)
     personal pension   what it costs you (#ppNet), your employer
                        (#ppEmployer), tax relief from Revenue (#ppRelief)

   Each jar's layers add up to its total on the page (#aeTotal, #ppTotal):
   the personal pension's "You pay in" is what it costs you plus Revenue's
   relief. The reader's own money is ink, the employer's a light slate, the
   State's teal (teal is only ever the State's money) and Revenue's amber.

   Coins of each colour rain in. Move a slider and the layers spring to their
   new sizes under a fresh shower. Point at a jar, or press it, and its
   layers pull apart; point at a layer, or at a line of the key, and that
   source lights up in both jars. The jars stand over their own columns of
   the key, which carries every figure as text, at the calculators' 16px. With motion turned off none of
   this is added. */
(function () {
  'use strict';
  var root = document.documentElement, $ = function (id) { return document.getElementById(id); };
  var after = $('pbScaleCard');
  if (!after || !$('aeNet') || !$('ppNet') || !$('ppRelief') || !root.classList.contains('pb-motion') || !window.requestAnimationFrame || !window.IntersectionObserver) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function money(id) { var m = /€\s*([\d,]+)/.exec(($(id) || {}).textContent || ''); return m ? +m[1].replace(/,/g, '') : 0; }

  var ROWS = [
    { key: 'you', label: 'Costs you', col: '#2C3B38', ids: ['aeNet', 'ppNet'] },
    { key: 'emp', label: 'Your employer', col: '#A9B4C2', ids: ['aeEmployer', 'ppEmployer'] },
    { key: 'state', label: 'The State', col: '#16C9B0', ids: ['aeState', null] },
    { key: 'rev', label: 'Tax relief from Revenue', col: '#F4B740', ids: [null, 'ppRelief'] }
  ];
  var JARS = [{ name: 'Auto-enrolment', total: 'aeTotal' }, { name: 'Personal pension', total: 'ppTotal' }];
  JARS.forEach(function (j, i) {
    j.layers = ROWS.filter(function (r) { return r.ids[i]; }).map(function (r) { return { row: r, id: r.ids[i], h: 0, v: 0, top: 0, bot: 0 }; });
    j.open = 0; j.openV = 0; j.hover = false; j.pinned = false; j.next = 0; j.cx = 0; j.w = 0;
  });

  /* the card: a title, the jars, and the key under them */
  var card = document.createElement('div'); card.className = 'pb-cmp-card'; card.setAttribute('aria-hidden', 'true');
  var html = '<p class="pb-cmp-t">Who puts the money in, this year</p><div class="pb-cmp-key"><p class="pb-cmp-hint">Tap a jar to pull its layers apart.</p><canvas class="pb-cmp-cv"></canvas><span></span>';
  JARS.forEach(function (j) { html += '<span class="pb-cmp-h">' + j.name + '</span>'; });
  ROWS.forEach(function (r) {
    html += '<span class="pb-cmp-l" data-k="' + r.key + '"><i style="background:' + r.col + '"></i>' + r.label + '</span>';
    r.ids.forEach(function (id) { html += id ? '<span class="pb-cmp-v" data-k="' + r.key + '" data-id="' + id + '"></span>' : '<span class="pb-cmp-v pb-cmp-none" data-k="' + r.key + '">None</span>'; });
  });
  html += '<span class="pb-cmp-l pb-cmp-tot">Into your pension</span>';
  JARS.forEach(function (j) { html += '<span class="pb-cmp-v pb-cmp-tot" data-id="' + j.total + '"></span>'; });
  card.innerHTML = html + '</div>';
  after.parentNode.insertBefore(card, after.nextSibling);

  var cv = card.querySelector('canvas'), cx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, coins = [], rings = [];
  var hint = card.querySelector('.pb-cmp-hint'), heads = card.querySelectorAll('.pb-cmp-h'), cells = [].slice.call(card.querySelectorAll('[data-id]')), keyed = [].slice.call(card.querySelectorAll('[data-k]'));
  var hl = null, shownHl = '', vals = {}, sig = '', shower = 0, raf = 0, last = 0, onScreen = false;
  /* the jars stand over their own column of the key */
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    JARS.forEach(function (j, i) { var h = heads[i].getBoundingClientRect(); j.cx = h.left + h.width / 2 - b.left; j.w = clamp(h.width - 12, 44, 150); });
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  /* the page's figures, copied as the page wrote them; a change pours a shower */
  function read(now) {
    var s = '';
    cells.forEach(function (c) { var id = c.getAttribute('data-id'); vals[id] = money(id); s += vals[id] + ','; });
    if (s !== sig) {
      if (sig) { shower = now + 1.2; }
      sig = s;
      cells.forEach(function (c) { c.textContent = (($(c.getAttribute('data-id')) || {}).textContent || '').trim(); });
    }
    var want = hl || '';
    if (want !== shownHl) { shownHl = want; keyed.forEach(function (el) { el.classList.toggle('pb-on', el.getAttribute('data-k') === want); }); card.classList.toggle('pb-cmp-hl', !!want); }
  }
  function sum(j) { return j.layers.reduce(function (s, L) { return s + (vals[L.id] || 0); }, 0); }
  function frame(ms) {
    raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    if (!W) { size(); }
    read(now);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (W > 80 && H > 80) { draw(now, dt); }
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function draw(now, dt) {
    var top = 30, bot = H - 6, inner = bot - top - 12, big = Math.max(1, sum(JARS[0]), sum(JARS[1]));
    /* one wave for every boundary in a jar, so a layer with nothing in it vanishes cleanly */
    JARS.forEach(function (j, i) {
      var l = j.cx - j.w / 2, r = j.cx + j.w / 2, n = j.layers.length, base = bot - 4;
      j.openV += (170 * ((j.hover || j.pinned ? 1 : 0) - j.open) - 17 * j.openV) * dt; j.open += j.openV * dt;
      var gap = 10 * clamp(j.open, 0, 1.4), amp = 2.2 * clamp(sum(j) / big * inner / 26, 0, 1);
      var wave = function (x) { return Math.sin(x * 0.07 + now * 2.6 + i * 2) * amp + Math.sin(x * 0.045 - now * 1.7) * amp * 0.5; };
      cx.save(); rr(l, top, j.w, bot - top, 16); cx.clip();
      cx.fillStyle = 'rgba(11,31,28,.035)'; cx.fillRect(l, top, j.w, bot - top);
      var edge = base;
      j.layers.forEach(function (L, k) {
        var want = (vals[L.id] || 0) / big * inner * 0.84;
        L.v += (110 * (want - L.h) - 13 * L.v) * dt; L.h += L.v * dt;
        var lo = edge, hi = edge - Math.max(0, L.h), up = k * gap;
        cx.globalAlpha = hl && hl !== L.row.key ? 0.26 : 1;
        cx.beginPath();
        for (var x = l; x <= r + 3; x += 3) { var yb = k ? lo + wave(x) : lo, yt = Math.min(hi + wave(x), yb); cx[x === l ? 'moveTo' : 'lineTo'](x, yt - up); }
        for (var x2 = r + 3; x2 >= l - 3; x2 -= 3) { cx.lineTo(x2, (k ? lo + wave(x2) : lo) - up); }
        cx.closePath(); cx.fillStyle = L.row.col; cx.fill();
        if (hl === L.row.key && L.h > 2) { cx.globalAlpha = 0.35 + 0.25 * Math.sin(now * 5); cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.stroke(); }
        L.top = hi - up; L.bot = lo - up; edge = hi;
      });
      cx.globalAlpha = 1; cx.restore();
      /* the glass, and its shine */
      rr(l, top, j.w, bot - top, 16); cx.lineWidth = 3; cx.strokeStyle = j.hover || j.pinned ? '#0B1F1C' : 'rgba(11,31,28,.22)'; cx.stroke();
      cx.save(); cx.globalAlpha = 0.5; cx.strokeStyle = '#fff'; cx.lineWidth = 5; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(l + 11, top + 16); cx.lineTo(l + 11, bot - 16); cx.stroke(); cx.restore();
      /* coins: a trickle, and a shower after a change; each colour as often as its share */
      var t = sum(j);
      if (t > 0 && now > j.next) {
        var pick = Math.random() * t, acc = 0, col = j.layers[0].row.col;
        j.layers.forEach(function (L) { var v = vals[L.id] || 0; if (pick >= acc && pick < acc + v) { col = L.row.col; } acc += v; });
        coins.push({ x: l + 14 + Math.random() * Math.max(1, j.w - 28), y: -8, vy: 30 + Math.random() * 40, a: Math.random() * 6, col: col, j: i });
        j.next = now + (now < shower ? 0.07 : 0.5) * (0.6 + Math.random() * 0.8);
      }
    });
    coins = coins.filter(function (c) {
      var j = JARS[c.j], surf = j.layers.length ? Math.min.apply(null, j.layers.map(function (L) { return L.top; })) : bot;
      c.vy += 900 * dt; c.y += c.vy * dt; c.a += dt * 7;
      if (c.y > surf - 4) { rings.push({ x: c.x, y: surf, col: c.col, born: now }); return false; }
      cx.save(); cx.translate(c.x, c.y); cx.scale(Math.cos(c.a), 1); cx.fillStyle = c.col; cx.beginPath(); cx.arc(0, 0, 7, 0, Math.PI * 2); cx.fill();
      cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.lineWidth = 1.4; cx.beginPath(); cx.arc(0, 0, 4.2, 0, Math.PI * 2); cx.stroke(); cx.restore();
      return true;
    });
    rings = rings.filter(function (g) {
      var a = (now - g.born) / 0.45; if (a >= 1) { return false; }
      cx.save(); cx.globalAlpha = 1 - a; cx.strokeStyle = g.col; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(g.x, g.y, 4 + a * 14, 1.5 + a * 4, 0, 0, Math.PI * 2); cx.stroke(); cx.restore();
      return true;
    });
  }
  function wake() { if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }

  /* pointing: a jar opens, a layer lights; pressing pins a jar open and pours */
  function at(e) {
    var b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, hit = null;
    JARS.forEach(function (j, i) { if (x > j.cx - j.w / 2 - 10 && x < j.cx + j.w / 2 + 10) { hit = { j: j, i: i, key: null }; j.layers.forEach(function (L) { if (y <= L.bot + 3 && y >= L.top - 3 && L.bot - L.top > 1) { hit.key = L.row.key; } }); } });
    return hit;
  }
  cv.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') { return; }
    var h = at(e); JARS.forEach(function (j) { j.hover = !!h && h.j === j; }); hl = h && h.key; cv.style.cursor = h ? 'pointer' : '';
  });
  /* a finger leaves the screen when it lifts; that is not pointing away */
  cv.addEventListener('pointerleave', function (e) { if (e.pointerType === 'touch') { return; } JARS.forEach(function (j) { j.hover = false; }); hl = null; });
  cv.addEventListener('pointerdown', function (e) {
    var h = at(e); if (!h) { return; }
    h.j.pinned = !h.j.pinned; shower = performance.now() / 1000 + 0.6; h.j.next = 0; hint.classList.add('pb-off');
    if (e.pointerType === 'touch') { hl = h.j.pinned ? h.key : null; }
    wake();
  });
  keyed.forEach(function (el) {
    var k = el.getAttribute('data-k');
    el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { hl = k; } });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') { hl = null; } });
    el.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') { hl = hl === k ? null : k; wake(); } });
  });
  new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { W = 0; shower = performance.now() / 1000 + 1.4; wake(); } }).observe(cv);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', wake); window.addEventListener('focus', wake); document.addEventListener('resume', wake);
  window.addEventListener('resize', function () { W = 0; });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; }); }
}());
