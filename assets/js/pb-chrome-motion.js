/* The end of every page, alive (13 October 2026, Damian: the related pages
   were "boring", and the footer should be "clearer, better designed, more
   interactive"). Styled by the RELATED and FOOT blocks of CSS (byte for byte
   on every page, tools/pagebuild.py SHARED_CSS); loaded by every page straight
   before assets/js/pb-alive.js (tools/pagebuild.py CHROME_JS).

   - Related pages (and the 404's six places): each card waits while it is
     wholly below the screen and rises in as it comes into view, cards that
     come into view together one after another, and its drawing builds
     itself, its lines drawn, its bars grown, its coins dropped. Under the
     pointer or the keyboard a card lifts (CSS) and its drawing plays again
     from where it stands: lines run out and draw themselves back, bars
     bounce, the magnifier sweeps, the gauge's needle wobbles, a coin flies
     from the UK to Ireland. Nothing blinks out.
   - The footer: each column arrives as it comes into view, its links one
     after another, each little drawing drawn in its tile; the big wordmark at
     the foot catches a passing light, and the light follows the pointer near
     it.

   Never: anything the reader cannot see (a part is armed only while wholly
   below the screen, so one already peeking in at load stays whole; it
   arrives once it is well in view, or 0.6 s after it first shows if the
   reader stops with it just in view; it shows at once when it is focused,
   printed or scrolled past), the brand, Damian's qualifications or the
   disclosure (nothing here touches them or anything that holds them), or any
   motion at all without html.pb-motion: then, and without JavaScript, every
   card and link stands whole and still. */
/* 14 October 2026: Safari paints a button's :active state (the CLICK block's
   press on a touch screen) only once the page listens for touches. A passive
   listener that does nothing: no scroll waits on it. */
