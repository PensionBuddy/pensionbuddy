/* "Your pension through life", alive (8 October 2026, Damian's brief). The
   track is slate, the reader's own (teal is what the State pays, Run 43);
   the walker is the brand's mark.
   On top of assets/js/pb-timeline.js, which still decides which step is
   showing and writes the card's words.

   - A life track from 18 to 75: a paw walks it, leaving footprints behind
     it, with a tick at every age on the list that lights when it is passed.
   - On a wide screen the paw follows the page: scroll, and it walks from age
     to age between the steps. Grab it (or anywhere on the track) and drag,
     and the page scrolls with you to that age.
   - On a narrow screen the track sits over the "Your age" slider: drag either.
   - The card's big figure rolls in, digit by digit, when it changes, and the
     step that comes into the middle of the screen pings its dot; the steps
     further from the middle fade back.

   With motion turned off none of this is drawn. */
(function () {
  'use strict';
  var box = document.getElementById('pbTl'), root = document.documentElement;
  if (!box || !window.requestAnimationFrame) { return; }
  function motion() { return root.classList.contains('pb-motion'); }
  if (!motion()) { return; }
  var steps = [].slice.call(box.querySelectorAll('.pb-tl-step'));
  var AGES = steps.map(function (s) { return +s.getAttribute('data-age'); });
  var LO = 18, HI = 75;
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  var wideQ = window.matchMedia('(min-width: 921px)');

  /* ------------------------------------------------- the rolling figure -- */
  function roll(el) {
    var t = el.textContent;
    if (el.getAttribute('data-roll') === t) { return; }
    el.setAttribute('data-roll', t);
    var frag = document.createDocumentFragment();
    t.split('').forEach(function (c, i) {
      var s = document.createElement('span'); s.className = 'pb-roll'; s.style.animationDelay = (i * 45) + 'ms';
      s.textContent = c; frag.appendChild(s);
    });
    el.textContent = ''; el.appendChild(frag);
    el.setAttribute('data-roll', el.textContent);
  }
  function watchRoll(el) {
    if (!el) { return; }
    new MutationObserver(function () { roll(el); }).observe(el, { childList: true, characterData: true, subtree: true });
  }
  watchRoll(document.getElementById('pbTlAge'));
  var nowB = document.getElementById('pbTlNow');
  if (nowB) {
    new MutationObserver(function () { var b = nowB.querySelector('b'); if (b && !b.querySelector('.pb-roll')) { roll(b); } })
      .observe(nowB, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------- the track -- */
  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  function paw(cx, x, y, size, a, col, alpha) {
    if (!PAD) { return; }
    cx.save(); cx.globalAlpha = alpha; cx.fillStyle = col; cx.translate(x, y); cx.rotate(a);
    var k = size / 64; cx.scale(k, k); cx.translate(-32, -36);
    TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); });
    cx.fill(PAD); cx.restore();
  }
  function rr(cx, x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

  function Track(host, before, onScrub) {
    var cv = document.createElement('canvas');
    cv.className = 'pb-tl-track'; cv.setAttribute('aria-hidden', 'true');
    host.insertBefore(cv, before || null);
    var cx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
    var t = { age: 40, v: 0, want: 40, drag: false, pings: {} };
    function size() {
      var b = cv.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    var L = 22, Rm = 22;
    function X(a) { return L + (clamp(a, LO, HI) - LO) / (HI - LO) * (W - L - Rm); }
    function A(x) { return clamp(LO + (x - L) / (W - L - Rm) * (HI - LO), LO, HI); }
    function draw(now) {
      if (!W) { size(); }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      var ly = H - 34, a = t.age, xa = X(a);
      /* the line, and the walked part */
      cx.lineCap = 'round';
      cx.strokeStyle = '#E7EBE9'; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(X(LO), ly); cx.lineTo(X(HI), ly); cx.stroke();
      var g = cx.createLinearGradient(X(LO), 0, xa, 0); g.addColorStop(0, '#B4BECB'); g.addColorStop(1, '#586B85');
      cx.strokeStyle = g; cx.beginPath(); cx.moveTo(X(LO), ly); cx.lineTo(xa, ly); cx.stroke();
      /* footprints, every two and a half years walked */
      for (var p = LO + 1.2, k = 0; p < a - 1.2; p += 2.5, k++) {
        paw(cx, X(p), ly - 15 + (k % 2 ? -5 : 5), 11, Math.PI / 2, '#586B85', 0.3);
      }
      /* the ticks: every age on the list */
      AGES.forEach(function (age, i) {
        var x = X(age), on = a >= age - 0.01, ping = t.pings[age] ? clamp((now - t.pings[age]) / 0.6, 0, 1) : 1;
        if (ping < 1) {
          cx.beginPath(); cx.arc(x, ly, 7 + ping * 16, 0, Math.PI * 2); cx.strokeStyle = 'rgba(88,107,133,' + (0.6 * (1 - ping)).toFixed(3) + ')'; cx.lineWidth = 3; cx.stroke();
        }
        cx.beginPath(); cx.arc(x, ly, on ? 6 : 5, 0, Math.PI * 2);
        cx.fillStyle = on ? '#586B85' : '#fff'; cx.fill();
        cx.lineWidth = 2; cx.strokeStyle = on ? '#586B85' : '#C9D3D0'; cx.stroke();
      });
      /* the ages under the line: the ends and the round ones, so they never crowd */
      cx.font = '600 12px Figtree, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
      [18, 30, 40, 50, 60, 66, 75].forEach(function (n) {
        cx.fillStyle = a >= n ? '#0B1F1C' : '#7C8A86'; cx.fillText(String(n), X(n), H - 8);
      });
      /* the walker: the mark, bobbing with its speed, leaning into the walk */
      var sp = clamp(Math.abs(t.v) / 12, 0, 1), bob = Math.abs(Math.sin(now * 9)) * 6 * sp;
      var sz = 32, wy = ly - 26 - bob, lean = clamp(t.v / 40, -0.25, 0.25);
      cx.save(); cx.translate(xa, wy); cx.rotate(lean);
      cx.shadowColor = 'rgba(20,203,177,.45)'; cx.shadowBlur = t.drag ? 18 : 10; cx.shadowOffsetY = 4;
      rr(cx, -sz / 2, -sz / 2, sz, sz, 9); cx.fillStyle = '#14CBB1'; cx.fill();
      cx.shadowColor = 'transparent';
      cx.restore();
      cx.save(); cx.translate(xa, wy); cx.rotate(lean); paw(cx, 0, 1, 20, 0, '#fff', 1); cx.restore();
      /* the age, over the walker */
      cx.font = '700 13px Figtree, system-ui, sans-serif'; cx.fillStyle = '#0B1F1C';
      cx.fillText(String(Math.round(a)), xa, wy - sz / 2 - 6);
    }
    function age(now) { return t; }
    var dragId = null;
    cv.addEventListener('pointerdown', function (e) {
      var b = cv.getBoundingClientRect();
      dragId = e.pointerId; t.drag = true; cv.setPointerCapture(e.pointerId); cv.classList.add('pb-tl-dragging');
      onScrub(A(e.clientX - b.left), true);
      e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) {
      if (dragId !== e.pointerId) { return; }
      var b = cv.getBoundingClientRect(); onScrub(A(e.clientX - b.left), false);
    });
    function up(e) { if (dragId !== e.pointerId) { return; } dragId = null; t.drag = false; cv.classList.remove('pb-tl-dragging'); onScrub(null, false); }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('lostpointercapture', up);
    return { el: cv, t: t, draw: draw, size: size };
  }

  /* -------------------------------------------- the wide screen: scroll -- */
  var stage = box.querySelector('.pb-tl-card'), ruler = box.querySelector('.pb-tl-ruler'), ends = box.querySelector('.pb-tl-ends');
  var wideT = null, smallT = null;
  if (stage) {
    wideT = Track(stage, null, function (a, first) {
      if (a === null) { return; }
      /* scrub: put the page where this age sits between two steps */
      var y = scrollFor(a);
      if (y !== null) { window.scrollTo({ top: y, behavior: 'instant' }); }
      wideT.t.want = a;
    });
    box.classList.add('pb-tl-alive');
  }
  function centres() { return steps.map(function (s) { var b = s.getBoundingClientRect(); return b.top + b.height / 2; }); }
  /* the age the middle of the screen is at, between the two steps either side */
  function ageFromScroll() {
    var c = centres(), mid = window.innerHeight / 2;
    if (mid <= c[0]) { return AGES[0]; }
    for (var i = 0; i < c.length - 1; i++) {
      if (mid <= c[i + 1]) { return lerp(AGES[i], AGES[i + 1], (mid - c[i]) / (c[i + 1] - c[i])); }
    }
    return AGES[AGES.length - 1];
  }
  function scrollFor(a) {
    var c = centres(), mid = window.innerHeight / 2, y0 = window.scrollY;
    a = clamp(a, AGES[0], AGES[AGES.length - 1]);
    for (var i = 0; i < AGES.length - 1; i++) {
      if (a <= AGES[i + 1]) { var f = (a - AGES[i]) / (AGES[i + 1] - AGES[i]); return y0 + lerp(c[i], c[i + 1], f) - mid; }
    }
    return y0 + c[c.length - 1] - mid;
  }
  /* the steps nearer the middle stand forward */
  function focus() {
    var mid = window.innerHeight / 2;
    steps.forEach(function (s) {
      var b = s.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid) / window.innerHeight;
      s.style.opacity = (1 - clamp((d - 0.12) * 1.3, 0, 0.6)).toFixed(3);
      s.style.transform = 'translateX(' + (clamp(d - 0.1, 0, 0.5) * 30).toFixed(1) + 'px)';
    });
  }
  function clearFocus() { steps.forEach(function (s) { s.style.opacity = ''; s.style.transform = ''; }); }

  /* --------------------------------------- the narrow screen: the slider -- */
  var pick = document.getElementById('pbTlPick'), pickR = document.getElementById('pbTlAgeS');
  if (pick && pickR) {
    smallT = Track(pick, pickR, function (a) {
      if (a === null) { return; }
      var v = Math.round(clamp(a, +pickR.min, +pickR.max));
      if (+pickR.value !== v) { pickR.value = v; pickR.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    pick.classList.add('pb-tl-alive');
  }

  /* --------------------------------------------------------- the loop -- */
  var raf = 0, last = 0, onScreen = false, lastStep = null;
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
    var wide = wideQ.matches, T = wide ? wideT : smallT;
    if (wide && wideT) { if (!wideT.t.drag) { wideT.t.want = ageFromScroll(); } focus(); }
    else { clearFocus(); }
    if (!wide && smallT && pickR) { smallT.t.want = +pickR.value; }
    if (T) {
      var t = T.t, k = t.drag ? 600 : 90, c = t.drag ? 45 : 14;
      var acc = k * (t.want - t.age) - c * t.v; t.v += acc * dt; t.age += t.v * dt;
      /* a ping as each age is passed */
      AGES.forEach(function (a) { if (Math.abs(t.age - a) < 0.4 && (!t.pings[a] || now - t.pings[a] > 1.2)) { t.pings[a] = now; } });
      T.draw(now);
    }
    var on = steps.filter(function (s) { return s.classList.contains('pb-on') || s.classList.contains('pb-tl-picked'); })[0];
    if (on && on !== lastStep) { lastStep = on; on.classList.remove('pb-tl-ping'); void on.offsetWidth; on.classList.add('pb-tl-ping'); }
    if (onScreen) { raf = requestAnimationFrame(frame); }
  }
  function start() { if (!raf && onScreen) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { start(); } else { clearFocus(); } }).observe(box);
  } else { onScreen = true; start(); }
  window.addEventListener('resize', function () { if (wideT) { wideT.size(); } if (smallT) { smallT.size(); } });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { start(); } });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { if (wideT) { wideT.size(); } if (smallT) { smallT.size(); } }); }
}());
