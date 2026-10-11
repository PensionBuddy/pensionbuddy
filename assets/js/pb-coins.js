/* Pensionbuddy's coins (11 October 2026, Damian's brief: "a pot and coins,
   as interactive as the welcome"). One way to draw a coin, shared by the home
   page's gap tower, its pension pot and its inflation stacks, and a small
   effects layer: dust, sparkles, rings and the paw print.

     PBCoins.face(cx, x, y, r, kind, angle, alpha, flipX)
         a coin seen face on: rim, face, ring, an embossed €, a highlight
     PBCoins.slice(cx, x, y, w, kind, alpha, top)
         a coin seen from the side, for a stack: its edge (milled) and its
         face; (x, y) is the middle of the face; top draws the € on it
     PBCoins.sliceH(w)  { e, ry }  the edge's height and the face's half
         height for a coin w wide: a stack of n is n * e + 2 * ry tall
     PBCoins.FX()       an effects layer: .dust(x, y, n, kind), .spark(x, y,
         n, colours), .ring(x, y, colour), .paws(x, y, n), .step(dt), .draw(cx),
         .busy()
     PBCoins.KINDS      silver (yours), gold (Revenue's), blue (your
         employer's), teal (the State's), coral (the gap)

   Every coin is drawn once into a small canvas per size and kind, then
   stamped, so a pot of a hundred coins costs a hundred stamps a frame. The
   stamps are made again once the site's font has loaded (the €). */
