/* The whole site, alive (9 October 2026, Damian's brief: "go through every
   page and go all out as a motion designer ... as interesting and friendly as
   possible"). One layer every page carries, styled by the ALIVE block of CSS
   (tools/pagebuild.py SHARED_CSS, byte for byte on every page).

   - Headlines: each page's h1 rises in word by word out of a mask, and a
     highlighted phrase gets a sweep under it; each section heading does the
     same as it comes into view, and its eyebrow slides in beside it.
   - Blocks: cards, questions, steps and the closing bands rise into place as
     they arrive, one after another.
   - Buttons are magnetic (they lean toward the pointer), shine as you
     hover, and ripple where you press; the booking buttons breathe paw
     prints while you hover them.
   - Cards that are links tilt toward the pointer in 3D, with a light on them
     that follows it.
   - Questions open and close on a spring instead of snapping.
   - Page headers have paws drifting behind the words, parting round the
     pointer; a tap in the header scatters a few more.
   - The Pensionbuddy mark taps its toes when you point at it, and once when
     the page arrives; a paw walks along the top of the footer when you reach
     it; a thin line along the top of long pages shows how far you have read,
     with a paw riding its end.

   Never touched: anything the motion system calls a caveat (PBMotion.CAVEATS:
   the warnings, the regulator and QFA lines, sources, the legal pages' text),
   nor any block that holds one, nor what another script already moves. With
   motion turned off (html without .pb-motion) none of this runs. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame || !('IntersectionObserver' in window)) { return; }
  var CAV = (window.PBMotion && window.PBMotion.CAVEATS) || '.pb-caveat,.pb-warn,.pb-reg,.pb-reviewed,.pb-src';
  /* a regulator or QFA line is a caveat wherever it sits, by its words (as tests/regulator-lines.test.py reads them) */
  var REG = /Central\s+Bank\s+of\s+Ireland|Qualified\s+Financial\s+Adviser|\bQFA\b|\bQ\.\s*F\.\s*A\b/;
  function isCaveat(el) { try { return !!el.closest(CAV) || REG.test(el.textContent || ''); } catch (e) { return true; } }
  function holdsCaveat(el) { try { return !!el.querySelector(CAV) || REG.test(el.textContent || ''); } catch (e) { return true; } }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  var main = document.getElementById('main') || document.body;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  function below(el) { var r = el.getBoundingClientRect(); return r.top > innerHeight * 0.92; }
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }

  /* ------------------------------------------------- one overlay canvas -- */
  var fx = null, fcx = null, parts = [], fraf = 0, flast = 0;
  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  function paw(cx, x, y, size, a, col, alpha) {
    if (!PAD || alpha <= 0.003) { return; }
    cx.save(); cx.globalAlpha = alpha; cx.fillStyle = col; cx.translate(x, y); cx.rotate(a); var k = size / 64; cx.scale(k, k); cx.translate(-32, -36);
    TOE.forEach(function (e) { cx.beginPath(); cx.ellipse(e[0], e[1], e[2], e[3], e[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); });
    cx.fill(PAD); cx.restore();
  }
  function overlay() {
    if (fx) { return; }
    fx = document.createElement('canvas'); fx.className = 'pb-al-fx'; fx.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fx); fcx = fx.getContext('2d');
  }
  function spawn(p) { overlay(); parts.push(p); if (parts.length > 160) { parts.splice(0, parts.length - 160); } if (!fraf) { flast = performance.now() / 1000; fraf = requestAnimationFrame(fstep); } }
  function fstep(ms) {
    fraf = 0;
    var now = ms / 1000, dt = clamp(now - flast, 0, 1 / 30), d = Math.min(window.devicePixelRatio || 1, 2); flast = now;
    if (fx.width !== Math.round(innerWidth * d) || fx.height !== Math.round(innerHeight * d)) { fx.width = Math.round(innerWidth * d); fx.height = Math.round(innerHeight * d); }
    fcx.setTransform(d, 0, 0, d, 0, 0); fcx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) {
      p.age += dt; if (p.age > p.life) { return false; }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += (p.va || 0) * dt;
      var k = p.age / p.life, al = p.alpha * (k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.55) / 0.45));
      paw(fcx, p.x, p.y, p.size * (0.7 + 0.3 * Math.min(1, p.age * 5)), p.a, p.col, al);
      return true;
    });
    if (parts.length) { fraf = requestAnimationFrame(fstep); } else { fcx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  var COLS = ['#14CBB1', '#0B7A6E', '#586B85', '#F4B740'];
  function puff(x, y, n, spread, speed) {
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * (spread || 2.4), v = (speed || 260) * (0.5 + Math.random() * 0.7);
      spawn({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 520, a: (Math.random() - 0.5) * 1.2, va: (Math.random() - 0.5) * 4, size: 13 + Math.random() * 9, col: COLS[i % COLS.length], alpha: 0.9, age: 0, life: 0.9 + Math.random() * 0.4 });
    }
  }

  /* a confetti of paws and coins from (x, y), for the pages' own pieces of motion */
  function confetti(x, y, n, speed) {
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.8, v = (speed || 700) * (0.45 + Math.random() * 0.7);
      spawn({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 900, a: Math.random() * 6, va: (Math.random() - 0.5) * 10, size: 14 + Math.random() * 14, col: COLS[i % COLS.length], alpha: 0.95, age: 0, life: 1.4 + Math.random() * 0.8 });
    }
  }
  /* the pages' own scripts load before this one and reach for these at the moment they need them */
  window.PBAlive = { puff: puff, confetti: confetti, paw: paw };

  /* ------------------------------------------------- words out of a mask -- */
  /* the words of a heading, each in a mask it rises out of; a full stop
     after a highlight keeps to its line, as on the audience heroes */
  function split(h) {
    if (h.classList.contains('pb-al-split') || h.classList.contains('pb-words')) { return 0; }
    var n = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var lead = /^[.,!?;:’')]+/.exec(c.textContent), prev = c.previousSibling;
          if (lead && prev && prev.nodeType === 1) {
            var ws = prev.querySelectorAll ? prev.querySelectorAll('.pb-al-w') : [], last = ws[ws.length - 1];
            if (last) { last.textContent += lead[0]; c.textContent = c.textContent.slice(lead[0].length); }
          }
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) { return; }
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var m = document.createElement('span'); m.className = 'pb-al-m';
            var s = document.createElement('span'); s.className = 'pb-al-w'; s.style.setProperty('--i', n++); s.textContent = w;
            m.appendChild(s); frag.appendChild(m);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'svg' && c.tagName !== 'SVG' && !c.classList.contains('tk-sr')) { walk(c); }
      });
    })(h);
    h.classList.add('pb-al-split');
    return n;
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) { return; }
      io.unobserve(e.target);
      go(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  function go(el) {
    if (el.classList.contains('pb-al-on')) { return; }
    el.classList.add('pb-al-on');
    if (el._alDone) { el._alDone(); }
    /* once a block has risen it lets go of its transition, so a tilt answers at once */
    if (el.classList.contains('pb-al-rise')) {
      setTimeout(function () { el.classList.remove('pb-al-rise', 'pb-al-on', 'pb-al-3d'); el.style.removeProperty('--al-d'); }, 1100 + (parseFloat(el.style.getPropertyValue('--al-d')) || 0));
    }
  }
  /* a page restored part-way down: whatever is already above the screen is shown, not left waiting */
  function catchUp() { [].forEach.call(document.querySelectorAll('.pb-al-rise:not(.pb-al-on),.pb-al-h2:not(.pb-al-on),.pb-al-eye:not(.pb-al-on)'), function (el) { if (el.getBoundingClientRect().top < innerHeight) { io.unobserve(el); go(el); } }); }
  addEventListener('load', function () { setTimeout(catchUp, 60); });
  addEventListener('scroll', function () { if (!catchUp.q) { catchUp.q = requestAnimationFrame(function () { catchUp.q = 0; catchUp(); }); } }, { passive: true });
  function sweepLater(h, n) {
    h._alDone = function () { setTimeout(function () { h.classList.add('pb-al-swept'); }, 260 + n * 55); };
  }

  /* the page's own headline: at once if it is on screen, else as it arrives */
  [].forEach.call(main.querySelectorAll('h1'), function (h) {
    if (isCaveat(h) || !visible(h) || h.querySelector('.pb-ok-tick') || h.closest('.aud-hero')) { h.classList.add('pb-al-on'); return; }
    var n = split(h); sweepLater(h, n);
    if (below(h)) { io.observe(h); } else { requestAnimationFrame(function () { go(h); }); }
  });
  /* the section headings, as they come into view */
  [].forEach.call(main.querySelectorAll('h2'), function (h) {
    if (isCaveat(h) || !visible(h) || h.closest('.panel,.pb-tocbar,form,.tk-sr,.pb-cs,.pb-life,.pb-al-skip') || !below(h)) { return; }
    var n = split(h); sweepLater(h, n); h.classList.add('pb-al-h2'); io.observe(h);
  });
  /* eyebrows and kickers slide in beside their headings */
  [].forEach.call(main.querySelectorAll('.eyebrow,.kicker'), function (e) {
    if (isCaveat(e) || !visible(e) || !below(e)) { return; }
    e.classList.add('pb-al-eye'); io.observe(e);
  });

  /* ------------------------------------------------------------ blocks -- */
  var BLOCKS = '.pb-related-card,main details,.benefit,.cover,.bothcard,.step:not(.pb-cs-step),.callout,.final,.cta-card,.chart-card,' +
    '.vs-card,.pb-nf-six > li,.pb-offer-item,.arc-card,.tmember,.pb-story-shots figure,.pb-after,.pb-quals,.gterm,.ck-item,.ck li,.dline,.benefits > *,.aud-cards > *';
  /* A transform makes a block the offset parent of everything in it (in
     Chrome), so while a block rose its words measured a border's width away
     from where they measure after (tests/ux4.test.mjs R38-2 reads every
     heading, paragraph and list item's offsets as the page scrolls). So a
     block that rises is made positioned for good before it moves, and its
     words measure the same before, during and after. Only when nothing
     absolutely placed in it hangs from an ancestor outside it (a box under
     a pixel, screen-reader text, does not count), and nothing in it is
     fixed or hidden and placed: such a block does not rise at all. */
  function steady(b) {
    if (getComputedStyle(b).position !== 'static') { return true; }
    /* never into a closed question beyond its summary: Chrome keeps that
       content locked, and measuring it there leaves it measurable later */
    var tw = document.createTreeWalker(b, NodeFilter.SHOW_ELEMENT, { acceptNode: function (x) {
      var d = x.parentElement && x.parentElement.closest('details');
      return d && !d.open && b.contains(d) && x.parentElement === d && x.tagName !== 'SUMMARY' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    } }), n;
    while ((n = tw.nextNode())) {
      var pos = getComputedStyle(n).position;
      if (pos === 'fixed') { return false; }
      if (pos !== 'absolute') { continue; }
      if (!n.getClientRects().length) { return false; }
      var r = n.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) { continue; }
      if (!n.offsetParent || !b.contains(n.offsetParent)) { return false; }
    }
    b.style.position = 'relative'; return true;
  }
  var seen = [];
  [].forEach.call(document.querySelectorAll(BLOCKS), function (b) {
    if (!main.contains(b) && !b.closest('main')) { return; }
    if (seen.indexOf(b) >= 0 || isCaveat(b) || holdsCaveat(b) || !visible(b) || !below(b)) { return; }
    if (b.closest('.pb-lc,.pb-cs,.pb-tl,[data-pb-pop],.pb-al-skip') || b.hasAttribute('data-pb-pop') || !steady(b)) { return; }
    seen.push(b);
    /* the order among its own siblings sets its beat */
    var sib = [].filter.call(b.parentNode.children, function (x) { return seen.indexOf(x) >= 0; });
    b.style.setProperty('--al-d', (Math.min(sib.length - 1, 6) * 70) + 'ms');
    /* the tilt in depth only for a narrow block of words: through a perspective
       a chart's lines and bars skew (a bar of no width measures one), while a
       flat rise only scales them, every proportion kept */
    b.classList.add('pb-al-rise');
    if (b.getBoundingClientRect().width < Math.min(640, innerWidth * 0.7) && !b.matches('.pb-bleed,.callout,.final,.chart-card') && !b.querySelector('svg:not(.ico),canvas,[class*="-track"]')) { b.classList.add('pb-al-3d'); }
    io.observe(b);
  });

  /* ----------------------------------------------------------- buttons -- */
  function magnet(b) {
    var st = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, raf: 0, last: 0 };
    function loop(ms) {
      st.raf = 0; var now = ms / 1000, dt = clamp(now - st.last, 0, 1 / 30); st.last = now;
      st.vx += (260 * (st.tx - st.x) - 16 * st.vx) * dt; st.x += st.vx * dt;
      st.vy += (260 * (st.ty - st.y) - 16 * st.vy) * dt; st.y += st.vy * dt;
      b.style.translate = st.x.toFixed(2) + 'px ' + st.y.toFixed(2) + 'px';
      if (Math.abs(st.tx - st.x) + Math.abs(st.ty - st.y) + Math.abs(st.vx) + Math.abs(st.vy) > 0.05) { st.raf = requestAnimationFrame(loop); }
      else { b.style.translate = st.tx || st.ty ? b.style.translate : ''; }
    }
    function kick() { if (!st.raf) { st.last = performance.now() / 1000; st.raf = requestAnimationFrame(loop); } }
    b.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') { return; }
      var r = b.getBoundingClientRect();
      st.tx = clamp((e.clientX - r.left - r.width / 2) * 0.16, -7, 7); st.ty = clamp((e.clientY - r.top - r.height / 2) * 0.28, -5, 5);
      b.style.setProperty('--al-sx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      kick();
    });
    b.addEventListener('pointerleave', function () { st.tx = st.ty = 0; kick(); });
  }
  [].forEach.call(document.querySelectorAll('.btn, .pt-add, .ck-print, .pb-jar-rates button, .seg button'), function (b) {
    if (isCaveat(b) || b.closest('.pb-al-skip')) { return; }
    b.classList.add('pb-al-btn');
    if (fine && b.classList.contains('btn')) { magnet(b); }
    var shine = document.createElement('span'); shine.className = 'pb-al-shine'; shine.setAttribute('aria-hidden', 'true'); b.appendChild(shine);
    b.addEventListener('pointerdown', function (e) {
      var r = b.getBoundingClientRect(), s = document.createElement('span'), size = Math.max(r.width, r.height) * 2.2;
      s.className = 'pb-al-ripple'; s.setAttribute('aria-hidden', 'true');
      s.style.width = s.style.height = size + 'px';
      s.style.left = (e.clientX - r.left - size / 2) + 'px'; s.style.top = (e.clientY - r.top - size / 2) + 'px';
      b.appendChild(s); setTimeout(function () { if (s.parentNode) { s.parentNode.removeChild(s); } }, 700);
      /* a button that stays on this page gets a few paws too */
      if (b.tagName === 'BUTTON') { puff(e.clientX, e.clientY, 5, 2.2, 220); }
    });
  });
  /* the booking buttons breathe paw prints while you point at them */
  if (fine) {
    [].forEach.call(document.querySelectorAll('a.btn[href="booking.html"], a.btn[href^="booking.html#"]'), function (b) {
      var t = 0;
      b.addEventListener('pointerenter', function () {
        clearInterval(t);
        var emit = function () { var r = b.getBoundingClientRect(); spawn({ x: r.left + r.width * (0.2 + Math.random() * 0.6), y: r.top + 4, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 40, g: 0, a: (Math.random() - 0.5) * 0.8, va: (Math.random() - 0.5), size: 12 + Math.random() * 6, col: Math.random() < 0.5 ? '#14CBB1' : '#0B7A6E', alpha: 0.75, age: 0, life: 1.3 }); };
        emit(); t = setInterval(emit, 240);
      });
      b.addEventListener('pointerleave', function () { clearInterval(t); });
    });
  }

  /* ---------------------------------------------------- cards that tilt -- */
  function tilt(c) {
    var st = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, raf: 0, last: 0 };
    var glare = document.createElement('span'); glare.className = 'pb-al-glare'; glare.setAttribute('aria-hidden', 'true'); c.appendChild(glare);
    function loop(ms) {
      st.raf = 0; var now = ms / 1000, dt = clamp(now - st.last, 0, 1 / 30); st.last = now;
      st.vx += (200 * (st.tx - st.x) - 18 * st.vx) * dt; st.x += st.vx * dt;
      st.vy += (200 * (st.ty - st.y) - 18 * st.vy) * dt; st.y += st.vy * dt;
      c.style.transform = 'perspective(900px) rotateX(' + st.x.toFixed(2) + 'deg) rotateY(' + st.y.toFixed(2) + 'deg)';
      if (Math.abs(st.tx - st.x) + Math.abs(st.ty - st.y) + Math.abs(st.vx) + Math.abs(st.vy) > 0.02) { st.raf = requestAnimationFrame(loop); }
      else if (!st.tx && !st.ty) { c.style.transform = ''; }
    }
    function kick() { if (!st.raf) { st.last = performance.now() / 1000; st.raf = requestAnimationFrame(loop); } }
    c.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') { return; }
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      st.tx = (py - 0.5) * -8; st.ty = (px - 0.5) * 10;
      c.style.setProperty('--al-gx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--al-gy', (py * 100).toFixed(1) + '%');
      kick();
    });
    c.addEventListener('pointerleave', function () { st.tx = st.ty = 0; kick(); });
  }
  if (fine) {
    [].forEach.call(document.querySelectorAll('.pb-related-card, .pb-card-link:not(.pb-tl-step):not(.pb-lc), a.assure, .pb-nf-six a, .benefit, .cover'), function (c) {
      if (isCaveat(c) || holdsCaveat(c) || c.closest('.pb-al-skip,.pb-lc')) { return; }
      c.classList.add('pb-al-tilt'); tilt(c);
    });
  }

  /* ------------------------------------------- questions on a spring -- */
  [].forEach.call(main.querySelectorAll('details'), function (d) {
    var s = d.querySelector(':scope > summary');
    if (!s || isCaveat(d) || !d.animate) { return; }
    d.classList.add('pb-al-q');
    s.addEventListener('click', function (e) {
      e.preventDefault();
      if (d._a) { d._a.cancel(); }
      var start = d.getBoundingClientRect().height, cs = getComputedStyle(d);
      d.style.overflow = 'hidden';
      if (!d.open) {
        d.open = true;
        var end = d.getBoundingClientRect().height;
        d.classList.add('pb-al-opening');
        d._a = d.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.25,1.12)' });
        d._a.onfinish = function () { d._a = null; d.style.overflow = ''; d.classList.remove('pb-al-opening'); };
      } else {
        var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
        var shut = s.getBoundingClientRect().height + pad;
        d._a = d.animate([{ height: start + 'px' }, { height: shut + 'px' }], { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)' });
        d._a.onfinish = function () { d._a = null; d.open = false; d.style.overflow = ''; };
      }
    });
  });

  /* ------------------------------------------------- the page header -- */
  [].forEach.call(document.querySelectorAll('.phead, .page-head'), function (head) {
    if (isCaveat(head)) { return; }
    var cv = document.createElement('canvas'); cv.className = 'pb-al-headfx'; cv.setAttribute('aria-hidden', 'true');
    head.classList.add('pb-al-head'); head.insertBefore(cv, head.firstChild);
    var cx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, ptr = null, raf = 0, last = 0, on = false, fl = [], seed = 99, stir = performance.now() / 1000;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function size() {
      var b = head.getBoundingClientRect(); W = b.width; H = b.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var n = Math.round(clamp(W * H / 26000, 8, 24)); seed = 99; fl = [];
      for (var i = 0; i < n; i++) { var z = 0.35 + rnd() * 0.65; fl.push({ x: rnd() * W, y: rnd() * H, z: z, s: 12 + 18 * z, a: (rnd() - 0.5) * 1.4, ph: rnd() * 6.3, ox: 0, oy: 0, vx: 0, vy: 0 }); }
    }
    function frame(ms) {
      raf = 0; var now = ms / 1000, dt = clamp(now - last, 0, 1 / 30); last = now;
      if (!W) { size(); }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      fl.forEach(function (f) {
        f.x += Math.sin(now * 0.3 + f.ph) * 6 * f.z * dt; f.y -= (3 + 7 * f.z) * dt;
        if (f.y < -30) { f.y = H + 30; }
        var tx = 0, ty = 0;
        if (ptr) { var dx = f.x - ptr.x, dy = f.y - ptr.y, d = Math.sqrt(dx * dx + dy * dy) || 1; if (d < 140) { var g = Math.pow(1 - d / 140, 2) * 60; tx = dx / d * g; ty = dy / d * g; } }
        f.vx += (50 * (tx - f.ox) - 8 * f.vx) * dt; f.ox += f.vx * dt; f.vy += (50 * (ty - f.oy) - 8 * f.vy) * dt; f.oy += f.vy * dt;
        paw(cx, f.x + f.ox, f.y + f.oy, f.s, f.a + Math.sin(now * 0.5 + f.ph) * 0.2, '#0B7A6E', 0.035 + 0.06 * f.z);
      });
      /* the paws settle after a while with nobody about, and stir again when a pointer moves */
      if (on && !document.hidden && now - stir < 25) { raf = requestAnimationFrame(frame); }
    }
    function wake() { if (!raf && on) { last = performance.now() / 1000; raf = requestAnimationFrame(frame); } }
    head.addEventListener('pointermove', function (e) { var b = head.getBoundingClientRect(); ptr = { x: e.clientX - b.left, y: e.clientY - b.top }; stir = performance.now() / 1000; wake(); });
    head.addEventListener('pointerleave', function () { ptr = null; });
    head.addEventListener('pointerdown', function (e) { if (e.target.closest('a,button,input,label,select,textarea')) { return; } puff(e.clientX, e.clientY, 6, 3, 240); });
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) { wake(); } }).observe(head);
    window.addEventListener('resize', function () { W = 0; });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { wake(); } });
  });

  /* ------------------------------------------------- the mark and the foot -- */
  [].forEach.call(document.querySelectorAll('.logo'), function (l) { l.classList.add('pb-al-logo'); });
  var navLogo = document.querySelector('nav .logo');
  if (navLogo) { setTimeout(function () { navLogo.classList.add('pb-al-tap'); setTimeout(function () { navLogo.classList.remove('pb-al-tap'); }, 900); }, 400); }
  var foot = document.querySelector('footer');
  if (foot) {
    var strip = document.createElement('canvas'); strip.className = 'pb-al-footfx'; strip.setAttribute('aria-hidden', 'true');
    foot.classList.add('pb-al-foot'); foot.insertBefore(strip, foot.firstChild);
    var scx = strip.getContext('2d'), walking = 0, sraf = 0;
    function walk(ms) {
      sraf = 0;
      var now = ms / 1000, t = now - walking, b = strip.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2), W = b.width, H = b.height;
      if (strip.width !== Math.round(W * d)) { strip.width = Math.round(W * d); strip.height = Math.round(H * d); }
      scx.setTransform(d, 0, 0, d, 0, 0); scx.clearRect(0, 0, W, H);
      var dur = Math.max(4, W / 260), k = t / dur, x = -30 + (W + 60) * k, y = H / 2;
      /* the prints behind it, fading */
      for (var s = 0; s * 36 < x + 30; s++) {
        var px = -30 + s * 36, age = (x - px) / 260;
        if (px > x - 4) { break; }
        paw(scx, px, y + (s % 2 ? -7 : 7), 14, Math.PI / 2, '#0B7A6E', clamp(0.4 - age * 0.12, 0, 0.4));
      }
      /* and the walker, the mark itself, bobbing */
      if (k < 1) {
        var bob = Math.abs(Math.sin(t * 10)) * 4;
        scx.save(); scx.translate(x, y - bob); scx.fillStyle = '#14CBB1';
        scx.beginPath(); scx.moveTo(-9, -12); scx.arcTo(12, -12, 12, 12, 7); scx.arcTo(12, 12, -12, 12, 7); scx.arcTo(-12, 12, -12, -12, 7); scx.arcTo(-12, -12, 12, -12, 7); scx.closePath(); scx.fill();
        scx.restore(); paw(scx, x, y - bob + 1, 15, 0, '#fff', 1);
      }
      if (k < 1.6) { sraf = requestAnimationFrame(walk); } else { scx.clearRect(0, 0, W, H); }
    }
    function startWalk() { if (sraf) { return; } walking = performance.now() / 1000; sraf = requestAnimationFrame(walk); }
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) { startWalk(); } }, { threshold: 0.2 }).observe(foot);
    var fl2 = foot.querySelector('.logo'); if (fl2) { fl2.addEventListener('pointerenter', startWalk); }
  }

  /* ------------------------------------------------ how far you have read -- */
  var prog = document.querySelector('.pb-tocbar-prog');
  if (prog) {
    /* the guides' own line (assets/js/pb-guide.js) scales; the paw rides its end */
    var rider = document.createElement('span'); rider.className = 'pb-al-rider'; rider.setAttribute('aria-hidden', 'true');
    prog.parentNode.appendChild(rider);
    var ride = function () { var m = /scaleX\(([\d.]+)\)/.exec(prog.style.transform || ''), k = m ? +m[1] : 0; rider.style.left = (k * 100).toFixed(2) + '%'; rider.classList.toggle('pb-on', k > 0.01 && k < 0.995); };
    new MutationObserver(ride).observe(prog, { attributes: true, attributeFilter: ['style'] }); ride();
  }
  if (!prog && document.documentElement.scrollHeight > innerHeight * 2.6) {
    var bar = document.createElement('div'); bar.className = 'pb-al-read'; bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<i></i>'; document.body.appendChild(bar);
    var fill = bar.firstChild, rq = 0;
    var upd = function () {
      rq = 0; var max = document.documentElement.scrollHeight - innerHeight, k = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
      fill.style.width = (k * 100).toFixed(2) + '%'; bar.classList.toggle('pb-on', k > 0.01 && k < 0.995);
    };
    addEventListener('scroll', function () { if (!rq) { rq = requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
}());
