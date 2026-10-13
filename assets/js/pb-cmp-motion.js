/* The auto-enrolment comparison, in motion (13 October 2026; Damian:
   "use world-class motion design where possible"). A module of the compare
   record in tools/pagebuild.py, loaded before the page's own script. It
   works nothing out: the page hands it every figure and every width, and
   it only decides how the screen gets there.

     PBCmpMotion.num(el, v, fmt)   a figure rolls from what it shows to v
                                   (a fourth argument, true: it is there at once)
     PBCmpMotion.width(el, pct)    a bar's part glides to pct of its track
     PBCmpMotion.arm(box)          the bars in box wait, empty, until box
                                   comes into view, then fill in the order
                                   the money arrives: you, then your
                                   employer or the tax relief, then the State
     PBCmpMotion.open(wrap, on)    a hidden block opens (or closes) into its
                                   space; its bars fill as it arrives
     PBCmpMotion.pop(el)           a tag springs in
     PBCmpMotion.nudge(el)         a mark just passed lifts and settles, either way
     PBCmpMotion.swap(el)          a sentence just rewritten settles in

   One clock for all of it: a critically damped spring, so a figure or a
   bar retargeted mid-flight (a slider being dragged) carries on from where
   it is, at the speed it had, with no restart and no stutter. It never
   shows a value past the true one: a spring that would cross its target
   stops on it. Positions that carry no value (a tag, a card arriving) get
   a gentle spring that may settle a hair past its place.

   With motion off (html without pb-motion), every call simply writes the
   end state, and turning motion off mid-visit lands everything at once. */
