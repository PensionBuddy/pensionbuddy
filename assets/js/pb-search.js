/*
  Search the site (Run 37, item 3).

  The magnifier in the nav, or "/" from anywhere on a page that is not a text
  field, opens a search over the pages, their sections and the jargon buster.
  Everything happens in the browser: the index is assets/js/pb-search-index.js,
  written by tools/site-index.py from the pages themselves, and it is fetched
  from this site the first time a reader opens the search (or points at the
  button), never before. Nothing typed is stored, sent or kept in the address.

  The same box can also sit in a page, open (the 404 page): an element with
  data-pb-search gets the input and the list inline.

  HOW IT BEHAVES
    - a modal <dialog>: focus goes to the field and comes back to the button
      when it closes (Escape, the close button, or a click on the backdrop)
    - results as you type, eight at most, each a link: a page (with the
      section that matched, when it has its own anchor), or a jargon buster
      entry; Down from the field steps into the list, Up and Down move
      through it, Up from the first goes back to the field, Enter in the field
      follows the first result
    - the count is announced politely (role="status")
    - every word must match the start of a word somewhere in the entry; a
      title counts most, then a section heading, then the description and
      the page's address
    - nothing animates
    - without JavaScript the button is not drawn (the NAV block hides it
      until html.pb-js), and the nav it sits in is the way round the site

  Loads late (type="text/pb-late").
*/
(function () {
  'use strict';

  var MAX = 8;
  var LABEL = 'Search Pensionbuddy';
  var HINT = 'Search pages, guides and the jargon buster';
  var BUSTER = 'Jargon buster';
  var STOP = { a: 1, an: 1, and: 1, the: 1, of: 1, to: 1, in: 1, for: 1, on: 1, is: 1, my: 1, your: 1, i: 1, do: 1, it: 1, what: 1, how: 1 };

  var dialog = null, input = null, list = null, count = null, opener = null;
  var loading = false, waiting = [];
  var docs = null;

  /* ---- the index ---- */
  function norm(s) {
    s = String(s || '').toLowerCase();
    if (s.normalize) { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    return s.replace(/[‘’']/g, '').replace(/[^a-z0-9€%]+/g, ' ').trim();
  }

  function words(s) { var n = norm(s); return n ? n.split(' ') : []; }

  function build(ix) {
    var out = [];
    (ix.pages || []).forEach(function (p) {
      /* the page's address counts as description: "pensions-over-50" is
         how a reader who types "over 50" finds "Pensions after 50" */
      out.push({ u: p.u, t: p.t, d: p.d, kind: 'page', title: words(p.t + ' ' + p.h), desc: words(p.d + ' ' + p.u.replace(/\.html$/, '').replace(/-/g, ' ')),
        secs: (p.s || []).map(function (s) { return { t: s[0], id: s[1], w: words(s[0]) }; }) });
    });
    (ix.terms || []).forEach(function (g) {
      out.push({ u: g.u, t: g.t, d: g.d, kind: 'term', title: words(g.t), desc: words(g.d), secs: [] });
    });
    return out;
  }

  function need(fn) {
    if (docs) { fn(); return; }
    waiting.push(fn);
    if (window.PBSearchIndex) { ready(); return; }
    if (loading) { return; }
    loading = true;
    var holder = document.querySelector('script[type="text/pb-lazy"][src*="pb-search-index.js"]');
    var s = document.createElement('script');
    s.src = holder ? holder.getAttribute('src') : 'assets/js/pb-search-index.js';
    s.onerror = function () { loading = false; if (count) { count.textContent = 'The search could not load. Every page is in the menu.'; } };
    document.head.appendChild(s);
  }

  function ready() {
    if (!window.PBSearchIndex) { return; }
    if (!docs) { docs = build(window.PBSearchIndex); }
    var w = waiting; waiting = [];
    w.forEach(function (fn) { fn(); });
  }
  window.PBSearchReady = ready;

  /* one query word against one field: 3 for a whole word, 2 for the start of
     one, 0 for nothing */
  function hit(q, field) {
    var best = 0, i;
    for (i = 0; i < field.length && best < 3; i++) {
      if (field[i] === q) { best = 3; } else if (q.length > 1 && field[i].indexOf(q) === 0) { best = Math.max(best, 2); }
    }
    return best;
  }

  function score(doc, qs, phrase) {
    var total = 0, sec = null, secBest = -1, i, j, a, b, c, s, sh;
    /* the best section: the one matching most of the words */
    for (j = 0; j < doc.secs.length; j++) {
      sh = 0;
      for (i = 0; i < qs.length; i++) { sh += hit(qs[i], doc.secs[j].w); }
      if (sh > secBest) { secBest = sh; sec = doc.secs[j]; }
    }
    for (i = 0; i < qs.length; i++) {
      a = hit(qs[i], doc.title) * 10;
      b = sec ? hit(qs[i], sec.w) * 5 : 0;
      c = hit(qs[i], doc.desc) * 2;
      s = Math.max(a, b, c);
      if (!s) { return null; }
      total += s;
    }
    if (norm(doc.t).indexOf(phrase) > -1) { total += 25; }
    if (doc.kind === 'term' && (norm(doc.t.split(' (')[0]) === phrase || norm((doc.t.match(/\(([^)]+)\)$/) || [])[1]) === phrase)) { total += 20; }
    return { doc: doc, score: total, sec: sec && secBest > 0 && sec.id ? sec : (sec && secBest > 0 ? { t: sec.t, id: '' } : null) };
  }

  function search(q) {
    var qs = words(q).filter(function (w) { return !STOP[w]; }), phrase = norm(q), out = [];
    if (!qs.length) { qs = words(q); }
    if (!qs.length) { return []; }
    docs.forEach(function (d) { var r = score(d, qs, phrase); if (r) { out.push(r); } });
    out.sort(function (x, y) { return y.score - x.score || (x.doc.kind === 'term' ? -1 : 1); });
    return out.slice(0, MAX);
  }

  /* ---- drawing ---- */
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (txt) { e.appendChild(document.createTextNode(txt)); }
    return e;
  }

  function snippet(s) { return s.length > 150 ? s.slice(0, 147).replace(/\s+\S*$/, '') + '…' : s; }

  function draw(box, q) {
    var ul = box.list, rs, i, li, a, r, where;
    while (ul.firstChild) { ul.removeChild(ul.firstChild); }
    if (!q.replace(/\s/g, '')) { box.count.textContent = ''; return; }
    rs = search(q);
    for (i = 0; i < rs.length; i++) {
      r = rs[i];
      li = el('li');
      a = el('a', 'pb-sr');
      a.href = r.doc.kind === 'page' && r.sec && r.sec.id ? r.doc.u + '#' + r.sec.id : r.doc.u;
      a.appendChild(el('span', 'pb-sr-t', r.doc.t));
      where = r.doc.kind === 'term' ? BUSTER : (r.sec ? r.sec.t : '');
      if (where) { a.appendChild(el('span', 'pb-sr-k', where)); }
      if (r.doc.d) { a.appendChild(el('span', 'pb-sr-d', snippet(r.doc.d))); }
      li.appendChild(a);
      ul.appendChild(li);
    }
    box.count.textContent = rs.length === 1 ? '1 result' : rs.length ? rs.length + ' results' : 'Nothing found. Try one word, such as PRSA, or see the jargon buster.';
  }

  function keys(box) {
    box.input.addEventListener('input', function () { need(function () { draw(box, box.input.value); }); });
    box.input.addEventListener('keydown', function (e) {
      var first = box.list.querySelector('a');
      if (e.key === 'ArrowDown' && first) { e.preventDefault(); first.focus(); }
      if (e.key === 'Enter' && first) { e.preventDefault(); first.click(); }
    });
    box.list.addEventListener('keydown', function (e) {
      var links = [].slice.call(box.list.querySelectorAll('a')), i = links.indexOf(document.activeElement);
      if (i < 0) { return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); (links[i + 1] || links[i]).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (i ? links[i - 1] : box.input).focus(); }
    });
  }

  function field(id) {
    var box = { wrap: el('div', 'pb-search-in') };
    var lab = el('label', 'pb-search-label', LABEL);
    lab.htmlFor = id;
    box.input = el('input', 'pb-search-q');
    box.input.type = 'search';
    box.input.id = id;
    box.input.setAttribute('autocomplete', 'off');
    box.input.setAttribute('spellcheck', 'false');
    box.input.setAttribute('placeholder', HINT);
    box.count = el('p', 'pb-search-count');
    box.count.id = id + 'Count';
    box.count.setAttribute('role', 'status');
    box.list = el('ul', 'pb-search-list');
    box.list.id = id + 'List';
    box.input.setAttribute('aria-describedby', box.count.id);
    box.input.setAttribute('aria-controls', box.list.id);
    box.label = lab;
    keys(box);
    return box;
  }

  function makeDialog() {
    var box = field('pbSearchQ'), head = el('div', 'pb-search-head'), close = el('button', 'pb-search-close', 'Close');
    dialog = el('dialog', 'pb-search');
    dialog.id = 'pbSearch';
    dialog.setAttribute('aria-labelledby', 'pbSearchQLabel');
    box.label.id = 'pbSearchQLabel';
    close.type = 'button';
    close.addEventListener('click', function () { dialog.close(); });
    head.appendChild(box.label);
    head.appendChild(close);
    box.wrap.appendChild(head);
    box.wrap.appendChild(box.input);
    box.wrap.appendChild(box.count);
    box.wrap.appendChild(box.list);
    dialog.appendChild(box.wrap);
    /* a click on the backdrop lands on the dialog itself, outside its box */
    dialog.addEventListener('click', function (e) { if (e.target === dialog) { dialog.close(); } });
    /* Escape closes it here rather than by the browser's own close request,
       which Chrome can skip without a fresh user activation */
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); dialog.close(); }
    });
    dialog.addEventListener('close', function () {
      if (opener && opener.focus) { opener.focus(); }
      opener = null;
    });
    document.body.appendChild(dialog);
    input = box.input; list = box.list; count = box.count;
    return box;
  }

  function show(from) {
    if (!dialog) { makeDialog(); }
    if (dialog.open) { input.focus(); return; }
    opener = from || document.activeElement;
    try { dialog.showModal(); } catch (e) { return; }
    input.focus();
    input.select();
    need(function () { draw({ input: input, list: list, count: count }, input.value); });
  }

  function typing(t) {
    return t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
  }

  function style() {
    var s = document.createElement('style');
    s.textContent =
      '.pb-search{width:min(640px,calc(100vw - 32px));max-width:none;max-height:min(80vh,720px);margin:10vh auto auto;padding:0;' +
        'border:1px solid var(--line-2,#D8DFDC);border-radius:var(--r-xl,12px);background:var(--surface,#fff);color:var(--ink,#0B1F1C);' +
        'box-shadow:0 24px 60px rgba(11,31,28,.22);overflow:hidden}' +
      '.pb-search::backdrop{background:rgba(11,31,28,.38)}' +
      '.pb-search-in{display:flex;flex-direction:column;max-height:min(80vh,720px);padding:18px 18px 8px}' +
      '[data-pb-search] .pb-search-in{max-height:none;padding:0}' +
      '.pb-search-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px}' +
      '.pb-search-label{font-size:15px;font-weight:600;color:var(--ink,#0B1F1C)}' +
      '.pb-search-close{min-height:44px;padding:0 14px;font:600 15px var(--font,sans-serif);color:var(--teal-700,#08655A);background:none;' +
        'border:1px solid var(--line-2,#D8DFDC);border-radius:999px;cursor:pointer}' +
      '.pb-search-close:hover{background:var(--teal-50,#E8F6F3)}' +
      '.pb-search-q{width:100%;min-height:52px;padding:12px 16px;font:400 17px var(--font,sans-serif);color:var(--ink,#0B1F1C);' +
        'background:var(--surface,#fff);border:1.5px solid var(--line-2,#D8DFDC);border-radius:10px;-webkit-appearance:none;appearance:none}' +
      '.pb-search-q:focus{outline:none;border-color:var(--teal,#0C8175);box-shadow:0 0 0 3px var(--ring,rgb(14,143,128))}' +
      '.pb-search-count{margin:10px 2px 6px;min-height:1.5em;font-size:14px;color:var(--ink-2,#54635F)}' +
      '.pb-search-list{margin:0;padding:0 0 10px;list-style:none;overflow-y:auto}' +
      '.pb-search-list li{margin:0;padding:0}' +
      '.pb-search-list .pb-sr{display:flex;flex-direction:column;gap:2px;margin:0;padding:12px 12px;border-radius:10px;color:var(--ink,#0B1F1C);text-decoration:none}' +
      '.pb-search-list .pb-sr:hover,.pb-search-list .pb-sr:focus-visible{background:var(--teal-50,#E8F6F3)}' +
      '.pb-search-list .pb-sr:focus-visible{outline:2px solid var(--teal,#0C8175);outline-offset:-2px}' +
      '.pb-sr-t{font-size:16px;font-weight:600;line-height:1.35;color:var(--ink,#0B1F1C)}' +
      '.pb-sr-k{font-size:13px;font-weight:600;line-height:1.4;color:var(--teal-700,#08655A)}' +
      '.pb-sr-d{font-size:14px;line-height:1.5;color:var(--ink-2,#54635F)}' +
      '@media(max-width:560px){.pb-search{margin-top:12px;max-height:calc(100dvh - 24px)}.pb-search-in{max-height:calc(100dvh - 24px);padding:14px 14px 6px}}';
    document.head.appendChild(s);
  }

  function boot() {
    var btns = document.querySelectorAll('.nav-search'), inline = document.querySelectorAll('[data-pb-search]');
    if (!window.HTMLDialogElement && !inline.length) { return; }
    style();
    [].forEach.call(btns, function (b) {
      if (!window.HTMLDialogElement) { return; }
      b.addEventListener('click', function () { show(b); });
      b.addEventListener('pointerenter', function () { need(function () {}); });
      b.addEventListener('focus', function () { need(function () {}); });
    });
    /* a box already in the page's markup (the 404 draws its own, so that it
       takes its place before this script arrives) is wired as it is; an
       empty host gets one */
    [].forEach.call(inline, function (host, n) {
      var box = { input: host.querySelector('.pb-search-q'), list: host.querySelector('.pb-search-list'), count: host.querySelector('.pb-search-count') };
      if (box.input && box.list && box.count) {
        keys(box);
      } else {
        box = field('pbSearchIn' + (n || ''));
        box.wrap.insertBefore(box.label, box.wrap.firstChild);
        box.wrap.appendChild(box.input);
        box.wrap.appendChild(box.count);
        box.wrap.appendChild(box.list);
        host.appendChild(box.wrap);
      }
      host.hidden = false;
      box.input.addEventListener('focus', function () { need(function () {}); });
    });
    if (btns.length && window.HTMLDialogElement) {
      document.addEventListener('keydown', function (e) {
        if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || (dialog && dialog.open)) { return; }
        e.preventDefault();
        show(document.querySelector('.nav-search'));
      });
    }
  }

  boot();
}());
