/* The director's year-end checklist, its three tools (12 October 2026,
   Damian's brief: "up to date, interactive, simple").

   The two deadlines (#ckWhen). Pick the company's year end (twelve month
   radios, December to begin with, as the ring on director.html) and two
   cards say how long is left:
     Company payments   the last day of the month picked, this year, or next
                        year once it has passed (the ring and the year-end
                        reminder work it out the same way). A company
                        payment counts in the accounting period it is paid.
     Your own payments  Revenue's date, from assets/js/pb-deadline.js
                        (PBDeadline.at): 18 November 2026 through the
                        Revenue Online Service for the 2025 tax year, 31
                        October 2026 otherwise. Once a date passes, the
                        words move on with it, as the site's countdown does.
   Above the cards, a line from today to a year from today: a month mark at
   the start of each month, and a pin for each deadline, ink for the
   company, teal for you. Pressing or dragging along the line picks the
   nearest month end, as the radios do (the line is a picture: the radios
   are the control for the keyboard and screen readers).

   The age-related limit (#ckAge). Six bars, one for each band of Revenue's
   percentages (assets/js/pension-tax-relief.js, PBRelief.reliefBand); a
   press says the band and what it allows on earnings at the cap
   (PBRelief.reliefLimit at PBRelief.EARN_CAP).

   The threshold's path (#ckSft): the bar for this year in ink.

   Motion (only with html.pb-motion): the month thumb glides; the line draws
   itself from today the first time it is seen, the month marks ripple in,
   the pins drop onto it and the days fade in (their words are final from
   the start); a new month end slides the company's pin and the days count
   on from where they were; the bars rise once, in order. Without JavaScript the cards read as written: the
   company's "before the company's year end", Revenue's dates in full.
   Nothing is stored or sent. */
