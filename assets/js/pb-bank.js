/* "In a bank or invested?", on every calculator that projects a pot.

   The same money two ways, year by year, on one chart the reader can scrub:
   your own money left in a bank account, and the pot your plan builds. Both
   are shown in today's money, against the euro you put in, so the buying
   power a bank account loses to rising prices is drawn as a red area.

   A page calls, from its own script:

     PBBank.mount(afterEl)   puts the card after afterEl, once
     PBBank.set(o)           draws it, o = {
       years      whole years to retirement
       startAge   age now, for the axis (optional: without it "Now", "Year n")
       pot        what there is now; it starts both lines
       ownYearly  your own money each year, as the page counts it
       plan       the plan's pot, in euro at the time, years + 1 values (0 = now)
       ownWords   one sentence: what "your own money" is on this page
       planWords  one sentence: what the plan adds on this page }

   The bank earns PBAssume.cash; prices rise PBAssume.inflation unless the
   reader picks 3% or 4%. The chart is a slider: drag across it, or focus it
   and use the arrow keys. Nothing is stored and nothing is sent. The card
   sits inside the calculator, so assets/js/pb-after.js leaves it out (.pb-bank
   in its NOT list). Its controls are buttons with no id and a custom slider,
   so the share link, the saved report and the sliders' own scripts never pick
   them up.

   Words: information only. It never says what to do with money. Classic
   script; its CSS is its own, so a page needs only the script tag. */