(function () {
  'use strict';
  var root = document.documentElement;
  function motion() { return root.classList.contains('pb-motion') && !!window.requestAnimationFrame; }
  function euro(v) { return '€' + Math.round(v).toLocaleString('en-IE'); }

  /* ---- the spring clock ---- */
  var K = 340, C = 2 * Math.sqrt(K);   // stiffness, and damping for exactly no bounce
  var live = [], raf = 0, last = 0;
  function spring(apply, x, eps) { return { x: x, v: 0, t: x, apply: apply, eps: eps, wait: 0, held: false, on: false }; }
  function frame(now) {
    raf = 0;
    var dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000));
    last = now;
    for (var i = live.length - 1; i >= 0; i--) {
      var s = live[i];
      if (s.wait > now) { continue; }
      var n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (var j = 0; j < n; j++) {
        var off = s.x - s.t;
        s.v += (-K * off - C * s.v) * h;
        s.x += s.v * h;
        if ((s.x - s.t) * off < 0) { s.x = s.t; s.v = 0; break; }   // never past the true value
      }
      if (Math.abs(s.x - s.t) < s.eps && Math.abs(s.v) < s.eps * 8) {
        s.x = s.t; s.v = 0; s.on = false; live.splice(i, 1);
      }
      s.apply(s.x);
    }
    if (live.length) { raf = requestAnimationFrame(frame); }
  }
  function go(s, delay) {
    if (!motion()) { land(s); return; }        // nothing moves with motion off, whoever asks
    s.wait = delay ? performance.now() + delay : 0;
    if (!s.on) { s.on = true; live.push(s); }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function land(s) {
    var k = live.indexOf(s);
    if (k >= 0) { live.splice(k, 1); }
    s.on = false; s.x = s.t; s.v = 0; s.apply(s.t);
  }

  /* ---- figures ---- */
  function num(el, v, fmt, now) {
    if (!el) { return; }
    fmt = fmt || euro;
    var s = el._pbN;
    if (!s) {
      /* written only when the words change: a figure that has stopped
         moving costs nothing, and nothing watching the page hears it */
      s = el._pbN = spring(function (x) { var t = s.fmt(x); if (t !== s.shown) { s.shown = t; el.textContent = t; } }, v, 0.04);
      s.shown = el.textContent;
    }
    s.fmt = fmt;
    s.t = v;
    if (now || !motion()) { land(s); return; }   // asked to be there at once: no roll
    if (Math.round(s.x) === Math.round(v) && !s.on) { s.x = v; s.apply(v); return; }
    go(s, 0);
  }

  /* ---- bars, and the marks on them ---- */
  function glide(el, prop, key, pct) {
    if (!el) { return; }
    var s = el[key];
    if (!s) {
      var was = parseFloat(el.style[prop]);
      s = el[key] = spring(function (x) { var t = Math.max(0, x).toFixed(3) + '%'; if (t !== s.shown) { s.shown = t; el.style[prop] = t; } }, isFinite(was) ? was : pct, 0.02);
      s.shown = el.style[prop];
    }
    s.t = pct;
    if (s.held) { return; }                     // waiting for its first view
    if (!motion()) { land(s); return; }
    go(s, 0);
  }
  function width(el, pct) { glide(el, 'width', '_pbW', pct); }
  function left(el, pct) { glide(el, 'left', '_pbL', pct); }
  /* the order the money arrives, for a staggered fill */
  var ORDER = { you: 0, rev: 1, emp: 1, extra: 1, state: 2 };
  function fillFrom(parts, base, step) {
    parts.forEach(function (el) {
      var s = el._pbW;
      if (!s) { return; }
      s.held = false;
      go(s, base + (ORDER[el.getAttribute('data-part')] || 0) * step);
    });
  }
  /* parts drawn empty and kept off the clock until fillFrom() lets them go */
  function hold(parts) {
    parts.forEach(function (el) {
      if (!el._pbW) { width(el, parseFloat(el.style.width) || 0); }
      var s = el._pbW, k = live.indexOf(s);
      if (k >= 0) { live.splice(k, 1); }
      s.on = false; s.held = true; s.x = 0; s.v = 0; s.apply(0);
    });
  }

  /* the bars in box wait, empty, until it is seen: fully, or 300ms after any part of it */
  function arm(box) {
    if (!box || !motion() || !window.IntersectionObserver) { return; }
    var parts = [].slice.call(box.querySelectorAll('.cmp-s'));
    if (!parts.length) { return; }
    hold(parts);
    var t = 0, done = false;
    function release() {
      if (done) { return; }
      done = true; clearTimeout(t); io.disconnect();
      fillFrom(parts, 60, 110);
    }
    var io = new IntersectionObserver(function (es) {
      var e = es[es.length - 1];
      if (!e.isIntersecting) { clearTimeout(t); return; }
      if (e.intersectionRatio >= 0.5) { release(); } else { clearTimeout(t); t = setTimeout(release, 300); }
    }, { threshold: [0, 0.5] });
    io.observe(box);
    box._pbRelease = release;
  }

  /* ---- a block that opens into its space ---- */
  function open(wrap, on) {
    if (!wrap) { return; }
    var st = wrap._pbO || (wrap._pbO = { on: !wrap.hidden, t: 0 });
    if (st.on === on) { return; }
    st.on = on;
    clearTimeout(st.t);
    if (!motion()) {
      wrap.hidden = !on;
      wrap.classList.toggle('cmp-in', on);
      wrap.classList.toggle('cmp-open', on);
      return;
    }
    if (on) {
      var parts = [].slice.call(wrap.querySelectorAll('.cmp-s'));
      wrap.classList.remove('cmp-open', 'cmp-in');
      wrap.hidden = false;
      hold(parts);
      void wrap.offsetHeight;                   // laid out closed, once
      wrap.classList.add('cmp-in');
      fillFrom(parts, 140, 120);
      st.t = setTimeout(function () { wrap.classList.add('cmp-open'); }, 640);
    } else {
      wrap.classList.remove('cmp-open', 'cmp-in');
      st.t = setTimeout(function () { wrap.hidden = true; }, 480);
    }
  }

  /* ---- things with no value: a gentle spring ---- */
  var SPRING = 'cubic-bezier(.16,1,.3,1)';
  try {
    if (window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')) {
      SPRING = 'linear(0, 0.0612, 0.1992, 0.3637, 0.5244, 0.6651, 0.7792, 0.8662, 0.9286, 0.9706, 0.9968, 1.0115, 1.0183, 1.0199, 1.0186, 1.0158, 1.0125, 1.0093, 1.0066, 1.0043, 1.0026, 1.0014, 1.0006, 1, 1)';
    }
  } catch (e) {}
  function pop(el) {
    if (!el || !motion() || !el.animate) { return; }
    el.animate([{ transform: 'scale(.82)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: SPRING });
  }
  /* a mark the reader just went past, acknowledged: a small lift and back */
  function nudge(el) {
    if (!el || !motion() || !el.animate) { return; }
    el.animate([{ transform: 'none' }, { transform: 'translateY(-3px) scale(1.06)', offset: 0.35 }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)' });
  }
  function swap(el) {
    if (!el || !motion() || !el.animate) { return; }
    el.animate([{ opacity: 0.25, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: SPRING });
  }

  /* motion turned off mid-visit: everything lands where it ends, at once */
  document.addEventListener('pb:motion', function (e) {
    if (e.detail && e.detail.motion) { return; }
    live.slice().forEach(land);
    [].forEach.call(document.querySelectorAll('.cmp-s'), function (el) {
      if (el._pbW) { el._pbW.held = false; land(el._pbW); }
    });
    [].forEach.call(document.querySelectorAll('.cmp-best-w'), function (w) {
      if (w._pbO) { clearTimeout(w._pbO.t); w.hidden = !w._pbO.on; w.classList.toggle('cmp-in', w._pbO.on); w.classList.toggle('cmp-open', w._pbO.on); }
    });
  });

  window.PBCmpMotion = { num: num, width: width, left: left, arm: arm, open: open, pop: pop, nudge: nudge, swap: swap };
}());
