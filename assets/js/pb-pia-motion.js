/* The PIA page's "Where the tax comes in", played (9 October 2026, Damian's
   brief). A module of the pia record in tools/pagebuild.py; it copies the
   figures the page's own script writes into that table and works nothing
   out.

   Three tubes, one for each column of the table (pension, PIA, ETF), on one
   scale, filled in the table's own order, one row at a time:

     From your take-home pay   your money pours in (ink)
     Tax relief going in       Revenue's relief on top (amber; the pension)
     Tax while it grows        it grows (slate), and that tax drips away
     Tax on the way out        that tax is lifted off the top
     Left after tax            what is left, with its figure

   The row playing is lit in the table under it. These are the table's
   stages, not its years: the tubes say how much, never when. A tube with
   no figure (the PIA, until there is one) stands empty and says so. It
   plays when it comes into view and again after the figures change; tap a
   tube or "Play it again" to replay, or a row of the table to see that
   stage. With motion turned off none of this is added. */
(function () {
  'use strict';
  var root = document.documentElement, $ = function (id) { return document.getElementById(id); };
  var endPen = $('endPen'), table = endPen && endPen.closest('table'), card = table && table.closest('.pia-card');
  if (!card || !root.classList.contains('pb-motion') || !window.requestAnimationFrame || !window.IntersectionObserver) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function money(el) { var m = /€\s*([\d,]+)/.exec((el && el.textContent) || ''); return m ? +m[1].replace(/,/g, '') : null; }
  var rows = [].slice.call(table.tBodies[0].rows);
  /* the table's cells, column by column: paid, relief, tax while it grows, tax on the way out, left */
  var TUBES = ['Pension', 'PIA', 'ETF'].map(function (name, i) {
    return { name: name, cells: rows.map(function (r) { return r.cells[i + 1]; }), sp: [], next: 0 };
  });
  var INK = '#54635F', AMBER = '#F4B740', GROW = '#8A97A8';

  /* the table itself carries every figure; the tubes and their button are a picture of it */
  var stage = document.createElement('div'); stage.className = 'pb-pia-stage'; stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = '<canvas class="pb-pia-cv"></canvas><p class="pb-pia-bar"><button type="button" class="pb-pia-play" tabindex="-1">Play it again</button></p>';
  table.classList.add('pb-pia-t');
  var h3 = card.querySelector('h3'); card.insertBefore(stage, h3.nextSibling);
  var cv = stage.querySelector('canvas'), cx = cv.getContext('2d'), play = stage.querySelector('.pb-pia-play');
  var W = 0, H = 0, dpr = 1, T = 0, playing = false, sig = '', changedAt = 0, scale = 0, lit = -1;
  var STAGES = ['Going in', 'Growing', 'Coming out'];
  function size() { var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  function ease(u) { u = clamp(u, 0, 1); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  /* the figures, as the table has them; a tube with no figure is empty */
  function read() {
    var s = '';
    TUBES.forEach(function (t) {
      var v = t.cells.map(money);
      t.has = v[4] !== null;
      t.paid = v[0] || 0; t.rel = v[1] || 0; t.grow = v[2] || 0; t.out = v[3] || 0; t.end = v[4] || 0;
      t.gross = Math.max(0, t.end + t.out + t.grow - t.paid - t.rel);
      s += v.join(',') + '|';
    });
    if (s !== sig) { if (sig) { changedAt = performance.now() / 1000; } sig = s; }
    scale = Math.max(1, Math.max.apply(null, TUBES.map(function (t) { return t.has ? Math.max(t.paid + t.rel, t.paid + t.rel + t.gross) : 0; }))) * 1.08;
  }
  /* the value in a tube at time T: one table row a beat */
  function value(t) {
    if (!t.has) { return 0; }
    var b = Math.floor(T), u = ease(T - b);
    if (T < 1) { return t.paid * u; }
    if (T < 2) { return t.paid + t.rel * u; }
    if (T < 3) { return t.paid + t.rel + t.gross * u - t.grow * clamp((T - 2.25) / 0.75, 0, 1); }
    if (T < 4) { return t.end + t.out * (1 - u); }
    return t.end;
  }
  var raf = 0, last = 0, onScreen = false;
  function frame(ms) {
    raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    if (!W) { size(); }
    read();
    /* after the figures settle, play again */
    if (changedAt && now - changedAt > 0.7 && onScreen) { changedAt = 0; T = 0; playing = true; }
    if (playing) { T += dt / 1.15; if (T >= 5) { T = 5; playing = false; } }
    var row = Math.min(4, Math.floor(T));
    if (row !== lit) { lit = row; rows.forEach(function (r, i) { r.classList.toggle('pb-pia-now', i === row); }); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (W > 120 && H > 140) { draw(now, dt); }
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function draw(now, dt) {
    var top = 62, bot = H - 34, hm = bot - top - 8;
    /* the three stages, the one playing in ink */
    var seg = W / 3, st = T < 2 ? 0 : T < 3 ? 1 : 2;
    cx.font = '700 16px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
    STAGES.forEach(function (s, i) {
      var on = i === st && T < 5, done = i < st || T >= 5;
      cx.fillStyle = on ? '#0B1F1C' : done ? '#54635F' : '#8A9794'; cx.fillText(s, seg * (i + 0.5), 20);
      cx.fillStyle = done || on ? '#0B1F1C' : '#E3E8E6'; rr(seg * i + 8, 30, seg - 16, 5, 3); cx.fill();
      if (on) { var f = clamp(i === 0 ? T / 2 : i === 1 ? T - 2 : T - 3, 0, 1); cx.fillStyle = '#14CBB1'; rr(seg * i + 8, 30, (seg - 16) * f, 5, 3); cx.fill(); }
    });
    var gap = W / 3, tw = clamp(gap * 0.46, 40, 92);
    TUBES.forEach(function (t, i) {
      var x = gap * (i + 0.5), l = x - tw / 2, V = value(t), k = hm / scale;
      /* the glass */
      cx.save(); rr(l, top, tw, bot - top, 14); cx.clip(); cx.fillStyle = 'rgba(11,31,28,.035)'; cx.fillRect(l, top, tw, bot - top);
      if (t.has) {
        /* the layers, filled in order: yours, Revenue's relief, the growth */
        var parts = [[t.paid, INK], [t.rel, AMBER], [Infinity, GROW]], y = bot - 4, left = V;
        parts.forEach(function (p, j) {
          var h = Math.min(Math.max(0, left), p[0]) * k; left -= p[0];
          if (h <= 0.2) { return; }
          var yt = y - h, surf = left <= 0;
          cx.beginPath(); cx.moveTo(l, y);
          for (var px = l; px <= l + tw + 3; px += 3) { cx.lineTo(px, yt + (surf ? Math.sin(px * 0.1 + now * 3 + i) * 1.8 : 0)); }
          cx.lineTo(l + tw, y); cx.closePath(); cx.fillStyle = p[1]; cx.fill();
          y = yt;
        });
        t.surf = y;
      }
      cx.restore();
      rr(l, top, tw, bot - top, 14); cx.lineWidth = 3;
      if (!t.has) { cx.save(); cx.setLineDash([5, 6]); cx.strokeStyle = 'rgba(11,31,28,.3)'; cx.stroke(); cx.restore(); }
      else { cx.strokeStyle = 'rgba(11,31,28,.22)'; cx.stroke(); }
      cx.save(); cx.globalAlpha = 0.5; cx.strokeStyle = '#fff'; cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(l + 9, top + 14); cx.lineTo(l + 9, bot - 14); cx.stroke(); cx.restore();
      /* coins pour in for the first two rows; tax drips away while it grows; the last tax lifts off */
      if (t.has && playing) {
        var want = T < 1 && t.paid > 0 ? INK : T >= 1 && T < 2 && t.rel > 0 ? AMBER : null;
        if (want && now > t.next) { t.sp.push({ kind: 'coin', x: l + 10 + Math.random() * (tw - 20), y: top - 26, vy: 60, col: want }); t.next = now + 0.07; }
        if (T >= 2.25 && T < 3 && t.grow > 0 && now > t.next) { t.sp.push({ kind: 'drip', x: l + tw + 2, y: (t.surf || bot) + 6, vy: 30 }); t.next = now + 0.08; }
        if (T >= 3 && T < 3.15 && t.out > 0 && !t.lift) { t.lift = { y: t.surf || top, h: t.out * k, born: now }; }
      }
      if (T < 3) { t.lift = null; }
      if (t.lift) {
        var a = (now - t.lift.born) / 0.9;
        if (a < 1) { cx.save(); cx.globalAlpha = 1 - a; cx.fillStyle = AMBER; rr(l + 4, t.lift.y - 30 * a - 2, tw - 8, Math.max(3, t.lift.h), 6); cx.fill(); cx.restore(); }
      }
      t.sp = t.sp.filter(function (d) {
        d.vy += 900 * dt; d.y += d.vy * dt;
        if (d.kind === 'coin') {
          if (d.y > (t.surf || bot) - 4) { return false; }
          cx.fillStyle = d.col; cx.beginPath(); cx.arc(d.x, d.y, 6, 0, Math.PI * 2); cx.fill();
          cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(d.x, d.y, 3.6, 0, Math.PI * 2); cx.stroke();
          return true;
        }
        if (d.y > bot + 10) { return false; }
        cx.save(); cx.translate(d.x + (d.y - top) * 0.04, d.y); cx.fillStyle = AMBER; cx.beginPath(); cx.moveTo(0, -5); cx.quadraticCurveTo(3.5, 0, 0, 3.5); cx.quadraticCurveTo(-3.5, 0, 0, -5); cx.fill(); cx.restore();
        return true;
      });
      /* the names under, and at the end what is left, as the table says it */
      cx.fillStyle = '#0B1F1C'; cx.font = '700 16px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
      cx.fillText(t.name, x, H - 10);
      var endT = (t.cells[4].textContent || '').trim();
      if (!t.has) { cx.fillStyle = '#54635F'; cx.font = '600 16px Figtree, system-ui, sans-serif'; wrapText('No figure yet', x, (top + bot) / 2, tw + 24); }
      else if (T >= 4) { cx.globalAlpha = clamp((T - 4) * 3, 0, 1); cx.font = '800 16px Figtree, system-ui, sans-serif'; cx.fillText(endT, x, Math.max(top - 8, (t.surf || bot) - 10)); cx.globalAlpha = 1; }
    });
  }
  function wrapText(s, x, y, w) {
    var words = s.split(' '), line = '', lines = [];
    words.forEach(function (wd) { var tr = line ? line + ' ' + wd : wd; if (cx.measureText(tr).width > w && line) { lines.push(line); line = wd; } else { line = tr; } });
    lines.push(line); lines.forEach(function (ln, i) { cx.fillText(ln, x, y + (i - (lines.length - 1) / 2) * 20); });
  }
  function wake() { if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function replay() { T = 0; playing = true; changedAt = 0; TUBES.forEach(function (t) { t.sp = []; t.lift = null; }); wake(); }
  play.addEventListener('click', replay);
  cv.addEventListener('click', replay);
  /* a row of the table shows its stage */
  rows.forEach(function (r, i) { r.addEventListener('click', function () { playing = false; changedAt = 0; T = i + 0.999; wake(); }); });
  var seen = false;
  new IntersectionObserver(function (es) {
    onScreen = es[0].isIntersecting;
    if (onScreen) { W = 0; if (!seen && es[0].intersectionRatio >= 0.3) { seen = true; replay(); } wake(); }
  }, { threshold: [0, 0.35, 0.7] }).observe(cv);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', wake); window.addEventListener('focus', wake); document.addEventListener('resume', wake);
  window.addEventListener('resize', function () { W = 0; });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; }); }
}());
