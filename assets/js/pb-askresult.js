/* "Ask us about this", under every calculator's result (#pbAfter, the block
   tools/pagebuild.py after_block() writes).

   A press opens a sheet. The result's headline number lifts off the page
   and flies into it, as the note's attachment; under it, a question and an
   email. Sending posts as "enquiry", the form "Ask us. We reply by email."
   declares (tools/lead-parts/ask.html), with the topic "About a result" and
   the calculator's results and inputs as the details, through
   assets/js/pb-kit.js. The sheet is a <dialog>: Escape, the backdrop and
   the close button shut it, and focus goes back to the button.

   Its CSS is here, not in the pages: nothing of it exists without script.
   Classic script, no globals. */
(function () {
  'use strict';
  var after = document.getElementById('pbAfter');
  if (!after || !window.PBKit || !window.HTMLDialogElement) return;
  var K = window.PBKit;

  var CSS = [
    '.pbr-btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;margin:4px 0 0 18px;padding:0;border:0;background:none;font:400 1rem var(--font);color:var(--teal-700);text-decoration:underline;text-underline-offset:3px;cursor:pointer}',
    '.pbr-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}',
    '.pbr-btn:hover svg{transform:translateY(-2px) rotate(-6deg)}',
    '.pb-after-more[hidden]+.pbr-btn{margin-left:0}',
    '.pbr{width:min(520px,calc(100% - 32px));max-height:calc(100% - 32px);margin:auto;padding:0;border:0;border-radius:16px;background:var(--surface,#fff);color:var(--ink);box-shadow:0 30px 80px -20px rgba(11,31,28,.45);overflow:visible;opacity:0}',
    '.pbr::backdrop{background:rgba(11,31,28,.38);opacity:0}',
    '.pbr.is-in,.pbr.is-in::backdrop{opacity:1}',
    ':root.pb-motion .pbr{transform:translateY(28px) scale(.97);transition:opacity .3s ease,transform .45s cubic-bezier(.34,1.3,.64,1)}',
    ':root.pb-motion .pbr.is-in{transform:none}',
    ':root.pb-motion .pbr::backdrop{-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:opacity .3s ease}',
    '.pbr-in{padding:26px 26px 24px}',
    '.pbr-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}',
    '.pbr-head h2{margin:0;font-size:20px;line-height:1.2}',
    '.pbr-x{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:0;border-radius:50%;background:var(--surface-2);color:var(--ink-2);cursor:pointer;transition:background-color .2s,transform .3s cubic-bezier(.34,1.56,.64,1)}',
    '.pbr-x:hover{background:var(--line);transform:rotate(90deg)}',
    '.pbr-x svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}',
    '.pbr-att{position:relative;display:grid;grid-template-columns:auto 1fr;column-gap:14px;align-items:center;padding:14px 16px;margin-bottom:14px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line)}',
    '.pbr-att::before{content:"";grid-row:1 / 3;width:4px;align-self:stretch;border-radius:4px;background:var(--teal)}',
    '.pbr-att small{font-size:12.5px;font-weight:600;color:var(--ink-3)}',
    '.pbr-att b{font-size:26px;font-weight:800;letter-spacing:-.03em;line-height:1.1;font-variant-numeric:tabular-nums}',
    '.pbr-att b:empty{display:none}',
    '.pbr-att.is-wait b{opacity:0}',
    ':root.pb-motion .pbr-att b{transition:opacity .2s}',
    '.pbr textarea{display:block;width:100%;min-height:96px;margin:0 0 10px;padding:13px 16px;font:15px/1.5 var(--font);color:var(--ink);background:var(--surface-2);border:1.5px solid transparent;border-radius:8px;resize:vertical;transition:border-color .2s,background-color .2s,box-shadow .2s}',
    '.pbr textarea:focus{outline:none;border-color:var(--teal);background:#fff;box-shadow:0 0 0 4px var(--teal-50)}',
    '.pbr .pbk-send{display:flex;gap:10px}',
    '.pbr .ffield{flex:1}',
    '.pbr .ffield input{width:100%;font-family:var(--font);font-size:15px;color:var(--ink);background:var(--surface-2);border:1.5px solid transparent;border-radius:8px;transition:border-color .2s,background-color .2s,box-shadow .2s}',
    '.pbr .ffield input:focus{outline:none;border-color:var(--teal);background:#fff;box-shadow:0 0 0 4px var(--teal-50)}',
    '.pbr-err{color:var(--red);font-size:13.5px;font-weight:600;margin:10px 0 0}',
    '.pbr-err:empty{display:none}',
    '.pbr-ok{padding:34px 26px 26px;text-align:center}',
    '.pbr-ok:focus{outline:none}',
    '.pbr-tick{display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:var(--teal);color:#fff}',
    '.pbr-tick svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24 24}',
    '.pbr-ok h3{margin:14px 0 6px}',
    '.pbr-ok p{margin:0 0 18px;color:var(--ink-2)}',
    ':root.pb-motion .pbr-ok.show .pbr-tick{animation:pbrPop .5s cubic-bezier(.34,1.56,.64,1) both}',
    ':root.pb-motion .pbr-ok.show .pbr-tick svg{animation:pbrDraw .4s cubic-bezier(.22,.61,.36,1) .22s backwards}',
    ':root.pb-motion .pbr-ok.show h3,:root.pb-motion .pbr-ok.show p,:root.pb-motion .pbr-ok.show .btn{animation:pbrIn .45s cubic-bezier(.22,.61,.36,1) .15s both}',
    ':root.pb-motion .pbr .is-bad{animation:pbrShake .42s cubic-bezier(.36,.07,.19,.97)}',
    '.pbr-ghost{position:fixed;z-index:2;margin:0;pointer-events:none;font-weight:800;letter-spacing:-.03em;line-height:1.1;color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap;transform-origin:0 0}',
    '@keyframes pbrPop{from{transform:scale(0)}}',
    '@keyframes pbrDraw{from{stroke-dashoffset:-23}}',
    '@keyframes pbrIn{from{opacity:0;transform:translateY(8px)}}',
    '@keyframes pbrShake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}',
    '@media(max-width:600px){.pbr{width:100%;max-width:100%;margin:auto 0 0;border-radius:18px 18px 0 0}',
    ':root.pb-motion .pbr{transform:translateY(100%)}:root.pb-motion .pbr.is-in{transform:none}.pbr .pbk-send{flex-direction:column}}'
  ].join('\n');
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var ICON_ASK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  /* the button, beside "Email me this result" */
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'pbr-btn'; btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = ICON_ASK + '<span>Ask us about this</span>';
  var more = document.getElementById('ecMore');
  if (more) more.insertAdjacentElement('afterend', btn); else after.appendChild(btn);

  /* the sheet: the fields "enquiry" declares, the ones read from the page hidden */
  var dlg = document.createElement('dialog');
  dlg.className = 'pbr';
  dlg.setAttribute('aria-labelledby', 'pbrH');
  dlg.innerHTML =
    '<form class="pbr-in" id="pbrForm" novalidate>' +
      '<input type="hidden" name="form-name" value="enquiry"><input type="hidden" name="topic" value="About a result">' +
      '<input type="hidden" name="details"><input type="hidden" name="page"><input type="hidden" name="reply_by">' +
      '<input type="hidden" name="name"><input type="hidden" name="contact_by" value="Email"><input type="hidden" name="phone">' +
      '<p class="pb-hp" hidden><label>Leave this field empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>' +
      '<div class="pbr-head"><h2 id="pbrH">Ask us about this</h2><button type="button" class="pbr-x" aria-label="Close">' + ICON_X + '</button></div>' +
      '<div class="pbr-att"><small></small><b></b></div>' +
      '<textarea id="pbrMsg" name="message" maxlength="1500" aria-label="Your question" placeholder="Your question"></textarea>' +
      '<div class="pbk-send"><span class="ffield"><input id="pbrEmail" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" placeholder=" " aria-describedby="pbrErr"><label class="flabel" for="pbrEmail">Email</label></span>' +
      '<button type="submit" class="btn btn-primary pbr-go">Send</button></div>' +
      '<p class="pbr-err" id="pbrErr" role="alert"></p>' +
    '</form>' +
    '<div class="pbr-ok" id="pbrOk" role="status" tabindex="-1" hidden>' +
      '<span class="pbr-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>' +
      '<h3>Sent.</h3><p id="pbrOkText"></p><button type="button" class="btn btn-ghost pbr-close">Close</button>' +
    '</div>';
  document.body.appendChild(dlg);

  var form = dlg.querySelector('form'), att = dlg.querySelector('.pbr-att'), okBox = dlg.querySelector('.pbr-ok');
  var email = dlg.querySelector('#pbrEmail'), msg = dlg.querySelector('#pbrMsg'), err = dlg.querySelector('#pbrErr'), go = dlg.querySelector('.pbr-go');
  var calc = document.title.split(',')[0].trim();

  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function visible(el) {
    return el.getClientRects().length > 0 && !el.closest('.pb-veiled') && !document.documentElement.classList.contains('pb-preveil') &&
      getComputedStyle(el).visibility === 'visible';
  }
  /* the headline: the first figure on screen, with its label */
  function headline() {
    var els = document.querySelectorAll('.results .res-hero .big, #ptTotal, [data-pb-result] li');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], v = text(el);
      if (visible(el) && /[1-9]/.test(v)) {
        var rl = el.parentElement && el.parentElement.querySelector('.rl');
        return { el: el, value: v.length > 40 ? '' : v, label: text(rl) || calc };
      }
    }
    return { el: null, value: '', label: calc };
  }
  function details(h) {
    var rows = ['Calculator: ' + calc];
    [].forEach.call(document.querySelectorAll('.results .res-hero .big'), function (b) {
      var rl = b.parentElement && b.parentElement.querySelector('.rl');
      if (visible(b) && text(b)) rows.push((text(rl) || 'Result') + ': ' + text(b));
    });
    if (rows.length === 1 && h.value) rows.push(h.label + ': ' + h.value);
    if (window.PBAfter) { var ins = PBAfter.inputs(); if (ins) rows.push(ins); }
    return rows.join(' | ').slice(0, 2000);
  }

  /* the number lifts off the page and lands in the sheet */
  function fly(h) {
    var target = att.querySelector('b');
    if (!h.el || !h.value || !K.motion() || !h.el.animate) { att.classList.remove('is-wait'); return; }
    var from = h.el.getBoundingClientRect(), to = target.getBoundingClientRect();
    /* scrolled away: it lifts off the button that was pressed instead */
    var seen = from.bottom > 0 && from.top < innerHeight;
    if (!seen) from = btn.getBoundingClientRect();
    var ghost = document.createElement('span'), cs = getComputedStyle(h.el);
    ghost.className = 'pbr-ghost'; ghost.textContent = h.value;
    ghost.style.left = to.left + 'px'; ghost.style.top = to.top + 'px';
    ghost.style.fontSize = getComputedStyle(target).fontSize;
    dlg.appendChild(ghost);
    var k = seen ? parseFloat(cs.fontSize) / parseFloat(getComputedStyle(target).fontSize) || 1 : 0.6;
    ghost.animate([
      { transform: 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + k + ')', opacity: seen ? 1 : 0 },
      { transform: 'translate(' + (from.left - to.left) * 0.4 + 'px,' + ((from.top - to.top) * 0.4 - 40) + 'px) scale(' + (1 + (k - 1) * 0.4) + ')', opacity: 1, offset: .55 },
      { transform: 'none', opacity: 1 }
    ], { duration: 720, easing: 'cubic-bezier(.45,0,.2,1)' }).onfinish = function () {
      att.classList.remove('is-wait');
      ghost.remove();
    };
  }

  var opener = null;
  function open() {
    opener = document.activeElement;
    var h = headline();
    att.querySelector('small').textContent = h.value ? h.label : calc;
    att.querySelector('b').textContent = h.value;
    att.classList.toggle('is-wait', !!h.value && K.motion());
    form.hidden = false; okBox.hidden = true; okBox.classList.remove('show');
    err.textContent = '';
    form.elements.details.value = details(h);
    dlg.showModal();
    requestAnimationFrame(function () { dlg.classList.add('is-in'); });
    setTimeout(function () { fly(h); }, K.motion() ? 470 : 0);   // once the sheet has settled: no transform, so the ghost's fixed box is the screen's
    setTimeout(function () { msg.focus({ preventScroll: true }); }, K.motion() ? 120 : 0);
  }
  function close() {
    if (!dlg.open) return;
    dlg.classList.remove('is-in');
    setTimeout(function () {
      dlg.close();
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }, K.motion() ? 280 : 0);
  }

  btn.addEventListener('click', open);
  dlg.querySelector('.pbr-x').addEventListener('click', close);
  dlg.querySelector('.pbr-close').addEventListener('click', close);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dlg.addEventListener('click', function (e) {
    if (e.target !== dlg) return;
    var r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
  });
  email.addEventListener('input', function () { K.okField(email, K.EMAIL.test(email.value.trim())); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!K.EMAIL.test(email.value.trim())) { err.textContent = 'Enter a valid email.'; K.shake(email.closest('.ffield')); email.focus(); return; }
    err.textContent = '';
    var by = K.replyBy();
    K.send(form, { details: form.elements.details.value, page: location.href.split('#')[0], reply_by: by }, go, {
      subject: 'About my result: ' + calc,
      body: form.elements.details.value.replace(/ \| /g, '\n') + (msg.value.trim() ? '\n\n' + msg.value.trim() : '')
    }).then(function (how) {
      if (!how) return;
      dlg.querySelector('#pbrOkText').textContent = how === 'sent' ? 'We’ll reply ' + (by ? 'by ' + by : 'within one working day') + '.' : K.MAIL_SAID;
      okBox.querySelector('h3').textContent = how === 'sent' ? 'Sent.' : K.MAIL_H;
      form.hidden = true; okBox.hidden = false;
      okBox.classList.remove('show'); void okBox.offsetWidth; okBox.classList.add('show');
      okBox.focus({ preventScroll: true });
    });
  });
})();
