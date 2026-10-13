/* "Or we call you." on the booking page (tools/lead-parts/callback.html).

   A first name, a phone number, morning or afternoon; posts as "callback"
   through assets/js/pb-kit.js. No email is asked for, so only the alert to
   us goes (netlify/lib/emails.js).

   Classic script, no globals. */
(function () {
  'use strict';
  var form = document.getElementById('pbcForm');
  if (!form || !window.PBKit) return;
  var K = window.PBKit;
  var nameEl = document.getElementById('pbcName'), phone = document.getElementById('pbcPhone');
  var err = document.getElementById('pbcErr'), ok = document.getElementById('pbcOk'), go = form.querySelector('.pbk-go');
  var when = form.querySelector('.pbc-when');

  function digits(s) { return String(s).replace(/\D/g, '').length; }

  /* the pill slides from the old time to the new one; at rest the picked
     label carries the teal itself */
  var slid;
  function place() {
    var on = when.querySelector('label:has(input:checked)') || when.querySelector('label');
    if (!on || !on.offsetWidth) return;
    when.style.setProperty('--w', on.offsetWidth + 'px');
    when.style.setProperty('--x', on.offsetLeft + 'px');
  }
  place();
  when.addEventListener('change', function () {
    if (!K.motion()) { place(); return; }
    when.classList.add('is-sliding');
    void when.offsetWidth;   // the pill drawn where it was, so it slides from there
    place();
    clearTimeout(slid);
    slid = setTimeout(function () { when.classList.remove('is-sliding'); }, 420);
  });
  window.addEventListener('resize', place);

  /* a message is about one field, and goes as soon as that field is put right */
  var flagged = null;
  function flag(el, text) { err.textContent = text; flagged = el; K.shake(el.closest('.ffield')); el.focus(); }
  function fixed(el, good) { if (good && el === flagged) { err.textContent = ''; flagged = null; } }
  nameEl.addEventListener('input', function () { K.okField(nameEl, nameEl.value.trim().length > 1); fixed(nameEl, !!nameEl.value.trim()); });
  phone.addEventListener('input', function () { K.okField(phone, digits(phone.value) >= 7); fixed(phone, digits(phone.value) >= 7); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!nameEl.value.trim()) { flag(nameEl, 'Add your first name.'); return; }
    if (digits(phone.value) < 7) { flag(phone, 'Add your phone number.'); return; }
    err.textContent = '';
    var by = K.replyBy(), time = form.elements.time.value || 'Morning';
    K.send(form, { page: location.href.split('#')[0], reply_by: by }, go, {
      subject: 'Please call me', body: nameEl.value.trim() + '\n' + phone.value.trim() + '\n' + time
    }).then(function (how) {
      if (how === 'sent') K.done(form, ok, 'We’ll call ' + (by ? by : 'within one working day') + ', ' + (time === 'Afternoon' ? 'in the afternoon' : 'in the morning') + '.');
      else if (how === 'mail') K.done(form, ok, K.MAIL_SAID, K.MAIL_H);
    });
  });
})();
