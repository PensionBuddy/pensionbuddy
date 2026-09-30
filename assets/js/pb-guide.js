/*
  The long guides: "On this page", kept in reach, and how far through you are
  (Run 37, item 6).

  Each long guide carries its own "On this page" list in its markup, straight
  after its introduction: links to its sections, which is all a reader
  without JavaScript needs. Once that list has scrolled away, this script
  keeps a slim bar at the top of the screen, under the nav when the nav is
  showing: a button naming the section being read, which opens the same list,
  and along its bottom edge a line as long as the share of the guide read so
  far. The bar is a copy for sighted readers of what the page already says,
  so it is no landmark; its button and links are ordinary controls.

    - the button opens and closes the list; Escape, a press elsewhere, or
      following a link closes it
    - the section being read is the last one whose heading has passed a line
      40% down the screen
    - the progress line follows the scroll one to one: nothing eases, nothing
      is held back, and a reader who asks for less motion gets the same line
    - the page's own scroll is never touched; the list's links are plain
      anchors
    - nothing is stored

  Loads at the foot of the six guides (tests/build.test.py check 38 lists
  them); returns quietly without a .pb-toc.
*/
(function () {
  'use strict';
  var toc = document.querySelector('.pb-toc');
  var nav = document.getElementById('nav');
  var main = document.getElementById('main');
  if (!toc || !main || !('IntersectionObserver' in window)) { return; }
  var links = [].slice.call(toc.querySelectorAll('a[href^="#"]'));
  var heads = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  if (!links.length || heads.some(function (h) { return !h; })) { return; }

  function el(tag, cls) { var e = document.createElement(tag); if (cls) { e.className = cls; } return e; }

  var bar = el('div', 'pb-tocbar');
  var btn = el('button', 'pb-tocbar-btn');
  var k = el('span', 'pb-tocbar-k');
  var now = el('span', 'pb-tocbar-now');
  var chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  var list = toc.querySelector('ol').cloneNode(true);
  var prog = el('span', 'pb-tocbar-prog');
  bar.hidden = true;
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'pbTocbarList');
  k.appendChild(document.createTextNode((toc.querySelector('.pb-toc-h') || {}).textContent || ''));
  chev.setAttribute('viewBox', '0 0 24 24');
  chev.setAttribute('aria-hidden', 'true');
  chev.setAttribute('class', 'pb-tocbar-chev');
  chev.innerHTML = '<polyline points="6 9 12 15 18 9"/>';
  btn.appendChild(k);
  btn.appendChild(now);
  btn.appendChild(chev);
  list.id = 'pbTocbarList';
  list.className = 'pb-tocbar-list';
  list.hidden = true;
  prog.setAttribute('aria-hidden', 'true');
  bar.appendChild(btn);
  bar.appendChild(list);
  bar.appendChild(prog);
  document.body.appendChild(bar);

  function shut() { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function () {
    var open = list.hidden;
    list.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
  list.addEventListener('click', function (e) { if (e.target.closest('a')) { shut(); } });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && !list.hidden) { shut(); btn.focus(); }
  });
  document.addEventListener('pointerdown', function (e) { if (!list.hidden && !bar.contains(e.target)) { shut(); } }, true);

  /* shown once the list in the page has gone above the top of the screen */
  var past = false;
  new IntersectionObserver(function (es) {
    es.forEach(function (e) { past = !e.isIntersecting && e.boundingClientRect.top < 0; });
    bar.hidden = !past;
    document.documentElement.classList.toggle('pb-tocbar-on', past);
    if (!past) { shut(); }
    frame();
  }).observe(toc);

  var raf = 0;
  function frame() {
    raf = 0;
    var top = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
    bar.style.transform = 'translateY(' + Math.round(top) + 'px)';
    var r = main.getBoundingClientRect(), span = r.height - window.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    prog.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    var line = window.innerHeight * 0.4, cur = 0, i;
    for (i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top <= line) { cur = i; } }
    if (now.textContent !== links[cur].textContent) { now.textContent = links[cur].textContent; }
    [].forEach.call(list.querySelectorAll('a'), function (a, j) {
      if (j === cur) { a.setAttribute('aria-current', 'location'); } else { a.removeAttribute('aria-current'); }
    });
  }
  function later() { if (!raf) { raf = requestAnimationFrame(frame); } }
  window.addEventListener('scroll', later, { passive: true });
  window.addEventListener('resize', later);
  /* the nav slides away and back by a class; follow it while it moves */
  if (nav && window.MutationObserver) {
    new MutationObserver(function () {
      var until = Date.now() + 450;
      (function follow() { frame(); if (Date.now() < until) { requestAnimationFrame(follow); } }());
    }).observe(nav, { attributes: true, attributeFilter: ['class'] });
  }
  frame();
}());
