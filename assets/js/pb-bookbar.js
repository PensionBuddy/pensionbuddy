/* The booking bar: "Book a call with Damian for free", pinned to the bottom
   of a phone screen on the long content pages, so the booking link stays in
   reach between the hero's call to action and the closing band's.

   WHERE. index, starter, director, tracker and glossary carry the tag, and
   nothing else does. Never the five calculators (their bottom edge is kept
   for the results peek bar), booking, thank-you, the legal pages, 404 or the
   games. Below 921px only: the stylesheet keeps it display:none from 921px
   up, and this file never shows it or lifts Ask Buddy there either.

   WHEN. It shows once the page's opening block (header.hero, or glossary's
   .page-head) has scrolled out of view above, and tucks away again as soon as
   the closing band (.final-band) or the footer comes up, so it never doubles
   the closing call to action. That second observer looks 80px below the
   screen, about the bar's own height, so the bar is gone before the last line
   above the closing band can slide behind it. On glossary the in-page game
   stage (#arcStage) is a stop too: a game is never played under the bar. Two
   IntersectionObservers, no scroll handler.

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

  var closed = false;
  try { closed = window.sessionStorage.getItem(KEY) === 'closed'; } catch (e) {}
  if (closed) return;

  var hero = doc.querySelector('main header.hero, main .page-head');
  if (!hero) return;
  var stops = [].slice.call(doc.querySelectorAll('.final-band, footer, #arcStage'));

  var phone = window.matchMedia('(max-width: 920px)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var bar = doc.createElement('div');
  bar.className = 'pb-bookbar';
  bar.innerHTML = '<a class="btn btn-primary" href="booking.html">Book a call with Damian for free</a>'
    + '<button type="button" class="pb-bookbar-x" aria-label="Close">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>'
    + '</button>';
  body.appendChild(bar);

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

  function measure() {
    html.style.setProperty('--pb-bookbar-h', bar.offsetHeight + 'px');
  }

  function update() {
    if (closed) return;
    var held = consentUp() || buddyOpen();
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
  }
  function onFocusOut(e) {
    if (!e.relatedTarget) { focusIn = false; typing = false; update(); }
  }
  function onChange() { update(); }
  function onResize() { if (shown) measure(); }

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
      if (b) { void b.offsetWidth; b.style.transition = ''; }
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
