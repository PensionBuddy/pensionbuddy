/* "Ask us about this", under every calculator's result: the form
   tools/pagebuild.py after_block() writes into #pbAfter, under the booking
   button. It is in the markup so that Netlify reads it at deploy, and hidden
   there; this shows it, so a reader without JavaScript never meets a form
   that could not carry the figures.

   On it, the result goes with the question as its attachment: the headline
   figure and its label, as the page shows them (on my-pensions, how many
   pensions are listed and their total), kept up to date while the reader
   works the calculator, and fading in when it changes. Sending posts as
   "enquiry", the form "Ask us. We reply by email." declares
   (tools/lead-parts/ask.html), with the topic "About a result" and the
   calculator's results and inputs as the details, through
   assets/js/pb-kit.js. The question is optional; the email is not.

   Its CSS is here, not in the pages: nothing of it shows without script.
   Classic script, no globals. */
(function () {
  'use strict';
  var form = document.getElementById('pbrForm');
  if (!form || !window.PBKit) return;
  var K = window.PBKit;

  var CSS = [
    '.pb-after .pbr{margin:20px 0 0;padding:18px 0 0;border-top:1px solid var(--line)}',
    '.pb-after .pbr-h{margin:0 0 12px;font-size:20px;font-weight:700;line-height:1.3;letter-spacing:-.01em;color:var(--ink)}',
    '.pb-after p.pbr-att{display:flex;flex-wrap:wrap;align-items:center;gap:2px 10px;max-width:none;margin:0 0 14px;padding:10px 14px;border-radius:8px;border-left:4px solid var(--teal);background:var(--surface-2);font-size:1rem;line-height:1.4;color:var(--ink-2)}',
    '.pbr-clip{flex:none;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.pbr-att span{flex:1 1 8em;min-width:0}',
    '.pbr-att b{flex:none;margin-left:auto;font-size:1.15rem;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.pbr-att b:empty{display:none}',
    '.pb-after p.pbr-f{display:flex;flex-direction:column;gap:6px;max-width:none;margin:0 0 12px}',
    '.pbr-f label{font-size:1rem;font-weight:600;color:var(--ink)}',
    '.pbr-opt{font-weight:400;color:var(--ink-2)}',
    '.pbr textarea,.pbr input[type=email]{width:100%;min-width:0;margin:0;padding:11px 14px;font-family:var(--font);font-size:1rem;line-height:1.5;color:var(--ink);background:var(--surface);border:1.5px solid var(--line-2);border-radius:8px;box-shadow:none;transition:border-color .2s,box-shadow .2s}',
    '.pbr textarea{display:block;min-height:76px;resize:vertical}',
    '.pbr input[type=email]{min-height:48px}',
    '.pbr textarea:focus,.pbr input[type=email]:focus{outline:none;border-color:var(--teal-700);box-shadow:0 0 0 3px var(--ring)}',
    '.pbr input[aria-invalid="true"]{border-color:var(--red)}',
    '.pbr-send{display:flex;gap:10px}',
    '.pb-after .pbr .btn.pbr-go{flex:none;width:auto;min-height:48px;margin:0}',
    '.pbr-go.is-sending{opacity:.6;cursor:progress}',
    '.pb-after p.pbr-err{max-width:none;margin:0 0 10px;font-size:1rem;font-weight:600;line-height:1.5;color:var(--red)}',
    '.pb-after p.pbr-err:empty{display:none}',
    '.pb-after p.pbr-note{max-width:none;margin:0;font-size:1rem;line-height:1.5;color:var(--ink-2)}',
    '.pbr-note a{color:var(--teal-700);font-weight:600}',
    '.pb-after p.pbr-ok{display:flex;gap:12px;align-items:flex-start;max-width:none;margin:20px 0 0;padding:18px 0 0;border-top:1px solid var(--line);font-size:1rem;line-height:1.5;color:var(--ink)}',
    '.pbr-ok:focus{outline:none}',
    '.pbr-ok .ico{flex:none;width:28px;height:28px;padding:6px;margin:-2px 0 0;border-radius:50%;background:var(--teal);color:#fff;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24 24}',
    ':root.pb-motion .pbr-ok.show .ico{animation:pbrPop .5s cubic-bezier(.34,1.56,.64,1) both}',
    ':root.pb-motion .pbr-ok.show .ico path{animation:pbrDraw .4s cubic-bezier(.22,.61,.36,1) .2s backwards}',
    ':root.pb-motion .pbr-ok.show>span{animation:pbrIn .45s cubic-bezier(.22,.61,.36,1) .12s both}',
    ':root.pb-motion .pbr .is-bad{animation:pbrShake .42s cubic-bezier(.36,.07,.19,.97)}',
    '@keyframes pbrPop{from{transform:scale(0)}}',
    '@keyframes pbrDraw{from{stroke-dashoffset:-23}}',
    '@keyframes pbrIn{from{opacity:0;transform:translateY(6px)}}',
    '@keyframes pbrShake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}',
    '@media(max-width:400px){.pbr-send{flex-direction:column}.pb-after .pbr .btn.pbr-go{width:100%}}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var $ = function (id) { return document.getElementById(id); };
  var attL = $('pbrAttL'), attV = $('pbrAttV'), email = $('pbrEmail'), msg = $('pbrMsg'), err = $('pbrErr'), okBox = $('pbrOk');
  var go = form.querySelector('.pbr-go');
  var calc = document.title.split(',')[0].trim();

  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function visible(el) {
    return el.getClientRects().length > 0 && !el.closest('.pb-veiled') && !document.documentElement.classList.contains('pb-preveil') &&
      getComputedStyle(el).visibility === 'visible';
  }
  function plural(n, one) { return n + ' ' + one + (n === 1 ? '' : 's'); }
  /* what goes with the question, as the form shows it: the first figure on
     screen with its label; a list, as how many are on it */
  function attachment() {
    if ($('ptTotal')) {
      /* the total from what is typed, not the ring's, which counts up to it */
      var n = window.PBAfter ? PBAfter.pensions().length : 0, sum = window.PBPots ? PBPots.summarise(
        [].map.call(document.querySelectorAll('#ptRows input[id^="ptValue"]'), function (el) { return { value: el.value }; })).total : 0;
      return n ? { label: 'Your list', value: plural(n, 'pension') + (sum ? ', ' + K.euro(sum) : '') } : { label: 'Nothing listed yet', value: '' };
    }
    var list = document.querySelector('[data-pb-result]');
    if (list) {
      var k = list.querySelectorAll('li').length;
      return k ? { label: 'Your list', value: plural(k, 'topic') } : { label: 'Nothing listed yet', value: '' };
    }
    var els = document.querySelectorAll('.results .res-hero .big');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], v = text(el);
      if (visible(el) && /[1-9]/.test(v) && v.length <= 40) {
        var rl = el.parentElement && el.parentElement.querySelector('.rl');
        return { label: text(rl) || calc, value: v };
      }
    }
    return { label: calc, value: '' };
  }
  function details(a) {
    var rows = ['Calculator: ' + calc];
    [].forEach.call(document.querySelectorAll('.results .res-hero .big'), function (b) {
      var rl = b.parentElement && b.parentElement.querySelector('.rl');
      if (visible(b) && text(b)) rows.push((text(rl) || 'Result') + ': ' + text(b));
    });
    if (rows.length === 1 && a.value) rows.push(a.label + ': ' + a.value);
    if (window.PBAfter) { var ins = PBAfter.inputs(); if (ins) rows.push(ins); }
    return rows.join(' | ').slice(0, 2000);
  }

  /* the attachment follows the result: once the page has settled after a
     change (a figure that counts up is read when it lands), never more
     often than a beat */
  var shown = null, timer = 0, since = 0;
  function paint() {
    timer = 0;
    var a = attachment();
    if (shown && a.label === shown.label && a.value === shown.value) return;
    var fade = shown && a.value && a.value !== shown.value && K.motion() && attV.animate;
    shown = a;
    attL.textContent = a.label;
    attV.textContent = a.value;
    if (fade) attV.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
                           { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' });
  }
  function later() {
    var now = Date.now();
    if (!timer) since = now;
    clearTimeout(timer);
    timer = setTimeout(paint, now - since > 700 ? 0 : 180);
  }
  if (window.MutationObserver) {
    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        if (!form.contains(recs[i].target)) { later(); return; }
      }
    }).observe(form.closest('main') || document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    new MutationObserver(later).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('input', function (e) { if (!form.contains(e.target)) later(); }, true);
  form.hidden = false;
  paint();

  email.addEventListener('input', function () {
    if (K.EMAIL.test(email.value.trim())) { email.removeAttribute('aria-invalid'); err.textContent = ''; }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!K.EMAIL.test(email.value.trim())) {
      err.textContent = 'Enter a valid email.';
      email.setAttribute('aria-invalid', 'true');
      K.shake(email);
      email.focus();
      return;
    }
    err.textContent = '';
    paint();
    var d = details(shown), by = K.replyBy(), q = msg.value.trim();
    K.send(form, { details: d, page: location.href.split('#')[0], reply_by: by }, go, {
      subject: 'About my result: ' + calc,
      body: d.replace(/ \| /g, '\n') + (q ? '\n\n' + q : '')
    }).then(function (how) {
      if (!how) return;
      okBox.querySelector('b').textContent = how === 'sent' ? 'Sent.' : K.MAIL_H;
      K.done(form, okBox, how === 'sent' ? 'We’ll reply ' + (by ? 'by ' + by : 'within one working day') + '.' : K.MAIL_SAID);
    });
  });
})();
