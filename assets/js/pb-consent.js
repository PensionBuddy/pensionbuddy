/* The cookie choice, and what it turns on: Google Tag Manager, container
   GTM-KQCRZDNB (Run 27), and the Meta, TikTok and LinkedIn pixels.

   Every root page loads this file at the foot of <body>, where each page
   used to carry the same consent scaffold inline, dormant behind an
   [ANALYTICS_SCRIPT_URL] placeholder. The bar's markup is that scaffold's,
   and so are its storage key and its two values. Its words, since the ad
   pixels (4 October 2026), are one line, "May we use cookies for analytics and ads? Privacy Notice", so that on
   a phone the bar is one line and two buttons and leaves the hero's
   regulator and QFA lockup on the first screen (the FIRSTSCREEN block of
   CSS lays it out; docs/COMPLIANCE-PACK.md 1.17 has the wording for
   sign-off).

   NOTHING LOADS BEFORE CONSENT. Google's snippet is in no page's <head>.
   loadGtm() below is that snippet, and it runs only after "That's fine", on
   this page or an earlier one (localStorage 'pb-consent' = 'accepted').
   "No thanks" is remembered and nothing ever loads; no answer at all shows
   the bar and loads nothing. The snippet's <noscript> iframe is left out on
   purpose: it would load Google for a visitor who cannot answer the bar.

   THE AD PIXELS. Meta (1401467284899608), TikTok (DB0II6JC77U1PLPL6670) and
   LinkedIn Insight (10975993) are loaded by loadPixels(), the snippets as
   each issued them, and only with GTM after "That's fine", never in a
   <head>. Each sends its PageView. Their <noscript> images are left out for
   the same reason as GTM's iframe.

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
   earlier "accepted" left on this site, and the pixels' own (_fbp, _fbc,
   _ttp, _tt_*, li_*, lidc, bcookie, UserMatchHistory, AnalyticsSyncHistory)
   where they are first-party, and if GTM was already running on
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
    loadPixels();
  }

  /* Meta, TikTok and LinkedIn, as issued, run on consent. */
  function loadPixels() {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', '1401467284899608');
    window.fbq('track', 'PageView');

    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
    var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
    ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
      ttq.load('DB0II6JC77U1PLPL6670');
      ttq.page();
    }(window, document, 'ttq');

    window._linkedin_partner_id = "10975993";
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
    (function(l) {
    if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
    window.lintrk.q=[]}
    var s = document.getElementsByTagName("script")[0];
    var b = document.createElement("script");
    b.type = "text/javascript";b.async = true;
    b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b, s);})(window.lintrk);
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
      if (!/^(_ga|_ga_.+|_gid|_gat.*|_fbp|_fbc|_ttp|_tt_.+|li_.+|lidc|bcookie|UserMatchHistory|AnalyticsSyncHistory)$/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; path=/';
      for (var i = 0; i < parts.length - 1; i++) {
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + parts.slice(i).join('.');
      }
    });
  }

  /* The bar's real height, on <html>: Ask Buddy's panel opens above it
     (--pb-consent-h in each page's CSS), or it would cover "That's fine",
     and while html.pb-consent-open is on, the FIRSTSCREEN block scrolls
     keyboard focus clear of it. */
  var root = document.documentElement;
  function fit() { if (bar) root.style.setProperty('--pb-consent-h', bar.offsetHeight + 'px'); }

  function choose(v) {
    remember(v);
    if (bar) { bar.parentNode.removeChild(bar); bar = null; }
    document.body.classList.remove('pb-banner-open');
    root.classList.remove('pb-consent-open');
    root.style.removeProperty('--pb-consent-h');
    window.removeEventListener('resize', fit);
    if (v === 'accepted') { loadGtm(); return; }
    queue.length = 0;
    dropAnalyticsCookies();
    if (loaded) location.reload();
  }

  function showBar() {
    if (bar) return bar;
    bar = document.createElement('div'); bar.className = 'pb-consent'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cookie choice');
    bar.innerHTML = '<p>May we use cookies for analytics and ads? <a href="privacy.html#cookies">Privacy Notice</a></p><button type="button" class="pb-c-yes">That’s fine</button><button type="button" class="pb-c-no">No thanks</button>';
    document.body.appendChild(bar);
    fit(); window.addEventListener('resize', fit);   // measured first, so Ask Buddy moves once
    document.body.classList.add('pb-banner-open');
    root.classList.add('pb-consent-open');
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
