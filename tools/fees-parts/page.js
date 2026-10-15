/* pension-fees-calculator.html, what a pension's charges cost (Run 20 #3;
   simplified 12 October 2026, Damian: "simplify all the calculators").

   Maths lives in assets/js/pension-fees.js, covered by
   tests/pension-fees.test.js. This file reads the sliders, hands the module
   fractions (the sliders are in percent), and paints what comes back: the
   two pots, the sentence, the chart, the workings and one spoken summary.
   Growth is no longer a slider: Since 2026-10-15 the most a projection
   may assume, 6% a year before charges (PBAssume.assets.cap), the pension
   calculator's own figure; #growth
   holds it for the scripts that read it (pb-after.js).

   Point at the chart, or drag a finger along it, and a line follows with
   that year's two pots and the difference between them: the module's own
   yearly figures, nothing worked out here.

   PLAN AGAINST PLAN (review, 13 October 2026; Damian: Irish charges are
   basis points, and the comparison is not to exaggerate). No pension has
   no charges, so the result, the sentence and the chart set your plan
   against the plan you compare it with, named by its charge ("a plan at
   0.4% a year"), never against no charges at all. The no-charge pot stays
   in the workings, where it explains what each plan's charges cost.

   TONE: the figures do the work. No provider is named, nobody's charges
   are called too high, and the line under the figures says what a lower
   charge can cost in other ways. */
