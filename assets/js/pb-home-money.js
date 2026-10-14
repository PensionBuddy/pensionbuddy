/* Why a pension, and why now (#money), 14 October 2026. The owner: "repeat
   yourself; people forget. Keep all three, but smoother, beside each other."
   One card under the calculator, three panels on three tabs, one angle each:
   Prices (#inflation, assets/js/pb-home-infl.js), Time (#wait,
   assets/js/pb-home-wait.js) and Tax (#relief, this file). All three follow
   the calculator's figures (PBKit.plan, PBKit.tax), so the reader sets them
   once.

   The tabs: the WAI-ARIA tabs pattern. Only the chosen tab is in the tab
   order; Left, Right, Home and End move between the tabs and choose. A panel
   is swapped at once, never faded: its caveats are furniture (the MOTION
   block's rule 2). Only the pill under the tabs slides. A canvas in a panel
   that was hidden takes its size when the panel shows (a resize event), and
   each panel's first look plays when it is first seen. A link to a panel
   (#inflation, #wait, #relief) opens its tab. Without this script the tabs
   stay hidden and the three panels stand one under another.

   Tax: what Revenue adds to what goes in each month, from the calculator's
   own monthly amount and tax rate. You pay m x (1 - rate); Revenue adds
   m x rate. To 66, the same twelve times a year for the years left, if the
   rate and the payments stay the same: plain sums, no growth, so no
   projection. Nothing put in yet: an example EUR 100, said as one. A line
   names the next Revenue deadline (PBDeadline), for a payment that counts
   against last year's tax. Vanilla JS. */
(function () {
  'use strict';
  var sec = document.getElementById('money');
  if (!sec) { return; }
  var $ = function (id) { return document.getElementById(id); };

  /* ------------------------------------------------------------ the tabs -- */
  var list = sec.querySelector('.pb-ms-tabs');
  var tabs = list ? [].slice.call(list.querySelectorAll('[role="tab"]')) : [];
  var panels = tabs.map(function (t) { return $(t.getAttribute('aria-controls')); });
  if (tabs.length && panels.every(Boolean)) {
    var ind = document.createElement('i'), busy = false;
    ind.className = 'pb-seg-ind'; ind.setAttribute('aria-hidden', 'true');
    list.insertBefore(ind, list.firstChild); list.classList.add('pb-seg-live');
    var place = function (quiet) {
      var on = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
      if (!on || !on.offsetWidth) { return; }
      if (quiet) { ind.style.transition = 'none'; }
      ind.style.top = '0'; ind.style.bottom = 'auto'; ind.style.height = on.offsetHeight + 'px';
      ind.style.width = on.offsetWidth + 'px'; ind.style.transform = 'translate(' + on.offsetLeft + 'px,' + on.offsetTop + 'px)';
      if (quiet) { void ind.offsetWidth; ind.style.transition = ''; }
    };
    var choose = function (i, focus) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      place(false);
      if (focus) { tabs[i].focus(); }
      /* a canvas in a panel that was hidden is drawn at its size now */
      busy = true;
      try { window.dispatchEvent(new Event('resize')); } catch (e) { /* an old browser: the panel draws on its next change */ }
      busy = false;
    };
    tabs.forEach(function (t, i) {
      var p = panels[i];
      p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', t.id); p.tabIndex = 0;
      t.addEventListener('click', function () { if (t.getAttribute('aria-selected') !== 'true') { choose(i, false); } });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, to = null;
        if (e.key === 'ArrowRight') { to = (i + 1) % n; } else if (e.key === 'ArrowLeft') { to = (i + n - 1) % n; }
        else if (e.key === 'Home') { to = 0; } else if (e.key === 'End') { to = n - 1; }
        if (to === null) { return; }
        e.preventDefault(); choose(to, true);
      });
    });
    var fromHash = function () {
      var id = (location.hash || '').slice(1), i = panels.map(function (p) { return p.id; }).indexOf(id);
      if (i >= 0) { choose(i, false); }
    };
    list.hidden = false;
    sec.classList.add('pb-ms-on');
    choose(0, false);
    fromHash();
    place(true);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', function () { if (!busy) { place(true); } });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { place(true); }); }
  }

  /* ------------------------------------------------------- the Tax panel -- */
  var K = window.PBKit, you = $('pbX2You');
  if (!K || !you) { return; }
  var fmt = K.fmt, AT = 66;
  var rYou = new K.Roll(you), rRev = new K.Roll($('pbX2Rev')), rTo = new K.Roll($('pbX2ToRev'));
  var bar = $('pbX2Bar'), box = $('relief');
  function rate() { return K.tax ? K.tax.rate : 0.4; }
  function deadline() {
    var now = $('pbX2Now'), D = window.PBDeadline;
    if (!now || !D || !D.at) { return; }
    var d = D.at(new Date()), when = d.ros || d.revenue;
    if (!when) { return; }
    now.innerHTML = 'Pay in before ' + when + ' and you can claim it against your ' + d.taxYear + ' tax' +
      (d.ros ? ', if you pay and file online' : '') + '. <a href="#deadline">Revenue&rsquo;s deadline</a>';
    now.hidden = false;
  }
  function paint() {
    var p = K.plan || {}, m = +p.mine || 0, a = Math.min(AT - 1, +p.age || 35), r = rate();
    if (!(m > 0)) { m = 100; }
    var n = AT - a, months = n * 12;
    rYou.set(fmt(m * (1 - r))); rRev.set(fmt(m * r));
    $('pbX2M').textContent = fmt(m) + ' a month';
    $('pbX2Rate').textContent = Math.round(r * 100) + '%';
    $('pbX2MonthT').textContent = fmt(m);
    $('pbX2KYou').textContent = fmt(m * (1 - r)); $('pbX2KRev').textContent = fmt(m * r);
    if (bar) { bar.style.setProperty('--you', (1 - r).toFixed(3)); }
    rTo.set(fmt(m * r * months));
    $('pbX2ToSub').textContent = 'You put in ' + fmt(m * (1 - r) * months) + ' over ' + n + (n === 1 ? ' year.' : ' years.');
  }
  /* the rate, here too: the same rate as the calculator's (PBKit.setTax) */
  var taxRow = box.querySelector('.pb-x2-taxrow'), taxSeg = box.querySelector('.pb-x2-tax'), seg = null;
  if (taxSeg && K.seg) {
    seg = K.seg(taxSeg, function (b) { var v = +b.getAttribute('data-rate') / 100; if (K.setTax) { K.setTax(v, 'relief'); } paint(); });
    seg.press(function (b) { return +b.getAttribute('data-rate') / 100 === rate(); }, true);
    taxRow.hidden = false;
  }
  document.addEventListener('pb:tax', function (e) {
    var d = e.detail || {};
    if (seg && d.by !== 'relief') { seg.press(function (b) { return +b.getAttribute('data-rate') / 100 === d.rate; }, true); }
    paint();
  });
  document.addEventListener('pb:plan', paint);
  paint();
  if (window.PBDeadline) { deadline(); } else { window.addEventListener('load', deadline); }
}());
