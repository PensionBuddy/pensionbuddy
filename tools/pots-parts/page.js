/* my-pensions.html, all your pensions in one view (Run 20 #12; made a
   picture first on 8 October 2026: a ring split by pension, the total
   counting up in its middle, a key, and the fees in a coral tile).

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
      var lg = r.querySelector('legend');
      lg.lastChild.nodeValue = 'Pension ' + (i + 1);
      lg.querySelector('.pt-dot').style.setProperty('--o', shade(i));
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
    copy.classList.add('pt-new');   // arrives with a small rise (page.css); nothing fades
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

  /* One hue, the reader's own money (slate, docs/DESIGN-RUBRIC.md section 3),
     at a different strength for each pension; the white gaps in the ring and
     the name beside each swatch carry the difference, never the shade alone. */
  var SHADES = [1, 0.72, 0.5, 0.34, 0.22];
  function shade(i) { return SHADES[i % SHADES.length]; }
  var NS = 'http://www.w3.org/2000/svg', R = 48, C = 2 * Math.PI * R;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var shown = 0, raf = 0;

  // The total counts to its new figure; under reduced motion it is simply there
  function count(to) {
    var el = $('ptTotal'), from = shown, t0 = 0;
    cancelAnimationFrame(raf);
    shown = to;
    if (reduce || from === to) { el.textContent = euro(to); return; }
    raf = requestAnimationFrame(function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 450), e = 1 - Math.pow(1 - k, 3);
      el.textContent = euro(Math.round(from + (to - from) * e));
      if (k < 1) raf = requestAnimationFrame(step);
    });
  }

  // Each kept pension's row number, in order: summarise() keeps the rows with a value
  function keptRows() {
    var out = [];
    rows().forEach(function (r, i) { var v = Pots.amount($('ptValue' + i).value); if (v === v && v > 0) out.push(i); });
    return out.slice(0, Pots.MAX);
  }

  function ring(s) {
    var g = $('ptSegs'), at = 0, idx = keptRows(), gap = s.rows.length > 1 ? 1.6 : 0;
    g.textContent = '';
    s.rows.forEach(function (r, k) {
      var len = r.share * C, c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'pt-seg');
      c.setAttribute('cx', 60); c.setAttribute('cy', 60); c.setAttribute('r', R);
      c.setAttribute('stroke-dasharray', Math.max(0, len - gap).toFixed(2) + ' ' + C.toFixed(2));
      c.setAttribute('stroke-dashoffset', (-at).toFixed(2));
      c.style.setProperty('--o', shade(idx[k]));
      c.setAttribute('data-row', idx[k]);
      g.appendChild(c);
      at += len;
    });
    return idx;
  }

  // The row being filled in is lit in the ring and the key
  function light(i) {
    [].forEach.call(document.querySelectorAll('#ptSegs .pt-seg, #ptKey li'), function (el) {
      el.classList.toggle('pt-on', el.getAttribute('data-row') === String(i));
    });
  }
  list.addEventListener('focusin', function (e) { var r = e.target.closest('.pt-row'); light(r ? rows().indexOf(r) : -1); });
  list.addEventListener('focusout', function () { light(-1); });

  function label(kind) { var k = Pots.KINDS.filter(function (x) { return x[0] === kind; })[0]; return k ? k[1] : ''; }

  function paint(spoken) {
    var s = Pots.summarise(read());
    rows().forEach(function (r, i) {
      flag($('ptValue' + i), unread(Pots.amount($('ptValue' + i).value)), 'Not counted: enter an amount in euro, like 40,000.');
      flag($('ptAmc' + i), unread(Pots.rate($('ptAmc' + i).value)), 'Not read: enter a percentage, like 1 or 0.75.');
    });
    count(s.total);
    $('ptCount').textContent = s.count === 0 ? 'Add a pension to start'
      : 'across ' + s.count + (s.count === 1 ? ' pension' : ' pensions');
    $('ptSum').classList.toggle('pt-empty', s.count === 0);
    // on a phone the ring is below the form: a small total and split stay in view while typing
    $('ptMini').hidden = s.count === 0;
    $('ptMiniN').textContent = euro(s.total);
    var mb = $('ptMiniBar'), kr = keptRows(); mb.textContent = '';
    s.rows.forEach(function (r, k) {
      var seg = document.createElement('i');
      seg.style.flexGrow = r.share; seg.style.setProperty('--o', shade(kr[k]));
      mb.appendChild(seg);
    });
    var idx = ring(s), key = $('ptKey'); key.textContent = '';
    s.rows.forEach(function (r, k) {
      var li = document.createElement('li'); li.setAttribute('data-row', idx[k]);
      var sw = document.createElement('i'); sw.setAttribute('aria-hidden', 'true'); sw.style.setProperty('--o', shade(idx[k]));
      var b = document.createElement('b'); b.textContent = r.name || label(r.kind);
      var v = document.createElement('span'); v.textContent = euro(r.value);
      var pc = document.createElement('em'); pc.textContent = Math.round(r.share * 100) + '%';
      li.appendChild(sw); li.appendChild(b); li.appendChild(v); li.appendChild(pc);
      key.appendChild(li);
    });
    var c = '', fig = '';
    if (s.chargesKnown > 0) {
      fig = euro(s.yearlyCharges);
      c = 'Fees take about ' + fig + ' a year';
      c += s.chargesUnknown ? ' (' + s.chargesUnknown + (s.chargesUnknown === 1 ? ' fee' : ' fees') + ' not known).' : '.';
    } else if (s.count > 0) {
      c = 'Add a yearly fee to see what fees cost you.';
    }
    // the euro figure is charges taken from the pot: the coral tile (docs/DESIGN-RUBRIC.md section 3)
    var out = $('ptCharges'), at = fig ? c.indexOf(fig) : -1;
    out.textContent = '';
    out.classList.toggle('pt-fee', at >= 0);
    if (at >= 0) {
      var b = document.createElement('b'); b.textContent = fig;
      out.appendChild(document.createTextNode(c.slice(0, at))); out.appendChild(b);
      out.appendChild(document.createTextNode(c.slice(at + fig.length)));
    } else out.textContent = c;
    if (!spoken) return;
    clearTimeout(srTimer);
    srTimer = setTimeout(function () { $('ptSr').textContent = 'Total ' + euro(s.total) + ' ' + $('ptCount').textContent + '. ' + c; }, 700);
  }

  form.addEventListener('input', function () { paint(true); });
  form.addEventListener('change', function () { paint(true); });
  $('ptPrint').addEventListener('click', function () { window.print(); });
  renumber();
  paint(false);
})();
