/* The relief widget: one amount in, one sentence out. "Put in €100 and it
   could cost you about €60 at the higher rate of tax, or €80 at the standard
   rate": the glossary's own example, with the site's two income tax rates,
   within Revenue's age-related limits, which the sentence says. The link
   opens the pension calculator; this script adds the amount to it after the
   # (#monthly=), which never reaches a server, and the calculator reads it.

   The markup carries the €100 example and a plain link, and keeps the
   slider hidden, so a page without script shows a true sentence and no dead
   control. Text inherits the colour of wherever it sits. */
(function () {
  'use strict';
  var RATES = [0.4, 0.2];
  var fmt = function (v) { return '€' + Math.round(v).toLocaleString('en-IE'); };
  [].forEach.call(document.querySelectorAll('.pb-rw'), function (w) {
    var r = w.querySelector('input[type=range]');
    var v = w.querySelector('.pb-rw-v'), hi = w.querySelector('.pb-rw-hi'), lo = w.querySelector('.pb-rw-lo'), a = w.querySelector('.pb-rw-link');
    if (!r || !v || !hi || !lo || !a) return;
    function paint() {
      var n = +r.value;
      r.style.setProperty('--fill', ((n - r.min) / (r.max - r.min)) * 100 + '%');
      r.setAttribute('aria-valuetext', fmt(n) + ' a month');
      v.textContent = fmt(n) + ' a month';
      hi.textContent = fmt(n * (1 - RATES[0]));
      lo.textContent = fmt(n * (1 - RATES[1]));
      a.setAttribute('href', 'pension-calculator.html#monthly=' + n);
    }
    r.hidden = false;
    r.addEventListener('input', paint);
    paint();
  });
})();
