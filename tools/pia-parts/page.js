/* pia.html, the same take-home cost in a pension, the proposed PIA and an
   ETF outside a wrapper.

   Maths lives in assets/js/pia.js, covered by tests/pia.test.js; the pension
   side of it is assets/js/pension-tax-relief.js and assets/js/sft.js. This
   file reads the controls, hands the module fractions, and paints what comes
   back: three figures, the scenario table, the tax table and one spoken
   summary.

   NO PIA FIGURE IS A DEFAULT. The rate starts at 0% and the threshold field
   starts empty, and until the reader types a threshold the PIA shows a
   prompt, not a number. Budget 2027 (6 October 2026) announces both:
   docs/PIA-BUDGET-DAY.md.

   TONE: the figures do the work. No product is called better, and the page
   says where each figure leaves things out. */
(function () {
  'use strict';
  var Pia = window.PBPia, P = window.PBPage;
  if (!Pia || !P) return;
  var $ = P.$, euro = P.euro;

  var taxRate = 40;
  var pc = function (v) { return (Math.round(v * 100) / 100).toLocaleString('en-IE') + '%'; };
  var years = function (n) { return n + (n === 1 ? ' year' : ' years'); };
  var NONE = 'No figure yet';
  var VALTEXT = {
    amount: function (v) { return euro(v) + ' a month'; },
    years: function (v) { return years(v); },
    growth: function (v) { return pc(v) + ' a year'; },
    piaRate: function (v) { return pc(v) + ' a year, a figure you are trying, not an announced rate'; },
    age: function (v) { return v + ' years old'; },
    salary: function (v) { return euro(v) + ' a year'; }
  };

  /* the threshold as typed: digits only, empty means none yet */
  function threshold() {
    var s = $('piaThreshold').value.replace(/[^0-9]/g, '');
    return s === '' ? null : +s;
  }

  function read() {
    var n = function (id) { return +$(id).value; };
    return {
      monthly: n('amount'), years: n('years'), growth: n('growth') / 100,
      age: n('age'), salary: n('salary'), taxRate: taxRate,
      piaRate: n('piaRate') / 100, piaThreshold: threshold()
    };
  }

  function outTax(v) { return v < -0.5 ? euro(-v) + ' back' : euro(Math.max(0, v)); }

  function render() {
    var o = read(), s = Pia.scenarios(o), c = s.yours, n = o.years;
    $('amountV').textContent = euro(o.monthly);
    $('yearsV').textContent = n;
    $('growthV').textContent = pc(+$('growth').value);
    $('piaRateV').textContent = pc(+$('piaRate').value);
    $('ageV').textContent = o.age;
    $('salaryV').textContent = euro(o.salary);

    $('heroL').textContent = 'What each could leave you after ' + years(n) + ', after its tax';
    $('penOut').textContent = euro(c.pension.afterTax);
    $('penNote').textContent = c.pension.beforeAccess
      ? 'You would be ' + c.pension.endAge + '. A pension is normally taken from ' + Pia.PENSION_ACCESS_AGE + '.'
      : 'You would be ' + c.pension.endAge + '. After tax on the way out.';
    $('etfOut').textContent = euro(c.etf.afterTax);

    var has = c.pia !== null;
    $('piaOut').textContent = has ? euro(c.pia.afterTax) : NONE;
    $('piaNote').textContent = !has
      ? 'Type a threshold to see this. Neither the threshold nor the rate has been announced: try any figure.'
      : o.piaRate === 0
        ? 'At a 0% rate there is no PIA tax at all. Try a rate: none has been announced.'
        : 'At the rate and threshold you chose, not announced figures.';

    var say = 'Each costs you ' + euro(c.pension.paidIn) + ' from take-home pay over ' + years(n) + '. The pension gets ' +
      euro(c.pension.relief) + ' of tax relief going in and is taxed on the way out.';
    if (has && c.pia.taxDuring >= 0.5) say += ' The PIA pays ' + euro(c.pia.taxDuring) + ' in yearly tax at the figures you chose.';
    $('pbSay').textContent = say;

    $('scYours').textContent = pc(+$('growth').value) + ' a year';
    $('scLower').textContent = pc(+$('growth').value * Pia.LOWER_SHARE) + ' a year';
    ['yours', 'lower', 'fall'].forEach(function (k) {
      var cap = k.charAt(0).toUpperCase() + k.slice(1);
      $('pen' + cap).textContent = euro(s[k].pension.afterTax);
      $('pia' + cap).textContent = s[k].pia ? euro(s[k].pia.afterTax) : NONE;
      $('etf' + cap).textContent = euro(s[k].etf.afterTax);
    });
    var f = s.fall.pia;
    $('fallLine').textContent = f && f.taxedLossYears
      ? 'In the fall, the PIA still pays ' + euro(f.taxes[f.taxes.length - 1]) + ' of tax for the year it lost money.'
      : 'In a fall, the PIA’s tax is still due for that year.';

    $('paidPen').textContent = $('paidPia').textContent = $('paidEtf').textContent = euro(c.pension.paidIn);
    $('relPen').textContent = euro(c.pension.relief);
    $('outPen').textContent = euro(c.pension.taxOut);
    $('endPen').textContent = euro(c.pension.afterTax);
    $('growPia').textContent = has ? euro(c.pia.taxDuring) : NONE;
    $('endPia').textContent = has ? euro(c.pia.afterTax) : NONE;
    $('growEtf').textContent = euro(c.etf.taxDuring);
    $('outEtf').textContent = outTax(c.etf.taxOut);
    $('endEtf').textContent = euro(c.etf.afterTax);

    P.announce('After ' + years(n) + ', after tax: pension ' + euro(c.pension.afterTax) + '. PIA ' +
      (has ? euro(c.pia.afterTax) + ' at the figures you chose' : 'no figure until you type a threshold') +
      '. ETF ' + euro(c.etf.afterTax) + '.');
  }

  function setTax(v) {
    taxRate = v;
    $('r20').setAttribute('aria-pressed', v === 20 ? 'true' : 'false');
    $('r40').setAttribute('aria-pressed', v === 40 ? 'true' : 'false');
    $('r20').classList.toggle('on', v === 20);
    $('r40').classList.toggle('on', v === 40);
    render();
  }
  $('r20').addEventListener('click', function () { setTax(20); });
  $('r40').addEventListener('click', function () { setTax(40); });
  $('piaThreshold').addEventListener('input', render);

  P.wireRanges(VALTEXT, render);
  setTax(40);
})();
