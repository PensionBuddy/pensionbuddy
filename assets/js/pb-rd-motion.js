/* The readiness check, alive (9 October 2026, Damian's brief). A module of
   the readiness record in tools/pagebuild.py, so it loads before the page's
   own script; it watches what that script builds and never scores anything.

   - The questions for your situation cascade in, one after another.
   - Each answer pops as you pick it, and a counter under the questions fills
     a segment for every question answered.
   - Your score: a dial, with the page's three bands round it (early days,
     on the way, in good shape). The needle swings up to your score and
     settles while the number counts up with it; then the line about your
     zone arrives, and the steps that move your score drop in one by one.
     In good shape, paws and coins burst out of the dial; on the way, a
     sparkle; early days, a friendly paw or two.

   With motion turned off none of this runs and the page's own bar shows. */
(function () {
  'use strict';
  var root = document.documentElement;
  var form = document.getElementById('rdForm'), result = document.getElementById('rdResult'), qs = document.getElementById('rdQs');
  if (!form || !result || !root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  function $(id) { return document.getElementById(id); }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  form.classList.add('pb-rd');

  /* ------------------------------------------------ questions cascading -- */
  if (qs && window.MutationObserver) {
    new MutationObserver(function () {
      [].forEach.call(qs.children, function (fs, i) { if (!fs.classList.contains('pb-rd-in')) { fs.classList.add('pb-rd-in'); fs.style.animationDelay = (i * 90) + 'ms'; } });
      tally();
    }).observe(qs, { childList: true });
  }
  /* the counter: a segment for every question */
  var bar = document.createElement('div'); bar.className = 'pb-rd-tally'; bar.setAttribute('aria-hidden', 'true');
  var nav = form.querySelector('.rd-nav'); form.insertBefore(bar, nav);
  function tally() {
    var sets = [].slice.call(form.querySelectorAll('fieldset.rd-q')), on = sets.filter(function (f) { return f.querySelector('input:checked'); }).length;
    if (bar.children.length !== sets.length + 1) {
      bar.textContent = '';
      sets.forEach(function () { bar.appendChild(document.createElement('i')); });
      var t = document.createElement('span'); bar.appendChild(t);
    }
    [].forEach.call(bar.querySelectorAll('i'), function (seg, i) { seg.classList.toggle('pb-on', i < on); });
    bar.lastChild.textContent = on + ' of ' + sets.length + ' answered';
    bar.classList.toggle('pb-rd-all', on === sets.length && sets.length > 1);
  }
  form.addEventListener('change', function (e) {
    var lab = e.target.closest && e.target.closest('.rd-opt');
    if (lab) {
      lab.classList.remove('pb-rd-pick'); void lab.offsetWidth; lab.classList.add('pb-rd-pick');
      var r = lab.getBoundingClientRect();
      if (window.PBAlive) { window.PBAlive.puff(r.left + 22, r.top + r.height / 2, 4, 2.2, 200); }
    }
    tally();
  });
  tally();

  /* ------------------------------------------------------------ the dial -- */
  var scale = result.querySelector('.rd-scale'), cv = document.createElement('canvas');
  cv.className = 'pb-rd-dial'; cv.setAttribute('aria-hidden', 'true');
  scale.parentNode.insertBefore(cv, scale);
  result.classList.add('pb-rd-has-dial');
  var cx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, needle = { v: 0, x: 0 }, target = 0, t0 = 0, raf = 0, last = 0, landed = false;
  function size() { var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  var BANDS = [[0, 40, '#D8DFDC', 'Early days'], [40, 75, 'rgba(88,107,133,.55)', 'On the way'], [75, 100, '#586B85', 'In good shape']];
  function draw(now) {
    if (!W) { size(); }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var r = Math.min(W * 0.42, H - 30), ox = W / 2, oy = H - 16, A = function (v) { return Math.PI + Math.PI * clamp(v, 0, 100) / 100; };
    cx.lineCap = 'butt'; cx.lineWidth = 22;
    BANDS.forEach(function (b, i) { cx.beginPath(); cx.arc(ox, oy, r, A(b[0]) + (i ? 0.012 : 0), A(b[1]) - (i < 2 ? 0.012 : 0)); cx.strokeStyle = b[2]; cx.stroke(); });
    /* the score so far, a thin ink arc inside the bands */
    cx.lineCap = 'round'; cx.lineWidth = 6; cx.strokeStyle = '#0B1F1C';
    if (needle.x > 0.5) { cx.beginPath(); cx.arc(ox, oy, r - 24, A(0), A(needle.x)); cx.stroke(); }
    /* the ticks and their numbers */
    cx.fillStyle = '#54635F'; cx.font = '600 13px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    [0, 40, 75, 100].forEach(function (v) { var a = A(v); cx.fillText(String(v), ox + Math.cos(a) * (r + 24), oy + Math.sin(a) * (r + 24) + (v === 0 || v === 100 ? 8 : 0)); });
    /* the bands' names, round the inside */
    cx.font = '600 12px Figtree, system-ui, sans-serif'; cx.fillStyle = '#54635F';
    BANDS.forEach(function (bd) { var am = A((bd[0] + bd[1]) / 2), rr2 = r - 50; cx.fillText(bd[3], ox + Math.cos(am) * rr2, oy + Math.sin(am) * rr2); });
    /* the needle, and its hub */
    var a = A(needle.x), len = r - 6;
    cx.save(); cx.shadowColor = 'rgba(11,31,28,.25)'; cx.shadowBlur = 8; cx.shadowOffsetY = 3;
    cx.strokeStyle = '#0B1F1C'; cx.lineWidth = 5; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(ox, oy); cx.lineTo(ox + Math.cos(a) * len, oy + Math.sin(a) * len); cx.stroke();
    cx.beginPath(); cx.arc(ox, oy, 11, 0, Math.PI * 2); cx.fillStyle = '#0B1F1C'; cx.fill(); cx.restore();
    cx.beginPath(); cx.arc(ox, oy, 4, 0, Math.PI * 2); cx.fillStyle = '#fff'; cx.fill();
  }
  function frame(ms) {
    raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    if (now < t0) { draw(now); raf = requestAnimationFrame(frame); return; }
    /* a heavy needle: it swings past and settles */
    needle.v += (55 * (target - needle.x) - 6.5 * needle.v) * dt; needle.x += needle.v * dt;
    $('rdN').textContent = Math.round(clamp(needle.x, 0, 100));
    draw(now);
    var still = Math.abs(target - needle.x) < 0.25 && Math.abs(needle.v) < 0.6;
    if (still && !landed) {
      landed = true; needle.x = target; $('rdN').textContent = target; draw(now);
      land();
    }
    if (!still) { raf = requestAnimationFrame(frame); }
  }
  function land() {
    result.classList.add('pb-rd-landed');
    var b = cv.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height - 30;
    if (!window.PBAlive) { return; }
    if (target >= 75) { window.PBAlive.confetti(x, y, 54, 820); }
    else if (target >= 40) { window.PBAlive.puff(x, y, 12, 2.6, 360); }
    else { window.PBAlive.puff(x, y, 4, 1.6, 180); }
  }
  function play() {
    target = clamp(+($('rdN').textContent) || 0, 0, 100);
    needle.x = 0; needle.v = 0; landed = false; W = 0;
    result.classList.remove('pb-rd-landed');
    $('rdN').textContent = '0';
    [].forEach.call(result.querySelectorAll('#rdMoves li'), function (li, i) { li.style.animationDelay = (i * 110) + 'ms'; });
    t0 = performance.now() / 1000 + 0.25; last = performance.now() / 1000;
    if (!raf) { raf = requestAnimationFrame(frame); }
  }
  new MutationObserver(function () { if (!result.hidden) { play(); } }).observe(result, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('resize', function () { W = 0; if (!result.hidden) { draw(performance.now() / 1000); } });
}());
