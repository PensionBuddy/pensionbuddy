/*
  "Your pension through life" (Run 37, item 4), on the home page.

  The list of ages is the component: each step is a link to the page that
  explains that age, and it reads the same with or without this script. On a
  wide screen, with motion or without, the card beside the list follows the
  step at the middle of the screen: its age, its heading, and a ruler
  from 18 to 75 with a mark at that age. The card is aria-hidden: it repeats
  the list and adds nothing to it. The page scrolls as it always does; the
  card only listens. Nothing is stored.

  Which step is at the middle (13 October 2026, one rule for the card and
  the walker over it, so they never disagree): the steps' boxes tile the
  list, so the middle line of the screen is always in one of them, the last
  whose top has reached it. PBTimeline.place() gives that step, and the age
  the middle line has reached in it: its own age at its top, close to the
  next step's age (half a year short of it) at its bottom. Without motion
  the card shows that step as the page scrolls. With motion,
  assets/js/pb-tl-motion.js walks the paw to that age and turns the card
  itself as the paw reaches each step (PBTimeline.drive): the paw is at 40
  exactly when the card turns to "From 40", and at 34 the card says "From
  30", even mid-walk.

  Run 43 (INTERACTIVE-PROPOSALS-42 rank 14, adapted): on a narrow screen, where
  the card is not drawn, a "Your age" slider above the list (in the markup,
  drawn only with script and only below 921px) picks the relief step that
  applies at that age (the steps at 18, 30, 40, 50, 55 and 60; never 61, 66 or
  71, whose figures are not a relief band): that step takes .pb-tl-picked, a
  colour and nothing else, and the line under the slider repeats its figure
  and heading (aria-hidden: the slider's spoken value says the same).

  13 October 2026 ("Key dates for your pension"; Damian: "35% from 55 to 59
  means nothing"): each step is its age and one plain line. The card gives
  the step's age, its figure and the line's first sentence; so does the line
  under the slider.
*/
(function () {
  'use strict';
  var box = document.getElementById('pbTl');
  if (!box) { return; }
  var steps = [].slice.call(box.querySelectorAll('.pb-tl-step'));
  if (!steps.length) { return; }
  var AGES = steps.map(function (s) { return +s.getAttribute('data-age'); });
  var RELIEF = [18, 30, 40, 50, 55, 60], LO = 18, HI = 75;
  var pickR = document.getElementById('pbTlAgeS'), pickV = document.getElementById('pbTlAgeSV'), pickOut = document.getElementById('pbTlNow');
  /* a step's plain line, and its first sentence */
  function line(li) { var p = li.querySelector('p'); return p ? p.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function first(li) { var s = line(li), k = s.indexOf('. '); return k >= 0 ? s.slice(0, k + 1) : s; }
  if (pickR && pickV && pickOut) {
    var pick = function () {
      var n = +pickR.value, li = steps[0];
      steps.forEach(function (x) { var a = +x.getAttribute('data-age'); if (RELIEF.indexOf(a) >= 0 && a <= n) { li = x; } });
      steps.forEach(function (x) { x.classList.toggle('pb-tl-picked', x === li); });
      var h = li.querySelector('h3'), head = h ? h.textContent : '', say = first(li);
      pickR.style.setProperty('--fill', ((n - pickR.min) / (pickR.max - pickR.min) * 100).toFixed(2) + '%');
      pickR.setAttribute('aria-valuetext', n + ': ' + head + ', ' + say.charAt(0).toLowerCase() + say.slice(1));
      pickV.textContent = String(n);
      var b = document.createElement('b'); b.textContent = head + ':';
      pickOut.textContent = ''; pickOut.appendChild(b); pickOut.appendChild(document.createTextNode(' ' + say));
    };
    pickR.addEventListener('input', pick);
    pick();
  }

  /* ------------------------------------------- the wide screen's card -- */
  var age = document.getElementById('pbTlAge'), what = document.getElementById('pbTlWhat'), says = document.getElementById('pbTlLine');
  var fill = document.getElementById('pbTlFill'), mark = document.getElementById('pbTlMark');
  if (!age || !what || !fill || !mark) { return; }
  function at(n) { return ((Math.max(LO, Math.min(HI, n)) - LO) / (HI - LO) * 100).toFixed(2) + '%'; }
  function show(li) {
    var n = +li.getAttribute('data-age'), h = li.querySelector('h3');
    steps.forEach(function (s) { s.classList.toggle('pb-on', s === li); });
    age.textContent = li.getAttribute('data-show');
    what.textContent = h ? h.textContent : '';
    if (says) { says.textContent = first(li); }
    fill.style.width = at(n);
    mark.style.left = at(n);
  }
  /* the middle line, a few pixels low so a step put exactly at the middle counts as reached */
  function mid() { return window.innerHeight / 2 + 4; }
  /* the step whose box holds the middle line, and the age reached in it */
  function place() {
    var y = mid(), i = -1, tops = steps.map(function (s) { return s.getBoundingClientRect().top; });
    for (var k = 0; k < tops.length; k++) { if (tops[k] <= y) { i = k; } }
    if (i < 0) { return { li: steps[0], i: 0, age: AGES[0] }; }
    var end = i + 1 < steps.length ? tops[i + 1] : steps[i].getBoundingClientRect().bottom;
    var a0 = AGES[i], a1 = i + 1 < AGES.length ? AGES[i + 1] : HI;
    var f = Math.max(0, Math.min(1, (y - tops[i]) / Math.max(1, end - tops[i])));
    return { li: steps[i], i: i, age: a0 + f * Math.max(0, a1 - a0 - 0.51), tops: tops, end: end };
  }
  /* the inverse, for the walker when it is dragged: where on the page (from the top of the
     document) the middle line has to be for the age a */
  function yFor(a) {
    var tops = steps.map(function (s) { return s.getBoundingClientRect().top + window.scrollY; });
    var i = 0;
    for (var k = 0; k < AGES.length; k++) { if (AGES[k] <= a) { i = k; } }
    var end = i + 1 < steps.length ? tops[i + 1] : steps[i].getBoundingClientRect().bottom + window.scrollY;
    var a0 = AGES[i], a1 = i + 1 < AGES.length ? AGES[i + 1] : HI, span = Math.max(0, a1 - a0 - 0.51);
    var f = span > 0 ? (a - a0) / span : 0;
    /* an age that rounds to the next step's: just into the next step, so the card has turned;
       otherwise inside this one, a few pixels short of its end at most */
    if (Math.round(a) >= a1 && i + 1 < steps.length) { return end + 2; }
    return f >= 1 ? end - 3 : tops[i] + Math.max(0, f) * (end - tops[i]);
  }
  var wideQ = window.matchMedia ? window.matchMedia('(min-width: 921px)') : { matches: true };
  var cur = null, queued = 0, driven = false;
  function to(li) { if (li !== cur) { cur = li; show(li); } }
  function follow() {
    queued = 0;
    if (driven || !wideQ.matches) { return; }
    to(place().li);
  }
  function soon() { if (!queued) { queued = window.requestAnimationFrame ? requestAnimationFrame(follow) : setTimeout(follow, 16); } }
  window.addEventListener('scroll', soon, { passive: true });
  window.addEventListener('resize', soon);
  follow();
  window.PBTimeline = {
    steps: steps, ages: AGES, place: place, yFor: yFor, mid: mid,
    /* the walker turns the card while it runs (on), and hands it back when it stops (off) */
    drive: function (on) { driven = !!on; if (!driven) { follow(); } },
    show: function (li) { if (driven) { to(li); } }
  };
}());
