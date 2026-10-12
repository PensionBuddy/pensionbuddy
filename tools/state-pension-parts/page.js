/* state-pension-reality-check.html

   Maths lives in assets/js/state-pension.js, which is the single source of
   truth and is covered by tests/state-pension.test.js. This file only reads
   the one control and paints the panels, so the page cannot hold a second
   copy of the rules.

   12 October 2026 (Damian: simplify): one control, the PRSI record. The age
   slider is gone: it changed nothing in the pension figure (spec S4, "What
   age is for"). Each living standard is a bar, the share covered and the
   monthly shortfall, and nothing else; the yearly figures stay in the
   spoken summary.

   TONE: the Pensions Council's figures do the work. State the difference
   and stop. No pressure language, no urgency. */
const SP = window.PBStatePension;

/* Formatting, the slider fill and the wiring are the same on every
   calculator and live in assets/js/calc-page.js. */
const { $, euro, euro2, num, wireRanges } = window.PBPage;

/* Screen readers otherwise announce a bare number. */
const VALTEXT = {
  contribs: v => num(v) + ' reckonable contributions, ' + (v / 52) + ' years'
};

function render() {
  const contribs = +$('contribs').value;
  const res = SP.statePension(contribs);
  const years = contribs / 52;

  $('contribsV').textContent = num(contribs);

  $('spHas').hidden = !res.eligible;
  $('spNone').hidden = res.eligible;

  const annualCents = res.eligible ? res.annualCents : 0;

  if (res.eligible) {
    $('spWeekly').textContent = euro2(res.weekly);
    $('spAnnual').textContent = euro(res.annual);
    const pctOfMax = Math.round(res.fraction * 100);
    $('spFoot').innerHTML = res.fraction === 1
      ? 'The maximum rate, which takes a full 2,080 reckonable contributions, or forty years.'
      : num(contribs) + ' contributions is ' + years + (years === 1 ? ' year' : ' years') +
        ', <b>' + pctOfMax + '%</b> of a full record, so the rate is ' + pctOfMax + '% of the maximum.';
  } else {
    $('spNoneFoot').innerHTML = num(contribs) + ' contributions is ' + years +
      (years === 1 ? ' year' : ' years') + '. <b>' + num(res.shortBy) +
      ' more</b> would bring the total to 520, the minimum. The 520 must be paid contributions.';
  }

  /* Each bar is drawn against its own standard, so the fill reads as "how
     much of this standard the State Pension covers". */
  const gaps = SP.gaps(annualCents);
  gaps.forEach(g => {
    const row = document.querySelector('.lsrow[data-std="' + g.standard + '"]');
    const covered = Math.max(0, Math.min(1, annualCents / g.targetCents));
    row.querySelector('.lsbar i').style.width = (covered * 100) + '%';
    row.querySelector('.lspct').textContent = Math.round(covered * 100) + '%';
    row.querySelector('.lsmon').textContent = euro(Math.max(0, g.gapMonthly));
    row.classList.toggle('is-covered', g.covered && res.eligible);
  });

  /* One spoken summary rather than eight fragments. */
  $('srSummary').textContent = res.eligible
    ? 'State Pension ' + euro2(res.weekly) + ' a week, ' + euro(res.annual) +
      ' a year. Against a modest standard of living that is ' + euro(gaps[0].gapAnnual) +
      ' a year short, moderate ' + euro(gaps[1].gapAnnual) + ' short, comfortable ' +
      euro(gaps[2].gapAnnual) + ' short.'
    : 'With ' + num(contribs) + ' reckonable contributions there is no State Pension (Contributory) entitlement. ' +
      num(res.shortBy) + ' more contributions would bring the total to 520. Qualifying needs 520 paid contributions.';
}

wireRanges(VALTEXT, render);
render();

/* ---- the record: forty dots ------------------------------------------

   One dot per 52 reckonable contributions, filling bottom row up. It is a
   second reading of the number the slider already carries, so it is
   decorative: aria-hidden in the markup, no live region, and nothing here is
   part of the pension calculation. It has its own listener rather than a
   line inside render(), so render() stays the page's whole calculation.

   WRITES ARE GUARDED BY AN EXPLICIT READ, so a drag frame that changes
   nothing writes nothing (and assets/js/pb-sp-motion.js, which watches the
   dots' classes, sees only real changes). */