(function () {
  'use strict';
  var Fees = window.PBFees, P = window.PBPage;
  if (!Fees || !P) return;
  var $ = P.$, euro = P.euro;
  var GROWTH = window.PBAssume ? Math.round(PBAssume.assets.cap * 1000) / 10 : 6;   /* 2026-10-15: 6%, as every calculator */
  $('growth').value = GROWTH;
  $('growthV').textContent = GROWTH + '%';

  var pc = function (v) { return (Math.round(v * 100) / 100).toLocaleString('en-IE') + '%'; };
  var years = function (n) { return n + (n === 1 ? ' year' : ' years'); };
  var VALTEXT = {
    pot: function (v) { return euro(v); },
    monthly: function (v) { return euro(v) + ' a month'; },
    years: function (v) { return years(v); },
    amcA: function (v) { return pc(v) + ' a year'; },
    feeA: function (v) { return pc(v) + ' of each payment'; },
    amcB: function (v) { return pc(v) + ' a year'; },
    feeB: function (v) { return pc(v) + ' of each payment'; }
  };

  /* the plan you compare yours with, named by its charges */
  function nameB(o) {
    return pc(o.b.amc * 100) + ' a year' + (o.b.contribution > 0 ? ' and ' + pc(o.b.contribution * 100) + ' on payments' : '');
  }

  function read() {
    var n = function (id) { return +$(id).value; };
    return {
      pot: n('pot'), monthly: n('monthly'), years: n('years'), growth: n('growth') / 100,
      a: { amc: n('amcA') / 100, contribution: n('feeA') / 100 },
      b: { amc: n('amcB') / 100, contribution: n('feeB') / 100 }
    };
  }

  /* One SVG: the plan you compare with and your plan, on one scale from
     nothing to the higher of the two at retirement. Between them, the
     difference, in the coral of money missing; no figure at the top of the
     axis (point at the chart for any year's). */
  var NS = 'http://www.w3.org/2000/svg';
  var G = { W: 600, H: 250, L: 4, R: 4, T: 26, B: 28 };
  var last = null;   // the figures the chart was last drawn from, for the pointer line
  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function chart(c, n, o, gap) {
    var W = G.W, H = G.H, L = G.L, R = G.R, T = G.T, B = G.B;
    var top = Math.max.apply(null, c.a.yearly.concat(c.b.yearly)) || 1;
    var x = function (i) { return L + (W - L - R) * (n ? i / n : 0); };
    var y = function (v) { return T + (H - T - B) * (1 - v / top); };
    var line = function (arr) { return arr.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' '); };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y(0), y2: y(0), 'class': 'fee-grid' }));
    /* the difference between the two plans, from the other plan's line back
       along yours; drawn first, under the lines, and the other plan's line
       keeps a white edge along it */
    var back = c.a.yearly.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).reverse().join(' ');
    svg.appendChild(svgEl('polygon', { points: line(c.b.yearly) + ' ' + back, 'class': 'fee-gap' }));
    svg.appendChild(svgEl('polyline', { points: line(c.b.yearly), 'class': 'fee-l-b-edge' }));
    svg.appendChild(svgEl('polyline', { points: line(c.b.yearly), 'class': 'fee-l-b' }));
    svg.appendChild(svgEl('polyline', { points: line(c.a.yearly), 'class': 'fee-l-a' }));
    svg.appendChild(svgEl('text', { x: L, y: H - 6 }, 'Now'));
    svg.appendChild(svgEl('text', { x: W - R, y: H - 6, 'text-anchor': 'end' }, 'In ' + years(n)));
    var box = $('feeChart');
    box.textContent = '';
    box.appendChild(svg);
    box.setAttribute('aria-label', 'Your pot, year by year, over ' + years(n) + ', under your plan’s charges and under ' +
      nameB(o) + '. At retirement: ' + euro(c.a.pot) + ' and ' + euro(c.b.pot) + '.' +
      (gap >= 1 ? ' The shaded area between them is the difference: ' + euro(gap) + '.' : ''));
    last = { c: c, n: n, x: x, y: y, svg: svg, b: nameB(o) };
    if (scrubAt != null) scrub(scrubAt);
  }

  /* ---- the pointer line ---- */
  var scrubAt = null;
  function scrub(f) {
    if (!last) return;
    var c = last.c, n = last.n, i = Math.round(Math.max(0, Math.min(1, f)) * n), svg = last.svg;
    scrubAt = f;
    var g = svg.querySelector('.fee-scrub-g');
    if (!g) {
      g = svgEl('g', { 'class': 'fee-scrub-g' });
      g.appendChild(svgEl('line', { 'class': 'fee-scrub', y1: G.T, y2: G.H - G.B }));
      ['b', 'a'].forEach(function (k) { g.appendChild(svgEl('circle', { 'class': 'fee-dot fee-dot-' + k, r: 6 })); });
      svg.appendChild(g);
    }
    var x = last.x(i);
    g.firstChild.setAttribute('x1', x); g.firstChild.setAttribute('x2', x);
    [['b', c.b.yearly[i]], ['a', c.a.yearly[i]]].forEach(function (p) {
      var d = g.querySelector('.fee-dot-' + p[0]); d.setAttribute('cx', x); d.setAttribute('cy', last.y(p[1]));
    });
    var tip = $('feeTip');
    var A = Math.round(c.a.yearly[i]), Bv = Math.round(c.b.yearly[i]);
    tip.innerHTML = '<span class="fee-tip-y">' + (i === 0 ? 'Now' : 'In ' + years(i)) + '</span>' +
      '<span class="fee-tip-r">Your plan <b>' + euro(A) + '</b></span>' +
      '<span class="fee-tip-r">At ' + last.b + ' <b>' + euro(Bv) + '</b></span>' +
      '<span class="fee-tip-r fee-tip-take">The difference <b>' + euro(Math.abs(Bv - A)) + '</b></span>';
    tip.hidden = false;
    var box = $('feeChart'), bw = box.clientWidth, px = x / G.W * bw, tw = tip.offsetWidth;
    var left = px + 14 + tw > bw ? px - 14 - tw : px + 14;
    tip.style.transform = 'translate(' + Math.max(0, Math.round(left)) + 'px,' + Math.round(G.T / G.H * box.clientHeight) + 'px)';
  }
  function unscrub() {
    scrubAt = null;
    $('feeTip').hidden = true;
    var g = last && last.svg.querySelector('.fee-scrub-g');
    if (g) g.parentNode.removeChild(g);
  }
  (function () {
    var box = $('feeChart');
    function at(e) {
      var r = box.getBoundingClientRect();
      var f = ((e.clientX - r.left) / r.width * G.W - G.L) / (G.W - G.L - G.R);
      scrub(f);
    }
    box.addEventListener('pointermove', at);
    box.addEventListener('pointerdown', at);
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') unscrub(); });
    document.addEventListener('pointerdown', function (e) { if (!box.contains(e.target)) unscrub(); });
  })();

  /* one line, plan against plan, from the two figures as shown: what you
     would have at the other plan's charges, more or less than with yours */
  function sentence(gap, o) {
    if (gap >= 1) return 'At ' + nameB(o) + ', you would have ' + euro(gap) + ' more.';
    if (gap <= -1) return 'At ' + nameB(o) + ', you would have ' + euro(-gap) + ' less.';
    return 'Both leave you the same.';
  }

  function render() {
    var o = read(), c = Fees.compare(o), n = o.years;
    var gap = Math.round(c.b.pot) - Math.round(c.a.pot);
    $('potV').textContent = euro(o.pot);
    $('monthlyV').textContent = euro(o.monthly);
    $('yearsV').textContent = n;
    ['amcA', 'feeA', 'amcB', 'feeB'].forEach(function (id) { $(id + 'V').textContent = pc(+$(id).value); });
    $('feeOtherV').textContent = pc(+$('amcB').value) + ' a year, ' + pc(+$('feeB').value) + ' on payments';
    /* the plan you compare with, named by its charges wherever it appears */
    $('potBL').textContent = 'A plan at ' + nameB(o);
    $('feeKeyB').textContent = 'A plan at ' + nameB(o);
    $('feeColB').textContent = 'At ' + nameB(o);
    /* the two figures roll to their new values (assets/js/pb-fee-motion.js,
       only with motion on); without it they are written as they are */
    var roll = window.PBFeeMotion ? window.PBFeeMotion.figure : function (el, v) { el.textContent = euro(v); };
    roll($('potA'), c.a.pot);
    roll($('potB'), c.b.pot);
    var say = sentence(gap, o);
    $('pbSay').textContent = say;
    $('amcPaidA').textContent = euro(c.a.amcPaid);
    $('amcPaidB').textContent = euro(c.b.amcPaid);
    $('feePaidA').textContent = euro(c.a.contributionPaid);
    $('feePaidB').textContent = euro(c.b.contributionPaid);
    $('costA').textContent = euro(c.costA);
    $('costB').textContent = euro(c.costB);
    $('nonePot').textContent = euro(c.none.pot);
    chart(c, n, o, Math.abs(gap));
    P.announce('Your plan at retirement ' + euro(c.a.pot) + '. A plan at ' + nameB(o) + ' ' + euro(c.b.pot) + '. ' + say);
  }

  /* sliders in a closed fold have no width, so repaint them as it opens */
  $('feeOther').addEventListener('toggle', function () {
    if (this.open) [].forEach.call(this.querySelectorAll('input[type=range]'), function (s) { P.paintSlider(s, VALTEXT); });
  });
  P.wireRanges(VALTEXT, render);
  render();
})();
