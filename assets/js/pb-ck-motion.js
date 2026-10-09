/* The two checklists, alive (9 October 2026, Damian's brief): "The old
   pension hunt" and "The director's year-end pension checklist".

   - Every box is drawn by hand: ticked, it pops, the tick draws itself, a
     few paws jump out of it, and the item's heading gets a marker sweep.
   - Under the introduction, a trail with one stop for every item: the paw
     walks to the furthest stop you have ticked, and the count says how many
     are done. It stays in reach at the top of the screen as you go down
     the list.
   - The last tick finishes the hunt: the trail lights up and paws and coins
     burst out of it.

   The checkboxes stay real checkboxes (keyboard, screen reader and print
   behave as before); nothing is stored. With motion turned off none of this
   is added. */
(function () {
  'use strict';
  var root = document.documentElement;
  var page = document.querySelector('.legal.ck');
  if (!page || !root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  var boxes = [].slice.call(page.querySelectorAll('.ck-list input[type=checkbox]'));
  if (!boxes.length) { return; }
  page.classList.add('pb-ck');
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

  /* the hand-drawn box after each checkbox */
  boxes.forEach(function (inp) {
    var s = document.createElement('span'); s.className = 'pb-ck-box'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 26 26"><rect x="1.5" y="1.5" width="23" height="23" rx="7"/><path d="M7 13.6l4.2 4.2 8-9"/></svg>';
    inp.parentNode.insertBefore(s, inp.nextSibling);
  });

  /* the trail */
  var trail = document.createElement('div'); trail.className = 'pb-ck-trail'; trail.setAttribute('aria-hidden', 'true');
  trail.innerHTML = '<canvas class="pb-ck-cv"></canvas><p class="pb-ck-count"><b>0</b> of ' + boxes.length + ' done</p>';
  var intro = page.querySelector('.intro'), anchor = page.querySelector('.ck-print-row') || intro;
  anchor.parentNode.insertBefore(trail, anchor.nextSibling);
  var cv = trail.querySelector('canvas'), cx = cv.getContext('2d'), countB = trail.querySelector('b');
  var W = 0, H = 0, dpr = 1, walker = { x: 0, v: 0 }, want = 0, raf = 0, last = 0, done = 0, stamped = {};
  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  function paw(x, y, size, a, col, alpha) {
    if (!PAD) { return; } cx.save(); cx.globalAlpha = alpha; cx.fillStyle = col; cx.translate(x, y); cx.rotate(a); var k = size / 64; cx.scale(k, k); cx.translate(-32, -36);
    TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); }); cx.fill(PAD); cx.restore();
  }
  function size() { var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  function stopX(i) { var n = boxes.length; return 18 + (W - 36) * (n > 1 ? i / (n - 1) : 0); }
  function count() { return boxes.filter(function (b) { return b.checked; }).length; }
  function frame(ms) {
    raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    if (!W) { size(); }
    var n = boxes.length, k = count(), target = k ? stopX(k - 1) : stopX(0) - 14;
    walker.v += (90 * (target - walker.x) - 13 * walker.v) * dt; walker.x += walker.v * dt;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var y = H / 2 + 6;
    /* the path, dotted ahead and solid behind */
    cx.lineCap = 'round'; cx.lineWidth = 3;
    cx.strokeStyle = '#D8DFDC'; cx.setLineDash([2, 8]); cx.beginPath(); cx.moveTo(stopX(0), y); cx.lineTo(stopX(n - 1), y); cx.stroke(); cx.setLineDash([]);
    cx.strokeStyle = '#0B1F1C'; cx.beginPath(); cx.moveTo(stopX(0), y); cx.lineTo(Math.max(stopX(0), walker.x), y); cx.stroke();
    for (var i = 0; i < n; i++) {
      /* the stops light in order, one for each item ticked: the trail is progress, not a map of which */
      var on = i < k, x = stopX(i), pop = stamped[i] ? clamp((now - stamped[i]) / 0.5, 0, 1) : 1, r = 6 + (1 - pop) * 6 * Math.sin(pop * Math.PI);
      cx.beginPath(); cx.arc(x, y, on ? r + 1 : 5, 0, Math.PI * 2); cx.fillStyle = on ? '#0B1F1C' : '#fff'; cx.fill();
      cx.lineWidth = 2; cx.strokeStyle = on ? '#0B1F1C' : '#C9D3D0'; cx.stroke();
    }
    /* the walker: the mark, bobbing while it walks */
    var sp = Math.abs(walker.v), bob = Math.abs(Math.sin(now * 12)) * Math.min(1, sp / 120) * 5, s = 26;
    var allDone = k === n && n > 0, glow = allDone ? 0.5 + 0.5 * Math.sin(now * 4) : 0;
    cx.save(); cx.translate(walker.x, y - 20 - bob);
    cx.shadowColor = 'rgba(20,203,177,' + (0.35 + glow * 0.4).toFixed(2) + ')'; cx.shadowBlur = 10 + glow * 14; cx.shadowOffsetY = 3;
    cx.beginPath(); cx.moveTo(-s / 2 + 7, -s / 2); cx.arcTo(s / 2, -s / 2, s / 2, s / 2, 7); cx.arcTo(s / 2, s / 2, -s / 2, s / 2, 7); cx.arcTo(-s / 2, s / 2, -s / 2, -s / 2, 7); cx.arcTo(-s / 2, -s / 2, s / 2, -s / 2, 7); cx.closePath();
    cx.fillStyle = '#14CBB1'; cx.fill(); cx.restore();
    paw(walker.x, y - 20 - bob + 1, 16, 0, '#fff', 1);
    if (Math.abs(walker.x - target) > 0.5 || Math.abs(walker.v) > 1 || allDone) { raf = requestAnimationFrame(frame); }
  }
  function wake() { if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }

  boxes.forEach(function (inp, i) {
    inp.addEventListener('change', function () {
      var k = count();
      countB.textContent = k;
      trail.classList.remove('pb-ck-bump'); void trail.offsetWidth; trail.classList.add('pb-ck-bump');
      if (inp.checked) {
        stamped[k - 1] = performance.now() / 1000;
        var r = inp.nextSibling.getBoundingClientRect();
        if (window.PBAlive) { window.PBAlive.puff(r.left + r.width / 2, r.top + r.height / 2, 6, 2.6, 240); }
      }
      var all = k === boxes.length;
      trail.classList.toggle('pb-ck-all', all);
      if (all && !done) {
        var t = trail.getBoundingClientRect();
        if (window.PBAlive) { window.PBAlive.confetti(t.left + t.width / 2, t.top + t.height / 2, 46, 760); }
      }
      done = all ? 1 : 0;
      wake();
    });
  });
  window.addEventListener('resize', function () { W = 0; wake(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { W = 0; walker.x = stopX(0) - 14; wake(); }); }
  size(); walker.x = stopX(0) - 14; wake();
}());
