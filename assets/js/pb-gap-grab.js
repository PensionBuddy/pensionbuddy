/* The hero's gap chart, by hand (8 October 2026, Damian's brief): grab the
   "What people expect to need" bar and drag it.

   The figures are the slider's (#pbNeed): a drag sets the slider's value and
   fires its input event, so the chart's own paint() (in index.html) writes
   every figure, label and sentence exactly as a slider drag does. This file
   only moves the bars, on springs:

   - grab: the chart zooms out (its scale springs to half again above the
     figure) so there is room to pull; the bar then follows the pointer one
     to one, and the pink gap stretches with it;
   - let go: the chart zooms back in to its figures with a bounce;
   - a way-of-life card or the Single/Couple switch springs the bars to their
     new heights instead of jumping;
   - a handle rides the top of the bar, with "Drag" on it until the first
     drag. It takes the arrow keys too (up and down, €500 a step; Page Up
     and Page Down, €5,000), so a keyboard can do what a pointer does.

   With motion turned off (html without .pb-motion) the bars follow without
   springs. Nothing here works out a figure. */
(function () {
  'use strict';
  var gap = document.getElementById('pbGap'), r = document.getElementById('pbNeed');
  if (!gap || !r || !window.requestAnimationFrame) { return; }
  var root = document.documentElement;
  var needCol = gap.querySelector('.pb-gap-need'), stage = needCol && needCol.querySelector('.pb-gap-stage');
  var needBar = gap.querySelector('.pb-gap-need .pb-gap-bar'), stBar = gap.querySelector('.pb-gap-state .pb-gap-bar');
  var stN = stBar && stBar.querySelector('[data-pb-count]'), sh = gap.querySelector('.pb-gap-short');
  var big = document.querySelector('#pbNeedOut .pb-gap-big-n');
  if (!stage || !needBar || !stBar || !stN || !sh) { return; }
  var MIN = +r.min, MAX = +r.max, STEP = +r.step || 20;
  function motion() { return root.classList.contains('pb-motion'); }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function need() { return +r.value; }
  function st() { return +stN.getAttribute('data-pb-count'); }

  /* the handle */
  var grab = document.createElement('button');
  grab.type = 'button'; grab.className = 'pb-gap-grab';
  grab.setAttribute('aria-label', 'What you expect to need a year: use the up and down arrows, or drag');
  grab.setAttribute('aria-controls', 'pbNeed');
  grab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="7 9 12 4 17 9"/><polyline points="7 15 12 20 17 15"/></svg><span class="pb-gap-grab-t">Drag</span>';
  stage.appendChild(grab);
  gap.classList.add('pb-gap-has-grab');   /* room above the chart for the handle */

  /* springs: the scale the chart is drawn to, and each bar's height in euro */
  var sp = {
    scale: { x: 0, v: 0 }, need: { x: 0, v: 0 }, st: { x: 0, v: 0 }, pop: { x: 1, v: 0 }
  };
  var dragging = false, live = false, raf = 0, last = 0, wantScale = 0, held = null;
  function seed() { sp.need.x = need(); sp.st.x = st(); sp.scale.x = Math.max(need(), st()); }
  function spring(s, to, k, c, dt) { var a = k * (to - s.x) - c * s.v; s.v += a * dt; s.x += s.v * dt; }

  function draw() {
    var S = Math.max(1, sp.scale.x), n = Math.max(0, sp.need.x), s = Math.max(0, sp.st.x);
    var pc = function (v) { return clamp(v / S * 100, 0, 100).toFixed(3) + '%'; };
    needBar.style.setProperty('--h', pc(n));
    stBar.style.setProperty('--h', pc(s));
    sh.style.setProperty('--from', pc(s));
    sh.style.setProperty('--h', n > s ? pc(n - s) : '0%');
    /* the handle rides the top of the bar */
    grab.style.bottom = clamp(n / S * 100, 0, 100).toFixed(3) + '%';
    if (big) { big.style.transform = 'scale(' + sp.pop.x.toFixed(4) + ')'; }
  }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    var tScale = dragging ? wantScale : Math.max(need(), st());
    var m = motion();
    if (!m) { sp.scale.x = tScale; sp.need.x = need(); sp.st.x = st(); sp.pop.x = 1; draw(); return; }
    /* while dragging the bar is stiff, so it stays under the pointer; the zoom is softer and bounces */
    var steps = 4, h = dt / steps;
    for (var i = 0; i < steps; i++) {
      spring(sp.scale, tScale, dragging ? 120 : 170, dragging ? 22 : 13, h);
      spring(sp.need, need(), dragging ? 900 : 220, dragging ? 60 : 17, h);
      spring(sp.st, st(), 220, 17, h);
      spring(sp.pop, 1, 260, 12, h);
    }
    draw();
    var still = Math.abs(sp.scale.v) + Math.abs(sp.need.v) + Math.abs(sp.st.v) < 2 && Math.abs(sp.pop.v) < 0.01 &&
      Math.abs(sp.scale.x - tScale) < 1 && Math.abs(sp.need.x - need()) < 1 && Math.abs(sp.st.x - st()) < 1 && Math.abs(sp.pop.x - 1) < 0.001;
    if (dragging || !still) { raf = requestAnimationFrame(frame); }
    else { sp.scale.x = tScale; sp.need.x = need(); sp.st.x = st(); sp.pop.x = 1; draw(); }
  }
  function wake() {
    if (!live) { live = true; seed(); gap.classList.add('pb-gap-live', 'pb-gap-grabbed'); }
    if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); }
  }
  function set(v) {
    var before = need();
    v = clamp(Math.round(v / STEP) * STEP, MIN, MAX);
    if (v === before) { return; }
    r.value = v;
    r.dispatchEvent(new Event('input', { bubbles: true }));
    if (Math.abs(v - before) > 0) { sp.pop.v += clamp((v - before) / 400, -0.6, 0.6); }
  }
  /* after the chart's own listeners: put the springs' heights back, so a
     paint() never shows a frame at the new figure before the spring gets it */
  r.addEventListener('input', function () { wake(); draw(); });
  ['pbLifeSingle', 'pbLifeCouple'].forEach(function (id) {
    var b = document.getElementById(id); if (b) { b.addEventListener('click', function () { wake(); draw(); }); }
  });
  [].forEach.call(document.querySelectorAll('.pb-life-card'), function (c) {
    c.addEventListener('click', function () { wake(); draw(); });
  });

  /* dragging: from the handle (any pointer), or the bar itself (a mouse or a pen;
     a finger on the bar keeps scrolling the page) */
  function down(e) {
    if (e.button !== undefined && e.button !== 0) { return; }
    if (e.currentTarget === needBar && e.pointerType === 'touch') { return; }
    e.preventDefault();
    wake();
    dragging = true; gap.classList.add('pb-gap-dragging'); grab.classList.add('pb-gap-grab-used');
    held = { id: e.pointerId, y: e.clientY, need: need(), H: stage.getBoundingClientRect().height };
    /* zoom out: half again above the larger figure, so there is room to pull */
    wantScale = Math.max(need(), st()) * 1.5;
    held.scale = wantScale;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {}
  }
  function move(e) {
    if (!dragging || !held || e.pointerId !== held.id) { return; }
    var v = held.need + (held.y - e.clientY) / held.H * held.scale;
    set(v);
    /* keep some headroom above a bar pulled high */
    if (need() > wantScale * 0.9) { wantScale = need() / 0.9; }
    wake();
  }
  function up(e) {
    if (!dragging || (held && e.pointerId !== held.id)) { return; }
    dragging = false; held = null; gap.classList.remove('pb-gap-dragging');
    wake();
  }
  [grab, needBar].forEach(function (el) {
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  });
  grab.addEventListener('keydown', function (e) {
    var d = { ArrowUp: 500, ArrowRight: 500, ArrowDown: -500, ArrowLeft: -500, PageUp: 5000, PageDown: -5000 }[e.key];
    if (e.key === 'Home') { d = MIN - need(); } else if (e.key === 'End') { d = MAX - need(); }
    if (!d) { return; }
    e.preventDefault(); wake(); grab.classList.add('pb-gap-grab-used'); set(need() + d);
  });

  /* the handle shows once the bars stand: straight away if the chart was
     finished at load, or after the count-up if it grew in */
  function show() { grab.classList.add('pb-gap-grab-on'); }
  if (gap.classList.contains('pb-go') || !gap.classList.contains('pb-armed')) { setTimeout(show, 900); }
  new MutationObserver(function () { if (gap.classList.contains('pb-go')) { setTimeout(show, 1300); } })
    .observe(gap, { attributes: true, attributeFilter: ['class'] });
  setTimeout(show, 4000);
}());