function paintJar() {
  var jar = $('pbJar');
  var slider = $('contribs');
  if (!jar || !slider) return;
  var dots = document.querySelectorAll('.pb-jar-dot');
  if (!dots.length) return;

  /* one dot per 52, clamped to the dots that exist */
  var max = dots.length * 52;
  var v = +slider.value;
  if (!(v > 0)) v = 0;
  if (v > max) v = max;
  var lit = Math.floor(v / 52);

  for (var i = 0; i < dots.length; i++) {
    var want = i < lit;
    if (dots[i].classList.contains('pb-on') !== want) dots[i].classList.toggle('pb-on', want);
  }

  var full = lit >= dots.length;
  if (jar.classList.contains('pb-full') !== full) jar.classList.toggle('pb-full', full);

  var cap = $('pbJarCap');
  if (cap) {
    var text = lit + ' of ' + dots.length + (dots.length === 1 ? ' year' : ' years');
    if (cap.textContent !== text) cap.textContent = text;
  }
  var tag = $('pbJarFull');
  if (tag && tag.hidden === full) tag.hidden = !full;
}

/* THE DOTS ARE ALSO THE CONTROL. Pressing a dot fills the record to it, and
   dragging keeps filling, so the picture and the control are one object.

   The slider stays, and stays the accessible control: the dots are
   aria-hidden, cannot take focus and have no keyboard behaviour. This is a
   second, pointer-only way to reach the same value, which is why it sets the
   slider and lets the slider's own input event do everything else.

   With a mouse, hovering previews the record the press would set: the dots up
   to the pointer take a slate ring (the reader's own mark, not the State's
   teal). Everything is behind feature checks, so a DOM without layout or
   pointer events sees the page exactly as it was. */
function initJarPointer() {
  var bodies = document.querySelectorAll('.pb-jar-body');
  var grids = document.querySelectorAll('.pb-jar-dots');
  var dots = document.querySelectorAll('.pb-jar-dot');
  var slider = $('contribs');
  if (!bodies.length || !grids.length || !dots.length || !slider) return;
  var body = bodies[0], grid = grids[0];
  if (!body.addEventListener || typeof window.PointerEvent === 'undefined' ||
      typeof getComputedStyle !== 'function' || typeof grid.getBoundingClientRect !== 'function') return;

  /* the dot under the pointer, as a count of years (1 to 40) */
  function countAt(e) {
    var cols = getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
    if (!(cols > 0)) return null;
    var rows = Math.ceil(dots.length / cols);
    var r = grid.getBoundingClientRect();
    if (!(r.width > 0) || !(r.height > 0)) return null;
    var col = Math.floor((e.clientX - r.left) / (r.width / cols));
    var fromTop = Math.floor((e.clientY - r.top) / (r.height / rows));
    if (col < 0) col = 0; else if (col > cols - 1) col = cols - 1;
    if (fromTop < 0) fromTop = 0; else if (fromTop > rows - 1) fromTop = rows - 1;
    /* the grid is flipped in CSS so it fills from the bottom: the top visual
       row is the LAST row in document order */
    var idx = (rows - 1 - fromTop) * cols + col;
    if (idx > dots.length - 1) idx = dots.length - 1;
    return idx + 1;
  }

  function apply(e, press) {
    var n = countAt(e);
    if (n === null) return;
    /* a press (not a drag) on the first dot of a record one year long empties
       it, so the record can be taken to nothing by pointer too */
    var v = (press && n === 1 && +slider.value === 52) ? 0 : n * 52;
    if (+slider.value === v) return;
    slider.value = v;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* the preview marks only the dots a press would change: a seed in each
     socket that would fill, a faded disc in each that would empty */
  var peekN = 0;
  function peek(n) {
    if (n === peekN) return;
    peekN = n;
    var lit = Math.floor(+slider.value / 52);
    for (var i = 0; i < dots.length; i++) {
      var add = n > 0 && i < n && i >= lit, cut = n > 0 && i >= n && i < lit;
      if (dots[i].classList.contains('pb-peek-add') !== add) dots[i].classList.toggle('pb-peek-add', add);
      if (dots[i].classList.contains('pb-peek-cut') !== cut) dots[i].classList.toggle('pb-peek-cut', cut);
    }
  }

  body.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    try { body.setPointerCapture(e.pointerId); } catch (err) {}
    peekN = -1; peek(0);
    apply(e, true);
    e.preventDefault();
  });
  body.addEventListener('pointermove', function (e) {
    if (body.hasPointerCapture && body.hasPointerCapture(e.pointerId)) { apply(e, false); return; }
    if (e.pointerType === 'mouse') peek(countAt(e) || 0);
  });
  body.addEventListener('pointerleave', function () { peek(0); });
  body.addEventListener('pointerup', function () { peekN = -1; peek(0); });
}

function initJar() {
  var slider = $('contribs');
  if (!slider || !$('pbJar')) return;
  slider.addEventListener('input', paintJar);
  paintJar();
  initJarPointer();
}

initJar();
