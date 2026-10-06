/* "Show in today's money", on every calculator that projects a pot.

   A page that projects a figure into the future calls, from its own script:

     PBToday.card(afterEl)          puts the card after afterEl, once: the
                                    switch (on by default), the ECB line, and
                                    the line on cash in a bank account
     PBToday.set(id, value, years)  under the figure #id, "€X in today's
                                    money": value / 1.02^years
     PBToday.cash(years)            the cash line for that many years
     PBToday.on()                   is the switch on
     PBToday.onChange(fn)           fn() each time it is switched

   The rates come from assets/js/pb-assumptions.js (PBAssume), which must load
   first. Nothing is stored and nothing is sent. The card sits inside the
   calculator, so assets/js/pb-after.js leaves it out of "your move" and of
   the figures it sends (.pb-today in its NOT list).

   Words, the ECB's and ours: information only. It never says what to do
   with money. Classic script. */
(function () {
  'use strict';
  var A = window.PBAssume;
  if (!A) { return; }
  var doc = document, box = null, sw = null, fns = [];

  function euro(v) { return '€' + Math.round(v).toLocaleString('en-IE'); }
  function on() { return !sw || sw.checked; }

  function card(after) {
    if (box || !after || !after.parentNode) { return box; }
    box = doc.createElement('div');
    box.className = 'pb-today';
    box.id = 'pbToday';
    box.innerHTML =
      '<label class="pb-today-sw"><input type="checkbox" id="pbTodayOn" checked> <span>Show in today’s money</span></label>' +
      '<p class="pb-today-note">The ECB aims for inflation of about ' + A.inflation.pct + ' a year. ' +
      'Money that grows slower than prices buys less over time.</p>' +
      '<p class="pb-today-cash" id="pbTodayCash"></p>';
    after.parentNode.insertBefore(box, after.nextSibling);
    sw = doc.getElementById('pbTodayOn');
    sw.addEventListener('change', function () {
      [].forEach.call(doc.querySelectorAll('.pb-today-v'), function (el) { el.hidden = !on(); });
      fns.forEach(function (f) { f(); });
    });
    return box;
  }

  function line(id) {
    var fig = doc.getElementById(id);
    if (!fig) { return null; }
    var el = doc.getElementById(id + 'Today');
    if (!el) {
      el = doc.createElement('div');
      el.className = 'pb-today-v';
      el.id = id + 'Today';
      fig.parentNode.insertBefore(el, fig.nextSibling);
    }
    return el;
  }

  function set(id, value, years) {
    var el = line(id);
    if (!el) { return; }
    el.textContent = euro(A.today(value, years)) + ' in today’s money';
    el.hidden = !on();
  }

  function cash(years) {
    var el = doc.getElementById('pbTodayCash');
    if (!el) { return; }
    var y = Math.max(1, Math.round(years));
    var kept = 10000 * Math.pow(1 + A.cash.rate, y);
    el.textContent = 'For comparison: money in a bank account you can take out at any time earned about ' + A.cash.pct +
      ' a year in ' + A.cash.month + ' (Central Bank of Ireland). With prices rising ' + A.inflation.pct + ' a year, €10,000 kept there for ' +
      y + (y === 1 ? ' year' : ' years') + ' would buy about what ' + euro(A.today(kept, y)) + ' buys today.';
  }

  window.PBToday = { card: card, set: set, cash: cash, on: on, onChange: function (f) { fns.push(f); } };
}());
