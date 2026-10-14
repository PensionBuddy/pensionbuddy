/* Send to my partner (14 October 2026, Damian: everything can be shared).
   One button, where the row of three (copy a link, save or print, email),
   cut on 8 October 2026, stood before:
     - on the calculators, at the end of the block after the result
       (#pbAfter), under "Email me this result";
     - on the home page, under the calculator's result;
     - in the games, on the score screen ("Challenge a friend"), from the
       page's own button (#pbShareBtn, data-pb-share="... {ovScore} ...").
   On a touch screen with the Web Share API it opens the phone's own share
   sheet, so the reader picks WhatsApp, Messages or mail; elsewhere it copies
   the words and the link, and says so. The reader sees what goes and
   decides where.

   THE LINK. A calculator's link is this page's address with its own inputs
   after the # (sliders, checkboxes, and the pressed buttons: by id, or by
   their one data- attribute, such as the tax rate's data-rate="40"). A
   fragment never reaches a server, so nothing is sent to us or stored.
   Opening such a link sets those controls in page order and fires the same
   click and input events a reader would, so every figure is the page's own
   work through its own handlers; nothing here calculates. Those events are
   untrusted, so the analytics never count them as the reader's own move
   (assets/js/pb-after.js). The email form's marketing opt-in (.pb-optin)
   and its consent box are never in a link: that choice is the reader's own.

   window.PBShare.link() is the one definition of a link to these figures
   (assets/js/pb-after.js puts it in "Email me this result"); PBShare.send()
   is the button's action. Without script there is no button. Vanilla JS. */
