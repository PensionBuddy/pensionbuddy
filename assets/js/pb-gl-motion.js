/* The jargon buster, alive (9 October 2026, Damian's brief).

   - Every term's name arrives as jargon and is busted into plain words: a
     scramble of letters settles, left to right, into the name, then a mint
     swipe passes under it. The real name is in the page the whole time,
     under the scramble (screen readers, search and links read it, and the
     line never changes its wrap); the scramble is a picture over it.
   - Inflation: two baskets, each bought with the same €1,000. Today's is
     full; the one "in N years" holds only what that €1,000 will buy then,
     filled to the share the page's own sentence gives (€552 of €1,000, at
     its defaults). Move a slider and the shopping drops in or out.
   - Drawdown: a pot with a tap, dripping the month's money; the bigger the
     pot, the faster the drip. The figure is the page's own sentence.

   With motion turned off none of this runs. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function money(t) { var m = /€\s*([\d,]+)/.exec(t || ''); return m ? +m[1].replace(/,/g, '') : 0; }

  /* ------------------------------------------------------ the decoder -- */
  var CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ€%&#$@';
  function decode(h) {
    var tn = h.firstChild; if (!tn || tn.nodeType !== 3 || !tn.nodeValue.trim() || h.querySelector('.pb-gl-w')) { return; }
    var real = tn.nodeValue, w = document.createElement('span'); w.className = 'pb-gl-w pb-gl-on';
    h.insertBefore(w, tn); w.appendChild(tn);
    var x = document.createElement('span'); x.className = 'pb-gl-x'; x.setAttribute('aria-hidden', 'true'); w.appendChild(x);
    var t0 = performance.now(), dur = 520 + real.length * 22;
    function step(ms) {
      var u = (ms - t0) / dur;
      if (u >= 1) { x.remove(); w.classList.remove('pb-gl-on'); w.classList.add('pb-gl-busted'); setTimeout(function () { w.classList.add('pb-gl-out'); }, 900); return; }
      var out = '';
      for (var i = 0; i < real.length; i++) { var c = real.charAt(i), at = 0.15 + 0.8 * i / real.length; out += /\s/.test(c) || u > at ? c : (c === c.toLowerCase() ? CH.charAt((Math.random() * CH.length) | 0).toLowerCase() : CH.charAt((Math.random() * CH.length) | 0)); }
      x.textContent = out; requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  /* the terms' names are the decoder's: assets/js/pb-alive.js (which runs
     after this) leaves a heading marked pb-al-skip alone */
  var heads = [].slice.call(document.querySelectorAll('.gterm > h2'));
  heads.forEach(function (h) { h.classList.add('pb-al-skip'); });
  if (heads.length && window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) {
      var k = 0;
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); var h = e.target; setTimeout(function () { decode(h); }, (k++) * 70); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  }

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
      share.s += (90 * (want - share.v) - 13 * share.s) * dt; share.v += share.s * dt;
      var yrs = ((document.getElementById('pbInflYrsV') || {}).textContent || '').trim();
      [1, share.v].forEach(function (fill, j) {
        var c = W * (j ? 0.72 : 0.28), bw = Math.min(150, W * 0.34), bh = H * 0.42, top = H - 30 - bh, l = c - bw / 2;
        /* the shopping, as much as the money buys */
        var n = Math.round(ITEMS.length * clamp(fill, 0, 1));
        cx.save(); cx.beginPath(); cx.moveTo(l - 6, top - H); cx.lineTo(l + bw + 6, top - H); cx.lineTo(l + bw - 8, top + bh); cx.lineTo(l + 8, top + bh); cx.closePath(); cx.clip();
        for (var q = 0; q < n; q++) {
          var it = ITEMS[q], row = Math.floor(q / 6), col = q % 6, x = l + 16 + col * (bw - 32) / 5, y = top + bh - 14 - row * 17 + Math.sin(now * 2 + q) * 0.6;
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
        /* the same note over both */
        var nx = c - 32, ny = 8 + Math.sin(now * 1.6 + j) * 2;
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
      lvl.s += (100 * (0.18 + 0.72 * f - lvl.v) - 13 * lvl.s) * dt; lvl.v += lvl.s * dt;
      var jw = Math.min(120, W * 0.3), jh = H - 30, jx = W * 0.36 - jw / 2, jy = 12, y = jy + jh - jh * lvl.v;
      /* the pot */
      cx.save(); rr(cx, jx, jy, jw, jh, 14); cx.clip(); cx.fillStyle = 'rgba(11,31,28,.04)'; cx.fillRect(jx, jy, jw, jh);
      cx.beginPath(); cx.moveTo(jx, jy + jh); for (var x = jx; x <= jx + jw + 3; x += 3) { cx.lineTo(x, y + Math.sin(x * 0.1 + now * 3) * 2); } cx.lineTo(jx + jw, jy + jh); cx.closePath();
      var g = cx.createLinearGradient(0, y, 0, jy + jh); g.addColorStop(0, '#7A8AA0'); g.addColorStop(1, '#586B85'); cx.fillStyle = g; cx.fill(); cx.restore();
      rr(cx, jx, jy, jw, jh, 14); cx.lineWidth = 3; cx.strokeStyle = 'rgba(11,31,28,.25)'; cx.stroke();
      /* the tap, and the month's money dripping from it into a cup */
      var tx = jx + jw, ty = jy + jh - 26;
      cx.fillStyle = '#0B1F1C'; rr(cx, tx - 2, ty - 6, 30, 12, 4); cx.fill(); rr(cx, tx + 20, ty - 2, 10, 16, 3); cx.fill();
      var rate = clamp(Math.sqrt(Math.max(1, month) / 120), 0.5, 7);
      if (month > 0 && now > next) { drops.push({ x: tx + 25, y: ty + 16, vy: 20 }); next = now + 1 / rate; }
      var cupX = tx + 25, cupY = H - 10;
      drops = drops.filter(function (d) {
        d.vy += 800 * dt; d.y += d.vy * dt;
        if (d.y > cupY - 16) { cup = 1; return false; }
        cx.fillStyle = '#586B85'; cx.beginPath(); cx.ellipse(d.x, d.y, 6, 6, 0, 0, Math.PI * 2); cx.fill();
        cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(d.x, d.y, 3.6, 0, Math.PI * 2); cx.stroke();
        return true;
      });
      cup = Math.max(0, cup - dt * 4);
      cx.save(); cx.translate(cupX, cupY); cx.scale(1 + cup * 0.08, 1 - cup * 0.06);
      cx.fillStyle = '#fff'; cx.strokeStyle = '#0B1F1C'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(-18, -18); cx.lineTo(18, -18); cx.lineTo(13, 0); cx.lineTo(-13, 0); cx.closePath(); cx.fill(); cx.stroke();
      cx.restore();
    });
  }
}());
