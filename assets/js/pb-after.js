/* After the result (Run 43; rebuilt for give, then ask in Run 45).

   Under each calculator's result, one shared block that tools/pagebuild.py
   after_block() writes into the page, so it is the same everywhere and is
   there without JavaScript: what the calculator does not show (a caveat),
   then #pbAfter: the booking button (assets/js/pb-cta.js picks its wording)
   and, on every page that sends anything, "Email me this result". This file does three things and writes
   nothing else.

   1. THE BUTTON'S ADDRESS. The button carries #from= and one of the nine
      calculators only while all three hold: the reader has changed one of this calculator's own controls on this visit
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
      inputs (each as its label and shown value), pb-share's link and the
      page's address read from the page,
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
  var NOT = '.pb-guess, .pb-ab, .pb-share, .pb-after, .pb-after-not, .pb-optin, .pb-today';

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
  /* each input as its label and the value the page shows beside it (the
     slider's #<id>V), "Your age now: 40 | Pension saved so far: €50,000",
     which is how netlify/lib/emails.js lists them in the email */
  function clean(s) { return String(s).replace(/\|/g, '/').replace(/\s+/g, ' ').trim(); }
  function labelOf(el) {
    var set = el.type === 'radio' && el.closest('fieldset'), lg = set && set.querySelector('legend');
    if (lg) { return text(lg); }
    var l = el.id && document.querySelector('label[for="' + el.id + '"]');
    if (l && text(l)) { return text(l); }
    if (el.type !== 'radio' && el.closest('label') && text(el.closest('label'))) { return text(el.closest('label')); }
    return el.getAttribute('aria-label') || el.id || el.name;
  }
  function valueOf(el) {
    if (el.type === 'checkbox') { return el.checked ? 'yes' : 'no'; }
    if (el.type === 'radio') { return text(el.closest('label')) || el.value; }
    var shown = el.id && document.getElementById(el.id + 'V');
    return (shown && text(shown)) || el.value;
  }
  function inputs() {
    return [].slice.call(document.querySelectorAll('[data-pb-calc] input[type=range], [data-pb-calc] input[type=text], ' +
      '[data-pb-calc] input[type=checkbox], [data-pb-calc] input[type=radio]:checked'))
      .filter(function (el) { return (el.id || el.name) && el.id !== 'pbGuessRange' && !el.closest(NOT); })
      .map(function (el) { return clean(labelOf(el)) + ': ' + clean(valueOf(el)); })
      .join(' | ').slice(0, 2000);
  }
  /* THE SUMMARY (Job 4): the same figures, laid out for the email. One
     record per calculator: the headline result, the other results, and each
     input under You, Your pension or Assumptions, with a plain label. A
     projected figure also carries its value in today's money, worked out
     here with PBAssume (assets/js/pb-assumptions.js): the ECB's 2% a year,
     over the years to the date the figure is for. netlify/lib/emails.js
     lays it out; this file only reads what the page shows. */
  var SUMMARY = {
    'pension-calculator': { head: 'potOut', more: ['incOut'], years: function () { return num('ret') - num('age'); },
      projected: ['potOut', 'incOut'],
      labels: { potOut: 'Your pension pot when you stop work', incOut: 'Income it could pay, each month' },
      you: { age: 'Your age now', ret: 'Age you stop work', earn: 'What you earn in a year' },
      pension: { pot: 'Saved in your pension so far', mine: 'You pay in each month', emp: 'Your employer pays in each month' },
      assume: { growth: 'Growth each year' } },
    'director-calculator': { head: 'potOut', more: ['taxOut'], years: function () { return num('ret') - num('age'); },
      projected: ['potOut'],
      labels: { potOut: 'Your pension pot when you stop work', taxOut: 'Company tax saved, all years added up' },
      you: { age: 'Your age now', ret: 'Age you stop work', sal: 'Your salary in a year' },
      pension: { pot: 'Saved in your pension so far', contrib: 'Your company pays in each year', split: 'Share of that money put in your pension' },
      assume: { risk: 'Growth each year, at this risk level (1 lowest, 7 highest)' } },
    'broker-vs-autoenrolment': { head: 'aeTotal', more: ['ppTotal'],
      labels: { aeTotal: 'Paid into your pension in one year, auto-enrolment', ppTotal: 'Paid into your pension in one year, your own pension' },
      you: { age: 'Your age now', salary: 'Your salary in a year' },
      pension: { gross: 'You pay into your own pension', match: 'Your employer adds, as a share of salary', extra: 'Extra you save each month', tmatch: 'Share of that extra your employer matches' },
      assume: { phase: 'Auto-enrolment year' } },
    'pension-fees-calculator': { head: 'potA', more: ['potB'], years: function () { return num('years'); },
      projected: ['potA', 'potB'],
      labels: { potA: 'Your plan, when you stop work', potB: 'The other plan, when you stop work' },
      you: { years: 'Years until you stop work' },
      pension: { pot: 'Saved in your pension so far', monthly: 'Paid in each month', amcA: 'Yearly charge, your plan', feeA: 'Charge on each payment, your plan',
                 amcB: 'Yearly charge, the other plan', feeB: 'Charge on each payment, the other plan' },
      assume: { growth: 'Growth each year, before charges' } },
    'state-pension-reality-check': { head: 'spWeekly', more: ['spAnnual'],
      labels: { spWeekly: 'State Pension, each week', spAnnual: 'State Pension, each year' },
      you: { age: 'Your age now', contribs: 'Weeks of social insurance (PRSI) counted by 66' } },
    'state-pension-entitlement': { head: 'spWeekly', more: ['spAnnual'],
      labels: { spWeekly: 'State Pension, each week', spAnnual: 'State Pension, each year' },
      you: { birth: 'Year you were born', entry: 'Year you first paid social insurance (PRSI)' },
      pension: { paid: 'Weeks you paid social insurance', credited: 'Weeks credited to you', homecaring: 'Weeks spent caring at home (HomeCaring)' } },
    'standard-fund-threshold': { head: 'share', more: ['thr'],
      labels: { share: 'Share of the limit your pensions would use', thr: 'The limit for that year' },
      you: { year: 'Year you take your pensions' },
      pension: { total: 'All your pensions added up', lump: 'Lump sum you take' } },
    'pia': { head: 'penOut', more: ['piaOut', 'etfOut'], years: function () { return num('years'); },
      projected: ['penOut', 'piaOut', 'etfOut'],
      labels: { penOut: 'In a pension, at the end', piaOut: 'In a PIA (proposed), at the end', etfOut: 'In a fund outside a pension, at the end' },
      you: { age: 'Your age now', salary: 'What you earn in a year' },
      pension: { amount: 'You put in each month', years: 'Years you put money in' },
      assume: { growth: 'Growth each year, before tax', piaRate: 'PIA tax rate (not yet set)', piaThreshold: 'PIA tax-free amount (not yet set)' } }
  };
  function num(id) { var el = document.getElementById(id); return el ? +el.value : 0; }
  function euroOf(v) { return '€' + Math.round(v).toLocaleString('en-IE'); }
  function money(t) { var m = /^€([\d,]+(?:\.\d+)?)$/.exec(t); return m ? +m[1].replace(/,/g, '') : null; }
  function figure(cfg, id, years) {
    var el = document.getElementById(id), lab = el && el.parentNode && el.parentNode.querySelector('.rl');
    if (!el || !shown(el) || !text(el)) { return null; }
    var row = { label: (cfg.labels && cfg.labels[id]) || text(lab), value: clean(text(el)) };
    var v = money(row.value);
    if (years > 0 && v !== null && (cfg.projected || []).indexOf(id) >= 0 && window.PBAssume) {
      row.today = euroOf(window.PBAssume.today(v, years));
    }
    return row;
  }
  function rows(map) {
    return Object.keys(map || {}).map(function (id) {
      var el = document.getElementById(id);
      if (!el) { return null; }
      return { label: map[id], value: clean(valueOf(el)) };
    }).filter(function (r) { return r && r.value; });
  }
  function summary() {
    var cfg = SUMMARY[calc];
    if (!cfg) {
      var list = [].map.call(document.querySelectorAll('[data-pb-result]'), text).filter(Boolean);
      return JSON.stringify({ v: 1, calc: calc, notes: list.slice(0, 12) }).slice(0, 4000);
    }
    var years = cfg.years ? cfg.years() : 0;
    var out = { v: 1, calc: calc, head: figure(cfg, cfg.head, years), more: [], groups: [] };
    (cfg.more || []).forEach(function (id) { var r = figure(cfg, id, years); if (r) { out.more.push(r); } });
    var assume = rows(cfg.assume);
    if (years > 0 && cfg.projected && window.PBAssume) {
      out.years = years;
      assume.push({ label: 'Prices rise each year (inflation)', value: window.PBAssume.inflation.pct });
    }
    [['You', rows(cfg.you)], ['Your pension', rows(cfg.pension)], ['Assumptions', assume]].forEach(function (g) {
      if (g[1].length) { out.groups.push({ title: g[0], rows: g[1] }); }
    });
    return JSON.stringify(out).slice(0, 4000);
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
    if (!box.checked) { msgs.push('Please tick the box if you want this result emailed to you.'); bad.push(box); }
    say(msgs, bad);
    if (bad.length) { bad[0].focus(); return; }
    if (form.getAttribute('aria-busy') === 'true') { return; }
    var v = { results: results(), inputs: inputs(), summary: summary(),
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
        done('Thanks, ' + name.split(/\s+/)[0] + '. Because you ticked the box, this result is emailed to you automatically.');
      } else { viaEmail(); }
    });
  });
}());
