/* The pension finder, alive (9 October 2026, Damian's brief). A module of
   the finder record in tools/pagebuild.py. It reads what the reader types,
   draws it, and sends nothing anywhere: the form, its letter and its
   sending stay exactly as the page's own script has them.

   - The steps slide in the way you are going: on, from the right; back,
     from the left. A step holding a regulator's name arrives still.
   - "Where you worked": under the employers, a career line. Each job with
     both its years typed in is a bar on a line of years, named as you named
     it, and a magnifying glass sweeps along them, searching. It shows what
     you typed, so a slip (1989 for 1998) shows up.
   - "Sign the letter": the letter unfolds as you arrive.
   - "What happens next": the letter slides into an envelope, the flap
     shuts and the mark seals it. Sent, it flies off along a trail of paws;
     if your email app is doing the sending, it stays sealed here, since
     nothing has been sent until you press send there. "Requested" pops on
     each line of the tracker.

   With motion turned off none of this runs. */
(function () {
  'use strict';
  var root = document.documentElement, $ = function (id) { return document.getElementById(id); };
  var form = $('pfForm'), emps = $('pfEmps');
  if (!form || !emps || !root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  var REG = /Central\s+Bank\s+of\s+Ireland|Qualified\s+Financial\s+Adviser|\bQFA\b|\bQ\.\s*F\.\s*A\b/;
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  function paw(cx, x, y, size, a, col, alpha) {
    if (!PAD) { return; } cx.save(); cx.globalAlpha = alpha; cx.fillStyle = col; cx.translate(x, y); cx.rotate(a); var k = size / 64; cx.scale(k, k); cx.translate(-32, -36);
    TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); }); cx.fill(PAD); cx.restore();
  }
  function fit(cv) { var b = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(b.width * d); cv.height = Math.round(b.height * d); return { W: b.width, H: b.height, d: d }; }

  /* ------------------------------------------------ the steps, sliding -- */
  var panels = [].slice.call(form.querySelectorAll('.pf-panel')), at = panels.findIndex(function (p) { return !p.hidden; });
  if (window.MutationObserver) {
    new MutationObserver(function () {
      var now = panels.findIndex(function (p) { return !p.hidden; });
      if (now < 0 || now === at) { return; }
      var p = panels[now], back = now < at; at = now;
      p.classList.remove('pb-pf-in', 'pb-pf-back');
      if (REG.test(p.textContent)) { return; }
      void p.offsetWidth; p.classList.add('pb-pf-in'); p.classList.toggle('pb-pf-back', back);
      if (now === 3) { envelope(); }
    }).observe(form, { attributes: true, subtree: true, attributeFilter: ['hidden'] });
  }

  /* --------------------------------------------------- the career line -- */
  var line = document.createElement('canvas'); line.className = 'pb-pf-line'; line.setAttribute('aria-hidden', 'true');
  emps.parentNode.insertBefore(line, emps.nextSibling);
  var lx = line.getContext('2d'), L = null, lraf = 0, glass = { x: 0, dir: 1 }, lastL = 0, lOn = false;
  var THIS = new Date().getFullYear();
  function jobs() {
    return [].map.call(emps.querySelectorAll('.pf-emp'), function (fs) {
      var ins = fs.querySelectorAll('input'), name = (ins[0] && ins[0].value || '').trim(), a = +((ins[1] && ins[1].value) || 0), b = +((ins[2] && ins[2].value) || 0);
      var ok = a >= 1950 && a <= THIS && b >= 1950 && b <= THIS;
      return { name: name || 'An employer', from: Math.min(a, b), to: Math.max(a, b), ok: ok, flip: ok && a > b };
    });
  }
  function drawLine(ms) {
    lraf = 0; var now = ms / 1000, dt = clamp(now - lastL, 0, 1 / 30); lastL = now;
    var J = jobs().filter(function (j) { return j.ok; }), want = 54 + Math.max(1, J.length) * 40;
    if (Math.abs(line.getBoundingClientRect().height - want) > 1) { line.style.height = want + 'px'; L = null; }
    if (!L) { L = fit(line); }
    var W = L.W, H = L.H; lx.setTransform(L.d, 0, 0, L.d, 0, 0); lx.clearRect(0, 0, W, H);
    lx.font = '600 16px Figtree, system-ui, sans-serif'; lx.textBaseline = 'alphabetic';
    if (!J.length) {
      lx.save(); lx.setLineDash([3, 7]); lx.strokeStyle = '#C9D3D0'; lx.lineWidth = 3; lx.lineCap = 'round'; lx.beginPath(); lx.moveTo(10, 30); lx.lineTo(W - 10, 30); lx.stroke(); lx.restore();
      lx.fillStyle = '#54635F'; lx.textAlign = 'center'; lx.fillText('Your jobs line up here as you add their years.', W / 2, 62);
      glass.x = 0; return;
    }
    var y0 = Math.min.apply(null, J.map(function (j) { return j.from; })), y1 = Math.max.apply(null, J.map(function (j) { return j.to; })) + 1;
    if (y1 - y0 < 6) { y0 -= Math.ceil((6 - (y1 - y0)) / 2); y1 = y0 + 6; }
    var X = function (y) { return 14 + (W - 28) * (y - y0) / (y1 - y0); }, axis = H - 26;
    /* the years along the bottom */
    var step = (y1 - y0) > 30 ? 10 : (y1 - y0) > 12 ? 5 : 2;
    lx.strokeStyle = '#D8DFDC'; lx.lineWidth = 2; lx.beginPath(); lx.moveTo(10, axis); lx.lineTo(W - 10, axis); lx.stroke();
    lx.fillStyle = '#54635F'; lx.textAlign = 'center';
    var lastX = -99;
    for (var y = Math.ceil(y0 / step) * step; y <= y1; y += step) { var tx = X(y); if (tx - lastX < 52) { continue; } lastX = tx; lx.fillText(String(y), clamp(tx, 18, W - 18), H - 4); lx.beginPath(); lx.moveTo(tx, axis - 4); lx.lineTo(tx, axis + 3); lx.stroke(); }
    /* the glass sweeps back and forth along the line */
    glass.x += glass.dir * dt * Math.max(60, W * 0.18);
    if (glass.x > W - 20) { glass.dir = -1; } if (glass.x < 20) { glass.dir = 1; }
    J.forEach(function (j, i) {
      var a = X(j.from), b = Math.max(a + 8, X(j.to + 1)), yy = 26 + i * 40, lit = glass.x > a - 6 && glass.x < b + 6;
      lx.fillStyle = lit ? '#2C3B38' : '#586B85'; lx.beginPath(); lx.moveTo(a + 6, yy); lx.arcTo(b, yy, b, yy + 12, 6); lx.arcTo(b, yy + 12, a, yy + 12, 6); lx.arcTo(a, yy + 12, a, yy, 6); lx.arcTo(a, yy, b, yy, 6); lx.fill();
      var label = j.name + ', ' + j.from + (j.to !== j.from ? ' to ' + j.to : '');
      lx.fillStyle = '#0B1F1C'; lx.textAlign = a + lx.measureText(label).width < W - 8 ? 'left' : 'right';
      var lxp = lx.textAlign === 'left' ? a : Math.min(W - 6, b);
      while (lx.measureText(label).width > W - 16 && label.length > 4) { label = label.slice(0, -2); }
      lx.fillText(label, lxp, yy - 6);
    });
    /* the magnifying glass */
    var gy = 26 + (J.length - 1) * 20 + 6 + Math.sin(now * 3) * 4;
    lx.save(); lx.translate(glass.x, gy); lx.rotate(-0.5);
    lx.lineWidth = 4; lx.strokeStyle = '#0B1F1C'; lx.beginPath(); lx.moveTo(0, 12); lx.lineTo(0, 26); lx.stroke();
    lx.beginPath(); lx.arc(0, 0, 12, 0, Math.PI * 2); lx.fillStyle = 'rgba(127,227,211,.35)'; lx.fill(); lx.lineWidth = 3.5; lx.stroke();
    lx.globalAlpha = 0.8; lx.strokeStyle = '#fff'; lx.lineWidth = 2; lx.beginPath(); lx.arc(0, 0, 7, -2.6, -1.6); lx.stroke(); lx.restore();
    if (lOn && !document.hidden) { lraf = requestAnimationFrame(drawLine); }
  }
  function wakeLine() { if (!lraf) { lastL = performance.now() / 1000; lraf = requestAnimationFrame(drawLine); } }
  emps.addEventListener('input', wakeLine);
  new MutationObserver(function () { L = null; wakeLine(); }).observe(emps, { childList: true });
  if (window.IntersectionObserver) { new IntersectionObserver(function (es) { lOn = es[0].isIntersecting; if (lOn) { L = null; wakeLine(); } }).observe(line); }
  window.addEventListener('resize', function () { L = null; wakeLine(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && lOn) { wakeLine(); } });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { L = null; wakeLine(); }); }

  /* ------------------------------------------------------ the envelope -- */
  var env = null;
  function envelope() {
    var step = panels[3], h2 = step && step.querySelector('h2');
    if (!h2) { return; }
    if (!env) { env = document.createElement('canvas'); env.className = 'pb-pf-env'; env.setAttribute('aria-hidden', 'true'); h2.parentNode.insertBefore(env, h2.nextSibling); }
    var sent = /^Thanks/.test((($('pfDone') || {}).textContent || '').trim());
    var E = fit(env), ex = env.getContext('2d'), t0 = performance.now() / 1000, puffed = false;
    [].forEach.call(step.querySelectorAll('.pf-done-s'), function (s, i) { s.style.animationDelay = (1.5 + i * 0.12) + 's'; s.classList.add('pb-pf-pop'); });
    function ease(u) { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); }
    function f(ms) {
      var t = ms / 1000 - t0, W = E.W, H = E.H, cxp = W / 2, cyp = H / 2 + 14, w = Math.min(170, W * 0.5), h = w * 0.62;
      ex.setTransform(E.d, 0, 0, E.d, 0, 0); ex.clearRect(0, 0, W, H);
      /* sent, it flies off along a trail of paws; kept, it stays sealed here */
      var fly = sent ? ease((t - 2.2) / 1.1) : 0, fx = cxp + fly * (W * 0.62), fy = cyp - Math.sin(fly * Math.PI) * 36 - fly * 10, s = 1 - fly * 0.55;
      if (sent && t > 2.2) {
        for (var k = 0; k < 7; k++) { var u = k / 7; if (u > fly) { break; } var px = cxp + u * W * 0.62, py = cyp + 30 - Math.sin(u * Math.PI) * 30 + (k % 2 ? 8 : -2); paw(ex, px - 30, py + 6, 15, 1.4, '#14CBB1', clamp(1.4 - (t - 2.2 - u) * 0.6, 0, 0.8)); }
      }
      ex.save(); ex.translate(fx, fy); ex.scale(s, s); ex.rotate(fly * 0.12);
      /* the letter slides down into the envelope */
      var slide = ease(t / 0.8), lyy = -h * 1.05 + slide * h * 0.75;
      ex.fillStyle = '#E9EEEC'; ex.fillRect(-w / 2, -h / 2, w, h);
      if (t < 1.2) {
        ex.save(); ex.beginPath(); ex.rect(-w / 2 - 4, -H, w + 8, H + h * 0.15); ex.clip();
        ex.fillStyle = '#fff'; ex.strokeStyle = 'rgba(11,31,28,.18)'; ex.lineWidth = 1.5; ex.fillRect(-w * 0.4, lyy, w * 0.8, h * 0.95); ex.strokeRect(-w * 0.4, lyy, w * 0.8, h * 0.95);
        ex.fillStyle = '#C9D3D0'; for (var r = 0; r < 4; r++) { ex.fillRect(-w * 0.32, lyy + 12 + r * 10, w * (r === 3 ? 0.3 : 0.64), 3); }
        ex.restore();
      }
      /* the body, and the flap shutting */
      ex.fillStyle = '#fff'; ex.strokeStyle = 'rgba(11,31,28,.35)'; ex.lineWidth = 2;
      ex.beginPath(); ex.rect(-w / 2, -h / 2, w, h); ex.fill(); ex.stroke();
      ex.beginPath(); ex.moveTo(-w / 2, h / 2); ex.lineTo(0, 0); ex.lineTo(w / 2, h / 2); ex.strokeStyle = 'rgba(11,31,28,.2)'; ex.stroke();
      var shut = ease((t - 0.85) / 0.45), tip = -h / 2 + (h * 0.55 + h * 0.5) * shut - h * 0.5 * (1 - shut);
      ex.beginPath(); ex.moveTo(-w / 2, -h / 2); ex.lineTo(0, tip); ex.lineTo(w / 2, -h / 2); ex.closePath();
      ex.fillStyle = shut > 0.5 ? '#F4F5F3' : '#fff'; ex.fill(); ex.strokeStyle = 'rgba(11,31,28,.35)'; ex.stroke();
      /* the seal: the mark, stamped */
      if (t > 1.35) {
        var st = clamp((t - 1.35) / 0.3, 0, 1), sc = 1 + (1 - st) * 0.9, sy = tip - 2;
        ex.save(); ex.translate(0, sy); ex.scale(sc, sc); ex.globalAlpha = st;
        ex.beginPath(); ex.arc(0, 0, 15, 0, Math.PI * 2); ex.fillStyle = '#14CBB1'; ex.fill(); ex.restore();
        paw(ex, 0, sy + 1, 17 * sc, 0, '#fff', st);
        if (st >= 1 && !puffed) { puffed = true; var b = env.getBoundingClientRect(); if (window.PBAlive) { window.PBAlive.puff(b.left + fx, b.top + fy + sy, 6, 2.4, 220); } }
      }
      ex.restore();
      if (t < (sent ? 4.2 : 2)) { requestAnimationFrame(f); }
    }
    requestAnimationFrame(f);
  }
}());
