/*
  "Take a guess first", on every calculator.

  A card is inserted at runtime as the FIRST child of .results, the figure the
  page has just worked out is put behind a blur, and the reader moves a slider
  to their own guess before pressing Reveal. Then the blur lifts and one line
  says how the two compare. It is the calculator's own figure either way: this
  file works out nothing, states nothing and stores nothing.

  WHAT IT TOUCHES, and nothing else
    - inserts one card into .results, above every existing card
    - adds .pb-veil / .pb-veiled and aria-hidden to a named list of cells
    - swaps #srSummary's aria-live between "off" and "polite", and marks it
      aria-hidden while the veil is up
  It never reads or writes a calculation, never edits textContent of anything
  the page owns, and never touches the footer disclosure, the panel sliders
  or any link. One thing outside this file knows the card exists: the lead
  form on the two hand-written calculators serialises every input[type=range]
  on the page into what Damian receives, so both now exclude #pbGuessRange by
  id. Without that a guess would arrive looking like one of the visitor's own
  figures. Rename the slider and those two selectors have to follow.

  THE VEIL IS AN EXPLICIT PER-PAGE LIST, not ".res-hero .big". Most of these
  pages print the headline figure a second time outside the hero, so a
  hero-only blur would leave the answer on screen a few centimetres below:
  the compare page repeats both totals in its breakdown cards, quotes them
  again in #leadOut and states the personal-pension total a third time in
  #ppNetLab's sentence, and the entitlement page repeats the weekly rate in
  .bothcard. Every element on every list was checked by hand for a link, an
  input or anything else focusable, and none of them has one, which is what
  makes aria-hidden while veiled honest rather than a trap.

  THE REALITY CHECK IS ON THE LIST. It opens on a full forty-year record, so
  #spWeekly holds the maximum rate at load. The page's lede used to state that
  maximum in words above the results column and no longer does; the figure is
  still printed lower down, in the explanation and the assumptions under the
  tool, which a reader reaches only by scrolling past the card. At the default
  the guess is therefore for the maximum rate, unseen; it becomes the reader's
  own question once they move the contributions slider to their own record,
  which is what the page asks them to do.

  THE VEIL LANDS BEFORE THE FIRST PAINT. This file arrives from a tag at the
  end of the body, after the page has painted its figures, so on its own the
  answer would be on screen, sharp, for as long as the fetch takes, and then
  ease into the blur. Two things close that window. A one-line script in the
  head puts .pb-preveil on <html> on the pages that carry a card, and head CSS
  blurs the headline cells under it before anything is painted; boot() takes
  the class off again in the same task that puts its own veil up, so nothing
  is ever seen sharp in between, and the head script drops the class itself
  after four seconds in case this file never arrives. And the transition
  (.pb-veil) is added only as the veil LIFTS, so the blur lands in one frame
  and only the way out eases.

  TWO CELLS ARE DELIBERATELY LEFT SHARP. #taxOut on the director page, which
  the safe visual animates, and which carries nothing about the pot; and
  #incOut's neighbours (#waitOut, #boostOut, #reliefOut, #maxOut, #vsSub),
  which print a gap or a difference rather than the figure being guessed.

  THE COMPARISON LINE IS WRITTEN BY A MUTATION OBSERVER on the target cell,
  not by a single read at Reveal. The panel sliders stay live while the veil
  is up and the two hand-written calculators walk their headline cell over
  many frames, so one read can catch a number mid-flight. The observer is the
  mechanism, and it also keeps the line true when the sliders move afterwards.
  The line is also a live region, so the WRITE is on the same 700ms debounce
  the shared runtime puts on #srSummary, and for the same reason: the tween
  delivers one observer callback per frame, and a polite region rewritten on
  every frame of a drag is a queue of announcements nobody can use. Only the
  reveal click, which is a deliberate action, writes straight away.

  WHAT THE COMPARE PAGE STILL GIVES AWAY. The veil hides both totals and the
  cards that repeat them, but the panel has to stay readable for the reader to
  set their own inputs, and it prints the salary beside a note naming the
  phase percentages. One multiplication gets the answer. Veiling #aeNet would
  close one route and not the leak, at the cost of blurring what the year
  costs out of pocket, which is a separate figure and not the one being
  guessed. So the leak is left open and said out loud rather than half-closed.

  Classic script, nothing declared at top level, every lookup guarded, silent
  return when an element is absent. It loads last, after the page's own script
  and after the slider polish and More-options passes have taken their
  snapshots, so the slider it creates is nobody else's business.
*/
(function () {
  'use strict';

  var TITLE = 'Take a guess first';
  var LEAD = 'Move the slider to your guess, then reveal the illustration.';
  var GO = 'Reveal the illustration';
  var HIGHER = 'The illustration came out higher than your guess.';
  var LOWER = 'The illustration came out lower than your guess.';
  var SAME = 'Your guess landed on it.';
  var NORATE = 'With these details the illustration does not show a weekly rate.';

  function $(id) {
    return document.getElementById(id);
  }

  function card(id) {
    var el = $(id);
    if (!el || !el.closest) { return null; }
    return el.closest('.chart-card');
  }

  function one(sel) {
    try { return document.querySelector(sel); } catch (e) { return null; }
  }

  /* the two money formats the pages themselves use. The shared runtime has
     both; these are here so a page that somehow loads without it still gets a
     readable line rather than a throw. */
  function euro(v) {
    return '€' + Math.round(v).toLocaleString('en-IE');
  }
  function euro2(v) {
    return '€' + v.toLocaleString('en-IE', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }

  /* ------------------------------------------------------------------
     THE PAGES THAT CARRY A CARD. Keyed by filename, because that is the
     one thing a built page and its parts directory agree on. Any other
     page gets nothing at all.

     Bounds and defaults are the reader's own input, not a published
     figure, so nothing here is copy: they only set how far the slider
     travels. An illustration above the ceiling still reads correctly,
     it just puts "landed on it" out of reach.
     ------------------------------------------------------------------ */
  function views(file) {
    if (file === 'pension-calculator.html') {
      return [{
        label: 'Guess the pot at retirement',
        target: 'potOut',
        fmt: euro,
        min: 0, max: 3000000, step: 10000, value: 250000,
        veil: function () { return [$('potOut'), $('incOut'), card('chart')]; }
      }];
    }
    if (file === 'director-calculator.html') {
      return [{
        label: 'Guess the pot at retirement',
        target: 'potOut',
        fmt: euro,
        min: 0, max: 4000000, step: 20000, value: 500000,
        /* #taxOut stays sharp on purpose: the safe on this page animates it */
        veil: function () { return [$('potOut'), card('chart')]; }
      }];
    }
    if (file === 'state-pension-reality-check.html') {
      return [{
        label: 'Guess the weekly State Pension',
        target: 'spWeekly',
        fmt: euro2,
        min: 0, max: 320, step: 5, value: 150,
        states: ['spHas', 'spNone'],
        /* #spFoot names the record level in words and #lsRows draws the
           annual figure against three printed targets; both give it away */
        veil: function () {
          return [$('spWeekly'), $('spAnnual'), $('spFoot'), $('lsRows')];
        }
      }];
    }
    if (file === 'state-pension-entitlement.html') {
      return [{
        label: 'Guess the weekly State Pension (Contributory)',
        target: 'spWeekly',
        fmt: euro2,
        min: 0, max: 400, step: 5, value: 200,
        states: ['spHas', 'spNone', 'spUnfit'],
        veil: function () {
          return [$('spWeekly'), $('spAnnual'), one('.bothcard')];
        }
      }];
    }
    if (file === 'broker-vs-autoenrolment.html') {
      return [{
        panel: 'mode1Results',
        label: 'Guess what goes in under auto-enrolment',
        target: 'aeTotal',
        fmt: euro,
        min: 0, max: 20000, step: 100, value: 2000,
        /* #ppNetLab is on the list because it spells the personal-pension
           total out in a sentence ("... in, less ... of tax relief"), and
           with no employer match that sentence's first figure IS #ppTotal.
           Its two neighbours #aeNet and #ppNet stay sharp: they print what
           the year costs out of pocket, which is not what is being guessed. */
        veil: function () {
          return [$('leadOut'), $('aeTotal'), $('ppTotal'), $('ppNetLab'),
            card('ppTotal2'), card('aeTotal2'), $('pbScaleCard')];
        }
      }, {
        panel: 'mode2Results',
        label: 'Guess what goes in altogether',
        target: 'cTotal',
        fmt: euro,
        min: 0, max: 20000, step: 100, value: 2000,
        veil: function () {
          return [$('leadOut'), $('cTotal'), $('cTopUp'), $('cNote'),
            card('cTopUp2'), card('aeTotal2'), $('pbScaleCard')];
        }
      }];
    }
    return null;
  }

  /* ------------------------------------------------------------------ */

  var file = '';
  var list = null;      /* the page's views */
  var view = null;      /* the one in force */
  var box = null;       /* the card */
  var range = null;
  var valEl = null;
  var labEl = null;
  var outEl = null;
  var goBtn = null;
  var veiled = [];      /* [element, its aria-hidden before we touched it] */
  var srLive = null;    /* #srSummary's aria-live before we touched it */
  var srHidden = null;  /* and its aria-hidden, restored the same way */
  var revealed = false;
  var watchers = [];

  function observe(node, opts, fn) {
    var mo;
    if (!node || typeof MutationObserver !== 'function') { return; }
    mo = new MutationObserver(fn);
    mo.observe(node, opts);
    watchers.push(mo);
  }

  function stopWatching() {
    var i;
    for (i = 0; i < watchers.length; i++) {
      try { watchers[i].disconnect(); } catch (e) {}
    }
    watchers = [];
  }

  /* an element inside a panel the page has hidden is not on screen, and on
     the two State Pension pages that is exactly how "no weekly rate" is
     expressed: the eligible panel is hidden wholesale. */
  function outOfSight(el) {
    var e = el;
    while (e && e.nodeType === 1) {
      if (e.hasAttribute && e.hasAttribute('hidden')) { return true; }
      e = e.parentElement;
    }
    return false;
  }

  function figure() {
    var el = $(view.target), n;
    if (!el || outOfSight(el)) { return null; }
    n = parseFloat(String(el.textContent).replace(/[^0-9.]/g, ''));
    return isFinite(n) ? n : null;
  }

  function figureText() {
    var el = $(view.target);
    return el ? String(el.textContent).replace(/\s+/g, ' ').trim() : '';
  }

  /* ---- the veil -------------------------------------------------- */

  function applyVeil() {
    var wanted, i, el;
    wanted = view.veil() || [];
    for (i = 0; i < wanted.length; i++) {
      el = wanted[i];
      if (!el || !el.classList) { continue; }
      if (el.classList.contains('pb-veiled')) { continue; }
      veiled.push([el, el.getAttribute('aria-hidden')]);
      /* .pb-veiled alone: no transition class yet, so the blur lands in
         one frame instead of easing in from a readable figure */
      el.classList.add('pb-veiled');
      el.setAttribute('aria-hidden', 'true');
    }
  }

  function liftVeil() {
    var i, el, was;
    for (i = 0; i < veiled.length; i++) {
      el = veiled[i][0];
      was = veiled[i][1];
      if (!el || !el.classList) { continue; }
      /* .pb-veil carries the transition; added here, in the same style
         pass that removes the blur, so only the way out eases */
      el.classList.add('pb-veil');
      el.classList.remove('pb-veiled');
      if (was === null) { el.removeAttribute('aria-hidden'); }
      else { el.setAttribute('aria-hidden', was); }
    }
    veiled = [];
  }

  /* The running summary carries the exact headline figure and is written on
     load, so leaving it live reads the answer out before anyone has guessed.
     aria-live="off" stops the announcement but leaves the sentence sitting in
     the accessibility tree for anyone reading the page node by node, which is
     the answer in plain text while every sighted reader has a blur, so it is
     aria-hidden for as long as the veil is up as well. It is a <p> with no
     focusable content, so nothing is being hidden out from under a keyboard.
     Attributes only, both of them: the text is never touched. */
  function silence() {
    var sr = $('srSummary');
    if (!sr || srLive !== null) { return; }
    srLive = sr.getAttribute('aria-live') || 'polite';
    srHidden = sr.getAttribute('aria-hidden');
    sr.setAttribute('aria-live', 'off');
    sr.setAttribute('aria-hidden', 'true');
  }

  function unsilence() {
    var sr = $('srSummary');
    if (!sr || srLive === null) { return; }
    sr.setAttribute('aria-live', srLive);
    if (srHidden === null) { sr.removeAttribute('aria-hidden'); }
    else { sr.setAttribute('aria-hidden', srHidden); }
    srLive = null;
    srHidden = null;
  }

  /* ---- the card -------------------------------------------------- */

  function paint() {
    var v = +range.value;
    valEl.textContent = view.fmt(v);
    if (window.PBPage && typeof window.PBPage.paintSlider === 'function') {
      try {
        window.PBPage.paintSlider(range, { pbGuessRange: view.fmt });
        return;
      } catch (e) {}
    }
    range.style.setProperty('--fill',
      ((v - (+range.min || 0)) / ((+range.max || 100) - (+range.min || 0))) * 100 + '%');
    range.setAttribute('aria-valuetext', view.fmt(v));
  }

  function build(results) {
    var head, lead, row;

    box = document.createElement('div');
    box.className = 'pb-guess';
    box.id = 'pbGuess';

    head = document.createElement('div');
    head.className = 'pb-guess-t';
    head.textContent = TITLE;

    lead = document.createElement('p');
    lead.className = 'pb-guess-lead';
    lead.textContent = LEAD;

    row = document.createElement('div');
    row.className = 'pb-guess-row';
    labEl = document.createElement('label');
    labEl.className = 'pb-guess-lab';
    labEl.id = 'pbGuessLabel';
    labEl.setAttribute('for', 'pbGuessRange');
    labEl.textContent = view.label;
    valEl = document.createElement('span');
    valEl.className = 'pb-guess-val';
    valEl.id = 'pbGuessVal';
    row.appendChild(labEl);
    row.appendChild(valEl);

    range = document.createElement('input');
    range.type = 'range';
    range.id = 'pbGuessRange';
    range.min = String(view.min);
    range.max = String(view.max);
    range.step = String(view.step);
    range.value = String(view.value);

    goBtn = document.createElement('button');
    goBtn.type = 'button';
    goBtn.className = 'pb-guess-btn';
    goBtn.id = 'pbGuessGo';
    goBtn.textContent = GO;

    outEl = document.createElement('p');
    outEl.className = 'pb-guess-out';
    outEl.id = 'pbGuessOut';
    outEl.setAttribute('role', 'status');

    box.appendChild(head);
    box.appendChild(lead);
    box.appendChild(row);
    box.appendChild(range);
    box.appendChild(goBtn);
    box.appendChild(outEl);

    results.insertBefore(box, results.firstChild);

    range.addEventListener('input', function () {
      paint();
      if (revealed) { render(); }
    });
    goBtn.addEventListener('click', reveal);
    paint();
  }

  function retarget() {
    labEl.textContent = view.label;
    range.min = String(view.min);
    range.max = String(view.max);
    range.step = String(view.step);
    if (+range.value < view.min || +range.value > view.max) {
      range.value = String(view.value);
    }
    paint();
  }

  /* ---- the line -------------------------------------------------- */

  /* How close "landed on it" is allowed to be. Half a slider step alone was
     too generous where the step is coarse next to the figure: on the compare
     page a step of 100 against a total near 1,750 called a guess 50 out a
     hit. So it is half a step OR one per cent of the illustration, whichever
     is tighter, which leaves the coarse pages honest and still lets the two
     weekly pages land on a rate they can never equal exactly, cents and all. */
  function band(n) {
    return Math.min(view.step / 2, Math.abs(n) * 0.01);
  }

  /* The line lives in a role="status" region, so writing it is announcing it.
     assets/js/calc-page.js puts #srSummary's writes on a 700ms timer for
     exactly this reason, and this is the same shape: the observer still picks
     the figure up the moment the cell settles, and the sentence lands once the
     reader has stopped moving. `now` is the reveal click, which is a
     deliberate action and should not be made to wait. */
  var outTimer = null;
  function say(text, now) {
    if (!outEl) { return; }
    clearTimeout(outTimer);
    outTimer = null;
    if (now) { outEl.textContent = text; return; }
    outTimer = setTimeout(function () {
      outTimer = null;
      if (outEl) { outEl.textContent = text; }
    }, 700);
  }

  function render(now) {
    var n, guess, verdict;
    if (!box || !outEl || !range || !view) { return; }
    n = figure();
    if (n === null) {
      say(NORATE, now);
      return;
    }
    guess = +range.value;
    if (Math.abs(guess - n) <= band(n)) { verdict = SAME; }
    else if (n > guess) { verdict = HIGHER; }
    else { verdict = LOWER; }
    say('Your guess: ' + view.fmt(guess)
      + '. The illustration: ' + figureText() + '. ' + verdict, now);
  }

  function reveal() {
    var i, cell, st;
    if (revealed) { return; }
    revealed = true;
    liftVeil();
    unsilence();
    if (goBtn && goBtn.parentNode) { goBtn.parentNode.removeChild(goBtn); }
    goBtn = null;

    /* the observer writes the figure, so a cell still walking towards its
       target prints the number it settles on rather than one on the way */
    cell = $(view.target);
    observe(cell, { childList: true, characterData: true, subtree: true },
      function () { render(); });
    if (view.states) {
      for (i = 0; i < view.states.length; i++) {
        st = $(view.states[i]);
        observe(st, { attributes: true, attributeFilter: ['hidden'] },
          function () { render(); });
      }
    }
    render(true);

    try {
      document.dispatchEvent(new CustomEvent('pb:guess-revealed', {
        detail: { page: file }
      }));
    } catch (e) {}
  }

  function retire() {
    stopWatching();
    clearTimeout(outTimer);
    outTimer = null;
    liftVeil();
    unsilence();
    if (box && box.parentNode) { box.parentNode.removeChild(box); }
    box = null;
    outEl = null;
  }

  /* ---- the compare page's two modes ------------------------------- */

  function live() {
    var i, panel;
    for (i = 0; i < list.length; i++) {
      panel = list[i].panel ? $(list[i].panel) : null;
      if (!list[i].panel) { return list[i]; }
      if (panel && !panel.hidden) { return list[i]; }
    }
    return null;
  }

  function modeChanged() {
    var next = live();
    if (!next || next === view) { return; }
    /* a guess made about one mode must not be scored against the other's
       figure, so after Reveal the card goes rather than changing its mind */
    if (revealed) { retire(); return; }
    liftVeil();
    view = next;
    if (!$(view.target)) { retire(); return; }
    retarget();
    say('', true);
    applyVeil();
  }

  function watchModes() {
    var i, panel;
    for (i = 0; i < list.length; i++) {
      if (!list[i].panel) { continue; }
      panel = $(list[i].panel);
      observe(panel, { attributes: true, attributeFilter: ['hidden'] }, modeChanged);
    }
  }

  /* ---- boot ------------------------------------------------------- */

  /* the head's pre-paint blur, see the note at the top */
  function unpre() {
    try { document.documentElement.classList.remove('pb-preveil'); } catch (e) {}
  }

  function boot() {
    try { mount(); } finally { unpre(); }
  }

  function mount() {
    var results;
    file = String(location.pathname || '').split('/').pop() || 'index.html';
    list = views(file);
    if (!list) { return; }
    results = document.querySelector('.results');
    if (!results) { return; }
    view = live();
    if (!view || !$(view.target)) { return; }
    build(results);
    applyVeil();
    silence();
    watchModes();
  }

  /* The one name this file puts on window, so a later feature can ask what
     the card is doing without guessing at ids. Read-only accessors, plus the
     same reveal the button calls, which does nothing on a page with no
     card; such a page answers false and null to everything, which is the
     honest answer on every page that is not a calculator. The event stays the main hook:
     document listens for "pb:guess-revealed", detail { page }. */
  window.PBGuess = {
    page: function () { return file; },
    active: function () { return !!box; },
    revealed: function () { return revealed; },
    target: function () { return view ? view.target : null; },
    reveal: function () { if (box) { reveal(); } }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
