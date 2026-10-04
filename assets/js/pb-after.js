/* After the result (Run 43, item 5).

   Under every calculator's results, in this order: what the calculator does
   not show (#pbAfterNot, a caveat); the offer to email the results (the
   pension and director calculators' own forms, or, on six calculators, the
   shared Netlify form "calculator-results"; my-pensions has none, and its
   "Print or save this list" comes first); then #pbAfter: "Want to go through
   this with Damian?", one booking link and its reason (pagebuild.REASON).
   This file does two things and writes nothing else.

   1. #from= ON THE BOOKING LINK. booking.html says "You've seen your number.
      Last step: 20 minutes with Damian." only when its address carries
      #from= and one of the nine calculators. The link gets that fragment
      only while all three hold, so the line is true for whoever sees it: the
      reader has changed one of this calculator's own controls on this visit
      (a trusted input, change or button press inside [data-pb-calc]; or a
      trusted press on a drawn control, such as the reality check's jar,
      followed by the input it sets; never a shared link replaying its
      figures through pb-share.js, and never the guess card, Save as A, the
      share row, the email form or this block); no figure is still behind
      "Take a guess first"; and a result on screen shows a number (a visible
      .res-hero .big, or #ptTotal, holding a digit 1 to 9). Otherwise the
      link is plain booking.html, as in the markup. This site sends nothing
      with the fragment.
   2. "EMAIL ME MY RESULTS" on the shared form: the words and figures on
      screen, the inputs, pb-share's link and the page's address, posted to
      Netlify through PBForms (assets/js/pb-forms.js), exactly the fields
      the form declares. No marketing opt-in: the Privacy Notice's sentence
      on those emails is still to be approved (compliance pack 3.2). A
      refusal opens a pre-filled email to Damian instead, as the two
      hand-written calculators always have.

   Classic script, no globals. */
(function () {
  'use strict';
  var after = document.getElementById('pbAfter');
  if (!after) { return; }
  var calc = after.getAttribute('data-pb-from') || '';
  var link = after.querySelector('a[href^="booking.html"]');
  var root = document.documentElement, moved = false, armed = 0;
  var NOT = '.pb-guess, .pb-ab, .pb-share, .email-cap, .pb-after, .pb-after-not, .pb-optin';

  function aNumber() {
    var els = document.querySelectorAll('.results .res-hero .big, #ptTotal');
    for (var i = 0; i < els.length; i++) {
      if (els[i].getClientRects().length && /[1-9]/.test(els[i].textContent)) { return true; }
    }
    return false;
  }
  function refresh() {
    if (!link) { return; }
    var ok = moved && !root.classList.contains('pb-preveil') && !document.querySelector('.pb-veiled') && aNumber();
    link.setAttribute('href', ok ? 'booking.html#from=' + calc : 'booking.html');
  }
  function heard(e) {
    var t = e.target;
    if (!t || !t.closest) { return; }
    if (t.closest('.pb-guess')) { setTimeout(refresh, 0); return; }
    if (!t.closest('[data-pb-calc]') || t.closest(NOT)) { return; }
    if (e.type === 'pointerdown') { if (e.isTrusted) { armed = Date.now(); } return; }
    /* a shared link replays its figures with untrusted events: not the reader's own move.
       The one exception is the input a drawn control fires straight after the reader's
       own press on it (the reality check's jar, tools/state-pension-parts/page.js). */
    if (!e.isTrusted && !(e.type === 'input' && Date.now() - armed < 1000)) { return; }
    if (e.type === 'click' && !t.closest('button')) { return; }
    moved = true;
    setTimeout(refresh, 0);
  }
  ['pointerdown', 'input', 'change', 'click'].forEach(function (type) { document.addEventListener(type, heard, true); });
  if (link) {
    link.addEventListener('click', refresh, true);
    link.addEventListener('focus', refresh);
    link.addEventListener('mouseenter', refresh);
  }

  var form = document.querySelector('form[name="calculator-results"]');
  if (!form) { return; }
  var input = form.querySelector('input[type=email]'), err = document.getElementById('ecErr');
  var ok = document.getElementById('ecOk'), okText = document.getElementById('ecOkText');
  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function results() {
    var parts = [], lead = document.getElementById('leadOut');
    if (text(lead)) { parts.push(text(lead)); }
    [].forEach.call(document.querySelectorAll('.results .res-hero'), function (h) {
      if (h.getClientRects().length && text(h)) { parts.push(text(h)); }
    });
    return parts.join(' | ').slice(0, 2000);
  }
  function inputs() {
    return [].slice.call(document.querySelectorAll('[data-pb-calc] input[type=range], [data-pb-calc] input[type=text], [data-pb-calc] input[type=checkbox]'))
      .filter(function (el) { return el.id && el.id !== 'pbGuessRange' && !el.closest(NOT); })
      .map(function (el) { return el.id + '=' + (el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value); })
      .join(', ');
  }
  function done(msg) {
    if (okText && msg) { okText.textContent = msg; }
    form.style.display = 'none';
    ok.classList.add('show');
    ok.focus();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.textContent = 'Please enter a valid email address.'; err.style.display = 'block'; input.focus(); return;
    }
    err.style.display = 'none';
    var v = { results: results(), inputs: inputs(),
              link: (window.PBShare && window.PBShare.link) ? window.PBShare.link() : location.href, page: location.href };
    function viaEmail() {
      var body = 'Please send me my results.%0D%0A%0D%0A' +
        'My email: ' + encodeURIComponent(email) + '%0D%0A' +
        'Results: ' + encodeURIComponent(v.results) + '%0D%0A' +
        'Figures used: ' + encodeURIComponent(v.inputs) + '%0D%0A' +
        'Open these figures again: ' + encodeURIComponent(v.link) + '%0D%0A' +
        'From: ' + encodeURIComponent(v.page);
      window.location.href = 'mailto:' + (window.LEAD_FALLBACK_ADDRESS || 'hello@pensionbuddy.ie') +
        '?subject=' + encodeURIComponent('Results request') + '&body=' + body;
      done('Your email app should have opened with the figures ready to send to Damian.');
    }
    if (!window.PBForms) { viaEmail(); return; }
    if (form.getAttribute('aria-busy') === 'true') { return; }
    form.setAttribute('aria-busy', 'true');
    window.PBForms.send(form, v).then(function (sent) {
      form.removeAttribute('aria-busy');
      if (sent) { done('Thanks - we\'ve got it. Damian will be in touch personally.'); } else { viaEmail(); }
    });
  });
}());