(function () {
  'use strict';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAY = 864e5;
  function $(id) { return document.getElementById(id); }
  function all(sel, el) { return [].slice.call((el || document).querySelectorAll(sel)); }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function motion() { return !!(window.PBMotion && window.PBMotion.on()); }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function longDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function shortDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); }
  function daysTo(d) { return Math.round((midnight(d) - today()) / DAY); }
  function fill(key, html) { all('[data-ck="' + key + '"]').forEach(function (e) { e.innerHTML = html; }); }
  function euro(n) { return '€' + Math.round(n).toLocaleString('en-IE'); }
  /* mid is a frame of the count: never "today" on the way up */
  function dayWords(n, mid) { return n === 0 && !mid ? '<b>Today</b> is the last day' : '<b>' + n + '</b> ' + (n === 1 ? 'day' : 'days') + ' left'; }
  /* first sight: the next frame if it is on screen now, else when 30% of it is */
  function seen(el, go) {
    if (!('IntersectionObserver' in window)) { go(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); requestAnimationFrame(function () { requestAnimationFrame(go); }); } });
    }, { threshold: 0.3 });
    io.observe(el);
  }
  /* a number counting from where it was to where it is going */
  function counter(el) {
    var shown = null, raf = 0;
    return function (n, words) {
      cancelAnimationFrame(raf);
      if (shown === null || !motion() || n === shown) { shown = n; el.innerHTML = words(n); return; }
      var from = shown, t0 = performance.now(), dur = 480;
      (function step(now) {
        var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3), v = Math.round(from + (n - from) * e);
        el.innerHTML = words(v, k < 1); shown = v;
        if (k < 1) { raf = requestAnimationFrame(step); }
      }(t0));
    };
  }

  /* ------------------------------------------------- the two deadlines -- */
  (function () {
    var when = $('ckWhen'), ye = $('ckYe'), line = $('ckLine');
    if (!when || !ye || !line) { return; }
    var radios = all('input[name="ck_ye"]', ye), months = ye.querySelector('.ck-months');
    var coDate = when.querySelector('[data-ck="coDate"]'), say = $('ckSay');
    var coDays = counter(when.querySelector('[data-ck="coDays"]')), youDays = counter(when.querySelector('[data-ck="youDays"]'));
    var t0 = today(), t1 = new Date(t0.getFullYear() + 1, t0.getMonth(), t0.getDate());

    /* the company's year end, by month (1 to 12) */
    function yearEnd(m) { var d = new Date(t0.getFullYear(), m, 0); if (d < t0) { d = new Date(t0.getFullYear() + 1, m, 0); } return d; }
    function picked() { for (var i = 0; i < radios.length; i++) { if (radios[i].checked) { return +radios[i].value; } } return 12; }

    /* Revenue's date, and the words that go with it */
    function revenue() {
      var D = window.PBDeadline;
      if (!D) { return null; }
      var d = D.at(new Date()), on = midnight(d.target), oct = new Date(d.year, 9, 31);
      var ros = 'If you pay and file through the Revenue Online Service (ROS).';
      return {
        date: on, taxYear: d.taxYear,
        alt: d.ros ? ros + (d.octPassed ? ' 31 October ' + d.year + ' has passed.' : ' Otherwise 31 October ' + d.year + '.')
                   : 'Through the Revenue Online Service (ROS) it is usually later, in mid-November.',
        by: d.ros ? (d.octPassed ? longDate(on) + ' if you pay and file through ROS; 31 October has passed'
                                 : longDate(oct) + ', or by ' + longDate(on) + ' if you pay and file through ROS')
                  : longDate(on) + ', or usually later, in mid-November, if you pay and file through ROS'
      };
    }
    var tax = revenue();
    if (tax) {
      fill('taxYear', '' + tax.taxYear);
      fill('youDate', longDate(tax.date));
      fill('youAlt', tax.alt);
      fill('taxBy', tax.by);
    }

    /* the line: built once, laid out on every resize */
    line.innerHTML = '<span class="ck-l-track"></span><span class="ck-l-now"></span><span class="ck-l-nowt">Today</span>' +
      '<span class="ck-l-pin ck-l-you"><i class="ck-l-stem"></i><i class="ck-l-dot"></i><b class="ck-l-lab"></b></span>' +
      '<span class="ck-l-pin ck-l-co"><i class="ck-l-stem"></i><i class="ck-l-dot"></i><b class="ck-l-lab"></b></span>';
    var marks = [], m0 = new Date(t0.getFullYear(), t0.getMonth() + 1, 1);
    for (var i = 0; i < 13; i++) {
      var s = new Date(m0.getFullYear(), m0.getMonth() + i, 1);
      if (s >= t1) { break; }
      var tick = document.createElement('span'), lab = document.createElement('span');
      tick.className = 'ck-l-tick'; lab.className = 'ck-l-m'; lab.textContent = MONTHS[s.getMonth()].charAt(0);
      tick.style.setProperty('--i', i); lab.style.setProperty('--i', i);
      line.appendChild(tick); line.appendChild(lab);
      marks.push({ at: s, tick: tick, lab: lab });
    }
    var pinCo = line.querySelector('.ck-l-co'), pinYou = line.querySelector('.ck-l-you');
    pinYou.style.setProperty('--d', '120ms'); pinCo.style.setProperty('--d', '240ms');
    var W = 0;
    function xOf(d) { return clamp((midnight(d) - t0) / (t1 - t0), 0, 1) * W; }
    function place(pin, d, other) {
      var x = Math.round(xOf(d)), lab = pin.querySelector('.ck-l-lab'), lw = lab.offsetWidth || 54;
      lab.textContent = shortDate(d);
      lw = lab.offsetWidth || lw;
      /* the label hangs right of its stem, or left near the end of the line,
         or away from the other pin's stem when that would cross it */
      var flip = x + lw > W - 2;
      if (other !== null && !flip && other >= x - 4 && other <= x + lw + 6 && x - lw >= 0) { flip = true; }
      pin.classList.toggle('ck-flip', flip);
      pin.style.transform = 'translateX(' + x + 'px)';
      return x;
    }
    function layout() {
      W = line.clientWidth;
      if (!W) { return; }
      marks.forEach(function (mk) {
        var a = xOf(mk.at), b = xOf(new Date(mk.at.getFullYear(), mk.at.getMonth() + 1, 1)), mid = (a + b) / 2;
        mk.tick.style.left = a.toFixed(1) + 'px';
        mk.lab.style.left = mid.toFixed(1) + 'px';
        /* no letter under "Today" or past the end of the line */
        mk.lab.hidden = mid < 44 || mid > W - 5;
      });
      var xc = place(pinCo, yearEnd(picked()), null);
      if (tax) { place(pinYou, tax.date, xc); } else { pinYou.hidden = true; }
    }

    /* the thumb behind the month picked */
    var thumb = document.createElement('span');
    thumb.className = 'ck-thumb'; thumb.setAttribute('aria-hidden', 'true');
    months.insertBefore(thumb, months.firstChild);
    function slide() {
      var r = radios[picked() - 1], sp = r && r.nextElementSibling;
      if (!sp || !sp.offsetWidth) { return; }
      var lab = r.parentNode, to = 'translate(' + lab.offsetLeft + 'px,' + lab.offsetTop + 'px)';
      /* the picked month keeps its own dark tile, and gives it up to the
         thumb only while the thumb glides to it */
      if (to !== thumb.style.transform && thumb.classList.contains('ck-go') && motion()) {
        months.classList.add('ck-sliding');
        clearTimeout(slideT); slideT = setTimeout(function () { months.classList.remove('ck-sliding'); }, 700);
      }
      thumb.style.width = sp.offsetWidth + 'px'; thumb.style.height = sp.offsetHeight + 'px';
      thumb.style.transform = to;
    }
    var slideT = 0;
    thumb.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'transform') { clearTimeout(slideT); months.classList.remove('ck-sliding'); }
    });

    var last = null;
    function update(byHand) {
      var m = picked(), d = yearEnd(m), n = daysTo(d);
      if (coDate) {
        var was = coDate.textContent;
        coDate.textContent = longDate(d);
        if (byHand && was !== coDate.textContent && motion()) { coDate.classList.remove('ck-swap'); void coDate.offsetWidth; coDate.classList.add('ck-swap'); }
      }
      coDays(n, dayWords);
      layout(); slide();
      if (byHand && last !== m) {
        if (motion()) { pinCo.classList.remove('ck-land'); void pinCo.offsetWidth; pinCo.classList.add('ck-land'); }
        if (say) { say.textContent = 'Company payments by ' + longDate(d) + ': ' + n + (n === 1 ? ' day' : ' days') + ' left.'; }
      }
      last = m;
    }

    radios.forEach(function (r) { r.addEventListener('change', function () { update(true); }); });

    /* pressing or dragging along the line picks the nearest month end */
    /* a mouse picks at once; a finger picks on a tap, or once it moves
       sideways, so a scroll that starts on the line changes nothing */
    var drag = false, touch = null;
    function pick(e) {
      var b = line.getBoundingClientRect(), x = clamp(e.clientX - b.left, 0, b.width), best = 12, bd = 1e9;
      for (var m = 1; m <= 12; m++) { var dd = Math.abs(xOf(yearEnd(m)) - x); if (dd < bd) { bd = dd; best = m; } }
      if (best !== picked()) { radios[best - 1].checked = true; update(true); }
    }
    line.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) { return; }
      if (e.pointerType === 'touch') { touch = { x: e.clientX, y: e.clientY }; return; }
      drag = true; try { line.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
      pick(e);
    });
    line.addEventListener('pointermove', function (e) {
      if (touch && !drag && Math.abs(e.clientX - touch.x) > 8 && Math.abs(e.clientX - touch.x) > Math.abs(e.clientY - touch.y)) {
        drag = true; try { line.setPointerCapture(e.pointerId); } catch (er) { /* fine */ }
      }
      if (drag) { pick(e); }
    });
    line.addEventListener('pointerup', function (e) { if (touch && !drag) { pick(e); } drag = false; touch = null; });
    function stop() { drag = false; touch = null; }
    line.addEventListener('pointercancel', stop);
    line.addEventListener('lostpointercapture', function () { drag = false; });

    ye.hidden = false; line.hidden = false;
    months.classList.add('ck-thumbed');
    if (motion()) { when.classList.add('ck-arm'); }
    /* the words are final from the start (a count at load would leave the
       page's text different from one moment to the next); the days fade in
       as the line draws, and count only when the reader picks a month */
    update(false);
    if (tax) { youDays(daysTo(tax.date), dayWords); }
    if (motion()) {
      seen(when, function () {
        when.classList.add('ck-in');
        setTimeout(function () { pinCo.classList.add('ck-glide'); thumb.classList.add('ck-go'); }, 200);
      });
    } else { pinCo.classList.add('ck-glide'); thumb.classList.add('ck-go'); }
    var rt = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      pinCo.classList.remove('ck-glide'); thumb.classList.remove('ck-go');
      layout(); slide();
      rt = setTimeout(function () { pinCo.classList.add('ck-glide'); thumb.classList.add('ck-go'); }, 120);
    });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { layout(); slide(); }); }
  }());

  /* ------------------------------------------- the age-related limit -- */
  (function () {
    var box = $('ckAge'), out = $('ckAgeOut'), R = window.PBRelief;
    if (!box || !out || !R) { return; }
    var bars = all('.ck-bar', box);
    bars.forEach(function (b, i) {
      b.querySelector('i').style.setProperty('--i', i);
      b.querySelector('b').style.setProperty('--i', i);
      b.addEventListener('click', function () {
        var age = +b.getAttribute('data-age'), pct = Math.round(R.reliefBand(age) * 100);
        bars.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        out.innerHTML = '<b>' + b.getAttribute('aria-label').split(':')[0] + ':</b> up to ' + pct + '% of earnings, at most ' +
          euro(R.reliefLimit(age, R.EARN_CAP)) + ' a year.';
        if (motion()) { out.classList.remove('ck-swap'); void out.offsetWidth; out.classList.add('ck-swap'); }
      });
    });
    if (motion()) { box.classList.add('ck-arm'); }
    box.hidden = false;
    if (motion()) { seen(box, function () { box.classList.add('ck-in'); }); }
  }());

  /* ------------------------------------------- the threshold's path -- */
  (function () {
    var box = $('ckSft');
    if (!box) { return; }
    var y = new Date().getFullYear();
    all('[data-year]', box).forEach(function (c, i) {
      c.classList.toggle('ck-now', +c.getAttribute('data-year') === y);
      c.querySelector('i').style.setProperty('--i', i);
      c.querySelector('b').style.setProperty('--i', i);
    });
    if (motion()) { box.classList.add('ck-arm'); seen(box, function () { box.classList.add('ck-in'); }); }
  }());
}());
