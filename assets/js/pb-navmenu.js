/* The calculators, from the nav (Mercury's menu with a line per item).

   Built here, at runtime, so the nav's markup stays exactly the one
   tools/pagebuild.py guards and tools/sync-chrome.py copies: without script,
   "Calculator" is the plain link it always was. From 1201px, where the nav
   is a row rather than the phone drawer, hovering or focusing "Calculator"
   opens a panel under it naming the calculators, each with one line in its
   own page's words (six since Run 20 added the charges calculator). It takes no width in the row. Escape closes it and
   returns focus to the link; leaving both closes it. */
(function () {
  'use strict';
  var links = document.getElementById('navLinks');
  var calc = links && links.querySelector('a.lnk[href="pension-calculator.html"]');
  if (!calc || !window.matchMedia) return;
  var wide = window.matchMedia('(min-width: 1201px)');
  var TOOLS = [
    ['pension-calculator.html', 'Pension calculator', 'See what your pension could pay you, including what Revenue adds back through tax relief.'],
    ['director-calculator.html', 'Director calculator', 'If you run a company: what it could contribute, and the corporation tax that could save.'],
    ['pension-fees-calculator.html', 'Pension charges calculator', 'What your plan\u2019s charges take out of your pot by retirement.'],
    ['broker-vs-autoenrolment.html', 'Auto-enrolment comparison', 'Auto-enrolment against a personal pension, for your own salary and age.'],
    ['state-pension-reality-check.html', 'State Pension reality check', 'What the State Pension leaves you to find.'],
    ['state-pension-entitlement.html', 'State Pension entitlement check', 'What the State Pension would actually pay you.']
  ];
  var here = String(location.pathname || '').split('/').pop() || 'index.html';
  var panel = document.createElement('div');
  panel.className = 'pb-navmenu';
  panel.id = 'pbNavMenu';
  panel.hidden = true;
  TOOLS.forEach(function (t) {
    var a = document.createElement('a');
    a.href = t[0];
    if (t[0] === here) a.setAttribute('aria-current', 'page');
    var b = document.createElement('b'); b.textContent = t[1];
    var s = document.createElement('span'); s.textContent = t[2];
    a.appendChild(b); a.appendChild(s);
    panel.appendChild(a);
  });
  calc.parentNode.insertBefore(panel, calc.nextSibling);
  var timer = 0;
  function place() {
    panel.style.left = calc.offsetLeft + 'px';
    panel.style.top = (calc.offsetTop + calc.offsetHeight) + 'px';
  }
  function open() {
    if (!wide.matches) return;
    clearTimeout(timer);
    place();
    panel.hidden = false;
  }
  function closeSoon() { clearTimeout(timer); timer = setTimeout(function () { panel.hidden = true; }, 180); }
  function inside(el) { return el && (el === calc || panel.contains(el)); }
  calc.addEventListener('mouseenter', open);
  calc.addEventListener('focus', open);
  panel.addEventListener('mouseenter', open);
  calc.addEventListener('mouseleave', closeSoon);
  panel.addEventListener('mouseleave', closeSoon);
  [calc, panel].forEach(function (el) {
    el.addEventListener('focusout', function (e) { if (!inside(e.relatedTarget)) closeSoon(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) {
      var back = panel.contains(document.activeElement);
      panel.hidden = true;
      if (back) calc.focus();
    }
  });
  function onChange() { if (!wide.matches) panel.hidden = true; }
  if (wide.addEventListener) wide.addEventListener('change', onChange); else if (wide.addListener) wide.addListener(onChange);
})();
