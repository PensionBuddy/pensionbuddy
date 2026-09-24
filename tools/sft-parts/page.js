/* standard-fund-threshold.html (Run 20 #7).

   Every figure comes from assets/js/sft.js, which carries the sources and is
   covered by tests/sft.test.js. This file reads the three sliders and paints
   the threshold for the year chosen, the share used, the strip, the excess
   card and the lump sum's bands. From 2030 the threshold follows earnings
   and is not known yet, so the page shows the least it can be and says so
   rather than guessing a figure. */
(function () {
  'use strict';
  var S = window.PBSft, P = window.PBPage;
  if (!S || !P) return;
  var $ = P.$, euro = P.euro;
  var yearWord = function (y) { return y >= 2030 ? '2030 or later' : String(y); };
  var VALTEXT = {
    total: function (v) { return euro(v); },
    year: function (v) { return yearWord(v); },
    lump: function (v) { return euro(v); }
  };

  function render() {
    var total = +$('total').value, year = +$('year').value, lump = +$('lump').value;
    var u = S.used(total, year), l = S.lumpSum(lump);
    var pc = Math.round(u.share * 100);
    $('totalV').textContent = euro(total);
    $('yearV').textContent = yearWord(year);
    $('lumpV').textContent = euro(lump);
    $('thrL').textContent = 'The threshold for ' + yearWord(year);
    $('thr').textContent = (u.atLeast ? 'At least ' : '') + euro(u.threshold);
    $('share').textContent = pc + '%';
    var when = year >= 2030 ? 'from 2030' : 'in ' + year;
    var say;
    if (u.excess > 0) {
      say = euro(total) + ' taken ' + when + ' is ' + euro(u.excess) + ' over ' + (u.atLeast ? 'the least the threshold can then be' : 'that year’s threshold') + '.';
    } else {
      say = euro(total) + ' taken ' + when + ' uses ' + pc + '% of ' + (u.atLeast ? 'the least the threshold can then be' : 'that year’s threshold') +
        ', leaving ' + euro(u.headroom) + ' of headroom.';
    }
    $('pbSay').textContent = say;
    [].forEach.call($('sftStrip').children, function (li) {
      var y = +li.getAttribute('data-y');
      li.classList.toggle('sft-on', y === Math.min(year, 2030));
    });
    $('sftOver').hidden = !(u.excess > 0);
    if (u.excess > 0) {
      /* from 2030 the threshold is only known to be at least 2.8m, so the
         excess, and the tax on it, can only be said to be at most this */
      $('sftOverText').textContent = u.atLeast
        ? 'Chargeable excess tax at 40% on up to ' + euro(u.excess) + ' over would be at most ' + euro(u.cet) +
          ', taken when the benefit is taken. Tax paid at 20% on a lump sum, up to ' + euro(S.CREDIT_MAX) + ', can be set against it.'
        : 'Chargeable excess tax at 40% on the ' + euro(u.excess) + ' over is ' + euro(u.cet) +
          ', taken when the benefit is taken. Tax paid at 20% on a lump sum, up to ' + euro(S.CREDIT_MAX) + ', can be set against it.';
    }
    $('lumpFree').textContent = euro(l.taxFree);
    $('lumpStd').textContent = euro(l.atStandardRate);
    $('lumpTax').textContent = euro(l.standardTax);
    $('lumpInc').textContent = euro(l.asIncome);
    P.announce('The threshold for ' + yearWord(year) + ' is ' + (u.atLeast ? 'at least ' : '') + euro(u.threshold) + '. ' + say +
      ' Tax at 20% on the lump sum: ' + euro(l.standardTax) + '.');
  }

  P.wireRanges(VALTEXT, render);
  render();
})();
