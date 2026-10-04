/*
  "Your pension through life" (Run 37, item 4), on the home page.

  The list of ages is the component: each step is a link to the page that
  explains that age, and it reads the same with or without this script. On a
  wide screen, with motion or without, the card beside the list follows the
  step nearest the middle of the screen: its age, its heading, and a ruler
  from 18 to 75 with a mark at that age. The card is aria-hidden: it repeats
  the list and adds nothing to it. The page scrolls as it always does; the
  card only listens. Nothing is stored.

  Same shape as the starter page's "First payslip to 66" (the step in the
  middle of the screen sets the card). Without IntersectionObserver the card
  stays on the first step.

  Run 43 (INTERACTIVE-PROPOSALS-42 rank 14, adapted): on a narrow screen, where
  the card is not drawn, a "Your age" slider above the list (in the markup,
  drawn only with script and only below 921px) picks the relief step that
  applies at that age (the steps at 18, 30, 40, 50, 55 and 60; never 61, 66 or
  71, whose figures are not a relief band): that step takes .pb-tl-picked, a
  colour and nothing else, and the line under the slider repeats its figure
  and heading (aria-hidden: the slider's spoken value says the same). It needs
  no IntersectionObserver.
*/
(function () {
  'use strict';
  var box = document.getElementById('pbTl');
  if (!box) { return; }
  var steps = [].slice.call(box.querySelectorAll('.pb-tl-step'));
  var RELIEF = [18, 30, 40, 50, 55, 60];
  var pickR = document.getElementById('pbTlAgeS'), pickV = document.getElementById('pbTlAgeSV'), pickOut = document.getElementById('pbTlNow');
  if (pickR && pickV && pickOut && steps.length) {
    var pick = function () {
      var n = +pickR.value, li = steps[0];
      steps.forEach(function (x) { var a = +x.getAttribute('data-age'); if (RELIEF.indexOf(a) >= 0 && a <= n) { li = x; } });
      steps.forEach(function (x) { x.classList.toggle('pb-tl-picked', x === li); });
      var h = li.querySelector('h3'), head = h ? h.textContent : '', fig = li.getAttribute('data-show');
      pickR.style.setProperty('--fill', ((n - pickR.min) / (pickR.max - pickR.min) * 100).toFixed(2) + '%');
      pickR.setAttribute('aria-valuetext', n + ': ' + fig + ', ' + head);
      pickV.textContent = String(n);
      var b = document.createElement('b'); b.textContent = fig;
      pickOut.textContent = ''; pickOut.appendChild(b); pickOut.appendChild(document.createTextNode(' ' + head));
    };
    pickR.addEventListener('input', pick);
    pick();
  }
  if (!('IntersectionObserver' in window)) { return; }
  var age = document.getElementById('pbTlAge'), what = document.getElementById('pbTlWhat');
  var fill = document.getElementById('pbTlFill'), mark = document.getElementById('pbTlMark');
  var LO = 18, HI = 75;
  function at(n) { return ((Math.max(LO, Math.min(HI, n)) - LO) / (HI - LO) * 100).toFixed(2) + '%'; }
  function show(li) {
    var n = +li.getAttribute('data-age'), h = li.querySelector('h3');
    steps.forEach(function (s) { s.classList.toggle('pb-on', s === li); });
    age.textContent = li.getAttribute('data-show');
    what.textContent = h ? h.textContent : '';
    fill.style.width = at(n);
    mark.style.left = at(n);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { show(e.target); } });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach(function (s) { io.observe(s); });
}());
