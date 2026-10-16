/* my-pensions.html, all your pensions in one view (Run 20 #12; a picture
   first since 8 October 2026: a ring split by pension, the total counting
   up in its middle, a key, and the fees in a coral tile. Simplified on
   12 October 2026: a pension is who it is with, what it is worth and, if
   known, its yearly fee).

   The sums are assets/js/pots.js, covered by tests/pots.test.js. This file
   keeps the rows (add, remove, renumber), reads them as the reader types,
   and paints the summary. The ring's arcs are handed to
   assets/js/pb-pots-motion.js when motion is on, which glides them to
   their new sizes; otherwise they are drawn where they belong. */
(function () {
  'use strict';
  var Pots = window.PBPots, P = window.PBPage;
  var form = document.getElementById('ptForm');
  if (!Pots || !P || !form) return;
  var $ = P.$, euro = P.euro;
  var list = $('ptRows'), add = $('ptAdd');
  var FIELDS = ['Name', 'Value', 'Amc'];
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
    [].forEach.call(copy.querySelectorAll('input'), function (i) { i.value = ''; i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); });
    [].forEach.call(copy.querySelectorAll('.pt-bad,.pt-x'), function (h) { h.parentNode.removeChild(h); });
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
      return { name: $('ptName' + i).value, value: $('ptValue' + i).value, amc: $('ptAmc' + i).value };
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
  var reduce = !document.documentElement.classList.contains('pb-motion');
  var shown = 0, raf = 0, painted = false;

  // The total counts to its new figure; with motion off it is simply there
  function count(to) {
    var el = $('ptTotal'), from = shown, t0 = 0;
    cancelAnimationFrame(raf);
    shown = to;
    /* the first paint (the example, at load) is simply there: nothing counts before the reader acts */
    if (reduce || from === to || !painted) { el.textContent = euro(to); return; }
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

  /* The arcs: for each kept pension, its length round the ring and where it
     starts, keyed by its row. Drawn here, or glided by the motion module. */
  function ring(s, ex) {
    var at = 0, idx = ex ? s.rows.map(function (r, k) { return k; }) : keptRows(), gap = s.rows.length > 1 ? 1.6 : 0, want = [];
    s.rows.forEach(function (r, k) {
      var len = r.share * C;
      want.push({ row: idx[k], len: Math.max(0, len - gap), off: -at, o: shade(idx[k]) });
      at += len;
    });
    if (window.PBPotsRing && !reduce) { window.PBPotsRing($('ptSegs'), want, C); }
    else { draw($('ptSegs'), want); }
    return idx;
  }
  function draw(g, want) {
    g.textContent = '';
    want.forEach(function (w) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'pt-seg');
      c.setAttribute('cx', 60); c.setAttribute('cy', 60); c.setAttribute('r', R);
      c.setAttribute('stroke-dasharray', w.len.toFixed(2) + ' ' + C.toFixed(2));
      c.setAttribute('stroke-dashoffset', w.off.toFixed(2));
      c.style.setProperty('--o', w.o);
      c.setAttribute('data-row', w.row);
      g.appendChild(c);
    });
  }

  // The row being filled in is lit in the ring and the key
  var lit = -1;
  function light(i) {
    lit = i;
    [].forEach.call(document.querySelectorAll('#ptSegs .pt-seg, #ptKey li'), function (el) {
      el.classList.toggle('pt-on', el.getAttribute('data-row') === String(i));
    });
  }
  list.addEventListener('focusin', function (e) { var r = e.target.closest('.pt-row'); light(r ? rows().indexOf(r) : -1); });
  list.addEventListener('focusout', function () { light(-1); });

  /* Marketing Bible A7 (show, give samples): until the reader types a value,
     the summary shows two example pensions, marked as examples, so the ring,
     the total and the fee line are there from the first look */
  var EXAMPLE = [{ name: 'Example: old job', value: '18,000', amc: '1.2' }, { name: 'Example: personal pension', value: '32,000', amc: '0.8' }];
  function paint(spoken) {
    var real = Pots.summarise(read()), ex = real.count === 0, s = ex ? Pots.summarise(EXAMPLE) : real;
    rows().forEach(function (r, i) {
      flag($('ptValue' + i), unread(Pots.amount($('ptValue' + i).value)), 'Not counted: enter an amount in euro, like 40,000.');
      flag($('ptAmc' + i), unread(Pots.rate($('ptAmc' + i).value)), 'Not read: enter a percentage, like 1 or 0.75.');
    });
    count(s.total);
    $('ptCount').textContent = ex ? 'An example. Add yours.'
      : 'across ' + s.count + (s.count === 1 ? ' pension' : ' pensions');
    $('ptSum').classList.toggle('pt-example', ex);
    // on a phone the ring is below the form: a small total and split stay in view while typing
    $('ptMini').hidden = ex;
    $('ptMiniN').textContent = euro(s.total);
    var mb = $('ptMiniBar'), kr = ex ? [0, 1] : keptRows(); mb.textContent = '';
    s.rows.forEach(function (r, k) {
      var seg = document.createElement('i');
      seg.style.flexGrow = r.share; seg.style.setProperty('--o', shade(kr[k]));
      mb.appendChild(seg);
    });
    var idx = ring(s, ex), key = $('ptKey'); key.textContent = '';
    s.rows.forEach(function (r, k) {
      var li = document.createElement('li'); li.setAttribute('data-row', idx[k]);
      var sw = document.createElement('i'); sw.setAttribute('aria-hidden', 'true'); sw.style.setProperty('--o', shade(idx[k]));
      var b = document.createElement('b'); b.textContent = r.name || 'Pension ' + (idx[k] + 1);
      var v = document.createElement('span'); v.textContent = euro(r.value);
      var pc = document.createElement('em'); pc.textContent = Math.round(r.share * 100) + '%';
      li.appendChild(sw); li.appendChild(b); li.appendChild(v); li.appendChild(pc);
      key.appendChild(li);
    });
    if (lit >= 0) light(lit);
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
      var bb = document.createElement('b'); bb.textContent = fig;
      out.appendChild(document.createTextNode(c.slice(0, at))); out.appendChild(bb);
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
  painted = true;
})();
