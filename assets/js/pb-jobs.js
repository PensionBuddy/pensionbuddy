/* The old jobs timeline on the tracker page (tools/lead-parts/jobs.html,
   written into tracker.html by tools/lead-blocks.py).

   The reader adds each old job: the employer and the years. Each one lands
   as a bar on a timeline, oldest first, and the counts under it say how
   many jobs, how many years of work, and how many lasted under 2 years (a
   scheme may have paid those back as a refund, or may still hold it). Once
   there is one job the reply details open, and "Send my list to Damian"
   posts it to Netlify Forms as "pension-trace" through
   assets/js/pb-forms.js. netlify/functions/submission-created.js then emails
   Damian the list, with the sender's address as the reply-to, and the
   sender a copy. A refused post opens a pre-filled email instead.

   The list stays on this device (localStorage) until it is sent, so a
   reader can come back to it. Without script the form is a text box for
   the jobs and the reply fields, and posts as it is.

   Motion only under html.pb-motion. Classic script, no globals. */
(function () {
  'use strict';
  var form = document.getElementById('pbjForm');
  if (!form) return;
  var root = document.documentElement;
  var FALLBACK = 'hello@pensionbuddy.ie', KEY = 'pb-jobs-v1', MAX = 15;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var NOW = new Date().getFullYear();

  function motion() { return root.classList.contains('pb-motion'); }
  function $(id) { return document.getElementById(id); }

  var emp = $('pbjEmp'), from = $('pbjFrom'), to = $('pbjTo'), prov = $('pbjProv');
  var addBtn = $('pbjAddBtn'), err = $('pbjErr'), err2 = $('pbjErr2');
  var provBtn = $('pbjProvBtn'), provBox = $('pbjProvBox');
  var tl = $('pbjTl'), rows = $('pbjRows'), axis = $('pbjAxis'), shortNote = $('pbjShortNote');
  var send = $('pbjSend'), go = $('pbjGo'), ok = $('pbjOk');
  var nameEl = $('pbjName'), emailEl = $('pbjEmail'), phoneEl = $('pbjPhone'), otherEl = $('pbjOther');
  var jobsBox = $('pbjJobs');
  var by = window.PBForms && PBForms.replyBy ? PBForms.replyBy() : '';
  var jobs = [], seq = 0;

  /* ------------------------------------------------------------- storage */

  function save() {
    try {
      if (jobs.length) localStorage.setItem(KEY, JSON.stringify(jobs.map(function (j) { return [j.name, j.from, j.to, j.now ? 1 : 0, j.prov]; })));
      else localStorage.removeItem(KEY);
    } catch (e) { /* private window or storage off: the list just is not kept */ }
  }
  function load() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || '[]');
      return (Array.isArray(a) ? a : []).slice(0, MAX).filter(function (r) {
        return Array.isArray(r) && typeof r[0] === 'string' && r[0] && year(r[1]) != null && year(r[2]) != null && r[2] >= r[1];
      }).map(function (r) { return { id: ++seq, name: r[0].slice(0, 80), from: +r[1], to: +r[2], now: !!r[3], prov: String(r[4] || '').slice(0, 80) }; });
    } catch (e) { return []; }
  }

  /* --------------------------------------------------------------- input */

  function year(v, allowNow) {
    var s = String(v == null ? '' : v).trim().toLowerCase();
    if (allowNow && /^(now|today|present|still|current)$/.test(s)) return NOW;
    if (!/^\d{4}$/.test(s)) return null;
    var y = +s;
    return y >= 1940 && y <= NOW ? y : null;
  }

  function bad(el, text, where) {
    (where || err).textContent = text;
    var f = el.closest('.ffield') || el;
    f.classList.remove('is-bad'); void f.offsetWidth; f.classList.add('is-bad');
    setTimeout(function () { f.classList.remove('is-bad'); }, 450);
    el.focus();
    return false;
  }

  function add() {
    var n = emp.value.trim().replace(/\s+/g, ' '), f = year(from.value), t = year(to.value, true);
    var isNow = /^[a-z]+$/i.test(to.value.trim());
    if (!n) return bad(emp, 'Add the employer’s name.');
    if (f == null) return bad(from, 'Add the year you started, like 1998.');
    if (!to.value.trim()) return bad(to, 'Add the year you left, or type now.');
    if (t == null) return bad(to, 'Add the year you left, like 2004, or type now.');
    if (t < f) return bad(to, 'The year you left is before the year you started.');
    if (jobs.length >= MAX) return bad(emp, MAX + ' jobs is the most for one list. Send these, and tell Damian about the rest when he replies.');
    err.textContent = '';
    jobs.push({ id: ++seq, name: n.slice(0, 80), from: f, to: t, now: isNow, prov: prov.value.trim().slice(0, 80) });
    emp.value = from.value = to.value = prov.value = '';
    render(seq);
    save();
    var label = addBtn.querySelector('span');
    addBtn.classList.add('is-done'); label.textContent = 'Added';
    setTimeout(function () { addBtn.classList.remove('is-done'); label.textContent = 'Add another'; }, 900);
    emp.focus();
    return true;
  }

  addBtn.addEventListener('click', add);
  [emp, from, to, prov].forEach(function (el) {
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  });
  /* a four-digit start year moves on to the end year */
  from.addEventListener('input', function () { if (year(from.value) != null && !to.value) to.focus(); });

  provBox.querySelector('.ffield').inert = true;
  provBtn.addEventListener('click', function () {
    var on = !provBox.classList.contains('on');
    provBox.classList.toggle('on', on);
    provBtn.setAttribute('aria-expanded', String(on));
    provBox.querySelector('.ffield').inert = !on;
    if (on) setTimeout(function () { prov.focus({ preventScroll: true }); }, motion() ? 150 : 0);
  });

  /* ------------------------------------------------------------ timeline */

  function sorted() { return jobs.slice().sort(function (a, b) { return a.from - b.from || a.to - b.to; }); }

  function range() {
    var lo = Math.min.apply(null, jobs.map(function (j) { return j.from; })) - 1;
    var hi = Math.max(NOW, Math.max.apply(null, jobs.map(function (j) { return j.to; }))) + 1;
    if (hi - lo < 8) lo = hi - 8;
    return { lo: lo, hi: hi };
  }

  function years(n) { return n === 1 ? '1 year' : n + ' years'; }
  function when(j) {
    if (j.from === j.to) return 'in ' + j.from + ', under a year';
    return j.from + ' to ' + (j.now ? 'now' : j.to) + ', ' + years(j.to - j.from);
  }
  function short(j) { return j.to - j.from < 2; }

  var X = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  function row(j) {
    var li = document.createElement('li'), wrap = document.createElement('div'), label = document.createElement('div');
    var b = document.createElement('b'), s = document.createElement('span'), x = document.createElement('button');
    var track = document.createElement('div'), bar = document.createElement('span');
    li.className = 'pbj-row'; li.setAttribute('data-id', j.id);
    label.className = 'pbj-label';
    b.textContent = j.name; s.textContent = when(j);
    label.appendChild(b); label.appendChild(s);
    if (j.now) tag(label, 'Current job', '');
    if (short(j)) tag(label, 'Under 2 years', 'is-short');
    if (j.prov) tag(label, j.prov, '');
    x.type = 'button'; x.className = 'pbj-x'; x.innerHTML = X; x.setAttribute('aria-label', 'Remove ' + j.name);
    x.addEventListener('click', function () { remove(j.id); });
    label.appendChild(x);
    track.className = 'pbj-track'; bar.className = 'pbj-bar';
    track.appendChild(bar);
    wrap.appendChild(label); wrap.appendChild(track);
    li.appendChild(wrap);
    li.classList.toggle('is-short', short(j));
    return li;
  }
  function tag(label, text, cls) {
    var t = document.createElement('span');
    t.className = 'pbj-tag' + (cls ? ' ' + cls : '');
    t.textContent = text;
    label.appendChild(t);
  }

  function remove(id) {
    var at = jobs.findIndex(function (j) { return j.id === id; });
    if (at < 0) return;
    jobs.splice(at, 1);
    save();
    render();
    err.textContent = '';
    var live = rows.querySelector('.pbj-row:not(.is-out) .pbj-x');
    (live || emp).focus();
  }

  function render(newId) {
    var list = sorted(), have = {};
    [].forEach.call(rows.children, function (li) { if (!li.classList.contains('is-out')) have[li.getAttribute('data-id')] = li; });
    tl.classList.toggle('has', list.length > 0);

    if (list.length) {
      var r = range(), w = r.hi - r.lo;
      list.forEach(function (j) {
        var li = have[j.id] || row(j);
        var l = (j.from - r.lo) / w * 100, width = Math.max(j.to - j.from, 0.4) / w * 100;
        li.style.setProperty('--l', l.toFixed(2) + '%');
        li.style.setProperty('--w', width.toFixed(2) + '%');
        li.style.setProperty('--lp', Math.min(l, 52).toFixed(2) + '%');
        if (j.id === newId && motion()) {
          li.classList.add('is-new');
          setTimeout(function () { li.classList.remove('is-new'); }, 800);
        }
        rows.appendChild(li);
        delete have[j.id];
      });
      drawAxis(r);
    } else {
      axis.textContent = '';
    }
    Object.keys(have).forEach(function (id) {
      var li = have[id];
      if (!motion()) { li.remove(); return; }
      li.classList.add('is-out');
      setTimeout(function () { li.remove(); }, 400);
    });
    stats(list);
    openSend(list.length > 0);
    tickChecklist(list.length > 0);
  }

  function drawAxis(r) {
    var w = r.hi - r.lo, step = [1, 2, 5, 10, 20].filter(function (s) { return w / s <= 7; })[0] || 20;
    var key = r.lo + '-' + r.hi;
    if (axis.getAttribute('data-r') === key) return;   // unchanged: no fade
    axis.setAttribute('data-r', key);
    axis.textContent = '';
    for (var y = Math.ceil((r.lo + 0.5) / step) * step; y < r.hi; y += step) {
      var s = document.createElement('span'), p = (y - r.lo) / w * 100;
      s.textContent = y;
      s.style.left = p.toFixed(2) + '%';
      if (p < 5) s.style.transform = 'none'; else if (p > 95) s.style.transform = 'translateX(-100%)';
      axis.appendChild(s);
    }
  }

  /* the years covered by at least one job, so overlapping jobs count once */
  function covered(list) {
    var spans = list.map(function (j) { return [j.from, Math.max(j.to, j.from + 0.5)]; }).sort(function (a, b) { return a[0] - b[0]; });
    var total = 0, cur = null;
    spans.forEach(function (s) {
      if (!cur || s[0] > cur[1]) { if (cur) total += cur[1] - cur[0]; cur = s.slice(); }
      else cur[1] = Math.max(cur[1], s[1]);
    });
    if (cur) total += cur[1] - cur[0];
    return Math.round(total);
  }

  function count(key, n) {
    var el = form.querySelector('[data-pbj="' + key + '"]'), was = +el.textContent || 0;
    if (was === n) return;
    el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
    if (!motion() || !window.requestAnimationFrame) { el.textContent = n; return; }
    var t0 = 0, dur = 420;
    (function tick(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(was + (n - was) * e);
      if (k < 1) requestAnimationFrame(tick);
    })(0);
  }

  function stats(list) {
    var s = list.filter(short).length;
    count('jobs', list.length);
    count('years', covered(list));
    count('short', s);
    form.querySelector('.pbj-st-short').classList.toggle('has', s > 0);
    shortNote.hidden = !s;
  }

  var openTimer;
  function openSend(on) {
    if (send.classList.contains('on') === on) return;
    clearTimeout(openTimer);
    send.classList.toggle('on', on);
    send.classList.remove('is-open');
    send.querySelector('.pbj-send-in').inert = !on;
    if (on) openTimer = setTimeout(function () { send.classList.add('is-open'); }, motion() ? 620 : 0);
  }

  /* "Listed the employers I have had", the first box of the page's checklist */
  function tickChecklist(on) {
    var box = $('pbTick1');
    if (!box || !on || box.checked) return;
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ---------------------------------------------------------------- send */

  function okField(el, good) { el.closest('.ffield').classList.toggle('is-ok', good); }
  emailEl.addEventListener('input', function () { okField(emailEl, EMAIL.test(emailEl.value.trim())); });
  nameEl.addEventListener('input', function () { okField(nameEl, nameEl.value.trim().length > 1); });

  function text() {
    return sorted().map(function (j) {
      return j.name + ', ' + (j.from === j.to ? j.from : j.from + ' to ' + (j.now ? 'now' : j.to)) + (j.prov ? ', ' + j.prov : '');
    }).join(' | ');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (go.getAttribute('aria-disabled') === 'true') return;   // one send per click
    /* a job typed but not added yet is added first */
    if ((emp.value.trim() || from.value.trim() || to.value.trim()) && !add()) return;
    if (!jobs.length) { bad(emp, 'Add at least one job first.'); return; }
    if (!nameEl.value.trim()) { bad(nameEl, 'Please add your full name. Pension companies search by name.', err2); return; }
    if (!EMAIL.test(emailEl.value.trim())) { bad(emailEl, 'Please enter a valid email address, so Damian can reply.', err2); return; }
    err2.textContent = '';
    jobsBox.value = text();
    var values = { jobs_count: String(jobs.length), page: location.href.split('#')[0], reply_by: by };
    if (!window.PBForms) { viaEmail(); return; }
    go.setAttribute('aria-disabled', 'true'); go.classList.add('is-sending');
    PBForms.send(form, values).then(function (good) {
      go.removeAttribute('aria-disabled'); go.classList.remove('is-sending');
      if (good) sent(); else viaEmail();
    });
  });

  function first() { var n = nameEl.value.trim().split(' ')[0]; return /^[\p{L}][\p{L}'’.-]*$/u.test(n) ? n : ''; }

  function viaEmail() {
    var body = ['My old jobs:', text().replace(/ \| /g, '\n'), '',
      'Name: ' + nameEl.value.trim(),
      otherEl.value.trim() ? 'Other name at those jobs: ' + otherEl.value.trim() : '',
      phoneEl.value.trim() ? 'Phone: ' + phoneEl.value.trim() : ''].filter(function (x, i) { return x || i === 2; }).join('\n');
    window.location.href = 'mailto:' + FALLBACK + '?subject=' + encodeURIComponent('Please look for my old pensions') +
      '&body=' + encodeURIComponent(body);
    show('One more step.', 'Your email app should have opened with your list ready to send. If it didn’t, email ' + FALLBACK + ' and Damian will reply.', false);
  }

  function sent() {
    var n = jobs.length, hi = first();
    var msg = (hi ? 'Thanks, ' + hi + '. ' : 'Thanks. ') + 'Damian will email you ' + (by ? 'by ' + by : 'within one working day') + '.';
    try { localStorage.removeItem(KEY); } catch (e) { /* nothing kept */ }
    if (!motion()) { show('Sent. Damian has your list.', msg, true, n); return; }
    var lis = [].slice.call(rows.querySelectorAll('.pbj-row:not(.is-out)'));
    tl.classList.add('is-scan');
    lis.forEach(function (li, i) { setTimeout(function () { li.classList.add('is-found'); }, 180 + i * (950 / Math.max(lis.length, 1))); });
    setTimeout(function () { show('Sent. Damian has your list.', msg, true, n); }, 1500);
  }

  function show(h, msg, real, n) {
    var after = $('pbjAfter');
    $('pbjOkH').textContent = h;
    $('pbjOkText').textContent = msg;
    after.textContent = '';
    if (real) {
      [['Now', 'Your list of ' + (n === 1 ? 'one job' : n + ' jobs') + ' is with Damian.'],
       [by ? 'By ' + by : 'Within one working day', 'Damian emails you to say what he needs. Pension companies usually ask for a signed letter before they share details.'],
       ['Then', 'He tells you what he found, what each pension is worth, and your options.']].forEach(function (r) {
        var li = document.createElement('li'), b = document.createElement('b');
        b.textContent = r[0]; li.appendChild(b); li.appendChild(document.createTextNode(r[1])); after.appendChild(li);
      });
    }
    form.hidden = true;
    ok.hidden = false;
    ok.classList.remove('show'); void ok.offsetWidth; ok.classList.add('show');
    ok.focus({ preventScroll: true });
    var top = ok.getBoundingClientRect().top;
    if (top < 70 || top > innerHeight - 120) ok.scrollIntoView({ block: 'center', behavior: motion() ? 'smooth' : 'auto' });
  }

  $('pbjAgain').addEventListener('click', function () {
    jobs = [];
    form.reset();
    [].forEach.call(form.querySelectorAll('.ffield.is-ok'), function (f) { f.classList.remove('is-ok'); });
    tl.classList.remove('is-scan');
    rows.textContent = '';
    render();
    save();
    ok.hidden = true; ok.classList.remove('show'); form.hidden = false;
    emp.focus();
  });

  /* ---------------------------------------------------------------- start */

  send.querySelector('.pbj-send-in').inert = true;
  jobs = load();
  render();
})();
