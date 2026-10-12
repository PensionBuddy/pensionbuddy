/* standard-fund-threshold.html (Run 20 #7; simplified 12 October 2026).

   Every figure comes from assets/js/sft.js, which carries the sources and is
   covered by tests/sft.test.js. This file reads the two sliders and the year
   chips and paints the threshold for the year chosen, the share used, the
   limit bar, the columns, the excess card and the lump sum's bands. From
   2030 the threshold follows earnings and is not known yet, so the page
   shows the least it can be and says so rather than guessing a figure.

   The columns are a control too: drag the line to move your pensions (the
   page's own slider moves with it), or tap a column to choose its year (the
   page's own chip is checked). #year holds the year for every script that
   reads it, and a value set on it from outside is followed. */
(function () {
  'use strict';
  var S = window.PBSft, P = window.PBPage;
  if (!S || !P) return;
  var $ = P.$, euro = P.euro;
  var yearWord = function (y) { return y >= 2030 ? '2030 or later' : String(y); };
  var VALTEXT = {
    total: function (v) { return euro(v); },
    lump: function (v) { return euro(v); }
  };
  var chips = [].slice.call(document.querySelectorAll('input[name="sftYear"]'));
  var cols = $('sftCols'), strip = $('sftStrip');
  var TOP_YEAR = S.threshold(S.LAST_KNOWN).value;
  var held = 0;   // the columns' scale, held while the line is dragged so it stays under the finger

  function short(v) { return '€' + (Math.round(v / 10000) / 100).toLocaleString('en-IE') + 'm'; }

  function render() {
    var total = +$('total').value, year = Math.max(2026, Math.min(2030, +$('year').value || 2026)), lump = +$('lump').value;
    var u = S.used(total, year), l = S.lumpSum(lump);
    var pc = Math.round(u.share * 100);
    chips.forEach(function (c) { c.checked = +c.value === year; });
    $('totalV').textContent = euro(total);
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

    /* the columns: every year on one scale, your pensions one line across them */
    var scale = held || Math.max(TOP_YEAR * 1.05, total * 1.08);
    var f = function (v) { return Math.max(0, Math.min(1, v / scale)); };
    [].forEach.call(strip.children, function (li) {
      var y = +li.getAttribute('data-y'), t = S.threshold(y).value;
      var fill = li.querySelector('.sft-col-fill'), over = li.querySelector('.sft-col-over');
      fill.style.height = (f(t) * 100).toFixed(2) + '%';
      over.style.bottom = (f(t) * 100).toFixed(2) + '%';
      over.style.height = (Math.max(0, f(total) - f(t)) * 100).toFixed(2) + '%';
      li.classList.toggle('sft-on', y === Math.min(year, 2030));
    });
    $('sftLine').style.setProperty('--f', f(total).toFixed(4));
    $('sftLineV').textContent = total >= 1e6 ? short(total) : euro(total);

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
    /* the lump-sum bar (Run 43): the lump sum on one bar, split by Revenue's bands,
       each part as wide as its euro (flex-grow), a part with nothing in it not drawn */
    [['sftLbFree', l.taxFree], ['sftLbStd', l.atStandardRate], ['sftLbInc', l.asIncome]].forEach(function (p) {
      var el = $(p[0]); el.style.flexGrow = String(Math.max(0, Math.round(p[1]))); el.hidden = !(p[1] > 0);
    });
    $('sftLbFreeN').textContent = euro(l.taxFree);
    $('sftLbStdN').textContent = euro(l.atStandardRate);
    $('sftLbIncN').textContent = euro(l.asIncome);
    $('sftLbIncK').hidden = !(l.asIncome > 0);
    $('lumpTax').textContent = euro(l.standardTax);
    $('lumpInc').textContent = euro(l.asIncome);
    $('lumpIncLine').hidden = !(l.asIncome > 0);
    P.announce('The threshold for ' + yearWord(year) + ' is ' + (u.atLeast ? 'at least ' : '') + euro(u.threshold) + '. ' + say +
      ' Tax at 20% on the lump sum: ' + euro(l.standardTax) + '.');
  }

  function setYear(y) {
    if (+$('year').value === y) return;
    $('year').value = y;
    render();
  }
  chips.forEach(function (c) { c.addEventListener('change', function () { if (c.checked) setYear(+c.value); }); });
  $('year').addEventListener('input', render);

  /* drag the line; tap a column */
  (function () {
    var drag = null;
    function lineY() { return $('sftLine').getBoundingClientRect().top; }
    function colArea() { var c = strip.querySelector('.sft-col').getBoundingClientRect(); return { top: c.top, h: c.height }; }
    function move(e) {
      if (!drag) return;
      var a = colArea(), f = Math.max(0, Math.min(1.04, (a.top + a.h - e.clientY) / a.h));
      var t = $('total'), step = +t.step || 25000;
      var v = Math.max(+t.min, Math.min(+t.max, Math.round(f * held / step) * step));
      if (v !== +t.value) { t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); }
      drag.moved = true;
    }
    cols.addEventListener('pointerdown', function (e) {
      if (Math.abs(e.clientY - lineY()) > 18) return;
      e.preventDefault();
      held = Math.max(TOP_YEAR * 1.05, +$('total').value * 1.08);
      drag = { moved: false };
      cols.classList.add('sft-dragging');
      try { cols.setPointerCapture(e.pointerId); } catch (x) {}
    });
    cols.addEventListener('pointermove', move);
    function end() {
      if (!drag) return;
      drag = null; held = 0;
      cols.classList.remove('sft-dragging');
      render();
    }
    cols.addEventListener('pointerup', end);
    cols.addEventListener('pointercancel', end);
    strip.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-y]');
      if (li) setYear(+li.getAttribute('data-y'));
    });
  })();

  P.wireRanges(VALTEXT, render);
  render();
})();
