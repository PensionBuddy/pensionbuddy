/* Give, then ask: the booking links, their one wording and what is counted
   (Run 45; the button test ended 8 October 2026).

   Every root page loads this file straight after assets/js/pb-consent.js,
   whose PBTrack and PBConsent it uses. It does four things.

   1. ONE WORDING. Every booking button reads "Book a free 20-minute call
      with us", in the markup (Damian, 8 October 2026). Run 45's button
      test, which showed half the visitors "See what this means for you -
      free 20-min call" after a calculator's result, has ended: every
      visitor is variant 'A', nothing is picked and nothing is stored. A
      'pb-ab-cta' key the test left in a browser is deleted on load (and
      pb-consent.js still deletes it with "No thanks"). No cookie is ever
      written here.

   2. THE BOOKING LINKS. Every link to booking.html carries
      utm_source=site, utm_medium=cta, utm_campaign=<this page> and
      utm_content=A (the one wording since the test ended; bookings made
      during it carry A or B), so the booking page can hand them to
      Calendly and each booking records the page it came from. <this page>
      is the file name without .html, "home" for the home page. A link is tagged the moment it is pointed at, focused,
      pressed or opened in a new tab (pointerdown, mouseover, focusin,
      click, auxclick, contextmenu, all in the capture phase), never before:
      so a reader's click always carries the tags, links built later (the
      phone booking bar, the Ask Buddy panel) included, while a search
      engine reading the page never meets a tagged link inside the site. A
      fragment (#from=...) is kept. Calendly links are never rewritten: the
      booking page builds those itself. Without JavaScript every link stays
      plain booking.html.

   3. WHAT IS COUNTED, through PBTrack, so exactly as the cookie choice
      allows: nothing reaches Google before "That's fine"; an event sent
      before an answer waits in this page's memory and is dropped on "No
      thanks". Every event carries {page, variant}.
        cta_view       a booking button marked data-pb-cta (the one after a
                       calculator's result, the phone bar's) is at least
                       half on screen; once per button per page view.
                       {cta}: where it is ("after", "bookbar")
        cta_click      one of those buttons is pressed. {cta}
        booking_click  any link to booking.html or to Calendly is pressed,
                       wherever it is. {cta}: data-pb-cta, or else where it
                       sits: nav, footer, bookbar, buddy, band, hero,
                       calendar, inline
        calculator_complete, email_result_submit
                       sent by assets/js/pb-after.js through track() below,
                       which adds {page, variant}
      No name, email or figure is ever sent with an event.

   4. window.PBCta = {variant, page, words, href(base), decorate(a),
      watch(el), track(name, fields)}, for pb-after.js and pb-bookbar.js.

   Classic script, every lookup guarded. */
(function () {
  'use strict';
  var KEY = 'pb-ab-cta';   /* Run 45's button test, ended: only ever deleted now */
  var WORDS = { A: 'Book a free 20-minute call with us' };
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var doc = document;

  var variant = 'A';
  try { window.localStorage.removeItem(KEY); } catch (e) {}

  var file = (location.pathname.split('/').pop() || '').replace(/\.html?$/, '');
  var page = (!file || file === 'index') ? 'home' : file;

  /* 'site' for a link to the booking page, 'calendly' for Damian's calendar */
  function kind(a) {
    var u;
    try { u = new URL(a.getAttribute('href') || '', location.href); } catch (e) { return ''; }
    if (u.origin === location.origin && /\/booking(?:\.html)?$/.test(u.pathname)) return 'site';
    if (/(^|\.)calendly\.com$/.test(u.hostname)) return 'calendly';
    return '';
  }

  /* base ("booking.html", "booking.html#from=pia") with this page's tags */
  function href(base) {
    var hash = '', i = base.indexOf('#');
    if (i >= 0) { hash = base.slice(i); base = base.slice(0, i); }
    var q = '', j = base.indexOf('?');
    if (j >= 0) { q = base.slice(j + 1); base = base.slice(0, j); }
    var keep = q.split('&').filter(function (p) { return p && UTM.indexOf(p.split('=')[0]) < 0; });
    var tags = ['utm_source=site', 'utm_medium=cta', 'utm_campaign=' + encodeURIComponent(page), 'utm_content=' + variant];
    return base + '?' + keep.concat(tags).join('&') + hash;
  }

  function decorate(a) {
    if (!a || !a.getAttribute || kind(a) !== 'site') return;
    var h = a.getAttribute('href'), want = href(h);
    if (h !== want) a.setAttribute('href', want);
  }

  function track(name, fields) {
    var f = { page: page, variant: variant }, k;
    for (k in fields || {}) f[k] = fields[k];
    if (window.PBTrack) window.PBTrack(name, f);
  }

  function where(a) {
    var c = a.getAttribute('data-pb-cta');
    if (c) return c;
    if (a.closest('nav')) return 'nav';
    if (a.closest('footer')) return 'footer';
    if (a.closest('.pb-bookbar')) return 'bookbar';
    if (a.closest('#pbBuddyPanel, .pb-b-panel')) return 'buddy';
    if (a.closest('.final-band, .cta-band')) return 'band';
    if (a.closest('header.hero, .hero-cta')) return 'hero';
    if (a.closest('#calFallback')) return 'calendar';
    return 'inline';
  }

  /* the links: whenever one is about to be used */
  ['pointerdown', 'focusin', 'mouseover', 'auxclick', 'contextmenu'].forEach(function (type) {
    doc.addEventListener(type, function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (a) decorate(a);
    }, true);
  });
  doc.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var k = kind(a);
    if (!k) return;
    if (k === 'site') decorate(a);
    var w = where(a);
    if (a.hasAttribute('data-pb-cta')) track('cta_click', { cta: w });
    track('booking_click', { cta: w });
  }, true);

  /* cta_view: half on screen, once per button */
  var watched = [];
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting || en.intersectionRatio < 0.5) return;
      io.unobserve(en.target);
      track('cta_view', { cta: where(en.target) });
    });
  }, { threshold: [0.5] }) : null;
  function watch(el) {
    if (!io || !el || watched.indexOf(el) >= 0) return;
    watched.push(el);
    io.observe(el);
  }
  [].forEach.call(doc.querySelectorAll('[data-pb-cta]'), watch);

  window.PBCta = { variant: variant, page: page, words: WORDS, href: href, decorate: decorate, watch: watch, track: track };
})();
