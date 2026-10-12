/* Pensionbuddy's coins (11 October 2026, Damian's brief: "a pot and coins,
   as interactive as the welcome"). One way to draw a coin, shared by the home
   page's gap tower, its pension pot and its inflation stacks, and a small
   effects layer: dust, sparkles, rings and the paw print.

     PBCoins.face(cx, x, y, r, kind, angle, alpha, flipX)
         a coin seen face on: a raised rim, a sunk field, twelve struck dots,
         an embossed €, a soft shine
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
  /* metal, not paint: each kind is a light, a middle and a shade of one
     metal, and seven stops across a coin's milled edge (a cylinder catching
     the light from the upper left). tint is the shade, for lines, with the
     alpha left open. */
  var KINDS = {
    silver: { hi: '#FBFCFC', mid: '#D8DFDE', lo: '#9EAAA7', edge: ['#5E6B68', '#A5B0AD', '#EEF2F1', '#B9C3C0', '#E1E7E6', '#8C9895', '#55615E'], tint: 'rgba(62,78,74,' },
    gold: { hi: '#FFF3CF', mid: '#E9C978', lo: '#B68B37', edge: ['#6C4C14', '#B08431', '#F5DC98', '#CFA44B', '#ECCD86', '#9E7326', '#614410'], tint: 'rgba(104,74,18,' },
    blue: { hi: '#F5F8FD', mid: '#C8D6EE', lo: '#8BA3C9', edge: ['#4B6187', '#8EA4C9', '#E8EFFA', '#ADBFDE', '#DAE4F5', '#7B91B7', '#43587C'], tint: 'rgba(48,68,108,' },
    teal: { hi: '#E7FBF7', mid: '#86DFCF', lo: '#2EA792', edge: ['#0E6257', '#39AE9A', '#B4F0E5', '#5AC7B4', '#9CE8DA', '#289583', '#0C584E'], tint: 'rgba(6,86,76,' },
    coral: { hi: '#FFF1EC', mid: '#F3BBAB', lo: '#D58873', edge: ['#954F3B', '#D38A75', '#FFE1D8', '#E7A792', '#FAD2C6', '#C57964', '#854533'], tint: 'rgba(146,68,48,' }
  };
  var TAU = Math.PI * 2;
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

  /* ------------------------------------------------------- the face -- */
  /* a coin's face at the origin, radius r: a raised rim, a sunk field, its
     inner wall dark where it faces away from the light, twelve struck dots,
     an embossed €, and a soft shine over the upper left */
  function drawFace(x, r, k, glyph, dots) {
    var g = x.createLinearGradient(-r * 0.6, -r, r * 0.6, r);
    g.addColorStop(0, k.hi); g.addColorStop(0.5, k.mid); g.addColorStop(1, k.lo);
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fillStyle = g; x.fill();
    var fr = r * 0.8, f = x.createLinearGradient(-fr * 0.6, -fr, fr * 0.6, fr);
    f.addColorStop(0, k.mid); f.addColorStop(0.55, k.hi); f.addColorStop(1, k.mid);
    x.beginPath(); x.arc(0, 0, fr, 0, TAU); x.fillStyle = f; x.fill();
    x.lineWidth = Math.max(0.7, r * 0.05);
    x.strokeStyle = k.tint + '.32)'; x.beginPath(); x.arc(0, 0, fr, Math.PI * 0.8, Math.PI * 1.75); x.stroke();
    x.lineWidth = Math.max(0.6, r * 0.035); x.strokeStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(0, 0, fr, -Math.PI * 0.15, Math.PI * 0.65); x.stroke();
    var s = Math.max(0.5, r / 16);
    if (dots) {
      var rr = fr * 0.8, d = Math.max(0.55, r * 0.034);
      for (var i = 0; i < 12; i++) {
        var a = i * TAU / 12 - Math.PI / 2, px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(px - 0.45 * s, py - 0.45 * s, d, 0, TAU); x.fill();
        x.fillStyle = k.tint + '.34)'; x.beginPath(); x.arc(px + 0.45 * s, py + 0.45 * s, d, 0, TAU); x.fill();
        x.fillStyle = k.mid; x.beginPath(); x.arc(px, py, d, 0, TAU); x.fill();
      }
    }
    if (glyph) {
      x.font = '700 ' + (fr * (dots ? 0.98 : 1.1)).toFixed(1) + 'px Figtree, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = k.tint + '.38)'; x.fillText('€', 0.7 * s, 0.9 * s);
      x.fillStyle = 'rgba(255,255,255,.9)'; x.fillText('€', -0.55 * s, -0.65 * s);
      x.fillStyle = k.mid; x.fillText('€', 0, 0);
    }
    x.lineWidth = Math.max(0.6, r * 0.03); x.strokeStyle = k.tint + '.4)';
    x.beginPath(); x.arc(0, 0, r - x.lineWidth / 2, 0, TAU); x.stroke();
    var gl = x.createRadialGradient(-r * 0.42, -r * 0.55, 0, -r * 0.42, -r * 0.55, r * 1.15);
    gl.addColorStop(0, 'rgba(255,255,255,.5)'); gl.addColorStop(0.45, 'rgba(255,255,255,.1)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fillStyle = gl; x.fill();
  }

  /* ------------------------------------------------------- face on -- */
  function paintFace(x, r, k) { x.translate(r + 2, r + 2); drawFace(x, r, k, r >= 6, r >= 9); }
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
  function band(x, w, e, ry) {
    var rx = w / 2;
    x.beginPath(); x.moveTo(0, ry); x.lineTo(0, ry + e); x.ellipse(rx, ry + e, rx, ry, 0, Math.PI, 0, true); x.lineTo(w, ry); x.closePath();
  }
  function paintSlice(x, w, k, top) {
    var h = sliceH(w), e = h.e, ry = h.ry, rx = w / 2, i;
    x.translate(2, 2);
    /* the milled edge: a cylinder, light from the upper left */
    band(x, w, e, ry);
    var g = x.createLinearGradient(0, 0, w, 0), at = [0, 0.1, 0.27, 0.45, 0.63, 0.86, 1];
    for (i = 0; i < 7; i++) { g.addColorStop(at[i], k.edge[i]); }
    x.fillStyle = g; x.fill();
    x.save(); band(x, w, e, ry); x.clip();
    if (e >= 4) {
      /* the ridges, closer together towards the sides as the edge turns away */
      var n = Math.max(10, Math.round(w / 2.4));
      for (i = 0; i < n; i++) {
        var xx = rx - rx * Math.cos((i + 0.5) / n * Math.PI);
        x.fillStyle = k.tint + '.16)'; x.fillRect(xx, ry - 1, 0.8, e + ry + 2);
        x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(xx + 0.8, ry - 1, 0.6, e + ry + 2);
      }
    }
    /* light just under the face, shade where it sits on the coin below */
    var v = x.createLinearGradient(0, ry, 0, ry * 2 + e);
    v.addColorStop(0, 'rgba(255,255,255,.28)'); v.addColorStop(0.25, 'rgba(255,255,255,0)'); v.addColorStop(0.6, 'rgba(0,0,0,0)'); v.addColorStop(1, k.tint + '.3)');
    x.fillStyle = v; x.fillRect(0, 0, w, e + ry * 2);
    x.restore();
    x.lineWidth = 1; x.strokeStyle = k.tint + '.28)';
    x.beginPath(); x.ellipse(rx, ry + e, rx - 0.5, ry - 0.5, 0, Math.PI * 0.03, Math.PI * 0.97); x.stroke();
    /* the face, seen at a slant */
    x.save(); x.translate(rx, ry); x.scale(1, ry / rx); drawFace(x, rx, k, top && w > 28, top && w > 44); x.restore();
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
      this.add({ t: 'dust', x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 30, g: 160, life: 0.9 + Math.random() * 0.8, age: 0, s: 1.4 + Math.random() * 2.6, c: [k.edge[0], k.edge[2], k.mid][i % 3] });
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
