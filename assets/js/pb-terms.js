/*
  Jargon, explained where it is first used (Run 37, item 2).

  The first use of each jargon buster term on a page becomes a quiet button in
  the prose. Press it, tap it, or rest the pointer on it, and the buster's own
  first paragraph for that term opens beside it, with a link to the full entry.
  No word on the page changes: the button holds exactly the words that were
  there, and every word the definition shows comes out of window.PBGlossary,
  which tools/site-index.py writes from glossary.html. Nothing is stored and
  nothing is sent.

  WHERE, so a page never sprouts definitions in the wrong places
    - only <p> and <li> inside <main>, and only in running text: never in a
      heading, a link, a button, a label, a form, a calculator's panel or
      results ([data-pb-calc]), a live region, the hero's chat, the FAQ (Ask
      Buddy copies it), the family's own story (#story, #damian, #adam,
      #buddy: locked copy), or anything PBMotion counts as a caveat
    - one definition per term per page, at its first use there; not at all on
      a page whose <h1> names the term (the page is about it), and not for a
      term the page's jargon chips already explain (pb-jargon-chips.js)
    - a name matches in any case, an initialism only in capitals; either may
      take a plural "s"

  HOW IT BEHAVES
    - the definition is a popover in the top layer, so nothing clips it and
      nothing on the page moves; it sits straight after its button in the
      document, so the link inside is the next thing Tab reaches
    - a click, a tap, Enter or Space opens it and keeps it open; the same
      again closes it; so do Escape (focus goes back to the button), a press
      anywhere else, and focus moving on past it
    - with a mouse, resting on the term for a moment opens it too, and it
      closes when the pointer has left both the term and the definition
    - nothing animates
    - a browser without popovers gets the page exactly as written, with the
      glossary links it already has

  Loads late (type="text/pb-late"), after assets/js/pb-glossary.js or before
  it: whichever of the two arrives second starts this.
*/
(function () {
  'use strict';

  var SKIP = 'a,button,label,summary,select,textarea,input,output,form,h1,h2,h3,h4,h5,h6,figcaption,caption,' +
    'nav,footer,header.hero,[hidden],[aria-hidden="true"],[aria-live],[role="status"],[role="alert"],' +
    '[data-pb-calc],.msg,.hint,.faq-list,.pb-b-panel,.pb-chip,.pb-def,.pb-term,.pb-term-pop,' +
    '#story,#damian,#adam,#buddy,.pb-changed,.pb-noterms';
  var LINK = 'See it in the jargon buster';
  var HOW = 'What this means';
  var HOVER_OPEN = 350, HOVER_CLOSE = 250;

  var started = false, seq = 0;
  var open = null;          /* { btn, pop, pinned } */
  var tOpen = 0, tClose = 0;
  var hoverable = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function skipSel() {
    var c = window.PBMotion && window.PBMotion.CAVEATS;
    return c ? SKIP + ',' + c : SKIP;
  }

  function matcher(pat, cs) {
    return new RegExp('(^|[^A-Za-z0-9-])(' + esc(pat) + 's?)(?![A-Za-z0-9-])', cs ? '' : 'i');
  }

  /* the terms this page can use: not the page's own subject, not one a
     jargon chip already explains */
  function candidates(list, main) {
    var h1 = document.querySelector('h1');
    var head = h1 ? h1.textContent : '';
    var chipped = [].map.call(main.querySelectorAll('.pb-def > b'), function (b) { return b.textContent; });
    var out = [], i, j, e, pats, ok;
    for (i = 0; i < list.length; i++) {
      e = list[i];
      if (!e || !e.tip || !e.def || !e.pats || !e.pats.length) { continue; }
      pats = [];
      ok = true;
      for (j = 0; j < e.pats.length; j++) {
        pats.push({ re: matcher(e.pats[j][0], e.pats[j][1]), len: e.pats[j][0].length });
      }
      for (j = 0; j < pats.length && ok; j++) {
        if (pats[j].re.test(head)) { ok = false; }
        [].forEach.call(chipped, function (c) { if (pats[j].re.test(c)) { ok = false; } });
      }
      if (ok) { out.push({ e: e, pats: pats }); }
    }
    return out;
  }

  function textNodes(block, skip) {
    var out = [], walk, n, p, bad;
    walk = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
    while ((n = walk.nextNode())) {
      if (!n.nodeValue || !/\S/.test(n.nodeValue)) { continue; }
      p = n.parentNode;
      bad = false;
      while (p && p !== block) {
        if (p.nodeType === 1 && p.matches(skip)) { bad = true; break; }
        p = p.parentNode;
      }
      if (!bad) { out.push(n); }
    }
    return out;
  }

  /* the earliest use of any remaining term in one run of text; on a tie the
     longer phrasing */
  function earliest(s, terms) {
    var best = null, i, j, m;
    for (i = 0; i < terms.length; i++) {
      for (j = 0; j < terms[i].pats.length; j++) {
        m = terms[i].pats[j].re.exec(s);
        if (!m) { continue; }
        if (!best || m.index + m[1].length < best.at || (m.index + m[1].length === best.at && m[2].length > best.word.length)) {
          best = { at: m.index + m[1].length, word: m[2], t: i };
        }
      }
    }
    return best;
  }

  function wrap(node, hit, entry) {
    var btn = document.createElement('button');
    var rest = node.splitText(hit.at);
    rest.nodeValue = rest.nodeValue.slice(hit.word.length);
    btn.type = 'button';
    btn.className = 'pb-term';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-describedby', 'pbTermHow');
    btn.setAttribute('data-pb-term', entry.id);
    btn.appendChild(document.createTextNode(hit.word));
    rest.parentNode.insertBefore(btn, rest);
    return rest;
  }

  /* ---- the definition ---- */
  function popFor(btn) {
    var id = btn.getAttribute('aria-controls'), pop, e, b, d, a, i, list = window.PBGlossary;
    if (id && document.getElementById(id)) { return document.getElementById(id); }
    for (i = 0; i < list.length; i++) { if (list[i].id === btn.getAttribute('data-pb-term')) { e = list[i]; } }
    if (!e) { return null; }
    seq += 1;
    pop = document.createElement('span');
    pop.className = 'pb-term-pop';
    pop.id = 'pbTermPop-' + seq;
    pop.setAttribute('popover', 'manual');
    b = document.createElement('b');
    b.className = 'pb-term-name';
    b.appendChild(document.createTextNode(e.name));
    d = document.createElement('span');
    d.className = 'pb-term-def';
    d.appendChild(document.createTextNode(e.def));
    a = document.createElement('a');
    a.className = 'pb-term-more';
    a.href = 'glossary.html#' + e.id;
    a.appendChild(document.createTextNode(LINK));
    pop.appendChild(b);
    pop.appendChild(d);
    pop.appendChild(a);
    btn.parentNode.insertBefore(pop, btn.nextSibling);
    btn.setAttribute('aria-controls', pop.id);
    pop.addEventListener('mouseenter', function () { clearTimeout(tClose); });
    pop.addEventListener('mouseleave', function () { if (open && open.pop === pop && !open.pinned) { later(); } });
    return pop;
  }

  function place() {
    if (!open) { return; }
    var r = open.btn.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var pop = open.pop, w = pop.offsetWidth, h = pop.offsetHeight, left, top;
    if (r.bottom < 0 || r.top > vh || (!r.width && !r.height)) { shut(false); return; }
    left = Math.max(16, Math.min(r.left, vw - 16 - w));
    top = r.bottom + 8;
    if (top + h > vh - 16 && r.top - 8 - h >= 16) { top = r.top - 8 - h; }
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  }

  function show(btn, pinned) {
    var pop;
    clearTimeout(tOpen);
    clearTimeout(tClose);
    if (open && open.btn === btn) { open.pinned = open.pinned || pinned; return; }
    shut(false);
    pop = popFor(btn);
    if (!pop) { return; }
    try { pop.showPopover(); } catch (e) { return; }
    open = { btn: btn, pop: pop, pinned: pinned };
    btn.setAttribute('aria-expanded', 'true');
    place();
  }

  function shut(refocus) {
    var was = open;
    clearTimeout(tOpen);
    clearTimeout(tClose);
    if (!was) { return; }
    open = null;
    was.btn.setAttribute('aria-expanded', 'false');
    try { was.pop.hidePopover(); } catch (e) { /* already closed */ }
    if (refocus) { was.btn.focus(); }
  }

  function later() {
    clearTimeout(tClose);
    tClose = setTimeout(function () { if (open && !open.pinned) { shut(false); } }, HOVER_CLOSE);
  }

  function inside(node) {
    return !!(open && node && (open.btn.contains(node) || open.pop.contains(node)));
  }

  function listen() {
    document.addEventListener('click', function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest('.pb-term') : null;
      if (!btn) { return; }
      ev.preventDefault();
      if (open && open.btn === btn && open.pinned) { shut(false); } else { show(btn, true); }
    });
    document.addEventListener('pointerdown', function (ev) {
      if (open && !inside(ev.target)) { shut(false); }
    }, true);
    document.addEventListener('focusin', function (ev) {
      if (open && !inside(ev.target)) { shut(false); }
    });
    /* capture, like the jargon chips: the mobile drawer and Ask Buddy own
       Escape while they are open, and both close themselves on it */
    document.addEventListener('keydown', function (ev) {
      var nl, bp;
      if (!open || (ev.key !== 'Escape' && ev.key !== 'Esc')) { return; }
      nl = document.getElementById('navLinks');
      bp = document.getElementById('pbBuddyPanel');
      if ((nl && nl.classList.contains('open')) || (bp && !bp.hidden)) { return; }
      shut(inside(document.activeElement));
    }, true);
    if (hoverable) {
      document.addEventListener('mouseover', function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest('.pb-term') : null;
        if (!btn) { return; }
        clearTimeout(tClose);
        if (open && open.btn === btn) { return; }
        clearTimeout(tOpen);
        tOpen = setTimeout(function () { show(btn, false); }, HOVER_OPEN);
      });
      document.addEventListener('mouseout', function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest('.pb-term') : null;
        if (!btn || (ev.relatedTarget && btn.contains(ev.relatedTarget))) { return; }
        clearTimeout(tOpen);
        if (open && open.btn === btn && !open.pinned) { later(); }
      });
    }
    window.addEventListener('scroll', function () { if (open) { place(); } }, { passive: true });
    window.addEventListener('resize', function () { if (open) { place(); } });
  }

  function style() {
    var s = document.createElement('style');
    s.textContent =
      /* a button is an atomic inline box whatever its display, so nothing
         here may make it taller than the line: no padding, no border; the
         underline is the text's own */
      '.pb-term{display:inline;height:auto;margin:0;padding:0;min-width:0;min-height:0;font:inherit;line-height:inherit;letter-spacing:inherit;' +
        'text-align:inherit;vertical-align:baseline;color:var(--teal-700,#08655A);background:none;border:0;border-radius:0;cursor:pointer;' +
        'text-decoration:underline dashed;text-decoration-thickness:1.5px;text-underline-offset:3px}' +
      '.pb-term:hover,.pb-term[aria-expanded="true"]{text-decoration-style:solid}' +
      '.pb-term:focus-visible{outline:2px solid var(--teal,#0C8175);outline-offset:2px;border-radius:2px}' +
      '.pb-term-pop{position:fixed;inset:auto;margin:0;box-sizing:border-box;width:max-content;max-width:min(340px,calc(100vw - 32px));' +
        'padding:14px 16px 6px;border:1px solid var(--line-2,#D8DFDC);border-radius:var(--r-lg,10px);background:var(--surface,#fff);' +
        'color:var(--ink-2,#54635F);box-shadow:0 10px 30px rgba(11,31,28,.14);font:400 15px/1.55 var(--font,sans-serif);letter-spacing:0;text-align:left;white-space:normal}' +
      '.pb-term-pop:not(:popover-open){display:none}' +
      '.pb-term-name{display:block;margin:0 0 4px;color:var(--ink,#0B1F1C);font-weight:700}' +
      '.pb-term-def{display:block}' +
      '#main .pb-term-pop .pb-term-more{display:inline-flex;align-items:center;min-height:44px;margin:0;padding:0;font-weight:600;' +
        'color:var(--teal-700,#08655A);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}' +
      '#main .pb-term-pop .pb-term-more:hover{text-decoration-thickness:2px}' +
      '#main .pb-term-pop .pb-term-more:focus-visible{outline:2px solid var(--teal,#0C8175);outline-offset:2px;border-radius:2px}' +
      '.pb-term-how{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}';
    document.head.appendChild(s);
  }

  function boot() {
    var list = window.PBGlossary, main = document.getElementById('main');
    var terms, skip, blocks, i, j, nodes, node, hit, how;
    if (started || !list || !list.length || !main || !main.querySelectorAll || !document.createTreeWalker) { return; }
    started = true;
    if (typeof HTMLElement === 'undefined' || !HTMLElement.prototype.hasOwnProperty('popover')) { return; }
    if (document.querySelector('.pb-term')) { return; }
    terms = candidates(list, main);
    if (!terms.length) { return; }
    skip = skipSel();
    blocks = main.querySelectorAll('p, li');
    for (i = 0; i < blocks.length && terms.length; i++) {
      if (blocks[i].closest(skip)) { continue; }
      nodes = textNodes(blocks[i], skip);
      for (j = 0; j < nodes.length && terms.length; j++) {
        node = nodes[j];
        while (node && terms.length && (hit = earliest(node.nodeValue, terms))) {
          node = wrap(node, hit, terms[hit.t].e);
          terms.splice(hit.t, 1);
        }
      }
    }
    if (!document.querySelector('.pb-term')) { return; }
    how = document.createElement('span');
    how.id = 'pbTermHow';
    how.className = 'pb-term-how';
    how.appendChild(document.createTextNode(HOW));
    document.body.appendChild(how);
    style();
    listen();
  }

  window.PBTermsBoot = boot;
  boot();
}());