(function () {
  'use strict';
  if (window.PBShare && window.PBShare.send) { return; }
  var touch = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/><polyline points="16 7 12 3 8 7"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  var CSS = [
    '.pb-share{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:12px 0 0}',
    '.pb-share-btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 18px;border:1.5px solid var(--teal,#14CBB1);border-radius:999px;background:transparent;color:var(--teal-700,#0B7A6E);font-family:var(--font,inherit);font-size:15px;font-weight:700;line-height:1.2;cursor:pointer}',
    '.pb-share-btn svg{width:18px;height:18px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.pb-share-btn:hover{background:var(--teal-50,#E6FBF7)}',
    '.pb-share-btn:focus-visible{outline:none;box-shadow:0 0 0 3px var(--ring,rgba(20,203,177,.4))}',
    '.pb-share-said{font-size:14px;line-height:1.4;color:var(--ink-2,#3D4F4B)}',
    '.pb-share-said:empty{display:none}',
    '@media (prefers-reduced-motion:no-preference){',
    '  :root.pb-motion .pb-share-btn{transition:background-color .2s,transform .12s}',
    '  :root.pb-motion .pb-share-btn:active{transform:scale(.97)}',
    '  :root.pb-motion .pb-share-btn svg{transition:transform .25s cubic-bezier(.34,1.56,.64,1)}',
    '  :root.pb-motion .pb-share-btn:hover svg{transform:translateY(-2px)}',
    '  :root.pb-motion .pb-share-said:not(:empty){animation:pbShareIn .3s cubic-bezier(.22,.61,.36,1) both}',
    '}',
    '@keyframes pbShareIn{from{opacity:0;transform:translateY(4px)}}'
  ].join('\n');

  function copyOld(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.top = '0'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(t);
    return ok;
  }
  /* o: { url, text, title, said: the status element } */
  function send(o) {
    var said = o.said;
    function tell(msg) {
      if (!said) { return; }
      said.textContent = msg;
      clearTimeout(said.pbT);
      said.pbT = setTimeout(function () { said.textContent = ''; }, 4000);
    }
    function copy() {
      var all = (o.text ? o.text + ' ' : '') + o.url;
      function done(ok) { tell(ok ? 'Link copied. Paste it into a message.' : 'Copy this link: ' + o.url); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(all).then(function () { done(true); }, function () { done(copyOld(all)); });
      } else { done(copyOld(all)); }
    }
    if (touch && navigator.share) {
      navigator.share({ title: o.title || 'Pensionbuddy', text: o.text || '', url: o.url }).catch(function (e) {
        if (!e || e.name !== 'AbortError') { copy(); }
      });
      return;
    }
    copy();
  }
  window.PBShare = { send: send };

  function style() {
    if (document.getElementById('pbShareCss')) { return; }
    var st = document.createElement('style'); st.id = 'pbShareCss'; st.textContent = CSS; document.head.appendChild(st);
  }
  function row(label) {
    var r = document.createElement('div'); r.className = 'pb-share';
    r.innerHTML = '<button type="button" class="pb-share-btn">' + ICON + '<span></span></button><span class="pb-share-said" role="status"></span>';
    r.querySelector('button span').textContent = label;
    return r;
  }

  /* ---- the games: the page's own button, its words from the score screen */
  var gb = document.getElementById('pbShareBtn');
  if (gb) {
    var gs = document.getElementById('pbShareSaid');
    gb.hidden = false;
    gb.addEventListener('click', function () {
      var words = (gb.getAttribute('data-pb-share') || '').replace(/\{(\w+)\}/g, function (m, id) {
        var el = document.getElementById(id); return el ? el.textContent.trim() : '';
      });
      send({ url: location.href.split('#')[0], text: words, title: document.title, said: gs });
    });
    return;
  }

  /* ---- a calculator: the calculator pages' .calc-wrap, or the home page's #calc */
  var home = document.getElementById('calc');
  var root = document.querySelector('.calc-wrap') || (home && home.querySelector('.pb-c2-res') ? home : null);
  if (!root || !window.URLSearchParams) { return; }

  function ranges() {
    return [].slice.call(root.querySelectorAll('input[type=range][id], input[type=checkbox][id]'))
      .filter(function (el) { return el.id !== 'ecConsent' && !el.closest('.pb-optin'); });
  }
  /* a pressed button's name in a link: its id, or its one data- attribute */
  function token(b) {
    if (b.id) { return b.id; }
    var a = [].slice.call(b.attributes).filter(function (x) { return /^data-/.test(x.name) && !/^data-pb/.test(x.name); });
    return a.length === 1 ? a[0].name.slice(5) + ':' + a[0].value : null;
  }
  function pressed() {
    return [].slice.call(root.querySelectorAll('button.on, button[aria-pressed="true"], [role="tab"][aria-selected="true"]'))
      .map(token).filter(function (t, i, all) { return t && all.indexOf(t) === i; });
  }
  function find(t) {
    var i = t.indexOf(':');
    if (i < 0) { var b = document.getElementById(t); return b && root.contains(b) ? b : null; }
    var name = t.slice(0, i), val = t.slice(i + 1);
    if (!/^[a-z][a-z0-9-]*$/.test(name)) { return null; }
    return [].slice.call(root.querySelectorAll('button[data-' + name + ']')).filter(function (b) { return b.getAttribute('data-' + name) === val; })[0] || null;
  }
  function isOn(b) { return b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-selected') === 'true' || b.classList.contains('on'); }
  function link() {
    var p = ['pb=1'];
    ranges().forEach(function (el) {
      p.push(encodeURIComponent(el.id) + '=' + (el.type === 'checkbox' ? (el.checked ? '1' : '0') : encodeURIComponent(el.value)));
    });
    var on = pressed();
    if (on.length) { p.push('on=' + on.map(encodeURIComponent).join(',')); }
    return location.href.split('#')[0] + '#' + p.join('&');
  }
  window.PBShare.link = link;

  /* opening a shared link: the head kept the fragment before any page
     script could tidy it away (window.pbShareHash) */
  var h = String(window.pbShareHash || location.hash || '').slice(1), q = null;
  try { q = h ? new URLSearchParams(h) : null; } catch (e) { q = null; }
  if (q && q.get('pb') === '1') {
    (q.get('on') || '').split(',').forEach(function (t) {
      var b = t && find(t);
      if (b && (b.tagName === 'BUTTON' || b.getAttribute('role') === 'tab') && !isOn(b)) { b.click(); }
    });
    ranges().forEach(function (el) {
      if (!q.has(el.id)) { return; }
      var v = q.get(el.id);
      if (el.type === 'checkbox') {
        if (el.checked !== (v === '1')) { el.click(); }
      } else if (/^-?\d+(\.\d+)?$/.test(v)) {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    /* the home page opens at the calculator the link is about */
    if (root === home) {
      setTimeout(function () {
        var smooth = document.documentElement.classList.contains('pb-motion');
        home.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
      }, 300);
    }
  }

  /* the button */
  var at = root === home ? document.getElementById('pbC2Close') : document.getElementById('pbAfter');
  if (!at) { return; }
  style();
  var r = row('Send to my partner');
  if (root === home) { at.parentNode.insertBefore(r, at.nextSibling); } else { at.appendChild(r); }
  var said = r.querySelector('.pb-share-said');
  r.querySelector('button').addEventListener('click', function () {
    send({ url: link(), text: 'My pension figures on Pensionbuddy. Try yours:', title: document.title, said: said });
  });
})();
