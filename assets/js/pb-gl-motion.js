/* The jargon buster, alive (9 October 2026, Damian's brief; made calm on
   12 October 2026: "it is quite buggy on the jargon buster, all the
   different terms coming up, it is all over the place").

   What was wrong: every term's name was scrambled into random letters,
   wider than the real ones, so the scramble wrapped onto a second line over
   the definition; at the same time assets/js/pb-alive.js flew each card up
   in 3D on a spring, several at once, and left blank holes while they
   waited. Now:

   - The terms arrive one at a time, in reading order: each card fades up a
     few pixels, nothing more, about a tenth of a second after the one
     before. A card already on screen, one scrolled past, and the card a
     link lands on are simply there. The words never change, so nothing
     wraps, overlaps or jumps. pb-alive.js (which runs after this) leaves
     these cards and the two game cards alone (pb-al-skip).
   - A term that is an abbreviation then opens its plain words: the pill
     beside "AVC" draws open, left to right, to "Additional Voluntary
     Contribution". That is the whole bust.
   - Inflation: two baskets, each bought with the same €1,000. Today's is
     full; the one "in N years" holds only what that €1,000 will buy then,
     filled to the share the page's own sentence gives (€552 of €1,000, at
     its defaults). Move a slider and the shopping drops in or out.
   - Drawdown: a pot with a tap, dripping the month's money into a cup; the
     bigger the pot, the faster the drip. The figure is the page's own
     sentence.

   With motion turned off none of this runs, and every card is just there. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function money(t) { var m = /€\s*([\d,]+)/.exec(t || ''); return m ? +m[1].replace(/,/g, '') : 0; }

  /* ------------------------------------------------- the terms arrive -- */
  /* anything the motion system calls a caveat, or a block that names the
     regulator or the credential, is never held back (pb-alive.js's rule) */
  var CAV = (window.PBMotion && window.PBMotion.CAVEATS) || '.pb-caveat,.pb-warn,.pb-reg,.pb-reviewed,.pb-src';
  var REG = /Central\s+Bank\s+of\s+Ireland|Qualified\s+Financial\s+Adviser|\bQFA\b|\bQ\.\s*F\.\s*A\b/;
  function caveat(el) { try { return !!el.closest(CAV) || !!el.querySelector(CAV) || REG.test(el.textContent || ''); } catch (e) { return true; } }

  var cards = [].slice.call(document.querySelectorAll('.gterm, .arc-card'));
  var waiting = [], queue = [], timer = 0;
  cards.forEach(function (c) {
    c.classList.add('pb-al-skip');
    var h = c.querySelector(':scope > h2'); if (h) { h.classList.add('pb-al-skip'); }
    if (caveat(c) || !c.offsetHeight) { return; }
    if (c.getBoundingClientRect().top < innerHeight * 0.94) { return; }
    c.classList.add('pb-gl-wait');
    waiting.push(c);
  });

  function show(c, still) {
    var i = waiting.indexOf(c); if (i < 0) { return; }
    waiting.splice(i, 1);
    var q = queue.indexOf(c); if (q >= 0) { queue.splice(q, 1); }
    if (io) { io.unobserve(c); }
    if (still) { c.classList.remove('pb-gl-wait'); return; }
    /* a pill that wraps onto a second line fades in instead: a wipe across
       two lines would show the end of the words before the start */
    var a = c.querySelector('.abbr');
    if (a) { a.classList.toggle('pb-gl-2l', a.getClientRects().length > 1); }
    c.classList.add('pb-gl-in');
    c.classList.remove('pb-gl-wait');
    setTimeout(function () { c.classList.remove('pb-gl-in'); }, 1400);
  }
  function byPage(a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; }
  /* one card at a time; a reader racing down the page is never kept waiting */
  function pump() {
    timer = 0;
    var c = queue.shift();
    if (!c) { return; }
    show(c, false);
    if (queue.length) { timer = setTimeout(pump, queue.length > 3 ? 45 : 110); }
  }
  function enqueue(c) {
    if (waiting.indexOf(c) < 0 || queue.indexOf(c) >= 0) { return; }
    queue.push(c); queue.sort(byPage);
    if (!timer) { pump(); }
  }
  function all(still) { waiting.slice().forEach(function (c) { show(c, still); }); queue = []; }

  var io = null;
  if (waiting.length && window.IntersectionObserver) {
    io = new IntersectionObserver(function (es) {
      es.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; }).sort(byPage).forEach(enqueue);
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    waiting.forEach(function (c) { io.observe(c); });
  } else { all(true); }

  /* a card scrolled clean past (a jump, a fast fling) is simply there */
  var sq = 0;
  function past() { sq = 0; waiting.slice().forEach(function (c) { if (c.getBoundingClientRect().bottom < 0) { show(c, true); } }); }
  addEventListener('scroll', function () { if (!sq && waiting.length) { sq = requestAnimationFrame(past); } }, { passive: true });
  /* the card a link lands on, and every card before it, is there on arrival */
  function landed() {
    var id = '', t;
    try { id = decodeURIComponent((location.hash || '').slice(1)); } catch (e) { return; }
    t = id && document.getElementById(id);
    if (!t || !t.classList.contains('gterm')) { return; }
    waiting.slice().forEach(function (c) { if (c === t || byPage(c, t) < 0) { show(c, true); } });
  }
  landed();
  addEventListener('hashchange', landed);
  addEventListener('pageshow', function () { landed(); past(); });
  document.addEventListener('pb:motion', function (ev) { if (ev.detail && !ev.detail.motion) { all(true); } });

  /* --------------------------------------------- a small canvas helper -- */
  function Scene(host, before, cls, draw) {
    if (!host) { return; }
    var cv = document.createElement('canvas'); cv.className = 'pb-gl-cv ' + cls; cv.setAttribute('aria-hidden', 'true');
    host.insertBefore(cv, before || null);
    var cx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, raf = 0, last = 0, on = false;
    function size() { var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    function frame(ms) {
      raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
      if (!W) { size(); }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      if (W > 100 && H > 60) { draw(cx, W, H, now, dt); }
      if (on && !document.hidden) { raf = requestAnimationFrame(frame); }
    }
    function wake() { if (!raf && on && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
    if (window.IntersectionObserver) { new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) { W = 0; wake(); } }).observe(cv); }
    document.addEventListener('visibilitychange', wake); window.addEventListener('pageshow', wake);
    window.addEventListener('resize', function () { W = 0; });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; }); }
    return cv;
  }
  function rr(cx, x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

  /* ------------------------------------------- inflation: two baskets -- */
  var infl = document.getElementById('pbInfl'), inflOut = document.getElementById('pbInflOut');
  if (infl && inflOut) {
    var share = { v: 1, s: 0 }, ITEMS = [], cols = ['#F4B740', '#586B85', '#E59C86', '#7FE3D3', '#8A97A8', '#2C3B38'];
    for (var i = 0; i < 24; i++) { ITEMS.push({ c: cols[i % cols.length], k: (i * 7) % 5, r: 0.8 + ((i * 13) % 5) / 10 }); }
    Scene(infl, inflOut, 'pb-gl-infl', function (cx, W, H, now, dt) {
      var b = inflOut.querySelectorAll('b'), want = b.length > 1 ? clamp(money(b[1].textContent) / 1000, 0.02, 1) : 1;
      /* critically damped: the basket settles, it does not bounce */
      share.s += (90 * (want - share.v) - 19 * share.s) * dt; share.v += share.s * dt;
      var yrs = ((document.getElementById('pbInflYrsV') || {}).textContent || '').trim();
      [1, share.v].forEach(function (fill, j) {
        var c = W * (j ? 0.72 : 0.28), bw = Math.min(150, W * 0.34), bh = H * 0.42, top = H - 30 - bh, l = c - bw / 2;
        /* the shopping, as much as the money buys */
        var n = Math.round(ITEMS.length * clamp(fill, 0, 1));
        cx.save(); cx.beginPath(); cx.moveTo(l - 6, top - H); cx.lineTo(l + bw + 6, top - H); cx.lineTo(l + bw - 8, top + bh); cx.lineTo(l + 8, top + bh); cx.closePath(); cx.clip();
        for (var q = 0; q < n; q++) {
          var it = ITEMS[q], row = Math.floor(q / 6), col = q % 6, x = l + 16 + col * (bw - 32) / 5, y = top + bh - 14 - row * 17;
          cx.fillStyle = it.c; cx.beginPath();
          if (it.k === 0) { rr(cx, x - 7, y - 11, 14, 20, 3); } else if (it.k === 1) { cx.ellipse(x, y, 9 * it.r, 7 * it.r, 0.3, 0, Math.PI * 2); } else { cx.arc(x, y, 8 * it.r, 0, Math.PI * 2); }
          cx.fill();
        }
        cx.restore();
        /* the basket */
        cx.strokeStyle = '#0B1F1C'; cx.lineWidth = 3; cx.lineJoin = 'round';
        cx.beginPath(); cx.moveTo(l - 4, top); cx.lineTo(l + bw + 4, top); cx.lineTo(l + bw - 8, top + bh); cx.lineTo(l + 8, top + bh); cx.closePath(); cx.stroke();
        cx.beginPath(); cx.moveTo(l + 14, top); cx.quadraticCurveTo(c, top - bh * 0.75, l + bw - 14, top); cx.stroke();
        cx.globalAlpha = 0.25; for (var s = 1; s < 4; s++) { cx.beginPath(); cx.moveTo(l + 2 + s * 2, top + bh * s / 4); cx.lineTo(l + bw - 2 - s * 2, top + bh * s / 4); cx.stroke(); } cx.globalAlpha = 1;
        /* the same note over both, held still */
        var nx = c - 32, ny = 8;
        cx.fillStyle = '#E3F7F2'; cx.strokeStyle = '#0B7A6E'; cx.lineWidth = 2; rr(cx, nx, ny, 64, 32, 5); cx.fill(); cx.stroke();
        cx.fillStyle = '#0B1F1C'; cx.font = '800 16px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('€1,000', c, ny + 16);
        cx.fillStyle = '#54635F'; cx.font = '600 16px Figtree, system-ui, sans-serif'; cx.textBaseline = 'alphabetic';
        cx.fillText(j ? (yrs ? 'In ' + yrs : 'Then') : 'Today', c, H - 6);
      });
    });
  }

  /* ---------------------------------------------- drawdown: the tap -- */
  var dd = document.getElementById('pbDd'), ddOut = dd && dd.querySelector('.pb-dd-out'), pot = document.getElementById('pbDdPot');
  if (dd && ddOut && pot) {
    var drops = [], next = 0, lvl = { v: 0, s: 0 }, cup = 0;
    Scene(dd, ddOut, 'pb-gl-dd', function (cx, W, H, now, dt) {
      var p = +pot.value, lo = +pot.min || 5000, hi = +pot.max || 1500000, f = clamp(Math.log(p / lo) / Math.log(hi / lo), 0, 1);
      var month = money((document.getElementById('pbDdOut') || {}).textContent);
      lvl.s += (100 * (0.18 + 0.72 * f - lvl.v) - 20 * lvl.s) * dt; lvl.v += lvl.s * dt;
      var jw = Math.min(110, W * 0.28), jh = H - 34, jx = W * 0.4 - jw / 2 - 30, jy = 8, y = jy + jh - jh * lvl.v;
      /* the pot */
      cx.save(); rr(cx, jx, jy, jw, jh, 14); cx.clip(); cx.fillStyle = 'rgba(11,31,28,.04)'; cx.fillRect(jx, jy, jw, jh);
      cx.beginPath(); cx.moveTo(jx, jy + jh); for (var x = jx; x <= jx + jw + 3; x += 3) { cx.lineTo(x, y + Math.sin(x * 0.08 + now * 1.6) * 1.5); } cx.lineTo(jx + jw, jy + jh); cx.closePath();
      var g = cx.createLinearGradient(0, y, 0, jy + jh); g.addColorStop(0, '#7A8AA0'); g.addColorStop(1, '#586B85'); cx.fillStyle = g; cx.fill(); cx.restore();
      rr(cx, jx, jy, jw, jh, 14); cx.lineWidth = 3; cx.strokeStyle = 'rgba(11,31,28,.25)'; cx.stroke();
      /* the tap, low on the pot's side, and a cup on the ground well below it */
      var tx = jx + jw, ty = jy + jh * 0.58, sx = tx + 34;
      cx.fillStyle = '#0B1F1C'; rr(cx, tx - 2, ty - 6, 40, 12, 4); cx.fill(); rr(cx, sx - 6, ty - 2, 12, 16, 3); cx.fill();
      var cupY = H - 6, cupTop = cupY - 20;
      var rate = clamp(Math.sqrt(Math.max(1, month) / 120), 0.5, 4);
      if (month > 0 && now > next) { drops.push({ y: ty + 16, vy: 30 }); next = now + 1 / rate; }
      drops = drops.filter(function (d) {
        d.vy += 700 * dt; d.y += d.vy * dt;
        if (d.y > cupTop) { cup = 1; return false; }
        cx.fillStyle = '#586B85'; cx.beginPath(); cx.ellipse(sx, d.y, 5, 6, 0, 0, Math.PI * 2); cx.fill();
        return true;
      });
      cup = Math.max(0, cup - dt * 5);
      /* the ground, and the cup on it, which gives a little as each drop lands */
      cx.strokeStyle = 'rgba(11,31,28,.12)'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(jx - 10, cupY + 1); cx.lineTo(sx + 50, cupY + 1); cx.stroke();
      cx.save(); cx.translate(sx, cupY); cx.scale(1 + cup * 0.05, 1 - cup * 0.04);
      cx.fillStyle = '#fff'; cx.strokeStyle = '#0B1F1C'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(-20, -20); cx.lineTo(20, -20); cx.lineTo(15, 0); cx.lineTo(-15, 0); cx.closePath(); cx.fill(); cx.stroke();
      cx.restore();
    });
  }
}());
