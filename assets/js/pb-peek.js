/* The results peek bar: the page's headline figure, pinned to the bottom of
   a phone screen while the reader is working the inputs.

   WHY. Measured at 375px, every calculator's headline figure sits 1,000 to
   1,600px below its first slider (pension 1,160; director 1,150; compare
   1,430; reality check 1,010; entitlement 1,600) on an 812px screen, so a
   reader dragging a slider never saw the figure move. From 921px up the
   results column already sits beside the inputs, so this is phones and
   tablets only: the stylesheet keeps the bar display:none from 921px up, and
   this file never shows it or lifts Ask Buddy there either.

   WHERE. The five calculators, and nothing else: pension-calculator (and the
   three pages built from it, which inherit the tag) and director-calculator
   carry it. The per-page list below is keyed by filename, like
   assets/js/pb-guess.js; any other page gets nothing at all.

   IT WORKS NOTHING OUT. Every figure in the bar is copied, character for
   character, from a cell the page itself has just written (#potOut,
   #spWeekly and so on). A MutationObserver on each cell's text copies every
   write, so the figure tweens in the bar exactly as it tweens in the hero,
   and a second one on the state panels' hidden attribute (the compare page's
   two modes, the State Pension pages' eligible / no entitlement / check the
   details panels) switches what the bar says. No calculator write changes:
   this file never writes to anything the page owns. Two attributes are the
   exception, both on the one element a tap jumps to: tabindex="-1", so it
   can take focus, added the first time it is needed and never removed.

   WHEN. It is up while at least one control of the inputs panel (a slider, a
   checkbox, a segment button; on the compare page the mode tabs too) is
   fully on screen above the bar, and none of the headline cells is on
   screen at all. So it is down at the top of the page on first view (the
   panel starts at or below the fold on all five at 375x812), it comes up as
   the first slider comes clear of it, and it goes as the real figure comes
   up from the bottom edge. IntersectionObservers, no scroll maths for any
   of that.

   THE GUESS COMES FIRST. While assets/js/pb-guess.js has the page's figures
   veiled (any mirrored cell under .pb-veiled, or <html> still carrying the
   pre-paint .pb-preveil), the bar shows no figure at all, only the guess
   card's own title, "Take a guess first", and a tap takes the reader to that
   card. The guess card being on screen counts as the results being on screen
   while the veil is up, so the bar never repeats the title under the card.
   The moment the veil lifts, the observer on the cells' class sees it and
   the figures appear. Nothing is added to pb-guess's veil list, because
   nothing here ever holds a figure while the veil is up.

   ONE BUTTON. The whole bar is a <button> named "Jump to your results". The
   figures and labels inside it are aria-hidden: the page's own #srSummary
   already speaks the results, and this must not become a second live region
   or read a figure out from under the veil. A tap scrolls to the results
   (smooth; instant under reduced motion) and moves focus to them: the guess
   card while the veil is up, otherwise the results hero the figures came
   from. At least 56px tall, the full width of the screen.

   KEYBOARD. The bar sits in the document straight after the inputs panel, so
   it is the next tab stop after the last control and before the results. It
   never takes focus when it appears. Tucked means moved off screen, not
   hidden, so a keyboard reader always meets it there, and focus inside it
   brings it up whatever the scroll position.

   IT NEVER SITS ON TOP OF ANYTHING THAT IS THE READER'S. The patterns are the
   booking bar's (assets/js/pb-bookbar.js, which is never loaded here):
     - The cookie choice bar (.pb-consent): while it is up this bar is
       display:none; a MutationObserver on <body> sees it leave.
     - Ask Buddy (#pbBuddyBtn): while the bar shows, <html> carries
       .pb-peek-on and the stylesheet lifts the button by the bar's measured
       height (--pb-peek-h). While the Ask Buddy panel is open the bar is
       held away, the lift drops and the panel opens where it always did.
     - A text field (the tap-to-type box, the email field): while one has
       focus the bar tucks away, so it cannot ride up on the keyboard.
     - A control with keyboard focus: while the bar shows, scroll-padding-
       bottom keeps anything the browser scrolls into view clear of it, and
       if a keyboard-focused control still ends up behind it, it tucks away
       until that control is clear.

   MOTION. Slides up in 200ms. Under reduced motion it simply appears.

   WITHOUT SCRIPT, nothing: the bar is built here, and the results are on the
   page below the inputs as they always were. Without IntersectionObserver,
   MutationObserver or matchMedia (the render-diff harness's DOM among them)
   this file returns before touching anything.

   Classic script, nothing declared at top level, every lookup guarded. */
