/* pia.html: the same take-home money in a pension, the proposed PIA and an
   exchange-traded fund (ETF), after tax.

   Maths lives in assets/js/pia.js, covered by tests/pia.test.js; the pension
   side of it is assets/js/pension-tax-relief.js and assets/js/sft.js. This
   file reads the controls, hands the module fractions, and paints what comes
   back: three figures, three bars on one scale, the workings table and one
   spoken summary. assets/js/pb-pia-motion.js, if motion is on, moves what
   this paints; it works nothing out.

   SIMPLIFIED, 12 October 2026 (the owner: "PIA needs to be simplified
   greatly ... we don't need to know their income"): no age and no earnings.
   The pension is grossed up at the reader's rate with no age-related limit,
   and "How we worked this out" says it assumes the payments are within it.
   Growth and the PIA's two figures sit under "Assumptions".

   THE PIA'S FIGURES start at Budget 2027's (6 October 2026): 1% a year above
   EUR 50,000. The reader can change both; a cleared threshold shows a
   prompt, not a number. Still a proposal until the Finance (No. 2) Bill 2026
   passes: docs/PIA-BUDGET-DAY.md.

   THE LIMIT. A PIA takes at most EUR 12,000 a year (Budget 2027), so the
   monthly amount stops at EUR 1,000: the slider's end, and a typed figure
   above it (the shared click-to-edit lets a money figure run past its
   slider) is set back to EUR 1,000 with a line that says why. Before the
   review of 13 October 2026 a typed EUR 1,500 went into the PIA in full.
   The same amount goes into all three, so the comparison stays like for
   like.

   TONE: the figures do the work. No product is called better. */
