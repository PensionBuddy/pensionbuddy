/* pension-fees-calculator.html, what a pension's charges cost (Run 20 #3;
   simplified 12 October 2026, Damian: "simplify all the calculators").

   Maths lives in assets/js/pension-fees.js, covered by
   tests/pension-fees.test.js. This file reads the sliders, hands the module
   fractions (the sliders are in percent), and paints what comes back: the
   two pots, the sentence, the chart, the workings and one spoken summary.
   Growth is no longer a slider: risk level 4 of assets/js/pb-assumptions.js,
   5% a year before charges, the pension calculator's own figure; #growth
   holds it for the scripts that read it (pb-after.js).

   Point at the chart, or drag a finger along it, and a line follows with
   that year's three pots and what your plan's charges have taken by then:
   the module's own yearly figures, nothing worked out here.

   TONE: the figures do the work. No provider is named, nobody's charges
   are called too high, and the line under the figures says what a lower
   charge can cost in other ways. */
(function () {
  'use strict';
  var Fees = window.PBFees, P = window.PBPage;
  if (!Fees || !P) return;
  var $ = P.$, euro = P.euro;
  var GROWTH = window.PBAssume ? Math.round(PBAssume.level(4).rate * 1000) / 10 : 5;
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

  function read() {
    var n = function (id) { return +$(id).value; };
    return {
      pot: n('pot'), monthly: n('monthly'), years: n('years'), growth: n('growth') / 100,
      a: { amc: n('amcA') / 100, contribution: n('feeA') / 100 },
      b: { amc: n('amcB') / 100, contribution: n('feeB') / 100 }
    };
  }

  /* One SVG: the no-charge line, the other plan, your plan, on one scale
     from nothing to the no-charge pot at retirement, the highest point. */
  var NS = 'http://www.w3.org/2000/svg';
  var G = { W: 600, H: 250, L: 4, R: 4, T: 26, B: 28 };
  var last = null;   // the figures the chart was last drawn from, for the pointer line
  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function chart(c, n) {
    var W = G.W, H = G.H, L = G.L, R = G.R, T = G.T, B = G.B;
    var top = Math.max.apply(null, c.none.yearly.concat(c.a.yearly, c.b.yearly)) || 1;
    var x = function (i) { return L + (W - L - R) * (n ? i / n : 0); };
    var y = function (v) { return T + (H - T - B) * (1 - v / top); };
    var line = function (arr) { return arr.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' '); };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y(0), y2: y(0), 'class': 'fee-grid' }));
    svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y(top), y2: y(top), 'class': 'fee-grid' }));
    svg.appendChild(svgEl('text', { x: L, y: T - 8 }, euro(top)));
    /* what your plan's charges take, from the no-charge line down to your
       plan's line; drawn first, under the lines, and the other plan's line
       keeps a white edge where it crosses it */
    var back = c.a.yearly.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).reverse().join(' ');
    svg.appendChild(svgEl('polygon', { points: line(c.none.yearly) + ' ' + back, 'class': 'fee-gap' }));
    svg.appendChild(svgEl('polyline', { points: line(c.none.yearly), 'class': 'fee-l-none' }));
    svg.appendChild(svgEl('polyline', { points: line(c.b.yearly), 'class': 'fee-l-b-edge' }));
    svg.appendChild(svgEl('polyline', { points: line(c.b.yearly), 'class': 'fee-l-b' }));
    svg.appendChild(svgEl('polyline', { points: line(c.a.yearly), 'class': 'fee-l-a' }));
    svg.appendChild(svgEl('text', { x: L, y: H - 6 }, 'Now'));
    svg.appendChild(svgEl('text', { x: W - R, y: H - 6, 'text-anchor': 'end' }, 'In ' + years(n)));
    var box = $('feeChart');
    box.textContent = '';
    box.appendChild(svg);
    box.setAttribute('aria-label', 'Your pot, year by year, over ' + years(n) + '. At retirement: ' +
      euro(c.a.pot) + ' with your plan’s charges, ' + euro(c.b.pot) + ' with the other plan’s, and ' +
      euro(c.none.pot) + ' with no charges at all.' +
      (c.costA >= 0.5 ? ' The red area is what your plan’s charges take: ' + euro(c.costA) + ' by retirement.' : ''));
    last = { c: c, n: n, x: x, y: y, svg: svg };
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
      ['none', 'b', 'a'].forEach(function (k) { g.appendChild(svgEl('circle', { 'class': 'fee-dot fee-dot-' + k, r: 6 })); });
      svg.appendChild(g);
    }
    var x = last.x(i);
    g.firstChild.setAttribute('x1', x); g.firstChild.setAttribute('x2', x);
    [['none', c.none.yearly[i]], ['b', c.b.yearly[i]], ['a', c.a.yearly[i]]].forEach(function (p) {
      var d = g.querySelector('.fee-dot-' + p[0]); d.setAttribute('cx', x); d.setAttribute('cy', last.y(p[1]));
    });
    var tip = $('feeTip');
    tip.innerHTML = '<span class="fee-tip-y">' + (i === 0 ? 'Now' : 'In ' + years(i)) + '</span>' +
      '<span class="fee-tip-r">Your plan <b>' + euro(c.a.yearly[i]) + '</b></span>' +
      '<span class="fee-tip-r">Other plan <b>' + euro(c.b.yearly[i]) + '</b></span>' +
      '<span class="fee-tip-r">No charges <b>' + euro(c.none.yearly[i]) + '</b></span>' +
      '<span class="fee-tip-r fee-tip-take">Your charges have taken <b>' + euro(c.none.yearly[i] - c.a.yearly[i]) + '</b></span>';
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

  function sentence(c, n) {
    var first = c.costA >= 0.5
      ? 'Over ' + years(n) + ', your plan’s charges would leave your pot about ' + euro(c.costA) + ' smaller than with no charges.'
      : 'Over ' + years(n) + ', with no charges on your plan, nothing would be taken out of your pot.';
    var second = c.difference >= 0.5
      ? 'With the other plan’s charges, you would have about ' + euro(c.difference) + ' more at retirement.'
      : c.difference <= -0.5
        ? 'With the other plan’s charges, you would have about ' + euro(-c.difference) + ' less at retirement.'
        : 'The other plan’s charges come out the same.';
    return first + ' ' + second;
  }

  function render() {
    var o = read(), c = Fees.compare(o), n = o.years;
    $('potV').textContent = euro(o.pot);
    $('monthlyV').textContent = euro(o.monthly);
    $('yearsV').textContent = n;
    ['amcA', 'feeA', 'amcB', 'feeB'].forEach(function (id) { $(id + 'V').textContent = pc(+$(id).value); });
    $('feeOtherV').textContent = pc(+$('amcB').value) + ' a year, ' + pc(+$('feeB').value) + ' on payments';
    /* the two figures roll to their new values (assets/js/pb-fee-motion.js,
       only with motion on); without it they are written as they are */
    var roll = window.PBFeeMotion ? window.PBFeeMotion.figure : function (el, v) { el.textContent = euro(v); };
    roll($('potA'), c.a.pot);
    roll($('potB'), c.b.pot);
    var say = sentence(c, n);
    $('pbSay').textContent = say;
    $('amcPaidA').textContent = euro(c.a.amcPaid);
    $('amcPaidB').textContent = euro(c.b.amcPaid);
    $('feePaidA').textContent = euro(c.a.contributionPaid);
    $('feePaidB').textContent = euro(c.b.contributionPaid);
    $('costA').textContent = euro(c.costA);
    $('costB').textContent = euro(c.costB);
    $('nonePot').textContent = euro(c.none.pot);
    chart(c, n);
    P.announce('Your plan at retirement ' + euro(c.a.pot) + '. The other plan ' + euro(c.b.pot) + '. ' + say);
  }

  /* sliders in a closed fold have no width, so repaint them as it opens */
  $('feeOther').addEventListener('toggle', function () {
    if (this.open) [].forEach.call(this.querySelectorAll('input[type=range]'), function (s) { P.paintSlider(s, VALTEXT); });
  });
  P.wireRanges(VALTEXT, render);
  render();
})();
