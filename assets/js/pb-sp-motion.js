/* The two State Pension pages, alive (9 October 2026, Damian's brief): the
   reality check and the entitlement check. A module of both page records in
   tools/pagebuild.py; it reads what the pages' own scripts write and never
   writes a figure.

   - The forty dots (reality check): each year that lights drops into the
     jar and bounces, one after another; a year that goes out pops. Forty
     of forty, a full record, bursts and says so.
   - The figures roll in, digit by digit, whenever they change: the weekly
     and yearly rates on both pages, and each method's rate on the
     entitlement check.
   - The bars spring to their widths instead of jumping: the living
     standards, both methods, and your record.
   - The entitlement check's higher method, the one the Department pays,
     glows, and pulses when it changes hands.

   With motion turned off none of this runs. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.MutationObserver) { return; }
  var calc = document.querySelector('[data-pb-calc="state-pension-reality-check"],[data-pb-calc="state-pension-entitlement"]');
  if (!calc) { return; }
  root.classList.add('pb-sp-alive');
  function $(id) { return document.getElementById(id); }

  /* --------------------------------------------------- rolling figures -- */
  function roll(el) {
    var t = el.textContent;
    if (el.getAttribute('data-roll') === t) { return; }
    var old = el.getAttribute('data-roll') || '';
    el.setAttribute('data-roll', t);
    var frag = document.createDocumentFragment(), k = 0;
    t.split('').forEach(function (c, i) {
      /* a space stays a plain space: an inline-block holding one collapses */
      if (c === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
      var s = document.createElement('span'); s.textContent = c;
      /* only the characters that changed roll; the rest stand still */
      if (c !== old.charAt(i - (t.length - old.length)) || !old) { s.className = 'pb-roll'; s.style.animationDelay = (k++ * 35) + 'ms'; }
      frag.appendChild(s);
    });
    el.textContent = ''; el.appendChild(frag);
    el.setAttribute('data-roll', el.textContent);
  }
  ['spWeekly', 'spAnnual', 'm1Rate', 'm2Rate'].forEach(function (id) {
    var el = $(id); if (!el) { return; }
    new MutationObserver(function () { roll(el); }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* -------------------------------------------------- the forty dots -- */
  var jar = $('pbJar'), dots = jar ? [].slice.call(jar.querySelectorAll('.pb-jar-dot')) : [];
  var batch = 0, batchT = 0;
  function delay() {
    var t = performance.now();
    if (t - batchT > 60) { batch = 0; }
    batchT = t; return (batch++ * 28);
  }
  dots.forEach(function (d) {
    var was = d.classList.contains('pb-on');
    new MutationObserver(function () {
      var on = d.classList.contains('pb-on');
      if (on === was) { return; }
      was = on;
      d.classList.remove('pb-dropin', 'pb-popout'); void d.offsetWidth;
      d.style.animationDelay = (on ? delay() : 0) + 'ms';
      d.classList.add(on ? 'pb-dropin' : 'pb-popout');
    }).observe(d, { attributes: true, attributeFilter: ['class'] });
  });
  /* the opening: the page lights them before this can watch, so pour them in once */
  if (dots.length) {
    dots.filter(function (d) { return d.classList.contains('pb-on'); }).forEach(function (d, i) {
      d.style.animationDelay = (250 + i * 28) + 'ms'; d.classList.add('pb-dropin');
    });
  }
  /* forty of forty */
  var party = null, pcx = null, bits = [], raf = 0, last = 0;
  function burst(x, y) {
    if (!party) { party = document.createElement('canvas'); party.className = 'pb-sp-party'; party.setAttribute('aria-hidden', 'true'); document.body.appendChild(party); pcx = party.getContext('2d'); }
    var d = Math.min(window.devicePixelRatio || 1, 2); party.width = Math.round(innerWidth * d); party.height = Math.round(innerHeight * d);
    for (var i = 0; i < 40; i++) { var a = Math.random() * 6.28, v = 200 + Math.random() * 450; bits.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, age: 0, r: 4 + Math.random() * 4, c: ['#16C9B0', '#7FE3D3', '#0B7A6E', '#F4B740'][i % 4] }); }
    if (!raf) { last = performance.now() / 1000; raf = requestAnimationFrame(step); }
  }
  function step(ms) {
    raf = 0; var now = ms / 1000, dt = Math.min(1 / 30, now - last), d = Math.min(window.devicePixelRatio || 1, 2); last = now;
    pcx.setTransform(d, 0, 0, d, 0, 0); pcx.clearRect(0, 0, innerWidth, innerHeight);
    bits = bits.filter(function (b) {
      b.age += dt; b.vy += 900 * dt; b.vx *= Math.pow(0.4, dt); b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.age > 1.2) { return false; }
      pcx.globalAlpha = 1 - b.age / 1.2; pcx.fillStyle = b.c; pcx.beginPath(); pcx.arc(b.x, b.y, b.r, 0, Math.PI * 2); pcx.fill(); return true;
    });
    if (bits.length) { raf = requestAnimationFrame(step); } else { pcx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  if (jar) {
    var full = jar.classList.contains('pb-full'), seen = false;
    new MutationObserver(function () {
      var f = jar.classList.contains('pb-full');
      if (f && !full && seen) {
        var r = (jar.querySelector('.pb-jar-dots') || jar).getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2);
        var b = document.createElement('span'); b.className = 'pb-sp-badge'; b.setAttribute('aria-hidden', 'true'); b.textContent = 'A full record';
        jar.appendChild(b); setTimeout(function () { if (b.parentNode) { b.parentNode.removeChild(b); } }, 2000);
      }
      full = f;
    }).observe(jar, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function () { seen = true; }, 400);
  }

  /* ----------------------------- the entitlement check: the higher method -- */
  var r1 = $('m1Row'), r2 = $('m2Row'), w1 = $('m1Rate'), w2 = $('m2Rate'), win = null;
  function cents(el) { var m = /€([\d,]+\.\d\d)/.exec(el.textContent); return m ? +m[1].replace(/,/g, '') : 0; }
  function crown() {
    if (!r1 || !r2 || !w1 || !w2) { return; }
    var a = cents(w1), b = cents(w2), now = r2.hidden || !b ? r1 : (b > a ? r2 : r1);
    if (now === win) { return; }
    [r1, r2].forEach(function (r) { r.classList.toggle('pb-sp-win', r === now); });
    if (win) { now.classList.remove('pb-sp-swap'); void now.offsetWidth; now.classList.add('pb-sp-swap'); }
    win = now;
  }
  if (w1 && w2) {
    [w1, w2, r2].forEach(function (el) { new MutationObserver(crown).observe(el, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] }); });
    setTimeout(crown, 0);
  }
}());
