/* The year-end reminder on the directors' page
   (tools/lead-parts/yearend.html).

   A company pays into a director's pension before its year end to set the
   payment against that year's profits, so the reminder is six weeks before
   it: the last day of the month picked, this year or next. A year end
   closer than six weeks means we email by the next working day instead.
   The pick draws a line from today to the reminder to year end and counts
   the days; the email posts as "year-end-reminder" through
   assets/js/pb-kit.js, and the sent state offers the reminder as a
   calendar file.

   netlify/lib/emails.js works the dates out again from the month, the
   same way, for the emails. Classic script, no globals. */
(function () {
  'use strict';
  var form = document.getElementById('pbyForm');
  if (!form || !window.PBKit) return;
  var K = window.PBKit, LEAD = 42, DAY = 864e5;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function $(sel) { return form.querySelector(sel); }

  var tl = document.getElementById('pbyTl'), days = document.getElementById('pbyDays');
  var box = document.getElementById('pbyMail'), email = document.getElementById('pbyEmail');
  var err = document.getElementById('pbyErr'), ok = document.getElementById('pbyOk'), go = $('.pbk-go');
  var nodes = [tl.querySelector('.pby-n0'), tl.querySelector('.pby-n1'), tl.querySelector('.pby-n2')];
  var plan = null;

  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function shortDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); }
  function longDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  function work(month) {
    var t = today(), end = new Date(t.getFullYear(), month + 1, 0);
    if (end < t) end = new Date(t.getFullYear() + 1, month + 1, 0);
    /* by calendar days, not hours: a clock change between would shift it a day */
    var rem = new Date(end.getFullYear(), end.getMonth(), end.getDate() - LEAD), close = rem <= t;
    if (close) {   // the next weekday, for the line only; the words use replyBy
      rem = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
      while (rem.getDay() === 0 || rem.getDay() === 6) rem = new Date(rem.getFullYear(), rem.getMonth(), rem.getDate() + 1);
    }
    return { t: t, end: end, rem: rem, close: close, days: Math.round((end - t) / DAY) };
  }

  K.reveal(box, false);
  tl.querySelector('[data-pby="today"]').textContent = shortDate(today());

  form.addEventListener('change', function (e) {
    if (e.target.name !== 'year_end') return;
    plan = work(MONTHS.indexOf(e.target.value));
    var span = plan.end - plan.t || 1, x1 = Math.max(4, Math.min(96, (plan.rem - plan.t) / span * 100));
    nodes[0].style.setProperty('--x', '0%');
    nodes[1].style.setProperty('--x', x1.toFixed(2) + '%');
    nodes[2].style.setProperty('--x', '100%');
    tl.querySelector('[data-pby="rem"]').textContent = shortDate(plan.rem);
    tl.querySelector('[data-pby="end"]').textContent = shortDate(plan.end);
    tl.classList.add('on');
    days.classList.add('on');
    K.count(days.querySelector('b'), plan.days, null, 900);
    days.querySelector('span').textContent = plan.days === 1 ? 'day to year end' : 'days to year end';
    setTimeout(function () { K.reveal(box, true); }, K.motion() ? 450 : 0);
  });
  email.addEventListener('input', function () { K.okField(email, K.EMAIL.test(email.value.trim())); });

  function ics(p) {
    function d8(d) { return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
    var next = new Date(p.rem.getFullYear(), p.rem.getMonth(), p.rem.getDate() + 1);
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pensionbuddy//Year end//EN', 'BEGIN:VEVENT',
      'UID:year-end-' + d8(p.end) + '@pensionbuddy.ie', 'DTSTAMP:' + d8(p.t) + 'T000000Z',
      'DTSTART;VALUE=DATE:' + d8(p.rem), 'DTEND;VALUE=DATE:' + d8(next),
      'SUMMARY:Pension payment before year end (' + longDate(p.end) + ')',
      'URL:https://pensionbuddy.ie/director.html', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!plan) { err.textContent = 'Pick a month.'; K.shake($('.pby-months')); return; }
    if (!K.EMAIL.test(email.value.trim())) { err.textContent = 'Enter a valid email.'; K.shake(email.closest('.ffield')); email.focus(); return; }
    err.textContent = '';
    var by = K.replyBy(), month = form.elements.year_end.value;
    var when = plan.close ? (by ? 'by ' + by : 'within one working day') : 'on ' + longDate(plan.rem);
    K.send(form, { remind_on: plan.close ? 'As soon as possible' : longDate(plan.rem), page: location.href.split('#')[0], reply_by: by }, go, {
      subject: 'Year-end reminder', body: 'Company year end: ' + month + '\nRemind me: ' + when
    }).then(function (how) {
      if (how === 'mail') { K.done(form, ok, K.MAIL_SAID, K.MAIL_H); ok.querySelector('.pbk-ok-row').hidden = true; return; }
      if (how !== 'sent') return;
      var link = document.getElementById('pbyIcs');
      try { link.href = URL.createObjectURL(new Blob([ics(plan)], { type: 'text/calendar' })); } catch (x) { link.hidden = true; }
      K.done(form, ok, plan.close ? 'Year end is close. We’ll email you ' + when + '.' : 'We’ll remind you ' + when + '.');
    });
  });
})();
