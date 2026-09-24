/*
  Paw prints: one badge for each Pensionbuddy tool a reader has tried.

  Four things can be earned, and each is earned by doing the thing rather than
  by handing anything over:

      run          finishing a go at Buddy's Run
      battle       finishing a round of Jargon Battle
      calculator   moving a slider on any one of the five calculators
      trace        ticking all three boxes of the self-check on tracker.html

  WHAT THIS FILE TOUCHES, and nothing else. It reads and writes one
  localStorage key, it paints the elements that carry data-pb-badges, it
  injects one <style> into the head the first time it paints, and it listens.
  It works nothing out, states no figure, and never writes to a cell any
  calculator owns. Every calculation function, every module in assets/js/ and
  every disclaimer on every page is untouched by it, which is why the node
  render-diff harness sees exactly zero difference: that harness loads a page
  script and its named modules, and this file is neither.

  ONE KEY, 'pb.badges', holding { badges: [...], ticks: [...] }. The tick
  state lives in the same record as the badges because it is the same kind of
  thing, a note about what this device has done, and because two keys is two
  chances for half of it to survive. Every read and every write is in a
  try/catch and falls back to memory: a private window, a browser with storage
  blocked and the headless probes all keep working, they simply forget.
  Unknown ids are dropped on read, so a future rename cannot resurrect a badge
  nothing can show.

  THE CALCULATOR BADGE IS GATED ON e.isTrusted AND ON .panel. Both gates are
  load bearing. The More options fold on these pages re-dispatches a synthetic
  input event on every slider it moved the first time it opens, so without
  isTrusted merely opening the fold would earn the badge; and the guess card
  puts a real range input inside .results, so without the .panel scope a drag
  of the guess slider would earn it without the reader touching a control that
  drives a figure. Both are checked in the listener, not in a test.

  NO LINK, ANYWHERE (Run 21). The strip once ended, at 4/4, on a link to
  book a call; the gamification check took it out, so collecting every paw
  earns a line of text and nothing else. The games get no strip either: both
  run inside iframe#arcFrame on glossary.html, where an anchor with no target
  would navigate the frame instead of the page. Nothing in this file builds
  an anchor now. The static checks in tests/games.test.py read the shipped
  file text and would not see a link injected at runtime, so the rule cannot
  live there.

  HOW THE TWO GAMES ARE HOOKED WITHOUT ENTERING THE GAME. Neither game
  publishes an "it ended" callback, and wrapping the exposed API would put
  badge code inside the surface those tests cover. So a MutationObserver
  watches the end overlay's hidden attribute, and the badge is awarded the
  moment the overlay becomes visible. Any finished go counts, won or lost: a
  badge only a winner can reach rewards the outcome rather than the visit.

  HOW THE HUB KEEPS UP. glossary.html hosts the games in a frame. The frame is
  a separate same-origin document, so its write raises a storage event in the
  parent, and the parent repaints on that plus on a click of #arcClose.

  Classic script, nothing declared at top level, every lookup guarded, silent
  return when an element is absent. It loads last on every page that carries
  it, after the page's own script and after every other addition.
*/
(function () {
  'use strict';

  var KEY = 'pb.badges';

  var HEAD = 'Your paw prints';
  var LEAD = 'One for each thing you have tried.';
  var YES = 'Earned';
  var NO = 'Not yet';
  var DONE = '4/4 paws.';

  /* the fixed set, in the order the strip prints them */
  var ORDER = ['run', 'battle', 'calculator', 'trace'];
  var NAMES = {
    run: 'Runner Paw',
    battle: 'Buster Paw',
    calculator: 'Cruncher Paw',
    trace: 'Tracker Paw'
  };

  /* the glossary paw, copied shape for shape from the .paw-bg decoration on
     that page. Fill and stroke are left to the stylesheet below. */
  var PAW = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
    + '<ellipse cx="8" cy="7.5" rx="1.9" ry="2.7"/>'
    + '<ellipse cx="16" cy="7.5" rx="1.9" ry="2.7"/>'
    + '<ellipse cx="4.5" cy="11.5" rx="1.7" ry="2.3"/>'
    + '<ellipse cx="19.5" cy="11.5" rx="1.7" ry="2.3"/>'
    + '<path d="M12 12.5c-3 0-5.2 2.1-5.2 4.7 0 2.2 2.3 2.8 5.2 2.8s5.2-.6'
    + ' 5.2-2.8c0-2.6-2.2-4.7-5.2-4.7z"/>'
    + '</svg>';

  /* nothing here is fixed width, because tools/verify.py fails, rather than
     warns, on any horizontal overflow at 375. The grid falls to one column on
     its own and the slot stacks under 480. */
  var CSS = ''
    + '.pb-badges{margin-top:20px}'
    + '.pb-badges h3{margin-bottom:6px}'
    + '.pb-badges .pb-lead{font-size:13.5px;color:var(--ink-2,#54635F);'
    + 'margin-bottom:14px;line-height:1.5}'
    + '.pb-badge-list{list-style:none;margin:0;padding:0;display:grid;'
    + 'grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));'
    + 'gap:10px}'
    + '.pb-badge{display:flex;align-items:center;gap:10px;min-width:0;'
    + 'padding:12px 14px;border:1px solid var(--line,#E7EBE9);'
    + 'border-radius:var(--r-lg,10px);background:var(--surface,#fff)}'
    + '.pb-badge .pb-paw{width:24px;height:24px;flex:0 0 auto;display:block}'
    + '.pb-badge .pb-paw svg{width:100%;height:100%;display:block;fill:none;'
    + 'stroke:var(--line-2,#D8DFDC);stroke-width:1.5}'
    + '.pb-badge-on .pb-paw svg{fill:var(--aqua);stroke:none}'
    + '.pb-badge .pb-name{font-size:14px;font-weight:600;min-width:0;'
    + 'overflow-wrap:break-word}'
    + '.pb-badge .pb-state{margin-left:auto;font-size:12px;font-weight:600;'
    + 'white-space:nowrap;color:var(--ink-2,#54635F)}'
    + '.pb-badge-on .pb-state{color:var(--teal-700,#08655A)}'
    + '.pb-badges .pb-done{margin-top:14px;font-size:14px;font-weight:600}'
    + '.pb-trace{margin-top:30px}'
    + '.pb-trace h3{margin-bottom:8px}'
    + '.pb-trace .pb-badges{margin-top:22px}'
    + '.pb-trace .pb-tick{display:flex;align-items:flex-start;gap:12px;'
    + 'padding:12px 0;border-bottom:1px solid var(--line,#E7EBE9);'
    + 'font-size:15px;cursor:pointer}'
    + '.pb-trace .pb-tick input{width:24px;height:24px;flex:0 0 auto;'
    + 'margin-top:0;accent-color:var(--teal,#0C8175)}'
    + '.pb-paw-note{margin-top:.6em;font-size:.82em;font-weight:600;'
    + 'color:var(--teal-700,#08655A)}'
    + '@media(max-width:480px){.pb-badge{flex-wrap:wrap}}'
    + '.pb-badge-new .pb-paw{animation:pbPawIn .18s ease-out both}'
    + '@keyframes pbPawIn{from{opacity:0;transform:scale(.8)}'
    + 'to{opacity:1;transform:none}}'
    + '@media(prefers-reduced-motion:reduce){'
    + '.pb-badge-new .pb-paw{animation:none}}';

  /* ------------------------------------------------------------------
     THE RECORD. memory is the fallback and also the working copy, so a
     blocked localStorage changes nothing except whether it survives the
     tab being closed.
     ------------------------------------------------------------------ */
  var memory = { badges: [], ticks: [] };
  var loaded = false;
  var fresh = null;          /* the id awarded on this paint, for the fade */

  function clean(list) {
    var out = [], i;
    if (!list || !list.length) { return out; }
    for (i = 0; i < list.length; i++) {
      if (typeof list[i] === 'string' && out.indexOf(list[i]) === -1) {
        out.push(list[i]);
      }
    }
    return out;
  }

  function load() {
    var raw = null, parsed;
    if (loaded) { return memory; }
    loaded = true;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) { return memory; }
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    if (!parsed || typeof parsed !== 'object') { return memory; }
    memory.badges = clean(parsed.badges).filter(function (id) {
      return ORDER.indexOf(id) !== -1;
    });
    memory.ticks = clean(parsed.ticks);
    return memory;
  }

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({
        badges: memory.badges, ticks: memory.ticks
      }));
    } catch (e) { /* memory only, and that is a complete answer */ }
  }

  function has(id) {
    return load().badges.indexOf(id) !== -1;
  }

  function all() {
    var held = load().badges;
    return ORDER.filter(function (id) { return held.indexOf(id) !== -1; });
  }

  function award(id) {
    if (ORDER.indexOf(id) === -1 || has(id)) { return false; }
    memory.badges.push(id);
    save();
    fresh = id;
    paint();
    fresh = null;
    return true;
  }

  /* ------------------------------------------------------------------
     PAINTING
     ------------------------------------------------------------------ */
  function styles() {
    var st;
    if (!document.head) { return; }
    if (document.querySelector('style[data-pb-badges-css]')) { return; }
    st = document.createElement('style');
    st.setAttribute('data-pb-badges-css', '');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function span(cls, text) {
    var el = document.createElement('span');
    el.className = cls;
    el.textContent = text;
    return el;
  }

  function slot(id) {
    var li = document.createElement('li'), paw = document.createElement('span');
    li.className = 'pb-badge' + (has(id) ? ' pb-badge-on' : '');
    if (fresh === id) { li.className += ' pb-badge-new'; }
    paw.className = 'pb-paw';
    paw.innerHTML = PAW;
    li.appendChild(paw);
    li.appendChild(span('pb-name', NAMES[id]));
    li.appendChild(span('pb-state', has(id) ? YES : NO));
    return li;
  }

  /* The strip. This is the ONLY branch that ever builds an anchor, and it is
     unreachable from a 'note' mount: render() returns above it. */
  function strip(mount) {
    var h = document.createElement('h3'), lead = document.createElement('p'),
      list = document.createElement('ul'), done, i;
    mount.textContent = '';
    h.textContent = HEAD;
    lead.className = 'pb-lead';
    lead.textContent = LEAD;
    list.className = 'pb-badge-list';
    for (i = 0; i < ORDER.length; i++) { list.appendChild(slot(ORDER[i])); }
    mount.appendChild(h);
    mount.appendChild(lead);
    mount.appendChild(list);
    if (all().length !== ORDER.length) { return; }
    /* all four: one line of text, and nothing else. Collecting every paw
       is not rewarded with a call to book (Run 21: the booking link that
       used to follow "4/4 paws." came out after the gamification check) */
    done = document.createElement('p');
    done.className = 'pb-done';
    done.textContent = DONE;
    mount.appendChild(done);
  }

  /* The note. One line inside a game's end panel, already written into the
     page; all this does is let it through once the badge is held. No markup
     is built here, so nothing can be linked. */
  function note(mount) {
    var id = document.getElementById('ovOver') ? 'run'
      : (document.getElementById('endPanel') ? 'battle' : null);
    if (!id || !has(id)) { return; }
    mount.removeAttribute('hidden');
  }

  function render(mount) {
    var view;
    if (!mount || !mount.getAttribute) { return; }
    view = mount.getAttribute('data-pb-badges');
    styles();
    if (view === 'note') { note(mount); return; }
    if (view === 'strip') { strip(mount); }
  }

  function paint() {
    var mounts, i;
    try { mounts = document.querySelectorAll('[data-pb-badges]'); }
    catch (e) { return; }
    for (i = 0; i < mounts.length; i++) { render(mounts[i]); }
  }

  /* ------------------------------------------------------------------
     THE TRIGGERS
     ------------------------------------------------------------------ */

  /* A slider on a calculator. Delegated once, in the capture phase, so it
     does not depend on where the fold has moved the field to. isTrusted keeps
     the page's own synthetic events out, .panel keeps the guess card's slider
     out, and the listener takes itself off as soon as it has fired. */
  function watchSliders() {
    function onInput(e) {
      var t = e && e.target;
      if (!e.isTrusted || !t || t.type !== 'range') { return; }
      if (!t.closest || !t.closest('.panel')) { return; }
      document.removeEventListener('input', onInput, true);
      award('calculator');
    }
    if (has('calculator')) { return; }
    document.addEventListener('input', onInput, true);
  }

  /* A game's end overlay becoming visible. */
  function watchPanel(id, badge) {
    var el = document.getElementById(id), ob;
    if (!el || has(badge)) { return; }
    if (!el.hidden) { award(badge); return; }
    if (!window.MutationObserver) { return; }
    ob = new window.MutationObserver(function () {
      if (el.hidden) { return; }
      ob.disconnect();
      award(badge);
    });
    ob.observe(el, { attributes: true, attributeFilter: ['hidden'] });
  }

  /* The three ticks on tracker.html. The ticks are remembered so the page
     comes back the way it was left; unticking never takes the badge away,
     because the reader did the thinking either way. */
  function watchTicks(mount) {
    var box = mount.closest ? mount.closest('.pb-trace') : null, boxes, i;
    if (!box) { return; }
    boxes = box.querySelectorAll('input[type=checkbox]');
    if (!boxes.length) { return; }

    function sync() {
      var held = [], every = true, j, b;
      for (j = 0; j < boxes.length; j++) {
        b = boxes[j];
        if (b.checked) { held.push(b.id); } else { every = false; }
      }
      memory.ticks = held;
      save();
      if (every) { award('trace'); }
    }

    load();
    for (i = 0; i < boxes.length; i++) {
      if (memory.ticks.indexOf(boxes[i].id) !== -1) { boxes[i].checked = true; }
      boxes[i].addEventListener('change', sync);
    }
  }

  function triggers() {
    var mounts, i, job;
    watchPanel('ovOver', 'run');
    watchPanel('endPanel', 'battle');
    try { mounts = document.querySelectorAll('[data-pb-award]'); }
    catch (e) { return; }
    for (i = 0; i < mounts.length; i++) {
      job = mounts[i].getAttribute('data-pb-award');
      if (job === 'slider') { watchSliders(); }
      if (job === 'ticks') { watchTicks(mounts[i]); }
    }
  }

  /* The hub on glossary.html shows the strip beside the two game cards, and
     the games write from inside iframe#arcFrame. A same-origin frame's write
     raises storage in the parent, and closing the frame is the other moment
     the reader looks back at the strip. */
  function listen() {
    var shut = document.getElementById('arcClose');
    window.addEventListener('storage', function (e) {
      if (e && e.key && e.key !== KEY) { return; }
      loaded = false;
      load();
      paint();
    });
    if (shut) { shut.addEventListener('click', function () { paint(); }); }
  }

  function boot() {
    load();
    paint();
    triggers();
    listen();
  }

  /* The one name this file puts on window. A later feature can ask what is
     held without going near the key or the markup. */
  window.PBBadges = {
    award: award,
    has: has,
    all: all,
    render: render
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
