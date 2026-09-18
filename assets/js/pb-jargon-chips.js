/*
  Jargon chips for the three "who we help" pages.

  A term the Jargon Battle already defines becomes a small button in the prose.
  Press it and the game's own one-line answer opens underneath the paragraph,
  with a link on to the jargon buster. No new copy is written here: every word
  a chip shows comes out of window.PBJargonBank, which is why this file has to
  load after assets/js/pb-jargon-bank.js.

  RULES, so the page never sprouts chips nobody asked for
    - only <p> and <li> inside <main>; headings are never scanned
    - never inside a, button, summary, .msg, .note, .hint, .disclosure,
      .infoadvice, .credline, .pb-b-panel, or an existing chip
    - the bank's SHORT form only (the words before any parenthetical), plus a
      simple plural; longest term first, case-insensitive, word boundaries
    - one chip per paragraph, one paragraph per term, six per page
    - no alias table. If the page does not use the bank's own wording, it gets
      no chip, and that is the honest answer.

  An existing <a class="gref"> whose glossary anchor is one of the two the bank
  also covers is upgraded in place instead of being left as a link: same words,
  same href kept on the element, but it opens the definition rather than
  navigating, and the definition carries the link on. One word, one affordance.

  Load it LAST on the page. Ask Buddy clones the FAQ markup into a panel of its
  own when it runs, so chips made before that would be cloned with it and their
  ids would appear twice.

  Classic script, no build step, no storage, no network. It returns quietly if
  the bank or <main> is absent.
*/
(function () {
  'use strict';

  var CAP = 6;
  var SKIP = 'a,button,summary,.msg,.note,.hint,.disclosure,.infoadvice,.credline,.pb-b-panel,.pb-chip,.pb-def';
  var INNER = 'a,button,.pb-chip,.pb-def';

  /* glossary anchor -> the bank term that says the same thing. Two entries,
     both checked by hand. A gref whose fragment is not in this map stays a
     plain link; today that is #corporation-tax-relief on director.html. */
  var GREF = {
    'tax-relief': 'Tax relief',
    'employer-contribution': 'Employer contribution'
  };

  /* The link under a definition. A chip upgraded from a glossary link keeps
     that link's anchor and can promise the entry; a chip made from the bank
     alone links to the jargon buster as a whole, which has no entry for
     several bank terms (auto-enrolment and PRSI among them), so its wording
     promises only the page. */
  var LINK = 'See it in the jargon buster';
  var LINK_ALL = 'See the full jargon buster';
  var TITLE = 'What this means';

  var seq = 0;
  var openBtn = null;
  var openDef = null;

  function esc(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function shortForm(term) {
    return String(term || '').replace(/\s*\(.*$/, '').trim();
  }

  function rx(term) {
    return new RegExp('(^|[^A-Za-z0-9-])(' + esc(term) + 's?)(?![A-Za-z0-9-])', 'i');
  }

  function terms(bank) {
    var list = [], i, s;
    for (i = 0; i < bank.length; i++) {
      s = shortForm(bank[i] && bank[i].term);
      if (!s || !bank[i].correct) { continue; }
      list.push({ key: s.toLowerCase(), short: s, entry: bank[i], re: rx(s) });
    }
    list.sort(function (a, b) { return b.short.length - a.short.length; });
    return list;
  }

  function skipped(el) {
    return !!(el && el.closest && el.closest(SKIP));
  }

  function textNodes(block) {
    var out = [], walk, n, p, bad;
    if (!document.createTreeWalker) { return out; }
    walk = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
    while ((n = walk.nextNode())) {
      if (!n.nodeValue || !n.nodeValue.replace(/\s/g, '')) { continue; }
      p = n.parentNode;
      bad = false;
      while (p && p !== block) {
        if (p.nodeType === 1 && p.matches && p.matches(INNER)) { bad = true; break; }
        p = p.parentNode;
      }
      if (!bad) { out.push(n); }
    }
    return out;
  }

  /* ---- the definition panel: the bank's line, nothing added ---- */
  function makeDef(item, href) {
    var def = document.createElement('span');
    var b = document.createElement('b');
    var a = document.createElement('a');
    seq += 1;
    def.className = 'pb-def';
    def.id = 'pb-def-' + seq;
    def.setAttribute('role', 'note');
    def.hidden = true;
    b.appendChild(document.createTextNode(item.short));
    def.appendChild(b);
    def.appendChild(document.createTextNode(' ' + item.entry.correct + ' '));
    a.href = href || 'glossary.html';
    a.appendChild(document.createTextNode(href ? LINK : LINK_ALL));
    def.appendChild(a);
    return def;
  }

  function close() {
    if (!openBtn || !openDef) { openBtn = null; openDef = null; return; }
    openDef.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn = null;
    openDef = null;
  }

  function open(btn, def) {
    close();
    def.hidden = false;
    def.classList.add('pb-opening');
    /* one forced reflow, so the transition has a start point to run from */
    if (def.offsetWidth >= 0) { def.classList.remove('pb-opening'); }
    btn.setAttribute('aria-expanded', 'true');
    openBtn = btn;
    openDef = def;
  }

  function wire(btn, def) {
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', def.id);
    btn.setAttribute('title', TITLE);
    btn.addEventListener('click', function (e) {
      if (e && e.preventDefault) { e.preventDefault(); }
      if (openBtn === btn) { close(); } else { open(btn, def); }
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (openBtn === btn) { close(); } else { open(btn, def); }
      }
    });
  }

  /* ---- an existing glossary link, given the chip's behaviour in place ---- */
  function upgrade(link, item, block) {
    var def = makeDef(item, link.getAttribute('href'));
    link.classList.add('pb-chip');
    link.setAttribute('role', 'button');
    block.appendChild(def);
    wire(link, def);
  }

  /* ---- a plain run of words, wrapped in a button ---- */
  function chip(node, m, item, block) {
    var btn = document.createElement('button');
    var rest = node.splitText(m.index + m[1].length);
    var def;
    if (!rest.parentNode) { return false; }
    rest.nodeValue = rest.nodeValue.slice(m[2].length);
    btn.type = 'button';
    btn.className = 'pb-chip';
    btn.appendChild(document.createTextNode(m[2]));
    rest.parentNode.insertBefore(btn, rest);
    def = makeDef(item, null);
    block.appendChild(def);
    wire(btn, def);
    return true;
  }

  function boot() {
    /* Run once per page. If a chip is already here the script has been
       included twice, and a second pass would mint pb-def-1 again. Same
       shape as the Ask Buddy block's own guard. */
    if (document.querySelector && document.querySelector('.pb-chip')) { return; }

    var main = document.getElementById('main');
    var bank = window.PBJargonBank;
    var list, blocks, made, i, j, k, block, links, href, frag, item, nodes, hit, m;

    if (!main || !bank || !bank.length || !main.querySelectorAll) { return; }
    list = terms(bank);
    if (!list.length) { return; }

    blocks = main.querySelectorAll('p, li');
    made = 0;

    for (i = 0; i < blocks.length && made < CAP; i++) {
      block = blocks[i];
      if (skipped(block)) { continue; }

      /* 1. an existing glossary link this block already owns */
      hit = null;
      links = block.querySelectorAll('a.gref');
      for (j = 0; j < links.length && !hit; j++) {
        href = links[j].getAttribute('href') || '';
        frag = href.indexOf('#') > -1 ? href.slice(href.indexOf('#') + 1) : '';
        if (!frag || !GREF.hasOwnProperty(frag)) { continue; }
        for (k = 0; k < list.length; k++) {
          if (list[k].short === GREF[frag]) {
            upgrade(links[j], list[k], block);
            list.splice(k, 1);
            made += 1;
            hit = links[j];
            break;
          }
        }
      }
      if (hit) { continue; }

      /* 2. otherwise the first bank term written out in the prose */
      nodes = textNodes(block);
      for (j = 0; j < nodes.length && !hit; j++) {
        for (k = 0; k < list.length; k++) {
          item = list[k];
          m = item.re.exec(nodes[j].nodeValue);
          if (!m) { continue; }
          if (!chip(nodes[j], m, item, block)) { break; }
          list.splice(k, 1);
          made += 1;
          hit = nodes[j];
          break;
        }
      }
    }

    if (!made) { return; }

    /* Escape closes the open chip, but only when it is the thing in front.
       The mobile drawer and the Ask Buddy panel each own Escape while they
       are open, and both move focus when they close.

       This listens in the CAPTURE phase deliberately. Both of those handlers
       were registered before this script ran, and both close on Escape, so a
       bubble-phase listener here would be asked "is the drawer open?" after
       the drawer had already closed itself and would wrongly take the key as
       its own. Capture asks the question while the answer is still true. */
    document.addEventListener('keydown', function (e) {
      var nl, bp, btn;
      if (e.key !== 'Escape' && e.key !== 'Esc') { return; }
      if (!openBtn) { return; }
      nl = document.getElementById('navLinks');
      if (nl && nl.classList && nl.classList.contains('open')) { return; }
      bp = document.getElementById('pbBuddyPanel');
      if (bp && !bp.hidden) { return; }
      btn = openBtn;
      close();
      if (btn.focus) { btn.focus(); }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
