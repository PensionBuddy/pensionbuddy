/* The directors' rules, "Four questions", alive (9 October 2026, Damian's
   brief). A module of the director-rules record in tools/pagebuild.py; it
   watches the page's own form and never answers anything.

   - Each answer pops as you pick it, with a puff of paws.
   - A counter under the questions fills a segment for every question
     answered.
   - The topics worth talking through deal in one after another, like
     cards. "Topics to discuss, not advice." stays exactly where it is.

   With motion turned off none of this is added. */
(function () {
  'use strict';
  var root = document.documentElement, form = document.getElementById('drForm'), out = document.getElementById('drOut'), list = document.getElementById('drList');
  if (!form || !out || !list || !root.classList.contains('pb-motion')) { return; }
  var sets = [].slice.call(form.querySelectorAll('fieldset.dr-q'));
  var bar = document.createElement('div'); bar.className = 'pb-dr-tally'; bar.setAttribute('aria-hidden', 'true');
  sets.forEach(function () { bar.appendChild(document.createElement('i')); });
  var label = document.createElement('span'); bar.appendChild(label);
  form.insertBefore(bar, document.getElementById('drErr') || form.lastElementChild);
  function tally() {
    var on = sets.filter(function (f) { return f.querySelector('input:checked'); }).length;
    [].forEach.call(bar.querySelectorAll('i'), function (s, i) { s.classList.toggle('pb-on', i < on); });
    label.textContent = on + ' of ' + sets.length + ' answered';
  }
  form.addEventListener('change', function (e) {
    var lab = e.target.closest && e.target.closest('.dr-opt');
    if (lab) {
      lab.classList.remove('pb-dr-pick'); void lab.offsetWidth; lab.classList.add('pb-dr-pick');
      var r = lab.getBoundingClientRect();
      if (window.PBAlive) { window.PBAlive.puff(r.left + 20, r.top + r.height / 2, 4, 2.2, 200); }
    }
    tally();
  });
  tally();
  /* the topics deal in, each time the list is written */
  function deal() {
    if (out.hidden || !list.children.length) { return; }
    list.classList.remove('pb-dr-deal'); void list.offsetWidth;
    [].forEach.call(list.children, function (li, i) { li.style.animationDelay = (i * 120) + 'ms'; });
    list.classList.add('pb-dr-deal');
    var r = list.getBoundingClientRect();
    if (window.PBAlive && r.height) { window.PBAlive.puff(r.left + 30, r.top + 16, 8, 2.6, 300); }
  }
  new MutationObserver(deal).observe(out, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(deal).observe(list, { childList: true });
}());
