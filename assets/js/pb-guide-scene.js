/* The guides' figures (12 October 2026, Damian: "The animation for pensions
   after 50 is shocking ... a lot simpler, explained well"; "The UK pension
   animation is shocking ... simplified, more visual"). These replace the
   hourglass, the boat, the invoices and the pipe of 9 October.

   One figure per guide, in the section whose idea it shows (.pb-gx):

     pensions-over-50.html        an annuity and an Approved Retirement Fund
                                  (ARF) as markets rise or fall
     uk-pensions-in-ireland.html  where a UK pension can go: left in the UK,
                                  to a QROPS here, or anywhere else
     self-employed-pensions.html  EUR 100 into your pension, and what it
                                  costs you at each rate of tax
     director-pension-rules.html  company payments into a PRSA against 100%
                                  of your pay

   Each is plain HTML and CSS: every word and the end state are in the page
   with no script and no motion, and say nothing the guide does not. This
   file only:
     - works a figure's one control: two buttons (data-v on the figure,
       aria-pressed, the words that name the state, data-t-<state>) or the
       directors' slider (the bars' widths, its own value and spoken value)
     - with motion on, holds each figure, and each relief ladder (.pb-lad),
       at its start and plays it once as it comes into view; the UK figure
       can be played again
   It moves marks only, never words; stores nothing; sends nothing. */
(function () {
  'use strict';
  var root = document.documentElement;
  var figs = [].slice.call(document.querySelectorAll('.pb-gx[data-pb-gx]'));
  var lads = [].slice.call(document.querySelectorAll('.pb-lad'));
  if (!figs.length && !lads.length) { return; }

  /* ---- the two-button control ---- */
  function pill(seg) {
    var b = seg.querySelector('button[aria-pressed="true"]');
    if (!b || !b.offsetWidth) { return; }
    var first = !seg.classList.contains('pb-gx-pill');
    if (first) { seg.classList.add('pb-gx-reset'); }
    seg.style.setProperty('--x', b.offsetLeft + 'px');
    seg.style.setProperty('--w', b.offsetWidth + 'px');
    seg.classList.add('pb-gx-pill');
    if (first) { void seg.offsetWidth; seg.classList.remove('pb-gx-reset'); }
  }
  function choose(f, v) {
    f.setAttribute('data-v', v);
    [].forEach.call(f.querySelectorAll('.pb-gx-seg button[data-v]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v));
    });
    [].forEach.call(f.querySelectorAll('[data-t-' + v + ']'), function (el) {
      var t = el.getAttribute('data-t-' + v);
      if (el.textContent !== t) { el.textContent = t; }
    });
    var seg = f.querySelector('.pb-gx-seg');
    if (seg) { pill(seg); }
  }

  /* ---- the directors' slider ---- */
  function slider(f, r) {
    var out = f.querySelector('output');
    function paint() {
      var p = +r.value, ok = Math.min(p, 100), ov = Math.max(0, p - 100);
      f.style.setProperty('--ok', ok / 2 + '%');
      f.style.setProperty('--ov', ov / 2 + '%');
      f.classList.toggle('pb-gx-over', ov > 0);
      if (out) { out.textContent = p + '% of your pay'; }
      r.setAttribute('aria-valuetext', p + '% of your pay: ' +
        (ov ? '100% tax-free for you, ' + ov + '% a taxable benefit-in-kind' : 'all tax-free for you'));
      r.style.setProperty('--fill', ((p - r.min) / (r.max - r.min) * 100).toFixed(2) + '%');
    }
    r.addEventListener('input', paint);
    paint();
  }

  figs.forEach(function (f) {
    var seg = f.querySelector('.pb-gx-seg');
    if (seg) {
      choose(f, f.getAttribute('data-v') || seg.querySelector('button[data-v]').getAttribute('data-v'));
      seg.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button[data-v]') : null;
        if (b) { choose(f, b.getAttribute('data-v')); }
      });
      /* the words that change are announced only once the reader changes them */
      [].forEach.call(f.querySelectorAll('[data-pb-live]'), function (el) { el.setAttribute('aria-live', 'polite'); });
      window.addEventListener('resize', function () { pill(seg); });
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { pill(seg); }); }
    }
    var r = f.querySelector('input[type=range]');
    if (r) { slider(f, r); }
  });

  /* ---- played once, as each comes into view ---- */
  if (!root.classList.contains('pb-motion') || !('IntersectionObserver' in window)) { return; }
  var all = figs.concat(lads);
  function play(el) { requestAnimationFrame(function () { el.classList.add('pb-gx-in'); }); }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); play(e.target); } });
  }, { threshold: 0.35 });
  /* armed without a transition, so nothing drawn is seen to empty itself */
  all.forEach(function (el) { el.classList.add('pb-gx-reset', 'pb-gx-arm'); });
  void document.body.offsetWidth;
  all.forEach(function (el) { el.classList.remove('pb-gx-reset'); io.observe(el); });

  figs.forEach(function (f) {
    var again = f.querySelector('.pb-gx-replay');
    if (!again) { return; }
    again.addEventListener('click', function () {
      f.classList.add('pb-gx-reset');
      f.classList.remove('pb-gx-in');
      void f.offsetWidth;
      f.classList.remove('pb-gx-reset');
      play(f);
    });
  });

  /* motion turned off part way, or the page printed: everything at its end, now */
  function settle() { all.forEach(function (el) { io.unobserve(el); el.classList.remove('pb-gx-arm'); el.classList.add('pb-gx-in'); }); }
  document.addEventListener('pb:motion', function (e) { if (!(e.detail && e.detail.motion)) { settle(); } });
  window.addEventListener('beforeprint', settle);
}());
