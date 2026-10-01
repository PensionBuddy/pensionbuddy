/*
  Slider feel (Run 37, item 9): marks on a slider's track where something
  already changes, and a quiet sign when the thumb lands on one.

  The calculators already float the value above the thumb while a slider is
  in use (the "slider polish" script every calculator carries: .slider-wrap
  and .sbubble). This adds the rest of the brief and nothing else:

    - a slider marked data-pb-ticks="relief-age" gets a mark at each age where
      Revenue's relief band changes, read from PBRelief.reliefBand() in
      assets/js/pension-tax-relief.js, never typed here; one marked
      data-pb-ticks="relief-cap" gets a mark at PBRelief.EARN_CAP, the
      earnings that count for relief
    - when the value is exactly a mark's, the bubble shows it (a ring, and
      for a reader who allows motion a short grow as the thumb arrives); the
      thumb itself covers the mark it sits on
    - the marks are drawn just under the track, inside the slider's own box
      (3px clear of the thumb), out of the flow, so nothing moves and no
      words below are touched; they are aria-hidden, since the value the
      slider announces is the same
    - nothing here writes to the calculator: it reads the slider's value and
      never sets it, sends no event and touches no figure; the slider moves in
      the same steps as before (no datalist, so the browser never snaps to a
      mark)

  Loads with the relief module on the pages that mark a slider; returns
  quietly anywhere else.
*/
(function () {
  'use strict';
  var R = window.PBRelief;
  var ranges = [].slice.call(document.querySelectorAll('input[type="range"][data-pb-ticks]'));
  if (!R || !ranges.length) { return; }
  var THUMB = 22;   /* the thumb's width in every calculator's stylesheet, as the polish script takes it */
  var GAP = 3;      /* between the thumb's foot and the marks */

  function marks(r) {
    var kind = r.getAttribute('data-pb-ticks'), min = +r.min, max = +r.max, out = [], v;
    if (kind === 'relief-age' && typeof R.reliefBand === 'function') {
      for (v = Math.ceil(min) + 1; v <= max; v++) {
        if (R.reliefBand(v) !== R.reliefBand(v - 1)) { out.push(v); }
      }
    } else if (kind === 'relief-cap' && typeof R.EARN_CAP === 'number' && R.EARN_CAP > min && R.EARN_CAP < max) {
      out.push(R.EARN_CAP);
    }
    return out;
  }

  ranges.forEach(function (r) {
    var wrap = r.parentElement, list = marks(r), ticks = [], hitT = 0;
    if (!wrap || !wrap.classList.contains('slider-wrap') || !list.length) { return; }
    var box = document.createElement('span');
    box.className = 'pb-ticks';
    box.setAttribute('aria-hidden', 'true');
    list.forEach(function (v) {
      var t = document.createElement('i');
      t.className = 'pb-tick';
      t.setAttribute('data-v', String(v));
      box.appendChild(t);
      ticks.push(t);
    });
    wrap.appendChild(box);
    var bub = wrap.querySelector('.sbubble');

    function place() {
      var min = +r.min, max = +r.max, w = r.offsetWidth;
      box.style.top = (r.offsetTop + r.offsetHeight / 2 + THUMB / 2 + GAP) + 'px';
      ticks.forEach(function (t) {
        var pct = (+t.getAttribute('data-v') - min) / (max - min);
        t.style.left = (pct * (w - THUMB) + THUMB / 2).toFixed(1) + 'px';
      });
    }
    /* the thumb covers its own mark, so the sign is on the bubble above it */
    function mark(moved) {
      var v = +r.value, on = false;
      ticks.forEach(function (t) {
        var is = +t.getAttribute('data-v') === v;
        t.classList.toggle('pb-tick-on', is);
        on = on || is;
      });
      if (!bub) { return; }
      bub.classList.toggle('pb-tick-on', on);
      clearTimeout(hitT);
      bub.classList.remove('pb-tick-hit');
      if (on && moved) {
        bub.classList.add('pb-tick-hit');
        hitT = setTimeout(function () { bub.classList.remove('pb-tick-hit'); }, 320);
      }
    }
    r.addEventListener('input', function () { mark(true); });
    /* a slider folded under "More options" has no width until it opens */
    if (window.ResizeObserver) { new ResizeObserver(place).observe(r); } else { window.addEventListener('resize', place); }
    place();
    mark(false);
  });
}());
