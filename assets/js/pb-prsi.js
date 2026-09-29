/* PRSI on additional income, by date, in one place (Run 32; the
   assets/js/pb-deadline.js pattern: one dated table, read by every page that
   states the rate).

   RATES is the employee rate on additional income from the day each rate
   came in: 4.2% from 1 October 2025, 4.35% from 1 October 2026 (Department of
   Social Protection, PRSI Contribution Rates and User Guide 2026, SW14). Add
   the next step here when it is announced; nothing else changes. A date
   before the first entry takes the first entry's rate. Each change starts at
   local midnight, as new Date(2026, 9, 1) did in the two scripts this
   replaces.

   Each rate carries its percentage as written ('4.35%'), because the scripts
   this replaces formatted it with Math.round(rate * 1000) / 10, which turns
   0.0435 into '4.4%'.

   Read by director.html (the "€1,000 of profit, two ways" line) and
   director-calculator.html (the rate itself, and the key under "Taken as
   salary"). Their markup carries the LATEST rate here, so a reader without
   JavaScript sees the rate that applies from its date: tests/build.test.py
   check 17 holds the markup to this table.

   PBPrsi.at(date)   { rate: 0.0435, pct: '4.35%', from: Date, said: '1 October 2026' }
   PBPrsi.latest()   the last entry, in the same shape

   THE TWO SENTENCES (Run 36). The director calculator also says the rate in
   words: under "Taken as salary" (#pbPrsiSalary) and in its assumptions
   (#pbPrsiAssume), 40% income tax and 8% USC plus PRSI. Before, those words
   were fixed ("up to 52.2% ..., or 52.35% from 1 October 2026"), which reads
   backwards from that date. Now:
   PBPrsi.lines(date)  the two sentences as they stand on that date: the
                       rate then, and the next rise if one is coming
   PBPrsi.statics()    what the markup carries, for a reader without
                       JavaScript: true on any date (the latest rate, from its
                       date, and the one before it until then);
                       tests/build.test.py check 17 holds the markup to it
   PBPrsi.write(doc, date)  puts lines(date) into the two elements, if the
                       page has them; this file calls it with today's date as
                       it loads, so the page script does nothing new */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PBPrsi = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* from: [year, month counted from 0, day] */
  var RATES = [
    { from: [2025, 9, 1], rate: 0.042, pct: '4.2%', said: '1 October 2025' },
    { from: [2026, 9, 1], rate: 0.0435, pct: '4.35%', said: '1 October 2026' }
  ];

  function shape(r) {
    return { rate: r.rate, pct: r.pct, from: new Date(r.from[0], r.from[1], r.from[2]), said: r.said };
  }

  function at(now) {
    var cur = RATES[0];
    for (var i = 1; i < RATES.length; i++) {
      var r = RATES[i];
      if (now >= new Date(r.from[0], r.from[1], r.from[2])) cur = r;
    }
    return shape(cur);
  }

  function latest() { return shape(RATES[RATES.length - 1]); }

  /* 40% income tax and 8% USC with the PRSI rate, in hundredths, so 4.35%
     gives '52.35%' and never '52.349999999999994%' */
  function total(r) { return (Math.round((0.48 + r.rate) * 10000) / 100) + '%'; }
  var WHAT = 'in income tax, the Universal Social Charge (USC) and Pay-Related Social Insurance (PRSI)';

  function lines(now) {
    var cur = at(now), next = null;
    for (var i = 0; i < RATES.length && !next; i++) {
      var r = RATES[i];
      if (new Date(r.from[0], r.from[1], r.from[2]) > now) next = shape(r);
    }
    return {
      salary: 'lands in your pocket after up to ' + total(cur) + ' ' + WHAT +
        (next ? ', or ' + total(next) + ' from ' + next.said : ''),
      assume: 'The salary comparison assumes a higher-rate taxpayer facing up to ' + total(cur) +
        ' on additional income (40% income tax, 8% USC, ' + cur.pct + ' PRSI)' +
        (next ? ', and ' + total(next) + ' from ' + next.said + ', when PRSI rises to ' + next.pct : '') +
        '. Your rate may differ.'
    };
  }

  function statics() {
    var last = latest(), prev = RATES.length > 1 ? shape(RATES[RATES.length - 2]) : null;
    return {
      salary: 'lands in your pocket after up to ' + total(last) + ' ' + WHAT + ', the rate from ' + last.said +
        (prev ? ' (' + total(prev) + ' before then)' : ''),
      assume: 'The salary comparison assumes a higher-rate taxpayer facing up to ' + total(last) +
        ' on additional income from ' + last.said + ' (40% income tax, 8% USC, ' + last.pct + ' PRSI)' +
        (prev ? ', and ' + total(prev) + ' before then, with PRSI at ' + prev.pct : '') + '. Your rate may differ.'
    };
  }

  var IDS = { salary: 'pbPrsiSalary', assume: 'pbPrsiAssume' };
  function write(doc, now) {
    var L = lines(now);
    for (var k in IDS) {
      var el = doc && doc.getElementById ? doc.getElementById(IDS[k]) : null;
      if (el) el.textContent = L[k];
    }
  }

  if (typeof document !== 'undefined') write(document, new Date());

  return { RATES: RATES, at: at, latest: latest, lines: lines, statics: statics, write: write };
}));
