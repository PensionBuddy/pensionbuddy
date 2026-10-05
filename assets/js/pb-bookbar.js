/* The booking bar: "Book free 20 min call", pinned to the bottom of a phone
   screen, so the booking link stays in reach between the page's own asks
   (Run 45, give then ask: until then it was on five content pages only).

   WHERE. Every page that carries the tag: the home page, the starter,
   tracker and directors' pages, the glossary, the calculators and tools
   (the skeleton carries it, so every page built from it does), and the
   five guides. Never booking (every link leads there), the legal pages, the
   404 or the games, which do not load it, and never a page held back or
   kept out of search (robots noindex: the finder, the readiness check, the
   thank-you page), where this file stops at once. Below 921px only: the
   stylesheet (the CTA block) keeps it display:none from 921px up, and this
   file never shows it or lifts Ask Buddy there either.

   WHEN. It shows once the page's opening block (header.hero, the page
   header .phead, glossary's .page-head, or a guide's title) has scrolled out
   of view above, and tucks away again while a booking section is in view or
   about to be, so it never doubles an ask the reader can already see: any
   booking link in the page's own content, the block after a calculator's
   result (#pbAfter), the closing bands (.final-band, .cta-band) and the
   footer; on glossary the in-page game stage (#arcStage) too, so a game is
   never played under the bar. On a calculator it also stays away while the
   inputs (.calc-wrap .panel, the comparison's mode buttons, the tools'
   forms marked data-pb-calc) are on screen, which is where the results
   peek bar (assets/js/pb-peek.js) works, so it never covers a control the
   reader is moving, and never while the peek bar is up (html.pb-peek-on).
   That observer looks 80px below the screen, about the bar's own height,
   so the bar is gone before the last line above a stop can slide behind
   it. IntersectionObservers, no scroll handler.

   IT NEVER SITS ON TOP OF ANYTHING THAT IS THE READER'S.
     - The cookie choice bar (.pb-consent, key 'pb-consent'): while it is up
       the booking bar is display:none, and it comes back only once the
       reader has chosen. A MutationObserver on <body> sees the choice bar
       leave, the same moment the page drops body.pb-banner-open.
     - Ask Buddy (#pbBuddyBtn, bottom right): while the bar shows, <html>
       carries .pb-bookbar-on and the page's stylesheet lifts the button by
       the bar's measured height (--pb-bookbar-h), and puts it back when it
       goes. While the Ask Buddy panel is open (the button's aria-expanded is
       "true") the bar is held away like it is for the cookie bar: the lift
       drops, so the panel opens exactly where it always did, with its own
       "Book a call with Damian for free" button, and the bar comes back when
       the panel closes. A MutationObserver on the button sees it open and
       close.
     - A text field: while one has focus the bar tucks away, so on a phone it
       cannot ride up on the keyboard and cover what is being typed.
     - While it shows, scroll-padding-bottom keeps anything the browser
       scrolls into view (a focused link) clear of it.

   CLOSING. The close button (accessible name "Close", a 44px target) hides
   it for the rest of the session: sessionStorage 'pb-bookbar' = 'closed',
   and a closed bar is never built again on any page until the tab closes.
   A page the browser brings back from its back/forward cache does not run
   this file again, so on pageshow it reads the flag once more and, if the
   reader closed a bar on another page meanwhile, takes its bar down at
   once, with nothing sliding. Every storage access is wrapped: when storage
   throws, the bar still closes and stays closed for this page view. If
   focus was in the bar, it goes back to where it was before it entered the
   bar (or, if that has gone, to the page's <main>), never to <body>; after
   a tap, a click or a pageshow it moves there without scrolling the page.

   KEYBOARD. The bar is appended to <body> after Ask Buddy, so its link and
   close button are the last two tab stops, after the footer and Ask Buddy's
   button. It never takes focus when it appears. While tucked away it stays
   focusable (moved off screen, not hidden), and focus inside it brings it
   up whatever the scroll position, so a keyboard reader who reaches it can
   see it. It is a plain <div>: no landmark and no live region; the link
   text speaks for itself.

   MOTION. Slides up in 200ms. Under reduced motion it simply appears: the
   stylesheet drops the transition.

   WITHOUT SCRIPT, nothing: the bar is built here, so a page without
   JavaScript (or without IntersectionObserver) keeps its own calls to action
   and shows no bar that could not be closed.

   Classic script, nothing declared at top level, every lookup guarded. */
