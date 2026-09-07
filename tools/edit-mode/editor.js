/* Local copy editor. Injected by tools/edit-server.py into the served copy of a
   page only. It is never written into a file in the repo.

   Three things happen here, in order:
     1. a MutationObserver starts immediately, before the page's own scripts
        have finished, and notes every marked element whose text a script writes
     2. after load, plus a settle pause, each marked element is compared against
        the text in the source file. Matches become editable, everything else is
        locked
     3. the observer keeps running for the rest of the session, so an element
        that turns out to be script-driven later loses its editability then. */
(function () {
  'use strict';

  var D = JSON.parse(document.getElementById('pbe-data').textContent);
  var PAGE = D.page, ITEMS = D.items, ROOT = document.documentElement;
  var KEY = 'pbe.edits.v1', PREF = 'pbe.prefs.v1';
  var SETTLE = 900;

  function norm(s) {
    return String(s == null ? '' : s).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function get(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var store = get(KEY, {});                 // every page's edits, so you can roam
  var prefs = get(PREF, { hl: true, locked: false, help: true });
  // hl and locked can also be set in the address, so a particular view can be
  // linked to or captured: ?edit=1&locked=1 shows what is held back.
  'hl locked'.split(' ').forEach(function (k) {
    var m = new RegExp('[?&]' + k + '=([01])').exec(location.search);
    if (m) prefs[k] = m[1] === '1';
  });
  var on = D.enabled !== false;
  var touched = Object.create(null);        // ids a script has written to
  var original = Object.create(null);       // id -> innerHTML as the file has it
  var armed = false, suppress = 0, editing = null, saveTimer = null;

  function key(id) { return PAGE + ' ' + id; }
  function el(id) { return document.querySelector('[data-pbe="' + id + '"]'); }

  /* ---- 1 and 3: is anything writing to this element? --------------------- */
  function ownerId(node) {
    var n = node && node.nodeType === 1 ? node : node && node.parentNode;
    while (n && n.nodeType === 1) {
      if (n.hasAttribute('data-pbe')) return n.getAttribute('data-pbe');
      n = n.parentNode;
    }
    return null;
  }

  new MutationObserver(function (muts) {
    if (suppress) return;
    for (var i = 0; i < muts.length; i++) {
      var id = ownerId(muts[i].target);
      if (!id) continue;
      var e = el(id);
      if (!e) continue;
      if (editing && (e === editing || e.contains(editing))) continue;  // that is you typing
      // Observer callbacks are microtasks, so a change you typed can arrive
      // here after you have already clicked away and editing is back to null.
      // Reading that as a script write would lock the element and bin your
      // edit, so compare against what we last recorded: if the text on screen
      // is what you typed, or is still exactly what the file says, nothing
      // else has written to it.
      var now = norm(e.textContent), rec = store[key(id)];
      if (rec && norm(rec.new) === now) continue;
      if (!rec && ITEMS[id] && ITEMS[id].text === now) continue;
      touched[id] = true;
      if (armed && e.hasAttribute('data-pbe-live')) {
        lock(e);
        delete store[key(id)];              // an edit here could not be applied safely
        put(KEY, store); paint();
        say('The page rewrote one element by itself, so it is now locked and its edit was dropped.', true);
      }
    }
  }).observe(ROOT, { childList: true, characterData: true, subtree: true });

  /* ---- editing ----------------------------------------------------------- */
  function cleanHtml(node) {
    var c = node.cloneNode(true), all = c.querySelectorAll('*'), i, a;
    var strip = ['contenteditable', 'spellcheck', 'data-pbe', 'data-pbe-live',
                 'data-pbe-changed', 'data-pbe-lock', 'data-pbe-alt'];
    for (i = 0; i < all.length; i++)
      for (a = 0; a < strip.length; a++) all[i].removeAttribute(strip[a]);
    // contenteditable likes to drop a non-breaking space in where you typed a
    // plain one. Nothing in this site's source uses one, so they are all ours.
    return c.innerHTML.replace(/\u00a0/g, ' ').trim();
  }

  function lock(e) {
    e.removeAttribute('contenteditable');
    e.removeAttribute('data-pbe-live');
    e.removeAttribute('data-pbe-changed');
    e.setAttribute('data-pbe-lock', '1');
    e.title = 'Not editable: this text is produced or updated by the page itself.';
  }

  function record(e, id) {
    var it = ITEMS[id], k = key(id), now = norm(e.textContent);
    if (!now || now === it.text) {
      delete store[k];
      e.removeAttribute('data-pbe-changed');
    } else {
      store[k] = { page: PAGE, id: id, kind: 'text', old: it.text, new: now,
                   new_html: cleanHtml(e), label: it.label, where: it.where, line: it.line };
      e.setAttribute('data-pbe-changed', '1');
    }
    persist();
    paint();
  }

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { put(KEY, store); }, 300);
  }

  function makeEditable(e, id) {
    original[id] = e.innerHTML;
    e.setAttribute('data-pbe-live', '1');
    e.setAttribute('contenteditable', 'true');
    e.setAttribute('spellcheck', 'true');
    // icons and photographs sitting inside a run of copy are not text
    var atoms = e.querySelectorAll('svg,img,picture'), i;
    for (i = 0; i < atoms.length; i++) atoms[i].setAttribute('contenteditable', 'false');

    e.addEventListener('focus', function () { editing = e; });
    e.addEventListener('blur', function () { editing = null; record(e, id); });
    e.addEventListener('input', function () { record(e, id); });
    e.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); e.blur(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); revertOne(id); e.blur(); }
      // this edits copy, not formatting, so the styling shortcuts stay off
      else if ((ev.metaKey || ev.ctrlKey) && 'biu'.indexOf(ev.key.toLowerCase()) > -1) ev.preventDefault();
    });
    e.addEventListener('paste', function (ev) {
      ev.preventDefault();                                   // copy only, never styling
      var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, norm(t));
    });
  }

  /* Clicks inside an editable must not follow the link, submit the form or run
     the page's own handler. Capture phase, so an inline onclick never fires. */
  document.addEventListener('click', function (ev) {
    if (!on || !armed) return;
    var t = ev.target.nodeType === 1 ? ev.target : ev.target.parentElement;
    if (!t || !t.closest || t.closest('#pbe-bar,#pbe-pop')) return;
    var img = t.closest('[data-pbe-alt]');
    if (img) { ev.preventDefault(); ev.stopPropagation(); altPopover(img); return; }
    if (t.closest('[data-pbe-live]')) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);

  /* ---- 2: settle, then decide what is editable --------------------------- */
  function arm() {
    var nodes = document.querySelectorAll('[data-pbe]'), live = 0, locked = 0, i;
    for (i = 0; i < nodes.length; i++) {
      var e = nodes[i], id = e.getAttribute('data-pbe'), it = ITEMS[id];
      if (!it) continue;
      // The text the browser rendered must match the text in the file. If a
      // script rewrote it during load it will not, and it stays locked.
      if (touched[id] || norm(e.textContent) !== it.text) { lock(e); locked++; continue; }
      makeEditable(e, id); live++;
    }
    armed = true;
    restore();
    paint(live, locked);
  }

  /* Edits made earlier in the session are put back so the pages keep reading
     the way you left them. Anything already applied to the file is dropped. */
  function restore() {
    suppress++;
    Object.keys(store).forEach(function (k) {
      var v = store[k];
      if (v.page !== PAGE) return;
      var it = ITEMS[v.id], e = el(v.id);
      if (!it || !e || it.text !== v.old) { delete store[k]; return; }   // the file moved on
      if (v.kind === 'alt') { e.setAttribute('alt', v.new); e.setAttribute('data-pbe-changed', '1'); return; }
      if (!e.hasAttribute('data-pbe-live')) { delete store[k]; return; }
      e.innerHTML = v.new_html || v.new;
      e.setAttribute('data-pbe-changed', '1');
    });
    put(KEY, store);
    setTimeout(function () { suppress--; }, 0);
  }

  function revertOne(id) {
    var e = el(id), it = ITEMS[id];
    if (!e || !it) return;
    suppress++;
    if (it.kind === 'alt') e.setAttribute('alt', it.text);
    else if (original[id] != null) e.innerHTML = original[id];
    setTimeout(function () { suppress--; }, 0);
    delete store[key(id)];
    e.removeAttribute('data-pbe-changed');
    put(KEY, store); paint();
  }

  /* ---- alt text ---------------------------------------------------------- */
  function altPopover(img) {
    var id = img.getAttribute('data-pbe-alt'), it = ITEMS[id];
    if (!it) return;
    closePop();
    var pop = document.createElement('div');
    pop.id = 'pbe-pop';
    pop.innerHTML = '<label for="pbe-alt">Alt text for this image</label>' +
      '<div class="pbe-sub">What a screen reader reads out. Describe the picture, and do not start with "image of".</div>' +
      '<textarea id="pbe-alt"></textarea>' +
      '<div class="pbe-row"><button type="button" class="pbe-x">Cancel</button>' +
      '<button type="button" class="pbe-ok">Use this</button></div>';
    var back = document.createElement('div');
    back.id = 'pbe-back';
    back.onclick = closePop;
    document.body.appendChild(back);
    document.body.appendChild(pop);
    var ta = pop.querySelector('textarea');
    ta.value = img.getAttribute('alt') || '';
    ta.focus(); ta.select();
    pop.querySelector('.pbe-x').onclick = closePop;
    pop.querySelector('.pbe-ok').onclick = function () {
      var v = norm(ta.value), k = key(id);
      suppress++;
      img.setAttribute('alt', v);
      setTimeout(function () { suppress--; }, 0);
      if (!v || v === it.text) { delete store[k]; img.removeAttribute('data-pbe-changed'); }
      else {
        store[k] = { page: PAGE, id: id, kind: 'alt', old: it.text, new: v,
                     new_html: '', label: it.label, where: it.where, line: it.line };
        img.setAttribute('data-pbe-changed', '1');
      }
      put(KEY, store); paint(); closePop();
    };
    pop.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closePop();
      if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) pop.querySelector('.pbe-ok').click();
    });
  }
  function closePop() {
    ['pbe-pop', 'pbe-back'].forEach(function (i) {
      var n = document.getElementById(i); if (n) n.remove();
    });
  }

  /* ---- the bar ----------------------------------------------------------- */
  var bar, msgEl, countEl, saveBtn;

  function buildBar() {
    bar = document.createElement('div');
    bar.id = 'pbe-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Copy editor');
    bar.innerHTML =
      '<span class="pbe-dot"></span><span class="pbe-name">Copy editor</span>' +
      '<span class="pbe-count"></span>' +
      '<button type="button" class="pbe-save">Save my edits</button>' +
      '<button type="button" data-a="hl" aria-pressed="true">Highlights</button>' +
      '<button type="button" data-a="locked" aria-pressed="false">Show locked</button>' +
      '<button type="button" data-a="undo">Undo all</button>' +
      '<button type="button" data-a="off">Turn off</button>' +
      '<button type="button" class="pbe-q" data-a="help" aria-label="How this works">?</button>' +
      '<span class="pbe-help">Click any highlighted text and type over it. Enter finishes, Esc undoes that one. ' +
      'Click a photo to change its alt text. Your edits follow you from page to page, so save once at the end.</span>' +
      '<span class="pbe-msg" role="status"></span>';
    document.body.appendChild(bar);
    msgEl = bar.querySelector('.pbe-msg');
    countEl = bar.querySelector('.pbe-count');
    saveBtn = bar.querySelector('.pbe-save');
    saveBtn.onclick = doSave;
    bar.querySelector('[data-a="hl"]').onclick = function () { toggle('hl', this); };
    bar.querySelector('[data-a="locked"]').onclick = function () { toggle('locked', this); };
    bar.querySelector('[data-a="undo"]').onclick = undoAll;
    var help = bar.querySelector('.pbe-help');
    help.hidden = prefs.help === false;
    bar.querySelector('[data-a="help"]').onclick = function () {
      help.hidden = !help.hidden;
      prefs.help = !help.hidden;
      put(PREF, prefs);
    };
    bar.querySelector('[data-a="off"]').onclick = function () {
      var q = location.search;
      location.search = /edit=1/.test(q) ? q.replace(/edit=1/, 'edit=0')
                      : (q ? q + '&edit=0' : '?edit=0');
    };
    addEventListener('keydown', function (ev) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') { ev.preventDefault(); doSave(); }
    });
  }

  function toggle(name, btn) {
    prefs[name] = !prefs[name];
    put(PREF, prefs);
    btn.setAttribute('aria-pressed', prefs[name] ? 'true' : 'false');
    applyPrefs();
  }
  function applyPrefs() {
    ROOT.toggleAttribute('data-pbe-hl', !!prefs.hl && on);
    ROOT.toggleAttribute('data-pbe-locked', !!prefs.locked && on);
    if (!bar) return;
    bar.querySelector('[data-a="hl"]').setAttribute('aria-pressed', prefs.hl ? 'true' : 'false');
    bar.querySelector('[data-a="locked"]').setAttribute('aria-pressed', prefs.locked ? 'true' : 'false');
  }

  function count() { return Object.keys(store).length; }
  function paint(live, locked) {
    if (!countEl) return;
    var n = count(), here = 0;
    Object.keys(store).forEach(function (k) { if (store[k].page === PAGE) here++; });
    if (live != null) paint.stats = live + ' editable, ' + locked + ' locked on this page';
    countEl.textContent = (n ? n + ' edit' + (n === 1 ? '' : 's') +
      (here !== n ? ' (' + here + ' here)' : '') + ' · ' : '') + (paint.stats || '');
    saveBtn.textContent = n ? 'Save my edits (' + n + ')' : 'Save my edits';
    saveBtn.disabled = !n;
  }

  function say(t, bad) {
    if (!msgEl) return;
    msgEl.textContent = t;
    if (bad) msgEl.setAttribute('data-bad', '1'); else msgEl.removeAttribute('data-bad');
  }

  function undoAll() {
    if (!count() || !confirm('Throw away all ' + count() + ' unsaved edits?')) return;
    store = {}; put(KEY, store);
    say('Edits discarded. Reloading.');
    location.reload();
  }

  function doSave() {
    if (!count()) return;
    var edits = Object.keys(store).map(function (k) { return store[k]; });
    say('Saving...');
    fetch('/__pbe/save', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ edits: edits }) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.error || 'save failed');
        say('Saved ' + r.count + ' change' + (r.count === 1 ? '' : 's') + ' to ' + r.file +
            (r.stale && r.stale.length ? '. Skipped: ' + r.stale.join('; ') : '') +
            '. Now tell Claude the edits are saved.', !!(r.stale && r.stale.length));
      })
      .catch(function (e) { say('Could not save: ' + e.message +
        '. Is tools/edit-server.py still running?', true); });
  }

  /* ---- go ---------------------------------------------------------------- */
  function start() {
    buildBar();
    applyPrefs();
    if (!on) {
      say('Edit mode is off. Change edit=0 to edit=1 in the address to turn it back on.');
      paint(0, 0);
      return;
    }
    setTimeout(arm, SETTLE);
  }
  if (document.readyState === 'complete') start();
  else addEventListener('load', start);
})();
