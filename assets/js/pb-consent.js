/* The cookie choice, and the one thing it turns on: Google Tag Manager,
   container GTM-KQCRZDNB (Run 25).

   Every root page loads this file at the foot of <body>, where each page
   used to carry the same consent scaffold inline, dormant behind an
   [ANALYTICS_SCRIPT_URL] placeholder. The bar's markup and words are that
   scaffold's, unchanged; so are its storage key and its two values.

   NOTHING LOADS BEFORE CONSENT. Google's snippet is in no page's <head>.
   loadGtm() below is that snippet, and it runs only after "That's fine", on
   this page or an earlier one (localStorage 'pb-consent' = 'accepted').
   "No thanks" is remembered and nothing ever loads; no answer at all shows
   the bar and loads nothing. The snippet's <noscript> iframe is left out on
   purpose: it would load Google for a visitor who cannot answer the bar.

   PBTrack(event, fields, then) is how a page reports something to the
   dataLayer. Before an answer, the event waits in this page's memory, and
   reaches Google only if the visitor accepts while still on the page; "No
   thanks" empties the queue. After "accepted" it goes straight to the
   dataLayer. `then`, if given, runs once GTM has handled the event (at most
   1.5 seconds), or at once when GTM is not running, so a page can move on
   afterwards without losing the event. The events:

     booking_form_submit            booking.html, a valid routing form sent
     calendly_booking               booking.html, Calendly's event_scheduled
     calculator_first_interaction   {calculator}: the first time a reader
                                    changes or presses anything inside an
                                    element marked data-pb-calc (its value
                                    is the calculator's name), once per
                                    calculator per page view. Only real
                                    input counts (isTrusted): a shared link
                                    replaying its figures is not the reader,
                                    and neither is a lead form inside the
                                    calculator.

   CHANGING YOUR MIND. An element marked data-pb-consent-reset (the Privacy
   Notice has one) forgets the answer and shows the bar again. "No thanks"
   also deletes any Google Analytics cookies (_ga, _ga_*, _gid, _gat*) an
   earlier "accepted" left on this site, and if GTM was already running on
   this page, reloads it, since a running script cannot be unloaded.

   Classic script; defines window.PBTrack and window.PBConsent. */
(function () {
  'use strict';
  var GTM_ID = 'GTM-KQCRZDNB';
  var KEY = 'pb-consent';
  var queue = [], loaded = false, bar = null, started = {};

  function answer() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function remember(v) {
    try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {}
  }

  /* Google's Tag Manager snippet for this container, as issued, run on
     consent instead of in the head. Then whatever waited for the answer. */
  function loadGtm() {
    if (loaded) return;
    loaded = true;
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',GTM_ID);
    while (queue.length) window.dataLayer.push(queue.shift());
  }

  function track(name, fields, then) {
    var e = { event: name }, k, done = false;
    for (k in fields || {}) e[k] = fields[k];
    function next() { if (!done) { done = true; if (then) then(); } }
    if (loaded) {
      if (then) { e.eventCallback = next; e.eventTimeout = 1500; setTimeout(next, 1600); }
      window.dataLayer.push(e);
      return;
    }
    if (answer() !== 'rejected') queue.push(e);
    next();
  }

  function dropAnalyticsCookies() {
    var parts = location.hostname.split('.');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^(_ga|_ga_.+|_gid|_gat.*)$/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; path=/';
      for (var i = 0; i < parts.length - 1; i++) {
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + parts.slice(i).join('.');
      }
    });
  }

  /* The bar wraps to three or four lines on a phone. Ask Buddy's button and
     panel sit above it by its real height (--pb-consent-h in each page's
     CSS), or they would cover "That's fine". */
  function fit() { if (bar) document.body.style.setProperty('--pb-consent-h', bar.offsetHeight + 'px'); }

  function choose(v) {
    remember(v);
    if (bar) { bar.parentNode.removeChild(bar); bar = null; }
    document.body.classList.remove('pb-banner-open');
    document.body.style.removeProperty('--pb-consent-h');
    window.removeEventListener('resize', fit);
    if (v === 'accepted') { loadGtm(); return; }
    queue.length = 0;
    dropAnalyticsCookies();
    if (loaded) location.reload();
  }

  function showBar() {
    if (bar) return bar;
    bar = document.createElement('div'); bar.className = 'pb-consent'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cookie choice');
    bar.innerHTML = '<p>We’d like to use a little analytics to see how the site is used — nothing for ads, never sold. You choose. See our <a href="privacy.html">Privacy Notice</a>.</p><button type="button" class="pb-c-yes">That’s fine</button><button type="button" class="pb-c-no">No thanks</button>';
    document.body.appendChild(bar);
    fit(); window.addEventListener('resize', fit);   // measured first, so Ask Buddy moves once
    document.body.classList.add('pb-banner-open');
    bar.querySelector('.pb-c-yes').addEventListener('click', function () { choose('accepted'); });
    bar.querySelector('.pb-c-no').addEventListener('click', function () { choose('rejected'); });
    return bar;
  }

  /* the first real touch on each calculator */
  function first(e) {
    if (!e.isTrusted || !e.target || !e.target.closest) return;
    var root = e.target.closest('[data-pb-calc]');
    if (!root || e.target.closest('form[data-netlify]')) return;
    if (e.type === 'click' && !e.target.closest('button, input, select, textarea, label, [role]')) return;
    var name = root.getAttribute('data-pb-calc');
    if (started[name]) return;
    started[name] = true;
    track('calculator_first_interaction', { calculator: name });
  }
  ['input', 'change', 'click'].forEach(function (t) { document.addEventListener(t, first, true); });

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-pb-consent-reset]');
    if (!b) return;
    remember(null);
    showBar().querySelector('.pb-c-yes').focus();
  });

  window.PBTrack = track;
  window.PBConsent = { GTM_ID: GTM_ID, answer: answer, loaded: function () { return loaded; }, first: first };

  var a = answer();
  if (a === 'accepted') loadGtm();
  else if (a !== 'rejected') showBar();
})();
