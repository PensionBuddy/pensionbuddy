/* What the small reply tools share (assets/js/pb-fee.js, pb-yearend.js,
   pb-move.js, pb-callback.js, pb-askresult.js): whether motion is on, a
   shake for a field to fix, a number that rolls to its value, a reveal, the
   send with its email fallback, and the sent state.

   Classic script; needs assets/js/pb-forms.js before it; defines
   window.PBKit and nothing else. */
(function () {
  'use strict';
  var root = document.documentElement;
  var FALLBACK = 'hello@pensionbuddy.ie';
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MAIL_SAID = 'Your email app should have opened with it ready to send. If not, email ' + FALLBACK + '.';
  var MAIL_H = 'One more step.';

  function motion() { return root.classList.contains('pb-motion'); }

  function shake(el) {
    if (!el) return;
    el.classList.remove('is-bad'); void el.offsetWidth; el.classList.add('is-bad');
    setTimeout(function () { el.classList.remove('is-bad'); }, 450);
  }

  function euro(n) { return '€' + Math.round(n).toLocaleString('en-IE'); }

  /* rolls el's number from where it was to n; a newer roll stops an older one */
  function count(el, n, fmt, dur) {
    fmt = fmt || function (x) { return String(Math.round(x)); };
    var from = el.hasAttribute('data-n') ? +el.getAttribute('data-n') : n;
    el.setAttribute('data-n', n);
    var token = (el._roll || 0) + 1;
    el._roll = token;
    if (!motion() || !window.requestAnimationFrame || from === n) { el.textContent = fmt(n); return; }
    var t0 = 0, d = dur || 560;
    requestAnimationFrame(function step(t) {
      if (el._roll !== token) return;
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(from + (n - from) * e);
      if (k < 1) requestAnimationFrame(step);
    });
  }

  /* a .pbk-fold block: open or shut, and out of the tab order while shut */
  function reveal(box, on) {
    box.classList.toggle('on', on);
    var inner = box.firstElementChild;
    if (inner) inner.inert = !on;
  }

  function replyBy() { return window.PBForms && PBForms.replyBy ? PBForms.replyBy() : ''; }

  function mail(m) {
    window.location.href = 'mailto:' + FALLBACK + '?subject=' + encodeURIComponent(m.subject) + '&body=' + encodeURIComponent(m.body);
  }

  /* posts form with values (its hidden fields); resolves 'sent', or 'mail'
     once the pre-filled email has been opened instead; null while busy */
  function send(form, values, btn, m) {
    if (btn.getAttribute('aria-disabled') === 'true') return Promise.resolve(null);
    if (!window.PBForms) { mail(m); return Promise.resolve('mail'); }
    btn.setAttribute('aria-disabled', 'true'); btn.classList.add('is-sending');
    return PBForms.send(form, values).then(function (ok) {
      btn.removeAttribute('aria-disabled'); btn.classList.remove('is-sending');
      if (!ok) mail(m);
      return ok ? 'sent' : 'mail';
    });
  }

  /* the sent state: the form goes, the panel comes, with a burst of dots;
     given a heading of its own (the email fallback), no burst */
  function done(form, ok, words, heading) {
    ok.querySelector('[data-ok-text]').textContent = words;
    var h = ok.querySelector('h3');
    if (h) {
      if (!h.hasAttribute('data-h')) h.setAttribute('data-h', h.textContent);
      h.textContent = heading || h.getAttribute('data-h');
    }
    var b = ok.querySelector('.pbk-burst');
    if (b) {
      b.textContent = '';
      if (motion() && !heading) {
        for (var i = 0; i < 12; i++) {
          var dot = document.createElement('i'), a = i / 12 * Math.PI * 2, r = 44 + (i % 3) * 14;
          dot.style.setProperty('--bx', Math.round(Math.cos(a) * r) + 'px');
          dot.style.setProperty('--by', Math.round(Math.sin(a) * r) + 'px');
          if (i % 2) dot.style.background = 'var(--amber, #F4B740)';
          b.appendChild(dot);
        }
      }
    }
    form.hidden = true;
    ok.hidden = false;
    ok.classList.remove('show'); void ok.offsetWidth; ok.classList.add('show');
    ok.focus({ preventScroll: true });
    var top = ok.getBoundingClientRect().top;
    if (top < 70 || top > innerHeight - 120) ok.scrollIntoView({ block: 'center', behavior: motion() ? 'smooth' : 'auto' });
  }

  /* the tick on a field that is right; given the form's message, that goes
     as soon as the field is put right */
  function okField(input, good, err) {
    var f = input.closest('.ffield');
    if (f) f.classList.toggle('is-ok', !!good);
    if (good && err) err.textContent = '';
  }

  window.PBKit = { motion: motion, shake: shake, euro: euro, count: count, reveal: reveal, replyBy: replyBy,
                   send: send, done: done, okField: okField, EMAIL: EMAIL, FALLBACK: FALLBACK, MAIL_SAID: MAIL_SAID, MAIL_H: MAIL_H };
})();