(function () {
  'use strict';
  var Pia = window.PBPia, P = window.PBPage;
  if (!Pia || !P) return;
  var $ = P.$, euro = P.euro;

  var taxRate = 40;
  var pc = function (v) { return (Math.round(v * 100) / 100).toLocaleString('en-IE') + '%'; };
  var years = function (n) { return n + (n === 1 ? ' year' : ' years'); };
  var less = function (v) { return v >= 0.5 ? '−' + euro(v) : euro(0); };   /* no minus on €0 */
  var NONE = 'No figure yet';
  var VALTEXT = {
    amount: function (v) { return euro(v) + ' a month'; },
    years: function (v) { return years(v); },
    growth: function (v) { return pc(v) + ' a year'; },
    piaRate: function (v) { return pc(v) + ' a year' + (+v === 1 ? ', the Budget 2027 rate' : ', a figure you are trying'); }
  };

  /* the PIA's limit, a month; and whether the last figure typed was over it */
  var MAX = 1000, capped = false, lastAmount = null;
  var NOTE = 'Up to €1,000: the PIA’s €12,000 a year.', CAPPED = 'The PIA takes at most €1,000 a month.';
  function cap() {
    var r = $('amount');
    if (+r.value > MAX) {
      r.max = MAX; r.step = r.dataset.defstep || 25; r.value = MAX;
      P.paintSlider(r, VALTEXT);
      capped = true;
    } else if (lastAmount !== null && +r.value !== lastAmount) {
      capped = false;   /* moved since: the usual line again */
    }
    lastAmount = +r.value;
    var note = $('amountNote');
    if (note) {
      note.textContent = capped ? CAPPED : NOTE;
      note.classList.toggle('pia-capped', capped);
    }
  }

  /* the threshold as typed: digits only, empty means none yet */
  function threshold() {
    var s = $('piaThreshold').value.replace(/[^0-9]/g, '');
    return s === '' ? null : +s;
  }

  function read() {
    var n = function (id) { return +$(id).value; };
    return {
      monthly: n('amount'), years: n('years'), growth: n('growth') / 100,
      age: null, salary: null, taxRate: taxRate,
      piaRate: n('piaRate') / 100, piaThreshold: threshold()
    };
  }

  /* a product as its bar draws it, in euro: your money, the tax relief, the
     growth, and the tax, which comes off the end; before tax = after + tax */
  function parts(x, relief) {
    if (!x) return null;
    var rel = relief || 0, tax = Math.max(0, x.taxDuring + x.taxOut), pre = x.afterTax + tax;
    return { paid: x.paidIn, rel: rel, grow: Math.max(0, pre - x.paidIn - rel), tax: tax, after: x.afterTax, pre: pre };
  }

  var f2 = function (v) { return (Math.round(v * 100) / 100) + '%'; };
  function bar(rowId, p, max) {
    var row = $(rowId), s = row.querySelectorAll('.pia-s');
    var k = function (v) { return p ? v / max * 100 : 0; };
    var at = [[0, p ? p.paid : 0], [p ? p.paid : 0, p ? p.rel : 0],
              [p ? p.paid + p.rel : 0, p ? p.grow : 0], [p ? p.after : 0, p ? p.tax : 0]];
    for (var i = 0; i < 4; i++) {
      s[i].style.left = f2(k(at[i][0]));
      s[i].style.width = f2(k(at[i][1]));
    }
    s[3].classList.toggle('pia-zero', !p || p.tax < 0.5);
    row.classList.toggle('pia-none', !p);
  }

  function figure(id, v) {
    var el = $(id);
    el.textContent = v === null ? NONE : euro(v);
    el.setAttribute('data-v', v === null ? '' : String(Math.round(v)));
  }

  function render() {
    cap();
    var o = read(), n = o.years;
    o.path = Pia.steady(o.growth, n);       /* the reader's growth, every year */
    var c = Pia.compare(o);
    var pen = parts(c.pension, c.pension.relief), pia = parts(c.pia), etf = parts(c.etf);
    var has = pia !== null;
    $('amountV').textContent = euro(o.monthly);
    $('yearsV').textContent = n;
    $('growthV').textContent = pc(+$('growth').value);
    $('piaRateV').textContent = pc(+$('piaRate').value);
    $('advV').textContent = pc(+$('growth').value) + ' growth, PIA ' +
      (o.piaThreshold === null ? pc(+$('piaRate').value) + ', no tax-free amount yet'
                               : pc(+$('piaRate').value) + ' above ' + euro(o.piaThreshold));

    $('heroL').textContent = 'After ' + years(n) + ', after tax';
    figure('penOut', pen.after);
    figure('piaOut', has ? pia.after : null);
    figure('etfOut', etf.after);
    $('penNote').textContent = euro(pen.tax) + ' tax · normally from ' + Pia.PENSION_ACCESS_AGE;
    $('piaNote').textContent = has ? euro(pia.tax) + ' tax · any time' : 'Type a tax-free amount to see this. Budget 2027: €50,000.';
    $('etfNote').textContent = euro(etf.tax) + ' tax · any time';

    var max = Math.max(1, pen.pre, has ? pia.pre : 0, etf.pre);
    bar('rowPen', pen, max);
    bar('rowPia', pia, max);
    bar('rowEtf', etf, max);

    $('pbSay').textContent = 'Each costs you ' + euro(pen.paid) + ' from take-home pay over ' + years(n) +
      '. Only the pension adds tax relief: ' + euro(pen.rel) + '.';

    $('paidPen').textContent = $('paidPia').textContent = $('paidEtf').textContent = euro(pen.paid);
    $('relPen').textContent = euro(pen.rel);
    $('growPen').textContent = euro(pen.grow);
    $('growPia').textContent = has ? euro(pia.grow) : NONE;
    $('growEtf').textContent = euro(etf.grow);
    $('taxPen').textContent = less(pen.tax);
    $('taxPia').textContent = has ? less(pia.tax) : NONE;
    $('taxEtf').textContent = less(etf.tax);
    $('endPen').textContent = euro(pen.after);
    $('endPia').textContent = has ? euro(pia.after) : NONE;
    $('endEtf').textContent = euro(etf.after);

    if (window.PBPiaMotion) window.PBPiaMotion.update();

    P.announce((capped ? CAPPED + ' ' : '') + 'After ' + years(n) + ', after tax: pension ' + euro(pen.after) + '. PIA ' +
      (has ? euro(pia.after) : 'no figure until you type a tax-free amount') +
      '. ETF ' + euro(etf.after) + '.');
  }

  function setTax(v) {
    taxRate = v;
    $('r20').setAttribute('aria-pressed', v === 20 ? 'true' : 'false');
    $('r40').setAttribute('aria-pressed', v === 40 ? 'true' : 'false');
    $('r20').classList.toggle('on', v === 20);
    $('r40').classList.toggle('on', v === 40);
    $('taxRate').value = v + '%';   /* what the emailed result says (assets/js/pb-after.js) */
    render();
  }
  $('r20').addEventListener('click', function () { setTax(20); });
  $('r40').addEventListener('click', function () { setTax(40); });
  $('piaThreshold').addEventListener('input', render);

  P.wireRanges(VALTEXT, render);
  setTax(40);
})();
