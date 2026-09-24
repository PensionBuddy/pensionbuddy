/* pension-fees-calculator.html, what a pension's charges cost (Run 20 #3).

   Maths lives in assets/js/pension-fees.js, covered by
   tests/pension-fees.test.js. This file reads the sliders, hands the module
   fractions (the sliders are in percent), and paints what comes back: the
   two pots, the sentence, the table, the chart and one spoken summary.

   TONE: the figures do the work. No provider is named, nobody's charges
   are called too high, and the card beside the figures says what a lower
   charge can cost in other ways. */
(function () {
  'use strict';
  var Fees = window.PBFees, P = window.PBPage;
  if (!Fees || !P) return;
  var $ = P.$, euro = P.euro;

  var pc = function (v) { return (Math.round(v * 100) / 100).toLocaleString('en-IE') + '%'; };
  var years = function (n) { return n + (n === 1 ? ' year' : ' years'); };
  var VALTEXT = {
    pot: function (v) { return euro(v); },
    monthly: function (v) { return euro(v) + ' a month'; },
    years: function (v) { return years(v); },
    amcA: function (v) { return pc(v) + ' a year'; },
    feeA: function (v) { return pc(v) + ' of each payment'; },
    amcB: function (v) { return pc(v) + ' a year'; },
    feeB: function (v) { return pc(v) + ' of each payment'; },
    growth: function (v) { return pc(v) + ' a year'; }
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
  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function chart(c, n) {
    var W = 600, H = 250, L = 4, R = 4, T = 26, B = 28;
    var top = Math.max.apply(null, c.none.yearly.concat(c.a.yearly, c.b.yearly)) || 1;
    var x = function (i) { return L + (W - L - R) * (n ? i / n : 0); };
    var y = function (v) { return T + (H - T - B) * (1 - v / top); };
    var line = function (arr) { return arr.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' '); };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y(0), y2: y(0), 'class': 'fee-grid' }));
    svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y(top), y2: y(top), 'class': 'fee-grid' }));
    svg.appendChild(svgEl('text', { x: L, y: T - 8 }, euro(top)));
    svg.appendChild(svgEl('polyline', { points: line(c.none.yearly), 'class': 'fee-l-none' }));
    svg.appendChild(svgEl('polyline', { points: line(c.b.yearly), 'class': 'fee-l-b' }));
    svg.appendChild(svgEl('polyline', { points: line(c.a.yearly), 'class': 'fee-l-a' }));
    svg.appendChild(svgEl('text', { x: L, y: H - 6 }, 'Now'));
    svg.appendChild(svgEl('text', { x: W - R, y: H - 6, 'text-anchor': 'end' }, 'In ' + years(n)));
    var box = $('feeChart');
    box.textContent = '';
    box.appendChild(svg);
    box.setAttribute('aria-label', 'Your pot, year by year, over ' + years(n) + '. At retirement: ' +
      euro(c.a.pot) + ' with your plan’s charges, ' + euro(c.b.pot) + ' with the other plan’s, and ' +
      euro(c.none.pot) + ' with no charges at all.');
  }

  function sentence(c, n) {
    var first = c.costA >= 0.5
      ? 'Over ' + years(n) + ', your plan’s charges would take about ' + euro(c.costA) + ' out of your pot.'
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
    ['amcA', 'feeA', 'amcB', 'feeB', 'growth'].forEach(function (id) { $(id + 'V').textContent = pc(+$(id).value); });
    $('potA').textContent = euro(c.a.pot);
    $('potB').textContent = euro(c.b.pot);
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

  P.wireRanges(VALTEXT, render);
  render();
})();