(function () {
  'use strict';
  var A = window.PBAssume;
  if (!A) { return; }
  var doc = document, NS = 'http://www.w3.org/2000/svg';
  var C = { bank: '#A4291D', plan: '#00897B', put: '#6F7C79' };
  var RATES = [A.inflation.rate, 0.03, 0.04];
  var box = null, els = {}, data = null, idx = -1, infl = A.inflation.rate, timer = null;
  var W = 600, H = 230, PL = 8, PR = 8, PT = 16, PB = 26;

  var CSS =
    '.pb-bank{margin:16px 0 0;background:var(--surface,#fff);border:1px solid var(--line,#E7EBE9);border-radius:var(--r-lg,10px);padding:22px 24px}' +
    '.pb-bank h3{font-size:20px;line-height:1.24;letter-spacing:-.02em;font-weight:800;margin:0 0 6px}' +
    '.pb-bank-say{font-size:17px;line-height:1.5;color:var(--ink,#0B1F1C);margin:0}' +
    '.pb-bank-say b{font-weight:700;font-variant-numeric:tabular-nums}' +
    '.pb-bank-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:16px 0 4px}' +
    '.pb-bank-tile{border-radius:8px;padding:10px 12px;background:var(--surface-2,#F4F5F3);border-top:3px solid}' +
    '.pb-bank-tile span{display:block;font-size:12.5px;line-height:1.3;color:var(--ink-2,#54635F)}' +
    '.pb-bank-tile b{display:block;font-size:clamp(17px,2.2vw,21px);font-weight:700;font-variant-numeric:tabular-nums;color:var(--ink,#0B1F1C);margin-top:3px}' +
    '.pb-bank-chart{position:relative;margin-top:10px;touch-action:pan-y;cursor:ew-resize;border-radius:8px;outline:none}' +
    '.pb-bank-chart:focus-visible{box-shadow:0 0 0 3px var(--teal-100,#CBEBE4)}' +
    '.pb-bank-chart svg{display:block;width:100%;height:auto}' +
    '.pb-bank-hint{font-size:12.5px;color:var(--ink-3,#647270);margin:4px 0 0}' +
    '.pb-bank-key{display:flex;flex-wrap:wrap;gap:6px 16px;margin:10px 0 0;padding:0;list-style:none;font-size:13px;color:var(--ink-2,#54635F)}' +
    '.pb-bank-key i{display:inline-block;width:18px;height:0;border-top:2.5px solid;vertical-align:middle;margin-right:7px}' +
    '.pb-bank-key i.pb-bank-k-put{border-top-style:dashed}' +
    '.pb-bank-key i.pb-bank-k-lost{width:14px;height:10px;border:0;border-radius:3px;background:rgba(164,41,29,.2)}' +
    '.pb-bank-infl{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:16px 0 0;font-size:14px;color:var(--ink-2,#54635F)}' +
    '.pb-bank-infl button{font:inherit;font-weight:600;font-size:14px;padding:7px 13px;min-height:36px;border-radius:999px;border:1px solid var(--line-2,#D8DFDC);background:var(--surface,#fff);color:var(--ink,#0B1F1C);cursor:pointer}' +
    '.pb-bank-infl button[aria-pressed="true"]{background:var(--ink,#0B1F1C);border-color:var(--ink,#0B1F1C);color:#fff}' +
    '.pb-bank-note{margin:12px 0 0;font-size:13px;line-height:1.55;color:var(--ink-2,#54635F)}' +
    '.pb-bank details{margin:10px 0 0;padding:0;border:0;background:none;box-shadow:none;font-size:13.5px}' +
    '.pb-bank summary{cursor:pointer;font-weight:600;font-size:13.5px;padding:4px 0;color:var(--ink-2,#54635F)}' +
    '.pb-bank table{width:100%;border-collapse:collapse;margin-top:8px;font-variant-numeric:tabular-nums}' +
    '.pb-bank th,.pb-bank td{text-align:right;padding:5px 4px;border-bottom:1px solid var(--line,#E7EBE9)}' +
    '.pb-bank th:first-child,.pb-bank td:first-child{text-align:left}' +
    '.pb-bank-bar{display:flex;align-items:center;gap:12px;margin:6px 0 0}' +
    '.pb-bank-play{font:inherit;font-weight:700;font-size:14px;display:inline-flex;align-items:center;gap:7px;padding:8px 15px;min-height:40px;border-radius:999px;border:0;background:var(--teal-700,#08655A);color:#fff;cursor:pointer;flex:none}' +
    '.pb-bank-play:hover{background:var(--teal-900,#0A332E)}' +
    '.pb-bank-play svg{width:12px;height:12px;fill:currentColor}' +
    '.pb-bank-bar .pb-bank-hint{margin:0}' +
    '.pb-bank-coins{margin:18px 0 0;padding:14px 14px 12px;border-radius:8px;background:var(--surface-2,#F4F5F3)}' +
    '.pb-bank-coins h4{margin:0 0 10px;font-size:14px;font-weight:700;color:var(--ink,#0B1F1C)}' +
    '.pb-bank-crow{display:grid;grid-template-columns:76px 1fr auto;align-items:center;gap:10px;margin-top:8px;font-size:13.5px;color:var(--ink-2,#54635F)}' +
    '.pb-bank-crow b{font-variant-numeric:tabular-nums;color:var(--ink,#0B1F1C);font-size:15px;min-width:52px;text-align:right}' +
    '.pb-bank-cs{display:grid;grid-template-columns:repeat(10,var(--cz,20px));gap:4px}' +
    '.pb-coin{position:relative;width:var(--cz,20px);height:var(--cz,20px);border-radius:50%;overflow:hidden;box-shadow:inset 0 0 0 1.5px var(--c);background:var(--surface,#fff);transition:box-shadow .2s}' +
    '.pb-coin i{position:absolute;left:0;top:0;bottom:0;background:var(--c);transition:width .25s ease-out}' +
    '.pb-coin::after{content:"\\20AC";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;mix-blend-mode:normal}' +
    '.pb-coin.pb-coin-gone{box-shadow:inset 0 0 0 1.5px rgba(164,41,29,.45);background:repeating-linear-gradient(135deg,rgba(164,41,29,.10) 0 3px,transparent 3px 6px)}' +
    '.pb-coin.pb-coin-gone::after{color:rgba(164,41,29,.55)}' +
    '.pb-coin.pb-coin-part::after{color:var(--ink,#0B1F1C);opacity:.6}' +
    '.pb-bank-ckey{margin:10px 0 0;font-size:12.5px;color:var(--ink-3,#647270)}' +
    '@media(prefers-reduced-motion:reduce){.pb-coin,.pb-coin i{transition:none}}' +
    '@media(max-width:420px){.pb-bank{padding:18px 16px}.pb-bank-tiles{gap:6px}.pb-bank-tile{padding:8px}.pb-bank-crow{grid-template-columns:64px 1fr auto;gap:6px;font-size:12.5px}.pb-bank-crow span{white-space:nowrap}.pb-bank-crow b{min-width:0;font-size:14px}.pb-bank-coins{padding:12px 10px}.pb-bank-cs{--cz:14px;gap:3px}.pb-coin::after{font-size:9px}}';

  function euro(v) { return '€' + Math.round(v).toLocaleString('en-IE'); }
  function pctOf(r) { return Math.round(r * 1000) / 10 + '%'; }
  function svg(tag, at) { var e = doc.createElementNS(NS, tag); for (var k in at) { e.setAttribute(k, at[k]); } return e; }
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) { e.className = cls; } if (text != null) { e.textContent = text; } return e; }

  function mount(after) {
    if (box || !after || !after.parentNode) { return box; }
    if (!doc.getElementById('pbBankCss')) { var st = el('style'); st.id = 'pbBankCss'; st.textContent = CSS; doc.head.appendChild(st); }
    box = el('div', 'pb-bank');
    box.hidden = true;
    box.appendChild(el('h3', null, 'In a bank or invested?'));
    els.say = box.appendChild(el('p', 'pb-bank-say'));
    var tiles = box.appendChild(el('div', 'pb-bank-tiles'));
    function tile(label, colour) {
      var t = tiles.appendChild(el('div', 'pb-bank-tile')); t.style.borderTopColor = colour;
      var s = t.appendChild(el('span', null, label)); var b = t.appendChild(el('b'));
      return { label: s, value: b };
    }
    els.tBank = tile('In a bank', C.bank);
    els.tPut = tile('You put in', C.put);
    els.tPlan = tile('Invested', C.plan);

    els.chart = box.appendChild(el('div', 'pb-bank-chart'));
    els.chart.tabIndex = 0;
    els.chart.setAttribute('role', 'slider');
    els.chart.setAttribute('aria-label', 'Pick a year on the chart');
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' });
    for (var g = 0; g <= 2; g++) {
      var yy = PT + (g / 2) * (H - PT - PB);
      s.appendChild(svg('line', { x1: PL, x2: W - PR, y1: yy, y2: yy, stroke: 'rgba(11,31,28,0.07)' }));
    }
    /* two copies of the lines: faint for the years still to come, full for
       the years up to the one picked, so playing the years draws them in */
    var cid = 'pbBankClip' + Math.floor(Math.random() * 1e6);
    els.clip = s.appendChild(svg('clipPath', { id: cid })).appendChild(svg('rect', { x: 0, y: 0, height: H, width: W }));
    function lines(g) {
      return {
        lost: g.appendChild(svg('path', { fill: 'rgba(164,41,29,0.20)' })),
        put: g.appendChild(svg('path', { fill: 'none', stroke: C.put, 'stroke-width': 2, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' })),
        bank: g.appendChild(svg('path', { fill: 'none', stroke: C.bank, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })),
        plan: g.appendChild(svg('path', { fill: 'none', stroke: C.plan, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }))
      };
    }
    els.faint = lines(s.appendChild(svg('g', { opacity: 0.22 })));
    els.full = lines(s.appendChild(svg('g', { 'clip-path': 'url(#' + cid + ')' })));
    els.cross = s.appendChild(svg('line', { y1: PT - 6, y2: H - PB, stroke: 'rgba(11,31,28,0.35)', 'stroke-width': 1 }));
    els.dBank = s.appendChild(svg('circle', { r: 5, fill: C.bank, stroke: '#fff', 'stroke-width': 2 }));
    els.dPut = s.appendChild(svg('circle', { r: 5, fill: C.put, stroke: '#fff', 'stroke-width': 2 }));
    els.dPlan = s.appendChild(svg('circle', { r: 5, fill: C.plan, stroke: '#fff', 'stroke-width': 2 }));
    var txt = { 'font-family': 'inherit', 'font-size': 12, fill: '#647270' };
    els.mx = s.appendChild(svg('text', Object.assign({ x: PL, y: PT - 4 }, txt)));
    els.a0 = s.appendChild(svg('text', Object.assign({ x: PL, y: H - 8 }, txt)));
    els.a1 = s.appendChild(svg('text', Object.assign({ x: W - PR, y: H - 8, 'text-anchor': 'end' }, txt)));
    els.aNow = s.appendChild(svg('text', Object.assign({ y: H - 8, 'text-anchor': 'middle', 'font-weight': 700, fill: '#0B1F1C' }, txt)));
    els.svg = els.chart.appendChild(s);
    var bar = box.appendChild(el('div', 'pb-bank-bar'));
    els.play = bar.appendChild(el('button', 'pb-bank-play'));
    els.play.type = 'button';
    els.play.addEventListener('click', function () { if (timer) { stop(); } else { play(); } });
    bar.appendChild(el('p', 'pb-bank-hint', 'Or drag across the chart to see any year.'));
    playLabel(false);

    var key = box.appendChild(el('ul', 'pb-bank-key'));
    key.setAttribute('aria-hidden', 'true');
    [['Invested, in today’s money', C.plan, ''], ['You put in', C.put, 'pb-bank-k-put'],
     ['In a bank, in today’s money', C.bank, ''], ['Buying power lost', '', 'pb-bank-k-lost']].forEach(function (k) {
      var li = key.appendChild(el('li')); var i = li.appendChild(el('i', k[2] || null));
      if (k[1]) { i.style.borderTopColor = k[1]; }
      li.appendChild(doc.createTextNode(k[0]));
    });

    /* every 100 euro, as coins: what it buys at the year picked */
    var coins = box.appendChild(el('div', 'pb-bank-coins'));
    els.cHead = coins.appendChild(el('h4'));
    function crow(name, colour) {
      var r = coins.appendChild(el('div', 'pb-bank-crow'));
      r.appendChild(el('span', null, name));
      var cs = r.appendChild(el('div', 'pb-bank-cs')); cs.style.setProperty('--c', colour);
      cs.setAttribute('aria-hidden', 'true');
      return { coins: cs, value: r.appendChild(el('b')) };
    }
    els.cBank = crow('In a bank', C.bank);
    els.cPlan = crow('Invested', C.plan);
    coins.appendChild(el('p', 'pb-bank-ckey', 'Each coin is €10 of today’s money. Striped coins are buying power lost.'));

    var inf = box.appendChild(el('div', 'pb-bank-infl'));
    inf.setAttribute('role', 'group');
    inf.setAttribute('aria-label', 'If prices rise each year by');
    inf.appendChild(el('span', null, 'If prices rise each year by'));
    els.btns = RATES.map(function (r, i) {
      var b = inf.appendChild(el('button', null, pctOf(r) + (i === 0 ? ' (ECB target)' : '')));
      b.type = 'button';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        infl = r;
        els.btns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        draw();
      });
      return b;
    });

    els.note = box.appendChild(el('p', 'pb-bank-note'));
    var det = box.appendChild(el('details'));
    det.appendChild(el('summary', null, 'See the figures'));
    els.table = det.appendChild(el('table'));

    /* the chart is the slider: pointer anywhere picks the nearest year */
    function pick(e) {
      if (!data) { return; }
      var r = els.svg.getBoundingClientRect(), f = (e.clientX - r.left) / r.width;
      var x = f * W, i = Math.round((x - PL) / (W - PL - PR) * data.years);
      go(i);
    }
    var down = false;
    els.chart.addEventListener('pointerdown', function (e) { stop(); down = true; if (els.chart.setPointerCapture) { els.chart.setPointerCapture(e.pointerId); } pick(e); });
    els.chart.addEventListener('pointermove', function (e) { if (down || e.pointerType === 'mouse') { pick(e); } });
    els.chart.addEventListener('pointerup', function () { down = false; });
    els.chart.addEventListener('pointercancel', function () { down = false; });
    els.chart.addEventListener('keydown', function (e) {
      if (!data) { return; }
      var step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -5, PageUp: 5 }[e.key];
      if (step || e.key === 'Home' || e.key === 'End') { stop(); }
      if (step) { go(idx + step); e.preventDefault(); }
      else if (e.key === 'Home') { go(0); e.preventDefault(); }
      else if (e.key === 'End') { go(data.years); e.preventDefault(); }
    });

    after.parentNode.insertBefore(box, after.nextSibling);
    /* the first time the card comes into view, play the years once */
    if ('IntersectionObserver' in window && !reduced()) {
      var io = new IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; }) && data && !box.hidden) { io.disconnect(); play(); }
      }, { threshold: 0.6 });
      io.observe(els.chart);
    }
    return box;
  }

  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function playLabel(on) {
    els.play.textContent = '';
    var ic = els.play.appendChild(svg('svg', { viewBox: '0 0 12 12', 'aria-hidden': 'true' }));
    ic.appendChild(on ? svg('path', { d: 'M2 1h3v10H2zM7 1h3v10H7z' }) : svg('path', { d: 'M2 1l9 5-9 5z' }));
    els.play.appendChild(doc.createTextNode(on ? 'Pause' : (data ? 'Play the ' + data.years + (data.years === 1 ? ' year' : ' years') : 'Play the years')));
  }
  /* play: from now to the last year, about 3.5 seconds in all */
  function play() {
    if (!data) { return; }
    if (reduced()) { go(data.years); return; }
    var from = idx >= data.years ? 0 : idx, n = data.years, ms = 3500 * (n - from) / n, t0 = null;
    go(from);
    playLabel(true);
    function step(t) {
      if (t0 === null) { t0 = t; }
      var f = Math.min(1, (t - t0) / Math.max(ms, 1));
      go(from + (n - from) * f, true);
      if (f < 1) { timer = requestAnimationFrame(step); } else { stop(); go(n); }
    }
    timer = requestAnimationFrame(step);
  }
  function stop() {
    if (timer) { cancelAnimationFrame(timer); timer = null; }
    if (els.play) { playLabel(false); }
  }

  function coinRow(row, per, k10) {
    var n = Math.min(40, Math.max(10, Math.ceil(per / 10 - 1e-9))), cs = row.coins.children;
    while (cs.length < n) { var c = row.coins.appendChild(el('span', 'pb-coin')); c.appendChild(el('i')); }
    while (cs.length > n) { row.coins.removeChild(row.coins.lastChild); }
    for (var k = 0; k < n; k++) {
      var f = Math.max(0, Math.min(1, per / 10 - k));
      cs[k].firstChild.style.width = (f * 100) + '%';
      cs[k].className = 'pb-coin' + (f === 0 && k < k10 ? ' pb-coin-gone' : f > 0 && f < 1 ? ' pb-coin-part' : '');
    }
    row.value.textContent = euro(per);
  }

  function label(i) {
    if (!data) { return ''; }
    return data.startAge != null ? 'Age ' + (data.startAge + i) : (i === 0 ? 'Now' : 'Year ' + i);
  }

  /* the bank, month by month, at the bank's rate, from the same start */
  function bankAt(i) {
    var m = Math.pow(1 + A.cash.rate, 1 / 12) - 1, n = i * 12, mo = data.ownYearly / 12;
    return data.pot * Math.pow(1 + m, n) + (m > 0 ? mo * (Math.pow(1 + m, n) - 1) / m : mo * n);
  }
  function today(v, y) { return v / Math.pow(1 + infl, y); }

  function set(o) {
    if (!box || !o || !(o.years > 0) || !o.plan || o.plan.length < o.years + 1) { if (box) { box.hidden = true; } return; }
    var keepEnd = !data || idx === data.years;
    data = o;
    if (keepEnd || idx < 0) { idx = o.years; }
    idx = Math.max(0, Math.min(o.years, idx));
    box.hidden = !(o.pot + o.ownYearly * o.years > 0);
    draw();
  }

  function series() {
    var n = data.years, put = [], bank = [], plan = [];
    for (var i = 0; i <= n; i++) {
      put.push(data.pot + data.ownYearly * i);
      bank.push(today(bankAt(i), i));
      plan.push(today(data.plan[i], i));
    }
    return { put: put, bank: bank, plan: plan };
  }

  function draw() {
    if (!data) { return; }
    var S = series(), n = data.years;
    var top = Math.max.apply(null, S.plan.concat(S.put, [1])) * 1.06;
    var X = function (i) { return PL + (i / n) * (W - PL - PR); };
    var Y = function (v) { return PT + (1 - v / top) * (H - PT - PB); };
    var path = function (a) { return a.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' '); };
    var lost = path(S.put);
    for (var i = n; i >= 0; i--) { lost += ' L' + X(i).toFixed(1) + ' ' + Y(Math.min(S.bank[i], S.put[i])).toFixed(1); }
    [els.faint, els.full].forEach(function (g) {
      g.plan.setAttribute('d', path(S.plan));
      g.put.setAttribute('d', path(S.put));
      g.bank.setAttribute('d', path(S.bank));
      g.lost.setAttribute('d', lost + ' Z');
    });
    if (!timer) { playLabel(false); }
    els.mx.textContent = euro(top);
    els.a0.textContent = label(0);
    els.a1.textContent = label(n);
    els.cache = S;
    els.X = X; els.Y = Y;
    els.note.textContent = data.ownWords + ' The bank pays ' + A.cash.pct + ' a year (Central Bank of Ireland, ' + A.cash.month + '). ' +
      'Prices rising ' + pctOf(infl) + ' a year means money that grows slower than prices buys less each year. In 2022 prices in Ireland rose 7.8% (CSO). ' +
      data.planWords + ' Growth is not guaranteed and investments can fall as well as rise.';
    table(S);
    go(idx);
  }

  /* go(i): show year i. While playing, i runs smoothly between whole years:
     the line and the dots move with it, the figures show the year reached */
  function go(i, smooth) {
    if (!data || !els.cache) { return; }
    var n = data.years, S = els.cache;
    var at = Math.max(0, Math.min(n, i));
    idx = smooth ? Math.floor(at) : Math.round(at);
    if (!smooth) { at = idx; }
    var lo = Math.floor(at), hi = Math.min(n, lo + 1), fr = at - lo;
    var mid = function (a) { return a[lo] + (a[hi] - a[lo]) * fr; };
    var x = els.X(at).toFixed(1);
    els.clip.setAttribute('width', Math.max(0, +x + 1));
    els.cross.setAttribute('x1', x); els.cross.setAttribute('x2', x);
    [['dBank', S.bank], ['dPut', S.put], ['dPlan', S.plan]].forEach(function (d) {
      els[d[0]].setAttribute('cx', x); els[d[0]].setAttribute('cy', els.Y(mid(d[1])).toFixed(1));
    });
    /* the age under the line, kept off the two end labels */
    var showNow = idx > n * 0.15 && idx < n * 0.85;
    els.aNow.textContent = showNow ? label(idx) : '';
    els.aNow.setAttribute('x', x);
    var b = S.bank[idx], p = S.put[idx], v = S.plan[idx], gone = Math.max(0, p - b);
    els.tBank.value.textContent = euro(b);
    els.tPut.value.textContent = euro(p);
    els.tPlan.value.textContent = euro(v);
    var whenShort = data.startAge != null ? 'at ' + (data.startAge + idx) : 'in ' + idx + (idx === 1 ? ' year' : ' years');
    els.cHead.textContent = idx === 0 ? 'What every €100 you put in buys today' : 'What every €100 you put in buys ' + whenShort;
    coinRow(els.cBank, p > 0 ? b / p * 100 : 100, 10);
    coinRow(els.cPlan, p > 0 ? v / p * 100 : 100, 10);
    var when = data.startAge != null ? 'at ' + (data.startAge + idx) : 'in ' + idx + (idx === 1 ? ' year' : ' years');
    els.say.textContent = '';
    if (idx === 0) {
      els.say.appendChild(doc.createTextNode('Today the two are the same. Press play, or drag across the chart, to see them move apart.'));
    } else {
      var parts = ['Leave your own money in a bank and ' + when + ' it buys only what ', euro(b), ' buys today: ', euro(gone) + ' less',
        ' than you put in. Invested in your plan, it could buy what ', euro(v), ' buys today.'];
      parts.forEach(function (t, k) { els.say.appendChild(k % 2 ? el('b', null, t) : doc.createTextNode(t)); });
    }
    els.chart.setAttribute('aria-valuemin', 0);
    els.chart.setAttribute('aria-valuemax', n);
    els.chart.setAttribute('aria-valuenow', idx);
    els.chart.setAttribute('aria-valuetext', label(idx) + ': in a bank it buys ' + euro(b) + ', you put in ' + euro(p) + ', invested it buys ' + euro(v) + ', in today’s money.');
  }

  function table(S) {
    var n = data.years, rows = [];
    for (var i = 0; i <= n; i += 5) { rows.push(i); }
    if (rows[rows.length - 1] !== n) { rows.push(n); }
    els.table.textContent = '';
    var head = els.table.appendChild(el('thead')).appendChild(el('tr'));
    [data.startAge != null ? 'Age' : 'Year', 'In a bank', 'You put in', 'Invested'].forEach(function (h) { var th = head.appendChild(el('th', null, h)); th.scope = 'col'; });
    var body = els.table.appendChild(el('tbody'));
    rows.forEach(function (i) {
      var tr = body.appendChild(el('tr'));
      var th = tr.appendChild(el('th', null, data.startAge != null ? String(data.startAge + i) : (i === 0 ? 'Now' : String(i)))); th.scope = 'row';
      [S.bank[i], S.put[i], S.plan[i]].forEach(function (v) { tr.appendChild(el('td', null, euro(v))); });
    });
    els.table.appendChild(el('caption', null, 'In a bank and invested in today’s money; what you put in, in euro.')).style.cssText = 'caption-side:bottom;text-align:left;padding-top:6px;color:var(--ink-3,#647270)';
  }

  window.PBBank = { mount: mount, set: set };
}());
