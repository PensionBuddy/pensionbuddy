/*
  Save as A (Run 37, item 5), on the pension calculator.

  "Save as A" keeps a copy of what the calculator shows now: its two headline
  figures, each with the label printed above it, and every control with the
  label beside it and the value the page shows for it. Change the sliders and
  the table sets A beside the same things now, a row marked where they
  differ. It is a copy, never a calculation: every figure in the table is
  read off the page, as the page wrote it, so this file does no maths and
  writes nothing the calculator owns. A lives in this page only: not stored,
  not sent, not in the address, gone when the page is.

  The page's figures roll to a new value over a few frames; A is taken once
  they have stopped. While the guess card still hides the figures
  (pb-guess.js), there is nothing to save yet, and the button says so in the
  saved report's own words.

  Loads at the end of the calculator's <main>; wires itself up once the page
  script has drawn the first figures. Without JavaScript the whole block is
  not drawn (html.pb-js).
*/
(function () {
  'use strict';

  var VEILED = 'Reveal the illustration first, then save it.';
  var SAVED = 'A is saved. Change the sliders to see it beside your figures now.';
  var CHANGED = 'changed';

  var a = null, raf = 0, results, box, rows, status, save, clear;

  function $(id) { return document.getElementById(id); }
  function text(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function shown(el) { return !!el && !el.closest('[hidden]') && el.getClientRects().length > 0; }

  /* what the page shows now: [label, value] pairs, headline figures first */
  function read() {
    var out = [];
    [].forEach.call(results.querySelectorAll('.res-hero .rl'), function (l) {
      var v = l.nextElementSibling;
      if (v && v.id) { out.push({ k: v.id, label: text(l), value: text(v), fig: true }); }
    });
    /* every control, folded under "More options" or not: each one moves the
       figures; never the guess card's own slider */
    [].forEach.call(document.querySelectorAll('.calc-wrap .panel input[type="range"]:not(#pbGuessRange)'), function (r) {
      var l = document.querySelector('label[for="' + r.id + '"]'), v = $(r.id + 'V');
      if (l && v) { out.push({ k: r.id, label: text(l), value: text(v) }); }
    });
    [].forEach.call(document.querySelectorAll('.calc-wrap .panel .seg'), function (seg) {
      var on = seg.querySelector('button.on'), f = seg.closest('.field'), l = f && f.querySelector('label');
      if (on && l) { out.push({ k: 'seg-' + text(l), label: text(l), value: text(on) }); }
    });
    return out;
  }

  function veiled() { return [].some.call(results.querySelectorAll('.pb-veiled'), shown); }

  /* the headline figures roll for a few frames after a change: wait until
     two frames in a row show the same thing */
  function settled(fn) {
    var last = null, same = 0, n = 0;
    (function tick() {
      var now = JSON.stringify(read());
      same = now === last ? same + 1 : 0;
      last = now;
      if (same >= 2 || ++n > 150) { fn(read()); } else { requestAnimationFrame(tick); }
    }());
  }

  function cell(tag, txt, cls) {
    var c = document.createElement(tag);
    if (cls) { c.className = cls; }
    c.appendChild(document.createTextNode(txt));
    return c;
  }

  function draw() {
    raf = 0;
    if (!a) { return; }
    var now = read(), byKey = {}, tr, th, td, i, row, was;
    a.forEach(function (r) { byKey[r.k] = r; });
    while (rows.firstChild) { rows.removeChild(rows.firstChild); }
    for (i = 0; i < now.length; i++) {
      row = now[i];
      was = byKey[row.k];
      tr = document.createElement('tr');
      if (row.fig) { tr.className = 'pb-ab-fig'; }
      th = cell('th', row.label);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      tr.appendChild(cell('td', was ? was.value : ''));
      td = cell('td', row.value);
      if (was && was.value !== row.value) {
        td.className = 'pb-ab-diff';
        td.appendChild(cell('span', ' (' + CHANGED + ')', 'pb-ab-sr'));
      }
      tr.appendChild(td);
      rows.appendChild(tr);
    }
  }

  function later() { if (a && !raf) { raf = requestAnimationFrame(draw); } }

  function boot() {
    results = document.querySelector('.calc-wrap .results');
    box = $('pbAbBox'); rows = $('pbAbRows'); status = $('pbAbSaid'); save = $('pbAbSave'); clear = $('pbAbClear');
    if (!results || !box || !rows || !save || !clear || !status) { return; }

    save.addEventListener('click', function () {
      if (veiled()) { status.textContent = VEILED; return; }
      settled(function (snap) {
        a = snap;
        box.hidden = false;
        draw();
        status.textContent = SAVED;
      });
    });
    clear.addEventListener('click', function () {
      a = null;
      box.hidden = true;
      while (rows.firstChild) { rows.removeChild(rows.firstChild); }
      status.textContent = '';
      save.focus();
    });

    /* follow the page: a control moved, a choice pressed, a figure rolled */
    document.addEventListener('input', later, true);
    document.addEventListener('change', later, true);
    document.addEventListener('click', later, true);
    if (window.MutationObserver) {
      var mo = new MutationObserver(later);
      [].forEach.call(results.querySelectorAll('.res-hero .big'), function (b) {
        mo.observe(b, { childList: true, characterData: true, subtree: true });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
