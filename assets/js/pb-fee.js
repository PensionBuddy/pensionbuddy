/* The fee check on the home page (tools/lead-parts/fee.html).

   Three sliders: the pension, its yearly fee, the reader's age. One number:
   what the fee takes by 66, from assets/js/pension-fees.js (6% growth, the
   most a projection may assume; no more paid in), with the pot's path with no fee and with this one drawn
   under it and the gap between them filled. "Get it checked" opens one
   field, the email, and posts the three figures and the number to Netlify
   as "fee-check" through assets/js/pb-kit.js.

   Classic script, no globals. */
(function () {
  'use strict';
  var form = document.getElementById('pbfForm');
  if (!form || !window.PBFees || !window.PBKit) return;
  var K = window.PBKit, GROWTH = 0.06, AT = 66;   // the most a pension projection may assume
  function $(id) { return document.getElementById(id); }

  var pot = $('pbfPot'), fee = $('pbfFee'), age = $('pbfAge');
  var cost = $('pbfCost'), chart = form.querySelector('.pbf-chart');
  var gap = chart.querySelector('.pbf-gap'), none = chart.querySelector('.pbf-none'), withFee = chart.querySelector('.pbf-with');
  var dotNone = chart.querySelector('.pbf-dot-none'), dotWith = chart.querySelector('.pbf-dot-with');
  var check = $('pbfCheck'), box = $('pbfMail'), email = $('pbfEmail'), err = $('pbfErr'), ok = $('pbfOk');
  var go = form.querySelector('.pbk-go');
  var last = 0;

  var OUT = { pbfPot: function (v) { return K.euro(v); }, pbfFee: function (v) { return (+v).toFixed(2) + '%'; }, pbfAge: String };

  function fill(r) {
    r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    r.setAttribute('aria-valuetext', OUT[r.id](r.value) + (r.id === 'pbfAge' ? ' years old' : ''));
  }

  function figures() {
    var years = Math.max(1, AT - +age.value);
    return PBFees.compare({ pot: +pot.value, monthly: 0, years: years, growth: GROWTH,
                            a: { amc: +fee.value / 100, contribution: 0 }, b: { amc: 0, contribution: 0 } });
  }

  /* x across the years, y up from 0 to the no-fee pot at 66 */
  function line(ys, top) {
    var n = ys.length - 1;
    return ys.map(function (v, i) {
      return (i ? 'L' : 'M') + (i / n * 600).toFixed(1) + ' ' + (200 - v / top * 190).toFixed(1);
    }).join(' ');
  }
  function shape(p, d) {
    p.setAttribute('d', d);
    p.style.d = 'path("' + d + '")';   // where the browser can, the line morphs
  }

  function draw() {
    var r = figures(), top = r.none.pot || 1;
    var a = r.a.yearly, z = r.none.yearly;
    K.count(cost, r.costA, K.euro, 650);
    shape(none, line(z, top));
    shape(withFee, line(a, top));
    var back = z.slice().reverse().map(function (v, i, arr) {
      return 'L' + ((arr.length - 1 - i) / (arr.length - 1) * 600).toFixed(1) + ' ' + (200 - v / top * 190).toFixed(1);
    }).join(' ');
    shape(gap, line(a, top) + ' ' + back + ' Z');
    dotNone.style.top = ((200 - z[z.length - 1] / top * 190) / 200 * 100) + '%';
    dotWith.style.top = ((200 - a[a.length - 1] / top * 190) / 200 * 100) + '%';
    last = Math.round(r.costA);
  }

  [pot, fee, age].forEach(function (r) {
    var out = $(r.id + 'V');
    fill(r);
    r.addEventListener('input', function () {
      fill(r);
      out.textContent = OUT[r.id](r.value);
      out.classList.remove('is-bump'); void out.offsetWidth; out.classList.add('is-bump');
      draw();
    });
  });
  draw();

  K.reveal(box, false);
  check.addEventListener('click', function () {
    check.setAttribute('aria-expanded', 'true');
    K.reveal(box, true);
    setTimeout(function () { email.focus({ preventScroll: true }); }, K.motion() ? 120 : 0);
  });
  email.addEventListener('input', function () { K.okField(email, K.EMAIL.test(email.value.trim())); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!box.classList.contains('on')) { check.click(); return; }
    if (!K.EMAIL.test(email.value.trim())) { err.textContent = 'Enter a valid email.'; K.shake(email.closest('.ffield')); email.focus(); return; }
    err.textContent = '';
    var by = K.replyBy(), said = K.euro(last);
    K.send(form, { cost: said, page: location.href.split('#')[0], reply_by: by }, go, {
      subject: 'Fee check',
      body: 'Pension: ' + K.euro(+pot.value) + '\nYearly fee: ' + (+fee.value).toFixed(2) + '%\nAge: ' + age.value + '\nFees by 66: ' + said
    }).then(function (how) {
      if (how === 'sent') K.done(form, ok, 'We’ll reply ' + (by ? 'by ' + by : 'within one working day') + '.');
      else if (how === 'mail') K.done(form, ok, K.MAIL_SAID, K.MAIL_H);
    });
  });
})();
