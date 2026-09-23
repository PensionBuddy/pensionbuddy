/* Share results (Mercury): a link to the figures on screen.

   The button copies this page's address with the calculator's own inputs
   after the # (sliders, checkboxes, and the pressed segment buttons such as
   the tax rate or the comparison's mode). A fragment never reaches a
   server, so the privacy notice's "not sent to us or stored" stays true:
   the reader copies it, and the reader decides where it goes. Opening such
   a link sets those controls in page order and fires the same input and
   click events a reader would, so every figure is the page's own work
   through its own handlers; nothing here calculates anything. The guess
   slider is never included. Without script there is no button. */
(function () {
  'use strict';
  var wrap = document.querySelector('.calc-wrap'), results = document.querySelector('.results');
  if (!wrap || !results || !window.URLSearchParams) return;

  function ranges() {
    return [].slice.call(wrap.querySelectorAll('input[type=range], input[type=checkbox]'))
      .filter(function (el) { return el.id && el.id !== 'pbGuessRange' && !el.closest('.pb-guess'); });
  }
  function pressed() {
    return [].slice.call(wrap.querySelectorAll('button.on[id], button[aria-pressed="true"][id], [role="tab"][aria-selected="true"][id]'))
      .map(function (b) { return b.id; })
      .filter(function (id, i, a) { return a.indexOf(id) === i; });
  }

  /* opening a shared link */
  /* the head captured the fragment before any page script ran: the
     comparison page clears one it does not recognise as it starts */
  var h = String(window.pbShareHash || location.hash || '').slice(1), q = h ? new URLSearchParams(h) : null;
  if (q && q.get('pb') === '1') {
    (q.get('on') || '').split(',').forEach(function (id) {
      var b = id && document.getElementById(id);
      if (b && wrap.contains(b) && b.tagName === 'BUTTON') b.click();
    });
    ranges().forEach(function (el) {
      if (!q.has(el.id)) return;
      var v = q.get(el.id);
      if (el.type === 'checkbox') {
        if (el.checked !== (v === '1')) el.click();
      } else if (/^-?\d+(\.\d+)?$/.test(v)) {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  /* the button */
  var row = document.createElement('div');
  row.className = 'pb-share';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Copy a link to these figures';
  var said = document.createElement('span');
  said.className = 'pb-share-said';
  said.setAttribute('role', 'status');
  row.appendChild(btn);
  row.appendChild(said);
  var work = document.getElementById('pbWork'), hero = results.querySelector('.res-hero');
  var after = work ? work.closest('details') : hero;
  if (!after) return;
  after.parentNode.insertBefore(row, after.nextSibling);

  function link() {
    var p = ['pb=1'];
    ranges().forEach(function (el) {
      p.push(encodeURIComponent(el.id) + '=' + (el.type === 'checkbox' ? (el.checked ? '1' : '0') : encodeURIComponent(el.value)));
    });
    var on = pressed();
    if (on.length) p.push('on=' + on.map(encodeURIComponent).join(','));
    return location.href.split('#')[0] + '#' + p.join('&');
  }
  function fallback(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(t);
    return ok;
  }
  var timer = 0;
  btn.addEventListener('click', function () {
    var text = link();
    function done(ok) {
      said.textContent = ok ? 'Link copied.' : 'Could not copy. The link is in the address bar.';
      if (!ok) { try { history.replaceState(null, '', text); } catch (e) { /* keep going */ } }
      clearTimeout(timer);
      timer = setTimeout(function () { said.textContent = ''; }, 2500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback(text)); });
    } else { done(fallback(text)); }
  });
})();
