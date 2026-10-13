/* The director's year-end checklist, its ticks (12 October 2026, Damian's
   brief: calm, clear motion; it replaces the 9 October trail and its walking
   paw).

   - Every box is drawn by hand. Ticked, it pops once, its tick draws itself
     and the item's heading gets a soft marker sweep.
   - Each group's heading carries a dot for each of its checks, in the
     group's colour (ink for company payments, teal for your own): ticking
     fills the next dot. A group done gets a ring round its dots.
   - All nine ticked: a line under the list says so.

   The checkboxes stay real checkboxes (keyboard, screen reader and print
   behave as before); nothing is stored or sent. The boxes and dots are
   drawn with or without motion; with motion off nothing moves. The dates,
   the age bars and the threshold's path are assets/js/pb-ck-tools.js. */
(function () {
  'use strict';
  var pages = [].slice.call(document.querySelectorAll('.legal.ck'));
  var lists = [].slice.call(document.querySelectorAll('.legal.ck .ck-list'));
  if (!lists.length) { return; }
  function motion() { return !!(window.PBMotion && window.PBMotion.on()); }
  function boxesIn(el) { return [].slice.call(el.querySelectorAll('input[type=checkbox]')); }
  var all = [];
  lists.forEach(function (ul) { all = all.concat(boxesIn(ul)); });
  if (!all.length) { return; }
  pages.forEach(function (p) { p.classList.add('pb-ck'); });
  var done = document.getElementById('ckDone');

  /* the hand-drawn box after each checkbox */
  all.forEach(function (inp) {
    var s = document.createElement('span'); s.className = 'pb-ck-box'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 26 26"><rect x="1.5" y="1.5" width="23" height="23" rx="7"/><path d="M7 13.6l4.2 4.2 8-9"/></svg>';
    inp.parentNode.insertBefore(s, inp.nextSibling);
  });

  /* each group: its heading, its dots, its boxes */
  var groups = lists.map(function (ul) {
    var h = ul.previousElementSibling, boxes = boxesIn(ul), dots = null;
    if (h && h.classList.contains('ck-h')) {
      dots = document.createElement('span'); dots.className = 'ck-dots'; dots.setAttribute('aria-hidden', 'true');
      boxes.forEach(function () { dots.appendChild(document.createElement('i')); });
      h.appendChild(dots);
    }
    return { h: h, dots: dots ? [].slice.call(dots.children) : [], boxes: boxes };
  });

  function count(boxes) { return boxes.filter(function (b) { return b.checked; }).length; }
  function paint(g, popAt) {
    var k = count(g.boxes);
    g.dots.forEach(function (d, i) {
      var on = i < k;
      d.classList.toggle('on', on);
      if (i === popAt && motion()) { d.classList.remove('ck-pop'); void d.offsetWidth; d.classList.add('ck-pop'); }
    });
    if (g.h) { g.h.classList.toggle('ck-all', k === g.boxes.length); }
  }
  groups.forEach(function (g) {
    paint(g, -1);
    g.boxes.forEach(function (inp) {
      inp.addEventListener('change', function () {
        var box = inp.nextSibling;
        if (inp.checked && motion()) { box.classList.remove('pb-ck-pop'); void box.offsetWidth; box.classList.add('pb-ck-pop'); }
        paint(g, inp.checked ? count(g.boxes) - 1 : -1);
        var every = count(all) === all.length;
        if (done) { done.textContent = every ? 'All ' + (all.length === 9 ? 'nine' : all.length) + ' checked.' : ''; }
      });
    });
  });
}());