(function () {
  'use strict';

  var doc = document, html = doc.documentElement, body = doc.body;
  if (!body || !html || !doc.querySelector || !('IntersectionObserver' in window) ||
      !('MutationObserver' in window) || typeof window.matchMedia !== 'function') { return; }

  var NAME = 'Jump to your results';
  /* pb-guess.js's card title, word for word */
  var GUESS = 'Take a guess first';

  /* ------------------------------------------------------------------
     THE PAGES. Each state is one panel the page shows or hides (none on
     the two hand-written calculators), and the cells the bar copies while
     it shows. Labels are the page's own, shortened only where two would
     not fit side by side at 375px.
     ------------------------------------------------------------------ */
  function views(file) {
    if (file === 'pension-calculator.html') {
      return { states: [{ items: [['Projected pot', '#potOut'], ['Income, per month', '#incOut']] }] };
    }
    if (file === 'director-calculator.html') {
      return { states: [{ items: [['Projected pot', '#potOut'], ['Corporation tax relief', '#taxOut']] }] };
    }
    if (file === 'broker-vs-autoenrolment.html') {
      return { states: [
        { when: 'mode1Results', items: [['Auto-enrolment', '#aeTotal'], ['Personal pension', '#ppTotal']] },
        { when: 'mode2Results', items: [['Into your pension, combined', '#cTotal']] }
      ] };
    }
    if (file === 'state-pension-reality-check.html') {
      return { tone: 'state', states: [
        { when: 'spHas', items: [['State Pension, a week', '#spWeekly'], ['State Pension, a year', '#spAnnual']] },
        { when: 'spNone', items: [['State Pension (Contributory)', '#spNone .big']] }
      ] };
    }
    if (file === 'state-pension-entitlement.html') {
      return { tone: 'state', states: [
        { when: 'spHas', items: [['State Pension (Contributory), a week', '#spWeekly']] },
        { when: 'spNone', items: [['State Pension (Contributory)', '#spNone .big']] },
        { when: 'spUnfit', items: [['State Pension (Contributory)', '#spUnfit .big']] }
      ] };
    }
    return null;
  }

  function one(sel) {
    try { return doc.querySelector(sel); } catch (e) { return null; }
  }
  function all(sel) {
    try { return [].slice.call(doc.querySelectorAll(sel)); } catch (e) { return []; }
  }

  var file = String(location.pathname || '').split('/').pop() || 'index.html';
  var cfg = views(file);
  if (!cfg) { return; }
  var panel = one('.calc-wrap .panel');
  if (!panel || !panel.parentNode || !one('.results')) { return; }

  /* every state resolved to real elements; a page missing any cell gets no bar */
  var states = [], cells = [], i, j, st, el;
  for (i = 0; i < cfg.states.length; i++) {
    st = { when: cfg.states[i].when ? doc.getElementById(cfg.states[i].when) : null, items: [] };
    if (cfg.states[i].when && !st.when) { return; }
    for (j = 0; j < cfg.states[i].items.length; j++) {
      el = one(cfg.states[i].items[j][1]);
      if (!el) { return; }
      st.items.push({ label: cfg.states[i].items[j][0], src: el, fig: null });
      cells.push(el);
    }
    states.push(st);
  }

  var phone = window.matchMedia('(max-width: 920px)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- the bar ---------------------------------------------------- */

  var bar = doc.createElement('button');
  bar.type = 'button';
  bar.className = 'pb-peek';
  bar.id = 'pbPeek';
  bar.setAttribute('aria-label', NAME);
  if (cfg.tone) { bar.setAttribute('data-pb-tone', cfg.tone); }

  var figs = doc.createElement('span');
  figs.className = 'pb-peek-figs';
  figs.setAttribute('aria-hidden', 'true');

  var guessEl = doc.createElement('span');
  guessEl.className = 'pb-peek-guess';
  guessEl.textContent = GUESS;
  guessEl.hidden = true;
  figs.appendChild(guessEl);

  for (i = 0; i < states.length; i++) {
    states[i].set = doc.createElement('span');
    states[i].set.className = 'pb-peek-set';
    states[i].set.hidden = true;
    for (j = 0; j < states[i].items.length; j++) {
      var item = doc.createElement('span');
      var lab = doc.createElement('span');
      item.className = 'pb-peek-item';
      lab.className = 'pb-peek-lab';
      lab.textContent = states[i].items[j].label;
      states[i].items[j].fig = doc.createElement('span');
      states[i].items[j].fig.className = 'pb-peek-fig';
      item.appendChild(lab);
      item.appendChild(states[i].items[j].fig);
      states[i].set.appendChild(item);
    }
    figs.appendChild(states[i].set);
  }
  bar.appendChild(figs);

  var go = doc.createElement('span');
  go.className = 'pb-peek-go';
  go.setAttribute('aria-hidden', 'true');
  go.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>';
  bar.appendChild(go);

  /* straight after the inputs panel: the next tab stop after its last control */
  panel.parentNode.insertBefore(bar, panel.nextSibling);

  /* ---- what the bar says ------------------------------------------ */

  function hiddenUp(node) {
    var e = node;
    while (e && e.nodeType === 1) {
      if (e.hasAttribute('hidden')) { return true; }
      e = e.parentElement;
    }
    return false;
  }

  function activeState() {
    for (var k = 0; k < states.length; k++) {
      if (!states[k].when || !hiddenUp(states[k].when)) { return states[k]; }
    }
    return null;
  }

  /* the guess is still to come: a mirrored cell is behind pb-guess's veil,
     or the head's pre-paint blur has not come off yet */
  function isVeiled() {
    if (html.classList.contains('pb-preveil')) { return true; }
    for (var k = 0; k < cells.length; k++) {
      if (cells[k].closest && cells[k].closest('.pb-veiled')) { return true; }
    }
    return false;
  }

  function text(node) {
    return String(node.textContent || '').replace(/\s+/g, ' ').trim();
  }

  var veiled = true, current = null;

  function render() {
    var was = veiled, now = activeState(), k, it, t;
    veiled = isVeiled();
    guessEl.hidden = !veiled;
    for (k = 0; k < states.length; k++) {
      states[k].set.hidden = veiled || states[k] !== now;
    }
    current = now;
    if (!veiled && now) {
      for (k = 0; k < now.items.length; k++) {
        it = now.items[k];
        t = text(it.src);
        if (it.fig.textContent !== t) { it.fig.textContent = t; }
      }
    }
    if (was !== veiled) { update(); }
  }

  /* ---- when it shows ---------------------------------------------- */

  var fullIn = [], cellsIn = [], guessIn = false;
  var typing = false, focusIn = false, covered = false, shown = false;
  var barH = 0;

  function consentUp() {
    return !!doc.querySelector('.pb-consent') || body.classList.contains('pb-banner-open');
  }

  var watch = new MutationObserver(function () { update(); });

  /* the Ask Buddy panel is open; the button is watched once it exists */
  var buddy = null;
  function buddyOpen() {
    var b = doc.getElementById('pbBuddyBtn');
    if (b && b !== buddy) {
      buddy = b;
      watch.observe(b, { attributes: true, attributeFilter: ['aria-expanded'] });
    }
    return !!b && b.getAttribute('aria-expanded') === 'true';
  }

  function measure() {
    var h = bar.offsetHeight;
    if (h && h !== barH) {
      barH = h;
      html.style.setProperty('--pb-peek-h', h + 'px');
      observeInputs();
    }
  }

  function update() {
    var held = consentUp() || buddyOpen();
    bar.classList.toggle('pb-peek-held', held);
    var resultsIn = cellsIn.length > 0 || (veiled && guessIn);
    var show = !held && phone.matches &&
      (focusIn || (fullIn.length > 0 && !resultsIn && !typing && !covered));
    if (show === shown) { return; }
    shown = show;
    /* reading the height here also settles the tucked position first, so the
       bar slides up from it even when it was display:none a moment ago */
    if (show) { measure(); }
    bar.classList.toggle('pb-peek-on', show);
    html.classList.toggle('pb-peek-on', show);
  }

  /* the inputs: a control counts once it is wholly on screen above the bar */
  var controls = all('.calc-wrap .panel input, .calc-wrap .panel button, .calc-wrap .panel select, .calc-wrap .modebar button');
  var inIO = null;
  /* rebuilt when the bar's height changes. fullIn is kept: the new observer
     reports every control once as it starts, which corrects each entry, and
     emptying it here would drop the bar for a frame in between */
  function observeInputs() {
    if (inIO) { inIO.disconnect(); }
    inIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var k = fullIn.indexOf(e.target);
        var whole = e.isIntersecting && e.intersectionRatio >= 0.99;
        if (whole && k < 0) { fullIn.push(e.target); }
        if (!whole && k >= 0) { fullIn.splice(k, 1); }
      });
      update();
    }, { rootMargin: '0px 0px -' + (barH || 0) + 'px 0px', threshold: [0, 0.5, 1] });
    controls.forEach(function (c) { inIO.observe(c); });
  }

  /* the headline: any part of a mirrored cell on screen */
  var outIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.target === guessTitle) { guessIn = e.isIntersecting; return; }
      var k = cellsIn.indexOf(e.target);
      if (e.isIntersecting && k < 0) { cellsIn.push(e.target); }
      if (!e.isIntersecting && k >= 0) { cellsIn.splice(k, 1); }
    });
    update();
  });
  cells.forEach(function (c) { outIO.observe(c); });

  /* the guess card is built on DOMContentLoaded, after this file has run */
  var guessTitle = null;
  function hookGuess() {
    var g = one('#pbGuess .pb-guess-t');
    if (g && g !== guessTitle) {
      guessTitle = g;
      outIO.observe(g);
    }
    render();
  }

  /* ---- mirroring -------------------------------------------------- */

  var mirror = new MutationObserver(function () { render(); });
  cells.forEach(function (c) {
    mirror.observe(c, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  states.forEach(function (s) {
    if (s.when) { mirror.observe(s.when, { attributes: true, attributeFilter: ['hidden'] }); }
  });
  mirror.observe(html, { attributes: true, attributeFilter: ['class'] });
  watch.observe(body, { childList: true, attributes: true, attributeFilter: ['class'] });

  /* ---- focus ------------------------------------------------------ */

  function isField(e) {
    if (!e || !e.tagName) { return false; }
    if (e.isContentEditable || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT') { return true; }
    return e.tagName === 'INPUT' &&
      !/^(range|checkbox|radio|button|submit|reset|color|file|image|hidden)$/i.test(e.type || '');
  }

  /* a control with keyboard focus that has ended up behind the bar. Only the
     page's own content counts: Ask Buddy's button and panel and the cookie
     bar are fixed to the screen and placed around this bar already (the lift,
     the hold), and counting the lifted button would drop the bar, drop the
     lift and leave the button where it was, behind nothing */
  var coverRaf = 0;
  function checkCover() {
    coverRaf = 0;
    var a = doc.activeElement, c = false, kb = false, r, vh;
    if (a && a !== body && a !== html && !bar.contains(a) && a.tabIndex >= 0 && a.getClientRects().length &&
        !(a.closest && a.closest('#pbBuddyBtn, #pbBuddyPanel, .pb-consent'))) {
      try { kb = a.matches(':focus-visible'); } catch (e) { kb = false; }
      if (kb) {
        r = a.getBoundingClientRect();
        vh = window.innerHeight || html.clientHeight;
        c = r.bottom > vh - (barH || bar.offsetHeight) && r.top < vh;
      }
    }
    if (c !== covered) { covered = c; update(); }
  }
  function queueCover() {
    if (!coverRaf) { coverRaf = window.requestAnimationFrame(checkCover); }
  }

  doc.addEventListener('focusin', function (e) {
    focusIn = bar.contains(e.target);
    typing = !focusIn && isField(e.target);
    update();
    queueCover();
  });
  doc.addEventListener('focusout', function (e) {
    if (!e.relatedTarget) { focusIn = false; typing = false; update(); }
    queueCover();
  });
  window.addEventListener('scroll', function () {
    if (covered || (doc.activeElement && doc.activeElement !== body)) { queueCover(); }
  }, { passive: true });
  window.addEventListener('resize', function () { measure(); queueCover(); });
  /* a long figure can wrap the bar onto a second line mid-drag: Ask Buddy's
     lift and the controls' margin follow its height */
  if ('ResizeObserver' in window) {
    new window.ResizeObserver(function () { measure(); }).observe(bar);
  }
  function onChange() { measure(); update(); }
  if (phone.addEventListener) { phone.addEventListener('change', onChange); }
  else if (phone.addListener) { phone.addListener(onChange); }

  /* ---- the tap ---------------------------------------------------- */

  function target() {
    var g, k;
    if (veiled) {
      g = doc.getElementById('pbGuess');
      if (g && g.getClientRects().length) { return g; }
    }
    if (current) {
      for (k = 0; k < current.items.length; k++) {
        g = current.items[k].src.closest ? current.items[k].src.closest('.res-hero') : null;
        if (g && g.getClientRects().length) { return g; }
      }
    }
    return one('.results');
  }

  bar.addEventListener('click', function () {
    var t = target();
    if (!t) { return; }
    if (!t.hasAttribute('tabindex')) { t.setAttribute('tabindex', '-1'); }
    try { t.scrollIntoView({ block: 'start', behavior: calm.matches ? 'auto' : 'smooth' }); }
    catch (e) { t.scrollIntoView(true); }
    try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
  });

  /* ---- start ------------------------------------------------------ */

  measure();
  if (!inIO) { observeInputs(); }
  render();
  update();
  if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', hookGuess); }
  else { hookGuess(); }
})();
