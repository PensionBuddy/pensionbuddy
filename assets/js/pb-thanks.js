/* The thank-you page, celebrating (8 October 2026, Damian's brief): the most
   important click on the site gets a party.

   - as the tick draws itself, a burst of paw-print confetti flies up out of
     it, with two smaller bursts from the bottom corners a beat later;
   - "booked in" gets a teal sweep under it, and the three next steps arrive
     one after another;
   - click or tap anywhere for another handful of paws; the letterhead's paw
     jumps when it is tapped.

   Paws, rounded flakes and coins, in the brand's teal, mint, amber and ink,
   on one fixed canvas over the page that never takes a click. The loop stops
   when the last piece has gone. With motion turned off nothing moves. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame) { return; }
  var cv = document.createElement('canvas');
  cv.className = 'pb-party'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var cx = cv.getContext('2d');
  if (!cx) { return; }
  var W = 0, H = 0, dpr = 1, bits = [], raf = 0, last = 0;
  var COLS = ['#14CBB1', '#0B7A6E', '#7FE3D3', '#F4B740', '#0B1F1C', '#16C9B0'];
  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  function size() {
    W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  size();
  window.addEventListener('resize', size);

  /* one burst: n pieces from (x, y), aimed at angle a (radians, 0 = right, -PI/2 = up), spread s */
  function burst(x, y, n, a, s, speed) {
    for (var i = 0; i < n; i++) {
      var ang = a + (Math.random() - 0.5) * s, v = speed * (0.55 + Math.random() * 0.6), kind = Math.random();
      bits.push({
        x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 12,
        size: kind < 0.5 ? 18 + Math.random() * 14 : 8 + Math.random() * 7,
        kind: kind < 0.5 ? 'paw' : kind < 0.8 ? 'flake' : 'coin',
        col: COLS[Math.floor(Math.random() * COLS.length)],
        ph: Math.random() * 6.28, life: 3.2 + Math.random() * 1.6, age: 0
      });
    }
    if (bits.length > 400) { bits.splice(0, bits.length - 400); }
    if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); }
  }
  function draw(b) {
    var fade = 1 - Math.max(0, (b.age - (b.life - 0.8)) / 0.8);
    if (fade <= 0) { return; }
    cx.save(); cx.globalAlpha = fade; cx.translate(b.x, b.y); cx.rotate(b.rot);
    cx.fillStyle = b.col;
    if (b.kind === 'paw' && PAD) {
      /* a paper paw turns as it falls: squash it across */
      var k = b.size / 64; cx.scale(k * Math.cos(b.ph + b.age * 5), k); cx.translate(-32, -36);
      TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); });
      cx.fill(PAD);
    } else if (b.kind === 'coin') {
      cx.scale(Math.cos(b.ph + b.age * 7), 1);
      cx.beginPath(); cx.arc(0, 0, b.size * 0.7, 0, Math.PI * 2); cx.fill();
      cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(0, 0, b.size * 0.45, 0, Math.PI * 2); cx.stroke();
    } else {
      cx.scale(1, Math.cos(b.ph + b.age * 9));
      var w = b.size * 1.6, h = b.size * 0.8;
      cx.beginPath(); if (cx.roundRect) { cx.roundRect(-w / 2, -h / 2, w, h, h / 2); } else { cx.rect(-w / 2, -h / 2, w, h); } cx.fill();
    }
    cx.restore();
  }
  function frame(ms) {
    raf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, Math.max(0, now - last)); last = now;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    bits = bits.filter(function (b) {
      b.age += dt;
      /* gravity, air, and a flutter that grows as the piece slows */
      b.vy += 900 * dt; b.vx *= Math.pow(0.35, dt); b.vy *= Math.pow(b.vy > 0 ? 0.25 : 0.6, dt);
      b.x += (b.vx + Math.sin(b.ph + b.age * 4) * 40) * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
      if (b.age > b.life || b.y > H + 60) { return false; }
      draw(b);
      return true;
    });
    if (bits.length) { raf = requestAnimationFrame(frame); }
  }

  /* the opening: out of the tick as it lands, then the corners */
  var tick = document.querySelector('.pb-ok-tick'), h1 = tick && tick.closest('h1');
  if (h1) { h1.classList.add('pb-party-h1'); }
  setTimeout(function () {
    var r = tick ? tick.getBoundingClientRect() : { left: W / 2, top: H / 3, width: 0, height: 0 };
    burst(r.left + r.width / 2, r.top + r.height / 2, 70, -Math.PI / 2, 2.4, 1100);
    if (h1) { h1.classList.add('pb-party-go'); }
  }, 520);
  setTimeout(function () {
    burst(0, H, 34, -Math.PI / 3, 0.6, 1500);
    burst(W, H, 34, -Math.PI * 2 / 3, 0.6, 1500);
  }, 820);
  /* the next steps, one after another */
  [].forEach.call(document.querySelectorAll('.timeline .tl'), function (el, i) {
    el.classList.add('pb-party-step');
    setTimeout(function () { el.classList.add('pb-party-in'); }, 700 + i * 220);
  });

  /* and again, wherever you click */
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('a,button,input,select,textarea,label,[role=button]')) { return; }
    burst(e.clientX, e.clientY, 16, -Math.PI / 2, 2.6, 650);
  });
  var paw = document.querySelector('.letterhead .paw');
  if (paw) {
    paw.addEventListener('pointerdown', function () {
      paw.classList.remove('pb-party-jump'); void paw.offsetWidth; paw.classList.add('pb-party-jump');
      var r = paw.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 14, -Math.PI / 2, 2, 700);
    });
  }
}());