(function () {
  var KEY = 'pb-bookbar';
  var doc = document, html = doc.documentElement, body = doc.body;
  if (!body || !('IntersectionObserver' in window) || !window.matchMedia) return;

  if (doc.querySelector('meta[name="robots"][content*="noindex"]')) return;
  var closed = false;
  try { closed = window.sessionStorage.getItem(KEY) === 'closed'; } catch (e) {}
  if (closed) return;

  var hero = doc.querySelector('main header.hero, main .page-head, main .phead, main .legal h1');
  if (!hero) return;
  var stops = [].slice.call(doc.querySelectorAll('main a[href^="booking.html"], #pbAfter, .final-band, .cta-band, footer, #arcStage, ' +
    '.calc-wrap .panel, .calc-wrap .modebar, form[data-pb-calc]'));

  var phone = window.matchMedia('(max-width: 920px)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var bar = doc.createElement('div');
  bar.className = 'pb-bookbar';
  bar.innerHTML = '<a class="btn btn-primary" href="booking.html" data-pb-cta="bookbar">Book free 20 min call</a>'
    + '<button type="button" class="pb-bookbar-x" aria-label="Close">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>'
    + '</button>';
  body.appendChild(bar);
  /* cta_view once it is on screen; its tags come when it is used (assets/js/pb-cta.js) */
  if (window.PBCta) window.PBCta.watch(bar.firstChild);

  var pastHero = false, near = [], typing = false, focusIn = false, shown = false, lastFocus = null;
  var watch = 'MutationObserver' in window ? new MutationObserver(function () { update(); }) : null;

  function consentUp() {
    return !!doc.querySelector('.pb-consent') || body.classList.contains('pb-banner-open');
  }

  /* the Ask Buddy panel is open; the button is watched once it exists */
  var buddy = null;
  function buddyOpen() {
    var b = doc.getElementById('pbBuddyBtn');
    if (b && b !== buddy) {
      buddy = b;
      if (watch) watch.observe(b, { attributes: true, attributeFilter: ['aria-expanded'] });
    }
    return !!b && b.getAttribute('aria-expanded') === 'true';
  }

  var yieldBand = 0;
  function measure() {
    html.style.setProperty('--pb-bookbar-h', bar.offsetHeight + 'px');
    /* the band the bar steps down for is at least its own height */
    if (yieldIO && Math.max(100, bar.offsetHeight + 8) !== yieldBand) watchYield();
  }

  function update() {
    if (closed) return;
    var held = consentUp() || buddyOpen() || html.classList.contains('pb-peek-on');
    bar.classList.toggle('pb-bookbar-held', held);
    var show = !held && phone.matches && (focusIn || (pastHero && !near.length && !typing));
    if (show === shown) return;
    shown = show;
    /* reading the height here also settles the tucked position first, so
       the bar slides up from it even when it was display:none a moment ago */
    if (show) measure();
    bar.classList.toggle('pb-bookbar-on', show);
    html.classList.toggle('pb-bookbar-on', show);
  }

  var heroIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var top = e.rootBounds ? e.rootBounds.top : 0;
      pastHero = !e.isIntersecting && e.boundingClientRect.bottom <= top + 1;
    });
    update();
  });
  heroIO.observe(hero);

  var stopIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var i = near.indexOf(e.target);
      if (e.isIntersecting && i < 0) near.push(e.target);
      if (!e.isIntersecting && i >= 0) near.splice(i, 1);
    });
    update();
  }, { rootMargin: '0px 0px 80px 0px' });
  stops.forEach(function (s) { stopIO.observe(s); });

  if (watch) watch.observe(body, { childList: true, attributes: true, attributeFilter: ['class'] });
  /* the results peek bar comes and goes on <html> (pb-peek-on) */
  if (watch) watch.observe(html, { attributes: true, attributeFilter: ['class'] });

  /* STEPPING DOWN (Run 32, docs/UX-MOTION-AUDIT.md part 3b). While a caveat
     (a warning, a source, "information, not advice", the disclosure:
     PBMotion.CAVEATS) passes through the bottom 100px of the screen (or the
     bar's own height and 8px, if that is more), the bar
     steps down out of its way, and comes back once that band has been clear
     for 600ms. Never while the bar has focus. The bar stays "on"; the class
     html.pb-bookbar-yield moves it (the BUDDY block of CSS), so Ask Buddy,
     riding just above it, comes down with it. */
  var under = [], yieldT = null, yieldIO = null;
  function yieldNow() {
    if (under.length && !focusIn) {
      clearTimeout(yieldT); yieldT = null;
      html.classList.add('pb-bookbar-yield');
    } else if (focusIn) {
      /* focus in the bar brings it back at once: a focused link must never
         wait off screen for the band to clear */
      clearTimeout(yieldT); yieldT = null;
      html.classList.remove('pb-bookbar-yield');
    } else if (html.classList.contains('pb-bookbar-yield') && !yieldT) {
      yieldT = setTimeout(function () {
        yieldT = null;
        if (!(under.length && !focusIn)) html.classList.remove('pb-bookbar-yield');
      }, 600);
    }
  }
  function watchYield() {
    if (closed) return;
    if (yieldIO) yieldIO.disconnect();
    under = [];
    var sel = window.PBMotion && window.PBMotion.CAVEATS;
    if (!sel) return;
    yieldBand = Math.max(100, bar.offsetHeight + 8);
    yieldIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = under.indexOf(e.target);
        if (e.isIntersecting && i < 0) under.push(e.target);
        if (!e.isIntersecting && i >= 0) under.splice(i, 1);
      });
      yieldNow();
    }, { rootMargin: '-' + Math.max(0, window.innerHeight - yieldBand) + 'px 0px 0px 0px' });
    [].slice.call(doc.querySelectorAll(sel)).forEach(function (el) {
      if (!el.closest('.pb-bookbar, .pb-consent, #pbBuddyPanel')) yieldIO.observe(el);
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', watchYield);
  else watchYield();

  function isField(el) {
    if (!el || !el.tagName) return false;
    if (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
    return el.tagName === 'INPUT' &&
      !/^(range|checkbox|radio|button|submit|reset|color|file|image|hidden)$/i.test(el.type || '');
  }

  function onFocusIn(e) {
    focusIn = bar.contains(e.target);
    typing = !focusIn && isField(e.target);
    if (!focusIn) lastFocus = e.target;
    update();
    yieldNow();
  }
  function onFocusOut(e) {
    if (!e.relatedTarget) { focusIn = false; typing = false; update(); }
  }
  function onChange() { update(); }
  function onResize() { if (shown) measure(); watchYield(); }

  doc.addEventListener('focusin', onFocusIn);
  doc.addEventListener('focusout', onFocusOut);
  window.addEventListener('resize', onResize);
  if (phone.addEventListener) phone.addEventListener('change', onChange);
  else if (phone.addListener) phone.addListener(onChange);

  /* take the bar down for good on this page. how: 'key' when closed from
     the keyboard, 'tap' after a tap or a click, 'page' on a pageshow */
  function teardown(how) {
    if (closed) return;
    var hadFocus = bar.contains(doc.activeElement);
    closed = true;
    heroIO.disconnect();
    stopIO.disconnect();
    if (yieldIO) yieldIO.disconnect();
    clearTimeout(yieldT);
    html.classList.remove('pb-bookbar-yield');
    if (watch) watch.disconnect();
    doc.removeEventListener('focusin', onFocusIn);
    doc.removeEventListener('focusout', onFocusOut);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pageshow', onPageShow);
    if (phone.removeEventListener) phone.removeEventListener('change', onChange);
    else if (phone.removeListener) phone.removeListener(onChange);

    /* focus was in the bar: it goes back to where it was, or to the page's
       own main landmark; only a keyboard close lets that scroll the page */
    if (hadFocus) {
      var back = lastFocus && lastFocus.isConnected && !bar.contains(lastFocus) &&
        lastFocus.getClientRects().length ? lastFocus : doc.getElementById('main');
      if (back && back.focus) {
        if (how === 'key') back.focus();
        else { try { back.focus({ preventScroll: true }); } catch (err) { back.focus(); } }
      }
    }

    shown = false;
    /* a page coming back from the cache just has no bar: nothing slides */
    var b = how === 'page' ? doc.getElementById('pbBuddyBtn') : null;
    if (b) b.style.transition = 'none';
    bar.classList.remove('pb-bookbar-on');
    html.classList.remove('pb-bookbar-on');
    if (how === 'page') {
      if (bar.parentNode) bar.parentNode.removeChild(bar);
      html.style.removeProperty('--pb-bookbar-h');
      /* Ask Buddy's lift is written by pb-buddy.js's observer of <html>'s
         classes, a microtask after this returns: restore its transition in a
         task after that, once its new place has been applied */
      if (b) setTimeout(function () { void b.offsetWidth; b.style.transition = ''; }, 0);
      return;
    }
    setTimeout(function () {
      if (bar.parentNode) bar.parentNode.removeChild(bar);
      html.style.removeProperty('--pb-bookbar-h');
    }, calm.matches ? 0 : 240);
  }

  /* back/forward cache: the page comes back as it was left, so the flag is
     read again in case the reader closed the bar on another page meanwhile */
  function onPageShow(e) {
    if (!e.persisted || closed) return;
    var c = false;
    try { c = window.sessionStorage.getItem(KEY) === 'closed'; } catch (err) {}
    if (c) teardown('page');
  }
  window.addEventListener('pageshow', onPageShow);

  bar.querySelector('.pb-bookbar-x').addEventListener('click', function (e) {
    try { window.sessionStorage.setItem(KEY, 'closed'); } catch (err) {}
    /* a click with no pointer behind it came from the keyboard */
    teardown(e.detail === 0 ? 'key' : 'tap');
  });
})();
