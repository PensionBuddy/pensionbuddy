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
*/
(function () {
  'use strict';
  var box = document.getElementById('pbTl');
  if (!box || !('IntersectionObserver' in window)) { return; }
  var age = document.getElementById('pbTlAge'), what = document.getElementById('pbTlWhat');
  var fill = document.getElementById('pbTlFill'), mark = document.getElementById('pbTlMark');
  var steps = [].slice.call(box.querySelectorAll('.pb-tl-step'));
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
