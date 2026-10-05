/* After the result (Run 43; rebuilt for give, then ask in Run 45).

   Under each calculator's result, one shared block that tools/pagebuild.py
   after_block() writes into the page, so it is the same everywhere and is
   there without JavaScript: what the calculator does not show (a caveat),
   then #pbAfter: the booking button (assets/js/pb-cta.js picks its wording),
   "Free. No obligation. No pressure." and, on every page that sends
   anything, "Email me this result". This file does three things and writes
   nothing else.

   1. THE BUTTON'S ADDRESS. booking.html says "You've seen your number. Last
      step: 20 minutes with Damian." only when its address carries #from=
      and one of the nine calculators. The button gets that fragment only
      while all three hold, so the line is true for whoever sees it: the
      reader has changed one of this calculator's own controls on this visit
      (a trusted input, change or button press inside [data-pb-calc]; or a
      trusted press on a drawn control, such as the reality check's jar,
      followed by the input it sets; never a shared link replaying its
      figures through pb-share.js, and never the guess card, Save as A, the
      share row, the email form or this block); no figure is still behind
      "Take a guess first"; and a result on screen shows a number (a visible
      .res-hero .big, or #ptTotal, holding a digit 1 to 9). Otherwise the
      address is plain booking.html, as in the markup. Once the reader
      reaches the button it carries pb-cta.js's tags too (utm_*: this page
      and the wording shown); at load it is the markup's plain address.
   2. calculator_complete, once per page view, counted through pb-cta.js (so
      exactly as the cookie choice allows): the first moment the reader's own
      move has a result on screen (a number as above, or a filled
      [data-pb-result] list, the directors' rules page's).
   3. "EMAIL ME THIS RESULT". The link is hidden in the markup and shown
      here, so a reader without JavaScript never meets a form that could not
      carry the figures. It opens and closes the form below it
      (aria-expanded); the result above never moves or hides, whether or not
      the form is used. The form asks for a name, an email and a tick in a
      box that is never ticked for the reader, and sends nothing until all
      three are there. Only then are the words and figures on screen, the
      inputs, pb-share's link and the page's address read from the page,
      and posted with the name, the email and consent=yes to Netlify, under
      "calculator-results", through PBForms (assets/js/pb-forms.js), exactly
      the fields the form declares. Counted as email_result_submit; no
      name, email or figure goes with the event. A refusal opens a
      pre-filled email to Damian instead, as the forms always have.

   Classic script, no globals. */
(function () {
  'use strict';
  var after = document.getElementById('pbAfter');
  if (!after) { return; }
  var calc = after.getAttribute('data-pb-from') || '';
  var link = after.querySelector('a[href^="booking.html"]');
  var root = document.documentElement, moved = false, armed = 0, completed = false;
  var NOT = '.pb-guess, .pb-ab, .pb-share, .pb-after, .pb-after-not, .pb-optin';

  function track(name, fields) {
    if (window.PBCta) { window.PBCta.track(name, fields); } else if (window.PBTrack) { window.PBTrack(name, fields); }
  }
  function shown(el) { return el.getClientRects().length > 0; }
  function aNumber() {
    var els = document.querySelectorAll('.results .res-hero .big, #ptTotal');
    for (var i = 0; i < els.length; i++) {
      if (shown(els[i]) && /[1-9]/.test(els[i].textContent)) { return true; }
    }
    return false;
  }
  function aList() {
    var els = document.querySelectorAll('[data-pb-result]');
    for (var i = 0; i < els.length; i++) {
      if (shown(els[i]) && els[i].textContent.trim()) { return true; }
    }
    return false;
  }
  function unveiled() { return !root.classList.contains('pb-preveil') && !document.querySelector('.pb-veiled'); }
  function refresh() {
    var number = moved && unveiled() && aNumber();
    if (link) {
      var base = number ? 'booking.html#from=' + calc : 'booking.html';
      link.setAttribute('href', window.PBCta ? window.PBCta.href(base) : base);
    }
    if (!completed && moved && unveiled() && (number || aList())) {
      completed = true;
      track('calculator_complete', { calculator: calc });
    }
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

  var more = document.getElementById('ecMore'), cap = document.getElementById('ecCap');
  var form = document.getElementById('ecForm');
  if (!more || !cap || !form) { return; }
  var nameEl = document.getElementById('ecName'), mailEl = document.getElementById('ecEmail');
  var box = document.getElementById('ecConsent'), err = document.getElementById('ecErr');
  var ok = document.getElementById('ecOk'), okText = document.getElementById('ecOkText');

  more.hidden = false;
  more.addEventListener('click', function () {
    var open = more.getAttribute('aria-expanded') !== 'true';
    more.setAttribute('aria-expanded', open ? 'true' : 'false');
    cap.hidden = !open;
    if (open && !form.hidden) { nameEl.focus(); }
  });

  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function results() {
    var parts = [], lead = document.getElementById('leadOut');
    if (text(lead)) { parts.push(text(lead)); }
    [].forEach.call(document.querySelectorAll('.results .res-hero, [data-pb-result]'), function (h) {
      if (shown(h) && text(h)) { parts.push(text(h)); }
    });
    return parts.join(' | ').slice(0, 2000);
  }
  function inputs() {
    return [].slice.call(document.querySelectorAll('[data-pb-calc] input[type=range], [data-pb-calc] input[type=text], ' +
      '[data-pb-calc] input[type=checkbox], [data-pb-calc] input[type=radio]:checked'))
      .filter(function (el) { return (el.id || el.name) && el.id !== 'pbGuessRange' && !el.closest(NOT); })
      .map(function (el) { return (el.type === 'radio' ? el.name : el.id) + '=' + (el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value); })
      .join(', ');
  }
  function say(msgs, bad) {
    err.textContent = msgs.join(' ');
    err.hidden = !msgs.length;
    [nameEl, mailEl, box].forEach(function (el) {
      if (bad.indexOf(el) >= 0) { el.setAttribute('aria-invalid', 'true'); } else { el.removeAttribute('aria-invalid'); }
    });
  }
  function done(msg) {
    if (okText && msg) { okText.textContent = msg; }
    form.hidden = true;
    more.hidden = true;
    ok.hidden = false;
    ok.focus();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameEl.value.trim(), email = mailEl.value.trim(), msgs = [], bad = [];
    if (!name) { msgs.push('Please enter your name.'); bad.push(nameEl); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msgs.push('Please enter a valid email address.'); bad.push(mailEl); }
    if (!box.checked) { msgs.push('Please tick the box, so we may store your details.'); bad.push(box); }
    say(msgs, bad);
    if (bad.length) { bad[0].focus(); return; }
    if (form.getAttribute('aria-busy') === 'true') { return; }
    var v = { results: results(), inputs: inputs(),
              link: (window.PBShare && window.PBShare.link) ? window.PBShare.link() : location.href, page: location.href };
    track('email_result_submit', { calculator: calc });
    function viaEmail() {
      var body = 'Please send me this result.%0D%0A%0D%0A' +
        'My name: ' + encodeURIComponent(name) + '%0D%0A' +
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
    form.setAttribute('aria-busy', 'true');
    window.PBForms.send(form, v).then(function (sent) {
      form.removeAttribute('aria-busy');
      if (sent) {
        done('Thanks, ' + name.split(/\s+/)[0] + '. Damian will email you this result himself, so it will not arrive straight away.');
      } else { viaEmail(); }
    });
  });
}());
