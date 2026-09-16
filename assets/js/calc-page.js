/* The shared runtime behind every calculator page's controls.

   What a calculator page does divides in two. Working a figure out is the job
   of a calculation module: assets/js/state-pension.js, autoenrolment.js and
   the rest, each covered by its own suite. Putting that figure on the screen
   is this file: the money and percentage formats, the slider fill, the
   aria-valuetext every slider carries, and the one debounced live region. Five
   pages held a copy of all of it and the copies had already drifted apart, in
   two ways worth naming because the merge settled both:

     aria-valuetext   the two hand-written calculators set it on every slider,
                      falling back to euro formatting for the ones with no
                      wording of their own; the three assembled pages set it
                      only where wording existed. The complete version wins. It
                      reads the same on all five pages because every slider on
                      those three already has an entry, so the fallback is
                      unreachable there: proven, not assumed, by the
                      render-diff sweep.

     pct              one copy rounded to one decimal, one to two. Two wins,
                      because it rounds less. Neither copy could ever show a
                      second decimal: the compare page's rates are multiples of
                      half a percent and the entitlement page's fractions are
                      multiples of 52/2080, which is 2.5% exactly. So the
                      disagreement was invisible, and settling it changes
                      nothing a reader sees.

   WHAT IS NOT HERE. announce() is a 700ms debounce, and only three of the five
   pages debounce their screen-reader summary; the two State Pension pages
   write theirs straight through inside render(). Routing them through this
   would empty the live region for 700ms after every change, which is a change
   to what a screen reader receives, not a refactor. They keep their own line.

   NOTHING IS DECLARED AT TOP LEVEL. This loads as a classic script ahead of
   each page's own classic script, and a top-level `const $` in two classic
   scripts on one page is a SyntaxError that kills the second. One namespace,
   and the pages read what they need off it. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBPage = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* Whole euro reads better in a sentence; the cents matter in a headline
     figure. Both formats exist on purpose and neither is the default. */
  var euro = function (v) { return '€' + Math.round(v).toLocaleString('en-IE'); };
  var euro2 = function (v) {
    return '€' + v.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  var num = function (v) { return v.toLocaleString('en-IE'); };
  /* a year is a label, not a quantity, so it never takes a thousands separator */
  var yr = function (v) { return String(v); };
  var pct = function (v) { return num(Math.round(v * 10000) / 100) + '%'; };

  /* The fill behind the thumb is a CSS custom property, because the track is
     drawn by the stylesheet and only the proportion is the script's business.
     The aria-valuetext is set on every slider: a screen reader otherwise
     announces a bare number, and "50000" is not a salary. A page passes its
     own wording; a slider with none gets the euro format, which is what the
     money sliders on the two hand-written calculators rely on. */
  function paintSlider(el, valtext) {
    var min = +el.min || 0, max = +el.max || 100, v = +el.value;
    el.style.setProperty('--fill', ((v - min) / (max - min)) * 100 + '%');
    el.setAttribute('aria-valuetext', ((valtext && valtext[el.id]) || euro)(v));
  }

  /* Every range on the page, painted now and repainted on every move, with the
     page's own handler in between. Selecting them rather than naming them is
     what stops a slider added to the markup from silently going unwired. */
  function wireRanges(valtext, onInput) {
    document.querySelectorAll('input[type=range]').forEach(function (el) {
      paintSlider(el, valtext);
      el.addEventListener('input', function () {
        paintSlider(el, valtext);
        if (onInput) onInput(el);
      });
    });
  }

  /* One spoken summary rather than a dozen fragments, and not until the reader
     has stopped dragging: a live region updated on every frame of a drag is
     unusable. The delay is also why two of the five pages do not use it; see
     WHAT IS NOT HERE above. */
  var srTimer = null;
  function announce(text) {
    clearTimeout(srTimer);
    srTimer = setTimeout(function () { $('srSummary').textContent = text; }, 700);
  }

  return {
    $: $,
    euro: euro,
    euro2: euro2,
    num: num,
    pct: pct,
    yr: yr,
    paintSlider: paintSlider,
    wireRanges: wireRanges,
    announce: announce
  };
}));
