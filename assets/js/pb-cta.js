/* Give, then ask: the booking links, the button test and what is counted
   (Run 45).

   Every root page loads this file straight after assets/js/pb-consent.js,
   whose PBTrack and PBConsent it uses. It does four things.

   1. THE BUTTON TEST. The booking button after a calculator's result
      (pagebuild.after_block, marked data-pb-ab="cta") reads one of two
      wordings, half the visitors each:
        A  "Book a free 20-minute call with us"   (in the markup)
        B  "See what this means for you - free 20-min call"
      Which one a visitor sees is picked at random. Nothing is stored
      before the cookie choice: until "That's fine" the pick lives in this
      page's memory only, so it can differ from page to page. After "That's
      fine" (on this page or an earlier one) it is kept in this browser,
      first-party, as localStorage 'pb-ab-cta' = 'A' or 'B', and stays the
      same on every page. "No thanks", or forgetting the answer, deletes
      the key (pb-consent.js does it too, so it goes on any page). No
      cookie is ever written here.

   2. THE BOOKING LINKS. Every link to booking.html carries
      utm_source=site, utm_medium=cta, utm_campaign=<this page> and
      utm_content=<A or B>, so the booking page can hand them to Calendly
      and each booking records the page it came from and the wording the
      visitor saw. <this page> is the file name without .html, "home" for
      the home page. A link is tagged the moment it is pointed at, focused,
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
  var KEY = 'pb-ab-cta';
  var WORDS = { A: 'Book a free 20-minute call with us', B: 'See what this means for you - free 20-min call' };
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var doc = document;

  function consented() {
    try { return !!(window.PBConsent && window.PBConsent.answer() === 'accepted'); } catch (e) { return false; }
  }
  function read() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { window.localStorage.setItem(KEY, v); } catch (e) {} }
  function drop() { try { window.localStorage.removeItem(KEY); } catch (e) {} }

  var variant = consented() ? read() : null;
  if (variant !== 'A' && variant !== 'B') {
    variant = Math.random() < 0.5 ? 'A' : 'B';
    if (consented()) write(variant);
  }
  doc.addEventListener('pb:consent', function (e) {
    if (e.detail && e.detail.answer === 'accepted') write(variant); else drop();
  });

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

  /* the wording this visitor sees */
  [].forEach.call(doc.querySelectorAll('[data-pb-ab="cta"]'), function (el) {
    var t = el.querySelector('.pb-ab-t');
    if (t) t.textContent = WORDS[variant];
    el.setAttribute('data-pb-variant', variant);
  });

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
