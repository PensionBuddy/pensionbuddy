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
    /* the limit bar (Run 43): the year's threshold against the total, on one scale,
       the larger of the two; it follows the sliders in the same frame */
    var top = Math.max(total, u.threshold) || 1, at = function (v) { return (v / top * 100).toFixed(2) + '%'; };
    $('sftLimFill').style.setProperty('--w', at(Math.min(total, u.threshold)));
    $('sftLimOver').style.setProperty('--from', at(u.threshold));
    $('sftLimOver').style.setProperty('--w', at(u.excess));
    $('sftLimMark').style.setProperty('--at', at(u.threshold));
    $('sftLimYou').textContent = euro(total);
    $('sftLimThrL').textContent = 'The threshold for ' + yearWord(year);
    $('sftLimThr').textContent = (u.atLeast ? 'At least ' : '') + euro(u.threshold);
    $('sftLimOvK').hidden = !(u.excess > 0);
    $('sftLimOv').textContent = (u.atLeast ? 'Up to ' : '') + euro(u.excess);
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
    /* the lump-sum bar (Run 43, item 4; INTERACTIVE-PROPOSALS-42 rank 4, adapted): the lump
       sum on one bar, split by Revenue's bands, each part as wide as its euro (flex-grow), a
       part with nothing in it not drawn. Slate in three patterns, each named in the key with
       the table's own figure; not red, since only the 20% of the middle band is tax
       (#lumpTax). No transition: it follows the slider. */
    [['sftLbFree', l.taxFree], ['sftLbStd', l.atStandardRate], ['sftLbInc', l.asIncome]].forEach(function (p) {
      var el = $(p[0]); el.style.flexGrow = String(Math.max(0, Math.round(p[1]))); el.hidden = !(p[1] > 0);
    });
    $('sftLbFreeN').textContent = euro(l.taxFree);
    $('sftLbStdN').textContent = euro(l.atStandardRate);
    $('sftLbIncN').textContent = euro(l.asIncome);
    $('sftLbIncK').hidden = !(l.asIncome > 0);
    P.announce('The threshold for ' + yearWord(year) + ' is ' + (u.atLeast ? 'at least ' : '') + euro(u.threshold) + '. ' + say +
      ' Tax at 20% on the lump sum: ' + euro(l.standardTax) + '.');
  }

  P.wireRanges(VALTEXT, render);
  render();
})();
