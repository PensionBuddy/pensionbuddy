/* "Ask us. We reply by email.": the enquiry form (tools/lead-parts/ask.html,
   written by tools/lead-blocks.py into the pages its BLOCKS table lists).

   Three steps in one card: a topic, a few taps of detail, then where to
   reply. Beside them a draft of the note fills in as the reader goes. The
   note posts to Netlify Forms as "enquiry" through assets/js/pb-forms.js,
   and netlify/functions/submission-created.js then emails it to us, with
   the sender's address as the reply-to, and a copy to the sender. A refused
   post opens a pre-filled email instead, as every lead form here does.

   Without this script the form is one plain page that posts as it is.

   A pointer pick of a topic, or of the last answer, moves on by itself; a
   keyboard never does (arrow keys move through a radio group, and each move
   is a change), so the Next buttons stay. Motion only under html.pb-motion.

   Classic script, no globals. */
(function () {
  'use strict';
  var form = document.getElementById('askForm');
  if (!form || !form.closest) return;
  var card = form.closest('.pb-ask-card');
  var root = document.documentElement;
  var FALLBACK = 'hello@pensionbuddy.ie';
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var TOPICS = {
    'Check my pension': {
      qs: [{ k: 'Provider', q: 'Who is it with?', a: ['Irish Life', 'Zurich', 'Aviva', 'New Ireland', 'Royal London', 'Standard Life', 'Other', 'Not sure'] },
           { k: 'Value', q: 'Roughly how much?', a: ['Under \u20ac25,000', '\u20ac25,000 to \u20ac100,000', '\u20ac100,000 to \u20ac250,000', 'Over \u20ac250,000', 'Not sure'] }]
    },
    'Start a pension': {
      qs: [{ k: 'Work', q: 'You are', a: ['Employed', 'Self-employed', 'A company director'] },
           { k: 'Age', q: 'Your age', a: ['Under 30', '30s', '40s', '50s', '60+'] }]
    },
    'Find an old pension': {
      qs: [{ k: 'Old jobs', q: 'How many old jobs?', a: ['1', '2', '3', '4+'] }],
      tip: true
    },
    'Company pension': {
      qs: [{ k: 'Company pays in now', q: 'Does the company pay in now?', a: ['Yes', 'No', 'Not sure'] }]
    },
    'Something else': { qs: [] }
  };

  function motion() { return root.classList.contains('pb-motion'); }
  function $(sel, el) { return (el || card).querySelector(sel); }
  function $$(sel, el) { return [].slice.call((el || card).querySelectorAll(sel)); }

  var stage = $('.pb-ask-stage');
  var steps = $$('.pb-ask-step');
  var prog = $$('.pb-ask-prog li');
  var draft = $('.pb-ask-draft');
  var subj = $('[data-ask-subj]'), lines = $('[data-ask-lines]'), byEl = $('[data-ask-by]');
  var qsBox = $('[data-ask-qs]');
  var tip = $('[data-ask-tip]');
  var msg = form.elements.message, nameEl = form.elements.name, emailEl = form.elements.email, phoneEl = form.elements.phone;
  var err = document.getElementById('askErr');
  var sendBtn = $('.pb-ask-send');
  var ok = document.getElementById('askOk');
  var how = $('.pb-ask-how');
  var phoneBox = $('[data-ask-phone]');
  var by = window.PBForms && PBForms.replyBy ? PBForms.replyBy() : '';
  var at = 0, topic = '', answers = {}, lastPointer = 0;
  var flagged = null;   // the box the message is about

  /* ---------------------------------------------------------------- steps */

  steps.forEach(function (s, i) { s.hidden = false; if (i) { s.inert = true; s.setAttribute('aria-hidden', 'true'); } });

  function settle() { stage.style.height = ''; }

  function go(i) {
    if (i === at || i < 0 || i >= steps.length) return;
    var from = steps[at], to = steps[i], fwd = i > at, still = !motion();
    stage.style.height = stage.offsetHeight + 'px';
    to.classList.remove('is-left', 'is-right');
    to.classList.add(fwd ? 'is-right' : 'is-left');
    void to.offsetWidth;   // the start position, before .on transitions from it
    from.classList.remove('on', 'is-left', 'is-right');
    from.classList.add(fwd ? 'is-left' : 'is-right');
    from.inert = true; from.setAttribute('aria-hidden', 'true');
    to.classList.add('on'); to.classList.remove('is-left', 'is-right');
    to.inert = false; to.removeAttribute('aria-hidden');
    stage.style.height = to.offsetHeight + 'px';
    at = i;
    prog.forEach(function (li, n) { li.classList.toggle('on', n <= i); });
    if (still) settle(); else setTimeout(settle, 480);
    var lg = to.querySelector('legend');
    if (lg) lg.focus({ preventScroll: true });
    if (to.getBoundingClientRect().top < 70) form.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
    if (to.getAttribute('data-step') === 'reply') measureHow();
  }

  function next() {
    if (at === 0 && !topic) { say('Pick a topic.', $('.pb-ask-topics')); return; }
    say('');
    go(at === 0 && !TOPICS[topic].qs.length && !TOPICS[topic].tip ? 2 : at + 1);
  }
  function back() { say(''); go(at === 2 && !TOPICS[topic].qs.length && !TOPICS[topic].tip ? 0 : at - 1); }

  $$('.pb-ask-next').forEach(function (b) { b.addEventListener('click', next); });
  $$('.pb-ask-back').forEach(function (b) { b.addEventListener('click', back); });

  /* -------------------------------------------------------------- step 1 */

  var topicBox = $('.pb-ask-topics');
  topicBox.addEventListener('pointerdown', function () { lastPointer = Date.now(); });
  topicBox.addEventListener('change', function (e) {
    if (e.target.name !== 'topic') return;
    topic = e.target.value;
    answers = {};
    $$('.pb-ask-topic', topicBox).forEach(function (l) { l.classList.toggle('is-on', l.contains(e.target)); });
    buildQs();
    say('');
    draw();
    if (Date.now() - lastPointer < 900) setTimeout(function () { if (at === 0) next(); }, motion() ? 420 : 0);
  });

  /* -------------------------------------------------------------- step 2 */

  function buildQs() {
    var t = TOPICS[topic];
    qsBox.textContent = '';
    t.qs.forEach(function (q, n) {
      var box = document.createElement('div'), p = document.createElement('p'), chips = document.createElement('div');
      box.className = 'pb-ask-q';
      p.id = 'askQ' + n; p.textContent = q.q;
      chips.className = 'pb-ask-chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-labelledby', p.id);
      q.a.forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'pb-ask-chip'; b.textContent = a; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('pointerdown', function () { lastPointer = Date.now(); });
        b.addEventListener('click', function () { pick(q, a, chips, b); });
        chips.appendChild(b);
      });
      box.appendChild(p); box.appendChild(chips); qsBox.appendChild(box);
    });
    tip.hidden = !t.tip;
  }

  function pick(q, a, chips, b) {
    var on = answers[q.k] !== a;
    if (on) answers[q.k] = a; else delete answers[q.k];
    [].forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', String(on && c === b)); });
    draw();
    var t = TOPICS[topic], all = t.qs.every(function (x) { return answers[x.k]; });
    if (on && all && Date.now() - lastPointer < 900) setTimeout(function () { if (at === 1) next(); }, motion() ? 520 : 0);
  }

  /* -------------------------------------------------------------- step 3 */

  function measureHow() {
    var on = how.querySelector('label.is-on');
    if (!on || !on.offsetWidth) return;
    how.style.setProperty('--w', on.offsetWidth + 'px');
    how.style.setProperty('--x', on.offsetLeft + 'px');
    how.classList.add('is-measured');
  }
  function syncHow() {
    var phone = form.elements.contact_by.value === 'Phone';
    $$('label', how).forEach(function (l) { l.classList.toggle('is-on', l.querySelector('input').checked); });
    phoneBox.classList.toggle('on', phone);
    phoneBox.querySelector('.ffield').inert = !phone;
    if (!phone) fixed(phoneEl, true);
    measureHow();
    draw();
  }
  var slid;
  how.addEventListener('change', function () {
    if (motion()) {   /* the pill slides; at rest the picked label carries the teal */
      how.classList.add('is-sliding');
      void how.offsetWidth;   // the pill drawn where it was, so it slides from there
      clearTimeout(slid);
      slid = setTimeout(function () { how.classList.remove('is-sliding'); }, 420);
    }
    syncHow();
    if (form.elements.contact_by.value === 'Phone') setTimeout(function () { phoneEl.focus({ preventScroll: true }); }, motion() ? 200 : 0);
  });
  window.addEventListener('resize', measureHow);
  syncHow();

  function okField(el, good) { el.closest('.ffield').classList.toggle('is-ok', good); fixed(el, good); }
  emailEl.addEventListener('input', function () { okField(emailEl, EMAIL.test(emailEl.value.trim())); draw(); });
  phoneEl.addEventListener('input', function () { okField(phoneEl, digits(phoneEl.value) >= 7); draw(); });
  nameEl.addEventListener('input', draw);
  msg.addEventListener('input', draw);

  function digits(s) { return String(s).replace(/\D/g, '').length; }

  function say(text, el) {
    err.textContent = text;
    flagged = el || null;
    if (el) {
      el.classList.remove('is-bad'); void el.offsetWidth; el.classList.add('is-bad');
      setTimeout(function () { el.classList.remove('is-bad'); }, 450);
    }
  }

  /* the message goes as soon as its field is put right */
  function fixed(el, good) { if (good && flagged === el.closest('.ffield')) say(''); }

  function check() {
    var e = emailEl.value.trim();
    if (!EMAIL.test(e)) { say('Enter a valid email.', emailEl.closest('.ffield')); emailEl.focus(); return false; }
    if (form.elements.contact_by.value === 'Phone' && digits(phoneEl.value) < 7) {
      say('Add your phone number.', phoneEl.closest('.ffield')); phoneEl.focus(); return false;
    }
    say('');
    return true;
  }

  /* --------------------------------------------------------------- draft */

  function details() {
    return TOPICS[topic] ? TOPICS[topic].qs.filter(function (q) { return answers[q.k]; })
      .map(function (q) { return q.k + ': ' + answers[q.k]; }).join(' | ') : '';
  }

  function flash(el) { el.classList.remove('is-new'); void el.offsetWidth; el.classList.add('is-new'); }
  function draw() {
    var s = topic || '\u2026';
    if (subj.textContent !== s) { subj.textContent = s; if (topic) flash(subj); }
    var want = [];
    if (topic) TOPICS[topic].qs.forEach(function (q) { if (answers[q.k]) want.push([q.k, answers[q.k]]); });
    var m = msg.value.trim();
    if (m) want.push(['Note', m.length > 60 ? m.slice(0, 59) + '…' : m]);
    var who = nameEl.value.trim(), e = emailEl.value.trim(), phone = form.elements.contact_by.value === 'Phone';
    if (who || e) want.push(['From', [who, e].filter(Boolean).join(', ')]);
    if (phone) want.push(['Call', phoneEl.value.trim() || 'yes']);
    /* keyed by label, so only a new line animates in */
    var have = {}, keys = want.map(function (w) { return w[0]; });
    [].slice.call(lines.children).forEach(function (li) {
      var k = li.getAttribute('data-k');
      if (keys.indexOf(k) < 0) li.remove(); else have[k] = li;
    });
    want.forEach(function (w, i) {
      var li = have[w[0]];
      if (!li) { li = document.createElement('li'); li.setAttribute('data-k', w[0]); li.innerHTML = '<b></b> <span></span>'; }
      li.firstChild.textContent = w[0] + ':';
      li.lastChild.textContent = w[1];
      /* moved only when out of place: a moved node plays its entrance again */
      if (lines.children[i] !== li) lines.insertBefore(li, lines.children[i] || null);
    });
    draft.classList.toggle('is-live', !!topic);
  }
  if (by) { byEl.textContent = by; }
  draw();

  /* ---------------------------------------------------------------- send */

  /* Enter on a topic or a field before the last step means Next */
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && at < steps.length - 1 && e.target.tagName === 'INPUT') { e.preventDefault(); next(); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (at < steps.length - 1) { next(); return; }
    send();
  });

  function send() {
    if (sendBtn.getAttribute('aria-disabled') === 'true') return;   // one send per click
    if (!check()) return;
    var values = { details: details(), page: location.href.split('#')[0], reply_by: by };
    if (!window.PBForms) { viaEmail(); return; }
    sendBtn.setAttribute('aria-disabled', 'true'); sendBtn.classList.add('is-sending');
    PBForms.send(form, values).then(function (good) {
      sendBtn.removeAttribute('aria-disabled'); sendBtn.classList.remove('is-sending');
      if (good) sent(); else viaEmail();
    });
  }

  function first() { var n = nameEl.value.trim().split(' ')[0]; return /^[\p{L}][\p{L}'’.-]*$/u.test(n) ? n : ''; }

  function viaEmail() {
    var body = [
      'Topic: ' + (topic || 'not chosen'),
      details().replace(/ \| /g, '\n'),
      msg.value.trim() ? '\n' + msg.value.trim() + '\n' : '',
      'Name: ' + nameEl.value.trim(),
      'Reply by: ' + form.elements.contact_by.value + (phoneEl.value.trim() ? ', ' + phoneEl.value.trim() : ''),
      'From: ' + location.href.split('#')[0]
    ].filter(Boolean).join('\n');
    window.location.href = 'mailto:' + FALLBACK + '?subject=' + encodeURIComponent('Question: ' + (topic || 'pensions')) +
      '&body=' + encodeURIComponent(body);
    show('One more step.', 'Your email app should have opened with your note ready to send. If not, email ' + FALLBACK + '.', false);
  }

  function sent() {
    var phone = form.elements.contact_by.value === 'Phone', hi = first(), when = by ? 'by ' + by : 'within one working day';
    var text = (hi ? 'Thanks, ' + hi + '. ' : 'Thanks. ') + (phone ? 'We\u2019ll call you ' : 'We\u2019ll reply ') + when + '.';
    if (!motion()) { show('Sent.', text, true); return; }
    sendBtn.classList.add('is-sent');
    draft.classList.add('is-sent');
    setTimeout(function () { show('Sent.', text, true); }, 520);
  }

  function show(h, text, real) {
    document.getElementById('askOkH').textContent = h;
    document.getElementById('askOkText').textContent = text;
    if (real) burst();
    form.hidden = true;
    ok.hidden = false;
    ok.classList.remove('show'); void ok.offsetWidth; ok.classList.add('show');
    ok.focus({ preventScroll: true });
    if (ok.getBoundingClientRect().top < 70) ok.scrollIntoView({ block: 'center', behavior: motion() ? 'smooth' : 'auto' });
  }

  function burst() {
    var b = ok.querySelector('.pb-ask-burst');
    b.textContent = '';
    if (!motion()) return;
    for (var i = 0; i < 12; i++) {
      var dot = document.createElement('i'), ang = (i / 12) * Math.PI * 2, r = 46 + (i % 3) * 14;
      dot.style.setProperty('--bx', Math.round(Math.cos(ang) * r) + 'px');
      dot.style.setProperty('--by', Math.round(Math.sin(ang) * r) + 'px');
      if (i % 2) dot.style.background = 'var(--amber, #F4B740)';
      b.appendChild(dot);
    }
  }

  document.getElementById('askAgain').addEventListener('click', function () {
    form.reset();
    topic = ''; answers = {};
    $$('.pb-ask-topic').forEach(function (l) { l.classList.remove('is-on'); });
    $$('.ffield.is-ok').forEach(function (f) { f.classList.remove('is-ok'); });
    qsBox.textContent = ''; tip.hidden = true;
    sendBtn.classList.remove('is-sent'); draft.classList.remove('is-sent');
    ok.hidden = true; ok.classList.remove('show'); form.hidden = false;
    syncHow();
    go(0);
    draw();
  });
})();
