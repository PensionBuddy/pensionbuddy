/*
  Media pops in once, as it scrolls into view (Run 38, item 2).

  Only media may: the home page's game cards (picture and video), the
  calculator photograph and the portraits, the product photographs beside
  the director and tracker pages' copy, the jargon buster's game tiles and
  Buddy on the 404 page. POP (below) is the whole list; where a <picture> is
  an inline box, which a transform cannot move, it names the image inside.
  Every element it finds must hold no words at all and sit in no caveat,
  warning, regulator line or form, or it is left alone. tests/ux4.test.mjs
  holds the pages to the same rule, so a heading, words, a figure, a caveat,
  a warning, the Central Bank or QFA line, or a form can never be given a
  pop-in. Starter's annotated photograph is left out (its labels would float
  over a moving picture), as is Buddy beside the booking button (nothing
  moves near a call to action: MOTION choreography rule 8), and so are the
  provider logos, which move already, in their ticker, at sizes
  tests/providers.test.py checks as drawn.

  How (the POP block of CSS, on every page):
  - Anything already on screen, or above it, when this runs is never
    touched. Anything with no size, already moved or faded by something
    else, or an inline box a transform cannot move, is left alone too.
  - Each of the others is armed off screen, in one pass (rule 9):
    data-pb-pop="sd" where CSS scroll timelines are supported and the page's
    own scroll is the element's scroller, so it rises and fades with the
    scroll over the first 40% of its entry; data-pb-pop="io" everywhere
    else (Firefox, and anything inside a box that clips, whose scroll
    timeline would be that box's, not the page's), where it waits faded and
    a little low.
  - When any of it first shows (below the nav, and above the book bar or
    cookie bar where one is up): "io" arrives on --pb-t-state (320ms) at
    once. "sd" follows the scroll, and if it has not finished 300ms later
    (--pb-arrive: a reader who stops scrolling), it arrives on --pb-t-state
    from wherever it is. A build always completes (rule 4).
  - Then it is done: the attribute comes off, it is marked pb-popped, and it
    never plays again, however the page scrolls. Anything scrolled past, out
    of the top, is done then too (it is at its end already).
  Opacity and transform only, so nothing moves anything else (no layout
  shift). With reduced motion asked for (html.pb-motion off, now or later)
  nothing is armed, and anything waiting is shown at once.

  Loads late (type="text/pb-late"); stores nothing.
*/
(function () {
  'use strict';
  var POP = '.pb-learn-media picture,.pb-learn-media video,.pb-product-shot img,.about-port img,' +
    '.pb-split-media > picture > img,.arc-tile,.pb-nf-buddy';
  var root = document.documentElement;
  var caveats = (window.PBMotion && window.PBMotion.CAVEATS) || '';
  var INSIDE = 'form,.pb-warn,.pb-reg,.pb-reviewed' + (caveats ? ',' + caveats : '');
  /* words are found by reading the text itself, below; these are the things
     that must never be inside, words or not */
  var HOLDS = 'h1,h2,h3,h4,h5,h6,label,input,select,textarea,button,form,table,.pb-warn,.pb-reg,.pb-reviewed' + (caveats ? ',' + caveats : '');
  var ARRIVE = 300;   /* --pb-arrive */
  var DONE = 400;     /* --pb-t-state is 320ms; the attribute comes off after it */

  /* media and nothing else: no words inside, nothing forbidden inside, and
     not inside a caveat, a warning, the regulator line or a form */
  function mediaOnly(el) {
    if (el.closest(INSIDE) || el.matches(HOLDS) || el.querySelector(HOLDS)) { return false; }
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) { if (/\S/.test(n.nodeValue)) { return false; } }
    return true;
  }
  /* a box between the element and the page that clips makes itself the
     element's scroller, so a scroll timeline would never move */
  function clipped(el) {
    for (var a = el.parentElement; a && a !== document.body && a !== root; a = a.parentElement) {
      var cs = getComputedStyle(a);
      if (/hidden|auto|scroll/.test(cs.overflowX + cs.overflowY)) { return true; }
    }
    return false;
  }
  window.PBPop = { selector: POP, mediaOnly: mediaOnly };

  function motion() { return root.classList.contains('pb-motion'); }
  var scrollDriven = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  var io = null, armed = [], timers = [];

  function done(el) {
    el.removeAttribute('data-pb-pop');
    el.classList.add('pb-popped');
  }
  /* arrive on the clock, from wherever it is now */
  function arrive(el) {
    var i = armed.indexOf(el);
    if (i < 0) { return; }
    armed.splice(i, 1);
    if (io) { io.unobserve(el); }
    if (el.getAttribute('data-pb-pop') === 'sd') {
      var cs = getComputedStyle(el), o = cs.opacity, t = cs.transform;
      el.style.opacity = o;
      el.style.transform = t === 'none' ? '' : t;
      el.setAttribute('data-pb-pop', 'go');
      void el.offsetWidth;
      el.style.opacity = '';
      el.style.transform = '';
    } else {
      el.setAttribute('data-pb-pop', 'go');
    }
    timers.push(setTimeout(function () { done(el); }, DONE));
  }
  /* reduced motion, asked for now: everything shows at once */
  function all() {
    timers.forEach(clearTimeout);
    timers = [];
    armed = [];
    if (io) { io.disconnect(); }
    if (classes) { classes.disconnect(); }
    [].forEach.call(document.querySelectorAll('[data-pb-pop]'), function (el) {
      el.style.opacity = '';
      el.style.transform = '';
      done(el);
    });
  }
  function start() {
    if (!motion() || !('IntersectionObserver' in window)) { return; }
    var vh = window.innerHeight || root.clientHeight;
    [].forEach.call(document.querySelectorAll(POP), function (el) {
      if (el.hasAttribute('data-pb-pop') || el.classList.contains('pb-popped') || !mediaOnly(el)) { return; }
      var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (r.top < vh || !r.width || !r.height || cs.opacity !== '1' || cs.transform !== 'none' ||
          (cs.display === 'inline' && !/^(IMG|VIDEO|CANVAS)$/.test(el.tagName))) { return; }
      armed.push(el);
    });
    if (!armed.length) { return; }
    /* one pass: every element is armed in the same frame */
    armed.forEach(function (el) { el.setAttribute('data-pb-pop', scrollDriven && !clipped(el) ? 'sd' : 'io'); });
    watch();
    /* the book bar and the cookie bar come and go, and their room with them */
    classes = new MutationObserver(function () { if (armed.length) { watch(); } });
    classes.observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  /* what a reader can see: the viewport less the nav above and the book bar
     or cookie bar below, which the site keeps as scroll-padding (the scroll
     timeline measures from the same box), so on a phone a picture arrives
     as it clears the book bar, not behind it */
  function inset() {
    var cs = getComputedStyle(root);
    function px(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
    return '-' + px(cs.scrollPaddingTop) + 'px 0px -' + px(cs.scrollPaddingBottom) + 'px 0px';
  }
  var wait = new Map(), margin = '', classes = null;
  function seen(es) {
    es.forEach(function (e) {
      var el = e.target;
      if (armed.indexOf(el) < 0) { return; }
      if (!e.isIntersecting) {
        if (wait.has(el)) { clearTimeout(wait.get(el)); wait.delete(el); }
        /* passed by, out of the top: at its end already, so done */
        if (e.rootBounds && e.boundingClientRect.bottom <= e.rootBounds.top) { arrive(el); }
        return;
      }
      if (el.getAttribute('data-pb-pop') === 'io') { arrive(el); return; }
      /* "sd": the scroll carries it, and a reader who stops is not left
         with it half there */
      if (!wait.has(el)) {
        var t = setTimeout(function () { wait.delete(el); arrive(el); }, ARRIVE);
        wait.set(el, t);
        timers.push(t);
      }
    });
  }
  function watch() {
    var m = inset();
    if (io && m === margin) { return; }
    margin = m;
    if (io) { io.disconnect(); }
    io = new IntersectionObserver(seen, { rootMargin: m });
    armed.forEach(function (el) { io.observe(el); });
  }
  document.addEventListener('pb:motion', function () { if (!motion()) { all(); } });
  start();
}());
