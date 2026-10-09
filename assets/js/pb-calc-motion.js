/* The pension calculator, alive (8 October 2026, Damian's brief). Loaded
   after the page's own script, whose project() and sliders it reads; it
   never changes a figure the page shows, and every figure it adds comes
   from the page's own project(), on the page's own inputs.

   - The chart: run a pointer or a finger along "How your pot could grow"
     and a line follows it, with the pot at that age, plan and plan plus
     €100 a month, in a bubble. The first time the chart comes into view the
     line sweeps it once by itself.
   - The cost of waiting: a handle under the sentence. Drag it and see what
     putting it off for one to ten years costs, as two bars and a gap: the
     page's own sum ("put this off for twelve months"), with more months.
   - The pot: it bounces when it moves, and when it passes €100,000,
     €250,000, €500,000 or €1 million going up, it bursts with coins.

   Without motion the chart line and the waiting handle still work (they are
   reading aids, and nothing moves by itself); the bounce, the sweep and the
   coins are left out. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  /* the pension calculator only: the pages built on it as a skeleton load this too */
  if (typeof window.project !== 'function' || !$('chart') || !$('potOut') || !$('waitOut') || !$('mine') || !$('emp')) { return; }
  var root = document.documentElement;
  root.classList.add('pb-calc-alive');
  function motion() { return root.classList.contains('pb-motion'); }
  var euro = window.PBPage ? window.PBPage.euro : function (v) { return '€' + Math.round(v).toLocaleString('en-IE'); };
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

  /* the page's inputs, read the way its calc() reads them */
  function inputs() {
    var age = +$('age').value, ret = Math.max(+$('ret').value, Math.max(50, age + 1));
    var pot = +$('pot').value, mine = +$('mine').value, emp = +$('emp').value, g = +$('growth').value;
    return { age: age, ret: ret, pot: pot, monthly: mine + emp, months: (ret - age) * 12, mRate: Math.pow(1 + g / 100, 1 / 12) - 1 };
  }
  function at(I, m, extra) { return window.project(m, I.pot, I.monthly + (extra || 0), I.mRate); }

  /* ================================================ 1. the chart line == */
  var host = $('chart'), NS = 'http://www.w3.org/2000/svg';
  var G = { W: 620, H: 270, padL: 6, padR: 6, padT: 14, padB: 30 };
  var tip = document.createElement('div');
  tip.className = 'pb-scrub-tip'; tip.setAttribute('aria-hidden', 'true'); tip.hidden = true;
  host.style.position = 'relative';
  host.appendChild(tip);
  var g = null, vline = null, dotB = null, dotU = null;
  function ensure() {
    var svg = host.querySelector('svg');
    if (!svg || (g && g.ownerSVGElement === svg)) { return !!svg; }
    g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pb-scrub'); g.style.opacity = 0;
    vline = document.createElementNS(NS, 'line'); vline.setAttribute('y1', G.padT); vline.setAttribute('y2', G.H - G.padB);
    vline.setAttribute('stroke', '#0B1F1C'); vline.setAttribute('stroke-width', '1.5'); vline.setAttribute('stroke-dasharray', '3 4');
    dotU = document.createElementNS(NS, 'circle'); dotU.setAttribute('r', 6); dotU.setAttribute('fill', '#F4B740'); dotU.setAttribute('stroke', '#fff'); dotU.setAttribute('stroke-width', 2.5);
    dotB = document.createElementNS(NS, 'circle'); dotB.setAttribute('r', 7); dotB.setAttribute('fill', '#586B85');   /* the plan's line is slate on the page (Run 43): the dot matches it */ dotB.setAttribute('stroke', '#fff'); dotB.setAttribute('stroke-width', 2.5);
    g.appendChild(vline); g.appendChild(dotU); g.appendChild(dotB); svg.appendChild(g);
    return true;
  }
  /* show the line at a fraction f of the way along the chart, snapped to a whole year */
  function scrubAt(f) {
    if (!ensure()) { return; }
    var I = inputs(), yrs = Math.round(clamp(f, 0, 1) * (I.ret - I.age)), m = yrs * 12;
    var b = at(I, m), u = at(I, m, 100), max = at(I, I.months, 100) * 1.08 || 1;
    var x = G.padL + (I.months ? m / I.months : 0) * (G.W - G.padL - G.padR);
    var Y = function (v) { return G.padT + (1 - v / max) * (G.H - G.padT - G.padB); };
    vline.setAttribute('x1', x); vline.setAttribute('x2', x);
    dotB.setAttribute('cx', x); dotB.setAttribute('cy', Y(b)); dotU.setAttribute('cx', x); dotU.setAttribute('cy', Y(u));
    g.style.opacity = 1;
    tip.innerHTML = '<b>At ' + (I.age + yrs) + '</b><span><i class="pb-k-b"></i>' + euro(b) + '</span><span><i class="pb-k-u"></i>' + euro(u) + ' with €100 more a month</span>';
    tip.hidden = false;
    var hb = host.getBoundingClientRect(), px = x / G.W * hb.width, py = Y(u) / G.H * hb.height;
    var tw = tip.offsetWidth;
    tip.style.left = clamp(px - tw / 2, 0, hb.width - tw) + 'px';
    tip.style.top = Math.max(-8, py - tip.offsetHeight - 14) + 'px';
  }
  function scrubOff() { if (g) { g.style.opacity = 0; } tip.hidden = true; }
  function frac(e) { var b = host.getBoundingClientRect(); return (e.clientX - b.left) / b.width; }
  var sweeping = 0;
  host.addEventListener('pointermove', function (e) { sweeping = 0; scrubAt(frac(e)); });
  host.addEventListener('pointerdown', function (e) { sweeping = 0; scrubAt(frac(e)); });
  host.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { scrubOff(); } });
  document.addEventListener('pointerdown', function (e) { if (!host.contains(e.target)) { scrubOff(); } });
  /* the first view: the line sweeps the chart once */
  if (motion() && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) { return; }
      io.disconnect();
      var t0 = performance.now(); sweeping = 1;
      (function sweep(now) {
        if (!sweeping) { return; }
        var k = (now - t0) / 2200;
        if (k >= 1) { sweeping = 0; setTimeout(scrubOff, 900); scrubAt(1); return; }
        scrubAt(k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
        requestAnimationFrame(sweep);
      })(t0);
    }, { threshold: 0.6 });
    io.observe(host);
  }

  /* ======================================= 2. the cost of waiting, by hand == */
  var wait = $('waitOut'), wcard = wait && wait.closest('.waitcard');
  var W = null;
  if (wcard) {
    W = document.createElement('div');
    W.className = 'pb-wait';
    W.innerHTML =
      '<div class="pb-wait-row"><label for="pbWaitY">Put it off for</label><span class="pb-wait-v" id="pbWaitV">1 year</span></div>' +
      '<input type="range" id="pbWaitY" min="1" max="10" step="1" value="1">' +
      '<div class="pb-wait-bars" aria-hidden="true">' +
        '<div class="pb-wait-bar"><span class="pb-wait-l">Start now</span><span class="pb-wait-track"><i class="pb-wait-now"></i></span><b id="pbWaitNow"></b></div>' +
        '<div class="pb-wait-bar"><span class="pb-wait-l" id="pbWaitLL">Start in 1 year</span><span class="pb-wait-track"><i class="pb-wait-late"></i><i class="pb-wait-gap"></i></span><b id="pbWaitLate"></b></div>' +
      '</div>' +
      '<p class="pb-wait-out" id="pbWaitOut" aria-live="polite"></p>';
    wcard.appendChild(W);
  }
  var wr = $('pbWaitY'), wShown = { late: 1, gap: 0 }, wWant = { late: 1, gap: 0 }, wraf = 0;
  function waitPaint() {
    if (!W) { return; }
    var I = inputs(), maxY = Math.max(1, Math.min(10, Math.floor((I.months - 1) / 12)));
    W.hidden = I.months <= 12;
    if (W.hidden) { return; }
    wr.max = maxY; if (+wr.value > maxY) { wr.value = maxY; }
    var y = +wr.value, base = at(I, I.months);
    /* the page's own sum for twelve months, with 12 x y months: the pot keeps
       growing, the contributions of those months never happen */
    var later = window.project(I.months - 12 * y, I.pot * Math.pow(1 + I.mRate, 12 * y), I.monthly, I.mRate);
    var gap = Math.max(0, base - later);
    wr.style.setProperty('--fill', ((y - 1) / Math.max(1, maxY - 1) * 100) + '%');
    wr.setAttribute('aria-valuetext', y + (y === 1 ? ' year' : ' years') + ': ' + euro(gap) + ' less');
    $('pbWaitV').textContent = y + (y === 1 ? ' year' : ' years');
    $('pbWaitLL').textContent = 'Start in ' + y + (y === 1 ? ' year' : ' years');
    $('pbWaitNow').textContent = euro(base);
    $('pbWaitLate').textContent = euro(later);
    $('pbWaitOut').innerHTML = 'Wait ' + y + (y === 1 ? ' year' : ' years') + ' and you retire with roughly <b>' + euro(gap) + '</b> less.';
    wWant.late = base > 0 ? later / base : 1; wWant.gap = base > 0 ? gap / base : 0;
    if (!motion()) { wShown.late = wWant.late; wShown.gap = wWant.gap; bars(); return; }
    if (!wraf) { wraf = requestAnimationFrame(wstep); }
  }
  var wv = { late: 0, gap: 0 };
  function bars() {
    W.querySelector('.pb-wait-late').style.width = (wShown.late * 100).toFixed(2) + '%';
    var gp = W.querySelector('.pb-wait-gap');
    gp.style.left = (wShown.late * 100).toFixed(2) + '%'; gp.style.width = (Math.max(0, wShown.gap) * 100).toFixed(2) + '%';
  }
  function wstep() {
    wraf = 0;
    var dt = 1 / 60, busy = false;
    ['late', 'gap'].forEach(function (k) {
      var a = 260 * (wWant[k] - wShown[k]) - 18 * wv[k]; wv[k] += a * dt; wShown[k] += wv[k] * dt;
      if (Math.abs(wWant[k] - wShown[k]) > 0.0005 || Math.abs(wv[k]) > 0.001) { busy = true; } else { wShown[k] = wWant[k]; wv[k] = 0; }
    });
    bars();
    if (busy) { wraf = requestAnimationFrame(wstep); }
  }
  if (wr) { wr.addEventListener('input', function () { waitPaint(); if (motion()) { W.classList.remove('pb-wait-tick'); void W.offsetWidth; W.classList.add('pb-wait-tick'); } }); }

  /* ==================================== 3. the pot: bounce, and milestones == */
  var potEl = $('potOut'), MILES = [100000, 250000, 500000, 1000000], lastBase = null;
  var party = null, pcx = null, bits = [], praf = 0, plast = 0;
  function burst(x, y) {
    if (!party) {
      party = document.createElement('canvas'); party.className = 'pb-party'; party.setAttribute('aria-hidden', 'true');
      document.body.appendChild(party); pcx = party.getContext('2d');
    }
    var d = Math.min(window.devicePixelRatio || 1, 2);
    party.width = Math.round(window.innerWidth * d); party.height = Math.round(window.innerHeight * d);
    for (var i = 0; i < 36; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = 500 + Math.random() * 600;
      bits.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 6 + Math.random() * 6, ph: Math.random() * 6, age: 0, life: 1.6 + Math.random() * 0.8,
        c: ['#F4B740', '#586B85', '#0B1F1C', '#8A97A8'][i % 4] });
    }
    if (!praf) { plast = performance.now() / 1000; praf = requestAnimationFrame(pstep); }
  }
  function pstep(ms) {
    praf = 0;
    var now = ms / 1000, dt = Math.min(1 / 30, now - plast), d = Math.min(window.devicePixelRatio || 1, 2); plast = now;
    pcx.setTransform(d, 0, 0, d, 0, 0); pcx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    bits = bits.filter(function (b) {
      b.age += dt; b.vy += 1100 * dt; b.vx *= Math.pow(0.4, dt); b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.age > b.life) { return false; }
      pcx.save(); pcx.globalAlpha = 1 - Math.max(0, (b.age - b.life + 0.5) / 0.5); pcx.translate(b.x, b.y); pcx.scale(Math.cos(b.ph + b.age * 8), 1);
      pcx.fillStyle = b.c; pcx.beginPath(); pcx.arc(0, 0, b.r, 0, Math.PI * 2); pcx.fill();
      pcx.strokeStyle = 'rgba(255,255,255,.55)'; pcx.lineWidth = 1.5; pcx.beginPath(); pcx.arc(0, 0, b.r * 0.62, 0, Math.PI * 2); pcx.stroke();
      pcx.restore(); return true;
    });
    if (bits.length) { praf = requestAnimationFrame(pstep); } else { pcx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }
  function badge(text) {
    var b = document.createElement('span'); b.className = 'pb-mile'; b.setAttribute('aria-hidden', 'true'); b.textContent = text;
    potEl.parentNode.style.position = 'relative'; potEl.parentNode.appendChild(b);
    setTimeout(function () { if (b.parentNode) { b.parentNode.removeChild(b); } }, 2200);
  }
  function potPaint() {
    var I = inputs(), base = at(I, I.months);
    if (lastBase !== null && motion()) {
      if (Math.abs(base - lastBase) > 1) { potEl.classList.remove('pb-pot-bump'); void potEl.offsetWidth; potEl.classList.add('pb-pot-bump'); }
      MILES.forEach(function (m) {
        if (lastBase < m && base >= m) {
          var r = potEl.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2);
          badge('Past ' + (m >= 1000000 ? '€1 million' : euro(m)));
        }
      });
    }
    lastBase = base;
  }

  /* after the page's own handlers: every slider, and the tax-rate buttons */
  function update() { waitPaint(); potPaint(); }
  document.addEventListener('input', function (e) { if (e.target && e.target.id !== 'pbWaitY') { update(); } });
  ['t20', 't40'].forEach(function (id) { var b = $(id); if (b) { b.addEventListener('click', update); } });
  update();
}());
