/* The nav's dropdowns (Run 28): Directors, Tools, State Pension, Guides.

   Each is a disclosure, not an ARIA menu: a <button aria-expanded
   aria-controls> and the list of ordinary links it shows, so a screen reader
   announces "Directors, collapsed, button" and then a list of links, and Tab
   moves through them like any other links. The markup is the nav that
   tools/pagebuild.py guards and tools/sync-chrome.py copies; nothing is built
   here. Without this script the NAV block of CSS opens a panel on hover and on
   keyboard focus, so every page is still reachable.

   With it:
   - a click, a tap, Enter or Space opens or closes a panel; opening one
     closes the others;
   - on the row (from 1301px) with a mouse, hovering opens a panel and leaving
     closes it after a short grace; a click on a panel that hovering opened
     keeps it open rather than closing it under the pointer;
   - Escape closes the open panel and puts focus back on its button; the
     drawer's own Escape then closes the drawer;
   - ArrowDown on a button opens it and moves to the first link; ArrowUp and
     ArrowDown move within a panel;
   - a click outside, Tab leaving a panel on the row, the header hiding on
     scroll, or a change between row and drawer closes whatever is open.
   In the drawer (1300px and below) the same buttons open their lists in
   place, and Tab leaving one leaves it open. */
(function () {
  'use strict';
  var links = document.getElementById('navLinks');
  if (!links || !document.querySelectorAll) return;
  var dds = [].slice.call(links.querySelectorAll('.nav-dd'));
  if (!dds.length) return;
  links.classList.add('dd-js');

  var mm = window.matchMedia ? function (q) { return window.matchMedia(q); } : function () { return { matches: false }; };
  var row = mm('(min-width: 1301px)');
  var mouse = mm('(hover: hover) and (pointer: fine)');
  var timer = 0, hovered = null;

  function btn(dd) { return dd.querySelector('.nav-dd-btn'); }
  function items(dd) { return [].slice.call(dd.querySelectorAll('.nav-dd-panel a')); }
  function isOpen(dd) { return btn(dd).getAttribute('aria-expanded') === 'true'; }
  function set(dd, open) {
    btn(dd).setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open && hovered === dd) hovered = null;
  }
  function closeAll(except) { dds.forEach(function (d) { if (d !== except) set(d, false); }); }
  function open(dd) { clearTimeout(timer); closeAll(dd); set(dd, true); }
  function hoverable() { return row.matches && mouse.matches; }

  dds.forEach(function (dd) {
    var b = btn(dd);
    b.addEventListener('click', function () {
      clearTimeout(timer);
      if (isOpen(dd) && hovered === dd) { hovered = null; return; }
      if (isOpen(dd)) set(dd, false); else open(dd);
    });
    dd.addEventListener('mouseenter', function () {
      if (!hoverable()) return;
      clearTimeout(timer);
      if (!isOpen(dd)) { open(dd); hovered = dd; }
    });
    dd.addEventListener('mouseleave', function () {
      if (!hoverable() || hovered !== dd) return;
      clearTimeout(timer);
      timer = setTimeout(function () { set(dd, false); }, 220);
    });
    dd.addEventListener('focusout', function (e) {
      if (row.matches && isOpen(dd) && !dd.contains(e.relatedTarget)) set(dd, false);
    });
    dd.addEventListener('keydown', function (e) {
      var list = items(dd), at = list.indexOf(document.activeElement);
      if (e.key === 'Escape' && isOpen(dd)) {
        set(dd, false);
        b.focus();
        e.stopPropagation();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!list.length) return;
        e.preventDefault();
        if (!isOpen(dd)) open(dd);
        if (e.key === 'ArrowDown') list[at < 0 ? 0 : Math.min(at + 1, list.length - 1)].focus();
        else if (at > 0) list[at - 1].focus();
        else b.focus();
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!links.contains(e.target)) closeAll();
  });
  var nav = document.getElementById('nav');
  if (nav) window.addEventListener('scroll', function () {
    if (nav.classList.contains('nav-hidden')) closeAll();
  }, { passive: true });
  function onChange() { closeAll(); }
  if (row.addEventListener) row.addEventListener('change', onChange);
  else if (row.addListener) row.addListener(onChange);
})();
