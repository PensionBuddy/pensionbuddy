/* my-pensions.html, all your pensions in one view (Run 20 #12).

   The sums are assets/js/pots.js, covered by tests/pots.test.js. This file
   keeps the rows (add, remove, renumber), reads them as the reader types,
   and paints the summary. Nothing is stored, sent or put in a link. */
(function () {
  'use strict';
  var Pots = window.PBPots, P = window.PBPage;
  var form = document.getElementById('ptForm');
  if (!Pots || !P || !form) return;
  var $ = P.$, euro = P.euro;
  var list = $('ptRows'), add = $('ptAdd');
  var FIELDS = ['Name', 'Kind', 'Value', 'Amc'];
  var srTimer = 0;

  function rows() { return [].slice.call(list.querySelectorAll('.pt-row')); }

  function renumber() {
    rows().forEach(function (r, i) {
      r.querySelector('legend').textContent = 'Pension ' + (i + 1);
      FIELDS.forEach(function (f) {
        var el = r.querySelector('[id^="pt' + f + '"]'), lab = el && r.querySelector('label[for="' + el.id + '"]');
        if (!el) return;
        el.id = 'pt' + f + i;
        if (lab) lab.htmlFor = el.id;
      });
      var x = r.querySelector('.pt-x');
      if (x) x.setAttribute('aria-label', 'Remove pension ' + (i + 1));
    });
    add.hidden = rows().length >= Pots.MAX;
  }

  add.addEventListener('click', function () {
    if (rows().length >= Pots.MAX) return;
    var copy = rows()[0].cloneNode(true);
    [].forEach.call(copy.querySelectorAll('input'), function (i) { i.value = ''; });
    [].forEach.call(copy.querySelectorAll('.pt-bad'), function (h) { h.parentNode.removeChild(h); });
    copy.querySelector('select').selectedIndex = 0;
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'pt-x'; x.textContent = 'Remove';
    copy.insertBefore(x, copy.querySelector('legend').nextSibling);
    list.appendChild(copy);
    renumber();
    copy.querySelector('input').focus();
    paint(false);
  });
  list.addEventListener('click', function (e) {
    var x = e.target.closest('.pt-x');
    if (!x) return;
    var r = x.closest('.pt-row'), i = rows().indexOf(r);
    r.parentNode.removeChild(r);
    renumber();
    var left = rows(), next = left[Math.min(i, left.length - 1)];
    (next ? next.querySelector('input') : add).focus();
    paint(true);
  });

  function read() {
    return rows().map(function (r, i) {
      return { name: $('ptName' + i).value, kind: $('ptKind' + i).value, value: $('ptValue' + i).value, amc: $('ptAmc' + i).value };
    });
  }

  // Something typed that is not a number is said, not dropped without a word
  function flag(el, bad, msg) {
    var f = el.closest('.pt-field'), h = f.querySelector('.pt-bad');
    if (bad) {
      if (!h) { h = document.createElement('p'); h.className = 'pt-bad'; f.appendChild(h); }
      h.id = el.id + 'Bad'; h.textContent = msg;
      el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', h.id);
    } else {
      if (h) f.removeChild(h);
      el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby');
    }
  }
  function unread(x) { return x !== x; }

  function label(kind) { var k = Pots.KINDS.filter(function (x) { return x[0] === kind; })[0]; return k ? k[1] : ''; }

  function paint(spoken) {
    var s = Pots.summarise(read());
    rows().forEach(function (r, i) {
      flag($('ptValue' + i), unread(Pots.amount($('ptValue' + i).value)), 'Not counted: enter an amount in euro, like 40,000.');
      flag($('ptAmc' + i), unread(Pots.rate($('ptAmc' + i).value)), 'Not read: enter a percentage, like 1 or 0.75.');
    });
    $('ptTotal').textContent = euro(s.total);
    $('ptCount').textContent = s.count === 0 ? 'No pensions listed yet.'
      : 'across ' + s.count + (s.count === 1 ? ' pension.' : ' pensions.');
    var bars = $('ptBars'); bars.textContent = '';
    s.rows.forEach(function (r) {
      var li = document.createElement('li');
      var head = document.createElement('div'); head.className = 'pt-bl';
      var b = document.createElement('b'); b.textContent = r.name || label(r.kind);
      var v = document.createElement('span'); v.textContent = euro(r.value) + ', ' + Math.round(r.share * 100) + '%';
      head.appendChild(b); head.appendChild(v);
      var i = document.createElement('i'); i.style.setProperty('--w', (r.share * 100).toFixed(2) + '%'); i.setAttribute('aria-hidden', 'true');
      li.appendChild(head); li.appendChild(i);
      bars.appendChild(li);
    });
    var c = '';
    if (s.chargesKnown > 0) {
      c = 'The annual charges you know of come to about ' + euro(s.yearlyCharges) + ' a year at today’s values';
      c += s.chargesUnknown ? ', with ' + s.chargesUnknown + (s.chargesUnknown === 1 ? ' charge' : ' charges') + ' not known.' : '.';
    } else if (s.count > 0) {
      c = 'Add an annual charge to see what the charges come to in euro a year.';
    }
    $('ptCharges').textContent = c;
    if (!spoken) return;
    clearTimeout(srTimer);
    srTimer = setTimeout(function () { $('ptSr').textContent = 'Total ' + euro(s.total) + ' ' + $('ptCount').textContent + ' ' + c; }, 700);
  }

  form.addEventListener('input', function () { paint(true); });
  form.addEventListener('change', function () { paint(true); });
  $('ptPrint').addEventListener('click', function () { window.print(); });
  renumber();
  paint(false);
})();
