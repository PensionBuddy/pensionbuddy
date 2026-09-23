/* The relief limit ladder: Revenue's age-related limit on the contributions
   that get tax relief, six steps from 15% under 30 to 40% at 60 and over.

   The ladder itself is static markup (.pb-lad), so it reads right with no
   script. On a calculator the markup names the page's own age and earnings
   sliders (data-pb-age, data-pb-earn); this file then marks the reader's
   step and says their limit in euro, from PBRelief.reliefLimit(). It writes
   only into the ladder, never into anything the calculator owns, and it
   waits for DOMContentLoaded so the module has loaded wherever its tag sits.
   The steps' figures are PBRelief.reliefBand()'s; on a page that loads the
   module they are checked against it and a mismatch hides the ladder rather
   than show a figure the module does not give. */
(function () {
  'use strict';
  function init() {
    var R = window.PBRelief;
    if (!R || !document.querySelectorAll) return;
    var euro = (window.PBPage && window.PBPage.euro) || function (v) {
      return '€' + Math.round(v).toLocaleString('en-IE');
    };
    var pct = function (r) { return Math.round(r * 100) + '%'; };
    [].forEach.call(document.querySelectorAll('.pb-lad'), function (root) {
      var rows = [].slice.call(root.querySelectorAll('.pb-lad-row'));
      var bad = rows.some(function (r) {
        return pct(R.reliefBand(+r.getAttribute('data-from'))) !== r.querySelector('.pb-lad-pct').textContent.trim();
      });
      if (bad) { root.hidden = true; return; }
      var ageEl = document.getElementById(root.getAttribute('data-pb-age') || '');
      var earnEl = document.getElementById(root.getAttribute('data-pb-earn') || '');
      var out = root.querySelector('.pb-lad-out');
      if (!ageEl || !earnEl || !out) return;
      function paint() {
        var age = +ageEl.value, earn = +earnEl.value;
        rows.forEach(function (r) {
          r.querySelector('.pb-lad-you').hidden =
            !(age >= +r.getAttribute('data-from') && age <= +r.getAttribute('data-to'));
        });
        out.textContent = 'At ' + age + ', relief applies to contributions up to ' +
          euro(R.reliefLimit(age, earn)) + ' a year: ' + pct(R.reliefBand(age)) + ' of ' +
          (earn > R.EARN_CAP ? euro(R.EARN_CAP) + ', the most Revenue counts.' : euro(earn) + '.');
      }
      ageEl.addEventListener('input', paint);
      earnEl.addEventListener('input', paint);
      paint();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
