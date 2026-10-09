/* The Standard Fund Threshold, alive (9 October 2026, Damian's brief). A
   module of the sft record in tools/pagebuild.py; every threshold comes from
   the page's own PBSft.threshold(), and the level is the page's own slider.

   In "Year by year", a skyline of six glasses, one for each year on the
   strip, each as tall as that year's threshold, all on one scale. Your
   pensions are one water line across all of them: a glass the line clears
   holds them with room to spare; a glass under the line overflows, and what
   spills over the rim, hatched as the page's own bar hatches the part over,
   pools at its foot. 2030's glass is open at the top: from 2030 the
   threshold is at least its 2029 figure, not a known one.

   Drag up or down to raise or lower your pensions, or tap a glass to choose
   its year: both move the page's own sliders, which stay the controls. With
   motion turned off none of this is added. */
(function () {
  'use strict';
  var root = document.documentElement, $ = function (id) { return document.getElementById(id); };
  var S = window.PBSft, lim = $('sftLim'), strip = $('sftStrip'), total = $('total'), year = $('year');
  if (!S || !lim || !strip || !total || !year || !root.classList.contains('pb-motion') || !window.requestAnimationFrame || !window.IntersectionObserver) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  var YEARS = [].map.call(strip.children, function (li) { return +li.getAttribute('data-y'); });
  var G = YEARS.map(function (y) { var t = S.threshold(y); return { y: y, thr: t.value, open: t.atLeast || y >= 2030, pop: 0, popV: 0, sp: [], next: 0, pool: 0 }; });

  var stage = document.createElement('div'); stage.className = 'pb-sft-stage'; stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = '<canvas class="pb-sft-cv"></canvas><span class="pb-sft-grip"></span><p class="pb-sft-hint">Drag the line up or down to change your pensions, or tap a glass to choose its year.</p>';
  lim.parentNode.insertBefore(stage, lim);
  var cv = stage.querySelector('canvas'), cx = cv.getContext('2d'), hint = stage.querySelector('.pb-sft-hint'), grip = stage.querySelector('.pb-sft-grip'), gripAt = '';
  var W = 0, H = 0, dpr = 1, labels = false, xs = [], gw = 40, scale = { v: 0, s: 0 }, level = { v: 0, s: 0 }, hatch = null;
  /* the glasses stand over the strip's own columns; on a phone the strip wraps, so they carry their years */
  function size() {
    var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var lis = [].slice.call(strip.children), r0 = lis[0].getBoundingClientRect(), rN = lis[lis.length - 1].getBoundingClientRect();
    labels = Math.abs(r0.top - rN.top) > 4;
    xs = lis.map(function (li, i) { if (labels) { return W * (i + 0.5) / lis.length; } var r = li.getBoundingClientRect(); return r.left + r.width / 2 - b.left; });
    gw = clamp((xs.length > 1 ? xs[1] - xs[0] : W) * 0.56, 26, 70);
    var t = document.createElement('canvas'); t.width = t.height = 8; var k = t.getContext('2d');
    k.fillStyle = '#fff'; k.fillRect(0, 0, 8, 8); k.strokeStyle = '#586B85'; k.lineWidth = 2; k.beginPath(); k.moveTo(-2, 10); k.lineTo(10, -2); k.moveTo(-2, 2); k.lineTo(2, -2); k.moveTo(6, 10); k.lineTo(10, 6); k.stroke();
    hatch = cx.createPattern(t, 'repeat');
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function floorY() { return H - (labels ? 30 : 12); }
  function hmax() { return floorY() - 30; }
  var raf = 0, last = 0, onScreen = false;
  function frame(ms) {
    raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    if (!W) { size(); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (W > 120 && H > 120) { draw(now, dt); }
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function draw(now, dt) {
    var tot = +total.value, sel = Math.min(+year.value, 2030), fl = floorY(), hm = hmax();
    /* one scale: the tallest threshold, or your pensions if they stand higher */
    var want = Math.max(G[G.length - 1].thr * 1.12, tot * 1.06);
    if (!scale.v) { scale.v = want; }
    scale.s += (90 * (want - scale.v) - 14 * scale.s) * dt; scale.v += scale.s * dt;
    level.s += (120 * (tot - level.v) - 15 * level.s) * dt; level.v += level.s * dt;
    var yw = fl - hm * Math.max(0, level.v) / scale.v;
    /* the water line: your pensions, one level across every year */
    cx.save(); cx.setLineDash([2, 6]); cx.lineCap = 'round'; cx.strokeStyle = 'rgba(88,107,133,.75)'; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(4, yw); cx.lineTo(W - 4, yw); cx.stroke(); cx.restore();
    var kx = 14, ky = clamp(yw, 14, fl - 4), gp = 'translate(' + kx + 'px,' + ky + 'px)';
    if (gp !== gripAt) { gripAt = gp; grip.style.transform = gp; }
    G.forEach(function (g, i) {
      var x = xs[i], l = x - gw / 2, rim = fl - hm * g.thr / scale.v, on = g.y === sel;
      g.popV += (200 * ((on ? 1 : 0) - g.pop) - 18 * g.popV) * dt; g.pop += g.popV * dt;
      var over = level.v > g.thr, top = over ? rim : yw;
      cx.save(); cx.translate(x, fl); cx.scale(1 + 0.05 * g.pop, 1 + 0.05 * g.pop); cx.translate(-x, -fl);
      /* the liquid, to the line or to the rim */
      cx.save(); rr(l, rim, gw, fl - rim, 8); cx.clip();
      cx.fillStyle = 'rgba(11,31,28,.035)'; cx.fillRect(l, rim, gw, fl - rim);
      cx.beginPath(); cx.moveTo(l, fl);
      for (var px = l; px <= l + gw + 3; px += 3) { cx.lineTo(px, Math.max(rim, top + Math.sin(px * 0.12 + now * 3 + i) * (over ? 1.2 : 2))); }
      cx.lineTo(l + gw, fl); cx.closePath();
      var gr = cx.createLinearGradient(0, top, 0, fl); gr.addColorStop(0, '#7A8AA0'); gr.addColorStop(1, '#586B85'); cx.fillStyle = gr; cx.fill();
      cx.restore();
      /* the glass: open-topped from 2030, the year chosen in ink */
      cx.lineWidth = on ? 3 : 2; cx.strokeStyle = on ? '#0B1F1C' : 'rgba(11,31,28,.28)';
      cx.beginPath(); cx.moveTo(l, rim); cx.lineTo(l, fl - 8); cx.arcTo(l, fl, l + 8, fl, 8); cx.lineTo(l + gw - 8, fl); cx.arcTo(l + gw, fl, l + gw, fl - 8, 8); cx.lineTo(l + gw, rim); cx.stroke();
      if (g.open) { cx.save(); cx.setLineDash([3, 5]); cx.beginPath(); cx.moveTo(l, rim); cx.lineTo(l, rim - 22); cx.moveTo(l + gw, rim); cx.lineTo(l + gw, rim - 22); cx.stroke(); cx.restore(); }
      else { cx.beginPath(); cx.moveTo(l - 3, rim); cx.lineTo(l + gw + 3, rim); cx.stroke(); }
      cx.save(); cx.globalAlpha = 0.5; cx.strokeStyle = '#fff'; cx.lineWidth = 3; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(l + 7, rim + 8); cx.lineTo(l + 7, fl - 8); cx.stroke(); cx.restore();
      cx.restore();
      /* over the rim: a spill down the side and a hatched pool at the foot */
      var ex = Math.max(0, level.v - g.thr) / scale.v;
      g.pool += ((over ? clamp(ex * 3, 0.15, 1) : 0) - g.pool) * Math.min(1, dt * 3);
      if (over && now > g.next) { g.sp.push({ t: 0, k: Math.random() }); g.next = now + 0.09; }
      g.sp = g.sp.filter(function (d) {
        d.t += dt * 1.6; if (d.t >= 1) { return false; }
        var sx = l + gw + 2 + d.t * 6, sy = rim + (fl - rim) * d.t * d.t;
        cx.fillStyle = '#586B85'; cx.globalAlpha = 0.85; cx.beginPath(); cx.arc(sx, sy, 2.4 + d.k, 0, Math.PI * 2); cx.fill(); cx.globalAlpha = 1;
        return true;
      });
      if (g.pool > 0.01) {
        var pw = gw * 0.25 + gw * 0.8 * g.pool;
        cx.beginPath(); cx.ellipse(l + gw + 4, fl + 1, pw / 2, 2 + 3 * g.pool, 0, 0, Math.PI * 2); cx.fillStyle = hatch || '#586B85'; cx.fill();
        cx.strokeStyle = '#586B85'; cx.lineWidth = 1.5; cx.stroke();
      }
      if (labels) { cx.fillStyle = on ? '#0B1F1C' : '#54635F'; cx.font = (on ? '800' : '600') + ' 16px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.fillText(String(g.y), x, H - 6); }
      g.x = x; g.l = l; g.rim = rim;
    });
    /* the line's knob, over everything: grab it to move your pensions */
    cx.save(); cx.translate(kx, ky); cx.shadowColor = 'rgba(11,31,28,.2)'; cx.shadowBlur = 6; cx.shadowOffsetY = 2;
    cx.beginPath(); cx.arc(0, 0, 11, 0, Math.PI * 2); cx.fillStyle = '#fff'; cx.fill(); cx.shadowColor = 'transparent';
    cx.lineWidth = 2.5; cx.strokeStyle = '#586B85'; cx.stroke(); cx.fillStyle = '#586B85';
    cx.beginPath(); cx.moveTo(-4, -2); cx.lineTo(0, -6.5); cx.lineTo(4, -2); cx.fill(); cx.beginPath(); cx.moveTo(-4, 2); cx.lineTo(0, 6.5); cx.lineTo(4, 2); cx.fill(); cx.restore();
  }
  function wake() { if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  function set(el, v) { if (+el.value === v) { return; } el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); hint.classList.add('pb-off'); }
  var drag = null;
  /* a mouse drags anywhere; a finger drags the knob (the canvas leaves a finger free to scroll) and taps the glasses */
  function start(e, el, grab) { drag = { y0: e.clientY, x0: e.clientX, t0: +total.value, moved: false, grab: grab }; try { el.setPointerCapture(e.pointerId); } catch (x) {} wake(); }
  grip.addEventListener('pointerdown', function (e) { e.preventDefault(); start(e, grip, true); });
  grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  cv.addEventListener('pointerdown', function (e) { start(e, cv, e.pointerType !== 'touch'); });
  cv.addEventListener('pointermove', move);
  function move(e) {
    if (!drag) { var b = cv.getBoundingClientRect(), x = e.clientX - b.left; cv.style.cursor = G.some(function (g) { return Math.abs(x - g.x) < gw / 2 + 6 && g.y >= +year.min; }) ? 'pointer' : 'ns-resize'; return; }
    var dy = e.clientY - drag.y0;
    if (Math.abs(dy) > 6 || Math.abs(e.clientX - drag.x0) > 10) { drag.moved = true; }
    if (drag.moved && drag.grab) {
      var step = +total.step || 25000, v = drag.t0 - dy / Math.max(60, hmax()) * scale.v;
      set(total, clamp(Math.round(v / step) * step, +total.min, +total.max));
    }
  }
  function end(e) {
    if (drag && !drag.moved && e.type === 'pointerup') {
      var b = cv.getBoundingClientRect(), x = e.clientX - b.left;
      G.forEach(function (g) { if (Math.abs(x - g.x) < gw / 2 + 6 && g.y >= +year.min && g.y <= +year.max) { set(year, g.y); } });
    }
    drag = null;
  }
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { W = 0; wake(); } }).observe(cv);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', wake); window.addEventListener('focus', wake); document.addEventListener('resume', wake);
  window.addEventListener('resize', function () { W = 0; });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; }); }
}());
