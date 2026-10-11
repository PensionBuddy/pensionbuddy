/* The home page's motion kit (11 October 2026, Damian's brief: one clear
   path, gap -> calculator -> inflation, and go all out on the motion).

   Shared by assets/js/pb-home-gap.js, pb-home-calc.js and pb-home-basket.js.
   Nothing here works out a figure.

     PBKit.fmt(v)             '€3,636'
     PBKit.motion()           true while the reader allows motion
     PBKit.Spring(x, k, c)    a damped spring: .t is where it is going,
                              .step(dt) moves it, .done() once it has landed
     PBKit.Roll(el)           an odometer: .set('€3,636') rolls each digit to
                              its new place; the real text stays in the page
                              for screen readers, the digits are a picture
     PBKit.seg(group, fn)     a row of aria-pressed buttons with one pill
                              behind the pressed one that springs between them
     PBKit.aim                { level, hh }: the way of life the reader picked,
                              shared by the gap and the calculator
     PBKit.setAim(lv, hh, by) changes it and tells the page ('pb:aim') */
(function () {
  'use strict';
  var root = document.documentElement;
  function motion() { return root.classList.contains('pb-motion'); }
  function fmt(v) { return '€' + Math.round(v).toLocaleString('en-IE'); }

  function Spring(x, k, c) { this.x = x || 0; this.v = 0; this.t = x || 0; this.k = k || 170; this.c = c || 18; }
  Spring.prototype.step = function (dt) {
    if (!motion()) { this.x = this.t; this.v = 0; return; }
    var a = this.k * (this.t - this.x) - this.c * this.v;
    this.v += a * dt; this.x += this.v * dt;
    if (this.done()) { this.x = this.t; this.v = 0; }
  };
  Spring.prototype.done = function () { return Math.abs(this.t - this.x) < 0.0005 * Math.max(1, Math.abs(this.t)) && Math.abs(this.v) < 0.01 * Math.max(1, Math.abs(this.t)); };

  /* ---------------------------------------------------------- odometer -- */
  var DIG = '0123456789';
  function Roll(el) {
    this.el = el; this.cols = []; this.text = '';
    var t = el.textContent;
    el.textContent = '';
    el.classList.add('pb-odo');
    this.sr = document.createElement('span'); this.sr.className = 'pb-odo-sr';
    this.vis = document.createElement('span'); this.vis.className = 'pb-odo-vis'; this.vis.setAttribute('aria-hidden', 'true');
    el.appendChild(this.sr); el.appendChild(this.vis);
    this.set(t, true);
  }
  function col(ch) {
    var c = document.createElement('span');
    if (DIG.indexOf(ch) >= 0) {
      c.className = 'pb-odo-c';
      var s = document.createElement('span'); s.className = 'pb-odo-s';
      for (var i = 0; i < 10; i++) { var d = document.createElement('span'); d.textContent = i; s.appendChild(d); }
      c.appendChild(s); c._d = true;
    } else { c.className = 'pb-odo-x'; c.textContent = ch; c._d = false; }
    return c;
  }
  Roll.prototype.set = function (text, instant) {
    text = String(text);
    if (text === this.text && !instant) { return; }
    this.text = text; this.sr.textContent = text;
    var chars = text.split(''), cols = this.cols, vis = this.vis, n = chars.length, k, ch, c;
    var quiet = instant || !motion();
    /* columns line up from the right, so the units stay where they are */
    while (cols.length > n) { c = cols.shift(); vis.removeChild(c); }
    for (k = 0; k < n; k++) {
      ch = chars[n - 1 - k]; var at = cols.length - 1 - k, isD = DIG.indexOf(ch) >= 0;
      c = at >= 0 ? cols[at] : null;
      if (!c || c._d !== isD) {
        var nc = col(ch);
        if (c) { vis.replaceChild(nc, c); cols[at] = nc; } else { vis.insertBefore(nc, vis.firstChild); cols.unshift(nc); }
        c = nc;
        if (isD && !quiet) {
          /* a new digit rolls in from 0 */
          var s0 = c.firstChild; s0.style.transition = 'none'; s0.style.transform = 'translateY(0)'; void s0.offsetHeight; s0.style.transition = '';
        }
      }
      if (isD) {
        var s = c.firstChild;
        s.style.transitionDelay = quiet ? '0s' : (k * 0.035).toFixed(3) + 's';
        if (quiet) { s.style.transition = 'none'; }
        s.style.transform = 'translateY(' + (-10 * (+ch)) + '%)';
        if (quiet) { void s.offsetHeight; s.style.transition = ''; }
      } else if (c.textContent !== ch) { c.textContent = ch; }
    }
  };

  /* ------------------------------------------------- segmented pills -- */
  function seg(group, onPick) {
    var btns = [].slice.call(group.querySelectorAll('button'));
    var ind = document.createElement('i'); ind.className = 'pb-seg-ind'; ind.setAttribute('aria-hidden', 'true');
    group.insertBefore(ind, group.firstChild); group.classList.add('pb-seg-live');
    function place(quiet) {
      var on = btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
      if (!on || !on.offsetWidth) { return; }
      if (quiet) { ind.style.transition = 'none'; }
      ind.style.width = on.offsetWidth + 'px'; ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
      if (quiet) { void ind.offsetWidth; ind.style.transition = ''; }
    }
    function press(b, quiet) {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      place(quiet);
      if (!quiet && motion()) { ind.classList.remove('pb-seg-pop'); void ind.offsetWidth; ind.classList.add('pb-seg-pop'); }
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { if (b.getAttribute('aria-pressed') === 'true') { return; } press(b); onPick(b); }); });
    window.addEventListener('resize', function () { place(true); });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { place(true); }); }
    requestAnimationFrame(function () { place(true); });
    return { press: function (pred, quiet) { var b = btns.filter(pred)[0]; if (b) { press(b, quiet); } }, place: place };
  }

  /* ------------------------------------------------- the reader's aim -- */
  var aim = { level: 'modest', hh: 'single' };
  function setAim(level, hh, by) {
    if (level === aim.level && hh === aim.hh) { return; }
    aim.level = level; aim.hh = hh;
    try { document.dispatchEvent(new CustomEvent('pb:aim', { detail: { level: level, hh: hh, by: by } })); } catch (e) { /* old browser: each part keeps its own */ }
  }

  window.PBKit = { fmt: fmt, motion: motion, Spring: Spring, Roll: Roll, seg: seg, aim: aim, setAim: setAim };
}());