(function () {
  'use strict';
  var KINDS = {
    silver: { rim: ['#D2DAD8', '#7F8D8A'], face: ['#FFFFFF', '#E1E7E5', '#B4BFBC'], ring: 'rgba(84,99,95,.30)', glyph: '#8C9996', edge: ['#7A8885', '#EEF2F1', '#BCC6C3', '#6E7B78'] },
    gold: { rim: ['#FFD36E', '#B27A10'], face: ['#FFF6D6', '#F8CA5A', '#D99B1D'], ring: 'rgba(150,95,0,.32)', glyph: '#B07A12', edge: ['#A46C0A', '#FFE08A', '#E7AE33', '#93600A'] },
    blue: { rim: ['#C7D9F2', '#5F80AA'], face: ['#FFFFFF', '#CFDDF2', '#93AFD6'], ring: 'rgba(60,90,135,.30)', glyph: '#6584AE', edge: ['#5A7AA3', '#E4EDFA', '#A9C0E2', '#4E6C94'] },
    teal: { rim: ['#5BEBD5', '#0E9E8A'], face: ['#E9FFFB', '#6AE9D6', '#17BCA5'], ring: 'rgba(8,101,90,.32)', glyph: '#0B7A6E', edge: ['#0C8A79', '#8CF3E3', '#2DCDB6', '#097C6D'] },
    coral: { rim: ['#FFD0C4', '#D27A63'], face: ['#FFF6F3', '#FBD3C8', '#EDA693'], ring: 'rgba(170,70,45,.28)', glyph: '#C55E44', edge: ['#C46D57', '#FFE3DB', '#F2B2A1', '#B4604B'] }
  };
  var DPR = function () { return Math.min(window.devicePixelRatio || 1, 2); };
  var cache = {};
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { cache = {}; }); }
  function sprite(key, w, h, paint) {
    var c = cache[key];
    if (c) { return c; }
    var d = DPR(); c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * d)); c.height = Math.max(1, Math.ceil(h * d));
    var x = c.getContext('2d'); x.scale(d, d); paint(x);
    c.cw = w; c.ch = h; cache[key] = c; return c;
  }

  /* ------------------------------------------------------- face on -- */
  function paintFace(x, r, k) {
    x.translate(r + 2, r + 2);
    var g = x.createLinearGradient(-r, -r, r, r); g.addColorStop(0, k.rim[0]); g.addColorStop(1, k.rim[1]);
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fillStyle = g; x.fill();
    var f = x.createRadialGradient(-r * 0.35, -r * 0.42, r * 0.08, 0, 0, r * 0.92);
    f.addColorStop(0, k.face[0]); f.addColorStop(0.55, k.face[1]); f.addColorStop(1, k.face[2]);
    x.beginPath(); x.arc(0, 0, r * 0.83, 0, Math.PI * 2); x.fillStyle = f; x.fill();
    x.lineWidth = Math.max(1, r * 0.07); x.strokeStyle = k.ring; x.beginPath(); x.arc(0.4, 0.5, r * 0.66, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(-0.4, -0.5, r * 0.66, Math.PI * 0.9, Math.PI * 1.6); x.stroke();
    if (r >= 6) {
      x.font = '800 ' + (r * 1.02).toFixed(1) + 'px Figtree, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('€', -0.7, -0.2);
      x.fillStyle = k.glyph; x.fillText('€', 0.4, 0.7);
    }
    x.lineCap = 'round'; x.lineWidth = Math.max(1, r * 0.1); x.strokeStyle = 'rgba(255,255,255,.8)';
    x.beginPath(); x.arc(0, 0, r * 0.9, Math.PI * 1.08, Math.PI * 1.42); x.stroke();
  }
  function face(cx, px, py, r, kind, angle, alpha, flipX) {
    if (!(r > 0.6) || alpha <= 0.01) { return; }
    var k = KINDS[kind] || KINDS.silver, R = Math.round(r * 2) / 2;
    var s = sprite('f' + kind + R, R * 2 + 4, R * 2 + 4, function (x) { paintFace(x, R, k); });
    cx.save(); cx.globalAlpha = alpha === undefined ? 1 : alpha; cx.translate(px, py);
    if (angle) { cx.rotate(angle); }
    if (flipX !== undefined && flipX !== 1) { cx.scale(Math.max(0.02, Math.abs(flipX)), 1); }
    cx.drawImage(s, -R - 2, -R - 2, R * 2 + 4, R * 2 + 4);
    cx.restore();
  }

  /* ------------------------------------------------------- side on -- */
  function sliceH(w) { return { e: Math.max(3, w * 0.105), ry: Math.max(3, w * 0.15) }; }
  function paintSlice(x, w, k, top) {
    var h = sliceH(w), e = h.e, ry = h.ry, rx = w / 2;
    x.translate(2, 2);
    /* the edge: a band under the face, its bottom an arc */
    x.beginPath(); x.moveTo(0, ry); x.lineTo(0, ry + e); x.ellipse(rx, ry + e, rx, ry, 0, Math.PI, 0, true); x.lineTo(w, ry); x.closePath();
    var g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, k.edge[0]); g.addColorStop(0.28, k.edge[1]); g.addColorStop(0.7, k.edge[2]); g.addColorStop(1, k.edge[3]);
    x.fillStyle = g; x.fill();
    /* milling on the edge */
    if (e >= 5) {
      x.save(); x.clip(); x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.09)';
      for (var m = 2; m < w; m += 3) { x.beginPath(); x.moveTo(m, ry); x.lineTo(m, ry + e + ry); x.stroke(); }
      x.restore();
    }
    /* where one coin sits on the next: a dark seam at the foot, a light one under the face */
    x.lineWidth = 1.2; x.strokeStyle = 'rgba(0,0,0,.2)';
    x.beginPath(); x.ellipse(rx, ry + e, rx - 0.6, ry - 0.6, 0, Math.PI * 0.04, Math.PI * 0.96); x.stroke();
    x.lineWidth = 1; x.strokeStyle = 'rgba(255,255,255,.45)';
    x.beginPath(); x.ellipse(rx, ry + 1.2, rx - 0.6, ry - 0.6, 0, Math.PI * 0.08, Math.PI * 0.92); x.stroke();
    /* the face */
    var f = x.createRadialGradient(w * 0.36, ry * 0.55, 1, rx, ry, rx);
    f.addColorStop(0, k.face[0]); f.addColorStop(0.5, k.face[1]); f.addColorStop(1, k.face[2]);
    x.beginPath(); x.ellipse(rx, ry, rx, ry, 0, 0, Math.PI * 2); x.fillStyle = f; x.fill();
    x.lineWidth = Math.max(1, w * 0.012); x.strokeStyle = k.ring;
    x.beginPath(); x.ellipse(rx, ry + 0.4, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.55)';
    x.beginPath(); x.ellipse(rx, ry - 0.4, rx * 0.8, ry * 0.8, 0, Math.PI * 1.05, Math.PI * 1.7); x.stroke();
    if (top && w > 30) {
      x.save(); x.translate(rx, ry); x.scale(1, ry / rx * 1.15);
      x.font = '800 ' + (w * 0.5).toFixed(1) + 'px Figtree, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(255,255,255,.7)'; x.fillText('€', -1, -1.5);
      x.fillStyle = k.glyph; x.fillText('€', 0.5, 1); x.restore();
    }
  }
  function slice(cx, px, py, w, kind, alpha, top) {
    if (!(w > 2) || alpha <= 0.01) { return; }
    var k = KINDS[kind] || KINDS.silver, W = Math.round(w), h = sliceH(W);
    var s = sprite('s' + kind + W + (top ? 't' : ''), W + 4, h.e + h.ry * 2 + 4, function (x) { paintSlice(x, W, k, top); });
    cx.save(); if (alpha !== undefined && alpha < 1) { cx.globalAlpha = alpha; }
    cx.drawImage(s, px - W / 2 - 2, py - h.ry - 2, W + 4, h.e + h.ry * 2 + 4);
    cx.restore();
  }

  /* --------------------------------------------------------- effects -- */
  var PAD = window.Path2D ? new Path2D('M32 31C22.2 31 15.8 37.6 15.8 45.1C15.8 51.7 21.4 55.6 32 55.6C42.6 55.6 48.2 51.7 48.2 45.1C48.2 37.6 41.8 31 32 31Z') : null;
  var TOE = [[23.2, 17.6, 6.1, 8.3, -9], [40.8, 17.6, 6.1, 8.3, 9], [9.8, 28.6, 5.5, 7.4, -31], [54.2, 28.6, 5.5, 7.4, 31]];
  function paw(cx, x, y, size, a, col, alpha) {
    if (!PAD || alpha <= 0.01 || size <= 0.5) { return; }
    cx.save(); cx.globalAlpha = alpha; cx.fillStyle = col; cx.translate(x, y); cx.rotate(a); var k = size / 64; cx.scale(k, k); cx.translate(-32, -36);
    TOE.forEach(function (t) { cx.beginPath(); cx.ellipse(t[0], t[1], t[2], t[3], t[4] * Math.PI / 180, 0, Math.PI * 2); cx.fill(); });
    cx.fill(PAD); cx.restore();
  }
  function FX() { this.p = []; }
  FX.prototype.add = function (q) { this.p.push(q); if (this.p.length > 400) { this.p.splice(0, this.p.length - 400); } };
  FX.prototype.dust = function (x, y, n, kind) {
    var k = KINDS[kind] || KINDS.silver;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 90;
      this.add({ t: 'dust', x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 30, g: 160, life: 0.9 + Math.random() * 0.8, age: 0, s: 1.4 + Math.random() * 2.6, c: [k.edge[0], k.edge[2], k.face[1]][i % 3] });
    }
  };
  FX.prototype.spark = function (x, y, n, cols) {
    cols = cols || ['#14CBB1', '#F4B740', '#7FE3D3', '#FFFFFF'];
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = 140 + Math.random() * 240;
      this.add({ t: 'spark', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 520, life: 0.7 + Math.random() * 0.5, age: 0, s: 3 + Math.random() * 4, c: cols[i % cols.length], rot: Math.random() * 3 });
    }
  };
  FX.prototype.ring = function (x, y, c, w) { this.add({ t: 'ring', x: x, y: y, life: 0.45, age: 0, c: c || 'rgba(255,255,255,.9)', w: w || 14 }); };
  FX.prototype.paws = function (x, y, n, cols) {
    cols = cols || ['#14CBB1', '#7FE3D3', '#F4B740', '#0B7A6E'];
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 150 + Math.random() * 200;
      this.add({ t: 'paw', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 420, life: 1 + Math.random() * 0.4, age: 0, s: 13 + Math.random() * 9, c: cols[i % cols.length], rot: (Math.random() - 0.5) * 1.2, vr: (Math.random() - 0.5) * 4 });
    }
  };
  FX.prototype.busy = function () { return this.p.length > 0; };
  FX.prototype.step = function (dt) {
    this.p = this.p.filter(function (q) {
      q.age += dt; if (q.age >= q.life) { return false; }
      if (q.vx !== undefined) { q.vy += (q.g || 0) * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
      if (q.vr) { q.rot += q.vr * dt; }
      return true;
    });
  };
  FX.prototype.draw = function (cx) {
    this.p.forEach(function (q) {
      var k = q.age / q.life, a = k < 0.12 ? k / 0.12 : 1 - Math.max(0, (k - 0.5) / 0.5);
      if (q.t === 'dust') {
        cx.globalAlpha = a * 0.9; cx.fillStyle = q.c; cx.beginPath(); cx.arc(q.x, q.y, q.s * (1 - k * 0.5), 0, Math.PI * 2); cx.fill();
      } else if (q.t === 'spark') {
        cx.save(); cx.globalAlpha = a; cx.translate(q.x, q.y); cx.rotate(q.rot + k * 3); cx.fillStyle = q.c;
        var s = q.s * (1 - k * 0.4); cx.beginPath();
        for (var i = 0; i < 8; i++) { var rr = i % 2 ? s * 0.35 : s, an = i * Math.PI / 4; cx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
        cx.closePath(); cx.fill(); cx.restore();
      } else if (q.t === 'ring') {
        cx.globalAlpha = 1 - k; cx.strokeStyle = q.c; cx.lineWidth = 2;
        cx.beginPath(); cx.ellipse(q.x, q.y, 4 + q.w * k * 1.6, 1.5 + q.w * k * 0.45, 0, 0, Math.PI * 2); cx.stroke();
      } else if (q.t === 'paw') {
        paw(cx, q.x, q.y, q.s * (0.7 + 0.3 * Math.min(1, q.age * 5)), q.rot, q.c, a * 0.95);
      }
    });
    cx.globalAlpha = 1;
  };

  window.PBCoins = { KINDS: KINDS, face: face, slice: slice, sliceH: sliceH, FX: FX, paw: paw };
}());
