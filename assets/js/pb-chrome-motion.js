/* The end of every page, alive (13 October 2026, Damian: the related pages
   were "boring", and the footer should be "clearer, better designed, more
   interactive"). Styled by the RELATED and FOOT blocks of CSS (byte for byte
   on every page, tools/pagebuild.py SHARED_CSS); loaded by every page straight
   before assets/js/pb-alive.js (tools/pagebuild.py CHROME_JS).

   - Related pages (and the 404's six places): while still below the screen
     the cards wait; as they arrive they rise in one after another and each
     card's drawing builds itself, its lines drawn, its bars grown, its coins
     dropped. Under the pointer or the keyboard a card lifts (CSS) and its
     drawing plays again: lines redraw, bars bounce, the magnifier sweeps, the
     gauge's needle wobbles, a coin flies from the UK to Ireland.
   - The footer: its links arrive column by column as it comes into view,
     each little drawing drawn in its tile; the big wordmark at the foot
     catches a passing light, and the light follows the pointer near it.

   Never: anything before the reader can see it (a part armed is one still
   below the screen, and it shows as soon as it is reached, focused or
   printed), the brand, Damian's qualifications or the disclosure (nothing
   here touches them or anything that holds them), or any motion at all
   without html.pb-motion: then, and without JavaScript, every card and link
   stands whole and still. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('pb-motion') || !window.requestAnimationFrame || !('IntersectionObserver' in window)) { return; }
  function on() { return root.classList.contains('pb-motion'); }
  function below(el) { return el.getBoundingClientRect().top > innerHeight * 0.92; }
  var canAnimate = typeof Element !== 'undefined' && !!Element.prototype.animate;

  /* -------------------------------------------- a part, arriving once -- */
  var waiting = [];
  function arrive(el, armed, inn, settle) {
    if (!below(el)) { return; }
    el.classList.add(armed);
    var done = false;
    function go() {
      if (done) { return; }
      done = true; io.unobserve(el);
      if (waiting.indexOf(go) >= 0) { waiting.splice(waiting.indexOf(go), 1); }
      el.classList.add(inn);
      /* once arrived it lets go of its transitions, so hover answers at once */
      setTimeout(function () { el.classList.remove(armed, inn); }, settle);
    }
    el._pbGo = go; waiting.push(go);
    io.observe(el);
    el.addEventListener('focusin', go);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && e.target._pbGo) { e.target._pbGo(); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.12 });
  /* a page restored part-way down, or a fast scroll past: whatever is on or above the screen shows */
  var cq = 0;
  function catchUp() {
    cq = 0;
    [].slice.call(document.querySelectorAll('.pb-rel-armed:not(.pb-rel-in),.pb-ft-armed:not(.pb-ft-in)')).forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight && el._pbGo) { el._pbGo(); }
    });
  }
  addEventListener('scroll', function () { if (!cq) { cq = requestAnimationFrame(catchUp); } }, { passive: true });
  addEventListener('beforeprint', function () { waiting.slice().forEach(function (go) { go(); }); });

  /* ------------------------------------------- the drawings, played -- */
  /* how each part plays again, by its class (tools/pagebuild.py ART) */
  var SPRING = 'cubic-bezier(.3,1.3,.5,1)', SMOOTH = 'cubic-bezier(.55,0,.2,1)';
  var PLAY = [
    ['pr-fly', fly],
    ['pr-spin', function () { return { k: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], d: 1000, e: SMOOTH }; }],
    ['pr-wave', function () { return { k: [{ transform: 'none' }, { transform: 'skewY(-14deg) scaleX(.84)' }, { transform: 'skewY(9deg) scaleX(.94)' }, { transform: 'skewY(-4deg)' }, { transform: 'none' }], d: 950, e: 'ease-in-out' }; }],
    ['pr-dot', function () { return { k: [{ transform: 'none' }, { transform: 'translateY(-5px)', offset: 0.4 }, { transform: 'none' }], d: 480, e: 'ease-in-out' }; }],
    ['pr-r', function () { return { k: [{ transform: 'none' }, { transform: 'rotate(-18deg)', offset: 0.3 }, { transform: 'rotate(10deg)', offset: 0.6 }, { transform: 'rotate(-3deg)', offset: 0.85 }, { transform: 'none' }], d: 1100, e: 'ease-out' }; }],
    ['pr-s', function () { return { k: [{ transform: 'none' }, { transform: 'translateX(-32px)', offset: 0.45 }, { transform: 'translateX(5px)', offset: 0.8 }, { transform: 'none' }], d: 1100, e: 'ease-in-out' }; }],
    ['pr-d', function () { return { k: [{ strokeDasharray: '1 2', strokeDashoffset: 1.01 }, { strokeDasharray: '1 2', strokeDashoffset: 0 }], d: 800, e: SMOOTH }; }],
    ['pr-g', function () { return { k: [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.45)', offset: 0.3 }, { transform: 'scaleY(1.08)', offset: 0.72 }, { transform: 'scaleY(1)' }], d: 760, e: 'ease-in-out' }; }],
    ['pr-x', function () { return { k: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], d: 650, e: SPRING }; }],
    ['pr-y', function () { return { k: [{ transform: 'none' }, { transform: 'translateY(-9px)', offset: 0.4 }, { transform: 'none' }], d: 560, e: 'ease-in-out' }; }],
    ['pr-p', function () { return { k: [{ transform: 'scale(1)' }, { transform: 'scale(1.24)', offset: 0.35 }, { transform: 'scale(.94)', offset: 0.7 }, { transform: 'scale(1)' }], d: 620, e: 'ease-in-out' }; }]
  ];
  /* a coin crossing its route, which ends where the coin rests: the route's
     points as offsets from there, then a little landing bounce */
  function fly(el) {
    var route = el.ownerSVGElement && el.ownerSVGElement.querySelector('.pr-route');
    if (!route || !route.getTotalLength) { return null; }
    var cx = parseFloat(el.getAttribute('cx')) || 0, cy = parseFloat(el.getAttribute('cy')) || 0, len, k = [], i, n = 16;
    try { len = route.getTotalLength(); } catch (e) { return null; }
    for (i = 0; i <= n; i++) {
      var pt = route.getPointAtLength(len * i / n);
      k.push({ transform: 'translate(' + (pt.x - cx).toFixed(2) + 'px,' + (pt.y - cy).toFixed(2) + 'px)', offset: 0.84 * i / n });
    }
    k.push({ transform: 'scale(1.25,.8)', offset: 0.92 }, { transform: 'none', offset: 1 });
    return { k: k, d: 1500, e: 'linear' };
  }
  function play(card) {
    /* not while the cards are still arriving: their transitions hold the same properties */
    if (!canAnimate || !on() || card._pbBusy || card.closest('.pb-rel-armed')) { return; }
    var longest = 0;
    [].slice.call(card.querySelectorAll('.pb-related-art svg [class*="pr-"]')).forEach(function (el) {
      var spec = null;
      for (var i = 0; i < PLAY.length && !spec; i++) { if (el.classList.contains(PLAY[i][0])) { spec = PLAY[i][1](el); } }
      if (!spec) { return; }
      var delay = (parseFloat(el.style.getPropertyValue('--o')) || 0) * 55;
      try { el.animate(spec.k, { duration: spec.d, delay: delay, easing: spec.e, fill: 'backwards' }); } catch (e) { return; }
      longest = Math.max(longest, delay + spec.d);
    });
    card._pbBusy = true;
    setTimeout(function () { card._pbBusy = false; }, longest + 60);
  }

  /* ---------------------------------------- the related cards -- */
  [].slice.call(document.querySelectorAll('.pb-related, .pb-nf-six')).forEach(function (box) {
    arrive(box, 'pb-rel-armed', 'pb-rel-in', 2900);
    [].slice.call(box.querySelectorAll('a')).forEach(function (card) {
      if (!card.querySelector('.pb-related-art')) { return; }
      card.addEventListener('pointerenter', function () { play(card); });
      card.addEventListener('focus', function () { var kb = true; try { kb = card.matches(':focus-visible'); } catch (e) {} if (kb) { play(card); } });
    });
  });

  /* --------------------------------------------------- the footer -- */
  var foot = document.querySelector('footer');
  var top = foot && foot.querySelector('.foot-top');
  if (top) { arrive(top, 'pb-ft-armed', 'pb-ft-in', 2600); }

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
