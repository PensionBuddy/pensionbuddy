/* The pension charges calculator, alive (9 October 2026, Damian's brief). A
   module of the fees record in tools/pagebuild.py; it copies the figures the
   page's own script writes (#potA, #potB, #costA, #costB, #nonePot) and
   works nothing out.

   Under "Where it goes", two jars: your plan's pot (ink, as your plan's line
   on the chart) and the other plan's (slate). A dashed line across both is
   the no-charge pot. Each jar has a leak: drops of the chart's pink fall from
   it, faster the more the charges take, into a puddle under it. The key under
   each jar names the plan, its pot, and what its charges cost by retirement.

   Press a jar and hold it and you plug its leak: it fills up to the no-charge
   line, and its key says what the pot would be with no charges. Let go and
   the leak opens again and it sinks back. Move the sliders and the levels
   and puddles follow on springs.

   With motion turned off none of this is added; the table stays as it is. */
(function () {
  'use strict';
  var root = document.documentElement;
  var card = document.querySelector('.fee-card'), $ = function (id) { return document.getElementById(id); };
  if (!card || !$('potA') || !$('nonePot') || !root.classList.contains('pb-motion') || !window.requestAnimationFrame || !window.IntersectionObserver) { return; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function money(id) { var m = /€\s*([\d,]+)/.exec(($(id) || {}).textContent || ''); return m ? +m[1].replace(/,/g, '') : 0; }
  function text(id) { return (($(id) || {}).textContent || '').trim(); }

  var stage = document.createElement('div'); stage.className = 'pb-fee-stage'; stage.setAttribute('aria-hidden', 'true');
  stage.innerHTML = '<canvas class="pb-fee-cv"></canvas><div class="pb-fee-keys">' +
    '<div class="pb-fee-k"><span class="pb-fee-n"></span><b></b><span class="pb-fee-c"></span></div>' +
    '<div class="pb-fee-k"><span class="pb-fee-n"></span><b></b><span class="pb-fee-c"></span></div></div>' +
    '<p class="pb-fee-hint">Press and hold a jar to plug its leak.</p>';
  var h3 = card.querySelector('h3'); card.insertBefore(stage, h3.nextSibling);
  var cv = stage.querySelector('canvas'), cx = cv.getContext('2d'), hint = stage.querySelector('.pb-fee-hint'), keys = stage.querySelectorAll('.pb-fee-k');
  var W = 0, H = 0, dpr = 1;
  var jars = [
    { pot: 'potA', cost: 'costA', name: 'Your plan', ink: ['#0B1F1C', '#2C3B38'] },
    { pot: 'potB', cost: 'costB', name: 'The other plan', ink: ['#586B85', '#7A8AA0'] }
  ];
  jars.forEach(function (j, i) { j.lv = 0; j.v = 0; j.pv = 0; j.puddle = 0; j.plug = 0; j.plugV = 0; j.held = false; j.nextDrop = 0; j.shown = ''; j.key = keys[i]; });
  var drops = [], splash = [];
  function size() { var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  /* each jar stands over its half of the key */
  function geom(i) { var jw = Math.min(140, W * 0.3), c = W * (0.25 + 0.5 * i), top = 44, bot = H - 58; return { l: c - jw / 2, r: c + jw / 2, w: jw, c: c, top: top, bot: bot, h: bot - top }; }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  /* the key: the page's own figures, as the page wrote them */
  function key(j) {
    var s = j.held ? 'With no charges|' + text('nonePot') + '|Charges cost you €0' : j.name + '|' + text(j.pot) + '|Charges cost you ' + text(j.cost);
    if (s === j.shown) { return; }
    j.shown = s; var p = s.split('|');
    j.key.children[0].textContent = p[0]; j.key.children[1].textContent = p[1]; j.key.children[2].textContent = p[2];
    j.key.classList.toggle('pb-on', j.held);
  }
  var raf = 0, last = 0, onScreen = false;
  function frame(ms) {
    raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    if (!W) { size(); }
    jars.forEach(key);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    if (W > 80 && H > 120) { draw(now, dt); }
    if (onScreen && !document.hidden) { raf = requestAnimationFrame(frame); }
  }
  function draw(now, dt) {
    var none = Math.max(1, money('nonePot')), maxCost = Math.max(1, money('costA'), money('costB'));
    jars.forEach(function (j, i) {
      var g = geom(i), pot = money(j.pot), cost = money(j.cost);
      /* plugged, it fills to the no-charge line; open, it sinks back to its pot */
      j.plugV += (220 * ((j.held ? 1 : 0) - j.plug) - 20 * j.plugV) * dt; j.plug += j.plugV * dt;
      var want = (pot + (none - pot) * clamp(j.plug, 0, 1)) / none;
      j.v += (120 * (want - j.lv) - 14 * j.v) * dt; j.lv += j.v * dt;
      j.pv += (60 * (cost / maxCost - j.puddle) - 11 * j.pv) * dt; j.puddle += j.pv * dt;
      var level = g.bot - g.h * clamp(j.lv, 0, 1.02);
      /* the liquid, its surface moving */
      cx.save(); rr(g.l, g.top, g.w, g.h, 16); cx.clip();
      cx.fillStyle = 'rgba(11,31,28,.035)'; cx.fillRect(g.l, g.top, g.w, g.h);
      cx.beginPath(); cx.moveTo(g.l, g.bot);
      for (var x = g.l; x <= g.r + 4; x += 4) { cx.lineTo(x, level + Math.sin(x * 0.08 + now * 3 + i) * 2.4 + Math.sin(x * 0.05 - now * 2) * 1.4); }
      cx.lineTo(g.r, g.bot); cx.closePath();
      var gr = cx.createLinearGradient(0, level, 0, g.bot); gr.addColorStop(0, j.ink[1]); gr.addColorStop(1, j.ink[0]);
      cx.fillStyle = gr; cx.fill(); cx.restore();
      /* the glass */
      rr(g.l, g.top, g.w, g.h, 16); cx.lineWidth = 3; cx.strokeStyle = j.held ? '#0B1F1C' : 'rgba(11,31,28,.22)'; cx.stroke();
      cx.save(); cx.globalAlpha = 0.5; cx.strokeStyle = '#fff'; cx.lineWidth = 5; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(g.l + 12, g.top + 18); cx.lineTo(g.l + 12, g.bot - 18); cx.stroke(); cx.restore();
      /* the leak: drops, faster the more the charges take; none while plugged */
      var hx = g.r - 18, hy = g.bot - 2, rate = 0.6 + 7 * (cost / maxCost);
      if (cost > 0 && j.plug < 0.4 && now > j.nextDrop) {
        drops.push({ x: hx + (Math.random() - 0.5) * 3, y: hy, vy: 30 + Math.random() * 20 });
        j.nextDrop = now + 1 / rate * (0.7 + Math.random() * 0.6);
      }
      cx.beginPath(); cx.arc(hx, hy, j.plug > 0.4 ? 5 : 3.2, 0, Math.PI * 2); cx.fillStyle = j.plug > 0.4 ? '#0B1F1C' : '#E59C86'; cx.fill();
      /* the puddle: what the charges take */
      var pw = 18 + (g.w * 0.95) * clamp(j.puddle, 0, 1.2), py = H - 22;
      cx.beginPath(); cx.ellipse(hx - 6, py, pw / 2, 4 + 6 * clamp(j.puddle, 0, 1), 0, 0, Math.PI * 2); cx.fillStyle = '#FADCD3'; cx.fill();
      cx.strokeStyle = 'rgba(229,156,134,.8)'; cx.lineWidth = 1.5; cx.stroke();
    });
    /* the no-charge line, across both, and its figure over the middle */
    var g0 = geom(0), g1 = geom(1), ly = g0.top;
    cx.save(); cx.setLineDash([6, 6]); cx.strokeStyle = '#647270'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(g0.l - 10, ly); cx.lineTo(g1.r + 10, ly); cx.stroke(); cx.restore();
    cx.fillStyle = '#54635F'; cx.font = '600 16px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
    cx.fillText('No charges ' + text('nonePot'), W / 2, ly - 12);
    /* the drops, falling and splashing */
    drops = drops.filter(function (d) {
      d.vy += 900 * dt; d.y += d.vy * dt;
      var floor = H - 24;
      if (d.y > floor) { for (var k = 0; k < 3; k++) { splash.push({ x: d.x, y: floor, vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 60, born: now }); } return false; }
      cx.save(); cx.translate(d.x, d.y); cx.fillStyle = '#E59C86'; cx.beginPath(); cx.moveTo(0, -6); cx.quadraticCurveTo(4, 0, 0, 4); cx.quadraticCurveTo(-4, 0, 0, -6); cx.fill(); cx.restore();
      return true;
    });
    splash = splash.filter(function (s) {
      var a = now - s.born; if (a > 0.35) { return false; }
      s.vy += 600 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      cx.globalAlpha = 1 - a / 0.35; cx.fillStyle = '#E59C86'; cx.beginPath(); cx.arc(s.x, s.y, 1.8, 0, Math.PI * 2); cx.fill(); cx.globalAlpha = 1; return true;
    });
  }
  function wake() { if (!raf && onScreen && !document.hidden) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  /* press a jar to plug its leak */
  function which(e) { var b = cv.getBoundingClientRect(), x = e.clientX - b.left; for (var i = 0; i < 2; i++) { var g = geom(i); if (x > g.l - 14 && x < g.r + 14) { return jars[i]; } } return null; }
  cv.addEventListener('pointerdown', function (e) {
    var j = which(e); if (!j) { return; }
    j.held = true; hint.classList.add('pb-off');
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    var b = cv.getBoundingClientRect(), g = geom(jars.indexOf(j));
    if (window.PBAlive) { window.PBAlive.puff(b.left + g.r - 18, b.top + g.bot, 4, 2, 180); }
    wake();
  });
  function free() { jars.forEach(function (j) { j.held = false; }); }
  cv.addEventListener('pointerup', free); cv.addEventListener('pointercancel', free); cv.addEventListener('lostpointercapture', free);
  cv.addEventListener('pointermove', function (e) { cv.style.cursor = which(e) ? 'pointer' : ''; });
  new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { W = 0; wake(); } }).observe(cv);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', wake); window.addEventListener('focus', wake); document.addEventListener('resume', wake);
  window.addEventListener('resize', function () { W = 0; });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; }); }
}());
