/* "Changing jobs?" on the tracker page (tools/lead-parts/move.html).

   Leaving or starting; the pick opens "when" and the email, which posts as
   "job-change" through assets/js/pb-kit.js. The copy email
   (netlify/lib/emails.js) carries what to do first, for the one picked.

   Classic script, no globals. */
(function () {
  'use strict';
  var form = document.getElementById('pbmForm');
  if (!form || !window.PBKit) return;
  var K = window.PBKit;
  var box = document.getElementById('pbmMore'), email = document.getElementById('pbmEmail');
  var err = document.getElementById('pbmErr'), ok = document.getElementById('pbmOk'), go = form.querySelector('.pbk-go');

  K.reveal(box, false);
  form.addEventListener('change', function (e) {
    if (e.target.name === 'change' && !box.classList.contains('on')) setTimeout(function () { K.reveal(box, true); }, K.motion() ? 380 : 0);
  });
  email.addEventListener('input', function () { K.okField(email, K.EMAIL.test(email.value.trim())); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var change = form.elements.change.value, when = form.elements.when.value;
    if (!change) { err.textContent = 'Pick one.'; K.shake(form.querySelector('.pbm-pick')); return; }
    if (!K.EMAIL.test(email.value.trim())) { err.textContent = 'Enter a valid email.'; K.shake(email.closest('.ffield')); email.focus(); return; }
    err.textContent = '';
    var by = K.replyBy();
    K.send(form, { page: location.href.split('#')[0], reply_by: by }, go, {
      subject: 'Changing jobs', body: change + (when ? ', ' + when.toLowerCase() : '')
    }).then(function (how) {
      if (how === 'sent') K.done(form, ok, 'We’ll email you ' + (by ? 'by ' + by : 'within one working day') + '.');
      else if (how === 'mail') K.done(form, ok, K.MAIL_SAID, K.MAIL_H);
    });
  });
})();
