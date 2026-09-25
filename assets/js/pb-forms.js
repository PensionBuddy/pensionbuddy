/* Lead forms, sent to Netlify Forms (Run 27).

   Seven forms reach Damian: the booking routing form, "Email my results" on
   the pension and director calculators, the guide requests on the director,
   starter and tracker pages, and the old pension finder. Each is a
   <form name="..." data-netlify="true" netlify-honeypot="bot-field"> in the
   page's static HTML, with a hidden form-name field and a honeypot. Netlify
   reads those forms when the site is deployed and from then on stores what
   is posted under each name.

   ONE RULE MAKES THAT WORK: Netlify stores only the fields a form declared
   in the HTML it read at deploy, and silently drops anything else. So every
   field a page sends is an element of its form in the static markup: the
   visible inputs by their name, and everything the page works out (the
   figures, the page address, the consent as "yes" or "no") as a hidden
   input. send() sets those hidden inputs and posts the form itself, so it
   can send nothing the form does not declare; asked to set a field the form
   lacks, it throws, which is a page bug to fix rather than a lead to lose.

   send(form, values) resolves true only when Netlify answers 2xx. A refusal,
   a network failure, or no answer within TIMEOUT_MS resolves false, and the
   page then does what it did before Netlify: opens a pre-filled email to
   Damian. Never rejects, so a page needs no catch. The timeout is short on
   purpose: a browser may refuse to open an email app long after the click
   that asked for it.

   Locally, or anywhere that is not Netlify, the POST is refused and every
   form takes its email route, exactly as before.

   Classic script; defines window.PBForms and nothing else. */
(function () {
  'use strict';
  var TIMEOUT_MS = 4000;

  function set(form, values) {
    Object.keys(values || {}).forEach(function (name) {
      var el = form.elements[name];
      if (!el || el.type !== 'hidden') {
        throw new Error('PBForms: form "' + form.getAttribute('name') + '" has no hidden field "' + name + '"');
      }
      var v = values[name];
      el.value = v === true ? 'yes' : v === false ? 'no' : (v == null ? '' : String(v));
    });
  }

  function body(form) {
    return new URLSearchParams(new FormData(form)).toString();
  }

  function send(form, values) {
    set(form, values);
    var data = body(form);
    return new Promise(function (resolve) {
      var settled = false, ctrl = window.AbortController ? new AbortController() : null;
      function end(ok) { if (!settled) { settled = true; clearTimeout(timer); resolve(ok); } }
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); end(false); }, TIMEOUT_MS);
      try {
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: data,
          signal: ctrl ? ctrl.signal : undefined
        }).then(function (r) { end(!!r && r.ok); }, function () { end(false); });
      } catch (e) { end(false); }
    });
  }

  window.PBForms = { send: send, body: body, TIMEOUT_MS: TIMEOUT_MS };
})();