if (window.addEventListener) { document.addEventListener('touchstart', function () {}, { passive: true }); }
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame || !('IntersectionObserver' in window)) { return; }
  function on() { return root.classList.contains('pb-motion'); }
  function below(el) { return el.getBoundingClientRect().top >= innerHeight; }
  var canAnimate = typeof Element !== 'undefined' && !!Element.prototype.animate;

  /* -------------------------------------------- a part, arriving once -- */
  /* A part: the related pages' label, a card, a footer column. Parts that
     arrive in the same frame step in one after another in page order: each
     one's place is set as a custom property (step: --ci for a card, --fc for
     a column), which the CSS delays read, and taken off again once it has
     settled. */
  var parts = [], queue = [], qf = 0;
  var seen = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && e.target._pbPart) { go(e.target._pbPart); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  var near = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var p = e.target._pbPart;
      if (!p || p.done) { return; }
      clearTimeout(p.t);
      if (e.isIntersecting) { p.t = setTimeout(function () { go(p); }, 600); }
    });
  }, { threshold: 0 });
  function arm(el, armed, inn, settle, step, gap) {
    if (!below(el)) { return; }
    var p = { el: el, armed: armed, inn: inn, settle: settle, step: step, gap: gap, done: false, t: 0 };
    el._pbPart = p; parts.push(p);
    el.classList.add(armed);
    seen.observe(el); near.observe(el);
    /* a keyboard reaching it: there at once, under the focus ring */
    el.addEventListener('focusin', function () { whole(p); });
  }
  function release(p) {
    p.done = true; clearTimeout(p.t);
    seen.unobserve(p.el); near.unobserve(p.el);
  }
  function go(p, now) {
    if (p.done) { return; }
    release(p); queue.push(p);
    if (now) { flush(); } else if (!qf) { qf = requestAnimationFrame(flush); }
  }
  /* shown as it is, no motion: printed, or scrolled past unseen */
  function whole(p) {
    if (p.done) { return; }
    release(p); p.el.classList.remove(p.armed);
  }
  function flush() {
    if (qf) { cancelAnimationFrame(qf); qf = 0; }
    var batch = queue.splice(0), n = {};
    batch.sort(function (a, b) { return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1; });
    batch.forEach(function (p) {
      var k = 0;
      if (p.step) { k = n[p.step] = p.step in n ? n[p.step] + 1 : 0; p.el.style.setProperty(p.step, k); }
      p.el.classList.add(p.inn);
      /* once arrived it lets go of its transitions, so hover answers at once */
      setTimeout(function () {
        p.el.classList.remove(p.armed, p.inn);
        if (p.step) { p.el.style.removeProperty(p.step); }
      }, p.settle + k * p.gap);
    });
  }
  /* a fast scroll, or a page restored part-way down: what is wholly above the screen is simply there */
  var cq = 0;
  function catchUp() {
    cq = 0;
    parts.forEach(function (p) { if (!p.done && p.el.getBoundingClientRect().bottom <= 0) { whole(p); } });
  }
  addEventListener('scroll', function () { if (!cq) { cq = requestAnimationFrame(catchUp); } }, { passive: true });
  addEventListener('beforeprint', function () { parts.forEach(whole); });

  /* ------------------------------------------- the drawings, played -- */
  /* how each part plays again under the pointer, by its class (tools/pagebuild.py
     ART); every replay starts and ends on the drawing as it stands */
  var SPRING = 'cubic-bezier(.3,1.3,.5,1)', SMOOTH = 'cubic-bezier(.55,0,.2,1)';
  var LEAVE = 'cubic-bezier(.5,0,.85,.45)', BACK = 'cubic-bezier(.15,.55,.3,1)';
  var PLAY = [
    ['pr-fly', fly],
    ['pr-spin', function () { return { k: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], d: 1000, e: SMOOTH }; }],
    ['pr-wave', function () { return { k: [{ transform: 'none' }, { transform: 'skewY(-14deg) scaleX(.84)' }, { transform: 'skewY(9deg) scaleX(.94)' }, { transform: 'skewY(-4deg)' }, { transform: 'none' }], d: 950, e: 'ease-in-out' }; }],
    ['pr-dot', function () { return { k: [{ transform: 'none' }, { transform: 'translateY(-5px)', offset: 0.4 }, { transform: 'none' }], d: 480, e: 'ease-in-out' }; }],
    ['pr-r', function () { return { k: [{ transform: 'none' }, { transform: 'rotate(-18deg)', offset: 0.3 }, { transform: 'rotate(10deg)', offset: 0.6 }, { transform: 'rotate(-3deg)', offset: 0.85 }, { transform: 'none' }], d: 1100, e: 'ease-out' }; }],
    ['pr-s', function () { return { k: [{ transform: 'none' }, { transform: 'translateX(-32px)', offset: 0.45 }, { transform: 'translateX(5px)', offset: 0.8 }, { transform: 'none' }], d: 1100, e: 'ease-in-out' }; }],
    /* a line runs out along its length and draws itself back from its start,
       in one movement of its dash (offset 0 to -3, the pattern's length, is
       whole to whole): never gone at once. Inside a part that spins, the
       spin is the replay. */
    ['pr-d', function (el) {
      if (el.parentNode && el.parentNode.closest && el.parentNode.closest('.pr-spin')) { return null; }
      return { k: [{ strokeDasharray: '1 2', strokeDashoffset: 0, easing: LEAVE }, { strokeDasharray: '1 2', strokeDashoffset: -1, offset: 0.36, easing: 'linear' },
        { strokeDasharray: '1 2', strokeDashoffset: -2, offset: 0.4, easing: BACK }, { strokeDasharray: '1 2', strokeDashoffset: -3 }], d: 1150, e: 'linear' };
    }],
    ['pr-g', function () { return { k: [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.45)', offset: 0.3 }, { transform: 'scaleY(1.08)', offset: 0.72 }, { transform: 'scaleY(1)' }], d: 760, e: 'ease-in-out' }; }],
    /* a bar draws back to a stub and out again */
    ['pr-x', function () { return { k: [{ transform: 'scaleX(1)', easing: LEAVE }, { transform: 'scaleX(.12)', offset: 0.32, easing: SPRING }, { transform: 'scaleX(1)' }], d: 820, e: 'linear' }; }],
    ['pr-y', function () { return { k: [{ transform: 'none' }, { transform: 'translateY(-9px)', offset: 0.4 }, { transform: 'none' }], d: 560, e: 'ease-in-out' }; }],
    ['pr-p', function () { return { k: [{ transform: 'scale(1)' }, { transform: 'scale(1.24)', offset: 0.35 }, { transform: 'scale(.94)', offset: 0.7 }, { transform: 'scale(1)' }], d: 620, e: 'ease-in-out' }; }]
  ];
  /* a coin crossing its route, which ends where the coin rests: it shrinks
     away where it rests, grows at the route's start, follows the route's
     points (as offsets from its rest), then lands with a little bounce */
  function fly(el) {
    var route = el.ownerSVGElement && el.ownerSVGElement.querySelector('.pr-route');
    if (!route || !route.getTotalLength) { return null; }
    var cx = parseFloat(el.getAttribute('cx')) || 0, cy = parseFloat(el.getAttribute('cy')) || 0, len, k = [], i, n = 16, pt;
    var at = function (x, y, s, o) { return { transform: 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + s + ')', offset: o }; };
    try { len = route.getTotalLength(); pt = route.getPointAtLength(0); } catch (e) { return null; }
    k.push(at(0, 0, 1, 0), at(0, 0, 0, 0.1), at(pt.x - cx, pt.y - cy, 0, 0.12), at(pt.x - cx, pt.y - cy, 1, 0.22));
    for (i = 1; i <= n; i++) {
      pt = route.getPointAtLength(len * i / n);
      k.push(at(pt.x - cx, pt.y - cy, 1, 0.22 + 0.64 * i / n));
    }
    k.push(at(0, 0, '1.25,.8', 0.93), at(0, 0, 1, 1));
    return { k: k, d: 1700, e: 'linear' };
  }
  function play(card) {
    /* not while the card is still arriving: its transitions hold the same properties */
    if (!canAnimate || !on() || card._pbBusy || card.closest('.pb-rel-armed')) { return; }
    var longest = 0;
    [].slice.call(card.querySelectorAll('.pb-related-art svg [class*="pr-"]')).forEach(function (el) {
      var spec = null;
      for (var i = 0; i < PLAY.length && !spec; i++) { if (el.classList.contains(PLAY[i][0])) { spec = PLAY[i][1](el); if (!spec && PLAY[i][0] === 'pr-d') { break; } } }
      if (!spec) { return; }
      var delay = (parseFloat(el.style.getPropertyValue('--o')) || 0) * 55;
      try { el.animate(spec.k, { duration: spec.d, delay: delay, easing: spec.e }); } catch (e) { return; }
      longest = Math.max(longest, delay + spec.d);
    });
    card._pbBusy = true;
    setTimeout(function () { card._pbBusy = false; }, longest + 60);
  }

  /* ---------------------------------------- the related cards -- */
  [].slice.call(document.querySelectorAll('.pb-related, .pb-nf-six')).forEach(function (box) {
    var label = box.querySelector('.pb-related-h');
    if (label) { arm(label, 'pb-rel-armed', 'pb-rel-in', 1200, null, 0); }
    [].slice.call(box.querySelectorAll('a')).forEach(function (card) {
      if (!card.querySelector('.pb-related-art')) { return; }
      var li = card.closest('li');
      if (li) { arm(li, 'pb-rel-armed', 'pb-rel-in', 2400, '--ci', 130); }
      card.addEventListener('pointerenter', function () { play(card); });
      card.addEventListener('focus', function () { var kb = true; try { kb = card.matches(':focus-visible'); } catch (e) {} if (kb) { play(card); } });
    });
  });

  /* --------------------------------------------------- the footer -- */
  var foot = document.querySelector('footer');
  if (foot) {
    [].slice.call(foot.querySelectorAll('.foot-top > .foot-col')).forEach(function (col) { arm(col, 'pb-ft-armed', 'pb-ft-in', 1700, '--fc', 120); });
  }

  /* the wordmark: a light passes once as it arrives, then follows the pointer near it */
  var mark = foot && foot.querySelector('.pb-wordmark');
  if (mark) {
    mark.classList.add('pb-wm-live');
    var cur = { x: -400, y: 0 }, aim = { x: -400, y: 0 }, raf = 0, sweep = null;
    var put = function () { mark.style.setProperty('--wx', cur.x.toFixed(1) + 'px'); mark.style.setProperty('--wy', cur.y.toFixed(1) + 'px'); };
    var step = function (ms) {
      raf = 0;
      if (!on()) { return; }
      if (sweep) {
        var k = Math.min(1, (ms - sweep.t0) / sweep.d), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        cur.x = sweep.x0 + (sweep.x1 - sweep.x0) * e; cur.y = sweep.y;
        if (k >= 1) { sweep = null; aim.x = cur.x; aim.y = cur.y; }
      } else {
        cur.x += (aim.x - cur.x) * 0.14; cur.y += (aim.y - cur.y) * 0.14;
      }
      put();
      if (sweep || Math.abs(aim.x - cur.x) + Math.abs(aim.y - cur.y) > 0.5) { raf = requestAnimationFrame(step); }
    };
    var kick = function () { if (!raf) { raf = requestAnimationFrame(step); } };
    put();
    new IntersectionObserver(function (es, obs) {
      if (!es[0].isIntersecting) { return; }
      obs.disconnect();
      var r = mark.getBoundingClientRect();
      sweep = { t0: performance.now(), d: 1900, x0: -300, x1: r.width + 300, y: r.height * 0.55 };
      kick();
    }, { threshold: 0.4 }).observe(mark);
    foot.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || sweep) { return; }
      var r = mark.getBoundingClientRect(), near = e.clientY > r.top - 90 && e.clientY < r.bottom + 60;
      aim.x = near ? e.clientX - r.left : (e.clientX - r.left < r.width / 2 ? -320 : r.width + 320);
      aim.y = near ? e.clientY - r.top : r.height * 0.55;
      kick();
    });
    foot.addEventListener('pointerleave', function () { if (!sweep) { aim.x = cur.x < mark.clientWidth / 2 ? -320 : mark.clientWidth + 320; kick(); } });
  }
}());
